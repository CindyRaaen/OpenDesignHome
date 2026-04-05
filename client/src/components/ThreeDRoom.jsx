import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ── Wallpaper color map ──
const WALL_COLORS = {
  white: 0xf5f0eb, cream: 0xf5e6d3, sage: 0xc5d5c0, navy: 0x2c3e6b,
  blush: 0xf0d4d4, charcoal: 0x4a4a4a, stripe: 0xe8edf4, damask: 0xf5e6c8, herring: 0xd8d3ce,
}

// ── Floor color map ──
const FLOOR_COLORS = {
  oak:    { main: 0xd4a86a, stripe: 0xc49a5c },
  walnut: { main: 0x6b4226, stripe: 0x5a3520 },
  maple:  { main: 0xc8945a, stripe: 0xb8844a },
  gray:   { main: 0xa8a090, stripe: 0x989080 },
  white:  { main: 0xddd4c4, stripe: 0xcec5b5 },
  tile:   { main: 0xe8e4e0, stripe: 0xd0ccc5 },
}

// ── Rug color map ──
const RUG_COLORS = {
  none: null,
  persian: { main: 0x8b2020, border: 0xd4a843 },
  modern:  { main: 0x9e9e9e, border: 0x757575 },
  blue:    { main: 0x1a3a5c, border: 0xc5a84d },
  cream:   { main: 0xf5f0e8, border: 0xe0d8c8 },
  green:   { main: 0x2d5a3d, border: 0x8b7e3a },
  blush:   { main: 0xe8b4b8, border: 0xd4969b },
  black:   { main: 0x333333, border: 0xffffff },
}

// ── Furniture 3D builders by category ──
const FURNITURE_COLORS = {
  sofas: 0x4F46E5, chairs: 0x8b5cf6, tables: 0xa08060,
  lamps: 0xc8a060, art: 0xec4899, plants: 0x2d8a4e,
}

function box(x, y, z, w, h, d, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function buildSofa(color) {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  const cush = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).offsetHSL(0, 0, 0.06).getHex(), roughness: 0.8 })
  g.add(box(0, 0.22, 0, 1.8, 0.38, 0.8, mat))
  g.add(box(0, 0.58, -0.3, 1.8, 0.48, 0.18, mat))
  g.add(box(-0.85, 0.42, 0, 0.1, 0.42, 0.8, mat))
  g.add(box(0.85, 0.42, 0, 0.1, 0.42, 0.8, mat))
  g.add(box(-0.38, 0.43, 0.04, 0.76, 0.07, 0.6, cush))
  g.add(box(0.38, 0.43, 0.04, 0.76, 0.07, 0.6, cush))
  g.add(box(-0.38, 0.68, -0.2, 0.7, 0.32, 0.1, cush))
  g.add(box(0.38, 0.68, -0.2, 0.7, 0.32, 0.1, cush))
  return g
}

function buildChair(color) {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  const legMat = new THREE.MeshStandardMaterial({ color: 0xa08060, roughness: 0.4 })
  g.add(box(0, 0.38, 0, 0.55, 0.09, 0.5, mat))
  g.add(box(0, 0.68, -0.2, 0.5, 0.5, 0.09, mat))
  g.add(box(-0.25, 0.5, 0, 0.05, 0.18, 0.4, mat))
  g.add(box(0.25, 0.5, 0, 0.05, 0.18, 0.4, mat))
  for (const lx of [-0.22, 0.22]) {
    for (const lz of [-0.18, 0.18]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.32, 8), legMat)
      leg.position.set(lx, 0.15, lz)
      g.add(leg)
    }
  }
  return g
}

function buildTable() {
  const g = new THREE.Group()
  const topMat = new THREE.MeshStandardMaterial({ color: 0xa08060, roughness: 0.35, metalness: 0.05 })
  const legMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.6 })
  g.add(box(0, 0.42, 0, 0.9, 0.04, 0.5, topMat))
  for (const lx of [-0.38, 0.38]) {
    for (const lz of [-0.18, 0.18]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.38, 6), legMat)
      leg.position.set(lx, 0.2, lz)
      g.add(leg)
    }
  }
  return g
}

function buildLamp() {
  const g = new THREE.Group()
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.3, metalness: 0.5 })
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.8, side: THREE.DoubleSide })
  g.add(box(0, 0.02, 0, 0.22, 0.03, 0.22, poleMat))
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.018, 1.4, 8), poleMat)
  pole.position.y = 0.72
  g.add(pole)
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.22, 16, 1, true), shadeMat)
  shade.position.y = 1.5
  g.add(shade)
  const light = new THREE.PointLight(0xfff5d0, 0.35, 3.5)
  light.position.y = 1.4
  g.add(light)
  return g
}

function buildPlant() {
  const g = new THREE.Group()
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa08060, roughness: 0.6 })
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d8a4e, roughness: 0.7 })
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.2, 12), potMat)
  pot.position.y = 0.1
  g.add(pot)
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.05, 8, 8), leafMat)
    const a = (i / 6) * Math.PI * 2
    leaf.position.set(Math.cos(a) * 0.07, 0.28 + Math.random() * 0.12, Math.sin(a) * 0.07)
    g.add(leaf)
  }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), leafMat)
  top.position.y = 0.42
  g.add(top)
  return g
}

function buildArt(color) {
  const g = new THREE.Group()
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.4, metalness: 0.1 })
  const canvasMat = new THREE.MeshStandardMaterial({ color: color || 0xec4899, roughness: 0.5 })
  g.add(box(0, 0, 0, 0.52, 0.42, 0.025, frameMat))
  g.add(box(0, 0, 0.014, 0.46, 0.36, 0.01, canvasMat))
  return g
}

function buildFurniture(category, color) {
  const c = color || FURNITURE_COLORS[category] || 0x888888
  switch (category) {
    case 'sofas': return buildSofa(c)
    case 'chairs': return buildChair(c)
    case 'tables': return buildTable()
    case 'lamps': return buildLamp()
    case 'plants': return buildPlant()
    case 'art': return buildArt(c)
    default: return buildTable()
  }
}

// ── Slot positions in 3D space (room-relative) ──
// These map the 2D slot percentages to 3D coordinates
function slotTo3D(slot, roomW, roomD, roomH) {
  const px = (parseFloat(slot.x) / 100)
  const py = (parseFloat(slot.y) / 100)
  if (slot.zone === 'wall') {
    // Wall items: map x across back wall, y up the wall
    const x3d = (px - 0.5) * roomW * 0.8
    const y3d = roomH - (py / 100 * roomH) - 0.2
    // Clamp y to reasonable wall height
    const yFinal = Math.max(1.2, Math.min(roomH - 0.3, roomH * (1 - py * 0.01) - 0.5 + 1))
    return { x: x3d, y: 1.4 + (1 - py) * 1.2, z: -roomD / 2 + 0.04 }
  }
  // Floor items: map across floor
  const x3d = (px - 0.5) * roomW * 0.85
  const z3d = (py - 0.5) * roomD * 0.7
  return { x: x3d, y: 0, z: z3d }
}

// ── Main component ──
export default function ThreeDRoom({
  roomType = 'living_room',
  wallpaperId = 'white',
  floorId = 'oak',
  rugId = 'none',
  filledSlots = {},
  slots = [],
  activeSlot = null,
  onSlotClick,
}) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const animFrameRef = useRef(null)
  const furnitureGroupRef = useRef(new THREE.Group())
  const wallMeshesRef = useRef([])
  const floorMeshRef = useRef(null)
  const rugMeshRef = useRef(null)
  const slotMarkersRef = useRef([])
  const fireLightRef = useRef(null)

  const hasFireplace = roomType === 'living_room'
  const windowCount = ['living_room', 'bedroom', 'dining_room', 'studio'].includes(roomType) ? 2 : 1

  // Room dimensions
  const W = 6, H = 3, D = 5

  // Initialize scene once
  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0x87CEEB, 18, 35)
    sceneRef.current = scene

    const w = containerRef.current.clientWidth
    const h = containerRef.current.clientHeight || 400

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
    camera.position.set(0, 2.5, 7)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 3
    controls.maxDistance = 12
    controls.maxPolarAngle = Math.PI * 0.52
    controls.target.set(0, 1.2, 0)
    controlsRef.current = controls

    // ── Static geometry ──
    // Ceiling
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = H
    scene.add(ceiling)

    // Walls (will be colored by wallpaper effect)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f0eb, roughness: 0.85 })
    const sideWallMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d8, roughness: 0.85 })

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat.clone())
    backWall.position.set(0, H / 2, -D / 2)
    backWall.receiveShadow = true
    scene.add(backWall)

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), sideWallMat.clone())
    leftWall.rotation.y = Math.PI / 2
    leftWall.position.set(-W / 2, H / 2, 0)
    leftWall.receiveShadow = true
    scene.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), sideWallMat.clone())
    rightWall.rotation.y = -Math.PI / 2
    rightWall.position.set(W / 2, H / 2, 0)
    rightWall.receiveShadow = true
    scene.add(rightWall)

    wallMeshesRef.current = [backWall, leftWall, rightWall]

    // Baseboards + crown molding
    const moldMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.5, metalness: 0.05 })
    const addMold = (x, y, z, ry, len, h2) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, h2, 0.03), moldMat)
      m.position.set(x, y, z)
      m.rotation.y = ry
      scene.add(m)
    }
    // Base
    addMold(0, 0.06, -D/2+0.015, 0, W, 0.12)
    addMold(-W/2+0.015, 0.06, 0, Math.PI/2, D, 0.12)
    addMold(W/2-0.015, 0.06, 0, Math.PI/2, D, 0.12)
    // Crown
    addMold(0, H-0.04, -D/2+0.02, 0, W, 0.08)
    addMold(-W/2+0.02, H-0.04, 0, Math.PI/2, D, 0.08)
    addMold(W/2-0.02, H-0.04, 0, Math.PI/2, D, 0.08)

    // Floor (will be recolored)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4a86a, roughness: 0.35, metalness: 0.05 })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)
    floorMeshRef.current = floor

    // Windows
    const createWindowMesh = (x) => {
      const wg = new THREE.Group()
      wg.position.set(x, 1.6, -D / 2 + 0.01)
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe4, roughness: 0.4, metalness: 0.1 })
      const glassMat = new THREE.MeshStandardMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2 })
      const ww = 1.1, wh = 1.3, ft = 0.05
      wg.add(box(0, wh/2, 0, ww+ft*2, ft, 0.07, frameMat))
      wg.add(box(0, -wh/2, 0, ww+ft*2, ft, 0.07, frameMat))
      wg.add(box(-ww/2, 0, 0, ft, wh, 0.07, frameMat))
      wg.add(box(ww/2, 0, 0, ft, wh, 0.07, frameMat))
      wg.add(box(0, 0, 0, 0.025, wh, 0.04, frameMat))
      wg.add(box(0, 0, 0, ww, 0.025, 0.04, frameMat))
      wg.add(box(0, 0, -0.01, ww, wh, 0.008, glassMat))
      const sillMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d4, roughness: 0.5 })
      wg.add(box(0, -wh/2-0.035, 0.06, ww+0.1, 0.04, 0.13, sillMat))
      const wl = new THREE.PointLight(0xfff5e0, 0.35, 4.5)
      wl.position.set(0, 0, 0.3)
      wg.add(wl)
      scene.add(wg)
    }
    if (windowCount >= 1) createWindowMesh(-1.4)
    if (windowCount >= 2) createWindowMesh(1.4)

    // Fireplace
    if (hasFireplace) {
      const fpG = new THREE.Group()
      fpG.position.set(W / 2 - 0.02, 0, -0.5)
      fpG.rotation.y = -Math.PI / 2
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe0d8cc, roughness: 0.7 })
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 })
      const mantelMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.4, metalness: 0.05 })
      fpG.add(box(0, 0.7, 0, 1.15, 1.4, 0.18, stoneMat))
      fpG.add(box(0, 1.42, 0.02, 1.3, 0.07, 0.26, mantelMat))
      fpG.add(box(0, 0.5, 0.04, 0.65, 0.75, 0.14, darkMat))
      const fl = new THREE.PointLight(0xff6b35, 0.5, 3)
      fl.position.set(0, 0.4, 0.2)
      fpG.add(fl)
      fireLightRef.current = fl
      const emberMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 2 })
      for (let i = 0; i < 5; i++) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.035 + Math.random() * 0.025, 8, 8), emberMat)
        e.position.set((Math.random()-0.5)*0.35, 0.18+Math.random()*0.12, 0.07)
        fpG.add(e)
      }
      const logMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 })
      const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 8), logMat)
      l1.position.set(0, 0.2, 0.07); l1.rotation.z = Math.PI/2
      fpG.add(l1)
      scene.add(fpG)
    }

    // Furniture group
    scene.add(furnitureGroupRef.current)

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 0.8)
    sunLight.position.set(0, 4, -3)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 15
    sunLight.shadow.camera.left = -5
    sunLight.shadow.camera.right = 5
    sunLight.shadow.camera.top = 5
    sunLight.shadow.camera.bottom = -1
    scene.add(sunLight)
    scene.add(new THREE.AmbientLight(0xb0c4de, 0.4))
    scene.add(new THREE.HemisphereLight(0x87CEEB, 0x8b7355, 0.3))

    // Animate
    let time = 0
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      time += 0.016
      if (fireLightRef.current) {
        fireLightRef.current.intensity = 0.45 + Math.sin(time * 5) * 0.15 + Math.sin(time * 8.3) * 0.1
      }
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return
      const nw = containerRef.current.clientWidth
      const nh = containerRef.current.clientHeight || 400
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animFrameRef.current)
      renderer.dispose()
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [roomType])

  // ── Update wall color when wallpaper changes ──
  useEffect(() => {
    const walls = wallMeshesRef.current
    if (!walls.length) return
    const color = WALL_COLORS[wallpaperId] || 0xf5f0eb
    const sideColor = new THREE.Color(color).offsetHSL(0, 0, -0.04).getHex()
    walls[0].material.color.setHex(color)
    walls[1].material.color.setHex(sideColor)
    walls[2].material.color.setHex(sideColor)
  }, [wallpaperId])

  // ── Update floor color ──
  useEffect(() => {
    if (!floorMeshRef.current) return
    const fc = FLOOR_COLORS[floorId] || FLOOR_COLORS.oak
    floorMeshRef.current.material.color.setHex(fc.main)
  }, [floorId])

  // ── Update rug ──
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    // Remove old rug
    if (rugMeshRef.current) {
      scene.remove(rugMeshRef.current)
      rugMeshRef.current = null
    }
    if (rugId === 'none') return
    const rc = RUG_COLORS[rugId]
    if (!rc) return

    // Create rug texture
    const c = document.createElement('canvas')
    c.width = 256; c.height = 256
    const ctx = c.getContext('2d')
    const mainHex = '#' + new THREE.Color(rc.main).getHexString()
    const borderHex = '#' + new THREE.Color(rc.border).getHexString()
    ctx.fillStyle = mainHex
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = borderHex
    ctx.lineWidth = 10
    ctx.strokeRect(8, 8, 240, 240)
    ctx.lineWidth = 3
    ctx.strokeRect(20, 20, 216, 216)
    ctx.beginPath()
    ctx.ellipse(128, 128, 45, 55, 0, 0, Math.PI * 2)
    ctx.lineWidth = 2
    ctx.stroke()

    const tex = new THREE.CanvasTexture(c)
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.2),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
    )
    rug.rotation.x = -Math.PI / 2
    rug.position.set(-0.2, 0.005, 0.4)
    rug.receiveShadow = true
    scene.add(rug)
    rugMeshRef.current = rug
  }, [rugId])

  // ── Update furniture when slots change ──
  useEffect(() => {
    const group = furnitureGroupRef.current
    // Clear existing furniture
    while (group.children.length) {
      group.remove(group.children[0])
    }
    // Clear slot markers
    const scene = sceneRef.current
    slotMarkersRef.current.forEach(m => scene?.remove(m))
    slotMarkersRef.current = []

    if (!scene) return

    // Add filled furniture
    for (const slot of slots) {
      const item = filledSlots[slot.id]
      const pos = slotTo3D(slot, W, D, H)

      if (item) {
        const mesh = buildFurniture(item.category)
        mesh.position.set(pos.x, pos.y, pos.z)
        if (slot.zone === 'wall') {
          // Wall items face outward
          mesh.position.y = pos.y
        }
        group.add(mesh)
      } else {
        // Empty slot marker (glowing ring)
        const markerGeo = new THREE.RingGeometry(0.15, 0.2, 24)
        const markerMat = new THREE.MeshStandardMaterial({
          color: activeSlot === slot.id ? 0x4F46E5 : 0x888888,
          emissive: activeSlot === slot.id ? 0x4F46E5 : 0x444444,
          emissiveIntensity: activeSlot === slot.id ? 1.5 : 0.3,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        })
        const marker = new THREE.Mesh(markerGeo, markerMat)
        if (slot.zone === 'floor') {
          marker.rotation.x = -Math.PI / 2
          marker.position.set(pos.x, 0.01, pos.z)
        } else {
          marker.position.set(pos.x, pos.y, pos.z)
        }
        scene.add(marker)
        slotMarkersRef.current.push(marker)
      }
    }
  }, [filledSlots, slots, activeSlot])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden shadow-2xl"
      style={{ height: '320px', touchAction: 'none' }}
    />
  )
}
