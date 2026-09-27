import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  ChevronDown,
  Compass,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import {
  IndiaVectorMap,
  REGIONS,
  RegionType,
  STATE_REGION_MAP,
} from '../components/discovery/IndiaVectorMap';
import { HeritageFlankClusters } from '../components/discovery/HeritageFlankClusters';
import { EditorialStateDossier } from '../components/discovery/EditorialStateDossier';
import {
  DiscoveryOnboardingFlow,
  DiscoveryAnswers,
} from '../components/onboarding/DiscoveryOnboardingFlow';
import { getStateDossier } from '../data/stateDossiersData';
import { getStateForCity } from '../data/places';
import { DigitalTwinMapLayer } from '../components/map/DigitalTwinMapLayer';
import { fetchDigitalTwinSimulation, fetchDigitalTwinCities } from '../lib/digitalTwinApi';
import { DigitalTwinSimulationData, WeatherConditionType } from '../types/digitalTwin';

// Map destination city or slug to Indian state name for the map
const CITY_TO_STATE: Record<string, string> = {
  jaipur: 'Rajasthan',
  jodhpur: 'Rajasthan',
  udaipur: 'Rajasthan',
  jaisalmer: 'Rajasthan',
  varanasi: 'Uttar Pradesh',
  agra: 'Uttar Pradesh',
  lucknow: 'Uttar Pradesh',
  delhi: 'Delhi',
  mumbai: 'Maharashtra',
  pune: 'Maharashtra',
  kochi: 'Kerala',
  alleppey: 'Kerala',
  munnar: 'Kerala',
  amritsar: 'Punjab',
  bengaluru: 'Karnataka',
  hampi: 'Karnataka',
  mysuru: 'Karnataka',
  chennai: 'Tamil Nadu',
  madurai: 'Tamil Nadu',
  kolkata: 'West Bengal',
  darjeeling: 'West Bengal',
  panaji: 'Goa',
  shimla: 'Himachal Pradesh',
  manali: 'Himachal Pradesh',
  srinagar: 'Jammu and Kashmir',
  leh: 'Ladakh',
  bhubaneswar: 'Odisha',
  puri: 'Odisha',
  guwahati: 'Assam',
  hyderabad: 'Telangana',
};

// Featured states for quick zero-state discovery
const FEATURED_STATES = [
  { name: 'Rajasthan', region: 'West India', tag: 'Desert Citadels & Havelis' },
  { name: 'Kerala', region: 'South India', tag: 'Spice Coast & Backwaters' },
  { name: 'Himachal Pradesh', region: 'North India', tag: 'Himalayan Valleys & Monasteries' },
  { name: 'Ladakh', region: 'North India', tag: 'High-Altitude Monastic Passes' },
  { name: 'Meghalaya', region: 'Northeast', tag: 'Living Root Bridges & Sacred Groves' },
  { name: 'Goa', region: 'West India', tag: 'Portuguese Baroque & Estuaries' },
];

export function DiscoveryMapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const routerState = (location.state as { solvedAnswers?: { city?: string } } | null) ?? {};

  const dossierSectionRef = useRef<HTMLDivElement>(null);
  const heroContainerRef = useRef<HTMLDivElement>(null);

  // Active regional filter
  const [activeRegion, setActiveRegion] = useState<RegionType>('All India');

  // Initialize selected state from URL search params or router state; strictly NO default ghost state
  const [selectedState, setSelectedState] = useState<string | null>(() => {
    const urlState = searchParams.get('state');
    if (urlState) return urlState;

    const urlCity = searchParams.get('city');
    if (urlCity && CITY_TO_STATE[urlCity.toLowerCase()]) {
      return CITY_TO_STATE[urlCity.toLowerCase()];
    }

    if (routerState.solvedAnswers?.city) {
      const mapped = CITY_TO_STATE[routerState.solvedAnswers.city.toLowerCase()];
      if (mapped) return mapped;
    }

    return null;
  });

  const [isGuidedFlowOpen, setIsGuidedFlowOpen] = useState<boolean>(() => {
    return searchParams.get('onboard') === 'true';
  });

  // Digital Twin in-place overlay state
  const [isWeatherTwinOverlayActive, setIsWeatherTwinOverlayActive] = useState<boolean>(false);
  const [twinCity, setTwinCity] = useState<string>('Jaipur');
  const [twinCondition, setTwinCondition] = useState<WeatherConditionType>('rain');
  const [twinSimulation, setTwinSimulation] = useState<DigitalTwinSimulationData | null>(null);
  const [availableTwinCities, setAvailableTwinCities] = useState<{ id: string; name: string; state: string }[]>([
    { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
  ]);

  useEffect(() => {
    fetchDigitalTwinCities()
      .then((cities) => {
        if (Array.isArray(cities) && cities.length > 0) {
          setAvailableTwinCities(cities);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isWeatherTwinOverlayActive) return;
    fetchDigitalTwinSimulation(twinCity, twinCondition)
      .then((data) => setTwinSimulation(data))
      .catch((err) => console.error('Error loading discovery twin:', err));
  }, [isWeatherTwinOverlayActive, twinCity, twinCondition]);

  // Sync selected state to URL query parameter cleanly without reload
  useEffect(() => {
    const currentParam = searchParams.get('state');
    if (selectedState) {
      if (currentParam !== selectedState) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('state', selectedState);
        setSearchParams(newParams, { replace: true });
      }
    } else if (currentParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('state');
      setSearchParams(newParams, { replace: true });
    }
  }, [selectedState, searchParams, setSearchParams]);

  /**
   * Handle region selection from top sub-header ribbon
   * Clears any active state selection so ghost highlights never persist across regions
   */
  const handleRegionChange = (region: RegionType) => {
    setActiveRegion(region);
    setSelectedState(null);
  };

  /**
   * When any state is clicked on the map or quick list:
   * Sets active state, syncs region if needed, and smoothly scrolls to the dossier section
   */
  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);

    const stateRegion = STATE_REGION_MAP[stateName];
    if (stateRegion && activeRegion !== 'All India' && activeRegion !== stateRegion) {
      setActiveRegion(stateRegion);
    }

    if (dossierSectionRef.current) {
      const offsetTop = dossierSectionRef.current.offsetTop - 70;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  const handleDiscoveryFlowComplete = (answers: DiscoveryAnswers) => {
    setIsGuidedFlowOpen(false);
    if (answers.destination && answers.destination !== 'Smart Match') {
      const mappedState = getStateForCity(answers.destination);
      if (mappedState && mappedState !== 'India') {
        setSelectedState(mappedState);
        handleStateSelect(mappedState);
        return;
      }
    }
    setSelectedState('Rajasthan');
    handleStateSelect('Rajasthan');
  };

  const currentDossier = selectedState ? getStateDossier(selectedState) : null;

  return (
    <div className="w-full min-h-screen bg-transparent text-[#12213B] selection:bg-[#C85A32] selection:text-white">
      {/* Top Dedicated Sub-Header Ribbon (Outside the map viewport) */}
      <header className="sticky top-0 z-30 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DFD5] px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Home Navigation */}
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E5DFD5] text-xs font-mono font-bold text-[#12213B] hover:text-[#C85A32] hover:border-[#C85A32] transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4 text-[#C85A32]" />
            <span>Home</span>
          </Link>

          {/* Center: Dedicated Region Filter Ribbon */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-[#E5DFD5] shadow-2xs overflow-x-auto max-w-full scrollbar-none">
            {REGIONS.map((region) => {
              const isActive = activeRegion === region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleRegionChange(region)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-heading font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#C85A32] text-white shadow-xs'
                      : 'bg-transparent text-[#12213B] hover:bg-[#FAF7F2] hover:text-[#C85A32]'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsWeatherTwinOverlayActive(!isWeatherTwinOverlayActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold shadow-2xs transition-colors shrink-0 cursor-pointer ${
                isWeatherTwinOverlayActive
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300'
              }`}
              title="Toggle Live Weather Radar & Impact Simulation Layer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              <span>{isWeatherTwinOverlayActive ? '🗺️ Heritage Map' : '🌧️ Weather Radar Twin'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGuidedFlowOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-white text-[#C85A32] border border-[#E5DFD5] hover:border-[#C85A32] text-xs font-heading font-extrabold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D99B43]" />
              <span className="hidden sm:inline">Guided Match Quiz</span>
              <span className="sm:hidden">Quiz</span>
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: FULL-VIEWPORT HERO MAP CANVAS (Unobstructed by navigation bars) */}
      <section
        ref={heroContainerRef}
        className="w-full h-[78vh] sm:h-[82vh] relative overflow-hidden bg-[#FAF7F2] border-b border-[#E5DFD5]"
        aria-label="Interactive Pan-India Discovery Map"
      >
        {isWeatherTwinOverlayActive && twinSimulation ? (
          <div className="w-full h-full p-2 sm:p-4">
            <DigitalTwinMapLayer
              simulation={twinSimulation}
              activeCondition={twinCondition}
              onConditionChange={setTwinCondition}
              onCityChange={setTwinCity}
              availableCities={availableTwinCities}
              selectedCity={twinCity}
              focusCoordinate={null}
              onSelectSanctuary={() => {}}
              onSelectMonument={() => {}}
            />
          </div>
        ) : (
          <>
            {/* Full-Width Interactive Map Stage */}
            <IndiaVectorMap
              selectedState={selectedState}
              onSelectState={handleStateSelect}
              activeRegion={activeRegion}
              className="w-full h-full"
            />

            {/* Diagonal Heritage Flank Clusters with Corner-Reveal Entrances & Scroll Retraction */}
            <HeritageFlankClusters heroRef={heroContainerRef} />
          </>
        )}

        {/* Bottom Teaser Cue */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          {currentDossier ? (
            <button
              type="button"
              onClick={() => {
                if (dossierSectionRef.current) {
                  dossierSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-md text-xs font-mono font-bold text-[#12213B] hover:text-[#C85A32] hover:border-[#C85A32] transition-all cursor-pointer group"
            >
              <span>Explore {currentDossier.name} Cultural Dossier</span>
              <ChevronDown className="w-4 h-4 text-[#C85A32] group-hover:translate-y-0.5 transition-transform" />
            </button>
          ) : (
            <div className="pointer-events-none flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E5DFD5] shadow-xs text-xs font-mono font-bold text-dusk-600">
              <Compass className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Select any state on the map to unveil its cultural dossier</span>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: EDITORIAL STATE CULTURAL DOSSIER (Natural Scroll-Down) */}
      <main
        ref={dossierSectionRef}
        id="state-cultural-dossier"
        className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        {currentDossier ? (
          <EditorialStateDossier
            dossier={currentDossier}
            onLaunchCircuit={(title) => {
              const match = title.match(/\d+/);
              const days = match ? match[0] : '4';
              navigate(
                `/itinerary?city=${encodeURIComponent(currentDossier.name)}&days=${days}&pace=balanced`
              );
            }}
          />
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-white/80 backdrop-blur-md border border-[#E8DEC8] shadow-sm space-y-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DEC8] text-xs font-heading font-extrabold uppercase tracking-widest text-[#C85A32]">
                <Compass className="w-3.5 h-3.5" />
                <span>Living Heritage Dossier</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-[#1E2022]">
                Select Any State to Unveil Its Cultural Heritage
              </h2>
              <p className="text-sm sm:text-base font-sans text-[#1E2022]/75 leading-relaxed">
                Filter by geographic region above or tap any state boundary directly on the interactive vector canvas to unveil verified living traditions, seasonal calendars, signature gastronomic flavors, and curated routes.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#E8DEC8]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1E2022]/60 block">
                Featured Regional Dossiers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURED_STATES.map((state) => (
                  <button
                    key={state.name}
                    type="button"
                    onClick={() => handleStateSelect(state.name)}
                    className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-white border border-[#E8DEC8] hover:border-[#C85A32] text-left transition-all duration-200 cursor-pointer group space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C85A32]">
                        {state.region}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C85A32] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#1E2022] group-hover:text-[#C85A32] transition-colors">
                      {state.name}
                    </h3>
                    <p className="text-xs font-sans text-[#1E2022]/70">
                      {state.tag}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Optional Fullscreen Guided Onboarding Modal */}
      {isGuidedFlowOpen && (
        <DiscoveryOnboardingFlow
          isOpen={isGuidedFlowOpen}
          onClose={() => setIsGuidedFlowOpen(false)}
          onComplete={handleDiscoveryFlowComplete}
        />
      )}
    </div>
  );
}

export default DiscoveryMapPage;
