import React, { useRef, useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
  Car,
  Footprints,
  Plus,
  Compass,
  Clock,
  Sparkles,
  ArrowRight,
  Sunrise,
  Coffee,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { ItineraryDay, BookingStatus, ItineraryActivity } from '../../types/itinerary';
import { SignatureAnchorHero } from './SignatureAnchorHero';
import { ItineraryActivityCard } from './ItineraryActivityCard';
import { ChronoStudioModal } from './ChronoStudioModal';
import { timeStringToMinutes, formatMinutesTo12Hr } from '../../lib/itinerarySolver';

interface ItineraryTimelineProps {
  day: ItineraryDay;
  totalDays: number;
  activeStopId?: number | null;
  hoveredStopId?: number | null;
  onUpdateActivityStatus: (dayNumber: number, activityId: number, status: BookingStatus) => void;
  onUpdateActivityNotes: (dayNumber: number, activityId: number, notes: string) => void;
  onUpdateActivityDuration?: (dayNumber: number, activityId: number, durationMins: number) => void;
  onUpdateActivityTiming?: (
    dayNumber: number,
    activityId: number,
    customStartMinutes: number | undefined,
    durationMins: number
  ) => void;
  onMoveActivity: (dayNumber: number, fromIndex: number, toIndex: number) => void;
  onRemoveActivity: (dayNumber: number, activityId: number) => void;
  onAddActivityClick: (dayNumber: number, afterIndex?: number) => void;
  onSetStartTime?: (dayNumber: number, startTime: string) => void;
  onStopHover?: (stopId: number | null) => void;
  onStopSelect?: (stopId: number) => void;
}

function splitTimeMeridian(timeStr: string) {
  const clean = (timeStr || '08:30 AM').trim();
  const match = clean.match(/^(\d{1,2}:\d{2})\s*(AM|PM)?$/i);
  if (match) {
    return {
      time: match[1],
      meridian: (match[2] || 'AM').toUpperCase(),
    };
  }
  const parts = clean.split(' ');
  return {
    time: parts[0] || '08:30',
    meridian: parts[1] || 'AM',
  };
}

export function ItineraryTimeline({
  day,
  totalDays,
  activeStopId,
  hoveredStopId,
  onUpdateActivityStatus,
  onUpdateActivityNotes,
  onUpdateActivityDuration,
  onUpdateActivityTiming,
  onMoveActivity,
  onRemoveActivity,
  onAddActivityClick,
  onSetStartTime,
  onStopHover,
  onStopSelect,
}: ItineraryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // State for Day Start Time Modal
  const [isDayStartModalOpen, setIsDayStartModalOpen] = useState(false);
  const [dayStartMinutes, setDayStartMinutes] = useState<number>(
    timeStringToMinutes(day.dayStartTime || '08:30 AM')
  );

  // State for Individual Stop Calibrator Modal
  const [calibratingActivityId, setCalibratingActivityId] = useState<number | null>(null);
  const [stopCalibrateMinutes, setStopCalibrateMinutes] = useState<number>(510);
  const [stopCalibrateDuration, setStopCalibrateDuration] = useState<number>(60);

  // Ripple state for cascading downstream wave animation
  const [rippledIndex, setRippledIndex] = useState<number | null>(null);
  const [rippleTimestamp, setRippleTimestamp] = useState<number>(0);

  // Scroll linked progress line for vertical chrono-spine
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.001,
  });

  const totalDurationMins = day.activities.reduce(
    (sum, act) => sum + (act.visitDurationMinutes || 60) + (act.transitToNextMinutes || 15),
    0
  );
  const durationHours = (totalDurationMins / 60).toFixed(1);

  // Open individual stop calibrator
  const handleOpenStopCalibrator = (act: ItineraryActivity) => {
    const startM = act.customStartMinutes ?? timeStringToMinutes(act.startTime || '09:00 AM');
    const durM = act.visitDurationMinutes || act.durationMins || 60;
    setStopCalibrateMinutes(startM);
    setStopCalibrateDuration(durM);
    setCalibratingActivityId(act.id);
  };

  // Apply stop calibration
  const handleApplyStopCalibration = () => {
    if (calibratingActivityId === null) return;
    const actIdx = day.activities.findIndex((a) => a.id === calibratingActivityId);
    if (actIdx === -1) return;

    setRippledIndex(actIdx);
    setRippleTimestamp(Date.now());

    if (onUpdateActivityTiming) {
      onUpdateActivityTiming(
        day.dayNumber,
        calibratingActivityId,
        stopCalibrateMinutes,
        stopCalibrateDuration
      );
    } else if (onUpdateActivityDuration) {
      onUpdateActivityDuration(day.dayNumber, calibratingActivityId, stopCalibrateDuration);
    }
  };

  const calibratingActivity = day.activities.find((a) => a.id === calibratingActivityId) || null;
  const calibratingIndex = calibratingActivity
    ? day.activities.findIndex((a) => a.id === calibratingActivityId)
    : 0;

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8">
      {/* 1. Signature Cultural Anchor Hero Banner */}
      <SignatureAnchorHero
        day={day}
        onSetStartTime={(dayNum, timeStr) => {
          setRippledIndex(0);
          setRippleTimestamp(Date.now());
          onSetStartTime?.(dayNum, timeStr);
        }}
      />

      {/* 2. Chrono-Spine Crown: Day Start Indicator & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 sm:px-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setDayStartMinutes(timeStringToMinutes(day.dayStartTime || '08:30 AM'));
            setIsDayStartModalOpen(true);
          }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FAF0DF] to-[#FAF6F0] hover:from-[#FAF4ED] hover:to-[#FAF0DF] border border-[#DFCBB2] hover:border-[#B84A27] text-xs sm:text-sm font-heading font-extrabold text-[#3B2316] shadow-sm transition-all cursor-pointer group self-start sm:self-auto"
          title="Open Horological Pacing Engine to synchronize departure time"
        >
          <Sunrise className="w-4 h-4 text-[#B84A27] transition-transform group-hover:rotate-12" />
          <span>Day Starts at <strong className="text-[#B84A27]">{day.dayStartTime || '08:30 AM'}</strong></span>
          <span className="text-xs font-meta font-bold text-[#B84A27] opacity-80 group-hover:opacity-100 underline decoration-[#B84A27]/40 underline-offset-2">✦ Synchronize Horizon</span>
        </button>

        <span className="text-xs sm:text-sm font-meta font-semibold text-[#7A5C49]">
          {day.activities.length} Stops Mapped · ~{durationHours} Hours Total Exploration
        </span>
      </div>

      {/* 3. Continuous Engraved Horological Ruler Rail & Asymmetric Stop Rows */}
      <div className="relative space-y-6 sm:space-y-8 pt-2 pb-4">
        {day.activities.map((activity, index) => {
          const isFirst = index === 0;
          const isLast = index === day.activities.length - 1;
          const isSelected = activeStopId === activity.id;
          const isHovered = hoveredStopId === activity.id;
          const formattedIndex = String(index + 1).padStart(2, '0');

          const startParts = splitTimeMeridian(activity.startTime || '08:30 AM');
          const endParts = splitTimeMeridian(activity.endTime || '09:15 AM');

          const naturalArrivalMinutes =
            index === 0
              ? timeStringToMinutes(day.dayStartTime || '08:30 AM')
              : timeStringToMinutes(day.activities[index - 1]?.endTime || '09:00 AM') +
                (day.activities[index - 1]?.transitToNextMinutes || 15);

          const hasBreather = (activity.breatherBeforeMinutes || 0) > 0;
          const naturalArrivalStr = formatMinutesTo12Hr(naturalArrivalMinutes);

          const isRippling =
            rippledIndex !== null &&
            index >= rippledIndex &&
            Date.now() - rippleTimestamp < 1500;

          return (
            <div key={activity.id} className="relative group/stop">
              {/* Unscripted Breather Notification Banner on Spine */}
              {hasBreather && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 ml-0 sm:ml-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] shadow-sm text-xs sm:text-sm font-meta text-[#3B2316]"
                >
                  <Coffee className="w-4 h-4 text-[#B84A27] shrink-0" />
                  <span>
                    <strong className="text-[#B84A27]">+{activity.breatherBeforeMinutes}m</strong>{' '}
                    Unscripted Breather & Exploration Window ({naturalArrivalStr} ➔ {activity.startTime})
                  </span>
                </motion.div>
              )}

              {/* Asymmetric 2-Column Stop Row with Engraved Horological Ruler Rail */}
              <div className="grid grid-cols-[136px_1fr] sm:grid-cols-[156px_1fr] gap-4 sm:gap-7 items-stretch">
                {/* Left Column: Continuous Ruler Spine & Bold Open Typography */}
                <div className="relative flex flex-col items-center select-none pt-1 isolate">
                  {/* 1. Continuous High-Visibility Spine Track (Runs behind everything) */}
                  <div className="absolute top-6 -bottom-6 left-1/2 -translate-x-1/2 w-[2px] bg-[#D8C5AE] -z-10 pointer-events-none">
                    {/* Subtle Horizontal Architectural Ruler Ticks spaced every 24px */}
                    <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-40">
                      {Array.from({ length: 14 }).map((_, tickIdx) => (
                        <div
                          key={tickIdx}
                          className="w-2.5 h-[1.5px] bg-[#C9B296] self-center"
                        />
                      ))}
                    </div>
                  </div>

                  {/* 2. Stop Compass Medallion Badge (z-20) */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onStopSelect?.(activity.id)}
                    className={`w-11 h-11 rounded-2xl rotate-3 group-hover/stop:rotate-0 bg-[#3B2316] text-[#FFFDF9] font-display font-black text-base shadow-md flex items-center justify-center transition-all z-20 cursor-pointer ${
                      isSelected
                        ? 'ring-4 ring-[#D47A39] bg-[#B84A27] scale-105'
                        : isHovered
                        ? 'bg-[#B84A27]'
                        : 'bg-[#3B2316]'
                    }`}
                  >
                    <span>{formattedIndex}</span>
                  </motion.button>

                  {/* 3. Large Unboxed Start Time (Solid Upfront Opaque Plaque, z-20) */}
                  <div className="relative z-20 mt-2.5 px-3 py-1 rounded-xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-2xs flex items-baseline justify-center leading-none">
                    <span className="font-display font-black text-lg sm:text-xl text-[#3B2316] tracking-tight">
                      {startParts.time}
                    </span>
                    <span className="font-display text-xs font-extrabold text-[#B84A27] ml-1">
                      {startParts.meridian}
                    </span>
                  </div>

                  {/* 4. Tactile Duration Gauge Bar (Solid Upfront Pill, z-20) */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenStopCalibrator(activity)}
                    className="relative z-20 my-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] font-display font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_6px_16px_-3px_rgba(184,74,39,0.45)] border border-[#FFFDF9]/40 flex items-center gap-1.5 cursor-pointer"
                    title="Click to calibrate arrival time and duration"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activity.visitDurationMinutes || 60} MIN</span>
                  </motion.button>

                  {/* 5. Large Unboxed Exit / End Time (Solid Upfront Opaque Plaque, z-20) */}
                  <div className="relative z-20 px-3 py-1 rounded-xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-2xs flex items-baseline justify-center leading-none">
                    <span className="font-display font-bold text-base sm:text-lg text-[#6E503E] tracking-tight">
                      {endParts.time}
                    </span>
                    <span className="font-display text-xs font-bold text-[#7A5C49] ml-1">
                      {endParts.meridian}
                    </span>
                  </div>

                  {/* 6. Magnetic Shift Time Link (Solid Upfront Opaque Pill, z-20) */}
                  <button
                    type="button"
                    onClick={() => handleOpenStopCalibrator(activity)}
                    className="relative z-20 mt-2 px-2.5 py-1 rounded-full bg-[#FAF0DF] hover:bg-[#FAF4ED] border border-[#F2D5A7] font-heading font-bold text-xs text-[#B84A27] hover:text-[#3B2316] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>✦ Shift Time</span>
                  </button>
                </div>

                {/* Right Column: Asymmetric Magazine Stop Card */}
                <div className="min-w-0">
                  <ItineraryActivityCard
                    activity={activity}
                    index={index}
                    isFirst={isFirst}
                    isLast={isLast}
                    isActive={isSelected}
                    isHovered={isHovered}
                    onMouseEnter={() => onStopHover?.(activity.id)}
                    onMouseLeave={() => onStopHover?.(null)}
                    onClick={() => onStopSelect?.(activity.id)}
                    onUpdateStatus={(newStatus) =>
                      onUpdateActivityStatus(day.dayNumber, activity.id, newStatus)
                    }
                    onUpdateNotes={(notes) =>
                      onUpdateActivityNotes(day.dayNumber, activity.id, notes)
                    }
                    onOpenChronoDial={() => handleOpenStopCalibrator(activity)}
                    onMoveUp={() => onMoveActivity(day.dayNumber, index, index - 1)}
                    onMoveDown={() => onMoveActivity(day.dayNumber, index, index + 1)}
                    onRemove={() => onRemoveActivity(day.dayNumber, activity.id)}
                  />
                </div>
              </div>

              {/* External Transit Connector Capsule & In-Between Insert Pill */}
              {!isLast && (
                <div className="my-5 ml-[136px] sm:ml-[156px] pl-4 sm:pl-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* External Transit Pill */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#FAF6F0] border border-[#E6DAC6] shadow-xs text-xs sm:text-sm font-meta text-[#5C3D2E] hover:border-[#B84A27] transition-colors"
                  >
                    {activity.transitMode === 'walking' ? (
                      <Footprints className="w-4 h-4 text-[#B84A27] shrink-0" />
                    ) : (
                      <Car className="w-4 h-4 text-[#B84A27] shrink-0" />
                    )}
                    <span className="font-semibold">
                      {activity.gettingThere || `Private transfer · ~${activity.transitToNextMinutes || 15} mins`}
                    </span>
                    {activity.transitCost > 0 && (
                      <span className="font-mono font-bold text-[#3B2316] bg-[#FFFDF9] px-2.5 py-0.5 rounded-full border border-[#E6DAC6]">
                        ~₹{activity.transitCost.toLocaleString('en-IN')}
                      </span>
                    )}
                  </motion.div>

                  {/* Insert Stop Button Between Activities */}
                  <button
                    type="button"
                    onClick={() => onAddActivityClick(day.dayNumber, index)}
                    className="opacity-75 hover:opacity-100 transition-opacity self-start sm:self-auto px-3.5 py-1.5 bg-[#FFFDF9] hover:bg-[#FAF0DF] border border-[#DFCBB2] hover:border-[#B84A27] rounded-full text-xs font-meta font-bold text-[#B84A27] flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Insert place here"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert Stop</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Add Place Action Footer */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF6F0] border border-[#DFCBB2] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <button
          type="button"
          onClick={() => onAddActivityClick(day.dayNumber)}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] font-heading font-extrabold text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cultural Place to Day {day.dayNumber}</span>
        </button>

        <span className="text-xs sm:text-sm font-meta font-semibold text-[#7A5C49]">
          {day.activities.length} stops mapped · ~{durationHours} hours total
        </span>
      </div>

      {/* Day Start Time Kinetic Split-Flap Studio */}
      <ChronoStudioModal
        isOpen={isDayStartModalOpen}
        onClose={() => setIsDayStartModalOpen(false)}
        title="Synchronize Departure Rhythm"
        subtitle="HOROLOGICAL PACING ENGINE · EDITION 01"
        currentMinutes={dayStartMinutes}
        onChangeMinutes={(newMins) => setDayStartMinutes(newMins)}
        onApply={() => {
          setRippledIndex(0);
          setRippleTimestamp(Date.now());
          onSetStartTime?.(day.dayNumber, formatMinutesTo12Hr(dayStartMinutes));
        }}
        totalStopsCount={day.activities.length}
      />

      {/* Individual Stop Horological Pacing & Duration Studio */}
      {calibratingActivity && (
        <ChronoStudioModal
          isOpen={Boolean(calibratingActivity)}
          onClose={() => setCalibratingActivityId(null)}
          title={`Calibrate Stop ${String(calibratingIndex + 1).padStart(2, '0')}: ${calibratingActivity.title}`}
          subtitle="STOP IMMERSION & CADENCE CALIBRATOR"
          currentMinutes={stopCalibrateMinutes}
          durationMinutes={stopCalibrateDuration}
          onChangeMinutes={(newMins) => setStopCalibrateMinutes(newMins)}
          onChangeDuration={(newDur) => setStopCalibrateDuration(newDur)}
          onApply={handleApplyStopCalibration}
          totalStopsCount={day.activities.length}
        />
      )}
    </div>
  );
}

export default ItineraryTimeline;
