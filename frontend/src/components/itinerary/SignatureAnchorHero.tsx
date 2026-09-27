import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sunrise, Sparkles, MapPin, Pencil } from 'lucide-react';
import { ItineraryDay } from '../../types/itinerary';
import { resolveImageUrl } from '../../lib/api';
import { ChronoStudioModal } from './ChronoStudioModal';
import { timeStringToMinutes, formatMinutesTo12Hr } from '../../lib/itinerarySolver';

interface SignatureAnchorHeroProps {
  day: ItineraryDay;
  totalCost?: number;
  onSetStartTime?: (dayNumber: number, startTime: string) => void;
}

export function SignatureAnchorHero({
  day,
  totalCost,
  onSetStartTime,
}: SignatureAnchorHeroProps) {
  const [isChronoOpen, setIsChronoOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(
    timeStringToMinutes(day.dayStartTime || '08:30 AM')
  );

  const calculatedCost =
    totalCost !== undefined
      ? totalCost
      : day.activities.reduce((sum, act) => sum + (act.costPerPerson || 0), 0);

  const totalDurationMins = day.activities.reduce(
    (sum, act) => sum + (act.visitDurationMinutes || 60) + (act.transitToNextMinutes || 15),
    0
  );

  const rawHeroImage =
    day.heroImage ||
    day.activities[0]?.photos?.[0] ||
    'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1400&q=80';
  const heroImage = resolveImageUrl(rawHeroImage, day.activities[0]?.photos);

  const anchorTitle = day.activities[0]?.title || day.title;
  const anchorLocation = day.activities[0]?.location || 'Heritage Precinct';

  return (
    <>
      <div className="h-56 sm:h-72 rounded-[32px] overflow-hidden relative shadow-xl border-2 border-[#FFFDF9] group">
        {/* Background Image with Cinematic Gradient Overlays */}
        <img
          src={heroImage}
          alt={anchorTitle}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#26160E]/90 via-[#3B2316]/40 to-[#3B2316]/10" />

        {/* Top Floating Glass Badges Row */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-3">
          {/* Top-Left: Live Date & Day Index Frosted Pill */}
          <div className="bg-[#3B2316]/65 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#FFFDF9]/25 text-[#FFFDF9] font-meta text-xs flex items-center gap-2 shadow-sm">
            <span className="font-heading font-extrabold text-[#F2C18D] uppercase tracking-wider">
              Day {day.dayNumber}
            </span>
            <span className="text-white/40">·</span>
            <div className="flex items-center gap-1 text-[#FFFDF9]/90">
              <Calendar className="w-3.5 h-3.5 text-[#F2C18D]" />
              <span>{day.date || day.dayOfWeek || 'Scheduled'}</span>
            </div>
            <span className="text-white/40">·</span>
            <button
              type="button"
              onClick={() => {
                setSelectedMinutes(timeStringToMinutes(day.dayStartTime || '08:30 AM'));
                setIsChronoOpen(true);
              }}
              className="flex items-center gap-1.5 text-[#FFFDF9]/90 hover:text-[#F2C18D] transition cursor-pointer font-bold bg-[#FFFDF9]/10 hover:bg-[#FFFDF9]/20 px-2.5 py-1 rounded-full border border-[#FFFDF9]/20 shadow-2xs"
              title="Calibrate Day Start Time with Horological Pacing Engine"
            >
              <Sunrise className="w-3.5 h-3.5 text-[#F2C18D]" />
              <span>Starts at {day.dayStartTime || '08:30 AM'}</span>
              <Pencil className="w-2.5 h-2.5 opacity-70 ml-0.5" />
            </button>
          </div>

          {/* Top-Right: Day Access Cost Badge */}
          <div className="font-display font-extrabold text-[#FFFDF9] bg-[#3B2316]/65 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#FFFDF9]/25 text-right shadow-sm shrink-0">
            <div className="text-[10px] uppercase font-meta tracking-wider text-[#E6DAC6] font-bold">
              Day Access
            </div>
            <div className="text-base sm:text-lg font-mono font-black text-[#FFFDF9]">
              ₹{calculatedCost.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Bottom Title & Anchor Narrative Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-[#FFFDF9] space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#F2C18D] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F2C18D]" />
              <span>Signature Cultural Anchor</span>
            </span>
          </div>

          <h3 className="font-heading font-black text-2xl sm:text-3xl text-[#FFFDF9] drop-shadow-md tracking-tight">
            {anchorTitle}
          </h3>

          <div className="flex items-center gap-2 text-xs font-meta text-[#FFFDF9]/80">
            <MapPin className="w-3.5 h-3.5 text-[#F2C18D] shrink-0" />
            <span className="truncate">{anchorLocation}</span>
            <span className="text-white/40">·</span>
            <span>{day.activities.length} Curated Stops</span>
          </div>
        </div>
      </div>

      {/* Kinetic Split-Flap Horological Pacing Studio */}
      <ChronoStudioModal
        isOpen={isChronoOpen}
        onClose={() => setIsChronoOpen(false)}
        title="Synchronize Departure Rhythm"
        subtitle="HOROLOGICAL PACING ENGINE · EDITION 01"
        currentMinutes={selectedMinutes}
        onChangeMinutes={(newMins) => setSelectedMinutes(newMins)}
        onApply={() => {
          onSetStartTime?.(day.dayNumber, formatMinutesTo12Hr(selectedMinutes));
        }}
        totalStopsCount={day.activities.length}
      />
    </>
  );
}

export default SignatureAnchorHero;
