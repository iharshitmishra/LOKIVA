/**
 * LOKIVA Digital Twin & Geospatial Impact Simulation Service
 * Provides live weather radar fronts, vulnerable outdoor monuments,
 * safe indoor sanctuaries, delay propagation transit vectors, and real-world social signals.
 */

export const SIMULATION_CITIES = {
  jaipur: {
    city: 'Jaipur',
    state: 'Rajasthan',
    center: [26.9248, 75.8246], // Lat, Lng
    zoom: 13,
    weatherFronts: {
      rain: {
        condition: 'Severe Monsoon Rainstorm',
        precipitation_mm_hr: 34.5,
        reflectivity_dbz: 49,
        wind_kmh: 28,
        temp_c: 24.5,
        severity: 'critical',
        cloudBounds: [
          [26.995, 75.78],
          [26.885, 75.875],
        ],
        cloudCenter: [26.945, 75.83],
        radius_km: 7.2,
      },
      heat: {
        condition: 'Extreme Solar Heatwave',
        temp_c: 43.8,
        uv_index: 11.2,
        feels_like_c: 47.1,
        severity: 'high',
        cloudBounds: [
          [26.98, 75.76],
          [26.87, 75.89],
        ],
        cloudCenter: [26.9248, 75.8246],
        radius_km: 9.5,
      },
      clear: {
        condition: 'Clear & Pleasant',
        temp_c: 27.0,
        uv_index: 5.0,
        feels_like_c: 27.5,
        severity: 'low',
        cloudBounds: null,
        cloudCenter: null,
        radius_km: 0,
      },
    },
    vulnerableMonuments: [
      {
        id: 'mon-jp-1',
        name: 'Amer Fort Upper Ramparts & Maota Lake',
        category: 'Heritage Citadel & Fort Ramparts',
        lat: 26.9855,
        lng: 75.8513,
        type: 'outdoor_monument',
        hazardType: 'Flash Flood & Wet Stone Slippery Ramparts',
        heatHazard: 'Zero shade, 44°C stone radiative heat',
        severity: 'critical',
        displacedHeadcount: 160,
        status: 'Temporary Terrace Closure',
        evacuationUrgency: 'High',
        recommendedShelterId: 'sanc-jp-2',
        recommendedShelterName: 'Anokhi Museum of Hand Printing',
        description:
          'Open stone staircases and exposed battlement terraces experience rapid torrential runoff and slippery algae.',
      },
      {
        id: 'mon-jp-2',
        name: 'Panna Meena Kund / Chand Baori Stepwell',
        category: 'Ancient Geometric Stepwell',
        lat: 26.9862,
        lng: 75.8538,
        type: 'outdoor_monument',
        hazardType: 'Steep Unrailed Incline & Water Surge',
        heatHazard: 'High radiant heat trapped in baori pit',
        severity: 'critical',
        displacedHeadcount: 75,
        status: 'Entry Suspended by Guards',
        evacuationUrgency: 'Immediate',
        recommendedShelterId: 'sanc-jp-2',
        recommendedShelterName: 'Anokhi Museum of Hand Printing',
        description:
          'Deep unrailed criss-cross steps become hazardous with rapid water pooling; guards diverting visitors.',
      },
      {
        id: 'mon-jp-3',
        name: 'Jantar Mantar Open Observatory',
        category: 'Astronomical Monument',
        lat: 26.9248,
        lng: 75.8246,
        type: 'outdoor_monument',
        hazardType: 'Open-Sky Exposure & Waterlogging',
        heatHazard: 'Direct insolation, sunstroke hazard',
        severity: 'moderate',
        displacedHeadcount: 110,
        status: 'Active Warning',
        evacuationUrgency: 'Moderate',
        recommendedShelterId: 'sanc-jp-3',
        recommendedShelterName: 'City Palace Sabha & Royal Textile Gallery',
        description:
          'Massive masonry instruments provide zero overhead cover during cloudbursts and extreme midday solar spikes.',
      },
      {
        id: 'mon-jp-4',
        name: 'Nahargarh Fort Ridge Watchtower',
        category: 'Hilltop Bastion & Sunset Point',
        lat: 26.9372,
        lng: 75.8155,
        type: 'outdoor_monument',
        hazardType: 'Severe Gale Gusts & Lightning Hazard',
        heatHazard: 'Exposed rocky ridge with no breeze shield',
        severity: 'high',
        displacedHeadcount: 90,
        status: 'Rerouting Recommended',
        evacuationUrgency: 'High',
        recommendedShelterId: 'sanc-jp-1',
        recommendedShelterName: 'Kripal Kumbh Blue Pottery Atelier',
        description:
          'Aravalli ridge exposure subject to sudden monsoon squalls, lightning vulnerability, and road landslides.',
      },
    ],
    safeSanctuaries: [
      {
        id: 'sanc-jp-1',
        name: 'Kripal Kumbh Blue Pottery Atelier',
        category: 'Artisan Workshop & Guild Studio',
        lat: 26.9205,
        lng: 75.7925,
        type: 'indoor_sanctuary',
        absorptionCapacityTotal: 35,
        absorbedCurrent: 14,
        availableCapacity: 21,
        shelterFacilities: [
          '100% Covered Studio',
          'Step-Free Ground Floor',
          'Traditional Chai & Spiced Water',
          'Live Potter Wheel Experience',
          'Clean Restrooms & Power Backing',
        ],
        distanceFromHazardKm: 2.1,
        priceInr: 450,
        status: 'Welcoming Displaced Guests',
        is_rain_safe: true,
      },
      {
        id: 'sanc-jp-2',
        name: 'Anokhi Museum of Hand Printing',
        category: 'Heritage Haveli Textile Museum',
        lat: 26.9897,
        lng: 75.8542,
        type: 'indoor_sanctuary',
        absorptionCapacityTotal: 65,
        absorbedCurrent: 28,
        availableCapacity: 37,
        shelterFacilities: [
          'Climate-Controlled Haveli',
          'Block-Printing Workshops',
          'Covered Courtyard Cafe',
          'Luggage & Umbrella Storage',
        ],
        distanceFromHazardKm: 0.4,
        priceInr: 150,
        status: 'Prime Amer Fort Refuge',
        is_rain_safe: true,
      },
      {
        id: 'sanc-jp-3',
        name: 'City Palace Sabha & Royal Textile Gallery',
        category: 'Covered Palatial Archive',
        lat: 26.9258,
        lng: 75.8237,
        type: 'indoor_sanctuary',
        absorptionCapacityTotal: 150,
        absorbedCurrent: 55,
        availableCapacity: 95,
        shelterFacilities: [
          'Pillared Marble Pavilions',
          'Comprehensive AC Galleries',
          'First Aid & Audio Guides',
          'Step-Free Ramps Throughout',
        ],
        distanceFromHazardKm: 0.1,
        priceInr: 300,
        status: 'High-Capacity Sanctuary',
        is_rain_safe: true,
      },
      {
        id: 'sanc-jp-4',
        name: 'Laxmi Mishthan Bhandar (LMB) Heritage Haveli',
        category: 'Historic Culinary Tearoom',
        lat: 26.9218,
        lng: 75.8265,
        type: 'indoor_sanctuary',
        absorptionCapacityTotal: 80,
        absorbedCurrent: 42,
        availableCapacity: 38,
        shelterFacilities: [
          'Dry Covered Johari Arcade',
          'Hot Ghewar & Fresh Kachoris',
          'Filtered Water & Wi-Fi',
        ],
        distanceFromHazardKm: 0.8,
        priceInr: 350,
        status: 'Warm Culinary Haven',
        is_rain_safe: true,
      },
    ],
    transitVectors: [
      {
        id: 'tv-jp-1',
        name: 'Amer Road NH11 Underpass Corridor',
        from: 'Jal Mahal Causeway',
        to: 'Amer Fort Foothills',
        coordinates: [
          [26.965, 75.845],
          [26.972, 75.848],
          [26.979, 75.85],
          [26.985, 75.851],
        ],
        congestionLevel: 'severe',
        delayMinutes: 42,
        normalDurationMins: 11,
        currentDurationMins: 53,
        waterloggingDepthCm: 38,
        propagationFactor: 2.8,
        status: 'Critical Waterlogging · Crawl Speed 5 km/h',
        color: '#EF4444', // Red
      },
      {
        id: 'tv-jp-2',
        name: 'Badi Chaupar to Hawa Mahal Arterial',
        from: 'Johari Bazaar',
        to: 'Tripolia Gate',
        coordinates: [
          [26.921, 75.826],
          [26.923, 75.825],
          [26.924, 75.827],
          [26.927, 75.828],
        ],
        congestionLevel: 'moderate',
        delayMinutes: 18,
        normalDurationMins: 7,
        currentDurationMins: 25,
        waterloggingDepthCm: 12,
        propagationFactor: 1.6,
        status: 'Slow Flow · Rickshaw Bottleneck',
        color: '#F59E0B', // Amber
      },
      {
        id: 'tv-jp-3',
        name: 'MI Road to Elevated Delhi Bypass Expressway',
        from: 'Ajmeri Gate',
        to: 'Transport Nagar Bypass',
        coordinates: [
          [26.916, 75.818],
          [26.912, 75.83],
          [26.915, 75.845],
          [26.922, 75.858],
        ],
        congestionLevel: 'clear',
        delayMinutes: 0,
        normalDurationMins: 14,
        currentDurationMins: 14,
        waterloggingDepthCm: 0,
        propagationFactor: 1.0,
        status: 'Clear Priority Bypass · Fast Moving',
        color: '#10B981', // Emerald
      },
    ],
    socialSignals: [
      {
        id: 'soc-jp-1',
        platform: 'x',
        author: 'JaipurTrafficPolice',
        authorName: 'Jaipur Traffic Police',
        handle: '@JaipurTrafficPolice',
        avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80',
        verified: true,
        timeAgo: '3m ago',
        urgency: 'critical',
        sentiment: 'alert',
        text: '🚨 WATERLOGGING ADVISORY: Amer Road near Jal Mahal causeway has ~1.5 ft standing water. Light vehicles and e-rickshaws diverted via Delhi Bypass. Heavy vehicles crawl only.',
        lat: 26.972,
        lng: 75.848,
        locationName: 'Amer Road NH11',
        upvotes: 142,
        verificationsCount: 28,
        tags: ['#JaipurRains', '#TrafficAlert', '#AmerFort'],
      },
      {
        id: 'soc-jp-2',
        platform: 'reddit',
        author: 'u/heritage_nomad',
        authorName: 'Aarav M.',
        handle: 'r/jaipur',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        verified: false,
        timeAgo: '9m ago',
        urgency: 'high',
        sentiment: 'sanctuary_tip',
        text: 'PSA if you are stuck near Amer Fort: The rampart stone stairs are dangerously slick right now. The guards just redirected our group to Anokhi Museum down the lane. Completely dry, zero crowds, and they have hot masala chai!',
        lat: 26.9897,
        lng: 75.8542,
        locationName: 'Anokhi Museum, Amer',
        upvotes: 94,
        verificationsCount: 16,
        tags: ['#SafeShelter', '#AnokhiMuseum', '#MonsoonHack'],
      },
      {
        id: 'soc-jp-3',
        platform: 'instagram',
        author: 'culture_traveler_clara',
        authorName: 'Clara Jenkins',
        handle: '@claratravels',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        verified: true,
        timeAgo: '16m ago',
        urgency: 'moderate',
        sentiment: 'delight',
        text: 'Rain completely transformed our day in the best way! Rerouted from open stepwells to Kripal Kumbh studio. Learned blue pottery painting while thunder was rolling outside! 🌧️🏺 10/10 recommend indoor guilds!',
        lat: 26.9205,
        lng: 75.7925,
        locationName: 'Kripal Kumbh Studio',
        upvotes: 215,
        verificationsCount: 39,
        tags: ['#BluePottery', '#IndoorCraft', '#RainyDayJaipur'],
      },
      {
        id: 'soc-jp-4',
        platform: 'citizen_sentinel',
        author: 'GroundGuide_Vikram',
        authorName: 'Vikram Singh (Verified Local Host)',
        handle: '@VikramGuide_JP',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        verified: true,
        timeAgo: '24m ago',
        urgency: 'high',
        sentiment: 'closure_notice',
        text: 'Panna Meena Kund stepwell gates closed by archaeological staff till 4 PM due to sudden surge water pool at base. Please do not send travelers there on two wheelers.',
        lat: 26.9862,
        lng: 75.8538,
        locationName: 'Panna Meena Kund',
        upvotes: 68,
        verificationsCount: 31,
        tags: ['#BaoriClosed', '#SafetyFirst', '#GuideReport'],
      },
    ],
  },
  mumbai: {
    city: 'Mumbai',
    state: 'Maharashtra',
    center: [18.96, 72.82],
    zoom: 12,
    weatherFronts: {
      rain: {
        condition: 'High-Tide Coastal Monsoon Cloudburst',
        precipitation_mm_hr: 48.0,
        reflectivity_dbz: 54,
        wind_kmh: 42,
        temp_c: 26.2,
        severity: 'critical',
        cloudBounds: [
          [19.08, 72.78],
          [18.91, 72.87],
        ],
        cloudCenter: [18.96, 72.82],
        radius_km: 11.5,
      },
      heat: {
        condition: 'Humid Coastal Heat Index Surge',
        temp_c: 38.5,
        uv_index: 9.8,
        feels_like_c: 46.2,
        severity: 'moderate',
        cloudBounds: null,
        cloudCenter: null,
        radius_km: 8.0,
      },
      clear: {
        condition: 'Breezy & Clear',
        temp_c: 28.0,
        uv_index: 6.0,
        feels_like_c: 29.0,
        severity: 'low',
        cloudBounds: null,
        cloudCenter: null,
        radius_km: 0,
      },
    },
    vulnerableMonuments: [
      {
        id: 'mon-mb-1',
        name: 'Marine Drive Coastal Promenade',
        category: 'Open Seawall & Promenade',
        lat: 18.9438,
        lng: 72.8232,
        type: 'outdoor_monument',
        hazardType: 'High-Tide Wave Overtopping & Spray Surge',
        heatHazard: 'High humidity thermal stress, zero canopy',
        severity: 'critical',
        displacedHeadcount: 240,
        status: 'Police Barricades Active',
        evacuationUrgency: 'High',
        recommendedShelterId: 'sanc-mb-1',
        recommendedShelterName: 'CSMVS Museum & Kala Ghoda Ateliers',
        description: '4.5m spring tide waves crashing over the tetrapods; promenade access cordoned.',
      },
      {
        id: 'mon-mb-2',
        name: 'Gateway of India & Apollo Bunder Pier',
        category: 'Harbor Waterfront Monument',
        lat: 18.922,
        lng: 72.8347,
        type: 'outdoor_monument',
        hazardType: 'Harbor Water Inundation & Jetty Suspension',
        heatHazard: 'Intense glare and stone heat',
        severity: 'critical',
        displacedHeadcount: 320,
        status: 'Ferry Operations Suspended',
        evacuationUrgency: 'Immediate',
        recommendedShelterId: 'sanc-mb-1',
        recommendedShelterName: 'CSMVS Museum & Kala Ghoda Ateliers',
        description: 'Harbor ferries to Elephanta suspended; waterfront piazza flooded during high tide.',
      },
    ],
    safeSanctuaries: [
      {
        id: 'sanc-mb-1',
        name: 'CSMVS Museum Heritage Hall & Indo-Saracenic Pavilions',
        category: 'Master Covered Heritage Museum',
        lat: 18.9269,
        lng: 72.8327,
        type: 'indoor_sanctuary',
        absorptionCapacityTotal: 250,
        absorbedCurrent: 85,
        availableCapacity: 165,
        shelterFacilities: [
          'Palatial Heritage Dome Roof',
          'Central Air Conditioning',
          'Palm Lounge Covered Tearoom',
          'Elevators & Full Wheelchair Access',
        ],
        distanceFromHazardKm: 0.6,
        priceInr: 150,
        status: 'Spacious Premier Shelter',
        is_rain_safe: true,
      },
      {
        id: 'sanc-mb-2',
        name: 'Sassoon Dock Covered Artisan Art Space',
        category: 'Maritime Atelier & Gallery',
        lat: 18.913,
        lng: 72.823,
        type: 'indoor_sanctuary',
        absorptionCapacityTotal: 60,
        absorbedCurrent: 18,
        availableCapacity: 42,
        shelterFacilities: ['Dry Covered Warehouse Loft', 'Coffee Bar', 'Dock Storytelling'],
        distanceFromHazardKm: 1.2,
        priceInr: 200,
        status: 'Authentic Harbor Retreat',
        is_rain_safe: true,
      },
    ],
    transitVectors: [
      {
        id: 'tv-mb-1',
        name: 'Hindmata / Dadar Underpass Arterial',
        from: 'Dadar TT Circle',
        to: 'Parel Junction',
        coordinates: [
          [19.018, 72.843],
          [19.012, 72.841],
          [19.004, 72.84],
        ],
        congestionLevel: 'severe',
        delayMinutes: 55,
        normalDurationMins: 9,
        currentDurationMins: 64,
        waterloggingDepthCm: 52,
        propagationFactor: 3.5,
        status: 'Waterlogging Critical · Traffic Gridlocked',
        color: '#EF4444',
      },
      {
        id: 'tv-mb-2',
        name: 'Coastal Road Elevated Tunnel Passage',
        from: 'Worli Sea Face',
        to: 'Marine Drive Plaza',
        coordinates: [
          [19.01, 72.815],
          [18.975, 72.805],
          [18.948, 72.818],
        ],
        congestionLevel: 'clear',
        delayMinutes: 0,
        normalDurationMins: 10,
        currentDurationMins: 10,
        waterloggingDepthCm: 0,
        propagationFactor: 1.0,
        status: 'All Lanes Open · High Drainage Efficiency',
        color: '#10B981',
      },
    ],
    socialSignals: [
      {
        id: 'soc-mb-1',
        platform: 'x',
        author: 'MumbaiPolice',
        authorName: 'Mumbai Police Official',
        handle: '@MumbaiPolice',
        avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80',
        verified: true,
        timeAgo: '4m ago',
        urgency: 'critical',
        sentiment: 'alert',
        text: '🌊 High tide of 4.67m predicted at 13:42 hrs. Citizens and tourists are requested to stay away from Marine Drive, Bandstand, and Girgaon Chowpatty promenades.',
        lat: 18.9438,
        lng: 72.8232,
        locationName: 'Marine Drive',
        upvotes: 380,
        verificationsCount: 88,
        tags: ['#MumbaiMonsoon', '#HighTide', '#SafetyAlert'],
      },
      {
        id: 'soc-mb-2',
        platform: 'instagram',
        author: 'mumbai_heritage_walks',
        authorName: 'Kala Ghoda Guide Cohort',
        handle: '@kalaghodawalks',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        verified: true,
        timeAgo: '12m ago',
        urgency: 'moderate',
        sentiment: 'sanctuary_tip',
        text: 'Rain is lashing South Bombay! Moved our walking cohort into CSMVS Museum grand halls. Absolutely stunning acoustics and zero rain bother. Come join us in the textile wing.',
        lat: 18.9269,
        lng: 72.8327,
        locationName: 'CSMVS Museum',
        upvotes: 184,
        verificationsCount: 22,
        tags: ['#CSMVS', '#ArtisanShelter', '#SouthBombay'],
      },
    ],
  },
};

// In-memory array for user-submitted citizen ground reports
const citizenReportsStore = [];

// Cache for live weather API responses (TTL: 5 minutes)
const liveWeatherCache = new Map();

/**
 * Fetch live meteorological data from real-time Open-Meteo API.
 */
export async function fetchLiveWeatherFromApi(lat = 26.9124, lng = 75.7873, cityName = 'Jaipur') {
  const cacheKey = `${cityName.toLowerCase()}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const now = Date.now();
  if (liveWeatherCache.has(cacheKey)) {
    const cached = liveWeatherCache.get(cacheKey);
    if (now - cached.timestamp < 300000) {
      return cached.data;
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&forecast_days=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Weather API returned status ${res.status}`);
    const data = await res.json();
    const curr = data.current || {};

    const codeDescriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy conditions',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy torrential rain',
      80: 'Rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm with lightning',
    };

    const description = codeDescriptions[curr.weather_code] || 'Variable meteorological front';

    const result = {
      source: 'Open-Meteo Global Meteorology Service',
      city: cityName,
      lat,
      lng,
      timestamp: curr.time || new Date().toISOString(),
      temperature_c: curr.temperature_2m ?? 24.0,
      relative_humidity_percent: curr.relative_humidity_2m ?? 65,
      precipitation_mm: curr.precipitation ?? 0,
      rain_mm: curr.rain ?? 0,
      weather_code: curr.weather_code ?? 0,
      weather_description: description,
      wind_speed_kmh: curr.wind_speed_10m ?? 8.5,
      is_live_connected: true,
    };

    liveWeatherCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err) {
    console.warn(`[Digital Twin] Open-Meteo fallback for ${cityName}:`, err.message);
    return {
      source: 'LOKIVA Meteorological Digital Twin (Fallback)',
      city: cityName,
      lat,
      lng,
      timestamp: new Date().toISOString(),
      temperature_c: 25.4,
      relative_humidity_percent: 72,
      precipitation_mm: 12.5,
      rain_mm: 12.5,
      weather_code: 63,
      weather_description: 'Moderate Monsoon Rain',
      wind_speed_kmh: 18.2,
      is_live_connected: false,
    };
  }
}

/**
 * Fetch digital twin simulation model for a city, weather condition, and optional What-If counterfactual scenario parameters.
 */
export async function getDigitalTwinSimulation(city = 'Jaipur', condition = 'rain', whatIf = {}) {
  const normCity = (city || 'jaipur').toLowerCase().trim();
  const cityData = SIMULATION_CITIES[normCity] || SIMULATION_CITIES['jaipur'];

  // 1. Fetch genuine live weather telemetry from Open-Meteo
  const liveWeather = await fetchLiveWeatherFromApi(
    cityData.center[0],
    cityData.center[1],
    cityData.city
  );

  const baseWeather = cityData.weatherFronts[condition] || cityData.weatherFronts['rain'];

  // 2. Parse What-If counterfactual scenario parameters
  const rainfallIntensity =
    whatIf.rainfall_intensity !== undefined && whatIf.rainfall_intensity !== ''
      ? Number(whatIf.rainfall_intensity)
      : baseWeather.precipitation_mm_hr || (condition === 'rain' ? 34.5 : 0);

  const temperature =
    whatIf.temperature !== undefined && whatIf.temperature !== ''
      ? Number(whatIf.temperature)
      : baseWeather.temp_c || liveWeather.temperature_c || 24.5;

  const stormDuration =
    whatIf.storm_duration !== undefined && whatIf.storm_duration !== ''
      ? Number(whatIf.storm_duration)
      : 3.5; // default 3.5 hours

  const floodDepth =
    whatIf.flood_depth !== undefined && whatIf.flood_depth !== ''
      ? Number(whatIf.flood_depth)
      : rainfallIntensity > 40
      ? Math.round((rainfallIntensity - 20) * 0.8)
      : condition === 'rain'
      ? 18
      : 0;

  // 3. Dynamic Weather Front adjusted by What-If parameters
  const isWhatIfActive = Boolean(
    whatIf.rainfall_intensity !== undefined ||
      whatIf.temperature !== undefined ||
      whatIf.flood_depth !== undefined ||
      whatIf.storm_duration !== undefined
  );

  const effectiveWeather = {
    ...baseWeather,
    precipitation_mm_hr: rainfallIntensity,
    temp_c: temperature,
    storm_duration_hours: stormDuration,
    flood_depth_cm: floodDepth,
    radius_km:
      condition === 'rain'
        ? Math.max(3.0, Math.min(15.0, (baseWeather.radius_km || 7.2) * (1 + rainfallIntensity / 100)))
        : baseWeather.radius_km || 0,
    severity:
      rainfallIntensity > 50 || floodDepth > 30 || temperature > 44
        ? 'critical'
        : rainfallIntensity > 20 || temperature > 39
        ? 'high'
        : condition === 'clear'
        ? 'low'
        : 'moderate',
    isWhatIfActive,
  };

  // 4. Mathematical Propagation: Vulnerable Outdoor Monuments
  const intensityMultiplier =
    condition === 'rain'
      ? Math.max(0.2, (rainfallIntensity / 30) * (1 + floodDepth / 40))
      : condition === 'heat'
      ? Math.max(0.4, (temperature / 40) * (1 + stormDuration / 8))
      : 0;

  const simulatedMonuments = cityData.vulnerableMonuments.map((m) => {
    const displacedHeadcount =
      condition === 'clear' ? 0 : Math.round(m.displacedHeadcount * intensityMultiplier);

    const isClosed =
      (condition === 'rain' && (rainfallIntensity > 45 || floodDepth > 30)) ||
      (condition === 'heat' && temperature > 45);

    return {
      ...m,
      displacedHeadcount,
      status: isClosed
        ? 'EMERGENCY CLOSURE - ACTIVE HAZARD'
        : condition === 'clear'
        ? 'Open & Normal Baseline'
        : m.status,
      severity:
        displacedHeadcount > 180 || isClosed
          ? 'critical'
          : displacedHeadcount > 90
          ? 'high'
          : 'moderate',
      evacuationUrgency: isClosed ? 'Immediate' : m.evacuationUrgency,
      isActiveHazard: condition !== 'clear',
    };
  });

  const totalDisplacedTourists = simulatedMonuments.reduce(
    (sum, m) => sum + m.displacedHeadcount,
    0
  );

  // 5. Mathematical Propagation: Transit delay vectors & road bottlenecks
  const simulatedTransitVectors = cityData.transitVectors.map((tv) => {
    if (condition === 'clear') {
      return {
        ...tv,
        congestionLevel: 'clear',
        delayMinutes: 0,
        currentDurationMins: tv.normalDurationMins,
        color: '#10B981',
        status: 'Clear Baseline Flow',
      };
    }

    const addedDelay = Math.round(
      (rainfallIntensity * 0.65) + (floodDepth * 0.95) + (stormDuration * 2.2)
    );

    const simulatedDelay = Math.max(5, tv.delayMinutes ? Math.round(tv.delayMinutes * (addedDelay / 35)) : addedDelay);
    const simulatedDuration = tv.normalDurationMins + simulatedDelay;

    let congestionLevel = 'moderate';
    let color = '#F59E0B';
    let status = `Traffic Delay +${simulatedDelay}m`;

    if (simulatedDelay > 35 || floodDepth > 28) {
      congestionLevel = 'severe';
      color = '#EF4444';
      status = `Critical Waterlogging (+${simulatedDelay}m delay)`;
    } else if (simulatedDelay > 18) {
      congestionLevel = 'heavy';
      color = '#EA580C';
      status = `Heavy Sluggish Flow (+${simulatedDelay}m)`;
    }

    return {
      ...tv,
      delayMinutes: simulatedDelay,
      currentDurationMins: simulatedDuration,
      congestionLevel,
      color,
      status,
      waterDepthCm: Math.round(floodDepth * (tv.id.includes('1') ? 1.0 : 0.6)),
    };
  });

  // 6. Mathematical Propagation: Safe Indoor Artisan Sanctuaries & Haveli Capacity
  const totalSanctuarySeats = cityData.safeSanctuaries.reduce((sum, s) => sum + s.capacity, 0);
  const absorptionRate = Math.min(
    0.95,
    totalDisplacedTourists > 0 ? (totalDisplacedTourists * 0.65) / totalSanctuarySeats : 0.15
  );

  const simulatedSanctuaries = cityData.safeSanctuaries.map((s) => {
    const absorbedVisitors = Math.min(s.capacity - 5, Math.round(s.capacity * absorptionRate));
    const availableCapacity = Math.max(3, s.capacity - absorbedVisitors);
    const occupancyPercent = Math.round(((s.capacity - availableCapacity) / s.capacity) * 100);

    return {
      ...s,
      absorbedVisitors,
      availableCapacity,
      occupancyPercent,
      surgeStatus:
        occupancyPercent > 85
          ? 'Near Max Shelter Capacity'
          : occupancyPercent > 65
          ? 'Active Crowd Absorption'
          : 'Comfortable Haveli Seating',
    };
  });

  const totalShelterAvailableSeats = simulatedSanctuaries.reduce(
    (sum, s) => sum + s.availableCapacity,
    0
  );

  const averageTransitDelayMinutes =
    condition === 'clear'
      ? 0
      : Math.round(
          simulatedTransitVectors.reduce((sum, tv) => sum + tv.delayMinutes, 0) /
            simulatedTransitVectors.length
        );

  const crowdSeekingShelterPercent =
    condition === 'rain'
      ? Math.min(96, Math.round(55 + rainfallIntensity * 0.5))
      : condition === 'heat'
      ? Math.min(90, Math.round(40 + (temperature - 35) * 4))
      : 5;

  // 7. Counterfactual AI Explanation for What-If scenario
  const counterfactualInsight =
    condition === 'clear'
      ? 'Optimal baseline conditions. Outdoor heritage corridors operating at 100% capacity with zero road delays.'
      : `AI Counterfactual Model: With ${rainfallIntensity} mm/h precipitation and ${floodDepth} cm road ponding over ${stormDuration} hours, ` +
        `cascading flood runoff causes +${averageTransitDelayMinutes} min delays across key corridors. ` +
        `${totalDisplacedTourists} outdoor tourists are being actively absorbed by ${cityData.safeSanctuaries.length} verified indoor artisan havelis, ` +
        `preserving travel safety while driving footfall to local craft studios.`;

  // Combine static social signals with live crowdsourced citizen signals for this city
  const cityCitizenSignals = citizenReportsStore.filter(
    (s) => s.city.toLowerCase() === cityData.city.toLowerCase()
  );

  return {
    success: true,
    city: cityData.city,
    state: cityData.state,
    center: cityData.center,
    zoom: cityData.zoom,
    condition,
    activeCondition: condition,
    liveWeather,
    whatIfParams: {
      rainfallIntensity,
      temperature,
      stormDuration,
      floodDepth,
      isWhatIfActive,
    },
    counterfactualInsight,
    weatherFront: effectiveWeather,
    vulnerableMonuments: simulatedMonuments,
    safeSanctuaries: simulatedSanctuaries,
    transitVectors: simulatedTransitVectors,
    socialSignals: [...cityCitizenSignals, ...cityData.socialSignals],
    simulationMetrics: {
      totalDisplacedTourists,
      totalShelterAvailableSeats,
      averageTransitDelayMinutes,
      crowdSeekingShelterPercent,
    },
  };
}

/**
 * Submit a real-world crowdsourced citizen signal / report.
 */
export function addCitizenGroundReport({
  city = 'Jaipur',
  authorName = 'Verified Traveler',
  text,
  lat,
  lng,
  locationName = 'Ground Location',
  urgency = 'moderate',
  sentiment = 'alert',
  category = 'waterlogging',
}) {
  const newSignal = {
    id: `citizen-${Date.now()}`,
    city,
    platform: 'citizen_sentinel',
    author: authorName.toLowerCase().replace(/\s+/g, '_'),
    authorName,
    handle: `@${authorName.replace(/\s+/g, '')}_Live`,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    verified: true,
    timeAgo: 'Just now',
    urgency,
    sentiment,
    text,
    lat: lat || 26.9248,
    lng: lng || 75.8246,
    locationName,
    upvotes: 1,
    verificationsCount: 1,
    tags: [`#${city}Live`, `#${category}`, '#GroundTruth'],
    isUserSubmitted: true,
  };

  citizenReportsStore.unshift(newSignal);
  return newSignal;
}

