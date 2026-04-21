// ═══════════════════════════════════════════════════════════════════════════
// LAYERING & TEXTURE ENGINE — V2 AI Design Analysis Engine
// Evaluates textural depth, material mix, vignette composition,
// layer completeness, and biophilic design elements.
// Sources: Kellert (2015), Wilson (1984), NCIDQ curriculum
// ═══════════════════════════════════════════════════════════════════════════

import { assignTier } from './StyleEngine.js';

// ── Five Interior Layers ─────────────────────────────────────────────────
const LAYERS = {
  structural:  { name: 'Structural', desc: 'Walls, floors, ceiling, fixed elements', types: ['wall','floor','ceiling','fireplace','builtIn'] },
  foundation:  { name: 'Foundation', desc: 'Major furniture, rugs, curtains', types: ['sofa','bed','diningTable','rug','curtain','armoire','sectional'] },
  accent:      { name: 'Accent', desc: 'Accent furniture, lighting, statement pieces', types: ['accentChair','console','floorLamp','pendant','chandelier','ottoman'] },
  styling:     { name: 'Styling', desc: 'Decorative objects, art, books, trays', types: ['vase','candle','book','tray','frame','painting','print','mirror','sculpture','clock'] },
  organic:     { name: 'Organic', desc: 'Plants, natural elements, flowers', types: ['plant','driedFloral','branch','terrarium','succulent','wreath','flowers'] },
};

// ── Texture Categories ───────────────────────────────────────────────────
const TEXTURE_FAMILIES = {
  smooth:    ['glass','lacquer','mirror','polished_metal','acrylic','marble_polished'],
  soft:      ['velvet','chenille','mohair','faux_fur','cashmere','silk'],
  woven:     ['linen','cotton','jute','sisal','rattan','wicker','kilim','wool'],
  rough:     ['stone','brick','concrete','unfinished_wood','bark','terracotta'],
  metallic:  ['brass','chrome','iron','copper','gold','steel','silver'],
  organic:   ['wood_grain','leather','cork','bamboo','shell','bone','horn'],
  patterned: ['printed_fabric','wallpaper','tile','mosaic','inlay'],
};

// ── Natural Material Tags (for biophilic scoring) ────────────────────────
const NATURAL_MATERIALS = [
  'wood','bamboo','rattan','wicker','stone','marble','granite','slate',
  'cork','jute','sisal','wool','linen','cotton','leather','clay',
  'terracotta','ceramic','shell','bone','horn','silk','hemp','seagrass'
];

// ── Layer Completeness Scoring (25%) ─────────────────────────────────────

function scoreLayerCompleteness(items) {
  const detectedLayers = new Set();

  for (const item of items) {
    const itemType = (item.type || item.category || '').toLowerCase();
    for (const [layerKey, layerDef] of Object.entries(LAYERS)) {
      if (layerDef.types.some(t => itemType.includes(t) || t.includes(itemType))) {
        detectedLayers.add(layerKey);
      }
    }
  }

  // Structural layer is always assumed present (walls exist)
  detectedLayers.add('structural');

  const completeness = detectedLayers.size / Object.keys(LAYERS).length;
  let score;
  if (completeness >= 1.0) score = 100; // all 5 layers
  else if (completeness >= 0.8) score = 85; // 4 layers
  else if (completeness >= 0.6) score = 70; // 3 layers
  else if (completeness >= 0.4) score = 50; // 2 layers
  else score = 30;

  return { score, layers: [...detectedLayers], missing: Object.keys(LAYERS).filter(l => !detectedLayers.has(l)) };
}

// ── Texture Variety Scoring (25%) ────────────────────────────────────────

function scoreTextureVariety(items, materials = []) {
  const detectedFamilies = new Set();

  // From item materials/tags
  for (const item of items) {
    const itemMats = item.materials || item.material || [];
    const matList = Array.isArray(itemMats) ? itemMats : [itemMats];
    for (const mat of matList) {
      for (const [family, members] of Object.entries(TEXTURE_FAMILIES)) {
        if (members.some(m => mat.toLowerCase().includes(m) || m.includes(mat.toLowerCase()))) {
          detectedFamilies.add(family);
        }
      }
    }
  }

  // From room-level materials selection
  for (const mat of materials) {
    for (const [family, members] of Object.entries(TEXTURE_FAMILIES)) {
      if (members.some(m => mat.toLowerCase().includes(m) || m.includes(mat.toLowerCase()))) {
        detectedFamilies.add(family);
      }
    }
  }

  // Heuristic: infer textures from item types
  for (const item of items) {
    const type = (item.type || '').toLowerCase();
    if (type === 'plant' || type === 'botanical') detectedFamilies.add('organic');
    if (type === 'textile' || type === 'pillow' || type === 'blanket') detectedFamilies.add('soft');
    if (type === 'rug') detectedFamilies.add('woven');
    if (type === 'lighting') detectedFamilies.add('metallic');
    if (type === 'art' || type === 'mirror') detectedFamilies.add('smooth');
  }

  const count = detectedFamilies.size;
  let score;
  if (count >= 5) score = 95;
  else if (count >= 4) score = 85;
  else if (count >= 3) score = 72;
  else if (count >= 2) score = 55;
  else score = 35; // monotextural

  return { score, families: [...detectedFamilies], count };
}

// ── Material Mix Balance (20%) ───────────────────────────────────────────
// Hard-soft, warm-cool, natural-manufactured balance

function scoreMaterialMix(items, materials = []) {
  let hardCount = 0, softCount = 0;
  let warmMat = 0, coolMat = 0;
  let naturalCount = 0, manufacturedCount = 0;

  const allMats = [...materials];
  for (const item of items) {
    const itemMats = item.materials || item.material || [];
    const matList = Array.isArray(itemMats) ? itemMats : [itemMats];
    allMats.push(...matList);
  }

  for (const mat of allMats) {
    const m = mat.toLowerCase();
    // Hard vs Soft
    if (['glass','metal','stone','marble','concrete','iron','steel','chrome','wood'].some(h => m.includes(h))) hardCount++;
    if (['velvet','linen','cotton','wool','silk','leather','fur','chenille'].some(s => m.includes(s))) softCount++;
    // Warm vs Cool
    if (['wood','brass','copper','gold','terracotta','leather','warm'].some(w => m.includes(w))) warmMat++;
    if (['chrome','steel','glass','marble','silver','cool','blue'].some(c => m.includes(c))) coolMat++;
    // Natural vs Manufactured
    if (NATURAL_MATERIALS.some(n => m.includes(n))) naturalCount++;
    else manufacturedCount++;
  }

  const total = allMats.length || 1;
  const hardSoftBalance = 1 - Math.abs((hardCount - softCount) / total);
  const warmCoolBalance = 1 - Math.abs((warmMat - coolMat) / total) * 0.5;
  const natManBalance = naturalCount > 0 ? Math.min(1, naturalCount / (total * 0.4)) : 0.3;

  const score = Math.round((hardSoftBalance * 35 + warmCoolBalance * 30 + natManBalance * 35));
  return {
    score: Math.max(30, Math.min(100, score)),
    details: { hardCount, softCount, warmMat, coolMat, naturalCount, manufacturedCount }
  };
}

// ── Vignette Composition (15%) ───────────────────────────────────────────
// Gestalt proximity groups evaluated for composition quality

function scoreVignetteComposition(items) {
  // Find small object clusters (T5-T7 items near each other)
  const stylingItems = items.filter(i => {
    const tier = assignTier(i);
    return tier === 'T5' || tier === 'T6' || tier === 'T7';
  });

  if (stylingItems.length < 3) return { score: 50, vignettes: 0 };

  // Simple proximity clustering
  const SVG_SCALE = 2.25;
  const VIGNETTE_RADIUS = 18 * SVG_SCALE; // 18 inches
  const visited = new Set();
  const vignettes = [];

  for (let i = 0; i < stylingItems.length; i++) {
    if (visited.has(i)) continue;
    const group = [i];
    visited.add(i);
    for (let j = i+1; j < stylingItems.length; j++) {
      if (visited.has(j)) continue;
      const dist = Math.sqrt(
        ((stylingItems[i].x || 0) - (stylingItems[j].x || 0))**2 +
        ((stylingItems[i].y || 0) - (stylingItems[j].y || 0))**2
      );
      if (dist < VIGNETTE_RADIUS) {
        visited.add(j);
        group.push(j);
      }
    }
    if (group.length >= 3) vignettes.push(group);
  }

  let score = 50;
  for (const vig of vignettes) {
    // Odd number bonus
    if (vig.length % 2 === 1) score += 8;
    else score += 4;
    // Size: 3-7 is ideal
    if (vig.length >= 3 && vig.length <= 7) score += 5;
    else if (vig.length > 7) score -= 3; // overcrowded
  }

  return { score: Math.min(100, score), vignettes: vignettes.length };
}

// ── Biophilic Credit (15%) ───────────────────────────────────────────────
// Source: Kellert & Calabrese (2015). The Practice of Biophilic Design.

function scoreBiophilic(items, materials = []) {
  let score = 30; // base (no nature = low)
  const credits = [];

  // T7 botanical items
  const botanicals = items.filter(i => {
    const type = (i.type || '').toLowerCase();
    return type.includes('plant') || type.includes('floral') || type.includes('botanical') ||
           type.includes('branch') || type.includes('terrarium') || type.includes('succulent');
  });
  if (botanicals.length >= 1) { score += 15; credits.push('Live plants present'); }
  if (botanicals.length >= 3) { score += 10; credits.push('Multiple botanical elements'); }
  if (botanicals.length >= 5) { score += 5; credits.push('Rich botanical presence'); }

  // Natural materials
  const allMats = [...materials];
  items.forEach(i => {
    const m = i.materials || i.material || [];
    allMats.push(...(Array.isArray(m) ? m : [m]));
  });
  const naturalMats = allMats.filter(m => NATURAL_MATERIALS.some(n => m.toLowerCase().includes(n)));
  if (naturalMats.length >= 2) { score += 10; credits.push('Natural materials (wood, stone, etc.)'); }
  if (naturalMats.length >= 5) { score += 10; credits.push('Rich natural material palette'); }

  // Natural light (if window data present)
  const hasWindows = items.some(i => (i.type || '').toLowerCase().includes('window'));
  if (hasWindows) { score += 5; credits.push('Natural light sources'); }

  // Water features
  const hasWater = items.some(i => (i.type || '').toLowerCase().includes('water') || (i.type || '').toLowerCase().includes('fountain'));
  if (hasWater) { score += 10; credits.push('Water feature'); }

  return { score: Math.min(100, score), credits };
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER LAYERING SCORING
// Layer Completeness(25%), Texture Variety(25%), Material Mix(20%),
// Vignette Composition(15%), Biophilic Credit(15%)
// ═══════════════════════════════════════════════════════════════════════════

export function scoreLayeringTexture(items, options = {}) {
  const { materials = [] } = options;

  if (!items || items.length === 0) return { total: 0, breakdown: {} };

  const layers = scoreLayerCompleteness(items);
  const texture = scoreTextureVariety(items, materials);
  const materialMix = scoreMaterialMix(items, materials);
  const vignettes = scoreVignetteComposition(items);
  const biophilic = scoreBiophilic(items, materials);

  const total = Math.round(
    layers.score * 0.25 +
    texture.score * 0.25 +
    materialMix.score * 0.20 +
    vignettes.score * 0.15 +
    biophilic.score * 0.15
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      layerCompleteness: layers.score,
      textureVariety: texture.score,
      materialMix: materialMix.score,
      vignetteComposition: vignettes.score,
      biophilicCredit: biophilic.score
    },
    details: { layers, texture, materialMix, vignettes, biophilic }
  };
}

export default {
  LAYERS, TEXTURE_FAMILIES, NATURAL_MATERIALS,
  scoreLayeringTexture
};