import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/parseService';
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
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login(email, password);

    const data = await authService.getCurrentUser();

    setUser(data as User | null);
  };

  const logout = async () => {
    await authService.logout();

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
