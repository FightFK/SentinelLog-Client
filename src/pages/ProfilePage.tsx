import { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge, ErrorMsg, SectionHeader, Spinner } from '../components/ui';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name ?? '' });
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [nameLoading, setNameLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passError, setPassError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleNameSave = async () => {
    setNameLoading(true); setNameError(''); setNameSuccess('');
    try {
      await authApi.updateMe({ name: nameForm.name });
      await refreshUser();
      setNameSuccess('Name updated!');
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setNameLoading(false);
    }
  };

  const handlePassSave = async () => {
    if (passForm.newPassword !== passForm.confirm) {
      setPassError('Passwords do not match');
      return;
    }
    setPassLoading(true); setPassError(''); setPassSuccess('');
    try {
      await authApi.updateMe({ oldPassword: passForm.oldPassword, newPassword: passForm.newPassword });
      setPassSuccess('Password updated!');
      setPassForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <SectionHeader title="My Profile" subtitle="Manage your account settings" />

      {/* Profile Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center">
            <User size={28} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{user?.name}</h2>
            <p className="text-slate-300 text-sm">{user?.email}</p>
            <div className="mt-1"><RoleBadge role={user!.role} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Member Since</p>
            <p className="text-slate-200">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Last Login</p>
            <p className="text-slate-200">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}</p>
          </div>
        </div>
      </div>

      {/* Change Name + Change Password */}
      <div className="flex flex-col gap-4">
        {/* Change Name */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <User size={16} className="text-blue-400" /> Change Name
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">Display Name</label>
              <input
                value={nameForm.name}
                onChange={e => setNameForm({ name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white
                           text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
              />
            </div>
            {nameError && <ErrorMsg message={nameError} />}
            {nameSuccess && <p className="text-green-400 text-sm">{nameSuccess}</p>}
            <div onClick={nameLoading ? undefined : handleNameSave}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500
                         text-white text-sm font-semibold transition-colors cursor-pointer
                         ${nameLoading ? 'opacity-60 pointer-events-none' : ''}`}>
              {nameLoading ? <Spinner size="sm" /> : <Save size={14} />}
              Save Name
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Lock size={16} className="text-amber-400" /> Change Password
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">Current Password</label>
              <input
                type="password"
                value={passForm.oldPassword}
                onChange={e => setPassForm(f => ({ ...f, oldPassword: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white
                           text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">New Password</label>
              <input
                type="password"
                value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white
                           text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block">Confirm New Password</label>
              <input
                type="password"
                value={passForm.confirm}
                onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white
                           text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
              />
            </div>
            {passError && <ErrorMsg message={passError} />}
            {passSuccess && <p className="text-green-400 text-sm">{passSuccess}</p>}
            <div onClick={passLoading ? undefined : handlePassSave}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500
                         text-white text-sm font-semibold transition-colors cursor-pointer
                         ${passLoading ? 'opacity-60 pointer-events-none' : ''}`}>
              {passLoading ? <Spinner size="sm" /> : <Lock size={14} />}
              Change Password
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
