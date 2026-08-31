import type {
  Event,
  EventI18n,
  Locale,
  LocalizedText,
  TranslatableEventField,
} from '../types/types';

export const LOCALES: Locale[] = ['en', 'pl'];

export const DEFAULT_LOCALE: Locale = LOCALES[0];

export const TRANSLATABLE_EVENT_FIELDS: TranslatableEventField[] = [
  'title',
  'description',
  'location',
  'dataProcessingAgreement',
];

export const emptyLocalizedText = (): LocalizedText => ({ en: '', pl: '' });

export const toLocale = (language?: string): Locale =>
  LOCALES.find((locale) => language?.toLowerCase().startsWith(locale)) ?? DEFAULT_LOCALE;

export const primaryValue = (text?: LocalizedText): string => {
  if (!text) return '';
  const filled = LOCALES.map((locale) => text[locale]?.trim()).find(Boolean);
  return filled ?? '';
};

export function localizedEventField(
  event: Pick<Event, TranslatableEventField | 'i18n'> | null | undefined,
  field: TranslatableEventField,
  language?: string,
): string {
  if (!event) return '';
  const locale = toLocale(language);
  const translations = event.i18n?.[field];
  return (
    translations?.[locale]?.trim() ||
    event[field]?.trim() ||
    primaryValue(translations) ||
    ''
  );
}

export function eventI18nFromEvent(event: Partial<Event>): EventI18n {
  const seeded: EventI18n = {};
  for (const field of TRANSLATABLE_EVENT_FIELDS) {
    const stored = event.i18n?.[field];
    seeded[field] = {
      ...emptyLocalizedText(),
      ...stored,
      [DEFAULT_LOCALE]: stored?.[DEFAULT_LOCALE] || event[field] || '',
    };
  }
  return seeded;
}

export function mirrorDefaultLocale(i18n: EventI18n | undefined): EventI18n {
  const mirrored: EventI18n = {};
  for (const field of TRANSLATABLE_EVENT_FIELDS) {
    const source = i18n?.[field]?.[DEFAULT_LOCALE] ?? '';
    mirrored[field] = LOCALES.reduce(
      (acc, locale) => ({ ...acc, [locale]: source }),
      emptyLocalizedText(),
    );
  }
  return mirrored;
}

export function buildEventI18n(
  i18n: EventI18n | undefined,
  transform: Partial<Record<TranslatableEventField, (value: string) => string>> = {},
): EventI18n {
  const payload: EventI18n = {};
  for (const field of TRANSLATABLE_EVENT_FIELDS) {
    const text = i18n?.[field] ?? emptyLocalizedText();
    const apply = transform[field] ?? ((value: string) => value.trim());
    payload[field] = LOCALES.reduce((acc, locale) => {
      const value = text[locale] ?? '';
      return { ...acc, [locale]: value ? apply(value) : '' };
    }, emptyLocalizedText());
  }
  return payload;
}
