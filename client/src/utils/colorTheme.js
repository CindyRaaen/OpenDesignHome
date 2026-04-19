/**
 * Centralized Color Theme for OID Client Components
 * Replaces hardcoded hex values with named constants
 * Future: Can be swapped with ColorEngine from @openscaffold/integrations
 */

// ── FURNITURE CATEGORY COLORS ────────────────────────────────────────────────
// These colors are used throughout the furniture library in FloorPlanEditor.jsx
export const FURNITURE_COLORS = {
  // Seating
  seatingPrimaryIndigoPurple: '#6366f1',    // Sofa, loveseat, settee (52 uses)
  seatingSecondaryIndigo: '#818cf8',        // Accent chairs, benches
  seatingTertiaryLavender: '#a5b4fc',       // Ottomans, poufs, papasan
  seatingBrown: '#92400e',                  // Entryway bench, dining chair, rocking
  seatingNeutralBrown: '#78716c',           // Bar stools, counter stools
  seatingDarkSlate: '#334155',               // Office chairs
  seatingPink: '#e879f9',                    // Bean bags

  // Tables
  tablesBrown: '#92400e',                    // Dining, coffee, console (main - 52 uses)
  tablesDarkBrown: '#78350f',                // Executive desk, secretary, armoire
  tablesMediumBrown: '#b45309',              // Side tables, nesting
  tablesSlate: '#475569',                    // Standing desk, tool chest, locker

  // Bedroom
  bedroomPurple: '#7c3aed',                  // Beds (king, queen, twin, etc.)
  bedroomLavenderLight: '#8b5cf6',           // Loft bed
  bedroomPinkLight: '#d8b4fe',               // Crib, bassinet, toddler bed, toy chest
  bedroomBrown: '#92400e',                   // Nightstands, dressers, vanity
  bedroomDarkBrown: '#78350f',               // Armoire, wardrobe, china cabinet, hutch, wine rack

  // Storage
  storageNeutralBrown: '#78716c',            // Bookshelves, cabinets, filing, closet (main)
  storageLightGray: '#d4d4d8',               // Vanity mirror stand
  storageBrown: '#92400e',                   // Sideboard, credenza, shoe rack, coat rack
  storageDarkBrown: '#78350f',               // China cabinet, hutch, wine rack
  storageSlate: '#475569',                   // Locker, garage shelving, tool chest

  // Media & Electronics
  mediaSlate: '#334155',                     // TV consoles, entertainment center (main)
  mediaDarkSlate: '#1e293b',                 // Wall-mounted TV, pianos, speakers
  mediaLightGray: '#e2e8f0',                 // Projector screen

  // Bathroom
  bathroomCyan: '#0891b2',                   // Bathtubs
  bathroomLightCyan: '#06b6d4',              // Showers
  bathroomLightGray: '#e2e8f0',              // Toilets, sinks, vanities, benches
  bathroomGrayBlue: '#94a3b8',               // Medicine cabinet, towel rack, fridge
  bathroomBrown: '#b45309',                  // Sauna

  // Kitchen
  kitchenSlate: '#475569',                   // Stoves, cooktops, ovens (main)
  kitchenGrayBlue: '#94a3b8',                // Microwave, range hood, fridge (main)
  kitchenLightGray: '#e2e8f0',               // Kitchen sink, farmhouse sink
  kitchenBrown: '#92400e',                   // Island, breakfast bar
  kitchenNeutralBrown: '#78716c',            // Base cabinets, upper cabinets

  // Default
  default: '#8b7ec8',                         // Fallback furniture color
}

// ── ROOM ELEMENT COLORS ──────────────────────────────────────────────────────
export const ROOM_COLORS = {
  // Wall colors (from StyleDiscovery)
  wallDefault: '#F5F0EB',
  wallBeige: '#E8D5C4',
  wallLightGray: '#F5F5F5',
  wallCream: '#FAF0E6',
  wallGray: '#D1D5DB',
  wallSage: '#A8C4A0',
  wallNavy: '#1E3A5F',

  // Floor colors
  floorDefault: '#D4C5B2',
  floorLight: '#E0D0BF',

  // Accent colors (for mood/theme)
  accentPrimary: '#4F46E5',
  accentSecondary: '#E74C3C',
  accentBlue: '#3498DB',
  accentTeal: '#20B2AA',

  // Decorative
  plantPot: '#8B7355',
  plantLeafDark: '#5B8C5A',
  plantLeafMed: '#6B9E6A',
  plantLeafLight: '#4E7E4D',

  // Lighting
  lightWarm: '#FFF8E7',
  lightCool: '#F0F4FF',
  lightingAccent: '#FFD700',

  // Structural
  textureOverlay: '#C4A882',
  textureStroke: '#B8976E',
  windowGlass: '#E8F4FD',
  windowFrame: '#CCC',
  wallEdge: '#999',

  // Furniture details
  sofaFill: '#A0845C',
  tableWood: '#8B7355',

  // Decorative items
  plantGreen: '#16a34a',
  plantTreeGreen: '#15803d',
  rugRed: '#dc2626',
  lampYellow: '#fbbf24',
  artworkPurple: '#a78bfa',
  vaseViolet: '#c084fc',
  fireplaceDarkRed: '#b91c1c',

  // Structural elements
  stairsStone: '#a8a29e',

  // Canvas rendering
  canvasFill: '#ffffff',
  canvasText: '#1e293b',
  canvasGrid: '#64748b',

  // Misc
  yogaMat: '#4f46e5',
  poolTableGreen: '#15803d',
}

// ── MATERIAL CATALOG COLORS ──────────────────────────────────────────────────
// From finishPairing.js material definitions
export const MATERIAL_COLORS = {
  // Floors - Natural & Warm
  hardwoodOak: '#C4A35A',
  hardwoodWalnut: '#5C4033',
  hardwoodCherry: '#92400e',
  bamboo: '#D4A76A',
  vinylPlank: '#A89279',
  terracotta: '#C67B5C',

  // Floors - Cool & Clean
  tileWhite: '#F0EDEA',
  tileMarble: '#E8E4DE',

  // Walls - Neutral
  paintWhite: '#F5F5F5',
  paintWarmCream: '#FAF0E6',
  paintSoftGray: '#D1D5DB',

  // Walls - Natural
  paintSageGreen: '#A8C4A0',
  woodPaneling: '#8B6914',

  // Walls - Dark
  paintNavyBlue: '#1E3A5F',

  // Walls - Textured
  wallpaperStrike: '#E8D5C4',
  concreteRaw: '#9CA3AF',

  // Ceiling
  flatWhite: '#FFFFFF',
  eggshell: '#FAF8F5',
  coffered: '#F5F0E8',
  exposedBeam: '#8B6914',
}

// ── STYLE PROFILE COLORS ────────────────────────────────────────────────────
// Design styles with their color schemes
export const STYLE_COLORS = {
  scandinavian: {
    primary: '#FFFFFF',
    secondary: '#D4D4D4',
    accent1: '#E8D4B8',
    accent2: '#8B7355',
    neutral: '#F5F0E8',
  },
  modern: {
    primary: '#2C3E50',
    secondary: '#ECF0F1',
    accent1: '#E74C3C',
    accent2: '#3498DB',
    neutral: '#FFFFFF',
  },
  traditional: {
    primary: '#6B4423',
    secondary: '#D4A574',
    accent1: '#8B0000',
    accent2: '#2F4F4F',
    neutral: '#F5DEB3',
  },
  industrial: {
    primary: '#3C3C3C',
    secondary: '#8C7853',
    accent1: '#B8860B',
    accent2: '#C0C0C0',
    neutral: '#D3D3D3',
  },
  bohemian: {
    primary: '#8B4513',
    secondary: '#CD853F',
    accent1: '#FF6347',
    accent2: '#20B2AA',
    neutral: '#F4A460',
  },
  coastal: {
    primary: '#4A90A4',
    secondary: '#E8F4FD',
    accent1: '#FFB84D',
    accent2: '#86C167',
    neutral: '#F0F8FF',
  },
}

// ── INTERACTION COLORS ──────────────────────────────────────────────────────
// Colors for UI feedback and states
export const INTERACTION_COLORS = {
  selected: '#3b82f6',     // Blue for selection highlights
  hover: '#6366f1',        // Indigo for hover states
  warning: '#dc2626',      // Red for warnings
  accent: '#fbbf24',       // Amber for accents
  success: '#86C167',      // Green for success
  disabled: '#d4d4d8',     // Gray for disabled states
  grid: '#94a3b8',         // Blue-gray for grid lines
  snapPoint: '#0891b2',    // Cyan for snap indicators
}

/**
 * Get furniture color by type
 * @param {string} type - Furniture type/category
 * @param {object} overrideColors - Optional custom color overrides
 * @returns {string} Hex color code
 */
export function getFurnitureColor(type, overrideColors = {}) {
  const allColors = { ...FURNITURE_COLORS, ...overrideColors }
  return allColors[type] || FURNITURE_COLORS.default
}

/**
 * Get material color by category and type
 * @param {string} category - Material category (floor, wall, ceiling)
 * @param {string} materialType - Specific material type
 * @returns {string} Hex color code
 */
export function getMaterialColor(category, materialType) {
  // This will be replaced by ColorEngine calls in the future
  return MATERIAL_COLORS[materialType] || '#999999'
}

/**
 * Get style colors
 * @param {string} styleName - Style name (scandinavian, modern, etc.)
 * @returns {object} Color palette for the style
 */
export function getStyleColors(styleName) {
  return STYLE_COLORS[styleName] || STYLE_COLORS.modern
}

export default {
  FURNITURE_COLORS,
  ROOM_COLORS,
  MATERIAL_COLORS,
  STYLE_COLORS,
  INTERACTION_COLORS,
  getFurnitureColor,
  getMaterialColor,
  getStyleColors,
}
