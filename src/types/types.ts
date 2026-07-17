export interface EventOrganizer {
  __type: 'Pointer';
  className: '_User';
  objectId: string;
}

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
export interface optionsTranslation{
  id: string;
  i18n: {
    pl: string;
    en: string
  };
}
export interface FormField {
  /**
   * Local-only identifier used for React list keys and UI state (e.g. tracking
   * which dropdown is open). NOT persisted to the database — Parse Server
   * generates its own `objectId` for DB records.
   * @see https://docs.parseplatform.org/rest/guide/#relational-queries
   */
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
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
  status: 'pending' | 'approved' | 'rejected'; // String: pending/approved/rejected
  isCheckedIn?: boolean;
  checkInTime: Date | MongoDate | null; // Date/Nullable
  consent: boolean;
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
