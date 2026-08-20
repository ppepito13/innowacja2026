import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  FormField,
  FormConfig as FormConfigType,
  FormConfigEntry,
  Event,
} from '../types/types';
import { FieldCard, TYPES_WITH_OPTIONS } from '../components/formConfig';
import { useParams, useHistory } from 'react-router';
import { LuArrowLeft } from 'react-icons/lu';
import Icon from '../components/Icon';
import { parseService } from '../services/parseService';
import { EVENT_CLASS } from '../constants/eventDefaults';

type EventEditParams = { id: string };
const uid = (): string => Math.random().toString(36).slice(2, 9);

/**
 * `formConfig` jest kolumną na rekordzie TestEvent, więc bez zapisanego
 * wydarzenia nie ma go gdzie zapisać. Trasa /admin/events/new nie ma
 * parametru :id, przez co useParams zwraca undefined — stąd wcześniejsze
 * zapytania o TestEvent/undefined kończące się błędem 404.
 */
const hasValidEventId = (id?: string): boolean =>
  Boolean(id) && id !== 'new' && id !== 'undefined';

const defaultField = (): FormField => ({
  id: uid(),
  label: '',
  type: 'text',
  placeholder: '',
  required: false,
  options: [],
  i18n: { pl: '', en: '' },
  optionsTranslation: [],
});

export default function FormConfig() {
  const { t } = useTranslation();
  const { id } = useParams<EventEditParams>();
  const history = useHistory();

  const [hasChanged, setHasChanged] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [fields, setFields] = useState<FormField[]>([defaultField()]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<boolean>(false);
  const [jsonPreview, setJsonPreview] = useState<boolean>(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Konwertuje formConfig z bazy → tablicę FormField[] do edycji
  const configToFields = useCallback((config: Record<string, unknown>): FormField[] => {
    const entries = Object.entries(config);
    if (entries.length === 0) return [defaultField()];

    return entries.map(([key, raw]) => {
      const entry = raw as FormConfigEntry;
      return {
        id: uid(),
        label: entry.label ?? key,
        type: entry.type ?? 'text',
        placeholder: entry.placeholder ?? '',
        required: entry.required ?? false,
        options: entry.options ?? [],
        i18n: {
          pl: String(entry.i18n?.pl ?? ''),
          en: String(entry.i18n?.en ?? ''),
        },
        optionsTranslation: entry.optionsTranslation ?? [],
      };
    });
  }, []);

  useEffect(() => {
    if (!hasValidEventId(id)) {
      setError(t('formConfig.errors.saveEventFirst'));
      return;
    }

    parseService
      .getById<Event>(EVENT_CLASS, id)
      .then((rawEvent) => {
        setEvent(rawEvent);
        if (rawEvent.formConfig) {
          setFields(configToFields(rawEvent.formConfig));
        }
      })
      .catch((e: any) => setError(e.message));
  }, [id, configToFields, t]);

  const updateField = useCallback((fieldId: string, patch: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setSaved(false);
    setHasChanged(true);
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    setSaved(false);
    setHasChanged(true);
  }, []);

  const addField = useCallback(() => {
    setFields((prev) => [...prev, defaultField()]);
    setSaved(false);
    setHasChanged(true);
  }, []);

  const buildFormConfig = useCallback((): FormConfigType => {
    const config: FormConfigType = {};

    for (const f of fields) {
      const key = f.label
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase();
      if (!key) continue;

      const i18nInstance = {
        en: f.i18n.en,
        pl: f.i18n.pl,
      };

      const entry: FormConfigEntry = {
        type: f.type,
        required: f.required,
        i18n: i18nInstance,
        optionsTranslation: f.optionsTranslation,
      };

      if (f.placeholder) entry.placeholder = f.placeholder;
      if (f.label) entry.label = f.label.trim();
      if (TYPES_WITH_OPTIONS.includes(f.type)) {
        entry.options = f.options.filter((o) => o.trim() !== '');
      }

      config[key] = entry;
    }

    return config;
  }, [fields]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const seen = new Set<string>();

    for (const f of fields) {
      if (!f.label.trim()) {
        errs[f.id] = t('formConfig.errors.labelRequired');
      } else {
        const key = f.label.trim().toLowerCase();
        if (seen.has(key)) {
          errs[f.id] = t('formConfig.errors.duplicateLabel');
        }
        seen.add(key);
      }

      if (TYPES_WITH_OPTIONS.includes(f.type)) {
        const validOpts = f.options.filter((o) => o.trim() !== '');
        if (validOpts.length < 1) {
          errs[f.id] = errs[f.id] || t('formConfig.errors.optionRequired');
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fields, t]);

  const persist = (onDone: () => void): void => {
    // Bez tego przycisk zapisu klika się i cicho nic nie robi.
    if (!hasValidEventId(id)) {
      setError(t('formConfig.errors.saveEventFirst'));
      return;
    }

    if (!validate()) return;

    const config = buildFormConfig();

    parseService
      .update<Event>(EVENT_CLASS, id, { formConfig: config })
      .then(() => {
        setHasChanged(false);
        onDone();
      })
      .catch((e: any) => setError(e.message));
  };

  const handleSave = (): void =>
    persist(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });

  const handleSaveAndExit = (): void => persist(() => history.goBack());

  const handleBackClick = (): void => {
    if (hasChanged) {
      setShowLeaveModal(true);
    } else {
      history.goBack();
    }
  };

  // Wejście na kreator bez zapisanego wydarzenia (np. wpisany ręcznie URL
  // albo zakładka) — zamiast surowego 404 pokazujemy, co trzeba zrobić.
  if (!hasValidEventId(id)) {
    return (
      <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-4xl">
        <h1 className="text-3xl mb-0">{t('formConfig.title')}</h1>
        <p className="text-lg mt-0 text-primary/75">{t('formConfig.subtitle')}</p>

        <div className="mt-6 rounded-xl border border-primary/15 bg-surface-2 px-5 py-6">
          <p className="text-sm text-primary mt-0">{t('formConfig.errors.saveEventFirst')}</p>

          <button
            onClick={() => history.goBack()}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 bg-transparent text-sm text-primary cursor-pointer hover:bg-background transition-colors"
          >
            <Icon icon={LuArrowLeft} size={14} />
            {t('formConfig.back')}
          </button>
        </div>
      </div>
    );
  }

  const formConfig = buildFormConfig();

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
        <div>
          <h1 className="text-3xl mb-0">{t('formConfig.title')}</h1>
          <p className="text-lg mt-0 text-primary/75">{t('formConfig.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBackClick}
            className="self-start flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 bg-transparent text-sm text-primary cursor-pointer hover:bg-background transition-colors"
          >
            <Icon icon={LuArrowLeft} size={14} />
            {t('formConfig.back')}
          </button>
          <button
            onClick={() => setJsonPreview(!jsonPreview)}
            className="self-start px-4 py-2 rounded-lg border border-primary/20 bg-transparent text-sm text-primary cursor-pointer hover:bg-background transition-colors"
          >
            {jsonPreview ? t('formConfig.hideJson') : t('formConfig.showJson')}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex flex-col gap-6 mt-2 w-full">
        {/* Field cards */}
        <div className="flex flex-col gap-4 w-full min-w-0">
          {fields.map((field, i) => (
            <FieldCard
              key={field.id}
              field={field}
              index={i}
              onUpdate={(patch) => updateField(field.id, patch)}
              onRemove={() => removeField(field.id)}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              error={errors[field.id]}
            />
          ))}

          <button
            onClick={addField}
            className="bg-transparent border-2 border-dashed border-primary/20 rounded-lg text-primary/70 px-5 py-4 text-sm font-bold cursor-pointer flex items-center justify-center hover:border-primary/40 hover:bg-background transition-colors"
          >
            <span className="text-xl mr-2">＋</span>
            {t('formConfig.addField')}
          </button>
        </div>

        {/* JSON Preview */}
        {jsonPreview && (
          <div className="w-full bg-surface-2 rounded-lg border border-primary/10 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-primary/10">
              <span className="text-xs tracking-wider text-primary/70">formConfig</span>
              <span className="bg-secondary text-brand rounded px-2 py-0.5 text-[10px] font-bold tracking-wider">
                JSON
              </span>
            </div>
            <pre className="m-0 p-4 text-xs font-mono leading-relaxed text-primary/80 overflow-auto max-h-96 whitespace-pre-wrap break-words">
              {JSON.stringify(formConfig, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer: validation error + save */}
      <div className="flex flex-col items-end mt-6 pb-4 gap-2">
        {Object.keys(errors).length > 0 && (
          <p className="text-sm text-error mt-0 mb-0">
            ⚠ {t('formConfig.errors.validationFailed')}
          </p>
        )}
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-full bg-secondary text-brand text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          {saved ? `✓ ${t('formConfig.saved')}` : t('formConfig.save')}
        </button>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cb-black/40 px-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full border border-primary/10">
            <h2 className="text-lg font-bold mb-2">{t('formConfig.unsavedTitle')}</h2>
            <p className="text-sm text-primary/70 mb-6">{t('formConfig.unsavedDescription')}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAndExit}
                className="px-4 py-2 rounded-xl bg-secondary text-brand text-sm font-bold hover:opacity-90 transition-opacity"
              >
                {t('formConfig.saveAndExit')}
              </button>
              <button
                onClick={() => history.goBack()}
                className="px-4 py-2 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-background transition-colors"
              >
                {t('formConfig.exitWithoutSaving')}
              </button>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 rounded-xl text-primary/60 text-sm hover:bg-background transition-colors"
              >
                {t('formConfig.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// TODO: Unifikacja tworzenia pól formularza na podstawie formConfig (string czy text, choice czy dropdown etc)
// TODO: Poprawa tła, ale to drugorzędne
