import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Radio,
  CheckCircle2,
  Check,
  Compass,
  DollarSign,
  Users,
  Eye,
  Lock,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useProviderStore } from '../store/useProviderStore';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

interface ProviderAuthPageProps {
  initialMode?: 'login' | 'register';
}

const CRAFT_DISCIPLINES = [
  {
    id: 'handloom',
    label: 'Handloom & Textiles',
    icon: '🧵',
    description: 'Rogan painting, indigo vats, block print, Varanasi silk',
  },
  {
    id: 'pottery',
    label: 'Pottery & Metallurgy',
    icon: '🏺',
    description: 'Blue pottery, Dhokra lost-wax, bell metal casting',
  },
  {
    id: 'culinary',
    label: 'Culinary & Hearth',
    icon: '🥘',
    description: 'Generational recipes, spice trails, wood-fired hearths',
  },
  {
    id: 'painting',
    label: 'Folk Art & Painting',
    icon: '🎨',
    description: 'Mithila, Gond, Tanjore gold leaf, Mewar miniature',
  },
  {
    id: 'heritage_walk',
    label: 'Sacred Architecture Walk',
    icon: '🏛️',
    description: 'Ghat rituals, stepwell acoustics, pol house trails',
  },
  {
    id: 'performance',
    label: 'Performance & Music',
    icon: '🪕',
    description: 'Classical Baul, Kathakali masterclass, tribal drumming',
  },
];

const HERITAGE_PRECINCTS = [
  { city: 'Jaipur', precinct: 'Sanganer & Old Pink City' },
  { city: 'Mumbai', precinct: 'Bandra West & Kala Ghoda' },
  { city: 'Varanasi', precinct: 'Madanpura & Ghats' },
  { city: 'Kochi', precinct: 'Fort Kochi & Mattancherry' },
  { city: 'Udaipur', precinct: 'Lake Pichola & Shilpgram' },
  { city: 'Dharamshala', precinct: 'Kangra Valley & Norbulingka' },
  { city: 'Hampi', precinct: 'Anegundi Heritage Village' },
  { city: 'Kutch', precinct: 'Nirona & Bhuj Crafts Hub' },
];

const GENERATION_TIERS = [
  '1st Generation Atelier (Modern Artisan)',
  '3+ Generations (Family Atelier)',
  '5+ Generations (Living Heritage Lineage)',
];

export function ProviderAuthPage({ initialMode = 'login' }: ProviderAuthPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, demoLogin } = useAuth();
  const initializeProviderSession = useProviderStore((s) => s.initializeProviderSession);

  const redirectUrl = searchParams.get('redirect') || '/provider/dashboard';
  const isUpgrade = searchParams.get('upgrade') === 'true';

  const [mode, setMode] = useState<'login' | 'register'>(
    isUpgrade ? 'register' : initialMode
  );

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form fields
  const [guildName, setGuildName] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState(CRAFT_DISCIPLINES[0]);
  const [selectedPrecinct, setSelectedPrecinct] = useState(HERITAGE_PRECINCTS[1]); // Mumbai Bandra
  const [selectedGeneration, setSelectedGeneration] = useState(GENERATION_TIERS[1]);
  const [isStepFree, setIsStepFree] = useState(true);
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      await login(loginEmail, loginPassword, 'provider');
      navigate(redirectUrl);
    } catch (err: any) {
      setAuthError(err?.message || 'Host login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName || !regEmail) {
      setAuthError('Please provide your Guild / Studio name and contact email.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      await register(regEmail, guildName, regPassword, 'provider');
      
      // Initialize living provider session in store
      initializeProviderSession({
        guildName,
        craftSpecialty: selectedDiscipline.label,
        city: selectedPrecinct.city,
        precinct: selectedPrecinct.precinct,
        heritage: selectedGeneration,
        isAccessible: isStepFree,
        email: regEmail,
        phone: regPhone,
      });

      navigate(redirectUrl);
    } catch (err: any) {
      setAuthError(err?.message || 'Artisan registration encountered an issue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneTapDemoLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await demoLogin(
        'provider',
        'Heritage Horizons & Local Trails Collective',
        'provider@lokiva.com'
      );
      navigate('/provider/dashboard');
    } catch (err: any) {
      setAuthError('Failed to initialize demo host session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#FAF7F2] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        
        {/* LEFT COLUMN: Luxury Heritage Showcase & Value Proposition */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#FAF4ED] to-[#F3EAD8] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Subtle decorative background watermark */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C85A32]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#C85A32] bg-white/80 border border-[#E8DEC8] px-3 py-1 rounded-full shadow-2xs">
                Verified Artisan Portal
              </span>
              <span className="text-[11px] font-mono text-[#556275] bg-[#FAF7F2] px-2 py-1 rounded-md border border-[#E5DFD5]">
                Direct Payouts
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#12213B] leading-tight">
                Turn your living craft into high-yield traveler masterclasses.
              </h1>
              <p className="text-xs sm:text-sm text-[#556275] leading-relaxed">
                Join India's dedicated Cultural Travel Operating System. Connect directly with conscious travelers without OTA middlemen or souvenir shop commissions.
              </p>
            </div>

            {/* Zero Commission Guarantee Card */}
            <div className="bg-white rounded-2xl border border-[#E5DFD5] p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#12213B]">
                  <ShieldCheck className="w-4 h-4 text-[#C85A32]" />
                  <span>0% Middleman Commission Guarantee</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                  100% Payout
                </span>
              </div>
              <p className="text-xs text-[#556275] leading-normal">
                Every rupee paid by travelers transfers directly to your verified UPI or bank settlement account on day of completion.
              </p>
            </div>

            {/* Signature Feature Preview: The Flash Beacon Engine */}
            <div className="bg-white rounded-2xl border border-[#E8DEC8] p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#12213B]">
                  <Radio className="w-4 h-4 text-[#C85A32] animate-pulse" />
                  <span>Interactive Flash Beacon Live Yield</span>
                </div>
                <span className="text-[10px] font-mono text-[#C85A32] font-bold">
                  Signature Feature
                </span>
              </div>
              <div className="p-3 bg-[#FAF4ED] rounded-xl border border-[#E8DEC8] space-y-2">
                <div className="flex items-center justify-between text-xs font-heading">
                  <span className="text-[#12213B] font-bold">4 Unfilled Spots at 5:00 PM</span>
                  <span className="text-[#C85A32] font-extrabold font-mono">30% OFF Flash Deal</span>
                </div>
                <p className="text-[11px] text-[#556275] leading-normal">
                  One-tap broadcast notifies active travelers within 5 km. Fills empty workshop capacity within 45 minutes!
                </p>
              </div>
            </div>

            {/* Value Pillars */}
            <div className="grid grid-cols-2 gap-2 text-xs font-heading font-semibold text-[#12213B]">
              <div className="flex items-center gap-1.5 p-2 bg-white/70 rounded-xl border border-[#E5DFD5]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] shrink-0" />
                <span>KYC Level 2 Trust Badge</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-white/70 rounded-xl border border-[#E5DFD5]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] shrink-0" />
                <span>Dynamic Seat Management</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-white/70 rounded-xl border border-[#E5DFD5]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] shrink-0" />
                <span>Instant Seat Claims & Push</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-white/70 rounded-xl border border-[#E5DFD5]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] shrink-0" />
                <span>Itinerary Solver Inclusion</span>
              </div>
            </div>
          </div>

          {/* Quick One-Tap Demo Host Login */}
          <div className="pt-6 mt-6 border-t border-[#E8DEC8] space-y-2 relative z-10">
            <button
              type="button"
              onClick={handleOneTapDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF4ED] text-[#C85A32] border border-[#C85A32] rounded-xl text-xs font-heading font-extrabold transition shadow-2xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Instant 1-Tap Demo Artisan Host Login</span>
            </button>
            <p className="text-[10px] text-center text-[#556275] font-mono">
              Pre-loads living workshop slots, active bookings ledger, and Flash Beacon controls
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Sign In / Register Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5DFD5] p-6 sm:p-8 lg:p-10 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            {/* Mode Switcher Pills */}
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-[#12213B]">
                  {mode === 'login' ? 'Artisan Host Sign In' : 'Register Guild / Workshop'}
                </h2>
                <p className="text-xs text-[#556275] mt-0.5">
                  {mode === 'login'
                    ? 'Access your workshop slots, active guest bookings, and live Flash Beacon deck'
                    : 'List your generational craft atelier on LOKIVA with zero commissions'}
                </p>
              </div>

              <div className="flex p-1 bg-[#FAF7F2] rounded-xl border border-[#E5DFD5]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthError(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition ${
                    mode === 'login'
                      ? 'bg-[#12213B] text-white shadow-2xs'
                      : 'text-[#556275] hover:text-[#12213B]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setAuthError(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition ${
                    mode === 'register'
                      ? 'bg-[#C85A32] text-white shadow-2xs'
                      : 'text-[#556275] hover:text-[#12213B]'
                  }`}
                >
                  Register Guild
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-[#FAF4ED] border border-[#C85A32]/40 rounded-xl text-xs text-[#C85A32] font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            {/* TAB CONTENT: LOGIN FORM */}
            {mode === 'login' && (
              <div className="space-y-4">
                {/* 1-Click Instant Demo Provider Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF4ED] to-[#F5EADB] border-2 border-[#C85A32] shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C85A32]" />
                      <span className="text-xs font-heading font-extrabold text-[#12213B]">
                        Instant 1-Click Demo Provider Access
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-[#C85A32] text-white px-2 py-0.5 rounded-full">
                      Pre-loaded Data
                    </span>
                  </div>
                  <p className="text-[11px] text-[#556275] leading-normal">
                    Experience the complete B2B Provider Workspace OS for <strong>Heritage Horizons & Local Trails</strong> with 12 bookings, 28 availability slots, AI Concierge co-pilot, and live earnings ledger.
                  </p>
                  <button
                    type="button"
                    onClick={handleOneTapDemoLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#12213B] hover:bg-[#1A2F50] text-white rounded-xl text-xs font-heading font-extrabold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Launch Demo Provider Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <GoogleSignInButton role="provider" text="Continue as Host with Google" redirectTo="/provider" />

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#E5DFD5]" />
                  <span className="text-[11px] font-mono text-[#556275] uppercase tracking-wider font-semibold">
                    Or with Host Credentials
                  </span>
                  <div className="flex-1 h-px bg-[#E5DFD5]" />
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                      Host Contact Email
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="off"
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3.5 py-2.5 text-xs text-[#12213B] focus:outline-none focus:border-[#C85A32] transition font-sans"
                      placeholder=""
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3.5 py-2.5 text-xs text-[#12213B] focus:outline-none focus:border-[#C85A32] transition font-sans"
                      placeholder=""
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#12213B] hover:bg-[#1A2E4C] text-[#FAF7F2] font-heading font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#D99B43]" />
                    <span>{isLoading ? 'Authenticating Host Portal...' : 'Access Artisan Dashboard →'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: INTERACTIVE MULTI-STEP REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {/* 1. Guild / Atelier Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                    1. Guild, Studio, or Atelier Name
                  </label>
                  <input
                    type="text"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    required
                    autoComplete="off"
                    className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3.5 py-2.5 text-xs text-[#12213B] focus:outline-none focus:border-[#C85A32] transition font-sans font-semibold"
                    placeholder=""
                  />
                </div>

                {/* 2. Master Craft Discipline (Tactile Cards) */}
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                    2. Master Craft Discipline
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CRAFT_DISCIPLINES.map((discipline) => {
                      const isSelected = selectedDiscipline.id === discipline.id;
                      return (
                        <button
                          key={discipline.id}
                          type="button"
                          onClick={() => setSelectedDiscipline(discipline)}
                          className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#FAF4ED] border-[#C85A32] shadow-2xs'
                              : 'bg-[#FAF8F5] hover:bg-[#FAF4ED]/50 border-[#E5DFD5]'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-base">{discipline.icon}</span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-[#C85A32] text-white flex items-center justify-center text-[10px]">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-heading font-bold text-[#12213B] leading-tight">
                              {discipline.label}
                            </div>
                            <div className="text-[10px] text-[#556275] line-clamp-1 mt-0.5 font-sans">
                              {discipline.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Operating City & Heritage Precinct (Interactive Chips) */}
                <div className="space-y-2">
                  <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                    3. Operating City & Heritage Precinct
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {HERITAGE_PRECINCTS.map((precinct) => {
                      const isSelected =
                        selectedPrecinct.city === precinct.city &&
                        selectedPrecinct.precinct === precinct.precinct;
                      return (
                        <button
                          key={precinct.city + precinct.precinct}
                          type="button"
                          onClick={() => setSelectedPrecinct(precinct)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-heading transition border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#12213B] text-white border-[#12213B] font-bold shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#12213B] border-[#E5DFD5] hover:bg-[#FAF4ED]'
                          }`}
                        >
                          <span className="font-bold">{precinct.city}</span>
                          <span className="text-[10px] opacity-75">· {precinct.precinct}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Heritage Lineage & Step-Free Accessibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                      Generational Heritage
                    </label>
                    <select
                      value={selectedGeneration}
                      onChange={(e) => setSelectedGeneration(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:outline-none focus:border-[#C85A32] font-sans"
                    >
                      {GENERATION_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                      Accessibility Compliance
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsStepFree(!isStepFree)}
                      className={`w-full p-2 rounded-xl border text-xs font-heading transition flex items-center justify-between ${
                        isStepFree
                          ? 'bg-[#FAF4ED] border-[#C85A32] text-[#C85A32] font-bold'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#556275]'
                      }`}
                    >
                      <span>♿ Step-Free / Ground Floor</span>
                      <span className="text-xs font-mono font-bold">
                        {isStepFree ? '✓ Enabled' : 'No'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 5. Contact Details & Security */}
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                        Host Email
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        autoComplete="off"
                        className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:outline-none focus:border-[#C85A32] font-sans"
                        placeholder=""
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        autoComplete="tel"
                        className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:outline-none focus:border-[#C85A32] font-sans"
                        placeholder=""
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-heading font-bold text-[#12213B] uppercase tracking-wider block">
                      Account Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:outline-none focus:border-[#C85A32] font-sans"
                      placeholder=""
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#C85A32] hover:bg-[#B34322] text-white font-heading font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>{isLoading ? 'Creating Guild Account...' : 'Complete Guild Registration & Open Dashboard →'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-[#E5DFD5] text-center text-xs text-[#556275]">
            Looking to explore as a cultural traveler?{' '}
            <Link to="/explore" className="text-[#C85A32] font-heading font-bold hover:underline">
              Switch to Traveler Discovery
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProviderAuthPage;
