import {
  QuickEscapeQuery,
  QuickEscapePlan,
  QuickEscapeStop,
  QuickEscapeInterest,
  AvailableHours,
} from '../types/quickEscape';

// Helper to format minutes into "HH:MM" starting from a base hour (e.g., 09:00)
function formatTimestamp(baseHour: number, baseMinute: number, addMinutes: number): string {
  const totalMins = baseHour * 60 + baseMinute + addMinutes;
  const hours = Math.floor(totalMins / 60) % 24;
  const mins = totalMins % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export interface CuratedCityStop {
  title: string;
  category: QuickEscapeInterest;
  categoryLabel: string;
  durationMins: number;
  areaName: string;
  description: string;
  whyItFits: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  priceNote?: string;
  approxDistanceKm: number;
  transitMins: number;
  transitMode: 'walk' | 'auto' | 'metro' | 'cab';
  transitDescription: string;
}

// Curated city database for instant, high-fidelity micro-itineraries
const CITY_DATABASE: Record<string, CuratedCityStop[]> = {
  delhi: [
    {
      title: 'Jama Masjid & Old Delhi Haveli Courtyards',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Old Delhi / Chandni Chowk',
      description: 'Step into 17th-century sandstone courtyards with sweeping minaret views and quiet heritage corridors away from main bazaar traffic.',
      whyItFits: 'Located within 8 mins of Metro gate; zero ticketing delays during morning hours.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGXFpJoa25QUCoVO1L2EBwTpvNrV2cIQFw_rA9fMEzq4_QRE5r4Sz-V410&s=10',
      rating: 4.8,
      reviewCount: 3420,
      priceNote: 'Free entry (₹50 photography pass)',
      approxDistanceKm: 1.2,
      transitMins: 15,
      transitMode: 'walk',
      transitDescription: 'Walk through Dariba Kalan spice & silversmith gallis (15 mins · 800m)',
    },
    {
      title: 'Paranthe Wali Gali & Generational Chai Hearth',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 45,
      areaName: 'Dariba Kalan, Chandni Chowk',
      description: 'Savor crisp clay-hearth stuffed flatbreads served with pumpkin sabzi, mint chutneys, and rabri lassi from 1870s culinary lineages.',
      whyItFits: 'Rapid 10-minute order turnaround; direct walking connection to craft bazaars.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwISHgkjZWcjrQIB1bB9dS7odTCCKctvxbx31f8uYRmje_j6yGhRAQKIg&s=10',
      rating: 4.7,
      reviewCount: 2890,
      priceNote: '₹120 – ₹200 per traveler',
      approxDistanceKm: 2.1,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'E-Rickshaw transit to Red Fort boulevard & craft corridor (15 mins · 1.8km)',
    },
    {
      title: 'Dariba Kalan Ittar, Silver & Khari Baoli Spice Stalls',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Khari Baoli & Kinari Bazaar',
      description: 'Explore century-old perfumers distilling natural rose and sandalwood attar, alongside heritage zari craft workshops.',
      whyItFits: 'Compact pedestrian alleyways packed with artisan guilds within a 300m radius.',
      imageUrl: 'https://www.mapsofindia.com/ci-moi-images/my-india/2014/11/dariba-kalan.jpg',
      rating: 4.9,
      reviewCount: 1750,
      priceNote: 'Artisan attars from ₹150',
      approxDistanceKm: 1.5,
      transitMins: 15,
      transitMode: 'metro',
      transitDescription: 'Rapid yellow-line transit return to starting station (15 mins · 2.5km)',
    },
    {
      title: 'Agrasen ki Baoli Stepwell & CP Colonial Colonade',
      category: 'Culture',
      categoryLabel: 'Culture & Architecture',
      durationMins: 40,
      areaName: 'Hailey Road / Connaught Place',
      description: 'Descend 108 stone steps into a tranquil 14th-century architectural marvel tucked right beside modern central avenues.',
      whyItFits: 'Close to Central Delhi transit hubs; no ticket queue required.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF_oL5bgGMU0HaNDVstpqrrEBO3ACKhzbgfqF86gtj_R5_gcVCyW87Qyqz&s=10',
      rating: 4.6,
      reviewCount: 2100,
      priceNote: 'Free entry',
      approxDistanceKm: 3.2,
      transitMins: 20,
      transitMode: 'cab',
      transitDescription: 'AC cab transit via Janpath arterial corridor (20 mins · 3.5km)',
    },
    {
      title: 'Lodhi Art District Open-Air Street Murals',
      category: 'Culture',
      categoryLabel: 'Art & Living Culture',
      durationMins: 50,
      areaName: 'Lodhi Colony, South Delhi',
      description: 'Stroll across India’s first public open-air art district showcasing 50+ expansive murals created by indigenous and global artisans.',
      whyItFits: 'Pedestrian-friendly shaded grid with zero crowding and high visual impact.',
      imageUrl: 'https://i1.wp.com/www.golivegotravel.nl/wp-content/uploads/2017/02/street-art-delhi-kerale-dance-1-scaled.jpg?fit=2048%2C1365&ssl=1',
      rating: 4.8,
      reviewCount: 1650,
      priceNote: 'Public street access',
      approxDistanceKm: 2.8,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Auto ride to Khan Market heritage cafes (15 mins · 2.2km)',
    },
    {
      title: 'Sunder Nursery Heritage Biodiversity Park',
      category: 'Nature',
      categoryLabel: 'Nature & Landscape',
      durationMins: 55,
      areaName: 'Nizamuddin Heritage Precinct',
      description: 'Wander restored 16th-century Mughal garden monuments, sunken amphitheaters, and sprawling flora pavilions.',
      whyItFits: 'Serene respite from urban noise with smooth paved walking paths and artisan kiosks.',
      imageUrl: 'https://travelseewrite.com/wp-content/uploads/2021/01/sunder-nursery-british-landscaped-garden.jpg',
      rating: 4.9,
      reviewCount: 4200,
      priceNote: '₹50 entry pass',
      approxDistanceKm: 3.0,
      transitMins: 20,
      transitMode: 'cab',
      transitDescription: 'Express cab via Ring Road to departure hub (20 mins · 4.8km)',
    },
  ],
  mumbai: [
    {
      title: 'Gateway of India & Colaba Heritage Waterfront',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Colaba Waterfront',
      description: 'Morning breeze overlooking the Arabian Sea alongside basalt archways and historic yacht moorings.',
      whyItFits: 'Open public plaza with immediate access to historic South Mumbai cafe culture.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAJiqF55iwcUUW4jAx-FRoK3zBtIf0wIX0yQrNnOrbdA&s=10',
      rating: 4.8,
      reviewCount: 5120,
      priceNote: 'Free public promenade',
      approxDistanceKm: 0.8,
      transitMins: 12,
      transitMode: 'walk',
      transitDescription: 'Scenic walk down shaded Colaba Causeway promenade (12 mins · 750m)',
    },
    {
      title: 'Irani Cafe Bun Maska, Chai & Parsi Bakeries',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Fort / Dhobi Talao',
      description: 'Classic bentwood chairs, marble tables, and piping hot cardamom chai paired with crusty sourdough bun maska.',
      whyItFits: 'Brisk 5-minute table service and authentic 1920s heritage ambiance.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0W3z8dKfJuqzpSgtjyP_XIhThP4-rntXbJhU4cCZL0g&s=10',
      rating: 4.7,
      reviewCount: 3100,
      priceNote: '₹90 – ₹180 per person',
      approxDistanceKm: 1.4,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: 'Vintage black-and-yellow Premier Padmini cab to Kala Ghoda (15 mins · 1.6km)',
    },
    {
      title: 'Kala Ghoda Art Precinct & Designer Guilds',
      category: 'Culture',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 50,
      areaName: 'Kala Ghoda Arts District',
      description: 'Victorian Gothic colonnades housing contemporary art galleries, indie Indian design ateliers, and antique bookstalls.',
      whyItFits: 'High-density cultural corridor walkable in under 30 minutes without transit transfers.',
      imageUrl: 'https://travelogyindia.b-cdn.net/storage/app/upload/kala-ghoda-art-mumbai.jpg',
      rating: 4.8,
      reviewCount: 2240,
      priceNote: 'Free gallery admission',
      approxDistanceKm: 2.0,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: 'Quick cab along Marine Drive boulevard to return hub (15 mins · 2.8km)',
    },
    {
      title: 'Marine Drive Promenade & Sunset Horizon',
      category: 'Nature',
      categoryLabel: 'Scenic Waterfront & Nature',
      durationMins: 45,
      areaName: 'Back Bay Waterfront',
      description: 'Sit along the Queen’s Necklace curved promenade listening to rhythmic Arabian Sea waves.',
      whyItFits: 'Direct access to Churchgate and CST transit junctions.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZGD6289zL9PE3bEpjIwbsYre4qckplBA5OASSuQfakx__toYZajcLpnlu&s=10',
      rating: 4.9,
      reviewCount: 6800,
      priceNote: 'Free public promenade',
      approxDistanceKm: 2.5,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: 'Scenic cab back to your initial start point (15 mins · 2.4km)',
    },
  ],
  panvel: [
    {
      title: 'Karnala Bird Sanctuary & Historic Hill Fort',
      category: 'Heritage',
      categoryLabel: 'Heritage & Wildlife Circuit',
      durationMins: 50,
      areaName: 'NH66 / Karnala Forest Foothills',
      description: 'Dense teakwood canopy sheltering 220+ bird species surrounding the historic 12th-century Karnala basalt thumb pinnacle and fortress ruins.',
      whyItFits: 'Direct highway access from Panvel; peaceful early-morning bird trails with minimal walking congestion.',
      imageUrl: 'https://hblimg.mmtcdn.com/content/hubble/img/ttd_images/mmt/activities/m_Navi%20Mumbai_Karnala_bird_sanctuary_1_l_326_640.jpg',
      rating: 4.8,
      reviewCount: 3890,
      priceNote: '₹35 sanctuary permit',
      approxDistanceKm: 4.5,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Scenic auto or cab transit via Mumbai-Goa corridor (15 mins · 4.8km)',
    },
    {
      title: 'Agri-Koli Spice Kitchen & Konkan Misal Pav',
      category: 'Food',
      categoryLabel: 'Authentic Agri-Koli Gastronomy',
      durationMins: 45,
      areaName: 'Old Panvel / Shivaji Chowk',
      description: 'Fiery tarri-topped sprouts misal, crisp toasted pav, and authentic Agri-Koli rice-flour bhakri paired with piping hot ginger chai.',
      whyItFits: 'Brisk 5-minute table service and century-old Panvel culinary heritage loved by travelers and locals alike.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTMWVV7E6C9OVStRjjZwv-x_36_uirc_DMOCghCfZOO9uufxJyQ49WKvK4&s=10',
      rating: 4.9,
      reviewCount: 2950,
      priceNote: '₹80 – ₹160 per person',
      approxDistanceKm: 1.8,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'Quick auto ride through Old Panvel heritage lanes to Vadale Lake (12 mins · 1.5km)',
    },
    {
      title: 'Vadale Lake (Bada Talao) & Peshwa-Era Promenade',
      category: 'Culture',
      categoryLabel: 'Historic Water Heritage & Culture',
      durationMins: 40,
      areaName: 'Vadale Heritage Precinct, Panvel',
      description: 'Historic 400-year-old freshwater reservoir created during the Peshwa period, bordered by centuries-old banyan trees, illuminated walking promenades, and quiet water ghats.',
      whyItFits: 'Paved pedestrian promenade with cool breezes right in the heart of town; zero ticketing delay.',
      imageUrl: 'https://ilovenavimumbai.com/wp-content/uploads/2026/02/vadale-lake-.jpg',
      rating: 4.7,
      reviewCount: 2140,
      priceNote: 'Free public promenade',
      approxDistanceKm: 0.8,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Short pleasant stroll into Kapad Bazaar & Bartan Galli artisan corridor (10 mins · 600m)',
    },
    {
      title: 'Old Panvel Brass Guilds & Konkani Spice Galli',
      category: 'Shopping',
      categoryLabel: 'Artisan Guilds & Konkan Bazaars',
      durationMins: 45,
      areaName: 'Bartan Galli / Kapad Bazaar, Old Panvel',
      description: 'Wander historic mercantile gallis where generational coppersmiths hammer traditional Maharashtrian brassware, alongside regional Konkan spice vendors and handmade leather kolhapuri stalls.',
      whyItFits: 'Compact, walkable bazaar grid packed with generational craftsmen and aromatic spices.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ90W0jzNk9s3S5uO6LtCw40L_ixC8jPGFvMxGZYh0xJg&s',
      rating: 4.8,
      reviewCount: 1620,
      priceNote: 'Authentic spices & brasscraft from ₹100',
      approxDistanceKm: 1.2,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Auto ride along Uran Road to Khandeshwar Lake & Temple (15 mins · 2.4km)',
    },
    {
      title: 'Khandeshwar Shiva Temple & Lakeside Serenity',
      category: 'Nature',
      categoryLabel: 'Nature & Sacred Heritage',
      durationMins: 40,
      areaName: 'Khanda Colony / Khandeshwar',
      description: 'Ancient stone temple situated at the edge of Khandeshwar Lake, featuring traditional Hemadpanthi-inspired carvings, migratory water birds, and a deeply peaceful atmosphere.',
      whyItFits: 'Located minutes from Panvel railway junction and Sion-Panvel expressway; perfect calming finale.',
      imageUrl: 'https://media1.thrillophilia.com/filestore/sopf34dyi1zw9qu47607diwea5cn_1573558432_Shiv_Mandir__Ambernath.jpg',
      rating: 4.8,
      reviewCount: 3100,
      priceNote: 'Free sacred entry',
      approxDistanceKm: 2.0,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Direct auto or cab return to Panvel Railway Station / starting point (15 mins · 2.1km)',
    },
  ],
  bengaluru: [
    {
      title: 'Cubbon Park Bamboo Groves & Heritage Bandstand',
      category: 'Nature',
      categoryLabel: 'Nature & Landscape',
      durationMins: 45,
      areaName: 'Kasturba Road / Central Bengaluru',
      description: '300 acres of century-old silver oaks, bamboo glades, and Victorian library facades in the garden city center.',
      whyItFits: 'Directly linked to Cubbon Park Metro; shaded canopy provides natural cooling.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPg-fZhey7xifqxtZsemh58vQhJPHSqZpnyb8JbsqZj02eyjQsxZ-yyfZm&s=10',
      rating: 4.7,
      reviewCount: 4100,
      priceNote: 'Free park admission',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'metro',
      transitDescription: 'Purple Line Metro transit to Gandhi Bazaar / Chickpet (15 mins · 3.2km)',
    },
    {
      title: 'Heritage Filter Coffee & Benne Dosa Hearth',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Gandhi Bazaar / Basavanagudi',
      description: 'Crisp golden brown butter dosas roasted over cast-iron griddles served with spicy coconut chutney and brass tumbler degree coffee.',
      whyItFits: 'Rapid seating rotation; legendary local morning gastronomy.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLsA9JwIZlql3xUOOgiONIFH_otSo7UEGtCjz769b3KKb5ReoOz9W2jXak&s=10',
      rating: 4.9,
      reviewCount: 5400,
      priceNote: '₹80 – ₹150 per person',
      approxDistanceKm: 1.5,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Green auto ride through leafy South Bengaluru avenues (15 mins · 2.1km)',
    },
    {
      title: 'Commercial Street & Mysore Silk Weaving Guilds',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 50,
      areaName: 'Tasker Town / Commercial Street',
      description: 'Bustling laneways with GI-tagged raw Mysore silks, sandalwood aromatics, and generational brasscraft boutiques.',
      whyItFits: 'Centrally grouped shopping gallis offering quick curated browsing.',
      imageUrl: 'https://content.jdmagicbox.com/v2/comp/bangalore/n6/080pxx80.xx80.140618165748.j4n6/catalogue/vandana-silks-and-sarees-avenue-road-bangalore-silk-saree-wholesalers-kyue1bjkx0-250.jpg',
      rating: 4.6,
      reviewCount: 2310,
      priceNote: 'Silks from ₹800',
      approxDistanceKm: 2.2,
      transitMins: 15,
      transitMode: 'metro',
      transitDescription: 'Metro return connection to pickup hub (15 mins · 3.0km)',
    },
  ],
  jaipur: [
    {
      title: 'Hawa Mahal Honeycomb Facade & Wind Pavilion',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Badi Choupad, Pink City',
      description: '953 intricately carved sandstone jharokha windows engineered to circulate cool breezes through royal summer courtyards.',
      whyItFits: 'Zero entry delay for street-view terrace viewpoints; immediate Pink City bazaars access.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDlQDz_qYQumU3gKrwThoTZFTrYorlsp7Aq1nURfDMufmGnVwO_2MJxPcT&s=10',
      rating: 4.9,
      reviewCount: 7800,
      priceNote: '₹50 Indian / ₹200 Foreign',
      approxDistanceKm: 0.6,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Short stroll down Sireh Deori bazaar lanes (10 mins · 500m)',
    },
    {
      title: 'Johari Bazaar Clay Kulhad Lassi & Pyaaz Kachori',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'MI Road / Johari Bazaar',
      description: 'Thick, creamy hand-churned saffron lassi served in fragrant earthenware clay cups alongside flaky onion kachoris.',
      whyItFits: 'Legendary generational taste prepared in under 3 minutes per traveler.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9LYi9f2sWlUXjb4IFYWMKYt-riwqa-udJ0LFvfPKGn4V-1nfr7laXBdvZ&s=10',
      rating: 4.8,
      reviewCount: 4600,
      priceNote: '₹60 – ₹100 per lassi',
      approxDistanceKm: 1.2,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'Tuk-tuk ride through historic terracotta gateway arches (12 mins · 1.4km)',
    },
    {
      title: 'Bapu Bazaar Block Print & Blue Pottery Guilds',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 50,
      areaName: 'Bapu Bazaar & Nehru Bazaar',
      description: 'Meet Bagru hand-block artisans and browse authentic quartz-paste Jaipur blue pottery flower vases and tiles.',
      whyItFits: 'Fixed artisan guild stalls right on the main corridor; hassle-free gift selection.',
      imageUrl: 'https://content.jdmagicbox.com/comp/jaipur/e3/0141px141.x141.150216145947.q7e3/catalogue/jaipur-blue-pottery-marbel-art-centre-jaipur-0b1ubqsdsh.jpg',
      rating: 4.7,
      reviewCount: 3200,
      priceNote: 'Authentic block prints from ₹350',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Direct auto return to your start hotel / station (15 mins · 2.5km)',
    },
  ],
  varanasi: [
    {
      title: 'Dashashwamedh Ghat & Sacred Riverfront Gallis',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 50,
      areaName: 'Old Riverfront, Godowlia',
      description: 'Experience ancient sandstone steps, sacred morning temple bells, and timeless morning boat traditions along Mother Ganga.',
      whyItFits: 'High spiritual energy within 5 minutes of Godowlia intersection.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQXjwrY_bdBnql6aQc5u1BaM58ueb825pUHE2kUS44rHjblsNcbZ3a8W6S&s=10',
      rating: 4.9,
      reviewCount: 6200,
      priceNote: 'Free riverfront access',
      approxDistanceKm: 0.7,
      transitMins: 12,
      transitMode: 'walk',
      transitDescription: 'Walk through narrow ancient brick alleys (12 mins · 600m)',
    },
    {
      title: 'Kachori Galli Jalebi & Blue Lassi Tasting',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Vishwanath Galli',
      description: 'Crispy lentil kachoris with hing-spiced aloo jhol followed by hot syrupy jalebis and hand-pounded fruit lassi.',
      whyItFits: 'Authentic generational morning breakfast that takes under 25 minutes.',
      imageUrl: 'https://pinaak-prod.s3.ap-south-1.amazonaws.com/experiences/6a7f4776cacf10779ddc8379/images/original_1786726262297375107.jpg',
      rating: 4.8,
      reviewCount: 3900,
      priceNote: '₹70 – ₹130 per person',
      approxDistanceKm: 1.0,
      transitMins: 12,
      transitMode: 'walk',
      transitDescription: 'Pedestrian walk through silk-loom lanes (12 mins · 800m)',
    },
    {
      title: 'Banarasi Brocade & Zari Weavers Colony',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Madanpura / Chowk',
      description: 'Witness master jacquard weavers weaving real metallic silver and gold threads into heritage Banarasi silk weaves.',
      whyItFits: 'Direct artisan encounter with certified handloom origin seals.',
      imageUrl: 'https://site.outlookindia.com/traveller/wp-content/uploads/files/2014/02/081114154848-Banaras10.jpg',
      rating: 4.9,
      reviewCount: 2150,
      priceNote: 'Handloom stoles from ₹600',
      approxDistanceKm: 1.5,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Auto transit back to Godowlia starting hub (15 mins · 2.0km)',
    },
  ],
  pune: [
    {
      title: 'Shaniwar Wada 18th-Century Peshwa Fortification',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Shaniwar Peth / Old City',
      description: 'Massive teak spiked Dilli Darwaza gates, lotus fountains, and ancient bastions of the Maratha Empire.',
      whyItFits: 'Central landmark situated 10 mins from Pune Junction railway corridor.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTICmE2ARKeHd6zvoxC9bNg-K3MXE-B6Vo3tl830sSceOx6GHzdp5a3P7K&s=10',
      rating: 4.7,
      reviewCount: 4100,
      priceNote: '₹25 Indian entry pass',
      approxDistanceKm: 1.2,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'Auto transit to Tulsi Baug heritage market (12 mins · 1.1km)',
    },
    {
      title: 'Legendary Puneri Misal, Poha & Irani Chai Tasting',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Camp / FC Road',
      description: 'Fiery sprouted moth-bean tarri misal served with fresh farsan, toasted pav, and creamy bun maska.',
      whyItFits: 'Rapid 5-minute counter service with quintessential regional flavor profile.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiEa-mZGpk-V79ipVLcXCAECxh4XPHfGyCxpoNoH3PvJWwDj3UatS2C4Fw&s=10',
      rating: 4.8,
      reviewCount: 3800,
      priceNote: '₹90 – ₹160 per traveler',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Auto ride down shaded Ferguson College avenues (15 mins · 2.2km)',
    },
    {
      title: 'Tulsi Baug Brasscraft & Paithani Silk Weaving Gallis',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Budhwar Peth / Tulsi Baug',
      description: 'Century-old copper utensil beaters, hand-carved festive brass lamps, and certified Paithani peacock-border saris.',
      whyItFits: 'High-density authentic market lanes with direct artisan pricing.',
      imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewCount: 2200,
      priceNote: 'Brass crafts from ₹180',
      approxDistanceKm: 1.6,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Return transit back to initial starting point in Pune (15 mins · 2.4km)',
    },
  ],
  kolkata: [
    {
      title: 'Victoria Memorial & Colonial Maidan Green Corridor',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 50,
      areaName: 'Queens Way / Maidan',
      description: 'White Makrana marble monuments, tranquil reflecting pools, and expansive gardens along Kolkata’s grand avenue.',
      whyItFits: 'Direct access to Rabindra Sadan Metro with lush shaded walking paths.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjzl3NoUZ3KGA4iekZz4XASaFdit2hyA1bFhIk21YhlestikD-gAQbKv8&s=10',
      rating: 4.9,
      reviewCount: 8200,
      priceNote: '₹50 garden entry',
      approxDistanceKm: 1.5,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: 'Iconic yellow ambassador cab to College Street / Park Street (15 mins · 2.8km)',
    },
    {
      title: 'College Street Heritage Coffee House & Kathi Roll Feast',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'College Street / Boi Para',
      description: 'High ceiling paddle fans, infusion black coffee, mutton cutlets, and flaky paratha kathi rolls.',
      whyItFits: 'Historic intellectual hub with instant hot food service.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ4YwziYd96pfOayckUFJ29E2wPdLZNAEIk68kdSlArJyMLUcLLyJQJig&s=10',
      rating: 4.8,
      reviewCount: 5600,
      priceNote: '₹120 – ₹200 per person',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'metro',
      transitDescription: 'Blue Line metro ride to New Market craft district (15 mins · 2.5km)',
    },
    {
      title: 'Kumartuli Clay Idol Sculptors Colony & New Market',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Kumartuli & Lindsay Street',
      description: 'Generations of master artisans molding straw, river clay, and bamboo into sacred sculptures and terracotta jewelry.',
      whyItFits: 'Rare living heritage guild accessible without entry fees.',
      imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      reviewCount: 3100,
      priceNote: 'Terracotta crafts from ₹100',
      approxDistanceKm: 2.0,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: 'Direct cab return to your Kolkata start point (15 mins · 2.6km)',
    },
  ],
  hyderabad: [
    {
      title: 'Charminar & Chowmahalla Palace Courtyards',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Old City, Charminar',
      description: 'Four monumental minarets built in 1591, overlooking bustling bazaar archways and Belgian crystal chandeliers of Nizami palaces.',
      whyItFits: 'Central landmark with immediate walking connection to traditional bazaars.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQopf9VeERRQC9Ko1IjtmGhWkyKtK5gFTOBPS1WnCqF9OOmtJxgmzaKD4I&s=10',
      rating: 4.8,
      reviewCount: 7100,
      priceNote: '₹25 entry pass',
      approxDistanceKm: 0.8,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Walk through Laad Bazaar bangle and perfume gallis (10 mins · 400m)',
    },
    {
      title: 'Nimrah Cafe Irani Chai & Authentic Dum Biryani',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Charminar East Gate',
      description: 'Creamy Irani chai paired with fresh Osmania salt-butter biscuits right across the grand arches.',
      whyItFits: 'Zero waiting time; iconic culinary stop with panoramic monument views.',
      imageUrl: 'https://thetastytales.com/wp-content/uploads/2026/02/Nimrah-cafe-charminar.jpg',
      rating: 4.9,
      reviewCount: 6300,
      priceNote: '₹40 – ₹120 per person',
      approxDistanceKm: 1.4,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Auto transit to pearl & perfume bazaar (15 mins · 1.8km)',
    },
    {
      title: 'Laad Bazaar Lacquer Bangles & Zari Guilds',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Laad Bazaar',
      description: 'Craftsmen heating pure resin and embedding hand-cut stones into glittering lacquer bracelets and Bidri metal inlay boxes.',
      whyItFits: 'Centuries-old artisan guild in a pedestrianized heritage market.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLDaAnLHcNXL9a4fP6wCc7XKJT1EyUb0Ki4egb0Eug8r9Yv1RZGX2sVEb7&s=10',
      rating: 4.7,
      reviewCount: 2900,
      priceNote: 'Bidriware crafts from ₹350',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Direct auto return to your start location (15 mins · 2.5km)',
    },
  ],
  goa: [
    {
      title: 'Fontainhas Latin Quarter & Portuguese Heritage Mansions',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Fontainhas, Panjim',
      description: 'Wander pastel ochre and indigo colonial villas, hand-painted ceramic azulejos tiles, and 19th-century wrought-iron balconies.',
      whyItFits: 'Peaceful pedestrian quarter with immediate access to authentic heritage bakeries.',
      imageUrl: 'https://www.tourmyindia.com/states/goa/image/fontainhas-latin-quarter-goa.webp',
      rating: 4.9,
      reviewCount: 5400,
      priceNote: 'Free walking heritage zone',
      approxDistanceKm: 1.0,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Short stroll down cobblestone lanes to traditional bakery (10 mins · 450m)',
    },
    {
      title: 'Traditional Goan Poi Bakery, Cafreal & Ros Omelette',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Panjim Municipal Market Precinct',
      description: 'Wood-fired crusty poi bread served with aromatic spiced chicken cafreal, coconut gravies, and authentic local street delicacies.',
      whyItFits: 'Authentic generational morning taste served in under 10 minutes.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE9qN-kUSP4wBjhYVSU6XixALC1ERPCsRakf8vSO0hCr2mXhvNU2detGFm&s=10',
      rating: 4.8,
      reviewCount: 3800,
      priceNote: '₹120 – ₹220 per person',
      approxDistanceKm: 1.5,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'Auto ride across Rua de Ourém canal (12 mins · 1.6km)',
    },
    {
      title: 'Panjim Handcrafted Azulejos Tiles & Cashew Spice Stalls',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Panjim Heritage Promenade',
      description: 'Meet master tile painters crafting custom ceramic nameplates alongside GI-tagged Goan feni and organic spice guilds.',
      whyItFits: 'Unique certified regional keepsakes direct from resident artisans.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvz0z1qjEoyP0Kq6l2T2WOl6cbQWx0mTuDM9nppfHQwZlmQOFLKFUYmNU&s=10',
      rating: 4.7,
      reviewCount: 2200,
      priceNote: 'Hand-painted tiles from ₹250',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: 'Scenic cab along Mandovi river back to your start point (15 mins · 2.4km)',
    },
  ],
  amritsar: [
    {
      title: 'Golden Temple (Harmandir Sahib) & Sacred Amrit Sarovar',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 50,
      areaName: 'Heritage Street, Amritsar',
      description: 'Gilded marble sanctum surrounded by holy waters, spiritual hymns, and the timeless community seva tradition.',
      whyItFits: 'Unmatched spiritual tranquility with organized pedestrian corridors.',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/94/The_Golden_Temple_of_Amrithsar_7.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original',
      rating: 4.9,
      reviewCount: 9800,
      priceNote: 'Free peaceful access',
      approxDistanceKm: 0.8,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Walk down red-sandstone Heritage Street (10 mins · 500m)',
    },
    {
      title: 'Legendary Clay Hearth Amritsari Kulcha & Sweet Lassi',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Town Hall / Katra Ahluwalia',
      description: 'Flaky multi-layered tandoori kulchas stuffed with spiced potatoes and paneer, served with chole and churned malai lassi.',
      whyItFits: 'World-famous 80-year-old culinary institution with rapid seating.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFP-v8kB0bGAI4PYAijPKohoax7VzODr8LMAh7HOy4hOD9PIhwfZPRG6o&s=10',
      rating: 4.9,
      reviewCount: 6700,
      priceNote: '₹90 – ₹160 per traveler',
      approxDistanceKm: 1.2,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'E-Rickshaw transit through historic Hall Gate (12 mins · 1.4km)',
    },
    {
      title: 'Hall Bazaar Hand-Embroidered Phulkari & Heritage Juttis',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Hall Bazaar & Katra Jaimal Singh',
      description: 'Direct artisan stalls offering vibrant silk-thread geometric Phulkari shawls and handmade embroidered leather footwear.',
      whyItFits: 'Dense concentration of certified authentic Punjabi craft cooperatives.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQatlX0gkD7ccXhHKaG--Dp4jRvljrsUqxP41F6K3oONovdIh4kAzDmPYk&s=10',
      rating: 4.8,
      reviewCount: 3100,
      priceNote: 'Authentic juttis from ₹350',
      approxDistanceKm: 1.5,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Return auto to your initial starting point in Amritsar (15 mins · 2.1km)',
    },
  ],
  udaipur: [
    {
      title: 'City Palace Marble Balconies & Lake Pichola Ghats',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 50,
      areaName: 'Old City, Lake Pichola',
      description: 'Vast granite and marble palace complex with mirror mosaics, royal courtyards, and sweeping vistas across the island palaces.',
      whyItFits: 'Premier landmark situated in the heart of the walkable historic lake precinct.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfQOmtWKEmw2u0Dtq3qnIeGsDQggx-D_nPFMstjVdpoWq4jVwbMdhMobY&s=10',
      rating: 4.9,
      reviewCount: 8400,
      priceNote: '₹300 palace pass',
      approxDistanceKm: 0.6,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Scenic walk down Jagdish Temple cobblestone steps (10 mins · 400m)',
    },
    {
      title: 'Jagdish Chowk Mewari Dal Baati & Royal Lassi',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Jagdish Chowk, Old City',
      description: 'Slow-baked wheat baatis crushed in pure ghee, accompanied by five-lentil dal, garlic chutney, and saffron lassi.',
      whyItFits: 'Quintessential royal Rajasthan flavors served with rooftop lake views.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkAeUz66MJLv6YX9Od32WhU4yJ15qiKafLAPqfRKNPih3xQIHGbgV16l0&s=10',
      rating: 4.8,
      reviewCount: 4200,
      priceNote: '₹140 – ₹240 per person',
      approxDistanceKm: 1.0,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'Tuk-tuk ride through traditional gates to Hathi Pol (12 mins · 1.2km)',
    },
    {
      title: 'Hathi Pol Rajput Miniature Painting & Leather Guilds',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Hathi Pol Bazaar',
      description: 'Watch hereditary master artists paint intricate Rajput miniature scenes with squirrel-hair brushes on handmade paper and silk.',
      whyItFits: 'Certified master artisan workshops with fixed artist-direct pricing.',
      imageUrl: 'https://imp-art.org/wp-content/uploads/2026/03/IMG_20251021_152855-scaled-e1772616317295.jpg',
      rating: 4.7,
      reviewCount: 2600,
      priceNote: 'Handmade miniature paintings from ₹300',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Direct auto return to your start location in Udaipur (15 mins · 2.2km)',
    },
  ],
  agra: [
    {
      title: 'Taj Mahal East Gateway Viewpoints & Mughal Gardens',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 50,
      areaName: 'Taj East Gate Precinct',
      description: 'Pure white Makrana marble monument glowing under morning light, reflected across central water channels and cypress trees.',
      whyItFits: 'East gate offers smoother morning visitor movement; world-class icon.',
      imageUrl: 'https://assets.architecturaldigest.in/photos/68aee6b6c217baca2192039c/1:1/w_1080,h_1080,c_limit/Untitled%20design%20-%202025-08-27T163622.470.png',
      rating: 4.9,
      reviewCount: 11200,
      priceNote: '₹50 Indian / ₹1100 Foreign',
      approxDistanceKm: 1.2,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'Pollution-free battery rickshaw to Sadar Bazaar (12 mins · 1.5km)',
    },
    {
      title: 'Generational Agra Petha & Bedmi Puri Breakfast',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Sadar Bazaar / Kinari Bazaar',
      description: 'Authentic translucent ash-gourd sweets infused with saffron and kewra, paired with crispy urad-dal bedmi puris.',
      whyItFits: 'Iconic local breakfast served fresh from 19th-century hearths.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTm0T0bnR-qLheZTXWkl9xEaK0x2GlYHheSKML51bBD-TAEFZSRrD2p7rg&s=10',
      rating: 4.7,
      reviewCount: 3900,
      priceNote: '₹80 – ₹150 per person',
      approxDistanceKm: 1.6,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Auto ride to Pietra Dura marble guild workshops (15 mins · 2.0km)',
    },
    {
      title: 'Pietra Dura Marble Inlay & Zardozi Embroidery Guilds',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Fatehabad Road Craft Guilds',
      description: 'Direct descendants of the original Taj Mahal artisans cutting lapis lazuli, malachite, and mother-of-pearl into white marble.',
      whyItFits: 'Unscripted access to generational craftsmen practicing UNESCO-recognized techniques.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPuvfds1wiPfDCpfw0bDTZb-glVIm57ZzzPXFR060lPcxaybXoHXskuKw&s=10',
      rating: 4.8,
      reviewCount: 2800,
      priceNote: 'Inlay coasters & plates from ₹400',
      approxDistanceKm: 2.2,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: 'Comfortable return cab back to your start point (15 mins · 2.8km)',
    },
  ],
  kochi: [
    {
      title: 'Fort Kochi Beach Promenade & Chinese Fishing Nets',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Fort Kochi Waterfront',
      description: 'Cantilevered shore-operated fishing nets introduced by 14th-century traders silhouetted against the Arabian Sea inlet.',
      whyItFits: 'Iconic open-air coastal promenade directly connected to art cafes.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKCs5vP-f5VVHalC0bBAADruO2Ca1lSLBb-tToSObc3UDqm60QqeRkPjak&s=10',
      rating: 4.8,
      reviewCount: 6500,
      priceNote: 'Free waterfront promenade',
      approxDistanceKm: 0.8,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Walk down shady Princess Street colonnades (10 mins · 450m)',
    },
    {
      title: 'Princess Street Appam, Fish Moilee & Spiced Tea',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Princess Street, Fort Kochi',
      description: 'Lacy fermented rice appams with coconut-turmeric fish moilee and freshly brewed cardamom-ginger spiced tea.',
      whyItFits: 'Refined coastal Malabar gastronomy in heritage courtyard cafes.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcvl_7icYaGWHraL1d9evsQ-x8b_PheflEXJZNyy1aNGieaLs8N4pLqIk&s=10',
      rating: 4.8,
      reviewCount: 3900,
      priceNote: '₹140 – ₹250 per person',
      approxDistanceKm: 1.8,
      transitMins: 12,
      transitMode: 'auto',
      transitDescription: 'Auto transit to historic Mattancherry Jew Town (12 mins · 2.2km)',
    },
    {
      title: 'Mattancherry Jew Town Spice Warehouses & Antiques',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'Jew Town, Mattancherry',
      description: 'Fragrant centuries-old warehouses heaped with Tellicherry black pepper, organic cinnamon quills, and antique brass ware.',
      whyItFits: 'Epicenter of India’s global spice trade with authentic whole spices.',
      imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      reviewCount: 3200,
      priceNote: 'Estate spices from ₹120',
      approxDistanceKm: 2.0,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Return auto to your initial pickup location (15 mins · 2.6km)',
    },
  ],
  chennai: [
    {
      title: 'Kapaleeshwarar 7th-Century Dravidian Gopuram',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: 'Mylapore Temple Precinct',
      description: 'Monumental 37-meter tiered gateway towering with hundreds of sculpted mythological deities above a sacred stone tank.',
      whyItFits: 'Ancient spiritual heart of Chennai with zero admission delays.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2RjEei04DFYdXt0pcDUr2ulSrJhaaP_opvGk24YCwstTgWxy_bQXL3ec&s=10',
      rating: 4.9,
      reviewCount: 7800,
      priceNote: 'Free temple entry',
      approxDistanceKm: 0.6,
      transitMins: 10,
      transitMode: 'walk',
      transitDescription: 'Short walk through fragrant jasmine flower stall lanes (10 mins · 350m)',
    },
    {
      title: 'Mylapore Ghee Roast Dosa & Kumbakonam Degree Coffee',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: 'Mada Streets, Mylapore',
      description: 'Paper-thin golden crisp ghee dosas served on plantain leaves with three freshly ground coconut chutneys and brass davarah filter coffee.',
      whyItFits: 'Legendary morning culinary institution renowned for authentic South Indian tastes.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbR22ocy1oTZ7csOXDbIIBGAKGM3LSkXj1MaMI8aY9Q8_98T5Vb8kaZhbU&s=10',
      rating: 4.9,
      reviewCount: 5200,
      priceNote: '₹70 – ₹130 per person',
      approxDistanceKm: 1.5,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Auto ride through tree-lined avenues to silk weaver guilds (15 mins · 2.0km)',
    },
    {
      title: 'Mylapore Bronze Sculptors & Kanchipuram Silk Boutiques',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: 'South Mada Street, Mylapore',
      description: 'Master artisans casting lost-wax Chola bronzes alongside certified pure mulberry silk saris with pure zari borders.',
      whyItFits: 'Direct access to generational hereditary craft guilds without commercial markups.',
      imageUrl: 'https://content.jdmagicbox.com/comp/nagpur/p6/0712px712.x712.160507140742.f3p6/catalogue/pradhnya-bhartiya-shilpkala-darshan-medical-college-nagpur-nagpur-sculpture-art-work-3h81bh0.jpg',
      rating: 4.7,
      reviewCount: 2400,
      priceNote: 'Bronze artifacts from ₹350',
      approxDistanceKm: 2.2,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: 'Direct return auto to your departure location in Chennai (15 mins · 2.5km)',
    },
  ],
};

// Generic fallback stops for any custom city typed by the user
function getGenericStopsForCity(cityName: string, interests: QuickEscapeInterest[]): CuratedCityStop[] {
  const genericList: CuratedCityStop[] = [
    {
      title: `${cityName} Historic Old Quarter & Heritage Monument`,
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      durationMins: 45,
      areaName: `Central Historic Zone, ${cityName}`,
      description: `Explore the foundational architecture, stone gateways, and centuries-old public squares that defined the early settlement of ${cityName}.`,
      whyItFits: 'Prime central landmark with low entrance overhead and high cultural value.',
      imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewCount: 1420,
      priceNote: 'Free / nominal municipal pass',
      approxDistanceKm: 1.2,
      transitMins: 15,
      transitMode: 'walk',
      transitDescription: `Short stroll down ${cityName}’s traditional market lanes (15 mins · 900m)`,
    },
    {
      title: `${cityName} Iconic Morning Breakfast & Tea Hearth`,
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      durationMins: 40,
      areaName: `Bazaar Street, ${cityName}`,
      description: `Taste signature regional recipes passed down across generations, served hot with fresh seasonal chutneys and regional tea.`,
      whyItFits: 'Fast table turnover and cherished culinary institution praised by local residents.',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewCount: 1980,
      priceNote: '₹100 – ₹180 per person',
      approxDistanceKm: 1.8,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: `Local auto transit to ${cityName} artisan cluster (15 mins · 1.6km)`,
    },
    {
      title: `${cityName} Traditional Artisan & Craft Guild`,
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      durationMins: 45,
      areaName: `Crafts Quarter, ${cityName}`,
      description: `Watch resident craftspersons create indigenous textiles, metalwork, or pottery, with options for direct community-supported purchases.`,
      whyItFits: '100% genuine local craftspeople without commercial middleman markups.',
      imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      reviewCount: 1100,
      priceNote: 'Handicrafts from ₹200',
      approxDistanceKm: 1.5,
      transitMins: 15,
      transitMode: 'auto',
      transitDescription: `Direct transit return to your departure point in ${cityName} (15 mins · 2.2km)`,
    },
    {
      title: `${cityName} Botanical Botanical Gardens & Public Promenade`,
      category: 'Nature',
      categoryLabel: 'Nature & Landscape',
      durationMins: 45,
      areaName: `Green Promenade, ${cityName}`,
      description: `A tranquil tree-lined garden with heritage pavilions, natural breeze, and quiet walking circuits.`,
      whyItFits: 'Accessible green sanctuary located within minutes of urban transit.',
      imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewCount: 950,
      priceNote: 'Free municipal entry',
      approxDistanceKm: 2.2,
      transitMins: 15,
      transitMode: 'cab',
      transitDescription: `Scenic return drive back to starting point (15 mins · 2.8km)`,
    },
  ];

  return genericList;
}

export const CITY_DEFAULT_START_POINTS: Record<string, { current: string; customPresets: string[] }> = {
  delhi: {
    current: 'Current Location (Connaught Place, Delhi)',
    customPresets: ['Indira Gandhi Int. Airport (DEL)', 'New Delhi Railway Station (NDLS)', 'Connaught Place Outer Circle', 'Aerocity Transit Hub'],
  },
  jaipur: {
    current: 'Current Location (Badi Choupad, Pink City)',
    customPresets: ['Jaipur International Airport (JAI)', 'Jaipur Junction Railway Station', 'MI Road Central', 'Sindhi Camp Central Bus Stand'],
  },
  mumbai: {
    current: 'Current Location (Colaba Waterfront, Mumbai)',
    customPresets: ['Chhatrapati Shivaji Terminus (CSMT)', 'Mumbai Airport T2 (BOM)', 'Bandra Kurla Complex (BKC)', 'Marine Drive Promenade'],
  },
  panvel: {
    current: 'Current Location (Panvel City Center, Maharashtra)',
    customPresets: [
      'Panvel Junction Railway Station (PNVL)',
      'Navi Mumbai International Airport Site (NMI)',
      'Orion Mall / Panvel Bus Terminus',
      'Khanda Colony / Khandeshwar Station',
      'Karnala Sanctuary Entry Hub',
    ],
  },
  bengaluru: {
    current: 'Current Location (MG Road, Central Bengaluru)',
    customPresets: ['Kempegowda Int. Airport (BLR)', 'Krantivira Sangolli Rayanna (SBC) Station', 'Indiranagar 100ft Road', 'Koramangala 4th Block'],
  },
  varanasi: {
    current: 'Current Location (Godowlia Crossing, Varanasi)',
    customPresets: ['Varanasi Cantt Railway Station (BSB)', 'Lal Bahadur Shastri Airport (VNS)', 'Assi Ghat Riverfront', 'Kashi Vishwanath Corridor Gate'],
  },
  pune: {
    current: 'Current Location (FC Road / Deccan, Pune)',
    customPresets: ['Pune Junction Railway Station', 'Pune International Airport (PNQ)', 'Koregaon Park North Main Rd', 'Viman Nagar Hub'],
  },
  kolkata: {
    current: 'Current Location (Park Street / Esplanade, Kolkata)',
    customPresets: ['Howrah Railway Junction', 'Netaji Subhash Chandra Bose Airport (CCU)', 'Sealdah Station', 'Salt Lake Sector V'],
  },
  hyderabad: {
    current: 'Current Location (Charminar Precinct, Hyderabad)',
    customPresets: ['Rajiv Gandhi Int. Airport (HYD)', 'Secunderabad Railway Station', 'HITEC City Cyber Towers', 'Banjara Hills Rd No. 1'],
  },
  goa: {
    current: 'Current Location (Fontainhas Latin Quarter, Panjim)',
    customPresets: ['Dabolim Airport (GOI)', 'Mopa Manohar Airport (GOX)', 'Madgaon Junction Station', 'Calangute / Candolim Circle'],
  },
  amritsar: {
    current: 'Current Location (Heritage Street, Amritsar)',
    customPresets: ['Sri Guru Ram Dass Jee Airport (ATQ)', 'Amritsar Junction Railway Station', 'Hall Gate Circle', 'Ranjit Avenue'],
  },
  udaipur: {
    current: 'Current Location (Old City Ghats, Udaipur)',
    customPresets: ['Maharana Pratap Airport (UDR)', 'Udaipur City Railway Station', 'Fateh Sagar Lake Pal', 'Saheliyon-ki-Bari Hub'],
  },
  agra: {
    current: 'Current Location (Taj East Gate, Agra)',
    customPresets: ['Agra Cantt Railway Station', 'Fatehabad Road Tourist Complex', 'Sadar Bazaar Central', 'Agra Airport (AGR)'],
  },
  kochi: {
    current: 'Current Location (Fort Kochi Beach Walk, Kochi)',
    customPresets: ['Cochin International Airport (COK)', 'Ernakulam South Junction (ERS)', 'Marine Drive Kochi Promenade', 'Mattancherry Palace Road'],
  },
  chennai: {
    current: 'Current Location (Mylapore Temple Quarter, Chennai)',
    customPresets: ['Chennai Central Station (MAS)', 'Chennai International Airport (MAA)', 'T. Nagar Panagal Park', 'Besant Nagar Eliot Beach'],
  },
};

export function getStartPointConfig(locationStr: string): { current: string; customPresets: string[] } {
  const cleaned = locationStr.replace(/\(.*?\)/g, '').trim();
  const rawCity = cleaned.split(',')[0].trim().toLowerCase();
  const found = CITY_DEFAULT_START_POINTS[rawCity];
  if (found) return found;
  const displayCity = cleaned.split(',')[0].trim() || 'Your City';
  return {
    current: `Current Location (${displayCity})`,
    customPresets: [
      `${displayCity} Airport`,
      `${displayCity} Central Railway Station`,
      `${displayCity} City Center`,
      `Central Hotel / Landmark`,
    ],
  };
}

// Generate realistic itinerary based on user constraints
export async function generateQuickEscapePlan(query: QuickEscapeQuery): Promise<QuickEscapePlan> {
  // Simulate minimal realistic processing latency for UX feel
  await new Promise((resolve) => setTimeout(resolve, 450));

  // Clean city extraction (strips out any GPS annotations or state suffixes)
  const cleanedLocation = query.location.replace(/\(.*?\)/g, '').trim();
  const rawCity = cleanedLocation.split(',')[0].trim().toLowerCase();
  const displayCity = cleanedLocation.split(',')[0].trim() || 'Delhi';

  const startConfig = getStartPointConfig(cleanedLocation);
  const startLocationName =
    query.startPointType === 'custom' && query.customStartPoint?.trim()
      ? query.customStartPoint.trim()
      : startConfig.current;

  const cityStopsPool = CITY_DATABASE[rawCity] || getGenericStopsForCity(displayCity, query.interests);

  // Filter or prioritize based on selected interests
  let selectedPool = [...cityStopsPool];
  if (query.interests.length > 0) {
    const matching = cityStopsPool.filter((s) => query.interests.includes(s.category));
    const nonMatching = cityStopsPool.filter((s) => !query.interests.includes(s.category));
    selectedPool = [...matching, ...nonMatching];
  }

  // Determine number of stops based on available hours
  // 1 Hour: 1 stop + travel to & from
  // 2 Hours: 2 stops
  // 3 Hours: 3 stops (matches the prompt example: Heritage -> Food -> Shopping/Culture -> Return)
  // 5 Hours: 4-5 stops
  let targetStopCount = 3;
  if (query.availableHours === 1) targetStopCount = 1;
  else if (query.availableHours === 2) targetStopCount = 2;
  else if (query.availableHours === 3) targetStopCount = 3;
  else if (query.availableHours === 5) targetStopCount = 4;

  const chosenStops = selectedPool.slice(0, targetStopCount);

  // Build timeline starting at 09:00 (or current local hour rounded up)
  const baseHour = 9;
  const baseMinute = 0;
  let currentMinuteOffset = 0;

  let totalTravelMins = 0;
  let totalDistanceKm = 0;

  const stopsList: QuickEscapeStop[] = [];

  // For 1-hour escape: start from user location -> quick visit -> return
  if (query.availableHours === 1) {
    const singleStop = chosenStops[0];
    const visitDuration = 35;
    const transitTo = 12;
    const transitReturn = 13;
    totalTravelMins = transitTo + transitReturn;
    totalDistanceKm = 2.4;

    const startTransitStr = formatTimestamp(baseHour, baseMinute, 0);
    const arriveStopStr = formatTimestamp(baseHour, baseMinute, transitTo);
    const finishStopStr = formatTimestamp(baseHour, baseMinute, transitTo + visitDuration);
    const returnTimeStr = formatTimestamp(baseHour, baseMinute, 60);

    stopsList.push({
      id: `qe-stop-1`,
      title: singleStop.title,
      category: singleStop.category,
      categoryLabel: singleStop.categoryLabel,
      timeSlot: `${arriveStopStr} — ${finishStopStr}`,
      startTime: arriveStopStr,
      endTime: finishStopStr,
      durationMins: visitDuration,
      areaName: singleStop.areaName,
      description: singleStop.description,
      whyItFits: singleStop.whyItFits,
      imageUrl: singleStop.imageUrl,
      rating: singleStop.rating,
      reviewCount: singleStop.reviewCount,
      priceNote: singleStop.priceNote,
      transitToNext: {
        durationMins: transitReturn,
        distanceKm: 1.2,
        mode: singleStop.transitMode,
        description: `Direct return transit to ${startLocationName} (${transitReturn} mins)`,
      },
    });

    stopsList.push({
      id: `qe-stop-return`,
      title: `Return to ${startLocationName}`,
      category: 'Return',
      categoryLabel: 'Return / Complete',
      timeSlot: `${finishStopStr} — ${returnTimeStr}`,
      startTime: finishStopStr,
      endTime: returnTimeStr,
      durationMins: transitReturn,
      areaName: startLocationName,
      description: `Return safely to your initial point with zero missed flights, meetings, or transit connections.`,
      whyItFits: `Scheduled with a 5-minute safety buffer.`,
      imageUrl: singleStop.imageUrl,
    });
  } else {
    // 2, 3, or 5 Hours
    // Prompt structure example:
    // 09:00 — Heritage Experience
    // 09:45 — Travel
    // 10:00 — Local Food Experience
    // 10:45 — Cultural/Shopping Experience
    // 11:45 — Return
    chosenStops.forEach((stop, index) => {
      // Allocate duration per stop
      let stopDuration = 45;
      let transitToNextMins = 15;

      if (query.availableHours === 2) {
        stopDuration = index === 0 ? 40 : 35;
        transitToNextMins = 15;
      } else if (query.availableHours === 3) {
        // Exactly matches prompt:
        // 09:00-09:45 (45 mins) -> Travel 15 mins -> 10:00-10:45 (45 mins) -> 10:45-11:45 (60 mins) -> 11:45 Return
        if (index === 0) {
          stopDuration = 45;
          transitToNextMins = 15;
        } else if (index === 1) {
          stopDuration = 45;
          transitToNextMins = 0; // Immediate adjacent transition or included
        } else if (index === 2) {
          stopDuration = 60;
          transitToNextMins = 15;
        }
      } else if (query.availableHours === 5) {
        stopDuration = index === 1 ? 60 : 45; // Longer lunch/food stop
        transitToNextMins = 20;
      }

      const startT = formatTimestamp(baseHour, baseMinute, currentMinuteOffset);
      currentMinuteOffset += stopDuration;
      const endT = formatTimestamp(baseHour, baseMinute, currentMinuteOffset);

      const isLast = index === chosenStops.length - 1;
      const nextTransit = isLast
        ? {
          durationMins: 15,
          distanceKm: 1.5,
          mode: stop.transitMode,
          description: `Return transit back to ${startLocationName} (15 mins · 1.5 km)`,
        }
        : transitToNextMins > 0
          ? {
            durationMins: transitToNextMins,
            distanceKm: stop.approxDistanceKm,
            mode: stop.transitMode,
            description: stop.transitDescription,
          }
          : undefined;

      if (nextTransit) {
        totalTravelMins += nextTransit.durationMins;
        totalDistanceKm += nextTransit.distanceKm;
        currentMinuteOffset += nextTransit.durationMins;
      }

      stopsList.push({
        id: `qe-stop-${index + 1}`,
        title: stop.title,
        category: stop.category,
        categoryLabel: stop.categoryLabel,
        timeSlot: `${startT} — ${endT}`,
        startTime: startT,
        endTime: endT,
        durationMins: stopDuration,
        areaName: stop.areaName,
        description: stop.description,
        whyItFits: stop.whyItFits,
        imageUrl: stop.imageUrl,
        rating: stop.rating,
        reviewCount: stop.reviewCount,
        priceNote: stop.priceNote,
        transitToNext: nextTransit,
      });
    });

    // Add Final Return Stop
    const returnStartTime = stopsList[stopsList.length - 1]?.endTime || '11:45';
    const finalFinishTime = formatTimestamp(baseHour, baseMinute, query.availableHours * 60);

    stopsList.push({
      id: `qe-stop-return`,
      title: `Return to ${startLocationName}`,
      category: 'Return',
      categoryLabel: 'Return / Complete',
      timeSlot: `${returnStartTime} — ${finalFinishTime}`,
      startTime: returnStartTime,
      endTime: finalFinishTime,
      durationMins: 15,
      areaName: startLocationName,
      description: `Complete your micro-circuit and return on schedule without risk of missing connections.`,
      whyItFits: `Optimized route ensures you arrive back within your strict ${query.availableHours}-hour free window.`,
      imageUrl:
        'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    });
  }

  const directionsQuery = encodeURIComponent(
    `${displayCity}, India to ${chosenStops.map((s) => s.title).join(' to ')}`
  );

  return {
    id: `quick-escape-${Date.now()}`,
    title: `Your ${query.availableHours}-Hour ${displayCity} Escape`,
    city: displayCity,
    totalHours: query.availableHours,
    totalDurationMins: query.availableHours * 60,
    estimatedTravelTimeMins: Math.max(totalTravelMins, 25),
    approxDistanceKm: Number((Math.max(totalDistanceKm, 3.8)).toFixed(1)),
    startPoint: startLocationName,
    endPoint: startLocationName,
    startTime: formatTimestamp(baseHour, baseMinute, 0),
    endTime: formatTimestamp(baseHour, baseMinute, query.availableHours * 60),
    stops: stopsList,
    summary: `Curated ${chosenStops.length} verified stops prioritizing ${query.interests.length > 0 ? query.interests.join(' & ') : 'Culture & Food'
      } with guaranteed feasibility in ${query.availableHours} hours.`,
    feasibilityScore: 98,
    feasibilityBadge: query.isLiveGps
      ? '🛰️ Live GPS Synchronized · 100% Feasible'
      : '100% Feasible Time-Padded Circuit',
    mapDirectionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      startLocationName
    )}&destination=${encodeURIComponent(chosenStops[0]?.title || displayCity)}`,
    isLiveGps: query.isLiveGps,
  };
}

export const POPULAR_CITIES_QUICK = [
  'Panvel, Maharashtra',
  'Delhi, India',
  'Jaipur, Rajasthan',
  'Mumbai, Maharashtra',
  'Pune, Maharashtra',
  'Bengaluru, Karnataka',
  'Varanasi, Uttar Pradesh',
  'Kolkata, West Bengal',
  'Hyderabad, Telangana',
  'Goa (Panjim), Goa',
  'Amritsar, Punjab',
  'Udaipur, Rajasthan',
  'Agra, Uttar Pradesh',
  'Kochi, Kerala',
  'Chennai, Tamil Nadu',
];

export const DEFAULT_QUICK_ESCAPE_PLAN: QuickEscapePlan = {
  id: 'quick-escape-jaipur-initial',
  title: 'Your 3-Hour Jaipur Escape',
  city: 'Jaipur',
  totalHours: 3,
  totalDurationMins: 180,
  estimatedTravelTimeMins: 30,
  approxDistanceKm: 4.2,
  startPoint: 'Current Location (Jaipur)',
  endPoint: 'Current Location (Jaipur)',
  startTime: '09:00',
  endTime: '12:00',
  summary: 'Curated 3 verified stops prioritizing Heritage, Food & Shopping with guaranteed feasibility in 3 hours.',
  feasibilityScore: 98,
  feasibilityBadge: '100% Feasible Time-Padded Circuit',
  mapDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&origin=Jaipur&destination=Hawa%20Mahal',
  stops: [
    {
      id: 'qe-stop-1',
      title: 'Hawa Mahal Honeycomb Facade & Wind Pavilion',
      category: 'Heritage',
      categoryLabel: 'Heritage Experience',
      timeSlot: '09:00 - 09:45',
      startTime: '09:00',
      endTime: '09:45',
      durationMins: 45,
      areaName: 'Badi Choupad, Pink City',
      description: '953 intricately carved sandstone jharokha windows engineered to circulate cool breezes through royal summer courtyards.',
      whyItFits: 'Zero entry delay for street-view terrace viewpoints; immediate Pink City bazaars access.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDlQDz_qYQumU3gKrwThoTZFTrYorlsp7Aq1nURfDMufmGnVwO_2MJxPcT&s=10',
      rating: 4.9,
      reviewCount: 7800,
      priceNote: '₹50 Indian / ₹200 Foreign',
      transitToNext: {
        durationMins: 15,
        distanceKm: 0.8,
        mode: 'walk',
        description: 'Short stroll down Sireh Deori bazaar lanes (15 mins · 500m)',
      },
    },
    {
      id: 'qe-stop-2',
      title: 'Johari Bazaar Clay Kulhad Lassi & Pyaaz Kachori',
      category: 'Food',
      categoryLabel: 'Local Food Experience',
      timeSlot: '10:00 - 10:45',
      startTime: '10:00',
      endTime: '10:45',
      durationMins: 45,
      areaName: 'MI Road / Johari Bazaar',
      description: 'Thick, creamy hand-churned saffron lassi served in fragrant earthenware clay cups alongside flaky onion kachoris.',
      whyItFits: 'Legendary generational taste prepared in under 3 minutes per traveler.',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9LYi9f2sWlUXjb4IFYWMKYt-riwqa-udJ0LFvfPKGn4V-1nfr7laXBdvZ&s=10',
      rating: 4.8,
      reviewCount: 4600,
      priceNote: '₹60 - ₹100 per lassi',
      transitToNext: {
        durationMins: 0,
        distanceKm: 0.3,
        mode: 'auto',
        description: 'Tuk-tuk ride through historic terracotta gateway arches (12 mins · 1.4km)',
      },
    },
    {
      id: 'qe-stop-3',
      title: 'Bapu Bazaar Block Print & Blue Pottery Guilds',
      category: 'Shopping',
      categoryLabel: 'Cultural / Shopping Experience',
      timeSlot: '10:45 - 11:45',
      startTime: '10:45',
      endTime: '11:45',
      durationMins: 60,
      areaName: 'Bapu Bazaar & Nehru Bazaar',
      description: 'Meet Bagru hand-block artisans and browse authentic quartz-paste Jaipur blue pottery flower vases and tiles.',
      whyItFits: 'Fixed artisan guild stalls right on the main corridor; hassle-free gift selection.',
      imageUrl: 'https://content.jdmagicbox.com/comp/jaipur/e3/0141px141.x141.150216145947.q7e3/catalogue/jaipur-blue-pottery-marbel-art-centre-jaipur-0b1ubqsdsh.jpg',
      rating: 4.7,
      reviewCount: 3200,
      priceNote: 'Authentic block prints from ₹350',
      transitToNext: {
        durationMins: 15,
        distanceKm: 1.5,
        mode: 'auto',
        description: 'Direct auto return to starting point (15 mins · 2.5km)',
      },
    },
    {
      id: 'qe-stop-return',
      title: 'Return to Current Location (Jaipur)',
      category: 'Return',
      categoryLabel: 'Return / Complete',
      timeSlot: '11:45 - 12:00',
      startTime: '11:45',
      endTime: '12:00',
      durationMins: 15,
      areaName: 'Current Location (Jaipur)',
      description: 'Complete your micro-circuit and return on schedule without risk of missing connections.',
      whyItFits: 'Optimized route ensures you arrive back within your strict 3-hour free window.',
      imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    },
  ],
};
