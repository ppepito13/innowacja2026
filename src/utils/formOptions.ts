import type { FieldType, FormConfigEntry, Locale, optionsTranslation } from '../types/types';
import { toLocale } from './localizedEvent';

/**
 * Jedyne miejsce, które wie jak z `formConfig` wyciągnąć opcje pola,
 * zamienić zapisany w `formData` klucz na etykietę i odczytać limit.
 *
 * Kontrakt: w `formData` trzymamy `optionsTranslation[].id` (klucz stabilny),
 * NIGDY etykiety. Etykieta jest wyłącznie do wyświetlenia i zależy od języka.
 */

/** Typy pól, dla których w ogóle istnieją opcje (a więc i limity). */
export const FIELD_TYPES_WITH_OPTIONS: FieldType[] = ['dropdown', 'multiselect', 'radio'];

export const hasOptions = (field: FormConfigEntry): boolean =>
  FIELD_TYPES_WITH_OPTIONS.includes(field.type);

/** Wybór wielokrotny — wartość w `formData` jest tablicą kluczy, nie stringiem. */
export const isMultiValue = (field: FormConfigEntry): boolean =>
  field.type === 'multiselect';

/**
 * Zwraca opcje pola w jednolitym kształcie.
 *
 * Obsługuje trzy pokolenia danych:
 *  1. `optionsTranslation` z limitami (docelowy),
 *  2. `optionsTranslation` bez limitów,
 *  3. samo `options: string[]` (najstarsze eventy) — wtedy etykieta pełni rolę klucza.
 */
export const getFieldOptions = (field: FormConfigEntry | undefined): optionsTranslation[] => {
  if (!field) return [];

  if (Array.isArray(field.optionsTranslation) && field.optionsTranslation.length > 0) {
    return field.optionsTranslation;
  }

  return (field.options ?? []).map((value) => ({
    id: value,
    i18n: { pl: value, en: value },
  }));
};

export const getOptionLabel = (option: optionsTranslation, language?: string): string => {
  const locale: Locale = toLocale(language);
  return option.i18n?.[locale] || option.i18n?.en || option.i18n?.pl || option.id;
};

/**
 * Wszystkie wartości, po których rozpoznajemy tę opcję w `formData`:
 * aktualny klucz + migawka starych etykiet. Ta sama lista trafia do
 * zapytania zliczającego w Cloud Code.
 */
export const optionMatchValues = (option: optionsTranslation): string[] => {
  const values = [option.id, ...(option.legacyValues ?? [])]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  return Array.from(new Set(values));
};

/**
 * Migawka wartości, jakie mogą siedzieć w starych rejestracjach: wartość
 * bazowa opcji i obie etykiety. Robiona RAZ, przy nadaniu klucza.
 */
export const snapshotLegacyValues = (
  option: optionsTranslation,
  baseValue: string,
): string[] => {
  const values = [baseValue, option.i18n?.pl, option.i18n?.en]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  return Array.from(new Set(values));
};

/**
 * Klucz -> opcja. Dopasowanie po `legacyValues` i po bieżących etykietach
 * sprawia, że rejestracje sprzed wprowadzenia kluczy wyświetlają się
 * poprawnie bez przepisywania bazy.
 */
export const findOption = (
  field: FormConfigEntry | undefined,
  storedValue: unknown,
): optionsTranslation | undefined => {
  const value = String(storedValue ?? '');
  if (!value) return undefined;

  const options = getFieldOptions(field);

  return (
    options.find((option) => option.id === value) ??
    options.find((option) => (option.legacyValues ?? []).includes(value)) ??
    options.find((option) => option.i18n?.pl === value || option.i18n?.en === value)
  );
};

/** Zapisana wartość -> etykieta w bieżącym języku. Nieznane wartości zwraca bez zmian. */
export const resolveOptionValue = (
  field: FormConfigEntry | undefined,
  storedValue: unknown,
  language?: string,
): string => {
  if (Array.isArray(storedValue)) {
    return storedValue.map((item) => resolveOptionValue(field, item, language)).join(', ');
  }

  const option = findOption(field, storedValue);

  return option ? getOptionLabel(option, language) : String(storedValue ?? '');
};

// --- LIMITY ---

/** `null` = brak limitu. Wartości <= 0 traktujemy jak brak limitu, nie jak "zero miejsc". */
export const getOptionLimit = (option: optionsTranslation): number | null =>
  typeof option.limit === 'number' && option.limit > 0 ? option.limit : null;

export const fieldHasLimits = (field: FormConfigEntry | undefined): boolean =>
  getFieldOptions(field).some((option) => getOptionLimit(option) !== null);

/** Wszystkie limity eventu, spłaszczone: { [fieldKey]: { [optionId]: limit } }. */
export const collectLimits = (
  formConfig: Record<string, unknown> | undefined,
): Record<string, Record<string, number>> => {
  const result: Record<string, Record<string, number>> = {};

  Object.entries(formConfig ?? {}).forEach(([fieldKey, rawField]) => {
    const field = rawField as FormConfigEntry;
    if (!hasOptions(field)) return;

    const limits: Record<string, number> = {};

    getFieldOptions(field).forEach((option) => {
      const limit = getOptionLimit(option);
      if (limit !== null) limits[option.id] = limit;
    });

    if (Object.keys(limits).length > 0) result[fieldKey] = limits;
  });

  return result;
};

// --- EDYTOR ---

const SLUG_DIACRITICS: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

/**
 * Generuje klucz z etykiety. Wołane RAZ, przy dodaniu opcji w edytorze —
 * późniejsza zmiana etykiety nie może zmienić klucza, bo zerwałaby powiązanie
 * z istniejącymi rejestracjami.
 */
export const makeOptionId = (label: string, existingIds: string[] = []): string => {
  const base =
    label
      .toLowerCase()
      .split('')
      .map((char) => SLUG_DIACRITICS[char] ?? char)
      .join('')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'opcja';

  if (!existingIds.includes(base)) return base;

  let suffix = 2;
  while (existingIds.includes(`${base}-${suffix}`)) suffix += 1;

  return `${base}-${suffix}`;
};
