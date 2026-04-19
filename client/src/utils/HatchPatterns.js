// ─── Hatch Patterns for CAD Floor Plans ─────────────────────────────────────
// Provides standard architectural hatch fills for walls, floors, and materials.
// Each pattern is a function that draws into a given canvas context within a
// bounding region. Patterns tile seamlessly.
//
// Usage:
//   import { HATCH_PATTERNS, drawHatch } from '../utils/HatchPatterns'
//   drawHatch(ctx, 'diagonal', x, y, w, h, { color: '#64748b', spacing: 8 })

export const HATCH_PATTERNS = {
  // ── Structural / Wall hatches ──
  diagonal: {
    name: 'Diagonal Lines',
    category: 'general',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const spacing = opts.spacing || 8
      const color = opts.color || '#64748b'
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      const total = w + h
      for (let d = -h; d < total; d += spacing) {
        ctx.beginPath()
        ctx.moveTo(x + d, y)
        ctx.lineTo(x + d + h, y + h)
        ctx.stroke()
      }
      ctx.restore()
    },
  },

  crosshatch: {
    name: 'Cross Hatch',
    category: 'general',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const spacing = opts.spacing || 10
      const color = opts.color || '#64748b'
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      const total = w + h
      // Forward diagonals
      for (let d = -h; d < total; d += spacing) {
        ctx.beginPath()
        ctx.moveTo(x + d, y)
        ctx.lineTo(x + d + h, y + h)
        ctx.stroke()
      }
      // Backward diagonals
      for (let d = -h; d < total; d += spacing) {
        ctx.beginPath()
        ctx.moveTo(x + w - d, y)
        ctx.lineTo(x + w - d - h, y + h)
        ctx.stroke()
      }
      ctx.restore()
    },
  },

  horizontal: {
    name: 'Horizontal Lines',
    category: 'general',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const spacing = opts.spacing || 6
      const color = opts.color || '#64748b'
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      for (let dy = 0; dy <= h; dy += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, y + dy)
        ctx.lineTo(x + w, y + dy)
        ctx.stroke()
      }
      ctx.restore()
    },
  },

  vertical: {
    name: 'Vertical Lines',
    category: 'general',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const spacing = opts.spacing || 6
      const color = opts.color || '#64748b'
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      for (let dx = 0; dx <= w; dx += spacing) {
        ctx.beginPath()
        ctx.moveTo(x + dx, y)
        ctx.lineTo(x + dx, y + h)
        ctx.stroke()
      }
      ctx.restore()
    },
  },

  // ── Material-specific hatches ──
  concrete: {
    name: 'Concrete',
    category: 'material',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const color = opts.color || '#94a3b8'
      const dotSpacing = opts.spacing || 8
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.fillStyle = color
      // Random-looking dot pattern (deterministic seed from position)
      for (let dy = 0; dy < h; dy += dotSpacing) {
        for (let dx = 0; dx < w; dx += dotSpacing) {
          // Pseudo-random offset using simple hash
          const hash = ((dx * 73 + dy * 137) % 17) / 17
          const ox = hash * dotSpacing * 0.6
          const oy = ((dx * 37 + dy * 97) % 13) / 13 * dotSpacing * 0.6
          ctx.beginPath()
          ctx.arc(x + dx + ox, y + dy + oy, 0.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      // Add sparse triangular aggregate shapes
      for (let dy = 0; dy < h; dy += dotSpacing * 3) {
        for (let dx = 0; dx < w; dx += dotSpacing * 4) {
          const hash = ((dx * 53 + dy * 89) % 23) / 23
          if (hash > 0.5) continue
          const sz = 2 + hash * 3
          ctx.beginPath()
          ctx.moveTo(x + dx + sz, y + dy)
          ctx.lineTo(x + dx + sz * 2, y + dy + sz * 1.5)
          ctx.lineTo(x + dx, y + dy + sz * 1.5)
          ctx.closePath()
          ctx.stroke()
        }
      }
      ctx.restore()
    },
  },

  brick: {
    name: 'Brick',
    category: 'material',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const color = opts.color || '#94a3b8'
      const brickW = opts.spacing || 16
      const brickH = brickW * 0.45
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      let row = 0
      for (let dy = 0; dy < h + brickH; dy += brickH) {
        // Horizontal mortar line
        ctx.beginPath()
        ctx.moveTo(x, y + dy)
        ctx.lineTo(x + w, y + dy)
        ctx.stroke()
        // Vertical mortar lines (offset every other row)
        const offset = row % 2 === 0 ? 0 : brickW / 2
        for (let dx = offset; dx < w + brickW; dx += brickW) {
          ctx.beginPath()
          ctx.moveTo(x + dx, y + dy)
          ctx.lineTo(x + dx, y + dy + brickH)
          ctx.stroke()
        }
        row++
      }
      ctx.restore()
    },
  },

  wood: {
    name: 'Wood Grain',
    category: 'material',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const color = opts.color || '#a3865a'
      const spacing = opts.spacing || 5
      const lineWidth = opts.lineWidth || 0.4
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      // Wavy horizontal lines for wood grain
      for (let dy = 0; dy < h; dy += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, y + dy)
        for (let dx = 0; dx < w; dx += 4) {
          const wave = Math.sin((dx + dy * 0.3) * 0.15) * 1.5
          ctx.lineTo(x + dx, y + dy + wave)
        }
        ctx.stroke()
      }
      ctx.restore()
    },
  },

  tile: {
    name: 'Tile',
    category: 'material',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const color = opts.color || '#94a3b8'
      const tileSize = opts.spacing || 12
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      // Grid of squares with diagonal
      for (let dy = 0; dy < h + tileSize; dy += tileSize) {
        for (let dx = 0; dx < w + tileSize; dx += tileSize) {
          ctx.strokeRect(x + dx, y + dy, tileSize, tileSize)
        }
      }
      ctx.restore()
    },
  },

  insulation: {
    name: 'Insulation',
    category: 'material',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const color = opts.color || '#94a3b8'
      const spacing = opts.spacing || 12
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      // Wavy S-curves (standard insulation symbol)
      for (let dx = 0; dx < w + spacing; dx += spacing) {
        ctx.beginPath()
        ctx.moveTo(x + dx, y)
        for (let dy = 0; dy < h; dy += spacing) {
          const cx1 = x + dx + spacing * 0.5
          const cy1 = y + dy + spacing * 0.25
          const cx2 = x + dx - spacing * 0.5
          const cy2 = y + dy + spacing * 0.75
          ctx.quadraticCurveTo(cx1, cy1, x + dx, y + dy + spacing * 0.5)
          ctx.quadraticCurveTo(cx2, cy2, x + dx, y + dy + spacing)
        }
        ctx.stroke()
      }
      ctx.restore()
    },
  },

  earth: {
    name: 'Earth/Ground',
    category: 'material',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const color = opts.color || '#94a3b8'
      const spacing = opts.spacing || 6
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      // Short dashes at various angles (earth fill convention)
      for (let dy = 0; dy < h; dy += spacing) {
        for (let dx = 0; dx < w; dx += spacing * 1.5) {
          const hash = ((dx * 41 + dy * 67) % 19) / 19
          const angle = hash * Math.PI * 0.6 - 0.3
          const len = 2 + hash * 2
          ctx.beginPath()
          ctx.moveTo(x + dx - Math.cos(angle) * len, y + dy - Math.sin(angle) * len)
          ctx.lineTo(x + dx + Math.cos(angle) * len, y + dy + Math.sin(angle) * len)
          ctx.stroke()
        }
      }
      ctx.restore()
    },
  },

  stone: {
    name: 'Stone',
    category: 'material',
    draw: (ctx, x, y, w, h, opts = {}) => {
      const color = opts.color || '#94a3b8'
      const spacing = opts.spacing || 14
      const lineWidth = opts.lineWidth || 0.5
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      // Irregular stone shapes
      for (let dy = 0; dy < h + spacing; dy += spacing) {
        for (let dx = 0; dx < w + spacing; dx += spacing) {
          const hash1 = ((dx * 59 + dy * 83) % 29) / 29
          const hash2 = ((dx * 31 + dy * 71) % 23) / 23
          const sw = spacing * (0.6 + hash1 * 0.8)
          const sh = spacing * (0.5 + hash2 * 0.6)
          const ox = hash1 * spacing * 0.3
          const oy = hash2 * spacing * 0.2
          ctx.beginPath()
          ctx.moveTo(x + dx + ox + 2, y + dy + oy)
          ctx.lineTo(x + dx + ox + sw - 2, y + dy + oy)
          ctx.lineTo(x + dx + ox + sw, y + dy + oy + sh * 0.5)
          ctx.lineTo(x + dx + ox + sw - 2, y + dy + oy + sh)
          ctx.lineTo(x + dx + ox + 2, y + dy + oy + sh)
          ctx.lineTo(x + dx + ox, y + dy + oy + sh * 0.5)
          ctx.closePath()
          ctx.stroke()
        }
      }
      ctx.restore()
    },
  },
}

/**
 * Draw a hatch pattern into a rectangular region.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} patternName - Key from HATCH_PATTERNS
 * @param {number} x - Left edge
 * @param {number} y - Top edge
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {object} opts - { color, spacing, lineWidth, opacity }
 */
export function drawHatch(ctx, patternName, x, y, w, h, opts = {}) {
  const pattern = HATCH_PATTERNS[patternName]
  if (!pattern) return
  ctx.save()
  if (opts.opacity !== undefined) ctx.globalAlpha = opts.opacity
  pattern.draw(ctx, x, y, w, h, opts)
  ctx.restore()
}

/**
 * Get all pattern names grouped by category.
 * @returns {{ general: string[], material: string[] }}
 */
export function getPatternsByCategory() {
  const groups = {}
  for (const [key, pat] of Object.entries(HATCH_PATTERNS)) {
    const cat = pat.category || 'general'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push({ key, name: pat.name })
  }
  return groups
}

/**
 * Draw a small preview swatch of a hatch pattern.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} patternName
 * @param {number} x
 * @param {number} y
 * @param {number} size - Width and height of the swatch
 */
export function drawHatchSwatch(ctx, patternName, x, y, size = 24) {
  ctx.save()
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, size, size)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, size, size)
  drawHatch(ctx, patternName, x, y, size, size, { color: '#475569', spacing: 6 })
  ctx.restore()
}
