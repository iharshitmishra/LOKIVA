import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation,
  AlertTriangle,
  Shield,
  Radio,
  CloudRain,
  Sun,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  ArrowRight,
  CheckCircle2,
  Info,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { ItineraryDay } from '../../types/itinerary';
import { DigitalTwinSimulationData, VulnerableMonument } from '../../types/digitalTwin';
import { fetchDigitalTwinSimulation, fetchLiveWeather } from '../../lib/digitalTwinApi';
import { useItineraryStore } from '../../store/useItineraryStore';
import { generateCurvedFlightArc } from './ItineraryMapRoute';
import L from 'leaflet';

// CARTO Basemaps API Key
const HARDCODED_CARTO_API_KEY = 'cb1_2x3k_1_ad093820ec995z1ca03fd4793';

interface ItineraryMapViewProps {
  days: ItineraryDay[];
  selectedDayNumber?: number;
  activeStopId?: number | null;
  hoveredStopId?: number | null;
  onSelectStop?: (stopId: number) => void;
}

export function ItineraryMapView({
  days,
  selectedDayNumber,
  activeStopId,
  hoveredStopId,
  onSelectStop,
}: ItineraryMapViewProps) {
  const { tripDetails, replanDay } = useItineraryStore();
  const destinationCity = tripDetails?.destination || 'Jaipur';

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | 'all'>(
    selectedDayNumber !== undefined ? selectedDayNumber - 1 : 0
  );

  // Digital Twin state
  const [digitalTwinActive, setDigitalTwinActive] = useState<boolean>(false);
  const [isWhatIfExpanded, setIsWhatIfExpanded] = useState<boolean>(false);
  const [rainfallIntensity, setRainfallIntensity] = useState<number>(45);
  const [temperature, setTemperature] = useState<number>(26);
  const [floodDepth, setFloodDepth] = useState<number>(24);
  const [stormDuration, setStormDuration] = useState<number>(3.5);
  const [simulation, setSimulation] = useState<DigitalTwinSimulationData | null>(null);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [loadingTwin, setLoadingTwin] = useState<boolean>(false);
  const [rerouteSuccessToast, setRerouteSuccessToast] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const polylineGlowRef = useRef<L.Polyline | null>(null);
  const twinLayersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (selectedDayNumber !== undefined) {
      setSelectedDayIndex(selectedDayNumber - 1);
    }
  }, [selectedDayNumber]);

  const displayedDays =
    selectedDayIndex === 'all'
      ? days
      : days[selectedDayIndex as number]
      ? [days[selectedDayIndex as number]]
      : days;

  const allDisplayedActivities = displayedDays.flatMap((d) =>
    d.activities.map((act) => ({ ...act, dayNum: d.dayNumber }))
  );

  // Load Digital Twin simulation data when digital twin overlay is active or What-If sliders move
  useEffect(() => {
    if (!digitalTwinActive) return;

    let isMounted = true;
    setLoadingTwin(true);

    Promise.all([
      fetchDigitalTwinSimulation(destinationCity, 'rain', {
        rainfallIntensity,
        temperature,
        stormDuration,
        floodDepth,
      }),
      fetchLiveWeather(destinationCity).catch(() => null),
    ])
      .then(([simData, weatherData]) => {
        if (isMounted) {
          setSimulation(simData);
          if (weatherData) setLiveWeather(weatherData);
          setLoadingTwin(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load itinerary digital twin:', err);
        if (isMounted) setLoadingTwin(false);
      });

    return () => {
      isMounted = false;
    };
  }, [digitalTwinActive, destinationCity, rainfallIntensity, temperature, stormDuration, floodDepth]);

  // Check if any displayed activities match vulnerable outdoor monuments
  const vulnerableStopsInView = React.useMemo(() => {
    if (!simulation || !digitalTwinActive) return [];
    const monNames = simulation.vulnerableMonuments.map((m) => m.name.toLowerCase());

    return allDisplayedActivities.filter((act) => {
      const titleLower = act.title.toLowerCase();
      const locLower = (act.location || '').toLowerCase();
      return monNames.some((mName) => {
        const keyword = mName.split(' ')[0].toLowerCase();
        return titleLower.includes(keyword) || locLower.includes(keyword);
      });
    });
  }, [simulation, digitalTwinActive, allDisplayedActivities]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous base itinerary markers & polylines
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (polylineGlowRef.current) {
      polylineGlowRef.current.remove();
      polylineGlowRef.current = null;
    }

    const validCoordStops = allDisplayedActivities
      .map((a) => {
        const lat = a.lat ?? a.coordinates?.[0];
        const lng = a.lng ?? a.coordinates?.[1];
        return { ...a, resolvedLat: lat, resolvedLng: lng };
      })
      .filter(
        (a): a is typeof a & { resolvedLat: number; resolvedLng: number } =>
          typeof a.resolvedLat === 'number' &&
          typeof a.resolvedLng === 'number' &&
          !isNaN(a.resolvedLat) &&
          !isNaN(a.resolvedLng)
      );

    if (validCoordStops.length > 0) {
      const latLngs: [number, number][] = [];

      validCoordStops.forEach((stop, idx) => {
        const lat = stop.resolvedLat;
        const lng = stop.resolvedLng;
        latLngs.push([lat, lng]);

        const isStart = idx === 0;
        const isActive = activeStopId === stop.id || hoveredStopId === stop.id;

        // Check if this stop matches a vulnerable outdoor monument in the simulation
        const matchedHazard =
          digitalTwinActive && simulation
            ? simulation.vulnerableMonuments.find((m) => {
                const keyword = m.name.split(' ')[0].toLowerCase();
                return (
                  stop.title.toLowerCase().includes(keyword) ||
                  (stop.location || '').toLowerCase().includes(keyword)
                );
              })
            : null;

        // Custom tactile pulsing beacon with hazard ring if affected by weather
        const pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isActive ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            ${
              matchedHazard
                ? '<div class="absolute -inset-3.5 rounded-full bg-red-600/40 animate-ping pointer-events-none"></div><div class="absolute -inset-2 rounded-full bg-red-500/50 animate-pulse pointer-events-none"></div>'
                : isStart
                ? '<div class="absolute -inset-2.5 rounded-full bg-[#C85A32]/25 start-beacon-ripple pointer-events-none"></div>'
                : ''
            }
            <div class="absolute -inset-1 rounded-full ${
              matchedHazard ? 'bg-red-500/40' : 'bg-amber-400/35'
            } beacon-pulse-ring pointer-events-none"></div>
            <div class="relative w-8 h-8 rounded-full ${
              matchedHazard
                ? 'bg-red-600 ring-4 ring-red-400/80 shadow-xl'
                : isActive
                ? 'bg-[#C85A32] ring-4 ring-amber-400/80 shadow-xl'
                : 'bg-[#C85A32] shadow-md border-[2.5px] border-[#FAF7F2]'
            } text-white font-heading font-extrabold text-xs flex items-center justify-center">
              ${matchedHazard ? '⚠️' : idx + 1}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: pinHtml,
          className: 'custom-compass-beacon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2.5 font-sans space-y-1.5 min-w-[210px]">
              <div class="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-[#C85A32]">
                <span>Stop ${idx + 1} · Day ${stop.dayNum}</span>
                ${matchedHazard ? '<span class="text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Weather Risk</span>' : ''}
              </div>
              <strong class="text-xs font-heading font-bold block text-slate-900">${stop.title}</strong>
              <p class="text-[11px] text-stone-600">${stop.location}</p>
              ${
                matchedHazard
                  ? `<div class="mt-1.5 p-2 bg-red-50 rounded-lg border border-red-200 text-[11px] text-red-800 space-y-1">
                      <div class="font-bold flex items-center gap-1">⚠️ ${matchedHazard.hazardType}</div>
                      <div>Displaced Headcount: <strong>${matchedHazard.displacedHeadcount} travelers</strong></div>
                      <div class="text-[10px] text-emerald-800 font-semibold">Recommended Shelter: ${matchedHazard.recommendedShelterName || 'Artisan Haveli'}</div>
                    </div>`
                  : ''
              }
              <div class="text-[10px] font-mono text-stone-700 pt-1 border-t border-[#E5DFD5]">
                ${stop.costPerPerson === 0 ? 'Free Open Heritage' : '₹' + stop.costPerPerson + ' / person'}
              </div>
            </div>
          `);

        marker.on('click', () => {
          onSelectStop?.(stop.id);
          const el = document.getElementById(`itinerary-stop-${stop.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        markersRef.current[stop.id] = marker;
      });

      // Render smooth curved flight arc between sequential stops
      if (validCoordStops.length > 1) {
        const curvedLatLngs = generateCurvedFlightArc(
          validCoordStops.map((s) => ({ lat: s.resolvedLat, lng: s.resolvedLng }))
        );

        polylineGlowRef.current = L.polyline(curvedLatLngs, {
          color: digitalTwinActive ? '#93C5FD' : '#E8DEC8',
          weight: 4,
          opacity: 0.75,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'corridor-base-track',
        }).addTo(map);

        polylineRef.current = L.polyline(curvedLatLngs, {
          color: digitalTwinActive ? '#2563EB' : '#C85A32',
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'animated-corridor-flow',
        }).addTo(map);
      }

      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 15 });
    }

    // Cleanup and render Digital Twin layers
    twinLayersRef.current.forEach((l) => l.remove());
    twinLayersRef.current = [];

    if (digitalTwinActive && simulation) {
      // Weather radar circle removed

      // 2. Safe Indoor Sanctuaries (Guilds & Havelis)
      simulation.safeSanctuaries.forEach((s) => {
        const sanctuaryHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
            <div class="absolute -inset-2.5 rounded-full bg-emerald-500/30 animate-pulse"></div>
            <div class="px-2.5 py-1 rounded-full bg-emerald-700 text-white font-heading font-extrabold text-[10px] flex items-center gap-1.5 border-2 border-white shadow-lg whitespace-nowrap">
              <span>🛡️</span>
              <span>${s.name.split(' ')[0]}</span>
              <span class="bg-emerald-950/60 px-1 rounded text-[9px] font-mono text-emerald-200"> seats</span>
            </div>
          </div>
        `;

        const sIcon = L.divIcon({
          html: sanctuaryHtml,
          className: 'sanctuary-pin',
          iconSize: [110, 28],
          iconAnchor: [55, 14],
        });

        const sMarker = L.marker([s.lat, s.lng], { icon: sIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2.5 space-y-1 text-xs">
              <div class="font-bold text-emerald-800 flex items-center gap-1">🛡️ Safe Haven: ${s.name}</div>
              <div class="text-stone-600">${s.category}</div>
              <div class="text-[11px] text-stone-700">Open Shelter Capacity: <strong> seats available</strong></div>
              <div class="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-1.5 rounded border border-emerald-200">
                100% Covered Indoors · Priority Tourist Absorption
              </div>
            </div>
          `);
        twinLayersRef.current.push(sMarker);
      });

      // 3. Transit Congestion Vectors
      simulation.transitVectors.forEach((tv) => {
        const poly = L.polyline(tv.coordinates, {
          color: tv.color || '#EF4444',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8',
          className: 'transit-flow-line',
        })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 text-xs space-y-1">
              <div class="font-bold text-red-600">${tv.name}</div>
              <div>Status: <strong>${tv.status}</strong></div>
              <div>Delay: <strong>+${tv.delayMinutes} mins</strong> (Normal: ${tv.normalDurationMins}m)</div>
              <div>Waterlogging: <strong>${tv.waterDepthCm || 15} cm depth</strong></div>
            </div>
          `);
        twinLayersRef.current.push(poly);
      });

      // 4. Social Ground Signal Pins
      simulation.socialSignals.slice(0, 4).forEach((sig) => {
        const platformBadge =
          sig.platform === 'x'
            ? '𝕏'
            : sig.platform === 'reddit'
            ? 'r/'
            : sig.platform === 'instagram'
            ? 'IG'
            : '📡';

        const sigHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
            <div class="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-[9px] flex items-center justify-center border-2 border-white shadow-md">
              ${platformBadge}
            </div>
          </div>
        `;

        const sigIcon = L.divIcon({
          html: sigHtml,
          className: 'social-pin',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const sigMarker = L.marker([sig.lat, sig.lng], { icon: sigIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 text-xs space-y-1 max-w-[220px]">
              <div class="font-bold text-sky-800 flex items-center justify-between">
                <span>${sig.authorName}</span>
                <span class="text-[9px] text-stone-400 font-mono">${sig.timeAgo}</span>
              </div>
              <p class="text-[11px] text-stone-700 leading-snug">${sig.text}</p>
              <div class="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-200">
                ${sig.locationName} · ${sig.upvotes} upvotes
              </div>
            </div>
          `);
        twinLayersRef.current.push(sigMarker);
      });
    }

    return () => {
      // Map cleanup if unmounted
    };
  }, [
    allDisplayedActivities.length,
    selectedDayIndex,
    activeStopId,
    hoveredStopId,
    digitalTwinActive,
    simulation,
  ]);

  // Handle 1-Click Weather Re-Routing action
  const handleWeatherReroute = () => {
    const currentDayNum = selectedDayIndex === 'all' ? 1 : Number(selectedDayIndex) + 1;
    replanDay(currentDayNum, 'rain');
    setRerouteSuccessToast(
      `Weather Protocol Applied to Day ${currentDayNum}! Swapped exposed outdoor ramparts with covered artisan havelis (Kripal Blue Pottery & Anokhi Textile Museum).`
    );
    setTimeout(() => setRerouteSuccessToast(null), 6000);
  };

  return (
    <div className="bg-[#FAF7F2] rounded-2xl border border-[#E5DFD5] p-4 sm:p-6 space-y-4 shadow-sm">
      {/* 1. Header Ribbon with Day Selector & Digital Twin Overlay Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E5DFD5]">
        <div className="flex items-center gap-3">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C85A32]" />
            </span>
            <span className="text-xs font-meta font-bold uppercase tracking-wider text-neutral-800">
              {selectedDayIndex === 'all'
                ? 'All Days Corridor'
                : `Day ${Number(selectedDayIndex) + 1} Route Flow`}
            </span>
          </div>

          {/* Digital Twin Active Badge */}
          {digitalTwinActive && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-heading font-extrabold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Digital Twin Radar Active</span>
            </div>
          )}
        </div>

        {/* Right Action Controls: Days Filter + Digital Twin Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day selection chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedDayIndex('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold transition cursor-pointer ${
                selectedDayIndex === 'all'
                  ? 'bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] shadow-2xs'
                  : 'bg-white text-[#3B2316] hover:bg-[#FAF8F5] border border-[#E5DFD5]'
              }`}
            >
              All Days
            </button>
            {days.map((day, idx) => (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold transition cursor-pointer ${
                  selectedDayIndex === idx
                    ? 'bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] shadow-2xs'
                    : 'bg-white text-[#3B2316] hover:bg-[#FAF8F5] border border-[#E5DFD5]'
                }`}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>

          {/* Digital Twin Overlay Toggle Switch */}
          <button
            type="button"
            onClick={() => setDigitalTwinActive(!digitalTwinActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold transition cursor-pointer flex items-center gap-2 shadow-2xs ${
              digitalTwinActive
                ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                : 'bg-white text-sky-900 hover:bg-sky-50 border border-sky-300'
            }`}
            title="Toggle Live Geospatial Weather Radar & Impact Overlay on your Itinerary"
          >
            <CloudRain className={`w-3.5 h-3.5 ${digitalTwinActive ? 'text-white' : 'text-sky-600'}`} />
            <span>{digitalTwinActive ? 'Weather Twin: ON' : '🌧️ Weather Twin Overlay'}</span>
          </button>
        </div>
      </div>

      {/* 2. Reroute Success Toast Notification */}
      {rerouteSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{rerouteSuccessToast}</span>
          </div>
          <button
            onClick={() => setRerouteSuccessToast(null)}
            className="p-1 text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. In-Map Alert & 1-Click Rerouting Banner when Weather Overlay is Active */}
      {digitalTwinActive && (
        <div className="bg-linear-to-r from-amber-50 via-sky-50 to-emerald-50 border border-amber-300/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Geospatial Impact Detected</span>
              </span>
              {liveWeather && (
                <span className="text-[11px] font-mono text-sky-900 font-bold bg-sky-200/60 px-2 py-0.5 rounded">
                  🟢 Open-Meteo Live: {liveWeather.temperature_c}°C · {liveWeather.relative_humidity_percent}% Humidity
                </span>
              )}
            </div>
            <p className="text-xs text-stone-800 leading-snug">
              {vulnerableStopsInView.length > 0 ? (
                <>
                  <strong>{vulnerableStopsInView.length} stops</strong> on Day{' '}
                  {selectedDayIndex !== 'all' ? Number(selectedDayIndex) + 1 : 1} are exposed to flash flood runoff. Nearby artisan havelis have{' '}
                  <strong>{simulation?.simulationMetrics.totalShelterAvailableSeats || 38} open seats</strong>.
                </>
              ) : (
                <>
                  Monsoon precipitation active over {destinationCity}. Transit delays on connecting vectors averages{' '}
                  <strong>+{simulation?.simulationMetrics.averageTransitDelayMinutes || 24} mins</strong>.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsWhatIfExpanded(!isWhatIfExpanded)}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-800 border border-stone-300 hover:border-slate-800 text-xs font-heading font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-700" />
              <span>What-If Sim</span>
              {isWhatIfExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleWeatherReroute}
              className="px-3.5 py-1.5 rounded-xl bg-[#C85A32] hover:bg-[#A83E1B] text-white text-xs font-heading font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Reroute to Sanctuaries</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Interactive What-If Counterfactual Simulation Drawer */}
      {digitalTwinActive && isWhatIfExpanded && (
        <div className="p-4 bg-white rounded-2xl border border-sky-200 shadow-sm space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h4 className="text-xs font-heading font-extrabold text-[#12213B] uppercase tracking-wider">
                Digital Twin Counterfactual What-If Simulator
              </h4>
            </div>
            <span className="text-[10px] font-mono text-stone-500">
              Drag parameters to evaluate cascading effects on your itinerary
            </span>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rainfall Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-sky-50/60 border border-sky-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-950 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                  <span>Rainfall Rate</span>
                </span>
                <span className="font-mono font-bold text-sky-700">{rainfallIntensity} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={rainfallIntensity}
                onChange={(e) => setRainfallIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                <span>0 (Dry)</span>
                <span>45 (Monsoon)</span>
                <span>100 (Cloudburst)</span>
              </div>
            </div>

            {/* Flood Depth Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-950 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Waterlogging</span>
                </span>
                <span className="font-mono font-bold text-blue-700">{floodDepth} cm</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="2"
                value={floodDepth}
                onChange={(e) => setFloodDepth(Number(e.target.value))}
                className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                <span>0 cm</span>
                <span>20 cm (Pooling)</span>
                <span>50 cm (Flooded)</span>
              </div>
            </div>

            {/* Ambient Temperature Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Temperature</span>
                </span>
                <span className="font-mono font-bold text-amber-700">{temperature}°C</span>
              </div>
              <input
                type="range"
                min="15"
                max="48"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                <span>15°C (Cool)</span>
                <span>32°C</span>
                <span>48°C (Heatwave)</span>
              </div>
            </div>

            {/* Storm Duration Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-950 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Storm Duration</span>
                </span>
                <span className="font-mono font-bold text-purple-700">{stormDuration} hrs</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={stormDuration}
                onChange={(e) => setStormDuration(Number(e.target.value))}
                className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                <span>1 hr</span>
                <span>4 hrs</span>
                <span>8 hrs</span>
              </div>
            </div>
          </div>

          {/* AI Counterfactual Summary Callout */}
          {simulation?.counterfactualInsight && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900">AI Counterfactual Model Projection:</span>
                <p className="leading-relaxed">{simulation.counterfactualInsight}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-[420px] rounded-2xl border border-[#E5DFD5] overflow-hidden shadow-inner z-10 relative"
      />

      {/* 6. Route Summary Strip & Digital Twin Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-dusk bg-white p-3 rounded-xl border border-[#E5DFD5]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>{allDisplayedActivities.length} Sequential Stops</span>
          </div>

          {digitalTwinActive && simulation && (
            <div className="flex items-center gap-2 text-stone-600 hidden sm:flex">
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <Shield className="w-3 h-3" />
                {simulation.simulationMetrics.totalShelterAvailableSeats} Open Haveli Seats
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-700 font-bold">
                <Clock className="w-3 h-3" />
                +{simulation.simulationMetrics.averageTransitDelayMinutes}m Road Delay
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {digitalTwinActive ? (
            <div className="flex items-center gap-2 text-[11px] font-sans">
              <span className="flex items-center gap-1 text-red-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                Hazard Rings
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Indoor Havelis
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDigitalTwinActive(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-sans font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              <span>Simulate Weather Impact on Route →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default ItineraryMapView;
