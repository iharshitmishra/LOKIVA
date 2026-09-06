import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LokivaLandingHero } from '../components/landing/LokivaLandingHero';
import { ExperienceCard } from '../components/experience/ExperienceCard';
import { SplitWords } from '../components/ui/SplitWords';
import { FaqSection } from '../components/faq/FaqSection';
import { LokivaMomentsSection } from '../components/moments/LokivaMomentsSection';
import { deduplicateExperienceList } from '../lib/imageDeduplicator';
import { api } from '../lib/api';
import { Experience } from '../types';
import {
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Curated Landmark Experiences specifically requested for the landing page
const CURATED_LANDING_EXPERIENCES: Experience[] = [
  {
    id: 4000,
    title: 'Amer Fort & Sheesh Mahal (Mirror Palace)',
    tagline: '16th-century hilltop Rajput fort with artistic Hindu elements, courtyards, and mirror halls',
    category: 'Heritage & History',
    city: 'Jaipur',
    state: 'Rajasthan',
    area_name: 'Amer, Jaipur',
    price: 100,
    rating: 4.95,
    review_count: 520,
    approx_duration_mins: 120,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/20191219_Fort_Amber%2C_Amer%2C_Jaipur_0955_9481.jpg/1280px-20191219_Fort_Amber%2C_Amer%2C_Jaipur_0955_9481.jpg',
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/20191219_Fort_Amber%2C_Amer%2C_Jaipur_0955_9481.jpg/1280px-20191219_Fort_Amber%2C_Amer%2C_Jaipur_0955_9481.jpg'],
    is_active: true,
    is_family_friendly: true,
    wheelchair_accessible: false,
    tags: ['fort', 'unesco', 'rajput', 'heritage'],
  } as Experience,
  {
    id: 1492,
    title: 'Gateway of India & Apollo Bunder',
    tagline: '26m Indo-Saracenic basalt arch monument facing the Arabian Sea harbor',
    category: 'Heritage & History',
    city: 'Mumbai',
    state: 'Maharashtra',
    area_name: 'Apollo Bunder, Colaba',
    price: 0,
    rating: 4.93,
    review_count: 480,
    approx_duration_mins: 60,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg/1280px-Mumbai_03-2016_30_Gateway_of_India.jpg',
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg/1280px-Mumbai_03-2016_30_Gateway_of_India.jpg'],
    is_active: true,
    is_family_friendly: true,
    wheelchair_accessible: true,
    tags: ['monument', 'landmark', 'sea', 'mumbai'],
  } as Experience,
  {
    id: 3932,
    title: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)',
    tagline: 'UNESCO Victorian Gothic revival railway station and architectural masterpiece',
    category: 'Heritage & History',
    city: 'Mumbai',
    state: 'Maharashtra',
    area_name: 'Fort, South Mumbai',
    price: 0,
    rating: 4.96,
    review_count: 510,
    approx_duration_mins: 60,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Chhatrapati_shivaji_terminus%2C_esterno_01.jpg/1280px-Chhatrapati_shivaji_terminus%2C_esterno_01.jpg',
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Chhatrapati_shivaji_terminus%2C_esterno_01.jpg/1280px-Chhatrapati_shivaji_terminus%2C_esterno_01.jpg'],
    is_active: true,
    is_family_friendly: true,
    wheelchair_accessible: true,
    tags: ['unesco', 'architecture', 'gothic', 'heritage'],
  } as Experience,
  {
    id: 1491,
    title: "Marine Drive (Queen's Necklace Promenade)",
    tagline: '3.6 km sweeping C-shaped seaside boulevard overlooking the Arabian Sea',
    category: 'Nature & Wildlife',
    city: 'Mumbai',
    state: 'Maharashtra',
    area_name: 'Marine Drive, Netaji Subhash Road',
    price: 0,
    rating: 4.92,
    review_count: 385,
    approx_duration_mins: 60,
    image_url: 'https://images.unsplash.com/photo-1642233803470-00129cdeba8f?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    image_urls: ['https://images.unsplash.com/photo-1642233803470-00129cdeba8f?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
    is_active: true,
    is_family_friendly: true,
    wheelchair_accessible: true,
    tags: ['promenade', 'sea', 'sunset', 'mumbai'],
  } as Experience,
  {
    id: 1495,
    title: 'Shree Siddhivinayak Ganpati Temple',
    tagline: "1801 CE gold-plated sanctum dedicated to Lord Ganesha, Mumbai's patron deity",
    category: 'Spiritual & Wellness',
    city: 'Mumbai',
    state: 'Maharashtra',
    area_name: 'Prabhadevi, Dadar',
    price: 0,
    rating: 4.94,
    review_count: 490,
    approx_duration_mins: 60,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Shree_Siddhivinayak_Temple_Mumbai.jpg/1280px-Shree_Siddhivinayak_Temple_Mumbai.jpg',
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Shree_Siddhivinayak_Temple_Mumbai.jpg/1280px-Shree_Siddhivinayak_Temple_Mumbai.jpg'],
    is_active: true,
    is_family_friendly: true,
    wheelchair_accessible: true,
    tags: ['temple', 'spiritual', 'ganesha'],
  } as Experience,
  {
    id: 773,
    title: 'Hawa Mahal (Palace of Winds)',
    tagline: 'Iconic 5-story pink honeycomb facade with 953 carved jharokhas (latticed windows)',
    category: 'Heritage & History',
    city: 'Jaipur',
    state: 'Rajasthan',
    area_name: 'Badi Choupad, Old City',
    price: 50,
    rating: 4.91,
    review_count: 460,
    approx_duration_mins: 60,
    image_url: 'https://images.unsplash.com/photo-1650530777057-3a7dbc24bf6c?q=80&w=801&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    image_urls: ['https://images.unsplash.com/photo-1650530777057-3a7dbc24bf6c?q=80&w=801&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
    is_active: true,
    is_family_friendly: true,
    wheelchair_accessible: false,
    tags: ['palace', 'jaipur', 'architecture', 'heritage'],
  } as Experience,
  {
    id: 1497,
    title: 'Kanheri Caves & Sanjay Gandhi National Park',
    tagline: '109 rock-cut Buddhist monastic caves carved into basalt hills from 1st century BCE',
    category: 'Heritage & History',
    city: 'Mumbai',
    state: 'Maharashtra',
    area_name: 'Borivali East, Mumbai',
    price: 25,
    rating: 4.86,
    review_count: 310,
    approx_duration_mins: 120,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Kanheri_Caves_prayer_hall.JPG/1280px-Kanheri_Caves_prayer_hall.JPG',
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Kanheri_Caves_prayer_hall.JPG/1280px-Kanheri_Caves_prayer_hall.JPG'],
    is_active: true,
    is_family_friendly: true,
    wheelchair_accessible: false,
    tags: ['caves', 'buddhist', 'ancient', 'monastery'],
  } as Experience,
];

export function HomePage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [experiences, setExperiences] = useState<Experience[]>(CURATED_LANDING_EXPERIENCES);
  const [selectedCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function loadInitial() {
      try {
        const list = await api.getLandingExperiences();
        if (list && list.length > 0) {
          setExperiences(list);
        }
      } catch (err) {
        console.error('Failed to load landing experiences, using curated default:', err);
      }
    }
    loadInitial();
  }, []);

  // GSAP ScrollTrigger setup for section reveals
  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set('.reveal-section, .reveal-word, .reveal-stagger-item', {
          opacity: 1,
          y: 0,
        });
        return;
      }

      const sections = gsap.utils.toArray<HTMLElement>('.reveal-section');

      sections.forEach((section) => {
        const words = section.querySelectorAll('.reveal-word');
        const staggerItems = section.querySelectorAll('.reveal-stagger-item');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            once: true,
          },
        });

        tl.fromTo(
          section,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          }
        );

        if (words.length > 0) {
          tl.fromTo(
            words,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.04,
              ease: 'power2.out',
            },
            '-=0.45'
          );
        }

        if (staggerItems.length > 0) {
          tl.fromTo(
            staggerItems,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: 'power2.out',
            },
            '-=0.3'
          );
        }
      });
    }, containerRef);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, [isLoading, experiences, activeCategory]);

  const categories = [
    'All',
    'Heritage & History',
    'Spiritual & Wellness',
    'Nature & Wildlife',
    'Art & Craft',
  ];

  const filteredExperiences =
    activeCategory === 'All'
      ? experiences
      : experiences.filter((e) => e.category === activeCategory);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#EEF1EE] text-[#12213B] space-y-16 sm:space-y-24 pb-24 overflow-hidden">
      {/* LOKIVA HERO & 8-QUESTION CONTEXT FLOW */}
      <LokivaLandingHero />

      {/* CURATED EXPERIENCES CATALOG */}
      <section className="reveal-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-dusk">
              Curated Cultural Catalog
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              <SplitWords text="Verified Indian Cultural Experiences" />
            </h2>
            <p className="text-xs text-dusk-600">
              Each experience vetted for direct community spend, opening schedules, and step-free access.
            </p>
          </div>

          <Link
            to="/explore"
            className="text-xs font-mono font-bold text-ink hover:text-marigold flex items-center gap-1.5 underline"
          >
            <span>View All Experiences</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none [-webkit-overflow-scrolling:touch]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-dusk hover:text-ink border border-paper-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards Grid with Sibling Cascade Stagger */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-paper-300 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredExperiences.map((exp) => (
              <div key={exp.id} className="reveal-stagger-item">
                <ExperienceCard experience={exp} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOKIVA MOMENTS - IMMERSIVE VISUAL EXPERIENCE DISCOVERY */}
      <section className="reveal-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LokivaMomentsSection experiences={experiences} selectedCity={selectedCity} />
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* THE 11-SIGNAL CONTEXT ENGINE MANIFESTO */}
      <section className="reveal-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-paper-400 p-5 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-dusk">
              Algorithmic Guarantees
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              <SplitWords text="The 11 Context Signals Checked on Every Solve" />
            </h3>
            <p className="text-xs text-dusk-600 leading-relaxed">
              Every competitor ranks single items in isolation. LOKIVA evaluates all 11 signals simultaneously to guarantee your plan works in real life.
            </p>
          </div>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs font-mono">
            {[
              { label: 'Time Window', desc: 'Exact hours before flight or dinner' },
              { label: 'Real Travel Time', desc: 'Isochrones with local auto traffic' },
              { label: 'Hard Budget Ceiling', desc: 'Not a sort filter, a strict ceiling' },
              { label: 'Hard Accessibility', desc: 'Wheelchair and sensory pre-filtered' },
              { label: 'Live Opening Hours', desc: 'Vetted slot fits inside your gap' },
              { label: 'Group Consensus', desc: 'Kids and elderly joint happiness' },
              { label: 'Explainability', desc: 'Honest "why this fits" sentence' },
              { label: 'Instant Re-Planning', desc: 'Rain and delay live adaptation' },
            ].map((sig, idx) => (
              <div
                key={idx}
                className="reveal-stagger-item p-4 bg-paper-100 rounded-2xl border border-paper-300 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-ink font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                  <span>{sig.label}</span>
                </div>
                <p className="text-[11px] text-dusk leading-snug font-sans">{sig.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
