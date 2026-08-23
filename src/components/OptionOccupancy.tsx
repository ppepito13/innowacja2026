import { useTranslation } from 'react-i18next';
import type { Event, FormConfig, FormConfigEntry } from '../types/types';
import { getFieldOptions, getOptionLabel, getOptionLimit } from '../utils/formOptions';
import type { AvailabilityMap } from '../hooks/useOptionAvailability';

interface OptionOccupancyProps {
  event: Event | null;
  availability: AvailabilityMap;
}

/**
 * Obłożenie opcji z limitem — „Analiza danych: 8/10”.
 * Renderuje się tylko wtedy, gdy event faktycznie ma jakieś limity.
 */
export default function OptionOccupancy({ event, availability }: OptionOccupancyProps) {
  const { t, i18n } = useTranslation();

  const fields = Object.entries((event?.formConfig ?? {}) as FormConfig).filter(
    ([fieldKey]) => availability[fieldKey] && Object.keys(availability[fieldKey]).length > 0,
  );

  if (fields.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {fields.map(([fieldKey, rawField]) => {
        const field = rawField as FormConfigEntry;
        const limited = getFieldOptions(field).filter((option) => getOptionLimit(option) !== null);

        return (
          <div key={fieldKey} className="rounded-xl border border-primary/10 p-4">
            <h3 className="text-sm font-bold mt-0 mb-3">
              {String(field.i18n?.[i18n.language as 'pl' | 'en'] ?? field.label ?? fieldKey)}
            </h3>

            <div className="flex flex-col gap-2">
              {limited.map((option) => {
                const stats = availability[fieldKey]?.[option.id];
                if (!stats) return null;

                const ratio = Math.min(100, (stats.used / stats.limit) * 100);
                const isFull = stats.remaining === 0;

                return (
                  <div key={option.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-primary/80 truncate pr-2">
                        {getOptionLabel(option, i18n.language)}
                      </span>
                      <span
                        className={`font-bold whitespace-nowrap ${
                          isFull ? 'text-error' : 'text-primary/70'
                        }`}
                      >
                        {stats.used} / {stats.limit}
                      </span>
                    </div>

                    <div className="w-full rounded-full h-1.5 bg-primary/10">
                      <div
                        className={`rounded-full h-1.5 transition-all ${
                          isFull ? 'bg-error' : 'bg-secondary'
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-[11px] text-primary/50 m-0">{t('registrations.occupancyHint')}</p>
    </div>
  );
}
