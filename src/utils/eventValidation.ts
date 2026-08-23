import type { Event } from '../types/types';
import { primaryValue } from './localizedEvent';

export type EventErrorField =
  | 'title'
  | 'startDate'
  | 'endDate'
  | 'location'
  | 'meetingLink'
  | 'capacity';

export type EventFieldErrors = Partial<Record<EventErrorField, string>>;

export const EVENT_ERROR_FIELDS: EventErrorField[] = [
  'title',
  'startDate',
  'endDate',
  'location',
  'meetingLink',
  'capacity',
];

export interface ValidateEventOptions {
  storedStartTime?: number | null;
  now?: Date;
}

export const isValidDate = (value?: Date): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const startOfDay = (value: Date): number =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

export function validateEvent(
  event: Event,
  { storedStartTime = null, now = new Date() }: ValidateEventOptions = {},
): EventFieldErrors {
  const errors: EventFieldErrors = {};

  if (!primaryValue(event.i18n?.title)) errors.title = 'titleRequired';

  const start = event.startDate?.date;
  const end = event.endDate?.date;
  
  if (!isValidDate(start)) {
    errors.startDate = 'startDateRequired';
  } else if (start.getTime() !== storedStartTime && startOfDay(start) < startOfDay(now)) {
    errors.startDate = 'startDateInPast';
  }

  if (event.dateType === 'multi') {
    if (!isValidDate(end)) {
      errors.endDate = 'endDateRequired';
    } else if (isValidDate(start) && end.getTime() <= start.getTime()) {
      errors.endDate = 'endDateBeforeStart';
    }
  }

  if (event.eventFormat !== 'virtual' && !primaryValue(event.i18n?.location)) {
    errors.location = 'locationRequired';
  }

  if (event.eventFormat !== 'on-site' && !event.meetingLink?.trim()) {
    errors.meetingLink = 'meetingLinkRequired';
  }

  if (event.capacity != null && (!Number.isInteger(event.capacity) || event.capacity < 1)) {
    errors.capacity = 'capacityInvalid';
  }

  return errors;
}
