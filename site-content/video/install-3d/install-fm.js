// Installation overview video, floor mounted (2:20): the consensus order in research/install-guides/ (floor anchored
// pilasters, no headrail) played out in the three.js restroom from design/render3d, with close-ups of the parts that
// matter: the floor anchors and their leveling nuts, wall backing and brackets, a door's hinges and latch, and the
// firmness check that matters most without a headrail. Hardware is generic, not any
// one manufacturer's. Each step's parts glow orange. render.mjs calls window.frameAt(t) for every frame and
// screenshots the page. Units are inches.
import * as THREE from 'three'
import { buildScene } from '/design/render3d/scene.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'

const clamp = (x) => Math.max(0, Math.min(1, x))
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const win = (t, a, b, fi = 0.4, fo = 0.3) => clamp((t - a) / fi) * clamp((b - t) / fo)
const ORANGE = new THREE.Color('#fe7802'), ORANGE_E = new THREE.Color('#a84800')
const STYLE = 'floor-mounted'
const RUN = 168.5, MID = RUN / 2

// ---------- timeline: intro, nine steps, end card ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [6, 'Check the room against the drawings', [[0.3, 'First, check the room against the approved drawings.'], [3.5, 'The wall needs solid backing for the brackets,'], [6, 'and the floor must be sound concrete for the anchors.']]],
  [14, 'Lay out the stalls', [[0.3, 'Mark the pilaster line across the front,'], [3.5, 'then each panel line back to the wall,'], [6.5, 'and every anchor point.']]],
  [24, 'Set the floor anchors', [[0.3, 'Drill and set an anchor at each mark.'], [7.5, 'Bring the lower nuts to one level line,'], [11.5, 'taken from the highest point of the floor.']]],
  [40, 'Put up the wall brackets and panels', [[0.3, 'Fasten the wall brackets into the backing.'], [7.5, 'Set the panels on temporary supports.'], [12.5, 'Don\'t tighten anything yet.']]],
  [56, 'Lower the pilasters onto the anchors', [[0.3, 'Slide the shoe onto each pilaster and hold it up.'], [6.5, 'Lower the pilaster onto its anchors,'], [10, 'and connect it to its panel. Top nuts stay loose.']]],
  [70, 'Plumb, level, then tighten', [[0.3, 'Level the pilaster tops with each other.'], [7.5, 'Get each pilaster plumb both ways.'], [12, 'Set the door openings to the drawings,'], [15, 'then tighten the anchors and every bracket.']]],
  [88, 'Seat the shoes', [[0.3, 'Lower the shoes over the anchors,'], [5, 'and secure them.']]],
  [98, 'Hang the doors', [[0.3, 'Hang the doors on their hinges.'], [7.5, 'The accessible stall\'s door closes on its own.'], [13.5, 'Adjust each door until the gaps are even.']]],
  [116, 'Check the finished run', [[0.3, 'Push on each pilaster top.'], [3.5, 'It should feel firm, with no rocking at the floor.'], [9, 'Test every latch, including from outside.']]],
]
const END0 = 130, DURATION = 140
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t])) // step start times
export const CAPTIONS = [
  [0.4, 'Here is how floor mounted partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]

// camera keys: [time, position, target, fov]; a smooth spline through them
const P2 = 90.5 // centre of the third pilaster, the one the close-ups use
const CAM = [
  [0, [MID + 40, 74, 300], [MID, 36, -22], 40],
  [6, [MID + 10, 86, 270], [MID, 0, -24], 40],
  [9.5, [MID - 6, 66, 150], [MID - 6, 40, -60], 40],
  [11.5, [MID - 6, 78, 156], [MID - 6, 16, -44], 40],
  [14.5, [MID + 10, 86, 262], [MID, 0, -24], 40],
  [23.5, [MID, 90, 240], [MID, 0, -28], 40],
  // step 3: the anchors at one pilaster, then low along the front line for the level line
  [27, [P2 + 30, 34, 62], [P2, 2, -1], 40],
  [31, [P2 + 20, 30, 54], [P2, 2, -1], 40],
  [34, [RUN + 14, 24, 62], [MID - 18, 1, -1], 40],
  [39, [RUN + 6, 22, 56], [MID - 22, 1, -1], 40],
  // step 4: wall brackets in the backing, with the layout lines in view, then the panels from above
  [42, [MID + 30, 92, 100], [MID - 6, 30, -52], 44],
  [46.5, [MID + 18, 86, 88], [MID - 12, 30, -52], 44],
  [49.5, [RUN + 20, 175, 125], [MID - 6, 8, -36], 40],
  [55.5, [RUN + 6, 168, 112], [MID - 6, 8, -36], 40],
  // step 5: a pilaster coming down onto its anchors, then the whole run
  [58.5, [P2 + 44, 42, 100], [P2, 20, -1], 40],
  [64, [P2 + 32, 36, 84], [P2, 14, -1], 40],
  [67, [MID + 30, 64, 290], [MID, 45, -14], 40],
  [69.5, [MID + 20, 64, 278], [MID, 45, -14], 40],
  // step 6: level line across the tops, plumb, door opening, then the tightened anchors
  [73, [RUN * 0.66, 46, 178], [RUN * 0.6, 64, -4], 40],
  [77, [RUN * 0.56, 48, 186], [RUN * 0.5, 62, -4], 40],
  [80, [P2 + 22, 50, 140], [P2 - 4, 40, -4], 40],
  [84, [P2 + 12, 52, 150], [P2 - 10, 40, -4], 40],
  [86, [P2 + 30, 34, 70], [P2, 9, -1], 40],
  [88.5, [P2 + 24, 32, 66], [P2, 9, -1], 40],
  // step 7: shoes
  [90, [RUN * 0.66, 48, 178], [RUN * 0.6, 22, -4], 40],
  [97.5, [RUN * 0.6, 46, 170], [RUN * 0.55, 20, -4], 40],
  // step 8: doors, the accessible door's swing, even gaps
  [100.5, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [104, [RUN * 0.38, 58, 156], [RUN * 0.24, 44, -2], 40],
  [106.5, [46, 62, 96], [16, 46, 6], 40],
  [110.5, [44, 62, 92], [16, 46, 6], 40],
  [113.5, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [116, [RUN * 0.4, 58, 160], [RUN * 0.26, 44, -2], 40],
  // step 9: the push test on a pilaster top, then the latch
  [118.5, [P2 + 44, 66, 130], [P2, 44, -4], 40],
  [123, [P2 + 34, 64, 120], [P2, 44, -4], 40],
  [125.5, [62, 50, 76], [32, 40, 0], 40],
  [128, [58, 50, 72], [32, 40, 0], 40],
  [131, [MID + 12, 62, 264], [MID, 50, -14], 40],
  [140, [MID - 8, 62, 244], [MID, 48, -14], 40],
]

// when each part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { hw: [S[3] + 2, 0.3], wbracket: [S[4] + 1.5, 0.35], panel: [S[4] + 9.5, 0.5], pilaster: [S[5] + 6.5, 0.5], shoe: [S[5] + 1, 0.3], door: [S[8] + 1, 0.5], grab: [S[9] + 12, 0] }
const GLOW = { hw: [S[3] + 2, S[4] - 0.3], wbracket: [S[4] + 1.5, S[4] + 8], panel: [S[4] + 9.5, S[5]], pilaster: [S[5] + 6.5, S[6] - 0.2], shoe: [S[5] + 1, S[5] + 6.3], door: [S[8] + 1, S[9] - 0.2], grab: [S[9] + 12, S[9] + 14] }
const GLOW2 = { shoe: [S[7] + 1, S[8] - 0.3], hw: [S[6] + 15, S[7] - 0.3] } // a second glow: shoes seated, anchors tightened
const SHOE_UP = 7, SHOE_DOWN = [S[7] + 2.5, 0.4] // shoes ride up on the pilaster until step 7
const SWING = [S[8] + 8.8, S[8] + 11.3] // the accessible door opens, then closes on its own
const DROP = 26 // how far above its anchors a pilaster starts

// ---------- camera spline (Hermite over uneven times, zero speed at the ends) ----------
function spline(keys, t) {
  const n = keys.length
  if (t <= keys[0][0]) return keys[0]
  if (t >= keys[n - 1][0]) return keys[n - 1]
  let i = 0; while (keys[i + 1][0] < t) i++
  const [t0, t1] = [keys[i][0], keys[i + 1][0]], h = t1 - t0, u = (t - t0) / h
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2
  // monotone tangents (Fritsch-Carlson): no overshoot, so the camera never swings past a close-up into a wall or floor
  const tan = (j, get) => {
    if (j <= 0 || j >= n - 1) return 0
    const a = (get(keys[j]) - get(keys[j - 1])) / (keys[j][0] - keys[j - 1][0]), b = (get(keys[j + 1]) - get(keys[j])) / (keys[j + 1][0] - keys[j][0])
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b)
  }
  const comp = (get) => h00 * get(keys[i]) + h10 * h * tan(i, get) + h01 * get(keys[i + 1]) + h11 * h * tan(i + 1, get)
  return [t, [0, 1, 2].map((c) => comp((k) => k[1][c])), [0, 1, 2].map((c) => comp((k) => k[2][c])), comp((k) => k[3])]
}

// ---------- 3D ----------
let renderer, composer, camera, scene, spec, P = {}, door0
const tagged = [], marks = [], supports = [], backing = []
const CANVAS = document.getElementById('gl')
function setup({ specs, width, height, gl = 1 }) {
  P = { width, height, gl }
  spec = specs[STYLE]
  renderer = new THREE.WebGLRenderer({ canvas: CANVAS, antialias: false, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1); renderer.setSize(width * gl, height * gl, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false
  camera = new THREE.PerspectiveCamera(40, width / height, 2, 3000)
  scene = buildScene({ spec, finish: 'cream', renderer, view: 'angle' })
  addHardware()
  scene.traverse((o) => {
    if (!o.isMesh || !o.userData.part) return
    // the panel group includes its brackets: thin chrome pieces. The ones on the back wall go up first, on their own.
    if (o.userData.part === 'panel') {
      const b = new THREE.Box3().setFromObject(o)
      if (b.max.x - b.min.x < 0.5 && (b.min.z + b.max.z) / 2 < -spec.depth / 2) o.userData.part = 'wbracket'
    }
    o.material = o.material.clone(); o.material.transparent = true
    o.userData.p0 = o.position.clone(); tagged.push(o)
  })
  hingeDoor()
  addMarks(); addSupports(); addBacking()
  const W = width * gl, H = height * gl
  composer = new EffectComposer(renderer)
  composer.setPixelRatio(1); composer.setSize(W, H)
  composer.addPass(new RenderPass(scene, camera))
  const ao = new GTAOPass(scene, camera, W, H)
  ao.updateGtaoMaterial({ radius: 14, distanceExponent: 1.4, thickness: 6, scale: 1.1, samples: 16 }); ao.blendIntensity = 0.85
  if (!location.search.includes('noao')) composer.addPass(ao)
  composer.addPass(new OutputPass())
  if (!location.search.includes('nosmaa')) composer.addPass(new SMAAPass(W, H))
  renderer.shadowMap.needsUpdate = true
}
// generic floor anchors under each pilaster: a threaded stud set in the concrete, with a washer and lower leveling nut.
// The pilaster's base bracket sits on the nuts; the shoe covers it all at the end.
const anchors = [] // [x, z] of every stud
function addHardware() {
  const steel = new THREE.MeshStandardMaterial({ color: '#8d949a', metalness: 0.7, roughness: 0.4 })
  const T = spec.pil.t
  spec.pilasters.forEach((p, idx) => {
    const add = (m) => { m.userData = { part: 'hw', idx }; m.castShadow = true; scene.add(m) }
    for (const x of p.w > 4 ? [p.x + 1.4, p.x + p.w - 1.4] : [p.x + p.w / 2]) {
      anchors.push([x, -T / 2])
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3, 16), steel)
      stud.position.set(x, 1.5, -T / 2); add(stud)
      const washer = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 24), steel)
      washer.position.set(x, 0.62, -T / 2); add(washer)
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 6), steel)
      nut.position.set(x, 0.4, -T / 2); add(nut)
    }
  })
}
// the accessible door (index 0) turns about its hinge line, so it can swing open and close again
function hingeDoor() {
  const d = spec.doors[0], hx = d.x + spec.door.gap / 2, hz = 0.14
  door0 = new THREE.Group(); door0.position.set(hx, 0, hz); scene.add(door0)
  for (const o of tagged.filter((o) => o.userData.part === 'door' && o.userData.idx === 0)) {
    if (o.geometry.type === 'CylinderGeometry' && Math.abs(o.position.x - hx) < 0.3) continue // the knuckles stay put
    scene.remove(o); door0.add(o); o.position.sub(door0.position); o.userData.p0 = o.position.clone()
  }
}
// orange chalk lines: the pilaster line across the front, each panel line to the back wall, each pilaster's footprint
function addMarks() {
  const m = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, polygonOffset: true, polygonOffsetFactor: -4 })
  const T = spec.pil.t, w = 0.6
  const strip = (x0, x1, z0, z1, along, order) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.rotation.x = -Math.PI / 2; s.renderOrder = 4
    s.userData = { x0, x1, z0, z1, along, order }; scene.add(s); marks.push(s)
  }
  strip(0, spec.run, -T - w / 2, -T + w / 2, 'x', 0)
  strip(0, spec.run, -w / 2, w / 2, 'x', 0)
  spec.panels.forEach((px, i) => strip(px - w / 2, px + w / 2, -T, -spec.depth, 'z', 2.6 + i * 0.5))
  spec.pilasters.forEach((p, i) => { strip(p.x, p.x + w, -T, 0, 'z', 4.6 + i * 0.15); strip(p.x + p.w - w, p.x + p.w, -T, 0, 'z', 4.6 + i * 0.15) })
  anchors.forEach(([x, z], i) => { strip(x - 1.1, x + 1.1, z - 0.3, z + 0.3, 'x', 6.6 + i * 0.12); strip(x - 0.3, x + 0.3, z - 1.1, z + 1.1, 'z', 6.6 + i * 0.12) })
}
// temporary supports: a wood block under each end of each panel until everything is tightened
function addSupports() {
  const wood = new THREE.MeshStandardMaterial({ color: '#b98c5a', roughness: 0.85, transparent: true })
  const { y0, front, backGap } = spec.panel
  for (const px of spec.panels) for (const z of [-front - 6, -spec.depth + backGap + 6]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.5, y0, 3.5), wood)
    b.position.set(px, y0 / 2, z); b.castShadow = b.receiveShadow = true; scene.add(b); supports.push(b)
  }
}
// wall backing, shown as an x-ray outline on the wall behind each panel's brackets
function addBacking() {
  const fill = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })
  const line = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true })
  const rect = (w, h, pos, rotY) => {
    const g = new THREE.PlaneGeometry(w, h), m = new THREE.Mesh(g, fill.clone()), l = new THREE.LineSegments(new THREE.EdgesGeometry(g), line.clone())
    for (const o of [m, l]) { o.position.set(...pos); o.rotation.y = rotY; o.renderOrder = 5; scene.add(o); backing.push(o) }
  }
  for (const px of spec.panels) rect(10, 62, [px, 41, -spec.depth + 0.08], 0)
}
let lastPose = ''
function pose(t) {
  let moving = false
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    let k = 1, dx = 0, dy = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'wbracket') dy = 0
    // anchors come up out of their drilled holes
    if (part === 'hw') dy = -(1 - easeOut(k)) * 3.2
    // pilasters come down slowly onto their anchors, the shoe riding with them
    if (part === 'pilaster' || part === 'shoe') {
      const [s, st] = IN.pilaster, r = ease((t - s - idx * st) / 1.6)
      dy = (1 - r) * DROP
      if (part === 'shoe') { k = clamp((t - IN.shoe[0] - idx * IN.shoe[1]) / 0.6); dy += SHOE_UP * (1 - ease((t - SHOE_DOWN[0] - idx * SHOE_DOWN[1]) / 0.8)) }
      else k = clamp((t - S[5] - 0.3 - idx * 0.15) / 0.6) // in view, held up, from the start of the step
    }
    if (part === 'contact') { m.opacity = 0.7 * clamp((t - SHOE_DOWN[0] - idx * SHOE_DOWN[1] - 0.6) / 0.4); o.visible = m.opacity > 0.01; continue }
    if (part === 'ceiling' || part === 'downlight') {
      // fade the ceiling out while the camera is above it (step 3's view over the stalls)
      const c = clamp((104 - camera.position.y) / 8)
      if (part === 'ceiling') { m.opacity = c; m.depthWrite = c > 0.99; o.visible = c > 0.01 } else o.visible = c > 0.5
      continue
    }
    m.opacity = clamp(k * 1.4)
    o.visible = m.opacity > 0.01
    o.position.set(o.userData.p0.x + dx, o.userData.p0.y + dy, o.userData.p0.z)
    if (dx || (dy && o.visible)) moving = true
    const g = GLOW[part], g2 = GLOW2[part]
    const gi = Math.max(g ? win(t, g[0], g[1], 0.5, 0.6) * 0.85 : 0, g2 ? win(t, g2[0], g2[1], 0.5, 0.6) * 0.85 : 0)
    if (m.emissive) {
      if (!o.userData.e0) { o.userData.e0 = m.emissive.clone(); o.userData.c0 = m.color.clone() }
      m.emissive.copy(o.userData.e0).lerp(ORANGE_E, Math.min(1, gi * 1.2)); m.color.copy(o.userData.c0).lerp(ORANGE, Math.min(1, gi * 1.3)); m.emissiveIntensity = 1
    }
  }
  // the accessible door swings out, then closes on its own
  const a = ease((t - SWING[0]) / 1.8) * (1 - ease((t - SWING[1]) / 2.0))
  if (door0.rotation.y !== -a * 0.95) moving = true
  door0.rotation.y = -a * 0.95
  // chalk lines draw on during step 2 and fade once the stalls are complete
  const mo = 1 - clamp((t - S[9]) / 1.5)
  for (const s of marks) {
    const { x0, x1, z0, z1, along, order } = s.userData
    const r = ease((t - S[2] - 0.6 - order) / 1.6)
    const X1 = along === 'x' ? x0 + (x1 - x0) * r : x1, Z1 = along === 'z' ? z0 + (z1 - z0) * r : z1
    s.visible = r > 0.001 && mo > 0.01; s.material.opacity = mo
    s.scale.set(Math.max(0.01, Math.abs(X1 - x0)), Math.max(0.01, Math.abs(Z1 - z0)), 1)
    s.position.set((x0 + X1) / 2, 0.06, (z0 + Z1) / 2)
  }
  // supports go in just before the panels and come out once everything is tightened
  supports.forEach((b, i) => {
    const v = clamp((t - IN.panel[0] + 1 - Math.floor(i / 2) * 0.5) / 0.5) * (1 - clamp((t - S[6] - 16) / 0.8))
    b.material.opacity = v; b.visible = v > 0.01
  })
  // the wall backing shows in step 1 and again while the wall brackets go up
  const bk = win(t, S[1] + 2.5, S[2], 1, 1) + win(t, S[4], S[4] + 8.5, 1, 1) * (0.8 + 0.2 * Math.sin(t * 3))
  for (const o of backing) { o.material.opacity = (o.isLineSegments ? 1 : 0.3) * bk; o.visible = bk > 0.01 }
  const key = tagged.map((o) => (o.visible ? o.position.y.toFixed(2) + o.position.x.toFixed(1) : 'h')).join() + supports.map((b) => b.visible).join()
  if (moving || key !== lastPose) renderer.shadowMap.needsUpdate = true
  lastPose = key
}
function aim(t) {
  const [, p, tg, fov] = spline(CAM, t)
  camera.position.set(...p); camera.fov = fov; camera.aspect = P.width / P.height
  camera.updateProjectionMatrix(); camera.lookAt(...tg)
}
function project(v) {
  const p = new THREE.Vector3(...v).project(camera)
  return [((p.x + 1) / 2) * P.width, ((1 - p.y) / 2) * P.height]
}

// ---------- overlay ----------
const $ = (s) => document.querySelector(s)
const ov = $('#ov'), cap = $('#cap span'), stepEl = $('#step'), hookEl = $('#hook'), endEl = $('#end')
$('#dots').innerHTML = STEPS.map(() => '<i></i>').join('')
const dots = [...document.querySelectorAll('#dots i')]
// callouts pinned to 3D points: [from, to, point, text, dx, dy]; at most three at once
const pil = (i) => spec.pilasters[i]
const ANC = () => anchors.find(([x]) => x > pil(2).x) // the first anchor under the third pilaster
const LABELS = [
  [S[1] + 2.5, S[2] - 0.2, () => [spec.panels[1], 50, -spec.depth], 'Solid backing in the wall', 80, -140],
  [S[1] + 5.5, S[2] - 0.2, () => [MID - 6, 0.1, -30], 'Sound concrete floor', -80, 110],
  [S[2] + 7, S[3] - 0.2, () => [ANC()[0], 0.1, ANC()[1]], 'Anchor point', 70, -110],
  [S[3] + 3, S[3] + 7.4, () => [ANC()[0], 2.6, ANC()[1]], 'Anchor set in the concrete', 70, -110],
  [S[3] + 3.6, S[3] + 7.4, () => [ANC()[0] + 0.5, 0.45, ANC()[1] + 0.3], 'Lower leveling nut', 80, 90],
  [S[3] + 9.5, S[4] - 0.3, () => [anchors[2][0], 0.7, anchors[2][1]], 'Lower nuts on one level line', 40, -120],
  [S[4] + 3, S[4] + 8.3, () => [spec.panels[0] + 0.6, 64, -spec.depth + 1], 'Wall bracket, fastened into the backing', 70, -110],
  [S[4] + 11.5, S[5] - 0.3, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Temporary support', 90, -120],
  [S[5] + 2, S[5] + 6.3, () => [pil(2).x + pil(2).w / 2, spec.pil.y0 + SHOE_UP + DROP + 2, 0.2], 'Shoe slid on and held up', 80, -60],
  [S[5] + 8.3, S[6] - 3.2, () => [ANC()[0], 1.2, 0.2], 'Onto the anchors, top nuts loose', 70, -120],
  [S[6] + 1, S[6] + 6.6, () => [pil(3).x + pil(3).w / 2, spec.pil.y1, 0], 'Tops level with each other', 60, -110],
  [S[6] + 8.5, S[6] + 12.3, () => [pil(2).x + pil(2).w, 40, 0], 'Plumb both ways', 80, -100],
  [S[6] + 12.6, S[6] + 15.6, () => [(pil(1).x + pil(1).w + pil(2).x) / 2, 60, 0], 'Door opening to the drawings', 40, -100],
  [S[6] + 16, S[7] - 0.3, () => [pil(2).x + pil(2).w / 2, 2, 0.3], 'No headrail: each pilaster stands on its anchors', 70, -120],
  [S[8] + 8.4, S[8] + 13, () => [spec.doors[0].x, spec.hinge.tops[0] - 2, 0.4], 'Hinges set the resting position', 70, -80],
  [S[8] + 14, S[9] - 0.3, () => [pil(2).x - 0.15, 46, 0.3], 'Even gaps', 70, -110],
  [S[7] + 4, S[8] - 0.4, () => [P2, 2, 0.5], 'The shoe covers the anchors', 70, -120],
  [S[9] + 2.6, S[9] + 8.4, () => [P2, spec.pil.y1 - 2, 0.6], 'Firm, no rocking at the floor', 70, -100],
  [S[9] + 9.5, S[9] + 12.8, () => [spec.doors[0].x + spec.doors[0].w - spec.latch.fromEdge, spec.latch.y, 0.6], 'Opens from outside in an emergency', 60, -110],
]
function label(slot, [a, b, at, text, dx, dy], t) {
  const el = document.getElementById('l' + slot)
  const r = win(t, a, b)
  const [x, y] = project(at())
  el.textContent = text; el.style.opacity = r
  const w = el.offsetWidth, h = el.offsetHeight, bx = x + dx, by = y + dy
  const left = Math.max(30, Math.min(P.width - w - 30, bx - (dx < 0 ? w : 0)))
  el.style.left = left + 'px'; el.style.top = by - h / 2 + 'px'
  const ex = Math.max(left, Math.min(left + w, x)), ey = by + (y > by ? h / 2 : -h / 2)
  return `<g opacity="${r}"><line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#fe7802" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${18 * r}" fill="none" stroke="#fe7802" stroke-width="5"/></g>`
}
const dashed = (p0, p1, r, d = 1) => {
  const [x0, y0] = project(p0), [x1, y1] = project(p1)
  return `<line x1="${x0}" y1="${y0}" x2="${x0 + (x1 - x0) * d}" y2="${y0 + (y1 - y0) * d}" stroke="#fe7802" stroke-width="5" stroke-dasharray="18 12" opacity="${r}"/>`
}
// step 3: the level line across the lower nuts; step 6: a level line across the tops, a plumb line down a pilaster,
// a door opening's width; step 9: a push arrow at a pilaster top
function guides(t) {
  let s = ''
  let r = win(t, S[3] + 7.6, S[4] - 0.3, 0.6, 0.4)
  if (r > 0) { const a = anchors[0], b = anchors[anchors.length - 1]; s += dashed([a[0] - 3, 0.62, a[1]], [b[0] + 3, 0.62, b[1]], r, ease((t - S[3] - 7.6) / 2)) }
  const y1 = spec.pil.y1 + 0.4, pn = pil(spec.pilasters.length - 1)
  r = win(t, S[6] + 0.6, S[6] + 7, 0.6, 0.4)
  if (r > 0) s += dashed([pil(0).x, y1, 0], [pn.x + pn.w, y1, 0], r, ease((t - S[6] - 0.6) / 1.4))
  r = win(t, S[6] + 7.6, S[6] + 12.5, 0.5, 0.4)
  if (r > 0) s += dashed([pil(2).x + pil(2).w + 0.2, y1, 0.2], [pil(2).x + pil(2).w + 0.2, 0.5, 0.2], r, ease((t - S[6] - 7.6) / 1.2))
  r = win(t, S[6] + 12.3, S[6] + 15.6, 0.5, 0.3)
  if (r > 0) {
    const a = project([pil(1).x + pil(1).w, 60, 0.3]), b = project([pil(2).x, 60, 0.3])
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
      `<line x1="${a[0]}" y1="${a[1] - 22}" x2="${a[0]}" y2="${a[1] + 22}"/><line x1="${b[0]}" y1="${b[1] - 22}" x2="${b[0]}" y2="${b[1] + 22}"/></g>`
  }
  r = win(t, S[9] + 0.8, S[9] + 8.4, 0.5, 0.4)
  if (r > 0) {
    // a hand-push arrow towards the pilaster top, pulsing twice
    const [x, y] = project([P2, spec.pil.y1 - 2, 0.6]), p = Math.abs(Math.sin((t - S[9] - 0.8) * Math.PI / 1.4)) * 18
    const x0 = x + 150 - p, x1 = x + 34 - p
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="10" stroke-linecap="round" fill="#fe7802"><line x1="${x0}" y1="${y}" x2="${x1 + 16}" y2="${y}"/>` +
      `<path d="M${x1} ${y} l28 -20 v40 z" stroke-width="4"/></g>`
  }
  return s
}

window.frameAt = function (t) {
  aim(t); pose(t); composer.render()
  // place labels in three slots, by the order they are active
  const active = LABELS.filter(([a, b]) => t > a && t < b).slice(0, 3)
  ov.innerHTML = active.map((l, i) => label(i, l, t)).join('') + guides(t)
  for (let i = active.length; i < 3; i++) document.getElementById('l' + i).style.opacity = 0
  // intro title
  hookEl.style.opacity = clamp((S[1] - t) / 0.7)
  $('#hook .txt').style.opacity = clamp((t - 0.3) / 0.8) * clamp((S[1] - 0.2 - t) / 0.5)
  // step card
  const si = STEPS.findLastIndex(([s]) => t >= s), inStep = si >= 0 && t < END0
  if (inStep) {
    const [s0] = STEPS[si], s1 = si + 1 < STEPS.length ? STEPS[si + 1][0] : END0
    stepEl.style.opacity = win(t, s0, s1)
    stepEl.querySelector('.num').textContent = si + 1
    stepEl.querySelector('.of').textContent = `Step ${si + 1} of ${STEPS.length}`
    stepEl.querySelector('h2').textContent = STEPS[si][1]
  } else stepEl.style.opacity = 0
  dots.forEach((d, j) => (d.className = inStep && j <= si ? 'on' : ''))
  $('#dots').style.opacity = inStep ? 1 : 0
  // end card
  endEl.style.opacity = clamp((t - END0) / 0.6)
  endEl.querySelectorAll('.e').forEach((el, j) => { const a = easeOut((t - END0 - 0.3 - j * 0.3) / 0.6); el.style.opacity = a; el.style.transform = `translateY(${20 * (1 - a)}px)` })
  $('#brand').style.opacity = t >= END0 ? 0 : 1
  $('#brand').style.color = t < S[1] ? '#fbfaf9' : '#1c0e05'
  // captions
  let c = CAPTIONS[0]; for (const x of CAPTIONS) if (t >= x[0]) c = x
  cap.textContent = c[1]
  cap.parentElement.style.opacity = t < c[0] ? 0 : clamp((t - c[0]) / 0.25)
  return true
}
window.DURATION = DURATION
window.setupFilm = setup
window.__ready = true
