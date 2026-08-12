import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '../types/types';
import { LOCALES, DEFAULT_LOCALE } from '../utils/localizedEvent';

interface LocalizedFieldProps {
  label: string;
  error?: string;
  children: (locale: Locale, languageName: string) => ReactNode;
}

export default function LocalizedField({ label, error, children }: LocalizedFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1">
      <span className="block text-sm font-bold text-primary mt-3 mb-1">{label}</span>
      <div className="flex flex-col gap-3">
        {LOCALES.map((locale) => {
          const languageName = t(`common.locale.${locale}`);
          return (
            <div key={locale} className="flex flex-col min-w-0">
              <span className="block text-[11px] text-primary/60 tracking-wider uppercase mb-1">
                {languageName}
                {locale === DEFAULT_LOCALE && ` · ${t('common.localePrimary')}`}
              </span>
              {children(locale, `${label} (${languageName})`)}
            </div>
          );
        })}
      </div>
      {error && <div className="text-error text-xs mt-1">{error}</div>}
    </div>
  );
}
