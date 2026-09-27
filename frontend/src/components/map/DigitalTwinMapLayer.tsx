import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Maximize2,
  Minimize2,
  Thermometer,
  Wind,
  Activity,
  Droplets,
  Compass,
  RefreshCw,
} from 'lucide-react';
import {
  POPULAR_55_CITIES,
  PopularCityTelemetry,
  getAqiCategory,
  getTemperatureCategory,
  getWindCategory,
} from '../../data/popularCities55Data';

const HARDCODED_CARTO_API_KEY = 'cb1_2x3k_2_130ef72eae12cbf223f5381d';

export interface CityLiveData {
  cityId: string;
  cityName: string;
  temperature: number;
  aqi: number;
  windSpeed: number;
  humidity: number;
  condition: string;
  icon: string;
  isLive: boolean;
  lastUpdated: string;
}

interface DigitalTwinMapLayerProps {
  onSelectCity?: (city: PopularCityTelemetry, liveData: CityLiveData) => void;
  selectedCityId?: string;
  className?: string;
  // Legacy compatibility props
  simulation?: any;
  activeCondition?: any;
  onConditionChange?: (condition: any) => void;
  onCityChange?: (cityName: string) => void;
  availableCities?: any[];
  selectedCity?: string;
  focusCoordinate?: any;
  onSelectSanctuary?: any;
  onSelectMonument?: any;
  onSelectSocialSignal?: any;
}

// User-provided SVG red map pin helper
function createRedMapPin(isActive = false): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
        isActive ? 'scale-125 z-50' : 'hover:scale-115'
      }" style="width: 32px; height: 32px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" style="
          width: 32px;
          height: 32px;
          filter: ${
            isActive
              ? 'drop-shadow(0 4px 10px rgba(217, 36, 36, 0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.45))'
              : 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.35))'
          };
        ">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M256 16C163.216 16 88 91.216 88 184c0 74.072 87.87 205.283 147.962 294.024a24 24 0 0 0 40.076 0C336.13 389.283 424 258.072 424 184 424 91.216 348.784 16 256 16Zm0 96a72 72 0 1 0 0 144 72 72 0 0 0 0-144Z" fill="#D92424"/>
        </svg>
      </div>
    `,
    className: 'custom-red-pin-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 30],
    popupAnchor: [0, -32],
  });
}

// Generate the fast HTML popup with box colors matching temperature, aqi, and wind speed
function createCityPopupHtml(city: PopularCityTelemetry, liveData?: CityLiveData | null): string {
  const temp = liveData?.temperature ?? city.defaultTempC;
  const aqi = liveData?.aqi ?? city.defaultAqi;
  const wind = liveData?.windSpeed ?? city.defaultWindKmh;
  const humidity = liveData?.humidity ?? city.defaultHumidity;
  const condition = liveData?.condition ?? city.defaultCondition;
  const isLive = liveData?.isLive ?? false;

  const tempMeta = getTemperatureCategory(temp);
  const aqiMeta = getAqiCategory(aqi);
  const windMeta = getWindCategory(wind);

  return `
    <div style="font-family: inherit; min-width: 250px; padding: 4px 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 8px;">
        <div>
          <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 4px;">
            ${city.defaultIcon} ${city.name}
          </h4>
          <div style="font-size: 11px; color: #64748B;">${city.state} · ${city.region}</div>
        </div>
        <span style="background: ${isLive ? '#DCFCE7' : '#F1F5F9'}; color: ${
          isLive ? '#15803D' : '#475569'
        }; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 9999px;">
          ${isLive ? '● Live API' : '● Telemetry'}
        </span>
      </div>

      <!-- 3 Key Metric Boxes with Same Exact Colors for Temperature, AQI, and Wind Speed -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; margin-bottom: 8px;">
        <!-- 1. Temperature Box -->
        <div style="background: ${tempMeta.color}15; border: 1.5px solid ${tempMeta.color}60; border-radius: 10px; padding: 6px 3px;">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9px; font-weight: 800; color: ${tempMeta.color}; padding: 0 2px;">
            <span>🌡️ TEMP</span>
            <span style="background: ${tempMeta.color}; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px;">${tempMeta.label}</span>
          </div>
          <div style="font-size: 16px; font-weight: 800; color: ${tempMeta.color}; margin-top: 3px;">${temp}°C</div>
          <div style="font-size: 9px; font-weight: 600; color: ${tempMeta.color}; margin-top: 1px; opacity: 0.9;">Temperature</div>
        </div>

        <!-- 2. AQI Box -->
        <div style="background: ${aqiMeta.color}15; border: 1.5px solid ${aqiMeta.color}60; border-radius: 10px; padding: 6px 3px;">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9px; font-weight: 800; color: ${aqiMeta.color}; padding: 0 2px;">
            <span>🍃 AQI</span>
            <span style="background: ${aqiMeta.color}; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px;">${aqiMeta.label}</span>
          </div>
          <div style="font-size: 16px; font-weight: 800; color: ${aqiMeta.color}; margin-top: 3px;">${aqi}</div>
          <div style="font-size: 9px; font-weight: 600; color: ${aqiMeta.color}; margin-top: 1px; opacity: 0.9;">Air Quality</div>
        </div>

        <!-- 3. Wind Speed Box -->
        <div style="background: ${windMeta.color}15; border: 1.5px solid ${windMeta.color}60; border-radius: 10px; padding: 6px 3px;">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9px; font-weight: 800; color: ${windMeta.color}; padding: 0 2px;">
            <span>💨 WIND</span>
            <span style="background: ${windMeta.color}; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px;">${windMeta.label}</span>
          </div>
          <div style="font-size: 16px; font-weight: 800; color: ${windMeta.color}; margin-top: 3px;">${wind} <span style="font-size: 9px;">km/h</span></div>
          <div style="font-size: 9px; font-weight: 600; color: ${windMeta.color}; margin-top: 1px; opacity: 0.9;">Wind Speed</div>
        </div>
      </div>

      <!-- Condition & Humidity Info Strip -->
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #334155; background: #F8FAFC; padding: 5px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
        <span>Condition: <strong>${condition}</strong></span>
        <span>Humidity: <strong>${humidity}%</strong></span>
      </div>
    </div>
  `;
}

export function DigitalTwinMapLayer({
  onSelectCity,
  selectedCityId,
  className = '',
  selectedCity: legacySelectedCity,
  onCityChange,
}: DigitalTwinMapLayerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const activeMarkerIdRef = useRef<string>('mumbai');

  // Store callbacks in ref so effect dependencies never cause layer re-creation
  const callbacksRef = useRef({ onSelectCity, onCityChange });
  callbacksRef.current = { onSelectCity, onCityChange };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCity, setActiveCity] = useState<PopularCityTelemetry>(
    POPULAR_55_CITIES.find((c) => c.id === 'mumbai') || POPULAR_55_CITIES[0]
  );

  // In-memory telemetry cache so switching cities is 100% instant with 0ms lag
  const [telemetryCache, setTelemetryCache] = useState<Record<string, CityLiveData>>(() => {
    const initial: Record<string, CityLiveData> = {};
    POPULAR_55_CITIES.forEach((c) => {
      initial[c.id] = {
        cityId: c.id,
        cityName: c.name,
        temperature: c.defaultTempC,
        aqi: c.defaultAqi,
        windSpeed: c.defaultWindKmh,
        humidity: c.defaultHumidity,
        condition: c.defaultCondition,
        icon: c.defaultIcon,
        isLive: false,
        lastUpdated: 'Preloaded',
      };
    });
    return initial;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Live Weather API ONLY ONCE (on page load / refresh or explicit button)
  const fetchLiveWeatherOnce = useCallback(async (city: PopularCityTelemetry) => {
    setIsRefreshing(true);
    try {
      const [weatherRes, aqiRes] = await Promise.allSettled([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current_weather=true&hourly=relativehumidity_2m`
        ).then((r) => (r.ok ? r.json() : null)),
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lng}&current=us_aqi`
        ).then((r) => (r.ok ? r.json() : null)),
      ]);

      let temp = city.defaultTempC;
      let wind = city.defaultWindKmh;
      let aqi = city.defaultAqi;
      let humidity = city.defaultHumidity;
      let condition = city.defaultCondition;
      let isLive = false;

      if (weatherRes.status === 'fulfilled' && weatherRes.value?.current_weather) {
        const cw = weatherRes.value.current_weather;
        temp = Math.round(cw.temperature * 10) / 10;
        wind = Math.round(cw.windspeed * 10) / 10;
        isLive = true;

        const code = cw.weathercode;
        if (code === 0) condition = 'Clear Sky';
        else if (code <= 3) condition = 'Partly Cloudy';
        else if (code <= 48) condition = 'Foggy / Haze';
        else if (code <= 67) condition = 'Rain Showers';
        else if (code <= 99) condition = 'Thunderstorm';

        if (weatherRes.value.hourly?.relativehumidity_2m?.[0]) {
          humidity = weatherRes.value.hourly.relativehumidity_2m[0];
        }
      }

      if (aqiRes.status === 'fulfilled' && aqiRes.value?.current?.us_aqi !== undefined) {
        aqi = Math.round(aqiRes.value.current.us_aqi);
        isLive = true;
      }

      const updated: CityLiveData = {
        cityId: city.id,
        cityName: city.name,
        temperature: temp,
        aqi,
        windSpeed: wind,
        humidity,
        condition,
        icon: city.defaultIcon,
        isLive,
        lastUpdated: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setTelemetryCache((prev) => ({
        ...prev,
        [city.id]: updated,
      }));

      // Update marker popup content if open
      const marker = markersByIdRef.current.get(city.id);
      if (marker) {
        marker.setPopupContent(createCityPopupHtml(city, updated));
      }

      if (callbacksRef.current.onSelectCity) {
        callbacksRef.current.onSelectCity(city, updated);
      }
    } catch (err) {
      console.warn('Weather API call on page refresh encountered error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Update active pin visual
  const updateActiveMarker = useCallback((newCityId: string) => {
    const prevCityId = activeMarkerIdRef.current;
    if (prevCityId && prevCityId !== newCityId) {
      const prevMarker = markersByIdRef.current.get(prevCityId);
      if (prevMarker) {
        prevMarker.setIcon(createRedMapPin(false));
      }
    }
    const currentMarker = markersByIdRef.current.get(newCityId);
    if (currentMarker) {
      currentMarker.setIcon(createRedMapPin(true));
    }
    activeMarkerIdRef.current = newCityId;
  }, []);

  // Fast, lag-free city selection (Instant memory lookup, NO API call on click)
  const selectCityInstant = useCallback(
    (city: PopularCityTelemetry, panTo = true) => {
      setActiveCity(city);
      updateActiveMarker(city.id);

      const map = mapInstanceRef.current;
      if (panTo && map) {
        map.panTo([city.lat, city.lng], {
          animate: true,
          duration: 0.4,
        });
      }

      const data = telemetryCache[city.id] || {
        cityId: city.id,
        cityName: city.name,
        temperature: city.defaultTempC,
        aqi: city.defaultAqi,
        windSpeed: city.defaultWindKmh,
        humidity: city.defaultHumidity,
        condition: city.defaultCondition,
        icon: city.defaultIcon,
        isLive: false,
        lastUpdated: 'Preloaded',
      };

      const marker = markersByIdRef.current.get(city.id);
      if (marker) {
        marker.setPopupContent(createCityPopupHtml(city, data));
        marker.openPopup();
      }

      if (callbacksRef.current.onSelectCity) {
        callbacksRef.current.onSelectCity(city, data);
      }
      if (callbacksRef.current.onCityChange) {
        callbacksRef.current.onCityChange(city.name);
      }
    },
    [telemetryCache, updateActiveMarker]
  );

  // Initialize Map and Markers ONCE strictly on component mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // Centered on India with optimal zoom
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true, // Enables hardware-accelerated canvas for 60fps performance
    }).setView([22.5, 79.5], 5);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Clean CARTO Voyager Tile Layer
    const cartoApiKey = (
      (import.meta.env.VITE_CARTO_API_KEY as string | undefined) ||
      HARDCODED_CARTO_API_KEY
    )
      .trim()
      .replace(/^["']|["']$/g, '');

    const tileUrl = cartoApiKey
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(
          cartoApiKey
        )}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
      minZoom: 4,
    }).addTo(map);

    // Create 55 City Pins ONCE using user-provided SVG red pin
    const markerGroup = L.layerGroup().addTo(map);

    POPULAR_55_CITIES.forEach((city) => {
      const isDefaultActive = city.id === 'mumbai';
      const marker = L.marker([city.lat, city.lng], {
        icon: createRedMapPin(isDefaultActive),
      });

      // Native Leaflet tooltip on hover (lightweight, zero DOM clutter when idle)
      marker.bindTooltip(city.name, {
        direction: 'top',
        offset: [0, -30],
        opacity: 0.95,
      });

      // Bind instant popup
      marker.bindPopup(createCityPopupHtml(city));

      // Fast click: immediate synchronous selection without network fetch
      marker.on('click', () => {
        setActiveCity(city);
        updateActiveMarker(city.id);
        if (callbacksRef.current.onSelectCity) {
          callbacksRef.current.onSelectCity(city, {
            cityId: city.id,
            cityName: city.name,
            temperature: city.defaultTempC,
            aqi: city.defaultAqi,
            windSpeed: city.defaultWindKmh,
            humidity: city.defaultHumidity,
            condition: city.defaultCondition,
            icon: city.defaultIcon,
            isLive: false,
            lastUpdated: 'Preloaded',
          });
        }
        if (callbacksRef.current.onCityChange) {
          callbacksRef.current.onCityChange(city.name);
        }
      });

      markerGroup.addLayer(marker);
      markersByIdRef.current.set(city.id, marker);
    });

    mapInstanceRef.current = map;

    // Call live weather API ONLY ONCE on page load / initial mount for the default city
    fetchLiveWeatherOnce(POPULAR_55_CITIES[0]);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersByIdRef.current.clear();
    };
  }, [fetchLiveWeatherOnce, updateActiveMarker]);

  // Sync external selectedCityId if changed externally
  useEffect(() => {
    const targetId = selectedCityId || legacySelectedCity?.toLowerCase();
    if (targetId && targetId !== activeCity.id) {
      const found = POPULAR_55_CITIES.find(
        (c) => c.id === targetId || c.name.toLowerCase() === targetId
      );
      if (found) {
        selectCityInstant(found, true);
      }
    }
  }, [selectedCityId, legacySelectedCity, activeCity.id, selectCityInstant]);

  // Handle Fullscreen resize
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Reset to full India view
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([22.5, 79.5], 5, { animate: true });
    }
  };

  const currentLiveData = telemetryCache[activeCity.id] || {
    cityId: activeCity.id,
    cityName: activeCity.name,
    temperature: activeCity.defaultTempC,
    aqi: activeCity.defaultAqi,
    windSpeed: activeCity.defaultWindKmh,
    humidity: activeCity.defaultHumidity,
    condition: activeCity.defaultCondition,
    icon: activeCity.defaultIcon,
    isLive: false,
    lastUpdated: 'Preloaded',
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden shadow-2xl border border-[#E5DFD5] bg-[#FAF7F2] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[760px]'
      } ${className}`}
    >
      {/* Hardware-accelerated Canvas Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Floating Bar: City Selector & Status */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto max-w-[calc(100%-100px)]">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-lg text-xs font-semibold text-[#12213B]">
          <MapPin className="w-4 h-4 text-[#C85A32] shrink-0" />
          <select
            value={activeCity.id}
            onChange={(e) => {
              const city = POPULAR_55_CITIES.find((c) => c.id === e.target.value);
              if (city) selectCityInstant(city, true);
            }}
            className="bg-transparent border-none outline-none font-bold text-[#12213B] cursor-pointer max-w-[180px] sm:max-w-[220px]"
          >
            {POPULAR_55_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.state}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] text-[#12213B] text-xs font-semibold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{POPULAR_55_CITIES.length} Cities Active</span>
        </div>

        <button
          onClick={handleResetView}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-lg text-xs font-bold text-[#12213B] hover:bg-stone-50 transition-colors"
          title="Reset to Full India View"
        >
          <Compass className="w-3.5 h-3.5 text-[#C85A32]" />
          <span className="hidden md:inline">Pan-India View</span>
        </button>
      </div>

      {/* Top Right Controls (Refresh Live Weather on demand & Fullscreen) */}
      <div className="absolute top-4 right-14 z-10 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => fetchLiveWeatherOnce(activeCity)}
          disabled={isRefreshing}
          className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-lg text-[#12213B] hover:bg-stone-50 transition-colors"
          title="Refresh Live Weather API"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#C85A32] ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-lg text-[#12213B] hover:bg-stone-50 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default DigitalTwinMapLayer;
