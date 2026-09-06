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
} from 'lucide-react';
import { USER_VERIFIED_PLACE_IDS } from '../data/userVerifiedPlaceIds';

const ENCLAVES = [
  { name: 'Varanasi', label: 'Varanasi' },
  { name: 'Jaipur', label: 'Jaipur' },
  { name: 'Mumbai', label: 'Mumbai' },
  { name: 'Delhi', label: 'Delhi' },
  { name: 'Udaipur', label: 'Udaipur' },
  { name: 'Kolkata', label: 'Kolkata' },
  { name: 'Almora', label: 'Almora' },
  { name: 'Agra', label: 'Agra' },
];

const THEMATIC_PERSPECTIVES = [
  { id: '', label: 'All Traditions' },
  { id: 'Art & Craft', label: 'Artisans & Guilds' },
  { id: 'Food & Culinary', label: 'Culinary Heritage' },
  { id: 'Heritage & History', label: 'Sacred Sites & Stepwells' },
  { id: 'Music & Dance', label: 'Music & Folklore' },
  { id: 'Nature & Wildlife', label: 'Wilderness & Terroir' },
  { id: 'Wellness & Spiritual', label: 'Spiritual & Contemplative' },
  { id: 'Local Markets', label: 'Bazaars & Flea Walks' },
];

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || searchParams.get('city') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBudget = searchParams.get('budget') ? parseInt(searchParams.get('budget')!, 10) : 5000;
  const initialWheelchair = searchParams.get('wheelchair') === 'true';
  const initialWalking = searchParams.get('walking') === 'true';

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(initialBudget);
  const [wheelchairOnly, setWheelchairOnly] = useState(initialWheelchair);
  const [lowWalkingOnly, setLowWalkingOnly] = useState(initialWalking);
  const [hiddenGemsOnly, setHiddenGemsOnly] = useState(false);
  const [rainSafeOnly, setRainSafeOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);

  // Active filter count for badge
  const activeFiltersCount =
    (wheelchairOnly ? 1 : 0) +
    (lowWalkingOnly ? 1 : 0) +
    (rainSafeOnly ? 1 : 0) +
    (maxPrice < 5000 ? 1 : 0);

  // Fast, instant experience fetcher querying local database directly
  const fetchExperiences = useCallback(
    async (loc = locationInput, query = searchQuery, cat = selectedCategory) => {
      setIsLoading(true);
      try {
        const data = await api.getExperiences({
          city: loc.trim() || undefined,
          category: cat || undefined,
          max_price: maxPrice,
          wheelchair: wheelchairOnly || undefined,
          low_walking: lowWalkingOnly || undefined,
          is_hidden_gem: hiddenGemsOnly || undefined,
          is_indoor: rainSafeOnly || undefined,
          search: query.trim() || undefined,
        });

        // Strictly show only places for which the user manually added verified links
        const verifiedOnly = (data || []).filter(
          (exp) =>
            USER_VERIFIED_PLACE_IDS.has(exp.id) ||
            exp.source === 'user_curated_unsplash'
        );

        const deduped = deduplicateExperienceList(verifiedOnly);
        setExperiences(deduped);

        if (loc.trim() && deduped.length === 0) {
          setFeedbackNote(`No experiences found matching "${loc.trim()}". Try another heritage enclave or reset filters.`);
        } else {
          setFeedbackNote(null);
        }
      } catch (err) {
        console.error('Failed to load experiences:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      locationInput,
      searchQuery,
      selectedCategory,
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
      fetchExperiences(locationInput, searchQuery, selectedCategory);
    }, 200);

    return () => clearTimeout(timer);
  }, [
    locationInput,
    searchQuery,
    selectedCategory,
    maxPrice,
    wheelchairOnly,
    lowWalkingOnly,
    hiddenGemsOnly,
    rainSafeOnly,
  ]);

  // Form submit: immediate instant query (no debounce wait)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExperiences(locationInput, searchQuery, selectedCategory);
  };

  // Instant enclave shortcut click
  const handleSelectEnclave = (enclaveName: string) => {
    setLocationInput(enclaveName);
    fetchExperiences(enclaveName, searchQuery, selectedCategory);
  };

  const clearAllFilters = () => {
    setWheelchairOnly(false);
    setLowWalkingOnly(false);
    setRainSafeOnly(false);
    setMaxPrice(5000);
    setSelectedCategory('');
    setSearchQuery('');
    setLocationInput('');
    setFeedbackNote(null);
  };

  // Curator's Spotlight: Pick the first experience
  const spotlightExperience = experiences.length > 0 ? experiences[0] : null;

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
            src="/assets/cultural/sitar-veena-cutout.png"
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
            src="/assets/cultural/royal-peacock-cutout.png"
            alt="Royal peacock cultural motif cutout"
            loading="lazy"
            className="w-full h-auto object-contain opacity-70 xl:opacity-80 filter drop-shadow-[0_8px_16px_rgba(18,33,59,0.06)]"
          />
        </div>
      </div>

      {/* 1. EDITORIAL MASTHEAD (Seamlessly integrated with bg-paper) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-4 sm:pt-2 sm:pb-5">
        <div className="max-w-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-clay font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>Lokiva Cultural Atlas & Field Guide</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-ink tracking-tight leading-tight">
            Explore Living Traditions
          </h1>
          <p className="text-sm sm:text-base text-dusk font-normal leading-relaxed">
            A curated field archive of artisan guilds, heritage sanctuaries, oral lineages, and culinary masters across India.
          </p>
        </div>
      </div>

      {/* 2. UNIFIED DISCOVERY BAR (Natural flow, NOT sticky, seamless paper card) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-0 mb-5">
        <div className="bg-paper-100/90 border border-paper-300 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          {/* Main Search Inputs Row */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
          >
            {/* Location Query */}
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-clay absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Region, town, or heritage enclave (e.g. Kochi, Jaipur, Almora)..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-paper-300 focus:border-ink rounded-xl text-xs sm:text-sm text-ink placeholder-dusk-400 focus:outline-none transition font-sans shadow-2xs"
              />
            </div>

            {/* Keyword Query */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-dusk-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Art form, weaving guild, temple walk, culinary tour..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-paper-300 focus:border-ink rounded-xl text-xs sm:text-sm text-ink placeholder-dusk-400 focus:outline-none transition font-sans shadow-2xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 md:flex-none px-4 py-2.5 bg-ink hover:bg-ink-700 text-paper rounded-xl font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 whitespace-nowrap shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-marigold" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  activeFiltersCount > 0 || isFilterOpen
                    ? 'bg-ink-50 border-ink text-ink shadow-2xs'
                    : 'bg-white hover:bg-paper-200 border-paper-300 text-dusk shadow-2xs'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refine</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-clay text-white text-[10px] font-mono flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
                {isFilterOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>

          {/* Quick-Jump Enclaves Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [-webkit-overflow-scrolling:touch] text-xs">
            <span className="text-dusk font-mono uppercase text-[10px] tracking-wider whitespace-nowrap">
              Featured Enclaves:
            </span>
            {ENCLAVES.map((enc) => {
              const isSelected =
                locationInput.toLowerCase() === enc.name.toLowerCase() ||
                locationInput.toLowerCase() === enc.label.toLowerCase();
              return (
                <button
                  key={enc.name}
                  onClick={() => handleSelectEnclave(enc.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-white font-medium shadow-2xs'
                      : 'bg-white text-dusk-700 hover:bg-paper-200 border border-paper-300 shadow-2xs'
                  }`}
                >
                  {enc.label}
                </button>
              );
            })}
            {locationInput && (
              <button
                onClick={() => {
                  setLocationInput('');
                  fetchExperiences('', searchQuery, selectedCategory);
                }}
                className="text-clay hover:underline text-[11px] font-mono whitespace-nowrap ml-1 cursor-pointer"
              >
                Clear Location
              </button>
            )}
          </div>

          {/* Collapsible Refinement Drawer */}
          {isFilterOpen && (
            <div className="pt-3 border-t border-paper-300/80 space-y-3 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-ink hover:text-teal transition">
                    <input
                      type="checkbox"
                      checked={wheelchairOnly}
                      onChange={(e) => setWheelchairOnly(e.target.checked)}
                      className="rounded text-teal focus:ring-teal"
                    />
                    <span className="font-medium">Step-Free Wheelchair Access</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-ink hover:text-teal transition">
                    <input
                      type="checkbox"
                      checked={lowWalkingOnly}
                      onChange={(e) => setLowWalkingOnly(e.target.checked)}
                      className="rounded text-teal focus:ring-teal"
                    />
                    <span className="font-medium">Low Walking / Seated Immersion</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-ink hover:text-teal transition">
                    <input
                      type="checkbox"
                      checked={rainSafeOnly}
                      onChange={(e) => setRainSafeOnly(e.target.checked)}
                      className="rounded text-teal focus:ring-teal"
                    />
                    <span className="font-medium">100% Rain Safe / Covered</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-dusk">Budget Ceiling:</span>
                  <span className="font-bold text-ink font-mono">₹{maxPrice}</span>
                  <input
                    type="range"
                    min="300"
                    max="5000"
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                    className="w-28 accent-ink cursor-pointer"
                  />
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-clay hover:underline ml-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
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
                Field Catalog
              </h3>
              <p className="text-xs text-dusk font-mono mt-0.5">
                Verified encounters across traditional guilds and heritage enclaves
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
                {maxPrice < 5000 && (
                  <span className="px-2 py-0.5 bg-paper-100 border border-paper-300 rounded text-ink">
                    ≤ ₹{maxPrice}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {experiences.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
