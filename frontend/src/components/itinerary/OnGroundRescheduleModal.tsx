import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Building,
  Users,
  CloudRain,
  Timer,
  Check,
} from 'lucide-react';
import {
  DisruptionReason,
  IntervalReplacementCandidate,
  getIntervalReplacementRecommendations,
} from '../../services/rescheduleEngineHooks';
import { SavedItineraryStop } from '../../store/useMyItinerariesStore';

interface OnGroundRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  dayNumber: number;
  stop: SavedItineraryStop | null;
  initialReason?: DisruptionReason;
  onSwapConfirmed: (candidate: IntervalReplacementCandidate, reason: DisruptionReason) => void;
}

const DISRUPTION_OPTIONS: Array<{
  id: DisruptionReason;
  icon: React.ReactNode;
  label: string;
  description: string;
}> = [
  {
    id: 'temple_or_shop_closed',
    icon: <Building className="w-4 h-4 text-[#B84A27]" />,
    label: 'Temple / Artisan Shop / Venue is Closed',
    description: 'Arrived at the location and found gates or workshops shut.',
  },
  {
    id: 'gate_maintenance',
    icon: <AlertTriangle className="w-4 h-4 text-[#D47A39]" />,
    label: 'Unexpected Ritual / Gate Maintenance',
    description: 'Special religious observance or temporary monument closure.',
  },
  {
    id: 'crowd_surge',
    icon: <Users className="w-4 h-4 text-[#9E5414]" />,
    label: 'Excessive Queue / Heavy Crowd Surge',
    description: 'Wait times exceeding your allotted window.',
  },
  {
    id: 'weather_rain',
    icon: <CloudRain className="w-4 h-4 text-[#B84A27]" />,
    label: 'Sudden Monsoon Shower / Weather Alert',
    description: 'Outdoor trail affected by active rainfall.',
  },
  {
    id: 'running_late',
    icon: <Timer className="w-4 h-4 text-[#A67B5B]" />,
    label: 'Running Behind Schedule',
    description: 'Need a faster nearby alternative that finishes on time.',
  },
];

export function OnGroundRescheduleModal({
  isOpen,
  onClose,
  city,
  dayNumber,
  stop,
  initialReason = 'temple_or_shop_closed',
  onSwapConfirmed,
}: OnGroundRescheduleModalProps) {
  const [selectedReason, setSelectedReason] = useState<DisruptionReason>(initialReason);
  const [candidates, setCandidates] = useState<IntervalReplacementCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<IntervalReplacementCandidate | null>(null);

  useEffect(() => {
    if (initialReason) {
      setSelectedReason(initialReason);
    }
  }, [initialReason]);

  useEffect(() => {
    if (!isOpen || !stop) return;

    let isMounted = true;
    setIsLoading(true);

    getIntervalReplacementRecommendations({
      city,
      closedStopTitle: stop.title,
      startTime: stop.startTime,
      endTime: stop.endTime,
      durationMinutes: stop.durationMinutes,
      reason: selectedReason,
    })
      .then((data) => {
        if (isMounted) {
          setCandidates(data);
          setSelectedCandidate(data[0] || null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, stop, selectedReason, city]);

  if (!isOpen || !stop) return null;

  const handleConfirmSwap = (cand: IntervalReplacementCandidate) => {
    onSwapConfirmed(cand, selectedReason);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#3B2316]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-3xl my-6 bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#F3E9DC] border-2 border-[#DFCBB2] rounded-[36px] shadow-[0_40px_100px_-20px_rgba(59,35,22,0.45)] overflow-hidden text-[#3B2316] select-none"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#FAF0DF] via-[#FAF6F0] to-[#FAF0DF] border-b border-[#DFCBB2] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#B84A27] text-[#FFFDF9] flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading text-xs font-extrabold tracking-[0.18em] text-[#B84A27] uppercase block">
                  ✦ ON-GROUND INTERVAL RESCHEDULER
                </span>
                <span className="text-[11px] font-mono text-[#7A5C49] font-bold">
                  Locked Slot: {stop.startTime} - {stop.endTime} ({stop.durationMinutes} mins)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-[#7A5C49] hover:text-[#3B2316] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[78vh] overflow-y-auto">
            {/* 1. Closed/Disrupted Stop Header Pill */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase font-bold text-[#A67B5B] block">
                  CURRENT SLOT TO REPLACE
                </span>
                <h3 className="text-base font-heading font-black text-[#3B2316]">
                  {stop.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#7A5C49] font-meta">
                  <span className="flex items-center gap-1 font-mono font-bold text-[#B84A27]">
                    <Clock className="w-3 h-3" />
                    <span>{stop.startTime} - {stop.endTime}</span>
                  </span>
                  <span>·</span>
                  <span>{stop.durationMinutes} mins</span>
                  <span>·</span>
                  <span>{stop.neighborhood}</span>
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-[#FAF0DF] border border-[#F2D5A7] text-[11px] font-heading font-extrabold text-[#B84A27]">
                Day {dayNumber} · {stop.formattedDateLabel}
              </div>
            </div>

            {/* 2. Step 1: Select What Happened */}
            <div className="space-y-3">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#B84A27] block">
                Step 1: Select On-Ground Disruption
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DISRUPTION_OPTIONS.map((opt) => {
                  const isSelected = selectedReason === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedReason(opt.id)}
                      className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#FAF0DF] border-[#B84A27] ring-1 ring-[#B84A27] shadow-xs'
                          : 'bg-[#FFFDF9] border-[#DFCBB2] hover:bg-[#FAF6F0]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#FAF6F0] border border-[#EBE1D3]">
                          {opt.icon}
                        </div>
                        <span className="text-xs font-heading font-bold text-[#3B2316]">
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A5C49] mt-1.5 line-clamp-1">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Step 2: Live Interval-Locked Nearby Alternatives */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-black uppercase tracking-wider text-[#B84A27] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Step 2: Open Nearby Alternatives Fitting Your {stop.startTime} - {stop.endTime} Window
                  </span>
                </label>
                <span className="text-[10px] font-mono font-bold text-[#7A5C49]">
                  {candidates.length} Available
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map((cand) => {
                    const isSelected = selectedCandidate?.id === cand.id;
                    return (
                      <div
                        key={cand.id}
                        className={`p-4 rounded-2xl transition-all border ${
                          isSelected
                            ? 'bg-[#FFFDF9] border-[#B84A27] shadow-md ring-1 ring-[#B84A27]/40'
                            : 'bg-[#FFFDF9] border-[#DFCBB2] hover:border-[#D47A39]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1">
                            {cand.image && (
                              <img
                                src={cand.image}
                                alt={cand.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#DFCBB2] shrink-0"
                              />
                            )}
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full bg-[#FAF0DF] text-[#B84A27] text-[10px] font-heading font-extrabold uppercase">
                                  {cand.category}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#9E5414]">
                                  {cand.distanceFromClosedStopKm} km away
                                </span>
                              </div>

                              <h4 className="text-sm font-heading font-black text-[#3B2316] leading-snug">
                                {cand.title}
                              </h4>

                              <p className="text-xs font-meta text-[#7A5C49]">
                                {cand.whyItFitsInterval}
                              </p>

                              <div className="flex items-center gap-2 text-[11px] font-mono text-[#A67B5B] pt-0.5">
                                <span>{cand.openStatusLabel}</span>
                                <span>·</span>
                                <span>Est. Access: ₹{cand.estAccessInr}</span>
                              </div>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleConfirmSwap(cand)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:opacity-95 text-[#FFFDF9] text-xs font-heading font-extrabold uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
                            >
                              <span>Swap into {stop.startTime} Slot</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-[#FAF6F0] border-t border-[#DFCBB2] flex items-center justify-between text-xs text-[#7A5C49]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#B84A27]" />
              <span>Swapping maintains your remaining stops and transit timings without disruption.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-heading font-bold text-[#3B2316] hover:text-[#B84A27] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default OnGroundRescheduleModal;
