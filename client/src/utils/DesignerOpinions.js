// ═══════════════════════════════════════════════════════════════════════════
// DESIGNER OPINIONS — Curated perspectives from leading architects &
// interior designers, distilled into scoring heuristics and critique phrases.
//
// Sources: Kelly Wearstler, Peter Marino, Ilse Crawford, Nate Berkus,
//   Tadao Ando, Axel Vervoordt, India Mahdavi, Vincent Van Duysen,
//   Jean-Louis Deniot, Emily Henderson, Rose Uniacke, Philip Thomas,
//   Sarah Hart, Charlotte Moss, Albert Hadley
//
// Each opinion has: designer attribution, principle, a scoring condition
// (function that receives roomAnalysis), and critique phrases (positive/negative).
// ═══════════════════════════════════════════════════════════════════════════

// ── OPINION CATEGORIES ──────────────────────────────────────────────────

export const OPINION_CATEGORIES = {
  NEGATIVE_SPACE: 'negative_space',
  MATERIALITY: 'materiality',
  SCALE_PROPORTION: 'scale_proportion',
  LIGHT: 'light',
  TENSION: 'tension',
  HUMAN_CENTER: 'human_centered',
  COLOR_COURAGE: 'color_courage',
  RESTRAINT: 'restraint',
  SYMMETRY: 'symmetry',
  NARRATIVE: 'narrative',
};

// ── DESIGNER OPINIONS DATABASE ──────────────────────────────────────────
// Each entry: { id, designer, category, principle, condition(roomAnalysis),
//   positive (when condition met), negative (when condition fails),
//   scoringImpact: { dimension, modifier } }

export const DESIGNER_OPINIONS = [

  // ── NEGATIVE SPACE & RESTRAINT ────────────────────────────────────────

  {
    id: 'ando_emptiness',
    designer: 'Tadao Ando',
    category: 'restraint',
    principle: 'Emptiness is not absence — it is presence. Architecture should remain silent and let nature in.',
    condition: (ra) => ra.wvd < 0.35 && ra.neutralDominant,
    positive: 'There\'s a quietness here that Tadao Ando would recognize — the room breathes, and the emptiness itself becomes a design element.',
    negative: 'The space is dense where it could be contemplative. Ando reminds us that restraint lets light and nature do the speaking.',
    scoringImpact: { dimension: 'spatial', modifier: 4 },
  },

  {
    id: 'thomas_negative_space',
    designer: 'Philip Thomas',
    category: 'negative_space',
    principle: 'Negative space is never a lack of design — it IS the design.',
    condition: (ra) => ra.wvd >= 0.15 && ra.wvd <= 0.38,
    positive: 'The negative space here feels intentional — it gives the eye pause, creates hierarchy, and lets the room feel composed rather than crowded.',
    negative: 'Every surface competes for attention. Philip Thomas would say the design itself is missing — the breathing room between focal points.',
    scoringImpact: { dimension: 'spatial', modifier: 3 },
  },

  {
    id: 'tyrrell_breathing',
    designer: 'Michael Tyrrell',
    category: 'negative_space',
    principle: 'Rooms need breathing space — areas of calm between focal points.',
    condition: (ra) => ra.balanceImbalance < 0.25,
    positive: 'There\'s a rhythm of activity and calm — the room knows when to speak and when to pause.',
    negative: 'Without breathing space between focal points, the room reads as cluttered rather than curated.',
    scoringImpact: { dimension: 'spatial', modifier: 3 },
  },

  {
    id: 'uniacke_breathe',
    designer: 'Rose Uniacke',
    category: 'negative_space',
    principle: 'Interiors should allow furniture, art, and architecture space to breathe — but there must always be warmth.',
    condition: (ra) => ra.wvd < 0.40 && ra.naturalMaterialCount >= 2,
    positive: 'This has what Rose Uniacke describes — room to breathe, but with warmth that prevents austerity.',
    negative: 'The room could use more generosity of space. Uniacke would float pieces further apart and let the architecture show.',
    scoringImpact: { dimension: 'layering', modifier: 3 },
  },

  // ── MATERIALITY & TEXTURE ─────────────────────────────────────────────

  {
    id: 'marino_material_first',
    designer: 'Peter Marino',
    category: 'materiality',
    principle: 'Start from the bottom up — focus on what materials things should be made of, then worry about what they look like.',
    condition: (ra) => ra.naturalMaterialCount >= 4,
    positive: 'The material palette here speaks first — Peter Marino would appreciate that the textures tell the story before the forms do.',
    negative: 'The materials feel like an afterthought. Marino starts every project from materiality up — the room needs a stronger material narrative.',
    scoringImpact: { dimension: 'layering', modifier: 4 },
  },

  {
    id: 'vervoordt_patina',
    designer: 'Axel Vervoordt',
    category: 'materiality',
    principle: 'Beauty lies in imperfection — the patina of time, the authenticity of raw materials.',
    condition: (ra) => ra.hasVintage && ra.naturalMaterialCount >= 3,
    positive: 'There\'s an honesty to these materials that Vervoordt would love — the patina of age alongside raw, natural surfaces.',
    negative: 'Everything reads as new. Vervoordt would introduce a piece with history — aged wood, weathered stone, something that carries time.',
    scoringImpact: { dimension: 'narrative', modifier: 4 },
  },

  {
    id: 'vanduysen_layers',
    designer: 'Vincent Van Duysen',
    category: 'materiality',
    principle: 'Layers of textured materials create a natural glow of warmth — reduction to the essence, not to emptiness.',
    condition: (ra) => ra.layeringScore >= 70 && ra.naturalMaterialCount >= 3,
    positive: 'Van Duysen\'s warm minimalism lives here — the textures are restrained but layered enough to radiate warmth.',
    negative: 'The room is either too sparse or too busy. Van Duysen finds the sweet spot: reduce to the essence, then add warmth through material layers.',
    scoringImpact: { dimension: 'layering', modifier: 3 },
  },

  // ── SCALE & PROPORTION ────────────────────────────────────────────────

  {
    id: 'berkus_scale',
    designer: 'Nate Berkus',
    category: 'scale_proportion',
    principle: 'It\'s all about scale — if you have a high-backed sofa, low chairs probably won\'t sit with that attractively.',
    condition: (ra) => ra.anchorToAccessoryRatio >= 0.2 && ra.anchorToAccessoryRatio <= 0.6,
    positive: 'The scale relationships are working — anchor pieces and accents are in proportion, the way Berkus insists they should be.',
    negative: 'There\'s a scale disconnect. Berkus would say the big pieces and small pieces aren\'t speaking the same language.',
    scoringImpact: { dimension: 'style', modifier: 3 },
  },

  {
    id: 'deniot_symmetry',
    designer: 'Jean-Louis Deniot',
    category: 'symmetry',
    principle: 'Circulation planning, axis, symmetry, equilibrium — these are the keys to architecture and comfort.',
    condition: (ra) => ra.symmetryScore >= 0.7 && ra.zoneCompleteness >= 70,
    positive: 'Deniot would recognize the classical bones here — the axes are clear, the symmetry creates a sense of inevitable rightness.',
    negative: 'The room lacks the structural equilibrium that Deniot considers fundamental. Find the axis, then let the furniture honor it.',
    scoringImpact: { dimension: 'spatial', modifier: 4 },
  },

  {
    id: 'golden_ratio_masters',
    designer: 'Le Corbusier / Classical tradition',
    category: 'scale_proportion',
    principle: 'The golden ratio (1:1.618) governs the most pleasing proportional relationships in space.',
    condition: (ra) => ra.goldenRatioMatches >= 2,
    positive: 'Multiple golden-ratio relationships are at play here — the proportions have that elusive sense of mathematical rightness.',
    negative: 'The proportions feel arbitrary. Even one or two golden-ratio alignments would add the harmonic quality that classical designers rely on.',
    scoringImpact: { dimension: 'spatial', modifier: 3 },
  },

  // ── COLOR & BOLDNESS ──────────────────────────────────────────────────

  {
    id: 'mahdavi_color_danger',
    designer: 'India Mahdavi',
    category: 'color_courage',
    principle: 'I like putting colors in danger. I like when colors swear at each other.',
    condition: (ra) => ra.avgChroma > 30 && ra.hueFamilyCount >= 3,
    positive: 'India Mahdavi would smile — the palette has courage, with colors that create tension and energy rather than playing it safe.',
    negative: 'The palette is timid. Mahdavi would push these colors into more daring territory — let them argue, let them surprise.',
    scoringImpact: { dimension: 'color', modifier: 3 },
  },

  {
    id: 'wearstler_tension',
    designer: 'Kelly Wearstler',
    category: 'tension',
    principle: 'So much of my philosophy is about the old and the new — creating that interesting tension where elements collide.',
    condition: (ra) => ra.hasVintage && ra.hasNew && ra.styleCount >= 2,
    positive: 'Wearstler\'s "beautiful tension" is here — old and new collide intentionally, and the friction creates something fresh.',
    negative: 'The room is too homogeneous in era. Wearstler would introduce something from a completely different time — let the collision spark energy.',
    scoringImpact: { dimension: 'narrative', modifier: 4 },
  },

  {
    id: 'wearstler_repetition',
    designer: 'Kelly Wearstler',
    category: 'narrative',
    principle: 'Repetition is a big part of my design language — sculptural elements and architectural details as punctuation.',
    condition: (ra) => ra.dominantStyleShare >= 0.5 && ra.hasUnifyingElement,
    positive: 'There\'s a design language here with consistent repetition — Wearstler\'s approach of using recurring motifs as visual rhythm.',
    negative: 'The room lacks a repeating thread. Wearstler builds visual rhythm through intentional repetition — find one element and echo it.',
    scoringImpact: { dimension: 'style', modifier: 3 },
  },

  // ── HUMAN-CENTERED & SENSORY ──────────────────────────────────────────

  {
    id: 'crawford_human',
    designer: 'Ilse Crawford',
    category: 'human_centered',
    principle: 'Design for the senses — we are primal creatures and read our environment through the senses, another intelligence.',
    condition: (ra) => ra.naturalMaterialCount >= 3 && ra.t7Count >= 2 && ra.layeringScore >= 60,
    positive: 'Ilse Crawford would feel at home here — natural materials engage the senses, botanicals connect to nature, and the textures invite touch.',
    negative: 'The room speaks to the eyes but not the body. Crawford designs for all the senses — add tactile materials, living elements, things that smell and feel.',
    scoringImpact: { dimension: 'layering', modifier: 4 },
  },

  {
    id: 'hadley_people',
    designer: 'Albert Hadley',
    category: 'human_centered',
    principle: 'The essence of interior design will always be about people and how they live.',
    condition: (ra) => ra.zoneCompleteness >= 75,
    positive: 'The room is designed for living — every functional zone serves the people who\'ll use this space, exactly as Hadley intended.',
    negative: 'A key function is missing. Hadley would say: design for how people actually live, not how a room looks in a photo.',
    scoringImpact: { dimension: 'brief', modifier: 3 },
  },

  {
    id: 'marino_comfort',
    designer: 'Peter Marino',
    category: 'human_centered',
    principle: 'The ultimate space should have light, space, comfort and humour — an environment you want to spend time in.',
    condition: (ra) => ra.wvd <= 0.45 && ra.zoneCompleteness >= 70 && ra.t7Count >= 1,
    positive: 'Light, space, comfort — Marino\'s essentials are all here, creating an environment people will linger in rather than pass through.',
    negative: 'The room is missing one of Marino\'s essentials: either comfort, breathing room, or the living warmth that makes a space inviting.',
    scoringImpact: { dimension: 'narrative', modifier: 3 },
  },

  // ── RESTRAINT & EDITING ───────────────────────────────────────────────

  {
    id: 'berkus_rules_broken',
    designer: 'Nate Berkus',
    category: 'narrative',
    principle: 'The best interiors for the last 300 years are interiors where people broke the rules — deeply personal, individualistic.',
    condition: (ra) => ra.styleCount >= 3 && ra.hasUnifyingElement,
    positive: 'This is rule-breaking with a safety net — multiple styles coexist but a unifying thread holds it together. Berkus\'s favorite kind of room.',
    negative: 'The room plays it safe. Berkus would say: the rules exist to be broken — take a risk, make it personal.',
    scoringImpact: { dimension: 'narrative', modifier: 3 },
  },

  {
    id: 'deniot_luxury_discretion',
    designer: 'Jean-Louis Deniot',
    category: 'restraint',
    principle: 'Luxury is all about discretion — you cannot really see it but you can feel it.',
    condition: (ra) => ra.wvd <= 0.40 && ra.naturalMaterialCount >= 3 && ra.avgChroma < 35,
    positive: 'There\'s a quiet luxury here that Deniot would recognize — nothing shouts, but everything whispers quality.',
    negative: 'The room tries too hard. Deniot\'s luxury is invisible — it\'s felt in material quality and proportion, not in visual loudness.',
    scoringImpact: { dimension: 'style', modifier: 3 },
  },

  {
    id: 'moss_timeless',
    designer: 'Charlotte Moss',
    category: 'narrative',
    principle: 'Two things make a room timeless: a sense of history and a piece of the future.',
    condition: (ra) => ra.hasVintage && ra.hasNew,
    positive: 'Charlotte Moss\'s recipe for timelessness is here — the room has both memory and forward momentum.',
    negative: 'The room is frozen in one moment. Moss would layer in something from the past or the future to create temporal depth.',
    scoringImpact: { dimension: 'narrative', modifier: 3 },
  },

  // ── LIGHT ─────────────────────────────────────────────────────────────

  {
    id: 'berkus_light_sources',
    designer: 'Nate Berkus',
    category: 'light',
    principle: 'People always underestimate how many light sources they need.',
    condition: (ra) => (ra.lightSourceCount || 0) >= 3,
    positive: 'The lighting is layered — multiple sources create depth and warmth, exactly as Berkus prescribes.',
    negative: 'More light sources. Berkus says people always underestimate this — a room needs ambient, task, and accent light working together.',
    scoringImpact: { dimension: 'wall', modifier: 3 },
  },

  // ── CONVERSATION & SPATIAL RULES ──────────────────────────────────────

  {
    id: 'hart_float',
    designer: 'Sarah Hart',
    category: 'scale_proportion',
    principle: 'Float your furniture — get it away from the walls. A seating arrangement pulled inward creates intention.',
    condition: (ra) => ra.balanceImbalance < 0.3,
    positive: 'Furniture is floating with intention — the conversation area has gravity, pulling people toward the center rather than clinging to walls.',
    negative: 'Pull the seating off the walls. Hart says a floating arrangement creates intention — the room should draw people in, not line them up.',
    scoringImpact: { dimension: 'spatial', modifier: 3 },
  },

  {
    id: 'henderson_big_small',
    designer: 'Emily Henderson',
    category: 'scale_proportion',
    principle: 'In small spaces, fewer but larger pieces work better than many small ones.',
    condition: (ra) => ra.anchorToAccessoryRatio >= 0.15,
    positive: 'The furniture hierarchy is clear — strong anchor pieces command the room while accessories support without competing.',
    negative: 'Too many small pieces, not enough anchors. Henderson\'s rule: fewer, bigger pieces create more impact than a scatter of smalls.',
    scoringImpact: { dimension: 'style', modifier: 2 },
  },
];


// ── JUDGE-TO-OPINION AFFINITY ───────────────────────────────────────────
// Which judges care about which opinion categories
// Higher weight = more likely to cite this designer in critique

export const JUDGE_OPINION_AFFINITY = {
  margaux: {
    restraint: 1.0, negative_space: 1.0, materiality: 0.6,
    scale_proportion: 0.7, light: 0.5, tension: 0.2,
    human_centered: 0.4, color_courage: 0.1, symmetry: 0.8, narrative: 0.5,
  },
  dex: {
    restraint: 0.1, negative_space: 0.2, materiality: 0.7,
    scale_proportion: 0.5, light: 0.6, tension: 0.9,
    human_centered: 0.5, color_courage: 1.0, symmetry: 0.2, narrative: 0.8,
  },
  yuki: {
    restraint: 1.0, negative_space: 0.9, materiality: 1.0,
    scale_proportion: 0.6, light: 0.7, tension: 0.3,
    human_centered: 0.8, color_courage: 0.1, symmetry: 0.4, narrative: 0.7,
  },
  ava: {
    restraint: 0.5, negative_space: 0.4, materiality: 0.7,
    scale_proportion: 0.9, light: 0.6, tension: 0.3,
    human_centered: 0.7, color_courage: 0.3, symmetry: 1.0, narrative: 0.6,
  },
  rio: {
    restraint: 0.2, negative_space: 0.3, materiality: 0.6,
    scale_proportion: 0.5, light: 0.5, tension: 1.0,
    human_centered: 0.6, color_courage: 0.8, symmetry: 0.2, narrative: 1.0,
  },
  algorithm: {
    restraint: 0.5, negative_space: 0.5, materiality: 0.5,
    scale_proportion: 0.8, light: 0.5, tension: 0.5,
    human_centered: 0.5, color_courage: 0.5, symmetry: 0.7, narrative: 0.5,
  },
};

// ── PUBLIC API ───────────────────────────────────────────────────────────

/**
 * Evaluate all designer opinions against room analysis.
 * Returns { met: [...], unmet: [...] } with full opinion objects + result.
 */
export function evaluateOpinions(roomAnalysis) {
  const met = [];
  const unmet = [];
  for (const op of DESIGNER_OPINIONS) {
    try {
      if (op.condition(roomAnalysis)) {
        met.push({ ...op, result: 'met' });
      } else {
        unmet.push({ ...op, result: 'unmet' });
      }
    } catch {
      // Skip opinions that can't evaluate (missing data)
    }
  }
  return { met, unmet };
}

/**
 * Get the best opinion quote for a specific judge based on affinity.
 * Returns { opinion, phrase } or null.
 */
export function getJudgeOpinionQuote(judgeId, roomAnalysis, preferPositive = true) {
  const affinity = JUDGE_OPINION_AFFINITY[judgeId];
  if (!affinity) return null;

  const { met, unmet } = evaluateOpinions(roomAnalysis);
  const pool = preferPositive ? met : unmet;

  // Score each opinion by judge affinity to its category
  const scored = pool.map(op => ({
    opinion: op,
    phrase: preferPositive ? op.positive : op.negative,
    affinityScore: affinity[op.category] || 0.3,
  })).sort((a, b) => b.affinityScore - a.affinityScore);

  return scored[0] || null;
}

/**
 * Get opinion-based scoring modifiers for a judge.
 * Returns an object of { dimension: totalModifier } to apply.
 */
export function getOpinionModifiers(judgeId, roomAnalysis) {
  const affinity = JUDGE_OPINION_AFFINITY[judgeId];
  if (!affinity) return {};

  const { met, unmet } = evaluateOpinions(roomAnalysis);
  const modifiers = {};

  // Positive opinions: bonus if judge cares about this category
  for (const op of met) {
    const weight = affinity[op.category] || 0.3;
    if (weight >= 0.6 && op.scoringImpact) {
      const dim = op.scoringImpact.dimension;
      modifiers[dim] = (modifiers[dim] || 0) + Math.round(op.scoringImpact.modifier * weight);
    }
  }

  // Unmet opinions: penalty if judge cares deeply
  for (const op of unmet) {
    const weight = affinity[op.category] || 0.3;
    if (weight >= 0.8 && op.scoringImpact) {
      const dim = op.scoringImpact.dimension;
      modifiers[dim] = (modifiers[dim] || 0) - Math.round(op.scoringImpact.modifier * weight * 0.5);
    }
  }

  return modifiers;
}

/**
 * Get a curated set of opinion quotes for the critique text.
 * Returns up to `count` opinions sorted by relevance to the judge.
 */
export function getCritiqueOpinions(judgeId, roomAnalysis, count = 2) {
  const affinity = JUDGE_OPINION_AFFINITY[judgeId];
  if (!affinity) return [];

  const { met, unmet } = evaluateOpinions(roomAnalysis);

  // Pick the strongest positive and strongest negative
  const allScored = [
    ...met.map(op => ({ op, phrase: op.positive, type: 'strength', score: (affinity[op.category] || 0.3) })),
    ...unmet.map(op => ({ op, phrase: op.negative, type: 'opportunity', score: (affinity[op.category] || 0.3) })),
  ].sort((a, b) => b.score - a.score);

  const results = [];
  let hasStrength = false, hasOpportunity = false;
  for (const item of allScored) {
    if (results.length >= count) break;
    if (item.type === 'strength' && !hasStrength) { results.push(item); hasStrength = true; }
    else if (item.type === 'opportunity' && !hasOpportunity) { results.push(item); hasOpportunity = true; }
    else if (results.length < count) { results.push(item); }
  }

  return results.map(r => ({
    designer: r.op.designer,
    phrase: r.phrase,
    type: r.type,
    category: r.op.category,
  }));
}

export default {
  DESIGNER_OPINIONS, JUDGE_OPINION_AFFINITY, OPINION_CATEGORIES,
  evaluateOpinions, getJudgeOpinionQuote, getOpinionModifiers, getCritiqueOpinions
};
