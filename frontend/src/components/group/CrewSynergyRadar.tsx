import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Users,
  Copy,
  Check,
  UserPlus,
  Sparkles,
  Settings2,
  Clock,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { GroupTripSession } from '../../types/groupTrip';
import { computeCrewSynergyMetrics } from '../../lib/groupRecommendationEngine';
import { useGroupTripStore } from '../../store/useGroupTripStore';

interface CrewSynergyRadarProps {
  session: GroupTripSession;
  currentUserId: string;
  onEditQuiz: () => void;
  inviteUrl: string;
}

export const CrewSynergyRadar: React.FC<CrewSynergyRadarProps> = ({
  session,
  currentUserId,
  onEditQuiz,
  inviteUrl,
}) => {
  const { addDemoMember } = useGroupTripStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animatedBudget, setAnimatedBudget] = useState(0);

  const metrics = computeCrewSynergyMetrics(session.members, session.expectedMemberCount);
  const remainingSlots = Math.max(0, session.expectedMemberCount - session.members.length);

  // GSAP Counter & Staggered Reveal Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Budget Counter
      const budgetObj = { val: 0 };
      gsap.to(budgetObj, {
        val: metrics.groupSweetSpotBudget,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          setAnimatedBudget(Math.round(budgetObj.val));
        },
      });

      // 2. Staggered 3D entrance of Crew Slots
      gsap.fromTo(
        '.gsap-crew-slot',
        { opacity: 0, y: 20, rotateX: -10 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [metrics.groupSweetSpotBudget, session.members.length]);

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSimulateFriend = () => {
    addDemoMember(session.groupId);
  };

  // Format top shared interests text for magazine prose
  const topPassionsText =
    metrics.topSharedInterests.length > 0
      ? metrics.topSharedInterests.slice(0, 2).join(' & ')
      : 'Artisan Crafts & Street Gastronomy';

  return (
    <div ref={containerRef} className="space-y-6 select-none">
      {/* ── 1. HERO EXPEDITION TITLE ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-1"
      >
        <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#C1443B] block">
          Group Expedition Hub
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#12213B] tracking-tight leading-[1.1]">
          {session.groupName}
        </h1>
      </motion.div>

      {/* ── 2. ARCHITECTURAL EDITORIAL SYNTHESIS BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="border-y border-[#E5DFD5] py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center"
      >
        {/* Left 7 Cols: Flowing Magazine Prose */}
        <div className="md:col-span-7 space-y-2">
          <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#C1443B] block">
            Collective Harmony Synthesis
          </span>
          <p className="font-sans text-base sm:text-lg leading-relaxed text-[#5C4A3E]">
            Calibrated for a{' '}
            <strong className="font-heading font-extrabold text-[#12213B] underline decoration-[#D47A39] decoration-2 underline-offset-4">
              {metrics.medianDays}-Day
            </strong>{' '}
            journey centered on{' '}
            <strong className="font-heading font-extrabold text-[#12213B] underline decoration-[#D47A39] decoration-2 underline-offset-4">
              {topPassionsText}
            </strong>
            , weighted gently so every traveler stays comfortable.
          </p>
        </div>

        {/* Right 5 Cols: GSAP Animated Budget Sweet-Spot Dial */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#FFFFFF] to-[#FAF6F0] border border-[#E5DFD5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-1.5">
          <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#C1443B] block">
            Group Comfort Ceiling
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-black text-[#12213B]">
              ₹{animatedBudget.toLocaleString('en-IN')}
            </span>
            <span className="font-sans text-xs text-[#7A5C49] font-semibold">/ traveler</span>
          </div>
          <p className="text-xs font-mono font-medium text-[#D47A39]">
            {metrics.groupSynergyScore}% Crew Synergy · Protected lowest budget ceiling
          </p>
        </div>
      </motion.div>

      {/* ── 3. TACTILE CREW BOARDING PASS STRIP ── */}
      <div className="space-y-3">
        {/* Readiness Header with Warm Liquid Progress Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D47A39] animate-pulse" />
            <h3 className="font-heading text-sm sm:text-base font-bold text-[#12213B]">
              Crew Readiness : {metrics.readyCount} of {metrics.totalExpected} Profiles Synced
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-[#C1443B]">
            {metrics.readinessPercentage}% Calibrated
          </span>
        </div>

        {/* Liquid Warm Terracotta-to-Saffron Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#EFE6D8] overflow-hidden p-0.5 border border-[#E5DFD5]/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.readinessPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#C1443B] to-[#D47A39]"
          />
        </div>

        {/* Crew Boarding Pass Tickets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-1">
          {session.members.map((member) => {
            const isReady = member.status === 'ready' && member.quizAnswers;
            const isCurrent = member.id === currentUserId;

            return (
              <motion.div
                key={member.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="gsap-crew-slot bg-[#FFFFFF] border border-[#E5DFD5] hover:border-[#C1443B]/60 rounded-2xl p-4 shadow-xs relative overflow-hidden transition-colors"
              >
                {/* Decorative Top Accent Tag */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#D47A39]/15 to-transparent rounded-bl-2xl pointer-events-none" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5] text-[#C1443B] flex items-center justify-center font-display font-black text-sm shrink-0">
                      {member.name ? member.name[0].toUpperCase() : 'T'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-heading font-extrabold text-sm text-[#12213B] truncate flex items-center gap-1">
                        <span>{member.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-[#C1443B] font-bold">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-[#D47A39] animate-pulse'}`} />
                        <span className="text-[11px] font-heading font-semibold text-[#66584E]">
                          {isReady ? 'Profile Synced' : 'Calibrating...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Bottom Hairline Metadata & Edit Link */}
                  <div className="pt-2 border-t border-[#FAF0E6] flex items-center justify-between text-xs font-sans text-[#7A5C49]">
                    {isReady && member.quizAnswers ? (
                      <>
                        <span className="font-mono">{member.quizAnswers.tripDays} Days</span>
                        <span className="font-heading font-medium text-[#12213B] capitalize">{member.quizAnswers.pace}</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-[#A69588] italic">Awaiting answers</span>
                    )}
                    {isCurrent && (
                      <button
                        type="button"
                        onClick={onEditQuiz}
                        className="text-[11px] font-heading font-bold text-[#C1443B] hover:text-[#9E3C1D] underline underline-offset-2 ml-auto cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Waiting Slot Tickets */}
          {Array.from({ length: remainingSlots }).map((_, idx) => (
            <button
              key={`slot-${idx}`}
              onClick={handleCopyLink}
              type="button"
              className="gsap-crew-slot bg-[#FAF7F2]/80 hover:bg-[#FFFFFF] border border-dashed border-[#D6CEC2] hover:border-[#C1443B] rounded-2xl p-4 transition-all text-left cursor-pointer group space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl border border-dashed border-[#D6CEC2] group-hover:border-[#C1443B] group-hover:bg-[#FAF0E6] text-[#8C7A6D] group-hover:text-[#C1443B] flex items-center justify-center font-heading font-bold text-sm transition-colors">
                  +
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-heading font-bold text-xs text-[#5C4A3E] group-hover:text-[#12213B]">
                    Seat {String(session.members.length + idx + 1).padStart(2, '0')} · Open
                  </div>
                  <div className="text-[11px] text-[#C1443B] font-heading font-semibold flex items-center gap-1 pt-0.5">
                    <span>{copiedLink ? 'Link copied!' : 'Invite friend'}</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrewSynergyRadar;
