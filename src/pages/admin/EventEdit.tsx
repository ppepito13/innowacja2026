import { useEffect, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { LuSave, LuArrowLeft, LuUpload } from 'react-icons/lu';
import { InputDatepicker, InputTextfieldStateful } from '@lsg/components';
import { parseService } from '../../services/parseService';
import { Event } from '../../types/types';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon';
import ColorField from '../../components/ColorField';
import RadioGroup from '../../components/RadioGroup';
import parseClient from '../../services/parseClient';
import { EVENT_CLASS, DEFAULT_PRIMARY_COLOR, DEFAULT_ACCENT_COLOR } from '../../constants/eventDefaults';

type EventEditParams = { id: string };

function parseParseDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value.iso) return new Date(value.iso);
    return new Date(value);
}

export default function EventEdit() {
    const { t } = useTranslation();
    const { id } = useParams<EventEditParams>();
    const history = useHistory();

    const [event, setEvent] = useState<Partial<Event>>({});
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFieldChange = <K extends keyof Event>(field: K, value: Event[K] | undefined) => {
        setEvent((prev) => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        parseService
            .getById<Event>(EVENT_CLASS, id)
            .then((rawEvent) => {
                const e = rawEvent as any;
                setEvent({
                    ...rawEvent,
                    dateType: e.dateType ?? 'single',
                    eventFormat: e.eventFormat ?? 'on-site',
                    location: e.location ?? '',
                    primaryColor: e.primaryColor ?? DEFAULT_PRIMARY_COLOR,
                    accentColor: e.accentColor ?? DEFAULT_ACCENT_COLOR,
                    heroImageUrl: e.heroImageUrl ?? '',
                    startDate: parseParseDate(e.startDate),
                    endDate: parseParseDate(e.endDate),
                });
                setLoaded(true);
            })
            .catch((e: any) => setError(e.message));
    }, [id]);

    const handleDateTypeChange = (value: 'single' | 'multi') => {
        setEvent((prev) => ({
            ...prev,
            dateType: value,
            ...(value === 'single' && { endDate: undefined }),
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
        e.target.value = '';
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const { data } = await parseClient.post(
                `/files/${encodeURIComponent(file.name)}`,
                file,
                { headers: { 'Content-Type': file.type } },
            );
            handleFieldChange('heroImageUrl', data.url);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        setSaving(true);
        setError(null);

        const payload: Record<string, unknown> = {
            title: event.title,
            description: event.description,
            dateType: event.dateType,
            eventFormat: event.eventFormat,
            location: event.location,
            primaryColor: event.primaryColor,
            accentColor: event.accentColor,
            heroImageUrl: event.heroImageUrl,
            ...(event.startDate && { startDate: { __type: 'Date', iso: event.startDate.toISOString() } }),
            ...(event.dateType === 'multi' && event.endDate
                ? { endDate: { __type: 'Date', iso: event.endDate.toISOString() } }
                : { endDate: { __op: 'Delete' } }),
        };

        parseService
            .update<Event>(EVENT_CLASS, id, payload as any)
            .then(() => history.goBack())
            .catch((e: any) => setError(e.message))
            .finally(() => setSaving(false));
    };

    if (!loaded && !error) {
        return <p className="p-8 text-primary/60">{t('eventEdit.loading')}...</p>;
    }

    if (error && !loaded) {
        return (
            <p className="p-8 text-red-600">
                {t('eventEdit.error')}: {error}
            </p>
        );
    }

    return (
        <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-[640px]">
            {/* HEADER */}
            <div className="flex flex-row items-center justify-between mb-2">
                <div className="flex flex-col">
                    <h1 className="text-3xl mb-0">{t('eventEdit.title')}</h1>
                    <p className="text-lg mt-0 text-primary/75">
                        {t('eventEdit.subtitle', { title: event.title ?? id })}
                    </p>
                </div>
                <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-primary/10 bg-white p-2 text-primary transition hover:bg-background active:scale-95"
                    onClick={() => history.goBack()}
                >
                    <Icon icon={LuArrowLeft} />
                </button>
            </div>

            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

            {/* FORM */}
            <div className="flex flex-col gap-2 mt-2">

                {/* Title */}
                <InputTextfieldStateful
                    label={t('eventEdit.fields.title')}
                    placeholder={t('eventEdit.fields.title')}
                    defaultValue={event.title ?? ''}
                    onChange={(v) => handleFieldChange('title', String(v))}
                />

                {/* Description */}
                <InputTextfieldStateful
                    label={t('eventEdit.fields.description')}
                    placeholder={t('eventEdit.fields.descriptionPlaceholder')}
                    defaultValue={event.description ?? ''}
                    textArea={true}
                    onChange={(v) => handleFieldChange('description', String(v))}
                />

                {/* Date Type */}
                <RadioGroup
                    label={t('eventEdit.fields.dateType')}
                    value={event.dateType ?? 'single'}
                    onChange={handleDateTypeChange}
                    options={[
                        { value: 'single', label: t('eventEdit.fields.dateTypeSingle') },
                        { value: 'multi', label: t('eventEdit.fields.dateTypeMulti') },
                    ]}
                />

                {/* Dates */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <InputDatepicker
                            label={t('eventEdit.fields.startDate')}
                            value={event.startDate ?? ''}
                            onChange={(v) => handleFieldChange('startDate', v ? new Date(v as any) : undefined)}
                        />
                    </div>
                    {event.dateType === 'multi' && (
                        <div className="flex-1">
                            <InputDatepicker
                                label={t('eventEdit.fields.endDate')}
                                value={event.endDate ?? ''}
                                onChange={(v) => handleFieldChange('endDate', v ? new Date(v as any) : undefined)}
                            />
                        </div>
                    )}
                </div>

                {/* Event Format */}
                <RadioGroup
                    label={t('eventEdit.fields.eventFormat')}
                    value={event.eventFormat ?? 'on-site'}
                    onChange={(v) => handleFieldChange('eventFormat', v)}
                    options={[
                        { value: 'virtual', label: t('eventEdit.fields.formatVirtual') },
                        { value: 'on-site', label: t('eventEdit.fields.formatOnSite') },
                    ]}
                />

                {/* Location — label and placeholder adapt to event format */}
                <InputTextfieldStateful
                    label={
                        event.eventFormat === 'virtual'
                            ? t('eventEdit.fields.locationVirtual')
                            : t('eventEdit.fields.locationOnSite')
                    }
                    placeholder={
                        event.eventFormat === 'virtual'
                            ? t('eventEdit.fields.locationVirtualPlaceholder')
                            : t('eventEdit.fields.locationOnSitePlaceholder')
                    }
                    defaultValue={event.location ?? ''}
                    onChange={(v) => handleFieldChange('location', String(v))}
                />

                {/* Colors */}
                <p className="text-sm font-semibold text-primary mt-3">
                    {t('eventEdit.sections.colors')}
                </p>
                <div className="flex gap-4">
                    <ColorField
                        label={t('eventEdit.fields.primaryColor')}
                        value={event.primaryColor ?? DEFAULT_PRIMARY_COLOR}
                        onChange={(v) => handleFieldChange('primaryColor', v)}
                    />
                    <ColorField
                        label={t('eventEdit.fields.accentColor')}
                        value={event.accentColor ?? DEFAULT_ACCENT_COLOR}
                        onChange={(v) => handleFieldChange('accentColor', v)}
                    />
                </div>

                {/* Color Preview */}
                <div className="h-8 rounded-lg border border-primary/10 flex overflow-hidden mt-1">
                    <div className="flex-1" style={{ backgroundColor: event.primaryColor ?? DEFAULT_PRIMARY_COLOR }} />
                    <div className="flex-1" style={{ backgroundColor: event.accentColor ?? DEFAULT_ACCENT_COLOR }} />
                </div>

                {/* Hero Image */}
                <p className="text-sm font-semibold text-primary mt-3">
                    {t('eventEdit.sections.heroImage')}
                </p>
                <div className="flex flex-col gap-1">
                    <label className="block text-xs font-medium text-primary/70">
                        {t('eventEdit.fields.heroImageUrl')}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={event.heroImageUrl ?? ''}
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
                            <span>{uploading ? t('eventEdit.fields.uploading') : t('eventEdit.fields.upload')}</span>
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

                {event.heroImageUrl && (
                    <img
                        src={event.heroImageUrl}
                        alt={t('eventEdit.fields.heroImagePreview')}
                        className="mt-1 h-36 w-full object-cover rounded-lg border border-primary/10"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).hidden = true;
                        }}
                        onLoad={(e) => {
                            (e.currentTarget as HTMLImageElement).hidden = false;
                        }}
                    />
                )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end mt-6 pb-4 gap-3">
                <button
                    type="button"
                    onClick={() => history.goBack()}
                    className="px-8 py-3 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-background transition-colors"
                >
                    {t('eventEdit.cancel')}
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-secondary text-primary text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <Icon icon={LuSave} size={16} />
                    <span>{saving ? `${t('eventEdit.save.pending')}...` : t('eventEdit.save.idle')}</span>
                </button>
            </div>
        </div>
    );
}
