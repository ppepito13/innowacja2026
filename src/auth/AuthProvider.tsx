import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, SESSION_TOKEN_KEY } from '../services/parseService';
import { User } from '../types/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then((data) => setUser(data as User | null))
      .finally(() => setLoading(false));

    // Reakcja na 209 wyemitowane przez interceptor w trakcie sesji
    const handleInvalidSession = () => setUser(null);
    window.addEventListener('auth:session-invalid', handleInvalidSession);
    return () => window.removeEventListener('auth:session-invalid', handleInvalidSession);
  }, []);

  const login = async (email: string, password: string) => {
    // Gdyby w localStorage został zły token (np. user nigdy nie odświeżył strony
    // po przedawnieniu) — czyścimy go przed loginem, żeby request /login nie poszedł
    // ze starym X-Parse-Session-Token w nagłówku.
    localStorage.removeItem(SESSION_TOKEN_KEY);

    await authService.login(email, password);
    const data = await authService.getCurrentUser();
    setUser(data as User | null);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
