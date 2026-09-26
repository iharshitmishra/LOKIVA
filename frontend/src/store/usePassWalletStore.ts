import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BookedStopPassItem {
  stopId: string | number;
  title: string;
  city: string;
  state?: string;
  category: string;
  dateLabel: string;
  slotWindow: string;
  durationMinutes: number;
  unitPriceInr: number;
  travelersCount: number;
  lineTotalInr: number;
  custodianName: string;
  imageUrl?: string;
}

export interface LokivaReceiptRecord {
  passId: string;
  receiptNumber: string;
  purchaseType: 'single_place' | 'full_itinerary';
  title: string;
  city: string;
  state?: string;
  travelerName: string;
  travelerEmail: string;
  travelerPhone?: string;
  travelersCount: number;
  items: BookedStopPassItem[];
  subtotalInr: number;
  bundleSavingsInr: number;
  taxesAndPreservationLevyInr: number;
  totalPaidInr: number;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  paidAtIso: string;
  verificationUrl: string;
  isCheckedIn?: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  stopCheckIns?: Record<string, { checkedInAt: string; checkedInBy?: string }>;
}

interface PassWalletState {
  passes: LokivaReceiptRecord[];
  activeViewingReceipt: LokivaReceiptRecord | null;
  addReceipt: (record: LokivaReceiptRecord) => void;
  getReceiptById: (passId: string) => LokivaReceiptRecord | undefined;
  isPlaceBooked: (stopIdOrTitle: string | number) => LokivaReceiptRecord | undefined;
  isFullItineraryBooked: (city: string, totalDays?: number) => LokivaReceiptRecord | undefined;
  setActiveViewingReceipt: (receipt: LokivaReceiptRecord | null) => void;
  markPassCheckedIn: (passId: string, stopId?: string | number, officerName?: string) => void;
  clearAllPasses: () => void;
}

export const usePassWalletStore = create<PassWalletState>()(
  persist(
    (set, get) => ({
      passes: [],
      activeViewingReceipt: null,

      addReceipt: (record: LokivaReceiptRecord) => {
        set((state) => {
          const filtered = state.passes.filter((p) => p.passId !== record.passId);
          return {
            passes: [record, ...filtered],
            activeViewingReceipt: record,
          };
        });
      },

      getReceiptById: (passId: string) => {
        return get().passes.find((p) => p.passId === passId);
      },

      isPlaceBooked: (stopIdOrTitle: string | number) => {
        if (!stopIdOrTitle) return undefined;
        const targetStr = String(stopIdOrTitle).toLowerCase().trim();
        const passes = get().passes;

        for (const pass of passes) {
          for (const item of pass.items) {
            const itemStopId = String(item.stopId).toLowerCase().trim();
            const itemTitle = (item.title || '').toLowerCase().trim();

            if (
              itemStopId === targetStr ||
              itemTitle === targetStr ||
              (targetStr.length > 5 && itemTitle.includes(targetStr)) ||
              (itemTitle.length > 5 && targetStr.includes(itemTitle))
            ) {
              return pass;
            }
          }
        }
        return undefined;
      },

      isFullItineraryBooked: (city: string, totalDays?: number) => {
        if (!city) return undefined;
        const normCity = city.toLowerCase().trim();
        return get().passes.find((pass) => {
          if (pass.purchaseType !== 'full_itinerary') return false;
          const passCity = (pass.city || '').toLowerCase().trim();
          return passCity.includes(normCity) || normCity.includes(passCity);
        });
      },

      setActiveViewingReceipt: (receipt: LokivaReceiptRecord | null) => {
        set({ activeViewingReceipt: receipt });
      },

      markPassCheckedIn: (passId: string, stopId?: string | number, officerName?: string) => {
        set((state) => {
          const nowIso = new Date().toISOString();
          const passes = state.passes.map((pass) => {
            if (pass.passId !== passId) return pass;

            if (stopId !== undefined) {
              const stopKey = String(stopId);
              const currentStops = pass.stopCheckIns || {};
              return {
                ...pass,
                stopCheckIns: {
                  ...currentStops,
                  [stopKey]: {
                    checkedInAt: nowIso,
                    checkedInBy: officerName || 'Verified Monument Custodian Gatekeeper',
                  },
                },
              };
            }

            return {
              ...pass,
              isCheckedIn: true,
              checkedInAt: nowIso,
              checkedInBy: officerName || 'Verified Monument Custodian Gatekeeper',
            };
          });

          const updatedViewing = state.activeViewingReceipt?.passId === passId
            ? passes.find((p) => p.passId === passId) || null
            : state.activeViewingReceipt;

          return { passes, activeViewingReceipt: updatedViewing };
        });
      },

      clearAllPasses: () => {
        set({ passes: [], activeViewingReceipt: null });
      },
    }),
    {
      name: 'lokiva_verified_passes_v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default usePassWalletStore;
