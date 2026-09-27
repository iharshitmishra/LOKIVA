import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  Bookmark,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useMyItinerariesStore } from '../../store/useMyItinerariesStore';
import { ItineraryDay } from '../../types/itinerary';

interface SaveAndProceedDockProps {
  city: string;
  state?: string;
  title?: string;
  days: ItineraryDay[];
  grandTotal: number;
  onProceedToPayment: () => void;
}

export function SaveAndProceedDock({
  city,
  state,
  title,
  days,
  grandTotal,
  onProceedToPayment,
}: SaveAndProceedDockProps) {
  const navigate = useNavigate();
  const { saveItineraryWithDate } = useMyItinerariesStore();

  // Generate next 7 upcoming departure dates
  const today = new Date();
  const upcomingDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateIso = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullFormatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return { dateIso, dayName, monthDay, fullFormatted, dateObj: d };
  });

  const [selectedDateIso, setSelectedDateIso] = useState<string>(
    upcomingDates[1]?.dateIso || upcomingDates[0].dateIso
  );
  const [savedSuccessItinId, setSavedSuccessItinId] = useState<string | null>(null);

  const totalDays = days.length || 1;
  const selectedDateObj = new Date(selectedDateIso);
  const endDateObj = new Date(selectedDateObj);
  endDateObj.setDate(selectedDateObj.getDate() + Math.max(0, totalDays - 1));

  const startFormatted = selectedDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endFormatted = endDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSaveToMyItineraries = () => {
    const payload = {
      title: title || `${totalDays}-Day ${city} Cultural Circuit`,
      city,
      state,
      startDateIso: selectedDateIso,
      totalBudgetInr: grandTotal,
      days: days.map((d) => ({
        dayNumber: d.dayNumber,
        themeTitle: (d as any).themeTitle || (d as any).theme || d.date,
        activities: (d.activities || []).map((act) => ({
          id: act.id,
          title: act.title,
          category: act.category,
          location: act.location,
          description: act.description,
          photos: act.photos,
          costPerPerson: act.costPerPerson,
          startTime: act.startTime,
          endTime: act.endTime,
          visitDurationMinutes: act.visitDurationMinutes,
          durationMins: act.durationMins,
          transitToNext: (act as any).transitToNext,
        })),
      })),
    };

    const newId = saveItineraryWithDate(payload);
    setSavedSuccessItinId(newId);
  };

  const handleLockAndPay = () => {
    handleSaveToMyItineraries();
    onProceedToPayment();
  };

  return (
    <div className="rounded-[32px] bg-gradient-to-b from-[#FFFDF9] via-[#FAF4E9] to-[#F3E8D8] border-2 border-[#DFCBB2] p-5 sm:p-6 shadow-[0_20px_50px_-15px_rgba(59,35,22,0.15)] space-y-5 text-[#3B2316] select-none">
      {/* Dock Header Seal */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DFCBB2]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-center text-[#B84A27] shadow-2xs">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading text-xs font-extrabold tracking-[0.18em] text-[#B84A27] uppercase">
            ✦ SCHEDULE &amp; LOCK ITINERARY DATES
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#7A5C49] px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#DFCBB2]">
          {totalDays} Days Mapped
        </span>
      </div>

      {/* Date Carousel Selector (Zero default input) */}
      <div className="space-y-2">
        <label className="text-[11px] font-heading font-bold text-[#7A5C49] uppercase tracking-wider block">
          Select Departure Date:
        </label>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 overflow-x-auto pb-1">
          {upcomingDates.map((item) => {
            const isSelected = item.dateIso === selectedDateIso;
            return (
              <button
                key={item.dateIso}
                type="button"
                onClick={() => {
                  setSelectedDateIso(item.dateIso);
                  setSavedSuccessItinId(null);
                }}
                className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#B84A27] text-[#FFFDF9] shadow-sm border border-[#9E3C1D] scale-[1.03]'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF0DF] text-[#3B2316] border border-[#DFCBB2]'
                }`}
              >
                <span
                  className={`text-[9px] font-heading font-extrabold uppercase ${
                    isSelected ? 'text-[#FAF0DF]' : 'text-[#A67B5B]'
                  }`}
                >
                  {item.dayName}
                </span>
                <span className="text-xs font-mono font-black mt-0.5">
                  {item.monthDay.split(' ')[1]}
                </span>
                <span
                  className={`text-[8px] font-heading ${
                    isSelected ? 'text-[#FFFDF9]/80' : 'text-[#7A5C49]'
                  }`}
                >
                  {item.monthDay.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Date Span Readout */}
        <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center justify-between text-xs font-meta shadow-2xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#B84A27]" />
            <span className="font-heading font-bold text-[#3B2316]">
              {startFormatted} ➔ {endFormatted}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#7A5C49] font-bold">
            All Times Locked
          </span>
        </div>
      </div>

      {/* Confirmation State Banner */}
      <AnimatePresence>
        {savedSuccessItinId && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-between gap-3 text-xs shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#B84A27] shrink-0" />
              <span className="font-heading font-bold text-[#9E5414]">
                Saved to My Itineraries for {startFormatted}!
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/saved?tab=itineraries')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#B84A27] text-[#FFFDF9] text-[11px] font-heading font-extrabold uppercase tracking-wider hover:bg-[#9E3C1D] transition shadow-2xs cursor-pointer shrink-0"
            >
              <span>View in Saved</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dual Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {/* Button 1: Add to My Itineraries (With Dates) */}
        <button
          type="button"
          onClick={handleSaveToMyItineraries}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#3B2316] hover:bg-[#523220] text-[#FFFDF9] font-heading font-extrabold text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#D47A39]" />
            <span>📌 Add to My Itineraries (With Dates)</span>
          </div>
          <span className="text-[11px] font-mono text-[#FAF0DF]">
            Saved Tab ↗
          </span>
        </button>

        {/* Button 2: Proceed Ahead with Payment */}
        <button
          type="button"
          onClick={handleLockAndPay}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] font-heading font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_12px_28px_-6px_rgba(184,74,39,0.45)] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>⚡ Lock Date &amp; Proceed with Payment</span>
          </div>
          <span className="font-mono font-black text-sm">
            ₹{grandTotal.toLocaleString('en-IN')} →
          </span>
        </button>
      </div>

      {/* Trust Seal Footnote */}
      <div className="pt-2 border-t border-[#DFCBB2]/60 flex items-center justify-center gap-1.5 text-[10px] font-meta text-[#7A5C49]">
        <ShieldCheck className="w-3 h-3 text-[#B84A27]" />
        <span>100% Direct Settlement to Monument &amp; Guild Caretakers</span>
      </div>
    </div>
  );
}

export default SaveAndProceedDock;
