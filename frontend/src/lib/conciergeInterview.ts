/**
 * LOKIVA Concierge Interview Engine
 *
 * A deterministic, client-side state machine that decides which single
 * clarifying question to ask next so the concierge can curate a far more
 * tailored shortlist instead of guessing from a one line prompt.
 *
 * Design notes:
 * 1. The engine is intentionally local. It works even when the AI model is
 *    cold, rate limited, or offline, so the traveler is never stranded.
 * 2. Every question is a single tap. Multi select questions confirm once.
 * 3. Free text is harvested into the same brief, so a traveler who already
 *    typed "4 hours, family, street food" is never asked those again.
 * 4. Once the required dimensions are known, the brief is handed to the
 *    concierge endpoint as a structured profile for grounding and ranking.
 */

export type BriefDimension =
  | 'companions'
  | 'timeBudget'
  | 'interests'
  | 'budget'
  | 'pace'
  | 'startTime'
  | 'crowdVibe'
  | 'accessibility'
  | 'dietary';

export interface TripBrief {
  destination: string | null;
  companions: string | null;
  groupSize: number | null;
  timeBudget: string | null;
  interests: string[];
  budget: string | null;
  pace: string | null;
  startTime: string | null;
  crowdVibe: string | null;
  accessibility: string | null;
  dietary: string | null;
}

export interface BriefOption {
  label: string;
  value: string;
  hint?: string;
  emoji?: string;
}

export interface InterviewQuestion {
  id: BriefDimension;
  required: boolean;
  multi?: boolean;
  question: string;
  rationale: string;
  options: BriefOption[];
}

export const EMPTY_BRIEF: TripBrief = {
  destination: null,
  companions: null,
  groupSize: null,
  timeBudget: null,
  interests: [],
  budget: null,
  pace: null,
  startTime: null,
  crowdVibe: null,
  accessibility: null,
  dietary: null,
};

// Canonical interest keys intentionally mirror the categories and tags stored
// on the experiences table, so the ranking engine can match them directly.
export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'companions',
    required: true,
    question: 'Who is travelling with you today?',
    rationale: 'Pacing, seating and crowd comfort change completely with your group.',
    options: [
      { label: 'Just me', value: 'solo', emoji: '\u{1F9D9}', hint: 'Solo explorer' },
      { label: 'My partner', value: 'couple', emoji: '\u2764\uFE0F', hint: 'Couple' },
      { label: 'Friends', value: 'friends', emoji: '\u{1F465}', hint: 'Friends or colleagues' },
      { label: 'Family', value: 'family', emoji: '\u{1F46A}', hint: 'With kids' },
      { label: 'Parents', value: 'seniors', emoji: '\u{1F9D3}', hint: 'Elders with me' },
    ],
  },
  {
    id: 'timeBudget',
    required: true,
    question: 'How much time do you have in the city?',
    rationale: 'I only shortlist stops that genuinely fit inside your window.',
    options: [
      { label: '2 to 3 hours', value: '2 to 3 hours', emoji: '\u23F1', hint: 'A quick taste' },
      { label: 'Half day', value: 'Half day', emoji: '\u{1F552}', hint: '4 to 5 hours' },
      { label: 'Full day', value: 'Full day', emoji: '\u2600\uFE0F', hint: '8 hours or more' },
      { label: 'Two days', value: 'Two days', emoji: '\u{1F5D3}\uFE0F', hint: 'Slow and thorough' },
    ],
  },
  {
    id: 'interests',
    required: true,
    multi: true,
    question: 'What are you most drawn to?',
    rationale: 'Pick as many as you like. These decide which places make the cut.',
    options: [
      { label: 'Royal heritage', value: 'culture', emoji: '\u{1F3F8}' },
      { label: 'Street food', value: 'food', emoji: '\u{1F372}' },
      { label: 'Artisan workshops', value: 'workshop', emoji: '\u{1F3A8}' },
      { label: 'Offbeat gems', value: 'hidden_gem', emoji: '\u{1F48E}' },
      { label: 'Ghats and aarti', value: 'spiritual', emoji: '\u{1FAA6}' },
      { label: 'Nature and beaches', value: 'nature', emoji: '\u{1F33F}' },
      { label: 'Markets', value: 'shopping', emoji: '\u{1F6CD}' },
      { label: 'Music and nightlife', value: 'nightlife', emoji: '\u{1F3B5}' },
    ],
  },
  {
    id: 'budget',
    required: true,
    question: 'What budget feels comfortable for the day?',
    rationale: 'I keep the total honest, entry fees and food included.',
    options: [
      { label: 'Under \u20B91,000', value: 'Under 1,000', emoji: '\u{1F4B4}' },
      { label: '\u20B91,000 to 3,000', value: '1,000 to 3,000', emoji: '\u{1F4B0}' },
      { label: '\u20B93,000 to 6,000', value: '3,000 to 6,000', emoji: '\u{1F4B8}' },
      { label: 'No fixed limit', value: 'No fixed limit', emoji: '\u{1F3E6}' },
    ],
  },
  {
    id: 'pace',
    required: true,
    question: 'What pace feels right?',
    rationale: 'A packed day and an unhurried one need very different itineraries.',
    options: [
      { label: 'Relaxed', value: 'Relaxed', emoji: '\u{1F9D8}', hint: 'Slow and breathable' },
      { label: 'Balanced', value: 'Balanced', emoji: '\u2696\uFE0F', hint: 'A stop or two, then move on' },
      { label: 'Fit it all in', value: 'Packed', emoji: '\u26F1', hint: 'Maximise the day' },
    ],
  },
  {
    id: 'startTime',
    required: false,
    question: 'When are you heading out?',
    rationale: 'Morning light, evening aarti and night markets are completely different days.',
    options: [
      { label: 'Morning', value: 'Morning', emoji: '\u{1F305}', hint: '6am to 11am' },
      { label: 'Afternoon', value: 'Afternoon', emoji: '\u{1F31E}', hint: '11am to 4pm' },
      { label: 'Evening', value: 'Evening', emoji: '\u{1F306}', hint: '4pm to 9pm' },
      { label: 'Night', value: 'Night', emoji: '\u{1F319}', hint: 'After 9pm' },
    ],
  },
  {
    id: 'crowdVibe',
    required: false,
    question: 'How do you feel about crowds?',
    rationale: 'I can bias towards quiet courtyards or the liveliest streets.',
    options: [
      { label: 'Quiet corners', value: 'Quiet corners', emoji: '\u{1F6D5}' },
      { label: 'Either way', value: 'Balanced', emoji: '\u2696\uFE0F' },
      { label: 'The buzz', value: 'Lively', emoji: '\u{1F389}' },
    ],
  },
  {
    id: 'accessibility',
    required: false,
    question: 'Any mobility needs I should plan around?',
    rationale: 'I will filter out steep climbs, long walks and stair heavy routes.',
    options: [
      { label: 'Minimal walking', value: 'Minimal walking', emoji: '\u{1F6B6}' },
      { label: 'Step free', value: 'Step free', emoji: '\u267F' },
      { label: 'Seating needed', value: 'Seating', emoji: '\u{1FA91}' },
      { label: 'None', value: 'None', emoji: '\u2714\uFE0F' },
    ],
  },
  {
    id: 'dietary',
    required: false,
    question: 'Food preferences for the stops I pick?',
    rationale: 'Street food recommendations are very different for a Jain table.',
    options: [
      { label: 'Vegetarian', value: 'Vegetarian', emoji: '\u{1F957}' },
      { label: 'Vegan', value: 'Vegan', emoji: '\u{1F96C}' },
      { label: 'Jain', value: 'Jain', emoji: '\u{1F96D}' },
      { label: 'No restriction', value: 'No restriction', emoji: '\u{1F37F}\uFE0F' },
    ],
  },
];

export const INTEREST_LABELS: Record<string, string> = INTERVIEW_QUESTIONS.find(
  (q) => q.id === 'interests'
)!.options.reduce<Record<string, string>>((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

const REQUIRED_DIMENSIONS: BriefDimension[] = INTERVIEW_QUESTIONS.filter((q) => q.required).map(
  (q) => q.id
);

// ===========================================================================
// Harvesting brief dimensions from free text
// ===========================================================================

const COMPANION_RULES: Array<{ value: string; size: number; re: RegExp }> = [
  { value: 'seniors', size: 2, re: /\b(elders|elderly|seniors?|grandparents?|grandmother|grandfather|my parents|with my parents)\b/i },
  { value: 'family', size: 4, re: /\b(family|kids?|children|child|toddler|baby|son|daughter)\b/i },
  { value: 'couple', size: 2, re: /\b(couples?|partners?|wife|husband|boyfriend|girlfriend|honeymoon|anniversary)\b/i },
  { value: 'friends', size: 4, re: /\b(friends?|buddies|colleagues|batch|group)\b/i },
  { value: 'solo', size: 1, re: /\b(solo|alone|by myself|on my own|myself)\b/i },
];

const PACE_RULES: Array<{ value: string; re: RegExp }> = [
  { value: 'Relaxed', re: /\b(relaxed|slow|unhurried|easy|leisurely|laid back|no rush|not in a hurry|gentle)\b/i },
  { value: 'Packed', re: /\b(fit in|pack(ed|ing)?|as much as possible|maximi[sz]e|cover a lot|see everything|all of it)\b/i },
];

const START_TIME_RULES: Array<{ value: string; re: RegExp }> = [
  { value: 'Morning', re: /\b(morning|early|dawn|sunrise|before noon)\b/i },
  { value: 'Evening', re: /\b(evening|sunset|golden hour|after work|dusk)\b/i },
  { value: 'Night', re: /\b(night|late night|midnight|after 9|late evening)\b/i },
  { value: 'Afternoon', re: /\b(afternoon|noon|midday|lunch time|post lunch)\b/i },
];

const CROWD_RULES: Array<{ value: string; re: RegExp }> = [
  { value: 'Quiet corners', re: /\b(quiets?|quieter|less crowded|crowd free|not touristy|non touristy|offbeat|off the beaten|hidden|under the radar|calm|serene|peaceful|less busy)\b/i },
  { value: 'Lively', re: /\b(crowds?|crowded|busy|buzz|popular|lively|vibrant|packed)\b/i },
];

const ACCESSIBILITY_RULES: Array<{ value: string; re: RegExp }> = [
  { value: 'Step free', re: /\b(wheelchair|step free|stepfree|ramps?|no stairs)\b/i },
  { value: 'Minimal walking', re: /\b(low walking|less walking|minimal walking|avoid walking|cannot walk|hard time walking|senior|elderly)\b/i },
  { value: 'Seating', re: /\b(seating|need to sit|bench|rest stops|fatigue)\b/i },
];

const DIETARY_RULES: Array<{ value: string; re: RegExp }> = [
  { value: 'Vegan', re: /\b(vegan)\b/i },
  { value: 'Jain', re: /\b(jain)\b/i },
  { value: 'Vegetarian', re: /\b(vegetarian|veg only|veg\b|shakahari| Jain\b)\b/i },
  { value: 'No restriction', re: /\b(no restriction|no preference|eat anything|non veg|nonveg)\b/i },
];

const INTEREST_RULES: Array<{ value: string; re: RegExp }> = [
  {
    value: 'culture',
    re: /\b(heritage|palaces?|forts?|fortresses?|monuments?|museums?|history|historical|rajput|mughal|sikh|archaeolog\w*|architecture|landmarks?|havelis?|jantar mantar|old city|walled city)\b/i,
  },
  {
    value: 'food',
    re: /\b(food|foods|eat|eating|street food|culinary|kitchen|chaat|dosas?|biryani|thalis?|kathi roll|chai|snacks?|desserts?|sweets?|restaurant|restaurants|cafes?|hunger|hungry|breakfast|lunch|dinner|brunch|seafood|bbq)\b/i,
  },
  {
    value: 'workshop',
    re: /\b(workshops?|craft|crafts|artisan|artisans|pottery|textiles?|weav\w*|handloom|block print|handmade|embroid\w*|master crafts\w*|learn|hands on)\b/i,
  },
  {
    value: 'hidden_gem',
    // Deliberate phrases only. Words like "authentic" are too generic to pin
    // a traveler to offbeat spots without them actually asking for it.
    re: /\b(hidden gems?|offbeat|off the beaten|not touristy|non touristy|under the radar|lesser known|secret spot|secret places?|unexplored|unusual)\b/i,
  },
  {
    value: 'spiritual',
    re: /\b(ghats?|aarti|spiritual|meditat\w*|yoga|ashrams?|temples?|sacred|pilgrim|riverfront|puja|saint|sufi)\b/i,
  },
  {
    value: 'nature',
    re: /\b(nature|beaches?|waterfalls?|wildlife|birds?|hills?|mountains?|trek\w*|hikes?|gardens?|parks?|lakes?|backwaters?|sunset point|scenic|boating|forest|desert|safari)\b/i,
  },
  {
    value: 'shopping',
    re: /\b(shops?|shopping|markets?|bazaars?|souvenirs?|jewell?ery|spices?|textile shopping)\b/i,
  },
  {
    value: 'nightlife',
    re: /\b(nightlife|night market|live music|music|dance|dancing|qawwali|classical|pubs?|rooftop bar|bars?|nightclub|jam session)\b/i,
  },
];

const toRupees = (raw: string): number => {
  const value = parseFloat(raw.replace(/,/g, ''));
  if (isNaN(value)) return 0;
  return value;
};

const budgetTierFromAmount = (amount: number): string | null => {
  if (!amount || amount <= 0) return null;
  if (amount <= 1000) return 'Under 1,000';
  if (amount <= 3000) return '1,000 to 3,000';
  if (amount <= 6000) return '3,000 to 6,000';
  return 'No fixed limit';
};

const timeTierFromHours = (hours: number): string | null => {
  if (hours <= 0) return null;
  if (hours <= 3.5) return '2 to 3 hours';
  if (hours <= 5.5) return 'Half day';
  if (hours <= 10) return 'Full day';
  return 'Two days';
};

/**
 * Reads a traveller utterance and fills in every brief dimension it can prove.
 * Existing values are never overwritten, so explicit chip taps always win.
 */
export function harvestBriefFromText(text: string, base: TripBrief = EMPTY_BRIEF): TripBrief {
  const next: TripBrief = { ...base, interests: [...(base.interests || [])] };
  if (!text || typeof text !== 'string') return next;

  // Companions and group size
  if (!next.companions) {
    for (const rule of COMPANION_RULES) {
      if (rule.re.test(text)) {
        next.companions = rule.value;
        break;
      }
    }
  }
  if (!next.groupSize) {
    const explicit = text.match(/(\d+)\s*(people|persons?|pax|guests|adults|of us|travelers?|travellers?)/i);
    if (explicit) {
      next.groupSize = Math.max(1, parseInt(explicit[1], 10));
    } else if (next.companions) {
      const rule = COMPANION_RULES.find((r) => r.value === next.companions);
      if (rule) next.groupSize = rule.size;
    }
  }

  // Time budget
  if (!next.timeBudget) {
    const days = text.match(/(\d+)\s*(days?)/i);
    const hours = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/i);
    if (days && parseInt(days[1], 10) >= 2) {
      next.timeBudget = 'Two days';
    } else if (hours) {
      next.timeBudget = timeTierFromHours(parseFloat(hours[1]));
    } else if (/\bhalf\s*day\b/i.test(text)) {
      next.timeBudget = 'Half day';
    } else if (/\b(full day|entire day|whole day)\b/i.test(text)) {
      next.timeBudget = 'Full day';
    } else if (/\bweekend\b/i.test(text)) {
      next.timeBudget = 'Two days';
    } else if (/\b(morning|afternoon|evening|night)\b/i.test(text) && /\b(free|available|have|got|spend)\b/i.test(text)) {
      next.timeBudget = 'Half day';
    }
  }

  // Budget
  if (!next.budget) {
    const thousands = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k\b|thousand)/i);
    const lakhs = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac)\b/i);
    // Trailing currency unit, the way people actually speak: "2000 rupees"
    const trailingCurrency = text.match(/([\d,]+(?:\.\d+)?)\s*(?:rupees|rupee|rs\.?|inr|₹)/i);
    // Leading currency unit or an explicit budget phrase
    const plain = text.match(/(?:₹|rs\.?|inr|budget[^0-9]{0,12})\s*([\d,]+)/i);
    if (lakhs) {
      next.budget = budgetTierFromAmount(toRupees(lakhs[1]) * 100000);
    } else if (thousands) {
      next.budget = budgetTierFromAmount(toRupees(thousands[1]) * 1000);
    } else if (trailingCurrency) {
      next.budget = budgetTierFromAmount(toRupees(trailingCurrency[1]));
    } else if (plain) {
      next.budget = budgetTierFromAmount(toRupees(plain[1]));
    } else if (/\b(budget is tight|very tight|save money|cheap|affordable)\b/i.test(text)) {
      next.budget = 'Under 1,000';
    } else if (/\b(luxury|premium|splurge|indulgent)\b/i.test(text)) {
      next.budget = '3,000 to 6,000';
    }
  }

  // Pace
  if (!next.pace) {
    for (const rule of PACE_RULES) {
      if (rule.re.test(text)) {
        next.pace = rule.value;
        break;
      }
    }
  }

  // Start time, crowd vibe, accessibility, dietary
  if (!next.startTime) {
    for (const rule of START_TIME_RULES) {
      if (rule.re.test(text)) {
        next.startTime = rule.value;
        break;
      }
    }
  }
  if (!next.crowdVibe) {
    for (const rule of CROWD_RULES) {
      if (rule.re.test(text)) {
        next.crowdVibe = rule.value;
        break;
      }
    }
  }
  if (!next.accessibility) {
    for (const rule of ACCESSIBILITY_RULES) {
      if (rule.re.test(text)) {
        next.accessibility = rule.value;
        break;
      }
    }
  }
  if (!next.dietary) {
    for (const rule of DIETARY_RULES) {
      if (rule.re.test(text)) {
        next.dietary = rule.value;
        break;
      }
    }
  }

  // Interests are additive
  for (const rule of INTEREST_RULES) {
    if (rule.re.test(text) && !next.interests.includes(rule.value)) {
      next.interests.push(rule.value);
    }
  }

  return next;
}

// ===========================================================================
// Engine
// ===========================================================================

export const isDimensionAnswered = (brief: TripBrief, id: BriefDimension): boolean => {
  switch (id) {
    case 'interests':
      return brief.interests.length > 0;
    case 'accessibility':
      return brief.accessibility !== null && brief.accessibility !== 'None';
    case 'dietary':
      return brief.dietary !== null && brief.dietary !== 'No restriction';
    case 'crowdVibe':
      return brief.crowdVibe !== null && brief.crowdVibe !== 'Balanced';
    default:
      return Boolean((brief as unknown as Record<string, unknown>)[id]);
  }
};

/**
 * Returns the next single question, or null when there is nothing left to ask.
 * Only the five required dimensions are volunteered by default. Optional
 * refinements (timing, crowd mood, mobility, diet) are offered exclusively
 * when the traveler explicitly asks to add more detail, which keeps the
 * interview to a handful of taps.
 */
export function getNextQuestion(
  brief: TripBrief,
  skipped: string[] = [],
  options: { includeOptional?: boolean } = {}
): InterviewQuestion | null {
  const includeOptional = options.includeOptional === true;
  const skipSet = new Set(skipped);
  for (const question of INTERVIEW_QUESTIONS) {
    if (!includeOptional && !question.required) continue;
    if (skipSet.has(question.id)) continue;
    if (isDimensionAnswered(brief, question.id)) continue;
    return question;
  }
  return null;
}

export function getQuestionById(id: string): InterviewQuestion | null {
  return INTERVIEW_QUESTIONS.find((q) => q.id === id) || null;
}

/** True when every non skipped required dimension is known. */
export function isBriefReady(brief: TripBrief, skipped: string[] = []): boolean {
  const skipSet = new Set(skipped);
  return REQUIRED_DIMENSIONS.every(
    (id) => skipSet.has(id) || isDimensionAnswered(brief, id)
  );
}

/** True when there is enough signal to produce a genuinely tailored shortlist. */
export function isBriefCuratable(brief: TripBrief): boolean {
  return isDimensionAnswered(brief, 'interests') && isDimensionAnswered(brief, 'timeBudget');
}

export interface BriefProgress {
  answered: number;
  total: number;
  ratio: number;
  stage: number;
  isComplete: boolean;
}

export function getBriefProgress(brief: TripBrief, skipped: string[] = []): BriefProgress {
  const skipSet = new Set(skipped);
  const active = INTERVIEW_QUESTIONS.filter((q) => !skipSet.has(q.id));
  const answered = active.filter((q) => isDimensionAnswered(brief, q.id)).length;
  const total = active.length;
  return {
    answered,
    total,
    ratio: total > 0 ? answered / total : 1,
    stage: Math.min(answered + 1, Math.max(total, 1)),
    isComplete: isBriefReady(brief, skipped),
  };
}

/** Applies a tap (or a confirmed multi selection) to the brief. */
export function applyAnswer(
  brief: TripBrief,
  questionId: BriefDimension,
  values: string[]
): TripBrief {
  const next: TripBrief = { ...brief, interests: [...(brief.interests || [])] };
  switch (questionId) {
    case 'companions': {
      const value = values[0];
      if (!value) return next;
      next.companions = value;
      if (!next.groupSize) {
        const rule = COMPANION_RULES.find((r) => r.value === value);
        next.groupSize = rule ? rule.size : 2;
      }
      return next;
    }
    case 'interests':
      next.interests = values
        .map((value) => String(value))
        .filter(Boolean)
        .slice(0, 6);
      return next;
    default: {
      const value = values[0];
      if (!value) return next;
      (next as unknown as Record<string, unknown>)[questionId] = value;
      return next;
    }
  }
}

/** Turns a chip tap into a natural sentence for the transcript. */
export function answerToSentence(
  question: InterviewQuestion,
  values: string[],
  destination: string | null
): string {
  const where = destination ? ` in ${destination}` : '';
  switch (question.id) {
    case 'companions': {
      const size = COMPANION_RULES.find((r) => r.value === values[0])?.size;
      const who =
        values[0] === 'solo'
          ? 'I am travelling solo'
          : values[0] === 'couple'
          ? 'My partner and I are travelling together'
          : values[0] === 'friends'
          ? 'I am with a group of friends'
          : values[0] === 'family'
          ? 'I am with my family'
          : 'I am travelling with my parents';
      return `${who}${size && size > 2 ? ` (${size} of us)` : ''}${where}.`;
    }
    case 'timeBudget':
      return `I have ${values[0]}${where}.`;
    case 'interests':
      return values.length
        ? `I am most drawn to ${values.map((v) => (INTEREST_LABELS[v] || v).toLowerCase()).join(', ')}${where}.`
        : 'Surprise me with the best spots.';
    case 'budget':
      return values[0] === 'No fixed limit'
        ? `I have no fixed budget limit${where}.`
        : `My budget is ${values[0]} rupees${where}.`;
    case 'pace':
      return `A ${values[0].toLowerCase()} pace suits me${where}.`;
    case 'startTime':
      return `I will be heading out in the ${values[0].toLowerCase()}${where}.`;
    case 'crowdVibe':
      return values[0] === 'Lively'
        ? `I do not mind crowds${where}.`
        : `I would prefer ${values[0].toLowerCase()}${where}.`;
    case 'accessibility':
      return values[0] === 'None'
        ? `No mobility concerns${where}.`
        : `Please plan for ${values[0].toLowerCase()}${where}.`;
    case 'dietary':
      return values[0] === 'No restriction'
        ? `No food restrictions${where}.`
        : `${values[0]} food${where}.`;
    default:
      return `${values.join(', ')}${where}.`;
  }
}

// ===========================================================================
// Grounding payloads
// ===========================================================================

const BUDGET_TO_INR: Record<string, number> = {
  'Under 1,000': 1000,
  '1,000 to 3,000': 3000,
  '3,000 to 6,000': 6000,
  'No fixed limit': 15000,
};

const TIME_TO_HOURS: Record<string, number> = {
  '2 to 3 hours': 3,
  'Half day': 5,
  'Full day': 8,
  'Two days': 16,
};

const TIME_TO_START: Record<string, string> = {
  Morning: '07:00',
  Afternoon: '12:00',
  Evening: '16:30',
  Night: '21:00',
};

const COMPANIONS_TO_TYPE: Record<string, string> = {
  solo: 'Solo Explorer',
  couple: 'Couples / Friends',
  friends: 'Couples / Friends',
  family: 'Family with Kids',
  seniors: 'Family with Kids',
};

/** Human readable brief used both for the transcript summary and the system prompt. */
export function buildBriefSummary(brief: TripBrief): string {
  const parts: string[] = [];
  if (brief.destination) parts.push(`Destination: ${brief.destination}`);
  if (brief.companions) {
    const size = brief.groupSize && brief.groupSize > 1 ? ` (${brief.groupSize} people)` : '';
    parts.push(`Travelling: ${brief.companions}${size}`);
  }
  if (brief.timeBudget) parts.push(`Time available: ${brief.timeBudget}`);
  if (brief.startTime) parts.push(`Starting in the: ${brief.startTime}`);
  if (brief.interests.length) {
    const labels = brief.interests.map((i) => String(INTEREST_LABELS[i] || i).toLowerCase());
    parts.push(`Interests: ${labels.join(', ')}`);
  }
  if (brief.budget) parts.push(`Budget: ${brief.budget} rupees`);
  if (brief.pace) parts.push(`Pace: ${brief.pace}`);
  if (brief.crowdVibe) parts.push(`Crowd preference: ${brief.crowdVibe}`);
  if (brief.accessibility) parts.push(`Mobility: ${brief.accessibility}`);
  if (brief.dietary) parts.push(`Food: ${brief.dietary}`);
  return parts.join('\n');
}

/** The single message that triggers the final, fully grounded curation pass. */
export function buildCurationPrompt(brief: TripBrief): string {
  const where = brief.destination ? ` in ${brief.destination}` : '';
  return `Here is my complete brief${where}, please curate it now.\n\n${buildBriefSummary(brief)}\n\nGive me the best matches for this exact brief. Rank them, then tell me in one short line each why it fits, what it costs, and the best time to go.`;
}

/** Structured profile handed to the concierge endpoint for grounding and ranking. */
export function briefToProfilePayload(brief: TripBrief): Record<string, unknown> {
  return {
    destination: brief.destination,
    companions: brief.companions,
    traveler_type: brief.companions ? COMPANIONS_TO_TYPE[brief.companions] || null : null,
    group_size: brief.groupSize,
    time_budget: brief.timeBudget,
    available_hours: brief.timeBudget ? TIME_TO_HOURS[brief.timeBudget] ?? null : null,
    start_time: brief.startTime ? TIME_TO_START[brief.startTime] || null : null,
    start_period: brief.startTime,
    interests: brief.interests,
    budget_tier: brief.budget,
    budget_inr: brief.budget ? BUDGET_TO_INR[brief.budget] ?? null : null,
    pace: brief.pace,
    crowd_preference: brief.crowdVibe,
    accessibility: brief.accessibility,
    dietary: brief.dietary,
    summary: buildBriefSummary(brief),
  };
}

/** Short spoken acknowledgement played while the next question is asked. */
export function buildQuestionSpokenText(
  question: InterviewQuestion,
  step: number,
  total: number,
  destination: string | null
): string {
  const where = destination ? ` ${destination}` : '';
  return `Step ${step} of ${total}. ${question.question}${where ? `, in${where}` : ''}. ${question.rationale}`;
}

// ===========================================================================
// Persistence
// ===========================================================================

export const BRIEF_STORAGE_KEY = 'lokiva_concierge_brief';

export function loadStoredBrief(): TripBrief {
  try {
    const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
    if (!raw) return { ...EMPTY_BRIEF, interests: [] };
    const parsed = JSON.parse(raw);
    return {
      ...EMPTY_BRIEF,
      ...parsed,
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
    };
  } catch {
    return { ...EMPTY_BRIEF, interests: [] };
  }
}

export function saveStoredBrief(brief: TripBrief): void {
  try {
    localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify({ ...brief, savedAt: Date.now() }));
  } catch {
    // Storage is optional, the interview still works in memory.
  }
}

export function clearStoredBrief(): void {
  try {
    localStorage.removeItem(BRIEF_STORAGE_KEY);
  } catch {
    // No-op
  }
}
