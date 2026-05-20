export interface Event {
    objectId: string;
    title: string;
    description: string; // HTML/String
    startDate: Date;
    endDate?: Date;
    dateType: 'single' | 'multi';
    eventFormat: 'virtual' | 'on-site';
    location: string;
    primaryColor: string;
    accentColor: string;
    heroImageUrl: string;
    isActive: boolean;
    formConfig: Record<string, unknown>; // JSON/Object
    createdAt: string;
    updatedAt: string;
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
    role: 'Admin' | 'Organizer'; // String: Admin/Organizer
    createdAt: string;
    updatedAt: string;
}