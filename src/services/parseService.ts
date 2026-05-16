import parseClient from './parseClient';

// Typy

export interface ParseObject {
    objectId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ParseResponse<T> {
    results: T[];
}

export interface ParsePointer {
    __type: 'Pointer';
    className: string;
    objectId: string;
}

// Helper: tworzy Pointer do obiektu Parse

export const createPointer = (className: string, objectId: string): ParsePointer => ({
    __type: 'Pointer',
    className,
    objectId,
});

// Generyczny serwis CRUD

export const parseService = {

    /** Pobierz wszystkie obiekty danej klasy */
    async getAll<T extends ParseObject>(className: string): Promise<T[]> {
        const { data } = await parseClient.get<ParseResponse<T>>(`/classes/${className}`);
        return data.results;
    },

    /** Pobierz jeden obiekt po objectId */
    async getById<T extends ParseObject>(className: string, objectId: string): Promise<T> {
        const { data } = await parseClient.get<T>(`/classes/${className}/${objectId}`);
        return data;
    },

    /** Pobierz obiekty z filtrem (where) */
    async query<T extends ParseObject>(
        className: string,
        where: Record<string, unknown>,
        options?: { limit?: number; skip?: number; order?: string }
    ): Promise<T[]> {
        const params: Record<string, unknown> = {
            where: JSON.stringify(where),
            ...options,
        };
        const { data } = await parseClient.get<ParseResponse<T>>(`/classes/${className}`, { params });
        return data.results;
    },

    /** Utwórz nowy obiekt */
    async create<T extends ParseObject>(className: string, payload: Omit<T, 'objectId' | 'createdAt' | 'updatedAt'>): Promise<{ objectId: string; createdAt: string }> {
        const { data } = await parseClient.post(`/classes/${className}`, payload);
        return data;
    },

    /** Zaktualizuj istniejący obiekt */
    async update<T extends ParseObject>(
        className: string,
        objectId: string,
        payload: Partial<T>
    ): Promise<{ updatedAt: string }> {
        const { data } = await parseClient.put(`/classes/${className}/${objectId}`, payload);
        return data;
    },

    /** Usuń obiekt */
    async remove(className: string, objectId: string): Promise<void> {
        await parseClient.delete(`/classes/${className}/${objectId}`);
    },
};

//  Auth

export const authService = {

    async login(username: string, password: string): Promise<{ sessionToken: string; objectId: string }> {
        const { data } = await parseClient.get('/login', { params: { username, password } });
        localStorage.setItem('parseSessionToken', data.sessionToken);
        return data;
    },

    async logout(): Promise<void> {
        await parseClient.post('/logout');
        localStorage.removeItem('parseSessionToken');
    },

    async getCurrentUser(): Promise<ParseObject | null> {
        const token = localStorage.getItem('parseSessionToken');
        if (!token) return null;
        const { data } = await parseClient.get('/users/me');
        return data;
    },
};