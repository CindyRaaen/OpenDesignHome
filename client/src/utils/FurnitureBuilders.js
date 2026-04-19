/**
 * FurnitureBuilders.js — High-fidelity procedural furniture geometry
 * Photorealistic-style models using Three.js r128 primitives
 * Each builder creates detailed geometry with proper proportions,
 * visible joints, rounded edges, and realistic materials.
 */

import { createWoodTexture, createFabricTexture, createMetalTexture } from './ProceduralTextures'

// ── Shared geometry helpers ──────────────────────────────────────────────

/** Create a rounded-edge box by combining a box with cylinders on edges */
function roundedBox(THREE, w, h, d, radius = 0.01) {
  // For performance, use a standard box but with slightly reduced dimensions
  // and add subtle bevel strips on the long edges
  const group = new THREE.Group()
  const mainGeom = new THREE.BoxGeometry(w - radius * 2, h, d - radius * 2)
  return mainGeom // Return simple geometry; bevel via material tricks
}

/** Create tapered furniture leg */
function createTaperedLeg(THREE, topRadius, bottomRadius, height, segments = 8) {
  return new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments)
}

/** Create a turned/spindle leg profile (lathe) */
function createTurnedLeg(THREE, height, maxRadius = 0.025) {
  const points = []
  const r = maxRadius
  // Foot pad
  points.push(new THREE.Vector2(r * 1.2, 0))
  points.push(new THREE.Vector2(r * 1.0, height * 0.02))
  // Lower bulge
  points.push(new THREE.Vector2(r * 0.6, height * 0.05))
  points.push(new THREE.Vector2(r * 1.1, height * 0.12))
  points.push(new THREE.Vector2(r * 0.5, height * 0.22))
  // Shaft
  points.push(new THREE.Vector2(r * 0.5, height * 0.6))
  // Upper taper
  points.push(new THREE.Vector2(r * 0.7, height * 0.85))
  points.push(new THREE.Vector2(r * 0.4, height * 0.95))
  points.push(new THREE.Vector2(r * 0.6, height))

  return new THREE.LatheGeometry(points, 8)
}

/** Create a cushion shape — box with rounded top using hemisphere caps */
function createCushion(THREE, w, h, d, puffiness = 0.3) {
  const group = new THREE.Group()

  // Main body (slightly shorter)
  const bodyH = h * (1 - puffiness)
  const body = new THREE.BoxGeometry(w, bodyH, d)
  const bodyMesh = new THREE.Mesh(body)
  bodyMesh.position.y = bodyH / 2
  group.add(bodyMesh)

  // Rounded top — use a scaled sphere cap
  const topGeom = new THREE.SphereGeometry(
    Math.min(w, d) / 2,
    12, 6,
    0, Math.PI * 2,
    0, Math.PI / 2
  )
  const topMesh = new THREE.Mesh(topGeom)
  topMesh.scale.set(w / (Math.min(w, d)), h * puffiness * 1.5, d / (Math.min(w, d)))
  topMesh.position.y = bodyH
  group.add(topMesh)

  return group
}

/** Small cylindrical handle/knob */
function createHandle(THREE, width = 0.08, depth = 0.02, radius = 0.008) {
  const group = new THREE.Group()
  // Bar
  const bar = new THREE.CylinderGeometry(radius, radius, width, 6)
  const barMesh = new THREE.Mesh(bar)
  barMesh.rotation.z = Math.PI / 2
  group.add(barMesh)
  // End caps
  const cap = new THREE.SphereGeometry(radius * 1.5, 6, 4)
  const capL = new THREE.Mesh(cap)
  capL.position.x = -width / 2
  group.add(capL)
  const capR = new THREE.Mesh(cap)
  capR.position.x = width / 2
  group.add(capR)
  return group
}

// ── Material factories ───────────────────────────────────────────────────

function woodMaterial(THREE, color = 0x92400e, opts = {}) {
  const tex = createWoodTexture(THREE, color, 256)
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: color,
    roughness: opts.roughness || 0.55,
    metalness: opts.metalness || 0.02,
    ...opts,
  })
}

function fabricMaterial(THREE, color = 0x6366f1, opts = {}) {
  const tex = createFabricTexture(THREE, color, 128)
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: color,
    roughness: opts.roughness || 0.85,
    metalness: 0,
    ...opts,
  })
}

function metalMaterial(THREE, color = 0xC0C0C0, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: opts.roughness || 0.15,
    metalness: opts.metalness || 0.85,
    ...opts,
  })
}

function leatherMaterial(THREE, color = 0x5C3A1E, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: opts.roughness || 0.6,
    metalness: 0.03,
    ...opts,
  })
}

// ── SEATING ──────────────────────────────────────────────────────────────

export function buildSeating(THREE, group, w, d, cfg) {
  const upholstery = fabricMaterial(THREE, cfg.color)
  const upholsteryDark = fabricMaterial(THREE, cfg.color, { roughness: 0.9 })
  upholsteryDark.color = new THREE.Color(cfg.color).multiplyScalar(0.75)
  const legMat = metalMaterial(THREE, 0x222222, { roughness: 0.3, metalness: 0.7 })

  const seatH = cfg.seatH || 0.45
  const legH = 0.14
  const frameH = seatH - legH

  // ── Legs (4 tapered metal legs) ──
  const legGeo = createTaperedLeg(THREE, 0.018, 0.012, legH, 8)
  const legPositions = [
    [-w / 2 + 0.06, legH / 2, -d / 2 + 0.06],
    [w / 2 - 0.06, legH / 2, -d / 2 + 0.06],
    [-w / 2 + 0.06, legH / 2, d / 2 - 0.06],
    [w / 2 - 0.06, legH / 2, d / 2 - 0.06],
  ]
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(x, y, z)
    leg.castShadow = true
    group.add(leg)
  })

  // ── Seat frame (hidden under cushions) ──
  const frameGeo = new THREE.BoxGeometry(w - 0.04, frameH * 0.4, d - 0.04)
  const frameMesh = new THREE.Mesh(frameGeo, upholsteryDark)
  frameMesh.position.y = legH + frameH * 0.2
  frameMesh.castShadow = true
  frameMesh.receiveShadow = true
  group.add(frameMesh)

  // ── Seat cushions (individual, rounded) ──
  const cushionCount = w > 1.2 ? 3 : w > 0.7 ? 2 : 1
  const cushionW = (w - 0.08 - (cushionCount - 1) * 0.03) / cushionCount
  const cushionD = d * 0.62
  const cushionH = 0.12

  for (let i = 0; i < cushionCount; i++) {
    const cx = -w / 2 + 0.04 + cushionW / 2 + i * (cushionW + 0.03)

    // Main cushion body
    const cGeo = new THREE.BoxGeometry(cushionW, cushionH, cushionD)
    const cMesh = new THREE.Mesh(cGeo, upholstery)
    cMesh.position.set(cx, seatH + cushionH / 2, d * 0.05)
    cMesh.castShadow = true
    group.add(cMesh)

    // Rounded top (slight dome)
    const domeGeo = new THREE.SphereGeometry(cushionW / 2, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.35)
    const dome = new THREE.Mesh(domeGeo, upholstery)
    dome.scale.set(1, 0.3, cushionD / cushionW)
    dome.position.set(cx, seatH + cushionH, d * 0.05)
    group.add(dome)

    // Cushion seam line (thin dark strip)
    const seamGeo = new THREE.BoxGeometry(cushionW * 0.9, 0.003, 0.005)
    const seamMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.color).multiplyScalar(0.5), roughness: 1 })
    const seam = new THREE.Mesh(seamGeo, seamMat)
    seam.position.set(cx, seatH + cushionH + 0.02, d * 0.05 + cushionD / 2 - 0.03)
    group.add(seam)
  }

  // ── Back rest ──
  if (cfg.backRatio > 0) {
    const backH = cfg.height - seatH - 0.05
    const backD = d * cfg.backRatio
    const backCushionCount = cushionCount

    for (let i = 0; i < backCushionCount; i++) {
      const cx = -w / 2 + 0.04 + cushionW / 2 + i * (cushionW + 0.03)

      // Back cushion (slightly reclined)
      const bGeo = new THREE.BoxGeometry(cushionW, backH, backD)
      const bMesh = new THREE.Mesh(bGeo, upholstery)
      bMesh.position.set(cx, seatH + backH / 2 + 0.06, -d / 2 + backD / 2 + 0.02)
      bMesh.rotation.x = -0.08 // slight recline
      bMesh.castShadow = true
      group.add(bMesh)

      // Rounded top of back cushion
      const btGeo = new THREE.SphereGeometry(cushionW / 2, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.3)
      const bt = new THREE.Mesh(btGeo, upholstery)
      bt.scale.set(1, 0.25, backD / cushionW * 0.8)
      bt.position.set(cx, seatH + backH + 0.06, -d / 2 + backD / 2 + 0.02)
      group.add(bt)
    }

    // Back frame (structural)
    const bfGeo = new THREE.BoxGeometry(w, backH + 0.1, 0.06)
    const bfMesh = new THREE.Mesh(bfGeo, upholsteryDark)
    bfMesh.position.set(0, seatH + backH / 2, -d / 2 + 0.03)
    group.add(bfMesh)
  }

  // ── Arms ──
  if (cfg.hasArms && cfg.armW > 0) {
    const armH = cfg.height * 0.55
    const armD = d * 0.82

    ;[-1, 1].forEach(side => {
      // Arm body
      const aGeo = new THREE.BoxGeometry(cfg.armW, armH - seatH + 0.1, armD)
      const aMesh = new THREE.Mesh(aGeo, upholsteryDark)
      aMesh.position.set(side * (w / 2 - cfg.armW / 2), (armH + seatH) / 2 - 0.02, -d * 0.04)
      aMesh.castShadow = true
      group.add(aMesh)

      // Rounded arm top
      const arGeo = new THREE.CylinderGeometry(cfg.armW / 2, cfg.armW / 2, armD, 8)
      const ar = new THREE.Mesh(arGeo, upholstery)
      ar.rotation.x = Math.PI / 2
      ar.position.set(side * (w / 2 - cfg.armW / 2), armH + 0.01, -d * 0.04)
      group.add(ar)
    })
  }

  // ── Throw pillows (on larger seating) ──
  if (w > 0.8) {
    const pillowColors = [
      new THREE.Color(cfg.color).multiplyScalar(1.3),
      new THREE.Color(cfg.color).offsetHSL(0.05, 0, 0.1),
    ]
    const pillowCount = w > 1.5 ? 2 : 1

    for (let i = 0; i < pillowCount; i++) {
      const px = (i === 0 ? -1 : 1) * (w * 0.28)
      const pMat = new THREE.MeshStandardMaterial({ color: pillowColors[i % 2], roughness: 0.9 })
      const pGeo = new THREE.BoxGeometry(0.25, 0.25, 0.08)
      const pillow = new THREE.Mesh(pGeo, pMat)
      pillow.position.set(px, seatH + 0.22, -d * 0.25)
      pillow.rotation.x = -0.3
      pillow.rotation.z = (i === 0 ? 0.1 : -0.1)
      pillow.castShadow = true
      group.add(pillow)

      // Pillow roundness
      const prGeo = new THREE.SphereGeometry(0.12, 8, 6)
      const pr = new THREE.Mesh(prGeo, pMat)
      pr.scale.set(1, 1, 0.35)
      pr.position.set(px, seatH + 0.22, -d * 0.25)
      pr.rotation.x = -0.3
      pr.rotation.z = (i === 0 ? 0.1 : -0.1)
      group.add(pr)
    }
  }
}

// ── TABLES ───────────────────────────────────────────────────────────────

export function buildTable(THREE, group, w, d, cfg) {
  const topColor = cfg.topColor || cfg.color
  const topMat = woodMaterial(THREE, topColor, { roughness: 0.35, metalness: 0.05 })
  const legMat = woodMaterial(THREE, cfg.color, { roughness: 0.5 })

  const thick = cfg.topThick || 0.04
  const h = cfg.height
  const legInset = cfg.legInset || 0.06

  // ── Tabletop with edge profile ──
  // Main top
  const topGeo = new THREE.BoxGeometry(w, thick, d)
  const top = new THREE.Mesh(topGeo, topMat)
  top.position.y = h - thick / 2
  top.castShadow = true
  top.receiveShadow = true
  group.add(top)

  // Edge bevel (thin strip around perimeter, slightly darker)
  const edgeMat = topMat.clone()
  edgeMat.color = new THREE.Color(topColor).multiplyScalar(0.85)
  const edgeW = 0.008

  // Front/back edges
  const fbEdge = new THREE.BoxGeometry(w + 0.004, thick + 0.006, edgeW)
  ;[d / 2, -d / 2].forEach(z => {
    const e = new THREE.Mesh(fbEdge, edgeMat)
    e.position.set(0, h - thick / 2, z)
    group.add(e)
  })
  // Left/right edges
  const lrEdge = new THREE.BoxGeometry(edgeW, thick + 0.006, d + 0.004)
  ;[w / 2, -w / 2].forEach(x => {
    const e = new THREE.Mesh(lrEdge, edgeMat)
    e.position.set(x, h - thick / 2, 0)
    group.add(e)
  })

  // ── Apron/skirt (under tabletop) ──
  const apronH = 0.06
  const apronThick = 0.02
  const apronY = h - thick - apronH / 2

  // Front and back aprons
  const fbApron = new THREE.BoxGeometry(w - legInset * 2, apronH, apronThick)
  ;[d / 2 - legInset, -d / 2 + legInset].forEach(z => {
    const a = new THREE.Mesh(fbApron, legMat)
    a.position.set(0, apronY, z)
    group.add(a)
  })
  // Left and right aprons
  const lrApron = new THREE.BoxGeometry(apronThick, apronH, d - legInset * 2)
  ;[w / 2 - legInset, -w / 2 + legInset].forEach(x => {
    const a = new THREE.Mesh(lrApron, legMat)
    a.position.set(x, apronY, 0)
    group.add(a)
  })

  // ── Legs (turned/tapered wood legs) ──
  const legH = h - thick - apronH
  const useTurned = h > 0.6 // Taller tables get turned legs

  const legPositions = [
    [-w / 2 + legInset, 0, -d / 2 + legInset],
    [w / 2 - legInset, 0, -d / 2 + legInset],
    [-w / 2 + legInset, 0, d / 2 - legInset],
    [w / 2 - legInset, 0, d / 2 - legInset],
  ]

  legPositions.forEach(([x, y, z]) => {
    let legMesh
    if (useTurned) {
      const geo = createTurnedLeg(THREE, legH, 0.025)
      legMesh = new THREE.Mesh(geo, legMat)
      legMesh.position.set(x, 0, z)
    } else {
      // Simple tapered legs for shorter tables
      const geo = createTaperedLeg(THREE, 0.025, 0.018, legH, 8)
      legMesh = new THREE.Mesh(geo, legMat)
      legMesh.position.set(x, legH / 2, z)
    }
    legMesh.castShadow = true
    group.add(legMesh)
  })
}

// ── BEDS ─────────────────────────────────────────────────────────────────

export function buildBed(THREE, group, w, d, cfg) {
  const frameMat = woodMaterial(THREE, cfg.frameColor || 0x7c3aed, { roughness: 0.5 })
  const mattressMat = fabricMaterial(THREE, cfg.mattressColor || 0xf5f0eb, { roughness: 0.95 })
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf8f6f2, roughness: 0.9 })
  const duvetMat = fabricMaterial(THREE, 0xe8e0d5, { roughness: 0.92 })
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })

  const frameH = 0.32
  const legH = 0.12

  // ── Frame legs ──
  const legGeo = new THREE.BoxGeometry(0.06, legH, 0.06)
  ;[
    [-w / 2 + 0.04, legH / 2, -d / 2 + 0.04],
    [w / 2 - 0.04, legH / 2, -d / 2 + 0.04],
    [-w / 2 + 0.04, legH / 2, d / 2 - 0.04],
    [w / 2 - 0.04, legH / 2, d / 2 - 0.04],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, frameMat)
    leg.position.set(x, y, z)
    leg.castShadow = true
    group.add(leg)
  })

  // ── Side rails ──
  const railH = 0.14
  const railY = legH + railH / 2
  // Left/right rails
  const sideRail = new THREE.BoxGeometry(0.04, railH, d)
  ;[-w / 2 + 0.02, w / 2 - 0.02].forEach(x => {
    const r = new THREE.Mesh(sideRail, frameMat)
    r.position.set(x, railY, 0)
    group.add(r)
  })
  // Foot rail
  const footRail = new THREE.BoxGeometry(w, railH * 0.7, 0.04)
  const fr = new THREE.Mesh(footRail, frameMat)
  fr.position.set(0, railY - 0.02, d / 2 - 0.02)
  group.add(fr)

  // ── Slat platform ──
  const platY = legH + railH
  const slatGeo = new THREE.BoxGeometry(w - 0.1, 0.02, d - 0.08)
  const slat = new THREE.Mesh(slatGeo, frameMat.clone())
  slat.material.color.multiplyScalar(0.9)
  slat.position.y = platY
  group.add(slat)

  // ── Mattress (with pillow-top dome) ──
  const mattH = 0.2
  const mattGeo = new THREE.BoxGeometry(w - 0.08, mattH, d - 0.1)
  const mattress = new THREE.Mesh(mattGeo, mattressMat)
  mattress.position.y = platY + mattH / 2 + 0.01
  mattress.castShadow = true
  group.add(mattress)

  // Pillow-top (slight dome on mattress)
  const ptGeo = new THREE.BoxGeometry(w - 0.1, 0.03, d - 0.12)
  const pt = new THREE.Mesh(ptGeo, mattressMat)
  pt.position.y = platY + mattH + 0.025
  group.add(pt)

  // ── Fitted sheet ──
  const sheetGeo = new THREE.BoxGeometry(w - 0.07, 0.005, d - 0.09)
  const sheet = new THREE.Mesh(sheetGeo, sheetMat)
  sheet.position.y = platY + mattH + 0.045
  group.add(sheet)

  // ── Pillows (rounded, realistic) ──
  const pillowW = w * 0.38
  const pillowPositions = w > 1.0 ? [-w * 0.22, w * 0.22] : [0]
  pillowPositions.forEach(px => {
    // Pillow body
    const pGeo = new THREE.BoxGeometry(pillowW, 0.08, 0.28)
    const p = new THREE.Mesh(pGeo, pillowMat)
    p.position.set(px, platY + mattH + 0.09, -d / 2 + 0.25)
    p.castShadow = true
    group.add(p)

    // Pillow puff (sphere for roundness)
    const pfGeo = new THREE.SphereGeometry(pillowW / 2, 10, 6)
    const pf = new THREE.Mesh(pfGeo, pillowMat)
    pf.scale.set(1, 0.35, 0.55)
    pf.position.set(px, platY + mattH + 0.1, -d / 2 + 0.25)
    group.add(pf)
  })

  // ── Duvet/comforter (covers 2/3 of bed, with fold) ──
  const duvetLen = d * 0.62
  const duvetGeo = new THREE.BoxGeometry(w - 0.06, 0.05, duvetLen)
  const duvet = new THREE.Mesh(duvetGeo, duvetMat)
  duvet.position.set(0, platY + mattH + 0.07, d * 0.08)
  duvet.castShadow = true
  group.add(duvet)

  // Fold at top of duvet
  const foldGeo = new THREE.CylinderGeometry(0.04, 0.04, w - 0.08, 8, 1, false, 0, Math.PI)
  const fold = new THREE.Mesh(foldGeo, duvetMat)
  fold.rotation.z = Math.PI / 2
  fold.rotation.y = Math.PI / 2
  fold.position.set(0, platY + mattH + 0.09, d * 0.08 - duvetLen / 2)
  group.add(fold)

  // ── Headboard ──
  const headH = (cfg.headH || 1.1) - frameH
  const headGeo = new THREE.BoxGeometry(w + 0.06, headH, 0.06)
  const head = new THREE.Mesh(headGeo, frameMat)
  head.position.set(0, frameH + headH / 2, -d / 2 + 0.03)
  head.castShadow = true
  group.add(head)

  // Headboard cap (decorative top)
  const capGeo = new THREE.BoxGeometry(w + 0.1, 0.04, 0.08)
  const cap = new THREE.Mesh(capGeo, frameMat)
  cap.position.set(0, frameH + headH + 0.02, -d / 2 + 0.03)
  group.add(cap)
}

// ── BOOKSHELVES & STORAGE ────────────────────────────────────────────────

export function buildBookshelf(THREE, group, w, d, cfg) {
  const mat = woodMaterial(THREE, cfg.color, { roughness: 0.6 })
  const h = cfg.height
  const shelves = cfg.shelves || 4

  // ── Back panel ──
  const backGeo = new THREE.BoxGeometry(w - 0.02, h, 0.015)
  const back = new THREE.Mesh(backGeo, mat)
  back.position.set(0, h / 2, -d / 2 + 0.008)
  back.castShadow = true
  group.add(back)

  // ── Side panels (with slight bevel) ──
  const sideThick = 0.025
  const sideGeo = new THREE.BoxGeometry(sideThick, h, d)
  ;[-1, 1].forEach(side => {
    const s = new THREE.Mesh(sideGeo, mat)
    s.position.set(side * (w / 2 - sideThick / 2), h / 2, 0)
    s.castShadow = true
    group.add(s)
  })

  // ── Top cap (slightly wider) ──
  const topGeo = new THREE.BoxGeometry(w + 0.02, 0.03, d + 0.015)
  const topPanel = new THREE.Mesh(topGeo, mat)
  topPanel.position.y = h + 0.015
  topPanel.castShadow = true
  group.add(topPanel)

  // ── Base/plinth ──
  const baseGeo = new THREE.BoxGeometry(w, 0.06, d)
  const base = new THREE.Mesh(baseGeo, mat)
  base.position.y = 0.03
  group.add(base)

  // ── Shelves ──
  const innerW = w - sideThick * 2 - 0.01
  const shelfGeo = new THREE.BoxGeometry(innerW, 0.02, d - 0.015)
  for (let i = 1; i <= shelves; i++) {
    const shelf = new THREE.Mesh(shelfGeo, mat)
    shelf.position.set(0, 0.06 + i * ((h - 0.06) / (shelves + 1)), 0.005)
    shelf.receiveShadow = true
    group.add(shelf)
  }

  // ── Books (varied heights, colors, some tilted) ──
  const bookColors = [0xc62828, 0x1565c0, 0x2e7d32, 0xff8f00, 0x6a1b9a, 0x00838f, 0x8D6E63, 0x37474F, 0xAD1457]

  for (let s = 1; s <= shelves; s++) {
    const shelfY = 0.06 + s * ((h - 0.06) / (shelves + 1))
    const shelfH = (h - 0.06) / (shelves + 1) - 0.03
    const bookCount = 4 + Math.floor(seededRandom(s * 71)() * 5)
    let bx = -innerW / 2 + 0.02

    for (let b = 0; b < bookCount && bx < innerW / 2 - 0.06; b++) {
      const rand = seededRandom(s * 100 + b * 37)
      const bw = 0.018 + rand() * 0.035
      const bh = shelfH * (0.55 + rand() * 0.4)
      const bd = d * 0.75

      const bookGeo = new THREE.BoxGeometry(bw, bh, bd)
      const bookMat = new THREE.MeshStandardMaterial({
        color: bookColors[Math.floor(rand() * bookColors.length)],
        roughness: 0.8,
      })
      const book = new THREE.Mesh(bookGeo, bookMat)

      // Some books slightly tilted
      const tilt = rand() > 0.7 ? (rand() - 0.5) * 0.15 : 0
      book.rotation.z = tilt
      book.position.set(bx + bw / 2, shelfY + bh / 2 + 0.012, 0.008)
      book.castShadow = true
      group.add(book)

      // Spine text line (decorative)
      if (bh > shelfH * 0.6 && bw > 0.025) {
        const lineGeo = new THREE.BoxGeometry(bw * 0.6, 0.003, 0.002)
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xCCBB99, roughness: 1 })
        const line = new THREE.Mesh(lineGeo, lineMat)
        line.position.set(bx + bw / 2, shelfY + bh * 0.7 + 0.012, bd / 2 + 0.003)
        line.rotation.z = tilt
        group.add(line)
      }

      bx += bw + 0.005
    }

    // Occasional bookend or small decorative object
    if (seededRandom(s * 53)() > 0.5 && bx < innerW / 2 - 0.08) {
      const objGeo = new THREE.SphereGeometry(0.03, 8, 6)
      const objMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.3, metalness: 0.6 })
      const obj = new THREE.Mesh(objGeo, objMat)
      obj.position.set(bx + 0.04, shelfY + 0.042, 0)
      group.add(obj)
    }
  }
}

// ── TV CONSOLE ───────────────────────────────────────────────────────────

export function buildTVConsole(THREE, group, w, d, cfg) {
  const bodyMat = woodMaterial(THREE, cfg.color, { roughness: 0.4, metalness: 0.08 })
  const h = cfg.height

  // ── Console body ──
  const bodyGeo = new THREE.BoxGeometry(w, h - 0.08, d)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = (h - 0.08) / 2 + 0.08
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // ── Legs (slim metal) ──
  const legGeo = createTaperedLeg(THREE, 0.012, 0.008, 0.08, 6)
  ;[
    [-w / 2 + 0.06, 0.04, d / 2 - 0.05],
    [w / 2 - 0.06, 0.04, d / 2 - 0.05],
    [-w / 2 + 0.06, 0.04, -d / 2 + 0.05],
    [w / 2 - 0.06, 0.04, -d / 2 + 0.05],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, metalMaterial(THREE, 0x333333))
    leg.position.set(x, y, z)
    group.add(leg)
  })

  // ── Cabinet doors (inset panel lines) ──
  const doorW = w / 2 - 0.06
  const doorH = h * 0.5
  const doorMat = bodyMat.clone()
  doorMat.color.multiplyScalar(0.92)
  ;[-1, 1].forEach(side => {
    const dGeo = new THREE.BoxGeometry(doorW, doorH, 0.005)
    const door = new THREE.Mesh(dGeo, doorMat)
    door.position.set(side * (w / 4), h * 0.42, d / 2 + 0.003)
    group.add(door)

    // Door handle
    const hMat = metalMaterial(THREE, 0xAAAAAA)
    const hGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 6)
    const handle = new THREE.Mesh(hGeo, hMat)
    handle.rotation.z = Math.PI / 2
    handle.position.set(side * (w / 4 + (side > 0 ? -doorW / 2 + 0.06 : doorW / 2 - 0.06)), h * 0.42, d / 2 + 0.01)
    group.add(handle)
  })

  // ── TV screen ──
  if (cfg.hasTV) {
    const tvW = w * 0.82
    const tvH = tvW * 0.56 // 16:9
    const tvD = 0.025

    // TV back panel
    const tvBackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.4 })
    const tvBack = new THREE.Mesh(new THREE.BoxGeometry(tvW, tvH, tvD), tvBackMat)
    tvBack.position.set(0, h + tvH / 2 + 0.03, -d * 0.25)
    tvBack.castShadow = true
    group.add(tvBack)

    // Screen (slightly glossy dark)
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.05, metalness: 0.2 })
    const screen = new THREE.Mesh(new THREE.BoxGeometry(tvW - 0.04, tvH - 0.04, 0.003), screenMat)
    screen.position.set(0, h + tvH / 2 + 0.03, -d * 0.25 + tvD / 2 + 0.002)
    group.add(screen)

    // Bezel (thin frame around screen)
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.5 })
    // Bottom bezel (thicker - brand area)
    const botBezel = new THREE.Mesh(new THREE.BoxGeometry(tvW, 0.03, tvD + 0.005), bezelMat)
    botBezel.position.set(0, h + 0.045, -d * 0.25)
    group.add(botBezel)

    // TV stand/neck
    const neckMat = metalMaterial(THREE, 0x333333)
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.04), neckMat)
    neck.position.set(0, h + 0.02, -d * 0.25)
    group.add(neck)

    // TV base
    const tvBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.15), neckMat)
    tvBase.position.set(0, h + 0.005, -d * 0.25)
    group.add(tvBase)
  }
}

// ── PLANTS ───────────────────────────────────────────────────────────────

export function buildPlant(THREE, group, w, d, cfg) {
  const potMat = new THREE.MeshStandardMaterial({ color: cfg.potColor || 0x92400e, roughness: 0.65, metalness: 0.03 })
  const potH = cfg.height * 0.35
  const potRTop = Math.min(w, d) * 0.35
  const potRBot = potRTop * 0.72

  // ── Pot (tapered cylinder with rim) ──
  const potGeo = new THREE.CylinderGeometry(potRTop, potRBot, potH, 16)
  const pot = new THREE.Mesh(potGeo, potMat)
  pot.position.y = potH / 2
  pot.castShadow = true
  pot.receiveShadow = true
  group.add(pot)

  // Pot rim
  const rimGeo = new THREE.TorusGeometry(potRTop, 0.015, 8, 16)
  const rim = new THREE.Mesh(rimGeo, potMat)
  rim.rotation.x = Math.PI / 2
  rim.position.y = potH
  group.add(rim)

  // Soil
  const soilGeo = new THREE.CylinderGeometry(potRTop - 0.01, potRTop - 0.01, 0.03, 16)
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1 })
  const soil = new THREE.Mesh(soilGeo, soilMat)
  soil.position.y = potH - 0.005
  group.add(soil)

  // ── Foliage (organic cluster of spheres + elongated leaf shapes) ──
  const leafColor = cfg.leafColor || 0x16a34a
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8 })
  const darkLeafMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(leafColor).multiplyScalar(0.7), roughness: 0.85 })

  const foliageH = cfg.height - potH
  const foliageR = Math.min(w, d) * 0.45

  // Main foliage mass (cluster of overlapping spheres)
  const positions = [
    [0, potH + foliageH * 0.5, 0, foliageR],
    [-foliageR * 0.3, potH + foliageH * 0.35, foliageR * 0.2, foliageR * 0.7],
    [foliageR * 0.25, potH + foliageH * 0.4, -foliageR * 0.15, foliageR * 0.65],
    [0, potH + foliageH * 0.75, 0, foliageR * 0.6],
    [-foliageR * 0.15, potH + foliageH * 0.3, -foliageR * 0.25, foliageR * 0.5],
    [foliageR * 0.1, potH + foliageH * 0.65, foliageR * 0.1, foliageR * 0.45],
  ]
  positions.forEach(([x, y, z, r], i) => {
    const geo = new THREE.SphereGeometry(r, 10, 7)
    const mesh = new THREE.Mesh(geo, i % 2 === 0 ? leafMat : darkLeafMat)
    mesh.position.set(x, y, z)
    mesh.scale.y = 0.85 // Slightly squished
    mesh.castShadow = true
    group.add(mesh)
  })

  // Individual leaf accents (thin elongated shapes poking out)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + seededRandom(i * 31)() * 0.5
    const leafLen = foliageR * 0.7 + seededRandom(i * 47)() * foliageR * 0.4
    const leafGeo = new THREE.BoxGeometry(0.01, leafLen, 0.04)
    const leaf = new THREE.Mesh(leafGeo, i % 3 === 0 ? darkLeafMat : leafMat)
    leaf.position.set(
      Math.cos(angle) * foliageR * 0.3,
      potH + foliageH * 0.4,
      Math.sin(angle) * foliageR * 0.3
    )
    leaf.rotation.z = Math.cos(angle) * 0.4
    leaf.rotation.x = Math.sin(angle) * 0.4
    group.add(leaf)
  }
}

// ── RUGS ─────────────────────────────────────────────────────────────────

export function buildRug(THREE, group, w, d, cfg) {
  const rugTex = createFabricTexture(THREE, cfg.color, 256)

  // Main rug body (very thin, with texture)
  const mainMat = new THREE.MeshStandardMaterial({
    map: rugTex,
    color: cfg.color,
    roughness: 0.95,
    metalness: 0,
  })
  const geo = new THREE.BoxGeometry(w, 0.012, d)
  const rug = new THREE.Mesh(geo, mainMat)
  rug.position.y = 0.006
  rug.receiveShadow = true
  group.add(rug)

  // Border (darker, thicker edge)
  const borderMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.color).multiplyScalar(0.6),
    roughness: 0.95,
  })
  const bw = 0.05

  // Inner pattern border
  const innerBorderMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.color).multiplyScalar(1.2),
    roughness: 0.9,
  })
  const ibw = 0.025
  const ibOffset = bw + 0.01

  // Outer border strips
  const borders = [
    { geo: new THREE.BoxGeometry(w, 0.014, bw), pos: [0, 0.008, d / 2 - bw / 2] },
    { geo: new THREE.BoxGeometry(w, 0.014, bw), pos: [0, 0.008, -d / 2 + bw / 2] },
    { geo: new THREE.BoxGeometry(bw, 0.014, d), pos: [-w / 2 + bw / 2, 0.008, 0] },
    { geo: new THREE.BoxGeometry(bw, 0.014, d), pos: [w / 2 - bw / 2, 0.008, 0] },
  ]
  borders.forEach(({ geo, pos }) => {
    const b = new THREE.Mesh(geo, borderMat)
    b.position.set(...pos)
    group.add(b)
  })

  // Inner border strips
  const innerBorders = [
    { geo: new THREE.BoxGeometry(w - ibOffset * 2, 0.014, ibw), pos: [0, 0.008, d / 2 - ibOffset - ibw / 2] },
    { geo: new THREE.BoxGeometry(w - ibOffset * 2, 0.014, ibw), pos: [0, 0.008, -d / 2 + ibOffset + ibw / 2] },
    { geo: new THREE.BoxGeometry(ibw, 0.014, d - ibOffset * 2), pos: [-w / 2 + ibOffset + ibw / 2, 0.008, 0] },
    { geo: new THREE.BoxGeometry(ibw, 0.014, d - ibOffset * 2), pos: [w / 2 - ibOffset - ibw / 2, 0.008, 0] },
  ]
  innerBorders.forEach(({ geo, pos }) => {
    const b = new THREE.Mesh(geo, innerBorderMat)
    b.position.set(...pos)
    group.add(b)
  })

  // Fringe on short edges
  const fringeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.color).multiplyScalar(0.8),
    roughness: 1,
  })
  for (let i = 0; i < Math.floor(w / 0.025); i++) {
    const fx = -w / 2 + 0.012 + i * 0.025
    ;[d / 2 + 0.015, -d / 2 - 0.015].forEach(fz => {
      const fGeo = new THREE.BoxGeometry(0.004, 0.005, 0.03)
      const fringe = new THREE.Mesh(fGeo, fringeMat)
      fringe.position.set(fx, 0.003, fz)
      group.add(fringe)
    })
  }
}

// ── BATHTUB ──────────────────────────────────────────────────────────────

export function buildBathtub(THREE, group, w, d, cfg) {
  const outerMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.2, metalness: 0.05 })
  const innerMat = new THREE.MeshStandardMaterial({ color: cfg.innerColor || 0xe8f4f8, roughness: 0.1, metalness: 0.03 })
  const chromeMat = metalMaterial(THREE, 0xE0E0E0)
  const h = cfg.height

  // Outer shell
  const outerGeo = new THREE.BoxGeometry(w, h, d)
  const outer = new THREE.Mesh(outerGeo, outerMat)
  outer.position.y = h / 2
  outer.castShadow = true
  outer.receiveShadow = true
  group.add(outer)

  // Inner basin
  const innerGeo = new THREE.BoxGeometry(w - 0.1, h - 0.06, d - 0.1)
  const inner = new THREE.Mesh(innerGeo, innerMat)
  inner.position.y = h / 2 + 0.03
  group.add(inner)

  // Rim (rounded top edge)
  const rimGeo = new THREE.BoxGeometry(w + 0.02, 0.04, d + 0.02)
  const rimMat = outerMat.clone()
  rimMat.roughness = 0.1
  const rim = new THREE.Mesh(rimGeo, rimMat)
  rim.position.y = h
  group.add(rim)

  // Faucet assembly
  // Base plate
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 12), chromeMat)
  basePlate.position.set(0, h + 0.005, -d / 2 + 0.15)
  group.add(basePlate)

  // Faucet post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), chromeMat)
  post.position.set(0, h + 0.11, -d / 2 + 0.15)
  group.add(post)

  // Faucet spout (bent pipe)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), chromeMat)
  spout.rotation.x = Math.PI / 2
  spout.position.set(0, h + 0.2, -d / 2 + 0.2)
  group.add(spout)

  // Handles
  ;[-0.06, 0.06].forEach(x => {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), chromeMat)
    handle.position.set(x, h + 0.06, -d / 2 + 0.15)
    group.add(handle)
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), chromeMat)
    knob.position.set(x, h + 0.09, -d / 2 + 0.15)
    group.add(knob)
  })
}

// ── SHOWER ───────────────────────────────────────────────────────────────

export function buildShower(THREE, group, w, d, cfg) {
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.25, metalness: 0.02 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: cfg.glassColor || 0x88ccff,
    transparent: true, opacity: 0.15,
    roughness: 0.02, metalness: 0.1,
    side: 2, // DoubleSide
  })
  const chromeMat = metalMaterial(THREE, 0xD0D0D0)
  const h = cfg.height

  // Base tray
  const tray = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), tileMat)
  tray.position.y = 0.02
  tray.receiveShadow = true
  group.add(tray)

  // Drain
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 12), chromeMat)
  drain.position.set(0, 0.043, 0)
  group.add(drain)

  // Glass panels (front + side)
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.008), glassMat)
  frontGlass.position.set(0, h / 2, d / 2)
  group.add(frontGlass)

  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.008, h, d), glassMat)
  sideGlass.position.set(w / 2, h / 2, 0)
  group.add(sideGlass)

  // Glass frame (thin chrome strips)
  const frameMat = metalMaterial(THREE, 0xBBBBBB)
  // Vertical frame strips
  ;[
    [w / 2, h / 2, d / 2], [-w / 2, h / 2, d / 2], // front edges
    [w / 2, h / 2, -d / 2], [w / 2, h / 2, d / 2 - 0.01], // side edges
  ].forEach(([x, y, z]) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.02), frameMat)
    strip.position.set(x, y, z)
    group.add(strip)
  })

  // Shower head (rain style)
  const headGeo = new THREE.BoxGeometry(0.18, 0.015, 0.18)
  const head = new THREE.Mesh(headGeo, chromeMat)
  head.position.set(0, h - 0.15, -d / 2 + 0.2)
  group.add(head)

  // Shower arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), chromeMat)
  arm.position.set(0, h - 0.3, -d / 2 + 0.1)
  group.add(arm)

  // Horizontal arm to wall
  const hArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.15, 6), chromeMat)
  hArm.rotation.x = Math.PI / 2
  hArm.position.set(0, h - 0.15, -d / 2 + 0.12)
  group.add(hArm)

  // Mixer valve
  const mixer = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), chromeMat)
  mixer.position.set(0, h * 0.5, -d / 2 + 0.04)
  group.add(mixer)
}

// ── FIREPLACE ────────────────────────────────────────────────────────────

export function buildFireplace(THREE, group, w, d, cfg) {
  const stoneMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.85, metalness: 0 })
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1, metalness: 0 })
  const brickMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.95 })
  const h = cfg.height

  // ── Main surround ──
  // Left column
  const colW = w * 0.15
  const col = new THREE.Mesh(new THREE.BoxGeometry(colW, h, d), stoneMat)
  col.position.set(-w / 2 + colW / 2, h / 2, 0)
  col.castShadow = true
  group.add(col)
  // Right column
  const colR = col.clone()
  colR.position.x = w / 2 - colW / 2
  group.add(colR)

  // Top header
  const headerH = h * 0.2
  const header = new THREE.Mesh(new THREE.BoxGeometry(w, headerH, d), stoneMat)
  header.position.set(0, h - headerH / 2, 0)
  header.castShadow = true
  group.add(header)

  // ── Mantle (thick shelf) ──
  const mantleMat = woodMaterial(THREE, 0x5C3A1E, { roughness: 0.4 })
  const mantle = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.06, d * 1.15), mantleMat)
  mantle.position.set(0, h - headerH, 0)
  mantle.castShadow = true
  group.add(mantle)

  // ── Firebox ──
  const openW = w - colW * 2 - 0.02
  const openH = h - headerH - 0.05
  const fireboxBack = new THREE.Mesh(new THREE.BoxGeometry(openW, openH, d * 0.6), brickMat)
  fireboxBack.position.set(0, openH / 2 + 0.02, -d * 0.1)
  group.add(fireboxBack)

  // Firebox floor
  const firefloor = new THREE.Mesh(new THREE.BoxGeometry(openW, 0.04, d * 0.8), darkMat)
  firefloor.position.set(0, 0.02, d * 0.05)
  group.add(firefloor)

  // ── Hearth (stone slab in front) ──
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.04, d * 0.5), stoneMat)
  hearth.position.set(0, 0.02, d / 2 + d * 0.15)
  hearth.receiveShadow = true
  group.add(hearth)

  // ── Log set ──
  const logMat = new THREE.MeshStandardMaterial({ color: 0x4A3520, roughness: 0.9 })
  for (let i = 0; i < 3; i++) {
    const logLen = openW * 0.7
    const logR = 0.035 + i * 0.005
    const log = new THREE.Mesh(new THREE.CylinderGeometry(logR, logR, logLen, 8), logMat)
    log.rotation.z = Math.PI / 2
    log.rotation.y = (i - 1) * 0.15
    log.position.set(0, 0.06 + i * 0.06, d * 0.1)
    group.add(log)
  }

  // ── Fire glow ──
  const glow = new THREE.PointLight(0xff6622, 0.5, 4)
  glow.position.set(0, 0.15, d * 0.15)
  group.add(glow)

  // Ember glow (small orange sphere)
  const emberMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff3300, emissiveIntensity: 0.5 })
  for (let i = 0; i < 5; i++) {
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 3), emberMat)
    ember.position.set(
      (seededRandom(i * 37)() - 0.5) * openW * 0.4,
      0.05,
      d * 0.1 + seededRandom(i * 53)() * 0.05
    )
    group.add(ember)
  }
}

// ── LAMPS ────────────────────────────────────────────────────────────────

export function buildLamp(THREE, group, w, d, cfg) {
  const metalMat = metalMaterial(THREE, cfg.color || 0xCFB53B, { roughness: 0.25, metalness: 0.85 })
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xF5ECD7,
    roughness: 0.8,
    metalness: 0,
    side: 2, // DoubleSide
    transparent: true,
    opacity: 0.9,
  })
  const isFloor = cfg.height > 1.0

  // ── Base (weighted disc) ──
  const baseR = isFloor ? 0.15 : 0.07
  const baseH = 0.025
  const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR + 0.02, baseH, 24), metalMat)
  base.position.y = baseH / 2
  base.castShadow = true
  group.add(base)

  // Base accent ring
  const ringGeo = new THREE.TorusGeometry(baseR, 0.005, 6, 24)
  const ring = new THREE.Mesh(ringGeo, metalMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = baseH
  group.add(ring)

  // ── Pole (main shaft) ──
  const poleH = cfg.height * 0.7
  const poleR = isFloor ? 0.012 : 0.008
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(poleR, poleR, poleH, 8), metalMat)
  pole.position.y = baseH + poleH / 2
  pole.castShadow = true
  group.add(pole)

  // Decorative node at pole midpoint
  const node = new THREE.Mesh(new THREE.SphereGeometry(poleR * 2.5, 8, 6), metalMat)
  node.position.y = baseH + poleH * 0.45
  group.add(node)

  // ── Shade (truncated cone, open bottom) ──
  const shadeH = cfg.height * 0.22
  const shadeTopR = isFloor ? 0.06 : 0.04
  const shadeBotR = isFloor ? 0.18 : 0.12
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(shadeTopR, shadeBotR, shadeH, 24, 1, true),
    shadeMat
  )
  shade.position.y = baseH + poleH + shadeH / 2 - 0.02
  shade.castShadow = true
  group.add(shade)

  // Shade top rim
  const topRim = new THREE.Mesh(new THREE.TorusGeometry(shadeTopR, 0.004, 6, 24), metalMat)
  topRim.rotation.x = Math.PI / 2
  topRim.position.y = baseH + poleH + shadeH - 0.02
  group.add(topRim)

  // Shade bottom rim
  const botRim = new THREE.Mesh(new THREE.TorusGeometry(shadeBotR, 0.004, 6, 24), metalMat)
  botRim.rotation.x = Math.PI / 2
  botRim.position.y = baseH + poleH - 0.02
  group.add(botRim)

  // ── Light bulb (visible warm glow) ──
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xFFE4B5,
    emissive: 0xFFD088,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.7,
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), bulbMat)
  bulb.position.y = baseH + poleH + shadeH * 0.3
  group.add(bulb)

  // Point light (warm glow)
  const light = new THREE.PointLight(0xFFE4B5, isFloor ? 0.5 : 0.25, isFloor ? 5 : 2.5)
  light.position.y = baseH + poleH + shadeH * 0.3
  light.castShadow = isFloor
  group.add(light)
}

// ── GENERIC BOX (fallback) ───────────────────────────────────────────────

export function buildGenericBox(THREE, group, w, d, cfg) {
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.5, metalness: 0.05 })
  const h = cfg.height

  // Main body with slight edge highlights
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  body.position.y = h / 2
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Top surface (slightly lighter)
  const topMat = mat.clone()
  topMat.color.multiplyScalar(1.1)
  const top = new THREE.Mesh(new THREE.BoxGeometry(w - 0.01, 0.005, d - 0.01), topMat)
  top.position.y = h + 0.003
  group.add(top)

  // Edge line (subtle dark outline on front face)
  const edgeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.color).multiplyScalar(0.6), roughness: 1 })
  const edgeGeo = new THREE.BoxGeometry(w + 0.002, h + 0.002, 0.003)
  const edge = new THREE.Mesh(edgeGeo, edgeMat)
  edge.position.set(0, h / 2, d / 2 + 0.002)
  group.add(edge)
}

// ── Seeded random helper (must match ProceduralTextures) ─────────────────

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}
