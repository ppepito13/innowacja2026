export interface ExportColumn<T> {
  header: string;
  getValue: (row: T) => string;
}

interface ExportRegistrationsOptions<T> {
  eventTitle: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

const DELIMITER = '|';

const POLISH_DIACRITICS_MAP: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
  Ą: 'A',
  Ć: 'C',
  Ę: 'E',
  Ł: 'L',
  Ń: 'N',
  Ó: 'O',
  Ś: 'S',
  Ź: 'Z',
  Ż: 'Z',
};

function removePolishDiacritics(input: string): string {
  const withoutPolishChars = input
    .split('')
    .map((char) => POLISH_DIACRITICS_MAP[char] ?? char)
    .join('');

  return withoutPolishChars.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function sanitizeFilenamePart(input: string): string {
  const sanitized = removePolishDiacritics(input)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return sanitized || 'Wydarzenie';
}

function buildFilename(eventTitle: string): string {
  const safeTitle = sanitizeFilenamePart(eventTitle);
  const date = new Date().toISOString().slice(0, 10);

  return `Eksport_${safeTitle}_${date}.csv`;
}

function escapeField(value: string): string {
  const stringValue = value ?? '';
  const needsQuoting =
    stringValue.includes(DELIMITER) ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (!needsQuoting) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function exportRegistrationsToCsv<T>({
  eventTitle,
  columns,
  rows,
}: ExportRegistrationsOptions<T>): void {
  if (rows.length === 0) {
    return;
  }

  const headerRow = columns.map((column) => escapeField(column.header));
  const dataRows = rows.map((row) => columns.map((column) => escapeField(column.getValue(row))));

  const content = [headerRow, ...dataRows].map((row) => row.join(DELIMITER)).join('\r\n');
  const filename = buildFilename(eventTitle);

  downloadCsv(content, filename);
}
