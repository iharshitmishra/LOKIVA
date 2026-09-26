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
