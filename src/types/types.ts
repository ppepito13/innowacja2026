// --- FormConfig Types ---

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "checkbox"
  | "radio"
  | "multiselect"
  | "dropdown";

export interface FieldTypeOption {
  value: FieldType;
  labelKey: string;
  icon: string;
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
}

export interface FormConfigEntry {
  type: FieldType;
  required: boolean;
  placeholder?: string;
  label?: string;
  options?: string[];
}

export type FormConfig = Record<string, FormConfigEntry>;

// --- Domain Models ---

export interface Event {
  objectId: string;
  title: string;
  description: string; // HTML/String
  startDate: Date;
  isActive: boolean;
  formConfig: FormConfig;
  createdAt: string;
  updatedAt: string;

  // Frontend (Mock) fields
  id?: string;
  date?: string;
  location?: string;
  descriptionHtml?: string;
  brandingHexColor?: string;
  heroImageUrl?: string;
}

export interface Registration {
  objectId: string;
  event: Event; // Pointer
  formData: Record<string, unknown>; // JSON/Object
  status: "pending" | "approved"; // String: pending/approved
  checkInTime: Date | null; // Date/Nullable
  createdAt: string;
  updatedAt: string;
}

export interface User {
  objectId: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: "Admin" | "Organizer"; // String: Admin/Organizer
  createdAt: string;
  updatedAt: string;
}
