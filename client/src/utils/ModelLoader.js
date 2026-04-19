/**
 * ModelLoader.js - GLTF/GLB Model Loading System for Three.js r128
 *
 * Provides efficient model loading with in-memory caching and graceful fallback
 * to procedural geometry when models are unavailable.
 */

// In-memory cache for loaded models
const modelCache = new Map()

// Loaders initialized on first use
let gltfLoader = null
let dracoLoader = null

/**
 * Initialize loaders from CDN (Three.js r128 compatible)
 * @param {THREE} THREE - Global Three.js object
 */
export function initializeLoaders(THREE) {
  if (gltfLoader) return

  // Load GLTFLoader from CDN
  const gltfLoaderScript = document.createElement('script')
  gltfLoaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'
  gltfLoaderScript.onload = () => {
    gltfLoader = new window.THREE.GLTFLoader()

    // Load DRACOLoader for compressed geometry support
    const dracoLoaderScript = document.createElement('script')
    dracoLoaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js'
    dracoLoaderScript.onload = () => {
      dracoLoader = new window.THREE.DRACOLoader()
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/')
      gltfLoader.setDRACOLoader(dracoLoader)
    }
    document.head.appendChild(dracoLoaderScript)
  }
  document.head.appendChild(gltfLoaderScript)
}

/**
 * Load a GLTF/GLB model from a URL
 * @param {THREE} THREE - Global Three.js object
 * @param {string} url - Model URL (GLTF or GLB)
 * @returns {Promise<THREE.Group>} Loaded model as a Three.js Group
 */
export async function loadModel(THREE, url) {
  if (!url) return null

  // Check cache first
  if (modelCache.has(url)) {
    const cached = modelCache.get(url)
    if (cached.error) {
      throw new Error(cached.error)
    }
    return cached.clone()
  }

  // Initialize loaders on first use
  initializeLoaders(THREE)

  return new Promise((resolve, reject) => {
    const loadAttempt = () => {
      if (!gltfLoader) {
        // Loaders still initializing, retry after a short delay
        setTimeout(loadAttempt, 100)
        return
      }

      gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene || new THREE.Group()
          // Cache the original
          modelCache.set(url, model)
          // Return a clone so modifications don't affect cache
          resolve(model.clone())
        },
        undefined,
        (error) => {
          modelCache.set(url, { error: error.message })
          reject(error)
        }
      )
    }

    loadAttempt()
  })
}

/**
 * Preload commonly used furniture models
 * @param {THREE} THREE - Global Three.js object
 * @param {string[]} types - List of furniture type IDs to preload
 */
export async function preloadModels(THREE, types) {
  const promises = types.map((type) => {
    const url = MODEL_CATALOG[type]
    if (!url) return Promise.resolve()
    return loadModel(THREE, url).catch(() => {
      // Silently fail on preload; model will fall back to procedural geometry
    })
  })
  return Promise.all(promises)
}

/**
 * Load furniture model with fallback to procedural geometry
 *
 * @param {THREE} THREE - Global Three.js object
 * @param {string} type - Furniture type ID
 * @param {number} width - Target width (world units)
 * @param {number} depth - Target depth (world units)
 * @param {number} height - Target height (world units)
 * @param {Function} fallbackBuilder - Function to build procedural geometry
 *   Signature: (group, width, depth, config) => void
 * @param {object} config - Configuration object for procedural builder
 * @returns {Promise<THREE.Group>} Loaded or procedurally-built model
 */
export async function loadFurnitureModel(THREE, type, width, depth, height, fallbackBuilder, config = {}) {
  const group = new THREE.Group()
  const url = MODEL_CATALOG[type]

  if (url) {
    try {
      const model = await loadModel(THREE, url)
      if (model) {
        // Scale model to fit within bounding box
        const bbox = new THREE.Box3().setFromObject(model)
        const size = bbox.getSize(new THREE.Vector3())

        if (size.x > 0 && size.y > 0 && size.z > 0) {
          // Calculate scale to fit within target dimensions
          // Use the smallest dimension to ensure we don't overflow
          const targetSize = Math.min(width, depth)
          const scaleX = width / size.x
          const scaleY = height / size.y
          const scaleZ = depth / size.z
          const scale = Math.min(scaleX, scaleY, scaleZ, 1.0) // Don't upscale

          model.scale.multiplyScalar(scale)

          // Re-center the model so its base is at origin
          const scaledBbox = new THREE.Box3().setFromObject(model)
          const center = scaledBbox.getCenter(new THREE.Vector3())
          model.position.sub(center)
          model.position.y -= scaledBbox.min.y

          group.add(model)
          return group
        }
      }
    } catch (error) {
      console.warn(`Failed to load model for ${type}: ${error.message}`)
      // Fall through to procedural fallback
    }
  }

  // No model or loading failed — use procedural geometry
  if (fallbackBuilder) {
    fallbackBuilder(group, width, depth, config)
  }

  return group
}

/**
 * Clear the model cache (useful for memory management)
 */
export function clearModelCache() {
  modelCache.forEach((model) => {
    // Dispose Three.js resources if they exist
    if (model.traverse) {
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }
  })
  modelCache.clear()
}

/**
 * MODEL_CATALOG - Maps furniture types to model URLs
 *
 * For now, these are placeholder URLs structured as /api/models/{type}.glb
 * In production, serve actual GLB files from your server or CDN.
 *
 * Recommended free sources:
 * - Kenney 3D Models: https://kenney.nl/assets/furniture-pack
 * - Poly Haven: https://polyhaven.com/models?category=furniture
 * - Sketchfab: https://sketchfab.com (search for CC0 models)
 */
export const MODEL_CATALOG = {
  // ── Seating ───────────────────────────────────────────────
  sofa: '/api/models/sofa.glb',
  'sofa-3seat': '/api/models/sofa-3seat.glb',
  'sectional-l': '/api/models/sectional-l.glb',
  armchair: '/api/models/armchair.glb',
  'accent-chair': '/api/models/accent-chair.glb',
  recliner: '/api/models/recliner.glb',
  loveseat: '/api/models/loveseat.glb',
  bench: '/api/models/bench.glb',
  ottoman: '/api/models/ottoman.glb',
  'bar-stool': '/api/models/bar-stool.glb',
  'office-chair': '/api/models/office-chair.glb',

  // ── Tables ────────────────────────────────────────────────
  'dining-table': '/api/models/dining-table.glb',
  'round-table': '/api/models/round-table.glb',
  desk: '/api/models/desk.glb',
  'l-desk': '/api/models/l-desk.glb',
  'coffee-table': '/api/models/coffee-table.glb',
  'side-table': '/api/models/side-table.glb',
  'console-table': '/api/models/console-table.glb',
  'bar-table': '/api/models/bar-table.glb',
  'patio-table': '/api/models/patio-table.glb',
  island: '/api/models/island.glb',

  // ── Bedroom ───────────────────────────────────────────────
  'bed-king': '/api/models/bed-king.glb',
  'bed-queen': '/api/models/bed-queen.glb',
  'bed-twin': '/api/models/bed-twin.glb',
  'bunk-bed': '/api/models/bunk-bed.glb',
  nightstand: '/api/models/nightstand.glb',
  dresser: '/api/models/dresser.glb',
  wardrobe: '/api/models/wardrobe.glb',
  vanity: '/api/models/vanity.glb',

  // ── Storage ───────────────────────────────────────────────
  bookshelf: '/api/models/bookshelf.glb',
  'bookshelf-tall': '/api/models/bookshelf-tall.glb',
  cabinet: '/api/models/cabinet.glb',
  sideboard: '/api/models/sideboard.glb',
  'shelving-unit': '/api/models/shelving-unit.glb',
  'filing-cabinet': '/api/models/filing-cabinet.glb',

  // ── Media & Office ────────────────────────────────────────
  'tv-console': '/api/models/tv-console.glb',
  'tv-wall-mount': '/api/models/tv-wall-mount.glb',
  speaker: '/api/models/speaker.glb',
  'monitor-stand': '/api/models/monitor-stand.glb',

  // ── Bathroom ──────────────────────────────────────────────
  bathtub: '/api/models/bathtub.glb',
  'freestand-tub': '/api/models/freestand-tub.glb',
  toilet: '/api/models/toilet.glb',
  sink: '/api/models/sink.glb',
  'double-vanity': '/api/models/double-vanity.glb',
  shower: '/api/models/shower.glb',

  // ── Kitchen ───────────────────────────────────────────────
  stove: '/api/models/stove.glb',
  fridge: '/api/models/fridge.glb',
  'fridge-french': '/api/models/fridge-french.glb',
  dishwasher: '/api/models/dishwasher.glb',
  'kitchen-sink': '/api/models/kitchen-sink.glb',
  microwave: '/api/models/microwave.glb',
  'pantry-shelf': '/api/models/pantry-shelf.glb',

  // ── Decor ─────────────────────────────────────────────────
  plant: '/api/models/plant.glb',
  'plant-large': '/api/models/plant-large.glb',
  rug: '/api/models/rug.glb',
  'rug-round': '/api/models/rug-round.glb',
  'floor-lamp': '/api/models/floor-lamp.glb',
  'table-lamp': '/api/models/table-lamp.glb',
  'mirror-floor': '/api/models/mirror-floor.glb',
  fireplace: '/api/models/fireplace.glb',

  // ── Outdoor ───────────────────────────────────────────────
  'patio-chair': '/api/models/patio-chair.glb',
  'lounge-chair': '/api/models/lounge-chair.glb',
  grill: '/api/models/grill.glb',
  planter: '/api/models/planter.glb',
  umbrella: '/api/models/umbrella.glb',
}
