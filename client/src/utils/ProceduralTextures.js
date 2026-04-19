/**
 * ProceduralTextures.js — Canvas-based PBR texture generators for photorealistic rendering
 * Generates wood grain, fabric, metal, marble, and concrete textures at runtime
 */

const textureCache = new Map()

function getCached(key, generator) {
  if (textureCache.has(key)) return textureCache.get(key)
  const tex = generator()
  textureCache.set(key, tex)
  return tex
}

// ── Noise helpers ────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function smoothNoise(x, y, rand) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)

  const r = seededRandom(ix * 374761 + iy * 668265)
  const n00 = r(), n10 = seededRandom((ix + 1) * 374761 + iy * 668265)()
  const n01 = seededRandom(ix * 374761 + (iy + 1) * 668265)()
  const n11 = seededRandom((ix + 1) * 374761 + (iy + 1) * 668265)()

  return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy
}

function fbm(x, y, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq)
    amp *= 0.5
    freq *= 2
  }
  return val
}

// ── Color helpers ────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff
  return [r, g, b]
}

function rgbMix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

// ── Wood Grain Texture ───────────────────────────────────────────────────

export function createWoodTexture(THREE, baseColor = 0xC4A35A, size = 512) {
  return getCached(`wood_${baseColor}_${size}`, () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const base = hexToRgb(baseColor)
    const dark = base.map(c => Math.max(0, c - 40))
    const light = base.map(c => Math.min(255, c + 25))

    const data = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Wood grain: horizontal lines with noise distortion
        const grain = Math.sin((y + fbm(x * 0.02, y * 0.005, 3) * 30) * 0.4) * 0.5 + 0.5
        const ring = Math.sin((y * 0.15 + fbm(x * 0.01, y * 0.01, 2) * 8)) * 0.5 + 0.5
        const noise = fbm(x * 0.05, y * 0.05, 2) * 0.15

        const t = grain * 0.5 + ring * 0.3 + noise
        const color = t > 0.55 ? rgbMix(base, dark, (t - 0.55) * 3) : rgbMix(base, light, (0.55 - t) * 2)

        const i = (y * size + x) * 4
        data.data[i] = color[0]
        data.data[i + 1] = color[1]
        data.data[i + 2] = color[2]
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    return tex
  })
}

// ── Wood Normal Map ──────────────────────────────────────────────────────

export function createWoodNormalMap(THREE, size = 512) {
  return getCached(`wood_normal_${size}`, () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const data = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const h = fbm(x * 0.02, y * 0.005, 3) * 0.5 + Math.sin(y * 0.4) * 0.1
        const hx = fbm((x + 1) * 0.02, y * 0.005, 3) * 0.5 + Math.sin(y * 0.4) * 0.1
        const hy = fbm(x * 0.02, (y + 1) * 0.005, 3) * 0.5 + Math.sin((y + 1) * 0.4) * 0.1

        const dx = (h - hx) * 3
        const dy = (h - hy) * 3
        const i = (y * size + x) * 4
        data.data[i] = Math.round((dx + 1) * 0.5 * 255)
        data.data[i + 1] = Math.round((dy + 1) * 0.5 * 255)
        data.data[i + 2] = 200 // Z always pointing up-ish
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    return tex
  })
}

// ── Fabric Texture ───────────────────────────────────────────────────────

export function createFabricTexture(THREE, baseColor = 0x6366f1, size = 256) {
  return getCached(`fabric_${baseColor}_${size}`, () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const base = hexToRgb(baseColor)

    const data = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Cross-weave pattern
        const weaveX = Math.sin(x * 1.2) * 0.03
        const weaveY = Math.sin(y * 1.2) * 0.03
        const thread = ((x + y) % 3 === 0 ? 0.02 : -0.01) + ((x - y + size) % 5 === 0 ? 0.015 : 0)
        const noise = fbm(x * 0.1, y * 0.1, 2) * 0.06
        const variation = weaveX + weaveY + thread + noise

        const i = (y * size + x) * 4
        data.data[i] = Math.max(0, Math.min(255, base[0] + variation * 255))
        data.data[i + 1] = Math.max(0, Math.min(255, base[1] + variation * 255))
        data.data[i + 2] = Math.max(0, Math.min(255, base[2] + variation * 255))
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

// ── Metal Brushed Texture ────────────────────────────────────────────────

export function createMetalTexture(THREE, baseColor = 0xC0C0C0, size = 256) {
  return getCached(`metal_${baseColor}_${size}`, () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const base = hexToRgb(baseColor)

    const data = ctx.createImageData(size, size)
    const rand = seededRandom(42)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Horizontal brushing lines
        const brush = (rand() - 0.5) * 0.04 + Math.sin(y * 2.5 + rand() * 0.5) * 0.02
        const spec = Math.pow(Math.sin(x * 0.05 + y * 0.02) * 0.5 + 0.5, 3) * 0.08

        const i = (y * size + x) * 4
        data.data[i] = Math.max(0, Math.min(255, base[0] + (brush + spec) * 255))
        data.data[i + 1] = Math.max(0, Math.min(255, base[1] + (brush + spec) * 255))
        data.data[i + 2] = Math.max(0, Math.min(255, base[2] + (brush + spec) * 255))
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

// ── Marble Texture ───────────────────────────────────────────────────────

export function createMarbleTexture(THREE, baseColor = 0xE8E4DE, size = 512) {
  return getCached(`marble_${baseColor}_${size}`, () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const base = hexToRgb(baseColor)

    const data = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size, ny = y / size
        // Marble veining
        const vein = Math.sin(
          nx * 8 + fbm(nx * 4, ny * 4, 5) * 6
        )
        const vein2 = Math.sin(
          ny * 6 + fbm(nx * 3 + 100, ny * 3 + 100, 4) * 5
        )
        const combined = vein * 0.4 + vein2 * 0.3 + fbm(nx * 2, ny * 2, 3) * 0.3
        const t = combined * 0.5 + 0.5

        const veinColor = [base[0] - 60, base[1] - 55, base[2] - 50]
        const color = rgbMix(base, veinColor, Math.pow(1 - t, 2) * 0.6)

        const i = (y * size + x) * 4
        data.data[i] = color[0]
        data.data[i + 1] = color[1]
        data.data[i + 2] = color[2]
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

// ── Rug Pattern Texture ──────────────────────────────────────────────────

export function createRugTexture(THREE, baseColor = 0xc8a070, size = 512) {
  return getCached(`rug_${baseColor}_${size}`, () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const base = hexToRgb(baseColor)
    const accent = [base[0] - 50, base[1] - 30, base[2] - 20].map(c => Math.max(0, c))
    const light = base.map(c => Math.min(255, c + 30))

    const data = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const bx = x / size, by = y / size
        // Geometric pattern
        const pattern1 = Math.sin(bx * 24) * Math.sin(by * 24) > 0.3 ? 1 : 0
        const pattern2 = ((Math.floor(bx * 12) + Math.floor(by * 12)) % 2) * 0.15
        const border = (bx < 0.08 || bx > 0.92 || by < 0.08 || by > 0.92) ? 1 : 0
        const innerBorder = (bx > 0.06 && bx < 0.12 || bx > 0.88 && bx < 0.94 ||
                            by > 0.06 && by < 0.12 || by > 0.88 && by < 0.94) ? 0.5 : 0

        let color = base
        if (border) color = accent
        else if (innerBorder > 0) color = rgbMix(base, light, innerBorder)
        else if (pattern1) color = rgbMix(base, accent, 0.3 + pattern2)

        // Add fiber noise
        const fiber = fbm(x * 0.3, y * 0.3, 2) * 0.04
        const i = (y * size + x) * 4
        data.data[i] = Math.max(0, Math.min(255, color[0] + fiber * 255))
        data.data[i + 1] = Math.max(0, Math.min(255, color[1] + fiber * 255))
        data.data[i + 2] = Math.max(0, Math.min(255, color[2] + fiber * 255))
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    return tex
  })
}

// ── Concrete Texture ─────────────────────────────────────────────────────

export function createConcreteTexture(THREE, baseColor = 0xB0B0B0, size = 256) {
  return getCached(`concrete_${baseColor}_${size}`, () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const base = hexToRgb(baseColor)

    const data = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const noise = fbm(x * 0.08, y * 0.08, 4) * 0.12
        const speckle = (seededRandom(x * 997 + y * 1013)() - 0.5) * 0.03

        const i = (y * size + x) * 4
        data.data[i] = Math.max(0, Math.min(255, base[0] + (noise + speckle) * 255))
        data.data[i + 1] = Math.max(0, Math.min(255, base[1] + (noise + speckle) * 255))
        data.data[i + 2] = Math.max(0, Math.min(255, base[2] + (noise + speckle) * 255))
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

// ── Cleanup ──────────────────────────────────────────────────────────────

export function clearTextureCache() {
  textureCache.forEach(tex => {
    if (tex && tex.dispose) tex.dispose()
  })
  textureCache.clear()
}
