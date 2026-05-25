import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { LuUserPlus, LuPencil, LuTrash2 } from 'react-icons/lu';
import { parseService } from '../../services/parseService';
import { User } from '../../types/types';
import Icon from '../../components/Icon';

export default function Users() {
  const history = useHistory();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Organizer'>('All');

  useEffect(() => {
    parseService.getAll<User>('_User')
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (objectId: string) => {
    if (!window.confirm('Na pewno usunąć użytkownika?')) return;
    parseService.remove('_User', objectId)
      .then(() => setUsers(prev => prev.filter(u => u.objectId !== objectId)))
      .catch(err => setError(err.message));
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-full max-w-4xl">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-3xl mb-0">Users</h1>
          <p className="text-lg mt-0 text-primary/75">Manage users and their permissions.</p>
        </div>
        <button
          onClick={() => history.push('/admin/users/new')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none"
        >
          <Icon icon={LuUserPlus} />
          <span>Add User</span>
        </button>
      </div>

      {/* SUBHEADER */}
      <div>
        <h2 className="text-xl mb-0">All Users</h2>
        <p className="text-sm mt-0 text-primary/75">View, edit, and delete system users.</p>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-primary"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Organizer">Organizer</option>
        </select>
        <span className="ml-auto text-sm text-primary/50">Found {filtered.length} users</span>
      </div>

      {/* ERROR */}
      {error && <p className="text-error text-sm mb-2">{error}</p>}

      {/* TABLE */}
      {loading ? (
        <p className="text-primary/50 text-sm">Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
          <tr className="border-b border-primary/10 text-left">
            <th className="font-medium text-primary/50">User</th>
            <th className="font-medium text-primary/50">Role</th>
            <th className="font-medium text-primary/50">Actions</th>
          </tr>
          </thead>
          <tbody>
          {filtered.map(user => (
            <tr key={user.objectId} className="border-b border-primary/5  transition-colors">
              <td className="py-3">
                <p className="font-medium text-primary">{user.username}</p>
                <p className="text-primary/50 text-xs">{user.email}</p>
              </td>
              <td className="py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'Admin' ? 'bg-secondary text-primary' : 'bg-primary/10 text-primary'
                }`}>
                  {user.role === 'Admin' ? 'Administrator' : 'Organizer'}
                </span>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => history.push(`/admin/users/${user.objectId}/edit`)}
                    className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/40 hover:text-primary cursor-pointer border-none bg-transparent"
                  >
                    <Icon icon={LuPencil} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.objectId)}
                    className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/40 hover:text-error cursor-pointer border-none bg-transparent"
                  >
                    <Icon icon={LuTrash2} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-primary/40">No users found.</td>
            </tr>
          )}
          </tbody>
        </table>
      )}

      {/* BOTTOM PADDING */}
      <div className="pb-4" />
    </div>
  );
}
