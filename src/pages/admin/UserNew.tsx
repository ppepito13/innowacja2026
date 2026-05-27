import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { LuUserPlus, LuArrowLeft } from 'react-icons/lu';
import { InputTextfieldStateful } from '@lsg/components';
import { useTranslation } from 'react-i18next';
import bcrypt from 'bcryptjs';
import parseClient from '../../services/parseClient';
import Icon from '../../components/Icon';

export default function UserNew() {
  const { t } = useTranslation();
  const history = useHistory();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!fullName || !email) {
      setError(t('users.new.fullName') + ' and ' + t('users.new.email') + ' are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const hashedPassword = bcrypt.hashSync(password, process.env.REACT_APP_BCRYPT_SALT);

    parseClient.post('/users', {
      username: email,
      email,
      password: hashedPassword,
      fullName,
      role: 'Organizer',
    })
      .then(() => history.push('/admin/users'))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-[512px]">

      <div className="flex flex-col mb-4">
        <h1 className="text-3xl mb-0">{t('users.new.title')}</h1>
        <p className="text-lg mt-0 text-primary/75">{t('users.new.description')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <InputTextfieldStateful
          label={t('users.new.fullName') + ' *'}
          placeholder="John Doe"
          defaultValue={fullName}
          onChange={(value) => setFullName(String(value))}
        />

        <div>
          <InputTextfieldStateful
            label={t('users.new.email') + ' *'}
            placeholder="john.doe@example.com"
            defaultValue={email}
            onChange={(value) => setEmail(String(value))}
          />
          <p className="text-xs text-primary/50 mt-1">{t('users.new.emailHint')}</p>
        </div>

        <div>
          <InputTextfieldStateful
            label={t('users.new.password')}
            placeholder="password"
            type="password"
            defaultValue={password}
            onChange={(value) => setPassword(String(value))}
          />
          <p className="text-xs text-primary/50 mt-1">{t('users.new.passwordHint')}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">{t('users.new.role')}</label>
          <p className="text-sm text-primary px-3 py-2 border border-primary/20 rounded-lg bg-primary/5">{t('users.roles.Organizer')}</p>
          <p className="text-xs text-primary/50">{t('users.new.roleHint')}</p>
        </div>
      </div>

      {error && <p className="text-error text-sm mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-4 pb-4">
        <button
          onClick={() => history.push('/admin/users')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary/60 hover:text-primary transition-colors cursor-pointer outline-none border-none bg-transparent"
        >
          <Icon icon={LuArrowLeft} />
          <span>{t('users.new.cancel')}</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none disabled:opacity-50"
        >
          <Icon icon={LuUserPlus} />
          <span>{loading ? `${t('users.new.pending')}...` : t('users.new.submit')}</span>
        </button>
      </div>

    </div>
  );
}
