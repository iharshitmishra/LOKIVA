/**
 * LOKIVA Route Planner (client side)
 *
 * Mirrors the server route geometry so that every edit the traveler makes
 * (removing a stop, adding one, reordering, shifting the start time) instantly
 * recomputes the travel legs, the synopsis and the totals. The server owns the
 * original plan, the client owns the edited plan, and both agree on the maths.
 */

export interface RouteLeg {
  mode: 'walk' | 'auto' | 'metro' | 'cab' | 'cab_long' | 'start';
  label: string;
  distance_km: number;
  duration_mins: number;
  direction: string | null;
  synopsis: string;
}

export interface RouteStop {
  sequence: number;
  experience_id: number | string;
  title: string;
  category: string;
  area: string | null;
  price_inr: number;
  stay_mins: number;
  best_time_of_day: string;
  arrival_time: string;
  departure_time: string;
  leg_from_previous: RouteLeg | null;
  line_total_inr: number;
  is_hidden_gem?: boolean;
  is_indoor?: boolean;
  is_family_friendly?: boolean;
  low_walking?: boolean;
  wheelchair_accessible?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  area_name?: string | null;
  image_urls?: string[];
  tags?: string[];
  experience?: Record<string, any>;
}

export interface RoutePlan {
  id: string;
  title: string;
  tagline: string;
  vibe: string;
  pace: string;
  angle: 'signature' | 'themed' | 'alternative' | string;
  why_it_works: string;
  trade_off: string;
  start_point?: string;
  stops: RouteStop[];
  stop_count: number;
  total_duration_mins: number;
  travel_duration_mins: number;
  stay_duration_mins: number;
  total_distance_km: number;
  longest_leg_km: number;
  estimated_cost_inr: number;
  start_time: string | null;
  end_time: string | null;
  budget_label: string;
  context_filled: boolean;
  over_window_by_mins: number;
  has_long_haul: boolean;
  limited_by_availability: boolean;
  overlaps_with_other_routes: number;
  experience_ids: Array<number | string>;
}

export interface RouteEditOptions {
  groupSize?: number;
  startTime?: string;
  lowWalking?: boolean;
  availableHours?: number;
}

const MAX_SANE_LEG_KM = 15;
const LEG_COMFORT_KM = 6;

const asArray = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

// ===========================================================================
// Geometry, kept in lockstep with server/src/services/routeBuilder.js
// ===========================================================================

export function haversineKm(
  a: { latitude?: number | null; longitude?: number | null },
  b: { latitude?: number | null; longitude?: number | null }
): number {
  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);
  if (![lat1, lon1, lat2, lon2].every((n) => Number.isFinite(n))) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Chains stops into one smooth curved path. Every hop bows outward on a
 * quadratic Bézier arc perpendicular to the chord, so even short walks read
 * as natural transit corridors instead of rigid straight lines. Short hops
 * bow further than long ones so the curve stays visible on tight legs.
 */
export function buildCurvedPath(
  stops: { latitude: number; longitude: number }[],
  segmentsPerHop = 16
): [number, number][] {
  const arcPoints: [number, number][] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    const p1 = stops[i];
    const p2 = stops[i + 1];

    const dLat = p2.latitude - p1.latitude;
    const dLng = p2.longitude - p1.longitude;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist < 0.0001) {
      if (i === 0) arcPoints.push([p1.latitude, p1.longitude]);
      continue;
    }

    const midLat = (p1.latitude + p2.latitude) / 2;
    const midLng = (p1.longitude + p2.longitude) / 2;
    const curvature = dist < 0.008 ? 0.16 : 0.09;
    const ctrlLat = midLat - dLng * curvature;
    const ctrlLng = midLng + dLat * curvature;

    const startIndex = i === 0 ? 0 : 1;
    for (let step = startIndex; step <= segmentsPerHop; step++) {
      const t = step / segmentsPerHop;
      const oneMinusT = 1 - t;
      arcPoints.push([
        oneMinusT * oneMinusT * p1.latitude + 2 * oneMinusT * t * ctrlLat + t * t * p2.latitude,
        oneMinusT * oneMinusT * p1.longitude + 2 * oneMinusT * t * ctrlLng + t * t * p2.longitude,
      ]);
    }
  }

  return arcPoints;
}

function bearingDeg(
  a: { latitude?: number | null; longitude?: number | null },
  b: { latitude?: number | null; longitude?: number | null }
): number {
  const lat1 = (Number(a.latitude) * Math.PI) / 180;
  const lat2 = (Number(b.latitude) * Math.PI) / 180;
  const dLon = ((Number(b.longitude) - Number(a.longitude)) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function cardinal(deg: number): string {
  const points = [
    'north', 'north-east', 'east', 'south-east',
    'south', 'south-west', 'west', 'north-west',
  ];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return points[idx];
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(60, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Mirrors estimateTravelTimeMins in server/src/services/algorithms.js.
 * Keeping these constants identical is what lets an edited route match the
 * server's original plan to the minute.
 */
function estimateTravelMins(km: number): number {
  const avgSpeedKmh = 22;
  const bufferMins = 8;
  return Math.max(10, Math.round((km / avgSpeedKmh) * 60) + bufferMins);
}

function travelModeFor(km: number, lowWalking: boolean) {
  if (km < 0.7) return { mode: 'walk' as const, verb: 'Walk', noun: 'on foot' };
  if (lowWalking) {
    return km < 4
      ? { mode: 'cab' as const, verb: 'Book a prepaid cab', noun: 'a prepaid cab' }
      : { mode: 'cab_long' as const, verb: 'Take a cab', noun: 'a cab for the longer hop' };
  }
  if (km < 3.5) return { mode: 'auto' as const, verb: 'Take an auto rickshaw', noun: 'an auto rickshaw' };
  if (km < 12) return { mode: 'metro' as const, verb: 'Take the metro or a taxi', noun: 'the metro or a taxi' };
  return { mode: 'cab' as const, verb: 'Take a cab', noun: 'a cab' };
}

function shortArea(exp: {
  title?: string;
  area?: string | null;
  area_name?: string | null;
}): string {
  const area = String(exp.area || exp.area_name || '').trim();
  if (!area) return exp.title || 'your stop';
  return area.split(/[,/]/)[0].trim() || exp.title || 'your stop';
}

/** Recomputes the travel synopsis for one hop. */
export function buildLeg(
  from: RouteStop | null,
  to: RouteStop,
  options: RouteEditOptions = {}
): RouteLeg {
  if (!from) {
    return {
      mode: 'start',
      label: 'start of day',
      distance_km: 0,
      duration_mins: 0,
      direction: null,
      synopsis: `Start at ${shortArea(to)} and walk in.`,
    };
  }

  const km = haversineKm(from, to);
  const { mode, verb } = travelModeFor(km, Boolean(options.lowWalking));
  const duration = mode === 'walk' ? Math.max(4, Math.round((km / 4.5) * 60)) : estimateTravelMins(km);
  const dir = cardinal(bearingDeg(from, to));
  const distanceLabel = formatDistance(km);

  const synopsis =
    mode === 'walk'
      ? `${verb} ${duration} min (${distanceLabel}) ${dir} from ${shortArea(from)} to ${shortArea(to)}.`
      : `${verb} for about ${duration} min (${distanceLabel}, heading ${dir}) from ${shortArea(from)} to ${shortArea(to)}.`;

  return {
    mode,
    label: mode === 'walk' ? 'on foot' : travelModeFor(km, Boolean(options.lowWalking)).noun,
    distance_km: Number(km.toFixed(2)),
    duration_mins: duration,
    direction: dir,
    synopsis,
  };
}

// ===========================================================================
// Clock helpers
// ===========================================================================

export function parseClock(value: string | undefined, fallbackMinutes = 9 * 60): number {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallbackMinutes;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallbackMinutes;
  return Math.min(23, h) * 60 + Math.min(59, m);
}

export function formatClock(totalMins: number): string {
  const wrapped = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

// ===========================================================================
// Recompute
// ===========================================================================

/**
 * Re-chains a route: arrival and departure times, travel legs, and every total.
 * Called after any edit so the numbers on screen are never stale.
 */
export function recomputeRoute(route: RoutePlan, options: RouteEditOptions = {}): RoutePlan {
  const groupSize = Math.max(1, Number(options.groupSize) || 1);
  const lowWalking = Boolean(options.lowWalking);
  let clock = parseClock(options.startTime, parseClock(route.start_time, 9 * 60));

  const stops: RouteStop[] = route.stops.map((stop, idx) => {
    const prev = idx > 0 ? route.stops[idx - 1] : null;
    const leg = idx === 0 ? null : buildLeg(prev, stop, { ...options, lowWalking });
    clock += leg ? leg.duration_mins : 0;
    const arrival = clock;
    const stay = Math.max(20, Number(stop.stay_mins) || 45);
    clock += stay;
    const unit = Number(stop.price_inr) || 0;
    return {
      ...stop,
      sequence: idx + 1,
      arrival_time: formatClock(arrival),
      departure_time: formatClock(clock),
      leg_from_previous: leg,
      line_total_inr: unit * groupSize,
    };
  });

  const legs = stops.map((s) => s.leg_from_previous).filter(Boolean) as RouteLeg[];
  const travelMins = legs.reduce((sum, l) => sum + l.duration_mins, 0);
  const stayMins = stops.reduce((sum, s) => sum + s.stay_mins, 0);
  const distanceKm = legs.reduce((sum, l) => sum + l.distance_km, 0);
  const longestLeg = legs.reduce((max, l) => Math.max(max, l.distance_km), 0);
  const cost = stops.reduce((sum, s) => sum + s.line_total_inr, 0);
  const windowMins = (Number(options.availableHours) || 8) * 60;

  return {
    ...route,
    stops,
    stop_count: stops.length,
    total_duration_mins: travelMins + stayMins,
    travel_duration_mins: travelMins,
    stay_duration_mins: stayMins,
    total_distance_km: Number(distanceKm.toFixed(2)),
    longest_leg_km: Number(longestLeg.toFixed(2)),
    estimated_cost_inr: cost,
    start_time: stops[0]?.arrival_time || null,
    end_time: stops[stops.length - 1]?.departure_time || null,
    budget_label: cost > 0 ? `about \u20B9${cost.toLocaleString('en-IN')}` : 'free entry throughout',
    context_filled: travelMins + stayMins <= windowMins,
    over_window_by_mins: Math.max(0, travelMins + stayMins - windowMins),
    has_long_haul: longestLeg > LEG_COMFORT_KM * 2.5,
    experience_ids: stops.map((s) => s.experience_id),
  };
}

// ===========================================================================
// Edits
// ===========================================================================

export const isEdited = (route: RoutePlan, original: RoutePlan): boolean =>
  route.experience_ids.join(',') !== original.experience_ids.join(',') ||
  route.total_duration_mins !== original.total_duration_mins;

export function removeStop(route: RoutePlan, experienceId: number | string): RoutePlan {
  if (route.stops.length <= 2) return route;
  const stops = route.stops.filter((s) => String(s.experience_id) !== String(experienceId));
  if (stops.length === route.stops.length) return route;
  return recomputeRoute({ ...route, stops }, routeOptions(route));
}

export function addStop(
  route: RoutePlan,
  stop: RouteStop,
  index?: number
): RoutePlan {
  if (route.stops.some((s) => String(s.experience_id) === String(stop.experience_id))) return route;
  const stops = [...route.stops];
  const at = typeof index === 'number' ? Math.max(0, Math.min(stops.length, index)) : stops.length;
  stops.splice(at, 0, { ...stop, sequence: at + 1 });
  return recomputeRoute({ ...route, stops }, routeOptions(route));
}

export function moveStop(
  route: RoutePlan,
  experienceId: number | string,
  delta: -1 | 1
): RoutePlan {
  const idx = route.stops.findIndex((s) => String(s.experience_id) === String(experienceId));
  if (idx === -1) return route;
  const target = idx + delta;
  if (target < 0 || target >= route.stops.length) return route;
  const stops = [...route.stops];
  const [moved] = stops.splice(idx, 1);
  stops.splice(target, 0, moved);
  return recomputeRoute({ ...route, stops }, routeOptions(route));
}

/** Nearest neighbour re-cut, so the traveler can drop a hand built order. */
export function optimizeOrder(route: RoutePlan): RoutePlan {
  if (route.stops.length <= 2) return route;
  const remaining = [...route.stops];
  const ordered: RouteStop[] = [];
  let current: RouteStop | null = null;

  while (remaining.length) {
    let bestIdx = 0;
    let bestCost = Infinity;
    remaining.forEach((candidate, idx) => {
      const km = current ? haversineKm(current, candidate) : 0;
      let cost = km * 100;
      if (km > LEG_COMFORT_KM) cost += (km - LEG_COMFORT_KM) * 12;
      if (cost < bestCost || (cost === bestCost && idx < bestIdx)) {
        bestCost = cost;
        bestIdx = idx;
      }
    });
    const [next] = remaining.splice(bestIdx, 1);
    ordered.push(next);
    current = next;
  }

  return recomputeRoute({ ...route, stops: ordered }, routeOptions(route));
}

export function setStartTime(route: RoutePlan, startTime: string): RoutePlan {
  return recomputeRoute(route, { ...routeOptions(route), startTime });
}

/** Keeps the edit options alongside the route so recomputes stay consistent. */
export function routeOptions(route: RoutePlan): RouteEditOptions {
  const meta = (route as RoutePlan & { _options?: RouteEditOptions })._options || {};
  return {
    groupSize: meta.groupSize ?? 1,
    startTime: meta.startTime ?? route.start_time ?? '09:00',
    lowWalking: meta.lowWalking ?? false,
    availableHours: meta.availableHours ?? 8,
  };
}

export function withEditOptions(
  route: RoutePlan,
  options: RouteEditOptions
): RoutePlan {
  const next = { ...route, _options: { ...routeOptions(route), ...options } } as RoutePlan &
    Record<string, unknown>;
  return recomputeRoute(next, { ...routeOptions(route), ...options }) as RoutePlan;
}

// ===========================================================================
// Candidate stops for adding
// ===========================================================================

/**
 * Collects stops the traveler can add to a route: the ones sitting in the
 * other two routes, plus anything passed in from the flat suggestions.
 */
export function candidateStops(
  route: RoutePlan,
  allRoutes: RoutePlan[],
  extras: RouteStop[] = []
): RouteStop[] {
  const inRoute = new Set(route.stops.map((s) => String(s.experience_id)));
  const seen = new Set<string>();
  const out: RouteStop[] = [];

  const push = (stop: RouteStop) => {
    const key = String(stop.experience_id);
    if (inRoute.has(key) || seen.has(key)) return;
    seen.add(key);
    out.push(stop);
  };

  // Nearest first, so the addition does not blow up the travel time
  const others = allRoutes
    .filter((r) => r.id !== route.id)
    .flatMap((r) => r.stops);
  const anchor = route.stops[route.stops.length - 1];
  others
    .slice()
    .sort((a, b) => haversineKm(anchor, a) - haversineKm(anchor, b))
    .forEach(push);

  extras.forEach(push);
  return out;
}

/** Distance penalty for a candidate, used to sort the add menu. */
export function insertionCost(route: RoutePlan, stop: RouteStop): number {
  const last = route.stops[route.stops.length - 1];
  if (!last) return 0;
  return haversineKm(last, stop);
}
