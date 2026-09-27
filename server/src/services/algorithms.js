// Haversine distance in kilometers between two lat/lng coordinates
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate intra-city travel duration in minutes based on distance
export function estimateTravelTimeMins(distanceKm) {
  const avgSpeedKmh = 22; // Typical urban traffic in Indian cities
  const bufferMins = 8; // Parking / boarding buffer
  const travelMins = Math.round((distanceKm / avgSpeedKmh) * 60) + bufferMins;
  return Math.max(10, travelMins);
}

// Multi-Factor Recommendation Scorer
// Aliases let a confirmed traveler brief (for example "culture" or "food")
// match the richer compound categories and tags stored on each experience.
const INTEREST_ALIASES = {
  culture: [
    'culture', 'cultural', 'heritage', 'history', 'historic', 'monument', 'palace', 'fort',
    'fortress', 'architecture', 'museum', 'archaeolog', 'landmark', 'haveli', 'mausoleum',
    'tomb', 'mosque', 'cathedral', 'church', 'synagogue', 'temple town', 'old city', 'walled city',
  ],
  food: [
    'food', 'culinary', 'cuisine', 'thali', 'street food', 'snack', 'dessert', 'sweets', 'mithai',
    'dining', 'cafe', 'chai', 'tea', 'biryani', 'chaat', 'breakfast', 'lunch', 'dinner',
    'food trail', 'kitchen', 'beverage', 'brewery', 'ice cream', 'bakery', 'pastry',
  ],
  workshop: [
    'workshop', 'workshops', 'craft', 'artisan', 'pottery', 'textile', 'weav', 'handloom',
    'block printing', 'embroid', 'master', 'hands-on', 'hands on', 'carpenter', 'metalwork',
    'woodcraft', 'clay', 'painting', 'folk art', 'stone carving', 'loom',
  ],
  hidden_gem: ['hidden gem', 'hidden', 'offbeat', 'off the beaten', 'local spot', 'secret', 'under the radar', 'authentic'],
  nature: [
    'nature', 'wildlife', 'bird', 'scenic', 'garden', 'lake', 'beach', 'backwater', 'waterfall',
    'hill', 'mountain', 'forest', 'sanctuary', 'national park', 'botanical', 'sunset point',
    'boating', 'canyon', 'trek', 'hike', 'trail', 'valley', 'mangrove', 'desert', 'camel',
  ],
  spiritual: [
    'spiritual', 'temple', 'ghat', 'aarti', 'yoga', 'meditation', 'ashram', 'sacred', 'shrine',
    'pilgrim', 'puja', 'ritual', 'wellness', 'ayurveda', 'riverfront', 'ashrams', 'mandir',
    'gurudwara', 'stupa', 'monastery', 'sound healing', 'fauna',
  ],
  shopping: ['shopping', 'market', 'bazaar', 'souvenir', 'jewellery', 'jewelry', 'spices', 'textile weaving', 'craft market', 'bangle'],
  adventure: ['adventure', 'rafting', 'kayak', 'kayaking', 'cycling', 'safari', 'trek', 'canyoning', 'zipline', 'paragliding', 'camp'],
  nightlife: ['nightlife', 'music', 'dance', 'qawwali', 'classical', 'rooftop', 'bar', 'pub', 'brewery', 'live band', 'jazz', 'night market', 'cafe'],
  events: ['festival', 'event', 'fair', 'mela', 'celebration', 'carnival', 'procession', 'concert'],
};

function matchInterests(expCategory, tags, interests) {
  const haystack = [expCategory || '', ...(Array.isArray(tags) ? tags : [])]
    .join(' • ')
    .toLowerCase();
  return (interests || []).filter((interest) => {
    const key = String(interest).toLowerCase().trim();
    const aliases = INTEREST_ALIASES[key] || [key];
    return aliases.some((alias) => haystack.includes(alias));
  });
}

export function scoreExperience(exp, intent, profile, weather) {
  let score = 50.0;
  const matchReasons = [];

  // Parse JSON fields safely
  const tags = typeof exp.tags === 'string' ? JSON.parse(exp.tags || '[]') : exp.tags || [];
  const interests = intent?.interests || (profile?.interests ? (typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests) : []);

  // 1. Category and Interest Matching (+25 max)
  const expCategory = (exp.category || '').toLowerCase();
  const matchedInterests = matchInterests(expCategory, tags, interests);
  if (matchedInterests.length > 0) {
    score += Math.min(30, matchedInterests.length * 15);
    matchReasons.push(`Matches your interest in ${matchedInterests.join(', ')}`);
  }

  // 2. Persona Match (Family / Solo / Couple)
  const travelerType = (intent?.traveler_type || profile?.traveler_type || 'Solo').toLowerCase();
  if (travelerType.includes('family') && exp.is_family_friendly) {
    score += 15;
    matchReasons.push('Verified family-friendly pacing');
  }

  // 3. Accessibility / Low Walking Match
  const lowWalking = intent?.accessibility_prefs?.low_walking ?? profile?.accessibility_prefs?.low_walking;
  if (lowWalking && exp.low_walking) {
    score += 15;
    matchReasons.push('Low-walking & comfortable accessibility');
  }

  // 4. Hidden Gem Boost
  if (exp.is_hidden_gem) {
    score += 10;
    matchReasons.push('Authentic off-the-beaten-path hidden gem');
  }

  // 5. Weather Suitability
  if (weather?.is_raining && exp.is_indoor) {
    score += 15;
    matchReasons.push('Indoor experience sheltered from rain');
  }

  // 6. Confirmed Budget Fit (only applied when a brief declared a real ceiling)
  const budgetCeiling = Number(intent?.budget);
  if (Number.isFinite(budgetCeiling) && budgetCeiling > 0 && budgetCeiling <= 15000) {
    const price = Number(exp.price) || 0;
    if (price === 0) {
      score += 6;
      matchReasons.push('Free entry, zero ticket cost');
    } else if (price <= budgetCeiling) {
      score += 8;
      matchReasons.push(`Comfortably inside your budget (Rs.${price})`);
    } else {
      score -= 10;
    }
  }

  // 7. Quality & Rating
  score += (exp.rating || 4.5) * 3;

  return {
    score: Math.min(99, Math.round(score)),
    match_reasons: matchReasons.slice(0, 3),
  };
}

// Feasibility and Itinerary Builder Engine
export function checkItineraryFeasibility(experiences, startLocation = { lat: 19.076, lng: 72.8777 }) {
  if (!experiences || experiences.length === 0) {
    return {
      is_feasible: true,
      feasibility_score: 100,
      total_duration_mins: 0,
      total_cost: 0,
      total_travel_time_mins: 0,
      fatigue_level: 'Low',
      items: [],
      warnings: [],
    };
  }

  let totalDuration = 0;
  let totalCost = 0;
  let totalTravelTime = 0;
  const warnings = [];
  const items = [];

  let currentLat = startLocation.lat;
  let currentLng = startLocation.lng;
  let currentTimeMins = 9 * 60; // 9:00 AM start

  experiences.forEach((exp, idx) => {
    const dist = calculateDistanceKm(currentLat, currentLng, exp.latitude, exp.longitude);
    const travelTime = idx === 0 ? 0 : estimateTravelTimeMins(dist);
    totalTravelTime += travelTime;

    const startMins = currentTimeMins + travelTime;
    const duration = exp.approx_duration_mins || 120;
    const endMins = startMins + duration;

    // Time string format HH:MM
    const formatTime = (mins) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    items.push({
      item_order: idx + 1,
      experience_id: exp.id,
      title: exp.title,
      category: exp.category,
      start_time: formatTime(startMins),
      end_time: formatTime(endMins),
      travel_time_to_next_mins: travelTime,
      distance_km: Math.round(dist * 10) / 10,
      price: exp.price || 0,
    });

    totalDuration += duration + travelTime;
    totalCost += exp.price || 0;
    currentTimeMins = endMins;
    currentLat = exp.latitude;
    currentLng = exp.longitude;
  });

  if (totalDuration > 10 * 60) {
    warnings.push('High fatigue schedule: Total itinerary exceeds 10 hours.');
  }
  if (experiences.length > 5) {
    warnings.push('Too many activities for a single day. Consider splitting over 2 days.');
  }

  const fatigueLevel = totalDuration > 480 ? 'High' : totalDuration > 300 ? 'Moderate' : 'Low';
  const feasibilityScore = Math.max(40, 100 - warnings.length * 15 - Math.floor(totalTravelTime / 30) * 5);

  return {
    is_feasible: warnings.length === 0,
    feasibility_score: feasibilityScore,
    total_duration_mins: totalDuration,
    total_travel_time_mins: totalTravelTime,
    total_cost: totalCost,
    fatigue_level: fatigueLevel,
    items,
    warnings,
  };
}

// AI Natural Language Intent Extraction (Robust Rule-based + OpenAI integration)
export function parseIntentFromPrompt(prompt) {
  const text = (prompt || '').toLowerCase();

  // 1. Group Size
  let groupSize = 2;
  const sizeMatch = text.match(/(\d+)\s*(people|pax|person|friends|adults)/);
  if (sizeMatch) groupSize = parseInt(sizeMatch[1], 10);
  else if (text.includes('solo') || text.includes('alone')) groupSize = 1;
  else if (text.includes('family') || text.includes('kids')) groupSize = 4;

  // 2. Budget
  let budget = 2500;
  const kMatch = text.match(/(?:budget\s*(?:of)?|under|around|approx|for|within)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|lac|lakh)\b/i);
  const plainBudgetMatch = text.match(/(?:₹|rs\.?|inr|budget\s*(?:of)?)\s*([\d,]+)/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    const unit = kMatch[2].toLowerCase();
    if (unit === 'k' || unit === 'thousand') {
      budget = Math.round(val * 1000);
    } else if (unit === 'lac' || unit === 'lakh') {
      budget = Math.round(val * 100000);
    }
  } else if (plainBudgetMatch) {
    budget = parseInt(plainBudgetMatch[1].replace(/,/g, ''), 10);
  } else if (text.includes('budget') || text.includes('cheap')) {
    budget = 1000;
  } else if (text.includes('luxury') || text.includes('premium')) {
    budget = 6000;
  }

  // 3. Duration (Hours / Days)
  let availableHours = 6;
  let durationDays = 1;
  const dayMatch = text.match(/(\d+)\s*(days?|nights?)/i);
  if (dayMatch) {
    durationDays = parseInt(dayMatch[1], 10);
    availableHours = durationDays * 8;
  } else {
    const hourMatch = text.match(/(\d+)\s*(hours?|hrs?)/i);
    if (hourMatch) availableHours = parseInt(hourMatch[1], 10);
    else if (text.includes('half day')) availableHours = 4;
    else if (text.includes('full day')) availableHours = 8;
    else if (text.includes('weekend')) {
      durationDays = 2;
      availableHours = 16;
    }
  }

  // 4. Interests
  const interests = [];
  if (text.includes('food') || text.includes('eat') || text.includes('culinary') || text.includes('street food')) interests.push('food');
  if (text.includes('craft') || text.includes('workshop') || text.includes('pottery') || text.includes('textile') || text.includes('artisan')) interests.push('workshop');
  if (text.includes('culture') || text.includes('history') || text.includes('temple') || text.includes('heritage') || text.includes('palace')) interests.push('culture');
  if (text.includes('nature') || text.includes('outdoor') || text.includes('hike') || text.includes('trek') || text.includes('beach')) interests.push('nature');
  if (text.includes('music') || text.includes('dance') || text.includes('spiritual') || text.includes('meditation')) interests.push('spiritual');

  if (interests.length === 0) interests.push('culture', 'food');

  // 5. Accessibility
  const lowWalking = text.includes('low walk') || text.includes('elderly') || text.includes('senior') || text.includes('easy walk');

  return {
    traveler_type: groupSize === 1 ? 'Solo Explorer' : text.includes('family') ? 'Family with Kids' : 'Couples / Friends',
    group_size: groupSize,
    budget,
    duration_days: durationDays,
    available_hours: availableHours,
    interests,
    accessibility_prefs: { low_walking: lowWalking },
    destination: text.includes('mumbai') ? 'Mumbai' : text.includes('jaipur') ? 'Jaipur' : text.includes('goa') ? 'Goa' : text.includes('delhi') ? 'Delhi' : text.includes('varanasi') ? 'Varanasi' : 'Jaipur',
  };
}
