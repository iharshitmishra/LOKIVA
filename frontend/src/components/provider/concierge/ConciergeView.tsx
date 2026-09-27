import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Tag,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  User,
  Bot,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ConciergeMessage, ActionCard } from '../../../types/providerWorkspace';

export function ConciergeView() {
  const {
    conciergeMessages,
    isConciergeTyping,
    sendConciergeMessage,
    executeConciergeAction,
    profile,
  } = useProviderWorkspaceStore();

  const [input, setInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conciergeMessages, isConciergeTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isConciergeTyping) return;
    const msg = input.trim();
    setInput('');
    await sendConciergeMessage(msg);
  };

  const handlePromptChipClick = async (chipPrompt: string) => {
    if (isConciergeTyping) return;
    await sendConciergeMessage(chipPrompt);
  };

  const SUGGESTED_PROMPTS = [
    'How can I grow my bookings this month?',
    'Create a 20% weekend flash offer for my walk',
    'Draft professional replies to my recent reviews',
    'How much did I earn this month after commission?',
    'Suggest improvements for my experience listing',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-h-[850px] bg-white rounded-3xl border border-[#E5DFD5] shadow-2xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="px-6 py-4.5 border-b border-[#E5DFD5] bg-[#FAF7F2] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF4ED] border border-[#E8DEC8] text-[#C85A32] flex items-center justify-center shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#C85A32]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-display font-extrabold text-[#12213B] tracking-tight">
                LOKIVA AI Business Concierge
              </h3>
              <span className="text-[10px] font-mono uppercase font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full shadow-2xs">
                Live Data Connected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#556275] font-sans">
              Approval-First Intelligence · Grounded in {profile?.business_name || 'Your Business'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#556275] font-mono bg-white px-3.5 py-1.5 rounded-xl border border-[#E5DFD5] shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#065F46]" />
          <span>Approval-First Safety Gate Active</span>
        </div>
      </div>

      {/* 2. Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar bg-[#FAF7F2]/40">
        {conciergeMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl sm:max-w-3xl rounded-2xl p-4 sm:p-5.5 space-y-3.5 shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-[#C85A32] text-white rounded-tr-xs'
                  : 'bg-white border border-[#E5DFD5] text-[#12213B] rounded-tl-xs'
              }`}
            >
              {/* Message Header */}
              <div
                className={`flex items-center justify-between text-xs font-mono pb-1 border-b ${
                  msg.role === 'user'
                    ? 'border-white/20 text-white/90'
                    : 'border-[#E5DFD5]/60 text-[#556275]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {msg.role === 'user' ? (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>You (Host)</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-[#C85A32]" />
                      <span className="text-[#12213B]">LOKIVA Concierge</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] opacity-80">{msg.timestamp}</span>
              </div>

              {/* Message Body Content */}
              <div
                className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans ${
                  msg.role === 'user' ? 'text-white font-medium' : 'text-[#12213B]'
                }`}
              >
                {msg.content}
              </div>

              {/* Action Approval Card (If Proposing Business Action) */}
              {msg.actionCard && (
                <div className="mt-4 p-4.5 rounded-2xl bg-[#FAF7F2] border-2 border-[#C85A32]/35 shadow-xs space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-[#C85A32] text-white shadow-2xs">
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-heading font-extrabold text-[#12213B]">
                        {msg.actionCard.title}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono uppercase font-bold text-[#C85A32] bg-white px-2.5 py-1 rounded-lg border border-[#E8DEC8] shadow-2xs">
                      Requires Approval
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#556275] leading-relaxed">
                    {msg.actionCard.description}
                  </p>

                  {/* Clean Summary Details Grid */}
                  {msg.actionCard.summaryDetails && (
                    <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm font-mono bg-white p-3 rounded-xl border border-[#E5DFD5] shadow-2xs">
                      {Object.entries(msg.actionCard.summaryDetails).map(([k, v]) => (
                        <div key={k} className="space-y-0.5">
                          <span className="text-[11px] text-[#556275] block font-medium">{k}:</span>
                          <span className="font-bold text-[#12213B] truncate block">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Execution Button */}
                  <div className="pt-1 flex items-center justify-between">
                    {msg.actionExecuted ? (
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-heading font-bold text-[#065F46] bg-[#ECFDF5] px-4 py-2 rounded-xl border border-[#A7F3D0]">
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                        <span>Approved & Launched Live</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => executeConciergeAction(msg.actionCard!, msg.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs sm:text-sm font-heading font-bold transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Approve & Launch Campaign</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isConciergeTyping && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 bg-white border border-[#E5DFD5] rounded-2xl w-56 shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-[#C85A32] animate-spin" />
            <span className="text-xs sm:text-sm text-[#556275] font-medium">
              Analyzing provider data...
            </span>
          </motion.div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 3. Suggested Prompt Chips */}
      <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-[#E5DFD5] overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-mono text-[#556275] uppercase font-bold pr-1">
            Suggested:
          </span>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptChipClick(p)}
              className="text-xs sm:text-sm font-heading text-[#12213B] bg-[#FAF7F2] hover:bg-[#FAF4ED] border border-[#E5DFD5] hover:border-[#C85A32] px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat Input Bar */}
      <form onSubmit={handleSend} className="p-4 sm:p-5 bg-[#FAF7F2] border-t border-[#E5DFD5] flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask LOKIVA AI about bookings, earnings, slot suggestions, or campaign creation..."
          className="flex-1 px-4 sm:px-5 py-3 rounded-xl border border-[#E5DFD5] text-sm sm:text-base font-heading bg-white text-[#12213B] placeholder:text-[#556275]/70 focus:border-[#C85A32] focus:outline-hidden shadow-2xs"
          disabled={isConciergeTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isConciergeTyping}
          className="p-3.5 bg-[#C85A32] hover:bg-[#B34D28] disabled:opacity-40 text-white rounded-xl transition shadow-xs cursor-pointer active:scale-95 shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
}
