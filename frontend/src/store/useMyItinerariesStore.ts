import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DisruptionReason,
  IntervalReplacementCandidate,
} from '../services/rescheduleEngineHooks';

export interface SavedItineraryStop {
  stopId: string | number;
  title: string;
  category: string;
  neighborhood: string;
  location?: string;
  description: string;
  image?: string;
  estAccessInr: number;
  dateIso: string;
  formattedDateLabel: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  transitToNextLabel?: string;
  transitToNextCostInr?: number;
  disruptionState?: {
    reason: DisruptionReason;
    previousStopTitle?: string;
    swappedAtIso?: string;
    weatherAlertActive?: boolean;
    originalStop?: Partial<SavedItineraryStop>;
  };
}

export interface SavedItineraryDay {
  dayNumber: number;
  dateIso: string;
  formattedDateLabel: string;
  themeTitle?: string;
  stops: SavedItineraryStop[];
}

export interface SavedItineraryRecord {
  itineraryId: string;
  title: string;
  city: string;
  state?: string;
  startDateIso: string;
  endDateIso: string;
  formattedDateRange: string;
  totalDays: number;
  totalBudgetInr: number;
  paymentStatus: 'saved_unpaid' | 'paid_verified';
  passId?: string;
  createdAtIso: string;
  days: SavedItineraryDay[];
}

export interface SaveItineraryPayload {
  title: string;
  city: string;
  state?: string;
  startDateIso: string;
  totalBudgetInr: number;
  days: Array<{
    dayNumber: number;
    themeTitle?: string;
    activities: Array<{
      id: string | number;
      title: string;
      category: string;
      location?: string;
      description?: string;
      photos?: string[];
      costPerPerson?: number;
      startTime?: string;
      endTime?: string;
      visitDurationMinutes?: number;
      durationMins?: number;
      transitToNext?: {
        mode?: string;
        durationMinutes?: number;
        costInr?: number;
      };
    }>;
  }>;
}

interface MyItinerariesState {
  itineraries: SavedItineraryRecord[];
  activeItineraryId: string | null;
  saveItineraryWithDate: (payload: SaveItineraryPayload) => string;
  swapStopForTimeInterval: (
    itineraryId: string,
    dayNumber: number,
    stopId: string | number,
    replacement: IntervalReplacementCandidate,
    reason: DisruptionReason
  ) => void;
  undoSwapStop: (itineraryId: string, dayNumber: number, stopId: string | number) => void;
  toggleSimulatedRainForStop: (
    itineraryId: string,
    dayNumber: number,
    stopId?: string | number
  ) => void;
  removeSavedItinerary: (itineraryId: string) => void;
  getItinerary: (itineraryId: string) => SavedItineraryRecord | undefined;
  setActiveItineraryId: (id: string | null) => void;
  updateItineraryPaymentStatus: (itineraryId: string, passId?: string) => void;
  clearAllItineraries: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function addDays(startDateStr: string, daysToAdd: number): { dateIso: string; formatted: string } {
  const date = new Date(startDateStr);
  date.setDate(date.getDate() + daysToAdd);
  const dateIso = date.toISOString().split('T')[0];
  return { dateIso, formatted: formatDate(date) };
}

export const useMyItinerariesStore = create<MyItinerariesState>()(
  persist(
    (set, get) => ({
      itineraries: [],
      activeItineraryId: null,

      saveItineraryWithDate: (payload: SaveItineraryPayload): string => {
        const itineraryId = `LKV-ITIN-${Date.now().toString(36).toUpperCase()}`;
        const totalDays = payload.days.length || 1;
        const startInfo = addDays(payload.startDateIso, 0);
        const endInfo = addDays(payload.startDateIso, Math.max(0, totalDays - 1));

        const structuredDays: SavedItineraryDay[] = payload.days.map((d, dayIdx) => {
          const dayDate = addDays(payload.startDateIso, dayIdx);

          const structuredStops: SavedItineraryStop[] = (d.activities || []).map((act, actIdx) => {
            const startHour = 8 + Math.floor(actIdx * 2.5);
            const startMin = actIdx % 2 === 0 ? '00' : '30';
            const defaultStart = `${String(startHour).padStart(2, '0')}:${startMin} AM`;
            const duration = act.visitDurationMinutes || act.durationMins || 90;

            return {
              stopId: act.id,
              title: act.title,
              category: act.category || 'Heritage Landmark',
              neighborhood: act.location || `${payload.city} Heritage Precinct`,
              location: act.location,
              description: act.description || `Signature cultural stop in ${payload.city}.`,
              image: act.photos?.[0],
              estAccessInr: act.costPerPerson || 0,
              dateIso: dayDate.dateIso,
              formattedDateLabel: dayDate.formatted,
              startTime: act.startTime || defaultStart,
              endTime: act.endTime || '11:30 AM',
              durationMinutes: duration,
              transitToNextLabel: act.transitToNext?.mode
                ? `${act.transitToNext.durationMinutes || 15}m by ${act.transitToNext.mode}`
                : undefined,
              transitToNextCostInr: act.transitToNext?.costInr,
            };
          });

          return {
            dayNumber: d.dayNumber,
            dateIso: dayDate.dateIso,
            formattedDateLabel: dayDate.formatted,
            themeTitle: d.themeTitle,
            stops: structuredStops,
          };
        });

        const newRecord: SavedItineraryRecord = {
          itineraryId,
          title: payload.title || `${totalDays}-Day ${payload.city} Cultural Itinerary`,
          city: payload.city,
          state: payload.state,
          startDateIso: startInfo.dateIso,
          endDateIso: endInfo.dateIso,
          formattedDateRange: `${startInfo.formatted} - ${endInfo.formatted}`,
          totalDays,
          totalBudgetInr: payload.totalBudgetInr,
          paymentStatus: 'saved_unpaid',
          createdAtIso: new Date().toISOString(),
          days: structuredDays,
        };

        set((state) => ({
          itineraries: [newRecord, ...state.itineraries.filter((it) => it.itineraryId !== itineraryId)],
          activeItineraryId: itineraryId,
        }));

        return itineraryId;
      },

      swapStopForTimeInterval: (
        itineraryId: string,
        dayNumber: number,
        stopId: string | number,
        replacement: IntervalReplacementCandidate,
        reason: DisruptionReason
      ) => {
        set((state) => {
          const updated = state.itineraries.map((itin) => {
            if (itin.itineraryId !== itineraryId) return itin;

            const updatedDays = itin.days.map((day) => {
              if (day.dayNumber !== dayNumber) return day;

              const updatedStops = day.stops.map((stop) => {
                if (String(stop.stopId) !== String(stopId)) return stop;

                const originalStopSnapshot: Partial<SavedItineraryStop> = {
                  stopId: stop.stopId,
                  title: stop.title,
                  category: stop.category,
                  description: stop.description,
                  image: stop.image,
                  estAccessInr: stop.estAccessInr,
                  neighborhood: stop.neighborhood,
                };

                return {
                  ...stop,
                  stopId: replacement.id,
                  title: replacement.title,
                  category: replacement.category,
                  neighborhood: replacement.neighborhood,
                  description: `${replacement.whyItFitsInterval} ${replacement.openStatusLabel}.`,
                  image: replacement.image,
                  estAccessInr: replacement.estAccessInr,
                  disruptionState: {
                    reason,
                    previousStopTitle: stop.title,
                    swappedAtIso: new Date().toISOString(),
                    weatherAlertActive: false,
                    originalStop: originalStopSnapshot,
                  },
                };
              });

              return { ...day, stops: updatedStops };
            });

            return { ...itin, days: updatedDays };
          });

          return { itineraries: updated };
        });
      },

      undoSwapStop: (itineraryId: string, dayNumber: number, stopId: string | number) => {
        set((state) => {
          const updated = state.itineraries.map((itin) => {
            if (itin.itineraryId !== itineraryId) return itin;

            const updatedDays = itin.days.map((day) => {
              if (day.dayNumber !== dayNumber) return day;

              const updatedStops = day.stops.map((stop) => {
                if (String(stop.stopId) !== String(stopId)) return stop;
                if (!stop.disruptionState?.originalStop) return stop;

                const orig = stop.disruptionState.originalStop;
                return {
                  ...stop,
                  stopId: orig.stopId || stop.stopId,
                  title: orig.title || stop.title,
                  category: orig.category || stop.category,
                  neighborhood: orig.neighborhood || stop.neighborhood,
                  description: orig.description || stop.description,
                  image: orig.image || stop.image,
                  estAccessInr: orig.estAccessInr !== undefined ? orig.estAccessInr : stop.estAccessInr,
                  disruptionState: undefined,
                };
              });

              return { ...day, stops: updatedStops };
            });

            return { ...itin, days: updatedDays };
          });

          return { itineraries: updated };
        });
      },

      toggleSimulatedRainForStop: (
        itineraryId: string,
        dayNumber: number,
        stopId?: string | number
      ) => {
        set((state) => {
          const updated = state.itineraries.map((itin) => {
            if (itin.itineraryId !== itineraryId) return itin;

            const updatedDays = itin.days.map((day) => {
              if (day.dayNumber !== dayNumber) return day;

              const updatedStops = day.stops.map((stop, idx) => {
                if (stopId !== undefined && String(stop.stopId) !== String(stopId)) {
                  return stop;
                }
                // If stopId not provided, toggle first 2 stops of day
                if (stopId === undefined && idx > 1) {
                  return stop;
                }

                const currentRain = stop.disruptionState?.weatherAlertActive;
                return {
                  ...stop,
                  disruptionState: {
                    reason: 'weather_rain' as DisruptionReason,
                    weatherAlertActive: !currentRain,
                    previousStopTitle: stop.disruptionState?.previousStopTitle,
                    originalStop: stop.disruptionState?.originalStop,
                  },
                };
              });

              return { ...day, stops: updatedStops };
            });

            return { ...itin, days: updatedDays };
          });

          return { itineraries: updated };
        });
      },

      removeSavedItinerary: (itineraryId: string) => {
        set((state) => ({
          itineraries: state.itineraries.filter((it) => it.itineraryId !== itineraryId),
          activeItineraryId:
            state.activeItineraryId === itineraryId ? null : state.activeItineraryId,
        }));
      },

      getItinerary: (itineraryId: string) => {
        return get().itineraries.find((it) => it.itineraryId === itineraryId);
      },

      setActiveItineraryId: (id: string | null) => {
        set({ activeItineraryId: id });
      },

      updateItineraryPaymentStatus: (itineraryId: string, passId?: string) => {
        set((state) => ({
          itineraries: state.itineraries.map((it) =>
            it.itineraryId === itineraryId
              ? { ...it, paymentStatus: 'paid_verified', passId: passId || it.passId }
              : it
          ),
        }));
      },

      clearAllItineraries: () => {
        set({ itineraries: [], activeItineraryId: null });
      },
    }),
    {
      name: 'lokiva_my_itineraries_v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useMyItinerariesStore;
