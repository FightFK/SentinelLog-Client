import { useEffect, useState } from 'react';
import { UserPlus, Edit3, Trash2 } from 'lucide-react';
import { authApi } from '../api/client';
import type { User, Role } from '../types';
import { RoleBadge, LoadingOverlay, ErrorMsg, SectionHeader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const ROLES: Role[] = ['viewer', 'analyst', 'admin'];

interface EditModalProps {
  user: User;
  onSave: (id: number, role: Role, isActive: boolean) => Promise<void>;
  onClose: () => void;
}

function EditModal({ user, onSave, onClose }: EditModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-semibold text-lg mb-1">Edit User</h3>
        <p className="text-slate-400 text-sm mb-5">{user.name} &middot; <span className="font-mono text-xs">{user.email}</span></p>
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Status</label>
            <select value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        {error && <div className="mt-3"><ErrorMsg message={error} /></div>}
        <div className="flex gap-3 mt-5">
          <div onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm text-center cursor-pointer">
            Cancel
          </div>
          <div onClick={loading ? undefined : handleSave}
            className={`flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors text-center cursor-pointer ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            {loading ? 'Saving…' : 'Save Changes'}
          </div>
        </div>
      </div>
    </div>
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
          <div onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm text-center cursor-pointer">
            Cancel
          </div>
          <div onClick={loading ? undefined : handleSubmit}
            className={`flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors text-center cursor-pointer ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            {loading ? 'Creating…' : 'Create User'}
          </div>
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
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
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
    setEditTarget(null);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      await authApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle={`${users.length} users in system`}
        action={
          <div onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500
                       text-white text-sm font-semibold transition-colors cursor-pointer">
            <UserPlus size={14} /> Add User
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
                          <div className="flex gap-1">
                            <div onClick={() => setEditTarget(u)}
                              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer">
                              <Edit3 size={14} />
                            </div>
                            <div onClick={() => { setDeleteError(''); setDeleteTarget(u); }}
                              className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                              <Trash2 size={14} />
                            </div>
                          </div>
                        )}
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <RegisterModal onClose={() => setShowModal(false)} onCreated={load} />}
      {editTarget && <EditModal user={editTarget} onSave={handleSave} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-2">Delete User</h3>
            <p className="text-slate-400 text-sm mb-1">
              Are you sure you want to delete <span className="text-white font-medium">{deleteTarget.name}</span>?
            </p>
            <p className="text-slate-500 text-xs mb-4">{deleteTarget.email}</p>
            {deleteError && <div className="mb-3"><ErrorMsg message={deleteError} /></div>}
            <div className="flex gap-3">
              <div onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm text-center cursor-pointer">
                Cancel
              </div>
              <div onClick={deleteLoading ? undefined : handleDelete}
                className={`flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors text-center cursor-pointer ${deleteLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
