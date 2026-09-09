import type { FormConfig } from '../types/types';

export const DEFAULT_UNIQUE_FIELD_KEY = 'email';

export function uniqueFieldKeys(config: FormConfig | Record<string, unknown> | undefined): string[] {
  const source = (config ?? {}) as FormConfig;
  const marked = Object.entries(source)
    .filter(([, entry]) => entry?.unique === true)
    .map(([key]) => key);

  if (marked.length > 0) return marked;

  return source[DEFAULT_UNIQUE_FIELD_KEY] ? [DEFAULT_UNIQUE_FIELD_KEY] : [];
}

export function withUniqueField(
  config: FormConfig | Record<string, unknown> | undefined,
): FormConfig {
  const source = { ...((config ?? {}) as FormConfig) };
  if (Object.values(source).some((entry) => entry?.unique === true)) return source;

  const fallback = source[DEFAULT_UNIQUE_FIELD_KEY];
  if (fallback) source[DEFAULT_UNIQUE_FIELD_KEY] = { ...fallback, unique: true };

  return source;
}

export const canReleaseUniqueField = (
  fields: { key?: string; unique?: boolean }[],
  field: { key?: string; unique?: boolean },
): boolean => !field.unique || fields.filter((f) => f.unique).length > 1;
