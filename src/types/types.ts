export interface Event {
    objectId: string;
    title: string;
    description: string; // HTML/String
    startDate: Date;
    isActive: boolean;
    formConfig: Record<string, unknown>; // JSON/Object
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
  status: 'pending' | 'approved'; // String: pending/approved
  checkInTime: Date | null; // Date/Nullable
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
  createdAt: string;
  updatedAt: string;
}
