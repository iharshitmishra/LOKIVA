import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Compass, User, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/explore';
  const { login, demoLogin } = useAuth();
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
      await login(email.trim(), password);
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#FFFDF9] rounded-3xl border border-[#DFCBB2] p-8 space-y-6 shadow-xl text-[#3B2316]">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-[#3B2316] flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6 text-[#D47A39]" />
            </div>
            <span className="text-2xl font-bold font-display text-[#3B2316] tracking-tight">LOKIVA</span>
          </Link>
          <h1 className="text-2xl font-black font-display text-[#3B2316]">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-[#7A5C49] font-meta">
            Sign in to access verified cultural circuits, group travel hubs, and AI recommendations
          </p>
        </div>

        {/* Real Google OAuth Popup Sign In */}
        <GoogleSignInButton role="traveler" redirectTo={redirectTo} />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E2D5BE]" />
          <span className="text-[11px] font-meta font-extrabold text-[#7A5C49] uppercase tracking-wider">
            Or with Email
          </span>
          <div className="flex-1 h-px bg-[#E2D5BE]" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-meta text-xs">
          <div className="space-y-1.5">
            <label className="text-[#3B2316] uppercase block font-bold tracking-wider text-xs">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
              className="w-full bg-[#FAF6F0] border border-[#DFCBB2] focus:border-[#B84A27] rounded-2xl p-3.5 text-sm text-[#3B2316] outline-none font-sans transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#3B2316] uppercase block font-bold tracking-wider text-xs">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              className="w-full bg-[#FAF6F0] border border-[#DFCBB2] focus:border-[#B84A27] rounded-2xl p-3.5 text-sm text-[#3B2316] outline-none font-sans transition-all"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FAF4ED] border border-[#E8DEC8] text-[#B84A27] text-xs font-sans flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Approved Warm Spiced Terracotta Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] font-heading font-extrabold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Instant Demo Section */}
        <div className="pt-4 border-t border-[#E2D5BE] space-y-2.5">
          <span className="text-[10px] font-mono font-bold text-[#7A5C49] uppercase tracking-wider block text-center">
            Instant 1-Click Demo Accounts
          </span>
          <div className="space-y-2 font-mono">
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
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#7A5C49] font-sans pt-1">
          <Link to="/register/traveler" className="text-[#B84A27] font-bold hover:underline">
            New traveler? Register
          </Link>
          <span className="text-[#DFCBB2]">•</span>
          <Link to="/login/admin" className="text-sky-700 font-bold hover:underline">
            Admin Portal →
          </Link>
          <span className="text-[#DFCBB2]">•</span>
          <Link to="/provider/login" className="text-[#12213B] font-bold hover:underline">
            Host Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
