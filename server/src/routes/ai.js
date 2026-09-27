import express from 'express';
import { dbAll, dbGet } from '../db/db.js';
import { parseIntentFromPrompt, scoreExperience } from '../services/algorithms.js';
import {
  chatWithCulturalConcierge,
  extractTravelIntent,
  checkGeminiHealth,
  generateDayPlanWithGemini,
} from '../services/geminiService.js';
import { buildRouteOptions } from '../services/routeBuilder.js';

export const aiRouter = express.Router();

function sanitizeAiText(text) {
  if (!text) return '';
  return text
    .replace(/[\u2014\u2015]/g, ', ')
    .replace(/[\u2013]/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// POST /ai/day-plan - Generate day plan using Gemini from 8 onboarding answers
aiRouter.post('/day-plan', async (req, res) => {
  try {
    const {
      destination,
      time_available,
      budget,
      group_type,
      interests,
      food_preferences,
      mobility,
      vibe,
    } = req.body;

    const plan = await generateDayPlanWithGemini({
      destination,
      time_available,
      budget,
      group_type,
      interests,
      food_preferences,
      mobility,
      vibe,
    });

    res.json(plan);
  } catch (err) {
    console.error('Day Plan Generation Error:', err);
    res.status(500).json({ detail: err.message || 'Failed to generate day plan' });
  }
});

// GET /ai/health - Check AI service status
aiRouter.get('/health', async (req, res) => {
  try {
    const status = await checkGeminiHealth();
    res.json(status);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /ai/intent - extract structured intent from prompt
aiRouter.post('/intent', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ detail: 'Prompt is required' });

    const intent = parseIntentFromPrompt(prompt);
    res.json(intent);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

const KNOWN_CITIES = [
  'Mumbai', 'Jaipur', 'Delhi', 'New Delhi', 'Varanasi', 'Banaras', 'Kashi',
  'Goa', 'Kochi', 'Cochin', 'Udaipur', 'Agra', 'Amritsar', 'Bengaluru',
  'Bangalore', 'Kolkata', 'Calcutta', 'Hyderabad', 'Pune', 'Chennai', 'Madurai',
  'Pondicherry', 'Puducherry', 'Hampi', 'Rishikesh', 'Haridwar', 'Shimla',
  'Darjeeling', 'Srinagar', 'Lucknow', 'Bhopal', 'Bhubaneswar', 'Mysore',
  'Mysuru', 'Jodhpur', 'Puri', 'Shillong', 'Gangtok', 'Munnar', 'Khajuraho',
  'Mathura', 'Bodh Gaya', 'Mahabalipuram', 'Leh', 'Ujjain', 'Patan'
];

function detectCityFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  // If user is asking a broad regional or state-level decision question, do not force a single city
  if (/(which state|what state|suggest a state|south india|north india|east india|west india|where to go in india|where should i go|compare)/i.test(lower)) {
    return null;
  }

  for (const city of KNOWN_CITIES) {
    // Check if city name is mentioned
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) {
      // Check if city was mentioned negatively (e.g., "already visited Kerala", "already been to Kochi", "outside of Goa")
      const negativeRegex = new RegExp(`(already visited|already been to|not interested in|other than|except|outside of|excluding|leaving)\\s+([\\w\\s]*\\b)?${city}\\b`, 'i');
      if (negativeRegex.test(text)) {
        continue;
      }

      if (/bangalore/i.test(city)) return 'Bengaluru';
      if (/puducherry/i.test(city)) return 'Pondicherry';
      if (/calcutta/i.test(city)) return 'Kolkata';
      if (/banaras|kashi/i.test(city)) return 'Varanasi';
      if (/cochin/i.test(city)) return 'Kochi';
      if (/mysuru/i.test(city)) return 'Mysore';
      if (/new delhi/i.test(city)) return 'Delhi';
      return city;
    }
  }
  return null;
}

/**
 * Folds a confirmed traveler brief (collected by the concierge interview) into
 * the parsed intent so the deterministic ranking engine scores against the
 * traveler's real constraints instead of raw keyword guesses.
 */
function mergeTripProfile(intent, profile) {
  if (!profile || typeof profile !== 'object') return intent;
  const merged = { ...intent };
  const p = profile;

  if (Array.isArray(p.interests) && p.interests.length > 0) {
    merged.interests = p.interests.filter((i) => typeof i === 'string' && i.trim());
  }
  const budgetInr = Number(p.budget_inr);
  if (Number.isFinite(budgetInr) && budgetInr > 0) merged.budget = budgetInr;
  const hours = Number(p.available_hours);
  if (Number.isFinite(hours) && hours > 0) {
    merged.available_hours = hours;
    merged.duration_days = hours >= 16 ? 2 : 1;
  }
  if (typeof p.traveler_type === 'string' && p.traveler_type.trim()) {
    merged.traveler_type = p.traveler_type.trim();
  }
  const groupSize = Number(p.group_size);
  if (Number.isFinite(groupSize) && groupSize > 0) merged.group_size = groupSize;
  if (typeof p.start_time === 'string' && p.start_time.trim()) {
    merged.preferred_start_time = p.start_time.trim();
  }

  const accessibility = typeof p.accessibility === 'string' ? p.accessibility : '';
  const lowWalking = /walking|step|seating/i.test(accessibility);
  const wheelchair = /steps*free|wheelchair/i.test(accessibility);
  const isFamily = /family|elder|parent|senior/i.test(String(p.companions || ''));
  if (lowWalking || wheelchair || isFamily) {
    merged.accessibility_prefs = {
      ...(merged.accessibility_prefs || {}),
      low_walking: lowWalking || Boolean(merged.accessibility_prefs?.low_walking),
      wheelchair,
      family_friendly: isFamily,
    };
  }
  return merged;
}

/**
 * Shortlist size follows the confirmed time window. Two stops for a tight
 * window, three when the traveler has half a day or more.
 */
function recommendationLimitForProfile(profile) {
  const hours = Number(profile?.available_hours);
  if (Number.isFinite(hours) && hours >= 16) return 4;
  if (Number.isFinite(hours) && hours >= 5) return 3;
  return 2;
}

// Helper: Generate contextual rule-based response when Gemini is offline
export function generateFallbackResponse(message, city, recommendedPlaces = []) {
  const msg = (message || '').toLowerCase();
  let baseReply = '';

  if (msg.includes('food') || msg.includes('eat') || msg.includes('street') || msg.includes('culinary')) {
    baseReply = `For culinary discovery in **${city}**, I've prioritized authentic generational food traditions, local sweet-makers, and iconic flavor alleys.`;
  } else if (msg.includes('craft') || msg.includes('pottery') || msg.includes('textile') || msg.includes('art')) {
    baseReply = `For artisanal exploration in **${city}**, I've curated hands-on workshops with master craftspeople so you can experience living traditions firsthand.`;
  } else if (msg.includes('family') || msg.includes('kids') || msg.includes('children')) {
    baseReply = `For traveling with family in **${city}**, I've chosen comfortable, accessible spots with gentle pacing and engaging cultural stories for all ages.`;
  } else if (msg.includes('budget') || msg.includes('cheap') || msg.includes('affordable')) {
    baseReply = `To keep within your budget in **${city}**, these selections offer maximum cultural immersion with low or no entry fees.`;
  } else if (msg.includes('hour') || msg.includes('time') || msg.includes('duration') || msg.includes('day')) {
    baseReply = `Based on your available time in **${city}**, I've selected signature stops that are nearby each other to minimize transit and avoid rushing.`;
  } else {
    baseReply = `Based on your request, here are signature cultural highlights in **${city}** that capture its authentic heritage.`;
  }

  if (Array.isArray(recommendedPlaces) && recommendedPlaces.length > 0) {
    const names = recommendedPlaces.map((r) => `**${r.experience?.title || r.title || 'Selected Experience'}**`).join(' and ');
    return `${baseReply}\n\nI recommend starting with ${names}.\n\n*If your available time, budget, or preferred vibe changes, just let me know and I'll adapt your recommendations immediately!*`;
  }

  return baseReply;
}

// POST /ai/concierge - real AI Cultural Concierge using destination-first flow
aiRouter.post('/concierge', async (req, res) => {
  try {
    const {
      message,
      chat_history = [],
      city: requestedCity,
      state = 'India',
      trip_profile: tripProfile = null,
    } = req.body;
    if (!message) return res.status(400).json({ detail: 'Message is required' });

    // Confirmed brief from the concierge interview, if the traveler answered
    const confirmedProfile =
      tripProfile && typeof tripProfile === 'object' && typeof tripProfile.summary === 'string' && tripProfile.summary.trim()
        ? tripProfile
        : null;
    const hasConfirmedBrief = Boolean(confirmedProfile);

    const cleanMsg = message.trim().toLowerCase();
    const isGreeting = /^(hi|hello|hey|namaste|hola|good\s+(morning|afternoon|evening)|sup|yo|start|help|hi there|hello there|hi how are you|hello how are you|how are you|hey there|greetings)[\s!.]*$/i.test(cleanMsg);

    // 1. Resolve active destination city
    // A. Check current message for explicit city mention
    const mentionedInMessage = detectCityFromText(message);

    // B. Check user turns ONLY in chat_history (NEVER scan assistant turns, which list example cities!)
    let cityInUserHistory = null;
    if (Array.isArray(chat_history)) {
      for (let i = chat_history.length - 1; i >= 0; i--) {
        const turn = chat_history[i];
        if (turn && turn.role === 'user' && typeof turn.content === 'string') {
          const detected = detectCityFromText(turn.content);
          if (detected) {
            cityInUserHistory = detected;
            break;
          }
        }
      }
    }

    // Do not use requestedCity if it was defaulted to 'Mumbai' without user input
    const cleanRequestedCity = requestedCity && requestedCity.trim() && requestedCity.toLowerCase() !== 'mumbai'
      ? requestedCity.trim()
      : null;

    // If the message is asking about a region, multi-state comparison, or general advice across India, don't lock to a single city
    const isRegionalOrGeneral = /(which state|suggest.*state|what state|south india|north india|east india|west india|where to go in india|where should i go|already visited|other than|except|outside of|compare)/i.test(cleanMsg);

    const profileCity =
      confirmedProfile && typeof confirmedProfile.destination === 'string' && confirmedProfile.destination.trim()
        ? confirmedProfile.destination.trim()
        : null;

    let activeCity = isRegionalOrGeneral
      ? null
      : (mentionedInMessage || cleanRequestedCity || cityInUserHistory || profileCity || null);
    // Intent starts from the raw prompt, then the confirmed brief overrides it
    const intent = mergeTripProfile(parseIntentFromPrompt(message), confirmedProfile);

    // 2. CASE: General inquiries, multi-day plans, or region discovery (No single city fixed)
    if (!activeCity || isGreeting) {
      let aiResponse;
      try {
        aiResponse = await chatWithCulturalConcierge({
          userMessage: message,
          chatHistory: chat_history,
          city: null,
          availableExperiences: [],
          tripProfile: confirmedProfile,
        });
      } catch (aiErr) {
        console.warn('AI Concierge (general) model unavailable, using fallback:', aiErr.message);
        aiResponse = {
          reply: generateFallbackResponse(message, 'India', []),
          tokensUsed: 0,
          model: 'cultural-concierge-local',
        };
      }

      // Strict Rule: Never attach recommended experience cards when destination has not been decided or on greetings
      return res.json({
        reply: sanitizeAiText(aiResponse.reply),
        tokens_used: aiResponse.tokensUsed || 0,
        model: aiResponse.model || 'gemini-3.5-flash',
        extracted_intent: intent,
        suggested_experiences: [],
        context_destination: null,
        state: 'India',
      });
    }

    // 4. Destination IS known (activeCity is set)
    // Check if user ONLY mentioned the city and hasn't asked for places or shared constraints yet
    const strippedMsg = cleanMsg.replace(/[.,!]/g, '').trim();
    const isJustCity =
      strippedMsg === activeCity.toLowerCase() ||
      strippedMsg === `i want to explore ${activeCity.toLowerCase()}` ||
      strippedMsg === `i am in ${activeCity.toLowerCase()}` ||
      strippedMsg === `heading to ${activeCity.toLowerCase()}` ||
      strippedMsg === `visiting ${activeCity.toLowerCase()}` ||
      strippedMsg === `going to ${activeCity.toLowerCase()}` ||
      strippedMsg === `explore ${activeCity.toLowerCase()}`;

    if (isJustCity) {
      return res.json({
        reply: sanitizeAiText(
          `**${activeCity}** is a wonderful pick. Before I shortlist anything: how much time do you have in the city?`
        ),
        tokens_used: 20,
        model: 'lokiva-instant',
        extracted_intent: intent,
        suggested_experiences: [],
        context_destination: activeCity,
        state,
      });
    }

    // 5. User has specified activeCity and provided preferences OR asked a question / for recommendations
    // Query experiences for activeCity
    const cityExps = await dbAll(
      `SELECT id, title, category, price, approx_duration_mins, tagline, description, cultural_context,
              area_name, latitude, longitude, best_time_of_day, is_family_friendly, rating,
              wheelchair_accessible, low_walking, is_indoor, is_rain_safe, is_hidden_gem, image_urls, tags
       FROM experiences
       WHERE LOWER(city) = ? AND is_active = 1
       LIMIT 40`,
      [activeCity.toLowerCase()]
    );

    // Score experiences based on extracted intent
    const scoredExperiences = cityExps.map((exp) => {
      const { score, match_reasons } = scoreExperience(exp, intent, null, { is_raining: false });
      return {
        experience: {
          ...exp,
          is_indoor: Boolean(exp.is_indoor),
          is_rain_safe: Boolean(exp.is_rain_safe),
          is_hidden_gem: Boolean(exp.is_hidden_gem),
          low_walking: Boolean(exp.low_walking),
          wheelchair_accessible: Boolean(exp.wheelchair_accessible),
          tags: typeof exp.tags === 'string' ? JSON.parse(exp.tags || '[]') : exp.tags || [],
          image_urls: typeof exp.image_urls === 'string' ? JSON.parse(exp.image_urls || '[]') : exp.image_urls || [],
        },
        score,
        match_reasons,
        estimated_start_time: '10:00 AM',
      };
    });

    scoredExperiences.sort((a, b) => b.score - a.score);

    // Three distinct routes, each with a leg by leg travel synopsis. This is
    // the primary answer shape, the flat shortlist stays for compatibility.
    const routeOptions = buildRouteOptions({
      experiences: scoredExperiences,
      intent,
      profile: confirmedProfile || {},
      city: activeCity,
    });

    // Keep the shortlist tight, and widen it only when the confirmed brief
    // genuinely leaves room for more than a couple of stops.
    const shortlistSize = recommendationLimitForProfile(confirmedProfile);
    const topRecommendations = scoredExperiences.slice(0, shortlistSize);

    // Check if the user is asking for places/activities or sharing constraints (vs asking general knowledge question)
    const hasPreferencesOrSeekingRecs =
      /(hour|hr|half\s*day|full\s*day|budget|₹|rs|rupee|family|kids|children|couple|solo|friend|food|eat|street|craft|pottery|textile|walk|temple|fort|palace|monument|museum|recommend|places|spot|visit|attraction|itinerary|see|do|what to|where to)/i.test(cleanMsg) ||
      Boolean(intent.budget && intent.budget !== 2500) ||
      Boolean(intent.available_hours && intent.available_hours !== 8) ||
      Boolean(intent.traveler_type && intent.traveler_type !== 'Solo Explorer') ||
      Boolean(intent.interests && intent.interests.length > 0);

    const placesToAttach = hasPreferencesOrSeekingRecs || hasConfirmedBrief ? topRecommendations : [];

    let aiResponse;
    try {
      aiResponse = await chatWithCulturalConcierge({
        userMessage: message,
        chatHistory: chat_history,
        city: activeCity,
        availableExperiences: topRecommendations.map((r) => r.experience),
        tripProfile: confirmedProfile,
        routeOptions,
      });
    } catch (aiErr) {
      console.warn('AI Concierge model unavailable, using contextual fallback:', aiErr.message);
      aiResponse = {
        reply: generateFallbackResponse(message, activeCity, placesToAttach),
        tokensUsed: 0,
        model: 'cultural-concierge-local',
      };
    }

    res.json({
      reply: sanitizeAiText(aiResponse.reply),
      tokens_used: aiResponse.tokensUsed || 0,
      model: aiResponse.model || 'gemini-3.1-flash-lite',
      extracted_intent: intent,
      suggested_experiences: placesToAttach,
      routes: routeOptions,
      context_destination: activeCity,
      state,
    });
  } catch (err) {
    console.error('Concierge Error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// POST /ai/chat - legacy endpoint (falls back to rule-based if Gemini not configured)
aiRouter.post('/chat', async (req, res) => {
  try {
    const { message, chat_history = [], city = 'Jaipur' } = req.body;
    if (!message) return res.status(400).json({ detail: 'Message is required' });

    // Check if Gemini is configured
    const health = await checkGeminiHealth();
    const isConfigured = health.status === 'healthy';

    if (!isConfigured) {
      // Fallback to rule-based responses if OpenAI not configured
      return res.json({
        reply: getRuleBasedResponse(message, city),
        extracted_intent: parseIntentFromPrompt(message),
        suggested_experiences: [],
        context_destination: city,
      });
    }

    // Use OpenAI
    const cityExps = await dbAll(
      `SELECT title, category, price, approx_duration_mins, tagline, description, cultural_context,
              wheelchair_accessible, low_walking, is_indoor, is_rain_safe, is_hidden_gem
       FROM experiences
       WHERE LOWER(city) = ? AND is_active = 1
       LIMIT 8`,
      [city.toLowerCase()]
    );

    const aiResponse = await chatWithCulturalConcierge({
      userMessage: message,
      chatHistory: chat_history,
      city,
      availableExperiences: cityExps,
    });

    const intent = await extractTravelIntent(message);

    const scoredExperiences = cityExps.map((exp) => {
      const { score, match_reasons } = scoreExperience(exp, intent, null, { is_raining: false });
      return {
        experience: {
          ...exp,
          is_indoor: Boolean(exp.is_indoor),
          is_rain_safe: Boolean(exp.is_rain_safe),
          is_hidden_gem: Boolean(exp.is_hidden_gem),
          low_walking: Boolean(exp.low_walking),
          wheelchair_accessible: Boolean(exp.wheelchair_accessible),
          tags: typeof exp.tags === 'string' ? JSON.parse(exp.tags || '[]') : exp.tags || [],
          image_urls: typeof exp.image_urls === 'string' ? JSON.parse(exp.image_urls || '[]') : exp.image_urls || [],
        },
        score,
        match_reasons,
      };
    });

    scoredExperiences.sort((a, b) => b.score - a.score);

    res.json({
      reply: aiResponse.reply,
      extracted_intent: intent,
      suggested_experiences: scoredExperiences.slice(0, 4),
      context_destination: city,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});



// GET /recommendations - multi-factor scored recommendations
aiRouter.get('/recommendations', async (req, res) => {
  try {
    const { city = 'Jaipur', prompt, traveler_type, max_budget, limit = '10' } = req.query;

    let intent = prompt ? parseIntentFromPrompt(prompt) : null;
    if (!intent) {
      intent = {
        traveler_type: traveler_type || 'Family with Kids',
        budget: max_budget ? parseFloat(max_budget) : 3000,
        interests: ['culture', 'food', 'workshop'],
        accessibility_prefs: { low_walking: false },
      };
    }

    const exps = await dbAll('SELECT * FROM experiences WHERE LOWER(city) = ? AND is_active = 1', [city.toLowerCase()]);
    const scoredList = exps.map((exp) => {
      const { score, match_reasons } = scoreExperience(exp, intent, null, { is_raining: false });
      return {
        experience: {
          ...exp,
          is_indoor: Boolean(exp.is_indoor),
          is_rain_safe: Boolean(exp.is_rain_safe),
          is_hidden_gem: Boolean(exp.is_hidden_gem),
          is_family_friendly: Boolean(exp.is_family_friendly),
          low_walking: Boolean(exp.low_walking),
          wheelchair_accessible: Boolean(exp.wheelchair_accessible),
          tags: typeof exp.tags === 'string' ? JSON.parse(exp.tags || '[]') : exp.tags || [],
          image_urls: typeof exp.image_urls === 'string' ? JSON.parse(exp.image_urls || '[]') : exp.image_urls || [],
        },
        score,
        match_reasons,
        estimated_start_time: '10:00 AM',
      };
    });

    scoredList.sort((a, b) => b.score - a.score);
    res.json(scoredList.slice(0, parseInt(limit, 10)));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});
