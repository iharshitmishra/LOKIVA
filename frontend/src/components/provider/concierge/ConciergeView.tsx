import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Zap,
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
    'Why are my bookings lower this week?',
    'Create a 20% weekend flash offer for my walk',
    'Draft professional replies to my recent reviews',
    'How much did I earn this month after commission?',
    'Suggest improvements for my experience listing',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[850px] bg-white rounded-3xl border border-[#E5DFD5] shadow-2xs overflow-hidden">
      {/* Concierge Header */}
      <div className="px-6 py-4 border-b border-[#E5DFD5] bg-[#FAF7F2] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-[#12213B] to-[#C85A32] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-[#12213B]">
                LOKIVA AI Business Concierge
              </h3>
              <span className="text-[10px] font-mono uppercase font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                Live Data Connected
              </span>
            </div>
            <p className="text-xs text-[#556275]">
              Approval-First Intelligence · Grounded in {profile?.business_name || 'Your Business'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#556275] font-mono">
          <ShieldCheck className="w-4 h-4 text-[#065F46]" />
          <span>Approval-First Safety Gate Active</span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#FAF7F2]/30">
        {conciergeMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 space-y-3 ${
                msg.role === 'user'
                  ? 'bg-[#12213B] text-white shadow-xs rounded-tr-none'
                  : 'bg-white border border-[#E5DFD5] text-[#12213B] shadow-2xs rounded-tl-none'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-[11px] opacity-75 font-mono">
                <span className="font-bold">
                  {msg.role === 'user' ? 'You (Provider)' : 'LOKIVA Concierge'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Content */}
              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {msg.content}
              </div>

              {/* Action Approval Card (If Present) */}
              {msg.actionCard && (
                <div className="mt-3 p-4 rounded-2xl bg-[#FAF7F2] border-2 border-[#C85A32]/40 shadow-xs space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-[#C85A32] text-white">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-heading font-extrabold text-[#12213B]">
                        {msg.actionCard.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono uppercase font-bold text-[#C85A32] bg-[#FAF4ED] px-2 py-0.5 rounded border border-[#E8DEC8]">
                      Requires Approval
                    </span>
                  </div>

                  <p className="text-xs text-[#556275]">
                    {msg.actionCard.description}
                  </p>

                  {/* Summary Details */}
                  {msg.actionCard.summaryDetails && (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 rounded-xl border border-[#E5DFD5]">
                      {Object.entries(msg.actionCard.summaryDetails).map(([k, v]) => (
                        <div key={k} className="space-y-0.5">
                          <span className="text-[10px] text-[#556275] block">{k}:</span>
                          <span className="font-bold text-[#12213B] truncate block">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Execution Buttons */}
                  <div className="pt-1 flex items-center justify-between">
                    {msg.actionExecuted ? (
                      <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#065F46] bg-[#ECFDF5] px-3 py-1.5 rounded-xl border border-[#A7F3D0]">
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                        <span>Approved & Published Live</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => executeConciergeAction(msg.actionCard!, msg.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs font-heading font-bold transition shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Approve & Launch Campaign</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isConciergeTyping && (
          <div className="flex items-center gap-2 p-3 bg-white border border-[#E5DFD5] rounded-2xl w-48 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#C85A32] animate-spin" />
            <span className="text-xs text-[#556275] font-medium">
              Analyzing provider data...
            </span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-white border-t border-[#E5DFD5] overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[10px] font-mono text-[#556275] uppercase font-bold">
            Suggested:
          </span>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptChipClick(p)}
              className="text-xs font-heading text-[#12213B] bg-[#FAF7F2] hover:bg-[#FAF4ED] border border-[#E5DFD5] hover:border-[#C85A32] px-3 py-1 rounded-xl transition"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-[#FAF7F2] border-t border-[#E5DFD5] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask LOKIVA AI about bookings, earnings, slot suggestions, or campaign creation..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white focus:border-[#C85A32] focus:outline-hidden"
          disabled={isConciergeTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isConciergeTyping}
          className="p-2.5 bg-[#12213B] hover:bg-[#1E293B] disabled:opacity-50 text-white rounded-xl transition shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
