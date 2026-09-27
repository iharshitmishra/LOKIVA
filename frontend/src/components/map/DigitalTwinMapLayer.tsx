import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  DigitalTwinSimulationData,
  WeatherConditionType,
  VulnerableMonument,
  SafeSanctuary,
  SocialSignal,
} from '../../types/digitalTwin';

interface DigitalTwinMapLayerProps {
  simulation: DigitalTwinSimulationData;
  activeCondition?: WeatherConditionType;
  onConditionChange?: (condition: WeatherConditionType) => void;
  onCityChange: (cityName: string) => void;
  availableCities: Array<{ id?: string; name: string; state?: string; coordinates?: { lat: number; lng: number } }>;
  selectedCity: string;
  focusCoordinate?: [number, number] | null;
  onSelectSanctuary?: (sanctuary: SafeSanctuary) => void;
  onSelectMonument?: (monument: VulnerableMonument) => void;
  onSelectSocialSignal?: (signal: SocialSignal) => void;
}

export function DigitalTwinMapLayer({
  simulation,
  onCityChange,
  availableCities,
  selectedCity,
  focusCoordinate,
}: DigitalTwinMapLayerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(simulation.center, 13);

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view on simulation center change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && simulation.center) {
      map.flyTo(simulation.center, 13, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [simulation.center]);

  // Invalidate map size on fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Handle flyTo when focusCoordinate changes
  useEffect(() => {
    if (focusCoordinate && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(focusCoordinate, 15, {
        duration: 1.2,
      });
    }
  }, [focusCoordinate]);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden shadow-xl border border-[#E5DFD5] transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[680px]'
      }`}
    >
      {/* Clean Interactive Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Controls: Clean City Selector */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-md text-xs font-semibold text-[#12213B]">
          <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-[#12213B] cursor-pointer pr-1"
          >
            {(Array.isArray(availableCities) ? availableCities : []).map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}{c.state ? `, ${c.state}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Right Controls (Fullscreen) */}
      <div className="absolute top-3 right-14 z-10 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-md text-[#12213B] hover:bg-stone-100 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
