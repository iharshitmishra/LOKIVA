import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  Navigation,
  Compass,
  Landmark,
  UtensilsCrossed,
  ShoppingBag,
  Trees,
  Ticket,
  Share2,
  ExternalLink,
  ShieldCheck,
  Footprints,
  Car,
  RotateCcw,
  CheckCircle2,
  Zap,
  Star,
  Building2,
  Train,
} from 'lucide-react';
import {
  QuickEscapeQuery,
  QuickEscapePlan,
  QuickEscapeInterest,
  AvailableHours,
  StartPointType,
} from '../../types/quickEscape';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  generateQuickEscapePlan,
  POPULAR_CITIES_QUICK,
  DEFAULT_QUICK_ESCAPE_PLAN,
  getStartPointConfig,
} from '../../data/quickEscapeData';
import { getUserLiveLocation } from '../../lib/gpsLocation';
import { resolveImageUrl } from '../../lib/api';
import { SquiggleUnderline } from '../ui/HandDrawnAnnotations';

const AVAILABLE_TIMES: AvailableHours[] = [1, 2, 3, 5];

const INTEREST_OPTIONS: { id: QuickEscapeInterest; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Culture', label: 'Culture', icon: Landmark },
  { id: 'Food', label: 'Food & Chai', icon: UtensilsCrossed },
  { id: 'Heritage', label: 'Living Heritage', icon: Compass },
  { id: 'Shopping', label: 'Artisan Shopping', icon: ShoppingBag },
  { id: 'Nature', label: 'Nature & Baoris', icon: Trees },
  { id: 'Entertainment', label: 'Entertainment', icon: Ticket },
];

const HOUR_LABELS: Record<number, string> = { 1: '1 Hour', 2: '2 Hours', 3: '3 Hours', 5: '5 Hours' };

// Warm Earthen Luxury palette constants
const PALETTE = {
  espresso: '#3B2316',
  terracotta: '#B84A27',
  saffron: '#D47A39',
  sandstone: '#A67B5B',
  travertine: '#F3ECE1',
  linen: '#FAF6F0',
  ivory: '#FFFDF9',
  warmBorder: '#DFCBB2',
  warmBorderLight: '#E6DAC6',
  warmBorderDark: '#E2D2BC',
  midBrown: '#5C3D2E',
  fieldBrown: '#7A523B',
  labelBrown: '#8C6751',
  saffronDeep: '#9E5414',
};

// Transit mode icons
const TransitIcon = ({ mode }: { mode: string }) => {
  if (mode === 'walk') return <Footprints className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />;
  if (mode === 'metro') return <Train className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />;
  return <Car className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />;
};

// Card animation variants for staggered cascade
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

export function QuickEscapeSection() {
  // Form State - Defaulting to Jaipur
  const [location, setLocation] = useState<string>('Jaipur, Rajasthan');
  const [availableHours, setAvailableHours] = useState<AvailableHours>(3);
  const [interests, setInterests] = useState<QuickEscapeInterest[]>(['Heritage', 'Food', 'Shopping']);
  const [startPointType, setStartPointType] = useState<StartPointType>('current');
  const [customStartPoint, setCustomStartPoint] = useState<string>('Jaipur International Airport (JAI)');

  // GPS Detection State
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Result state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<QuickEscapePlan | null>(DEFAULT_QUICK_ESCAPE_PLAN);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [planKey, setPlanKey] = useState(0); // For re-triggering animations

  const itineraryRef = useRef<HTMLDivElement>(null);
  const timeBarRef = useRef<HTMLDivElement>(null);

  // Dynamic start point config for currently selected city
  const currentStartConfig = getStartPointConfig(location);

  // Sync GSAP ScrollTrigger whenever generatedPlan changes
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [generatedPlan]);

  // Animate time allocation bar segments
  useEffect(() => {
    if (!timeBarRef.current || !generatedPlan) return;
    const segments = timeBarRef.current.querySelectorAll<HTMLElement>('[data-time-segment]');
    segments.forEach((seg) => {
      const targetWidth = seg.getAttribute('data-target-width') || '0%';
      gsap.fromTo(
        seg,
        { width: '0%' },
        { width: targetWidth, duration: 0.8, ease: 'power2.out', delay: 0.2 }
      );
    });
  }, [generatedPlan, planKey]);

  const handleToggleInterest = (interest: QuickEscapeInterest) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        if (prev.length === 1) return prev;
        return prev.filter((i) => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const runPlanGeneration = async (
    targetLocation: string,
    targetStartType: StartPointType,
    targetCustomStart: string,
    targetHours: AvailableHours,
    targetInterests: QuickEscapeInterest[],
    targetCoords?: { latitude: number; longitude: number },
    targetIsLiveGps: boolean = false
  ) => {
    setIsLoading(true);
    try {
      const plan = await generateQuickEscapePlan({
        location: targetLocation.trim() || 'Jaipur, Rajasthan',
        availableHours: targetHours,
        interests: targetInterests,
        startPointType: targetStartType,
        customStartPoint: targetCustomStart,
        coords: targetCoords,
        isLiveGps: targetIsLiveGps,
      });
      setGeneratedPlan(plan);
      setPlanKey((k) => k + 1);
    } catch (err) {
      console.error('Quick escape generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const qLocation = searchParams.get('quickEscapeLocation');
    const qState = searchParams.get('quickEscapeState');
    const qHours = searchParams.get('quickEscapeHours');

    if (!qLocation && !qState && !qHours) return;

    let targetLocation = location;
    let targetHours = availableHours;
    let shouldRegenerate = false;

    if (qLocation) {
      targetLocation = qLocation;
      setLocation(qLocation);
      shouldRegenerate = true;
    } else if (qState) {
      const stateMap: Record<string, string> = {
        rajasthan: 'Jaipur, Rajasthan',
        kerala: 'Kochi, Kerala',
        maharashtra: 'Mumbai, Maharashtra',
        ladakh: 'Leh, Ladakh',
      };
      const foundCity = stateMap[qState.toLowerCase()] || `${qState}, India`;
      targetLocation = foundCity;
      setLocation(foundCity);
      shouldRegenerate = true;
    }

    if (qHours) {
      const parsedHours = parseInt(qHours, 10);
      if ([1, 2, 3, 5].includes(parsedHours)) {
        targetHours = parsedHours as AvailableHours;
        setAvailableHours(targetHours);
        shouldRegenerate = true;
      }
    }

    if (shouldRegenerate) {
      runPlanGeneration(targetLocation, startPointType, customStartPoint, targetHours, interests);
      setTimeout(() => {
        const el = document.getElementById('quick-escape');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 400);
    }
  }, [searchParams]);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setGpsErrorMsg(null);
    try {
      const liveRes = await getUserLiveLocation();
      const detectedLocation = liveRes.fullLocationString;
      const coords = { latitude: liveRes.latitude, longitude: liveRes.longitude };

      setLocation(detectedLocation);
      setIsLiveGpsActive(true);
      setLiveCoords(coords);

      const localLabel = liveRes.locality ? `${liveRes.locality}` : 'Live Current Location';
      setCustomStartPoint(localLabel);

      await runPlanGeneration(
        detectedLocation,
        startPointType,
        localLabel,
        availableHours,
        interests,
        coords,
        true
      );

      setTimeout(() => {
        if (window.innerWidth < 1024 && itineraryRef.current) {
          itineraryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Failed to acquire live GPS location:', err);
      setGpsErrorMsg('Could not detect GPS location. Please check browser permissions.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleCitySelect = async (selectedCity: string) => {
    setLocation(selectedCity);
    setIsLiveGpsActive(false);
    setGpsErrorMsg(null);

    const cfg = getStartPointConfig(selectedCity);
    const primaryPreset = cfg.customPresets[0] || `${selectedCity.split(',')[0]} Airport`;
    setCustomStartPoint(primaryPreset);

    const effectiveCustom = startPointType === 'custom' ? primaryPreset : cfg.current;
    await runPlanGeneration(
      selectedCity,
      startPointType,
      effectiveCustom,
      availableHours,
      interests,
      undefined,
      false
    );
  };

  const handleSelectStartType = async (type: StartPointType) => {
    setStartPointType(type);
    let targetCustom = customStartPoint;
    if (type === 'custom' && (!customStartPoint || customStartPoint.includes('Current Location'))) {
      targetCustom = currentStartConfig.customPresets[0] || 'Airport / City Center';
      setCustomStartPoint(targetCustom);
    }

    await runPlanGeneration(
      location,
      type,
      targetCustom,
      availableHours,
      interests,
      liveCoords,
      isLiveGpsActive
    );
  };

  const handleSelectPreset = async (preset: string) => {
    setCustomStartPoint(preset);
    if (startPointType !== 'custom') {
      setStartPointType('custom');
    }
    await runPlanGeneration(
      location,
      'custom',
      preset,
      availableHours,
      interests,
      liveCoords,
      isLiveGpsActive
    );
  };

  const handleTimeChange = async (hours: AvailableHours) => {
    setAvailableHours(hours);
    await runPlanGeneration(
      location,
      startPointType,
      customStartPoint,
      hours,
      interests,
      liveCoords,
      isLiveGpsActive
    );
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runPlanGeneration(
      location,
      startPointType,
      customStartPoint,
      availableHours,
      interests,
      liveCoords,
      isLiveGpsActive
    );
    setTimeout(() => {
      if (window.innerWidth < 1024 && itineraryRef.current) {
        itineraryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCopyShare = () => {
    const text = `Check out this ${generatedPlan?.title} on LOKIVA! Feasible route in ${availableHours} hours starting from ${generatedPlan?.startPoint}.`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Compute time allocation segments
  const totalMinutes = generatedPlan ? generatedPlan.totalDurationMins : 180;
  const transitMinutes = generatedPlan ? generatedPlan.estimatedTravelTimeMins : 30;
  const bufferMinutes = Math.round(totalMinutes * 0.08);
  const immersionMinutes = totalMinutes - transitMinutes - bufferMinutes;
  const immersionPct = Math.round((immersionMinutes / totalMinutes) * 100);
  const transitPct = Math.round((transitMinutes / totalMinutes) * 100);
  const bufferPct = 100 - immersionPct - transitPct;

  const cityNameOnly = location.split(',')[0].trim();

  return (
    <section
      id="quick-escape"
      className="relative z-20 w-full bg-[#FAF6F0] py-16 sm:py-24 border-t border-[#E2D2BC] overflow-hidden"
    >
      {/* Decorative ambient background blurs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-[#D47A39]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-[#B84A27]/8 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ─── SECTION HEADER ───────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF2E6] border border-[#D47A39]/40 text-[#B84A27] font-mono text-xs sm:text-sm font-extrabold tracking-wide shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-[#D47A39] fill-[#D47A39]" />
              <span>Quick Escape</span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#3B2316] tracking-tight leading-[1.12]">
            <span>Got a few hours </span>
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39]">
                to spare?
              </span>
              <SquiggleUnderline className="absolute -bottom-2 left-0 w-full h-3 sm:h-4 text-[#D47A39]" />
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#5C3D2E] font-sans font-medium leading-relaxed max-w-2xl mx-auto">
            Make the most of your time with personalized experiences near you, planned around your exact time constraint.
          </p>

          <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-[#FFFDF9]/90 border border-[#E2D2BC] shadow-xs max-w-xl mx-auto text-left sm:text-center mt-2">
            <Sparkles className="w-4 h-4 text-[#D47A39] shrink-0" />
            <p className="text-xs sm:text-[13px] text-[#3B2316] font-sans font-semibold leading-normal">
              <strong className="text-[#B84A27] font-extrabold">LOKIVA key value:</strong> We don&apos;t just find nearby places, we plan what you can <span className="underline decoration-[#D47A39] decoration-2">realistically experience</span> within the time you have.
            </p>
          </div>
        </div>

        {/* ─── INTERACTIVE WORKSPACE GRID ───────────────────────────────── */}
        <LayoutGroup>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ═══════════ LEFT: SCULPTED CONSTRAINT CONSOLE (5 COLS) ═══════════ */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24 rounded-[36px] bg-gradient-to-b from-[#FFFDF9] via-[#FAF4E8] to-[#F3E8D8] border border-[#DFCBB2] p-7 sm:p-8 shadow-[0_24px_60px_-18px_rgba(59,35,22,0.14)] space-y-8">
                {/* Editorial Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B84A27] animate-pulse" />
                    <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#B84A27] uppercase">
                      Real-Time Micro-Circuit Solver
                    </span>
                  </div>
                  <h3 className="text-3xl font-display font-black text-[#3B2316] tracking-tight mt-1">
                    Customize Your Window
                  </h3>
                </div>

                <form onSubmit={handleGenerate} className="space-y-7">
                  {/* ─── SECTION 1: LOCATION & CITY RIBBON ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold tracking-widest text-[#8C6751] uppercase">
                        01 · Departure Hub
                      </span>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLocating}
                        className={`text-xs font-heading font-bold flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isLiveGpsActive
                            ? 'bg-[#F7EFE4] text-[#B84A27] border-[#D47A39] shadow-xs'
                            : 'bg-[#F5EBE0] text-[#B84A27] border-[#DFCBB2] hover:bg-[#B84A27] hover:text-[#FFFDF9] hover:border-[#B84A27]'
                        }`}
                        title="Detect your exact live GPS location"
                      >
                        {isLocating ? (
                          <>
                            <Navigation className="w-3 h-3 animate-spin" />
                            <span>Acquiring GPS...</span>
                          </>
                        ) : isLiveGpsActive ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#B84A27] animate-pulse" />
                            <span>📍 Live GPS Active</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3 h-3" />
                            <span>📍 Use Live GPS</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Sculpted Warm Ivory Search Input */}
                    <div className="relative">
                      <div className={`flex items-center gap-3 bg-[#FFFDF9] border-2 rounded-2xl px-4 py-3.5 shadow-2xs transition-all ${
                        isLiveGpsActive
                          ? 'border-[#B84A27] bg-[#FAF2E6]'
                          : 'border-[#E2D2BC] focus-within:border-[#B84A27]'
                      }`}>
                        <MapPin className={`w-4.5 h-4.5 shrink-0 ${isLiveGpsActive ? 'text-[#B84A27]' : 'text-[#A67B5B]'}`} />
                        <input
                          id="quick-escape-location"
                          type="text"
                          value={location}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocation(val);
                            setIsLiveGpsActive(false);
                            setGpsErrorMsg(null);
                            const cfg = getStartPointConfig(val);
                            if (cfg && cfg.customPresets[0]) {
                              setCustomStartPoint(cfg.customPresets[0]);
                            }
                          }}
                          placeholder="e.g. Jaipur, Rajasthan or Mumbai"
                          className="flex-1 bg-transparent text-lg font-heading font-bold text-[#3B2316] placeholder-[#A67B5B] outline-none"
                        />
                        {isLiveGpsActive && (
                          <span className="px-2.5 py-1 rounded-full bg-[#F7EFE4] text-[#B84A27] text-[10px] font-mono font-extrabold flex items-center gap-1 border border-[#D47A39]/40 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B84A27] animate-pulse" />
                            GPS Fixed
                          </span>
                        )}
                      </div>
                    </div>

                    {gpsErrorMsg && (
                      <p className="text-xs text-[#B84A27] font-heading font-semibold flex items-center gap-1 pt-0.5">
                        <span>⚠️</span> {gpsErrorMsg}
                      </p>
                    )}

                    {/* Flowing City Selector Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {POPULAR_CITIES_QUICK.map((city) => {
                        const cName = city.split(',')[0].trim();
                        const isSelected =
                          !isLiveGpsActive &&
                          (location === city || location.toLowerCase().startsWith(cName.toLowerCase()));

                        return (
                          <motion.button
                            key={city}
                            type="button"
                            onClick={() => handleCitySelect(city)}
                            className={`relative px-3.5 py-1.5 rounded-full font-heading text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'text-[#FFFDF9] shadow-sm'
                                : 'bg-[#FFFDF9] text-[#5C3D2E] border border-[#E2D2BC] hover:border-[#B84A27] hover:text-[#3B2316]'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="activeQuickCity"
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#B84A27] to-[#D47A39]"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10">{cName}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── SECTION 2: AVAILABLE TIME KINETIC DIAL ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold tracking-widest text-[#8C6751] uppercase">
                        02 · Available Time Ceiling
                      </span>
                      <span className="text-xs font-semibold text-[#B84A27]">
                        Strict Hard Limit
                      </span>
                    </div>

                    <div className="p-1 rounded-2xl bg-[#EFE4D4] border border-[#DFCBB2] grid grid-cols-4 gap-1 relative">
                      {AVAILABLE_TIMES.map((hours) => {
                        const isSelected = availableHours === hours;
                        return (
                          <motion.button
                            key={hours}
                            type="button"
                            onClick={() => handleTimeChange(hours)}
                            className={`relative py-2 sm:py-2.5 px-1.5 rounded-xl text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                              isSelected ? 'text-[#FFFDF9]' : 'text-[#3B2316] hover:bg-[#F5EBE0]'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="activeEscapeHourPill"
                                className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#B84A27] via-[#C85A32] to-[#D47A39] shadow-[0_8px_20px_-5px_rgba(184,74,39,0.4)]"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10 text-lg sm:text-xl font-display font-black leading-none">
                              {hours}h
                            </span>
                            <span className="relative z-10 text-[10px] sm:text-[11px] font-mono font-bold opacity-85">
                              {HOUR_LABELS[hours]}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── SECTION 3: INTERESTS TACTILE TOKENS ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold tracking-widest text-[#8C6751] uppercase">
                        03 · Curation Lenses
                      </span>
                      <span className="text-xs font-heading font-bold text-[#B84A27]">
                        {interests.length} active
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {INTEREST_OPTIONS.map(({ id, label, icon: Icon }) => {
                        const isChecked = interests.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleToggleInterest(id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-heading text-sm transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[#3B2316] text-[#FFFDF9] border border-[#3B2316] font-bold shadow-sm'
                                : 'bg-[#FFFDF9] text-[#5C3D2E] border border-[#E2D2BC] font-semibold hover:bg-[#F5EBE0]'
                            }`}
                          >
                            {isChecked ? (
                              <Check className="w-3.5 h-3.5 text-[#D47A39] stroke-[2.5]" />
                            ) : (
                              <Icon className="w-3.5 h-3.5 text-[#A67B5B]" />
                            )}
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── SECTION 4: START POINT & LOOP ASSURANCE ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold tracking-widest text-[#8C6751] uppercase">
                        04 · Circuit Origin
                      </span>
                      <span className="text-xs font-heading font-semibold text-[#7A523B]">
                        Circuit loops here
                      </span>
                    </div>

                    {/* Segmented Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectStartType('current')}
                        className={`px-4 py-2.5 rounded-full font-heading text-sm font-bold transition-all text-center cursor-pointer border ${
                          startPointType === 'current'
                            ? 'bg-[#3B2316] text-[#FFFDF9] border-[#3B2316] shadow-sm'
                            : 'bg-[#FFFDF9] text-[#5C3D2E] border-[#E2D2BC] hover:border-[#B84A27]'
                        }`}
                      >
                        Current Location
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectStartType('custom')}
                        className={`px-4 py-2.5 rounded-full font-heading text-sm font-bold transition-all text-center cursor-pointer border ${
                          startPointType === 'custom'
                            ? 'bg-[#3B2316] text-[#FFFDF9] border-[#3B2316] shadow-sm'
                            : 'bg-[#FFFDF9] text-[#5C3D2E] border-[#E2D2BC] hover:border-[#B84A27]'
                        }`}
                      >
                        Custom Pin
                      </button>
                    </div>

                    {/* Origin Callout */}
                    {startPointType === 'current' ? (
                      <div className="border-l-4 border-l-[#D47A39] pl-4 py-1">
                        <p className="font-heading text-sm font-bold text-[#3B2316]">
                          Active Origin: {isLiveGpsActive ? `Live GPS (${location})` : currentStartConfig.current}
                        </p>
                        <p className="text-xs font-mono font-extrabold text-[#B84A27] uppercase tracking-wider mt-0.5">
                          ✦ Guaranteed Return Loop Within {availableHours}h Ceiling
                        </p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2.5 pt-1"
                      >
                        <div className="flex items-center gap-3 bg-[#FFFDF9] border-2 border-[#E2D2BC] focus-within:border-[#B84A27] rounded-2xl px-4 py-3 shadow-2xs">
                          <Navigation className="w-4 h-4 text-[#A67B5B] shrink-0" />
                          <input
                            type="text"
                            value={customStartPoint}
                            onChange={(e) => setCustomStartPoint(e.target.value)}
                            placeholder="e.g. Airport, Railway Station, Hotel, Landmark"
                            className="flex-1 bg-transparent text-sm font-heading font-bold text-[#3B2316] placeholder-[#A67B5B] outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {currentStartConfig.customPresets.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleSelectPreset(preset)}
                              className={`text-xs font-heading font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                                customStartPoint === preset
                                  ? 'bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] border-[#B84A27] shadow-sm'
                                  : 'bg-[#FFFDF9] text-[#5C3D2E] border-[#E2D2BC] hover:border-[#B84A27] hover:text-[#3B2316]'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        <div className="border-l-4 border-l-[#D47A39] pl-4 py-1">
                          <p className="text-xs font-mono font-extrabold text-[#B84A27] uppercase tracking-wider">
                            ✦ Guaranteed Return Loop Within {availableHours}h Ceiling
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* CTA BUTTON */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] font-heading font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-lg shadow-[#B84A27]/30 hover:shadow-xl border border-[#B84A27]/40 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer group disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>Synthesizing Realistic Micro-Circuit...</span>
                        </>
                      ) : (
                        <>
                          <span>Generate My Quick Escape</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ═══════════ RIGHT: EDITORIAL ESCAPE DOSSIER (7-8 COLS) ═══════════ */}
            <div ref={itineraryRef} className="lg:col-span-7 xl:col-span-8 space-y-7">
              {generatedPlan ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`plan-${planKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-7"
                  >
                    {/* ─── OPEN MAGAZINE MASTHEAD HEADER ─── */}
                    <div className="space-y-4">
                      {/* Status Overline */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-extrabold tracking-[0.18em] text-[#B84A27] uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ✦ {generatedPlan.feasibilityBadge}
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-[#7A523B]">
                          · {generatedPlan.startTime} AM to {generatedPlan.endTime} PM Window
                        </span>
                      </div>

                      {/* Title & Actions Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-display font-extrabold text-[#3B2316] tracking-tight leading-snug">
                          {generatedPlan.title}
                        </h3>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={generatedPlan.mapDirectionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] font-heading font-extrabold text-sm shadow-md hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open Live Route in Maps ↗</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* ─── SCULPTED TIME-BUDGET INSTRUMENT ─── */}
                    <div className="my-7 p-6 rounded-[28px] bg-[#FFFDF9] border border-[#E6DAC6] shadow-sm">
                      {/* Top Visual Time Bar */}
                      <div ref={timeBarRef} className="h-3.5 w-full rounded-full bg-[#F3ECE1] p-0.5 flex gap-1 overflow-hidden mb-5">
                        <div
                          data-time-segment="immersion"
                          data-target-width={`${immersionPct}%`}
                          className="h-full rounded-full bg-[#B84A27]"
                          style={{ width: `${immersionPct}%` }}
                        />
                        <div
                          data-time-segment="transit"
                          data-target-width={`${transitPct}%`}
                          className="h-full rounded-full bg-[#D47A39]"
                          style={{ width: `${transitPct}%` }}
                        />
                        <div
                          data-time-segment="buffer"
                          data-target-width={`${bufferPct}%`}
                          className="h-full rounded-full bg-[#A67B5B]"
                          style={{ width: `${bufferPct}%` }}
                        />
                      </div>

                      {/* Bottom 4 Sculpted Readouts */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#8C6751]">
                            Hard Window Cap
                          </span>
                          <p className="text-lg sm:text-xl font-display font-extrabold text-[#3B2316]">
                            {generatedPlan.totalHours} Hours Total
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#8C6751]">
                            Transit Overhead
                          </span>
                          <p className="text-lg sm:text-xl font-display font-extrabold text-[#B84A27]">
                            {generatedPlan.estimatedTravelTimeMins} mins total
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#8C6751]">
                            Circuit Footprint
                          </span>
                          <p className="text-lg sm:text-xl font-display font-extrabold text-[#3B2316]">
                            ~{generatedPlan.approxDistanceKm} km Loop
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#8C6751]">
                            Return Assurance
                          </span>
                          <p className="text-lg sm:text-xl font-display font-extrabold text-[#9E5414] flex items-center gap-1.5">
                            <ShieldCheck className="w-5 h-5 text-[#D47A39]" />
                            100% Buffer Padded
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ─── HOROLOGICAL ROUTE SEQUENCE ─── */}
                    <div className="space-y-4">
                      {/* Origin Departure Medallion */}
                      <div className="rounded-2xl bg-[#F5EBE0] border border-[#DFCBB2] px-5 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Compass className="w-5 h-5 text-[#3B2316] shrink-0" />
                          <span className="font-heading text-base font-extrabold text-[#3B2316]">
                            {generatedPlan.startTime} AM · Depart {generatedPlan.startPoint}
                          </span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#D47A39] to-[#B84A27] text-[#FFFDF9] text-xs font-heading font-extrabold shrink-0">
                          Starting Point
                        </span>
                      </div>

                      {/* Chrono-Spine + Stop Cards */}
                      <div className="relative">
                        {/* Continuous vertical rail */}
                        <div className="absolute left-[22px] sm:left-[26px] top-0 bottom-0 w-[2px] bg-[#D8C5AE]">
                          <motion.div
                            className="w-full bg-gradient-to-b from-[#B84A27] to-[#D47A39]"
                            initial={{ height: '0%' }}
                            animate={{ height: '100%' }}
                            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                          />
                        </div>

                        <div className="space-y-0">
                          {generatedPlan.stops.map((stop, idx) => {
                            const isReturn = stop.category === 'Return';
                            const stopNumber = String(idx + 1).padStart(2, '0');

                            return (
                              <React.Fragment key={stop.id}>
                                <motion.div
                                  custom={idx}
                                  variants={cardVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  className="relative grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr] gap-4 items-start py-3"
                                >
                                  {/* Left Spine Column */}
                                  <div className="flex flex-col items-center pt-1 relative z-10">
                                    {/* Stop number badge */}
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-display font-black text-sm shadow-sm ${
                                      isReturn
                                        ? 'bg-gradient-to-br from-[#B84A27] to-[#D47A39] text-[#FFFDF9]'
                                        : 'bg-[#3B2316] text-[#FFFDF9]'
                                    }`}>
                                      {isReturn ? '✓' : stopNumber}
                                    </div>

                                    {/* Start time */}
                                    <span className="font-display text-lg font-black text-[#3B2316] mt-2 leading-tight text-center">
                                      {stop.startTime}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#7A523B]">AM</span>

                                    {/* Duration pill */}
                                    {!isReturn && (
                                      <span className="mt-1.5 px-2.5 py-1 rounded-full bg-[#B84A27] text-[#FFFDF9] text-xs font-mono font-extrabold">
                                        {stop.durationMins} MIN
                                      </span>
                                    )}
                                  </div>

                                  {/* Right Editorial Card */}
                                  {isReturn ? (
                                    <div className="rounded-[28px] bg-[#F7EFE4] border border-[#DFCBB2] p-5 sm:p-6 shadow-sm">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] text-xs font-heading font-extrabold uppercase">
                                            Return Complete
                                          </span>
                                          <span className="text-sm font-mono font-bold text-[#7A523B]">
                                            {stop.startTime} to {stop.endTime}
                                          </span>
                                        </div>
                                        <h5 className="text-xl sm:text-2xl font-display font-black text-[#3B2316] leading-snug">
                                          {stop.title}
                                        </h5>
                                        <p className="text-sm sm:text-base text-[#5C3D2E] font-sans leading-relaxed">
                                          ✓ Safely back within hard time cap (100% time-padded buffer assurance)
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-[28px] bg-[#FFFDF9] border border-[#E2D5BE] hover:border-[#B84A27] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all group grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                                      {/* Left 4 Columns: Atmospheric Heritage Photo */}
                                      {stop.imageUrl && (
                                        <div className="md:col-span-4 relative rounded-2xl overflow-hidden">
                                          <img
                                            src={resolveImageUrl(stop.imageUrl)}
                                            alt={stop.title}
                                            className="h-44 md:h-full min-h-[160px] w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                          />
                                          <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-full bg-[#3B2316]/80 backdrop-blur-sm text-[#FFFDF9] text-[10px] font-heading font-extrabold uppercase tracking-wider">
                                              {stop.categoryLabel}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Right 8 Columns: Rich Typography */}
                                      <div className={`${stop.imageUrl ? 'md:col-span-8' : 'md:col-span-12'} space-y-2`}>
                                        {/* Top metadata row */}
                                        <div className="flex flex-wrap items-center gap-2">
                                          {stop.rating && (
                                            <span className="inline-flex items-center gap-1 text-sm font-heading font-bold text-[#3B2316]">
                                              <Star className="w-4 h-4 text-[#D47A39] fill-[#D47A39]" />
                                              {stop.rating}
                                              {stop.reviewCount && (
                                                <span className="text-[#A67B5B] font-normal text-xs">
                                                  ({stop.reviewCount > 1000 ? `${(stop.reviewCount / 1000).toFixed(1)}k` : stop.reviewCount})
                                                </span>
                                              )}
                                            </span>
                                          )}
                                          {stop.priceNote && (
                                            <span className="text-xs sm:text-sm font-mono font-bold text-[#B84A27] bg-[#FAF2E6] px-3 py-1 rounded-full border border-[#E6DAC6]">
                                              {stop.priceNote}
                                            </span>
                                          )}
                                        </div>

                                        {/* Stop Title */}
                                        <h5 className="text-xl sm:text-2xl font-display font-black text-[#3B2316] leading-snug">
                                          {stop.title}
                                        </h5>

                                        {/* Full Description (NO truncation) */}
                                        <p className="text-sm sm:text-base text-[#5C3D2E] font-sans leading-relaxed">
                                          {stop.description}
                                        </p>

                                        {/* Tactile Time-Saving Field Note */}
                                        <div className="mt-3 px-3.5 py-2 rounded-xl bg-[#F7EFE4] border border-[#E6DAC6] text-xs sm:text-sm font-heading font-semibold text-[#7A523B] flex items-center gap-2">
                                          <Zap className="w-4 h-4 text-[#D47A39] shrink-0" />
                                          <span>{stop.whyItFits}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>

                                {/* External Transit Connector Capsule */}
                                {stop.transitToNext && !isReturn && stop.transitToNext.durationMins > 0 && (
                                  <div className="my-3 ml-[130px] sm:ml-[150px] inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#F5EBE0] border border-[#DFCBB2] text-xs sm:text-sm font-heading font-bold text-[#5C3D2E]">
                                    <TransitIcon mode={stop.transitToNext.mode} />
                                    <span className="font-extrabold text-[#3B2316]">{stop.endTime}</span>
                                    <span className="text-[#A67B5B]">·</span>
                                    <span>{stop.transitToNext.description}</span>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="rounded-[28px] bg-[#FFFDF9] border border-[#E2D2BC] p-8 text-center space-y-4">
                  <RotateCcw className="w-6 h-6 animate-spin mx-auto text-[#D47A39]" />
                  <p className="text-sm font-sans text-[#5C3D2E]">
                    Preparing sample Quick Escape itineraries...
                  </p>
                </div>
              )}
            </div>
          </div>
        </LayoutGroup>
      </div>
    </section>
  );
}

export default QuickEscapeSection;
