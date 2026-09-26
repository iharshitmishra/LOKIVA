/**
 * LOKIVA On-Ground Rescheduling & Weather Engine Integration Service
 * Provides realistic smart fallback logic and clean hook boundaries for teammates.
 */

export type DisruptionReason =
  | 'temple_or_shop_closed'
  | 'gate_maintenance'
  | 'crowd_surge'
  | 'weather_rain'
  | 'running_late';

export interface WeatherSlotStatus {
  hasRainAlert: boolean;
  conditionLabel: string; // e.g. "Optimal Dry Window · 27°C" or "Heavy Monsoon Shower Forecasted (09:00 AM - 11:30 AM)"
  precipitationProbability: number;
  advisoryText?: string;
  temperatureCelsius?: number;
}

export interface IntervalReplacementCandidate {
  id: string;
  title: string;
  category: string;
  neighborhood: string;
  distanceFromClosedStopKm: number; // e.g. 0.9 km away
  fittedDurationMinutes: number; // matches the closed stop's slot window
  estAccessInr: number;
  image: string;
  openStatusLabel: string; // e.g. "Verified Open During 08:30 AM - 11:30 AM"
  whyItFitsInterval: string; // e.g. "Fits your exact 45-min window (01:55 PM - 02:40 PM) and is 6 mins away"
  isIndoorRainSafe: boolean;
}

/**
 * 🔌 TEAMMATE WEATHER API INTEGRATION POINT
 * Teammate will replace the body of this function with their live Weather API fetch
 * using (city, lat, lng, dateIso, startTime, endTime).
 */
export async function checkStopWeatherForecast(params: {
  city: string;
  placeTitle: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  simulateRainOverride?: boolean;
}): Promise<WeatherSlotStatus> {
  const { city, placeTitle, startTime, endTime, simulateRainOverride } = params;

  if (simulateRainOverride) {
    return {
      hasRainAlert: true,
      conditionLabel: `Monsoon Rain Alert (${startTime} - ${endTime})`,
      precipitationProbability: 88,
      temperatureCelsius: 24,
      advisoryText: `Lokiva Weather Monitor detected active precipitation at ${placeTitle} (${city}) during your ${startTime} - ${endTime} slot. Covered indoor alternatives ready.`,
    };
  }

  return {
    hasRainAlert: false,
    conditionLabel: `Clear Skies · 28°C (${startTime})`,
    precipitationProbability: 12,
    temperatureCelsius: 28,
  };
}

/**
 * 🔌 TEAMMATE RECOMMENDATION ENGINE INTEGRATION POINT
 * Teammate will replace the body of this function with their nearby recommendation API
 * filtered by (city, closedStop, startTime, endTime, durationMinutes, reason).
 */
export async function getIntervalReplacementRecommendations(params: {
  city: string;
  closedStopTitle: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: DisruptionReason;
}): Promise<IntervalReplacementCandidate[]> {
  const { city, closedStopTitle, startTime, endTime, durationMinutes, reason } = params;
  const isRain = reason === 'weather_rain';

  return [
    {
      id: `repl-${Date.now()}-1`,
      title: `${city} Royal Textile & Zari Weaving Atelier`,
      category: 'ART & CRAFT · INDOOR GUILD',
      neighborhood: `Heritage Quarter, ${city}`,
      distanceFromClosedStopKm: 0.9,
      fittedDurationMinutes: durationMinutes,
      estAccessInr: 450,
      image: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80',
      openStatusLabel: `Verified Open During ${startTime} - ${endTime}`,
      whyItFitsInterval: isRain
        ? `100% covered indoor master-weaver studio just 0.9 km away; fits your ${durationMinutes}-min slot.`
        : `Confirmed open right now while ${closedStopTitle} is closed; matches your exact ${durationMinutes}-min window (${startTime} - ${endTime}).`,
      isIndoorRainSafe: true,
    },
    {
      id: `repl-${Date.now()}-2`,
      title: `${city} Old Brassware & Copper Smithy Courtyard`,
      category: 'LIVING HERITAGE',
      neighborhood: `Artisan Bazaar Lane, ${city}`,
      distanceFromClosedStopKm: 1.4,
      fittedDurationMinutes: durationMinutes,
      estAccessInr: 320,
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
      openStatusLabel: `Verified Open During ${startTime} - ${endTime}`,
      whyItFitsInterval: `Zero entry queue and 5 mins transit from your current pin; tailored for a ${durationMinutes}-min immersion.`,
      isIndoorRainSafe: true,
    },
    {
      id: `repl-${Date.now()}-3`,
      title: `${city} Ancestral Spice & Heirloom Tea Tasting Room`,
      category: 'FOOD & CULINARY',
      neighborhood: `Old Market Precinct, ${city}`,
      distanceFromClosedStopKm: 1.1,
      fittedDurationMinutes: durationMinutes,
      estAccessInr: 550,
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
      openStatusLabel: `Verified Open During ${startTime} - ${endTime}`,
      whyItFitsInterval: `Seated indoor tasting session that finishes right at ${endTime} so your next stop stays on schedule.`,
      isIndoorRainSafe: true,
    },
  ];
}
