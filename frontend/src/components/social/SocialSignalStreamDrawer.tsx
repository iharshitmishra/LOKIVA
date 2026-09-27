import React, { useState } from 'react';
import {
  SocialSignal,
  CitizenGroundReportPayload,
} from '../../types/digitalTwin';
import {
  Send,
  Radio,
  MapPin,
  ThumbsUp,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  PlusCircle,
  X,
  Crosshair,
  TrendingUp,
} from 'lucide-react';

interface SocialSignalStreamDrawerProps {
  signals: SocialSignal[];
  activeCity: string;
  onFocusCoordinate: (coord: [number, number]) => void;
  onSubmitReport: (payload: CitizenGroundReportPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function SocialSignalStreamDrawer({
  signals,
  activeCity,
  onFocusCoordinate,
  onSubmitReport,
  isSubmitting = false,
}: SocialSignalStreamDrawerProps) {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New report form state
  const [authorName, setAuthorName] = useState('');
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<'citizen_sentinel' | 'x' | 'reddit' | 'instagram'>('citizen_sentinel');
  const [locationName, setLocationName] = useState('');
  const [reportText, setReportText] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'moderate' | 'high' | 'critical'>('high');
  const [sentiment, setSentiment] = useState<'alert' | 'sanctuary_tip' | 'delight' | 'closure_notice'>('alert');
  const [tagsInput, setTagsInput] = useState('#MonsoonAlert #LiveUpdate');

  const filteredSignals = signals.filter((s) => {
    if (platformFilter !== 'all' && s.platform !== platformFilter) return false;
    if (sentimentFilter !== 'all' && s.sentiment !== sentimentFilter) return false;
    return true;
  });

  const handleUpvote = (id: string) => {
    setUpvotedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !reportText.trim() || !locationName.trim()) return;

    // Default coordinates based on city
    let lat = activeCity.toLowerCase().includes('mumbai') ? 18.94 : 26.93;
    let lng = activeCity.toLowerCase().includes('mumbai') ? 72.83 : 75.82;

    const tags = tagsInput
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.startsWith('#'));

    await onSubmitReport({
      city: activeCity,
      authorName,
      handle: handle.startsWith('@') ? handle : `@${handle}`,
      platform,
      text: reportText,
      locationName,
      lat,
      lng,
      urgency,
      sentiment,
      tags,
    });

    // Reset & close
    setReportText('');
    setLocationName('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#E5DFD5] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#E5DFD5] bg-[#FAF7F2]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#C85A32] text-white">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#12213B]">Real-World Social Signals</h3>
              <p className="text-[11px] text-[#5A6E85]">
                Aggregated public posts & sentinel crowd alerts for {activeCity}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12213B] hover:bg-[#1E3A5F] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Broadcast Report</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {['all', 'x', 'reddit', 'instagram', 'citizen_sentinel'].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                platformFilter === plat
                  ? 'bg-[#12213B] text-white shadow-xs'
                  : 'bg-white text-[#5A6E85] border border-[#E5DFD5] hover:bg-stone-50'
              }`}
            >
              {plat === 'all'
                ? 'All Sources'
                : plat === 'x'
                ? '𝕏 (Twitter)'
                : plat === 'reddit'
                ? 'Reddit'
                : plat === 'instagram'
                ? 'Instagram'
                : '🛡️ Sentinel'}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#F1EFEA]">
        {filteredSignals.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#5A6E85]">
            No signals match the selected filters.
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const isUpvoted = !!upvotedIds[sig.id];
            const upvoteCount = sig.upvotes + (isUpvoted ? 1 : 0);

            return (
              <div key={sig.id} className="pt-3 first:pt-0 group">
                {/* Author Strip */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={sig.avatar}
                      alt={sig.authorName}
                      className="w-7 h-7 rounded-full object-cover border border-stone-200"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-[#12213B]">{sig.authorName}</span>
                        {sig.verified && (
                          <span className="text-blue-500 text-[10px]" title="Verified Public Sentinel">
                            ✓
                          </span>
                        )}
                        <span className="text-[10px] text-[#5A6E85]">{sig.handle}</span>
                      </div>
                      <div className="text-[10px] text-[#5A6E85]">{sig.timeAgo}</div>
                    </div>
                  </div>

                  {/* Sentiment Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sig.sentiment === 'alert'
                        ? 'bg-red-100 text-red-700'
                        : sig.sentiment === 'sanctuary_tip'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sig.sentiment === 'closure_notice'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {sig.sentiment.replace('_', ' ')}
                  </span>
                </div>

                {/* Text Content */}
                <p className="text-xs text-[#1E293B] leading-relaxed mb-2">{sig.text}</p>

                {/* Tags */}
                {sig.tags && sig.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {sig.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium text-blue-600 hover:underline">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Footer: Geolocation & Interactive Map Focus */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={() => onFocusCoordinate([sig.lat, sig.lng])}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#C85A32] hover:text-[#A74420] transition-colors"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Focus {sig.locationName}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpvote(sig.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                        isUpvoted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-[#5A6E85] hover:bg-stone-200'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{upvoteCount}</span>
                    </button>

                    <div
                      className="flex items-center gap-1 text-[10px] text-stone-500"
                      title="Ground verification rating"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{sig.verificationsCount} verified</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5DFD5] shadow-2xl p-5 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#C85A32]" />
                <h4 className="font-bold text-sm text-[#12213B]">Broadcast Ground Report</h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#5A6E85]">Your Name</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Maya Sharma"
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-[#E5DFD5] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#5A6E85]">Handle</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@handle"
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-[#E5DFD5] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#5A6E85]">Platform / Network</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-[#E5DFD5] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
                >
                  <option value="citizen_sentinel">🛡️ Verified Citizen Sentinel</option>
                  <option value="x">𝕏 (Twitter)</option>
                  <option value="reddit">Reddit (r/community)</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#5A6E85]">Location / Landmark</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Amer Fort Ramparts / Badi Chaupar"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-[#E5DFD5] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#5A6E85]">Report Sentiment</label>
                  <select
                    value={sentiment}
                    onChange={(e) => setSentiment(e.target.value as any)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-[#E5DFD5] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
                  >
                    <option value="alert">🚨 Crisis / Waterlogging Alert</option>
                    <option value="sanctuary_tip">🏺 Safe Shelter Tip</option>
                    <option value="closure_notice">🛑 Site Closure Notice</option>
                    <option value="delight">✨ Delightful Experience</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#5A6E85]">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-[#E5DFD5] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
                  >
                    <option value="critical">Critical (Immediate)</option>
                    <option value="high">High</option>
                    <option value="moderate">Moderate</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#5A6E85]">Incident Details & Advice</label>
                <textarea
                  required
                  rows={3}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe road conditions, water depth, crowd redirection, or welcoming shelters..."
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-[#E5DFD5] focus:outline-none focus:ring-1 focus:ring-[#C85A32] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#5A6E85] hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#C85A32] hover:bg-[#A74420] rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmitting...' : 'Transmit Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
