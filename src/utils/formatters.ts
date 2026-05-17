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
  switch (String(value)) {
    case 'true':
      return 'Yes';
    case 'false':
      return 'No';
    default:
      return String(value);
  }
};
