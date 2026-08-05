import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { parseService } from '../../services/parseService';
import { Registration, Event } from '../../types/types';
import { ReactComponent as DownloadIcon } from '../../assets/download-icon.svg';
import { ReactComponent as ChevronDownIcon } from '../../assets/chevron-down-icon.svg';
import { ReactComponent as ZapIcon } from '../../assets/zap-icon.svg';
import { ReactComponent as ZapOffIcon } from '../../assets/zap-off-icon.svg';

import { useAuth } from '../../auth/AuthProvider';
import { EVENT_CLASS } from '../../constants/eventDefaults';
import { useScanner } from '../../hooks/useScanner';

type CheckInParams = { eventId?: string };

// Device vibration feedback
const triggerVibration = (type: 'success' | 'error') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'success') {
      navigator.vibrate(100);
    } else {
      navigator.vibrate([120, 80, 120]);
    }
  }
};

export default function CheckIn() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { eventId: routeEventId } = useParams<CheckInParams>();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState<{
    toastTitle: string;
    toastBody: string;
    inlineTitle: string;
    inlineBody: string;
  } | null>(null);

  // Recent scans state (last 3 in this session)
  const [recentScans, setRecentScans] = useState<
    Array<{
      name: string;
      status: 'success' | 'warning' | 'error';
      time: string;
    }>
  >([]);

  const recordScan = (name: string, status: 'success' | 'warning' | 'error') => {
    setRecentScans((prev) =>
      [{ name, status, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 3),
    );
  };

  const showScanResult = (
    status: 'success' | 'warning' | 'error',
    body: string,
    toastTitle: string,
    inlineTitle: string,
  ) => {
    setScanStatus(status);
    setScanMessage({ toastTitle, toastBody: body, inlineTitle, inlineBody: body });
    triggerVibration(status === 'success' ? 'success' : 'error');
  };

  const handleScan = async (decodedText: string) => {
    await pauseScanner();

    try {
      const res = await parseService.runFunction<{
        result: 'checked_in' | 'already_checked_in' | 'not_approved' | 'wrong_event';
        checkInTime?: string;
        participant: { formData?: Record<string, unknown> };
      }>('checkInByToken', { token: decodedText, eventId: selectedEventId });

      const name =
        (res.participant?.formData?.fullName as string) ||
        (res.participant?.formData?.name as string) ||
        'Attendee';

      if (res.result === 'checked_in') {
        showScanResult(
          'success',
          t('checkIn.scanner.success', { name }),
          t('checkIn.scanner.successTitle'),
          t('checkIn.scanner.successInlineTitle'),
        );
        recordScan(name, 'success');
      } else if (res.result === 'already_checked_in') {
        const timeStr = res.checkInTime ? new Date(res.checkInTime).toLocaleString() : '';
        showScanResult(
          'warning',
          t('checkIn.scanner.warning', { name, time: timeStr }),
          t('checkIn.scanner.warningTitle'),
          t('checkIn.scanner.errorTitle'),
        );
        recordScan(name, 'warning');
      } else {
        // not_approved or wrong_event — reject without checking in
        const reason =
          res.result === 'wrong_event'
            ? t('checkIn.scanner.wrongEvent')
            : t('checkIn.scanner.notApproved');
        const msg = t('checkIn.scanner.error', { name, message: reason }).replace(/^:\s*/, '');
        showScanResult(
          'error',
          msg,
          t('checkIn.scanner.warningTitle'),
          t('checkIn.scanner.errorTitle'),
        );
        recordScan(name, 'error');
      }
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const message =
        code === 101 ? t('checkIn.scanner.notFound') : t('checkIn.scanner.invalidCode');
      const msg = t('checkIn.scanner.error', { name: '', message }).replace(/^:\s*/, '');

      showScanResult('error', msg, t('checkIn.scanner.warningTitle'), t('checkIn.scanner.errorTitle'));
      recordScan('Unknown', 'error');
    }

    setTimeout(() => {
      setScanMessage(null);
      setScanStatus('idle');
      resumeScanner();
    }, 2500);
  };

  const {
    isScanning,
    hasFlashlight,
    flashlightOn,
    toggleScanner,
    toggleFlashlight,
    pauseScanner,
    resumeScanner,
  } = useScanner(handleScan);

  useEffect(() => {
    if (!user) return;

    const isAdmin = user.role === 'Admin';
    const where = isAdmin
      ? {}
      : {
          organizer: {
            __type: 'Pointer',
            className: '_User',
            objectId: user.objectId,
          },
        };

    parseService
      .query<Event>(EVENT_CLASS, where)
      .then(setEvents)
      // eslint-disable-next-line no-console
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (events.length === 0) return;

    if (routeEventId && events.some((e) => e.objectId === routeEventId)) {
      setSelectedEventId(routeEventId);
    } else if (!selectedEventId) {
      setSelectedEventId(events[0].objectId!);
    }
  }, [events, routeEventId, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    parseService
      .query<Registration>('Registration', {
        event: { __type: 'Pointer', className: 'TestEvent', objectId: selectedEventId },
      })
      .then(setRegistrations);
  }, [selectedEventId]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      if (reg.status !== 'approved') return false;

      const searchable = [reg.formData?.fullName, reg.formData?.name, reg.formData?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(searchQuery.toLowerCase());
    });
  }, [registrations, searchQuery]);

  const handleManualCheckInToggle = async (registration: Registration) => {
    const currentlyCheckedIn = registration.isCheckedIn ?? !!registration.checkInTime;
    const nextCheckedIn = !currentlyCheckedIn;
    const nowIso = new Date().toISOString();

    // Keep both attendance fields in sync: set them together on check-in, clear
    // them together on undo (__op: Delete unsets checkInTime on the server).
    const payload = nextCheckedIn
      ? { isCheckedIn: true, checkInTime: { __type: 'Date', iso: nowIso } }
      : { isCheckedIn: false, checkInTime: { __op: 'Delete' } };

    try {
      await parseService.update<Registration>('Registration', registration.objectId, payload as any);

      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.objectId === registration.objectId
            ? {
                ...reg,
                isCheckedIn: nextCheckedIn,
                checkInTime: nextCheckedIn ? ({ __type: 'Date', iso: nowIso } as any) : null,
              }
            : reg,
        ),
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Toast Notification */}
      {scanMessage && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-4 rounded-xl shadow-xl border toast-enter flex flex-col justify-center w-[90%] max-w-[420px] min-h-[72px]
          ${scanStatus === 'success' ? 'bg-surface border-success/30' : ''}
          ${scanStatus === 'warning' || scanStatus === 'error' ? 'bg-surface border-error/30' : ''}
        `}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0
              ${scanStatus === 'success' ? 'bg-success' : 'bg-error'}
            `}
            />
            <div>
              <h4 className="font-headline font-bold text-sm text-primary mb-0.5">
                {scanMessage.toastTitle}
              </h4>
              <p className="text-xs text-primary/70">{scanMessage.toastBody}</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface px-4 sm:px-8 py-4 rounded-2xl gap-4">
        <div>
          <h1 className="text-3xl mb-0">{t('checkIn.title')}</h1>
          <p className="text-lg mt-0 text-primary/75">{t('checkIn.subtitle')}</p>
        </div>

        {/* Event selector + Export */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="border border-primary/20 rounded-lg px-3 py-2 pr-8 text-sm text-primary focus:outline-none focus:border-primary appearance-none bg-surface font-medium w-full sm:w-auto"
            >
              {events.map((ev) => (
                <option key={ev.objectId} value={ev.objectId}>
                  {ev.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-primary/60">
              <ChevronDownIcon width="14" height="14" />
            </div>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-brand bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none"
          >
            <DownloadIcon width="14" height="14" />
            {t('checkIn.export')}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="flex flex-col bg-surface px-4 sm:px-8 py-6 rounded-2xl">
        {/* Tabs */}
        <div className="flex border border-primary/10 rounded-xl mb-6 p-1 bg-background/50">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
              ${
                activeTab === 'qr'
                  ? 'bg-secondary text-brand shadow-sm border border-primary/10'
                  : 'bg-surface text-primary shadow-sm border border-primary/10'
              }`}
          >
            {t('checkIn.tabs.qrScanner')}
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
              ${
                activeTab === 'manual'
                  ? 'bg-secondary text-brand shadow-sm border border-primary/10'
                  : 'bg-surface text-primary shadow-sm border border-primary/10'
              }`}
          >
            {t('checkIn.tabs.manual')}
          </button>
        </div>

        {/* QR Scanner Tab */}
        {activeTab === 'qr' && (
          <div className="flex flex-col gap-6">
            {/* Scanner section header */}
            <div>
              <h2 className="text-xl mb-0">{t('checkIn.scanner.title')}</h2>
              <p className="text-sm mt-0 text-primary/75">{t('checkIn.scanner.description')}</p>
            </div>

            {/* Start/Stop button */}
            <div className="flex justify-center">
              <button
                onClick={toggleScanner}
                className={`py-2.5 px-10 rounded-lg font-semibold text-sm transition-all cursor-pointer border-none
                  ${
                    isScanning
                      ? 'bg-error/10 text-error hover:bg-error/15'
                      : 'bg-secondary text-brand hover:bg-secondary/90'
                  }
                `}
              >
                {isScanning ? t('checkIn.scanner.stop') : t('checkIn.scanner.start')}
              </button>
            </div>

            <div
              className={`w-full relative bg-primary/5 rounded-xl overflow-hidden flex flex-col items-center justify-center border aspect-square transition-all duration-300
              ${scanStatus === 'success' ? 'border-success shadow-[0_0_0_3px_rgb(var(--cb-success)/0.15)]' : ''}
              ${scanStatus === 'warning' || scanStatus === 'error' ? 'border-error shadow-[0_0_0_3px_rgb(var(--cb-error)/0.15)]' : ''}
              ${scanStatus === 'idle' ? 'border-primary/15' : ''}
            `}
            >
              <div id="qr-reader" className="w-full h-full flex items-center justify-center" />

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/30 gap-2">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <p className="text-xs font-medium">{t('checkIn.scanner.start')}</p>
                </div>
              )}

              {/* Flashlight button */}
              {isScanning && hasFlashlight && (
                <button
                  type="button"
                  onClick={toggleFlashlight}
                  className={`absolute top-3 right-3 p-2.5 rounded-lg transition-all border z-10 cursor-pointer
                    ${
                      flashlightOn
                        ? 'bg-secondary text-brand border-secondary/50'
                        : 'bg-surface/80 text-primary/60 border-primary/10 hover:bg-surface'
                    }
                  `}
                >
                  {flashlightOn ? (
                    <ZapIcon width="16" height="16" />
                  ) : (
                    <ZapOffIcon width="16" height="16" />
                  )}
                </button>
              )}
            </div>

            {/* Inline scan result */}
            {scanMessage && (
              <div
                className={`w-full p-4 rounded-xl border scale-in
                ${scanStatus === 'success' ? 'bg-success/5 border-success/20' : ''}
                ${scanStatus === 'warning' || scanStatus === 'error' ? 'bg-error/5 border-error/20' : ''}
              `}
              >
                <h4
                  className={`font-bold text-sm mb-1
                  ${scanStatus === 'success' ? 'text-success' : 'text-error'}
                `}
                >
                  {scanMessage.inlineTitle}
                </h4>
                <p
                  className={`text-sm
                  ${scanStatus === 'success' ? 'text-success/80' : 'text-error/80'}
                `}
                >
                  {scanMessage.inlineBody}
                </p>
              </div>
            )}

            {/* Recent scans log */}
            {recentScans.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-primary/60 mb-3 tracking-wider uppercase">
                  {t('checkIn.recentScans') ?? 'Recent scans'}
                </h3>
                <div className="flex flex-col gap-2">
                  {recentScans.map((scan, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border border-primary/10 bg-background/40 px-4 py-3 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0
                          ${scan.status === 'success' ? 'bg-success' : 'bg-error'}
                        `}
                        />
                        <span className="text-sm font-medium text-primary truncate max-w-[200px]">
                          {scan.name}
                        </span>
                      </div>
                      <span className="text-xs text-primary/60 font-mono">{scan.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <div className="flex flex-col gap-4 w-full">
            <div>
              <h2 className="text-xl mb-0">
                {t('checkIn.manual.title') ?? 'Manual Attendee List'}
              </h2>
              <p className="text-sm mt-0 text-primary/75">
                {t('checkIn.manual.description') ??
                  'Search for an attendee and manually toggle their check-in status.'}
              </p>
            </div>

            <input
              type="text"
              placeholder={t('checkIn.manual.search') ?? 'Search by name or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full box-border border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:border-primary bg-background/50 mb-2"
            />

            <div className="flex flex-col border border-primary/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-background/50 px-4 py-3 border-b border-primary/10 text-xs font-semibold text-primary/60">
                <div className="flex-1">{t('checkIn.manual.attendee') ?? 'Attendee'}</div>
                <div className="w-40 text-center">{t('checkIn.manual.status') ?? 'Status'}</div>
                <div className="w-32 text-right">{t('checkIn.manual.action') ?? 'Action'}</div>
              </div>

              <div className="flex flex-col divide-y divide-primary/10 max-h-[400px] overflow-y-auto">
                {filteredRegistrations.length === 0 ? (
                  <div className="py-8 text-center text-sm text-primary/70">
                    {t('checkIn.manual.noResults') ?? 'No attendees found.'}
                  </div>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const name =
                      (reg.formData?.fullName as string) ||
                      (reg.formData?.name as string) ||
                      'Attendee';
                    const email = (reg.formData?.email as string) || '';
                    const isCheckedIn = reg.isCheckedIn ?? !!reg.checkInTime;

                    let timeStr = '';
                    if (isCheckedIn) {
                      const checkInDate =
                        reg.checkInTime instanceof Date
                          ? reg.checkInTime
                          : new Date(
                              (reg.checkInTime as any).iso ?? (reg.checkInTime as any).date ?? '',
                            );
                      timeStr = checkInDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }

                    return (
                      <div
                        key={reg.objectId}
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-surface hover:bg-background/30 transition-colors"
                      >
                        <div className="flex-1 flex flex-col truncate pr-4">
                          <span className="font-semibold text-sm text-primary truncate">
                            {name}
                          </span>
                          <span className="text-sm text-primary/60 truncate">{email}</span>
                        </div>

                        <div className="w-40 flex justify-center">
                          {isCheckedIn ? (
                            <span className="px-2.5 py-1 rounded-full bg-cb-success/20 text-success text-xs font-bold whitespace-nowrap">
                              {t('checkIn.manual.checkedIn') ?? 'Checked-In'} ({timeStr})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary/70 text-xs font-medium whitespace-nowrap">
                              {t('checkIn.manual.notPresent') ?? 'Not Present'}
                            </span>
                          )}
                        </div>

                        <div className="w-32 flex justify-end">
                          <button
                            onClick={() => handleManualCheckInToggle(reg)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border outline-none
                              ${
                                isCheckedIn
                                  ? 'bg-transparent border-primary/20 text-primary hover:bg-background'
                                  : 'bg-secondary border-secondary text-cb-petrol hover:bg-secondary/75'
                              }
                            `}
                          >
                            {isCheckedIn
                              ? (t('checkIn.manual.undo') ?? 'Undo Check-in')
                              : (t('checkIn.manual.checkInBtn') ?? 'Check-in')}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
