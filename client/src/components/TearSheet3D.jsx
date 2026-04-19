/**
 * TearSheet3D.jsx — Interactive tear sheet overlay for 3D furniture items
 * Click any furniture piece in the 3D viewer to see its spec sheet:
 * dimensions, material, color, type, and catalog reference.
 * Standard interior design deliverable — like a product spec card.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { X, Clipboard, FileText, ChevronRight, Download, Layers } from 'lucide-react'

// ── Friendly type names ──────────────────────────────────────────────────
const TYPE_LABELS = {
  sofa: 'Sofa', 'sofa-3seat': '3-Seat Sofa', 'sectional-l': 'L-Sectional',
  armchair: 'Armchair', 'accent-chair': 'Accent Chair', recliner: 'Recliner',
  loveseat: 'Loveseat', bench: 'Bench', ottoman: 'Ottoman',
  'bar-stool': 'Bar Stool', 'office-chair': 'Office Chair',
  'dining-table': 'Dining Table', 'round-table': 'Round Table',
  desk: 'Desk', 'l-desk': 'L-Shaped Desk', 'coffee-table': 'Coffee Table',
  'side-table': 'Side Table', 'console-table': 'Console Table',
  'bar-table': 'Bar Height Table', 'patio-table': 'Patio Table',
  island: 'Kitchen Island',
  'bed-king': 'King Bed', 'bed-queen': 'Queen Bed', 'bed-twin': 'Twin Bed',
  'bunk-bed': 'Bunk Bed', nightstand: 'Nightstand', dresser: 'Dresser',
  wardrobe: 'Wardrobe', vanity: 'Vanity',
  bookshelf: 'Bookshelf', 'bookshelf-tall': 'Tall Bookshelf',
  cabinet: 'Cabinet', sideboard: 'Sideboard',
  'shelving-unit': 'Shelving Unit', 'filing-cabinet': 'Filing Cabinet',
  'tv-console': 'TV Console', 'tv-wall-mount': 'Wall-Mounted TV',
  speaker: 'Speaker', 'monitor-stand': 'Monitor Stand',
  bathtub: 'Bathtub', 'freestand-tub': 'Freestanding Tub',
  toilet: 'Toilet', sink: 'Sink', 'double-vanity': 'Double Vanity',
  shower: 'Walk-in Shower',
  stove: 'Stove/Range', fridge: 'Refrigerator', 'fridge-french': 'French Door Fridge',
  dishwasher: 'Dishwasher', 'kitchen-sink': 'Kitchen Sink',
  microwave: 'Microwave', 'pantry-shelf': 'Pantry Shelf',
  plant: 'Potted Plant', 'plant-large': 'Large Plant',
  rug: 'Area Rug', 'rug-round': 'Round Rug',
  'floor-lamp': 'Floor Lamp', 'table-lamp': 'Table Lamp',
  'mirror-floor': 'Floor Mirror', fireplace: 'Fireplace',
  'patio-chair': 'Patio Chair', 'lounge-chair': 'Lounge Chair',
  grill: 'Grill', planter: 'Planter', umbrella: 'Patio Umbrella',
}

// ── Material name mapping ────────────────────────────────────────────────
const MATERIAL_LABELS = {
  'hardwood-oak': 'White Oak Hardwood', 'hardwood-walnut': 'Walnut Hardwood',
  'hardwood-cherry': 'Cherry Hardwood', 'tile-white': 'White Porcelain Tile',
  'tile-marble': 'Marble Tile', 'tile-slate': 'Slate Tile',
  'carpet-beige': 'Beige Loop Carpet', 'carpet-gray': 'Gray Plush Carpet',
  'concrete': 'Polished Concrete', 'bamboo': 'Natural Bamboo',
  'vinyl-plank': 'Luxury Vinyl Plank', 'terracotta': 'Terracotta Tile',
}

// ── Color name helper ────────────────────────────────────────────────────
function colorToName(hex) {
  if (typeof hex === 'string') hex = parseInt(hex.replace('#', ''), 16)
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff

  const colors = [
    { name: 'White', r: 255, g: 255, b: 255 },
    { name: 'Ivory', r: 245, g: 240, b: 235 },
    { name: 'Charcoal', r: 51, g: 65, b: 85 },
    { name: 'Navy', r: 30, g: 58, b: 95 },
    { name: 'Indigo', r: 99, g: 102, b: 241 },
    { name: 'Forest Green', r: 22, g: 163, b: 74 },
    { name: 'Sage', r: 107, g: 142, b: 107 },
    { name: 'Burgundy', r: 154, g: 74, b: 46 },
    { name: 'Walnut', r: 92, g: 64, b: 51 },
    { name: 'Oak', r: 146, g: 64, b: 14 },
    { name: 'Natural Wood', r: 196, g: 163, b: 90 },
    { name: 'Chrome', r: 192, g: 192, b: 192 },
    { name: 'Black', r: 44, g: 44, b: 44 },
    { name: 'Red', r: 220, g: 38, b: 38 },
    { name: 'Gold', r: 207, g: 181, b: 59 },
    { name: 'Slate', r: 107, g: 123, b: 141 },
    { name: 'Cream', r: 232, g: 213, b: 183 },
    { name: 'Taupe', r: 169, g: 146, b: 121 },
  ]

  let bestMatch = 'Custom', bestDist = Infinity
  colors.forEach(c => {
    const dist = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2)
    if (dist < bestDist) { bestDist = dist; bestMatch = c.name }
  })
  return bestDist < 80 ? bestMatch : 'Custom'
}

// ── Convert world units to human-readable dimensions ─────────────────────
function formatDimension(worldUnits) {
  const inches = worldUnits * 12 // 1 world unit ≈ 1 foot
  if (inches >= 12) {
    const feet = Math.floor(inches / 12)
    const rem = Math.round(inches % 12)
    return rem > 0 ? `${feet}' ${rem}"` : `${feet}'`
  }
  return `${Math.round(inches)}"`
}

function formatDimensionMetric(worldUnits) {
  const cm = worldUnits * 30.48 // 1 world unit ≈ 1 foot ≈ 30.48 cm
  if (cm >= 100) return `${(cm / 100).toFixed(2)} m`
  return `${Math.round(cm)} cm`
}

// ── TearSheet component ──────────────────────────────────────────────────

export default function TearSheet3D({ item, config, worldDimensions, onClose, onCopySpec }) {
  const [units, setUnits] = useState('imperial') // imperial or metric
  const [copied, setCopied] = useState(false)

  if (!item) return null

  const normalizeType = (type) => type ? type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : ''
  const fType = normalizeType(item.type)
  const label = TYPE_LABELS[fType] || TYPE_LABELS[item.type] || item.type || 'Unknown Item'
  const colorName = colorToName(item.color || config?.color || 0x888888)
  const colorHex = typeof (item.color || config?.color) === 'number'
    ? '#' + (item.color || config?.color).toString(16).padStart(6, '0')
    : item.color || '#888888'

  const fmt = units === 'imperial' ? formatDimension : formatDimensionMetric
  const { w, h, height3d } = worldDimensions || {}

  // Category badge
  const category = (() => {
    const seating = ['sofa', 'sofa-3seat', 'sectional-l', 'armchair', 'accent-chair', 'recliner', 'loveseat', 'bench', 'ottoman', 'bar-stool', 'office-chair', 'patio-chair', 'lounge-chair']
    const tables = ['dining-table', 'round-table', 'desk', 'l-desk', 'coffee-table', 'side-table', 'console-table', 'bar-table', 'patio-table', 'island', 'vanity']
    const bedroom = ['bed-king', 'bed-queen', 'bed-twin', 'bunk-bed', 'nightstand', 'dresser', 'wardrobe']
    const storage = ['bookshelf', 'bookshelf-tall', 'cabinet', 'sideboard', 'shelving-unit', 'filing-cabinet']
    const kitchen = ['stove', 'fridge', 'fridge-french', 'dishwasher', 'kitchen-sink', 'microwave', 'pantry-shelf']
    const bathroom = ['bathtub', 'freestand-tub', 'toilet', 'sink', 'double-vanity', 'shower']
    const decor = ['plant', 'plant-large', 'rug', 'rug-round', 'floor-lamp', 'table-lamp', 'mirror-floor', 'fireplace', 'planter', 'umbrella']

    if (seating.includes(fType)) return 'Seating'
    if (tables.includes(fType)) return 'Tables & Desks'
    if (bedroom.includes(fType)) return 'Bedroom'
    if (storage.includes(fType)) return 'Storage'
    if (kitchen.includes(fType)) return 'Kitchen'
    if (bathroom.includes(fType)) return 'Bath'
    if (decor.includes(fType)) return 'Decor & Lighting'
    return 'Furnishing'
  })()

  const handleCopy = () => {
    const spec = [
      `TEAR SHEET — ${label}`,
      `Category: ${category}`,
      `Type: ${fType}`,
      w ? `Width: ${fmt(w)}` : null,
      h ? `Depth: ${fmt(h)}` : null,
      height3d ? `Height: ${fmt(height3d)}` : null,
      `Color: ${colorName} (${colorHex})`,
      item.rotation ? `Rotation: ${item.rotation}°` : null,
      `Position: (${item.x}, ${item.y})`,
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(spec).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    if (onCopySpec) onCopySpec(spec)
  }

  return (
    <div className="absolute top-14 right-3 w-72 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-right">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-white/80" />
          <span className="text-sm font-semibold text-white">Tear Sheet</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Item name + category */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-lg font-bold text-slate-900">{label}</h3>
        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full uppercase tracking-wide">
          {category}
        </span>
      </div>

      {/* Color swatch */}
      <div className="px-4 py-2 flex items-center gap-3 border-t border-slate-100">
        <div
          className="w-10 h-10 rounded-md border-2 border-slate-200 shadow-inner"
          style={{ backgroundColor: colorHex }}
        />
        <div>
          <div className="text-sm font-medium text-slate-800">{colorName}</div>
          <div className="text-[10px] text-slate-400 uppercase font-mono">{colorHex}</div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="px-4 py-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dimensions</span>
          <button
            onClick={() => setUnits(u => u === 'imperial' ? 'metric' : 'imperial')}
            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
          >
            {units === 'imperial' ? 'Switch to Metric' : 'Switch to Imperial'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {w != null && (
            <div className="bg-slate-50 rounded px-2 py-1.5 text-center">
              <div className="text-[9px] text-slate-400 uppercase">Width</div>
              <div className="text-sm font-semibold text-slate-800">{fmt(w)}</div>
            </div>
          )}
          {h != null && (
            <div className="bg-slate-50 rounded px-2 py-1.5 text-center">
              <div className="text-[9px] text-slate-400 uppercase">Depth</div>
              <div className="text-sm font-semibold text-slate-800">{fmt(h)}</div>
            </div>
          )}
          {height3d != null && (
            <div className="bg-slate-50 rounded px-2 py-1.5 text-center">
              <div className="text-[9px] text-slate-400 uppercase">Height</div>
              <div className="text-sm font-semibold text-slate-800">{fmt(height3d)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Position & rotation */}
      <div className="px-4 py-2 border-t border-slate-100">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Placement</span>
        <div className="mt-1 text-xs text-slate-600">
          Position: ({item.x}, {item.y}) {item.rotation ? `· Rotated ${item.rotation}°` : ''}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
        >
          <Clipboard size={12} />
          {copied ? 'Copied!' : 'Copy Spec'}
        </button>
      </div>
    </div>
  )
}

/**
 * TearSheet raycasting helper — enables click-to-select furniture in 3D
 * Call this from the 3D viewer's mouse click handler
 */
export function setupTearSheetRaycaster(THREE, camera, scene, containerEl, furnitureGroups, onSelect) {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  function onClick(event) {
    const rect = containerEl.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      // Walk up to find the furniture group
      let obj = intersects[0].object
      while (obj.parent && obj.parent !== scene) {
        obj = obj.parent
      }

      // Check if this is a furniture group (not walls/floor/lighting)
      const idx = furnitureGroups.indexOf(obj)
      if (idx >= 0 && onSelect) {
        onSelect(idx, intersects[0].point)
      }
    }
  }

  containerEl.addEventListener('click', onClick)
  return () => containerEl.removeEventListener('click', onClick)
}
