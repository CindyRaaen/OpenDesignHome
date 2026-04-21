// ═══════════════════════════════════════════════════════════════════════════
// SPATIAL ENGINE — V2 AI Design Analysis Engine
// Arnheim visual weight & balance, Gestalt principles, proportion systems,
// circulation analysis, zone completeness, conversation geometry.
// Sources: Arnheim (1954), Wertheimer (1923), Le Corbusier (1948),
//          Markowsky (1992), Ballast IDRM, Architectural Graphic Standards
// ═══════════════════════════════════════════════════════════════════════════

import { hexToLch, hexToMunsell } from './ColorEngine.js';
import { auditRoom } from './DesignStandardsDB.js';

// ── Constants ────────────────────────────────────────────────────────────
const SVG_SCALE = 2.25; // inches to SVG units
const ROOM_X = 60, ROOM_Y = 60;

// ── Arnheim Visual Weight ────────────────────────────────────────────────
// Source: Arnheim, R. (1954). Art and Visual Perception.
// Visual weight = f(size, value, temperature, chroma, texture, isolation, position)

export function computeVisualWeight(item, roomWidth = 240, roomDepth = 192) {
  const w = item.w || 24;
  const d = item.d || 20;
  const area = w * d;
  const maxArea = roomWidth * roomDepth * 0.15; // largest single item ~15% of room

  // 1. Size factor (0-3): larger = heavier
  const sizeFactor = Math.min(3, (area / maxArea) * 3);

  // 2. Value factor (0-2): darker = heavier
  let valueFactor = 1.0;
  if (item.colors && item.colors.length > 0) {
    const lch = hexToLch(item.colors[0]);
    valueFactor = 2.0 - (lch[0] / 50); // L*=0 → 2.0, L*=100 → 0
    valueFactor = Math.max(0, Math.min(2, valueFactor));
  }

  // 3. Temperature factor (0-1): warm = heavier
  let tempFactor = 0.5;
  if (item.colors && item.colors.length > 0) {
    const lch = hexToLch(item.colors[0]);
    const H = lch[2];
    tempFactor = ((H >= 0 && H <= 90) || H >= 330) ? 0.8 : 0.3;
  }

  // 4. Chroma factor (0-1.5): saturated = heavier
  let chromaFactor = 0.5;
  if (item.colors && item.colors.length > 0) {
    const lch = hexToLch(item.colors[0]);
    chromaFactor = Math.min(1.5, lch[1] / 40);
  }

  // 5. Texture/detail factor (0-1): ornate = heavier
  const textureFactor = item.textureComplexity || (item.style === 'traditional' ? 0.9 : item.style === 'modern' ? 0.3 : 0.5);

  // 6. Isolation factor (0-1): computed from proximity to other items
  const isolationFactor = item._isolationScore || 0.5;

  // 7. Vertical position factor (0-1): higher = heavier (less stable)
  const yPos = ((item.y || ROOM_Y) - ROOM_Y) / (roomDepth * SVG_SCALE);
  const verticalFactor = yPos < 0.3 ? 0.3 : yPos > 0.7 ? 0.9 : 0.5;

  const totalWeight = sizeFactor + valueFactor + tempFactor + chromaFactor + textureFactor + isolationFactor + verticalFactor;
  return {
    total: Math.round(totalWeight * 100) / 100,
    factors: { sizeFactor, valueFactor, tempFactor, chromaFactor, textureFactor, isolationFactor, verticalFactor }
  };
}

// ── Visual Balance Scoring ───────────────────────────────────────────────

export function scoreVisualBalance(items, roomWidth = 240, roomDepth = 192) {
  if (!items || items.length === 0) return { score: 50, balance: {} };

  const roomCenterX = ROOM_X + (roomWidth * SVG_SCALE) / 2;
  const roomCenterY = ROOM_Y + (roomDepth * SVG_SCALE) / 2;

  // Compute visual weight for each item
  const weighted = items.map(item => {
    const vw = computeVisualWeight(item, roomWidth, roomDepth);
    const cx = (item.x || ROOM_X) + (item.w || 24) * SVG_SCALE / 2;
    const cy = (item.y || ROOM_Y) + (item.d || 20) * SVG_SCALE / 2;
    return { ...item, visualWeight: vw.total, cx, cy };
  });

  // Balance along primary (left-right) axis
  const leftWeight = weighted.filter(i => i.cx < roomCenterX)
    .reduce((s, i) => s + i.visualWeight * Math.abs(roomCenterX - i.cx), 0);
  const rightWeight = weighted.filter(i => i.cx >= roomCenterX)
    .reduce((s, i) => s + i.visualWeight * Math.abs(i.cx - roomCenterX), 0);
  const totalMoment = leftWeight + rightWeight || 1;
  const primaryBalance = 1 - Math.abs(leftWeight - rightWeight) / totalMoment;

  // Balance along secondary (front-back) axis
  const frontWeight = weighted.filter(i => i.cy >= roomCenterY)
    .reduce((s, i) => s + i.visualWeight * Math.abs(i.cy - roomCenterY), 0);
  const backWeight = weighted.filter(i => i.cy < roomCenterY)
    .reduce((s, i) => s + i.visualWeight * Math.abs(roomCenterY - i.cy), 0);
  const totalMomentY = frontWeight + backWeight || 1;
  const secondaryBalance = 1 - Math.abs(frontWeight - backWeight) / totalMomentY;

  // Combined score: primary axis matters more
  const balanceScore = Math.round((primaryBalance * 0.6 + secondaryBalance * 0.4) * 100);

  return {
    score: Math.max(30, Math.min(100, balanceScore)),
    balance: { primaryBalance, secondaryBalance, leftWeight, rightWeight, frontWeight, backWeight },
    weightedItems: weighted
  };
}

// ── Gestalt Principles ───────────────────────────────────────────────────
// Source: Wertheimer (1923). Laws of Organization in Perceptual Forms.

export function evaluateGestalt(items, roomWidth = 240, roomDepth = 192) {
  if (!items || items.length < 2) return { score: 50, principles: {} };

  const principles = {};

  // 1. PROXIMITY: items within 24" form groups
  const groups = findProximityGroups(items, 24 * SVG_SCALE);
  const hasGroups = groups.length > 0 && groups.some(g => g.length >= 2 && g.length <= 7);
  principles.proximity = hasGroups ? 'strong' : groups.length > 0 ? 'moderate' : 'weak';

  // 2. SIMILARITY: repeated colors/materials across items
  const colorRepetitions = countColorRepetitions(items);
  principles.similarity = colorRepetitions >= 3 ? 'strong' : colorRepetitions >= 1 ? 'moderate' : 'weak';

  // 3. CLOSURE: seating forming enclosed space
  const seating = items.filter(i => i.type === 'Seating' || i.tier <= 2);
  const hasEnclosure = detectConversationEnclosure(seating);
  principles.closure = hasEnclosure ? 'strong' : 'weak';

  // 4. FIGURE-GROUND: contrast between furniture and background
  principles.figureGround = 'moderate'; // requires wall color data for full evaluation

  // 5. CONTINUITY: aligned elements along axes
  const alignmentScore = evaluateAlignment(items);
  principles.continuity = alignmentScore > 70 ? 'strong' : alignmentScore > 40 ? 'moderate' : 'weak';

  // 6. COMMON FATE: seating facing same direction
  const commonFate = evaluateCommonFate(items);
  principles.commonFate = commonFate;

  // Score: more strong principles = better composition
  const strongCount = Object.values(principles).filter(v => v === 'strong').length;
  const moderateCount = Object.values(principles).filter(v => v === 'moderate').length;
  const score = Math.round(Math.min(100, 50 + strongCount * 10 + moderateCount * 4));

  return { score, principles, groups };
}

function findProximityGroups(items, threshold) {
  const visited = new Set();
  const groups = [];

  for (let i = 0; i < items.length; i++) {
    if (visited.has(i)) continue;
    const group = [i];
    visited.add(i);
    const stack = [i];

    while (stack.length > 0) {
      const curr = stack.pop();
      for (let j = 0; j < items.length; j++) {
        if (visited.has(j)) continue;
        const dist = itemDistance(items[curr], items[j]);
        if (dist < threshold) {
          visited.add(j);
          group.push(j);
          stack.push(j);
        }
      }
    }
    if (group.length >= 2) groups.push(group);
  }
  return groups;
}

function itemDistance(a, b) {
  const ax = (a.x || 0) + (a.w || 24) * SVG_SCALE / 2;
  const ay = (a.y || 0) + (a.d || 20) * SVG_SCALE / 2;
  const bx = (b.x || 0) + (b.w || 24) * SVG_SCALE / 2;
  const by = (b.y || 0) + (b.d || 20) * SVG_SCALE / 2;
  return Math.sqrt((ax-bx)**2 + (ay-by)**2);
}

function countColorRepetitions(items) {
  const colorMap = {};
  for (const item of items) {
    for (const c of (item.colors || [])) {
      const key = c.toLowerCase().slice(0, 4); // group similar
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
  }
  return Object.values(colorMap).filter(v => v >= 2).length;
}

function detectConversationEnclosure(seatingItems) {
  if (seatingItems.length < 3) return false;
  // Check if seating forms a U or L shape (3+ sides of a rectangle)
  const xs = seatingItems.map(i => (i.x || 0) + (i.w || 24) * SVG_SCALE / 2);
  const ys = seatingItems.map(i => (i.y || 0) + (i.d || 20) * SVG_SCALE / 2);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);
  return xRange > 100 && yRange > 100; // items span both axes
}

function evaluateAlignment(items) {
  if (items.length < 3) return 50;
  // Check horizontal and vertical alignment clusters
  const xs = items.map(i => (i.x || 0));
  const ys = items.map(i => (i.y || 0));

  let alignedPairs = 0;
  const tolerance = 10; // SVG units
  for (let i = 0; i < items.length; i++) {
    for (let j = i+1; j < items.length; j++) {
      if (Math.abs(xs[i] - xs[j]) < tolerance || Math.abs(ys[i] - ys[j]) < tolerance) {
        alignedPairs++;
      }
    }
  }
  const maxPairs = items.length * (items.length - 1) / 2;
  return Math.round((alignedPairs / Math.max(maxPairs, 1)) * 100);
}

function evaluateCommonFate(items) {
  const seating = items.filter(i => i.type === 'Seating');
  if (seating.length < 2) return 'moderate';
  // Check if seating faces similar directions (rotation property)
  const rotations = seating.map(i => i.rotation || 0);
  const avgRot = rotations.reduce((a,b) => a+b, 0) / rotations.length;
  const variance = rotations.reduce((s,r) => s + Math.abs(r - avgRot), 0) / rotations.length;
  return variance < 30 ? 'strong' : variance < 90 ? 'moderate' : 'weak';
}

// ── Proportion Systems ───────────────────────────────────────────────────
// Golden Ratio, Rule of Thirds, Odd Number Principle

const PHI = 1.618;

export function scoreProportions(items, roomWidth = 240, roomDepth = 192) {
  let score = 70; // base
  const details = [];

  // Room proportion: is it close to golden ratio?
  const roomRatio = Math.max(roomWidth, roomDepth) / Math.min(roomWidth, roomDepth);
  if (Math.abs(roomRatio - PHI) < 0.15) {
    score += 5;
    details.push('Room proportions near golden ratio (+5)');
  }

  // Rule of Thirds: key items at grid intersections
  const thirdX1 = ROOM_X + (roomWidth * SVG_SCALE) / 3;
  const thirdX2 = ROOM_X + (roomWidth * SVG_SCALE) * 2 / 3;
  const thirdY1 = ROOM_Y + (roomDepth * SVG_SCALE) / 3;
  const thirdY2 = ROOM_Y + (roomDepth * SVG_SCALE) * 2 / 3;
  const intersections = [
    [thirdX1, thirdY1], [thirdX2, thirdY1],
    [thirdX1, thirdY2], [thirdX2, thirdY2]
  ];

  const anchors = items.filter(i => (i.tier || 3) <= 2); // T1-T2 items
  for (const anchor of anchors) {
    const cx = (anchor.x || 0) + (anchor.w || 24) * SVG_SCALE / 2;
    const cy = (anchor.y || 0) + (anchor.d || 20) * SVG_SCALE / 2;
    for (const [ix, iy] of intersections) {
      if (Math.abs(cx - ix) < 40 && Math.abs(cy - iy) < 40) {
        score += 3;
        details.push(`${anchor.name || 'Anchor'} near rule-of-thirds intersection (+3)`);
        break;
      }
    }
  }

  // Odd Number Principle for vignette groupings
  const groups = findProximityGroups(items, 24 * SVG_SCALE);
  for (const group of groups) {
    if (group.length % 2 === 1 && group.length >= 3 && group.length <= 7) {
      score += 2;
      details.push(`Vignette of ${group.length} (odd number) (+2)`);
    }
  }

  return { score: Math.min(100, score), details };
}

// ── Circulation Analysis ─────────────────────────────────────────────────

export function scoreCirculation(items, roomWidth = 240, roomDepth = 192) {
  if (!items || items.length === 0) return { score: 90, violations: [] };

  const violations = [];
  let penalty = 0;

  // Check all item pairs for clearance violations
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    const aLeft = (a.x || 0);
    const aTop = (a.y || 0);
    const aRight = aLeft + (a.w || 24) * SVG_SCALE;
    const aBottom = aTop + (a.d || 20) * SVG_SCALE;

    // Wall clearance
    const roomRight = ROOM_X + roomWidth * SVG_SCALE;
    const roomBottom = ROOM_Y + roomDepth * SVG_SCALE;
    if (aLeft < ROOM_X + 4) { penalty += 3; violations.push({ item: a, issue: 'Too close to left wall' }); }
    if (aTop < ROOM_Y + 4) { penalty += 3; violations.push({ item: a, issue: 'Too close to top wall' }); }
    if (aRight > roomRight - 4) { penalty += 3; violations.push({ item: a, issue: 'Too close to right wall' }); }
    if (aBottom > roomBottom - 4) { penalty += 3; violations.push({ item: a, issue: 'Too close to bottom wall' }); }

    for (let j = i+1; j < items.length; j++) {
      const b = items[j];
      const bLeft = (b.x || 0);
      const bTop = (b.y || 0);
      const bRight = bLeft + (b.w || 24) * SVG_SCALE;
      const bBottom = bTop + (b.d || 20) * SVG_SCALE;

      // Gap between items
      const gapX = Math.max(0, Math.max(aLeft, bLeft) - Math.min(aRight, bRight));
      const gapY = Math.max(0, Math.max(aTop, bTop) - Math.min(aBottom, bBottom));
      const gapInches = Math.sqrt(gapX**2 + gapY**2) / SVG_SCALE;

      if (gapInches > 0 && gapInches < 36) {
        // Is this a walkway or a functional gap?
        const bothSeating = a.type === 'Seating' && b.type === 'Seating';
        const isFunctional = (a.type === 'Seating' && b.type === 'Table') ||
                            (b.type === 'Seating' && a.type === 'Table');
        const minGap = bothSeating ? 18 : isFunctional ? 14 : 36;

        if (gapInches < minGap) {
          penalty += 5;
          violations.push({
            items: [a, b],
            issue: `${a.name||a.type} to ${b.name||b.type}: ${gapInches.toFixed(0)}in (min ${minGap}in)`,
            measured: gapInches,
            required: minGap
          });
        }
      }
    }
  }

  const score = Math.max(20, 100 - penalty);
  return { score, violations, penalty };
}

// ── Zone Completeness ────────────────────────────────────────────────────

const ROOM_ZONES = {
  living: ['conversation', 'focal', 'circulation', 'accent'],
  bedroom: ['sleep', 'storage', 'circulation', 'reading'],
  dining: ['dining', 'serving', 'circulation'],
  office: ['work', 'storage', 'meeting'],
  kitchen: ['cooking', 'prep', 'storage', 'dining'],
};

export function scoreZoneCompleteness(items, roomType = 'living') {
  const expected = ROOM_ZONES[roomType] || ROOM_ZONES.living;
  const detected = new Set();

  for (const item of items) {
    if (item.type === 'Seating') detected.add('conversation');
    if (item.type === 'Table') detected.add('dining').add('focal');
    if (item.type === 'Lighting') detected.add('accent');
    if (item.type === 'Storage') detected.add('storage');
    if (item.type === 'Bed') detected.add('sleep');
    if (item.type === 'Desk') detected.add('work');
    if (item.type === 'Art' || item.type === 'Accessory') detected.add('focal');
    if (item.type === 'Plant') detected.add('accent');
    if (item.type === 'Textile') detected.add('accent');
  }
  // Circulation is always "present" (it's the negative space)
  detected.add('circulation');

  const completeness = expected.filter(z => detected.has(z)).length / expected.length;
  return { score: Math.round(completeness * 100), zones: { expected, detected: [...detected] } };
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER SPATIAL SCORING
// DSD Compliance(30%), Zone(20%), Circulation(20%), Focal(15%), Conversation(15%)
// ═══════════════════════════════════════════════════════════════════════════

export function scoreSpatialComposition(items, options = {}) {
  const { roomWidth = 240, roomDepth = 192, roomType = 'living', measurements = {} } = options;

  if (!items || items.length === 0) return { total: 0, breakdown: {} };

  // 1. DSD Standards Compliance (30%)
  const dsd = auditRoom(roomType, measurements);
  const dsdScore = Math.round(dsd.passRate * 100);

  // 2. Zone Completeness (20%)
  const zones = scoreZoneCompleteness(items, roomType);

  // 3. Circulation Path Analysis (20%)
  const circulation = scoreCirculation(items, roomWidth, roomDepth);

  // 4. Visual Balance — Arnheim (15%)
  const balance = scoreVisualBalance(items, roomWidth, roomDepth);

  // 5. Gestalt + Proportions (15%)
  const gestalt = evaluateGestalt(items, roomWidth, roomDepth);
  const proportions = scoreProportions(items, roomWidth, roomDepth);
  const compositionalScore = Math.round((gestalt.score + proportions.score) / 2);

  const total = Math.round(
    dsdScore * 0.30 +
    zones.score * 0.20 +
    circulation.score * 0.20 +
    balance.score * 0.15 +
    compositionalScore * 0.15
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      dsdCompliance: dsdScore,
      zoneCompleteness: zones.score,
      circulation: circulation.score,
      visualBalance: balance.score,
      composition: compositionalScore
    },
    details: { dsd, zones, circulation, balance, gestalt, proportions }
  };
}

export default {
  computeVisualWeight, scoreVisualBalance, evaluateGestalt,
  scoreProportions, scoreCirculation, scoreZoneCompleteness,
  scoreSpatialComposition
};