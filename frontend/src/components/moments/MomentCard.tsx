import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Experience } from '../../types';
import {
  MapPin,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  Utensils,
  Landmark,
  Compass,
  Trees,
  Palette,
  Moon,
} from 'lucide-react';
import { resolveImageUrl } from '../../lib/api';

interface MomentCardProps {
  experience: Experience;
}

import { CATEGORY_IMAGE_POOLS, getCategoryPoolKey } from '../../lib/imageDeduplicator';

function getCardFallback(category: string = '', id: number = 1): string {
  const poolKey = getCategoryPoolKey(category);
  const pool = CATEGORY_IMAGE_POOLS[poolKey] || CATEGORY_IMAGE_POOLS.culture;
  return pool[Math.abs(id) % pool.length];
}

export function MomentCard({ experience }: MomentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Category Clean SVG Icon
  const getCategoryIcon = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('culinary') || cat.includes('dining')) return <Utensils className="w-3 h-3 text-marigold" />;
    if (cat.includes('culture') || cat.includes('heritage') || cat.includes('history')) return <Landmark className="w-3 h-3 text-teal" />;
    if (cat.includes('adventure') || cat.includes('trek') || cat.includes('sport')) return <Compass className="w-3 h-3 text-marigold" />;
    if (cat.includes('nature') || cat.includes('wildlife') || cat.includes('beach')) return <Trees className="w-3 h-3 text-teal" />;
    if (cat.includes('art') || cat.includes('craft') || cat.includes('workshop') || cat.includes('pottery')) return <Palette className="w-3 h-3 text-marigold" />;
    if (cat.includes('night') || cat.includes('evening') || cat.includes('sunset')) return <Moon className="w-3 h-3 text-dusk-300" />;
    return <Sparkles className="w-3 h-3 text-marigold" />;
  };

  const rawImage = experience.image_url || experience.image_urls?.[0] || experience.images?.[0];
  const resolvedImage = resolveImageUrl(rawImage);

  // If failed or missing, use distinct category-specific fallback
  const [currentSrc, setCurrentSrc] = useState<string>(() =>
    imageError || !resolvedImage
      ? getCardFallback(experience.category, experience.id)
      : resolvedImage
  );

  useEffect(() => {
    if (resolvedImage && resolvedImage !== currentSrc) {
      setCurrentSrc(resolvedImage);
      setImageError(false);
      setImageLoaded(false);
    }
  }, [resolvedImage, experience.id]);

  const rating = experience.rating ? experience.rating.toFixed(1) : '4.8';
  const duration = experience.approx_duration_mins
    ? experience.approx_duration_mins >= 60
      ? `${Math.round(experience.approx_duration_mins / 60)} hrs`
      : `${experience.approx_duration_mins} mins`
    : '2 hrs';

  const locationDisplay = `${experience.city || experience.city_name || 'Mumbai'}${
    experience.state ? `, ${experience.state}` : ''
  }`;

  const oneLineQuote =
    experience.tagline ||
    experience.why_it_fits ||
    (experience.description ? experience.description.slice(0, 80) + '...' : 'Discover authentic local moments.');

  return (
    <Link
      to={`/experience/${experience.id}`}
      className="group relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px] h-[460px] sm:h-[500px] rounded-3xl overflow-hidden border border-paper-400 hover:border-marigold/70 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-end select-none bg-ink-900"
    >
      {/* Background Image with Zoom on Hover */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-ink-950">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-paper-300 animate-pulse" />
        )}
        <img
          src={currentSrc}
          alt={experience.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            const fallback = getCardFallback(experience.category, experience.id);
            if (currentSrc !== fallback) {
              setCurrentSrc(fallback);
            }
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out filter brightness-[0.9] ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Editorial Vignette & Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/65 to-transparent opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/35 via-transparent to-transparent" />
      </div>

      {/* Top Header Tags Overlay (Clean Icons, Zero Emojis) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
        <span className="px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[11px] font-mono font-bold text-ink border border-white/20 shadow-xs flex items-center gap-1.5">
          <span>{getCategoryIcon(experience.category)}</span>
          <span className="uppercase tracking-wider text-[10px]">{experience.category}</span>
        </span>

        {experience.is_hidden_gem && (
          <span className="px-2.5 py-1 bg-marigold text-ink-950 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-ink-950" />
            <span>Hidden Gem</span>
          </span>
        )}
      </div>

      {/* Card Content Information Panel */}
      <div className="relative z-10 p-5 sm:p-6 space-y-3 text-white">
        {/* Location Row */}
        <div className="flex items-center gap-1.5 text-paper-200 text-xs font-mono">
          <MapPin className="w-3.5 h-3.5 text-marigold flex-shrink-0" />
          <span className="truncate">{locationDisplay}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-display font-bold text-white leading-snug line-clamp-2 group-hover:text-marigold transition-colors duration-300">
          {experience.title}
        </h3>

        {/* Key Metrics: Price · Duration · Rating */}
        <div className="flex items-center gap-2 text-xs font-mono text-paper-100 pt-0.5">
          <span className="font-bold text-marigold text-sm">₹{experience.price}</span>
          <span className="text-white/40">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-paper-300" />
            {duration}
          </span>
          <span className="text-white/40">•</span>
          <span className="flex items-center gap-1 font-bold text-amber-300">
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
            {rating}
          </span>
        </div>

        {/* Editorial Quote / Description */}
        <p className="text-xs font-sans text-paper-200/90 line-clamp-2 leading-relaxed italic border-l-2 border-marigold/60 pl-2.5">
          "{oneLineQuote}"
        </p>

        {/* Action Link: Why you'll love it → */}
        <div className="pt-2 flex items-center justify-between border-t border-white/15 text-xs font-mono font-bold">
          <span className="text-marigold group-hover:text-marigold-300 flex items-center gap-1.5 transition-colors">
            <span>Why you'll love it</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
          <span className="text-[10px] text-paper-300 uppercase tracking-widest font-mono">
            Vetted Local
          </span>
        </div>
      </div>
    </Link>
  );
}
