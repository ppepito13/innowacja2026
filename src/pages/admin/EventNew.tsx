import { useRef, useState } from 'react';
import { useHistory } from 'react-router';
import { LuPlus, LuArrowLeft, LuUpload } from 'react-icons/lu';
import { InputDatepicker, InputTextfieldStateful } from '@lsg/components';
import { parseService } from '../../services/parseService';
import { Event } from '../../types/types';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon';
import ColorField from '../../components/ColorField';
import RadioGroup from '../../components/RadioGroup';
import parseClient from '../../services/parseClient';

const EVENT_CLASS = 'TestEvent';

export default function EventNew() {
    const { t } = useTranslation();
    const history = useHistory();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateType, setDateType] = useState<'single' | 'multi'>('single');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [eventFormat, setEventFormat] = useState<'virtual' | 'on-site'>('on-site');
    const [location, setLocation] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#002e3c');
    const [accentColor, setAccentColor] = useState('#ffd700');
    const [heroImageUrl, setHeroImageUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDateTypeChange = (value: 'single' | 'multi') => {
        setDateType(value);
        if (value === 'single') setEndDate(null);
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const { data } = await parseClient.post(
                `/files/${encodeURIComponent(file.name)}`,
                file,
                { headers: { 'Content-Type': file.type } },
            );
            setHeroImageUrl(data.url);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = () => {
        setSaving(true);
        setError(null);

        const payload: Record<string, unknown> = {
            title,
            description,
            dateType,
            eventFormat,
            location,
            primaryColor,
            accentColor,
            heroImageUrl,
            isActive: false,
            formConfig: {},
            ...(startDate && { startDate: { __type: 'Date', iso: startDate.toISOString() } }),
            ...(dateType === 'multi' && endDate && { endDate: { __type: 'Date', iso: endDate.toISOString() } }),
        };

        parseService
            .create<Event>(EVENT_CLASS, payload as any)
            .then(({ objectId }) => history.push(`/admin/events/${objectId}/edit`))
            .catch((e: any) => setError(e.message))
            .finally(() => setSaving(false));
    };

    return (
        <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-[640px]">
            {/* HEADER */}
            <div className="flex flex-row items-center justify-between mb-2">
                <div className="flex flex-col">
                    <h1 className="text-3xl mb-0">{t('eventNew.title')}</h1>
                    <p className="text-lg mt-0 text-primary/75">{t('eventNew.subtitle')}</p>
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
                    label={t('eventNew.fields.title')}
                    placeholder={t('eventNew.fields.title')}
                    defaultValue=""
                    onChange={(v) => setTitle(String(v))}
                />

                {/* Description */}
                <InputTextfieldStateful
                    label={t('eventNew.fields.description')}
                    placeholder={t('eventNew.fields.descriptionPlaceholder')}
                    defaultValue=""
                    textArea={true}
                    onChange={(v) => setDescription(String(v))}
                />

                {/* Date Type */}
                <RadioGroup
                    label={t('eventNew.fields.dateType')}
                    value={dateType}
                    onChange={handleDateTypeChange}
                    options={[
                        { value: 'single', label: t('eventNew.fields.dateTypeSingle') },
                        { value: 'multi', label: t('eventNew.fields.dateTypeMulti') },
                    ]}
                />

                {/* Dates */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <InputDatepicker
                            label={t('eventNew.fields.startDate')}
                            value={startDate ?? ''}
                            onChange={(v) => setStartDate(v ? new Date(v as any) : null)}
                        />
                    </div>
                    {dateType === 'multi' && (
                        <div className="flex-1">
                            <InputDatepicker
                                label={t('eventNew.fields.endDate')}
                                value={endDate ?? ''}
                                onChange={(v) => setEndDate(v ? new Date(v as any) : null)}
                            />
                        </div>
                    )}
                </div>

                {/* Event Format */}
                <RadioGroup
                    label={t('eventNew.fields.eventFormat')}
                    value={eventFormat}
                    onChange={setEventFormat}
                    options={[
                        { value: 'virtual', label: t('eventNew.fields.formatVirtual') },
                        { value: 'on-site', label: t('eventNew.fields.formatOnSite') },
                    ]}
                />

                {/* Location — label and placeholder adapt to event format */}
                <InputTextfieldStateful
                    label={
                        eventFormat === 'virtual'
                            ? t('eventNew.fields.locationVirtual')
                            : t('eventNew.fields.locationOnSite')
                    }
                    placeholder={
                        eventFormat === 'virtual'
                            ? t('eventNew.fields.locationVirtualPlaceholder')
                            : t('eventNew.fields.locationOnSitePlaceholder')
                    }
                    defaultValue=""
                    onChange={(v) => setLocation(String(v))}
                />

                {/* Colors */}
                <p className="text-sm font-semibold text-primary mt-3">
                    {t('eventNew.sections.colors')}
                </p>
                <div className="flex gap-4">
                    <ColorField
                        label={t('eventNew.fields.primaryColor')}
                        value={primaryColor}
                        onChange={setPrimaryColor}
                    />
                    <ColorField
                        label={t('eventNew.fields.accentColor')}
                        value={accentColor}
                        onChange={setAccentColor}
                    />
                </div>

                {/* Color Preview */}
                <div className="h-8 rounded-lg border border-primary/10 flex overflow-hidden mt-1">
                    <div className="flex-1" style={{ backgroundColor: primaryColor }} />
                    <div className="flex-1" style={{ backgroundColor: accentColor }} />
                </div>

                {/* Hero Image */}
                <p className="text-sm font-semibold text-primary mt-3">
                    {t('eventNew.sections.heroImage')}
                </p>
                <div className="flex flex-col gap-1">
                    <label className="block text-xs font-medium text-primary/70">
                        {t('eventNew.fields.heroImageUrl')}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={heroImageUrl}
                            onChange={(e) => setHeroImageUrl(e.target.value)}
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
                            <span>{uploading ? t('eventNew.fields.uploading') : t('eventNew.fields.upload')}</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>

                {heroImageUrl && (
                    <img
                        src={heroImageUrl}
                        alt={t('eventNew.fields.heroImagePreview')}
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
                    {t('eventNew.cancel')}
                </button>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving || uploading}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-secondary text-primary text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <Icon icon={LuPlus} size={16} />
                    <span>{saving ? `${t('eventNew.create.pending')}...` : t('eventNew.create.idle')}</span>
                </button>
            </div>
        </div>
    );
}
