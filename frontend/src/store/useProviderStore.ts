import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WorkshopSlot,
  NearbyTravelerCluster,
  ProviderBookingRecord,
  ProviderListing,
  ProviderGuildProfile,
  FlashBeaconBroadcastEvent,
} from '../types/provider';

const DEFAULT_PROFILE: ProviderGuildProfile = {
  guildName: 'Kutch Rogan Art & Handloom Collective',
  craftSpecialty: 'Generational Rogan Fabric Painting & Natural Dyeing',
  city: 'Mumbai',
  precinct: 'Bandra West / Kala Ghoda',
  generationalHeritage: '300+ Year Family Atelier (8th Generation)',
  isStepFreeAccessible: true,
  contactEmail: 'kutch.rogan@lokiva.in',
  contactPhone: '+91 98201 44521',
  isKycVerified: true,
  settlementAccount: 'HDFC Bank · IFSC: HDFC0001842 · A/C Ending in 8842',
  avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
  bio: 'Living master artisans practicing rare boiled castor oil Rogan art, natural indigo block printing, and heritage hearth hospitality in Mumbai and Kutch.',
};

const DEFAULT_LISTINGS: ProviderListing[] = [
  {
    id: 'exp-rogan-1',
    title: 'Master Rogan Fabric Painting & Castor Pigment Masterclass',
    category: 'Handloom & Textiles',
    city: 'Mumbai',
    precinct: 'Bandra West',
    pricePerPerson: 1200,
    durationHours: 1.5,
    maxGroupSize: 8,
    rating: 4.98,
    reviewCount: 28,
    coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    isStepFreeAccessible: true,
    craftHeritage: 'Nirona Kutch Rogan Lineage',
    description: 'Learn the ancient art of painting textiles using stylus needles and castor oil paste dyed with natural mineral earths.',
    tags: ['Hands-on', 'Artisan Guild', 'Step-Free', 'Masterclass'],
  },
  {
    id: 'exp-indigo-2',
    title: 'Natural Indigo Vat Dyeing & Hand-Block Print Studio',
    category: 'Handloom & Textiles',
    city: 'Mumbai',
    precinct: 'Kala Ghoda',
    pricePerPerson: 1500,
    durationHours: 2.0,
    maxGroupSize: 6,
    rating: 4.95,
    reviewCount: 19,
    coverImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80',
    isStepFreeAccessible: true,
    craftHeritage: 'Kachchh Organic Indigo Vat Guild',
    description: 'Dip pure organic cotton scarves into living fermented indigo vats and hand-block traditional geometric motifs.',
    tags: ['Eco-Dyeing', 'Take Home Scarf', 'Family Friendly'],
  },
  {
    id: 'exp-dhokra-3',
    title: 'Generational Lost-Wax Bell Metal & Dhokra Sculpture Walk',
    category: 'Pottery & Metallurgy',
    city: 'Mumbai',
    precinct: 'Colaba Heritage Quarter',
    pricePerPerson: 1800,
    durationHours: 2.5,
    maxGroupSize: 8,
    rating: 4.99,
    reviewCount: 34,
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    isStepFreeAccessible: false,
    craftHeritage: 'Bastar Bell Metal Masters',
    description: 'Sculpt beeswax models, encase in alluvial clay, and pour molten brass in a live generational artisan forge.',
    tags: ['Live Forge', 'Ancient Technique', 'Sculpture'],
  },
];

const DEFAULT_SLOTS: WorkshopSlot[] = [
  {
    slotId: 'slot-today-5pm',
    listingId: 'exp-rogan-1',
    listingTitle: 'Master Rogan Fabric Painting & Castor Pigment Masterclass',
    timeLabel: 'Today · 05:00 PM - 06:30 PM',
    totalCapacity: 8,
    bookedSeats: 4, // 4 empty spots ready for Flash Beacon!
    basePricePerPerson: 1200,
    flashBeacon: undefined,
  },
  {
    slotId: 'slot-today-2pm',
    listingId: 'exp-indigo-2',
    listingTitle: 'Natural Indigo Vat Dyeing & Hand-Block Print Studio',
    timeLabel: 'Today · 02:00 PM - 03:30 PM',
    totalCapacity: 6,
    bookedSeats: 6, // Sold out!
    basePricePerPerson: 1500,
    flashBeacon: undefined,
  },
  {
    slotId: 'slot-tomorrow-10am',
    listingId: 'exp-dhokra-3',
    listingTitle: 'Generational Lost-Wax Bell Metal & Dhokra Sculpture Walk',
    timeLabel: 'Tomorrow · 10:30 AM - 12:00 PM',
    totalCapacity: 8,
    bookedSeats: 3, // 5 empty spots
    basePricePerPerson: 1800,
    flashBeacon: undefined,
  },
  {
    slotId: 'slot-tomorrow-4pm',
    listingId: 'exp-rogan-1',
    listingTitle: 'Master Rogan Fabric Painting & Castor Pigment Masterclass',
    timeLabel: 'Tomorrow · 04:00 PM - 05:30 PM',
    totalCapacity: 8,
    bookedSeats: 2, // 6 empty spots
    basePricePerPerson: 1200,
    flashBeacon: undefined,
  },
];

const DEFAULT_CLUSTERS: NearbyTravelerCluster[] = [
  {
    clusterId: 'cluster-1',
    label: '3 Families Near Bandra West',
    partySize: 4,
    distanceKm: 1.4,
    budgetPerPerson: 900,
    matchedInterests: ['Craft Workshop', 'Textiles', 'Family Activity'],
    accessibilityNeed: 'Step-Free / Stroller Friendly',
    pingedWithBeacon: false,
  },
  {
    clusterId: 'cluster-2',
    label: 'Solo Cultural Explorers in Bandra / Khar',
    partySize: 2,
    distanceKm: 2.2,
    budgetPerPerson: 1100,
    matchedInterests: ['Rogan Art', 'Heritage Guild', 'Painting'],
    accessibilityNeed: 'Low Walking Pace',
    pingedWithBeacon: false,
  },
  {
    clusterId: 'cluster-3',
    label: 'Architecture & Design Delegation from Fort',
    partySize: 3,
    distanceKm: 4.8,
    budgetPerPerson: 1400,
    matchedInterests: ['Traditional Metallurgy', 'Pigment Craft', 'Masterclass'],
    accessibilityNeed: undefined,
    pingedWithBeacon: false,
  },
  {
    clusterId: 'cluster-4',
    label: 'Weekend Cultural Tourists near Sea Link',
    partySize: 4,
    distanceKm: 3.1,
    budgetPerPerson: 850,
    matchedInterests: ['Indigo Dyeing', 'Folk Art', 'Gastronomy'],
    accessibilityNeed: 'Wheelchair Accessible',
    pingedWithBeacon: false,
  },
];

const DEFAULT_BOOKINGS: ProviderBookingRecord[] = [
  {
    bookingId: 'BK-8901',
    travelerName: 'Aarav & Priya Sharma (2 pax)',
    partySize: 2,
    slotTime: 'Today · 02:00 PM - 03:30 PM',
    listingTitle: 'Natural Indigo Vat Dyeing & Hand-Block Print Studio',
    amountPaid: 3000,
    bookedViaFlashBeacon: false,
    status: 'checked_in',
    timestamp: '2 hours ago',
    guestEmail: 'priya.sharma@gmail.com',
    guestPhone: '+91 98202 11993',
  },
  {
    bookingId: 'BK-8894',
    travelerName: 'Elena Rostova (1 pax)',
    partySize: 1,
    slotTime: 'Today · 02:00 PM - 03:30 PM',
    listingTitle: 'Natural Indigo Vat Dyeing & Hand-Block Print Studio',
    amountPaid: 1500,
    bookedViaFlashBeacon: false,
    status: 'checked_in',
    timestamp: '3 hours ago',
    guestEmail: 'elena.rostova@traveler.eu',
  },
  {
    bookingId: 'BK-8872',
    travelerName: 'Vikram, Ananya & Kabir (3 pax)',
    partySize: 3,
    slotTime: 'Today · 02:00 PM - 03:30 PM',
    listingTitle: 'Natural Indigo Vat Dyeing & Hand-Block Print Studio',
    amountPaid: 4500,
    bookedViaFlashBeacon: false,
    status: 'checked_in',
    timestamp: '5 hours ago',
    guestEmail: 'vikram.sen@outlook.com',
  },
  {
    bookingId: 'BK-8850',
    travelerName: 'Maya Deshmukh & Arjun (2 pax)',
    partySize: 2,
    slotTime: 'Today · 05:00 PM - 06:30 PM',
    listingTitle: 'Master Rogan Fabric Painting & Castor Pigment Masterclass',
    amountPaid: 2400,
    bookedViaFlashBeacon: false,
    status: 'confirmed',
    timestamp: 'Yesterday',
    guestEmail: 'maya.d@gmail.com',
  },
  {
    bookingId: 'BK-8841',
    travelerName: 'Rohan Gupta & Neha (2 pax)',
    partySize: 2,
    slotTime: 'Today · 05:00 PM - 06:30 PM',
    listingTitle: 'Master Rogan Fabric Painting & Castor Pigment Masterclass',
    amountPaid: 2400,
    bookedViaFlashBeacon: false,
    status: 'confirmed',
    timestamp: 'Yesterday',
    guestEmail: 'rohan.g@gmail.com',
  },
  {
    bookingId: 'BK-8799',
    travelerName: 'Sophie Moreau (3 pax)',
    partySize: 3,
    slotTime: 'Tomorrow · 10:30 AM - 12:00 PM',
    listingTitle: 'Generational Lost-Wax Bell Metal & Dhokra Sculpture Walk',
    amountPaid: 5400,
    bookedViaFlashBeacon: false,
    status: 'confirmed',
    timestamp: '2 days ago',
    guestEmail: 'sophie.m@paris-design.fr',
  },
];

interface ProviderStoreState {
  profile: ProviderGuildProfile;
  slots: WorkshopSlot[];
  clusters: NearbyTravelerCluster[];
  bookings: ProviderBookingRecord[];
  listings: ProviderListing[];
  recentFeedEvents: Array<{ id: string; title: string; subtitle: string; time: string; type: 'beacon' | 'booking' | 'system' }>;
  
  // Actions
  activateFlashBeacon: (slotId: string, discountPercent: number, durationMinutes: number, radiusKm: number) => void;
  cancelFlashBeacon: (slotId: string) => void;
  pingNearbyCluster: (clusterId: string, slotId: string) => void;
  simulateIncomingClaim: (slotId: string, customName?: string, customPartySize?: number) => void;
  updateSlotCapacityOrBookings: (slotId: string, newBookedSeats: number, newTotalCapacity: number, newBasePrice: number) => void;
  addWorkshopSlot: (slot: Omit<WorkshopSlot, 'slotId'>) => void;
  deleteWorkshopSlot: (slotId: string) => void;
  createOrUpdateListing: (listingData: Partial<ProviderListing> & { title: string }) => void;
  updateGuildProfile: (data: Partial<ProviderGuildProfile>) => void;
  initializeProviderSession: (params: {
    guildName: string;
    craftSpecialty: string;
    city: string;
    precinct: string;
    heritage: string;
    isAccessible: boolean;
    email: string;
    phone?: string;
  }) => void;
  resetToDefaultData: () => void;

  // Computed metric getters
  getTotalRevenue: () => number;
  getVerifiedBookingsCount: () => number;
  getAudienceReach: () => number;
  getCommunityRating: () => number;
  getReviewCount: () => number;
}

let providerBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    providerBroadcastChannel = new BroadcastChannel('lokiva_provider_sync');
  } catch (err) {
    console.warn('BroadcastChannel not supported in this environment', err);
  }
}

export const useProviderStore = create<ProviderStoreState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      slots: DEFAULT_SLOTS,
      clusters: DEFAULT_CLUSTERS,
      bookings: DEFAULT_BOOKINGS,
      listings: DEFAULT_LISTINGS,
      recentFeedEvents: [
        {
          id: 'ev-1',
          title: 'System Verified KYC Level 2',
          subtitle: 'Direct payouts enabled with 0% platform commissions',
          time: 'Active',
          type: 'system',
        },
        {
          id: 'ev-2',
          title: 'Aarav & Priya Sharma checked in',
          subtitle: 'Natural Indigo Vat Dyeing & Hand-Block Print Studio',
          time: '2 hours ago',
          type: 'booking',
        },
      ],

      activateFlashBeacon: (slotId, discountPercent, durationMinutes, radiusKm) => {
        const slots = get().slots;
        const targetSlot = slots.find((s) => s.slotId === slotId);
        if (!targetSlot) return;

        const discountedPrice = Math.round(targetSlot.basePricePerPerson * (1 - discountPercent / 100));
        const expiresAt = Date.now() + durationMinutes * 60 * 1000;
        const emptySpots = Math.max(0, targetSlot.totalCapacity - targetSlot.bookedSeats);
        const estimatedReach = Math.min(32, Math.round(radiusKm * 4.2 + 6));

        const updatedSlots = slots.map((s) => {
          if (s.slotId === slotId) {
            return {
              ...s,
              flashBeacon: {
                isActive: true,
                discountPercent,
                durationMinutes,
                expiresAt,
                discountedPrice,
                broadcastRadiusKm: radiusKm,
                notifiedTravelersCount: estimatedReach,
                claimedSpotsDuringFlash: 0,
              },
            };
          }
          return s;
        });

        const newEvent = {
          id: 'ev-' + Date.now(),
          title: `Flash Beacon Activated (${discountPercent}% OFF)`,
          subtitle: `${targetSlot.listingTitle} · ${emptySpots} seats broadcast to ${estimatedReach} travelers within ${radiusKm} km`,
          time: 'Just now',
          type: 'beacon' as const,
        };

        set({
          slots: updatedSlots,
          recentFeedEvents: [newEvent, ...get().recentFeedEvents.slice(0, 15)],
        });

        // Broadcast cross-tab event
        if (providerBroadcastChannel) {
          const eventPayload: FlashBeaconBroadcastEvent = {
            type: 'FLASH_BEACON_ACTIVATED',
            slotId,
            listingTitle: targetSlot.listingTitle,
            city: get().profile.city,
            discountPercent,
            discountedPrice,
            originalPrice: targetSlot.basePricePerPerson,
            remainingSeats: emptySpots,
            expiresAt,
            broadcastRadiusKm: radiusKm,
          };
          providerBroadcastChannel.postMessage(eventPayload);
        }
      },

      cancelFlashBeacon: (slotId) => {
        const slots = get().slots;
        const targetSlot = slots.find((s) => s.slotId === slotId);
        const updatedSlots = slots.map((s) => {
          if (s.slotId === slotId) {
            return {
              ...s,
              flashBeacon: undefined,
            };
          }
          return s;
        });

        const newEvent = {
          id: 'ev-' + Date.now(),
          title: 'Flash Beacon Stand Down',
          subtitle: `${targetSlot?.listingTitle || 'Workshop'} beacon deactivated`,
          time: 'Just now',
          type: 'beacon' as const,
        };

        set({
          slots: updatedSlots,
          recentFeedEvents: [newEvent, ...get().recentFeedEvents.slice(0, 15)],
        });

        if (providerBroadcastChannel && targetSlot) {
          providerBroadcastChannel.postMessage({
            type: 'FLASH_BEACON_CANCELLED',
            slotId,
            listingTitle: targetSlot.listingTitle,
            city: get().profile.city,
          });
        }
      },

      pingNearbyCluster: (clusterId, slotId) => {
        const clusters = get().clusters;
        const slots = get().slots;
        const targetCluster = clusters.find((c) => c.clusterId === clusterId);
        const targetSlot = slots.find((s) => s.slotId === slotId);

        if (!targetCluster || !targetSlot) return;

        // Mark cluster as pinged
        const updatedClusters = clusters.map((c) =>
          c.clusterId === clusterId ? { ...c, pingedWithBeacon: true } : c
        );

        const newEvent = {
          id: 'ev-' + Date.now(),
          title: `Direct Push Sent to ${targetCluster.label}`,
          subtitle: `Special flash rate offered for ${targetSlot.timeLabel}`,
          time: 'Just now',
          type: 'beacon' as const,
        };

        set({
          clusters: updatedClusters,
          recentFeedEvents: [newEvent, ...get().recentFeedEvents.slice(0, 15)],
        });

        // Simulate automatic traveler claim after 2.2 seconds
        setTimeout(() => {
          const currentSlot = get().slots.find((s) => s.slotId === slotId);
          if (currentSlot && currentSlot.bookedSeats < currentSlot.totalCapacity) {
            const seatsToClaim = Math.min(2, currentSlot.totalCapacity - currentSlot.bookedSeats);
            const claimPrice = currentSlot.flashBeacon?.discountedPrice || currentSlot.basePricePerPerson;
            const clusterName = targetCluster.label.split('Near')[0].trim() || 'Traveler Crew';
            
            get().simulateIncomingClaim(
              slotId,
              `${clusterName} (${seatsToClaim} pax)`,
              seatsToClaim
            );
          }
        }, 2200);
      },

      simulateIncomingClaim: (slotId, customName, customPartySize = 2) => {
        const slots = get().slots;
        const targetSlot = slots.find((s) => s.slotId === slotId);
        if (!targetSlot) return;

        const emptySeats = Math.max(0, targetSlot.totalCapacity - targetSlot.bookedSeats);
        if (emptySeats <= 0) return;

        const partySize = Math.min(emptySeats, customPartySize);
        const pricePerSeat = targetSlot.flashBeacon?.discountedPrice || targetSlot.basePricePerPerson;
        const totalAmount = pricePerSeat * partySize;
        const travelerName = customName || `Nikhil & Sneha Verma (${partySize} pax)`;

        const newBooking: ProviderBookingRecord = {
          bookingId: 'BK-' + Math.floor(1000 + Math.random() * 9000),
          travelerName,
          partySize,
          slotTime: targetSlot.timeLabel,
          listingTitle: targetSlot.listingTitle,
          amountPaid: totalAmount,
          bookedViaFlashBeacon: Boolean(targetSlot.flashBeacon?.isActive),
          status: 'confirmed',
          timestamp: 'Just now',
          guestEmail: 'guest.instant@lokiva.in',
        };

        const updatedSlots = slots.map((s) => {
          if (s.slotId === slotId) {
            const currentClaimed = s.flashBeacon?.claimedSpotsDuringFlash || 0;
            return {
              ...s,
              bookedSeats: s.bookedSeats + partySize,
              flashBeacon: s.flashBeacon
                ? {
                    ...s.flashBeacon,
                    claimedSpotsDuringFlash: currentClaimed + partySize,
                  }
                : undefined,
            };
          }
          return s;
        });

        const newEvent = {
          id: 'ev-' + Date.now(),
          title: `🎉 Flash Spot Claimed: ${travelerName}`,
          subtitle: `₹${totalAmount.toLocaleString('en-IN')} paid directly · ${targetSlot.listingTitle}`,
          time: 'Just now',
          type: 'booking' as const,
        };

        set({
          slots: updatedSlots,
          bookings: [newBooking, ...get().bookings],
          recentFeedEvents: [newEvent, ...get().recentFeedEvents.slice(0, 15)],
        });

        // Broadcast seat claim event across tabs
        if (providerBroadcastChannel) {
          providerBroadcastChannel.postMessage({
            type: 'FLASH_SEAT_CLAIMED',
            slotId,
            listingTitle: targetSlot.listingTitle,
            remainingSeats: emptySeats - partySize,
          });
        }
      },

      updateSlotCapacityOrBookings: (slotId, newBookedSeats, newTotalCapacity, newBasePrice) => {
        const slots = get().slots.map((s) => {
          if (s.slotId === slotId) {
            return {
              ...s,
              bookedSeats: Math.min(newTotalCapacity, Math.max(0, newBookedSeats)),
              totalCapacity: Math.max(1, newTotalCapacity),
              basePricePerPerson: Math.max(100, newBasePrice),
            };
          }
          return s;
        });
        set({ slots });
      },

      addWorkshopSlot: (newSlotData) => {
        const slotId = 'slot-' + Date.now();
        const slot: WorkshopSlot = {
          ...newSlotData,
          slotId,
          flashBeacon: undefined,
        };
        set({ slots: [slot, ...get().slots] });
      },

      deleteWorkshopSlot: (slotId) => {
        set({ slots: get().slots.filter((s) => s.slotId !== slotId) });
      },

      createOrUpdateListing: (listingData) => {
        const listings = get().listings;
        if (listingData.id) {
          const updatedListings = listings.map((l) =>
            l.id === listingData.id ? { ...l, ...listingData } : l
          );
          set({ listings: updatedListings });
        } else {
          const newListing: ProviderListing = {
            id: 'exp-' + Date.now(),
            title: listingData.title,
            category: listingData.category || 'Handloom & Textiles',
            city: listingData.city || get().profile.city,
            precinct: listingData.precinct || get().profile.precinct,
            pricePerPerson: listingData.pricePerPerson || 1200,
            durationHours: listingData.durationHours || 2.0,
            maxGroupSize: listingData.maxGroupSize || 8,
            rating: 5.0,
            reviewCount: 1,
            coverImage:
              listingData.coverImage ||
              'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
            isStepFreeAccessible: listingData.isStepFreeAccessible ?? true,
            craftHeritage: listingData.craftHeritage || get().profile.generationalHeritage,
            description: listingData.description || 'Authentic living craft masterclass hosted by generational artisans.',
            tags: listingData.tags || ['Masterclass', 'Living Heritage'],
          };
          set({ listings: [newListing, ...listings] });
        }
      },

      updateGuildProfile: (data) => {
        set({ profile: { ...get().profile, ...data } });
      },

      initializeProviderSession: ({
        guildName,
        craftSpecialty,
        city,
        precinct,
        heritage,
        isAccessible,
        email,
        phone,
      }) => {
        const profile: ProviderGuildProfile = {
          guildName: guildName || 'Heritage Artisan Collective',
          craftSpecialty: craftSpecialty || 'Living Indian Crafts',
          city: city || 'Mumbai',
          precinct: precinct || 'Old Heritage Precinct',
          generationalHeritage: heritage || 'Living Master Artisan Guild',
          isStepFreeAccessible: isAccessible,
          contactEmail: email,
          contactPhone: phone || '+91 98200 00000',
          isKycVerified: true,
          settlementAccount: 'Verified Direct Bank Account · IFSC: HDFC0001842',
          avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
        };

        set({ profile });
      },

      resetToDefaultData: () => {
        set({
          profile: DEFAULT_PROFILE,
          slots: DEFAULT_SLOTS,
          clusters: DEFAULT_CLUSTERS,
          bookings: DEFAULT_BOOKINGS,
          listings: DEFAULT_LISTINGS,
        });
      },

      getTotalRevenue: () => {
        const bookings = get().bookings;
        const total = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
        // Base historical revenue + real booking ledger
        return 34200 + total;
      },

      getVerifiedBookingsCount: () => {
        const bookings = get().bookings;
        return 22 + bookings.length;
      },

      getAudienceReach: () => {
        const slots = get().slots;
        const activeBeacon = slots.find((s) => s.flashBeacon?.isActive);
        const baseReach = 1140;
        const beaconBoost = activeBeacon ? (activeBeacon.flashBeacon?.notifiedTravelersCount || 18) * 14 : 0;
        return baseReach + beaconBoost;
      },

      getCommunityRating: () => {
        return 4.98;
      },

      getReviewCount: () => {
        return 28 + Math.floor(get().bookings.length / 2);
      },
    }),
    {
      name: 'lokiva_provider_store',
      partialize: (state) => ({
        profile: state.profile,
        slots: state.slots,
        clusters: state.clusters,
        bookings: state.bookings,
        listings: state.listings,
        recentFeedEvents: state.recentFeedEvents,
      }),
    }
  )
);
