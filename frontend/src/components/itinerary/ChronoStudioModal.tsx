import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

export interface ChronoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  currentMinutes: number; // e.g. 510 for 08:30 AM
  durationMinutes?: number; // optional if calibrating a specific stop
  onChangeMinutes: (newMins: number) => void;
  onChangeDuration?: (newDur: number) => void;
  onApply: () => void;
  totalStopsCount?: number;
}

export function ChronoStudioModal({
  isOpen,
  onClose,
  title = 'Synchronize Departure Rhythm',
  subtitle = 'HOROLOGICAL PACING ENGINE · EDITION 01',
  currentMinutes,
  durationMinutes,
  onChangeMinutes,
  onChangeDuration,
  onApply,
  totalStopsCount = 5,
}: ChronoStudioModalProps) {
  if (!isOpen) return null;

  // Format currentMinutes (e.g. 510 -> hours: "08", mins: "30", period: "AM")
  const normalized = ((currentMinutes % 1440) + 1440) % 1440;
  const hrs24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hrs24 >= 12 ? 'PM' : 'AM';
  const hrs12 = String(hrs24 % 12 === 0 ? 12 : hrs24 % 12).padStart(2, '0');
  const minsStr = String(mins).padStart(2, '0');

  // Calculate projected completion time
  const totalTripDurationMins = typeof durationMinutes === 'number'
    ? totalStopsCount * 90
    : totalStopsCount * 110;
  const estimatedEndMins = currentMinutes + totalTripDurationMins;
  const endNorm = ((estimatedEndMins % 1440) + 1440) % 1440;
  const endH24 = Math.floor(endNorm / 60);
  const endM = String(endNorm % 60).padStart(2, '0');
  const endPeriod = endH24 >= 12 ? 'PM' : 'AM';
  const endH12 = String(endH24 % 12 === 0 ? 12 : endH24 % 12).padStart(2, '0');

  // Dynamic atmospheric phase copy (no small boxes)
  const getAtmosphereNote = (m: number) => {
    if (m < 450) return 'Dawn Sanctuary Window · Mist-Cooled Courtyards and Zero Queues';
    if (m <= 540) return 'Prime Morning Radiance · Golden Sandstone Light and Optimal Flow';
    if (m <= 630) return 'Slow Artisan Morning · Relaxed Start with Warm Bazaar Energy';
    return 'Late Brunch Cadence · High-Sun Indoor Ateliers Prioritized';
  };

  // 25 Discrete Time Steps from 06:00 AM (360m) to 12:00 PM (720m) in 15-min intervals
  const timeSteps = Array.from({ length: 25 }, (_, i) => 360 + i * 15);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#3B2316]/45 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-[40px] bg-gradient-to-b from-[#FAF6F0] via-[#F7EFE4] to-[#F2E6D6] border border-[#DFCBB2] shadow-[0_40px_90px_-20px_rgba(59,35,22,0.38)] px-7 py-8 sm:px-10 sm:py-10 overflow-hidden select-none"
        >
          {/* Ambient Warm Radial Glow That Shifts with Selected Time */}
          <motion.div
            animate={{
              x: ((currentMinutes - 360) / 360) * 220 - 110,
            }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-[#D47A39]/25 via-[#B84A27]/15 to-transparent blur-3xl pointer-events-none"
          />

          {/* 1. OPEN EDITORIAL HEADER (NO BOXES) */}
          <div className="relative z-10 flex items-start justify-between border-b border-[#E2D2BC] pb-5">
            <div>
              <div className="flex items-center gap-2 font-meta text-xs sm:text-sm font-bold tracking-[0.2em] text-[#B84A27] uppercase">
                <span className="w-2 h-2 rounded-full bg-[#B84A27] animate-ping" />
                <span>{subtitle}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[#3B2316] tracking-tight mt-1">
                {title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#EFE4D4] hover:bg-[#3B2316] text-[#3B2316] hover:text-[#FFFDF9] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. KINETIC SPLIT-FLAP / ODOMETER TIME READOUT (REPLACES THE CURVE & TOP BOX) */}
          <div className="relative z-10 py-8 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {/* -15m Tactile Step Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onChangeMinutes(Math.max(360, currentMinutes - 15))}
                className="w-12 h-12 rounded-full bg-[#EFE4D4] hover:bg-[#B84A27] text-[#3B2316] hover:text-[#FFFDF9] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="Shift 15 mins earlier"
              >
                <Minus className="w-5 h-5" />
              </motion.button>

              {/* Massive Rolling Odometer Numerals */}
              <div className="flex items-baseline gap-2 sm:gap-3">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={hrs12}
                    initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -22, filter: 'blur(6px)' }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="font-display text-6xl sm:text-7xl font-black text-[#3B2316] tracking-tighter"
                  >
                    {hrs12}
                  </motion.span>
                </AnimatePresence>

                <span className="font-display text-5xl sm:text-6xl font-black text-[#B84A27] animate-pulse">
                  :
                </span>

                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={minsStr}
                    initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -22, filter: 'blur(6px)' }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="font-display text-6xl sm:text-7xl font-black text-[#3B2316] tracking-tighter"
                  >
                    {minsStr}
                  </motion.span>
                </AnimatePresence>

                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#B84A27] ml-1">
                  {period}
                </span>
              </div>

              {/* +15m Tactile Step Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onChangeMinutes(Math.min(780, currentMinutes + 15))}
                className="w-12 h-12 rounded-full bg-[#EFE4D4] hover:bg-[#B84A27] text-[#3B2316] hover:text-[#FFFDF9] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="Shift 15 mins later"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Flowing Editorial Atmosphere Caption (Readable Scale) */}
            <motion.p
              key={getAtmosphereNote(currentMinutes)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-base sm:text-lg font-bold text-[#7A523B] mt-3"
            >
              {getAtmosphereNote(currentMinutes)}
            </motion.p>
          </div>

          {/* 3. LUMINOUS SPECTRUM EQUALIZER BAR (NO OUTER BOX, NO CURVE) */}
          <div className="relative z-10 py-4">
            <div className="flex items-end justify-between gap-1.5 h-20 px-2">
              {timeSteps.map((stepMins) => {
                const distance = Math.abs(currentMinutes - stepMins);
                const isSelected = distance === 0;
                const isNear = distance === 15;
                const isMedium = distance === 30;
                const isHourMark = stepMins % 60 === 0;

                const heightPx = isSelected
                  ? 68
                  : isNear
                  ? 48
                  : isMedium
                  ? 34
                  : isHourMark
                  ? 26
                  : 16;

                return (
                  <button
                    key={stepMins}
                    type="button"
                    onClick={() => onChangeMinutes(stepMins)}
                    className="group flex-1 h-full flex flex-col items-center justify-end cursor-pointer focus:outline-none"
                  >
                    <motion.div
                      animate={{ height: heightPx }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className={`w-full max-w-[8px] rounded-full transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-t from-[#B84A27] to-[#D47A39] shadow-[0_0_16px_rgba(184,74,39,0.55)]'
                          : isNear
                          ? 'bg-[#C86D44]'
                          : isHourMark
                          ? 'bg-[#8C6751] group-hover:bg-[#B84A27]'
                          : 'bg-[#D6C3AC] group-hover:bg-[#B84A27]/70'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Clean Typographic Time Axis (14px Bold) */}
            <div className="flex items-center justify-between px-1 mt-3 font-heading text-xs sm:text-sm font-extrabold text-[#6E503E]">
              <span>06:00 AM</span>
              <span>07:30 AM</span>
              <span>09:00 AM</span>
              <span>10:30 AM</span>
              <span>12:00 PM</span>
            </div>
          </div>

          {/* OPTIONAL: DURATION SCULPTOR (When Adjusting a Specific Stop's Duration) */}
          {typeof durationMinutes === 'number' && onChangeDuration && (
            <div className="relative z-10 py-5 mt-2 border-t border-[#E2D2BC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-meta text-xs font-bold uppercase tracking-widest text-[#B84A27]">
                  Stop Immersion Window
                </span>
                <p className="font-heading text-lg font-extrabold text-[#3B2316]">
                  Allocate {durationMinutes} Minutes at This Stop
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[30, 45, 60, 90, 105, 120].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => onChangeDuration(dur)}
                    className={`px-3.5 py-2 rounded-full font-display text-sm font-extrabold transition-all cursor-pointer ${
                      durationMinutes === dur
                        ? 'bg-[#3B2316] text-[#FFFDF9] shadow-md scale-105'
                        : 'bg-[#EFE4D4] text-[#5C3D2E] hover:bg-[#E2D2BC]'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. BORDERLESS EDITORIAL TEMPO PRESETS (REPLACES THE 4 RECTANGULAR BOXES) */}
          <div className="relative z-10 py-5 mt-2 border-y border-[#E2D2BC]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { mins: 420, time: '07:00 AM', label: 'Dawn Sanctuary' },
                { mins: 480, time: '08:00 AM', label: 'Classic Heritage' },
                { mins: 570, time: '09:30 AM', label: 'Slow Artisan' },
                { mins: 660, time: '11:00 AM', label: 'Late Brunch' },
              ].map((preset) => {
                const active = currentMinutes === preset.mins;
                return (
                  <button
                    key={preset.mins}
                    type="button"
                    onClick={() => onChangeMinutes(preset.mins)}
                    className="text-left group cursor-pointer py-1 relative"
                  >
                    <div
                      className={`font-display text-lg sm:text-xl font-black transition-colors ${
                        active ? 'text-[#B84A27]' : 'text-[#3B2316] group-hover:text-[#B84A27]'
                      }`}
                    >
                      {preset.time}
                    </div>
                    <div className="font-meta text-xs sm:text-sm font-semibold text-[#7A5C49]">
                      {preset.label}
                    </div>
                    {active && (
                      <motion.div
                        layoutId="activePresetUnderline"
                        className="h-[3px] w-12 rounded-full bg-gradient-to-r from-[#B84A27] to-[#D47A39] mt-1.5"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. LIVE CASCADE TELEMETRY & ACTION FOOTER (NO NESTED BOXES) */}
          <div className="relative z-10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="font-meta text-sm sm:text-base text-[#5C3D2E] leading-snug max-w-sm">
              Cascades all <strong className="text-[#3B2316] font-extrabold">{totalStopsCount} stops</strong> seamlessly, wrapping your day around{' '}
              <strong className="text-[#B84A27] font-extrabold">
                {endH12}:{endM} {endPeriod}
              </strong>
              .
            </p>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3.5 rounded-full font-heading font-bold text-sm sm:text-base text-[#5C3D2E] hover:text-[#3B2316] hover:bg-[#EFE4D4] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onApply();
                  onClose();
                }}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39] text-[#FFFDF9] font-heading font-extrabold text-sm sm:text-base shadow-[0_14px_30px_-6px_rgba(184,74,39,0.5)] flex items-center gap-2 cursor-pointer"
              >
                <span>Lock Schedule ({hrs12}:{minsStr} {period})</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ChronoStudioModal;
