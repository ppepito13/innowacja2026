import { useState } from 'react';
import { useHistory } from 'react-router';
import { LuLogOut } from 'react-icons/lu';
import { Button } from '@lsg/components';
import { useAuth } from '../../auth/AuthProvider';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/Icon';

export default function Account() {
  const { t } = useTranslation();
  const history = useHistory();
  const { user, loading, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    logout().finally(() => history.push('/login'));
  };

  if (loading) {
    return <p className="p-8 text-primary/60">{t('account.loading')}...</p>;
  }

  return (
    <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-[512px]">
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

      {/* ACTIONS */}
      <div className="flex items-center justify-end mt-4 pb-4">
        <Button
          look="secondary"
          className="scale-75"
          onClick={handleLogout}
          disabled={loggingOut}
          data-testid="logout-button"
        >
          <span className="flex flex-row items-center gap-2">
            <Icon icon={LuLogOut} />
            <span>
              {loggingOut ? `${t('account.logout.pending')}...` : t('account.logout.idle')}
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}
