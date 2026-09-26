import { Experience } from '../../types';
import { USER_CURATED_PLACES } from '../userVerifiedPlacesData';
import { POPULAR_CITIES_PLACES } from './popularCitiesData';
import { NORTH_REGIONAL_PLACES } from './northPlacesData';
import { SOUTH_REGIONAL_PLACES } from './southPlacesData';
import { WEST_REGIONAL_PLACES } from './westPlacesData';
import { EAST_REGIONAL_PLACES } from './eastPlacesData';
import { CENTRAL_REGIONAL_PLACES } from './centralPlacesData';
import { INDIAN_STATES_AND_CITIES, POPULAR_CITIES_LIST, StateCityInfo, getStateForCity, ALL_INDIAN_STATES_BY_ZONE, IndianStateZoneInfo } from './statesData';

export { INDIAN_STATES_AND_CITIES, POPULAR_CITIES_LIST, getStateForCity, ALL_INDIAN_STATES_BY_ZONE };
export type { StateCityInfo, IndianStateZoneInfo };

function deduplicateExperiences(lists: Experience[][]): Experience[] {
  const seenIds = new Set<number>();
  const seenTitles = new Set<string>();
  const merged: Experience[] = [];

  for (const list of lists) {
    for (const place of list) {
      if (!place || !place.title) continue;
      const titleKey = `${(place.city || '').toLowerCase().trim()}_${place.title.toLowerCase().trim()}`;
      if (!seenIds.has(place.id) && !seenTitles.has(titleKey)) {
        seenIds.add(place.id);
        seenTitles.add(titleKey);
        merged.push(place);
      }
    }
  }

  return merged;
}

export const ALL_LOKIVA_PLACES: Experience[] = deduplicateExperiences([
  USER_CURATED_PLACES,
  POPULAR_CITIES_PLACES,
  NORTH_REGIONAL_PLACES,
  SOUTH_REGIONAL_PLACES,
  WEST_REGIONAL_PLACES,
  EAST_REGIONAL_PLACES,
  CENTRAL_REGIONAL_PLACES,
]);

// O(1) indexed lookup tables for instant UI filtering
const PLACES_BY_CITY = new Map<string, Experience[]>();
const PLACES_BY_STATE = new Map<string, Experience[]>();

for (const place of ALL_LOKIVA_PLACES) {
  const cityKey = place.city.toLowerCase().trim();
  if (!PLACES_BY_CITY.has(cityKey)) {
    PLACES_BY_CITY.set(cityKey, []);
  }
  PLACES_BY_CITY.get(cityKey)!.push(place);

  if (place.state) {
    const stateKey = place.state.toLowerCase().trim();
    if (!PLACES_BY_STATE.has(stateKey)) {
      PLACES_BY_STATE.set(stateKey, []);
    }
    PLACES_BY_STATE.get(stateKey)!.push(place);
  }
}

export function getPlacesByCity(city: string): Experience[] {
  if (!city) return [];
  const key = city.toLowerCase().trim();
  return PLACES_BY_CITY.get(key) || [];
}

export function getPlacesByState(state: string): Experience[] {
  if (!state) return [];
  const key = state.toLowerCase().trim();
  return PLACES_BY_STATE.get(key) || [];
}

export function getPopularPlaces(): Experience[] {
  return POPULAR_CITIES_PLACES;
}

export function searchAllPlaces(query: string, limit = 50): Experience[] {
  if (!query || !query.trim()) return ALL_LOKIVA_PLACES.slice(0, limit);
  const q = query.toLowerCase().trim();
  const matched: Experience[] = [];
  for (const place of ALL_LOKIVA_PLACES) {
    if (
      place.title.toLowerCase().includes(q) ||
      place.city.toLowerCase().includes(q) ||
      (place.state && place.state.toLowerCase().includes(q)) ||
      (place.area_name && place.area_name.toLowerCase().includes(q)) ||
      (place.category && place.category.toLowerCase().includes(q)) ||
      (place.tagline && place.tagline.toLowerCase().includes(q)) ||
      (place.tags && place.tags.some((t) => t.toLowerCase().includes(q)))
    ) {
      matched.push(place);
      if (matched.length >= limit) break;
    }
  }
  return matched;
}
