import React from 'react';
import { Trash2, X, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { ItineraryTripDetails } from '../../types/itinerary';

interface DeleteTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripDetails: ItineraryTripDetails | null;
  onConfirmDelete: () => void;
}

export function DeleteTripModal({
  isOpen,
  onClose,
  tripDetails,
  onConfirmDelete,
}: DeleteTripModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26160E]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6DAC6] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-[#3B2316]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#7A5C49] hover:text-[#3B2316] rounded-full hover:bg-[#FAF6F0] transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon and Title */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF2E9] border border-[#F5D0B5] flex items-center justify-center text-[#B84A27] shadow-2xs">
            <Trash2 className="w-6 h-6 text-[#B84A27]" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-heading font-extrabold text-[#B84A27] uppercase tracking-wider block">
              Itinerary Management
            </span>
            <h3 className="text-2xl font-display font-black text-[#3B2316]">
              Delete This Itinerary?
            </h3>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E6DAC6] space-y-2 text-xs font-sans text-[#5C3D2E]">
          <p className="font-heading font-bold text-[#3B2316] text-sm leading-snug">
            {tripDetails?.title || 'Current Curated Trip Plan'}
          </p>
          <p className="text-[#7A5C49] leading-relaxed">
            Deleting this itinerary will remove all scheduled stops, custom timings, and calculated route legs so you can start a brand new journey from scratch.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E6DAC6] bg-[#FFFDF9] hover:bg-[#FAF6F0] text-xs font-heading font-bold text-[#5C3D2E] transition cursor-pointer"
          >
            Keep Itinerary
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:opacity-95 text-[#FFFDF9] text-xs font-heading font-bold shadow-md shadow-[#B84A27]/20 flex items-center justify-center gap-2 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete & Start New</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTripModal;
