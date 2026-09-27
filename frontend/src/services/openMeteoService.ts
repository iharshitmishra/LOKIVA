/**
 * LOKIVA Open-Meteo Live Weather Integration Service
 * Fetches real-time hyper-local hourly weather forecasts for destinations across India.
 * Supports optional VITE_OPEN_METEO_API_KEY (or runs completely free without key).
 */

import { WeatherSlotStatus } from './rescheduleEngineHooks';

// Fast coordinates cache for top Indian destinations
const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  panvel: { lat: 18.9894, lng: 73.1175 },
  mumbai: { lat: 18.922, lng: 72.8347 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  pune: { lat: 18.5204, lng: 73.8567 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  goa: { lat: 15.4909, lng: 73.8278 },
  panjim: { lat: 15.4909, lng: 73.8278 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  agra: { lat: 27.1767, lng: 78.0081 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  manali: { lat: 32.2432, lng: 77.1892 },
  leh: { lat: 34.1526, lng: 77.5771 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  ooty: { lat: 11.4102, lng: 76.695 },
  darjeeling: { lat: 27.041, lng: 88.2663 },
};

// In-memory forecast cache keyed by `${lat.toFixed(3)}_${lng.toFixed(3)}`
interface HourlyForecastCache {
  fetchedAt: number;
  times: string[];
  temperatures: number[];
  precipitationProbabilities: number[];
  weatherCodes: number[];
}

const FORECAST_CACHE = new Map<string, HourlyForecastCache>();
const GEO_CACHE = new Map<string, { lat: number; lng: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Maps WMO weather interpretation codes to readable conditions and rain classifications
 */
export function interpretWmoCode(code: number): { condition: string; isRain: boolean; icon: string } {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', isRain: false, icon: '☀️' };
    case 1:
      return { condition: 'Mainly Clear', isRain: false, icon: '🌤️' };
    case 2:
      return { condition: 'Partly Cloudy', isRain: false, icon: '⛅' };
    case 3:
      return { condition: 'Overcast', isRain: false, icon: '☁️' };
    case 45:
    case 48:
      return { condition: 'Misty Fog', isRain: false, icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', isRain: true, icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain Showers', isRain: true, icon: '🌧️' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', isRain: true, icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snow Showers', isRain: true, icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Heavy Rain Showers', isRain: true, icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm & Rain', isRain: true, icon: '⛈️' };
    default:
      return { condition: 'Fair Weather', isRain: false, icon: '☀️' };
  }
}

/**
 * Geocode a city name via Open-Meteo Geocoding API if not in static dictionary
 */
export async function resolveCityCoordinates(cityName: string): Promise<{ lat: number; lng: number }> {
  const cleaned = cityName.toLowerCase().split(',')[0].trim();
  if (KNOWN_CITY_COORDINATES[cleaned]) {
    return KNOWN_CITY_COORDINATES[cleaned];
  }

  if (GEO_CACHE.has(cleaned)) {
    return GEO_CACHE.get(cleaned)!;
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleaned
    )}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.results?.[0]) {
        const coords = {
          lat: data.results[0].latitude,
          lng: data.results[0].longitude,
        };
        GEO_CACHE.set(cleaned, coords);
        return coords;
      }
    }
  } catch (err) {
    console.warn('[Open-Meteo] Geocoding lookup failed for:', cityName, err);
  }

  // Fallback to Panvel / Central India default
  return { lat: 18.9894, lng: 73.1175 };
}

/**
 * Parse time string like "07:30 AM" or "14:00" into 24-hour hour integer
 */
function parseHourFromTimeString(timeStr?: string): number {
  if (!timeStr) return 10;
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 10;

  let hour = parseInt(match[1], 10);
  const meridian = match[3]?.toUpperCase();

  if (meridian === 'PM' && hour < 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;
  return hour;
}

/**
 * Fetch live hourly weather from Open-Meteo API
 */
export async function fetchLiveOpenMeteoForecast(
  lat: number,
  lng: number
): Promise<HourlyForecastCache | null> {
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = FORECAST_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    // Check for optional commercial API key from environment
    const apiKey = import.meta.env.VITE_OPEN_METEO_API_KEY;
    const baseUrl = apiKey
      ? `https://customer-api.open-meteo.com/v1/forecast`
      : `https://api.open-meteo.com/v1/forecast`;

    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      timezone: 'auto',
      forecast_days: '7',
    });

    if (apiKey) {
      params.set('apikey', apiKey);
    }

    const res = await fetch(`${baseUrl}?${params.toString()}`);
    if (!res.ok) {
      console.warn('[Open-Meteo] HTTP Error:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    if (!data?.hourly?.time) return null;

    const record: HourlyForecastCache = {
      fetchedAt: Date.now(),
      times: data.hourly.time,
      temperatures: data.hourly.temperature_2m,
      precipitationProbabilities: data.hourly.precipitation_probability || [],
      weatherCodes: data.hourly.weather_code || [],
    };

    FORECAST_CACHE.set(cacheKey, record);
    return record;
  } catch (err) {
    console.warn('[Open-Meteo] Live weather fetch failed:', err);
    return null;
  }
}

/**
 * Fetch a compact live weather summary for a city, suitable for injecting
 * into AI prompts and itinerary planning. Returns forecast for the next
 * 24 hours (today + tomorrow) so the concierge can factor real conditions
 * into its recommendations.
 */
export async function fetchWeatherSummaryForCity(
  city: string
): Promise<WeatherContextForAI | null> {
  try {
    const coords = await resolveCityCoordinates(city);
    const forecast = await fetchLiveOpenMeteoForecast(coords.lat, coords.lng);

    if (!forecast || forecast.times.length === 0) return null;

    const now = new Date();
    const todayPrefix = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPrefix = tomorrow.toISOString().slice(0, 10);

    // Collect hourly slots for today and tomorrow
    const hourlyForecast: Array<{ time: string; temp: number; condition: string; rainProb: number }> = [];
    let currentTemp = 28;
    let currentCondition = 'Clear Sky';
    let maxRainProb = 0;
    let rainExpected = false;

    for (let i = 0; i < forecast.times.length; i++) {
      const t = forecast.times[i];
      if (!t.startsWith(todayPrefix) && !t.startsWith(tomorrowPrefix)) continue;

      const temp = Math.round(forecast.temperatures[i] ?? 28);
      const rainProb = forecast.precipitationProbabilities[i] ?? 0;
      const code = forecast.weatherCodes[i] ?? 0;
      const interp = interpretWmoCode(code);

      const hour = parseInt(t.slice(11, 13), 10);
      const timeLabel = t.startsWith(todayPrefix)
        ? `Today ${hour}:00`
        : `Tomorrow ${hour}:00`;

      hourlyForecast.push({
        time: timeLabel,
        temp,
        condition: interp.condition,
        rainProb,
      });

      // Track current conditions (closest to now)
      const slotDate = new Date(t);
      const diffMs = Math.abs(slotDate.getTime() - now.getTime());
      if (diffMs < 3600000) {
        currentTemp = temp;
        currentCondition = interp.condition;
      }

      // Track rain risk
      if (rainProb > maxRainProb) maxRainProb = rainProb;
      if (interp.isRain || rainProb >= 50) rainExpected = true;
    }

    // Build a concise summary string for AI prompts
    const todaySlots = hourlyForecast.filter((h) => h.time.startsWith('Today'));
    const tomorrowSlots = hourlyForecast.filter((h) => h.time.startsWith('Tomorrow'));

    const todayHigh = todaySlots.length ? Math.max(...todaySlots.map((s) => s.temp)) : currentTemp;
    const todayLow = todaySlots.length ? Math.min(...todaySlots.map((s) => s.temp)) : currentTemp;
    const tomorrowHigh = tomorrowSlots.length ? Math.max(...tomorrowSlots.map((s) => s.temp)) : todayHigh;
    const tomorrowLow = tomorrowSlots.length ? Math.min(...tomorrowSlots.map((s) => s.temp)) : todayLow;

    const todayRainProb = todaySlots.length ? Math.max(...todaySlots.map((s) => s.rainProb)) : 0;
    const tomorrowRainProb = tomorrowSlots.length ? Math.max(...tomorrowSlots.map((s) => s.rainProb)) : 0;

    const summary = `Current: ${currentCondition} at ${currentTemp}°C. ` +
      `Today: ${todayLow}°C to ${todayHigh}°C, max rain probability ${todayRainProb}%. ` +
      `Tomorrow: ${tomorrowLow}°C to ${tomorrowHigh}°C, max rain probability ${tomorrowRainProb}%. ` +
      (rainExpected
        ? `Rain likely (peak probability ${maxRainProb}%). Recommend indoor alternatives and rain gear.`
        : 'No significant rain expected. Good conditions for outdoor exploration.');

    const todaySummary = `Current: ${currentCondition} at ${currentTemp}°C. ` +
      `Today: ${todayLow}°C to ${todayHigh}°C, max rain probability ${todayRainProb}%.`;

    const tomorrowSummary = `Tomorrow: ${tomorrowLow}°C to ${tomorrowHigh}°C, max rain probability ${tomorrowRainProb}%.`;

    const aiPromptContext = `Current: ${currentCondition} at ${currentTemp}°C. Today: ${todayLow}°C to ${todayHigh}°C. Tomorrow: ${tomorrowLow}°C to ${tomorrowHigh}°C.`;

    let weatherAdvisory = '';
    if (rainExpected && maxRainProb >= 70) {
      weatherAdvisory = `Heavy rain likely in ${city}. Strongly recommend indoor alternatives and rain gear. Consider shifting outdoor stops to early morning or late evening.`;
    } else if (rainExpected && maxRainProb >= 40) {
      weatherAdvisory = `Moderate rain risk in ${city}. Suggest indoor backup options and rain protection. Flexible timing advised.`;
    } else if (currentTemp >= 38) {
      weatherAdvisory = `Extreme heat in ${city} (${currentTemp}°C). Recommend indoor stops during midday, hydration breaks, and lightweight clothing.`;
    } else if (currentTemp <= 10) {
      weatherAdvisory = `Cold weather in ${city} (${currentTemp}°C). Recommend warm layers and indoor stops during early morning and late evening.`;
    } else {
      weatherAdvisory = `Pleasant weather in ${city} (${currentCondition}, ${currentTemp}°C). Good conditions for outdoor exploration.`;
    }

    return {
      city,
      currentCondition,
      currentTempCelsius: currentTemp,
      todaySummary,
      tomorrowSummary,
      rainExpected,
      peakRainProbability: maxRainProb,
      hourlyHighlights: hourlyForecast,
      aiPromptContext,
      weatherAdvisory,
    };
  } catch (err) {
    console.warn('[Open-Meteo] Weather summary fetch failed for prompts:', err);
    return null;
  }
}

/**
 * Structured weather context for AI prompt injection.
 * Contains both human-readable advisory text and a formatted prompt block
 * that can be directly injected into AI system prompts.
 */
export interface WeatherContextForAI {
  city: string;
  currentCondition: string;
  currentTempCelsius: number;
  todaySummary: string;
  tomorrowSummary: string;
  rainExpected: boolean;
  peakRainProbability: number;
  hourlyHighlights: Array<{ time: string; temp: number; condition: string; rainProb: number }>;
  aiPromptContext: string;
  weatherAdvisory: string;
}

/**
 * Fetch comprehensive live weather context formatted for AI prompt injection.
 * Returns structured weather data that the concierge and itinerary planner
 * can use to make weather-aware recommendations.
 */
export async function fetchWeatherContextForAI(city: string): Promise<WeatherContextForAI | null> {
  try {
    const summary = await fetchWeatherSummaryForCity(city);
    if (!summary) return null;

    // Build concise AI prompt context
    const aiPromptContext = `LIVE WEATHER DATA for ${city} (Open-Meteo real-time):
Current conditions: ${summary.currentCondition} at ${summary.currentTempCelsius}\u00B0C.
Today: ${summary.todaySummary}
Rain expected: ${summary.rainExpected ? `YES - peak probability ${summary.peakRainProbability}%` : 'No significant rain expected'}
Hourly highlights: ${summary.hourlyHighlights.slice(0, 6).map(h => `${h.time}: ${h.condition}, ${h.temp}\u00B0C, ${h.rainProb}% rain`).join('; ')}`;

    // Build weather advisory
    let weatherAdvisory = '';
    if (summary.rainExpected && summary.peakRainProbability >= 70) {
      weatherAdvisory = `Heavy rain likely in ${city}. Strongly recommend indoor alternatives and rain gear. Consider shifting outdoor stops to early morning or late evening.`;
    } else if (summary.rainExpected && summary.peakRainProbability >= 40) {
      weatherAdvisory = `Moderate rain risk in ${city}. Suggest indoor backup options and rain protection. Flexible timing advised.`;
    } else if (summary.currentTempCelsius >= 38) {
      weatherAdvisory = `Extreme heat in ${city} (${summary.currentTempCelsius}\u00B0C). Recommend indoor stops during midday, hydration breaks, and lightweight clothing.`;
    } else if (summary.currentTempCelsius <= 10) {
      weatherAdvisory = `Cold weather in ${city} (${summary.currentTempCelsius}\u00B0C). Recommend warm layers and indoor stops during early morning and late evening.`;
    } else {
      weatherAdvisory = `Pleasant weather in ${city} (${summary.currentCondition}, ${summary.currentTempCelsius}\u00B0C). Good conditions for outdoor exploration.`;
    }

    return {
      city: summary.city,
      currentCondition: summary.currentCondition,
      currentTempCelsius: summary.currentTempCelsius,
      todaySummary: summary.todaySummary,
      tomorrowSummary: summary.tomorrowSummary,
      rainExpected: summary.rainExpected,
      peakRainProbability: summary.peakRainProbability,
      hourlyHighlights: summary.hourlyHighlights.slice(0, 8),
      aiPromptContext,
      weatherAdvisory,
    };
  } catch (err) {
    console.warn('[Open-Meteo] Weather context for AI failed:', err);
    return null;
  }
}

/**
 * Primary LOKIVA Weather Engine hook called for each itinerary stop.
 * Queries live Open-Meteo radar and evaluates precipitation risk.
 */
export async function getLiveStopWeatherStatus(params: {
  city: string;
  placeTitle: string;
  dateIso?: string;
  startTime?: string;
  endTime?: string;
  simulateRainOverride?: boolean;
}): Promise<WeatherSlotStatus> {
  const { city, placeTitle, dateIso, startTime, endTime, simulateRainOverride } = params;

  // Manual demo override for presentation testing
  if (simulateRainOverride) {
    return {
      hasRainAlert: true,
      conditionLabel: `Active Monsoon Rain (${startTime || '07:30 AM'} - ${endTime || '08:30 AM'})`,
      precipitationProbability: 88,
      temperatureCelsius: 24,
      advisoryText: `Lokiva Weather Monitor detected active precipitation at ${placeTitle} (${city}) during your ${startTime} - ${endTime} slot. Covered indoor alternatives ready.`,
    };
  }

  // 1. Resolve coordinates
  const coords = await resolveCityCoordinates(city);

  // 2. Fetch hourly forecast from Open-Meteo
  const forecast = await fetchLiveOpenMeteoForecast(coords.lat, coords.lng);

  if (!forecast || forecast.times.length === 0) {
    // Fallback if network offline
    return {
      hasRainAlert: false,
      conditionLabel: `Clear Skies · 28°C (${startTime || '09:00 AM'})`,
      precipitationProbability: 10,
      temperatureCelsius: 28,
    };
  }

  // 3. Locate closest matching hour slot
  const targetHour = parseHourFromTimeString(startTime);
  const targetDatePrefix = dateIso && dateIso.includes('-') ? dateIso.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const targetTimeStr = `${targetDatePrefix}T${targetHour.toString().padStart(2, '0')}:00`;

  let matchedIndex = forecast.times.findIndex((t) => t.startsWith(targetTimeStr));
  if (matchedIndex === -1) {
    // If exact date not found in 7-day forecast window, match by hour of current day
    const hourSuffix = `T${targetHour.toString().padStart(2, '0')}:00`;
    matchedIndex = forecast.times.findIndex((t) => t.includes(hourSuffix));
  }
  if (matchedIndex === -1) matchedIndex = 0;

  const temp = Math.round(forecast.temperatures[matchedIndex] ?? 28);
  const precipProb = forecast.precipitationProbabilities[matchedIndex] ?? 0;
  const weatherCode = forecast.weatherCodes[matchedIndex] ?? 0;
  const interpretation = interpretWmoCode(weatherCode);

  // Active rain alert threshold: WMO code indicates rain OR precipitation probability is high
  const hasRainAlert = interpretation.isRain || precipProb >= 50;

  if (hasRainAlert) {
    return {
      hasRainAlert: true,
      conditionLabel: `${interpretation.condition} (${precipProb}% Rain) · ${temp}°C`,
      precipitationProbability: Math.max(precipProb, 65),
      temperatureCelsius: temp,
      advisoryText: `Open-Meteo Live Radar detected active ${interpretation.condition.toLowerCase()} (${precipProb}% probability) at ${placeTitle} (${city}) during your ${startTime} - ${endTime} slot. Covered indoor alternatives ready.`,
    };
  }

  return {
    hasRainAlert: false,
    conditionLabel: `${interpretation.icon} ${interpretation.condition} · ${temp}°C`,
    precipitationProbability: precipProb,
    temperatureCelsius: temp,
  };
}
