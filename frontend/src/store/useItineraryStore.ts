import { create } from 'zustand';
import {
  ItineraryTripDetails,
  ItineraryDay,
  ItineraryActivity,
  ItineraryPracticalInfo,
  ItineraryViewMode,
  DayFeasibilityMetrics,
  ReplanCondition,
} from '../types/itinerary';
import {
  generateDynamicTripPlan,
  recalculateDaySchedule,
  replanDayForCondition,
  GenerateTripOptions,
} from '../lib/itinerarySolver';

const STORAGE_KEY = 'lokiva_dynamic_itinerary_store_v3';

interface ItineraryState {
  tripDetails: ItineraryTripDetails;
  days: ItineraryDay[];
  selectedDay: number;
  activeStopId: number | null;
  hoveredStopId: number | null;
  viewMode: ItineraryViewMode;
  feasibilityMetrics: Record<number, DayFeasibilityMetrics>;
  practicalInfo: ItineraryPracticalInfo;
  isGenerating: boolean;
  lastReplanMessage: string | null;

  // Actions
  setSelectedDay: (dayNumber: number) => void;
  setActiveStopId: (id: number | null) => void;
  setHoveredStopId: (id: number | null) => void;
  setViewMode: (mode: ItineraryViewMode) => void;
  reorderActivity: (dayNumber: number, fromIndex: number, toIndex: number) => void;
  deleteActivity: (dayNumber: number, activityId: number) => void;
  addActivity: (dayNumber: number, activity: ItineraryActivity, afterIndex?: number) => void;
  updateActivity: (dayNumber: number, activityId: number, patch: Partial<ItineraryActivity>) => void;
  setDayStartTime: (dayNumber: number, startTime: string) => void;
  replanDay: (dayNumber: number, condition: ReplanCondition) => void;
  generateTrip: (options: GenerateTripOptions) => Promise<void>;
  clearReplanMessage: () => void;
}

async function buildFreshTrip(city: string = 'Jaipur', daysCount: number = 3) {
  const plan = await generateDynamicTripPlan({
    city,
    state: 'Rajasthan',
    daysCount,
    pace: 'balanced',
    travelers: 2,
    budgetLimit: 25000,
  });

  const metricsMap: Record<number, DayFeasibilityMetrics> = {};
  plan.days.forEach((d) => {
    const { metrics } = recalculateDaySchedule(d, 2);
    metricsMap[d.dayNumber] = metrics;
  });

  return {
    tripDetails: plan.tripDetails,
    days: plan.days,
    selectedDay: 1,
    activeStopId: null,
    hoveredStopId: null,
    viewMode: 'timeline' as ItineraryViewMode,
    feasibilityMetrics: metricsMap,
    practicalInfo: plan.practicalInfo,
    isGenerating: false,
    lastReplanMessage: null,
  };
}

function createInitialState(): any {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
        const metricsMap: Record<number, DayFeasibilityMetrics> = parsed.feasibilityMetrics || {};

        parsed.days.forEach((d: ItineraryDay) => {
          if (!metricsMap[d.dayNumber]) {
            const { metrics } = recalculateDaySchedule(d, parsed.tripDetails?.travelers || 2);
            metricsMap[d.dayNumber] = metrics;
          }
        });

        return {
          ...parsed,
          feasibilityMetrics: metricsMap,
        };
      }
    }
  } catch {
    // fallback
  }
  // Return minimal default state; buildFreshTrip will be called async
  return {
    tripDetails: null,
    days: [],
    selectedDay: 1,
    activeStopId: null,
    hoveredStopId: null,
    viewMode: 'timeline' as ItineraryViewMode,
    feasibilityMetrics: {},
    practicalInfo: null,
    isGenerating: false,
    lastReplanMessage: null,
  };
}

const initialState = createInitialState();

// Async: load fresh trip data after store initialization
// This handles the async weather-aware trip generation
setTimeout(async () => {
  try {
    const state = useItineraryStore.getState();
    if (!state.tripDetails || state.days.length === 0) {
      const fresh = await buildFreshTrip('Jaipur', 3);
      const metricsMap: Record<number, DayFeasibilityMetrics> = {};
      fresh.days.forEach((d) => {
        const { metrics } = recalculateDaySchedule(d, 2);
        metricsMap[d.dayNumber] = metrics;
      });
      useItineraryStore.setState({
        tripDetails: fresh.tripDetails,
        days: fresh.days,
        feasibilityMetrics: metricsMap,
        practicalInfo: fresh.practicalInfo,
      });
    }
  } catch (err) {
    console.warn('[ItineraryStore] Failed to load fresh trip:', err);
  }
}, 100);

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  ...initialState,

  setSelectedDay: (dayNumber: number) => {
    set({ selectedDay: dayNumber, activeStopId: null, hoveredStopId: null });
  },

  setActiveStopId: (id: number | null) => {
    set({ activeStopId: id });
  },

  setHoveredStopId: (id: number | null) => {
    set({ hoveredStopId: id });
  },

  setViewMode: (mode: ItineraryViewMode) => {
    set({ viewMode: mode });
  },

  reorderActivity: (dayNumber: number, fromIndex: number, toIndex: number) => {
    const { days, tripDetails, feasibilityMetrics } = get();
    const dayIndex = days.findIndex((d) => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;

    const currentDay = days[dayIndex];
    const activities = [...currentDay.activities];
    if (
      fromIndex < 0 ||
      fromIndex >= activities.length ||
      toIndex < 0 ||
      toIndex >= activities.length
    ) {
      return;
    }

    const [moved] = activities.splice(fromIndex, 1);
    activities.splice(toIndex, 0, moved);

    const { day: updatedDay, metrics } = recalculateDaySchedule(
      { ...currentDay, activities },
      tripDetails.travelers || 2
    );

    const newDays = [...days];
    newDays[dayIndex] = updatedDay;

    const newMetrics = {
      ...feasibilityMetrics,
      [dayNumber]: metrics,
    };

    set({ days: newDays, feasibilityMetrics: newMetrics });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tripDetails,
          days: newDays,
          feasibilityMetrics: newMetrics,
          practicalInfo: get().practicalInfo,
        })
      );
    } catch {
      // ignore
    }
  },

  deleteActivity: (dayNumber: number, activityId: number) => {
    const { days, tripDetails, feasibilityMetrics } = get();
    const dayIndex = days.findIndex((d) => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;

    const currentDay = days[dayIndex];
    const activities = currentDay.activities.filter((a) => a.id !== activityId);

    const { day: updatedDay, metrics } = recalculateDaySchedule(
      { ...currentDay, activities },
      tripDetails.travelers || 2
    );

    const newDays = [...days];
    newDays[dayIndex] = updatedDay;

    const newMetrics = {
      ...feasibilityMetrics,
      [dayNumber]: metrics,
    };

    set({ days: newDays, feasibilityMetrics: newMetrics });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tripDetails,
          days: newDays,
          feasibilityMetrics: newMetrics,
          practicalInfo: get().practicalInfo,
        })
      );
    } catch {
      // ignore
    }
  },

  addActivity: (dayNumber: number, activity: ItineraryActivity, afterIndex?: number) => {
    const { days, tripDetails, feasibilityMetrics } = get();
    const dayIndex = days.findIndex((d) => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;

    const currentDay = days[dayIndex];
    const activities = [...currentDay.activities];

    if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < activities.length) {
      activities.splice(afterIndex + 1, 0, activity);
    } else {
      activities.push(activity);
    }

    const { day: updatedDay, metrics } = recalculateDaySchedule(
      { ...currentDay, activities },
      tripDetails.travelers || 2
    );

    const newDays = [...days];
    newDays[dayIndex] = updatedDay;

    const newMetrics = {
      ...feasibilityMetrics,
      [dayNumber]: metrics,
    };

    set({ days: newDays, feasibilityMetrics: newMetrics, activeStopId: activity.id });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tripDetails,
          days: newDays,
          feasibilityMetrics: newMetrics,
          practicalInfo: get().practicalInfo,
        })
      );
    } catch {
      // ignore
    }
  },

  updateActivity: (dayNumber: number, activityId: number, patch: Partial<ItineraryActivity>) => {
    const { days, tripDetails, feasibilityMetrics } = get();
    const dayIndex = days.findIndex((d) => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;

    const currentDay = days[dayIndex];
    const activities = currentDay.activities.map((a) =>
      a.id === activityId ? { ...a, ...patch } : a
    );

    const { day: updatedDay, metrics } = recalculateDaySchedule(
      { ...currentDay, activities },
      tripDetails.travelers || 2
    );

    const newDays = [...days];
    newDays[dayIndex] = updatedDay;

    const newMetrics = {
      ...feasibilityMetrics,
      [dayNumber]: metrics,
    };

    set({ days: newDays, feasibilityMetrics: newMetrics });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tripDetails,
          days: newDays,
          feasibilityMetrics: newMetrics,
          practicalInfo: get().practicalInfo,
        })
      );
    } catch {
      // ignore
    }
  },

  setDayStartTime: (dayNumber: number, startTime: string) => {
    const { days, tripDetails, feasibilityMetrics } = get();
    const dayIndex = days.findIndex((d) => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;

    const currentDay = days[dayIndex];
    const { day: updatedDay, metrics } = recalculateDaySchedule(
      { ...currentDay, dayStartTime: startTime },
      tripDetails.travelers || 2
    );

    const newDays = [...days];
    newDays[dayIndex] = updatedDay;

    const newMetrics = {
      ...feasibilityMetrics,
      [dayNumber]: metrics,
    };

    set({ days: newDays, feasibilityMetrics: newMetrics });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tripDetails,
          days: newDays,
          feasibilityMetrics: newMetrics,
          practicalInfo: get().practicalInfo,
        })
      );
    } catch {
      // ignore
    }
  },

  replanDay: (dayNumber: number, condition: ReplanCondition) => {
    const { days, tripDetails, feasibilityMetrics } = get();
    const dayIndex = days.findIndex((d) => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;

    const currentDay = days[dayIndex];
    const { day: replannedDay, metrics, message } = replanDayForCondition(
      currentDay,
      condition,
      tripDetails.travelers || 2
    );

    const newDays = [...days];
    newDays[dayIndex] = replannedDay;

    const newMetrics = {
      ...feasibilityMetrics,
      [dayNumber]: metrics,
    };

    set({
      days: newDays,
      feasibilityMetrics: newMetrics,
      lastReplanMessage: message,
    });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tripDetails,
          days: newDays,
          feasibilityMetrics: newMetrics,
          practicalInfo: get().practicalInfo,
        })
      );
    } catch {
      // ignore
    }
  },

  generateTrip: async (options: GenerateTripOptions) => {
    set({ isGenerating: true });
    try {
      const plan = await generateDynamicTripPlan(options);
      const metricsMap: Record<number, DayFeasibilityMetrics> = {};
      plan.days.forEach((d) => {
        const { metrics } = recalculateDaySchedule(d, options.travelers || 2);
        metricsMap[d.dayNumber] = metrics;
      });

      set({
        tripDetails: plan.tripDetails,
        days: plan.days,
        selectedDay: 1,
        activeStopId: null,
        hoveredStopId: null,
        feasibilityMetrics: metricsMap,
        practicalInfo: plan.practicalInfo,
        isGenerating: false,
        lastReplanMessage: `Generated conflict-free ${options.daysCount || 3}-Day itinerary for ${options.city}.`,
      });

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            tripDetails: plan.tripDetails,
            days: plan.days,
            feasibilityMetrics: metricsMap,
            practicalInfo: plan.practicalInfo,
          })
        );
      } catch {
        // ignore
      }
    } finally {
      set({ isGenerating: false });
    }
  },

  clearReplanMessage: () => {
    set({ lastReplanMessage: null });
  },
}));
