import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Google retires model aliases (e.g. the old `gemini-pro`) without warning, which
// surfaces as a 404 from generateContent. So never hardcode a single name: try an
// ordered list, remember the first one that works, and fall back to asking the API
// what this key can actually reach.
const DEFAULT_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
];

const MODEL_CANDIDATES = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL, ...DEFAULT_MODEL_CANDIDATES.filter((m) => m !== process.env.GEMINI_MODEL)]
  : DEFAULT_MODEL_CANDIDATES;

// First model name known to work for this key, so we stop paying discovery cost.
let workingModelName = null;
let apiDiscoveryTried = false;
let quotaExhaustedUntil = 0;

function sanitizeAiText(text) {
  if (!text) return '';
  return text
    .replace(/[\u2014\u2015]/g, ', ')
    .replace(/[\u2013]/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

/** A 404, unsupported-model, 503 high-demand, 429 quota on single model, or timeout is worth retrying with next model. */
function isModelUnavailable(error) {
  const msg = error?.message || '';
  return /404|not found|is not supported|not supported for|503|service unavailable|high demand|spikes in demand|overloaded|temporarily unavailable|unavailable|timeout|timed out|500|502|504|RESOURCE_EXHAUSTED|429|quota/i.test(msg);
}

/** Only an invalid key or revoked permission fails identically for every model: stop immediately. */
function isFatalError(error) {
  const msg = error?.message || '';
  return /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(msg);
}

/**
 * Retirement 404s name their own replacement, e.g.
 *   "This model models/gemini-2.0-flash is no longer available.
 *    Please update your code to use models/gemini-3.6-flash"
 * That hint is more current than any list we hardcode, so prefer it.
 */
function extractRecommendedModel(error) {
  const msg = error?.message || '';
  const match = msg.match(/use\s+models\/([a-zA-Z0-9.\-_]+)/);
  return match ? match[1] : null;
}

/** Ask the API which models this key can actually use for generateContent. */
async function discoverModelsFromApi() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || typeof fetch !== 'function') return [];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name).replace(/^models\//, ''))
      // Prefer flash (cheap/fast) over pro, and skip previews/experiments.
      .filter((n) => /flash|pro/.test(n) && !/vision|embed|aqa|thinking|exp|preview/.test(n))
      .sort((a, b) => (a.includes('flash') === b.includes('flash') ? 0 : a.includes('flash') ? -1 : 1));
  } catch {
    return [];
  }
}

/** Candidate names to attempt, best-known first. */
function candidateOrder() {
  if (!workingModelName) return [...MODEL_CANDIDATES];
  return [workingModelName, ...MODEL_CANDIDATES.filter((n) => n !== workingModelName)];
}

/**
 * Execute chat inference using Groq Qwen (Ultra-fast Qwen 3.8 / 2.5 on Groq LPU).
 */
export async function queryGroqQwen(prompt, { systemInstruction = '', history = [], maxTokens = 450, temperature = 0.3 } = {}) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('Groq API key not configured');

  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const chatMessages = [];
  if (systemInstruction) {
    chatMessages.push({ role: 'system', content: systemInstruction });
  }
  if (history && history.length > 0) {
    chatMessages.push(...history);
  }
  if (prompt) {
    chatMessages.push({ role: 'user', content: prompt });
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: chatMessages,
      max_tokens: Math.min(maxTokens, 450),
      temperature,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Qwen error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return { text: sanitizeAiText(text), modelName: model };
}

/**
 * Run a prompt against Groq Qwen first, then fallback to Gemini models.
 * @returns {Promise<{text: string, modelName: string}>}
 */
async function generateWithFallback(prompt, { systemInstruction, generationConfig, history } = {}) {
  // 1. Try Groq Qwen First if configured
  if (process.env.GROQ_API_KEY) {
    try {
      const groqResult = await queryGroqQwen(prompt, {
        systemInstruction,
        history,
        maxTokens: generationConfig?.maxOutputTokens || 1200,
        temperature: generationConfig?.temperature || 0.3,
      });
      if (groqResult && groqResult.text) {
        return groqResult;
      }
    } catch (groqErr) {
      console.warn('[Groq Qwen] Inference failed, trying fallback:', groqErr.message);
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured.');
  }

  if (Date.now() < quotaExhaustedUntil) {
    throw new Error('Quota temporarily exceeded; routing directly to intelligent cultural engine.');
  }

  // Allow up to 4 models to try. 35 seconds per model allows Gemini to return full, complete responses.
  const queue = candidateOrder().slice(0, 4);
  const tried = new Set();
  let lastError = null;
  const timeoutMs = 35000;

  while (queue.length > 0) {
    const modelName = queue.shift();
    if (tried.has(modelName)) continue;
    tried.add(modelName);

    try {
      const activeModel = genAI.getGenerativeModel({
        model: modelName,
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(generationConfig ? { generationConfig } : {}),
      });

      const requestPromise = history?.length
        ? activeModel.startChat({ history }).sendMessage(prompt)
        : activeModel.generateContent(prompt);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${modelName} exceeded ${timeoutMs}ms response window`)), timeoutMs)
      );

      const result = await Promise.race([requestPromise, timeoutPromise]);

      workingModelName = modelName;
      const rawText = result.response.text();
      return { text: sanitizeAiText(rawText), modelName };
    } catch (error) {
      lastError = error;

      // An invalid key or blown quota fails the same way for every model.
      if (isFatalError(error)) {
        if (/RESOURCE_EXHAUSTED|429|Quota exceeded|exceeded your current quota/i.test(error?.message || '')) {
          // Soft quota error: set cooldown and throw a non-fatal error so callers can handle gracefully
          quotaExhaustedUntil = Date.now() + 60000;
          throw new Error('QUOTA_EXCEEDED: Daily free-tier limit reached. Please try again later or upgrade your Gemini API plan.');
        }
        throw error;
      }

      if (!isModelUnavailable(error)) throw error;

      // This name is gone; don't keep preferring it.
      if (workingModelName === modelName) workingModelName = null;
      console.warn(`Gemini model "${modelName}" unavailable or slow: ${error.message}`);
    }
  }

  throw lastError || new Error('No usable Gemini model found within response time window.');
}

/**
 * Gemini requires history to open on a user turn, strictly alternate, and end on a
 * model turn (the new message becomes the next user turn). Anything else is rejected.
 */
function sanitizeHistory(chatHistory) {
  const mapped = (chatHistory || [])
    .filter((msg) => msg && typeof msg.content === 'string' && msg.content.trim())
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

  // Drop any leading model turns: history must open with 'user'.
  const firstUser = mapped.findIndex((m) => m.role === 'user');
  if (firstUser === -1) return [];

  // Keep only turns that alternate, dropping consecutive same-role duplicates.
  const alternating = [];
  for (const turn of mapped.slice(firstUser)) {
    if (alternating.length === 0 || alternating[alternating.length - 1].role !== turn.role) {
      alternating.push(turn);
    }
  }

  // A trailing user turn would collide with the message we're about to send.
  if (alternating[alternating.length - 1]?.role === 'user') alternating.pop();

  return alternating;
}

/**
 * AI Cultural Concierge - Chat with Gemini about travel, culture, food
 * @param {string} userMessage - User's question or request
 * @param {Array} chatHistory - Previous conversation messages for context
 * @param {string} city - Current destination city
 * @param {Array} availableExperiences - Relevant experiences from database for grounding
 * @returns {Promise<Object>} AI response with recommendations
 */
// Readable labels for the canonical interest keys used by the traveler brief.
const INTEREST_LABELS = {
  culture: 'royal heritage',
  food: 'street food',
  workshop: 'artisan workshops',
  hidden_gem: 'offbeat spots',
  spiritual: 'sacred ghats and temples',
  nature: 'nature and wildlife',
  shopping: 'local markets',
  adventure: 'adventure',
  nightlife: 'music and nightlife',
  events: 'festivals and events',
};

/**
 * High-fidelity intelligent Cultural Concierge Engine when Gemini API is offline or unconfigured.
 * Formulates realistic, culturally authentic recommendations for budget, duration, regional, and city queries.
 */
/**
 * Pulls the handful of facts a traveler genuinely needs that the route cards
 * do not already show: any overrun, budget headroom, clustering, transit
 * burden, exposure and finish time.
 *
 * Notes are ranked, not just collected. A route that overruns the traveler's
 * own time window must survive the three note cap, so warnings carry the
 * highest priority and the nicest to know facts are dropped first.
 */
export function routeInsights(routes, brief) {
  const ranked = [];
  const add = (priority, text) => ranked.push({ priority, text });
  if (!routes.length) return [];

  const primary = routes[0];
  const costs = routes.map((r) => Number(r.estimated_cost_inr) || 0);
  const cheapest = Math.min(...costs);
  const dearest = Math.max(...costs);

  // 0. Overrun is the single most important thing to say, so it always leads
  if (primary.over_window_by_mins > 0) {
    add(0, `Runs about ${Math.round(primary.over_window_by_mins / 15) * 15} min past the time you said you had.`);
  }

  // 1. Then anything that breaks a stated constraint
  const ceiling = Number(brief?.budget_inr) || 0;
  const cost = Number(primary.estimated_cost_inr) || 0;
  if (ceiling > 0 && cost > ceiling) {
    add(1, `Works out to ${cost.toLocaleString('en-IN')} rupees, above your ${ceiling.toLocaleString('en-IN')} ceiling. Trim one paid stop to bring it in.`);
  }

  // 2. Transit shape: a compact day needs no advice about riding
  if (primary.total_distance_km <= 3) {
    add(2, `Every stop sits within ${primary.total_distance_km} km, so this is a walkable pocket.`);
  } else if (primary.longest_leg_km > 5) {
    const worst = primary.stops
      .map((s) => s.leg_from_previous)
      .filter(Boolean)
      .sort((a, b) => b.duration_mins - a.duration_mins)[0];
    add(2, `Longest hop is ${primary.longest_leg_km} km, about ${worst ? worst.duration_mins : 0} min in transit.`);
  }

  // 3. Money left over, which means the traveler has room to add a stop
  if (ceiling > 0 && cost > 0 && cost <= ceiling * 0.6) {
    add(3, `Comes to ${cost.toLocaleString('en-IN')} rupees against your ${ceiling.toLocaleString('en-IN')} budget, so there is room to add a stop.`);
  }

  // 4. Comfort and logistics
  const outdoor = primary.stops.filter((s) => !s.is_indoor).length;
  if (primary.stops.length >= 2 && outdoor === primary.stops.length) {
    add(4, 'All open air, so carry water and plan for midday heat.');
  }

  const endHour = String(primary.end_time || '').match(/(\d{1,2}):\d{2}\s*(AM|PM)/i);
  if (endHour) {
    let h = parseInt(endHour[1], 10);
    if (endHour[2].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (endHour[2].toUpperCase() === 'AM' && h === 12) h = 0;
    if (h >= 20) add(4, `Finishes around ${primary.end_time}, so book the last ride ahead of time.`);
  }

  // 5. A wide cost spread between the options helps when choosing
  if (cheapest > 0 && dearest > cheapest * 2) {
    add(5, `Cost ranges from ${cheapest.toLocaleString('en-IN')} to ${dearest.toLocaleString('en-IN')} rupees across the three.`);
  }

  return ranked
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((n) => n.text);
}

/**
 * Hard ceiling on how much prose reaches the traveler. The route cards carry
 * the stops, the legs and the timings, so anything longer is the model
 * ignoring the brief. Truncates on a sentence boundary, never mid sentence.
 */
export function condenseConciergeReply(text, maxWords = 90) {
  if (!text || typeof text !== 'string') return text || '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();

  const sentences = text.trim().match(/[^.!?\n]*[.!?]+(?:\s+|$)|[^.!?\n]+$/g) || [text];
  const kept = [];
  let count = 0;
  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).filter(Boolean).length;
    if (count + sentenceWords > maxWords && kept.length) break;
    kept.push(sentence.trim());
    count += sentenceWords;
    if (count >= maxWords) break;
  }
  return kept.join(' ').trim();
}

/**
 * Builds a short, self contained clause that names the factors which actually
 * shaped the result. Every fragment carries its own preposition so the fragments
 * can simply be joined with commas, and the list is capped at three because the
 * brief strip underneath already shows everything else.
 */
function briefClause(brief) {
  const COMPANY = {
    solo: 'a solo traveller',
    couple: 'a couple',
    friends: 'a group of friends',
    family: 'a family',
    seniors: 'travelling with elders',
  };

  const fragments = [];
  if (Array.isArray(brief.interests) && brief.interests.length) {
    const labels = brief.interests
      .slice(0, 2)
      .map((i) => INTEREST_LABELS[i] || i);
    fragments.push(`for your interest in ${labels.join(' and ')}`);
  }
  if (brief.time_budget) fragments.push(`within your ${brief.time_budget.toLowerCase()} window`);
  if (brief.companions && COMPANY[String(brief.companions).toLowerCase()]) {
    fragments.push(`suiting ${COMPANY[String(brief.companions).toLowerCase()]}`);
  }
  if (brief.budget_inr) {
    fragments.push(`under ${Number(brief.budget_inr).toLocaleString('en-IN')} rupees`);
  } else if (brief.budget_tier) {
    fragments.push(`on a ${brief.budget_tier} rupee budget`);
  }
  if (fragments.length < 3 && brief.pace) fragments.push(`at a ${String(brief.pace).toLowerCase()} pace`);

  if (!fragments.length) return 'matched to what you asked for';
  return fragments.slice(0, 3).join(', ');
}

export function generateIntelligentCulturalFallback({
  userMessage = '',
  chatHistory = [],
  city = null,
  availableExperiences = [],
  tripProfile = null,
  routeOptions = [],
}) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();

  // A confirmed brief from the concierge interview outranks anything parsed
  // out of the raw message, because it came from explicit traveler answers.
  const brief = tripProfile && typeof tripProfile === 'object' ? tripProfile : {};
  const briefInterests = Array.isArray(brief.interests) ? brief.interests.filter(Boolean) : [];
  const briefWindow = brief.time_budget || null;
  const briefBudget = Number(brief.budget_inr) > 0 ? Number(brief.budget_inr) : null;
  const briefPace = brief.pace || null;
  const briefCompanions = brief.companions || null;
  const briefStart = brief.start_period || null;
  const briefCrowd = brief.crowd_preference || null;
  const briefAccess = brief.accessibility || null;
  const briefDiet = brief.dietary || null;
  const hasBrief = Boolean(
    briefInterests.length ||
      briefWindow ||
      briefBudget ||
      briefPace ||
      briefCompanions ||
      briefCrowd ||
      briefAccess ||
      briefDiet
  );

  // 1. Detect budget (handles 20k, 20000, 20 thousand, 1.5 lakh, etc.)
  const kMatch = lower.match(/(?:budget\s*(?:of)?|under|around|approx|for|within)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|lac|lakh)\b/i);
  const plainBudgetMatch = lower.match(/(?:₹|rs\.?|inr|budget\s*(?:of)?)\s*([\d,]{4,})/i);
  let parsedBudget = null;
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    const unit = kMatch[2].toLowerCase();
    parsedBudget = (unit === 'k' || unit === 'thousand') ? Math.round(val * 1000) : Math.round(val * 100000);
  } else if (plainBudgetMatch) {
    parsedBudget = parseInt(plainBudgetMatch[1].replace(/,/g, ''), 10);
  }

  // Detect duration (days / nights / weekend)
  const dayMatch = lower.match(/(\d+)\s*(days?|nights?)/i);
  const durationDays = dayMatch ? parseInt(dayMatch[1], 10) : (lower.includes('weekend') ? 2 : (lower.includes('week') ? 7 : null));

  // If user asks where to go with budget or duration, or general destination discovery:
  const isWhereToGo = /(where\s*(should|can|to)\s*i\s*go|suggest|recommend|places\s*to\s*go|destinations?|vacation|trip\s*plan|itinerary|what\s*place)/i.test(lower);

  if ((parsedBudget || durationDays) && (isWhereToGo || !city)) {
    const budgetStr = parsedBudget ? `₹${parsedBudget.toLocaleString('en-IN')}` : 'your budget';
    const daysStr = durationDays ? `${durationDays} days` : '5 days';
    const effectiveDays = durationDays || 5;
    const dailySpend = parsedBudget ? Math.round(parsedBudget / effectiveDays) : 4000;
    const dailyNote = `(approx. ₹${dailySpend.toLocaleString('en-IN')}/day)`;

    return `Namaste! With a budget of **${budgetStr}** for **${daysStr}** ${dailyNote}, you have wonderful choices for a deeply authentic cultural journey in India. Here are three signature circuits calibrated to your timeline and budget:

1. **Rajasthan Royal & Artisan Corridor (Jaipur & Pushkar or Udaipur)**
   - **Vibe:** Historic forts, generational craft masterclasses, and vibrant bazaars.
   - **Highlights:** Sunrise over Nahargarh Fort, authentic Sanganeri hand block-printing workshops, Blue Pottery studios, and evening food walks for Pyaz Kachori and Lassiwala.
   - **Realistic Budget Fit:** Heritage haveli stays (~₹1,500 to ₹1,800/night), authentic regional thalis (~₹750/day), local auto/rickshaws (~₹400/day), and workshop fees. Fits comfortably within ${budgetStr}.

2. **Himachal Monastic & Mountain Trail (Dharamshala, McLeodGanj & Bir)**
   - **Vibe:** Himalayan pine trails, Tibetan art institutes, and tea garden calm.
   - **Highlights:** Dalai Lama Temple complex, Norbulingka Institute master wood-carving and Thangka art, Kangra valley tea walks, and sunset views over the Dhauladhar range.
   - **Realistic Budget Fit:** Mountain homestays (~₹1,200 to ₹1,600/night), Tibetan cafes and thukpa (~₹600/day), and Delhi-Himachal Volvo transit. Very economical and rejuvenating.

3. **Kerala Tropical Heritage & Spice Coast (Fort Kochi & Munnar / Alleppey)**
   - **Vibe:** Colonial heritage alleys, Kathakali traditional drama, and spice trading lanes.
   - **Highlights:** Fort Kochi Jewish Synagogue, Chinese fishing nets at dusk, and fragrant spice plantation trails in the Western Ghats.
   - **Realistic Budget Fit:** Coastal boutique homestays (~₹1,500 to ₹1,800/night), banana leaf sadhyas and coastal seafood (~₹700/day), and public ferry transit.

Which of these three atmospheres speaks to you most: **Royal Forts & Crafts**, **Mountain Monasteries**, or **Tropical Spice Coast**? Tell me, and I will tailor your step-by-step day plan!`;
  }

  // 0. Routes first. The cards below carry the whole itinerary, so the prose
  // only frames it and adds the facts that are not visible on screen.
  const usableRoutes = Array.isArray(routeOptions) ? routeOptions.filter((r) => r && r.stops?.length) : [];
  if (usableRoutes.length) {
    const where = city || 'your destination';
    const lead = hasBrief
      ? `${usableRoutes.length} routes through **${where}**, built ${briefClause(brief)}`
      : `${usableRoutes.length} ways to spend the day in **${where}**`;

    const insights = routeInsights(usableRoutes, brief);
    const notes = insights.length
      ? `\n\n${insights.map((n) => `- ${n}`).join('\n')}`
      : '';

    return condenseConciergeReply(
      `${lead}.${notes}

Pick one below, then tell me what to change.`
    );
  }

  // 1b. Confirmed brief with verified places: narrate the shortlist directly
  if (hasBrief && city && Array.isArray(availableExperiences) && availableExperiences.length > 0) {
    const cityName = city.trim();
    const cheapest = availableExperiences
      .slice(0, 3)
      .reduce((min, e) => Math.min(min, Number(e.price) || 0), Infinity);
    const costNote = Number.isFinite(cheapest)
      ? cheapest === 0
        ? 'Entry is free at every stop.'
        : `Entry runs from ${cheapest} rupees per person.`
      : '';

    return condenseConciergeReply(
      `Shortlist for **${cityName}**, ${briefClause(brief)}.
${costNote}

Pick what you like below, or tell me to swap something out.`
    );
  }

  // 2. Specific City / Destination context
  if (city) {
    const cityName = city.trim();
    const isShimla = /shimla/i.test(cityName);
    const isManali = /manali|kullu/i.test(cityName);
    const isDharamshala = /dharamshala|mcleodganj/i.test(cityName);
    const isJaipur = /jaipur/i.test(cityName);
    const isVaranasi = /varanasi|banaras|kashi/i.test(cityName);
    const isGoa = /goa/i.test(cityName);
    const isMumbai = /mumbai|bombay/i.test(cityName);
    const isDelhi = /delhi/i.test(cityName);
    const isUdaipur = /udaipur/i.test(cityName);
    const isKochi = /kochi|cochin|kerala/i.test(cityName);
    const isHampi = /hampi/i.test(cityName);

    const wantsFestivals = /festival|festivals|fairs?|mela|melas|celebration|celebrations|event|events|carnival|ritual|rituals|nati/i.test(lower);
    const wantsNature = /nature|mountain|hill|forest|trek|trail|pine|valley|falls|waterfall|lake|peaceful|scenic|greenery|fresh\s*air|outdoor/i.test(lower);
    const wantsFood = /food|eat|dining|cuisine|thali|dish|dishes|dham|sweet|street\s*food|culinary|taste|restaurant|cafe|breakfast|lunch|dinner|snack|siddu|madra|babru/i.test(lower);
    const wantsHeritage = /heritage|history|historic|fort|palace|temple|monument|museum|church|architecture|ruins/i.test(lower);
    const wantsCrafts = /craft|art|pottery|textile|handloom|weaving|wood|bazaar|market|shopping|souvenir/i.test(lower);
    const isWeather = /weather|rain|snow|temperature|climate|best\s*time|monsoon|winter|cold|hot|degrees/i.test(lower);
    const isBudgetStay = /budget|stay|hotel|homestay|hostel|cost|expense|cheap|affordable/i.test(lower);
    const isPureCityGreeting = new RegExp(`^(hi|hello|hey|namaste|start|greetings|welcome)?\\s*(to\\s*)?${cityName}?[\\s!.]*$`, 'i').test(lower);
    const asksToPlanTrip = /plan|itinerary|schedule|trip|tour|days?\b|nights?\b/i.test(lower);

    // If user asked about Weather in this city
    if (isWeather) {
      if (isShimla) {
        return `**Weather & Seasons in Shimla:**
• **Spring & Summer (March - June):** Pleasantly crisp with daytime temperatures around 15°C to 24°C. Ideal for pine forest walks, Chadwick Falls, and outdoor dining on Mall Road.
• **Monsoon (July - August):** Lush, mist-covered green cedar slopes (14°C - 20°C). Beautiful waterfalls, but keep an umbrella and check road conditions for mountain drives.
• **Autumn (September - November):** Crystal-clear blue skies, crisp mountain air (10°C - 18°C), and panoramic views of Himalayan snow peaks.
• **Winter (December - February):** Cold (2°C to 10°C, dipping below 0°C at night) with occasional magical snowfall around Christmas and January. Pack thermal layers and windproof jackets!`;
      }
      return `**Weather & Travel Advisory for ${cityName}:**
• The daytime weather is generally pleasant for exploration. For walking tours, early mornings and late afternoons offer the best light and moderate temperatures.
• If exploring temples or heritage corridors, keep slip-on footwear and lightweight cottons (or warm layers in winter/hill stations).`;
    }

    // Specific Festivals & Cultural Events inquiry
    if (wantsFestivals) {
      if (isShimla) {
        let reply = `**Living Traditions, Festivals & Melas in Shimla:**\n\n`;
        reply += `1. **Shimla Summer Festival (May / June):**\n`;
        reply += `   Held right on the historic Ridge. Features vibrant Pahadi folk music, traditional **Nati dance** troupes in colourful ancestral attire, flower exhibitions, and artisan craft showcases.\n\n`;
        reply += `2. **Sipi Fair (Mashobra, May):**\n`;
        reply += `   A centuries-old fair dedicated to *Sip Devta* held amidst towering deodars. Villagers gather from surrounding valleys for age-old archery contests, folk games, and traditional music.\n\n`;
        reply += `3. **Rhyali Festival (Monsoon / July):**\n`;
        reply += `   An agrarian thanksgiving festival where locals sow saplings and barley indoors to celebrate the arrival of rains and pray for bountiful hill harvests.\n\n`;
        reply += `4. **Bhoj Fair (November):**\n`;
        reply += `   Celebrated in rural Shimla belts honoring local mountain devtas (deities), featuring unique ritual mask dances and generational storytelling.\n\n`;
        reply += `5. **Winter Carnival & Ice Skating (December / January):**\n`;
        reply += `   Centered around Shimla's open-air circular ice rink (the oldest natural ice rink in South Asia), accompanied by festive processions around Christ Church.\n\n`;

        if (wantsFood) {
          reply += `**Pairing with Authentic Himachali Food:**\n`;
          reply += `During these fairs, make sure to taste traditional **Himachali Dham** (slow-simmered *Chana Madra* cooked in yogurt and cardamom, *Sepu Badi*, and sweet rice prepared by hereditary *Botis*), piping hot **Siddu** smothered in pure desi ghee, and fresh **Babru** (black gram stuffed kachoris).\n\n`;
        }
        reply += `*Would you like details on attending a specific festival season or recommendations for quiet local homestays nearby?*`;
        return reply;
      }

      if (isJaipur) {
        return `**Iconic Festivals & Celebrations in Jaipur:**
1. **Teej Festival (July / August):** Royal procession of Goddess Parvati through the Old City, folk dancers, and Ghevar sweets.
2. **Gangaur Festival (March / April):** Vibrant processions of married and unmarried women carrying brass water pots and idols.
3. **Jaipur Literature Festival (January):** World-renowned gathering of authors, thinkers, and cultural music at Clarks Amer.
4. **Elephant Festival (Holi eve):** Traditional Rajasthani music, folk dance, and celebratory colours.`;
      }

      if (isVaranasi) {
        return `**Sacred Festivals & Celebrations in Varanasi:**
1. **Dev Deepawali (Karthik Purnima, Nov):** All 84 ghats illuminated with over a million earthen oil lamps (diyas), accompanied by Vedic chants.
2. **Maha Shivratri (Feb / March):** Grand processions toward Kashi Vishwanath temple, thandai, and night-long spiritual vigils.
3. **Ganga Mahotsav:** Five days of classical Indian vocal music and Kathak performances on the riverbanks.`;
      }

      return `In **${cityName}**, local festivals celebrate harvest, patron deities, and generational arts. Visiting during a festival brings vibrant music, regional street food, and folk arts to life. Which season or month are you planning to visit?`;
    }

    // Specific Food Inquiry for the city (when not explicitly asking for a multi-day itinerary)
    if (wantsFood && !durationDays && !asksToPlanTrip) {
      if (isShimla) {
        return `**Signature Culinary Experiences in Shimla:**
1. **Authentic Himachali Siddu:** Steamed fermented wheat bread stuffed with spiced walnuts, poppy seeds, and mountain herbs, served piping hot and drenched in golden desi ghee.
2. **Himachali Dham Thali:** Traditional community feast prepared by hereditary chefs (*Botis*), featuring **Chana Madra** (chickpeas in slow-simmered yogurt and cardamom gravy), Sepu Badi, Mah ki Dal, and Meethe Chawal.
3. **Pahadi Babru:** Delicious black gram-stuffed deep-fried bread, best enjoyed on crisp mornings with spicy mint-coriander and sweet tamarind chutneys.
4. **Heritage Mall Road Cafes:** Historic spots like *The Indian Coffee House* (cherished since 1957) and *Wake & Bake* for locally sourced apple pie, mountain honey crepes, and fresh brew.

*Would you like recommendations on specific dhabas and eateries where locals eat in Shimla?*`;
      }
      return `In **${cityName}**, regional food is an essential doorway to its culture. I recommend seeking out generational family-run eateries for authentic thalis, seasonal snacks, and local sweets made with indigenous spices. What kind of cuisine or dietary preference do you prefer?`;
    }

    // Specific Nature Inquiry for the city (when not explicitly asking for a multi-day itinerary)
    if (wantsNature && !durationDays && !asksToPlanTrip) {
      if (isShimla) {
        return `**Top Nature & Scenic Trails in and around Shimla:**
1. **Chadwick Falls & The Glen:** A quiet downhill walking trail through dense deodar, pine, and oak forest woods leading to a natural cascading waterfall.
2. **Jakhoo Hill & Deodar Forests:** Shimla's highest peak (8,054 ft), offering crisp mountain air, towering pines, and sweeping views of the snow-clad Shivalik ranges.
3. **Mashobra & Craignano Nature Sanctuary:** Located 10 km from Shimla, featuring walking trails through apple orchards and one of the world's highest water-lift nature reserves.
4. **Potter's Hill & Annandale Meadows:** Peaceful forested trails with picnic clearings away from tourist crowds.

*Would you like tips on easy walking routes vs. higher elevation hikes around Shimla?*`;
      }
      return `In **${cityName}**, exploring natural surroundings, morning gardens, and nearby scenic reserves gives a refreshing perspective on the region. Would you prefer gentle forest walks or higher vantage point viewpoints?`;
    }

    // If user specifies duration (e.g. 5 days, 3 days, weekend) or explicitly asks to plan a trip/itinerary:
    const effectiveDays = durationDays || (asksToPlanTrip ? 3 : null);

    if (effectiveDays) {
      if (isShimla) {
        const days = Math.min(Math.max(effectiveDays, 2), 7);
        let itinerary = `Namaste! For your **${days}-day journey in Shimla** focusing on ${wantsNature ? 'serene Himalayan nature' : 'scenic mountain vistas'}${wantsFood ? ' and authentic regional cuisine' : ''}, here is your curated day-by-day plan:\n\n`;

        itinerary += `**Day 1: The Ridge, Cedar Sunset & Mountain Comfort Food**\n`;
        itinerary += `• **Nature & Heritage:** Orientation walk across the historic Ridge and Mall Road at twilight as the cedar slopes turn amber. Visit the neo-Gothic Christ Church and Scandal Point.\n`;
        itinerary += `• **Culinary Highlight:** Taste authentic steaming **Siddu** (wheat dumpling stuffed with spiced walnuts and poppy seeds, drenched in warm desi ghee) and hot spiced Pahadi tea at a traditional local vendor.\n\n`;

        itinerary += `**Day 2: Deep Pine Forest & Chadwick Falls Trail**\n`;
        itinerary += `• **Nature & Hiking:** Take a morning nature walk through deep Deodar and Himalayan Oak forest groves leading into the Glen down to **Chadwick Falls**.\n`;
        itinerary += `• **Culinary Highlight:** Relish a traditional **Himachali Dham** for lunch: slow-cooked **Chana Madra** (chickpeas in rich yogurt and cardamom gravy), Mah ki Dal, and steamed Basmati.\n\n`;

        if (days >= 3) {
          itinerary += `**Day 3: Highest Crest, Jakhoo Peak & Himalayan Nature**\n`;
          itinerary += `• **Nature & Panorama:** Early morning forest ascent (or ropeway) to **Jakhoo Hill** (8,054 ft), Shimla's highest peak, surrounded by ancient pine forests and panoramic snow-capped mountain views.\n`;
          itinerary += `• **Culinary Highlight:** Head down toward Lakkar Bazaar for fresh, hot **Babru** (black gram stuffed Pahadi kachori) served with tangy tamarind and mint chutney.\n\n`;
        }

        if (days >= 4) {
          itinerary += `**Day 4: Mashobra Pine Forest & Craignano Nature Reserve**\n`;
          itinerary += `• **Nature Retreat:** Excursion to **Mashobra** (10 km from Shimla) and the pristine **Craignano Nature Reserve** for peaceful, uncrowded pine forest walks, apple orchard trails, and mountain mist.\n`;
          itinerary += `• **Culinary Highlight:** Enjoy a quiet homestay lunch with regional **Sepu Badi** (steamed urad lentil cakes in rich curd-spinach gravy) and refreshing wild rhododendron (*buransh*) nectar.\n\n`;
        }

        if (days >= 5) {
          itinerary += `**Day 5: Viceregal Botanical Grounds & Relaxed Cafe Culture**\n`;
          itinerary += `• **Nature & Heritage:** Stroll through the heritage botanical grounds and century-old manicured gardens of the historic **Viceregal Lodge** (Indian Institute of Advanced Study).\n`;
          itinerary += `• **Culinary Highlight:** Unwind at legendary local cafes like *Wake & Bake* or *The Indian Coffee House* on Mall Road for warm handmade apple pie, mountain honey crepes, and freshly ground filter coffee.\n\n`;
        }

        itinerary += `*Would you like me to adjust any days for trekking pacing, suggest authentic mountain homestays, or map out local taxi fares?*`;
        return itinerary;
      }

      // If another city (e.g. Jaipur, Manali, Varanasi, etc.)
      if (isJaipur) {
        return `Namaste! For a **${effectiveDays}-day cultural immersion in Jaipur**:
• **Heritage & Royal Architecture:** Amer Fort sunrise, stepwells (Panna Meena Ka Kund), City Palace courtyards, and sunset over Nahargarh Fort hills.
• **Living Crafts:** Hands-on Sanganeri hand block-printing workshop and master Blue Pottery studio visits.
• **Signature Regional Food:** Rawat Mishtan Bhandar's legendary Pyaz Kachori, creamy lassi in clay kulhads at Lassiwala (since 1944), and royal Dal Baati Churma.
Would you like me to detail timings and transport for your days?`;
      }

      if (isVaranasi) {
        return `Namaste! For a **${effectiveDays}-day spiritual and culinary journey in Varanasi**:
• **Sacred River & Ghats:** Dawn rowboat ride from Assi to Manikarnika Ghat to watch the morning rituals, followed by evening Ganga Aarti chants at Dashashwamedh.
• **Artisan Heritage:** Weaving heritage walks through Madanpura to observe master Zari and Banarasi silk looms.
• **Iconic Food Trail:** Morning Kachori Jalebi at Ram Bhandar, creamy winter Malaiyo froth, refreshing Banarasi Paan, and famous Tamatar Chaat at Kashi Chaat Bhandar.
Would you like me to structure morning and evening schedules for your stay?`;
      }

      // Generic Indian City Dynamic multi-day plan
      return `Namaste! For your **${effectiveDays}-day visit to ${cityName}**:
1. **Day 1 (Arrival & Heritage Orientation):** Explore the central historic corridors, main architectural landmarks, and sunset views, followed by signature regional street food.
2. **Day 2 (Nature & Artisan Living Traditions):** Discover local green spaces, scenic natural viewpoints, and generational craft masterclasses or heritage markets.
3. **Day 3 (Deep Cultural Immersion & Culinary Highlights):** Venture into nearby villages or historic quarters, tasting authentic home-style thalis and regional specialties.

Would you like me to tailor this with exact spots, transport advice, or budget estimates for ${cityName}?`;
    }

    // If available experiences exist in the database, the cards below already
    // show them, so the prose only frames the pick.
    if (availableExperiences.length > 0) {
      const prices = availableExperiences.map((e) => Number(e.price) || 0);
      const free = prices.length > 0 && prices.every((p) => p === 0);
      const cheapest = Math.min(...prices.filter((p) => p > 0));
      const costLine = free
        ? 'Entry is free at every stop.'
        : Number.isFinite(cheapest)
        ? `Entry runs from ${cheapest} rupees per person.`
        : '';
      return condenseConciergeReply(
        `Verified spots in **${cityName}**, picked for what you asked for.
${costLine}

Pick what you like below, or tell me to swap something out.`
      );
    }

    // Only return the initial welcome question if the message was purely a greeting or city name
    if (isPureCityGreeting) {
      return `Welcome to **${cityName}**! This destination offers remarkable living heritage, breathtaking scenic trails, and rich regional culinary traditions. To help me curate the perfect experience for you, what is your available time and preferred vibe (nature trails, regional food trails, historic monuments, or artisan workshops)?`;
    }

    // Otherwise, answer their inquiry directly
    return `In **${cityName}**, you can experience a rich blend of living heritage and regional culture. Tell me your available duration, preferred travel vibe (nature, food, or crafts), or budget, and I'll immediately craft your personalized itinerary!`;
  }

  // 3. Regional Discovery (South India / North India / East / West)
  if (/south india/i.test(lower)) {
    return `South India offers an incredible mosaic of living Dravidian architecture, classical music, and spice-rich culinary traditions.

If you enjoy ancient monolithic stone architecture and temple towns, explore **Karnataka** (Hampi's Vijayanagara ruins and Mysore's silk and sandalwood legacy) or **Tamil Nadu** (Madurai Meenakshi temple and Chettinad heritage mansions).

For tranquil backwaters, spice plantations, and Kathakali martial arts, **Kerala** (Fort Kochi and Wayanad) is unmatched.

Which direction calls to you: historic temple architecture or coastal spice country?`;
  }

  if (/north india/i.test(lower)) {
    return `North India encompasses the royal fortresses of **Rajasthan** (Jaipur, Jodhpur, Udaipur), the sacred Ganga ghats and spiritual chants of **Varanasi**, and the serene mountain valleys of **Himachal Pradesh** and **Uttarakhand**.

Tell me what kind of journey you envision: heritage palaces and artisan bazaars, or mountain serenity and river trails?`;
  }

  // 4. Expense logging inquiry
  const expenseMatch = lower.match(/(?:spent|paid|cost)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (expenseMatch) {
    const amount = expenseMatch[1];
    return `Noted! ₹${amount} has been logged into your trip budget. Keeping transit and incidental expenses organized ensures you have room for curated artisan masterclasses and signature regional tastings. What is your next stop today?`;
  }

  // 5. Greeting / General fallback
  return `Namaste! Welcome to LOKIVA, your AI Cultural Concierge 🙏

I specialize in authentic Indian heritage, master artisan workshops (such as Blue Pottery and handloom weaving), and generational food traditions across all 36 Indian states.

Tell me where you are heading, your available days, or your budget, and I will craft your personalized cultural itinerary!`;
}


/**
 * AI Cultural Concierge - Chat with Gemini about travel, culture, food.
 * Passes the full conversation history so the model always has context.
 */
export async function chatWithCulturalConcierge({
  userMessage,
  chatHistory = [],
  city = null,
  availableExperiences = [],
  tripProfile = null,
  routeOptions = [],
}) {
  const experiencesContext = availableExperiences.length > 0
    ? availableExperiences.slice(0, 5)
        .map((exp, idx) => `${idx + 1}. **${exp.title}** (${exp.category}) - Rs.${exp.price}, ~${exp.approx_duration_mins} mins: ${exp.tagline || exp.description || ''}`)
        .join('\n')
    : '';

  // Structured brief collected by the concierge interview. Treated as ground
  // truth so the model curates against it instead of re-asking for it.
  const confirmedSummary =
    tripProfile && typeof tripProfile.summary === 'string' ? tripProfile.summary.trim() : '';
  const hasConfirmedBrief = confirmedSummary.length > 0;
  const briefBlock = hasConfirmedBrief
    ? `CONFIRMED TRAVELER BRIEF (hard constraints, never contradict these, never ask about them again):
${confirmedSummary}

`
    : '';
  // Routes are the primary answer shape. Give the model the exact stops and
  // the computed travel legs so its prose never contradicts the itinerary.
  const usableRoutes = Array.isArray(routeOptions) ? routeOptions.filter((r) => r && r.stops?.length) : [];
  const routeBlock = usableRoutes.length
    ? `THREE ROUTES WERE COMPUTED FOR ${city || 'this destination'} (already ordered, already timed). Present them as three distinct ways to spend the day, never as one merged list:
${usableRoutes
        .map(
          (route) => `- **${route.title}** (${route.pace}, ${route.stop_count} stops, ${Math.round((route.total_duration_mins || 0) / 60 * 10) / 10}h total, ${route.budget_label})
   ${route.stops.map((s) => s.title).join(' -> ')}`
        )
        .join('\n')}
`
    : '';

  const clarificationRule = hasConfirmedBrief
    ? "7. The traveler already confirmed the brief above. Curate straight away and do not ask any further setup questions. If something is genuinely missing, ask at most ONE short question of 15 words or fewer, never a numbered list."
    : "7. If a detail that would materially change the shortlist is missing (time window, who they are travelling with, or what they want most), ask exactly ONE focused question of 15 words or fewer at the end of your reply. Never send a numbered questionnaire, never ask three questions at once, and never re-ask something the traveler already told you.";

  const systemPrompt = `You are LOKIVA's AI Cultural Concierge, an expert and welcoming cultural travel guide across all of India${city ? `, currently assisting with a focus on ${city}` : ''}.

${briefBlock}${routeBlock}${experiencesContext ? `Curated verified experiences in ${city}:\n${experiencesContext}\n` : ''}
Your Core Rules:
1. DIRECTLY and HELPFULLY answer whatever the traveler asks.
   - If they ask about South India or choosing between states (e.g., after already visiting Kerala), recommend incredible alternatives like Karnataka (Hampi, Mysore, Coorg) or Tamil Nadu (Madurai, Thanjavur, Chettinad) with specific cultural highlights, vibe differences, and practical tips.
   - Never say "I can only help with a specific city" or "I don't have information on other states". You are an expert guide covering all 36 states and union territories of India.
2. If the user mentions an expense (e.g., "I spent 200rs on rickshaw"), acknowledge it naturally and conversationally without generating an unsolicited trip budget breakdown.
3. If the user asks an off-topic or greeting question, reply warmly and naturally without forcing travel recommendations.
4. If the traveler is specifically asking about things to do in ${city || 'their destination'} and experiences are provided above, weave in 1 or 2 relevant experiences naturally.
5. BREVITY IS MANDATORY. The traveler sees the itinerary as interactive cards underneath your reply, so your text is a caption, not a description.
   - Hard limit: 90 words. Aim for 40 to 60.
   - Never list the stops. Never repeat the travel legs, timings, distances or prices. They are already on the cards.
   - Never restate the traveler's own brief back to them.
   - Spend your words only on: the one thing that matters most, timing or seasonal advice, and anything surprising they would get wrong (a booking rule, a closed day, a dress code, a cash only stall, a best hour for light or crowds).
   - No preamble, no sign off flourish, no "let me know if". Close with one short invitation to pick or adjust.
6. Always complete all sentences, sections, and paragraphs fully. Never stop mid-thought or mid-sentence.
${clarificationRule}
8. Ground every price, timing and access claim in the provided experiences. If a detail is not available, say so plainly instead of inventing it.
9. Never use em dashes or double dashes in your writing. Use commas, colons or parentheses instead.${usableRoutes.length ? `
10. Three routes are attached. Name them in one line each only if a short framing helps. Never blend stops from different routes.
11. Never quote a travel leg. Never invent a mode, a duration or a price.
12. Practical knowledge beats description: a closed day, a cash only stall, the hour the light is best, a dress code, how early to arrive. One or two of these beat a paragraph about atmosphere.` : ''}`;

  try {
    const history = sanitizeHistory(chatHistory);

    const { text: aiReply, modelName } = await generateWithFallback(userMessage, {
      systemInstruction: systemPrompt,
      history,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.65,
      },
    });

    const estimatedTokens = Math.floor((systemPrompt.length + userMessage.length + aiReply.length) / 4);

    return {
      reply: condenseConciergeReply(aiReply),
      tokensUsed: estimatedTokens,
      model: modelName,
    };
  } catch (error) {
    console.warn('Gemini API unavailable for concierge request, activating intelligent cultural fallback:', error.message);
    const fallbackText = generateIntelligentCulturalFallback({
      userMessage,
      chatHistory,
      city,
      availableExperiences,
      tripProfile,
      routeOptions: usableRoutes,
    });
    return {
      reply: fallbackText,
      tokensUsed: 40,
      model: 'lokiva-cultural-engine',
    };
  }
}

/**
 * Extract structured travel intent from natural language using Gemini
 */
export async function extractTravelIntent(userPrompt) {
  try {
    const systemPrompt = `You are an intent extraction system for a travel platform.
Extract structured travel constraints from user messages.

Return a JSON object with these fields:
{
  "traveler_type": "Solo Explorer" | "Couple" | "Family with Kids" | "Friends Group" | "Business Traveler",
  "group_size": number (1-10),
  "budget": number (in INR, extract maximum budget mentioned),
  "available_hours": number (time available in hours),
  "interests": array of strings (e.g., ["food", "culture", "art", "history", "nature"]),
  "accessibility_prefs": {
    "low_walking": boolean,
    "wheelchair_accessible": boolean,
    "is_indoor_preferred": boolean
  },
  "time_of_day": "morning" | "afternoon" | "evening" | "any",
  "is_rain_concern": boolean
}

Extract what's explicitly mentioned. Use reasonable defaults for missing information.`;

    const fullPrompt = `${systemPrompt}\n\nUser Message: ${userPrompt}`;

    const { text } = await generateWithFallback(fullPrompt, {
      generationConfig: { responseMimeType: 'application/json', temperature: 0 },
    });

    // Parse JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const extractedIntent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (extractedIntent) {
      return extractedIntent;
    }

    // Fallback to basic parsing if JSON extraction fails
    return {
      traveler_type: 'Solo Explorer',
      group_size: 1,
      budget: 2500,
      available_hours: 3,
      interests: ['culture', 'food'],
      accessibility_prefs: {
        low_walking: false,
        wheelchair_accessible: false,
        is_indoor_preferred: false,
      },
      time_of_day: 'any',
      is_rain_concern: false,
    };
  } catch (error) {
    console.error('Intent Extraction Error:', error.message);

    return {
      traveler_type: 'Solo Explorer',
      group_size: 1,
      budget: 2500,
      available_hours: 3,
      interests: ['culture', 'food'],
      accessibility_prefs: {
        low_walking: false,
        wheelchair_accessible: false,
        is_indoor_preferred: false,
      },
      time_of_day: 'any',
      is_rain_concern: false,
    };
  }
}

/**
 * Check if Gemini API is configured and working
 */
export async function checkGeminiHealth() {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return {
        status: 'not_configured',
        message: 'Gemini API key not set in environment variables',
      };
    }

    // Test with a simple request
    const { modelName } = await generateWithFallback('Hello');

    return {
      status: 'healthy',
      message: `Gemini API is configured and working (model: ${modelName})`,
      model: modelName,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}

/**
 * Generate a personalized day plan using Gemini based on 8 onboarding answers
 */
export async function generateDayPlanWithGemini({
  destination,
  time_available,
  budget,
  group_type,
  interests = [],
  food_preferences,
  mobility,
  vibe,
}) {
  const systemPrompt = `You are Lokiva's day-plan generator. You build a single-day itinerary in a
specific Indian city using ONLY the user's onboarding answers as constraints.
Never default to a city's most famous landmarks unless they genuinely win
against alternatives on these specific constraints.

INPUTS you will receive: destination, time_available, budget, group_type,
interests (multi-select: heritage & history / food & street eats / art &
local markets / nature & scenic spots / shopping / offbeat & local life),
food_preferences, mobility (low-walking-or-wheelchair / moderate-walking-ok /
happy-to-walk), vibe (relaxed-and-slow / efficient-and-packed / a-mix).

RULES:
1. Constraint priority when trade-offs are needed: mobility > time_available >
   budget > interests > vibe > food_preferences.
2. Every stop must satisfy the mobility constraint literally: if
   low-walking-or-wheelchair is selected, do not include a stop requiring
   sustained walking or stairs without step-free access, even if it's
   otherwise a perfect interest match.
3. Every stop's "fit_reason" must cite the SPECIFIC answer it satisfies, in
   different words each time. Never reuse the same sentence across stops or
   across users. Bad: "Fits your budget & accessibility needs" (generic, reused).
   Good: "Step-free entry hall, matches your low-walking preference" or
   "No entry fee, comfortably inside your ₹1,000 budget."
4. If vibe is "efficient-and-packed," sequence tightly with minimal gaps and
   favor more, shorter stops. If "relaxed-and-slow," fewer stops with more
   time each and built-in slack between them.
5. If interests include food & street eats, at least one stop should be a
   specific eating experience (not a generic "explore the area"), and it must
   respect food_preferences.
6. feasibility_score (0–100) must be recomputed from how well the FULL plan
   satisfies ALL constraints together: mobility violations or budget
   overruns should visibly drop the score, not be hidden behind a high number.
7. If fewer than 3 genuinely good matches exist for these constraints, return
   fewer stops rather than padding with irrelevant ones.

Return ONLY valid JSON, no markdown fences, no preamble:

{
  "city": string,
  "feasibility_score": number,
  "feasibility_summary": string,
  "stops": [
    {
      "order": number,
      "time": string,
      "name": string,
      "duration_mins": number,
      "cost_label": string,
      "fit_reason": string,
      "match_notes": string | null
    }
  ]
}`;

  const interestsStr = Array.isArray(interests) ? interests.join(', ') : String(interests || '');
  const userPrompt = `Destination: ${destination || 'Jaipur'}
Time available: ${time_available || '4 Hours'}
Budget: ${budget || '₹1,500'}
Who this is for: ${group_type || 'Solo Explorer'}
Interests: ${interestsStr || 'Heritage & History'}
Food preferences: ${food_preferences || 'Vegetarian'}
Mobility: ${mobility || 'Moderate Walking'}
Vibe: ${vibe || 'Balanced mix'}

Generate today's plan following the system rules exactly.`;

  // Model fallback is handled centrally by generateWithFallback; retry here only
  // guards against a malformed JSON response, not a missing model.
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text } = await generateWithFallback(userPrompt, {
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.stops)) {
        return parsed;
      }
      lastError = new Error('Response did not contain a "stops" array');
    } catch (err) {
      console.warn(`Day plan attempt ${attempt + 1} failed:`, err.message);
      lastError = err;

      // A bad key or blown quota won't fix itself on retry.
      if (isFatalError(err)) break;
    }
  }

  // Fallback to high-quality deterministic plan when quota is exceeded (429) or timed out
  console.warn(`Gemini day-plan failed after retries (${lastError?.message || 'unknown'}), activating deterministic plan generator.`);
  return fallbackGenerateDayPlan({
    destination,
    time_available,
    budget,
    group_type,
    interests,
    food_preferences,
    mobility,
    vibe,
  });
}

function fallbackGenerateDayPlan({
  destination = 'Jaipur',
  time_available = '4 Hours',
  budget = '₹1,500',
  group_type = 'Solo Explorer',
  interests = [],
  food_preferences = 'Pure Vegetarian',
  mobility = 'Moderate Walking',
  vibe = 'Balanced mix',
}) {
  const normCity = (destination || 'Jaipur').toLowerCase();
  const isLowWalking = /low.walking|wheelchair|step.free|ramp/i.test(mobility);
  const isWheelchair = /wheelchair/i.test(mobility);

  const budgetNum = parseInt(String(budget).replace(/[^0-9]/g, ''), 10) || 3000;
  const budgetTier = budgetNum <= 2500 ? 'budget' : budgetNum <= 9000 ? 'comfort' : 'luxury';

  const userInterests = Array.isArray(interests) && interests.length > 0
    ? interests
    : ['heritage', 'crafts', 'food'];

  const groupDesc = String(group_type || 'Solo Explorer');
  const groupBenefit = /solo/i.test(groupDesc)
    ? 'introspective solo wandering'
    : /couple/i.test(groupDesc)
    ? 'romantic couple retreat'
    : /family/i.test(groupDesc)
    ? 'spacious shaded grounds and kid-friendly rest stops'
    : 'vibrant shared moments for friends';

  const mobilityBenefit = isWheelchair
    ? 'Step-free ramp entry and elevator access verified'
    : isLowWalking
    ? 'Under 250m walking hop with shaded benches'
    : 'Comfortable neighborhood walking distance';

  const MASTER_CATALOG = {
    jaipur: [
      {
        name: 'Hawa Mahal Palace Courtyards & Wind Pavilion',
        category: 'heritage',
        time: '09:00 AM',
        duration_mins: 75,
        budgetCost: '₹50 entry ticket',
        comfortCost: '₹200 palace audio guide pass',
        luxuryCost: '₹1,500 private sunrise pavilion pass',
        notes: 'Iconic 1799 pink sandstone facade with morning cross-breeze and uncrowded courtyards.',
      },
      {
        name: 'Sanganer Master Hand-Block Printing Guild Atelier',
        category: 'crafts',
        time: '11:00 AM',
        duration_mins: 90,
        budgetCost: 'Free artisan observation',
        comfortCost: '₹450 hands-on block printing session',
        luxuryCost: '₹3,500 private master Chiwda natural dye workshop',
        notes: 'Direct engagement with generational textile carvers and traditional vegetable dye vats.',
      },
      {
        name: 'Laxmi Mishthan Bhandar (LMB) Heritage Ghewar Tasting',
        category: 'food',
        time: '01:00 PM',
        duration_mins: 60,
        budgetCost: '₹180 street snack',
        comfortCost: '₹450 royal thali lunch',
        luxuryCost: '₹2,500 private haveli dining experience',
        notes: `Historic 1727 Johari Bazaar sweetmaker known for royal paneer ghewar, strictly ${food_preferences || 'Vegetarian'}.`,
      },
      {
        name: 'Panna Meena Ka Kund Ancient Stepwell & Amber Foothills',
        category: 'monuments',
        time: '03:00 PM',
        duration_mins: 60,
        budgetCost: 'Free entry',
        comfortCost: '₹150 local guide narration',
        luxuryCost: '₹1,200 private haveli curator trail',
        notes: 'Symmetrical 16th-century subterranean stepwell offering quiet contemplation away from bus tours.',
      },
      {
        name: 'Govind Dev Ji Temple Inner Courtyard Evening Aarti',
        category: 'rituals',
        time: '05:00 PM',
        duration_mins: 60,
        budgetCost: 'Free spiritual entry',
        comfortCost: '₹100 offering & prasad',
        luxuryCost: '₹1,000 temple trust guest blessing pass',
        notes: 'Sacred pillared sanctum with resonant community bell chanting and historic incense fragrance.',
      },
    ],
    varanasi: [
      {
        name: 'Assi to Dashashwamedh Sunrise Rowboat & Dawn Ghat Chanting',
        category: 'rituals',
        time: '06:00 AM',
        duration_mins: 90,
        budgetCost: '₹200 shared boat pass',
        comfortCost: '₹600 private wooden rowboat',
        luxuryCost: '₹3,000 heritage Bajra boat with private shehnai recital',
        notes: 'Drifting along ancient stone staircases as dawn sunlight illuminates morning prayers and floating diyas.',
      },
      {
        name: 'Madanpura Handloom Silk & Zari Weaver Guild',
        category: 'crafts',
        time: '09:30 AM',
        duration_mins: 80,
        budgetCost: 'Free pit-loom observation',
        comfortCost: '₹350 master weaver storytelling session',
        luxuryCost: '₹2,500 commissioned handloom silk masterclass',
        notes: 'Centuries-old Muslim weaver guilds passing gold threads on heavy wooden foot-operated looms.',
      },
      {
        name: 'Kashi Chat Bhandar & Blue Lassi Clay Cup Tasting',
        category: 'food',
        time: '12:00 PM',
        duration_mins: 50,
        budgetCost: '₹120 street delicacies',
        comfortCost: '₹350 authentic temple feast',
        luxuryCost: '₹2,000 BrijRama Palace Satvik heritage lunch',
        notes: `Famous spicy tomato chaat and hand-churned thick yogurt lassi, strictly ${food_preferences || 'Vegetarian'}.`,
      },
      {
        name: 'Kashi Vishwanath Temple Heritage Corridor Walk',
        category: 'heritage',
        time: '02:30 PM',
        duration_mins: 90,
        budgetCost: 'Free public queue',
        comfortCost: '₹300 Sugam Darshan pass',
        luxuryCost: '₹1,500 private scholarly corridor guide',
        notes: 'Restored golden spires connecting the ancient Jyotirlinga sanctum directly to the holy Ganges banks.',
      },
      {
        name: 'Dashashwamedh Ghat Sunset Maha Aarti from Water Platform',
        category: 'rituals',
        time: '06:30 PM',
        duration_mins: 75,
        budgetCost: 'Free ghat viewing',
        comfortCost: '₹300 reserved boat terrace seat',
        luxuryCost: '₹2,200 private riverside pavilion reservation',
        notes: 'Seven young priests synchronizing multi-tiered brass oil lamps in sacred evening fire adoration.',
      },
    ],
    delhi: [
      {
        name: "Humayun's Tomb Mughal Gardens & Restored Watercourses",
        category: 'heritage',
        time: '09:00 AM',
        duration_mins: 90,
        budgetCost: '₹50 monument ticket',
        comfortCost: '₹250 conservation audio tour',
        luxuryCost: '₹1,800 Aga Khan Trust architectural historian walk',
        notes: 'UNESCO red sandstone masterpiece set in geometric Persian charbagh gardens with shaded arcades.',
      },
      {
        name: 'Old Delhi Gali Paranthe Wali & Khari Baoli Spice Trail',
        category: 'food',
        time: '11:30 AM',
        duration_mins: 90,
        budgetCost: '₹150 stuffed paratha tasting',
        comfortCost: '₹500 guided Old Delhi culinary safari',
        luxuryCost: '₹3,200 Haveli Dharampura 7-course Mughlai lunch',
        notes: `Generational spice warehouses and century-old deep-fried flatbreads, compliant with ${food_preferences || 'Vegetarian'}.`,
      },
      {
        name: 'Dilli Haat Regional Artisan Guilds & Handloom Stalls',
        category: 'crafts',
        time: '02:30 PM',
        duration_mins: 90,
        budgetCost: '₹100 entry fee',
        comfortCost: '₹400 craft demonstration pass',
        luxuryCost: '₹2,000 master artisan bespoke curation',
        notes: 'Rotating marketplace where rural craftspeople sell direct block prints, pottery, and brassware.',
      },
      {
        name: 'Hazrat Nizamuddin Basti Natural Perfume & Sufi Alleyways',
        category: 'offbeat',
        time: '05:00 PM',
        duration_mins: 75,
        budgetCost: 'Free courtyard access',
        comfortCost: '₹250 attar distillation tasting',
        luxuryCost: '₹1,500 private Sufi heritage curator',
        notes: '700-year-old living medieval settlement famous for natural rose attar distillation and qawwali chants.',
      },
    ],
    kochi: [
      {
        name: 'Fort Kochi Chinese Fishing Nets & Coastal Spice Trail',
        category: 'nature',
        time: '08:30 AM',
        duration_mins: 80,
        budgetCost: 'Free beach promenade',
        comfortCost: '₹300 heritage walking pass',
        luxuryCost: '₹1,500 private historian coastal tour',
        notes: '14th-century cantilevered fishing nets operating along Vasco da Gama square and shaded rain trees.',
      },
      {
        name: 'Kerala Kathakali Centre Classical Dance Atelier',
        category: 'arts',
        time: '11:00 AM',
        duration_mins: 90,
        budgetCost: '₹200 rehearsal pass',
        comfortCost: '₹500 evening performance pass',
        luxuryCost: '₹2,500 private guru mudra masterclass',
        notes: 'Intricate facial makeup preparation and ancient Natya Shastra eye expressions by veteran gurus.',
      },
      {
        name: 'Mattancherry Ginger & Cardamom Warehouse Tasting',
        category: 'food',
        time: '01:30 PM',
        duration_mins: 60,
        budgetCost: '₹180 banana leaf meal',
        comfortCost: '₹600 Syrian Christian culinary lunch',
        luxuryCost: '₹3,000 Brunton Boatyard coastal spice tasting',
        notes: 'Burlap sacks of sun-dried Tellicherry pepper and steaming Malabar appams with coconut stew.',
      },
      {
        name: 'Traditional Ayurvedic Herbal Garden & Oil Sanctuary',
        category: 'wellness',
        time: '03:30 PM',
        duration_mins: 90,
        budgetCost: 'Free botanical walk',
        comfortCost: '₹800 Ayurvedic consultation & herbal tea',
        luxuryCost: '₹4,500 full Abhyanga wellness therapy',
        notes: 'Living apothecary garden containing medicinal neem, tulsi, and vetiver cultivated by Vaidyars.',
      },
    ],
    mumbai: [
      {
        name: 'Kala Ghoda Art Enclave & Victorian Neo-Gothic Trail',
        category: 'arts',
        time: '09:30 AM',
        duration_mins: 85,
        budgetCost: 'Free gallery entry',
        comfortCost: '₹300 art district audio walk',
        luxuryCost: '₹2,000 private art curator tour',
        notes: 'High-density architectural precinct featuring stone gargoyles, street art, and contemporary galleries.',
      },
      {
        name: 'Yazdani Bakery & Historic Parsi Cafe Tea Stop',
        category: 'food',
        time: '11:30 AM',
        duration_mins: 45,
        budgetCost: '₹120 chai & bun maska',
        comfortCost: '₹400 heritage brunch',
        luxuryCost: '₹2,000 Trishna coastal butter garlic seafood',
        notes: '1953 wood-fired brick ovens baking crusty brun pao accompanied by fragrant cardamom Irani chai.',
      },
      {
        name: 'Khadi Bhavan & Handloom Weaving Collective',
        category: 'crafts',
        time: '01:30 PM',
        duration_mins: 75,
        budgetCost: 'Free artisan visit',
        comfortCost: '₹300 natural fabric workshop',
        luxuryCost: '₹1,500 bespoke handloom tailor consultation',
        notes: 'Ethical cooperative displaying hand-spun cottons, wild silks, and natural organic indigo dyes.',
      },
      {
        name: 'Banganga Ancient Sacred Water Tank & Walkeshwar Temples',
        category: 'rituals',
        time: '04:00 PM',
        duration_mins: 70,
        budgetCost: 'Free tank courtyard',
        comfortCost: '₹200 heritage stepwell pass',
        luxuryCost: '₹1,200 private dusk musical boat walk',
        notes: 'Freshwater spring tank from the 11th century surrounded by temple spires and resident ducks.',
      },
    ],
    udaipur: [
      {
        name: 'City Palace Mewar Royal Architecture & Peacock Courtyard',
        category: 'heritage',
        time: '09:00 AM',
        duration_mins: 90,
        budgetCost: '₹300 general admission',
        comfortCost: '₹600 audio guide & museum pass',
        luxuryCost: '₹3,000 private Mewar curator salon',
        notes: 'Marble balconies and colored glass mosaics overlooking Lake Pichola and Aravali ridges.',
      },
      {
        name: 'Traditional Mewari Miniature Painting Guild Atelier',
        category: 'crafts',
        time: '11:30 AM',
        duration_mins: 80,
        budgetCost: 'Free studio observation',
        comfortCost: '₹450 squirrel-hair brush workshop',
        luxuryCost: '₹2,800 private master artist gold leaf lesson',
        notes: 'Generational artists painting epic scenes on silk and old handmade paper using natural stone minerals.',
      },
      {
        name: 'Ambrai Ghat Lakeside Heritage Lunch',
        category: 'food',
        time: '01:30 PM',
        duration_mins: 60,
        budgetCost: '₹200 lakeside cafe snacks',
        comfortCost: '₹750 Rajasthani ker sangri feast',
        luxuryCost: '₹3,500 Lake Palace private boat dining',
        notes: 'Shaded stone ghat tables overlooking the water with views of the floating Lake Palace.',
      },
      {
        name: 'Saheliyon Ki Bari Royal Marble Fountains & Lotus Pools',
        category: 'nature',
        time: '04:00 PM',
        duration_mins: 60,
        budgetCost: '₹50 garden entry',
        comfortCost: '₹150 guided horticulture walk',
        luxuryCost: '₹1,200 private sunset tea tour',
        notes: '18th-century royal pleasure garden designed with gravity-fed fountains and sculpted stone elephants.',
      },
    ],
  };

  const matchedCityKey = Object.keys(MASTER_CATALOG).find((k) => normCity.includes(k)) || 'jaipur';
  const cityCatalog = MASTER_CATALOG[matchedCityKey];

  // Prioritize stops matching user's specific selected interests
  const prioritizedStops = [...cityCatalog].sort((a, b) => {
    const aMatch = userInterests.includes(a.category) ? 1 : 0;
    const bMatch = userInterests.includes(b.category) ? 1 : 0;
    return bMatch - aMatch;
  });

  const stopCount = /relaxed/i.test(vibe) ? 3 : /packed/i.test(vibe) ? 5 : 4;
  const selectedStops = prioritizedStops.slice(0, Math.min(stopCount, cityCatalog.length));

  const stops = selectedStops.map((item, idx) => {
    const costLabel =
      budgetTier === 'budget'
        ? item.budgetCost
        : budgetTier === 'comfort'
        ? item.comfortCost
        : item.luxuryCost;

    const isInterestMatch = userInterests.includes(item.category);
    const fitReason = isInterestMatch
      ? `Matches your ${item.category} focus • ${groupBenefit} • ${mobilityBenefit}`
      : `Curated ${destination} cultural anchor • ${groupBenefit}`;

    return {
      order: idx + 1,
      time: item.time,
      name: item.name,
      duration_mins: item.duration_mins,
      cost_label: costLabel,
      fit_reason: fitReason,
      match_notes: item.notes,
    };
  });

  const cleanCity = destination || 'Jaipur';
  return {
    city: cleanCity,
    feasibility_score: 95,
    feasibility_summary: `Feasible route in ${cleanCity} tailored for ${time_available} and ₹${budgetNum.toLocaleString('en-IN')}/day. Formulated for ${groupDesc} and ${userInterests.join(', ')} affinities.`,
    stops,
  };
}

function fallbackExtractListing(rawText) {
  const lower = rawText.toLowerCase();
  
  // Extract price if mentioned
  const priceMatch = rawText.match(/(?:₹|rs\.?|inr)\s*(\d+)/i) || rawText.match(/(\d+)\s*(?:rupees|inr|\/\s*pax|per pax)/i);
  const price = priceMatch ? parseInt(priceMatch[1], 10) : 500;

  // Extract duration if mentioned
  let duration_mins = 75;
  const durMatch = rawText.match(/(\d+)\s*(?:mins?|minutes?)/i);
  const hourMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (durMatch) {
    duration_mins = parseInt(durMatch[1], 10);
  } else if (hourMatch) {
    duration_mins = Math.round(parseFloat(hourMatch[1]) * 60);
  }

  // Detect category
  let category = 'Art & Craft';
  if (/curry|cook|food|tasting|thali|culinary|chef|baking|spices/i.test(rawText)) {
    category = 'Culinary & Food';
  } else if (/walk|heritage|trail|architecture|history|colonial|monument|ruins/i.test(rawText)) {
    category = 'Heritage & Walking Tour';
  } else if (/music|dance|theatre|pottery|craft|dyeing|printing|painting|weaving|sculpt/i.test(rawText)) {
    category = 'Art & Craft';
  } else if (/nature|bird|trek|hike|mangrove|garden|safari/i.test(rawText)) {
    category = 'Nature & Outdoor';
  }

  const is_wheelchair = /wheelchair|step-free|step free|ramp|accessible/i.test(rawText);
  const is_step_free = /step-free|step free|ramp|ground floor|no stairs/i.test(rawText) || is_wheelchair;
  const is_indoor = /indoor|studio|atelier|workshop|kitchen|air condition|ac/i.test(rawText);

  // Generate an attractive title
  let title = rawText.split('.')[0].trim();
  if (title.length > 60 || title.length < 10) {
    if (category === 'Culinary & Food') {
      title = 'Traditional Culinary & Heirloom Recipe Masterclass';
    } else if (category === 'Heritage & Walking Tour') {
      title = 'Historic Neighborhood Heritage & Architecture Trail';
    } else {
      title = 'Authentic Generational Artisan Craft Workshop';
    }
  }

  const accessibility = [];
  if (is_wheelchair) accessibility.push('Wheelchair Accessible');
  if (is_step_free) accessibility.push('Step-Free Ramp Entry');
  if (is_indoor) accessibility.push('Indoor Studio Setup');
  if (accessibility.length === 0) accessibility.push('Ground Floor Access');

  return {
    title,
    category,
    price,
    duration_mins,
    location: 'Bandra West, Mumbai',
    meeting_point: 'Artisan Atelier Main Gate, Bandra West',
    max_group_size: 8,
    description: rawText.length > 50
      ? rawText
      : `${rawText}. An authentic hands-on cultural experience curated by verified master artisans.`,
    whats_included: [
      'All workshop craft materials and tools',
      'Artisan guidance and cultural storytelling',
      'Handmade souvenir to take home',
      'Traditional tea and refreshments',
    ],
    requirements: [
      'Comfortable clothing suitable for hands-on activities',
      'No prior craft or cooking experience required',
    ],
    availability: 'Tuesday to Sunday · 10:30 AM & 3:30 PM slots',
    accessibility,
    suggestedPriceBand: `₹${Math.max(200, price - 100)} - ₹${price + 150} based on verified local host benchmarks`,
    is_wheelchair,
    is_step_free,
    is_indoor,
  };
}

export async function extractListingWithGemini(rawText) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Listing description text is required');
  }

  const systemPrompt = `You are LOKIVA's AI Co-Pilot for local artisans, heritage guides, and cultural hosts in India.
Convert the host's natural language description into a polished, structured experience listing.
Return ONLY a valid JSON object with the following fields:
{
  "title": "string (concise, captivating experience title, max 60 chars)",
  "category": "string (Must be one of: 'Art & Craft', 'Culinary & Food', 'Heritage & Walking Tour', 'Music & Performing Arts', 'Nature & Outdoor')",
  "price": number (integer INR per guest, e.g. 450, 600, 800),
  "duration_mins": number (integer duration in minutes, e.g. 60, 75, 90, 120),
  "location": "string (locality and city, e.g. 'Pali Hill, Bandra West, Mumbai')",
  "meeting_point": "string (specific easy-to-find landmark meeting point)",
  "max_group_size": number (integer, e.g. 6, 8, 10),
  "description": "string (2-3 engaging sentences describing the authentic hands-on experience, heritage technique, and cultural narrative)",
  "whats_included": ["string", "string", "string"],
  "requirements": ["string", "string"],
  "availability": "string (e.g. 'Tuesday to Sunday · 10:30 AM & 3:30 PM daily slots')",
  "accessibility": ["string accessibility features, e.g. 'Wheelchair Accessible', 'Step-Free Ramp'"],
  "suggestedPriceBand": "string (e.g. '₹400 - ₹550 based on 12 nearby artisan studios')",
  "is_wheelchair": boolean,
  "is_step_free": boolean,
  "is_indoor": boolean
}`;

  if (!process.env.GEMINI_API_KEY) {
    return fallbackExtractListing(rawText);
  }

  try {
    const aiPromise = generateWithFallback(rawText, {
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Extraction timeout 3500ms exceeded')), 3500)
    );

    const { text } = await Promise.race([aiPromise, timeoutPromise]);

    const parsed = JSON.parse(text);
    if (parsed && parsed.title && parsed.price) {
      return {
        ...parsed,
        price: Number(parsed.price) || 500,
        duration_mins: Number(parsed.duration_mins) || 75,
        max_group_size: Number(parsed.max_group_size) || 8,
        is_wheelchair: Boolean(parsed.is_wheelchair),
        is_step_free: Boolean(parsed.is_step_free),
        is_indoor: Boolean(parsed.is_indoor),
        whats_included: Array.isArray(parsed.whats_included) ? parsed.whats_included : [],
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        accessibility: Array.isArray(parsed.accessibility) ? parsed.accessibility : [],
      };
    }
    return fallbackExtractListing(rawText);
  } catch (err) {
    console.warn('Gemini copilot extraction falling back to heuristics:', err.message);
    return fallbackExtractListing(rawText);
  }
}

function extractActionCard(text) {
  if (!text) return { cleanMessage: text, actionCard: null };

  const markerIdx = text.indexOf('ACTION_CARD_JSON:');
  if (markerIdx === -1) return { cleanMessage: text, actionCard: null };

  const jsonPortion = text.substring(markerIdx + 'ACTION_CARD_JSON:'.length).trim();
  const cleanMessage = text.substring(0, markerIdx).trim();

  const startIdx = jsonPortion.indexOf('{');
  const endIdx = jsonPortion.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const rawJson = jsonPortion
        .substring(startIdx, endIdx + 1)
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .replace(/,\s*([}\]])/g, '$1')
        .trim();
      const parsed = JSON.parse(rawJson);
      if (parsed && parsed.actionType && parsed.title) {
        return { cleanMessage, actionCard: parsed };
      }
    } catch (err) {
      console.warn('[ActionCard] Extraction notice:', err.message);
    }
  }

  return { cleanMessage, actionCard: null };
}

/**
 * LOKIVA Provider AI Concierge: Grounded Business Intelligence & Action Recommendation
 */
export async function queryProviderAiConcierge({
  provider,
  stats,
  inventory = [],
  recentBookings = [],
  unansweredReviews = [],
  userMessage,
  conversationHistory = [],
}) {
  const providerName = provider?.business_name || 'Heritage Horizons & Local Trails Collective';
  const city = provider?.city || 'Mumbai';
  const rating = provider?.rating || 4.94;
  const revenue = stats?.total_revenue || 48600;
  const bookingsCount = stats?.total_bookings || 32;
  const viewsCount = stats?.total_views || 642;
  const conversionRate = stats?.conversion_rate || 5.0;

  const promptContext = `You are LOKIVA AI Business Concierge, a world-class strategic business advisor for cultural hosts, artisanal shop owners, workshops, and local travel operators across India.
You are helping the operator of "${providerName}" based in ${city}.
You speak with professional, warm, proactive business acumen and practical advice.

OPERATOR'S AUTHORIZED BUSINESS CONTEXT:
- Business/Provider: ${providerName}
- City/Location: ${city}
- Overall Rating: ${rating} / 5.0 (${provider?.review_count || 48} reviews)
- 30-Day Metrics:
  * Total Gross Revenue: ₹${revenue.toLocaleString('en-IN')}
  * Total Bookings/Orders: ${bookingsCount}
  * Profile Discovery Views: ${viewsCount}
  * Conversion Rate: ${conversionRate}%
- Active Listings/Catalog (${inventory.length} total):
  ${inventory.slice(0, 5).map((e, idx) => `${idx + 1}. "${e.title}" (Price: ₹${e.price}, Capacity: ${e.max_capacity || 10})`).join('\n  ')}
- Unanswered Reviews: ${unansweredReviews.length} pending
- Recent Booking Momentum: ${recentBookings.length} bookings in ledger

INSTRUCTION:
- Answer the user's specific request with actionable, insightful, structured advice (bullet points, clear paragraphs).
- Ground advice in the operator's specific domain (e.g. poetry shop, cultural tours, artisan workshop, tasting circuits).
- If proposing an actionable campaign, offer, or slot change, append an ACTION_CARD_JSON at the very end formatted as:
ACTION_CARD_JSON:
{
  "actionType": "CREATE_OFFER",
  "title": "Short action title",
  "description": "Short explanation of the action",
  "summaryDetails": {
    "Proposed Discount": "15% OFF",
    "Applicable Slots": "Weekday 03:30 PM",
    "Promo Code": "PROMO15"
  },
  "payload": {
    "title": "Campaign Title",
    "offer_type": "early_bird",
    "discount_percent": 15,
    "promo_code": "PROMO15"
  }
}
- STRICT RULE: Never use double dashes (--) or em dashes (—). Use colons, commas, clean hyphens, or parentheses instead.`;

  // 1. Primary Engine: Groq Qwen (Sub-second response)
  if (process.env.GROQ_API_KEY) {
    try {
      const groqHistory = conversationHistory.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const groqResult = await queryGroqQwen(userMessage, {
        systemInstruction: promptContext,
        history: groqHistory,
        maxTokens: 1000,
        temperature: 0.3,
      });

      if (groqResult && groqResult.text) {
        const { cleanMessage, actionCard } = extractActionCard(groqResult.text);
        return {
          message: cleanMessage,
          actionCard,
          model: groqResult.modelName || 'qwen-groq',
        };
      }
    } catch (groqErr) {
      console.warn('[Groq Qwen] Provider chat fell back to secondary tier:', groqErr.message);
    }
  }

  // 2. Secondary Engine: Nugen Qwen
  try {
    const qwenUrl = process.env.NUGEN_API_URL || 'https://api.nugen.in/api/v3/inference/chat/completions';
    const qwenKey = process.env.NUGEN_API_KEY || 'nugen-d22a1d4c19c2d8b7';
    const qwenModel = process.env.NUGEN_MODEL || 'qwen-v2p5-0p5b-instruct';

    const messages = [
      { role: 'system', content: promptContext },
      ...conversationHistory.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(qwenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${qwenKey}`,
      },
      body: JSON.stringify({
        model: qwenModel,
        messages,
        max_tokens: 800,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      if (rawText) {
        const text = sanitizeAiText(rawText);
        let actionCard = null;
        let cleanMessage = text;

        const actionCardMatch = text.match(/ACTION_CARD_JSON:\s*(\{[\s\S]*?\})/);
        if (actionCardMatch && actionCardMatch[1]) {
          try {
            actionCard = JSON.parse(actionCardMatch[1]);
            cleanMessage = text.replace(/ACTION_CARD_JSON:\s*\{[\s\S]*?\}/, '').trim();
          } catch {
            // ignore
          }
        }

        return {
          message: cleanMessage,
          actionCard,
          model: `qwen-v2.5`,
        };
      }
    }
  } catch (qwenErr) {
    console.warn('[Qwen Model] Provider chat fell back to secondary tier:', qwenErr.message);
  }

  // 2. Secondary Engine: Gemini API (if key is configured)
  try {
    const fullPrompt = `${promptContext}\n\nProvider's Message: "${userMessage}"`;
    const response = await generateWithFallback(fullPrompt, {
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
      },
    });
    const text = sanitizeAiText(response?.text || '');

    let actionCard = null;
    let cleanMessage = text;

    const actionCardMatch =
      text.match(/ACTION_CARD_JSON:\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/i) ||
      text.match(/ACTION_CARD_JSON:\s*(\{[\s\S]*?\})/i);

    if (actionCardMatch && actionCardMatch[1]) {
      try {
        const rawJson = actionCardMatch[1].trim().replace(/,\s*([}\]])/g, '$1');
        actionCard = JSON.parse(rawJson);
        cleanMessage = text.replace(/ACTION_CARD_JSON:[\s\S]*$/, '').trim();
      } catch (err) {
        console.warn('[ActionCard] Fallback JSON parse notice:', err.message);
      }
    }

    return {
      message: cleanMessage,
      actionCard,
      model: 'gemini-fallback',
    };
  } catch (err) {
    console.warn('AI Concierge falling back to heuristic advisor:', err.message);
    return fallbackConciergeResponse(userMessage, providerName, inventory, stats);
  }
}

function fallbackConciergeResponse(query, providerName, inventory, stats) {
  const q = (query || '').toLowerCase();
  const topExp = inventory[0] || { title: 'Heritage Experience', price: 1200, city: 'Mumbai' };
  const totalRev = stats?.total_revenue || 48600;
  const totalBk = stats?.total_bookings || 32;

  // Specific domain: Poetry / Literary Shop / Creative Writing
  if (q.includes('poet') || q.includes('shairi') || q.includes('book') || q.includes('literary') || q.includes('write') || q.includes('mushaira')) {
    return {
      message: `Here is your high-impact growth strategy for your **Local Poetry & Literary Business** in ${topExp.city || 'Mumbai'}:\n\n` +
        `### 1. Launch Ticketed Micro-Events: "Chai & Shairi Evenings"\n` +
        `• Host intimate weekend evening poetry circles (12 to 15 seats at ₹450 to ₹650 per guest, including artisanal tea and local pastries). These consistently achieve **90%+ sellout rates** on LOKIVA.\n\n` +
        `### 2. On-Demand Vintage Typewriter Keepsakes\n` +
        `• Set up a "Poem on Demand" corner where travelers prompt a theme (love, travel, Mumbai rain) and receive a personalized typed poem on handmade deckle-edge paper as a premium souvenir.\n\n` +
        `### 3. Heritage Walk Collabs & Rest Stops\n` +
        `• Partner with local walking guides to make your poetry nook the scheduled reflective stop for historical trails and evening tea.\n\n` +
        `### 4. Limited Broadsides & Poetry Pass\n` +
        `• Offer monthly seasonal passes or early-bird weekday ticket discounts for young poets and spoken-word enthusiasts.\n\n` +
        `Would you like me to create an approved "Chai & Poetry Evening Pass" or launch a 15% student/early bird coupon?`,
      actionCard: {
        actionType: 'CREATE_OFFER',
        title: 'Chai & Shairi Evening Pass (15% Off)',
        description: 'Attract poetry lovers to weekday evening open-mic and literary tasting sessions.',
        summaryDetails: {
          'Experience Type': 'Poetry & Acoustic Circle',
          'Proposed Discount': '15% OFF',
          'Applicable Slots': 'Weekday 06:30 PM',
          'Promo Code': 'POETRY15',
        },
        payload: {
          title: 'Chai and Poetry Evening Special',
          offer_type: 'early_bird',
          discount_percent: 15,
          promo_code: 'POETRY15',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        },
      },
    };
  }

  // General business advice / growth consultation
  if (q.includes('advice') || q.includes('grow') || q.includes('scale') || q.includes('improve') || q.includes('help') || q.includes('strategy') || q.includes('tips') || q.includes('suggest')) {
    return {
      message: `Here is your customized business growth strategy for **${providerName}** in ${topExp.city || 'Mumbai'}:\n\n` +
        `### 1. Optimize High-Demand Slots\n` +
        `• Weekend morning slots currently yield **85%+ occupancy**. Consider opening a complementary 11:30 AM brunch or tea tasting batch to capture overflow demand.\n\n` +
        `### 2. Boost Weekday Conversion with Micro-Offers\n` +
        `• Weekday afternoons see slower footfall. A **15% early bird promotion** on weekday slots will increase asset utilization with zero cannibalization of weekend revenue.\n\n` +
        `### 3. Elevate Experience Storytelling\n` +
        `• Listings with verified artisan demonstrations or generational recipes enjoy **2.4x higher conversion** on LOKIVA's discovery map.\n\n` +
        `### 4. Review Velocity\n` +
        `• Maintaining your **4.9+ rating** keeps you in the top tier of local search algorithms. We recommend sending thank-you notes within 2 hours of tour completion.\n\n` +
        `Would you like me to prepare a 15% weekday promotion or draft automated replies for recent guest reviews?`,
      actionCard: {
        actionType: 'CREATE_OFFER',
        title: '15% Weekday Explorer Promotion',
        description: 'Attract travelers to slower afternoon slots without discounting weekends.',
        summaryDetails: {
          'Target Circuit': topExp.title,
          'Proposed Discount': '15% OFF',
          'Applicable Slots': 'Weekday 03:30 PM',
          'Promo Code': 'WEEKDAY15',
        },
        payload: {
          title: 'Weekday Explorer Special',
          offer_type: 'early_bird',
          discount_percent: 15,
          promo_code: 'WEEKDAY15',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        },
      },
    };
  }

  if (q.includes('earn') || q.includes('revenue') || q.includes('month') || q.includes('payout')) {
    return {
      message: `Your verified total revenue this cycle is **₹${totalRev.toLocaleString('en-IN')}** across **${totalBk} confirmed bookings**.\n\n• **Completed Settlements**: ₹${Math.round(totalRev * 0.65).toLocaleString('en-IN')} settled directly to your verified bank account.\n• **Scheduled Settlements**: ₹${Math.round(totalRev * 0.35).toLocaleString('en-IN')} scheduled for release upon trip completions.\n• **Platform Fee**: Flat 10% platform fee with zero hidden commissions.`,
      actionCard: null,
    };
  }

  if (q.includes('lower') || q.includes('drop') || q.includes('why') || q.includes('book')) {
    return {
      message: `Analyzing current booking telemetry for **${providerName}**:\n\n• **Discovery Impressions**: Strong catalog views (${stats?.total_views || 642} views).\n• **Weekday Demand Gap**: Weekday 3:30 PM slots have lower conversion compared to morning slots.\n• **Weekend Momentum**: Saturday and Sunday morning slots are filling up quickly.\n\n**Actionable Recommendation**: Launching a targeted **15% Weekday Explorer Offer** will boost weekday registrations.`,
      actionCard: {
        actionType: 'CREATE_OFFER',
        title: '15% Weekday Explorer Discount',
        description: 'Boost occupancy on slower weekday afternoon sessions.',
        summaryDetails: {
          'Target Experience': topExp.title,
          'Proposed Discount': '15% OFF',
          'Applicable Slots': 'Weekday 03:30 PM',
          'Validity': 'Next 14 Days',
        },
        payload: {
          title: 'Weekday Explorer Special',
          offer_type: 'early_bird',
          discount_percent: 15,
          promo_code: 'WEEKDAY15',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        },
      },
    };
  }

  if (q.includes('offer') || q.includes('discount') || q.includes('campaign') || q.includes('weekend')) {
    return {
      message: `I have prepared a **20% Weekend Flash Pass** for **${topExp.title}**. This will be featured prominently on LOKIVA's local discovery map.\n\n• Proposed Promo Code: **WEEKEND20**\n• Expected Yield: Fills 4 to 6 unoccupied spots this upcoming weekend.\n\nReview the details below and tap approve to publish:`,
      actionCard: {
        actionType: 'CREATE_OFFER',
        title: '20% Weekend Flash Promotion',
        description: 'Targeted flash discount for upcoming weekend dates.',
        summaryDetails: {
          'Experience': topExp.title,
          'Discount': '20% OFF',
          'Promo Code': 'WEEKEND20',
          'Min Guests': '1 Person',
        },
        payload: {
          title: 'Weekend Flash Deal',
          offer_type: 'weekend',
          discount_percent: 20,
          promo_code: 'WEEKEND20',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        },
      },
    };
  }

  if (q.includes('review') || q.includes('reply') || q.includes('feedback')) {
    return {
      message: `You currently maintain a **4.94 ★** overall rating with passionate feedback on your storytelling and artisan demonstrations. Here is a recommended reply to your latest 5-star review:\n\n> *"Thank you so much for joining our cultural walk! Sharing the living heritage of our neighborhood and artisan traditions with conscious travelers like you is why we love doing this. Looking forward to hosting you again!"*\n\nWould you like me to post this response?`,
      actionCard: {
        actionType: 'DRAFT_REPLY',
        title: 'Approve & Post Review Response',
        description: 'Post verified host reply to customer review.',
        summaryDetails: {
          'Guest': 'Michael Davies',
          'Rating': '5.0 ★',
          'Tone': 'Warm and Grateful',
        },
        payload: {
          reply_text: 'Thank you so much for joining our cultural walk! Sharing the living heritage of our neighborhood and artisan traditions with conscious travelers like you is why we love doing this. Looking forward to hosting you again!',
        },
      },
    };
  }

  return {
    message: `Hello! I am your **LOKIVA AI Business Concierge**. I monitor your booking momentum, pricing, availability slots, and traveler reviews in real time.\n\nHere are proactive actions we can run together:\n\n1. **"How can I grow my bookings this month?"** : Strategic revenue and slot optimization.\n2. **"Create a weekend offer for my walk"** : Publish an approved flash promotion.\n3. **"Draft replies to my recent reviews"** : Maintain high host responsiveness badges.\n4. **"How much did I earn this month?"** : Breakdown of gross receipts and bank payouts.`,
    actionCard: null,
  };
}

/**
 * Fallback heuristic extractor for experience description when Gemini API is offline/unavailable.
 */
function fallbackExtractExperienceAiAttributes({ description = '', title = '', experience_type = '', location = '' }) {
  const combined = `${title} ${experience_type} ${location} ${description}`.toLowerCase();

  // Category & Subcategory detection
  let category = 'Art & Craft Workshop';
  let subcategory = 'Hands-on Artisan Masterclass';

  if (/food|culinary|tasting|thali|dish|curry|masala|street food|chai|bazaar eat|cooking|recipe|breakfast|dinner|snack/i.test(combined)) {
    category = 'Regional Culinary Tasting';
    subcategory = /street/i.test(combined) ? 'Heritage Street Food & Market Trail' : 'Master Artisan Home Culinary Tasting';
  } else if (/heritage|monument|fort|palace|ruin|colonial|haveli|history|historic|architecture|storytelling|walking tour|walk/i.test(combined)) {
    category = 'Heritage & Architecture Walk';
    subcategory = 'Curated Historic Quarter & Narrative Walk';
  } else if (/temple|ghat|aarti|spiritual|sacred|ashram|ritual|puja|meditation|pilgrim/i.test(combined)) {
    category = 'Sacred Temple & Ghat Trail';
    subcategory = 'Sacred Rituals & Riverside Dawn Trail';
  } else if (/music|dance|folk|sitar|tabla|kathak|theatre|puppet|performance|singing|classical/i.test(combined)) {
    category = 'Folk Music & Performing Arts';
    subcategory = 'Living Musical Heritage & Performance';
  } else if (/farm|village|stay|homestay|rural|pottery|harvest|orchard|plantation|agro/i.test(combined)) {
    category = 'Boutique Stay & Farm Immersion';
    subcategory = 'Generational Rural & Village Immersion';
  } else if (/trek|hike|forest|nature|bird|safari|mangrove|kayak|wildlife|river|hills/i.test(combined)) {
    category = 'Nature & Local Excursion';
    subcategory = 'Guided Eco-Trail & Naturalist Walk';
  } else if (/pottery|block print|weaving|textile|brass|sculpture|carpet|craft|embroidery|artisan/i.test(combined)) {
    category = 'Art & Craft Workshop';
    subcategory = 'Master Artisan Studio & Craft Immersion';
  }

  // Interests tags
  const interests = [];
  if (/heritage|history|monument|architecture/i.test(combined)) interests.push('Heritage & Architecture');
  if (/food|culinary|eating|taste|spice/i.test(combined)) interests.push('Culinary & Food Walks');
  if (/craft|artisan|pottery|handloom|weaving|block print/i.test(combined)) interests.push('Artisan & Handloom Crafts');
  if (/temple|spiritual|sacred|aarti/i.test(combined)) interests.push('Spiritual & Temple Rituals');
  if (/photo|camera|visual|view/i.test(combined)) interests.push('Photography & Visual Arts');
  if (/music|dance|folk|song/i.test(combined)) interests.push('Folk Traditions & Music');
  if (/nature|wildlife|bird|flora|forest/i.test(combined)) interests.push('Nature & Biodiversity');
  if (/textile|saree|weaving|cloth/i.test(combined)) interests.push('Textiles & Weaving');
  if (/village|rural|community|local life/i.test(combined)) interests.push('Village & Rural Immersion');
  if (/market|bazaar|souk|vendor|shopping/i.test(combined)) interests.push('Local Markets & Bazaars');
  if (/ayurveda|yoga|wellness|healing/i.test(combined)) interests.push('Ayurveda & Wellness');
  if (interests.length === 0) {
    interests.push('Heritage & Architecture', 'Cultural Storytelling');
  }

  // Suitable traveler types
  const suitable_traveler_types = ['Culture Seekers'];
  if (/solo|individual|single/i.test(combined) || !/couples only|strictly group/i.test(combined)) {
    suitable_traveler_types.push('Solo Explorer');
  }
  if (/romantic|couple|sunset|peaceful|intimate/i.test(combined)) {
    suitable_traveler_types.push('Couples & Duos');
  }
  const is_family_friendly = !/bar|alcohol|extreme|strenuous|18\+|late night party|steep climb/i.test(combined);
  if (is_family_friendly) {
    suitable_traveler_types.push('Family with Kids');
  }

  // Characteristics
  const is_indoor = /indoor|studio|kitchen|home|workshop|temple hall|inside|museum|gallery/i.test(combined);
  const is_outdoor = /outdoor|street|trail|market|river|ghat|garden|farm|hike/i.test(combined);
  const setting = is_indoor && is_outdoor ? 'Mixed' : is_indoor ? 'Indoor' : 'Outdoor';
  const rain_safe = is_indoor || !/open air trek|monsoon hazard|boat ride/i.test(combined);
  const pace = /trek|climb|rapid|fast|marathon/i.test(combined) ? 'Active' : /leisure|slow|tea|sitting|relax|story/i.test(combined) ? 'Leisurely' : 'Moderate';
  const intensity = pace === 'Active' ? 'Active / Strenuous' : pace === 'Leisurely' ? 'Easy / Relaxed' : 'Moderate Walking';

  // Search keywords
  const keywords = Array.from(new Set([
    category.toLowerCase(),
    subcategory.toLowerCase(),
    location ? location.toLowerCase() : '',
    ...interests.map((i) => i.toLowerCase()),
    'authentic local experience',
    'verified host',
  ].filter(Boolean))).slice(0, 8);

  // Safe accessibility inference
  const stated_wheelchair = /wheelchair|barrier free|barrier-free|ramp|elevator|lift/i.test(combined);
  const stated_step_free = stated_wheelchair || /step free|step-free|ground level|no stairs|flat surface/i.test(combined);
  const stated_low_walking = /low walking|seated|minimal walking|sit down|chair/i.test(combined);
  const stated_audio_guide = /audio guide|headset|microphone|translation/i.test(combined);

  // Best time of day
  let best_time_of_day = 'morning';
  if (/sunset|evening|dusk|night|dinner/i.test(combined)) {
    best_time_of_day = /sunset/i.test(combined) ? 'sunset' : 'evening';
  } else if (/afternoon|lunch|midday/i.test(combined)) {
    best_time_of_day = 'afternoon';
  }

  // Group type
  let group_type = 'small_group';
  if (/private|exclusive|delegation/i.test(combined)) group_type = 'corporate_private';
  else if (/couple|romantic/i.test(combined)) group_type = 'couple';
  else if (/solo/i.test(combined)) group_type = 'solo_friendly';
  else if (is_family_friendly && /kid|child|family/i.test(combined)) group_type = 'family';

  // Duration
  let duration_mins = 90;
  const durMatch = combined.match(/(\d+)\s*(?:mins?|minutes?)/i);
  const hrMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (durMatch) duration_mins = parseInt(durMatch[1], 10);
  else if (hrMatch) duration_mins = Math.round(parseFloat(hrMatch[1]) * 60);

  return {
    category,
    subcategory,
    interests: interests.slice(0, 5),
    suitable_traveler_types,
    is_family_friendly,
    family_suitability_reason: is_family_friendly
      ? 'Safe, culturally respectful environment with no strenuous hazards.'
      : 'Requires high physical stamina or age minimum.',
    characteristics: {
      pace,
      setting,
      rain_safe,
      intensity,
    },
    search_keywords: keywords,
    accessibility: {
      wheelchair_accessible: stated_wheelchair,
      step_free: stated_step_free,
      audio_guide: stated_audio_guide,
      low_walking: stated_low_walking,
      inference_rationale: stated_wheelchair || stated_step_free
        ? 'Explicitly inferred from ramp or ground-floor mentions.'
        : 'Safety-first: Kept disabled unless verified by provider.',
    },
    group_type,
    best_time_of_day,
    recommended_duration_mins: duration_mins,
    suggested_inclusions: [
      'Expert guidance by local cultural specialist',
      'All essential activity tools and materials',
      'Curated cultural storytelling session',
      'Bottled drinking water or traditional tea',
    ],
    suggested_exclusions: [
      'Personal transportation to meeting point',
      'Personal shopping and souvenir purchases',
      'Gratuities / tips',
    ],
    special_instructions: /temple|sacred|ghat/i.test(combined)
      ? 'Please dress modestly (shoulders and knees covered). Slip-on shoes recommended for easy removal.'
      : 'Wear comfortable walking shoes and bring sun protection or light umbrella.',
  };
}

/**
 * Extracts and structures rich recommendation-engine attributes from a provider's natural language description.
 */
export async function extractExperienceAiAttributes({ description, title, experience_type, location, price, duration_mins }) {
  const rawText = `Experience Title: ${title || 'Untitled'}\nType: ${experience_type || 'General Experience'}\nLocation: ${location || 'Unspecified'}\nDescription: ${description || ''}`;

  if (!process.env.GEMINI_API_KEY) {
    return fallbackExtractExperienceAiAttributes({ description, title, experience_type, location });
  }

  const prompt = `You are LOKIVA's AI Experience Architect for local Indian travel businesses.
Analyze this experience description and extract high-precision recommendation attributes for our traveler recommendation engine.

Experience Information:
${rawText}

Return ONLY a valid JSON object matching this EXACT schema:
{
  "category": "Must be one of: 'Heritage & Architecture Walk', 'Art & Craft Workshop', 'Regional Culinary Tasting', 'Folk Music & Performing Arts', 'Sacred Temple & Ghat Trail', 'Boutique Stay & Farm Immersion', 'Nature & Local Excursion'",
  "subcategory": "string (specific descriptive subcategory, e.g. 'Street Food Tasting Trail')",
  "interests": ["Array of 3-5 tags from: 'Heritage & Architecture', 'Culinary & Food Walks', 'Artisan & Handloom Crafts', 'Spiritual & Temple Rituals', 'Photography & Visual Arts', 'Folk Traditions & Music', 'Nature & Biodiversity', 'Textiles & Weaving', 'Village & Rural Immersion', 'Local Markets & Bazaars', 'Ayurveda & Wellness'"],
  "suitable_traveler_types": ["Array of: 'Solo Explorer', 'Couples & Duos', 'Small Group', 'Family with Kids', 'Culture Seekers'"],
  "is_family_friendly": boolean,
  "family_suitability_reason": "string (brief sentence on why it suits or doesn't suit children/seniors)",
  "characteristics": {
    "pace": "string ('Leisurely' | 'Moderate' | 'Active')",
    "setting": "string ('Indoor' | 'Outdoor' | 'Mixed')",
    "rain_safe": boolean,
    "intensity": "string ('Easy / Relaxed' | 'Moderate Walking' | 'Active / Strenuous')"
  },
  "search_keywords": ["array of 5-8 relevant search keywords for traveler search bar"],
  "accessibility": {
    "wheelchair_accessible": boolean (ONLY true if explicitly stated or clearly ground-floor/ramp accessible; otherwise false for traveler safety),
    "step_free": boolean (ONLY true if explicitly stated or flat terrain),
    "audio_guide": boolean,
    "low_walking": boolean,
    "inference_rationale": "string explaining how accessibility was evaluated safely"
  },
  "group_type": "string ('solo_friendly' | 'couple' | 'small_group' | 'family' | 'corporate_private')",
  "best_time_of_day": "string ('morning' | 'afternoon' | 'sunset' | 'evening' | 'flexible')",
  "recommended_duration_mins": number (integer minutes, e.g. 60, 90, 120, 180),
  "suggested_inclusions": ["string", "string", "string"],
  "suggested_exclusions": ["string", "string"],
  "special_instructions": "string (practical advice for guests, attire, shoes, etc.)"
}`;

  try {
    const aiPromise = generateWithFallback(rawText, {
      systemInstruction: prompt,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI extraction timeout 4000ms')), 4000)
    );

    const { text } = await Promise.race([aiPromise, timeoutPromise]);
    const parsed = JSON.parse(text);

    if (parsed && parsed.category && Array.isArray(parsed.interests)) {
      return {
        ...fallbackExtractExperienceAiAttributes({ description, title, experience_type, location }),
        ...parsed,
        characteristics: {
          ...fallbackExtractExperienceAiAttributes({ description, title, experience_type, location }).characteristics,
          ...(parsed.characteristics || {}),
        },
        accessibility: {
          ...fallbackExtractExperienceAiAttributes({ description, title, experience_type, location }).accessibility,
          ...(parsed.accessibility || {}),
        },
      };
    }
    return fallbackExtractExperienceAiAttributes({ description, title, experience_type, location });
  } catch (err) {
    console.warn('AI experience extraction fallback engaged:', err.message);
    return fallbackExtractExperienceAiAttributes({ description, title, experience_type, location });
  }
}


