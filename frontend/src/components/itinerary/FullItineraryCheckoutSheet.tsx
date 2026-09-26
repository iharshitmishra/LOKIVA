import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Ticket,
  Car,
  Utensils,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  Clock,
  MapPin,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { launchRazorpayCheckout } from '../../lib/razorpayService';
import {
  usePassWalletStore,
  LokivaReceiptRecord,
  BookedStopPassItem,
} from '../../store/usePassWalletStore';
import {
  ItineraryDay,
  ItineraryTripDetails,
  ItineraryActivity,
} from '../../types/itinerary';

interface FullItineraryCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  days: ItineraryDay[];
  tripDetails: ItineraryTripDetails;
  categoryBreakdown?: {
    tickets: number;
    food: number;
    transit: number;
  };
  grandTotal?: number;
  onSuccess?: (receipt: LokivaReceiptRecord) => void;
}

export function FullItineraryCheckoutSheet({
  isOpen,
  onClose,
  days,
  tripDetails,
  categoryBreakdown,
  grandTotal,
  onSuccess,
}: FullItineraryCheckoutSheetProps) {
  const { addReceipt, isPlaceBooked, setActiveViewingReceipt } = usePassWalletStore();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [includeTransitBuffer, setIncludeTransitBuffer] = useState<boolean>(true);
  const [includeCulinaryTasting, setIncludeCulinaryTasting] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Traveler Details Form
  const [travelerName, setTravelerName] = useState<string>('Cultural Traveler');
  const [travelerEmail, setTravelerEmail] = useState<string>('traveler@lokiva.in');
  const [travelerPhone, setTravelerPhone] = useState<string>('9876543210');

  if (!isOpen) return null;

  const travelers = Math.max(1, tripDetails.travelers || 2);
  const cityName = tripDetails.destination || days[0]?.activities[0]?.city || 'Cultural Circuit';
  const stateName = tripDetails.state || '';

  // Extract all activities across all days
  const allActivitiesWithDay: { dayNumber: number; activity: ItineraryActivity }[] = [];
  days.forEach((d) => {
    (d.activities || []).forEach((act) => {
      allActivitiesWithDay.push({ dayNumber: d.dayNumber, activity: act });
    });
  });

  // Filter paid items, checking for already individually booked places
  const allPaidStops = allActivitiesWithDay.filter((item) => (item.activity.costPerPerson || 0) > 0);
  const unbookedPaidStops = allPaidStops.filter((item) => !isPlaceBooked(item.activity.id) && !isPlaceBooked(item.activity.title));
  const alreadyBookedCount = allPaidStops.length - unbookedPaidStops.length;

  // Calculate costs
  const baseTicketCost = unbookedPaidStops.reduce(
    (sum, item) => sum + (item.activity.costPerPerson || 0) * travelers,
    0
  );

  const calculatedTransitCost = days.reduce((sum, d) => {
    const dayTransit = (d.activities || []).reduce((ts, a) => ts + (a.transitCost || 0), 0);
    return sum + (dayTransit || 450);
  }, 0);

  const calculatedFoodCost = days.reduce((sum, d) => {
    return sum + (d.mealBudgetPerPerson || 350) * travelers;
  }, 0);

  const activeTransitCost = includeTransitBuffer ? calculatedTransitCost : 0;
  const activeFoodCost = includeCulinaryTasting ? calculatedFoodCost : 0;
  const rawSubtotal = baseTicketCost + activeTransitCost + activeFoodCost;

  // 5% Multi-Stop Master Pass Waiver Discount
  const bundleSavings = rawSubtotal > 0 ? Math.round(rawSubtotal * 0.05) : 0;
  const preservationLevy = 0; // zero hidden markup
  const finalPayableTotal = Math.max(0, rawSubtotal - bundleSavings + preservationLevy);

  const handleProceedToStep2 = () => {
    setCurrentStep(2);
  };

  const handleLaunchFullPayment = async () => {
    setIsProcessing(true);

    const bookedItems: BookedStopPassItem[] = unbookedPaidStops.map((item) => {
      const act = item.activity;
      const unitPrice = act.costPerPerson || 0;
      return {
        stopId: act.id,
        title: act.title,
        city: act.city || cityName,
        state: stateName,
        category: act.category || 'Cultural Heritage',
        dateLabel: `Day ${item.dayNumber}`,
        slotWindow: `${act.startTime || '09:00 AM'} - ${act.endTime || '10:30 AM'}`,
        durationMinutes: act.visitDurationMinutes || act.durationMins || 60,
        unitPriceInr: unitPrice,
        travelersCount: travelers,
        lineTotalInr: unitPrice * travelers,
        custodianName: (act as any).provider_name || `${act.category || 'Cultural'} Heritage Guild`,
        imageUrl: act.photos?.[0],
      };
    });

    try {
      await launchRazorpayCheckout({
        amountInInr: finalPayableTotal,
        title: 'LOKIVA · Full Itinerary Master Pass',
        description: `${days.length}-Day Full Circuit Pass: ${cityName}`,
        prefill: {
          name: travelerName,
          email: travelerEmail,
          contact: travelerPhone,
        },
        notes: {
          circuitCity: cityName,
          totalDays: String(days.length),
          travelers: String(travelers),
          includedStops: String(bookedItems.length),
          transitIncluded: String(includeTransitBuffer),
        },
        onSuccess: (rzpRes) => {
          setIsProcessing(false);
          const passId = `LKV-PASS-${Date.now().toString(36).toUpperCase()}`;
          const receiptNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

          const record: LokivaReceiptRecord = {
            passId,
            receiptNumber,
            purchaseType: 'full_itinerary',
            title: `${days.length}-Day Full Itinerary Master Pass (${cityName})`,
            city: cityName,
            state: stateName,
            travelerName,
            travelerEmail,
            travelerPhone,
            travelersCount: travelers,
            items: bookedItems,
            subtotalInr: rawSubtotal,
            bundleSavingsInr: bundleSavings,
            taxesAndPreservationLevyInr: preservationLevy,
            totalPaidInr: finalPayableTotal,
            razorpayPaymentId: rzpRes.razorpay_payment_id,
            razorpayOrderId: rzpRes.razorpay_order_id,
            razorpaySignature: rzpRes.razorpay_signature,
            paidAtIso: new Date().toISOString(),
            verificationUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-pass/${passId}`,
          };

          addReceipt(record);
          setActiveViewingReceipt(record);
          onSuccess?.(record);
          onClose();

          try {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          } catch {}
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
        onError: (err) => {
          setIsProcessing(false);
          console.error('Full Itinerary Razorpay Checkout error:', err);
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
          className="relative w-full max-w-2xl bg-[#FFFDF9] rounded-3xl border border-[#DFCBB2] shadow-2xl overflow-hidden text-[#3B2316]"
        >
          {/* Header */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#FAF0DF] via-[#FAF6F0] to-[#FAF0DF] border-b border-[#DFCBB2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#B84A27] text-[#FFFDF9] flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B84A27] text-[#FFFDF9] text-[10px] font-heading font-extrabold uppercase tracking-widest">
                    Step {currentStep} of 2
                  </span>
                  <span className="text-xs font-meta font-bold text-[#7A5C49]">
                    {days.length} Days · {travelers} Travelers
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-heading font-black text-[#3B2316] tracking-tight">
                  {currentStep === 1 ? 'Review Itinerary Inclusions & Add-Ons' : 'Confirm Traveler Details & Pay'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-[#7A5C49] hover:text-[#3B2316] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* STEP 1: REVIEW STOPS & ADD-ONS */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Already Booked Single Places Notice */}
                {alreadyBookedCount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center gap-2.5 text-xs font-meta text-[#7A5C49]">
                    <CheckCircle2 className="w-4 h-4 text-[#B84A27] shrink-0" />
                    <span>
                      <strong>{alreadyBookedCount} Single Stop {alreadyBookedCount === 1 ? 'Pass' : 'Passes'}</strong> already booked previously. Deducted automatically to prevent double-charging.
                    </span>
                  </div>
                )}

                {/* List of Paid Cultural Stops Included */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-black uppercase tracking-wider text-[#B84A27]">
                      Included Admission &amp; Masterclasses ({unbookedPaidStops.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-[#3B2316]">
                      ₹{baseTicketCost.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {unbookedPaidStops.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E6DAC6] flex items-center justify-between gap-3 text-xs font-meta"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-[#FAF0DF] text-[#B84A27] font-display font-black text-[11px] flex items-center justify-center shrink-0">
                            D{item.dayNumber}
                          </span>
                          <div className="truncate">
                            <span className="font-heading font-bold text-[#3B2316] block truncate">
                              {item.activity.title}
                            </span>
                            <span className="text-[11px] text-[#7A5C49]">
                              {item.activity.startTime || '09:00 AM'} - {item.activity.endTime || '10:30 AM'} · {item.activity.category}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-[#3B2316] shrink-0">
                          ₹{((item.activity.costPerPerson || 0) * travelers).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Bundle Add-ons */}
                <div className="space-y-3 pt-2 border-t border-[#DFCBB2]">
                  <span className="text-xs font-heading font-black uppercase tracking-wider text-[#B84A27] block">
                    Optional Field Add-Ons &amp; Transit
                  </span>

                  {/* Transit Buffer Toggle */}
                  <label className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center justify-between gap-3 cursor-pointer hover:border-[#B84A27] transition-colors shadow-2xs">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={includeTransitBuffer}
                        onChange={(e) => setIncludeTransitBuffer(e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#B84A27] rounded border-[#DFCBB2] focus:ring-[#B84A27]"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-[#B84A27]" />
                          <span className="text-xs font-heading font-bold text-[#3B2316]">
                            Dedicated Local Transit &amp; Driver Buffer
                          </span>
                        </div>
                        <p className="text-[11px] font-meta text-[#7A5C49]">
                          Pre-calibrated e-rickshaw, auto, and AC cab transit for all {days.length} days of exploration.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#3B2316] shrink-0">
                      ₹{calculatedTransitCost.toLocaleString('en-IN')}
                    </span>
                  </label>

                  {/* Culinary Trail Toggle */}
                  <label className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center justify-between gap-3 cursor-pointer hover:border-[#B84A27] transition-colors shadow-2xs">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={includeCulinaryTasting}
                        onChange={(e) => setIncludeCulinaryTasting(e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#B84A27] rounded border-[#DFCBB2] focus:ring-[#B84A27]"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-[#D47A39]" />
                          <span className="text-xs font-heading font-bold text-[#3B2316]">
                            Regional Culinary &amp; Tea Tasting Allocation
                          </span>
                        </div>
                        <p className="text-[11px] font-meta text-[#7A5C49]">
                          Pre-funded breakfast hearths, afternoon high-tea stops, and signature gastronomy.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#3B2316] shrink-0">
                      ₹{calculatedFoodCost.toLocaleString('en-IN')}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: CONFIRM TRAVELER DETAILS & PRICING SUMMARY */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Traveler Details Input */}
                <div className="space-y-3">
                  <span className="text-xs font-heading font-black uppercase tracking-wider text-[#B84A27] block">
                    Lead Traveler Information
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-meta font-bold text-[#7A5C49]">Full Name</label>
                      <input
                        type="text"
                        value={travelerName}
                        onChange={(e) => setTravelerName(e.target.value)}
                        placeholder="e.g. Aditi Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] text-[#3B2316] font-meta focus:outline-none focus:border-[#B84A27]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-meta font-bold text-[#7A5C49]">Email Address</label>
                      <input
                        type="email"
                        value={travelerEmail}
                        onChange={(e) => setTravelerEmail(e.target.value)}
                        placeholder="traveler@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] text-[#3B2316] font-meta focus:outline-none focus:border-[#B84A27]"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-meta font-bold text-[#7A5C49]">WhatsApp / Phone Number</label>
                      <input
                        type="tel"
                        value={travelerPhone}
                        onChange={(e) => setTravelerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] text-[#3B2316] font-meta focus:outline-none focus:border-[#B84A27]"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Transparent Pricing Summary */}
                <div className="p-5 rounded-3xl bg-[#FAF0DF]/60 border border-[#DFCBB2] space-y-2.5 text-xs font-meta text-[#5C3D2E]">
                  <div className="flex justify-between">
                    <span>Cultural Admission &amp; Masterclasses</span>
                    <span className="font-mono font-bold text-[#3B2316]">
                      ₹{baseTicketCost.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {includeTransitBuffer && (
                    <div className="flex justify-between">
                      <span>Local Transit &amp; Dedicated Driver</span>
                      <span className="font-mono font-bold text-[#3B2316]">
                        ₹{calculatedTransitCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {includeCulinaryTasting && (
                    <div className="flex justify-between">
                      <span>Regional Food &amp; Tea Tasting Allocation</span>
                      <span className="font-mono font-bold text-[#3B2316]">
                        ₹{calculatedFoodCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {bundleSavings > 0 && (
                    <div className="flex justify-between text-[#B84A27] font-bold">
                      <span>5% Multi-Stop Circuit Bundle Waiver</span>
                      <span className="font-mono">-₹{bundleSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-[#DFCBB2] flex justify-between items-baseline font-bold text-sm text-[#3B2316]">
                    <span className="font-heading font-black">Grand Total Payable</span>
                    <span className="font-display font-black text-xl text-[#B84A27]">
                      ₹{finalPayableTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <span className="text-[11px] font-meta text-[#7A5C49] block pt-1">
                    ₹{Math.round(finalPayableTotal / travelers).toLocaleString('en-IN')} per traveler for {travelers} travelers
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-meta text-[#7A5C49]">
                  <ShieldCheck className="w-4 h-4 text-[#B84A27] shrink-0" />
                  <span>
                    Direct disbursement: 100% of proceeds credited to artisan guilds, museum trusts, and local drivers.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Footer */}
          <div className="p-5 sm:p-6 bg-[#FAF6F0] border-t border-[#DFCBB2] flex items-center justify-between gap-3">
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-xs font-heading font-bold text-[#7A5C49] transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Review</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-xs font-heading font-bold text-[#7A5C49] transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#B84A27]/25 transition flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Proceed to Traveler Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleLaunchFullPayment}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#B84A27]/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Launching Razorpay...'
                    : `Pay ₹${finalPayableTotal.toLocaleString('en-IN')} Now with Razorpay →`}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default FullItineraryCheckoutSheet;
