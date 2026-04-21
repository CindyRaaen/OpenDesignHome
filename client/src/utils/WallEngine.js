// ═══════════════════════════════════════════════════════════════════════════
// WALL COMPOSITION ENGINE — V2 AI Design Analysis Engine
// Art placement, lighting composition, window treatments,
// feature wall detection, vertical balance (Arnheim).
// Sources: Museum hanging standards, NCIDQ, IESNA, Ballast IDRM
// ═══════════════════════════════════════════════════════════════════════════

import { computeVisualWeight } from './SpatialEngine.js';

// ── Art Placement Scoring (25%) ──────────────────────────────────────────
// DSD standards: 57-60" center, 6-12" above furniture, 50-75% furniture width

function scoreArtPlacement(wallItems) {
  if (!wallItems || wallItems.length === 0) return { score: 40, issues: ['No wall art detected'] };

  let score = 70;
  const issues = [];
  const artItems = wallItems.filter(i => {
    const t = (i.type || '').toLowerCase();
    return t.includes('art') || t.includes('painting') || t.includes('print') ||
           t.includes('mirror') || t.includes('photo') || t.includes('poster');
  });

  if (artItems.length === 0) return { score: 40, issues: ['No wall art detected'] };

  for (const art of artItems) {
    const centerY = art.y || 0;
    const artW = art.w || 24;

    // Height check: 57-60" center on freestanding walls
    if (!art.furnitureBelow) {
      // Freestanding — museum standard
      if (centerY >= 57 && centerY <= 60) score += 8;
      else if (centerY >= 54 && centerY <= 63) score += 4;
      else { score -= 6; issues.push(`Art "${art.name || 'piece'}" center at ${centerY}in, standard is 57-60in`); }
    } else {
      // Above furniture — 6-12" gap
      const gap = art.gapAboveFurniture || 0;
      if (gap >= 6 && gap <= 12) score += 6;
      else if (gap >= 3 && gap <= 15) score += 2;
      else { score -= 5; issues.push(`Art gap above furniture: ${gap}in, standard is 6-12in`); }

      // Width ratio: 50-75% of furniture below
      if (art.furnitureBelowWidth) {
        const ratio = artW / art.furnitureBelowWidth;
        if (ratio >= 0.5 && ratio <= 0.75) score += 5;
        else if (ratio >= 0.4 && ratio <= 0.85) score += 2;
        else { score -= 4; issues.push(`Art width ratio ${(ratio*100).toFixed(0)}%, standard is 50-75%`); }
      }
    }
  }

  // Gallery wall spacing check
  if (artItems.length >= 3) {
    score += 5; // gallery wall bonus
  }

  return { score: Math.min(100, Math.max(20, score)), issues };
}

// ── Lighting Composition (20%) ───────────────────────────────────────────

function scoreLightingComposition(wallItems, allItems = []) {
  let score = 50;
  const issues = [];

  // Detect lighting layers
  const hasAmbient = allItems.some(i => {
    const t = (i.type || '').toLowerCase();
    return t.includes('chandelier') || t.includes('ceiling') || t.includes('recessed');
  });
  const hasTask = allItems.some(i => {
    const t = (i.type || '').toLowerCase();
    return t.includes('desk') || t.includes('table lamp') || t.includes('reading');
  });
  const hasAccent = allItems.some(i => {
    const t = (i.type || '').toLowerCase();
    return t.includes('sconce') || t.includes('accent') || t.includes('spotlight') || t.includes('floor lamp');
  });

  const layerCount = [hasAmbient, hasTask, hasAccent].filter(Boolean).length;
  if (layerCount >= 3) { score = 95; }
  else if (layerCount === 2) { score = 75; }
  else if (layerCount === 1) { score = 55; issues.push('Only 1 lighting layer. Add task or accent lighting.'); }
  else { score = 30; issues.push('No identifiable lighting layers.'); }

  // Wall-mounted lighting check
  const sconces = wallItems.filter(i => (i.type || '').toLowerCase().includes('sconce'));
  if (sconces.length >= 2) {
    // Check symmetric placement
    score += 5;
  }

  return { score: Math.min(100, score), issues, layerCount };
}

// ── Window Treatment Scoring (20%) ───────────────────────────────────────

function scoreWindowTreatments(wallItems) {
  const curtains = wallItems.filter(i => {
    const t = (i.type || '').toLowerCase();
    return t.includes('curtain') || t.includes('drape') || t.includes('blind') || t.includes('shade');
  });

  if (curtains.length === 0) {
    // No window treatments — might be intentional (modern/minimal)
    return { score: 60, issues: ['No window treatments detected'] };
  }

  let score = 75;
  const issues = [];

  for (const curtain of curtains) {
    // Rod height above window
    if (curtain.rodHeightAboveFrame !== undefined) {
      const h = curtain.rodHeightAboveFrame;
      if (h >= 4 && h <= 6) score += 5;
      else if (h >= 2 && h <= 8) score += 2;
      else { score -= 4; issues.push(`Rod height ${h}in above frame, standard 4-6in`); }
    }

    // Curtain length
    if (curtain.lengthFromFloor !== undefined) {
      const l = curtain.lengthFromFloor;
      if (l <= 0.5 || (l >= 2 && l <= 3)) score += 5; // kissing floor or puddle
      else if (l > 1 && l < 5) { score -= 3; issues.push('Curtain too short — should kiss floor or puddle'); }
    }

    // Fullness ratio
    if (curtain.fullnessRatio !== undefined) {
      const r = curtain.fullnessRatio;
      if (r >= 2.0 && r <= 2.5) score += 5;
      else if (r >= 1.5 && r < 2.0) { score -= 2; issues.push('Curtain fullness ratio low — looks flat'); }
    }
  }

  return { score: Math.min(100, Math.max(30, score)), issues };
}

// ── Feature Wall Detection (15%) ─────────────────────────────────────────

function scoreFeatureWall(wallData) {
  // wallData: array of wall objects with { id, color, items[], hasAccentColor, hasTexture }
  if (!wallData || wallData.length === 0) return { score: 50, issues: ['No wall data available'] };

  const issues = [];
  let hasFeature = false;
  let allIdentical = true;

  const firstWallColor = wallData[0]?.color;
  for (const wall of wallData) {
    if (wall.color !== firstWallColor || wall.hasAccentColor || wall.hasTexture) {
      allIdentical = false;
    }
    if (wall.hasAccentColor || wall.hasTexture || (wall.items && wall.items.length >= 3)) {
      hasFeature = true;
    }
  }

  let score;
  if (hasFeature && !allIdentical) {
    score = 90; // intentional feature wall
  } else if (!allIdentical) {
    score = 75; // some variation
  } else if (allIdentical && wallData.some(w => w.items && w.items.length > 0)) {
    score = 65; // all same color but decorated
  } else {
    score = 45; // all identical, bare
    issues.push('All walls identical — consider a feature wall');
  }

  return { score, issues, hasFeature };
}

// ── Vertical Balance (20%) ───────────────────────────────────────────────
// Arnheim visual weight distribution floor-to-ceiling

function scoreVerticalBalance(wallItems) {
  if (!wallItems || wallItems.length === 0) return { score: 50, issues: [] };

  // Divide wall into 3 zones: lower (0-33%), middle (33-66%), upper (66-100%)
  const maxHeight = 96; // 8-foot ceiling in inches
  let lowerWeight = 0, middleWeight = 0, upperWeight = 0;

  for (const item of wallItems) {
    const centerY = item.y || item.centerHeight || 48;
    const zone = centerY / maxHeight;
    const weight = (item.w || 12) * (item.h || 12) / 100; // simple area-based weight

    if (zone <= 0.33) lowerWeight += weight;
    else if (zone <= 0.66) middleWeight += weight;
    else upperWeight += weight;
  }

  const totalWeight = lowerWeight + middleWeight + upperWeight || 1;

  // Ideal: most weight in middle zone, decreasing toward top
  // Top-heavy is worst
  let score = 70;
  const issues = [];

  const upperRatio = upperWeight / totalWeight;
  const middleRatio = middleWeight / totalWeight;

  if (middleRatio >= 0.5 && upperRatio <= 0.3) {
    score = 90; // well-balanced
  } else if (upperRatio > 0.5) {
    score = 50;
    issues.push('Wall composition is top-heavy — lower art or add middle-zone elements');
  } else if (middleRatio < 0.3) {
    score = 60;
    issues.push('Most wall elements at extremes — add middle-zone art or shelving');
  }

  return { score, issues, distribution: { lower: lowerWeight, middle: middleWeight, upper: upperWeight } };
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER WALL COMPOSITION SCORING
// Art Placement(25%), Lighting(20%), Window Treatment(20%),
// Feature Wall(15%), Vertical Balance(20%)
// ═══════════════════════════════════════════════════════════════════════════

export function scoreWallComposition(wallItems, options = {}) {
  const { allItems = [], wallData = [] } = options;

  const wallDecor = wallItems || [];

  const art = scoreArtPlacement(wallDecor);
  const lighting = scoreLightingComposition(wallDecor, allItems);
  const windows = scoreWindowTreatments(wallDecor);
  const feature = scoreFeatureWall(wallData);
  const vertical = scoreVerticalBalance(wallDecor);

  const total = Math.round(
    art.score * 0.25 +
    lighting.score * 0.20 +
    windows.score * 0.20 +
    feature.score * 0.15 +
    vertical.score * 0.20
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      artPlacement: art.score,
      lightingComposition: lighting.score,
      windowTreatment: windows.score,
      featureWall: feature.score,
      verticalBalance: vertical.score
    },
    details: { art, lighting, windows, feature, vertical }
  };
}

export default { scoreWallComposition };