export const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(
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