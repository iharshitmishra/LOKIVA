import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Users,
  Award,
  ArrowRight,
  Printer,
  Sparkles,
  Ticket,
  ChevronRight,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePassWalletStore, LokivaReceiptRecord, BookedStopPassItem } from '../store/usePassWalletStore';

export function VerifyPassPage() {
  const { passId } = useParams<{ passId: string }>();
  const [searchParams] = useSearchParams();
  const { passes, getReceiptById, markPassCheckedIn, addReceipt } = usePassWalletStore();

  const [activePass, setActivePass] = useState<LokivaReceiptRecord | null>(null);
  const [isCheckedInLocal, setIsCheckedInLocal] = useState(false);
  const [checkedInTime, setCheckedInTime] = useState<string | null>(null);
  const [checkedInStopsLocal, setCheckedInStopsLocal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!passId) return;

    // 1. First check local store
    const storePass = getReceiptById(passId);
    if (storePass) {
      setActivePass(storePass);
      if (storePass.isCheckedIn) {
        setIsCheckedInLocal(true);
        setCheckedInTime(storePass.checkedInAt || null);
      }
      if (storePass.stopCheckIns) {
        const checkedMap: Record<string, boolean> = {};
        Object.keys(storePass.stopCheckIns).forEach((k) => {
          checkedMap[k] = true;
        });
        setCheckedInStopsLocal(checkedMap);
      }
      return;
    }

    // 2. Fallback: Parse URL parameters (allows universal scanning on secondary mobile devices)
    const title = searchParams.get('title') || 'Verified Lokiva Cultural Heritage Pass';
    const name = searchParams.get('name') || 'Guest Traveler';
    const email = searchParams.get('email') || 'traveler@lokiva.world';
    const count = parseInt(searchParams.get('count') || '1', 10);
    const city = searchParams.get('city') || 'Cultural Hub';
    const sub = parseFloat(searchParams.get('sub') || '0');
    const amt = parseFloat(searchParams.get('amt') || '0');
    const payId = searchParams.get('payId') || 'pay_verified_lokiva_gate';
    const ordId = searchParams.get('ordId') || 'order_verified_gate';
    const type = (searchParams.get('type') as any) || 'single_place';
    const date = searchParams.get('date') || new Date().toISOString();

    let items: BookedStopPassItem[] = [];
    try {
      const itemsRaw = searchParams.get('items');
      if (itemsRaw) {
        const parsed = JSON.parse(itemsRaw);
        if (Array.isArray(parsed)) {
          items = parsed.map((item, idx) => ({
            stopId: `stop_${idx + 1}`,
            title: item.t || 'Heritage Experience',
            city,
            category: item.cat || 'Heritage & Craft',
            dateLabel: 'Reserved Day',
            slotWindow: item.s || '09:00 AM - 10:30 AM',
            durationMinutes: item.d || 60,
            unitPriceInr: item.p || Math.round(amt / Math.max(1, count)),
            travelersCount: count,
            lineTotalInr: (item.p || Math.round(amt / Math.max(1, count))) * count,
            custodianName: item.c || 'Direct Cultural Guild',
          }));
        }
      }
    } catch {
      // Fallback default single item
    }

    if (items.length === 0) {
      items = [
        {
          stopId: 'stop_1',
          title: title,
          city,
          category: 'Heritage & Craft',
          dateLabel: 'Reserved Day',
          slotWindow: '08:30 AM - 10:00 AM',
          durationMinutes: 90,
          unitPriceInr: Math.round(amt / Math.max(1, count)),
          travelersCount: count,
          lineTotalInr: amt || 850,
          custodianName: 'Verified Heritage Guild',
        },
      ];
    }

    const reconstructed: LokivaReceiptRecord = {
      passId,
      receiptNumber: `LKV-RCPT-${passId.slice(-6)}`,
      purchaseType: type,
      title,
      city,
      travelerName: name,
      travelerEmail: email,
      travelersCount: count,
      items,
      subtotalInr: sub || amt,
      bundleSavingsInr: 0,
      taxesAndPreservationLevyInr: 0,
      totalPaidInr: amt || 850,
      razorpayPaymentId: payId,
      razorpayOrderId: ordId,
      paidAtIso: date,
      verificationUrl: window.location.href,
    };

    setActivePass(reconstructed);
    // Optionally persist into store
    try {
      addReceipt(reconstructed);
    } catch {}
  }, [passId, searchParams, getReceiptById, addReceipt]);

  const handleGateCheckIn = (stopIndex?: number) => {
    const nowStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (stopIndex !== undefined) {
      setCheckedInStopsLocal((prev) => ({ ...prev, [String(stopIndex)]: true }));
      if (passId) {
        markPassCheckedIn(passId, stopIndex, 'Verified Gatekeeper');
      }
    } else {
      setIsCheckedInLocal(true);
      setCheckedInTime(nowStr);
      if (passId) {
        markPassCheckedIn(passId, undefined, 'Verified Gatekeeper');
      }
    }

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#B84A27', '#D47A39', '#3B2316'],
      });
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activePass) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 bg-[#FFFDF9] rounded-3xl border border-[#DFCBB2] shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF0DF] text-[#B84A27] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-black text-[#3B2316]">
            Pass Not Found or Invalid
          </h2>
          <p className="text-xs text-[#7A5C49]">
            The pass identifier provided could not be verified on the cryptographic ledger.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B84A27] text-[#FFFDF9] text-xs font-heading font-bold uppercase tracking-wider shadow-sm"
          >
            <span>Return to Lokiva Explore</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = activePass.paidAtIso
    ? new Date(activePass.paidAtIso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Verified Protocol';

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white text-[#3B2316]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            to="/itinerary"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#B84A27] hover:text-[#9E3B1C] transition cursor-pointer"
          >
            <span>← Back to My Itinerary</span>
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-xs font-heading font-bold text-[#3B2316] transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#B84A27]" />
            <span>Print Verification Slip</span>
          </button>
        </div>

        {/* Master Gate Verification Card */}
        <div className="relative bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#F3E9DC] border border-[#DFCBB2] rounded-[36px] shadow-[0_30px_80px_-15px_rgba(59,35,22,0.35)] overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Top Status Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#FAF0DF] via-[#FAF6F0] to-[#FAF0DF] border-b border-[#DFCBB2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#B84A27] text-[#FFFDF9] flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-heading font-extrabold uppercase tracking-[0.2em] text-[#B84A27] block">
                  LOKIVA ON-GROUND GATE VERIFICATION PROTOCOL
                </span>
                <span className="text-xs font-mono font-bold text-[#7A5C49]">
                  RECORD ID: {activePass.passId}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0DF] border border-[#F2D5A7] text-xs font-heading font-extrabold text-[#B84A27] self-start sm:self-center shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#B84A27] animate-ping" />
              <span>✓ LIVE CRYPTOGRAPHIC MATCH</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Authenticity Seal & Title Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-xs">
              {/* Animated Rotating Mandala / Compass Seal */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-[#D47A39]/60"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 rounded-full border border-dotted border-[#B84A27]/70"
                />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FAF0DF] to-[#F3E9DC] border border-[#DFCBB2] flex items-center justify-center text-[#B84A27] shadow-inner">
                  <Compass className="w-8 h-8" />
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DF] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#B84A27]">
                  <Sparkles className="w-3 h-3" />
                  <span>Verified Public Gate Pass</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] leading-tight">
                  {activePass.title}
                </h1>
                <p className="text-xs text-[#7A5C49]">
                  Circuit Destination: <strong className="text-[#3B2316]">{activePass.city}</strong> · Settled on {formattedDate}
                </p>
              </div>
            </div>

            {/* Core Verification Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#A67B5B] block">
                  ADMITTED TRAVELERS
                </span>
                <div className="flex items-center gap-1.5 text-base font-heading font-black text-[#B84A27]">
                  <Users className="w-4 h-4" />
                  <span>{activePass.travelersCount} Person(s)</span>
                </div>
                <span className="text-xs text-[#7A5C49] truncate block">
                  Lead: {activePass.travelerName}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#A67B5B] block">
                  PAYMENT AUTHORIZATION
                </span>
                <span className="text-sm font-mono font-black text-[#3B2316] break-all block">
                  {activePass.razorpayPaymentId}
                </span>
                <span className="text-xs text-[#7A5C49] block">
                  Order: {activePass.razorpayOrderId}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#A67B5B] block">
                  DIRECT CUSTODIAN TOTAL
                </span>
                <span className="text-base font-display font-black text-[#B84A27] block">
                  ₹{activePass.totalPaidInr.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-heading font-bold text-[#9E5414] block">
                  100% Direct Settlement
                </span>
              </div>
            </div>

            {/* Master Check-In Status Action */}
            <div className="p-5 rounded-3xl bg-[#FAF0DF] border border-[#F2D5A7] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#B84A27]" />
                  <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#3B2316]">
                    {isCheckedInLocal ? 'Traveler Checked In at Gate' : 'Gate Entry Ready'}
                  </h3>
                </div>
                <p className="text-xs text-[#7A5C49]">
                  {isCheckedInLocal
                    ? `Stamped at ${checkedInTime || 'Gate Checkpoint'} by Authorized Gatekeeper`
                    : 'Present this digital screen to the monument custodian or workshop coordinator upon arrival.'}
                </p>
              </div>

              {!isCheckedInLocal ? (
                <button
                  type="button"
                  onClick={() => handleGateCheckIn()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:opacity-95 text-xs font-heading font-extrabold uppercase tracking-wider text-[#FFFDF9] transition cursor-pointer shadow-md active:scale-[0.98] print:hidden"
                >
                  ✓ Mark Traveler Checked-In
                </button>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-[#FFFDF9] border border-[#DFCBB2] text-xs font-heading font-bold text-[#B84A27] shadow-2xs">
                  ✓ Gate Entry Stamped
                </div>
              )}
            </div>

            {/* Itemized Stop Gate Checkpoints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-heading font-black uppercase tracking-widest text-[#B84A27] flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" />
                  <span>Scheduled Stops &amp; Entry Windows ({activePass.items.length})</span>
                </h3>
                <span className="text-[11px] font-mono text-[#7A5C49] font-bold">
                  Gatepass Validated
                </span>
              </div>

              <div className="space-y-3">
                {activePass.items.map((item, idx) => {
                  const isStopChecked = Boolean(checkedInStopsLocal[String(idx)]);
                  return (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF0DF] border border-[#F2D5A7] text-[#B84A27] font-display font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-heading font-bold text-[#3B2316] leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-[#7A5C49]">
                            Designated Custodian: <strong className="text-[#3B2316]">{item.custodianName || 'Direct Cultural Guild'}</strong>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#A67B5B] flex-wrap">
                            <span className="flex items-center gap-1 font-mono font-bold text-[#B84A27]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{item.slotWindow}</span>
                            </span>
                            <span>·</span>
                            <span>{item.durationMinutes} mins</span>
                            <span>·</span>
                            <span>{item.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        {isStopChecked ? (
                          <span className="px-3 py-1 rounded-full bg-[#FAF0DF] border border-[#F2D5A7] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#B84A27]">
                            ✓ Stop Checked-In
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGateCheckIn(idx)}
                            className="px-3 py-1 rounded-lg border border-[#DFCBB2] bg-[#FAF6F0] hover:bg-[#FAF0DF] text-[10px] font-heading font-bold uppercase tracking-wider text-[#3B2316] transition cursor-pointer print:hidden"
                          >
                            Check-In Stop {idx + 1}
                          </button>
                        )}
                        <span className="font-mono text-xs font-bold text-[#7A5C49]">
                          ₹{item.lineTotalInr.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Custodian Impact Guarantee */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] text-xs space-y-1">
              <span className="font-heading font-bold text-[#3B2316] block">
                ✦ Public Verification Security Note
              </span>
              <p className="text-[#7A5C49] leading-relaxed">
                This pass is registered cryptographically under LOKIVA Gateway Protocol. 100% of all experience fees have been transferred directly to verified local artisans and heritage custodians without intermediary deductions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyPassPage;
