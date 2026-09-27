import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Flame,
  XCircle,
  MessageSquare,
  Lock,
  Compass,
  ArrowRight,
  MapPin,
  Crown,
  Zap,
  Check,
} from 'lucide-react';
import {
  GroupTripSession,
  GroupRecommendationCard,
} from '../../types/groupTrip';
import {
  synthesizeGroupRecommendations,
  computeCrewSynergyMetrics,
} from '../../lib/groupRecommendationEngine';
import { useGroupTripStore } from '../../store/useGroupTripStore';
import { resolveImageUrl } from '../../lib/api';

interface GroupRecommendationBoardProps {
  session: GroupTripSession;
  currentUserId: string;
  currentUserName: string;
  onDropToChat?: (card: GroupRecommendationCard) => void;
}

export const GroupRecommendationBoard: React.FC<GroupRecommendationBoardProps> = ({
  session,
  currentUserId,
  currentUserName,
  onDropToChat,
}) => {
  const navigate = useNavigate();
  const {
    upvoteCard,
    vetoCard,
    lockDestination,
    dropCardToChat,
    sendChatMessage,
  } = useGroupTripStore();

  const [activeTab, setActiveTab] = useState<string>('consensus');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synthesize candidate hubs across all ready members
  const cards: GroupRecommendationCard[] = useMemo(() => {
    return synthesizeGroupRecommendations(
      session.members,
      session.expectedMemberCount,
      session.cardVotes
    );
  }, [session.members, session.expectedMemberCount, session.cardVotes]);

  const readyMembers = session.members.filter((m) => m.status === 'ready');
  const isHost = session.hostId === currentUserId;

  // Filtered cards based on active tab
  const filteredCards = useMemo(() => {
    if (activeTab === 'consensus') {
      return cards;
    }
    if (activeTab === 'for_me') {
      return cards.filter(
        (c) =>
          c.recommendedForMemberIds.includes(currentUserId) ||
          c.recommendedForMemberNames.includes(currentUserName)
      );
    }
    if (activeTab.startsWith('member:')) {
      const targetMemberId = activeTab.replace('member:', '');
      const targetMember = session.members.find((m) => m.id === targetMemberId);
      const targetName = targetMember?.name || '';
      return cards.filter(
        (c) =>
          c.recommendedForMemberIds.includes(targetMemberId) ||
          c.recommendedForMemberNames.includes(targetName)
      );
    }
    return cards;
  }, [cards, activeTab, currentUserId, currentUserName, session.members]);

  const handleUpvote = (city: string) => {
    upvoteCard(session.groupId, city, currentUserId);
  };

  const handleVeto = (city: string) => {
    vetoCard(session.groupId, city, currentUserId);
  };

  const handleDropCard = (card: GroupRecommendationCard) => {
    if (onDropToChat) {
      onDropToChat(card);
    } else {
      dropCardToChat(
        session.groupId,
        { id: currentUserId, name: currentUserName },
        card
      );
    }
    showToast(`Dropped ${card.city} into squad chat!`);
  };

  const handleLockAndBuild = (city: string) => {
    lockDestination(session.groupId, city);

    sendChatMessage(
      session.groupId,
      { id: 'lokiva-ai', name: 'Lokiva AI Mediator' },
      `🎯 ${session.hostName} officially locked ${city} as our group destination! Generating collaborative 60/40 itinerary...`
    );

    const metrics = computeCrewSynergyMetrics(session.members, session.expectedMemberCount);
    const travelers = Math.max(session.members.length, 1);
    const perPersonBudget = metrics.groupSweetSpotBudget;
    const totalBudget = perPersonBudget * travelers;
    const days = metrics.medianDays;
    const allInterests = Array.from(
      new Set(readyMembers.flatMap((m) => m.quizAnswers?.interests || []))
    );

    navigate(
      `/itinerary?city=${encodeURIComponent(city)}&groupId=${session.groupId}&travelers=${travelers}&budget=${totalBudget}&perPersonBudget=${perPersonBudget}&days=${days}&interests=${encodeURIComponent(allInterests.join(','))}&groupMode=true`
    );
  };

  const handleNudgeHost = (city: string) => {
    sendChatMessage(
      session.groupId,
      { id: currentUserId, name: currentUserName },
      `👋 ${currentUserName} voted to lock ${city} as the final group destination!`
    );
    showToast(`Nudge sent to ${session.hostName} in chat!`);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 right-6 z-50 px-5 py-3 rounded-2xl bg-[#FFFDF9] border-2 border-[#B84A27] text-[#3B2316] shadow-xl text-sm font-heading font-extrabold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#B84A27]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. EDITORIAL FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DFD5]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('consensus')}
            type="button"
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'consensus'
                ? 'bg-[#C1443B] text-white shadow-xs'
                : 'bg-[#FFFFFF] text-[#7A6B5D] hover:text-[#12213B] border border-[#E5DFD5]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D47A39]" />
            <span>Top Consensus ({cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('for_me')}
            type="button"
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'for_me'
                ? 'bg-[#C1443B] text-white shadow-xs'
                : 'bg-[#FFFFFF] text-[#7A6B5D] hover:text-[#12213B] border border-[#E5DFD5]'
            }`}
          >
            <span>My Personal Matches</span>
          </button>
        </div>

        <span className="text-xs sm:text-sm font-sans text-[#7A6B5D]">
          Showing <strong className="text-[#12213B] font-bold">{filteredCards.length}</strong> vetted cultural circuits
        </span>
      </div>

      {/* ── 2. ASYMMETRIC MAGAZINE SPLIT CARDS ── */}
      <div className="space-y-6">
        {filteredCards.map((card, index) => {
          const isUpvotedByMe = card.upvotedByMemberIds.includes(currentUserId);
          const isLocked = session.lockedDestinationCity === card.city;
          const isTopConsensus = index === 0 && activeTab === 'consensus';

          return (
            <motion.div
              key={card.city}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`rounded-3xl bg-[#FFFFFF] border shadow-xs hover:shadow-md transition-all overflow-hidden ${
                isLocked
                  ? 'border-2 border-[#C1443B] ring-4 ring-[#C1443B]/10'
                  : isTopConsensus
                  ? 'border-2 border-[#D47A39]'
                  : 'border-[#E5DFD5]'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[290px]">
                {/* ── LEFT 5 COLUMNS: FULL-HEIGHT VISUAL BLEED ── */}
                <div className="md:col-span-5 relative h-60 md:h-auto overflow-hidden bg-[#FAF7F2]">
                  <img
                    src={resolveImageUrl(card.heroImage)}
                    alt={card.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Top Glass Badge */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-md text-[#12213B] text-[11px] font-heading font-extrabold uppercase tracking-widest shadow-xs">
                      {isTopConsensus ? (
                        <>
                          <Crown className="w-3.5 h-3.5 text-[#D47A39]" />
                          <span>#01 CONSENSUS MATCH</span>
                        </>
                      ) : (
                        <>
                          <Compass className="w-3.5 h-3.5 text-[#D47A39]" />
                          <span>CULTURAL HUB</span>
                        </>
                      )}
                    </span>

                    <span className="px-2.5 py-1 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md text-[#12213B] text-xs font-mono font-black shadow-xs">
                      {card.matchScore}% Match
                    </span>
                  </div>

                  {/* Bottom Financial Fit Ribbon Over Image */}
                  <div className="absolute bottom-3.5 inset-x-3.5">
                    <div className="px-3 py-2 rounded-2xl bg-[#FFFFFF]/90 backdrop-blur-md border border-white/40 text-[#12213B] text-xs font-sans flex items-center justify-between shadow-xs">
                      <span className="font-heading font-bold text-[#C1443B]">
                        {card.financialFitLabel}
                      </span>
                      <span className="font-mono font-bold text-[#12213B]">
                        ~₹{card.estimatedCostPerPerson.toLocaleString('en-IN')}/pax
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT 7 COLUMNS: GENEROUS EDITORIAL TYPOGRAPHY & ATTRIBUTION ── */}
                <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* City & State Title */}
                    <div>
                      <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#C1443B] block">
                        {card.state}
                      </span>
                      <h2 className="font-display text-2xl sm:text-3xl font-black text-[#12213B] tracking-tight mt-0.5">
                        {card.city}
                      </h2>
                    </div>

                    {/* Narrative Description */}
                    <p className="font-sans text-sm sm:text-base text-[#5C4A3E] leading-relaxed">
                      {card.tagline}
                    </p>

                    {/* Member Attribution Line */}
                    <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E5DFD5] space-y-1 mt-2">
                      <div className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#C1443B]">
                        Crew Alignment
                      </div>
                      <div className="text-xs sm:text-sm font-sans font-bold text-[#12213B]">
                        Matched for {card.recommendedForMemberNames.length} of{' '}
                        {Math.max(1, readyMembers.length)} Ready Travelers :{' '}
                        <span className="text-[#C1443B]">
                          {card.recommendedForMemberNames.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-3 border-t border-[#E5DFD5] flex items-center justify-between gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Upvote Button */}
                      <button
                        onClick={() => handleUpvote(card.city)}
                        type="button"
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                          isUpvotedByMe
                            ? 'bg-[#C1443B] text-white border-[#C1443B]'
                            : 'bg-[#FFFFFF] text-[#12213B] border-[#E5DFD5] hover:border-[#C1443B]'
                        }`}
                      >
                        <Flame className={`w-4 h-4 ${isUpvotedByMe ? 'text-white' : 'text-[#C1443B]'}`} />
                        <span>Upvote</span>
                        <span className="font-mono text-xs">({card.upvotedByMemberIds.length})</span>
                      </button>

                      {/* Drop to Chat */}
                      <button
                        onClick={() => handleDropCard(card)}
                        type="button"
                        className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#E5DFD5] hover:border-[#C1443B] text-xs sm:text-sm font-heading font-bold text-[#12213B] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageSquare className="w-4 h-4 text-[#C1443B]" />
                        <span>Drop to Chat</span>
                      </button>
                    </div>

                    {/* Primary Lock CTA */}
                    {isHost ? (
                      <button
                        onClick={() => handleLockAndBuild(card.city)}
                        type="button"
                        className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#C1443B] to-[#D47A39] hover:from-[#A83830] hover:to-[#C1443B] text-white font-heading font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock Winner &amp; Build Itinerary →</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleNudgeHost(card.city)}
                        type="button"
                        className="px-3.5 py-2 rounded-xl bg-[#FAF0E6] hover:bg-[#F5E6D6] border border-[#E8DEC8] text-xs sm:text-sm font-heading font-extrabold text-[#C1443B] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#D47A39]" />
                        <span>Nudge Host to Lock</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupRecommendationBoard;
