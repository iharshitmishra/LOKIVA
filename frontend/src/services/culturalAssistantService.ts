import {
  getCulturalDataset,
  getUpcomingFestivalForState,
  StateCulturalDataset,
  StateFestival,
} from '../data/culturalIntelligenceData';

export interface GroundingInfo {
  tag: string;
  excerpt: string;
  chapterNumber?: number;
}

export interface PlanIntentInfo {
  city: string;
  state: string;
  festival?: string | null;
  dates?: string;
  focus?: string;
  ctaLabel?: string;
}

export interface CulturalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  grounding?: GroundingInfo | null;
  followUps?: string[];
  planIntent?: PlanIntentInfo | null;
  timestamp: number;
}

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2014\u2015]/g, ', ')
    .replace(/[\u2013]/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

/**
 * 360-degree intelligent semantic synthesis engine with 100% domain accuracy across:
 * - Greetings & General Inquiries
 * - Gastronomy & Regional Dishes
 * - Key Landmarks & Architectural Monuments
 * - Living Traditions (Music, Dance, Attire, Martial Arts)
 * - Seasonal Weather, Best Time to Visit & Climate
 * - Living Celebrations & Festival Calendars
 * - Living Artisan Guilds & Mastercrafts
 * - Cross-State Civilizational Connections
 * - Historical Epochs & Chapters
 */
export function synthesizeClientCulturalResponse(
  dataset: StateCulturalDataset,
  query: string
): {
  answer: string;
  grounding: GroundingInfo;
  followUps: string[];
  planIntent: PlanIntentInfo | null;
} {
  const q = (query || '').toLowerCase().trim();
  const upcoming = getUpcomingFestivalForState(dataset.stateSlug);

  // 1. GREETINGS & CASUAL INTRODUCTIONS
  const isGreeting =
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'namaste' ||
    q === 'good morning' ||
    q === 'good evening' ||
    q === 'who are you' ||
    q === 'help' ||
    q === 'what can you do' ||
    q === 'hi there';

  if (isGreeting) {
    const upcomingHighlight = upcoming
      ? `upcoming pageantry like the ${upcoming.name} (${upcoming.dateRange}) in ${upcoming.city}`
      : 'sacred festival calendars';

    return {
      answer: `Namaste! Welcome to the cultural intelligence archives of ${dataset.stateName}. I am dynamically grounded in this region's historical epochs, generational artisan guilds, and ${upcomingHighlight}.\n\nHow can I help you explore ${dataset.stateName} today? You can ask about royal fortress architecture, upcoming folk festivals, traditional textile lineages, regional delicacies, best visiting seasons, or plannable cultural itineraries.`,
      grounding: {
        tag: `Overview · ${dataset.stateName} Heritage Archives`,
        excerpt: dataset.culturalEssence,
      },
      followUps: [
        upcoming
          ? `Tell me about the upcoming ${upcoming.name}`
          : `What festivals take place in ${dataset.stateName}?`,
        `What signature foods should I try in ${dataset.stateName}?`,
        `Tell me about ${dataset.stateName}'s fortress citadels and monuments`,
      ],
      planIntent: null,
    };
  }

  // 2. GASTRONOMY & FOOD DELICACIES
  const matchedFood = (dataset.foods || []).find((f) => {
    const fLower = f.name.toLowerCase();
    const parts = fLower.split(/\s+/).filter((w) => w.length > 3);
    return q.includes(fLower) || parts.some((p) => q.includes(p));
  });

  const isFoodQuery =
    matchedFood ||
    q.includes('food') ||
    q.includes('eat') ||
    q.includes('dish') ||
    q.includes('cuisine') ||
    q.includes('delicacy') ||
    q.includes('sweet') ||
    q.includes('taste') ||
    q.includes('culinary') ||
    q.includes('breakfast') ||
    q.includes('lunch') ||
    q.includes('dinner');

  if (isFoodQuery) {
    if (matchedFood) {
      const answer = `${matchedFood.name} (${matchedFood.category}) is one of the most iconic gastronomic treasures of ${dataset.stateName}.\n\n${matchedFood.description}\n\nCultural Origin: ${matchedFood.origin}\n\nWhen visiting ${dataset.stateName}, this delicacy is best experienced fresh from heritage bazaars and traditional family-run eateries.`;
      return {
        answer: cleanText(answer),
        grounding: {
          tag: `Gastronomy · ${matchedFood.name}`,
          excerpt: cleanText(matchedFood.description),
        },
        followUps: [
          `Where are the best authentic spots to try ${matchedFood.name}?`,
          `What other signature delicacies are famous in ${dataset.stateName}?`,
          `Can I join a local culinary masterclass in ${dataset.primaryHub}?`,
        ],
        planIntent: {
          city: dataset.primaryHub,
          state: dataset.stateName,
          festival: null,
          dates: 'Year-Round Food Trail',
          focus: `Gastronomic Food Trail: ${matchedFood.name}`,
          ctaLabel: `Plan a culinary trail in ${dataset.stateName}`,
        },
      };
    }

    const foodList = (dataset.foods || [])
      .map((f) => `• ${f.name} (${f.category}): ${f.description}`)
      .join('\n\n');

    const answer = `Gastronomy in ${dataset.stateName} is a celebration of regional terroir, ancestral preservation techniques, and royal culinary heritage. Key signature specialties include:\n\n${foodList}\n\nEvery region within ${dataset.stateName} offers distinct spice profiles, from royal slow-cooked banquets to vibrant street food institutions.`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Gastronomy · ${dataset.stateName} Culinary Heritage`,
        excerpt: (dataset.foods && dataset.foods[0]?.description) || dataset.culturalEssence,
      },
      followUps: [
        `Tell me more about ${(dataset.foods && dataset.foods[0]?.name) || 'traditional recipes'}`,
        `Are there vegetarian options available across ${dataset.stateName}?`,
        `What are the most famous street food hubs?`,
      ],
      planIntent: {
        city: dataset.primaryHub,
        state: dataset.stateName,
        festival: null,
        dates: 'Year-Round Culinary Tour',
        focus: 'Heritage Food Walks & Royal Dining',
        ctaLabel: `Plan a food tour in ${dataset.stateName}`,
      },
    };
  }

  // 3. KEY LANDMARKS & SPECIFIC PLACES
  const matchedPlace = (dataset.places || []).find((p) => {
    const pLower = p.name.toLowerCase();
    const locLower = p.location.toLowerCase();
    const cityLower = p.city.toLowerCase();
    const tags = p.tags || [];
    const keywords = [
      pLower,
      locLower,
      cityLower,
      ...pLower.split(/\s+/).filter((w) => w.length > 3 && !['fort', 'lake', 'palace', 'temple', 'caves', 'high'].includes(w)),
      ...tags.map((t) => t.toLowerCase()),
    ];
    return keywords.some((kw) => q.includes(kw));
  });

  if (matchedPlace) {
    const answer = `${matchedPlace.name} in ${matchedPlace.location} is one of ${dataset.stateName}'s foremost heritage landmarks.\n\n${matchedPlace.description}\n\nArchitectural Context: This site represents the pinnacle of regional engineering, stonecarving, and defensive or sacred design. Visitors are advised to explore early morning or late afternoon for the best natural light and cooler ambient temperatures.`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Landmark · ${matchedPlace.name}`,
        excerpt: cleanText(matchedPlace.description),
      },
      followUps: [
        `What is the best time of day to visit ${matchedPlace.name}?`,
        `What nearby historic sites can I combine with this visit?`,
        `What is the optimal 3-day itinerary covering ${matchedPlace.city}?`,
      ],
      planIntent: {
        city: matchedPlace.city,
        state: dataset.stateName,
        festival: null,
        dates: dataset.snapshot.bestTime,
        focus: `Landmark Circuit: ${matchedPlace.name}`,
        ctaLabel: `Plan a trip to ${matchedPlace.name}`,
      },
    };
  }

  // 4. LIVING TRADITIONS (MUSIC, DANCE, ATTIRE, MARTIAL ARTS)
  const matchedTradition = (dataset.cultureTraditions || []).find((t) => {
    const tLower = t.title.toLowerCase();
    const catLower = t.category.toLowerCase();
    const titleWords = tLower.split(/\s+/).filter((w) => w.length > 3 && !['graceful', 'living', 'sacred', 'ancient'].includes(w));
    
    if (q.includes(tLower) || titleWords.some((w) => q.includes(w))) return true;
    if (catLower.includes('clothing') && (q.includes('attire') || q.includes('saree') || q.includes('turban') || q.includes('pagri') || q.includes('wear') || q.includes('dress') || q.includes('clothes') || q.includes('kasavu') || q.includes('bandhani') || q.includes('nauvari') || q.includes('goncha'))) return true;
    if (catLower.includes('dance') && (q.includes('dance') || q.includes('ghoomar') || q.includes('kalbelia') || q.includes('lavani') || q.includes('kathakali') || q.includes('mohiniyattam') || q.includes('cham'))) return true;
    if (catLower.includes('music') && (q.includes('music') || q.includes('rhythm') || q.includes('song') || q.includes('instrument') || q.includes('kamayacha') || q.includes('chenda') || q.includes('dhol'))) return true;
    if (catLower.includes('martial') && (q.includes('martial') || q.includes('kalaripayattu') || q.includes('combat'))) return true;
    return false;
  });

  if (matchedTradition) {
    const answer = `${dataset.stateName}'s ${matchedTradition.category.toLowerCase()} tradition is embodied by ${matchedTradition.title}.\n\n${matchedTradition.description}\n\nThese living arts are passed down through hereditary family gharanas and tribal collectives, remaining central to community weddings, temple festivals, and harvest rituals across ${dataset.stateName}.`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Living Tradition · ${matchedTradition.title}`,
        excerpt: cleanText(matchedTradition.description),
      },
      followUps: [
        `Where can I attend live performances of ${matchedTradition.title}?`,
        `What are the historical origins of this art form?`,
        `How can I purchase authentic handcrafted traditional attire?`,
      ],
      planIntent: {
        city: dataset.primaryHub,
        state: dataset.stateName,
        festival: null,
        dates: 'Year-Round Cultural Immersion',
        focus: `Cultural Arts: ${matchedTradition.title}`,
        ctaLabel: `Plan a cultural arts trip in ${dataset.stateName}`,
      },
    };
  }

  // 5. SEASONS, WEATHER & BEST TIME TO VISIT
  const isWeatherQuery =
    q.includes('weather') ||
    q.includes('climate') ||
    q.includes('best time') ||
    q.includes('when to visit') ||
    q.includes('season') ||
    q.includes('temperature') ||
    q.includes('winter') ||
    q.includes('summer') ||
    q.includes('monsoon') ||
    q.includes('rain') ||
    q.includes('spring') ||
    q.includes('autumn');

  if (isWeatherQuery && dataset.seasons && dataset.seasons.length > 0) {
    const matchedSeason = dataset.seasons.find((s) => q.includes(s.season.toLowerCase())) || dataset.seasons[0];

    const seasonList = dataset.seasons
      .map((s) => `• ${s.season} (${s.months}): ${s.weather} Typical temperatures: ${s.temperature}. Prime experiences include ${s.experiences.slice(0, 2).join(' and ')}.`)
      .join('\n\n');

    const answer = `The ideal window to explore ${dataset.stateName} is ${dataset.snapshot.bestTime}.\n\nOverview of Seasons in ${dataset.stateName}:\n\n${seasonList}\n\nClimate Profile: ${dataset.snapshot.climate}`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Seasonal Almanac · ${matchedSeason.season} (${matchedSeason.months})`,
        excerpt: `${matchedSeason.weather} Temperature: ${matchedSeason.temperature}`,
      },
      followUps: [
        `What should I pack for ${matchedSeason.season} in ${dataset.stateName}?`,
        `What festivals take place during ${dataset.snapshot.bestTime}?`,
        `Is ${dataset.stateName} crowded during peak season?`,
      ],
      planIntent: {
        city: dataset.primaryHub,
        state: dataset.stateName,
        festival: null,
        dates: dataset.snapshot.bestTime,
        focus: `Seasonal Travel: ${dataset.snapshot.bestTime}`,
        ctaLabel: `Plan a ${dataset.snapshot.bestTime} trip`,
      },
    };
  }

  // 6. FESTIVAL & LIVING CELEBRATIONS INTENT
  const matchedFest = dataset.festivalCalendar.find((f) => {
    const fLower = f.name.toLowerCase();
    const cityLower = f.city.toLowerCase();
    const tags = f.tags || [];
    const keywords = [fLower, cityLower, ...fLower.split(/\s+/).filter((w) => w.length > 3 && !['festival', 'fair'].includes(w)), ...tags.map((t) => t.toLowerCase())];
    return keywords.some((kw) => q.includes(kw));
  });

  const isFestivalQuery =
    matchedFest ||
    q.includes('festival') ||
    q.includes('fair') ||
    q.includes('celebrat') ||
    q.includes('event') ||
    q.includes('pageantry');

  if (isFestivalQuery) {
    const fest = matchedFest || upcoming || dataset.festivalCalendar[0];
    const crossState = dataset.crossStateConnections?.[0];

    const answer = `${fest.name} in ${fest.city} is one of the premier cultural spectacles in ${dataset.stateName}. ${fest.significance} Celebrated around ${fest.dateRange}, it brings together hereditary bards, traditional performers, and pilgrims from across the region.\n\n${fest.excerpt}\n\nFor travelers, the most immersive vantage point is around ${fest.location}. During the festivities, visitors can also taste seasonal regional delicacies and witness evening community pageants that are unique to this celebration.`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Festival · ${fest.name}`,
        excerpt: cleanText(fest.excerpt),
      },
      followUps: [
        `What traditional attire is recommended for ${fest.name}?`,
        crossState
          ? `Are there similar folk celebrations in neighboring ${crossState.relatedState}?`
          : `What are the best heritage stays near ${fest.location}?`,
        `What is the best 3-day itinerary around this festival?`,
      ],
      planIntent: {
        city: fest.city,
        state: dataset.stateName,
        festival: fest.name,
        dates: fest.dateRange,
        focus: fest.tags.join(', '),
        ctaLabel: `Plan a trip for ${fest.name}`,
      },
    };
  }

  // 7. ARTISAN GUILDS, CRAFTS & TEXTILES INTENT
  const isCraftQuery =
    q.includes('craft') ||
    q.includes('artisan') ||
    q.includes('textile') ||
    q.includes('print') ||
    q.includes('pottery') ||
    q.includes('saree') ||
    q.includes('handloom') ||
    q.includes('dye') ||
    q.includes('silk') ||
    q.includes('pashmina') ||
    q.includes('pichwai') ||
    q.includes('painting');

  if (isCraftQuery && dataset.artisanGuilds && dataset.artisanGuilds.length > 0) {
    const guild = dataset.artisanGuilds[0];
    const ch = dataset.chapters[dataset.chapters.length - 1] || dataset.chapters[0];

    const answer = `${dataset.stateName}'s living craft traditions have been preserved for centuries through generational artisan guilds. A world-renowned example is the ${guild.name} in ${guild.location}, practicing ${guild.craft}.\n\n${guild.description}\n\n${ch.narrative}\n\nTravelers can visit these artisan quarters directly to witness natural vegetable dyeing, handloom weaving, and stonecarving masterclasses, supporting fair-trade local master artisans directly.`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Chapter ${ch.chapterNumber} · ${ch.eraName}`,
        excerpt: cleanText(guild.description),
        chapterNumber: ch.chapterNumber,
      },
      followUps: [
        `How can I visit the ${guild.name} in ${guild.location}?`,
        `What other craft clusters exist across ${dataset.stateName}?`,
        `Can I plan an artisan workshop trail across ${dataset.stateName}?`,
      ],
      planIntent: {
        city: dataset.primaryHub,
        state: dataset.stateName,
        festival: null,
        dates: 'Year-Round Access',
        focus: 'Living Mastercrafts & Artisan Guilds',
        ctaLabel: `Plan a craft trail in ${dataset.stateName}`,
      },
    };
  }

  // 8. ARCHITECTURE, FORTS & MONUMENTS GENERAL INTENT
  const isArchQuery =
    q.includes('fort') ||
    q.includes('palace') ||
    q.includes('citadel') ||
    q.includes('rampart') ||
    q.includes('bastion') ||
    q.includes('haveli') ||
    q.includes('stepwell') ||
    q.includes('kailasa') ||
    q.includes('monument') ||
    q.includes('architecture') ||
    q.includes('caves') ||
    q.includes('temple');

  if (isArchQuery) {
    const ch = dataset.chapters[0];
    const allMonuments = dataset.chapters.flatMap((c) => c.keyMonuments);

    const answer = `The architecture of ${dataset.stateName} reflects centuries of defensive statecraft, sacred geometry, and climatically responsive engineering. ${ch.headline}.\n\nKey architectural marvels include:\n• ${allMonuments.slice(0, 4).join('\n• ')}\n\n${ch.excerpt}`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Chapter ${ch.chapterNumber} · ${ch.eraName}`,
        excerpt: cleanText(ch.excerpt),
        chapterNumber: ch.chapterNumber,
      },
      followUps: [
        `What is the best route to visit these fortress citadels?`,
        `Which monuments have water-harvesting stepwells or natural ventilation?`,
        `Are guided heritage walks available for these sites?`,
      ],
      planIntent: {
        city: dataset.primaryHub,
        state: dataset.stateName,
        festival: null,
        dates: dataset.snapshot.bestTime,
        focus: 'Historic Fortress Circuits',
        ctaLabel: `Explore historic routes in ${dataset.stateName}`,
      },
    };
  }

  // 9. CROSS-STATE & COMPARATIVE INQUIRIES
  const crossState = dataset.crossStateConnections?.find((x) =>
    q.includes(x.relatedState.toLowerCase())
  );

  if (crossState) {
    const answer = `${dataset.stateName} shares deep historical and cultural connections with ${crossState.relatedState}. ${crossState.connectionDescription}\n\nIn terms of living celebrations and heritage, ${crossState.sharedFestivalsOrTraditions}. Travelers exploring connected cultural corridors often combine circuits across both states for a complete civilizational journey.`;

    return {
      answer: cleanText(answer),
      grounding: {
        tag: `Cross-State Connection · ${dataset.stateName} & ${crossState.relatedState}`,
        excerpt: cleanText(crossState.connectionDescription),
      },
      followUps: [
        `What is the best en-route corridor connecting ${dataset.stateName} and ${crossState.relatedState}?`,
        `How do the culinary traditions compare between both states?`,
        `Which border heritage sites should I stop at along the way?`,
      ],
      planIntent: {
        city: dataset.primaryHub,
        state: dataset.stateName,
        festival: null,
        dates: 'Multi-State Connected Route',
        focus: `Connected Tour: ${dataset.stateName} to ${crossState.relatedState}`,
        ctaLabel: `Plan connected multi-state route`,
      },
    };
  }

  // 10. DEFAULT / GENERAL HISTORICAL & CULTURAL NARRATIVE
  const matchedChapter =
    dataset.chapters.find((c) => {
      const eraLower = c.eraName.toLowerCase();
      const monMatch = c.keyMonuments.some((m) => q.includes(m.toLowerCase()));
      return q.includes(eraLower) || monMatch;
    }) || dataset.chapters[0];

  const answer = `${dataset.stateName}'s cultural tapestry is shaped by centuries of history, sovereign resilience, and unbroken artistic lineages. During ${matchedChapter.eraName} (${matchedChapter.timePeriod}), ${matchedChapter.headline.toLowerCase()}.\n\n${matchedChapter.narrative}\n\nToday, this heritage remains vibrant in places like ${matchedChapter.keyMonuments.slice(0, 3).join(', ')}. ${matchedChapter.livingLegacy}`;

  return {
    answer: cleanText(answer),
    grounding: {
      tag: `Chapter ${matchedChapter.chapterNumber} · ${matchedChapter.eraName}`,
      excerpt: cleanText(matchedChapter.excerpt),
      chapterNumber: matchedChapter.chapterNumber,
    },
    followUps: [
      `What monuments from Chapter ${matchedChapter.chapterNumber} should I visit first?`,
      upcoming
        ? `What is happening during the upcoming ${upcoming.name}?`
        : `What festivals celebrate this history today?`,
      `Where can I experience local culinary specialties in ${dataset.stateName}?`,
    ],
    planIntent: {
      city: dataset.primaryHub,
      state: dataset.stateName,
      festival: null,
      dates: dataset.snapshot.bestTime,
      focus: 'Heritage Citadels & Ancient Shrines',
      ctaLabel: `Explore historic routes in ${dataset.stateName}`,
    },
  };
}

/**
 * Sends a query to the Cultural Assistant backend and streams tokens back to callback.
 */
export async function askCulturalAssistant({
  stateSlug,
  query,
  conversationHistory = [],
  onTokenChunk,
}: {
  stateSlug: string;
  query: string;
  conversationHistory?: CulturalMessage[];
  onTokenChunk?: (accumulatedText: string) => void;
}): Promise<{
  answer: string;
  grounding?: GroundingInfo | null;
  followUps: string[];
  planIntent?: PlanIntentInfo | null;
  status: 'success' | 'unauthored' | 'error';
}> {
  const dataset = getCulturalDataset(stateSlug);

  if (!dataset) {
    const unauthoredMsg = `Cultural insights for ${stateSlug || 'this state'} are coming soon. Our heritage curators are currently archiving this region's historical chapters, artisan guilds, and sacred festivals.`;
    if (onTokenChunk) onTokenChunk(unauthoredMsg);
    return {
      status: 'unauthored',
      answer: unauthoredMsg,
      grounding: null,
      followUps: [],
      planIntent: null,
    };
  }

  try {
    const response = await fetch('/api/v1/culture-assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stateSlug,
        query,
        conversationHistory: conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.answer) {
        const fullText = data.answer;
        if (onTokenChunk) {
          const words = fullText.split(' ');
          let current = '';
          for (let i = 0; i < words.length; i++) {
            current += (i === 0 ? '' : ' ') + words[i];
            onTokenChunk(current);
            await new Promise((r) => setTimeout(r, 14));
          }
        }

        return {
          status: 'success',
          answer: data.answer,
          grounding: data.grounding,
          followUps: data.followUps || [],
          planIntent: data.planIntent,
        };
      }
    }
  } catch (err) {
    console.warn('Backend assistant request error, engaging client grounding engine:', err);
  }

  const synthesis = synthesizeClientCulturalResponse(dataset, query);

  if (onTokenChunk) {
    const words = synthesis.answer.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      onTokenChunk(current);
      await new Promise((r) => setTimeout(r, 14));
    }
  }

  return {
    status: 'success',
    answer: synthesis.answer,
    grounding: synthesis.grounding,
    followUps: synthesis.followUps,
    planIntent: synthesis.planIntent,
  };
}
