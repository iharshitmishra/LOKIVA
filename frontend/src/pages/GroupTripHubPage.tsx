import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  Share2,
  Copy,
  Sparkles,
  ShieldCheck,
  Send,
  MessageSquare,
  Clock,
  Heart,
  Mountain,
  Castle,
  Palmtree,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings2,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useGroupTripStore } from '../store/useGroupTripStore';
import { CrewSynergyRadar } from '../components/group/CrewSynergyRadar';
import { GroupRecommendationBoard } from '../components/group/GroupRecommendationBoard';
import { GroupRealTimeChat } from '../components/group/GroupRealTimeChat';
import {
  MemberQuizAnswers,
  GroupTripSession,
  GroupMember,
  GroupRecommendationCard,
} from '../types/groupTrip';

interface GroupTripHubPageProps {
  mode: 'create' | 'room';
}

const INTEREST_OPTIONS = [
  { id: 'Artisan Crafts', label: 'Artisan Guilds & Crafts', desc: 'Handloom weaving, pottery, block printing' },
  { id: 'Street Gastronomy', label: 'Street Food & Hearths', desc: 'Generational recipes, local bazaars, chai halts' },
  { id: 'Mountain Treks', label: 'Mountain Treks & Passes', desc: 'Himalayan ridges, pine forest trails, vistas' },
  { id: 'Royal Forts', label: 'Royal Forts & Stepwells', desc: 'Mughal & Rajput architecture, hidden palaces' },
  { id: 'Coastal Cafes', label: 'Backwaters & Coastal Cafes', desc: 'Konkan beaches, palm groves, seafood shacks' },
  { id: 'Sacred Ghats', label: 'Sacred Temples & Ghats', desc: 'Evening aartis, ancient corridors, river rituals' },
  { id: 'Offbeat Villages', label: 'Offbeat Villages & Hamlets', desc: 'Unmapped settlements, community kitchens' },
];

const TERRAIN_OPTIONS = [
  { id: 'Mountains & Valleys', label: 'Mountains & Valleys', desc: 'Cool alpine air, panoramic ridge lines' },
  { id: 'Royal & Heritage Cities', label: 'Royal & Heritage Cities', desc: 'Living havelis, stone fortresses, bazaars' },
  { id: 'Coastal & Backwaters', label: 'Coastal & Backwaters', desc: 'Tropical shores, estuary cruises, coconut groves' },
  { id: 'Spiritual & River Ghats', label: 'Spiritual & River Ghats', desc: 'Sacred waters, devotional music, temple towns' },
] as const;

const PACE_OPTIONS = [
  { id: 'Relaxed', label: 'Relaxed Pace', desc: '1 to 2 focal stops daily, leisurely lunches' },
  { id: 'Balanced', label: 'Balanced Pace', desc: '3 to 4 stops with buffered transit times' },
  { id: 'Packed', label: 'Packed Explorer', desc: 'Dawn-to-dusk cultural trail with maximum variety' },
] as const;

export function GroupTripHubPage({ mode }: GroupTripHubPageProps) {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    sessions,
    createGroupSession,
    joinGroupSession,
    submitMemberQuiz,
    addChatMessage,
    reactToMessage,
  } = useGroupTripStore();

  // ─── Mode: Create Group State ───
  const [groupName, setGroupName] = useState('');
  const [travelerCount, setTravelerCount] = useState(4);
  const [isCreating, setIsCreating] = useState(false);

  // ─── Mode: Room & Member State ───
  const activeSession: GroupTripSession | undefined = groupId ? sessions[groupId] : undefined;
  const currentUserId = user ? String(user.id) : '';

  // Current member in this group
  const currentMember: GroupMember | undefined = activeSession?.members.find(
    (m) => m.id === currentUserId || (user?.email && m.email === user.email)
  );

  const hasCompletedQuiz = Boolean(currentMember?.quizAnswers && currentMember?.status === 'ready');
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);

  // Auto-join current user if opening shared room link and not in group yet
  useEffect(() => {
    if (mode === 'room' && groupId && user) {
      const existing = sessions[groupId];
      if (existing) {
        const userIdStr = String(user.id);
        const isAlreadyMember = existing.members.some(
          (m) => m.id === userIdStr || (user.email && m.email === user.email)
        );
        if (!isAlreadyMember) {
          joinGroupSession(groupId, {
            id: userIdStr,
            name: user.full_name || user.email?.split('@')[0] || 'Traveler',
            email: user.email || '',
          });
        }
      }
    }
  }, [mode, groupId, user?.id, user?.email, sessions[groupId]?.members.length, joinGroupSession]);

  // ─── 5-Step Quiz State ───
  const [quizStep, setQuizStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [budgetPerPerson, setBudgetPerPerson] = useState(25000);
  const [tripDays, setTripDays] = useState(4);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Artisan Crafts',
    'Street Gastronomy',
  ]);
  const [terrain, setTerrain] = useState<MemberQuizAnswers['terrainPreference']>('Royal & Heritage Cities');
  const [pace, setPace] = useState<MemberQuizAnswers['pace']>('Balanced');
  const [lowWalking, setLowWalking] = useState(false);

  // Pre-fill display name when user is known
  useEffect(() => {
    if (user?.full_name && !displayName) {
      setDisplayName(user.full_name);
    }
    if (currentMember?.quizAnswers) {
      const qa = currentMember.quizAnswers;
      setDisplayName(qa.memberName || user?.full_name || '');
      setBudgetPerPerson(qa.budgetPerPerson || 25000);
      setTripDays(qa.tripDays || 4);
      setSelectedInterests(qa.interests || ['Artisan Crafts']);
      setTerrain(qa.terrainPreference || 'Royal & Heritage Cities');
      setPace(qa.pace || 'Balanced');
      setLowWalking(qa.lowWalkingRequired || false);
    }
  }, [user, currentMember, displayName]);

  // Share & Copy Link Toast state
  const [copiedLink, setCopiedLink] = useState(false);

  // Handler: Host creates new group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmedName = groupName.trim();
    if (!trimmedName) return;

    setIsCreating(true);
    try {
      const newId = createGroupSession(trimmedName, travelerCount, {
        id: String(user.id),
        name: user.full_name || 'Group Host',
        email: user.email || '',
      });
      navigate(`/group/${newId}`);
    } catch (err) {
      console.error('Failed to create group session:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Handler: Toggle Interest Selection (2 to 4 allowed)
  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((item) => item !== id));
      }
    } else {
      if (selectedInterests.length < 4) {
        setSelectedInterests([...selectedInterests, id]);
      }
    }
  };

  // Handler: Submit Member Preferences Quiz
  const handleSubmitQuiz = () => {
    if (!groupId || !currentMember) return;

    const answers: MemberQuizAnswers = {
      memberId: currentMember.id,
      memberName: displayName.trim() || currentMember.name,
      budgetPerPerson,
      interests: selectedInterests,
      pace,
      terrainPreference: terrain,
      tripDays,
      lowWalkingRequired: lowWalking,
      submittedAt: new Date().toISOString(),
    };

    submitMemberQuiz(groupId, currentMember.id, answers);
    setIsEditingQuiz(false);
  };

  // Handler: Copy Room Invite URL
  const inviteUrl = typeof window !== 'undefined' && groupId ? `${window.location.origin}/group/${groupId}` : '';

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW A: HOST GROUP CREATION (/group/new)
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#12213B] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Header breadcrumb & Pill */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DEC8] text-[#C85A32] text-xs font-meta font-extrabold uppercase tracking-widest shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#D99B43]" />
              <span>Lokiva Group Hub · Step 1 of 2</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-ink tracking-tight">
              Create a Group Trip Room
            </h1>
            <p className="text-xs sm:text-sm text-dusk-600 font-sans max-w-md mx-auto leading-relaxed">
              Skip messy WhatsApp polls. Create your trip hub, invite friends via WhatsApp, and synthesize everyone's budget and cultural interests in real time.
            </p>
          </div>

          {/* Creation Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-[#E8DEC8] p-6 sm:p-8 shadow-xl shadow-[#12213B]/5 space-y-6"
          >
            <form onSubmit={handleCreateGroup} className="space-y-6">
              {/* Question 1: Group Name */}
              <div className="space-y-2">
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-ink">
                  1. Name Your Group Expedition
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Konkan Monsoon Squad, Himalayan Grad Trip 2026"
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl text-sm font-sans font-medium text-ink placeholder:text-dusk-400 focus:outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 transition"
                />
                <span className="text-[11px] text-dusk-500 font-meta block">
                  Give your crew a memorable name. You can customize details later.
                </span>
              </div>

              {/* Question 2: Traveler Count Stepper */}
              <div className="space-y-2">
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-ink">
                  2. How Many Travelers Are in Your Crew?
                </label>
                <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#DDD7CC]">
                  <div className="space-y-0.5">
                    <span className="text-sm font-heading font-bold text-ink">
                      {travelerCount} Explorers Expected
                    </span>
                    <p className="text-[11px] text-dusk-500 font-meta">
                      Including yourself as the trip host
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTravelerCount(Math.max(2, travelerCount - 1))}
                      disabled={travelerCount <= 2}
                      className="w-9 h-9 rounded-xl bg-white border border-[#DDD7CC] text-ink font-heading font-bold hover:bg-[#FAF4ED] disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-display font-black text-base text-ink">
                      {travelerCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTravelerCount(Math.min(15, travelerCount + 1))}
                      disabled={travelerCount >= 15}
                      className="w-9 h-9 rounded-xl bg-white border border-[#DDD7CC] text-ink font-heading font-bold hover:bg-[#FAF4ED] disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Host Persona Confirmation */}
              <div className="p-3.5 rounded-2xl bg-[#FAF4ED] border border-[#E8DEC8] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#C85A32] text-white flex items-center justify-center font-display font-bold text-xs">
                    {user?.full_name ? user.full_name[0].toUpperCase() : 'H'}
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-ink">
                      {user?.full_name || 'You (Host)'}
                    </div>
                    <div className="text-[10px] text-dusk-600 font-meta">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C85A32] bg-white px-2 py-1 rounded-md border border-[#E8DEC8]">
                  Trip Creator
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!groupName.trim() || isCreating}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#C85A32] to-[#D99B43] hover:from-[#B84E28] hover:to-[#C88A33] disabled:opacity-50 text-white font-heading font-bold text-sm tracking-wide shadow-lg shadow-[#C85A32]/25 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>{isCreating ? 'Generating Group Room...' : 'Create Group Hub & Generate Invite Link'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW B: ROOM NOT FOUND RECOVERY
  // ═══════════════════════════════════════════════════════════════════════════
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-ink flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8DEC8] p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF4ED] border border-[#E8DEC8] text-[#C85A32] flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-display font-black text-ink">Group Room Not Found</h2>
          <p className="text-xs text-dusk-600 font-sans leading-relaxed">
            The group room with ID <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded text-[#C85A32] font-mono font-bold">{groupId}</code> might have been created in another session or cleared from browser memory.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/group/new')}
              className="w-full py-3 bg-[#C85A32] hover:bg-[#B84E28] text-white font-heading font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Create a New Group Trip
            </button>
            <Link
              to="/"
              className="w-full py-2.5 bg-white border border-[#DDD7CC] hover:bg-[#FAF8F5] text-ink font-heading font-semibold text-xs rounded-xl transition"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW C: 5-STEP MEMBER ONBOARDING PREFERENCE QUIZ
  // Shown to host and every invited member who has not completed it yet
  // ═══════════════════════════════════════════════════════════════════════════
  if (!hasCompletedQuiz || isEditingQuiz) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-ink pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Context Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
            <div className="space-y-0.5">
              <span className="text-[10px] font-meta font-extrabold uppercase tracking-widest text-[#C85A32]">
                Group: {activeSession.groupName}
              </span>
              <h2 className="text-lg sm:text-xl font-display font-black text-ink">
                Personal Preference &amp; Budget Calibration
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-dusk-500 uppercase">Step</span>
              <div className="text-sm font-display font-black text-[#C85A32]">
                {quizStep} <span className="text-dusk-400 font-mono text-xs">/ 5</span>
              </div>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full h-1.5 bg-[#E8DEC8]/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C85A32] to-[#D99B43] transition-all duration-300 rounded-full"
              style={{ width: `${(quizStep / 5) * 100}%` }}
            />
          </div>

          {/* Quiz Card */}
          <motion.div
            key={`step-${quizStep}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-[#E8DEC8] p-6 sm:p-8 shadow-xl shadow-[#12213B]/5 space-y-6"
          >
            {/* STEP 1: DISPLAY NAME */}
            {quizStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#C85A32]">
                    Step 1 of 5
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-ink">
                    Confirm Your Display Name
                  </h3>
                  <p className="text-xs text-dusk-600 font-sans leading-relaxed">
                    This is how your friends in <span className="font-bold text-ink">{activeSession.groupName}</span> will see your votes and recommendations.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name or nickname"
                    className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl text-sm font-sans font-bold text-ink focus:outline-none focus:border-[#C85A32] transition"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-[#7A5C49] font-meta">
                    <ShieldCheck className="w-4 h-4 text-[#B84A27]" />
                    <span>Logged in as {user?.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PRIVATE COMFORT BUDGET */}
            {quizStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#B84A27]">
                    Step 2 of 5
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-[#3B2316]">
                    Your Personal Comfort Budget (₹ INR)
                  </h3>
                  <p className="text-sm text-[#7A5C49] font-sans leading-relaxed">
                    Used to compute a fair group sweet-spot so nobody feels stretched or overspent.
                  </p>
                </div>

                {/* Big Budget Value Display */}
                <div className="text-center p-5 rounded-2xl bg-[#FAF4ED] border border-[#E8DEC8] space-y-1">
                  <span className="text-xs font-mono font-bold uppercase text-[#7A5C49]">
                    YOUR TARGET CEILING PER PERSON
                  </span>
                  <div className="text-3xl sm:text-4xl font-display font-black text-[#3B2316]">
                    ₹{budgetPerPerson.toLocaleString('en-IN')}{' '}
                    <span className="text-sm font-mono text-[#7A5C49] font-bold">INR</span>
                  </div>
                  <span className="text-xs font-meta text-[#B84A27] font-semibold block">
                    Kept strictly private from friends
                  </span>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={8000}
                    max={80000}
                    step={1000}
                    value={budgetPerPerson}
                    onChange={(e) => setBudgetPerPerson(Number(e.target.value))}
                    className="w-full accent-[#C85A32] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-dusk-400 font-bold">
                    <span>₹8,000</span>
                    <span>₹40,000</span>
                    <span>₹80,000+</span>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: '₹12k Backpacker', value: 12000 },
                    { label: '₹22k Comfort', value: 22000 },
                    { label: '₹35k Heritage', value: 35000 },
                    { label: '₹55k Signature', value: 55000 },
                  ].map((pill) => (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => setBudgetPerPerson(pill.value)}
                      className={`p-2 rounded-xl text-xs font-meta font-bold border transition cursor-pointer ${
                        budgetPerPerson === pill.value
                          ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                          : 'bg-[#FAF8F5] text-ink hover:bg-white border-[#DDD7CC]'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: TRIP DURATION */}
            {quizStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#C85A32]">
                    Step 3 of 5
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-ink">
                    Preferred Trip Duration
                  </h3>
                  <p className="text-xs text-dusk-600 font-sans leading-relaxed">
                    How many days can you realistically get away from work or studies?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { days: 3, title: '3 Days', sub: 'Weekend Sprint (Fri night to Sun)' },
                    { days: 4, title: '4 Days', sub: 'Extended Escape (1 day leave taken)' },
                    { days: 5, title: '5 Days', sub: 'Regional Cultural Circuit' },
                    { days: 7, title: '7 Days', sub: 'Deep Pan-India Immersion' },
                  ].map((d) => (
                    <button
                      key={d.days}
                      type="button"
                      onClick={() => setTripDays(d.days)}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                        tripDays === d.days
                          ? 'bg-[#FAF4ED] border-[#C85A32] ring-2 ring-[#C85A32]/30 shadow-xs'
                          : 'bg-[#FAF8F5] border-[#DDD7CC] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-lg text-ink">{d.title}</span>
                        {tripDays === d.days && (
                          <CheckCircle2 className="w-4 h-4 text-[#C85A32]" />
                        )}
                      </div>
                      <span className="text-xs text-dusk-600 font-sans">{d.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: CULTURAL INTERESTS */}
            {quizStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#C85A32]">
                      Step 4 of 5
                    </span>
                    <span className="text-[11px] font-mono font-bold text-dusk-600">
                      {selectedInterests.length}/4 Selected
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-ink">
                    What Excites You Most?
                  </h3>
                  <p className="text-xs text-dusk-600 font-sans leading-relaxed">
                    Pick 2 to 4 likes to balance with other crew members.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-h-[300px] overflow-y-auto pr-1">
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.id)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#FAF4ED] border-[#C85A32] shadow-xs'
                            : 'bg-[#FAF8F5] border-[#DDD7CC] hover:bg-white'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isSelected
                              ? 'bg-[#C85A32] border-[#C85A32] text-white'
                              : 'border-[#DDD7CC] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-heading font-extrabold text-ink">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-dusk-600 font-sans line-clamp-1">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: GEOGRAPHY & TRAVEL PACE */}
            {quizStep === 5 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#C85A32]">
                    Step 5 of 5
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-ink">
                    Terrain &amp; Daily Pace
                  </h3>
                  <p className="text-xs text-dusk-600 font-sans leading-relaxed">
                    Lock your preferred setting and rhythm for the journey.
                  </p>
                </div>

                {/* Geography Picker */}
                <div className="space-y-2">
                  <span className="text-xs font-heading font-bold text-ink uppercase tracking-wider">
                    Preferred Geography
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {TERRAIN_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTerrain(t.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          terrain === t.id
                            ? 'bg-[#FAF4ED] border-[#C85A32] font-bold text-[#C85A32]'
                            : 'bg-[#FAF8F5] border-[#DDD7CC] text-ink hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-heading font-bold">{t.label}</div>
                        <div className="text-[10px] text-dusk-500 font-sans line-clamp-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pace Picker */}
                <div className="space-y-2">
                  <span className="text-xs font-heading font-bold text-ink uppercase tracking-wider">
                    Daily Travel Pace
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PACE_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPace(p.id)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          pace === p.id
                            ? 'bg-[#FAF4ED] border-[#C85A32] font-bold text-[#C85A32]'
                            : 'bg-[#FAF8F5] border-[#DDD7CC] text-ink hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-heading font-bold">{p.label}</div>
                        <div className="text-[9px] text-dusk-500 font-sans">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobility / Walking Preference Toggle */}
                <label className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CC] flex items-center justify-between cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-heading font-bold text-ink">
                      Low Walking / Easy Mobility Route
                    </span>
                    <p className="text-[10px] text-dusk-500 font-sans">
                      Prioritizes auto/cab transit and wheelchair/elder-friendly stops
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={lowWalking}
                    onChange={(e) => setLowWalking(e.target.checked)}
                    className="w-4 h-4 accent-[#C85A32] rounded cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E8DEC8]">
              {quizStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setQuizStep(quizStep - 1)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#DDD7CC] hover:bg-[#FAF8F5] text-xs font-heading font-bold text-ink transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {quizStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setQuizStep(quizStep + 1)}
                  disabled={quizStep === 1 && !displayName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B84E28] disabled:opacity-50 text-xs font-heading font-bold text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C85A32] to-[#D99B43] hover:from-[#B84E28] hover:to-[#C88A33] text-xs font-heading font-extrabold text-white shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Submit &amp; Reveal Group Matches</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW D: 60/40 GROUP COLLABORATIVE WORKSPACE
  // ═══════════════════════════════════════════════════════════════════════════
  const currentUserName = displayName || currentMember?.name || user?.full_name || 'Traveler';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#12213B] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 60/40 Responsive Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 60% Collaborative Workspace Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Live Crew Readiness & Synergy Radar */}
            <CrewSynergyRadar
              session={activeSession}
              currentUserId={currentUserId}
              onEditQuiz={() => setIsEditingQuiz(true)}
              inviteUrl={inviteUrl}
            />

            {/* Dynamic Group Recommendations Board with Attribution & Sweet-Spot Equalizer */}
            <GroupRecommendationBoard
              session={activeSession}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>

          {/* Right 40% Real-Time Chat & AI Mediator Dock (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <GroupRealTimeChat
              session={activeSession}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserAvatar={user?.avatar}
              inviteUrl={inviteUrl}
            />

            {/* Quick Share to WhatsApp Bar */}
            <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E5DFD5] flex items-center justify-between gap-2 text-sm shadow-xs">
              <span className="font-heading font-bold text-[#12213B] truncate">
                Invite friends to calibrate
              </span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Namaste! Join our trip squad "${activeSession.groupName}" on LOKIVA to calibrate our travel budget and preferences: ${inviteUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#C1443B] hover:bg-[#A83830] text-white font-heading font-bold text-xs sm:text-sm shrink-0 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>WhatsApp Invite</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupTripHubPage;
