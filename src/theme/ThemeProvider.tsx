import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import { authService } from '../services/parseService';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return DEFAULT_THEME;
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      if (user?.objectId) {
        authService.updateThemePreference(user.objectId, next).catch(() => {});
      }
    },
    [user?.objectId],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);
  
  const reconciledUserId = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.objectId) {
      reconciledUserId.current = null;
      return;
    }
    if (reconciledUserId.current === user.objectId) return;
    reconciledUserId.current = user.objectId;

    const dbPref = user.themePreference;
    if (dbPref === 'light' || dbPref === 'dark') {
      setThemeState(dbPref);
    } else {
      authService.updateThemePreference(user.objectId, theme).catch(() => {});
    }
  }, [user?.objectId, user?.themePreference, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
