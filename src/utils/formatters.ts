import i18n from '../i18n';

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(date),
  );

export const formatColumnName = (columnName: string) =>
  columnName
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatBoolean = (value: string | boolean) => {
  const t = i18n.getFixedT();

  switch (String(value)) {
    case 'true':
      return t('common.boolean.true');
    case 'false':
      return t('common.boolean.false');
    default:
      return String(value);
  }
};
