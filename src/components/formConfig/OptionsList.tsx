import { useTranslation } from "react-i18next";

interface OptionsListProps {
  options: string[];
  onChange: (options: string[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function OptionsList({
  options,
  onChange,
  onAdd,
  onRemove,
}: OptionsListProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-1 p-3 bg-[#0b1120] rounded-lg border border-slate-800">
      <div className="text-xs text-slate-400 mb-1.5 tracking-wider uppercase">
        {t("formConfig.options")}
      </div>

      {options.map((opt, i) => (
        <div key={i} className="flex gap-2 mb-1.5 items-center">
          <input
            value={opt}
            onChange={(e) => {
              const next = [...options];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={`${t("formConfig.option")} ${i + 1}`}
            className="flex-1 bg-gray-900 border border-slate-700 rounded-[5px] px-2.5 py-[7px] text-slate-200 text-sm font-mono outline-none focus:border-slate-500"
          />
          <button
            onClick={() => onRemove(i)}
            className="bg-transparent border-none text-red-500 cursor-pointer p-1 hover:text-red-400 transition-colors"
            title={t("formConfig.removeOption")}
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
        </div>
      ))}

      <button
        onClick={onAdd}
        className="flex items-center mt-1 bg-transparent border border-dashed border-slate-700 rounded-[5px] text-slate-500 px-3 py-1.5 text-xs font-mono cursor-pointer hover:border-slate-500 hover:text-slate-400 transition-colors"
      >
        <span className="text-base mr-1.5">⊕</span>
        {t("formConfig.addOption")}
      </button>
    </div>
  );
}
