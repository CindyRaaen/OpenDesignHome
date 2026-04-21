// ═══════════════════════════════════════════════════════════════════════════
// AI JUDGE PERSONAS — V2 AI Design Analysis Engine
// 6 differentiated judges with unique dimension weights,
// scoring modifiers grounded in design philosophy, and personality.
// ═══════════════════════════════════════════════════════════════════════════

// ── The Seven Scoring Dimensions ─────────────────────────────────────────
// 1. Color Harmony & Application
// 2. Spatial Composition & Flow
// 3. Style Coherence & Identity
// 4. Layering & Textural Depth
// 5. Wall Composition & Elevation
// 6. Brief Compliance & Client Alignment
// 7. Design Narrative & Intentionality

export const JUDGES = [
  {
    id: 'margaux',
    name: 'Margaux Bellini',
    avatar: '🤍',
    style: 'Minimalist',
    tagline: '"Less, but better."',
    personality: 'Values negative space, restraint, and quiet luxury. Penalizes visual noise. Rewards chromatic discipline and spatial clarity.',
    critiqueTone: 'cool, precise, occasionally cutting',
    philosophy: 'Dieter Rams, John Pawson, Tadao Ando. Less but better. Every object must earn its place.',
    weights: {
      color: 0.15, spatial: 0.25, style: 0.15,
      layering: 0.10, wall: 0.15, brief: 0.10, narrative: 0.10
    },
    modifiers: [
      { id: 'negativeSpace', name: 'Negative Space Bonus', condition: 'WVD < 0.30 && zones complete', bonus: 8, dimension: 'spatial' },
      { id: 'chromaticRestraint', name: 'Chromatic Restraint', condition: '<3 hue families + neutrals dominant', bonus: 5, dimension: 'color' },
      { id: 'editQuality', name: 'Edit Quality', condition: 'High T1+T2 to T6+T7 ratio', bonus: 5, dimension: 'narrative' },
      { id: 'clutterPenalty', name: 'Clutter Penalty', condition: 'WVD > 0.45', penalty: -8, dimension: 'spatial' },
    ]
  },
  {
    id: 'dex',
    name: 'Dex Washington',
    avatar: '💎',
    style: 'Maximalist',
    tagline: '"More is more and then some."',
    personality: 'Loves bold color, pattern mixing, personality, and abundance. Rewards risk-taking and layered richness.',
    critiqueTone: 'enthusiastic, expressive, dramatic',
    philosophy: 'Iris Apfel, Miles Redd, Kelly Wearstler. Fill the space with meaning. Timid design is wasted opportunity.',
    weights: {
      color: 0.20, spatial: 0.10, style: 0.10,
      layering: 0.25, wall: 0.15, brief: 0.10, narrative: 0.10
    },
    modifiers: [
      { id: 'abundanceBonus', name: 'Abundance Bonus', condition: 'WVD > 0.45 && layering > 70', bonus: 6, dimension: 'layering' },
      { id: 'patternMix', name: 'Pattern Mix', condition: '3+ pattern types sharing color', bonus: 8, dimension: 'style' },
      { id: 'boldColor', name: 'Bold Color', condition: 'Average chroma > 40', bonus: 5, dimension: 'color' },
      { id: 'sparseRoom', name: 'Sparse Room Penalty', condition: 'WVD < 0.25', penalty: -6, dimension: 'layering' },
    ]
  },
  {
    id: 'yuki',
    name: 'Yuki Tanaka',
    avatar: '🍃',
    style: 'Wabi-Sabi',
    tagline: '"Beauty in imperfection."',
    personality: 'Natural materials, asymmetry, lived-in warmth. Rewards organic feel, botanical presence, and the beauty of age.',
    critiqueTone: 'gentle, philosophical, poetic',
    philosophy: 'Axel Vervoordt, Leonard Koren, Junichiro Tanizaki. Embrace impermanence. Let materials age with grace.',
    weights: {
      color: 0.10, spatial: 0.20, style: 0.10,
      layering: 0.20, wall: 0.10, brief: 0.10, narrative: 0.20
    },
    modifiers: [
      { id: 'botanicalPresence', name: 'Botanical Presence', condition: 'T7 items present', bonus: 10, dimension: 'narrative' },
      { id: 'asymmetryReward', name: 'Asymmetry Reward', condition: '15-30% visual weight imbalance', bonus: 6, dimension: 'spatial' },
      { id: 'naturalMaterial', name: 'Natural Material Bonus', condition: 'Natural materials per item', bonus: 1, dimension: 'layering', perItem: true },
      { id: 'imperfection', name: 'Imperfection Aesthetic', condition: 'Handmade/vintage tags', bonus: 5, dimension: 'style' },
    ]
  },
  {
    id: 'ava',
    name: 'Ava Thornton',
    avatar: '👑',
    style: 'Traditional',
    tagline: '"Timeless over trendy."',
    personality: 'Classic proportions, symmetry, formal balance. Rewards proven elegance and architectural respect.',
    critiqueTone: 'authoritative, refined, occasionally warm',
    philosophy: 'Mario Buatta, Bunny Williams, Mark Hampton. The classics endure because they work. Proportion is everything.',
    weights: {
      color: 0.15, spatial: 0.25, style: 0.15,
      layering: 0.15, wall: 0.15, brief: 0.10, narrative: 0.05
    },
    modifiers: [
      { id: 'symmetryAnalysis', name: 'Symmetry Analysis', condition: 'Bilateral symmetry within 5%', bonus: 8, dimension: 'spatial' },
      { id: 'goldenRatio', name: 'Golden Ratio', condition: 'Key proportions 1:1.618 within 10%', bonus: 5, dimension: 'wall' },
      { id: 'formalityGradient', name: 'Formality Gradient', condition: 'Entry-to-private decreasing formality', bonus: 4, dimension: 'narrative' },
      { id: 'asymmetryPenalty', name: 'Asymmetry Penalty', condition: 'Strong asymmetry (>40% imbalance)', penalty: -5, dimension: 'spatial' },
    ]
  },
  {
    id: 'rio',
    name: 'Rio Santos',
    avatar: '🌈',
    style: 'Eclectic',
    tagline: '"Rules are suggestions."',
    personality: 'Global influences, unexpected combos, storytelling. Rewards surprise, cultural mixing, and narrative depth.',
    critiqueTone: 'playful, curious, encouraging',
    philosophy: 'Justina Blakeney, Muriel Brandolini, Jacques Grange. Every piece has a passport. The story is the style.',
    weights: {
      color: 0.15, spatial: 0.10, style: 0.05,
      layering: 0.20, wall: 0.15, brief: 0.10, narrative: 0.25
    },
    modifiers: [
      { id: 'surpriseBonus', name: 'Surprise Bonus', condition: '3+ styles >15% each with unifier', bonus: 10, dimension: 'narrative' },
      { id: 'globalMix', name: 'Global Mix', condition: 'Multiple cultural origins', bonus: 6, dimension: 'style' },
      { id: 'vintageMix', name: 'Vintage Mix', condition: 'New + vintage items combined', bonus: 5, dimension: 'layering' },
      { id: 'tooSafe', name: 'Too Safe Penalty', condition: '>80% single style, low WVD', penalty: -5, dimension: 'narrative' },
    ]
  },
  {
    id: 'algo',
    name: 'The Algorithm',
    avatar: '🔢',
    style: 'Data-Driven',
    tagline: '"The numbers don\'t lie."',
    personality: 'Pure measurement. Golden ratio, DSD compliance rate, mathematical proportion. No aesthetic bias, only defensible numbers.',
    critiqueTone: 'clinical, precise, oddly charming',
    philosophy: 'Vitruvius, Le Corbusier, Christopher Alexander. Design is pattern. Pattern is measurable. What is measured improves.',
    weights: {
      color: 0.16, spatial: 0.16, style: 0.14,
      layering: 0.14, wall: 0.14, brief: 0.14, narrative: 0.12
    },
    modifiers: [
      { id: 'goldenRatioSweep', name: 'Golden Ratio Sweep', condition: 'Each golden ratio match in proportions', bonus: 2, dimension: 'spatial', perMatch: true, max: 12 },
      { id: 'ruleOfThirds', name: 'Rule of Thirds', condition: 'Focal elements at grid intersections', bonus: 6, dimension: 'spatial' },
      { id: 'dsdCompliance', name: 'DSD Compliance Rate', condition: 'Unique metric: % of applicable standards passed', bonus: 0, dimension: 'spatial', isMetric: true },
      { id: 'mathematicalBalance', name: 'Mathematical Balance', condition: 'Visual weight ratio within 5%', bonus: 5, dimension: 'spatial' },
    ]
  },
];

// ── Apply Judge Modifiers ────────────────────────────────────────────────

export function applyJudgeModifiers(judge, dimensionScores, roomAnalysis) {
  const modified = { ...dimensionScores };

  for (const mod of judge.modifiers) {
    const applied = evaluateModifier(mod, roomAnalysis);
    if (applied !== 0) {
      const dim = mod.dimension;
      modified[dim] = Math.min(100, Math.max(0, (modified[dim] || 0) + applied));
    }
  }

  return modified;
}

function evaluateModifier(mod, analysis) {
  if (!analysis) return 0;

  switch (mod.id) {
    // Margaux
    case 'negativeSpace':
      return (analysis.wvd < 0.30 && analysis.zoneCompleteness > 70) ? mod.bonus : 0;
    case 'chromaticRestraint':
      return (analysis.hueFamilyCount <= 3 && analysis.neutralDominant) ? mod.bonus : 0;
    case 'editQuality':
      return (analysis.anchorToAccessoryRatio > 0.5) ? mod.bonus : 0;
    case 'clutterPenalty':
      return (analysis.wvd > 0.45) ? mod.penalty : 0;

    // Dex
    case 'abundanceBonus':
      return (analysis.wvd > 0.45 && analysis.layeringScore > 70) ? mod.bonus : 0;
    case 'patternMix':
      return (analysis.patternTypes >= 3) ? mod.bonus : 0;
    case 'boldColor':
      return (analysis.avgChroma > 40) ? mod.bonus : 0;
    case 'sparseRoom':
      return (analysis.wvd < 0.25) ? mod.penalty : 0;

    // Yuki
    case 'botanicalPresence':
      return (analysis.t7Count > 0) ? Math.min(mod.bonus, analysis.t7Count * 3) : 0;
    case 'asymmetryReward':
      return (analysis.balanceImbalance >= 0.15 && analysis.balanceImbalance <= 0.30) ? mod.bonus : 0;
    case 'naturalMaterial':
      return Math.min(8, (analysis.naturalMaterialCount || 0) * mod.bonus);
    case 'imperfection':
      return (analysis.hasVintage || analysis.hasHandmade) ? mod.bonus : 0;

    // Ava
    case 'symmetryAnalysis':
      return (analysis.symmetryScore > 0.95) ? mod.bonus : 0;
    case 'goldenRatio':
      return (analysis.goldenRatioMatches > 0) ? mod.bonus : 0;
    case 'formalityGradient':
      return (analysis.hasFormalityGradient) ? mod.bonus : 0;
    case 'asymmetryPenalty':
      return (analysis.balanceImbalance > 0.40) ? mod.penalty : 0;

    // Rio
    case 'surpriseBonus':
      return (analysis.styleCount >= 3 && analysis.hasUnifyingElement) ? mod.bonus : 0;
    case 'globalMix':
      return (analysis.culturalOrigins >= 2) ? mod.bonus : 0;
    case 'vintageMix':
      return (analysis.hasVintage && analysis.hasNew) ? mod.bonus : 0;
    case 'tooSafe':
      return (analysis.dominantStyleShare > 0.80 && analysis.wvd < 0.30) ? mod.penalty : 0;

    // Algorithm
    case 'goldenRatioSweep':
      return Math.min(mod.max, (analysis.goldenRatioMatches || 0) * mod.bonus);
    case 'ruleOfThirds':
      return (analysis.focalAtIntersection) ? mod.bonus : 0;
    case 'mathematicalBalance':
      return (analysis.balanceImbalance < 0.05) ? mod.bonus : 0;

    default:
      return 0;
  }
}

// ── Compute Judge Total Score ────────────────────────────────────────────

export function computeJudgeScore(judge, dimensionScores) {
  let total = 0;
  total += (dimensionScores.color || 0) * judge.weights.color;
  total += (dimensionScores.spatial || 0) * judge.weights.spatial;
  total += (dimensionScores.style || 0) * judge.weights.style;
  total += (dimensionScores.layering || 0) * judge.weights.layering;
  total += (dimensionScores.wall || 0) * judge.weights.wall;
  total += (dimensionScores.brief || 0) * judge.weights.brief;
  total += (dimensionScores.narrative || 0) * judge.weights.narrative;
  return Math.round(total);
}

export default { JUDGES, applyJudgeModifiers, computeJudgeScore };