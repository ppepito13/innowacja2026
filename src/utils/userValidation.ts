import { EMAIL_REGEX } from './regex';

export type UserFieldErrors = Partial<Record<'fullName' | 'email', string>>;

export function validateUserFields(
  fields: { fullName?: string; email?: string },
  t: (key: string) => string,
): UserFieldErrors {
  const errors: UserFieldErrors = {};
  const fullName = fields.fullName?.trim() ?? '';
  const email = fields.email?.trim() ?? '';

  if (!fullName) errors.fullName = t('users.validation.fullNameRequired');

  if (!email) errors.email = t('users.validation.emailRequired');
  else if (!EMAIL_REGEX.test(email)) errors.email = t('users.validation.emailInvalid');

  return errors;
}
