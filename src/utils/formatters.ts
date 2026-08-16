import i18next from 'i18next';
import type { Locale } from '../types/types';
import { toLocale } from './localizedEvent';

const DATE_LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-GB',
  pl: 'pl-PL',
};

const activeLanguage = () => (i18next as unknown as { language?: string }).language;

export const dateLocaleTag = (language?: string): string => DATE_LOCALE_TAGS[toLocale(language ?? activeLanguage())];

export const formatDate = (date: string, language?: string) =>
    new Intl.DateTimeFormat(dateLocaleTag(language), { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(date),
    );

export const formatColumnName = (columnName: string) =>
    columnName
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatCellValue = (value: string | boolean, t: (key: string) => string): string => {
  switch (String(value)) {
    case 'true':
      return t('common.boolean.true');
    case 'false':
      return t('common.boolean.false');
    default:
      return String(value);
  }
};
