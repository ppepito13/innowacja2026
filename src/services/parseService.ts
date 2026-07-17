import parseClient from './parseClient';
import bcrypt from 'bcryptjs';

export const SESSION_TOKEN_KEY = 'sessionToken';
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
    options?: { limit?: number; skip?: number; order?: string },
  ): Promise<T[]> {
    const params: Record<string, unknown> = {
      where: JSON.stringify(where),
      ...options,
    };
    const { data } = await parseClient.get<ParseResponse<T>>(`/classes/${className}`, { params });
    return data.results;
  },

  /** Utwórz nowy obiekt */
  async create<T extends ParseObject>(
    className: string,
    payload: Omit<T, 'objectId' | 'createdAt' | 'updatedAt'>,
  ): Promise<{ objectId: string; createdAt: string }> {
    const { data } = await parseClient.post(`/classes/${className}`, payload);
    return data;
  },

  /** Zaktualizuj istniejący obiekt */
  async update<T extends ParseObject>(
    className: string,
    objectId: string,
    payload: Partial<T>,
  ): Promise<{ updatedAt: string }> {
    const { data } = await parseClient.put(`/classes/${className}/${objectId}`, payload);
    return data;
  },

  async batchUpdate<T extends ParseObject>(
    className: string,
    updates: { objectId: string; payload: Partial<T> }[],
  ): Promise<void> {
    const requests = updates.map(({ objectId, payload }) => ({
      method: 'PUT' as const,
      path: `/parse/classes/${className}/${objectId}`,
      body: payload,
    }));

    await parseClient.post('/batch', { requests });
  },

  /** Usuń obiekt */
  async remove(className: string, objectId: string): Promise<void> {
    await parseClient.delete(`/classes/${className}/${objectId}`);
  },

  /** Wywołaj funkcję Parse Cloud Code */
  async runFunction<T>(name: string, params: Record<string, unknown> = {}): Promise<T> {
    const { data } = await parseClient.post<{ result: T }>(`/functions/${name}`, params);
    return data.result;
  },

  async count(className: string, where: Record<string, unknown> = {}): Promise<number> {
    const { data } = await parseClient.get(`/classes/${className}`, {
      params: { where: JSON.stringify(where), count: 1, limit: 0 },
    });
    return (data as any).count ?? 0;
  },
};

//  Auth

export const authService = {
  async login(email: string, password: string) {
    const passwordHash = bcrypt.hashSync(password, process.env.REACT_APP_BCRYPT_SALT);
    const { data } = await parseClient.get('/login', {
      params: { username: email, password: passwordHash }
    });
    localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);

    // zapisz datę ostatniego logowania
    await parseClient.put(`/users/${data.objectId}`, {
      lastLoginAt: new Date().toISOString()
    }, {
      headers: { 'X-Parse-Session-Token': data.sessionToken }
    });

    return data;
  },

  async logout(): Promise<void> {
    await parseClient.post('/logout');
    localStorage.removeItem(SESSION_TOKEN_KEY);
  },

  async updateThemePreference(objectId: string, theme: 'light' | 'dark'): Promise<void> {
    await parseClient.put(`/users/${objectId}`, { themePreference: theme });
  },

  async getCurrentUser(): Promise<ParseObject | null> {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return null;
    try {
      const { data } = await parseClient.get('/users/me');
      return data;
    } catch (error) {
      // Interceptor już posprzątał localStorage przy 209.
      return null;
    }
  },
};
