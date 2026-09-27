import React, { useState } from 'react';
import {
  Settings,
  CreditCard,
  Bell,
  Lock,
  Building,
  CheckCircle2,
  Save,
  Shield,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';

export function SettingsView() {
  const { profile, fetchOverview } = useProviderWorkspaceStore();

  const [settlementAccount, setSettlementAccount] = useState(
    profile?.settlement_account || 'HDFC Bank · IFSC: HDFC0001842 · A/C Ending in 8842'
  );
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(true);
  const [notifyPayouts, setNotifyPayouts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/v1/providers/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settlement_account: settlementAccount }),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    await fetchOverview();
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Settlement Account Setting */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#12213B]">
              <CreditCard className="w-5 h-5 text-[#C85A32]" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-[#12213B]">
                Payout & Settlement Account
              </h3>
              <p className="text-xs text-[#556275]">
                Bank account or verified UPI VPA for automatic day-of-trip payouts
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#12213B]">
              Bank Account Details or UPI VPA *
            </label>
            <input
              type="text"
              required
              value={settlementAccount}
              onChange={(e) => setSettlementAccount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DFD5] text-xs font-mono font-bold"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-heading flex items-center gap-2 text-[#065F46]">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>Escrow Protected: Net settlements are deposited within 24 hours of completed sessions.</span>
          </div>
        </div>

        {/* Notifications Preferences */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#12213B]">
              <Bell className="w-5 h-5 text-[#12213B]" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-[#12213B]">
                Notification Channels
              </h3>
              <p className="text-xs text-[#556275]">
                Choose how you receive alerts and booking notifications
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] cursor-pointer">
              <div>
                <div className="text-xs font-heading font-bold text-[#12213B]">
                  Instant Booking Alerts
                </div>
                <div className="text-[11px] text-[#556275]">
                  Receive notifications when a traveler reserves an experience
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyBookings}
                onChange={(e) => setNotifyBookings(e.target.checked)}
                className="w-4 h-4 rounded text-[#C85A32] accent-[#C85A32]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] cursor-pointer">
              <div>
                <div className="text-xs font-heading font-bold text-[#12213B]">
                  Review & Feedback Alerts
                </div>
                <div className="text-[11px] text-[#556275]">
                  Get alerted when guests post ratings or leave comments
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyReviews}
                onChange={(e) => setNotifyReviews(e.target.checked)}
                className="w-4 h-4 rounded text-[#C85A32] accent-[#C85A32]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] cursor-pointer">
              <div>
                <div className="text-xs font-heading font-bold text-[#12213B]">
                  Settlement & Payout Receipts
                </div>
                <div className="text-[11px] text-[#556275]">
                  Receive email transfer receipts whenever payouts are credited
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyPayouts}
                onChange={(e) => setNotifyPayouts(e.target.checked)}
                className="w-4 h-4 rounded text-[#C85A32] accent-[#C85A32]"
              />
            </label>
          </div>
        </div>

        {/* Commercial Terms Summary */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#065F46]" />
            <h4 className="text-xs font-heading font-bold text-[#12213B]">
              LOKIVA Fair Operator Agreement
            </h4>
          </div>
          <p className="text-xs text-[#556275] leading-relaxed">
            Flat 10% platform fee on completed bookings. Includes host liability protection, real-time traveler support, and automated invoicing.
          </p>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5]">
          {isSaved ? (
            <span className="text-xs font-bold text-[#065F46] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings Updated</span>
            </span>
          ) : (
            <span className="text-xs text-[#556275]">Save your payout configurations</span>
          )}

          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#12213B] hover:bg-[#1E293B] text-white rounded-xl text-xs font-heading font-bold transition shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
