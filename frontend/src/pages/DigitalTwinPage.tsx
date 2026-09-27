import React, { useState, useEffect } from 'react';
import { DigitalTwinMapLayer } from '../components/map/DigitalTwinMapLayer';
import { SocialSignalStreamDrawer } from '../components/social/SocialSignalStreamDrawer';
import {
  WeatherConditionType,
  DigitalTwinSimulationData,
  SafeSanctuary,
  VulnerableMonument,
  CitizenGroundReportPayload,
  SocialSignal,
} from '../types/digitalTwin';
import {
  fetchDigitalTwinSimulation,
  fetchDigitalTwinCities,
  submitCitizenGroundReport,
} from '../lib/digitalTwinApi';
import {
  AlertTriangle,
  Shield,
  Clock,
  Users,
  Compass,
  Radio,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Info,
  CloudRain,
  Navigation,
  Sun,
} from 'lucide-react';

export function DigitalTwinPage() {
  const [selectedCity, setSelectedCity] = useState('Jaipur');
  const [activeCondition, setActiveCondition] = useState<WeatherConditionType>('rain');
  const [simulation, setSimulation] = useState<DigitalTwinSimulationData | null>(null);
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string; state: string }[]>([
    { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusCoordinate, setFocusCoordinate] = useState<[number, number] | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'social' | 'sanctuaries'>('social');
  const [rerouteToast, setRerouteToast] = useState<{ title: string; message: string } | null>(null);

  // What-If Counterfactual Simulation Parameters
  const [rainfallIntensity, setRainfallIntensity] = useState<number>(45);
  const [temperature, setTemperature] = useState<number>(26);
  const [floodDepth, setFloodDepth] = useState<number>(24);
  const [stormDuration, setStormDuration] = useState<number>(3.5);

  // Load cities list once
  useEffect(() => {
    fetchDigitalTwinCities()
      .then((cities) => {
        if (Array.isArray(cities) && cities.length > 0) {
          setAvailableCities(cities);
        }
      })
      .catch((err) => {
        console.error('Failed to load cities', err);
      });
  }, []);

  // Fetch simulation data whenever city, condition, or What-If parameters change
  const loadSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDigitalTwinSimulation(selectedCity, activeCondition, {
        rainfallIntensity,
        temperature,
        floodDepth,
        stormDuration,
      });
      setSimulation(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load digital twin simulation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimulation();
  }, [selectedCity, activeCondition, rainfallIntensity, temperature, floodDepth, stormDuration]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setFocusCoordinate(null);
  };

  const handleConditionChange = (condition: WeatherConditionType) => {
    setActiveCondition(condition);
    if (condition === 'clear') {
      setRainfallIntensity(0);
      setFloodDepth(0);
      setTemperature(26);
    } else if (condition === 'heat') {
      setRainfallIntensity(0);
      setFloodDepth(0);
      setTemperature(44);
    } else {
      setRainfallIntensity(45);
      setFloodDepth(24);
      setTemperature(25);
    }
  };

  const handleFocusCoordinate = (coord: [number, number]) => {
    setFocusCoordinate(coord);
  };

  const handleSelectSanctuary = (sanctuary: SafeSanctuary) => {
    setFocusCoordinate([sanctuary.lat, sanctuary.lng]);
    setRerouteToast({
      title: `Rerouting to ${sanctuary.name}`,
      message: `Priority indoor shelter confirmed. ${sanctuary.availableCapacity} seats free (${sanctuary.distanceFromHazardKm} km from hazard zone).`,
    });
    setTimeout(() => setRerouteToast(null), 5000);
  };

  const handleSelectMonument = (monument: VulnerableMonument) => {
    setFocusCoordinate([monument.lat, monument.lng]);
  };

  const handleSubmitGroundReport = async (payload: CitizenGroundReportPayload) => {
    try {
      setIsSubmittingReport(true);
      const res = await submitCitizenGroundReport(payload);
      if (res.success && simulation) {
        // Optimistically add to local simulation state
        setSimulation({
          ...simulation,
          socialSignals: [res.signal, ...simulation.socialSignals],
        });
        setFocusCoordinate([res.signal.lat, res.signal.lng]);
        setRerouteToast({
          title: 'Ground Report Transmitted',
          message: 'Your report is now live on the geospatial radar for all travelers.',
        });
        setTimeout(() => setRerouteToast(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to submit ground report', err);
      alert('Could not submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-[#12213B] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C85A32] uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Real-Time Simulation Engine & Geospatial Twin
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Weather Impact & Crowd Absorption Twin
              </h1>
              <p className="text-sm text-stone-300 mt-1.5 max-w-2xl">
                Simulating live Doppler precipitation, vulnerable monument crowds, transit delays, and safe
                indoor artisan sanctuaries with real-time public social telemetry.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadSimulation}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Radar</span>
              </button>
            </div>
          </div>

          {/* Metrics Strip */}
          {simulation && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-stone-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Displaced Tourists</span>
                </div>
                <div className="text-xl font-bold mt-1 text-white">
                  {simulation.simulationMetrics.totalDisplacedTourists}
                  <span className="text-xs font-normal text-stone-400 ml-1">travelers</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-stone-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Shelter Absorption Capacity</span>
                </div>
                <div className="text-xl font-bold mt-1 text-emerald-400">
                  {simulation.simulationMetrics.totalShelterAvailableSeats}
                  <span className="text-xs font-normal text-stone-400 ml-1">open seats</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-stone-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Avg Transit Delay</span>
                </div>
                <div className="text-xl font-bold mt-1 text-amber-300">
                  +{simulation.simulationMetrics.averageTransitDelayMinutes}
                  <span className="text-xs font-normal text-stone-400 ml-1">mins</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-stone-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Crowd Safe Redirection</span>
                </div>
                <div className="text-xl font-bold mt-1 text-blue-300">
                  {simulation.simulationMetrics.crowdSeekingShelterPercent}%
                  <span className="text-xs font-normal text-stone-400 ml-1">absorption</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <h3 className="font-bold text-base">Error Loading Simulation</h3>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={loadSimulation}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : !simulation ? (
          <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-[#E5DFD5]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-[#C85A32] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-[#5A6E85]">Initializing Geospatial Digital Twin...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Weather Integration & What-If Simulation Controls Banner */}
            <div className="bg-white rounded-2xl border border-[#E5DFD5] p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-xs font-heading font-extrabold text-[#12213B] uppercase tracking-wider">
                    Interactive What-If Scenario Simulator
                  </span>
                  <span className="text-[10px] font-mono bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                    Probabilistic Model
                  </span>
                </div>

                {simulation.liveWeather && (
                  <div className="flex items-center gap-2 text-xs font-mono bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-stone-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live API: {simulation.liveWeather.temperature_c}°C</span>
                    <span>·</span>
                    <span>{simulation.liveWeather.relative_humidity_percent}% Humidity</span>
                    <span>·</span>
                    <span className="text-stone-500 hidden sm:inline">{simulation.liveWeather.source}</span>
                  </div>
                )}
              </div>

              {/* What-If Parameter Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5 p-3 rounded-xl bg-sky-50/70 border border-sky-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-950 flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                      <span>Rainfall Intensity</span>
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
                    <span>0 mm/h (Dry)</span>
                    <span>50 mm/h</span>
                    <span>100 mm/h</span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Road Waterlogging</span>
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
                    <span>0 cm (Clear)</span>
                    <span>25 cm (Pooling)</span>
                    <span>50 cm (Flooded)</span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      <span>Surface Temperature</span>
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

                <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Storm / Heat Duration</span>
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

              {/* AI Counterfactual Projection Box */}
              {simulation.counterfactualInsight && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">AI Counterfactual Model Projection:</span>
                    <p className="leading-relaxed">{simulation.counterfactualInsight}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Map Column (7 Cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <DigitalTwinMapLayer
                simulation={simulation}
                activeCondition={activeCondition}
                onConditionChange={handleConditionChange}
                onCityChange={handleCityChange}
                availableCities={availableCities}
                selectedCity={selectedCity}
                focusCoordinate={focusCoordinate}
                onSelectSanctuary={handleSelectSanctuary}
                onSelectMonument={handleSelectMonument}
                onSelectSocialSignal={(sig) => setFocusCoordinate([sig.lat, sig.lng])}
              />

              </div>

            {/* Sidebar Column (4 Cols on desktop): Social Signals & Sanctuaries */}
            <div className="lg:col-span-4 flex flex-col h-[680px]">
              {/* Tab Selector */}
              <div className="flex items-center p-1 rounded-xl bg-white border border-[#E5DFD5] shadow-xs mb-3">
                <button
                  onClick={() => setActiveSideTab('social')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeSideTab === 'social'
                      ? 'bg-[#12213B] text-white shadow-xs'
                      : 'text-[#5A6E85] hover:text-[#12213B]'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Public Social Signals ({simulation.socialSignals.length})</span>
                </button>

                <button
                  onClick={() => setActiveSideTab('sanctuaries')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeSideTab === 'sanctuaries'
                      ? 'bg-[#12213B] text-white shadow-xs'
                      : 'text-[#5A6E85] hover:text-[#12213B]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Safe Sanctuaries ({simulation.safeSanctuaries.length})</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0">
                {activeSideTab === 'social' ? (
                  <SocialSignalStreamDrawer
                    signals={simulation.socialSignals}
                    activeCity={simulation.city}
                    onFocusCoordinate={handleFocusCoordinate}
                    onSubmitReport={handleSubmitGroundReport}
                    isSubmitting={isSubmittingReport}
                  />
                ) : (
                  <div className="h-full bg-white rounded-2xl border border-[#E5DFD5] shadow-lg p-4 overflow-y-auto space-y-3">
                    <div className="pb-3 border-b border-[#E5DFD5]">
                      <h3 className="font-bold text-sm text-[#12213B]">Indoor Artisan Sanctuaries</h3>
                      <p className="text-[11px] text-[#5A6E85]">
                        Climate-controlled cultural workshops absorbing displaced crowds
                      </p>
                    </div>

                    {simulation.safeSanctuaries.map((sanc) => {
                      const capacityPercent = Math.round(
                        (sanc.absorbedCurrent / sanc.absorptionCapacityTotal) * 100
                      );

                      return (
                        <div
                          key={sanc.id}
                          className="p-3.5 rounded-xl border border-[#E5DFD5] hover:border-emerald-500 bg-[#FAF7F2]/50 hover:bg-emerald-50/30 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-xs text-[#12213B] group-hover:text-emerald-800 transition-colors">
                                {sanc.name}
                              </h4>
                              <p className="text-[10px] text-[#5A6E85] mt-0.5">{sanc.category}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                              {sanc.availableCapacity} seats free
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between text-[10px] text-[#5A6E85] mb-1">
                              <span>Occupancy</span>
                              <span>
                                {sanc.absorbedCurrent} / {sanc.absorptionCapacityTotal} ({capacityPercent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${capacityPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {sanc.shelterFacilities.slice(0, 2).map((fac) => (
                              <span
                                key={fac}
                                className="px-1.5 py-0.5 bg-white border border-[#E5DFD5] rounded text-[9px] text-[#5A6E85]"
                              >
                                {fac}
                              </span>
                            ))}
                          </div>

                          {/* Action */}
                          <div className="mt-3 pt-2 border-t border-[#E5DFD5] flex items-center justify-between">
                            <span className="text-[10px] text-[#5A6E85]">
                              {sanc.distanceFromHazardKm} km from storm core
                            </span>
                            <button
                              onClick={() => handleSelectSanctuary(sanc)}
                              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                            >
                              <span>Reroute Here</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Floating Action Toast / Alert */}
      {rerouteToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#12213B] text-white p-4 rounded-2xl shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-full bg-emerald-500 text-white mt-0.5">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <h5 className="font-bold text-xs">{rerouteToast.title}</h5>
              <p className="text-[11px] text-stone-300 mt-0.5">{rerouteToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
