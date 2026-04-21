// ═══════════════════════════════════════════════════════════
// OPENDESIGN STUDIO — Room Preview 3D
// Uses OID's HD FurnitureBuilders for photorealistic procedural geometry.
// 5-light rig, PCF soft shadows, ACES tone mapping,
// smooth damped orbit controls, HD shaped furniture.
// ═══════════════════════════════════════════════════════════

import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import {
  buildSeating as buildSeatingHD,
  buildTable as buildTableHD,
  buildBookshelf as buildBookshelfHD,
  buildPlant as buildPlantHD,
  buildRug as buildRugHD,
  buildLamp as buildLampHD,
  buildGenericBox as buildGenericBoxHD,
} from '../utils/FurnitureBuilders'

// ── Constants ──
const WALL_HEIGHT = 9  // feet
const ROOM_W_FT = 20
const ROOM_D_FT = 16
const FT_PER_M = 3.28084

// ── Damped Orbit Controls (ported from OID) ──
function createOrbitControls(camera, domElement) {
  const state = {
    target: new THREE.Vector3(0, 0, 0),
    spherical: new THREE.Spherical(),
    sphericalDelta: new THREE.Spherical(),
    panOffset: new THREE.Vector3(),
    scale: 1,
    rotateStart: new THREE.Vector2(),
    panStart: new THREE.Vector2(),
    isDragging: false,
    button: -1,
    enabled: true,
    minDistance: 5,
    maxDistance: 45,
    minPolarAngle: 0.1,
    maxPolarAngle: Math.PI / 2 - 0.05,
    dampingFactor: 0.08,
    rotateSpeed: 0.8,
    panSpeed: 1.2,
    zoomSpeed: 1.2,
  }
  const offset = new THREE.Vector3()
  offset.copy(camera.position).sub(state.target)
  state.spherical.setFromVector3(offset)

  function update() {
    offset.copy(camera.position).sub(state.target)
    state.spherical.setFromVector3(offset)
    state.spherical.theta += state.sphericalDelta.theta * state.dampingFactor
    state.spherical.phi += state.sphericalDelta.phi * state.dampingFactor
    state.spherical.phi = Math.max(state.minPolarAngle, Math.min(state.maxPolarAngle, state.spherical.phi))
    state.spherical.radius *= state.scale
    state.spherical.radius = Math.max(state.minDistance, Math.min(state.maxDistance, state.spherical.radius))
    state.target.add(state.panOffset.multiplyScalar(state.dampingFactor))
    offset.setFromSpherical(state.spherical)
    camera.position.copy(state.target).add(offset)
    camera.lookAt(state.target)
    state.sphericalDelta.theta *= (1 - state.dampingFactor)
    state.sphericalDelta.phi *= (1 - state.dampingFactor)
    state.panOffset.multiplyScalar(1 - state.dampingFactor)
    state.scale = 1
  }
  function onMouseDown(e) {
    if (!state.enabled) return
    e.preventDefault()
    state.isDragging = true
    state.button = e.button
    state.rotateStart.set(e.clientX, e.clientY)
    state.panStart.set(e.clientX, e.clientY)
  }

  function onMouseMove(e) {
    if (!state.isDragging || !state.enabled) return
    const dx = e.clientX - state.rotateStart.x
    const dy = e.clientY - state.rotateStart.y
    state.rotateStart.set(e.clientX, e.clientY)
    if (state.button === 0) {
      state.sphericalDelta.theta -= dx * state.rotateSpeed * 0.01
      state.sphericalDelta.phi -= dy * state.rotateSpeed * 0.01
    } else if (state.button === 2 || state.button === 1) {
      const panDx = e.clientX - state.panStart.x
      const panDy = e.clientY - state.panStart.y
      state.panStart.set(e.clientX, e.clientY)
      const dist = offset.length() * 0.001 * state.panSpeed
      const panX = new THREE.Vector3()
      const panY = new THREE.Vector3()
      panX.setFromMatrixColumn(camera.matrix, 0)
      panY.setFromMatrixColumn(camera.matrix, 1)
      state.panOffset.addScaledVector(panX, -panDx * dist)
      state.panOffset.addScaledVector(panY, panDy * dist)
    }
  }
  function onMouseUp() { state.isDragging = false; state.button = -1 }
  function onWheel(e) {
    if (!state.enabled) return
    e.preventDefault()
    if (e.deltaY > 0) state.scale /= (1 + 0.05 * state.zoomSpeed)
    else state.scale *= (1 + 0.05 * state.zoomSpeed)
  }

  function onContextMenu(e) { e.preventDefault() }
  let pinchDist = 0
  function onTouchStart(e) {
    if (!state.enabled) return
    if (e.touches.length === 1) {
      state.isDragging = true; state.button = 0
      state.rotateStart.set(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    }
  }
  function onTouchMove(e) {
    if (!state.enabled) return
    if (e.touches.length === 1 && state.isDragging) {
      const dx = e.touches[0].clientX - state.rotateStart.x
      const dy = e.touches[0].clientY - state.rotateStart.y
      state.rotateStart.set(e.touches[0].clientX, e.touches[0].clientY)
      state.sphericalDelta.theta -= dx * state.rotateSpeed * 0.01
      state.sphericalDelta.phi -= dy * state.rotateSpeed * 0.01
    } else if (e.touches.length === 2) {
      const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      if (newDist > pinchDist) state.scale *= 1.02; else state.scale /= 1.02
      pinchDist = newDist
    }
  }
  function onTouchEnd() { state.isDragging = false; state.button = -1 }

  domElement.addEventListener('mousedown', onMouseDown)
  domElement.addEventListener('mousemove', onMouseMove)
  domElement.addEventListener('mouseup', onMouseUp)
  domElement.addEventListener('mouseleave', onMouseUp)
  domElement.addEventListener('wheel', onWheel, { passive: false })
  domElement.addEventListener('contextmenu', onContextMenu)
  domElement.addEventListener('touchstart', onTouchStart, { passive: true })
  domElement.addEventListener('touchmove', onTouchMove, { passive: true })
  domElement.addEventListener('touchend', onTouchEnd)
  return {
    update, target: state.target,
    dispose() {
      domElement.removeEventListener('mousedown', onMouseDown)
      domElement.removeEventListener('mousemove', onMouseMove)
      domElement.removeEventListener('mouseup', onMouseUp)
      domElement.removeEventListener('mouseleave', onMouseUp)
      domElement.removeEventListener('wheel', onWheel)
      domElement.removeEventListener('contextmenu', onContextMenu)
      domElement.removeEventListener('touchstart', onTouchStart)
      domElement.removeEventListener('touchmove', onTouchMove)
      domElement.removeEventListener('touchend', onTouchEnd)
    },
  }
}

// ── OID-style furniture config (type → HD builder config) ──
// Heights in meters (OID scale) — converted via FT_PER_M at render time
const FURNITURE_CFG = {
  Seating:   { height: 0.85, seatH: 0.45, color: 0x6366f1, backRatio: 0.3, hasArms: true, armW: 0.15 },
  Table:     { height: 0.76, legInset: 0.08, color: 0x92400e, topThick: 0.04 },
  Storage:   { height: 1.8, color: 0x78716c, shelves: 4 },
  Lighting:  { height: 1.6, color: 0xCFB53B },
  Plant:     { height: 0.8, potColor: 0x92400e, leafColor: 0x16a34a },
  Textile:   { height: 0.01, color: 0xc8a070 },
  Art:       { height: 0.6, color: 0x888888 },
  Accessory: { height: 0.4, color: 0x888888 },
}

// Classify item → builder category by type + name
function getBuilderCategory(type, name) {
  const t = (type || '').toLowerCase()
  const n = (name || '').toLowerCase()
  if (t === 'seating' || /sofa|chair|lounge|bench|ottoman|stool|settee|chaise|bambole|camaleonda|togo/i.test(n)) return 'seating'
  if (t === 'table' || /table|desk|tobi.ishi|noguchi/i.test(n)) return 'table'
  if (t === 'storage' || /shelf|bookshelf|credenza|cabinet|console|dresser|sideboard/i.test(n)) return 'storage'
  if (t === 'lighting' || /lamp|light|pendant|sconce|chandelier|tolomeo|flowerpot/i.test(n)) return 'lighting'
  if (t === 'plant' || /plant|fern|fiddle|monstera|palm/i.test(n)) return 'plant'
  if (t === 'textile' || /rug|carpet|textile|tapestry|throw|woven/i.test(n)) return 'rug'
  if (t === 'art' || /canvas|painting|print|art|sculpture|photograph/i.test(n)) return 'art'
  return 'generic'
}

// ── MAIN BUILD FUNCTION ─────────────────────────────────────
// Routes to OID's HD FurnitureBuilders with feet↔meters unit conversion.
// DB furniture gets real color, material, and dimension overrides.

function buildFurnitureMesh(item, palette, idx) {
  const fw = item.w / 12  // inches → feet
  const fd = (item.d || 20) / 12
  const group = new THREE.Group()

  // Store product info for raycasting/tooltips
  if (item.name) group.userData = { name: item.name, brand: item.brand, designer: item.designer, price: item.price }

  // Resolve color: DB color_hex > colors array > palette fallback
  const colorHex = item.color_hex || (item.colors || [])[0] || palette[idx % palette.length] || '#c8aa78'
  const colorInt = parseInt(colorHex.replace('#', ''), 16) || 0xc8aa78

  // Determine builder category
  const category = getBuilderCategory(item.type, item.name)

  console.log(`[RoomPreview3D] Building: "${item.name}" | type="${item.type}" → category="${category}" | ${fw.toFixed(1)}ft × ${fd.toFixed(1)}ft | color=#${colorInt.toString(16)}`)

  // Build config from defaults + DB overrides
  const baseCfg = FURNITURE_CFG[item.type] || FURNITURE_CFG[category.charAt(0).toUpperCase() + category.slice(1)] || { height: 0.8, color: 0x888888 }
  const cfg = { ...baseCfg, color: colorInt }

  // Override height from DB (inches → meters)
  if (item.h) {
    cfg.height = (item.h / 12) / FT_PER_M
    if (cfg.seatH) cfg.seatH = cfg.height * 0.53
  }

  // Convert feet to meters for OID builders
  const wM = fw / FT_PER_M
  const dM = fd / FT_PER_M

  try {
    // Route to OID HD builder by category
    if (category === 'seating') {
      if (!cfg.seatH) cfg.seatH = 0.45
      if (cfg.backRatio === undefined) cfg.backRatio = 0.3
      if (cfg.hasArms === undefined) cfg.hasArms = (fw > 3)
      if (!cfg.armW) cfg.armW = cfg.hasArms ? 0.15 : 0
      buildSeatingHD(THREE, group, wM, dM, cfg)
    } else if (category === 'table') {
      if (!cfg.topThick) cfg.topThick = 0.04
      if (!cfg.legInset) cfg.legInset = 0.08
      buildTableHD(THREE, group, wM, dM, cfg)
    } else if (category === 'storage') {
      if (!cfg.shelves) cfg.shelves = 4
      buildBookshelfHD(THREE, group, wM, dM, cfg)
    } else if (category === 'lighting') {
      buildLampHD(THREE, group, wM, dM, cfg)
    } else if (category === 'plant') {
      if (!cfg.potColor) cfg.potColor = colorInt
      if (!cfg.leafColor) cfg.leafColor = 0x16a34a
      buildPlantHD(THREE, group, wM, dM, cfg)
    } else if (category === 'rug') {
      buildRugHD(THREE, group, wM, dM, cfg)
    } else if (category === 'art') {
      // Art: wall-mounted canvas — build inline at feet scale (no conversion needed)
      const artH = 3, artW = fw
      const mat = new THREE.MeshStandardMaterial({ color: colorInt, roughness: 0.7 })
      const canvas = new THREE.Mesh(new THREE.BoxGeometry(artW, artH, 0.15), mat)
      canvas.position.y = WALL_HEIGHT * 0.55
      canvas.castShadow = true
      group.add(canvas)
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.2 })
      const frame = new THREE.Mesh(new THREE.BoxGeometry(artW + 0.2, artH + 0.2, 0.08), frameMat)
      frame.position.y = WALL_HEIGHT * 0.55
      frame.position.z = -0.05
      group.add(frame)
      console.log(`[RoomPreview3D] ✓ Built art "${item.name}" (${group.children.length} meshes)`)
      return group // art is already in feet, skip scaling
    } else {
      buildGenericBoxHD(THREE, group, wM, dM, cfg)
    }

    console.log(`[RoomPreview3D] ✓ Built ${category} "${item.name}" (${group.children.length} meshes, ${wM.toFixed(2)}m × ${dM.toFixed(2)}m)`)
  } catch (err) {
    console.error(`[RoomPreview3D] ✗ FAILED building "${item.name}" (${category}):`, err)
    // Fallback: colored box so something is visible
    const fallbackMat = new THREE.MeshStandardMaterial({ color: colorInt, roughness: 0.6 })
    const fallbackH = (cfg.height || 0.8) 
    const fallbackMesh = new THREE.Mesh(new THREE.BoxGeometry(wM, fallbackH, dM), fallbackMat)
    fallbackMesh.position.y = fallbackH / 2
    fallbackMesh.castShadow = true
    group.add(fallbackMesh)
  }

  // Scale from meters → feet (OID builders produce meter-scale geometry)
  group.scale.set(FT_PER_M, FT_PER_M, FT_PER_M)

  // Add contact shadow under each piece (at feet scale, applied after scaling)
  const shadowR = Math.max(fw, fd) * 0.45
  const shadowGeo = new THREE.CircleGeometry(shadowR / FT_PER_M, 16)
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false })
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat)
  contactShadow.rotation.x = -Math.PI / 2
  contactShadow.position.y = 0.003 / FT_PER_M
  group.add(contactShadow)

  return group
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function RoomPreview3D({ placedItems, palette, timeOfDay, INCH_TO_SVG, ROOM_ORIGIN_X, ROOM_ORIGIN_Y, ROOM_W, ROOM_H }) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    let disposed = false
    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight
    if (w === 0 || h === 0) return

    // ── Renderer (ACES filmic + sRGB + soft shadows) ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.outputEncoding = 3001 // sRGBEncoding
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Scene ──
    const scene = new THREE.Scene()
    const bgColor = timeOfDay === 'night' ? 0x0a0a15 : timeOfDay === 'sunset' ? 0x2a1a0a : 0xdce4ec
    scene.background = new THREE.Color(bgColor)
    const maxDim = Math.max(ROOM_W_FT, ROOM_D_FT)
    scene.fog = new THREE.Fog(bgColor, maxDim * 1.5, maxDim * 3.5)

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 300)
    const cx = ROOM_W_FT / 2
    const cz = ROOM_D_FT / 2
    const camHeight = WALL_HEIGHT * 1.4 + maxDim * 0.12
    const camOffset = maxDim * 0.45
    camera.position.set(cx + camOffset, camHeight, cz + camOffset)
    camera.lookAt(cx, WALL_HEIGHT * 0.3, cz)

    // ── Orbit Controls ──
    const controls = createOrbitControls(camera, renderer.domElement)
    controls.target.set(cx, WALL_HEIGHT * 0.3, cz)
    controlsRef.current = controls

    // ════════════════════════════════════════════════════════
    // LIGHTING — 5-light rig from OID
    // ════════════════════════════════════════════════════════
    const ambientIntensity = timeOfDay === 'day' ? 0.45 : timeOfDay === 'sunset' ? 0.25 : 0.1
    const dirIntensity = timeOfDay === 'day' ? 1.0 : timeOfDay === 'sunset' ? 0.6 : 0.12
    const dirColor = timeOfDay === 'day' ? 0xfff5e6 : timeOfDay === 'sunset' ? 0xffaa55 : 0x223355
    scene.add(new THREE.AmbientLight(0xffffff, ambientIntensity))

    // Key light with shadows
    const dirLight = new THREE.DirectionalLight(dirColor, dirIntensity)
    dirLight.position.set(12, 18, 8)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 80
    dirLight.shadow.camera.left = -25
    dirLight.shadow.camera.right = 25
    dirLight.shadow.camera.top = 25
    dirLight.shadow.camera.bottom = -25
    dirLight.shadow.bias = -0.0005
    dirLight.shadow.normalBias = 0.02
    dirLight.shadow.radius = 3
    scene.add(dirLight)

    // Fill light (cooler, opposite side)
    const fillLight = new THREE.DirectionalLight(0x8899cc, dirIntensity * 0.35)
    fillLight.position.set(-10, 12, -6)
    scene.add(fillLight)

    // Rim/back light
    const rimLight = new THREE.DirectionalLight(0xaabbdd, dirIntensity * 0.15)
    rimLight.position.set(-5, 8, 15)
    scene.add(rimLight)

    // Hemisphere sky/ground bounce
    const hemiLight = new THREE.HemisphereLight(
      timeOfDay === 'night' ? 0x0a1628 : timeOfDay === 'sunset' ? 0xddaa66 : 0x87ceeb,
      timeOfDay === 'night' ? 0x0a0a0a : 0x3d2b1f,
      timeOfDay === 'day' ? 0.35 : 0.18
    )
    scene.add(hemiLight)

    // Evening/night interior lamps
    if (timeOfDay !== 'day') {
      const pl1 = new THREE.PointLight(0xffaa55, timeOfDay === 'sunset' ? 1.0 : 0.7, 20)
      pl1.position.set(cx, WALL_HEIGHT * 0.75, cz)
      pl1.castShadow = true
      scene.add(pl1)
      const pl2 = new THREE.PointLight(0xffcc88, 0.4, 15)
      pl2.position.set(cx * 0.3, WALL_HEIGHT * 0.65, cz * 0.7)
      scene.add(pl2)
    }

    // ════════════════════════════════════════════════════════
    // ROOM GEOMETRY
    // ════════════════════════════════════════════════════════
    const floorColor = palette[4] || palette[0] || '#5B3A1E'
    const wallColor = palette[3] || '#E8E4DE'

    // Floor
    const floorGeo = new THREE.BoxGeometry(ROOM_W_FT, 0.08, ROOM_D_FT)
    const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.75, metalness: 0.02 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.position.set(ROOM_W_FT / 2, -0.04, ROOM_D_FT / 2)
    floor.receiveShadow = true
    scene.add(floor)

    // Walls (3 walls, front open — dollhouse view)
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85, metalness: 0.02, side: THREE.DoubleSide })
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W_FT, WALL_HEIGHT), wallMat)
    bw.position.set(ROOM_W_FT / 2, WALL_HEIGHT / 2, 0)
    bw.receiveShadow = true
    scene.add(bw)
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D_FT, WALL_HEIGHT), wallMat)
    lw.rotation.y = Math.PI / 2
    lw.position.set(0, WALL_HEIGHT / 2, ROOM_D_FT / 2)
    lw.receiveShadow = true
    scene.add(lw)
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D_FT, WALL_HEIGHT), wallMat)
    rw.rotation.y = -Math.PI / 2
    rw.position.set(ROOM_W_FT, WALL_HEIGHT / 2, ROOM_D_FT / 2)
    rw.receiveShadow = true
    scene.add(rw)

    // Baseboard trim
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xF5F0E8, roughness: 0.6 })
    const trimH = 0.35, trimD = 0.08
    const bt = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W_FT, trimH, trimD), trimMat)
    bt.position.set(ROOM_W_FT / 2, trimH / 2, trimD / 2)
    scene.add(bt)
    const lt = new THREE.Mesh(new THREE.BoxGeometry(trimD, trimH, ROOM_D_FT), trimMat)
    lt.position.set(trimD / 2, trimH / 2, ROOM_D_FT / 2)
    scene.add(lt)
    const rt = new THREE.Mesh(new THREE.BoxGeometry(trimD, trimH, ROOM_D_FT), trimMat)
    rt.position.set(ROOM_W_FT - trimD / 2, trimH / 2, ROOM_D_FT / 2)
    scene.add(rt)

    // ════════════════════════════════════════════════════════
    // FURNITURE
    // ════════════════════════════════════════════════════════
    console.log(`[RoomPreview3D] Rendering ${placedItems.length} items. INCH_TO_SVG=${INCH_TO_SVG}, ROOM_ORIGIN=(${ROOM_ORIGIN_X},${ROOM_ORIGIN_Y}), ROOM_WH=(${ROOM_W},${ROOM_H})`)
    placedItems.forEach((item, i) => {
      console.log(`[RoomPreview3D] Item ${i}: "${item.name}" type=${item.type} w=${item.w} d=${item.d} h=${item.h} x=${item.x} y=${item.y}`)
      const group = buildFurnitureMesh(item, palette, i)
      // Convert SVG coordinates → 3D world position (feet)
      const svgCX = item.x + (item.w * INCH_TO_SVG) / 2
      const svgCY = item.y + ((item.d || 20) * INCH_TO_SVG) / 2
      const nx = ((svgCX - ROOM_ORIGIN_X) / ROOM_W) * ROOM_W_FT
      const nz = ((svgCY - ROOM_ORIGIN_Y) / ROOM_H) * ROOM_D_FT
      group.position.set(nx, 0, nz)
      group.rotation.y = -(item.rotation || 0) * Math.PI / 180
      scene.add(group)
    })

    // ════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ════════════════════════════════════════════════════════
    function animate() {
      if (disposed) return
      animFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (disposed) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      if (nw === 0 || nh === 0) return
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (controlsRef.current) controlsRef.current.dispose()
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (rendererRef.current.domElement?.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement)
        }
      }
      window.removeEventListener('resize', onResize)
    }
  }, [placedItems, palette, timeOfDay, INCH_TO_SVG, ROOM_ORIGIN_X, ROOM_ORIGIN_Y, ROOM_W, ROOM_H])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
      <div style={{
        position: 'absolute', bottom: 10, left: 10, padding: '4px 10px',
        background: 'rgba(0,0,0,0.5)', borderRadius: 6, color: '#8a8078', fontSize: 10,
        pointerEvents: 'none', zIndex: 1,
      }}>
        Drag to rotate · Scroll to zoom · Right-drag to pan
      </div>
    </div>
  )
}
