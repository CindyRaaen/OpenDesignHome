/**
 * HumanFigure.js — SketchUp-style human scale figures for 3D scene reference
 * Creates simple geometric human silhouettes at ~1.75m height
 * Semi-transparent with neutral styling to avoid distraction
 */

const FIGURE_HEIGHT = 1.75 // meters (world units)

/**
 * Build a standing human figure and add it to the scene
 * @param {THREE} THREE - Three.js namespace
 * @param {Object} options - { position: {x,y,z}, rotation: number, style: 'male'|'female', opacity: number }
 * @returns {THREE.Group} The figure group
 */
export function createHumanFigure(THREE, options = {}) {
  const {
    style = 'male',
    opacity = 0.7,
    color = 0x4A5568, // Neutral gray-blue
    showShadow = true,
  } = options

  const group = new THREE.Group()

  const mat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.85,
    metalness: 0,
    transparent: opacity < 1,
    opacity: opacity,
    depthWrite: opacity >= 0.9,
  })

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xDEB887,
    roughness: 0.8,
    metalness: 0,
    transparent: opacity < 1,
    opacity: opacity,
    depthWrite: opacity >= 0.9,
  })

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x3E2723,
    roughness: 0.9,
    metalness: 0,
    transparent: opacity < 1,
    opacity: opacity,
    depthWrite: opacity >= 0.9,
  })

  const isFemale = style === 'female'
  const scale = isFemale ? 0.93 : 1.0
  const bodyScale = FIGURE_HEIGHT * scale

  // ── Head ──
  const headR = bodyScale * 0.065
  const headGeo = new THREE.SphereGeometry(headR, 12, 10)
  const head = new THREE.Mesh(headGeo, skinMat)
  head.position.y = bodyScale - headR
  head.castShadow = showShadow
  group.add(head)

  // Hair (cap on top of head)
  const hairGeo = new THREE.SphereGeometry(headR * 1.05, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55)
  const hair = new THREE.Mesh(hairGeo, hairMat)
  hair.position.y = bodyScale - headR + headR * 0.05
  group.add(hair)

  // ── Neck ──
  const neckH = bodyScale * 0.035
  const neckR = headR * 0.45
  const neckGeo = new THREE.CylinderGeometry(neckR, neckR * 1.1, neckH, 8)
  const neck = new THREE.Mesh(neckGeo, skinMat)
  neck.position.y = bodyScale - headR * 2 - neckH / 2 + 0.02
  group.add(neck)

  // ── Torso ──
  const torsoH = bodyScale * 0.3
  const shoulderW = bodyScale * (isFemale ? 0.1 : 0.12)
  const waistW = bodyScale * (isFemale ? 0.075 : 0.09)
  const torsoD = bodyScale * 0.065

  // Upper torso (shirt/jacket)
  const torsoGeo = new THREE.CylinderGeometry(shoulderW, waistW, torsoH, 8)
  const torso = new THREE.Mesh(torsoGeo, mat)
  torso.position.y = bodyScale * 0.53
  torso.castShadow = showShadow
  group.add(torso)

  // ── Hips / lower body ──
  const hipH = bodyScale * 0.08
  const hipW = bodyScale * (isFemale ? 0.1 : 0.085)
  const hipGeo = new THREE.CylinderGeometry(waistW, hipW, hipH, 8)
  const hip = new THREE.Mesh(hipGeo, mat)
  hip.position.y = bodyScale * 0.38 - hipH / 2 + 0.02
  group.add(hip)

  // ── Legs ──
  const legH = bodyScale * 0.42
  const legTopR = bodyScale * 0.04
  const legBotR = bodyScale * 0.025

  // Pants material (slightly different shade)
  const pantsMat = mat.clone()
  pantsMat.color = new THREE.Color(color).multiplyScalar(0.75)

  ;[-1, 1].forEach(side => {
    const legGeo = new THREE.CylinderGeometry(legTopR, legBotR, legH, 8)
    const leg = new THREE.Mesh(legGeo, pantsMat)
    leg.position.set(side * bodyScale * 0.04, legH / 2 + bodyScale * 0.01, 0)
    leg.castShadow = showShadow
    group.add(leg)

    // Shoe
    const shoeLen = bodyScale * 0.08
    const shoeH = bodyScale * 0.025
    const shoeGeo = new THREE.BoxGeometry(bodyScale * 0.045, shoeH, shoeLen)
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x2C2C2C, roughness: 0.6, metalness: 0.1,
      transparent: opacity < 1, opacity, depthWrite: opacity >= 0.9,
    })
    const shoe = new THREE.Mesh(shoeGeo, shoeMat)
    shoe.position.set(side * bodyScale * 0.04, shoeH / 2, shoeLen * 0.1)
    group.add(shoe)
  })

  // ── Arms ──
  const armH = bodyScale * 0.3
  const armTopR = bodyScale * 0.025
  const armBotR = bodyScale * 0.018

  ;[-1, 1].forEach(side => {
    // Upper arm (slightly angled out)
    const armGeo = new THREE.CylinderGeometry(armTopR, armBotR, armH, 8)
    const arm = new THREE.Mesh(armGeo, mat)
    arm.position.set(
      side * (shoulderW + armTopR * 0.5),
      bodyScale * 0.52,
      0
    )
    // Slight angle — arms hang naturally
    arm.rotation.z = side * 0.08
    arm.castShadow = showShadow
    group.add(arm)

    // Hand (small sphere)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(bodyScale * 0.02, 6, 5), skinMat)
    hand.position.set(
      side * (shoulderW + armTopR * 0.5 + armH * Math.sin(0.08) * 0.5),
      bodyScale * 0.52 - armH / 2 - bodyScale * 0.01,
      0
    )
    group.add(hand)
  })

  // ── Contact shadow (dark circle on floor) ──
  if (showShadow) {
    const shadowGeo = new THREE.CircleGeometry(bodyScale * 0.12, 16)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    })
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.002
    group.add(shadow)
  }

  return group
}

/**
 * Add human scale figures to a scene based on room dimensions
 * Places 1-2 figures in natural positions within the room
 */
export function addScaleFigures(THREE, scene, dimensions, PX_TO_WORLD, furniture = []) {
  const floorW = dimensions.width * PX_TO_WORLD
  const floorD = dimensions.height * PX_TO_WORLD

  // Place figure(s) in open areas of the room
  const figures = []

  // First figure: standing near center-right
  const fig1 = createHumanFigure(THREE, {
    style: 'male',
    opacity: 0.65,
    color: 0x37474F, // Dark blue-gray outfit
  })
  fig1.position.set(floorW * 0.65, 0, floorD * 0.55)
  fig1.rotation.y = -Math.PI * 0.15 // Slightly turned
  scene.add(fig1)
  figures.push(fig1)

  // Second figure (only in larger rooms): standing near left side
  if (floorW > 4 && floorD > 3) {
    const fig2 = createHumanFigure(THREE, {
      style: 'female',
      opacity: 0.6,
      color: 0x5D4037, // Brown outfit
    })
    fig2.position.set(floorW * 0.3, 0, floorD * 0.4)
    fig2.rotation.y = Math.PI * 0.25
    scene.add(fig2)
    figures.push(fig2)
  }

  return figures
}
