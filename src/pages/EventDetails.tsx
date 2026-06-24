import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Event } from '../types/types';
import { formatColumnName, formatDate } from '../utils/formatters';
import { parseService, createPointer } from '../services/parseService';
import { LuCalendarDays, LuMapPin, LuChevronDown, LuLoaderCircle } from 'react-icons/lu';
import Icon from '../components/Icon';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/regex';
import parseClient from '../services/parseClient';

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
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!eventId) return;
    parseClient.get(`/classes/TestEvent/${eventId}`, {
      headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY }
    }).then(({ data }) => setEvent(data));
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

    try {
      await parseService.create('Registration', {
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
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <Icon icon={LuLoaderCircle} size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1521] text-white font-sans relative pb-16 overflow-x-hidden">
      <header className="bg-[#1f2937] p-4 flex items-center justify-between shadow-md relative z-20">
        <div className="text-xl font-bold text-white">Commerzbank Events</div>

        <div className="flex gap-2 text-sm">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => i18n.changeLanguage(code)}
              className={`cursor-pointer px-2 py-1 text-sm font-medium transition-all duration-200 bg-transparent border-none tracking-wide ${
                i18n.language === code ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="w-full h-[35vh] sm:h-[50vh] relative z-0">
        <img src={event.heroImageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b1521]/40 to-[#0b1521]"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-16 sm:-mt-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full min-w-0">
          <section className="col-span-1 lg:col-span-7 bg-[#162436] rounded-xl shadow-2xl overflow-hidden min-w-0">
            <div className="p-5 md:p-10">
              <h1 className="text-2xl md:text-4xl font-bold mb-4 text-white tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-700/50">
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

                {event.location && (
                  <div className="flex items-center gap-2">
                    <Icon icon={LuMapPin} size={16} />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              <div
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-sm md:text-base break-words overflow-x-auto w-full"
                dangerouslySetInnerHTML={{ __html: event.description || '' }}
              />
            </div>
          </section>

          <section className="col-span-1 lg:col-span-5 bg-[#162436] rounded-xl shadow-2xl lg:sticky lg:top-8 overflow-hidden min-w-0">
            <div className="p-5 sm:p-8">
              <h2 className="text-xl font-bold mb-1 text-white">{t('eventDetails.registerNow')}</h2>
              <p className="text-sm text-gray-400 mb-8">{t('eventDetails.fillForm')}</p>

              <form className="flex flex-col gap-6 w-full min-w-0">
                {Object.entries(event.formConfig ?? {}).map(([key, config]) => {
                  const field = config as any;
                  const isRequired = field.required === true;
                  const value = formData[key] || '';

                  return (
                    <div key={key} className="w-full min-w-0 flex flex-col">
                      <label htmlFor={key} className="block text-xs font-bold text-white mb-2 truncate">
                        {formatColumnName(key)}{' '}
                        {isRequired && <span className="text-red-500">*</span>}
                      </label>

                      {(field.type === 'string' || field.type === 'text') && (
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
                          className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
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
                          className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
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
                          className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                        />
                      )}

                      {field.type === 'number' && (
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
                          className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                        />
                      )}

                      {(field.type === 'select' || field.type === 'dropdown') && (
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
                            className="w-full box-border bg-[#24364b] border border-transparent rounded-md pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none truncate"
                          >
                            <option value="" disabled hidden>
                              {t('eventDetails.selectOption')}
                            </option>
                            {(field.options || field.values)?.map((val: string) => (
                              <option key={val} value={val}>
                                {val}
                              </option>
                            ))}
                          </select>

                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <Icon icon={LuChevronDown} size={16} />
                          </div>
                        </div>
                      )}

                      {formErrors[key] && (
                        <p className="text-xs text-yellow-400 mt-1">{formErrors[key]}</p>
                      )}
                    </div>
                  );
                })}

                <div className="bg-[#1e2e40] border border-gray-600/50 rounded-md p-4 mt-2 w-full min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center mt-1 shrink-0">
                      <input
                        id="consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="w-4 h-4 rounded-full border border-gray-500 bg-[#162436] focus:ring-0 cursor-pointer appearance-none checked:bg-current"
                        style={{ color: event.primaryColor, borderColor: event.accentColor }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="consent"
                        className="text-sm font-medium text-white cursor-pointer block mb-1 break-words"
                      >
                        {t('eventDetails.dataConsent')} <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-300">
                        {t('eventDetails.readMoreIn')}{' '}
                        <a
                          href={
                            event.dataProcessingAgreement !== undefined
                              ? event.dataProcessingAgreement
                              : '#terms'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-gray-200 hover:text-white"
                        >
                          {t('eventDetails.termsAndConditions')}
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 -mt-2">* {t('eventDetails.requiredField')}</p>

                <button
                  type="button"
                  className="w-full mt-2 py-3 px-4 rounded-md text-[#0b1521] font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: event.accentColor }}
                  onClick={handleSubmit}
                  disabled={loading || !isFormValid}
                >
                  {t('eventDetails.register')}
                </button>

                {success && <p className="text-green-400 text-sm">{t('eventDetails.success')}</p>}
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
