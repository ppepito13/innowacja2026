import { useEffect, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { LuSave, LuPlus, LuArrowLeft, LuUpload } from 'react-icons/lu';
import { InputDatepicker, InputTextfieldStateful } from '@lsg/components';
import { parseService } from '../../services/parseService';
import { Event, Locale, MongoDate, TranslatableEventField } from '../../types/types';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon';
import ColorField from '../../components/ColorField';
import RadioGroup from '../../components/RadioGroup';
import Toggle from '../../components/Toggle';
import RichTextEditor from '../../components/RichTextEditor';
import LocalizedField from '../../components/LocalizedField';
import {
  buildEventI18n,
  emptyLocalizedText,
  eventI18nFromEvent,
  primaryValue,
} from '../../utils/localizedEvent';
import DOMPurify from 'dompurify';
import parseClient from '../../services/parseClient';
import {
  EVENT_CLASS,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_ACCENT_COLOR,
  MAP_IFRAME_WIDTH,
  MAP_IFRAME_HEIGHT,
} from '../../constants/eventDefaults';
import { useAuth } from '../../auth/AuthProvider';
import {
  EVENT_ERROR_FIELDS,
  EventErrorField,
  EventFieldErrors,
  isValidDate,
  validateEvent,
} from '../../utils/eventValidation';

type Props = { mode: 'new' | 'edit' };
type EventEditParams = { id: string };

const EMPTY_EVENT: Event = {
  title: '',
  description: '',
  dateType: 'single',
  startDate: {},
  endDate: {},
  eventFormat: 'on-site',
  location: '',
  meetingLink: '',
  requiresApproval: false,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
  heroImageUrl: '',
  isActive: false,
  organizer: { __type: 'Pointer', className: '_User', objectId: '' },
  formConfig: {},
  i18n: eventI18nFromEvent({}),
};

function requestErrorMessage(e: any): string {
  return e?.response?.data?.error ?? e?.message ?? '';
}

function nextDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function parseParseDate(value: any): MongoDate {
  if (!value) return {};
  if (value.iso) return { date: new Date(value.iso) };
  return { date: new Date(value) };
}

export default function EventManagement({ mode }: Props) {
  const { t } = useTranslation();
  const { id } = useParams<EventEditParams>();
  const { user } = useAuth();
  const history = useHistory();

  const isEdit = mode === 'edit';

  const [event, setEvent] = useState<Event | null>(isEdit ? null : EMPTY_EVENT);
  const [loaded, setLoaded] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EventFieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedStartTime = useRef<number | null>(null);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const key = field as EventErrorField;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleFieldChange = <K extends keyof Event>(field: K, value: Event[K] | undefined) => {
    setEvent((prev) => (prev ? { ...prev, [field]: value } : null));
    clearFieldError(field as string);
  };

  const handleTranslationChange = (
    field: TranslatableEventField,
    locale: Locale,
    value: string,
  ) => {
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            i18n: {
              ...prev.i18n,
              [field]: { ...emptyLocalizedText(), ...prev.i18n?.[field], [locale]: value },
            },
          }
        : null,
    );
    clearFieldError(field);
  };

  const translationOf = (field: TranslatableEventField, locale: Locale): string =>
    event?.i18n?.[field]?.[locale] ?? '';

  useEffect(() => {
    if (!isEdit) return;
    parseService
      .getById<Event>(EVENT_CLASS, id)
      .then((rawEvent) => {
        if (user?.role !== 'Admin' && rawEvent.organizer?.objectId !== user?.objectId) {
          history.replace('/admin');
          return;
        }
        const storedStart = parseParseDate(rawEvent.startDate).date;
        storedStartTime.current = isValidDate(storedStart) ? storedStart.getTime() : null;

        const eventFormat = rawEvent.eventFormat ?? 'on-site';
        const legacyUrlInLocation =
          eventFormat === 'virtual' && !rawEvent.meetingLink && !!rawEvent.location;

        setEvent({
          ...rawEvent,
          dateType: rawEvent.dateType ?? 'single',
          eventFormat,
          requiresApproval: rawEvent.requiresApproval ?? false,
          location: legacyUrlInLocation ? '' : (rawEvent.location ?? ''),
          meetingLink: legacyUrlInLocation ? rawEvent.location : (rawEvent.meetingLink ?? ''),
          primaryColor: rawEvent.primaryColor ?? DEFAULT_PRIMARY_COLOR,
          accentColor: rawEvent.accentColor ?? DEFAULT_ACCENT_COLOR,
          heroImageUrl: rawEvent.heroImageUrl ?? '',
          startDate: parseParseDate(rawEvent.startDate),
          endDate: parseParseDate(rawEvent.endDate),
          i18n: eventI18nFromEvent({
            ...rawEvent,
            location: legacyUrlInLocation ? '' : (rawEvent.location ?? ''),
          }),
        });
        setLoaded(true);
      })
      .catch((e: any) => setError(requestErrorMessage(e)));
  }, [isEdit, id, history, user?.objectId, user?.role]);

  const handleDateTypeChange = (value: 'single' | 'multi') => {
    setEvent((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        dateType: value,
        ...(value === 'single' && { endDate: undefined }),
      };
    });
    clearFieldError('endDate');
  };

  const handleStartDateChange = (value: Date | string) => {
    const start = value ? new Date(value) : undefined;
    setEvent((prev) => {
      if (!prev) return null;
      const end = prev.endDate?.date;
      const staleEnd = !!start && isValidDate(end) && end.getTime() <= start.getTime();
      return {
        ...prev,
        startDate: start ? { date: start } : {},
        ...(staleEnd && { endDate: undefined }),
      };
    });
    clearFieldError('startDate');
    clearFieldError('endDate');
  };

  const handleEventFormatChange = (value: Event['eventFormat']) => {
    handleFieldChange('eventFormat', value);
    clearFieldError('location');
    clearFieldError('meetingLink');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data } = await parseClient.post(`/files/${encodeURIComponent(file.name)}`, file, {
        headers: { 'Content-Type': file.type },
      });
      handleFieldChange('heroImageUrl', data.url);
    } catch (e: any) {
      setError(requestErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const { data } = await parseClient.post(`/files/${encodeURIComponent(file.name)}`, file, {
      headers: { 'Content-Type': file.type },
    });
    return data.url as string;
  };

  const validate = (): boolean => {
    if (!event) return false;
    const errors = validateEvent(event, { storedStartTime: storedStartTime.current });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!event || !validate()) return;
    setSaving(true);
    setError(null);

    const translations = buildEventI18n(event.i18n, {
      description: (html) => DOMPurify.sanitize(html),
    });

    const payload: Event = {
      title: primaryValue(translations.title),
      description: primaryValue(translations.description),
      i18n: translations,
      startDate: { __type: 'Date', iso: event.startDate.date?.toISOString() },
      ...(event.dateType === 'multi' && event.endDate?.date
        ? { endDate: { __type: 'Date', iso: event.endDate.date.toISOString() } }
        : isEdit
          ? { endDate: { __op: 'Delete' } }
          : undefined),
      dateType: event.dateType,
      eventFormat: event.eventFormat,
      location: primaryValue(translations.location),
      meetingLink: event.meetingLink,
      requiresApproval: event.requiresApproval,
      primaryColor: event.primaryColor,
      accentColor: event.accentColor,
      heroImageUrl: event.heroImageUrl,
      isActive: event.isActive,
      ...(event.capacity != null && event.capacity > 0
        ? { capacity: event.capacity }
        : isEdit ? { capacity: { __op: 'Delete' } as any } : undefined),
      dataProcessingAgreement: primaryValue(translations.dataProcessingAgreement),
      formConfig: event.formConfig,
      organizer: event.organizer,
    };

    const request = isEdit
      ? parseService.update<Event>(EVENT_CLASS, id, payload).then(() => history.goBack())
      : parseService
          .create<Event>(EVENT_CLASS, payload)
          .then(({ objectId }) => history.push(`/admin/events/${objectId}/edit`));

    request.catch((e: any) => setError(requestErrorMessage(e))).finally(() => setSaving(false));
  };

  const tt = (key: string) => t(`eventManagement.${key}`);
  const ttm = (key: string) => t(`eventManagement.${isEdit ? 'edit' : 'new'}.${key}`);

  const errorFor = (field: EventErrorField): string | undefined => {
    const messageKey = fieldErrors[field];
    return messageKey ? tt(`validation.${messageKey}`) : undefined;
  };

  const errorSummary = EVENT_ERROR_FIELDS.filter((field) => fieldErrors[field]).map((field) => ({
    field,
    message: tt(`validation.${fieldErrors[field]}`),
  }));

  if (!loaded && !error) {
    return <p className="p-8 text-primary/60">{t('eventManagement.loading')}...</p>;
  }

  if (error && !loaded) {
    return (
      <p className="p-8 text-error">
        {t('eventManagement.error')}: {error}
      </p>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = event?.startDate?.date;
  const endDateMin = isValidDate(startDate) ? nextDay(startDate) : today;

  const showMapEmbed = event?.eventFormat === 'on-site' || event?.eventFormat === 'hybrid';
  const currentTitle = primaryValue(event?.i18n?.title);
  const currentLocation = primaryValue(event?.i18n?.location);

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-2xl">
      <div className="flex flex-row items-center justify-between mb-2">
        <div className="flex flex-col">
          <h1 className="text-3xl mb-0">{ttm('title')}</h1>
          <p className="text-lg mt-0 text-primary/75">
            {isEdit
              ? currentTitle
                ? t('eventManagement.edit.subtitle', { title: currentTitle })
                : ''
              : ttm('subtitle')}
          </p>
        </div>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-primary/10 bg-surface p-2 text-primary transition hover:bg-background active:scale-95"
          onClick={() => history.goBack()}
        >
          <Icon icon={LuArrowLeft} />
        </button>
      </div>

      {error && <p className="mb-2 text-sm text-error">{error}</p>}

      <div className="flex flex-col gap-2 mt-2">
        <LocalizedField label={tt('fields.title')} error={errorFor('title')}>
          {(locale, ariaLabel) => (
            <InputTextfieldStateful
              placeholder={tt('fields.title')}
              defaultValue={translationOf('title', locale)}
              htmlAttrs={{ 'aria-label': ariaLabel }}
              onChange={(v) => handleTranslationChange('title', locale, String(v))}
            />
          )}
        </LocalizedField>
        <LocalizedField label={tt('fields.description')}>
          {(locale) => (
            <RichTextEditor
              value={translationOf('description', locale)}
              placeholder={tt('fields.descriptionPlaceholder')}
              onChange={(html) => handleTranslationChange('description', locale, html)}
              uploadImage={uploadImage}
            />
          )}
        </LocalizedField>
        <RadioGroup
          label={tt('fields.dateType')}
          value={event?.dateType ?? 'single'}
          onChange={handleDateTypeChange}
          options={[
            { value: 'single', label: tt('fields.dateTypeSingle') },
            { value: 'multi', label: tt('fields.dateTypeMulti') },
          ]}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <InputDatepicker
              label={tt('fields.startDate')}
              value={event?.startDate?.date ?? ''}
              invalid={!!fieldErrors.startDate}
              minDate={today}
              onChange={handleStartDateChange}
            />
            {errorFor('startDate') && (
              <p className="text-xs text-error mt-1 mb-0">{errorFor('startDate')}</p>
            )}
          </div>
          {event?.dateType === 'multi' && (
            <div className="flex-1">
              <InputDatepicker
                label={tt('fields.endDate')}
                value={event.endDate?.date ?? ''}
                invalid={!!fieldErrors.endDate}
                minDate={endDateMin}
                onChange={(v) =>
                  handleFieldChange('endDate', v ? { date: new Date(v) } : undefined)
                }
              />
              {errorFor('endDate') && (
                <p className="text-xs text-error mt-1 mb-0">{errorFor('endDate')}</p>
              )}
            </div>
          )}
        </div>
        <RadioGroup
          label={tt('fields.eventFormat')}
          value={event?.eventFormat ?? 'on-site'}
          onChange={handleEventFormatChange}
          options={[
            { value: 'virtual', label: tt('fields.formatVirtual') },
            { value: 'on-site', label: tt('fields.formatOnSite') },
            { value: 'hybrid', label: tt('fields.formatHybrid') },
          ]}
        />
        {/* Physical address — on-site and hybrid only; always stored in `location`. */}
        {event?.eventFormat !== 'virtual' && (
          <LocalizedField label={tt('fields.locationOnSite')} error={errorFor('location')}>
            {(locale, ariaLabel) => (
              <InputTextfieldStateful
                placeholder={tt('fields.locationOnSitePlaceholder')}
                defaultValue={translationOf('location', locale)}
                htmlAttrs={{ 'aria-label': ariaLabel }}
                invalid={!!fieldErrors.location}
                onChange={(v) => handleTranslationChange('location', locale, String(v))}
              />
            )}
          </LocalizedField>
        )}
        {event?.eventFormat !== 'on-site' && (
          <InputTextfieldStateful
            label={tt('fields.locationVirtual')}
            placeholder={tt('fields.locationVirtualPlaceholder')}
            defaultValue={event?.meetingLink ?? ''}
            invalid={!!fieldErrors.meetingLink}
            errorText={errorFor('meetingLink')}
            onChange={(v) => handleFieldChange('meetingLink', String(v))}
          />
        )}
        {showMapEmbed && currentLocation && (
          <div className="flex flex-col gap-1 mb-6">
            <label className="block text-xs font-book text-primary/70">
              {tt('fields.locationPreview')}
            </label>
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(currentLocation)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              title={tt('fields.locationPreview')}
              width={MAP_IFRAME_WIDTH}
              height={MAP_IFRAME_HEIGHT}
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="mt-2 rounded-lg border border-primary/10 w-full"
            />
          </div>
        )}
        <p className="text-sm font-bold text-primary mt-3">{tt('sections.registration')}</p>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/10 p-4">
          <div className="flex flex-col">
            <label htmlFor="requiresApproval" className="text-sm font-book text-primary">
              {tt('fields.requiresApproval')}
            </label>
            <p className="text-xs text-primary/60 mt-1">{tt('fields.requiresApprovalHint')}</p>
          </div>
          <Toggle
            id="requiresApproval"
            checked={event?.requiresApproval ?? false}
            onChange={(v) => handleFieldChange('requiresApproval', v)}
          />
        </div>
        <p className="text-sm font-bold text-primary mt-3">{tt('capacitySection')}</p>
        <div className="flex flex-col gap-1">
          <label htmlFor="capacity" className="block text-xs font-book text-primary/70">
            {tt('fields.capacity')}
          </label>
          <input
            id="capacity"
            type="text"
            inputMode="numeric"
            value={event?.capacity ?? ''}
            aria-invalid={!!fieldErrors.capacity}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              handleFieldChange('capacity', digits ? Number(digits) : undefined);
            }}
            placeholder={tt('fields.capacityPlaceholder')}
            className={`border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none w-full sm:w-48 ${
              fieldErrors.capacity
                ? 'border-error focus:border-error'
                : 'border-primary/20 focus:border-primary/60'
            }`}
          />
          {errorFor('capacity') ? (
            <p className="text-xs text-error mt-0 mb-0">{errorFor('capacity')}</p>
          ) : (
            <p className="text-xs text-primary/60 mt-0">{tt('fields.capacityHint')}</p>
          )}
        </div>
        <p className="text-sm font-bold text-primary mt-3">{tt('sections.colors')}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <ColorField
            label={tt('fields.primaryColor')}
            value={event?.primaryColor ?? DEFAULT_PRIMARY_COLOR}
            onChange={(v) => handleFieldChange('primaryColor', v)}
          />
          <ColorField
            label={tt('fields.accentColor')}
            value={event?.accentColor ?? DEFAULT_ACCENT_COLOR}
            onChange={(v) => handleFieldChange('accentColor', v)}
          />
        </div>
        <div className="h-8 rounded-lg border border-primary/10 flex overflow-hidden mt-1">
          <div
            className="flex-1"
            style={{ backgroundColor: event?.primaryColor ?? DEFAULT_PRIMARY_COLOR }}
          />
          <div
            className="flex-1"
            style={{ backgroundColor: event?.accentColor ?? DEFAULT_ACCENT_COLOR }}
          />
        </div>
        <p className="text-sm font-bold text-primary mt-3">{tt('sections.heroImage')}</p>
        <div className="flex flex-col gap-1">
          <label className="block text-xs font-book text-primary/70">
            {tt('fields.heroImageUrl')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={event?.heroImageUrl ?? ''}
              onChange={(e) => handleFieldChange('heroImageUrl', e.target.value)}
              placeholder="https://..."
              className="flex-1 border border-primary/20 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary/60"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-sm text-primary hover:bg-background transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Icon icon={LuUpload} size={14} />
              <span>{uploading ? tt('fields.uploading') : tt('fields.upload')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
        {event?.heroImageUrl && (
          <img
            src={event.heroImageUrl}
            alt={tt('fields.heroImagePreview')}
            className="mt-1 h-36 w-full object-cover rounded-lg border border-primary/10"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).hidden = true;
            }}
            onLoad={(e) => {
              (e.currentTarget as HTMLImageElement).hidden = false;
            }}
          />
        )}
        <LocalizedField label={tt('fields.dataProcessingAgreement')}>
          {(locale, ariaLabel) => (
            <InputTextfieldStateful
              placeholder="https://..."
              defaultValue={translationOf('dataProcessingAgreement', locale)}
              htmlAttrs={{ 'aria-label': ariaLabel }}
              onChange={(v) =>
                handleTranslationChange('dataProcessingAgreement', locale, String(v))
              }
            />
          )}
        </LocalizedField>
      </div>

      <div className="flex flex-col items-end mt-6 pb-4 gap-2">
        {errorSummary.length > 0 && (
          <div
            role="alert"
            className="self-center max-w-full rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-left"
          >
            <p className="text-sm font-bold text-error mt-0 mb-1">
              {tt('validation.summaryTitle')}
            </p>
            <ul className="list-disc pl-5 my-0 text-sm text-error">
              {errorSummary.map(({ field, message }) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => history.goBack()}
            className="px-8 py-3 rounded-full border border-primary text-primary text-sm font-bold hover:bg-background transition-colors"
          >
            {t('eventManagement.cancel')}
          </button>
          <button
            type="button"
            onClick={() => history.push(`/admin/events/${id}/formconfig`)}
            className="px-8 py-3 rounded-full border border-primary text-primary text-sm font-bold hover:bg-background transition-colors"
          >
            {t('eventManagement.editFormConfig')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-secondary text-brand text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Icon icon={isEdit ? LuSave : LuPlus} size={16} />
            <span>{saving ? `${ttm('submit.pending')}...` : ttm('submit.idle')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
