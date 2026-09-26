import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, resolveImageUrl } from '../lib/api';
import { Experience } from '../types';
import { ExperienceCard } from '../components/experience/ExperienceCard';
import { LokivaMomentsSection } from '../components/moments/LokivaMomentsSection';
import { deduplicateExperienceList } from '../lib/imageDeduplicator';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  Compass,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useProviderStore } from '../store/useProviderStore';
import { USER_CURATED_PLACES } from '../data/userVerifiedPlacesData';
import { INDIAN_STATES_AND_CITIES, POPULAR_CITIES_LIST } from '../data/places';

const THEMATIC_PERSPECTIVES = [
  { id: '', label: 'All Traditions' },
  { id: 'Food & Culinary', label: 'Street Food & Iconic Eateries' },
  { id: 'Art & Craft', label: 'Artisan Guilds & Workshops' },
  { id: 'Local Walks', label: 'Local Walks & Bazaars' },
  { id: 'Nature & Wildlife', label: 'Nature & Wilderness' },
  { id: 'Heritage & History', label: 'Living Heritage & Culture' },
];

const MAX_BUDGET_CEILING = 25000;

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialState = searchParams.get('state') || '';
  const initialCity = searchParams.get('city') || '';
  const initialLocation = searchParams.get('location') || initialCity || initialState || '';
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBudget = searchParams.get('budget') ? parseInt(searchParams.get('budget')!, 10) : MAX_BUDGET_CEILING;
  const initialWheelchair = searchParams.get('wheelchair') === 'true';
  const initialWalking = searchParams.get('walking') === 'true';

  const [experiences, setExperiences] = useState<Experience[]>(USER_CURATED_PLACES);
  const [visibleCount, setVisibleCount] = useState(36);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(initialBudget);
  const [wheelchairOnly, setWheelchairOnly] = useState(initialWheelchair);
  const [lowWalkingOnly, setLowWalkingOnly] = useState(initialWalking);
  const [hiddenGemsOnly, setHiddenGemsOnly] = useState(false);
  const [rainSafeOnly, setRainSafeOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);

  const providerSlots = useProviderStore((s) => s.slots);
  const activeBeaconSlot = providerSlots.find((s) => s.flashBeacon?.isActive);

  // Active filter count for badge
  const activeFiltersCount =
    (wheelchairOnly ? 1 : 0) +
    (lowWalkingOnly ? 1 : 0) +
    (rainSafeOnly ? 1 : 0) +
    (maxPrice < MAX_BUDGET_CEILING ? 1 : 0);

  // Fast, instant experience filter strictly displaying verified curated places
  const fetchExperiences = useCallback(
    async (
      loc = locationInput,
      query = searchQuery,
      cat = selectedCategory,
      stateFilter = selectedState,
      cityFilter = selectedCity
    ) => {
      setIsLoading(true);
      try {
        let results = [...USER_CURATED_PLACES];

        // 1. Precise City Filter if explicitly selected
        if (cityFilter && cityFilter.trim()) {
          const sc = cityFilter.toLowerCase().trim();
          results = results.filter((p) => (p.city || '').toLowerCase().includes(sc));
        }
        // 2. Precise State Filter if explicitly selected
        else if (stateFilter && stateFilter.trim()) {
          const ss = stateFilter.toLowerCase().trim();
          results = results.filter((p) => (p.state || '').toLowerCase().includes(ss));
        }
        // 3. Freeform Location input
        else if (loc && loc.trim()) {
          const l = loc.toLowerCase().trim();
          results = results.filter(
            (p) =>
              (p.city || '').toLowerCase().includes(l) ||
              (p.state || '').toLowerCase().includes(l) ||
              (p.area_name || '').toLowerCase().includes(l)
          );
        }

        // 4. Flexible Category Filtering
        if (cat && cat.trim()) {
          const c = cat.toLowerCase().trim();
          results = results.filter((p) => {
            const placeCat = (p.category || '').toLowerCase();
            if (placeCat.includes(c) || c.includes(placeCat)) return true;
            if (c.includes('food') && (placeCat.includes('culinary') || placeCat.includes('food') || placeCat.includes('dining') || placeCat.includes('tea'))) return true;
            if (c.includes('art') && (placeCat.includes('craft') || placeCat.includes('art') || placeCat.includes('guild') || placeCat.includes('textile') || placeCat.includes('pottery'))) return true;
            if (c.includes('walk') && (placeCat.includes('walk') || placeCat.includes('bazaar') || placeCat.includes('local') || placeCat.includes('market'))) return true;
            if (c.includes('nature') && (placeCat.includes('wildlife') || placeCat.includes('nature') || placeCat.includes('wilderness') || placeCat.includes('safari') || placeCat.includes('lake') || placeCat.includes('river'))) return true;
            if (c.includes('heritage') && (placeCat.includes('history') || placeCat.includes('heritage') || placeCat.includes('culture') || placeCat.includes('monument') || placeCat.includes('fort') || placeCat.includes('palace'))) return true;
            if (c.includes('spiritual') && (placeCat.includes('spiritual') || placeCat.includes('temple') || placeCat.includes('wellness') || placeCat.includes('ghat'))) return true;
            return false;
          });
        }

        // 5. Deep Query Search across all textual attributes
        if (query && query.trim()) {
          const q = query.toLowerCase().trim();
          results = results.filter(
            (p) =>
              (p.title || '').toLowerCase().includes(q) ||
              (p.tagline || '').toLowerCase().includes(q) ||
              (p.description || '').toLowerCase().includes(q) ||
              (p.city || '').toLowerCase().includes(q) ||
              (p.state || '').toLowerCase().includes(q) ||
              (p.area_name || '').toLowerCase().includes(q) ||
              (p.category || '').toLowerCase().includes(q) ||
              (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
          );
        }

        if (maxPrice < MAX_BUDGET_CEILING) {
          results = results.filter((p) => p.price <= maxPrice);
        }

        if (wheelchairOnly) {
          results = results.filter((p) => p.wheelchair_accessible);
        }

        if (lowWalkingOnly) {
          results = results.filter((p) => p.approx_duration_mins <= 60);
        }

        // Try getting live ratings from backend if available, but strictly preserve curated places
        try {
          const remoteData = await api.getExperiences({
            city: cityFilter || loc.trim() || undefined,
            state: stateFilter || undefined,
            category: cat || undefined,
            search: query.trim() || undefined,
          });
          if (remoteData && remoteData.length > 0) {
            results = results.map((item) => {
              const match = remoteData.find((r) =>
                r.title.toLowerCase().trim().includes(item.title.toLowerCase().trim().slice(0, 15))
              );
              return match ? { ...item, rating: match.rating || item.rating, review_count: match.review_count || item.review_count } : item;
            });
          }
        } catch {
          // Backend sleeping or offline, use verified curated place data
        }

        const deduped = deduplicateExperienceList(results);
        setExperiences(deduped);
        setVisibleCount(36);

        if (loc.trim() && deduped.length === 0) {
          setFeedbackNote(`No curated experiences found in "${loc.trim()}". Showing all verified heritage sites.`);
        } else {
          setFeedbackNote(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      locationInput,
      searchQuery,
      selectedCategory,
      selectedState,
      selectedCity,
      maxPrice,
      wheelchairOnly,
      lowWalkingOnly,
      hiddenGemsOnly,
      rainSafeOnly,
    ]
  );

  // Debounced instant search effect (200ms) for typing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExperiences(locationInput, searchQuery, selectedCategory, selectedState, selectedCity);
    }, 200);

    return () => clearTimeout(timer);
  }, [
    locationInput,
    searchQuery,
    selectedCategory,
    selectedState,
    selectedCity,
    maxPrice,
    wheelchairOnly,
    lowWalkingOnly,
    hiddenGemsOnly,
    rainSafeOnly,
  ]);

  // Synchronize state when URL search parameters change dynamically
  useEffect(() => {
    const stateParam = searchParams.get('state') || '';
    const cityParam = searchParams.get('city') || '';
    const loc = searchParams.get('location') || cityParam || stateParam || '';
    const q = searchParams.get('search') || searchParams.get('q') || '';
    const cat = searchParams.get('category') || '';
    const budget = searchParams.get('budget') ? parseInt(searchParams.get('budget')!, 10) : MAX_BUDGET_CEILING;
    const wheelchair = searchParams.get('wheelchair') === 'true';
    const walking = searchParams.get('walking') === 'true';

    if (stateParam) setSelectedState(stateParam);
    if (cityParam) setSelectedCity(cityParam);
    setLocationInput(loc);
    setSearchQuery(q);
    setSelectedCategory(cat);
    setMaxPrice(budget);
    setWheelchairOnly(wheelchair);
    setLowWalkingOnly(walking);
    fetchExperiences(loc, q, cat, stateParam, cityParam);
  }, [searchParams]);

  const currentCitiesList = React.useMemo(() => {
    if (!selectedState) return [];
    const found = INDIAN_STATES_AND_CITIES.find((s) => s.state.toLowerCase() === selectedState.toLowerCase());
    return found ? found.cities : [];
  }, [selectedState]);

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedCity('');
    setLocationInput(stateName);
    fetchExperiences(stateName, searchQuery, selectedCategory, stateName, '');
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setLocationInput(cityName);
    fetchExperiences(cityName, searchQuery, selectedCategory, selectedState, cityName);
  };

  const handleSelectPopularCity = (city: string) => {
    const stateObj = INDIAN_STATES_AND_CITIES.find((s) => s.cities.includes(city));
    const stateName = stateObj ? stateObj.state : '';
    if (stateName) {
      setSelectedState(stateName);
      setSelectedCity(city);
    } else {
      setSelectedCity(city);
    }
    setLocationInput(city);
    fetchExperiences(city, searchQuery, selectedCategory, stateName, city);
  };

  // Form submit: immediate instant query (no debounce wait)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExperiences(locationInput, searchQuery, selectedCategory, selectedState, selectedCity);
  };

  const clearAllFilters = () => {
    setSelectedState('');
    setSelectedCity('');
    setWheelchairOnly(false);
    setLowWalkingOnly(false);
    setRainSafeOnly(false);
    setMaxPrice(MAX_BUDGET_CEILING);
    setSelectedCategory('');
    setSearchQuery('');
    setLocationInput('');
    setFeedbackNote(null);
    fetchExperiences('', '', '', '', '');
  };

  // Curator's Spotlight: Pick the first experience
  const spotlightExperience = experiences.length > 0 ? experiences[0] : null;
  const activeCity = selectedCity || (POPULAR_CITIES_LIST.find((c) => c.toLowerCase() === locationInput.toLowerCase()) || (locationInput.length > 2 ? locationInput : ''));

  return (
    <div className="relative min-h-screen bg-paper text-ink selection:bg-marigold selection:text-ink pt-16 sm:pt-18 pb-16 overflow-hidden">
      {/* Decorative Indian Living Cultural Cutouts (Asymmetrically Flanking Negative Space) */}
      <div className="pointer-events-none select-none z-0 absolute inset-0 overflow-hidden hidden lg:block" aria-hidden="true">
        {/* 1. Kathakali Mask (Kerala Performing Arts) - Upper Left */}
        <div className="absolute left-0 xl:left-4 top-3 xl:top-4 w-28 lg:w-36 xl:w-44 -rotate-6 transition-transform duration-700 ease-out hover:rotate-0">
          <img
            src="/assets/cultural/kathakali-mask-cutout.png"
            alt="Kathakali classical dance mask cutout"
            loading="lazy"
            className="w-full h-auto object-contain opacity-75 xl:opacity-85 filter drop-shadow-[0_8px_20px_rgba(18,33,59,0.06)]"
          />
        </div>

        {/* 2. Classical Sitar / Veena (Music & Oral Traditions) - Upper Right */}
        <div className="absolute right-0 xl:right-4 top-2 xl:top-3 w-32 lg:w-40 xl:w-48 rotate-6 transition-transform duration-700 ease-out hover:rotate-0">
          <img
            src="/assets/cultural/sitar-veena-cutout.svg"
            alt="Classical sitar veena musical instrument cutout"
            loading="lazy"
            className="w-full h-auto object-contain opacity-75 xl:opacity-85 filter drop-shadow-[0_8px_20px_rgba(18,33,59,0.06)]"
          />
        </div>

        {/* 3. Artisan Pottery & Kalash (Craft Guilds) - Mid Left Accent */}
        <div className="hidden xl:block absolute left-6 top-[260px] w-24 lg:w-28 -rotate-3 transition-transform duration-700 ease-out hover:rotate-0">
          <img
            src="/assets/cultural/artisan-pottery-cutout.png"
            alt="Traditional handcrafted terracotta pottery cutout"
            loading="lazy"
            className="w-full h-auto object-contain opacity-70 xl:opacity-80 filter drop-shadow-[0_8px_16px_rgba(18,33,59,0.06)]"
          />
        </div>

        {/* 4. Royal Peacock / Mayura (Sacred Folklore) - Mid Right Accent */}
        <div className="hidden xl:block absolute right-6 top-[250px] w-28 lg:w-32 rotate-4 transition-transform duration-700 ease-out hover:rotate-0">
          <img
            src="/assets/cultural/royal-peacock-cutout.svg"
            alt="Royal peacock cultural motif cutout"
            loading="lazy"
            className="w-full h-auto object-contain opacity-70 xl:opacity-80 filter drop-shadow-[0_8px_16px_rgba(18,33,59,0.06)]"
          />
        </div>
      </div>

      {/* 1. EDITORIAL MASTHEAD (Seamlessly integrated with bg-paper) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-4 sm:pt-2 sm:pb-5">
        <div className="max-w-3xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#C1443B] font-bold">
            <Compass className="w-3.5 h-3.5 text-[#C1443B]" />
            <span>National Heritage & Cultural Registry (5,000+ Verified Places)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-ink tracking-tight leading-tight">
            Explore Curated Cultural Catalog
          </h1>
          <p className="text-sm sm:text-base text-dusk font-normal leading-relaxed">
            Discover street food havens, master artisan guilds, sacred steps, and historic walks across all 36 States & Union Territories of India.
          </p>
        </div>
      </div>

      {/* 2. UNIFIED DISCOVERY BAR (Natural flow, NOT sticky, seamless paper card) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-0 mb-5">
        <div className="bg-[#FAF7F2] border border-[#E5DFD5] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          {/* Two-tier Cascading State & City Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* State Selector */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-dusk font-bold mb-1">
                State / Territory ({INDIAN_STATES_AND_CITIES.length} Available)
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5DFD5] focus:border-ink rounded-xl text-xs sm:text-sm text-ink font-sans focus:outline-none transition cursor-pointer appearance-none shadow-xs"
                >
                  <option value="">All 36 States & UTs</option>
                  {INDIAN_STATES_AND_CITIES.map((s) => (
                    <option key={s.code} value={s.state}>
                      {s.state} ({s.cities.length} cities){s.isPopular ? ' ★' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-dusk absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* City / District Selector */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-dusk font-bold mb-1">
                City / District {selectedState ? `(${currentCitiesList.length} in ${selectedState})` : '(Select a State or Pick Below)'}
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => handleCitySelect(e.target.value)}
                  disabled={!selectedState}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5DFD5] focus:border-ink rounded-xl text-xs sm:text-sm text-ink font-sans focus:outline-none transition cursor-pointer appearance-none shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{selectedState ? `All Cities in ${selectedState}` : 'Pick a State first'}</option>
                  {currentCitiesList.map((c) => (
                    <option key={c} value={c}>
                      {c}{POPULAR_CITIES_LIST.includes(c) ? ' ★ (Popular)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-dusk absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Search Keyword Input */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-dusk font-bold mb-1">
                Instant Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-dusk absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Street food, weaving guild, walk, fort..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E5DFD5] focus:border-ink rounded-xl text-xs sm:text-sm text-ink placeholder-dusk-400 focus:outline-none transition font-sans shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Quick-Jump Popular Cities Bar (24 User-Designated Cities) */}
          <div className="pt-2 border-t border-[#E5DFD5]/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-[11px] tracking-wider text-[#C1443B] font-bold">
                24 Iconic Cultural Hubs:
              </span>
              {(locationInput || selectedState || selectedCity) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-mono text-[#C1443B] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Location</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [-webkit-overflow-scrolling:touch]">
              {POPULAR_CITIES_LIST.map((cityName) => {
                const isSelected =
                  locationInput.toLowerCase() === cityName.toLowerCase() ||
                  selectedCity.toLowerCase() === cityName.toLowerCase();
                return (
                  <button
                    key={cityName}
                    onClick={() => handleSelectPopularCity(cityName)}
                    className={`px-3 py-1 rounded-full text-xs font-heading font-medium whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-white font-semibold shadow-xs'
                        : 'bg-white text-ink hover:bg-[#F2ECE4] border border-[#E5DFD5] shadow-2xs'
                    }`}
                  >
                    {cityName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Context Banner with Direct Itinerary Solver Navigation */}
          {activeCity && (
            <div className="bg-white border border-[#E5DFD5] rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C1443B]" />
                <span className="text-xs sm:text-sm font-heading font-bold text-ink">
                  Exploring {activeCity} {selectedState ? `(${selectedState})` : ''}
                </span>
                <span className="text-xs font-mono text-dusk">
                  · {experiences.length} verified spots
                </span>
              </div>
              <Link
                to={`/itinerary?city=${encodeURIComponent(activeCity)}`}
                className="px-3.5 py-1.5 bg-[#C1443B] hover:bg-[#A83830] text-white text-xs font-heading font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Build Dynamic Itinerary for {activeCity}</span>
              </Link>
            </div>
          )}

          {/* Filter Toggles Row */}
          <div className="pt-2 border-t border-[#E5DFD5]/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-ink">
                <input
                  type="checkbox"
                  checked={wheelchairOnly}
                  onChange={(e) => setWheelchairOnly(e.target.checked)}
                  className="rounded text-[#C1443B] focus:ring-[#C1443B]"
                />
                <span>Step-Free Wheelchair Access</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-ink">
                <input
                  type="checkbox"
                  checked={lowWalkingOnly}
                  onChange={(e) => setLowWalkingOnly(e.target.checked)}
                  className="rounded text-[#C1443B] focus:ring-[#C1443B]"
                />
                <span>Quick Visit (&le; 60 mins)</span>
              </label>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-dusk text-xs font-sans">Max Budget / Day:</span>
              <span className="font-bold text-ink font-mono text-xs sm:text-sm min-w-[76px] text-right">
                {maxPrice >= MAX_BUDGET_CEILING ? '₹25,000+' : `₹${maxPrice.toLocaleString('en-IN')}`}
              </span>
              <input
                type="range"
                min="500"
                max={MAX_BUDGET_CEILING}
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                className="w-28 sm:w-36 accent-[#C1443B] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Optional Feedback Note Strip */}
      {feedbackNote && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-paper-100 border border-paper-300 rounded-xl py-2.5 px-4 text-xs font-mono text-dusk-800 flex items-center justify-between">
            <span>{feedbackNote}</span>
            <button
              onClick={() => setFeedbackNote(null)}
              className="text-dusk-600 hover:text-ink p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. THEMATIC PERSPECTIVES TAB BAR (Seamless on paper, no scrollbars) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Traditions">
          {THEMATIC_PERSPECTIVES.map((theme) => {
            const isActive = selectedCategory === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setSelectedCategory(theme.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-ink text-paper font-semibold shadow-2xs'
                    : 'bg-paper-100/90 text-dusk hover:text-ink hover:bg-paper-200 border border-paper-300/80 shadow-2xs'
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* LIVE FLASH ARTISAN DEAL BANNER */}
        {activeBeaconSlot && activeBeaconSlot.flashBeacon && (
          <div className="bg-gradient-to-r from-[#FAF4ED] to-[#F3EAD8] border border-[#C85A32] rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C85A32] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-6 h-6 text-white animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C85A32] text-white font-mono text-[10px] font-extrabold uppercase tracking-wider">
                    ⚡ Live Flash Artisan Deal ({activeBeaconSlot.flashBeacon.discountPercent}% OFF)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#C85A32] bg-white px-2 py-0.5 rounded-md border border-[#E8DEC8]">
                    {Math.max(0, activeBeaconSlot.totalCapacity - activeBeaconSlot.bookedSeats)} open spots remaining today
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-heading font-bold text-[#12213B]">
                  {activeBeaconSlot.listingTitle}
                </h3>

                <p className="text-xs text-[#556275] font-sans">
                  {activeBeaconSlot.timeLabel} · Flash Deal: <strong className="text-[#12213B] font-mono font-bold">₹{activeBeaconSlot.flashBeacon.discountedPrice} / pax</strong> (standard rate: <span className="line-through font-mono">₹{activeBeaconSlot.basePricePerPerson}</span>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/experience/${activeBeaconSlot.listingId}`}
                className="px-5 py-2.5 bg-[#C85A32] hover:bg-[#B34322] text-white font-heading font-bold rounded-xl text-xs sm:text-sm transition shadow-2xs whitespace-nowrap"
              >
                Claim Flash Spot →
              </Link>
            </div>
          </div>
        )}

        {/* 4. CURATOR'S SPOTLIGHT (HERO IMMERSION) */}
        {!isLoading && spotlightExperience && (
          <section className="bg-paper-100/90 border border-paper-300 rounded-2xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Visual Frame */}
              <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto overflow-hidden bg-paper-200">
                <img
                  src={resolveImageUrl(spotlightExperience.image_url) || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80'}
                  alt={spotlightExperience.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent lg:hidden" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-mono font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal" />
                  <span>Curator's Field Note</span>
                </div>
              </div>

              {/* Editorial Notes */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-clay font-semibold uppercase tracking-wider">
                    <span>{spotlightExperience.category || 'Living Heritage'}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-dusk">
                      <MapPin className="w-3 h-3 text-marigold" />
                      {spotlightExperience.city || spotlightExperience.city_name || 'India'}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink leading-tight">
                    {spotlightExperience.title}
                  </h2>

                  <p className="text-sm text-dusk-700 leading-relaxed font-sans line-clamp-3">
                    {spotlightExperience.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-paper-300 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono text-dusk uppercase tracking-wider block">Access Contribution</span>
                    <span className="text-xl font-display font-bold text-ink">
                      {spotlightExperience.price === 0 ? 'Open Heritage / Free' : `₹${spotlightExperience.price}`}
                    </span>
                  </div>

                  <Link
                    to={`/experience/${spotlightExperience.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink hover:bg-ink-700 text-white rounded-xl text-xs font-medium font-sans transition shadow-2xs"
                  >
                    <span>Read Field Note</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. LOKIVA MOMENTS - PHOTOGRAPHIC STORIES */}
        {experiences.length > 0 && (
          <LokivaMomentsSection experiences={experiences} selectedCity={locationInput} />
        )}

        {/* 6. THE FIELD ARCHIVE (EXPERIENCES GRID) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-paper-300">
            <div>
              <h3 className="text-2xl font-display font-bold text-ink tracking-tight">
                {activeCity ? `${activeCity} Cultural Catalog` : selectedState ? `${selectedState} Cultural Catalog` : 'National Cultural Catalog'}
              </h3>
              <p className="text-xs text-dusk font-mono mt-0.5">
                Showing {experiences.length} verified cultural encounters across traditions, crafts, and street food
              </p>
            </div>


            {/* Active Constraints Summary */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <span className="text-dusk text-[11px]">Filters:</span>
                {wheelchairOnly && (
                  <span className="px-2 py-0.5 bg-paper-100 border border-paper-300 rounded text-ink">
                    Wheelchair
                  </span>
                )}
                {lowWalkingOnly && (
                  <span className="px-2 py-0.5 bg-paper-100 border border-paper-300 rounded text-ink">
                    Low Walking
                  </span>
                )}
                {rainSafeOnly && (
                  <span className="px-2 py-0.5 bg-paper-100 border border-paper-300 rounded text-ink">
                    Rain Safe
                  </span>
                )}
                {maxPrice < MAX_BUDGET_CEILING && (
                  <span className="px-2 py-0.5 bg-paper-100 border border-paper-300 rounded text-ink font-mono text-[11px]">
                    ≤ ₹{maxPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-clay hover:underline text-[11px] cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Experience Grid State */}
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-dusk">
              <Loader2 className="w-8 h-8 text-marigold animate-spin" />
              <span>Querying field archives...</span>
            </div>
          ) : experiences.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-paper-100/90 border border-paper-300 rounded-2xl p-8 max-w-lg mx-auto">
              <Compass className="w-10 h-10 text-dusk-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-lg font-display font-bold text-ink">
                  No Field Entries Found
                </h4>
                <p className="text-xs text-dusk leading-relaxed">
                  No experiences currently match your selected query or filters. Try clicking an enclave like Jaipur or Kochi above, or reset filters.
                </p>
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 bg-ink text-paper rounded-xl text-xs font-medium hover:bg-ink-700 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {experiences.slice(0, visibleCount).map((exp) => (
                  <ExperienceCard key={exp.id} experience={exp} />
                ))}
              </div>

              {experiences.length > visibleCount && (
                <div className="pt-6 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 36)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink hover:bg-ink-700 text-white font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>Load More Cultural Encounters ({experiences.length - visibleCount} Remaining)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] font-mono text-dusk mt-2">
                    Displaying {Math.min(visibleCount, experiences.length)} of {experiences.length} verified places
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
