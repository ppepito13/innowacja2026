export interface EventOrganizer {
  __type: 'Pointer';
  className: '_User';
  objectId: string;
}

export type Locale = 'en' | 'pl';

export interface LocalizedText {
  en: string;
  pl: string;
}

export type TranslatableEventField =
    | 'title'
    | 'description'
    | 'location'
    | 'dataProcessingAgreement';

export type EventI18n = Partial<Record<TranslatableEventField, LocalizedText>>;

export interface EventACL {
  read?: boolean;
  write?: boolean;
}

// --- FormConfig Types ---

export type FieldType =
    | 'text'
    | 'email'
    | 'phone'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'multiselect'
    | 'dropdown';

export interface FieldTypeOption {
  value: FieldType;
  labelKey: string;
  icon: string;
}

export interface optionsTranslation {
  /**
   * Klucz stabilny. To ON trafia do `Registration.formData` i po nim liczone
   * są limity miejsc. Nadawany RAZ w edytorze (po wpisaniu wartości opcji);
   * późniejsza zmiana etykiety go NIE rusza, bo zerwałaby powiązanie
   * z istniejącymi rejestracjami.
   *
   * Pusty string = opcja jeszcze nie zapisana.
   */
  id: string;
  i18n: {
    pl: string;
    en: string
  };
  /** Maksymalna liczba zgłoszeń na tę opcję. null/brak = bez limitu. */
  limit?: number | null;
  /**
   * Wartości, jakie ta opcja mogła przyjąć PRZED wprowadzeniem kluczy —
   * czyli etykiety zapisane w starych `Registration.formData`.
   * Migawka robiona raz, w momencie nadania `id`.
   *
   * Dzięki temu nie trzeba przepisywać istniejących rejestracji: licznik
   * dopasowuje zarówno `id`, jak i te wartości. Późniejsza zmiana etykiety
   * w edytorze niczego nie psuje, bo migawka zostaje.
   */
  legacyValues?: string[];
}

export interface FormField {
  /**
   * Local-only identifier used for React list keys and UI state (e.g. tracking
   * which dropdown is open). NOT persisted to the database — Parse Server
   * generates its own `objectId` for DB records.
   * @see https://docs.parseplatform.org/rest/guide/#relational-queries
   */
  id: string;
  /**
   * Klucz w `formConfig` i w `Registration.formData`. Wyliczany raz z etykiety
   * przy pierwszym zapisie, potem niezmienny — inaczej edycja etykiety odcięłaby
   * wszystkie dotychczasowe rejestracje. Brak = pole jeszcze nie zapisane.
   */
  key?: string;
  locked?: boolean;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
  unique?: boolean;
  options: string[];
  i18n: {
    pl: string;
    en: string
  };
  optionsTranslation: optionsTranslation[];
}

export interface FormConfigEntry {
  type: FieldType;
  required: boolean;
  placeholder?: string;
  label?: string;
  options?: string[];
  i18n: Record<string,unknown>;
  optionsTranslation: optionsTranslation[];
  unique?: boolean;
}

export type FormConfig = Record<string, FormConfigEntry>;

// --- Domain Models ---

export interface Event {
  objectId?: string;
  title: string;
  description: string; // HTML/String
  date?: MongoDate;
  startDate: MongoDate;
  endDate?: MongoDate;
  location?: string;
  dateType: 'single' | 'multi';
  eventFormat: 'virtual' | 'on-site' | 'hybrid';
  meetingLink?: string;
  requiresApproval?: boolean;
  capacity?: number;
  registeredCount?: number;
  primaryColor: string;
  accentColor?: string;
  heroImageUrl?: string;
  dataProcessingAgreement?: string;
  i18n?: EventI18n;
  englishOnly?: boolean;
  isActive: boolean;
  formConfig: Record<string, unknown>; // JSON/Object
  organizer: EventOrganizer; // Pointer do _User
  ACL?: Record<string, EventACL>; // Access Control List, kompatybilność wsteczna
  createdAt?: string;
  updatedAt?: string;
}

export interface Registration {
  objectId: string;
  event: Event; // Pointer
  formData: Record<string, unknown>; // JSON/Object
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'; // String: pending/approved/rejected/cancelled
  isCheckedIn?: boolean;
  checkInTime: Date | MongoDate | null; // Date/Nullable
  consent: boolean;
  /**
   * Świadome przekroczenie limitu miejsc przez organizatora.
   * Ustawiane wyłącznie z panelu admina — serwer weryfikuje rolę sesji.
   */
  limitOverride?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  objectId: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: 'Admin' | 'Organizer'; // String: Admin/Organizer
  lastLoginAt?: string;
  fullName?: string;
  themePreference?: 'light' | 'dark';
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MongoDate {
  date?: Date;
  __type?: 'Date';
  iso?: string;
  __op?: 'Delete';
}