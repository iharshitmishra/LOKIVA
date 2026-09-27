import React from 'react';
import { Link } from 'react-router-dom';
import { Experience } from '../../types';
import {
  MapPin,
  Clock,
  Star,
  Bookmark,
  Shield,
  Palette,
  Landmark,
  Utensils,
  Music,
  Trees,
  Compass,
  Building2,
  Accessibility,
  CheckCircle2,
} from 'lucide-react';
import { api, resolveImageUrl } from '../../lib/api';
import { usePassWalletStore } from '../../store/usePassWalletStore';

interface ExperienceCardProps {
  experience: Experience;
  isSaved?: boolean;
  onBookmarkChange?: (isSaved: boolean) => void;
}

export function ExperienceCard({
  experience,
  isSaved: initialIsSaved = false,
  onBookmarkChange,
}: ExperienceCardProps) {
  const [isSaved, setIsSaved] = React.useState(initialIsSaved);
  const [isSaving, setIsSaving] = React.useState(false);

  // Synchronize initial saved state
  React.useEffect(() => {
    if (initialIsSaved) {
      setIsSaved(true);
      return;
    }
    try {
      const local = JSON.parse(localStorage.getItem('lokiva_saved_items') || '[]');
      if (Array.isArray(local) && local.some((item: any) => item.id === experience.id)) {
        setIsSaved(true);
      }
    } catch {}
  }, [experience.id, initialIsSaved]);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);
    try {
      const res = await api.toggleFavorite(experience.id);
      const newState = res && typeof res.favorited === 'boolean' ? res.favorited : !isSaved;
      setIsSaved(newState);

      // Keep local cache synchronized
      try {
        const local = JSON.parse(localStorage.getItem('lokiva_saved_items') || '[]');
        let updated = Array.isArray(local) ? [...local] : [];
        if (newState) {
          if (!updated.some((item: any) => item.id === experience.id)) {
            updated.push(experience);
          }
        } else {
          updated = updated.filter((item: any) => item.id !== experience.id);
        }
        localStorage.setItem('lokiva_saved_items', JSON.stringify(updated));
      } catch {}

      onBookmarkChange?.(newState);
    } catch (err) {
      console.error('Bookmark error:', err);
      // Fallback to local toggle if network issue
      const newState = !isSaved;
      setIsSaved(newState);
      try {
        const local = JSON.parse(localStorage.getItem('lokiva_saved_items') || '[]');
        let updated = Array.isArray(local) ? [...local] : [];
        if (newState) {
          if (!updated.some((item: any) => item.id === experience.id)) {
            updated.push(experience);
          }
        } else {
          updated = updated.filter((item: any) => item.id !== experience.id);
        }
        localStorage.setItem('lokiva_saved_items', JSON.stringify(updated));
      } catch {}
      onBookmarkChange?.(newState);
    } finally {
      setIsSaving(false);
    }
  };

  // Category Icon Component (Clean, No Emojis)
  const getCategoryIcon = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('culinary') || cat.includes('dining') || cat.includes('tea')) {
      return <Utensils className="w-3.5 h-3.5" />;
    }
    if (cat.includes('art') || cat.includes('craft') || cat.includes('workshop') || cat.includes('pottery') || cat.includes('weaving')) {
      return <Palette className="w-3.5 h-3.5" />;
    }
    if (cat.includes('heritage') || cat.includes('history') || cat.includes('monument') || cat.includes('fort') || cat.includes('palace')) {
      return <Landmark className="w-3.5 h-3.5" />;
    }
    if (cat.includes('music') || cat.includes('dance') || cat.includes('night')) {
      return <Music className="w-3.5 h-3.5" />;
    }
    if (cat.includes('nature') || cat.includes('wildlife') || cat.includes('trek') || cat.includes('adventure') || cat.includes('canyon')) {
      return <Trees className="w-3.5 h-3.5" />;
    }
    if (cat.includes('spiritual') || cat.includes('wellness') || cat.includes('yoga') || cat.includes('temple')) {
      return <Compass className="w-3.5 h-3.5" />;
    }
    return <Compass className="w-3.5 h-3.5" />;
  };

  const rawImageUrl =
    (experience.image_url && !experience.image_url.includes('PASTE_IMAGE') ? experience.image_url : null) ||
    (experience.image_urls && experience.image_urls.length > 0 ? experience.image_urls[0] : null) ||
    (experience.images && experience.images.length > 0 ? experience.images[0] : null) ||
    experience.image_url;

  const imageUrl = resolveImageUrl(rawImageUrl);

  const hasRating =
    experience.rating !== null &&
    experience.rating !== undefined &&
    typeof experience.rating === 'number';

  const duration = experience.duration_mins || experience.approx_duration_mins || 60;
  const isWheelchair = experience.wheelchair_accessible ?? experience.accessibility_wheelchair;
  const isBooked = usePassWalletStore((s) => s.isPlaceBooked(experience.id) || s.isPlaceBooked(experience.title));

  return (
    <Link
      to={`/experience/${experience.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-paper-400 hover:border-ink/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      {/* Image Thumbnail with Overlay Badges */}
      <div className="relative h-48 sm:h-52 bg-paper-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={experience.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        {/* Editorial Illustrated Card if image fails or is missing */}
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F5F2EB] to-[#E8E2D5] text-ink">
          <div className="w-12 h-12 rounded-xl bg-white border border-[#D0D7CF] shadow-xs flex items-center justify-center text-ink mb-2.5 group-hover:scale-110 transition-transform">
            {getCategoryIcon(experience.category)}
          </div>
          <span className="text-[13px] font-heading font-bold text-ink text-center line-clamp-1 max-w-[200px]">
            {experience.title}
          </span>
          <span className="text-[9px] font-mono text-dusk tracking-wider uppercase mt-1">
            {experience.source === 'osm_overpass' ? 'OSM Open Data' : experience.source === 'national_gi_registry' ? 'National GI Heritage' : 'Cultural Registry'}
          </span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <span className="px-2.5 py-1 rounded-lg bg-ink/90 backdrop-blur-md text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 shadow-md">
            <span>{getCategoryIcon(experience.category)}</span>
            <span>{experience.category}</span>
          </span>

          <button
            onClick={handleToggleBookmark}
            disabled={isSaving}
            aria-label={isSaved ? 'Remove from saved' : 'Save experience'}
            className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isSaved
                ? 'bg-clay text-white shadow-md'
                : 'bg-white/90 backdrop-blur-md text-ink hover:bg-white hover:text-clay shadow-sm'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Step-Free / Wheelchair Tag */}
        {isWheelchair && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-ink text-[10px] font-mono border border-paper-400 shadow-xs z-20">
            <Accessibility className="w-3 h-3 text-pine" />
            <span>Step-Free Ramp</span>
          </div>
        )}

        {/* Verified Pass Unlocked Badge */}
        {isBooked && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF0DF] text-[#9E5414] text-[10px] font-heading font-extrabold uppercase tracking-wide border border-[#F2D5A7] shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-[#B84A27]" />
            <span>Pass Booked</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Heritage Tag */}
          <div className="flex items-center justify-between text-xs text-dusk mb-1.5 font-mono">
            <span className="flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-clay shrink-0" />
              <span>
                {experience.area_name || experience.neighborhood || experience.city || experience.city_name || experience.state || 'Local District'}
              </span>
            </span>

            {experience.is_hidden_gem && (
              <span className="text-[10px] font-mono uppercase text-pine font-bold tracking-wider">
                Offbeat
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading font-bold text-ink text-base sm:text-lg group-hover:text-clay transition-colors line-clamp-1 leading-snug mb-1">
            {experience.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-dusk line-clamp-2 leading-relaxed mb-3">
            {experience.tagline || experience.description}
          </p>
        </div>

        {/* Card Footer: Honest Ratings, Duration & Pricing */}
        <div className="pt-3 border-t border-paper-300 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            {hasRating ? (
              <div className="flex items-center gap-1 font-mono font-bold text-ink">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{experience.rating?.toFixed(1)}</span>
                {experience.review_count ? (
                  <span className="text-dusk font-normal text-[10px]">({experience.review_count})</span>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-dusk text-[11px] font-mono">
                <Shield className="w-3 h-3 text-pine" />
                <span>Verified POI</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-dusk font-mono text-[11px]">
              <Clock className="w-3 h-3 text-dusk" />
              <span>{duration}m</span>
            </div>
          </div>

          <div className="text-right">
            {experience.price === 0 ? (
              <span className="text-xs font-mono font-bold text-pine uppercase">Free Entry</span>
            ) : (
              <div className="flex items-baseline gap-0.5 justify-end">
                <span className="text-xs font-mono text-dusk">₹</span>
                <span className="font-mono font-bold text-base text-ink">{experience.price}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
