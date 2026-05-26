import { useState, useCallback, type CSSProperties } from "react";

// --- Types ---

type FieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "checkbox"
  | "radio"
  | "multiselect"
  | "dropdown";

interface FieldTypeOption {
  value: FieldType;
  label: string;
  icon: string;
}

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
  options: string[];
}

interface FormConfigEntry {
  type: FieldType;
  required: boolean;
  placeholder?: string;
  label?: string;
  options?: string[];
}

type FormConfig = Record<string, FormConfigEntry>;

type FieldErrors = Record<string, string>;

// --- Constants ---

const FIELD_TYPES: FieldTypeOption[] = [
  { value: "text", label: "Text", icon: "Aa" },
  { value: "email", label: "Email", icon: "@" },
  { value: "phone", label: "Phone", icon: "☎" },
  { value: "textarea", label: "Textarea", icon: "¶" },
  { value: "checkbox", label: "Checkbox (agreement)", icon: "☑" },
  { value: "radio", label: "Single Choice (Radio)", icon: "◉" },
  { value: "multiselect", label: "Multiple Choice (Checkbox)", icon: "☑☑" },
  { value: "dropdown", label: "Dropdown (Single Choice)", icon: "▾" },
];

const TYPES_WITH_OPTIONS: FieldType[] = ["radio", "multiselect", "dropdown"];

const uid = (): string => Math.random().toString(36).slice(2, 9);

const defaultField = (): FormField => ({
  id: uid(),
  label: "",
  type: "text",
  placeholder: "",
  required: false,
  options: [],
});

// --- Sub-components ---

interface TypeDropdownProps {
  value: FieldType;
  onChange: (type: FieldType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function TypeDropdown({ value, onChange, isOpen, onToggle }: TypeDropdownProps) {
  const current = FIELD_TYPES.find((t) => t.value === value);
  return (
    <div style={{ position: "relative", minWidth: 220 }}>
      <button onClick={onToggle} style={styles.typeButton}>
        <span style={{ color: "#fbbf24", marginRight: 6, fontSize: 13 }}>
          {current?.icon}
        </span>
        {current?.label}
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>▾</span>
      </button>
      {isOpen && (
        <div style={styles.dropdown}>
          {FIELD_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                onChange(t.value);
                onToggle();
              }}
              style={{
                ...styles.dropdownItem,
                background: t.value === value ? "#fbbf24" : "transparent",
                color: t.value === value ? "#0f172a" : "#cbd5e1",
              }}
            >
              {t.value === value && (
                <span style={{ marginRight: 6 }}>✓</span>
              )}
              <span style={{ marginRight: 8, fontSize: 13 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface OptionsListProps {
  options: string[];
  onChange: (options: string[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function OptionsList({ options, onChange, onAdd, onRemove }: OptionsListProps) {
  return (
    <div style={styles.optionsBlock}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, letterSpacing: 0.5 }}>
        OPTIONS
      </div>
      {options.map((opt, i) => (
        <div key={i} style={styles.optionRow}>
          <input
            value={opt}
            onChange={(e) => {
              const next = [...options];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={`Option ${i + 1}`}
            style={styles.optionInput}
          />
          <button onClick={() => onRemove(i)} style={styles.optionRemove}>
            ×
          </button>
        </div>
      ))}
      <button onClick={onAdd} style={styles.addOptionBtn}>
        <span style={{ fontSize: 16, marginRight: 6 }}>⊕</span> Add Option
      </button>
    </div>
  );
}

interface FieldCardProps {
  field: FormField;
  index: number;
  onUpdate: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  error?: string;
}

function FieldCard({
  field,
  index,
  onUpdate,
  onRemove,
  openDropdown,
  setOpenDropdown,
  error,
}: FieldCardProps) {
  const needsOptions = TYPES_WITH_OPTIONS.includes(field.type);

  return (
    <div
      style={{
        ...styles.card,
        borderLeft: error ? "3px solid #ef4444" : "3px solid #fbbf2440",
      }}
    >
      {/* top row: index badge + delete */}
      <div style={styles.cardHeader}>
        <span style={styles.indexBadge}>{index + 1}</span>
        <button onClick={onRemove} style={styles.deleteBtn} title="Remove field">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Label + Placeholder row */}
      <div style={styles.fieldRow}>
        <div style={{ flex: 1 }}>
          <label style={styles.miniLabel}>Label</label>
          <input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="e.g. Full Name"
            style={{
              ...styles.input,
              borderColor: error ? "#ef4444" : "#334155",
            }}
          />
          {error && <div style={styles.errorText}>{error}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.miniLabel}>Placeholder</label>
          <input
            value={field.placeholder}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="e.g. John Doe"
            style={styles.input}
          />
        </div>
      </div>

      {/* Type selector + Required toggle */}
      <div style={styles.fieldRow}>
        <div>
          <label style={styles.miniLabel}>Type</label>
          <TypeDropdown
            value={field.type}
            onChange={(type: FieldType) => {
              const patch: Partial<FormField> = { type };
              if (TYPES_WITH_OPTIONS.includes(type) && field.options.length === 0) {
                patch.options = [""];
              }
              if (!TYPES_WITH_OPTIONS.includes(type)) {
                patch.options = [];
              }
              onUpdate(patch);
            }}
            isOpen={openDropdown === field.id}
            onToggle={() =>
              setOpenDropdown(openDropdown === field.id ? null : field.id)
            }
          />
        </div>

        <label style={styles.toggleLabel}>
          <span style={styles.miniLabel}>Required</span>
          <div
            onClick={() => onUpdate({ required: !field.required })}
            style={{
              ...styles.toggle,
              background: field.required ? "#fbbf24" : "#1e293b",
            }}
          >
            <div
              style={{
                ...styles.toggleKnob,
                transform: field.required ? "translateX(18px)" : "translateX(2px)",
              }}
            />
          </div>
        </label>
      </div>

      {/* Options (only for radio / multiselect / dropdown) */}
      {needsOptions && (
        <OptionsList
          options={field.options}
          onChange={(opts: string[]) => onUpdate({ options: opts })}
          onAdd={() => onUpdate({ options: [...field.options, ""] })}
          onRemove={(i: number) =>
            onUpdate({ options: field.options.filter((_, j) => j !== i) })
          }
        />
      )}
    </div>
  );
}

// --- Main component ---

export default function FormConfigBuilder() {
  const [fields, setFields] = useState<FormField[]>([defaultField()]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState<boolean>(false);
  const [jsonPreview, setJsonPreview] = useState<boolean>(false);

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

  // Build formConfig JSON
  const buildFormConfig = useCallback((): FormConfig => {
    const config: FormConfig = {};
    for (const f of fields) {
      const key = f.label
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
      if (!key) continue;
      const entry: FormConfigEntry = { type: f.type, required: f.required };
      if (f.placeholder) entry.placeholder = f.placeholder;
      if (f.label) entry.label = f.label.trim();
      if (TYPES_WITH_OPTIONS.includes(f.type)) {
        entry.options = f.options.filter((o) => o.trim() !== "");
      }
      config[key] = entry;
    }
    return config;
  }, [fields]);

  // Validate
  const validate = useCallback((): boolean => {
    const errs: FieldErrors = {};
    const seen = new Set<string>();
    for (const f of fields) {
      if (!f.label.trim()) {
        errs[f.id] = "Label is required";
      } else {
        const key = f.label.trim().toLowerCase();
        if (seen.has(key)) {
          errs[f.id] = "Duplicate label";
        }
        seen.add(key);
      }
      if (TYPES_WITH_OPTIONS.includes(f.type)) {
        const validOpts = f.options.filter((o) => o.trim() !== "");
        if (validOpts.length < 1) {
          errs[f.id] = errs[f.id] || "At least one option is required";
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fields]);

  const handleSave = (): void => {
    if (!validate()) return;
    const config = buildFormConfig();
    console.log("formConfig →", JSON.stringify(config, null, 2));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const formConfig = buildFormConfig();

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Form Builder</h1>
          <p style={styles.subtitle}>
            Define custom registration fields for your event
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setJsonPreview(!jsonPreview)}
            style={styles.previewBtn}
          >
            {jsonPreview ? "Hide" : "Show"} JSON
          </button>
          <button onClick={handleSave} style={styles.saveBtn}>
            {saved ? "✓ Saved" : "Save formConfig"}
          </button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Field cards */}
        <div style={styles.fieldsList}>
          {fields.map((field, i) => (
            <FieldCard
              key={field.id}
              field={field}
              index={i}
              onUpdate={(patch: Partial<FormField>) => updateField(field.id, patch)}
              onRemove={() => removeField(field.id)}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              error={errors[field.id]}
            />
          ))}

          <button onClick={addField} style={styles.addFieldBtn}>
            <span style={{ fontSize: 20, marginRight: 8 }}>＋</span> Add Field
          </button>
        </div>

        {/* JSON Preview Panel */}
        {jsonPreview && (
          <div style={styles.jsonPanel}>
            <div style={styles.jsonHeader}>
              <span style={{ fontSize: 12, letterSpacing: 1, color: "#94a3b8" }}>
                formConfig
              </span>
              <span style={styles.jsonBadge}>JSON</span>
            </div>
            <pre style={styles.jsonPre}>
              {JSON.stringify(formConfig, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Validation error summary */}
      {Object.keys(errors).length > 0 && (
        <div style={styles.errorBanner}>
          ⚠ Schema validation failed — fix highlighted fields before saving.
        </div>
      )}
    </div>
  );
}

// --- Styles ---

const styles: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', monospace",
    background: "#0b1120",
    minHeight: "100vh",
    color: "#e2e8f0",
    padding: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "28px 32px 20px",
    borderBottom: "1px solid #1e293b",
    background: "linear-gradient(180deg, #0f1729 0%, #0b1120 100%)",
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
    color: "#f8fafc",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#64748b",
    letterSpacing: 0.2,
  },
  previewBtn: {
    background: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  saveBtn: {
    background: "#fbbf24",
    color: "#0f172a",
    border: "none",
    borderRadius: 6,
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: 0.3,
  },
  body: {
    display: "flex",
    gap: 24,
    padding: "24px 32px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  fieldsList: {
    flex: "1 1 460px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },
  card: {
    background: "#111827",
    borderRadius: 10,
    padding: "18px 20px",
    border: "1px solid #1e293b",
    position: "relative",
    transition: "border-color .2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  indexBadge: {
    background: "#1e293b",
    color: "#fbbf24",
    borderRadius: 6,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
  },
  deleteBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 6,
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background .15s",
  },
  fieldRow: {
    display: "flex",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  miniLabel: {
    display: "block",
    fontSize: 11,
    color: "#64748b",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  input: {
    background: "#0b1120",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "9px 12px",
    color: "#e2e8f0",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color .15s",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 11,
    marginTop: 3,
  },
  typeButton: {
    background: "#0b1120",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "9px 12px",
    color: "#e2e8f0",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 4,
    minWidth: 220,
    textAlign: "left",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 50,
    minWidth: 240,
    boxShadow: "0 12px 32px rgba(0,0,0,.5)",
    marginTop: 4,
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "10px 14px",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    textAlign: "left",
    transition: "background .1s",
  },
  toggleLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    cursor: "pointer",
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    border: "1px solid #334155",
    position: "relative",
    cursor: "pointer",
    transition: "background .2s",
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    background: "#f8fafc",
    position: "absolute",
    top: 2,
    transition: "transform .2s",
    boxShadow: "0 1px 3px rgba(0,0,0,.3)",
  },
  optionsBlock: {
    marginTop: 4,
    padding: "12px 14px",
    background: "#0b1120",
    borderRadius: 8,
    border: "1px solid #1e293b",
  },
  optionRow: {
    display: "flex",
    gap: 8,
    marginBottom: 6,
    alignItems: "center",
  },
  optionInput: {
    flex: 1,
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: 5,
    padding: "7px 10px",
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  },
  optionRemove: {
    background: "transparent",
    border: "none",
    color: "#ef4444",
    fontSize: 18,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
  addOptionBtn: {
    background: "transparent",
    border: "1px dashed #334155",
    borderRadius: 5,
    color: "#64748b",
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    marginTop: 4,
  },
  addFieldBtn: {
    background: "#111827",
    border: "2px dashed #1e293b",
    borderRadius: 10,
    color: "#fbbf24",
    padding: "16px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color .15s, background .15s",
  },
  jsonPanel: {
    flex: "0 0 340px",
    background: "#111827",
    borderRadius: 10,
    border: "1px solid #1e293b",
    overflow: "hidden",
    position: "sticky",
    top: 24,
    maxHeight: "80vh",
  },
  jsonHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #1e293b",
  },
  jsonBadge: {
    background: "#fbbf2420",
    color: "#fbbf24",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
  },
  jsonPre: {
    margin: 0,
    padding: 16,
    fontSize: 12,
    lineHeight: 1.6,
    color: "#94a3b8",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  errorBanner: {
    margin: "0 32px 24px",
    padding: "10px 16px",
    background: "#7f1d1d20",
    border: "1px solid #7f1d1d",
    borderRadius: 8,
    color: "#fca5a5",
    fontSize: 13,
  },
};
