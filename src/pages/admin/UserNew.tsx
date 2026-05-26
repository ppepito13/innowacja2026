import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { LuUserPlus, LuArrowLeft } from 'react-icons/lu';
import { InputTextfieldStateful } from '@lsg/components';
import bcrypt from 'bcryptjs';
import parseClient from '../../services/parseClient';
import Icon from '../../components/Icon';

export default function UserNew() {
  const history = useHistory();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!fullName || !email) {
      setError('Full name and email are required.');
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

      {/* HEADER */}
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl mb-0">Add New User</h1>
        <p className="text-lg mt-0 text-primary/75">Enter the details to create a new account.</p>
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
            label="Password"
            placeholder="password"
            type="password"
            defaultValue={password}
            onChange={(value) => setPassword(String(value))}
          />
          <p className="text-xs text-primary/50 mt-1">Default password is "password". User can change it after first login.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">Role *</label>
          <p className="text-sm text-primary px-3 py-2 border border-primary/20 rounded-lg bg-primary/5">Organizer</p>
          <p className="text-xs text-primary/50">Access only to assigned events.</p>
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
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none disabled:opacity-50"
        >
          <Icon icon={LuUserPlus} />
          <span>{loading ? 'Creating...' : 'Add User'}</span>
        </button>
      </div>

    </div>
  );
}
