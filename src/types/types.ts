export interface EventOrganizer {
  __type: 'Pointer';
  className: '_User';
  objectId: string;
}

export interface EventACL {
  read?: boolean;
  write?: boolean;
}

export interface Event {
  objectId?: string;
  title: string;
  description: string; // HTML/String
  date?: MongoDate;
  startDate: MongoDate;
  endDate?: MongoDate;
  location?: string;
  dateType: 'single' | 'multi';
  eventFormat: 'virtual' | 'on-site';
  primaryColor: string;
  accentColor?: string;
  heroImageUrl?: string;
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
