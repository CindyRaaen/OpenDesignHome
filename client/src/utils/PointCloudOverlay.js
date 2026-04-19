/**
 * PointCloudOverlay — loads and renders a PLY point cloud in a Three.js scene
 * using a particle system (Points). Integrates with the @openscaffold/integrations
 * pointcloud adapter for config and validation.
 *
 * Usage in RoomViewer3D:
 *   import { loadPointCloud, removePointCloud } from '../utils/PointCloudOverlay'
 *
 *   // In buildScene:
 *   if (pointCloudData) {
 *     loadPointCloud(THREE, scene, pointCloudData, { opacity, pointSize })
 *   }
 */

// ── PLY Parser (pure JS, handles both ASCII and binary_little_endian) ──

function parsePlyBuffer(buffer) {
  const headerEnd = findHeaderEnd(buffer)
  if (headerEnd < 0) throw new Error('Invalid PLY: no end_header found')

  const headerText = new TextDecoder().decode(buffer.slice(0, headerEnd))
  const lines = headerText.split('\n').map(l => l.trim())

  let format = 'ascii'
  let vertexCount = 0
  const properties = []
  let inVertex = false

  for (const line of lines) {
    if (line.startsWith('format ')) format = line.split(' ')[1]
    if (line.startsWith('element vertex ')) {
      vertexCount = parseInt(line.split(' ')[2], 10)
      inVertex = true
    }
    if (line.startsWith('element ') && !line.startsWith('element vertex')) inVertex = false
    if (inVertex && line.startsWith('property ')) {
      const parts = line.split(' ')
      properties.push({ type: parts[1], name: parts[2] })
    }
  }

  // Data starts after "end_header\n"
  const dataOffset = headerEnd

  // Property indices
  const xIdx = properties.findIndex(p => p.name === 'x')
  const yIdx = properties.findIndex(p => p.name === 'y')
  const zIdx = properties.findIndex(p => p.name === 'z')
  const rIdx = properties.findIndex(p => p.name === 'red' || p.name === 'r')
  const gIdx = properties.findIndex(p => p.name === 'green' || p.name === 'g')
  const bIdx = properties.findIndex(p => p.name === 'blue' || p.name === 'b')
  const hasColor = rIdx >= 0 && gIdx >= 0 && bIdx >= 0

  if (xIdx < 0 || yIdx < 0 || zIdx < 0) {
    throw new Error('PLY file missing x/y/z vertex properties')
  }

  const positions = new Float32Array(vertexCount * 3)
  const colors = hasColor ? new Float32Array(vertexCount * 3) : null

  if (format === 'ascii') {
    const dataText = new TextDecoder().decode(buffer.slice(dataOffset))
    const dataLines = dataText.trim().split('\n')

    for (let i = 0; i < vertexCount && i < dataLines.length; i++) {
      const vals = dataLines[i].trim().split(/\s+/)
      positions[i * 3] = parseFloat(vals[xIdx])
      positions[i * 3 + 1] = parseFloat(vals[yIdx])
      positions[i * 3 + 2] = parseFloat(vals[zIdx])
      if (hasColor) {
        colors[i * 3] = parseFloat(vals[rIdx]) / 255
        colors[i * 3 + 1] = parseFloat(vals[gIdx]) / 255
        colors[i * 3 + 2] = parseFloat(vals[bIdx]) / 255
      }
    }
  } else if (format === 'binary_little_endian') {
    // Calculate byte stride from property types
    const typeSize = { char: 1, uchar: 1, short: 2, ushort: 2, int: 4, uint: 4, float: 4, double: 8 }
    let stride = 0
    const offsets = []
    for (const prop of properties) {
      offsets.push(stride)
      stride += typeSize[prop.type] || 4
    }

    const view = new DataView(buffer.buffer || buffer, dataOffset)
    for (let i = 0; i < vertexCount; i++) {
      const base = i * stride
      positions[i * 3] = readProp(view, base + offsets[xIdx], properties[xIdx].type)
      positions[i * 3 + 1] = readProp(view, base + offsets[yIdx], properties[yIdx].type)
      positions[i * 3 + 2] = readProp(view, base + offsets[zIdx], properties[zIdx].type)
      if (hasColor) {
        colors[i * 3] = readProp(view, base + offsets[rIdx], properties[rIdx].type) / 255
        colors[i * 3 + 1] = readProp(view, base + offsets[gIdx], properties[gIdx].type) / 255
        colors[i * 3 + 2] = readProp(view, base + offsets[bIdx], properties[bIdx].type) / 255
      }
    }
  } else {
    throw new Error(`Unsupported PLY format: ${format}`)
  }

  return { positions, colors, vertexCount, hasColor }
}

function findHeaderEnd(buffer) {
  const marker = new TextEncoder().encode('end_header\n')
  const view = new Uint8Array(buffer)
  const maxSearch = Math.min(view.length, 65536)
  outer:
  for (let i = 0; i < maxSearch - marker.length; i++) {
    for (let j = 0; j < marker.length; j++) {
      if (view[i + j] !== marker[j]) continue outer
    }
    return i + marker.length
  }
  return -1
}

function readProp(view, offset, type) {
  switch (type) {
    case 'float': return view.getFloat32(offset, true)
    case 'double': return view.getFloat64(offset, true)
    case 'int': return view.getInt32(offset, true)
    case 'uint': return view.getUint32(offset, true)
    case 'short': return view.getInt16(offset, true)
    case 'ushort': return view.getUint16(offset, true)
    case 'char': return view.getInt8(offset)
    case 'uchar': return view.getUint8(offset)
    default: return view.getFloat32(offset, true)
  }
}

// ── Point Cloud Scene Integration ──

const POINT_CLOUD_GROUP_NAME = '__pointCloudOverlay__'

/**
 * Load a PLY point cloud into a Three.js scene as a particle system.
 *
 * @param {object} THREE - Three.js namespace
 * @param {THREE.Scene} scene - Target scene
 * @param {object} pointCloudData - { buffer: ArrayBuffer, src?: string, transform?: { scale, offset, rotation } }
 * @param {object} opts - { pointSize, opacity, color, maxPoints }
 * @returns {THREE.Group} the point cloud group added to the scene
 */
export function loadPointCloud(THREE, scene, pointCloudData, opts = {}) {
  // Remove any existing point cloud overlay
  removePointCloud(THREE, scene)

  const {
    pointSize = 2.0,
    opacity = 0.85,
    color = null, // null = use PLY colors, or a hex int for uniform color
    maxPoints = 2_000_000,
  } = opts

  const group = new THREE.Group()
  group.name = POINT_CLOUD_GROUP_NAME

  try {
    const buffer = pointCloudData.buffer
    if (!buffer) {
      console.warn('PointCloudOverlay: no buffer provided')
      return group
    }

    const parsed = parsePlyBuffer(
      buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
    )

    // Downsample if too many points
    let { positions, colors, vertexCount, hasColor } = parsed
    let step = 1
    if (vertexCount > maxPoints) {
      step = Math.ceil(vertexCount / maxPoints)
      const newCount = Math.ceil(vertexCount / step)
      const newPos = new Float32Array(newCount * 3)
      const newCol = hasColor ? new Float32Array(newCount * 3) : null
      for (let i = 0, j = 0; i < vertexCount && j < newCount; i += step, j++) {
        newPos[j * 3] = positions[i * 3]
        newPos[j * 3 + 1] = positions[i * 3 + 1]
        newPos[j * 3 + 2] = positions[i * 3 + 2]
        if (hasColor && newCol) {
          newCol[j * 3] = colors[i * 3]
          newCol[j * 3 + 1] = colors[i * 3 + 1]
          newCol[j * 3 + 2] = colors[i * 3 + 2]
        }
      }
      positions = newPos
      colors = newCol
      vertexCount = newCount
    }

    // Build geometry
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    if (hasColor && colors && !color) {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }

    // Material
    const material = new THREE.PointsMaterial({
      size: pointSize * 0.01, // Scale point size to world units
      sizeAttenuation: true,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 0.9,
      vertexColors: hasColor && !color,
    })

    if (color != null) {
      material.color = new THREE.Color(color)
    }

    const points = new THREE.Points(geometry, material)

    // Apply transform — point clouds are often in different coordinate spaces
    const transform = pointCloudData.transform || {}

    // Default: convert from Z-up (common in scan data) to Y-up (Three.js)
    if (transform.zUp !== false) {
      points.rotation.x = -Math.PI / 2
    }

    // Scale to match room units (point clouds are often in meters, room is in feet-ish)
    const scale = transform.scale || 1.0
    points.scale.set(scale, scale, scale)

    // Offset to align with room
    if (transform.offset) {
      points.position.set(
        transform.offset.x || 0,
        transform.offset.y || 0,
        transform.offset.z || 0
      )
    }

    group.add(points)

    // Store metadata for UI access
    group.userData = {
      type: 'pointCloud',
      vertexCount,
      originalVertexCount: parsed.vertexCount,
      hasColor: parsed.hasColor,
      downsampled: step > 1,
      downsampleRatio: step,
    }

    scene.add(group)
    return group

  } catch (err) {
    console.error('PointCloudOverlay: failed to load point cloud', err)
    group.userData = { type: 'pointCloud', error: err.message }
    scene.add(group)
    return group
  }
}

/**
 * Remove existing point cloud overlay from the scene.
 */
export function removePointCloud(THREE, scene) {
  const existing = scene.getObjectByName(POINT_CLOUD_GROUP_NAME)
  if (existing) {
    existing.traverse(child => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    scene.remove(existing)
  }
}

/**
 * Update point cloud overlay visibility and settings without full reload.
 */
export function updatePointCloudSettings(THREE, scene, settings = {}) {
  const group = scene.getObjectByName(POINT_CLOUD_GROUP_NAME)
  if (!group) return

  group.traverse(child => {
    if (child.isPoints && child.material) {
      if (settings.pointSize != null) child.material.size = settings.pointSize * 0.01
      if (settings.opacity != null) {
        child.material.opacity = settings.opacity
        child.material.transparent = settings.opacity < 1
        child.material.depthWrite = settings.opacity >= 0.9
      }
      if (settings.visible != null) child.visible = settings.visible
    }
  })
}

/**
 * Get the bounding box of the point cloud in world space.
 * Useful for auto-fitting the camera to include both room and scan data.
 */
export function getPointCloudBounds(THREE, scene) {
  const group = scene.getObjectByName(POINT_CLOUD_GROUP_NAME)
  if (!group) return null

  const box = new THREE.Box3().setFromObject(group)
  return box.isEmpty() ? null : box
}
