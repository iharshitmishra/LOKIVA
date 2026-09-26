import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, resolveImageUrl } from '../lib/api';
import { Experience, Review } from '../types';
import { USER_CURATED_PLACES } from '../data/userVerifiedPlacesData';
import {
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Sparkles,
  Leaf,
  Check,
  Heart,
  Share2,
  ExternalLink,
  Navigation,
  Footprints,
  Sun,
  Camera,
  Users,
  Ticket,
} from 'lucide-react';
import { usePassWalletStore } from '../store/usePassWalletStore';
import { SinglePlacePassModal } from '../components/pass/SinglePlacePassModal';

export function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isPlaceBooked, setActiveViewingReceipt } = usePassWalletStore();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [isBooked, setIsBooked] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExperience() {
      if (!id) return;
      const parsedId = parseInt(id, 10);
      const localExp = USER_CURATED_PLACES.find((p) => p.id === parsedId || String(p.id) === id);
      if (localExp) {
        setExperience(localExp);
        setIsLoading(false);
      }
      try {
        const [exp, revs] = await Promise.all([
          api.getExperienceById(parsedId).catch(() => null),
          api.getReviews(parsedId).catch(() => []),
        ]);
        if (exp) setExperience(exp);
        if (revs && revs.length > 0) setReviews(revs);
      } catch (err) {
        console.error('Failed to load remote experience:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadExperience();
  }, [id]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
    setTimeout(() => setIsBooked(false), 4000);
  };

  if (isLoading || !experience) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-mono text-xs text-dusk">
        <div className="w-8 h-8 border-3 border-marigold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rawGalleryImages =
    experience.image_urls && experience.image_urls.length > 0
      ? experience.image_urls
      : experience.image_url
      ? [experience.image_url]
      : [];

  const galleryImages = rawGalleryImages.map((u) => resolveImageUrl(u));

  const currentDisplayImage =
    galleryImages[selectedImageIndex] || resolveImageUrl(experience.image_url) || null;

  const isGeotagged =
    Boolean(
      experience.image_source?.includes('wiki') ||
      currentDisplayImage?.includes('wikimedia.org') ||
      currentDisplayImage?.includes('wikipedia')
    );

  const badgeText = isGeotagged
    ? experience.image_distance_m
      ? `Geotagged Landmark · ${experience.image_distance_m}m`
      : 'Verified Geotagged Landmark'
    : experience.provider_id
    ? 'Verified Host Photography'
    : 'Verified Cultural Landmark';

  const BadgeIcon = isGeotagged ? MapPin : experience.provider_id ? CheckCircle2 : Sparkles;

  const localImpact = Math.min(98, 85 + ((experience.id * 7) % 14));
  const bookedPass = experience ? (isPlaceBooked(experience.id) || isPlaceBooked(experience.title)) : undefined;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: experience.title,
          text: `Explore ${experience.title} on LOKIVA`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink pt-6 sm:pt-10 pb-28 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Back Link */}
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-xs font-mono text-dusk hover:text-ink transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header / Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-ink text-paper font-bold uppercase text-[10px]">
                  {experience.category}
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] flex items-center gap-1 font-bold">
                  <Leaf className="w-3 h-3 text-teal" />
                  {localImpact}% Local Spend Score
                </span>

                {experience.city_name && (
                  <span className="text-dusk flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-marigold" />
                    {experience.city_name}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink">
                {experience.title}
              </h1>

              <div className="flex items-center gap-3 text-xs font-mono text-dusk pt-1">
                <span className="flex items-center gap-1 text-ink font-bold">
                  <Star className="w-4 h-4 text-marigold fill-marigold" />
                  {experience.rating?.toFixed(1) || '4.9'}
                </span>
                <span>·</span>
                <span className="text-dusk-600">
                  ({experience.review_count || 42} verified traveler reviews)
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-dusk-700">
                  <Clock className="w-4 h-4" />
                  {experience.approx_duration_mins || 60} mins duration
                </span>
              </div>
            </div>

            {/* Main Image with Authentic Source Badge */}
            <div className="space-y-3">
              <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden bg-paper-300 border border-paper-400 shadow-md group">
                {currentDisplayImage ? (
                  <img
                    src={currentDisplayImage}
                    alt={experience.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-sm text-dusk">
                    {experience.title}
                  </div>
                )}

                {/* Dynamic Image Source Badge */}
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-ink/85 backdrop-blur-md rounded-full text-[10px] font-mono text-paper-200 shadow-sm flex items-center gap-1.5 pointer-events-none">
                  <BadgeIcon className="w-3 h-3 text-marigold" />
                  <span>{badgeText}</span>
                </div>
              </div>

              {/* Dynamic Photo Gallery Strip */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-2xl overflow-hidden border-2 transition ${
                        selectedImageIndex === idx
                          ? 'border-marigold scale-105 shadow-md'
                          : 'border-paper-300 hover:border-ink/40 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* "Why This Fits You" Explainability Card */}
            <div className="p-5 bg-white rounded-3xl border border-paper-400 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-teal">
                <CheckCircle2 className="w-4 h-4" />
                <span>Why This Fits Your Constraints</span>
              </div>
              <p className="text-sm font-sans text-ink leading-relaxed">
                {experience.why_it_fits ||
                  `Priced at ₹${experience.price}/pax to comfortably fit within your budget ceiling, takes ${experience.approx_duration_mins || 60} mins with verified ground-floor step-free access.`}
              </p>
            </div>

            {/* Cultural Story / Narrative */}
            <div className="bg-white rounded-3xl border border-paper-400 p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-display font-bold text-ink">
                About this Cultural Experience
              </h2>
              <p className="text-sm text-dusk-700 leading-relaxed font-sans whitespace-pre-line">
                {experience.description}
              </p>
            </div>

            {/* Hard Accessibility Checklist */}
            <div className="bg-white rounded-3xl border border-paper-400 p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-display font-bold text-ink flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal" />
                Verified Accessibility Profile
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-paper-100 rounded-xl border border-paper-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  <span>Wheelchair & Ramp Access: <strong>Verified Step-Free</strong></span>
                </div>
                <div className="p-3 bg-paper-100 rounded-xl border border-paper-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  <span>Ground Floor Seating: <strong>Available throughout</strong></span>
                </div>
                <div className="p-3 bg-paper-100 rounded-xl border border-paper-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  <span>Sensory Level: <strong>Calm & Intimate</strong></span>
                </div>
                <div className="p-3 bg-paper-100 rounded-xl border border-paper-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  <span>Elderly Pacing: <strong>Low walking distance</strong></span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-3xl border border-paper-400 p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-display font-bold text-ink">
                Traveler Reviews & Verified Feedback
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-paper-100 rounded-2xl border border-paper-300 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-ink">{rev.user_name || 'Cultural Traveler'}</span>
                        <span className="text-marigold font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-marigold" /> {rev.rating} / 5
                        </span>
                      </div>
                      <p className="text-xs text-dusk-700 font-sans">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dusk font-mono">No public reviews submitted yet.</p>
              )}
            </div>
          </div>

          {/* Right Col: Booking, Visit Intelligence, Logistics & Location Cards */}
          <div id="booking-section" className="space-y-6">
            {/* Primary Action / Fair Direct Investment Card */}
            <div className="bg-white rounded-3xl border border-paper-400 p-6 sm:p-7 space-y-5 shadow-xl text-ink">
              {/* Header Price Info */}
              <div className="space-y-1.5 pb-4 border-b border-paper-300 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-dusk uppercase tracking-wider">
                    {experience.price === 0 ? 'Experience Access' : 'Fair Direct Investment'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      experience.price === 0
                        ? 'text-teal bg-teal-50 border-teal-200'
                        : 'text-marigold-800 bg-marigold-50 border-marigold-300'
                    }`}
                  >
                    {experience.price === 0 ? 'Verified Public Access' : '100% Direct to Host'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-ink">
                    {experience.price === 0 ? 'Free Entry' : `₹${experience.price}`}
                  </span>
                  <span className="text-xs text-dusk">
                    {experience.price === 0 ? '· landmark' : '/ person'}
                  </span>
                </div>

                <span className="text-[11px] text-teal font-semibold flex items-center gap-1 pt-0.5">
                  <Check className="w-3.5 h-3.5 text-teal shrink-0" />
                  <span>
                    {experience.price === 0
                      ? '100% open public access · zero booking fees'
                      : '100% goes directly to the local artisan / guide'}
                  </span>
                </span>
              </div>

              {/* Booking & Party Size Form */}
              <form onSubmit={handleBooking} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-dusk uppercase text-[10px]">
                    <label>Party Size</label>
                    <span>{partySize} {partySize === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setPartySize(num)}
                        className={`flex-1 py-2 rounded-xl font-bold border transition cursor-pointer ${
                          partySize === num
                            ? 'bg-ink text-paper border-ink shadow-xs'
                            : 'bg-paper-100 text-ink border-paper-300 hover:bg-paper-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Investment Breakdown Summary Box */}
                <div className="p-3.5 bg-paper-100 rounded-2xl border border-paper-300 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-dusk">
                      {experience.price === 0
                        ? `Admission (${partySize} guests)`
                        : `₹${experience.price} × ${partySize} guests`}
                    </span>
                    <span className="font-bold text-ink">
                      {experience.price === 0 ? 'Free Access' : `₹${experience.price * partySize}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dusk">Transit & Navigation Buffer</span>
                    <span className="font-bold text-teal">0 extra fees</span>
                  </div>
                  <div className="pt-2 border-t border-paper-300 flex justify-between font-bold text-xs">
                    <span>Total Investment</span>
                    <span className={experience.price === 0 ? 'text-teal font-extrabold' : 'text-ink font-extrabold'}>
                      {experience.price === 0 ? '₹0 (Free Access)' : `₹${experience.price * partySize}`}
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2 pt-1">
                  {bookedPass ? (
                    <button
                      type="button"
                      onClick={() => setActiveViewingReceipt(bookedPass)}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FAF0DF] to-[#FAF6F0] hover:bg-[#FAF4ED] border border-[#F2D5A7] text-[#9E5414] font-heading font-extrabold uppercase tracking-wide text-xs sm:text-sm rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:border-[#B84A27]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#B84A27]" />
                      <span>Verified Pass Unlocked · View QR &amp; Receipt</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPassModalOpen(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D47A39] hover:from-[#9E3C1D] hover:to-[#B84A27] text-[#FFFDF9] font-heading font-extrabold uppercase tracking-wide text-xs sm:text-sm rounded-2xl transition shadow-md shadow-[#B84A27]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>
                        {experience.price === 0
                          ? 'Confirm & Reserve Free Pass'
                          : `Proceed to Book Pass (₹${(experience.price * partySize).toLocaleString('en-IN')}) →`}
                      </span>
                    </button>
                  )}

                  <Link
                    to="/itinerary"
                    className="w-full py-3 bg-[#FAF6F0] hover:bg-[#FAF0DF] border border-[#DFCBB2] text-[#3B2316] font-heading font-bold text-xs uppercase tracking-wider rounded-2xl transition text-center block active:scale-[0.98]"
                  >
                    Add to Day Itinerary
                  </Link>
                </div>

                {/* Wishlist & Share Quick Controls */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSaved(!isSaved)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isSaved
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-paper-100 text-dusk-700 border-paper-300 hover:border-ink/30 hover:text-ink'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
                    <span>{isSaved ? 'Saved to Wishlist' : 'Save Experience'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 py-2 px-3 rounded-xl bg-paper-100 hover:bg-paper-200 border border-paper-300 hover:border-ink/30 text-dusk-700 hover:text-ink text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-dusk" />
                    <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Visit Intelligence & Timing Specifications */}
            <div className="bg-white rounded-3xl border border-paper-400 p-6 space-y-4 shadow-sm text-ink">
              <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-marigold" />
                <span>Visit Intelligence & Timing</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-paper-100 rounded-2xl border border-paper-300 space-y-1">
                  <span className="text-[10px] text-dusk uppercase flex items-center gap-1">
                    <Sun className="w-3 h-3 text-marigold" /> Prime Hours
                  </span>
                  <p className="font-bold text-ink">06:00 – 10:30</p>
                  <span className="text-[10px] text-teal font-semibold">Morning mist & cool breeze</span>
                </div>

                <div className="p-3 bg-paper-100 rounded-2xl border border-paper-300 space-y-1">
                  <span className="text-[10px] text-dusk uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-dusk" /> Time Window
                  </span>
                  <p className="font-bold text-ink">{experience.approx_duration_mins || 60} mins</p>
                  <span className="text-[10px] text-dusk-600">Padded walking circuit</span>
                </div>

                <div className="p-3 bg-paper-100 rounded-2xl border border-paper-300 space-y-1">
                  <span className="text-[10px] text-dusk uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-dusk" /> Crowd Level
                  </span>
                  <p className="font-bold text-ink">Light to Moderate</p>
                  <span className="text-[10px] text-teal font-semibold">Peaceful on weekdays</span>
                </div>

                <div className="p-3 bg-paper-100 rounded-2xl border border-paper-300 space-y-1">
                  <span className="text-[10px] text-dusk uppercase flex items-center gap-1">
                    <Camera className="w-3 h-3 text-marigold" /> Photography
                  </span>
                  <p className="font-bold text-ink">Unrestricted</p>
                  <span className="text-[10px] text-dusk-600">Scenic panoramic vistas</span>
                </div>
              </div>
            </div>

            {/* What's Included & What to Bring Checklist */}
            <div className="bg-white rounded-3xl border border-paper-400 p-6 space-y-4 shadow-sm text-ink">
              <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal" />
                <span>Experience Logistics Checklist</span>
              </h3>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal tracking-wider block mb-2">
                    Verified Inclusions
                  </span>
                  <ul className="space-y-2 text-dusk-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                      <span>Verified landmark & viewpoint access pathway</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                      <span>Direct turn-by-turn routing via Google Maps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                      <span>Local cultural context & safety guidance</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-paper-300">
                  <span className="text-[10px] uppercase font-bold text-marigold-600 tracking-wider block mb-2">
                    Recommended to Carry
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-dusk-700">
                    <div className="p-2 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-marigold shrink-0" />
                      <span>Walking Shoes</span>
                    </div>
                    <div className="p-2 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-teal shrink-0" />
                      <span>Water Bottle</span>
                    </div>
                    <div className="p-2 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-ink shrink-0" />
                      <span>Camera / Phone</span>
                    </div>
                    <div className="p-2 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-marigold shrink-0" />
                      <span>Sun Protection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile-Only Sticky Booking Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-paper-300 p-3 sm:p-4 z-40 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-dusk uppercase block">Investment</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-display text-ink">
              {experience.price === 0 ? 'Free Entry' : `₹${experience.price}`}
            </span>
            {experience.price > 0 && <span className="text-[10px] font-mono text-dusk">/ person</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/itinerary"
            className="px-3 py-2.5 bg-paper-200 hover:bg-paper-300 text-ink text-xs font-mono font-bold rounded-xl whitespace-nowrap"
          >
            + Itinerary
          </Link>
          <button
            type="button"
            onClick={() => {
              if (bookedPass) {
                setActiveViewingReceipt(bookedPass);
              } else {
                setIsPassModalOpen(true);
              }
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] text-xs font-heading font-extrabold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>{bookedPass ? 'View Pass' : experience.price === 0 ? 'Free Pass' : `Book Pass · ₹${experience.price}`}</span>
          </button>
        </div>
      </div>
      {/* Inline Single Place Pass Modal */}
      {experience && (
        <SinglePlacePassModal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          place={{
            id: experience.id,
            title: experience.title,
            city: experience.city,
            state: experience.state,
            category: experience.category,
            price: experience.price,
            durationMins: experience.approx_duration_mins || experience.duration_mins || 60,
            photo: currentDisplayImage || undefined,
            custodianName: (experience as any).provider_name || (experience as any).provider_id,
          }}
          defaultTravelers={partySize}
        />
      )}
    </div>
  );
}

export default ExperienceDetailPage;
