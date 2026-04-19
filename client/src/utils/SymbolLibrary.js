// ─── Architectural Symbol Library ────────────────────────────────────────────
// Standard CAD symbols for interior design floor plans.
// Each symbol is a draw function that renders at a given position and scale.
//
// Categories: Electrical, Plumbing, HVAC, Fire Safety, Accessibility, General
//
// Usage:
//   import { SYMBOLS, drawSymbol, getSymbolsByCategory } from '../utils/SymbolLibrary'
//   drawSymbol(ctx, 'outlet-duplex', x, y, { scale: 1, rotation: 0 })

/**
 * Symbol definition: { name, category, draw(ctx, x, y, size, opts) }
 * All symbols are drawn centered at (x, y) within a bounding box of `size` px.
 */
export const SYMBOLS = {
  // ── ELECTRICAL ─────────────────────────────────────────────────────────────
  'outlet-duplex': {
    name: 'Duplex Outlet',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.4
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Two parallel lines (receptacle symbol)
      const gap = r * 0.3
      ctx.beginPath()
      ctx.moveTo(x - gap, y - r * 0.5)
      ctx.lineTo(x - gap, y + r * 0.5)
      ctx.moveTo(x + gap, y - r * 0.5)
      ctx.lineTo(x + gap, y + r * 0.5)
      ctx.stroke()
    },
  },

  'outlet-gfci': {
    name: 'GFCI Outlet',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.4
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `bold ${size * 0.3}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('GFI', x, y)
    },
  },

  'outlet-floor': {
    name: 'Floor Outlet',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.4
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Filled circle inside
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.beginPath()
      ctx.arc(x, y, r * 0.3, 0, Math.PI * 2)
      ctx.fill()
    },
  },

  'switch-single': {
    name: 'Single Switch',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      // S symbol
      ctx.font = `bold ${size * 0.5}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('S', x, y)
      // Line to wall
      ctx.beginPath()
      ctx.moveTo(x, y + size * 0.25)
      ctx.lineTo(x, y + size * 0.45)
      ctx.stroke()
    },
  },

  'switch-3way': {
    name: '3-Way Switch',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.font = `bold ${size * 0.45}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('S₃', x, y)
      ctx.beginPath()
      ctx.moveTo(x, y + size * 0.25)
      ctx.lineTo(x, y + size * 0.45)
      ctx.stroke()
    },
  },

  'switch-dimmer': {
    name: 'Dimmer Switch',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.font = `bold ${size * 0.45}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('SD', x, y)
      ctx.beginPath()
      ctx.moveTo(x, y + size * 0.25)
      ctx.lineTo(x, y + size * 0.45)
      ctx.stroke()
    },
  },

  'light-ceiling': {
    name: 'Ceiling Light',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.35
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Cross lines
      ctx.beginPath()
      ctx.moveTo(x - r * 0.7, y - r * 0.7)
      ctx.lineTo(x + r * 0.7, y + r * 0.7)
      ctx.moveTo(x + r * 0.7, y - r * 0.7)
      ctx.lineTo(x - r * 0.7, y + r * 0.7)
      ctx.stroke()
    },
  },

  'light-recessed': {
    name: 'Recessed Light',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.35
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Filled
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.globalAlpha = 0.2
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    },
  },

  'light-pendant': {
    name: 'Pendant Light',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.3
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      // Circle
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Hanging line
      ctx.beginPath()
      ctx.moveTo(x, y - r)
      ctx.lineTo(x, y - r - size * 0.15)
      ctx.stroke()
      // Small dot
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.beginPath()
      ctx.arc(x, y, r * 0.25, 0, Math.PI * 2)
      ctx.fill()
    },
  },

  'fan-ceiling': {
    name: 'Ceiling Fan',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.4
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Fan blades (4)
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(angle) * r * 0.85, y + Math.sin(angle) * r * 0.85)
        ctx.stroke()
      }
    },
  },

  'panel-electric': {
    name: 'Electrical Panel',
    category: 'electrical',
    draw: (ctx, x, y, size, opts = {}) => {
      const w = size * 0.6
      const h = size * 0.8
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
      // Lightning bolt
      ctx.beginPath()
      ctx.moveTo(x + w * 0.1, y - h * 0.3)
      ctx.lineTo(x - w * 0.1, y)
      ctx.lineTo(x + w * 0.05, y)
      ctx.lineTo(x - w * 0.1, y + h * 0.3)
      ctx.stroke()
    },
  },

  // ── PLUMBING ───────────────────────────────────────────────────────────────
  'sink': {
    name: 'Sink',
    category: 'plumbing',
    draw: (ctx, x, y, size, opts = {}) => {
      const w = size * 0.7
      const h = size * 0.5
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      // Oval basin
      ctx.beginPath()
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.stroke()
      // Drain
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.beginPath()
      ctx.arc(x, y, size * 0.06, 0, Math.PI * 2)
      ctx.fill()
      // Faucet handles
      ctx.beginPath()
      ctx.arc(x - size * 0.15, y - h / 2 - size * 0.05, size * 0.04, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + size * 0.15, y - h / 2 - size * 0.05, size * 0.04, 0, Math.PI * 2)
      ctx.fill()
    },
  },

  'toilet': {
    name: 'Toilet',
    category: 'plumbing',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      // Tank (rectangle at back)
      const tw = size * 0.5
      const th = size * 0.2
      ctx.strokeRect(x - tw / 2, y - size * 0.4, tw, th)
      // Bowl (oval)
      ctx.beginPath()
      ctx.ellipse(x, y + size * 0.05, size * 0.3, size * 0.35, 0, 0, Math.PI * 2)
      ctx.stroke()
    },
  },

  'shower': {
    name: 'Shower',
    category: 'plumbing',
    draw: (ctx, x, y, size, opts = {}) => {
      const s = size * 0.8
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.strokeRect(x - s / 2, y - s / 2, s, s)
      // Diagonal line (standard shower symbol)
      ctx.beginPath()
      ctx.moveTo(x - s / 2, y - s / 2)
      ctx.lineTo(x + s / 2, y + s / 2)
      ctx.stroke()
      // Drain
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.beginPath()
      ctx.arc(x, y, size * 0.06, 0, Math.PI * 2)
      ctx.fill()
    },
  },

  'bathtub': {
    name: 'Bathtub',
    category: 'plumbing',
    draw: (ctx, x, y, size, opts = {}) => {
      const w = size * 0.9
      const h = size * 0.45
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      // Outer tub
      ctx.beginPath()
      ctx.roundRect(x - w / 2, y - h / 2, w, h, size * 0.1)
      ctx.stroke()
      // Inner oval
      ctx.beginPath()
      ctx.ellipse(x, y, w * 0.4, h * 0.35, 0, 0, Math.PI * 2)
      ctx.stroke()
      // Drain
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.beginPath()
      ctx.arc(x + w * 0.3, y, size * 0.04, 0, Math.PI * 2)
      ctx.fill()
    },
  },

  'water-heater': {
    name: 'Water Heater',
    category: 'plumbing',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.4
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `bold ${size * 0.25}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('WH', x, y)
    },
  },

  'hose-bib': {
    name: 'Hose Bib',
    category: 'plumbing',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      // Triangle
      ctx.beginPath()
      ctx.moveTo(x, y - size * 0.35)
      ctx.lineTo(x + size * 0.3, y + size * 0.2)
      ctx.lineTo(x - size * 0.3, y + size * 0.2)
      ctx.closePath()
      ctx.stroke()
      ctx.font = `${size * 0.2}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.fillText('HB', x, y + size * 0.4)
    },
  },

  // ── HVAC ───────────────────────────────────────────────────────────────────
  'vent-supply': {
    name: 'Supply Vent',
    category: 'hvac',
    draw: (ctx, x, y, size, opts = {}) => {
      const w = size * 0.7
      const h = size * 0.3
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
      // Horizontal lines (louvers)
      const lines = 3
      for (let i = 1; i < lines; i++) {
        const ly = y - h / 2 + (h / lines) * i
        ctx.beginPath()
        ctx.moveTo(x - w / 2, ly)
        ctx.lineTo(x + w / 2, ly)
        ctx.stroke()
      }
    },
  },

  'vent-return': {
    name: 'Return Vent',
    category: 'hvac',
    draw: (ctx, x, y, size, opts = {}) => {
      const w = size * 0.7
      const h = size * 0.3
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
      // Cross-hatch pattern
      ctx.lineWidth = 0.8
      for (let d = -h; d < w + h; d += 5) {
        ctx.beginPath()
        ctx.moveTo(x - w / 2 + d, y - h / 2)
        ctx.lineTo(x - w / 2 + d + h, y + h / 2)
        ctx.stroke()
      }
    },
  },

  'thermostat': {
    name: 'Thermostat',
    category: 'hvac',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.35
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `bold ${size * 0.3}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('T', x, y)
    },
  },

  // ── FIRE SAFETY ────────────────────────────────────────────────────────────
  'smoke-detector': {
    name: 'Smoke Detector',
    category: 'fire',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.35
      ctx.strokeStyle = opts.color || '#ef4444'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `bold ${size * 0.25}px sans-serif`
      ctx.fillStyle = opts.color || '#ef4444'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('SD', x, y)
    },
  },

  'fire-extinguisher': {
    name: 'Fire Extinguisher',
    category: 'fire',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.35
      ctx.strokeStyle = opts.color || '#ef4444'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `bold ${size * 0.25}px sans-serif`
      ctx.fillStyle = opts.color || '#ef4444'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('FE', x, y)
    },
  },

  'sprinkler': {
    name: 'Sprinkler Head',
    category: 'fire',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.strokeStyle = opts.color || '#ef4444'
      ctx.lineWidth = opts.lineWidth || 1.5
      // Pentagon shape
      const r = size * 0.35
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const px = x + r * Math.cos(angle)
        const py = y + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    },
  },

  'exit-sign': {
    name: 'Exit Sign',
    category: 'fire',
    draw: (ctx, x, y, size, opts = {}) => {
      const w = size * 0.7
      const h = size * 0.35
      ctx.strokeStyle = opts.color || '#22c55e'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
      ctx.font = `bold ${size * 0.25}px sans-serif`
      ctx.fillStyle = opts.color || '#22c55e'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('EXIT', x, y)
    },
  },

  // ── ACCESSIBILITY ──────────────────────────────────────────────────────────
  'wheelchair': {
    name: 'Wheelchair Access',
    category: 'accessibility',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.4
      ctx.strokeStyle = opts.color || '#3b82f6'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Simplified wheelchair icon
      ctx.beginPath()
      // Head
      ctx.arc(x, y - r * 0.5, r * 0.15, 0, Math.PI * 2)
      ctx.stroke()
      // Body
      ctx.beginPath()
      ctx.moveTo(x, y - r * 0.35)
      ctx.lineTo(x, y + r * 0.1)
      ctx.lineTo(x + r * 0.3, y + r * 0.1)
      ctx.stroke()
      // Wheel
      ctx.beginPath()
      ctx.arc(x, y + r * 0.35, r * 0.25, 0, Math.PI * 2)
      ctx.stroke()
    },
  },

  // ── GENERAL ────────────────────────────────────────────────────────────────
  'north-arrow': {
    name: 'North Arrow',
    category: 'general',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      // Arrow pointing up
      const arrowH = size * 0.8
      const arrowW = size * 0.3
      ctx.beginPath()
      ctx.moveTo(x, y - arrowH / 2)
      ctx.lineTo(x + arrowW / 2, y + arrowH / 4)
      ctx.lineTo(x, y + arrowH / 8)
      ctx.lineTo(x - arrowW / 2, y + arrowH / 4)
      ctx.closePath()
      ctx.fill()
      // "N" label
      ctx.font = `bold ${size * 0.25}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('N', x, y + arrowH / 3)
    },
  },

  'section-mark': {
    name: 'Section Mark',
    category: 'general',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.35
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Horizontal line through center
      ctx.beginPath()
      ctx.moveTo(x - r, y)
      ctx.lineTo(x + r, y)
      ctx.stroke()
      // Top half: section number
      ctx.font = `bold ${size * 0.22}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(opts.label || 'A', x, y - r * 0.45)
      // Bottom half: sheet number
      ctx.fillText(opts.sheet || '1', x, y + r * 0.45)
    },
  },

  'detail-mark': {
    name: 'Detail Callout',
    category: 'general',
    draw: (ctx, x, y, size, opts = {}) => {
      const r = size * 0.35
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 2
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `bold ${size * 0.35}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(opts.label || '1', x, y)
    },
  },

  'revision-cloud': {
    name: 'Revision Cloud',
    category: 'general',
    draw: (ctx, x, y, size, opts = {}) => {
      ctx.strokeStyle = opts.color || '#ef4444'
      ctx.lineWidth = opts.lineWidth || 1.5
      const w = size * 0.8
      const h = size * 0.5
      // Cloud made of small arcs
      ctx.beginPath()
      const bumps = 6
      for (let i = 0; i < bumps; i++) {
        const angle = (i / bumps) * Math.PI * 2
        const nextAngle = ((i + 1) / bumps) * Math.PI * 2
        const cx1 = x + (w / 2) * Math.cos(angle)
        const cy1 = y + (h / 2) * Math.sin(angle)
        const cx2 = x + (w / 2) * Math.cos(nextAngle)
        const cy2 = y + (h / 2) * Math.sin(nextAngle)
        const midX = (cx1 + cx2) / 2 + Math.cos((angle + nextAngle) / 2) * size * 0.15
        const midY = (cy1 + cy2) / 2 + Math.sin((angle + nextAngle) / 2) * size * 0.15
        if (i === 0) ctx.moveTo(cx1, cy1)
        ctx.quadraticCurveTo(midX, midY, cx2, cy2)
      }
      ctx.stroke()
    },
  },

  'column': {
    name: 'Structural Column',
    category: 'general',
    draw: (ctx, x, y, size, opts = {}) => {
      const s = size * 0.5
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.fillStyle = '#e2e8f0'
      ctx.lineWidth = opts.lineWidth || 2
      ctx.fillRect(x - s / 2, y - s / 2, s, s)
      ctx.strokeRect(x - s / 2, y - s / 2, s, s)
      // X inside
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x - s / 2, y - s / 2)
      ctx.lineTo(x + s / 2, y + s / 2)
      ctx.moveTo(x + s / 2, y - s / 2)
      ctx.lineTo(x - s / 2, y + s / 2)
      ctx.stroke()
    },
  },

  'stairs-up': {
    name: 'Stairs (Up)',
    category: 'general',
    draw: (ctx, x, y, size, opts = {}) => {
      const w = size * 0.7
      const h = size * 0.9
      ctx.strokeStyle = opts.color || '#1e293b'
      ctx.lineWidth = opts.lineWidth || 1
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
      // Treads
      const treads = 5
      for (let i = 1; i <= treads; i++) {
        const ty = y - h / 2 + (h / (treads + 1)) * i
        ctx.beginPath()
        ctx.moveTo(x - w / 2, ty)
        ctx.lineTo(x + w / 2, ty)
        ctx.stroke()
      }
      // Arrow
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x, y + h / 2 - 4)
      ctx.lineTo(x, y - h / 2 + 4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x - 4, y - h / 2 + 10)
      ctx.lineTo(x, y - h / 2 + 4)
      ctx.lineTo(x + 4, y - h / 2 + 10)
      ctx.stroke()
      ctx.font = `${size * 0.15}px sans-serif`
      ctx.fillStyle = opts.color || '#1e293b'
      ctx.textAlign = 'center'
      ctx.fillText('UP', x, y + h / 2 - 8)
    },
  },
}

/**
 * Draw a symbol at the given position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} symbolKey - Key from SYMBOLS
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {object} opts - { scale, rotation, color, lineWidth, label, sheet }
 */
export function drawSymbol(ctx, symbolKey, x, y, opts = {}) {
  const symbol = SYMBOLS[symbolKey]
  if (!symbol) return

  const scale = opts.scale || 1
  const size = 20 * scale

  ctx.save()
  ctx.translate(x, y)
  if (opts.rotation) ctx.rotate((opts.rotation * Math.PI) / 180)
  symbol.draw(ctx, 0, 0, size, opts)
  ctx.restore()
}

/**
 * Get all symbols grouped by category.
 * @returns {Object<string, Array<{ key, name }>>}
 */
export function getSymbolsByCategory() {
  const groups = {}
  for (const [key, sym] of Object.entries(SYMBOLS)) {
    const cat = sym.category || 'general'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push({ key, name: sym.name })
  }
  return groups
}

/**
 * Get total symbol count.
 */
export function getSymbolCount() {
  return Object.keys(SYMBOLS).length
}
