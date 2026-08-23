import { useCallback, useEffect, useState } from 'react';
import { parseService } from '../services/parseService';

export interface OptionAvailability {
  limit: number;
  used: number;
  remaining: number;
}

/** { [fieldKey]: { [optionId]: { limit, used, remaining } } } */
export type AvailabilityMap = Record<string, Record<string, OptionAvailability>>;

/**
 * Obłożenie opcji z limitem dla danego eventu.
 *
 * Dane są z natury nieaktualne w momencie wyświetlenia — ktoś może zająć
 * miejsce, gdy formularz stoi otwarty. Służą wyłącznie do podpowiedzi w UI;
 * jedyną prawdą jest walidacja w beforeSave. Stąd `refresh` — wołany po
 * odrzuconym zapisie, żeby użytkownik zobaczył aktualny stan.
 */
export function useOptionAvailability(eventId?: string) {
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const result = await parseService.runFunction<AvailabilityMap>('getOptionAvailability', {
        eventId,
      });
      setAvailability(result ?? {});
    } catch {
      // Brak dostępności nie może blokować rejestracji — dropdown po prostu
      // nie pokaże liczb, a limit i tak wymusi serwer.
      setAvailability({});
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { availability, loading, refresh };
}

/** Skrót używany w renderze opcji. `undefined` = opcja bez limitu. */
export const optionAvailability = (
  availability: AvailabilityMap,
  fieldKey: string,
  optionId: string,
): OptionAvailability | undefined => availability?.[fieldKey]?.[optionId];
