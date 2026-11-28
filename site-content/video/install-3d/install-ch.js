// Installation overview video, ceiling hung (2:20): the consensus order in research/install-guides/ (pilasters hung
// from structural steel above the ceiling, nothing at the floor) played out in the three.js restroom from
// design/render3d. The plan is research/install-guides/video-ceiling-hung-plan.md. The steel above the ceiling shows
// as an x-ray: the ceiling turns see-through and the beam, rods and nuts glow through it. The hanging hardware inside
// a pilaster top shows by turning that pilaster see-through in its close-up. Hardware is generic, not any one
// manufacturer's. Each step's parts glow orange. render.mjs calls window.frameAt(t) for every frame and screenshots
// the page. Units are inches.
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
const STYLE = 'ceiling-hung'
const RUN = 168.5, MID = RUN / 2

// ---------- timeline: intro, nine steps, end card ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [6, 'Check the steel above the ceiling', [[0.3, 'Ceiling hung pilasters hang from steel above the ceiling.'], [3.5, 'Others put it in, before the ceiling is closed.'], [6.5, 'Never hang from the ceiling grid or drywall. No steel? Stop.']]],
  [16, 'Lay out from the rods', [[0.3, 'Check each rod comes through where the drawings show.'], [3.8, 'Plumb down from each rod to the floor,'], [6.3, 'then mark the pilaster line and each panel line.']]],
  [25, 'Put up the wall brackets and panels', [[0.3, 'Fasten the wall brackets into the backing.'], [6.5, 'Set the panels on temporary supports.'], [10, 'Don\'t tighten anything yet.']]],
  [38, 'Hang the pilasters', [[0.3, 'Slide the trim sleeve onto the top and hold it down.'], [4.5, 'Lift each pilaster up to its rod.'], [9, 'It sits on a support nut. The top nut stays loose.'], [14, 'Then connect it to its panel.']]],
  [55, 'Level, plumb, then tighten', [[0.3, 'Turn the support nuts until the bottoms line up,'], [3.5, 'all at one height, clear of the floor.'], [6.3, 'Get each pilaster plumb both ways.'], [10, 'Set the door openings to the drawings,'], [13, 'then tighten every nut and bracket.']]],
  [72, 'Check for sway', [[0.3, 'Push the bottom of each pilaster.'], [3, 'It should feel firm. A long drop can sway.'], [6, 'Fit bracing where the system calls for it.']]],
  [83, 'Raise the sleeves to the ceiling', [[0.3, 'Push each trim sleeve up to the ceiling,'], [4.5, 'so it covers the hanging hardware, and secure it.']]],
  [92, 'Hang the doors', [[0.3, 'Hang the doors on their hinges.'], [7.5, 'The accessible stall\'s door closes on its own.'], [13.5, 'Adjust each door until the gaps are even.']]],
  [110, 'Check the finished run', [[0.3, 'Check every pilaster is still plumb and level.'], [4.5, 'The floor stays clear, so it cleans in one pass.'], [10, 'Test every latch, including from outside.']]],
]
const END0 = 130, DURATION = 140
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t])) // step start times
export const CAPTIONS = [
  [0.4, 'Here is how ceiling hung partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]

// camera keys: [time, position, target, fov]; a smooth spline through them
const P2 = 90.5 // centre of the third pilaster, the one the close-ups use
const CAM = [
  [0, [MID + 40, 62, 300], [MID, 48, -22], 40],
  [6, [MID + 14, 60, 262], [MID, 56, -24], 40],
  // step 1: the empty room with the backing, then low under the ceiling, looking up along the pilaster line
  [9, [MID + 8, 58, 236], [MID, 62, -24], 40],
  [12, [MID + 40, 36, 112], [MID - 4, 98, -4], 44],
  [15.5, [MID + 32, 34, 104], [MID - 8, 98, -4], 44],
  // step 2: a rod coming through the ceiling, then down to the floor marks
  [18.5, [P2 + 26, 76, 50], [P2 - 4, 93, -1], 40],
  [20.5, [P2 + 22, 76, 46], [P2 - 4, 93, -1], 40],
  [23, [MID + 16, 72, 206], [MID, 42, -24], 40],
  [25, [MID + 10, 74, 200], [MID, 42, -24], 40],
  // step 3: wall brackets in the backing with the layout lines, then the panels on their supports
  [28, [MID + 30, 84, 100], [MID - 6, 34, -52], 44],
  [31.5, [MID + 18, 82, 90], [MID - 12, 34, -52], 44],
  [34.5, [RUN + 4, 62, 112], [MID, 26, -30], 40],
  [37.5, [RUN - 4, 60, 104], [MID, 26, -30], 40],
  // step 4: a pilaster held low with its sleeve, followed up to its rod, then the hardware inside its top, then the run
  [40.5, [P2 + 34, 66, 92], [P2, 66, -1], 40],
  [43, [P2 + 30, 68, 86], [P2, 70, -1], 40],
  [46.5, [P2 + 24, 80, 52], [P2, 89, -1], 40],
  [51, [P2 + 14, 86, 32], [P2, 92, -1], 40],
  [53, [MID + 20, 60, 220], [MID, 52, -14], 40],
  [55, [MID + 16, 58, 212], [MID, 50, -14], 40],
  // step 5: low along the pilaster bottoms, plumb, a door opening, up to the steel for the tightening
  [57.5, [RUN + 16, 16, 64], [MID - 20, 12, -2], 40],
  [61, [RUN + 10, 15, 58], [MID - 24, 12, -2], 40],
  [63.5, [P2 + 22, 50, 140], [P2 - 4, 46, -4], 40],
  [67, [P2 + 12, 52, 150], [P2 - 10, 46, -4], 40],
  [69, [P2 + 36, 46, 76], [P2, 98, -1], 44],
  [72, [P2 + 30, 44, 70], [P2, 98, -1], 44],
  // step 6: a push at a pilaster bottom, then the tops for the bracing
  [74, [P2 + 40, 30, 92], [P2, 22, -2], 40],
  [77, [P2 + 34, 30, 86], [P2, 22, -2], 40],
  [79.5, [MID + 34, 62, 150], [MID, 82, -8], 40],
  [83, [MID + 26, 62, 142], [MID, 84, -8], 40],
  // step 7: the sleeves going up to the ceiling
  [85.5, [MID + 34, 70, 112], [MID + 6, 90, -4], 40],
  [91.5, [MID + 22, 70, 104], [MID, 90, -4], 40],
  // step 8: doors, the accessible door's swing, even gaps
  [94.5, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [98, [RUN * 0.38, 58, 156], [RUN * 0.24, 44, -2], 40],
  [100.5, [46, 62, 96], [16, 46, 6], 40],
  [104.5, [44, 62, 92], [16, 46, 6], 40],
  [107.5, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [110, [RUN * 0.4, 58, 160], [RUN * 0.26, 44, -2], 40],
  // step 9: the whole run, low across the clear floor, then the latch
  [112.5, [MID + 24, 52, 210], [MID, 50, -14], 40],
  [115, [RUN + 14, 12, 74], [MID - 18, 8, -16], 40],
  [119.5, [RUN + 6, 12, 66], [MID - 22, 8, -16], 40],
  [122.5, [62, 50, 76], [32, 40, 0], 40],
  [126, [58, 50, 72], [32, 40, 0], 40],
  [131, [MID + 12, 62, 264], [MID, 52, -14], 40],
  [140, [MID - 8, 62, 244], [MID, 50, -14], 40],
]

// when each part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { wbracket: [S[3] + 1.5, 0.35], panel: [S[3] + 6.8, 0.5], pilaster: [S[4] + 0.3, 0.15], sleeve: [S[4] + 0.8, 0.15], nut: [S[4] + 10, 0.25], door: [S[8] + 1, 0.5], grab: [S[9] + 15, 0] }
const GLOW = { steel: [S[1] + 4, S[2] - 0.2], rod: [S[2] + 0.3, S[2] + 4.2], wbracket: [S[3] + 1.5, S[3] + 6.5], panel: [S[3] + 6.8, S[4]], pilaster: [S[4] + 4.5, S[5] - 0.2], sleeve: [S[4] + 1, S[4] + 4.5], nut: [S[4] + 10, S[4] + 14.5], door: [S[8] + 1, S[9] - 0.2], grab: [S[9] + 15, S[9] + 17] }
const GLOW2 = { sleeve: [S[7] + 0.6, S[8] - 0.3], nut: [S[5] + 13.3, S[6] - 0.3], steel: [S[5] + 13.3, S[6] - 0.3] } // a second glow: nuts tightened, sleeves raised
const RISE = [S[4] + 4.6, 0.55] // pilasters go up to their rods one by one, from the end nearest the camera's pilaster outwards
const DROP = 10 // how far below its rod a pilaster starts
const SLEEVE_DOWN = 8, SLEEVE_UP = [S[7] + 0.8, 0.5] // sleeves ride low on the pilaster until step 7
const LEVEL = [0, 0.9, -0.7, 0.8, -0.5], LEVEL_T = [S[5] + 0.6, S[5] + 5.2] // pilasters hang a little off level until adjusted
const SEE = [S[4] + 9, S[4] + 14.6] // the close-up pilaster turns see-through to show the hardware inside its top
const XRAY = [[S[1] + 1, S[2] + 1.4], [S[4] + 8.6, S[4] + 14.8], [S[5] + 12.8, S[6] - 0.2], [S[6] + 6, S[7] - 0.3]] // the ceiling turns see-through
const BRACE = [S[6] + 6.2, S[7] - 0.4]
const SWING = [S[8] + 8.8, S[8] + 11.3] // the accessible door opens, then closes on its own

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
const tagged = [], marks = [], supports = [], backing = [], xlines = []
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
  // the scene's own sleeve, steel and rods are replaced by the more detailed hanging hardware below
  const old = []
  scene.traverse((o) => { if (['sleeve', 'steel', 'rod'].includes(o.userData.part)) old.push(o) })
  for (const o of old) o.removeFromParent()
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
  addMarks(); addSupports(); addBacking(); addCutCeiling()
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
// generic hanging hardware: a steel beam above the ceiling across the pilaster line (wall to wall), a threaded rod at
// each hanging point through the beam's lower flange (a nut and washer each side) and down through the ceiling into
// the pilaster top, where a hanging bar inside the top sits on a support nut, with a top nut above it. A stainless
// trim sleeve covers the gap between the pilaster top and the ceiling.
const rods = [] // [x, pilaster idx] of every hanging point
const ROD_Y0 = 92.4, BAR = [93.3, 93.7]
function addHardware() {
  const galv = new THREE.MeshStandardMaterial({ color: '#9aa1a7', metalness: 0.65, roughness: 0.45 })
  const steelM = new THREE.MeshStandardMaterial({ color: '#7d858c', metalness: 0.6, roughness: 0.5 })
  const T = spec.pil.t, zc = -T / 2, c = spec.ceiling
  const add = (m, part, idx = 0) => { m.userData = { part, idx }; m.castShadow = true; m.receiveShadow = true; scene.add(m); return m }
  const box = (mat, x0, x1, y0, y1, z0, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return m }
  const cyl = (mat, r, y0, y1, x, seg = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, seg), mat); m.position.set(x, (y0 + y1) / 2, zc); return m }
  // the beam: an I-section, bottom flange 102", top flange 106"
  const [s0] = spec.hanger.steel, fw = 3
  const beam = [box(steelM, -6, RUN + 6, s0, s0 + 0.4, zc - fw / 2, zc + fw / 2), box(steelM, -6, RUN + 6, s0 + 0.4, s0 + 3.6, zc - 0.18, zc + 0.18), box(steelM, -6, RUN + 6, s0 + 3.6, s0 + 4, zc - fw / 2, zc + fw / 2)]
  for (const b of beam) add(b, 'steel')
  // x-ray outline of the beam, drawn over everything while the ceiling is see-through
  const lm = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true, depthTest: false })
  for (const b of beam) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), lm.clone()); l.position.copy(b.position); l.renderOrder = 9; scene.add(l); xlines.push(l) }
  spec.pilasters.forEach((p, idx) => {
    for (const x of p.w > 4 ? [p.x + 2, p.x + p.w - 2] : [p.x + p.w / 2]) {
      rods.push([x, idx])
      add(cyl(galv, 0.25, ROD_Y0, s0 + 1.6, x), 'rod', idx)
      // nuts and washers above and below the beam's lower flange
      add(cyl(galv, 0.7, s0 + 0.4, s0 + 0.5, x, 24), 'nutS', idx); add(cyl(galv, 0.48, s0 + 0.5, s0 + 0.9, x, 6), 'nutS', idx)
      add(cyl(galv, 0.7, s0 - 0.1, s0, x, 24), 'nutS', idx); add(cyl(galv, 0.48, s0 - 0.5, s0 - 0.1, x, 6), 'nutS', idx)
      // support nut under the hanging bar, top nut above it (inside the pilaster top)
      add(cyl(galv, 0.48, BAR[0] - 0.4, BAR[0], x, 6), 'nut', idx)
      add(cyl(galv, 0.48, BAR[1], BAR[1] + 0.4, x, 6), 'nut', idx)
    }
    // the hanging bar: a flat steel bar inside the pilaster top, between its hanging points
    const xs = p.w > 4 ? [p.x + 2, p.x + p.w - 2] : [p.x + p.w / 2]
    add(box(galv, xs[0] - 1, xs.at(-1) + 1, BAR[0], BAR[1], zc - 0.35, zc + 0.35), 'bar', idx)
    // trim sleeve, slightly wider than the pilaster, from 3" down the pilaster to the ceiling
    const o = spec.shoeOver
    const sl = add(box(new THREE.MeshPhysicalMaterial({ color: '#d6d9dd', metalness: 1, roughness: 0.3, envMapIntensity: 1.6 }), Math.max(0, p.x - o), Math.min(RUN, p.x + p.w + o), c - 4, c - 0.02, -T - o, o), 'sleeve', idx)
    sl.castShadow = true
  })
  // a back rail along the pilaster tops, wall to wall: the bracing some systems call for (shown as a ghost)
  add(box(new THREE.MeshStandardMaterial({ color: '#fe7802', emissive: '#a84800', roughness: 0.6 }), 0, RUN, 88.5, 90, -T - 1.4, -T - 0.05), 'brace')
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
// and a cross under every hanging rod
function addMarks() {
  const m = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, polygonOffset: true, polygonOffsetFactor: -4 })
  const T = spec.pil.t, w = 0.6
  const strip = (x0, x1, z0, z1, along, order) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.rotation.x = -Math.PI / 2; s.renderOrder = 4
    s.userData = { x0, x1, z0, z1, along, order }; scene.add(s); marks.push(s)
  }
  rods.forEach(([x], i) => { strip(x - 1.1, x + 1.1, -T / 2 - 0.3, -T / 2 + 0.3, 'x', 1.4 + i * 0.1); strip(x - 0.3, x + 0.3, -T / 2 - 1.1, -T / 2 + 1.1, 'z', 1.4 + i * 0.1) })
  strip(0, spec.run, -T - w / 2, -T + w / 2, 'x', 3.6)
  strip(0, spec.run, -w / 2, w / 2, 'x', 3.6)
  spec.panels.forEach((px, i) => strip(px - w / 2, px + w / 2, -T, -spec.depth, 'z', 5 + i * 0.4))
  spec.pilasters.forEach((p, i) => { strip(p.x, p.x + w, -T, 0, 'z', 6.4 + i * 0.12); strip(p.x + p.w - w, p.x + p.w, -T, 0, 'z', 6.4 + i * 0.12) })
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
// the cut-away ceiling: the same ceiling with a slot along the pilaster line, so the steel shows through it; its cut
// edges are traced in orange, and the rest turns half see-through. It stands in for the whole ceiling while the x-ray
// is on.
const cut = []
function addCutCeiling() {
  const src = tagged.find((o) => o.userData.part === 'ceiling'), b = new THREE.Box3().setFromObject(src)
  const c = spec.ceiling, z0 = -spec.pil.t / 2 - 6, z1 = -spec.pil.t / 2 + 6
  const mat = src.material.clone(); mat.transparent = true; mat.depthWrite = false
  for (const [a, e] of [[b.min.z, z0], [z1, b.max.z]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.max.x - b.min.x, c + 2 - c, e - a), mat)
    m.position.set((b.min.x + b.max.x) / 2, c + 1, (a + e) / 2); m.receiveShadow = true; scene.add(m); cut.push(m)
  }
  const lm = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true })
  const g = new THREE.BufferGeometry().setFromPoints([z0, z1].flatMap((z) => [c, c + 2].flatMap((y) => [new THREE.Vector3(0, y, z), new THREE.Vector3(spec.run, y, z)])))
  const l = new THREE.LineSegments(g, lm); scene.add(l); cut.push(l)
}
const xray = (t) => Math.max(...XRAY.map(([a, b]) => win(t, a, b, 0.8, 0.8)))
// a pilaster's height offset at time t: below its rod until it is lifted, then a little off level until adjusted
function lift(t, idx) {
  const r = ease((t - RISE[0] - idx * RISE[1]) / 1.6)
  return -(1 - r) * DROP + LEVEL[idx] * clamp((t - RISE[0] - idx * RISE[1] - 1) / 0.6) * (1 - ease((t - LEVEL_T[0] - idx * 0.6) / 1.6))
}
let lastPose = ''
function pose(t) {
  let moving = false
  const xr = xray(t)
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    let k = 1, dy = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'wbracket' || part === 'nut') dy = 0
    if (part === 'pilaster' || part === 'bar' || part === 'sleeve') {
      dy = lift(t, idx)
      if (part === 'bar') k = clamp((t - IN.pilaster[0] - idx * IN.pilaster[1]) / 0.6)
      if (part === 'sleeve') dy -= SLEEVE_DOWN * (1 - ease((t - SLEEVE_UP[0] - idx * SLEEVE_UP[1]) / 1.2))
    }
    if (part === 'brace') { const b = win(t, BRACE[0], BRACE[1], 1, 1); m.opacity = 0.75 * b; m.depthWrite = false; o.visible = b > 0.01; continue }
    if (part === 'ceiling' || part === 'downlight') {
      // the ceiling turns see-through for the x-ray shots of the steel above it
      const c = 1 - xr
      if (part === 'ceiling') { m.opacity = c; m.depthWrite = c > 0.99; o.visible = true } else o.visible = true
      continue
    }
    m.opacity = clamp(k * 1.4)
    // the close-up pilaster turns see-through to show its hanging bar and nuts
    if (part === 'pilaster' && idx === 2) { const s = win(t, SEE[0], SEE[1], 0.7, 0.7); m.opacity *= 1 - 0.72 * s; m.depthWrite = s < 0.01 }
    o.visible = m.opacity > 0.01
    o.position.set(o.userData.p0.x, o.userData.p0.y + dy, o.userData.p0.z)
    if (dy && o.visible) moving = true
    // the nuts at the steel and the rods glow with the steel when it is tightened
    const g = GLOW[part], g2 = GLOW2[part] ?? GLOW2[{ nutS: 'nut', rod: 'steel' }[part]]
    let gi = Math.max(g ? win(t, g[0], g[1], 0.5, 0.6) * 0.85 : 0, g2 ? win(t, g2[0], g2[1], 0.5, 0.6) * 0.85 : 0)
    // in step 1 the steel, rods and the nuts at the steel glow while the ceiling is see-through
    if (part === 'steel' || part === 'nutS' || (part === 'rod' && t < S[3])) gi = Math.max(gi, xr * 0.85)
    if (m.emissive) {
      if (!o.userData.e0) { o.userData.e0 = m.emissive.clone(); o.userData.c0 = m.color.clone() }
      m.emissive.copy(o.userData.e0).lerp(ORANGE_E, Math.min(1, gi * 1.2)); m.color.copy(o.userData.c0).lerp(ORANGE, Math.min(1, gi * 1.3)); m.emissiveIntensity = 1
    }
  }
  for (const l of xlines) { l.material.opacity = xr; l.visible = xr > 0.01 }
  // the ceiling either side of the slot stays half there, so the steel shows through it and the ceiling still reads
  for (const o of cut) { o.visible = xr > 0.01; o.material.opacity = o.isLineSegments ? xr : 1 - 0.5 * xr }
  // the accessible door swings out, then closes on its own
  const a = ease((t - SWING[0]) / 1.8) * (1 - ease((t - SWING[1]) / 2.0))
  if (door0.rotation.y !== -a * 0.95) moving = true
  door0.rotation.y = -a * 0.95
  // chalk lines draw on during step 2 and fade once the stalls are complete
  const mo = 1 - clamp((t - S[8]) / 1.5)
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
    const v = clamp((t - IN.panel[0] + 1 - Math.floor(i / 2) * 0.5) / 0.5) * (1 - clamp((t - S[5] - 16.2) / 0.8))
    b.material.opacity = v; b.visible = v > 0.01
  })
  // the wall backing shows in step 1 and again while the wall brackets go up
  const bk = win(t, S[1] + 0.8, S[1] + 5, 0.8, 0.8) + win(t, S[3], S[3] + 7, 1, 1) * (0.8 + 0.2 * Math.sin(t * 3))
  for (const o of backing) { o.material.opacity = (o.isLineSegments ? 1 : 0.3) * bk; o.visible = bk > 0.01 }
  const key = tagged.map((o) => (o.visible ? o.position.y.toFixed(2) : 'h')).join() + supports.map((b) => b.visible).join() + (xr > 0.01)
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
const ROD = () => rods.find(([, i]) => i === 2)[0] // the first rod of the third pilaster
const LABELS = [
  [S[1] + 1.2, S[1] + 5, () => [spec.panels[1], 50, -spec.depth], 'Solid backing in the wall', 80, -140],
  [S[1] + 5, S[2] - 0.2, () => [MID - 30, spec.hanger.steel[0], -0.6], 'Structural steel above the ceiling', -60, 120],
  [S[1] + 6.8, S[2] - 0.2, () => [MID + 14, spec.ceiling, 44], 'The ceiling carries nothing', 60, 450],
  [S[2] + 2.2, S[2] + 5.2, () => [ROD(), 94.5, -0.6], 'Hanging rod through the ceiling', 70, 110],
  [S[2] + 6, S[3] - 0.2, () => [ROD(), 0.1, -0.6], 'Plumb down from each rod', 70, -120],
  [S[3] + 3, S[3] + 6.6, () => [spec.panels[0] + 0.6, 64, -spec.depth + 1], 'Wall bracket, fastened into the backing', 70, -110],
  [S[3] + 9.5, S[4] - 0.3, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Temporary support', 90, -120],
  [S[4] + 1.6, S[4] + 6, () => [P2 + 6, spec.ceiling - 2 - SLEEVE_DOWN - DROP, 0.3], 'Trim sleeve, held down for now', 70, -90],
  [S[4] + 9.8, S[4] + 14.4, () => [ROD() + 8, BAR[0] - 0.2, -0.3], 'Support nut under the hanging bar', 90, 140],
  [S[4] + 10.6, S[4] + 14.4, () => [ROD(), BAR[1] + 0.2, -0.3], 'Top nut, loose for now', -90, -140],
  [S[5] + 1.2, S[5] + 6.2, () => [P2, spec.pil.y0, 0.3], 'Bottoms in line, clear of the floor', 50, -130],
  [S[5] + 7, S[5] + 10, () => [pil(2).x + pil(2).w, 40, 0], 'Plumb both ways', 80, -100],
  [S[5] + 10.3, S[5] + 13, () => [(pil(1).x + pil(1).w + pil(2).x) / 2, 60, 0], 'Door opening to the drawings', 40, -100],
  [S[5] + 14, S[6] - 0.3, () => [ROD(), spec.hanger.steel[0] - 0.3, -0.6], 'Tightened above and below the steel', 70, 120],
  [S[6] + 1.5, S[6] + 5.6, () => [P2, 16, 0.6], 'Firm at the bottom, no sway', 70, -120],
  [S[6] + 7, S[7] - 0.5, () => [MID + 18, 89.2, -2.6], 'Bracing, where the system calls for it', 40, 230],
  [S[7] + 3, S[8] - 0.4, () => [P2 + 6.3, spec.ceiling - 1.5, 0.3], 'Sleeve meets the ceiling', 70, 110],
  [S[8] + 8.4, S[8] + 13, () => [spec.doors[0].x, spec.hinge.tops[0] - 2, 0.4], 'Hinges set the resting position', 70, -80],
  [S[8] + 14, S[9] - 0.3, () => [pil(2).x - 0.15, 46, 0.3], 'Even gaps', 70, -110],
  [S[9] + 5.5, S[9] + 10, () => [MID - 30, 0.1, -10], 'Clear floor, easy to clean', 60, -110],
  [S[9] + 12.6, S[9] + 16.4, () => [spec.doors[0].x + spec.doors[0].w - spec.latch.fromEdge, spec.latch.y, 0.6], 'Opens from outside in an emergency', 60, -110],
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
// step 2: plumb lines from each rod to the floor; step 5: a level line under the pilaster bottoms, a plumb line down a
// pilaster, a door opening's width; step 6: a push arrow at a pilaster bottom; step 9: the floor gap
function guides(t) {
  let s = ''
  let r = win(t, S[2] + 3.6, S[3] - 0.2, 0.5, 0.4)
  if (r > 0) rods.forEach(([x], i) => { s += dashed([x, ROD_Y0, -0.6], [x, 0.1, -0.6], r, ease((t - S[2] - 3.6 - i * 0.12) / 1.4)) })
  const y0 = spec.pil.y0 - 0.3, pn = pil(spec.pilasters.length - 1)
  r = win(t, S[5] + 0.6, S[5] + 6.4, 0.6, 0.4)
  if (r > 0) s += dashed([pil(0).x, y0, 0.2], [pn.x + pn.w, y0, 0.2], r, ease((t - S[5] - 0.6) / 1.4))
  r = win(t, S[5] + 6.6, S[5] + 10.2, 0.5, 0.4)
  if (r > 0) s += dashed([pil(2).x + pil(2).w + 0.2, spec.pil.y1, 0.2], [pil(2).x + pil(2).w + 0.2, spec.pil.y0, 0.2], r, ease((t - S[5] - 6.6) / 1.2))
  r = win(t, S[5] + 10, S[5] + 13, 0.5, 0.3)
  if (r > 0) {
    const a = project([pil(1).x + pil(1).w, 60, 0.3]), b = project([pil(2).x, 60, 0.3])
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
      `<line x1="${a[0]}" y1="${a[1] - 22}" x2="${a[0]}" y2="${a[1] + 22}"/><line x1="${b[0]}" y1="${b[1] - 22}" x2="${b[0]}" y2="${b[1] + 22}"/></g>`
  }
  r = win(t, S[6] + 0.6, S[6] + 5.6, 0.5, 0.4)
  if (r > 0) {
    // a hand-push arrow towards the pilaster bottom, pulsing twice
    const [x, y] = project([P2, 16, 0.6]), p = Math.abs(Math.sin((t - S[6] - 0.6) * Math.PI / 1.4)) * 18
    const x0 = x + 150 - p, x1 = x + 34 - p
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="10" stroke-linecap="round" fill="#fe7802"><line x1="${x0}" y1="${y}" x2="${x1 + 16}" y2="${y}"/>` +
      `<path d="M${x1} ${y} l28 -20 v40 z" stroke-width="4"/></g>`
  }
  r = win(t, S[9] + 5, S[9] + 10, 0.6, 0.4)
  if (r > 0) s += dashed([pil(0).x, y0, 0.2], [pn.x + pn.w, y0, 0.2], r, ease((t - S[9] - 5) / 1.4))
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
