import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth-context';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Compass, User, Shield, AlertCircle, Sparkles } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/explore';
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'traveler';
  const { login, demoLogin } = useAuth();

  const [role, setRole] = useState<'traveler' | 'provider'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password, role);
      const target = (redirectTo === '/explore' && role === 'provider') ? '/provider/dashboard' : redirectTo;
      navigate(target);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl border border-[#E5DFD5] p-6 sm:p-8 space-y-6 shadow-xl text-[#12213B]">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-[#12213B] flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6 text-[#D47A39]" />
            </div>
            <span className="text-2xl font-bold font-display text-[#12213B] tracking-tight">LOKIVA</span>
          </Link>
          <h1 className="text-2xl font-black font-display text-[#12213B]">
            {role === 'provider' ? 'Cultural Host Portal' : 'Welcome Back'}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B5D] font-sans">
            {role === 'provider'
              ? 'Sign in with your credentials to authorize and manage your atelier & workshops'
              : 'Sign in to access verified cultural circuits, group travel hubs, and AI recommendations'}
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] rounded-2xl border border-[#E5DFD5] relative">
          <button
            type="button"
            onClick={() => {
              setRole('traveler');
              setError(null);
            }}
            className={`relative py-2.5 px-3 rounded-xl text-xs font-heading font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 ${
              role === 'traveler' ? 'text-white' : 'text-[#7A6B5D] hover:text-[#12213B]'
            }`}
          >
            {role === 'traveler' && (
              <motion.div
                layoutId="loginRoleTab"
                className="absolute inset-0 bg-[#C1443B] rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', damping: 22, stiffness: 240 }}
              />
            )}
            <Compass className="w-3.5 h-3.5" />
            <span>Traveler Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('provider');
              setError(null);
            }}
            className={`relative py-2.5 px-3 rounded-xl text-xs font-heading font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 ${
              role === 'provider' ? 'text-white' : 'text-[#7A6B5D] hover:text-[#12213B]'
            }`}
          >
            {role === 'provider' && (
              <motion.div
                layoutId="loginRoleTab"
                className="absolute inset-0 bg-[#C1443B] rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', damping: 22, stiffness: 240 }}
              />
            )}
            <Shield className="w-3.5 h-3.5" />
            <span>Cultural Host / Provider</span>
          </button>
        </div>

        {/* Real Google OAuth Popup Sign In */}
        <GoogleSignInButton role={role} redirectTo={redirectTo} />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E5DFD5]" />
          <span className="text-[11px] font-heading font-extrabold text-[#7A6B5D] uppercase tracking-wider">
            Or with Email
          </span>
          <div className="flex-1 h-px bg-[#E5DFD5]" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="space-y-1.5">
            <label className="text-[#12213B] uppercase block font-heading font-bold tracking-wider text-xs">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'provider' ? 'host@atelier.com' : 'traveler@lokiva.com'}
              className="w-full bg-[#FAF7F2] border border-[#E5DFD5] focus:border-[#C1443B] rounded-2xl p-3.5 text-sm text-[#12213B] outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#12213B] uppercase block font-heading font-bold tracking-wider text-xs">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF7F2] border border-[#E5DFD5] focus:border-[#C1443B] rounded-2xl p-3.5 text-sm text-[#12213B] outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FCE8E6] border border-[#F5C2BC] text-[#C1443B] text-xs font-sans flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Role-Specific Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#C1443B] to-[#D47A39] hover:from-[#A83830] hover:to-[#C1443B] text-white font-heading font-extrabold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'Authorizing...'
              : role === 'provider'
              ? 'Authorize & Sign In as Cultural Host'
              : 'Sign In as Traveler'}
          </button>
        </form>

        {/* 1-Click Instant Demo Section */}
        {/* 1-Click Instant Demo Section */}
        <div className="pt-4 border-t border-[#E2D5BE] space-y-2.5">
          <span className="text-[10px] font-mono font-bold text-[#7A5C49] uppercase tracking-wider block text-center">
            Instant 1-Click Demo Accounts
          </span>
          <div className="space-y-2 font-mono">
            {role === 'provider' ? (
              <button
                type="button"
                onClick={async () => {
                  await demoLogin('provider', 'Heritage Horizons & Local Trails Collective', 'provider@lokiva.com');
                  navigate('/provider/dashboard');
                }}
                className="w-full p-2.5 bg-gradient-to-r from-[#FAF4ED] to-[#F5EADB] hover:from-[#F5EADB] hover:to-[#EEDBBE] rounded-xl text-[11px] font-bold text-[#C85A32] border border-[#C85A32]/40 flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Access Provider Portal (Demo Host: Heritage Horizons)</span>
              </button>
            ) : (
              <>
                {/* Demo Traveler */}
                <button
                  type="button"
                  onClick={() => {
                    demoLogin('traveler', 'Piyush Kumar', 'piyush@lokiva.com');
                    navigate(redirectTo);
                  }}
                  className="w-full p-2.5 bg-[#FAF6F0] hover:bg-[#F2EAE0] rounded-xl text-[11px] font-bold text-[#3B2316] border border-[#DFCBB2] flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Explore as Piyush Kumar (Demo Traveler)</span>
                </button>

                {/* Demo Provider / Host */}
                <button
                  type="button"
                  onClick={async () => {
                    await demoLogin('provider', 'Heritage Horizons & Local Trails Collective', 'provider@lokiva.com');
                    navigate('/provider/dashboard');
                  }}
                  className="w-full p-2.5 bg-gradient-to-r from-[#FAF4ED] to-[#F5EADB] hover:from-[#F5EADB] hover:to-[#EEDBBE] rounded-xl text-[11px] font-bold text-[#C85A32] border border-[#C85A32]/40 flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>Access Provider Portal (Demo Host: Heritage Horizons)</span>
                </button>

                {/* Demo Administrator (Live Twin Overall Dashboard) */}
                <button
                  type="button"
                  onClick={async () => {
                    await demoLogin('admin', 'Platform Administrator', 'admin@lokiva.com');
                    navigate('/admin');
                  }}
                  className="w-full p-2.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 rounded-xl text-[11px] font-bold text-sky-900 border border-sky-300 flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sign in as Administrator (Live Twin Overall Dashboard)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Registration & Portal Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A5C49] font-sans pt-1 gap-2">
          {role === 'provider' ? (
            <Link to="/register/provider" className="text-[#C1443B] font-heading font-bold hover:underline">
              New cultural host? Register →
            </Link>
          ) : (
            <Link to="/register/traveler" className="text-[#B84A27] font-bold hover:underline">
              New traveler? Register
            </Link>
          )}
          <span className="hidden sm:inline text-[#DFCBB2]">•</span>
          <Link to="/login/admin" className="text-sky-700 font-bold hover:underline">
            Admin Portal →
          </Link>
          <span className="hidden sm:inline text-[#DFCBB2]">•</span>
          <Link to="/provider/login" className="text-[#12213B] font-bold hover:underline">
            Host Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
