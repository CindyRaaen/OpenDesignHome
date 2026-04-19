/**
 * @openscaffold/measure shim
 * Provides grid, snap, and formatting utilities for the FloorPlanEditor.
 * Standalone replacement for the @openscaffold/measure package.
 */

const DEFAULT_GRID_SIZE = 20
const DEFAULT_SCALE = 0.5 // 1 grid unit = 0.5 feet

export function createGrid({ pixelsPerGridUnit = 20, unitsPerGridUnit = 0.5, unit = 'feet' } = {}) {
  return {
    pixelsPerGridUnit,
    unitsPerGridUnit,
    unit,
    toPixels: (units) => (units / unitsPerGridUnit) * pixelsPerGridUnit,
    toUnits: (pixels) => (pixels / pixelsPerGridUnit) * unitsPerGridUnit,
  }
}

export function pixelsToUnits(pixels, gridSize = DEFAULT_GRID_SIZE, scale = DEFAULT_SCALE) {
  return (pixels / gridSize) * scale
}

export function snapToGrid(value, gridSize = DEFAULT_GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize
}

export function polygonArea(points) {
  if (!points || points.length < 3) return 0
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area / 2)
}

export function formatFeetInches(totalFeet) {
  if (totalFeet == null || isNaN(totalFeet)) return '0\'-0"'
  const feet = Math.floor(totalFeet)
  const inches = Math.round((totalFeet - feet) * 12)
  if (inches === 12) return `${feet + 1}'-0"`
  return `${feet}'-${inches}"`
}
