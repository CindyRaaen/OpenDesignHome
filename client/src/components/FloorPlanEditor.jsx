import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  MousePointer,
  Square,
  DoorOpen,
  Minus,
  Move,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3x3,
  Undo2,
  Redo2,
  Copy,
  Ruler,
  Download,
  FileImage,
  FileText,
  Box,
  LayoutTemplate,
  X,
  CircleDot,
  Plus,
  ChevronDown,
  ChevronUp,
  FileOutput,
  Sparkles,
  Link2,
  Package,
  Camera,
  Palette,
  Group,
  Ungroup,
  AlignVerticalJustifyCenter,
  Lock,
  Unlock,
  Magnet,
  ArrowLeftRight,
  Type,
  Layers,
  Eye,
  EyeOff,
  Tag,
} from 'lucide-react'
import { FURNITURE_COLORS, ROOM_COLORS, INTERACTION_COLORS } from '../utils/colorTheme'
import LayoutGenerator from './LayoutGenerator'
import PhotoFloorPlan from './PhotoFloorPlan'
import FinishPairing from './FinishPairing'
import ProductImportDialog from './ProductImportDialog'
import ProductBrowser from './ProductBrowser'
import { createGrid, pixelsToUnits, snapToGrid as measureSnapToGrid, polygonArea as calcPolygonArea } from '../utils/measure.js'
import { formatFeetInches } from '../utils/measure.js'
import { exportFloorPlanToDXF, downloadDXF } from '../utils/DxfExporter'
import CadPrintPreview from './CadPrintPreview'
import { HATCH_PATTERNS, drawHatch, getPatternsByCategory } from '../utils/HatchPatterns'
import { generateElevation, drawElevation, generateAllElevations } from '../utils/ElevationExport'
import { generateRoomSchedule, generateDoorSchedule, generateWindowSchedule, drawScheduleTable } from '../utils/RoomSchedule'
import { SnapEngine, drawSnapIndicator, SNAP_TYPES } from '../utils/SnapEngine'
import { SYMBOLS, drawSymbol, getSymbolsByCategory } from '../utils/SymbolLibrary'

// TODO: Replace with shared grid system
// const grid = createGrid({ pixelsPerGridUnit: 20, unitsPerGridUnit: 0.5, unit: 'feet' });
const GRID_SIZE = 20
const SNAP_THRESHOLD = 10
const SCALE_FACTOR = 0.5 // 1 grid unit = 0.5 feet (so 2 grid units = 1 foot)

// Helper: resolve pixel width/height from furniture item
// Supports both formats: { w, h } in grid units OR { width, height } in pixels
const fPxW = (f) => f.w != null ? f.w * GRID_SIZE : (f.width || 40)
const fPxH = (f) => f.h != null ? f.h * GRID_SIZE : (f.height || 40)
const DEFAULT_FURNITURE_COLOR = FURNITURE_COLORS.default
const fColor = (f) => f.color || DEFAULT_FURNITURE_COLOR

// ─── Comprehensive Furniture Library ────────────────────────────────────────
// Dimensions in grid units (1 grid unit = 6 inches / 0.5 feet)
// All sizes based on standard real-world furniture dimensions
const FURNITURE_LIBRARY = [
  // ── SEATING ──────────────────────────────────────────────────────────────
  { type: 'sofa', label: 'Sofa (3-Seat)', w: 8, h: 4, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'sofa-2seat', label: 'Loveseat', w: 6, h: 4, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'sectional-l', label: 'Sectional (L-Shape)', w: 10, h: 8, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'sectional-u', label: 'Sectional (U-Shape)', w: 12, h: 8, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'armchair', label: 'Armchair', w: 4, h: 4, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'accent-chair', label: 'Accent Chair', w: 3, h: 3, color: FURNITURE_COLORS.seatingSecondaryIndigo, category: 'seating' },
  { type: 'recliner', label: 'Recliner', w: 4, h: 4, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'ottoman', label: 'Ottoman', w: 3, h: 3, color: FURNITURE_COLORS.seatingTertiaryLavender, category: 'seating' },
  { type: 'pouf', label: 'Pouf', w: 2, h: 2, color: FURNITURE_COLORS.seatingTertiaryLavender, category: 'seating' },
  { type: 'bench-upholstered', label: 'Upholstered Bench', w: 5, h: 2, color: FURNITURE_COLORS.seatingSecondaryIndigo, category: 'seating' },
  { type: 'bench-entryway', label: 'Entryway Bench', w: 5, h: 2, color: FURNITURE_COLORS.seatingBrown, category: 'seating' },
  { type: 'window-seat', label: 'Window Seat', w: 6, h: 2, color: FURNITURE_COLORS.seatingSecondaryIndigo, category: 'seating' },
  { type: 'bar-stool', label: 'Bar Stool', w: 2, h: 2, color: FURNITURE_COLORS.seatingNeutralBrown, category: 'seating' },
  { type: 'counter-stool', label: 'Counter Stool', w: 2, h: 2, color: FURNITURE_COLORS.seatingNeutralBrown, category: 'seating' },
  { type: 'dining-chair', label: 'Dining Chair', w: 2, h: 2, color: FURNITURE_COLORS.seatingBrown, category: 'seating' },
  { type: 'office-chair', label: 'Office Chair', w: 3, h: 3, color: FURNITURE_COLORS.seatingDarkSlate, category: 'seating' },
  { type: 'chaise-lounge', label: 'Chaise Lounge', w: 4, h: 7, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'papasan', label: 'Papasan Chair', w: 4, h: 4, color: FURNITURE_COLORS.seatingTertiaryLavender, category: 'seating' },
  { type: 'rocking-chair', label: 'Rocking Chair', w: 3, h: 4, color: FURNITURE_COLORS.seatingBrown, category: 'seating' },
  { type: 'bean-bag', label: 'Bean Bag', w: 3, h: 3, color: FURNITURE_COLORS.seatingPink, category: 'seating' },
  { type: 'daybed', label: 'Daybed', w: 5, h: 8, color: FURNITURE_COLORS.seatingSecondaryIndigo, category: 'seating' },
  { type: 'settee', label: 'Settee', w: 5, h: 3, color: FURNITURE_COLORS.seatingPrimaryIndigoPurple, category: 'seating' },
  { type: 'banquette', label: 'Banquette', w: 6, h: 2, color: FURNITURE_COLORS.seatingSecondaryIndigo, category: 'seating' },

  // ── TABLES ───────────────────────────────────────────────────────────────
  { type: 'dining-table-rect', label: 'Dining Table (Rect)', w: 8, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'dining-table-round', label: 'Dining Table (Round)', w: 5, h: 5, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'dining-table-oval', label: 'Dining Table (Oval)', w: 8, h: 5, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'dining-table-ext', label: 'Extension Table', w: 10, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'dining-table-square', label: 'Bistro Table (Sq)', w: 4, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'coffee-table', label: 'Coffee Table (Rect)', w: 5, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'coffee-table-round', label: 'Coffee Table (Round)', w: 4, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'coffee-table-oval', label: 'Coffee Table (Oval)', w: 5, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'side-table', label: 'Side Table', w: 2, h: 2, color: FURNITURE_COLORS.tablesMediumBrown, category: 'tables' },
  { type: 'side-table-round', label: 'Side Table (Round)', w: 2, h: 2, color: FURNITURE_COLORS.tablesMediumBrown, category: 'tables' },
  { type: 'end-table', label: 'End Table', w: 2, h: 2, color: FURNITURE_COLORS.tablesMediumBrown, category: 'tables' },
  { type: 'console-table', label: 'Console Table', w: 6, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'sofa-table', label: 'Sofa Table', w: 6, h: 1.5, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'hall-table', label: 'Hall Table', w: 4, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'nesting-tables', label: 'Nesting Tables', w: 3, h: 3, color: FURNITURE_COLORS.tablesMediumBrown, category: 'tables' },
  { type: 'desk', label: 'Desk', w: 6, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'desk-executive', label: 'Executive Desk', w: 8, h: 4, color: FURNITURE_COLORS.tablesDarkBrown, category: 'tables' },
  { type: 'l-desk', label: 'L-Shaped Desk', w: 8, h: 8, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'standing-desk', label: 'Standing Desk', w: 6, h: 3, color: FURNITURE_COLORS.tablesSlate, category: 'tables' },
  { type: 'writing-desk', label: 'Writing Desk', w: 5, h: 2.5, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'secretary-desk', label: 'Secretary Desk', w: 4, h: 2, color: FURNITURE_COLORS.tablesDarkBrown, category: 'tables' },
  { type: 'drafting-table', label: 'Drafting Table', w: 5, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'bar-table', label: 'Bar Height Table', w: 4, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'pub-table', label: 'Pub Table (Round)', w: 3, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },
  { type: 'c-table', label: 'C-Table / Laptop Table', w: 2, h: 2, color: FURNITURE_COLORS.tablesMediumBrown, category: 'tables' },
  { type: 'tray-table', label: 'Tray Table', w: 2, h: 2, color: FURNITURE_COLORS.tablesMediumBrown, category: 'tables' },
  { type: 'picnic-table', label: 'Picnic Table', w: 8, h: 6, color: FURNITURE_COLORS.tablesBrown, category: 'tables' },

  // ── BEDROOM ──────────────────────────────────────────────────────────────
  { type: 'bed-king', label: 'King Bed', w: 10, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'bed-cal-king', label: 'Cal King Bed', w: 9, h: 11, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'bed-queen', label: 'Queen Bed', w: 8, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'bed-full', label: 'Full Bed', w: 7, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'bed-twin', label: 'Twin Bed', w: 5, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'bed-twin-xl', label: 'Twin XL Bed', w: 5, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'bunk-bed', label: 'Bunk Bed', w: 5, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'loft-bed', label: 'Loft Bed', w: 5, h: 10, color: FURNITURE_COLORS.bedroomLavenderLight, category: 'bedroom' },
  { type: 'trundle-bed', label: 'Trundle Bed', w: 5, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'murphy-bed', label: 'Murphy Bed (Closed)', w: 8, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'bedroom' },
  { type: 'murphy-bed-open', label: 'Murphy Bed (Open)', w: 8, h: 10, color: FURNITURE_COLORS.bedroomPurple, category: 'bedroom' },
  { type: 'crib', label: 'Crib', w: 4, h: 6, color: FURNITURE_COLORS.bedroomPinkLight, category: 'bedroom' },
  { type: 'bassinet', label: 'Bassinet', w: 3, h: 4, color: FURNITURE_COLORS.bedroomPinkLight, category: 'bedroom' },
  { type: 'toddler-bed', label: 'Toddler Bed', w: 4, h: 7, color: FURNITURE_COLORS.bedroomPinkLight, category: 'bedroom' },
  { type: 'nightstand', label: 'Nightstand', w: 2, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'nightstand-wide', label: 'Wide Nightstand', w: 3, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'dresser', label: 'Dresser', w: 6, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'dresser-tall', label: 'Tall Dresser', w: 4, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'dresser-double', label: 'Double Dresser', w: 8, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'chest-of-drawers', label: 'Chest of Drawers', w: 3, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'armoire', label: 'Armoire', w: 5, h: 2.5, color: FURNITURE_COLORS.tablesDarkBrown, category: 'bedroom' },
  { type: 'wardrobe', label: 'Wardrobe', w: 6, h: 3, color: FURNITURE_COLORS.tablesDarkBrown, category: 'bedroom' },
  { type: 'wardrobe-sliding', label: 'Sliding Wardrobe', w: 8, h: 3, color: FURNITURE_COLORS.tablesDarkBrown, category: 'bedroom' },
  { type: 'vanity', label: 'Vanity / Makeup Table', w: 5, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'vanity-mirror', label: 'Vanity Mirror Stand', w: 3, h: 1, color: FURNITURE_COLORS.storageLightGray, category: 'bedroom' },
  { type: 'hope-chest', label: 'Hope Chest / Trunk', w: 4, h: 2, color: FURNITURE_COLORS.tablesDarkBrown, category: 'bedroom' },
  { type: 'blanket-ladder', label: 'Blanket Ladder', w: 2, h: 1, color: FURNITURE_COLORS.tablesBrown, category: 'bedroom' },
  { type: 'changing-table', label: 'Changing Table', w: 4, h: 2, color: FURNITURE_COLORS.bedroomPinkLight, category: 'bedroom' },

  // ── STORAGE ──────────────────────────────────────────────────────────────
  { type: 'bookshelf', label: 'Bookshelf (3ft)', w: 4, h: 1.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'bookshelf-tall', label: 'Tall Bookshelf (5ft)', w: 4, h: 1.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'bookshelf-wide', label: 'Wide Bookshelf', w: 6, h: 1.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'bookshelf-corner', label: 'Corner Bookshelf', w: 3, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'shelving-unit', label: 'Shelving Unit', w: 4, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'cube-storage', label: 'Cube Storage (4x4)', w: 6, h: 1.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'floating-shelves', label: 'Floating Shelves', w: 5, h: 1, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'cabinet', label: 'Cabinet', w: 3, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'cabinet-tall', label: 'Tall Cabinet', w: 3, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'cabinet-display', label: 'Display Cabinet', w: 4, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'china-cabinet', label: 'China Cabinet', w: 5, h: 2, color: FURNITURE_COLORS.tablesDarkBrown, category: 'storage' },
  { type: 'hutch', label: 'Hutch', w: 5, h: 2, color: FURNITURE_COLORS.tablesDarkBrown, category: 'storage' },
  { type: 'sideboard', label: 'Sideboard / Buffet', w: 6, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'storage' },
  { type: 'credenza', label: 'Credenza', w: 7, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'storage' },
  { type: 'filing-cabinet', label: 'Filing Cabinet', w: 2, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'filing-cabinet-lateral', label: 'Lateral File Cabinet', w: 4, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'locker', label: 'Storage Locker', w: 2, h: 2, color: FURNITURE_COLORS.tablesSlate, category: 'storage' },
  { type: 'closet-system', label: 'Closet System', w: 8, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'shoe-rack', label: 'Shoe Rack', w: 4, h: 1.5, color: FURNITURE_COLORS.tablesBrown, category: 'storage' },
  { type: 'coat-rack', label: 'Coat Rack', w: 2, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'storage' },
  { type: 'hall-tree', label: 'Hall Tree', w: 3, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'storage' },
  { type: 'toy-chest', label: 'Toy Chest', w: 4, h: 2, color: FURNITURE_COLORS.bedroomPinkLight, category: 'storage' },
  { type: 'storage-ottoman', label: 'Storage Ottoman', w: 3, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'wine-rack', label: 'Wine Rack', w: 3, h: 1.5, color: FURNITURE_COLORS.tablesDarkBrown, category: 'storage' },
  { type: 'pantry-shelf', label: 'Pantry Shelving', w: 4, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },
  { type: 'garage-shelving', label: 'Garage Shelving', w: 6, h: 2, color: FURNITURE_COLORS.tablesSlate, category: 'storage' },
  { type: 'tool-chest', label: 'Tool Chest', w: 3, h: 2, color: FURNITURE_COLORS.tablesSlate, category: 'storage' },
  { type: 'storage-bench', label: 'Storage Bench', w: 5, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'storage' },

  // ── MEDIA & ELECTRONICS ──────────────────────────────────────────────────
  { type: 'tv-console', label: 'TV Console', w: 6, h: 2, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'tv-console-wide', label: 'TV Console (Wide)', w: 8, h: 2, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'tv-wall-mount', label: 'Wall-Mounted TV', w: 5, h: 0.5, color: FURNITURE_COLORS.mediaDarkSlate, category: 'media' },
  { type: 'tv-stand-corner', label: 'Corner TV Stand', w: 5, h: 3, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'entertainment-center', label: 'Entertainment Center', w: 8, h: 2, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'media-tower', label: 'Media Tower', w: 2, h: 2, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'speaker-tower', label: 'Floor Speaker', w: 1.5, h: 1.5, color: FURNITURE_COLORS.mediaDarkSlate, category: 'media' },
  { type: 'soundbar', label: 'Soundbar', w: 5, h: 0.5, color: FURNITURE_COLORS.mediaDarkSlate, category: 'media' },
  { type: 'subwoofer', label: 'Subwoofer', w: 2, h: 2, color: FURNITURE_COLORS.mediaDarkSlate, category: 'media' },
  { type: 'record-player', label: 'Record Player Stand', w: 3, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'media' },
  { type: 'monitor-stand', label: 'Monitor / Display', w: 3, h: 1.5, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'dual-monitors', label: 'Dual Monitors', w: 5, h: 1.5, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'gaming-desk', label: 'Gaming Setup', w: 6, h: 3, color: FURNITURE_COLORS.mediaSlate, category: 'media' },
  { type: 'projector-screen', label: 'Projector Screen', w: 8, h: 0.5, color: FURNITURE_COLORS.mediaLightGray, category: 'media' },
  { type: 'piano-upright', label: 'Upright Piano', w: 6, h: 3, color: FURNITURE_COLORS.mediaDarkSlate, category: 'media' },
  { type: 'piano-grand', label: 'Grand Piano', w: 10, h: 12, color: FURNITURE_COLORS.mediaDarkSlate, category: 'media' },
  { type: 'piano-baby-grand', label: 'Baby Grand Piano', w: 8, h: 9, color: FURNITURE_COLORS.mediaDarkSlate, category: 'media' },
  { type: 'keyboard-stand', label: 'Keyboard + Stand', w: 5, h: 2, color: FURNITURE_COLORS.mediaSlate, category: 'media' },

  // ── BATHROOM ─────────────────────────────────────────────────────────────
  { type: 'bathtub', label: 'Standard Tub', w: 3, h: 7, color: FURNITURE_COLORS.bathroomCyan, category: 'bathroom' },
  { type: 'bathtub-freestanding', label: 'Freestanding Tub', w: 4, h: 8, color: FURNITURE_COLORS.bathroomCyan, category: 'bathroom' },
  { type: 'bathtub-corner', label: 'Corner Tub', w: 6, h: 6, color: FURNITURE_COLORS.bathroomCyan, category: 'bathroom' },
  { type: 'bathtub-garden', label: 'Garden Tub', w: 5, h: 8, color: FURNITURE_COLORS.bathroomCyan, category: 'bathroom' },
  { type: 'shower', label: 'Shower Stall', w: 4, h: 4, color: FURNITURE_COLORS.bathroomLightCyan, category: 'bathroom' },
  { type: 'shower-walk-in', label: 'Walk-In Shower', w: 6, h: 5, color: FURNITURE_COLORS.bathroomLightCyan, category: 'bathroom' },
  { type: 'shower-corner', label: 'Corner Shower', w: 4, h: 4, color: FURNITURE_COLORS.bathroomLightCyan, category: 'bathroom' },
  { type: 'shower-tub-combo', label: 'Shower/Tub Combo', w: 3, h: 7, color: FURNITURE_COLORS.bathroomCyan, category: 'bathroom' },
  { type: 'toilet', label: 'Toilet', w: 2, h: 3, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'toilet-elongated', label: 'Elongated Toilet', w: 2, h: 4, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'bidet', label: 'Bidet', w: 2, h: 3, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'sink-pedestal', label: 'Pedestal Sink', w: 2, h: 2, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'sink-vanity', label: 'Vanity Sink (Single)', w: 4, h: 2.5, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'double-vanity', label: 'Double Vanity', w: 8, h: 2.5, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'sink-wall-hung', label: 'Wall-Hung Sink', w: 3, h: 2, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'sink-vessel', label: 'Vessel Sink', w: 3, h: 2, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'medicine-cabinet', label: 'Medicine Cabinet', w: 3, h: 0.5, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'bathroom' },
  { type: 'linen-tower', label: 'Linen Tower', w: 2, h: 2, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'towel-rack', label: 'Towel Rack', w: 3, h: 0.5, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'bathroom' },
  { type: 'bathroom-bench', label: 'Shower Bench', w: 3, h: 2, color: FURNITURE_COLORS.mediaLightGray, category: 'bathroom' },
  { type: 'sauna', label: 'Sauna Room', w: 8, h: 6, color: FURNITURE_COLORS.tablesMediumBrown, category: 'bathroom' },
  { type: 'steam-shower', label: 'Steam Shower', w: 6, h: 5, color: FURNITURE_COLORS.bathroomLightCyan, category: 'bathroom' },

  // ── KITCHEN ──────────────────────────────────────────────────────────────
  { type: 'stove', label: 'Range / Stove', w: 3, h: 3, color: FURNITURE_COLORS.tablesSlate, category: 'kitchen' },
  { type: 'stove-commercial', label: 'Commercial Range', w: 4, h: 3, color: FURNITURE_COLORS.tablesSlate, category: 'kitchen' },
  { type: 'cooktop', label: 'Cooktop', w: 4, h: 2.5, color: FURNITURE_COLORS.tablesSlate, category: 'kitchen' },
  { type: 'wall-oven', label: 'Wall Oven', w: 3, h: 1.5, color: FURNITURE_COLORS.tablesSlate, category: 'kitchen' },
  { type: 'double-oven', label: 'Double Wall Oven', w: 3, h: 1.5, color: FURNITURE_COLORS.tablesSlate, category: 'kitchen' },
  { type: 'microwave', label: 'Microwave', w: 2, h: 1.5, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'range-hood', label: 'Range Hood', w: 4, h: 2, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'fridge', label: 'Refrigerator', w: 3, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'fridge-french', label: 'French Door Fridge', w: 4, h: 4, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'fridge-side-by-side', label: 'Side-by-Side Fridge', w: 4, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'fridge-mini', label: 'Mini Fridge', w: 2, h: 2, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'freezer-chest', label: 'Chest Freezer', w: 4, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'dishwasher', label: 'Dishwasher', w: 3, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'kitchen' },
  { type: 'kitchen-sink', label: 'Kitchen Sink', w: 4, h: 3, color: FURNITURE_COLORS.mediaLightGray, category: 'kitchen' },
  { type: 'kitchen-sink-farm', label: 'Farmhouse Sink', w: 4, h: 3, color: FURNITURE_COLORS.mediaLightGray, category: 'kitchen' },
  { type: 'island', label: 'Kitchen Island', w: 6, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'kitchen' },
  { type: 'island-large', label: 'Large Island', w: 8, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'kitchen' },
  { type: 'island-round', label: 'Round Island', w: 5, h: 5, color: FURNITURE_COLORS.tablesBrown, category: 'kitchen' },
  { type: 'breakfast-bar', label: 'Breakfast Bar', w: 6, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'kitchen' },
  { type: 'cabinet-base', label: 'Base Cabinet (2ft)', w: 3, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'kitchen' },
  { type: 'cabinet-base-wide', label: 'Base Cabinet (3ft)', w: 4, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'kitchen' },
  { type: 'cabinet-upper', label: 'Upper Cabinet', w: 3, h: 1.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'kitchen' },
  { type: 'cabinet-corner-lazy', label: 'Lazy Susan Corner', w: 4, h: 4, color: FURNITURE_COLORS.storageNeutralBrown, category: 'kitchen' },
  { type: 'pantry-cabinet', label: 'Pantry Cabinet', w: 3, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'kitchen' },
  { type: 'wine-cooler', label: 'Wine Cooler', w: 2, h: 3, color: FURNITURE_COLORS.tablesSlate, category: 'kitchen' },
  { type: 'trash-compactor', label: 'Trash Compactor', w: 2, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'kitchen' },
  { type: 'kitchen-cart', label: 'Kitchen Cart', w: 3, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'kitchen' },
  { type: 'pot-rack', label: 'Pot Rack', w: 4, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'kitchen' },
  { type: 'baker-rack', label: "Baker's Rack", w: 3, h: 2, color: FURNITURE_COLORS.tablesSlate, category: 'kitchen' },
  { type: 'coffee-station', label: 'Coffee Station', w: 3, h: 2, color: FURNITURE_COLORS.tablesDarkBrown, category: 'kitchen' },

  // ── DECOR & ACCESSORIES ──────────────────────────────────────────────────
  { type: 'plant', label: 'Potted Plant (Med)', w: 2, h: 2, color: FURNITURE_COLORS.plantGreen, category: 'decor' },
  { type: 'plant-large', label: 'Floor Plant (Large)', w: 3, h: 3, color: FURNITURE_COLORS.plantGreen, category: 'decor' },
  { type: 'plant-small', label: 'Small Plant', w: 1, h: 1, color: FURNITURE_COLORS.plantGreen, category: 'decor' },
  { type: 'plant-tree', label: 'Indoor Tree', w: 3, h: 3, color: FURNITURE_COLORS.plantTreeGreen, category: 'decor' },
  { type: 'planter-rect', label: 'Planter Box', w: 4, h: 1.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'decor' },
  { type: 'planter-round', label: 'Round Planter', w: 2, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'decor' },
  { type: 'rug', label: 'Area Rug (8×6)', w: 8, h: 6, color: FURNITURE_COLORS.rugRed, category: 'decor' },
  { type: 'rug-large', label: 'Area Rug (10×8)', w: 10, h: 8, color: FURNITURE_COLORS.rugRed, category: 'decor' },
  { type: 'rug-small', label: 'Accent Rug (4×3)', w: 4, h: 3, color: FURNITURE_COLORS.rugRed, category: 'decor' },
  { type: 'rug-round', label: 'Round Rug', w: 6, h: 6, color: FURNITURE_COLORS.rugRed, category: 'decor' },
  { type: 'rug-runner', label: 'Runner Rug', w: 2, h: 8, color: FURNITURE_COLORS.rugRed, category: 'decor' },
  { type: 'floor-lamp', label: 'Floor Lamp', w: 1.5, h: 1.5, color: FURNITURE_COLORS.lampYellow, category: 'decor' },
  { type: 'floor-lamp-arc', label: 'Arc Floor Lamp', w: 3, h: 3, color: FURNITURE_COLORS.lampYellow, category: 'decor' },
  { type: 'table-lamp', label: 'Table Lamp', w: 1, h: 1, color: FURNITURE_COLORS.lampYellow, category: 'decor' },
  { type: 'pendant-light', label: 'Pendant Light', w: 2, h: 2, color: FURNITURE_COLORS.lampYellow, category: 'decor' },
  { type: 'chandelier', label: 'Chandelier', w: 4, h: 4, color: FURNITURE_COLORS.lampYellow, category: 'decor' },
  { type: 'ceiling-fan', label: 'Ceiling Fan', w: 5, h: 5, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'decor' },
  { type: 'mirror-floor', label: 'Floor Mirror', w: 3, h: 1, color: FURNITURE_COLORS.storageLightGray, category: 'decor' },
  { type: 'mirror-wall', label: 'Wall Mirror', w: 4, h: 0.5, color: FURNITURE_COLORS.storageLightGray, category: 'decor' },
  { type: 'mirror-round', label: 'Round Mirror', w: 3, h: 3, color: FURNITURE_COLORS.storageLightGray, category: 'decor' },
  { type: 'artwork-small', label: 'Artwork (Small)', w: 2, h: 0.5, color: FURNITURE_COLORS.artworkPurple, category: 'decor' },
  { type: 'artwork-large', label: 'Artwork (Large)', w: 5, h: 0.5, color: FURNITURE_COLORS.artworkPurple, category: 'decor' },
  { type: 'clock-wall', label: 'Wall Clock', w: 2, h: 2, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'decor' },
  { type: 'sculpture', label: 'Sculpture / Statue', w: 2, h: 2, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'decor' },
  { type: 'vase', label: 'Floor Vase', w: 1.5, h: 1.5, color: FURNITURE_COLORS.vaseViolet, category: 'decor' },
  { type: 'fireplace', label: 'Fireplace', w: 5, h: 2, color: FURNITURE_COLORS.fireplaceDarkRed, category: 'decor' },
  { type: 'fireplace-corner', label: 'Corner Fireplace', w: 4, h: 4, color: FURNITURE_COLORS.fireplaceDarkRed, category: 'decor' },
  { type: 'fireplace-electric', label: 'Electric Fireplace', w: 5, h: 1.5, color: FURNITURE_COLORS.fireplaceDarkRed, category: 'decor' },
  { type: 'room-divider', label: 'Room Divider', w: 6, h: 1, color: FURNITURE_COLORS.storageNeutralBrown, category: 'decor' },
  { type: 'curtains', label: 'Curtains / Drapes', w: 5, h: 0.5, color: FURNITURE_COLORS.artworkPurple, category: 'decor' },
  { type: 'aquarium', label: 'Aquarium', w: 5, h: 2, color: FURNITURE_COLORS.bathroomCyan, category: 'decor' },
  { type: 'candle-set', label: 'Candle Set', w: 1, h: 1, color: FURNITURE_COLORS.lampYellow, category: 'decor' },

  // ── OUTDOOR & PATIO ──────────────────────────────────────────────────────
  { type: 'patio-table-rect', label: 'Patio Dining Table', w: 6, h: 4, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'patio-table-round', label: 'Patio Table (Round)', w: 5, h: 5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'patio-chair', label: 'Patio Chair', w: 3, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'adirondack-chair', label: 'Adirondack Chair', w: 3, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'outdoor' },
  { type: 'lounge-chair', label: 'Lounge Chair', w: 3, h: 8, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'patio-sofa', label: 'Outdoor Sofa', w: 8, h: 4, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'patio-sectional', label: 'Outdoor Sectional', w: 8, h: 8, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'hammock', label: 'Hammock', w: 3, h: 8, color: FURNITURE_COLORS.bedroomPinkLight, category: 'outdoor' },
  { type: 'swing', label: 'Porch Swing', w: 5, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'outdoor' },
  { type: 'umbrella', label: 'Patio Umbrella', w: 6, h: 6, color: FURNITURE_COLORS.rugRed, category: 'outdoor' },
  { type: 'pergola', label: 'Pergola', w: 12, h: 10, color: FURNITURE_COLORS.tablesBrown, category: 'outdoor' },
  { type: 'gazebo', label: 'Gazebo', w: 10, h: 10, color: FURNITURE_COLORS.tablesBrown, category: 'outdoor' },
  { type: 'grill', label: 'BBQ Grill', w: 4, h: 3, color: FURNITURE_COLORS.mediaSlate, category: 'outdoor' },
  { type: 'outdoor-kitchen', label: 'Outdoor Kitchen', w: 8, h: 3, color: FURNITURE_COLORS.tablesSlate, category: 'outdoor' },
  { type: 'fire-pit', label: 'Fire Pit', w: 4, h: 4, color: FURNITURE_COLORS.fireplaceDarkRed, category: 'outdoor' },
  { type: 'hot-tub', label: 'Hot Tub', w: 6, h: 6, color: FURNITURE_COLORS.bathroomCyan, category: 'outdoor' },
  { type: 'plunge-pool', label: 'Plunge Pool', w: 8, h: 6, color: FURNITURE_COLORS.bathroomCyan, category: 'outdoor' },
  { type: 'planter-outdoor', label: 'Outdoor Planter', w: 3, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'outdoor-bench', label: 'Garden Bench', w: 5, h: 2, color: FURNITURE_COLORS.tablesBrown, category: 'outdoor' },
  { type: 'outdoor-bar', label: 'Outdoor Bar', w: 6, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'outdoor' },
  { type: 'outdoor-storage', label: 'Outdoor Storage Box', w: 5, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'outdoor' },
  { type: 'fountain', label: 'Water Fountain', w: 4, h: 4, color: FURNITURE_COLORS.bathroomCyan, category: 'outdoor' },
  { type: 'trellis', label: 'Trellis / Lattice', w: 5, h: 1, color: FURNITURE_COLORS.tablesBrown, category: 'outdoor' },

  // ── OFFICE & WORKSPACE ───────────────────────────────────────────────────
  { type: 'desk-corner', label: 'Corner Desk', w: 6, h: 6, color: FURNITURE_COLORS.tablesBrown, category: 'office' },
  { type: 'desk-reception', label: 'Reception Desk', w: 8, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'office' },
  { type: 'conference-table-sm', label: 'Conference (6-seat)', w: 8, h: 4, color: FURNITURE_COLORS.tablesDarkBrown, category: 'office' },
  { type: 'conference-table-lg', label: 'Conference (12-seat)', w: 14, h: 5, color: FURNITURE_COLORS.tablesDarkBrown, category: 'office' },
  { type: 'conference-table-round', label: 'Round Meeting Table', w: 6, h: 6, color: FURNITURE_COLORS.tablesDarkBrown, category: 'office' },
  { type: 'whiteboard', label: 'Whiteboard', w: 6, h: 0.5, color: FURNITURE_COLORS.mediaLightGray, category: 'office' },
  { type: 'bulletin-board', label: 'Bulletin Board', w: 4, h: 0.5, color: FURNITURE_COLORS.tablesMediumBrown, category: 'office' },
  { type: 'printer', label: 'Printer', w: 2, h: 2, color: FURNITURE_COLORS.tablesSlate, category: 'office' },
  { type: 'printer-large', label: 'Large Format Printer', w: 4, h: 3, color: FURNITURE_COLORS.tablesSlate, category: 'office' },
  { type: 'copier', label: 'Copier / MFP', w: 3, h: 3, color: FURNITURE_COLORS.tablesSlate, category: 'office' },
  { type: 'server-rack', label: 'Server Rack', w: 3, h: 4, color: FURNITURE_COLORS.mediaSlate, category: 'office' },
  { type: 'water-cooler', label: 'Water Cooler', w: 2, h: 2, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'office' },
  { type: 'desk-partition', label: 'Desk Partition', w: 5, h: 0.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'office' },
  { type: 'standing-meeting', label: 'Standing Table', w: 4, h: 4, color: FURNITURE_COLORS.tablesBrown, category: 'office' },
  { type: 'phone-booth', label: 'Phone Booth Pod', w: 4, h: 4, color: FURNITURE_COLORS.storageNeutralBrown, category: 'office' },
  { type: 'cubicle', label: 'Cubicle', w: 6, h: 6, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'office' },

  // ── LAUNDRY & UTILITY ────────────────────────────────────────────────────
  { type: 'washer', label: 'Washer', w: 3, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'laundry' },
  { type: 'dryer', label: 'Dryer', w: 3, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'laundry' },
  { type: 'washer-dryer-stack', label: 'Stacked W/D', w: 3, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'laundry' },
  { type: 'washer-dryer-combo', label: 'Combo W/D', w: 3, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'laundry' },
  { type: 'laundry-sink', label: 'Laundry Sink', w: 3, h: 3, color: FURNITURE_COLORS.mediaLightGray, category: 'laundry' },
  { type: 'ironing-board', label: 'Ironing Board', w: 2, h: 5, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'laundry' },
  { type: 'drying-rack', label: 'Drying Rack', w: 3, h: 3, color: FURNITURE_COLORS.bathroomGrayBlue, category: 'laundry' },
  { type: 'laundry-basket', label: 'Laundry Basket', w: 2, h: 2, color: FURNITURE_COLORS.storageNeutralBrown, category: 'laundry' },
  { type: 'folding-table', label: 'Folding Table', w: 5, h: 3, color: FURNITURE_COLORS.tablesBrown, category: 'laundry' },
  { type: 'utility-sink', label: 'Utility Sink', w: 3, h: 3, color: FURNITURE_COLORS.mediaLightGray, category: 'laundry' },
  { type: 'water-heater', label: 'Water Heater', w: 3, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'laundry' },
  { type: 'furnace', label: 'Furnace / HVAC', w: 4, h: 3, color: FURNITURE_COLORS.storageNeutralBrown, category: 'laundry' },

  // ── FITNESS & RECREATION ─────────────────────────────────────────────────
  { type: 'treadmill', label: 'Treadmill', w: 4, h: 8, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'elliptical', label: 'Elliptical', w: 3, h: 7, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'stationary-bike', label: 'Stationary Bike', w: 3, h: 5, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'spin-bike', label: 'Spin Bike', w: 3, h: 5, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'rowing-machine', label: 'Rowing Machine', w: 3, h: 8, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'weight-bench', label: 'Weight Bench', w: 3, h: 6, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'power-rack', label: 'Power Rack', w: 5, h: 6, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'home-gym', label: 'Home Gym Machine', w: 5, h: 7, color: FURNITURE_COLORS.mediaSlate, category: 'fitness' },
  { type: 'yoga-mat', label: 'Yoga Mat', w: 3, h: 7, color: FURNITURE_COLORS.yogaMat, category: 'fitness' },
  { type: 'punching-bag', label: 'Punching Bag', w: 2, h: 2, color: FURNITURE_COLORS.rugRed, category: 'fitness' },
  { type: 'pool-table', label: 'Pool Table', w: 10, h: 6, color: FURNITURE_COLORS.poolTableGreen, category: 'fitness' },
  { type: 'foosball', label: 'Foosball Table', w: 6, h: 4, color: FURNITURE_COLORS.tablesDarkBrown, category: 'fitness' },
  { type: 'ping-pong', label: 'Ping Pong Table', w: 10, h: 6, color: FURNITURE_COLORS.poolTableGreen, category: 'fitness' },
  { type: 'arcade-machine', label: 'Arcade Machine', w: 3, h: 4, color: FURNITURE_COLORS.bedroomPurple, category: 'fitness' },

  // ── STAIRS & STRUCTURAL ──────────────────────────────────────────────────
  { type: 'stairs-straight', label: 'Stairs (Straight)', w: 4, h: 10, color: FURNITURE_COLORS.stairsStone, category: 'structural' },
  { type: 'stairs-l', label: 'Stairs (L-Shape)', w: 6, h: 10, color: FURNITURE_COLORS.stairsStone, category: 'structural' },
  { type: 'stairs-u', label: 'Stairs (U-Shape)', w: 8, h: 10, color: FURNITURE_COLORS.stairsStone, category: 'structural' },
  { type: 'stairs-spiral', label: 'Spiral Stairs', w: 5, h: 5, color: FURNITURE_COLORS.stairsStone, category: 'structural' },
  { type: 'column', label: 'Column / Post', w: 2, h: 2, color: FURNITURE_COLORS.stairsStone, category: 'structural' },
  { type: 'pillar-round', label: 'Round Pillar', w: 2, h: 2, color: FURNITURE_COLORS.stairsStone, category: 'structural' },
  { type: 'half-wall', label: 'Half Wall', w: 6, h: 1, color: FURNITURE_COLORS.stairsStone, category: 'structural' },
  { type: 'railing', label: 'Railing', w: 6, h: 0.5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'structural' },
  { type: 'elevator', label: 'Elevator', w: 5, h: 5, color: FURNITURE_COLORS.storageNeutralBrown, category: 'structural' },
  { type: 'closet-reach-in', label: 'Reach-In Closet', w: 5, h: 3, color: FURNITURE_COLORS.storageLightGray, category: 'structural' },
  { type: 'closet-walk-in', label: 'Walk-In Closet', w: 8, h: 6, color: FURNITURE_COLORS.storageLightGray, category: 'structural' },
]

const CATEGORIES = [
  'all', 'seating', 'tables', 'bedroom', 'storage', 'media',
  'bathroom', 'kitchen', 'decor', 'outdoor', 'office',
  'laundry', 'fitness', 'structural'
]

// ─── Room Templates ─────────────────────────────────────────
const ROOM_TEMPLATES = [
  {
    name: 'Rectangle',
    desc: '20\' × 15\' rectangular room',
    walls: [
      { x1: 100, y1: 100, x2: 500, y2: 100 },
      { x1: 500, y1: 100, x2: 500, y2: 400 },
      { x1: 500, y1: 400, x2: 100, y2: 400 },
      { x1: 100, y1: 400, x2: 100, y2: 100 },
    ],
    doors: [{ x: 280, y: 400, width: 40, rotation: 0 }],
    windows: [{ x1: 200, y1: 100, x2: 320, y2: 100 }],
  },
  {
    name: 'L-Shape',
    desc: 'L-shaped open plan layout',
    walls: [
      { x1: 100, y1: 100, x2: 500, y2: 100 },
      { x1: 500, y1: 100, x2: 500, y2: 300 },
      { x1: 500, y1: 300, x2: 340, y2: 300 },
      { x1: 340, y1: 300, x2: 340, y2: 500 },
      { x1: 340, y1: 500, x2: 100, y2: 500 },
      { x1: 100, y1: 500, x2: 100, y2: 100 },
    ],
    doors: [{ x: 200, y: 500, width: 40, rotation: 0 }],
    windows: [
      { x1: 200, y1: 100, x2: 320, y2: 100 },
      { x1: 500, y1: 160, x2: 500, y2: 260 },
    ],
  },
  {
    name: 'Open Plan',
    desc: '30\' × 20\' open concept',
    walls: [
      { x1: 60, y1: 60, x2: 660, y2: 60 },
      { x1: 660, y1: 60, x2: 660, y2: 460 },
      { x1: 660, y1: 460, x2: 60, y2: 460 },
      { x1: 60, y1: 460, x2: 60, y2: 60 },
    ],
    doors: [
      { x: 340, y: 460, width: 50, rotation: 0 },
      { x: 60, y: 240, width: 40, rotation: 270 },
    ],
    windows: [
      { x1: 160, y1: 60, x2: 300, y2: 60 },
      { x1: 400, y1: 60, x2: 560, y2: 60 },
      { x1: 660, y1: 160, x2: 660, y2: 360 },
    ],
  },
  {
    name: 'Studio',
    desc: '16\' × 12\' studio apartment',
    walls: [
      { x1: 120, y1: 100, x2: 440, y2: 100 },
      { x1: 440, y1: 100, x2: 440, y2: 340 },
      { x1: 440, y1: 340, x2: 120, y2: 340 },
      { x1: 120, y1: 340, x2: 120, y2: 100 },
      // Bathroom partition
      { x1: 340, y1: 100, x2: 340, y2: 200 },
      { x1: 340, y1: 200, x2: 440, y2: 200 },
    ],
    doors: [
      { x: 200, y: 340, width: 40, rotation: 0 },
      { x: 340, y: 160, width: 30, rotation: 270 },
    ],
    windows: [{ x1: 180, y1: 100, x2: 300, y2: 100 }],
  },
  {
    name: 'Master Suite',
    desc: 'Bedroom + en-suite + walk-in',
    walls: [
      { x1: 80, y1: 80, x2: 560, y2: 80 },
      { x1: 560, y1: 80, x2: 560, y2: 440 },
      { x1: 560, y1: 440, x2: 80, y2: 440 },
      { x1: 80, y1: 440, x2: 80, y2: 80 },
      // En-suite wall
      { x1: 380, y1: 80, x2: 380, y2: 280 },
      { x1: 380, y1: 280, x2: 560, y2: 280 },
      // Walk-in closet wall
      { x1: 380, y1: 340, x2: 380, y2: 440 },
      { x1: 380, y1: 340, x2: 560, y2: 340 },
    ],
    doors: [
      { x: 200, y: 440, width: 40, rotation: 0 },
      { x: 380, y: 160, width: 35, rotation: 270 },
      { x: 380, y: 380, width: 35, rotation: 270 },
    ],
    windows: [
      { x1: 140, y1: 80, x2: 280, y2: 80 },
      { x1: 560, y1: 140, x2: 560, y2: 240 },
    ],
  },
]

function snapToGrid(val) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE
}

// Calculate arc parameters from 3 points: start, end, and bulge point
function calculateArcFromPoints(x1, y1, x2, y2, bx, by) {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const bulgeDistance = Math.sqrt((bx - midX) ** 2 + (by - midY) ** 2)

  // Perpendicular distance determines the arc
  if (bulgeDistance < 1) return null

  // Distance from start to end
  const chordLength = Math.sqrt(dx * dx + dy * dy)
  if (chordLength < 1) return null

  // Calculate radius using chord and bulge
  const radius = (chordLength * chordLength) / (8 * bulgeDistance) + bulgeDistance / 2

  // Center of circle is perpendicular to chord at its midpoint
  const perpX = -dy / chordLength
  const perpY = dx / chordLength

  // Determine if bulge is above or below the chord
  const towardBulge = Math.sign((bx - midX) * perpX + (by - midY) * perpY)
  const cx = midX + towardBulge * perpX * (radius - bulgeDistance)
  const cy = midY + towardBulge * perpY * (radius - bulgeDistance)

  // Calculate start and end angles
  const startAngle = Math.atan2(y1 - cy, x1 - cx)
  const endAngle = Math.atan2(y2 - cy, x2 - cx)

  return { cx, cy, radius, startAngle, endAngle }
}

// Calculate arc length
function arcLength(curve) {
  if (!curve) return 0
  const { radius, startAngle, endAngle } = curve
  let angle = endAngle - startAngle
  if (angle < 0) angle += Math.PI * 2
  if (angle > Math.PI) angle = Math.PI * 2 - angle
  return radius * angle
}

// TODO: Replace with @openscaffold/measure
// const pixelsToFeet = (px) => pixelsToUnits(px, grid);
function pixelsToFeet(px) {
  return (px / GRID_SIZE * SCALE_FACTOR).toFixed(1)
}

function formatMeasurement(px) {
  const totalInches = (px / GRID_SIZE * SCALE_FACTOR * 12)
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  if (inches === 0) return `${feet}'`
  return `${feet}'${inches}"`
}

let nextId = 1
function genId() {
  return nextId++
}

function createEmptyFloor(id, name = 'Floor 1') {
  return {
    id,
    name,
    level: 0,
    height: 9,
    walls: [],
    doors: [],
    windows: [],
    furniture: [],
    measurements: [],
    annotations: [],
    roomLabels: [],
    placedSymbols: [],
  }
}

export default function FloorPlanEditor({ initialData, onSave, canvasWidth = 800, canvasHeight = 600 }) {
  // Tool state
  const [tool, setTool] = useState('select') // select, wall, arc-wall, door, window, furniture, measure, dimension, annotate
  const [showGrid, setShowGrid] = useState(true)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [annotations, setAnnotations] = useState([]) // { id, x, y, text, fontSize, rotation }
  const [roomLabels, setRoomLabels] = useState([]) // { id, x, y, name, area }
  const [layers, setLayers] = useState({
    walls: true, doors: true, windows: true, furniture: true,
    dimensions: true, annotations: true, roomLabels: true, grid: true,
  })
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [annotationText, setAnnotationText] = useState('')

  // Phase C: CAD tools state
  const [showElevationPreview, setShowElevationPreview] = useState(false)
  const [showSchedulePreview, setShowSchedulePreview] = useState(false)
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)
  const [placedSymbols, setPlacedSymbols] = useState([]) // { id, key, x, y, scale, rotation }
  const [symbolToPlace, setSymbolToPlace] = useState(null) // symbol key being placed
  const [snapModes, setSnapModes] = useState({
    endpoint: true, midpoint: true, intersection: true,
    perpendicular: false, nearest: false, center: true, grid: true,
  })
  const [activeSnap, setActiveSnap] = useState(null) // current snap indicator
  const snapEngineRef = useRef(null)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Multi-floor support
  const [floors, setFloors] = useState([createEmptyFloor(1)])
  const [activeFloor, setActiveFloor] = useState(1)
  const [showFloorPanel, setShowFloorPanel] = useState(false)

  // Drawing elements (derived from active floor)
  const activeFloorData = floors.find(f => f.id === activeFloor) || floors[0]
  const [walls, setWalls] = useState([])
  const [doors, setDoors] = useState([])
  const [windows, setWindows] = useState([])
  const [furniture, setFurniture] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [selected, setSelected] = useState(null) // { type, id }
  const [dimensions, setDimensions] = useState({ width: canvasWidth, height: canvasHeight })

  // Multi-select & grouping
  const [multiSelected, setMultiSelected] = useState(new Set()) // Set of furniture ids
  const [groups, setGroups] = useState([]) // [{ id, memberIds: [id,...] }, ...]
  const [rubberBand, setRubberBand] = useState(null) // { x1, y1, x2, y2 } for drag-select
  const [alignGuides, setAlignGuides] = useState([]) // [{ axis: 'x'|'y', pos, type: 'edge'|'center' }]
  const [snapToWalls, setSnapToWalls] = useState(true)
  const ALIGN_THRESHOLD = 6 // pixels within which to snap/show guide

  // Curved wall state
  const [arcDrawStep, setArcDrawStep] = useState(0) // 0=start, 1=end, 2=bulge
  const [arcPoints, setArcPoints] = useState({ start: null, end: null, bulge: null })

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState(null)
  const [drawEnd, setDrawEnd] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState(null)

  // Furniture placement
  const [furnitureToPlace, setFurnitureToPlace] = useState(null)
  const [furnitureCategory, setFurnitureCategory] = useState('all')
  const [furnitureSearch, setFurnitureSearch] = useState('')

  // Panels
  const [rightPanel, setRightPanel] = useState('furniture') // furniture, templates, export, 3d
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showLayoutGenerator, setShowLayoutGenerator] = useState(false)

  // 3D preview
  const [show3D, setShow3D] = useState(false)

  // Product import dialog
  const [showImportDialog, setShowImportDialog] = useState(false)
  // Product browser (catalog)
  const [showProductBrowser, setShowProductBrowser] = useState(false)
  const [showPhotoImport, setShowPhotoImport] = useState(false)
  const [showFinishPairing, setShowFinishPairing] = useState(false)


  // History for undo/redo
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const canvasRef = useRef(null)
  const canvas3DRef = useRef(null)

  // Use a ref to track if we're loading from floors to prevent circular syncs
  const syncingFromFloors = React.useRef(false)
  const hasInitialized = React.useRef(false)

  // Helper to update active floor data (batched)
  const updateActiveFloor = useCallback((updates) => {
    syncingFromFloors.current = true
    setFloors(prev => {
      const updated = prev.map(f =>
        f.id === activeFloor ? { ...f, ...updates } : f
      )
      syncingFromFloors.current = false
      return updated
    })
  }, [activeFloor])

  // Load initial data (with backwards compatibility for non-floor format)
  useEffect(() => {
    if (initialData && typeof initialData === 'object' && Object.keys(initialData).length > 0) {
      let loadedFloors
      // Check if data has floors structure
      if (initialData.floors) {
        loadedFloors = initialData.floors
        if (initialData.activeFloor) setActiveFloor(initialData.activeFloor)
      } else {
        // Backwards compatibility: wrap old format into single floor
        loadedFloors = [createEmptyFloor(1)]
        if (initialData.walls) loadedFloors[0].walls = initialData.walls
        if (initialData.doors) loadedFloors[0].doors = initialData.doors
        if (initialData.windows) loadedFloors[0].windows = initialData.windows
        if (initialData.furniture) loadedFloors[0].furniture = initialData.furniture
        if (initialData.measurements) loadedFloors[0].measurements = initialData.measurements
        if (initialData.annotations) loadedFloors[0].annotations = initialData.annotations
        if (initialData.roomLabels) loadedFloors[0].roomLabels = initialData.roomLabels
        if (initialData.placedSymbols) loadedFloors[0].placedSymbols = initialData.placedSymbols
      }
      // Set floors and immediately sync local drawing state
      syncingFromFloors.current = true
      setFloors(loadedFloors)
      const floor = loadedFloors.find(f => f.id === activeFloor) || loadedFloors[0]
      if (floor) {
        setWalls(floor.walls || [])
        setDoors(floor.doors || [])
        setWindows(floor.windows || [])
        setFurniture(floor.furniture || [])
        setMeasurements(floor.measurements || [])
        setAnnotations(floor.annotations || [])
        setRoomLabels(floor.roomLabels || [])
        setPlacedSymbols(floor.placedSymbols || [])
      }
      syncingFromFloors.current = false
      hasInitialized.current = true
      if (initialData.nextId) nextId = initialData.nextId
    }
  }, [initialData])

  // Sync local state when user switches floors (skip mount — initialData effect handles that)
  const prevActiveFloor = React.useRef(activeFloor)
  useEffect(() => {
    if (prevActiveFloor.current === activeFloor) {
      // Same floor — skip (mount case or no change)
      return
    }
    prevActiveFloor.current = activeFloor
    const floor = floors.find(f => f.id === activeFloor)
    if (floor) {
      syncingFromFloors.current = true
      setWalls(floor.walls || [])
      setDoors(floor.doors || [])
      setWindows(floor.windows || [])
      setFurniture(floor.furniture || [])
      setMeasurements(floor.measurements || [])
      setAnnotations(floor.annotations || [])
      setRoomLabels(floor.roomLabels || [])
      setPlacedSymbols(floor.placedSymbols || [])
      syncingFromFloors.current = false
    }
  }, [activeFloor])

  // Update active floor when any element changes (prevent circular sync)
  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ walls })
    }
  }, [walls, updateActiveFloor])

  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ doors })
    }
  }, [doors, updateActiveFloor])

  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ windows })
    }
  }, [windows, updateActiveFloor])

  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ furniture })
    }
  }, [furniture, updateActiveFloor])

  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ measurements })
    }
  }, [measurements, updateActiveFloor])

  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ annotations })
    }
  }, [annotations, updateActiveFloor])

  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ roomLabels })
    }
  }, [roomLabels, updateActiveFloor])

  useEffect(() => {
    if (!syncingFromFloors.current) {
      updateActiveFloor({ placedSymbols })
    }
  }, [placedSymbols, updateActiveFloor])

  // Save state to history
  const pushHistory = useCallback(() => {
    const state = {
      walls: [...walls],
      doors: [...doors],
      windows: [...windows],
      furniture: [...furniture],
      measurements: [...measurements],
      annotations: [...annotations],
      roomLabels: [...roomLabels],
      placedSymbols: [...placedSymbols],
      floors: floors.map(f => ({ ...f }))
    }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [walls, doors, windows, furniture, measurements, annotations, roomLabels, placedSymbols, floors, history, historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1]
      if (prev.floors) setFloors(prev.floors)
      setWalls(prev.walls)
      setDoors(prev.doors)
      setWindows(prev.windows)
      setFurniture(prev.furniture)
      setMeasurements(prev.measurements || [])
      setAnnotations(prev.annotations || [])
      setRoomLabels(prev.roomLabels || [])
      setPlacedSymbols(prev.placedSymbols || [])
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1]
      if (next.floors) setFloors(next.floors)
      setWalls(next.walls)
      setDoors(next.doors)
      setWindows(next.windows)
      setFurniture(next.furniture)
      setMeasurements(next.measurements || [])
      setAnnotations(next.annotations || [])
      setRoomLabels(next.roomLabels || [])
      setPlacedSymbols(next.placedSymbols || [])
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Callback when a product is imported from URL and user clicks "Place on Floor Plan"
  const handleProductImported = useCallback((importResult) => {
    if (!importResult?.furnitureItem) return
    const fi = importResult.furnitureItem
    pushHistory()
    const newId = genId()
    // Place imported furniture — use pixel width/height directly (fPxW/fPxH handle both formats)
    setFurniture(prev => [...prev, {
      id: newId,
      type: fi.type || 'generic',
      label: fi.label || importResult.product?.name || 'Imported',
      x: fi.x ?? 200,
      y: fi.y ?? 200,
      width: fi.width || 60,
      height: fi.height || 60,
      rotation: fi.rotation || 0,
      color: fi.color || FURNITURE_COLORS.seatingPrimaryIndigoPurple,
      productId: fi.productId,
      vendorName: fi.vendorName,
      renderProfile: fi.renderProfile || null,
      category: 'imported',
    }])
    // Switch to select tool and auto-select so user can drag immediately
    setTool('select')
    setFurnitureToPlace(null)
    setSelected({ type: 'furniture', id: newId })
    setShowImportDialog(false)
  }, [pushHistory])

  // Callback when a product is selected from the product browser catalog
  const handleProductBrowserSelect = useCallback((productItem) => {
    if (!productItem) return
    pushHistory()
    const newId = genId()
    setFurniture(prev => [...prev, {
      id: newId,
      type: productItem.type || 'generic',
      label: productItem.label || 'Product',
      x: 200,
      y: 200,
      width: productItem.width || 60,
      height: productItem.height || 60,
      rotation: 0,
      color: productItem.color || FURNITURE_COLORS.seatingPrimaryIndigoPurple,
      productId: productItem.productId,
      vendorName: productItem.vendorName,
      renderProfile: productItem.renderProfile || null,
      category: 'imported',
    }])
    // Switch to select tool and auto-select the placed item so user can drag it immediately
    setTool('select')
    setFurnitureToPlace(null)
    setSelected({ type: 'furniture', id: newId })
    setShowProductBrowser(false)
  }, [pushHistory])

  // Get canvas data for saving
  const getCanvasData = useCallback(() => {
    return { floors, activeFloor, nextId, dimensions }
  }, [floors, activeFloor, dimensions])

  // Canvas coordinates from mouse event
  // Accounts for CSS display size vs canvas internal resolution (1200x800)
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: ((e.clientX - rect.left) * scaleX - pan.x) / zoom,
      y: ((e.clientY - rect.top) * scaleY - pan.y) / zoom,
    }
  }

  // ─── Smart alignment guides ─────────────────────────────────
  // Returns { guides, snappedX, snappedY } for the dragged item
  const calcAlignmentGuides = useCallback((draggedId, proposedX, proposedY) => {
    const f = furniture.find(item => item.id === draggedId)
    if (!f) return { guides: [], snappedX: proposedX, snappedY: proposedY }
    const w = fPxW(f), h = fPxH(f)
    const dragEdges = {
      left: proposedX, right: proposedX + w, centerX: proposedX + w / 2,
      top: proposedY, bottom: proposedY + h, centerY: proposedY + h / 2,
    }
    const guides = []
    let snappedX = proposedX, snappedY = proposedY
    let bestDx = ALIGN_THRESHOLD + 1, bestDy = ALIGN_THRESHOLD + 1

    // Compare against all other furniture
    furniture.forEach(other => {
      if (other.id === draggedId) return
      const ow = fPxW(other), oh = fPxH(other)
      const otherEdges = {
        left: other.x, right: other.x + ow, centerX: other.x + ow / 2,
        top: other.y, bottom: other.y + oh, centerY: other.y + oh / 2,
      }
      // X-axis alignment checks (vertical guide lines)
      const xChecks = [
        { drag: 'left', other: 'left' }, { drag: 'left', other: 'right' },
        { drag: 'right', other: 'left' }, { drag: 'right', other: 'right' },
        { drag: 'centerX', other: 'centerX' },
      ]
      xChecks.forEach(({ drag, other: otherKey }) => {
        const diff = Math.abs(dragEdges[drag] - otherEdges[otherKey])
        if (diff < ALIGN_THRESHOLD && diff < bestDx) {
          bestDx = diff
          snappedX = proposedX + (otherEdges[otherKey] - dragEdges[drag])
          guides.push({ axis: 'x', pos: otherEdges[otherKey], type: drag === 'centerX' ? 'center' : 'edge' })
        }
      })
      // Y-axis alignment checks (horizontal guide lines)
      const yChecks = [
        { drag: 'top', other: 'top' }, { drag: 'top', other: 'bottom' },
        { drag: 'bottom', other: 'top' }, { drag: 'bottom', other: 'bottom' },
        { drag: 'centerY', other: 'centerY' },
      ]
      yChecks.forEach(({ drag, other: otherKey }) => {
        const diff = Math.abs(dragEdges[drag] - otherEdges[otherKey])
        if (diff < ALIGN_THRESHOLD && diff < bestDy) {
          bestDy = diff
          snappedY = proposedY + (otherEdges[otherKey] - dragEdges[drag])
          guides.push({ axis: 'y', pos: otherEdges[otherKey], type: drag === 'centerY' ? 'center' : 'edge' })
        }
      })
    })

    // Snap to wall edges
    if (snapToWalls) {
      walls.forEach(wall => {
        // Horizontal walls — snap furniture top/bottom to wall y
        if (Math.abs(wall.y1 - wall.y2) < 2) {
          const wy = wall.y1
          ;[{ drag: 'top', val: dragEdges.top }, { drag: 'bottom', val: dragEdges.bottom }].forEach(({ drag, val }) => {
            const diff = Math.abs(val - wy)
            if (diff < ALIGN_THRESHOLD && diff < bestDy) {
              bestDy = diff
              snappedY = proposedY + (wy - val)
              guides.push({ axis: 'y', pos: wy, type: 'wall' })
            }
          })
        }
        // Vertical walls — snap furniture left/right to wall x
        if (Math.abs(wall.x1 - wall.x2) < 2) {
          const wx = wall.x1
          ;[{ drag: 'left', val: dragEdges.left }, { drag: 'right', val: dragEdges.right }].forEach(({ drag, val }) => {
            const diff = Math.abs(val - wx)
            if (diff < ALIGN_THRESHOLD && diff < bestDx) {
              bestDx = diff
              snappedX = proposedX + (wx - val)
              guides.push({ axis: 'x', pos: wx, type: 'wall' })
            }
          })
        }
      })
    }

    return { guides, snappedX, snappedY }
  }, [furniture, walls, snapToWalls])

  // ─── Get all furniture in a group ──────────────────────────
  const getGroupMembers = useCallback((furnitureId) => {
    const group = groups.find(g => g.memberIds.includes(furnitureId))
    return group ? group.memberIds : [furnitureId]
  }, [groups])

  // ─── Calculate room area from walls ─────────────────────────
  const calculateArea = useCallback(() => {
    if (walls.length < 3) return null
    // TODO: Replace with @openscaffold/measure
    // const area = calcPolygonArea(walls.map(w => ({ x: w.x1, y: w.y1 })));
    // const sqFt = convert(area, 'square_units', 'square_feet').value;
    // Use the shoelace formula on wall endpoints
    const points = walls.map(w => ({ x: w.x1, y: w.y1 }))
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    area = Math.abs(area) / 2
    // Convert to square feet
    const sqFt = area / (GRID_SIZE * GRID_SIZE) * (SCALE_FACTOR * SCALE_FACTOR)
    return sqFt.toFixed(1)
  }, [walls])

  // ─── Generate Room Labels ──────────────────────────────────────
  const generateRoomLabels = useCallback(() => {
    if (walls.length < 3) return
    // Compute centroid and area from wall polygon
    const points = walls.map(w => ({ x: w.x1, y: w.y1 }))
    let cx = 0, cy = 0
    points.forEach(p => { cx += p.x; cy += p.y })
    cx /= points.length
    cy /= points.length

    const area = calculateArea()
    const name = prompt('Room name:', 'Living Room')
    if (!name || !name.trim()) return

    pushHistory()
    const newLabel = {
      id: genId(),
      x: Math.round(cx),
      y: Math.round(cy),
      name: name.trim(),
      area: area || null,
    }
    setRoomLabels(prev => [...prev, newLabel])
    setSelected({ type: 'roomLabel', id: newLabel.id })
  }, [walls, calculateArea, pushHistory])

  // ─── Apply room template ─────────────────────────────────────
  const applyTemplate = (template) => {
    pushHistory()
    setWalls(template.walls.map(w => ({ ...w, id: genId() })))
    setDoors(template.doors.map(d => ({ ...d, id: genId() })))
    setWindows(template.windows.map(w => ({ ...w, id: genId() })))
    setFurniture([])
    setMeasurements([])
    setShowTemplateDialog(false)
  }

  // ─── Apply AI-generated layout ──────────────────────────────────
  const applyAILayout = (layout) => {
    pushHistory()
    // Merge AI-generated furniture with existing furniture
    const newFurniture = layout.furniture.map(item => ({
      ...item,
      id: genId()
    }))
    setFurniture(prev => [...prev, ...newFurniture])
  }

  // ─── Export Functions ─────────────────────────────────────────
  const exportToPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a fresh canvas for export at full resolution
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = dimensions.width + 40
    exportCanvas.height = dimensions.height + 40
    const ctx = exportCanvas.getContext('2d')

    // White background
    ctx.fillStyle = FURNITURE_COLORS.canvasFill
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

    ctx.save()
    ctx.translate(20, 20)

    // Draw everything at 1x scale
    drawScene(ctx, false)

    // Title bar
    ctx.fillStyle = FURNITURE_COLORS.canvasText
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Floor Plan', 4, -6)

    const area = calculateArea()
    if (area) {
      ctx.fillStyle = FURNITURE_COLORS.canvasGrid
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`Area: ${area} sq ft`, dimensions.width - 4, -6)
    }

    ctx.restore()

    const link = document.createElement('a')
    link.download = 'floor-plan.png'
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }

  const exportToSVG = () => {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width + 40}" height="${dimensions.height + 60}" viewBox="0 0 ${dimensions.width + 40} ${dimensions.height + 60}">\n`
    svg += `<rect width="100%" height="100%" fill="white"/>\n`
    svg += `<g transform="translate(20,40)">\n`

    // Grid
    svg += `<rect width="${dimensions.width}" height="${dimensions.height}" fill="white" stroke="#94a3b8" stroke-width="2"/>\n`

    // Furniture
    furniture.forEach(f => {
      svg += `<rect x="${f.x}" y="${f.y}" width="${fPxW(f)}" height="${fPxH(f)}" fill="${fColor(f)}cc" rx="2"/>\n`
      svg += `<text x="${f.x + (fPxW(f)) / 2}" y="${f.y + (fPxH(f)) / 2}" fill="white" font-size="10" text-anchor="middle" dominant-baseline="central">${f.label}</text>\n`
    })

    // Walls (straight and curved)
    walls.forEach(w => {
      if (w.curve) {
        const { cx, cy, radius, startAngle, endAngle } = w.curve
        svg += `<path d="M ${w.x1} ${w.y1} A ${radius} ${radius} 0 0 0 ${w.x2} ${w.y2}" stroke="#1e293b" stroke-width="6" stroke-linecap="round" fill="none"/>\n`
        const len = arcLength(w.curve)
        const mx = (w.x1 + w.x2) / 2
        const my = (w.y1 + w.y2) / 2
        svg += `<text x="${mx}" y="${my - 8}" fill="#64748b" font-size="10" text-anchor="middle">${formatMeasurement(len)}</text>\n`
      } else {
        svg += `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>\n`
        const len = Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2)
        const mx = (w.x1 + w.x2) / 2
        const my = (w.y1 + w.y2) / 2
        svg += `<text x="${mx}" y="${my - 8}" fill="#64748b" font-size="10" text-anchor="middle">${formatMeasurement(len)}</text>\n`
      }
    })

    // Doors
    doors.forEach(d => {
      svg += `<g transform="translate(${d.x},${d.y}) rotate(${d.rotation || 0})">\n`
      svg += `<path d="M 0 0 A ${d.width || 40} ${d.width || 40} 0 0 0 0 ${-(d.width || 40)}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 3"/>\n`
      svg += `<line x1="0" y1="0" x2="${d.width || 40}" y2="0" stroke="#f59e0b" stroke-width="3"/>\n`
      svg += `</g>\n`
    })

    // Windows
    windows.forEach(w => {
      svg += `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="#06b6d4" stroke-width="4"/>\n`
    })

    // Measurements
    measurements.forEach(m => {
      const len = Math.sqrt((m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2)
      svg += `<line x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6 3"/>\n`
      const mx = (m.x1 + m.x2) / 2
      const my = (m.y1 + m.y2) / 2
      svg += `<rect x="${mx - 28}" y="${my - 18}" width="56" height="16" rx="3" fill="#ef4444"/>\n`
      svg += `<text x="${mx}" y="${my - 8}" fill="white" font-size="10" text-anchor="middle">${formatMeasurement(len)}</text>\n`
    })

    // Title
    svg += `<text x="4" y="-10" fill="#1e293b" font-size="14" font-weight="bold">Floor Plan</text>\n`
    const area = calculateArea()
    if (area) {
      svg += `<text x="${dimensions.width - 4}" y="-10" fill="#64748b" font-size="11" text-anchor="end">Area: ${area} sq ft</text>\n`
    }

    svg += `</g>\n</svg>`

    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = 'floor-plan.svg'
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  // Shared draw function used by both render loop and export
  const drawScene = (ctx, includeGrid = true) => {
    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    // Grid (layer-aware)
    if (includeGrid && showGrid && layers.grid) {
      // 6-inch minor grid (every GRID_SIZE px)
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= dimensions.width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dimensions.height); ctx.stroke()
      }
      for (let y = 0; y <= dimensions.height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dimensions.width, y); ctx.stroke()
      }
      // 1-foot major grid (every 2 grid units = 12")
      const footPx = GRID_SIZE * 2
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 0.8
      for (let x = 0; x <= dimensions.width; x += footPx) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dimensions.height); ctx.stroke()
      }
      for (let y = 0; y <= dimensions.height; y += footPx) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dimensions.width, y); ctx.stroke()
      }
      // Foot-mark labels along top and left edges
      ctx.fillStyle = '#94a3b8'
      ctx.font = '9px system-ui, sans-serif'
      ctx.textAlign = 'center'
      for (let x = footPx; x < dimensions.width; x += footPx) {
        const ft = Math.round(x / footPx)
        ctx.fillText(`${ft}'`, x, -4)
      }
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (let y = footPx; y < dimensions.height; y += footPx) {
        const ft = Math.round(y / footPx)
        ctx.fillText(`${ft}'`, -6, y)
      }
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
    }

    // Border
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, dimensions.width, dimensions.height)

    // ── Furniture (light outline weight: 1px) ──
    if (layers.furniture) {
      furniture.forEach((f) => {
        const isSelected = selected?.type === 'furniture' && selected?.id === f.id
        ctx.save()
        ctx.translate(f.x + (fPxW(f)) / 2, f.y + (fPxH(f)) / 2)
        ctx.rotate(((f.rotation || 0) * Math.PI) / 180)
        ctx.translate(-(fPxW(f)) / 2, -(fPxH(f)) / 2)

        ctx.fillStyle = 'rgba(0,0,0,0.08)'
        ctx.fillRect(2, 2, fPxW(f), fPxH(f))

        ctx.fillStyle = fColor(f) + (isSelected ? '' : 'cc')
        ctx.fillRect(0, 0, fPxW(f), fPxH(f))

        // Light outline
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, fPxW(f), fPxH(f))

        if (isSelected) {
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          ctx.strokeRect(-2, -2, fPxW(f) + 4, fPxH(f) + 4)
          ctx.setLineDash([])
        }

        ctx.fillStyle = '#ffffff'
        ctx.font = `${Math.min(11, fPxW(f) * 0.15)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(f.label, (fPxW(f)) / 2, (fPxH(f)) / 2)
        ctx.restore()
      })
    }

    // ── Walls (heavy weight: 8px, selected 10px) ──
    if (layers.walls) {
      walls.forEach((wall) => {
        const isSelected = selected?.type === 'wall' && selected?.id === wall.id
        ctx.strokeStyle = isSelected ? '#3b82f6' : '#1e293b'
        ctx.lineWidth = isSelected ? 10 : 8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(wall.x1, wall.y1)

        if (wall.curve) {
          const { cx, cy, radius, startAngle, endAngle } = wall.curve
          ctx.arc(cx, cy, radius, startAngle, endAngle, false)
        } else {
          ctx.lineTo(wall.x2, wall.y2)
        }
        ctx.stroke()

        // Wall measurement text
        let len
        if (wall.curve) {
          len = arcLength(wall.curve)
        } else {
          len = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2)
        }
        const mx = (wall.x1 + wall.x2) / 2
        const my = (wall.y1 + wall.y2) / 2
        ctx.fillStyle = '#64748b'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(formatMeasurement(len), mx, my - 10)
      })
    }

    // ── Doors (medium weight: 2-3px) ──
    if (layers.doors) {
      doors.forEach((door) => {
        const isSelected = selected?.type === 'door' && selected?.id === door.id
        ctx.save()
        ctx.translate(door.x, door.y)
        ctx.rotate(((door.rotation || 0) * Math.PI) / 180)

        ctx.strokeStyle = isSelected ? '#3b82f6' : '#f59e0b'
        ctx.lineWidth = 2
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.arc(0, 0, door.width || 40, 0, -Math.PI / 2, true)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.strokeStyle = isSelected ? '#3b82f6' : '#f59e0b'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(door.width || 40, 0)
        ctx.stroke()

        if (isSelected) {
          ctx.fillStyle = '#3b82f6'
          ctx.beginPath()
          ctx.arc(0, 0, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })
    }

    // ── Windows (medium weight: 3px) ──
    if (layers.windows) {
      windows.forEach((win) => {
        const isSelected = selected?.type === 'window' && selected?.id === win.id
        ctx.strokeStyle = isSelected ? '#3b82f6' : '#06b6d4'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(win.x1, win.y1)
        ctx.lineTo(win.x2, win.y2)
        ctx.stroke()

        ctx.strokeStyle = isSelected ? '#93c5fd' : '#67e8f9'
        ctx.lineWidth = 1
        const mx = (win.x1 + win.x2) / 2
        const my = (win.y1 + win.y2) / 2
        const dx = win.x2 - win.x1
        const dy = win.y2 - win.y1
        const nx = -dy * 0.15
        const ny = dx * 0.15
        ctx.beginPath()
        ctx.moveTo(mx + nx, my + ny)
        ctx.lineTo(mx - nx, my - ny)
        ctx.stroke()
      })
    }

    // ── Dimensions / Measurements (hairline: 0.75px, architectural style) ──
    if (layers.dimensions) {
      measurements.forEach((m) => {
        const isSelected = selected?.type === 'measurement' && selected?.id === m.id
        const len = Math.sqrt((m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2)
        const angle = Math.atan2(m.y2 - m.y1, m.x2 - m.x1)
        const extLen = 12 // extension line beyond endpoints
        const tickLen = 8
        const offsetDist = 6 // gap between object and extension line start
        const dimColor = isSelected ? '#3b82f6' : '#1e293b'

        ctx.save()

        // Extension lines (perpendicular from endpoints)
        ctx.strokeStyle = dimColor
        ctx.lineWidth = 0.5
        ctx.setLineDash([])
        const perpX = -Math.sin(angle)
        const perpY = Math.cos(angle)
        for (const [px, py] of [[m.x1, m.y1], [m.x2, m.y2]]) {
          ctx.beginPath()
          ctx.moveTo(px + perpX * offsetDist, py + perpY * offsetDist)
          ctx.lineTo(px + perpX * (extLen + tickLen), py + perpY * (extLen + tickLen))
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(px - perpX * offsetDist, py - perpY * offsetDist)
          ctx.lineTo(px - perpX * (extLen + tickLen), py - perpY * (extLen + tickLen))
          ctx.stroke()
        }

        // Dimension line (solid, hairline)
        ctx.strokeStyle = dimColor
        ctx.lineWidth = 0.75
        ctx.beginPath()
        ctx.moveTo(m.x1, m.y1)
        ctx.lineTo(m.x2, m.y2)
        ctx.stroke()

        // Architectural ticks at endpoints (45-degree slash marks)
        ctx.lineWidth = 1.5
        const slashLen = 5
        for (const [px, py] of [[m.x1, m.y1], [m.x2, m.y2]]) {
          ctx.beginPath()
          ctx.moveTo(px - slashLen, py + slashLen)
          ctx.lineTo(px + slashLen, py - slashLen)
          ctx.stroke()
        }

        // Dimension text (centered, white background for readability)
        const mx = (m.x1 + m.x2) / 2
        const my = (m.y1 + m.y2) / 2
        const label = formatMeasurement(len)
        ctx.font = 'bold 10px sans-serif'
        const textW = ctx.measureText(label).width + 8

        // White knockout behind text
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(mx - textW / 2, my - 14, textW, 14)

        // Text
        ctx.fillStyle = dimColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, mx, my - 7)

        ctx.restore()
      })
    }

    // ── Annotations (text labels on canvas) ──
    if (layers.annotations) {
      annotations.forEach((a) => {
        const isSelected = selected?.type === 'annotation' && selected?.id === a.id
        ctx.save()
        ctx.translate(a.x, a.y)
        if (a.rotation) ctx.rotate((a.rotation * Math.PI) / 180)
        const fontSize = a.fontSize || 12
        ctx.font = `${fontSize}px sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        // Background highlight for readability
        const metrics = ctx.measureText(a.text)
        const textH = fontSize * 1.3
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillRect(-2, -2, metrics.width + 4, textH + 2)

        ctx.fillStyle = isSelected ? '#3b82f6' : '#334155'
        ctx.fillText(a.text, 0, 0)

        if (isSelected) {
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 1
          ctx.setLineDash([3, 3])
          ctx.strokeRect(-3, -3, metrics.width + 6, textH + 4)
          ctx.setLineDash([])
        }
        ctx.restore()
      })
    }

    // ── Room Labels (auto-area) ──
    if (layers.roomLabels) {
      roomLabels.forEach((rl) => {
        const isSelected = selected?.type === 'roomLabel' && selected?.id === rl.id
        ctx.save()
        ctx.translate(rl.x, rl.y)

        // Room name
        ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const nameW = ctx.measureText(rl.name).width + 12

        // Background pill
        ctx.fillStyle = isSelected ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.roundRect(-nameW / 2, -22, nameW, rl.area ? 38 : 22, 6)
        ctx.fill()
        if (isSelected) {
          ctx.strokeStyle = '#4F46E5'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        ctx.fillStyle = isSelected ? '#4F46E5' : '#1e293b'
        ctx.fillText(rl.name, 0, -10)

        // Area text
        if (rl.area) {
          ctx.font = '10px sans-serif'
          ctx.fillStyle = '#64748b'
          ctx.fillText(`${rl.area} sq ft`, 0, 6)
        }

        ctx.restore()
      })
    }

    // ── Placed Symbols ──
    placedSymbols.forEach((sym) => {
      const isSelected = selected?.type === 'symbol' && selected?.id === sym.id
      drawSymbol(ctx, sym.key, sym.x, sym.y, {
        scale: sym.scale || 1.2,
        rotation: sym.rotation || 0,
        color: isSelected ? '#3b82f6' : '#1e293b',
        lineWidth: isSelected ? 2 : 1.5,
      })
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        const sz = (sym.scale || 1.2) * 20
        ctx.strokeRect(sym.x - sz / 2 - 2, sym.y - sz / 2 - 2, sz + 4, sz + 4)
        ctx.setLineDash([])
      }
    })
  }

  // ─── Snap Engine ─────────────────────────────────────────────
  useEffect(() => {
    if (!snapEngineRef.current) {
      snapEngineRef.current = new SnapEngine(walls, doors, windows, furniture, GRID_SIZE)
    } else {
      snapEngineRef.current.update(walls, doors, windows, furniture)
    }
    const activeModes = Object.entries(snapModes).filter(([, v]) => v).map(([k]) => k)
    snapEngineRef.current.setModes(activeModes)
  }, [walls, doors, windows, furniture, snapModes])

  // ─── Main canvas draw ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    drawScene(ctx, true)

    // Draw active drawing preview
    if (isDrawing && drawStart && drawEnd) {
      if (tool === 'wall') {
        ctx.strokeStyle = '#6366f1'
        ctx.lineWidth = 6
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.moveTo(drawStart.x, drawStart.y)
        ctx.lineTo(drawEnd.x, drawEnd.y)
        ctx.stroke()
        ctx.setLineDash([])

        // Live measurement while drawing
        const len = Math.sqrt((drawEnd.x - drawStart.x) ** 2 + (drawEnd.y - drawStart.y) ** 2)
        const mx = (drawStart.x + drawEnd.x) / 2
        const my = (drawStart.y + drawEnd.y) / 2
        ctx.fillStyle = '#6366f1'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(formatMeasurement(len), mx, my - 12)
      } else if (tool === 'arc-wall') {
        // Arc wall drawing preview
        ctx.strokeStyle = '#a855f7'
        ctx.lineWidth = 6
        ctx.setLineDash([6, 6])

        if (arcDrawStep === 0) {
          // Show start point
          ctx.fillStyle = '#a855f7'
          ctx.beginPath()
          ctx.arc(drawStart.x, drawStart.y, 4, 0, Math.PI * 2)
          ctx.fill()
        } else if (arcDrawStep === 1) {
          // Show start and end points
          ctx.beginPath()
          ctx.moveTo(drawStart.x, drawStart.y)
          ctx.lineTo(drawEnd.x, drawEnd.y)
          ctx.stroke()
          ctx.fillStyle = '#a855f7'
          ctx.beginPath()
          ctx.arc(drawStart.x, drawStart.y, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(drawEnd.x, drawEnd.y, 4, 0, Math.PI * 2)
          ctx.fill()
        } else if (arcDrawStep === 2 && arcPoints.start && arcPoints.end) {
          // Show preview of curved wall
          const curve = calculateArcFromPoints(arcPoints.start.x, arcPoints.start.y, arcPoints.end.x, arcPoints.end.y, drawEnd.x, drawEnd.y)
          if (curve) {
            const { cx, cy, radius, startAngle, endAngle } = curve
            ctx.beginPath()
            ctx.arc(cx, cy, radius, startAngle, endAngle, false)
            ctx.stroke()
            const len = arcLength(curve)
            const mx = (arcPoints.start.x + arcPoints.end.x) / 2
            const my = (arcPoints.start.y + arcPoints.end.y) / 2
            ctx.fillStyle = '#a855f7'
            ctx.setLineDash([])
            ctx.font = 'bold 11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(formatMeasurement(len), mx, my - 12)
          }
        }
        ctx.setLineDash([])
      } else if (tool === 'window') {
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 4
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.moveTo(drawStart.x, drawStart.y)
        ctx.lineTo(drawEnd.x, drawEnd.y)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (tool === 'measure') {
        // Measurement preview
        const len = Math.sqrt((drawEnd.x - drawStart.x) ** 2 + (drawEnd.y - drawStart.y) ** 2)
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 3])
        ctx.beginPath()
        ctx.moveTo(drawStart.x, drawStart.y)
        ctx.lineTo(drawEnd.x, drawEnd.y)
        ctx.stroke()
        ctx.setLineDash([])

        const mx = (drawStart.x + drawEnd.x) / 2
        const my = (drawStart.y + drawEnd.y) / 2
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(formatMeasurement(len), mx, my - 12)
      } else if (tool === 'dimension') {
        // Architectural dimension preview
        const len = Math.sqrt((drawEnd.x - drawStart.x) ** 2 + (drawEnd.y - drawStart.y) ** 2)
        const angle = Math.atan2(drawEnd.y - drawStart.y, drawEnd.x - drawStart.x)
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 0.75
        ctx.beginPath()
        ctx.moveTo(drawStart.x, drawStart.y)
        ctx.lineTo(drawEnd.x, drawEnd.y)
        ctx.stroke()
        // Tick marks
        ctx.lineWidth = 1.5
        const sl = 5
        for (const [px, py] of [[drawStart.x, drawStart.y], [drawEnd.x, drawEnd.y]]) {
          ctx.beginPath()
          ctx.moveTo(px - sl, py + sl)
          ctx.lineTo(px + sl, py - sl)
          ctx.stroke()
        }
        const mx = (drawStart.x + drawEnd.x) / 2
        const my = (drawStart.y + drawEnd.y) / 2
        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(formatMeasurement(len), mx, my - 8)
      }
    }

    // Furniture placement preview
    if (furnitureToPlace && drawEnd) {
      ctx.globalAlpha = 0.5
      ctx.fillStyle = furnitureToPlace.color
      ctx.fillRect(snapToGrid(drawEnd.x), snapToGrid(drawEnd.y), furnitureToPlace.w * GRID_SIZE, furnitureToPlace.h * GRID_SIZE)
      ctx.globalAlpha = 1
    }

    // ── Multi-select highlights ──
    if (multiSelected.size > 0) {
      furniture.forEach(f => {
        if (!multiSelected.has(f.id)) return
        if (selected?.type === 'furniture' && selected.id === f.id) return // already highlighted
        ctx.save()
        ctx.strokeStyle = '#8b5cf6'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(f.x - 2, f.y - 2, fPxW(f) + 4, fPxH(f) + 4)
        ctx.setLineDash([])
        ctx.restore()
      })
    }

    // ── Alignment guide lines ──
    if (alignGuides.length > 0) {
      alignGuides.forEach(guide => {
        ctx.save()
        ctx.strokeStyle = guide.type === 'wall' ? '#f59e0b' : guide.type === 'center' ? '#ec4899' : '#3b82f6'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        if (guide.axis === 'x') {
          ctx.moveTo(guide.pos, 0); ctx.lineTo(guide.pos, dimensions.height)
        } else {
          ctx.moveTo(0, guide.pos); ctx.lineTo(dimensions.width, guide.pos)
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      })
    }

    // ── Rubber-band selection rectangle ──
    if (rubberBand) {
      const rx = Math.min(rubberBand.x1, rubberBand.x2)
      const ry = Math.min(rubberBand.y1, rubberBand.y2)
      const rw = Math.abs(rubberBand.x2 - rubberBand.x1)
      const rh = Math.abs(rubberBand.y2 - rubberBand.y1)
      ctx.save()
      ctx.fillStyle = 'rgba(99, 102, 241, 0.08)'
      ctx.fillRect(rx, ry, rw, rh)
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.strokeRect(rx, ry, rw, rh)
      ctx.setLineDash([])
      ctx.restore()
    }

    // ── Locked item indicators ──
    furniture.forEach(f => {
      if (!f.locked) return
      ctx.save()
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath()
      ctx.arc(f.x + fPxW(f) - 6, f.y + 6, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = '7px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🔒', f.x + fPxW(f) - 6, f.y + 6)
      ctx.restore()
    })

    // ── Snap indicator ──
    if (activeSnap && (isDrawing || tool === 'dimension' || tool === 'measure')) {
      drawSnapIndicator(ctx, activeSnap)
    }

    // ── Symbol placement ghost ──
    if (symbolToPlace && drawEnd) {
      ctx.globalAlpha = 0.5
      drawSymbol(ctx, symbolToPlace, drawEnd.x, drawEnd.y, { scale: 1.2, color: '#6366f1' })
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }, [walls, doors, windows, furniture, measurements, selected, showGrid, zoom, pan, dimensions, isDrawing, drawStart, drawEnd, tool, furnitureToPlace, arcDrawStep, arcPoints, multiSelected, alignGuides, rubberBand, layers, annotations, roomLabels, placedSymbols, activeSnap, symbolToPlace])

  // ─── 3D Isometric Preview ─────────────────────────────────────
  useEffect(() => {
    if (!show3D) return
    const canvas = canvas3DRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cw = canvas.width
    const ch = canvas.height

    ctx.clearRect(0, 0, cw, ch)
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, cw, ch)

    // Isometric transform helpers
    const isoScale = 0.4
    const wallHeight = 60
    const offsetX = cw / 2
    const offsetY = ch * 0.3

    const toIso = (x, y, z = 0) => {
      const ix = (x - y) * Math.cos(Math.PI / 6) * isoScale
      const iy = (x + y) * Math.sin(Math.PI / 6) * isoScale - z * isoScale
      return { x: ix + offsetX, y: iy + offsetY }
    }

    // Draw floor
    if (walls.length > 0) {
      ctx.fillStyle = '#e2e8f0'
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1
      ctx.beginPath()
      const firstPt = toIso(walls[0].x1, walls[0].y1)
      ctx.moveTo(firstPt.x, firstPt.y)
      walls.forEach(w => {
        const pt = toIso(w.x2, w.y2)
        ctx.lineTo(pt.x, pt.y)
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    // Draw walls (3D) — drawn first with transparency so furniture inside is visible
    walls.forEach(wall => {
      const p1Bottom = toIso(wall.x1, wall.y1)
      const p2Bottom = toIso(wall.x2, wall.y2)
      const p1Top = toIso(wall.x1, wall.y1, wallHeight)
      const p2Top = toIso(wall.x2, wall.y2, wallHeight)

      // Wall face (semi-transparent so furniture shows through)
      ctx.fillStyle = '#94a3b8aa'
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(p1Bottom.x, p1Bottom.y)
      ctx.lineTo(p2Bottom.x, p2Bottom.y)
      ctx.lineTo(p2Top.x, p2Top.y)
      ctx.lineTo(p1Top.x, p1Top.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Wall top
      ctx.fillStyle = '#cbd5e1cc'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(p1Top.x, p1Top.y)
      ctx.lineTo(p2Top.x, p2Top.y)
      ctx.lineTo(p2Top.x - 2, p2Top.y - 1)
      ctx.lineTo(p1Top.x - 2, p1Top.y - 1)
      ctx.closePath()
      ctx.fill()
    })

    // Draw furniture (on floor) — drawn after walls so always visible
    furniture.forEach(f => {
      const corners = [
        toIso(f.x, f.y),
        toIso(f.x + fPxW(f), f.y),
        toIso(f.x + fPxW(f), f.y + fPxH(f)),
        toIso(f.x, f.y + fPxH(f)),
      ]

      const fh = Math.min(fPxH(f), fPxW(f)) / GRID_SIZE * 4 // furniture height in iso units
      const topCorners = [
        toIso(f.x, f.y, fh),
        toIso(f.x + fPxW(f), f.y, fh),
        toIso(f.x + fPxW(f), f.y + fPxH(f), fh),
        toIso(f.x, f.y + fPxH(f), fh),
      ]

      // Right face
      ctx.fillStyle = fColor(f) + 'cc'
      ctx.beginPath()
      ctx.moveTo(corners[1].x, corners[1].y)
      ctx.lineTo(corners[2].x, corners[2].y)
      ctx.lineTo(topCorners[2].x, topCorners[2].y)
      ctx.lineTo(topCorners[1].x, topCorners[1].y)
      ctx.closePath()
      ctx.fill()

      // Left face
      ctx.fillStyle = fColor(f) + '99'
      ctx.beginPath()
      ctx.moveTo(corners[2].x, corners[2].y)
      ctx.lineTo(corners[3].x, corners[3].y)
      ctx.lineTo(topCorners[3].x, topCorners[3].y)
      ctx.lineTo(topCorners[2].x, topCorners[2].y)
      ctx.closePath()
      ctx.fill()

      // Top face
      ctx.fillStyle = fColor(f) + 'ee'
      ctx.beginPath()
      ctx.moveTo(topCorners[0].x, topCorners[0].y)
      ctx.lineTo(topCorners[1].x, topCorners[1].y)
      ctx.lineTo(topCorners[2].x, topCorners[2].y)
      ctx.lineTo(topCorners[3].x, topCorners[3].y)
      ctx.closePath()
      ctx.fill()

      // Outline for definition
      ctx.strokeStyle = fColor(f)
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(topCorners[0].x, topCorners[0].y)
      ctx.lineTo(topCorners[1].x, topCorners[1].y)
      ctx.lineTo(topCorners[2].x, topCorners[2].y)
      ctx.lineTo(topCorners[3].x, topCorners[3].y)
      ctx.closePath()
      ctx.stroke()

      // Label on top
      const center = toIso(f.x + (fPxW(f)) / 2, f.y + (fPxH(f)) / 2, fh)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(f.label, center.x, center.y)
    })

    // Draw windows on walls (glass rectangles)
    windows.forEach(win => {
      const wh1 = wallHeight * 0.3
      const wh2 = wallHeight * 0.8
      const p1Low = toIso(win.x1, win.y1, wh1)
      const p2Low = toIso(win.x2, win.y2, wh1)
      const p1High = toIso(win.x1, win.y1, wh2)
      const p2High = toIso(win.x2, win.y2, wh2)

      ctx.fillStyle = '#7dd3fc55'
      ctx.strokeStyle = '#06b6d4'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(p1Low.x, p1Low.y)
      ctx.lineTo(p2Low.x, p2Low.y)
      ctx.lineTo(p2High.x, p2High.y)
      ctx.lineTo(p1High.x, p1High.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    })

  }, [show3D, walls, doors, windows, furniture, dimensions])

  // ─── Mouse handlers ────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect() || { width: 1200, height: 800 }
      const sx = (canvas?.width || 1200) / rect.width
      const sy = (canvas?.height || 800) / rect.height
      setPanStart({ x: e.clientX * sx - pan.x, y: e.clientY * sy - pan.y })
      return
    }

    const pos = getCanvasPos(e)

    if (tool === 'select') {
      const clickedFurniture = [...furniture].reverse().find((f) => {
        if (f.locked) return false
        return pos.x >= f.x && pos.x <= f.x + fPxW(f) && pos.y >= f.y && pos.y <= f.y + fPxH(f)
      })
      if (clickedFurniture) {
        // Shift+click for multi-select
        if (e.shiftKey) {
          setMultiSelected(prev => {
            const next = new Set(prev)
            if (next.has(clickedFurniture.id)) next.delete(clickedFurniture.id)
            else next.add(clickedFurniture.id)
            // Also add current single selection to multi
            if (selected?.type === 'furniture' && selected.id !== clickedFurniture.id) next.add(selected.id)
            return next
          })
          setSelected({ type: 'furniture', id: clickedFurniture.id })
          return
        }
        // If clicking a member of a group, select and drag the whole group
        const memberIds = getGroupMembers(clickedFurniture.id)
        if (memberIds.length > 1) {
          setMultiSelected(new Set(memberIds))
        } else {
          setMultiSelected(new Set())
        }
        setSelected({ type: 'furniture', id: clickedFurniture.id })
        setIsDragging(true)
        setDragOffset({ x: pos.x - clickedFurniture.x, y: pos.y - clickedFurniture.y })
        return
      }

      const clickedWall = walls.find((w) => pointToLineDistance(pos.x, pos.y, w.x1, w.y1, w.x2, w.y2) < 10)
      if (clickedWall) { setSelected({ type: 'wall', id: clickedWall.id }); setMultiSelected(new Set()); return }

      const clickedDoor = doors.find((d) => Math.sqrt((pos.x - d.x) ** 2 + (pos.y - d.y) ** 2) < 20)
      if (clickedDoor) { setSelected({ type: 'door', id: clickedDoor.id }); setMultiSelected(new Set()); return }

      const clickedWindow = windows.find((w) => pointToLineDistance(pos.x, pos.y, w.x1, w.y1, w.x2, w.y2) < 10)
      if (clickedWindow) { setSelected({ type: 'window', id: clickedWindow.id }); setMultiSelected(new Set()); return }

      const clickedMeasure = measurements.find((m) => pointToLineDistance(pos.x, pos.y, m.x1, m.y1, m.x2, m.y2) < 10)
      if (clickedMeasure) { setSelected({ type: 'measurement', id: clickedMeasure.id }); setMultiSelected(new Set()); return }

      const clickedAnnotation = annotations.find((a) => {
        const fontSize = a.fontSize || 12
        return pos.x >= a.x - 4 && pos.x <= a.x + 120 && pos.y >= a.y - 4 && pos.y <= a.y + fontSize * 1.3 + 4
      })
      if (clickedAnnotation) { setSelected({ type: 'annotation', id: clickedAnnotation.id }); setMultiSelected(new Set()); return }

      const clickedRoomLabel = roomLabels.find((rl) => Math.sqrt((pos.x - rl.x) ** 2 + (pos.y - rl.y) ** 2) < 30)
      if (clickedRoomLabel) { setSelected({ type: 'roomLabel', id: clickedRoomLabel.id }); setMultiSelected(new Set()); return }

      const clickedSymbol = placedSymbols.find((s) => {
        const sz = (s.scale || 1.2) * 20
        return pos.x >= s.x - sz / 2 && pos.x <= s.x + sz / 2 && pos.y >= s.y - sz / 2 && pos.y <= s.y + sz / 2
      })
      if (clickedSymbol) { setSelected({ type: 'symbol', id: clickedSymbol.id }); setMultiSelected(new Set()); return }

      // Nothing clicked — start rubber-band selection
      setRubberBand({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
      setSelected(null)
      setMultiSelected(new Set())
    } else if (tool === 'wall' || tool === 'window' || tool === 'measure' || tool === 'dimension') {
      setIsDrawing(true)
      setDrawStart({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) })
      setDrawEnd({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) })
    } else if (tool === 'arc-wall') {
      // Arc wall: 3-click mode
      const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) }
      if (arcDrawStep === 0) {
        // First click: start point
        setArcPoints({ start: snappedPos, end: null, bulge: null })
        setDrawStart(snappedPos)
        setDrawEnd(snappedPos)
        setArcDrawStep(1)
        setIsDrawing(true)
      } else if (arcDrawStep === 1) {
        // Second click: end point
        setArcPoints({ ...arcPoints, end: snappedPos })
        setDrawEnd(snappedPos)
        setArcDrawStep(2)
      } else if (arcDrawStep === 2 && arcPoints.start && arcPoints.end) {
        // Third click: finalize with bulge point
        const curve = calculateArcFromPoints(arcPoints.start.x, arcPoints.start.y, arcPoints.end.x, arcPoints.end.y, snappedPos.x, snappedPos.y)
        if (curve) {
          pushHistory()
          setWalls([...walls, { id: genId(), x1: arcPoints.start.x, y1: arcPoints.start.y, x2: arcPoints.end.x, y2: arcPoints.end.y, curve }])
          setIsDrawing(false)
          setArcDrawStep(0)
          setArcPoints({ start: null, end: null, bulge: null })
        }
      }
    } else if (tool === 'door') {
      pushHistory()
      setDoors([...doors, { id: genId(), x: snapToGrid(pos.x), y: snapToGrid(pos.y), width: 40, rotation: 0 }])
    } else if (tool === 'furniture' && furnitureToPlace) {
      pushHistory()
      const newId = genId()
      setFurniture([...furniture, { id: newId, ...furnitureToPlace, x: snapToGrid(pos.x), y: snapToGrid(pos.y), rotation: 0 }])
      // Auto-switch to select after placing so user can immediately drag
      setTool('select')
      setFurnitureToPlace(null)
      setSelected({ type: 'furniture', id: newId })
    } else if (tool === 'annotate') {
      const text = prompt('Enter annotation text:')
      if (text && text.trim()) {
        pushHistory()
        const newId = genId()
        setAnnotations([...annotations, { id: newId, x: snapToGrid(pos.x), y: snapToGrid(pos.y), text: text.trim(), fontSize: 12, rotation: 0 }])
        setSelected({ type: 'annotation', id: newId })
      }
    } else if (tool === 'symbol' && symbolToPlace) {
      pushHistory()
      const newId = genId()
      const newSym = { id: newId, key: symbolToPlace, x: snapToGrid(pos.x), y: snapToGrid(pos.y), scale: 1.2, rotation: 0 }
      setPlacedSymbols([...placedSymbols, newSym])
      setSelected({ type: 'symbol', id: newId })
      setSymbolToPlace(null)
      setTool('select')
    }
  }

  const handleMouseMove = (e) => {
    const pos = getCanvasPos(e)

    if (isPanning && panStart) {
      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect() || { width: 1200, height: 800 }
      const sx = (canvas?.width || 1200) / rect.width
      const sy = (canvas?.height || 800) / rect.height
      setPan({ x: e.clientX * sx - panStart.x, y: e.clientY * sy - panStart.y })
      return
    }

    if (isDrawing) {
      const snapped = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) }
      if (drawStart && tool !== 'measure' && tool !== 'dimension' && tool !== 'arc-wall') {
        const dx = Math.abs(snapped.x - drawStart.x)
        const dy = Math.abs(snapped.y - drawStart.y)
        if (dx > dy && dy < SNAP_THRESHOLD * 2) snapped.y = drawStart.y
        else if (dy > dx && dx < SNAP_THRESHOLD * 2) snapped.x = drawStart.x
      }
      setDrawEnd(snapped)
    } else if (tool === 'arc-wall' && arcDrawStep > 0) {
      // Update bulge preview for arc wall
      const snapped = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) }
      setDrawEnd(snapped)
    } else if (isDragging && selected?.type === 'furniture') {
      const f = furniture.find((f) => f.id === selected.id)
      if (f) {
        const rawX = snapToGrid(pos.x - dragOffset.x)
        const rawY = snapToGrid(pos.y - dragOffset.y)
        // Compute alignment guides + snapping
        const { guides, snappedX, snappedY } = calcAlignmentGuides(f.id, rawX, rawY)
        setAlignGuides(guides)
        const dx = snappedX - f.x, dy = snappedY - f.y
        // Move all items in the group/multi-select together
        const idsToMove = multiSelected.size > 0 ? multiSelected : new Set([f.id])
        setFurniture(furniture.map((item) => {
          if (!idsToMove.has(item.id)) return item
          if (item.id === f.id) return { ...item, x: snappedX, y: snappedY }
          return { ...item, x: item.x + dx, y: item.y + dy }
        }))
      }
    } else if (rubberBand) {
      // Expand rubber-band
      setRubberBand(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null)
    } else if (tool === 'furniture' && furnitureToPlace) {
      setDrawEnd(pos)
    } else if (tool === 'symbol' && symbolToPlace) {
      setDrawEnd(pos)
    }

    // Update snap indicator when in a drawing mode
    if (snapEngineRef.current && (isDrawing || tool === 'dimension' || tool === 'measure')) {
      const snap = snapEngineRef.current.findSnap(pos.x, pos.y, 15)
      setActiveSnap(snap)
    } else {
      if (activeSnap) setActiveSnap(null)
    }
  }

  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); setPanStart(null); return }
    if (isDragging) { pushHistory(); setIsDragging(false); setAlignGuides([]); return }

    // Finalize rubber-band selection
    if (rubberBand) {
      const rx1 = Math.min(rubberBand.x1, rubberBand.x2)
      const ry1 = Math.min(rubberBand.y1, rubberBand.y2)
      const rx2 = Math.max(rubberBand.x1, rubberBand.x2)
      const ry2 = Math.max(rubberBand.y1, rubberBand.y2)
      // Only select if the rubber band is big enough (not a stray click)
      if (rx2 - rx1 > 5 && ry2 - ry1 > 5) {
        const hits = new Set()
        furniture.forEach(f => {
          const fx2 = f.x + fPxW(f), fy2 = f.y + fPxH(f)
          // Item overlaps the rectangle
          if (f.x < rx2 && fx2 > rx1 && f.y < ry2 && fy2 > ry1) hits.add(f.id)
        })
        setMultiSelected(hits)
        if (hits.size === 1) setSelected({ type: 'furniture', id: [...hits][0] })
      }
      setRubberBand(null)
      return
    }

    // Don't finalize on mouseup if drawing arc (waits for clicks)
    if (tool === 'arc-wall') return

    if (isDrawing && drawStart && drawEnd) {
      const dx = drawEnd.x - drawStart.x
      const dy = drawEnd.y - drawStart.y
      const len = Math.sqrt(dx * dx + dy * dy)

      if (len > GRID_SIZE) {
        pushHistory()
        if (tool === 'wall') {
          setWalls([...walls, { id: genId(), x1: drawStart.x, y1: drawStart.y, x2: drawEnd.x, y2: drawEnd.y }])
        } else if (tool === 'window') {
          setWindows([...windows, { id: genId(), x1: drawStart.x, y1: drawStart.y, x2: drawEnd.x, y2: drawEnd.y }])
        } else if (tool === 'measure') {
          setMeasurements([...measurements, { id: genId(), x1: drawStart.x, y1: drawStart.y, x2: drawEnd.x, y2: drawEnd.y }])
        } else if (tool === 'dimension') {
          setMeasurements([...measurements, { id: genId(), x1: drawStart.x, y1: drawStart.y, x2: drawEnd.x, y2: drawEnd.y, style: 'architectural' }])
        }
      }
    }

    setIsDrawing(false)
    setDrawStart(null)
    setDrawEnd(null)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.max(0.25, Math.min(3, z + delta)))
  }

  // ─── Element manipulation ──────────────────────────────────────
  const deleteSelected = () => {
    if (!selected) return
    pushHistory()
    if (selected.type === 'wall') setWalls(walls.filter((w) => w.id !== selected.id))
    if (selected.type === 'door') setDoors(doors.filter((d) => d.id !== selected.id))
    if (selected.type === 'window') setWindows(windows.filter((w) => w.id !== selected.id))
    if (selected.type === 'furniture') setFurniture(furniture.filter((f) => f.id !== selected.id))
    if (selected.type === 'measurement') setMeasurements(measurements.filter((m) => m.id !== selected.id))
    if (selected.type === 'annotation') setAnnotations(annotations.filter((a) => a.id !== selected.id))
    if (selected.type === 'roomLabel') setRoomLabels(roomLabels.filter((rl) => rl.id !== selected.id))
    if (selected.type === 'symbol') setPlacedSymbols(placedSymbols.filter((s) => s.id !== selected.id))
    setSelected(null)
  }

  const rotateSelected = () => {
    if (!selected) return
    pushHistory()
    if (selected.type === 'door') {
      setDoors(doors.map((d) => (d.id === selected.id ? { ...d, rotation: ((d.rotation || 0) + 90) % 360 } : d)))
    }
    if (selected.type === 'furniture') {
      setFurniture(furniture.map((f) => {
        if (f.id !== selected.id) return f
        const newRotation = ((f.rotation || 0) + 90) % 360
        return newRotation % 180 !== (f.rotation || 0) % 180
          ? { ...f, rotation: newRotation, w: f.h, h: f.w }
          : { ...f, rotation: newRotation }
      }))
    }
  }

  const duplicateSelected = () => {
    if (selected?.type === 'furniture') {
      const f = furniture.find((f) => f.id === selected.id)
      if (f) {
        pushHistory()
        const newF = { ...f, id: genId(), x: f.x + GRID_SIZE * 2, y: f.y + GRID_SIZE * 2 }
        setFurniture([...furniture, newF])
        setSelected({ type: 'furniture', id: newF.id })
      }
    }
  }

  // ─── Group / Ungroup / Lock ──────────────────────────────────
  const groupSelected = () => {
    const ids = multiSelected.size > 1 ? [...multiSelected] : []
    if (ids.length < 2) return
    // Remove members from existing groups
    const cleaned = groups.filter(g => !ids.some(id => g.memberIds.includes(id)))
    cleaned.push({ id: genId(), memberIds: ids })
    setGroups(cleaned)
  }

  const ungroupSelected = () => {
    if (!selected?.id) return
    setGroups(groups.filter(g => !g.memberIds.includes(selected.id)))
    setMultiSelected(new Set())
  }

  const toggleLockSelected = () => {
    const idsToLock = multiSelected.size > 0 ? [...multiSelected]
      : selected?.type === 'furniture' ? [selected.id] : []
    if (idsToLock.length === 0) return
    pushHistory()
    const allLocked = idsToLock.every(id => furniture.find(f => f.id === id)?.locked)
    setFurniture(furniture.map(f =>
      idsToLock.includes(f.id) ? { ...f, locked: !allLocked } : f
    ))
  }

  // ─── Align selected items ──────────────────────────────────
  const alignItems = (direction) => {
    const ids = multiSelected.size > 1 ? [...multiSelected] : []
    if (ids.length < 2) return
    pushHistory()
    const items = furniture.filter(f => ids.includes(f.id))
    if (direction === 'left') {
      const minX = Math.min(...items.map(f => f.x))
      setFurniture(furniture.map(f => ids.includes(f.id) ? { ...f, x: minX } : f))
    } else if (direction === 'right') {
      const maxR = Math.max(...items.map(f => f.x + fPxW(f)))
      setFurniture(furniture.map(f => ids.includes(f.id) ? { ...f, x: maxR - fPxW(f) } : f))
    } else if (direction === 'top') {
      const minY = Math.min(...items.map(f => f.y))
      setFurniture(furniture.map(f => ids.includes(f.id) ? { ...f, y: minY } : f))
    } else if (direction === 'bottom') {
      const maxB = Math.max(...items.map(f => f.y + fPxH(f)))
      setFurniture(furniture.map(f => ids.includes(f.id) ? { ...f, y: maxB - fPxH(f) } : f))
    } else if (direction === 'centerH') {
      const avgX = items.reduce((s, f) => s + f.x + fPxW(f) / 2, 0) / items.length
      setFurniture(furniture.map(f => ids.includes(f.id) ? { ...f, x: avgX - fPxW(f) / 2 } : f))
    } else if (direction === 'centerV') {
      const avgY = items.reduce((s, f) => s + f.y + fPxH(f) / 2, 0) / items.length
      setFurniture(furniture.map(f => ids.includes(f.id) ? { ...f, y: avgY - fPxH(f) / 2 } : f))
    }
  }

  // ─── Distribute evenly ──────────────────────────────────────
  const distributeItems = (axis) => {
    const ids = multiSelected.size > 2 ? [...multiSelected] : []
    if (ids.length < 3) return
    pushHistory()
    const items = furniture.filter(f => ids.includes(f.id))
    if (axis === 'horizontal') {
      const sorted = [...items].sort((a, b) => a.x - b.x)
      const first = sorted[0].x, last = sorted[sorted.length - 1].x + fPxW(sorted[sorted.length - 1])
      const totalItemW = sorted.reduce((s, f) => s + fPxW(f), 0)
      const gap = (last - first - totalItemW) / (sorted.length - 1)
      let cx = first
      const updates = {}
      sorted.forEach(f => { updates[f.id] = cx; cx += fPxW(f) + gap })
      setFurniture(furniture.map(f => updates[f.id] !== undefined ? { ...f, x: updates[f.id] } : f))
    } else {
      const sorted = [...items].sort((a, b) => a.y - b.y)
      const first = sorted[0].y, last = sorted[sorted.length - 1].y + fPxH(sorted[sorted.length - 1])
      const totalItemH = sorted.reduce((s, f) => s + fPxH(f), 0)
      const gap = (last - first - totalItemH) / (sorted.length - 1)
      let cy = first
      const updates = {}
      sorted.forEach(f => { updates[f.id] = cy; cy += fPxH(f) + gap })
      setFurniture(furniture.map(f => updates[f.id] !== undefined ? { ...f, y: updates[f.id] } : f))
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
      else if (e.key === 'r' || e.key === 'R') rotateSelected()
      else if (e.key === 'Escape') {
        setSelected(null)
        setMultiSelected(new Set())
        setFurnitureToPlace(null)
        setTool('select')
        setArcDrawStep(0)
        setArcPoints({ start: null, end: null, bulge: null })
        setIsDrawing(false)
        setAlignGuides([])
      }
      else if (e.key === 'v' || e.key === 'V') setTool('select')
      else if (e.key === 'w' || e.key === 'W') setTool('wall')
      else if (e.key === 'a' || e.key === 'A') setTool('arc-wall')
      else if (e.key === 'd' || e.key === 'D') setTool('door')
      else if (e.key === 'm' || e.key === 'M') setTool('measure')
      else if (e.key === 'n' || e.key === 'N') setTool('dimension')
      else if (e.key === 't' || e.key === 'T') setTool('annotate')
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateSelected() }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'g') { e.preventDefault(); e.shiftKey ? ungroupSelected() : groupSelected() }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'l') { e.preventDefault(); toggleLockSelected() }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'a') { e.preventDefault(); setMultiSelected(new Set(furniture.map(f => f.id))) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selected, walls, doors, windows, furniture, measurements, annotations, roomLabels, arcDrawStep, multiSelected, groups])

  const handleSave = () => { if (onSave) onSave(getCanvasData()) }

  const toolButtons = [
    { id: 'select', label: 'Select', icon: MousePointer, shortcut: 'V' },
    { id: 'wall', label: 'Wall', icon: Minus, shortcut: 'W' },
    { id: 'arc-wall', label: 'Curved Wall', icon: CircleDot, shortcut: 'A' },
    { id: 'door', label: 'Door', icon: DoorOpen, shortcut: 'D' },
    { id: 'window', label: 'Window', icon: Square, shortcut: '' },
    { id: 'measure', label: 'Measure', icon: Ruler, shortcut: 'M' },
    { id: 'dimension', label: 'Dimension', icon: ArrowLeftRight, shortcut: 'N' },
    { id: 'annotate', label: 'Annotate', icon: Type, shortcut: 'T' },
  ]

  // Floor management functions
  const addFloor = () => {
    const maxId = Math.max(...floors.map(f => f.id))
    const newFloor = createEmptyFloor(maxId + 1, `Floor ${maxId + 1}`)
    pushHistory()
    setFloors([...floors, newFloor])
  }

  const deleteFloor = (id) => {
    if (floors.length === 1) return
    pushHistory()
    const newFloors = floors.filter(f => f.id !== id)
    setFloors(newFloors)
    if (activeFloor === id) setActiveFloor(newFloors[0].id)
  }

  const duplicateFloor = (id) => {
    const floor = floors.find(f => f.id === id)
    if (!floor) return
    const maxId = Math.max(...floors.map(f => f.id))
    const newFloor = {
      ...floor,
      id: maxId + 1,
      name: `${floor.name} (Copy)`,
    }
    pushHistory()
    setFloors([...floors, newFloor])
  }

  const renameFloor = (id, newName) => {
    pushHistory()
    setFloors(floors.map(f => f.id === id ? { ...f, name: newName } : f))
  }

  const filteredFurniture = FURNITURE_LIBRARY.filter((f) => {
    const matchesCategory = furnitureCategory === 'all' || f.category === furnitureCategory
    const matchesSearch = !furnitureSearch || f.label.toLowerCase().includes(furnitureSearch.toLowerCase()) || f.type.toLowerCase().includes(furnitureSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const area = calculateArea()
  return (
    <div className="flex h-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
      {/* Left toolbar */}
      <div className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-2 gap-1">
        {toolButtons.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTool(t.id); setFurnitureToPlace(null) }}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              tool === t.id && !furnitureToPlace ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
          >
            <t.icon size={18} />
          </button>
        ))}

        <div className="w-6 border-t border-slate-200 my-1" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${showGrid ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}
          title="Toggle Grid"
        >
          <Grid3x3 size={18} />
        </button>

        <button
          onClick={() => setSnapToWalls(!snapToWalls)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${snapToWalls ? 'bg-amber-50 text-amber-600' : 'text-slate-400'}`}
          title="Snap to Walls"
        >
          <Magnet size={18} />
        </button>

        <div className="w-6 border-t border-slate-200 my-1" />

        <button onClick={groupSelected}
          disabled={multiSelected.size < 2}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Group (Cmd+G)">
          <Group size={18} />
        </button>
        <button onClick={ungroupSelected}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Ungroup (Cmd+Shift+G)">
          <Ungroup size={18} />
        </button>
        <button onClick={toggleLockSelected}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Lock/Unlock (Cmd+L)">
          <Lock size={18} />
        </button>

        <div className="w-6 border-t border-slate-200 my-1" />

        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${showLayerPanel ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          title="Layer Visibility"
        >
          <Layers size={18} />
        </button>
        <button
          onClick={generateRoomLabels}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          title="Add Room Label"
        >
          <Tag size={18} />
        </button>

        {multiSelected.size > 1 && (
          <>
            <div className="w-6 border-t border-slate-200 my-1" />
            <button onClick={() => alignItems('left')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Align Left">⫷</button>
            <button onClick={() => alignItems('centerH')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Align Center Horizontal">⫿</button>
            <button onClick={() => alignItems('right')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Align Right">⫸</button>
            <button onClick={() => alignItems('top')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Align Top">⊤</button>
            <button onClick={() => alignItems('centerV')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Align Center Vertical">⊶</button>
            <button onClick={() => alignItems('bottom')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Align Bottom">⊥</button>
            {multiSelected.size > 2 && (
              <>
                <button onClick={() => distributeItems('horizontal')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Distribute Horizontal">⋯</button>
                <button onClick={() => distributeItems('vertical')} className="w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100" title="Distribute Vertical">⋮</button>
              </>
            )}
          </>
        )}

        <div className="w-6 border-t border-slate-200 my-1" />

        <button onClick={undo} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Undo (Cmd+Z)">
          <Undo2 size={18} />
        </button>
        <button onClick={redo} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Redo (Cmd+Shift+Z)">
          <Redo2 size={18} />
        </button>

        <div className="w-6 border-t border-slate-200 my-1" />

        <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Zoom In">
          <ZoomIn size={18} />
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Zoom Out">
          <ZoomOut size={18} />
        </button>

        <div className="w-6 border-t border-slate-200 my-1" />

        {/* Panel toggle buttons */}
        <button
          onClick={() => setShowFloorPanel(!showFloorPanel)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${showFloorPanel ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-100'}`}
          title="Floors"
        >
          <ChevronDown size={18} />
        </button>

        <button
          onClick={() => setShowTemplateDialog(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          title="Room Templates"
        >
          <LayoutTemplate size={18} />
        </button>

        <button
          onClick={() => setShowLayoutGenerator(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors hover:text-indigo-600"
          title="AI Layout Generator"
        >
          <Sparkles size={18} />
        </button>

        <button
          onClick={() => setShow3D(!show3D)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${show3D ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'}`}
          title="3D Preview"
        >
          <Box size={18} />
        </button>

        <button
          onClick={() => setShowPhotoImport(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors hover:text-emerald-600"
          title="Import floor plan from photo"
        >
          <Camera size={18} />
        </button>

        <button
          onClick={() => setShowFinishPairing(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors hover:text-amber-600"
          title="Smart Finish Pairing"
        >
          <Palette size={18} />
        </button>

        <div className="flex-1" />

        {selected && (
          <>
            <button onClick={rotateSelected} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Rotate (R)">
              <RotateCcw size={18} />
            </button>
            <button onClick={duplicateSelected} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Duplicate (Cmd+D)">
              <Copy size={18} />
            </button>
            <button onClick={deleteSelected} className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50" title="Delete">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>

      {/* Canvas area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Top bar */}
        <div className="h-10 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{activeFloorData?.name || 'Floor'}</span>
            <span>
              {tool === 'wall' && 'Click and drag to draw a wall'}
              {tool === 'arc-wall' && arcDrawStep === 0 && 'Click to place the starting point of the arc'}
              {tool === 'arc-wall' && arcDrawStep === 1 && 'Click to place the ending point of the arc'}
              {tool === 'arc-wall' && arcDrawStep === 2 && 'Drag to set the bulge, then click to finalize'}
              {tool === 'door' && 'Click to place a door'}
              {tool === 'window' && 'Click and drag to draw a window'}
              {tool === 'select' && (multiSelected.size > 0
                ? `${multiSelected.size} items selected · Shift+click to add · Cmd+G to group`
                : 'Click to select, drag to move · Shift+click multi-select · Drag empty area to box-select')}
              {tool === 'measure' && 'Click and drag to measure distance'}
              {tool === 'furniture' && furnitureToPlace && `Click to place ${furnitureToPlace.label}`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{Math.round(zoom * 100)}%</span>
            {area && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{area} sq ft</span>}
            <span>{walls.length} walls, {doors.length} doors, {furniture.length} items</span>
          </div>
        </div>

        {/* Canvas + 3D split */}
        <div className={`flex-1 min-h-0 flex ${show3D ? 'flex-row' : ''} overflow-hidden`}>
          {/* 2D Canvas */}
          <div
            className={`${show3D ? 'flex-1' : 'flex-1'} overflow-hidden relative`}
            style={{ cursor: tool === 'select' ? (isDragging ? 'grabbing' : 'default') : 'crosshair' }}
          >
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="block w-full h-full"
            />

            {/* Layer Visibility Panel */}
            {showLayerPanel && (
              <div className="absolute top-3 left-3 w-52 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Layers</span>
                  <button onClick={() => setShowLayerPanel(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                </div>
                <div className="p-2 space-y-0.5">
                  {[
                    { key: 'walls', label: 'Walls' },
                    { key: 'doors', label: 'Doors' },
                    { key: 'windows', label: 'Windows' },
                    { key: 'furniture', label: 'Furniture' },
                    { key: 'dimensions', label: 'Dimensions' },
                    { key: 'annotations', label: 'Annotations' },
                    { key: 'roomLabels', label: 'Room Labels' },
                    { key: 'grid', label: 'Grid' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        layers[key] ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {layers[key] ? <Eye size={14} className="text-indigo-500" /> : <EyeOff size={14} />}
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3D Preview Panel */}
          {show3D && (
            <div className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col">
              <div className="h-8 bg-white border-b border-slate-200 flex items-center justify-between px-3">
                <span className="text-xs font-medium text-slate-600">3D Isometric Preview</span>
                <button onClick={() => setShow3D(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
              <canvas ref={canvas3DRef} width={640} height={480} className="w-full flex-1" />
            </div>
          )}
        </div>
      </div>

      {/* Floor Panel */}
      {showFloorPanel && (
        <div className="w-64 bg-white border-l border-slate-200 flex flex-col">
          <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Floors</span>
            <button onClick={() => setShowFloorPanel(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {floors.map((floor) => (
                <div
                  key={floor.id}
                  className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    activeFloor === floor.id
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                  onClick={() => setActiveFloor(floor.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={floor.name}
                      onChange={(e) => renameFloor(floor.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-sm font-medium bg-transparent border-0 text-slate-800 focus:outline-none focus:bg-white px-0.5 rounded"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <div>Height: {floor.height}'</div>
                    <div>Walls: {floor.walls?.length || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 p-3 space-y-2">
            <button
              onClick={addFloor}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Plus size={16} /> Add Floor
            </button>
            {floors.length > 1 && (
              <>
                <button
                  onClick={() => duplicateFloor(activeFloor)}
                  className="w-full px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => deleteFloor(activeFloor)}
                  className="w-full px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Right panel */}
      <div className="w-56 bg-white border-l border-slate-200 flex flex-col">
        {/* Panel tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setRightPanel('furniture')}
            className={`flex-1 text-[10px] py-2 font-medium transition-colors ${rightPanel === 'furniture' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Furniture
          </button>
          <button
            onClick={() => setRightPanel('export')}
            className={`flex-1 text-[10px] py-2 font-medium transition-colors ${rightPanel === 'export' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Export
          </button>
        </div>

        {rightPanel === 'furniture' && (
          <>
            {/* Import from URL + Browse Catalog buttons */}
            <div className="p-2 border-b border-slate-200 space-y-1.5">
              <button
                onClick={() => setShowProductBrowser(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm"
              >
                <Package size={13} />
                Browse Product Catalog
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-all border border-slate-200"
              >
                <Link2 size={13} />
                Import from URL
              </button>
            </div>

            <div className="p-3 border-b border-slate-200">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Furniture Library <span className="text-slate-400 font-normal">({filteredFurniture.length})</span></h3>
              <input
                type="text"
                placeholder="Search furniture..."
                value={furnitureSearch}
                onChange={(e) => setFurnitureSearch(e.target.value)}
                className="w-full mb-2 px-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300"
              />
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFurnitureCategory(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition-colors ${
                      furnitureCategory === cat ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1.5">
                {filteredFurniture.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => { setTool('furniture'); setFurnitureToPlace(item) }}
                    className={`p-2 rounded-lg text-center transition-colors border ${
                      furnitureToPlace?.type === item.type ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-full aspect-square rounded mb-1 flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                      <div className="rounded" style={{ width: `${Math.min(item.w, item.h) * 4}px`, height: `${Math.max(item.w, item.h) * 4}px`, backgroundColor: item.color, maxWidth: '36px', maxHeight: '36px' }} />
                    </div>
                    <span className="text-[10px] text-slate-600 leading-tight block">{item.label}</span>
                    <span className="text-[9px] text-slate-400">{item.w}×{item.h}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {rightPanel === 'export' && (
          <div className="flex-1 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Export Floor Plan</h3>

            <button
              onClick={exportToPNG}
              className="w-full flex items-center gap-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <FileImage size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-800 block">PNG Image</span>
                <span className="text-[10px] text-slate-500">High-res bitmap image</span>
              </div>
            </button>

            <button
              onClick={exportToSVG}
              className="w-full flex items-center gap-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <FileText size={20} className="text-blue-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-800 block">SVG Vector</span>
                <span className="text-[10px] text-slate-500">Scalable vector graphic</span>
              </div>
            </button>

            <button
              onClick={() => {
                const dxfContent = exportFloorPlanToDXF(walls, doors, windows, furniture, dimensions, SCALE_FACTOR)
                downloadDXF(dxfContent, 'floor-plan.dxf')
              }}
              className="w-full flex items-center gap-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <FileOutput size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-800 block">DXF (AutoCAD)</span>
                <span className="text-[10px] text-slate-500">CAD-compatible drawing file</span>
              </div>
            </button>

            <div className="border-t border-slate-200 pt-3 mt-3 mb-3">
              <h4 className="text-xs font-medium text-slate-600 mb-2">Professional Print</h4>
            </div>

            <button
              onClick={() => setShowPrintPreview(true)}
              className="w-full flex items-center gap-3 px-3 py-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
            >
              <Ruler size={20} className="text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-indigo-800 block">Print to Scale (PDF)</span>
                <span className="text-[10px] text-indigo-500">Architectural scales, title block, scale bar</span>
              </div>
            </button>

            <div className="border-t border-slate-200 pt-3 mt-3 mb-3">
              <h4 className="text-xs font-medium text-slate-600 mb-2">CAD Tools</h4>
            </div>

            <button
              onClick={() => {
                if (walls.length < 3) { alert('Need at least 3 walls for elevations'); return }
                setShowElevationPreview(true)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <LayoutTemplate size={18} className="text-purple-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-800 block">Elevation Views</span>
                <span className="text-[10px] text-slate-500">Side views of walls with doors/windows</span>
              </div>
            </button>

            <button
              onClick={() => setShowSchedulePreview(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Grid3x3 size={18} className="text-teal-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-800 block">Room & Door Schedules</span>
                <span className="text-[10px] text-slate-500">Formatted tables of rooms, doors, windows</span>
              </div>
            </button>

            <button
              onClick={() => setShowSymbolPicker(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Sparkles size={18} className="text-amber-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-800 block">Symbol Library</span>
                <span className="text-[10px] text-slate-500">Electrical, plumbing, HVAC, fire safety</span>
              </div>
            </button>

            <div className="border-t border-slate-200 pt-3 mt-3">
              <h4 className="text-xs font-medium text-slate-600 mb-2">Plan Info</h4>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Walls</span><span className="font-medium text-slate-700">{walls.length}</span></div>
                <div className="flex justify-between"><span>Doors</span><span className="font-medium text-slate-700">{doors.length}</span></div>
                <div className="flex justify-between"><span>Windows</span><span className="font-medium text-slate-700">{windows.length}</span></div>
                <div className="flex justify-between"><span>Furniture</span><span className="font-medium text-slate-700">{furniture.length}</span></div>
                <div className="flex justify-between"><span>Measurements</span><span className="font-medium text-slate-700">{measurements.length}</span></div>
                {area && (
                  <div className="flex justify-between border-t border-slate-100 pt-1.5">
                    <span className="font-medium">Area</span>
                    <span className="font-semibold text-indigo-600">{area} sq ft</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleSave}
            className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Floor Plan
          </button>
        </div>
      </div>

      {/* Room Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Room Templates</h3>
              <button onClick={() => setShowTemplateDialog(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Start with a pre-built room layout. This will replace your current floor plan.</p>
            <div className="grid grid-cols-2 gap-3">
              {ROOM_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => applyTemplate(tmpl)}
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <LayoutTemplate size={16} className="text-indigo-600" />
                    <span className="text-sm font-medium text-slate-800">{tmpl.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{tmpl.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {tmpl.walls.length} walls, {tmpl.doors.length} door{tmpl.doors.length !== 1 ? 's' : ''}, {tmpl.windows.length} window{tmpl.windows.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Layout Generator */}
      <LayoutGenerator
        isOpen={showLayoutGenerator}
        onClose={() => setShowLayoutGenerator(false)}
        roomWidth={dimensions.width}
        roomHeight={dimensions.height}
        walls={walls}
        doors={doors}
        windows={windows}
        existingFurniture={furniture}
        onApplyLayout={applyAILayout}
      />

      {/* Product Import Dialog */}
      {showImportDialog && (
        <ProductImportDialog
          onClose={() => setShowImportDialog(false)}
          onProductImported={handleProductImported}
          projectId={null}
          floorPlanId={null}
        />
      )}

      {/* Product Catalog Browser */}
      <ProductBrowser
        isOpen={showProductBrowser}
        onClose={() => setShowProductBrowser(false)}
        onSelectProduct={handleProductBrowserSelect}
        projectId={null}
      />

      {/* Photo-to-Floor-Plan Import */}
      {showPhotoImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <PhotoFloorPlan
              onImport={(floorPlanData) => {
                if (floorPlanData.walls) setWalls(floorPlanData.walls)
                if (floorPlanData.doors) setDoors(floorPlanData.doors)
                if (floorPlanData.windows) setWindows(floorPlanData.windows)
                if (floorPlanData.dimensions) setDimensions(floorPlanData.dimensions)
                setShowPhotoImport(false)
              }}
              onClose={() => setShowPhotoImport(false)}
            />
          </div>
        </div>
      )}

      {/* Smart Finish Pairing */}
      {showFinishPairing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <FinishPairing
              currentMaterials={{}}
              roomType="living_room"
              onApply={(suggestion) => {
                console.log('Applied finish suggestion:', suggestion)
              }}
              onClose={() => setShowFinishPairing(false)}
            />
          </div>
        </div>
      )}

      {/* CAD Print Preview */}
      <CadPrintPreview
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        data={{ walls, doors, windows, furniture, measurements, annotations, roomLabels }}
        canvasWidth={dimensions.width}
        canvasHeight={dimensions.height}
        projectName={'Floor Plan'}
        planName={'Floor Plan'}
      />

      {/* Elevation Preview Modal */}
      {showElevationPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowElevationPreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Elevation Views</h2>
              <button onClick={() => setShowElevationPreview(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              {(() => {
                const elevations = generateAllElevations(walls, doors, windows)
                if (elevations.length === 0) return <p className="text-slate-500 text-sm">Need at least 3 walls to generate elevations.</p>
                return (
                  <div className="grid grid-cols-2 gap-6">
                    {elevations.map(({ direction, elevation }) => (
                      <div key={direction} className="border border-slate-200 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">{direction} Elevation</h3>
                        <canvas
                          ref={el => {
                            if (el && elevation) {
                              const ctx = el.getContext('2d')
                              ctx.clearRect(0, 0, el.width, el.height)
                              drawElevation(ctx, elevation, { x: 50, y: 20, scale: 0.6 })
                            }
                          }}
                          width={400}
                          height={250}
                          className="w-full border border-slate-100 rounded bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Preview Modal */}
      {showSchedulePreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowSchedulePreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Schedules</h2>
              <button onClick={() => setShowSchedulePreview(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-6">
              {[
                roomLabels.length > 0 && { gen: () => generateRoomSchedule(roomLabels, furniture), label: 'Room Schedule' },
                doors.length > 0 && { gen: () => generateDoorSchedule(doors), label: 'Door Schedule' },
                windows.length > 0 && { gen: () => generateWindowSchedule(windows), label: 'Window Schedule' },
              ].filter(Boolean).map(({ gen, label }) => {
                const schedule = gen()
                return (
                  <div key={label}>
                    <canvas
                      ref={el => {
                        if (el && schedule) {
                          el.width = 700
                          el.height = 30 + 24 + 22 + schedule.rows.length * 18 + (schedule.totals ? 18 : 0)
                          const ctx = el.getContext('2d')
                          ctx.clearRect(0, 0, el.width, el.height)
                          drawScheduleTable(ctx, schedule, 10, 10, 680)
                        }
                      }}
                      width={700}
                      height={200}
                      className="w-full border border-slate-100 rounded bg-white"
                    />
                  </div>
                )
              })}
              {roomLabels.length === 0 && doors.length === 0 && windows.length === 0 && (
                <p className="text-slate-500 text-sm">Add room labels, doors, or windows to generate schedules.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Symbol Picker Modal */}
      {showSymbolPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowSymbolPicker(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Symbol Library</h2>
              <button onClick={() => setShowSymbolPicker(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-4">
              {Object.entries(getSymbolsByCategory()).map(([category, symbols]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{category}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {symbols.map(({ key, name }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSymbolToPlace(key)
                          setTool('symbol')
                          setShowSymbolPicker(false)
                        }}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                      >
                        <canvas
                          ref={el => {
                            if (el) {
                              const ctx = el.getContext('2d')
                              ctx.clearRect(0, 0, 32, 32)
                              drawSymbol(ctx, key, 16, 16, { scale: 1.2 })
                            }
                          }}
                          width={32}
                          height={32}
                          className="w-8 h-8"
                        />
                        <span className="text-[9px] text-slate-600 text-center leading-tight">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility: point-to-line distance
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = lenSq !== 0 ? dot / lenSq : -1
  let xx, yy
  if (param < 0) { xx = x1; yy = y1 }
  else if (param > 1) { xx = x2; yy = y2 }
  else { xx = x1 + param * C; yy = y1 + param * D }
  return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2)
}
