import type { FieldType, FormConfig, FormConfigEntry } from '../types/types';
import { withUniqueField } from './uniqueFields';

export const MANDATORY_FIELD_KEYS = ['firstName', 'lastName', 'email'] as const;

export type MandatoryFieldKey = (typeof MANDATORY_FIELD_KEYS)[number];

interface MandatoryFieldDefinition {
  type: FieldType;
  label: string;
  i18n: { en: string; pl: string };
}

const MANDATORY_FIELDS: Record<MandatoryFieldKey, MandatoryFieldDefinition> = {
  firstName: { type: 'text', label: 'First name', i18n: { en: 'First name', pl: 'Imię' } },
  lastName: { type: 'text', label: 'Last name', i18n: { en: 'Last name', pl: 'Nazwisko' } },
  email: { type: 'email', label: 'Email', i18n: { en: 'Email', pl: 'Adres e-mail' } },
};

export const isMandatoryFieldKey = (key: string): key is MandatoryFieldKey =>
  (MANDATORY_FIELD_KEYS as readonly string[]).includes(key);

interface MandatoryFieldOptions {
  englishOnly?: boolean;
}

const translationsFor = (
  definition: MandatoryFieldDefinition,
  stored: FormConfigEntry | undefined,
  englishOnly: boolean,
): { en: string; pl: string } => {
  const en = String(stored?.i18n?.en ?? '') || definition.i18n.en;
  if (englishOnly) return { en, pl: en };

  return { en, pl: String(stored?.i18n?.pl ?? '') || definition.i18n.pl };
};

export function withMandatoryFields(
  config: FormConfig | Record<string, unknown> | undefined,
  { englishOnly = false }: MandatoryFieldOptions = {},
): FormConfig {
  const source = (config ?? {}) as FormConfig;
  const merged: FormConfig = {};

  for (const key of MANDATORY_FIELD_KEYS) {
    const definition = MANDATORY_FIELDS[key];
    const stored = source[key];

    merged[key] = {
      ...stored,
      type: definition.type,
      required: true,
      label: stored?.label || definition.label,
      i18n: translationsFor(definition, stored, englishOnly),
      optionsTranslation: stored?.optionsTranslation ?? [],
    };
  }

  for (const [key, entry] of Object.entries(source)) {
    if (!isMandatoryFieldKey(key)) merged[key] = entry;
  }

  return withUniqueField(merged);
}