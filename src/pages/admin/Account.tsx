import { useState } from 'react';
import { useHistory } from 'react-router';
import { LuLogOut, LuSun, LuMoon } from 'react-icons/lu';
import { useAuth } from '../../auth/AuthProvider';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeProvider';

export default function Account() {
  const { t } = useTranslation();
  const history = useHistory();
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    logout().finally(() => history.push('/login'));
  };

  if (loading) {
    return <p className="p-8 text-primary/60">{t('account.loading')}...</p>;
  }

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-lg">
      {/* HEADER */}
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl mb-0">{t('account.title')}</h1>
        <p className="text-lg mt-0 text-primary/75">{t('account.description')}</p>
      </div>

      {/* DATA */}
      <div className="flex flex-col gap-2 text-primary">
        <div className="flex justify-between border-b border-primary/10 py-2">
          <span className="text-primary/60">{t('account.username')}</span>
          <span>{user?.username}</span>
        </div>
        <div className="flex justify-between border-b border-primary/10 py-2">
          <span className="text-primary/60">{t('account.email')}</span>
          <span>{user?.email}</span>
        </div>
        <div className="flex justify-between border-b border-primary/10 py-2">
          <span className="text-primary/60">{t('account.role')}</span>
          <span>{user?.role}</span>
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="flex flex-col mt-6">
        <h2 className="text-xl mb-0">{t('account.appearance.title')}</h2>
        <p className="text-sm mt-1 mb-3 text-primary/60">{t('account.appearance.description')}</p>
        <div className="flex gap-3">
          {(['light', 'dark'] as const).map((mode) => {
            const active = theme === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                aria-pressed={active}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-secondary border-secondary text-brand'
                    : 'bg-surface-2 border-primary/15 text-primary/80 hover:text-primary hover:border-primary/30'
                }`}
              >
                <Icon icon={mode === 'light' ? LuSun : LuMoon} size={16} />
                <span>{t(`account.appearance.${mode}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end mt-4 pb-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          data-testid="logout-button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-primary text-sm font-semibold transition-colors cursor-pointer hover:bg-primary/5 disabled:opacity-50"
        >
          <Icon icon={LuLogOut} size={16} />
          <span>
            {loggingOut ? `${t('account.logout.pending')}...` : t('account.logout.idle')}
          </span>
        </button>
      </div>
    </div>
  );
}
