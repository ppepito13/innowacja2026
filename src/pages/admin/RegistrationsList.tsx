import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import {
  LuDownload,
  LuSearch,
  LuCircleCheck,
  LuClock,
  LuCircleX,
  LuEye,
  LuPencil,
  LuEllipsis,
  LuX,
  LuBan,
  LuTrash2
} from 'react-icons/lu';
import { useAuth } from '../../auth/AuthProvider';
import { parseService, createPointer } from '../../services/parseService';
import { Registration, Event } from '../../types/types';
import { formatDate, formatColumnName, formatCellValue } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import parseClient from '../../services/parseClient';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import '../../components/BulkActionBar.css';

const EVENT_CLASS = 'TestEvent';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';
type SortField = string;
type SortDir = 'asc' | 'desc';
type BulkAction = 'approved' | 'rejected' | 'deleted';

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: string;
  sortField: string;
  sortDir: SortDir;
}) {
  return (
    <span className="ml-1 text-xs opacity-50">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↑↓'}
    </span>
  );
}

export default function RegistrationsList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const history = useHistory();
  const { eventId: eventIdParam } = useParams<{ eventId?: string }>();

  // ── Events ──────────────────────────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // ── Registrations ────────────────────────────────────────────────────
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // ── Pagination ───────────────────────────────────────────────────────
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // ── Table ────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [openedActionId, setOpenedActionId] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<{ action: BulkAction; count: number } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Single delete ────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!openedActionId) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-action-menu]')) {
        setOpenedActionId(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [openedActionId]);

  // ── Load events ──────────────────────────────────────────────────────
  useEffect(() => {
    setEventsLoading(true);
    const where =
      user?.role === 'Organizer'
        ? { organizer: createPointer('_User', user.objectId) }
        : {};

    parseService
      .query<Event>(EVENT_CLASS, where)
      .then((data) => {
        setEvents(data);
        if (eventIdParam) {
          setSelectedEventId(eventIdParam);
        } else if (data.length > 0) {
          setSelectedEventId(data[0].objectId ?? '');
        }
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setEventsLoading(false));
  }, [user, eventIdParam]);

  // ── Load registrations when event changes ────────────────────────────
  useEffect(() => {
    if (!selectedEventId) {
      setRegistrations([]);
      setSelectedEvent(null);
      return;
    }

    setRegistrationsLoading(true);
    setError(null);
    setPage(1);

    type EventWithAcl = Event & { ACL?: Record<string, { read?: boolean; write?: boolean }> };

    Promise.all([
      parseClient
        .get<EventWithAcl>(`/classes/${EVENT_CLASS}/${selectedEventId}`, {
          headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY },
        })
        .then(({ data }) => data),
      parseService.query<Registration>('Registration', {
        event: createPointer(EVENT_CLASS, selectedEventId),
      }),
    ])
      .then(([eventWithAcl, regs]) => {
        setSelectedEvent({ ...eventWithAcl, ACL: eventWithAcl.ACL ?? {} });
        setRegistrations(regs);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setRegistrationsLoading(false));
  }, [selectedEventId]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedEventId, search, statusFilter]);

  // ── Columns (derived from formConfig) ────────────────────────────────
  const columns = useMemo(() => {
    const keys = Object.keys(selectedEvent?.formConfig ?? {});
    return ['createdAt', ...keys, 'status'] as string[];
  }, [selectedEvent]);

  const getCellValue = (reg: Registration, col: string): string => {
    if (col === 'createdAt') return formatDate(reg.createdAt);
    if (col === 'status') return reg.status;
    const v = reg.formData?.[col];
    return v !== undefined ? String(v) : 'N/A';
  };

  // ── Filter + sort ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return registrations.filter((reg) => {
      const searchable = [
        reg.status,
        formatDate(reg.createdAt),
        ...Object.values(reg.formData ?? {}),
      ];
      const matchesSearch = searchable.some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase()),
      );
      const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'createdAt') {
        return (a.createdAt > b.createdAt ? 1 : -1) * dir;
      }
      if (sortField === 'status') {
        return a.status.localeCompare(b.status) * dir;
      }
      const aVal = String(a.formData?.[sortField] ?? '');
      const bVal = String(b.formData?.[sortField] ?? '');
      return aVal.localeCompare(bVal) * dir;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // ── Helpers ───────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const canExport = () => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (!selectedEvent || !user.objectId) return false;
    return (
      (!!selectedEvent.organizer?.objectId && selectedEvent.organizer.objectId === user.objectId) ||
      selectedEvent.ACL?.[user.objectId]?.read === true
    );
  }

  const exportCSV = () => {
    if (registrations.length === 0) return;
    const header = columns.map((c) => formatColumnName(c));
    const rows = registrations.map((reg) =>
      columns.map((col) => {
        const val = getCellValue(reg, col);
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }),
    );
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${selectedEvent?.title ?? selectedEventId}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    if (registrations.length === 0) return;
    const XLSX = await import('xlsx');
    const wsData = [
      columns.map((c) => formatColumnName(c)),
      ...registrations.map((reg) => columns.map((col) => getCellValue(reg, col))),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
    XLSX.writeFile(
      wb,
      `registrations-${selectedEvent?.title ?? selectedEventId}-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`,
    );
  };

  const updateStatus = async (registrationId: string, status: Registration['status']) => {
    try {
      await parseService.update<Registration>('Registration', registrationId, { status });
      setRegistrations((prev) =>
        prev.map((r) => (r.objectId === registrationId ? { ...r, status } : r)),
      );
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Error';
      setError(msg);
    } finally {
      setOpenedActionId(null);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      await parseService.remove('Registration', deleteConfirmId);
      setRegistrations((prev) => prev.filter((r) => r.objectId !== deleteConfirmId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteConfirmId);
        return next;
      });
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Error';
      setError(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmId(null);
      setOpenedActionId(null);
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const selectableIds = paginated.map((r) => r.objectId);
      if (selectableIds.length === 0) return prev;
      const allSelected = selectableIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginated]);

  const handleBulkAction = async () => {
    if (!bulkConfirm) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      if (bulkConfirm.action === 'deleted') {
        await parseService.batchDelete('Registration', ids);
        setRegistrations((prev) => prev.filter((r) => !selectedIds.has(r.objectId)));
      } else {
        const status: Registration['status'] = bulkConfirm.action;
        const updates = ids.map((id) => ({ objectId: id, payload: { status } }));
        await parseService.batchUpdate<Registration>('Registration', updates);
        setRegistrations((prev) =>
          prev.map((r) => (selectedIds.has(r.objectId) ? { ...r, status } : r)),
        );
      }
      setSelectedIds(new Set());
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Error';
      setError(msg);
    } finally {
      setBulkLoading(false);
      setBulkConfirm(null);
    }
  };

  const selectableOnPage = paginated;
  const allOnPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((r) => selectedIds.has(r.objectId));

  const renderStatusBadge = (status: Registration['status']) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:border-green-700/60 dark:bg-green-900/50 dark:text-green-300">
        <Icon icon={LuCircleCheck} size={13} />
          {t('registrationsList.status.approved')}
      </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:border-red-700/60 dark:bg-red-900/50 dark:text-red-300">
        <Icon icon={LuCircleX} size={13} />
          {t('registrationsList.status.rejected')}
      </span>
      );
    }
    if (status === 'cancelled') { // NOWE
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:bg-slate-800/50 dark:text-slate-400">
        <Icon icon={LuBan} size={13} />
          {t('registrationsList.status.cancelled')}
      </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/50 dark:text-amber-300">
      <Icon icon={LuClock} size={13} />
        {t('registrationsList.status.pending')}
    </span>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="box-border grid w-full min-w-0 max-w-full grid-cols-1 gap-6 [&_*]:box-border">
      {/* Header card */}
      <div className="flex w-full min-w-0 flex-col rounded-2xl border border-primary/10 bg-surface px-4 sm:px-8 py-4 sm:py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-0">{t('registrationsList.title')}</h1>
        <p className="text-sm sm:text-base text-primary/75 mt-1">{t('registrationsList.description')}</p>
      </div>

      {/* Main card */}
      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-primary/10 bg-surface px-4 sm:px-8 py-4 sm:py-5">

        {/* Top controls row */}
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">

          {/* Event selector */}
          <div className="min-w-0 flex-1">
            {eventsLoading ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-primary/5" />
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  history.push(`/admin/registrations/${e.target.value}`);
                }}
                className="h-10 w-full !min-w-0 rounded-lg border border-primary/20 bg-surface px-3 text-sm text-primary outline-none focus:border-primary sm:max-w-xs"
              >
                {events.length === 0 && (
                  <option value="">{t('registrationsList.noEvents')}</option>
                )}
                {events.map((ev) => (
                  <option key={ev.objectId} value={ev.objectId}>
                    {ev.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Export buttons */}
          {canExport() && (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={exportCSV}
                disabled={registrations.length === 0}
                className="flex h-10 items-center gap-2 rounded-lg border border-primary/20 bg-surface px-3 text-sm font-semibold text-primary transition hover:bg-background cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon icon={LuDownload} size={14} />
                CSV
              </button>
              <button
                onClick={exportExcel}
                disabled={registrations.length === 0}
                className="flex h-10 items-center gap-2 rounded-lg border border-primary/20 bg-surface px-3 text-sm font-semibold text-primary transition hover:bg-background cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon icon={LuDownload} size={14} />
                Excel
              </button>
            </div>
          )}
        </div>

        {/* Filters row */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center">
          {/* Search */}
          <div className="relative h-10 min-w-0">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
              <Icon icon={LuSearch} size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('registrationsList.filters.search')}
              className="!h-10 w-full !min-w-0 rounded-lg border border-primary/20 bg-surface pl-9 pr-3 text-sm text-primary placeholder-primary/40 outline-none focus:border-primary"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="!h-10 w-full !min-w-0 rounded-lg border border-primary/20 bg-surface px-3 text-sm text-primary outline-none focus:border-primary"
          >
            <option value="all">{t('registrationsList.filters.allStatuses')}</option>
            <option value="pending">{t('registrationsList.filters.pending')}</option>
            <option value="approved">{t('registrationsList.filters.approved')}</option>
            <option value="rejected">{t('registrationsList.filters.rejected')}</option>
            <option value="cancelled">{t('registrationsList.filters.cancelled')}</option> {/* NOWE */}
          </select>
        </div>

        {/* Results count */}
        {!registrationsLoading && selectedEventId && (
          <p className="text-xs text-primary/60">
            {t('registrationsList.found', { count: filtered.length })}
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-900/20 border border-red-500/20 px-4 py-2 text-sm text-red-500">{error}</p>
        )}

        {/* Loading */}
        {registrationsLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-primary/60">{t('registrationsList.loading')}...</span>
          </div>
        )}

        {/* No event selected */}
        {!registrationsLoading && !selectedEventId && !eventsLoading && (
          <div className="flex items-center justify-center rounded-xl border border-primary/10 py-12">
            <span className="text-sm text-primary/60">{t('registrationsList.selectEvent')}</span>
          </div>
        )}

        {/* Table */}
        {!registrationsLoading && selectedEventId && (
          <>
            {paginated.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-primary/10 py-12">
                <span className="text-sm text-primary/60">
                  {t('registrationsList.noRegistrations')}
                </span>
              </div>
            ) : (
              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-primary/10">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-primary/10 bg-primary/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-primary/70">
                      <th className="w-10 px-3 sm:px-4 py-3">
                        <input
                          type="checkbox"
                          className="bulk-checkbox disabled:cursor-not-allowed"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAll}
                          disabled={selectableOnPage.length === 0}
                        />
                      </th>
                      <th
                        className="cursor-pointer whitespace-nowrap px-3 sm:px-4 py-3 hover:text-primary"
                        onClick={() => handleSort('createdAt')}
                      >
                        {t('registrationsList.columns.date')}
                        <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
                      </th>
                      {Object.keys(selectedEvent?.formConfig ?? {}).map((col) => (
                        <th
                          key={col}
                          className="cursor-pointer whitespace-nowrap px-3 sm:px-4 py-3 hover:text-primary"
                          onClick={() => handleSort(col)}
                        >
                          {formatColumnName(col)}
                          <SortIcon field={col} sortField={sortField} sortDir={sortDir} />
                        </th>
                      ))}
                      <th
                        className="cursor-pointer whitespace-nowrap px-3 sm:px-4 py-3 hover:text-primary"
                        onClick={() => handleSort('status')}
                      >
                        {t('registrationsList.columns.status')}
                        <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="whitespace-nowrap px-3 sm:px-4 py-3 text-center">
                        {t('registrationsList.columns.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((reg, idx) => (
                      <tr
                        key={reg.objectId}
                        className={`border-b border-primary/10 text-primary transition hover:bg-primary/[0.03] ${
                          idx % 2 === 0 ? '' : 'bg-primary/[0.01]'
                        }`}
                      >
                        <td className="px-3 sm:px-4 py-3">
                          <input
                            type="checkbox"
                            className="bulk-checkbox disabled:cursor-not-allowed"
                            checked={selectedIds.has(reg.objectId)}
                            onChange={() => toggleSelect(reg.objectId)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-4 py-3 text-xs text-primary/70">
                          {formatDate(reg.createdAt)}
                        </td>
                        {Object.keys(selectedEvent?.formConfig ?? {}).map((col) => (
                          <td key={col} className="px-3 sm:px-4 py-3">
                            {formatCellValue(String(reg.formData?.[col] ?? 'N/A'), t)}
                          </td>
                        ))}
                        <td className="px-3 sm:px-4 py-3">{renderStatusBadge(reg.status)}</td>
                        <td className="px-3 sm:px-4 py-3">
                          <div
                            className="relative flex items-center justify-center gap-1.5"
                            data-action-menu={openedActionId === reg.objectId ? '' : undefined}
                          >
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-surface text-primary/70 transition hover:bg-background hover:text-primary active:scale-95 cursor-pointer"
                              onClick={() => setSelectedRegistration(reg)}
                            >
                              <Icon icon={LuEye} size={14} />
                            </button>

                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-surface text-primary/70 transition hover:bg-background hover:text-primary active:scale-95 cursor-pointer"
                              onClick={() =>
                                history.push(
                                  `/admin/registrations/${selectedEventId}/${reg.objectId}/edit`,
                                )
                              }
                            >
                              <Icon icon={LuPencil} size={14} />
                            </button>

                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-surface text-primary/70 transition hover:bg-background hover:text-primary active:scale-95 cursor-pointer"
                              onClick={() =>
                                setOpenedActionId((id) =>
                                  id === reg.objectId ? null : reg.objectId,
                                )
                              }
                            >
                              <Icon icon={LuEllipsis} size={14} />
                            </button>

                            {openedActionId === reg.objectId && (
                              <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-primary/15 bg-surface shadow-xl overflow-hidden">
                                {reg.status !== 'approved' && (
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 bg-transparent text-xs text-primary/80 hover:bg-background cursor-pointer"
                                    onClick={() => updateStatus(reg.objectId, 'approved')}
                                  >
                                    <Icon icon={LuCircleCheck} size={13} />
                                    {t('registrationsList.approve')}
                                  </button>
                                )}
                                {reg.status !== 'rejected' && (
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 bg-transparent text-xs text-primary/80 hover:bg-background cursor-pointer"
                                    onClick={() => updateStatus(reg.objectId, 'rejected')}
                                  >
                                    <Icon icon={LuCircleX} size={13} />
                                    {t('registrationsList.reject')}
                                  </button>
                                )}
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 bg-transparent text-xs text-red-500 hover:bg-red-900/10 cursor-pointer"
                                  onClick={() => setDeleteConfirmId(reg.objectId)}
                                >
                                  <Icon icon={LuTrash2} size={13} />
                                  {t('registrationsList.delete')}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              labels={{
                rowsPerPage: t('dashboard.rowsPerPage'),
                pageText: (
                  <>
                    {t('registrationsList.pagination.current')} {page}{' '}
                    {t('registrationsList.pagination.total')} {totalPages}
                  </>
                ),
              }}
            />
          </>
        )}
      </div>

      {/* Details modal */}
      {selectedRegistration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedRegistration(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-primary/15 bg-surface px-6 py-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">
                {t('registrationsList.details.title')}
              </h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 text-primary/60 hover:text-primary hover:bg-background"
                onClick={() => setSelectedRegistration(null)}
              >
                <Icon icon={LuX} size={14} />
              </button>
            </div>
            <div className="space-y-2 text-sm text-primary/80 max-h-[70vh] overflow-y-auto">
              <div className="flex gap-2">
                <span className="font-semibold text-primary/60">
                  {t('registrationsList.details.status')}:
                </span>
                {renderStatusBadge(selectedRegistration.status)}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-primary/60">
                  {t('registrationsList.details.date')}:
                </span>
                {formatDate(selectedRegistration.createdAt)}
              </div>
              {Object.entries(selectedRegistration.formData ?? {}).map(([key, value]) => (
                <div key={key} className="flex gap-2 break-all">
                  <span className="font-semibold text-primary/60">{formatColumnName(key)}:</span>
                  <span>{formatCellValue(String(value), t)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="bulk-action-bar">
          <span className="bulk-action-bar__count">
            {t('registrationsList.bulk.selected', { count: selectedIds.size })}
          </span>
          <button
            className="bulk-action-bar__btn bulk-action-bar__btn--approve"
            onClick={() => setBulkConfirm({ action: 'approved', count: selectedIds.size })}
          >
            <Icon icon={LuCircleCheck} size={14} />
            {t('registrationsList.bulk.approve')}
          </button>
          <button
            className="bulk-action-bar__btn bulk-action-bar__btn--reject"
            onClick={() => setBulkConfirm({ action: 'rejected', count: selectedIds.size })}
          >
            <Icon icon={LuCircleX} size={14} />
            {t('registrationsList.bulk.reject')}
          </button>
          <button
            className="bulk-action-bar__btn bulk-action-bar__btn--delete"
            onClick={() => setBulkConfirm({ action: 'deleted', count: selectedIds.size })}
          >
            <Icon icon={LuTrash2} size={14} />
            {t('registrationsList.bulk.delete')}
          </button>
        </div>
      )}

      {bulkConfirm && (
        <div className="bulk-confirm-overlay" onClick={() => !bulkLoading && setBulkConfirm(null)}>
          <div className="bulk-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bulk-confirm-modal__title">
              {bulkConfirm.action === 'approved'
                ? t('registrationsList.bulk.approve')
                : bulkConfirm.action === 'rejected'
                ? t('registrationsList.bulk.reject')
                : t('registrationsList.bulk.delete')}
            </h3>
            <p className="bulk-confirm-modal__message">
              {bulkConfirm.action === 'approved'
                ? t('registrationsList.bulk.confirmApprove', { count: bulkConfirm.count })
                : bulkConfirm.action === 'rejected'
                ? t('registrationsList.bulk.confirmReject', { count: bulkConfirm.count })
                : t('registrationsList.bulk.confirmDelete', { count: bulkConfirm.count })}
            </p>
            <div className="bulk-confirm-modal__actions">
              <button
                className="bulk-confirm-modal__btn bulk-confirm-modal__btn--cancel"
                onClick={() => setBulkConfirm(null)}
                disabled={bulkLoading}
              >
                {t('registrationsList.bulk.cancel')}
              </button>
              <button
                className="bulk-confirm-modal__btn bulk-confirm-modal__btn--confirm"
                onClick={handleBulkAction}
                disabled={bulkLoading}
              >
                {bulkLoading ? '...' : t('registrationsList.bulk.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="bulk-confirm-overlay" onClick={() => !deleteLoading && setDeleteConfirmId(null)}>
          <div className="bulk-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bulk-confirm-modal__title">{t('registrationsList.delete')}</h3>
            <p className="bulk-confirm-modal__message">
              {t('registrationsList.confirmDeleteSingle')}
            </p>
            <div className="bulk-confirm-modal__actions">
              <button
                className="bulk-confirm-modal__btn bulk-confirm-modal__btn--cancel"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
              >
                {t('registrationsList.bulk.cancel')}
              </button>
              <button
                className="bulk-confirm-modal__btn bulk-confirm-modal__btn--confirm"
                onClick={handleDeleteSingle}
                disabled={deleteLoading}
              >
                {deleteLoading ? '...' : t('registrationsList.bulk.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
