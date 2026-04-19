/**
 * TextureManager.js - PBR Texture System with Procedural Generation
 *
 * Generates physically-based textures procedurally (wood, brick, marble, etc.)
 * and creates PBR materials with color, normal, roughness, and AO maps.
 * All textures are procedurally generated using Canvas 2D — no external image files required.
 */

// Texture cache to avoid regenerating the same textures
const textureCache = new Map()
const materialCache = new Map()

/**
 * Simple seeded random number generator for consistent procedural textures
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Perlin-like noise using seeded random (simplified for performance)
 */
function noise(x, y, seed = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453
  return n - Math.floor(n)
}

/**
 * Generate a wood grain texture with realistic grain patterns
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} baseColor - RGB color as integer
 * @param {number} grainColor - Grain color as integer
 * @returns {THREE.CanvasTexture}
 */
function generateWoodTexture(width, height, baseColor, grainColor) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Base color
  const base = new Uint8Array(3)
  base[0] = (baseColor >> 16) & 255
  base[1] = (baseColor >> 8) & 255
  base[2] = baseColor & 255

  const grain = new Uint8Array(3)
  grain[0] = (grainColor >> 16) & 255
  grain[1] = (grainColor >> 8) & 255
  grain[2] = grainColor & 255

  // Fill base color
  ctx.fillStyle = `rgb(${base[0]}, ${base[1]}, ${base[2]})`
  ctx.fillRect(0, 0, width, height)

  // Add wood grain using multiple sine waves with varying frequencies
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Multiple grain patterns at different scales
      const grain1 = Math.sin((x + y * 0.5) * 0.02) * 0.5 + 0.5
      const grain2 = Math.sin((x * 0.7 + y * 0.3) * 0.01) * 0.5 + 0.5
      const grain3 = noise(x * 0.005, y * 0.008, 42) * 0.3

      // Combine grain patterns
      let grainIntensity = (grain1 * 0.4 + grain2 * 0.4 + grain3 * 0.2) * 0.6

      // Add some random noise for natural variation
      grainIntensity += seededRandom(x * 73 + y * 97) * 0.15

      // Clamp grain intensity
      grainIntensity = Math.max(0, Math.min(1, grainIntensity))

      // Interpolate between base and grain color
      const idx = (y * width + x) * 4
      data[idx] = Math.lerp(base[0], grain[0], grainIntensity)
      data[idx + 1] = Math.lerp(base[1], grain[1], grainIntensity)
      data[idx + 2] = Math.lerp(base[2], grain[2], grainIntensity)
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // Create Three.js texture
  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Generate a marble texture with procedural veining
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} baseColor - RGB color as integer
 * @param {number} veinColor - Vein color as integer
 * @returns {THREE.CanvasTexture}
 */
function generateMarbleTexture(width, height, baseColor, veinColor) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Base color
  const base = new Uint8Array(3)
  base[0] = (baseColor >> 16) & 255
  base[1] = (baseColor >> 8) & 255
  base[2] = baseColor & 255

  const vein = new Uint8Array(3)
  vein[0] = (veinColor >> 16) & 255
  vein[1] = (veinColor >> 8) & 255
  vein[2] = veinColor & 255

  // Fill base color
  ctx.fillStyle = `rgb(${base[0]}, ${base[1]}, ${base[2]})`
  ctx.fillRect(0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Multiple sine waves to create vein patterns
      const vein1 = Math.sin(x * 0.01 + Math.sin(y * 0.005) * 5) * 0.5 + 0.5
      const vein2 = Math.sin(y * 0.012 + Math.cos(x * 0.008) * 5) * 0.5 + 0.5
      const vein3 = Math.sin((x + y) * 0.008) * 0.5 + 0.5

      // Perlin-like noise for organic variation
      const n1 = noise(x * 0.01, y * 0.01, 10)
      const n2 = noise(x * 0.005, y * 0.007, 20)

      // Combine vein patterns
      let veinIntensity = Math.max(
        Math.min(vein1 * 0.8, 0.4),
        Math.min(vein2 * 0.8, 0.3),
        Math.min(vein3 * 0.6, 0.2)
      )
      veinIntensity = Math.max(0, veinIntensity + n1 * 0.2 + n2 * 0.15 - 0.3)
      veinIntensity = Math.min(1, veinIntensity)

      // Apply vein color
      const idx = (y * width + x) * 4
      data[idx] = Math.lerp(base[0], vein[0], veinIntensity)
      data[idx + 1] = Math.lerp(base[1], vein[1], veinIntensity)
      data[idx + 2] = Math.lerp(base[2], vein[2], veinIntensity)
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Generate a brick texture with mortar lines and coursing
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} brickColor - Brick color as integer
 * @param {number} mortarColor - Mortar color as integer
 * @returns {THREE.CanvasTexture}
 */
function generateBrickTexture(width, height, brickColor, mortarColor) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Brick size in pixels
  const brickWidth = 64
  const brickHeight = 32
  const mortarWidth = 3

  const brick = new Uint8Array(3)
  brick[0] = (brickColor >> 16) & 255
  brick[1] = (brickColor >> 8) & 255
  brick[2] = brickColor & 255

  const mortar = new Uint8Array(3)
  mortar[0] = (mortarColor >> 16) & 255
  mortar[1] = (mortarColor >> 8) & 255
  mortar[2] = mortarColor & 255

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Determine brick row (offset every other row)
      const row = Math.floor(y / (brickHeight + mortarWidth))
      const offset = row % 2 === 1 ? brickWidth / 2 : 0
      const localX = (x - offset) % (brickWidth + mortarWidth)
      const localY = y % (brickHeight + mortarWidth)

      // Is this mortar or brick?
      let r, g, b
      if (localX >= brickWidth || localY >= brickHeight) {
        // Mortar
        r = mortar[0]
        g = mortar[1]
        b = mortar[2]
      } else {
        // Brick with some color variation
        const variation = seededRandom(row * 73 + Math.floor(localX / 16) * 97) * 0.15
        r = Math.max(0, Math.min(255, brick[0] + variation * 100 - 50))
        g = Math.max(0, Math.min(255, brick[1] + variation * 100 - 50))
        b = Math.max(0, Math.min(255, brick[2] + variation * 100 - 50))
      }

      const idx = (y * width + x) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.repeat.set(1, 1)
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Generate a tile texture with grout lines
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} tileColor - Tile color as integer
 * @param {number} groutColor - Grout color as integer
 * @param {number} tileSize - Size of tiles in pixels
 * @returns {THREE.CanvasTexture}
 */
function generateTileTexture(width, height, tileColor, groutColor, tileSize = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const groutWidth = 2

  const tile = new Uint8Array(3)
  tile[0] = (tileColor >> 16) & 255
  tile[1] = (tileColor >> 8) & 255
  tile[2] = tileColor & 255

  const grout = new Uint8Array(3)
  grout[0] = (groutColor >> 16) & 255
  grout[1] = (groutColor >> 8) & 255
  grout[2] = groutColor & 255

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const localX = x % (tileSize + groutWidth)
      const localY = y % (tileSize + groutWidth)
      const tileRow = Math.floor(y / (tileSize + groutWidth))
      const tileCol = Math.floor(x / (tileSize + groutWidth))

      let r, g, b
      if (localX >= tileSize || localY >= tileSize) {
        // Grout line
        r = grout[0]
        g = grout[1]
        b = grout[2]
      } else {
        // Tile with slight checkerboard variation
        const variation = ((tileRow + tileCol) % 2) * 0.05
        r = Math.max(0, Math.min(255, tile[0] * (1 - variation)))
        g = Math.max(0, Math.min(255, tile[1] * (1 - variation)))
        b = Math.max(0, Math.min(255, tile[2] * (1 - variation)))
      }

      const idx = (y * width + x) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Generate a carpet texture (noise-based with soft appearance)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} baseColor - Base color as integer
 * @returns {THREE.CanvasTexture}
 */
function generateCarpetTexture(width, height, baseColor) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const base = new Uint8Array(3)
  base[0] = (baseColor >> 16) & 255
  base[1] = (baseColor >> 8) & 255
  base[2] = baseColor & 255

  // Fill base
  ctx.fillStyle = `rgb(${base[0]}, ${base[1]}, ${base[2]})`
  ctx.fillRect(0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Multiple noise scales for fiber texture
      const noise1 = noise(x * 0.05, y * 0.05, 1) * 0.4
      const noise2 = noise(x * 0.02, y * 0.02, 2) * 0.3
      const noise3 = seededRandom(x * 17 + y * 31) * 0.3

      const variation = noise1 + noise2 + noise3 - 0.3
      const factor = Math.max(0, Math.min(1, 0.5 + variation))

      const idx = (y * width + x) * 4
      data[idx] = Math.round(base[0] * (0.7 + factor * 0.3))
      data[idx + 1] = Math.round(base[1] * (0.7 + factor * 0.3))
      data[idx + 2] = Math.round(base[2] * (0.7 + factor * 0.3))
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Generate a concrete texture with cracks and roughness
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} baseColor - Base color as integer
 * @returns {THREE.CanvasTexture}
 */
function generateConcreteTexture(width, height, baseColor) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const base = new Uint8Array(3)
  base[0] = (baseColor >> 16) & 255
  base[1] = (baseColor >> 8) & 255
  base[2] = baseColor & 255

  ctx.fillStyle = `rgb(${base[0]}, ${base[1]}, ${base[2]})`
  ctx.fillRect(0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Aggregate/speckle pattern
      const n1 = noise(x * 0.1, y * 0.1, 5)
      const n2 = noise(x * 0.05, y * 0.05, 6)
      const random = seededRandom(x * 53 + y * 71)

      let variation = n1 * 0.4 + n2 * 0.4 + random * 0.2 - 0.4
      variation = Math.max(-0.2, Math.min(0.2, variation))

      const idx = (y * width + x) * 4
      data[idx] = Math.round(base[0] + variation * 80)
      data[idx + 1] = Math.round(base[1] + variation * 80)
      data[idx + 2] = Math.round(base[2] + variation * 80)
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Generate a fabric texture (for upholstered furniture)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} baseColor - Base color as integer
 * @returns {THREE.CanvasTexture}
 */
function generateFabricTexture(width, height, baseColor) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const base = new Uint8Array(3)
  base[0] = (baseColor >> 16) & 255
  base[1] = (baseColor >> 8) & 255
  base[2] = baseColor & 255

  ctx.fillStyle = `rgb(${base[0]}, ${base[1]}, ${base[2]})`
  ctx.fillRect(0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Weave pattern using sine waves
      const warp = Math.sin(x * 0.1) * 0.5 + 0.5
      const weft = Math.sin(y * 0.1) * 0.5 + 0.5
      const blend = (warp + weft) * 0.5

      // Add subtle noise
      const n = noise(x * 0.05, y * 0.05, 8) * 0.2

      const variation = blend * 0.2 + n - 0.1
      const factor = Math.max(-0.15, Math.min(0.15, variation))

      const idx = (y * width + x) * 4
      data[idx] = Math.round(base[0] + factor * 100)
      data[idx + 1] = Math.round(base[1] + factor * 100)
      data[idx + 2] = Math.round(base[2] + factor * 100)
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Generate a normal map from a height/grayscale canvas using Sobel filter
 * @param {HTMLCanvasElement} heightCanvas - Input height map canvas
 * @returns {THREE.CanvasTexture} Normal map texture
 */
function generateNormalMapFromHeight(heightCanvas) {
  const width = heightCanvas.width
  const height = heightCanvas.height
  const ctx = heightCanvas.getContext('2d')
  const heightData = ctx.getImageData(0, 0, width, height).data

  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = width
  normalCanvas.height = height
  const normalCtx = normalCanvas.getContext('2d')
  const normalData = normalCtx.createImageData(width, height)
  const data = normalData.data

  const strength = 8.0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Sobel filter
      const getHeight = (px, py) => {
        const px2 = Math.max(0, Math.min(width - 1, px))
        const py2 = Math.max(0, Math.min(height - 1, py))
        return heightData[(py2 * width + px2) * 4] / 255.0
      }

      // Sobel operators
      const sx =
        -getHeight(x - 1, y - 1) -
        2 * getHeight(x - 1, y) -
        getHeight(x - 1, y + 1) +
        getHeight(x + 1, y - 1) +
        2 * getHeight(x + 1, y) +
        getHeight(x + 1, y + 1)

      const sy =
        -getHeight(x - 1, y - 1) -
        2 * getHeight(x, y - 1) -
        getHeight(x + 1, y - 1) +
        getHeight(x - 1, y + 1) +
        2 * getHeight(x, y + 1) +
        getHeight(x + 1, y + 1)

      // Normal vector
      const nx = -sx * strength
      const ny = -sy * strength
      const nz = 1.0

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      const nnx = nx / len
      const nny = ny / len
      const nnz = nz / len

      // Convert to 0-255 range
      const idx = (y * width + x) * 4
      data[idx] = Math.round((nnx * 0.5 + 0.5) * 255)
      data[idx + 1] = Math.round((nny * 0.5 + 0.5) * 255)
      data[idx + 2] = Math.round((nnz * 0.5 + 0.5) * 255)
      data[idx + 3] = 255
    }
  }

  normalCtx.putImageData(normalData, 0, 0)

  const texture = new window.THREE.CanvasTexture(normalCanvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Create a roughness map canvas (grayscale)
 * Higher values = rougher surface
 */
function generateRoughnessMap(width, height, baseRoughness, variation = 0.2) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const n = noise(x * 0.02, y * 0.02, 3)
      const rough = Math.max(0, Math.min(1, baseRoughness + (n - 0.5) * variation * 2))
      const val = Math.round(rough * 255)

      const idx = (y * width + x) * 4
      data[idx] = val
      data[idx + 1] = val
      data[idx + 2] = val
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new window.THREE.CanvasTexture(canvas)
  texture.wrapS = window.THREE.RepeatWrapping
  texture.wrapT = window.THREE.RepeatWrapping
  texture.magFilter = window.THREE.LinearFilter
  texture.minFilter = window.THREE.LinearMipmapLinearFilter

  return texture
}

/**
 * Material properties for PBR materials
 */
export const PBR_MATERIALS = {
  // ── Wood ────────────────────────────────────────────
  'hardwood-oak': {
    base: 0xC4A35A,
    grain: 0x8B6914,
    type: 'wood',
    roughness: 0.7,
    metalness: 0.0,
  },
  'hardwood-walnut': {
    base: 0x5C4033,
    grain: 0x3E2723,
    type: 'wood',
    roughness: 0.65,
    metalness: 0.0,
  },
  'hardwood-cherry': {
    base: 0x92400e,
    grain: 0x6B2F0E,
    type: 'wood',
    roughness: 0.7,
    metalness: 0.0,
  },
  bamboo: {
    base: 0xD4A76A,
    grain: 0xB8860B,
    type: 'wood',
    roughness: 0.6,
    metalness: 0.0,
  },
  'vinyl-plank': {
    base: 0xA89279,
    grain: 0x8B7355,
    type: 'wood',
    roughness: 0.5,
    metalness: 0.05,
  },

  // ── Tile ────────────────────────────────────────────
  'tile-marble': {
    base: 0xE8E4DE,
    vein: 0xBDBDBD,
    type: 'marble',
    roughness: 0.2,
    metalness: 0.0,
  },
  'tile-white': {
    base: 0xF0EDEA,
    grout: 0xCCCCCC,
    type: 'tile',
    roughness: 0.3,
    metalness: 0.1,
  },
  'tile-slate': {
    base: 0x6B7B8D,
    grout: 0x5A6A7A,
    type: 'tile',
    roughness: 0.8,
    metalness: 0.0,
  },
  terracotta: {
    base: 0xC67B5C,
    grout: 0xB8956A,
    type: 'tile',
    roughness: 0.85,
    metalness: 0.0,
  },

  // ── Brick ───────────────────────────────────────────
  brick: {
    base: 0x8B4513,
    mortar: 0xD2B48C,
    type: 'brick',
    roughness: 0.95,
    metalness: 0.0,
  },

  // ── Carpet ──────────────────────────────────────────
  'carpet-beige': {
    base: 0xD4C5A9,
    type: 'carpet',
    roughness: 1.0,
    metalness: 0.0,
  },
  'carpet-gray': {
    base: 0x9CA3AF,
    type: 'carpet',
    roughness: 1.0,
    metalness: 0.0,
  },

  // ── Concrete ────────────────────────────────────────
  concrete: {
    base: 0xB0B0B0,
    type: 'concrete',
    roughness: 0.4,
    metalness: 0.05,
  },
  'concrete-raw': {
    base: 0x9CA3AF,
    type: 'concrete',
    roughness: 0.6,
    metalness: 0.0,
  },

  // ── Fabric ──────────────────────────────────────────
  'fabric-linen': {
    base: 0xE8D5B7,
    type: 'fabric',
    roughness: 0.9,
    metalness: 0.0,
  },
  'fabric-cotton': {
    base: 0xDDD5C4,
    type: 'fabric',
    roughness: 0.95,
    metalness: 0.0,
  },
  'fabric-velvet': {
    base: 0x4A3F35,
    type: 'fabric',
    roughness: 0.5,
    metalness: 0.0,
  },

  // ── Paint ───────────────────────────────────────────
  'paint-white': {
    base: 0xF5F5F5,
    type: 'carpet',
    roughness: 0.9,
    metalness: 0.0,
  },
  'paint-warm': {
    base: 0xFAF0E6,
    type: 'carpet',
    roughness: 0.9,
    metalness: 0.0,
  },
  'paint-gray': {
    base: 0xD1D5DB,
    type: 'carpet',
    roughness: 0.9,
    metalness: 0.0,
  },
  'paint-sage': {
    base: 0xA8C4A0,
    type: 'carpet',
    roughness: 0.9,
    metalness: 0.0,
  },
  'paint-navy': {
    base: 0x1E3A5F,
    type: 'carpet',
    roughness: 0.9,
    metalness: 0.0,
  },
  'paint-charcoal': {
    base: 0x374151,
    type: 'carpet',
    roughness: 0.9,
    metalness: 0.0,
  },
}

/**
 * Create a PBR material with procedural textures
 * @param {object} THREE - Global Three.js object
 * @param {string} materialId - Material ID from PBR_MATERIALS
 * @returns {THREE.MeshStandardMaterial}
 */
export function createPBRMaterial(THREE, materialId) {
  // Check cache first
  if (materialCache.has(materialId)) {
    return materialCache.get(materialId).clone()
  }

  const matDef = PBR_MATERIALS[materialId]
  if (!matDef) {
    // Fallback to gray if material not found
    console.warn(`Material ${materialId} not found, using default gray`)
    return new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 })
  }

  const textureSize = 512
  let colorMap, normalMap, roughnessMap

  // Generate color and normal maps based on material type
  switch (matDef.type) {
    case 'wood':
      colorMap = generateWoodTexture(textureSize, textureSize, matDef.base, matDef.grain)
      roughnessMap = generateRoughnessMap(textureSize, textureSize, matDef.roughness, 0.15)
      // Generate normal from the color map for detail
      normalMap = generateNormalMapFromHeight(colorMap.source.data)
      break

    case 'marble':
      colorMap = generateMarbleTexture(textureSize, textureSize, matDef.base, matDef.vein)
      roughnessMap = generateRoughnessMap(textureSize, textureSize, matDef.roughness, 0.1)
      normalMap = generateNormalMapFromHeight(colorMap.source.data)
      break

    case 'brick':
      colorMap = generateBrickTexture(textureSize, textureSize, matDef.base, matDef.mortar)
      roughnessMap = generateRoughnessMap(textureSize, textureSize, matDef.roughness, 0.2)
      normalMap = generateNormalMapFromHeight(colorMap.source.data)
      break

    case 'tile':
      colorMap = generateTileTexture(textureSize, textureSize, matDef.base, matDef.grout || 0xCCCCCC, 64)
      roughnessMap = generateRoughnessMap(textureSize, textureSize, matDef.roughness, 0.1)
      normalMap = generateNormalMapFromHeight(colorMap.source.data)
      break

    case 'carpet':
      colorMap = generateCarpetTexture(textureSize, textureSize, matDef.base)
      roughnessMap = generateRoughnessMap(textureSize, textureSize, matDef.roughness, 0.15)
      normalMap = generateNormalMapFromHeight(colorMap.source.data)
      break

    case 'concrete':
      colorMap = generateConcreteTexture(textureSize, textureSize, matDef.base)
      roughnessMap = generateRoughnessMap(textureSize, textureSize, matDef.roughness, 0.2)
      normalMap = generateNormalMapFromHeight(colorMap.source.data)
      break

    case 'fabric':
      colorMap = generateFabricTexture(textureSize, textureSize, matDef.base)
      roughnessMap = generateRoughnessMap(textureSize, textureSize, matDef.roughness, 0.25)
      normalMap = generateNormalMapFromHeight(colorMap.source.data)
      break

    default:
      // Fallback to solid color
      colorMap = new THREE.CanvasTexture((() => {
        const c = document.createElement('canvas')
        c.width = c.height = 1
        const ctx = c.getContext('2d')
        const hex = matDef.base.toString(16).padStart(6, '0')
        ctx.fillStyle = `#${hex}`
        ctx.fillRect(0, 0, 1, 1)
        return c
      })())
      roughnessMap = generateRoughnessMap(64, 64, matDef.roughness, 0.0)
      normalMap = new THREE.CanvasTexture((() => {
        const c = document.createElement('canvas')
        c.width = c.height = 1
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#8080FF' // Neutral normal
        ctx.fillRect(0, 0, 1, 1)
        return c
      })())
  }

  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    roughness: matDef.roughness,
    metalness: matDef.metalness,
  })

  materialCache.set(materialId, material)
  return material.clone()
}

/**
 * Clear material cache to free memory
 */
export function clearMaterialCache() {
  materialCache.forEach((material) => {
    material.dispose()
  })
  materialCache.clear()
}

// Polyfill Math.lerp if it doesn't exist
if (!Math.lerp) {
  Math.lerp = function (a, b, t) {
    return a + (b - a) * t
  }
}
