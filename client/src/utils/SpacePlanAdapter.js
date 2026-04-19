/**
 * SpacePlanAdapter — converts a SpacePlan data model (from @openscaffold/space-planner)
 * into the props format consumed by RoomViewer3D.
 *
 * SpacePlan uses:
 *   - Dimensions in inches
 *   - surfaces: { [id]: { type, geometry: { x1, y1, x2, y2 }, ... } }
 *   - items: { [id]: { type, category, dimensions: { width, height, depth }, position: { x, y }, rotation } }
 *   - roomHeight: inches
 *
 * RoomViewer3D expects:
 *   - walls: [{ x1, y1, x2, y2, wallType, thickness }] — in pixels (20px = 1 grid unit)
 *   - doors: [{ x, y, width, side }] — in pixels
 *   - windows: [{ x, y, width }] — in pixels
 *   - furniture: [{ x, y, w, h, type, rotation, color }] — x/y in pixels, w/h in grid units
 *   - dimensions: { width, height } — canvas size in pixels
 *
 * Conversion: inches → pixels:  pixels = inches * (20/12) = inches * (GRID_SIZE / 12)
 */

const GRID_SIZE = 20
const INCHES_TO_PX = GRID_SIZE / 12 // 1 foot = 20px, 1 inch = 20/12 px

/**
 * Convert a SpacePlan object into RoomViewer3D props.
 *
 * @param {object} plan - SpacePlan data (surfaces, items, roomWidth, roomDepth, roomHeight)
 * @returns {{ walls, doors, windows, furniture, dimensions }} Props for RoomViewer3D
 */
export function spacePlanToRenderer(plan) {
  if (!plan) return { walls: [], doors: [], windows: [], furniture: [], dimensions: { width: 800, height: 600 } }

  const surfaces = Object.values(plan.surfaces || {})
  const items = Object.values(plan.items || {})

  // ── Canvas dimensions from room size ──
  const roomWidthPx = (plan.roomWidth || 180) * INCHES_TO_PX  // default 15ft
  const roomDepthPx = (plan.roomDepth || 144) * INCHES_TO_PX   // default 12ft
  // Add padding around the room
  const padding = 80
  const dimensions = {
    width: Math.round(roomWidthPx + padding),
    height: Math.round(roomDepthPx + padding),
  }
  const offsetX = padding / 2
  const offsetY = padding / 2

  // ── Walls ──
  const walls = []
  const doors = []
  const windows = []

  surfaces.forEach(surface => {
    const geo = surface.geometry || {}
    const x1 = (geo.x1 || 0) * INCHES_TO_PX + offsetX
    const y1 = (geo.y1 || 0) * INCHES_TO_PX + offsetY
    const x2 = (geo.x2 || 0) * INCHES_TO_PX + offsetX
    const y2 = (geo.y2 || 0) * INCHES_TO_PX + offsetY

    if (surface.type === 'wall' || !surface.type) {
      walls.push({
        x1, y1, x2, y2,
        wallType: surface.wallType || 'exterior',
        thickness: surface.thickness || 8,
      })

      // Check for openings (doors/windows) embedded in the surface
      const openings = surface.openings || []
      openings.forEach(opening => {
        // Opening position is a fraction along the wall (0-1) or absolute inches
        const dx = x2 - x1
        const dy = y2 - y1
        const wallLen = Math.sqrt(dx * dx + dy * dy)
        const frac = opening.position || 0.5
        const ox = x1 + dx * frac
        const oy = y1 + dy * frac
        const openingWidthPx = (opening.width || 36) * INCHES_TO_PX

        if (opening.type === 'door') {
          doors.push({
            x: ox - openingWidthPx / 2,
            y: oy,
            width: openingWidthPx,
            side: opening.side || 'left',
          })
        } else if (opening.type === 'window') {
          windows.push({
            x: ox - openingWidthPx / 2,
            y: oy,
            width: openingWidthPx,
          })
        }
      })
    } else if (surface.type === 'door') {
      doors.push({
        x: x1,
        y: y1,
        width: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
        side: surface.side || 'left',
      })
    } else if (surface.type === 'window') {
      windows.push({
        x: x1,
        y: y1,
        width: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
      })
    }
  })

  // ── Furniture ──
  const furniture = items.map(item => {
    const dims = item.dimensions || {}
    const pos = item.position || {}

    // Convert from inches to grid units (w/h) and pixels (x/y)
    const widthInches = dims.width || 24
    const depthInches = dims.depth || 24

    return {
      x: (pos.x || 0) * INCHES_TO_PX + offsetX - (widthInches * INCHES_TO_PX) / 2,
      y: (pos.y || 0) * INCHES_TO_PX + offsetY - (depthInches * INCHES_TO_PX) / 2,
      w: widthInches / 12,  // grid units (1 unit = 1 foot)
      h: depthInches / 12,
      type: normalizeType(item.type || item.archetype || 'generic'),
      rotation: item.rotation || 0,
      color: item.color || null,
      // Preserve original data for tear sheets
      _spacePlanItem: item,
    }
  })

  return { walls, doors, windows, furniture, dimensions }
}

/**
 * Convert archetype names from SpatialLM/SpacePlan to RoomViewer3D furniture types.
 */
function normalizeType(type) {
  // SpatialLM outputs generic labels; map to RoomViewer3D builder types
  const typeMap = {
    'sofa': 'sofa',
    'couch': 'sofa',
    'chair': 'armchair',
    'arm_chair': 'armchair',
    'accent_chair': 'accent-chair',
    'office_chair': 'office-chair',
    'dining_table': 'dining-table',
    'table': 'dining-table',
    'desk': 'desk',
    'coffee_table': 'coffee-table',
    'side_table': 'side-table',
    'console_table': 'console-table',
    'bed': 'bed-queen',
    'king_bed': 'bed-king',
    'queen_bed': 'bed-queen',
    'twin_bed': 'bed-twin',
    'bookshelf': 'bookshelf',
    'shelf': 'bookshelf',
    'wardrobe': 'wardrobe',
    'dresser': 'bookshelf',
    'cabinet': 'bookshelf',
    'tv': 'tv-console',
    'tv_stand': 'tv-console',
    'television': 'tv-console',
    'plant': 'plant',
    'rug': 'rug',
    'bathtub': 'bathtub',
    'shower': 'shower',
    'fireplace': 'fireplace',
    'lamp': 'floor-lamp',
    'floor_lamp': 'floor-lamp',
    'table_lamp': 'table-lamp',
    'ottoman': 'ottoman',
    'bench': 'bench',
    'stool': 'bar-stool',
    'bar_stool': 'bar-stool',
    'toilet': 'generic',
    'sink': 'generic',
    'refrigerator': 'generic',
    'oven': 'generic',
    'dishwasher': 'generic',
    'washer': 'generic',
    'dryer': 'generic',
  }

  const normalized = type.toLowerCase().replace(/[-\s]+/g, '_')
  return typeMap[normalized] || type.replace(/[_\s]+/g, '-').toLowerCase()
}

/**
 * Merge floor-plan-editor data with SpacePlan overlay.
 * When both exist, SpacePlan items are added alongside existing furniture.
 */
export function mergeSpacePlanIntoFloorPlan(existingProps, plan) {
  if (!plan) return existingProps

  const spaceProps = spacePlanToRenderer(plan)

  return {
    walls: existingProps.walls.length > 0 ? existingProps.walls : spaceProps.walls,
    doors: [...existingProps.doors, ...spaceProps.doors],
    windows: [...existingProps.windows, ...spaceProps.windows],
    furniture: [...existingProps.furniture, ...spaceProps.furniture],
    dimensions: existingProps.dimensions.width > 100 ? existingProps.dimensions : spaceProps.dimensions,
  }
}
