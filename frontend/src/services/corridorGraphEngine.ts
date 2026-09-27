/**
 * LOKIVA Geospatial Corridor Graph & Minimum-Distance Solver
 * Computes A -> B -> C Minimum-Detour Collinear Multi-Itineraries across India
 */

export interface CorridorNode {
  stateName: string;
  stateCode: string;
  primaryHubCity: string;
  signatureStops: string[];
  lat: number;
  lng: number;
  vibeTags: string[]; // ['heritage', 'crafts', 'food', 'rituals', 'monuments', 'nature', 'markets', 'arts', 'wellness']
  avgDailyCostInr: number;
  heroImage: string;
  highlightTagline: string;
}

export interface EnRouteCorridorEvaluation {
  originNode: CorridorNode;       // Point A (e.g. Maharashtra)
  intermediateNode: CorridorNode; // Point B (e.g. Madhya Pradesh)
  destinationNode: CorridorNode;  // Point C (e.g. Rajasthan)
  directDistanceKm: number;       // Dist(A -> C)
  chainedDistanceKm: number;      // Dist(A -> B) + Dist(B -> C)
  detourOverheadKm: number;       // Dist(A->B) + Dist(B->C) - Dist(A->C)
  detourPercentage: number;       // e.g. 6.4 (+6.4% extra distance)
  quizAffinityScore: number;      // 0-100 score based on user's quiz answers
  recommendedDaySplit: {
    originDays: number;           // Days in A
    bridgeDays: number;           // Days in B
    destinationDays: number;      // Days in C
    totalDays: number;
  };
  corridorNarrative: string;
  interStateTransitMode: string;  // e.g. "Express Heritage Rail / Golden Quadrilateral Highway Corridor"
  isViableMultiCorridor: boolean;
}

export const CORRIDOR_REGISTRY: Record<string, CorridorNode> = {
  maharashtra: {
    stateName: 'Maharashtra',
    stateCode: 'MH',
    primaryHubCity: 'Mumbai',
    signatureStops: ['Colaba Heritage Waterfront', 'Kala Ghoda Art Precinct', 'Ellora Basalt Caves', 'Nashik Vineyards'],
    lat: 18.9220,
    lng: 72.8347,
    vibeTags: ['heritage', 'food', 'arts', 'markets', 'monuments'],
    avgDailyCostInr: 4500,
    heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Victorian Gothic art districts, coastal promenades and Deccan gateway heritage',
  },
  'madhya pradesh': {
    stateName: 'Madhya Pradesh',
    stateCode: 'MP',
    primaryHubCity: 'Maheshwar & Mandu',
    signatureStops: ['Mandu Jahaz Mahal Water Palace', 'Maheshwar Narmada Handloom Ghats', 'Ujjain Mahakal Corridor', 'Khajuraho Temples'],
    lat: 22.1764,
    lng: 75.5869,
    vibeTags: ['heritage', 'crafts', 'rituals', 'monuments', 'offbeat', 'nature'],
    avgDailyCostInr: 3200,
    heroImage: 'https://images.unsplash.com/photo-1600100397608-f010e42f9e42?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Malwa plateau citadel palaces, Ahilyabai silk looms and sacred Narmada step-ghats',
  },
  gujarat: {
    stateName: 'Gujarat',
    stateCode: 'GJ',
    primaryHubCity: 'Ahmedabad',
    signatureStops: ['Adalaj Stepwell Architecture', 'Champaner UNESCO Fortress', 'Calico Textile Guilds', 'Manek Chowk Night Gastronomy'],
    lat: 23.0225,
    lng: 72.5714,
    vibeTags: ['crafts', 'food', 'monuments', 'markets', 'heritage'],
    avgDailyCostInr: 3400,
    heroImage: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Centuries-old subterranean stepwells, Ajrakh block printers and heritage pol havelis',
  },
  rajasthan: {
    stateName: 'Rajasthan',
    stateCode: 'RJ',
    primaryHubCity: 'Jaipur',
    signatureStops: ['Hawa Mahal Wind Pavilion', 'Johari Bazaar Artisan Ateliers', 'Amber Fort Courtyards', 'Udaipur Lake Palace'],
    lat: 26.9124,
    lng: 75.7873,
    vibeTags: ['heritage', 'crafts', 'food', 'markets', 'monuments', 'arts'],
    avgDailyCostInr: 4200,
    heroImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Pink City terracotta palaces, blue pottery masterclasses and royal Rajput citadels',
  },
  delhi: {
    stateName: 'Delhi',
    stateCode: 'DL',
    primaryHubCity: 'Delhi',
    signatureStops: ['Jama Masjid Sandstone Courtyard', 'Chandni Chowk Spice Bazaars', 'Humayun Tomb Mughal Gardens', 'Sunder Nursery'],
    lat: 28.6139,
    lng: 77.2090,
    vibeTags: ['heritage', 'food', 'monuments', 'markets', 'arts'],
    avgDailyCostInr: 3800,
    heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Seven historical empires, Mughal sandstone courtyards and legendary street hearths',
  },
  'uttar pradesh': {
    stateName: 'Uttar Pradesh',
    stateCode: 'UP',
    primaryHubCity: 'Varanasi & Agra',
    signatureStops: ['Dashashwamedh Ghat Riverfront', 'Banarasi Silk Weavers Quarter', 'Taj Mahal Dawn Viewpoint', 'Lucknow Chikan Ateliers'],
    lat: 25.3176,
    lng: 82.9739,
    vibeTags: ['rituals', 'heritage', 'crafts', 'food', 'monuments', 'arts'],
    avgDailyCostInr: 2800,
    heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Sacred riverfront dawn boat serene rites, world wonders and generational silk looms',
  },
  karnataka: {
    stateName: 'Karnataka',
    stateCode: 'KA',
    primaryHubCity: 'Hampi & Bengaluru',
    signatureStops: ['Hampi Vijayanagara Boulder Ruins', 'Mysuru Palace Royal Courtyard', 'Cubbon Park Bamboo Groves', 'Badami Cave Temples'],
    lat: 15.3350,
    lng: 76.4600,
    vibeTags: ['monuments', 'heritage', 'nature', 'arts', 'wellness', 'crafts'],
    avgDailyCostInr: 3600,
    heroImage: 'https://images.unsplash.com/photo-1600100397608-f010e42f9e42?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Granite boulder empires, sandalwood carvings and Hoysala architectural marvels',
  },
  kerala: {
    stateName: 'Kerala',
    stateCode: 'KL',
    primaryHubCity: 'Kochi & Munnar',
    signatureStops: ['Fort Kochi Chinese Fishing Nets', 'Alleppey Emerald Backwaters', 'Munnar High-Altitude Tea Estates', 'Kathakali Dance Theatres'],
    lat: 9.9312,
    lng: 76.2673,
    vibeTags: ['nature', 'wellness', 'arts', 'heritage', 'food'],
    avgDailyCostInr: 3800,
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Ayurvedic spice plantations, palm backwaters and Kathakali living arts',
  },
  'tamil nadu': {
    stateName: 'Tamil Nadu',
    stateCode: 'TN',
    primaryHubCity: 'Madurai & Chettinad',
    signatureStops: ['Meenakshi Amman Dravidian Towers', 'Chettinad 100-Room Mansions', 'Thanjavur Brihadisvara Granite Temple', 'Mahabalipuram Shore Temples'],
    lat: 9.9252,
    lng: 78.1198,
    vibeTags: ['rituals', 'monuments', 'heritage', 'crafts', 'food'],
    avgDailyCostInr: 2900,
    heroImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Towering polychrome gopurams, brass bell bronze guilds and spicy Chettinad feasts',
  },
  goa: {
    stateName: 'Goa',
    stateCode: 'GA',
    primaryHubCity: 'Panjim (Fontainhas)',
    signatureStops: ['Fontainhas Latin Quarter Tiles', 'Old Goa Se Cathedral Basilica', 'Sal Backwater Mangroves', 'Coastal Spice Plantation'],
    lat: 15.4909,
    lng: 73.8278,
    vibeTags: ['heritage', 'wellness', 'food', 'nature', 'offbeat'],
    avgDailyCostInr: 4500,
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Portuguese azulejo tile ateliers, riverside baroque chapels and feni distilleries',
  },
  telangana: {
    stateName: 'Telangana',
    stateCode: 'TS',
    primaryHubCity: 'Hyderabad',
    signatureStops: ['Golconda Acoustic Fort', 'Charminar Pearl & Ittar Bazaars', 'Chowmahalla Palace', 'Qutb Shahi Tombs'],
    lat: 17.3850,
    lng: 78.4867,
    vibeTags: ['food', 'monuments', 'markets', 'heritage', 'crafts'],
    avgDailyCostInr: 3400,
    heroImage: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Deccani Nizam royal halls, Nizami biryani culinary guilds and basra pearl craft',
  },
  'west bengal': {
    stateName: 'West Bengal',
    stateCode: 'WB',
    primaryHubCity: 'Kolkata & Darjeeling',
    signatureStops: ['Kumartuli Clay Idol Sculptors', 'College Street Heritage Bookstalls', 'Darjeeling Himalayan Toy Train', 'Victoria Memorial Gardens'],
    lat: 22.5726,
    lng: 88.3639,
    vibeTags: ['arts', 'food', 'heritage', 'crafts', 'nature', 'offbeat'],
    avgDailyCostInr: 2900,
    heroImage: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Terracotta temples, British colonial coffee houses and master clay artisan quarters',
  },
  odisha: {
    stateName: 'Odisha',
    stateCode: 'OD',
    primaryHubCity: 'Bhubaneswar & Puri',
    signatureStops: ['Konark Sun Temple Stone Wheels', 'Raghurajpur Pattachitra Painter Village', 'Chilika Lake Flamingos', 'Lingaraj Temple Complex'],
    lat: 20.2961,
    lng: 85.8245,
    vibeTags: ['crafts', 'monuments', 'rituals', 'heritage', 'nature'],
    avgDailyCostInr: 2600,
    heroImage: 'https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&w=800&q=80',
    highlightTagline: '100% artisan villages, ancient maritime stone carvings and sacred coastal temples',
  },
  'himachal pradesh': {
    stateName: 'Himachal Pradesh',
    stateCode: 'HP',
    primaryHubCity: 'Shimla & Dharamshala',
    signatureStops: ['Kangra Valley Miniature Painters', 'Dharamkot Himalayan Forest Trails', 'Viceregal Lodge Architecture', 'Tabo 1000-Year Monastery'],
    lat: 31.1048,
    lng: 77.1734,
    vibeTags: ['nature', 'wellness', 'heritage', 'offbeat', 'arts'],
    avgDailyCostInr: 3400,
    heroImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Himalayan cedar glades, Tibetan bronze casting and peaceful mountain monasteries',
  },
  uttarakhand: {
    stateName: 'Uttarakhand',
    stateCode: 'UK',
    primaryHubCity: 'Rishikesh & Kumaon',
    signatureStops: ['Triveni Ghat Evening Aarti', 'Vashishta Yoga Meditation Cave', 'Jageshwar 124 Ancient Shrines', 'Kumaoni Woodcraft Hamlets'],
    lat: 30.0869,
    lng: 78.2676,
    vibeTags: ['wellness', 'rituals', 'nature', 'heritage', 'offbeat'],
    avgDailyCostInr: 3000,
    heroImage: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Sacred river confluences, ancient deodar sanctuaries and Vedic wellness hearths',
  },
  punjab: {
    stateName: 'Punjab',
    stateCode: 'PB',
    primaryHubCity: 'Amritsar',
    signatureStops: ['Golden Temple Sacred Sarovar', 'Heritage Street Phulkari Weavers', 'Generational Brass Utensil Makers of Jandiala Guru', 'Attari Wagah Ceremony'],
    lat: 31.6340,
    lng: 74.8723,
    vibeTags: ['rituals', 'food', 'crafts', 'heritage', 'markets'],
    avgDailyCostInr: 2700,
    heroImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'Spiritual sanctums, UNESCO metalcraft guilds and legendary tandoori culinary heritage',
  },
  ladakh: {
    stateName: 'Ladakh',
    stateCode: 'LA',
    primaryHubCity: 'Leh',
    signatureStops: ['Thiksey Fortress Monastery', 'Hemis Museum & Silk Thangkas', 'Pangong High-Altitude Lake', 'Old Leh Palace Mudbrick Quarter'],
    lat: 34.1526,
    lng: 77.5771,
    vibeTags: ['nature', 'heritage', 'wellness', 'monuments', 'offbeat'],
    avgDailyCostInr: 4800,
    heroImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
    highlightTagline: 'High-altitude cold desert passes, ancient Buddhist thangkas and Himalayan stargazing',
  },
};

/**
 * Exact Haversine Great-Circle Distance Formula in Kilometers
 */
export function getDistanceKm(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normalizes any free-form state name or city to a registered CorridorNode
 */
export function normalizeStateNode(queryStr: string): CorridorNode {
  if (!queryStr) return CORRIDOR_REGISTRY.maharashtra;
  const clean = queryStr.toLowerCase().replace(/\(.*?\)/g, '').trim();

  // Direct state match
  if (CORRIDOR_REGISTRY[clean]) return CORRIDOR_REGISTRY[clean];

  // Partial match by state name or hub
  for (const key of Object.keys(CORRIDOR_REGISTRY)) {
    const node = CORRIDOR_REGISTRY[key];
    if (
      clean.includes(node.stateName.toLowerCase()) ||
      clean.includes(node.primaryHubCity.toLowerCase()) ||
      node.stateName.toLowerCase().includes(clean)
    ) {
      return node;
    }
  }

  // Common city aliases
  if (clean.includes('mumbai') || clean.includes('pune') || clean.includes('panvel') || clean.includes('nashik') || clean.includes('aurangabad')) {
    return CORRIDOR_REGISTRY.maharashtra;
  }
  if (clean.includes('jaipur') || clean.includes('udaipur') || clean.includes('jodhpur') || clean.includes('jaisalmer')) {
    return CORRIDOR_REGISTRY.rajasthan;
  }
  if (clean.includes('delhi') || clean.includes('ncr') || clean.includes('gurgaon') || clean.includes('noida')) {
    return CORRIDOR_REGISTRY.delhi;
  }
  if (clean.includes('bengaluru') || clean.includes('bangalore') || clean.includes('hampi') || clean.includes('mysore')) {
    return CORRIDOR_REGISTRY.karnataka;
  }
  if (clean.includes('kochi') || clean.includes('cochin') || clean.includes('alleppey') || clean.includes('munnar') || clean.includes('trivandrum')) {
    return CORRIDOR_REGISTRY.kerala;
  }
  if (clean.includes('varanasi') || clean.includes('banaras') || clean.includes('agra') || clean.includes('lucknow')) {
    return CORRIDOR_REGISTRY['uttar pradesh'];
  }
  if (clean.includes('bhopal') || clean.includes('indore') || clean.includes('ujjain') || clean.includes('gwalior') || clean.includes('mandu')) {
    return CORRIDOR_REGISTRY['madhya pradesh'];
  }
  if (clean.includes('ahmedabad') || clean.includes('vadodara') || clean.includes('surat') || clean.includes('kutch')) {
    return CORRIDOR_REGISTRY.gujarat;
  }
  if (clean.includes('chennai') || clean.includes('madurai') || clean.includes('chettinad') || clean.includes('thanjavur')) {
    return CORRIDOR_REGISTRY['tamil nadu'];
  }
  if (clean.includes('kolkata') || clean.includes('calcutta') || clean.includes('darjeeling')) {
    return CORRIDOR_REGISTRY['west bengal'];
  }

  return CORRIDOR_REGISTRY.rajasthan;
}

/**
 * Reverse-geocodes (lat, lng) to the nearest registered Indian Hub Node
 */
export function reverseGeocodeToNearestNode(lat: number, lng: number): CorridorNode {
  let nearestNode = CORRIDOR_REGISTRY.maharashtra;
  let minDistance = Infinity;

  for (const key of Object.keys(CORRIDOR_REGISTRY)) {
    const node = CORRIDOR_REGISTRY[key];
    const dist = getDistanceKm({ lat, lng }, { lat: node.lat, lng: node.lng });
    if (dist < minDistance) {
      minDistance = dist;
      nearestNode = node;
    }
  }

  return nearestNode;
}

export interface CorridorSolverOptions {
  originQuery: string;
  destinationQuery: string;
  totalDays?: number;
  userInterests?: string[];
  budgetDailyInr?: number;
  travelPace?: 'relaxed' | 'balanced' | 'packed';
}

export interface CorridorRecommendationSuite {
  directOption: EnRouteCorridorEvaluation;
  shortestCorridor: EnRouteCorridorEvaluation;
  scenicDetourCorridor: EnRouteCorridorEvaluation;
  allViableBridgeNodes: Array<{
    node: CorridorNode;
    evaluation: EnRouteCorridorEvaluation;
    isShortest: boolean;
    isScenic: boolean;
  }>;
}

/**
 * Builds a full corridor evaluation for a specific chosen intermediate bridge node
 */
export function buildEvaluationForBridgeNode(
  options: CorridorSolverOptions,
  bridgeNode: CorridorNode
): EnRouteCorridorEvaluation {
  const originNode = normalizeStateNode(options.originQuery || 'Maharashtra');
  const destinationNode = normalizeStateNode(options.destinationQuery || 'Rajasthan');
  const totalDays = Math.max(3, options.totalDays || 5);
  const userInterests = options.userInterests && options.userInterests.length > 0 ? options.userInterests : ['heritage', 'crafts', 'food'];

  const directDistanceKm = getDistanceKm(originNode, destinationNode);
  const distAB = getDistanceKm(originNode, bridgeNode);
  const distBC = getDistanceKm(bridgeNode, destinationNode);
  const chainedDistanceKm = distAB + distBC;
  const detourOverheadKm = Math.max(0, chainedDistanceKm - directDistanceKm);
  const detourPercentage = Number(((detourOverheadKm / Math.max(1, directDistanceKm)) * 100).toFixed(1));

  const matchingInterests = userInterests.filter((interest) =>
    bridgeNode.vibeTags.includes(interest.toLowerCase())
  );
  const quizAffinityScore = Math.round(
    (matchingInterests.length / Math.max(1, userInterests.length)) * 100
  );

  let originDays = 1;
  let bridgeDays = 2;
  let destinationDays = Math.max(1, totalDays - originDays - bridgeDays);

  if (totalDays === 3) {
    originDays = 1;
    bridgeDays = 1;
    destinationDays = 1;
  } else if (totalDays === 4) {
    originDays = 1;
    bridgeDays = 1;
    destinationDays = 2;
  } else if (totalDays >= 6) {
    originDays = 1;
    bridgeDays = 2;
    destinationDays = totalDays - 3;
  }

  let transitMode = 'Vande Bharat Express Rail / Golden Quadrilateral Corridor';
  if (directDistanceKm > 900) {
    transitMode = 'Heritage Express Rail & Multi-State Highway Corridor';
  }

  const topInterest = userInterests[0] || 'heritage';
  const narrative = `Seamless ${originNode.stateName} to ${destinationNode.stateName} expedition featuring a curated intermediate bridge in ${bridgeNode.stateName} (${bridgeNode.primaryHubCity}), adding authentic ${topInterest} stops along your direct transit vector with +${detourOverheadKm} km (${detourPercentage}%) detour overhead.`;

  return {
    originNode,
    intermediateNode: bridgeNode,
    destinationNode,
    directDistanceKm,
    chainedDistanceKm,
    detourOverheadKm,
    detourPercentage,
    quizAffinityScore,
    recommendedDaySplit: {
      originDays,
      bridgeDays,
      destinationDays,
      totalDays,
    },
    corridorNarrative: narrative,
    interStateTransitMode: transitMode,
    isViableMultiCorridor: directDistanceKm > 250,
  };
}

/**
 * Mathematical Collinear Minimum-Detour Graph Solver
 * Evaluates candidate states B between Origin A and Target C
 */
export function solveEnRouteCorridor(options: CorridorSolverOptions): EnRouteCorridorEvaluation {
  const suite = solveTripleCorridorRecommendationSuite(options);
  return suite.shortestCorridor;
}

/**
 * Comprehensive 3-Blueprint Suite Solver:
 * 1. Direct Vector (A -> C)
 * 2. Collinear Minimum-Detour Corridor (A -> B -> C)
 * 3. Cultural & Scenic Detour Corridor (A -> D -> C)
 * Plus interactive bridge candidates for dynamic swapping!
 */
export function solveTripleCorridorRecommendationSuite(
  options: CorridorSolverOptions
): CorridorRecommendationSuite {
  const originNode = normalizeStateNode(options.originQuery || 'Maharashtra');
  const destinationNode = normalizeStateNode(options.destinationQuery || 'Rajasthan');
  const totalDays = Math.max(3, options.totalDays || 5);
  const userInterests = options.userInterests && options.userInterests.length > 0 ? options.userInterests : ['heritage', 'crafts', 'food'];

  const directDistanceKm = getDistanceKm(originNode, destinationNode);

  // Direct option evaluation
  const directOption: EnRouteCorridorEvaluation = {
    originNode,
    intermediateNode: originNode,
    destinationNode,
    directDistanceKm,
    chainedDistanceKm: directDistanceKm,
    detourOverheadKm: 0,
    detourPercentage: 0,
    quizAffinityScore: 100,
    recommendedDaySplit: {
      originDays: 0,
      bridgeDays: 0,
      destinationDays: totalDays,
      totalDays,
    },
    corridorNarrative: `Pure single-destination immersion dedicating 100% of days to ${destinationNode.stateName} with zero intermediate border crossings.`,
    interStateTransitMode: 'Direct Express Transit / Rail Corridor',
    isViableMultiCorridor: false,
  };

  // Evaluate all candidate intermediate nodes B in the registry
  interface CandidateEval {
    node: CorridorNode;
    distAB: number;
    distBC: number;
    chainedDist: number;
    detourKm: number;
    detourPct: number;
    affinityScore: number;
    compositeScore: number;
  }

  const candidates: CandidateEval[] = [];

  for (const key of Object.keys(CORRIDOR_REGISTRY)) {
    const candidateNode = CORRIDOR_REGISTRY[key];

    // Skip endpoints
    if (
      candidateNode.stateName.toLowerCase() === originNode.stateName.toLowerCase() ||
      candidateNode.stateName.toLowerCase() === destinationNode.stateName.toLowerCase()
    ) {
      continue;
    }

    const distAB = getDistanceKm(originNode, candidateNode);
    const distBC = getDistanceKm(candidateNode, destinationNode);
    const chainedDist = distAB + distBC;
    const detourKm = Math.max(0, chainedDist - directDistanceKm);
    const detourPct = Number(((detourKm / Math.max(1, directDistanceKm)) * 100).toFixed(1));

    // Forward-progress geometric check
    const isForwardProgress = distAB < directDistanceKm * 1.5 && distBC < directDistanceKm * 1.5;
    if (!isForwardProgress && detourPct > 85) continue;

    const matchingInterests = userInterests.filter((interest) =>
      candidateNode.vibeTags.includes(interest.toLowerCase())
    );
    const affinityScore = Math.round(
      (matchingInterests.length / Math.max(1, userInterests.length)) * 100
    );

    const detourScore = Math.max(0, 100 - detourPct * 1.5);
    const compositeScore = 0.7 * detourScore + 0.3 * affinityScore;

    candidates.push({
      node: candidateNode,
      distAB,
      distBC,
      chainedDist,
      detourKm,
      detourPct,
      affinityScore,
      compositeScore,
    });
  }

  // Sort by detourKm ascending for shortest corridor
  const sortedByDetour = [...candidates].sort((a, b) => a.detourKm - b.detourKm);

  // Sort by composite affinity & cultural scenic richness for alternate detour
  const sortedByScenic = [...candidates].sort((a, b) => {
    // Rank by combination of affinity + reasonable distance
    const scoreA = a.affinityScore * 1.2 - a.detourPct * 0.4;
    const scoreB = b.affinityScore * 1.2 - b.detourPct * 0.4;
    return scoreB - scoreA;
  });

  const shortestCandidate = sortedByDetour[0]?.node || CORRIDOR_REGISTRY.gujarat || CORRIDOR_REGISTRY['madhya pradesh'];

  // Ensure scenic candidate is distinct from shortest candidate
  let scenicCandidate = sortedByScenic.find((c) => c.node.stateName !== shortestCandidate.stateName)?.node;
  if (!scenicCandidate) {
    scenicCandidate = sortedByDetour[1]?.node || CORRIDOR_REGISTRY['madhya pradesh'];
  }

  const shortestCorridor = buildEvaluationForBridgeNode(options, shortestCandidate);
  const scenicDetourCorridor = buildEvaluationForBridgeNode(options, scenicCandidate);

  // Compile all viable bridge nodes for interactive swapping
  const allViableBridgeNodes = candidates.map((c) => ({
    node: c.node,
    evaluation: buildEvaluationForBridgeNode(options, c.node),
    isShortest: c.node.stateName === shortestCandidate.stateName,
    isScenic: c.node.stateName === scenicCandidate.stateName,
  }));

  return {
    directOption,
    shortestCorridor,
    scenicDetourCorridor,
    allViableBridgeNodes,
  };
}
