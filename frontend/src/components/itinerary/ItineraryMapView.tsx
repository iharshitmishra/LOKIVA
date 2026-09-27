import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Coins, Bookmark, CheckCircle2, Footprints, Car, Sparkles } from 'lucide-react';
import { ItineraryDay, ItineraryActivity } from '../../types/itinerary';
import { generateCurvedFlightArc } from './ItineraryMapRoute';
import L from 'leaflet';

// CARTO Basemaps API Key
// You can either:
// 1. Paste your key directly below between the quotes, OR
// 2. Set VITE_CARTO_API_KEY in frontend/.env
const HARDCODED_CARTO_API_KEY = 'cb1_2x3k_2_130ef72eae12cbf223f5381d';

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
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | 'all'>(
    selectedDayNumber !== undefined ? selectedDayNumber - 1 : 0
  );
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const polylineGlowRef = useRef<L.Polyline | null>(null);

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

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet map instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([20.5937, 78.9629], 5);

      // CARTO Basemap with official key query parameter to remove watermarks
      const cartoApiKey = (
        HARDCODED_CARTO_API_KEY ||
        (import.meta.env.VITE_CARTO_API_KEY as string | undefined) ||
        ''
      )
        .trim()
        .replace(/^["']|["']$/g, '');

      if (cartoApiKey) {
        console.info(`[LOKIVA Map] CARTO API Key detected (${cartoApiKey.substring(0, 4)}...${cartoApiKey.slice(-4)})`);
      } else {
        console.warn(
          '[LOKIVA Map] No CARTO API Key found. Please add VITE_CARTO_API_KEY in frontend/.env or HARDCODED_CARTO_API_KEY in ItineraryMapView.tsx'
        );
      }

      // Official CARTO documentation specifies `?key=YOUR_KEY`
      const tileUrl = cartoApiKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoApiKey)}`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers & polylines
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

        // Custom tactile pulsing beacon with departure ripple on Stop 1
        const pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isActive ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            ${
              isStart
                ? '<div class="absolute -inset-2.5 rounded-full bg-[#C85A32]/25 start-beacon-ripple pointer-events-none"></div>'
                : ''
            }
            <div class="absolute -inset-1 rounded-full bg-amber-400/35 beacon-pulse-ring pointer-events-none"></div>
            <div class="relative w-8 h-8 rounded-full ${
              isActive
                ? 'bg-[#C85A32] ring-4 ring-amber-400/80 shadow-xl'
                : 'bg-[#C85A32] shadow-md border-[2.5px] border-[#FAF7F2]'
            } text-white font-heading font-extrabold text-xs flex items-center justify-center">
              ${idx + 1}
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
            <div class="p-2 font-sans space-y-1 text-ink min-w-[180px]">
              <span class="text-[10px] font-mono text-[#C85A32] font-bold uppercase block">Stop ${idx + 1} · ${stop.timeRange || stop.startTime || ''}</span>
              <strong class="text-xs font-heading font-bold block">${stop.title}</strong>
              <p class="text-[11px] text-dusk">${stop.location}</p>
              <div class="text-[10px] font-mono text-ink pt-1 border-t border-[#E5DFD5]">
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
        polylineRef.current = L.polyline(curvedLatLngs, {
          color: '#C85A32',
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'animated-corridor-flow',
        }).addTo(map);
      }

      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      // Map cleanup if component unmounts
    };
  }, [allDisplayedActivities.length, selectedDayIndex, activeStopId, hoveredStopId]);

  // Center on active stop when changed
  useEffect(() => {
    if (activeStopId && markersRef.current[activeStopId] && mapInstanceRef.current) {
      const marker = markersRef.current[activeStopId];
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
      marker.openPopup();
    }
  }, [activeStopId]);

  return (
    <div className="bg-[#FAF7F2] rounded-2xl border border-[#E5DFD5] p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Map Header & Day Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5DFD5]">
        <div className="flex items-center gap-3">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C85A32]" />
            </span>
            <span className="text-xs font-meta font-bold uppercase tracking-wider text-neutral-800">
              {selectedDayIndex === 'all'
                ? 'All Days Route Corridor'
                : `Day ${Number(selectedDayIndex) + 1} Route Flow`}
            </span>
          </div>
          <span className="text-xs text-dusk font-sans hidden md:inline">
            Directional flow synchronized with your daily timeline stops
          </span>
        </div>

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
      </div>

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-[400px] rounded-2xl border border-[#E5DFD5] overflow-hidden shadow-inner z-10"
      />

      {/* Route Quick Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-dusk bg-white p-3 rounded-xl border border-[#E5DFD5]">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-[#C1443B]" />
          <span>{allDisplayedActivities.length} Sequential Stops</span>
        </div>
        <span className="text-[11px] text-ink">
          💡 Click any numbered marker on the map to jump directly to its timeline card.
        </span>
      </div>
    </div>
  );
}
