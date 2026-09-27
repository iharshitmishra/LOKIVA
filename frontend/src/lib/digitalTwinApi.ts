import {
  DigitalTwinSimulationData,
  WeatherConditionType,
  CitizenGroundReportPayload,
  SocialSignal,
} from '../types/digitalTwin';

export async function fetchDigitalTwinSimulation(
  city: string = 'Jaipur',
  condition: WeatherConditionType = 'rain',
  whatIf?: {
    rainfallIntensity?: number;
    temperature?: number;
    stormDuration?: number;
    floodDepth?: number;
  }
): Promise<DigitalTwinSimulationData> {
  const params = new URLSearchParams({
    city,
    condition,
  });

  if (whatIf?.rainfallIntensity !== undefined) {
    params.set('rainfall_intensity', String(whatIf.rainfallIntensity));
  }
  if (whatIf?.temperature !== undefined) {
    params.set('temperature', String(whatIf.temperature));
  }
  if (whatIf?.stormDuration !== undefined) {
    params.set('storm_duration', String(whatIf.stormDuration));
  }
  if (whatIf?.floodDepth !== undefined) {
    params.set('flood_depth', String(whatIf.floodDepth));
  }

  const url = `/api/v1/digital-twin/simulation?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch digital twin simulation: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchLiveWeather(city: string = 'Jaipur'): Promise<any> {
  const res = await fetch(`/api/v1/digital-twin/live-weather?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch live weather: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchDigitalTwinCities(): Promise<{ id: string; name: string; state: string }[]> {
  const res = await fetch('/api/v1/digital-twin/cities');
  if (!res.ok) {
    throw new Error('Failed to fetch simulation cities');
  }
  const data = await res.json();
  const rawList = Array.isArray(data) ? data : (data.cities || []);
  return rawList.map((c: any) => ({
    id: c.id || c.key || String(c.city || c.name || '').toLowerCase(),
    name: c.name || c.city || 'Jaipur',
    state: c.state || '',
  }));
}

export async function submitCitizenGroundReport(
  payload: CitizenGroundReportPayload
): Promise<{ success: boolean; signal: SocialSignal; message: string }> {
  const res = await fetch('/api/v1/digital-twin/social-signal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit ground report: ${res.statusText}`);
  }
  return await res.json();
}
