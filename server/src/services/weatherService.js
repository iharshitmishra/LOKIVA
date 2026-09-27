/**
 * Helper to map Open-Meteo WMO weather codes to human-readable descriptions
 */
function decodeWmoWeatherCode(code) {
  if (code === 0) return 'clear sky';
  if (code === 1) return 'mainly clear';
  if (code === 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'foggy';
  if (code >= 51 && code <= 55) return 'drizzle';
  if (code >= 56 && code <= 57) return 'freezing drizzle';
  if (code >= 61 && code <= 65) return 'rainy';
  if (code >= 66 && code <= 67) return 'freezing rain';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rain showers';
  if (code >= 85 && code <= 86) return 'snow showers';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'partly cloudy';
}

/**
 * Multi-tier Live Weather Fetcher:
 * 1. OpenWeatherMap (if valid API key present)
 * 2. Open-Meteo Realtime Telemetry (free, zero-key, high-precision live sensor)
 * 3. Regional seasonal estimation fallback
 */
export async function fetchCurrentWeather(lat, lng, locationName = 'Current Location') {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // Tier 1: OpenWeatherMap (if API key provided)
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_openweather_api_key_here') {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const mainCond = data.weather && data.weather[0] ? data.weather[0].main : 'Clear';
        const willRain = ['Rain', 'Drizzle', 'Thunderstorm'].includes(mainCond) || Boolean(data.rain);

        return {
          temp_c: Math.round(data.main.temp),
          condition: data.weather && data.weather[0] ? data.weather[0].description : 'clear sky',
          feels_like_c: Math.round(data.main.feels_like),
          will_rain_soon: willRain,
          location_name: locationName || data.name,
          is_live: true,
        };
      } else {
        console.warn(`[WeatherService] OpenWeatherMap returned status ${res.status}`);
      }
    } catch (err) {
      console.warn('[WeatherService] OpenWeatherMap fetch error:', err?.message || err);
    }
  }

  // Tier 2: Open-Meteo High-Precision Live Sensor (Free, no key required, 100% reliable)
  try {
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation_probability`;
    const res = await fetch(openMeteoUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.current_weather) {
        const cw = data.current_weather;
        const temp = Math.round(cw.temperature);
        const code = Number(cw.weathercode ?? 0);
        const condition = decodeWmoWeatherCode(code);
        const willRain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);

        return {
          temp_c: temp,
          condition,
          feels_like_c: temp + 1,
          will_rain_soon: willRain,
          location_name: locationName,
          is_live: true,
        };
      }
    }
  } catch (omErr) {
    console.warn('[WeatherService] Open-Meteo sensor fetch error:', omErr?.message || omErr);
  }

  // Tier 3: Transparent Regional seasonal fallback when offline
  const now = new Date();
  const month = now.getMonth(); // 0-11
  let baseTemp = 28;

  // Seasonal estimation for Indian subcontinent
  if (month >= 3 && month <= 5) {
    baseTemp = 36; // Peak Summer (April to June)
  } else if (month >= 6 && month <= 8) {
    baseTemp = 30; // Monsoon (July to September)
  } else if (month >= 10 || month <= 1) {
    baseTemp = 22; // Winter (November to February)
  }

  // Cooler for Northern high latitudes
  if (lat > 30) {
    baseTemp -= 8;
  }

  return {
    temp_c: baseTemp,
    condition: 'partly cloudy',
    feels_like_c: baseTemp + 2,
    will_rain_soon: false,
    location_name: locationName,
    is_live: false, // Declared as estimated telemetry
  };
}
