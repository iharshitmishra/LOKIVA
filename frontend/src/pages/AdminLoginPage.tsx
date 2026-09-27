import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Compass, Shield, Lock } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@lokiva.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, 'admin');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-paper-400 p-8 space-y-6 shadow-xl text-ink">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-clay flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold font-display text-ink">Command Center</span>
          </Link>
          <h1 className="text-xl font-bold font-display text-ink">Platform Administrator</h1>
          <p className="text-xs text-dusk-600 font-sans">Live Twin Overall Dashboard, KYC verification, and platform moderation</p>
        </div>

        <GoogleSignInButton role="admin" />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-paper-300" />
          <span className="text-[10px] font-mono font-bold text-dusk uppercase tracking-wider">
            Or Admin Key
          </span>
          <div className="flex-1 h-px bg-paper-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-dusk uppercase block font-bold">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-paper-100 border border-paper-300 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-clay font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-dusk uppercase block font-bold">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-paper-100 border border-paper-300 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-clay font-sans"
            />
          </div>

          {error && (
            <p className="text-xs text-clay bg-clay-50 p-2.5 rounded-xl border border-clay-200 text-center font-sans">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-clay hover:bg-clay-600 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Enter Command Center & Live Twin'}
          </button>
        </form>
      </div>
    </div>
  );
}
