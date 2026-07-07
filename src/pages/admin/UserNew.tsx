import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { LuUserPlus, LuArrowLeft } from 'react-icons/lu';
import { InputTextfieldStateful } from '@lsg/components';
import { useTranslation } from 'react-i18next';
import bcrypt from 'bcryptjs';
import parseClient from '../../services/parseClient';
import { parseService } from '../../services/parseService';
import Icon from '../../components/Icon';
import { Event } from '../../types/types';
import { EVENT_CLASS } from '../../constants/eventDefaults';

type NewUser = {
  fullName: string;
  email: string;
  role: string;
};

export default function UserNew() {
  const { t } = useTranslation();
  const history = useHistory();

  const [user, setUser] = useState<NewUser>({
    fullName: '',
    email: '',
    role: 'Organizer',
  });

  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  const handleChange = <K extends keyof NewUser>(field: K, value: NewUser[K]) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    parseService
      .getAll<Event>(EVENT_CLASS)
      .then(setEvents)
      .catch(() => {});
  }, []);

  const toggleEvent = (eventId: string) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      next.has(eventId) ? next.delete(eventId) : next.add(eventId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!user.fullName || !user.email) {
      setError(t('users.new.fullName') + ' and ' + t('users.new.email') + ' are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const hashedPassword = bcrypt.hashSync(password, process.env.REACT_APP_BCRYPT_SALT);

    parseClient
      .post('/users', {
        username: user.email,
        email: user.email,
        password: hashedPassword,
        fullName: user.fullName,
        role: user.role,
      })
      .then(({ data }) => {
        const updates = events
          .filter((e) => assignedIds.has(e.objectId!))
          .map((e) =>
            parseService.update<Event>(EVENT_CLASS, e.objectId!, {
              organizer: { __type: 'Pointer', className: '_User', objectId: data.objectId },
            }),
          );
        return Promise.all(updates);
      })
      .then(() => history.push('/admin/users'))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-lg">
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl mb-0">{t('users.new.title')}</h1>
        <p className="text-lg mt-0 text-primary/75">{t('users.new.description')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <InputTextfieldStateful
          label={t('users.new.fullName') + ' *'}
          placeholder="John Doe"
          defaultValue={user.fullName ?? ''}
          onChange={(value) => handleChange('fullName', String(value))}
        />

        <div>
          <InputTextfieldStateful
            label={t('users.new.email') + ' *'}
            placeholder="john.doe@example.com"
            defaultValue={user.email}
            onChange={(value) => handleChange('email', String(value))}
          />
          <p className="text-xs text-primary/70 mt-1">{t('users.new.emailHint')}</p>
        </div>

        <div>
          <InputTextfieldStateful
            label={t('users.new.password')}
            placeholder="password"
            type="password"
            defaultValue={password}
            onChange={(value) => setPassword(String(value))}
          />
          <p className="text-xs text-primary/70 mt-1">{t('users.new.passwordHint')}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">{t('users.new.role')}</label>
          <select
            value={user.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="Admin">{t('users.roles.Admin')}</option>
            <option value="Organizer">{t('users.roles.Organizer')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <label className="text-sm font-medium text-primary">{t('users.new.events')}</label>
          <div className="flex flex-col gap-1 border border-primary/20 rounded-lg p-3 max-h-48 overflow-y-auto">
            {events.map((ev) => (
              <label key={ev.objectId} className="flex items-center gap-2 text-sm text-primary">
                <input
                  type="checkbox"
                  checked={assignedIds.has(ev.objectId!)}
                  onChange={() => toggleEvent(ev.objectId!)}
                />
                {ev.title}
              </label>
            ))}
            {events.length === 0 && (
              <p className="text-xs text-primary/60">{t('users.new.noEvents')}</p>
            )}
          </div>
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-brand bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none disabled:opacity-50"
        >
          <Icon icon={LuUserPlus} />
          <span>{loading ? `${t('users.new.pending')}...` : t('users.new.submit')}</span>
        </button>
      </div>
    </div>
  );
}
