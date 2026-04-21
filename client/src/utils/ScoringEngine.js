// ═══════════════════════════════════════════════════════════════════════════
// OPEN DESIGN HOME — V2 AI Design Analysis Engine
// Master Orchestrator: integrates 7 scoring dimensions across 6 sub-engines.
//
// Architecture:
//   ColorEngine.js      → Dimension 1: Color Harmony & Application
//   SpatialEngine.js    → Dimension 2: Spatial Composition & Flow
//   StyleEngine.js      → Dimension 3: Style Coherence & Identity
//   LayeringEngine.js   → Dimension 4: Layering & Textural Depth
//   WallEngine.js       → Dimension 5: Wall Composition & Elevation
//   (inline)            → Dimension 6: Brief Compliance & Client Alignment
//   (inline)            → Dimension 7: Design Narrative & Intentionality
//   JudgePersonas.js    → 6 AI judges with differentiated weights & modifiers
//   CritiqueEngine.js   → Academic-backed critique generation
//   DesignStandardsDB.js→ 150+ professional measurement standards
//
// Sources: Munsell (1905), Itten (1961), Chevreul (1839), Albers (1963),
//   Birren (1950), Arnheim (1954), Wertheimer (1923), Kellert (2015),
//   Ballast IDRM, Architectural Graphic Standards, NCIDQ, Le Corbusier (1948)
// ═══════════════════════════════════════════════════════════════════════════

import { scoreColorHarmony, scoreColorHarmonySimple, hexToMunsell, hexToLch, deltaE } from './ColorEngine.js';
import { scoreSpatialComposition, computeVisualWeight, scoreVisualBalance, evaluateGestalt } from './SpatialEngine.js';
import { scoreStyleCoherence, computeWVD, assignTier, computeStyleVector, ITEM_TIERS } from './StyleEngine.js';
import { scoreLayeringTexture } from './LayeringEngine.js';
import { scoreWallComposition } from './WallEngine.js';
import { JUDGES, applyJudgeModifiers, computeJudgeScore } from './JudgePersonas.js';
import { generateCritique } from './CritiqueEngine.js';
import { getOpinionModifiers } from './DesignerOpinions.js';
import { auditRoom, violationCritique, ALL_STANDARDS } from './DesignStandardsDB.js';

export { JUDGES };

// ═══════════════════════════════════════════════════════════════════════════
// DIMENSION 6: BRIEF COMPLIANCE (enhanced from V1)
// ═══════════════════════════════════════════════════════════════════════════

function scoreBriefCompliance(placedItems, palette, materials, brief) {
  if (!brief?.scoringCriteria) return { score: 75, penalties: [] };
  const c = brief.scoringCriteria;
  let score = 100;
  const penalties = [];

  // WVD-based density check (replaces raw item count)
  const wvd = computeWVD(placedItems);
  if (c.densityTarget) {
    const deviation = Math.abs(wvd - c.densityTarget);
    if (deviation > 0.15) { score -= 8; penalties.push(`Density (WVD ${wvd.toFixed(2)}) far from target ${c.densityTarget}`); }
  }

  // Required furniture types
  if (c.requiredTypes) {
    const placedTypes = new Set(placedItems.map(i => (i.type || '').toLowerCase()));
    for (const req of c.requiredTypes) {
      if (!placedTypes.has(req.toLowerCase())) {
        score -= 12; penalties.push(`Missing required: ${req}`);
      }
    }
  }

  // Forbidden types
  if (c.forbiddenTypes) {
    const placedTypes = new Set(placedItems.map(i => (i.type || '').toLowerCase()));
    for (const forbid of c.forbiddenTypes) {
      if (placedTypes.has(forbid.toLowerCase())) {
        score -= 15; penalties.push(`Brief forbids: ${forbid}`);
      }
    }
  }

  // Seating count
  if (c.minSeating) {
    const estimatedSeats = placedItems.reduce((sum, i) => {
      if ((i.type || '').toLowerCase() !== 'seating') return sum;
      return sum + ((i.w || 24) > 60 ? 3 : (i.w || 24) > 40 ? 2 : 1);
    }, 0);
    if (estimatedSeats < c.minSeating) {
      score -= (c.minSeating - estimatedSeats) * 5;
      penalties.push(`Seating: ${estimatedSeats}/${c.minSeating} required`);
    }
  }

  // Color temperature
  if (c.colorTemperature && c.colorTemperature !== 'any' && palette.length > 0) {
    const lchs = palette.map(hexToLch);
    const warmCount = lchs.filter(([,,H]) => (H >= 0 && H <= 90) || H >= 330).length;
    const warmRatio = warmCount / lchs.length;
    if (c.colorTemperature === 'warm' && warmRatio < 0.3) { score -= 10; penalties.push('Palette too cool for brief'); }
    if (c.colorTemperature === 'cool' && warmRatio > 0.7) { score -= 10; penalties.push('Palette too warm for brief'); }
  }

  // Required elements
  if (c.requirePlant && !placedItems.some(i => (i.type||'').toLowerCase().includes('plant'))) {
    score -= 8; penalties.push('Brief expects greenery');
  }
  if (c.requireArt && !placedItems.some(i => (i.type||'').toLowerCase().includes('art'))) {
    score -= 8; penalties.push('Brief expects wall art');
  }

  // Budget compliance
  if (c.maxBudget && placedItems.length > 0) {
    const totalCost = placedItems.reduce((s, i) => s + (i.price || 0), 0);
    if (totalCost > c.maxBudget) {
      score -= 10; penalties.push(`Over budget: $${totalCost} / $${c.maxBudget}`);
    }
  }

  // ADA accessibility
  if (c.adaRequired) {
    // Check wheelchair turning radius and clearances
    const hasAdaSpace = true; // simplified — full check in Tier 2
    if (!hasAdaSpace) { score -= 15; penalties.push('ADA clearances not met'); }
  }

  return { score: Math.round(Math.min(100, Math.max(0, score))), penalties };
}

// ═══════════════════════════════════════════════════════════════════════════
// DIMENSION 7: DESIGN NARRATIVE & INTENTIONALITY
// ═══════════════════════════════════════════════════════════════════════════

function scoreDesignNarrative(items, palette, materials, options = {}) {
  if (!items || items.length === 0) return { total: 0, breakdown: {} };

  // 1. Color Story (25%): palette colors appear across multiple tiers
  let colorStoryScore = 50;
  if (palette && palette.length > 0) {
    const tiersWithPaletteColor = new Set();
    for (const item of items) {
      const tier = assignTier(item);
      for (const ic of (item.colors || [])) {
        for (const pc of palette) {
          if (deltaE(ic, pc) < 20) { tiersWithPaletteColor.add(tier); break; }
        }
      }
    }
    const tierSpread = tiersWithPaletteColor.size;
    if (tierSpread >= 4) colorStoryScore = 95;
    else if (tierSpread >= 3) colorStoryScore = 80;
    else if (tierSpread >= 2) colorStoryScore = 65;
  }

  // 2. Era Coherence (20%): items share temporal narrative
  const styleVector = computeStyleVector(items);
  const sortedStyles = Object.entries(styleVector).sort((a,b) => b[1]-a[1]);
  const eraCoherence = sortedStyles[0]?.[1] >= 0.5 ? 85 : sortedStyles[0]?.[1] >= 0.35 ? 70 : 55;

  // 3. Material Story (20%): repeated materials across tiers
  let materialStoryScore = 50;
  if (materials && materials.length > 0) {
    const materialTiers = {};
    for (const item of items) {
      const tier = assignTier(item);
      const itemMats = Array.isArray(item.materials) ? item.materials : [item.materials].filter(Boolean);
      for (const m of itemMats) {
        if (!materialTiers[m]) materialTiers[m] = new Set();
        materialTiers[m].add(tier);
      }
    }
    const crossTierMaterials = Object.values(materialTiers).filter(s => s.size >= 2).length;
    if (crossTierMaterials >= 3) materialStoryScore = 95;
    else if (crossTierMaterials >= 2) materialStoryScore = 80;
    else if (crossTierMaterials >= 1) materialStoryScore = 65;
  }

  // 4. Focal Hierarchy (20%): clear primary/secondary/supporting
  const weights = items.map(i => computeVisualWeight(i).total);
  const maxWeight = Math.max(...weights);
  const sortedWeights = [...weights].sort((a,b) => b-a);
  const topRatio = sortedWeights[0] / (sortedWeights[1] || 1);
  const focalScore = topRatio >= 1.3 && topRatio <= 3.0 ? 85 : topRatio > 3.0 ? 70 : 60;

  // 5. Restraint & Editing (15%): WVD in style-appropriate range, no redundant functions
  const wvd = computeWVD(items);
  const dominantStyle = sortedStyles[0]?.[0] || 'contemporary';
  const WVD_TARGETS = { minimalist: [0.15,0.30], modern: [0.20,0.40], maximalist: [0.45,0.70], _default: [0.25,0.45] };
  const targets = WVD_TARGETS[dominantStyle] || WVD_TARGETS._default;
  const restraintScore = (wvd >= targets[0] && wvd <= targets[1]) ? 90 : 60;

  const total = Math.round(
    colorStoryScore * 0.25 +
    eraCoherence * 0.20 +
    materialStoryScore * 0.20 +
    focalScore * 0.20 +
    restraintScore * 0.15
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: { colorStory: colorStoryScore, eraCohesion: eraCoherence, materialStory: materialStoryScore, focalHierarchy: focalScore, restraint: restraintScore }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD ROOM ANALYSIS OBJECT (for judge modifiers)
// ═══════════════════════════════════════════════════════════════════════════

function buildRoomAnalysis(items, palette, materials, spatialResult, styleResult) {
  const wvd = computeWVD(items);
  const munsells = (palette || []).map(hexToMunsell);
  const hueFamilies = [...new Set(munsells.map(m => m.hueFamily))];
  const avgChroma = munsells.reduce((s,m) => s + m.chroma, 0) / (munsells.length || 1);
  const t7Items = items.filter(i => assignTier(i) === 'T7');
  const anchorItems = items.filter(i => assignTier(i) === 'T1' || assignTier(i) === 'T2');
  const accessoryItems = items.filter(i => assignTier(i) === 'T6' || assignTier(i) === 'T7');

  // Balance analysis
  const balance = spatialResult?.details?.balance || {};
  const balanceImbalance = 1 - (balance.primaryBalance || 0.7);

  // Natural materials count
  const NATURAL = ['wood','bamboo','rattan','stone','marble','wool','linen','cotton','leather','clay','cork','jute'];
  const allMats = [...(materials || [])];
  items.forEach(i => { if (i.materials) allMats.push(...(Array.isArray(i.materials) ? i.materials : [i.materials])); });
  const naturalMaterialCount = allMats.filter(m => NATURAL.some(n => m.toLowerCase().includes(n))).length;

  const dominantStyleShare = styleResult?.details?.dominantShare || 0;
  const styleCount = Object.keys(styleResult?.details?.styleVector || {}).filter(k => (styleResult?.details?.styleVector[k] || 0) > 0.15).length;

  return {
    wvd,
    hueFamilyCount: hueFamilies.length,
    neutralDominant: munsells.filter(m => m.chroma < 4).length > munsells.length * 0.5,
    avgChroma: avgChroma * 5, // scale to perceptual range
    anchorToAccessoryRatio: anchorItems.length / (accessoryItems.length || 1),
    layeringScore: 0, // filled after layering scored
    patternTypes: 0, // simplified
    t7Count: t7Items.length,
    balanceImbalance,
    symmetryScore: 1 - balanceImbalance,
    naturalMaterialCount,
    hasVintage: items.some(i => (i.tags || []).includes('vintage') || (i.style || '').includes('vintage')),
    hasHandmade: items.some(i => (i.tags || []).includes('handmade')),
    hasNew: items.some(i => !(i.tags || []).includes('vintage')),
    dominantStyleShare,
    styleCount,
    hasUnifyingElement: naturalMaterialCount > 2 || hueFamilies.length <= 3,
    culturalOrigins: styleCount,
    goldenRatioMatches: spatialResult?.details?.proportions?.details?.filter(d => d.includes('+'))?.length || 0,
    focalAtIntersection: spatialResult?.details?.proportions?.score > 80,
    zoneCompleteness: spatialResult?.breakdown?.zoneCompleteness || 0,
    hasFormalityGradient: false, // requires multi-room data
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API — Drop-in V1 replacements + enhanced V2 APIs
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick preview scores (no judge bias). Use for live feedback during design.
 * V2: Returns 7 dimensions instead of V1's 3.
 */
export function previewScores(palette, placedItems, materials, brief, options = {}) {
  const { roomType = 'living', roomWidth = 240, roomDepth = 192, wallItems = [], wallData = [] } = options;

  const color = scoreColorHarmony(palette, { roomType, allItemColors: placedItems.flatMap(i => i.colors || []) });
  const spatial = scoreSpatialComposition(placedItems, { roomType, roomWidth, roomDepth });
  const style = scoreStyleCoherence(placedItems, palette, materials);
  const layering = scoreLayeringTexture(placedItems, { materials });
  const wall = scoreWallComposition(wallItems, { allItems: placedItems, wallData });
  const compliance = scoreBriefCompliance(placedItems, palette, materials, brief);
  const narrative = scoreDesignNarrative(placedItems, palette, materials);

  return {
    // V2 full dimensions
    color: color.total,
    spatial: spatial.total,
    style: style.total,
    layering: layering.total,
    wall: wall.total,
    brief: compliance.score,
    narrative: narrative.total,
    // V1 backward compat
    space: spatial.total,
    vibe: style.total,
    briefPenalties: compliance.penalties,
    // Breakdowns for UI
    colorBreakdown: color.breakdown,
    spatialBreakdown: spatial.breakdown,
    styleBreakdown: style.breakdown,
    layeringBreakdown: layering.breakdown,
    wallBreakdown: wall.breakdown,
    narrativeBreakdown: narrative.breakdown,
  };
}

/**
 * Full judge panel scoring. Returns array of 6 judge results.
 * V2: 7 dimensions, differentiated weights, academic-backed critiques.
 */
export function scoreWithJudges(palette, placedItems, materials, brief, options = {}) {
  const { roomType = 'living', roomWidth = 240, roomDepth = 192, wallItems = [], wallData = [] } = options;

  // Score all 7 dimensions
  const color = scoreColorHarmony(palette, { roomType, allItemColors: placedItems.flatMap(i => i.colors || []) });
  const spatial = scoreSpatialComposition(placedItems, { roomType, roomWidth, roomDepth });
  const style = scoreStyleCoherence(placedItems, palette, materials);
  const layering = scoreLayeringTexture(placedItems, { materials });
  const wall = scoreWallComposition(wallItems, { allItems: placedItems, wallData });
  const compliance = scoreBriefCompliance(placedItems, palette, materials, brief);
  const narrative = scoreDesignNarrative(placedItems, palette, materials);

  const baseDimensions = {
    color: color.total,
    spatial: spatial.total,
    style: style.total,
    layering: layering.total,
    wall: wall.total,
    brief: compliance.score,
    narrative: narrative.total,
  };

  // Build room analysis for judge modifiers
  const roomAnalysis = buildRoomAnalysis(placedItems, palette, materials, spatial, style);
  roomAnalysis.layeringScore = layering.total;
  roomAnalysis.dsdPassRate = spatial.details?.dsd?.passRate || 1;
  roomAnalysis.briefPenalties = compliance.penalties;

  // Top DSD violation for critique
  if (spatial.details?.dsd?.violations?.length > 0) {
    roomAnalysis.topViolation = violationCritique(spatial.details.dsd.violations[0]);
  }

  // Score each judge
  return JUDGES.map(judge => {
    // Apply judge-specific modifiers
    const modifiedScores = applyJudgeModifiers(judge, { ...baseDimensions }, roomAnalysis);

    // Apply designer-opinion-based modifiers
    try {
      const opMods = getOpinionModifiers(judge.id, roomAnalysis);
      for (const [dim, mod] of Object.entries(opMods)) {
        if (modifiedScores[dim] !== undefined) {
          modifiedScores[dim] = Math.min(100, Math.max(0, modifiedScores[dim] + mod));
        }
      }
    } catch { /* DesignerOpinions not available — graceful fallback */ }

    // Compute weighted total
    const total = computeJudgeScore(judge, modifiedScores);

    // Generate critique
    const critique = generateCritique(judge, modifiedScores, total, roomAnalysis);

    return {
      judge,
      scores: modifiedScores,
      total,
      critique,
      briefPenalties: compliance.penalties,
      // V1 backward compat
      ...(() => {
        const s = modifiedScores;
        return { scores: { ...s, space: s.spatial, vibe: s.style } };
      })()
    };
  }).sort((a, b) => b.total - a.total);
}

/**
 * Composite score — single number for leaderboard ranking.
 * Average of all 6 judges' totals.
 */
export function compositeScore(judgeResults) {
  if (!judgeResults || judgeResults.length === 0) return 0;
  return Math.round(judgeResults.reduce((s, r) => s + r.total, 0) / judgeResults.length);
}

/**
 * DSD Standards audit — standalone access to the standards database
 */
export function auditDesignStandards(roomType, measurements) {
  return auditRoom(roomType, measurements);
}

/**
 * Get item tier classification
 */
export function classifyItem(item) {
  return { tier: assignTier(item), ...ITEM_TIERS[assignTier(item)] };
}

/**
 * Get Weighted Visual Density
 */
export function getWVD(items, roomWidth, roomDepth) {
  return computeWVD(items, roomWidth, roomDepth);
}

// ── Export for backward compatibility with V1 consumers ──────────────────
export { scoreBriefCompliance };
export default {
  previewScores, scoreWithJudges, compositeScore, JUDGES,
  scoreBriefCompliance, auditDesignStandards, classifyItem, getWVD
};
