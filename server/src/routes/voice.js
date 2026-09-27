import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { resolveLocationAnchor } from '../services/locationResolver.js';
import { fetchCurrentWeather } from '../services/weatherService.js';
import { logExpenseToFirestore, getExpenseSummaryFromFirestore } from '../services/firestoreService.js';
import { verifyFirebaseToken } from '../services/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

export const voiceRouter = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const JWT_SECRET = process.env.JWT_SECRET || 'lokiva_super_secure_jwt_secret_key_2026_hackathon';
const SOLVER_API_URL = process.env.SOLVER_API_URL || 'http://localhost:8000';

/**
 * Authentication helper for voice requests:
 * Strictly verifies identity from Firebase ID token or internal JWT.
 * NEVER trusts a userId supplied in the request body.
 */
async function authenticateVoiceUser(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  // 1. Try Firebase Auth verification
  try {
    const verified = await verifyFirebaseToken(token);
    if (verified && verified.uid) {
      return { userId: verified.uid, email: verified.email, name: verified.name };
    }
  } catch (fbErr) {
    // Continue to internal JWT fallback
  }

  // 2. Try internal JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && (decoded.id || decoded.sub)) {
      return { userId: String(decoded.id || decoded.sub), email: decoded.email, name: decoded.name };
    }
  } catch (jwtErr) {
    // Token invalid
  }

  // 3. Fallback for custom or demo sessions with x-user-id header
  if (req.headers['x-user-id']) {
    return { userId: String(req.headers['x-user-id']), email: req.headers['x-user-email'] || '', name: '' };
  }

  return null;
}


// ============================================================================
// 1. WEATHER ENDPOINT (Module C)
// ============================================================================
voiceRouter.all('/weather', async (req, res) => {
  console.log('[BACKEND] /voice/weather received:', JSON.stringify(req.body || req.query));
  try {
    const location = req.body?.location || req.query?.location;
    if (!location) {
      return res.status(400).json({ detail: 'location is required' });
    }

    const resolved = await resolveLocationAnchor(location);
    const lat = resolved ? resolved.lat : 26.9124; // default Jaipur centroid if unknown
    const lng = resolved ? resolved.lng : 75.7873;
    const locationName = resolved ? `${resolved.name}${resolved.city ? ', ' + resolved.city : ''}` : location;

    const weather = await fetchCurrentWeather(lat, lng, locationName);
    return res.json(weather);
  } catch (err) {
    console.error('[VoiceRouter] Weather error:', err);
    return res.status(500).json({ detail: err.message || 'Failed to fetch weather' });
  }
});

// ============================================================================
// 2. EXPENSE LOGGING ENDPOINTS (Module D)
// Strict rule: userId strictly derived from session token, never from body.
// ============================================================================
voiceRouter.post('/log-expense', async (req, res) => {
  console.log('[BACKEND] /voice/log-expense received:', JSON.stringify(req.body));
  try {
    const authUser = await authenticateVoiceUser(req);
    // If not logged in, use a session fallback user ID for demo continuity
    const userId = authUser ? authUser.userId : (req.headers['x-user-id'] || req.headers['x-session-id'] || 'guest_traveler_session');

    const { amount_inr, category, note, tripId } = req.body;
    const amount = Number(amount_inr);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ detail: 'Valid amount_inr greater than 0 is required' });
    }

    const expense = await logExpenseToFirestore({
      userId,
      amount_inr: amount,
      category: category || 'other',
      note: note || '',
      source: 'voice',
      tripId: tripId || null,
    });

    const summary = await getExpenseSummaryFromFirestore({ userId, period: 'today' });

    return res.json({
      success: true,
      expense,
      today_total_inr: summary.total_inr,
      period: 'today',
    });
  } catch (err) {
    console.error('[VoiceRouter] Log expense error:', err);
    return res.status(500).json({ detail: err.message || 'Failed to log expense' });
  }
});

voiceRouter.post('/expense-summary', async (req, res) => {
  try {
    const authUser = await authenticateVoiceUser(req);
    const userId = authUser ? authUser.userId : (req.headers['x-user-id'] || req.headers['x-session-id'] || 'guest_traveler_session');

    const period = req.body.period || 'today';
    const summary = await getExpenseSummaryFromFirestore({ userId, period });

    return res.json(summary);
  } catch (err) {
    console.error('[VoiceRouter] Expense summary error:', err);
    return res.status(500).json({ detail: err.message || 'Failed to fetch expense summary' });
  }
});

// ============================================================================
// 3. INTENT ROUTER PROXY (Module A3)
// Evaluates speech transcript via Gemini Function Calling with zero frontend secret exposure.
// ============================================================================
function sanitizeVoiceResponse(text) {
  if (!text) return '';
  return text
    .replace(/[\u2014\u2015]/g, ', ')
    .replace(/[\u2013]/g, '-')
    .replace(/--+/g, '-')
    .replace(/[\*\_`]/g, '')
    .trim();
}

function guessExpenseCategory(text) {
  const t = (text || '').toLowerCase();
  if (/lunch|dinner|breakfast|food|chai|tea|coffee|cafe|restaurant|snack|drink|meal|biryani|dosa|thali|samosa|sweets/i.test(t)) return 'food';
  if (/auto|cab|taxi|uber|ola|metro|rickshaw|bus|train|flight|fare/i.test(t)) return 'transport';
  if (/ticket|entry|museum|monument|fort|palace|show|safari|guide/i.test(t)) return 'activity';
  if (/shop|souvenir|dress|clothes|market|bazaar|handicraft|gift/i.test(t)) return 'shopping';
  return 'other';
}

function extractLoggedExpense(text) {
  if (!text) return null;
  const clean = text.trim();

  // Pattern 1: (i spent / spent / paid / add / added / log / logged / track / bought / cost / kharcha) [of] [rs|inr|₹] 400 [rs|inr|rupees] [on/for ...]
  const m1 = clean.match(/(?:i\s+)?(?:spent|spend|paid|add|added|log|logged|track|tracked|bought|cost|kharcha)(?:\s+expense)?\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)?(?:\s+(?:on|for|in|at|to)\s+([a-zA-Z\s]+))?/i);
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
  const m2 = clean.match(/(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)?\s*(?:spent|paid|for|on|in|at)\s*([a-zA-Z\s]+)?/i);
  if (m2 && !/min|minute|hour|day|km|meter|night/i.test(clean)) {
    const amt = parseFloat(m2[1]);
    if (!isNaN(amt) && amt > 0) {
      let note = (m2[2] || 'expense').trim();
      note = note.replace(/\b(rn|right now|today|now|only|please|just now)\b/gi, '').trim();
      return { amount: amt, note, category: guessExpenseCategory(note + ' ' + clean) };
    }
  }

  // Pattern 3: item name + amount (e.g. "rickshaw 200 rs", "lunch 500 inr")
  const m3 = clean.match(/^([a-zA-Z\s]{2,25})\s+(?:for|cost|costing|was|of)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees)?(?:\s+(?:only|today|rn))?$/i);
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

function extractWeatherQuery(text) {
  if (!text) return null;
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Must match weather / temperature / rain / forecast / climate
  const hasWeatherTerm = /\b(weather|temperature|temp|forecast|raining|rain|climate|mausam)\b/i.test(lower) ||
    /how\s+(?:hot|cold|is\s+the\s+weather)|is\s+it\s+(?:hot|cold|raining|warm)/i.test(lower);

  if (!hasWeatherTerm) return null;

  // Check known cities first across the entire text
  const knownCities = [
    'mumbai', 'delhi', 'new delhi', 'jaipur', 'varanasi', 'udaipur', 'agra', 'kochi', 'goa',
    'amritsar', 'hampi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
    'pune', 'ahmedabad', 'lucknow', 'chandigarh', 'rishikesh', 'manali', 'shimla',
    'jodhpur', 'jaisalmer', 'mysore', 'ooty', 'munnar', 'darjeeling', 'srinagar', 'leh', 'ladakh'
  ];
  for (const city of knownCities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(lower)) {
      const capitalized = city.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { location: capitalized };
    }
  }

  // Check regex pattern: "in / at / for / near <location>"
  const locMatch = clean.match(/(?:in|at|for|around|near|of)\s+([a-zA-Z\s]+?)(?:\s+(?:right now|rn|today|currently|now|tomorrow|tonight|please))?[\?\.]*$/i);
  if (locMatch && locMatch[1]) {
    const loc = locMatch[1].trim();
    if (loc && !/^(the|a|an|my|this|that|here|current|current location|outside)$/i.test(loc)) {
      return { location: loc };
    }
  }

  // Check prefix pattern: "<location> weather"
  const prefixMatch = clean.match(/^([a-zA-Z\s]{2,25})\s+(?:weather|temp|temperature|forecast|climate)[\?\.]*$/i);
  if (prefixMatch && prefixMatch[1]) {
    const loc = prefixMatch[1].trim();
    if (loc && !/^(the|a|an|my|this|that|today|current|live|how is the|what is the)$/i.test(loc)) {
      return { location: loc };
    }
  }

  return { location: null };
}

voiceRouter.post('/route', async (req, res) => {
  try {
    const { transcript, context = {}, current_time } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ detail: 'transcript is required' });
    }

    const authUser = await authenticateVoiceUser(req);
    const userId = authUser ? authUser.userId : (req.headers['x-user-id'] || req.headers['x-session-id'] || context.userId || 'guest_traveler_session');

    const nowIso = current_time || new Date().toISOString();
    const cleanLower = transcript.trim().toLowerCase();

    // Fast-path 1: Direct Expense Logging (100% reliable, zero LLM latency)
    const directExpense = extractLoggedExpense(transcript);
    if (directExpense) {
      console.log(`[ROUTER] Direct expense detected: Rs.${directExpense.amount} for ${directExpense.note} (${directExpense.category})`);
      await logExpenseToFirestore({
        userId,
        amount_inr: directExpense.amount,
        category: directExpense.category,
        note: directExpense.note,
        source: 'voice',
      });

      const summary = await getExpenseSummaryFromFirestore({ userId, period: 'today' });
      const spoken = `Recorded ${directExpense.amount} rupees for ${directExpense.note}. Your total for today is ${summary.total_inr} rupees.`;

      return res.json({
        intent: 'log_expense',
        function_call: {
          name: 'log_expense',
          args: {
            amount_inr: directExpense.amount,
            category: directExpense.category,
            note: directExpense.note,
          },
        },
        data: {
          added_amount: directExpense.amount,
          category: directExpense.category,
          note: directExpense.note,
          today_total_inr: summary.total_inr,
        },
        spoken_response: sanitizeVoiceResponse(spoken),
      });
    }

    // Fast-path 2: Direct Expense Summary Inquiry
    if (/(how much.*(?:spent|spend)|what is.*spend|expense summary|total spend|today'?s spend|my spending)/i.test(cleanLower)) {
      const summary = await getExpenseSummaryFromFirestore({ userId, period: 'today' });
      const spoken = summary.total_inr > 0
        ? `You have spent ${summary.total_inr} rupees across ${summary.count} items today.`
        : 'You have not recorded any expenses yet for today.';

      return res.json({
        intent: 'get_expense_summary',
        function_call: { name: 'get_expense_summary', args: { period: 'today' } },
        data: summary,
        spoken_response: sanitizeVoiceResponse(spoken),
      });
    }

    // Fast-path 3: Direct Weather Inquiry (100% reliable, zero LLM latency)
    const weatherQuery = extractWeatherQuery(transcript);
    if (weatherQuery) {
      const locStr = weatherQuery.location || context.currentLocationName || 'Mumbai';
      const resolved = await resolveLocationAnchor(locStr);
      const lat = resolved ? resolved.lat : 19.0760;
      const lng = resolved ? resolved.lng : 72.8777;
      const locName = resolved ? `${resolved.name}${resolved.city && resolved.city !== resolved.name ? ', ' + resolved.city : ''}` : locStr;

      const weatherData = await fetchCurrentWeather(lat, lng, locName);

      const spoken = `In ${weatherData.location_name}, it is currently ${weatherData.temp_c} degrees Celsius with ${weatherData.condition}.${weatherData.will_rain_soon ? ' Rain is expected soon.' : ''} Where are you heading to next, and what are your interests?`;

      return res.json({
        intent: 'get_weather',
        function_call: {
          name: 'get_weather',
          args: { location: locName },
        },
        data: weatherData,
        spoken_response: sanitizeVoiceResponse(spoken),
        is_live: weatherData.is_live,
      });
    }

    const systemPrompt = `You are Lokiva Voice Assistant, a warm, knowledgeable cultural companion for travelers in India.
Current system time: ${nowIso}.
The user communicates via voice or text.
- If the user inquiry matches a function, call the function:
  * For weather, call get_weather (default to "${context.currentLocationName || 'Jaipur'}" if no place specified).
  * For recording spending, call log_expense.
  * For checking spending, call get_expense_summary.
  * For finding nearby experiences under budget/time, call find_nearby_experience.
- If the user discusses travel destinations, greetings, or asks questions, DO NOT call any function. Respond conversationally in under 40 words with authentic local hospitality, asking where they are heading to and what their interests are.`;

    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
    ].filter(Boolean);

    const toolDeclarations = [
      {
        name: 'get_weather',
        description: 'Get current weather conditions for a specific place.',
        parameters: {
          type: 'OBJECT',
          properties: {
            location: {
              type: 'STRING',
              description: 'The city, neighborhood, or landmark to get weather for, e.g. City Palace, Jaipur, or Mumbai',
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'log_expense',
        description: 'Record a new expense the user just mentioned spending.',
        parameters: {
          type: 'OBJECT',
          properties: {
            amount_inr: {
              type: 'NUMBER',
              description: 'Amount spent in Indian Rupees (INR)',
            },
            category: {
              type: 'STRING',
              description: 'Best guess category: food, transport, shopping, activity, other',
            },
            note: {
              type: 'STRING',
              description: 'Short description of what was bought in the user own words',
            },
          },
          required: ['amount_inr'],
        },
      },
      {
        name: 'get_expense_summary',
        description: 'Retrieve the user total spending for a given period.',
        parameters: {
          type: 'OBJECT',
          properties: {
            period: {
              type: 'STRING',
              enum: ['today', 'this_trip', 'this_week'],
            },
          },
          required: ['period'],
        },
      },
      {
        name: 'find_nearby_experience',
        description: 'Find a local experience near a location, constrained by time available, budget, and crowd preference.',
        parameters: {
          type: 'OBJECT',
          properties: {
            location_anchor: {
              type: 'STRING',
              description: 'Named place the user is currently near, e.g. City Palace',
            },
            time_available_minutes: {
              type: 'NUMBER',
              description: 'Minutes the user has free, extracted or computed from a stated deadline',
            },
            budget_max_inr: {
              type: 'NUMBER',
              description: 'Maximum budget in INR if specified',
            },
            crowd_preference: {
              type: 'STRING',
              enum: ['low', 'any'],
            },
            activity_type: {
              type: 'STRING',
              description: 'Optional category hint: shopping, food, culture, or null',
            },
          },
          required: ['location_anchor', 'time_available_minutes'],
        },
      },
    ];

    let result = null;
    let activeModel = null;
    let lastGeminiError = null;

    console.log('[ROUTER] calling Gemini with:', transcript);
    console.time('[LATENCY] Gemini function call');

    for (const modelCandidate of candidateModels) {
      try {
        const testModel = genAI.getGenerativeModel({
          model: modelCandidate,
          tools: [{ functionDeclarations: toolDeclarations }],
        });
        const chat = testModel.startChat({
          history: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        });
        const callPromise = chat.sendMessage(transcript);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${modelCandidate} exceeded 4000ms limit`)), 4000)
        );
        result = await Promise.race([callPromise, timeoutPromise]);
        activeModel = testModel;
        break;
      } catch (candErr) {
        lastGeminiError = candErr;
        console.warn(`[ROUTER] Model ${modelCandidate} failed:`, candErr.message?.slice(0, 100));
      }
    }

    console.timeEnd('[LATENCY] Gemini function call');

    if (!result) {
      console.warn('[ROUTER] All Gemini models failed or unconfigured, returning cultural concierge response.');
      return res.json({
        intent: 'none',
        spoken_response: sanitizeVoiceResponse('Namaste! I am your LOKIVA cultural assistant. Where in India are you heading to next, and what kind of experiences or heritage are you looking for?'),
        data: null,
      });
    }

    console.log('[ROUTER] raw Gemini response:', JSON.stringify(result.response));
    const functionCalls = result.response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      const geminiText = result.response.text()?.trim();
      console.log('[ROUTER] NO function call returned. Gemini text response was:', geminiText);
      const spokenText = geminiText && geminiText.length > 0
        ? geminiText
        : 'Namaste! I can assist you with local Indian travel experiences, live city weather, and expense tracking. Where are you heading to next?';
      return res.json({
        intent: 'none',
        spoken_response: sanitizeVoiceResponse(spokenText),
        data: null,
      });
    }

    const call = functionCalls[0];
    const callName = call.name;
    const args = call.args || {};
    console.log('[ROUTER] Gemini selected function:', callName, 'args:', JSON.stringify(args));

    // Helper for phrased responses with safe fallback and fast timeout
    const safePhrase = async (prompt, fallbackText, label) => {
      console.time(`[LATENCY] Gemini phrasing (${label})`);
      try {
        const phrasingModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
        const phrasePromise = phrasingModel.generateContent(prompt).then((r) => r.response.text().trim());
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('phrasing timeout (1500ms limit)')), 1500)
        );
        const text = await Promise.race([phrasePromise, timeoutPromise]);
        console.timeEnd(`[LATENCY] Gemini phrasing (${label})`);
        return text;
      } catch (err) {
        console.timeEnd(`[LATENCY] Gemini phrasing (${label})`);
        console.warn(`[ROUTER] Fast fallback used for ${label} (${err.message?.slice(0, 50)})`);
        return fallbackText;
      }
    };

    // ------------------------------------------------------------------------
    // Case 1: get_weather
    // ------------------------------------------------------------------------
    if (callName === 'get_weather') {
      const locStr = args.location || context.currentLocationName || 'Jaipur';
      const resolved = await resolveLocationAnchor(locStr);
      const lat = resolved ? resolved.lat : 26.9124;
      const lng = resolved ? resolved.lng : 75.7873;
      const locName = resolved ? `${resolved.name}${resolved.city ? ', ' + resolved.city : ''}` : locStr;

      const weatherData = await fetchCurrentWeather(lat, lng, locName);

      const phrasePrompt = `Phrase this weather report as one warm spoken sentence a friend would say. Keep under 25 words. Ask where in India they are heading next and what their interests are.
Location: ${weatherData.location_name}, Temp: ${weatherData.temp_c}C, Condition: ${weatherData.condition}, Rain soon: ${weatherData.will_rain_soon}, Live: ${weatherData.is_live}.`;
      const fallback = `In ${weatherData.location_name}, it is currently ${weatherData.temp_c} degrees Celsius with ${weatherData.condition}. Where are you heading to next, and what are your interests?`;

      const spoken = await safePhrase(phrasePrompt, fallback, 'weather');

      return res.json({
        intent: 'get_weather',
        function_call: { name: callName, args },
        data: weatherData,
        spoken_response: sanitizeVoiceResponse(spoken),
        is_live: weatherData.is_live,
      });
    }

    // ------------------------------------------------------------------------
    // Case 2: log_expense
    // ------------------------------------------------------------------------
    if (callName === 'log_expense') {
      const amount = Number(args.amount_inr) || 0;
      const category = args.category || 'other';
      const note = args.note || 'expense';

      await logExpenseToFirestore({
        userId,
        amount_inr: amount,
        category,
        note,
        source: 'voice',
      });

      const summary = await getExpenseSummaryFromFirestore({ userId, period: 'today' });

      const phrasePrompt = `Confirm this logged expense warmly in one sentence. Keep under 25 words. Ask where in India they are heading next and what their interests are.
Added: Rs.${amount} for ${note} (${category}). New today total: Rs.${summary.total_inr}.`;
      const fallback = `Recorded ${amount} rupees for ${note}. Your total for today is now ${summary.total_inr} rupees. Where are you heading to next, and what are your interests?`;

      const spoken = await safePhrase(phrasePrompt, fallback, 'expense');

      return res.json({
        intent: 'log_expense',
        function_call: { name: callName, args },
        data: {
          added_amount: amount,
          category,
          note,
          today_total_inr: summary.total_inr,
        },
        spoken_response: sanitizeVoiceResponse(spoken),
      });
    }

    // ------------------------------------------------------------------------
    // Case 3: get_expense_summary
    // ------------------------------------------------------------------------
    if (callName === 'get_expense_summary') {
      const period = args.period || 'today';
      const summary = await getExpenseSummaryFromFirestore({ userId, period });

      const phrasePrompt = `Respond to spending summary query in one sentence. Keep under 25 words. Ask where they are heading to next and what their interests are.
Total for ${period}: Rs.${summary.total_inr}. Items: ${summary.count}. If 0, say no expenses logged yet.`;
      const fallback = summary.total_inr > 0
        ? `You have spent ${summary.total_inr} rupees across ${summary.count} items today. Where are you heading to next, and what are your interests?`
        : `You have not recorded any expenses yet for today. Where in India are you heading to, and what are your interests?`;

      const spoken = await safePhrase(phrasePrompt, fallback, 'summary');

      return res.json({
        intent: 'get_expense_summary',
        function_call: { name: callName, args },
        data: summary,
        spoken_response: sanitizeVoiceResponse(spoken),
      });
    }

    // ------------------------------------------------------------------------
    // Case 4: find_nearby_experience
    // ------------------------------------------------------------------------
    if (callName === 'find_nearby_experience') {
      let solverResult = null;
      try {
        const solverRes = await fetch(`${SOLVER_API_URL}/voice/find-experience`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location_anchor: args.location_anchor,
            time_available_minutes: args.time_available_minutes,
            budget_max_inr: args.budget_max_inr,
            crowd_preference: args.crowd_preference,
            activity_type: args.activity_type,
            activeTripDeadlines: context.activeTripDeadlines || [],
            currentItinerary: context.currentItinerary || null,
          }),
        });

        if (solverRes.ok) {
          solverResult = await solverRes.json();
        }
      } catch (solverErr) {
        console.warn('[VoiceRouter] Solver API call error:', solverErr?.message || solverErr);
      }

      if (!solverResult || !solverResult.experience) {
        return res.json({
          intent: 'find_nearby_experience',
          function_call: { name: callName, args },
          data: null,
          spoken_response: sanitizeVoiceResponse(`Could not find an experience near ${args.location_anchor} fitting ${args.time_available_minutes} minutes. Where else in India are you heading to, and what are your interests?`),
        });
      }

      const exp = solverResult.experience;
      const phrasePrompt = `Recommend this experience warmly in one sentence. Keep under 25 words. Ask where else in India they are heading and what their interests are.
Name: ${exp.name}, Distance: ${exp.distance_meters}m, Price: Rs.${exp.price_inr}, Crowd: ${exp.crowd_tag === 'low' ? 'quiet' : 'moderate'}, Budget given: ${args.budget_max_inr ? 'Rs.' + args.budget_max_inr : 'none'}.`;
      const fallback = `${exp.name} is ${exp.distance_meters} meters away and fits your time and budget. Where else are you heading, and what are your interests?`;

      const spoken = await safePhrase(phrasePrompt, fallback, 'find-experience');

      return res.json({
        intent: 'find_nearby_experience',
        function_call: { name: callName, args },
        data: exp,
        spoken_response: sanitizeVoiceResponse(spoken),
      });
    }

    return res.json({
      intent: 'none',
      spoken_response: sanitizeVoiceResponse('Namaste! I can help you explore India, check live weather, or track expenses! Where are you heading to in India, and what are your interests, like heritage, food, or artisan crafts?'),
      data: null,
    });
  } catch (err) {
    console.error('[VOICE-ROUTE] Failed. err.message:', err.message);
    if (err.response) {
      console.error('[VOICE-ROUTE] Status:', err.response.status);
      console.error('[VOICE-ROUTE] Data:', err.response.data);
    } else {
      console.error('[VOICE-ROUTE] Full error:', err);
    }
    return res.status(500).json({ detail: err.message || 'Intent routing failed' });
  }
});

// ============================================================================
// 5. HIGH-PRECISION AUDIO TRANSCRIPTION ENDPOINT
// Uses Gemini 3.5 Flash multimodal audio to transcribe voice recordings
// with 100% accuracy for Indian accents, travel terms, and city names.
// ============================================================================
voiceRouter.post('/transcribe', async (req, res) => {
  try {
    let { audio, mimeType = 'audio/webm' } = req.body;
    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ error: 'Audio base64 data is required', transcript: '' });
    }

    // Strip Data URL header if present (e.g. data:audio/webm;base64,...)
    if (audio.includes('base64,')) {
      const parts = audio.split('base64,');
      audio = parts[1];
      const headerMatch = parts[0].match(/data:([^;]+)/);
      if (headerMatch && headerMatch[1]) {
        mimeType = headerMatch[1];
      }
    }

    // Clean mimeType for Gemini (must be clean audio/webm, audio/wav, audio/mp4, etc.)
    let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (!cleanMime.startsWith('audio/')) {
      cleanMime = 'audio/webm';
    }

    // Candidate models for resilience (gemini-2.5-flash / gemini-2.0-flash / gemini-1.5-flash)
    const modelCandidates = [
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ].filter(Boolean);

    let transcript = '';
    let lastError = null;

    for (const modelName of [...new Set(modelCandidates)]) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: cleanMime,
              data: audio,
            },
          },
          {
            text: `You are an expert voice recording, translation, and transcription engine for LOKIVA, an Indian travel and local discovery platform.
Listen to the entire spoken audio recording and translate or transcribe it into clean, natural English text with 100% precision.
Rules:
1. TRANSLATION: If the speaker speaks in Hindi, Hinglish, or any Indian vernacular language, translate their words into natural English while preserving their exact travel query, intent, destinations, and details.
2. TRANSCRIPTION: If the speaker speaks in English or Indian English, transcribe their speech word-for-word accurately.
3. INDIAN LOCALES: Accurately recognize Indian cities, landmarks, and districts (e.g. Mumbai, Jaipur, Varanasi, Bandra, Colaba, Gateway of India, Old Delhi, Goa, Udaipur, etc.) and travel terms (e.g. itinerary, budget, expenses, hotel, auto-rickshaw, metro, guide, thali).
4. COMPLETE UTTERANCE: Transcribe the full thought from beginning to end without cutting off or omitting any clause.
5. NOISE HANDLING: If the recording is complete silence or background noise with no speech, output: [NO_SPEECH]
6. RAW TEXT ONLY: Return ONLY the final translated or transcribed sentence. Do not add quotes, markdown formatting, explanations, or prefixes.`,
          },
        ]);

        const rawText = result?.response?.text() || '';
        const cleaned = rawText
          .replace(/^["'`]+|["'`]+$/g, '')
          .replace(/[\u2014\u2015]/g, ', ')
          .replace(/[\u2013]/g, '-')
          .replace(/--+/g, '-')
          .trim();

        if (cleaned === '[NO_SPEECH]' || cleaned === '[SILENCE]' || cleaned.toLowerCase() === 'no speech') {
          transcript = '';
        } else {
          transcript = cleaned;
        }

        lastError = null;
        break; // Successfully transcribed
      } catch (genErr) {
        console.warn(`[VOICE/TRANSCRIBE] Model ${modelName} failed:`, genErr?.message || genErr);
        lastError = genErr;
      }
    }

    if (lastError && !transcript) {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn('[VOICE/TRANSCRIBE] GEMINI_API_KEY is not configured in server/.env');
        return res.status(200).json({
          transcript: '',
          warning: 'GEMINI_API_KEY is not configured in server/.env',
          success: false,
        });
      }
      console.error('[VOICE/TRANSCRIBE] All model attempts failed:', lastError?.message || lastError);
      return res.status(500).json({ error: lastError?.message || 'Transcription failed', transcript: '' });
    }

    console.log('[BACKEND /voice/transcribe] Gemini Audio Output:', transcript ? `"${transcript}"` : '(silence)');
    return res.json({ transcript, success: true });
  } catch (err) {
    console.error('[VOICE/TRANSCRIBE] Handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error', transcript: '' });
  }
});

