// Installation video, floor mounted, detailed version (about 4:14): floor anchored pilasters, no headrail. Every step
// with hardware opens with its kit card, and every fastening is shown at least once in close-up: the anchors drilled
// and set in the concrete, clamped down and given a leveling nut, wall plugs and brackets, through-bolts, the top nuts
// on the anchors, the pilaster brackets, the shoes and the door hardware going on piece by piece. Then the rest of the
// same parts go on quickly in a wide shot. Plan: research/install-guides/video-floor-mounted-plan.md. Hardware and
// tools are generic (hardware.js), not any one manufacturer's. render.mjs calls window.frameAt(t) for every frame and
// screenshots the page. Units are inches.
import * as THREE from 'three'
import { buildScene } from '/design/render3d/scene.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
import * as HW from './hardware.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const V = (x, y, z) => new THREE.Vector3(x, y, z)
const clamp = (x) => Math.max(0, Math.min(1, x))
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const win = (t, a, b, fi = 0.4, fo = 0.3) => clamp((t - a) / fi) * clamp((b - t) / fo)
const ORANGE = new THREE.Color('#fe7802'), ORANGE_E = new THREE.Color('#a84800')
const STYLE = 'floor-mounted'
const RUN = 168.5, MID = RUN / 2
const UP = V(0, 1, 0), FRONT = V(0, 0, 1), BACK = V(0, 0, -1)

// ---------- timeline ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [6, 'Check the room against the drawings', [[0.3, 'First, check the room against the approved drawings.'], [3.5, 'The wall needs solid backing for the brackets,'], [6.3, 'and the floor must be sound concrete for the anchors.']]],
  [16, 'Lay out the stalls', [[0.3, 'Mark the pilaster line across the front,'], [3.5, 'each panel line back to the wall,'], [6.8, 'every anchor point,'], [9.6, 'and carry each panel line up the wall.']]],
  [30, 'Set the floor anchors', [[0.3, 'Floor anchor kit: threaded anchors, nuts and washers.'], [4.8, 'Drill the concrete at each anchor mark'], [8.4, 'and set an anchor in each hole.'], [12, 'A washer and nut clamp it to the floor.'], [16, 'Then a second nut and washer: the leveling nut.'], [20.8, 'Set the rest the same way.'], [24.6, 'Bring every leveling nut to one level line,'], [28.2, 'taken from the highest point of the floor.']]],
  [62, 'Fix the wall brackets', [[0.3, 'Wall bracket kit: angle brackets, screws, wall plugs and through-bolts.'], [5.2, 'Drill into the backing and push in a wall plug.'], [9.5, 'Screw the bracket to the wall,'], [13.5, 'with a second bracket on the other side of the panel line.'], [17.5, 'Repeat at each bracket height on every panel line.']]],
  [92, 'Set the panels in place', [[0.3, 'Rest each panel on blocks at the height on the drawings.'], [5, 'It drops in between its wall brackets.'], [9, 'Bolt it through the brackets, finger tight for now.']]],
  [108, 'Lower the pilasters onto the anchors', [[0.3, 'Pilaster kit: leveling brackets, top nuts and washers, angle brackets, screws and through-bolts.'], [5.4, 'Slide the shoe onto each pilaster and hold it up,'], [8.4, 'then lower the pilaster onto its anchors.'], [13.4, 'Put a washer and top nut on each anchor, finger tight.'], [20.4, 'Screw the brackets to the pilaster'], [24.4, 'and bolt them through the panel.'], [29.6, 'Leave everything finger tight for now.']]],
  [146, 'Plumb, level, then tighten', [[0.3, 'Lay a level across the pilaster tops'], [3.8, 'and turn the leveling nuts until they line up.'], [7.5, 'Get each pilaster plumb both ways.'], [11.8, 'Set the door openings to the drawings,'], [15.4, 'then tighten the top nuts and every bracket.']]],
  [170, 'Seat the shoes', [[0.3, 'Lower the shoes over the anchors,'], [6, 'and secure each one.']]],
  [182, 'Hang the doors and fit the hardware', [[0.3, 'Door hardware: hinges, latch, keeper, pull, coat hook and screws.'], [5.5, 'Screw the hinge halves to the pilaster,'], [10.5, 'hang the door,'], [12.5, 'and screw the other halves to the door.'], [19.5, 'Fit the latch on the door and the keeper on the pilaster,'], [24.5, 'then the coat hook,'], [27, 'and the pull on the outside.'], [31, 'The accessible stall\'s door closes on its own.'], [36, 'Adjust each door until the gaps are even.']]],
  [226, 'Check the finished run', [[0.3, 'Push on each pilaster top.'], [3.5, 'It should feel firm, with no rocking at the floor.'], [9, 'Test every latch, including from outside.'], [13.5, 'Then check every fixing one last time.']]],
]
const END0 = 244, DURATION = 254
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t]))
export const CAPTIONS = [
  [0.4, 'Here is how floor mounted partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]
// kit cards: [start, end, title, items]
const KITS = [
  [S[3] + 0.4, S[3] + 4.4, 'Floor anchor kit', [['Threaded anchor', () => HW.stud(3)], ['Nuts', () => HW.nut(), 3.4], ['Washers', () => HW.washer(), 3.6]]],
  [S[4] + 0.4, S[4] + 4.8, 'Wall bracket kit', [['Angle bracket', () => HW.angle()], ['Screws', () => HW.screw(1.1)], ['Wall plugs', () => HW.plug()], ['Through-bolt', () => HW.throughBolt()]]],
  [S[6] + 0.4, S[6] + 5.0, 'Pilaster kit', [['Leveling bracket', () => levelBracket(8)], ['Top nut and washer', () => nutWasher(), 3.8], ['Angle bracket', () => HW.angle(0.8)], ['Screws', () => HW.screw(1.1)], ['Through-bolt', () => HW.throughBolt()]]],
  [S[9] + 0.4, S[9] + 5.2, 'Door hardware', [['Hinge', () => hingeSet()], ['Latch', () => HW.slideLatch()], ['Keeper', () => HW.keeper()], ['Pull', () => HW.pull()], ['Coat hook', () => HW.coatHook()], ['Screws', () => HW.screw(0.8)]]],
]

// ---------- camera ----------
// The pilaster tops are at 70 and the ceiling at 96: moving into or out of a stall the camera passes directly over the
// line of pilasters and doors at 84, never through a panel, door or pilaster.
const P2 = 90.5 // centre of the third pilaster, the one most close-ups use
const PX = 95.75 // the panel line the wall-bracket close-ups use
const OVER = 84
const CAM = [
  [0, [MID + 40, 74, 300], [MID, 36, -22], 40],
  [6, [MID + 10, 86, 270], [MID, 0, -24], 40],
  [10.5, [MID - 6, 66, 150], [MID - 6, 40, -60], 40],
  [12.5, [MID - 6, 78, 156], [MID - 6, 16, -44], 40],
  [16.5, [MID + 10, 86, 262], [MID, 0, -24], 40],
  [23, [MID + 6, 84, 210], [MID, 10, -36], 40],
  [27.5, [MID + 2, 80, 180], [MID, 30, -50], 40],
  [29.5, [MID + 2, 80, 176], [MID, 30, -50], 40],
  // step 3: the two anchors at the third pilaster, then low along the front line for the level line
  [35, [P2 + 7, 7.5, 12], [P2 + 0.6, 1.4, -0.6], 40],
  [50.4, [P2 + 6, 7, 11], [P2 + 0.6, 1.4, -0.6], 40],
  [53, [RUN + 10, 22, 60], [MID - 18, 1, -1], 40],
  [61.5, [RUN + 4, 22, 54], [MID - 22, 1, -1], 40],
  // step 4: one bracket pair in close-up, then the wall from the front
  [67, [PX + 9, 67.5, -61.25 + 10], [PX + 0.8, 64, -61], 40],
  [78.5, [PX + 7, 67, -61.25 + 9], [PX + 0.4, 64, -61], 40],
  [83.5, [MID + 30, 92, 100], [MID - 6, 34, -54], 44],
  [91.5, [MID + 18, 86, 92], [MID - 12, 34, -54], 44],
  // step 5: panels drop in, then the through-bolt at a wall bracket
  [95, [RUN + 20, 150, 120], [MID - 6, 20, -36], 40],
  [99.5, [RUN + 8, 146, 110], [MID - 6, 20, -36], 40],
  [101.5, [PX + 13, 70, -61.25 + 17], [PX + 0.6, 64, -59.5], 40],
  [107.5, [PX + 10, 69, -61.25 + 14], [PX + 0.6, 64, -59.5], 40],
  // step 6: pilasters come down (wide), the top nuts at one foot, then over the tops into the second stall
  [113, [MID + 30, 64, 290], [MID, 36, -14], 40],
  [118.5, [MID + 22, 64, 276], [MID, 36, -14], 40],
  [121.5, [P2 + 7, 8, 12], [P2 + 0.6, 1.6, -0.6], 40],
  [125.5, [P2 + 6, 7.5, 11], [P2 + 0.6, 1.6, -0.6], 40],
  [126.8, [PX - 14, OVER, -0.6], [PX - 2, 62, -8], 40],
  [128.4, [PX - 15, 70, -16], [PX - 0.8, 63.5, -1.5], 40],
  [135.5, [PX - 12, 69, -13], [PX - 0.8, 63.5, -1.5], 40],
  [137, [PX - 14, OVER, -0.6], [PX - 2, 62, -8], 40],
  [138.8, [MID + 30, 70, 240], [MID, 40, -14], 40],
  [145.5, [MID + 16, 68, 226], [MID, 40, -14], 40],
  // step 7: a level across the tops, a level upright on a pilaster, the opening, the top nuts tightened
  [149, [RUN * 0.66, 46, 178], [RUN * 0.6, 64, -4], 40],
  [152.5, [RUN * 0.56, 48, 186], [RUN * 0.5, 62, -4], 40],
  [154.5, [P2 + 22, 50, 140], [P2 - 4, 40, -4], 40],
  [158, [P2 + 12, 52, 150], [P2 - 10, 40, -4], 40],
  [161.5, [P2 + 9, 6.5, 17], [P2 + 0.6, 1.8, -0.6], 40],
  [169.5, [P2 + 7.5, 6, 15], [P2 + 0.6, 1.8, -0.6], 40],
  // step 8: shoes come down (wide), then one screwed to its pilaster
  [172, [RUN * 0.66, 48, 178], [RUN * 0.6, 22, -4], 40],
  [176, [RUN * 0.6, 46, 170], [RUN * 0.55, 20, -4], 40],
  [177.6, [P2 + 12, 10, 24], [P2, 2.6, 0], 40],
  [181.5, [P2 + 10, 9.5, 21], [P2, 2.6, 0], 40],
  // step 9: hinge halves on the pilaster, the door, its halves, latch and keeper from inside, the pull, the swing
  [188, [16, 66, 26], [3.6, 60, 0], 40],
  [192, [15, 64, 30], [4.6, 54, 0], 40],
  [194, [22, 60, 46], [8, 50, 0], 40],
  [198.5, [20, 60, 42], [8, 50, 0], 40],
  [200, [RUN * 0.3, 70, 120], [RUN * 0.2, 50, -2], 40],
  [201.2, [24, OVER, -0.6], [32, 52, -12], 40],
  [202.4, [30, 47, -13], [37.5, 42, -1.2], 40],
  [204.2, [31, 47, -12], [37.5, 42, -1.2], 40],
  [205.6, [33, 46, -12], [39.5, 41, -1.3], 40],
  [206.8, [29, 61, -16], [21.5, 63, -1.2], 40],
  [208.4, [28, 61, -15], [21.5, 63, -1.2], 40],
  [209.3, [30, OVER, -0.6], [32, 56, -6], 40],
  [210.5, [44, 50, 32], [31, 41, 0], 40],
  [212.6, [45, 51, 35], [31, 41, 0], 40],
  [213.5, [46, 62, 96], [16, 46, 6], 40],
  [217, [44, 62, 92], [16, 46, 6], 40],
  [220, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [225.5, [RUN * 0.4, 58, 160], [RUN * 0.26, 44, -2], 40],
  // step 10: the push test, the latch from outside, then the whole run
  [228.5, [P2 + 44, 66, 130], [P2, 44, -4], 40],
  [233, [P2 + 34, 64, 120], [P2, 44, -4], 40],
  [235.5, [62, 50, 76], [32, 40, 0], 40],
  [238.5, [58, 50, 72], [32, 40, 0], 40],
  [240.5, [MID + 30, 64, 290], [MID, 50, -14], 40],
  [244, [MID + 12, 62, 264], [MID, 50, -14], 40],
  [254, [MID - 8, 62, 244], [MID, 48, -14], 40],
]

// when each scene part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { panel: [S[5] + 2.5, 0.5], pilaster: [S[6] + 7, 0.45], shoe: [S[6] + 5.4, 0.3], door: [S[9] + 10, 0.6], grab: [S[10] + 12, 0] }
const DOOR0_IN = S[9] + 10 // the accessible door; the others follow at S[9] + 16
const GLOW = { panel: [S[5] + 2.5, S[5] + 8], pilaster: [S[6] + 7, S[6] + 12], shoe: [S[8] + 1, S[9] - 0.3], door: [S[9] + 10, S[9] + 13], grab: [S[10] + 12, S[10] + 14] }
const SHOE_UP = 7, SHOE_DOWN = [S[8] + 2.5, 0.4]
const SWING = [S[9] + 31.5, S[9] + 34]
const DROP = 22
const XRAY = (t) => win(t, S[6] + 11.6, S[6] + 19, 0.6, 0.6) + win(t, S[7] + 15.6, S[7] + 22.5, 0.6, 0.6)

// ---------- camera spline (Hermite, monotone tangents: no overshoot into walls or floor) ----------
function spline(keys, t) {
  const n = keys.length
  if (t <= keys[0][0]) return keys[0]
  if (t >= keys[n - 1][0]) return keys[n - 1]
  let i = 0; while (keys[i + 1][0] < t) i++
  const [t0, t1] = [keys[i][0], keys[i + 1][0]], h = t1 - t0, u = (t - t0) / h
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2
  const tan = (j, get) => {
    if (j <= 0 || j >= n - 1) return 0
    const a = (get(keys[j]) - get(keys[j - 1])) / (keys[j][0] - keys[j - 1][0]), b = (get(keys[j + 1]) - get(keys[j])) / (keys[j + 1][0] - keys[j][0])
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b)
  }
  const comp = (get) => h00 * get(keys[i]) + h10 * h * tan(i, get) + h01 * get(keys[i + 1]) + h11 * h * tan(i + 1, get)
  return [t, [0, 1, 2].map((c) => comp((k) => k[1][c])), [0, 1, 2].map((c) => comp((k) => k[2][c])), comp((k) => k[3])]
}

// ---------- extra models for this style ----------
// leveling bracket at the pilaster's foot: a plate the anchors pass through, with a tab screwed to the pilaster
function levelBracket(w) {
  const g = new THREE.Group(), T = 1.25
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, T + 0.5), HW.MAT.zinc); base.castShadow = true
  const tab = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, 0.12), HW.MAT.zinc); tab.position.set(0, 0.7, T / 2 + 0.06); tab.castShadow = true
  g.add(base, tab)
  for (const x of [-w / 2 + 1.2, w / 2 - 1.2]) { const s = HW.screw(0.6); s.rotation.x = Math.PI / 2; s.position.set(x, 0.9, T / 2 + 0.12); g.add(s) }
  return g
}
function nutWasher() { const g = new THREE.Group(), w = HW.washer(0.6, 0.07), n = HW.nut(0.42, 0.3); n.position.y = 0.07; g.add(w, n); return g }
function hingeSet() { const g = new THREE.Group(), a = HW.hingeLeaf(1.4), b = HW.hingeLeaf(1.8), k = HW.knuckle(); a.position.x = -1.65; b.position.x = 0.25; k.rotation.x = Math.PI / 2; g.add(a, b, k); return g }
// an angle bracket mirrored so its outward leg points along world `side` once placed with normal n
function sidedAngle(a, b, h, n, side) {
  const g = new THREE.Group(), inner = HW.angle(a, b, h); g.add(inner)
  HW.orient(g, n); const xw = V(1, 0, 0).applyQuaternion(g.quaternion)
  if (xw.dot(side) < 0) inner.scale.x = -1
  return inner.parent
}

// ---------- 3D ----------
let renderer, composer, renderPass, ao, camera, scene, spec, P = {}, door0, ops, kits, now = 0
const tagged = [], marks = [], wallMarks = [], supports = [], backing = []
const anchors = [] // [x, z, pilaster index] of every anchor
const CANVAS = document.getElementById('gl')
function setup({ specs, width, height, gl = 1 }) {
  P = { width, height, gl }
  spec = specs[STYLE]
  const T = spec.pil.t
  spec.pilasters.forEach((p, i) => (p.w > 4 ? [p.x + 1.4, p.x + p.w - 1.4] : [p.x + p.w / 2]).forEach((x) => anchors.push([x, -T / 2, i])))
  renderer = new THREE.WebGLRenderer({ canvas: CANVAS, antialias: false, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1); renderer.setSize(width * gl, height * gl, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false
  camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 3000)
  scene = buildScene({ spec, finish: 'cream', renderer, view: 'angle' })
  const d0 = spec.doors[0], pl = spec.pull
  scene.traverse((o) => {
    if (!o.isMesh || !o.userData.part) return
    const b = new THREE.Box3().setFromObject(o), c = new THREE.Vector3(); b.getCenter(c)
    // the scene's flat panel brackets are replaced by the hardware below
    if (o.userData.part === 'panel' && b.max.x - b.min.x < 0.5) o.userData.part = 'hidden'
    // the accessible door's hinges and pull are replaced by parts that go on one at a time
    if (o.userData.part === 'door' && o.userData.idx === 0) {
      const h = b.max.y - b.min.y
      if (c.x < d0.x + 6 && h > 3 && h < 5) o.userData.part = 'hidden'
      if (c.x > d0.x + d0.w - pl.fromEdge - 1 && c.x < d0.x + d0.w - pl.fromEdge + pl.w + 1 && c.y > pl.top - pl.h - 1 && c.z > 0.2) o.userData.part = 'hidden'
    }
    o.material = o.material.clone(); o.material.transparent = true
    o.userData.p0 = o.position.clone(); tagged.push(o)
  })
  hingeDoor()
  addMarks(); addSupports(); addBacking()
  ops = new HW.Ops(scene)
  buildOps()
  kits = new HW.Kits(width, height); kits.setEnv(renderer, RoomEnvironment)
  for (const [a, b, title, items] of KITS) kits.card(a, b, title, items.map(([name, make, size]) => ({ name, make, size })))
  const W = width * gl, H = height * gl
  composer = new EffectComposer(renderer)
  composer.setPixelRatio(1); composer.setSize(W, H)
  renderPass = new RenderPass(scene, camera); composer.addPass(renderPass)
  ao = new GTAOPass(scene, camera, W, H)
  ao.updateGtaoMaterial({ radius: 14, distanceExponent: 1.4, thickness: 6, scale: 1.1, samples: Number(new URLSearchParams(location.search).get('ao') ?? 16) }); ao.blendIntensity = 0.85
  if (!location.search.includes('noao')) composer.addPass(ao)
  composer.addPass(new OutputPass())
  if (!location.search.includes('nosmaa')) composer.addPass(new SMAAPass(W, H))
  renderer.shadowMap.needsUpdate = true
}
function hingeDoor() {
  const d = spec.doors[0], hx = d.x + spec.door.gap / 2, hz = 0.14
  door0 = new THREE.Group(); door0.position.set(hx, 0, hz); scene.add(door0)
  for (const o of tagged.filter((o) => o.userData.part === 'door' && o.userData.idx === 0)) {
    scene.remove(o); door0.add(o); o.position.sub(door0.position); o.userData.p0 = o.position.clone()
  }
}
// orange chalk lines: the pilaster line, each panel line to the back wall, each pilaster's footprint, a cross at every
// anchor point; panel lines carried up the wall
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
  anchors.forEach(([x, z], i) => { strip(x - 1.1, x + 1.1, z - 0.25, z + 0.25, 'x', 6.6 + i * 0.12); strip(x - 0.25, x + 0.25, z - 1.1, z + 1.1, 'z', 6.6 + i * 0.12) })
  spec.panels.forEach((px, i) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.renderOrder = 4
    s.userData = { px, order: 9.2 + i * 0.4 }; scene.add(s); wallMarks.push(s)
  })
}
function addSupports() {
  const { y0, front, backGap } = spec.panel
  for (const px of spec.panels) for (const z of [-front - 6, -spec.depth + backGap + 6]) {
    const b = HW.block(3.5, y0); b.position.set(px, 0, z); b.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true } })
    scene.add(b); supports.push(b)
  }
}
function addBacking() {
  const fill = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })
  const line = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true })
  const rect = (w, h, pos, rotY) => {
    const g = new THREE.PlaneGeometry(w, h), m = new THREE.Mesh(g, fill.clone()), l = new THREE.LineSegments(new THREE.EdgesGeometry(g), line.clone())
    for (const o of [m, l]) { o.position.set(...pos); o.rotation.y = rotY; o.renderOrder = 5; scene.add(o); backing.push(o) }
  }
  for (const px of spec.panels) rect(10, 62, [px, 41, -spec.depth + 0.08], 0)
}

// the stack on each anchor, bottom to top: clamp washer and nut on the floor, leveling nut and washer, the pilaster's
// leveling bracket, washer and top nut
const Y = { clampW: 0, clampN: 0.07, levN: 0.5, levW: 0.8, topW: 1.0, topN: 1.07 }
const BR_Y = [18, 64]
function buildOps() {
  const T = spec.pil.t, wallZ = -spec.depth + 0.06, pt = spec.panel.t // the tiles sit 0.05 in front of the wall line
  // leveling brackets ride on each pilaster's foot (tagged as pilaster parts, so they come down with it)
  spec.pilasters.forEach((p, idx) => {
    const g = levelBracket(Math.max(2.4, p.w - 0.6)); g.position.set(p.x + p.w / 2, spec.pil.y0 - 0.07, -T / 2); scene.add(g)
    g.traverse((m) => { if (m.isMesh) { m.userData.part = 'pilaster'; m.userData.idx = idx; m.material = m.material.clone(); m.material.transparent = true; m.userData.p0 = m.position.clone(); tagged.push(m) } })
  })
  // --- step 3: anchors. Close-up at the third pilaster's two anchors, then the rest quickly ---
  const t3 = S[3] + 5
  let k = 0
  anchors.forEach(([x, z, i], j) => {
    const pos = V(x, 0, z), at = (y) => V(x, y, z)
    if (i === 2) {
      const a = anchors.filter((n) => n[2] === 2).findIndex((n) => n[0] === x), t = t3 + a * 2.4
      ops.add(HW.drill(), pos, UP, t, { kind: 'tool', dur: 0.35, hold: 0.6, dist: 4, depth: 0.6, down: V(0, 0, 1) })
      ops.hole(pos, UP, t + 0.5, 0.26, t + 1.7)
      ops.add(HW.stud(2), pos, UP, t + 1.4, { dist: 3, dur: 0.8 })
      ops.add(HW.washer(0.6, 0.07), at(Y.clampW), UP, S[3] + 12.2 + a, { dist: 2.4, dur: 0.6 })
      ops.add(HW.nut(0.42, 0.3), at(Y.clampN), UP, S[3] + 12.6 + a, { dist: 2.4, dur: 0.9, spin: 3 })
      ops.add(HW.nut(0.42, 0.3), at(Y.levN), UP, S[3] + 16.2 + a * 0.6, { dist: 2.2, dur: 1, spin: 4 })
      ops.add(HW.washer(0.6, 0.06), at(Y.levW), UP, S[3] + 17 + a * 0.6, { dist: 1.8, dur: 0.6 })
    } else {
      const t = S[3] + 21.5 + (k++) * 0.3
      ops.add(HW.stud(2), pos, UP, t, { dist: 3, dur: 0.5 })
      ops.add(HW.washer(0.6, 0.07), at(Y.clampW), UP, t + 0.3, { dist: 2, dur: 0.4 })
      ops.add(HW.nut(0.42, 0.3), at(Y.clampN), UP, t + 0.4, { dist: 2, dur: 0.5, spin: 2 })
      ops.add(HW.nut(0.42, 0.3), at(Y.levN), UP, t + 0.6, { dist: 2, dur: 0.5, spin: 2 })
      ops.add(HW.washer(0.6, 0.06), at(Y.levW), UP, t + 0.8, { dist: 1.6, dur: 0.4 })
    }
  })
  // --- step 4: wall brackets. Close-up on the upper pair at PX, then the rest quickly ---
  const wallBracket = (px, y, s, t, detailed) => {
    const face = px + s * pt / 2
    const legX = face + s * 0.95
    const holes = [y + 0.5, y - 0.5]
    if (detailed) {
      holes.forEach((hy, i) => HW.drillPlug(ops, V(legX, hy, wallZ), FRONT, t + i * 1.9))
      ops.add(sidedAngle(1.5, 1.5, 2, FRONT, V(s, 0, 0)), V(face, y, wallZ), FRONT, t + 4, { dist: 4, dur: 0.6 })
      holes.forEach((hy, i) => HW.driveScrew(ops, V(legX, hy, wallZ + 0.12), FRONT, t + 4.9 + i * 1.6))
    } else {
      ops.add(sidedAngle(1.5, 1.5, 2, FRONT, V(s, 0, 0)), V(face, y, wallZ), FRONT, t, { dist: 5, dur: 0.5 })
      holes.forEach((hy) => ops.add(HW.screw(1), V(legX, hy, wallZ + 0.12), FRONT, t + 0.3, { dist: 1.2, dur: 0.4, spin: 2 }))
    }
  }
  const t4 = S[4] + 5.2
  wallBracket(PX, 64, 1, t4, true)
  wallBracket(PX, 64, -1, t4 + 8.6, false)
  k = 0
  for (const px of spec.panels) for (const y of BR_Y) for (const s of [1, -1]) {
    if (px === PX && y === 64) continue
    wallBracket(px, y, s, S[4] + 20.5 + (k++) * 0.28, false)
  }
  // --- step 5: through-bolts at the wall brackets ---
  const t5 = S[5] + 10.5
  for (const px of spec.panels) for (const y of BR_Y) {
    const pos = V(px + pt / 2 + 0.12, y, wallZ + 0.85)
    if (px === PX && y === 64) HW.driveScrew(ops, pos, V(1, 0, 0), t5, { len: 1.4, down: V(0, -1, 0) })
    else ops.add(HW.throughBolt(1.2), pos, V(1, 0, 0), t5 + 2.5 + spec.panels.indexOf(px) * 0.3 + (y === 18 ? 0.15 : 0), { dist: 1.5, dur: 0.4, spin: 2 })
  }
  // --- step 6: a washer and top nut on each anchor once its pilaster is down; close-up at the third pilaster ---
  k = 0
  anchors.forEach(([x, z, i]) => {
    const a = anchors.filter((n) => n[2] === i).findIndex((n) => n[0] === x)
    const t = i === 2 ? S[6] + 14 + a * 1.4 : S[6] + 16 + (k++) * 0.1
    ops.add(HW.washer(0.6, 0.07), V(x, Y.topW, z), UP, t, { dist: 2, dur: 0.5 })
    ops.add(HW.nut(0.42, 0.3), V(x, Y.topN, z), UP, t + 0.4, { dist: 2, dur: 0.8, spin: 3 })
  })
  // pilaster brackets and bolts: close-up inside the second stall at PX's pilaster end
  const pilZ = -T
  const pilBracket = (px, y, s, t, detailed) => {
    const face = px + s * pt / 2, legX = face + s * 0.45
    ops.add(sidedAngle(0.75, 1.5, 2, BACK, V(s, 0, 0)), V(face, y, pilZ), BACK, t, { dist: detailed ? 3 : 4, dur: 0.5 })
    for (const [i, hy] of [y + 0.5, y - 0.5].entries()) {
      if (detailed) HW.driveScrew(ops, V(legX, hy, pilZ - 0.12), BACK, t + 0.9 + i * 1.5, { len: 0.8 })
      else ops.add(HW.screw(0.8), V(legX, hy, pilZ - 0.12), BACK, t + 0.3, { dist: 1, dur: 0.4, spin: 2 })
    }
  }
  const t6 = S[6] + 20.5
  pilBracket(PX, 64, -1, t6, true)
  pilBracket(PX, 64, 1, t6 + 3.7, false)
  HW.driveScrew(ops, V(PX - pt / 2 - 0.12, 64, pilZ - 0.85), V(-1, 0, 0), S[6] + 24.8, { len: 1.4 })
  k = 0
  for (const px of spec.panels) for (const y of BR_Y) {
    if (!(px === PX && y === 64)) for (const s of [-1, 1]) pilBracket(px, y, s, S[6] + 27 + (k++) * 0.18, false)
    if (!(px === PX && y === 64)) ops.add(HW.throughBolt(1.2), V(px - pt / 2 - 0.12, y, pilZ - 0.85), V(-1, 0, 0), S[6] + 29 + k * 0.1, { dist: 1.5, dur: 0.4, spin: 2 })
  }
  // --- step 7: a level across two pilaster tops, a level upright on the third pilaster, a wrench on its top nuts ---
  const p2 = spec.pilasters[2], p3 = spec.pilasters[3], y1 = spec.pil.y1
  ops.add(HW.level(44), V((p2.x + p2.w / 2 + p3.x + p3.w / 2) / 2, y1, -T / 2), UP, S[7] + 0.8, { dist: 5, dur: 0.7, until: S[7] + 7.2 })
  ops.add(HW.level(30), V(p2.x + p2.w - 1.6, 36, 0), FRONT, S[7] + 7.8, { dist: 5, dur: 0.6, down: V(1, 0, 0), until: S[7] + 11.8 })
  anchors.filter((n) => n[2] === 2).forEach(([x, z], j) => ops.add(HW.wrench(), V(x, Y.topN + 0.15, z), UP, S[7] + 16.4 + j * 1.6, { kind: 'tool', dur: 0.3, hold: 0.9, dist: 2.5, swing: 0.7, down: V(1, 0, 0.6) }))
  // --- step 8: a screw through each shoe into its pilaster; close-up at the third ---
  spec.pilasters.forEach((p, i) => {
    const pos = V(p.x + p.w / 2, 2.4, spec.shoeOver + 0.02)
    if (i === 2) HW.driveScrew(ops, pos, FRONT, S[8] + 7.4, { len: 0.6 })
    else ops.add(HW.screw(0.6), pos, FRONT, S[8] + 9.6 + i * 0.2, { dist: 1, dur: 0.4, spin: 2 })
  })
  // --- step 9: hinge halves, door halves, latch, keeper, coat hook, pull ---
  const d0 = spec.doors[0], hx = d0.x + spec.door.gap / 2, { h, tops } = spec.hinge
  const dz1 = -T / 2 + spec.door.t / 2, dz0 = dz1 - spec.door.t
  const t9 = S[9] + 5.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? t9 : t9 + 4.1
    const pl = HW.hingeLeaf(1.3, h); pl.rotation.y = Math.PI // pilaster half: leaf extends to -x from the knuckle
    const plg = new THREE.Group(); plg.add(pl)
    ops.add(plg, V(hx - 0.1, y, 0), FRONT, t, { dist: 3, dur: 0.5 })
    ops.add(HW.knuckle(h), V(hx, y, 0.14), UP, t, { kind: 'show', dur: 0.2 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.6 + j * 1.25, { len: 0.7 })
      else ops.add(HW.screw(0.7), V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.4 + j * 0.2, { dist: 1, dur: 0.35, spin: 2 })
    }
  })
  // the door halves ride on the door (parent door0), so they swing with it
  const td = S[9] + 12.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? td : td + 4
    const dl = HW.hingeLeaf(1.8, h)
    ops.add(dl, V(hx + 0.2, y, dz1), FRONT, t, { dist: 2.5, dur: 0.5, parent: door0 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.5 + j * 1.2, { len: 0.7, parent: door0 })
      else ops.add(HW.screw(0.7), V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.3 + j * 0.2, { dist: 1, dur: 0.35, spin: 2, parent: door0 })
    }
  })
  // latch on the inside face near the latch edge, keeper on the next pilaster's back face, coat hook, pull outside
  const lx = d0.x + d0.w - 2.6, ly = spec.latch.y, tl = S[9] + 20
  ops.add(HW.slideLatch(), V(lx, ly, dz0), BACK, tl, { dist: 3, dur: 0.5, parent: door0, down: V(0, -1, 0) })
  ;[-0.9, 0.9].forEach((dx, j) => ops.add(HW.screw(0.6), V(lx + dx - 0.4, ly, dz0 - 0.36), BACK, tl + 0.8 + j * 0.5, { dist: 1, dur: 0.4, spin: 2, parent: door0 }))
  const kx = spec.pilasters[1].x + 0.55, tk = S[9] + 22.3
  ops.add(HW.keeper(), V(kx, ly, -T), BACK, tk, { dist: 3, dur: 0.5 })
  ;[0.6, -0.6].forEach((dy, j) => ops.add(HW.screw(0.6), V(kx, ly + dy, -T - 0.3), BACK, tk + 0.7 + j * 0.4, { dist: 1, dur: 0.4, spin: 2 }))
  ops.add(HW.coatHook(), V(d0.x + d0.w / 2, 64, dz0), BACK, S[9] + 24.6, { dist: 3, dur: 0.6, parent: door0 })
  const pl = spec.pull, px0 = d0.x + d0.w - pl.fromEdge + pl.w / 2, tp = S[9] + 28.3
  ops.add(HW.pull(), V(px0, pl.top - pl.h / 2, dz1), FRONT, tp, { dist: 3, dur: 0.6, parent: door0 })
  ;[pl.top - 0.6, pl.top - pl.h + 0.6].forEach((y, j) => ops.add(HW.screw(0.6), V(px0, y, dz1 + 0.05), FRONT, tp - 0.2, { kind: 'show', dur: 0.1, parent: door0 }))
}

let lastPose = ''
function pilDy(idx, t) { const [s, st] = IN.pilaster; return (1 - ease((t - s - idx * st) / 1.6)) * DROP }
function pose(t) {
  let moving = false
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    if (part === 'hidden') { o.visible = false; continue }
    let k = 1, dx = 0, dy = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'door') { const s = idx === 0 ? DOOR0_IN : S[9] + 16 + (idx - 1) * 0.5; k = clamp((t - s) / 0.75); dy = (1 - easeOut(k)) * 10 }
    if (part === 'pilaster' || part === 'shoe') {
      dy = pilDy(idx, t)
      if (part === 'shoe') { k = clamp((t - IN.shoe[0] - idx * IN.shoe[1]) / 0.6); dy += SHOE_UP * (1 - ease((t - SHOE_DOWN[0] - idx * SHOE_DOWN[1]) / 0.8)) }
      else k = clamp((t - S[6] - 5.3 - idx * 0.15) / 0.6)
    }
    if (part === 'contact') { m.opacity = 0.7 * clamp((t - SHOE_DOWN[0] - idx * SHOE_DOWN[1] - 0.6) / 0.4); o.visible = m.opacity > 0.01; continue }
    if (part === 'ceiling' || part === 'downlight') {
      const c = clamp((104 - camera.position.y) / 8)
      if (part === 'ceiling') { m.opacity = c; m.depthWrite = c > 0.99; o.visible = c > 0.01 } else o.visible = c > 0.5
      continue
    }
    m.opacity = clamp(k * 1.4)
    // the third pilaster turns see-through in the foot close-ups, so the nuts inside its foot show
    if (part === 'pilaster' && idx === 2) { const x = XRAY(t); m.opacity *= 1 - 0.72 * x; m.depthWrite = x < 0.01 }
    o.visible = m.opacity > 0.01
    o.position.set(o.userData.p0.x + dx, o.userData.p0.y + dy, o.userData.p0.z)
    if (dx || (dy && o.visible)) moving = true
    const g = GLOW[part]
    const gi = g ? win(t, g[0], g[1], 0.5, 0.6) * 0.85 : 0
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
  const mo = 1 - clamp((t - S[10]) / 1.5)
  for (const s of marks) {
    const { x0, x1, z0, z1, along, order } = s.userData
    const r = ease((t - S[2] - 0.6 - order) / 1.6)
    const X1 = along === 'x' ? x0 + (x1 - x0) * r : x1, Z1 = along === 'z' ? z0 + (z1 - z0) * r : z1
    s.visible = r > 0.001 && mo > 0.01; s.material.opacity = mo
    s.scale.set(Math.max(0.01, Math.abs(X1 - x0)), Math.max(0.01, Math.abs(Z1 - z0)), 1)
    s.position.set((x0 + X1) / 2, 0.06, (z0 + Z1) / 2)
  }
  // panel lines carried up the wall: they grow upwards, and fade once the panels are in
  const wm = 1 - clamp((t - S[5] - 8) / 1.5)
  for (const s of wallMarks) {
    const { px, order } = s.userData, r = ease((t - S[2] - 0.6 - order) / 1.4), hgt = 74 * r
    s.visible = r > 0.001 && wm > 0.01; s.material.opacity = wm
    s.scale.set(0.5, Math.max(0.01, hgt), 1); s.position.set(px, hgt / 2, -spec.depth + 0.06)
  }
  // blocks go in just before the panels and come out once everything is tightened
  supports.forEach((b, i) => {
    const v = clamp((t - IN.panel[0] + 1 - Math.floor(i / 2) * 0.5) / 0.5) * (1 - clamp((t - S[7] - 21) / 0.8))
    b.traverse((m) => { if (m.isMesh) m.material.opacity = v }); b.visible = v > 0.01
  })
  // wall backing in step 1 and while the wall brackets go up
  const bk = win(t, S[1] + 2.5, S[2], 1, 1) + win(t, S[4] + 4.8, S[4] + 20, 0.6, 1)
  backing.forEach((o) => {
    const v = bk * (0.8 + 0.2 * Math.sin(t * 3))
    o.material.opacity = (o.isLineSegments ? 1 : 0.3) * v; o.visible = v > 0.01
  })
  if (ops.update(t)) moving = true
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
const ov = $('#ov'), cap = $('#cap span'), stepEl = $('#step'), hookEl = $('#hook'), endEl = $('#end'), kitEl = $('#kit'), flash = $('#flash')
$('#dots').innerHTML = STEPS.map(() => '<i></i>').join('')
const dots = [...document.querySelectorAll('#dots i')]
const pil = (i) => spec.pilasters[i]
const AN = (j) => anchors.filter((n) => n[2] === 2)[j] // the third pilaster's two anchors
const LABELS = [
  [S[1] + 2.5, S[2] - 0.2, () => [spec.panels[1], 50, -spec.depth], 'Solid backing in the wall', 80, -140],
  [S[1] + 6, S[2] - 0.2, () => [MID - 6, 0.1, -30], 'Sound concrete floor', -80, 110],
  [S[2] + 8.2, S[3] - 0.2, () => [AN(0)[0], 0.1, AN(0)[1]], 'Anchor point', 70, -110],
  [S[2] + 11, S[3] - 0.2, () => [spec.panels[1], 60, -spec.depth], 'Panel line carried up the wall', 70, -110],
  [S[3] + 9.6, S[3] + 12.4, () => [AN(0)[0], 1.6, AN(0)[1]], 'Threaded anchor in the concrete', 70, -130],
  [S[3] + 13.8, S[3] + 16.2, () => [AN(0)[0] + 0.3, 0.25, AN(0)[1] + 0.4], 'Clamped to the floor', 70, -120],
  [S[3] + 17.6, S[3] + 20.6, () => [AN(1)[0] - 0.3, 0.68, AN(1)[1] + 0.4], 'Leveling nut', -80, -120],
  [S[3] + 25.6, S[4] - 0.3, () => [anchors[2][0], 0.85, anchors[2][1]], 'Leveling nuts on one level line', 40, -120],
  [S[4] + 6.4, S[4] + 9.2, () => [PX + 0.5 + 0.95, 64.5, -spec.depth], 'Wall plug in the backing', 90, -150],
  [S[4] + 10, S[4] + 13.2, () => [PX + 0.5 + 1.2, 65, -spec.depth + 0.2], 'Angle bracket', 120, -140],
  [S[4] + 14, S[4] + 17.4, () => [PX - 0.5, 64, -spec.depth + 1], 'The panel slots in between', -120, -150],
  [S[5] + 4, S[5] + 8.5, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Block holds the height', 90, -120],
  [S[5] + 11.2, S[6] - 0.3, () => [PX + 0.6, 64, -spec.depth + 0.85], 'Through-bolt, finger tight', 90, -140],
  [S[6] + 6, S[6] + 11, () => [pil(3).x + pil(3).w / 2, spec.pil.y0 + SHOE_UP + 2 + pilDy(3, now), 0.4], 'Shoe held up for now', 70, -110],
  [S[6] + 15, S[6] + 18.6, () => [AN(0)[0], Y.topN + 0.2, AN(0)[1] + 0.3], 'Top nut, finger tight', 70, -120],
  [S[6] + 21.2, S[6] + 24.4, () => [PX - 1, 64.5, -spec.pil.t], 'Bracket screwed to the pilaster', -80, -150],
  [S[6] + 25.2, S[6] + 27.6, () => [PX - 0.6, 64, -spec.pil.t - 0.85], 'Bolted through the panel', -60, -140],
  [S[7] + 1.6, S[7] + 7, () => [pil(3).x + pil(3).w / 2, spec.pil.y1 + 1.4, 0], 'Tops level with each other', 60, -110],
  [S[7] + 8.4, S[7] + 11.8, () => [pil(2).x + pil(2).w, 44, 0], 'Plumb both ways', 80, -100],
  [S[7] + 12.2, S[7] + 15.4, () => [(pil(1).x + pil(1).w + pil(2).x) / 2, 60, 0], 'Door opening to the drawings', 40, -100],
  [S[7] + 17, S[7] + 19.8, () => [AN(0)[0], Y.topN + 0.2, AN(0)[1] + 0.3], 'Tightened', 70, -120],
  [S[7] + 20.2, S[8] - 0.3, () => [P2, 4, 0.3], 'No headrail: each pilaster stands on its anchors', 60, -150],
  [S[8] + 3.6, S[8] + 6.6, () => [pil(3).x + pil(3).w / 2, 2, 0.5], 'The shoe covers the anchors', 70, -120],
  [S[8] + 8.6, S[9] - 0.3, () => [P2, 2.4, spec.shoeOver + 0.1], 'Secured', 70, -110],
  [S[9] + 6.2, S[9] + 9.8, () => [spec.doors[0].x - 0.7, spec.hinge.tops[0] - 2, 0.2], 'Hinge half on the pilaster', 80, -100],
  [S[9] + 13.2, S[9] + 16.4, () => [spec.doors[0].x + 1.3, spec.hinge.tops[0] - 2, 0.2], 'Other half on the door', 90, 100],
  [S[9] + 20.6, S[9] + 22.2, () => [spec.doors[0].x + spec.doors[0].w - 2.6, spec.latch.y, -1.4], 'Latch', -60, -120],
  [S[9] + 22.8, S[9] + 24.4, () => [spec.pilasters[1].x + 0.55, spec.latch.y, -spec.pil.t - 0.5], 'Keeper', 70, -120],
  [S[9] + 25.2, S[9] + 27, () => [spec.doors[0].x + spec.doors[0].w / 2, 65, -1.6], 'Coat hook', 70, -100],
  [S[9] + 28.9, S[9] + 31, () => [spec.doors[0].x + spec.doors[0].w - spec.pull.fromEdge + spec.pull.w / 2, spec.pull.top - 1, 1.3], 'Pull', 70, -100],
  [S[9] + 31.2, S[9] + 35, () => [spec.doors[0].x, spec.hinge.tops[0] - 2, 0.4], 'Hinges set the resting position', 70, -80],
  [S[9] + 36.6, S[10] - 0.3, () => [pil(2).x - 0.15, 46, 0.3], 'Even gaps', 70, -110],
  [S[10] + 2.6, S[10] + 8.4, () => [P2, spec.pil.y1 - 2, 0.6], 'Firm, no rocking at the floor', 70, -100],
  [S[10] + 10.2, S[10] + 13.6, () => [spec.doors[0].x + spec.doors[0].w - spec.latch.fromEdge, spec.latch.y, 0.6], 'Opens from outside in an emergency', 60, -110],
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
// step 3: the level line across the leveling nuts; step 7: a plumb line down a pilaster and a door opening's width;
// step 10: a push arrow at a pilaster top
function guides(t) {
  let s = ''
  let r = win(t, S[3] + 25.2, S[4] - 0.3, 0.6, 0.4)
  if (r > 0) { const a = anchors[0], b = anchors[anchors.length - 1]; s += dashed([a[0] - 3, Y.levW + 0.06, a[1]], [b[0] + 3, Y.levW + 0.06, b[1]], r, ease((t - S[3] - 25.2) / 2)) }
  const y1 = spec.pil.y1 + 0.4
  r = win(t, S[7] + 7.8, S[7] + 12, 0.5, 0.4)
  if (r > 0) s += dashed([pil(2).x + pil(2).w + 0.2, y1, 0.2], [pil(2).x + pil(2).w + 0.2, 0.5, 0.2], r, ease((t - S[7] - 7.8) / 1.2))
  r = win(t, S[7] + 12, S[7] + 15.6, 0.5, 0.3)
  if (r > 0) {
    const a = project([pil(1).x + pil(1).w, 60, 0.3]), b = project([pil(2).x, 60, 0.3])
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
      `<line x1="${a[0]}" y1="${a[1] - 22}" x2="${a[0]}" y2="${a[1] + 22}"/><line x1="${b[0]}" y1="${b[1] - 22}" x2="${b[0]}" y2="${b[1] + 22}"/></g>`
  }
  r = win(t, S[10] + 0.8, S[10] + 8.4, 0.5, 0.4)
  if (r > 0) {
    // a push arrow towards the pilaster top, pulsing
    const [x, y] = project([P2, spec.pil.y1 - 2, 0.6]), p = Math.abs(Math.sin((t - S[10] - 0.8) * Math.PI / 1.4)) * 18
    const x0 = x + 150 - p, x1 = x + 34 - p
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="10" stroke-linecap="round" fill="#fe7802"><line x1="${x0}" y1="${y}" x2="${x1 + 16}" y2="${y}"/>` +
      `<path d="M${x1} ${y} l28 -20 v40 z" stroke-width="4"/></g>`
  }
  return s
}

window.frameAt = function (t) {
  now = t
  const kc = kits.update(t)
  if (kc) {
    renderPass.scene = kits.scene; renderPass.camera = kits.camera; ao.enabled = false
    composer.render()
    renderPass.scene = scene; renderPass.camera = camera; ao.enabled = true
  } else { aim(t); pose(t); composer.render() }
  // kit card overlay: title and part names; a short white dip hides the cut in and out
  if (kc) {
    kitEl.style.opacity = 1
    kitEl.querySelector('h2').textContent = kc.title
    kitEl.querySelector('.names').innerHTML = kits.labels(kc, P.width, P.height).map((l, i) =>
      `<b style="left:${l.x}px;top:${l.y}px;opacity:${easeOut((t - kc.t0 - 0.4 - i * 0.12) / 0.5)}">${l.name}</b>`).join('')
  } else kitEl.style.opacity = 0
  const fd = Math.max(...kits.cards.map((c) => Math.max(1 - Math.abs(t - c.t0 + 0.05) / 0.35, 1 - Math.abs(t - c.t1 - 0.05) / 0.35, 0)))
  flash.style.opacity = fd
  const active = kc ? [] : LABELS.filter(([a, b]) => t > a && t < b).slice(0, 3)
  ov.innerHTML = kc ? '' : active.map((l, i) => label(i, l, t)).join('') + guides(t)
  for (let i = active.length; i < 3; i++) document.getElementById('l' + i).style.opacity = 0
  hookEl.style.opacity = clamp((S[1] - t) / 0.7)
  $('#hook .txt').style.opacity = clamp((t - 0.3) / 0.8) * clamp((S[1] - 0.2 - t) / 0.5)
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
  endEl.style.opacity = clamp((t - END0) / 0.6)
  endEl.querySelectorAll('.e').forEach((el, j) => { const a = easeOut((t - END0 - 0.3 - j * 0.3) / 0.6); el.style.opacity = a; el.style.transform = `translateY(${20 * (1 - a)}px)` })
  $('#brand').style.opacity = t >= END0 ? 0 : 1
  $('#brand').style.color = t < S[1] ? '#fbfaf9' : '#1c0e05'
  let c = CAPTIONS[0]; for (const x of CAPTIONS) if (t >= x[0]) c = x
  cap.textContent = c[1]
  cap.parentElement.style.opacity = t < c[0] ? 0 : clamp((t - c[0]) / 0.25)
  return true
}
window.DURATION = DURATION
window.setupFilm = setup
window.__ready = true
