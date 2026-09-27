import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Compass, Sparkles, SlidersHorizontal, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TripOnboardingTakeover, TripContextAnswers } from '../onboarding/TripOnboardingTakeover';
import { DayPlanResponse } from '../../types';

gsap.registerPlugin(ScrollTrigger);

interface HeroScrollExperienceProps {
  onOpenPlanner?: () => void;
}

const CYCLING_CONSTRAINTS = [
  '₹20,000 Strict Ceiling',
  'Step-Free Temple Access',
  'Real Auto Buffers Added',
  'Zero Tourist Traps',
  'Generational Guild Only',
];

// ─────────────────────────────────────────────────────────────────────────────
// TransparentMonumentFlank
// Renders real Indian monuments with automatic alpha knockout and sacred halo
// ─────────────────────────────────────────────────────────────────────────────
function TransparentMonumentFlank({
  imageUrl,
  fallbackUrl,
  alt,
  side,
  motionX,
  motionY,
}: {
  imageUrl: string;
  fallbackUrl: string;
  alt: string;
  side: 'left' | 'right';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  motionX?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  motionY?: any;
}) {
  const [processedSrc, setProcessedSrc] = useState<string>(imageUrl);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Strip bright sky / white / pale background pixels to 100% transparent alpha
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Detect sky-blue, pale white, or light gray studio backdrop pixels
          const isBrightWhite = r > 230 && g > 230 && b > 225;
          const isSkyBlue = b > r + 15 && b > 145 && g > 135;
          const isPaleSky = r > 190 && g > 205 && b > 215;

          if (isBrightWhite || isSkyBlue || isPaleSky) {
            data[i + 3] = 0; // Make background pixel completely transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setProcessedSrc(canvas.toDataURL('image/png'));
      } catch {
        // If CORS blocks pixel manipulation, use the image directly
        setProcessedSrc(imageUrl);
      }
    };

    img.onerror = () => {
      setProcessedSrc(fallbackUrl);
    };
  }, [imageUrl, fallbackUrl]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        ...(side === 'left' ? { left: '-30px' } : { right: '-30px' }),
        transform: `translateY(-50%) rotate(${side === 'left' ? '-8deg' : '8deg'})`,
        width: 'clamp(260px, 28vw, 440px)',
        height: 'clamp(340px, 36vw, 540px)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
      className="flex items-center justify-center"
    >
      {/* Sacred Geometry Sun Halo Behind the Transparent Monument (NO RECTANGULAR BOX) */}
      <div className="absolute w-56 h-56 sm:w-64 sm:h-64 xl:w-72 xl:h-72 rounded-full border border-dashed border-[#B84A27]/25 animate-[spin_60s_linear_infinite]" />
      <div className="absolute w-44 h-44 sm:w-52 sm:h-52 xl:w-60 xl:h-60 rounded-full bg-gradient-to-tr from-[#D99B43]/15 via-[#B84A27]/10 to-transparent blur-2xl" />

      {/* Monument Cutout: Motion layer with 3D parallax nudge */}
      <motion.div
        style={{
          x: motionX,
          y: motionY,
          WebkitMaskImage:
            side === 'left'
              ? 'radial-gradient(ellipse 92% 85% at 35% 48%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0) 100%)'
              : 'radial-gradient(ellipse 92% 85% at 65% 48%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0) 100%)',
          maskImage:
            side === 'left'
              ? 'radial-gradient(ellipse 92% 85% at 35% 48%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0) 100%)'
              : 'radial-gradient(ellipse 92% 85% at 65% 48%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0) 100%)',
        }}
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-full flex items-end justify-center overflow-visible"
      >
        <img
          src={processedSrc}
          alt={alt}
          className="w-full h-full object-contain object-bottom drop-shadow-[0_22px_35px_rgba(59,35,22,0.18)] sepia-[0.22] contrast-[1.08] saturate-[1.1]"
        />
      </motion.div>
    </div>
  );
}


export function HeroScrollExperience({ onOpenPlanner }: HeroScrollExperienceProps) {
  const navigate = useNavigate();

  // 1. Dynamic Cycling Constraint State
  const [constraintIndex, setConstraintIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setConstraintIndex((prev) => (prev + 1) % CYCLING_CONSTRAINTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // 2. Amie.so-Style 3D Mouse Parallax Engine
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 28, stiffness: 110 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const leftTranslateX = useTransform(smoothX, [-0.5, 0.5], [-16, 16]);
  const leftTranslateY = useTransform(smoothY, [-0.5, 0.5], [-14, 14]);
  const leftRotate = useTransform(smoothX, [-0.5, 0.5], [-15, -10]);

  const rightTranslateX = useTransform(smoothX, [-0.5, 0.5], [16, -16]);
  const rightTranslateY = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const rightRotate = useTransform(smoothX, [-0.5, 0.5], [10, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Onboarding state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [solvedPlan, setSolvedPlan] = useState<{
    answers: TripContextAnswers;
    plan: DayPlanResponse;
  } | null>(null);

  const handlePlanGenerated = (answers: TripContextAnswers, plan: DayPlanResponse) => {
    setSolvedPlan({ answers, plan });
    navigate('/itinerary');
  };

  const handlePrimaryClick = () => {
    if (onOpenPlanner) {
      onOpenPlanner();
    } else {
      setIsOnboardingOpen(true);
    }
  };

  const pinContainerRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const mediaCardRef = useRef<HTMLDivElement>(null);
  const leftFlankRef = useRef<HTMLDivElement>(null);
  const rightFlankRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayTextRef = useRef<HTMLDivElement>(null);

  // Only play landing video when user scrolls down into it; paused showing 1st frame while at hero screen
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.pause();

    const renderFirstFrame = () => {
      if (video && video.currentTime === 0) {
        try {
          video.currentTime = 0.001;
        } catch {
          // Ignore
        }
      }
    };

    if (video.readyState >= 2) {
      renderFirstFrame();
    } else {
      video.addEventListener('loadeddata', renderFirstFrame, { once: true });
      video.addEventListener('loadedmetadata', renderFirstFrame, { once: true });
    }

    const handleScrollPlayback = () => {
      const vid = videoRef.current;
      if (!vid) return;
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const vh = window.innerHeight;

      // Only play when the user has scrolled down into the video area (scrollY > 50) and before leaving it
      if (scrollY > 50 && scrollY < vh * 2.2) {
        if (vid.paused) {
          vid.muted = true;
          vid.play().catch(() => {});
        }
      } else {
        if (!vid.paused) {
          vid.pause();
        }
      }
    };

    window.addEventListener('scroll', handleScrollPlayback, { passive: true });
    window.addEventListener('resize', handleScrollPlayback, { passive: true });
    handleScrollPlayback();

    return () => {
      window.removeEventListener('scroll', handleScrollPlayback);
      window.removeEventListener('resize', handleScrollPlayback);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinContainerRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.3,
          anticipatePin: 1,
          snap: {
            snapTo: [0, 1],
            delay: 0.05,
            duration: { min: 0.2, max: 0.35 },
            ease: 'power2.inOut',
          },
        },
      });

      tl
        .to(
          [heroContentRef.current, leftFlankRef.current, rightFlankRef.current],
          { opacity: 0, y: -25, ease: 'power2.out', duration: 0.1 },
          0
        )
        .to(
          mediaCardRef.current,
          {
            top: '0%',
            left: '0%',
            right: '0%',
            borderRadius: '0px',
            boxShadow: 'none',
            ease: 'power3.out',
            duration: 0.12,
          },
          0
        )
        .fromTo(
          overlayTextRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, ease: 'power2.out', duration: 0.15 },
          0.08
        );
    }, pinContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={pinContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-screen overflow-hidden bg-[#FAF7F2] select-none"
    >
      {/* Onboarding Full-Screen Takeover Modal */}
      <TripOnboardingTakeover
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onPlanGenerated={handlePlanGenerated}
      />

      {/* Cartographic Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1D20 1px, transparent 1px),
            linear-gradient(to bottom, #1A1D20 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Topographic Contour Ring Accents */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] text-[#1A1D20]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        fill="none"
      >
        <path d="M-100 200 C300 150, 600 350, 1500 100" stroke="currentColor" strokeWidth="1.5" />
        <path d="M-100 350 C400 250, 800 500, 1500 280" stroke="currentColor" strokeWidth="1.5" />
        <path d="M-100 650 C250 500, 750 750, 1500 550" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Ambient Breathing Saffron/Terracotta Spotlight */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-[#D99B43]/15 via-[#C85A32]/10 to-transparent rounded-full blur-[100px] pointer-events-none animate-pulse" />

      {/* LEFT DIAGONAL MONUMENT CUTOUT: 3D Canva-Style Hawa Mahal Cutout */}
      <TransparentMonumentFlank
        side="left"
        imageUrl="/monument_hawa_mahal.png"
        fallbackUrl="/monument_hawa_mahal.jpg"
        alt="Hawa Mahal Jaipur 3D Canva-Style Cutout"
        motionX={leftTranslateX}
        motionY={leftTranslateY}
      />

      {/* RIGHT DIAGONAL MONUMENT CUTOUT: 3D Canva-Style India Gate Cutout */}
      <TransparentMonumentFlank
        side="right"
        imageUrl="/monument_india_gate.png"
        fallbackUrl="/monument_india_gate.jpg"
        alt="India Gate 3D Canva-Style Cutout"
        motionX={rightTranslateX}
        motionY={rightTranslateY}
      />


      {/* Hero Content Layer (fades out and floats up during scrub) */}
      <div
        ref={heroContentRef}
        className="absolute inset-x-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-auto"
        style={{ top: '44px', bottom: '10%' }}
      >
        {/* 1. NON-TABULAR ARCHITECTURAL MASTHEAD (Replaces Top White Pill Box) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5"
        >
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: 44 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="h-[1px] bg-gradient-to-r from-transparent to-[#B84A27]"
          />
          <span className="font-meta text-[11px] sm:text-xs font-bold tracking-[0.22em] text-[#B84A27] uppercase flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rotate-45 bg-[#D99B43]" />
            Pan-India Cultural Discovery Engine
            <span className="inline-block w-1.5 h-1.5 rotate-45 bg-[#D99B43]" />
          </span>
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: 44 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="h-[1px] bg-gradient-to-l from-transparent to-[#B84A27]"
          />
        </motion.div>

        {/* 2. MAIN DISPLAY HEADLINE (Deep Roasted Espresso #3B2316 instead of Cold Black) */}
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[58px] text-[#3B2316] tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Real Indian Cultural Experiences.{' '}
          <span className="block mt-1 sm:mt-2">
            Packed Around Your{' '}
            <span className="relative inline-block text-[#B84A27]">
              Exact Constraints.
              <svg
                className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-2.5 sm:h-3 text-[#D99B43] opacity-90 pointer-events-none"
                viewBox="0 0 250 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 9C50 3 150 2 247 8"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </span>
        </h1>

        {/* 3. UNBOXED KINETIC BLUR-MORPH CALLOUT (Replaces the Yellow Pill Box) */}
        <div className="h-8 flex items-center justify-center mt-3 sm:mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={constraintIndex}
              initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex items-center gap-3 font-heading italic text-sm sm:text-base font-bold text-[#A63E1E] tracking-wide"
            >
              <span className="text-[#D99B43] font-normal not-italic">✦</span>
              <span className="border-b border-dashed border-[#D99B43]/70 pb-0.5">
                {CYCLING_CONSTRAINTS[constraintIndex]}
              </span>
              <span className="text-[#D99B43] font-normal not-italic">✦</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 4. NARRATIVE SUBTITLE */}
        <p className="font-meta text-xs sm:text-base text-[#5C3D2E] max-w-xl mx-auto mt-2 leading-relaxed px-2">
          Discover authentic artisan guilds and living heritage, packed into feasible cultural circuits built around your time and budget.
        </p>

        {/* 5. REGISTRY VERIFICATION BADGE */}
        <div className="mt-2 font-meta text-[11px] sm:text-xs text-[#8C6751] font-semibold tracking-[0.16em] uppercase">
          Curated Across{' '}
          <span className="text-[#B84A27] font-extrabold underline decoration-[#D99B43]/60 underline-offset-4">
            36 States & Union Territories
          </span>
        </div>

        {/* 6. CLEAN NON-TABULAR LUXURY ACTION STAGE */}
        <div className="mt-6 sm:mt-7 flex flex-col items-center gap-3.5 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            {/* Primary Action Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrimaryClick}
              className="w-full sm:w-auto whitespace-nowrap px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#B84A27] via-[#C85A32] to-[#D98A36] text-[#FFFDF9] font-heading font-extrabold text-sm sm:text-[15px] tracking-wide shadow-[0_14px_30px_-8px_rgba(184,74,39,0.45)] hover:shadow-[0_18px_38px_-6px_rgba(184,74,39,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <span>{solvedPlan ? 'Adjust Your Micro-Circuit' : 'Plan Instant Micro-Itinerary'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </motion.button>

            {/* Secondary Action Button: Guaranteed Single Line (whitespace-nowrap) */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/explore')}
              className="w-full sm:w-auto whitespace-nowrap px-7 py-3.5 sm:py-4 rounded-full bg-[#F5EDE0]/90 hover:bg-[#FFFDF9] border border-[#DFCBB2] hover:border-[#B84A27] text-[#3B2316] font-heading font-bold text-sm sm:text-[15px] tracking-wide shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#B84A27] shrink-0" />
              <span>Explore 36 States</span>
            </motion.button>
          </div>

          {/* Non-Tabular Editorial Signature & AI Concierge Redirect */}
          <button
            type="button"
            onClick={() => navigate('/ai-guide')}
            className="flex items-center gap-2.5 text-[#7A5C49] hover:text-[#3B2316] font-meta text-xs sm:text-[13px] italic transition-all cursor-pointer group"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F2E5D5] group-hover:bg-[#B84A27] text-[#9E4726] group-hover:text-[#FFFDF9] not-italic font-bold text-[11px] tracking-wider uppercase transition-all shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D99B43] group-hover:text-[#FFFDF9] transition-colors" />
              <span>Instant AI Solver</span>
            </span>
            <span className="group-hover:underline underline-offset-4 transition-all">
              Solves verified micro-circuits in ~60 seconds with zero tourist markups →
            </span>
          </button>
        </div>
      </div>

      {/* Expanding Media Card with Preserved Peek at Fold */}
      <div
        ref={mediaCardRef}
        className="absolute overflow-hidden will-change-transform z-20 pointer-events-none"
        style={{
          top: '91%',
          left: '8%',
          right: '8%',
          bottom: '0%',
          borderRadius: '32px 32px 0px 0px',
          boxShadow: '0 -10px 35px rgba(26, 29, 32, 0.15)',
        }}
      >
        <video
          ref={videoRef}
          src="/landing_video.mp4#t=0.001"
          playsInline
          muted
          loop
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        <div
          ref={overlayTextRef}
          className="absolute bottom-8 sm:bottom-14 inset-x-0 z-10 text-center px-4 pointer-events-none flex flex-col items-center justify-center"
          style={{ opacity: 0 }}
        >
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-[0.25em] uppercase text-white/20 select-none drop-shadow-sm">
            LOKIVA
          </h2>

          <div className="mt-1.5 sm:mt-2 space-y-1">
            <p className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-widest text-[#FFC067] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Living Heritage &bull; Real Transit Hours
            </p>
            <p className="text-xs sm:text-sm md:text-base font-sans font-semibold text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-lg mx-auto">
              Where living traditions meet curated cultural micro-circuits.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroScrollExperience;
