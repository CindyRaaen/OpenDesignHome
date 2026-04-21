import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, RotateCcw, Plus, X, Move, Trash2, Sun, Moon, Sunset, Star, Award, TrendingUp } from 'lucide-react'
import * as THREE from 'three'
import { previewScores, scoreWithJudges, compositeScore, JUDGES } from '../utils/ScoringEngine'
import RoomPreview3D from '../components/RoomPreview3D'
import { tier2Manager, blendScores } from '../utils/Tier2ScoringBridge'
import { walletManager, ENTRY_TIERS } from '../utils/WalletEngine'
import { createRound, joinRound, startRound, submitDesign as submitToRound, finalizeRound, ROUND_STATUS, connectRealtime, generateActivityItem } from '../utils/MatchmakingEngine'
import { fetchFurniture, formatPrice } from '../utils/FurnitureCatalog'
import ProductBrowser from '../components/ProductBrowser'

// ── Map DB furniture rows to the format ChallengeFlow + RoomPreview3D expect ──
const CATEGORY_TO_TYPE = {
  sofas: 'Seating', chairs: 'Seating', seating: 'Seating',
  tables: 'Table', lamps: 'Lighting', lighting: 'Lighting',
  art: 'Art', plants: 'Plant', textiles: 'Textile',
  storage: 'Storage', accessories: 'Accessory',
}
function mapDbItemToFurniture(row) {
  const type = CATEGORY_TO_TYPE[row.category?.toLowerCase()] || row.category || 'Accessory'
  return {
    id: `db-${row.id}`,
    dbId: row.id,
    name: row.name,
    type,
    w: row.width_inches || 36,
    d: row.depth_inches || 24,
    h: row.height_inches || 30,
    style: row.style || 'modern',
    tier: 'member',
    colors: row.color_hex ? [row.color_hex] : ['#C8AA78'],
    color_hex: row.color_hex,
    brand: row.brand,
    designer: row.designer,
    collection: row.collection_name,
    material: row.material_name,
    price: row.price_usd,
    retailPrice: row.retail_price,
    imageUrl: row.image_url,
    tags: row.tags,
    fromDb: true,
  }
}

const PHASE_NAMES = ['Brief', 'Palette', 'Room Plan', 'Elevations', 'Furniture', '3D Preview', 'Submit']

// ── Material swatches ──
const MATERIALS = [
  // ── Wood ──
  { id: 'm1', name: 'White Oak', type: 'wood', color: '#C8AA78', pattern: 'grain', tier: 'member' },
  { id: 'm2', name: 'Walnut', type: 'wood', color: '#5B3A1E', pattern: 'grain', tier: 'member' },
  { id: 'm3', name: 'Maple', type: 'wood', color: '#E8C07D', pattern: 'grain', tier: 'member' },
  { id: 'm16', name: 'Rift-Sawn Oak', type: 'wood', color: '#B8975A', pattern: 'grain', tier: 'studio-pro' },
  { id: 'm17', name: 'Ebonized Ash', type: 'wood', color: '#1C1C1E', pattern: 'grain', tier: 'studio-pro' },
  { id: 'm18', name: 'Teak', type: 'wood', color: '#8B6914', pattern: 'grain', tier: 'studio-pro' },
  { id: 'm19', name: 'Cerused Oak', type: 'wood', color: '#D4C8B0', pattern: 'grain', tier: 'studio-pro' },
  { id: 'm20', name: 'Rosewood', type: 'wood', color: '#65350F', pattern: 'grain', tier: 'studio-pro' },
  // ── Stone ──
  { id: 'm4', name: 'Carrara Marble', type: 'stone', color: '#E8E4DE', pattern: 'vein', tier: 'member' },
  { id: 'm5', name: 'Soapstone', type: 'stone', color: '#4A4A48', pattern: 'matte', tier: 'member' },
  { id: 'm6', name: 'Travertine', type: 'stone', color: '#D4C5A9', pattern: 'vein', tier: 'member' },
  { id: 'm21', name: 'Calacatta Gold', type: 'stone', color: '#F5F0E5', pattern: 'vein', tier: 'studio-pro' },
  { id: 'm22', name: 'Nero Marquina', type: 'stone', color: '#1A1A1A', pattern: 'vein', tier: 'studio-pro' },
  { id: 'm23', name: 'Quartzite', type: 'stone', color: '#C9BFA8', pattern: 'matte', tier: 'studio-pro' },
  // ── Metal ──
  { id: 'm7', name: 'Brushed Brass', type: 'metal', color: '#C8AA78', pattern: 'brushed', tier: 'member' },
  { id: 'm8', name: 'Matte Black', type: 'metal', color: '#1a1a1a', pattern: 'matte', tier: 'member' },
  { id: 'm9', name: 'Oil-Rubbed Bronze', type: 'metal', color: '#4A3728', pattern: 'patina', tier: 'member' },
  { id: 'm24', name: 'Unlacquered Brass', type: 'metal', color: '#D4A844', pattern: 'patina', tier: 'studio-pro' },
  { id: 'm25', name: 'Polished Nickel', type: 'metal', color: '#C0C0C0', pattern: 'brushed', tier: 'studio-pro' },
  { id: 'm26', name: 'Aged Iron', type: 'metal', color: '#3B3B3B', pattern: 'patina', tier: 'studio-pro' },
  // ── Textile ──
  { id: 'm10', name: 'Belgian Linen', type: 'textile', color: '#E8D5B7', pattern: 'weave', tier: 'member' },
  { id: 'm11', name: 'Velvet', type: 'textile', color: '#2C3E50', pattern: 'plush', tier: 'member' },
  { id: 'm12', name: 'Boucle', type: 'textile', color: '#F5F0E8', pattern: 'nub', tier: 'member' },
  { id: 'm13', name: 'Leather Saddle', type: 'textile', color: '#8B4513', pattern: 'smooth', tier: 'member' },
  { id: 'm27', name: 'Mohair', type: 'textile', color: '#6B4E3D', pattern: 'plush', tier: 'studio-pro' },
  { id: 'm28', name: 'Raw Silk', type: 'textile', color: '#E8DCC8', pattern: 'weave', tier: 'studio-pro' },
  { id: 'm29', name: 'Cashmere Wool', type: 'textile', color: '#C4B5A0', pattern: 'nub', tier: 'studio-pro' },
  { id: 'm30', name: 'Aniline Leather', type: 'textile', color: '#5C3317', pattern: 'smooth', tier: 'studio-pro' },
  { id: 'm31', name: 'Performance Velvet', type: 'textile', color: '#4A6741', pattern: 'plush', tier: 'studio-pro' },
  // ── Ceramic ──
  { id: 'm14', name: 'Terracotta', type: 'ceramic', color: '#C1440E', pattern: 'matte', tier: 'member' },
  { id: 'm15', name: 'Zellige', type: 'ceramic', color: '#87CEEB', pattern: 'glaze', tier: 'member' },
  { id: 'm32', name: 'Encaustic Tile', type: 'ceramic', color: '#2B4C6F', pattern: 'glaze', tier: 'studio-pro' },
  { id: 'm33', name: 'Heath Ceramic', type: 'ceramic', color: '#6B8E6B', pattern: 'glaze', tier: 'studio-pro' },
  { id: 'm34', name: 'Crackle Glaze', type: 'ceramic', color: '#F0EBE0', pattern: 'glaze', tier: 'studio-pro' },
]

const PLAYER_TIER = 'member' // TODO: pull from user profile

// ═══════════════════════════════════════════════════════════
// COMPETITION ARCHITECTURE
// ═══════════════════════════════════════════════════════════

// Player profile (would come from auth/backend in production)
const PLAYER_PROFILE = {
  handle: '@DesignDreamer',
  avatar: '🎨',
  city: 'San Francisco',
  state: 'California',
  region: 'West Coast',
  ageRange: '30s',
  designVibe: 'Warm & Cozy',
  superpower: 'Color',
  playReason: 'Creative Expression',
  styleBadge: 'Warm Minimalist',
  tier: 'member',
  stats: { wins: 12, losses: 8, streak: 3, bestStreak: 7, totalDesigns: 24, avgStars: 3.8, rank: { city: 14, state: 89, national: 2340 } },
}

// Geographic competition tiers
const GEO_TIERS = [
  { id: 'city', label: 'City', icon: '🏙️', desc: 'San Francisco Metro', playerCount: 847 },
  { id: 'state', label: 'State', icon: '🗺️', desc: 'California', playerCount: 12400 },
  { id: 'national', label: 'National', icon: '🇺🇸', desc: 'United States', playerCount: 184000 },
  { id: 'global', label: 'Global', icon: '🌍', desc: 'Worldwide', playerCount: 520000 },
]

// Simulated competitors in your match group
const MATCH_GROUP = [
  { handle: '@PacificHeightsStyle', avatar: '✨', city: 'San Francisco', styleBadge: 'Modern Luxe', stats: { avgStars: 4.1, wins: 28 }, rivalry: 3 },
  { handle: '@MidCenturyMaven', avatar: '🪑', city: 'Portland', styleBadge: 'Mid-Century', stats: { avgStars: 3.9, wins: 22 }, rivalry: 5 },
  { handle: '@DesertModernist', avatar: '🌵', city: 'Scottsdale', styleBadge: 'Desert Modern', stats: { avgStars: 3.7, wins: 15 }, rivalry: 0 },
  { handle: '@NordicNest', avatar: '❄️', city: 'Seattle', styleBadge: 'Scandinavian', stats: { avgStars: 4.0, wins: 31 }, rivalry: 2 },
  { handle: '@BohoSoulSF', avatar: '🌿', city: 'San Francisco', styleBadge: 'Bohemian', stats: { avgStars: 3.5, wins: 10 }, rivalry: 1 },
  { handle: '@TheMaximalist', avatar: '💎', city: 'Los Angeles', styleBadge: 'Bold Maximalist', stats: { avgStars: 3.6, wins: 19 }, rivalry: 0 },
  { handle: '@QuietLuxCA', avatar: '🕯️', city: 'Napa Valley', styleBadge: 'Quiet Luxury', stats: { avgStars: 4.2, wins: 35 }, rivalry: 4 },
]

// Competition format for this challenge
const CHALLENGE_COMPETITION = {
  format: 'Weekly Showdown',
  tier: 'state',
  timeRemaining: '36h 12m',
  poolSize: 8,
  votingStyle: 'category', // color, space, vibe
  prizes: { first: 'Exclusive Walnut Herringbone material', second: '500 coins', third: '200 coins' },
}

// ═══════════════════════════════════════════════════════════
// END COMPETITION ARCHITECTURE
// ═══════════════════════════════════════════════════════════

// ── Furniture catalog (palette-filtered in Phase 3) ──
const FURNITURE = [
  // Member tier
  { id: 'f1', name: 'Haven Sofa', type: 'Seating', w: 84, d: 36, style: 'modern', tier: 'member', colors: ['#E8D5B7','#2C3E50','#8B4513','#E8E4DE'] },
  { id: 'f2', name: 'Arc Coffee Table', type: 'Table', w: 48, d: 24, style: 'modern', tier: 'member', colors: ['#C8AA78','#5B3A1E','#E8E4DE'] },
  { id: 'f3', name: 'Sculptor Lounge Chair', type: 'Seating', w: 32, d: 34, style: 'mid-century', tier: 'member', colors: ['#C1440E','#2C3E50','#E8D5B7','#5B7553'] },
  { id: 'f4', name: 'Horizon Bookshelf', type: 'Storage', w: 60, d: 14, style: 'modern', tier: 'member', colors: ['#5B3A1E','#C8AA78','#1a1a1a'] },
  { id: 'f5', name: 'Ceramic Table Lamp', type: 'Lighting', w: 12, d: 12, style: 'artisan', tier: 'member', colors: ['#E8D5B7','#C1440E','#5B7553'] },
  { id: 'f6', name: 'Woven Area Rug 8x10', type: 'Textile', w: 96, d: 120, style: 'artisan', tier: 'member', colors: ['#E8D5B7','#D4C5A9','#8B4513'] },
  { id: 'f7', name: 'Linen Throw Pillow', type: 'Accessory', w: 20, d: 20, style: 'modern', tier: 'member', colors: ['#E8D5B7','#2C3E50','#5B7553','#C1440E'] },
  { id: 'f8', name: 'Fiddle Leaf Fig', type: 'Plant', w: 24, d: 24, style: 'any', tier: 'member', colors: ['#5B7553'] },
  { id: 'f9', name: 'Abstract Canvas 36x48', type: 'Art', w: 36, d: 2, style: 'modern', tier: 'member', colors: ['#2C3E50','#C1440E','#E8C07D','#E8E4DE'] },
  { id: 'f10', name: 'Brass Floor Lamp', type: 'Lighting', w: 16, d: 16, style: 'mid-century', tier: 'member', colors: ['#C8AA78','#1a1a1a'] },
  { id: 'f11', name: 'Side Table', type: 'Table', w: 18, d: 18, style: 'modern', tier: 'member', colors: ['#5B3A1E','#C8AA78','#E8E4DE','#4A4A48'] },
  { id: 'f12', name: 'Console Table', type: 'Table', w: 54, d: 14, style: 'modern', tier: 'member', colors: ['#5B3A1E','#C8AA78','#1a1a1a'] },
  // Studio Pro tier
  { id: 'f13', name: 'Chaise Longue', type: 'Seating', w: 72, d: 32, style: 'modern', tier: 'studio-pro', colors: ['#E8D5B7','#2C3E50','#6B4E3D','#F5F0E8'] },
  { id: 'f14', name: 'Eames Lounge', type: 'Seating', w: 33, d: 33, style: 'mid-century', tier: 'studio-pro', colors: ['#5B3A1E','#1a1a1a','#8B4513'] },
  { id: 'f15', name: 'Live-Edge Dining Table', type: 'Table', w: 84, d: 40, style: 'artisan', tier: 'studio-pro', colors: ['#C8AA78','#5B3A1E','#8B6914'] },
  { id: 'f16', name: 'Credenza', type: 'Storage', w: 72, d: 18, style: 'mid-century', tier: 'studio-pro', colors: ['#5B3A1E','#C8AA78','#65350F'] },
  { id: 'f17', name: 'Articulated Sconce', type: 'Lighting', w: 8, d: 10, style: 'modern', tier: 'studio-pro', colors: ['#C8AA78','#D4A844','#1a1a1a'] },
  { id: 'f18', name: 'Moroccan Pouf', type: 'Seating', w: 22, d: 22, style: 'artisan', tier: 'studio-pro', colors: ['#8B4513','#C1440E','#E8D5B7'] },
  { id: 'f19', name: 'Sculptural Vase', type: 'Accessory', w: 10, d: 10, style: 'artisan', tier: 'studio-pro', colors: ['#E8E4DE','#C1440E','#F0EBE0'] },
  { id: 'f20', name: 'Olive Tree', type: 'Plant', w: 28, d: 28, style: 'any', tier: 'studio-pro', colors: ['#5B7553','#4A6741'] },
]

// ── Curated palettes for Quick Style mode ──
const CURATED_PALETTES = [
  { name: 'Warm Neutral', colors: ['#E8D5B7','#8B4513','#2C3E50','#D4A574','#F5F0E8'], materials: ['m1','m4','m7','m10','m14'] },
  { name: 'Cool Coastal', colors: ['#87CEEB','#E8E4DE','#2F4F4F','#D4C5A9','#FEFEFE'], materials: ['m3','m6','m8','m12','m15'] },
  { name: 'Earthy Modern', colors: ['#C1440E','#E8C07D','#1a1a1a','#5B3A1E','#F4ECD8'], materials: ['m2','m5','m9','m13','m14'] },
  { name: 'Quiet Luxury', colors: ['#F5F0E8','#C8AA78','#2C3E50','#4A3728','#E8E4DE'], materials: ['m1','m4','m7','m11','m12'] },
  { name: 'Nordic Winter', colors: ['#E8E4DE','#5B7553','#2B2B2B','#C1A882','#FEFEFE'], materials: ['m3','m5','m8','m10','m15'] },
  { name: 'Desert Sunset', colors: ['#C1440E','#E8C07D','#8B6914','#F4ECD8','#4A4A48'], materials: ['m2','m6','m9','m13','m14'] },
]

// ── Pre-made layouts for Level 1 & 2 ──
// Room: 20'x16' = 240"x192". SVG room rect: x=60,y=60, w=540,h=400. Scale: 2.25 SVG units/inch.
const inchToSVG = (inchX, inchY) => ({ x: 60 + inchX * 2.25, y: 60 + inchY * 2.25 })

// Each slot has a type, position, rotation, and a default furniture pick
const PRE_LAYOUTS = [
  { name: 'Conversation', desc: 'Sofa facing fireplace, chairs opposite, coffee table centered', slots: [
    { slotType: 'Seating', label: 'Main Sofa', ...inchToSVG(78, 130), rotation: 0, defaultId: 'f1', w: 84, d: 36 },
    { slotType: 'Seating', label: 'Accent Chair', ...inchToSVG(60, 30), rotation: 0, defaultId: 'f3', w: 32, d: 34 },
    { slotType: 'Table', label: 'Coffee Table', ...inchToSVG(96, 80), rotation: 0, defaultId: 'f2', w: 48, d: 24 },
    { slotType: 'Textile', label: 'Area Rug', ...inchToSVG(72, 36), rotation: 0, defaultId: 'f6', w: 96, d: 120 },
    { slotType: 'Lighting', label: 'Floor Lamp', ...inchToSVG(24, 140), rotation: 0, defaultId: 'f10', w: 16, d: 16 },
    { slotType: 'Table', label: 'Side Table', ...inchToSVG(170, 130), rotation: 0, defaultId: 'f11', w: 18, d: 18 },
    { slotType: 'Plant', label: 'Corner Plant', ...inchToSVG(200, 8), rotation: 0, defaultId: 'f8', w: 24, d: 24 },
    { slotType: 'Art', label: 'Wall Art', ...inchToSVG(206, 60), rotation: 0, defaultId: 'f9', w: 36, d: 2 },
  ]},
  { name: 'Open Flow', desc: 'L-shaped seating with reading nook by the window', slots: [
    { slotType: 'Seating', label: 'Sofa (vertical)', ...inchToSVG(8, 60), rotation: 90, defaultId: 'f1', w: 84, d: 36 },
    { slotType: 'Seating', label: 'Lounge Chair', ...inchToSVG(100, 120), rotation: -15, defaultId: 'f3', w: 32, d: 34 },
    { slotType: 'Table', label: 'Coffee Table', ...inchToSVG(80, 70), rotation: 0, defaultId: 'f2', w: 48, d: 24 },
    { slotType: 'Table', label: 'Side Table', ...inchToSVG(140, 130), rotation: 0, defaultId: 'f11', w: 18, d: 18 },
    { slotType: 'Lighting', label: 'Reading Lamp', ...inchToSVG(8, 30), rotation: 0, defaultId: 'f5', w: 12, d: 12 },
    { slotType: 'Storage', label: 'Bookshelf', ...inchToSVG(170, 8), rotation: 0, defaultId: 'f4', w: 60, d: 14 },
    { slotType: 'Textile', label: 'Area Rug', ...inchToSVG(40, 40), rotation: 0, defaultId: 'f6', w: 96, d: 120 },
    { slotType: 'Plant', label: 'Entry Plant', ...inchToSVG(200, 155), rotation: 0, defaultId: 'f8', w: 24, d: 24 },
  ]},
  { name: 'Entertainer', desc: 'Wide seating arc with console bar and open center', slots: [
    { slotType: 'Seating', label: 'Main Sofa', ...inchToSVG(78, 140), rotation: 0, defaultId: 'f1', w: 84, d: 36 },
    { slotType: 'Table', label: 'Console Bar', ...inchToSVG(48, 18), rotation: 0, defaultId: 'f12', w: 54, d: 14 },
    { slotType: 'Storage', label: 'Display Shelf', ...inchToSVG(176, 50), rotation: 90, defaultId: 'f4', w: 60, d: 14 },
    { slotType: 'Seating', label: 'Accent Chair', ...inchToSVG(160, 110), rotation: -30, defaultId: 'f3', w: 32, d: 34 },
    { slotType: 'Table', label: 'Coffee Table', ...inchToSVG(110, 90), rotation: 0, defaultId: 'f2', w: 48, d: 24 },
    { slotType: 'Lighting', label: 'Floor Lamp', ...inchToSVG(24, 148), rotation: 0, defaultId: 'f10', w: 16, d: 16 },
    { slotType: 'Accessory', label: 'Accent Pillows', ...inchToSVG(90, 150), rotation: 0, defaultId: 'f7', w: 20, d: 20 },
    { slotType: 'Art', label: 'Wall Art', ...inchToSVG(8, 60), rotation: 0, defaultId: 'f9', w: 36, d: 2 },
  ]},
]

// ── Design mode levels ──
const DESIGN_MODES = [
  { id: 'quick', label: 'Quick Style', time: '10–15 min', desc: 'Pre-furnished room. Pick a palette, choose materials, done.' },
  { id: 'layout', label: 'Layout + Style', time: '15–20 min', desc: 'Choose from 3 layouts, then pick palette & materials.' },
  { id: 'full', label: 'Full Design', time: '25–40 min', desc: 'Complete creative control — custom palette, drag & drop furniture, rotation.' },
]

// ── Default brief if none passed ──
const DEFAULT_BRIEF = {
  id: 101, title: "Maya's Portland Bungalow", client: 'Maya Chen',
  story: "A ceramicist who just bought a 1920s bungalow with original hardwoods and tons of natural light. She wants warmth without clutter — a space that feels like a deep breath.",
  room: 'Living Room', sqft: 320, difficulty: 'member',
  constraints: ['Keep fireplace', 'Budget: Mid', 'No TV wall'],
  scoringCriteria: {
    mood: 'warm-minimal',
    maxItems: 8,
    requiredTypes: ['Seating', 'Lighting'],
    forbiddenTypes: [],
    preferNaturalMaterials: true,
    colorTemperature: 'warm',
    budgetTier: 'mid',
    requirePlant: true,
    symmetryPreference: 'asymmetric',
  },
  concepts: [
    { name: 'Warm Minimal', colors: ['#E8D5B7','#8B4513','#2C3E50','#D4A574','#F5F0E8'] },
    { name: 'Nordic Craft', colors: ['#E8E4DE','#5B7553','#2B2B2B','#C1A882','#FEFEFE'] },
    { name: 'Desert Modern', colors: ['#C1440E','#E8C07D','#2F4F4F','#F4ECD8','#8B6F47'] },
  ],
}

export default function ChallengeFlow({ challenge, setPage }) {
  const raw = challenge || DEFAULT_BRIEF
  // If challenge has a .brief (from seed data), use that as the brief source
  const briefSource = raw.brief || raw
  const brief = { ...DEFAULT_BRIEF, ...briefSource, concepts: briefSource.concepts || DEFAULT_BRIEF.concepts }
  // Seed state for resuming designs — if challenge has .state, hydrate from it
  const seed = raw.state || null
  const [phase, setPhase] = useState(seed ? raw.phase : 0)
  const [selectedConcept, setSelectedConcept] = useState(seed?.selectedConcept ?? null)

  // ── Palette state ──
  const [palette, setPalette] = useState(seed?.palette ?? [])
  const [customColor, setCustomColor] = useState('#C8AA78')
  const [customLightness, setCustomLightness] = useState(50)
  const [selectedMaterials, setSelectedMaterials] = useState(seed?.selectedMaterials ?? [])
  const [materialFilter, setMaterialFilter] = useState('all')

  // ── Design state ──
  const [placedItems, setPlacedItems] = useState(seed?.placedItems ?? [])
  const [selectedItem, setSelectedItem] = useState(null)
  const [catalogFilter, setCatalogFilter] = useState('All')
  const [timeOfDay, setTimeOfDay] = useState(seed?.timeOfDay ?? 'day')
  const [viewMode, setViewMode] = useState('plan') // plan or 3d
  const [designNotes, setDesignNotes] = useState(seed?.designNotes ?? '')
  const [dragging, setDragging] = useState(null) // { instanceId, offsetX, offsetY }
  const svgRef = useRef(null)

  const [customPaletteMode, setCustomPaletteMode] = useState(false)
  const [designMode, setDesignMode] = useState(seed?.designMode ?? null) // 'quick' | 'layout' | 'full'
  const [selectedLayout, setSelectedLayout] = useState(seed?.selectedLayout ?? null)
  const [quickReviewed, setQuickReviewed] = useState(seed?.quickReviewed ?? false)
  const [activeSlot, setActiveSlot] = useState(null) // index of slot being edited
  const [slotChoices, setSlotChoices] = useState({}) // { slotIndex: furnitureId }

  // ── Wall decoration state (Elevations phase) ──
  const [wallPaint, setWallPaint] = useState({ north: '#f5f0e8', south: '#f5f0e8', east: '#f5f0e8', west: '#f5f0e8' })
  const [wallDecor, setWallDecor] = useState({ north: [], south: [], east: [], west: [] }) // array of { type, x, y, w, h, ... }
  const [windowTreatments, setWindowTreatments] = useState({}) // { wallId: 'none'|'drapes'|'romans'|'sheers' }

  // ── ProductBrowser state ──
  const [showProductBrowser, setShowProductBrowser] = useState(false)
  const [productBrowserCategory, setProductBrowserCategory] = useState('all')
  const [productBrowserContext, setProductBrowserContext] = useState(null) // 'room-plan' | 'elevation-art' | 'elevation-sconce' | 'elevation-drapery' | 'elevation-light' | 'furniture-spec'

  const openProductBrowser = (context, category = 'all') => {
    setProductBrowserContext(context)
    setProductBrowserCategory(category)
    setShowProductBrowser(true)
  }

  const handleProductSelect = (browserItem) => {
    const widthIn = parseFloat(browserItem.widthInches) || 36
    const depthIn = parseFloat(browserItem.depthInches) || 24
    const heightIn = parseFloat(browserItem.heightInches) || 30

    if (productBrowserContext === 'room-plan' || productBrowserContext === 'furniture-spec') {
      // Add as a furniture item to the floor plan
      const newItem = {
        id: `prod-${browserItem.productId}`,
        dbId: browserItem.productId,
        name: browserItem.label,
        type: browserItem.category || 'Accessory',
        w: widthIn,
        d: depthIn,
        h: heightIn,
        style: 'modern',
        tier: 'member',
        colors: ['#C8AA78'],
        brand: browserItem.vendorName,
        price: browserItem.price,
        imageUrl: browserItem.imageUrl,
        fromDb: true,
      }
      addFurniture(newItem)
    } else if (productBrowserContext?.startsWith('elevation-')) {
      // Add as wall decor to the active elevation wall
      const decorType = productBrowserContext.replace('elevation-', '')
      const typeMap = { art: 'art', sconce: 'sconce', drapery: 'drapery', light: 'accent-light' }
      const mountH = decorType === 'sconce' ? 66 : decorType === 'light' ? 78 : 60
      // We need to know the active wall — stored in a ref so ProductBrowser callback can access it
      const wall = productBrowserWallRef.current || 'north'
      addDecorItem(wall, {
        type: typeMap[decorType] || 'art',
        subtype: browserItem.productId,
        name: browserItem.label,
        x: 120, // center-ish, user can reposition
        y: mountH,
        w: widthIn,
        h: heightIn,
        imageUrl: browserItem.imageUrl,
        brand: browserItem.vendorName,
        price: browserItem.price,
      })
    }
    setShowProductBrowser(false)
  }

  const productBrowserWallRef = useRef('north')

  // ── Wall decor helpers (hoisted so ProductBrowser callback can use them) ──
  const addDecorItem = (wallId, item) => {
    setWallDecor(prev => ({
      ...prev,
      [wallId]: [...prev[wallId], { ...item, id: Date.now() + Math.random() }]
    }))
  }

  // ── Competition state ──
  const [competitionTier, setCompetitionTier] = useState('city') // city | state | national | global
  const [showCompetitors, setShowCompetitors] = useState(false)
  const [designScore, setDesignScore] = useState({ color: 0, space: 0, vibe: 0 }) // live scoring hints

  // ── AI Judge state ──
  const [judgeResults, setJudgeResults] = useState(null) // null until scored
  const [revealedJudges, setRevealedJudges] = useState(0) // animated reveal counter
  const [judgeAnimating, setJudgeAnimating] = useState(false)
  const [competitionSeconds, setCompetitionSeconds] = useState(seed?.competitionSeconds ?? 45 * 60)
  const [showJudgePanel, setShowJudgePanel] = useState(true) // toggle live panel
  const [liveJudgeScores, setLiveJudgeScores] = useState(null)
  const [judgePulse, setJudgePulse] = useState(null) // which judge is reacting

  // ── Tier 2 model-backed scoring ──
  const [tier2Scores, setTier2Scores] = useState(null) // { color, space, vibe, models }
  const [tier2Loading, setTier2Loading] = useState(false)
  const [scoringTier, setScoringTier] = useState(1) // 1 = heuristic only, 2 = blended

  // ── Multiplayer / Round state ──
  const [activeRound, setActiveRound] = useState(null)
  const [walletBalance, setWalletBalance] = useState(walletManager.balance)
  const [roundActivity, setRoundActivity] = useState([])

  // ── Real furniture from database ──
  const [dbFurniture, setDbFurniture] = useState([])
  const [dbLoading, setDbLoading] = useState(true)

  // Load real furniture from the database on mount
  useEffect(() => {
    let cancelled = false
    setDbLoading(true)
    fetchFurniture()
      .then(rows => {
        if (cancelled) return
        const mapped = (rows || []).map(mapDbItemToFurniture)
        setDbFurniture(mapped)
        setDbLoading(false)
      })
      .catch(() => setDbLoading(false))
    return () => { cancelled = true }
  }, [])

  // Merge DB furniture with static fallback — DB items come first
  const ALL_FURNITURE = dbFurniture.length > 0 ? dbFurniture : FURNITURE

  // Subscribe to wallet changes
  useEffect(() => {
    return walletManager.subscribe(w => setWalletBalance(w.balance))
  }, [])

  // Subscribe to Tier 2 score updates
  useEffect(() => {
    return tier2Manager.subscribe((t2, alpha) => {
      if (t2) {
        setTier2Scores(t2)
        setScoringTier(2)
        setTier2Loading(false)
        // Blend Tier 2 model scores into the displayed design score
        setDesignScore(prev => prev ? blendScores(prev, t2, alpha) : prev)
      }
    })
  }, [])

  // Countdown timer — ticks every second during design phases
  useEffect(() => {
    if (phase < 1 || phase > 5) return
    const tick = setInterval(() => {
      setCompetitionSeconds(prev => {
        if (prev <= 0) { clearInterval(tick); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [phase])

  // Live score preview — updates as player designs
  useEffect(() => {
    if (phase >= 2 && placedItems.length > 0) {
      const scores = previewScores(palette, placedItems, selectedMaterials, brief)
      setDesignScore(scores)
      // Run full judge scoring for live panel
      const results = scoreWithJudges(palette, placedItems, selectedMaterials, brief)
      setLiveJudgeScores(results)
      // Trigger a random judge "reaction" pulse
      const pulseIdx = Math.floor(Math.random() * results.length)
      setJudgePulse(results[pulseIdx].judge.id)
      setTimeout(() => setJudgePulse(null), 600)

      // Fire Tier 2 model-backed scoring in background
      setTier2Loading(true)
      tier2Manager.requestScoring(placedItems, 240, 192, palette, selectedMaterials)
    }
  }, [palette, placedItems, selectedMaterials, phase])

  // ── Color conversion helpers (top-level, not in IIFE) ──
  const hexToHsl = useCallback((hex) => {
    let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min
    let h = 0, s = 0, l = (max+min)/2
    if (d !== 0) {
      s = l > 0.5 ? d/(2-max-min) : d/(max+min)
      if (max === r) h = ((g-b)/d + (g < b ? 6 : 0)) / 6
      else if (max === g) h = ((b-r)/d + 2) / 6
      else h = ((r-g)/d + 4) / 6
    }
    return [Math.round(h*360), Math.round(s*100), Math.round(l*100)]
  }, [])

  const hslToHex = useCallback((h,s,l) => {
    s /= 100; l /= 100
    const a = s * Math.min(l, 1-l)
    const f = n => { const k = (n + h/30) % 12; return l - a * Math.max(Math.min(k-3, 9-k, 1), -1) }
    return '#' + [f(0),f(8),f(4)].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('')
  }, [])

  // ── Drag handlers for furniture ──
  const getSVGPoint = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    pt.x = clientX; pt.y = clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: svgP.x, y: svgP.y }
  }, [])

  const handleDragStart = useCallback((e, item) => {
    e.stopPropagation()
    const p = getSVGPoint(e)
    setDragging({ instanceId: item.instanceId, offsetX: p.x - item.x, offsetY: p.y - item.y })
    setSelectedItem(item.instanceId)
  }, [getSVGPoint])

  const handleDragMove = useCallback((e) => {
    if (!dragging) return
    e.preventDefault()
    const p = getSVGPoint(e)
    setPlacedItems(prev => prev.map(item =>
      item.instanceId === dragging.instanceId
        ? { ...item, x: p.x - dragging.offsetX, y: p.y - dragging.offsetY }
        : item
    ))
  }, [dragging, getSVGPoint])

  const handleDragEnd = useCallback(() => {
    setDragging(null)
  }, [])

  const rotateItem = useCallback((instanceId, degrees) => {
    setPlacedItems(prev => prev.map(item =>
      item.instanceId === instanceId
        ? { ...item, rotation: (item.rotation || 0) + degrees }
        : item
    ))
  }, [])

  const handleCreateOwnPalette = () => {
    setCustomPaletteMode(true)
    setSelectedConcept({ name: 'Custom', colors: [] })
    setPalette([])
    setPhase(1)
  }

  const canAdvance = () => {
    if (phase === 0) return selectedConcept !== null && designMode !== null
    if (phase === 1) return palette.length >= 3 && selectedMaterials.length >= 2
    if (phase === 2) return placedItems.length >= 1  // Room Plan — at least 1 piece placed
    if (phase === 3) return true  // Elevations — review step, always advanceable
    if (phase === 4) return placedItems.length >= 3  // Furniture — at least 3 pieces specified
    if (phase === 5) return true  // 3D Preview — review step
    if (phase === 99) {
      // Legacy — keeping for reference
      if (designMode === 'quick') return quickReviewed && placedItems.length > 0
      if (designMode === 'layout') return selectedLayout !== null
      return placedItems.length >= 3
    }
    return true
  }

  const handleConceptSelect = (concept) => {
    setSelectedConcept(concept)
    setPalette([...concept.colors])
  }

  const addToPalette = (color) => {
    if (palette.length < 7 && !palette.includes(color)) setPalette([...palette, color])
  }
  const removeFromPalette = (i) => setPalette(palette.filter((_, idx) => idx !== i))

  const toggleMaterial = (mat) => {
    if (mat.tier === 'studio-pro' && PLAYER_TIER === 'member') return // locked
    if (selectedMaterials.find(m => m.id === mat.id)) {
      setSelectedMaterials(selectedMaterials.filter(m => m.id !== mat.id))
    } else if (selectedMaterials.length < 5) {
      setSelectedMaterials([...selectedMaterials, mat])
    }
  }

  // Room is 20'x16' (240"x192"), SVG room rect is 540x400 starting at (60,60)
  const ROOM_ORIGIN_X = 60, ROOM_ORIGIN_Y = 60, ROOM_W = 540, ROOM_H = 400
  const ROOM_INCHES_W = 240, ROOM_INCHES_H = 192
  const INCH_TO_SVG = ROOM_W / ROOM_INCHES_W // 2.25

  const addFurniture = (item) => {
    if (item.tier === 'studio-pro' && PLAYER_TIER === 'member') return // locked
    const svgW = item.w * INCH_TO_SVG
    const svgD = (item.d || 20) * INCH_TO_SVG
    // Place randomly inside the room with padding
    const x = ROOM_ORIGIN_X + 10 + Math.random() * (ROOM_W - svgW - 20)
    const y = ROOM_ORIGIN_Y + 30 + Math.random() * (ROOM_H - svgD - 40)
    setPlacedItems([...placedItems, {
      ...item, instanceId: Date.now(), x, y, rotation: 0
    }])
  }
  const removeItem = (instanceId) => setPlacedItems(placedItems.filter(p => p.instanceId !== instanceId))

  const filteredMaterials = materialFilter === 'all' ? MATERIALS : MATERIALS.filter(m => m.type === materialFilter)
  const catalogTypes = ['All', ...new Set(ALL_FURNITURE.map(f => f.type))]
  const filteredFurniture = catalogFilter === 'All' ? ALL_FURNITURE : ALL_FURNITURE.filter(f => f.type === catalogFilter)

  // ── Phase progress bar ──
  // Format countdown timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  const timerUrgent = competitionSeconds < 300 // under 5 min
  const timerWarning = competitionSeconds < 600 && !timerUrgent // under 10 min

  const ProgressBar = () => (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0e0e0e' }}>
      {/* Competition banner — LIVE round indicator */}
      {phase >= 1 && phase <= 5 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          padding: '8px 32px',
          background: timerUrgent ? 'rgba(200,60,60,0.12)' : 'rgba(200,170,120,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: timerUrgent ? '#e05050' : '#5B7553',
            boxShadow: timerUrgent ? '0 0 8px rgba(224,80,80,0.6)' : '0 0 6px rgba(91,117,83,0.5)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ color: '#8a8078', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>
            Live Round — {CHALLENGE_COMPETITION.format}
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 20,
            background: timerUrgent ? 'rgba(200,60,60,0.2)' : timerWarning ? 'rgba(200,170,60,0.15)' : 'rgba(200,170,120,0.1)',
            border: `1px solid ${timerUrgent ? 'rgba(200,60,60,0.3)' : 'rgba(200,170,120,0.15)'}`,
          }}>
            <span style={{ fontSize: 12 }}>⏱</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 14, fontWeight: 700, letterSpacing: 1,
              color: timerUrgent ? '#e05050' : timerWarning ? '#d4a840' : '#c8aa78',
            }}>
              {formatTime(competitionSeconds)}
            </span>
          </div>
          <span style={{ color: '#5a5248', fontSize: 11 }}>
            {GEO_TIERS.find(t => t.id === CHALLENGE_COMPETITION.tier)?.desc} · {CHALLENGE_COMPETITION.poolSize} designers
          </span>
        </div>
      )}
      {/* Phase progress row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '14px 32px' }}>
        <button onClick={() => setPage('briefs')} style={{ background: 'none', border: 'none', color: '#6a6258', cursor: 'pointer', marginRight: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={16} /> Briefs
        </button>
        {/* Player badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16, padding: '4px 10px', borderRadius: 16, background: 'rgba(200,170,120,0.06)', border: '1px solid rgba(200,170,120,0.12)' }}>
          <span style={{ fontSize: 14 }}>{PLAYER_PROFILE.avatar}</span>
          <span style={{ color: '#c8aa78', fontSize: 11, fontWeight: 500 }}>{PLAYER_PROFILE.handle}</span>
          <span style={{ color: '#5a5248', fontSize: 10 }}>#{PLAYER_PROFILE.stats.rank.city} {PLAYER_PROFILE.city}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {PHASE_NAMES.map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => i <= phase && setPhase(i)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20,
                border: 'none', cursor: i <= phase ? 'pointer' : 'default',
                background: i === phase ? 'rgba(200,170,120,0.15)' : 'transparent',
                color: i < phase ? '#c8aa78' : i === phase ? '#f5f0e8' : '#3a3630',
                fontSize: 13, fontWeight: i === phase ? 500 : 400, transition: 'all 0.2s'
              }}>
                {i < phase ? <Check size={14} /> : <span style={{
                  width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: i === phase ? '2px solid #c8aa78' : '1px solid #3a3630', fontSize: 11,
                  color: i === phase ? '#c8aa78' : '#3a3630'
                }}>{i + 1}</span>}
                {name}
              </button>
              {i < 3 && <div style={{ width: 40, height: 1, background: i < phase ? '#c8aa78' : 'rgba(255,255,255,0.06)' }} />}
            </div>
          ))}
        </div>
        {/* Wallet balance */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
          borderRadius: 16, background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.15)',
          marginRight: 8,
        }}>
          <span style={{ fontSize: 12 }}>💰</span>
          <span style={{ color: '#27AE60', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
            ${walletBalance.toFixed(2)}
          </span>
        </div>
        {/* Scoring tier indicator */}
        {phase >= 2 && phase <= 5 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
            borderRadius: 16, background: scoringTier === 2 ? 'rgba(46,134,193,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${scoringTier === 2 ? 'rgba(46,134,193,0.2)' : 'rgba(255,255,255,0.06)'}`,
            marginRight: 8, transition: 'all 0.5s',
          }}>
            <span style={{ fontSize: 10 }}>{tier2Loading ? '⚡' : scoringTier === 2 ? '🧠' : '📐'}</span>
            <span style={{ color: scoringTier === 2 ? '#2E86C1' : '#5a5248', fontSize: 10, fontWeight: 500 }}>
              {tier2Loading ? 'AI scoring...' : scoringTier === 2 ? 'Tier 2 AI' : 'Tier 1'}
            </span>
          </div>
        )}
        {/* Toggle judge panel */}
        {phase >= 2 && phase <= 5 && (
          <button onClick={() => setShowJudgePanel(!showJudgePanel)} style={{
            background: showJudgePanel ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(200,170,120,0.12)', borderRadius: 8,
            color: showJudgePanel ? '#c8aa78' : '#5a5248', fontSize: 11, fontWeight: 500,
            padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Eye size={14} /> Judges
          </button>
        )}
      </div>
    </div>
  )

  // ════════════════════ PHASE 0: BRIEF ════════════════════
  const BriefPhase = () => (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px' }}>
      <p style={{ color: '#6a6258', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Your Client</p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#f5f0e8', fontWeight: 400, marginBottom: 8 }}>{brief.title}</h2>
      <p style={{ color: '#6a6258', fontSize: 14, marginBottom: 32 }}>{brief.room} · {brief.sqft} sq ft</p>

      <div style={{ background: 'rgba(200,170,120,0.06)', borderLeft: '3px solid rgba(200,170,120,0.3)', padding: '24px 28px', borderRadius: '0 12px 12px 0', marginBottom: 40 }}>
        <p style={{ color: '#c8b89a', fontSize: 16, lineHeight: 1.8, fontStyle: 'italic' }}>"{brief.story}"</p>
      </div>

      <h3 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Constraints</h3>
      <div style={{ display: 'flex', gap: 10, marginBottom: 48, flexWrap: 'wrap' }}>
        {brief.constraints.map((c, i) => (
          <span key={i} style={{ padding: '8px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#8a8078', fontSize: 13 }}>{c}</span>
        ))}
      </div>

      <h3 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Choose a Concept Direction</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {brief.concepts.map((concept, ci) => (
          <div key={ci} onClick={() => handleConceptSelect(concept)} style={{
            background: selectedConcept?.name === concept.name ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.03)',
            border: `2px solid ${selectedConcept?.name === concept.name ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
              {concept.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
            </div>
            <p style={{ color: selectedConcept?.name === concept.name ? '#f5f0e8' : '#8a8078', fontSize: 14, fontWeight: 500 }}>{concept.name}</p>
          </div>
        ))}
      </div>

      {/* Design Mode selector */}
      <h3 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginTop: 48 }}>Choose Your Design Level</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 40 }}>
        {DESIGN_MODES.map(mode => (
          <div key={mode.id} onClick={() => setDesignMode(mode.id)} style={{
            background: designMode === mode.id ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
            border: `2px solid ${designMode === mode.id ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: designMode === mode.id ? '#f5f0e8' : '#8a8078', fontSize: 15, fontWeight: 600 }}>{mode.label}</span>
              <span style={{ color: '#6a6258', fontSize: 11, background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{mode.time}</span>
            </div>
            <p style={{ color: '#6a6258', fontSize: 12, lineHeight: 1.5 }}>{mode.desc}</p>
          </div>
        ))}
      </div>

      {/* Create Your Own Palette — only for full mode */}
      {designMode === 'full' && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ height: 1, width: 60, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ color: '#5a5248', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>or</span>
            <div style={{ height: 1, width: 60, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <button onClick={handleCreateOwnPalette} style={{
            padding: '14px 32px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: 'transparent', border: '1px solid rgba(200,170,120,0.3)', color: '#c8aa78',
            fontFamily: 'Georgia, serif', letterSpacing: 0.5, transition: 'all 0.2s',
            display: 'inline-flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 18 }}>+</span> Create Your Own Palette
          </button>
          <p style={{ color: '#4a4238', fontSize: 12, marginTop: 10 }}>Start from a blank canvas — full creative freedom</p>
        </div>
      )}

      {/* ── Competition Tier Selector ── */}
      <h3 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginTop: 48 }}>Compete At</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
        {GEO_TIERS.map(tier => (
          <div key={tier.id} onClick={() => setCompetitionTier(tier.id)} style={{
            background: competitionTier === tier.id ? 'rgba(200,170,120,0.12)' : 'rgba(255,255,255,0.02)',
            border: `2px solid ${competitionTier === tier.id ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{tier.icon}</div>
            <div style={{ color: competitionTier === tier.id ? '#f5f0e8' : '#8a8078', fontSize: 13, fontWeight: 600 }}>{tier.label}</div>
            <div style={{ color: '#5a5248', fontSize: 10, marginTop: 2 }}>{tier.desc}</div>
            <div style={{ color: '#4a4238', fontSize: 10, marginTop: 4 }}>{tier.playerCount.toLocaleString()} designers</div>
          </div>
        ))}
      </div>

      {/* ── Your Match Group ── */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => setShowCompetitors(!showCompetitors)} style={{
          background: 'none', border: 'none', color: '#c8aa78', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8, padding: 0, marginBottom: showCompetitors ? 16 : 0
        }}>
          {showCompetitors ? '▾' : '▸'} Your Competitors ({MATCH_GROUP.length + 1} designers)
        </button>
        {showCompetitors && (
          <div style={{ display: 'grid', gap: 8 }}>
            {/* You */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(200,170,120,0.08)', border: '1px solid rgba(200,170,120,0.2)',
            }}>
              <span style={{ fontSize: 20 }}>{PLAYER_PROFILE.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f5f0e8', fontSize: 13, fontWeight: 600 }}>{PLAYER_PROFILE.handle} <span style={{ color: '#c8aa78', fontSize: 10, fontWeight: 400 }}>YOU</span></div>
                <div style={{ color: '#6a6258', fontSize: 11 }}>{PLAYER_PROFILE.city} · {PLAYER_PROFILE.styleBadge}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#c8aa78', fontSize: 13, fontWeight: 600 }}>★ {PLAYER_PROFILE.stats.avgStars}</div>
                <div style={{ color: '#5a5248', fontSize: 10 }}>{PLAYER_PROFILE.stats.wins}W</div>
              </div>
            </div>
            {/* Competitors */}
            {MATCH_GROUP.map((comp, ci) => (
              <div key={ci} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 20 }}>{comp.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e8e4df', fontSize: 13, fontWeight: 500 }}>
                    {comp.handle}
                    {comp.rivalry >= 3 && <span style={{ marginLeft: 6, fontSize: 9, color: '#e05050', background: 'rgba(224,80,80,0.15)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>RIVAL</span>}
                  </div>
                  <div style={{ color: '#6a6258', fontSize: 11 }}>{comp.city} · {comp.styleBadge}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#8a8078', fontSize: 13, fontWeight: 500 }}>★ {comp.stats.avgStars}</div>
                  <div style={{ color: '#5a5248', fontSize: 10 }}>{comp.stats.wins}W</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Challenge format info */}
      <div style={{
        background: 'rgba(200,170,120,0.04)', border: '1px solid rgba(200,170,120,0.15)', borderRadius: 12, padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <div style={{ color: '#c8aa78', fontSize: 13, fontWeight: 600 }}>{CHALLENGE_COMPETITION.format}</div>
          <div style={{ color: '#6a6258', fontSize: 11 }}>Pool of {CHALLENGE_COMPETITION.poolSize} · Category scoring (Color, Space, Vibe)</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#e8e4df', fontSize: 14, fontWeight: 600 }}>{CHALLENGE_COMPETITION.timeRemaining}</div>
          <div style={{ color: '#5a5248', fontSize: 10 }}>remaining</div>
        </div>
      </div>
    </div>
  )

  // ════════════════════ PHASE 1: PALETTE STUDIO ════════════════════
  const CuratedPaletteSelector = () => (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px' }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#f5f0e8', fontWeight: 400, marginBottom: 8 }}>Pick Your Palette</h2>
      <p style={{ color: '#6a6258', fontSize: 14, marginBottom: 40 }}>Choose a designer-curated palette for your room</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {CURATED_PALETTES.map((cp, ci) => {
          const isActive = palette.length === cp.colors.length && palette.every((c, i) => c === cp.colors[i])
          return (
            <div key={ci} onClick={() => {
              setPalette([...cp.colors])
              setSelectedMaterials(cp.materials.map(mid => MATERIALS.find(m => m.id === mid)).filter(Boolean))
            }} style={{
              background: isActive ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
              border: `2px solid ${isActive ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', height: 48, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                {cp.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>
              <p style={{ color: isActive ? '#f5f0e8' : '#8a8078', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{cp.name}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {cp.materials.map((mid, i) => {
                  const mat = MATERIALS.find(m => m.id === mid)
                  return mat ? <span key={i} style={{ fontSize: 10, color: '#5a5248', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>{mat.name}</span> : null
                })}
              </div>
              {isActive && <p style={{ color: '#c8aa78', fontSize: 11, marginTop: 10, fontWeight: 500 }}>✓ Selected</p>}
            </div>
          )
        })}
      </div>
    </div>
  )

  const PalettePhase = () => designMode !== 'full' ? <CuratedPaletteSelector /> : (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
      {/* Left: Palette workspace */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <p style={{ color: '#6a6258', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Color Story</p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#f5f0e8', fontWeight: 400, marginBottom: 32 }}>Build Your Palette</h2>

        {/* Active palette */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ color: '#8a8078', fontSize: 12 }}>{palette.length}/7 colors</span>
            {palette.length > 0 && (
              <button onClick={() => setPalette([])} style={{ background: 'none', border: 'none', color: '#5a5248', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, minHeight: 72 }}>
            {palette.map((c, i) => (
              <div key={i} style={{ position: 'relative', flex: 1 }}>
                <div style={{ height: 60, borderRadius: 10, background: c, cursor: 'pointer' }} />
                <button onClick={() => removeFromPalette(i)} style={{
                  position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
                  background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#8a8078',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10
                }}>×</button>
                <p style={{ textAlign: 'center', fontSize: 10, color: '#5a5248', marginTop: 4 }}>{c}</p>
              </div>
            ))}
            {palette.length < 7 && (
              <div style={{
                flex: 1, height: 60, borderRadius: 10, border: '2px dashed rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Plus size={16} style={{ color: '#3a3630' }} />
              </div>
            )}
          </div>
        </div>

        {/* Custom color wheel picker */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Add Custom Color</h3>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Color wheel */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const wSize = 180, rr = wSize / 2
                  const cx = e.clientX - rect.left - rr
                  const cy = e.clientY - rect.top - rr
                  const dist = Math.sqrt(cx*cx + cy*cy)
                  if (dist > rr) return
                  let angle = Math.atan2(cy, cx) + Math.PI/2
                  if (angle < 0) angle += 2 * Math.PI
                  const newH = Math.round(angle * 180 / Math.PI)
                  const newS = Math.min(100, Math.round((dist / (rr - 8)) * 100))
                  const hex = hslToHex(newH, newS, customLightness)
                  setCustomColor(hex)
                }}
                style={{
                  width: 180, height: 180, borderRadius: '50%', cursor: 'crosshair',
                  background: `radial-gradient(circle, hsl(0,0%,${customLightness}%) 0%, transparent 70%), conic-gradient(${
                    Array.from({length: 13}, (_, i) => `hsl(${i*30}, 100%, ${customLightness}%) ${i*30}deg`).join(', ')
                  })`,
                  border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                }}
              />
              {/* Cursor handle */}
              {(() => {
                const [ch, cs] = hexToHsl(customColor)
                const rr = 90, ha = ch * Math.PI / 180
                const hd = (cs / 100) * (rr - 8)
                return <div style={{
                  position: 'absolute', left: rr + hd * Math.cos(ha - Math.PI/2) - 8, top: rr + hd * Math.sin(ha - Math.PI/2) - 8,
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid white', boxShadow: '0 0 6px rgba(0,0,0,0.6)',
                  background: customColor, pointerEvents: 'none'
                }} />
              })()}
            </div>

            {/* Controls column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Lightness slider */}
              <div>
                <label style={{ color: '#6a6258', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Lightness: {customLightness}%</label>
                <div style={{ position: 'relative', height: 24, background: `linear-gradient(to right, #000, hsl(${hexToHsl(customColor)[0]},100%,50%), #fff)`, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input type="range" min="5" max="95" value={customLightness}
                    onChange={e => {
                      const newL = parseInt(e.target.value)
                      setCustomLightness(newL)
                      const [ch, cs] = hexToHsl(customColor)
                      setCustomColor(hslToHex(ch, cs, newL))
                    }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
                  <div style={{
                    position: 'absolute', top: 2, left: `calc(${(customLightness - 5) / 90 * 100}% - 10px)`,
                    width: 20, height: 20, borderRadius: '50%', background: customColor,
                    border: '2px solid white', boxShadow: '0 0 4px rgba(0,0,0,0.5)', pointerEvents: 'none'
                  }} />
                </div>
              </div>

              {/* Preview swatch + hex */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: customColor, border: '2px solid rgba(255,255,255,0.12)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
                <input type="text" value={customColor}
                  onChange={e => {
                    const v = e.target.value
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                      setCustomColor(v)
                      setCustomLightness(hexToHsl(v)[2])
                    }
                  }}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', color: '#e8e4df', fontSize: 13, fontFamily: 'monospace', width: 90 }} />
              </div>

              {/* Add button */}
              <button onClick={() => addToPalette(customColor)} style={{
                padding: '10px 20px', borderRadius: 8, background: 'rgba(200,170,120,0.12)', border: '1px solid rgba(200,170,120,0.3)',
                color: '#c8aa78', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
              }}>
                <Plus size={14} /> Add to Palette
              </button>
            </div>
          </div>
        </div>

        {/* Curated swatches */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Curated Swatches</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['#E8D5B7','#2C3E50','#C1440E','#5B7553','#8B4513','#87CEEB','#F4ECD8','#D4A574','#1a1a2e','#E8C07D','#2F4F4F','#C8AA78','#4A4A48','#8B6F47','#F5F0E8'].map((c, i) => (
              <div key={i} onClick={() => addToPalette(c)} style={{
                width: 36, height: 36, borderRadius: 8, background: c, cursor: 'pointer',
                border: palette.includes(c) ? '2px solid #f5f0e8' : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.15s', opacity: palette.includes(c) ? 0.5 : 1
              }} title={c} />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Material Board */}
      <div style={{ width: 360, borderLeft: '1px solid rgba(255,255,255,0.06)', padding: 28, overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
        <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Material Board</p>
        <p style={{ color: '#6a6258', fontSize: 13, marginBottom: 20 }}>Select 2–5 finishes</p>

        {/* Selected materials strip */}
        {selectedMaterials.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {selectedMaterials.map(m => (
              <div key={m.id} onClick={() => toggleMaterial(m)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px', borderRadius: 20,
                background: 'rgba(200,170,120,0.1)', border: '1px solid rgba(200,170,120,0.25)', cursor: 'pointer'
              }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color }} />
                <span style={{ fontSize: 11, color: '#c8aa78' }}>{m.name}</span>
                <X size={10} style={{ color: '#8a8078' }} />
              </div>
            ))}
          </div>
        )}

        {/* Material type filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all','wood','stone','metal','textile','ceramic'].map(t => (
            <button key={t} onClick={() => setMaterialFilter(t)} style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 11, border: 'none', cursor: 'pointer',
              background: materialFilter === t ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.04)',
              color: materialFilter === t ? '#c8aa78' : '#6a6258', textTransform: 'capitalize'
            }}>{t}</button>
          ))}
        </div>

        {/* Material swatches grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filteredMaterials.map(m => {
            const isSelected = selectedMaterials.find(s => s.id === m.id)
            const isLocked = m.tier === 'studio-pro' && PLAYER_TIER === 'member'
            return (
              <div key={m.id} onClick={() => toggleMaterial(m)} style={{
                background: isSelected ? 'rgba(200,170,120,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? 'rgba(200,170,120,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10, padding: 12, cursor: isLocked ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                opacity: isLocked ? 0.45 : 1, position: 'relative'
              }}>
                {isLocked && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(200,170,120,0.2)', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: '#c8aa78', fontWeight: 600, letterSpacing: 0.5, zIndex: 2 }}>
                    PRO
                  </div>
                )}
                <div style={{ height: 48, borderRadius: 6, background: m.color, marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
                  {m.pattern === 'grain' && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent, rgba(0,0,0,0.05) 2px, transparent 4px)' }} />}
                  {m.pattern === 'vein' && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }} />}
                  {m.pattern === 'weave' && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, rgba(0,0,0,0.03) 1px, transparent 2px)' }} />}
                  {m.pattern === 'plush' && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />}
                  {m.pattern === 'nub' && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, rgba(0,0,0,0.02) 1px, transparent 3px), repeating-linear-gradient(90deg, transparent, rgba(0,0,0,0.02) 1px, transparent 3px)' }} />}
                  {m.pattern === 'smooth' && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)' }} />}
                  {m.pattern === 'glaze' && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />}
                  {m.pattern === 'patina' && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(120deg, transparent, rgba(0,0,0,0.04) 3px, transparent 6px)' }} />}
                  {isLocked && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔒</div>}
                </div>
                <p style={{ fontSize: 12, color: isSelected ? '#c8aa78' : '#8a8078', fontWeight: 500 }}>{m.name}</p>
                <p style={{ fontSize: 10, color: '#5a5248', textTransform: 'capitalize' }}>{m.type}{isLocked ? ' · Studio Pro' : ''}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ════════════════════ PHASE 2: DESIGN ════════════════════

  // Quick Style — auto-furnish on first render
  // Build placedItems from slotChoices + layout
  const buildItemsFromSlots = (layout) => {
    return layout.slots.map((slot, i) => {
      const fid = slotChoices[i] || slot.defaultId
      const furn = ALL_FURNITURE.find(f => f.id === fid)
      if (!furn) return null
      return { ...furn, x: slot.x, y: slot.y, rotation: slot.rotation, instanceId: 900000 + i }
    }).filter(Boolean)
  }

  // Get furniture options for a slot type (member tier only)
  const getSlotOptions = (slotType) => {
    return ALL_FURNITURE.filter(f => f.type === slotType && (!f.tier || f.tier === 'member'))
  }

  // Shared slot-based room plan with furniture picker
  const SlotDesignPhase = ({ layout }) => {
    const filledCount = layout.slots.filter((_, i) => slotChoices[i]).length
    const allFilled = filledCount === layout.slots.length

    // Sync placedItems whenever slotChoices change
    const items = buildItemsFromSlots(layout)
    if (items.length > 0 && (placedItems.length === 0 || JSON.stringify(items.map(i=>i.id+'-'+(slotChoices[items.indexOf(i)]||''))) !== JSON.stringify(placedItems.map(i=>i.id+'-'+i.instanceId)))) {
      setTimeout(() => setPlacedItems(items), 0)
    }

    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Left: Plan view with clickable slots */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c0c' }}>
          <svg viewBox="0 0 700 550" style={{ width: '90%', height: '90%', maxWidth: '100%' }} preserveAspectRatio="xMidYMid meet">
            <rect width="700" height="550" fill="#0c0c0c" />
            <rect x="60" y="60" width="540" height="400" fill="rgba(200,170,120,0.03)" stroke="#c8aa78" strokeWidth="3" />
            <rect x="280" y="60" width="80" height="16" fill="rgba(200,170,120,0.15)" stroke="#c8aa78" strokeWidth="1.5" />
            <text x="320" y="52" textAnchor="middle" fill="#c8aa78" fontSize="14" fontWeight="500">Fireplace</text>
            <line x1="60" y1="140" x2="60" y2="300" stroke="#87CEEB" strokeWidth="5" opacity="0.6" />
            <text x="330" y="530" textAnchor="middle" fill="#6a6258" fontSize="12" letterSpacing="3">{brief.room} · {brief.sqft} SQ FT</text>

            {layout.slots.map((slot, i) => {
              const fid = slotChoices[i] || slot.defaultId
              const furn = ALL_FURNITURE.find(f => f.id === fid)
              const sw = (furn?.w || slot.w) * INCH_TO_SVG
              const sd = ((furn?.d || slot.d) || 20) * INCH_TO_SVG
              const cx = slot.x + sw/2, cy = slot.y + sd/2
              const isActive = activeSlot === i
              const hasChoice = !!slotChoices[i]
              return (
                <g key={i} onClick={() => setActiveSlot(isActive ? null : i)}
                  transform={`rotate(${slot.rotation} ${cx} ${cy})`} style={{ cursor: 'pointer' }}>
                  <rect x={slot.x} y={slot.y} width={sw} height={sd} rx="4"
                    fill={hasChoice ? (palette[0]||'#c8aa78') : 'rgba(255,255,255,0.04)'}
                    fillOpacity={hasChoice ? 0.3 : 1}
                    stroke={isActive ? '#f5f0e8' : hasChoice ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={hasChoice ? 'none' : '6 3'} />
                  <text x={cx} y={cy - 2} textAnchor="middle" fill={hasChoice ? '#c8aa78' : '#6a6258'} fontSize={sw > 80 ? 11 : 9} fontWeight="500" pointerEvents="none">
                    {furn?.name || slot.label}
                  </text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill="#5a5248" fontSize="8" pointerEvents="none">
                    {hasChoice ? `${furn.w}"×${furn.d}"` : `Tap to choose ${slot.slotType}`}
                  </text>
                  {isActive && <rect x={slot.x - 2} y={slot.y - 2} width={sw + 4} height={sd + 4} rx="6" fill="none" stroke="#c8aa78" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Right: Furniture picker for active slot */}
        <div style={{ width: 320, background: '#111', borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '24px 20px' }}>
          <h3 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
            {designMode === 'quick' ? 'Quick Style' : 'Layout + Style'}
          </h3>
          <p style={{ color: '#6a6258', fontSize: 12, marginBottom: 20 }}>{filledCount} of {layout.slots.length} pieces selected</p>

          {/* Slot list */}
          {activeSlot === null ? (
            <div>
              <p style={{ color: '#8a8078', fontSize: 13, marginBottom: 20 }}>Tap a slot on the plan to choose furniture</p>
              {layout.slots.map((slot, i) => {
                const fid = slotChoices[i]
                const furn = fid ? ALL_FURNITURE.find(f => f.id === fid) : null
                return (
                  <div key={i} onClick={() => setActiveSlot(i)} style={{
                    padding: 14, marginBottom: 8, borderRadius: 10, cursor: 'pointer',
                    background: furn ? 'rgba(200,170,120,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${furn ? 'rgba(200,170,120,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: furn ? '#e8e4df' : '#6a6258', fontSize: 13, fontWeight: 500 }}>
                        {furn ? furn.name : slot.label}
                      </span>
                      <span style={{ color: furn ? '#c8aa78' : '#5a5248', fontSize: 11 }}>
                        {furn ? '✓' : slot.slotType}
                      </span>
                    </div>
                  </div>
                )
              })}

              {allFilled && !quickReviewed && (
                <button onClick={() => { setQuickReviewed(true); setPlacedItems(buildItemsFromSlots(layout)) }} style={{
                  marginTop: 20, width: '100%', padding: '14px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  background: 'rgba(200,170,120,0.15)', border: '1px solid rgba(200,170,120,0.4)', color: '#c8aa78',
                  fontFamily: 'Georgia, serif'
                }}>All Set — Continue →</button>
              )}
              {quickReviewed && <p style={{ color: '#c8aa78', fontSize: 12, marginTop: 16, textAlign: 'center', fontWeight: 500 }}>✓ Ready — click Next</p>}
            </div>
          ) : (
            <div>
              <button onClick={() => setActiveSlot(null)} style={{ background: 'none', border: 'none', color: '#6a6258', fontSize: 12, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Back to slots</button>
              <h4 style={{ color: '#f5f0e8', fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{layout.slots[activeSlot].label}</h4>
              <p style={{ color: '#6a6258', fontSize: 12, marginBottom: 16 }}>Choose a {layout.slots[activeSlot].slotType.toLowerCase()}</p>

              {getSlotOptions(layout.slots[activeSlot].slotType).map(furn => {
                const isChosen = slotChoices[activeSlot] === furn.id
                return (
                  <div key={furn.id} onClick={() => {
                    setSlotChoices({ ...slotChoices, [activeSlot]: furn.id })
                    // Auto-advance to next empty slot
                    const nextEmpty = layout.slots.findIndex((_, ni) => ni > activeSlot && !slotChoices[ni] && ni !== activeSlot)
                    setTimeout(() => setActiveSlot(nextEmpty >= 0 ? nextEmpty : null), 300)
                  }} style={{
                    padding: 16, marginBottom: 10, borderRadius: 12, cursor: 'pointer',
                    background: isChosen ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${isChosen ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ color: '#e8e4df', fontSize: 14, fontWeight: 500 }}>{furn.name}</span>
                      {isChosen && <span style={{ color: '#c8aa78', fontSize: 12 }}>✓</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5a5248', fontSize: 11 }}>{furn.w}"×{furn.d}" · {furn.style}</span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {furn.colors.slice(0,4).map((c, ci) => <div key={ci} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.08)' }} />)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const QuickDesignPhase = () => <SlotDesignPhase layout={PRE_LAYOUTS[0]} />

  // Layout + Style — pick layout first, then fill slots
  const LayoutPickerPhase = () => {
    if (selectedLayout !== null) {
      return <SlotDesignPhase layout={PRE_LAYOUTS[selectedLayout]} />
    }
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#f5f0e8', fontWeight: 400, marginBottom: 8 }}>Choose Your Layout</h2>
        <p style={{ color: '#6a6258', fontSize: 14, marginBottom: 40 }}>Pick a furniture arrangement, then select your pieces</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {PRE_LAYOUTS.map((layout, li) => (
            <div key={li} onClick={() => setSelectedLayout(li)} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '2px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <svg viewBox="0 0 700 550" style={{ width: '100%', marginBottom: 14 }} preserveAspectRatio="xMidYMid meet">
                <rect width="700" height="550" fill="#0a0a0a" />
                <rect x="60" y="60" width="540" height="400" fill="rgba(200,170,120,0.03)" stroke="#c8aa78" strokeWidth="3" />
                {layout.slots.map((slot, i) => {
                  const sw = slot.w * 2.25, sd = (slot.d||20) * 2.25
                  return <rect key={i} x={slot.x} y={slot.y} width={sw} height={sd} rx="3" fill="rgba(200,170,120,0.15)" stroke="rgba(200,170,120,0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
                })}
              </svg>
              <p style={{ color: '#e8e4df', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{layout.name}</p>
              <p style={{ color: '#6a6258', fontSize: 12 }}>{layout.desc}</p>
              <p style={{ color: '#5a5248', fontSize: 11, marginTop: 6 }}>{layout.slots.length} pieces to fill</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const RoomPlanPhase = () => (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
      {/* Left: Floor plan / 3D view */}
      <div style={{ flex: 1, position: 'relative', background: '#0c0c0c' }}>
        {/* View toggle */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 4, zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 4 }}>
          <button onClick={() => setViewMode('plan')} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
            background: viewMode === 'plan' ? 'rgba(200,170,120,0.2)' : 'transparent', color: viewMode === 'plan' ? '#c8aa78' : '#6a6258'
          }}>Plan View</button>
          <button onClick={() => setViewMode('3d')} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
            background: viewMode === '3d' ? 'rgba(200,170,120,0.2)' : 'transparent', color: viewMode === '3d' ? '#c8aa78' : '#6a6258'
          }}>3D View</button>
        </div>

        {/* Time of day toggle */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 4, zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 4 }}>
          {[{ id: 'day', icon: Sun }, { id: 'sunset', icon: Sunset }, { id: 'night', icon: Moon }].map(t => (
            <button key={t.id} onClick={() => setTimeOfDay(t.id)} style={{
              padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: timeOfDay === t.id ? 'rgba(200,170,120,0.2)' : 'transparent',
              color: timeOfDay === t.id ? '#c8aa78' : '#5a5248', display: 'flex'
            }}><t.icon size={14} /></button>
          ))}
        </div>

        {/* The room canvas */}
        {viewMode === 'plan' ? (
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Scalable floor plan SVG */}
            <svg ref={svgRef} viewBox="0 0 700 550" style={{ width: '95%', height: '95%', maxWidth: '100%', maxHeight: '100%', touchAction: 'none' }} preserveAspectRatio="xMidYMid meet"
              onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
              onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}>
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(200,170,120,0.08)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="700" height="550" fill="url(#grid)" onClick={() => setSelectedItem(null)} />

              {/* Room zones (subtle guides for furniture placement) */}
              <rect x="120" y="200" width="360" height="200" rx="8" fill="rgba(200,170,120,0.02)" stroke="rgba(200,170,120,0.08)" strokeWidth="1" strokeDasharray="8 4" />
              <text x="300" y="395" textAnchor="middle" fill="rgba(200,170,120,0.12)" fontSize="10" letterSpacing="3">SEATING ZONE</text>
              <rect x="200" y="66" width="240" height="80" rx="6" fill="rgba(135,206,235,0.02)" stroke="rgba(135,206,235,0.08)" strokeWidth="1" strokeDasharray="6 4" />
              <text x="320" y="135" textAnchor="middle" fill="rgba(135,206,235,0.12)" fontSize="10" letterSpacing="3">FOCAL WALL</text>
              <rect x="500" y="340" width="90" height="110" rx="6" fill="rgba(200,170,120,0.02)" stroke="rgba(200,170,120,0.06)" strokeWidth="1" strokeDasharray="6 4" />
              <text x="545" y="440" textAnchor="middle" fill="rgba(200,170,120,0.10)" fontSize="8" letterSpacing="2">ENTRY</text>

              {/* Room outline */}
              <rect x="60" y="60" width="540" height="400" fill="rgba(200,170,120,0.03)" stroke="#c8aa78" strokeWidth="3" />

              {/* Fireplace */}
              <rect x="280" y="60" width="80" height="16" fill="rgba(200,170,120,0.15)" stroke="#c8aa78" strokeWidth="1.5" />
              <text x="320" y="52" textAnchor="middle" fill="#c8aa78" fontSize="14" fontWeight="500">Fireplace</text>

              {/* Windows */}
              <line x1="60" y1="140" x2="60" y2="300" stroke="#87CEEB" strokeWidth="5" opacity="0.6" />
              <text x="44" y="220" textAnchor="middle" fill="#87CEEB" fontSize="13" fontWeight="400" transform="rotate(-90 44 220)">Window</text>
              <line x1="60" y1="340" x2="60" y2="420" stroke="#87CEEB" strokeWidth="5" opacity="0.6" />

              {/* Door */}
              <path d="M 580 360 Q 580 420, 620 420" fill="none" stroke="rgba(200,170,120,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="580" y1="360" x2="580" y2="420" stroke="#c8aa78" strokeWidth="2.5" />
              <text x="620" y="395" fill="#c8aa78" fontSize="13" fontWeight="400">Entry</text>

              {/* Dimensions */}
              <line x1="60" y1="485" x2="600" y2="485" stroke="rgba(200,170,120,0.3)" strokeWidth="1" />
              <line x1="60" y1="480" x2="60" y2="490" stroke="rgba(200,170,120,0.3)" strokeWidth="1" />
              <line x1="600" y1="480" x2="600" y2="490" stroke="rgba(200,170,120,0.3)" strokeWidth="1" />
              <text x="330" y="505" textAnchor="middle" fill="#e8e4df" fontSize="15" fontWeight="500">20&apos; - 0&quot;</text>
              <line x1="625" y1="60" x2="625" y2="460" stroke="rgba(200,170,120,0.3)" strokeWidth="1" />
              <line x1="620" y1="60" x2="630" y2="60" stroke="rgba(200,170,120,0.3)" strokeWidth="1" />
              <line x1="620" y1="460" x2="630" y2="460" stroke="rgba(200,170,120,0.3)" strokeWidth="1" />
              <text x="650" y="265" textAnchor="middle" fill="#e8e4df" fontSize="15" fontWeight="500" transform="rotate(90 650 265)">16&apos; - 0&quot;</text>

              <text x="330" y="530" textAnchor="middle" fill="#6a6258" fontSize="12" letterSpacing="3">{brief.room} · {brief.sqft} SQ FT</text>

              {/* Draggable, rotatable furniture */}
              {placedItems.map(item => {
                const svgW = item.w * INCH_TO_SVG
                const svgD = (item.d || 20) * INCH_TO_SVG
                const rot = item.rotation || 0
                const cx = item.x + svgW/2
                const cy = item.y + svgD/2
                const isSel = selectedItem === item.instanceId
                return (
                <g key={item.instanceId} transform={`rotate(${rot} ${cx} ${cy})`}
                  onMouseDown={e => handleDragStart(e, item)} onTouchStart={e => handleDragStart(e, item)}
                  style={{ cursor: dragging?.instanceId === item.instanceId ? 'grabbing' : 'grab' }}>
                  <rect x={item.x} y={item.y} width={svgW} height={svgD} rx="4"
                    fill={palette[0] || '#c8aa78'} fillOpacity="0.25"
                    stroke={isSel ? '#c8aa78' : 'rgba(200,170,120,0.5)'}
                    strokeWidth={isSel ? 2.5 : 1.5} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="#c8aa78" fontSize={svgW > 80 ? 11 : 9} fontWeight="500" pointerEvents="none">{item.name}</text>
                  <text x={cx} y={cy + 16} textAnchor="middle" fill="#6a6258" fontSize="8" pointerEvents="none">{item.w}"×{item.d}"</text>
                  {/* Rotation handle — visible when selected */}
                  {isSel && (
                    <g>
                      {/* Rotate CW button */}
                      <circle cx={item.x + svgW + 12} cy={item.y - 12} r="10" fill="rgba(200,170,120,0.3)" stroke="#c8aa78" strokeWidth="1"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={e => { e.stopPropagation(); rotateItem(item.instanceId, 15) }}
                        onTouchStart={e => { e.stopPropagation(); rotateItem(item.instanceId, 15) }} />
                      <text x={item.x + svgW + 12} y={item.y - 8} textAnchor="middle" fill="#c8aa78" fontSize="11" fontWeight="bold" pointerEvents="none">↻</text>
                      {/* Rotate CCW button */}
                      <circle cx={item.x - 12} cy={item.y - 12} r="10" fill="rgba(200,170,120,0.3)" stroke="#c8aa78" strokeWidth="1"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={e => { e.stopPropagation(); rotateItem(item.instanceId, -15) }}
                        onTouchStart={e => { e.stopPropagation(); rotateItem(item.instanceId, -15) }} />
                      <text x={item.x - 12} y={item.y - 8} textAnchor="middle" fill="#c8aa78" fontSize="11" fontWeight="bold" pointerEvents="none">↺</text>
                      {/* Delete button */}
                      <circle cx={cx} cy={item.y - 12} r="10" fill="rgba(200,50,50,0.3)" stroke="#e05050" strokeWidth="1"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={e => { e.stopPropagation(); removeItem(item.instanceId) }}
                        onTouchStart={e => { e.stopPropagation(); removeItem(item.instanceId) }} />
                      <text x={cx} y={item.y - 8} textAnchor="middle" fill="#e05050" fontSize="12" fontWeight="bold" pointerEvents="none">×</text>
                      {/* Rotation indicator */}
                      <text x={cx} y={item.y + svgD + 16} textAnchor="middle" fill="#6a6258" fontSize="9" pointerEvents="none">{rot}°</text>
                    </g>
                  )}
                </g>
                )
              })}
            </svg>

            {/* Palette preview strip at bottom */}
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, background: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 10 }}>
              {palette.map((c, i) => <div key={i} style={{ width: 24, height: 24, borderRadius: 5, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />)}
            </div>
          </div>
        ) : (
          <RoomPreview3D placedItems={placedItems} palette={palette} timeOfDay={timeOfDay} INCH_TO_SVG={INCH_TO_SVG} ROOM_ORIGIN_X={ROOM_ORIGIN_X} ROOM_ORIGIN_Y={ROOM_ORIGIN_Y} ROOM_W={ROOM_W} ROOM_H={ROOM_H} />
        )}
      </div>

      {/* Right: Furniture catalog + competition sidebar */}
      <div style={{ width: 340, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', minHeight: 0, overflow: 'hidden' }}>
        {/* ── Live Design Score ── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(200,170,120,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#c8aa78', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Design Score</span>
            <span style={{ color: '#5a5248', fontSize: 10 }}>{placedItems.length} items placed</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Color', value: Math.min(5, palette.length >= 3 ? 2 + Math.min(3, Math.floor(palette.length * 0.4)) : palette.length), max: 5 },
              { label: 'Space', value: Math.min(5, Math.floor(placedItems.length * 0.6)), max: 5 },
              { label: 'Vibe', value: Math.min(5, selectedMaterials.length + (placedItems.length > 3 ? 1 : 0)), max: 5 },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: s.value >= 4 ? '#c8aa78' : s.value >= 2 ? '#8a8078' : '#3a3630', fontFamily: 'Georgia, serif' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#5a5248', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.value / s.max) * 100}%`, background: s.value >= 4 ? '#c8aa78' : '#5a5248', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Competitors peek ── */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setShowCompetitors(!showCompetitors)} style={{
            background: 'none', border: 'none', color: '#6a6258', cursor: 'pointer', fontSize: 11, padding: 0,
            display: 'flex', alignItems: 'center', gap: 6, width: '100%'
          }}>
            <span>{showCompetitors ? '▾' : '▸'}</span>
            <span>Competing against {MATCH_GROUP.length} designers</span>
            <span style={{ marginLeft: 'auto', color: '#c8aa78', fontSize: 10 }}>{GEO_TIERS.find(t => t.id === competitionTier)?.icon} {GEO_TIERS.find(t => t.id === competitionTier)?.label}</span>
          </button>
          {showCompetitors && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MATCH_GROUP.slice(0, 4).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span>{c.avatar}</span>
                  <span style={{ color: '#8a8078', flex: 1 }}>{c.handle}</span>
                  {c.rivalry >= 3 && <span style={{ color: '#e05050', fontSize: 8, fontWeight: 700 }}>RIVAL</span>}
                  <span style={{ color: '#5a5248' }}>★{c.stats.avgStars}</span>
                </div>
              ))}
              {MATCH_GROUP.length > 4 && <span style={{ color: '#4a4238', fontSize: 10 }}>+{MATCH_GROUP.length - 4} more</span>}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px 0' }}>
          <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Furniture & Objects</p>
          <button onClick={() => openProductBrowser('room-plan', 'all')} style={{
            width: '100%', padding: '10px 16px', marginBottom: 12, borderRadius: 10, border: '1px solid rgba(200,170,120,0.3)',
            background: 'rgba(200,170,120,0.08)', color: '#c8aa78', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
          }}>
            <Eye size={14} /> Browse Full Catalog
          </button>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
            {catalogTypes.map(t => (
              <button key={t} onClick={() => setCatalogFilter(t)} style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 11, border: 'none', cursor: 'pointer',
                background: catalogFilter === t ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.04)',
                color: catalogFilter === t ? '#c8aa78' : '#6a6258'
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 20px 20px' }}>
          {filteredFurniture.map(item => {
            const fLocked = item.tier === 'studio-pro' && PLAYER_TIER === 'member'
            const thumbUrl = item.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(item.imageUrl)}&w=120&h=90` : null
            return (
            <div key={item.id} onClick={() => addFurniture(item)} style={{
              padding: 10, marginBottom: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 10, cursor: fLocked ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              opacity: fLocked ? 0.45 : 1, display: 'flex', gap: 10, alignItems: 'center'
            }} onMouseOver={e => { if (!fLocked) e.currentTarget.style.borderColor = 'rgba(200,170,120,0.25)' }}
               onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
              {thumbUrl ? (
                <img src={thumbUrl} alt={item.name} style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', background: '#1a1a1a', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 6, background: 'rgba(200,170,120,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} style={{ color: '#5a5248' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: '#e8e4df', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fLocked && '🔒 '}{item.name}
                  </span>
                  {fLocked && <span style={{ fontSize: 9, color: '#c8aa78', background: 'rgba(200,170,120,0.2)', borderRadius: 4, padding: '2px 6px', fontWeight: 600, flexShrink: 0 }}>PRO</span>}
                </div>
                {item.brand && <div style={{ color: '#8a8078', fontSize: 10, marginBottom: 2 }}>{item.brand}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#5a5248', fontSize: 10 }}>{item.w}"×{item.d}"</span>
                  {item.price && <span style={{ color: '#c8aa78', fontSize: 10 }}>{formatPrice(item.price)}</span>}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ════════════════════ PHASE 3: ELEVATIONS (Interactive) ════════════════════
  const ElevationsPhase = () => {
    const wallHeight = 108 // 9'-0" ceiling in inches
    const roomWidthIn = 240 // 20' in inches
    const roomDepthIn = 192 // 16' in inches
    const viewScale = 0.65 // px per inch for elevation drawing
    const guideColor = '#c8aa78'
    const guideColorFaint = 'rgba(200,170,120,0.25)'

    const [activeWall, setActiveWall] = useState('north')
    const [activeTool, setActiveTool] = useState(null) // null | 'paint' | 'art' | 'sconce' | 'drapery' | 'light'
    const [hovering, setHovering] = useState(null) // { x, y } for placement preview
    const [openAccordion, setOpenAccordion] = useState('paint') // which accordion section is open
    const [showElevGrid, setShowElevGrid] = useState(false) // 6-inch grid overlay

    const WALL_INFO = {
      north: { len: roomWidthIn, hasWindow: false, hasFireplace: true, hasDoor: false },
      south: { len: roomWidthIn, hasWindow: false, hasFireplace: false, hasDoor: false },
      west:  { len: roomDepthIn, hasWindow: true, hasFireplace: false, hasDoor: false },
      east:  { len: roomDepthIn, hasWindow: false, hasFireplace: false, hasDoor: true },
    }

    const PAINT_SWATCHES = [
      { id: 'warm-white', name: 'Warm White', hex: '#f5f0e8' },
      { id: 'linen', name: 'Linen', hex: '#e8e0d4' },
      { id: 'sage', name: 'Sage', hex: '#b8c4a8' },
      { id: 'slate-blue', name: 'Slate Blue', hex: '#8a9bae' },
      { id: 'charcoal', name: 'Charcoal', hex: '#3a3a3a' },
      { id: 'terracotta', name: 'Terracotta', hex: '#c67b5c' },
      { id: 'navy', name: 'Navy', hex: '#2c3e50' },
      { id: 'blush', name: 'Blush', hex: '#e8c4c4' },
      { id: 'olive', name: 'Olive', hex: '#6b7c54' },
      { id: 'cream', name: 'Cream', hex: '#f5f1e6' },
    ]

    const ART_OPTIONS = [
      { id: 'abstract-lg', name: 'Abstract Canvas', w: 48, h: 36, mountH: 60 },
      { id: 'portrait', name: 'Portrait', w: 24, h: 36, mountH: 58 },
      { id: 'landscape', name: 'Landscape Photo', w: 40, h: 28, mountH: 62 },
      { id: 'mirror-round', name: 'Round Mirror', w: 30, h: 30, mountH: 60 },
      { id: 'gallery-set', name: 'Gallery Wall (3pc)', w: 60, h: 36, mountH: 58 },
      { id: 'tapestry', name: 'Woven Tapestry', w: 36, h: 48, mountH: 54 },
    ]

    const SCONCE_OPTIONS = [
      { id: 'modern-arm', name: 'Modern Arm Sconce', w: 6, h: 14, mountH: 66 },
      { id: 'candle-sconce', name: 'Candle Sconce', w: 5, h: 12, mountH: 64 },
      { id: 'shade-sconce', name: 'Shade Sconce', w: 8, h: 16, mountH: 66 },
      { id: 'globe-sconce', name: 'Globe Sconce', w: 7, h: 10, mountH: 68 },
    ]

    const TREATMENT_OPTIONS = [
      { id: 'none', name: 'None' },
      { id: 'drapes', name: 'Floor-length Drapes' },
      { id: 'romans', name: 'Roman Shades' },
      { id: 'sheers', name: 'Sheer Curtains' },
      { id: 'layered', name: 'Layered (Sheers + Drapes)' },
    ]

    const formatDim = (inches) => {
      const ft = Math.floor(inches / 12)
      const inc = Math.round(inches % 12)
      return inc === 0 ? `${ft}'-0"` : `${ft}'-${inc}"`
    }

    // Items from floor plan near this wall
    const itemsOnWall = (wallSide) => {
      return placedItems.filter(item => {
        const cx = (item.x - 60) / INCH_TO_SVG
        const cy = (item.y - 60) / INCH_TO_SVG
        const thresh = 36
        if (wallSide === 'north') return cy < thresh
        if (wallSide === 'south') return cy > (roomDepthIn - thresh)
        if (wallSide === 'west') return cx < thresh
        if (wallSide === 'east') return cx > (roomWidthIn - thresh)
        return false
      })
    }

    const addDecorItem = (wallId, item) => {
      setWallDecor(prev => ({
        ...prev,
        [wallId]: [...prev[wallId], { ...item, id: Date.now() + Math.random() }]
      }))
    }

    const removeDecorItem = (wallId, itemId) => {
      setWallDecor(prev => ({
        ...prev,
        [wallId]: prev[wallId].filter(d => d.id !== itemId)
      }))
    }

    const handleWallClick = (e, wallId, wallLen) => {
      if (!activeTool || activeTool === 'paint') return
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const svgX = (e.clientX - rect.left) / rect.width
      const posInches = svgX * wallLen

      if (activeTool === 'art') {
        const art = ART_OPTIONS[0] // Default to first, user picks from panel
        addDecorItem(wallId, { type: 'art', subtype: art.id, name: art.name, x: posInches, y: art.mountH, w: art.w, h: art.h })
      } else if (activeTool === 'sconce') {
        const sconce = SCONCE_OPTIONS[0]
        addDecorItem(wallId, { type: 'sconce', subtype: sconce.id, name: sconce.name, x: posInches, y: sconce.mountH, w: sconce.w, h: sconce.h })
      } else if (activeTool === 'light') {
        addDecorItem(wallId, { type: 'accent-light', name: 'Picture Light', x: posInches, y: 78, w: 18, h: 4 })
      }
      setActiveTool(null)
    }

    const info = WALL_INFO[activeWall]
    const w = info.len * viewScale
    const h = wallHeight * viewScale
    const svgW = w + 100
    const svgH = h + 100
    const currentDecor = wallDecor[activeWall] || []
    const furnitureOnWall = itemsOnWall(activeWall)

    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Left: Wall elevation canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0c0c0c' }}>
          {/* Wall selector tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {Object.keys(WALL_INFO).map(wId => (
              <button key={wId} onClick={() => setActiveWall(wId)} style={{
                flex: 1, padding: '12px 16px', background: activeWall === wId ? 'rgba(200,170,120,0.08)' : 'transparent',
                border: 'none', borderBottom: activeWall === wId ? '2px solid #c8aa78' : '2px solid transparent',
                color: activeWall === wId ? '#c8aa78' : '#6a6258', fontSize: 12, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 2, cursor: 'pointer',
              }}>
                {wId} Wall
              </button>
            ))}
            {/* Grid toggle */}
            <button onClick={() => setShowElevGrid(!showElevGrid)} style={{
              padding: '12px 16px', background: showElevGrid ? 'rgba(200,170,120,0.08)' : 'transparent',
              border: 'none', borderBottom: showElevGrid ? '2px solid #c8aa78' : '2px solid transparent',
              color: showElevGrid ? '#c8aa78' : '#6a6258', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }} title="Toggle 6&quot; grid">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="0" y1="4.67" x2="14" y2="4.67" /><line x1="0" y1="9.33" x2="14" y2="9.33" />
                <line x1="4.67" y1="0" x2="4.67" y2="14" /><line x1="9.33" y1="0" x2="9.33" y2="14" />
              </svg>
              6&quot; Grid
            </button>
          </div>

          {/* SVG elevation drawing */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: '100%', maxHeight: 420, cursor: activeTool && activeTool !== 'paint' ? 'crosshair' : 'default' }}
              onClick={(e) => handleWallClick(e, activeWall, info.len)}>
              {/* Wall fill with paint color */}
              <rect x="50" y="30" width={w} height={h} fill={wallPaint[activeWall]} opacity="0.3" stroke={guideColor} strokeWidth="1.5" />

              {/* 6-inch grid overlay */}
              {showElevGrid && (() => {
                const gridInch = 6
                const gridPx = gridInch * viewScale
                const majorEvery = 2 // 1-foot major lines (every 12")
                const lines = []
                // Vertical lines (along wall width)
                for (let i = 0; i <= info.len / gridInch; i++) {
                  const x = 50 + i * gridPx
                  const isMajor = i % majorEvery === 0
                  lines.push(<line key={`gv${i}`} x1={x} y1={30} x2={x} y2={h + 30}
                    stroke={isMajor ? 'rgba(200,170,120,0.3)' : 'rgba(200,170,120,0.12)'}
                    strokeWidth={isMajor ? 0.8 : 0.4} />)
                  // Foot labels on major lines
                  if (isMajor && i > 0 && i < info.len / gridInch) {
                    lines.push(<text key={`gvt${i}`} x={x} y={h + 42} textAnchor="middle"
                      fill="rgba(200,170,120,0.5)" fontSize="6">{(i * gridInch / 12)}&#39;</text>)
                  }
                }
                // Horizontal lines (along wall height)
                for (let j = 0; j <= wallHeight / gridInch; j++) {
                  const y = 30 + (wallHeight - j * gridInch) * viewScale
                  const isMajor = j % majorEvery === 0
                  lines.push(<line key={`gh${j}`} x1={50} y1={y} x2={50 + w} y2={y}
                    stroke={isMajor ? 'rgba(200,170,120,0.3)' : 'rgba(200,170,120,0.12)'}
                    strokeWidth={isMajor ? 0.8 : 0.4} />)
                  // Foot labels on major lines
                  if (isMajor && j > 0 && j < wallHeight / gridInch) {
                    lines.push(<text key={`ght${j}`} x={44} y={y + 3} textAnchor="end"
                      fill="rgba(200,170,120,0.5)" fontSize="6">{(j * gridInch / 12)}&#39;</text>)
                  }
                }
                return <g className="elevation-grid">{lines}</g>
              })()}

              {/* Floor line */}
              <line x1="30" y1={h + 30} x2={w + 70} y2={h + 30} stroke={guideColor} strokeWidth="2" />
              {/* Ceiling line */}
              <line x1="30" y1="30" x2={w + 70} y2="30" stroke={guideColor} strokeWidth="2" />

              {/* Baseboard */}
              <rect x="50" y={h + 30 - 4 * viewScale} width={w} height={4 * viewScale} fill="rgba(200,170,120,0.15)" stroke={guideColorFaint} strokeWidth="0.5" />
              {/* Crown molding */}
              <rect x="50" y="30" width={w} height={4 * viewScale} fill="rgba(200,170,120,0.1)" stroke={guideColorFaint} strokeWidth="0.5" />

              {/* Height dimension */}
              <line x1="30" y1="30" x2="30" y2={h + 30} stroke={guideColorFaint} strokeWidth="1" />
              <text x="20" y={h / 2 + 30} textAnchor="middle" fill="#8a8078" fontSize="9" transform={`rotate(-90 20 ${h / 2 + 30})`}>{formatDim(wallHeight)}</text>
              {/* Width dimension */}
              <text x={50 + w / 2} y={h + 65} textAnchor="middle" fill="#8a8078" fontSize="10">{formatDim(info.len)}</text>

              {/* Window */}
              {info.hasWindow && (
                <g>
                  <rect x={50 + w * 0.15} y={30 + 36 * viewScale} width={w * 0.35} height={44 * viewScale}
                    fill="rgba(135,206,235,0.12)" stroke="#87CEEB" strokeWidth="1.5" />
                  <line x1={50 + w * 0.15 + (w * 0.35) / 2} y1={30 + 36 * viewScale} x2={50 + w * 0.15 + (w * 0.35) / 2} y2={30 + 80 * viewScale} stroke="#87CEEB" strokeWidth="0.7" />
                  <line x1={50 + w * 0.15} y1={30 + 58 * viewScale} x2={50 + w * 0.5} y2={30 + 58 * viewScale} stroke="#87CEEB" strokeWidth="0.7" />
                  {/* Drapery / window treatment */}
                  {windowTreatments[activeWall] === 'drapes' && (
                    <g>
                      <rect x={50 + w * 0.11} y={30 + 28 * viewScale} width={w * 0.04} height={72 * viewScale} fill="rgba(200,170,120,0.25)" stroke={guideColor} strokeWidth="0.5" rx="2" />
                      <rect x={50 + w * 0.5} y={30 + 28 * viewScale} width={w * 0.04} height={72 * viewScale} fill="rgba(200,170,120,0.25)" stroke={guideColor} strokeWidth="0.5" rx="2" />
                      <line x1={50 + w * 0.11} y1={30 + 28 * viewScale} x2={50 + w * 0.54} y2={30 + 28 * viewScale} stroke={guideColor} strokeWidth="1.5" />
                      <text x={50 + w * 0.325} y={30 + 26 * viewScale} textAnchor="middle" fill={guideColor} fontSize="7">Drapes</text>
                    </g>
                  )}
                  {windowTreatments[activeWall] === 'romans' && (
                    <g>
                      <rect x={50 + w * 0.15} y={30 + 36 * viewScale} width={w * 0.35} height={12 * viewScale} fill="rgba(200,170,120,0.2)" stroke={guideColor} strokeWidth="0.5" />
                      <line x1={50 + w * 0.15} y1={30 + 40 * viewScale} x2={50 + w * 0.5} y2={30 + 40 * viewScale} stroke={guideColorFaint} strokeWidth="0.5" />
                      <line x1={50 + w * 0.15} y1={30 + 44 * viewScale} x2={50 + w * 0.5} y2={30 + 44 * viewScale} stroke={guideColorFaint} strokeWidth="0.5" />
                      <text x={50 + w * 0.325} y={30 + 34 * viewScale} textAnchor="middle" fill={guideColor} fontSize="7">Roman Shade</text>
                    </g>
                  )}
                  {windowTreatments[activeWall] === 'sheers' && (
                    <g>
                      <rect x={50 + w * 0.13} y={30 + 30 * viewScale} width={w * 0.39} height={68 * viewScale} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="3 2" />
                      <text x={50 + w * 0.325} y={30 + 28 * viewScale} textAnchor="middle" fill="#aaa" fontSize="7">Sheers</text>
                    </g>
                  )}
                  {windowTreatments[activeWall] === 'layered' && (
                    <g>
                      <rect x={50 + w * 0.13} y={30 + 30 * viewScale} width={w * 0.39} height={68 * viewScale} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
                      <rect x={50 + w * 0.10} y={30 + 28 * viewScale} width={w * 0.04} height={72 * viewScale} fill="rgba(200,170,120,0.3)" stroke={guideColor} strokeWidth="0.5" rx="2" />
                      <rect x={50 + w * 0.51} y={30 + 28 * viewScale} width={w * 0.04} height={72 * viewScale} fill="rgba(200,170,120,0.3)" stroke={guideColor} strokeWidth="0.5" rx="2" />
                      <line x1={50 + w * 0.10} y1={30 + 28 * viewScale} x2={50 + w * 0.55} y2={30 + 28 * viewScale} stroke={guideColor} strokeWidth="1.5" />
                      <text x={50 + w * 0.325} y={30 + 26 * viewScale} textAnchor="middle" fill={guideColor} fontSize="7">Layered</text>
                    </g>
                  )}
                </g>
              )}

              {/* Fireplace */}
              {info.hasFireplace && (
                <g>
                  <rect x={50 + w * 0.35} y={30 + (wallHeight - 48) * viewScale} width={w * 0.3} height={48 * viewScale} fill="rgba(200,170,120,0.08)" stroke={guideColor} strokeWidth="1.5" rx="2" />
                  <rect x={50 + w * 0.38} y={30 + (wallHeight - 42) * viewScale} width={w * 0.24} height={36 * viewScale} fill="rgba(40,20,10,0.3)" stroke={guideColorFaint} strokeWidth="1" />
                  <text x={50 + w * 0.5} y={30 + (wallHeight - 24) * viewScale} textAnchor="middle" fill={guideColor} fontSize="8">Fireplace</text>
                </g>
              )}

              {/* Door */}
              {info.hasDoor && (
                <g>
                  <rect x={50 + w * 0.75} y={30 + (wallHeight - 80) * viewScale} width={w * 0.15} height={80 * viewScale} fill="rgba(200,170,120,0.06)" stroke={guideColor} strokeWidth="1.5" />
                  <text x={50 + w * 0.825} y={30 + wallHeight * viewScale - 6} textAnchor="middle" fill={guideColor} fontSize="8">Door</text>
                </g>
              )}

              {/* Floor furniture silhouettes */}
              {furnitureOnWall.map((item, idx) => {
                const itemW = item.w * viewScale
                const itemH = Math.min(item.h || item.d || 30, 42) * viewScale
                const xPos = 50 + (w * (0.15 + idx * 0.22))
                return (
                  <g key={idx} opacity="0.6">
                    <rect x={xPos} y={30 + h - itemH} width={itemW} height={itemH} fill="rgba(200,170,120,0.1)" stroke={guideColorFaint} strokeWidth="1" rx="2" />
                    <text x={xPos + itemW / 2} y={30 + h - itemH / 2 + 3} textAnchor="middle" fill="#6a6258" fontSize="7">{item.name}</text>
                  </g>
                )
              })}

              {/* Wall decor items (art, sconces, accent lights) */}
              {currentDecor.map((item) => {
                const ix = 50 + (item.x / info.len) * w
                const iy = 30 + (wallHeight - item.y) * viewScale
                const iw = item.w * viewScale
                const ih = item.h * viewScale
                return (
                  <g key={item.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); removeDecorItem(activeWall, item.id) }}>
                    {item.type === 'art' && (
                      <>
                        <rect x={ix - iw / 2} y={iy} width={iw} height={ih} fill="rgba(180,160,130,0.15)" stroke="#c8aa78" strokeWidth="1.5" rx="1" />
                        <line x1={ix - iw / 2 + 4} y1={iy + 4} x2={ix + iw / 2 - 4} y2={iy + ih - 4} stroke="rgba(200,170,120,0.3)" strokeWidth="0.5" />
                        <line x1={ix + iw / 2 - 4} y1={iy + 4} x2={ix - iw / 2 + 4} y2={iy + ih - 4} stroke="rgba(200,170,120,0.3)" strokeWidth="0.5" />
                        <text x={ix} y={iy + ih + 8} textAnchor="middle" fill="#8a8078" fontSize="6">{item.name}</text>
                      </>
                    )}
                    {item.type === 'sconce' && (
                      <>
                        <rect x={ix - iw / 2} y={iy} width={iw} height={ih} fill="rgba(255,220,100,0.2)" stroke="#d4a017" strokeWidth="1" rx="2" />
                        <circle cx={ix} cy={iy + ih * 0.4} r={iw * 0.3} fill="rgba(255,220,100,0.4)" />
                        <text x={ix} y={iy + ih + 8} textAnchor="middle" fill="#8a8078" fontSize="6">{item.name}</text>
                      </>
                    )}
                    {item.type === 'accent-light' && (
                      <>
                        <rect x={ix - iw / 2} y={iy} width={iw} height={ih} fill="rgba(255,240,180,0.3)" stroke="#d4a017" strokeWidth="0.8" rx="1" />
                        <line x1={ix - iw / 2} y1={iy + ih} x2={ix - iw / 3} y2={iy + ih + 16} stroke="rgba(255,220,100,0.2)" strokeWidth="4" />
                        <line x1={ix + iw / 2} y1={iy + ih} x2={ix + iw / 3} y2={iy + ih + 16} stroke="rgba(255,220,100,0.2)" strokeWidth="4" />
                        <text x={ix} y={iy - 4} textAnchor="middle" fill="#8a8078" fontSize="6">Picture Light</text>
                      </>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Decor item count */}
          <div style={{ padding: '8px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#6a6258', fontSize: 11 }}>
            {currentDecor.length} items on {activeWall} wall · Click items to remove
          </div>
        </div>

        {/* Right: Tool panel — accordion style, scrollable */}
        <div style={{ width: 320, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: '#0a0a0a', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
            <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>Wall Design</p>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#f5f0e8', fontWeight: 400, margin: 0 }}>Decorate Each Wall</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 20px 20px' }}>

            {/* ── ACCORDION: Paint Color ── */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
              <button onClick={() => setOpenAccordion(openAccordion === 'paint' ? null : 'paint')} style={{
                width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: openAccordion === 'paint' ? '#c8aa78' : '#8a8078', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Paint Color</span>
                <span style={{ color: '#5a5248', fontSize: 16, transition: 'transform 0.2s', transform: openAccordion === 'paint' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </button>
              {openAccordion === 'paint' && (
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {PAINT_SWATCHES.map(sw => (
                      <button key={sw.id} onClick={(e) => { e.stopPropagation(); setWallPaint(prev => ({ ...prev, [activeWall]: sw.hex })) }} title={sw.name}
                        style={{ width: '100%', aspectRatio: '1', borderRadius: 6, background: sw.hex, border: wallPaint[activeWall] === sw.hex ? '2px solid #c8aa78' : '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── ACCORDION: Art & Mirrors ── */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
              <button onClick={() => setOpenAccordion(openAccordion === 'art' ? null : 'art')} style={{
                width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: openAccordion === 'art' ? '#c8aa78' : '#8a8078', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Art & Mirrors</span>
                <span style={{ color: '#5a5248', fontSize: 16, transition: 'transform 0.2s', transform: openAccordion === 'art' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </button>
              {openAccordion === 'art' && (
                <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => { productBrowserWallRef.current = activeWall; openProductBrowser('elevation-art', 'accessories') }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(200,170,120,0.3)', background: 'rgba(200,170,120,0.08)', color: '#c8aa78', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Eye size={14} /> Browse Art & Mirrors
                  </button>
                  {ART_OPTIONS.map(art => (
                    <button key={art.id} onClick={() => { addDecorItem(activeWall, { type: 'art', subtype: art.id, name: art.name, x: info.len * 0.5, y: art.mountH, w: art.w, h: art.h }) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 28, height: 20, background: 'rgba(200,170,120,0.15)', border: '1px solid rgba(200,170,120,0.4)', borderRadius: 2 }} />
                      <div>
                        <span style={{ color: '#f5f0e8', fontSize: 12 }}>{art.name}</span>
                        <span style={{ color: '#5a5248', fontSize: 10, display: 'block' }}>{art.w}"×{art.h}"</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── ACCORDION: Wall Sconces ── */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
              <button onClick={() => setOpenAccordion(openAccordion === 'sconces' ? null : 'sconces')} style={{
                width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: openAccordion === 'sconces' ? '#c8aa78' : '#8a8078', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Wall Sconces</span>
                <span style={{ color: '#5a5248', fontSize: 16, transition: 'transform 0.2s', transform: openAccordion === 'sconces' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </button>
              {openAccordion === 'sconces' && (
                <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => { productBrowserWallRef.current = activeWall; openProductBrowser('elevation-sconce', 'lighting') }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(200,170,120,0.3)', background: 'rgba(200,170,120,0.08)', color: '#c8aa78', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Eye size={14} /> Browse Sconces
                  </button>
                  {SCONCE_OPTIONS.map(sc => (
                    <button key={sc.id} onClick={() => { addDecorItem(activeWall, { type: 'sconce', subtype: sc.id, name: sc.name, x: info.len * 0.5, y: sc.mountH, w: sc.w, h: sc.h }) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 14, height: 20, background: 'rgba(255,220,100,0.2)', border: '1px solid rgba(212,160,23,0.5)', borderRadius: 3 }} />
                      <div>
                        <span style={{ color: '#f5f0e8', fontSize: 12 }}>{sc.name}</span>
                        <span style={{ color: '#5a5248', fontSize: 10, display: 'block' }}>{sc.w}"×{sc.h}"</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── ACCORDION: Accent Lighting ── */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
              <button onClick={() => setOpenAccordion(openAccordion === 'lighting' ? null : 'lighting')} style={{
                width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: openAccordion === 'lighting' ? '#c8aa78' : '#8a8078', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Accent Lighting</span>
                <span style={{ color: '#5a5248', fontSize: 16, transition: 'transform 0.2s', transform: openAccordion === 'lighting' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </button>
              {openAccordion === 'lighting' && (
                <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => { productBrowserWallRef.current = activeWall; openProductBrowser('elevation-light', 'lighting') }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(200,170,120,0.3)', background: 'rgba(200,170,120,0.08)', color: '#c8aa78', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Eye size={14} /> Browse Lighting
                  </button>
                  <button onClick={() => { addDecorItem(activeWall, { type: 'accent-light', name: 'Picture Light', x: info.len * 0.5, y: 78, w: 18, h: 4 }) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <div style={{ width: 28, height: 6, background: 'rgba(255,240,180,0.3)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 2 }} />
                    <div>
                      <span style={{ color: '#f5f0e8', fontSize: 12 }}>Picture Light</span>
                      <span style={{ color: '#5a5248', fontSize: 10, display: 'block' }}>18" brass · above artwork</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* ── ACCORDION: Window Treatment (only if wall has window) ── */}
            {info.hasWindow && (
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
                <button onClick={() => setOpenAccordion(openAccordion === 'window' ? null : 'window')} style={{
                  width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ color: openAccordion === 'window' ? '#c8aa78' : '#8a8078', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Window Treatment</span>
                  <span style={{ color: '#5a5248', fontSize: 16, transition: 'transform 0.2s', transform: openAccordion === 'window' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                </button>
                {openAccordion === 'window' && (
                  <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => { productBrowserWallRef.current = activeWall; openProductBrowser('elevation-drapery', 'accessories') }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(200,170,120,0.3)', background: 'rgba(200,170,120,0.08)', color: '#c8aa78', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Eye size={14} /> Browse Drapery & Textiles
                    </button>
                    {TREATMENT_OPTIONS.map(tr => (
                      <button key={tr.id} onClick={() => setWindowTreatments(prev => ({ ...prev, [activeWall]: tr.id }))}
                        style={{ padding: '8px 12px', background: windowTreatments[activeWall] === tr.id ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
                          border: windowTreatments[activeWall] === tr.id ? '1px solid rgba(200,170,120,0.4)' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8, cursor: 'pointer', color: windowTreatments[activeWall] === tr.id ? '#c8aa78' : '#8a8078', fontSize: 12, textAlign: 'left' }}>
                        {tr.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════ PHASE 4: FURNITURE SPECIFICATION ════════════════════
  const FurniturePhase = () => {
    const [specView, setSpecView] = useState('catalog') // 'catalog' | 'placed'
    const FINISH_OPTIONS = ['Natural Oak', 'Walnut Stain', 'Ebony', 'Whitewash', 'Custom COM']
    const FABRIC_OPTIONS = ['Linen Blend', 'Performance Velvet', 'Boucle', 'Leather', 'COM/COL']

    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Left: Placed items specification sheet */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#0c0c0c' }}>
          <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>Furniture Schedule</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#f5f0e8', fontWeight: 400, marginBottom: 8 }}>Specify Your Selections</h2>
          <p style={{ color: '#6a6258', fontSize: 13, marginBottom: 32 }}>Assign finishes, materials, and details to each piece. This is your FF&amp;E schedule.</p>

          {placedItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#4a4238' }}>
              <p style={{ fontSize: 14, marginBottom: 8 }}>No furniture placed yet.</p>
              <p style={{ fontSize: 12 }}>Go back to Room Plan to add furniture, then return here to specify finishes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {placedItems.map((item, idx) => (
                <div key={item.instanceId} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: 20, transition: 'border-color 0.2s'
                }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    {item.imageUrl && (
                      <img src={`/api/image-proxy?url=${encodeURIComponent(item.imageUrl)}&w=160&h=120`} alt={item.name}
                        style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', background: '#1a1a1a', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ color: '#f5f0e8', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                          {item.brand && <div style={{ color: '#8a8078', fontSize: 11, marginBottom: 2 }}>{item.brand}{item.designer ? ` — ${item.designer}` : ''}{item.collection ? ` · ${item.collection}` : ''}</div>}
                          <div style={{ color: '#6a6258', fontSize: 12 }}>{item.type} · {item.w}" W × {item.d}" D{item.h ? ` × ${item.h}" H` : ''} · Item {idx + 1}{item.price ? ` · ${formatPrice(item.price)}` : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(item.colors || []).slice(0, 4).map((c, i) => (
                            <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Finish selector */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: '#8a8078', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                      {item.type === 'Seating' ? 'Upholstery' : 'Finish'}
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(item.type === 'Seating' ? FABRIC_OPTIONS : FINISH_OPTIONS).map(opt => (
                        <button key={opt} style={{
                          padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.03)', color: '#8a8078', fontSize: 11, cursor: 'pointer'
                        }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  {/* Dimensions display */}
                  <div style={{ display: 'flex', gap: 20, color: '#5a5248', fontSize: 11 }}>
                    <span>W: {item.w}"</span>
                    <span>D: {item.d}"</span>
                    <span>Rotation: {item.rotation || 0}&deg;</span>
                    <span style={{ marginLeft: 'auto', color: '#c8aa78', fontSize: 10 }}>
                      {item.tier === 'studio-pro' ? 'PRO' : 'STANDARD'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add more furniture */}
        <div style={{ width: 320, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Add to Room</p>
            <button onClick={() => openProductBrowser('furniture-spec', 'all')} style={{
              width: '100%', padding: '10px 16px', marginBottom: 10, borderRadius: 10, border: '1px solid rgba(200,170,120,0.3)',
              background: 'rgba(200,170,120,0.08)', color: '#c8aa78', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              <Eye size={14} /> Browse Full Catalog
            </button>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {catalogTypes.map(t => (
                <button key={t} onClick={() => setCatalogFilter(t)} style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, border: 'none', cursor: 'pointer',
                  background: catalogFilter === t ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.04)',
                  color: catalogFilter === t ? '#c8aa78' : '#6a6258'
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 20px 20px' }}>
            {filteredFurniture.map(item => {
              const thumbUrl = item.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(item.imageUrl)}&w=100&h=80` : null
              return (
              <div key={item.id} onClick={() => addFurniture(item)} style={{
                padding: 10, marginBottom: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', gap: 10, alignItems: 'center'
              }}>
                {thumbUrl ? (
                  <img src={thumbUrl} alt={item.name} style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', background: '#1a1a1a', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(200,170,120,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={14} style={{ color: '#5a5248' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#e8e4df', fontSize: 12, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  {item.brand && <div style={{ color: '#8a8078', fontSize: 10, marginBottom: 2 }}>{item.brand}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#5a5248', fontSize: 10 }}>{item.w}"×{item.d}"</span>
                    {item.price && <span style={{ color: '#c8aa78', fontSize: 10 }}>{formatPrice(item.price)}</span>}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════ PHASE 5: 3D PREVIEW ════════════════════
  const Preview3DPhase = () => (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
      <div style={{ flex: 1, position: 'relative', background: '#0c0c0c' }}>
        {/* Time of day toggle */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 4, zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 4 }}>
          {[{ id: 'day', icon: Sun, label: 'Day' }, { id: 'sunset', icon: Sunset, label: 'Sunset' }, { id: 'night', icon: Moon, label: 'Night' }].map(t => (
            <button key={t.id} onClick={() => setTimeOfDay(t.id)} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: timeOfDay === t.id ? 'rgba(200,170,120,0.2)' : 'transparent',
              color: timeOfDay === t.id ? '#c8aa78' : '#5a5248', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
            }}><t.icon size={14} /> {t.label}</button>
          ))}
        </div>

        {/* Info overlay */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '10px 16px' }}>
          <div style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>3D Preview</div>
          <div style={{ color: '#8a8078', fontSize: 12 }}>{placedItems.length} pieces placed &middot; Drag to orbit &middot; Scroll to zoom</div>
        </div>

        <RoomPreview3D placedItems={placedItems} palette={palette} timeOfDay={timeOfDay} INCH_TO_SVG={INCH_TO_SVG} ROOM_ORIGIN_X={ROOM_ORIGIN_X} ROOM_ORIGIN_Y={ROOM_ORIGIN_Y} ROOM_W={ROOM_W} ROOM_H={ROOM_H} />
      </div>

      {/* Right sidebar: Design summary */}
      <div style={{ width: 300, borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '24px 20px', overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
        <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Design Summary</p>

        {/* Palette */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: '#8a8078', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Color Palette</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {palette.map((c, i) => <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />)}
          </div>
        </div>

        {/* Materials */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: '#8a8078', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Materials</p>
          {selectedMaterials.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: m.color, border: '1px solid rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#8a8078', fontSize: 12 }}>{m.name}</span>
            </div>
          ))}
        </div>

        {/* Placed items list */}
        <div>
          <p style={{ color: '#8a8078', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Furniture ({placedItems.length})</p>
          {placedItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#8a8078', fontSize: 12 }}>{item.name}</span>
              <span style={{ color: '#5a5248', fontSize: 11 }}>{item.w}"x{item.d}"</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ════════════════════ PHASE 6: AI JUDGE RESULTS ════════════════════
  const runJudging = useCallback(() => {
    if (judgeResults) return // already scored
    setJudgeAnimating(true)
    setRevealedJudges(0)
    const results = scoreWithJudges(palette, placedItems, selectedMaterials, brief)
    setJudgeResults(results)
    // Reveal judges one at a time with animation
    results.forEach((_, i) => {
      setTimeout(() => setRevealedJudges(i + 1), 800 * (i + 1))
    })
    setTimeout(() => setJudgeAnimating(false), 800 * (results.length + 1))
  }, [palette, placedItems, selectedMaterials, judgeResults, brief])

  // Auto-run judging when entering phase 6
  useEffect(() => {
    if (phase === 6) runJudging()
  }, [phase, runJudging])

  const SubmitPhase = () => (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>
      <p style={{ color: '#6a6258', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>The Judges Have Spoken</p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#f5f0e8', fontWeight: 400, marginBottom: 32 }}>AI Judge Results</h2>

      {/* ── Composite Score ── */}
      {judgeResults && revealedJudges >= judgeResults.length && (
        <div style={{ textAlign: 'center', marginBottom: 40, padding: 32, background: 'rgba(200,170,120,0.06)', border: '1px solid rgba(200,170,120,0.2)', borderRadius: 20 }}>
          <div style={{ fontSize: 11, color: '#6a6258', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>Composite Score</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 64, color: '#c8aa78', fontWeight: 400, lineHeight: 1 }}>{compositeScore(judgeResults)}</div>
          <div style={{ fontSize: 13, color: '#5a5248', marginTop: 8 }}>out of 100</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
            {['Color', 'Space', 'Vibe'].map((cat, i) => {
              const key = cat.toLowerCase()
              const avg = Math.round(judgeResults.reduce((s,r) => s + r.scores[key], 0) / judgeResults.length)
              return (
                <div key={cat} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, color: '#e8e4df', fontFamily: 'Georgia, serif' }}>{avg}</div>
                  <div style={{ fontSize: 10, color: '#5a5248', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Judge Cards (revealed one at a time) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(judgeResults || []).map((result, i) => {
          const revealed = i < revealedJudges
          return (
            <div key={result.judge.id} style={{
              background: revealed ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${revealed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
              borderRadius: 16, overflow: 'hidden',
              opacity: revealed ? 1 : 0.3,
              transform: revealed ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.6s ease-out',
            }}>
              {/* Judge header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: revealed ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{result.judge.avatar}</span>
                  <div>
                    <div style={{ color: '#f5f0e8', fontSize: 15, fontWeight: 600 }}>{result.judge.name}</div>
                    <div style={{ color: '#6a6258', fontSize: 11 }}>{result.judge.style} · {result.judge.tagline}</div>
                  </div>
                </div>
                {revealed && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: result.total >= 80 ? '#5B7553' : result.total >= 60 ? '#c8aa78' : '#a05040', fontWeight: 400 }}>{result.total}</div>
                    <div style={{ fontSize: 10, color: '#5a5248', textTransform: 'uppercase' }}>Score</div>
                  </div>
                )}
              </div>

              {/* Score breakdown + critique */}
              {revealed && (
                <div style={{ padding: '16px 24px 20px' }}>
                  {/* Score bars */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    {[['Color', result.scores.color], ['Space', result.scores.space], ['Vibe', result.scores.vibe]].map(([label, score]) => (
                      <div key={label} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#6a6258', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
                          <span style={{ fontSize: 11, color: '#8a8078' }}>{score}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${score}%`, background: score >= 80 ? '#5B7553' : score >= 60 ? '#c8aa78' : '#a05040', transition: 'width 1s ease-out' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Critique text */}
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#8a8078' }}>
                    <p style={{ color: '#e8e4df', fontStyle: 'italic', marginBottom: 6 }}>{result.critique.opener}</p>
                    <p style={{ marginBottom: 4 }}>{result.critique.strength}</p>
                    <p>{result.critique.weakness}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Actions ── */}
      {judgeResults && revealedJudges >= judgeResults.length && (
        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <button onClick={() => { setJudgeResults(null); setRevealedJudges(0); setPhase(2) }} style={{
            flex: 1, padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent', color: '#8a8078', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <RotateCcw size={16} /> Redesign
          </button>
          <button onClick={() => { setPage('studio') }} style={{
            flex: 2, padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(200,170,120,0.3), rgba(200,170,120,0.15))',
            color: '#f5f0e8', fontSize: 16, fontWeight: 500, fontFamily: 'Georgia, serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Award size={18} /> Submit to {GEO_TIERS.find(t => t.id === competitionTier)?.label} Competition
          </button>
        </div>
      )}
    </div>
  )

  // ════════════════════ LIVE JUDGE PANEL ════════════════════
  const [judgeInfoOpen, setJudgeInfoOpen] = useState(null) // judge id for glossary popup

  // ── Judge glossary: what each agent examines ──
  const JUDGE_GLOSSARY = {
    margaux: { focus: 'Negative Space & Restraint', examines: 'Evaluates how well you use empty space. Penalizes rooms with more than 8 items. Rewards palettes of 4 colors or fewer. Weights spatial planning highest (40%), then color harmony (35%), then vibe (25%).', tip: 'Less is more — curate, don\'t accumulate.' },
    dex: { focus: 'Bold Expression & Layering', examines: 'Looks for visual richness and personality. Rewards 8+ furniture pieces and 5+ palette colors. Weights color boldness highest (40%), vibe (35%), then space (25%).', tip: 'Go big — pattern mix, saturated hues, filled corners.' },
    yuki: { focus: 'Organic Feel & Imperfection', examines: 'Seeks natural materials and asymmetric compositions. Rewards plants and odd numbers of major furniture pieces. Weights vibe/atmosphere highest (40%), spatial flow (35%), then color (25%).', tip: 'Add a plant, embrace asymmetry, choose natural textures.' },
    ava: { focus: 'Symmetry & Classic Proportion', examines: 'Measures left-right furniture balance across the room centerline. Rewards even distribution. Weights space and color equally (30% each) with vibe at 30%.', tip: 'Balance your floor plan — mirror pieces across the room center.' },
    rio: { focus: 'Style Mixing & Storytelling', examines: 'Counts how many different furniture styles you\'ve combined. Rewards 3+ distinct styles, penalizes all-same-style rooms. Weights vibe highest (40%), color (35%), space (25%).', tip: 'Mix modern with vintage, global with local — surprise the eye.' },
    algo: { focus: 'Mathematical Aesthetics', examines: 'Pure computation: color theory (deltaE distances, hue harmony models), golden ratio coverage (38.2% floor area), and style coherence metrics. Equal weights across all axes (33% each).', tip: 'Target ~38% floor coverage and use complementary color angles.' },
  }

  const LiveJudgePanel = () => {
    // ── Glossary popup overlay ──
    const JudgeGlossaryPopup = ({ judge, onClose }) => {
      const info = JUDGE_GLOSSARY[judge.id]
      if (!info) return null
      return (
        <div style={{ position: 'absolute', top: 0, left: -260, width: 250, background: '#141414', border: '1px solid rgba(200,170,120,0.3)', borderRadius: 14, padding: 20, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>{judge.avatar}</span>
              <div>
                <div style={{ color: '#f5f0e8', fontSize: 14, fontWeight: 600 }}>{judge.name}</div>
                <div style={{ color: '#c8aa78', fontSize: 11 }}>{judge.style}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6a6258', cursor: 'pointer', fontSize: 16, padding: 4 }}><X size={14} /></button>
          </div>
          <p style={{ color: '#8a8078', fontSize: 11, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.4 }}>{judge.tagline}</p>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#c8aa78', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>{info.focus}</div>
            <p style={{ color: '#9a9690', fontSize: 11, lineHeight: 1.5, margin: 0 }}>{info.examines}</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#c8aa78', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Scoring Weights</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['Color', judge.weights.color], ['Space', judge.weights.space], ['Vibe', judge.weights.vibe]].map(([label, w]) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#6a6258', fontSize: 8, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ color: '#c8aa78', fontSize: 13, fontWeight: 700 }}>{Math.round(w * 100)}%</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(200,170,120,0.06)', border: '1px solid rgba(200,170,120,0.15)' }}>
            <div style={{ color: '#c8aa78', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>Pro Tip</div>
            <p style={{ color: '#b0a898', fontSize: 11, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>{info.tip}</p>
          </div>
        </div>
      )
    }

    if (!liveJudgeScores || liveJudgeScores.length === 0) {
      return (
        <div style={{
          width: 220, flexShrink: 0, background: '#0c0c0c', borderLeft: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Award size={14} color="#5a5248" />
            <span style={{ color: '#5a5248', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Judges</span>
          </div>
          {JUDGES.map(j => (
            <div key={j.id} onClick={() => setJudgeInfoOpen(judgeInfoOpen === j.id ? null : j.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              opacity: 0.5, cursor: 'pointer', position: 'relative', transition: 'opacity 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.opacity = '0.8' }}
              onMouseOut={e => { e.currentTarget.style.opacity = '0.5' }}
            >
              <span style={{ fontSize: 20 }}>{j.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#6a6258', fontSize: 12, fontWeight: 500 }}>{j.name}</div>
                <div style={{ color: '#3a3630', fontSize: 10 }}>{j.style}</div>
              </div>
              <span style={{ color: '#4a4238', fontSize: 10 }}>?</span>
              {judgeInfoOpen === j.id && <JudgeGlossaryPopup judge={j} onClose={(e) => { e?.stopPropagation?.(); setJudgeInfoOpen(null) }} />}
            </div>
          ))}
          <p style={{ color: '#3a3630', fontSize: 10, textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
            Click a judge to learn what they examine
          </p>
        </div>
      )
    }

    const avg = compositeScore(liveJudgeScores)
    return (
      <div style={{
        width: 220, flexShrink: 0, background: '#0c0c0c', borderLeft: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} color="#c8aa78" />
            <span style={{ color: '#8a8078', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Live Scores</span>
          </div>
          <div style={{
            padding: '3px 10px', borderRadius: 12, fontWeight: 700, fontSize: 14,
            background: avg >= 80 ? 'rgba(91,117,83,0.25)' : avg >= 60 ? 'rgba(200,170,120,0.2)' : 'rgba(160,80,64,0.2)',
            color: avg >= 80 ? '#7da870' : avg >= 60 ? '#c8aa78' : '#c06050',
          }}>{avg}</div>
        </div>

        {liveJudgeScores.map(r => {
          const isPulsing = judgePulse === r.judge.id
          const scoreColor = r.total >= 80 ? '#7da870' : r.total >= 60 ? '#c8aa78' : '#c06050'
          const reaction = r.total >= 85 ? '😍' : r.total >= 75 ? '😊' : r.total >= 60 ? '🤔' : r.total >= 45 ? '😐' : '😬'
          return (
            <div key={r.judge.id} onClick={() => setJudgeInfoOpen(judgeInfoOpen === r.judge.id ? null : r.judge.id)} style={{
              padding: '10px 10px', borderRadius: 10, position: 'relative', cursor: 'pointer',
              background: isPulsing ? 'rgba(200,170,120,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isPulsing ? 'rgba(200,170,120,0.2)' : 'rgba(255,255,255,0.04)'}`,
              transition: 'all 0.3s ease',
              transform: isPulsing ? 'scale(1.02)' : 'scale(1)',
            }}>
              {judgeInfoOpen === r.judge.id && <JudgeGlossaryPopup judge={r.judge} onClose={(e) => { e?.stopPropagation?.(); setJudgeInfoOpen(null) }} />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, transition: 'transform 0.3s', transform: isPulsing ? 'scale(1.3)' : 'scale(1)' }}>{r.judge.avatar}</span>
                  <div>
                    <div style={{ color: '#c8b89a', fontSize: 11, fontWeight: 600 }}>{r.judge.name.split(' ')[0]}</div>
                    <div style={{ color: '#4a4640', fontSize: 9 }}>{r.judge.style}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12 }}>{reaction}</span>
                  <span style={{ color: scoreColor, fontWeight: 700, fontSize: 16, fontFamily: 'monospace' }}>{r.total}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['C', r.scores.color, '#c8aa78'], ['S', r.scores.space, '#87CEEB'], ['V', r.scores.vibe, '#C1440E']].map(([label, val, barColor]) => (
                  <div key={label} style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: '#4a4640', marginBottom: 2, textAlign: 'center' }}>{label}</div>
                    <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2, background: barColor, opacity: 0.6,
                        width: `${val}%`, transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Tier 2 model status */}
        {scoringTier === 2 && tier2Scores?.models && (
          <div style={{
            padding: '8px 10px', borderRadius: 8,
            background: 'rgba(46,134,193,0.06)', border: '1px solid rgba(46,134,193,0.1)',
          }}>
            <div style={{ fontSize: 9, color: '#2E86C1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>🧠 AI Models Active</div>
            {[
              ['SpatialLM', tier2Scores.models.spatialLM],
              ['ATISS', tier2Scores.models.atiss],
              ['DiffuScene', tier2Scores.models.diffuScene],
              ['InstructScene', tier2Scores.models.instructScene],
            ].filter(([,v]) => v != null).map(([name, score]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ color: '#5a7a8a', fontSize: 9 }}>{name}</span>
                <span style={{ color: '#2E86C1', fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>{score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Trend indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <TrendingUp size={12} color={avg >= 70 ? '#5B7553' : '#5a5248'} />
          <span style={{ color: '#5a5248', fontSize: 10 }}>
            {avg >= 80 ? 'Judges love it!' : avg >= 70 ? 'Looking strong' : avg >= 55 ? 'Room to improve' : 'Keep experimenting'}
          </span>
        </div>
      </div>
    )
  }

  // ════════════════════ MAIN RENDER ════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
      <ProgressBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: phase >= 2 && phase <= 5 ? 'hidden' : 'auto', minHeight: 0 }}>
          {phase === 0 && <BriefPhase />}
          {phase === 1 && <PalettePhase />}
          {phase === 2 && <RoomPlanPhase />}
          {phase === 3 && <ElevationsPhase />}
          {phase === 4 && <FurniturePhase />}
          {phase === 5 && <Preview3DPhase />}
          {phase === 6 && <SubmitPhase />}
        </div>
        {/* Live AI Judge Panel — visible during design phases */}
        {phase >= 2 && phase <= 5 && showJudgePanel && <LiveJudgePanel />}
      </div>

      {/* Product Browser overlay — real products with photos from the database */}
      <ProductBrowser
        isOpen={showProductBrowser}
        onClose={() => setShowProductBrowser(false)}
        onSelectProduct={handleProductSelect}
        initialCategory={productBrowserCategory}
      />

      {/* Bottom nav bar */}
      <div style={{
        padding: '16px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0e0e0e',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button onClick={() => phase > 0 && setPhase(phase - 1)} style={{
          padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent', color: phase > 0 ? '#8a8078' : '#2a2620', cursor: phase > 0 ? 'pointer' : 'default',
          fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#5a5248', fontSize: 13 }}>
            {phase + 1} of {PHASE_NAMES.length} — {PHASE_NAMES[phase]}
          </span>
          {phase >= 2 && phase < 6 && designScore.color + designScore.space + designScore.vibe > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {[['C', designScore.color], ['S', designScore.space], ['V', designScore.vibe], ['B', designScore.brief || 0]].map(([label, score]) => (
                <div key={label} style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                  background: score >= 80 ? 'rgba(91,117,83,0.2)' : score >= 60 ? 'rgba(200,170,120,0.15)' : 'rgba(160,80,64,0.15)',
                  color: score >= 80 ? '#5B7553' : score >= 60 ? '#c8aa78' : '#a05040',
                }}>{label}:{score}</div>
              ))}
            </div>
          )}
        </div>
        {phase < PHASE_NAMES.length - 1 ? (
          <button onClick={() => canAdvance() && setPhase(phase + 1)} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: canAdvance() ? 'rgba(200,170,120,0.2)' : 'rgba(255,255,255,0.04)',
            color: canAdvance() ? '#c8aa78' : '#3a3630', cursor: canAdvance() ? 'pointer' : 'default',
            fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8
          }}>
            Next <ArrowRight size={16} />
          </button>
        ) : <div style={{ width: 100 }} />}
      </div>
    </div>
  )
}
