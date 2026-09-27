import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderOffer } from '../../../types/providerWorkspace';

export function OffersView() {
  const {
    offers,
    createOffer,
    toggleOfferStatus,
    experiences,
  } = useProviderWorkspaceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [offerType, setOfferType] = useState<'early_bird' | 'weekend' | 'group' | 'festival' | 'coupon'>('weekend');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [promoCode, setPromoCode] = useState('WEEKEND15');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [minGuests, setMinGuests] = useState(1);
  const [usageLimit, setUsageLimit] = useState(50);
  const [experienceId, setExperienceId] = useState<number | undefined>(undefined);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createOffer({
      title,
      offer_type: offerType,
      discount_percent: Number(discountPercent),
      promo_code: promoCode.toUpperCase(),
      start_date: startDate,
      end_date: endDate,
      min_guests: Number(minGuests),
      usage_limit: Number(usageLimit),
      experience_id: experienceId,
    });

    setIsModalOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs">
        <div>
          <h3 className="text-base font-display font-bold text-[#12213B]">
            Promotional Campaigns & Flash Deals
          </h3>
          <p className="text-xs text-[#556275]">
            Create early-bird incentives, group bundles and weekend promos to boost fill rates
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs font-heading font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#556275] text-xs">
            No active promotional campaigns. Click "Create Promotion" to launch your first deal!
          </div>
        ) : (
          offers.map((o) => (
            <div
              key={o.id}
              className={`p-5 rounded-3xl border transition shadow-2xs space-y-4 ${
                o.is_active ? 'bg-white border-[#E5DFD5]' : 'bg-gray-50 border-gray-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#FAF4ED] text-[#C85A32] border border-[#E8DEC8]">
                  {o.offer_type?.replace('_', ' ')}
                </span>

                <button
                  onClick={() => toggleOfferStatus(o.id, !o.is_active)}
                  className={`text-xs font-heading font-bold flex items-center gap-1 ${
                    o.is_active ? 'text-[#065F46]' : 'text-gray-400'
                  }`}
                >
                  <span>{o.is_active ? 'Active' : 'Paused'}</span>
                </button>
              </div>

              <div>
                <h4 className="text-sm font-display font-bold text-[#12213B] leading-snug">
                  {o.title}
                </h4>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-extrabold text-[#C85A32]">
                    {o.discount_percent}%
                  </span>
                  <span className="text-xs text-[#556275] font-semibold">OFF</span>
                </div>
              </div>

              {/* Promo Code Badge */}
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5] flex items-center justify-between text-xs font-mono">
                <span className="text-[#556275]">Promo Code:</span>
                <span className="font-bold text-[#12213B] tracking-wider bg-white px-2 py-0.5 rounded border border-[#E5DFD5]">
                  {o.promo_code || 'AUTODEAL'}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-[#556275] border-t border-[#E5DFD5] pt-2">
                <div className="flex justify-between">
                  <span>Validity:</span>
                  <span className="font-mono text-[#12213B]">{o.start_date} → {o.end_date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Guests:</span>
                  <span className="font-mono text-[#12213B]">{o.min_guests} Pax</span>
                </div>
                <div className="flex justify-between">
                  <span>Redemptions:</span>
                  <span className="font-mono text-[#065F46] font-bold">
                    {o.used_count || 0} / {o.usage_limit || 50} Used
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white w-full max-w-lg rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <h3 className="text-base font-display font-bold text-[#12213B]">
                Create Promotional Offer
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#12213B]">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Early Bird October Heritage Discount"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#12213B]">Offer Type</label>
                  <select
                    value={offerType}
                    onChange={(e: any) => setOfferType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] bg-white"
                  >
                    <option value="weekend">Weekend Special</option>
                    <option value="early_bird">Early Bird</option>
                    <option value="group">Group Booking</option>
                    <option value="festival">Festival Campaign</option>
                    <option value="coupon">Coupon Voucher</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#12213B]">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    min={5}
                    max={75}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#12213B]">Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#12213B]">Usage Quota (Max Bookings)</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#12213B]">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#12213B]">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#556275]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C85A32] text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Publish Offer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
