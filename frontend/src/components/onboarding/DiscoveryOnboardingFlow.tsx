import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { EvenlySpacedSlider } from '../ui/EvenlySpacedSlider';
import {
  ArrowLeft,
  ArrowRight,
  X,
  Compass,
  Landmark,
  Utensils,
  Palette,
  Flame,
  Mountain,
  ShoppingBag,
  Music,
  Eye,
  Sparkles,
  User,
  Heart,
  Users,
  Smile,
  ShieldCheck,
  Check,
  Accessibility,
  Footprints,
  Navigation,
  MapPin,
  Search,
  Snowflake,
  CloudRain,
  Wind,
  Sun,
  Train,
  Layers,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { ALL_INDIAN_STATES_BY_ZONE, IndianStateZoneInfo } from '../../data/places';
import {
  solveEnRouteCorridor,
  reverseGeocodeToNearestNode,
  EnRouteCorridorEvaluation,
  CORRIDOR_REGISTRY,
} from '../../services/corridorGraphEngine';
import { DualCorridorComparisonModal } from '../discovery/DualCorridorComparisonModal';

export interface DiscoveryAnswers {
  origin_city?: string;
  origin_state?: string;
  destination: string;
  destination_state?: string;
  is_multi_corridor_opted?: boolean;
  corridor_evaluation?: EnRouteCorridorEvaluation;
  interests: string[];
  days: number;
  time_available_minutes: number;
  budget_daily_inr: number;
  budget_max_inr: number;
  group_type: 'solo' | 'couple' | 'family' | 'friends';
  group_size: number;
  pace: 'relaxed' | 'balanced' | 'packed';
  weather_preference: 'winter' | 'monsoon' | 'summer_hills' | 'temperate';
  accessibility: {
    low_walking: boolean;
    wheelchair: boolean;
    step_free: boolean;
  };
}

export const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
export const DAY_MARKS = [
  { value: 1, label: '1 Day' },
  { value: 3, label: '3 Days' },
  { value: 5, label: '5 Days' },
  { value: 7, label: '7 Days' },
  { value: 10, label: '10 Days' },
  { value: 14, label: '14 Days' },
  { value: 21, label: '21 Days' },
];

export const BUDGET_MARKS = [
  { value: 1000, label: '₹1k' },
  { value: 3000, label: '₹3k' },
  { value: 5000, label: '₹5k' },
  { value: 10000, label: '₹10k' },
  { value: 15000, label: '₹15k' },
  { value: 25000, label: '₹25k+' },
];

export const WEATHER_OPTIONS = [
  {
    id: 'winter' as const,
    title: 'Winter Heritage & Desert Breeze',
    label: 'Winter Heritage & Desert Breeze',
    season: 'Oct to Mar',
    temp: '14°C - 24°C',
    icon: Snowflake,
    tagline: 'Golden Havelis & Desert Nights',
    desc: 'Golden sunlit havelis, crisp dawn ghats, and open stepwells.',
    hubs: 'Rajasthan, Varanasi, Delhi, Hampi',
  },
  {
    id: 'monsoon' as const,
    title: 'Lush Monsoon & Backwaters',
    label: 'Lush Monsoon & Backwaters',
    season: 'Jun to Sep',
    temp: '22°C - 28°C',
    icon: CloudRain,
    tagline: 'Verdant Green & Rains',
    desc: 'Verdant spice trails, petrichor, tea tastings, and Ayurvedic calm.',
    hubs: 'Kerala, Western Ghats, Goa, Meghalaya',
  },
  {
    id: 'summer_hills' as const,
    title: 'High-Altitude Mountain Sanctuaries',
    label: 'High-Altitude Mountain Sanctuaries',
    season: 'Apr to Jun',
    temp: '12°C - 20°C',
    icon: Wind,
    tagline: 'High-Altitude Serenity',
    desc: 'Pine forests, glacial valleys, and cliffside monasteries.',
    hubs: 'Ladakh, Spiti, Himachal, Sikkim',
  },
  {
    id: 'temperate' as const,
    title: 'Temperate Maritime & Deccan Plateau',
    label: 'Temperate Maritime & Deccan Plateau',
    season: 'Year-Round',
    temp: '24°C - 30°C',
    icon: Sun,
    tagline: 'Pleasant Cultural Strolls',
    desc: 'Coastal art districts, evening promenades, and shaded bazaars.',
    hubs: 'Mumbai, Bengaluru, Kolkata, Chettinad',
  },
];

export const DEFAULT_DISCOVERY_ANSWERS: DiscoveryAnswers = {
  origin_city: 'Panvel / Mumbai',
  origin_state: 'Maharashtra',
  destination: 'Smart Match',
  is_multi_corridor_opted: true,
  interests: ['heritage', 'crafts', 'food'],
  days: 5,
  time_available_minutes: 2400,
  budget_daily_inr: 5000,
  budget_max_inr: 25000,
  group_type: 'couple',
  group_size: 2,
  pace: 'balanced',
  weather_preference: 'winter',
  accessibility: {
    low_walking: false,
    wheelchair: false,
    step_free: false,
  },
};

const INTEREST_OPTIONS = [
  { id: 'heritage', label: 'Living Heritage & Citadels', icon: Landmark },
  { id: 'crafts', label: 'Master Artisan Guilds', icon: Palette },
  { id: 'food', label: 'Street Gastronomy & Royal Recipes', icon: Utensils },
  { id: 'rituals', label: 'Sacred Temples & Dawn Ghats', icon: Flame },
  { id: 'monuments', label: 'Stepwells & Ancient Ruins', icon: Compass },
  { id: 'nature', label: 'Lakes, Valleys & Wildlife', icon: Mountain },
  { id: 'markets', label: 'Bazaars, Textiles & Perfumeries', icon: ShoppingBag },
  { id: 'arts', label: 'Classical Music & Folk Dance', icon: Music },
  { id: 'offbeat', label: 'Hidden Alleyways & Secret Courtyards', icon: Eye },
  { id: 'wellness', label: 'Ayurveda & Mindful Sanctuaries', icon: Sparkles },
];

const GROUP_OPTIONS = [
  {
    id: 'solo' as const,
    label: 'Solo Explorer',
    size: 1,
    icon: User,
    tagline: '1 Traveler',
    desc: 'Spontaneous wandering, contemplative temple corners, flexible cadence.',
  },
  {
    id: 'couple' as const,
    label: 'Couple Retreat',
    size: 2,
    icon: Heart,
    tagline: '2 Travelers',
    desc: 'Intimate palace courtyards, candlelit rooftop havelis, serene boat rides.',
  },
  {
    id: 'family' as const,
    label: 'Multi-Gen Family',
    size: 4,
    icon: Users,
    tagline: '3 to 5 Travelers',
    desc: 'Engaging heritage storytellers, shaded pathways, frequent comfort pauses.',
  },
  {
    id: 'friends' as const,
    label: 'Friends Tribe',
    size: 5,
    icon: Smile,
    tagline: '4 to 8 Travelers',
    desc: 'High-energy food crawls, craft studio sessions, panoramic photo spots.',
  },
];

const POPULAR_ORIGIN_HUBS = [
  { label: 'Panvel / Mumbai, MH', city: 'Mumbai', state: 'Maharashtra', lat: 18.9894, lng: 73.1175 },
  { label: 'Delhi NCR, DL', city: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { label: 'Bengaluru, KA', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { label: 'Kolkata, WB', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { label: 'Ahmedabad, GJ', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { label: 'Jaipur, RJ', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { label: 'Hyderabad, TS', city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { label: 'Chennai, TN', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { label: 'Kochi, KL', city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { label: 'Amritsar, PB', city: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { label: 'Varanasi, UP', city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
];

const ZONE_TABS = ['All', 'North', 'West', 'South', 'East & Central', 'Northeast', 'Islands'] as const;

const TOTAL_STEPS = 10;

interface DiscoveryOnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: DiscoveryAnswers) => Promise<void> | void;
  initialAnswers?: Partial<DiscoveryAnswers>;
}

export function DiscoveryOnboardingFlow({
  isOpen,
  onClose,
  onComplete,
  initialAnswers,
}: DiscoveryOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);

  // Origin State (Point A)
  const [originCity, setOriginCity] = useState<string>(
    initialAnswers?.origin_city || DEFAULT_DISCOVERY_ANSWERS.origin_city || 'Panvel / Mumbai'
  );
  const [originState, setOriginState] = useState<string>(
    initialAnswers?.origin_state || DEFAULT_DISCOVERY_ANSWERS.origin_state || 'Maharashtra'
  );
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 18.9894,
    lng: 73.1175,
  });
  const [gpsLockStatus, setGpsLockStatus] = useState<string | null>(
    '✦ ORIGIN LOCKED (POINT A): Panvel / Mumbai, Maharashtra (18.9894° N, 73.1175° E)'
  );

  // Destination State (Point C)
  const [destination, setDestination] = useState<string>(
    initialAnswers?.destination || 'Smart Match'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('All');

  // Corridor Preference (A -> C vs A -> B -> C)
  const [isMultiCorridorOpted, setIsMultiCorridorOpted] = useState<boolean>(
    initialAnswers?.is_multi_corridor_opted !== undefined ? initialAnswers.is_multi_corridor_opted : true
  );

  // General Parameters
  const [interests, setInterests] = useState<string[]>(
    initialAnswers?.interests || DEFAULT_DISCOVERY_ANSWERS.interests
  );
  const [days, setDays] = useState<number>(
    initialAnswers?.days || DEFAULT_DISCOVERY_ANSWERS.days
  );
  const [budgetDaily, setBudgetDaily] = useState<number>(
    initialAnswers?.budget_daily_inr || DEFAULT_DISCOVERY_ANSWERS.budget_daily_inr
  );
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'friends'>(
    initialAnswers?.group_type || DEFAULT_DISCOVERY_ANSWERS.group_type
  );
  const [paceVal, setPaceVal] = useState<number>(50); // 0 to 100
  const [weatherPreference, setWeatherPreference] = useState<'winter' | 'monsoon' | 'summer_hills' | 'temperate'>(
    initialAnswers?.weather_preference || DEFAULT_DISCOVERY_ANSWERS.weather_preference
  );
  const [accessibility, setAccessibility] = useState<{
    low_walking: boolean;
    wheelchair: boolean;
    step_free: boolean;
  }>(initialAnswers?.accessibility || DEFAULT_DISCOVERY_ANSWERS.accessibility);

  // Synthesis & Comparison Modal state
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisStage, setSynthesisStage] = useState<number>(1);
  const [computedCity, setComputedCity] = useState<string>('Jaipur');
  const [isDualModalOpen, setIsDualModalOpen] = useState<boolean>(false);
  const [pendingAnswers, setPendingAnswers] = useState<DiscoveryAnswers | null>(null);

  // Real-time Corridor Evaluation
  const currentCorridorEval = useMemo(() => {
    const targetState = destination === 'Smart Match' ? 'Rajasthan' : destination;
    return solveEnRouteCorridor({
      originQuery: originState,
      destinationQuery: targetState,
      totalDays: days,
      userInterests: interests,
      budgetDailyInr: budgetDaily,
      travelPace: paceVal <= 33 ? 'relaxed' : paceVal >= 67 ? 'packed' : 'balanced',
    });
  }, [originState, destination, days, interests, budgetDaily, paceVal]);

  // Filtered States based on Search & Zone
  const filteredStates = useMemo(() => {
    return ALL_INDIAN_STATES_BY_ZONE.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.highlight.toLowerCase().includes(q) ||
        item.popularHubs.some((h) => h.toLowerCase().includes(q));
      const matchesZone = selectedZone === 'All' || item.zone === selectedZone;
      return matchesSearch && matchesZone;
    });
  }, [searchQuery, selectedZone]);

  // GPS Detector
  const handleDetectGpsOrigin = () => {
    if (!navigator.geolocation) {
      setGpsLockStatus('Geolocation is not supported by your browser. Using Panvel / Mumbai.');
      return;
    }

    setIsGpsLocating(true);
    setGpsLockStatus('Acquiring high-precision GPS satellite fix...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOriginCoords({ lat, lng });

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            const state = data.address?.state || '';
            const city = data.address?.city || data.address?.town || data.address?.suburb || 'Local Hub';

            if (state) {
              setOriginState(state);
              setOriginCity(`${city}, ${state}`);
              setGpsLockStatus(`✦ ORIGIN LOCKED (POINT A): ${city}, ${state} (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
              setIsGpsLocating(false);
              return;
            }
          }
        } catch {}

        // Fallback to nearest hub node in corridor registry
        const nearest = reverseGeocodeToNearestNode(lat, lng);
        setOriginState(nearest.stateName);
        setOriginCity(nearest.primaryHubCity);
        setGpsLockStatus(`✦ ORIGIN LOCKED (POINT A): ${nearest.primaryHubCity}, ${nearest.stateName} (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
        setIsGpsLocating(false);
      },
      () => {
        // Fallback on permission denied or error
        setOriginState('Maharashtra');
        setOriginCity('Panvel / Mumbai');
        setGpsLockStatus('✦ ORIGIN LOCKED (POINT A): Panvel / Mumbai, Maharashtra (Default)');
        setIsGpsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectOriginPreset = (hub: typeof POPULAR_ORIGIN_HUBS[0]) => {
    setOriginCity(hub.city);
    setOriginState(hub.state);
    setOriginCoords({ lat: hub.lat, lng: hub.lng });
    setGpsLockStatus(`✦ ORIGIN LOCKED (POINT A): ${hub.label} (${hub.lat.toFixed(4)}° N, ${hub.lng.toFixed(4)}° E)`);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      handleStartSynthesis();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getPaceCategory = (val: number): 'relaxed' | 'balanced' | 'packed' => {
    if (val <= 33) return 'relaxed';
    if (val >= 67) return 'packed';
    return 'balanced';
  };

  const handleStartSynthesis = async () => {
    setIsSynthesizing(true);
    setSynthesisStage(1);

    const pace = getPaceCategory(paceVal);
    const groupMeta = GROUP_OPTIONS.find((g) => g.id === groupType);
    const finalCity = destination === 'Smart Match' ? 'Jaipur' : destination;
    setComputedCity(finalCity);

    const targetCorridorEval = solveEnRouteCorridor({
      originQuery: originState,
      destinationQuery: destination === 'Smart Match' ? 'Rajasthan' : destination,
      totalDays: days,
      userInterests: interests,
      budgetDailyInr: budgetDaily,
      travelPace: pace,
    });

    const answers: DiscoveryAnswers = {
      origin_city: originCity,
      origin_state: originState,
      destination: finalCity,
      destination_state: destination === 'Smart Match' ? 'Rajasthan' : destination,
      is_multi_corridor_opted: isMultiCorridorOpted,
      corridor_evaluation: targetCorridorEval,
      interests: interests.length > 0 ? interests : ['heritage', 'crafts'],
      days,
      time_available_minutes: days * 8 * 60,
      budget_daily_inr: budgetDaily,
      budget_max_inr: budgetDaily * days,
      group_type: groupType,
      group_size: groupMeta ? groupMeta.size : 2,
      pace,
      weather_preference: weatherPreference,
      accessibility,
    };

    // Store in localStorage
    try {
      localStorage.setItem('lokiva_discovery_answers', JSON.stringify(answers));
      localStorage.setItem('has_onboarded_lokiva', 'true');
    } catch {}

    await new Promise((r) => setTimeout(r, 450));
    setSynthesisStage(2);
    await new Promise((r) => setTimeout(r, 550));
    setSynthesisStage(3);

    if (isMultiCorridorOpted && targetCorridorEval.isViableMultiCorridor) {
      setPendingAnswers(answers);
      setIsSynthesizing(false);
      setIsDualModalOpen(true);
      return;
    }

    try {
      await onComplete(answers);
    } catch (err) {
      console.warn('Discovery completion handled:', err);
    } finally {
      setCurrentStep(1);
      setIsSynthesizing(false);
    }
  };

  const handleLaunchDirect = async () => {
    if (!pendingAnswers) return;
    const directAnswers: DiscoveryAnswers = {
      ...pendingAnswers,
      is_multi_corridor_opted: false,
    };
    setIsDualModalOpen(false);
    await onComplete(directAnswers);
  };

  const handleLaunchCorridor = async (selectedEvaluation?: EnRouteCorridorEvaluation) => {
    if (!pendingAnswers) return;
    const finalEval = selectedEvaluation || pendingAnswers.corridor_evaluation;
    const corridorAnswers: DiscoveryAnswers = {
      ...pendingAnswers,
      is_multi_corridor_opted: true,
      corridor_evaluation: finalEval,
    };
    setIsDualModalOpen(false);
    await onComplete(corridorAnswers);
  };

  const formattedBudgetDaily = `₹${budgetDaily.toLocaleString('en-IN')}`;
  const formattedTotalBudget = `₹${(budgetDaily * days).toLocaleString('en-IN')}`;

  const slideVariants: Variants = {
    enter: (d: number) => ({
      x: d > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
    },
    exit: (d: number) => ({
      x: d < 0 ? 30 : -30,
      opacity: 0,
      transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] },
    }),
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#3B2316]/70 backdrop-blur-md overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-2xl bg-[#FAF7F2] border border-[#DFCBB2] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
          style={{ maxHeight: 'min(92vh, 740px)' }}
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          {/* Subtle Warm Amber Glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-[#D47A39]/15 rounded-full blur-3xl -z-10" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 bg-[#B84A27]/10 rounded-full blur-3xl -z-10" />

          {/* Top Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#DFCBB2] bg-[#FFFDF9]/85 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              {currentStep > 1 && !isSynthesizing ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#7A523B] hover:text-[#3B2316] px-2.5 py-1.5 rounded-xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#DFCBB2] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#B84A27]" />
                  <span>Back</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#B84A27]" />
                  <span className="text-xs font-heading font-extrabold text-[#3B2316] tracking-wide">
                    LOKIVA DISCOVERY
                  </span>
                </div>
              )}
            </div>

            {/* Progress Track */}
            {!isSynthesizing && (
              <div className="flex items-center gap-3">
                <div className="w-28 sm:w-40 h-2 bg-[#E6DAC6] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#B84A27] to-[#D47A39] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[#7A523B] font-extrabold tracking-wider">
                  {currentStep} of {TOTAL_STEPS}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#7A523B] hover:text-[#3B2316] rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Central Question Stage */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 min-h-[400px] flex flex-col justify-between">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 1: DEPARTURE ORIGIN DETECTION (POINT A)                */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 1 && !isSynthesizing && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 01 · Departure Origin (Point A)
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      Where are you departing from?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Lokiva locks your origin state (Point A) to calculate the shortest mathematical corridor vector across India.
                    </p>
                  </div>

                  {/* Live GPS Beacon Card */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-5 rounded-3xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF3E8] to-[#F3E7D6] border-2 border-[#DFCBB2] shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#B84A27] to-[#D47A39] text-[#FFFDF9] flex items-center justify-center shadow-xs">
                          <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#3B2316]">
                            Live GPS Satellite Fix
                          </h3>
                          <p className="text-xs text-[#7A523B] font-sans">
                            Auto-sync your departure latitude, longitude & origin hub.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDetectGpsOrigin}
                        disabled={isGpsLocating}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] font-heading font-extrabold text-xs tracking-wide shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-70"
                      >
                        {isGpsLocating ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>Locking...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Detect via GPS</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Animated Origin Lock Status Badge */}
                    <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#B84A27] shrink-0" />
                      <span className="text-xs font-mono font-extrabold text-[#3B2316] truncate">
                        {gpsLockStatus}
                      </span>
                    </div>
                  </motion.div>

                  {/* Manual Origin Switcher Horizontal Ribbon */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#8C6751]">
                      Or 1-Tap Select Your Starting Hub:
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                      {POPULAR_ORIGIN_HUBS.map((hub) => {
                        const isSelected = originState.toLowerCase() === hub.state.toLowerCase();
                        return (
                          <button
                            key={hub.label}
                            type="button"
                            onClick={() => handleSelectOriginPreset(hub)}
                            className={`px-3 py-1.5 rounded-full text-xs font-heading transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-[#3B2316] text-[#FFFDF9] border-[#3B2316] font-extrabold shadow-xs'
                                : 'bg-[#FFFDF9] border-[#DFCBB2] text-[#5C3D2E] font-semibold hover:border-[#B84A27] hover:bg-[#F5EBE0]'
                            }`}
                          >
                            <span>{hub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 border-t border-[#DFCBB2] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#7A523B]">
                      Departing from: <strong className="text-[#B84A27] font-bold">{originState} ({originCity})</strong>
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 2: DESTINATION HORIZON (POINT C)                      */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 2 && !isSynthesizing && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 02 · Territorial Horizon (Point C)
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      Where is your curiosity pulling you?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Let our spatiotemporal concierge handpick a hidden frontier, or drop a pin directly onto your dream state.
                    </p>
                  </div>

                  {/* Featured AI Smart Match Card with Compass Emblem */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setDestination('Smart Match')}
                    className={`p-3.5 sm:p-4 rounded-3xl border-2 transition-all duration-200 cursor-pointer relative overflow-hidden flex items-center justify-between ${
                      destination === 'Smart Match'
                        ? 'bg-[#FFF9F2] border-[#B84A27] shadow-md ring-2 ring-[#B84A27]/20'
                        : 'bg-[#FFFDF9] hover:bg-[#FAF8F5] border-[#DFCBB2] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#B84A27] to-[#D47A39] text-[#FFFDF9] flex items-center justify-center shadow-xs shrink-0">
                        <Compass className="w-5 h-5 text-[#FFFDF9]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-extrabold text-sm sm:text-base text-[#3B2316]">
                            Smart Match for My Vibe
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-[#FFFDF9] border border-[#DFCBB2] text-[#B84A27] px-2 py-0.5 rounded-full font-bold">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-[#5C3D2E] mt-0.5 font-sans">
                          Let Lokiva synthesize your affinities, season, and budget into the ideal route.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        destination === 'Smart Match'
                          ? 'bg-[#B84A27] border-[#B84A27] text-white'
                          : 'border-[#DFCBB2]'
                      }`}
                    >
                      {destination === 'Smart Match' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </motion.div>

                  {/* Search & Zone Filter Bar */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#A67B5B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search across all 36 States & UTs (e.g. Rajasthan, Kerala, Ladakh, Assam)..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] text-xs font-sans text-[#3B2316] placeholder-[#A67B5B] focus:outline-none focus:border-[#B84A27] shadow-2xs font-semibold"
                      />
                    </div>

                    {/* Region Cluster Tabs with Spiced Terracotta Active Pill */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {ZONE_TABS.map((zone) => {
                        const isSelected = selectedZone === zone;
                        return (
                          <button
                            key={zone}
                            type="button"
                            onClick={() => setSelectedZone(zone)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] border-[#B84A27] shadow-sm'
                                : 'bg-[#FFFDF9] border-[#DFCBB2] text-[#5C3D2E] hover:bg-[#F5EBE0]'
                            }`}
                          >
                            {zone}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 36 States Grid Container with Untruncated Text & Scaled Font */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[190px] overflow-y-auto pr-1">
                    {filteredStates.map((state) => {
                      const isSelected = destination === state.name;
                      return (
                        <motion.button
                          key={state.name}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setDestination(state.name)}
                          className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#FFF9F2] border-[#B84A27] ring-1 ring-[#B84A27] shadow-xs'
                              : 'bg-[#FFFDF9] hover:bg-[#FAF8F5] border-[#DFCBB2]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-heading font-extrabold text-base sm:text-lg text-[#3B2316]">
                              {state.name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-[#B84A27] shrink-0 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-snug">
                            {state.highlight}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 border-t border-[#DFCBB2] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#7A523B]">
                      Target: <strong className="text-[#B84A27] font-bold">{destination}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 3: EN-ROUTE MULTI-STOP TRIP (A -> B -> C)              */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 3 && !isSynthesizing && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-mono uppercase tracking-wider font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-3 py-1 rounded-full inline-block mb-1">
                      Chapter 03 · Route Choices
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      Since you're travelling from {originState} to {destination === 'Smart Match' ? 'Rajasthan' : destination}, want to explore connected stops?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      We can recommend both a direct trip and an easy route with top stops along the way.
                    </p>
                  </div>

                  {/* Live Animated Route Preview Banner */}
                  <div className="p-4 rounded-3xl bg-[#FFFDF9] border-2 border-[#DFCBB2] shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-heading font-bold text-[#7A523B]">
                      <span>Connected Route Preview</span>
                      <span className="text-[#B84A27] font-extrabold">+{currentCorridorEval.detourPercentage}% Extra Travel</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF4E8] border border-[#E2D2BC] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-heading font-extrabold text-[#3B2316]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#B84A27]" />
                        {currentCorridorEval.originNode.stateName} (Start)
                      </span>
                      <span className="text-[#A67B5B] font-bold text-sm">→</span>
                      <span className="flex items-center gap-1.5 text-[#D47A39] px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#D47A39]/40 shadow-2xs">
                        <Landmark className="w-4 h-4 text-[#D47A39]" />
                        {currentCorridorEval.intermediateNode.stateName} (Stop · +{currentCorridorEval.detourOverheadKm} km)
                      </span>
                      <span className="text-[#A67B5B] font-bold text-sm">→</span>
                      <span className="flex items-center gap-1.5 text-[#B84A27]">
                        <Compass className="w-4 h-4 text-[#B84A27]" />
                        {currentCorridorEval.destinationNode.stateName} (Destination)
                      </span>
                    </div>
                  </div>

                  {/* Two Large Sculpted Choice Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setIsMultiCorridorOpted(true)}
                      className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isMultiCorridorOpted
                          ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FAF3E8] border-[#B84A27] shadow-md ring-2 ring-[#B84A27]/20'
                          : 'bg-[#FFFDF9] border-[#DFCBB2] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-heading font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF2E6] text-[#B84A27] border border-[#D47A39]/40">
                            Recommended
                          </span>
                          {isMultiCorridorOpted && <Check className="w-4 h-4 text-[#B84A27] stroke-[3]" />}
                        </div>
                        <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#3B2316]">
                          ✦ Yes, Show Both: Direct + Multi-Stop Trip
                        </h3>
                        <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                          Recommends a direct stay AND a connected route stopping in {currentCorridorEval.intermediateNode.stateName} ({currentCorridorEval.chainedDistanceKm} km total).
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setIsMultiCorridorOpted(false)}
                      className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        !isMultiCorridorOpted
                          ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FAF3E8] border-[#B84A27] shadow-md ring-2 ring-[#B84A27]/20'
                          : 'bg-[#FFFDF9] border-[#DFCBB2] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-heading font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#F5EBE0] text-[#7A523B]">
                            Single Focus
                          </span>
                          {!isMultiCorridorOpted && <Check className="w-4 h-4 text-[#B84A27] stroke-[3]" />}
                        </div>
                        <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#3B2316]">
                          → No, Keep Single-Destination Focus
                        </h3>
                        <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                          Dedicate 100% of your days and budget strictly inside {destination === 'Smart Match' ? 'Rajasthan' : destination} without intermediate stops.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 border-t border-[#DFCBB2] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#7A523B]">
                      Selected: <strong className="text-[#B84A27] font-bold">{isMultiCorridorOpted ? 'Multi-Stop Routes Included' : 'Direct Trip Only'}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 4: CULTURAL AFFINITIES (INTERESTS)                     */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 4 && !isSynthesizing && (
                <motion.div
                  key="step-4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-5 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 04 · Cultural Passions
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      What gets your pulse racing?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Select the cultural textures, living crafts, and sacred traditions you wish to immerse within.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center sm:justify-start py-2">
                    {INTEREST_OPTIONS.map((item) => {
                      const isSelected = interests.includes(item.id);
                      const Icon = item.icon;

                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.id)}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-heading font-extrabold transition-all duration-200 cursor-pointer border ${
                            isSelected
                              ? 'bg-[#3B2316] text-[#FFFDF9] border-[#3B2316] shadow-sm'
                              : 'bg-[#FFFDF9] hover:bg-[#FAF8F5] text-[#5C3D2E] border-[#DFCBB2]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#D47A39]' : 'text-[#A67B5B]'}`} />
                          <span>{item.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#D47A39] stroke-[3] ml-1" />}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-[#DFCBB2] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#7A523B]">
                      {interests.length} {interests.length === 1 ? 'affinity' : 'affinities'} selected
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 5: DURATION                                            */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 5 && !isSynthesizing && (
                <motion.div
                  key="step-5"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 05 · Time Horizon
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      How many sunrises are you investing?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      From spontaneous 1-day micro explorations to unhurried 21-day cultural odysseys.
                    </p>
                  </div>

                  <div className="py-2 text-center space-y-1">
                    <div className="inline-flex items-baseline justify-center gap-2">
                      <span className="text-5xl sm:text-7xl font-display font-black text-[#3B2316] tracking-tight">
                        {days}
                      </span>
                      <span className="text-xl sm:text-2xl font-heading font-black text-[#B84A27]">
                        {days === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-[#7A523B]">
                      ≈ {days * 8} hours of curated exploration across verified sites
                    </p>
                  </div>

                  <EvenlySpacedSlider
                    milestones={DAY_MARKS}
                    value={days}
                    onChange={setDays}
                    granularity={1}
                    ariaLabel="Trip duration in days"
                  />

                  <div className="pt-4 border-t border-[#DFCBB2] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 6: FINANCIAL COMFORT (BUDGET)                          */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 6 && !isSynthesizing && (
                <motion.div
                  key="step-6"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 06 · Financial Comfort
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      What is your daily sanctuary comfort?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Calibrates dining tiers, heritage stays, host guides, and authentic artisan studio passes.
                    </p>
                  </div>

                  <div className="py-2 text-center space-y-1">
                    <div className="text-4xl sm:text-6xl font-display font-black text-[#3B2316] tracking-tight">
                      {formattedBudgetDaily}
                      <span className="text-base sm:text-lg font-heading font-bold text-[#7A523B] ml-2">
                        / day
                      </span>
                    </div>

                    <p className="text-xs font-mono text-[#B84A27] font-semibold">
                      Estimated total for {days} {days === 1 ? 'day' : 'days'}: {formattedTotalBudget}
                    </p>
                  </div>

                  <EvenlySpacedSlider
                    milestones={BUDGET_MARKS}
                    value={budgetDaily}
                    onChange={setBudgetDaily}
                    granularity={500}
                    ariaLabel="Daily budget in INR"
                  />

                  <div className="pt-4 border-t border-[#DFCBB2] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 7: TRAVEL COMPANIONS                                   */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 7 && !isSynthesizing && (
                <motion.div
                  key="step-7"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 07 · Travel Companions
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      Who are you making memories with?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Calibrates cadence, vehicle sizing, seating arrangements, and comfort pauses.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-2">
                    {GROUP_OPTIONS.map((card) => {
                      const isSelected = groupType === card.id;
                      const Icon = card.icon;

                      return (
                        <motion.button
                          key={card.id}
                          type="button"
                          onClick={() => setGroupType(card.id)}
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-3xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border-2 ${
                            isSelected
                              ? 'bg-[#FFFDF9] border-[#B84A27] ring-2 ring-[#B84A27]/20 shadow-md'
                              : 'bg-[#FFFDF9] hover:bg-[#FAF8F5] border-[#DFCBB2] shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className={`p-2.5 rounded-2xl ${isSelected ? 'bg-[#FAF2E6] text-[#B84A27]' : 'bg-[#FAF7F2] text-[#3B2316]'}`}>
                              <Icon className="w-5 h-5" />
                            </div>

                            <span className="text-[10px] font-mono font-extrabold text-[#7A523B] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#DFCBB2]">
                              {card.tagline}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-heading font-extrabold text-base text-[#3B2316]">
                              {card.label}
                            </h3>
                            <p className="text-xs text-[#5C3D2E] font-sans leading-relaxed">
                              {card.desc}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-[#DFCBB2] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 8: JOURNEY RHYTHM (PACE)                               */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 8 && !isSynthesizing && (
                <motion.div
                  key="step-8"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 08 · Journey Rhythm
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      What is your cadence: slow haveli teas or dawn-to-dusk trails?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Find your equilibrium between slow contemplation and high-density discovery.
                    </p>
                  </div>

                  <div className="p-5 bg-[#FFFDF9] border border-[#DFCBB2] rounded-3xl space-y-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-heading font-extrabold">
                      <span className={`${paceVal <= 33 ? 'text-[#B84A27]' : 'text-[#7A523B]'}`}>
                        Slow & Relaxed
                      </span>
                      <span className={`${paceVal > 33 && paceVal < 67 ? 'text-[#B84A27]' : 'text-[#7A523B]'}`}>
                        Balanced Cultural Cadence
                      </span>
                      <span className={`${paceVal >= 67 ? 'text-[#B84A27]' : 'text-[#7A523B]'}`}>
                        Packed Frontier Discovery
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={paceVal}
                      onChange={(e) => setPaceVal(parseInt(e.target.value, 10))}
                      className="w-full accent-[#B84A27] cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#DFCBB2] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 9: CLIMATE SEASON                                      */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 9 && !isSynthesizing && (
                <motion.div
                  key="step-9"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 09 · Climate Season
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      Which environmental atmosphere speaks to you?
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WEATHER_OPTIONS.map((opt) => {
                      const isSelected = weatherPreference === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setWeatherPreference(opt.id)}
                          className={`p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFFDF9] border-[#B84A27] shadow-sm'
                              : 'bg-[#FFFDF9] border-[#DFCBB2] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#B84A27]' : 'text-[#7A523B]'}`} />
                            <span className="font-heading font-extrabold text-sm text-[#3B2316]">
                              {opt.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#5C3D2E] font-sans leading-snug">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-[#DFCBB2] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 10: SPECIAL NEEDS & ACCESSIBILITY                       */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {currentStep === 10 && !isSynthesizing && (
                <motion.div
                  key="step-10"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#B84A27] bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Chapter 10 · Special Needs & Comfort
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-snug">
                      Any mobility or step-free preferences?
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <label className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accessibility.low_walking}
                        onChange={(e) => setAccessibility({ ...accessibility, low_walking: e.target.checked })}
                        className="w-4 h-4 accent-[#B84A27]"
                      />
                      <span className="font-heading font-extrabold text-sm text-[#3B2316]">
                        Low Walking Distance (&lt; 400m per stop)
                      </span>
                    </label>

                    <label className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accessibility.wheelchair}
                        onChange={(e) => setAccessibility({ ...accessibility, wheelchair: e.target.checked })}
                        className="w-4 h-4 accent-[#B84A27]"
                      />
                      <span className="font-heading font-extrabold text-sm text-[#3B2316]">
                        Wheelchair Accessible / Ground Floor Ramps Needed
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-[#DFCBB2] flex items-center justify-between">
                    <span className="text-xs font-mono text-[#7A523B]">
                      Ready to synthesize
                    </span>

                    <button
                      type="button"
                      onClick={handleStartSynthesis}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] text-xs sm:text-sm font-heading font-extrabold shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Synthesize My Itinerary</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* SYNTHESIS LOADING STAGE                                     */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {isSynthesizing && (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#B84A27] to-[#D47A39] text-[#FFFDF9] flex items-center justify-center shadow-lg animate-bounce">
                    <Compass className="w-8 h-8 animate-spin" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-display font-black text-[#3B2316]">
                      {synthesisStage === 1
                        ? 'Planning the best route options...'
                        : synthesisStage === 2
                        ? `Finding connected stops between ${originState} & ${destination}...`
                        : `Preparing your customized plans for ${computedCity}...`}
                    </h3>
                    <p className="text-xs sm:text-sm font-sans text-[#7A523B]">
                      Finding verified local experiences and smooth travel routes
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* 3-Blueprint Multi-Corridor Recommendation Studio Modal */}
      {isDualModalOpen && pendingAnswers?.corridor_evaluation && (
        <DualCorridorComparisonModal
          isOpen={isDualModalOpen}
          onClose={() => setIsDualModalOpen(false)}
          corridorEval={pendingAnswers.corridor_evaluation}
          totalDays={days}
          budgetTotalInr={budgetDaily * days}
          userInterests={interests}
          travelPace={getPaceCategory(paceVal)}
          originQuery={originState}
          destinationQuery={destination === 'Smart Match' ? 'Rajasthan' : destination}
          onSelectDirect={handleLaunchDirect}
          onSelectCorridor={handleLaunchCorridor}
        />
      )}
    </>,
    document.body
  );
}

export default DiscoveryOnboardingFlow;
