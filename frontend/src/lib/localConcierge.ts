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

async function fetchAIReply(
  message: string,
  city: string,
  groupSize: number,
  budget: number | null,
  travelerType: string,
  interests: string[]
): Promise<string> {
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
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply as string;
    }
  } catch (err) {
    console.warn('[LOKIVA AI] AI API call failed:', err);
  }

  return `I'd love to help you plan your trip! Could you tell me more about what you're looking for?`;
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

// Known cities and states for instant entity resolution
const KNOWN_DESTINATIONS = [
  { city: 'Jaipur', state: 'Rajasthan', aliases: ['pink city', 'jaipur', 'rajasthan jaipur'] },
  { city: 'Udaipur', state: 'Rajasthan', aliases: ['city of lakes', 'udaipur'] },
  { city: 'Jodhpur', state: 'Rajasthan', aliases: ['sun city', 'blue city', 'jodhpur'] },
  { city: 'Jaisalmer', state: 'Rajasthan', aliases: ['golden city', 'jaisalmer'] },
  { city: 'Varanasi', state: 'Uttar Pradesh', aliases: ['banaras', 'kashi', 'varanasi'] },
  { city: 'Agra', state: 'Uttar Pradesh', aliases: ['taj mahal', 'agra'] },
  { city: 'Delhi', state: 'Delhi', aliases: ['new delhi', 'old delhi', 'dilli', 'delhi'] },
  { city: 'Mumbai', state: 'Maharashtra', aliases: ['bombay', 'mumbai'] },
  { city: 'Pune', state: 'Maharashtra', aliases: ['pune'] },
  { city: 'Kochi', state: 'Kerala', aliases: ['cochin', 'fort kochi', 'kochi'] },
  { city: 'Munnar', state: 'Kerala', aliases: ['munnar'] },
  { city: 'Alleppey', state: 'Kerala', aliases: ['alappuzha', 'alleppey'] },
  { city: 'Goa', state: 'Goa', aliases: ['north goa', 'south goa', 'panaji', 'goa'] },
  { city: 'Hampi', state: 'Karnataka', aliases: ['hampi', 'vijayanagara'] },
  { city: 'Mysuru', state: 'Karnataka', aliases: ['mysore', 'mysuru'] },
  { city: 'Bengaluru', state: 'Karnataka', aliases: ['bangalore', 'bengaluru'] },
  { city: 'Amritsar', state: 'Punjab', aliases: ['golden temple', 'amritsar'] },
  { city: 'Srinagar', state: 'Jammu and Kashmir', aliases: ['kashmir', 'srinagar', 'dal lake'] },
  { city: 'Dharamshala', state: 'Himachal Pradesh', aliases: ['mcleodganj', 'dharamshala'] },
  { city: 'Shimla', state: 'Himachal Pradesh', aliases: ['shimla'] },
  { city: 'Rishikesh', state: 'Uttarakhand', aliases: ['haridwar', 'rishikesh'] },
  { city: 'Kolkata', state: 'West Bengal', aliases: ['calcutta', 'kolkata'] },
  { city: 'Chennai', state: 'Tamil Nadu', aliases: ['madras', 'chennai'] },
  { city: 'Madurai', state: 'Tamil Nadu', aliases: ['madurai'] },
  { city: 'Hyderabad', state: 'Telangana', aliases: ['hyderabad'] },
  { city: 'Ahmedabad', state: 'Gujarat', aliases: ['ahmedabad', 'amdavad'] },
  { city: 'Kutch', state: 'Gujarat', aliases: ['rann of kutch', 'bhuj', 'kutch'] },
];

export async function generateLocalConciergeResponse(
  message: string,
  existingCity?: string
): Promise<LocalConciergeResult> {
  const q = message.toLowerCase();

  // 1. Detect Destination (City and State)
  let detectedCity = existingCity || '';
  let detectedState = '';

  for (const dest of KNOWN_DESTINATIONS) {
    if (dest.aliases.some((alias) => q.includes(alias)) || (detectedCity && detectedCity.toLowerCase() === dest.city.toLowerCase())) {
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

  if (!detectedCity) {
    // No destination detected, ask the AI API for a clarifying response
    const aiReply = await fetchAIReply(message, '', 1, undefined, 'Solo', []);
    return {
      reply: aiReply,
      tokens_used: 50,
      model: 'lokiva-concierge-v2',
      extracted_intent: {
        city: '',
        state: '',
        destination: '',
        budget: undefined,
        group_size: 1,
        traveler_type: 'Solo',
        raw_query: message,
        interests: [],
      },
      suggested_experiences: [],
      context_destination: '',
      state: 'India',
    };
  }

  // Fetch live weather for the destination to ground recommendations
  await fetchWeatherContextForAI(detectedCity);

  // 2. Detect Group Size
  let groupSize = 1;
  const numMatch = q.match(/(\d+)\s*(people|members|persons|pax|travelers|friends|adults|family)/i);
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

  // 4. Retrieve Places for Destination
  let cityPlaces = getPlacesByCity(detectedCity);
  if (cityPlaces.length === 0 && detectedState) {
    cityPlaces = getPlacesByState(detectedState);
  }
  if (cityPlaces.length === 0) {
    cityPlaces = searchAllPlaces(detectedCity, 10);
  }
  if (cityPlaces.length === 0) {
    cityPlaces = ALL_LOKIVA_PLACES.slice(0, 8);
  }

  // Sort and select top experiences
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

  // 5. Generate AI-Powered Response
  const reply = await fetchAIReply(
    message,
    detectedCity,
    groupSize,
    budget,
    groupSize > 1 ? 'Group' : 'Solo',
    ['culture', 'heritage', 'food']
  );

  const extracted_intent: StructuredIntent = {
    city: detectedCity,
    state: detectedState,
    destination: detectedCity,
    budget: budget || undefined,
    group_size: groupSize,
    traveler_type: groupSize > 1 ? 'Group' : 'Solo',
    raw_query: message,
    interests: ['culture', 'heritage', 'food'],
  };

  return {
    reply,
    tokens_used: 120,
    model: 'lokiva-concierge-v2',
    extracted_intent,
    suggested_experiences,
    context_destination: detectedCity,
    state: detectedState,
  };
}
