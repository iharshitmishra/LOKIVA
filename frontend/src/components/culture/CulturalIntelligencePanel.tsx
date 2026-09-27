import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  Send,
  ArrowRight,
  BookOpen,
  Landmark,
  ChevronDown,
  ChevronUp,
  Compass,
  Clock,
  MapPin,
  Flame,
  Info,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  getCulturalDataset,
  getUpcomingFestivalForState,
  StateCulturalDataset,
  StateFestival,
} from '../../data/culturalIntelligenceData';
import {
  askCulturalAssistant,
  CulturalMessage,
  PlanIntentInfo,
} from '../../services/culturalAssistantService';
import { StateThemePalette, getStateThemePalette } from '../../data/stateOverviewData';
import { useItineraryStore } from '../../store/useItineraryStore';

interface CulturalIntelligencePanelProps {
  stateSlug?: string;
  palette?: StateThemePalette;
  stateName?: string;
}

export const CulturalIntelligencePanel: React.FC<CulturalIntelligencePanelProps> = ({
  stateSlug: propStateSlug,
  palette: propPalette,
  stateName: propStateName,
}) => {
  const routeParams = useParams<{ stateSlug?: string }>();
  const navigate = useNavigate();
  const generateTrip = useItineraryStore((state) => state.generateTrip);

  const activeSlug = (propStateSlug || routeParams.stateSlug || 'rajasthan').toLowerCase().trim();
  const dataset: StateCulturalDataset | null = getCulturalDataset(activeSlug);
  const palette: StateThemePalette = propPalette || getStateThemePalette(activeSlug, propStateName || dataset?.stateName);

  const [upcomingFestival, setUpcomingFestival] = useState<StateFestival | null>(null);
  const [messages, setMessages] = useState<CulturalMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize and reset on state change
  useEffect(() => {
    setMessages([]);
    setStreamingText(null);
    setInputQuery('');
    setExpandedCitationId(null);

    const festival = getUpcomingFestivalForState(activeSlug);
    setUpcomingFestival(festival);
  }, [activeSlug]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (messages.length > 0 || streamingText) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, streamingText, isLoading]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setInputQuery('');
    const userMsgId = `user_${Date.now()}`;
    const userMsg: CulturalMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsLoading(true);
    setStreamingText('');

    try {
      const response = await askCulturalAssistant({
        stateSlug: activeSlug,
        query: textToSend,
        conversationHistory: updatedHistory,
        onTokenChunk: (chunk) => {
          setStreamingText(chunk);
        },
      });

      const assistantMsg: CulturalMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        grounding: response.grounding,
        followUps: response.followUps,
        planIntent: response.planIntent,
        timestamp: Date.now(),
      };

      setStreamingText(null);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Cultural Assistant interaction error:', err);
      const errorMsg: CulturalMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I am currently reconnecting with the ${dataset?.stateName || 'regional'} cultural archives. Please try asking again in a moment.`,
        timestamp: Date.now(),
      };
      setStreamingText(null);
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanHandoff = (intent?: PlanIntentInfo | null, festivalFallback?: StateFestival | null) => {
    const city = intent?.city || festivalFallback?.city || dataset?.primaryHub || 'Jaipur';
    const state = intent?.state || dataset?.stateName || 'Rajasthan';
    const focus = intent?.focus || festivalFallback?.name || 'Cultural Heritage & Living Festivals';

    generateTrip({
      city,
      state,
      daysCount: festivalFallback?.durationDays ? Math.max(3, festivalFallback.durationDays + 1) : 3,
      pace: 'balanced',
      focusCategory: 'Culture',
      interests: ['Heritage', 'Festivals', 'Crafts'],
    });

    navigate(`/itinerary?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&focus=${encodeURIComponent(focus)}`);
  };

  // 1. Graceful Unauthored Degradation State
  if (!dataset) {
    const fallbackName = propStateName || activeSlug.charAt(0).toUpperCase() + activeSlug.slice(1);
    return (
      <div
        className="mt-14 max-w-5xl mx-auto rounded-3xl p-8 sm:p-10 border shadow-xs"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: palette.borderHue,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              backgroundColor: `${palette.primaryAccent}15`,
              color: palette.primaryAccent,
            }}
          >
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Cultural Intelligence In Curation</span>
            </div>
            <h3 className="text-2xl font-display font-extrabold text-[#12213B]">
              Heritage Archives for {fallbackName}
            </h3>
            <p className="text-sm font-sans text-slate-600 leading-relaxed max-w-2xl">
              Our cultural historians and local curators are currently documenting historical epochs, living artisan guilds, and sacred festival calendars for {fallbackName}. In the meantime, explore our verified itineraries and monument circuits.
            </p>
          </div>
          <button
            onClick={() => handlePlanHandoff(null, null)}
            className="px-5 py-3 rounded-2xl text-xs font-heading font-extrabold uppercase tracking-wider text-white transition-transform hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer"
            style={{ backgroundColor: palette.primaryAccent }}
          >
            <span>Explore {fallbackName} Trips</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Dynamic starter prompt chips for active state
  const starterPrompts = [
    `Tell me about ${dataset.stateName}'s fortress citadels and dynasties`,
    upcomingFestival
      ? `What is the significance of the upcoming ${upcomingFestival.name}?`
      : `What living festivals take place in ${dataset.stateName}?`,
    `How can I experience generational artisan guilds and crafts?`,
  ];

  return (
    <div
      className="mt-16 max-w-5xl mx-auto rounded-3xl border shadow-lg overflow-hidden transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: palette.borderAccent,
        boxShadow: `0 16px 40px -12px ${palette.primaryAccent}18`,
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER: State-Grounded Cultural Intelligence Engine Masthead
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="px-6 py-5 sm:px-8 sm:py-6 border-b flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: palette.cardBgAlt,
          borderColor: palette.borderHue,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shadow-xs"
            style={{
              backgroundColor: palette.primaryAccent,
              color: '#FFFFFF',
            }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-heading font-extrabold uppercase tracking-widest"
                style={{ color: palette.primaryAccent }}
              >
                Cultural Intelligence Layer
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-mono font-bold text-stone-700 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Grounded in {dataset.stateName}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-display font-extrabold text-[#12213B] leading-tight mt-0.5">
              Ask {dataset.stateName} Heritage & Folklore
            </h3>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setStreamingText(null);
            }}
            className="text-xs font-mono font-medium text-slate-600 hover:text-[#12213B] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white shadow-2xs hover:bg-stone-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Thread</span>
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════════
            CAPABILITY 1: Proactive Date-Aware Upcoming Festival Surfacing Card
        ═══════════════════════════════════════════════════════════════════════ */}
        {upcomingFestival && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-5 sm:p-6 border-2 relative overflow-hidden group shadow-xs"
            style={{
              backgroundColor: palette.bgParchment,
              borderColor: palette.primaryAccent,
            }}
          >
            {/* Ambient Background Accent Motifs */}
            <div
              className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full pointer-events-none opacity-10"
              style={{ backgroundColor: palette.primaryAccent }}
            />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2.5 flex-1">
                {/* Proactive Countdown Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider text-white shadow-xs"
                    style={{ backgroundColor: palette.primaryAccent }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Upcoming Pageantry: In {upcomingFestival.daysUntil ?? 14} Days ({upcomingFestival.dateRange})
                    </span>
                  </span>
                  <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{upcomingFestival.city}</span>
                  </span>
                </div>

                {/* Festival Title & Narrative */}
                <div>
                  <h4 className="text-xl sm:text-2xl font-display font-extrabold text-[#12213B] leading-snug">
                    {upcomingFestival.name}
                  </h4>
                  <p className="text-xs sm:text-sm font-sans text-slate-700 leading-relaxed mt-1 max-w-2xl">
                    {upcomingFestival.significance}
                  </p>
                </div>
              </div>

              {/* Contextual Soft Handoff CTA */}
              <button
                type="button"
                onClick={() => handlePlanHandoff(null, upcomingFestival)}
                className="w-full md:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider text-white transition-all duration-300 hover:scale-[1.03] shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                style={{
                  backgroundColor: palette.primaryAccent,
                  boxShadow: `0 6px 18px ${palette.primaryAccent}40`,
                }}
              >
                <span>Plan a trip around this</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            CAPABILITY 2: Explainable Grounded Q&A Thread
        ═══════════════════════════════════════════════════════════════════════ */}
        {messages.length === 0 && !streamingText && (
          <div className="space-y-3 py-2">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" style={{ color: palette.primaryAccent }} />
              <span>Suggested Inquiries for {dataset.stateName}:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuery(prompt)}
                  className="text-left p-3.5 rounded-2xl border bg-stone-50/70 hover:bg-white text-xs sm:text-sm font-sans text-[#12213B] hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                  style={{ borderColor: palette.borderHue }}
                >
                  <span className="leading-snug">{prompt}</span>
                  <span
                    className="text-[11px] font-mono font-bold mt-2 inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ color: palette.primaryAccent }}
                  >
                    <span>Ask now</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List */}
        {messages.length > 0 && (
          <div className="space-y-5 pt-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed font-sans ${
                    msg.role === 'user'
                      ? 'border shadow-2xs'
                      : 'border shadow-sm'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          backgroundColor: palette.cardBgAlt,
                          borderColor: palette.borderAccent,
                          color: '#12213B',
                        }
                      : {
                          backgroundColor: '#FFFFFF',
                          borderColor: palette.borderHue,
                          color: '#1E293B',
                        }
                  }
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-stone-100">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: palette.primaryAccent }} />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        {dataset.stateName} Cultural Intel
                      </span>
                    </div>
                  )}

                  <div className="whitespace-pre-line font-sans leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Grounding Tag / Citation Pill */}
                  {msg.grounding && (
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCitationId(
                            expandedCitationId === msg.id ? null : msg.id
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors cursor-pointer"
                        style={{
                          backgroundColor: palette.badgeBg,
                          borderColor: palette.borderAccent,
                          color: palette.badgeText,
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Grounded in: {msg.grounding.tag}</span>
                        {expandedCitationId === msg.id ? (
                          <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>

                      {/* Expandable Exact Source Excerpt */}
                      <AnimatePresence>
                        {expandedCitationId === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <div
                              className="p-3.5 rounded-xl border text-xs font-sans text-slate-700 leading-relaxed"
                              style={{
                                backgroundColor: palette.bgParchment,
                                borderColor: palette.borderAccent,
                              }}
                            >
                              <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">
                                Curated Dataset Archive Excerpt:
                              </span>
                              <p className="italic">“{msg.grounding.excerpt}”</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Contextual Plannable Moment CTA */}
                  {msg.planIntent && (
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div className="text-xs font-sans text-slate-600">
                        <span className="font-heading font-bold text-[#12213B] block">
                          Plannable Travel Moment:
                        </span>
                        <span>{msg.planIntent.dates} · {msg.planIntent.city}, {msg.planIntent.state}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlanHandoff(msg.planIntent)}
                        className="px-4 py-2 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider text-white shadow-xs hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer shrink-0"
                        style={{ backgroundColor: palette.primaryAccent }}
                      >
                        <span>{msg.planIntent.ctaLabel || 'Plan a trip around this'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    CAPABILITY 3: Staggered Follow-up Question Chips
                ═════════════════════════════════════════════════════════════ */}
                {msg.followUps && msg.followUps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="flex flex-wrap gap-2 pt-1 max-w-2xl"
                  >
                    {msg.followUps.map((fu, fIdx) => (
                      <motion.button
                        key={fIdx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + fIdx * 0.08 }}
                        onClick={() => handleSendQuery(fu)}
                        className="text-xs font-sans font-medium px-3 py-1.5 rounded-full border bg-white hover:bg-stone-50 text-[#12213B] hover:shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        style={{ borderColor: palette.borderHue }}
                      >
                        <span>{fu}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Streaming Token-by-Token Indicator */}
        {streamingText !== null && (
          <div className="flex flex-col items-start space-y-2">
            <div
              className="max-w-3xl rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed font-sans border shadow-sm"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: palette.borderHue,
                color: '#1E293B',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-stone-100">
                <Sparkles className="w-3.5 h-3.5" style={{ color: palette.primaryAccent }} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  {dataset.stateName} Cultural Intel (Synthesizing...)
                </span>
              </div>
              <div className="whitespace-pre-line font-sans leading-relaxed">
                {streamingText}
                <span
                  className="inline-block w-2 h-4 ml-1 rounded-xs animate-pulse align-middle"
                  style={{ backgroundColor: palette.primaryAccent }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Lightweight Typing/Thinking Indicator */}
        {isLoading && streamingText === '' && (
          <div className="flex items-center gap-2 p-3 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: palette.primaryAccent, animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: palette.primaryAccent, animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: palette.primaryAccent, animationDelay: '300ms' }}
              />
            </div>
            <span>Grounding with {dataset.stateName} heritage dataset...</span>
          </div>
        )}

        <div ref={chatBottomRef} />

        {/* ═══════════════════════════════════════════════════════════════════════
            INPUT BAR: Styled in Sandstone Ivory with Theme Palette Accents
        ═══════════════════════════════════════════════════════════════════════ */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="pt-3 flex items-center gap-2 sm:gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask about ${dataset.stateName}'s history, festivals, or mastercrafts...`}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3.5 rounded-2xl border text-xs sm:text-sm font-sans text-[#12213B] placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs transition-all bg-stone-50/70 focus:bg-white"
              style={
                {
                  borderColor: palette.borderHue,
                  '--tw-ring-color': `${palette.primaryAccent}40`,
                } as any
              }
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: palette.primaryAccent }}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
