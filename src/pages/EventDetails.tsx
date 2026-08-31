import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Event, FormConfig, FormConfigEntry } from '../types/types';
import { formatDate } from '../utils/formatters';
import { parseService, createPointer } from '../services/parseService';
import { LuCalendarDays, LuMapPin, LuChevronDown, LuLoaderCircle, LuLink, LuTriangleAlert, LuDownload, LuCalendarPlus } from 'react-icons/lu';
import DOMPurify from 'dompurify';
import Icon from '../components/Icon';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/regex';
import parseClient from '../services/parseClient';
import { MAP_IFRAME_WIDTH, MAP_IFRAME_HEIGHT } from '../constants/eventDefaults';
import { useTheme } from '../theme/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';
import { QRCodeSVG } from 'qrcode.react';
import { generateConfirmationPdf } from '../utils/confirmationPdf';
import { downloadIcsFile } from '../utils/calendarIcs';
import { getFieldOptions, getOptionLabel, hasOptions } from '../utils/formOptions';
import { useOptionAvailability, optionAvailability } from '../hooks/useOptionAvailability';
import { toLocale } from '../utils/localizedEvent';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
];

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<{ title: string; description: string } | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  const { availability, refresh: refreshAvailability } = useOptionAvailability(eventId);

  useEffect(() => {
    if (!eventId) return;
    parseClient
      .get(`/classes/TestEvent/${eventId}`, {
        headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY },
      })
      .then(async ({ data }) => {
        const count = await parseService.count('Registration', {
          event: { __type: 'Pointer', className: 'TestEvent', objectId: eventId },
          status: 'approved',
        });
        setEvent({ ...data, registeredCount: count });
      });
  }, [eventId]);

  const validateField = (value: string, field: any) => {
    const required = field.required === true;

    if (required && !value) {
      return t('eventDetails.validation.required');
    }

    if (!value) return '';

    if (field.type === 'email') {
      if (!EMAIL_REGEX.test(value)) return t('eventDetails.validation.email');
    }

    if (field.type === 'phone') {
      if (!PHONE_REGEX.test(value)) return t('eventDetails.validation.phone');
    }

    return '';
  };

  const isFormValid =
    Object.entries(event?.formConfig ?? {}).every(([key, config]) => {
      const value = formData[key] ?? '';
      const field = config as any;
      return !validateField(value, field);
    }) && consent;

  const handleSubmit = async () => {
    if (!event || loading || !isFormValid) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setQrToken(null);
    setQrError(false);

    try {
      const registration = await parseService.create('Registration', {
        event: createPointer('TestEvent', event.objectId!),
        formData,
        status: event.requiresApproval ? 'pending' : 'approved',
        consent: true,
        ACL: event.ACL,
      });

      setFormData({});
      setConsent(false);
      setFormErrors({});
      setSuccess(true);

      if (!event.requiresApproval) {
        setEvent(prev => prev ? { ...prev, registeredCount: (prev.registeredCount ?? 0) + 1 } : prev);

        setQrLoading(true);
        parseService
          .runFunction<{ token: string }>('generateQrToken', {
            registrationId: registration.objectId,
          })
          .then(async (res) => {
            setQrToken(res.token);
            setTimeout(async () => {
              try {
                await generateConfirmationPdf(event, t);
              } catch (err) {
                console.error('PDF generation error:', err);
              }
            }, 300);
          })
          .catch(() => setQrError(true))
          .finally(() => setQrLoading(false));
      }

      refreshAvailability();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      const serverMsg = e?.response?.data?.error || e?.message || '';
      const lowerMsg = String(serverMsg).toLowerCase();
      const code = e?.response?.data?.code;

      try {
        const parsed = JSON.parse(serverMsg);
        if (parsed?.code === 'OPTION_FULL') {
          setFormErrors((prev) => ({
            ...prev,
            [parsed.field]: t('eventDetails.validation.optionFull'),
          }));
          setFormData((prev) => ({ ...prev, [parsed.field]: '' }));
          refreshAvailability();
          return;
        }
      } catch {
        // Ignored: server message is not JSON
      }

      if (lowerMsg.includes('full') || lowerMsg.includes('capacity') || code === 'CAPACITY_FULL') {
        setError({
          title: t('eventDetails.errors.capacityFullTitle'),
          description: t('eventDetails.capacityFullDescription'),
        });
        setEvent(prev => prev ? { ...prev, registeredCount: prev.capacity ?? prev.registeredCount } : prev);
      } else if (lowerMsg.includes('duplicate') || lowerMsg.includes('already') || code === 137) {
        setError({
          title: t('eventDetails.errors.duplicateTitle'),
          description: t('eventDetails.errors.duplicateDescription'),
        });
      } else if (lowerMsg.includes('closed') || lowerMsg.includes('ended') || lowerMsg.includes('inactive')) {
        setError({
          title: t('eventDetails.errors.closedTitle'),
          description: t('eventDetails.errors.closedDescription'),
        });
      } else if (lowerMsg.includes('validation') || lowerMsg.includes('invalid') || code === 142) {
        setError({
          title: t('eventDetails.errors.validationTitle'),
          description: t('eventDetails.errors.validationDescription'),
        });
      } else if (!navigator.onLine || e?.code === 'ERR_NETWORK' || e?.message === 'Network Error' || (e?.isAxiosError && !e?.response)) {
        setError({
          title: t('eventDetails.errors.networkTitle'),
          description: t('eventDetails.errors.networkDescription'),
        });
      } else if (e?.response?.status >= 500) {
        setError({
          title: t('eventDetails.errors.serverTitle'),
          description: t('eventDetails.errors.serverDescription'),
        });
      } else if (e?.response?.status === 401 || e?.response?.status === 403) {
        setError({
          title: t('eventDetails.errors.unauthorizedTitle'),
          description: t('eventDetails.errors.unauthorizedDescription'),
        });
      } else {
        setError({
          title: t('eventDetails.errorTitle'),
          description: serverMsg || t('eventDetails.errors.genericDescription'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAgain = () => {
    setSuccess(false);
    setFormData({});
    setConsent(false);
    setFormErrors({});
    setError(null);
    setQrToken(null);
    setQrError(false);
    setQrLoading(false);
    refreshAvailability();
  };

  useDocumentTitle(event ? `${event.title} - ${t('common.brand')}` : undefined);

  if (!event) {
    return (
      <div className="min-h-screen bg-background text-primary flex items-center justify-center">
        <Icon icon={LuLoaderCircle} size={32} className="animate-spin" />
      </div>
    );
  }

  const showMapEmbed = event.eventFormat === 'on-site' || event.eventFormat === 'hybrid';

  const meetingUrl =
    event.meetingLink || (event.eventFormat === 'virtual' ? event.location : '');

  const locale = toLocale(i18n.language);

  return (
    <div className="min-h-screen bg-background text-primary font-sans relative pb-16 overflow-x-hidden">
      <header className="bg-surface p-4 flex items-center justify-between shadow-md relative z-20">
        <Link
          to="/"
          className="text-xl font-bold text-primary no-underline hover:opacity-80 transition-opacity"
        >
          {t('common.brand')}
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex gap-2">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => i18n.changeLanguage(code)}
                  className={`cursor-pointer px-2 py-1 text-sm font-medium transition-all duration-200 bg-transparent border-none tracking-wide ${
                    i18n.language === code ? 'text-primary' : 'text-primary/50 hover:text-primary/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <div className="w-full h-[35vh] sm:h-[50vh] relative z-0">
        {event.heroImageUrl && (
          <img src={event.heroImageUrl} alt={event.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-16 sm:-mt-56">
        {error && (
          <div className="mb-8 w-full flex flex-col items-center sm:w-1/2 mx-auto bg-surface rounded-xl shadow-2xl px-6 py-3">
            <div className="flex items-center justify-center gap-2">
              <span className="flex items-center text-error">
                <Icon icon={LuTriangleAlert} size={18} />
              </span>
              <h3 className="text-xl font-bold text-primary">
                {error.title}
              </h3>
            </div>
            <p className="text-base text-primary/70 mt-0 max-w-fit">{error.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full min-w-0">
          <section className="col-span-1 lg:col-span-7 bg-surface rounded-xl shadow-2xl overflow-hidden min-w-0">
            <div className="p-5 md:p-10">
              <h1 className="text-2xl md:text-4xl font-bold mb-4 text-primary tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-sm text-primary/60 mb-8 pb-6 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <Icon icon={LuCalendarDays} size={16} />
                  <span>
                    {formatDate(event.startDate.iso ?? event.startDate.date?.toISOString() ?? '')}
                  </span>
                  {event.endDate && (
                    <>
                      <span>&ndash;</span>
                      <span>
                        {formatDate(event.endDate.iso ?? event.endDate.date?.toISOString() ?? '')}
                      </span>
                    </>
                  )}
                </div>

                {event.eventFormat !== 'virtual' && event.location && (
                  <div className="flex items-center gap-2">
                    <Icon icon={LuMapPin} size={16} />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.eventFormat !== 'on-site' && meetingUrl && (
                  <a
                    href={meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors"
                  >
                    <Icon icon={LuLink} size={16} />
                    <span>{t('eventDetails.joinOnline')}</span>
                  </a>
                )}
              </div>

              {showMapEmbed && event.location && (
                <div className="mb-8">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    title={`${t('eventDetails.locationPreview')}`}
                    width={MAP_IFRAME_WIDTH}
                    height={MAP_IFRAME_HEIGHT}
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg border border-primary/10 max-w-full w-full"
                  />
                </div>
              )}

              <div
                className="rte-content max-w-none text-primary/70 leading-relaxed text-sm md:text-base break-words overflow-x-auto w-full"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description || '') }}
              />
            </div>
          </section>

          <section className="col-span-1 lg:col-span-5 bg-surface rounded-xl shadow-2xl lg:sticky lg:top-8 overflow-hidden min-w-0">
            <div className="p-5 sm:p-8">
              {(() => {
                const hasCapacity = event.capacity != null && event.capacity > 0;
                const registered = event.registeredCount ?? 0;
                const isFull = hasCapacity && registered >= event.capacity!;
                const spotsLeft = hasCapacity ? event.capacity! - registered : null;

                if (isFull && !success) {
                  return (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-primary">
                        {t('eventDetails.capacityFull')}
                      </h2>
                      <p className="text-sm text-primary/60 max-w-xs">
                        {t('eventDetails.capacityFullDescription')}
                      </p>
                      <div className="w-full bg-error/5 border border-error/20 rounded-lg px-4 py-3 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-primary/70 font-medium">{t('dashboard.col.capacity')}</span>
                          <span className="font-bold text-error">{registered} / {event.capacity}</span>
                        </div>
                        <div className="w-full bg-error/10 rounded-full h-2 mt-2">
                          <div className="bg-error rounded-full h-2 w-full transition-all" />
                        </div>
                      </div>
                    </div>
                  );
                }

                return !success ? (
                  <>
                    <h2 className="text-xl font-bold mb-1 text-primary">
                      {t('eventDetails.registerNow')}
                    </h2>
                    <p className="text-sm text-primary/60 mb-4">{t('eventDetails.fillForm')}</p>

                    {hasCapacity && spotsLeft != null && (
                      <div className={`w-full box-border rounded-lg px-4 py-3 mb-6 border ${
                        spotsLeft <= 5
                          ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-600/40'
                          : 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-600/40'
                      }`}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-primary/70 font-medium">{t('dashboard.col.capacity')}</span>
                          <span className={`font-bold ${spotsLeft <= 5 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {registered} / {event.capacity}
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${spotsLeft <= 5 ? 'bg-amber-200 dark:bg-amber-800/40' : 'bg-emerald-200 dark:bg-emerald-800/40'}`}>
                          <div
                            className={`rounded-full h-2 transition-all ${spotsLeft <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (registered / event.capacity!) * 100)}%` }}
                          />
                        </div>
                        <p className={`text-xs font-semibold mt-2 mb-0 ${spotsLeft <= 5 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {spotsLeft === 1
                            ? t('eventDetails.spotsLeftOne')
                            : t('eventDetails.spotsLeft', { count: spotsLeft })}
                        </p>
                      </div>
                    )}

                  <form className="flex flex-col gap-6 w-full min-w-0">
                    {Object.entries((event.formConfig ?? {}) as FormConfig).map(([key, config]) => {
                      const field = config as FormConfigEntry;
                      const isRequired = field.required === true;
                      const value = formData[key] || '';

                      return (
                        <div key={key} className="w-full min-w-0 flex flex-col">
                          <label
                            htmlFor={key}
                            className="block text-xs font-bold text-primary mb-2 truncate"
                          >
                            {String(field.i18n?.[locale] || field.label || key)}{' '}
                            {isRequired && <span className="text-red-500">*</span>}
                          </label>

                          {(field.type === 'text' || (field.type as string) === 'string') && (
                            <input
                              id={key}
                              type="text"
                              value={value}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({ ...prev, [key]: val }));
                                setFormErrors((prev) => ({
                                  ...prev,
                                  [key]: validateField(val, field),
                                }));
                              }}
                              className="w-full box-border bg-surface-2 border border-transparent rounded-md px-4 py-3 text-sm text-primary focus:outline-none focus:border-primary/30 transition-colors"
                            />
                          )}

                          {field.type === 'email' && (
                            <input
                              id={key}
                              type="email"
                              value={value}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({ ...prev, [key]: val }));
                                setFormErrors((prev) => ({
                                  ...prev,
                                  [key]: validateField(val, field),
                                }));
                              }}
                              className="w-full box-border bg-surface-2 border border-transparent rounded-md px-4 py-3 text-sm text-primary focus:outline-none focus:border-primary/30 transition-colors"
                            />
                          )}

                          {field.type === 'phone' && (
                            <input
                              id={key}
                              type="tel"
                              value={value}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({ ...prev, [key]: val }));
                                setFormErrors((prev) => ({
                                  ...prev,
                                  [key]: validateField(val, field),
                                }));
                              }}
                              className="w-full box-border bg-surface-2 border border-transparent rounded-md px-4 py-3 text-sm text-primary focus:outline-none focus:border-primary/30 transition-colors"
                            />
                          )}

                          {(field.type as string) === 'number' && (
                            <input
                              id={key}
                              type="number"
                              value={value}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({ ...prev, [key]: val }));
                                setFormErrors((prev) => ({
                                  ...prev,
                                  [key]: validateField(val, field),
                                }));
                              }}
                              className="w-full box-border bg-surface-2 border border-transparent rounded-md px-4 py-3 text-sm text-primary focus:outline-none focus:border-primary/30 transition-colors"
                            />
                          )}

                          {hasOptions(field) && (
                            <div className="relative w-full box-border min-w-0">
                              <select
                                id={key}
                                value={value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData((prev) => ({ ...prev, [key]: val }));
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    [key]: validateField(val, field),
                                  }));
                                }}
                                className="w-full box-border bg-surface-2 border border-transparent rounded-md pl-4 pr-10 py-3 text-sm text-primary focus:outline-none focus:border-primary/30 transition-colors appearance-none truncate"
                              >
                                {isRequired ? (
                                    <option value="" disabled hidden>
                                      {t('eventDetails.selectOption')}
                                    </option>
                                ) : (
                                    <option value="">{t('eventDetails.noSelection')}</option>
                                )}

                                {getFieldOptions(field).map((option) => {
                                  const stats = optionAvailability(availability, key, option.id);
                                  const optionFull = stats !== undefined && stats.remaining === 0;
                                  const isSelected = value === option.id;

                                  return (
                                    <option
                                      key={option.id}
                                      value={option.id}
                                      // Zajętą opcję blokujemy, chyba że użytkownik ma ją
                                      // już wybraną — inaczej select nie wyświetliłby
                                      // bieżącej wartości.
                                      disabled={optionFull && !isSelected}
                                    >
                                      {getOptionLabel(option, i18n.language)}
                                      {stats && ` (${stats.remaining}/${stats.limit})`}
                                      {optionFull && ` — ${t('eventDetails.optionFullShort')}`}
                                    </option>
                                  );
                                })}
                              </select>

                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary/60">
                                <Icon icon={LuChevronDown} size={16} />
                              </div>
                            </div>
                          )}

                          {formErrors[key] && (
                            <p className={`text-xs mt-1 ${theme === "light" ? "text-error" : "text-secondary"}`}>{formErrors[key]}</p>
                          )}
                        </div>
                      );
                    })}

                    <div className="bg-surface-2 border border-primary/15 rounded-md p-4 mt-2 w-full box-border min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center mt-1 shrink-0">
                          <input
                            id="consent"
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="w-4 h-4 rounded-full border border-secondary bg-surface focus:ring-0 cursor-pointer appearance-none checked:bg-secondary"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="consent"
                            className="text-sm font-medium text-primary cursor-pointer block mb-1 break-words"
                          >
                            {t('eventDetails.dataConsent')} <span className="text-red-500">*</span>
                          </label>
                          <p className="text-xs text-primary/70">
                            {t('eventDetails.readMoreIn')}{' '}
                            <a
                              href={
                                event.dataProcessingAgreement !== undefined
                                  ? event.dataProcessingAgreement
                                  : '#terms'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-primary/80 hover:text-primary"
                            >
                              {t('eventDetails.termsAndConditions')}
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-primary/60 -mt-2">
                      * {t('eventDetails.requiredField')}
                    </p>

                    <button
                      type="button"
                      className="w-full box-border mt-2 py-3 px-4 rounded-md bg-secondary text-brand font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      onClick={handleSubmit}
                      disabled={loading || !isFormValid}
                    >
                      {t('eventDetails.register')}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-success text-xl font-semibold mt-2 mb-0">
                    {t('eventDetails.success')}
                  </p>

                  <p className="text-sm text-primary/85 text-center mt-0">
                    {event.requiresApproval
                      ? t('eventDetails.waitForApproval')
                      : !qrError
                        ? t('eventDetails.showCodeAtEntrance')
                        : ''}
                  </p>

                  {!event.requiresApproval && qrLoading && (
                    <span className="text-xs text-primary/85">
                      {t('eventDetails.qrLoading')}
                    </span>
                  )}

                  {!event.requiresApproval && !qrLoading && qrToken && (
                    <div id="qr-confirmation" className="rounded-lg border border-primary/10 bg-white p-3">
                      <QRCodeSVG value={qrToken} size={180} level="M" />
                    </div>
                  )}

                  {!event.requiresApproval && !qrLoading && qrError && (
                    <span className="text-xs text-error font-medium pb-5 text-center">
                        {t('eventDetails.qrError')}
                        <br className="mb-2" />
                        {t('eventDetails.qrErrorHint')}
                    </span>
                  )}

                  {!event.requiresApproval && !qrLoading && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                      <button
                        type="button"
                        className="flex-1 box-border flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-brand text-white font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        onClick={async () => {
                          try {
                            await generateConfirmationPdf(event, t);
                          } catch (err) {
                            console.error('PDF generation error:', err);
                          }
                        }}
                      >
                        <Icon icon={LuDownload} size={16} />
                        {t('eventDetails.downloadPdf')}
                      </button>
                      <button
                        type="button"
                        className="flex-1 box-border flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-primary/20 bg-surface text-primary font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => downloadIcsFile(event)}
                      >
                        <Icon icon={LuCalendarPlus} size={16} />
                        {t('eventDetails.addToCalendar')}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="w-full box-border mt-2 py-3 px-4 rounded-md bg-secondary text-brand font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onClick={handleRegisterAgain}
                  >
                    {t('eventDetails.registerAgain')}
                  </button>
                </div>
              );
              })()}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
