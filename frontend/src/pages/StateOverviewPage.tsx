import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Heart,
  ArrowRight,
  Compass,
  ChevronRight,
  Zap,
  Bot,
  Thermometer,
  Building2,
  Check,
  Star,
  ExternalLink,
  ChevronDown,
  Info,
  Award,
  Share2,
  Utensils,
  BookOpen,
  Sun,
  Flame,
  ShieldCheck,
  Layers,
  Landmark,
  Camera,
  Luggage,
  Quote,
} from 'lucide-react';
import { getStateOverview, StateOverview, SeasonTimelineItem, HistoryEra, StateThemePalette, getStateThemePalette } from '../data/stateOverviewData';
import { CulturalIntelligencePanel } from '../components/culture/CulturalIntelligencePanel';

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'culture', label: 'Culture & History', icon: Landmark },
  { id: 'festivals', label: 'Festivals', icon: Sun },
  { id: 'food', label: 'Gastronomy', icon: Utensils },
  { id: 'places', label: 'Landmarks', icon: Building2 },
  { id: 'experiences', label: 'Experiences', icon: Compass },
  { id: 'best-time', label: 'Seasonal Almanac', icon: Calendar },
];

function getMonumentIcon(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('fort') || n.includes('citadel') || n.includes('rampart') || n.includes('bastion') || n.includes('wall')) {
    return <ShieldCheck className="w-3.5 h-3.5" />;
  }
  if (n.includes('temple') || n.includes('shrine') || n.includes('chaitya') || n.includes('ghat') || n.includes('mosque') || n.includes('church') || n.includes('basalt') || n.includes('caves') || n.includes('kailasa') || n.includes('stupa') || n.includes('gompa')) {
    return <Landmark className="w-3.5 h-3.5" />;
  }
  if (n.includes('palace') || n.includes('haveli') || n.includes('wada') || n.includes('museum') || n.includes('observatory') || n.includes('terminus') || n.includes('arch') || n.includes('building')) {
    return <Building2 className="w-3.5 h-3.5" />;
  }
  if (n.includes('port') || n.includes('corridor') || n.includes('harbor') || n.includes('promenade') || n.includes('waterway') || n.includes('route') || n.includes('pass') || n.includes('network')) {
    return <Compass className="w-3.5 h-3.5" />;
  }
  if (n.includes('guild') || n.includes('printing') || n.includes('silk') || n.includes('pottery') || n.includes('weaving') || n.includes('art') || n.includes('frescoes') || n.includes('handloom') || n.includes('craft')) {
    return <Sparkles className="w-3.5 h-3.5" />;
  }
  return <MapPin className="w-3.5 h-3.5" />;
}

function getEraMarker(index: number) {
  if (index === 0) {
    return {
      glyph: <Landmark className="w-3.5 h-3.5" />,
      roman: 'I',
      subtitle: 'Origins & Sacred Shrines',
    };
  }
  if (index === 1) {
    return {
      glyph: <ShieldCheck className="w-3.5 h-3.5" />,
      roman: 'II',
      subtitle: 'Sovereign Fortress Realm',
    };
  }
  return {
    glyph: <Sparkles className="w-3.5 h-3.5" />,
    roman: 'III',
    subtitle: 'Living Artisan Renaissance',
  };
}

function getFallbackHistory(state: StateOverview): HistoryEra[] {
  if (state.historyThroughline && state.historyThroughline.length > 0) {
    return state.historyThroughline;
  }
  return [
    {
      eraName: `Ancient Foundations & Sacred Shrines`,
      timePeriod: 'Ancient Era - 12th Century CE',
      headline: `Early dynasties, sacred stone monuments, and trade routes that laid the cultural bedrock of ${state.name}.`,
      narrative: `Across centuries of classical dynasties, master artisans established monumental stone temples, rock-hewn sanctuaries, and vibrant trade caravans that defined the regional architectural grammar and sacred folklore still celebrated across ${state.name}.`,
      image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `Ancient Stone Sanctuaries & Shrines of ${state.name}`,
      monumentsBuilt: [`Ancient Shrines of ${state.name}`, `Historic Trade Corridors`, `Dynastic Palaces`],
      impactOnToday: `Forms the spiritual, architectural, and folklore foundation of ${state.name}'s living festivals and temple circuits.`,
    },
    {
      eraName: `The Fortified Kingdom & Sovereign Realm`,
      timePeriod: '13th - 18th Century CE',
      headline: `Royal bastions, mountain fortresses, and the golden age of regional statecraft.`,
      narrative: `Marked by the construction of formidable hill ramparts, royal palace complexes, and distinct regional governance that defended the territory and nurtured classical music, poetry, and indigenous martial traditions.`,
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `Historic Fortresses & Mountain Bastions of ${state.name}`,
      monumentsBuilt: [`Royal Fortresses`, `Historic Capital Precincts`, `Defensive Citadel Walls`],
      impactOnToday: `Preserves the proud heritage of independence, architectural defense ingenuity, and generational culinary traditions.`,
    },
    {
      eraName: `Artisan Renaissance & Modern Living Heritage`,
      timePeriod: '19th Century - Present',
      headline: `From traditional weaving and craft guilds to a vibrant modern cultural destination.`,
      narrative: `Today, ${state.name} effortlessly merges its ancestral textile looms, culinary legacies, and sacred pageantry with forward-looking cultural festivals, eco-tourism trails, and warm regional hospitality.`,
      image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `Living Mastercraft Guilds & Cultural Heritage of ${state.name}`,
      monumentsBuilt: [`Heritage Bazaars`, `Cultural Centers`, `Preserved Historic Districts`],
      impactOnToday: `Creates a rich, immersive travel experience where ancient hospitality welcomes modern explorers.`,
    },
  ];
}

function getStateCutoutAsset(stateId: string, stateName?: string): { src: string; alt: string; tag: string } {
  const s = (stateId || '').toLowerCase().trim();
  if (s.includes('kerala') || s === 'kl') {
    return {
      src: '/assets/destinations/kerala-houseboat-cutout.png',
      alt: 'Kerala Backwater Houseboat',
      tag: 'Backwater Escape',
    };
  }
  if (s.includes('rajasthan') || s === 'rj') {
    return {
      src: '/assets/monuments/hawa-mahal-cutout.png',
      alt: 'Hawa Mahal Palace of Winds',
      tag: 'Royal Heritage',
    };
  }
  if (s.includes('maharashtra') || s === 'mh') {
    return {
      src: '/assets/monuments/gateway-of-india-cutout.png',
      alt: 'Gateway of India',
      tag: 'Colonial Maritime',
    };
  }
  if (s.includes('ladakh') || s === 'la' || s === 'leh') {
    return {
      src: '/assets/destinations/himalayan-stupa-cutout.png',
      alt: 'Himalayan Stupa & Gompa',
      tag: 'High Mountain Pass',
    };
  }
  if (s.includes('tamil') || s === 'tn') {
    return {
      src: '/assets/monuments/temple-gopuram-cutout.png',
      alt: 'Dravidian Temple Gopuram',
      tag: 'Sacred Architecture',
    };
  }
  if (s.includes('karnataka') || s === 'ka') {
    return {
      src: '/assets/destinations/hampi-stone-chariot-cutout.png',
      alt: 'Hampi Stone Chariot',
      tag: 'Vijayanagara Stone Craft',
    };
  }
  if (s.includes('uttar') || s === 'up') {
    return {
      src: '/assets/monuments/taj-mahal-cutout.png',
      alt: 'Taj Mahal Monument',
      tag: 'Mughal Splendour',
    };
  }
  return {
    src: '/assets/destinations/royal-elephant-cutout.png',
    alt: `${stateName || 'Indian'} Cultural Heritage`,
    tag: 'Living Heritage',
  };
}

function TransparentFewHoursCutout({ stateId, stateName }: { stateId: string; stateName: string }) {
  const asset = getStateCutoutAsset(stateId, stateName);
  const rawMonumentUrl = asset.src;
  const fallbackMonumentUrl =
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=85';

  const [cutoutSrc, setCutoutSrc] = React.useState<string>(rawMonumentUrl);

  React.useEffect(() => {
    if (rawMonumentUrl.startsWith('/assets/')) {
      setCutoutSrc(rawMonumentUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = rawMonumentUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const isSkyOrWhite =
            (r > 230 && g > 230 && b > 225) ||
            (b > r + 15 && b > 150 && g > 135);
          if (isSkyOrWhite) d[i + 3] = 0;
        }
        ctx.putImageData(imgData, 0, 0);
        setCutoutSrc(canvas.toDataURL('image/png'));
      } catch {
        setCutoutSrc(rawMonumentUrl);
      }
    };
    img.onerror = () => setCutoutSrc(fallbackMonumentUrl);
  }, [rawMonumentUrl]);

  return (
    <div className="relative h-64 sm:h-72 w-full flex items-center justify-center overflow-visible select-none">
      {/* Warm Sacred Geometry Compass Ring Behind Transparent Cutout */}
      <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-dashed border-[#C1443B]/35 animate-[spin_50s_linear_infinite]" />
      <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-[#FFC067]/20 via-[#C1443B]/15 to-transparent blur-2xl" />

      <motion.img
        initial={{ opacity: 0, y: 18, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        src={cutoutSrc}
        alt={`${stateName} Heritage Cutout`}
        className="relative z-10 max-h-56 sm:max-h-64 w-auto object-contain drop-shadow-[0_20px_30px_rgba(59,35,22,0.22)]"
      />

      {/* Floating Micro-Badge */}
      <div className="absolute -bottom-2 right-4 sm:right-10 z-20 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-md flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#C1443B]" />
        <span className="text-[11px] font-mono font-bold text-[#12213B]">
          {asset.tag}
        </span>
      </div>
    </div>
  );
}

export function StateOverviewPage() {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  const navigate = useNavigate();

  const stateData: StateOverview | null = getStateOverview(stateSlug || '');
  const statePalette: StateThemePalette = stateData?.palette || getStateThemePalette(stateData?.id || '', stateData?.name);

  // Active section tracker for navigation
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedSeason, setSelectedSeason] = useState<string>('Winter');
  const [selectedQuickHours, setSelectedQuickHours] = useState<number>(3);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [activeCultureCategory, setActiveCultureCategory] = useState<string>('All');

  // Always scroll to top on destination page load/change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [stateSlug]);

  // Check saved state from localStorage
  useEffect(() => {
    if (!stateData) return;
    try {
      const saved = JSON.parse(localStorage.getItem('lokiva_saved_states') || '[]');
      setIsSaved(saved.includes(stateData.id));
    } catch {
      setIsSaved(false);
    }
  }, [stateData]);

  // Set default selected season when state loads
  useEffect(() => {
    if (stateData?.seasons && stateData.seasons.length > 0) {
      const rec = stateData.seasons.find((s) => s.isRecommended);
      setSelectedSeason(rec ? rec.season : stateData.seasons[0].season);
    }
  }, [stateData]);

  // Handle active navigation spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const sec of NAV_SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleSave = () => {
    if (!stateData) return;
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('lokiva_saved_states') || '[]');
      let updated: string[];
      if (saved.includes(stateData.id)) {
        updated = saved.filter((id) => id !== stateData.id);
        setIsSaved(false);
        setSaveToast(`Removed ${stateData.name} from saved`);
      } else {
        updated = [...saved, stateData.id];
        setIsSaved(true);
        setSaveToast(`Saved ${stateData.name} to your wishlist`);
      }
      localStorage.setItem('lokiva_saved_states', JSON.stringify(updated));
      setTimeout(() => setSaveToast(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -140;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleLaunchQuickEscape = () => {
    if (!stateData) return;
    const hours = selectedQuickHours === 24 ? 5 : selectedQuickHours;
    navigate(
      `/?quickEscapeLocation=${encodeURIComponent(stateData.quickEscapeCity)}&quickEscapeHours=${hours}#quick-escape`
    );
  };

  const handleAskAi = (promptText?: string) => {
    const query = promptText || (stateData ? `Plan a tailored trip to ${stateData.name}` : '');
    navigate(`/ai-guide?prompt=${encodeURIComponent(query)}`);
  };

  if (!stateData) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-display font-extrabold text-[#12213B] mb-3">
          State Not Found
        </h1>
        <p className="text-slate-600 mb-6 max-w-md">
          We could not find the destination overview for &quot;{stateSlug}&quot;. Please return to our destinations showcase.
        </p>
        <Link
          to="/destinations"
          className="px-6 py-3 rounded-full bg-[#C1443B] text-white font-heading font-bold text-sm tracking-wider uppercase shadow-md hover:bg-[#A8362E] transition"
        >
          Return to Destinations
        </Link>
      </div>
    );
  }

  const cultureCategories = ['All', ...Array.from(new Set(stateData.culture.map((c) => c.category)))];
  const filteredCulture =
    activeCultureCategory === 'All'
      ? stateData.culture
      : stateData.culture.filter((c) => c.category === activeCultureCategory);

  const activeSeasonData: SeasonTimelineItem | undefined =
    stateData.seasons.find((s) => s.season === selectedSeason) || stateData.seasons[0];

  return (
    <div className="min-h-screen bg-transparent text-[#12213B] selection:bg-[#FFC067] selection:text-[#12213B]">
      {/* Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#12213B] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-3 backdrop-blur-md font-sans text-sm"
          >
            <div className="w-7 h-7 rounded-full bg-[#C1443B]/20 border border-[#C1443B]/40 flex items-center justify-center text-[#FFC067]">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. CINEMATIC STATE HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-[92vh] sm:h-screen min-h-[640px] flex items-center justify-center overflow-hidden bg-[#1A100B]">
        {/* Cinematic Media Background */}
        <div className="absolute inset-0 z-0">
          {stateData.heroVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={stateData.heroImage}
              className="w-full h-full object-cover scale-[1.03] opacity-90 brightness-[1.05] contrast-[1.02]"
            >
              <source src={stateData.heroVideo} type="video/mp4" />
            </video>
          ) : (
            <img
              src={stateData.heroImage}
              alt={stateData.name}
              className="w-full h-full object-cover scale-[1.03] opacity-90 brightness-[1.05] contrast-[1.02]"
            />
          )}

          {/* Editorial subtle warm espresso gradient overlay allowing monument architectural details to shine */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A100B]/80 via-[#1A100B]/30 to-[#1A100B]/45" />
          <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_45%,_rgba(26,16,11,0.4)_100%]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center pt-16">
          {/* Breadcrumb pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-white/90 text-xs font-mono tracking-widest uppercase mb-6 shadow-sm">
            <Link to="/destinations" className="hover:text-[#FFC067] transition">
              Destinations
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-[#FFC067] font-bold">{stateData.name}</span>
          </div>

          {/* STATE NAME (Monumental typography) */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-5xl sm:text-7xl lg:text-9xl font-display font-extrabold text-white tracking-tight uppercase leading-[0.95] drop-shadow-lg"
          >
            {stateData.name}
          </motion.h1>

          {/* Short Emotional Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            className="mt-5 max-w-2xl text-lg sm:text-2xl font-heading italic text-white/95 font-medium leading-relaxed drop-shadow-md"
          >
            “{stateData.tagline}”
          </motion.p>

          {/* Buttons: [ Explore Places ] [ Build My Itinerary ] [ ♡ Save ] */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <button
              onClick={() => scrollToSection('places')}
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#C1443B] hover:bg-[#A8362E] text-white font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-xl hover:shadow-[#C1443B]/30 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Explore Places</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to={`/itinerary?city=${encodeURIComponent(stateData.primaryCity)}`}
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition backdrop-blur-md shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Build My Itinerary</span>
            </Link>

            <button
              onClick={handleToggleSave}
              className={`px-5 py-3 sm:py-3.5 rounded-full border transition backdrop-blur-md text-xs sm:text-sm font-heading font-bold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-lg ${
                isSaved
                  ? 'bg-[#C1443B] border-[#C1443B] text-white'
                  : 'bg-white/10 hover:bg-white/20 border-white/25 text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : 'text-[#FFC067]'}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </motion.div>

          {/* Discover State Cue */}
          <button
            onClick={() => scrollToSection('overview')}
            className="mt-12 sm:mt-14 inline-flex items-center gap-2 text-white/80 hover:text-[#FFC067] text-xs font-mono tracking-widest uppercase transition group cursor-pointer"
          >
            <span>Discover {stateData.name}</span>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HORIZONTAL SECTION NAVIGATION (Static Pill Bar)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex justify-center">
        <nav
          className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-full backdrop-blur-xl border shadow-md whitespace-nowrap overflow-x-auto scrollbar-none max-w-[95vw] sm:max-w-none"
          style={{
            backgroundColor: `${statePalette.cardBg}FA`,
            borderColor: statePalette.borderAccent,
            boxShadow: `0 10px 30px -8px ${statePalette.primaryAccent}15`,
          }}
        >
          {NAV_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`relative px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'text-white shadow-sm' : 'text-[#12213B]/80 hover:text-[#12213B] hover:bg-black/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="stateActiveTabIndicatorStatic"
                    className="absolute inset-0 rounded-full shadow-sm z-0"
                    style={{
                      backgroundColor: statePalette.primaryAccent,
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{sec.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. STATE SNAPSHOT & TELEMETRY STRIP (Stats Bar)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 -mt-3 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Region */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            style={{ borderColor: statePalette.borderHue }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-heading font-extrabold uppercase tracking-widest"
                style={{ color: statePalette.primaryAccent }}
              >
                Region
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: `${statePalette.primaryAccent}15`,
                  color: statePalette.primaryAccent,
                }}
              >
                <Compass className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-sm sm:text-base font-heading font-extrabold text-[#12213B] leading-snug">
                {stateData.snapshot.region}
              </p>
              <span className="text-[11px] font-sans text-slate-500 mt-0.5 block">
                Geographic Zone
              </span>
            </div>
          </motion.div>

          {/* Capital */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            style={{ borderColor: statePalette.borderHue }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-heading font-extrabold uppercase tracking-widest"
                style={{ color: statePalette.primaryAccent }}
              >
                Capital City
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: `${statePalette.primaryAccent}15`,
                  color: statePalette.primaryAccent,
                }}
              >
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-sm sm:text-base font-heading font-extrabold text-[#12213B] leading-snug">
                {stateData.snapshot.capital}
              </p>
              <span className="text-[11px] font-sans text-slate-500 mt-0.5 block">
                Administrative Heart
              </span>
            </div>
          </motion.div>

          {/* Best Time */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            style={{ borderColor: statePalette.borderHue }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-heading font-extrabold uppercase tracking-widest"
                style={{ color: statePalette.primaryAccent }}
              >
                Best Time
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: `${statePalette.secondaryAccent}20`,
                  color: statePalette.secondaryAccent,
                }}
              >
                <Sun className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-sm sm:text-base font-heading font-extrabold text-[#12213B] leading-snug">
                {stateData.snapshot.bestTime}
              </p>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5 block">
                Peak Window
              </span>
            </div>
          </motion.div>

          {/* Duration */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            style={{ borderColor: statePalette.borderHue }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-heading font-extrabold uppercase tracking-widest"
                style={{ color: statePalette.primaryAccent }}
              >
                Ideal Stay
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: `${statePalette.primaryAccent}15`,
                  color: statePalette.primaryAccent,
                }}
              >
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-sm sm:text-base font-heading font-extrabold text-[#12213B] leading-snug">
                {stateData.snapshot.duration}
              </p>
              <span className="text-[11px] font-sans text-slate-500 mt-0.5 block">
                Recommended Pace
              </span>
            </div>
          </motion.div>

          {/* Best For */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group col-span-2 md:col-span-1"
            style={{ borderColor: statePalette.borderHue }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-heading font-extrabold uppercase tracking-widest"
                style={{ color: statePalette.primaryAccent }}
              >
                Signatures
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: `${statePalette.secondaryAccent}25`,
                  color: statePalette.darkInk,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-heading font-bold text-[#12213B] leading-snug line-clamp-2">
                {stateData.snapshot.bestFor.join(', ')}
              </p>
              <span className="text-[11px] font-sans text-slate-500 mt-0.5 block">
                Key Experiences
              </span>
            </div>
          </motion.div>

          {/* Climate */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group col-span-2 md:col-span-1"
            style={{ borderColor: statePalette.borderHue }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-heading font-extrabold uppercase tracking-widest"
                style={{ color: statePalette.primaryAccent }}
              >
                Climate
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: `${statePalette.primaryAccent}15`,
                  color: statePalette.primaryAccent,
                }}
              >
                <Thermometer className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-sans text-slate-700 leading-snug line-clamp-2">
                {stateData.snapshot.climate}
              </p>
              <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
                Weather Profile
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. WHY VISIT THIS STATE (Editorial Magazine Layout)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Editorial Narrative & Pull Quote */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span
                className="text-xs font-heading font-extrabold uppercase tracking-widest flex items-center gap-2"
                style={{ color: statePalette.primaryAccent }}
              >
                <Sparkles className="w-4 h-4" />
                Curated Perspective
              </span>
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-[1.08]" style={{ color: statePalette.darkInk }}>
                {stateData.introduction.headline || `Why Journey to ${stateData.name}?`}
              </h2>
              {stateData.introduction.subheadline && (
                <p className="text-base sm:text-xl font-heading font-semibold text-slate-700 leading-relaxed pt-1">
                  {stateData.introduction.subheadline}
                </p>
              )}
            </div>

            {/* Editorial Pull Quote */}
            <div
              className="border-l-4 p-6 sm:p-7 rounded-r-3xl shadow-2xs space-y-3"
              style={{
                backgroundColor: statePalette.cardBgAlt,
                borderLeftColor: statePalette.primaryAccent,
                borderColor: statePalette.borderAccent,
              }}
            >
              <div className="flex items-center gap-2" style={{ color: statePalette.primaryAccent }}>
                <Quote className="w-6 h-6 rotate-180" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold">
                  The Essence of {stateData.name}
                </span>
              </div>
              <p className="text-base sm:text-lg font-heading font-semibold italic text-[#12213B] leading-relaxed">
                “{stateData.introduction.quotePull || stateData.tagline}”
              </p>
            </div>

            {/* Narrative Body with Drop Cap Styling */}
            <div className="font-sans text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
              <p
                className="first-letter:float-left first-letter:text-5xl first-letter:font-display first-letter:font-extrabold first-letter:mr-3 first-letter:leading-none"
                style={{
                  color: '#334155',
                }}
              >
                {stateData.introduction.description}
              </p>
            </div>

            {/* Quick Metrics & Discovery Pills */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <span
                className="px-3.5 py-1.5 rounded-xl bg-white border text-[#12213B] text-xs font-mono font-semibold flex items-center gap-1.5 shadow-2xs"
                style={{ borderColor: statePalette.borderHue }}
              >
                <Landmark className="w-3.5 h-3.5" style={{ color: statePalette.primaryAccent }} />
                <span>Historic Circuits</span>
              </span>
              <span
                className="px-3.5 py-1.5 rounded-xl bg-white border text-[#12213B] text-xs font-mono font-semibold flex items-center gap-1.5 shadow-2xs"
                style={{ borderColor: statePalette.borderHue }}
              >
                <Utensils className="w-3.5 h-3.5" style={{ color: statePalette.secondaryAccent }} />
                <span>Gastronomic Legacies</span>
              </span>
              <span
                className="px-3.5 py-1.5 rounded-xl bg-white border text-[#12213B] text-xs font-mono font-semibold flex items-center gap-1.5 shadow-2xs"
                style={{ borderColor: statePalette.borderHue }}
              >
                <Sun className="w-3.5 h-3.5" style={{ color: statePalette.secondaryAccent }} />
                <span>Living Festivals</span>
              </span>
              <span
                className="px-3.5 py-1.5 rounded-xl bg-white border text-[#12213B] text-xs font-mono font-semibold flex items-center gap-1.5 shadow-2xs"
                style={{ borderColor: statePalette.borderHue }}
              >
                <Camera className="w-3.5 h-3.5" style={{ color: statePalette.primaryAccent }} />
                <span>Unspoiled Landscapes</span>
              </span>
            </div>
          </div>

          {/* Right Column: Editorial Visual Showcase */}
          <div className="lg:col-span-5 space-y-5">
            <div
              className="relative rounded-3xl overflow-hidden bg-white border shadow-lg group"
              style={{ borderColor: statePalette.borderHue }}
            >
              <div className="relative h-72 sm:h-96 w-full overflow-hidden">
                <img
                  src={stateData.whyVisitHighlights[0]?.image || stateData.heroImage}
                  alt={stateData.whyVisitHighlights[0]?.title || stateData.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12213B]/80 via-black/20 to-transparent" />
                <span
                  className="absolute top-4 left-4 text-xs font-heading font-extrabold uppercase tracking-widest text-white px-3 py-1 rounded-full shadow-md"
                  style={{ backgroundColor: statePalette.primaryAccent }}
                >
                  {stateData.whyVisitHighlights[0]?.tag || 'Signature Highlight'}
                </span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-heading font-bold text-white drop-shadow-xs">
                    {stateData.whyVisitHighlights[0]?.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/85 font-sans line-clamp-2 mt-1">
                    {stateData.whyVisitHighlights[0]?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Itinerary Quick Link Card */}
            <div
              className="bg-white rounded-3xl p-6 border shadow-xs flex items-center justify-between gap-4"
              style={{ borderColor: statePalette.borderHue }}
            >
              <div className="space-y-1">
                <h4 className="text-base font-heading font-bold" style={{ color: statePalette.darkInk }}>
                  Tailored Travel Blueprint
                </h4>
                <p className="text-xs text-slate-600 font-sans">
                  Generate an AI-curated multi-day route through {stateData.name}.
                </p>
              </div>
              <Link
                to={`/itinerary?city=${encodeURIComponent(stateData.primaryCity)}`}
                className="shrink-0 px-4 py-2.5 rounded-full text-white font-heading font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: statePalette.primaryAccent }}
              >
                <span>Build Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Asymmetric Highlights Grid */}
        <div className="mt-14 sm:mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span
                className="text-xs font-heading font-extrabold uppercase tracking-widest"
                style={{ color: statePalette.primaryAccent }}
              >
                Distinctive Marvels
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight mt-0.5" style={{ color: statePalette.darkInk }}>
                Highlights That Define {stateData.name}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stateData.whyVisitHighlights.map((hl, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="group relative rounded-3xl overflow-hidden bg-white border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                style={{ borderColor: statePalette.borderHue }}
              >
                <div>
                  <div className="relative h-52 w-full overflow-hidden">
                    <img
                      src={hl.image}
                      alt={hl.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12213B]/70 via-transparent to-transparent" />
                    <span
                      className="absolute top-3 left-3 text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#12213B] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border shadow-xs"
                      style={{ borderColor: statePalette.borderHue }}
                    >
                      {hl.tag}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4
                      className="text-base font-heading font-bold text-[#12213B] transition-colors leading-snug"
                      style={{
                        '--hover-color': statePalette.primaryAccent,
                      } as any}
                    >
                      {hl.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                      {hl.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. CULTURE & HISTORICAL THROUGHLINE (State-Themed Narrative Rail)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="culture"
        className="py-16 sm:py-24 border-y relative overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: statePalette.bgParchment,
          borderColor: statePalette.borderHue,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span
              className="text-xs font-heading font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5"
              style={{ color: statePalette.primaryAccent }}
            >
              <Landmark className="w-4 h-4" />
              Living Heritage & Historical Throughline
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
              Culture That Lives & Breathes
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-sans">
              Trace the civilizational epochs, sovereign fortress realms, and unbroken artisanal lineages of {stateData.name}.
            </p>
          </div>

          {/* 3-Chapter Vertical Narrative Rail (History) */}
          <div className="mb-16 sm:mb-20 max-w-5xl mx-auto">
            <div className="relative pl-7 sm:pl-12 space-y-10">
              {/* Vertical dynamic timeline connecting line */}
              <div
                className="absolute left-3.5 sm:left-5 top-6 bottom-6 w-1 rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${statePalette.primaryAccent}, ${statePalette.secondaryAccent}, ${statePalette.primaryAccent}20)`,
                }}
              />

              {getFallbackHistory(stateData).map((era, idx) => {
                const marker = getEraMarker(idx);
                const isAltCard = idx % 2 === 1;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -25, y: 15 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.55, delay: idx * 0.15, ease: 'easeOut' }}
                    className="relative group"
                  >
                    {/* Custom Era Marker Node */}
                    <div
                      className="absolute -left-[35px] sm:-left-[49px] top-2 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex flex-col items-center justify-center shadow-md border-2 border-white ring-2 z-10 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: statePalette.primaryAccent,
                        color: '#FFFFFF',
                        boxShadow: `0 4px 14px ${statePalette.primaryAccent}40`,
                      }}
                    >
                      <span className="text-[10px] font-mono font-extrabold leading-none">{marker.roman}</span>
                      <div className="scale-75 mt-0.5">{marker.glyph}</div>
                    </div>

                    {/* Chapter Card with State Theming & Editorial Photographic Showcase */}
                    <div
                      className="rounded-3xl p-6 sm:p-8 border shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group/card"
                      style={{
                        backgroundColor: isAltCard ? statePalette.cardBgAlt : '#FFFFFF',
                        borderColor: isAltCard ? statePalette.borderAccent : statePalette.borderHue,
                      }}
                    >
                      {/* Top Row: Time Period + Chapter Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-6" style={{ borderColor: statePalette.borderHue }}>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[11px] font-mono font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border shadow-2xs flex items-center gap-1.5"
                            style={{
                              backgroundColor: statePalette.badgeBg,
                              color: statePalette.badgeText,
                              borderColor: statePalette.borderAccent,
                            }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{era.timePeriod}</span>
                          </span>
                        </div>
                        <span
                          className="text-xs font-mono font-bold px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: statePalette.secondaryAccentBg,
                            color: statePalette.primaryAccent,
                            border: `1px solid ${statePalette.borderAccent}`,
                          }}
                        >
                          CHAPTER 0{idx + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left / Narrative Column */}
                        <div className={`${era.image ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                          {/* Chapter Title & Headline */}
                          <div className="space-y-1.5">
                            <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
                              {era.eraName}
                            </h3>
                            <p className="text-base sm:text-lg font-heading font-semibold text-slate-800 leading-snug">
                              {era.headline}
                            </p>
                          </div>

                          {/* Narrative Body */}
                          <p className="text-sm sm:text-base font-sans text-slate-600 leading-relaxed">
                            {era.narrative}
                          </p>

                          {/* Key Monuments with Individualized Icons */}
                          {era.monumentsBuilt && era.monumentsBuilt.length > 0 && (
                            <div className="space-y-2.5 pt-1">
                              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                                Key Monuments & Heritage Sites:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {era.monumentsBuilt.map((m, mIdx) => (
                                  <span
                                    key={mIdx}
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border text-[#12213B] text-xs font-mono font-medium hover:-translate-y-0.5 transition-all shadow-2xs group/tag cursor-default"
                                    style={{ borderColor: statePalette.borderHue }}
                                  >
                                    <span className="transition-transform group-hover/tag:scale-110" style={{ color: statePalette.primaryAccent }}>
                                      {getMonumentIcon(m)}
                                    </span>
                                    <span>{m}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Living Legacy Today Callout Box */}
                          <div
                            className="rounded-2xl p-4 sm:p-5 border-l-4 flex items-start gap-3.5 text-xs sm:text-sm font-sans shadow-2xs mt-4"
                            style={{
                              borderLeftColor: statePalette.primaryAccent,
                              backgroundColor: statePalette.badgeBg,
                              borderColor: statePalette.borderAccent,
                              borderTopWidth: 1,
                              borderRightWidth: 1,
                              borderBottomWidth: 1,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                              style={{
                                backgroundColor: statePalette.primaryAccent,
                                color: '#FFFFFF',
                              }}
                            >
                              <Compass className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              <span
                                className="text-xs font-mono font-bold uppercase tracking-wider block"
                                style={{ color: statePalette.primaryAccent }}
                              >
                                Living Legacy Today
                              </span>
                              <p className="text-slate-700 leading-relaxed font-sans font-medium">
                                {era.impactOnToday}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right / Archival Photography Column */}
                        {era.image && (
                          <div className="lg:col-span-5 h-full">
                            <div
                              className="relative rounded-2xl overflow-hidden bg-stone-100 border shadow-md group/img h-56 sm:h-64 lg:h-full min-h-[240px] flex flex-col justify-end"
                              style={{ borderColor: statePalette.borderAccent }}
                            >
                              <img
                                src={era.image}
                                alt={era.imageCaption || era.eraName}
                                className="absolute inset-0 w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
                              <div className="relative z-10 p-3.5 sm:p-4 space-y-1">
                                <span
                                  className="text-[10px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white inline-flex items-center gap-1 shadow-sm"
                                  style={{ backgroundColor: statePalette.primaryAccent }}
                                >
                                  <Camera className="w-2.5 h-2.5" />
                                  <span>Historical Archive</span>
                                </span>
                                {era.imageCaption && (
                                  <p className="text-xs sm:text-sm font-heading font-bold text-white drop-shadow-xs leading-snug">
                                    {era.imageCaption}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Living Traditions Filter & Cards Grid */}
          <div className="pt-6 border-t" style={{ borderColor: statePalette.borderHue }}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div>
                <span
                  className="text-xs font-heading font-extrabold uppercase tracking-widest"
                  style={{ color: statePalette.primaryAccent }}
                >
                  Artisanal & Performing Crafts
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight mt-1" style={{ color: statePalette.darkInk }}>
                  Living Traditions of {stateData.name}
                </h3>
              </div>

              {/* Category filter tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {cultureCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCultureCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition cursor-pointer whitespace-nowrap ${
                      activeCultureCategory === cat
                        ? 'text-white shadow-xs'
                        : 'bg-white text-[#12213B]/70 hover:text-[#12213B] border'
                    }`}
                    style={
                      activeCultureCategory === cat
                        ? { backgroundColor: statePalette.primaryAccent }
                        : { borderColor: statePalette.borderHue }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Cultural Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCulture.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-3xl overflow-hidden bg-white border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  style={{ borderColor: statePalette.borderHue }}
                >
                  <div>
                    <div className="relative h-56 w-full overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#12213B]/80 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#12213B] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 shadow-xs">
                        {item.category}
                      </span>
                      <h4 className="absolute bottom-3 left-3 right-3 text-base sm:text-lg font-heading font-bold text-white leading-snug drop-shadow-xs">
                        {item.title}
                      </h4>
                    </div>
                    <div className="p-5">
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              NUGEN-POWERED CULTURAL INTELLIGENCE PANEL (State-Agnostic Grounded Layer)
          ═══════════════════════════════════════════════════════════════════════ */}
          <CulturalIntelligencePanel
            stateSlug={stateSlug || stateData.id}
            palette={statePalette}
            stateName={stateData.name}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. SACRED CELEBRATIONS & FESTIVALS DOSSIER
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="festivals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span
            className="text-xs font-heading font-extrabold uppercase tracking-widest"
            style={{ color: statePalette.primaryAccent }}
          >
            Sacred Celebrations & Pageantry
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
            Experience the Living Festivals
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-sans">
            Witness centuries-old devotional processions, synchronized temple drums, and sacred community feasts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {stateData.festivals.map((fest) => (
            <div
              key={fest.id}
              className="group rounded-3xl overflow-hidden bg-white border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              style={{ borderColor: statePalette.borderHue }}
            >
              <div>
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={fest.image}
                    alt={fest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12213B]/80 via-black/20 to-transparent" />
                  <span
                    className="absolute top-3 right-3 text-[10px] font-heading font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs"
                    style={{
                      backgroundColor: statePalette.secondaryAccentBg,
                      color: statePalette.primaryAccent,
                      border: `1px solid ${statePalette.borderAccent}`,
                    }}
                  >
                    {fest.highlightTag}
                  </span>
                  <div className="absolute bottom-3 left-3 text-white text-xs font-mono flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-[#FFC067]" />
                    <span>{fest.monthSeason}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-[#12213B] leading-snug">
                      {fest.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans mt-1.5">
                      {fest.description}
                    </p>
                  </div>

                  {fest.ritualDetail && (
                    <div
                      className="rounded-2xl p-3.5 border space-y-1"
                      style={{
                        backgroundColor: statePalette.badgeBg,
                        borderColor: statePalette.borderAccent,
                      }}
                    >
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                        style={{ color: statePalette.primaryAccent }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Sacred Rituals & Pageantry
                      </span>
                      <p className="text-xs font-sans text-slate-700 leading-relaxed">
                        {fest.ritualDetail}
                      </p>
                    </div>
                  )}

                  {fest.sacredDelicacy && (
                    <div className="flex items-start gap-2 text-xs font-sans text-slate-700">
                      <Utensils className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: statePalette.secondaryAccent }} />
                      <div>
                        <strong className="font-heading font-bold text-[#12213B]">
                          Sacred Delicacy:
                        </strong>{' '}
                        <span>{fest.sacredDelicacy}</span>
                      </div>
                    </div>
                  )}

                  {fest.bestLocation && (
                    <div className="flex items-start gap-2 text-xs font-sans text-slate-700">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: statePalette.primaryAccent }} />
                      <div>
                        <strong className="font-heading font-bold text-[#12213B]">
                          Best Immersion Ground:
                        </strong>{' '}
                        <span>{fest.bestLocation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleAskAi(`Plan a tailored itinerary around attending ${fest.name} in ${stateData.name}`)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FAF7F2] hover:text-white text-[#12213B] font-heading font-bold text-xs uppercase tracking-wider transition border cursor-pointer"
                  style={{
                    borderColor: statePalette.borderHue,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = statePalette.primaryAccent;
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAF7F2';
                    e.currentTarget.style.borderColor = statePalette.borderHue;
                  }}
                >
                  <span>Plan Trip for This Festival</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. GASTRONOMY DOSSIER (Taste the State)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="food"
        className="py-16 sm:py-24 border-y transition-colors duration-300"
        style={{
          backgroundColor: statePalette.cardBgAlt,
          borderColor: statePalette.borderHue,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span
              className="text-xs font-heading font-extrabold uppercase tracking-widest"
              style={{ color: statePalette.primaryAccent }}
            >
              Epicurean Heritage
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
              Taste the Culinary Soul of {stateData.name}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-sans">
              Distinct culinary legacies honed across royal banquet halls, coastal fishermen hearths, and mountain caravans.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stateData.foods.map((food) => (
              <div
                key={food.id}
                className="group rounded-3xl overflow-hidden bg-white border hover:shadow-xl transition-all duration-300 flex flex-col justify-between shadow-xs"
                style={{ borderColor: statePalette.borderHue }}
              >
                <div>
                  <div className="relative h-52 w-full overflow-hidden">
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12213B]/70 via-transparent to-transparent" />
                    {food.badge && (
                      <span
                        className="absolute top-3 left-3 text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#12213B] px-2.5 py-1 rounded-md shadow-xs"
                        style={{
                          backgroundColor: statePalette.secondaryAccentBg,
                          border: `1px solid ${statePalette.borderAccent}`,
                        }}
                      >
                        {food.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 text-[11px] font-mono text-white bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/20 font-semibold">
                      {food.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base sm:text-lg font-heading font-bold text-[#12213B] leading-snug">
                      {food.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                      {food.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/explore?query=${encodeURIComponent(food.name)}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FAF7F2] hover:text-white text-[#12213B] font-heading font-bold text-xs uppercase tracking-wider transition border"
                    style={{ borderColor: statePalette.borderHue }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = statePalette.primaryAccent;
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FAF7F2';
                      e.currentTarget.style.borderColor = statePalette.borderHue;
                    }}
                  >
                    <span>Find Food Spots</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. LANDMARKS WORTH THE JOURNEY
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="places" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <span
              className="text-xs font-heading font-extrabold uppercase tracking-widest"
              style={{ color: statePalette.primaryAccent }}
            >
              Must-Visit Landmarks
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight mt-1" style={{ color: statePalette.darkInk }}>
              Places Worth the Journey
            </h2>
          </div>
          <Link
            to={`/explore?state=${encodeURIComponent(stateData.name)}`}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold uppercase tracking-wider transition"
            style={{ color: statePalette.primaryAccent }}
          >
            <span>View All Destinations in {stateData.name}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stateData.places.map((place) => (
            <div
              key={place.id}
              className="group rounded-3xl overflow-hidden bg-white border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              style={{ borderColor: statePalette.borderHue }}
            >
              <div>
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12213B]/70 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
                    <Star className="w-3 h-3 text-[#FFC067] fill-[#FFC067]" />
                    <span>{place.rating}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white text-xs font-mono flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC067]" />
                    <span>{place.location}</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-[#12213B] leading-snug">
                    {place.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans line-clamp-3">
                    {place.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {place.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono bg-[#FAF7F2] text-[#12213B]/80 px-2 py-0.5 rounded border"
                        style={{ borderColor: statePalette.borderHue }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/explore?query=${encodeURIComponent(place.name)}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FAF7F2] hover:text-white text-[#12213B] font-heading font-bold text-xs uppercase tracking-wider transition border cursor-pointer"
                  style={{ borderColor: statePalette.borderHue }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = statePalette.primaryAccent;
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAF7F2';
                    e.currentTarget.style.borderColor = statePalette.borderHue;
                  }}
                >
                  <span>Explore Place</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          8. BEST TIME TO VISIT (Interactive Seasonal Almanac)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="best-time"
        className="py-16 sm:py-24 border-t transition-colors duration-300"
        style={{
          backgroundColor: statePalette.bgParchment,
          borderColor: statePalette.borderHue,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span
              className="text-xs font-heading font-extrabold uppercase tracking-widest"
              style={{ color: statePalette.primaryAccent }}
            >
              Seasonal Almanac
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
              Best Time to Visit
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-sans">
              Select a season to discover temperature patterns, curated activities, and festival calendars.
            </p>
          </div>

          {/* Interactive Season Chips */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
            {stateData.seasons.map((s) => {
              const isSelected = selectedSeason === s.season;
              return (
                <button
                  key={s.season}
                  onClick={() => setSelectedSeason(s.season)}
                  className={`px-5 sm:px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-heading font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md scale-105'
                      : 'bg-white text-slate-700 hover:bg-[#EAE4DC] border'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: statePalette.primaryAccent }
                      : { borderColor: statePalette.borderHue }
                  }
                >
                  <span>{s.season}</span>
                  {s.isRecommended && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
                      style={{
                        backgroundColor: statePalette.secondaryAccentBg,
                        color: statePalette.primaryAccent,
                      }}
                    >
                      Recommended
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Season Details Card */}
          {activeSeasonData && (
            <div
              className="bg-white rounded-3xl p-6 sm:p-10 border shadow-lg max-w-4xl mx-auto"
              style={{ borderColor: statePalette.borderHue }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b gap-4" style={{ borderColor: statePalette.borderHue }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-mono uppercase font-bold"
                      style={{ color: statePalette.primaryAccent }}
                    >
                      {activeSeasonData.months}
                    </span>
                    {activeSeasonData.isRecommended && (
                      <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        Peak Season
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-extrabold" style={{ color: statePalette.darkInk }}>
                    {activeSeasonData.season} Season
                  </h3>
                </div>

                <div
                  className="flex items-center gap-2 border px-4 py-2 rounded-2xl"
                  style={{
                    backgroundColor: statePalette.cardBgAlt,
                    borderColor: statePalette.borderAccent,
                  }}
                >
                  <Thermometer className="w-5 h-5" style={{ color: statePalette.primaryAccent }} />
                  <span className="text-base font-mono font-bold" style={{ color: statePalette.darkInk }}>
                    {activeSeasonData.temperature}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
                    Weather Overview
                  </h4>
                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
                    {activeSeasonData.weather}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2.5">
                    <h4
                      className="text-xs font-heading font-extrabold uppercase tracking-wider"
                      style={{ color: statePalette.primaryAccent }}
                    >
                      Recommended Experiences
                    </h4>
                    <ul className="space-y-2">
                      {activeSeasonData.experiences.map((exp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2.5">
                    <h4
                      className="text-xs font-heading font-extrabold uppercase tracking-wider"
                      style={{ color: statePalette.primaryAccent }}
                    >
                      Seasonal Festivals & Events
                    </h4>
                    <ul className="space-y-2">
                      {activeSeasonData.festivals.map((fest, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: statePalette.secondaryAccent }} />
                          <span>{fest}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          9. WHO IS THIS STATE FOR?
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-16 sm:py-24 border-y transition-colors duration-300"
        style={{
          backgroundColor: statePalette.cardBgAlt,
          borderColor: statePalette.borderHue,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span
              className="text-xs font-heading font-extrabold uppercase tracking-widest"
              style={{ color: statePalette.primaryAccent }}
            >
              Travel Personality Match
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
              Who Is This State For?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-sans">
              Discover how {stateData.name} aligns with your travel style and passions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stateData.travelPersonalities.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl p-5 sm:p-6 transition-all border flex flex-col justify-between bg-white shadow-xs"
                style={{
                  borderColor: item.isTopMatch ? statePalette.borderAccent : statePalette.borderHue,
                  boxShadow: item.isTopMatch ? `0 4px 16px ${statePalette.primaryAccent}15` : undefined,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{item.emoji}</span>
                    {item.isTopMatch && (
                      <span
                        className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-white px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: statePalette.primaryAccent }}
                      >
                        Top Match
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-[#12213B] mb-1.5">
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          10. LOCAL EXPERIENCES (“Don't Just Visit. Experience.”)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="experiences" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span
            className="text-xs font-heading font-extrabold uppercase tracking-widest"
            style={{ color: statePalette.primaryAccent }}
          >
            Immersive Journeys
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
            Don&apos;t Just Visit. Experience.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-sans">
            Beyond standard sightseeing: participate in generational artisan masterclasses, desert camps, and sacred rituals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {stateData.localExperiences.map((exp) => (
            <div
              key={exp.id}
              className="group rounded-3xl overflow-hidden bg-white border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row"
              style={{ borderColor: statePalette.borderHue }}
            >
              <div className="relative sm:w-2/5 h-56 sm:h-auto overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden" />
                <span className="absolute top-3 left-3 text-2xl">{exp.icon}</span>
              </div>

              <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: statePalette.badgeBg,
                        color: statePalette.badgeText,
                      }}
                    >
                      {exp.tag}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>{exp.duration}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-[#12213B] leading-snug">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-slate-600 italic mt-0.5 font-sans">
                    {exp.subtitle}
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {exp.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700 font-sans">
                        <Sparkles className="w-3 h-3 shrink-0 mt-0.5" style={{ color: statePalette.secondaryAccent }} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleAskAi(`Tell me how to experience: ${exp.title} in ${stateData.name}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold uppercase tracking-wider transition self-start cursor-pointer hover:underline"
                  style={{ color: statePalette.primaryAccent }}
                >
                  <span>Ask Concierge About This</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          11. CONNECT WITH QUICK ESCAPE (Time-Constrained Discovery Studio)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: statePalette.bgParchment,
        }}
      >
        <div
          className="max-w-6xl mx-auto rounded-3xl p-8 sm:p-12 lg:p-14 border shadow-md relative overflow-hidden"
          style={{
            backgroundColor: statePalette.cardBgAlt,
            borderColor: statePalette.borderAccent,
          }}
        >
          {/* Subtle warm decorative glow */}
          <div
            className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: statePalette.primaryAccent }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column: Headline, Time Selector Chips & Action CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="space-y-3">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border font-mono text-xs font-bold uppercase tracking-widest shadow-2xs"
                  style={{
                    color: statePalette.primaryAccent,
                    borderColor: statePalette.borderAccent,
                  }}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Time-Constrained Discovery</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
                  Only Have a Few Hours?
                </h2>
                <p className="text-sm sm:text-base text-slate-700 font-sans max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Short on time? LOKIVA instantly synthesizes an authentic, high-craft micro-itinerary calibrated to the exact hours you have in {stateData.name}.
                </p>
              </div>

              {/* Time Options Selector Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  Select Your Available Duration:
                </span>
                <div className="flex items-center justify-center lg:justify-start gap-2.5 sm:gap-3 flex-wrap">
                  {[
                    { label: '1 Hour', hours: 1, desc: 'Express Stop' },
                    { label: '3 Hours', hours: 3, desc: 'Half-Day Trail' },
                    { label: '6 Hours', hours: 5, desc: 'Full Circuit' },
                    { label: '1 Day', hours: 24, desc: 'Overnight Immersive' },
                  ].map((option) => {
                    const isSelected = selectedQuickHours === option.hours;
                    return (
                      <button
                        key={option.label}
                        onClick={() => setSelectedQuickHours(option.hours)}
                        className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-heading font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? 'text-white shadow-md scale-105'
                            : 'bg-white text-slate-700 hover:bg-[#FAF6EE] border'
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: statePalette.primaryAccent }
                            : { borderColor: statePalette.borderHue }
                        }
                      >
                        <span>{option.label}</span>
                        <span className={`text-[10px] font-mono font-normal ${isSelected ? 'text-white/85' : 'text-slate-500'}`}>
                          {option.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTA Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleLaunchQuickEscape}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: statePalette.primaryAccent }}
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Plan My {selectedQuickHours === 24 ? '1-Day' : `${selectedQuickHours}-Hour`} Quick Escape</span>
                </button>
              </div>
            </div>

            {/* Right Column: Transparent Cutout Cultural Heritage Object */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <TransparentFewHoursCutout stateId={stateData.id} stateName={stateData.name} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          12. AI CONCIERGE (“Not Sure What to Explore? Ask LOKIVA”)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div
          className="bg-white rounded-3xl p-6 sm:p-10 border shadow-md flex flex-col md:flex-row items-center justify-between gap-8"
          style={{ borderColor: statePalette.borderHue }}
        >
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 text-xs font-heading font-extrabold uppercase tracking-widest"
              style={{ color: statePalette.primaryAccent }}
            >
              <Bot className="w-4 h-4" />
              <span>Intelligent Travel Assistance</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight" style={{ color: statePalette.darkInk }}>
              Not Sure What to Explore? Ask LOKIVA
            </h2>
            <p className="text-sm text-slate-600 font-sans leading-relaxed">
              Our AI Concierge synthesizes regional knowledge, weather reports, and crowd patterns to design your custom {stateData.name} adventure.
            </p>

            {/* Suggested prompts chips */}
            <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
              {stateData.suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskAi(prompt)}
                  className="text-xs font-heading font-semibold bg-[#FAF7F2] text-slate-800 px-3.5 py-1.5 rounded-full border transition cursor-pointer text-left shadow-2xs"
                  style={{ borderColor: statePalette.borderHue }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = statePalette.primaryAccent;
                    e.currentTarget.style.backgroundColor = statePalette.badgeBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = statePalette.borderHue;
                    e.currentTarget.style.backgroundColor = '#FAF7F2';
                  }}
                >
                  “{prompt}”
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => handleAskAi()}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-white font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              style={{ backgroundColor: statePalette.primaryAccent }}
            >
              <Sparkles className="w-4 h-4 text-[#FFC067]" />
              <span>Ask LOKIVA AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          13. FINAL TRAVEL CTA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-20 sm:py-28 overflow-hidden bg-[#0A111F] text-white">
        <div className="absolute inset-0 z-0">
          <img
            src={stateData.heroImage}
            alt={stateData.name}
            className="w-full h-full object-cover scale-105 opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A111F]/90 via-[#0A111F]/50 to-[#0A111F]/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#FFC067]">
            Begin Your Story
          </span>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
            Your Journey Starts Here.
          </h2>
          <p className="text-base sm:text-xl font-heading italic text-white/90 max-w-2xl mx-auto leading-relaxed">
            “{stateData.finalCtaMessage}”
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('places')}
              className="px-7 py-3.5 rounded-full text-white font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              style={{ backgroundColor: statePalette.primaryAccent }}
            >
              Explore Places
            </button>

            <Link
              to={`/itinerary?city=${encodeURIComponent(stateData.primaryCity)}`}
              className="px-7 py-3.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition backdrop-blur-md shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            >
              Build My Itinerary
            </Link>

            <button
              onClick={handleToggleSave}
              className={`px-6 py-3.5 rounded-full border transition backdrop-blur-md text-xs sm:text-sm font-heading font-bold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-lg ${
                isSaved
                  ? 'border-transparent text-white'
                  : 'bg-white/10 hover:bg-white/20 border-white/25 text-white'
              }`}
              style={isSaved ? { backgroundColor: statePalette.primaryAccent } : {}}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : 'text-[#FFC067]'}`} />
              <span>{isSaved ? 'Saved' : 'Save State'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
export default StateOverviewPage;
