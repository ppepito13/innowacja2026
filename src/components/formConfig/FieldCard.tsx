import { useTranslation } from "react-i18next";
import type { FieldType, FormField } from "../../types/types";
import { TYPES_WITH_OPTIONS } from "./constants";
import TypeDropdown from "./TypeDropdown";
import OptionsList from "./OptionsList";
import Toggle from "../Toggle";

interface FieldCardProps {
  field: FormField;
  index: number;
  onUpdate: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  error?: string;
  locked?: boolean;
}

/** Pusty wiersz opcji. `id` zostanie nadane po wpisaniu wartości (OptionsList). */
const emptyOptionRow = () => ({ id: "", i18n: { pl: "", en: "" }, limit: null });

export default function FieldCard({
  field,
  index,
  onUpdate,
  onRemove,
  openDropdown,
  setOpenDropdown,
  error,
  locked = false,
}: FieldCardProps) {
  const { t } = useTranslation();
  const needsOptions = TYPES_WITH_OPTIONS.includes(field.type);

  return (
    <div
      className={`rounded-lg border p-5 relative transition-colors duration-200 ${
        error ? "border-error/60" : "border-primary/10"
      }`}
    >
      {/* Header: index badge + delete */}
      <div className="flex justify-between items-center mb-3.5">
        <span className="bg-secondary text-brand rounded-md px-2.5 py-0.5 text-xs font-bold tracking-wider">
          {index + 1}
        </span>
        {locked ? (
          <span className="text-[11px] text-primary/50">{t("formConfig.lockedField")}</span>
        ) : (
          <button
            onClick={onRemove}
            className="bg-transparent border border-primary/10 rounded-lg w-[30px] h-[30px] flex items-center justify-center cursor-pointer text-error hover:bg-background transition-colors"
            title={t("formConfig.removeField")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 2h6M2 4h12M6 4v8M10 4v8M3 4l1 10h8l1-10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Label + Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-book text-primary/70 mb-1.5">
            {t("formConfig.label")}
          </label>
          <input
            value={field.label}
            readOnly={locked}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={t("formConfig.labelPlaceholder")}
            className={`w-full bg-surface-2 border rounded-md px-1 py-2 text-sm font-mono outline-none transition-colors focus:border-cb-coast ${
              error ? "border-error" : "border-primary/15"
            } ${locked ? "text-primary/50 cursor-not-allowed" : "text-primary"}`}
          />
          {error && <div className="text-error text-xs mt-1">{error}</div>}
          {/* Klucz pola — po zapisie niezmienny, bo wiążą się z nim rejestracje. */}
          {field.key && (
            <div className="text-[10px] text-primary/40 font-mono mt-1">
              {t("formConfig.fieldKey")}: {field.key}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-book text-primary/70 mb-1.5">
            {t("formConfig.placeholder")}
          </label>
          <input
            value={field.placeholder}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder={t("formConfig.placeholderPlaceholder")}
            className="w-full bg-surface-2 border border-primary/15 rounded-md px-1 py-2 text-primary text-sm font-mono outline-none transition-colors focus:border-cb-coast"
          />
        </div>
      </div>

      {/* Type + Required */}
      <div className="flex gap-4 mb-3 flex-wrap items-end">
        <div>
          <label className="block text-xs font-book text-primary/70 mb-1.5">
            {t("formConfig.type")}
          </label>
          {locked ? (
            <div className="bg-surface-2 border border-primary/15 rounded-md px-3 py-2 text-primary/50 text-sm">
              {t(`formConfig.fieldType.${field.type}`)}
            </div>
          ) : (
          <TypeDropdown
            value={field.type}
            onChange={(type: FieldType) => {
              const patch: Partial<FormField> = { type };

              // Obie tablice zmieniamy razem — inaczej pierwsza opcja
              // nowego dropdownu nie ma wpisu w optionsTranslation
              // i nie da się jej przetłumaczyć.
              if (TYPES_WITH_OPTIONS.includes(type)) {
                if (field.options.length === 0) {
                  patch.options = [""];
                  patch.optionsTranslation = [emptyOptionRow()];
                }
              } else {
                patch.options = [];
                patch.optionsTranslation = [];
              }

              onUpdate(patch);
            }}
            isOpen={openDropdown === field.id}
            onToggle={() =>
              setOpenDropdown(openDropdown === field.id ? null : field.id)
            }
          />
          )}
        </div>

        <label className="flex flex-col items-start gap-1.5 cursor-pointer pb-1">
          <span className="block text-xs font-book text-primary/70">
            {t("formConfig.required")}
          </span>
          <Toggle
            checked={locked ? true : field.required}
            disabled={locked}
            onChange={(v) => onUpdate({ required: v })}
          />
        </label>
        <div className="w-32">
          <label className="block text-[11px] text-primary/60 tracking-wider uppercase mb-1">
            {t("formConfig.i18nPl")}
          </label>
          <input
              value={field.i18n.pl}
              onChange={(e) => onUpdate({ i18n: { ...field.i18n, pl: e.target.value } })}
              className="w-full bg-surface-2 border border-primary/15 rounded-md px-1 py-2 text-primary text-sm font-mono outline-none transition-colors focus:border-cb-coast"
          />
        </div>
        <div className="w-32">
          <label className="block text-[11px] text-primary/60 tracking-wider uppercase mb-1">
            {t("formConfig.i18nEn")}
          </label>
          <input
              value={field.i18n.en}
              onChange={(e) => onUpdate({ i18n: { ...field.i18n, en: e.target.value } })}
              className="w-full bg-surface-2 border border-primary/15 rounded-md px-1 py-2 text-primary text-sm font-mono outline-none transition-colors focus:border-cb-coast"
          />
        </div>
      </div>

      {/* Options (radio / multiselect / dropdown only) */}
      {needsOptions && (
        <OptionsList
          options={field.options}
          optionsTranslation={field.optionsTranslation}
          onChange={(patch) => onUpdate(patch)}
          onAdd={() => onUpdate({
            options: [...field.options, ""],
            optionsTranslation: [...field.optionsTranslation, emptyOptionRow()],
          })}
          onRemove={(i: number) => onUpdate({
            options: field.options.filter((_, j) => j !== i),
            optionsTranslation: field.optionsTranslation.filter((_, j) => j !== i),
          })}
        />
      )}
    </div>
  );
}
