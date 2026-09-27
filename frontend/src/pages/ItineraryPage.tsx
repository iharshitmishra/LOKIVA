import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
import { RegionalIntelligenceBento } from '../components/itinerary/RegionalIntelligenceBento';
import { INDIAN_STATES_AND_CITIES } from '../data/places';
import {
  CheckCircle2,
  X,
  Users,
  ArrowLeft,
} from 'lucide-react';

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
  } = useItineraryStore();

  // Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [addAfterIndex, setAddAfterIndex] = useState<number | undefined>(undefined);

  // Generator control bar states
  const [inputCity, setInputCity] = useState(tripDetails?.destination || 'Jaipur');
  const [inputState, setInputState] = useState(tripDetails?.state || 'Rajasthan');
  const [inputDays, setInputDays] = useState(days?.length || 3);
  const [inputPace, setInputPace] = useState<'relaxed' | 'balanced' | 'packed'>('balanced');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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
      travelers: tripDetails.travelers || 2,
      budgetLimit: tripDetails.totalBudgetLimit || 25000,
      interests: getSavedInterests(),
      weatherPreference: getSavedWeatherPreference(),
      accessibility: getSavedAccessibility(),
    });
    setSearchParams({ city: inputCity, days: String(inputDays), pace: inputPace });
  };

  const handleQuickCitySelect = (cityName: string) => {
    setInputCity(cityName);
    const stateObj = INDIAN_STATES_AND_CITIES.find((s) => s.cities.includes(cityName));
    const st = stateObj ? stateObj.state : '';
    if (st) setInputState(st);

    generateTrip({
      city: cityName,
      state: st || undefined,
      daysCount: inputDays,
      pace: inputPace,
      travelers: tripDetails.travelers || 2,
      budgetLimit: tripDetails.totalBudgetLimit || 25000,
      interests: getSavedInterests(),
      weatherPreference: getSavedWeatherPreference(),
      accessibility: getSavedAccessibility(),
    });
    setSearchParams({ city: cityName, days: String(inputDays), pace: inputPace });
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
  const categoryBreakdown = days.reduce(
    (acc, d) => {
      if (d.metrics?.costBreakdown) {
        acc.tickets += d.metrics.costBreakdown.ticketCost || 0;
        acc.transit += d.metrics.costBreakdown.transitCost || 0;
        acc.food += d.metrics.costBreakdown.foodCost || 0;
      } else {
        const dayActs = d.activities || [];
        const tCost = dayActs.reduce((s, a) => s + (a.costPerPerson || 0) * (tripDetails.travelers || 2), 0);
        const trCost = dayActs.reduce((s, a) => s + (a.transitCost || 0), 0);
        const mCost = (d.mealBudgetPerPerson || 350) * (tripDetails.travelers || 2);
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
    <div className="min-h-screen bg-paper text-ink pb-20 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Group Trip Mode: Cost Split Per Person Banner */}
        {isGroupMode && (
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
          onQuickCitySelect={handleQuickCitySelect}
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
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. Stippl-Style Passbook Hero & Architectural Financial Ledger */}
        <TripHeaderOverview
          tripDetails={tripDetails}
          totalCost={grandTotal}
          categoryBreakdown={categoryBreakdown}
          onEditTrip={() => setIsEditTripModalOpen(true)}
          onShare={() => setIsShareModalOpen(true)}
          onPrint={handlePrint}
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
            tripDetails={tripDetails}
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
                {activeDay && (
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
            {practicalInfo && (
              <RegionalIntelligenceBento
                data={practicalInfo}
                cityName={tripDetails.destination}
                stateName={tripDetails.state}
              />
            )}
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
        dayCity={tripDetails.destination}
        onAddActivity={(dayNum, newAct, afterIdx) => addActivity(dayNum, newAct, afterIdx)}
      />

      <ShareItineraryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tripDetails={tripDetails}
        days={days}
        onPrint={handlePrint}
      />

      <EditTripModal
        isOpen={isEditTripModalOpen}
        onClose={() => setIsEditTripModalOpen(false)}
        tripDetails={tripDetails}
        onSave={(updated) => {
          useItineraryStore.setState({ tripDetails: updated });
        }}
      />
    </div>
  );
}
