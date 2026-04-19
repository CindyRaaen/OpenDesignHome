// ─── Elevation / Section Export Engine ───────────────────────────────────────
// Generates 2D elevation views from floor plan data.
// An elevation is a side view looking at a wall straight-on, showing:
//   - Wall outline with height
//   - Door openings (with header height and swing direction)
//   - Window openings (with sill and head heights)
//   - Ceiling line and floor line
//   - Dimension strings
//
// Usage:
//   import { generateElevation, drawElevation, exportElevationPDF } from '../utils/ElevationExport'
//   const elev = generateElevation(walls, doors, windows, wallId, opts)
//   drawElevation(ctx, elev, { x: 0, y: 0, scale: 1 })

const GRID_SIZE = 20
const SCALE_FACTOR = 0.5 // 1 grid unit = 0.5 feet = 6 inches

// Convert pixels to real inches
const pxToInches = (px) => px * SCALE_FACTOR * 12 / GRID_SIZE

// Format inches as feet-inches
function formatFtIn(inches) {
  const ft = Math.floor(inches / 12)
  const inch = Math.round(inches % 12)
  if (inch === 0) return `${ft}'-0"`
  if (inch === 12) return `${ft + 1}'-0"`
  return `${ft}'-${inch}"`
}

// Default architectural heights (in real inches)
const DEFAULTS = {
  wallHeight: 108,        // 9'-0" standard ceiling
  doorHeight: 80,         // 6'-8" door
  doorHeaderHeight: 84,   // 7'-0" header
  windowSillHeight: 36,   // 3'-0" sill
  windowHeadHeight: 80,   // 6'-8" window head
  floorThickness: 8,      // floor slab
  ceilingThickness: 6,    // ceiling slab/joist
  baseboardHeight: 4,     // baseboard trim
  crownHeight: 4,         // crown molding
}

/**
 * Calculate if a door/window is on a given wall segment.
 */
function isOnWall(element, wall, threshold = 15) {
  const wx = wall.x2 - wall.x1
  const wy = wall.y2 - wall.y1
  const wLen = Math.sqrt(wx * wx + wy * wy)
  if (wLen < 1) return null

  // For doors: element has (x, y) as hinge point
  const px = (element.x1 !== undefined ? (element.x1 + element.x2) / 2 : element.x) - wall.x1
  const py = (element.y1 !== undefined ? (element.y1 + element.y2) / 2 : element.y) - wall.y1

  // Project onto wall
  const t = (px * wx + py * wy) / (wLen * wLen)
  if (t < -0.1 || t > 1.1) return null

  // Distance from wall line
  const projX = wall.x1 + t * wx
  const projY = wall.y1 + t * wy
  const dist = Math.sqrt(
    (px + wall.x1 - projX) ** 2 + (py + wall.y1 - projY) ** 2
  )
  if (dist > threshold) return null

  return { t, distAlongWall: t * wLen }
}

/**
 * Generate elevation data for a specific wall.
 * @param {Array} walls - All walls
 * @param {Array} doors - All doors
 * @param {Array} windows - All windows
 * @param {string} wallId - The wall to generate elevation for
 * @param {object} opts - Override heights
 * @returns {object} Elevation data structure
 */
export function generateElevation(walls, doors, windows, wallId, opts = {}) {
  const wall = walls.find(w => w.id === wallId)
  if (!wall) return null

  const config = { ...DEFAULTS, ...opts }
  const wallLenPx = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2)
  const wallLenInches = pxToInches(wallLenPx)

  // Find doors on this wall
  const wallDoors = doors.map(d => {
    const hit = isOnWall(d, wall)
    if (!hit) return null
    const doorWidthInches = pxToInches(d.width || 40)
    return {
      id: d.id,
      positionInches: pxToInches(hit.distAlongWall),
      widthInches: doorWidthInches,
      heightInches: d.height || config.doorHeight,
      headerInches: d.headerHeight || config.doorHeaderHeight,
      swing: d.swing || 'left',
    }
  }).filter(Boolean)

  // Find windows on this wall
  const wallWindows = windows.map(w => {
    const hit = isOnWall(w, wall)
    if (!hit) return null
    const winLenPx = Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2)
    const winWidthInches = pxToInches(winLenPx)
    return {
      id: w.id,
      positionInches: pxToInches(hit.distAlongWall) - winWidthInches / 2,
      widthInches: winWidthInches,
      sillInches: w.sillHeight || config.windowSillHeight,
      headInches: w.headHeight || config.windowHeadHeight,
    }
  }).filter(Boolean)

  return {
    wallId,
    wallLenInches,
    wallHeightInches: config.wallHeight,
    floorThickness: config.floorThickness,
    ceilingThickness: config.ceilingThickness,
    baseboardHeight: config.baseboardHeight,
    crownHeight: config.crownHeight,
    doors: wallDoors,
    windows: wallWindows,
  }
}

/**
 * Draw an elevation view on a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} elev - From generateElevation()
 * @param {object} drawOpts - { x, y, scale, showDimensions, showHatch }
 */
export function drawElevation(ctx, elev, drawOpts = {}) {
  if (!elev) return

  const ox = drawOpts.x || 0
  const oy = drawOpts.y || 0
  const scale = drawOpts.scale || 0.8 // pixels per real inch
  const showDims = drawOpts.showDimensions !== false
  const showHatch = drawOpts.showHatch !== false

  const toX = (inches) => ox + inches * scale
  const toY = (inches) => oy + (elev.wallHeightInches - inches) * scale // Y inverted: 0 = floor

  const wallW = elev.wallLenInches * scale
  const wallH = elev.wallHeightInches * scale

  ctx.save()

  // ── Floor line ──
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ox - 20, toY(0))
  ctx.lineTo(ox + wallW + 20, toY(0))
  ctx.stroke()

  // ── Floor slab hatch ──
  if (showHatch) {
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(ox - 10, toY(0), wallW + 20, elev.floorThickness * scale)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 0.5
    const slabTop = toY(0)
    const slabH = elev.floorThickness * scale
    for (let d = -slabH; d < wallW + 30; d += 6) {
      ctx.beginPath()
      ctx.moveTo(ox - 10 + d, slabTop)
      ctx.lineTo(ox - 10 + d + slabH, slabTop + slabH)
      ctx.stroke()
    }
  }

  // ── Ceiling line ──
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ox - 20, toY(elev.wallHeightInches))
  ctx.lineTo(ox + wallW + 20, toY(elev.wallHeightInches))
  ctx.stroke()

  // ── Wall outline ──
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 3
  ctx.strokeRect(ox, toY(elev.wallHeightInches), wallW, wallH)

  // ── Wall fill (light) ──
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(ox, toY(elev.wallHeightInches), wallW, wallH)

  // ── Baseboard ──
  ctx.fillStyle = '#e2e8f0'
  const bbH = elev.baseboardHeight * scale
  ctx.fillRect(ox, toY(elev.baseboardHeight), wallW, bbH)
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 0.5
  ctx.strokeRect(ox, toY(elev.baseboardHeight), wallW, bbH)

  // ── Crown molding ──
  ctx.fillStyle = '#e2e8f0'
  const crH = elev.crownHeight * scale
  ctx.fillRect(ox, toY(elev.wallHeightInches), wallW, crH)
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 0.5
  ctx.strokeRect(ox, toY(elev.wallHeightInches), wallW, crH)

  // ── Doors ──
  elev.doors.forEach(door => {
    const dx = toX(door.positionInches - door.widthInches / 2)
    const dw = door.widthInches * scale
    const dh = door.heightInches * scale
    const dy = toY(door.heightInches)

    // Clear wall fill for opening
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(dx, dy, dw, dh)

    // Door frame
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(dx, toY(0))
    ctx.lineTo(dx, dy)
    ctx.lineTo(dx + dw, dy)
    ctx.lineTo(dx + dw, toY(0))
    ctx.stroke()

    // Door panel (thin rectangle inside)
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    const panelInset = 3
    ctx.strokeRect(dx + panelInset, dy + panelInset, dw - panelInset * 2, dh - panelInset * 2)

    // Door handle
    const handleX = door.swing === 'left' ? dx + dw - 8 : dx + 8
    const handleY = toY(door.heightInches * 0.45)
    ctx.fillStyle = '#475569'
    ctx.beginPath()
    ctx.arc(handleX, handleY, 2, 0, Math.PI * 2)
    ctx.fill()

    // Header (if below ceiling)
    if (door.headerInches < elev.wallHeightInches) {
      const headerY = toY(door.headerInches)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(dx, headerY)
      ctx.lineTo(dx + dw, headerY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  })

  // ── Windows ──
  elev.windows.forEach(win => {
    const wx = toX(win.positionInches)
    const ww = win.widthInches * scale
    const sillY = toY(win.sillInches)
    const headY = toY(win.headInches)
    const wh = sillY - headY

    // Clear wall fill for opening
    ctx.fillStyle = '#e0f2fe'  // light blue for glass
    ctx.fillRect(wx, headY, ww, wh)

    // Window frame
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.strokeRect(wx, headY, ww, wh)

    // Mullion (center cross)
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(wx + ww / 2, headY)
    ctx.lineTo(wx + ww / 2, sillY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(wx, headY + wh / 2)
    ctx.lineTo(wx + ww, headY + wh / 2)
    ctx.stroke()

    // Sill (thick line at bottom)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(wx - 4, sillY)
    ctx.lineTo(wx + ww + 4, sillY)
    ctx.stroke()
  })

  // ── Dimensions ──
  if (showDims) {
    ctx.strokeStyle = '#1e293b'
    ctx.fillStyle = '#1e293b'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 0.5

    // Overall width dimension (below floor line)
    const dimY = toY(0) + 30
    ctx.beginPath()
    ctx.moveTo(ox, dimY)
    ctx.lineTo(ox + wallW, dimY)
    ctx.stroke()
    // Ticks
    for (const px of [ox, ox + wallW]) {
      ctx.beginPath()
      ctx.moveTo(px, dimY - 4)
      ctx.lineTo(px, dimY + 4)
      ctx.stroke()
    }
    ctx.fillText(formatFtIn(elev.wallLenInches), ox + wallW / 2, dimY + 12)

    // Overall height dimension (left side)
    const dimX = ox - 30
    ctx.beginPath()
    ctx.moveTo(dimX, toY(0))
    ctx.lineTo(dimX, toY(elev.wallHeightInches))
    ctx.stroke()
    for (const py of [toY(0), toY(elev.wallHeightInches)]) {
      ctx.beginPath()
      ctx.moveTo(dimX - 4, py)
      ctx.lineTo(dimX + 4, py)
      ctx.stroke()
    }
    ctx.save()
    ctx.translate(dimX - 12, toY(elev.wallHeightInches / 2))
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(formatFtIn(elev.wallHeightInches), 0, 0)
    ctx.restore()

    // Door/window heights
    elev.doors.forEach(door => {
      const dx = toX(door.positionInches)
      ctx.font = '8px sans-serif'
      ctx.fillText(formatFtIn(door.heightInches), dx, toY(door.heightInches) - 8)
    })

    elev.windows.forEach(win => {
      const wx = toX(win.positionInches + win.widthInches / 2)
      ctx.font = '8px sans-serif'
      ctx.fillText(`Sill ${formatFtIn(win.sillInches)}`, wx, toY(win.sillInches) + 12)
      ctx.fillText(`Head ${formatFtIn(win.headInches)}`, wx, toY(win.headInches) - 8)
    })
  }

  // ── Title ──
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('ELEVATION', ox + wallW / 2, toY(0) + 48)

  ctx.restore()
}

/**
 * Generate all four elevations (N/S/E/W) from plan walls.
 * Picks walls closest to each cardinal direction boundary.
 * @param {Array} walls
 * @param {Array} doors
 * @param {Array} windows
 * @returns {Array<{ direction: string, elevation: object }>}
 */
export function generateAllElevations(walls, doors, windows) {
  if (walls.length < 3) return []

  // Find bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  walls.forEach(w => {
    minX = Math.min(minX, w.x1, w.x2)
    maxX = Math.max(maxX, w.x1, w.x2)
    minY = Math.min(minY, w.y1, w.y2)
    maxY = Math.max(maxY, w.y1, w.y2)
  })

  // Classify walls by orientation and position
  const horizontal = walls.filter(w => Math.abs(w.y2 - w.y1) < Math.abs(w.x2 - w.x1) * 0.3)
  const vertical = walls.filter(w => Math.abs(w.x2 - w.x1) < Math.abs(w.y2 - w.y1) * 0.3)

  const results = []

  // North (top wall — smallest Y)
  const north = horizontal.sort((a, b) => Math.min(a.y1, a.y2) - Math.min(b.y1, b.y2))[0]
  if (north) {
    const elev = generateElevation(walls, doors, windows, north.id)
    if (elev) results.push({ direction: 'North', elevation: elev })
  }

  // South (bottom wall — largest Y)
  const south = horizontal.sort((a, b) => Math.max(b.y1, b.y2) - Math.max(a.y1, a.y2))[0]
  if (south && south.id !== north?.id) {
    const elev = generateElevation(walls, doors, windows, south.id)
    if (elev) results.push({ direction: 'South', elevation: elev })
  }

  // East (right wall — largest X)
  const east = vertical.sort((a, b) => Math.max(b.x1, b.x2) - Math.max(a.x1, a.x2))[0]
  if (east) {
    const elev = generateElevation(walls, doors, windows, east.id)
    if (elev) results.push({ direction: 'East', elevation: elev })
  }

  // West (left wall — smallest X)
  const west = vertical.sort((a, b) => Math.min(a.x1, a.x2) - Math.min(b.x1, b.x2))[0]
  if (west && west.id !== east?.id) {
    const elev = generateElevation(walls, doors, windows, west.id)
    if (elev) results.push({ direction: 'West', elevation: elev })
  }

  return results
}
