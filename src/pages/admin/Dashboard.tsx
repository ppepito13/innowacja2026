import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import {
  LuPlus,
  LuPencil,
  LuLink,
  LuTrash2,
  LuUsers,
  LuQrCode,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from 'react-icons/lu';
import { parseService } from '../../services/parseService';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigateOrOpen } from '../../hooks/useNavigateOrOpen';
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
  const navigate = useNavigateOrOpen();
  const { user } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<
    'isActive' | 'title' | 'startDate' | 'location' | null
  >(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const handleSort = (field: 'isActive' | 'title' | 'startDate' | 'location') => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: 'isActive' | 'title' | 'startDate' | 'location' }) => (
    <span className="text-xs ml-1">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↑↓'}
    </span>
  );

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

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'isActive') {
      return ((a.isActive ? 1 : 0) - (b.isActive ? 1 : 0)) * dir;
    }
    if (sortField === 'title') {
      return (a.title ?? '').localeCompare(b.title ?? '') * dir;
    }
    if (sortField === 'startDate') {
      const aIso = a.startDate?.iso ?? a.startDate?.date?.toISOString() ?? '';
      const bIso = b.startDate?.iso ?? b.startDate?.date?.toISOString() ?? '';
      return aIso.localeCompare(bIso) * dir;
    }
    if (sortField === 'location') {
      return (a.location ?? '').localeCompare(b.location ?? '') * dir;
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handlePageChange = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  const handleDelete = (event: Event) => {
    if (!window.confirm(t('dashboard.deleteConfirm', { title: event.title }))) return;
    parseService
      .remove(EVENT_CLASS, event.objectId!)
      .then(() => setEvents((prev) => prev.filter((e) => e.objectId !== event.objectId)))
      .catch((e: any) => setError(e.message));
  };

  const handleToggleActive = (event: Event) => {
    // Zmień natychmiast w UI
    setEvents((prev) =>
      prev.map((e) => (e.objectId === event.objectId ? { ...e, isActive: !e.isActive } : e)),
    );

    // Wyślij do serwera, przy błędzie cofnij
    parseService
      .update<Event>(EVENT_CLASS, event.objectId!, { isActive: !event.isActive })
      .catch((e: any) => {
        setError(e.message);
        setEvents((prev) =>
          prev.map((e) => (e.objectId === event.objectId ? { ...e, isActive: event.isActive } : e)),
        );
      });
  };

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-4xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="text-3xl mb-0">{t('dashboard.title')}</h1>
          <p className="text-lg mt-0 text-primary/75">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={() => history.push('/admin/events/new')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-brand bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none"
        >
          <Icon icon={LuPlus} />
          <span>{t('dashboard.addEvent')}</span>
        </button>
      </div>

      {/* SUBHEADER */}
      <div>
        <h2 className="text-xl mb-0">{t('dashboard.allEvents')}</h2>
        <p className="text-sm mt-0 text-primary/75">{t('dashboard.allEventsDescription')}</p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t('dashboard.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(1);
          }}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">{t('dashboard.filter.all')}</option>
          <option value="active">{t('dashboard.filter.active')}</option>
          <option value="inactive">{t('dashboard.filter.inactive')}</option>
        </select>
        <span className="ml-auto text-sm text-primary/70">
          {t('dashboard.found', { count: sorted.length })}
        </span>
      </div>

      {/* ERROR */}
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {/* TABLE */}
      {loading ? (
        <p className="text-primary/70 text-sm">{t('dashboard.loading')}</p>
      ) : (
        <div className="overflow-x-auto w-full -mx-0">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-primary/10 text-left">
                <th
                  className="pb-3 font-medium text-primary/70 w-28 cursor-pointer select-none"
                  onClick={() => handleSort('isActive')}
                >
                  {t('dashboard.col.active')} <SortIcon field="isActive" />
                </th>
                <th
                  className="pb-3 font-medium text-primary/70 cursor-pointer select-none"
                  onClick={() => handleSort('title')}
                >
                  {t('dashboard.col.name')} <SortIcon field="title" />
                </th>
                <th
                  className="pb-3 font-medium text-primary/70 w-32 cursor-pointer select-none"
                  onClick={() => handleSort('startDate')}
                >
                  {t('dashboard.col.date')} <SortIcon field="startDate" />
                </th>
                <th
                  className="pb-3 font-medium text-primary/70 cursor-pointer select-none"
                  onClick={() => handleSort('location')}
                >
                  {t('dashboard.col.location')} <SortIcon field="location" />
                </th>
                <th className="pb-3 font-medium text-primary/70">{t('dashboard.col.actions')}</th>
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
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${event.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-primary">{event.title ?? '—'}</p>
                  </td>
                  <td className="py-3 text-primary/70">{formatDate(event.startDate)}</td>
                  <td className="py-3 text-primary/70">
                    {event.eventFormat === 'virtual'
                      ? t('dashboard.virtual')
                      : event.location || t('dashboard.onSite')}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => navigate(`/admin/events/${event.objectId}/edit`, e)}
                        className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/60 hover:text-primary cursor-pointer border-none bg-transparent"
                        title={t('dashboard.editEvent')}
                      >
                        <Icon icon={LuPencil} />
                      </button>
                      <button
                        onClick={(e) => navigate(`/admin/registrations/${event.objectId}`, e)}
                        className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/60 hover:text-primary cursor-pointer border-none bg-transparent"
                        title={t('dashboard.goToRegistrations')}
                      >
                        <Icon icon={LuUsers} />
                      </button>
                      <button
                        onClick={(e) => navigate(`/admin/check-in/${event.objectId}`, e)}
                        className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/60 hover:text-primary cursor-pointer border-none bg-transparent"
                        title={t('dashboard.goToCheckin')}
                      >
                        <Icon icon={LuQrCode} />
                      </button>
                      <button
                        onClick={(e) => navigate(`/events/${event.objectId}`, e)}
                        className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/60 hover:text-primary cursor-pointer border-none bg-transparent"
                        title={t('dashboard.viewPublicPage')}
                      >
                        <Icon icon={LuLink} />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-primary/60 hover:text-red-600 cursor-pointer border-none bg-transparent"
                        title={t('dashboard.deleteEvent')}
                      >
                        <Icon icon={LuTrash2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-primary/60">
                    {t('dashboard.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {!loading && !error && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2 text-sm text-primary/60">
            <span>{t('dashboard.rowsPerPage')}</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="border border-primary/20 rounded-lg px-2 py-1 text-sm text-primary bg-surface focus:outline-none"
            >
              {ROWS_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary/60">
            <span>
              {t('dashboard.page')} {page} {t('dashboard.of')} {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-primary/15 bg-surface-2 text-primary transition-colors hover:bg-primary/10 disabled:text-primary/35 disabled:cursor-not-allowed"
            >
              <Icon icon={LuChevronsLeft} size={14} />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-primary/15 bg-surface-2 text-primary transition-colors hover:bg-primary/10 disabled:text-primary/35 disabled:cursor-not-allowed"
            >
              <Icon icon={LuChevronLeft} size={14} />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-primary/15 bg-surface-2 text-primary transition-colors hover:bg-primary/10 disabled:text-primary/35 disabled:cursor-not-allowed"
            >
              <Icon icon={LuChevronRight} size={14} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-primary/15 bg-surface-2 text-primary transition-colors hover:bg-primary/10 disabled:text-primary/35 disabled:cursor-not-allowed"
            >
              <Icon icon={LuChevronsRight} size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="pb-4" />
    </div>
  );
}
