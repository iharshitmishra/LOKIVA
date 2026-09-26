import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Ticket,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  ExternalLink,
  CloudRain,
  AlertTriangle,
  RefreshCw,
  Trash2,
  RotateCcw,
  Building,
  Sliders,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { api } from '../lib/api';
import { Experience } from '../types';
import { ExperienceCard } from '../components/experience/ExperienceCard';
import { usePassWalletStore } from '../store/usePassWalletStore';
import {
  useMyItinerariesStore,
  SavedItineraryRecord,
  SavedItineraryStop,
} from '../store/useMyItinerariesStore';
import { OnGroundRescheduleModal } from '../components/itinerary/OnGroundRescheduleModal';
import {
  DisruptionReason,
  IntervalReplacementCandidate,
  checkStopWeatherForecast,
  WeatherSlotStatus,
} from '../services/rescheduleEngineHooks';

export function SavedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'itineraries' | 'places' | 'passes') || 'itineraries';
  const [activeTab, setActiveTab] = useState<'itineraries' | 'places' | 'passes'>(initialTab);

  const [savedExperiences, setSavedExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { passes, setActiveViewingReceipt } = usePassWalletStore();
  const {
    itineraries,
    activeItineraryId,
    setActiveItineraryId,
    saveItineraryWithDate,
    swapStopForTimeInterval,
    undoSwapStop,
    toggleSimulatedRainForStop,
    removeSavedItinerary,
  } = useMyItinerariesStore();

  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);
  const [rescheduleModalStop, setRescheduleModalStop] = useState<SavedItineraryStop | null>(null);
  const [rescheduleInitialReason, setRescheduleInitialReason] = useState<DisruptionReason>('temple_or_shop_closed');
  const [weatherStatuses, setWeatherStatuses] = useState<Record<string, WeatherSlotStatus>>({});

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'itineraries' || tabParam === 'places' || tabParam === 'passes') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load wishlist items
  useEffect(() => {
    async function loadSaved() {
      try {
        const list = await api.getFavorites();
        if (Array.isArray(list) && list.length > 0) {
          setSavedExperiences(list);
          try {
            localStorage.setItem('lokiva_saved_items', JSON.stringify(list));
          } catch {}
        } else {
          try {
            const local = JSON.parse(localStorage.getItem('lokiva_saved_items') || '[]');
            setSavedExperiences(Array.isArray(local) ? local : []);
          } catch {
            setSavedExperiences([]);
          }
        }
      } catch (err) {
        try {
          const local = JSON.parse(localStorage.getItem('lokiva_saved_items') || '[]');
          setSavedExperiences(Array.isArray(local) ? local : []);
        } catch {
          setSavedExperiences([]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadSaved();
  }, []);

  // Determine active itinerary
  const currentItinerary: SavedItineraryRecord | undefined =
    itineraries.find((it) => it.itineraryId === activeItineraryId) || itineraries[0];

  const currentDay = currentItinerary?.days.find((d) => d.dayNumber === activeDayNumber) || currentItinerary?.days[0];

  // Fetch / check weather for all stops on active day
  useEffect(() => {
    if (!currentItinerary || !currentDay) return;

    let isMounted = true;
    const newStatuses: Record<string, WeatherSlotStatus> = {};

    Promise.all(
      currentDay.stops.map(async (stop) => {
        const isSimulatedRain = Boolean(stop.disruptionState?.weatherAlertActive);
        const res = await checkStopWeatherForecast({
          city: currentItinerary.city,
          placeTitle: stop.title,
          dateIso: stop.dateIso,
          startTime: stop.startTime,
          endTime: stop.endTime,
          simulateRainOverride: isSimulatedRain,
        });
        newStatuses[String(stop.stopId)] = res;
      })
    ).then(() => {
      if (isMounted) {
        setWeatherStatuses(newStatuses);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentItinerary?.itineraryId, currentDay?.dayNumber, currentDay?.stops]);

  const handleTabChange = (tab: 'itineraries' | 'places' | 'passes') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRemoveFromSaved = (experienceId: number) => {
    setSavedExperiences((prev) => prev.filter((item) => item.id !== experienceId));
    try {
      const local = JSON.parse(localStorage.getItem('lokiva_saved_items') || '[]');
      const updated = Array.isArray(local) ? local.filter((item: any) => item.id !== experienceId) : [];
      localStorage.setItem('lokiva_saved_items', JSON.stringify(updated));
    } catch {}
  };

  const handleOpenRescheduleModal = (stop: SavedItineraryStop, reason: DisruptionReason = 'temple_or_shop_closed') => {
    setRescheduleModalStop(stop);
    setRescheduleInitialReason(reason);
  };

  const handleSwapConfirmed = (candidate: IntervalReplacementCandidate, reason: DisruptionReason) => {
    if (!currentItinerary || !currentDay || !rescheduleModalStop) return;
    swapStopForTimeInterval(
      currentItinerary.itineraryId,
      currentDay.dayNumber,
      rescheduleModalStop.stopId,
      candidate,
      reason
    );
    setRescheduleModalStop(null);
  };

  const handleLoadDemoItinerary = () => {
    const todayIso = new Date().toISOString().split('T')[0];
    const demoPayload = {
      title: '3-Day Lonavala & Mumbai Heritage Trail',
      city: 'Lonavala & Mumbai',
      state: 'Maharashtra',
      startDateIso: todayIso,
      totalBudgetInr: 14850,
      days: [
        {
          dayNumber: 1,
          themeTitle: 'Monsoon Hills & Ancient Rock-Cut Monasteries',
          activities: [
            {
              id: 'demo_stop_1',
              title: 'Karla Caves & Buddhist Monastic Chaitya Hall',
              category: 'ROCK-CUT MONASTERY',
              location: 'Karla Hills, Lonavala',
              description: 'Magnificent 2nd-century BCE Buddhist rock-cut halls featuring ancient teakwood ribbed arches and monumental stupa.',
              photos: ['https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'],
              costPerPerson: 350,
              startTime: '08:30 AM',
              endTime: '11:30 AM',
              visitDurationMinutes: 180,
            },
            {
              id: 'demo_stop_2',
              title: "Tiger's Leap & Khandala Panoramic Ridge",
              category: 'NATURAL CLIFF SANCTUARY',
              location: 'Valley View Road, Khandala',
              description: 'Sheer cliff drop overlooking the Sahyadri gorge with mist-laden waterfalls and deep emerald vistas.',
              photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'],
              costPerPerson: 0,
              startTime: '11:45 AM',
              endTime: '01:15 PM',
              visitDurationMinutes: 90,
            },
            {
              id: 'demo_stop_3',
              title: 'Maganlal Ancestral Chikki & Fudgy Sweet Guild',
              category: 'HERITAGE CONFECTIONERY',
              location: 'Bazaar Road, Lonavala',
              description: 'Generational sweetmakers crafting handmade jaggery, groundnut, and rose petal chikki over brass vats.',
              photos: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'],
              costPerPerson: 420,
              startTime: '01:55 PM',
              endTime: '02:40 PM',
              visitDurationMinutes: 45,
            },
            {
              id: 'demo_stop_4',
              title: 'Bhaja Caves 14 Stupas & Waterfall Amphitheater',
              category: 'ANCIENT MONUMENTS',
              location: 'Bhaja Village, Malavali',
              description: 'Rare group of 22 rock-cut caves with intricately carved wooden architecture prototypes and cascading streams.',
              photos: ['https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80'],
              costPerPerson: 300,
              startTime: '03:15 PM',
              endTime: '05:30 PM',
              visitDurationMinutes: 135,
            },
          ],
        },
        {
          dayNumber: 2,
          themeTitle: 'South Mumbai Colonial Guilds & Art Deco Arcades',
          activities: [
            {
              id: 'demo_stop_5',
              title: 'Kyani & Co. Heritage Irani Parsi Bakery',
              category: 'CULINARY LEGACY',
              location: 'Marine Lines, Mumbai',
              description: 'Operating since 1904, serving authentic bun maska, mawa cakes, and Irani chai in bentwood chair ambiance.',
              photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
              costPerPerson: 380,
              startTime: '08:30 AM',
              endTime: '10:00 AM',
              visitDurationMinutes: 90,
            },
            {
              id: 'demo_stop_6',
              title: 'Kala Ghoda Artisan Quarter & Copper Weavers',
              category: 'LIVING GUILDS',
              location: 'Fort Precinct, Mumbai',
              description: 'Paved artistic enclave of brass metalworkers, ceramicists, and antique book restorers.',
              photos: ['https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'],
              costPerPerson: 550,
              startTime: '10:30 AM',
              endTime: '01:00 PM',
              visitDurationMinutes: 150,
            },
          ],
        },
      ],
    };

    saveItineraryWithDate(demoPayload);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3B2316] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header & Segmented Tab Navigation */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFFDF9] border border-[#DFCBB2] text-[#B84A27] rounded-full text-xs font-mono font-bold shadow-2xs">
                <Compass className="w-3.5 h-3.5 text-[#B84A27]" />
                <span>Trip Command &amp; Saved Vault</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-black text-[#3B2316] tracking-tight">
                My Itineraries &amp; Saved Vault
              </h1>
              <p className="text-xs sm:text-sm text-[#7A5C49] font-sans">
                Scheduled multi-day itineraries with live weather monitors and on-ground interval rescheduling.
              </p>
            </div>

            {/* Top Quick Demo Button if no itineraries exist */}
            {itineraries.length === 0 && (
              <button
                type="button"
                onClick={handleLoadDemoItinerary}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:opacity-95 text-[#FFFDF9] text-xs font-heading font-extrabold uppercase tracking-wider shadow-sm cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ Load Demo 3-Day Lonavala Itinerary</span>
              </button>
            )}
          </div>

          {/* Segmented Tab Pill Selector */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#FAF0DF]/60 border border-[#DFCBB2] w-fit">
            <button
              type="button"
              onClick={() => handleTabChange('itineraries')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'itineraries'
                  ? 'bg-[#B84A27] text-[#FFFDF9] shadow-sm'
                  : 'text-[#7A5C49] hover:text-[#3B2316] hover:bg-[#FFFDF9]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Active Itineraries ({itineraries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('places')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'places'
                  ? 'bg-[#B84A27] text-[#FFFDF9] shadow-sm'
                  : 'text-[#7A5C49] hover:text-[#3B2316] hover:bg-[#FFFDF9]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Places ({savedExperiences.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('passes')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'passes'
                  ? 'bg-[#B84A27] text-[#FFFDF9] shadow-sm'
                  : 'text-[#7A5C49] hover:text-[#3B2316] hover:bg-[#FFFDF9]'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Verified Passes ({passes.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MY ACTIVE ITINERARIES (Centerpiece View) */}
        {activeTab === 'itineraries' && (
          <div className="space-y-6">
            {itineraries.length === 0 ? (
              <div className="text-center py-16 bg-[#FFFDF9] rounded-3xl border-2 border-[#DFCBB2] p-8 sm:p-12 space-y-4 max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-center mx-auto text-[#B84A27] shadow-2xs">
                  <Calendar className="w-7 h-7 text-[#B84A27]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-display font-black text-[#3B2316]">
                    No Scheduled Itineraries Saved Yet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7A5C49] font-sans max-w-sm mx-auto leading-relaxed">
                    Generate an itinerary from the Itinerary planner, lock your departure date, and click <strong>Add to My Itineraries</strong> to track and reschedule stops live on the ground.
                  </p>
                </div>
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/itinerary"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B84A27] hover:bg-[#9E3C1D] text-[#FFFDF9] font-heading text-xs font-extrabold tracking-wide rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>Open Itinerary Planner</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLoadDemoItinerary}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF0DF] hover:bg-[#F2D5A7] border border-[#DFCBB2] text-[#B84A27] font-heading text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load 3-Day Demo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Trip Selector & Dossier Header */}
                <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-xs space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0DF] text-[#B84A27] text-[10px] font-heading font-extrabold uppercase tracking-wide border border-[#F2D5A7]">
                          Active Trip Dossier
                        </span>
                        <span className="text-xs font-mono font-bold text-[#7A5C49]">
                          {currentItinerary?.itineraryId}
                        </span>
                        {currentItinerary?.paymentStatus === 'paid_verified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF0DF] text-[#9E5414] text-[10px] font-heading font-extrabold border border-[#F2D5A7]">
                            <ShieldCheck className="w-3 h-3 text-[#B84A27]" />
                            <span>Full Itinerary Pass Unlocked</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#7A5C49] text-[10px] font-heading font-bold border border-[#DFCBB2]">
                            📅 Scheduled &amp; Date-Locked
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] leading-tight">
                        {currentItinerary?.title}
                      </h2>

                      <div className="flex items-center gap-3 text-xs text-[#7A5C49] font-meta flex-wrap">
                        <span className="font-heading font-bold text-[#3B2316]">
                          🗓️ {currentItinerary?.formattedDateRange}
                        </span>
                        <span>·</span>
                        <span>{currentItinerary?.totalDays} Days</span>
                        <span>·</span>
                        <span className="font-mono font-bold text-[#B84A27]">
                          Est. Budget: ₹{currentItinerary?.totalBudgetInr?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Top Right Demo Helper Bar & Switcher */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
                      {/* 1-Tap Weather API Rain Alert Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          if (currentItinerary && currentDay) {
                            toggleSimulatedRainForStop(currentItinerary.itineraryId, currentDay.dayNumber);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#FAF0DF] hover:bg-[#F2D5A7] border border-[#F2D5A7] text-[#B84A27] text-xs font-heading font-extrabold uppercase tracking-wide transition flex items-center gap-2 cursor-pointer shadow-2xs"
                        title="Simulate Weather API precipitation alert for presentation demo"
                      >
                        <CloudRain className="w-4 h-4" />
                        <span>🌧️ Demo Rain Alert on Day {currentDay?.dayNumber}</span>
                      </button>

                      {currentItinerary && (
                        <button
                          type="button"
                          onClick={() => removeSavedItinerary(currentItinerary.itineraryId)}
                          className="p-2 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-rose-50 text-[#7A5C49] hover:text-rose-600 transition cursor-pointer"
                          title="Delete saved itinerary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Day Filter Pills */}
                  {currentItinerary && (
                    <div className="pt-2 border-t border-[#DFCBB2] flex items-center gap-2 overflow-x-auto pb-1">
                      {currentItinerary.days.map((d) => {
                        const isActive = d.dayNumber === activeDayNumber;
                        return (
                          <button
                            key={d.dayNumber}
                            type="button"
                            onClick={() => setActiveDayNumber(d.dayNumber)}
                            className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                              isActive
                                ? 'bg-[#B84A27] text-[#FFFDF9] border-[#9E3C1D] shadow-sm'
                                : 'bg-[#FFFDF9] text-[#3B2316] border-[#DFCBB2] hover:bg-[#FAF0DF]'
                            }`}
                          >
                            <span>Day {d.dayNumber}</span>
                            <span className={`text-[10px] font-mono ${isActive ? 'text-[#FAF0DF]' : 'text-[#A67B5B]'}`}>
                              {d.formattedDateLabel.split(',')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Date + Time Interval Stop Timeline for Active Day */}
                {currentDay && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono uppercase font-bold text-[#A67B5B] block">
                          DAY {currentDay.dayNumber} CHRONO-TIMELINE
                        </span>
                        <h3 className="text-lg font-heading font-black text-[#3B2316]">
                          {currentDay.formattedDateLabel} · {currentDay.themeTitle || `${currentDay.stops.length} Scheduled Stops`}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#B84A27]">
                        {currentDay.stops.length} Stops Active
                      </span>
                    </div>

                    <div className="space-y-4">
                      {currentDay.stops.map((stop, idx) => {
                        const weatherInfo = weatherStatuses[String(stop.stopId)];
                        const hasRain = weatherInfo?.hasRainAlert || Boolean(stop.disruptionState?.weatherAlertActive);
                        const isRescheduled = Boolean(stop.disruptionState?.previousStopTitle);

                        return (
                          <div
                            key={stop.stopId}
                            className="p-5 sm:p-6 rounded-3xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-xs space-y-4 relative overflow-hidden group hover:border-[#D47A39] transition-colors"
                          >
                            {/* Weather Alert Ribbon (When Rain Detected) */}
                            {hasRain && (
                              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FAF0DF] via-[#FCEBD2] to-[#FAF0DF] border border-[#F2D5A7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-fadeIn">
                                <div className="flex items-start gap-2.5">
                                  <CloudRain className="w-4 h-4 text-[#B84A27] shrink-0 mt-0.5 animate-bounce" />
                                  <div className="space-y-0.5">
                                    <span className="font-heading font-bold text-[#B84A27] uppercase tracking-wide block text-[11px]">
                                      🌧️ LOKIVA AUTO-WEATHER ALERT: Active Precipitation Forecasted
                                    </span>
                                    <p className="text-[#7A5C49] font-meta">
                                      Rain detected at {stop.title} during your <strong>{stop.startTime} - {stop.endTime}</strong> slot. Swap with an indoor craft guild below.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenRescheduleModal(stop, 'weather_rain')}
                                  className="px-3 py-1.5 rounded-xl bg-[#B84A27] hover:bg-[#9E3C1D] text-[#FFFDF9] text-[11px] font-heading font-extrabold uppercase tracking-wider transition cursor-pointer shadow-2xs shrink-0"
                                >
                                  <span>⚡ View Rain-Safe Replacements</span>
                                </button>
                              </div>
                            )}

                            {/* Rescheduled Provenance Badge (If Swapped) */}
                            {isRescheduled && (
                              <div className="p-2.5 rounded-xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-1.5 text-[#9E5414] font-meta text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />
                                  <span>
                                    ✓ Rescheduled from <strong>{stop.disruptionState?.previousStopTitle}</strong> (Reason: {stop.disruptionState?.reason === 'weather_rain' ? 'Rain Alert' : 'Venue Closed'}) · Slot <strong>{stop.startTime} - {stop.endTime}</strong> Preserved
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => currentItinerary && undoSwapStop(currentItinerary.itineraryId, currentDay.dayNumber, stop.stopId)}
                                  className="text-[10px] font-heading font-bold text-[#B84A27] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Undo Swap</span>
                                </button>
                              </div>
                            )}

                            {/* Main Card Body with Date & Time Interval Readouts */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                              {/* Left Media & Descriptions */}
                              <div className="flex items-start gap-4 flex-1">
                                <div className="w-10 h-10 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] text-[#B84A27] font-display font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                  {String(idx + 1).padStart(2, '0')}
                                </div>

                                {stop.image && (
                                  <img
                                    src={stop.image}
                                    alt={stop.title}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#DFCBB2] shrink-0 shadow-inner"
                                  />
                                )}

                                <div className="space-y-1.5 flex-1">
                                  {/* Date Pill + Time Interval Badge */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0DF] text-[#B84A27] text-[10px] font-heading font-extrabold uppercase tracking-wide border border-[#F2D5A7]">
                                      {stop.category}
                                    </span>

                                    <span className="inline-flex items-center gap-1 font-mono font-black text-xs text-[#3B2316] px-2 py-0.5 rounded-lg bg-[#FAF6F0] border border-[#EBE1D3]">
                                      <Clock className="w-3 h-3 text-[#B84A27]" />
                                      <span>{stop.startTime} - {stop.endTime}</span>
                                      <span className="text-[#A67B5B]">({stop.durationMinutes}m)</span>
                                    </span>

                                    {weatherInfo && !hasRain && (
                                      <span className="text-[10px] font-mono text-[#7A5C49]">
                                        ☀️ {weatherInfo.conditionLabel}
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-base sm:text-lg font-heading font-black text-[#3B2316] leading-snug">
                                    {stop.title}
                                  </h4>

                                  <div className="flex items-center gap-1.5 text-xs text-[#7A5C49] font-meta">
                                    <MapPin className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />
                                    <span>{stop.neighborhood}</span>
                                  </div>

                                  <p className="text-xs text-[#5C3D2E] font-meta line-clamp-2">
                                    {stop.description}
                                  </p>
                                </div>
                              </div>

                              {/* Right Pricing & Reschedule Action */}
                              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#DFCBB2]">
                                <div className="text-left md:text-right">
                                  <span className="text-[10px] font-mono text-[#A67B5B] uppercase block font-bold">
                                    Est. Access
                                  </span>
                                  <span className="font-mono font-black text-sm text-[#3B2316]">
                                    {stop.estAccessInr === 0 ? 'Free Open' : `₹${stop.estAccessInr.toLocaleString('en-IN')}`}
                                  </span>
                                </div>

                                {/* On-Ground Closed Temple/Shop Reschedule Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenRescheduleModal(stop, 'temple_or_shop_closed')}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF0DF] hover:bg-[#F2D5A7] border border-[#DFCBB2] hover:border-[#B84A27] text-[#B84A27] text-xs font-heading font-extrabold uppercase tracking-wide transition cursor-pointer shadow-2xs active:scale-[0.98]"
                                  title="Arrived and found the venue closed or crowded? Reschedule this exact slot"
                                >
                                  <Building className="w-3.5 h-3.5" />
                                  <span>🚪 Temple / Shop Closed? Reschedule Slot</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED PLACES & WISHLIST */}
        {activeTab === 'places' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-black text-[#3B2316]">
                Saved Places &amp; Heritage Masterclasses ({savedExperiences.length})
              </h2>
              <p className="text-xs text-[#7A5C49]">
                Individual cultural experiences saved from the 36 states explorer.
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-80 bg-[#FFFDF9] border border-[#DFCBB2] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : savedExperiences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedExperiences.map((exp) => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    isSaved={true}
                    onBookmarkChange={(nowSaved) => {
                      if (!nowSaved) {
                        handleRemoveFromSaved(exp.id);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#FFFDF9] rounded-3xl border border-[#DFCBB2] p-8 sm:p-12 space-y-4 max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF0DF] border border-[#DFCBB2] flex items-center justify-center mx-auto text-[#B84A27] shadow-2xs">
                  <Bookmark className="w-7 h-7 text-[#B84A27]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-display font-black text-[#3B2316]">No Saved Places Yet</h3>
                  <p className="text-xs sm:text-sm text-[#7A5C49] font-sans max-w-sm mx-auto leading-relaxed">
                    Explore authentic artisan workshops, generational guilds, and heritage trails, and tap the bookmark icon to save them.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] font-heading text-xs font-extrabold tracking-wide rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>Explore 36 States</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VERIFIED PASSES & GATE TICKETS */}
        {activeTab === 'passes' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-black text-[#3B2316]">
                Verified Passes &amp; Gate Receipts ({passes.length})
              </h2>
              <p className="text-xs text-[#7A5C49]">
                Official digital gate entries settled directly with local custodians.
              </p>
            </div>

            {passes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {passes.map((pass) => {
                  const paidDate = pass.paidAtIso
                    ? new Date(pass.paidAtIso).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Verified';

                  return (
                    <div
                      key={pass.passId}
                      className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-xs hover:border-[#B84A27] transition-all space-y-4 relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0DF] text-[#B84A27] text-[10px] font-heading font-extrabold uppercase tracking-wide border border-[#F2D5A7]">
                          {pass.purchaseType === 'full_itinerary' ? 'Circuit Pass' : 'Single Pass'}
                        </span>
                        <span className="text-[11px] font-mono text-[#7A5C49] font-bold">
                          {pass.receiptNumber}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-display font-black text-[#3B2316] leading-snug line-clamp-2">
                          {pass.title}
                        </h3>
                        <p className="text-xs text-[#7A5C49]">
                          Lead Traveler: <strong className="text-[#3B2316]">{pass.travelerName}</strong> ({pass.travelersCount} Admit)
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EBE1D3] flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#A67B5B] block font-bold">
                            Settled via Razorpay
                          </span>
                          <span className="font-display font-black text-sm text-[#B84A27]">
                            ₹{pass.totalPaidInr.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono uppercase text-[#A67B5B] block font-bold">
                            Issued On
                          </span>
                          <span className="font-mono text-xs font-bold text-[#3B2316]">
                            {paidDate}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#EBE1D3] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveViewingReceipt(pass)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:opacity-95 text-[#FFFDF9] text-xs font-heading font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View Pass &amp; QR</span>
                        </button>

                        <Link
                          to={`/verify-pass/${pass.passId}`}
                          className="p-2.5 rounded-xl border border-[#DFCBB2] bg-[#FAF6F0] hover:bg-[#FAF0DF] text-[#7A5C49] hover:text-[#B84A27] transition cursor-pointer shadow-2xs"
                          title="Simulate Public Gate Verification"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#FFFDF9] rounded-3xl border border-[#DFCBB2] p-8 sm:p-12 space-y-4 max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-center mx-auto text-[#B84A27] shadow-2xs">
                  <Ticket className="w-7 h-7 text-[#B84A27]" />
                </div>
                <h3 className="text-xl font-display font-black text-[#3B2316]">No Verified Passes Yet</h3>
                <p className="text-xs sm:text-sm text-[#7A5C49] font-sans max-w-sm mx-auto leading-relaxed">
                  Book passes on `/explore` or `/itinerary` to generate your perforated Cultural Passport receipt with gate entry QR codes.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* On-Ground Closed Temple / Shop Reschedule Modal */}
      {currentItinerary && currentDay && (
        <OnGroundRescheduleModal
          isOpen={Boolean(rescheduleModalStop)}
          onClose={() => setRescheduleModalStop(null)}
          city={currentItinerary.city}
          dayNumber={currentDay.dayNumber}
          stop={rescheduleModalStop}
          initialReason={rescheduleInitialReason}
          onSwapConfirmed={handleSwapConfirmed}
        />
      )}
    </div>
  );
}

export default SavedPage;
