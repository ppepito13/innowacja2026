import { useEffect, useMemo, useState } from 'react';
import { useParams, useHistory } from 'react-router';
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
} from 'react-icons/lu';
import { Button, InputDatepicker, InputTextfieldStateful, ComplexTable } from '@lsg/components';
import { parseService, createPointer } from '../../services/parseService';
import { Registration, Event } from '../../types/types';
import { formatDate, formatColumnName, formatBoolean } from '../../utils/formatters';

import Icon from '../../components/Icon';

type RegistrationParams = { eventId: string };

const RowsPerPage = 8;

export default function Registrations() {
  const { eventId } = useParams<RegistrationParams>();
  const history = useHistory();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [openedActionId, setOpenedActionId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      parseService.getById<Event>('TestEvent', eventId),
      parseService.query<Registration>('Registration', {
        event: createPointer('TestEvent', eventId),
      }),
    ])
      .then(([event, registrations]) => {
        setEvent(event);
        setRegistrations(registrations);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [eventId]);

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
        return <Icon icon={LuCircleCheck} size={14} />;
      case 'pending':
        return <Icon icon={LuClock} size={14} />;
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setOpenedActionId(null);
      setSelectedRegistration(null);
    }
  };

  const exportRegistrations = () => {
    if (registrations.length === 0) {
      return;
    }

    const rows = registrations.map((registration) =>
      columns.map((column) => {
        if (column === 'status') {
          return registration.status;
        }

        const value = getCellValue(registration, column);

        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('') || value.includes('\n'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      }),
    );

    const data = [columns, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `registrations-${event?.title ?? eventId}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="p-8 text-primary/60">Loading data...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-600">Error: {error}</p>;
  }

  return (
    <>
      <div className="flex flex-col bg-white px-8 py-4 rounded-2xl sm:min-w-[1024px]">
        {/* HEADER */}
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl mb-0">Registrations - {event?.title ?? eventId}</h1>
            <p className="text-lg mt-0 text-primary/75">View and manage event registrations.</p>
          </div>

          <Button onClick={() => exportRegistrations()} disabled={registrations.length === 0}>
            <span className="flex flex-row items-center gap-2 text-lg">
              <Icon icon={LuDownload} />
              <span>Export</span>
            </span>
          </Button>
        </div>

        {/* FILTERS */}
        <div className="flex flex-row gap-4 mt-4">
          <InputTextfieldStateful
            className="flex-1"
            label="Search"
            placeholder="Search..."
            defaultValue={search}
            onChange={(value) => {
              setSearch(String(value));
              setPage(1);
            }}
          />

          <InputDatepicker
            label="From"
            value={dateFrom ?? ''}
            onChange={(value) => {
              setDateFrom(value ? new Date(value as any) : null);
              setPage(1);
            }}
          />

          <InputDatepicker
            label="To"
            value={dateTo ?? ''}
            onChange={(value) => {
              setDateTo(value ? new Date(value as any) : null);
              setPage(1);
            }}
          />
        </div>

        {/* TABLE */}
        {paginated.length === 0 ? (
          <div className="w-full rounded-xl border mt-4 py-10 text-center text-sm text-primary/50">
            No registrations found
          </div>
        ) : (
          <ComplexTable
            columnProperties={[
              ...columns.map((column) => ({
                name: column,
                title: formatColumnName(column),
                formatter: (value: string) =>
                  column === 'status' ? (
                    <div style={{ textAlign: 'center' }}>
                      {renderStatus(value as Registration['status'])}
                    </div>
                  ) : (
                    formatBoolean(value)
                  ),
              })),
              {
                name: 'actions',
                title: 'Actions',
                formatter: (value: string) => {
                  const { objectId, status } = JSON.parse(value);

                  return (
                    <div className="relative flex gap-2 justify-center">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-white p-2 text-primary transition hover:bg-background active:scale-95"
                        onClick={() => {
                          const registration = registrations.find(
                            (registration) => registration.objectId === objectId,
                          );
                          if (registration) {
                            setSelectedRegistration(registration);
                          }
                        }}
                      >
                        <Icon icon={LuEye} size={14} />
                      </button>

                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-white p-2 text-primary transition hover:bg-background active:scale-95"
                        onClick={() =>
                          history.push(`/admin/registrations/${eventId}/${objectId}/edit`)
                        }
                      >
                        <Icon icon={LuPencil} size={14} />
                      </button>

                      <button
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-white p-2 text-primary transition hover:bg-background active:scale-95 ${status === 'approved' ? 'opacity-75 cursor-not-allowed' : ''}`}
                        onClick={() =>
                          status !== 'approved' &&
                          setOpenedActionId((id) => (id === objectId ? null : objectId))
                        }
                        disabled={status === 'approved'}
                      >
                        <Icon icon={LuEllipsis} size={14} />
                      </button>

                      {openedActionId === objectId && (
                        <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs border border-b-0 rounded-t-xl bg-white hover:bg-background"
                            onClick={() => updateStatus(objectId, 'approved')}
                          >
                            <Icon icon={LuCircleCheck} size={14} />
                            <span>Approve Registration</span>
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs border rounded-b-xl bg-white hover:bg-background"
                            onClick={() => updateStatus(objectId, 'pending')}
                          >
                            <Icon icon={LuCircleX} size={14} />
                            <span>Reject Registration</span>
                          </button>
                        </div>
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
                JSON.stringify({ objectId: registration.objectId, status: registration.status }),
              ],
            }))}
          />
        )}

        {/* PAGINATION */}
        <div className="mt-4 flex justify-between">
          <span className="text-xs text-primary/60 sm:text-sm">
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              className={`rounded-lg border border-primary/10 bg-white p-2 text-primary transition hover:bg-background active:scale-95 ${totalPages === 1 ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={() => setPage((page) => Math.max(1, page - 1))}
              disabled={totalPages === 1}
            >
              <Icon icon={LuChevronLeft} size={14} />
            </button>

            <button
              className={`rounded-lg border border-primary/10 bg-white p-2 text-primary transition hover:bg-background active:scale-95 ${totalPages === 1 ? 'opacity-75 cursor-not-allowed' : ''}`}
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
              className="w-[360px] rounded-2xl bg-white px-6 py-5 pt-2 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Registration details</h2>

                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-primary/10 bg-white hover:bg-background"
                  onClick={() => setSelectedRegistration(null)}
                >
                  <Icon icon={LuX} size={14} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <span className="font-semibold">Status:</span> {selectedRegistration.status}
                <div className="flex gap-2 items-center">
                  <span className="font-semibold">Date:</span>
                  {formatDate(selectedRegistration.createdAt)}
                </div>
                {Object.entries(selectedRegistration.formData ?? {}).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <span className="font-semibold">{formatColumnName(key)}:</span>
                    {formatBoolean(String(value))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
