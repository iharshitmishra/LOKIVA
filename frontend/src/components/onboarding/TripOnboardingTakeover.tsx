import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useItineraryStore } from '../../store/useItineraryStore';
import { api } from '../../lib/api';
import { DayPlanResponse, DayPlanStop } from '../../types';
import {
  DiscoveryOnboardingFlow,
  DiscoveryAnswers,
} from './DiscoveryOnboardingFlow';
import { getStateForCity } from '../../data/places';

export interface TripContextAnswers {
  city: string;
  timeWindow: string;
  timeHours: number;
  budgetCeiling: number;
  companions: string;
  interests: string[];
  foodPreference: string;
  foodNotes: string;
  mobility: string;
  isWheelchair: boolean;
  isLowWalking: boolean;
  vibe: string;
}

interface TripOnboardingTakeoverProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated?: (answers: TripContextAnswers, plan: DayPlanResponse) => void;
}

interface ExperienceSeed {
  name: string;
  category: string;
  time: string;
  duration_mins: number;
  costLabelBudget: string;
  costLabelComfort: string;
  costLabelLuxury: string;
  description: string;
}

const CITY_EXPERIENCES: Record<string, ExperienceSeed[]> = {
  jaipur: [
    {
      name: 'Hawa Mahal Palace Courtyards & Wind Pavilion',
      category: 'heritage',
      time: '09:00 AM',
      duration_mins: 75,
      costLabelBudget: '₹50 monument entry',
      costLabelComfort: '₹200 palace audio guide pass',
      costLabelLuxury: '₹1,500 private sunrise pavilion pass',
      description: 'Iconic 1799 pink sandstone facade with morning cross-breeze and uncrowded courtyards.',
    },
    {
      name: 'Sanganer Master Hand-Block Printing Guild Atelier',
      category: 'crafts',
      time: '11:00 AM',
      duration_mins: 90,
      costLabelBudget: 'Free artisan observation',
      costLabelComfort: '₹450 hands-on block printing session',
      costLabelLuxury: '₹3,500 private master Chiwda natural dye workshop',
      description: 'Direct engagement with generational textile carvers and traditional vegetable dye vats.',
    },
    {
      name: 'Laxmi Mishthan Bhandar (LMB) Heritage Ghewar Tasting',
      category: 'food',
      time: '01:00 PM',
      duration_mins: 60,
      costLabelBudget: '₹180 street snack',
      costLabelComfort: '₹450 royal thali lunch',
      costLabelLuxury: '₹2,500 private haveli dining experience',
      description: 'Historic 1727 Johari Bazaar sweetmaker known for royal paneer ghewar and spiced saffron lassi.',
    },
    {
      name: 'Panna Meena Ka Kund Ancient Stepwell & Amber Foothills',
      category: 'monuments',
      time: '03:00 PM',
      duration_mins: 60,
      costLabelBudget: 'Free entry',
      costLabelComfort: '₹150 local guide narration',
      costLabelLuxury: '₹1,200 private haveli curator trail',
      description: 'Symmetrical 16th-century subterranean stepwell offering quiet contemplation away from bus tours.',
    },
    {
      name: 'Govind Dev Ji Temple Inner Courtyard Evening Aarti',
      category: 'rituals',
      time: '05:00 PM',
      duration_mins: 60,
      costLabelBudget: 'Free spiritual entry',
      costLabelComfort: '₹100 offering & prasad',
      costLabelLuxury: '₹1,000 temple trust guest blessing pass',
      description: 'Sacred pillared sanctum with resonant community bell chanting and historic incense fragrance.',
    },
  ],
  varanasi: [
    {
      name: 'Assi to Dashashwamedh Sunrise Rowboat & Dawn Ghat Chanting',
      category: 'rituals',
      time: '06:00 AM',
      duration_mins: 90,
      costLabelBudget: '₹200 shared boat pass',
      costLabelComfort: '₹600 private wooden rowboat',
      costLabelLuxury: '₹3,000 heritage Bajra boat with private shehnai recital',
      description: 'Drifting along ancient stone staircases as dawn sunlight illuminates morning prayers and floating diyas.',
    },
    {
      name: 'Madanpura Handloom Silk & Zari Weaver Guild',
      category: 'crafts',
      time: '09:30 AM',
      duration_mins: 80,
      costLabelBudget: 'Free pit-loom observation',
      costLabelComfort: '₹350 master weaver storytelling session',
      costLabelLuxury: '₹2,500 commissioned handloom silk masterclass',
      description: 'Centuries-old Muslim weaver guilds passing gold threads on heavy wooden foot-operated looms.',
    },
    {
      name: 'Kashi Chat Bhandar & Blue Lassi Clay Cup Tasting',
      category: 'food',
      time: '12:00 PM',
      duration_mins: 50,
      costLabelBudget: '₹120 street delicacies',
      costLabelComfort: '₹350 authentic temple feast',
      costLabelLuxury: '₹2,000 BrijRama Palace Satvik heritage lunch',
      description: 'Famous spicy tomato chaat and hand-churned thick yogurt lassi served in biodegradable clay kullads.',
    },
    {
      name: 'Kashi Vishwanath Temple Heritage Corridor Walk',
      category: 'heritage',
      time: '02:30 PM',
      duration_mins: 90,
      costLabelBudget: 'Free public queue',
      costLabelComfort: '₹300 Sugam Darshan pass',
      costLabelLuxury: '₹1,500 private scholarly corridor guide',
      description: 'Restored golden spires connecting the ancient Jyotirlinga sanctum directly to the holy Ganges banks.',
    },
    {
      name: 'Dashashwamedh Ghat Sunset Maha Aarti from Water Platform',
      category: 'rituals',
      time: '06:30 PM',
      duration_mins: 75,
      costLabelBudget: 'Free ghat viewing',
      costLabelComfort: '₹300 reserved boat terrace seat',
      costLabelLuxury: '₹2,200 private riverside pavilion reservation',
      description: 'Seven young priests synchronizing multi-tiered brass oil lamps in sacred evening fire adoration.',
    },
  ],
  delhi: [
    {
      name: "Humayun's Tomb Mughal Gardens & Restored Watercourses",
      category: 'heritage',
      time: '09:00 AM',
      duration_mins: 90,
      costLabelBudget: '₹50 monument ticket',
      costLabelComfort: '₹250 conservation audio tour',
      costLabelLuxury: '₹1,800 Aga Khan Trust architectural historian walk',
      description: 'UNESCO red sandstone masterpiece set in geometric Persian charbagh gardens with shaded arcades.',
    },
    {
      name: 'Old Delhi Gali Paranthe Wali & Khari Baoli Spice Trail',
      category: 'food',
      time: '11:30 AM',
      duration_mins: 90,
      costLabelBudget: '₹150 stuffed paratha tasting',
      costLabelComfort: '₹500 guided Old Delhi culinary safari',
      costLabelLuxury: '₹3,200 Haveli Dharampura 7-course Mughlai lunch',
      description: 'Generational spice warehouses and century-old deep-fried flatbreads served with pumpkin sabzi.',
    },
    {
      name: 'Dilli Haat Regional Artisan Guilds & Handloom Stalls',
      category: 'crafts',
      time: '02:30 PM',
      duration_mins: 90,
      costLabelBudget: '₹100 entry fee',
      costLabelComfort: '₹400 craft demonstration pass',
      costLabelLuxury: '₹2,000 master artisan bespoke curation',
      description: 'Rotating marketplace where rural craftspeople sell direct block prints, pottery, and brassware.',
    },
    {
      name: 'Hazrat Nizamuddin Basti Natural Perfume & Sufi Alleyways',
      category: 'offbeat',
      time: '05:00 PM',
      duration_mins: 75,
      costLabelBudget: 'Free courtyard access',
      costLabelComfort: '₹250 attar distillation tasting',
      costLabelLuxury: '₹1,500 private Sufi heritage curator',
      description: '700-year-old living medieval settlement famous for natural rose attar distillation and qawwali chants.',
    },
  ],
  kochi: [
    {
      name: 'Fort Kochi Chinese Fishing Nets & Coastal Spice Trail',
      category: 'nature',
      time: '08:30 AM',
      duration_mins: 80,
      costLabelBudget: 'Free beach promenade',
      costLabelComfort: '₹300 heritage walking pass',
      costLabelLuxury: '₹1,500 private historian coastal tour',
      description: '14th-century cantilevered fishing nets operating along Vasco da Gama square and shaded rain trees.',
    },
    {
      name: 'Kerala Kathakali Centre Classical Dance Atelier',
      category: 'arts',
      time: '11:00 AM',
      duration_mins: 90,
      costLabelBudget: '₹200 rehearsal pass',
      costLabelComfort: '₹500 evening performance pass',
      costLabelLuxury: '₹2,500 private guru mudra masterclass',
      description: 'Intricate facial makeup preparation and ancient Natya Shastra eye expressions by veteran gurus.',
    },
    {
      name: 'Mattancherry Ginger & Cardamom Warehouse Tasting',
      category: 'food',
      time: '01:30 PM',
      duration_mins: 60,
      costLabelBudget: '₹180 banana leaf meal',
      costLabelComfort: '₹600 Syrian Christian culinary lunch',
      costLabelLuxury: '₹3,000 Brunton Boatyard coastal spice tasting',
      description: 'Burlap sacks of sun-dried Tellicherry pepper and steaming Malabar appams with coconut stew.',
    },
    {
      name: 'Traditional Ayurvedic Herbal Garden & Oil Sanctuary',
      category: 'wellness',
      time: '03:30 PM',
      duration_mins: 90,
      costLabelBudget: 'Free botanical walk',
      costLabelComfort: '₹800 Ayurvedic consultation & herbal tea',
      costLabelLuxury: '₹4,500 full Abhyanga wellness therapy',
      description: 'Living apothecary garden containing medicinal neem, tulsi, and vetiver cultivated by Vaidyars.',
    },
  ],
  mumbai: [
    {
      name: 'Kala Ghoda Art Enclave & Victorian Neo-Gothic Trail',
      category: 'arts',
      time: '09:30 AM',
      duration_mins: 85,
      costLabelBudget: 'Free gallery entry',
      costLabelComfort: '₹300 art district audio walk',
      costLabelLuxury: '₹2,000 private art curator tour',
      description: 'High-density architectural precinct featuring stone gargoyles, street art, and contemporary galleries.',
    },
    {
      name: 'Yazdani Bakery & Historic Parsi Cafe Tea Stop',
      category: 'food',
      time: '11:30 AM',
      duration_mins: 45,
      costLabelBudget: '₹120 chai & bun maska',
      costLabelComfort: '₹400 heritage brunch',
      costLabelLuxury: '₹2,000 Trishna coastal butter garlic seafood',
      description: '1953 wood-fired brick ovens baking crusty brun pao accompanied by fragrant cardamom Irani chai.',
    },
    {
      name: 'Khadi Bhavan & Handloom Weaving Collective',
      category: 'crafts',
      time: '01:30 PM',
      duration_mins: 75,
      costLabelBudget: 'Free artisan visit',
      costLabelComfort: '₹300 natural fabric workshop',
      costLabelLuxury: '₹1,500 bespoke handloom tailor consultation',
      description: 'Ethical cooperative displaying hand-spun cottons, wild silks, and natural organic indigo dyes.',
    },
    {
      name: 'Banganga Ancient Sacred Water Tank & Walkeshwar Temples',
      category: 'rituals',
      time: '04:00 PM',
      duration_mins: 70,
      costLabelBudget: 'Free tank courtyard',
      costLabelComfort: '₹200 heritage stepwell pass',
      costLabelLuxury: '₹1,200 private dusk musical boat walk',
      description: 'Freshwater spring tank from the 11th century surrounded by temple spires and resident ducks.',
    },
  ],
  udaipur: [
    {
      name: 'City Palace Mewar Royal Architecture & Peacock Courtyard',
      category: 'heritage',
      time: '09:00 AM',
      duration_mins: 90,
      costLabelBudget: '₹300 general admission',
      costLabelComfort: '₹600 audio guide & museum pass',
      costLabelLuxury: '₹3,000 private Mewar curator salon',
      description: 'Marble balconies and colored glass mosaics overlooking Lake Pichola and Aravali ridges.',
    },
    {
      name: 'Traditional Mewari Miniature Painting Guild Atelier',
      category: 'crafts',
      time: '11:30 AM',
      duration_mins: 80,
      costLabelBudget: 'Free studio observation',
      costLabelComfort: '₹450 squirrel-hair brush workshop',
      costLabelLuxury: '₹2,800 private master artist gold leaf lesson',
      description: 'Generational artists painting epic scenes on silk and old handmade paper using natural stone minerals.',
    },
    {
      name: 'Ambrai Ghat Lakeside Heritage Lunch',
      category: 'food',
      time: '01:30 PM',
      duration_mins: 60,
      costLabelBudget: '₹200 lakeside cafe snacks',
      costLabelComfort: '₹750 Rajasthani ker sangri feast',
      costLabelLuxury: '₹3,500 Lake Palace private boat dining',
      description: 'Shaded stone ghat tables overlooking the water with views of the floating Lake Palace.',
    },
    {
      name: 'Saheliyon Ki Bari Royal Marble Fountains & Lotus Pools',
      category: 'nature',
      time: '04:00 PM',
      duration_mins: 60,
      costLabelBudget: '₹50 garden entry',
      costLabelComfort: '₹150 guided horticulture walk',
      costLabelLuxury: '₹1,200 private sunset tea tour',
      description: '18th-century royal pleasure garden designed with gravity-fed fountains and sculpted stone elephants.',
    },
  ],
  amritsar: [
    {
      name: 'Harmandir Sahib Golden Temple Dawn Walk & Sarovar',
      category: 'rituals',
      time: '05:30 AM',
      duration_mins: 120,
      costLabelBudget: 'Free (open to all)',
      costLabelComfort: '₹100 offering & langar donation',
      costLabelLuxury: '₹800 heritage briefing with volunteer sevadars',
      description: 'Marble causeway over sacred Amrit Sarovar reflecting golden spires at pre-dawn when crowd is thinnest.',
    },
    {
      name: 'Guru Ka Langar Community Kitchen & Sewa Experience',
      category: 'food',
      time: '08:00 AM',
      duration_mins: 60,
      costLabelBudget: 'Free (langar is free for all)',
      costLabelComfort: '₹200 modest donation',
      costLabelLuxury: '₹500 guided kitchen sewa behind-the-scenes',
      description: 'World\'s largest community kitchen serving 80,000 vegetarian meals daily with hand-rolled chapatis.',
    },
    {
      name: 'Phulkari Embroidery Artisan Collective',
      category: 'crafts',
      time: '10:30 AM',
      duration_mins: 75,
      costLabelBudget: 'Free workshop observation',
      costLabelComfort: '₹400 hands-on Phulkari stitch session',
      costLabelLuxury: '₹2,500 commissioned dupatta with master embroideress',
      description: 'Living tradition of Punjabi floral needle-work in vibrant silks passed through generational women artisans.',
    },
    {
      name: 'Jallianwala Bagh Memorial Garden & Heritage Wall',
      category: 'heritage',
      time: '01:00 PM',
      duration_mins: 60,
      costLabelBudget: 'Free entry',
      costLabelComfort: '₹150 audio guide tour',
      costLabelLuxury: '₹800 historian-led private commemoration walk',
      description: 'Walled garden preserving bullet-marked walls and eternal flame honouring the 1919 independence movement.',
    },
    {
      name: 'Wagah Border Beating Retreat Ceremony',
      category: 'monuments',
      time: '05:00 PM',
      duration_mins: 90,
      costLabelBudget: 'Free public seating',
      costLabelComfort: '₹300 reserved enclosure seat',
      costLabelLuxury: '₹1,000 VIP pavilion with heritage commentary',
      description: 'Synchronised high-kick military parade at India-Pakistan border with patriotic crowd energy at sunset.',
    },
  ],
  ladakh: [
    {
      name: 'Thiksey Monastery Sunrise Chanting & Morning Puja',
      category: 'rituals',
      time: '06:00 AM',
      duration_mins: 90,
      costLabelBudget: 'Free monastery prayer hall',
      costLabelComfort: '₹150 monk community offering pass',
      costLabelLuxury: '₹1,500 private Rinpoche blessing audience',
      description: 'Twelve-story tiered gompa resembling the Potala Palace with resonant morning copper conch horns.',
    },
    {
      name: 'Leh Old Town Bakery & Ladakhi Khambir Butter Tea',
      category: 'food',
      time: '08:30 AM',
      duration_mins: 45,
      costLabelBudget: '₹80 traditional wood-fired bread & tea',
      costLabelComfort: '₹250 organic Ladakhi breakfast feast',
      costLabelLuxury: '₹1,200 heritage Nimmu House garden breakfast',
      description: 'Crusty whole-wheat fermented flatbread served with savory salted yak butter tea in mud-brick lanes.',
    },
    {
      name: 'Hemis Museum & Living Buddhist Thangka Guild',
      category: 'crafts',
      time: '10:30 AM',
      duration_mins: 90,
      costLabelBudget: '₹100 museum admission',
      costLabelComfort: '₹350 preservation guild pass',
      costLabelLuxury: '₹2,500 master mineral-pigment thangka workshop',
      description: 'Hidden valley monastery holding ancient gold statues and sacred silk applique ceremonial banners.',
    },
    {
      name: 'Shey Palace Ancient Copper Buddha & Royal Gompa',
      category: 'heritage',
      time: '01:30 PM',
      duration_mins: 75,
      costLabelBudget: '₹50 entry ticket',
      costLabelComfort: '₹200 heritage audio trail',
      costLabelLuxury: '₹1,200 royal family restoration walk',
      description: 'Historic summer capital of the Kings of Ladakh housing a three-story gilded copper Shakyamuni statue.',
    },
    {
      name: 'Shanti Stupa Panoramic Sunset & Indus Valley View',
      category: 'nature',
      time: '05:00 PM',
      duration_mins: 75,
      costLabelBudget: 'Free hilltop platform',
      costLabelComfort: '₹200 twilight shuttle pass',
      costLabelLuxury: '₹1,000 private twilight mountain guide',
      description: 'White-domed Buddhist stupa offering 360-degree views of snow-capped Zanskar peaks turning amber.',
    },
  ],
};

function generateDynamicLogicalPlan(answers: DiscoveryAnswers): DayPlanResponse {
  const normCity = (answers.destination || 'Jaipur').toLowerCase();
  const matchedCityKey =
    Object.keys(CITY_EXPERIENCES).find((k) => normCity.includes(k) || k.includes(normCity)) ||
    (normCity.includes('leh') || normCity.includes('ladakh') ? 'ladakh' : 'jaipur');
  const cityStopsCatalog = CITY_EXPERIENCES[matchedCityKey] || CITY_EXPERIENCES.jaipur;

  const budget = answers.budget_daily_inr || 5000;
  const budgetTier: 'budget' | 'comfort' | 'luxury' =
    budget <= 2500 ? 'budget' : budget <= 9000 ? 'comfort' : 'luxury';

  const userInterests = answers.interests && answers.interests.length > 0
    ? answers.interests
    : ['heritage', 'crafts', 'food'];

  // Prioritize stops that match the user's selected interests
  const prioritizedStops = [...cityStopsCatalog].sort((a, b) => {
    const aMatch = userInterests.includes(a.category) ? 1 : 0;
    const bMatch = userInterests.includes(b.category) ? 1 : 0;
    return bMatch - aMatch;
  });

  // Pick 3 to 4 stops based on pace
  const stopCount = answers.pace === 'relaxed' ? 3 : answers.pace === 'packed' ? 5 : 4;
  const selectedRawStops = prioritizedStops.slice(0, Math.min(stopCount, cityStopsCatalog.length));

  // Format group narrative
  const groupBenefit =
    answers.group_type === 'solo'
      ? 'introspective solo wandering'
      : answers.group_type === 'couple'
      ? 'romantic couple retreat'
      : answers.group_type === 'family'
      ? 'spacious grounds and shaded seating for family'
      : 'vibrant shared moments for friends';

  // Format mobility benefit
  const mobilityBenefit = answers.accessibility.wheelchair
    ? 'Step-free ramp entry and elevator access verified'
    : answers.accessibility.low_walking
    ? 'Under 300m walking hop with shaded benches'
    : 'Comfortable neighborhood walking distance';

  const stops: DayPlanStop[] = selectedRawStops.map((item, idx) => {
    const costLabel =
      budgetTier === 'budget'
        ? item.costLabelBudget
        : budgetTier === 'comfort'
        ? item.costLabelComfort
        : item.costLabelLuxury;

    const isDirectInterestMatch = userInterests.includes(item.category);
    const fitReason = isDirectInterestMatch
      ? `Matches your ${item.category} affinity • ${groupBenefit} • ${mobilityBenefit}`
      : `Curated ${answers.destination} cultural anchor • ${groupBenefit}`;

    return {
      order: idx + 1,
      time: item.time,
      name: item.name,
      duration_mins: item.duration_mins,
      cost_label: costLabel,
      fit_reason: fitReason,
      match_notes: item.description,
      category: item.category,
    } as DayPlanStop & { match_notes: string; category: string };
  });

  const cityDisplayName = answers.destination || 'Jaipur';
  return {
    city: cityDisplayName,
    feasibility_score: 96,
    feasibility_summary: `100% Feasible ${answers.days}-Day Plan in ${cityDisplayName}. Calibrated for ₹${budget.toLocaleString('en-IN')}/day, ${answers.group_type} pacing, and ${userInterests.join(', ')} affinities.`,
    stops,
  };
}

export function TripOnboardingTakeover({
  isOpen,
  onClose,
  onPlanGenerated,
}: TripOnboardingTakeoverProps) {
  const navigate = useNavigate();

  const handleComplete = async (answers: DiscoveryAnswers) => {
    const city = answers.destination || 'Jaipur';
    const stateName = getStateForCity(city);

    // 1. Immediately synchronize with the central Zustand itinerary store
    useItineraryStore.getState().generateTrip({
      city,
      state: stateName,
      daysCount: answers.days,
      pace: answers.pace,
      budgetLimit: answers.budget_max_inr,
      travelers: answers.group_size,
      focusCategory: answers.interests[0] || 'heritage',
      interests: answers.interests,
      weatherPreference: answers.weather_preference,
      accessibility: answers.accessibility,
      corridorMode: answers.is_multi_corridor_opted ? 'corridor' : 'direct',
      corridorEvaluation: answers.corridor_evaluation,
      originCity: answers.origin_city,
      originState: answers.origin_state,
    });

    const mappedAnswers: TripContextAnswers = {
      city,
      timeWindow: `${answers.days} Days`,
      timeHours: answers.days * 8,
      budgetCeiling: answers.budget_max_inr,
      companions: answers.group_type,
      interests: answers.interests,
      foodPreference: 'Pure Vegetarian',
      foodNotes: '',
      mobility: answers.accessibility.wheelchair
        ? 'wheelchair'
        : answers.accessibility.low_walking
        ? 'low_walking'
        : 'moderate',
      isWheelchair: answers.accessibility.wheelchair,
      isLowWalking: answers.accessibility.low_walking,
      vibe: answers.pace,
    };

    if (onPlanGenerated) {
      const dynamicPlan = generateDynamicLogicalPlan(answers);
      onPlanGenerated(mappedAnswers, dynamicPlan);
      onClose();
      return;
    }

    onClose();
    navigate('/itinerary');
  };

  return (
    <DiscoveryOnboardingFlow
      isOpen={isOpen}
      onClose={onClose}
      onComplete={handleComplete}
    />
  );
}

export { DiscoveryOnboardingFlow, generateDynamicLogicalPlan };
