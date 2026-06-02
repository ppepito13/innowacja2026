import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { LuPlus, LuPencil, LuLink, LuEllipsis, LuChevronLeft, LuChevronRight, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu';
import { parseService } from '../../services/parseService';
import { useAuth } from '../../auth/AuthProvider';
import { Event, EventOrganizer } from '../../types/types';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon';
import { EVENT_CLASS } from '../../constants/eventDefaults';

const ROWS_OPTIONS = [10, 25, 50];

function formatDate(d: Event['startDate']): string {
  if (!d) return '—';
  const iso = d.iso ?? (d.date instanceof Date ? d.date.toISOString() : null);
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function Dashboard() {
  const { t } = useTranslation();
  const history = useHistory();
  const { user } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const isAdmin = user.role === 'Admin';

    const where = isAdmin
      ? {}
      : {
        organizer: {
          __type: 'Pointer',
          className: '_User',
          objectId: user.objectId,
        } as EventOrganizer,
      };

    parseService
      .query<Event>(EVENT_CLASS, where)
      .then(setEvents)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = events.filter((e) => {
    const matchesSearch = (e.title ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && e.isActive) ||
      (statusFilter === 'inactive' && !e.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handlePageChange = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  const handleToggleActive = (event: Event) => {
    // 1. Zmień natychmiast w UI
    setEvents((prev) =>
      prev.map((e) =>
        e.objectId === event.objectId ? { ...e, isActive: !e.isActive } : e
      )
    );

    // 2. Wyślij do serwera, przy błędzie cofnij
    parseService
      .update<Event>(EVENT_CLASS, event.objectId!, { isActive: !event.isActive })
      .catch((e: any) => {
        setError(e.message);
        // cofnij zmianę
        setEvents((prev) =>
          prev.map((e) =>
            e.objectId === event.objectId ? { ...e, isActive: event.isActive } : e
          )
        );
      });
  };

  return (
    <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-full max-w-4xl">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-3xl mb-0">{t('dashboard.title', 'Wydarzenia')}</h1>
          <p className="text-lg mt-0 text-primary/75">
            {t('dashboard.subtitle', 'Zarządzaj swoimi wydarzeniami i sprawdzaj ich status.')}
          </p>
        </div>
        <button
          onClick={() => history.push('/admin/events/new')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none"
        >
          <Icon icon={LuPlus} />
          <span>{t('dashboard.addEvent', 'Nowe wydarzenie')}</span>
        </button>
      </div>

      {/* SUBHEADER */}
      <div>
        <h2 className="text-xl mb-0">{t('dashboard.allEvents', 'Wszystkie wydarzenia')}</h2>
        <p className="text-sm mt-0 text-primary/75">
          {t('dashboard.allEventsDescription', 'Poniżej znajduje się lista wydarzeń, do których masz dostęp.')}
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t('dashboard.search', 'Szukaj wydarzeń...')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">{t('dashboard.filter.all', 'Wszystkie statusy')}</option>
          <option value="active">{t('dashboard.filter.active', 'Aktywne')}</option>
          <option value="inactive">{t('dashboard.filter.inactive', 'Nieaktywne')}</option>
        </select>
        <span className="ml-auto text-sm text-primary/50">
                    {t('dashboard.found', { count: filtered.length, defaultValue: `Znaleziono ${filtered.length} wydarzeń` })}
                </span>
      </div>

      {/* ERROR */}
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {/* TABLE */}
      {loading ? (
        <p className="text-primary/50 text-sm">{t('dashboard.loading', 'Ładowanie...')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
          <tr className="border-b border-primary/10 text-left">
            <th className="pb-3 font-medium text-primary/50 w-20">
              {t('dashboard.col.active', 'Aktywne')}
            </th>
            <th className="pb-3 font-medium text-primary/50">
              {t('dashboard.col.name', 'Nazwa wydarzenia')}
            </th>
            <th className="pb-3 font-medium text-primary/50 w-32">
              {t('dashboard.col.date', 'Data')}
            </th>
            <th className="pb-3 font-medium text-primary/50">
              {t('dashboard.col.location', 'Lokalizacja')}
            </th>
            <th className="pb-3 font-medium text-primary/50">
              {t('dashboard.col.actions', 'Akcje')}
            </th>
          </tr>
          </thead>
          <tbody>
          {paginated.map((event) => (
            <tr key={event.objectId} className="border-b border-primary/5 transition-colors">
              <td className="py-3">
                <button
                  onClick={() => handleToggleActive(event)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 border-none cursor-pointer flex-shrink-0 ${event.isActive ? 'bg-secondary' : 'bg-primary/20'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${event.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </td>
              <td className="py-3">
                <p className="font-medium text-primary">{event.title ?? '—'}</p>
              </td>
              <td className="py-3 text-primary/50">{formatDate(event.startDate)}</td>
              <td className="py-3 text-primary/50">
                {event.eventFormat === 'virtual'
                  ? t('dashboard.virtual', 'Wirtualne')
                  : event.location || t('dashboard.onSite', 'Stacjonarne')}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => history.push(`/admin/events/${event.objectId}/edit`)}
                    className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/40 hover:text-primary cursor-pointer border-none bg-transparent"
                  >
                    <Icon icon={LuPencil} />
                  </button>
                  <button
                    onClick={() => history.push(`/events/${event.objectId}`)}
                    className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/40 hover:text-primary cursor-pointer border-none bg-transparent"
                  >
                    <Icon icon={LuLink} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/40 hover:text-primary cursor-pointer border-none bg-transparent">
                    <Icon icon={LuEllipsis} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {paginated.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-primary/40">
                {t('dashboard.empty', 'Brak wydarzeń.')}
              </td>
            </tr>
          )}
          </tbody>
        </table>
      )}

      {/* PAGINATION */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2 text-sm text-primary/60">
            <span>{t('dashboard.rowsPerPage', 'Wierszy na stronę')}</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-primary/20 rounded-lg px-2 py-1 text-sm text-primary bg-white focus:outline-none"
            >
              {ROWS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary/60">
            <span>{t('dashboard.page', 'Strona')} {page} {t('dashboard.of', 'z')} {totalPages}</span>
            <button onClick={() => handlePageChange(1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded hover:bg-primary/10 disabled:opacity-30">
              <Icon icon={LuChevronsLeft} size={14} />
            </button>
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded hover:bg-primary/10 disabled:opacity-30">
              <Icon icon={LuChevronLeft} size={14} />
            </button>
            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded hover:bg-primary/10 disabled:opacity-30">
              <Icon icon={LuChevronRight} size={14} />
            </button>
            <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded hover:bg-primary/10 disabled:opacity-30">
              <Icon icon={LuChevronsRight} size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="pb-4" />
    </div>
  );
}
