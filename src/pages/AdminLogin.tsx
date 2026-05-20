import { useState } from 'react';
import { useHistory } from 'react-router';
import { LuLogIn } from 'react-icons/lu';
import { Button, InputTextfieldStateful } from '@lsg/components';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import Icon from '../components/Icon';

export default function AdminLogin() {
  const { t } = useTranslation();
  const history = useHistory();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    setLoading(true);
    setError(null);

    login(email, password)
      .then(() => history.push('/admin'))
      .catch(() => setError(t('login.error')))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-[512px]">
      {/* HEADER */}
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl mb-0">{t('login.title')}</h1>
        <p className="text-lg mt-0 text-primary/75">{t('login.description')}</p>
      </div>

      {/* FORM */}
      <div className="flex flex-col">
        <InputTextfieldStateful
          label={t('login.email')}
          placeholder={t('login.email')}
          defaultValue={email}
          onChange={(value) => setEmail(String(value))}
        />
        <InputTextfieldStateful
          label={t('login.password')}
          placeholder={t('login.password')}
          type="password"
          defaultValue={password}
          onChange={(value) => setPassword(String(value))}
        />
      </div>

      {/* ERROR */}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      {/* ACTIONS */}
      <div className="flex items-center justify-end mt-4 pb-4">
        <Button className="scale-75" onClick={handleLogin} disabled={loading}>
          <span className="flex flex-row items-center gap-2">
            <Icon icon={LuLogIn} />
            <span>{loading ? `${t('login.pending')}...` : t('login.submit')}</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
