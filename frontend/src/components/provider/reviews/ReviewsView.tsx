import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderReview } from '../../../types/providerWorkspace';

export function ReviewsView() {
  const { reviews, reviewStats, submitReviewReply } = useProviderWorkspaceStore();
  const [replyingReview, setReplyingReview] = useState<ProviderReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenReply = (r: ProviderReview) => {
    setReplyingReview(r);
    setReplyText(
      r.reply_text ||
        `Thank you for joining our experience! We are delighted that you enjoyed the immersion and storytelling. Hope to welcome you back to Mumbai soon!`
    );
  };

  const handleSendReply = async () => {
    if (!replyingReview || !replyText.trim()) return;
    setIsSubmitting(true);
    await submitReviewReply(replyingReview.id, replyText);
    setIsSubmitting(false);
    setReplyingReview(null);
  };

  const totalReviews = reviewStats.total_reviews || reviews.length;
  const avgRating = reviewStats.overall_rating || 4.92;

  return (
    <div className="space-y-6 pb-12">
      {/* Overview & Breakdown Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs">
        {/* Left: Overall Rating Box */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] text-center space-y-2">
          <span className="text-4xl font-display font-black text-[#12213B]">
            {avgRating}
          </span>
          <div className="flex items-center gap-1 text-[#F59E0B]">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-[#F59E0B]' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-xs text-[#556275] font-medium">
            Based on {totalReviews} verified traveler reviews
          </p>
        </div>

        {/* Right 2 cols: Star Distribution Histogram */}
        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviewStats.breakdown[stars] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-mono text-[#556275] flex items-center gap-1">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                </span>

                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-8 font-mono text-[11px] text-[#556275] text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-4">
        <h4 className="text-base font-display font-bold text-[#12213B]">
          Guest Feedback & Verified Impressions
        </h4>

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="p-8 text-center text-[#556275] text-xs">No reviews recorded yet.</p>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(r.rating) ? 'fill-[#F59E0B]' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <h5 className="text-xs font-heading font-bold text-[#12213B]">
                      {r.title || 'Exceptional experience!'}
                    </h5>
                  </div>

                  <span className="text-[10px] font-mono text-[#556275]">
                    {r.created_at?.split(' ')[0] || 'Recently'}
                  </span>
                </div>

                <p className="text-xs text-[#556275] leading-relaxed">
                  "{r.comment}"
                </p>

                {/* Existing Reply */}
                {r.reply_text ? (
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5] text-xs space-y-1">
                    <div className="font-heading font-bold text-[#12213B] flex items-center gap-1.5">
                      <span className="text-[#C85A32]">Host Response:</span>
                    </div>
                    <p className="text-xs text-[#556275] leading-relaxed italic">
                      "{r.reply_text}"
                    </p>
                  </div>
                ) : (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleOpenReply(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF4ED] hover:bg-[#F5ECE0] text-[#C85A32] rounded-xl text-xs font-heading font-bold transition border border-[#E8DEC8]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Draft AI Reply</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C85A32]" />
                <h3 className="text-base font-display font-bold text-[#12213B]">
                  Reply to Customer Review
                </h3>
              </div>
              <button onClick={() => setReplyingReview(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5] text-xs">
              <div className="text-[10px] text-[#556275] font-bold">Reviewer's Comment:</div>
              <p className="italic text-[#12213B]">"{replyingReview.comment}"</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#12213B]">Your Response</label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5DFD5] text-xs leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD5]">
              <button
                onClick={() => setReplyingReview(null)}
                className="px-4 py-2 text-xs font-bold text-[#556275]"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C85A32] text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Post Verified Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
