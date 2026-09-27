import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Ticket,
  Users,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Calendar,
  Lock,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { launchRazorpayCheckout } from '../../lib/razorpayService';
import { usePassWalletStore, LokivaReceiptRecord, BookedStopPassItem } from '../../store/usePassWalletStore';

export interface SinglePlacePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: {
    id: number | string;
    title: string;
    city: string;
    state?: string;
    category: string;
    price: number;
    durationMins?: number;
    photo?: string;
    defaultSlotWindow?: string;
    custodianName?: string;
  };
  defaultTravelers?: number;
  onPassPurchased?: (receipt: LokivaReceiptRecord) => void;
}

const TIME_SLOT_PRESETS = [
  'Morning Horizon (08:30 AM - 10:00 AM)',
  'Midday Cultural Window (11:00 AM - 12:30 PM)',
  'Afternoon Artisan Session (02:30 PM - 04:00 PM)',
  'Sunset Golden Hour (05:00 PM - 06:30 PM)',
];

export function SinglePlacePassModal({
  isOpen,
  onClose,
  place,
  defaultTravelers = 2,
  onPassPurchased,
}: SinglePlacePassModalProps) {
  const { addReceipt, isPlaceBooked, setActiveViewingReceipt } = usePassWalletStore();
  const [travelersCount, setTravelersCount] = useState<number>(Math.max(1, defaultTravelers));
  const [selectedSlot, setSelectedSlot] = useState<string>(
    place.defaultSlotWindow || TIME_SLOT_PRESETS[0]
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [travelerName, setTravelerName] = useState<string>('Cultural Traveler');
  const [travelerEmail, setTravelerEmail] = useState<string>('traveler@lokiva.in');

  if (!isOpen) return null;

  const unitPrice = Math.max(0, place.price || 0);
  const subtotal = unitPrice * travelersCount;
  const preservationLevy = 0; // 100% direct, 0 extra markup
  const totalAmount = subtotal + preservationLevy;

  const existingReceipt = isPlaceBooked(place.id) || isPlaceBooked(place.title);

  const handleLaunchPayment = async () => {
    if (unitPrice === 0) {
      // Free experience reservation
      const passId = `LKV-FREE-${Date.now().toString(36).toUpperCase()}`;
      const receiptNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const item: BookedStopPassItem = {
        stopId: place.id,
        title: place.title,
        city: place.city,
        state: place.state,
        category: place.category,
        dateLabel: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
        slotWindow: selectedSlot,
        durationMinutes: place.durationMins || 60,
        unitPriceInr: 0,
        travelersCount,
        lineTotalInr: 0,
        custodianName: place.custodianName || 'Local Heritage Sanctuary',
        imageUrl: place.photo,
      };

      const record: LokivaReceiptRecord = {
        passId,
        receiptNumber,
        purchaseType: 'single_place',
        title: place.title,
        city: place.city,
        state: place.state,
        travelerName,
        travelerEmail,
        travelersCount,
        items: [item],
        subtotalInr: 0,
        bundleSavingsInr: 0,
        taxesAndPreservationLevyInr: 0,
        totalPaidInr: 0,
        razorpayPaymentId: `free_access_${Date.now()}`,
        razorpayOrderId: `order_free_${Date.now()}`,
        paidAtIso: new Date().toISOString(),
        verificationUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-pass/${passId}`,
      };

      addReceipt(record);
      setActiveViewingReceipt(record);
      onPassPurchased?.(record);
      onClose();
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
      return;
    }

    setIsProcessing(true);

    try {
      await launchRazorpayCheckout({
        amountInInr: totalAmount,
        title: 'LOKIVA · Cultural Pass',
        description: `Single Experience Pass: ${place.title}`,
        prefill: {
          name: travelerName,
          email: travelerEmail,
        },
        notes: {
          stopId: String(place.id),
          placeTitle: place.title,
          city: place.city,
          travelers: String(travelersCount),
          slotWindow: selectedSlot,
        },
        onSuccess: (rzpRes) => {
          setIsProcessing(false);
          const passId = `LKV-PASS-${Date.now().toString(36).toUpperCase()}`;
          const receiptNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

          const item: BookedStopPassItem = {
            stopId: place.id,
            title: place.title,
            city: place.city,
            state: place.state,
            category: place.category,
            dateLabel: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
            slotWindow: selectedSlot,
            durationMinutes: place.durationMins || 60,
            unitPriceInr: unitPrice,
            travelersCount,
            lineTotalInr: subtotal,
            custodianName: place.custodianName || 'Direct Cultural Guild',
            imageUrl: place.photo,
          };

          const record: LokivaReceiptRecord = {
            passId,
            receiptNumber,
            purchaseType: 'single_place',
            title: place.title,
            city: place.city,
            state: place.state,
            travelerName,
            travelerEmail,
            travelersCount,
            items: [item],
            subtotalInr: subtotal,
            bundleSavingsInr: 0,
            taxesAndPreservationLevyInr: 0,
            totalPaidInr: totalAmount,
            razorpayPaymentId: rzpRes.razorpay_payment_id,
            razorpayOrderId: rzpRes.razorpay_order_id,
            razorpaySignature: rzpRes.razorpay_signature,
            paidAtIso: new Date().toISOString(),
            verificationUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-pass/${passId}`,
          };

          addReceipt(record);
          setActiveViewingReceipt(record);
          onPassPurchased?.(record);
          onClose();

          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch {}
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
        onError: (err) => {
          setIsProcessing(false);
          console.error('Razorpay Checkout failed:', err);
        },
      });
    } catch (err) {
      setIsProcessing(false);
      console.error('Payment launch error:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-[#3B2316]/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-[#FFFDF9] rounded-3xl border border-[#DFCBB2] shadow-2xl overflow-hidden text-[#3B2316]"
        >
          {/* Header */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#FAF0DF] via-[#FAF6F0] to-[#FAF0DF] border-b border-[#DFCBB2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#B84A27] text-[#FFFDF9] flex items-center justify-center shadow-sm">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#B84A27] block">
                  Direct Heritage Pass
                </span>
                <h3 className="text-base sm:text-lg font-heading font-black text-[#3B2316] line-clamp-1">
                  {place.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-[#7A5C49] hover:text-[#3B2316] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* If place already booked */}
            {existingReceipt && (
              <div className="p-4 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#B84A27] shrink-0" />
                  <div>
                    <span className="text-xs font-heading font-extrabold text-[#3B2316] block">
                      Pass Already Unlocked &amp; Verified
                    </span>
                    <span className="text-[11px] font-mono text-[#7A5C49]">
                      Pass ID: {existingReceipt.passId}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveViewingReceipt(existingReceipt);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#B84A27] text-[#FFFDF9] text-xs font-heading font-bold uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
                >
                  View QR
                </button>
              </div>
            )}

            {/* Place Overview Card */}
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E6DAC6] flex items-start gap-3.5">
              {place.photo && (
                <img
                  src={place.photo}
                  alt={place.title}
                  className="w-20 h-20 rounded-xl object-cover border border-[#E6DAC6] shrink-0 shadow-inner"
                />
              )}
              <div className="space-y-1 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-[#FAF0DF] text-[#B84A27] border border-[#F2D5A7] text-[10px] font-heading font-extrabold uppercase">
                  {place.category}
                </span>
                <h4 className="text-sm font-heading font-bold text-[#3B2316] leading-snug truncate">
                  {place.title}
                </h4>
                <div className="flex items-center gap-2 text-xs font-meta text-[#7A5C49]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#B84A27]" />
                    <span>{place.city}</span>
                  </span>
                  <span>·</span>
                  <span>{place.durationMins || 60} mins visit</span>
                </div>
              </div>
            </div>

            {/* 1. Traveler Count Stepper */}
            <div className="space-y-2">
              <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#7A5C49] flex items-center justify-between">
                <span>Number of Travelers</span>
                <span className="text-[11px] font-mono font-bold text-[#B84A27]">
                  ₹{unitPrice} per traveler
                </span>
              </label>

              <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#B84A27]" />
                  <span className="text-sm font-meta font-bold text-[#3B2316]">
                    {travelersCount} {travelersCount === 1 ? 'Traveler' : 'Travelers'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={travelersCount <= 1}
                    onClick={() => setTravelersCount((c) => Math.max(1, c - 1))}
                    className="w-8 h-8 rounded-xl border border-[#DFCBB2] bg-[#FAF6F0] hover:bg-[#FAF0DF] disabled:opacity-30 text-base font-bold flex items-center justify-center transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-display font-black text-sm text-[#3B2316]">
                    {travelersCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTravelersCount((c) => Math.min(20, c + 1))}
                    className="w-8 h-8 rounded-xl border border-[#DFCBB2] bg-[#FAF6F0] hover:bg-[#FAF0DF] text-base font-bold flex items-center justify-center transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Slot Window Selection */}
            <div className="space-y-2">
              <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#7A5C49] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#B84A27]" />
                <span>Preferred Time Slot Window</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(place.defaultSlotWindow ? [place.defaultSlotWindow, ...TIME_SLOT_PRESETS] : TIME_SLOT_PRESETS).map(
                  (slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-2xl text-left border text-xs font-meta transition cursor-pointer flex items-center justify-between ${
                        selectedSlot === slot
                          ? 'border-[#B84A27] bg-[#FAF0DF] text-[#3B2316] font-bold shadow-xs'
                          : 'border-[#E6DAC6] bg-[#FFFDF9] hover:bg-[#FAF6F0] text-[#5C3D2E]'
                      }`}
                    >
                      <span className="line-clamp-1">{slot}</span>
                      {selectedSlot === slot && <Check className="w-3.5 h-3.5 text-[#B84A27] shrink-0 ml-1.5" />}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* 3. Direct Custodian Disbursement & Pricing Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FAF0DF]/60 border border-[#DFCBB2] space-y-2 text-xs font-meta text-[#5C3D2E]">
              <div className="flex justify-between">
                <span>Admission &amp; Masterclass Access ({travelersCount} travelers)</span>
                <span className="font-mono font-bold text-[#3B2316]">
                  {unitPrice === 0 ? 'Free Open Access' : `₹${subtotal.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Middleman Aggregator Commission</span>
                <span className="font-bold text-[#9E5414]">₹0 (100% Direct)</span>
              </div>
              <div className="pt-2 border-t border-[#DFCBB2] flex justify-between items-baseline font-bold text-sm text-[#3B2316]">
                <span className="font-heading font-black">Total Amount</span>
                <span className="font-display font-black text-lg text-[#B84A27]">
                  {totalAmount === 0 ? '₹0 (Free Pass)' : `₹${totalAmount.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            {/* Assurance Trust Seal */}
            <div className="flex items-center gap-2 text-[11px] font-meta text-[#7A5C49]">
              <ShieldCheck className="w-4 h-4 text-[#B84A27] shrink-0" />
              <span>
                Protected by Razorpay 256-bit SSL encryption. Funds disbursed directly to local heritage custodians.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-6 bg-[#FAF6F0] border-t border-[#DFCBB2] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-xs font-heading font-bold uppercase tracking-wider text-[#7A5C49] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleLaunchPayment}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#B84A27]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              <Ticket className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Connecting to Razorpay...'
                  : totalAmount === 0
                  ? 'Confirm & Unlock Free Pass →'
                  : `Proceed to Pay ₹${totalAmount.toLocaleString('en-IN')} via Razorpay →`}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SinglePlacePassModal;
