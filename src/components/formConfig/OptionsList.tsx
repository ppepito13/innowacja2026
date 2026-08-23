import { useTranslation } from "react-i18next";
import type { FormField, optionsTranslation } from "../../types/types";
import { makeOptionId, snapshotLegacyValues } from "../../utils/formOptions";

interface OptionsListProps {
    options: string[];
    optionsTranslation: optionsTranslation[];
    /** Zawsze zwraca OBIE tablice naraz — trzymanie ich w jednym patchu
     *  jest jedynym sposobem, żeby nie mogły się rozjechać. */
    onChange: (patch: Pick<FormField, "options" | "optionsTranslation">) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

/**
 * Wyrównuje długość obu tablic. Potrzebne dla eventów zapisanych wcześniejszą
 * wersją edytora, gdzie przełączenie typu pola tworzyło `options` bez
 * odpowiadającego wpisu w `optionsTranslation`.
 */
const normalizeRows = (
    options: string[],
    optionsTranslation: optionsTranslation[],
): { value: string; option: optionsTranslation }[] => {
    const length = Math.max(options.length, optionsTranslation.length);

    return Array.from({ length }, (_, i) => ({
        value: options[i] ?? optionsTranslation[i]?.i18n?.pl ?? "",
        option: optionsTranslation[i] ?? { id: "", i18n: { pl: "", en: "" } },
    }));
};

const toArrays = (
    rows: { value: string; option: optionsTranslation }[],
): Pick<FormField, "options" | "optionsTranslation"> => ({
    options: rows.map((row) => row.value),
    optionsTranslation: rows.map((row) => row.option),
});

export default function OptionsList({
                                        options,
                                        optionsTranslation,
                                        onChange,
                                        onAdd,
                                        onRemove,
                                    }: OptionsListProps) {
    const { t } = useTranslation();
    const rows = normalizeRows(options, optionsTranslation);

    const patchRow = (
        index: number,
        update: (row: { value: string; option: optionsTranslation }) => {
            value: string;
            option: optionsTranslation;
        },
    ) => {
        onChange(toArrays(rows.map((row, i) => (i === index ? update(row) : row))));
    };

    /**
     * Klucz nadawany jest RAZ — przy pierwszym opuszczeniu pola z niepustą
     * wartością. Późniejsze edycje tekstu go nie ruszają, bo po kluczu
     * wiążemy istniejące rejestracje i limity.
     *
     * Razem z kluczem zapisujemy migawkę `legacyValues`: wartości, jakie ta
     * opcja mogła przyjąć w rejestracjach sprzed wprowadzenia kluczy. Dzięki
     * temu stare wiersze liczą się do limitu bez przepisywania bazy.
     */
    const assignIdIfMissing = (index: number) => {
        const row = rows[index];
        if (row.option.id || !row.value.trim()) return;

        const takenIds = rows.map((item) => item.option.id).filter(Boolean);

        patchRow(index, (current) => ({
            ...current,
            option: {
                ...current.option,
                id: makeOptionId(current.value, takenIds),
                legacyValues:
                    current.option.legacyValues ?? snapshotLegacyValues(current.option, current.value),
            },
        }));
    };

    return (
        <div className="mt-1 p-3 bg-background rounded-lg border border-primary/15">
            {/* Nagłówki kolumn */}
            <div className="flex gap-2 mb-1.5 items-center">
                <div className="flex-1 text-xs text-primary/60 tracking-wider uppercase">
                    {t("formConfig.options")}
                </div>
                <div className="flex-1 text-xs text-primary/60 tracking-wider uppercase">
                    {t("formConfig.i18nPl")}
                </div>
                <div className="flex-1 text-xs text-primary/60 tracking-wider uppercase">
                    {t("formConfig.i18nEn")}
                </div>
                <div className="w-20 text-xs text-primary/60 tracking-wider uppercase">
                    {t("formConfig.optionLimit")}
                </div>
                <div className="w-8" />
            </div>

            {/* Wiersze opcji */}
            {rows.map((row, i) => (
                <div key={row.option.id || `row-${i}`} className="mb-1.5">
                    <div className="flex gap-2 items-center">
                        <input
                            value={row.value}
                            onChange={(e) =>
                                patchRow(i, (current) => ({ ...current, value: e.target.value }))
                            }
                            onBlur={() => assignIdIfMissing(i)}
                            placeholder={`${t("formConfig.option")} ${i + 1}`}
                            className="flex-1 bg-surface-2 border border-primary/15 rounded-[5px] px-2.5 py-[7px] text-primary text-sm font-mono outline-none focus:border-cb-coast"
                        />
                        <input
                            value={row.option.i18n?.pl ?? ""}
                            onChange={(e) =>
                                patchRow(i, (current) => ({
                                    ...current,
                                    option: {
                                        ...current.option,
                                        i18n: { ...current.option.i18n, pl: e.target.value },
                                    },
                                }))
                            }
                            placeholder={`PL ${i + 1}`}
                            className="flex-1 bg-surface-2 border border-primary/15 rounded-[5px] px-2.5 py-[7px] text-primary text-sm font-mono outline-none focus:border-cb-coast"
                        />
                        <input
                            value={row.option.i18n?.en ?? ""}
                            onChange={(e) =>
                                patchRow(i, (current) => ({
                                    ...current,
                                    option: {
                                        ...current.option,
                                        i18n: { ...current.option.i18n, en: e.target.value },
                                    },
                                }))
                            }
                            placeholder={`EN ${i + 1}`}
                            className="flex-1 bg-surface-2 border border-primary/15 rounded-[5px] px-2.5 py-[7px] text-primary text-sm font-mono outline-none focus:border-cb-coast"
                        />
                        <input
                            type="number"
                            min={1}
                            step={1}
                            value={row.option.limit ?? ""}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = Number.parseInt(raw, 10);

                                patchRow(i, (current) => ({
                                    ...current,
                                    option: {
                                        ...current.option,
                                        limit: raw === "" || Number.isNaN(parsed) ? null : Math.max(1, parsed),
                                    },
                                }));
                            }}
                            placeholder="∞"
                            title={t("formConfig.optionLimitHint")}
                            className="w-20 bg-surface-2 border border-primary/15 rounded-[5px] px-2.5 py-[7px] text-primary text-sm font-mono outline-none focus:border-cb-coast"
                        />
                        <button
                            onClick={() => onRemove(i)}
                            className="bg-transparent border-none text-error cursor-pointer p-1 hover:text-error/80 transition-colors"
                            title={t("formConfig.removeOption")}
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M5 2h6M2 4h12M6 4v8M10 4v8M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Klucz — tylko do odczytu. Po zapisie wiążą się z nim rejestracje. */}
                    {row.option.id && (
                        <div className="text-[10px] text-primary/40 font-mono pl-1 mt-0.5">
                            {t("formConfig.optionKey")}: {row.option.id}
                        </div>
                    )}
                </div>
            ))}

            {/* Dodaj opcję */}
            <button
                onClick={onAdd}
                className="flex items-center mt-1 bg-transparent border border-dashed border-primary/15 rounded-[5px] text-primary/60 px-3 py-1.5 text-xs font-mono cursor-pointer hover:border-cb-coast hover:text-primary transition-colors"
            >
                <span className="text-base mr-1.5">⊕</span>
                {t("formConfig.addOption")}
            </button>
        </div>
    );
}
