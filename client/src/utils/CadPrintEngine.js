/**
 * CAD Print Engine — Scale Printing for Architectural Floor Plans
 *
 * Converts floor plan canvas data into print-ready, to-scale PDF documents
 * with title blocks, scale bars, line weights, and proper architectural conventions.
 *
 * Coordinate System:
 *   Canvas: 1 GRID_SIZE (20px) = 0.5 feet = 6 inches
 *   So 1 pixel = 0.3 inches real-world
 *   Conversion: realInches = pixelValue * (SCALE_FACTOR * 12 / GRID_SIZE)
 *            = pixelValue * (0.5 * 12 / 20) = pixelValue * 0.3
 */

// ═══════════════════════════════════════════
// PAPER SIZES (width × height in inches, printable area excludes 0.5" margins)
// ═══════════════════════════════════════════

export const PAPER_SIZES = {
  // US Architectural
  'ARCH A':   { w: 9,    h: 12,   label: 'ARCH A (9×12)' },
  'ARCH B':   { w: 12,   h: 18,   label: 'ARCH B (12×18)' },
  'ARCH C':   { w: 18,   h: 24,   label: 'ARCH C (18×24)' },
  'ARCH D':   { w: 24,   h: 36,   label: 'ARCH D (24×36)' },
  'ARCH E':   { w: 36,   h: 48,   label: 'ARCH E (36×48)' },
  // US ANSI
  'ANSI A':   { w: 8.5,  h: 11,   label: 'Letter (8.5×11)' },
  'ANSI B':   { w: 11,   h: 17,   label: 'Tabloid (11×17)' },
  // ISO
  'A4':       { w: 8.27, h: 11.69, label: 'A4 (210×297mm)' },
  'A3':       { w: 11.69,h: 16.54, label: 'A3 (297×420mm)' },
  'A2':       { w: 16.54,h: 23.39, label: 'A2 (420×594mm)' },
  'A1':       { w: 23.39,h: 33.11, label: 'A1 (594×841mm)' },
}

// ═══════════════════════════════════════════
// ARCHITECTURAL SCALES
// ═══════════════════════════════════════════

export const ARCH_SCALES = {
  '1/8"=1\'-0"':  { ratio: 96,   label: '1/8" = 1\'-0"',  shortLabel: '1/8"' },
  '3/16"=1\'-0"': { ratio: 64,   label: '3/16" = 1\'-0"', shortLabel: '3/16"' },
  '1/4"=1\'-0"':  { ratio: 48,   label: '1/4" = 1\'-0"',  shortLabel: '1/4"' },
  '3/8"=1\'-0"':  { ratio: 32,   label: '3/8" = 1\'-0"',  shortLabel: '3/8"' },
  '1/2"=1\'-0"':  { ratio: 24,   label: '1/2" = 1\'-0"',  shortLabel: '1/2"' },
  '3/4"=1\'-0"':  { ratio: 16,   label: '3/4" = 1\'-0"',  shortLabel: '3/4"' },
  '1"=1\'-0"':    { ratio: 12,   label: '1" = 1\'-0"',     shortLabel: '1"' },
  '1-1/2"=1\'-0"':{ ratio: 8,    label: '1-1/2" = 1\'-0"', shortLabel: '1-1/2"' },
  '3"=1\'-0"':    { ratio: 4,    label: '3" = 1\'-0"',     shortLabel: '3"' },
  'FIT':          { ratio: null,  label: 'Fit to Page',     shortLabel: 'Fit' },
}

// ═══════════════════════════════════════════
// LINE WEIGHTS (in points at 72 DPI)
// ═══════════════════════════════════════════

export const LINE_WEIGHTS = {
  wall:       1.8,   // heavy — structural walls
  door:       0.8,   // medium — doors, openings
  window:     0.8,   // medium
  furniture:  0.5,   // light
  dimension:  0.25,  // hairline
  grid:       0.1,   // ultra-thin
  border:     2.0,   // drawing border
  titleLine:  1.2,   // title block dividers
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const GRID_SIZE = 20
const SCALE_FACTOR = 0.5
const MARGIN = 0.5          // inches — print margin
const TITLE_BLOCK_H = 1.0   // inches — title block height at bottom
const DPI = 150              // render DPI for the offscreen canvas

// Convert floor-plan pixels to real-world inches
function pxToInches(px) {
  return px * (SCALE_FACTOR * 12) / GRID_SIZE  // px * 0.3
}

// Convert real-world inches to print inches at a given scale ratio
function realToPrint(realInches, ratio) {
  return realInches / ratio
}

// ═══════════════════════════════════════════
// LAYOUT CALCULATOR
// ═══════════════════════════════════════════

/**
 * Calculate how the floor plan fits on the chosen paper at the chosen scale.
 * Returns layout info needed by the renderer.
 */
export function calculatePrintLayout({ paperKey, scaleKey, canvasWidth, canvasHeight, orientation = 'landscape' }) {
  const paper = PAPER_SIZES[paperKey]
  const scale = ARCH_SCALES[scaleKey]
  if (!paper || !scale) return null

  // Paper dimensions (swap for landscape)
  let pw = orientation === 'landscape' ? Math.max(paper.w, paper.h) : Math.min(paper.w, paper.h)
  let ph = orientation === 'landscape' ? Math.min(paper.w, paper.h) : Math.max(paper.w, paper.h)

  // Printable area (subtract margins and title block)
  const drawW = pw - 2 * MARGIN
  const drawH = ph - 2 * MARGIN - TITLE_BLOCK_H

  // Floor plan real-world dimensions in inches
  const planRealW = pxToInches(canvasWidth)
  const planRealH = pxToInches(canvasHeight)

  let ratio
  if (scale.ratio === null) {
    // Fit to page: find largest ratio that fits
    const ratioW = planRealW / drawW
    const ratioH = planRealH / drawH
    ratio = Math.max(ratioW, ratioH)
  } else {
    ratio = scale.ratio
  }

  // Plan dimensions in print inches
  const printW = planRealW / ratio
  const printH = planRealH / ratio

  // Does it fit?
  const fits = printW <= drawW + 0.01 && printH <= drawH + 0.01

  // Centering offset within printable area
  const offsetX = MARGIN + (drawW - printW) / 2
  const offsetY = MARGIN + (drawH - printH) / 2

  return {
    paper: { w: pw, h: ph, key: paperKey },
    scale: { ratio, key: scaleKey, label: scale.label },
    printable: { w: drawW, h: drawH },
    plan: { realW: planRealW, realH: planRealH, printW, printH },
    offset: { x: offsetX, y: offsetY },
    fits,
    orientation,
    dpi: DPI,
    titleBlockH: TITLE_BLOCK_H,
    margin: MARGIN,
  }
}

/**
 * Suggest the best scale for a given paper + plan combination.
 */
export function suggestScale(paperKey, canvasWidth, canvasHeight, orientation = 'landscape') {
  const scaleKeys = Object.keys(ARCH_SCALES).filter(k => k !== 'FIT')
  for (const key of scaleKeys) {
    const layout = calculatePrintLayout({ paperKey, scaleKey: key, canvasWidth, canvasHeight, orientation })
    if (layout?.fits) return key
  }
  return 'FIT'
}


// ═══════════════════════════════════════════
// SCALE BAR RENDERER
// ═══════════════════════════════════════════

/**
 * Draw an architectural scale bar onto a 2D context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x — left position in print inches
 * @param {number} y — top position in print inches
 * @param {number} ratio — scale ratio (e.g., 48 for 1/4"=1'-0")
 * @param {number} ppi — pixels per inch on the output canvas
 */
export function drawScaleBar(ctx, x, y, ratio, ppi) {
  const feetToShow = ratio <= 12 ? 4 : ratio <= 24 ? 8 : ratio <= 48 ? 12 : 20
  const segmentFeet = ratio <= 12 ? 1 : ratio <= 24 ? 2 : ratio <= 48 ? 2 : 4
  const segments = feetToShow / segmentFeet

  const segPrintIn = (segmentFeet * 12) / ratio
  const barH = 0.12

  const px = x * ppi
  const py = y * ppi
  const segPx = segPrintIn * ppi
  const hPx = barH * ppi

  ctx.save()
  ctx.lineWidth = 0.8
  ctx.strokeStyle = '#000000'
  ctx.fillStyle = '#000000'
  ctx.font = `${Math.round(7 * ppi / 72)}px "Times New Roman", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  for (let i = 0; i < segments; i++) {
    const sx = px + i * segPx
    if (i % 2 === 0) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(sx, py, segPx, hPx)
    } else {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(sx, py, segPx, hPx)
      ctx.strokeRect(sx, py, segPx, hPx)
    }
    // Tick label
    ctx.fillStyle = '#000000'
    ctx.fillText(`${i * segmentFeet}'`, sx, py + hPx + 2)
  }
  // Last tick label
  ctx.fillText(`${feetToShow}'`, px + segments * segPx, py + hPx + 2)

  // Outline
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 0.8
  ctx.strokeRect(px, py, segments * segPx, hPx)

  ctx.restore()
}

// ═══════════════════════════════════════════
// TITLE BLOCK RENDERER
// ═══════════════════════════════════════════

/**
 * Draw the title block at the bottom of the sheet.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} layout — from calculatePrintLayout
 * @param {object} meta — { projectName, clientName, firmName, drawnBy, date, sheetNumber, sheetTitle }
 * @param {number} ppi — pixels per inch
 */
export function drawTitleBlock(ctx, layout, meta, ppi) {
  const { paper, margin, titleBlockH, scale } = layout
  const bx = margin
  const by = paper.h - margin - titleBlockH
  const bw = paper.w - 2 * margin
  const bh = titleBlockH

  const px = bx * ppi
  const py = by * ppi
  const pw = bw * ppi
  const ph = bh * ppi

  ctx.save()

  // Border
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = LINE_WEIGHTS.border
  ctx.strokeRect(px, py, pw, ph)

  // Vertical dividers: [project info ~55%] | [scale/sheet ~25%] | [firm ~20%]
  const col1 = pw * 0.55
  const col2 = pw * 0.80

  ctx.lineWidth = LINE_WEIGHTS.titleLine
  ctx.beginPath()
  ctx.moveTo(px + col1, py); ctx.lineTo(px + col1, py + ph)
  ctx.moveTo(px + col2, py); ctx.lineTo(px + col2, py + ph)
  ctx.stroke()

  // Horizontal divider in col1 at 50%
  ctx.beginPath()
  ctx.moveTo(px, py + ph * 0.5); ctx.lineTo(px + col1, py + ph * 0.5)
  ctx.stroke()

  const fontBase = Math.round(8 * ppi / 72)
  const fontLg = Math.round(11 * ppi / 72)
  const fontSm = Math.round(6.5 * ppi / 72)
  const pad = 6

  // Column 1 — Top: project + client
  ctx.fillStyle = '#000000'
  ctx.font = `bold ${fontLg}px "Times New Roman", serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(meta.projectName || 'Untitled Project', px + pad, py + pad)

  ctx.font = `${fontBase}px "Times New Roman", serif`
  ctx.fillText(meta.clientName || '', px + pad, py + pad + fontLg + 3)

  // Column 1 — Bottom: sheet title + drawn by
  ctx.font = `bold ${fontBase}px "Times New Roman", serif`
  ctx.fillText(meta.sheetTitle || 'Floor Plan', px + pad, py + ph * 0.5 + pad)

  ctx.font = `${fontSm}px "Times New Roman", serif`
  ctx.fillStyle = '#555555'
  ctx.fillText(`Drawn: ${meta.drawnBy || '—'}  |  Date: ${meta.date || new Date().toLocaleDateString()}`, px + pad, py + ph * 0.5 + pad + fontBase + 4)

  // Column 2 — Scale + Sheet number
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  const col2Center = px + col1 + (col2 - col1) / 2

  ctx.font = `${fontSm}px "Times New Roman", serif`
  ctx.fillText('SCALE', col2Center, py + pad)
  ctx.font = `bold ${fontBase}px "Times New Roman", serif`
  ctx.fillText(scale.label || 'Fit', col2Center, py + pad + fontSm + 4)

  ctx.font = `${fontSm}px "Times New Roman", serif`
  ctx.fillText('SHEET', col2Center, py + ph * 0.5 + pad)
  ctx.font = `bold ${fontLg}px "Times New Roman", serif`
  ctx.fillText(meta.sheetNumber || 'A-1', col2Center, py + ph * 0.5 + pad + fontSm + 4)

  // Column 3 — Firm name
  const col3Center = px + col2 + (pw - col2) / 2
  ctx.font = `bold ${fontBase}px "Times New Roman", serif`
  ctx.textAlign = 'center'
  ctx.fillText(meta.firmName || 'Open Interior Designer', col3Center, py + ph * 0.35)
  ctx.font = `${fontSm}px "Times New Roman", serif`
  ctx.fillStyle = '#555555'
  ctx.fillText('openscaffold.com', col3Center, py + ph * 0.35 + fontBase + 3)

  ctx.restore()
}

// ═══════════════════════════════════════════
// DRAWING BORDER RENDERER
// ═══════════════════════════════════════════

export function drawBorder(ctx, layout, ppi) {
  const { paper, margin } = layout
  const px = margin * ppi
  const py = margin * ppi
  const pw = (paper.w - 2 * margin) * ppi
  const ph = (paper.h - 2 * margin) * ppi

  ctx.save()
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = LINE_WEIGHTS.border
  ctx.strokeRect(px, py, pw, ph)
  ctx.restore()
}

// ═══════════════════════════════════════════
// MAIN FLOOR PLAN RENDERER (for print)
// ═══════════════════════════════════════════

/**
 * Render the floor plan onto a print-scale canvas context.
 * This re-draws everything from raw data (walls, doors, windows, furniture, measurements)
 * using architectural line weights and no selection highlights.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} layout — from calculatePrintLayout
 * @param {object} data — { walls, doors, windows, furniture, measurements }
 * @param {number} ppi — pixels per inch on the output canvas
 */
export function drawFloorPlanForPrint(ctx, layout, data, ppi) {
  const { walls, doors, windows, furniture, measurements } = data
  const { plan, offset, scale } = layout
  const ratio = scale.ratio

  // Scale: from plan pixels → print position
  //   planPixel → realInches → printInches → canvasPixels
  //   canvasX = offset.x * ppi + (px * 0.3 / ratio) * ppi
  const s = (ppi * SCALE_FACTOR * 12) / (GRID_SIZE * ratio)
  const ox = offset.x * ppi
  const oy = offset.y * ppi

  function tx(px) { return ox + px * s }
  function ty(py) { return oy + py * s }
  function ts(px) { return px * s }

  ctx.save()

  // ── Plan border (thin) ──
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 0.5
  ctx.strokeRect(ox, oy, plan.printW * ppi, plan.printH * ppi)

  // ── Furniture (draw first, under walls) ──
  furniture.forEach(f => {
    const fw = (f.w ? f.w * GRID_SIZE : f.width || 40)
    const fh = (f.h ? f.h * GRID_SIZE : f.height || 40)
    const cx = tx(f.x + fw / 2)
    const cy = ty(f.y + fh / 2)
    const pw = ts(fw)
    const ph = ts(fh)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(((f.rotation || 0) * Math.PI) / 180)

    // Fill
    ctx.fillStyle = (f.color || '#94a3b8') + '40'
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph)

    // Outline
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = LINE_WEIGHTS.furniture
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph)

    // Label
    const fontSize = Math.max(4, Math.min(8, pw * 0.12))
    ctx.fillStyle = '#333333'
    ctx.font = `${fontSize}px "Helvetica", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(f.label || '', 0, 0)

    ctx.restore()
  })

  // ── Walls (heavy line weight) ──
  walls.forEach(wall => {
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = LINE_WEIGHTS.wall
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tx(wall.x1), ty(wall.y1))

    if (wall.curve) {
      const { cx, cy, radius, startAngle, endAngle } = wall.curve
      ctx.arc(tx(cx), ty(cy), ts(radius), startAngle, endAngle, false)
    } else {
      ctx.lineTo(tx(wall.x2), ty(wall.y2))
    }
    ctx.stroke()

    // Wall dimension text
    let len
    if (wall.curve) {
      const { radius, startAngle, endAngle } = wall.curve
      len = Math.abs(endAngle - startAngle) * radius
    } else {
      len = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2)
    }
    const realIn = pxToInches(len)
    const feet = Math.floor(realIn / 12)
    const inches = Math.round(realIn % 12)
    const label = feet > 0 ? `${feet}'-${inches}"` : `${inches}"`

    const mx = (tx(wall.x1) + tx(wall.x2)) / 2
    const my = (ty(wall.y1) + ty(wall.y2)) / 2
    ctx.fillStyle = '#000000'
    ctx.font = `${Math.max(5, 6)}px "Helvetica", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(label, mx, my - 3)
  })

  // ── Doors ──
  doors.forEach(door => {
    ctx.save()
    ctx.translate(tx(door.x), ty(door.y))
    ctx.rotate(((door.rotation || 0) * Math.PI) / 180)

    const dw = ts(door.width || 40)

    // Swing arc (dashed)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = LINE_WEIGHTS.door
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(0, 0, dw, 0, -Math.PI / 2, true)
    ctx.stroke()
    ctx.setLineDash([])

    // Door panel line
    ctx.lineWidth = LINE_WEIGHTS.door
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(dw, 0)
    ctx.stroke()

    ctx.restore()
  })

  // ── Windows ──
  windows.forEach(win => {
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = LINE_WEIGHTS.window

    // Main line
    ctx.beginPath()
    ctx.moveTo(tx(win.x1), ty(win.y1))
    ctx.lineTo(tx(win.x2), ty(win.y2))
    ctx.stroke()

    // Cross-hatching
    const dx = tx(win.x2) - tx(win.x1)
    const dy = ty(win.y2) - ty(win.y1)
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) {
      const nx = -dy / len * 4
      const ny = dx / len * 4
      const mx = (tx(win.x1) + tx(win.x2)) / 2
      const my = (ty(win.y1) + ty(win.y2)) / 2

      ctx.lineWidth = LINE_WEIGHTS.dimension
      ctx.beginPath()
      ctx.moveTo(mx - nx, my - ny)
      ctx.lineTo(mx + nx, my + ny)
      ctx.stroke()
    }
  })

  // ── Measurements / Dimensions ──
  measurements.forEach(m => {
    const x1 = tx(m.x1), y1 = ty(m.y1)
    const x2 = tx(m.x2), y2 = ty(m.y2)

    // Dimension line
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = LINE_WEIGHTS.dimension
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.setLineDash([])

    // Endpoint ticks
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) {
      const nx = -dy / len * 4
      const ny = dx / len * 4

      ctx.beginPath()
      ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x1 + nx, y1 + ny)
      ctx.moveTo(x2 - nx, y2 - ny); ctx.lineTo(x2 + nx, y2 + ny)
      ctx.stroke()
    }

    // Label
    const pxLen = Math.sqrt((m.x2 - m.x1) ** 2 + (m.y2 - m.y1) ** 2)
    const realIn = pxToInches(pxLen)
    const feet = Math.floor(realIn / 12)
    const inches = Math.round(realIn % 12)
    const label = feet > 0 ? `${feet}'-${inches}"` : `${inches}"`

    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2

    ctx.fillStyle = '#ffffff'
    const tw = ctx.measureText(label).width + 6
    ctx.fillRect(mx - tw / 2, my - 6, tw, 12)

    ctx.fillStyle = '#000000'
    ctx.font = `bold ${Math.max(5, 6)}px "Helvetica", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, mx, my)
  })

  ctx.restore()
}


// ═══════════════════════════════════════════
// FULL-SHEET RENDERER → Returns a Canvas
// ═══════════════════════════════════════════

/**
 * Generate a complete print-ready sheet as an offscreen canvas.
 *
 * @param {object} layout — from calculatePrintLayout
 * @param {object} data — { walls, doors, windows, furniture, measurements }
 * @param {object} meta — title block metadata
 * @returns {HTMLCanvasElement}
 */
export function renderPrintSheet(layout, data, meta) {
  const ppi = layout.dpi
  const canvasW = Math.round(layout.paper.w * ppi)
  const canvasH = Math.round(layout.paper.h * ppi)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH

  const ctx = canvas.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Drawing border
  drawBorder(ctx, layout, ppi)

  // Floor plan
  drawFloorPlanForPrint(ctx, layout, data, ppi)

  // Scale bar (bottom-left of printable area, above title block)
  const sbx = layout.margin + 0.1
  const sby = layout.paper.h - layout.margin - layout.titleBlockH - 0.35
  drawScaleBar(ctx, sbx, sby, layout.scale.ratio, ppi)

  // Title block
  drawTitleBlock(ctx, layout, meta, ppi)

  return canvas
}


// ═══════════════════════════════════════════
// PDF EXPORT (using jsPDF loaded from CDN)
// ═══════════════════════════════════════════

let jsPDFLoaded = null

async function loadJsPDF() {
  if (jsPDFLoaded) return jsPDFLoaded
  if (window.jspdf?.jsPDF) { jsPDFLoaded = window.jspdf.jsPDF; return jsPDFLoaded }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js'
    script.onload = () => {
      jsPDFLoaded = window.jspdf.jsPDF
      resolve(jsPDFLoaded)
    }
    script.onerror = () => reject(new Error('Failed to load jsPDF'))
    document.head.appendChild(script)
  })
}

/**
 * Export a print sheet to PDF and trigger download.
 *
 * @param {object} layout — from calculatePrintLayout
 * @param {object} data — { walls, doors, windows, furniture, measurements }
 * @param {object} meta — title block metadata
 * @param {string} filename
 */
export async function exportToPDF(layout, data, meta, filename = 'floor-plan.pdf') {
  const JsPDF = await loadJsPDF()

  const canvas = renderPrintSheet(layout, data, meta)
  const imgData = canvas.toDataURL('image/png', 1.0)

  const orientation = layout.orientation === 'landscape' ? 'landscape' : 'portrait'
  const pdf = new JsPDF({
    orientation,
    unit: 'in',
    format: [layout.paper.w, layout.paper.h],
  })

  // Add the rendered canvas as a full-page image
  pdf.addImage(imgData, 'PNG', 0, 0, layout.paper.w, layout.paper.h, undefined, 'FAST')

  pdf.save(filename)
}
