// ═══════════════════════════════════════════════════════════════════════════
// COLOR ENGINE — V2 AI Design Analysis Engine
// Comprehensive color science: Munsell, Itten's 7 Contrasts, Chevreul,
// Albers, Birren/Kwallek psychology, 60-30-10 distribution, undertones.
// Sources: Munsell (1905), Itten (1961), Chevreul (1839), Albers (1963),
//          Birren (1950), CIE (1976), Kwallek (1996)
// ═══════════════════════════════════════════════════════════════════════════

// ── Core Color Math ──────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

export function rgbToLab([r, g, b]) {
  let rr = r/255, gg = g/255, bb = b/255;
  rr = rr > 0.04045 ? Math.pow((rr+0.055)/1.055, 2.4) : rr/12.92;
  gg = gg > 0.04045 ? Math.pow((gg+0.055)/1.055, 2.4) : gg/12.92;
  bb = bb > 0.04045 ? Math.pow((bb+0.055)/1.055, 2.4) : bb/12.92;
  let x = (rr*0.4124+gg*0.3576+bb*0.1805)/0.95047;
  let y = (rr*0.2126+gg*0.7152+bb*0.0722)/1.0;
  let z = (rr*0.0193+gg*0.1192+bb*0.9505)/1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787*t+16/116;
  return [116*f(y)-16, 500*(f(x)-f(y)), 200*(f(y)-f(z))];
}

export function labToLch([L, a, b]) {
  const C = Math.sqrt(a*a + b*b);
  let H = Math.atan2(b, a) * (180/Math.PI);
  if (H < 0) H += 360;
  return [L, C, H];
}

export function hexToLch(hex) {
  return labToLch(rgbToLab(hexToRgb(hex)));
}

export function hexToHsl(hex) {
  const [r,g,b] = hexToRgb(hex).map(v => v/255);
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === r) h = ((g-b)/d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b-r)/d + 2) / 6;
    else h = ((r-g)/d + 4) / 6;
  }
  return [h*360, s*100, l*100];
}

export function deltaE(hex1, hex2) {
  const [L1,a1,b1] = rgbToLab(hexToRgb(hex1));
  const [L2,a2,b2] = rgbToLab(hexToRgb(hex2));
  return Math.sqrt((L1-L2)**2 + (a1-a2)**2 + (b1-b2)**2);
}

// ── Munsell Approximation ────────────────────────────────────────────────
// Maps CIELAB to approximate Munsell HVC (Hue, Value, Chroma)
// Source: Munsell, A.H. (1905). A Color Notation.

export function labToMunsell([L, a, b]) {
  // Value: 0-10 scale (Munsell Value ≈ L*/10)
  const value = L / 10;
  // Chroma: perceptual saturation
  const chroma = Math.sqrt(a*a + b*b) / 5; // normalize to ~0-14 range
  // Hue: map CIELAB hue angle to Munsell 10-hue system
  let hueAngle = Math.atan2(b, a) * (180/Math.PI);
  if (hueAngle < 0) hueAngle += 360;
  // Munsell hues: R, YR, Y, GY, G, BG, B, PB, P, RP (40 steps)
  const munsellHue = ((hueAngle + 18) % 360) / 9; // approx mapping
  const hueNames = ['R','YR','Y','GY','G','BG','B','PB','P','RP'];
  const hueIndex = Math.floor(munsellHue / 4) % 10;
  const hueStep = Math.round((munsellHue % 4) * 2.5 + 2.5);
  return {
    hue: `${hueStep}${hueNames[hueIndex]}`,
    value: Math.round(value * 10) / 10,
    chroma: Math.round(chroma * 10) / 10,
    hueAngle,
    hueFamily: hueNames[hueIndex]
  };
}

export function hexToMunsell(hex) {
  return labToMunsell(rgbToLab(hexToRgb(hex)));
}

// ── 3.1 Munsell Analysis Scoring ─────────────────────────────────────────

function scoreMunsellConsistency(colors) {
  const munsells = colors.map(hexToMunsell);
  const values = munsells.map(m => m.value);
  const chromas = munsells.map(m => m.chroma);
  const hueFamilies = [...new Set(munsells.map(m => m.hueFamily))];

  // Value consistency: is the spread intentional?
  const valueRange = Math.max(...values) - Math.min(...values);
  let valueScore;
  if (valueRange <= 3) valueScore = 95; // cohesive
  else if (valueRange <= 5) valueScore = 80; // moderate, possibly dramatic
  else if (valueRange >= 5 && values.every((v,i,arr) => i === 0 || Math.abs(v - arr[i-1]) <= 2)) {
    valueScore = 85; // gradation — intentional spread
  } else valueScore = 60; // random scatter

  // Chroma balance: 60% low + 30% mid + 10% high ideal
  const lowChroma = chromas.filter(c => c < 4).length / chromas.length;
  const midChroma = chromas.filter(c => c >= 4 && c < 8).length / chromas.length;
  const highChroma = chromas.filter(c => c >= 8).length / chromas.length;
  const chromaDistScore = 100 - (
    Math.abs(lowChroma - 0.6) * 30 +
    Math.abs(midChroma - 0.3) * 25 +
    Math.abs(highChroma - 0.1) * 20
  );

  // Hue count: 3-5 families optimal
  let hueCountScore;
  if (hueFamilies.length >= 3 && hueFamilies.length <= 5) hueCountScore = 95;
  else if (hueFamilies.length <= 2) hueCountScore = 75; // monochromatic-ish
  else if (hueFamilies.length <= 7) hueCountScore = 70;
  else hueCountScore = 55; // too many

  return {
    score: Math.round((valueScore * 0.4 + chromaDistScore * 0.35 + hueCountScore * 0.25)),
    details: { valueRange, valueScore, chromaDistScore, hueCountScore, hueFamilies }
  };
}

// ── 3.2 Itten's Seven Contrasts ──────────────────────────────────────────
// Source: Itten, J. (1961). The Art of Color.

function evaluateIttenContrasts(colors) {
  if (colors.length < 2) return { activeCount: 0, contrasts: {}, score: 50 };
  const lchs = colors.map(hexToLch);
  const labs = colors.map(c => rgbToLab(hexToRgb(c)));
  const munsells = colors.map(hexToMunsell);

  const contrasts = {};

  // 1. Contrast of Hue: distinct hue families present
  const hueCount = new Set(munsells.map(m => m.hueFamily)).size;
  contrasts.hue = hueCount >= 3 ? 'strong' : hueCount === 2 ? 'moderate' : 'absent';

  // 2. Light-Dark: Value spread
  const values = lchs.map(l => l[0]);
  const valueSpread = Math.max(...values) - Math.min(...values);
  contrasts.lightDark = valueSpread > 50 ? 'strong' : valueSpread > 25 ? 'moderate' : 'absent';

  // 3. Cold-Warm: temperature distribution
  const warmCount = lchs.filter(([,,H]) => (H >= 0 && H <= 90) || H >= 330).length;
  const coolCount = lchs.filter(([,,H]) => H >= 150 && H <= 270).length;
  const tempRatio = Math.min(warmCount, coolCount) / Math.max(warmCount, coolCount, 1);
  contrasts.coldWarm = tempRatio >= 0.3 ? 'strong' : tempRatio > 0 ? 'moderate' : 'absent';

  // 4. Complementary: any pair ~180° apart in hue
  let hasComp = false;
  for (let i = 0; i < lchs.length; i++) {
    for (let j = i+1; j < lchs.length; j++) {
      const diff = Math.abs(lchs[i][2] - lchs[j][2]);
      const hDist = Math.min(diff, 360-diff);
      if (hDist >= 150 && hDist <= 210) hasComp = true;
    }
  }
  contrasts.complementary = hasComp ? 'strong' : 'absent';

  // 5. Simultaneous Contrast: always present when colors are adjacent (modeled in Chevreul section)
  contrasts.simultaneous = colors.length >= 2 ? 'present' : 'absent';

  // 6. Contrast of Saturation: chroma variety within same hue family
  const chromasByFamily = {};
  munsells.forEach(m => {
    if (!chromasByFamily[m.hueFamily]) chromasByFamily[m.hueFamily] = [];
    chromasByFamily[m.hueFamily].push(m.chroma);
  });
  let hasSatContrast = false;
  for (const fam of Object.values(chromasByFamily)) {
    if (fam.length >= 2 && (Math.max(...fam) - Math.min(...fam)) > 4) hasSatContrast = true;
  }
  contrasts.saturation = hasSatContrast ? 'strong' : 'absent';

  // 7. Contrast of Extension: area ratios (evaluated in 60-30-10 section)
  contrasts.extension = 'deferred'; // calculated with area data

  // Score: 3-4 active contrasts = optimal
  const active = Object.values(contrasts).filter(v => v === 'strong' || v === 'moderate').length;
  let score;
  if (active >= 3 && active <= 4) score = 95;
  else if (active === 2 || active === 5) score = 80;
  else if (active === 1) score = 65;
  else if (active >= 6) score = 70; // too many = chaos
  else score = 50;

  return { activeCount: active, contrasts, score };
}

// ── 3.3 Chevreul/Albers: Adjacency Modeling ──────────────────────────────
// Source: Chevreul (1839), Albers (1963)

function evaluateAdjacencyEffects(colorPairs) {
  // colorPairs: [{color1: hex, color2: hex, relationship: 'adjacent'|'on'}]
  if (!colorPairs || colorPairs.length === 0) return { score: 80, shifts: [] };

  const shifts = [];
  let totalConflict = 0;

  for (const pair of colorPairs) {
    const lab1 = rgbToLab(hexToRgb(pair.color1));
    const lab2 = rgbToLab(hexToRgb(pair.color2));
    // Chevreul shift: each color shifts toward complement of neighbor
    // Magnitude proportional to chroma of neighbor
    const chroma2 = Math.sqrt(lab2[1]**2 + lab2[2]**2);
    const shiftMagnitude = chroma2 * 0.15; // perceptual shift coefficient

    // If both colors have similar hue but different value, they enhance each other (good)
    // If they have conflicting undertones, they fight (bad)
    const hueDiff = Math.abs(Math.atan2(lab1[2], lab1[1]) - Math.atan2(lab2[2], lab2[1])) * (180/Math.PI);
    const normalizedDiff = Math.min(hueDiff, 360-hueDiff);

    let conflict = 0;
    if (normalizedDiff > 60 && normalizedDiff < 150) {
      // Awkward zone: not complementary enough to vibrate, not analogous enough to harmonize
      conflict = shiftMagnitude * 0.5;
    }
    totalConflict += conflict;
    shifts.push({ pair, shiftMagnitude, normalizedDiff, conflict });
  }

  const avgConflict = totalConflict / Math.max(colorPairs.length, 1);
  const score = Math.round(Math.max(40, 95 - avgConflict * 8));
  return { score, shifts, avgConflict };
}

// ── 3.4 Color Psychology & Room Function ─────────────────────────────────
// Sources: Birren (1950), Kwallek (1996, 2005)

const ROOM_COLOR_AFFINITY = {
  living:    { warm: 0.6, cool: 0.4, highChroma: 0.3, lowChroma: 0.5 },
  bedroom:   { warm: 0.4, cool: 0.7, highChroma: 0.1, lowChroma: 0.8 },
  dining:    { warm: 0.7, cool: 0.2, highChroma: 0.4, lowChroma: 0.4 },
  kitchen:   { warm: 0.6, cool: 0.3, highChroma: 0.3, lowChroma: 0.5 },
  office:    { warm: 0.3, cool: 0.6, highChroma: 0.1, lowChroma: 0.7 },
  bathroom:  { warm: 0.3, cool: 0.6, highChroma: 0.2, lowChroma: 0.7 },
  nursery:   { warm: 0.5, cool: 0.5, highChroma: 0.2, lowChroma: 0.7 },
  mediaRoom: { warm: 0.5, cool: 0.5, highChroma: 0.2, lowChroma: 0.6 },
  entry:     { warm: 0.5, cool: 0.4, highChroma: 0.3, lowChroma: 0.5 },
};

function scoreColorPsychology(colors, roomType) {
  if (!colors || colors.length === 0) return { score: 70, details: {} };
  const affinity = ROOM_COLOR_AFFINITY[roomType] || ROOM_COLOR_AFFINITY.living;

  const lchs = colors.map(hexToLch);
  const warmColors = lchs.filter(([,,H]) => (H >= 0 && H <= 90) || H >= 330);
  const coolColors = lchs.filter(([,,H]) => H >= 150 && H <= 270);
  const highChromaColors = lchs.filter(([,C]) => C > 40);
  const lowChromaColors = lchs.filter(([,C]) => C <= 20);

  const warmRatio = warmColors.length / lchs.length;
  const coolRatio = coolColors.length / lchs.length;
  const highChromaRatio = highChromaColors.length / lchs.length;
  const lowChromaRatio = lowChromaColors.length / lchs.length;

  // Score how well the palette matches room function
  let mismatchPenalty = 0;
  mismatchPenalty += Math.abs(warmRatio - affinity.warm) * 20;
  mismatchPenalty += Math.abs(coolRatio - affinity.cool) * 15;
  mismatchPenalty += Math.abs(highChromaRatio - affinity.highChroma) * 25;
  mismatchPenalty += Math.abs(lowChromaRatio - affinity.lowChroma) * 15;

  const score = Math.round(Math.max(40, 95 - mismatchPenalty));
  return { score, details: { warmRatio, coolRatio, highChromaRatio, lowChromaRatio, affinity } };
}

// ── 3.6 The 60-30-10 Rule ────────────────────────────────────────────────

function score603010(colorAreas) {
  // colorAreas: [{hex, areaPercent}] — area-weighted color distribution
  if (!colorAreas || colorAreas.length === 0) return { score: 70, distribution: {} };

  // Sort by area descending
  const sorted = [...colorAreas].sort((a,b) => b.areaPercent - a.areaPercent);
  const dominant = sorted[0]?.areaPercent || 0;
  const secondary = sorted[1]?.areaPercent || 0;
  const accent = sorted.slice(2).reduce((s,c) => s + c.areaPercent, 0);

  let score;
  // Excellent: 55-65% dominant, 25-35% secondary, 5-15% accent
  if (dominant >= 55 && dominant <= 65 && secondary >= 25 && secondary <= 35 && accent >= 5 && accent <= 15) {
    score = 95;
  }
  // Good: 45-70% dominant, 20-40% secondary, 5-20% accent
  else if (dominant >= 45 && dominant <= 70 && secondary >= 20 && secondary <= 40 && accent <= 20) {
    score = 82;
  }
  // Needs work: no clear dominant or accent too high
  else if (dominant < 45 || accent > 25) {
    score = 60;
  }
  // Poor: even split or monotone
  else if (dominant > 85 || (dominant < 40 && secondary > 35)) {
    score = 45;
  }
  else {
    score = 70;
  }

  return { score, distribution: { dominant, secondary, accent } };
}

// ── 3.7 Undertone Coherence ──────────────────────────────────────────────

function scoreUndertoneCoherence(colors) {
  if (!colors || colors.length < 2) return { score: 80, undertones: [] };

  const undertones = colors.map(hex => {
    const [L, a, b] = rgbToLab(hexToRgb(hex));
    const chroma = Math.sqrt(a*a + b*b);
    // Only analyze undertone for near-neutrals and low-chroma colors
    if (chroma > 25) return 'chromatic'; // not a neutral, skip undertone analysis
    if (b > 3) return 'warm'; // yellow/cream undertone
    if (b < -3) return 'cool'; // blue/violet undertone
    if (a > 3) return 'pink'; // pink/red undertone
    if (a < -3) return 'green'; // green undertone
    return 'true_neutral';
  });

  const neutralUndertones = undertones.filter(u => u !== 'chromatic');
  if (neutralUndertones.length < 2) return { score: 85, undertones };

  const warmCount = neutralUndertones.filter(u => u === 'warm' || u === 'pink').length;
  const coolCount = neutralUndertones.filter(u => u === 'cool' || u === 'green').length;
  const total = neutralUndertones.length;

  let score;
  // All same family = cohesive
  if (warmCount === total || coolCount === total) score = 95;
  // Mostly same with one outlier = okay
  else if (warmCount / total >= 0.75 || coolCount / total >= 0.75) score = 80;
  // Mixed = conflict
  else if (Math.abs(warmCount - coolCount) <= 1) score = 55; // fighting
  else score = 65;

  return { score, undertones, warmCount, coolCount };
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER COLOR SCORING FUNCTION
// Combines all sub-systems: Munsell(20%), Itten(15%), Chevreul(15%),
// Psychology(15%), 60-30-10(20%), Undertone(15%)
// ═══════════════════════════════════════════════════════════════════════════

export function scoreColorHarmony(palette, options = {}) {
  if (!palette || palette.length < 2) return { total: 0, breakdown: {} };

  const {
    roomType = 'living',
    adjacentPairs = [],
    colorAreas = null,
    allItemColors = []
  } = options;

  // Combine palette + item colors for full room analysis
  const allColors = [...palette, ...allItemColors].filter(Boolean);

  // 1. Munsell Analysis (20%)
  const munsell = scoreMunsellConsistency(allColors);

  // 2. Itten's Seven Contrasts (15%)
  const itten = evaluateIttenContrasts(allColors);

  // 3. Chevreul/Albers Adjacency (15%)
  const chevreul = evaluateAdjacencyEffects(adjacentPairs);

  // 4. Color Psychology (15%)
  const psychology = scoreColorPsychology(palette, roomType);

  // 5. 60-30-10 Distribution (20%)
  const distribution = colorAreas
    ? score603010(colorAreas)
    : score603010EstimateFromPalette(palette);

  // 6. Undertone Coherence (15%)
  const undertone = scoreUndertoneCoherence(allColors);

  // Weighted total
  const total = Math.round(
    munsell.score * 0.20 +
    itten.score * 0.15 +
    chevreul.score * 0.15 +
    psychology.score * 0.15 +
    distribution.score * 0.20 +
    undertone.score * 0.15
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      munsell: munsell.score,
      itten: itten.score,
      chevreul: chevreul.score,
      psychology: psychology.score,
      distribution: distribution.score,
      undertone: undertone.score
    },
    details: { munsell, itten, chevreul, psychology, distribution, undertone }
  };
}

// Estimate 60-30-10 from palette alone (when area data isn't available)
function score603010EstimateFromPalette(palette) {
  if (!palette || palette.length < 2) return { score: 70, distribution: {} };
  // Assume first color = dominant (~60%), second = secondary (~30%), rest = accent (~10%)
  const count = palette.length;
  if (count === 2) return { score: 75, distribution: { dominant: 60, secondary: 40, accent: 0 } };
  if (count === 3) return { score: 85, distribution: { dominant: 55, secondary: 30, accent: 15 } };
  if (count >= 4 && count <= 5) return { score: 80, distribution: { dominant: 50, secondary: 30, accent: 20 } };
  return { score: 65, distribution: { dominant: 40, secondary: 30, accent: 30 } };
}

// ── Legacy API compatibility ─────────────────────────────────────────────
// Drop-in replacement for V1's scoreColorHarmony(palette) → number
export function scoreColorHarmonySimple(palette) {
  const result = scoreColorHarmony(palette);
  return result.total;
}

export default {
  hexToRgb, rgbToLab, labToLch, hexToLch, hexToHsl, deltaE,
  hexToMunsell, labToMunsell,
  scoreColorHarmony, scoreColorHarmonySimple,
  evaluateIttenContrasts, evaluateAdjacencyEffects,
  scoreColorPsychology, score603010, scoreUndertoneCoherence
};