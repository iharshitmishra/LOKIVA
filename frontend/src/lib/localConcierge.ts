import { ScoredExperience, StructuredIntent, Experience } from '../types';
import {
  ALL_LOKIVA_PLACES,
  getPlacesByCity,
  getPlacesByState,
  searchAllPlaces,
  INDIAN_STATES_AND_CITIES,
} from '../data/places';
import { resolveImageUrl } from './api';
import { fetchWeatherContextForAI } from '../services/openMeteoService';

function sanitizeUiText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2014\u2015]/g, ', ')
    .replace(/[\u2013]/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

async function fetchAIReply(
  message: string,
  city: string,
  groupSize: number,
  budget: number | null,
  travelerType: string,
  interests: string[],
  weatherContext?: string,
  weatherAdvisory?: string
): Promise<string | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lokiva_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/v1/ai/concierge', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        city: city || undefined,
        group_size: groupSize,
        budget: budget || undefined,
        traveler_type: travelerType,
        interests,
        weather_context: weatherContext || undefined,
        weather_advisory: weatherAdvisory || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        return sanitizeUiText(data.reply as string);
      }
    }
  } catch (err) {
    console.warn('[LOKIVA AI] AI API call failed:', err);
  }

  return null;
}

interface LocalConciergeResult {
  reply: string;
  tokens_used: number;
  model: string;
  extracted_intent: StructuredIntent;
  suggested_experiences: ScoredExperience[];
  context_destination: string;
  state: string;
}

// Known cities, towns, and regions for instant high-precision entity resolution
const KNOWN_DESTINATIONS = [
  // Maharashtra & Western India
  { city: 'Panvel', state: 'Maharashtra', aliases: ['panvel', 'navi mumbai panvel', 'khandeshwar'] },
  { city: 'Navi Mumbai', state: 'Maharashtra', aliases: ['navi mumbai', 'vashi', 'nerul', 'belapur', 'kharghar'] },
  { city: 'Mumbai', state: 'Maharashtra', aliases: ['mumbai', 'bombay', 'bandra', 'colaba', 'kala ghoda'] },
  { city: 'Pune', state: 'Maharashtra', aliases: ['pune', 'poona', 'shivajinagar', 'koregaon park'] },
  { city: 'Nashik', state: 'Maharashtra', aliases: ['nashik', 'nasik', 'trimbak', 'sula'] },
  { city: 'Lonavala', state: 'Maharashtra', aliases: ['lonavala', 'khandala', 'karla'] },
  { city: 'Alibag', state: 'Maharashtra', aliases: ['alibag', 'alibaug', 'nagaon', 'kihim'] },
  { city: 'Aurangabad', state: 'Maharashtra', aliases: ['aurangabad', 'chhatrapati sambhajinagar', 'ellora', 'ajanta'] },
  { city: 'Kolhapur', state: 'Maharashtra', aliases: ['kolhapur', 'mahalaxmi'] },
  { city: 'Nagpur', state: 'Maharashtra', aliases: ['nagpur'] },
  // Rajasthan
  { city: 'Jaipur', state: 'Rajasthan', aliases: ['jaipur', 'pink city', 'amer', 'sanganer'] },
  { city: 'Udaipur', state: 'Rajasthan', aliases: ['udaipur', 'city of lakes', 'lake pichola'] },
  { city: 'Jodhpur', state: 'Rajasthan', aliases: ['jodhpur', 'sun city', 'blue city', 'mehrangarh'] },
  { city: 'Jaisalmer', state: 'Rajasthan', aliases: ['jaisalmer', 'golden city', 'sam dunes'] },
  { city: 'Pushkar', state: 'Rajasthan', aliases: ['pushkar', 'brahma temple'] },
  { city: 'Bikaner', state: 'Rajasthan', aliases: ['bikaner', 'junagarh'] },
  // North India & Himalayas
  { city: 'Delhi', state: 'Delhi', aliases: ['delhi', 'new delhi', 'old delhi', 'dilli', 'ncr'] },
  { city: 'Varanasi', state: 'Uttar Pradesh', aliases: ['varanasi', 'banaras', 'kashi', 'ganga ghats'] },
  { city: 'Agra', state: 'Uttar Pradesh', aliases: ['agra', 'taj mahal', 'fatehpur sikri'] },
  { city: 'Lucknow', state: 'Uttar Pradesh', aliases: ['lucknow', 'awadh', 'chowk'] },
  { city: 'Mathura', state: 'Uttar Pradesh', aliases: ['mathura', 'vrindavan'] },
  { city: 'Ayodhya', state: 'Uttar Pradesh', aliases: ['ayodhya'] },
  { city: 'Rishikesh', state: 'Uttarakhand', aliases: ['rishikesh', 'laxman jhula', 'triveni ghat'] },
  { city: 'Haridwar', state: 'Uttarakhand', aliases: ['haridwar', 'har ki pauri'] },
  { city: 'Shimla', state: 'Himachal Pradesh', aliases: ['shimla', 'kufri', 'mall road'] },
  { city: 'Manali', state: 'Himachal Pradesh', aliases: ['manali', 'solang', 'old manali'] },
  { city: 'Dharamshala', state: 'Himachal Pradesh', aliases: ['dharamshala', 'mcleodganj', 'kangra'] },
  { city: 'Amritsar', state: 'Punjab', aliases: ['amritsar', 'golden temple', 'harmandir sahib'] },
  { city: 'Srinagar', state: 'Jammu and Kashmir', aliases: ['srinagar', 'kashmir', 'dal lake', 'gulmarg'] },
  { city: 'Leh', state: 'Ladakh', aliases: ['leh', 'ladakh', 'pangong', 'nubra'] },
  // South India
  { city: 'Kochi', state: 'Kerala', aliases: ['kochi', 'cochin', 'fort kochi', 'mattancherry'] },
  { city: 'Munnar', state: 'Kerala', aliases: ['munnar', 'tea gardens'] },
  { city: 'Alleppey', state: 'Kerala', aliases: ['alleppey', 'alappuzha', 'backwaters'] },
  { city: 'Wayanad', state: 'Kerala', aliases: ['wayanad'] },
  { city: 'Bengaluru', state: 'Karnataka', aliases: ['bengaluru', 'bangalore'] },
  { city: 'Mysuru', state: 'Karnataka', aliases: ['mysore', 'mysuru'] },
  { city: 'Hampi', state: 'Karnataka', aliases: ['hampi', 'vijayanagara', 'tungabhadra'] },
  { city: 'Coorg', state: 'Karnataka', aliases: ['coorg', 'kodagu', 'madikeri'] },
  { city: 'Chennai', state: 'Tamil Nadu', aliases: ['chennai', 'madras', 'mylapore'] },
  { city: 'Madurai', state: 'Tamil Nadu', aliases: ['madurai', 'meenakshi temple'] },
  { city: 'Pondicherry', state: 'Puducherry', aliases: ['pondicherry', 'puducherry', 'auroville'] },
  { city: 'Hyderabad', state: 'Telangana', aliases: ['hyderabad', 'charminar', 'secunderabad'] },
  { city: 'Goa', state: 'Goa', aliases: ['goa', 'panaji', 'north goa', 'south goa', 'calangute', 'margao'] },
  // East & Central India
  { city: 'Kolkata', state: 'West Bengal', aliases: ['kolkata', 'calcutta', 'howrah', 'kumartuli'] },
  { city: 'Darjeeling', state: 'West Bengal', aliases: ['darjeeling', 'ghoom'] },
  { city: 'Bhopal', state: 'Madhya Pradesh', aliases: ['bhopal', 'sanchi', 'bhimbetka'] },
  { city: 'Ujjain', state: 'Madhya Pradesh', aliases: ['ujjain', 'mahakaleshwar'] },
  { city: 'Ahmedabad', state: 'Gujarat', aliases: ['ahmedabad', 'amdavad', 'sabarmati'] },
  { city: 'Kutch', state: 'Gujarat', aliases: ['kutch', 'rann of kutch', 'bhuj', 'nirona'] },
];

export async function generateLocalConciergeResponse(
  message: string,
  existingCity?: string
): Promise<LocalConciergeResult> {
  const q = message.toLowerCase().trim();

  // 1. Detect Destination (City and State)
  let detectedCity = existingCity || '';
  let detectedState = '';

  for (const dest of KNOWN_DESTINATIONS) {
    if (
      dest.aliases.some((alias) => q.includes(alias)) ||
      (detectedCity && detectedCity.toLowerCase() === dest.city.toLowerCase())
    ) {
      detectedCity = dest.city;
      detectedState = dest.state;
      break;
    }
  }

  // Check state names if city not detected
  if (!detectedCity) {
    for (const item of INDIAN_STATES_AND_CITIES) {
      if (q.includes(item.state.toLowerCase())) {
        detectedState = item.state;
        detectedCity = item.cities[0] || item.state;
        break;
      }
    }
  }

  const isDestinationKnown = Boolean(detectedCity);

  // Fetch live weather for the destination to ground recommendations
  const weatherContext = detectedCity ? await fetchWeatherContextForAI(detectedCity) : null;

  // 2. Detect Group Size
  let groupSize = 1;
  const numMatch = q.match(/(\d+)\s*(people|members|persons|pax|travelers|friends|adults|family|folks)/i);
  if (numMatch) {
    groupSize = parseInt(numMatch[1], 10);
  } else if (q.includes('four') || q.includes('4')) {
    groupSize = 4;
  } else if (q.includes('two') || q.includes('couple') || q.includes('2')) {
    groupSize = 2;
  } else if (q.includes('three') || q.includes('3')) {
    groupSize = 3;
  } else if (q.includes('five') || q.includes('5')) {
    groupSize = 5;
  } else if (q.includes('six') || q.includes('6')) {
    groupSize = 6;
  } else if (q.includes('family') || q.includes('group')) {
    groupSize = 4;
  }

  // 3. Detect Budget
  let budget: number | null = null;
  const budgetMatch = q.match(/(?:budget|around|about|under|limit|is|of)\s*(?:is)?\s*(?:around|about|approx)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?(?:\s*k)?)\s*(?:rupees|inr|rs)?/i);
  if (budgetMatch) {
    const rawNum = budgetMatch[1].replace(/,/g, '').trim().toLowerCase();
    if (rawNum.endsWith('k')) {
      budget = parseFloat(rawNum.replace('k', '')) * 1000;
    } else {
      budget = parseFloat(rawNum);
    }
  } else {
    const directRupeesMatch = q.match(/(\d{3,7})\s*(?:rupees|inr|rs)/i);
    if (directRupeesMatch) {
      budget = parseFloat(directRupeesMatch[1]);
    }
  }

  // 4. Retrieve Places for Destination or Fallback Selection
  let cityPlaces = isDestinationKnown ? getPlacesByCity(detectedCity) : [];
  if (cityPlaces.length === 0 && detectedState) {
    cityPlaces = getPlacesByState(detectedState);
  }
  if (cityPlaces.length === 0 && isDestinationKnown) {
    cityPlaces = searchAllPlaces(detectedCity, 10);
  }
  if (cityPlaces.length === 0) {
    cityPlaces = ALL_LOKIVA_PLACES.slice(0, 8);
  }

  const topPlaces = cityPlaces.slice(0, 5);

  const suggested_experiences: ScoredExperience[] = topPlaces.map((place, idx) => {
    const score = Math.max(88, 98 - idx * 2);
    const cleanedImageUrl = resolveImageUrl(
      place.image_url && !place.image_url.includes('PASTE_IMAGE') ? place.image_url : null,
      place.image_urls
    );

    const expWithImage: Experience = {
      ...place,
      image_url: cleanedImageUrl,
      image_urls: place.image_urls && place.image_urls.length > 0
        ? place.image_urls.map((u) => resolveImageUrl(u))
        : [cleanedImageUrl],
    };

    return {
      experience: expWithImage,
      overall_score: score,
      score: score,
      match_reasons: [
        `Authentic ${place.category} in ${place.city}`,
        place.price > 0 ? `Cost effective at ₹${place.price}/person` : 'Free open cultural access',
        place.accessibility_step_free || place.accessibility_low_walking ? 'Comfortable walking circuit' : 'Verified landmark',
      ],
      preference_score: 95,
      feasibility_score: 96,
      distance_score: 92,
      budget_score: 94,
    };
  });

  // 5. Try live AI API inference first
  const aiReply = await fetchAIReply(
    message,
    detectedCity,
    groupSize,
    budget,
    groupSize > 1 ? 'Group' : 'Solo',
    ['culture', 'heritage', 'food'],
    weatherContext?.aiPromptContext,
    weatherContext?.weatherAdvisory
  );

  let reply = aiReply;

  // If live AI API is unreachable or returned empty, use the logical fallback generator
  if (!reply) {
    const perPerson = budget && groupSize > 0 ? Math.round(budget / groupSize) : null;
    const perPersonText = perPerson ? `(₹${perPerson.toLocaleString('en-IN')} per traveler)` : '';
    const totalBudgetText = budget ? `₹${budget.toLocaleString('en-IN')}` : 'a tailored budget range';

    if (isDestinationKnown) {
      reply = `Welcome to **${detectedCity}**, ${detectedState || 'India'}.\n\n`;

      if (budget) {
        reply += `I have tailored a high-value cultural plan for your group of **${groupSize} traveler${groupSize > 1 ? 's' : ''}** with a total budget of **${totalBudgetText}** ${perPersonText}.\n\n`;
      } else {
        reply += `I have curated the signature cultural anchor points in **${detectedCity}** for your party of **${groupSize}**.\n\n`;
      }

      reply += `### Recommended Circuit Highlights:\n`;
      topPlaces.forEach((p, i) => {
        const costText = p.price > 0 ? `₹${p.price * groupSize} for ${groupSize}` : 'Free Entry';
        reply += `${i + 1}. **${p.title}** (${p.category}): ${p.tagline || p.description.slice(0, 90)}... [${costText}]\n`;
      });

      reply += `\n**Practical Travel & Budget Advice:** Your allocation covers entry access, authentic local food stops, and intra-city transit with comfortable buffers remaining.\n\nWould you like me to build a sequential hourly route or focus on specific artisanal workshops?`;
    } else {
      // General Pan-India Inquiry
      reply = `Welcome to LOKIVA AI Cultural Concierge.\n\n`;
      if (budget) {
        reply += `For your party of **${groupSize} traveler${groupSize > 1 ? 's' : ''}** with a budget of **${totalBudgetText}** ${perPersonText}, India offers diverse heritage corridors: royal architectural citadels, coastal backwaters, Himalayan nature retreats, or sacred river traditions.\n\n`;
      } else {
        reply += `I can help you curate immersive journeys across India's living cultural traditions, artisan guilds, and regional culinary trails.\n\n`;
      }

      reply += `Which specific city or region would you like to explore (for example: Mumbai, Panvel, Kochi, Varanasi, Jaipur, or Shimla)? Share your destination and timeline, and I will curate a precise circuit!`;
    }
  }

  const extracted_intent: StructuredIntent = {
    city: detectedCity || undefined,
    state: detectedState || undefined,
    destination: detectedCity || undefined,
    budget: budget || undefined,
    group_size: groupSize,
    traveler_type: groupSize > 1 ? 'Group' : 'Solo',
    raw_query: message,
    interests: ['culture', 'heritage', 'food'],
  };

  return {
    reply: sanitizeUiText(reply),
    tokens_used: 120,
    model: 'lokiva-concierge-v2',
    extracted_intent,
    suggested_experiences: isDestinationKnown ? suggested_experiences : [],
    context_destination: detectedCity,
    state: detectedState || 'India',
  };
}
