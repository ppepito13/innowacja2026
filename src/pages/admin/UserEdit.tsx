import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { LuSave, LuArrowLeft } from 'react-icons/lu';
import { InputTextfieldStateful } from '@lsg/components';
import bcrypt from 'bcryptjs';
import parseClient from '../../services/parseClient';
import Icon from '../../components/Icon';

interface Params { id: string; }

export default function UserEdit() {
  const { id } = useParams<Params>();
  const history = useHistory();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    parseClient.get(`/users/${id}`, {
      headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY }
    })
      .then(res => {
        setFullName(res.data.fullName || '');
        setEmail(res.data.email || '');
        setIsLocked(res.data.isLocked || false);
      })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = () => {
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = { fullName, email, isLocked };
    if (newPassword) payload.password = bcrypt.hashSync(newPassword, process.env.REACT_APP_BCRYPT_SALT);

    parseClient.put(`/users/${id}`, payload, {
      headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY }
    })
      .then(() => history.push('/admin/users'))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setSaving(false));
  };

  if (loading) return <p className="text-primary/50 text-sm">Loading...</p>;

  return (
    <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-[512px]">

      {/* HEADER */}
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl mb-0">Edit User</h1>
        <p className="text-lg mt-0 text-primary/75">Modify user details for "{fullName || email}".</p>
      </div>

      {/* FORM */}
      <div className="flex flex-col gap-2">
        <InputTextfieldStateful
          label="Full Name *"
          placeholder="John Doe"
          defaultValue={fullName}
          onChange={(value) => setFullName(String(value))}
        />

        <div>
          <InputTextfieldStateful
            label="Email Address *"
            placeholder="john.doe@example.com"
            defaultValue={email}
            onChange={(value) => setEmail(String(value))}
          />
          <p className="text-xs text-primary/50 mt-1">This will be the user's login.</p>
        </div>

        <div>
          <InputTextfieldStateful
            label="New Password"
            placeholder="Leave empty to keep current"
            type="password"
            defaultValue={newPassword}
            onChange={(value) => setNewPassword(String(value))}
          />
          <p className="text-xs text-primary/50 mt-1">Leave empty to keep current password.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">Role *</label>
          <p className="text-sm text-primary px-3 py-2 border border-primary/20 rounded-lg bg-primary/5">Organizer</p>
        </div>

        {/* isLocked */}
        <div className="flex items-center justify-between px-3 py-3 border border-primary/20 rounded-lg mt-1">
          <div>
            <p className="text-sm font-medium text-primary">Lock account</p>
            <p className="text-xs text-primary/50">User will not be able to log in.</p>
          </div>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`w-10 h-6 rounded-full transition-colors cursor-pointer border-none relative ${isLocked ? 'bg-error' : 'bg-primary/20'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isLocked ? 'left-5' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && <p className="text-error text-sm mt-2">{error}</p>}

      {/* ACTIONS */}
      <div className="flex items-center justify-between mt-4 pb-4">
        <button
          onClick={() => history.push('/admin/users')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary/60 hover:text-primary transition-colors cursor-pointer outline-none border-none bg-transparent"
        >
          <Icon icon={LuArrowLeft} />
          <span>Cancel</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none disabled:opacity-50"
        >
          <Icon icon={LuSave} />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

    </div>
  );
}
