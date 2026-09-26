import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  Building2,
  Sparkles,
  Compass,
  X,
} from 'lucide-react';
import { SHOWCASE_DESTINATIONS, ShowcaseDestination } from '../data/destinationsShowcaseData';

// 4 Primary destinations with dedicated full-screen video assets
const VIDEO_DESTINATIONS: ShowcaseDestination[] = SHOWCASE_DESTINATIONS.filter((d) =>
  ['rajasthan', 'kerala', 'maharashtra', 'ladakh'].includes(d.id)
);

// Companion destinations without video assets (photo canvas mode)
const OTHER_DESTINATIONS: ShowcaseDestination[] = SHOWCASE_DESTINATIONS.filter(
  (d) => !['rajasthan', 'kerala', 'maharashtra', 'ladakh'].includes(d.id)
);

export function DestinationsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isShowingDirectory, setIsShowingDirectory] = useState(false);
  const [selectedOtherDestination, setSelectedOtherDestination] = useState<ShowcaseDestination | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Currently active destination
  const activeVideoDestination = VIDEO_DESTINATIONS[activeIndex];
  const currentDestination = selectedOtherDestination || activeVideoDestination;
  const incomingDestination =
    incomingIndex !== null ? VIDEO_DESTINATIONS[incomingIndex] : null;

  // Next State Transition
  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedOtherDestination(null);
    setIsShowingDirectory(false);

    const nextIndex = (activeIndex + 1) % VIDEO_DESTINATIONS.length;
    setIncomingIndex(nextIndex);

    const tl = gsap.timeline({
      onComplete: () => {
        setActiveIndex(nextIndex);
        setIncomingIndex(null);
        gsap.set('.destination-card-panel', { opacity: 1, y: 0, clearProps: 'transform,opacity' });
        setIsAnimating(false);
      },
    });

    tl.to('.destination-card-panel', { y: 16, opacity: 0, duration: 0.22, ease: 'power2.in' }, 0);
    tl.fromTo(
      '.incoming-bg',
      { opacity: 0, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
      0.05
    );
    tl.fromTo(
      '.destination-card-panel',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
      0.25
    );
  }, [activeIndex, isAnimating]);

  // Prev State Transition
  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedOtherDestination(null);
    setIsShowingDirectory(false);

    const prevIndex =
      (activeIndex - 1 + VIDEO_DESTINATIONS.length) % VIDEO_DESTINATIONS.length;
    setIncomingIndex(prevIndex);

    const tl = gsap.timeline({
      onComplete: () => {
        setActiveIndex(prevIndex);
        setIncomingIndex(null);
        gsap.set('.destination-card-panel', { opacity: 1, y: 0, clearProps: 'transform,opacity' });
        setIsAnimating(false);
      },
    });

    tl.to('.destination-card-panel', { y: -16, opacity: 0, duration: 0.22, ease: 'power2.in' }, 0);
    tl.fromTo(
      '.incoming-bg',
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
      0.05
    );
    tl.fromTo(
      '.destination-card-panel',
      { y: -24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
      0.25
    );
  }, [activeIndex, isAnimating]);

  // Select an un-filmed destination from the directory
  const handleSelectOtherDestination = (destination: ShowcaseDestination) => {
    setSelectedOtherDestination(destination);
    setIsShowingDirectory(false);

    gsap.fromTo(
      '.destination-card-panel',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
    );
  };



  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape' && isShowingDirectory) {
        setIsShowingDirectory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isShowingDirectory]);

  // Active display destination
  const displayDestination = incomingDestination || currentDestination;
  const isVideoMode = Boolean(displayDestination.bgVideo);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none bg-black text-white z-20"
    >
      {/* ─── 1. FULL-BLEED BACKGROUND MEDIA CANVAS ──────────────────────────── */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden -z-10 pointer-events-none">
        {/* Active Background Layer */}
        <div className="absolute inset-0 w-full h-full">
          {displayDestination.bgVideo ? (
            <video
              key={displayDestination.id}
              src={displayDestination.bgVideo}
              autoPlay
              muted
              playsInline
              onEnded={handleNext}
              className="w-full h-full object-cover filter contrast-105"
              poster={displayDestination.bgMedia}
            >
              <source src={displayDestination.bgVideo} type="video/mp4" />
            </video>
          ) : (
            <img
              key={displayDestination.id}
              src={displayDestination.bgMedia}
              alt={displayDestination.name}
              className="w-full h-full object-cover filter contrast-105"
            />
          )}
        </div>

        {/* Incoming Background Layer during active transition */}
        {incomingDestination && (
          <div className="incoming-bg absolute inset-0 w-full h-full z-10 opacity-0">
            {incomingDestination.bgVideo ? (
              <video
                key={`incoming-${incomingDestination.id}`}
                src={incomingDestination.bgVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover filter contrast-105"
                poster={incomingDestination.bgMedia}
              >
                <source src={incomingDestination.bgVideo} type="video/mp4" />
              </video>
            ) : (
              <img
                src={incomingDestination.bgMedia}
                alt={incomingDestination.name}
                className="w-full h-full object-cover filter contrast-105"
              />
            )}
          </div>
        )}

        {/* Minimal Transparent Scrim: leaves 90% of the video bright and vivid */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 z-20" />
      </div>

      {/* ─── 2. REFINED TRANSPARENT GLASSMORPHIC CARD (BORDERED) ────────────── */}
      <div className="absolute right-4 sm:right-8 lg:right-12 bottom-6 sm:bottom-8 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 z-20 pointer-events-auto">
        <div className="destination-card-panel w-[320px] sm:w-[370px] lg:w-[395px] rounded-3xl bg-black/25 backdrop-blur-xl border border-white/30 p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all">
          {!isShowingDirectory ? (
            /* ── VIEW A: ACTIVE DESTINATION SPOTLIGHT CARD ── */
            <div className="space-y-3.5">
              {/* Header: Editorial Region & Geospatial Coordinates */}
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white/85 tracking-widest uppercase">
                    REGION · {displayDestination.region.toUpperCase()}
                  </span>
                </div>

                <span className="text-[11px] font-mono text-white/60 tracking-wider">
                  {displayDestination.coordinates}
                </span>
              </div>

              {/* Photography Thumbnail with Border */}
              <div className="relative h-36 sm:h-40 rounded-2xl overflow-hidden border border-white/20 shadow-sm">
                <img
                  src={displayDestination.cardThumbnail}
                  alt={displayDestination.name}
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#FFC067] drop-shadow">
                  {displayDestination.region}
                </span>
              </div>

              {/* Title & Editorial Tagline */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight leading-tight drop-shadow-sm">
                  {displayDestination.name}
                </h2>
                <p className="text-xs sm:text-sm font-sans text-white/85 line-clamp-2 leading-relaxed drop-shadow-xs">
                  {displayDestination.tagline}
                </p>
              </div>

              {/* Telemetry Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/90">
                <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                  <Building2 className="w-3 h-3 text-[#FFC067]" />
                  <span>{displayDestination.capitalCity}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                  <MapPin className="w-3 h-3 text-[#FFC067]" />
                  <span>{displayDestination.cityCount} Cities</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/destinations/${displayDestination.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C1443B] hover:bg-[#A8362E] text-white font-heading font-bold text-xs tracking-wider uppercase transition shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>Explore State</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={`/itinerary?city=${encodeURIComponent(displayDestination.primaryCity)}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-heading font-bold text-xs tracking-wider uppercase transition backdrop-blur-md cursor-pointer"
                >
                  <span>Build Itinerary</span>
                </Link>
              </div>

              {/* Directory Trigger: Browse All States */}
              <button
                type="button"
                onClick={() => setIsShowingDirectory(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/20 hover:border-[#FFC067] bg-white/5 hover:bg-white/15 text-xs font-heading font-semibold text-white/90 hover:text-white transition cursor-pointer backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#FFC067]" />
                  <span>Browse All States</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded border border-white/20 text-white">
                  {SHOWCASE_DESTINATIONS.length} States
                </span>
              </button>
            </div>
          ) : (
            /* ── VIEW B: ALL OTHER STATES DIRECTORY CARD ── */
            <div className="space-y-3.5 max-h-[440px] flex flex-col">
              {/* Directory Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#FFC067]" />
                  <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                    Browse All Indian States
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShowingDirectory(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20 transition cursor-pointer"
                  title="Close directory"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] font-sans text-white/80 leading-snug">
                Click any state below to view its heritage card and full-screen photography canvas:
              </p>

              {/* Scrollable State List */}
              <div className="overflow-y-auto space-y-2 pr-1 max-h-[290px] scrollbar-thin">
                {SHOWCASE_DESTINATIONS.map((dest) => (
                  <div
                    key={dest.id}
                    onClick={() => handleSelectOtherDestination(dest)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/15 hover:border-[#FFC067] bg-white/10 hover:bg-white/20 transition cursor-pointer group backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={dest.cardThumbnail}
                        alt={dest.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-heading font-bold text-white group-hover:text-[#FFC067] transition-colors truncate">
                          {dest.name}
                        </div>
                        <div className="text-[10px] font-mono text-white/70 truncate">
                          {dest.primaryCity} • {dest.region}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-[#FFC067] bg-white/10 px-2.5 py-1 rounded-md flex-shrink-0 border border-white/15 group-hover:bg-[#FFC067] group-hover:text-black transition">
                      View
                    </span>
                  </div>
                ))}
              </div>

              {/* Return to Video States */}
              <button
                type="button"
                onClick={() => {
                  setSelectedOtherDestination(null);
                  setIsShowingDirectory(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-heading font-bold text-white transition text-center cursor-pointer backdrop-blur-sm"
              >
                Return to Featured Video States
              </button>
            </div>
          )}
        </div>

        {/* ─── 3. MINIMAL NAVIGATION: PREV & NEXT BUTTONS ────────────────────── */}
        <div className="flex items-center justify-between pt-3.5">
          <button
            onClick={handlePrev}
            disabled={isAnimating}
            className="w-11 h-11 rounded-full border border-white/25 bg-black/35 hover:bg-black/60 text-white hover:text-[#FFC067] shadow-lg backdrop-blur-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label="Previous Destination"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="w-11 h-11 rounded-full border border-white/25 bg-black/35 hover:bg-black/60 text-white hover:text-[#FFC067] shadow-lg backdrop-blur-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label="Next Destination"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
