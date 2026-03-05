import { useEffect, useState } from 'react';
import { UserPlus, RefreshCw, Edit3, Check, X } from 'lucide-react';
import { authApi } from '../api/client';
import type { User, Role } from '../types';
import { RoleBadge, LoadingOverlay, ErrorMsg, SectionHeader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const ROLES: Role[] = ['viewer', 'analyst', 'admin'];

interface EditRowProps {
  user: User;
  onSave: (id: number, role: Role, isActive: boolean) => Promise<void>;
  onCancel: () => void;
}

function EditRow({ user, onSave, onCancel }: EditRowProps) {
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await onSave(user.id, role, isActive);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setLoading(false);
    }
  };

  return (
    <>
      <td className="px-4 py-2">
        <select value={role} onChange={e => setRole(e.target.value as Role)}
          className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none">
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}
          className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </td>
      <td className="px-4 py-2">
        {error && <span className="text-red-400 text-xs">{error}</span>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={loading}
            className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/40 transition-colors">
            <Check size={14} />
          </button>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </td>
    </>
  );
}

interface RegisterModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function RegisterModal({ onClose, onCreated }: RegisterModalProps) {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'viewer' as Role });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await authApi.register(form.email, form.password, form.name, form.role);
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-semibold text-lg mb-5">Add New User</h3>
        <div className="space-y-3">
          {(['name', 'email', 'password'] as const).map(field => (
            <div key={field}>
              <label className="text-slate-400 text-sm mb-1 block capitalize">{field}</label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="mt-3"><ErrorMsg message={error} /></div>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-60">
            {loading ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await authApi.listUsers();
      setUsers(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (id: number, role: Role, isActive: boolean) => {
    await authApi.patchUser(id, { role, isActive });
    setEditingId(null);
    await load();
  };

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle={`${users.length} users in system`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500
                         text-white text-sm font-semibold transition-colors">
              <UserPlus size={14} /> Add User
            </button>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700
                         text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? <LoadingOverlay /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-300 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-white font-medium">
                    {u.name}
                    {u.id === me?.id && <span className="ml-2 text-xs text-blue-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">{u.email}</td>
                  {editingId === u.id && u.id !== me?.id ? (
                    <EditRow user={u} onSave={handleSave} onCancel={() => setEditingId(null)} />
                  ) : (
                    <>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${u.isActive !== false ? 'text-green-400' : 'text-red-400'}`}>
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== me?.id && (
                          <button onClick={() => setEditingId(u.id)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                            <Edit3 size={14} />
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <RegisterModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}
