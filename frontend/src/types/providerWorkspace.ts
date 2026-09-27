export type ProviderWorkspaceTab =
  | 'dashboard'
  | 'concierge'
  | 'experiences'
  | 'bookings'
  | 'customers'
  | 'earnings'
  | 'analytics'
  | 'reviews'
  | 'offers'
  | 'availability'
  | 'profile'
  | 'verification'
  | 'notifications'
  | 'settings'
  | 'digital-twin';

export interface ProviderProfile {
  id: number;
  business_name: string;
  provider_type: string;
  tagline?: string;
  description?: string;
  contact_email: string;
  phone?: string;
  city: string;
  state: string;
  address?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
  languages_spoken: string[];
  certifications: string[];
  social_links: Record<string, string>;
  settlement_account?: string;
  is_verified: boolean;
  verification_status: 'verified' | 'under_review' | 'action_required';
  rating: number;
  review_count: number;
  total_reviews?: number;
}

export interface ProviderKpiMetrics {
  total_revenue: number;
  total_bookings: number;
  total_customers: number;
  average_rating: number;
  profile_views: number;
  cancellation_rate: number;
}

export interface RevenueTrendItem {
  day: string;
  revenue: number;
  bookings: number;
  views: number;
}

export interface ProviderExperience {
  id: number;
  provider_id: number;
  title: string;
  tagline?: string;
  description: string;
  category: string;
  cultural_context?: string;
  state: string;
  city: string;
  area_name?: string;
  meeting_point?: string;
  latitude: number;
  longitude: number;
  approx_duration_mins: number;
  price: number;
  currency: string;
  max_capacity: number;
  min_group_size?: number;
  max_group_size?: number;
  group_type?: 'solo_friendly' | 'couple' | 'family' | 'small_group' | 'corporate_private';
  difficulty_level: string;
  is_indoor: boolean;
  is_rain_safe: boolean;
  is_hidden_gem: boolean;
  is_family_friendly: boolean;
  low_walking: boolean;
  wheelchair_accessible: boolean;
  step_free?: boolean;
  audio_guide?: boolean;
  best_time_of_day: string;
  opening_hours?: string;
  operating_days?: string[];
  available_slots?: string[];
  image_urls: string[];
  image_url?: string;
  video_url?: string;
  tags: string[];
  interests?: string[];
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  cancellation_policy?: string;
  advance_booking?: string;
  age_restriction?: string;
  special_instructions?: string;
  status: 'published' | 'draft' | 'paused';
  is_active: boolean;
  view_count: number;
  created_at?: string;
}

export interface ExperienceAiExtractionResult {
  category: string;
  subcategory: string;
  interests: string[];
  suitable_traveler_types: string[];
  is_family_friendly: boolean;
  family_suitability_reason: string;
  characteristics: {
    pace: string;
    setting: string;
    rain_safe: boolean;
    intensity: string;
  };
  search_keywords: string[];
  accessibility: {
    wheelchair_accessible: boolean;
    step_free: boolean;
    audio_guide: boolean;
    low_walking: boolean;
    inference_rationale: string;
  };
  group_type: 'solo_friendly' | 'couple' | 'family' | 'small_group' | 'corporate_private';
  best_time_of_day: string;
  recommended_duration_mins: number;
  suggested_inclusions: string[];
  suggested_exclusions: string[];
  special_instructions: string;
}


export interface ProviderBooking {
  id: number;
  booking_code: string;
  provider_id: number;
  experience_id: number;
  user_id?: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  party_size: number;
  adults_count: number;
  children_count: number;
  booking_date: string;
  time_slot: string;
  total_price: number;
  commission_rate: number;
  commission_amount: number;
  net_payout: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payout_status: 'pending' | 'settled' | 'cancelled';
  special_requests?: string;
  created_at: string;
  experience_title?: string;
  experience_category?: string;
  unit_price?: number;
}

export interface ProviderAvailabilitySlot {
  id?: number;
  provider_id: number;
  experience_id?: number;
  experience_title?: string;
  experience_category?: string;
  experience_cover?: string;
  experience_duration?: number;
  experience_base_price?: number;
  date: string;
  time_slot: string;
  capacity: number;
  booked_count: number;
  remaining: number;
  is_sold_out?: boolean;
  is_blocked: boolean;
  price_override?: number;
  effective_price?: number;
  status?: 'available' | 'low_seats' | 'sold_out' | 'blocked';
  occupancy_percent?: number;
}

export interface ProviderCustomer {
  id: number;
  provider_id: number;
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_bookings: number;
  total_spend: number;
  first_booking_date?: string;
  last_booking_date?: string;
  notes?: string;
  created_at?: string;
}

export interface ProviderTransaction {
  id: number;
  booking_code: string;
  experience_title: string;
  guest_name: string;
  date: string;
  amount: number;
  platform_fee: number;
  net_payout: number;
  status: 'settled' | 'pending' | 'cancelled';
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface ProviderEarningsSummary {
  lifetime_gross: number;
  lifetime_net: number;
  available_balance: number;
  pending_settlement: number;
  completed_payouts: number;
  platform_commission: number;
  settlement_account: string;
  transactions: ProviderTransaction[];
}

export interface ProviderReview {
  id: number;
  experience_id: number;
  experience_title?: string;
  user_id?: number;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
  reply_text?: string;
  replied_at?: string;
}

export interface ProviderOffer {
  id: number;
  provider_id: number;
  experience_id?: number;
  experience_title?: string;
  title: string;
  offer_type: 'early_bird' | 'weekend' | 'group' | 'festival' | 'coupon';
  discount_percent: number;
  promo_code?: string;
  start_date: string;
  end_date: string;
  min_guests: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at?: string;
}

export interface ProviderNotification {
  id: number;
  provider_id: number;
  category: 'booking' | 'cancellation' | 'payout' | 'review' | 'system';
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface ProviderVerificationDoc {
  id: number;
  provider_id: number;
  document_type: string;
  document_number?: string;
  document_file_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface ActionCard {
  actionType: 'CREATE_OFFER' | 'UPDATE_SLOT' | 'DRAFT_REPLY' | 'EXPAND_AVAILABILITY';
  title: string;
  description: string;
  summaryDetails?: Record<string, string>;
  payload: Record<string, any>;
}

export interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionCard?: ActionCard | null;
  actionExecuted?: boolean;
}
