import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMsg, Spinner } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c1a] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96
                        bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30
                          flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">SentinelLog</h1>
          <p className="text-slate-300 text-sm mt-1">Security Log Management</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Sign in</h2>

          {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700
                           text-white placeholder-slate-500 focus:outline-none focus:ring-2
                           focus:ring-blue-500/50 focus:border-blue-500/50 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700
                             text-white placeholder-slate-500 focus:outline-none focus:ring-2
                             focus:ring-blue-500/50 focus:border-blue-500/50 text-sm transition-colors"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold
                         flex items-center justify-center gap-2 transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? <Spinner size="sm" /> : <LogIn size={16} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            No account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
              Register first user
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
