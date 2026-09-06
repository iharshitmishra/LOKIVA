import {
  Experience,
  ExperienceFilters,
  DestinationDetail,
  DestinationSummary,
  State,
  City,
  SearchResponse,
  NearbyResponse,
  ScoredExperience,
  StructuredIntent,
  FeasibilityResult,
  ReplanResult,
  Itinerary,
  Provider,
  ProviderAnalyticsSummary,
  ProviderBooking,
  ProviderEarningsSummary,
  AdminStats,
  Review,
  DayPlanResponse,
} from '../types';

export const API_BASE =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? '/api/v1'
    : import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined' && window.location.port === '3000'
        ? '/api/v1'
        : 'http://localhost:8000/api/v1');

/**
 * Resolves an image URL to an absolute URL pointing to the live Render backend
 * if it is an /api/ proxy path or a raw Wikimedia URL.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';

  // Direct Pexels / Unsplash / external CDN images work as-is
  if (url.startsWith('http') && !url.includes('upload.wikimedia.org')) {
    return url;
  }

  const isProduction =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // On production (e.g. lokiva.vercel.app), use relative path so Vercel rewrites /api/* to Render
  // On localhost, point to local backend if running on 8000
  const backendOrigin = isProduction
    ? ''
    : import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:8000';

  // If it's already a proxy path
  if (url.startsWith('/api/v1/experiences/proxy-image')) {
    return backendOrigin ? `${backendOrigin}${url}` : url;
  }

  // If it's a raw Wikimedia image, wrap it through our proxy
  if (url.includes('upload.wikimedia.org')) {
    const proxyPath = `/api/v1/experiences/proxy-image?url=${encodeURIComponent(url)}`;
    return backendOrigin ? `${backendOrigin}${proxyPath}` : proxyPath;
  }

  if (url.startsWith('/api/')) {
    return backendOrigin ? `${backendOrigin}${url}` : url;
  }

  return url;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('lokiva_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || errData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Experiences
  async getExperiences(filters: ExperienceFilters = {}): Promise<Experience[]> {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.max_price) params.append('max_price', String(filters.max_price));
    if (filters.low_walking) params.append('low_walking', 'true');
    if (filters.wheelchair) params.append('wheelchair', 'true');
    if (filters.is_hidden_gem) params.append('is_hidden_gem', 'true');
    if (filters.is_indoor) params.append('is_indoor', 'true');
    if (filters.is_rain_safe) params.append('is_indoor', 'true');
    if (filters.search) params.append('q', filters.search);
    if (filters.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    return request<Experience[]>(`/experiences${qs ? `?${qs}` : ''}`);
  },

  async getLandingExperiences(): Promise<Experience[]> {
    return request<Experience[]>('/experiences/landing');
  },

  async getExperienceById(id: number): Promise<Experience> {
    return request<Experience>(`/experiences/${id}`);
  },

  async getExperienceCategories(params: { city?: string; state?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.city) searchParams.append('city', params.city);
    if (params.state) searchParams.append('state', params.state);
    const qs = searchParams.toString();
    return request<any[]>(`/experiences/categories${qs ? `?${qs}` : ''}`);
  },

  // Destinations & Pan-India Network
  async getDestinations(limit: number = 30): Promise<DestinationSummary[]> {
    return request<DestinationSummary[]>(`/destinations?limit=${limit}`);
  },

  async getStates(params: { region?: string; is_ut?: boolean; q?: string } = {}): Promise<State[]> {
    const qs = new URLSearchParams();
    if (params.region && params.region !== 'All') qs.append('region', params.region);
    if (params.is_ut !== undefined) qs.append('is_ut', String(params.is_ut));
    if (params.q) qs.append('q', params.q);
    const query = qs.toString();
    return request<State[]>(`/destinations/states${query ? `?${query}` : ''}`);
  },

  async getCities(params: { state_code?: string; state_name?: string; region?: string; limit?: number; offset?: number; q?: string } = {}): Promise<City[]> {
    const qs = new URLSearchParams();
    if (params.state_code) qs.append('state_code', params.state_code);
    if (params.state_name) qs.append('state_name', params.state_name);
    if (params.region && params.region !== 'All') qs.append('region', params.region);
    if (params.limit) qs.append('limit', String(params.limit));
    if (params.offset) qs.append('offset', String(params.offset));
    if (params.q) qs.append('q', params.q);
    const query = qs.toString();
    return request<City[]>(`/destinations/cities${query ? `?${query}` : ''}`);
  },

  async searchDestinations(query: string): Promise<SearchResponse> {
    return request<SearchResponse>(`/destinations/search?q=${encodeURIComponent(query)}`);
  },

  async getNearbyDestinations(lat: number, lng: number, radiusKm: number = 300): Promise<NearbyResponse> {
    return request<NearbyResponse>(`/destinations/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
  },

  async getFeaturedDestinations(): Promise<City[]> {
    return request<City[]>('/destinations/featured');
  },

  async getSurpriseDestination(params: { lat?: number; lng?: number; budget?: number; time_hours?: number; interest?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.lat) qs.append('lat', String(params.lat));
    if (params.lng) qs.append('lng', String(params.lng));
    if (params.budget) qs.append('budget', String(params.budget));
    if (params.time_hours) qs.append('time_hours', String(params.time_hours));
    if (params.interest) qs.append('interest', params.interest);
    const query = qs.toString();
    return request<{ surprise_experience: Experience; rationale: string }>(`/destinations/surprise${query ? `?${query}` : ''}`);
  },

  async getDestination(state: string, city: string): Promise<DestinationDetail> {
    return request<DestinationDetail>(`/destinations/${encodeURIComponent(state)}/${encodeURIComponent(city)}`);
  },

  // AI & Recommendations
  async getRecommendations(params: {
    city?: string;
    prompt?: string;
    traveler_type?: string;
    max_budget?: number;
    limit?: number;
  }): Promise<ScoredExperience[]> {
    const qs = new URLSearchParams();
    if (params.city) qs.append('city', params.city);
    if (params.prompt) qs.append('prompt', params.prompt);
    if (params.traveler_type) qs.append('traveler_type', params.traveler_type);
    if (params.max_budget) qs.append('max_budget', String(params.max_budget));
    if (params.limit) qs.append('limit', String(params.limit));

    return request<ScoredExperience[]>(`/ai/recommendations?${qs.toString()}`);
  },

  async chatWithCulturalGuide(data: {
    message: string;
    chat_history?: any[];
    city?: string;
  }): Promise<{
    reply: string;
    extracted_intent: StructuredIntent;
    suggested_experiences: Experience[];
    context_destination: string;
  }> {
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // AI Cultural Concierge - Real AI powered by OpenAI
  async chatWithConcierge(data: {
    message: string;
    chat_history?: any[];
    city?: string;
    state?: string;
  }): Promise<{
    reply: string;
    tokens_used: number;
    model: string;
    extracted_intent: StructuredIntent;
    suggested_experiences: ScoredExperience[];
    context_destination: string;
    state: string;
  }> {
    return request('/ai/concierge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkAIHealth(): Promise<{
    status: string;
    message: string;
  }> {
    return request('/ai/health');
  },

  async extractIntent(prompt: string): Promise<StructuredIntent> {
    return request<StructuredIntent>('/ai/intent', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },

  async generateDayPlan(data: {
    destination: string;
    time_available: string;
    budget: string;
    group_type: string;
    interests: string[];
    food_preferences: string;
    mobility: string;
    vibe: string;
  }): Promise<DayPlanResponse> {
    return request<DayPlanResponse>('/ai/day-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Itineraries & Feasibility
  async checkFeasibility(
    experienceIds: number[],
    hotelLat: number = 26.9124,
    hotelLng: number = 75.7873
  ): Promise<FeasibilityResult> {
    return request<FeasibilityResult>('/itineraries/feasibility', {
      method: 'POST',
      body: JSON.stringify({
        experience_ids: experienceIds,
        hotel_lat: hotelLat,
        hotel_lng: hotelLng,
      }),
    });
  },

  async replanItinerary(
    experienceIds: number[],
    triggerReason: string = 'rain',
    city: string = 'Jaipur'
  ): Promise<ReplanResult> {
    return request<ReplanResult>('/itineraries/replan', {
      method: 'POST',
      body: JSON.stringify({
        experience_ids: experienceIds,
        trigger_reason: triggerReason,
        city,
      }),
    });
  },

  async createItinerary(data: {
    title: string;
    city: string;
    state?: string;
    experience_ids: number[];
    user_id?: number;
  }): Promise<Itinerary> {
    return request<Itinerary>('/itineraries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getItinerary(id: number): Promise<Itinerary> {
    return request<Itinerary>(`/itineraries/${id}`);
  },

  async getUserItineraries(userId: number): Promise<Itinerary[]> {
    return request<Itinerary[]>(`/itineraries/user/${userId}`);
  },

  // Favorites & Reviews
  async getFavorites(userId: number = 1): Promise<Experience[]> {
    return request<Experience[]>(`/reviews/favorites?user_id=${userId}`);
  },

  async toggleFavorite(experienceId: number, userId: number = 1): Promise<{ favorited: boolean; experience_id: number }> {
    return request<{ favorited: boolean; experience_id: number }>(`/reviews/favorites/${experienceId}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  async getReviews(experienceId: number): Promise<Review[]> {
    return request<Review[]>(`/reviews/experience/${experienceId}`);
  },

  async addReview(data: {
    experience_id: number;
    rating: number;
    title?: string;
    comment: string;
    user_id?: number;
  }): Promise<Review> {
    return request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Provider
  async getProviderProfile(): Promise<Provider> {
    return request<Provider>('/providers/me');
  },

  async updateProviderProfile(data: Partial<Provider>): Promise<Provider> {
    return request<Provider>('/providers/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getProviderExperiences(): Promise<Experience[]> {
    return request<Experience[]>('/providers/experiences');
  },

  async createProviderExperience(data: Partial<Experience>): Promise<Experience> {
    return request<Experience>('/providers/experiences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProviderAnalytics(): Promise<ProviderAnalyticsSummary> {
    return request<ProviderAnalyticsSummary>('/providers/analytics');
  },

  async getProviderBookings(status?: string): Promise<ProviderBooking[]> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request<ProviderBooking[]>(`/providers/bookings${query}`);
  },

  async updateBookingStatus(id: number, status: 'confirmed' | 'completed' | 'cancelled'): Promise<ProviderBooking> {
    return request<ProviderBooking>(`/providers/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getProviderEarnings(): Promise<ProviderEarningsSummary> {
    return request<ProviderEarningsSummary>('/providers/earnings');
  },

  async extractListingWithCopilot(text: string): Promise<any> {
    return request<any>('/providers/copilot/extract', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/admin/stats');
  },

  async getAdminProviders(): Promise<Provider[]> {
    return request<Provider[]>('/admin/providers');
  },

  async createAdminProvider(data: Partial<Provider>): Promise<Provider> {
    return request<Provider>('/admin/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyProvider(id: number, isVerified: boolean = true): Promise<Provider> {
    return request<Provider>(`/admin/providers/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ is_verified: isVerified }),
    });
  },

  async deleteAdminProvider(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/admin/providers/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminExperiences(params: { q?: string; city?: string; state?: string; limit?: number; offset?: number } = {}): Promise<Experience[]> {
    const qs = new URLSearchParams();
    if (params.q) qs.append('q', params.q);
    if (params.city) qs.append('city', params.city);
    if (params.state) qs.append('state', params.state);
    if (params.limit) qs.append('limit', String(params.limit));
    if (params.offset) qs.append('offset', String(params.offset));
    const query = qs.toString();
    return request<Experience[]>(`/admin/experiences${query ? `?${query}` : ''}`);
  },

  async createAdminExperience(data: Partial<Experience>): Promise<Experience> {
    return request<Experience>('/admin/experiences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminExperience(id: number, data: Partial<Experience>): Promise<Experience> {
    return request<Experience>(`/admin/experiences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminExperience(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/admin/experiences/${id}`, {
      method: 'DELETE',
    });
  },

  async moderateExperience(id: number, isActive: boolean): Promise<Experience> {
    return request<Experience>(`/admin/experiences/${id}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  async getAdminUsers(): Promise<Array<{ id: number; email: string; full_name: string; role: string; is_active: boolean; created_at: string }>> {
    return request('/admin/users');
  },

  async createAdminUser(data: { email: string; full_name: string; role?: string; password?: string }): Promise<any> {
    return request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminUser(id: number): Promise<{ success: boolean; message: string }> {
    return request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Ingestion & Pan-India Resolution
  async getIngestionStatus(): Promise<any> {
    return request<any>('/ingestion/status');
  },

  async resolveLocation(input: string | { lat: number; lng: number }): Promise<any> {
    let qs = '';
    if (typeof input === 'string') {
      qs = `?q=${encodeURIComponent(input)}`;
    } else {
      qs = `?lat=${input.lat}&lng=${input.lng}`;
    }
    return request<any>(`/ingestion/resolve${qs}`);
  },

  // Media & Pexels Dynamic Photo Engine
  async getMediaImage(params: {
    q?: string;
    city?: string;
    state?: string;
    category?: string;
    title?: string;
  }): Promise<{ photoUrl: string; photoUrls: string[]; photographer: string; photographerUrl: string }> {
    const qs = new URLSearchParams();
    if (params.q) qs.append('q', params.q);
    if (params.city) qs.append('city', params.city);
    if (params.state) qs.append('state', params.state);
    if (params.category) qs.append('category', params.category);
    if (params.title) qs.append('title', params.title);
    return request(`/media/image?${qs.toString()}`);
  },

  async getMediaGallery(params: {
    q?: string;
    city?: string;
    category?: string;
    title?: string;
    count?: number;
  }): Promise<{ photoUrl: string; photoUrls: string[]; photographer: string; photographerUrl: string }> {
    const qs = new URLSearchParams();
    if (params.q) qs.append('q', params.q);
    if (params.city) qs.append('city', params.city);
    if (params.category) qs.append('category', params.category);
    if (params.title) qs.append('title', params.title);
    if (params.count) qs.append('count', String(params.count));
    return request(`/media/gallery?${qs.toString()}`);
  },
};
