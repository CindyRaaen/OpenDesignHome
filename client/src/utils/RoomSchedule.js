// ─── Room / Area Schedule Generator ──────────────────────────────────────────
// Generates tabular room schedules from floor plan data.
// Draws formatted tables for:
//   - Room Schedule (name, area, floor finish, wall finish, ceiling height, notes)
//   - Door Schedule (mark, size, type, hardware, notes)
//   - Window Schedule (mark, size, type, sill height, notes)
//   - Finish Schedule (room, floor, base, walls, ceiling)
//
// Usage:
//   import { generateRoomSchedule, drawScheduleTable } from '../utils/RoomSchedule'
//   const schedule = generateRoomSchedule(roomLabels, furniture, measurements)
//   drawScheduleTable(ctx, schedule, x, y, maxWidth)

const GRID_SIZE = 20
const SCALE_FACTOR = 0.5

const pxToSqFt = (areaPx) => areaPx / (GRID_SIZE * GRID_SIZE) * (SCALE_FACTOR * SCALE_FACTOR)

/**
 * Generate room schedule data from room labels.
 * @param {Array} roomLabels - [{ id, x, y, name, area, finish?, wallFinish?, ceilingHeight?, notes? }]
 * @param {Array} furniture - Floor plan furniture items
 * @param {object} opts - { defaultCeilingHeight, defaultFloorFinish, defaultWallFinish }
 * @returns {object} Schedule data
 */
export function generateRoomSchedule(roomLabels, furniture = [], opts = {}) {
  const defaults = {
    ceilingHeight: opts.defaultCeilingHeight || "9'-0\"",
    floorFinish: opts.defaultFloorFinish || '—',
    wallFinish: opts.defaultWallFinish || '—',
    ceilingFinish: opts.defaultCeilingFinish || '—',
  }

  const rooms = roomLabels.map((rl, idx) => {
    // Count furniture in this room (rough proximity)
    const nearbyFurniture = furniture.filter(f =>
      Math.abs(f.x + 20 - rl.x) < 200 && Math.abs(f.y + 20 - rl.y) < 200
    )

    return {
      number: String(idx + 1).padStart(2, '0'),
      name: rl.name,
      area: rl.area ? `${rl.area} SF` : '—',
      floorFinish: rl.floorFinish || defaults.floorFinish,
      wallFinish: rl.wallFinish || defaults.wallFinish,
      ceilingHeight: rl.ceilingHeight || defaults.ceilingHeight,
      ceilingFinish: rl.ceilingFinish || defaults.ceilingFinish,
      furnitureCount: nearbyFurniture.length,
      notes: rl.notes || '',
    }
  })

  // Calculate totals
  const totalArea = roomLabels.reduce((sum, rl) => {
    return sum + (rl.area ? parseFloat(rl.area) : 0)
  }, 0)

  return {
    type: 'room',
    title: 'ROOM SCHEDULE',
    columns: [
      { key: 'number', label: 'NO.', width: 40 },
      { key: 'name', label: 'ROOM NAME', width: 120 },
      { key: 'area', label: 'AREA', width: 70, align: 'right' },
      { key: 'floorFinish', label: 'FLOOR', width: 80 },
      { key: 'wallFinish', label: 'WALLS', width: 80 },
      { key: 'ceilingHeight', label: 'CLG. HT.', width: 60, align: 'right' },
      { key: 'ceilingFinish', label: 'CEILING', width: 80 },
      { key: 'notes', label: 'NOTES', width: 120 },
    ],
    rows: rooms,
    totals: { area: `${totalArea.toFixed(1)} SF` },
  }
}

/**
 * Generate door schedule from door data.
 * @param {Array} doors - [{ id, x, y, width, rotation, type?, hardware?, fireRating? }]
 * @returns {object} Schedule data
 */
export function generateDoorSchedule(doors) {
  const pxToInches = (px) => px * SCALE_FACTOR * 12 / GRID_SIZE

  const rows = doors.map((d, idx) => {
    const widthInches = pxToInches(d.width || 40)
    const heightInches = d.heightInches || 80
    const ft = (inches) => {
      const f = Math.floor(inches / 12)
      const i = Math.round(inches % 12)
      return `${f}'-${i}"`
    }

    return {
      mark: `D${String(idx + 1).padStart(2, '0')}`,
      size: `${ft(widthInches)} x ${ft(heightInches)}`,
      type: d.type || 'Swing',
      material: d.material || 'Wood',
      hardware: d.hardware || 'Lever',
      fireRating: d.fireRating || '—',
      notes: d.notes || '',
    }
  })

  return {
    type: 'door',
    title: 'DOOR SCHEDULE',
    columns: [
      { key: 'mark', label: 'MARK', width: 50 },
      { key: 'size', label: 'SIZE', width: 90 },
      { key: 'type', label: 'TYPE', width: 70 },
      { key: 'material', label: 'MATERIAL', width: 70 },
      { key: 'hardware', label: 'HARDWARE', width: 70 },
      { key: 'fireRating', label: 'FIRE', width: 50 },
      { key: 'notes', label: 'NOTES', width: 120 },
    ],
    rows,
  }
}

/**
 * Generate window schedule from window data.
 * @param {Array} windows
 * @returns {object} Schedule data
 */
export function generateWindowSchedule(windows) {
  const pxToInches = (px) => px * SCALE_FACTOR * 12 / GRID_SIZE

  const rows = windows.map((w, idx) => {
    const lenPx = Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2)
    const widthInches = pxToInches(lenPx)
    const heightInches = w.heightInches || 48
    const sillInches = w.sillHeight || 36
    const ft = (inches) => {
      const f = Math.floor(inches / 12)
      const i = Math.round(inches % 12)
      return `${f}'-${i}"`
    }

    return {
      mark: `W${String(idx + 1).padStart(2, '0')}`,
      size: `${ft(widthInches)} x ${ft(heightInches)}`,
      type: w.type || 'Double Hung',
      sillHeight: ft(sillInches),
      glazing: w.glazing || 'Double',
      notes: w.notes || '',
    }
  })

  return {
    type: 'window',
    title: 'WINDOW SCHEDULE',
    columns: [
      { key: 'mark', label: 'MARK', width: 50 },
      { key: 'size', label: 'SIZE', width: 100 },
      { key: 'type', label: 'TYPE', width: 90 },
      { key: 'sillHeight', label: 'SILL HT.', width: 60, align: 'right' },
      { key: 'glazing', label: 'GLAZING', width: 70 },
      { key: 'notes', label: 'NOTES', width: 120 },
    ],
    rows,
  }
}

/**
 * Generate finish schedule from room labels.
 */
export function generateFinishSchedule(roomLabels) {
  const rows = roomLabels.map((rl, idx) => ({
    number: String(idx + 1).padStart(2, '0'),
    name: rl.name,
    floor: rl.floorFinish || '—',
    base: rl.baseFinish || 'Wood',
    northWall: rl.wallFinish || 'Paint',
    southWall: rl.wallFinish || 'Paint',
    eastWall: rl.wallFinish || 'Paint',
    westWall: rl.wallFinish || 'Paint',
    ceiling: rl.ceilingFinish || 'GWB',
  }))

  return {
    type: 'finish',
    title: 'FINISH SCHEDULE',
    columns: [
      { key: 'number', label: 'NO.', width: 35 },
      { key: 'name', label: 'ROOM', width: 100 },
      { key: 'floor', label: 'FLOOR', width: 70 },
      { key: 'base', label: 'BASE', width: 50 },
      { key: 'northWall', label: 'N WALL', width: 60 },
      { key: 'southWall', label: 'S WALL', width: 60 },
      { key: 'eastWall', label: 'E WALL', width: 60 },
      { key: 'westWall', label: 'W WALL', width: 60 },
      { key: 'ceiling', label: 'CEILING', width: 60 },
    ],
    rows,
  }
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

const TABLE_COLORS = {
  headerBg: '#1B3A5C',
  headerText: '#ffffff',
  rowBg: '#ffffff',
  altRowBg: '#f8fafc',
  borderColor: '#cbd5e1',
  textColor: '#1e293b',
  subtextColor: '#64748b',
  totalsBg: '#f1f5f9',
}

/**
 * Draw a formatted schedule table on a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} schedule - From generateRoomSchedule() etc.
 * @param {number} x - Left edge
 * @param {number} y - Top edge
 * @param {number} maxWidth - Optional max width (scales columns to fit)
 * @returns {{ width, height }} - Bounding box of the drawn table
 */
export function drawScheduleTable(ctx, schedule, x = 0, y = 0, maxWidth) {
  const ROW_HEIGHT = 18
  const HEADER_HEIGHT = 22
  const TITLE_HEIGHT = 24
  const PADDING = 4

  let columns = schedule.columns
  const naturalWidth = columns.reduce((sum, c) => sum + c.width, 0)

  // Scale columns to fit maxWidth if provided
  let scaleFactor = 1
  if (maxWidth && naturalWidth > maxWidth) {
    scaleFactor = maxWidth / naturalWidth
    columns = columns.map(c => ({ ...c, width: c.width * scaleFactor }))
  }

  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0)
  const rows = schedule.rows || []
  const totalHeight = TITLE_HEIGHT + HEADER_HEIGHT + rows.length * ROW_HEIGHT + (schedule.totals ? ROW_HEIGHT : 0)

  ctx.save()

  // Title bar
  ctx.fillStyle = TABLE_COLORS.headerBg
  ctx.fillRect(x, y, tableWidth, TITLE_HEIGHT)
  ctx.fillStyle = TABLE_COLORS.headerText
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(schedule.title, x + 8, y + TITLE_HEIGHT / 2)

  // Column headers
  let headerY = y + TITLE_HEIGHT
  ctx.fillStyle = '#334155'
  ctx.fillRect(x, headerY, tableWidth, HEADER_HEIGHT)
  ctx.fillStyle = TABLE_COLORS.headerText
  ctx.font = 'bold 8px sans-serif'

  let colX = x
  columns.forEach(col => {
    ctx.textAlign = col.align || 'left'
    const textX = col.align === 'right' ? colX + col.width - PADDING : colX + PADDING
    ctx.fillText(col.label, textX, headerY + HEADER_HEIGHT / 2)
    colX += col.width
  })

  // Data rows
  let rowY = headerY + HEADER_HEIGHT
  rows.forEach((row, rowIdx) => {
    // Alternating row background
    ctx.fillStyle = rowIdx % 2 === 0 ? TABLE_COLORS.rowBg : TABLE_COLORS.altRowBg
    ctx.fillRect(x, rowY, tableWidth, ROW_HEIGHT)

    // Row border
    ctx.strokeStyle = TABLE_COLORS.borderColor
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(x, rowY + ROW_HEIGHT)
    ctx.lineTo(x + tableWidth, rowY + ROW_HEIGHT)
    ctx.stroke()

    // Cell values
    ctx.fillStyle = TABLE_COLORS.textColor
    ctx.font = '8px sans-serif'
    let cellX = x
    columns.forEach(col => {
      const value = String(row[col.key] || '')
      ctx.textAlign = col.align || 'left'
      const textX = col.align === 'right' ? cellX + col.width - PADDING : cellX + PADDING
      // Truncate if too long
      let displayText = value
      const maxTextW = col.width - PADDING * 2
      while (ctx.measureText(displayText).width > maxTextW && displayText.length > 1) {
        displayText = displayText.slice(0, -2) + '…'
      }
      ctx.fillText(displayText, textX, rowY + ROW_HEIGHT / 2)
      cellX += col.width
    })

    rowY += ROW_HEIGHT
  })

  // Totals row
  if (schedule.totals) {
    ctx.fillStyle = TABLE_COLORS.totalsBg
    ctx.fillRect(x, rowY, tableWidth, ROW_HEIGHT)

    ctx.fillStyle = TABLE_COLORS.textColor
    ctx.font = 'bold 8px sans-serif'

    let cellX = x
    columns.forEach(col => {
      const value = schedule.totals[col.key]
      if (value) {
        ctx.textAlign = col.align || 'left'
        const textX = col.align === 'right' ? cellX + col.width - PADDING : cellX + PADDING
        ctx.fillText(value, textX, rowY + ROW_HEIGHT / 2)
      } else if (col === columns[0]) {
        ctx.textAlign = 'left'
        ctx.fillText('TOTAL', cellX + PADDING, rowY + ROW_HEIGHT / 2)
      }
      cellX += col.width
    })

    rowY += ROW_HEIGHT
  }

  // Outer border
  ctx.strokeStyle = TABLE_COLORS.headerBg
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, tableWidth, totalHeight)

  // Column separators
  ctx.strokeStyle = TABLE_COLORS.borderColor
  ctx.lineWidth = 0.5
  colX = x
  columns.forEach((col, idx) => {
    if (idx > 0) {
      ctx.beginPath()
      ctx.moveTo(colX, y + TITLE_HEIGHT)
      ctx.lineTo(colX, y + totalHeight)
      ctx.stroke()
    }
    colX += col.width
  })

  ctx.restore()

  return { width: tableWidth, height: totalHeight }
}
