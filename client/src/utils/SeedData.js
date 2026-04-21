// ═══════════════════════════════════════════════════════════
// OPENDESIGN STUDIO — Seed Data for Resumable Designs
// 7 in-progress designs, one frozen at each ChallengeFlow phase.
// Each entry contains the full state snapshot needed to resume.
// ═══════════════════════════════════════════════════════════

// ── Phase map ──
// 0 = Brief (concept + mode selected)
// 1 = Palette (colors + materials picked)
// 2 = Room Plan (furniture on the floor plan)
// 3 = Elevations (reviewing wall views)
// 4 = Furniture (detailing specs)
// 5 = 3D Preview (final walkthrough)
// 6 = Submit (judging — we stop at 5 so user can hit submit)

const PHASE_LABELS = ['Brief', 'Palette', 'Room Plan', 'Elevations', 'Furniture', '3D Preview', 'Submit']

// ── Helpers ──
const inchToSVG = (inchX, inchY) => ({ x: 60 + inchX * 2.25, y: 60 + inchY * 2.25 })
let instanceCounter = 1000

function makePlacedItem(furnitureId, name, type, inchX, inchY, w, d, rotation = 0, style = 'modern', colors = []) {
  const pos = inchToSVG(inchX, inchY)
  return {
    instanceId: `seed_${instanceCounter++}`,
    id: furnitureId,
    name, type, style, colors,
    x: pos.x, y: pos.y,
    w, d, rotation,
  }
}

// ═══════════════════════════════════════════════════════════
// SEED DESIGNS
// ═══════════════════════════════════════════════════════════

export const SEED_DESIGNS = [

  // ─── 1. Phase 0 — Just picked the brief ───
  {
    id: 'seed_brief',
    title: "Lina's Downtown Loft",
    client: 'Lina Park',
    room: 'Living Room',
    story: "A graphic designer in a converted warehouse loft — exposed brick, 14-foot ceilings, huge factory windows. She wants it bold but livable.",
    phase: 0,
    phaseLabel: PHASE_LABELS[0],
    savedAt: Date.now() - 86400000 * 3, // 3 days ago
    thumbnail: '🏙️',
    tier: 'casual',
    state: {
      selectedConcept: null,
      designMode: null,
      palette: [],
      selectedMaterials: [],
      placedItems: [],
      timeOfDay: 'day',
      designNotes: '',
      competitionSeconds: 45 * 60,
      selectedLayout: null,
    },
    brief: {
      id: 201, title: "Lina's Downtown Loft", client: 'Lina Park',
      story: "A graphic designer in a converted warehouse loft — exposed brick, 14-foot ceilings, huge factory windows. She wants it bold but livable.",
      room: 'Living Room', sqft: 480, difficulty: 'member',
      constraints: ['Keep exposed brick', 'Budget: High', 'Open floor plan'],
      concepts: [
        { name: 'Industrial Chic', colors: ['#1a1a1a','#C8AA78','#8B4513','#E8E4DE','#4A3728'] },
        { name: 'Warm Loft', colors: ['#E8D5B7','#C1440E','#2C3E50','#5B3A1E','#F5F0E8'] },
        { name: 'Gallery White', colors: ['#FEFEFE','#1a1a1a','#C8AA78','#E8E4DE','#4A4A48'] },
      ],
    },
  },

  // ─── 2. Phase 1 — Concept chosen, picking palette ───
  {
    id: 'seed_palette',
    title: "The Napa Retreat",
    client: 'James & Sofia Reyes',
    room: 'Master Bedroom',
    story: "Wine country couple renovating a farmhouse. They want the bedroom to feel like slipping into a warm bath — soft, quiet, grounding.",
    phase: 1,
    phaseLabel: PHASE_LABELS[1],
    savedAt: Date.now() - 86400000 * 2,
    thumbnail: '🍷',
    tier: 'mid',
    state: {
      selectedConcept: { name: 'Quiet Luxury', colors: ['#F5F0E8','#C8AA78','#2C3E50','#4A3728','#E8E4DE'] },
      designMode: 'full',
      palette: ['#F5F0E8','#C8AA78','#2C3E50'],
      selectedMaterials: [
        { id: 'm1', name: 'White Oak', type: 'wood', color: '#C8AA78', pattern: 'grain', tier: 'member' },
      ],
      placedItems: [],
      timeOfDay: 'day',
      designNotes: '',
      competitionSeconds: 42 * 60,
      selectedLayout: null,
    },
    brief: {
      id: 202, title: "The Napa Retreat", client: 'James & Sofia Reyes',
      story: "Wine country couple renovating a farmhouse. They want the bedroom to feel like slipping into a warm bath — soft, quiet, grounding.",
      room: 'Master Bedroom', sqft: 280, difficulty: 'member',
      constraints: ['King bed required', 'Budget: Premium', 'Ensuite access on south wall'],
      concepts: [
        { name: 'Quiet Luxury', colors: ['#F5F0E8','#C8AA78','#2C3E50','#4A3728','#E8E4DE'] },
        { name: 'Wine Country', colors: ['#5B3A1E','#C1440E','#E8D5B7','#8B6914','#F4ECD8'] },
        { name: 'French Farmhouse', colors: ['#E8E4DE','#87CEEB','#5B7553','#D4C5A9','#FEFEFE'] },
      ],
    },
  },

  // ─── 3. Phase 2 — Palette done, placing furniture on floor plan ───
  {
    id: 'seed_roomplan',
    title: "Maya's Portland Bungalow",
    client: 'Maya Chen',
    room: 'Living Room',
    story: "A ceramicist who just bought a 1920s bungalow. Warmth without clutter — a space that feels like a deep breath.",
    phase: 2,
    phaseLabel: PHASE_LABELS[2],
    savedAt: Date.now() - 86400000 * 1,
    thumbnail: '🏡',
    tier: 'casual',
    state: {
      selectedConcept: { name: 'Warm Minimal', colors: ['#E8D5B7','#8B4513','#2C3E50','#D4A574','#F5F0E8'] },
      designMode: 'full',
      palette: ['#E8D5B7','#8B4513','#2C3E50','#D4A574','#F5F0E8'],
      selectedMaterials: [
        { id: 'm1', name: 'White Oak', type: 'wood', color: '#C8AA78', pattern: 'grain', tier: 'member' },
        { id: 'm4', name: 'Carrara Marble', type: 'stone', color: '#E8E4DE', pattern: 'vein', tier: 'member' },
        { id: 'm10', name: 'Belgian Linen', type: 'textile', color: '#E8D5B7', pattern: 'weave', tier: 'member' },
      ],
      placedItems: [
        makePlacedItem('f1', 'Haven Sofa', 'Seating', 78, 130, 84, 36, 0, 'modern', ['#E8D5B7','#2C3E50','#8B4513','#E8E4DE']),
        makePlacedItem('f2', 'Arc Coffee Table', 'Table', 96, 80, 48, 24, 0, 'modern', ['#C8AA78','#5B3A1E','#E8E4DE']),
      ],
      timeOfDay: 'day',
      designNotes: '',
      competitionSeconds: 38 * 60,
      selectedLayout: null,
    },
    brief: {
      id: 101, title: "Maya's Portland Bungalow", client: 'Maya Chen',
      story: "A ceramicist who just bought a 1920s bungalow with original hardwoods and tons of natural light. She wants warmth without clutter — a space that feels like a deep breath.",
      room: 'Living Room', sqft: 320, difficulty: 'member',
      constraints: ['Keep fireplace', 'Budget: Mid', 'No TV wall'],
      concepts: [
        { name: 'Warm Minimal', colors: ['#E8D5B7','#8B4513','#2C3E50','#D4A574','#F5F0E8'] },
        { name: 'Nordic Craft', colors: ['#E8E4DE','#5B7553','#2B2B2B','#C1A882','#FEFEFE'] },
        { name: 'Desert Modern', colors: ['#C1440E','#E8C07D','#2F4F4F','#F4ECD8','#8B6F47'] },
      ],
    },
  },

  // ─── 4. Phase 3 — Room planned, reviewing elevations ───
  {
    id: 'seed_elevations',
    title: "Chef's Kitchen Makeover",
    client: 'Tomás Herrera',
    room: 'Kitchen',
    story: "A chef converting his 70s galley kitchen into an open entertainer's kitchen. He needs flow for cooking and hosting.",
    phase: 3,
    phaseLabel: PHASE_LABELS[3],
    savedAt: Date.now() - 3600000 * 18, // 18 hours ago
    thumbnail: '👨‍🍳',
    tier: 'high',
    state: {
      selectedConcept: { name: 'Earthy Modern', colors: ['#C1440E','#E8C07D','#1a1a1a','#5B3A1E','#F4ECD8'] },
      designMode: 'layout',
      palette: ['#C1440E','#E8C07D','#1a1a1a','#5B3A1E','#F4ECD8'],
      selectedMaterials: [
        { id: 'm2', name: 'Walnut', type: 'wood', color: '#5B3A1E', pattern: 'grain', tier: 'member' },
        { id: 'm5', name: 'Soapstone', type: 'stone', color: '#4A4A48', pattern: 'matte', tier: 'member' },
        { id: 'm8', name: 'Matte Black', type: 'metal', color: '#1a1a1a', pattern: 'matte', tier: 'member' },
      ],
      placedItems: [
        makePlacedItem('f15', 'Live-Edge Dining Table', 'Table', 60, 70, 84, 40, 0, 'artisan', ['#C8AA78','#5B3A1E','#8B6914']),
        makePlacedItem('f3', 'Sculptor Lounge Chair', 'Seating', 160, 110, 32, 34, -15, 'mid-century', ['#C1440E','#2C3E50','#E8D5B7','#5B7553']),
        makePlacedItem('f10', 'Brass Floor Lamp', 'Lighting', 24, 140, 16, 16, 0, 'mid-century', ['#C8AA78','#1a1a1a']),
        makePlacedItem('f8', 'Fiddle Leaf Fig', 'Plant', 200, 10, 24, 24, 0, 'any', ['#5B7553']),
        makePlacedItem('f4', 'Horizon Bookshelf', 'Storage', 170, 50, 60, 14, 0, 'modern', ['#5B3A1E','#C8AA78','#1a1a1a']),
      ],
      timeOfDay: 'day',
      designNotes: 'Chef needs counter seating for 3. Want to add a pot rack above the island.',
      competitionSeconds: 30 * 60,
      selectedLayout: 1,
    },
    brief: {
      id: 203, title: "Chef's Kitchen Makeover", client: 'Tomás Herrera',
      story: "A chef converting his 70s galley kitchen into an open entertainer's kitchen. He needs flow for cooking and hosting.",
      room: 'Kitchen', sqft: 200, difficulty: 'member',
      constraints: ['Island required', 'Budget: High', 'Gas range stays'],
      concepts: [
        { name: 'Earthy Modern', colors: ['#C1440E','#E8C07D','#1a1a1a','#5B3A1E','#F4ECD8'] },
        { name: 'Clean Industrial', colors: ['#4A4A48','#E8E4DE','#C8AA78','#1a1a1a','#FEFEFE'] },
        { name: 'Mediterranean', colors: ['#87CEEB','#C1440E','#E8D5B7','#5B7553','#F5F0E8'] },
      ],
    },
  },

  // ─── 5. Phase 4 — Elevations reviewed, specifying furniture details ───
  {
    id: 'seed_furniture',
    title: "Skyline Studio Apartment",
    client: 'Priya Kapoor',
    room: 'Studio',
    story: "A data scientist in a 35th-floor studio — floor-to-ceiling glass, city views, 400 sqft to make feel like home and office.",
    phase: 4,
    phaseLabel: PHASE_LABELS[4],
    savedAt: Date.now() - 3600000 * 6, // 6 hours ago
    thumbnail: '🌃',
    tier: 'premium',
    state: {
      selectedConcept: { name: 'Nordic Craft', colors: ['#E8E4DE','#5B7553','#2B2B2B','#C1A882','#FEFEFE'] },
      designMode: 'full',
      palette: ['#E8E4DE','#5B7553','#2B2B2B','#C1A882','#FEFEFE','#D4C5A9'],
      selectedMaterials: [
        { id: 'm3', name: 'Maple', type: 'wood', color: '#E8C07D', pattern: 'grain', tier: 'member' },
        { id: 'm12', name: 'Boucle', type: 'textile', color: '#F5F0E8', pattern: 'nub', tier: 'member' },
        { id: 'm15', name: 'Zellige', type: 'ceramic', color: '#87CEEB', pattern: 'glaze', tier: 'member' },
        { id: 'm8', name: 'Matte Black', type: 'metal', color: '#1a1a1a', pattern: 'matte', tier: 'member' },
      ],
      placedItems: [
        makePlacedItem('f1', 'Haven Sofa', 'Seating', 78, 130, 84, 36, 0, 'modern', ['#E8D5B7','#2C3E50','#8B4513','#E8E4DE']),
        makePlacedItem('f2', 'Arc Coffee Table', 'Table', 96, 80, 48, 24, 0, 'modern', ['#C8AA78','#5B3A1E','#E8E4DE']),
        makePlacedItem('f3', 'Sculptor Lounge Chair', 'Seating', 160, 110, 32, 34, -20, 'mid-century', ['#C1440E','#2C3E50','#E8D5B7','#5B7553']),
        makePlacedItem('f11', 'Side Table', 'Table', 170, 130, 18, 18, 0, 'modern', ['#5B3A1E','#C8AA78','#E8E4DE','#4A4A48']),
        makePlacedItem('f5', 'Ceramic Table Lamp', 'Lighting', 172, 132, 12, 12, 0, 'artisan', ['#E8D5B7','#C1440E','#5B7553']),
        makePlacedItem('f8', 'Fiddle Leaf Fig', 'Plant', 10, 10, 24, 24, 0, 'any', ['#5B7553']),
        makePlacedItem('f6', 'Woven Area Rug 8x10', 'Textile', 60, 50, 96, 120, 0, 'artisan', ['#E8D5B7','#D4C5A9','#8B4513']),
      ],
      timeOfDay: 'sunset',
      designNotes: 'Desk area near window for WFH. Keep path clear from door to bathroom.',
      competitionSeconds: 22 * 60,
      selectedLayout: null,
    },
    brief: {
      id: 204, title: "Skyline Studio Apartment", client: 'Priya Kapoor',
      story: "A data scientist in a 35th-floor studio — floor-to-ceiling glass, city views, 400 sqft to make feel like home and office.",
      room: 'Studio', sqft: 400, difficulty: 'member',
      constraints: ['WFH desk required', 'Budget: Premium', 'No room dividers'],
      concepts: [
        { name: 'Nordic Craft', colors: ['#E8E4DE','#5B7553','#2B2B2B','#C1A882','#FEFEFE'] },
        { name: 'Japandi', colors: ['#F5F0E8','#5B3A1E','#5B7553','#E8E4DE','#1a1a1a'] },
        { name: 'Urban Minimal', colors: ['#1a1a1a','#E8E4DE','#C8AA78','#4A4A48','#FEFEFE'] },
      ],
    },
  },

  // ─── 6. Phase 5 — Furniture done, reviewing 3D preview (one click from submit) ───
  {
    id: 'seed_preview',
    title: "The Austin Reading Room",
    client: 'Ellis & Dean Monroe',
    room: 'Den / Library',
    story: "A couple who read 100+ books a year converting their spare bedroom into a library-meets-cocktail-lounge. Moody, warm, lots of shelving.",
    phase: 5,
    phaseLabel: PHASE_LABELS[5],
    savedAt: Date.now() - 3600000 * 2, // 2 hours ago
    thumbnail: '📚',
    tier: 'elite',
    state: {
      selectedConcept: { name: 'Moody Library', colors: ['#2C3E50','#8B4513','#C8AA78','#1a1a1a','#E8D5B7'] },
      designMode: 'full',
      palette: ['#2C3E50','#8B4513','#C8AA78','#1a1a1a','#E8D5B7','#4A3728','#5B3A1E'],
      selectedMaterials: [
        { id: 'm2', name: 'Walnut', type: 'wood', color: '#5B3A1E', pattern: 'grain', tier: 'member' },
        { id: 'm11', name: 'Velvet', type: 'textile', color: '#2C3E50', pattern: 'plush', tier: 'member' },
        { id: 'm7', name: 'Brushed Brass', type: 'metal', color: '#C8AA78', pattern: 'brushed', tier: 'member' },
        { id: 'm13', name: 'Leather Saddle', type: 'textile', color: '#8B4513', pattern: 'smooth', tier: 'member' },
      ],
      placedItems: [
        makePlacedItem('f14', 'Eames Lounge', 'Seating', 30, 80, 33, 33, 15, 'mid-century', ['#5B3A1E','#1a1a1a','#8B4513']),
        makePlacedItem('f11', 'Side Table', 'Table', 10, 80, 18, 18, 0, 'modern', ['#5B3A1E','#C8AA78','#E8E4DE','#4A4A48']),
        makePlacedItem('f4', 'Horizon Bookshelf', 'Storage', 100, 8, 60, 14, 0, 'modern', ['#5B3A1E','#C8AA78','#1a1a1a']),
        makePlacedItem('f16', 'Credenza', 'Storage', 78, 155, 72, 18, 0, 'mid-century', ['#5B3A1E','#C8AA78','#65350F']),
        makePlacedItem('f10', 'Brass Floor Lamp', 'Lighting', 5, 60, 16, 16, 0, 'mid-century', ['#C8AA78','#1a1a1a']),
        makePlacedItem('f17', 'Articulated Sconce', 'Lighting', 65, 70, 8, 10, 0, 'modern', ['#C8AA78','#D4A844','#1a1a1a']),
        makePlacedItem('f6', 'Woven Area Rug 8x10', 'Textile', 20, 50, 96, 120, 0, 'artisan', ['#E8D5B7','#D4C5A9','#8B4513']),
        makePlacedItem('f19', 'Sculptural Vase', 'Accessory', 80, 157, 10, 10, 0, 'artisan', ['#E8E4DE','#C1440E','#F0EBE0']),
        makePlacedItem('f9', 'Abstract Canvas 36x48', 'Art', 170, 40, 36, 2, 0, 'modern', ['#2C3E50','#C1440E','#E8C07D','#E8E4DE']),
      ],
      timeOfDay: 'night',
      designNotes: 'Leather chair is the centerpiece. Brass accents tie the room together. Add a bar cart if budget allows.',
      competitionSeconds: 12 * 60,
      selectedLayout: null,
    },
    brief: {
      id: 205, title: "The Austin Reading Room", client: 'Ellis & Dean Monroe',
      story: "A couple who read 100+ books a year converting their spare bedroom into a library-meets-cocktail-lounge. Moody, warm, lots of shelving.",
      room: 'Den / Library', sqft: 220, difficulty: 'member',
      constraints: ['Min 200 books shelved', 'Budget: Elite', 'Reading light per seat'],
      concepts: [
        { name: 'Moody Library', colors: ['#2C3E50','#8B4513','#C8AA78','#1a1a1a','#E8D5B7'] },
        { name: 'Study Hall', colors: ['#5B3A1E','#E8E4DE','#5B7553','#C8AA78','#F5F0E8'] },
        { name: 'Gentlemen Club', colors: ['#1a1a1a','#8B4513','#C8AA78','#4A3728','#65350F'] },
      ],
    },
  },

  // ─── 7. Quick Style mode at Phase 2 — different design mode ───
  {
    id: 'seed_quickstyle',
    title: "Beachside Airbnb Refresh",
    client: 'Coastal Living Co.',
    room: 'Living Room',
    story: "An Airbnb management company wants a fast refresh for a beachside rental. Keep it breezy, durable, Instagrammable.",
    phase: 2,
    phaseLabel: PHASE_LABELS[2],
    savedAt: Date.now() - 3600000 * 10,
    thumbnail: '🏖️',
    tier: 'micro',
    state: {
      selectedConcept: { name: 'Cool Coastal', colors: ['#87CEEB','#E8E4DE','#2F4F4F','#D4C5A9','#FEFEFE'] },
      designMode: 'quick',
      palette: ['#87CEEB','#E8E4DE','#2F4F4F','#D4C5A9','#FEFEFE'],
      selectedMaterials: [
        { id: 'm3', name: 'Maple', type: 'wood', color: '#E8C07D', pattern: 'grain', tier: 'member' },
        { id: 'm6', name: 'Travertine', type: 'stone', color: '#D4C5A9', pattern: 'vein', tier: 'member' },
        { id: 'm12', name: 'Boucle', type: 'textile', color: '#F5F0E8', pattern: 'nub', tier: 'member' },
      ],
      placedItems: [
        makePlacedItem('f1', 'Haven Sofa', 'Seating', 78, 130, 84, 36, 0, 'modern', ['#E8D5B7','#2C3E50','#8B4513','#E8E4DE']),
        makePlacedItem('f2', 'Arc Coffee Table', 'Table', 96, 80, 48, 24, 0, 'modern', ['#C8AA78','#5B3A1E','#E8E4DE']),
        makePlacedItem('f8', 'Fiddle Leaf Fig', 'Plant', 200, 8, 24, 24, 0, 'any', ['#5B7553']),
        makePlacedItem('f7', 'Linen Throw Pillow', 'Accessory', 90, 140, 20, 20, 0, 'modern', ['#E8D5B7','#2C3E50','#5B7553','#C1440E']),
      ],
      timeOfDay: 'day',
      designNotes: 'Keep it light and airy. Coastal but not kitschy.',
      competitionSeconds: 35 * 60,
      selectedLayout: null,
      quickReviewed: false,
    },
    brief: {
      id: 206, title: "Beachside Airbnb Refresh", client: 'Coastal Living Co.',
      story: "An Airbnb management company wants a fast refresh for a beachside rental. Keep it breezy, durable, Instagrammable.",
      room: 'Living Room', sqft: 350, difficulty: 'member',
      constraints: ['Durable fabrics only', 'Budget: Mid', 'Must photograph well'],
      concepts: [
        { name: 'Cool Coastal', colors: ['#87CEEB','#E8E4DE','#2F4F4F','#D4C5A9','#FEFEFE'] },
        { name: 'Tropical Modern', colors: ['#5B7553','#E8C07D','#E8D5B7','#C1440E','#FEFEFE'] },
        { name: 'Beach Minimal', colors: ['#FEFEFE','#D4C5A9','#87CEEB','#E8E4DE','#5B3A1E'] },
      ],
    },
  },
]

// ── Helpers for consumers ──
export function getSeedDesign(id) {
  return SEED_DESIGNS.find(d => d.id === id)
}

export function getSeedDesignsByPhase(phase) {
  return SEED_DESIGNS.filter(d => d.phase === phase)
}

export function getRecentSeedDesigns(limit = 5) {
  return [...SEED_DESIGNS].sort((a, b) => b.savedAt - a.savedAt).slice(0, limit)
}

export function formatTimeAgo(ts) {
  const diff = Date.now() - ts
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default SEED_DESIGNS
