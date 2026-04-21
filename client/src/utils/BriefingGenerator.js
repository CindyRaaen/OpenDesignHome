// ═══════════════════════════════════════════════════════════════════════════
// AI BRIEFING GENERATOR — Procedural client personas & challenge scenarios
//
// Produces realistic, diverse client briefs that feel like a first meeting
// with a real human — with personality, contradictions, life context,
// collections, accessibility needs, and strong opinions about what "home" means.
//
// Architecture:
//   1. Client Archetypes — demographic + psychographic templates
//   2. Life Detail Pools — travel, collections, careers, households
//   3. Style DNA — preferred designers, era affinities, density preferences
//   4. Constraint Generator — room-specific functional requirements
//   5. Brief Assembler — combines everything into scoringCriteria format
//   6. Story Writer — generates the narrative brief text
//
// The output format is compatible with ChallengeFlow's DEFAULT_BRIEF schema.
// ═══════════════════════════════════════════════════════════════════════════

// ── UTILITY ─────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── CLIENT ARCHETYPES ───────────────────────────────────────────────────
// Each archetype defines a personality template. The generator mixes
// archetype traits with random life details to create unique clients.

const CLIENT_ARCHETYPES = [
  {
    id: 'worldly_collector',
    name: 'The Worldly Collector',
    ageRange: [55, 82],
    densityPreference: 'high', // wants MORE stuff, not less
    traits: ['traveled extensively', 'sentimental about objects', 'strong opinions', 'stories for every piece'],
    homePhilosophy: 'gallery', // home as display of life
    styleAffinities: ['eclectic', 'bohemian', 'maximalist', 'mediterranean'],
    dealBreakers: ['sterile minimalism', 'matching sets', 'hiding collections'],
    scoringBias: { layering: 1.2, narrative: 1.3, style: 0.8 }, // reward density + story, relax style purity
    storyTemplates: [
      "I've collected {material} from {count} countries over {years} years. Every piece has a story and I want them all to breathe in this room.",
      "My grandchildren call my house 'the museum.' I call it my life. Help me display {years} years of memories without it looking like a storage unit.",
    ],
  },
  {
    id: 'young_minimalist',
    name: 'The Intentional Minimalist',
    ageRange: [26, 38],
    densityPreference: 'low',
    traits: ['deliberate', 'quality over quantity', 'tech-forward', 'sustainability-minded'],
    homePhilosophy: 'sanctuary', // home as retreat
    styleAffinities: ['minimalist', 'japanese', 'scandinavian', 'modern'],
    dealBreakers: ['clutter', 'ornate details', 'fast furniture'],
    scoringBias: { spatial: 1.2, color: 1.1, layering: 0.7 },
    storyTemplates: [
      "I just did a massive purge. I own exactly what I need. Now I want each piece in this room to earn its place.",
      "I work from home in tech and my brain is overstimulated all day. This room needs to be the opposite of my screen — calm, quiet, essential.",
    ],
  },
  {
    id: 'busy_family',
    name: 'The Busy Family',
    ageRange: [32, 48],
    densityPreference: 'medium',
    traits: ['practical', 'durability-focused', 'kid-friendly', 'needs storage'],
    homePhilosophy: 'gathering', // home as social hub
    styleAffinities: ['transitional', 'farmhouse', 'contemporary', 'coastal'],
    dealBreakers: ['fragile materials', 'sharp corners', 'white upholstery'],
    scoringBias: { brief: 1.3, spatial: 1.2, narrative: 0.8 },
    storyTemplates: [
      "Three kids, two dogs, and my mother-in-law visits every other weekend. This room needs to survive all of that and still look like adults live here.",
      "I want a room where the kids can do homework while I cook, where we can host 12 for Thanksgiving, and where I can collapse on the sofa at 9pm and feel like a human.",
    ],
  },
  {
    id: 'design_obsessed',
    name: 'The Design Obsessed',
    ageRange: [30, 55],
    densityPreference: 'curated',
    traits: ['follows design media', 'name-drops designers', 'Instagram-aware', 'strong aesthetic opinions'],
    homePhilosophy: 'statement', // home as expression
    styleAffinities: ['modern', 'artDeco', 'hollywood', 'midCentury'],
    dealBreakers: ['boring', 'generic', 'builder-grade anything'],
    scoringBias: { style: 1.3, color: 1.2, wall: 1.1 },
    storyTemplates: [
      "I just got back from Milan Design Week and I'm inspired. I want this room to feel like it could be in Architectural Digest — but actually livable.",
      "I've been saving a {designerName} piece for two years and the whole room needs to be built around it. Don't make it compete with anything.",
    ],
  },
  {
    id: 'aging_in_place',
    name: 'The Aging-in-Place Planner',
    ageRange: [62, 80],
    densityPreference: 'medium',
    traits: ['accessibility-conscious', 'comfort-first', 'nostalgia', 'quality craftsmanship'],
    homePhilosophy: 'sanctuary',
    styleAffinities: ['traditional', 'transitional', 'farmhouse'],
    dealBreakers: ['trip hazards', 'low seating', 'dark rooms'],
    scoringBias: { spatial: 1.4, brief: 1.3, layering: 0.9 },
    storyTemplates: [
      "I'm not leaving this house. My knees aren't what they were, and I need this room to work for me for the next 20 years. Comfortable, safe, and still beautiful.",
      "My husband uses a walker now. We need wide paths, nothing to trip on, and seating we can actually get out of. But I refuse to live in a hospital.",
    ],
  },
  {
    id: 'newlywed',
    name: 'The Fresh Start',
    ageRange: [25, 35],
    densityPreference: 'medium',
    traits: ['merging two styles', 'budget-conscious', 'aspirational', 'open to ideas'],
    homePhilosophy: 'nest', // building together
    styleAffinities: ['contemporary', 'scandinavian', 'modern', 'transitional'],
    dealBreakers: ['too masculine', 'too feminine', 'college dorm vibes'],
    scoringBias: { color: 1.1, style: 1.2, narrative: 1.1 },
    storyTemplates: [
      "We just merged two apartments. He's mid-century everything, I'm more bohemian. We need to find our shared style in this room without either of us losing ourselves.",
      "First home together. Small budget, big dreams. We want it to feel intentional, not 'just moved in.' Something we can grow into.",
    ],
  },
  {
    id: 'empty_nester',
    name: 'The Reinventor',
    ageRange: [50, 65],
    densityPreference: 'curated',
    traits: ['rediscovering self', 'upgrading from kid-proof', 'willing to invest', 'specific tastes'],
    homePhilosophy: 'rebirth', // home as new chapter
    styleAffinities: ['modern', 'contemporary', 'artDeco', 'midCentury'],
    dealBreakers: ['anything that reminds me of sippy cups', 'builder beige'],
    scoringBias: { style: 1.2, color: 1.2, layering: 1.1 },
    storyTemplates: [
      "The last kid just left. I've been living with stain-resistant everything for 22 years. I want velvet. I want glass. I want things I was too afraid to buy before.",
      "It's my time now. I want this room to feel like the person I am, not the parent I had to be. Sophisticated, a little bold, completely mine.",
    ],
  },
  {
    id: 'creative_pro',
    name: 'The Creative Professional',
    ageRange: [28, 50],
    densityPreference: 'curated',
    traits: ['visual thinker', 'needs inspiration', 'eclectic taste', 'values authenticity'],
    homePhilosophy: 'workshop', // home as creative fuel
    styleAffinities: ['eclectic', 'industrial', 'bohemian', 'midCentury'],
    dealBreakers: ['corporate sterile', 'matchy-matchy', 'fake anything'],
    scoringBias: { narrative: 1.3, layering: 1.2, color: 1.1 },
    storyTemplates: [
      "I'm a {career} and my home feeds my work. I need visual texture, interesting objects, things that make me think. Not Pinterest-perfect — real.",
      "I work in {career} and every surface in my life is curated by committee. My home is the one place I get to be weird. Let it be interesting.",
    ],
  },
  {
    id: 'entertainer',
    name: 'The Host',
    ageRange: [35, 60],
    densityPreference: 'medium',
    traits: ['loves hosting', 'flow matters', 'bar area', 'conversation layout'],
    homePhilosophy: 'gathering',
    styleAffinities: ['hollywood', 'contemporary', 'artDeco', 'transitional'],
    dealBreakers: ['room that fights socializing', 'no bar area', 'dead corners'],
    scoringBias: { spatial: 1.3, brief: 1.2, wall: 1.0 },
    storyTemplates: [
      "I host dinner for 8 every Friday and cocktails for 20 once a month. This room needs to flow for conversation, have a proper bar moment, and make people want to stay late.",
      "My friends joke that my house is the neighborhood clubhouse. I need this room to do double duty — intimate Tuesday evenings and packed Saturday nights.",
    ],
  },
  {
    id: 'wellness_seeker',
    name: 'The Wellness Seeker',
    ageRange: [30, 55],
    densityPreference: 'low',
    traits: ['biophilic', 'natural light obsessed', 'texture sensitive', 'calm colors'],
    homePhilosophy: 'sanctuary',
    styleAffinities: ['japanese', 'scandinavian', 'minimalist', 'coastal'],
    dealBreakers: ['synthetic materials', 'harsh lighting', 'visual clutter'],
    scoringBias: { layering: 1.2, spatial: 1.2, color: 1.1 },
    storyTemplates: [
      "I just finished a silent retreat and I want my home to hold that feeling. Natural materials, nothing synthetic, lots of plants, and light that changes through the day.",
      "I have sensory processing sensitivity. Harsh textures, loud colors, and clutter physically exhaust me. This room needs to be my reset button.",
    ],
  },
];

// ── LIFE DETAIL POOLS ───────────────────────────────────────────────────

const FIRST_NAMES = [
  'Maya', 'James', 'Priya', 'Carlos', 'Mei-Lin', 'Olga', 'Ahmed', 'Kenji',
  'Fatima', 'Liam', 'Yara', 'Dmitri', 'Ines', 'Marcus', 'Suki', 'Rafael',
  'Astrid', 'Kofi', 'Elena', 'Declan', 'Noor', 'Björn', 'Amara', 'Theo',
  'Lucia', 'Hiroshi', 'Zara', 'Matteo', 'Anika', 'Owen', 'Camille', 'Ravi',
];

const LAST_NAMES = [
  'Chen', 'Okafor', 'Petrova', 'Mendoza', 'Nakamura', 'Larsson', 'Bianchi',
  'Abadi', 'Park', 'O\'Brien', 'Moreau', 'Gupta', 'Osei', 'Kowalski', 'Kim',
  'Reyes', 'Dubois', 'Watanabe', 'Costa', 'Johansson', 'Hassan', 'Müller',
];

const CAREERS = [
  'ceramicist', 'photographer', 'architect', 'chef', 'writer', 'professor',
  'filmmaker', 'gallerist', 'textile artist', 'graphic designer', 'musician',
  'art director', 'landscape designer', 'jeweler', 'software engineer',
  'physician', 'lawyer', 'nonprofit director', 'restaurateur', 'curator',
  'yoga instructor', 'venture capitalist', 'retired teacher', 'marine biologist',
];

const COLLECTION_TYPES = [
  'hand-thrown pottery', 'antique textiles', 'vintage photography', 'African masks',
  'mid-century ceramics', 'Japanese woodblock prints', 'Moroccan rugs', 'blown glass',
  'folk art', 'rare books', 'vinyl records', 'vintage maps', 'tribal jewelry',
  'Art Deco bronzes', 'Scandinavian pottery', 'handwoven baskets', 'oil paintings',
  'carved wooden figures', 'antique clocks', 'contemporary sculpture',
];

const TRAVEL_REGIONS = [
  'Southeast Asia', 'Scandinavia', 'North Africa', 'Japan', 'Italy', 'India',
  'Mexico', 'Turkey', 'France', 'Greece', 'Portugal', 'Peru', 'Morocco',
  'South Korea', 'Bali', 'Iceland', 'Colombia', 'Egypt', 'Vietnam', 'Spain',
];

const HOUSE_TYPES = [
  { type: '1920s bungalow', features: ['original hardwoods', 'built-in bookshelves', 'crown molding'] },
  { type: 'mid-century ranch', features: ['open floor plan', 'floor-to-ceiling windows', 'beamed ceiling'] },
  { type: 'Victorian rowhouse', features: ['pocket doors', 'marble fireplace', 'high ceilings'] },
  { type: 'modern loft', features: ['exposed brick', 'concrete floors', 'industrial windows'] },
  { type: 'coastal cottage', features: ['shiplap walls', 'screened porch', 'wide plank floors'] },
  { type: 'suburban colonial', features: ['formal dining room', 'bay windows', 'wainscoting'] },
  { type: 'adobe hacienda', features: ['saltillo tile', 'courtyard', 'kiva fireplace'] },
  { type: 'brownstone', features: ['original moldings', 'parlor floor', 'garden level'] },
  { type: 'A-frame cabin', features: ['vaulted ceiling', 'wood paneling', 'stone fireplace'] },
  { type: 'penthouse apartment', features: ['panoramic views', 'terrace access', 'open plan'] },
  { type: 'farmhouse', features: ['wraparound porch', 'barn door', 'apron sink'] },
  { type: 'Eichler', features: ['atrium', 'post-and-beam', 'radiant heat floors'] },
];

const ROOM_TYPES = [
  { room: 'Living Room', sqftRange: [200, 450], dims: { w: [180, 300], d: [160, 240] } },
  { room: 'Primary Bedroom', sqftRange: [180, 350], dims: { w: [168, 240], d: [144, 216] } },
  { room: 'Dining Room', sqftRange: [140, 280], dims: { w: [144, 216], d: [120, 192] } },
  { room: 'Home Office', sqftRange: [100, 200], dims: { w: [120, 192], d: [108, 168] } },
  { room: 'Family Room', sqftRange: [250, 500], dims: { w: [192, 300], d: [168, 264] } },
  { room: 'Guest Bedroom', sqftRange: [120, 220], dims: { w: [132, 192], d: [120, 168] } },
  { room: 'Nursery', sqftRange: [100, 180], dims: { w: [120, 168], d: [108, 156] } },
  { room: 'Reading Room', sqftRange: [100, 180], dims: { w: [120, 168], d: [108, 156] } },
];

const DESIGNER_HEROES = [
  { name: 'Kelly Wearstler', style: 'maximalist', era: 'modern' },
  { name: 'Axel Vervoordt', style: 'wabi-sabi', era: 'timeless' },
  { name: 'Ilse Crawford', style: 'human-centered', era: 'modern' },
  { name: 'Jean-Louis Deniot', style: 'neoclassical', era: 'classical' },
  { name: 'India Mahdavi', style: 'color-bold', era: 'modern' },
  { name: 'Nate Berkus', style: 'personal-eclectic', era: 'modern' },
  { name: 'Vincent Van Duysen', style: 'warm-minimal', era: 'modern' },
  { name: 'Peter Marino', style: 'material-luxury', era: 'modern' },
  { name: 'Tadao Ando', style: 'minimal-spiritual', era: 'modern' },
  { name: 'Rose Uniacke', style: 'restrained-warmth', era: 'timeless' },
  { name: 'Joanna Gaines', style: 'modern-farmhouse', era: 'contemporary' },
  { name: 'Bobby Berk', style: 'approachable-modern', era: 'contemporary' },
  { name: 'Emily Henderson', style: 'rule-based-eclectic', era: 'contemporary' },
  { name: 'Charlotte Moss', style: 'traditional-timeless', era: 'classical' },
];

const PETS = ['a golden retriever', 'two cats', 'three rescue dogs', 'a parrot', 'a large aquarium', 'two huskies'];
const HOUSEHOLDS = [
  'lives alone', 'with partner', 'with partner and toddler', 'with two teenagers',
  'with three kids under 10', 'with elderly parent', 'empty nest couple',
  'with partner and two cats', 'with roommate', 'multigenerational household',
];

const COLOR_TEMPS = ['warm', 'cool', 'neutral', 'bold', 'earthy', 'moody'];
const BUDGET_TIERS = ['tight', 'mid', 'comfortable', 'luxury'];
const DIFFICULTY_LEVELS = ['member', 'studio-pro', 'atelier'];

// ── CONSTRAINT TEMPLATES ────────────────────────────────────────────────
// Room-specific functional requirements the client might demand

const CONSTRAINT_POOL = {
  'Living Room': [
    'Keep the fireplace as the focal point',
    'Must seat at least {n} people for conversation',
    'No TV in this room',
    'TV must be integrated without dominating',
    'Need a reading nook by the window',
    'Bar cart or drink station essential',
    'Must work for yoga/meditation in the morning',
    'Dog bed needs a dedicated spot',
    'Piano stays — design around it',
  ],
  'Primary Bedroom': [
    'King bed is non-negotiable',
    'Need a proper vanity/dressing area',
    'No overhead lighting — lamps only',
    'Must have blackout capability',
    'Reading chairs by the window',
    'No TV in the bedroom',
    'Walk-in closet stays open to room',
  ],
  'Dining Room': [
    'Must seat {n} for holidays',
    'Double as homework station during the week',
    'Buffet or sideboard for serving',
    'Display cabinet for china collection',
    'Wants a statement chandelier',
  ],
  'Home Office': [
    'Dual monitor setup required',
    'Must look professional for video calls',
    'Storage for {career} materials',
    'Standing desk option',
    'Needs a guest chair for clients',
    'Bookshelf wall — floor to ceiling',
  ],
};

// Accessibility constraints (triggered by archetype or age)
const ACCESSIBILITY_CONSTRAINTS = [
  'Wheelchair turning radius (60") in main path',
  'No rugs with curling edges — trip hazard',
  'Seating height minimum 18" for easy standing',
  'Wide pathways — 36" minimum clearance',
  'Good ambient lighting — no dark corners',
  'Lever-style door hardware, no knobs',
  'Non-slip flooring surfaces',
];

// Universal "keep" constraints based on house features
const KEEP_CONSTRAINTS = [
  'Keep the {feature}',
  'Don\'t touch the {feature} — it\'s original',
  '{feature} stays — build around it',
];

// ── PALETTE GENERATION ──────────────────────────────────────────────────

const PALETTE_MOODS = {
  warm: { bases: ['#E8D5B7','#D4A574','#F5F0E8','#E8C07D'], accents: ['#C1440E','#8B4513','#C8AA78'] },
  cool: { bases: ['#E8E4DE','#D4D8DC','#F0F4F8','#C5CED6'], accents: ['#2C3E50','#4A6741','#5B7B8C'] },
  neutral: { bases: ['#F5F0E8','#E8E4DE','#D4C5A9','#C8BFB0'], accents: ['#4A4A48','#6B5E50','#8B7D6B'] },
  bold: { bases: ['#F4ECD8','#E8E4DE','#2C3E50','#1a1a1a'], accents: ['#C1440E','#2E5A88','#7B2D8B'] },
  earthy: { bases: ['#E8D5B7','#D4C5A9','#C8BFB0','#B8A898'], accents: ['#5B7553','#8B6914','#6B4E3D'] },
  moody: { bases: ['#2C3E50','#3A3A3A','#4A4A48','#2B2B2B'], accents: ['#C8AA78','#C1440E','#5B7553'] },
};

function generatePalette(tempPref) {
  const mood = PALETTE_MOODS[tempPref] || PALETTE_MOODS.neutral;
  const bases = pickN(mood.bases, 3);
  const accents = pickN(mood.accents, 2);
  return [...bases, ...accents];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a complete client brief with persona, constraints, and scoring criteria.
 * @param {object} options - Optional overrides
 * @param {string} options.archetype - Force a specific archetype id
 * @param {string} options.room - Force a specific room type
 * @param {string} options.difficulty - Force difficulty level
 * @returns {object} Brief compatible with ChallengeFlow's DEFAULT_BRIEF schema
 */
export function generateBrief(options = {}) {
  // 1. Pick archetype
  const archetype = options.archetype
    ? CLIENT_ARCHETYPES.find(a => a.id === options.archetype) || pick(CLIENT_ARCHETYPES)
    : pick(CLIENT_ARCHETYPES);

  // 2. Generate client identity
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const clientName = `${firstName} ${lastName}`;
  const age = randBetween(archetype.ageRange[0], archetype.ageRange[1]);
  const career = pick(CAREERS);
  const household = pick(HOUSEHOLDS);
  const pet = Math.random() > 0.5 ? pick(PETS) : null;

  // 3. Pick house and room
  const house = pick(HOUSE_TYPES);
  const roomInfo = options.room
    ? ROOM_TYPES.find(r => r.room === options.room) || pick(ROOM_TYPES)
    : pick(ROOM_TYPES);
  const sqft = randBetween(roomInfo.sqftRange[0], roomInfo.sqftRange[1]);
  const roomW = randBetween(roomInfo.dims.w[0], roomInfo.dims.w[1]);
  const roomD = randBetween(roomInfo.dims.d[0], roomInfo.dims.d[1]);

  // 4. Style DNA
  const primaryStyle = pick(archetype.styleAffinities);
  const designerHero = Math.random() > 0.4 ? pick(DESIGNER_HEROES) : null;
  const colorTemp = pick(COLOR_TEMPS);
  const budget = pick(BUDGET_TIERS);
  const difficulty = options.difficulty || pick(DIFFICULTY_LEVELS);

  // 5. Collections and travel (especially for collector types)
  const collections = archetype.id === 'worldly_collector'
    ? pickN(COLLECTION_TYPES, randBetween(2, 4))
    : Math.random() > 0.6 ? pickN(COLLECTION_TYPES, 1) : [];
  const travelRegions = archetype.id === 'worldly_collector'
    ? pickN(TRAVEL_REGIONS, randBetween(4, 8))
    : Math.random() > 0.5 ? pickN(TRAVEL_REGIONS, randBetween(1, 3)) : [];
  const countriesVisited = travelRegions.length > 0 ? randBetween(travelRegions.length * 3, travelRegions.length * 8) : 0;

  // 6. Build constraints
  const roomConstraints = CONSTRAINT_POOL[roomInfo.room] || CONSTRAINT_POOL['Living Room'];
  const constraints = pickN(roomConstraints, randBetween(2, 4)).map(c =>
    c.replace('{n}', String(randBetween(4, 12)))
     .replace('{career}', career)
  );

  // Add "keep" constraint from house features
  const keepFeature = pick(house.features);
  constraints.push(pick(KEEP_CONSTRAINTS).replace('{feature}', keepFeature));

  // Accessibility constraints for aging-in-place or 65+
  if (archetype.id === 'aging_in_place' || age >= 65) {
    constraints.push(...pickN(ACCESSIBILITY_CONSTRAINTS, randBetween(2, 3)));
  }

  // Pet constraints
  if (pet) {
    constraints.push(`Must accommodate ${pet}`);
  }

  // 7. Build scoring criteria (compatible with ScoringEngine.scoreBriefCompliance)
  const densityMap = { low: 0.22, medium: 0.35, high: 0.50, curated: 0.32 };
  const maxItemsMap = { low: 6, medium: 10, high: 18, curated: 8 };

  const requiredTypes = ['Seating', 'Lighting'];
  if (roomInfo.room === 'Primary Bedroom') requiredTypes.push('bed');
  if (roomInfo.room === 'Dining Room') requiredTypes.push('diningTable');
  if (roomInfo.room === 'Home Office') requiredTypes.push('desk');
  if (archetype.homePhilosophy === 'gathering') requiredTypes.push('Table');
  if (archetype.id === 'wellness_seeker') requiredTypes.push('Plant');

  const forbiddenTypes = [];
  for (const db of archetype.dealBreakers) {
    if (db.includes('TV') || db.includes('tv')) forbiddenTypes.push('tv');
    if (db.includes('fragile')) forbiddenTypes.push('glass_table');
  }

  const symmetryPref = ['traditional', 'artDeco', 'hollywood'].includes(primaryStyle)
    ? 'symmetric' : ['japanese', 'bohemian', 'eclectic'].includes(primaryStyle)
    ? 'asymmetric' : 'balanced';

  const scoringCriteria = {
    mood: primaryStyle,
    maxItems: maxItemsMap[archetype.densityPreference],
    densityTarget: densityMap[archetype.densityPreference],
    requiredTypes,
    forbiddenTypes,
    preferNaturalMaterials: ['japanese', 'scandinavian', 'rustic', 'farmhouse', 'coastal'].includes(primaryStyle),
    colorTemperature: colorTemp,
    budgetTier: budget,
    requirePlant: archetype.id === 'wellness_seeker' || Math.random() > 0.5,
    requireArt: archetype.id !== 'young_minimalist' || Math.random() > 0.5,
    symmetryPreference: symmetryPref,
    adaRequired: archetype.id === 'aging_in_place' || age >= 70,
    minSeating: archetype.id === 'entertainer' ? randBetween(6, 10) : archetype.id === 'busy_family' ? randBetween(5, 8) : 0,
    // V2 additions: scoring bias from archetype
    dimensionWeights: archetype.scoringBias,
    // Designer hero influence
    designerHero: designerHero ? designerHero.name : null,
  };

  // 8. Generate the story text
  let storyTemplate = pick(archetype.storyTemplates);
  const yearsCollecting = age > 40 ? randBetween(15, age - 25) : randBetween(3, 10);
  const story = storyTemplate
    .replace('{material}', collections[0] || 'art')
    .replace('{count}', String(countriesVisited || travelRegions.length))
    .replace('{years}', String(yearsCollecting))
    .replace('{career}', career)
    .replace('{designerName}', designerHero ? designerHero.name : 'a statement');

  // 9. Build the context paragraph (the "first meeting" narrative)
  const contextParts = [];
  contextParts.push(`${clientName}, ${age}, ${career}. ${capitalize(household)}.`);
  if (pet) contextParts.push(`Has ${pet}.`);
  contextParts.push(`Lives in a ${house.type} with ${house.features.join(', ')}.`);
  if (travelRegions.length > 0) contextParts.push(`Has traveled extensively through ${travelRegions.slice(0, 3).join(', ')}${travelRegions.length > 3 ? ` and ${travelRegions.length - 3} other regions` : ''}.`);
  if (collections.length > 0) contextParts.push(`Collects ${collections.join(' and ')}.`);
  if (designerHero) contextParts.push(`Admires the work of ${designerHero.name}.`);
  contextParts.push(`"${story}"`);
  const context = contextParts.join(' ');

  // 10. Build the title
  const titleTemplates = [
    `${firstName}'s ${house.type.split(' ').pop().replace(/^./, c => c.toUpperCase())} ${roomInfo.room}`,
    `The ${capitalize(archetype.homePhilosophy)} — ${firstName}'s ${roomInfo.room}`,
    `${firstName} ${lastName}: ${roomInfo.room} Redesign`,
  ];
  const title = pick(titleTemplates);

  // 11. Generate concept palettes
  const concepts = [
    { name: capitalize(primaryStyle), colors: generatePalette(colorTemp) },
    { name: `${capitalize(colorTemp)} Alternative`, colors: generatePalette(pick(COLOR_TEMPS)) },
    { name: 'Wild Card', colors: generatePalette(pick(COLOR_TEMPS)) },
  ];

  // 12. Assemble the brief (ChallengeFlow-compatible format)
  return {
    id: Date.now(),
    title,
    client: clientName,
    story: context,
    room: roomInfo.room,
    sqft,
    roomWidth: roomW,
    roomDepth: roomD,
    difficulty,
    constraints,
    scoringCriteria,
    concepts,
    // Extended metadata (for UI display and AI context)
    clientProfile: {
      archetype: archetype.id,
      archetypeName: archetype.name,
      age,
      career,
      household,
      pet,
      house: house.type,
      houseFeatures: house.features,
      collections,
      travelRegions,
      countriesVisited,
      designerHero: designerHero ? designerHero.name : null,
      homePhilosophy: archetype.homePhilosophy,
      densityPreference: archetype.densityPreference,
      dealBreakers: archetype.dealBreakers,
      primaryStyle,
      colorTemperature: colorTemp,
      budget,
    },
  };
}

/**
 * Generate a set of briefs for a challenge round.
 * Ensures variety across archetypes, rooms, and difficulty.
 */
export function generateBriefSet(count = 3, options = {}) {
  const usedArchetypes = new Set();
  const usedRooms = new Set();
  const briefs = [];

  for (let i = 0; i < count; i++) {
    let brief;
    let attempts = 0;
    do {
      brief = generateBrief(options);
      attempts++;
    } while (
      (usedArchetypes.has(brief.clientProfile.archetype) || usedRooms.has(brief.room))
      && attempts < 20
    );
    usedArchetypes.add(brief.clientProfile.archetype);
    usedRooms.add(brief.room);
    briefs.push(brief);
  }

  return briefs;
}

/**
 * Generate a brief with specific difficulty parameters.
 */
export function generateDifficultyBrief(level = 'member') {
  const difficultyMods = {
    'member': { constraintCount: [2, 3], dealBreakerWeight: 0.3 },
    'studio-pro': { constraintCount: [3, 5], dealBreakerWeight: 0.6 },
    'atelier': { constraintCount: [5, 8], dealBreakerWeight: 1.0 },
  };
  return generateBrief({ difficulty: level });
}

/**
 * Get all available archetypes (for UI archetype picker / help system).
 */
export function getArchetypes() {
  return CLIENT_ARCHETYPES.map(a => ({
    id: a.id,
    name: a.name,
    homePhilosophy: a.homePhilosophy,
    densityPreference: a.densityPreference,
    styleAffinities: a.styleAffinities,
    dealBreakers: a.dealBreakers,
  }));
}

/**
 * Get available designer heroes (for UI designer picker).
 */
export function getDesignerHeroes() {
  return DESIGNER_HEROES;
}

/**
 * Get available room types.
 */
export function getRoomTypes() {
  return ROOM_TYPES.map(r => r.room);
}

export default {
  generateBrief, generateBriefSet, generateDifficultyBrief,
  getArchetypes, getDesignerHeroes, getRoomTypes,
  CLIENT_ARCHETYPES, DESIGNER_HEROES, ROOM_TYPES,
};
