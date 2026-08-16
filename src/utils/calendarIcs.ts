import { Event } from '../types/types';
import { localizedEventField } from './localizedEvent';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcs(text: string): string {
  return text.replace(/[\\;,\n]/g, (c) => {
    if (c === '\n') return '\\n';
    return '\\' + c;
  });
}

export function downloadIcsFile(event: Event, language?: string) {
  const title = localizedEventField(event, 'title', language);
  const location = localizedEventField(event, 'location', language);
  const startIso = event.startDate.iso ?? event.startDate.date?.toISOString() ?? '';
  const endIso = event.endDate?.iso ?? event.endDate?.date?.toISOString() ?? startIso;

  const start = toIcsDate(startIso);
  const end = toIcsDate(endIso);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Commerzbank Wydarzenia//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(title)}`,
    location ? `LOCATION:${escapeIcs(location)}` : '',
    `URL:${window.location.href}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
