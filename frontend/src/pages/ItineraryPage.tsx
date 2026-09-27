import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useItineraryStore } from '../store/useItineraryStore';
import { useGroupTripStore } from '../store/useGroupTripStore';
import { TripHeaderOverview } from '../components/itinerary/TripHeaderOverview';
import { ItineraryFilterBar } from '../components/itinerary/ItineraryFilterBar';
import { ItineraryDayConsole } from '../components/itinerary/ItineraryDayConsole';
import { ItineraryViewTabs } from '../components/itinerary/ItineraryViewTabs';
import { ItineraryTimeline } from '../components/itinerary/ItineraryTimeline';
import { ItinerarySidebar } from '../components/itinerary/ItinerarySidebar';
import { ItineraryMapView } from '../components/itinerary/ItineraryMapView';
import { ItineraryListView } from '../components/itinerary/ItineraryListView';
import { ItineraryBudgetView } from '../components/itinerary/ItineraryBudgetView';
import { ShareItineraryModal } from '../components/itinerary/ShareItineraryModal';
import { EditTripModal } from '../components/itinerary/EditTripModal';
import { AddActivityModal } from '../components/itinerary/AddActivityModal';
import { DeleteTripModal } from '../components/itinerary/DeleteTripModal';
import { RegionalIntelligenceBento } from '../components/itinerary/RegionalIntelligenceBento';
import { INDIAN_STATES_AND_CITIES } from '../data/places';
import {
  CheckCircle2,
  X,
  Users,
  ArrowLeft,
  Sparkles,
  MapPin,
  Compass,
  MessageSquare,
  Bookmark,
  Calendar,
  PlusCircle,
} from 'lucide-react';

const POPULAR_DESTINATIONS = [
  { city: 'Jaipur', state: 'Rajasthan', label: 'Pink City Heritage' },
  { city: 'Varanasi', state: 'Uttar Pradesh', label: 'Sacred Ghats' },
  { city: 'Mumbai', state: 'Maharashtra', label: 'Colaba & Coastal Forts' },
  { city: 'Kochi', state: 'Kerala', label: 'Spice Coast & Backwaters' },
  { city: 'Shimla', state: 'Himachal Pradesh', label: 'Pine Forest Trails' },
  { city: 'Udaipur', state: 'Rajasthan', label: 'Lakes & Palaces' },
  { city: 'Goa', state: 'Goa', label: 'Latin Quarter & Coast' },
  { city: 'Delhi', state: 'Delhi', label: 'Mughal & Imperial Corridors' },
  { city: 'Hampi', state: 'Karnataka', label: 'Ancient Vijayanagara' },
];

const DURATION_CHOICES = [1, 2, 3, 4, 5, 7];

export function ItineraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Zustand Itinerary Store
  const {
    tripDetails,
    days,
    selectedDay,
    activeStopId,
    hoveredStopId,
    viewMode,
    feasibilityMetrics = {},
    practicalInfo,
    isGenerating,
    lastReplanMessage,
    setSelectedDay,
    setActiveStopId,
    setHoveredStopId,
    setViewMode,
    reorderActivity,
    deleteActivity,
    addActivity,
    updateActivity,
    setDayStartTime,
    replanDay,
    generateTrip,
    clearReplanMessage,
    deleteTrip,
  } = useItineraryStore();

  // Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addAfterIndex, setAddAfterIndex] = useState<number | undefined>(undefined);

  // Generator control bar states
  const [inputCity, setInputCity] = useState(tripDetails?.destination || 'Jaipur');
  const [inputState, setInputState] = useState(tripDetails?.state || 'Rajasthan');
  const [inputDays, setInputDays] = useState(days?.length || 3);
  const [inputPace, setInputPace] = useState<'relaxed' | 'balanced' | 'packed'>('balanced');
  const [inputTravelers, setInputTravelers] = useState<number>(tripDetails?.travelers || 2);
  const [inputBudget, setInputBudget] = useState<number>(tripDetails?.totalBudgetLimit || 25000);

  // Group trip mode query parameters (passed from Lokiva Group Hub)
  const groupId = searchParams.get('groupId');
  const isGroupMode = searchParams.get('groupMode') === 'true' || Boolean(groupId);
  const groupTravelersParam = searchParams.get('travelers') ? parseInt(searchParams.get('travelers')!, 10) : null;
  const groupBudgetParam = searchParams.get('budget') ? parseInt(searchParams.get('budget')!, 10) : null;
  const groupPerPersonParam = searchParams.get('perPersonBudget') ? parseInt(searchParams.get('perPersonBudget')!, 10) : null;
  const groupInterestsParam = searchParams.get('interests') ? searchParams.get('interests')!.split(',') : null;

  const { sessions } = useGroupTripStore();
  const groupSession = groupId ? sessions[groupId] : undefined;

  const displayTravelers = groupTravelersParam || tripDetails?.travelers || 2;
  const displayTotalBudget = groupBudgetParam || tripDetails?.totalBudgetLimit || 25000;
  const displayPerPersonBudget = groupPerPersonParam || Math.round(displayTotalBudget / displayTravelers);

  // Auto-generate if URL query parameters change (e.g. /itinerary?city=Varanasi&days=3)
  useEffect(() => {
    const cityParam = searchParams.get('city');
    const stateParam = searchParams.get('state');
    const daysParam = searchParams.get('days') ? parseInt(searchParams.get('days')!, 10) : null;
    const paceParam = (searchParams.get('pace') as 'relaxed' | 'balanced' | 'packed') || null;

    if (cityParam && (cityParam.toLowerCase() !== (tripDetails?.destination || '').toLowerCase() || isGroupMode)) {
      setInputCity(cityParam);
      if (stateParam) setInputState(stateParam);
      if (daysParam) setInputDays(daysParam);
      if (paceParam) setInputPace(paceParam);

      generateTrip({
        city: cityParam,
        state: stateParam || undefined,
        daysCount: daysParam || 3,
        pace: paceParam || 'balanced',
        travelers: displayTravelers,
        budgetLimit: displayTotalBudget,
        interests: groupInterestsParam && groupInterestsParam.length > 0 ? groupInterestsParam : getSavedInterests(),
        weatherPreference: getSavedWeatherPreference(),
        accessibility: getSavedAccessibility(),
      });
    }
  }, [searchParams]);

  // Active day and its feasibility metrics
  const hasActiveTrip = Boolean(tripDetails && days && days.length > 0);
  const activeDayIndex = Math.max(0, Math.min((days?.length || 1) - 1, selectedDay - 1));
  const activeDay = days?.[activeDayIndex] || days?.[0];
  const activeMetrics = activeDay && feasibilityMetrics ? feasibilityMetrics[activeDay.dayNumber] || null : null;

  // Preceding stop for proximity search in Add Activity Modal
  const precedingStop =
    addAfterIndex !== undefined && activeDay?.activities[addAfterIndex]
      ? activeDay.activities[addAfterIndex]
      : activeDay?.activities[activeDay.activities.length - 1] || null;

  const getSavedDiscoveryAnswers = () => {
    try {
      const raw = localStorage.getItem('lokiva_discovery_answers');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  const getSavedInterests = (): string[] => {
    const answers = getSavedDiscoveryAnswers();
    if (answers && Array.isArray(answers.interests) && answers.interests.length > 0) {
      return answers.interests;
    }
    return ['heritage', 'crafts', 'food'];
  };

  const getSavedWeatherPreference = (): 'winter' | 'monsoon' | 'summer_hills' | 'temperate' => {
    const answers = getSavedDiscoveryAnswers();
    return answers?.weather_preference || 'winter';
  };

  const getSavedAccessibility = () => {
    const answers = getSavedDiscoveryAnswers();
    return answers?.accessibility || undefined;
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateTrip({
      city: inputCity,
      state: inputState || undefined,
      daysCount: inputDays,
      pace: inputPace,
      travelers: inputTravelers || tripDetails?.travelers || 2,
      budgetLimit: inputBudget || tripDetails?.totalBudgetLimit || 25000,
      interests: getSavedInterests(),
      weatherPreference: getSavedWeatherPreference(),
      accessibility: getSavedAccessibility(),
    });
    setSearchParams({ city: inputCity, days: String(inputDays), pace: inputPace });
  };

  const handleQuickCitySelect = (cityName: string, stateName?: string) => {
    setInputCity(cityName);
    let st = stateName || '';
    if (!st) {
      const stateObj = INDIAN_STATES_AND_CITIES.find((s) => s.cities.includes(cityName));
      st = stateObj ? stateObj.state : '';
    }
    if (st) setInputState(st);

    generateTrip({
      city: cityName,
      state: st || undefined,
      daysCount: inputDays,
      pace: inputPace,
      travelers: inputTravelers || tripDetails?.travelers || 2,
      budgetLimit: inputBudget || tripDetails?.totalBudgetLimit || 25000,
      interests: getSavedInterests(),
      weatherPreference: getSavedWeatherPreference(),
      accessibility: getSavedAccessibility(),
    });
    setSearchParams({ city: cityName, days: String(inputDays), pace: inputPace });
  };

  const handleDeleteTripConfirm = () => {
    deleteTrip();
    setSearchParams({});
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenAddModal = (dayNum: number, afterIdx?: number) => {
    setSelectedDay(dayNum);
    setAddAfterIndex(afterIdx);
    setIsAddActivityModalOpen(true);
  };

  // Compute Grand Total and Category Breakdown for Header directly from day metrics or calibrated components
  const categoryBreakdown = (days || []).reduce(
    (acc, d) => {
      if (d.metrics?.costBreakdown) {
        acc.tickets += d.metrics.costBreakdown.ticketCost || 0;
        acc.transit += d.metrics.costBreakdown.transitCost || 0;
        acc.food += d.metrics.costBreakdown.foodCost || 0;
      } else {
        const dayActs = d.activities || [];
        const tCost = dayActs.reduce((s, a) => s + (a.costPerPerson || 0) * (tripDetails?.travelers || 2), 0);
        const trCost = dayActs.reduce((s, a) => s + (a.transitCost || 0), 0);
        const mCost = (d.mealBudgetPerPerson || 350) * (tripDetails?.travelers || 2);
        acc.tickets += tCost;
        acc.transit += trCost;
        acc.food += mCost;
      }
      return acc;
    },
    { tickets: 0, transit: 0, food: 0 }
  );

  const grandTotal = categoryBreakdown.tickets + categoryBreakdown.transit + categoryBreakdown.food;

  return (
    <div className="min-h-screen bg-transparent text-ink pb-20 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Group Trip Mode: Cost Split Per Person Banner */}
        {isGroupMode && hasActiveTrip && (
          <div className="p-5 rounded-3xl bg-white border-2 border-[#E8DEC8] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF4ED] border border-[#E8DEC8] flex items-center justify-center text-[#C85A32] shrink-0">
                  <Users className="w-5 h-5 text-[#C85A32]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF4ED] border border-[#E8DEC8] text-[#C85A32] text-[10px] font-heading font-extrabold uppercase tracking-wide">
                      Group Trip Mode · Squad #{groupId || 'Hub'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-heading font-bold border border-emerald-200">
                      Collective Consensus Plan
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-heading font-black text-ink">
                    {groupSession?.groupName || 'Squad Cultural Circuit'} · {displayTravelers} Travelers
                  </h2>
                </div>
              </div>

              {groupId && (
                <Link
                  to={`/group/${groupId}`}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#FAF4ED] border border-[#DDD7CC] hover:border-[#C85A32] text-xs font-heading font-bold text-[#C85A32] transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Group Hub</span>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#FAF4ED]">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] space-y-1">
                <span className="text-[10px] font-mono text-dusk-400 font-bold uppercase block">
                  Total Group Spend
                </span>
                <span className="text-xl font-mono font-bold text-ink">
                  ₹{displayTotalBudget.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase block">
                  Per-Person Split
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-mono font-black text-emerald-900">
                    ₹{displayPerPersonBudget.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-sans text-emerald-700">/ traveler</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-mono text-dusk-400 font-bold uppercase block">
                  Fair Sweet-Spot
                </span>
                <span className="text-xs font-sans text-dusk-600 leading-snug">
                  Calibrated to protect lowest member ceiling without financial stretch
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── CASE A: ACTIVE ITINERARY EXISTS ────────────────────────── */}
        {hasActiveTrip ? (
          <>
            {/* 1. Floating Glassmorphic Command Deck & Quick Hubs */}
            <ItineraryFilterBar
              city={inputCity}
              daysCount={inputDays}
              pace={inputPace}
              isGenerating={isGenerating}
              onCityChange={(city) => setInputCity(city)}
              onDaysChange={(days) => setInputDays(days)}
              onPaceChange={(pace) => setInputPace(pace)}
              onGenerate={handleGenerateSubmit}
              onQuickCitySelect={(city) => handleQuickCitySelect(city)}
            />

            {/* 2. Replan Alert Toast Banner */}
            {lastReplanMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs font-sans text-emerald-900 shadow-2xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{lastReplanMessage}</span>
                </div>
                <button
                  onClick={clearReplanMessage}
                  className="p-1 text-emerald-700 hover:text-emerald-950 rounded-md cursor-pointer"
                  aria-label="Dismiss message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 3. Stippl-Style Passbook Hero & Architectural Financial Ledger */}
            <TripHeaderOverview
              tripDetails={tripDetails!}
              totalCost={grandTotal}
              categoryBreakdown={categoryBreakdown}
              onEditTrip={() => setIsEditTripModalOpen(true)}
              onShare={() => setIsShareModalOpen(true)}
              onPrint={handlePrint}
              onDeleteTrip={() => setIsDeleteModalOpen(true)}
            />

            {/* 4. Fluid Day Navigation, View Modes & Environmental Adaptive Telemetry Console */}
            <ItineraryDayConsole
              days={days}
              selectedDay={selectedDay}
              feasibilityMetrics={feasibilityMetrics}
              activeFilter={activeDay?.activeFilter || 'none'}
              viewTabs={<ItineraryViewTabs currentView={viewMode} onViewChange={setViewMode} />}
              onSelectDay={(dayNum) => setSelectedDay(dayNum)}
              onReplanDay={(condition) => replanDay(activeDay?.dayNumber || selectedDay, condition)}
            />

            {/* 5. Main Content Area */}
            {viewMode === 'map' ? (
              <ItineraryMapView
                days={days}
                selectedDayNumber={selectedDay}
                activeStopId={activeStopId}
                hoveredStopId={hoveredStopId}
                onSelectStop={(id) => setActiveStopId(id)}
              />
            ) : viewMode === 'list' ? (
              <ItineraryListView days={days} />
            ) : viewMode === 'budget' ? (
              <ItineraryBudgetView
                days={days}
                tripDetails={tripDetails!}
                practicalInfo={practicalInfo}
              />
            ) : (
              /* Default Timeline View (Two-Column Desktop Layout + Bottom Regional Bento) */
              <div className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                  {/* Left Column (7-8 cols): Continuous Chrono-Spine & Asymmetric Stop Cards */}
                  <div className="lg:col-span-8 space-y-6">
                    {activeDay && (
                      <ItineraryTimeline
                        day={activeDay}
                        totalDays={days.length}
                        activeStopId={activeStopId}
                        hoveredStopId={hoveredStopId}
                        onUpdateActivityStatus={(dayNum, actId, status) =>
                          updateActivity(dayNum, actId, { bookingStatus: status })
                        }
                        onUpdateActivityNotes={(dayNum, actId, notes) =>
                          updateActivity(dayNum, actId, { notes })
                        }
                        onUpdateActivityDuration={(dayNum, actId, durationMins) =>
                          updateActivity(dayNum, actId, {
                            visitDurationMinutes: durationMins,
                            durationMins,
                            duration: `${durationMins} mins`,
                          })
                        }
                        onUpdateActivityTiming={(dayNum, actId, customStartMinutes, durationMins) =>
                          updateActivity(dayNum, actId, {
                            customStartMinutes,
                            visitDurationMinutes: durationMins,
                            durationMins,
                            duration: `${durationMins} mins`,
                          })
                        }
                        onMoveActivity={(dayNum, fromIdx, toIdx) =>
                          reorderActivity(dayNum, fromIdx, toIdx)
                        }
                        onRemoveActivity={(dayNum, actId) => deleteActivity(dayNum, actId)}
                        onAddActivityClick={(dayNum, afterIdx) => handleOpenAddModal(dayNum, afterIdx)}
                        onSetStartTime={(dayNum, startTime) => setDayStartTime(dayNum, startTime)}
                        onStopHover={(id) => setHoveredStopId(id)}
                        onStopSelect={(id) => setActiveStopId(id)}
                      />
                    )}
                  </div>

                  {/* Right Column (4 cols): Sticky Spatiotemporal Transit & Financial Dock */}
                  <div className="lg:col-span-4">
                    {activeDay && tripDetails && (
                      <ItinerarySidebar
                        day={activeDay}
                        tripDetails={tripDetails}
                        days={days}
                        activeStopId={activeStopId}
                        hoveredStopId={hoveredStopId}
                        grandTotal={grandTotal}
                        categoryBreakdown={categoryBreakdown}
                        onSelectStop={(id) => setActiveStopId(id)}
                        onExpandFullScreenMap={() => setViewMode('map')}
                        onShare={() => setIsShareModalOpen(true)}
                        onPrint={handlePrint}
                      />
                    )}
                  </div>
                </div>

                {/* Magazine-Grade 4-Pillar Regional Intelligence Bento */}
                {practicalInfo && tripDetails && (
                  <RegionalIntelligenceBento
                    data={practicalInfo}
                    cityName={tripDetails.destination}
                    stateName={tripDetails.state}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          /* ─── CASE B: NO ACTIVE ITINERARY (START NEW TRIP BUILDER) ────────── */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Hero */}
            <div className="bg-[#FFFDF9] border border-[#E6DAC6] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0DF] border border-[#F2D5A7] text-xs font-heading font-extrabold uppercase tracking-wider text-[#B84A27]">
                <Sparkles className="w-3.5 h-3.5 text-[#B84A27]" />
                <span>LOKIVA Itinerary Solver</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#3B2316] tracking-tight">
                Plan Your Next Cultural Journey
              </h1>
              <p className="text-sm sm:text-base text-[#7A5C49] font-sans max-w-2xl mx-auto leading-relaxed">
                No active itinerary currently open. Configure your destination, trip length, and travel pace below to generate a tailored day-by-day heritage plan.
              </p>
            </div>

            {/* Interactive Builder Form Card */}
            <div className="bg-[#FFFDF9] border border-[#E6DAC6] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-[#E6DAC6] pb-4">
                <h2 className="text-xl font-heading font-bold text-[#3B2316]">
                  Configure New Trip Parameters
                </h2>
                <p className="text-xs text-[#7A5C49] font-sans">
                  Select a destination and duration to immediately solve arrival timings, transit hops, and budget allocation.
                </p>
              </div>

              <form onSubmit={handleGenerateSubmit} className="space-y-6">
                {/* 1. Destination Input & Quick Picks */}
                <div className="space-y-3">
                  <label className="text-xs font-heading font-bold uppercase tracking-wider text-[#7A5C49] block">
                    Destination City or State
                  </label>
                  <div className="flex items-center gap-3 bg-[#FAF6F0] border border-[#E6DAC6] rounded-2xl px-4 py-3">
                    <MapPin className="w-5 h-5 text-[#B84A27] shrink-0" />
                    <input
                      type="text"
                      required
                      value={inputCity}
                      onChange={(e) => {
                        setInputCity(e.target.value);
                        const found = INDIAN_STATES_AND_CITIES.find((s) => s.cities.includes(e.target.value));
                        if (found) setInputState(found.state);
                      }}
                      placeholder="Enter city (e.g. Jaipur, Varanasi, Mumbai, Kochi, Shimla...)"
                      className="w-full bg-transparent border-none text-base font-heading font-bold text-[#3B2316] placeholder:text-[#A67B5B]/60 focus:outline-none focus:ring-0"
                    />
                  </div>

                  {/* Quick Pick Destinations */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-sans font-semibold text-[#8C6751]">
                      Popular Heritage Corridors:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_DESTINATIONS.map((dest) => {
                        const isSelected = inputCity.toLowerCase() === dest.city.toLowerCase();
                        return (
                          <button
                            key={dest.city}
                            type="button"
                            onClick={() => {
                              setInputCity(dest.city);
                              setInputState(dest.state);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] border-[#B84A27] shadow-2xs'
                                : 'bg-[#FAF6F0] hover:bg-[#FAF0DF] text-[#5C3D2E] border-[#E6DAC6] hover:border-[#B84A27]'
                            }`}
                          >
                            <span>{dest.city}</span>
                            <span className="text-[10px] opacity-75">({dest.label})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Duration & Pace Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Duration Stepper */}
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold uppercase tracking-wider text-[#7A5C49] block">
                      Duration (Days)
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {DURATION_CHOICES.map((num) => {
                        const isSelected = inputDays === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setInputDays(num)}
                            className={`py-2.5 rounded-xl text-xs font-heading font-extrabold border transition cursor-pointer text-center ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] border-[#B84A27] shadow-2xs'
                                : 'bg-[#FAF6F0] hover:bg-[#FAF0DF] text-[#5C3D2E] border-[#E6DAC6]'
                            }`}
                          >
                            {num}D
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Travel Pace */}
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold uppercase tracking-wider text-[#7A5C49] block">
                      Travel Pace
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'relaxed', label: 'Relaxed' },
                        { id: 'balanced', label: 'Balanced' },
                        { id: 'packed', label: 'Packed' },
                      ].map((item) => {
                        const isSelected = inputPace === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setInputPace(item.id as any)}
                            className={`py-2.5 rounded-xl text-xs font-heading font-extrabold border transition cursor-pointer text-center capitalize ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] border-[#B84A27] shadow-2xs'
                                : 'bg-[#FAF6F0] hover:bg-[#FAF0DF] text-[#5C3D2E] border-[#E6DAC6]'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Travelers & Budget Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Travelers */}
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold uppercase tracking-wider text-[#7A5C49] block">
                      Number of Travelers
                    </label>
                    <div className="flex items-center gap-3 bg-[#FAF6F0] border border-[#E6DAC6] rounded-2xl px-4 py-2.5">
                      <Users className="w-4 h-4 text-[#B84A27] shrink-0" />
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={inputTravelers}
                        onChange={(e) => setInputTravelers(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-transparent border-none text-sm font-heading font-bold text-[#3B2316] focus:outline-none focus:ring-0"
                      />
                      <span className="text-xs font-sans text-[#7A5C49] shrink-0">
                        {inputTravelers === 1 ? 'Solo Traveler' : 'Travelers'}
                      </span>
                    </div>
                  </div>

                  {/* Budget Limit */}
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold uppercase tracking-wider text-[#7A5C49] block">
                      Total Target Budget (₹ INR)
                    </label>
                    <div className="flex items-center gap-3 bg-[#FAF6F0] border border-[#E6DAC6] rounded-2xl px-4 py-2.5">
                      <span className="text-sm font-mono font-bold text-[#B84A27]">₹</span>
                      <input
                        type="number"
                        min={1000}
                        step={1000}
                        value={inputBudget}
                        onChange={(e) => setInputBudget(parseInt(e.target.value, 10) || 10000)}
                        className="w-full bg-transparent border-none text-sm font-mono font-bold text-[#3B2316] focus:outline-none focus:ring-0"
                      />
                      <span className="text-xs font-sans text-[#7A5C49] shrink-0">
                        (~₹{Math.round(inputBudget / Math.max(1, inputTravelers)).toLocaleString('en-IN')}/person)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:opacity-95 text-[#FFFDF9] font-heading font-bold text-sm uppercase tracking-wider py-4 rounded-2xl shadow-lg shadow-[#B84A27]/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#FFFDF9]" />
                    <span>{isGenerating ? 'Solving Spatial & Timing Matrix...' : '✨ Generate Curated Itinerary'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Alternative Discovery Gateways */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/guide"
                className="p-5 rounded-3xl bg-[#FFFDF9] border border-[#E6DAC6] hover:border-[#B84A27] transition shadow-2xs hover:shadow-md space-y-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-center text-[#B84A27]">
                  <MessageSquare className="w-5 h-5 text-[#B84A27]" />
                </div>
                <h3 className="font-heading font-bold text-[#3B2316] group-hover:text-[#B84A27] transition-colors">
                  Consult AI Concierge
                </h3>
                <p className="text-xs text-[#7A5C49] font-sans leading-relaxed">
                  Ask Groq Qwen for dynamic route ideas, culinary advice, or budget recommendations in conversational chat.
                </p>
              </Link>

              <Link
                to="/map"
                className="p-5 rounded-3xl bg-[#FFFDF9] border border-[#E6DAC6] hover:border-[#B84A27] transition shadow-2xs hover:shadow-md space-y-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-center text-[#B84A27]">
                  <Compass className="w-5 h-5 text-[#B84A27]" />
                </div>
                <h3 className="font-heading font-bold text-[#3B2316] group-hover:text-[#B84A27] transition-colors">
                  Explore Cultural Map
                </h3>
                <p className="text-xs text-[#7A5C49] font-sans leading-relaxed">
                  Browse geographic clusters, stepwells, artisan guilds, and monuments visually on the interactive map.
                </p>
              </Link>

              <Link
                to="/saved"
                className="p-5 rounded-3xl bg-[#FFFDF9] border border-[#E6DAC6] hover:border-[#B84A27] transition shadow-2xs hover:shadow-md space-y-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-center text-[#B84A27]">
                  <Bookmark className="w-5 h-5 text-[#B84A27]" />
                </div>
                <h3 className="font-heading font-bold text-[#3B2316] group-hover:text-[#B84A27] transition-colors">
                  Saved Heritage Wishlist
                </h3>
                <p className="text-xs text-[#7A5C49] font-sans leading-relaxed">
                  Review bookmarked masterclasses, verified landmarks, and previously saved trip plans.
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────── */}
      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        dayNumber={selectedDay}
        insertAfterIndex={addAfterIndex}
        precedingStop={precedingStop}
        dayCity={tripDetails?.destination || inputCity}
        onAddActivity={(dayNum, newAct, afterIdx) => addActivity(dayNum, newAct, afterIdx)}
      />

      <ShareItineraryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tripDetails={tripDetails || ({} as any)}
        days={days}
        onPrint={handlePrint}
      />

      {tripDetails && (
        <EditTripModal
          isOpen={isEditTripModalOpen}
          onClose={() => setIsEditTripModalOpen(false)}
          tripDetails={tripDetails}
          onSave={(updated) => {
            useItineraryStore.setState({ tripDetails: updated });
          }}
        />
      )}

      <DeleteTripModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        tripDetails={tripDetails}
        onConfirmDelete={handleDeleteTripConfirm}
      />
    </div>
  );
}
