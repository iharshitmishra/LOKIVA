import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { ScoredExperience } from '../types';
import { ExperienceCard } from '../components/experience/ExperienceCard';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import {
  Sparkles,
  Send,
  User,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowRight,
  RotateCcw,
  MapPin,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendations?: ScoredExperience[];
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  timestamp: 'Just now',
  content:
    "Namaste! Welcome to LOKIVA, your AI Cultural Concierge.\n\nI'm here to help you experience authentic Indian heritage, generational culinary traditions, and master artisan workshops.\n\nBefore I recommend any places, where are you heading? (e.g., Jaipur, Varanasi, Udaipur, Delhi, Mumbai, Kochi, Goa)\n\nTell me your destination and what you're in the mood for, and I'll curate the top 2 signature spots for you!",
};

const getChatStorageKey = (user: { id?: string | number; email?: string } | null) => {
  if (!user) return null;
  return `lokiva_ai_guide_chat_${user.id || user.email}`;
};

export function AiGuidePage() {
  const { user, isAuthenticated, isLoading: authLoading, demoLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';

  const [inputMessage, setInputMessage] = useState(initialPrompt);

  // Synchronously initialize messages from localStorage so route switching never clears chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const activeUser = user || JSON.parse(localStorage.getItem('lokiva_user') || 'null');
      if (activeUser) {
        const key = getChatStorageKey(activeUser);
        if (key) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
              return parsed.messages;
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to initialize chat from storage:', e);
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  // Synchronously initialize currentCity from localStorage
  const [currentCity, setCurrentCity] = useState<string | null>(() => {
    try {
      const activeUser = user || JSON.parse(localStorage.getItem('lokiva_user') || 'null');
      if (activeUser) {
        const key = getChatStorageKey(activeUser);
        if (key) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.currentCity || null;
          }
        }
      }
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestReplyRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync chat history if user logs in or switches accounts
  useEffect(() => {
    if (!user) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      setCurrentCity(null);
      return;
    }

    const key = getChatStorageKey(user);
    if (!key) return;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          if (parsed.currentCity) {
            setCurrentCity(parsed.currentCity);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load saved chat from localStorage:', err);
    }
  }, [user?.id, user?.email]);

  // Persist chat to localStorage whenever messages or currentCity change (for authenticated user)
  useEffect(() => {
    if (!user) return;
    const key = getChatStorageKey(user);
    if (!key) return;

    // SAFETY GUARD: Never overwrite an existing multi-message conversation with a bare welcome message!
    if (messages.length <= 1 && messages[0]?.id === 'welcome-msg') {
      const existing = localStorage.getItem(key);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 1) {
            return;
          }
        } catch {}
      }
    }

    localStorage.setItem(
      key,
      JSON.stringify({
        messages,
        currentCity,
        savedAt: Date.now(),
      })
    );
  }, [messages, currentCity, user]);

  // Start fresh chat handler
  const handleStartFreshChat = () => {
    if (messages.length > 1) {
      const confirmReset = window.confirm(
        'Start a fresh conversation? This will clear your current chat history.'
      );
      if (!confirmReset) return;
    }

    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setCurrentCity(null);
    setInputMessage('');

    if (user) {
      const key = getChatStorageKey(user);
      if (key) {
        localStorage.removeItem(key);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Automatically scroll down when AI answers so the user can comfortably read the reply
  useEffect(() => {
    if (messages.length <= 1) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role === 'assistant') {
      const scrollDownToReply = () => {
        const el =
          latestReplyRef.current ||
          document.getElementById(`msg-${lastMessage.id}`);

        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      };

      const rafId = requestAnimationFrame(scrollDownToReply);
      const timer1 = setTimeout(scrollDownToReply, 80);
      const timer2 = setTimeout(scrollDownToReply, 250);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [messages]);

  // When user sends a message and loading starts, smoothly scroll so prompt and loading state are in view
  useEffect(() => {
    if (isLoading) {
      const scrollDownToLoading = () => {
        const el = loadingRef.current || document.getElementById('concierge-loading');
        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      };

      const timer = setTimeout(scrollDownToLoading, 80);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSend = async (customText?: string) => {
    // User must be authenticated to chat
    if (!isAuthenticated || !user) return;

    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const chatRes = await api.chatWithConcierge({
        message: textToSend,
        city: currentCity || undefined,
        chat_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      if (chatRes.context_destination) {
        setCurrentCity(chatRes.context_destination);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: chatRes.reply,
        recommendations: chatRes.suggested_experiences || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const rawMsg = err.message || '';
      const isNetworkError = /failed to fetch|network|refused|failed to connect/i.test(rawMsg);
      const isTransient = /503|high demand|temporarily unavailable|service unavailable/i.test(rawMsg);

      let friendlyMsg = 'Unable to reach the concierge. Please try again.';
      if (isNetworkError) {
        friendlyMsg =
          'Connecting to the LOKIVA Concierge service... The backend server is now active. Please tap send or type your question again!';
      } else if (isTransient) {
        friendlyMsg =
          "I'm experiencing a momentary high demand spike right now. Please tap send again in a moment, or tell me your destination and budget to get started!";
      } else {
        friendlyMsg =
          rawMsg.replace(/^(AI Concierge Error:\s*|\[GoogleGenerativeAI Error\]:\s*)/i, '').slice(0, 160) || friendlyMsg;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: friendlyMsg,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure user starts at top of page upon initial navigation and auto-sends initialPrompt if brand new
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (initialPrompt && isAuthenticated && user && messages.length <= 1) {
      handleSend(initialPrompt);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-paper text-ink pb-52 sm:pb-64 pt-6 sm:pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* AI Concierge Header */}
        <div className="bg-white rounded-3xl border border-paper-400 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-paper-100 border border-paper-300 text-teal rounded-full text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-marigold" />
                <span>Powered by Gemini AI</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-ink tracking-tight">
                AI Cultural Concierge
              </h1>
              <p className="text-xs sm:text-sm text-dusk-600 font-sans max-w-xl">
                Ask me anything about travel, culture, food, and experiences across India. I'll provide personalized recommendations based on your needs.
              </p>
            </div>

            {/* Start Fresh Chat Option (available when logged in with chat history) */}
            {isAuthenticated && messages.length > 1 && (
              <div className="flex-shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleStartFreshChat}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-paper-100 hover:bg-paper-200 border border-paper-400 hover:border-ink/40 text-ink rounded-2xl text-xs font-mono font-bold transition shadow-xs cursor-pointer"
                  title="Clear conversation and start fresh"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-terracotta" />
                  <span>Start Fresh Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Auth Loading State */}
        {authLoading && (
          <div className="bg-white rounded-3xl border border-paper-400 p-8 shadow-sm text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-teal animate-spin mx-auto" />
            <p className="text-xs font-mono text-dusk">Checking authentication...</p>
          </div>
        )}

        {/* Conversation Stream */}
        {!authLoading && (
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLatestReply = !isUser && index === messages.length - 1 && messages.length > 1;

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  ref={isLatestReply ? latestReplyRef : undefined}
                  className={`flex gap-3.5 sm:gap-4 scroll-mt-24 sm:scroll-mt-28 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-10 h-10 rounded-2xl bg-white border border-paper-400 text-marigold flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                      <Sparkles className="w-5 h-5 fill-marigold/30 text-marigold" />
                    </div>
                  )}

                  {/* Message Body Container */}
                  <div className={`space-y-4 max-w-3xl ${isUser ? 'w-auto' : 'w-full'}`}>
                    {/* Speech Bubble */}
                    <div
                      className={`rounded-3xl p-5 sm:p-6 shadow-sm border leading-relaxed ${
                        isUser
                          ? 'bg-ink text-paper border-ink rounded-tr-xs font-sans text-xs sm:text-sm'
                          : 'bg-white text-ink border-paper-400 rounded-tl-xs space-y-4 font-sans text-xs sm:text-sm'
                      }`}
                    >
                      {/* Timestamp & Role Header */}
                      <div className="flex items-center justify-between gap-4 text-[10px] font-mono opacity-70 pb-2 border-b border-paper-200">
                        <span>{isUser ? 'You (Traveler)' : 'LOKIVA Concierge'}</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Text Message */}
                      <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                        {msg.content}
                      </p>

                      {/* AI Recommended Experiences */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="bg-white rounded-3xl border border-paper-400 p-5 sm:p-6 shadow-sm space-y-4">
                          <div className="pb-3 border-b border-paper-200 text-xs font-mono">
                            <span className="font-bold text-ink flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-teal" />
                              <span>AI Recommended Experiences ({msg.recommendations.length})</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {msg.recommendations.map((rec, rIdx) => (
                              <ExperienceCard key={rIdx} experience={rec.experience} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-10 h-10 rounded-2xl bg-ink text-paper flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Compulsory Authentication Gate Card if Not Logged In */}
            {!isAuthenticated && (
              <div className="bg-white rounded-3xl border border-paper-400 p-6 sm:p-8 shadow-md space-y-6 max-w-xl mx-auto my-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-paper-100 border border-paper-300 text-marigold flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-7 h-7 text-marigold" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-ink">
                    Sign in to Chat with AI Concierge
                  </h2>
                  <p className="text-xs sm:text-sm text-dusk-600 font-sans leading-relaxed">
                    Please log in or create an account to converse with your AI Cultural Concierge. Your travel chats, generational culinary tips, and personalized recommendations will be securely preserved across visits.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Google Sign In */}
                  <GoogleSignInButton role="traveler" redirectTo="/ai-guide" />

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-paper-300" />
                    <span className="text-[10px] font-mono font-bold text-dusk uppercase tracking-wider">
                      Or with Credentials
                    </span>
                    <div className="flex-1 h-px bg-paper-300" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Link
                      to="/login/traveler?redirect=/ai-guide"
                      className="w-full py-2.5 px-4 bg-ink hover:bg-ink-800 text-paper rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5 text-marigold" />
                    </Link>

                    <Link
                      to="/register/traveler?redirect=/ai-guide"
                      className="w-full py-2.5 px-4 bg-white hover:bg-paper-100 border border-paper-400 text-ink rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Create Account</span>
                    </Link>
                  </div>

                  {/* Quick 1-Click Demo Traveler */}
                  <button
                    type="button"
                    onClick={() => demoLogin('traveler', 'Piyush Kumar', 'piyush@lokiva.com')}
                    className="w-full py-2 px-3 bg-paper-100 hover:bg-paper-200 border border-dashed border-paper-400 text-teal rounded-xl text-xs font-mono font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-marigold" />
                    <span>Instant Demo Access (Traveler)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading Animation */}
            {isLoading && (
              <div
                ref={loadingRef}
                id="concierge-loading"
                className="flex gap-4 max-w-xl scroll-mt-24 sm:scroll-mt-28"
              >
                <div className="w-10 h-10 rounded-2xl bg-white border border-paper-400 text-marigold flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 animate-spin text-marigold" />
                </div>
                <div className="p-5 bg-white border border-paper-400 rounded-3xl rounded-tl-xs text-xs font-mono text-ink space-y-2 shadow-sm flex-1">
                  <div className="flex items-center gap-2 text-teal font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Thinking about the best experiences for you...</span>
                  </div>
                  <p className="text-[11px] text-dusk-600 font-sans">
                    Please wait while I analyze your request and find the perfect places.
                  </p>
                  <div className="w-full bg-paper-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-marigold h-full w-2/3 animate-pulse rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom spacer for comfortable scrolling above fixed bar */}
            <div ref={chatEndRef} className="h-4" />
          </div>
        )}

        {/* Input Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur-md border-t border-paper-300 p-2.5 sm:p-4 z-40">
          <div className="max-w-4xl mx-auto space-y-2">
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1 px-2">
                <div className="flex items-center gap-2 text-xs font-sans text-dusk-700 text-center sm:text-left">
                  <Lock className="w-4 h-4 text-marigold flex-shrink-0" />
                  <span>Please sign in or create an account to start chatting with the AI Concierge.</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center">
                  <Link
                    to="/login/traveler?redirect=/ai-guide"
                    className="flex-1 sm:flex-none justify-center px-4 py-2 bg-ink hover:bg-ink-800 text-paper rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5 text-marigold" />
                  </Link>
                  <Link
                    to="/register/traveler?redirect=/ai-guide"
                    className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white hover:bg-paper-100 border border-paper-400 text-ink rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Create Account</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Context Header / Destination Selector */}
                {!currentCity ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none [-webkit-overflow-scrolling:touch] text-xs">
                    <span className="text-dusk font-mono text-[10px] uppercase tracking-wider flex-shrink-0">
                      Select destination:
                    </span>
                    {['Jaipur', 'Varanasi', 'Goa', 'Mumbai', 'Delhi', 'Kochi', 'Udaipur'].map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSend(`I want to explore ${city}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-paper-100 border border-paper-400 rounded-full text-xs font-mono font-medium text-ink transition flex-shrink-0 shadow-xs cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-teal flex-shrink-0" />
                        <span>{city}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-mono px-1">
                    <span className="flex items-center gap-1.5 text-teal font-bold">
                      <MapPin className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                      <span>Active Destination: <strong>{currentCity}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentCity(null)}
                      className="hover:underline text-[11px] text-terracotta font-medium cursor-pointer"
                    >
                      Change city
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 bg-white border border-paper-400 rounded-2xl p-1.5 sm:p-2 shadow-xl"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      !currentCity
                        ? 'Where in India are you heading? (e.g., Jaipur, Varanasi, Goa...)'
                        : `Ask about ${currentCity} (e.g., 3 hours with family, street food)`
                    }
                    className="flex-1 min-w-0 bg-transparent px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none placeholder-dusk font-sans"
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-ink hover:bg-ink-800 text-paper rounded-xl text-xs font-mono font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-md flex-shrink-0 cursor-pointer"
                  >
                    <span>Solve</span>
                    <Send className="w-3.5 h-3.5 text-marigold" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
