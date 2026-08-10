import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router';
import {
  LuCircleCheck,
  LuChevronLeft,
  LuChevronRight,
  LuDownload,
  LuEye,
  LuEllipsis,
  LuPencil,
  LuX,
  LuCircleX,
  LuClock,
  LuUserCheck,
  LuUserX
} from 'react-icons/lu';
import { Button, InputDatepicker, InputTextfieldStateful, ComplexTable } from '@lsg/components';
import { useAuth } from '../../auth/AuthProvider';
import { NotificationService } from '../../services/notificationService';
import { parseService, createPointer } from '../../services/parseService';
import { useNavigateOrOpen } from '../../hooks/useNavigateOrOpen';
import { Registration, Event } from '../../types/types';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { formatDate, formatColumnName, formatCellValue } from '../../utils/formatters';
import { exportRegistrationsToCsv, ExportColumn } from '../../utils/export';
import { useTranslation } from 'react-i18next';

import { QRCodeSVG } from 'qrcode.react';

import Icon from '../../components/Icon';
import parseClient from '../../services/parseClient';

type RegistrationParams = { eventId: string };

const RowsPerPage = 8;
const ActionMenuWidth = 192; // odpowiednik klasy w-48
const ActionMenuHeight = 84; // przybliżona wysokość menu (2 pozycje)
const ActionMenuGap = 4;

type ActionMenuPosition = { top: number; left: number };

export default function Registrations() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { eventId } = useParams<RegistrationParams>();
  const navigate = useNavigateOrOpen();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [openedActionId, setOpenedActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuPosition | null>(null);
  const [page, setPage] = useState<number>(1);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrError, setQrError] = useState<boolean>(false);

  const closeActionMenu = useCallback(() => {
    setOpenedActionId(null);
    setActionMenuPosition(null);
  }, []);

  useEffect(() => {
    if (!openedActionId) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-action-menu]')) {
        closeActionMenu();
      }
    };

    // Menu jest pozycjonowane wzgledem viewportu, wiec kazde przewiniecie
    // (takze poziome, wewnatrz kontenera tabeli) rozjechaloby je z przyciskiem.
    // true w trzecim argumencie = faza przechwytywania, lapie tez scroll dzieci.
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('scroll', closeActionMenu, true);
    window.addEventListener('resize', closeActionMenu);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('scroll', closeActionMenu, true);
      window.removeEventListener('resize', closeActionMenu);
    };
  }, [openedActionId, closeActionMenu]);

  const toggleActionMenu = (objectId: string, trigger: HTMLElement) => {
    if (openedActionId === objectId) {
      closeActionMenu();
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const openUpwards = rect.bottom + ActionMenuHeight > window.innerHeight;

    setActionMenuPosition({
      top: openUpwards
          ? rect.top - ActionMenuHeight - ActionMenuGap
          : rect.bottom + ActionMenuGap,
      left: Math.max(
          8,
          Math.min(rect.right - ActionMenuWidth, window.innerWidth - ActionMenuWidth - 8),
      ),
    });
    setOpenedActionId(objectId);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      parseService.getById<Event>('TestEvent', eventId),
      parseClient
          .get(`/classes/TestEvent/${eventId}`, {
            headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY },
          })
          .then(
              ({ data }: { data: { ACL?: Record<string, { read?: boolean; write?: boolean }> } }) =>
                  data.ACL,
          ),
      parseService.query<Registration>('Registration', {
        event: createPointer('TestEvent', eventId),
      }),
    ])
        .then(([event, acl, registrations]) => {
          setEvent({ ...event, ACL: acl ?? {} });
          setRegistrations(registrations);
        })
        .catch((error) => setError(error.message))
        .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!selectedRegistration) {
      setQrToken(null);
      setQrError(false);
      return;
    }
    let cancelled = false;
    setQrToken(null);
    setQrError(false);
    parseService
        .runFunction<{ token: string }>('generateQrToken', {
          registrationId: selectedRegistration.objectId,
        })
        .then((res) => {
          if (!cancelled) setQrToken(res.token);
        })
        .catch(() => {
          if (!cancelled) setQrError(true);
        });
    return () => {
      cancelled = true;
    };
  }, [selectedRegistration]);

  useEscapeKey(
      () => setSelectedRegistration(null),
      selectedRegistration !== null);

  const columns = useMemo(() => {
    const formConfigKeys = Object.keys(event?.formConfig ?? {});

    return ['createdAt', ...formConfigKeys, 'status'];
  }, [event]);

  const getCellValue = (registration: Registration, column: string): string => {
    if (column === 'createdAt') {
      return formatDate(registration.createdAt);
    }

    if (column === 'status') {
      return '';
    }

    const value = registration.formData?.[column];

    return value !== undefined ? String(value) : 'N/A';
  };

  const getExportValue = (registration: Registration, column: string): string => {
    if (column === 'createdAt') {
      return formatDate(registration.createdAt);
    }

    if (column === 'status') {
      return registration.status;
    }

    const value = registration.formData?.[column];

    return value !== undefined ? String(value) : '';
  };

  const exportColumns: ExportColumn<Registration>[] = columns.map((column) => ({
    header: formatColumnName(column),
    getValue: (registration) => getExportValue(registration, column),
  }));

  const filtered = useMemo(() => {
    return registrations.filter((registration) => {
      const searchable = [
        registration.status,
        registration.createdAt,
        ...Object.values(registration.formData ?? {}),
      ];

      const matchesSearch = searchable.some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase()),
      );

      const registrationTimestamp = new Date(registration.createdAt).getTime();
      const fromTimestamp = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
      const toTimestamp = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

      const matchesDate =
          (!fromTimestamp || registrationTimestamp >= fromTimestamp) &&
          (!toTimestamp || registrationTimestamp <= toTimestamp);

      return matchesSearch && matchesDate;
    });
  }, [registrations, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / RowsPerPage));

  const paginated = useMemo(() => {
    const firstRegistration = (page - 1) * RowsPerPage;

    return filtered.slice(firstRegistration, firstRegistration + RowsPerPage);
  }, [filtered, page]);

  const renderStatus = (status: Registration['status']) => {
    switch (status) {
      case 'approved':
        return (
            <span className="text-success">
          <Icon icon={LuCircleCheck} size={14} />
        </span>
        );
      case 'pending':
        return (
            <span className="text-secondary">
          <Icon icon={LuClock} size={14} />
        </span>
        );
      case 'rejected':
        return (
            <span className="text-error">
          <Icon icon={LuCircleX} size={14} />
        </span>
        );
      case 'cancelled': // NOWE
        return (
            <span className="text-primary/40">
          <Icon icon={LuUserX} size={14} />
        </span>
        );
      default:
        return null;
    }
  };
  const updateStatus = async (registrationId: string, status: Registration['status']) => {
    try {
      await parseService.update<Registration>('Registration', registrationId, { status });

      setRegistrations((previousRegistrations) =>
          previousRegistrations.map((registration) =>
              registration.objectId === registrationId ? { ...registration, status } : registration,
          ),
      );

      if (status === 'approved') {
        const registration = registrations.find((r) => r.objectId === registrationId);

        const email = registration?.formData?.email || (registration as any)?.email;

        if (email) {
          await NotificationService.sendEmail(
              email,
              'Your registration has been approved!',
              `<h2>Good news!</h2> <p>Your registration for ${event?.title ? event.title : 'the'} event has been approved. See you there!</p>`,
          );
        }
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'Error';
      setError(msg);
    } finally {
      setOpenedActionId(null);
      setSelectedRegistration(null);
    }
  };

  const updateCheckInTime = async (
      registrationId: string,
      checkInTime: Registration['checkInTime'],
  ) => {
    try {
      await parseService.update<Registration>('Registration', registrationId, {
        checkInTime,
        isCheckedIn: true,
      });

      setRegistrations((previousRegistrations) =>
          previousRegistrations.map((registration) =>
              registration.objectId === registrationId
                  ? { ...registration, checkInTime, isCheckedIn: true }
                  : registration,
          ),
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setOpenedActionId(null);
      setSelectedRegistration(null);
    }
  };

  const canExport =
      user?.role === 'Admin' ||
      (user?.objectId != null && event?.ACL?.[user.objectId]?.read === true);

  const handleExport = () => {
    exportRegistrationsToCsv<Registration>({
      eventTitle: event?.title ?? eventId,
      columns: exportColumns,
      rows: registrations,
    });
  };

  if (loading) {
    return <p className="p-8 text-primary/60">{t('registrations.loading')}...</p>;
  }

  if (error) {
    return (
        <p className="p-8 text-red-600">
          {t('registrations.error')}: {error}
        </p>
    );
  }

  return (
      <>
        <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full min-w-0">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <h1 className="text-3xl mb-0">
                {t('registrations.title', { title: event?.title ?? eventId })}
              </h1>
              <p className="text-lg mt-0 text-primary/75">{t('registrations.description')}</p>
            </div>

            {canExport && (
                <Button onClick={handleExport} disabled={registrations.length === 0}>
              <span className="flex flex-row items-center gap-2 text-lg">
                <Icon icon={LuDownload} />
                <span>{t('registrations.export')}</span>
              </span>
                </Button>
            )}
          </div>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <InputTextfieldStateful
                className="flex-1"
                label={t('registrations.filters.search')}
                placeholder={`${t('registrations.filters.search')}...`}
                defaultValue={search}
                onChange={(value) => {
                  setSearch(String(value));
                  setPage(1);
                }}
            />

            <InputDatepicker
                label={t('registrations.filters.from')}
                value={dateFrom ?? ''}
                onChange={(value) => {
                  setDateFrom(value ? new Date(value as any) : null);
                  setPage(1);
                }}
            />

            <InputDatepicker
                label={t('registrations.filters.to')}
                value={dateTo ?? ''}
                onChange={(value) => {
                  setDateTo(value ? new Date(value as any) : null);
                  setPage(1);
                }}
            />
          </div>

          {/* TABLE */}
          {paginated.length === 0 ? (
              <div className="w-full rounded-xl border mt-4 py-10 text-center text-sm text-primary/70">
                {t('registrations.noRegistrations')}
              </div>
          ) : (
              <div className="mt-4 w-full min-w-0 overflow-x-auto">
                <ComplexTable
                    columnProperties={[
                      ...columns.map((column) => ({
                        name: column,
                        title: formatColumnName(column),
                        formatter: (value: string) =>
                            column === 'status' ? (
                                <div className="text-center">
                                  {renderStatus(value as Registration['status'])}
                                </div>
                            ) : (
                                <div className="whitespace-nowrap" title={String(value)}>
                                  {formatCellValue(value, t)}
                                </div>
                            ),
                      })),
                      {
                        name: 'actions',
                        title: t('registrations.actions'),
                        formatter: (value: string) => {
                          const { objectId, status, isCheckedIn } = JSON.parse(value);

                          return (
                              <div className="flex gap-2 justify-center whitespace-nowrap">
                                <button
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-surface transition-colors active:scale-95 ${
                                        isCheckedIn
                                            ? 'text-primary/60 hover:bg-background hover:text-primary cursor-pointer'
                                            : 'text-error cursor-not-allowed'
                                    }`}
                                    onClick={() =>
                                        updateCheckInTime(objectId, {
                                          __type: 'Date',
                                          iso: new Date().toISOString(),
                                        })
                                    }
                                    disabled={!isCheckedIn}
                                >
                                  <Icon icon={LuUserCheck} size={14} />
                                </button>
                                <button
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-surface text-primary/60 transition-colors hover:bg-background hover:text-primary cursor-pointer active:scale-95"
                                    onClick={() => {
                                      const registration = registrations.find((r) => r.objectId === objectId);
                                      if (registration) setSelectedRegistration(registration);
                                    }}
                                >
                                  <Icon icon={LuEye} size={14} />
                                </button>

                                <button
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-surface text-primary/60 transition-colors hover:bg-background hover:text-primary cursor-pointer active:scale-95"
                                    onClick={(e) =>
                                        navigate(`/admin/registrations/${eventId}/${objectId}/edit`, e)
                                    }
                                >
                                  <Icon icon={LuPencil} size={14} />
                                </button>

                                <button
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-surface text-primary/60 transition-colors hover:bg-background hover:text-primary cursor-pointer active:scale-95"
                                    data-action-menu=""
                                    onClick={(e) => toggleActionMenu(objectId, e.currentTarget)}
                                >
                                  <Icon icon={LuEllipsis} size={14} />
                                </button>

                                {openedActionId === objectId &&
                                    actionMenuPosition &&
                                    createPortal(
                                        <div
                                            data-action-menu=""
                                            className="fixed z-[100] w-48 rounded-xl border shadow-lg"
                                            style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                                        >
                                          <button
                                              className="flex w-full items-center gap-2 px-3 py-2 text-xs border border-b-0 rounded-t-xl bg-surface hover:bg-background cursor-pointer disabled:cursor-not-allowed disabled:text-primary/35 disabled:hover:bg-surface"
                                              onClick={() => updateStatus(objectId, 'approved')}
                                              disabled={status === 'approved' || status === 'cancelled'}
                                          >
                                            <Icon icon={LuCircleCheck} size={14} />
                                            <span>{t('registrations.approve')}</span>
                                          </button>
                                          <button
                                              className="flex w-full items-center gap-2 px-3 py-2 text-xs border rounded-b-xl bg-surface hover:bg-background cursor-pointer disabled:cursor-not-allowed disabled:text-primary/35 disabled:hover:bg-surface"
                                              onClick={() => updateStatus(objectId, 'rejected')}
                                              disabled={status === 'rejected' || status === 'cancelled'}
                                          >
                                            <Icon icon={LuCircleX} size={14} />
                                            <span>{t('registrations.reject')}</span>
                                          </button>
                                        </div>,
                                        document.body,
                                    )}
                              </div>
                          );
                        },
                      },
                    ]}
                    tableBodyData={paginated.map((registration) => ({
                      rowId: registration.objectId,
                      rowData: [
                        ...columns.map((column) =>
                            column === 'status' ? registration.status : getCellValue(registration, column),
                        ),
                        JSON.stringify({
                          objectId: registration.objectId,
                          status: registration.status,
                          isCheckedIn: registration.checkInTime == null,
                        }),
                      ],
                    }))}
                />
              </div>
          )}

          {/* PAGINATION */}
          <div className="mt-4 flex justify-between">
          <span className="text-xs text-primary/60 sm:text-sm">
            {t('registrations.pagination.current')} {page} {t('registrations.pagination.total')}{' '}
            {totalPages}
          </span>

            <div className="flex gap-2">
              <button
                  className="rounded-lg border border-primary/15 bg-surface-2 p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95 disabled:text-primary/35 disabled:cursor-not-allowed"
                  onClick={() => setPage((page) => Math.max(1, page - 1))}
                  disabled={totalPages === 1}
              >
                <Icon icon={LuChevronLeft} size={14} />
              </button>

              <button
                  className="rounded-lg border border-primary/15 bg-surface-2 p-2 text-primary transition-colors hover:bg-primary/10 active:scale-95 disabled:text-primary/35 disabled:cursor-not-allowed"
                  onClick={() => setPage((page) => Math.min(totalPages, page + 1))}
                  disabled={totalPages === 1}
              >
                <Icon icon={LuChevronRight} size={14} />
              </button>
            </div>
          </div>

          {/* DETAILS */}
          {selectedRegistration && (
              <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-primary/25"
                  onClick={() => setSelectedRegistration(null)}
              >
                <div
                    className="w-[90vw] max-w-[360px] rounded-2xl bg-surface px-6 py-5 pt-2 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{t('registrations.details.title')}</h2>

                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-surface text-primary/60 transition-colors hover:bg-background hover:text-primary cursor-pointer"
                        onClick={() => setSelectedRegistration(null)}
                    >
                      <Icon icon={LuX} size={14} />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <span className="font-semibold">Status:</span>{' '}
                    {selectedRegistration.status === 'approved'
                        ? t('registrations.details.status.approved')
                        : selectedRegistration.status === 'rejected'
                            ? t('registrations.details.status.rejected')
                            : selectedRegistration.status === 'cancelled'
                                ? t('registrations.details.status.cancelled')
                                : t('registrations.details.status.pending')}
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">{t('registrations.details.date')}:</span>
                      {formatDate(selectedRegistration.createdAt)}
                    </div>
                    {Object.entries(selectedRegistration.formData ?? {}).map(([key, value]) => (
                        <div key={key} className="flex gap-2 items-center">
                          <span className="font-semibold">{formatColumnName(key)}:</span>
                          {formatCellValue(String(value), t)}
                        </div>
                    ))}
                    <div className="flex flex-col items-center gap-2 border-t border-primary/10 pt-3">
                  <span className="self-start font-semibold">
                    {t('registrations.details.qrCode')}:
                  </span>
                      {qrToken ? (
                          <div className="rounded-lg border border-primary/10 bg-surface p-3">
                            <QRCodeSVG value={qrToken} size={180} level="M" />
                          </div>
                      ) : (
                          <span className="text-xs text-primary/70">
                      {qrError
                          ? t('registrations.details.qrError')
                          : t('registrations.details.qrLoading')}
                    </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </>
  );
}
