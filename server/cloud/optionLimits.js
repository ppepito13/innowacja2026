/**
 * Limity miejsc na poszczególne opcje pól formularza (np. temat/zadanie).
 *
 * Rezerwują: pending, approved.
 * Zwalniają:  rejected, cancelled, usunięcie rejestracji.
 *
 * Limit jest identyfikowany parą (fieldKey, optionId) i czytany z
 * `TestEvent.formConfig[fieldKey].optionsTranslation[].limit`.
 * W `Registration.formData[fieldKey]` musi siedzieć `optionsTranslation[].id`,
 * nie etykieta — patrz migracja z etapu 1.
 */

const EVENT_CLASS = 'TestEvent';
const REGISTRATION_CLASS = 'Registration';

/** Statusy, które zajmują miejsce. */
const RESERVING_STATUSES = ['pending', 'approved'];

/** Typy pól, dla których limity mają sens. */
const TYPES_WITH_OPTIONS = ['dropdown', 'multiselect', 'radio'];

/** Role, które mogą świadomie przekroczyć limit. */
const PRIVILEGED_ROLES = ['Admin', 'Organizer'];

/** Bezpiecznik na wypadek eventu z ogromną liczbą zgłoszeń. */
const AVAILABILITY_PAGE_SIZE = 1000;
const AVAILABILITY_MAX_PAGES = 20;

/**
 * Wyciąga z formConfig mapę { [fieldKey]: { [optionId]: limit } }.
 * Odpowiednik `collectLimits` z src/utils/formOptions.ts — te dwie
 * implementacje muszą pozostać zgodne.
 */
function collectLimits(formConfig) {
  const result = {};

  Object.entries(formConfig || {}).forEach(([fieldKey, field]) => {
    if (!field || !TYPES_WITH_OPTIONS.includes(field.type)) return;
    if (!Array.isArray(field.optionsTranslation)) return;

    const limits = {};

    field.optionsTranslation.forEach((option) => {
      if (!option || !option.id) return;
      if (typeof option.limit !== 'number' || option.limit <= 0) return;

      // Rejestracje sprzed wprowadzenia kluczy trzymają w formData etykietę,
      // nie id. Liczymy jedne i drugie, dzięki czemu nie trzeba przepisywać
      // istniejących wierszy w bazie.
      const match = [option.id, ...(Array.isArray(option.legacyValues) ? option.legacyValues : [])]
        .map((value) => String(value == null ? '' : value).trim())
        .filter(Boolean);

      limits[option.id] = {
        limit: option.limit,
        match: Array.from(new Set(match)),
      };
    });

    if (Object.keys(limits).length > 0) result[fieldKey] = limits;
  });

  return result;
}

/** Multiselect trzyma tablicę, reszta pojedynczą wartość. */
function toValues(raw) {
  if (raw === undefined || raw === null || raw === '') return [];

  return (Array.isArray(raw) ? raw : [raw])
    .map((value) => String(value))
    .filter(Boolean);
}

/**
 * Ile miejsc na daną opcję jest już zajętych.
 * `excludeId` pomija samą edytowaną rejestrację, żeby nie liczyła się podwójnie.
 */
async function countUsed(eventPointer, fieldKey, matchValues, excludeId) {
  const query = new Parse.Query(REGISTRATION_CLASS);

  query.equalTo('event', eventPointer);
  // Dot-notation działa na kolumnach typu Object; dla tablic (multiselect)
  // Mongo dopasowuje zawieranie elementu, czyli dokładnie to, czego chcemy.
  // containedIn (a nie equalTo) obejmuje też stare etykiety — patrz collectLimits.
  query.containedIn(`formData.${fieldKey}`, matchValues);
  query.containedIn('status', RESERVING_STATUSES);

  if (excludeId) query.notEqualTo('objectId', excludeId);

  return query.count({ useMasterKey: true });
}

function optionFullError(fieldKey, optionId, limit) {
  // Ustrukturyzowana treść, żeby front wiedział, KTÓRE pole odrzucić.
  // Uwaga: nie zawiera słowa "full" małymi literami — istniejąca obsługa
  // błędu pojemności eventu w EventDetails sprawdza `includes('full')`
  // i nie może się z tym pomylić.
  return new Parse.Error(
    Parse.Error.VALIDATION_ERROR,
    JSON.stringify({ code: 'OPTION_FULL', field: fieldKey, option: optionId, limit }),
  );
}

/**
 * Override może włączyć wyłącznie zalogowany admin/organizator.
 * Bez tego sprawdzenia dowolny uczestnik dopisałby sobie `limitOverride: true`
 * do POST-a i limit przestałby cokolwiek znaczyć.
 */
function isPrivileged(request) {
  if (request.master) return true;

  const user = request.user;
  if (!user) return false;

  return PRIVILEGED_ROLES.includes(user.get('role'));
}

Parse.Cloud.beforeSave(REGISTRATION_CLASS, async (request) => {
  const registration = request.object;
  const original = request.original; // undefined przy tworzeniu

  const status = registration.get('status') || 'pending';

  // Status nierezerwujący (rejected/cancelled) — miejsce właśnie się zwalnia,
  // nie ma czego sprawdzać.
  if (!RESERVING_STATUSES.includes(status)) return;

  // ETAP 5: świadome przekroczenie limitu przez organizatora.
  if (registration.get('limitOverride') === true) {
    if (!isPrivileged(request)) {
      throw new Parse.Error(
        Parse.Error.OPERATION_FORBIDDEN,
        'limitOverride requires an organizer session',
      );
    }
    return;
  }

  const eventPointer = registration.get('event');
  if (!eventPointer || !eventPointer.id) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Registration requires an event pointer');
  }

  const formData = registration.get('formData') || {};

  // Czy poprzedni stan już rezerwował miejsca? Jeśli tak, opcje niezmienione
  // są opłacone i nie wymagają ponownego sprawdzania.
  const wasReserving = Boolean(original) && RESERVING_STATUSES.includes(original.get('status'));
  const previousFormData = wasReserving ? original.get('formData') || {} : {};

  // Nic istotnego się nie zmieniło — omijamy zapytania do bazy.
  const relevantChange = !original || !wasReserving || registration.dirty('formData');

  if (!relevantChange) return;

  const eventQuery = new Parse.Query(EVENT_CLASS);
  const event = await eventQuery.get(eventPointer.id, { useMasterKey: true });

  const limits = collectLimits(event.get('formConfig'));
  if (Object.keys(limits).length === 0) return;

  for (const [fieldKey, optionLimits] of Object.entries(limits)) {
    const requested = toValues(formData[fieldKey]);
    const alreadyHeld = toValues(previousFormData[fieldKey]);

    for (const value of requested) {
      // Zapisana wartość może być kluczem albo starą etykietą — szukamy opcji,
      // która rozpoznaje którąkolwiek z nich.
      const entry = Object.entries(optionLimits).find(([, config]) =>
        config.match.includes(value),
      );

      if (!entry) continue; // opcja bez limitu albo wartość spoza formConfig

      const [optionId, config] = entry;

      // Ta opcja była już zarezerwowana przez tę rejestrację — bez zmian.
      if (alreadyHeld.some((held) => config.match.includes(held))) continue;

      const used = await countUsed(eventPointer, fieldKey, config.match, registration.id);

      if (used >= config.limit) {
        throw optionFullError(fieldKey, optionId, config.limit);
      }
    }
  }
});

/**
 * ETAP 4 — publiczny odczyt obłożenia.
 *
 * Zwraca WYŁĄCZNIE liczby: { [fieldKey]: { [optionId]: { limit, used, remaining } } }.
 * Żadnych danych osobowych, więc formularz publiczny może to wołać bez
 * otwierania klasy Registration do odczytu.
 *
 * Liczymy jednym przejściem po rejestracjach zamiast osobnym `count` na opcję —
 * przy kilkunastu opcjach to różnica między 1 a 15 zapytaniami.
 */
Parse.Cloud.define('getOptionAvailability', async (request) => {
  const eventId = request.params.eventId;

  if (!eventId) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'eventId is required');
  }

  const event = await new Parse.Query(EVENT_CLASS).get(eventId, { useMasterKey: true });
  const limits = collectLimits(event.get('formConfig'));

  if (Object.keys(limits).length === 0) return {};

  const eventPointer = event.toPointer();
  const usage = {};

  Object.keys(limits).forEach((fieldKey) => {
    usage[fieldKey] = {};
  });

  let skip = 0;

  for (let page = 0; page < AVAILABILITY_MAX_PAGES; page += 1) {
    const query = new Parse.Query(REGISTRATION_CLASS);

    query.equalTo('event', eventPointer);
    query.containedIn('status', RESERVING_STATUSES);
    query.select(['formData']); // tylko to, co potrzebne do zliczenia
    query.limit(AVAILABILITY_PAGE_SIZE);
    query.skip(skip);
    query.ascending('createdAt');

    const results = await query.find({ useMasterKey: true });
    if (results.length === 0) break;

    results.forEach((registration) => {
      const formData = registration.get('formData') || {};

      Object.entries(limits).forEach(([fieldKey, optionLimits]) => {
        toValues(formData[fieldKey]).forEach((value) => {
          // Wartość może być kluczem albo starą etykietą — mapujemy ją
          // na id opcji, żeby oba pokolenia danych trafiły do jednego licznika.
          const entry = Object.entries(optionLimits).find(([, config]) =>
            config.match.includes(value),
          );

          if (!entry) return;

          const optionId = entry[0];
          usage[fieldKey][optionId] = (usage[fieldKey][optionId] || 0) + 1;
        });
      });
    });

    skip += results.length;
    if (results.length < AVAILABILITY_PAGE_SIZE) break;
  }

  const availability = {};

  Object.entries(limits).forEach(([fieldKey, optionLimits]) => {
    availability[fieldKey] = {};

    Object.entries(optionLimits).forEach(([optionId, config]) => {
      const used = usage[fieldKey][optionId] || 0;

      availability[fieldKey][optionId] = {
        limit: config.limit,
        used,
        // Override może wypchnąć `used` powyżej limitu — nie pokazujemy ujemnych.
        remaining: Math.max(0, config.limit - used),
      };
    });
  });

  return availability;
});
