// Installation overview video, floor to ceiling (2:20): the consensus order in research/install-guides/ (pilasters
// fixed at the floor and at the ceiling, no headrail; plan in video-floor-to-ceiling-plan.md) played out in the
// three.js restroom from design/render3d, with close-ups of the parts that matter: the structure above the ceiling
// (drawn as an x-ray outline), the layout carried plumb from the floor to the ceiling, the floor and ceiling brackets,
// the leveling bolt that raises each pilaster snug to the ceiling, and the shoes at both ends. Hardware is generic,
// not any one manufacturer's. Each step's parts glow orange. render.mjs calls window.frameAt(t) for every frame and
// screenshots the page. Units are inches. The camera stays below the ceiling throughout.
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
const STYLE = 'floor-to-ceiling'
const RUN = 168.5, MID = RUN / 2

// ---------- timeline: intro, nine steps, end card ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [6, 'Check the room against the drawings', [[0.3, 'First, check the room against the approved drawings.'], [2.6, 'Measure floor to ceiling at every pilaster.'], [5, 'There must be solid structure above the ceiling,'], [7.2, 'and solid backing in the walls.']]],
  [15, 'Lay out the floor and the ceiling', [[0.3, 'Mark the pilaster and panel lines on the floor.'], [4.5, 'Then carry each pilaster point straight up'], [7.2, 'to the ceiling, with a plumb line or a laser.']]],
  [26, 'Fasten the brackets', [[0.3, 'Fasten the wall brackets into the backing.'], [6, 'Anchor a bracket to the floor at each pilaster mark,'], [11, 'and one to the ceiling, bolted into the steel above.']]],
  [42, 'Set the panels on supports', [[0.3, 'Set the panels into the wall brackets,'], [3.5, 'resting on temporary supports.'], [6.5, 'Don\'t tighten anything yet.']]],
  [52, 'Stand the pilasters', [[0.3, 'Slide a shoe onto each end and hold them clear.'], [5.5, 'Stand the pilaster on its floor bracket, under the ceiling bracket.'], [10.3, 'Turn the leveling bolt to raise it snug to the ceiling.'], [15, 'Connect it to its panel. Keep it loose.']]],
  [70, 'Plumb, then tighten both ends', [[0.3, 'Get each pilaster plumb both ways.'], [5, 'Set the door openings to the drawings,'], [9.5, 'then tighten at the floor, at the ceiling'], [12.5, 'and at every bracket.']]],
  [86, 'Seat both shoes', [[0.3, 'Lower the bottom shoe to the floor,'], [3, 'raise the top shoe to the ceiling, and secure them.'], [7, 'Then take out the temporary supports.']]],
  [96, 'Hang the doors', [[0.3, 'Hang the doors on their hinges.'], [7.5, 'The accessible stall\'s door closes on its own.'], [13.5, 'Adjust each door until the gaps are even.']]],
  [114, 'Check the finished run', [[0.3, 'Check every pilaster is still plumb,'], [3.5, 'and tight at the floor and the ceiling.'], [9, 'Test every latch, including from outside.']]],
]
const END0 = 130, DURATION = 140
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t])) // step start times
export const CAPTIONS = [
  [0.4, 'Here is how floor to ceiling partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]

// camera keys: [time, position, target, fov]; a smooth spline through them. All below the ceiling (96").
const P2 = 90.5 // centre of the third pilaster, the one the close-ups use
const CAM = [
  [0, [MID + 40, 74, 300], [MID, 40, -22], 40],
  [6, [MID + 10, 60, 262], [MID, 48, -24], 40],
  [10, [MID + 14, 44, 160], [MID, 58, -20], 44],
  [14.5, [MID + 4, 44, 152], [MID, 56, -20], 44],
  [25.5, [MID - 8, 44, 146], [MID, 48, -20], 44],
  // step 3: wall brackets in the backing, then a floor bracket, then looking up at a ceiling bracket
  [28.5, [MID + 30, 72, 100], [MID - 6, 38, -52], 44],
  [31.5, [MID + 18, 68, 90], [MID - 12, 38, -52], 44],
  [34, [P2 + 18, 17, 36], [P2, 2, -1], 40],
  [37, [P2 + 14, 15, 32], [P2, 2, -1], 40],
  [39.2, [P2 + 20, 74, 36], [P2, 95, -1], 40],
  [41.8, [P2 + 16, 76, 32], [P2, 95, -1], 40],
  // step 4: the panels on their supports, into the stalls from the front
  [44.5, [MID + 40, 74, 160], [MID - 6, 26, -36], 40],
  [51.5, [MID + 30, 72, 150], [MID - 6, 26, -36], 40],
  // step 5: a pilaster held in front with its shoes, sliding in, the top gap closing, then the run
  [54.5, [P2 + 56, 46, 226], [P2, 48, 26], 40],
  [57, [P2 + 50, 46, 218], [P2, 48, 22], 40],
  [59.8, [MID + 30, 50, 250], [MID, 48, -6], 40],
  [62.6, [P2 + 40, 60, 90], [P2 + 6, 90, -1], 40],
  [66, [P2 + 36, 62, 84], [P2 + 6, 90, -1], 40],
  [68.6, [MID + 30, 54, 260], [MID, 48, -10], 40],
  [69.8, [MID + 26, 54, 254], [MID, 48, -10], 40],
  // step 6: plumb, a door opening, then a pilaster tightened at both ends
  [72.5, [P2 + 40, 50, 175], [P2, 48, -4], 40],
  [75, [P2 + 30, 50, 170], [P2 - 4, 48, -4], 40],
  [77.5, [P2 + 12, 50, 150], [P2 - 10, 44, -4], 40],
  [79.5, [P2 + 8, 50, 146], [P2 - 10, 44, -4], 40],
  [81.8, [P2 + 50, 46, 166], [P2, 50, -2], 40],
  [85.5, [P2 + 44, 46, 160], [P2, 50, -2], 40],
  // step 7: the shoes, full height of the run
  [88, [RUN * 0.7, 48, 210], [RUN * 0.55, 48, -4], 40],
  [95.5, [RUN * 0.62, 48, 200], [RUN * 0.5, 48, -4], 40],
  // step 8: doors, the accessible door's swing, even gaps
  [98.5, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [102, [RUN * 0.38, 58, 156], [RUN * 0.24, 44, -2], 40],
  [104.5, [46, 62, 96], [16, 46, 6], 40],
  [108.5, [44, 62, 92], [16, 46, 6], 40],
  [111.5, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [114, [RUN * 0.4, 58, 160], [RUN * 0.26, 44, -2], 40],
  // step 9: the push test on a pilaster, then the latch
  [116.5, [P2 + 50, 50, 160], [P2, 48, -4], 40],
  [121, [P2 + 40, 50, 150], [P2, 48, -4], 40],
  [123.5, [62, 50, 76], [32, 40, 0], 40],
  [127, [58, 50, 72], [32, 40, 0], 40],
  [131, [MID + 12, 56, 264], [MID, 50, -14], 40],
  [140, [MID - 8, 56, 244], [MID, 48, -14], 40],
]

// when each part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { wbracket: [S[3] + 1.5, 0.35], fbr: [S[3] + 6, 0.25], cbr: [S[3] + 11, 0.25], panel: [S[4] + 1.5, 0.5], door: [S[8] + 1, 0.5], grab: [S[9] + 12, 0] }
const GLOW = { wbracket: [S[3] + 1.5, S[3] + 6], fbr: [S[3] + 6, S[3] + 10.8], bolt: [S[3] + 6, S[3] + 10.8], cbr: [S[3] + 11, S[4] - 0.3], panel: [S[4] + 1.5, S[5]], pilaster: [S[5] + 5.5, S[6] - 0.2], shoe: [S[5] + 1, S[5] + 5.3], cshoe: [S[5] + 1, S[5] + 5.3], door: [S[8] + 1, S[9] - 0.2], grab: [S[9] + 12, S[9] + 14] }
const GLOW2 = { shoe: [S[7] + 1, S[8] - 0.3], cshoe: [S[7] + 1, S[8] - 0.3], fbr: [S[6] + 9.5, S[7] - 0.3], cbr: [S[6] + 9.5, S[7] - 0.3], bolt: [S[5] + 10.3, S[5] + 14.5] }
const SHOE_OFF = 7 // the shoes ride on the pilaster, held clear of each end, until step 7
const SHOE_SEAT = [S[7] + 1.2, 0.35]
const SLIDE = [S[5] + 5.5, 0.4], SLIDE_Z = 30 // pilasters slide in from the front onto their floor brackets
const JACK = [S[5] + 10.5, 0.3] // then the leveling bolt raises each one until it meets its ceiling bracket
const BR = 1.3 // height of the floor and ceiling bracket boxes
const LOW = 1.9, HIGH = 3.1, LEN = 96 - BR - HIGH // the pilaster's foot before and after leveling; its top closes a 1.2" gap to the ceiling bracket
const SWING = [S[8] + 8.8, S[8] + 11.3] // the accessible door opens, then closes on its own
const STEEL_Y = [99.5, 103.5] // structure above the ceiling (x-ray)

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
const tagged = [], marks = [], supports = [], backing = [], xray = []
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
  addMarks(); addSupports(); addBacking(); addSteel()
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
// generic hardware at each fixing point under a pilaster: on the floor, a channel bracket anchored to the slab with a
// leveling bolt in it that the pilaster's foot sits on; on the ceiling, the same channel upside down, bolted up through
// the ceiling into the structure above. The shoes cover both at the end.
const fix = [] // [x, pilaster idx] of every fixing point
function addHardware() {
  const steel = new THREE.MeshStandardMaterial({ color: '#8d949a', metalness: 0.7, roughness: 0.4 })
  const T = spec.pil.t, C = spec.ceiling, zc = -T / 2
  const mk = (geo, part, idx, x, y, z) => { const m = new THREE.Mesh(geo, steel); m.position.set(x, y, z); m.userData = { part, idx }; m.castShadow = m.receiveShadow = true; scene.add(m); return m }
  const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d)
  spec.pilasters.forEach((p, pi) => {
    for (const x of p.w > 4 ? [p.x + 1.4, p.x + p.w - 1.4] : [p.x + p.w / 2]) {
      const idx = fix.length; fix.push([x, pi])
      // floor bracket: a base plate anchored at both ends, a box with a bridge on top, the leveling bolt and its nut
      mk(bx(3.4, 0.15, T + 0.8), 'fbr', idx, x, 0.075, zc)
      for (const s of [-1, 1]) mk(bx(2.2, BR - 0.15, 0.15), 'fbr', idx, x, (BR + 0.15) / 2, zc + s * (T / 2 + 0.075))
      mk(bx(2.2, 0.15, T + 0.3), 'fbr', idx, x, BR + 0.075, zc)
      for (const s of [-1, 1]) mk(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16), 'fbr', idx, x + s * 1.35, 0.22, zc)
      const nut = mk(new THREE.CylinderGeometry(0.5, 0.5, 0.32, 6), 'fbr', idx, x, BR + 0.31, zc); nut.userData.nut = pi
      const bolt = mk(new THREE.CylinderGeometry(0.26, 0.26, 1, 16), 'bolt', idx, x, 1, zc); bolt.userData.pil = pi
      // ceiling bracket: the same box upside down, its plate screwed up through the ceiling into the steel
      mk(bx(3.4, 0.15, T + 0.8), 'cbr', idx, x, C - 0.075, zc)
      for (const s of [-1, 1]) mk(bx(2.2, BR - 0.15, 0.15), 'cbr', idx, x, C - (BR + 0.15) / 2, zc + s * (T / 2 + 0.075))
      mk(bx(2.2, 0.15, T + 0.3), 'cbr', idx, x, C - BR - 0.075, zc)
      for (const s of [-1, 1]) mk(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16), 'cbr', idx, x + s * 1.35, C - 0.2, zc)
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
// orange chalk lines: the pilaster line across the front, each panel line to the back wall, each pilaster's footprint,
// a cross at every fixing point; then the same crosses on the ceiling, carried straight up
function addMarks() {
  const m = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, polygonOffset: true, polygonOffsetFactor: -4 })
  const T = spec.pil.t, w = 0.6, C = spec.ceiling
  const strip = (x0, x1, z0, z1, along, order, y = 0.06) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.rotation.x = y > 1 ? Math.PI / 2 : -Math.PI / 2; s.renderOrder = 4
    s.userData = { x0, x1, z0, z1, along, order, y }; scene.add(s); marks.push(s)
  }
  strip(0, spec.run, -T - w / 2, -T + w / 2, 'x', 0)
  strip(0, spec.run, -w / 2, w / 2, 'x', 0)
  spec.panels.forEach((px, i) => strip(px - w / 2, px + w / 2, -T, -spec.depth, 'z', 1.4 + i * 0.4))
  spec.pilasters.forEach((p, i) => { strip(p.x, p.x + w, -T, 0, 'z', 2.8 + i * 0.12); strip(p.x + p.w - w, p.x + p.w, -T, 0, 'z', 2.8 + i * 0.12) })
  fix.forEach(([x], i) => {
    const z = -T / 2
    strip(x - 1.1, x + 1.1, z - 0.3, z + 0.3, 'x', 3.6 + i * 0.08); strip(x - 0.3, x + 0.3, z - 1.1, z + 1.1, 'z', 3.6 + i * 0.08)
    // on the ceiling, as each plumb line reaches it
    const o = PLUMB0 + i * PLUMB_ST + PLUMB_UP
    strip(x - 1.1, x + 1.1, z - 0.3, z + 0.3, 'x', o, C - 0.06); strip(x - 0.3, x + 0.3, z - 1.1, z + 1.1, 'z', o, C - 0.06)
  })
}
const PLUMB0 = 4.6, PLUMB_ST = 0.3, PLUMB_UP = 1.1 // step 2: plumb lines rise from the floor marks, one after another
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
// the structure above the ceiling (installed by others), seen through the ceiling as an x-ray outline: a steel member
// running over the pilaster line, and the bolts from each ceiling bracket up into it
function addSteel() {
  const fill = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, opacity: 0.25, depthWrite: false, depthTest: false })
  const line = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true, depthTest: false })
  const T = spec.pil.t, [y0, y1] = STEEL_Y, C = spec.ceiling
  const add = (g, pos) => {
    for (const o of [new THREE.Mesh(g, fill.clone()), new THREE.LineSegments(new THREE.EdgesGeometry(g), line.clone())]) {
      o.position.set(...pos); o.renderOrder = 9; scene.add(o); xray.push(o)
    }
  }
  add(new THREE.BoxGeometry(RUN + 8, y1 - y0, 3), [MID, (y0 + y1) / 2, -T / 2])
  for (const [x] of fix) for (const d of [-1.35, 1.35]) add(new THREE.BoxGeometry(0.4, y0 - C + 0.4, 0.4), [x + d, (y0 + C - 0.4) / 2, -T / 2])
}
// where each pilaster is: how far in front of its place (sliding in), and how high its foot sits on the leveling bolt
const slideZ = (t, i) => (1 - ease((t - SLIDE[0] - i * SLIDE[1]) / 1.6)) * SLIDE_Z
const jack = (t, i) => ease((t - JACK[0] - i * JACK[1]) / 2)
const foot = (t, i) => LOW * (1 - slideZ(t, i) / SLIDE_Z) + (HIGH - LOW) * jack(t, i) // carried in standing on the floor
let lastPose = ''
function pose(t) {
  let moving = false
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    let k = 1, dx = 0, dy = 0, dz = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'wbracket') dy = 0
    // floor brackets come up out of the floor, ceiling brackets down out of the ceiling
    if (part === 'fbr') dy = -(1 - easeOut(k)) * 3
    if (part === 'cbr') dy = (1 - easeOut(k)) * 3
    if (part === 'bolt') {
      // the leveling bolt reaches from the bracket to the pilaster's foot; it turns out as the pilaster goes up
      const pi = o.userData.pil, top = foot(t, pi) - 0.02, kk = clamp((t - IN.fbr[0] - idx * IN.fbr[1]) / 0.75)
      k = kk; o.scale.y = top - BR; o.position.set(o.userData.p0.x, (top + BR) / 2 - (1 - easeOut(kk)) * 3, o.userData.p0.z)
      m.opacity = clamp(k * 1.4); o.visible = m.opacity > 0.01
      glow(o, part, t); continue
    }
    if (o.userData.nut !== undefined) o.rotation.y = jack(t, o.userData.nut) * Math.PI * 6
    if (part === 'pilaster' || part === 'shoe' || part === 'cshoe') {
      const f = foot(t, idx)
      dz = slideZ(t, idx)
      k = clamp((t - S[5] - 0.3 - idx * 0.15) / 0.6) // in view, in front of its place, from the start of the step
      if (part === 'pilaster') {
        o.scale.y = LEN / (spec.pil.y1 - spec.pil.y0)
        o.position.set(o.userData.p0.x, f + LEN / 2, o.userData.p0.z + dz)
        m.opacity = clamp(k * 1.4); o.visible = m.opacity > 0.01
        if (dz > 0.01 || (jack(t, idx) > 0 && jack(t, idx) < 1)) moving = true
        glow(o, part, t); continue
      }
      // the shoes slide on from the ends, ride on the pilaster held clear, then go to the floor and the ceiling
      k = clamp((t - S[5] - 1 - idx * 0.3) / 0.6)
      const seat = ease((t - SHOE_SEAT[0] - idx * SHOE_SEAT[1]) / 0.9), lift = f - HIGH
      dy = part === 'shoe' ? (SHOE_OFF + lift) * (1 - seat) : (-SHOE_OFF + lift) * (1 - seat)
      dy += (part === 'shoe' ? -1 : 1) * (1 - easeOut(k)) * 4
    }
    if (part === 'contact') { m.opacity = 0.7 * clamp((t - SHOE_SEAT[0] - idx * SHOE_SEAT[1] - 0.8) / 0.4); o.visible = m.opacity > 0.01; continue }
    if (part === 'ceiling' || part === 'downlight') {
      // the camera stays below the ceiling, but keep it hidden if a key ever goes above
      const c = clamp((104 - camera.position.y) / 8)
      if (part === 'ceiling') { m.opacity = c; m.depthWrite = c > 0.99; o.visible = c > 0.01 } else o.visible = c > 0.5
      continue
    }
    m.opacity = clamp(k * 1.4)
    o.visible = m.opacity > 0.01
    o.position.set(o.userData.p0.x + dx, o.userData.p0.y + dy, o.userData.p0.z + dz)
    if (dx || dz > 0.01 || (dy && o.visible)) moving = true
    glow(o, part, t)
  }
  // the accessible door swings out, then closes on its own
  const a = ease((t - SWING[0]) / 1.8) * (1 - ease((t - SWING[1]) / 2.0))
  if (door0.rotation.y !== -a * 0.95) moving = true
  door0.rotation.y = -a * 0.95
  // chalk lines draw on during step 2 and fade once the stalls are complete
  const mo = 1 - clamp((t - S[9]) / 1.5)
  for (const s of marks) {
    const { x0, x1, z0, z1, along, order, y } = s.userData
    const r = ease((t - S[2] - 0.4 - order) / (y > 1 ? 0.6 : 1.4))
    const X1 = along === 'x' ? x0 + (x1 - x0) * r : x1, Z1 = along === 'z' ? z0 + (z1 - z0) * r : z1
    s.visible = r > 0.001 && mo > 0.01; s.material.opacity = mo
    s.scale.set(Math.max(0.01, Math.abs(X1 - x0)), Math.max(0.01, Math.abs(Z1 - z0)), 1)
    s.position.set((x0 + X1) / 2, y, (z0 + Z1) / 2)
  }
  // supports go in just before the panels and come out once the shoes are seated
  supports.forEach((b, i) => {
    const v = clamp((t - IN.panel[0] + 1 - Math.floor(i / 2) * 0.5) / 0.5) * (1 - clamp((t - S[7] - 7.2) / 0.8))
    b.material.opacity = v; b.visible = v > 0.01
  })
  // the wall backing shows in step 1 and again while the wall brackets go up
  const bk = win(t, S[1] + 6, S[2], 1, 1) + win(t, S[3], S[3] + 6.2, 1, 1) * (0.8 + 0.2 * Math.sin(t * 3))
  for (const o of backing) { o.material.opacity = (o.isLineSegments ? 1 : 0.3) * bk; o.visible = bk > 0.01 }
  // the structure above the ceiling shows in step 1, while the ceiling brackets go up, and while they are tightened
  const sk = win(t, S[1] + 4, S[2], 1, 1) + win(t, S[3] + 10.5, S[4], 1, 1) * (0.8 + 0.2 * Math.sin(t * 3)) + win(t, S[6] + 9.5, S[7], 1, 1) * 0.8
  for (const o of xray) { o.material.opacity = (o.isLineSegments ? 1 : 0.22) * sk; o.visible = sk > 0.01 }
  const key = tagged.map((o) => (o.visible ? o.position.y.toFixed(2) + o.position.x.toFixed(1) + o.position.z.toFixed(1) : 'h')).join() + supports.map((b) => b.visible).join()
  if (moving || key !== lastPose) renderer.shadowMap.needsUpdate = true
  lastPose = key
}
function glow(o, part, t) {
  const m = o.material, g = GLOW[part], g2 = GLOW2[part]
  const gi = Math.max(g ? win(t, g[0], g[1], 0.5, 0.6) * 0.85 : 0, g2 ? win(t, g2[0], g2[1], 0.5, 0.6) * 0.85 : 0)
  if (m.emissive) {
    if (!o.userData.e0) { o.userData.e0 = m.emissive.clone(); o.userData.c0 = m.color.clone() }
    m.emissive.copy(o.userData.e0).lerp(ORANGE_E, Math.min(1, gi * 1.2)); m.color.copy(o.userData.c0).lerp(ORANGE, Math.min(1, gi * 1.3)); m.emissiveIntensity = 1
  }
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
const FX = () => fix.find(([, pi]) => pi === 2)[0] // the first fixing point under the third pilaster
const ZC = () => -spec.pil.t / 2
const LABELS = [
  [S[1] + 2.6, S[2] - 0.2, () => [P2, 40, ZC()], 'Floor to ceiling, at every pilaster', -90, 60],
  [S[1] + 5, S[2] - 0.2, () => [MID + 30, STEEL_Y[0], ZC()], 'Structure above the ceiling', 60, 110],
  [S[1] + 7.2, S[2] - 0.2, () => [spec.panels[2], 36, -spec.depth], 'Solid backing in the wall', 90, 70],
  [S[2] + 2.5, S[2] + 6, () => [MID + 40, 0.1, -spec.pil.t], 'Pilaster line on the floor', 60, -120],
  [S[2] + 7.5, S[3] - 0.2, () => [FX(), spec.ceiling, ZC()], 'Same point on the ceiling', 70, 110],
  [S[3] + 2.5, S[3] + 6, () => [spec.panels[0] + 0.6, 64, -spec.depth + 1], 'Wall bracket, fastened into the backing', 70, -110],
  [S[3] + 7.8, S[3] + 12.3, () => [FX() + 1.6, 0.1, ZC() + 0.5], 'Floor bracket, anchored to the slab', 80, -130],
  [S[3] + 8.8, S[3] + 12.3, () => [FX(), BR + 0.4, ZC()], 'Leveling bolt', -90, -110],
  [S[3] + 13, S[4] - 0.3, () => [FX() + 0.6, spec.ceiling - BR, ZC() + 0.8], 'Ceiling bracket', 80, 120],
  [S[3] + 13.6, S[4] - 0.3, () => [FX() + 1.35, STEEL_Y[0] - 1, ZC()], 'Bolted into the steel above', -80, -100],
  [S[4] + 3.5, S[5] - 0.3, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Temporary support', 90, -120],
  [S[5] + 1.6, S[5] + 5.4, () => [P2, spec.pil.y1 - SHOE_OFF - 4, SLIDE_Z], 'Top shoe, held clear', 90, 40],
  [S[5] + 1.9, S[5] + 5.4, () => [P2, HIGH + SHOE_OFF + 2, SLIDE_Z], 'Bottom shoe, held clear', 90, -40],
  [S[5] + 11.2, S[5] + 14.6, () => [FX(), spec.ceiling - BR - 0.6, 0.2], 'Raised until it meets the ceiling bracket', 70, 130],
  [S[6] + 1, S[6] + 5, () => [pil(2).x + pil(2).w, 60, 0], 'Plumb both ways', 80, -100],
  [S[6] + 5.6, S[6] + 9.3, () => [(pil(1).x + pil(1).w + pil(2).x) / 2, 60, 0], 'Door opening to the drawings', 40, -100],
  [S[6] + 11.6, S[7] - 0.3, () => [P2, spec.ceiling - 2, 0.3], 'Tight at the ceiling', 80, 90],
  [S[6] + 12, S[7] - 0.3, () => [P2, 2, 0.3], 'Tight at the floor', 80, -90],
  [S[7] + 3, S[8] - 0.4, () => [P2, spec.ceiling - 1.5, 0.5], 'Top shoe covers the ceiling bracket', 70, 100],
  [S[7] + 3.4, S[8] - 0.4, () => [P2, 2, 0.5], 'Bottom shoe covers the floor bracket', 70, -100],
  [S[8] + 8.4, S[8] + 13, () => [spec.doors[0].x, spec.hinge.tops[0] - 2, 0.4], 'Hinges set the resting position', 70, -80],
  [S[8] + 14, S[9] - 0.3, () => [pil(2).x - 0.15, 46, 0.3], 'Even gaps', 70, -110],
  [S[9] + 2.6, S[9] + 8.4, () => [P2, 48, 0.6], 'Fixed at both ends, still plumb', 70, -100],
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
const arrowHead = (x, y, ang) => `<path d="M${x} ${y} l${Math.cos(ang + 2.7) * 26} ${Math.sin(ang + 2.7) * 26} l${Math.cos(ang - 2.7) * 26 - Math.cos(ang + 2.7) * 26} ${Math.sin(ang - 2.7) * 26 - Math.sin(ang + 2.7) * 26} z"/>`
// step 1: a floor-to-ceiling height arrow; step 2: plumb lines from each floor mark up to the ceiling; step 6: a plumb
// line down a pilaster and a door opening's width; step 9: a push arrow at a pilaster's middle
function guides(t) {
  let s = ''
  const C = spec.ceiling, z = ZC()
  let r = win(t, S[1] + 2.4, S[2] - 0.3, 0.6, 0.4)
  if (r > 0) {
    const d = ease((t - S[1] - 2.4) / 1.2), [ax, ay] = project([P2, 0.2, z]), [bx, by] = project([P2, C - 0.2, z])
    const mx = (ax + bx) / 2, my = (ay + by) / 2, hx = (bx - ax) / 2 * d, hy = (by - ay) / 2 * d, ang = Math.atan2(by - ay, bx - ax)
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${mx - hx}" y1="${my - hy}" x2="${mx + hx}" y2="${my + hy}"/>` +
      arrowHead(mx + hx, my + hy, ang) + arrowHead(mx - hx, my - hy, ang + Math.PI) + '</g>'
  }
  r = win(t, S[2] + PLUMB0, S[3] - 0.3, 0.3, 0.5)
  if (r > 0) fix.forEach(([x], i) => {
    const d = ease((t - S[2] - 0.4 - PLUMB0 - i * PLUMB_ST) / PLUMB_UP)
    if (d > 0) s += dashed([x, 0.1, z], [x, C, z], r, d)
  })
  const pn = pil(2)
  r = win(t, S[6] + 0.6, S[6] + 5, 0.5, 0.4)
  if (r > 0) s += dashed([pn.x + pn.w + 0.2, C - 0.5, 0.2], [pn.x + pn.w + 0.2, 0.5, 0.2], r, ease((t - S[6] - 0.6) / 1.2))
  r = win(t, S[6] + 5.3, S[6] + 9.3, 0.5, 0.3)
  if (r > 0) {
    const a = project([pil(1).x + pil(1).w, 60, 0.3]), b = project([pn.x, 60, 0.3])
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
      `<line x1="${a[0]}" y1="${a[1] - 22}" x2="${a[0]}" y2="${a[1] + 22}"/><line x1="${b[0]}" y1="${b[1] - 22}" x2="${b[0]}" y2="${b[1] + 22}"/></g>`
  }
  r = win(t, S[9] + 0.8, S[9] + 8.4, 0.5, 0.4)
  if (r > 0) {
    // a hand-push arrow towards the pilaster's middle, pulsing twice
    const [x, y] = project([P2, 48, 0.6]), p = Math.abs(Math.sin((t - S[9] - 0.8) * Math.PI / 1.4)) * 18
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
