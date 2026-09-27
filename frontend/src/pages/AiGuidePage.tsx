import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { ScoredExperience } from '../types';
import { ExperienceCard } from '../components/experience/ExperienceCard';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { routeVoiceInput, UserSessionContext } from '../lib/voiceRouter';
import { generateLocalConciergeResponse } from '../lib/localConcierge';
import { auth } from '../lib/firebase';
import {
  speakWithElevenLabsOrFallback,
  PlaybackController,
  checkHostedTTSConfigured,
  unlockAudio,
} from '../lib/tts';
import { useVoiceInput, cleanSpeechTranscript } from '../hooks/useVoiceInput';
import { VOICE_SUGGESTIONS } from '../data/voiceSuggestions';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AudioWaveformVisualizer } from '../components/voice/AudioWaveformVisualizer';
import { VoiceRecordingSheet } from '../components/voice/VoiceRecordingSheet';
import { FormattedMessageContent } from '../components/ui/FormattedMessageContent';
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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CloudSun,
  IndianRupee,
  Navigation,
  X,
  Compass,
  Loader2,
} from 'lucide-react';

// ===========================================================================
// Types
// ===========================================================================

interface WeatherData {
  location_name: string;
  temp_c: number;
  condition: string;
  humidity?: number;
  will_rain_soon?: boolean;
  is_live?: boolean;
}

interface ExperienceData {
  name: string;
  distance_meters: number;
  price_inr: number;
  crowd_tag?: string;
  category?: string;
  time_remaining_after_visit_minutes?: number;
}

interface ExpenseData {
  added_amount?: number;
  category?: string;
  note?: string;
  today_total_inr?: number;
  total_inr?: number;
  count?: number;
  period?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  spokenText?: string;
  timestamp: string;
  recommendations?: ScoredExperience[];
  intent?: string;
  weatherData?: WeatherData;
  experienceData?: ExperienceData;
  expenseData?: ExpenseData;
  isVoiceInitiated?: boolean;
}

// ===========================================================================
// Constants
// ===========================================================================

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  timestamp: 'Just now',
  content:
    'Namaste! Welcome to LOKIVA, your AI Cultural Concierge.\n\nWhere are you heading to in India, and what are your interests? Tell me your destination (like Jaipur, Varanasi, Mumbai, or Goa) and whether you are drawn to royal heritage, street food, artisan workshops, or quiet temples, and I will curate the best spots for you!',
  spokenText:
    'Namaste! Welcome to Lokiva. Where in India are you heading to, and what are your interests? Tell me your destination and what you want to experience!',
};

const INTEREST_OPTIONS = [
  { label: 'Royal Heritage', icon: '🏰', interest: 'royal heritage and palaces' },
  { label: 'Street Food', icon: '🍲', interest: 'authentic street food and legendary culinary stalls' },
  { label: 'Artisan Crafts', icon: '🎨', interest: 'traditional artisan workshops and master craftspeople' },
  { label: 'Sacred Ghats', icon: '🪔', interest: 'sacred ghats, evening aarti and spiritual walks' },
  { label: 'Coastal Vibes', icon: '🌊', interest: 'quiet beaches and coastal seafood shacks' },
  { label: 'Quiet Temples', icon: '🧘', interest: 'peaceful ancient temples away from crowds' },
];

const getChatStorageKey = (user: { id?: string | number; email?: string } | null) => {
  if (!user) return null;
  return `lokiva_ai_guide_chat_${user.id || user.email}`;
};

const sanitizeStoredMessages = (rawMessages: any): ChatMessage[] => {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return [DEFAULT_WELCOME_MESSAGE];
  }
  const seenIds = new Set<string>();
  const cleaned: ChatMessage[] = [];
  let lastContent = '';
  for (const m of rawMessages) {
    if (!m || typeof m.content !== 'string') continue;
    const trimmed = m.content.trim();
    if (!trimmed) continue;
    if (trimmed.includes('Payload Too Large') || trimmed.includes('413') || trimmed.includes('Failed to fetch')) continue;
    // Suppress consecutive duplicate messages from past loops
    if (trimmed === lastContent) continue;
    lastContent = trimmed;

    if (m.id === 'welcome-msg' && cleaned.length > 0) continue;
    let id = m.id;
    if (!id || seenIds.has(id)) {
      id = `${m.role || 'msg'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }
    seenIds.add(id);
    cleaned.push({ ...m, id });
  }
  return cleaned.length > 0 ? cleaned.slice(-20) : [DEFAULT_WELCOME_MESSAGE];
};

// ===========================================================================
// Daily Expense Storage & Midnight Reset Helpers
// ===========================================================================

const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDailySpendStorageKey = (userId?: string | number | null): string => {
  const identifier = userId || localStorage.getItem('lokiva_session_id') || 'guest';
  return `lokiva_daily_spend_${identifier}`;
};

const loadDailySpend = (userId?: string | number | null): number => {
  try {
    const today = getTodayDateStr();
    const primaryKey = getDailySpendStorageKey(userId);
    const raw = localStorage.getItem(primaryKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && typeof parsed.total === 'number') {
        return parsed.total;
      }
      localStorage.removeItem(primaryKey);
    }

    if (userId) {
      const sessionKey = getDailySpendStorageKey(null);
      if (sessionKey !== primaryKey) {
        const sessionRaw = localStorage.getItem(sessionKey);
        if (sessionRaw) {
          const parsedSession = JSON.parse(sessionRaw);
          if (parsedSession.date === today && typeof parsedSession.total === 'number' && parsedSession.total > 0) {
            return parsedSession.total;
          }
        }
      }
    }
    return 0;
  } catch {
    return 0;
  }
};

const saveDailySpend = (
  userId: string | number | null | undefined,
  total: number,
  addedItem?: { amount: number; note: string; category: string }
) => {
  try {
    const primaryKey = getDailySpendStorageKey(userId);
    const today = getTodayDateStr();
    let items: any[] = [];
    try {
      const raw = localStorage.getItem(primaryKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today && Array.isArray(parsed.items)) {
          items = parsed.items;
        }
      }
    } catch {}

    if (addedItem) {
      items.push({ ...addedItem, timestamp: new Date().toISOString() });
    }

    const payload = JSON.stringify({
      date: today,
      total: Math.max(0, total),
      items,
    });

    localStorage.setItem(primaryKey, payload);

    if (userId) {
      const sessionKey = getDailySpendStorageKey(null);
      if (sessionKey !== primaryKey) {
        localStorage.setItem(sessionKey, payload);
      }
    }
  } catch (err) {
    console.warn('Failed to save daily spend to localStorage:', err);
  }
};

function guessExpenseCategory(text: string): string {
  const t = (text || '').toLowerCase();
  if (/rickshaw|auto|cab|taxi|uber|ola|metro|bus|train|flight|fare|ride|petrol|fuel|ticket|transit|travelling|travel/i.test(t)) return 'transport';
  if (/food|lunch|dinner|breakfast|snack|cafe|chai|tea|coffee|thali|biryani|dosa|meal|restaurant|eating|drink|water/i.test(t)) return 'food';
  if (/hotel|hostel|stay|room|resort|homestay|lodge|night/i.test(t)) return 'stay';
  if (/ticket|entry|museum|monument|fort|palace|show|safari|guide/i.test(t)) return 'activity';
  if (/shop|souvenir|dress|clothes|market|bazaar|handicraft|gift/i.test(t)) return 'shopping';
  return 'other';
}

interface ParsedExpense {
  amount: number;
  note: string;
  category: string;
}

function parseExpenseText(text: string): ParsedExpense | null {
  if (!text) return null;
  const clean = text.trim();

  // Pattern 1: (i spent / spent / paid / add / added / log / logged / track / bought / cost / kharcha) [of] [rs|inr|₹] 400 [rs|inr|rupees] [on/for ...]
  const m1 = clean.match(
    /(?:i\s+)?(?:spent|spend|paid|add|added|log|logged|track|tracked|bought|cost|kharcha)(?:\s+expense)?\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)?(?:\s+(?:on|for|in|at|to)\s+([a-zA-Z\s]+))?/i
  );
  if (m1) {
    const amt = parseFloat(m1[1]);
    if (!isNaN(amt) && amt > 0) {
      let note = (m1[2] || '').trim();
      note = note.replace(/\b(rn|right now|today|now|only|please|just now)\b/gi, '').trim();
      if (!note || /^(rs|rupees|inr|spent|today|only|here|now)$/i.test(note)) {
        const parts = clean.split(m1[1]);
        const after = parts[1] ? parts[1].replace(/(?:rs\.?|inr|rupees|spent|today|only|here|now|rn|right now)/gi, '').trim() : '';
        note = after.replace(/^(on|for|in|at|to)\s+/i, '').trim() || 'expense';
      }
      return { amount: amt, note, category: guessExpenseCategory(note + ' ' + clean) };
    }
  }

  // Pattern 2: [rs|inr|₹] 400 [rs] (spent|paid|for|on) ...
  const m2 = clean.match(
    /(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)?\s*(?:spent|paid|for|on|in|at)\s*([a-zA-Z\s]+)?/i
  );
  if (m2 && !/min|minute|hour|day|km|meter|night/i.test(clean)) {
    const amt = parseFloat(m2[1]);
    if (!isNaN(amt) && amt > 0) {
      let note = (m2[2] || 'expense').trim();
      note = note.replace(/\b(rn|right now|today|now|only|please|just now)\b/gi, '').trim();
      return { amount: amt, note, category: guessExpenseCategory(note + ' ' + clean) };
    }
  }

  // Pattern 3: item name + amount (e.g. "rickshaw 200 rs", "lunch 500 inr")
  const m3 = clean.match(
    /^([a-zA-Z\s]{2,25})\s+(?:for|cost|costing|was|of)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)?(?:\s+(?:only|today|rn))?$/i
  );
  if (m3 && !/^(what|where|how|when|who|why|which|can|could|will|would|is|are|tell)/i.test(m3[1])) {
    const amt = parseFloat(m3[2]);
    if (!isNaN(amt) && amt > 0) {
      const note = m3[1].trim();
      return { amount: amt, note, category: guessExpenseCategory(note + ' ' + clean) };
    }
  }

  // Pattern 4: Explicit "spent 400" or "400 spent"
  const m4 = clean.match(/(?:spent|spend|paid|add)\s+(\d+(?:\.\d+)?)/i) || clean.match(/(\d+(?:\.\d+)?)\s+(?:spent|spend|paid)/i);
  if (m4) {
    const amt = parseFloat(m4[1]);
    if (!isNaN(amt) && amt > 0) {
      return { amount: amt, note: 'expense', category: 'other' };
    }
  }

  return null;
}

function isExpenseInquiry(text: string): boolean {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  return /(how much.*(?:spent|spend|budget)|what('s|\s+is).*(?:my\s+)?(?:spend|spending|expense|budget)|total\s+(?:spend|budget)|today'?s\s+(?:spend|budget)|budget\s+of\s+today|my\s+spending|show\s+(?:my\s+)?expenses?|check\s+(?:my\s+)?spend)/i.test(
    clean
  );
}

function isWeatherQuery(text: string): boolean {
  if (!text) return false;
  return /(^|\b)(what('s| is) the (weather|temperature|forecast)|is it raining in|weather in|how is the weather)(\b|$)/i.test(text);
}

// ===========================================================================
// Component
// ===========================================================================

export function AiGuidePage() {
  const { user, token, isAuthenticated, isLoading: authLoading, demoLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';

  const [inputMessage, setInputMessage] = useState(initialPrompt);
  const shouldReduceMotion = useReducedMotion();

  // Synchronously initialize messages from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const activeUser = user || JSON.parse(localStorage.getItem('lokiva_user') || 'null');
      if (activeUser) {
        const key = getChatStorageKey(activeUser);
        if (key) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            return sanitizeStoredMessages(parsed.messages);
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
  // Synchronously initialize todayTotal from today's saved daily ledger
  const [todayTotal, setTodayTotal] = useState<number>(() => {
    try {
      const activeUser = user || JSON.parse(localStorage.getItem('lokiva_user') || 'null');
      return loadDailySpend(activeUser?.id);
    } catch {
      return 0;
    }
  });
  const [isTotalLoading, setIsTotalLoading] = useState(false);
  const [ttsActiveMessageId, setTtsActiveMessageId] = useState<string | null>(null);
  const [voiceSpeakingState, setVoiceSpeakingState] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const latestReplyRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activePlaybackRef = useRef<PlaybackController | null>(null);

  // Voice input hook
  const {
    isListening,
    isTranscribing,
    recordingDuration,
    interimTranscript,
    startListening,
    stopListening,
    submitListening,
    cancelListening,
    resetTranscript,
    isSupported: voiceSupported,
  } = useVoiceInput({
    onInterimTranscript: (text: string) => {
      setInputMessage(text);
    },
    onFinalTranscript: (text: string) => {
      const clean = cleanSpeechTranscript(text);
      setInputMessage(clean);
      handleSend(clean, true);
    },
  });

  // ===========================================================================
  // Expense total fetch & persistence
  // ===========================================================================
  const fetchTodayTotal = useCallback(async () => {
    setIsTotalLoading(true);
    const activeUserId = user?.id;
    const localToday = loadDailySpend(activeUserId);

    // Immediately present any local spending recorded for today
    if (localToday > 0) {
      setTodayTotal(localToday);
    }

    try {
      let authToken = token;
      if (!authToken) {
        authToken =
          localStorage.getItem('lokiva_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('auth_token');
      }
      if (!authToken && auth && auth.currentUser) {
        try {
          authToken = await auth.currentUser.getIdToken();
        } catch {}
      }

      let sessionId = localStorage.getItem('lokiva_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('lokiva_session_id', sessionId);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      };
      if (activeUserId) {
        headers['x-user-id'] = String(activeUserId);
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/voice/expense-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ period: 'today' }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverTotal = Number(data.total_inr) || 0;
        // Keep the higher value between server and local to prevent accidental zeroing
        const syncedTotal = Math.max(serverTotal, localToday);
        setTodayTotal(syncedTotal);
        saveDailySpend(activeUserId, syncedTotal);
      } else if (localToday > 0) {
        setTodayTotal(localToday);
      }
    } catch {
      if (localToday > 0) {
        setTodayTotal(localToday);
      }
    } finally {
      setIsTotalLoading(false);
    }
  }, [user, token]);

  // ===========================================================================
  // Effects
  // ===========================================================================

  // Fetch today's expense total on mount and when authentication or user updates
  useEffect(() => {
    fetchTodayTotal();
  }, [fetchTodayTotal]);

  // Midnight rollover check: automatically resets spend to 0 once the day ends
  useEffect(() => {
    let lastDate = getTodayDateStr();
    const interval = setInterval(() => {
      const currentDate = getTodayDateStr();
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        // Day has ended: reset spend for the new day
        setTodayTotal(0);
        saveDailySpend(user?.id, 0);
        fetchTodayTotal();
      }
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [fetchTodayTotal, user?.id]);

  // Cross-component & cross-tab live expense synchronization
  useEffect(() => {
    const handleExpenseUpdate = (e: any) => {
      const detail = e.detail;
      if (detail && typeof detail.total === 'number') {
        setTodayTotal(detail.total);
      } else {
        fetchTodayTotal();
      }
    };
    window.addEventListener('lokiva_expense_updated', handleExpenseUpdate);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('lokiva_daily_spend_')) {
        const activeUserId = user?.id;
        setTodayTotal(loadDailySpend(activeUserId));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('lokiva_expense_updated', handleExpenseUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchTodayTotal, user?.id]);

  // Sync chat history when user changes
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
        const clean = sanitizeStoredMessages(parsed.messages);
        setMessages(clean);
        if (parsed.currentCity) setCurrentCity(parsed.currentCity);
      }
    } catch (err) {
      console.error('Failed to load saved chat from localStorage:', err);
    }
  }, [user?.id, user?.email]);

  // Persist chat to localStorage
  useEffect(() => {
    if (!user) return;
    const key = getChatStorageKey(user);
    if (!key) return;

    // Safety guard: never overwrite an existing multi-message conversation with a bare welcome
    if (messages.length <= 1 && messages[0]?.id === 'welcome-msg') {
      const existing = localStorage.getItem(key);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 1) return;
        } catch {}
      }
    }

    localStorage.setItem(key, JSON.stringify({ messages, currentCity, savedAt: Date.now() }));
  }, [messages, currentCity, user]);

  // Auto-scroll on new assistant message
  useEffect(() => {
    if (messages.length <= 1) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      const scrollDown = () => {
        const el = latestReplyRef.current || document.getElementById(`msg-${lastMessage.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const rafId = requestAnimationFrame(scrollDown);
      const t1 = setTimeout(scrollDown, 80);
      const t2 = setTimeout(scrollDown, 250);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [messages]);

  // Scroll to loading state when it appears
  useEffect(() => {
    if (isLoading) {
      const scroll = () => {
        const el = loadingRef.current || document.getElementById('concierge-loading');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      const t = setTimeout(scroll, 80);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Auto-scroll when listening or interim transcript updates
  useEffect(() => {
    if (isListening) {
      const bubble = document.getElementById('live-voice-bubble');
      if (bubble) {
        bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [isListening, interimTranscript]);

  // Global one-time interaction listener to prime AudioContext across browsers
  useEffect(() => {
    const onFirstInteraction = () => {
      unlockAudio();
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
    window.addEventListener('click', onFirstInteraction);
    window.addEventListener('keydown', onFirstInteraction);
    window.addEventListener('touchstart', onFirstInteraction);
    return () => {
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
  }, []);

  // Auto-send initialPrompt when first authenticated
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (initialPrompt && isAuthenticated && user && messages.length <= 1) {
      handleSend(initialPrompt, false);
    }
  }, [isAuthenticated]);

  // ===========================================================================
  // TTS
  // ===========================================================================

  const handleSpeak = useCallback(
    (messageId: string, text: string) => {
      // Toggle off if already speaking this message
      if (ttsActiveMessageId === messageId) {
        activePlaybackRef.current?.stop();
        activePlaybackRef.current = null;
        setTtsActiveMessageId(null);
        setVoiceSpeakingState(false);
        return;
      }

      // Stop any current playback
      activePlaybackRef.current?.stop();
      activePlaybackRef.current = null;

      setTtsActiveMessageId(messageId);
      setVoiceSpeakingState(true);

      activePlaybackRef.current = speakWithElevenLabsOrFallback({
        text,
        onEnd: () => {
          setTtsActiveMessageId(null);
          setVoiceSpeakingState(false);
          activePlaybackRef.current = null;
        },
        onError: () => {
          setTtsActiveMessageId(null);
          setVoiceSpeakingState(false);
          activePlaybackRef.current = null;
        },
      });
    },
    [ttsActiveMessageId]
  );

  // Cleanup playback on unmount
  useEffect(() => {
    return () => {
      activePlaybackRef.current?.stop();
    };
  }, []);

  // ===========================================================================
  // Start fresh chat
  // ===========================================================================
  const handleStartFreshChat = () => {
    if (messages.length > 1) {
      const confirmReset = window.confirm('Start a fresh conversation? This will clear your current chat history.');
      if (!confirmReset) return;
    }
    // Stop any active TTS
    activePlaybackRef.current?.stop();
    activePlaybackRef.current = null;
    setTtsActiveMessageId(null);
    setVoiceSpeakingState(false);

    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setCurrentCity(null);
    setInputMessage('');

    if (user) {
      const key = getChatStorageKey(user);
      if (key) localStorage.removeItem(key);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSendingRef = useRef(false);

  // ===========================================================================
  // Unified send handler (typed, chip tap, voice)
  // ===========================================================================
  const handleSend = async (customText?: string, voiceInitiated = false) => {
    if (!isAuthenticated || !user) return;
    if (isSendingRef.current) return;
    const textToSend = cleanSpeechTranscript(customText || inputMessage).trim();
    if (!textToSend) return;
    // Prevent double submits from typing, but never drop spoken voice input
    if (isLoading && !customText) return;

    isSendingRef.current = true;

    // Arm audio context immediately on user gesture
    unlockAudio();

    // Safely disarm mic without triggering double-submit recursion
    cancelListening();

    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoiceInitiated: voiceInitiated,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let botContent = '';
      let spokenText = '';
      let recommendations: ScoredExperience[] | undefined;
      let weatherData: WeatherData | undefined;
      let experienceData: ExperienceData | undefined;
      let expenseData: ExpenseData | undefined;
      let detectedIntent: ChatMessage['intent'] = 'none';

      // 1. Detect Expense Logging (typed or spoken)
      const parsedExpense = parseExpenseText(textToSend);
      if (parsedExpense) {
        detectedIntent = 'log_expense';
        const { amount, note, category } = parsedExpense;
        const optimisticTotal = todayTotal + amount;

        // Immediate UI and local persistence update
        setTodayTotal(optimisticTotal);
        saveDailySpend(user?.id, optimisticTotal, { amount, note, category });
        window.dispatchEvent(
          new CustomEvent('lokiva_expense_updated', {
            detail: { total: optimisticTotal, amount, note, category },
          })
        );

        let finalTotal = optimisticTotal;

        // Sync with backend ledger
        try {
          let authToken = token;
          if (!authToken) {
            authToken =
              localStorage.getItem('lokiva_token') ||
              localStorage.getItem('token') ||
              localStorage.getItem('auth_token');
          }
          let sessionId = localStorage.getItem('lokiva_session_id');
          if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('lokiva_session_id', sessionId);
          }

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          };
          if (user?.id) {
            headers['x-user-id'] = String(user.id);
          }
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }

          const res = await fetch('/voice/log-expense', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              amount_inr: amount,
              category,
              note,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const serverReported = Number(data.today_total_inr);
            if (!isNaN(serverReported) && serverReported > 0) {
              finalTotal = Math.max(serverReported, optimisticTotal);
              setTodayTotal(finalTotal);
              saveDailySpend(user?.id, finalTotal);
            }
          }
        } catch (syncErr) {
          console.warn('[AiGuide] Server expense sync error:', syncErr);
        }

        expenseData = {
          added_amount: amount,
          category,
          note,
          today_total_inr: finalTotal,
        };

        botContent = `Recorded \u20B9${amount.toLocaleString('en-IN')} for ${note}. Today's total spend is now \u20B9${finalTotal.toLocaleString('en-IN')}.\n\nWhere are you heading to next, and what are your interests?`;
        spokenText = `Recorded ${amount} rupees for ${note}. Today's total spend is now ${finalTotal} rupees. Where are you heading to next, and what are your interests?`;
      } else if (isExpenseInquiry(textToSend)) {
        // 2. Direct Expense Summary Inquiry (typed or spoken)
        detectedIntent = 'get_expense_summary';
        const currentSpend = todayTotal;

        expenseData = {
          total_inr: currentSpend,
          period: 'today',
        };

        botContent =
          currentSpend > 0
            ? `You have spent \u20B9${currentSpend.toLocaleString('en-IN')} today. Where are you heading to next, and what are your interests?`
            : 'You have not recorded any expenses yet for today. Where in India are you heading to, and what are your interests?';
        spokenText =
          currentSpend > 0
            ? `You have spent ${currentSpend} rupees today. Where are you heading to next, and what are your interests?`
            : 'You have not recorded any expenses yet for today. Where in India are you heading to, and what are your interests?';
      } else if (isWeatherQuery(textToSend)) {
        // 3. Live Weather Sensor Inquiry (typed or spoken)
        const context: UserSessionContext = {
          currentLocationName: currentCity ? currentCity : 'Jaipur',
          activeTripDeadlines: [],
          currentItinerary: null,
        };
        const routeResult = await routeVoiceInput(textToSend, context);
        detectedIntent = routeResult.intent;
        botContent = routeResult.spoken_response;
        spokenText = routeResult.spoken_response;
        if (routeResult.intent === 'get_weather' && routeResult.data) {
          weatherData = routeResult.data as WeatherData;
        }
      } else {
        // 4. Cultural Concierge for destination exploration, questions, itineraries, greetings
        try {
          const chatRes = await api.chatWithConcierge({
            message: textToSend,
            city: currentCity || undefined,
            chat_history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          });
          if (chatRes.context_destination) setCurrentCity(chatRes.context_destination);
          botContent = chatRes.reply;
          spokenText = chatRes.reply;
          recommendations = chatRes.suggested_experiences || [];
        } catch (conciergeErr: any) {
          console.warn('[AiGuide] API chatWithConcierge fallback activated:', conciergeErr);
          const fallbackRes = generateLocalConciergeResponse(textToSend, currentCity || undefined);
          if (fallbackRes.context_destination) setCurrentCity(fallbackRes.context_destination);
          botContent = fallbackRes.reply;
          spokenText = fallbackRes.reply;
          recommendations = fallbackRes.suggested_experiences || [];
        }
      }

      // Strict em dash and double dash sanitation for visual chat bubble
      const cleanBotContent = botContent
        .replace(/[\u2014\u2015]/g, ', ')
        .replace(/[\u2013]/g, '-')
        .replace(/--+/g, '-')
        .trim();

      // Build speech text: strip markdown symbols, emojis, and format concisely for fast audio response
      let cleanSpokenText = spokenText
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u2014\u2015]/g, ', ')
        .replace(/[\u2013]/g, '-')
        .replace(/--+/g, '-')
        .replace(/[*#_`~]/g, '')
        .trim();

      // If text is very long, extract primary conversational part so TTS synthesizes in under 1 second
      if (cleanSpokenText.length > 320) {
        const paragraphs = cleanSpokenText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        if (paragraphs.length > 1) {
          const first = paragraphs[0];
          const last = paragraphs[paragraphs.length - 1];
          cleanSpokenText = last.includes('?') && last.length < 150 ? `${first}. ${last}` : first;
        } else {
          const sentences = cleanSpokenText.match(/[^.!?]+[.!?]+/g);
          if (sentences && sentences.length > 2) {
            cleanSpokenText = sentences.slice(0, 3).join(' ');
          }
        }
      }
      cleanSpokenText = cleanSpokenText.replace(/[\u2014\u2015]/g, ', ').replace(/--+/g, '-').trim();

      const botMsgId = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: cleanBotContent,
        spokenText: cleanSpokenText,
        recommendations,
        intent: detectedIntent,
        weatherData,
        experienceData,
        expenseData,
        isVoiceInitiated: voiceInitiated,
      };

      setMessages((prev) => [...prev, botMsg]);

      // STRICT REQUIREMENT: After every answer through chat or mic, deliver response in both chat and audio
      if (cleanSpokenText) {
        handleSpeak(botMsgId, cleanSpokenText);
      }
    } catch (err: any) {
      const rawMsg = err.message || '';
      const isNetworkError = /failed to fetch|network|refused|failed to connect/i.test(rawMsg);
      const isTransient = /503|high demand|temporarily unavailable|service unavailable/i.test(rawMsg);

      let friendlyMsg = 'Unable to reach the concierge. Please try again.';
      if (isNetworkError) {
        friendlyMsg =
          'Connecting to the LOKIVA Concierge service. The backend server may still be warming up. Please tap Send again in a moment.';
      } else if (isTransient) {
        friendlyMsg =
          'I am experiencing a momentary high demand spike. Please tap Send again in a moment, or tell me your destination to get started!';
      } else {
        friendlyMsg =
          rawMsg.replace(/^(AI Concierge Error:\s*|\[GoogleGenerativeAI Error\]:\s*)/i, '').slice(0, 160) ||
          friendlyMsg;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: friendlyMsg,
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
      resetTranscript();
    }
  };

  // ===========================================================================
  // Render
  // ===========================================================================

  // Input display: show recognized speech (stored in inputMessage or interimTranscript)
  const inputDisplayValue = inputMessage || (isListening || isTranscribing ? (interimTranscript || '') : '');

  return (
    <div className="min-h-screen bg-transparent text-ink pb-72 sm:pb-88 pt-6 sm:pt-8 relative overflow-hidden">
      {/* Subtle radial warmth behind the concierge header */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-[#F0A63B]/10 via-[#FAF7F2]/40 to-transparent blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* AI Concierge Header */}
        <div className="bg-white rounded-3xl border border-[#E5DFD5] border-t-2 border-t-[#F0A63B] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-ink tracking-tight">
                LOKIVA Concierge
              </h1>
              <p className="text-xs sm:text-sm text-dusk-600 font-sans max-w-xl leading-relaxed">
                Ask me anything about travel, culture, food, and experiences across India. Use the microphone or type freely.
              </p>
            </div>

            {/* Right side: expense total + fresh chat */}
            <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
              {/* Today's expense total */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#FAF7F2] border border-[#E5DFD5] rounded-2xl shadow-xs">
                <IndianRupee className="w-3.5 h-3.5 text-[#C1443B] flex-shrink-0" />
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-dusk-600">
                    Today's Spend
                  </div>
                  <div className="text-sm font-mono font-black text-ink">
                    {isTotalLoading ? (
                      <span className="animate-pulse text-dusk">...</span>
                    ) : (
                      <>&#x20B9;{todayTotal.toLocaleString('en-IN')}</>
                    )}
                  </div>
                </div>
              </div>

              {/* Start fresh chat */}
              {isAuthenticated && messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleStartFreshChat}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-ink/40 text-ink rounded-2xl text-xs font-heading font-bold transition shadow-xs cursor-pointer"
                  title="Clear conversation and start fresh"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C1443B]" />
                  <span>Start Fresh Chat</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Auth Loading State */}
        {authLoading && (
          <div className="bg-white rounded-3xl border border-[#E5DFD5] p-8 shadow-xs text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#C1443B] animate-spin mx-auto" />
            <p className="text-xs font-mono text-dusk-600">Checking authentication...</p>
          </div>
        )}

        {/* Conversation Stream */}
        {!authLoading && (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLatestReply = !isUser && index === messages.length - 1 && messages.length > 1;
                const isSpeakingThis = ttsActiveMessageId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    ref={isLatestReply ? latestReplyRef : undefined}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex gap-3.5 sm:gap-4 scroll-mt-24 sm:scroll-mt-28 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5DFD5] text-[#F0A63B] flex items-center justify-center flex-shrink-0 shadow-xs mt-1 ring-4 ring-[#FAF7F2]">
                        <Sparkles className="w-5 h-5 fill-[#F0A63B]/20 text-[#F0A63B]" />
                      </div>
                    )}

                    {/* Message Body */}
                    <div className={`space-y-3 max-w-3xl ${isUser ? 'w-auto' : 'w-full'}`}>
                      <div
                        className={`p-5 sm:p-6 shadow-xs border leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-br from-[#FAF5EE] to-[#F3EAE0] text-[#12213B] border-[#E8DDD2] rounded-3xl rounded-tr-xs font-sans text-xs sm:text-sm'
                            : 'bg-white text-[#12213B] border-[#E5DFD5] border-t-2 border-t-[#F0A63B] rounded-3xl rounded-tl-xs space-y-4 font-sans text-xs sm:text-sm shadow-sm'
                        }`}
                      >
                        {/* Header info row with speaker icon for assistant */}
                        <div
                          className={`flex items-center justify-between gap-4 text-[10px] font-mono pb-2 border-b ${
                            isUser ? 'text-[#8F6343] border-[#E8DDD2]' : 'text-dusk-600 border-[#E5DFD5]'
                          }`}
                        >
                          <span className={`font-bold tracking-wide ${isUser ? 'text-[#C1443B]' : 'text-ink'}`}>
                            {isUser ? 'You (Traveler)' : 'LOKIVA Concierge'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={isUser ? 'text-[#8F6343]' : ''}>{msg.timestamp}</span>
                            {/* Speaker icon: only on assistant messages, only if TTS supported */}
                            {!isUser && voiceSupported && (
                              <button
                                type="button"
                                onClick={() => {
                                  unlockAudio();
                                  handleSpeak(
                                    msg.id,
                                    msg.spokenText || msg.content.replace(/[*#_`~]/g, '')
                                  );
                                }}
                                title={isSpeakingThis ? 'Stop speaking' : 'Listen to voice'}
                                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                  isSpeakingThis
                                    ? 'text-[#C1443B] bg-[#C1443B]/10 font-bold animate-pulse'
                                    : 'text-dusk hover:text-ink hover:bg-[#FAF7F2]'
                                } opacity-100`}
                              >
                                {isSpeakingThis ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5 text-[#C1443B]" />
                                    <span className="text-[10px] font-mono text-[#C1443B]">Stop Voice</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-mono">Listen</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Text content with bold & markdown rendering */}
                        <FormattedMessageContent content={msg.content} isUser={isUser} />

                        {/* Weather data card - distinct inset panel */}
                        {msg.weatherData && (
                          <motion.div
                            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22, delay: 0.12 }}
                            className="mt-2 p-4 sm:p-5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF7F2] rounded-2xl border border-[#E8DFC8] shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                                <CloudSun className="w-4 h-4 text-[#C1443B]" />
                                <span>{msg.weatherData.location_name}</span>
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                  msg.weatherData.is_live
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {msg.weatherData.is_live ? 'Live Sensor' : 'Estimated'}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-3">
                              <span className="text-2xl sm:text-3xl font-mono font-black text-ink">
                                {msg.weatherData.temp_c}&deg;C
                              </span>
                              <span className="text-xs font-sans font-medium capitalize text-dusk-600">
                                {msg.weatherData.condition}
                              </span>
                            </div>
                            {msg.weatherData.will_rain_soon && (
                              <div className="text-[11px] font-sans font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                <span>Rain forecast soon: consider carrying an umbrella or visiting indoor heritage spots.</span>
                              </div>
                            )}
                            {msg.weatherData.humidity !== undefined && (
                              <div className="text-[10px] font-mono text-dusk-600 pt-1 border-t border-[#E8DFC8]/60 flex items-center justify-between">
                                <span>Relative Humidity</span>
                                <span className="font-bold text-ink">{msg.weatherData.humidity}%</span>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Nearby experience card - distinct inset panel */}
                        {msg.experienceData && (
                          <motion.div
                            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22, delay: 0.12 }}
                            className="mt-2 p-4 sm:p-5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF7F2] rounded-2xl border border-[#E5DFD5] shadow-xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                                Nearby Match
                              </span>
                              {msg.experienceData.crowd_tag && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-paper-100 text-ink border border-paper-300 capitalize">
                                  {msg.experienceData.crowd_tag} crowd
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm sm:text-base font-heading font-bold text-ink leading-snug">
                              {msg.experienceData.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-dusk-600 pt-1">
                              <span className="flex items-center gap-1 text-[#C1443B] font-bold">
                                <Navigation className="w-3.5 h-3.5" />
                                <span>{msg.experienceData.distance_meters}m walk</span>
                              </span>
                              <span className="font-bold text-ink">
                                {msg.experienceData.price_inr > 0 ? `\u20B9${msg.experienceData.price_inr}` : 'Free entry'}
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Expense recorded chip - inset ledger */}
                        {msg.expenseData && msg.expenseData.added_amount !== undefined && (
                          <motion.div
                            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22, delay: 0.12 }}
                            className="mt-2 p-3.5 bg-gradient-to-br from-[#F6FBF8] to-[#FAF7F2] rounded-2xl border border-emerald-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <div className="text-xs font-mono font-bold text-ink">
                                  Recorded +&#x20B9;{msg.expenseData.added_amount}
                                  {msg.expenseData.category ? ` (${msg.expenseData.category})` : ''}
                                </div>
                                {msg.expenseData.today_total_inr !== undefined && (
                                  <div className="text-[10px] font-mono text-dusk-600">
                                    Today's total spend: &#x20B9;{msg.expenseData.today_total_inr.toLocaleString('en-IN')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Expense summary display */}
                        {msg.expenseData &&
                          msg.expenseData.added_amount === undefined &&
                          msg.expenseData.total_inr !== undefined && (
                            <motion.div
                              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.22, delay: 0.12 }}
                              className="mt-2 p-4 bg-gradient-to-br from-[#FFFDF9] to-[#FAF7F2] rounded-2xl border border-[#E5DFD5] shadow-xs space-y-1.5"
                            >
                              <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                                Expense Summary
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-mono font-black text-ink">
                                  &#x20B9;{msg.expenseData.total_inr.toLocaleString('en-IN')}
                                </span>
                                <span className="text-xs font-mono text-dusk-600">
                                  ({msg.expenseData.period || 'today'})
                                </span>
                              </div>
                              {msg.expenseData.count !== undefined && (
                                <div className="text-[10px] font-mono text-dusk-600">
                                  {msg.expenseData.count} item{msg.expenseData.count !== 1 ? 's' : ''} logged in active session
                                </div>
                              )}
                            </motion.div>
                          )}

                        {/* AI Recommended Experiences (cultural concierge results) */}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="bg-white rounded-3xl border border-[#E5DFD5] p-5 sm:p-6 shadow-xs space-y-4">
                            <div className="pb-3 border-b border-[#E5DFD5] text-xs font-mono">
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
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C1443B] to-[#D95F56] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1 ring-4 ring-[#FAF7F2]">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Auth Gate Card */}
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
                    Please log in or create an account to converse with your AI Cultural Concierge. Your travel chats, tips, and personalized recommendations will be securely preserved across visits.
                  </p>
                </div>
                <div className="space-y-3 pt-2">
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

            {/* Brand-Reinforcing Animated Concierge Thinking Indicator */}
            {isLoading && (
              <motion.div
                ref={loadingRef}
                id="concierge-loading"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3.5 sm:gap-4 max-w-xl scroll-mt-24 sm:scroll-mt-28"
              >
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5DFD5] text-[#F0A63B] flex items-center justify-center shadow-xs flex-shrink-0 ring-4 ring-[#FAF7F2]">
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5 fill-[#F0A63B]/25 text-[#F0A63B]" />
                  </motion.div>
                </div>
                <div className="p-4 sm:p-5 bg-white border border-[#E5DFD5] border-t-2 border-t-[#F0A63B] rounded-3xl rounded-tl-xs shadow-xs space-y-2.5 flex-1">
                  <div className="flex items-center gap-2 text-ink font-heading font-bold text-xs">
                    <motion.span
                      animate={shouldReduceMotion ? undefined : { scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      className="w-2 h-2 rounded-full bg-[#C1443B]"
                    />
                    <span>
                      {voiceSpeakingState
                        ? 'Speaking response...'
                        : 'Curating authentic experiences for you...'}
                    </span>
                  </div>
                  <p className="text-[11px] text-dusk-600 font-sans leading-relaxed">
                    Consulting cultural context, live timings, and local availability across India.
                  </p>
                  <div className="w-full bg-[#FAF7F2] border border-[#E5DFD5] h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      animate={shouldReduceMotion ? undefined : { x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                      className="bg-gradient-to-r from-transparent via-[#F0A63B] to-transparent h-full w-2/3 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} className="h-4" />
          </div>
        )}

        {/* Fixed Input Bar */}
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
                {/* Active Destination selector row */}
                {!currentCity ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none [-webkit-overflow-scrolling:touch] text-xs">
                    <span className="text-dusk-600 font-mono text-[10px] uppercase tracking-wider flex-shrink-0 font-bold">
                      Destination:
                    </span>
                    {['Jaipur', 'Varanasi', 'Goa', 'Mumbai', 'Delhi', 'Kochi', 'Udaipur'].map((city) => (
                      <motion.button
                        key={city}
                        type="button"
                        whileHover={shouldReduceMotion ? undefined : { y: -1.5, scale: 1.02 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => {
                          unlockAudio();
                          setCurrentCity(city);
                          handleSend(`I want to explore ${city}. What authentic experiences do you recommend?`, false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#F0A63B] rounded-full text-xs font-heading font-medium text-ink transition flex-shrink-0 shadow-xs cursor-pointer"
                      >
                        <span className="w-4 h-4 rounded-full bg-teal-50 text-teal flex items-center justify-center text-[10px]">
                          <MapPin className="w-2.5 h-2.5" />
                        </span>
                        <span>{city}</span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono px-1">
                      <span className="flex items-center gap-1.5 text-teal font-bold">
                        <MapPin className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                        <span>
                          Active Destination: <strong>{currentCity}</strong>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentCity(null)}
                        className="hover:underline text-[11px] text-[#C1443B] font-heading font-bold cursor-pointer"
                      >
                        Change destination
                      </button>
                    </div>
                    {/* Interest chips for active city */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full scrollbar-none [-webkit-overflow-scrolling:touch] text-xs">
                      <span className="text-dusk-600 font-mono text-[10px] uppercase tracking-wider flex-shrink-0 font-bold">
                        Interests:
                      </span>
                      {INTEREST_OPTIONS.map((item, i) => (
                        <motion.button
                          key={i}
                          type="button"
                          whileHover={shouldReduceMotion ? undefined : { y: -1.5, scale: 1.02 }}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => {
                            unlockAudio();
                            handleSend(`Show me ${item.interest} in ${currentCity}`, false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#F0A63B] rounded-full text-xs font-heading font-medium text-ink transition flex-shrink-0 shadow-xs cursor-pointer"
                        >
                          <span className="w-4 h-4 rounded-full bg-paper-100 flex items-center justify-center text-[11px]">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestion chips - horizontally scrollable from central config */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [-webkit-overflow-scrolling:touch]">
                  <span className="text-dusk-600 font-mono text-[10px] uppercase tracking-wider flex-shrink-0 font-bold hidden sm:block">
                    Try:
                  </span>
                  {VOICE_SUGGESTIONS.map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={shouldReduceMotion ? undefined : { y: -1.5, scale: 1.02 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        unlockAudio();
                        handleSend(suggestion.query, false);
                      }}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#C1443B]/60 rounded-full text-xs font-heading font-medium text-ink transition flex-shrink-0 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion.icon && (
                        <span className="w-4 h-4 rounded-full bg-paper-100 flex items-center justify-center text-[11px]">
                          {suggestion.icon}
                        </span>
                      )}
                      <span>{suggestion.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Signature Voice Capture Panel docked right above input bar */}
                <AnimatePresence>
                  {(isListening || isTranscribing) && (
                    <div id="live-voice-bubble" className="w-full">
                      <VoiceRecordingSheet
                        elapsedTime={
                          recordingDuration
                            ? `${String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:${String(recordingDuration % 60).padStart(2, '0')}`
                            : '00:00'
                        }
                        interimTranscript={interimTranscript}
                        isTranscribing={isTranscribing}
                        onCancel={cancelListening}
                        onSubmit={submitListening}
                      />
                    </div>
                  )}
                </AnimatePresence>

                {/* Text input form with mic button */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    unlockAudio();
                    if (isListening) {
                      submitListening();
                    } else {
                      const textToSubmit = inputMessage.trim() || interimTranscript.trim();
                      if (textToSubmit) {
                        handleSend(textToSubmit, false);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 bg-white border border-[#E5DFD5] rounded-2xl p-1.5 sm:p-2 shadow-lg"
                >
                  {/* Mic button */}
                  {voiceSupported && (
                    <button
                      type="button"
                      disabled={isTranscribing}
                      onClick={() => {
                        unlockAudio();
                        if (isListening) {
                          submitListening();
                        } else {
                          startListening();
                        }
                      }}
                      title={isListening ? 'Send voice' : 'Start voice input'}
                      className={`p-2.5 rounded-xl transition-all flex-shrink-0 cursor-pointer ${
                        isListening
                          ? 'bg-[#C1443B] text-white animate-pulse shadow-md ring-2 ring-[#C1443B]/30'
                          : isTranscribing
                          ? 'bg-[#FAF7F2] text-dusk-400 border border-[#E5DFD5] cursor-not-allowed opacity-60'
                          : 'bg-[#FAF7F2] hover:bg-paper-200 text-ink border border-[#E5DFD5]'
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : isTranscribing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#C1443B]" />
                      ) : (
                        <Mic className="w-4 h-4 text-[#C1443B]" />
                      )}
                    </button>
                  )}

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputDisplayValue}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isListening
                        ? (interimTranscript || inputMessage ? '' : 'Listening... Speak now')
                        : isTranscribing
                        ? 'Translating audio...'
                        : !currentCity
                        ? 'Where in India are you heading? (e.g., Jaipur, Varanasi, Goa...)'
                        : `Ask about ${currentCity}: weather, experiences, expenses...`
                    }
                    className={`flex-1 min-w-0 bg-transparent px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none placeholder-dusk font-sans ${
                      isListening || isTranscribing ? 'font-medium text-[#C1443B]' : ''
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || isTranscribing || (!inputMessage.trim() && !interimTranscript.trim() && !isListening)}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#12213B] hover:bg-[#1D2E49] text-white rounded-xl text-xs font-heading font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs flex-shrink-0 cursor-pointer"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F0A63B]" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <span>{isListening ? 'Send' : 'Solve'}</span>
                        <Send className="w-3.5 h-3.5 text-[#F0A63B]" />
                      </>
                    )}
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
