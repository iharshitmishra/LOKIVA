/**
 * LOKIVA TTS Engine: Indian English Voice Resolver & Loader
 * Single source of truth for browser speech synthesis across all platforms.
 * Prioritizes neural/online Natural voices over legacy robotic desktop SAPI5 voices.
 */

// Known natural Indian English voice names across platforms
const KNOWN_NATURAL_INDIAN_NAMES = [
  'Microsoft Neerja Online (Natural)',
  'Microsoft Ravi Online (Natural)',
  'Microsoft Prabhat Online (Natural)',
  'Neerja (Natural)',
  'Ravi (Natural)',
  'Prabhat (Natural)',
];

// Known legacy Indian English voice names across platforms
const KNOWN_LEGACY_INDIAN_NAMES = [
  'Microsoft Neerja',
  'Microsoft Heera',
  'Microsoft Ravi',
  'Veena', // macOS/iOS female
  'Rishi', // macOS/iOS male
  'Google हिन्दी', // Android Chrome
];

/**
 * Extracts a concise display name from raw voice name strings.
 */
export function extractCleanVoiceName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s*Online\s*\(Natural\)/i, '')
    .replace(/\s*\(Natural\)/i, '')
    .replace(/\s*-\s*English.*$/i, '')
    .trim();
}

/**
 * Step 2: Voice Resolver (Natural prioritized over legacy)
 * Resolves the preferred Indian English voice with strict priority ordering:
 * 1. Natural / neural Indian voice (highest quality, genuine accent)
 * 2. Explicitly named natural Indian voice by known name
 * 3. Exact en-IN locale non-natural legacy fallback (warns in console)
 * 4. Known legacy Indian names across OS engines
 * 5. Catch-all for any voice containing India / Indian
 * 6. Returns null if none available (caller falls back to browser default)
 */
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return null;
  }

  // Priority 1: Natural / neural Indian voice (best quality, authentic accent)
  let match = voices.find(
    (v) =>
      (v.lang === 'en-IN' || v.lang === 'en_IN') &&
      /natural|online|neural/i.test(v.name)
  );
  if (match) return match;

  // Priority 2: Any explicitly named natural Indian voice by known name
  for (const name of KNOWN_NATURAL_INDIAN_NAMES) {
    match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  // Also match any voice that mentions both natural/online and India/Indian
  match = voices.find(
    (v) =>
      /natural|online|neural/i.test(v.name) &&
      (v.name.includes('India') ||
        v.name.includes('Indian') ||
        v.lang === 'en-IN' ||
        v.lang === 'en_IN')
  );
  if (match) return match;

  // Priority 3: Exact en-IN locale, non-natural fallback (legacy)
  match = voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN');
  if (match) {
    console.warn(
      '[TTS] Only legacy Indian voice found, no Natural voice available:',
      match.name
    );
    return match;
  }

  // Priority 4: Known legacy Indian names
  for (const name of KNOWN_LEGACY_INDIAN_NAMES) {
    match = voices.find((v) => v.name.includes(name));
    if (match) {
      console.warn(
        '[TTS] Only legacy Indian voice found, no Natural voice available:',
        match.name
      );
      return match;
    }
  }

  // Priority 5: Loose catch-all for any voice starting with en and mentioning India
  match = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('India') || v.name.includes('Indian'))
  );
  if (match) {
    console.warn(
      '[TTS] Only legacy Indian voice found, no Natural voice available:',
      match.name
    );
    return match;
  }

  // No Indian voice available on this machine: return null and let caller
  // fall back to default voice without throwing.
  return null;
}

/**
 * Async Voice Loading helper
 * Guarantees voices are fully populated before the first TTS call is attempted.
 */
export function loadVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      return resolve(existing);
    }

    let isResolved = false;
    const onVoicesLoaded = () => {
      if (!isResolved) {
        isResolved = true;
        const loaded = window.speechSynthesis.getVoices();
        resolve(loaded);
      }
    };

    window.speechSynthesis.onvoiceschanged = onVoicesLoaded;

    // Safety timeout in case onvoiceschanged does not fire in unsupported environments
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        resolve(window.speechSynthesis.getVoices());
      }
    }, 1200);
  });
}

let hasLoggedStartupDiagnostics = false;

/**
 * Step 1: Full Diagnostic Dump & Startup Logger
 * Prints every property of every available voice so we can see
 * local legacy vs. natural/online voices.
 */
export async function initializeTTS(): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = await loadVoicesAsync();
  const selectedVoice = getPreferredVoice();

  if (!hasLoggedStartupDiagnostics) {
    hasLoggedStartupDiagnostics = true;

    console.log('[TTS] Full voice list:');
    voices.forEach((v) => {
      console.log({
        name: v.name,
        lang: v.lang,
        localService: v.localService, // false usually indicates network / natural voice
        default: v.default,
      });
    });

    console.log(
      '[TTS] Selected voice:',
      selectedVoice?.name ?? 'none found (using browser default)'
    );
  }

  return selectedVoice;
}

export type TTSEngineType = 'elevenlabs' | 'browser_fallback' | 'browser_natural';

export interface VoiceStatusInfo {
  name: string;
  isIndianAccent: boolean;
  isNaturalQuality: boolean;
  rawVoiceName?: string;
  cleanName?: string;
  engine?: TTSEngineType;
}

let cachedHostedConfigured: boolean | null = null;

/**
 * Checks whether hosted ElevenLabs TTS is configured on the backend.
 */
export async function checkHostedTTSConfigured(): Promise<boolean> {
  try {
    let res = await fetch('/voice/synthesize/status');
    if (!res.ok) {
      res = await fetch('http://localhost:4000/voice/synthesize/status');
    }
    if (res.ok) {
      const data = await res.json();
      cachedHostedConfigured = Boolean(data.configured);
      return cachedHostedConfigured;
    }
  } catch {
    try {
      const directRes = await fetch('http://localhost:4000/voice/synthesize/status');
      if (directRes.ok) {
        const data = await directRes.json();
        cachedHostedConfigured = Boolean(data.configured);
        return cachedHostedConfigured;
      }
    } catch {}
    cachedHostedConfigured = false;
  }
  return false;
}

/**
 * Step 4: User-facing Voice Quality Status Label
 * Surfaces ElevenLabs neural voice or browser fallback status.
 */
export function getVoiceStatusLabel(engineOverride?: TTSEngineType | null): VoiceStatusInfo {
  const isElevenLabs =
    engineOverride === 'elevenlabs' ||
    (engineOverride === undefined && cachedHostedConfigured === true);

  if (isElevenLabs) {
    return {
      name: 'Priya (ElevenLabs, Indian English)',
      isIndianAccent: true,
      isNaturalQuality: true,
      engine: 'elevenlabs',
      cleanName: 'Priya',
    };
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      name: 'TTS not supported in this browser',
      isIndianAccent: false,
      isNaturalQuality: false,
      engine: 'browser_fallback',
    };
  }

  const preferred = getPreferredVoice();
  if (preferred) {
    const isNatural = /natural|online|neural/i.test(preferred.name);
    const cleanName = extractCleanVoiceName(preferred.name) || preferred.name;

    if (engineOverride === 'browser_fallback' || !isNatural) {
      return {
        name: `${cleanName} (Fallback: offline mode)`,
        isIndianAccent: true,
        isNaturalQuality: false,
        engine: 'browser_fallback',
        rawVoiceName: preferred.name,
        cleanName,
      };
    }

    return {
      name: `${cleanName} (Natural, Indian English)`,
      isIndianAccent: true,
      isNaturalQuality: true,
      engine: 'browser_natural',
      rawVoiceName: preferred.name,
      cleanName,
    };
  }

  const allVoices = window.speechSynthesis.getVoices();
  const defaultVoice = allVoices.find((v) => v.default) || allVoices[0];
  if (defaultVoice) {
    const cleanName = extractCleanVoiceName(defaultVoice.name) || defaultVoice.name;
    return {
      name: `${cleanName} (Fallback: offline mode)`,
      isIndianAccent: false,
      isNaturalQuality: false,
      engine: 'browser_fallback',
      rawVoiceName: defaultVoice.name,
      cleanName,
    };
  }

  return {
    name: 'Default (Fallback: offline mode)',
    isIndianAccent: false,
    isNaturalQuality: false,
    engine: 'browser_fallback',
  };
}

let sharedAudioContext: AudioContext | null = null;

/**
 * Returns or initializes the shared AudioContext.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        sharedAudioContext = new AudioContextClass();
      } catch (e) {
        console.warn('[TTS] AudioContext init error:', e);
      }
    }
  }
  return sharedAudioContext;
}

/**
 * Unlocks audio playback on user interaction (clicks, mic taps, form submits).
 * Guarantees that future asynchronous audio playback is not blocked by browser autoplay policy.
 */
export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  } catch (e) {
    console.warn('[TTS] unlockAudio error:', e);
  }
}

export interface PlaybackController {
  stop: () => void;
}

export interface SpeakOptions {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onEngineUsed?: (engine: TTSEngineType) => void;
}

/**
 * Strips markdown symbols, emojis, and unwanted punctuation for clean conversational TTS.
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // strip emojis
    .replace(/[\u2014\u2015]/g, ', ') // replace em dashes
    .replace(/[\u2013]/g, '-') // replace en dashes
    .replace(/--+/g, '-') // ban double dashes
    .replace(/[*#_`~]/g, '') // remove markdown symbols
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Primary speech execution pipeline:
 * 1. ElevenLabs hosted TTS via /voice/synthesize
 *    - Plays via Web Audio API (AudioContext) for zero-latency, autoplay-immune playback
 *    - Falls back to HTMLAudioElement
 * 2. Automatic fallback to browser speechSynthesis on any failure or timeout
 * 3. Never produces silence.
 */
export function speakWithElevenLabsOrFallback(options: SpeakOptions): PlaybackController {
  const { text, onStart, onEnd, onError, onEngineUsed } = options;
  let isCancelled = false;
  let currentAudio: HTMLAudioElement | null = null;
  let currentAudioSource: AudioBufferSourceNode | null = null;
  const abortController = new AbortController();

  // Unlock audio state on playback call
  unlockAudio();

  // Latency handling: notify UI immediately to show active speaking state
  onStart?.();

  // Clean text and handle empty case
  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) {
    onEnd?.();
    return { stop: () => {} };
  }

  // Reliable Fallback to browser speechSynthesis
  const fallbackToBrowser = () => {
    if (isCancelled) return;
    onEngineUsed?.('browser_fallback');

    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onEnd?.();
        return;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.resume(); // Essential fix for Chrome speech freeze
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.pitch = 1.05;
      utterance.rate = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (!isCancelled) {
          onEnd?.();
        }
      };

      utterance.onerror = (e) => {
        if (!isCancelled) {
          console.warn('[TTS] SpeechSynthesis error:', e);
          onError?.(e);
          onEnd?.();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[TTS] Browser fallback failed:', err);
      onError?.(err);
      onEnd?.();
    }
  };

  // If hosted TTS is explicitly known to be unconfigured, immediately use browser speech
  if (cachedHostedConfigured === false) {
    fallbackToBrowser();
    return {
      stop: () => {
        isCancelled = true;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      },
    };
  }

  // Attempt ElevenLabs hosted synthesis
  (async () => {
    try {
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 15000);

      let response: Response | null = null;
      try {
        response = await fetch('/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText }),
          signal: abortController.signal,
        });
      } catch (proxyErr) {
        if (isCancelled) return;
        console.warn('[TTS] Proxy /voice/synthesize failed, trying direct backend port 4000');
      }

      // If proxy failed, timed out, or returned 500/502/504, attempt direct backend call to port 4000
      if (!response || !response.ok) {
        try {
          const directResponse = await fetch('http://localhost:4000/voice/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleanText }),
            signal: abortController.signal,
          });
          if (directResponse.ok) {
            response = directResponse;
          }
        } catch (directErr) {
          console.warn('[TTS] Direct port 4000 synthesize error:', directErr);
        }
      }

      clearTimeout(timeoutId);

      if (isCancelled) return;

      if (!response || !response.ok) {
        throw new Error(`HTTP ${response ? response.status : 'Network Error'}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (isCancelled) return;

      // Method 1: Web Audio API (immune to autoplay timeout blocks)
      const ctx = getAudioContext();
      if (ctx) {
        try {
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          // decodeAudioData consumes the buffer, so clone a slice
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          if (isCancelled) return;

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          currentAudioSource = source;

          source.onended = () => {
            currentAudioSource = null;
            if (!isCancelled) {
              onEnd?.();
            }
          };

          source.start(0);
          onEngineUsed?.('elevenlabs');
          console.log('[TTS] Played via ElevenLabs WebAudio API (Indian accent)');
          return;
        } catch (decodeErr) {
          console.warn('[TTS] WebAudio decode failed, falling back to HTMLAudio:', decodeErr);
        }
      }

      // Method 2: HTMLAudioElement fallback
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        if (!isCancelled) {
          onEnd?.();
        }
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        console.warn('[TTS] Audio element error, falling back to browser voice:', e);
        fallbackToBrowser();
      };

      await audio.play();
      onEngineUsed?.('elevenlabs');
      console.log('[TTS] Played via ElevenLabs HTMLAudio (Indian accent)');
    } catch (err) {
      if (isCancelled) return;
      console.warn('[TTS] ElevenLabs failed, falling back to browser voice:', err);
      fallbackToBrowser();
    }
  })();

  return {
    stop: () => {
      isCancelled = true;
      abortController.abort();
      if (currentAudioSource) {
        try {
          currentAudioSource.stop();
        } catch {}
        currentAudioSource = null;
      }
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
  };
}
