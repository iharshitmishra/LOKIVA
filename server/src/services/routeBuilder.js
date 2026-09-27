/**
 * LOKIVA Route Builder
 *
 * Turns a pool of verified experiences plus a confirmed traveler brief into
 * three genuinely different routes, each with a leg by leg travel synopsis.
 *
 * The three archetypes are structurally distinct, not the same stops reshuffled:
 *   1. signature   the balanced best of the city, geo ordered to cut backtracking
 *   2. themed      a shorter deep dive built around the traveler's strongest interest
 *   3. alternative the counterpoint, offbeat or quiet, compact and genuinely new stops
 *
 * Every leg carries a real mode, distance and duration derived from the
 * coordinates stored on each experience, so the synopsis never invents a hop.
 */
import { calculateDistanceKm, estimateTravelTimeMins } from './algorithms.js';

const TIME_SLOT_ORDER = { morning: 0, afternoon: 1, evening: 2, night: 3, anytime: 1 };

// A leg longer than this is a mistake in an urban day plan, so we avoid it.
const MAX_SANE_LEG_KM = 15;
// Penalty applied to a leg beyond the comfortable range, to break ties.
const LEG_COMFORT_KM = 6;

const INTEREST_PILLARS = [
  { key: 'food', label: 'Street Food Trail', words: ['food', 'culinary', 'thali', 'street'], categoryWords: ['food & culinary'] },
  { key: 'culture', label: 'Royal Heritage Run', words: ['heritage', 'palace', 'fort', 'monument', 'architecture'], categoryWords: ['heritage & history'] },
  { key: 'workshop', label: 'Artisan Workshop Loop', words: ['craft', 'workshop', 'artisan', 'pottery', 'weav'], categoryWords: ['workshops & craft', 'art & craft'] },
  { key: 'spiritual', label: 'Sacred Ghats Walk', words: ['ghat', 'temple', 'spiritual', 'aarti', 'mandir'], categoryWords: ['spiritual & wellness'] },
  { key: 'nature', label: 'Nature And Waterfront', words: ['nature', 'beach', 'wildlife', 'lake', 'garden'], categoryWords: ['nature & wildlife'] },
  { key: 'hidden_gem', label: 'Offbeat Detour', words: ['hidden', 'offbeat', 'local spot', 'village'], categoryWords: [] },
  { key: 'shopping', label: 'Bazaar And Craft Markets', words: ['market', 'bazaar', 'shopping', 'souvenir'], categoryWords: [] },
  { key: 'nightlife', label: 'Evening Music Trail', words: ['music', 'dance', 'nightlife', 'qawwali'], categoryWords: ['music & dance'] },
];

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

function textBlob(exp) {
  return [exp.category, ...asArray(exp.tags)].filter(Boolean).join(' ').toLowerCase();
}

function matchesInterest(exp, interest) {
  if (!interest) return false;
  const blob = textBlob(exp);
  const pillar = INTEREST_PILLARS.find((p) => p.key === interest);
  const words = pillar ? pillar.words : [interest];
  return words.some((w) => blob.includes(w));
}

function pillarFor(interest) {
  return INTEREST_PILLARS.find((p) => p.key === interest) || null;
}

function timeSlot(exp) {
  const raw = String(exp.best_time_of_day || '').toLowerCase().trim();
  return TIME_SLOT_ORDER[raw] !== undefined ? raw || 'anytime' : 'anytime';
}

function slotRank(exp) {
  const raw = String(exp.best_time_of_day || '').toLowerCase().trim();
  return TIME_SLOT_ORDER[raw] !== undefined ? TIME_SLOT_ORDER[raw] : 1;
}

function hasCoords(exp) {
  return Number.isFinite(Number(exp.latitude)) && Number.isFinite(Number(exp.longitude));
}

function legKm(from, to) {
  if (!from || !to || !hasCoords(from) || !hasCoords(to)) return 0;
  return calculateDistanceKm(
    Number(from.latitude),
    Number(from.longitude),
    Number(to.latitude),
    Number(to.longitude)
  );
}

function shortArea(exp) {
  const area = String(exp.area_name || '').trim();
  if (!area) return exp.title;
  return area.split(/[,/]/)[0].trim() || exp.title;
}

// ===========================================================================
// Geometry helpers
// ===========================================================================

function bearingDeg(from, to) {
  const lat1 = (Number(from.latitude) * Math.PI) / 180;
  const lat2 = (Number(to.latitude) * Math.PI) / 180;
  const dLon = ((Number(to.longitude) - Number(from.longitude)) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function cardinal(deg) {
  const points = [
    'north', 'north-east', 'east', 'south-east',
    'south', 'south-west', 'west', 'north-west',
  ];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return points[idx];
}

function formatDistance(km) {
  if (km < 1) return `${Math.max(60, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toFixed(1)} km`;
}

/** Chooses a realistic city transport mode from the distance between two stops. */
function travelModeFor(km, opts = {}) {
  const lowWalking = Boolean(opts.lowWalking);
  if (!hasCoords(opts.from) || !hasCoords(opts.to)) {
    return { mode: 'auto', label: 'auto rickshaw', verb: 'Take an auto rickshaw' };
  }
  if (km < 0.7) {
    return { mode: 'walk', label: 'on foot', verb: 'Walk' };
  }
  if (lowWalking) {
    return km < 4
      ? { mode: 'cab', label: 'a prepaid cab', verb: 'Book a prepaid cab' }
      : { mode: 'cab_long', label: 'a cab for the longer hop', verb: 'Take a cab' };
  }
  if (km < 3.5) {
    return { mode: 'auto', label: 'an auto rickshaw', verb: 'Take an auto rickshaw' };
  }
  if (km < 12) {
    return { mode: 'metro', label: 'the metro or a taxi', verb: 'Take the metro or a taxi' };
  }
  return { mode: 'cab', label: 'a cab', verb: 'Take a cab' };
}

/**
 * Builds the travel synopsis between two consecutive stops.
 * The first leg of a route is the start of the day, so it has no travel line.
 */
export function buildLeg(from, to, options = {}) {
  if (!from || !hasCoords(from) || !hasCoords(to)) {
    return {
      mode: 'start',
      label: 'start of day',
      distance_km: 0,
      duration_mins: 0,
      direction: null,
      synopsis: `Start at ${shortArea(to)} and walk in.`,
    };
  }

  const km = legKm(from, to);
  const { mode, label, verb } = travelModeFor(km, { from, to, lowWalking: options.lowWalking });
  const base = estimateTravelTimeMins(km);
  const duration = mode === 'walk' ? Math.max(4, Math.round((km / 4.5) * 60)) : base;
  const dir = cardinal(bearingDeg(from, to));
  const distanceLabel = formatDistance(km);

  const origin = shortArea(from);
  const destination = shortArea(to);
  const synopsis =
    mode === 'walk'
      ? `${verb} ${duration} min (${distanceLabel}) ${dir} from ${origin} to ${destination}.`
      : `${verb} for about ${duration} min (${distanceLabel}, heading ${dir}) from ${origin} to ${destination}.`;

  return {
    mode,
    label,
    distance_km: Number(km.toFixed(2)),
    duration_mins: duration,
    direction: dir,
    synopsis,
  };
}

// ===========================================================================
// Ordering
// ===========================================================================

/**
 * Orders stops so the traveller backtracks as little as possible.
 * Geography is the primary key, because a day spent riding across a city is a
 * bad day. The time of day a stop suits and its brief score are tie breakers.
 */
export function orderStops(stops, options = {}) {
  const list = asArray(stops);
  if (list.length <= 1) return list;

  const preferSlots = options.preferSlots || null;
  const remaining = [...list];
  const ordered = [];
  let current = null;

  while (remaining.length) {
    let bestIndex = 0;
    let bestCost = Infinity;

    remaining.forEach((candidate, idx) => {
      // Geography dominates: 100 per km.
      let cost = legKm(current, candidate.experience) * 100;
      // Comfort penalty for a tiring hop.
      const km = legKm(current, candidate.experience);
      if (km > LEG_COMFORT_KM) cost += (km - LEG_COMFORT_KM) * 12;
      // Brief alignment, a light nudge only.
      cost += Math.max(0, 60 - Math.min(60, Number(candidate.score) || 0)) * 0.35;
      // Time of day suitability, only when the route asked for specific slots.
      if (preferSlots && current) {
        const wanted = preferSlots.includes(timeSlot(candidate.experience)) ? 0 : 40;
        cost += wanted;
      } else {
        cost += slotRank(candidate.experience) * 6;
      }
      if (!hasCoords(candidate.experience)) cost += 25;
      if (cost === bestCost) cost += idx * 0.001;

      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = idx;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next.experience;
  }

  return ordered;
}

// ===========================================================================
// Route assembly
// ===========================================================================

function parseClock(value, fallback) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return fallback;
  return Math.min(23, hours) * 60 + Math.min(59, mins);
}

function formatClock(totalMins) {
  const wrapped = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function buildStops(entries, context) {
  const groupSize = Math.max(1, Number(context.groupSize) || 1);
  let clock = parseClock(context.startTime, 9 * 60);

  return entries.map((entry, idx) => {
    const exp = entry.experience;
    const leg = idx === 0 ? null : buildLeg(entries[idx - 1].experience, exp, context);
    const travelMins = leg ? leg.duration_mins : 0;
    clock += travelMins;
    const arrivalMins = clock;
    const stayMins = Math.max(20, Number(exp.approx_duration_mins) || 45);
    clock += stayMins;
    const departureMins = clock;
    const unitPrice = Number(exp.price) || 0;

    return {
      sequence: idx + 1,
      experience: exp,
      experience_id: exp.id,
      title: exp.title,
      category: exp.category,
      area: exp.area_name || null,
      price_inr: unitPrice,
      stay_mins: stayMins,
      best_time_of_day: timeSlot(exp),
      match_reasons: entry.match_reasons || [],
      score: entry.score || 0,
      arrival_time: formatClock(arrivalMins),
      departure_time: formatClock(departureMins),
      leg_from_previous: leg,
      line_total_inr: unitPrice * groupSize,
      is_hidden_gem: Boolean(exp.is_hidden_gem),
      is_indoor: Boolean(exp.is_indoor),
      is_family_friendly: Boolean(exp.is_family_friendly),
      low_walking: Boolean(exp.low_walking),
      wheelchair_accessible: Boolean(exp.wheelchair_accessible),
      latitude: exp.latitude,
      longitude: exp.longitude,
      area_name: exp.area_name,
      image_urls: exp.image_urls || [],
      tags: exp.tags || [],
    };
  });
}

function summarise(route, context) {
  const legs = route.stops.map((s) => s.leg_from_previous).filter(Boolean);
  const travelMins = legs.reduce((sum, leg) => sum + leg.duration_mins, 0);
  const stayMins = route.stops.reduce((sum, stop) => sum + stop.stay_mins, 0);
  const distanceKm = legs.reduce((sum, leg) => sum + leg.distance_km, 0);
  const longestLeg = legs.reduce((max, leg) => Math.max(max, leg.distance_km), 0);
  const cost = route.stops.reduce((sum, stop) => sum + stop.line_total_inr, 0);
  const windowMins = (Number(context.availableHours) || 8) * 60;

  return {
    ...route,
    stop_count: route.stops.length,
    total_duration_mins: travelMins + stayMins,
    travel_duration_mins: travelMins,
    stay_duration_mins: stayMins,
    total_distance_km: Number(distanceKm.toFixed(2)),
    longest_leg_km: Number(longestLeg.toFixed(2)),
    estimated_cost_inr: cost,
    start_time: route.stops[0]?.arrival_time || null,
    end_time: route.stops[route.stops.length - 1]?.departure_time || null,
    budget_label: cost > 0 ? `about Rs.${cost.toLocaleString('en-IN')}` : 'free entry throughout',
    context_filled: travelMins + stayMins <= windowMins,
    over_window_by_mins: Math.max(0, travelMins + stayMins - windowMins),
    has_long_haul: longestLeg > LEG_COMFORT_KM * 2.5,
  };
}

/**
 * Greedily fills a route while respecting the confirmed time window and
 * refusing to build a leg that is unreasonable for a day in one city.
 */
function fitToWindow(entries, context, options = {}) {
  const budgetMins = (Number(context.availableHours) || 8) * 60;
  const maxStops = Number(options.maxStops) || 0;
  const minStops = Math.max(1, Number(options.minStops) || 2);
  const allowLongLegs = options.allowLongLegs === true;

  const chosen = [];
  let used = 0;
  let previous = null;

  for (const entry of entries) {
    if (maxStops && chosen.length >= maxStops) break;
    const exp = entry.experience;
    const stay = Math.max(20, Number(exp.approx_duration_mins) || 45);
    const km = legKm(previous, exp);
    const legMins = previous ? (km > 0 ? estimateTravelTimeMins(km) : 0) : 0;
    const projected = used + stay + legMins;

    const pastMin = chosen.length >= minStops;
    if (pastMin && projected > budgetMins) break;
    if (pastMin && !allowLongLegs && km > MAX_SANE_LEG_KM) break;
    if (pastMin && projected > budgetMins * 1.3) break;

    chosen.push(entry);
    used = projected;
    previous = exp;
  }

  return chosen;
}

function idsOf(entries) {
  return new Set(entries.map((e) => e.experience.id));
}

function countOverlap(entriesA, entriesB) {
  const idsB = idsOf(entriesB);
  return entriesA.filter((e) => idsB.has(e.experience.id)).length;
}

function jaccard(a, b) {
  const idsB = idsOf(b);
  const shared = a.filter((e) => idsB.has(e.experience.id)).length;
  const union = new Set([...idsOf(a), ...idsB]).size;
  return union === 0 ? 0 : shared / union;
}

function buildRoute({
  id,
  title,
  tagline,
  vibe,
  pace,
  angle,
  entries,
  context,
  why,
  tradeOff,
  limitedByAvailability = false,
}) {
  const stops = buildStops(entries, context);
  return summarise(
    {
      id,
      title,
      tagline,
      vibe,
      pace,
      angle,
      why_it_works: why,
      trade_off: tradeOff,
      limited_by_availability: limitedByAvailability,
      start_point: entries[0]?.experience?.area_name || shortArea(entries[0].experience),
      stops,
    },
    context
  );
}

/** Stop count implied by the confirmed time window. */
function stopBudgetFor(context) {
  const hours = Number(context.availableHours) || 8;
  if (hours >= 16) return 6;
  if (hours >= 8) return 5;
  if (hours >= 5) return 4;
  return 3;
}

/**
 * Picks the tightest geographic cluster out of a candidate list. Used when
 * there are no fresh stops left, so the short route is a compact walkable
 * pocket of the city rather than an arbitrary slice of the long one.
 */
function tightestCluster(entries, want) {
  const list = asArray(entries);
  if (list.length <= want) return list;

  const withCoords = list.filter((e) => hasCoords(e.experience));
  const source = withCoords.length >= want ? withCoords : list;

  // Start from the stop nearest the geographic median, then grow by proximity
  const lat = source.map((e) => Number(e.experience.latitude)).sort((a, b) => a - b);
  const lon = source.map((e) => Number(e.experience.longitude)).sort((a, b) => a - b);
  const midLat = lat[Math.floor(lat.length / 2)];
  const midLon = lon[Math.floor(lon.length / 2)];

  const remaining = [...source];
  let best = remaining[0];
  let bestDist = Infinity;
  for (const entry of remaining) {
    const d = legKm({ latitude: midLat, longitude: midLon }, entry.experience);
    if (d < bestDist) {
      bestDist = d;
      best = entry;
    }
  }
  const cluster = [best];
  remaining.splice(remaining.indexOf(best), 1);

  while (cluster.length < want && remaining.length) {
    let pickIdx = 0;
    let pickCost = Infinity;
    remaining.forEach((candidate, idx) => {
      const cost = Math.min(...cluster.map((c) => legKm(c.experience, candidate.experience)));
      if (cost < pickCost) {
        pickCost = cost;
        pickIdx = idx;
      }
    });
    cluster.push(remaining.splice(pickIdx, 1)[0]);
  }

  return cluster;
}

/**
 * Produces up to three distinct routes for a city.
 *
 * Distinctness is enforced in two layers. Every route after the first is
 * seeded from stops the earlier routes have not claimed, and any route that
 * still shares too much ground is replaced by a genuinely different framing
 * (a compact variant or a reversed one). Whatever overlap survives is
 * reported honestly on the route as `overlaps_with_other_routes`.
 */
export function buildRouteOptions({
  experiences = [],
  intent = {},
  profile = {},
  city = null,
  startPoint = null,
}) {
  const pool = asArray(experiences).filter((entry) => entry && entry.experience);
  if (!pool.length) return [];

  const context = {
    groupSize: Math.max(1, Number(intent.group_size || profile.group_size) || 1),
    availableHours: Number(intent.available_hours || profile.available_hours) || 8,
    startTime: profile.start_time || intent.preferred_start_time || '09:00',
    lowWalking: Boolean(intent.accessibility_prefs?.lowWalking || intent.accessibility_prefs?.low_walking),
    startPoint,
  };

  const interests = asArray(intent.interests || profile.interests);
  const dominantInterest = interests[0] || null;
  const wantsQuiet = /quiet/i.test(String(profile.crowd_preference || ''));
  const wantsLively = /lively/i.test(String(profile.crowd_preference || ''));
  const stopBudget = stopBudgetFor(context);

  const byScoreDesc = [...pool].sort((a, b) => (b.score || 0) - (a.score || 0));
  const take = (list) => list.map((entry) => ({ ...entry }));

  // ---- Route 1: signature highlights ---------------------------------------
  const signatureSeed = take(byScoreDesc.slice(0, Math.min(pool.length, stopBudget + 3)));
  let signatureEntries = fitToWindow(orderStops(signatureSeed, context), context, {
    maxStops: stopBudget,
  });
  if (signatureEntries.length < 2) signatureEntries = take(byScoreDesc.slice(0, 2));

  // ---- Route 2: themed deep dive, seeded from unclaimed stops ---------------
  const claimed = idsOf(signatureEntries);
  const thematicPool = byScoreDesc
    .filter((e) => matchesInterest(e.experience, dominantInterest))
    .map((e) => ({ ...e }));
  const thematicSupport = byScoreDesc
    .filter((e) => !matchesInterest(e.experience, dominantInterest))
    .map((e) => ({ ...e }));

  // Unclaimed thematic stops first, then support, then anything left.
  const themedOrdered = [
    ...thematicPool.filter((e) => !claimed.has(e.experience.id)),
    ...thematicSupport.filter((e) => !claimed.has(e.experience.id)),
    ...thematicPool.filter((e) => claimed.has(e.experience.id)),
  ];
  let themedEntries = fitToWindow(
    orderStops(take(themedOrdered), context),
    context,
    { maxStops: Math.max(3, stopBudget - 1) }
  );
  let themedLimited = false;
  if (themedEntries.length < 2) {
    themedEntries = take(byScoreDesc.slice(1, 4));
    themedLimited = true;
  }

  // ---- Route 3: the counterpoint, from stops neither route used -------------
  const claimedNow = new Set([...idsOf(signatureEntries), ...idsOf(themedEntries)]);
  const fresh = byScoreDesc.filter((e) => !claimedNow.has(e.experience.id));

  const counterScored = fresh.map((entry) => {
    const exp = entry.experience;
    let bias = 0;
    if (wantsQuiet) {
      if (exp.is_hidden_gem) bias += 30;
      if (exp.low_walking) bias += 14;
      if (exp.wheelchair_accessible) bias += 6;
    }
    if (wantsLively) {
      if (['Food & Culinary', 'Music & Dance', 'events'].includes(exp.category)) bias += 20;
    }
    // Deliberately lean away from the dominant interest to create a real contrast
    if (dominantInterest && !matchesInterest(exp, dominantInterest)) bias += 22;
    if (exp.is_hidden_gem) bias += wantsQuiet ? 6 : 14;
    if (exp.is_indoor) bias += 5;
    return { ...entry, score: (entry.score || 0) + bias };
  });
  counterScored.sort((a, b) => (b.score || 0) - (a.score || 0));

  let counterEntries = fitToWindow(orderStops(take(counterScored), context), context, {
    maxStops: Math.max(2, stopBudget - 2),
  });
  let counterLimited = false;
  if (counterEntries.length < 2) {
    // Not enough unclaimed stops, so offer a tight re-cut of the city instead:
    // the most central cluster of already verified places, which is a shorter
    // and cheaper shape of day rather than a prefix of the long one.
    const wantStops = Math.max(2, Math.min(3, signatureEntries.length));
    counterEntries = fitToWindow(
      orderStops(take(tightestCluster(signatureEntries, wantStops)), context),
      context,
      { maxStops: wantStops }
    );
    counterLimited = true;
  }

  const cityLabel = city || 'the city';
  const pillar = pillarFor(dominantInterest);

  const routes = [
    buildRoute({
      id: 'route-signature',
      title: `${cityLabel} signature highlights`,
      tagline: `The strongest verified matches for your brief, ordered so you cover the most ground with the least riding.`,
      vibe: 'Balanced and reliable',
      pace: 'Steady',
      angle: 'signature',
      entries: signatureEntries,
      context,
      why: 'Top ranked for your interests and budget, sequenced so the day flows geographically instead of zig zagging across the city.',
      tradeOff: 'Covers the highlights rather than going deep on any single one of them.',
    }),
    buildRoute({
      id: 'route-themed',
      title: pillar ? pillar.label : 'Themed deep dive',
      tagline:
        pillar && thematicPool.length
          ? `Built around ${dominantInterest}, with the closest supporting stops only where they cost you nothing extra.`
          : 'A single themed thread through the day instead of scattered stops.',
      vibe: pillar ? `Focused on ${pillar.words[0]}` : 'Focused',
      pace: 'Deliberate',
      angle: 'themed',
      entries: themedEntries,
      context,
      limitedByAvailability: themedLimited,
      why: dominantInterest
        ? `You said ${dominantInterest} matters most, so this route spends its time there and only adds stops that sit on the way.`
        : 'Themed around your strongest interest so the day reads as one story rather than a checklist.',
      tradeOff: 'A narrower focus, so you will see less of the city overall.',
    }),
  ];

  const counterQuiet = wantsQuiet || !wantsLively;
  routes.push(
    buildRoute({
      id: 'route-alternative',
      title: counterLimited ? 'Compact re-cut' : counterQuiet ? 'Quiet counterpoint' : 'Lively evening alternative',
      tagline: counterLimited
        ? 'A shorter version of the highlights, trimmed to the stops that matter most so you finish early.'
        : 'A compact alternative built from places the other two routes skip, so it is a genuinely different day out.',
      vibe: counterQuiet ? 'Calm and uncrowded' : 'Energetic and social',
      pace: 'Compact',
      angle: 'alternative',
      entries: counterEntries,
      context,
      limitedByAvailability: counterLimited,
      why: counterLimited
        ? 'Fewer stops and an earlier finish, with the long hauls removed.'
        : counterQuiet
        ? 'Fewer stops, more breathing room, and a bias toward places that feel local rather than toured.'
        : 'Food, music and evening energy, sequenced so you can start late and still see a full evening.',
      tradeOff: 'Fewer stops by design, so it suits a shorter window than the signature route.',
    })
  );

  // ---- Second pass distinctness guard --------------------------------------
  const out = [];
  for (const route of routes) {
    if (route.stops.length < 2) continue;
    const similar = out.find((other) => jaccard(route.stops, other.stops) > 0.85);
    if (similar) {
      // Identical shape. Re-cut it into a genuinely different sequence.
      const reversed = [...route.stops].reverse();
      const rebuilt = buildRoute({
        id: route.id,
        title: similar.id === 'route-alternative' ? 'Late start alternative' : `${route.title} (reversed)`,
        tagline:
          'The same set of places, walked in the opposite direction so you finish somewhere new and skip the backtracking.',
        vibe: route.vibe,
        pace: 'Compact',
        angle: route.angle,
        entries: reversed.map((s) => ({ experience: s.experience, score: s.score, match_reasons: s.match_reasons })),
        context,
        limitedByAvailability: true,
        why: 'Same places, opposite direction, which removes the backtracking from the original plan.',
        tradeOff: 'Covers the same ground as the other option, so only pick one.',
      });
      out.push(rebuilt);
      continue;
    }
    out.push(route);
  }

  if (!out.length) return routes;

  return out.map((route) => ({
    ...route,
    overlaps_with_other_routes: out
      .filter((other) => other.id !== route.id)
      .reduce((max, other) => Math.max(max, countOverlap(route.stops, other.stops)), 0),
    experience_ids: route.stops.map((s) => s.experience_id),
  }));
}
