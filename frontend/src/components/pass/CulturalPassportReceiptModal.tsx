import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Printer,
  Copy,
  Check,
  Clock,
  MapPin,
  ExternalLink,
  Award,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { usePassWalletStore, LokivaReceiptRecord } from '../../store/usePassWalletStore';

interface CulturalPassportReceiptModalProps {
  receipt?: LokivaReceiptRecord | null;
  onClose?: () => void;
}

export function CulturalPassportReceiptModal({
  receipt: propReceipt,
  onClose,
}: CulturalPassportReceiptModalProps) {
  const { activeViewingReceipt, setActiveViewingReceipt } = usePassWalletStore();
  const currentReceipt = propReceipt || activeViewingReceipt;
  const [copiedPassId, setCopiedPassId] = useState(false);

  // Trigger celebratory confetti on initial open
  useEffect(() => {
    if (currentReceipt) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#B84A27', '#D47A39', '#3B2316', '#FAF0DF'],
        });
      } catch {
        // Fallback gracefully if canvas unavailable
      }
    }
  }, [currentReceipt?.passId]);

  if (!currentReceipt) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveViewingReceipt(null);
    }
  };

  const handleCopyPassId = () => {
    navigator.clipboard.writeText(currentReceipt.passId);
    setCopiedPassId(true);
    setTimeout(() => setCopiedPassId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Build universally resolvable verification URL with encoded query fallback parameters
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const itemSummary = JSON.stringify(
    (currentReceipt.items || []).map((i) => ({
      t: i.title,
      s: i.slotWindow,
      d: i.durationMinutes,
      p: i.unitPriceInr,
      c: i.custodianName,
      cat: i.category,
    }))
  );

  const verificationParams = new URLSearchParams({
    title: currentReceipt.title || '',
    name: currentReceipt.travelerName || '',
    email: currentReceipt.travelerEmail || '',
    count: String(currentReceipt.travelersCount || 1),
    city: currentReceipt.city || '',
    sub: String(currentReceipt.subtotalInr || 0),
    amt: String(currentReceipt.totalPaidInr || 0),
    payId: currentReceipt.razorpayPaymentId || '',
    ordId: currentReceipt.razorpayOrderId || '',
    type: currentReceipt.purchaseType || 'single_place',
    date: currentReceipt.paidAtIso || new Date().toISOString(),
    items: itemSummary,
  });

  const universalVerificationUrl = `${origin}/verify-pass/${currentReceipt.passId}?${verificationParams.toString()}`;

  const paidDateFormatted = currentReceipt.paidAtIso
    ? new Date(currentReceipt.paidAtIso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Verified Today';

  return (
    <AnimatePresence>
      <div
        id="lokiva-receipt-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#3B2316]/80 backdrop-blur-md print:p-0 print:bg-white print:static"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl my-6 bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#F3E9DC] border border-[#DFCBB2] rounded-[36px] shadow-[0_40px_100px_-20px_rgba(59,35,22,0.45)] overflow-hidden text-[#3B2316] select-none print:shadow-none print:border-none print:m-0 print:max-w-none print:rounded-none"
        >
          {/* Top Header Seal Bar */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-[#FAF0DF] via-[#FAF6F0] to-[#FAF0DF] border-b border-[#DFCBB2] flex items-center justify-between print:bg-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#B84A27] text-[#FFFDF9] flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-heading text-xs font-extrabold tracking-[0.2em] text-[#B84A27] uppercase">
                ✦ LOKIVA VERIFIED CULTURAL PASSPORT · OFFICIAL GATE ENTRY
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-[#7A5C49] hover:text-[#3B2316] transition cursor-pointer print:hidden"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body / Ticket Scrollable Area */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-4">
            {/* TOP HALF: Luxury Boarding Gate Pass & Scannable QR Code */}
            <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left Column: Pass Identity & Telemetry */}
                <div className="space-y-3 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0DF] border border-[#F2D5A7] text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#B84A27]">
                    <Sparkles className="w-3 h-3" />
                    <span>{currentReceipt.purchaseType === 'full_itinerary' ? 'All-Access Circuit Pass' : 'Single Stop Pass'}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-display font-black text-[#3B2316] tracking-tight leading-tight">
                    {currentReceipt.title}
                  </h2>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBE1D3]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#A67B5B] block">
                        ADMIT COUNT
                      </span>
                      <span className="text-sm font-heading font-black text-[#B84A27]">
                        {currentReceipt.travelersCount} {currentReceipt.travelersCount === 1 ? 'Traveler' : 'Travelers'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EBE1D3]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#A67B5B] block">
                        CITY / CIRCUIT
                      </span>
                      <span className="text-sm font-heading font-black text-[#3B2316]">
                        {currentReceipt.city}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-[#7A5C49]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#A67B5B]">PASS ID:</span>
                      <span className="font-mono font-bold text-[#B84A27]">{currentReceipt.passId}</span>
                      <button
                        type="button"
                        onClick={handleCopyPassId}
                        className="p-1 rounded bg-[#FAF6F0] border border-[#DFCBB2] text-[#B84A27] hover:bg-[#FAF0DF] transition cursor-pointer print:hidden"
                        title="Copy Pass ID"
                      >
                        {copiedPassId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-[#A67B5B]">ISSUED TO: </span>
                      <span className="font-heading font-bold text-[#3B2316]">{currentReceipt.travelerName}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Scannable High-Contrast QR Code */}
                <div className="flex flex-col items-center p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#D47A39]/30 shadow-xs shrink-0 self-center md:self-stretch justify-center">
                  <div className="p-2 bg-[#FFFDF9] rounded-xl border border-[#DFCBB2] shadow-2xs">
                    <QRCodeSVG
                      value={universalVerificationUrl}
                      size={130}
                      fgColor="#3B2316"
                      bgColor="#FFFDF9"
                      level="Q"
                      includeMargin={false}
                    />
                  </div>

                  <span className="text-[10px] font-mono font-bold text-[#7A5C49] mt-2 uppercase tracking-wider">
                    Official Gate QR
                  </span>

                  <a
                    href={universalVerificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF0DF] hover:bg-[#F2D5A7] border border-[#DFCBB2] text-[11px] font-heading font-extrabold text-[#B84A27] tracking-wide transition cursor-pointer shadow-2xs print:hidden"
                  >
                    <span>🔍 Simulate Gate QR Scan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: Individual Stop Gate Stubs */}
            {currentReceipt.items && currentReceipt.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-heading font-black uppercase tracking-widest text-[#B84A27] flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Individual Stop Gate Stubs ({currentReceipt.items.length})</span>
                  </h4>
                  <span className="text-[11px] font-mono text-[#7A5C49] font-bold">
                    All Access Validated
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentReceipt.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF0DF] border border-[#F2D5A7] text-[#B84A27] font-display font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-sm font-heading font-bold text-[#3B2316] leading-tight">
                            {item.title}
                          </h5>
                          <p className="text-xs text-[#7A5C49]">
                            Custodian: <span className="font-heading font-bold text-[#3B2316]">{item.custodianName || 'Direct Cultural Guild'}</span>
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#A67B5B] flex-wrap">
                            <span className="flex items-center gap-1 font-mono font-bold text-[#B84A27]">
                              <Clock className="w-3 h-3" />
                              <span>{item.slotWindow}</span>
                            </span>
                            <span>·</span>
                            <span>{item.durationMinutes} mins</span>
                            <span>·</span>
                            <span>{item.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center shrink-0 gap-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0DF] border border-[#F2D5A7] text-[10px] font-heading font-extrabold text-[#B84A27] uppercase tracking-wider">
                          VALID FOR ENTRY
                        </span>
                        <span className="font-mono text-xs font-bold text-[#7A5C49]">
                          ₹{item.lineTotalInr.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HORIZONTAL PERFORATED TEAR-LINE WITH TICKET PUNCH CUTOUTS */}
            <div className="relative py-2 my-4">
              <div className="border-b-2 border-dashed border-[#D5C0A5] w-full" />
              <div className="w-7 h-7 rounded-full bg-[#3B2316] absolute -left-7 top-1/2 -translate-y-1/2 border-r border-[#DFCBB2] print:hidden" />
              <div className="w-7 h-7 rounded-full bg-[#3B2316] absolute -right-7 top-1/2 -translate-y-1/2 border-l border-[#DFCBB2] print:hidden" />
            </div>

            {/* BOTTOM HALF: Official Razorpay Transaction Receipt & Custodian Ledger */}
            <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#DFCBB2] shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#DFCBB2]">
                <h4 className="text-xs font-heading font-black uppercase tracking-widest text-[#3B2316]">
                  Official Treasury &amp; Disbursement Ledger
                </h4>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0DF] text-[10px] font-heading font-bold text-[#B84A27]">
                  <Award className="w-3.5 h-3.5" />
                  <span>Direct Custodian Payout</span>
                </div>
              </div>

              {/* Official Telemetry Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EBE1D3] text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase text-[#A67B5B] block font-bold">RAZORPAY PAYMENT ID</span>
                  <span className="font-bold text-[#3B2316] break-all">{currentReceipt.razorpayPaymentId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#A67B5B] block font-bold">ORDER REFERENCE</span>
                  <span className="font-bold text-[#3B2316] break-all">{currentReceipt.razorpayOrderId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#A67B5B] block font-bold">RECEIPT NO</span>
                  <span className="font-bold text-[#3B2316]">{currentReceipt.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#A67B5B] block font-bold">SETTLED TIMESTAMP</span>
                  <span className="font-bold text-[#3B2316]">{paidDateFormatted}</span>
                </div>
              </div>

              {/* Itemized Custodian Disbursement Table */}
              <div className="space-y-2 text-xs text-[#5C3D2E]">
                {currentReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="font-heading font-semibold text-[#3B2316] truncate max-w-[65%]">
                      {item.title} ({item.slotWindow})
                    </span>
                    <span className="flex-1 border-b border-dotted border-[#DFCBB2] mx-2" />
                    <span className="font-mono font-bold text-[#3B2316] shrink-0">
                      ₹{item.lineTotalInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}

                <div className="pt-2 border-t border-[#DFCBB2] space-y-1.5">
                  <div className="flex justify-between">
                    <span>Subtotal ({currentReceipt.travelersCount} Travelers)</span>
                    <span className="font-mono font-bold text-[#3B2316]">
                      ₹{currentReceipt.subtotalInr.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {currentReceipt.bundleSavingsInr > 0 && (
                    <div className="flex justify-between text-[#B84A27] font-bold">
                      <span>Multi-Stop Bundle Waiver (5% Direct Pass Discount)</span>
                      <span className="font-mono">
                        -₹{currentReceipt.bundleSavingsInr.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Preservation Levy &amp; Digital Custodian Gateway Fee</span>
                    <span className="font-mono text-[#3B2316]">
                      ₹{currentReceipt.taxesAndPreservationLevyInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Total Paid Block */}
                <div className="pt-3 border-t-2 border-[#DFCBB2] flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-heading font-black uppercase tracking-wider text-[#3B2316] block">
                      Total Settled via Razorpay
                    </span>
                    <span className="text-[10px] text-[#A67B5B]">
                      Authorized digital payment receipt
                    </span>
                  </div>
                  <span className="font-display text-2xl sm:text-3xl font-black text-[#B84A27]">
                    ₹{currentReceipt.totalPaidInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Direct Impact Saffron Stamp */}
              <div className="p-3 rounded-2xl bg-[#FAF0DF] border border-[#F2D5A7] flex items-center gap-2.5 text-xs text-[#9E5414]">
                <CheckCircle2 className="w-4 h-4 text-[#B84A27] shrink-0" />
                <span className="font-heading font-bold">
                  100% Direct Custodian Settlement: 0% aggregator commission retained. 100% of experience fees go directly to local generational artisans and monument caretakers.
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-[#FAF0DF] via-[#FAF6F0] to-[#FAF0DF] border-t border-[#DFCBB2] flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] hover:bg-[#FAF0DF] text-xs font-heading font-extrabold uppercase tracking-wider text-[#3B2316] transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-[#B84A27]" />
              <span>Download / Print Official Receipt PDF</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:opacity-95 text-xs font-heading font-extrabold uppercase tracking-wider text-[#FFFDF9] transition cursor-pointer shadow-md active:scale-[0.98]"
            >
              Done · Return to Itinerary
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CulturalPassportReceiptModal;
