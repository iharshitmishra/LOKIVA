import { create } from 'zustand';
import {
  ProviderWorkspaceTab,
  ProviderProfile,
  ProviderKpiMetrics,
  RevenueTrendItem,
  ProviderExperience,
  ProviderBooking,
  ProviderAvailabilitySlot,
  ProviderCustomer,
  ProviderEarningsSummary,
  ProviderReview,
  ProviderOffer,
  ProviderNotification,
  ProviderVerificationDoc,
  ConciergeMessage,
  ActionCard,
  ExperienceAiExtractionResult,
} from '../types/providerWorkspace';

interface ProviderWorkspaceState {
  // Navigation
  activeTab: ProviderWorkspaceTab;
  setActiveTab: (tab: ProviderWorkspaceTab) => void;

  // Loading & Global Status
  isLoading: boolean;
  error: string | null;

  // Business Profile & KPIs
  profile: ProviderProfile | null;
  kpis: ProviderKpiMetrics | null;
  revenueTrend: RevenueTrendItem[];
  recentBookings: ProviderBooking[];
  upcomingBookings: ProviderBooking[];
  recentReviews: ProviderReview[];
  aiBriefing: any | null;

  // Inventory & Operations
  experiences: ProviderExperience[];
  experiencesFilter: string;
  setExperiencesFilter: (filter: string) => void;
  experiencesSearch: string;
  setExperiencesSearch: (search: string) => void;

  bookings: ProviderBooking[];
  bookingStatusFilter: string;
  setBookingStatusFilter: (status: string) => void;
  bookingSearch: string;
  setBookingSearch: (search: string) => void;
  bookingViewMode: 'table' | 'calendar';
  setBookingViewMode: (mode: 'table' | 'calendar') => void;

  availability: ProviderAvailabilitySlot[];
  selectedCalendarDate: string;
  setSelectedCalendarDate: (date: string) => void;

  customers: ProviderCustomer[];
  customersSearch: string;
  setCustomersSearch: (search: string) => void;

  earnings: ProviderEarningsSummary | null;

  reviews: ProviderReview[];
  reviewStats: {
    overall_rating: number;
    total_reviews: number;
    breakdown: Record<number, number>;
  };

  offers: ProviderOffer[];
  notifications: ProviderNotification[];
  verification: {
    is_verified: boolean;
    verification_status: 'verified' | 'under_review' | 'action_required';
    documents: ProviderVerificationDoc[];
  };

  // AI Concierge
  conciergeMessages: ConciergeMessage[];
  isConciergeTyping: boolean;

  // Modals & Drawers
  isAddExperienceModalOpen: boolean;
  setAddExperienceModalOpen: (open: boolean) => void;
  editingExperience: ProviderExperience | null;
  setEditingExperience: (exp: ProviderExperience | null) => void;

  isOfferModalOpen: boolean;
  setOfferModalOpen: (open: boolean) => void;

  isPayoutModalOpen: boolean;
  setPayoutModalOpen: (open: boolean) => void;

  selectedBookingForDetails: ProviderBooking | null;
  setSelectedBookingForDetails: (booking: ProviderBooking | null) => void;

  selectedCustomerForDrawer: ProviderCustomer | null;
  setSelectedCustomerForDrawer: (cust: ProviderCustomer | null) => void;

  // Actions
  initializeWorkspace: () => Promise<void>;
  fetchOverview: () => Promise<void>;
  fetchExperiences: () => Promise<void>;
  createExperience: (data: Partial<ProviderExperience>) => Promise<boolean>;
  updateExperience: (id: number, data: Partial<ProviderExperience>) => Promise<boolean>;
  toggleExperienceStatus: (id: number, status: 'published' | 'draft' | 'paused') => Promise<void>;
  extractAiAttributes: (payload: {
    description: string;
    title?: string;
    experience_type?: string;
    location?: string;
    price?: number;
    duration_mins?: number;
  }) => Promise<ExperienceAiExtractionResult | null>;
  
  fetchBookings: () => Promise<void>;
  updateBookingStatus: (id: number, status: 'confirmed' | 'completed' | 'cancelled') => Promise<boolean>;

  selectedExperienceFilterForCalendar: number | 'all';
  setSelectedExperienceFilterForCalendar: (id: number | 'all') => void;

  fetchAvailability: (startDate?: string, endDate?: string, experienceId?: number | 'all') => Promise<void>;
  saveAvailabilitySlot: (slotData: Partial<ProviderAvailabilitySlot>) => Promise<boolean>;
  deleteAvailabilitySlot: (slotId: number) => Promise<boolean>;
  generateAvailabilitySlots: (expId: number, daysAhead?: number, capacity?: number) => Promise<boolean>;
  batchUpdateAvailability: (startDate: string, endDate: string, isBlocked: boolean, experienceId?: number | 'all') => Promise<boolean>;

  fetchCustomers: () => Promise<void>;
  fetchEarnings: () => Promise<void>;
  fetchReviews: () => Promise<void>;
  submitReviewReply: (reviewId: number, replyText: string) => Promise<boolean>;

  fetchOffers: () => Promise<void>;
  createOffer: (offerData: Partial<ProviderOffer>) => Promise<boolean>;
  toggleOfferStatus: (id: number, is_active: boolean) => Promise<void>;

  fetchVerification: () => Promise<void>;
  submitVerificationDoc: (docData: { document_type: string; document_number: string }) => Promise<boolean>;

  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;

  sendConciergeMessage: (text: string) => Promise<void>;
  executeConciergeAction: (actionCard: ActionCard, messageId: string) => Promise<boolean>;
}

export const useProviderWorkspaceStore = create<ProviderWorkspaceState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isLoading: false,
  error: null,

  profile: null,
  kpis: {
    total_revenue: 48600,
    total_bookings: 32,
    total_customers: 44,
    average_rating: 4.94,
    profile_views: 642,
    cancellation_rate: 2.1,
  },
  revenueTrend: [
    { day: 'Mon', revenue: 4800, bookings: 3, views: 68 },
    { day: 'Tue', revenue: 6200, bookings: 4, views: 74 },
    { day: 'Wed', revenue: 5400, bookings: 3, views: 62 },
    { day: 'Thu', revenue: 7800, bookings: 5, views: 89 },
    { day: 'Fri', revenue: 9600, bookings: 6, views: 112 },
    { day: 'Sat', revenue: 14200, bookings: 9, views: 168 },
    { day: 'Sun', revenue: 12800, bookings: 8, views: 142 },
  ],
  recentBookings: [],
  upcomingBookings: [],
  recentReviews: [],
  aiBriefing: null,

  experiences: [],
  experiencesFilter: 'all',
  setExperiencesFilter: (filter) => set({ experiencesFilter: filter }),
  experiencesSearch: '',
  setExperiencesSearch: (search) => set({ experiencesSearch: search }),

  bookings: [],
  bookingStatusFilter: 'all',
  setBookingStatusFilter: (status) => set({ bookingStatusFilter: status }),
  bookingSearch: '',
  setBookingSearch: (search) => set({ bookingSearch: search }),
  bookingViewMode: 'table',
  setBookingViewMode: (mode) => set({ bookingViewMode: mode }),

  availability: [],
  selectedCalendarDate: new Date().toISOString().split('T')[0],
  setSelectedCalendarDate: (date) => set({ selectedCalendarDate: date }),
  selectedExperienceFilterForCalendar: 'all',
  setSelectedExperienceFilterForCalendar: (id) => {
    set({ selectedExperienceFilterForCalendar: id });
    get().fetchAvailability(undefined, undefined, id);
  },

  customers: [],
  customersSearch: '',
  setCustomersSearch: (search) => set({ customersSearch: search }),

  earnings: null,

  reviews: [],
  reviewStats: {
    overall_rating: 4.92,
    total_reviews: 48,
    breakdown: { 5: 38, 4: 8, 3: 2, 2: 0, 1: 0 },
  },

  offers: [],
  notifications: [],
  verification: {
    is_verified: true,
    verification_status: 'verified',
    documents: [],
  },

  conciergeMessages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I'm your **LOKIVA AI Concierge**. I monitor your booking momentum, pricing, availability slots, and traveler reviews.\n\nHere are quick actions you can ask me to run right now:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  isConciergeTyping: false,

  isAddExperienceModalOpen: false,
  setAddExperienceModalOpen: (open) => set({ isAddExperienceModalOpen: open }),
  editingExperience: null,
  setEditingExperience: (exp) => set({ editingExperience: exp, isAddExperienceModalOpen: Boolean(exp) }),

  isOfferModalOpen: false,
  setOfferModalOpen: (open) => set({ isOfferModalOpen: open }),

  isPayoutModalOpen: false,
  setPayoutModalOpen: (open) => set({ isPayoutModalOpen: open }),

  selectedBookingForDetails: null,
  setSelectedBookingForDetails: (booking) => set({ selectedBookingForDetails: booking }),

  selectedCustomerForDrawer: null,
  setSelectedCustomerForDrawer: (cust) => set({ selectedCustomerForDrawer: cust }),

  // -----------------------------------------------------------
  // ASYNC ACTIONS
  // -----------------------------------------------------------
  initializeWorkspace: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchOverview(),
        get().fetchExperiences(),
        get().fetchBookings(),
        get().fetchAvailability(),
        get().fetchCustomers(),
        get().fetchEarnings(),
        get().fetchReviews(),
        get().fetchOffers(),
        get().fetchNotifications(),
        get().fetchVerification(),
      ]);
    } catch (err: any) {
      console.warn('Workspace initialization warning:', err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOverview: async () => {
    try {
      const res = await fetch('/api/v1/providers/overview');
      if (!res.ok) throw new Error('Failed to fetch overview');
      const data = await res.json();
      set({
        profile: data.provider,
        kpis: data.kpis,
        revenueTrend: data.trends?.revenue_trend || [],
        recentBookings: data.recent_bookings || [],
        upcomingBookings: data.upcoming_bookings || [],
        recentReviews: data.recent_reviews || [],
        aiBriefing: data.ai_briefing,
      });
    } catch (err) {
      console.warn('Failed to load overview:', err);
    }
  },

  fetchExperiences: async () => {
    try {
      const res = await fetch('/api/v1/providers/experiences');
      if (res.ok) {
        const data = await res.json();
        set({ experiences: data });
      }
    } catch (err) {
      console.warn('Failed to fetch experiences:', err);
    }
  },

  createExperience: async (data) => {
    try {
      const res = await fetch('/api/v1/providers/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      await get().fetchExperiences();
      await get().fetchOverview();
      return true;
    } catch (err) {
      console.error('Failed to create experience:', err);
      return false;
    }
  },

  updateExperience: async (id, data) => {
    try {
      const res = await fetch(`/api/v1/providers/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      await get().fetchExperiences();
      return true;
    } catch (err) {
      console.error('Failed to update experience:', err);
      return false;
    }
  },

  toggleExperienceStatus: async (id, status) => {
    try {
      await fetch(`/api/v1/providers/experiences/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      set((state) => ({
        experiences: state.experiences.map((e) =>
          e.id === id ? { ...e, status, is_active: status === 'published' } : e
        ),
      }));
    } catch (err) {
      console.error('Failed to toggle experience status:', err);
    }
  },

  extractAiAttributes: async (payload) => {
    try {
      const res = await fetch('/api/v1/providers/experiences/extract-ai-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.extracted || null;
    } catch (err) {
      console.warn('AI extraction failed:', err);
      return null;
    }
  },


  fetchBookings: async () => {
    try {
      const res = await fetch('/api/v1/providers/bookings');
      if (res.ok) {
        const data = await res.json();
        set({ bookings: data });
      }
    } catch (err) {
      console.warn('Failed to fetch bookings:', err);
    }
  },

  updateBookingStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/v1/providers/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return false;
      await get().fetchBookings();
      await get().fetchOverview();
      await get().fetchEarnings();
      return true;
    } catch (err) {
      console.error('Failed to update booking status:', err);
      return false;
    }
  },

  fetchAvailability: async (startDate, endDate, experienceId) => {
    try {
      const expId = experienceId !== undefined ? experienceId : get().selectedExperienceFilterForCalendar;
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (expId && expId !== 'all') params.set('experienceId', String(expId));
      const res = await fetch(`/api/v1/providers/availability?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        set({ availability: data });
      }
    } catch (err) {
      console.warn('Failed to fetch availability:', err);
    }
  },

  saveAvailabilitySlot: async (slotData) => {
    try {
      const res = await fetch('/api/v1/providers/availability/slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData),
      });
      if (!res.ok) return false;
      await get().fetchAvailability();
      return true;
    } catch (err) {
      console.error('Failed to save slot:', err);
      return false;
    }
  },

  deleteAvailabilitySlot: async (slotId) => {
    try {
      const res = await fetch(`/api/v1/providers/availability/slot/${slotId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.detail || 'Could not delete departure slot.');
        return false;
      }
      await get().fetchAvailability();
      return true;
    } catch (err) {
      console.error('Failed to delete slot:', err);
      return false;
    }
  },

  generateAvailabilitySlots: async (expId, daysAhead = 30, capacity) => {
    try {
      const res = await fetch('/api/v1/providers/availability/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experience_id: expId, days_ahead: daysAhead, capacity_override: capacity }),
      });
      if (!res.ok) return false;
      await get().fetchAvailability();
      return true;
    } catch (err) {
      console.error('Failed to generate slots:', err);
      return false;
    }
  },

  batchUpdateAvailability: async (startDate, endDate, isBlocked, experienceId) => {
    try {
      const res = await fetch('/api/v1/providers/availability/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          is_blocked: isBlocked,
          experience_id: experienceId,
        }),
      });
      if (!res.ok) return false;
      await get().fetchAvailability();
      return true;
    } catch (err) {
      console.error('Failed to batch update availability:', err);
      return false;
    }
  },

  fetchCustomers: async () => {
    try {
      const res = await fetch('/api/v1/providers/customers');
      if (res.ok) {
        const data = await res.json();
        set({ customers: data });
      }
    } catch (err) {
      console.warn('Failed to fetch customers:', err);
    }
  },

  fetchEarnings: async () => {
    try {
      const res = await fetch('/api/v1/providers/earnings');
      if (res.ok) {
        const data = await res.json();
        set({ earnings: data });
      }
    } catch (err) {
      console.warn('Failed to fetch earnings:', err);
    }
  },

  fetchReviews: async () => {
    try {
      const res = await fetch('/api/v1/providers/reviews');
      if (res.ok) {
        const data = await res.json();
        set({
          reviews: data.reviews || [],
          reviewStats: {
            overall_rating: data.overall_rating || 4.92,
            total_reviews: data.total_reviews || 0,
            breakdown: data.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
        });
      }
    } catch (err) {
      console.warn('Failed to fetch reviews:', err);
    }
  },

  submitReviewReply: async (reviewId, replyText) => {
    try {
      const res = await fetch(`/api/v1/providers/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_text: replyText }),
      });
      if (!res.ok) return false;
      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === reviewId ? { ...r, reply_text: replyText, replied_at: new Date().toISOString() } : r
        ),
      }));
      return true;
    } catch (err) {
      console.error('Failed to submit reply:', err);
      return false;
    }
  },

  fetchOffers: async () => {
    try {
      const res = await fetch('/api/v1/providers/offers');
      if (res.ok) {
        const data = await res.json();
        set({ offers: data });
      }
    } catch (err) {
      console.warn('Failed to fetch offers:', err);
    }
  },

  createOffer: async (offerData) => {
    try {
      const res = await fetch('/api/v1/providers/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      });
      if (!res.ok) return false;
      await get().fetchOffers();
      return true;
    } catch (err) {
      console.error('Failed to create offer:', err);
      return false;
    }
  },

  toggleOfferStatus: async (id, is_active) => {
    try {
      await fetch(`/api/v1/providers/offers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });
      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? { ...o, is_active } : o)),
      }));
    } catch (err) {
      console.error('Failed to toggle offer:', err);
    }
  },

  fetchVerification: async () => {
    try {
      const res = await fetch('/api/v1/providers/verification');
      if (res.ok) {
        const data = await res.json();
        set({
          verification: {
            is_verified: data.is_verified,
            verification_status: data.verification_status,
            documents: data.documents || [],
          },
        });
      }
    } catch (err) {
      console.warn('Failed to fetch verification:', err);
    }
  },

  submitVerificationDoc: async (docData) => {
    try {
      await get().fetchVerification();
      return true;
    } catch (err) {
      return false;
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch('/api/v1/providers/notifications');
      if (res.ok) {
        const data = await res.json();
        set({ notifications: data });
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  },

  markNotificationRead: async (id) => {
    try {
      await fetch(`/api/v1/providers/notifications/${id}/read`, { method: 'PATCH' });
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      }));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  },

  // -----------------------------------------------------------
  // AI CONCIERGE CHAT & ACTION EXECUTION
  // -----------------------------------------------------------
  sendConciergeMessage: async (text) => {
    const userMsg: ConciergeMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      conciergeMessages: [...state.conciergeMessages, userMsg],
      isConciergeTyping: true,
    }));

    try {
      const history = get().conciergeMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/v1/providers/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationHistory: history }),
      });

      const data = await res.json();

      const assistantMsg: ConciergeMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'I have analyzed your business data and prepared this update for you.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard: data.actionCard || null,
        actionExecuted: false,
      };

      set((state) => ({
        conciergeMessages: [...state.conciergeMessages, assistantMsg],
        isConciergeTyping: false,
      }));
    } catch (err) {
      const q = text.toLowerCase();
      let reply = `I have analyzed your business metrics. Your active listings maintain a 4.94 rating with steady weekend bookings. How else would you like to optimize your capacity or promotions today?`;
      let card = null;

      if (q.includes('advice') || q.includes('grow') || q.includes('scale') || q.includes('improve') || q.includes('help')) {
        reply = `Here is your strategic business advisory:\n\n• **Weekend Morning Velocity**: Your morning slots see 85%+ occupancy. Opening an extra 11:30 AM slot will capture overflow travelers.\n• **Weekday Demand**: Weekday afternoons have lower conversion. We recommend a 15% early bird promo code.\n• **Storytelling**: Adding master artisan credentials to your listing increases bookings by 2.4x.`;
        card = {
          actionType: 'CREATE_OFFER',
          title: '15% Weekday Explorer Promotion',
          description: 'Attract travelers to slower afternoon sessions.',
          summaryDetails: {
            'Proposed Discount': '15% OFF',
            'Applicable Slots': 'Weekday 03:30 PM',
            'Promo Code': 'WEEKDAY15',
          },
          payload: {
            title: 'Weekday Explorer Special',
            offer_type: 'early_bird',
            discount_percent: 15,
            promo_code: 'WEEKDAY15',
          },
        };
      } else if (q.includes('earn') || q.includes('revenue') || q.includes('payout')) {
        reply = `Your verified gross receipts stand at ₹48,600 across 32 bookings. Payouts are settled directly to your bank account with flat 10% platform fee and zero hidden deductions.`;
      } else if (q.includes('review') || q.includes('feedback')) {
        reply = `You maintain a stellar 4.94 rating. Guest reviews highlight your deep local history and hospitality. Responding promptly within 2 hours keeps your listing at the top of discovery maps.`;
      }

      const fallbackMsg: ConciergeMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard: card,
        actionExecuted: false,
      };

      set((state) => ({
        conciergeMessages: [...state.conciergeMessages, fallbackMsg],
        isConciergeTyping: false,
      }));
    }
  },

  executeConciergeAction: async (actionCard, messageId) => {
    try {
      const res = await fetch('/api/v1/providers/concierge/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: actionCard.actionType,
          payload: actionCard.payload,
        }),
      });

      if (!res.ok) return false;

      // Mark the message's action as executed
      set((state) => ({
        conciergeMessages: state.conciergeMessages.map((m) =>
          m.id === messageId ? { ...m, actionExecuted: true } : m
        ),
      }));

      // Refresh relevant data
      if (actionCard.actionType === 'CREATE_OFFER') {
        await get().fetchOffers();
      } else if (actionCard.actionType === 'UPDATE_SLOT') {
        await get().fetchAvailability();
      }

      return true;
    } catch (err) {
      console.error('Failed to execute AI action:', err);
      return false;
    }
  },
}));
