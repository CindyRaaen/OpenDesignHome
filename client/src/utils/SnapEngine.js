// ─── Advanced Snap Engine ────────────────────────────────────────────────────
// Provides professional CAD snapping modes beyond simple grid snap.
// Modes: endpoint, midpoint, intersection, perpendicular, nearest, center, tangent
//
// Usage:
//   import { SnapEngine } from '../utils/SnapEngine'
//   const snap = new SnapEngine(walls, doors, windows, furniture)
//   snap.setModes(['endpoint', 'midpoint', 'intersection', 'perpendicular'])
//   const result = snap.findSnap(cursorX, cursorY, threshold)
//   // result = { x, y, type: 'midpoint', element: {...} } or null

const SNAP_TYPES = {
  endpoint: { label: 'Endpoint', color: '#22c55e', symbol: 'square' },
  midpoint: { label: 'Midpoint', color: '#eab308', symbol: 'triangle' },
  intersection: { label: 'Intersection', color: '#ef4444', symbol: 'cross' },
  perpendicular: { label: 'Perpendicular', color: '#3b82f6', symbol: 'perp' },
  nearest: { label: 'Nearest', color: '#f97316', symbol: 'diamond' },
  center: { label: 'Center', color: '#8b5cf6', symbol: 'circle' },
  tangent: { label: 'Tangent', color: '#06b6d4', symbol: 'tangent' },
  grid: { label: 'Grid', color: '#94a3b8', symbol: 'dot' },
}

export { SNAP_TYPES }

export class SnapEngine {
  /**
   * @param {Array} walls
   * @param {Array} doors
   * @param {Array} windows
   * @param {Array} furniture
   * @param {number} gridSize
   */
  constructor(walls = [], doors = [], windows = [], furniture = [], gridSize = 20) {
    this.walls = walls
    this.doors = doors
    this.windows = windows
    this.furniture = furniture
    this.gridSize = gridSize
    this.activeModes = new Set(['endpoint', 'midpoint', 'intersection', 'perpendicular', 'nearest', 'center', 'grid'])
    this._referencePoint = null // For perpendicular calculations
  }

  /**
   * Update geometry data.
   */
  update(walls, doors, windows, furniture) {
    this.walls = walls || this.walls
    this.doors = doors || this.doors
    this.windows = windows || this.windows
    this.furniture = furniture || this.furniture
  }

  /**
   * Set active snap modes.
   * @param {string[]} modes
   */
  setModes(modes) {
    this.activeModes = new Set(modes)
  }

  /**
   * Toggle a single snap mode.
   */
  toggleMode(mode) {
    if (this.activeModes.has(mode)) {
      this.activeModes.delete(mode)
    } else {
      this.activeModes.add(mode)
    }
  }

  /**
   * Set the reference point for perpendicular snap.
   * @param {{ x: number, y: number }} point
   */
  setReferencePoint(point) {
    this._referencePoint = point
  }

  /**
   * Find the best snap point near the cursor.
   * @param {number} cx - Cursor X
   * @param {number} cy - Cursor Y
   * @param {number} threshold - Max distance in pixels
   * @returns {{ x, y, type, distance, element? } | null}
   */
  findSnap(cx, cy, threshold = 15) {
    const candidates = []

    // Collect all snap candidates
    if (this.activeModes.has('endpoint')) {
      candidates.push(...this._findEndpoints(cx, cy, threshold))
    }
    if (this.activeModes.has('midpoint')) {
      candidates.push(...this._findMidpoints(cx, cy, threshold))
    }
    if (this.activeModes.has('intersection')) {
      candidates.push(...this._findIntersections(cx, cy, threshold))
    }
    if (this.activeModes.has('perpendicular') && this._referencePoint) {
      candidates.push(...this._findPerpendiculars(cx, cy, threshold))
    }
    if (this.activeModes.has('nearest')) {
      candidates.push(...this._findNearest(cx, cy, threshold))
    }
    if (this.activeModes.has('center')) {
      candidates.push(...this._findCenters(cx, cy, threshold))
    }
    if (this.activeModes.has('grid')) {
      candidates.push(this._findGrid(cx, cy, threshold))
    }

    // Filter out nulls and sort by priority: endpoint > midpoint > intersection > perpendicular > center > nearest > grid
    const priority = ['endpoint', 'midpoint', 'intersection', 'perpendicular', 'center', 'nearest', 'grid']
    const valid = candidates.filter(c => c && c.distance <= threshold)
    if (valid.length === 0) return null

    valid.sort((a, b) => {
      // First by priority
      const pa = priority.indexOf(a.type)
      const pb = priority.indexOf(b.type)
      if (pa !== pb) return pa - pb
      // Then by distance
      return a.distance - b.distance
    })

    return valid[0]
  }

  // ── Endpoint snap ──
  _findEndpoints(cx, cy, threshold) {
    const results = []

    this.walls.forEach(w => {
      const d1 = dist(cx, cy, w.x1, w.y1)
      if (d1 <= threshold) results.push({ x: w.x1, y: w.y1, type: 'endpoint', distance: d1, element: w })
      const d2 = dist(cx, cy, w.x2, w.y2)
      if (d2 <= threshold) results.push({ x: w.x2, y: w.y2, type: 'endpoint', distance: d2, element: w })
    })

    this.windows.forEach(w => {
      const d1 = dist(cx, cy, w.x1, w.y1)
      if (d1 <= threshold) results.push({ x: w.x1, y: w.y1, type: 'endpoint', distance: d1, element: w })
      const d2 = dist(cx, cy, w.x2, w.y2)
      if (d2 <= threshold) results.push({ x: w.x2, y: w.y2, type: 'endpoint', distance: d2, element: w })
    })

    this.doors.forEach(d => {
      const dd = dist(cx, cy, d.x, d.y)
      if (dd <= threshold) results.push({ x: d.x, y: d.y, type: 'endpoint', distance: dd, element: d })
    })

    return results
  }

  // ── Midpoint snap ──
  _findMidpoints(cx, cy, threshold) {
    const results = []

    this.walls.forEach(w => {
      const mx = (w.x1 + w.x2) / 2
      const my = (w.y1 + w.y2) / 2
      const d = dist(cx, cy, mx, my)
      if (d <= threshold) results.push({ x: mx, y: my, type: 'midpoint', distance: d, element: w })
    })

    this.windows.forEach(w => {
      const mx = (w.x1 + w.x2) / 2
      const my = (w.y1 + w.y2) / 2
      const d = dist(cx, cy, mx, my)
      if (d <= threshold) results.push({ x: mx, y: my, type: 'midpoint', distance: d, element: w })
    })

    return results
  }

  // ── Intersection snap ──
  _findIntersections(cx, cy, threshold) {
    const results = []
    const lines = [
      ...this.walls.map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, src: w })),
      ...this.windows.map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, src: w })),
    ]

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const pt = lineLineIntersection(lines[i], lines[j])
        if (pt) {
          const d = dist(cx, cy, pt.x, pt.y)
          if (d <= threshold) {
            results.push({ x: pt.x, y: pt.y, type: 'intersection', distance: d })
          }
        }
      }
    }

    return results
  }

  // ── Perpendicular snap ──
  _findPerpendiculars(cx, cy, threshold) {
    const results = []
    if (!this._referencePoint) return results

    const ref = this._referencePoint
    const lines = [
      ...this.walls.map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, src: w })),
    ]

    lines.forEach(line => {
      const pt = perpendicularFoot(ref.x, ref.y, line.x1, line.y1, line.x2, line.y2)
      if (pt) {
        const d = dist(cx, cy, pt.x, pt.y)
        if (d <= threshold) {
          results.push({ x: pt.x, y: pt.y, type: 'perpendicular', distance: d, element: line.src })
        }
      }
    })

    return results
  }

  // ── Nearest point on any line ──
  _findNearest(cx, cy, threshold) {
    const results = []
    const lines = [
      ...this.walls.map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, src: w })),
      ...this.windows.map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, src: w })),
    ]

    lines.forEach(line => {
      const pt = nearestPointOnLine(cx, cy, line.x1, line.y1, line.x2, line.y2)
      const d = dist(cx, cy, pt.x, pt.y)
      if (d <= threshold) {
        results.push({ x: pt.x, y: pt.y, type: 'nearest', distance: d, element: line.src })
      }
    })

    return results
  }

  // ── Center of furniture items ──
  _findCenters(cx, cy, threshold) {
    const results = []

    this.furniture.forEach(f => {
      const fw = f.w != null ? f.w * this.gridSize : (f.width || 40)
      const fh = f.h != null ? f.h * this.gridSize : (f.height || 40)
      const centerX = f.x + fw / 2
      const centerY = f.y + fh / 2
      const d = dist(cx, cy, centerX, centerY)
      if (d <= threshold) {
        results.push({ x: centerX, y: centerY, type: 'center', distance: d, element: f })
      }
    })

    // Also door centers
    this.doors.forEach(door => {
      const w = door.width || 40
      const centerX = door.x + w / 2
      const centerY = door.y
      const d = dist(cx, cy, centerX, centerY)
      if (d <= threshold) {
        results.push({ x: centerX, y: centerY, type: 'center', distance: d, element: door })
      }
    })

    return results
  }

  // ── Grid snap ──
  _findGrid(cx, cy, threshold) {
    const gx = Math.round(cx / this.gridSize) * this.gridSize
    const gy = Math.round(cy / this.gridSize) * this.gridSize
    return { x: gx, y: gy, type: 'grid', distance: dist(cx, cy, gx, gy) }
  }
}

/**
 * Draw a snap indicator at the given point.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x, y, type }} snapResult
 * @param {number} size - Indicator size in pixels
 */
export function drawSnapIndicator(ctx, snapResult, size = 8) {
  if (!snapResult) return
  const { x, y, type } = snapResult
  const info = SNAP_TYPES[type]
  if (!info) return

  ctx.save()
  ctx.strokeStyle = info.color
  ctx.fillStyle = info.color
  ctx.lineWidth = 1.5

  switch (info.symbol) {
    case 'square':
      ctx.strokeRect(x - size / 2, y - size / 2, size, size)
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.lineTo(x - size / 2, y + size / 2)
      ctx.closePath()
      ctx.stroke()
      break
    case 'cross':
      ctx.beginPath()
      ctx.moveTo(x - size / 2, y - size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.moveTo(x + size / 2, y - size / 2)
      ctx.lineTo(x - size / 2, y + size / 2)
      ctx.stroke()
      break
    case 'perp':
      ctx.beginPath()
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x, y + size / 2)
      ctx.moveTo(x - size / 2, y + size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.stroke()
      break
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x + size / 2, y)
      ctx.lineTo(x, y + size / 2)
      ctx.lineTo(x - size / 2, y)
      ctx.closePath()
      ctx.stroke()
      break
    case 'circle':
      ctx.beginPath()
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'tangent':
      ctx.beginPath()
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x - size / 2, y - size / 2)
      ctx.lineTo(x + size / 2, y - size / 2)
      ctx.stroke()
      break
    case 'dot':
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
      break
  }

  // Label
  ctx.font = '8px sans-serif'
  ctx.fillStyle = info.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(info.label, x + size / 2 + 4, y - size / 2)

  ctx.restore()
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Find intersection point of two line segments.
 * Returns null if segments don't intersect.
 */
function lineLineIntersection(l1, l2) {
  const { x1, y1, x2, y2 } = l1
  const { x1: x3, y1: y3, x2: x4, y2: y4 } = l2

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 1e-10) return null // Parallel

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  if (t < -0.01 || t > 1.01 || u < -0.01 || u > 1.01) return null

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  }
}

/**
 * Find the foot of the perpendicular from point (px,py) to line segment.
 * Returns null if the foot falls outside the segment.
 */
function perpendicularFoot(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq < 1e-10) return null

  const t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  if (t < 0 || t > 1) return null

  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
  }
}

/**
 * Find nearest point on a line segment to a given point.
 */
function nearestPointOnLine(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq < 1e-10) return { x: x1, y: y1 }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))

  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
  }
}
