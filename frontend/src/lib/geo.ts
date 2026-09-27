// Geolocation helper to find nearest cultural city in India

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NearestCityResult {
  city: string;
  state: string;
  distanceKm: number;
}

const INDIAN_HUBS: { city: string; state: string; lat: number; lon: number }[] = [
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { city: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125 },
  { city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
  { city: 'Jaisalmer', state: 'Rajasthan', lat: 26.9157, lon: 70.9083 },
  { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
  { city: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  { city: 'Panvel', state: 'Maharashtra', lat: 18.9894, lon: 73.1175 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { city: 'Goa', state: 'Goa', lat: 15.2993, lon: 74.124 },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { city: 'Amritsar', state: 'Punjab', lat: 31.634, lon: 74.8723 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { city: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
  { city: 'Hampi', state: 'Karnataka', lat: 15.335, lon: 76.46 },
  { city: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lon: 78.2676 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function requestCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000,
    });
  });
}

export function nearestCity(lat: number, lon: number): NearestCityResult {
  let closest = INDIAN_HUBS[0];
  let minDistance = Infinity;

  for (const hub of INDIAN_HUBS) {
    const dist = calculateDistance(lat, lon, hub.lat, hub.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = hub;
    }
  }

  return {
    city: closest.city,
    state: closest.state,
    distanceKm: Math.round(minDistance),
  };
}
