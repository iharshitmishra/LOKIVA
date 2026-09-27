import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Sparkles,
  Sliders,
  Ticket,
  CheckCircle2,
} from 'lucide-react';
import { ItineraryActivity, BookingStatus } from '../../types/itinerary';
import { resolveImageUrl } from '../../lib/api';
import { usePassWalletStore } from '../../store/usePassWalletStore';
import { SinglePlacePassModal } from '../pass/SinglePlacePassModal';

interface ItineraryActivityCardProps {
  activity: ItineraryActivity;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isActive?: boolean;
  isHovered?: boolean;
  onUpdateStatus: (newStatus: BookingStatus) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateDuration?: (newDurationMins: number) => void;
  onOpenChronoDial?: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function ItineraryActivityCard({
  activity,
  index,
  isFirst,
  isLast,
  isActive = false,
  isHovered = false,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateDuration,
  onOpenChronoDial,
  onMoveUp,
  onMoveDown,
  onRemove,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ItineraryActivityCardProps) {
  const { isPlaceBooked, setActiveViewingReceipt } = usePassWalletStore();
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  const rawPhoto = activity.photos && activity.photos.length > 0 ? activity.photos[0] : null;
  const photo = resolveImageUrl(rawPhoto, activity.photos);
  const formattedIndex = String(index + 1).padStart(2, '0');

  const bookedReceipt = isPlaceBooked(activity.id) || isPlaceBooked(activity.title);

  return (
    <>
      <article
        id={`itinerary-stop-${activity.id}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        className={`relative bg-[#FFFDF9]/90 backdrop-blur-xl border rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer ${
          isActive
            ? 'border-[#B84A27] ring-2 ring-[#D47A39]/80 shadow-lg bg-[#FAF8F5]'
            : isHovered
            ? 'border-[#3B2316]/40 shadow-md bg-[#FFFDF9]'
            : 'border-[#E6DAC6] hover:border-[#B84A27]/60'
        }`}
      >
        {/* Watermarked Numerals in Top-Right Corner */}
        <div className="absolute top-2 right-4 font-display font-black text-6xl sm:text-7xl text-[#3B2316]/[0.04] select-none pointer-events-none tracking-tighter">
          {formattedIndex}
        </div>

        <div className="relative z-10 space-y-4">
          {/* Top Control Bar: Category on left, Reorder & Delete Actions on right */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E6DAC6]">
            <div className="flex items-center gap-2 flex-wrap font-meta text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0DF] text-[#B84A27] font-heading font-extrabold uppercase tracking-wide border border-[#F2D5A7]">
                {activity.category}
              </span>

              {bookedReceipt && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveViewingReceipt(bookedReceipt);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FAF0DF] to-[#FAF6F0] border border-[#F2D5A7] text-[#9E5414] text-[11px] font-heading font-extrabold uppercase tracking-wide hover:border-[#B84A27] transition shadow-2xs cursor-pointer"
                  title="View Verified Cultural Passport & Gate QR"
                >
                  <Ticket className="w-3 h-3 text-[#B84A27]" />
                  <span>🎟️ PASS CONFIRMED · {activity.startTime || 'RESERVED'}</span>
                </button>
              )}
            </div>

            {/* Quick Action Reorder & Delete Buttons */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1.5 rounded-xl border border-[#E6DAC6] hover:bg-[#FAF6F0] text-[#3B2316] disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed transition"
                title="Move earlier in schedule"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1.5 rounded-xl border border-[#E6DAC6] hover:bg-[#FAF6F0] text-[#3B2316] disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed transition"
                title="Move later in schedule"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-xl border border-[#E6DAC6] hover:bg-rose-50 text-[#7A5C49] hover:text-rose-600 cursor-pointer transition"
                title="Remove stop from itinerary"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Asymmetric Media & Content Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Photo with rounded-2xl and hover perspective */}
            {photo && (
              <div className="sm:col-span-5 h-36 sm:h-44 rounded-2xl overflow-hidden bg-[#FAF6F0] border border-[#E6DAC6] relative shrink-0 shadow-inner">
                <img
                  src={photo}
                  alt={activity.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#3B2316]/65 backdrop-blur-md text-[#FFFDF9] border border-[#FFFDF9]/20 text-[10px] font-meta font-bold">
                  {activity.category}
                </div>
              </div>
            )}

            {/* Details Column */}
            <div className={`${photo ? 'sm:col-span-7' : 'sm:col-span-12'} space-y-2`}>
              <div>
                <h4 className="text-lg sm:text-xl font-heading font-bold text-[#3B2316] leading-snug tracking-tight">
                  {activity.title}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-[#7A5C49] font-meta mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />
                  <span className="truncate">{activity.location}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#5C3D2E] leading-relaxed font-meta line-clamp-3">
                {activity.description}
              </p>

              {/* Key Inclusions Chips */}
              {activity.includes && activity.includes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {activity.includes.slice(0, 3).map((inc, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-[#FAF6F0] border border-[#E6DAC6] text-[10px] font-meta text-[#5C3D2E]"
                    >
                      ✓ {inc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Hairline Divider: Single 1px Border with Price Tag, Pass CTA & Duration Adjust */}
          <div className="pt-3 border-t border-[#E6DAC6] flex flex-wrap items-center justify-between gap-3 text-xs font-meta">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[#7A5C49] text-[11px]">Est. Access:</span>
              <span className="font-mono font-bold text-[#3B2316]">
                {activity.costPerPerson === 0 ? 'Free Open Heritage' : `₹${activity.costPerPerson.toLocaleString('en-IN')} / person`}
              </span>

              {/* Verified Pass Unlocked Seal or Book Pass Action */}
              {bookedReceipt ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveViewingReceipt(bookedReceipt);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#FAF0DF] to-[#FAF6F0] border border-[#F2D5A7] text-[#9E5414] text-[11px] font-heading font-extrabold uppercase tracking-wide hover:border-[#B84A27] transition shadow-2xs cursor-pointer"
                  title="View Verified Cultural Passport & QR Code"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B84A27]" />
                  <span>Verified Pass Unlocked · View QR</span>
                </button>
              ) : (activity.costPerPerson || 0) > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPassModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] text-[11px] font-heading font-bold uppercase tracking-wider transition shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  title="Book individual experience pass via Razorpay"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Book Pass · ₹{activity.costPerPerson}</span>
                </button>
              ) : null}
            </div>

            {/* Calibrate / Adjust Time & Duration Button */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onOpenChronoDial?.()}
                className="text-[11px] text-[#B84A27] hover:text-[#9E3C1D] bg-[#FAF0DF]/60 hover:bg-[#FAF0DF] px-2.5 py-1 rounded-xl border border-[#F2D5A7] flex items-center gap-1.5 cursor-pointer font-heading font-bold transition shadow-2xs"
                title="Open Tactile Chrono-Dial to calibrate timing and duration"
              >
                <Sliders className="w-3 h-3 text-[#B84A27]" />
                <span>Calibrate ({activity.visitDurationMinutes || 60}m)</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Inline Single-Place Pass Checkout Modal */}
      <SinglePlacePassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        place={{
          id: activity.id,
          title: activity.title,
          city: activity.city || '',
          category: activity.category,
          price: activity.costPerPerson || 0,
          durationMins: activity.visitDurationMinutes || activity.durationMins || 60,
          photo,
          defaultSlotWindow: `${activity.startTime || '09:00 AM'} - ${activity.endTime || '10:30 AM'}`,
          custodianName: (activity as any).provider_name || (activity as any).custodianName,
        }}
      />
    </>
  );
}

export default ItineraryActivityCard;
