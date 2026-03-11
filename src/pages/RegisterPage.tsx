import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, UserPlus } from 'lucide-react';
import { authApi } from '../api/client';
import { ErrorMsg, Spinner } from '../components/ui';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await authApi.register(form.email, form.password, form.name);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className="min-h-screen bg-[#080c1a] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">SentinelLog</h1>
          <p className="text-slate-300 text-sm mt-1">First-time setup</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-2">Create admin account</h2>
          <p className="text-slate-300 text-xs mb-6">
            This will be the first (admin) user in the system.
          </p>

          {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
          {success && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(['name', 'email', 'password'] as const).map(field => (
              <div key={field}>
                <label className="block text-slate-300 text-sm mb-1.5 capitalize">{field}</label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700
                             text-white placeholder-slate-500 focus:outline-none focus:ring-2
                             focus:ring-blue-500/50 focus:border-blue-500/50 text-sm transition-colors"
                />
              </div>
            ))}
            <div
              onClick={loading ? undefined : submit}
              className={`w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold
                         flex items-center justify-center gap-2 transition-colors text-sm
                         ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loading ? <Spinner size="sm" /> : <UserPlus size={16} />}
              {loading ? 'Creating…' : 'Create account'}
            </div>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
