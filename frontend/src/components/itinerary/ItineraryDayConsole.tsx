import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Navigation,
  Footprints,
  Heart,
  CloudRain,
  Sun,
  Accessibility,
  Zap,
} from 'lucide-react';
import { ItineraryDay, DayFeasibilityMetrics, ReplanCondition } from '../../types/itinerary';

interface ItineraryDayConsoleProps {
  days: ItineraryDay[];
  selectedDay: number;
  feasibilityMetrics?: Record<number, DayFeasibilityMetrics>;
  activeFilter?: string;
  viewTabs?: React.ReactNode;
  onSelectDay: (dayNumber: number) => void;
  onReplanDay: (condition: ReplanCondition) => void;
}

const CONDITION_SWITCHERS: Array<{
  id: ReplanCondition;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: 'rain',
    label: 'Rain Protocol',
    icon: CloudRain,
    description: 'Swaps to covered artisan ateliers and indoor museums',
  },
  {
    id: 'heat',
    label: 'Midday Heat Shelter',
    icon: Sun,
    description: 'Avoids open courtyard walks between 12:30 PM and 03:30 PM',
  },
  {
    id: 'fatigue',
    label: 'Step-Free Pacing',
    icon: Accessibility,
    description: 'Injects step-free transit and reduces pedestrian segments',
  },
  {
    id: 'crowded',
    label: 'Avoid Peak Rush',
    icon: Zap,
    description: 'Sequences popular bazaars during off-peak morning hours',
  },
];

export function ItineraryDayConsole({
  days,
  selectedDay,
  feasibilityMetrics,
  activeFilter = 'none',
  viewTabs,
  onSelectDay,
  onReplanDay,
}: ItineraryDayConsoleProps) {
  const activeDayIndex = Math.max(0, Math.min(days.length - 1, selectedDay - 1));
  const currentDay = days[activeDayIndex] || days[0];
  const currentMetrics = currentDay && feasibilityMetrics ? feasibilityMetrics[currentDay.dayNumber] : null;

  // Telemetry metric calculations
  const totalDurationMinutes = currentDay?.activities.reduce((sum, a) => sum + (a.durationMins || 60), 0) || 360;
  const hours = (totalDurationMinutes / 60).toFixed(1);
  const totalDistanceKm = currentMetrics?.totalTransitDistanceKm || (currentDay?.activities.length ? (currentDay.activities.length * 2.8).toFixed(1) : '8.5');
  const estimatedSteps = currentMetrics?.estimatedWalkingSteps || Math.round(Number(totalDistanceKm) * 1250);

  return (
    <div className="space-y-4">
      {/* 1. Fluid Day Navigation Bar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {days.map((day) => {
            const isSelected = selectedDay === day.dayNumber;
            const metric = feasibilityMetrics?.[day.dayNumber];
            const paceScore = metric ? metric.paceScore : 95;

            return (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() => onSelectDay(day.dayNumber)}
                className={`relative px-5 py-2.5 rounded-2xl text-xs font-meta font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'border-transparent text-[#FFFDF9]'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF6F0] border-[#E6DAC6] text-[#3B2316]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeDayIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#B84A27] to-[#D47A39] rounded-2xl shadow-md shadow-[#B84A27]/20"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                <span className={`relative z-10 font-heading text-sm font-extrabold flex items-center gap-1.5 ${isSelected ? 'text-[#FFFDF9]' : 'text-[#3B2316]'}`}>
                  <span>Day {day.dayNumber}</span>
                  {day.stateCode && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-[#FFFDF9]' : 'bg-[#FAF4E8] text-[#B84A27] border border-[#DFCBB2]'}`}>
                      {day.stateCode}
                    </span>
                  )}
                </span>

                <span
                  className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] font-meta font-bold ${
                    isSelected
                      ? 'bg-white/20 text-[#FFFDF9]'
                      : 'bg-[#FAF0DF] text-[#9E5414] border border-[#F2D5A7]'
                  }`}
                >
                  {paceScore}% Feasible
                </span>
              </button>
            );
          })}
        </div>

        {viewTabs && <div className="shrink-0 self-end sm:self-auto">{viewTabs}</div>}
      </div>

      {/* 2. Warm Travertine & Sunlit Clay Rhythm Strip (Zero Black / Zero Green) */}
      <div className="bg-gradient-to-r from-[#F6EFE4] via-[#FAF5EC] to-[#F3E8D6] border border-[#E5D5BE] text-[#3B2316] rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-around gap-4 font-meta text-xs">
        {/* Rhythm Badge 1: Active Pace */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border border-[#E6DAC6] flex items-center justify-center text-[#B84A27] shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8C6751] font-heading tracking-wider">
              Active Pace
            </div>
            <div className="text-sm font-bold text-[#3B2316]">
              {hours} hrs loop
            </div>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-[#E2D5BE] hidden sm:block" />

        {/* Rhythm Badge 2: Route Distance */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border border-[#E6DAC6] flex items-center justify-center text-[#D47A39] shadow-2xs">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8C6751] font-heading tracking-wider">
              Route Distance
            </div>
            <div className="text-sm font-bold text-[#3B2316]">
              {totalDistanceKm} km corridor
            </div>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-[#E2D5BE] hidden sm:block" />

        {/* Rhythm Badge 3: Pedestrian Footsteps */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border border-[#E6DAC6] flex items-center justify-center text-[#A67B5B] shadow-2xs">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8C6751] font-heading tracking-wider">
              Pedestrian Steps
            </div>
            <div className="text-sm font-bold text-[#3B2316]">
              ~{estimatedSteps.toLocaleString('en-IN')} steps
            </div>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-[#E2D5BE] hidden md:block" />

        {/* Rhythm Badge 4: Local Community Direct */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border border-[#E6DAC6] flex items-center justify-center text-[#B84A27] shadow-2xs">
            <Heart className="w-4 h-4 fill-[#B84A27]/20" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8C6751] font-heading tracking-wider">
              Artisan Direct
            </div>
            <div className="text-sm font-bold text-[#3B2316]">
              100% Verified
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tactile Environmental Adaptive Tiles (1-Click Re-Plan) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-meta text-[#7A5C49] font-bold uppercase tracking-wider px-1">
          <span className="text-[#B84A27] font-heading font-extrabold text-[11px] tracking-wider">
            ENVIRONMENTAL ADAPTIVE CONSOLE (1-CLICK RE-PLAN)
          </span>
          <span className="text-[10px] lowercase text-[#8C6751]">
            Active: {activeFilter !== 'none' ? activeFilter : 'standard daylight'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CONDITION_SWITCHERS.map((switcher) => {
            const isFilterActive = activeFilter === switcher.id;
            const Icon = switcher.icon;

            return (
              <motion.button
                key={switcher.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => onReplanDay(switcher.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isFilterActive
                    ? 'bg-[#FBEBE4] border-[#B84A27] shadow-xs ring-1 ring-[#B84A27]'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF6F0] border-[#E6DAC6] hover:border-[#B84A27]/50 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isFilterActive
                      ? 'bg-[#B84A27] text-[#FFFDF9]'
                      : 'bg-[#FAF6F0] text-[#B84A27] border border-[#E6DAC6]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Warm Glowing Terracotta Toggle Indicator */}
                  <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isFilterActive
                      ? 'bg-[#B84A27] ring-4 ring-[#B84A27]/20 animate-pulse'
                      : 'bg-[#E6DAC6]'
                  }`} />
                </div>

                <div>
                  <div className={`text-xs font-heading font-bold ${
                    isFilterActive ? 'text-[#B84A27]' : 'text-[#3B2316]'
                  }`}>
                    {switcher.label}
                  </div>
                  <div className="text-[10px] font-sans text-[#7A5C49] line-clamp-1 leading-tight mt-0.5">
                    {switcher.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ItineraryDayConsole;
