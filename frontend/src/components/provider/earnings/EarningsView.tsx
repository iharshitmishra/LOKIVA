import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';

export function EarningsView() {
  const { earnings } = useProviderWorkspaceStore();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const availableBalance = earnings?.available_balance || 13660;
  const pendingSettlement = earnings?.pending_settlement || 13660;
  const completedPayouts = earnings?.completed_payouts || 11900;
  const platformCommission = earnings?.platform_commission || 3100;
  const lifetimeGross = earnings?.lifetime_gross || 31000;
  const settlementAccount = earnings?.settlement_account || 'HDFC Bank · IFSC: HDFC0001842 · A/C Ending in 8842';
  const transactions = earnings?.transactions || [];

  const handleRequestPayout = () => {
    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutSuccess(false);
      setIsPayoutModalOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Financial Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Ready for Payout</span>
            <div className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#065F46]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-display font-extrabold text-[#12213B]">
              ₹{availableBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-[#065F46] font-mono">
              Cleared for direct transfer
            </p>
          </div>
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="w-full py-2 bg-[#12213B] hover:bg-[#1E293B] text-white rounded-xl text-xs font-heading font-bold transition shadow-xs"
          >
            Request Payout
          </button>
        </div>

        {/* Pending Settlement */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Pending Settlement</span>
            <div className="p-1.5 rounded-lg bg-[#FAF4ED] text-[#C85A32]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-display font-extrabold text-[#12213B]">
              ₹{pendingSettlement.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-[#556275] font-mono">
              In escrow; clears upon trip completion
            </p>
          </div>
        </div>

        {/* Completed Payouts */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Settled to Bank</span>
            <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-display font-extrabold text-[#12213B]">
              ₹{completedPayouts.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-[#556275] font-mono">
              Transferred to verified account
            </p>
          </div>
        </div>

        {/* Platform Fee Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Platform Fee (10%)</span>
            <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-display font-extrabold text-[#556275]">
              ₹{platformCommission.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-[#065F46] font-mono font-bold">
              0% middleman surcharge guarantee
            </p>
          </div>
        </div>
      </div>

      {/* Verified Settlement Account Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-[#E5DFD5] text-[#12213B]">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-heading font-bold text-[#12213B]">
              Verified Settlement Destination
            </div>
            <div className="text-xs font-mono text-[#556275]">
              {settlementAccount}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const csvContent = "data:text/csv;charset=utf-8," + 
              "BookingCode,Guest,Date,Gross,Fee,Net,Status\n" +
              transactions.map(t => `${t.booking_code},"${t.guest_name}",${t.date},${t.amount},${t.platform_fee},${t.net_payout},${t.status}`).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `LOKIVA_Financial_Statement_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-[#12213B] rounded-xl border border-[#E5DFD5] text-xs font-heading font-bold transition shadow-2xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#065F46]" />
          <span>Export CSV Statement</span>
        </button>
      </div>

      {/* Transaction Ledger Table */}
      <div className="rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs overflow-hidden space-y-4">
        <div className="px-6 pt-5 flex items-center justify-between">
          <h4 className="text-base font-display font-bold text-[#12213B]">
            Booking Settlement Ledger
          </h4>
          <span className="text-xs text-[#556275] font-mono">
            {transactions.length} Records
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E5DFD5] bg-[#FAF7F2] text-[11px] font-mono uppercase text-[#556275]">
                <th className="py-3 px-6 font-bold">Booking Code</th>
                <th className="py-3 px-4 font-bold">Trip & Guest</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Gross Fare</th>
                <th className="py-3 px-4 font-bold">Fee (10%)</th>
                <th className="py-3 px-4 font-bold">Net Payout</th>
                <th className="py-3 px-6 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5]/60 text-xs font-heading">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#556275]">
                    No transactions recorded
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF7F2]/50 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#12213B]">
                      {tx.booking_code}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#12213B]">{tx.guest_name}</div>
                      <div className="text-[11px] text-[#556275] truncate max-w-[200px]">
                        {tx.experience_title}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#556275]">
                      {tx.date}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#12213B]">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#556275]">
                      -₹{tx.platform_fee.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#065F46]">
                      ₹{tx.net_payout.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                          tx.status === 'settled'
                            ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                            : tx.status === 'pending'
                            ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <h3 className="text-base font-display font-bold text-[#12213B]">
                Initiate Payout Transfer
              </h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {payoutSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#059669] mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-[#12213B]">Transfer Request Sent</h4>
                <p className="text-xs text-[#556275]">
                  ₹{availableBalance} will be credited to your bank account via IMPS/NEFT within 24 hours.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] space-y-1">
                  <div className="text-xs text-[#556275]">Transfer Amount</div>
                  <div className="text-2xl font-mono font-bold text-[#12213B]">
                    ₹{availableBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-[#556275]">Destination: {settlementAccount}</div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestPayout}
                  className="w-full py-2.5 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs font-heading font-bold shadow-xs transition"
                >
                  Confirm & Transfer to Bank
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
