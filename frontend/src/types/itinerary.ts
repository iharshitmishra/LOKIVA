export type BookingStatus = 'confirmed' | 'available' | 'pending' | 'unavailable';

export type ItineraryViewMode = 'timeline' | 'map' | 'list' | 'budget';

export type TimeOfDaySlot = 'Morning' | 'Breakfast' | 'Afternoon' | 'Evening' | 'Dinner';

export type ReplanCondition = 'rain' | 'heat' | 'fatigue' | 'crowded' | 'none';

export type FeasibilityWarningType =
  | 'OVER_BUDGET_HOURS'
  | 'TEMPLE_AFTERNOON_CLOSURE'
  | 'LANDMARK_CLOSED_DAY'
  | 'MIDDAY_HEAT_EXPOSURE'
  | 'TIGHT_TRANSIT_BUFFER'
  | 'EXCESSIVE_WALKING';

export interface FeasibilityWarning {
  id: string;
  type: FeasibilityWarningType;
  severity: 'warning' | 'critical' | 'info';
  message: string;
  activityId?: number;
  recommendation?: string;
}

export interface DayCostBreakdown {
  ticketCost: number;
  transitCost: number;
  foodCost: number;
  totalCost: number;
}

export interface DayFeasibilityMetrics {
  paceScore: number;
  paceLabel: 'Relaxed' | 'Optimal' | 'Packed' | 'Overburdened';
  totalSightseeingMinutes: number;
  totalTransitMinutes: number;
  totalTransitDistanceKm: number;
  estimatedWalkingSteps: number;
  localImpactScore: number;
  warnings: FeasibilityWarning[];
  costBreakdown: DayCostBreakdown;
}

export interface ItineraryActivity {
  id: number;
  experienceId?: number;
  timeSlot: TimeOfDaySlot;
  timeRange: string;
  startTime: string;
  endTime: string;
  title: string;
  category: string;
  location: string;
  city?: string;
  state?: string;
  description: string;
  duration: string;
  durationMins: number;
  visitDurationMinutes: number;
  transitToNextMinutes: number;
  transitMode: 'walking' | 'auto_rickshaw' | 'taxi' | 'heritage_cab' | 'private_cab';
  transitDistanceKm: number;
  indoorOutdoor: 'indoor' | 'outdoor' | 'semi-covered';
  is_indoor: boolean;
  walkingDistanceMeters: number;
  crowdLevel: 'low' | 'moderate' | 'peak';
  coordinates: [number, number]; // [lat, lng]
  includes: string[];
  costPerPerson: number;
  bookingStatus: BookingStatus;
  gettingThere: string;
  transitCost: number;
  whatToBring: string[];
  notes?: string;
  photos: string[];
  accessibility?: string;
  wheelchair_accessible?: boolean;
  lat?: number;
  lng?: number;
  customStartMinutes?: number;
  breatherBeforeMinutes?: number;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  dayOfWeek: string;
  title: string;
  heroImage: string;
  hotel: string;
  activities: ItineraryActivity[];
  dayStartTime?: string;
  activeFilter?: ReplanCondition;
  originalActivities?: ItineraryActivity[];
  mealBudgetPerPerson?: number;
  metrics?: DayFeasibilityMetrics;
}

export interface ItineraryTripDetails {
  title: string;
  destination: string;
  state: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalBudgetLimit: number;
  hotel: string;
  pace?: 'relaxed' | 'balanced' | 'packed';
}

export interface RegionalFoodGuide {
  locale: string; // e.g., "Malshej Ghat Base", "Old City Bazaars", "Fort Precinct"
  dishes: string[]; // e.g., ["Pithla-bhakri", "Kanda bhaji", "Hot chai"]
  contextNote?: string;
  notes?: string; // backwards compatibility alias
}

export type FoodRecommendation = RegionalFoodGuide;

export interface RegionalBestTimeWindow {
  idealMonths: string;
  seasonContext: string;
  crowdPacing: string;
  advisoryNote?: string;
  advisory?: string; // backwards compatibility alias
  budgetEstimates?: {
    tierLabel: string;
    rangeInr: string;
  }[];
}

export interface NearbyDetourPlace {
  name: string;
  districtOrArea: string;
  area?: string; // backwards compatibility alias
  tag: string; // e.g., "Waterfall", "Ancient Fort", "Backwater"
  distanceKm?: number;
}

export interface DynamicRegionalIntelligence {
  foodRecommendations: RegionalFoodGuide[];
  travelTips: string[];
  bestTimeToVisit: RegionalBestTimeWindow;
  nearbyPlaces: NearbyDetourPlace[];
}

// Links directly inside ItineraryPracticalInfo
export interface ItineraryPracticalInfo extends DynamicRegionalIntelligence {
  weatherSummary: string;
  temperature: string;
  packingList: string[];
  accessibilityNotes: string;
  transitNotes: string;
  languages: string[];
}
