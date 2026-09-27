import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Sparkles,
  Flame,
  XCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { GroupTripSession } from '../../types/groupTrip';
import { useGroupTripStore } from '../../store/useGroupTripStore';

interface GroupRealTimeChatProps {
  session: GroupTripSession;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  inviteUrl: string;
}

export const GroupRealTimeChat: React.FC<GroupRealTimeChatProps> = ({
  session,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}) => {
  const { sendChatMessage, toggleCardReaction, triggerAiMediator } = useGroupTripStore();
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sendChatMessage(
      session.groupId,
      {
        id: currentUserId,
        name: currentUserName,
        avatar: currentUserAvatar,
      },
      chatInput.trim()
    );
    setChatInput('');
  };

  const handleQuickPrompt = (promptText: string) => {
    sendChatMessage(
      session.groupId,
      {
        id: currentUserId,
        name: currentUserName,
        avatar: currentUserAvatar,
      },
      promptText
    );
  };

  const handleMediatorClick = () => {
    triggerAiMediator(session.groupId, 'resolve our tie and suggest harmonious compromise');
  };

  const handleReaction = (
    messageId: string,
    reactionType: 'mustGo' | 'maybe' | 'veto'
  ) => {
    toggleCardReaction(session.groupId, messageId, currentUserName, reactionType);
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] sticky top-20 rounded-3xl bg-gradient-to-b from-[#FFFFFF] via-[#FAF7F2] to-[#F5EFE6] border border-[#E5DFD5] shadow-xl flex flex-col justify-between overflow-hidden select-none">
      {/* ── 1. WARM TRAVERTINE LOUNGE HEADER ── */}
      <div className="px-5 py-4 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5DFD5] flex items-center justify-between shrink-0">
        <div className="space-y-0.5 min-w-0">
          <h2 className="font-heading text-base sm:text-lg font-extrabold text-[#12213B] truncate">
            Crew Comms &amp; AI Mediator
          </h2>
          <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#7A6B5D]">
            <span className="w-2 h-2 rounded-full bg-[#D47A39] animate-pulse" />
            <span>Live Room Sync · {session.members.length} Members Active</span>
          </div>
        </div>

        {/* Ask @Lokiva Mediator Action */}
        <button
          onClick={handleMediatorClick}
          type="button"
          className="bg-gradient-to-r from-[#C1443B] to-[#D47A39] hover:from-[#A83830] hover:to-[#C1443B] text-white font-heading font-bold text-xs px-3.5 py-2 rounded-full shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          title="Ask Lokiva AI Mediator to resolve ties or differences"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask @Lokiva</span>
        </button>
      </div>

      {/* ── 2. SCROLLABLE MESSAGE STREAM ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Welcome / Guidance State if few messages */}
        {session.messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5DFD5] text-center space-y-1.5 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FAF0E6] text-[#C1443B] flex items-center justify-center mx-auto">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-heading font-bold text-xs text-[#12213B]">
              Squad Real-Time Chat &amp; Consensus Room
            </div>
            <p className="font-sans text-xs text-[#7A6B5D] leading-relaxed max-w-xs mx-auto">
              Drop candidate destinations to vote, align departure dates, or mention <strong className="text-[#C1443B]">@lokiva</strong> to mediate ties.
            </p>
          </motion.div>
        )}

        {/* Messages List */}
        <AnimatePresence initial={false}>
          {session.messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;

            // Case A: LOKIVA AI GROUP MEDIATOR DISPATCH NOTE
            if (msg.isAiMediator) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                  className="bg-[#FFFFFF] border-l-4 border-l-[#C1443B] border border-[#E5DFD5] rounded-2xl p-4 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-extrabold uppercase tracking-wider text-[#C1443B] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D47A39]" />
                      <span>Lokiva AI Mediator</span>
                    </span>
                    <span className="font-mono text-xs text-[#7A6B5D]">{msg.timestamp}</span>
                  </div>

                  <p className="font-sans text-sm sm:text-[15px] leading-relaxed text-[#12213B] whitespace-pre-line">
                    {msg.text}
                  </p>
                </motion.div>
              );
            }

            // Case B: STANDARD USER CHAT BUBBLE
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Name & Timestamp */}
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#7A6B5D] mb-1 px-1">
                  <span>{msg.senderName}</span>
                  {isMe && <span className="text-[#C1443B] font-bold">(You)</span>}
                  <span className="text-[#D6CEC2]">·</span>
                  <span className="font-mono text-[11px]">{msg.timestamp}</span>
                </div>

                {/* Bubble Body */}
                <div
                  className={`max-w-[88%] p-3.5 sm:p-4 rounded-2xl text-sm sm:text-[15px] leading-relaxed space-y-2.5 shadow-2xs ${
                    isMe
                      ? 'bg-[#C1443B] text-white rounded-tr-xs'
                      : 'bg-[#FFFFFF] border border-[#E5DFD5] text-[#12213B] rounded-tl-xs'
                  }`}
                >
                  <p className="font-sans">{msg.text}</p>

                  {/* Embedded Destination Card if dropped */}
                  {msg.droppedCard && (
                    <div
                      className={`rounded-2xl p-3.5 space-y-2.5 border transition ${
                        isMe
                          ? 'bg-[#FFFFFF] text-[#12213B] border-[#E5DFD5] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#12213B] border-[#E5DFD5] shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-extrabold text-sm text-[#12213B] truncate">
                          📍 {msg.droppedCard.city}, {msg.droppedCard.state}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#C1443B] text-xs font-mono font-bold border border-[#E8DEC8]">
                          ✨ {msg.droppedCard.matchScore}% Match
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-sans text-[#7A5C49]">
                        <span>Target Split:</span>
                        <span className="font-heading font-bold text-[#12213B]">
                          ₹{msg.droppedCard.estimatedCostPerPerson.toLocaleString('en-IN')} / person
                        </span>
                      </div>

                      {/* Reaction Pills */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#E8DEC8] flex-wrap">
                        <button
                          onClick={() => handleReaction(msg.id, 'mustGo')}
                          type="button"
                          className={`px-3 py-1 rounded-xl text-xs font-heading font-bold transition cursor-pointer flex items-center gap-1 border ${
                            msg.reactions?.mustGo?.includes(currentUserName)
                              ? 'bg-[#C1443B] text-white border-[#C1443B]'
                              : 'bg-[#FFFFFF] text-[#12213B] border-[#E5DFD5] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5 text-[#D47A39]" />
                          <span>Must Go</span>
                          <span className="font-mono text-xs">({msg.reactions?.mustGo?.length || 0})</span>
                        </button>

                        <button
                          onClick={() => handleReaction(msg.id, 'maybe')}
                          type="button"
                          className={`px-3 py-1 rounded-xl text-xs font-heading font-bold transition cursor-pointer flex items-center gap-1 border ${
                            msg.reactions?.maybe?.includes(currentUserName)
                              ? 'bg-[#FAF0E6] text-[#8C4A1D] border-[#D47A39]'
                              : 'bg-[#FFFFFF] text-[#7A6B5D] border-[#E5DFD5] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#D47A39]" />
                          <span>Maybe</span>
                          <span className="font-mono text-xs">({msg.reactions?.maybe?.length || 0})</span>
                        </button>

                        <button
                          onClick={() => handleReaction(msg.id, 'veto')}
                          type="button"
                          className={`px-3 py-1 rounded-xl text-xs font-heading font-bold transition cursor-pointer flex items-center gap-1 border ${
                            msg.reactions?.veto?.includes(currentUserName)
                              ? 'bg-[#FCE8E6] text-[#C1443B] border-[#C1443B]'
                              : 'bg-[#FFFFFF] text-[#7A6B5D] border-[#E5DFD5] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Pass</span>
                          <span className="font-mono text-xs">({msg.reactions?.veto?.length || 0})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. PROMINENT COMPOSER DOCK (BOTTOM OF RIGHT PANEL) ── */}
      <div className="p-3.5 sm:p-4 bg-[#FFFFFF] border-t border-[#E5DFD5] space-y-2.5 shrink-0">
        {/* Quick AI Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: '✦ @lokiva resolve tie', prompt: '@lokiva resolve our tie and pick our compromise destination' },
            { label: '💰 Check budget fit', prompt: '@lokiva check our group budget sweet-spot fit' },
            { label: '📍 Recommend stops', prompt: '@lokiva recommend the top stops that match all crew members' },
            { label: '🤝 Group consensus', prompt: 'Everyone check the top destination choices and cast your votes!' },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleQuickPrompt(chip.prompt)}
              type="button"
              className="text-xs font-heading font-bold px-3 py-1.5 rounded-full bg-[#FAF0E6] hover:bg-[#F5E6D6] text-[#5C4A3E] transition-colors whitespace-nowrap cursor-pointer shrink-0 border border-[#E8DEC8]"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Large Input + Send Button */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Message your crew or type @lokiva to mediate..."
            className="w-full bg-[#FAF7F2] border border-[#E5DFD5] focus:border-[#C1443B] rounded-2xl px-4 py-2.5 text-sm sm:text-base text-[#12213B] placeholder:text-[#9C8C7E] outline-none transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="bg-[#C1443B] hover:bg-[#A83830] disabled:opacity-40 text-white px-4 sm:px-5 py-2.5 rounded-2xl font-heading font-bold text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupRealTimeChat;
