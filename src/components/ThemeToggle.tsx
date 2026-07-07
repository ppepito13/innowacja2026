import { LuSun, LuMoon } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import Icon from './Icon';
import { useTheme } from '../theme/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

export default function ThemeToggle({ className = '', size = 18 }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const label = isDark ? t('theme.toggleToLight') : t('theme.toggleToDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-surface text-primary/80 transition-colors hover:border-primary/30 hover:text-primary cursor-pointer ${className}`}
    >
      <Icon icon={isDark ? LuSun : LuMoon} size={size} />
    </button>
  );
}
