import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Navigation,
  Footprints,
  Zap,
  Maximize2,
  Download,
  Car,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import L from 'leaflet';
import { ItineraryDay, ItineraryActivity } from '../../types/itinerary';
import { generateCurvedFlightArc } from './ItineraryMapRoute';

// CARTO Basemaps API Key
const HARDCODED_CARTO_API_KEY = 'cb1_2x3k_1_ad093820ec995z1ca03fd4793';

interface RouteDispatchSidebarProps {
  day: ItineraryDay;
  activeStopId: number | null;
  hoveredStopId?: number | null;
  onSelectStop: (id: number) => void;
  onExpandFullScreenMap: () => void;
}

export function RouteDispatchSidebar({
  day,
  activeStopId,
  hoveredStopId,
  onSelectStop,
  onExpandFullScreenMap,
}: RouteDispatchSidebarProps) {
  const activities = day.activities || [];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const polylineGlowRef = useRef<L.Polyline | null>(null);
  const polylinePulseRef = useRef<L.Polyline | null>(null);

  // Active stop computation
  const activeActivity =
    activities.find((a) => a.id === activeStopId) ||
    activities.find((a) => a.id === hoveredStopId) ||
    activities[0];
  const activeIndex = activeActivity ? activities.findIndex((a) => a.id === activeActivity.id) : 0;

  // Calculate live day telemetry metrics
  const totalTransitMins = activities.reduce((sum, a) => sum + (a.transitToNextMinutes || 15), 0);
  const totalExploreMins = activities.reduce((sum, a) => sum + (a.visitDurationMinutes || 60), 0);
  const totalKm = activities.reduce((sum, a) => sum + (a.transitDistanceKm || 1.8), 0);
  const estSteps = Math.round(totalKm * 1320 + activities.length * 280);

  // Feasibility barometer calculation
  const feasibilityScore = day.metrics?.paceScore
    ? Math.round(day.metrics.paceScore)
    : Math.min(98, Math.max(82, Math.round(100 - (totalTransitMins / (totalExploreMins + 1)) * 30)));

  // Extract valid stops with coordinates
  const validStops = activities
    .map((act) => {
      const lat = act.lat ?? act.coordinates?.[0];
      const lng = act.lng ?? act.coordinates?.[1];
      return { ...act, resolvedLat: lat, resolvedLng: lng };
    })
    .filter(
      (act): act is typeof act & { resolvedLat: number; resolvedLng: number } =>
        typeof act.resolvedLat === 'number' &&
        typeof act.resolvedLng === 'number' &&
        !isNaN(act.resolvedLat) &&
        !isNaN(act.resolvedLng)
    );

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([20.5937, 78.9629], 12);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers and polylines
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    if (polylineGlowRef.current) {
      polylineGlowRef.current.remove();
      polylineGlowRef.current = null;
    }
    if (polylinePulseRef.current) {
      polylinePulseRef.current.remove();
      polylinePulseRef.current = null;
    }

    if (validStops.length > 0) {
      const latLngs: [number, number][] = validStops.map((s) => [s.resolvedLat, s.resolvedLng]);

      // Render smooth curved flight arc between sequential stops
      if (validStops.length > 1) {
        const curvedLatLngs = generateCurvedFlightArc(
          validStops.map((s) => ({ lat: s.resolvedLat, lng: s.resolvedLng }))
        );

        // 1. Base Track Layer (Solid Champagne/Sandstone Grounded Corridor)
        polylineGlowRef.current = L.polyline(curvedLatLngs, {
          color: '#E8DEC8',
          weight: 4,
          opacity: 0.75,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'corridor-base-track',
        }).addTo(map);

        // 2. Active Illuminated Flight Pulse (Traveling Luminous Front Glow)
        polylinePulseRef.current = L.polyline(curvedLatLngs, {
          color: '#C85A32',
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'animated-corridor-flow',
        }).addTo(map);
      }

      // 3. Tactile Pulsing Beacons with Departure Ripple on Stop 1
      validStops.forEach((stop, idx) => {
        const isStart = idx === 0;
        const isSelected = activeStopId === stop.id || hoveredStopId === stop.id;

        const beaconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            ${
              isStart
                ? '<div class="absolute -inset-2.5 rounded-full bg-[#C85A32]/25 start-beacon-ripple pointer-events-none"></div>'
                : ''
            }
            <div class="absolute -inset-1 rounded-full bg-amber-400/35 beacon-pulse-ring pointer-events-none"></div>
            <div class="relative w-7 h-7 rounded-full ${
              isSelected
                ? 'bg-[#C85A32] ring-4 ring-amber-400/80 shadow-xl'
                : 'bg-[#C85A32] shadow-md border-[2.5px] border-[#FAF7F2]'
            } text-white font-heading font-extrabold text-[11px] flex items-center justify-center">
              ${idx + 1}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: beaconHtml,
          className: 'custom-compass-beacon',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([stop.resolvedLat, stop.resolvedLng], { icon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 font-sans space-y-1 text-neutral-900 min-w-[170px]">
              <span class="text-[10px] font-mono text-[#C85A32] font-bold uppercase block">
                Stop ${idx + 1} · ${stop.timeRange || stop.startTime || ''}
              </span>
              <strong class="text-xs font-heading font-bold block text-neutral-900">${stop.title}</strong>
              <p class="text-[11px] text-neutral-600 line-clamp-1">${stop.location || ''}</p>
            </div>
          `);

        marker.on('click', () => {
          onSelectStop(stop.id);
          const el = document.getElementById(`itinerary-stop-${stop.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        markersRef.current[stop.id] = marker;
      });

      // Fit map bounds to encompass all stops
      map.fitBounds(L.latLngBounds(latLngs), { padding: [35, 35], maxZoom: 15 });
    }
  }, [day.dayNumber, validStops.length]);

  // Center smoothly on active stop when selected or hovered
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const targetId = activeStopId ?? hoveredStopId;
    if (targetId && markersRef.current[targetId]) {
      const marker = markersRef.current[targetId];
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
      marker.openPopup();
    }
  }, [activeStopId, hoveredStopId]);

  // Handler to fit bounds manually
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || validStops.length === 0) return;
    const latLngs: [number, number][] = validStops.map((s) => [s.resolvedLat, s.resolvedLng]);
    mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), {
      padding: [35, 35],
      maxZoom: 15,
      animate: true,
    });
  };

  // Handler to export GeoJSON route file
  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: validStops.map((s) => [s.resolvedLng, s.resolvedLat]),
          },
          properties: {
            dayNumber: day.dayNumber,
            dayTitle: day.title,
            stopsCount: validStops.length,
            totalDistanceKm: totalKm,
          },
        },
        ...validStops.map((s, idx) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [s.resolvedLng, s.resolvedLat],
          },
          properties: {
            stopNumber: idx + 1,
            title: s.title,
            category: s.category,
            startTime: s.startTime,
            location: s.location,
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Day-${day.dayNumber}-Route.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* ── MODULE 1: COMPACT ANIMATED MAP CANVAS ── */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E8DEC8] bg-[#FAF7F2] shadow-sm">
        {/* Top Floating Glass Header */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto bg-[#FAF7F2]/95 backdrop-blur-md border border-[#E8DEC8] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C85A32]" />
            </span>
            <span className="text-[11px] font-meta font-bold uppercase tracking-wider text-neutral-800">
              Day {day.dayNumber} Transit Corridor
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleFitBounds}
              className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#E8DEC8] hover:border-[#C85A32] text-neutral-700 shadow-xs transition cursor-pointer"
              title="Fit Route Bounds"
            >
              <Compass className="w-3.5 h-3.5 text-[#C85A32]" />
            </button>
            <button
              type="button"
              onClick={onExpandFullScreenMap}
              className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#E8DEC8] hover:border-[#C85A32] text-neutral-700 shadow-xs transition cursor-pointer"
              title="Expand Full Screen Map"
            >
              <Maximize2 className="w-3.5 h-3.5 text-neutral-700" />
            </button>
          </div>
        </div>

        {/* Embedded Leaflet Map Viewport */}
        <div className="w-full h-[310px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        {/* Bottom Floating Scrubber Chips */}
        <div className="p-3 bg-white/95 backdrop-blur-md border-t border-[#E8DEC8] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {activities.map((act, idx) => {
            const isSelected = (activeStopId ?? hoveredStopId) === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  onSelectStop(act.id);
                  const el = document.getElementById(`itinerary-stop-${act.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-meta font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-neutral-100 text-neutral-700 border border-[#E8DEC8]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isSelected ? 'bg-white text-[#C85A32]' : 'bg-[#E8DEC8] text-neutral-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="truncate max-w-[90px]">{act.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MODULE 2: SPATIOTEMPORAL TELEMETRY HUD ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-[#E8DEC8] shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-heading font-bold text-neutral-900">
              Spatial Cadence & Energy
            </span>
          </div>
          <span className="text-[11px] font-meta text-[#9E5414] bg-[#FAF0DF] border border-[#F2D5A7] px-2 py-0.5 rounded-full font-bold">
            Feasible ({feasibilityScore}% Fit)
          </span>
        </div>

        {/* Time Distribution Ratio Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-meta text-[#7A5C49]">
            <span>
              Sightseeing ({Math.round(totalExploreMins / 60)}h {totalExploreMins % 60}m)
            </span>
            <span>Transit ({totalTransitMins}m)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#EFE8DC] overflow-hidden flex">
            <div
              className="h-full bg-[#B84A27] rounded-l-full transition-all duration-500"
              style={{
                width: `${(totalExploreMins / (totalExploreMins + totalTransitMins || 1)) * 100}%`,
              }}
              title="Sightseeing time"
            />
            <div
              className="h-full bg-[#D47A39] rounded-r-full transition-all duration-500"
              style={{
                width: `${(totalTransitMins / (totalExploreMins + totalTransitMins || 1)) * 100}%`,
              }}
              title="Transit buffer"
            />
          </div>
        </div>

        {/* Quick Physical Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#E6DAC6]/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FAF0DF] text-[#B84A27]">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="font-meta text-[11px] font-bold uppercase tracking-wider text-[#7A5C49] block">
                Distance
              </span>
              <span className="font-meta text-sm font-bold text-[#3B2316]">
                {totalKm.toFixed(1)} km Total
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#E6DAC6]/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FAF0DF] text-[#9E5414] border border-[#F2D5A7]">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <span className="font-meta text-[11px] font-bold uppercase tracking-wider text-[#7A5C49] block">
                Footsteps
              </span>
              <span className="font-meta text-sm font-bold text-[#3B2316]">
                ~{estSteps.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── MODULE 3: ACTIVE STOP HOVER / NEXT TRANSIT CARD ── */}
      {activeActivity && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeActivity.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#E8DEC8] shadow-xs space-y-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#C85A32] text-white flex items-center justify-center font-heading font-bold text-sm shrink-0 shadow-xs">
                {activeIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-meta font-bold uppercase text-[#C85A32] truncate">
                    {activeActivity.category}
                  </span>
                  <span className="text-[11px] font-meta text-neutral-500 font-medium shrink-0">
                    {activeActivity.startTime || activeActivity.timeRange}
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold text-neutral-900 truncate">
                  {activeActivity.title}
                </h4>
                <p className="font-meta text-xs font-medium tracking-wide text-neutral-600 line-clamp-1 mt-0.5">
                  {activeActivity.gettingThere ||
                    (activeIndex < activities.length - 1
                      ? `Next Transfer: ${activeActivity.transitToNextMinutes || 15}m Auto (~₹${activeActivity.transitCost || 60})`
                      : 'End of day scheduled journey')}
                </p>
              </div>
            </div>

            {/* Direct Action Export GeoJSON */}
            <div className="pt-2 border-t border-[#E8DEC8]/70 flex items-center justify-between">
              <span className="text-[10px] font-meta text-neutral-400">
                Synchronized with timeline
              </span>
              <button
                type="button"
                onClick={handleExportGeoJSON}
                className="font-meta text-xs font-medium tracking-wide text-[#C85A32] hover:text-[#A7372F] flex items-center gap-1 font-semibold transition cursor-pointer"
                title="Export GeoJSON Route coordinates"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export GeoJSON ↗</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
