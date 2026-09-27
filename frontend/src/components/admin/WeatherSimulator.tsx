import React, { useState } from 'react';
import {
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  Thermometer,
  Wind,
  Droplets,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Activity,
  X,
} from 'lucide-react';
import { useWeatherSimulationStore } from '../../store/useWeatherSimulationStore';
import { WeatherContextForAI } from '../../services/openMeteoService';

const PRESET_SCENARIOS: Array<{
  label: string;
  icon: React.ReactNode;
  updates: Partial<WeatherContextForAI>;
}> = [
  {
    label: 'Heavy Monsoon',
    icon: <CloudRain className="w-4 h-4" />,
    updates: {
      currentCondition: 'Heavy Monsoon Rain',
      currentTempCelsius: 24,
      rainExpected: true,
      peakRainProbability: 95,
      weatherAdvisory:
        'Heavy monsoon rain likely. Strongly recommend indoor alternatives and rain gear. Avoid all outdoor activities.',
    },
  },
  {
    label: 'Thunderstorm',
    icon: <CloudLightning className="w-4 h-4" />,
    updates: {
      currentCondition: 'Thunderstorm & Heavy Rain',
      currentTempCelsius: 26,
      rainExpected: true,
      peakRainProbability: 88,
      weatherAdvisory:
        'Thunderstorm with heavy rain. Avoid all outdoor activities. Seek indoor shelter immediately.',
    },
  },
  {
    label: 'Extreme Heat',
    icon: <Sun className="w-4 h-4" />,
    updates: {
      currentCondition: 'Extreme Heat',
      currentTempCelsius: 42,
      rainExpected: false,
      peakRainProbability: 5,
      weatherAdvisory:
        'Extreme heat warning. Recommend indoor stops during midday, hydration breaks, and lightweight clothing.',
    },
  },
  {
    label: 'Clear Skies',
    icon: <Sun className="w-4 h-4" />,
    updates: {
      currentCondition: 'Clear Sky',
      currentTempCelsius: 28,
      rainExpected: false,
      peakRainProbability: 0,
      weatherAdvisory:
        'Pleasant weather with clear skies. Good conditions for outdoor exploration.',
    },
  },
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Jaipur', 'Varanasi', 'Bengaluru', 'Goa',
  'Kochi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Agra',
  'Udaipur', 'Amritsar', 'Shimla', 'Manali', 'Rishikesh', 'Mysore',
];

export function WeatherSimulator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isSimulationActive,
    simulatedWeather,
    simulationCity,
    setSimulationActive,
    setSimulationCity,
    updateSimulatedWeather,
    resetSimulation,
  } = useWeatherSimulationStore();

  const handleToggleSimulation = () => {
    setSimulationActive(!isSimulationActive);
  };

  const handlePreset = (updates: Partial<WeatherContextForAI>) => {
    updateSimulatedWeather(updates);
    if (!isSimulationActive) setSimulationActive(true);
  };

  const handleCityChange = (city: string) => {
    setSimulationCity(city);
    updateSimulatedWeather({ city });
  };

  const handleReset = () => {
    resetSimulation();
  };

  const isSevere =
    simulatedWeather &&
    (simulatedWeather.rainExpected && simulatedWeather.peakRainProbability >= 70) ||
    (simulatedWeather && simulatedWeather.currentTempCelsius >= 40) ||
    (simulatedWeather && simulatedWeather.currentTempCelsius <= 5);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Severity Alert Banner */}
      {isSimulationActive && isSevere && (
        <div className="w-80 bg-[#C1443B] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-heading font-extrabold uppercase tracking-widest">
              Severe Weather Alert
            </div>
            <div className="text-[11px] font-sans mt-0.5 leading-relaxed">
              {simulatedWeather?.currentCondition} in {simulationCity || simulatedWeather?.city}.
              {' '}{simulatedWeather?.weatherAdvisory}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="w-80 bg-white border border-[#E5DFD5] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#FAF7F2] px-4 py-3 border-b border-[#E5DFD5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#C1443B]" />
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#12213B]">
                Weather Simulator
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isSimulationActive && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#C1443B] bg-[#FDF2F0] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C1443B] animate-pulse" />
                  ACTIVE
                </span>
              )}
              <button
                onClick={handleReset}
                className="p-1 text-[#5A6E85] hover:text-[#C1443B] transition-colors"
                title="Reset simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Simulation Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-[#12213B]">
                Override Real-Time API
              </span>
              <button
                onClick={handleToggleSimulation}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  isSimulationActive ? 'bg-[#C1443B]' : 'bg-[#E5DFD5]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    isSimulationActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* City Selector */}
            <div>
              <label className="block text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B] mb-1.5">
                Target City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A6E85]" />
                <select
                  value={simulationCity || 'Mumbai'}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl text-xs font-sans font-semibold text-[#12213B] focus:outline-none focus:border-[#C1443B] appearance-none"
                >
                  {INDIAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preset Scenarios */}
            <div>
              <label className="block text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B] mb-1.5">
                Disaster Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset.updates)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl text-[11px] font-sans font-semibold text-[#12213B] hover:border-[#C1443B] hover:bg-[#FDF2F0] transition-colors"
                  >
                    <span className="text-[#C1443B]">{preset.icon}</span>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                  Temperature
                </label>
                <span className="text-xs font-mono font-bold text-[#12213B]">
                  {simulatedWeather?.currentTempCelsius ?? 28}°C
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="50"
                value={simulatedWeather?.currentTempCelsius ?? 28}
                onChange={(e) =>
                  updateSimulatedWeather({ currentTempCelsius: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-[#E5DFD5] rounded-full appearance-none cursor-pointer accent-[#C1443B]"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#5A6E85] mt-0.5">
                <span>-10°C</span>
                <span>50°C</span>
              </div>
            </div>

            {/* Rain Probability Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                  Rain Probability
                </label>
                <span className="text-xs font-mono font-bold text-[#12213B]">
                  {simulatedWeather?.peakRainProbability ?? 0}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simulatedWeather?.peakRainProbability ?? 0}
                onChange={(e) => {
                  const prob = parseInt(e.target.value, 10);
                  updateSimulatedWeather({
                    peakRainProbability: prob,
                    rainExpected: prob >= 40,
                  });
                }}
                className="w-full h-1.5 bg-[#E5DFD5] rounded-full appearance-none cursor-pointer accent-[#C1443B]"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#5A6E85] mt-0.5">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Condition Selector */}
            <div>
              <label className="block text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B] mb-1.5">
                Weather Condition
              </label>
              <select
                value={simulatedWeather?.currentCondition ?? 'Clear Sky'}
                onChange={(e) => {
                  const condition = e.target.value;
                  const isRain = /rain|drizzle|shower|storm/i.test(condition);
                  updateSimulatedWeather({
                    currentCondition: condition,
                    rainExpected: isRain,
                    peakRainProbability: isRain
                      ? Math.max(simulatedWeather?.peakRainProbability ?? 0, 60)
                      : Math.min(simulatedWeather?.peakRainProbability ?? 0, 10),
                  });
                }}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl text-xs font-sans font-semibold text-[#12213B] focus:outline-none focus:border-[#C1443B] appearance-none"
              >
                <option>Clear Sky</option>
                <option>Partly Cloudy</option>
                <option>Overcast</option>
                <option>Light Drizzle</option>
                <option>Rain Showers</option>
                <option>Heavy Rain</option>
                <option>Thunderstorm & Rain</option>
                <option>Extreme Heat</option>
                <option>Misty Fog</option>
              </select>
            </div>

            {/* Advisory Preview */}
            {simulatedWeather && (
              <div className="bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#C1443B]" />
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                    AI Advisory Preview
                  </span>
                </div>
                <p className="text-[11px] font-sans text-[#12213B] leading-relaxed">
                  {simulatedWeather.weatherAdvisory}
                </p>
              </div>
            )}

            {/* Status Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                isSimulationActive
                  ? 'bg-[#FDF2F0] border-[#C1443B]'
                  : 'bg-[#FAF7F2] border-[#E5DFD5]'
              }`}
            >
              <Activity
                className={`w-3.5 h-3.5 ${isSimulationActive ? 'text-[#C1443B]' : 'text-[#5A6E85]'}`}
              />
              <span
                className={`text-[11px] font-sans font-semibold ${
                  isSimulationActive ? 'text-[#C1443B]' : 'text-[#5A6E85]'
                }`}
              >
                {isSimulationActive
                  ? 'Simulation active. AI will use these values instead of real-time API.'
                  : 'Simulation inactive. AI uses real-time Open-Meteo data.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Tab Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg border transition-all duration-200 ${
          isSimulationActive
            ? 'bg-[#C1443B] text-white border-[#C1443B] hover:bg-[#A83830]'
            : 'bg-white text-[#12213B] border-[#E5DFD5] hover:border-[#C1443B]'
        }`}
      >
        {isSimulationActive ? (
          <CloudRain className="w-4 h-4" />
        ) : (
          <Cloud className="w-4 h-4" />
        )}
        <span className="text-xs font-heading font-extrabold uppercase tracking-widest">
          {isSimulationActive ? 'Simulating' : 'Simulate'}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
