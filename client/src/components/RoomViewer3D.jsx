import React, { useRef, useEffect, useState, useCallback } from 'react'
import { RotateCcw, Sun, Moon, Eye, Maximize2, Camera, Home, Scissors, Layers, User } from 'lucide-react'
import { createPBRMaterial, clearMaterialCache } from '../utils/TextureManager'
import { loadFurnitureModel, initializeLoaders as initModelLoaders, preloadModels, clearModelCache } from '../utils/ModelLoader'
import {
  buildSeating as buildSeatingHD,
  buildTable as buildTableHD,
  buildBed as buildBedHD,
  buildBookshelf as buildBookshelfHD,
  buildTVConsole as buildTVConsoleHD,
  buildPlant as buildPlantHD,
  buildRug as buildRugHD,
  buildBathtub as buildBathtubHD,
  buildShower as buildShowerHD,
  buildFireplace as buildFireplaceHD,
  buildLamp as buildLampHD,
  buildGenericBox as buildGenericBoxHD,
} from '../utils/FurnitureBuilders'
import { addScaleFigures } from '../utils/HumanFigure'
import { clearTextureCache as clearProceduralTextures } from '../utils/ProceduralTextures'
import { loadPointCloud, removePointCloud, updatePointCloudSettings, getPointCloudBounds } from '../utils/PointCloudOverlay'
import { spacePlanToRenderer, mergeSpacePlanIntoFloorPlan } from '../utils/SpacePlanAdapter'
import TearSheet3D, { setupTearSheetRaycaster } from './TearSheet3D'
import SceneManager from './SceneManager'
import SectionPlane from './SectionPlane'

// ── Three.js CDN loader ──────────────────────────────────────────────────
let THREE = null
let OrbitControlsClass = null
const THREEJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'

function loadThreeJS() {
  return new Promise((resolve, reject) => {
    if (THREE) return resolve(THREE)
    if (window.THREE) { THREE = window.THREE; return resolve(THREE) }
    const script = document.createElement('script')
    script.src = THREEJS_CDN
    script.onload = () => { THREE = window.THREE; resolve(THREE) }
    script.onerror = () => reject(new Error('Failed to load Three.js'))
    document.head.appendChild(script)
  })
}

// Simple inline OrbitControls (minimal version for r128)
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
    minDistance: 2,
    maxDistance: 80,
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
      // Left button: rotate
      state.sphericalDelta.theta -= dx * state.rotateSpeed * 0.01
      state.sphericalDelta.phi -= dy * state.rotateSpeed * 0.01
    } else if (state.button === 2 || state.button === 1) {
      // Right/middle button: pan
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
    if (e.deltaY > 0) state.scale *= (1 + state.zoomSpeed * 0.05)
    else state.scale /= (1 + state.zoomSpeed * 0.05)
  }

  function onContextMenu(e) { e.preventDefault() }

  domElement.addEventListener('mousedown', onMouseDown)
  domElement.addEventListener('mousemove', onMouseMove)
  domElement.addEventListener('mouseup', onMouseUp)
  domElement.addEventListener('mouseleave', onMouseUp)
  domElement.addEventListener('wheel', onWheel, { passive: false })
  domElement.addEventListener('contextmenu', onContextMenu)

  return {
    update,
    target: state.target,
    dispose() {
      domElement.removeEventListener('mousedown', onMouseDown)
      domElement.removeEventListener('mousemove', onMouseMove)
      domElement.removeEventListener('mouseup', onMouseUp)
      domElement.removeEventListener('mouseleave', onMouseUp)
      domElement.removeEventListener('wheel', onWheel)
      domElement.removeEventListener('contextmenu', onContextMenu)
    },
    reset(pos, target) {
      camera.position.copy(pos)
      state.target.copy(target)
      offset.copy(pos).sub(target)
      state.spherical.setFromVector3(offset)
      state.sphericalDelta.set(0, 0, 0)
      state.panOffset.set(0, 0, 0)
    }
  }
}

// ── Scale: convert floor plan pixels to 3D world units ───────────────────
const GRID_SIZE = 20
const PX_TO_WORLD = 0.05 // 20px grid = 1 world unit ≈ 1 foot

// Helper: resolve pixel width/height from furniture item
// Supports both formats: { w, h } in grid units OR { width, height } in pixels
const fPxW = (f) => f.w != null ? f.w * GRID_SIZE : (f.width || 40)
const fPxH = (f) => f.h != null ? f.h * GRID_SIZE : (f.height || 40)

// Helper: normalize furniture type to kebab-case (e.g. 'coffeeTable' → 'coffee-table')
const normalizeType = (type) => type ? type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : ''

// ── Material presets ─────────────────────────────────────────────────────
const MATERIALS = {
  wall:      { color: 0xf5f0eb, roughness: 0.9, side: 'double' },
  wallEdge:  { color: 0xd4cfc8, roughness: 0.7 },
  floor:     { color: 0xc8a882, roughness: 0.6 },   // warm wood
  floorAlt:  { color: 0xb89b78, roughness: 0.6 },   // alternating plank
  ceiling:   { color: 0xfaf8f5, roughness: 1.0 },
  door:      { color: 0x8b7355, roughness: 0.5 },
  doorFrame: { color: 0xf0ebe3, roughness: 0.6 },
  glass:     { color: 0x88ccff, opacity: 0.25, transparent: true },
  windowFrame: { color: 0xf0ebe3, roughness: 0.6 },
  baseboard: { color: 0xf0ebe3, roughness: 0.5 },
}

// ── Furniture 3D configs ─────────────────────────────────────────────────
// Helper: convert CSS hex color to Three.js integer
function hexToInt(hex) {
  if (typeof hex === 'number') return hex
  return parseInt(hex.replace('#', ''), 16)
}

const FURNITURE_3D = {
  // ── Seating ───────────────────────────────────────────────
  sofa:          { height: 0.85, seatH: 0.45, color: 0x6366f1, backRatio: 0.3, hasArms: true, armW: 0.15 },
  'sofa-3seat':  { height: 0.85, seatH: 0.45, color: 0x6366f1, backRatio: 0.3, hasArms: true, armW: 0.15 },
  'sectional-l': { height: 0.85, seatH: 0.45, color: 0x6366f1, backRatio: 0.3, hasArms: true, armW: 0.15 },
  armchair:      { height: 0.85, seatH: 0.45, color: 0x6366f1, backRatio: 0.3, hasArms: true, armW: 0.2 },
  'accent-chair': { height: 0.80, seatH: 0.42, color: 0x6B8E6B, backRatio: 0.3, hasArms: false, armW: 0 },
  recliner:      { height: 0.95, seatH: 0.45, color: 0x9A4A2E, backRatio: 0.35, hasArms: true, armW: 0.2 },
  loveseat:      { height: 0.85, seatH: 0.45, color: 0x6366f1, backRatio: 0.3, hasArms: true, armW: 0.15 },
  bench:         { height: 0.45, seatH: 0.45, color: 0xC4A35A, backRatio: 0, hasArms: false, armW: 0 },
  ottoman:       { height: 0.42, seatH: 0.42, color: 0x6366f1, backRatio: 0, hasArms: false, armW: 0 },
  'bar-stool':   { height: 0.75, seatH: 0.75, color: 0x2C2C2C, backRatio: 0.15, hasArms: false, armW: 0 },
  'office-chair': { height: 0.95, seatH: 0.48, color: 0x2C2C2C, backRatio: 0.35, hasArms: true, armW: 0.08 },

  // ── Tables ────────────────────────────────────────────────
  'dining-table': { height: 0.76, legInset: 0.08, color: 0x92400e, topThick: 0.04 },
  'round-table':  { height: 0.76, legInset: 0.08, color: 0x92400e, topThick: 0.04 },
  desk:          { height: 0.74, legInset: 0.06, color: 0x92400e, topThick: 0.03 },
  'l-desk':      { height: 0.74, legInset: 0.06, color: 0x5C4033, topThick: 0.03 },
  'coffee-table': { height: 0.42, legInset: 0.06, color: 0x92400e, topThick: 0.04 },
  'side-table':  { height: 0.55, legInset: 0.05, color: 0xC4A35A, topThick: 0.03 },
  'console-table': { height: 0.76, legInset: 0.04, color: 0x5C4033, topThick: 0.03 },
  'bar-table':   { height: 1.05, legInset: 0.06, color: 0xE8E4DE, topThick: 0.05 },
  'patio-table': { height: 0.74, legInset: 0.08, color: 0xC4A35A, topThick: 0.04 },
  island:        { height: 0.92, color: 0x92400e, topColor: 0xe8e0d0 },

  // ── Bedroom ───────────────────────────────────────────────
  'bed-king':    { height: 0.55, headH: 1.1, color: 0xf5f0eb, frameColor: 0x7c3aed, mattressColor: 0xf5f0eb },
  'bed-queen':   { height: 0.55, headH: 1.1, color: 0xf5f0eb, frameColor: 0x7c3aed, mattressColor: 0xf5f0eb },
  'bed-twin':    { height: 0.55, headH: 1.0, color: 0xf5f0eb, frameColor: 0x7c3aed, mattressColor: 0xf5f0eb },
  'bunk-bed':    { height: 0.55, headH: 1.8, color: 0xC4A35A, frameColor: 0xC4A35A, mattressColor: 0xf5f0eb },
  nightstand:    { height: 0.6, color: 0x92400e, hasDrawer: true },
  dresser:       { height: 0.85, color: 0x92400e, hasDrawer: true, drawers: 3 },
  wardrobe:      { height: 2.0, color: 0x5C4033, shelves: 0 },
  vanity:        { height: 0.76, legInset: 0.06, color: 0xE8D5B7, topThick: 0.03 },

  // ── Storage ───────────────────────────────────────────────
  bookshelf:     { height: 1.8, color: 0x78716c, shelves: 4 },
  'bookshelf-tall': { height: 2.2, color: 0x5C4033, shelves: 5 },
  cabinet:       { height: 1.0, color: 0x78716c },
  sideboard:     { height: 0.8, color: 0xC4A35A },
  'shelving-unit': { height: 1.8, color: 0x2C2C2C, shelves: 4 },
  'filing-cabinet': { height: 0.7, color: 0x808080 },

  // ── Media & Office ────────────────────────────────────────
  'tv-console':  { height: 0.5, color: 0x334155, hasTV: true },
  'tv-wall-mount': { height: 0.04, color: 0x1C1C1C },
  speaker:       { height: 0.9, color: 0x2C2C2C },
  'monitor-stand': { height: 0.45, color: 0x1C1C1C },

  // ── Bathroom ──────────────────────────────────────────────
  bathtub:       { height: 0.55, color: 0xffffff, innerColor: 0xe8f4f8 },
  'freestand-tub': { height: 0.55, color: 0xffffff, innerColor: 0xe8f4f8 },
  toilet:        { height: 0.4, color: 0xffffff },
  sink:          { height: 0.85, color: 0xffffff },
  'double-vanity': { height: 0.85, color: 0xE8E4DE },
  shower:        { height: 2.1, color: 0xe8f4f8, glassColor: 0x88ccff },

  // ── Kitchen ───────────────────────────────────────────────
  stove:         { height: 0.9, color: 0x475569 },
  fridge:        { height: 1.8, color: 0x94a3b8 },
  'fridge-french': { height: 1.8, color: 0xC0C0C0 },
  dishwasher:    { height: 0.85, color: 0x94a3b8 },
  'kitchen-sink': { height: 0.85, color: 0xC0C0C0 },
  microwave:     { height: 0.35, color: 0x475569 },
  'pantry-shelf': { height: 1.8, color: 0xE8D5B7, shelves: 4 },

  // ── Decor ─────────────────────────────────────────────────
  plant:         { height: 0.8, potColor: 0x92400e, leafColor: 0x16a34a },
  'plant-large': { height: 1.4, potColor: 0x5C4033, leafColor: 0x15803d },
  rug:           { height: 0.01, color: 0xc8a070 },
  'rug-round':   { height: 0.01, color: 0xB5A642 },
  'floor-lamp':  { height: 1.6, color: 0xCFB53B },
  'table-lamp':  { height: 0.4, color: 0xCFB53B },
  'mirror-floor': { height: 1.7, color: 0xC0C0C0 },
  fireplace:     { height: 1.2, color: 0x6B7B8D },

  // ── Outdoor ───────────────────────────────────────────────
  'patio-chair': { height: 0.80, seatH: 0.42, color: 0xE8D5B7, backRatio: 0.3, hasArms: true, armW: 0.12 },
  'lounge-chair': { height: 0.40, seatH: 0.35, color: 0xF5F0E8, backRatio: 0.25, hasArms: true, armW: 0.1 },
  grill:         { height: 0.9, color: 0x2C2C2C },
  planter:       { height: 0.5, potColor: 0x78716c, leafColor: 0x16a34a },
  umbrella:      { height: 2.3, color: 0xdc2626 },
}

const WALL_HEIGHT = 2.7 // meters / world units
const WALL_THICKNESS = 0.15

// ── Component ────────────────────────────────────────────────────────────

// Material lookup maps (match FloorPlanEditor material IDs)
const FLOOR_MAT_MAP = {
  'hardwood-oak':    { color: 0xC4A35A, roughness: 0.7, pattern: 'wood' },
  'hardwood-walnut': { color: 0x5C4033, roughness: 0.65, pattern: 'wood' },
  'hardwood-cherry': { color: 0x92400e, roughness: 0.7, pattern: 'wood' },
  'tile-white':      { color: 0xF0EDEA, roughness: 0.3, pattern: 'tile' },
  'tile-marble':     { color: 0xE8E4DE, roughness: 0.2, pattern: 'tile' },
  'tile-slate':      { color: 0x6B7B8D, roughness: 0.8, pattern: 'tile' },
  'carpet-beige':    { color: 0xD4C5A9, roughness: 1.0, pattern: 'carpet' },
  'carpet-gray':     { color: 0x9CA3AF, roughness: 1.0, pattern: 'carpet' },
  'concrete':        { color: 0xB0B0B0, roughness: 0.4, pattern: 'concrete' },
  'bamboo':          { color: 0xD4A76A, roughness: 0.6, pattern: 'wood' },
  'vinyl-plank':     { color: 0xA89279, roughness: 0.5, pattern: 'wood' },
  'terracotta':      { color: 0xC67B5C, roughness: 0.85, pattern: 'tile' },
}

const WALL_MAT_MAP = {
  'paint-white':     { color: 0xF5F5F5, roughness: 0.9 },
  'paint-warm':      { color: 0xFAF0E6, roughness: 0.9 },
  'paint-gray':      { color: 0xD1D5DB, roughness: 0.9 },
  'paint-sage':      { color: 0xA8C4A0, roughness: 0.9 },
  'paint-navy':      { color: 0x1E3A5F, roughness: 0.9 },
  'paint-charcoal':  { color: 0x374151, roughness: 0.9 },
  'brick':           { color: 0x8B4513, roughness: 0.95 },
  'stone':           { color: 0x9CA3AF, roughness: 0.85 },
  'shiplap':         { color: 0xF0EDE5, roughness: 0.8 },
  'wallpaper-stripe': { color: 0xE8D5C4, roughness: 0.7 },
  'concrete-raw':    { color: 0x9CA3AF, roughness: 0.6 },
  'wood-panel':      { color: 0x8B6914, roughness: 0.75 },
}

const CEILING_MAT_MAP = {
  'flat-white':    { color: 0xFFFFFF, roughness: 0.95 },
  'eggshell':      { color: 0xFAF8F5, roughness: 0.85 },
  'exposed-beam':  { color: 0x8B6914, roughness: 0.7 },
  'coffered':      { color: 0xF5F0E8, roughness: 0.8 },
}

export default function RoomViewer3D({ walls = [], doors = [], windows = [], furniture = [], dimensions = { width: 800, height: 600 }, roomMaterials = {}, onClose, pointCloud = null, spacePlan = null }) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const animFrameRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState('day') // day, evening, night
  const [viewMode, setViewMode] = useState('perspective') // perspective, top, front
  const [showSectionPlane, setShowSectionPlane] = useState(false)
  const [scenes, setScenes] = useState([
    { id: 'perspective', name: 'Perspective', isDefault: true },
    { id: 'top', name: 'Top', isDefault: true },
    { id: 'front', name: 'Front', isDefault: true },
    { id: 'corner', name: 'Corner', isDefault: true },
  ])
  const [activeScene, setActiveScene] = useState('perspective')
  const [showScaleFigures, setShowScaleFigures] = useState(true)
  const [selectedFurniture, setSelectedFurniture] = useState(null)
  const [tearSheetItem, setTearSheetItem] = useState(null)
  const furnitureGroupsRef = useRef([])
  const tearSheetCleanupRef = useRef(null)

  // ── Point Cloud overlay state ──
  const [pointCloudVisible, setPointCloudVisible] = useState(true)
  const [pointCloudOpacity, setPointCloudOpacity] = useState(0.75)
  const [pointCloudSize, setPointCloudSize] = useState(2.0)
  const pointCloudGroupRef = useRef(null)

  // ── Merge SpacePlan data into effective render props ──
  // When a spacePlan prop is provided, convert it and merge with explicit walls/furniture
  const effectiveProps = React.useMemo(() => {
    const base = { walls, doors, windows, furniture, dimensions }
    if (!spacePlan) return base
    return mergeSpacePlanIntoFloorPlan(base, spacePlan)
  }, [walls, doors, windows, furniture, dimensions, spacePlan])

  // Use effective (merged) props for rendering
  const eWalls = effectiveProps.walls
  const eDoors = effectiveProps.doors
  const eWindows = effectiveProps.windows
  const eFurniture = effectiveProps.furniture
  const eDimensions = effectiveProps.dimensions

  // ── Build scene from floor plan data ─────────────────────────────────
  const buildScene = useCallback(() => {
    if (!THREE || !sceneRef.current) return
    const scene = sceneRef.current

    // Use effective (merged) props for rendering — supports both raw floor plan data
    // and SpacePlan data model via the adapter
    const walls = eWalls
    const doors = eDoors
    const windows = eWindows
    const furniture = eFurniture
    const dimensions = eDimensions

    // Clear existing meshes
    while (scene.children.length > 0) scene.remove(scene.children[0])

    // ── Photorealistic Lighting Setup ──────────────────────────────────
    const ambientIntensity = timeOfDay === 'day' ? 0.45 : timeOfDay === 'evening' ? 0.25 : 0.1
    const dirIntensity = timeOfDay === 'day' ? 1.0 : timeOfDay === 'evening' ? 0.6 : 0.12
    const dirColor = timeOfDay === 'day' ? 0xfff5e6 : timeOfDay === 'evening' ? 0xffaa55 : 0x223355

    // Soft ambient fill (lower than before — let directional create contrast)
    const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity)
    scene.add(ambient)

    // Key light (main sun/overhead) — higher quality shadows
    const dirLight = new THREE.DirectionalLight(dirColor, dirIntensity)
    dirLight.position.set(12, 18, 8)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 4096
    dirLight.shadow.mapSize.height = 4096
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 120
    dirLight.shadow.camera.left = -35
    dirLight.shadow.camera.right = 35
    dirLight.shadow.camera.top = 35
    dirLight.shadow.camera.bottom = -35
    dirLight.shadow.bias = -0.0005
    dirLight.shadow.normalBias = 0.02
    dirLight.shadow.radius = 3 // Soft shadow edges (PCFSoft)
    scene.add(dirLight)

    // Fill light from opposite side (cooler tone for contrast)
    const fillLight = new THREE.DirectionalLight(0x8899cc, dirIntensity * 0.35)
    fillLight.position.set(-10, 12, -6)
    scene.add(fillLight)

    // Rim/back light (subtle edge definition)
    const rimLight = new THREE.DirectionalLight(0xaabbdd, dirIntensity * 0.15)
    rimLight.position.set(-5, 8, 15)
    scene.add(rimLight)

    // Hemisphere light for natural sky/ground bounce
    const hemiLight = new THREE.HemisphereLight(
      timeOfDay === 'night' ? 0x0a1628 : timeOfDay === 'evening' ? 0xddaa66 : 0x87ceeb,
      timeOfDay === 'night' ? 0x0a0a0a : 0x3d2b1f,
      timeOfDay === 'day' ? 0.35 : 0.18
    )
    scene.add(hemiLight)

    // Evening/night: add warm point lights (simulating interior lamps)
    if (timeOfDay !== 'day') {
      const roomCenterX = (dimensions.width * PX_TO_WORLD) / 2
      const roomCenterZ = (dimensions.height * PX_TO_WORLD) / 2
      const pointLight = new THREE.PointLight(0xffaa55, timeOfDay === 'evening' ? 1.0 : 0.7, 20)
      pointLight.position.set(roomCenterX, 2.2, roomCenterZ)
      pointLight.castShadow = true
      scene.add(pointLight)

      // Add a second warm light
      const pointLight2 = new THREE.PointLight(0xffcc88, 0.4, 15)
      pointLight2.position.set(roomCenterX * 0.3, 2.0, roomCenterZ * 0.7)
      scene.add(pointLight2)
    }

    // ── Resolve room materials (PBR with procedural textures) ────────
    const floorMatId = roomMaterials.floor || 'hardwood-oak'
    const wallMatId = roomMaterials.walls || 'paint-white'
    const ceilingMatDef = CEILING_MAT_MAP[roomMaterials.ceiling] || CEILING_MAT_MAP['flat-white']

    // Create PBR materials with procedural textures
    let floorPBR, wallPBR
    try {
      floorPBR = createPBRMaterial(THREE, floorMatId)
      wallPBR = createPBRMaterial(THREE, wallMatId)
    } catch (e) {
      // Fallback to basic materials if PBR generation fails
      const floorMatDef = FLOOR_MAT_MAP[floorMatId] || FLOOR_MAT_MAP['hardwood-oak']
      const wallMatDef = WALL_MAT_MAP[wallMatId] || WALL_MAT_MAP['paint-white']
      floorPBR = new THREE.MeshStandardMaterial({ color: floorMatDef.color, roughness: floorMatDef.roughness, metalness: 0.02 })
      wallPBR = new THREE.MeshStandardMaterial({ color: wallMatDef.color, roughness: wallMatDef.roughness, metalness: 0.02, side: THREE.DoubleSide })
    }

    // ── Floor (single plane with PBR texture) ──────────────────────
    const floorW = dimensions.width * PX_TO_WORLD
    const floorD = dimensions.height * PX_TO_WORLD

    const floorGeom = new THREE.BoxGeometry(floorW, 0.02, floorD)
    const floorMesh = new THREE.Mesh(floorGeom, floorPBR)
    floorMesh.position.set(floorW / 2, -0.01, floorD / 2)
    floorMesh.receiveShadow = true
    scene.add(floorMesh)

    // ── Ceiling ──────────────────────────────────────────────────────
    const ceilingGeom = new THREE.PlaneGeometry(floorW + 0.5, floorD + 0.5)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: ceilingMatDef.color,
      roughness: ceilingMatDef.roughness,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    })
    const ceiling = new THREE.Mesh(ceilingGeom, ceilingMat)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.set(floorW / 2, WALL_HEIGHT, floorD / 2)
    scene.add(ceiling)

    // Exposed beams on ceiling
    if (roomMaterials.ceiling === 'exposed-beam') {
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.8, metalness: 0 })
      const beamCount = Math.floor(floorD / 2)
      for (let i = 1; i <= beamCount; i++) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(floorW, 0.15, 0.12), beamMat)
        beam.position.set(floorW / 2, WALL_HEIGHT - 0.08, i * 2)
        beam.castShadow = true
        scene.add(beam)
      }
    }

    // ── Walls (using PBR material) ─────────────────────────────────
    wallPBR.side = THREE.DoubleSide
    const wallMat = wallPBR

    walls.forEach(wall => {
      const x1 = wall.x1 * PX_TO_WORLD
      const z1 = wall.y1 * PX_TO_WORLD
      const x2 = wall.x2 * PX_TO_WORLD
      const z2 = wall.y2 * PX_TO_WORLD

      // Determine wall thickness and height based on wall type
      const wType = wall.wallType || 'exterior'
      const wThickPx = wall.thickness || (wType === 'interior' ? 5 : wType === 'partition' ? 4 : wType === 'load' ? 9 : 8)
      const wThick3D = wThickPx * 0.02
      const isPartition = wType === 'partition'
      const wHeight = isPartition ? WALL_HEIGHT * 0.45 : WALL_HEIGHT
      const isLoad = wType === 'load'

      // Wall material — load-bearing gets a tinted color
      const thisWallMat = wallMat.clone()
      if (isLoad) {
        thisWallMat.color = new THREE.Color(0xD4C5B0)
      }

      // ── Curved wall: build from arc segments ──────────────────
      if (wall.curve) {
        const c = wall.curve
        const cx = c.cx * PX_TO_WORLD
        const cz = c.cy * PX_TO_WORLD
        const r = c.radius * PX_TO_WORLD
        const startA = c.startAngle
        const endA = c.endAngle
        const segments = Math.max(8, Math.ceil(Math.abs(endA - startA) / (Math.PI / 16)))
        const bbMat = new THREE.MeshStandardMaterial({ color: MATERIALS.baseboard.color, roughness: MATERIALS.baseboard.roughness })

        for (let i = 0; i < segments; i++) {
          const a0 = startA + (endA - startA) * (i / segments)
          const a1 = startA + (endA - startA) * ((i + 1) / segments)
          const sx = cx + r * Math.cos(a0)
          const sz = cz + r * Math.sin(a0)
          const ex = cx + r * Math.cos(a1)
          const ez = cz + r * Math.sin(a1)
          const segLen = Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2)
          const segAngle = Math.atan2(ez - sz, ex - sx)

          const segGeom = new THREE.BoxGeometry(segLen, wHeight, wThick3D)
          const segMesh = new THREE.Mesh(segGeom, thisWallMat.clone())
          segMesh.position.set((sx + ex) / 2, wHeight / 2, (sz + ez) / 2)
          segMesh.rotation.y = -segAngle
          segMesh.castShadow = true
          segMesh.receiveShadow = true
          scene.add(segMesh)

          // Baseboard segment
          if (!isPartition) {
            const bbGeom = new THREE.BoxGeometry(segLen, 0.1, wThick3D + 0.02)
            const bb = new THREE.Mesh(bbGeom, bbMat.clone())
            bb.position.set((sx + ex) / 2, 0.05, (sz + ez) / 2)
            bb.rotation.y = -segAngle
            scene.add(bb)
          }
        }
      } else {
        // ── Straight wall ─────────────────────────────────────────
        const dx = x2 - x1
        const dz = z2 - z1
        const length = Math.sqrt(dx * dx + dz * dz)
        const angle = Math.atan2(dz, dx)

        const wallGeom = new THREE.BoxGeometry(length, wHeight, wThick3D)
        const wallMesh = new THREE.Mesh(wallGeom, thisWallMat)
        wallMesh.position.set(
          (x1 + x2) / 2,
          wHeight / 2,
          (z1 + z2) / 2
        )
        wallMesh.rotation.y = -angle
        wallMesh.castShadow = true
        wallMesh.receiveShadow = true
        scene.add(wallMesh)

        // Baseboard (not on partitions)
        if (!isPartition) {
          const bbGeom = new THREE.BoxGeometry(length, 0.1, wThick3D + 0.02)
          const bbMat = new THREE.MeshStandardMaterial({
            color: MATERIALS.baseboard.color,
            roughness: MATERIALS.baseboard.roughness,
          })
          const bb = new THREE.Mesh(bbGeom, bbMat)
          bb.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2)
          bb.rotation.y = -angle
          scene.add(bb)

          // Crown molding (top trim)
          const crownGeom = new THREE.BoxGeometry(length, 0.06, wThick3D + 0.03)
          const crown = new THREE.Mesh(crownGeom, bbMat.clone())
          crown.position.set((x1 + x2) / 2, WALL_HEIGHT - 0.03, (z1 + z2) / 2)
          crown.rotation.y = -angle
          scene.add(crown)
        } else {
          // Cap on top of half wall
          const capMat = new THREE.MeshStandardMaterial({ color: MATERIALS.baseboard.color, roughness: 0.5, metalness: 0.05 })
          const capGeom = new THREE.BoxGeometry(length, 0.04, wThick3D + 0.04)
          const cap = new THREE.Mesh(capGeom, capMat)
          cap.position.set((x1 + x2) / 2, wHeight + 0.02, (z1 + z2) / 2)
          cap.rotation.y = -angle
          cap.castShadow = true
          scene.add(cap)
        }
      }
    })

    // ── Doors ────────────────────────────────────────────────────────
    doors.forEach(door => {
      const dx = door.x * PX_TO_WORLD
      const dz = door.y * PX_TO_WORLD
      const dw = (door.width || 60) * PX_TO_WORLD
      const doorH = 2.1
      const rotation = (door.rotation || 0) * Math.PI / 180

      // Door frame
      const frameMat = new THREE.MeshStandardMaterial({
        color: MATERIALS.doorFrame.color,
        roughness: MATERIALS.doorFrame.roughness,
      })

      // Left post
      const postGeom = new THREE.BoxGeometry(0.06, doorH, WALL_THICKNESS + 0.04)
      const leftPost = new THREE.Mesh(postGeom, frameMat)
      leftPost.position.set(dx, doorH / 2, dz)
      leftPost.rotation.y = rotation
      scene.add(leftPost)

      // Right post
      const rightPost = new THREE.Mesh(postGeom, frameMat.clone())
      rightPost.position.set(dx + dw * Math.cos(rotation), doorH / 2, dz + dw * Math.sin(rotation))
      rightPost.rotation.y = rotation
      scene.add(rightPost)

      // Top lintel
      const lintelGeom = new THREE.BoxGeometry(dw + 0.12, 0.06, WALL_THICKNESS + 0.04)
      const lintel = new THREE.Mesh(lintelGeom, frameMat.clone())
      lintel.position.set(dx + (dw * Math.cos(rotation)) / 2, doorH, dz + (dw * Math.sin(rotation)) / 2)
      lintel.rotation.y = rotation
      scene.add(lintel)

      // Door panel (slightly ajar)
      const doorMat = new THREE.MeshStandardMaterial({
        color: MATERIALS.door.color,
        roughness: MATERIALS.door.roughness,
        metalness: 0.05,
      })
      const doorGeom = new THREE.BoxGeometry(dw - 0.06, doorH - 0.08, 0.04)
      const doorPanel = new THREE.Mesh(doorGeom, doorMat)
      // Swing it 20° open
      const doorPivotX = dx + 0.03
      const doorPivotZ = dz
      const doorAngle = rotation + Math.PI * 0.11
      doorPanel.position.set(
        doorPivotX + ((dw - 0.06) / 2) * Math.cos(doorAngle),
        doorH / 2,
        doorPivotZ + ((dw - 0.06) / 2) * Math.sin(doorAngle)
      )
      doorPanel.rotation.y = -doorAngle
      doorPanel.castShadow = true
      scene.add(doorPanel)

      // Door handle
      const handleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8)
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xb8a88a, metalness: 0.8, roughness: 0.2 })
      const handle = new THREE.Mesh(handleGeom, handleMat)
      handle.rotation.x = Math.PI / 2
      const handleDist = dw - 0.2
      handle.position.set(
        doorPivotX + handleDist * Math.cos(doorAngle),
        1.0,
        doorPivotZ + handleDist * Math.sin(doorAngle)
      )
      scene.add(handle)
    })

    // ── Windows ──────────────────────────────────────────────────────
    windows.forEach(win => {
      let wx1, wz1, wx2, wz2

      if (win.x1 !== undefined && win.y1 !== undefined && win.x2 !== undefined && win.y2 !== undefined) {
        // Wall-segment format: {x1, y1, x2, y2}
        wx1 = win.x1 * PX_TO_WORLD
        wz1 = win.y1 * PX_TO_WORLD
        wx2 = win.x2 * PX_TO_WORLD
        wz2 = win.y2 * PX_TO_WORLD
      } else if (win.x !== undefined && win.y !== undefined) {
        // Point + width format: {x, y, width} — find nearest wall for direction
        const winPx = win.x
        const winPy = win.y
        const winW = win.width || 60

        // Find the nearest wall to determine orientation
        let bestWall = null
        let bestDist = Infinity
        walls.forEach(wall => {
          // Distance from window point to wall line segment
          const wdx = wall.x2 - wall.x1
          const wdy = wall.y2 - wall.y1
          const len2 = wdx * wdx + wdy * wdy
          if (len2 === 0) return
          let t = ((winPx - wall.x1) * wdx + (winPy - wall.y1) * wdy) / len2
          t = Math.max(0, Math.min(1, t))
          const projX = wall.x1 + t * wdx
          const projY = wall.y1 + t * wdy
          const dist = Math.sqrt((winPx - projX) ** 2 + (winPy - projY) ** 2)
          if (dist < bestDist) {
            bestDist = dist
            bestWall = wall
          }
        })

        if (bestWall) {
          const angle = Math.atan2(bestWall.y2 - bestWall.y1, bestWall.x2 - bestWall.x1)
          wx1 = winPx * PX_TO_WORLD
          wz1 = winPy * PX_TO_WORLD
          wx2 = (winPx + winW * Math.cos(angle)) * PX_TO_WORLD
          wz2 = (winPy + winW * Math.sin(angle)) * PX_TO_WORLD
        } else {
          // No walls — assume horizontal
          wx1 = winPx * PX_TO_WORLD
          wz1 = winPy * PX_TO_WORLD
          wx2 = (winPx + winW) * PX_TO_WORLD
          wz2 = winPy * PX_TO_WORLD
        }
      } else {
        return // Skip malformed window data
      }

      const wdx = wx2 - wx1
      const wdz = wz2 - wz1
      const wLen = Math.sqrt(wdx * wdx + wdz * wdz)
      if (wLen < 0.01 || isNaN(wLen)) return // Skip zero-length or NaN windows
      const wAngle = Math.atan2(wdz, wdx)

      const sillH = 0.9
      const winH = 1.4
      const cx = (wx1 + wx2) / 2
      const cz = (wz1 + wz2) / 2

      // Glass pane
      const glassMat = new THREE.MeshStandardMaterial({
        color: MATERIALS.glass.color,
        transparent: true,
        opacity: timeOfDay === 'night' ? 0.15 : 0.25,
        roughness: 0.05,
        metalness: 0.1,
        side: THREE.DoubleSide,
      })
      const glassGeom = new THREE.PlaneGeometry(wLen - 0.08, winH - 0.08)
      const glass = new THREE.Mesh(glassGeom, glassMat)
      glass.position.set(cx, sillH + winH / 2, cz)
      glass.rotation.y = -wAngle + Math.PI / 2
      scene.add(glass)

      // Window frame
      const frameMat = new THREE.MeshStandardMaterial({
        color: MATERIALS.windowFrame.color,
        roughness: MATERIALS.windowFrame.roughness,
      })

      // Sill
      const sillGeom = new THREE.BoxGeometry(wLen + 0.08, 0.04, 0.18)
      const sill = new THREE.Mesh(sillGeom, frameMat)
      sill.position.set(cx, sillH, cz)
      sill.rotation.y = -wAngle
      scene.add(sill)

      // Top frame
      const topFrame = new THREE.Mesh(sillGeom.clone(), frameMat.clone())
      topFrame.position.set(cx, sillH + winH, cz)
      topFrame.rotation.y = -wAngle
      scene.add(topFrame)

      // Vertical mullion (center divider)
      const mullionGeom = new THREE.BoxGeometry(0.03, winH, 0.06)
      const mullion = new THREE.Mesh(mullionGeom, frameMat.clone())
      mullion.position.set(cx, sillH + winH / 2, cz)
      mullion.rotation.y = -wAngle
      scene.add(mullion)

      // Horizontal bar
      const hBarGeom = new THREE.BoxGeometry(wLen, 0.03, 0.06)
      const hBar = new THREE.Mesh(hBarGeom, frameMat.clone())
      hBar.position.set(cx, sillH + winH * 0.55, cz)
      hBar.rotation.y = -wAngle
      scene.add(hBar)
    })

    // ── Furniture (HD procedural models with textures) ──────────────
    const fGroups = []
    furniture.forEach(f => {
      const fw = fPxW(f) * PX_TO_WORLD
      const fd = fPxH(f) * PX_TO_WORLD
      const fx = f.x * PX_TO_WORLD + fw / 2
      const fz = f.y * PX_TO_WORLD + fd / 2
      const fType = normalizeType(f.type)
      let config = FURNITURE_3D[fType] || FURNITURE_3D[f.type] || { height: 0.8, color: 0x888888 }
      const rot = (f.rotation || 0) * Math.PI / 180

      const group = new THREE.Group()
      group.position.set(fx, 0, fz)
      group.rotation.y = -rot
      // Store source data on group for tear sheet lookup
      group.userData = { furnitureItem: f, furnitureConfig: config, worldW: fw, worldD: fd }

      // Override config color with the item's actual color (supports color swatches)
      if (f.color) {
        const userColor = hexToInt(f.color)
        config = { ...config, color: userColor }
        if (config.potColor !== undefined) config.potColor = userColor
        if (config.frameColor !== undefined) config.frameColor = userColor
      }

      // Route to HD builders (with THREE passed as first arg)
      const seatingTypes = ['sofa', 'sofa-3seat', 'sectional-l', 'armchair', 'accent-chair', 'recliner', 'loveseat', 'bench', 'ottoman', 'bar-stool', 'office-chair', 'patio-chair', 'lounge-chair']
      const bedTypes = ['bed-king', 'bed-queen', 'bed-twin', 'bunk-bed']
      const tableTypes = ['dining-table', 'round-table', 'desk', 'l-desk', 'coffee-table', 'side-table', 'console-table', 'bar-table', 'patio-table', 'island', 'vanity']
      const shelfTypes = ['bookshelf', 'bookshelf-tall', 'shelving-unit', 'pantry-shelf', 'wardrobe']
      const tvTypes = ['tv-console', 'tv-wall-mount', 'monitor-stand']
      const plantTypes = ['plant', 'plant-large', 'planter']
      const rugTypes = ['rug', 'rug-round']
      const tubTypes = ['bathtub', 'freestand-tub']

      if (seatingTypes.includes(fType)) {
        buildSeatingHD(THREE, group, fw, fd, config)
      } else if (bedTypes.includes(fType)) {
        buildBedHD(THREE, group, fw, fd, config)
      } else if (tableTypes.includes(fType)) {
        buildTableHD(THREE, group, fw, fd, config)
      } else if (shelfTypes.includes(fType)) {
        buildBookshelfHD(THREE, group, fw, fd, config)
      } else if (tvTypes.includes(fType)) {
        buildTVConsoleHD(THREE, group, fw, fd, config)
      } else if (plantTypes.includes(fType)) {
        buildPlantHD(THREE, group, fw, fd, config)
      } else if (rugTypes.includes(fType)) {
        buildRugHD(THREE, group, fw, fd, config)
      } else if (tubTypes.includes(fType)) {
        buildBathtubHD(THREE, group, fw, fd, config)
      } else if (fType === 'shower') {
        buildShowerHD(THREE, group, fw, fd, config)
      } else if (fType === 'fireplace') {
        buildFireplaceHD(THREE, group, fw, fd, config)
      } else if (fType === 'floor-lamp' || fType === 'table-lamp') {
        buildLampHD(THREE, group, fw, fd, config)
      } else {
        buildGenericBoxHD(THREE, group, fw, fd, config)
      }

      // Add contact shadow under each furniture piece
      const shadowR = Math.max(fw, fd) * 0.5
      const shadowGeo = new THREE.CircleGeometry(shadowR, 16)
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false,
      })
      const contactShadow = new THREE.Mesh(shadowGeo, shadowMat)
      contactShadow.rotation.x = -Math.PI / 2
      contactShadow.position.y = 0.003
      group.add(contactShadow)

      scene.add(group)
      fGroups.push(group)
    })
    furnitureGroupsRef.current = fGroups

    // ── Human Scale Figures ──────────────────────────────────────────
    if (showScaleFigures) {
      addScaleFigures(THREE, scene, dimensions, PX_TO_WORLD, furniture)
    }

    // ── Ground plane (extends beyond room for context) ───────────────
    const gpSize = Math.max(floorW, floorD) * 3
    const gpGeo = new THREE.PlaneGeometry(gpSize, gpSize)
    const gpMat = new THREE.MeshStandardMaterial({
      color: 0xd8d3cc, roughness: 0.95, metalness: 0,
    })
    const groundPlane = new THREE.Mesh(gpGeo, gpMat)
    groundPlane.rotation.x = -Math.PI / 2
    groundPlane.position.set(floorW / 2, -0.02, floorD / 2)
    groundPlane.receiveShadow = true
    scene.add(groundPlane)

    // ── Point Cloud Overlay (from scan data) ──────────────────────────
    if (pointCloud && pointCloud.buffer) {
      const pcGroup = loadPointCloud(THREE, scene, pointCloud, {
        pointSize: pointCloudSize,
        opacity: pointCloudOpacity,
        maxPoints: 2_000_000,
      })
      pointCloudGroupRef.current = pcGroup
      if (!pointCloudVisible) {
        pcGroup.traverse(child => { if (child.isPoints) child.visible = false })
      }
    }

  }, [eWalls, eDoors, eWindows, eFurniture, eDimensions, timeOfDay, roomMaterials, showScaleFigures, pointCloud, pointCloudVisible, pointCloudOpacity, pointCloudSize])

  // Furniture builders now imported from FurnitureBuilders.js (HD versions)

  /* Legacy builders removed — see FurnitureBuilders.js for HD versions
    const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.7, metalness: 0.02 })
    const matDark = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.8, metalness: 0.02 })
    matDark.color.multiplyScalar(0.75)

    // Seat base
    const seatGeom = new THREE.BoxGeometry(w, cfg.seatH, d)
    const seat = new THREE.Mesh(seatGeom, mat)
    seat.position.y = cfg.seatH / 2
    seat.castShadow = true
    seat.receiveShadow = true
    group.add(seat)

    // Seat cushion (slightly smaller, rounded look)
    const cushionGeom = new THREE.BoxGeometry(w - 0.06, 0.12, d * 0.65)
    const cushionMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.9 })
    cushionMat.color.multiplyScalar(1.1)
    const cushion = new THREE.Mesh(cushionGeom, cushionMat)
    cushion.position.set(0, cfg.seatH + 0.06, -d * 0.1)
    cushion.castShadow = true
    group.add(cushion)

    // Back
    const backH = cfg.height - cfg.seatH
    const backGeom = new THREE.BoxGeometry(w, backH, d * cfg.backRatio)
    const back = new THREE.Mesh(backGeom, matDark)
    back.position.set(0, cfg.seatH + backH / 2, -d / 2 + (d * cfg.backRatio) / 2)
    back.castShadow = true
    group.add(back)

    // Arms
    if (cfg.hasArms) {
      const armH = cfg.height * 0.6
      const armGeom = new THREE.BoxGeometry(cfg.armW, armH, d * 0.85)
      const armL = new THREE.Mesh(armGeom, matDark)
      armL.position.set(-w / 2 + cfg.armW / 2, armH / 2 + 0.05, -d * 0.05)
      armL.castShadow = true
      group.add(armL)
      const armR = armL.clone()
      armR.position.x = w / 2 - cfg.armW / 2
      group.add(armR)
    }

    // Legs (small cylinders)
    const legGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.4 })
    const positions = [[-w/2+0.08, 0.06, -d/2+0.08], [w/2-0.08, 0.06, -d/2+0.08], [-w/2+0.08, 0.06, d/2-0.08], [w/2-0.08, 0.06, d/2-0.08]]
    positions.forEach(([x,y,z]) => {
      const leg = new THREE.Mesh(legGeom, legMat)
      leg.position.set(x, y, z)
      group.add(leg)
    })
  }

  function buildBed(group, w, d, cfg) {
    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: cfg.frameColor, roughness: 0.6, metalness: 0.02 })
    const frameGeom = new THREE.BoxGeometry(w, 0.3, d)
    const frame = new THREE.Mesh(frameGeom, frameMat)
    frame.position.y = 0.15
    frame.castShadow = true
    frame.receiveShadow = true
    group.add(frame)

    // Mattress
    const mattMat = new THREE.MeshStandardMaterial({ color: cfg.mattressColor, roughness: 0.95 })
    const mattGeom = new THREE.BoxGeometry(w - 0.06, 0.22, d - 0.06)
    const mattress = new THREE.Mesh(mattGeom, mattMat)
    mattress.position.y = 0.41
    mattress.castShadow = true
    group.add(mattress)

    // Pillow(s)
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
    const pillowGeom = new THREE.BoxGeometry(w * 0.35, 0.1, 0.3)
    const pillow1 = new THREE.Mesh(pillowGeom, pillowMat)
    pillow1.position.set(-w * 0.2, 0.57, -d / 2 + 0.25)
    pillow1.castShadow = true
    group.add(pillow1)
    const pillow2 = pillow1.clone()
    pillow2.position.x = w * 0.2
    group.add(pillow2)

    // Headboard
    const headGeom = new THREE.BoxGeometry(w + 0.04, cfg.headH - 0.3, 0.06)
    const head = new THREE.Mesh(headGeom, frameMat.clone())
    head.position.set(0, (cfg.headH - 0.3) / 2 + 0.3, -d / 2 + 0.03)
    head.castShadow = true
    group.add(head)

    // Duvet/comforter
    const duvetMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d5, roughness: 0.95 })
    const duvetGeom = new THREE.BoxGeometry(w - 0.1, 0.06, d * 0.6)
    const duvet = new THREE.Mesh(duvetGeom, duvetMat)
    duvet.position.set(0, 0.55, d * 0.1)
    group.add(duvet)
  }

  function buildTable(group, w, d, cfg) {
    const mat = new THREE.MeshStandardMaterial({ color: cfg.topColor || cfg.color, roughness: 0.4, metalness: 0.05 })
    const thick = cfg.topThick || 0.04
    const h = cfg.height

    // Tabletop
    const topGeom = new THREE.BoxGeometry(w, thick, d)
    const top = new THREE.Mesh(topGeom, mat)
    top.position.y = h - thick / 2
    top.castShadow = true
    top.receiveShadow = true
    group.add(top)

    // Legs
    const legH = h - thick
    const legInset = cfg.legInset || 0.06
    const legGeom = new THREE.BoxGeometry(0.05, legH, 0.05)
    const legMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.5, metalness: 0.1 })
    const legs = [
      [-w/2+legInset, legH/2, -d/2+legInset],
      [w/2-legInset, legH/2, -d/2+legInset],
      [-w/2+legInset, legH/2, d/2-legInset],
      [w/2-legInset, legH/2, d/2-legInset],
    ]
    legs.forEach(([x,y,z]) => {
      const leg = new THREE.Mesh(legGeom, legMat)
      leg.position.set(x, y, z)
      leg.castShadow = true
      group.add(leg)
    })
  }

  function buildBookshelf(group, w, d, cfg) {
    const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6, metalness: 0.05 })
    const h = cfg.height

    // Back panel
    const backGeom = new THREE.BoxGeometry(w, h, 0.02)
    const back = new THREE.Mesh(backGeom, mat)
    back.position.set(0, h / 2, -d / 2 + 0.01)
    back.castShadow = true
    group.add(back)

    // Sides
    const sideGeom = new THREE.BoxGeometry(0.03, h, d)
    const sideL = new THREE.Mesh(sideGeom, mat.clone())
    sideL.position.set(-w / 2 + 0.015, h / 2, 0)
    sideL.castShadow = true
    group.add(sideL)
    const sideR = sideL.clone()
    sideR.position.x = w / 2 - 0.015
    group.add(sideR)

    // Shelves
    const shelfGeom = new THREE.BoxGeometry(w - 0.06, 0.025, d)
    for (let i = 0; i <= (cfg.shelves || 4); i++) {
      const shelf = new THREE.Mesh(shelfGeom, mat.clone())
      shelf.position.set(0, i * (h / (cfg.shelves || 4)), 0)
      shelf.receiveShadow = true
      group.add(shelf)
    }

    // Add some colored "books"
    const bookColors = [0xc62828, 0x1565c0, 0x2e7d32, 0xff8f00, 0x6a1b9a, 0x00838f]
    for (let s = 1; s < (cfg.shelves || 4); s++) {
      const shelfY = s * (h / (cfg.shelves || 4))
      const bookCount = Math.floor(Math.random() * 4) + 3
      let bx = -w / 2 + 0.08
      for (let b = 0; b < bookCount && bx < w / 2 - 0.1; b++) {
        const bw = 0.03 + Math.random() * 0.04
        const bh = (h / (cfg.shelves || 4)) * (0.6 + Math.random() * 0.3)
        const bookGeom = new THREE.BoxGeometry(bw, bh, d * 0.8)
        const bookMat = new THREE.MeshStandardMaterial({
          color: bookColors[Math.floor(Math.random() * bookColors.length)],
          roughness: 0.8
        })
        const book = new THREE.Mesh(bookGeom, bookMat)
        book.position.set(bx + bw / 2, shelfY + bh / 2 + 0.013, 0)
        group.add(book)
        bx += bw + 0.01
      }
    }
  }

  function buildTVConsole(group, w, d, cfg) {
    // Console body
    const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.5, metalness: 0.1 })
    const geom = new THREE.BoxGeometry(w, cfg.height, d)
    const body = new THREE.Mesh(geom, mat)
    body.position.y = cfg.height / 2
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // TV screen
    if (cfg.hasTV) {
      const tvW = w * 0.85
      const tvH = tvW * 0.56 // 16:9
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.3 })
      const screenGeom = new THREE.BoxGeometry(tvW, tvH, 0.03)
      const screen = new THREE.Mesh(screenGeom, screenMat)
      screen.position.set(0, cfg.height + tvH / 2 + 0.02, -d * 0.3)
      screen.castShadow = true
      group.add(screen)

      // Screen bezel highlight
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.05, metalness: 0.5 })
      const bezelGeom = new THREE.BoxGeometry(tvW + 0.04, tvH + 0.04, 0.02)
      const bezel = new THREE.Mesh(bezelGeom, bezelMat)
      bezel.position.set(0, cfg.height + tvH / 2 + 0.02, -d * 0.3 - 0.016)
      group.add(bezel)
    }
  }

  function buildPlant(group, w, d, cfg) {
    // Pot
    const potGeom = new THREE.CylinderGeometry(w * 0.35, w * 0.25, cfg.height * 0.4, 12)
    const potMat = new THREE.MeshStandardMaterial({ color: cfg.potColor, roughness: 0.7 })
    const pot = new THREE.Mesh(potGeom, potMat)
    pot.position.y = cfg.height * 0.2
    pot.castShadow = true
    group.add(pot)

    // Soil
    const soilGeom = new THREE.CylinderGeometry(w * 0.33, w * 0.33, 0.04, 12)
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1.0 })
    const soil = new THREE.Mesh(soilGeom, soilMat)
    soil.position.y = cfg.height * 0.39
    group.add(soil)

    // Foliage (multiple spheres for organic shape)
    const leafMat = new THREE.MeshStandardMaterial({ color: cfg.leafColor, roughness: 0.85 })
    const foliagePositions = [
      [0, cfg.height * 0.7, 0, w * 0.4],
      [-w * 0.15, cfg.height * 0.6, w * 0.1, w * 0.25],
      [w * 0.12, cfg.height * 0.65, -w * 0.08, w * 0.3],
      [0, cfg.height * 0.85, 0, w * 0.25],
    ]
    foliagePositions.forEach(([x, y, z, r]) => {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), leafMat)
      sphere.position.set(x, y, z)
      sphere.castShadow = true
      group.add(sphere)
    })
  }

  function buildRug(group, w, d, cfg) {
    const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.95, metalness: 0 })
    const geom = new THREE.BoxGeometry(w, 0.015, d)
    const rug = new THREE.Mesh(geom, mat)
    rug.position.y = 0.008
    rug.receiveShadow = true
    group.add(rug)

    // Border
    const borderMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.95 })
    borderMat.color.multiplyScalar(0.7)
    const bw = 0.06
    const borders = [
      new THREE.BoxGeometry(w, 0.016, bw), // front
      new THREE.BoxGeometry(w, 0.016, bw), // back
      new THREE.BoxGeometry(bw, 0.016, d), // left
      new THREE.BoxGeometry(bw, 0.016, d), // right
    ]
    const borderPositions = [
      [0, 0.009, d/2-bw/2],
      [0, 0.009, -d/2+bw/2],
      [-w/2+bw/2, 0.009, 0],
      [w/2-bw/2, 0.009, 0],
    ]
    borders.forEach((geom, i) => {
      const border = new THREE.Mesh(geom, borderMat)
      border.position.set(...borderPositions[i])
      group.add(border)
    })
  }

  function buildBathtub(group, w, d, cfg) {
    // Outer shell
    const outerMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.3, metalness: 0.05 })
    const outerGeom = new THREE.BoxGeometry(w, cfg.height, d)
    const outer = new THREE.Mesh(outerGeom, outerMat)
    outer.position.y = cfg.height / 2
    outer.castShadow = true
    group.add(outer)

    // Inner basin (inset box with water color)
    const innerMat = new THREE.MeshStandardMaterial({ color: cfg.innerColor, roughness: 0.1, metalness: 0.05 })
    const innerGeom = new THREE.BoxGeometry(w - 0.12, cfg.height - 0.1, d - 0.12)
    const inner = new THREE.Mesh(innerGeom, innerMat)
    inner.position.y = cfg.height / 2 + 0.05
    group.add(inner)

    // Faucet
    const faucetMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 })
    const faucetGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8)
    const faucet = new THREE.Mesh(faucetGeom, faucetMat)
    faucet.position.set(0, cfg.height + 0.12, -d / 2 + 0.15)
    group.add(faucet)
  }

  function buildShower(group, w, d, cfg) {
    // Base tray
    const trayMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 })
    const trayGeom = new THREE.BoxGeometry(w, 0.05, d)
    const tray = new THREE.Mesh(trayGeom, trayMat)
    tray.position.y = 0.025
    group.add(tray)

    // Glass panels (two sides)
    const glassMat = new THREE.MeshStandardMaterial({
      color: cfg.glassColor, transparent: true, opacity: 0.2,
      roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide,
    })
    const panelGeom = new THREE.PlaneGeometry(w, cfg.height)
    const panel1 = new THREE.Mesh(panelGeom, glassMat)
    panel1.position.set(0, cfg.height / 2, d / 2)
    group.add(panel1)

    const panel2 = new THREE.Mesh(new THREE.PlaneGeometry(d, cfg.height), glassMat.clone())
    panel2.position.set(w / 2, cfg.height / 2, 0)
    panel2.rotation.y = Math.PI / 2
    group.add(panel2)

    // Shower head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 })
    const headGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12)
    const head = new THREE.Mesh(headGeom, headMat)
    head.position.set(0, cfg.height - 0.1, -d / 2 + 0.15)
    group.add(head)

    // Shower arm
    const armGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6)
    const arm = new THREE.Mesh(armGeom, headMat.clone())
    arm.position.set(0, cfg.height - 0.25, -d / 2 + 0.1)
    group.add(arm)
  }

  function buildGenericBox(group, w, d, cfg) {
    const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6, metalness: 0.05 })
    const geom = new THREE.BoxGeometry(w, cfg.height, d)
    const mesh = new THREE.Mesh(geom, mat)
    mesh.position.y = cfg.height / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  function buildFireplace(group, w, d, cfg) {
    const stone = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.9, metalness: 0 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1, metalness: 0 })

    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, cfg.height, d), stone)
    body.position.y = cfg.height / 2
    body.castShadow = true
    group.add(body)

    // Firebox opening
    const openW = w * 0.6, openH = cfg.height * 0.5
    const opening = new THREE.Mesh(new THREE.BoxGeometry(openW, openH, d * 0.3), dark)
    opening.position.set(0, openH / 2 + 0.05, d * 0.36)
    group.add(opening)

    // Mantle
    const mantle = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, 0.06, d * 1.2), stone)
    mantle.position.set(0, cfg.height * 0.75, 0)
    mantle.castShadow = true
    group.add(mantle)

    // Warm glow light inside
    const glow = new THREE.PointLight(0xff6622, 0.4, 3)
    glow.position.set(0, 0.2, d * 0.2)
    group.add(glow)
  }

  function buildLamp(group, w, d, cfg) {
    const metalMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.3, metalness: 0.8 })
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xF5F0E8, roughness: 0.8, metalness: 0, side: THREE.DoubleSide })
    const isFloor = cfg.height > 1.0

    // Pole
    const poleH = cfg.height * 0.75
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, poleH, 8), metalMat)
    pole.position.y = poleH / 2
    pole.castShadow = true
    group.add(pole)

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(isFloor ? 0.15 : 0.08, isFloor ? 0.18 : 0.1, 0.03, 16), metalMat)
    base.position.y = 0.015
    base.castShadow = true
    group.add(base)

    // Shade (truncated cone)
    const shadeH = cfg.height * 0.2
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.08, isFloor ? 0.2 : 0.12, shadeH, 16, 1, true), shadeMat)
    shade.position.y = poleH + shadeH / 2
    shade.castShadow = true
    group.add(shade)

    // Light
    const light = new THREE.PointLight(0xFFE4B5, 0.3, isFloor ? 4 : 2)
    light.position.y = poleH + shadeH * 0.3
    group.add(light)
  */

  // ── Initialize Three.js ────────────────────────────────────────────
  useEffect(() => {
    let disposed = false

    async function init() {
      try {
        await loadThreeJS()
        if (disposed) return

        // Initialize GLTF model loader (non-blocking)
        try { initModelLoaders(THREE) } catch (e) { /* loader init is optional */ }

        const container = containerRef.current
        if (!container) return
        const w = container.clientWidth
        const h = container.clientHeight

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.1
        renderer.outputEncoding = THREE.sRGBEncoding
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(timeOfDay === 'night' ? 0x0a0a15 : timeOfDay === 'evening' ? 0x2a1a0a : 0xdce4ec)
        const floorW = eDimensions.width * PX_TO_WORLD
        const floorD = eDimensions.height * PX_TO_WORLD
        const maxDim = Math.max(floorW, floorD)
        scene.fog = new THREE.Fog(scene.background, maxDim * 1.5, maxDim * 3)
        sceneRef.current = scene

        // Camera — elevated "dollhouse" view looking down into the room
        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 300)
        const cx = floorW / 2
        const cz = floorD / 2
        // Position camera above and to one corner, angled down into the room
        const camHeight = WALL_HEIGHT * 2 + maxDim * 0.12
        const camOffset = maxDim * 0.3
        camera.position.set(cx + camOffset, camHeight, cz + camOffset)
        camera.lookAt(cx, WALL_HEIGHT * 0.3, cz)
        cameraRef.current = camera

        // Controls
        const controls = createOrbitControls(camera, renderer.domElement)
        controls.target.set(cx, WALL_HEIGHT * 0.3, cz)
        controlsRef.current = controls

        // Build scene
        buildScene()

        // Set up tear sheet click-to-select
        if (tearSheetCleanupRef.current) tearSheetCleanupRef.current()
        tearSheetCleanupRef.current = setupTearSheetRaycaster(
          THREE, camera, scene, container, furnitureGroupsRef.current,
          (idx, hitPoint) => {
            const grp = furnitureGroupsRef.current[idx]
            if (grp && grp.userData?.furnitureItem) {
              const item = grp.userData.furnitureItem
              const cfg = grp.userData.furnitureConfig
              setTearSheetItem({
                item,
                config: cfg,
                worldDimensions: {
                  w: grp.userData.worldW,
                  h: grp.userData.worldD,
                  height3d: cfg?.height || 0.8,
                },
              })
            }
          }
        )

        // Animation loop
        function animate() {
          if (disposed) return
          animFrameRef.current = requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()

        // Resize handler
        const onResize = () => {
          if (disposed) return
          const nw = container.clientWidth
          const nh = container.clientHeight
          camera.aspect = nw / nh
          camera.updateProjectionMatrix()
          renderer.setSize(nw, nh)
        }
        window.addEventListener('resize', onResize)
        container._resizeHandler = onResize

        setLoading(false)
      } catch (err) {
        console.error('Three.js init error:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    init()

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
      const container = containerRef.current
      if (container?._resizeHandler) {
        window.removeEventListener('resize', container._resizeHandler)
      }
      // Clean up point cloud overlay
      if (sceneRef.current && THREE) {
        try { removePointCloud(THREE, sceneRef.current) } catch (e) { /* ok */ }
      }
      // Clean up texture, model, and procedural caches
      try { clearMaterialCache() } catch (e) { /* ok */ }
      try { clearModelCache() } catch (e) { /* ok */ }
      try { clearProceduralTextures() } catch (e) { /* ok */ }
      if (tearSheetCleanupRef.current) tearSheetCleanupRef.current()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild scene when data or lighting changes
  useEffect(() => {
    if (!loading && !error && THREE) {
      buildScene()
      // Update background for time of day
      if (sceneRef.current) {
        const bgColor = timeOfDay === 'night' ? 0x0a0a15 : timeOfDay === 'evening' ? 0x2a1a0a : 0xdce4ec
        sceneRef.current.background = new THREE.Color(bgColor)
        if (sceneRef.current.fog) sceneRef.current.fog.color = new THREE.Color(bgColor)
      }
      // Re-setup tear sheet raycaster with updated furniture groups
      if (cameraRef.current && sceneRef.current && containerRef.current) {
        if (tearSheetCleanupRef.current) tearSheetCleanupRef.current()
        tearSheetCleanupRef.current = setupTearSheetRaycaster(
          THREE, cameraRef.current, sceneRef.current, containerRef.current,
          furnitureGroupsRef.current,
          (idx) => {
            const grp = furnitureGroupsRef.current[idx]
            if (grp?.userData?.furnitureItem) {
              const item = grp.userData.furnitureItem
              const cfg = grp.userData.furnitureConfig
              setTearSheetItem({
                item, config: cfg,
                worldDimensions: { w: grp.userData.worldW, h: grp.userData.worldD, height3d: cfg?.height || 0.8 },
              })
            }
          }
        )
      }
    }
  }, [eWalls, eDoors, eWindows, eFurniture, eDimensions, timeOfDay, buildScene, loading, error, showScaleFigures])

  // ── Camera presets ─────────────────────────────────────────────────
  const setCameraView = useCallback((preset) => {
    if (!cameraRef.current || !controlsRef.current) return
    const floorW = eDimensions.width * PX_TO_WORLD
    const floorD = eDimensions.height * PX_TO_WORLD
    const cx = floorW / 2
    const cz = floorD / 2

    const maxDim = Math.max(floorW, floorD)
    const camHeight = WALL_HEIGHT * 2 + maxDim * 0.12
    const camOffset = maxDim * 0.3

    let pos, target
    if (preset === 'perspective') {
      pos = new THREE.Vector3(cx + camOffset, camHeight, cz + camOffset)
      target = new THREE.Vector3(cx, WALL_HEIGHT * 0.3, cz)
    } else if (preset === 'top') {
      pos = new THREE.Vector3(cx, maxDim * 0.8, cz + 0.01)
      target = new THREE.Vector3(cx, 0, cz)
    } else if (preset === 'front') {
      pos = new THREE.Vector3(cx, WALL_HEIGHT * 0.6, cz + maxDim * 0.6)
      target = new THREE.Vector3(cx, WALL_HEIGHT * 0.35, cz)
    } else if (preset === 'corner') {
      pos = new THREE.Vector3(-camOffset * 0.3, camHeight * 0.8, -camOffset * 0.3)
      target = new THREE.Vector3(cx, WALL_HEIGHT * 0.3, cz)
    }

    controlsRef.current.reset(pos, target)
    setViewMode(preset)
    setActiveScene(preset)
  }, [eDimensions])

  // ── Scene management ─────────────────────────────────────────────
  const getCameraState = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return null
    return {
      position: { x: cameraRef.current.position.x, y: cameraRef.current.position.y, z: cameraRef.current.position.z },
      target: { x: controlsRef.current.target.x, y: controlsRef.current.target.y, z: controlsRef.current.target.z },
      timeOfDay,
    }
  }, [timeOfDay])

  const handleSceneSelect = useCallback((sceneId) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return
    if (scene.isDefault) {
      setCameraView(sceneId)
    } else if (scene.cameraPosition && controlsRef.current) {
      const pos = new THREE.Vector3(scene.cameraPosition.x, scene.cameraPosition.y, scene.cameraPosition.z)
      const tgt = new THREE.Vector3(scene.cameraTarget.x, scene.cameraTarget.y, scene.cameraTarget.z)
      controlsRef.current.reset(pos, tgt)
      if (scene.timeOfDay) setTimeOfDay(scene.timeOfDay)
      setActiveScene(sceneId)
    }
  }, [scenes, setCameraView])

  const handleSceneSave = useCallback((scene) => {
    setScenes(prev => [...prev, scene])
    setActiveScene(scene.id)
  }, [])

  const handleSceneDelete = useCallback((sceneId) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId))
    if (activeScene === sceneId) setActiveScene('perspective')
  }, [activeScene])

  const handleSceneRename = useCallback((sceneId, newName) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, name: newName } : s))
  }, [])

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-900 relative">
      {/* Scene Manager Tabs */}
      <SceneManager
        scenes={scenes}
        activeScene={activeScene}
        onSceneSelect={handleSceneSelect}
        onSceneSave={handleSceneSave}
        onSceneDelete={handleSceneDelete}
        onSceneRename={handleSceneRename}
        getCameraState={getCameraState}
      />

      {/* Toolbar */}
      <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-300 mr-2">3D View</span>

          {/* Time of day */}
          <button
            onClick={() => setTimeOfDay('day')}
            className={`p-1.5 rounded transition-colors ${timeOfDay === 'day' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Daytime"
          >
            <Sun size={14} />
          </button>
          <button
            onClick={() => setTimeOfDay('evening')}
            className={`p-1.5 rounded transition-colors ${timeOfDay === 'evening' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Evening"
          >
            <Sun size={14} style={{ opacity: 0.6 }} />
          </button>
          <button
            onClick={() => setTimeOfDay('night')}
            className={`p-1.5 rounded transition-colors ${timeOfDay === 'night' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Night"
          >
            <Moon size={14} />
          </button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          {/* Scale Figures toggle */}
          <button
            onClick={() => setShowScaleFigures(!showScaleFigures)}
            className={`p-1.5 rounded transition-colors ${showScaleFigures ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Human scale figures"
          >
            <User size={14} />
          </button>

          {/* Section Plane toggle */}
          <button
            onClick={() => setShowSectionPlane(!showSectionPlane)}
            className={`p-1.5 rounded transition-colors ${showSectionPlane ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Section Plane (cut through model)"
          >
            <Scissors size={14} />
          </button>

          {/* Point Cloud overlay toggle (visible when pointCloud data is provided) */}
          {pointCloud && (
            <>
              <div className="w-px h-5 bg-slate-600 mx-1" />
              <button
                onClick={() => {
                  setPointCloudVisible(!pointCloudVisible)
                  if (sceneRef.current && THREE) {
                    updatePointCloudSettings(THREE, sceneRef.current, { visible: !pointCloudVisible })
                  }
                }}
                className={`p-1.5 rounded transition-colors ${pointCloudVisible ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                title={pointCloudVisible ? 'Hide point cloud scan' : 'Show point cloud scan'}
              >
                <Layers size={14} />
              </button>
              {pointCloudVisible && (
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={Math.round(pointCloudOpacity * 100)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) / 100
                    setPointCloudOpacity(val)
                    if (sceneRef.current && THREE) {
                      updatePointCloudSettings(THREE, sceneRef.current, { opacity: val })
                    }
                  }}
                  className="w-16 h-1 accent-cyan-500"
                  title={`Point cloud opacity: ${Math.round(pointCloudOpacity * 100)}%`}
                />
              )}
            </>
          )}

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button onClick={() => setCameraView('perspective')} className="p-1.5 rounded text-slate-400 hover:text-slate-200" title="Reset view">
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Left-drag: rotate · Right-drag: pan · Scroll: zoom · Click furniture: tear sheet</span>
          {onClose && (
            <button onClick={onClose} className="ml-2 px-2 py-1 rounded text-[10px] font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>

      {/* Section Plane Controls */}
      {showSectionPlane && (
        <SectionPlane
          visible={showSectionPlane}
          onToggle={() => setShowSectionPlane(false)}
          renderer={rendererRef.current}
          scene={sceneRef.current}
          dimensions={eDimensions}
        />
      )}

      {/* Tear Sheet overlay */}
      {tearSheetItem && (
        <TearSheet3D
          item={tearSheetItem.item}
          config={tearSheetItem.config}
          worldDimensions={tearSheetItem.worldDimensions}
          onClose={() => setTearSheetItem(null)}
        />
      )}

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading 3D engine...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center max-w-sm">
              <p className="text-sm text-red-400 mb-2">Failed to load 3D viewer</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
