import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  DollarSign,
  Clock,
  Users,
  MapPin,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Video,
  ShieldCheck,
  Sun,
  Sunset,
  CloudRain,
  Compass,
  Edit3,
  Calendar,
  Layers,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderExperience, ExperienceAiExtractionResult } from '../../../types/providerWorkspace';

const CATEGORIES = [
  'Heritage & Architecture Walk',
  'Regional Culinary Tasting',
  'Art & Craft Workshop',
  'Folk Music & Performing Arts',
  'Sacred Temple & Ghat Trail',
  'Boutique Stay & Farm Immersion',
  'Nature & Local Excursion',
];

const CURATED_INTERESTS = [
  'Heritage & Architecture',
  'Culinary & Food Walks',
  'Artisan & Handloom Crafts',
  'Spiritual & Temple Rituals',
  'Photography & Visual Arts',
  'Folk Traditions & Music',
  'Nature & Biodiversity',
  'Textiles & Weaving',
  'Village & Rural Immersion',
  'Colonial & Maritime History',
  'Ayurveda & Wellness',
  'Local Markets & Bazaars',
];

const SUGGESTED_COVERS = [
  { label: 'Heritage Walk', url: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Culinary Masterclass', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Artisan Workshop', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ghat & Temple Trail', url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80' },
];

const DURATION_PRESETS = [
  { label: '45 mins', mins: 45 },
  { label: '60 mins (1 hr)', mins: 60 },
  { label: '90 mins (1.5 hrs)', mins: 90 },
  { label: '120 mins (2 hrs)', mins: 120 },
  { label: '180 mins (3 hrs)', mins: 180 },
  { label: '240 mins (Half Day)', mins: 240 },
  { label: '420 mins (Full Day)', mins: 420 },
];

const POPULAR_LOCATIONS = [
  { city: 'Mumbai', state: 'Maharashtra', area: 'Bandra West' },
  { city: 'Delhi', state: 'Delhi NCR', area: 'Chandni Chowk' },
  { city: 'Udaipur', state: 'Rajasthan', area: 'Old City Ghats' },
  { city: 'Varanasi', state: 'Uttar Pradesh', area: 'Assi Ghat' },
  { city: 'Jaipur', state: 'Rajasthan', area: 'Pink City Bazaars' },
  { city: 'Kochi', state: 'Kerala', area: 'Fort Kochi' },
  { city: 'Goa', state: 'Goa', area: 'Fontainhas Quarter' },
  { city: 'Munnar', state: 'Kerala', area: 'Tea Plantation Trails' },
];

const PRICE_PRESETS = [350, 500, 800, 1200, 1800, 2500];

export function AddExperienceWizard() {
  const {
    isAddExperienceModalOpen,
    setAddExperienceModalOpen,
    editingExperience,
    setEditingExperience,
    createExperience,
    updateExperience,
    extractAiAttributes,
  } = useProviderWorkspaceStore();

  // Wizard Sub-Page (1: Story & Location, 2: Logistics, Schedule & AI Review)
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [aiExtractedBanner, setAiExtractedBanner] = useState(false);

  // -------------------------------------------------------------
  // LAYER 1: REQUIRED FIELDS (Small Provider Workload)
  // -------------------------------------------------------------
  // Part A: Identity, Story & Location
  const [experienceType, setExperienceType] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [areaName, setAreaName] = useState('Bandra West');

  // Part B: Logistics, Schedule & Photos (After divider)
  const [price, setPrice] = useState(600);
  const [durationMins, setDurationMins] = useState(90);
  const [operatingDays, setOperatingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [timeSlots, setTimeSlots] = useState<string[]>(['09:30 AM', '04:00 PM']);
  const [newSlotInput, setNewSlotInput] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(SUGGESTED_COVERS[0].url);

  // -------------------------------------------------------------
  // LAYER 2: AI-ASSISTED ATTRIBUTES (Extracted & Reviewable)
  // -------------------------------------------------------------
  const [interests, setInterests] = useState<string[]>(['Heritage & Architecture', 'Culinary & Food Walks']);
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [suitableTravelerTypes, setSuitableTravelerTypes] = useState<string[]>([
    'Solo Explorer',
    'Culture Seekers',
    'Couples & Duos',
  ]);
  const [subcategory, setSubcategory] = useState('Curated Historic Quarter & Narrative Walk');
  const [isFamilyFriendly, setIsFamilyFriendly] = useState(true);
  const [familySuitabilityReason, setFamilySuitabilityReason] = useState(
    'Safe pedestrian route, respectful pace and engaging narrative for all ages.'
  );
  const [characteristics, setCharacteristics] = useState({
    pace: 'Leisurely',
    setting: 'Mixed',
    rain_safe: true,
    intensity: 'Easy / Relaxed',
  });
  const [searchKeywords, setSearchKeywords] = useState<string[]>([
    'heritage walk',
    'authentic local story',
    'verified guide',
    'cultural immersion',
  ]);
  const [accessibility, setAccessibility] = useState({
    wheelchair_accessible: false,
    step_free: false,
    audio_guide: false,
    low_walking: true,
    inference_rationale: 'Safety-first: Kept off by default unless verified by provider.',
  });
  const [groupType, setGroupType] = useState<'solo_friendly' | 'couple' | 'family' | 'small_group' | 'corporate_private'>('small_group');
  const [bestTimeOfDay, setBestTimeOfDay] = useState('morning');

  // Editing state for AI-assisted review card
  const [isAiReviewExpanded, setIsAiReviewExpanded] = useState(true);

  // -------------------------------------------------------------
  // LAYER 3: ADD MORE (Optional, Collapsed by default)
  // -------------------------------------------------------------
  const [isAddMoreExpanded, setIsAddMoreExpanded] = useState(false);
  const [inclusions, setInclusions] = useState<string[]>([
    'Licensed local storyteller & cultural specialist',
    'Curated tasting sampler & traditional chai',
  ]);
  const [newInclusion, setNewInclusion] = useState('');
  const [exclusions, setExclusions] = useState<string[]>([
    'Personal hotel pickup / taxi fare',
    'Retail shopping and souvenir purchases',
  ]);
  const [newExclusion, setNewExclusion] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('All ages welcome');
  const [meetingPoint, setMeetingPoint] = useState('Main landmark gate / reception (GPS coordinates shared on booking)');
  const [cancellationPolicy, setCancellationPolicy] = useState('Flexible: Free cancellation up to 24h before');
  const [advanceBooking, setAdvanceBooking] = useState('Same day bookings allowed up to 2 hours before');
  const [specialInstructions, setSpecialInstructions] = useState('Wear comfortable walking shoes and carry drinking water.');
  const [minGroupSize, setMinGroupSize] = useState(1);
  const [maxCapacity, setMaxCapacity] = useState(8);
  const [videoUrl, setVideoUrl] = useState('');

  // Debounce ref for description auto-extraction
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize form when opening / editing
  useEffect(() => {
    if (editingExperience) {
      setTitle(editingExperience.title || '');
      setExperienceType(editingExperience.category || CATEGORIES[0]);
      setDescription(editingExperience.description || '');
      setCity(editingExperience.city || 'Mumbai');
      setState(editingExperience.state || 'Maharashtra');
      setAreaName(editingExperience.area_name || '');
      setPrice(editingExperience.price || 600);
      setDurationMins(editingExperience.approx_duration_mins || 90);
      setCoverImageUrl(editingExperience.image_urls?.[0] || editingExperience.image_url || SUGGESTED_COVERS[0].url);
      setOperatingDays(editingExperience.operating_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      setTimeSlots(editingExperience.available_slots || ['09:30 AM', '04:00 PM']);
      setInterests(editingExperience.interests || ['Heritage & Architecture']);
      setIsFamilyFriendly(editingExperience.is_family_friendly ?? true);
      setGroupType(editingExperience.group_type || 'small_group');
      setBestTimeOfDay(editingExperience.best_time_of_day || 'morning');
      setAccessibility({
        wheelchair_accessible: Boolean(editingExperience.wheelchair_accessible),
        step_free: Boolean(editingExperience.step_free),
        audio_guide: Boolean(editingExperience.audio_guide),
        low_walking: Boolean(editingExperience.low_walking),
        inference_rationale: 'Saved provider settings.',
      });
      setInclusions(editingExperience.inclusions || []);
      setExclusions(editingExperience.exclusions || []);
      setMeetingPoint(editingExperience.meeting_point || '');
      setVideoUrl(editingExperience.video_url || '');
      setMinGroupSize(editingExperience.min_group_size || 1);
      setMaxCapacity(editingExperience.max_capacity || 8);
      setCurrentPage(1);
    } else {
      // Defaults for brand new experience
      setTitle('');
      setDescription('');
      setCurrentPage(1);
      setAiExtractedBanner(false);
    }
  }, [editingExperience, isAddExperienceModalOpen]);

  // AI Extraction Handler
  const handleTriggerAiExtraction = async (descToUse?: string) => {
    const textToAnalyze = descToUse || description;
    if (!textToAnalyze || textToAnalyze.trim().length < 15) return;

    setIsExtractingAi(true);
    try {
      const extracted: ExperienceAiExtractionResult | null = await extractAiAttributes({
        description: textToAnalyze,
        title,
        experience_type: experienceType,
        location: `${areaName}, ${city}`,
        price,
        duration_mins: durationMins,
      });

      if (extracted) {
        if (extracted.category && CATEGORIES.includes(extracted.category)) {
          setExperienceType(extracted.category);
        }
        if (extracted.subcategory) setSubcategory(extracted.subcategory);
        if (extracted.interests && extracted.interests.length > 0) {
          setInterests(extracted.interests);
        }
        if (extracted.suitable_traveler_types && extracted.suitable_traveler_types.length > 0) {
          setSuitableTravelerTypes(extracted.suitable_traveler_types);
        }
        if (typeof extracted.is_family_friendly === 'boolean') {
          setIsFamilyFriendly(extracted.is_family_friendly);
        }
        if (extracted.family_suitability_reason) {
          setFamilySuitabilityReason(extracted.family_suitability_reason);
        }
        if (extracted.characteristics) {
          setCharacteristics((prev) => ({
            ...prev,
            ...extracted.characteristics,
          }));
        }
        if (extracted.search_keywords && extracted.search_keywords.length > 0) {
          setSearchKeywords(extracted.search_keywords);
        }
        if (extracted.accessibility) {
          setAccessibility({
            wheelchair_accessible: Boolean(extracted.accessibility.wheelchair_accessible),
            step_free: Boolean(extracted.accessibility.step_free),
            audio_guide: Boolean(extracted.accessibility.audio_guide),
            low_walking: Boolean(extracted.accessibility.low_walking),
            inference_rationale: extracted.accessibility.inference_rationale || 'Inferred safely from description.',
          });
        }
        if (extracted.group_type) setGroupType(extracted.group_type);
        if (extracted.best_time_of_day) setBestTimeOfDay(extracted.best_time_of_day);
        if (extracted.suggested_inclusions && extracted.suggested_inclusions.length > 0 && inclusions.length <= 2) {
          setInclusions(extracted.suggested_inclusions);
        }
        if (extracted.suggested_exclusions && extracted.suggested_exclusions.length > 0 && exclusions.length <= 2) {
          setExclusions(extracted.suggested_exclusions);
        }
        if (extracted.special_instructions) {
          setSpecialInstructions(extracted.special_instructions);
        }

        setAiExtractedBanner(true);
        setIsAiReviewExpanded(true);
      }
    } catch (err) {
      console.warn('AI extraction failed:', err);
    } finally {
      setIsExtractingAi(false);
    }
  };

  // Debounced auto-extract when user types a comprehensive description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (val.trim().length >= 40) {
      typingTimerRef.current = setTimeout(() => {
        handleTriggerAiExtraction(val);
      }, 1400);
    }
  };

  // Slot Management
  const handleAddSlot = () => {
    if (!newSlotInput.trim()) return;
    if (!timeSlots.includes(newSlotInput.trim())) {
      setTimeSlots([...timeSlots, newSlotInput.trim()]);
    }
    setNewSlotInput('');
  };

  const handleRemoveSlot = (slot: string) => {
    setTimeSlots(timeSlots.filter((s) => s !== slot));
  };

  // Tag Management
  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((t) => t !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleToggleTravelerType = (type: string) => {
    if (suitableTravelerTypes.includes(type)) {
      setSuitableTravelerTypes(suitableTravelerTypes.filter((t) => t !== type));
    } else {
      setSuitableTravelerTypes([...suitableTravelerTypes, type]);
    }
  };

  // Days Management
  const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const handleToggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      if (operatingDays.length > 1) {
        setOperatingDays(operatingDays.filter((d) => d !== day));
      }
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  // Final Publish Handler (Merges All 3 Layers!)
  const handleSubmitExperience = async (status: 'published' | 'draft') => {
    if (!title.trim()) {
      alert('Please enter an Experience Name.');
      setCurrentPage(1);
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description for your experience.');
      setCurrentPage(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ProviderExperience> = {
        title: title.trim(),
        tagline: title.trim(),
        category: experienceType,
        description: description.trim(),
        city,
        state,
        area_name: areaName || 'Central Hub',
        meeting_point: meetingPoint || `${areaName}, ${city}`,
        price: Number(price) || 500,
        currency: 'INR',
        approx_duration_mins: Number(durationMins) || 90,
        min_group_size: Number(minGroupSize) || 1,
        max_group_size: Number(maxCapacity) || 8,
        max_capacity: Number(maxCapacity) || 8,
        group_type: groupType,
        best_time_of_day: bestTimeOfDay,
        opening_hours: `${timeSlots[0] || '09:00 AM'} - ${timeSlots[timeSlots.length - 1] || '06:00 PM'}`,
        operating_days: operatingDays,
        available_slots: timeSlots,
        image_urls: [coverImageUrl],
        video_url: videoUrl || undefined,
        tags: searchKeywords,
        interests,
        inclusions,
        exclusions,
        cancellation_policy: cancellationPolicy,
        advance_booking: advanceBooking,
        age_restriction: ageRestriction,
        special_instructions: specialInstructions,
        is_family_friendly: isFamilyFriendly,
        is_rain_safe: characteristics.rain_safe,
        wheelchair_accessible: accessibility.wheelchair_accessible,
        step_free: accessibility.step_free,
        audio_guide: accessibility.audio_guide,
        low_walking: accessibility.low_walking,
        status,
        is_active: status === 'published',
      };

      let success = false;
      if (editingExperience?.id) {
        success = await updateExperience(editingExperience.id, payload);
      } else {
        success = await createExperience(payload);
      }

      if (success) {
        setAddExperienceModalOpen(false);
        setEditingExperience(null);
      } else {
        alert('There was an issue saving your experience. Please check required fields.');
      }
    } catch (err) {
      console.error('Failed to submit experience:', err);
      alert('Network error while saving. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddExperienceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#12213B]/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* MODAL DIALOG - WARM CREAM / PAPER THEME */}
      <div className="bg-[#FAF7F2] border border-[#E5DFD5] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-[#12213B] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-[#E5DFD5] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF4ED] border border-[#C85A32]/20 flex items-center justify-center text-[#C85A32] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-heading font-bold text-[#12213B]">
                  {editingExperience ? 'Edit Experience' : 'Create New Experience'}
                </h2>
                <span className="text-[11px] font-heading font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ⚡ 3-Layer Smart Form
                </span>
              </div>
              <p className="text-xs text-[#556275] mt-0.5">
                Enter your core details — Lokiva AI builds tourist recommendation tags and parameters for you.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setAddExperienceModalOpen(false);
              setEditingExperience(null);
            }}
            className="p-2 rounded-xl text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP / DIVIDER PROGRESS BAR */}
        <div className="bg-[#FAF4ED] px-6 py-3 border-b border-[#E5DFD5] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              className={`px-3.5 py-1.5 rounded-xl font-heading font-bold transition flex items-center space-x-1.5 ${
                currentPage === 1
                  ? 'bg-[#12213B] text-white shadow-xs'
                  : 'bg-white text-[#556275] border border-[#E5DFD5] hover:bg-white'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentPage === 1 ? 'bg-white/20 text-white' : 'bg-[#FAF4ED] text-[#12213B]'}`}>
                1
              </span>
              <span>Story & Location</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#8A95A5]" />
            <button
              onClick={() => {
                if (!title || !description) {
                  alert('Please enter an experience name and short description first.');
                  return;
                }
                setCurrentPage(2);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-heading font-bold transition flex items-center space-x-1.5 ${
                currentPage === 2
                  ? 'bg-[#12213B] text-white shadow-xs'
                  : 'bg-white text-[#556275] border border-[#E5DFD5] hover:bg-white'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentPage === 2 ? 'bg-white/20 text-white' : 'bg-[#FAF4ED] text-[#12213B]'}`}>
                2
              </span>
              <span>Pricing, Schedule & AI Review</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-emerald-800 text-[11px] font-heading font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Autocomplete Active</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* =========================================================
              PAGE 1: CORE STORY & LOCATION (REQUIRED PART A)
             ========================================================= */}
          {currentPage === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#FAF4ED] border border-[#C85A32]/20 rounded-2xl p-4 flex items-start space-x-3.5">
                <Info className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
                <div className="text-xs text-[#12213B]/90 leading-relaxed">
                  <span className="font-heading font-bold text-[#C85A32]">Quick 60-Second Setup:</span> Enter your title,
                  what you offer, and where. Our AI will analyze your description in the background to automatically
                  build tags, traveler matchings, and departure schedules.
                </div>
              </div>

              {/* 1. EXPERIENCE TYPE */}
              <div className="bg-white border border-[#E5DFD5] rounded-2xl p-5 shadow-xs">
                <label className="block text-xs font-heading font-bold text-[#556275] uppercase tracking-wider mb-3">
                  Experience Type <span className="text-[#C85A32]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExperienceType(cat)}
                      className={`text-left p-3.5 rounded-xl border text-xs font-heading font-bold transition flex items-center justify-between ${
                        experienceType === cat
                          ? 'border-[#C85A32] bg-[#FAF4ED] text-[#C85A32] ring-1 ring-[#C85A32]/30 shadow-xs'
                          : 'border-[#E5DFD5] bg-white text-[#12213B] hover:bg-[#FAF7F2] hover:border-[#C85A32]/40'
                      }`}
                    >
                      <span>{cat}</span>
                      {experienceType === cat && <Check className="w-4 h-4 text-[#C85A32] shrink-0 ml-1.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. EXPERIENCE NAME */}
              <div className="bg-white border border-[#E5DFD5] rounded-2xl p-5 shadow-xs">
                <label className="block text-xs font-heading font-bold text-[#556275] uppercase tracking-wider mb-2">
                  Experience Name <span className="text-[#C85A32]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Old Delhi Morning Spice & Jalebi Food Trail"
                  className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-4 py-3 text-sm text-[#12213B] placeholder-[#8A95A5] focus:bg-white focus:outline-hidden focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
                />
              </div>

              {/* 3. DESCRIBE YOUR EXPERIENCE (LARGE TEXT BOX WITH AI EXTRACTION) */}
              <div className="bg-white border border-[#E5DFD5] rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-heading font-bold text-[#556275] uppercase tracking-wider">
                    Describe your experience <span className="text-[#C85A32]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTriggerAiExtraction()}
                    disabled={isExtractingAi || !description.trim()}
                    className="text-[11px] font-heading font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition flex items-center space-x-1.5 disabled:opacity-40"
                  >
                    {isExtractingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Extract with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={description}
                  onChange={handleDescriptionChange}
                  onBlur={() => handleTriggerAiExtraction()}
                  placeholder="Tell travelers what happens, what they will touch, taste, hear, and learn in everyday words. (e.g. 'We meet at 8 AM at Chandni Chowk metro gate 1. We walk through 5 generational food stalls tasting bedmi poori, rabri jalebi, and spiced chai. Suitable for solo travelers and families. The entire walk is flat with no stairs.')"
                  className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl p-4 text-sm text-[#12213B] placeholder-[#8A95A5] focus:bg-white focus:outline-hidden focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32] leading-relaxed resize-none"
                />

                {/* AI Extraction Live Banner */}
                {isExtractingAi && (
                  <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center space-x-2 text-xs text-purple-900 animate-pulse">
                    <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>Analyzing cultural context, interest tags, and suitability from your description...</span>
                  </div>
                )}
                {aiExtractedBanner && !isExtractingAi && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        <strong>AI Extracted 8 Engine Attributes</strong> (Interests, traveler match, accessibility defaults).
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 underline cursor-pointer" onClick={() => setCurrentPage(2)}>
                      Review in Step 2 →
                    </span>
                  </div>
                )}
              </div>

              {/* 4. LOCATION (MAP / ADDRESS) */}
              <div className="bg-white border border-[#E5DFD5] rounded-2xl p-5 shadow-xs">
                <label className="block text-xs font-heading font-bold text-[#556275] uppercase tracking-wider mb-2">
                  Location <span className="text-[#C85A32]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#556275] block mb-1">City</span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:bg-white focus:outline-hidden focus:border-[#C85A32]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#556275] block mb-1">State / UT</span>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:bg-white focus:outline-hidden focus:border-[#C85A32]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#556275] block mb-1">Neighborhood / Landmark</span>
                    <input
                      type="text"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      placeholder="e.g. Bandra West"
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:bg-white focus:outline-hidden focus:border-[#C85A32]"
                    />
                  </div>
                </div>

                {/* Quick Popular City Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[#556275] mr-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#C85A32]" /> Quick Pick:
                  </span>
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc.city + loc.area}
                      type="button"
                      onClick={() => {
                        setCity(loc.city);
                        setState(loc.state);
                        setAreaName(loc.area);
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#FAF4ED] text-[#556275] hover:text-[#C85A32] border border-[#E5DFD5] transition"
                    >
                      {loc.city} ({loc.area})
                    </button>
                  ))}
                </div>
              </div>

              {/* DIVIDER TO STEP 2 */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim()) {
                      alert('Please provide an Experience Name before continuing.');
                      return;
                    }
                    if (!description.trim()) {
                      alert('Please provide a description so the AI can build your engine attributes.');
                      return;
                    }
                    setCurrentPage(2);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#C85A32] hover:bg-[#B34D28] text-white font-heading font-bold text-xs sm:text-sm transition shadow-xs flex items-center space-x-2"
                >
                  <span>Continue to Pricing, Schedule & Photos</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              PAGE 2: LOGISTICS, SCHEDULE, PHOTOS, AI REVIEW & ADD MORE
             ========================================================= */}
          {currentPage === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* SECTION 1: REQUIRED LOGISTICS (PRICE, DURATION, AVAILABILITY, PHOTOS) */}
              <div className="bg-white border border-[#E5DFD5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-[#FAF4ED] text-[#C85A32] flex items-center justify-center text-xs font-bold font-heading">
                      1
                    </div>
                    <h3 className="text-sm font-heading font-bold text-[#12213B]">Required Logistics & Schedule</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#556275]">Step 2 of 2</span>
                </div>

                {/* PRICE & DURATION GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-heading font-bold text-[#556275] mb-2">
                      Price per guest (₹ INR) <span className="text-[#C85A32]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#556275] font-bold">₹</span>
                      <input
                        type="number"
                        min={100}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl pl-8 pr-4 py-2.5 text-sm text-[#12213B] font-bold focus:bg-white focus:outline-hidden focus:border-[#C85A32]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {PRICE_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPrice(p)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition ${
                            price === p
                              ? 'bg-[#C85A32] text-white border-[#C85A32]'
                              : 'bg-[#FAF7F2] text-[#556275] border-[#E5DFD5] hover:bg-white'
                          }`}
                        >
                          ₹{p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-heading font-bold text-[#556275] mb-2">
                      Experience Duration <span className="text-[#C85A32]">*</span>
                    </label>
                    <select
                      value={durationMins}
                      onChange={(e) => setDurationMins(Number(e.target.value))}
                      className="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-4 py-2.5 text-sm text-[#12213B] font-semibold focus:bg-white focus:outline-hidden focus:border-[#C85A32]"
                    >
                      {DURATION_PRESETS.map((d) => (
                        <option key={d.mins} value={d.mins}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#556275] mt-1.5">
                      Recommendation engine paces itineraries based on duration.
                    </p>
                  </div>
                </div>

                {/* AVAILABILITY: DAYS & TIME SLOTS */}
                <div className="border-t border-[#E5DFD5] pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-heading font-bold text-[#556275]">
                      Operating Days & Departures <span className="text-[#C85A32]">*</span>
                    </label>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setOperatingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
                        className="text-[#556275] hover:text-[#12213B] underline font-semibold"
                      >
                        All 7 Days
                      </button>
                      <span className="text-[#8A95A5]">·</span>
                      <button
                        type="button"
                        onClick={() => setOperatingDays(['Fri', 'Sat', 'Sun'])}
                        className="text-[#556275] hover:text-[#12213B] underline font-semibold"
                      >
                        Weekends
                      </button>
                    </div>
                  </div>

                  {/* Days Chips */}
                  <div className="flex flex-wrap gap-2">
                    {DAYS_LIST.map((day) => {
                      const active = operatingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`w-11 h-9 rounded-xl text-xs font-heading font-bold transition flex items-center justify-center ${
                            active
                              ? 'bg-[#12213B] text-white shadow-xs'
                              : 'bg-[#FAF7F2] text-[#556275] border border-[#E5DFD5] hover:bg-white'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-[#556275] block mb-1.5">Daily Departure Slots:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {timeSlots.map((slot) => (
                        <span
                          key={slot}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FAF4ED] border border-[#E5DFD5] text-xs font-semibold text-[#12213B]"
                        >
                          <Clock className="w-3 h-3 text-[#C85A32]" />
                          <span>{slot}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot)}
                            className="text-[#8A95A5] hover:text-rose-600 ml-1 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Add Slot Input */}
                      <div className="inline-flex items-center space-x-1">
                        <input
                          type="text"
                          value={newSlotInput}
                          onChange={(e) => setNewSlotInput(e.target.value)}
                          placeholder="e.g. 11:00 AM"
                          className="w-24 bg-[#FAF7F2] border border-[#E5DFD5] rounded-lg px-2 py-1 text-xs text-[#12213B] focus:bg-white focus:outline-hidden focus:border-[#C85A32]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSlot();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddSlot}
                          className="p-1 rounded-lg bg-[#FAF4ED] border border-[#E5DFD5] hover:bg-white text-[#12213B]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PHOTOS */}
                <div className="border-t border-[#E5DFD5] pt-4 space-y-3">
                  <label className="block text-xs font-heading font-bold text-[#556275]">
                    Photos & Visual Assets <span className="text-[#C85A32]">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="Paste image URL (Unsplash, Pexels or CDN)"
                      className="flex-1 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:bg-white focus:outline-hidden focus:border-[#C85A32]"
                    />
                  </div>

                  {/* Thumbnail Presets */}
                  <div>
                    <span className="text-[11px] font-semibold text-[#556275] block mb-1.5">Or tap a verified cultural photo preset:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SUGGESTED_COVERS.map((cov) => (
                        <div
                          key={cov.url}
                          onClick={() => setCoverImageUrl(cov.url)}
                          className={`group cursor-pointer relative rounded-xl overflow-hidden border transition ${
                            coverImageUrl === cov.url
                              ? 'border-[#C85A32] ring-2 ring-[#C85A32]/40'
                              : 'border-[#E5DFD5] opacity-80 hover:opacity-100 hover:border-[#C85A32]/60'
                          }`}
                        >
                          <img src={cov.url} alt={cov.label} className="w-full h-16 object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-1.5">
                            <span className="text-[10px] font-medium text-white truncate">{cov.label}</span>
                          </div>
                          {coverImageUrl === cov.url && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C85A32] flex items-center justify-center text-white text-[9px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================================================
                  LAYER 2: AI-ASSISTED ATTRIBUTES (AUTOMATICALLY GENERATED)
                 ========================================================= */}
              <div className="bg-gradient-to-br from-[#FAF5FF] via-white to-[#F0FDF4] border border-purple-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 border border-purple-200 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-bold text-[#12213B] flex items-center space-x-2">
                        <span>We generated these details from your description</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                          AI Assisted
                        </span>
                      </h3>
                      <p className="text-xs text-[#556275] mt-0.5">
                        Review before publishing. The traveler recommendation engine uses these to match itineraries.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAiReviewExpanded(!isAiReviewExpanded)}
                    className="p-1.5 rounded-lg text-[#556275] hover:text-[#12213B] hover:bg-white transition"
                  >
                    {isAiReviewExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isAiReviewExpanded && (
                  <div className="space-y-4 pt-2 border-t border-purple-100 text-xs">
                    {/* 1. Interests / Tags */}
                    <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-[#12213B]">1. Interests & Activity Tags</span>
                        <span className="text-[10px] text-[#556275]">Matched to tourist taste profiles</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-semibold"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleInterest(tag)}
                              className="text-purple-600 hover:text-purple-900 ml-1 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Quick Add Curated Interest */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] font-semibold text-[#556275] mr-1">+ Suggested:</span>
                        {CURATED_INTERESTS.filter((i) => !interests.includes(i))
                          .slice(0, 5)
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleInterest(tag)}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#FAF7F2] hover:bg-purple-50 text-[#556275] hover:text-purple-900 border border-[#E5DFD5]"
                            >
                              + {tag}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* 2. Suitable Traveler Types & Family Suitability */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-2xs space-y-2">
                        <span className="font-heading font-bold text-[#12213B] block">2. Suitable Traveler Cohorts</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Solo Explorer', 'Couples & Duos', 'Small Group', 'Family with Kids', 'Culture Seekers'].map(
                            (type) => {
                              const active = suitableTravelerTypes.includes(type);
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => handleToggleTravelerType(type)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-heading font-bold ${
                                    active
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                                      : 'bg-[#FAF7F2] text-[#556275] border-[#E5DFD5] hover:bg-white'
                                  }`}
                                >
                                  {active ? '✓ ' : '+ '}
                                  {type}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Family & Child Suitability */}
                      <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-[#12213B]">Family & Child Suitability</span>
                          <button
                            type="button"
                            onClick={() => setIsFamilyFriendly(!isFamilyFriendly)}
                            className={`w-9 h-5 rounded-full transition-colors relative ${
                              isFamilyFriendly ? 'bg-emerald-600' : 'bg-stone-300'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                                isFamilyFriendly ? 'left-4' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#556275] leading-snug">{familySuitabilityReason}</p>
                      </div>
                    </div>

                    {/* 3. Characteristics & Search Keywords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-2xs space-y-2">
                        <span className="font-heading font-bold text-[#12213B] block">3. Experience Characteristics</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                            <span className="text-[#556275] block text-[10px]">Pace:</span>
                            <span className="font-heading font-bold text-[#12213B]">{characteristics.pace}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                            <span className="text-[#556275] block text-[10px]">Setting:</span>
                            <span className="font-heading font-bold text-[#12213B]">{characteristics.setting}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                            <span className="text-[#556275] block text-[10px]">Weather:</span>
                            <span className="font-heading font-bold text-emerald-800">
                              {characteristics.rain_safe ? '☔ Rain-Safe' : '☀️ Open Air'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                            <span className="text-[#556275] block text-[10px]">Intensity:</span>
                            <span className="font-heading font-bold text-[#12213B]">{characteristics.intensity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Search Keywords */}
                      <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-2xs space-y-2">
                        <span className="font-heading font-bold text-[#12213B] block">4. Search Discovery Keywords</span>
                        <div className="flex flex-wrap gap-1">
                          {searchKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#556275] border border-[#E5DFD5]"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#556275]">Auto-indexed for traveler search query matching.</p>
                      </div>
                    </div>

                    {/* 4. Accessibility (Safety-First Inferred) */}
                    <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-[#12213B]">5. Accessibility Facilities (Safety-First)</span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Review carefully for traveler safety
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <label className="flex items-center space-x-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5] cursor-pointer hover:bg-white">
                          <input
                            type="checkbox"
                            checked={accessibility.wheelchair_accessible}
                            onChange={(e) =>
                              setAccessibility({ ...accessibility, wheelchair_accessible: e.target.checked })
                            }
                            className="rounded border-[#E5DFD5] text-[#C85A32] focus:ring-0"
                          />
                          <span className="text-[11px] font-semibold text-[#12213B]">♿ Wheelchair</span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5] cursor-pointer hover:bg-white">
                          <input
                            type="checkbox"
                            checked={accessibility.step_free}
                            onChange={(e) => setAccessibility({ ...accessibility, step_free: e.target.checked })}
                            className="rounded border-[#E5DFD5] text-[#C85A32] focus:ring-0"
                          />
                          <span className="text-[11px] font-semibold text-[#12213B]">🪜 Step-Free</span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5] cursor-pointer hover:bg-white">
                          <input
                            type="checkbox"
                            checked={accessibility.low_walking}
                            onChange={(e) => setAccessibility({ ...accessibility, low_walking: e.target.checked })}
                            className="rounded border-[#E5DFD5] text-[#C85A32] focus:ring-0"
                          />
                          <span className="text-[11px] font-semibold text-[#12213B]">🚶 Low Walking</span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5] cursor-pointer hover:bg-white">
                          <input
                            type="checkbox"
                            checked={accessibility.audio_guide}
                            onChange={(e) => setAccessibility({ ...accessibility, audio_guide: e.target.checked })}
                            className="rounded border-[#E5DFD5] text-[#C85A32] focus:ring-0"
                          />
                          <span className="text-[11px] font-semibold text-[#12213B]">🎧 Audio Guide</span>
                        </label>
                      </div>
                      <p className="text-[10px] text-[#556275] italic">
                        Note: {accessibility.inference_rationale}
                      </p>
                    </div>

                    <div className="flex justify-end pt-1">
                      <span className="text-[11px] text-emerald-800 flex items-center space-x-1 font-heading font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>All AI parameters approved & ready</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================
                  LAYER 3: ADD MORE (OPTIONAL — COLLAPSED BY DEFAULT)
                 ========================================================= */}
              <div className="border border-[#E5DFD5] rounded-2xl overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsAddMoreExpanded(!isAddMoreExpanded)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF7F2] transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FAF4ED] text-[#C85A32] flex items-center justify-center font-bold">
                      {isAddMoreExpanded ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-heading font-bold text-[#12213B]">Add more details</h4>
                      <p className="text-[11px] text-[#556275]">
                        Inclusions, meeting point, cancellation policy, special instructions (Optional)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#C85A32] font-heading font-bold">
                    {isAddMoreExpanded ? 'Collapse' : '+ Expand'}
                  </span>
                </button>

                {isAddMoreExpanded && (
                  <div className="p-5 sm:p-6 border-t border-[#E5DFD5] space-y-5 text-xs bg-[#FAF7F2]/50 animate-in fade-in duration-150">
                    {/* Inclusions & Exclusions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Inclusions */}
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1.5">What's Included:</span>
                        <div className="space-y-1.5">
                          {inclusions.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5DFD5]">
                              <span className="text-[#12213B] text-[11px]">✓ {item}</span>
                              <button
                                type="button"
                                onClick={() => setInclusions(inclusions.filter((_, i) => i !== idx))}
                                className="text-[#8A95A5] hover:text-rose-600 ml-2 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center space-x-1.5 pt-1">
                            <input
                              type="text"
                              value={newInclusion}
                              onChange={(e) => setNewInclusion(e.target.value)}
                              placeholder="+ Add inclusion item"
                              className="flex-1 bg-white border border-[#E5DFD5] rounded-lg px-2.5 py-1.5 text-xs text-[#12213B] focus:outline-hidden focus:border-[#C85A32]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newInclusion.trim()) {
                                    setInclusions([...inclusions, newInclusion.trim()]);
                                    setNewInclusion('');
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newInclusion.trim()) {
                                  setInclusions([...inclusions, newInclusion.trim()]);
                                  setNewInclusion('');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FAF4ED] border border-[#E5DFD5] text-[#12213B] font-bold"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Exclusions */}
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1.5">What's Excluded:</span>
                        <div className="space-y-1.5">
                          {exclusions.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5DFD5]">
                              <span className="text-[#556275] text-[11px]">✕ {item}</span>
                              <button
                                type="button"
                                onClick={() => setExclusions(exclusions.filter((_, i) => i !== idx))}
                                className="text-[#8A95A5] hover:text-rose-600 ml-2 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center space-x-1.5 pt-1">
                            <input
                              type="text"
                              value={newExclusion}
                              onChange={(e) => setNewExclusion(e.target.value)}
                              placeholder="+ Add exclusion item"
                              className="flex-1 bg-white border border-[#E5DFD5] rounded-lg px-2.5 py-1.5 text-xs text-[#12213B] focus:outline-hidden focus:border-[#C85A32]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newExclusion.trim()) {
                                    setExclusions([...exclusions, newExclusion.trim()]);
                                    setNewExclusion('');
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newExclusion.trim()) {
                                  setExclusions([...exclusions, newExclusion.trim()]);
                                  setNewExclusion('');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FAF4ED] border border-[#E5DFD5] text-[#12213B] font-bold"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meeting Point & Cancellation Policy */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5DFD5]">
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1">Exact Meeting Point:</span>
                        <input
                          type="text"
                          value={meetingPoint}
                          onChange={(e) => setMeetingPoint(e.target.value)}
                          placeholder="e.g. In front of gate 2, Churchgate Station"
                          className="w-full bg-white border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:outline-hidden focus:border-[#C85A32]"
                        />
                      </div>
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1">Cancellation Policy:</span>
                        <select
                          value={cancellationPolicy}
                          onChange={(e) => setCancellationPolicy(e.target.value)}
                          className="w-full bg-white border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B] focus:outline-hidden focus:border-[#C85A32]"
                        >
                          <option value="Flexible: Free cancellation up to 24h before">
                            Flexible: Free cancellation up to 24h before
                          </option>
                          <option value="Moderate: Free cancellation up to 3 days before">
                            Moderate: Free cancellation up to 3 days before
                          </option>
                          <option value="Strict: 50% refund up to 7 days before">
                            Strict: 50% refund up to 7 days before
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Capacity & Special Instructions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5DFD5]">
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1">Min Group Size:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={minGroupSize}
                          onChange={(e) => setMinGroupSize(Number(e.target.value))}
                          className="w-full bg-white border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B]"
                        />
                      </div>
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1">Max Capacity:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={maxCapacity}
                          onChange={(e) => setMaxCapacity(Number(e.target.value))}
                          className="w-full bg-white border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B]"
                        />
                      </div>
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1">Age Restrictions:</span>
                        <select
                          value={ageRestriction}
                          onChange={(e) => setAgeRestriction(e.target.value)}
                          className="w-full bg-white border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B]"
                        >
                          <option value="All ages welcome">All ages welcome</option>
                          <option value="Suitable for 5+ years">Suitable for 5+ years</option>
                          <option value="Suitable for 12+ years">Suitable for 12+ years</option>
                          <option value="Adults only (18+)">Adults only (18+)</option>
                        </select>
                      </div>
                    </div>

                    {/* Special Instructions & Video */}
                    <div className="pt-2 border-t border-[#E5DFD5] space-y-3">
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1">Special Guest Instructions:</span>
                        <input
                          type="text"
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          placeholder="e.g. Modest attire covering shoulders & knees for temple entry; slip-on footwear."
                          className="w-full bg-white border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B]"
                        />
                      </div>
                      <div>
                        <span className="font-heading font-bold text-[#12213B] block mb-1">Video Reel URL (Optional):</span>
                        <input
                          type="text"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="Instagram reel or YouTube shorts link for +40% higher conversion"
                          className="w-full bg-white border border-[#E5DFD5] rounded-xl px-3 py-2 text-xs text-[#12213B]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#E5DFD5] hover:bg-[#FAF7F2] text-[#556275] text-xs font-heading font-bold transition flex items-center space-x-1.5 w-full sm:w-auto justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Story</span>
                </button>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitExperience('draft')}
                    className="px-4 py-2.5 rounded-xl bg-white border border-[#E5DFD5] text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] text-xs font-heading font-bold transition disabled:opacity-40"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitExperience('published')}
                    className="px-6 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B34D28] text-white font-heading font-bold text-xs transition shadow-xs flex items-center space-x-2 disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{editingExperience ? 'Update Experience' : 'Publish Experience'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
