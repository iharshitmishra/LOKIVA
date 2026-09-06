import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Compass } from 'lucide-react';

export function TravelerRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/explore';
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setLoading(true);
    setError(null);
    try {
      await register(email, fullName, password, 'traveler');
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-paper-400 p-8 space-y-6 shadow-xl text-ink">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5 text-marigold" />
            </div>
            <span className="text-2xl font-bold font-display text-ink">LOKIVA</span>
          </Link>
          <h1 className="text-xl font-bold font-display text-ink">Join as Cultural Traveler</h1>
          <p className="text-xs text-dusk-600 font-sans">Save cultural trails, custom itineraries, and AI recommendations</p>
        </div>

        <GoogleSignInButton role="traveler" text="Sign up with Google" redirectTo={redirectTo} />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-paper-300" />
          <span className="text-[10px] font-mono font-bold text-dusk uppercase tracking-wider">
            Or with Email
          </span>
          <div className="flex-1 h-px bg-paper-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-dusk uppercase block font-bold">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Piyush Kumar"
              className="w-full bg-paper-100 border border-paper-300 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-marigold font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-dusk uppercase block font-bold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="w-full bg-paper-100 border border-paper-300 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-marigold font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-dusk uppercase block font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-paper-100 border border-paper-300 rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-marigold font-sans"
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
            className="w-full py-3 bg-ink hover:bg-ink-800 text-paper font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Join as Traveler →'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-dusk-600 font-sans">
          Already registered?{' '}
          <Link to="/login/traveler" className="text-marigold-700 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
