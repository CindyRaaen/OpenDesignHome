// ═══════════════════════════════════════════════════════════════════════════
// STYLE ENGINE — V2 AI Design Analysis Engine
// 18-style taxonomy, 7-tier item model, Weighted Visual Density,
// style affinity vectors, coherence scoring.
// ═══════════════════════════════════════════════════════════════════════════

// ── 18-Style Taxonomy ────────────────────────────────────────────────────
// Each style has: key materials, color profile, proportion tendency, era range

export const STYLE_TAXONOMY = {
  minimalist:     { id: 'minimalist',     era: [1960, 2026], materials: ['steel','glass','concrete','lacquer'], colorProfile: 'neutral_low_chroma', proportion: 'clean_geometric', allies: ['modern','scandinavian','japanese'], clashes: ['maximalist','baroque','rococo'] },
  modern:         { id: 'modern',         era: [1920, 2026], materials: ['steel','glass','leather','plywood'], colorProfile: 'neutral_with_accent', proportion: 'geometric', allies: ['minimalist','contemporary','midCentury'], clashes: ['baroque','rococo','victorian'] },
  midCentury:     { id: 'midCentury',     era: [1945, 1969], materials: ['teak','walnut','brass','vinyl'], colorProfile: 'warm_earth_accent', proportion: 'organic_geometric', allies: ['modern','scandinavian','contemporary'], clashes: ['baroque','victorian'] },
  scandinavian:   { id: 'scandinavian',   era: [1950, 2026], materials: ['birch','pine','wool','linen'], colorProfile: 'light_neutral_warm', proportion: 'simple_organic', allies: ['minimalist','modern','japanese'], clashes: ['maximalist','baroque'] },
  contemporary:   { id: 'contemporary',   era: [2000, 2026], materials: ['mixed','metal','glass','engineered'], colorProfile: 'neutral_bold_accent', proportion: 'varied', allies: ['modern','minimalist','industrial'], clashes: [] },
  traditional:    { id: 'traditional',    era: [1700, 1900], materials: ['mahogany','cherry','silk','damask'], colorProfile: 'deep_warm', proportion: 'classical_symmetry', allies: ['transitional','neoclassical','colonial'], clashes: ['industrial','brutalist'] },
  transitional:   { id: 'transitional',   era: [1990, 2026], materials: ['wood','upholstered','metal','glass'], colorProfile: 'warm_neutral', proportion: 'balanced', allies: ['traditional','contemporary','modern'], clashes: ['brutalist'] },
  industrial:     { id: 'industrial',     era: [1990, 2026], materials: ['steel','iron','reclaimed_wood','concrete','leather'], colorProfile: 'dark_neutral_raw', proportion: 'utilitarian', allies: ['modern','rustic','urban'], clashes: ['traditional','baroque','rococo'] },
  rustic:         { id: 'rustic',         era: [1800, 2026], materials: ['reclaimed_wood','stone','iron','burlap','leather'], colorProfile: 'earth_warm', proportion: 'irregular_organic', allies: ['farmhouse','industrial','bohemian'], clashes: ['minimalist','modern'] },
  farmhouse:      { id: 'farmhouse',      era: [1850, 2026], materials: ['painted_wood','shiplap','cotton','galvanized'], colorProfile: 'white_warm_accent', proportion: 'comfortable', allies: ['rustic','coastal','cottage'], clashes: ['industrial','brutalist'] },
  bohemian:       { id: 'bohemian',       era: [1960, 2026], materials: ['rattan','macrame','kilim','brass','ceramics'], colorProfile: 'warm_rich_layered', proportion: 'eclectic_organic', allies: ['eclectic','global','rustic'], clashes: ['minimalist'] },
  coastal:        { id: 'coastal',        era: [1950, 2026], materials: ['whitewash_wood','rope','linen','rattan'], colorProfile: 'blue_white_sandy', proportion: 'relaxed', allies: ['farmhouse','scandinavian','cottage'], clashes: ['industrial','baroque'] },
  artDeco:        { id: 'artDeco',        era: [1920, 1940], materials: ['lacquer','brass','velvet','marble','mirror'], colorProfile: 'jewel_metallic', proportion: 'geometric_glamour', allies: ['hollywood','modern'], clashes: ['rustic','farmhouse'] },
  japanese:       { id: 'japanese',       era: [1400, 2026], materials: ['bamboo','paper','cedar','tatami','stone'], colorProfile: 'earth_minimal', proportion: 'asymmetric_balance', allies: ['minimalist','scandinavian','wabiSabi'], clashes: ['maximalist','baroque'] },
  maximalist:     { id: 'maximalist',     era: [1980, 2026], materials: ['velvet','lacquer','mixed_patterns','gilt'], colorProfile: 'bold_saturated_mix', proportion: 'layered_dense', allies: ['eclectic','bohemian','artDeco'], clashes: ['minimalist','scandinavian'] },
  eclectic:       { id: 'eclectic',       era: [1970, 2026], materials: ['mixed_all'], colorProfile: 'varied_controlled', proportion: 'intentional_mix', allies: ['bohemian','maximalist','global'], clashes: [] },
  mediterranean:  { id: 'mediterranean',  era: [1500, 2026], materials: ['terracotta','wrought_iron','ceramic','stucco'], colorProfile: 'warm_earth_blue', proportion: 'arched_ornate', allies: ['rustic','traditional','coastal'], clashes: ['industrial','modern'] },
  hollywood:      { id: 'hollywood',      era: [1930, 2026], materials: ['velvet','mirror','chrome','lucite','fur'], colorProfile: 'black_white_metallic', proportion: 'glamorous_geometric', allies: ['artDeco','contemporary','maximalist'], clashes: ['rustic','farmhouse'] },
};

// ── 7-Tier Item Taxonomy ─────────────────────────────────────────────────
export const ITEM_TIERS = {
  T1: { name: 'Anchor Furniture', types: ['sofa','sectional','bed','diningTable','armoire','grandPiano'], visualWeightRange: [8, 10], expectedCount: [1, 3] },
  T2: { name: 'Major Furniture', types: ['accentChair','console','dresser','desk','bookshelf','credenza','buffet'], visualWeightRange: [5, 7], expectedCount: [3, 8] },
  T3: { name: 'Lighting & Fixtures', types: ['floorLamp','chandelier','pendant','sconce','tableLamp','ceilingFan'], visualWeightRange: [4, 6], expectedCount: [3, 8] },
  T4: { name: 'Textiles & Soft Goods', types: ['rug','pillow','curtain','blanket','ottoman','pouf','throw'], visualWeightRange: [3, 5], expectedCount: [5, 15] },
  T5: { name: 'Wall Art & Decor', types: ['painting','print','mirror','wallSculpture','tapestry','clock'], visualWeightRange: [3, 5], expectedCount: [3, 12] },
  T6: { name: 'Decorative Objects', types: ['vase','candle','book','tray','bowl','frame','sculpture','box'], visualWeightRange: [1, 3], expectedCount: [8, 25] },
  T7: { name: 'Botanical & Natural', types: ['plant','driedFloral','branch','terrarium','succulent','wreath'], visualWeightRange: [1, 3], expectedCount: [2, 8] },
};

export function assignTier(item) {
  const itemType = (item.type || item.category || '').toLowerCase();
  for (const [tier, def] of Object.entries(ITEM_TIERS)) {
    if (def.types.some(t => itemType.includes(t) || t.includes(itemType))) { return tier; }
  }
  const area = (item.w || 24) * (item.d || 20);
  if (area > 4000) return 'T1';
  if (area > 2000) return 'T2';
  if (area > 500) return 'T3';
  return 'T6';
}

const WVD_TARGETS = {
  minimalist: { min: 0.15, max: 0.30, ideal: 0.22 }, modern: { min: 0.20, max: 0.40, ideal: 0.30 },
  scandinavian: { min: 0.18, max: 0.35, ideal: 0.26 }, midCentury: { min: 0.22, max: 0.40, ideal: 0.30 },
  traditional: { min: 0.30, max: 0.50, ideal: 0.40 }, maximalist: { min: 0.45, max: 0.70, ideal: 0.55 },
  bohemian: { min: 0.35, max: 0.60, ideal: 0.45 }, eclectic: { min: 0.30, max: 0.55, ideal: 0.40 },
  farmhouse: { min: 0.25, max: 0.45, ideal: 0.35 }, coastal: { min: 0.20, max: 0.38, ideal: 0.28 },
  industrial: { min: 0.20, max: 0.40, ideal: 0.28 }, japanese: { min: 0.12, max: 0.28, ideal: 0.20 },
  _default: { min: 0.25, max: 0.45, ideal: 0.35 },
};

export function computeWVD(items, roomWidth = 240, roomDepth = 192, ceilingHeight = 96) {
  const roomVolume = roomWidth * roomDepth * ceilingHeight;
  let totalWeight = 0;
  for (const item of items) {
    const tier = assignTier(item);
    const tierDef = ITEM_TIERS[tier];
    const baseWeight = (tierDef.visualWeightRange[0] + tierDef.visualWeightRange[1]) / 2;
    const scaleFactor = ((item.w || 24) * (item.d || 20)) / 1000;
    totalWeight += baseWeight * scaleFactor;
  }
  return totalWeight / (roomVolume / 10000);
}

export function computeStyleVector(items) {
  const vector = {};
  let totalWeight = 0;
  for (const item of items) {
    const tier = assignTier(item);
    const tierDef = ITEM_TIERS[tier];
    const weight = (tierDef.visualWeightRange[0] + tierDef.visualWeightRange[1]) / 2;
    const itemStyle = (item.style || 'contemporary').toLowerCase();
    const matchedStyle = Object.keys(STYLE_TAXONOMY).find(s => s.toLowerCase() === itemStyle || itemStyle.includes(s.toLowerCase())) || 'contemporary';
    vector[matchedStyle] = (vector[matchedStyle] || 0) + weight;
    totalWeight += weight;
  }
  if (totalWeight > 0) { for (const s of Object.keys(vector)) { vector[s] = vector[s] / totalWeight; } }
  return vector;
}

export function scoreStyleCoherence(items, palette, materials) {
  if (!items || items.length === 0) return { total: 0, breakdown: {} };
  const vector = computeStyleVector(items);
  const sortedStyles = Object.entries(vector).sort((a,b) => b[1] - a[1]);
  const dominantStyle = sortedStyles[0]?.[0];
  const dominantShare = sortedStyles[0]?.[1] || 0;
  const secondaryStyle = sortedStyles[1]?.[0];
  let concentrationScore;
  if (dominantShare >= 0.8) concentrationScore = 95;
  else if (dominantShare >= 0.6) {
    const taxonomy = STYLE_TAXONOMY[dominantStyle];
    const isAlly = taxonomy && taxonomy.allies.includes(secondaryStyle);
    concentrationScore = isAlly ? 88 : 70;
  } else if (dominantShare >= 0.4) concentrationScore = 60;
  else concentrationScore = 45;
  let clashPenalty = 0;
  const presentStyles = sortedStyles.filter(([,v]) => v > 0.1).map(([s]) => s);
  for (const style of presentStyles) {
    const taxonomy = STYLE_TAXONOMY[style];
    if (!taxonomy) continue;
    for (const other of presentStyles) { if (taxonomy.clashes.includes(other)) clashPenalty += 10; }
  }
  const clashScore = Math.max(30, 100 - clashPenalty);
  const wvd = computeWVD(items);
  const targets = WVD_TARGETS[dominantStyle] || WVD_TARGETS._default;
  let wvdScore;
  if (wvd >= targets.min && wvd <= targets.max) wvdScore = 90 + (1 - Math.abs(wvd - targets.ideal) / (targets.max - targets.min)) * 10;
  else if (wvd < targets.min) wvdScore = Math.max(40, 90 - (targets.min - wvd) * 200);
  else wvdScore = Math.max(40, 90 - (wvd - targets.max) * 200);
  let materialScore = 70;
  if (materials && materials.length > 0 && dominantStyle) {
    const taxonomy = STYLE_TAXONOMY[dominantStyle];
    if (taxonomy) {
      const matchCount = materials.filter(m => taxonomy.materials.some(tm => m.toLowerCase().includes(tm) || tm.includes(m.toLowerCase()))).length;
      materialScore = Math.min(100, 60 + (matchCount / Math.max(materials.length, 1)) * 40);
    }
  }
  const total = Math.round(concentrationScore * 0.40 + clashScore * 0.20 + wvdScore * 0.20 + materialScore * 0.20);
  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: { concentration: Math.round(concentrationScore), clashFree: Math.round(clashScore), wvdMatch: Math.round(wvdScore), materialFit: Math.round(materialScore) },
    details: { styleVector: vector, dominantStyle, dominantShare, wvd, wvdTargets: targets, presentStyles, clashPenalty }
  };
}

export default { STYLE_TAXONOMY, ITEM_TIERS, WVD_TARGETS, assignTier, computeWVD, computeStyleVector, scoreStyleCoherence };
