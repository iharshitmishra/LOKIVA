import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Globe,
  Upload,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';

export function BusinessProfileView() {
  const { profile, fetchOverview } = useProviderWorkspaceStore();

  const [businessName, setBusinessName] = useState('');
  const [providerType, setProviderType] = useState('Tour & Cultural Experience Operator');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [settlementAccount, setSettlementAccount] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setProviderType(profile.provider_type || 'Tour & Cultural Experience Operator');
      setTagline(profile.tagline || '');
      setDescription(profile.description || '');
      setCity(profile.city || 'Mumbai');
      setState(profile.state || 'Maharashtra');
      setAddress(profile.address || '');
      setContactEmail(profile.contact_email || '');
      setPhone(profile.phone || '');
      setWebsite(profile.website || '');
      setLogoUrl(profile.logo_url || '');
      setCoverImageUrl(profile.cover_image_url || '');
      setSettlementAccount(profile.settlement_account || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/providers/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          provider_type: providerType,
          tagline,
          description,
          city,
          state,
          address,
          contact_email: contactEmail,
          phone,
          website,
          logo_url: logoUrl,
          cover_image_url: coverImageUrl,
          settlement_account: settlementAccount,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Cover & Brand Images */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <h3 className="text-base font-display font-bold text-[#12213B]">
            Public Brand Media
          </h3>

          <div className="relative h-44 rounded-2xl overflow-hidden bg-gray-100 border border-[#E5DFD5]">
            <img
              src={coverImageUrl || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80'}
              alt="Cover Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-xs text-white text-xs font-mono rounded-full font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Operator Badge</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Cover Photo URL</label>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Logo / Avatar URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Business Identity */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <h3 className="text-base font-display font-bold text-[#12213B]">
            Business Identity & Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Business / Trade Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Provider Type *</label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white"
              >
                <option value="Tour & Cultural Experience Operator">Tour & Cultural Experience Operator</option>
                <option value="Hotel & Boutique Homestay">Hotel & Boutique Homestay</option>
                <option value="Activity & Workshop Host">Activity & Workshop Host</option>
                <option value="Licensed Local Guide">Licensed Local Guide</option>
                <option value="Regional Culinary Host">Regional Culinary Host</option>
                <option value="Heritage Transport & Excursions">Heritage Transport & Excursions</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#12213B]">Headline Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#12213B]">Public Bio / Story</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#E5DFD5] text-xs font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* Location & Contact Details */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <h3 className="text-base font-display font-bold text-[#12213B]">
            Contact & Operations Base
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Contact Email *</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#12213B]">Registered Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5]">
          {isSaved ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#065F46]">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Profile Changes Saved Successfully!</span>
            </span>
          ) : (
            <span className="text-xs text-[#556275]">
              Changes reflect immediately on your live marketplace listings.
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs font-heading font-bold shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
