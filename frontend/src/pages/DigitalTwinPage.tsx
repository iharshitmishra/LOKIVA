import React, { useState } from 'react';
import { DigitalTwinMapLayer, CityLiveData } from '../components/map/DigitalTwinMapLayer';
import { POPULAR_55_CITIES, PopularCityTelemetry, getAqiCategory } from '../data/popularCities55Data';
import {
  MapPin,
  Thermometer,
  Wind,
  Activity,
  Compass,
  Radio,
  Sparkles,
  Droplets,
} from 'lucide-react';

export function DigitalTwinPage() {
  const [selectedCity, setSelectedCity] = useState<PopularCityTelemetry>(
    POPULAR_55_CITIES.find((c) => c.id === 'mumbai') || POPULAR_55_CITIES[0]
  );
  const [liveData, setLiveData] = useState<CityLiveData | null>(null);

  const handleSelectCity = React.useCallback((city: PopularCityTelemetry, data: CityLiveData) => {
    setSelectedCity(city);
    setLiveData(data);
  }, []);

  const aqiMeta = getAqiCategory(liveData?.aqi ?? selectedCity.defaultAqi);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      {/* Top Clean Header (Light Theme) */}
      <div className="bg-[#FAF7F2] text-[#12213B] pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C85A32] uppercase tracking-wider mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Environmental & Weather Geospatial Twin
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#12213B]">
              Pan-India Live Weather Radar ({POPULAR_55_CITIES.length}+ Cities)
            </h1>
            <p className="text-xs sm:text-sm text-[#5A6E85] mt-1 max-w-2xl font-medium">
              Real-time atmospheric telemetry across {POPULAR_55_CITIES.length}+ major Indian cities. Click any location pin to monitor live Temperature, AQI, and Wind Speed.
            </p>
          </div>

          {/* Quick Active City Snapshot Pill in Header */}
          <div className="flex items-center gap-3 bg-white border border-[#E5DFD5] px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-sm">
            <div className="text-2xl">{liveData?.icon || selectedCity.defaultIcon}</div>
            <div>
              <div className="text-xs font-bold text-[#12213B] flex items-center gap-1.5">
                <span>{selectedCity.name}</span>
                <span className="text-[10px] font-normal text-[#5A6E85]">({selectedCity.state})</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-2 mt-0.5">
                <span>{liveData?.temperature ?? selectedCity.defaultTempC}°C</span>
                <span>·</span>
                <span>AQI {liveData?.aqi ?? selectedCity.defaultAqi}</span>
                <span>·</span>
                <span>{liveData?.windSpeed ?? selectedCity.defaultWindKmh} km/h wind</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Width Map Canvas Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5">
        <DigitalTwinMapLayer
          onSelectCity={handleSelectCity}
          selectedCityId={selectedCity.id}
          className="shadow-2xl"
        />
      </div>
    </div>
  );
}

export default DigitalTwinPage;
