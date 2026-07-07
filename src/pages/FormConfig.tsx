import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { FormField, FormConfig as FormConfigType, FormConfigEntry, Event, MongoDate} from "../types/types";
import { FieldCard, TYPES_WITH_OPTIONS } from "../components/formConfig";
import { useParams } from 'react-router';
import {parseService} from "../services/parseService";
import {DEFAULT_ACCENT_COLOR, DEFAULT_PRIMARY_COLOR, EVENT_CLASS} from "../constants/eventDefaults";
type EventEditParams = { id: string };
const uid = (): string => Math.random().toString(36).slice(2, 9);

const defaultField = (): FormField => ({
  id: uid(),
  label: "",
  type: "text",
  placeholder: "",
  required: false,
  options: [],
  i18n: { pl: "", en: "" },
  optionsTranslation: []
});

export default function FormConfig() {
  const { t } = useTranslation();
  const { id } = useParams<EventEditParams>();

  const [fields, setFields] = useState<FormField[]>([defaultField()]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<boolean>(false);
  const [jsonPreview, setJsonPreview] = useState<boolean>(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    parseService
        .getById<Event>(EVENT_CLASS, id)
        .then((rawEvent) => {
          setEvent(rawEvent);
          if (rawEvent.formConfig) {
            setFields(configToFields(rawEvent.formConfig));
          }
        })
        .catch((e: any) => setError(e.message));
  }, []);

// Konwertuje formConfig z bazy → tablicę FormField[] do edycji
  const configToFields = (config: Record<string, unknown>): FormField[] => {
    const entries = Object.entries(config);
    if (entries.length === 0) return [defaultField()];

    return entries.map(([key, raw]) => {
      const entry = raw as FormConfigEntry;
      return {
        id: uid(),
        label: entry.label ?? key,
        type: entry.type ?? "text",
        placeholder: entry.placeholder ?? "",
        required: entry.required ?? false,
        options: entry.options ?? [],
        i18n: {
          pl: String(entry.i18n?.pl ?? ""),
          en: String(entry.i18n?.en ?? ""),
        },
        optionsTranslation: entry.optionsTranslation ?? [],
      };
    });
  };

  const updateField = useCallback((id: string, patch: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSaved(false);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSaved(false);
  }, []);

  const addField = useCallback(() => {
    setFields((prev) => [...prev, defaultField()]);
    setSaved(false);
  }, []);

  const buildFormConfig = useCallback((): FormConfigType => {
    const config: FormConfigType = {};
    for (const f of fields) {
      const key = f.label
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
      if (!key) continue;
      const i18nInstance = {
        en: f.i18n.en,
        pl: f.i18n.pl,
      }
      const entry: FormConfigEntry = { type: f.type, required: f.required, i18n: i18nInstance, optionsTranslation: f.optionsTranslation};
      if (f.placeholder) entry.placeholder = f.placeholder;
      if (f.label) entry.label = f.label.trim();
      if (TYPES_WITH_OPTIONS.includes(f.type)) {
        entry.options = f.options.filter((o) => o.trim() !== "");
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
        errs[f.id] = t("formConfig.errors.labelRequired");
      } else {
        const key = f.label.trim().toLowerCase();
        if (seen.has(key)) {
          errs[f.id] = t("formConfig.errors.duplicateLabel");
        }
        seen.add(key);
      }
      if (TYPES_WITH_OPTIONS.includes(f.type)) {
        const validOpts = f.options.filter((o) => o.trim() !== "");
        if (validOpts.length < 1) {
          errs[f.id] = errs[f.id] || t("formConfig.errors.optionRequired");
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fields, t]);

  const handleSave = (): void => {
    if (!validate()) return;
    const config = buildFormConfig();
    console.log("formConfig →", JSON.stringify(config, null, 2));
    parseService
        .update<Event>(EVENT_CLASS, id, { formConfig: config })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        })
        .catch((e: any) => setError(e.message));
    setSaved(true);

    setTimeout(() => setSaved(false), 2500);
  };

  const formConfig = buildFormConfig();
  return (
    <div className="font-mono bg-[#0b1120] min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex justify-between items-center px-8 pt-7 pb-5 border-b border-slate-800 bg-gradient-to-b from-[#0f1729] to-[#0b1120] flex-wrap gap-4">
        <div>
          <h1 className="m-0 text-[22px] font-bold -tracking-wide text-slate-50">
            {t("formConfig.title")}
          </h1>
          <p className="mt-1 mb-0 text-[13px] text-slate-500 tracking-wide">
            {t("formConfig.subtitle")}
          </p>
        </div>
        <div className="flex gap-2.5 items-center">
          <button
            onClick={() => setJsonPreview(!jsonPreview)}
            className="bg-slate-800 text-slate-400 border border-slate-700 rounded-md px-4 py-2 text-[13px] font-mono cursor-pointer hover:bg-slate-700 transition-colors"
          >
            {jsonPreview ? t("formConfig.hideJson") : t("formConfig.showJson")}
          </button>
          <button
            onClick={handleSave}
            className="bg-amber-400 text-slate-900 border-none rounded-md px-5 py-2 text-[13px] font-bold font-mono cursor-pointer tracking-wide hover:bg-amber-300 transition-colors"
          >
            {saved ? `✓ ${t("formConfig.saved")}` : t("formConfig.save")}
          </button>
        </div>
      </div>

      <div className="flex gap-6 px-8 py-6 items-start flex-wrap">
        {/* Field cards */}
        <div className="flex-[1_1_460px] flex flex-col gap-4 min-w-0">
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
            className="bg-gray-900 border-2 border-dashed border-slate-800 rounded-[10px] text-amber-400 px-5 py-4 text-sm font-semibold font-mono cursor-pointer flex items-center justify-center hover:border-slate-600 hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl mr-2">＋</span>
            {t("formConfig.addField")}
          </button>
        </div>

        {/* JSON Preview */}
        {jsonPreview && (
          <div className="flex-[0_0_340px] bg-gray-900 rounded-[10px] border border-slate-800 overflow-auto sticky top-6 max-h-[80vh]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800">
              <span className="text-xs tracking-wider text-slate-400">
                formConfig
              </span>
              <span className="bg-amber-400/10 text-amber-400 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider">
                JSON
              </span>
            </div>
            <pre className="m-0 p-4 text-xs leading-relaxed text-slate-400 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(formConfig, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Validation error banner */}
      {Object.keys(errors).length > 0 && (
        <div className="mx-8 mb-6 px-4 py-2.5 bg-red-900/10 border border-red-900 rounded-lg text-red-300 text-[13px]">
          ⚠ {t("formConfig.errors.validationFailed")}
        </div>
      )}
    </div>
  );
}
// TODO: Unifikacja tworzenia pól formularza na podstawie formConfig (string czy text, choice czy dropdown etc)
// TODO: event.formConfig is null ? event.formConfig : buildFormConfig()
// TODO: Poprawa tła, ale to drugorzędne
// TODO: Przewijalny JSON formConfiga