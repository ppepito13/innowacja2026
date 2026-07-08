import { useTranslation } from "react-i18next";
import { optionsTranslation } from "../../types/types";
import i18n from "../../i18n";

interface OptionsListProps {
    options: string[];
    optionsTranslation: optionsTranslation[];
    onChange: (options: string[]) => void;
    onChangeTranslation: (translations: optionsTranslation[]) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

export default function OptionsList({
                                        options,
                                        optionsTranslation,
                                        onChange,
                                        onChangeTranslation,
                                        onAdd,
                                        onRemove,
                                    }: OptionsListProps) {
    const { t } = useTranslation();

    return (
        <div className="mt-1 p-3 bg-[#0b1120] rounded-lg border border-slate-800">
            {/* Nagłówki kolumn */}
            <div className="flex gap-2 mb-1.5 items-center">
                <div className="flex-1 text-xs text-slate-400 tracking-wider uppercase">
                    {t("formConfig.options")}
                </div>
                <div className="flex-1 text-xs text-slate-400 tracking-wider uppercase">
                    {t("formConfig.i18nPl")}
                </div>
                <div className="flex-1 text-xs text-slate-400 tracking-wider uppercase">
                    {t("formConfig.i18nEn")}
                </div>
                <div className="w-8" />
            </div>

            {/* Wiersze opcji */}
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
                    <input
                        value={optionsTranslation[i]?.i18n?.pl ?? ""}
                        onChange={(e) => {
                            const next = optionsTranslation.map((item, j) =>
                                j === i ? { ...item, i18n: { ...item.i18n, pl: e.target.value } } : item
                            );
                            onChangeTranslation(next);
                        }}
                        placeholder={`PL ${i + 1}`}
                        className="flex-1 bg-gray-900 border border-slate-700 rounded-[5px] px-2.5 py-[7px] text-slate-200 text-sm font-mono outline-none focus:border-slate-500"
                    />
                    <input
                        value={optionsTranslation[i]?.i18n?.en ?? ""}
                        onChange={(e) => {
                            const next = optionsTranslation.map((item, j) =>
                                j === i ? { ...item, i18n: { ...item.i18n, en: e.target.value } } : item
                            );
                            onChangeTranslation(next);
                        }}
                        placeholder={`EN ${i + 1}`}
                        className="flex-1 bg-gray-900 border border-slate-700 rounded-[5px] px-2.5 py-[7px] text-slate-200 text-sm font-mono outline-none focus:border-slate-500"
                    />
                    <button
                        onClick={() => onRemove(i)}
                        className="bg-transparent border-none text-red-500 cursor-pointer p-1 hover:text-red-400 transition-colors"
                        title={t("formConfig.removeOption")}
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M5 2h6M2 4h12M6 4v8M10 4v8M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            ))}

            {/* Dodaj opcję */}
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
