import { useTranslation } from "react-i18next";
import type { FieldType } from "../../types/types";
import { FIELD_TYPES } from "./constants";

interface TypeDropdownProps {
  value: FieldType;
  onChange: (type: FieldType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function TypeDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
}: TypeDropdownProps) {
  const { t } = useTranslation();
  const current = FIELD_TYPES.find((ft) => ft.value === value);

  return (
    <div className="relative min-w-[220px]">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 w-full min-w-[220px] bg-background border border-primary/20 rounded-md px-3 py-2 text-primary text-sm font-mono cursor-pointer text-left"
      >
        <span className="text-secondary mr-1.5 text-[13px]">{current?.icon}</span>
        {current ? t(current.labelKey) : ""}
        <span className="ml-auto opacity-50">▾</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-surface-2 border border-primary/20 rounded-lg overflow-hidden z-50 min-w-[240px] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          {FIELD_TYPES.map((ft) => {
            const isSelected = ft.value === value;
            return (
              <button
                key={ft.value}
                onClick={() => {
                  onChange(ft.value);
                  onToggle();
                }}
                className={`flex items-center w-full px-3.5 py-2.5 border-none cursor-pointer text-sm font-mono text-left transition-colors duration-100 ${
                  isSelected
                    ? "bg-secondary text-brand"
                    : "bg-transparent text-primary hover:bg-surface-2"
                }`}
              >
                {isSelected && <span className="mr-1.5">✓</span>}
                <span className="mr-2 text-[13px]">{ft.icon}</span>
                {t(ft.labelKey)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
