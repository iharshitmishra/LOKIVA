/**
 * Types for LOKIVA Geospatial Digital Twin & Real-World Social Signal Engine
 */

export type WeatherConditionType = 'rain' | 'heat' | 'clear';

export interface WeatherFront {
  condition: string;
  precipitation_mm_hr?: number;
  reflectivity_dbz?: number;
  wind_kmh?: number;
  temp_c: number;
  uv_index?: number;
  feels_like_c?: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  cloudBounds: [ [number, number], [number, number] ] | null;
  cloudCenter: [number, number] | null;
  radius_km: number;
}

export interface VulnerableMonument {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  type: 'outdoor_monument';
  hazardType: string;
  heatHazard?: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  displacedHeadcount: number;
  status: string;
  evacuationUrgency: 'Low' | 'Moderate' | 'High' | 'Immediate';
  recommendedShelterId?: string;
  recommendedShelterName?: string;
  description: string;
}

export interface SafeSanctuary {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  type: 'indoor_sanctuary';
  absorptionCapacityTotal: number;
  absorbedCurrent: number;
  availableCapacity: number;
  shelterFacilities: string[];
  distanceFromHazardKm: number;
  priceInr: number;
  status: string;
  is_rain_safe: boolean;
}

export interface TransitVector {
  id: string;
  name: string;
  from: string;
  to: string;
  coordinates: [number, number][];
  congestionLevel: 'clear' | 'moderate' | 'severe';
  delayMinutes: number;
  normalDurationMins: number;
  currentDurationMins: number;
  waterloggingDepthCm?: number;
  waterDepthCm?: number;
  propagationFactor?: number;
  status: string;
  color: string;
}

export interface SocialSignal {
  id: string;
  platform: 'x' | 'reddit' | 'instagram' | 'citizen_sentinel';
  author: string;
  authorName: string;
  handle: string;
  avatar: string;
  verified: boolean;
  timeAgo: string;
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  sentiment: 'alert' | 'sanctuary_tip' | 'delight' | 'closure_notice';
  text: string;
  lat: number;
  lng: number;
  locationName: string;
  upvotes: number;
  verificationsCount: number;
  tags: string[];
  userReported?: boolean;
}

export interface SimulationMetrics {
  totalDisplacedTourists: number;
  totalShelterAvailableSeats: number;
  averageTransitDelayMinutes: number;
  crowdSeekingShelterPercent: number;
}

export interface LiveWeatherObservation {
  source: string;
  city: string;
  lat: number;
  lng: number;
  timestamp: string;
  temperature_c: number;
  relative_humidity_percent: number;
  precipitation_mm: number;
  rain_mm: number;
  weather_code: number;
  weather_description: string;
  wind_speed_kmh: number;
  is_live_connected: boolean;
}

export interface WhatIfScenarioParams {
  rainfallIntensity: number;
  temperature: number;
  stormDuration: number;
  floodDepth: number;
  isWhatIfActive?: boolean;
}

export interface DigitalTwinSimulationData {
  city: string;
  state: string;
  center: [number, number];
  zoom: number;
  activeCondition: WeatherConditionType;
  weatherFront: WeatherFront;
  liveWeather?: LiveWeatherObservation;
  whatIfParams?: WhatIfScenarioParams;
  counterfactualInsight?: string;
  vulnerableMonuments: VulnerableMonument[];
  safeSanctuaries: SafeSanctuary[];
  transitVectors: TransitVector[];
  socialSignals: SocialSignal[];
  simulationMetrics: SimulationMetrics;
}

export interface CitizenGroundReportPayload {
  city: string;
  authorName: string;
  handle?: string;
  platform: 'citizen_sentinel' | 'x' | 'reddit' | 'instagram';
  text: string;
  locationName: string;
  lat: number;
  lng: number;
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  sentiment: 'alert' | 'sanctuary_tip' | 'delight' | 'closure_notice';
  tags?: string[];
}

