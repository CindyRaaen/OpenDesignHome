// ═══════════════════════════════════════════════════════════
// OPENDESIGN STUDIO — Tier 2 Scoring Bridge
// Connects heuristic Tier 1 scores to model-backed Tier 2.
// SpatialLM endpoint → architectural awareness scoring
// ATISS/DiffuScene → layout probability (stubbed, ready for Modal)
// ═══════════════════════════════════════════════════════════

const TIER2_API = import.meta.env.VITE_TIER2_API || '/api/scoring/tier2'

// ── Blend config ──
const BLEND_ALPHA_START = 1.0   // 100% heuristic initially
const BLEND_ALPHA_FINAL = 0.4   // 40% heuristic when Tier 2 arrives
const BLEND_DECAY_MS = 800      // smooth transition duration

/**
 * Convert OpenDesign Studio room layout to SpatialLM-compatible format.
 * Maps placed items + room dimensions into a simplified scene descriptor.
 */
function layoutToSceneDescriptor(placedItems, roomWidth = 240, roomDepth = 192, palette = []) {
  return {
    room: {
      width_inches: roomWidth,
      depth_inches: roomDepth,
      height_inches: 96, // 8ft ceiling default
    },
    furniture: placedItems.map(item => ({
      type: item.type || 'Unknown',
      name: item.name || item.label || 'Item',
      style: item.style || 'any',
      x: item.x,
      y: item.y,
      w: item.w,
      d: item.d || 20,
      h: item.h || 30,
      colors: item.colors || [],
    })),
    palette,
    item_count: placedItems.length,
  }
}

/**
 * Request Tier 2 model-backed scores from the server.
 * Falls back gracefully if server is unavailable.
 */
async function fetchTier2Scores(placedItems, roomWidth, roomDepth, palette, materials) {
  const scene = layoutToSceneDescriptor(placedItems, roomWidth, roomDepth, palette)

  try {
    const res = await fetch(TIER2_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, materials }),
      signal: AbortSignal.timeout(5000), // 5s max wait
    })

    if (!res.ok) throw new Error(`Tier 2 API: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('[Tier2] Scoring unavailable, using heuristics only:', err.message)
    return null
  }
}

/**
 * SpatialLM architectural awareness scoring.
 * Evaluates whether furniture respects doors, windows, and traffic flow.
 * Returns 0–100 score for architectural harmony.
 */
function scoreSpatialAwareness(spatialResult, placedItems) {
  if (!spatialResult || !spatialResult.layout) return null

  let score = 70 // baseline
  const layout = spatialResult.layout

  // Parse SpatialLM output for doors/windows
  const doors = (layout.doors || [])
  const windows = (layout.windows || [])

  // Check furniture blocking doorways
  const SVG_SCALE = 2.25
  const ROOM_X = 60, ROOM_Y = 60

  for (const item of placedItems) {
    const itemRect = {
      left: (item.x - ROOM_X) / SVG_SCALE,
      top: (item.y - ROOM_Y) / SVG_SCALE,
      right: (item.x - ROOM_X + item.w * SVG_SCALE) / SVG_SCALE,
      bottom: (item.y - ROOM_Y + (item.d || 20) * SVG_SCALE) / SVG_SCALE,
    }

    // Penalize furniture blocking doors (36" clearance zone)
    for (const door of doors) {
      const doorZone = { left: door.x - 36, top: door.y - 36, right: door.x + 36, bottom: door.y + 36 }
      if (rectsOverlap(itemRect, doorZone)) {
        score -= 15
      }
    }

    // Bonus for furniture near windows (desirable for seating/plants)
    for (const win of windows) {
      const dist = Math.sqrt((itemRect.left - win.x) ** 2 + (itemRect.top - win.y) ** 2)
      if (dist < 60 && ['Seating', 'Plant'].includes(item.type)) {
        score += 5
      }
    }
  }

  return Math.round(Math.min(100, Math.max(0, score)))
}

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

/**
 * ATISS layout probability scoring (stub — ready for Modal endpoint).
 * Evaluates how likely this layout is under the 3D-FRONT distribution.
 */
function scoreLayoutProbability(atissResult) {
  if (!atissResult) return null
  // ATISS returns log-likelihood; convert to 0–100
  const logLik = atissResult.log_likelihood || -5
  // Map [-10, 0] → [0, 100]
  return Math.round(Math.min(100, Math.max(0, (logLik + 10) * 10)))
}

/**
 * DiffuScene global coherence scoring (stub — ready for Modal endpoint).
 */
function scoreGlobalCoherence(diffuResult) {
  if (!diffuResult) return null
  return Math.round(Math.min(100, Math.max(0, (diffuResult.coherence_score || 0.5) * 100)))
}

/**
 * InstructScene brief compliance scoring (stub — ready for Modal endpoint).
 */
function scoreBriefCompliance(instructResult) {
  if (!instructResult) return null
  return Math.round(Math.min(100, Math.max(0, (instructResult.compliance_score || 0.5) * 100)))
}

/**
 * Blend Tier 1 and Tier 2 scores.
 * alpha = 1.0 means 100% Tier 1, alpha = 0.4 means 60% Tier 2.
 */
export function blendScores(tier1, tier2, alpha = BLEND_ALPHA_FINAL) {
  if (!tier2) return tier1
  return {
    color: Math.round(tier1.color * alpha + (tier2.color ?? tier1.color) * (1 - alpha)),
    space: Math.round(tier1.space * alpha + (tier2.space ?? tier1.space) * (1 - alpha)),
    vibe: Math.round(tier1.vibe * alpha + (tier2.vibe ?? tier1.vibe) * (1 - alpha)),
  }
}

/**
 * Full Tier 2 scoring pipeline.
 * Called async after Tier 1 provides instant scores.
 * Returns augmented scores or null if unavailable.
 */
export async function getTier2Scores(placedItems, roomWidth, roomDepth, palette, materials) {
  const result = await fetchTier2Scores(placedItems, roomWidth, roomDepth, palette, materials)
  if (!result) return null

  const spatial = scoreSpatialAwareness(result.spatialLM, placedItems)
  const probability = scoreLayoutProbability(result.atiss)
  const coherence = scoreGlobalCoherence(result.diffuScene)
  const compliance = scoreBriefCompliance(result.instructScene)

  // Compose Tier 2 scores from model outputs
  // Space axis gets spatial awareness + layout probability
  // Vibe axis gets global coherence + brief compliance
  // Color axis stays heuristic (models don't evaluate palette yet)
  return {
    color: null, // no Tier 2 color model yet
    space: spatial != null && probability != null
      ? Math.round(spatial * 0.5 + probability * 0.5)
      : spatial ?? probability ?? null,
    vibe: coherence != null && compliance != null
      ? Math.round(coherence * 0.6 + compliance * 0.4)
      : coherence ?? compliance ?? null,
    models: {
      spatialLM: spatial,
      atiss: probability,
      diffuScene: coherence,
      instructScene: compliance,
    }
  }
}

/**
 * React hook-compatible Tier 2 manager.
 * Provides smooth blending animation from Tier 1 → blended scores.
 */
export class Tier2Manager {
  constructor() {
    this.pendingRequest = null
    this.lastTier2 = null
    this.alpha = BLEND_ALPHA_START
    this.listeners = new Set()
  }

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  notify() { this.listeners.forEach(fn => fn(this.lastTier2, this.alpha)) }

  async requestScoring(placedItems, roomWidth, roomDepth, palette, materials) {
    // Debounce: cancel previous pending request
    if (this.pendingRequest) this.pendingRequest.cancelled = true
    const req = { cancelled: false }
    this.pendingRequest = req

    // Small delay to batch rapid item movements
    await new Promise(r => setTimeout(r, 500))
    if (req.cancelled) return

    const tier2 = await getTier2Scores(placedItems, roomWidth, roomDepth, palette, materials)
    if (req.cancelled) return

    this.lastTier2 = tier2
    // Smooth alpha decay
    this.alpha = BLEND_ALPHA_START
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      this.alpha = BLEND_ALPHA_START - (BLEND_ALPHA_START - BLEND_ALPHA_FINAL) * Math.min(1, elapsed / BLEND_DECAY_MS)
      this.notify()
      if (elapsed < BLEND_DECAY_MS) requestAnimationFrame(animate)
    }
    animate()
  }

  getBlended(tier1Scores) {
    return blendScores(tier1Scores, this.lastTier2, this.alpha)
  }
}

export const tier2Manager = new Tier2Manager()

export default { getTier2Scores, blendScores, Tier2Manager, tier2Manager }
