import { useEffect, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { LuSave, LuPlus, LuArrowLeft, LuUpload } from 'react-icons/lu';
import { InputDatepicker, InputTextfieldStateful } from '@lsg/components';
import { parseService } from '../../services/parseService';
import { Event, MongoDate } from '../../types/types';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon';
import ColorField from '../../components/ColorField';
import RadioGroup from '../../components/RadioGroup';
import Toggle from '../../components/Toggle';
import RichTextEditor from '../../components/RichTextEditor';
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
};

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = <K extends keyof Event>(field: K, value: Event[K] | undefined) => {
    setEvent((prev) => (prev ? { ...prev, [field]: value } : null));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  useEffect(() => {
    if (!isEdit) return;
    parseService
      .getById<Event>(EVENT_CLASS, id)
      .then((rawEvent) => {
        if (user?.role !== 'Admin' && rawEvent.organizer?.objectId !== user?.objectId) {
          history.replace('/admin');
          return;
        }
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
        });
        setLoaded(true);
      })
      .catch((e: any) => setError(e.message));
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
    setFieldErrors((prev) => (prev.endDate ? { ...prev, endDate: '' } : prev));
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
      setError(e.message);
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
    const errors: Record<string, string> = {};
    if (!event.title.trim()) errors.title = tt('validation.titleRequired');
    if (!event.startDate?.date) errors.startDate = tt('validation.startDateRequired');
    if (event.dateType === 'multi' && !event.endDate?.date) {
      errors.endDate = tt('validation.endDateRequired');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!event || !validate()) return;
    setSaving(true);
    setError(null);

    const payload: Event = {
      title: event.title,
      description: DOMPurify.sanitize(event.description),
      startDate: { __type: 'Date', iso: event.startDate.date?.toISOString() },
      ...(event.dateType === 'multi' && event.endDate?.date
        ? { endDate: { __type: 'Date', iso: event.endDate.date.toISOString() } }
        : isEdit
          ? { endDate: { __op: 'Delete' } }
          : undefined),
      dateType: event.dateType,
      eventFormat: event.eventFormat,
      location: event.location,
      meetingLink: event.meetingLink,
      requiresApproval: event.requiresApproval,
      primaryColor: event.primaryColor,
      accentColor: event.accentColor,
      heroImageUrl: event.heroImageUrl,
      isActive: event.isActive,
      dataProcessingAgreement: event.dataProcessingAgreement,
      formConfig: event.formConfig,
      organizer: event.organizer,
    };

    const request = isEdit
      ? parseService.update<Event>(EVENT_CLASS, id, payload).then(() => history.goBack())
      : parseService
          .create<Event>(EVENT_CLASS, payload)
          .then(({ objectId }) => history.push(`/admin/events/${objectId}/edit`));

    request.catch((e: any) => setError(e.message)).finally(() => setSaving(false));
  };

  const tt = (key: string) => t(`eventManagement.${key}`);
  const ttm = (key: string) => t(`eventManagement.${isEdit ? 'edit' : 'new'}.${key}`);

  if (!loaded && !error) {
    return <p className="p-8 text-primary/60">{t('eventManagement.loading')}...</p>;
  }

  if (error && !loaded) {
    return (
      <p className="p-8 text-red-600">
        {t('eventManagement.error')}: {error}
      </p>
    );
  }

  const showMapEmbed = event?.eventFormat === 'on-site' || event?.eventFormat === 'hybrid';

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-2xl">
      <div className="flex flex-row items-center justify-between mb-2">
        <div className="flex flex-col">
          <h1 className="text-3xl mb-0">{ttm('title')}</h1>
          <p className="text-lg mt-0 text-primary/75">
            {isEdit
              ? event?.title
                ? t('eventManagement.edit.subtitle', { title: event.title })
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

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 mt-2">
        <InputTextfieldStateful
          label={tt('fields.title')}
          placeholder={tt('fields.title')}
          defaultValue={event?.title ?? ''}
          onChange={(v) => handleFieldChange('title', String(v))}
        />
        {fieldErrors.title && <p className="text-xs text-red-600 mt-0 mb-0">{fieldErrors.title}</p>}
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-sm font-medium text-primary">{tt('fields.description')}</label>
          <RichTextEditor
            value={event?.description ?? ''}
            placeholder={tt('fields.descriptionPlaceholder')}
            onChange={(html) => handleFieldChange('description', html)}
            uploadImage={uploadImage}
          />
        </div>
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
              onChange={(v) =>
                handleFieldChange('startDate', v ? { date: new Date(v) } : undefined)
              }
            />
            {fieldErrors.startDate && (
              <p className="text-xs text-red-600 mt-1 mb-0">{fieldErrors.startDate}</p>
            )}
          </div>
          {event?.dateType === 'multi' && (
            <div className="flex-1">
              <InputDatepicker
                label={tt('fields.endDate')}
                value={event.endDate?.date ?? ''}
                onChange={(v) =>
                  handleFieldChange('endDate', v ? { date: new Date(v) } : undefined)
                }
              />
              {fieldErrors.endDate && (
                <p className="text-xs text-red-600 mt-1 mb-0">{fieldErrors.endDate}</p>
              )}
            </div>
          )}
        </div>
        <RadioGroup
          label={tt('fields.eventFormat')}
          value={event?.eventFormat ?? 'on-site'}
          onChange={(v) => handleFieldChange('eventFormat', v)}
          options={[
            { value: 'virtual', label: tt('fields.formatVirtual') },
            { value: 'on-site', label: tt('fields.formatOnSite') },
            { value: 'hybrid', label: tt('fields.formatHybrid') },
          ]}
        />
        {/* Physical address — on-site and hybrid only; always stored in `location`. */}
        {event?.eventFormat !== 'virtual' && (
          <InputTextfieldStateful
            label={tt('fields.locationOnSite')}
            placeholder={tt('fields.locationOnSitePlaceholder')}
            defaultValue={event?.location ?? ''}
            onChange={(v) => handleFieldChange('location', String(v))}
          />
        )}
        {event?.eventFormat !== 'on-site' && (
          <InputTextfieldStateful
            label={tt('fields.locationVirtual')}
            placeholder={tt('fields.locationVirtualPlaceholder')}
            defaultValue={event?.meetingLink ?? ''}
            onChange={(v) => handleFieldChange('meetingLink', String(v))}
          />
        )}
        {showMapEmbed && event?.location && (
          <div className="flex flex-col gap-1 mb-6">
            <label className="block text-xs font-medium text-primary/70">
              {tt('fields.locationPreview')}
            </label>
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
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
        <p className="text-sm font-semibold text-primary mt-3">{tt('sections.registration')}</p>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/10 p-4">
          <div className="flex flex-col">
            <label htmlFor="requiresApproval" className="text-sm font-medium text-primary">
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
        <p className="text-sm font-semibold text-primary mt-3">{tt('sections.colors')}</p>
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
        <p className="text-sm font-semibold text-primary mt-3">{tt('sections.heroImage')}</p>
        <div className="flex flex-col gap-1">
          <label className="block text-xs font-medium text-primary/70">
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
        <InputTextfieldStateful
          label={tt('fields.dataProcessingAgreement')}
          placeholder="https://..."
          defaultValue={event?.dataProcessingAgreement ?? ''}
          onChange={(v) => handleFieldChange('dataProcessingAgreement', String(v))}
        />
      </div>

      <div className="flex flex-col items-end mt-6 pb-4 gap-2">
        {Object.values(fieldErrors).some(Boolean) && (
          <p className="text-sm text-red-600 mt-0 mb-0">{tt('validation.fillRequired')}</p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => history.goBack()}
            className="px-8 py-3 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-background transition-colors"
          >
            {t('eventManagement.cancel')}
          </button>
          <button
            type="button"
            onClick={() => history.push(`/admin/events/${id}/formconfig`)}
            className="px-8 py-3 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-background transition-colors"
          >
            {t('eventManagement.editFormConfig')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-secondary text-brand text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Icon icon={isEdit ? LuSave : LuPlus} size={16} />
            <span>{saving ? `${ttm('submit.pending')}...` : ttm('submit.idle')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
