import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { LuSave, LuArrowLeft } from 'react-icons/lu';
import { InputTextfieldStateful } from '@lsg/components';
import { useTranslation } from 'react-i18next';
import bcrypt from 'bcryptjs';
import parseClient from '../../services/parseClient';
import Icon from '../../components/Icon';
import { User } from '../../types/types';

interface Params { id: string; }

type UserEditPayload = {
  fullName: string;
  email: string;
  isLocked: boolean;
  password?: string;
};

export default function UserEdit() {
  const { t } = useTranslation();
  const { id } = useParams<Params>();
  const history = useHistory();

  const [user, setUser] = useState<User>({
    objectId: '',
    username: '',
    email: '',
    emailVerified: false,
    role: 'Organizer',
    fullName: '',
    isLocked: false,
    createdAt: '',
    updatedAt: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = <K extends keyof User>(field: K, value: User[K]) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    parseClient.get<User>(`/users/${id}`, {
      headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY }
    })
      .then(res => setUser(res.data))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = () => {
    setSaving(true);
    setError(null);

    const payload: UserEditPayload = {
      fullName: user.fullName ?? '',
      email: user.email,
      isLocked: user.isLocked ?? false,
    };
    if (newPassword) payload.password = bcrypt.hashSync(newPassword, process.env.REACT_APP_BCRYPT_SALT);

    parseClient.put(`/users/${id}`, payload, {
      headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY }
    })
      .then(() => history.push('/admin/users'))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setSaving(false));
  };

  if (loading) return <p className="text-primary/70 text-sm">{t('common.loading')}</p>;

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-lg">

      <div className="flex flex-col mb-4">
        <h1 className="text-3xl mb-0">{t('users.edit.title')}</h1>
        <p className="text-lg mt-0 text-primary/75">{t('users.edit.description', { name: user.fullName || user.email })}</p>
      </div>

      <div className="flex flex-col gap-2">
        <InputTextfieldStateful
          label={t('users.edit.fullName') + ' *'}
          placeholder="John Doe"
          defaultValue={user.fullName ?? ''}
          onChange={(value) => handleChange('fullName', String(value))}
        />

        <div>
          <InputTextfieldStateful
            label={t('users.edit.email') + ' *'}
            placeholder="john.doe@example.com"
            defaultValue={user.email}
            onChange={(value) => handleChange('email', String(value))}
          />
          <p className="text-xs text-primary/70 mt-1">{t('users.edit.emailHint')}</p>
        </div>

        <div>
          <InputTextfieldStateful
            label={t('users.edit.newPassword')}
            placeholder={t('users.edit.passwordHint')}
            type="password"
            defaultValue={newPassword}
            onChange={(value) => setNewPassword(String(value))}
          />
          <p className="text-xs text-primary/70 mt-1">{t('users.edit.passwordHint')}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">{t('users.edit.role')}</label>
          <p className="text-sm text-primary px-3 py-2 border border-primary/20 rounded-lg bg-primary/5">{t('users.roles.Organizer')}</p>
        </div>

        <div className="flex items-center justify-between px-3 py-3 border border-primary/20 rounded-lg mt-1">
          <div>
            <p className="text-sm font-medium text-primary">{t('users.edit.lockAccount')}</p>
            <p className="text-xs text-primary/70">{t('users.edit.lockAccountHint')}</p>
          </div>
          <button
            onClick={() => handleChange('isLocked', !user.isLocked)}
            className={`w-10 h-6 rounded-full transition-colors cursor-pointer border-none relative ${user.isLocked ? 'bg-error' : 'bg-primary/20'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.isLocked ? 'left-5' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {error && <p className="text-error text-sm mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-4 pb-4">
        <button
          onClick={() => history.push('/admin/users')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary/60 hover:text-primary transition-colors cursor-pointer outline-none border-none bg-transparent"
        >
          <Icon icon={LuArrowLeft} />
          <span>{t('users.edit.cancel')}</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-brand bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none disabled:opacity-50"
        >
          <Icon icon={LuSave} />
          <span>{saving ? `${t('users.edit.pending')}...` : t('users.edit.submit')}</span>
        </button>
      </div>

    </div>
  );
}
