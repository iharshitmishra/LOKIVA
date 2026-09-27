/**
 * Client side geolocation helpers for the concierge.
 *
 * The traveler can skip typing a city: we read their position, round it to
 * the nearest known city, and start the conversation from there. The city
 * table covers every destination the concierge can curate routes for.
 */

export interface CityCoordinate {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export const CITY_COORDINATES: CityCoordinate[] = [
  { city: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { city: 'Udaipur', state: 'Rajasthan', latitude: 24.5854, longitude: 73.7125 },
  { city: 'Jodhpur', state: 'Rajasthan', latitude: 26.2389, longitude: 73.0243 },
  { city: 'Jaisalmer', state: 'Rajasthan', latitude: 26.9157, longitude: 70.9083 },
  { city: 'Pushkar', state: 'Rajasthan', latitude: 26.4897, longitude: 74.5511 },
  { city: 'Bikaner', state: 'Rajasthan', latitude: 28.0229, longitude: 73.3119 },
  { city: 'Mount Abu', state: 'Rajasthan', latitude: 24.5926, longitude: 72.7156 },
  { city: 'Bundi', state: 'Rajasthan', latitude: 25.4414, longitude: 75.6395 },
  { city: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739 },
  { city: 'Agra', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081 },
  { city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { city: 'Ayodhya', state: 'Uttar Pradesh', latitude: 26.7922, longitude: 82.1998 },
  { city: 'Prayagraj', state: 'Uttar Pradesh', latitude: 25.4358, longitude: 81.8463 },
  { city: 'Mathura', state: 'Uttar Pradesh', latitude: 27.4924, longitude: 77.6737 },
  { city: 'Vrindavan', state: 'Uttar Pradesh', latitude: 27.5808, longitude: 77.7000 },
  { city: 'Delhi', state: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
  { city: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { city: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
  { city: 'Nashik', state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
  { city: 'Kolhapur', state: 'Maharashtra', latitude: 16.7050, longitude: 74.2433 },
  { city: 'Goa', state: 'Goa', latitude: 15.4909, longitude: 73.8278 },
  { city: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
  { city: 'Alleppey', state: 'Kerala', latitude: 9.4981, longitude: 76.3388 },
  { city: 'Munnar', state: 'Kerala', latitude: 10.0889, longitude: 77.0595 },
  { city: 'Wayanad', state: 'Kerala', latitude: 11.6854, longitude: 76.1320 },
  { city: 'Varkala', state: 'Kerala', latitude: 8.7352, longitude: 76.7129 },
  { city: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.5241, longitude: 76.9366 },
  { city: 'Thekkady', state: 'Kerala', latitude: 9.5916, longitude: 77.1567 },
  { city: 'Kannur', state: 'Kerala', latitude: 11.8745, longitude: 75.3704 },
  { city: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { city: 'Mysuru', state: 'Karnataka', latitude: 12.2958, longitude: 76.6394 },
  { city: 'Hampi', state: 'Karnataka', latitude: 15.3350, longitude: 76.4600 },
  { city: 'Udupi', state: 'Karnataka', latitude: 13.3409, longitude: 74.7421 },
  { city: 'Gokarna', state: 'Karnataka', latitude: 14.5489, longitude: 74.3183 },
  { city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { city: 'Madurai', state: 'Tamil Nadu', latitude: 9.9252, longitude: 78.1198 },
  { city: 'Thanjavur', state: 'Tamil Nadu', latitude: 10.7870, longitude: 79.1378 },
  { city: 'Kanyakumari', state: 'Tamil Nadu', latitude: 8.0884, longitude: 77.5385 },
  { city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0168, longitude: 76.9558 },
  { city: 'Ooty', state: 'Tamil Nadu', latitude: 11.4102, longitude: 76.6950 },
  { city: 'Mahabalipuram', state: 'Tamil Nadu', latitude: 12.6159, longitude: 80.1948 },
  { city: 'Rameswaram', state: 'Tamil Nadu', latitude: 9.2876, longitude: 79.3129 },
  { city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { city: 'Darjeeling', state: 'West Bengal', latitude: 27.0410, longitude: 88.2663 },
  { city: 'Kalimpong', state: 'West Bengal', latitude: 27.0596, longitude: 88.4730 },
  { city: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { city: 'Amritsar', state: 'Punjab', latitude: 31.6340, longitude: 74.8723 },
  { city: 'Dharamshala', state: 'Himachal Pradesh', latitude: 32.2190, longitude: 76.3234 },
  { city: 'Shimla', state: 'Himachal Pradesh', latitude: 31.1048, longitude: 77.1734 },
  { city: 'Manali', state: 'Himachal Pradesh', latitude: 32.2396, longitude: 77.1887 },
  { city: 'Rishikesh', state: 'Uttarakhand', latitude: 30.0869, longitude: 78.2676 },
  { city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { city: 'Srinagar', state: 'Jammu and Kashmir', latitude: 34.0837, longitude: 74.7973 },
];

export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export interface NearestCity {
  city: string;
  state: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

/** Rounds a raw GPS position to the nearest known city. */
export function nearestCity(lat: number, lng: number): NearestCity | null {
  let best: NearestCity | null = null;
  let bestKm = Infinity;
  for (const c of CITY_COORDINATES) {
    const km = haversineKm(lat, lng, c.latitude, c.longitude);
    if (km < bestKm) {
      bestKm = km;
      best = { city: c.city, state: c.state, distanceKm: km, latitude: c.latitude, longitude: c.longitude };
    }
  }
  return best;
}

/** Wraps the browser geolocation API in a promise with a timeout. */
export function requestCurrentPosition(timeoutMs = 8000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: timeoutMs,
      maximumAge: 60000,
    });
  });
}
