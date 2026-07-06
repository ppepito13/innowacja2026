import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { LuUserPlus, LuPencil, LuTrash2 } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { User } from '../../types/types';
import Icon from '../../components/Icon';
import parseClient from '../../services/parseClient';
import { useNavigateOrOpen } from '../../hooks/useNavigateOrOpen';

export default function Users() {
  const { t } = useTranslation();
  const history = useHistory();
  const navigate = useNavigateOrOpen();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Organizer'>('All');
  const [sortField, setSortField] = useState<'username' | 'role' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    parseClient.get('/users', {
      headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY }
    })
      .then(res => setUsers(res.data.results))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (objectId: string) => {
    if (!window.confirm(t('users.deleteConfirm'))) return;
    parseClient.delete(`/users/${objectId}`, {
      headers: { 'X-Parse-Master-Key': process.env.REACT_APP_PARSE_MASTER_KEY }
    })
      .then(() => setUsers(prev => prev.filter(u => u.objectId !== objectId)))
      .catch(err => setError(err.response?.data?.error || err.message));
  };

  const handleSort = (field: 'username' | 'role') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField].toLowerCase();
    const valB = b[sortField].toLowerCase();
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: 'username' | 'role' }) => (
    <span className="text-xs ml-1">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↑↓'}
    </span>
  );

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-4xl">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="text-3xl mb-0">{t('users.title')}</h1>
          <p className="text-lg mt-0 text-primary/75">{t('users.description')}</p>
        </div>
        <button
          onClick={() => history.push('/admin/users/new')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-brand bg-secondary hover:bg-secondary/90 transition-colors font-medium cursor-pointer outline-none border-none"
        >
          <Icon icon={LuUserPlus} />
          <span>{t('users.addUser')}</span>
        </button>
      </div>

      {/* SUBHEADER */}
      <div>
        <h2 className="text-xl mb-0">{t('users.allUsers')}</h2>
        <p className="text-sm mt-0 text-primary/75">{t('users.allUsersDescription')}</p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t('users.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-primary"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
          className="border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="All">{t('users.allRoles')}</option>
          <option value="Admin">{t('users.roles.Admin')}</option>
          <option value="Organizer">{t('users.roles.Organizer')}</option>
        </select>
        <span className="ml-auto text-sm text-primary/70">{t('users.found', { count: filtered.length })}</span>
      </div>

      {/* ERROR */}
      {error && <p className="text-error text-sm mb-2">{error}</p>}

      {/* TABLE */}
      {loading ? (
        <p className="text-primary/70 text-sm">{t('common.loading')}</p>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[480px]">
          <thead>
          <tr className="border-b border-primary/10 text-left">
            <th
              className="pb-3 font-medium text-primary/70 cursor-pointer select-none"
              onClick={() => handleSort('username')}
            >
              {t('users.columns.user')} <SortIcon field="username" />
            </th>
            <th
              className="pb-3 font-medium text-primary/70 cursor-pointer select-none"
              onClick={() => handleSort('role')}
            >
              {t('users.columns.role')} <SortIcon field="role" />
            </th>
            <th className="pb-3 font-medium text-primary/70">{t('users.columns.lastLogin')}</th>
            <th className="pb-3 font-medium text-primary/70">{t('users.columns.actions')}</th>
          </tr>
          </thead>
          <tbody>
          {sorted.map(user => (
            <tr key={user.objectId} className="border-b border-primary/5 transition-colors">
              <td className="py-3">
                <p className="font-medium text-primary">{user.fullName || user.username}</p>
                <p className="text-primary/70 text-xs">{user.email}</p>
              </td>
              <td className="py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'Admin' ? 'bg-secondary text-brand' : 'bg-primary/10 text-primary'
                  }`}>
                    {t(`users.roles.${user.role}`)}
                  </span>
              </td>
              <td className="py-3 text-sm text-primary/70">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => navigate(`/admin/users/${user.objectId}/edit`, e)}
                    className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/60 hover:text-primary cursor-pointer border-none bg-transparent"
                  >
                    <Icon icon={LuPencil} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.objectId)}
                    className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-primary/60 hover:text-error cursor-pointer border-none bg-transparent"
                  >
                    <Icon icon={LuTrash2} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-primary/60">{t('users.noUsers')}</td>
            </tr>
          )}
          </tbody>
        </table>
        </div>
      )}

      <div className="pb-4" />
    </div>
  );
}
