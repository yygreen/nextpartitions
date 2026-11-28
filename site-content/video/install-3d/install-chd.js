// Installation video, ceiling hung, detailed version (about 4:17): the pilasters hang from threaded rods that come down
// through the ceiling from structural steel, nothing at the floor. Every step with hardware opens with its kit card, and
// every fastening is shown at least once in close-up: wall plugs and wall brackets, through-bolts at the wall, the nuts
// run onto the rods and the slotted hanging bar slid between them, the support nuts turned to level, the pilaster
// brackets, the top nuts tightened, the trim sleeves screwed off, and the door hardware piece by piece. Then the rest
// of the same parts go on quickly in a wide shot. The steel above the ceiling shows as an x-ray (the ceiling cut away
// along the pilaster line), and the hardware inside a pilaster top shows by turning that pilaster see-through.
// Hardware and tools are generic (hardware.js), not any one manufacturer's. The plan is
// research/install-guides/video-ceiling-hung-plan.md. render.mjs calls window.frameAt(t) for every frame. Units: inches.
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
const STYLE = 'ceiling-hung'
const RUN = 168.5, MID = RUN / 2
const UP = V(0, 1, 0), DOWN = V(0, -1, 0), FRONT = V(0, 0, 1), BACK = V(0, 0, -1)

// ---------- timeline ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [6, 'Check the steel above the ceiling', [[0.3, 'Ceiling hung pilasters hang from steel above the ceiling.'], [4, 'Others put it in, before the ceiling is closed.'], [7.8, 'Never hang from the ceiling grid or drywall. No steel? Stop.']]],
  [18, 'Lay out from the rods', [[0.3, 'Check each rod comes through where the drawings show.'], [4.6, 'Plumb down from each rod to the floor,'], [8, 'then mark the pilaster line and each panel line.']]],
  [30, 'Fix the wall brackets', [[0.3, 'Wall bracket kit: angle brackets, screws, wall plugs and through-bolts.'], [5.2, 'Drill into the backing and push in a wall plug.'], [9.5, 'Screw the bracket to the wall,'], [13.5, 'with a second bracket on the other side of the panel line.'], [17.5, 'Repeat at each bracket height on every panel line.']]],
  [60, 'Set the panels in place', [[0.3, 'Rest each panel on blocks at the height on the drawings.'], [5, 'It drops in between its wall brackets.'], [9, 'Bolt it through the brackets, finger tight for now.']]],
  [76, 'Hang the pilasters', [[0.3, 'Hanging hardware: slotted hanging bars, nuts, trim sleeves and screws.'], [5, 'Run a top nut and a support nut onto each rod, with a gap between them.'], [9.5, 'Slide the trim sleeve onto the pilaster and hold it down.'], [12.5, 'Lift the pilaster and slide its hanging bar into the gap.'], [16.5, 'It rests on the support nut. The top nut stays loose.'], [21.5, 'Hang the rest the same way.']]],
  [106, 'Level the bottoms', [[0.3, 'Turn the support nuts to raise or lower each pilaster,'], [5.5, 'until the bottoms line up with the panels,'], [8.5, 'all at one height, clear of the floor.']]],
  [118, 'Connect the pilasters to the panels', [[0.3, 'Pilaster brackets: angle brackets, screws and through-bolts.'], [5, 'Screw a bracket to the pilaster on each side of the panel,'], [9.5, 'and bolt them through the panel.'], [13.5, 'Do the same at every bracket height.'], [18.5, 'Leave everything finger tight for now.']]],
  [142, 'Plumb, then tighten', [[0.3, 'Get each pilaster plumb both ways.'], [4, 'Set the door openings to the drawings.'], [8, 'Then tighten each top nut down onto its bar'], [11.6, 'and every bracket,'], [13.6, 'and check the nuts at the steel.']]],
  [160, 'Check for sway', [[0.3, 'Push the bottom of each pilaster.'], [3, 'It should feel firm. A long drop can sway.'], [6, 'Fit bracing where the system calls for it.']]],
  [171, 'Raise the sleeves to the ceiling', [[0.3, 'Push each trim sleeve up to the ceiling,'], [4, 'so it covers the hanging hardware,'], [7, 'and screw it to the pilaster.']]],
  [183, 'Hang the doors and fit the hardware', [[0.3, 'Door hardware: hinges, latch, keeper, pull, coat hook and screws.'], [5.5, 'Screw the hinge halves to the pilaster,'], [10.5, 'hang the door,'], [12.5, 'and screw the other halves to the door.'], [19.5, 'Fit the latch on the door and the keeper on the pilaster,'], [24.5, 'then the coat hook,'], [27, 'and the pull on the outside.'], [31, 'The accessible stall\'s door closes on its own.'], [36, 'Adjust each door until the gaps are even.']]],
  [227, 'Check the finished run', [[0.3, 'Check every pilaster is still plumb, with an even gap at the floor.'], [5.5, 'The floor stays clear, so it cleans in one pass.'], [10, 'Test every latch, including from outside.'], [15, 'Then check every fixing one last time.']]],
]
const END0 = 247, DURATION = 257
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t]))
export const CAPTIONS = [
  [0.4, 'Here is how ceiling hung partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]
// kit cards: [start, end, title, items]
const KITS = [
  [S[3] + 0.4, S[3] + 4.8, 'Wall bracket kit', [['Angle bracket', () => HW.angle()], ['Screws', () => HW.screw(1.1)], ['Wall plugs', () => HW.plug()], ['Through-bolt', () => HW.throughBolt()]]],
  [S[5] + 0.4, S[5] + 4.6, 'Hanging hardware', [['Slotted hanging bar', () => hangBar(9, [-3.5, 3.5])], ['Nuts', () => HW.nut(), 3.2], ['Trim sleeve', () => trimSleeve(12)], ['Screws', () => HW.screw(0.7), 4.2]]],
  [S[7] + 0.4, S[7] + 4.6, 'Pilaster brackets', [['Angle bracket', () => HW.angle(0.8)], ['Screws', () => HW.screw(1.1)], ['Through-bolt', () => HW.throughBolt()]]],
  [S[11] + 0.4, S[11] + 5.2, 'Door hardware', [['Hinge', () => hingeSet()], ['Latch', () => HW.slideLatch()], ['Keeper', () => HW.keeper()], ['Pull', () => HW.pull()], ['Coat hook', () => HW.coatHook()], ['Screws', () => HW.screw(0.8)]]],
]

// ---------- camera ----------
const P2 = 90.5 // centre of the third pilaster, the one most close-ups use
const PX = 95.75 // the panel line the wall-bracket close-ups use
const D11 = S[11] - 180 // the door step's camera keys follow the overhead braced video's, shifted
const CAM = [
  [0, [MID + 40, 62, 300], [MID, 48, -22], 40],
  [6, [MID + 14, 60, 262], [MID, 56, -24], 40],
  // step 1: the empty room with the backing, then low under the ceiling, looking up along the pilaster line
  [9.5, [MID + 8, 58, 236], [MID, 62, -24], 40],
  [13, [MID + 40, 36, 112], [MID - 4, 98, -4], 44],
  [17.5, [MID + 32, 34, 104], [MID - 8, 98, -4], 44],
  // step 2: a rod coming through the ceiling, then down to the floor marks
  [20.5, [P2 + 26, 76, 50], [P2 - 4, 93, -1], 40],
  [23, [P2 + 22, 76, 46], [P2 - 4, 93, -1], 40],
  [26, [MID + 16, 72, 206], [MID, 42, -24], 40],
  [29.5, [MID + 10, 74, 200], [MID, 42, -24], 40],
  // step 3: one bracket pair in close-up, then the wall from the front
  [35, [PX + 9, 67.5, -61.25 + 10], [PX + 0.8, 64, -61], 40],
  [46.5, [PX + 7, 67, -61.25 + 9], [PX + 0.4, 64, -61], 40],
  [51.5, [MID + 30, 86, 100], [MID - 6, 34, -54], 44],
  [59.5, [MID + 18, 84, 92], [MID - 12, 34, -54], 44],
  // step 4: panels drop in, then the through-bolt at a wall bracket
  [63, [RUN + 4, 66, 112], [MID, 26, -30], 40],
  [67.5, [RUN - 4, 64, 104], [MID, 26, -30], 40],
  [69.5, [PX + 13, 70, -61.25 + 17], [PX + 0.6, 64, -59.5], 40],
  [75.5, [PX + 10, 69, -61.25 + 14], [PX + 0.6, 64, -59.5], 40],
  // step 5: the rod ends at one pilaster; nuts run on; the pilaster comes up and its bar slides in; the rest
  [80.8, [P2 + 15, 86, 26], [P2, 92.6, -1], 40],
  [84.5, [P2 + 13, 86, 23], [P2, 92.6, -1], 40],
  [86.5, [P2 + 30, 74, 56], [P2, 84, -1], 40],
  [89.5, [P2 + 26, 76, 50], [P2, 86, -1], 40],
  [91.5, [P2 + 14, 87, 24], [P2, 93, -1], 40],
  [96.5, [P2 + 12, 87, 22], [P2, 93, -1], 40],
  [99, [MID + 22, 60, 222], [MID, 52, -14], 40],
  [106, [MID + 16, 58, 212], [MID, 50, -14], 40],
  // step 6: a wrench on the support nut, then low along the pilaster bottoms
  [108, [P2 + 14, 87, 24], [P2, 92.6, -1], 40],
  [111.5, [P2 + 12, 87, 22], [P2, 92.6, -1], 40],
  [113.5, [RUN + 16, 16, 64], [MID - 20, 12, -2], 40],
  [118, [RUN + 10, 15, 58], [MID - 24, 12, -2], 40],
  // step 7: the brackets at the pilaster from inside the stall (in over the open door opening), then the run
  [122.8, [PX - 15, 70, -16], [PX - 0.8, 63.5, -1.5], 40],
  [130.4, [PX - 12, 69, -13], [PX - 0.8, 63.5, -1.5], 40],
  [131.8, [PX - 22, 88, 14], [PX - 8, 62, -8], 40],
  [133.6, [MID + 30, 70, 240], [MID, 40, -14], 40],
  [142, [MID + 16, 68, 226], [MID, 40, -14], 40],
  // step 8: plumb and the opening, the top nut, then the steel
  [144.5, [P2 + 22, 50, 140], [P2 - 4, 46, -4], 40],
  [148.5, [P2 + 12, 52, 150], [P2 - 10, 46, -4], 40],
  [150.5, [P2 + 14, 87, 24], [P2, 93, -1], 40],
  [154.2, [P2 + 12, 87, 22], [P2, 93, -1], 40],
  [156, [P2 + 36, 46, 76], [P2, 98, -1], 44],
  [160, [P2 + 30, 44, 70], [P2, 98, -1], 44],
  // step 9: a push at a pilaster bottom, then the tops for the bracing
  [162, [P2 + 40, 30, 92], [P2, 22, -2], 40],
  [165, [P2 + 34, 30, 86], [P2, 22, -2], 40],
  [167.5, [MID + 34, 62, 150], [MID, 82, -8], 40],
  [171, [MID + 26, 62, 142], [MID, 84, -8], 40],
  // step 10: the sleeves going up, then the screw at one sleeve
  [173.5, [MID + 34, 70, 112], [MID + 6, 90, -4], 40],
  [176.5, [MID + 26, 70, 106], [MID + 2, 90, -4], 40],
  [178.2, [P2 + 13, 86, 22], [P2, 92.5, 0], 40],
  [182.5, [P2 + 11, 86, 20], [P2, 92.5, 0], 40],
  // step 11: hinge halves on the pilaster, the door, its halves, latch and keeper from inside, the pull, the swing
  [186 + D11, [16, 66, 26], [3.6, 60, 0], 40],
  [190 + D11, [15, 64, 30], [4.6, 54, 0], 40],
  [192 + D11, [22, 60, 46], [8, 50, 0], 40],
  [196.5 + D11, [20, 60, 42], [8, 50, 0], 40],
  [198 + D11, [RUN * 0.3, 70, 120], [RUN * 0.2, 50, -2], 40],
  [199.2 + D11, [24, 90, 6], [32, 52, -12], 40],
  [200.4 + D11, [30, 47, -13], [37.5, 42, -1.2], 40],
  [202.2 + D11, [31, 47, -12], [37.5, 42, -1.2], 40],
  [203.6 + D11, [33, 46, -12], [39.5, 41, -1.3], 40],
  [204.8 + D11, [29, 61, -16], [21.5, 63, -1.2], 40],
  [206.4 + D11, [28, 61, -15], [21.5, 63, -1.2], 40],
  [207.3 + D11, [30, 90, 4], [32, 56, -6], 40],
  [208.5 + D11, [44, 50, 32], [31, 41, 0], 40],
  [210.6 + D11, [45, 51, 35], [31, 41, 0], 40],
  [211.5 + D11, [46, 62, 96], [16, 46, 6], 40],
  [215 + D11, [44, 62, 92], [16, 46, 6], 40],
  [218 + D11, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [223.5 + D11, [RUN * 0.4, 58, 160], [RUN * 0.26, 44, -2], 40],
  // step 12: the whole run, low across the clear floor, then the latch from outside, then the run again
  [S[12] + 2.5, [MID + 24, 52, 210], [MID, 50, -14], 40],
  [S[12] + 5, [RUN + 14, 12, 74], [MID - 18, 8, -16], 40],
  [S[12] + 9.5, [RUN + 6, 12, 66], [MID - 22, 8, -16], 40],
  [S[12] + 12, [62, 50, 76], [32, 40, 0], 40],
  [S[12] + 15, [58, 50, 72], [32, 40, 0], 40],
  [S[12] + 18, [MID + 30, 64, 290], [MID, 50, -14], 40],
  [END0 + 1, [MID + 12, 62, 264], [MID, 52, -14], 40],
  [DURATION, [MID - 8, 62, 244], [MID, 50, -14], 40],
]

// when each scene part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { panel: [S[4] + 2.5, 0.5], door: [S[11] + 10, 0.6], grab: [S[12] + 15, 0] }
const DOOR0_IN = S[11] + 10 // the accessible door; the others follow at S[11] + 16
const GLOW = { steel: [S[1] + 4, S[2] - 0.2], rod: [S[2] + 0.3, S[2] + 4.6], panel: [S[4] + 2.5, S[4] + 8], sleeve: [S[10] + 0.6, S[11] - 0.3], door: [S[11] + 10, S[11] + 13], grab: [S[12] + 15, S[12] + 17] }
const GLOW_NUTS = [S[8] + 12.4, S[9] - 0.3] // the nuts at the steel, checked
// pilasters: [idx] -> when it is lifted. The close-up one (2) first, then the rest from the middle outwards.
const RISE = { 2: S[5] + 10.4, 1: S[5] + 22, 3: S[5] + 22.6, 0: S[5] + 23.2, 4: S[5] + 23.8 }
const DROP = 10, GAP = 0.4, FWD = 1.8 // lifted from 10" below, a little high and forward, then back onto the rod, then down
const SLEEVE_DOWN = 8, SLEEVE_UP = [S[10] + 0.8, 0.45], SLEEVE_ORDER = [2, 1, 3, 0, 4]
const LEVEL = [0.7, -0.9, 0.8, 0.6, -0.5], LEVEL_T = { 2: S[6] + 1.6, 1: S[6] + 5.6, 3: S[6] + 6, 0: S[6] + 6.4, 4: S[6] + 6.8 }
const SEE = [[S[5] + 8.6, S[5] + 20.2], [S[6] - 0.4, S[6] + 6.2], [S[8] + 7.6, S[8] + 12.8]] // the close-up pilaster turns see-through
const XRAY = [[S[1] + 1, S[2] + 1.4], [S[8] + 12.2, S[9] - 0.2], [S[9] + 6, S[10] - 0.3]]
const BRACE = [S[9] + 6.2, S[10] - 0.4]
const SWING = [S[11] + 31.5, S[11] + 34]

// ---------- camera spline (Hermite, monotone tangents: no overshoot into walls, floor or ceiling) ----------
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
// slotted hanging bar: a flat steel bar with a slot open to the front at each rod (xs: rod positions from its centre)
function hangBar(len, xs, mat = HW.MAT.zinc) {
  const g = new THREE.Group(), d = 1.1, back = 0.3, sw = 0.6, th = 0.4
  const bx = (x0, x1, z0, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, th, z1 - z0), mat); m.position.set((x0 + x1) / 2, th / 2, (z0 + z1) / 2); m.castShadow = true; g.add(m) }
  bx(-len / 2, len / 2, -d / 2, -d / 2 + back - 0.05) // the solid back edge, behind the rods
  const cuts = [-len / 2, ...xs.flatMap((x) => [x - sw / 2, x + sw / 2]), len / 2]
  for (let i = 0; i < cuts.length; i += 2) bx(cuts[i], cuts[i + 1], -d / 2 + back - 0.05, d / 2)
  return g
}
// trim sleeve: a thin stainless shell, open top and bottom
function trimSleeve(w, h = 4, d = 1.25 + 0.625, mat = HW.MAT.chrome) {
  const g = new THREE.Group(), t = 0.08
  for (const [x, z, sx, sz] of [[0, d / 2, w, t], [0, -d / 2, w, t], [-w / 2, 0, t, d], [w / 2, 0, t, d]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mat); m.position.set(x, h / 2, z); m.castShadow = true; g.add(m)
  }
  return g
}
function hingeSet() { const g = new THREE.Group(), a = HW.hingeLeaf(1.4), b = HW.hingeLeaf(1.8), k = HW.knuckle(); a.position.x = -1.65; b.position.x = 0.25; k.rotation.x = Math.PI / 2; g.add(a, b, k); return g }
// an angle bracket mirrored so its outward leg points along world `side` once placed with normal n
function sidedAngle(a, b, h, n, side) {
  const g = new THREE.Group(), inner = HW.angle(a, b, h); g.add(inner)
  HW.orient(g, n); const xw = V(1, 0, 0).applyQuaternion(g.quaternion)
  if (xw.dot(side) < 0) inner.scale.x = -1
  return inner.parent
}

// ---------- 3D ----------
let renderer, composer, renderPass, ao, camera, scene, spec, P = {}, door0, ops, kits
const tagged = [], marks = [], wallMarks = [], supports = [], backing = [], xlines = [], cut = [], hangNuts = []
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
  camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 3000)
  scene = buildScene({ spec, finish: 'cream', renderer, view: 'angle' })
  // the scene's own sleeve, steel and rods are replaced by the more detailed hanging hardware below
  const old = []
  scene.traverse((o) => { if (['sleeve', 'steel', 'rod'].includes(o.userData.part)) old.push(o) })
  for (const o of old) o.removeFromParent()
  addHardware()
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
  addMarks(); addSupports(); addBacking(); addCutCeiling()
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
// generic hanging hardware: a steel beam above the ceiling across the pilaster line (wall to wall), a threaded rod at
// each hanging point through the beam's lower flange (a nut and washer each side, put in with the steel) and down
// through the ceiling into the pilaster top. Inside the top, a slotted hanging bar sits between a support nut below it
// and a top nut above it. A stainless trim sleeve covers the pilaster top up to the ceiling.
const rods = [] // [x, pilaster idx] of every hanging point
const ROD_Y0 = 91.2, BAR = [92.6, 93.0], NUT_H = 0.42
function addHardware() {
  const galv = new THREE.MeshStandardMaterial({ color: '#9aa1a7', metalness: 0.65, roughness: 0.45 })
  const steelM = new THREE.MeshStandardMaterial({ color: '#7d858c', metalness: 0.6, roughness: 0.5 })
  const T = spec.pil.t, zc = -T / 2, c = spec.ceiling
  const add = (m, part, idx = 0) => { m.userData = { ...m.userData, part, idx }; m.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; x.userData = { ...x.userData, part, idx } } }); scene.add(m); return m }
  const box = (mat, x0, x1, y0, y1, z0, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return m }
  const cyl = (mat, r, y0, y1, x, seg = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, seg), mat); m.position.set(x, (y0 + y1) / 2, zc); return m }
  // the beam: an I-section
  const [s0] = spec.hanger.steel, fw = 3
  const beam = [box(steelM, -6, RUN + 6, s0, s0 + 0.4, zc - fw / 2, zc + fw / 2), box(steelM, -6, RUN + 6, s0 + 0.4, s0 + 3.6, zc - 0.18, zc + 0.18), box(steelM, -6, RUN + 6, s0 + 3.6, s0 + 4, zc - fw / 2, zc + fw / 2)]
  for (const b of beam) add(b, 'steel')
  // x-ray outline of the beam, drawn over everything while the ceiling is see-through
  const lm = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true, depthTest: false })
  for (const b of beam) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), lm.clone()); l.position.copy(b.position); l.renderOrder = 9; scene.add(l); xlines.push(l) }
  spec.pilasters.forEach((p, idx) => {
    const xs = p.w > 4 ? [p.x + 2, p.x + p.w - 2] : [p.x + p.w / 2]
    for (const x of xs) {
      rods.push([x, idx])
      add(cyl(galv, 0.25, ROD_Y0, s0 + 1.6, x), 'rod', idx)
      // threads: fine rings down the exposed end
      for (let y = ROD_Y0 + 0.15; y < c; y += 0.2) add(cyl(galv, 0.27, y, y + 0.06, x, 12), 'rod', idx)
      // nuts and washers above and below the beam's lower flange
      add(cyl(galv, 0.7, s0 + 0.4, s0 + 0.5, x, 24), 'nutS', idx); add(cyl(galv, 0.48, s0 + 0.5, s0 + 0.9, x, 6), 'nutS', idx)
      add(cyl(galv, 0.7, s0 - 0.1, s0, x, 24), 'nutS', idx); add(cyl(galv, 0.48, s0 - 0.5, s0 - 0.1, x, 6), 'nutS', idx)
      // the support nut (under the bar) and the top nut (above it): run onto the rod in step 5
      for (const kind of ['top', 'support']) {
        const n = HW.nut(0.48, NUT_H); n.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true } })
        scene.add(n); hangNuts.push({ n, x, idx, kind, j: xs.indexOf(x) })
      }
    }
    // the slotted hanging bar inside the pilaster top; it rides with the pilaster
    const bar = hangBar(xs.at(-1) - xs[0] + 2.4, xs.map((x) => x - (xs[0] + xs.at(-1)) / 2), galv)
    bar.position.set((xs[0] + xs.at(-1)) / 2, BAR[0], zc)
    add(bar, 'bar', idx)
    // trim sleeve, slightly wider than the pilaster, 4" tall, open top and bottom
    const o = spec.shoeOver, sl = trimSleeve(p.w + 2 * o - (p.x === 0 || p.x + p.w === RUN ? o : 0), 4, T + 2 * o, new THREE.MeshPhysicalMaterial({ color: '#d6d9dd', metalness: 1, roughness: 0.3, envMapIntensity: 1.6 }))
    sl.position.set(Math.max(0, p.x - o) / 2 + Math.min(RUN, p.x + p.w + o) / 2, c - 4.02, -T / 2)
    add(sl, 'sleeve', idx)
  })
  // a back rail along the pilaster tops, wall to wall: the bracing some systems call for (shown as a ghost)
  add(box(new THREE.MeshStandardMaterial({ color: '#fe7802', emissive: '#a84800', roughness: 0.6 }), 0, RUN, 86.5, 88, -T - 1.4, -T - 0.05), 'brace')
}
function hingeDoor() {
  const d = spec.doors[0], hx = d.x + spec.door.gap / 2, hz = 0.14
  door0 = new THREE.Group(); door0.position.set(hx, 0, hz); scene.add(door0)
  for (const o of tagged.filter((o) => o.userData.part === 'door' && o.userData.idx === 0)) {
    scene.remove(o); door0.add(o); o.position.sub(door0.position); o.userData.p0 = o.position.clone()
  }
}
// orange chalk lines: a cross under every rod, the pilaster line, each panel line to the back wall, each pilaster's
// footprint; panel lines carried up the wall
function addMarks() {
  const m = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, polygonOffset: true, polygonOffsetFactor: -4 })
  const T = spec.pil.t, w = 0.6
  const strip = (x0, x1, z0, z1, along, order) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.rotation.x = -Math.PI / 2; s.renderOrder = 4
    s.userData = { x0, x1, z0, z1, along, order }; scene.add(s); marks.push(s)
  }
  rods.forEach(([x], i) => { strip(x - 1.1, x + 1.1, -T / 2 - 0.3, -T / 2 + 0.3, 'x', 2 + i * 0.1); strip(x - 0.3, x + 0.3, -T / 2 - 1.1, -T / 2 + 1.1, 'z', 2 + i * 0.1) })
  strip(0, spec.run, -T - w / 2, -T + w / 2, 'x', 4.4)
  strip(0, spec.run, -w / 2, w / 2, 'x', 4.4)
  spec.panels.forEach((px, i) => strip(px - w / 2, px + w / 2, -T, -spec.depth, 'z', 5.8 + i * 0.4))
  spec.pilasters.forEach((p, i) => { strip(p.x, p.x + w, -T, 0, 'z', 7 + i * 0.12); strip(p.x + p.w - w, p.x + p.w, -T, 0, 'z', 7 + i * 0.12) })
  spec.panels.forEach((px, i) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.renderOrder = 4
    s.userData = { px, order: 8 + i * 0.4 }; scene.add(s); wallMarks.push(s)
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
// the cut-away ceiling: the same ceiling with a slot along the pilaster line, so the steel shows through it; its cut
// edges traced in orange and the rest half see-through. It stands in for the whole ceiling while the x-ray is on.
function addCutCeiling() {
  const src = tagged.find((o) => o.userData.part === 'ceiling'), b = new THREE.Box3().setFromObject(src)
  const c = spec.ceiling, z0 = -spec.pil.t / 2 - 6, z1 = -spec.pil.t / 2 + 6
  const mat = src.material.clone(); mat.transparent = true; mat.depthWrite = false
  for (const [a, e] of [[b.min.z, z0], [z1, b.max.z]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.max.x - b.min.x, 2, e - a), mat)
    m.position.set((b.min.x + b.max.x) / 2, c + 1, (a + e) / 2); m.receiveShadow = true; scene.add(m); cut.push(m)
  }
  const lm = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true })
  const g = new THREE.BufferGeometry().setFromPoints([z0, z1].flatMap((z) => [c, c + 2].flatMap((y) => [new THREE.Vector3(0, y, z), new THREE.Vector3(spec.run, y, z)])))
  const l = new THREE.LineSegments(g, lm); scene.add(l); cut.push(l)
}

// every fastening, in time order
const BR_Y = [18, 64]
function buildOps() {
  const T = spec.pil.t, D = spec.depth, wallZ = -D + 0.06, pt = spec.panel.t // the tiles sit 0.05 in front of the wall line
  // --- step 3: wall brackets. Close-up on the upper pair at PX, then the rest quickly ---
  const wallBracket = (px, y, s, t, detailed) => {
    const face = px + s * pt / 2, legX = face + s * 0.95, holes = [y + 0.5, y - 0.5]
    if (detailed) {
      holes.forEach((hy, i) => HW.drillPlug(ops, V(legX, hy, wallZ), FRONT, t + i * 1.9))
      ops.add(sidedAngle(1.5, 1.5, 2, FRONT, V(s, 0, 0)), V(face, y, wallZ), FRONT, t + 4, { dist: 4, dur: 0.6 })
      holes.forEach((hy, i) => HW.driveScrew(ops, V(legX, hy, wallZ + 0.12), FRONT, t + 4.9 + i * 1.6))
    } else {
      ops.add(sidedAngle(1.5, 1.5, 2, FRONT, V(s, 0, 0)), V(face, y, wallZ), FRONT, t, { dist: 5, dur: 0.5 })
      holes.forEach((hy) => ops.add(HW.screw(1), V(legX, hy, wallZ + 0.12), FRONT, t + 0.3, { dist: 1.2, dur: 0.4, spin: 2 }))
    }
  }
  const t3 = S[3] + 5.2
  wallBracket(PX, 64, 1, t3, true)
  wallBracket(PX, 64, -1, t3 + 8.6, false)
  let k = 0
  for (const px of spec.panels) for (const y of BR_Y) for (const s of [1, -1]) {
    if (px === PX && y === 64) continue
    wallBracket(px, y, s, S[3] + 20.5 + (k++) * 0.28, false)
  }
  // --- step 4: through-bolts at the wall brackets ---
  const t4 = S[4] + 10.5
  for (const px of spec.panels) for (const y of BR_Y) {
    const pos = V(px + pt / 2 + 0.12, y, wallZ + 0.85)
    if (px === PX && y === 64) HW.driveScrew(ops, pos, V(1, 0, 0), t4, { len: 1.4, down: V(0, -1, 0) })
    else ops.add(HW.throughBolt(1.2), pos, V(1, 0, 0), t4 + 2.5 + spec.panels.indexOf(px) * 0.3 + (y === 18 ? 0.15 : 0), { dist: 1.5, dur: 0.4, spin: 2 })
  }
  // --- step 6: a wrench on the close-up pilaster's support nuts ---
  rods.filter(([, i]) => i === 2).forEach(([x], j) => ops.add(HW.wrench(5), V(x, BAR[0] - NUT_H / 2 + LEVEL[2], -T / 2), UP, S[6] + 1 + j * 1.9, { kind: 'tool', dur: 0.3, hold: 1.2, dist: 0.8, swing: 0.7, down: V(0.5, 0, 1) }))
  // --- step 7: pilaster brackets and bolts. Close-up inside the second stall at PX's pilaster end ---
  const pilZ = -T
  const pilBracket = (px, y, s, t, detailed) => {
    const face = px + s * pt / 2, legX = face + s * 0.45
    ops.add(sidedAngle(0.75, 1.5, 2, BACK, V(s, 0, 0)), V(face, y, pilZ), BACK, t, { dist: detailed ? 3 : 4, dur: 0.5 })
    for (const [i, hy] of [y + 0.5, y - 0.5].entries()) {
      if (detailed) HW.driveScrew(ops, V(legX, hy, pilZ - 0.12), BACK, t + 0.9 + i * 1.5, { len: 0.8 })
      else ops.add(HW.screw(0.8), V(legX, hy, pilZ - 0.12), BACK, t + 0.3, { dist: 1, dur: 0.4, spin: 2 })
    }
  }
  const t7 = S[7] + 5
  pilBracket(PX, 64, -1, t7, true)
  pilBracket(PX, 64, 1, t7 + 3.7, false)
  HW.driveScrew(ops, V(PX - pt / 2 - 0.12, 64, pilZ - 0.85), V(-1, 0, 0), S[7] + 9.3, { len: 1.4 })
  k = 0
  for (const px of spec.panels) for (const y of BR_Y) {
    if (!(px === PX && y === 64)) for (const s of [-1, 1]) pilBracket(px, y, s, S[7] + 13.6 + (k++) * 0.18, false)
    if (!(px === PX && y === 64)) ops.add(HW.throughBolt(1.2), V(px - pt / 2 - 0.12, y, pilZ - 0.85), V(-1, 0, 0), S[7] + 15.6 + k * 0.1, { dist: 1.5, dur: 0.4, spin: 2 })
  }
  // --- step 8: a wrench on the close-up pilaster's top nuts ---
  rods.filter(([, i]) => i === 2).forEach(([x], j) => ops.add(HW.wrench(5), V(x, BAR[1] + NUT_H / 2, -T / 2), UP, S[8] + 8.4 + j * 1.9, { kind: 'tool', dur: 0.3, hold: 1.2, dist: 0.8, swing: 0.7, down: V(0.5, 0, 1) }))
  // --- step 10: a screw through each sleeve into its pilaster ---
  const sy = spec.ceiling - 2, sz = spec.shoeOver
  SLEEVE_ORDER.forEach((idx, i) => {
    const p = spec.pilasters[idx], x = p.x + p.w / 2
    if (idx === 2) HW.driveScrew(ops, V(x, sy, sz), FRONT, S[10] + 7.2, { len: 0.7 })
    else ops.add(HW.screw(0.7), V(x, sy, sz), FRONT, S[10] + 9.6 + i * 0.25, { dist: 1, dur: 0.4, spin: 2 })
  })
  // --- step 11: hinge halves, door halves, latch, keeper, coat hook, pull ---
  const d0 = spec.doors[0], hx = d0.x + spec.door.gap / 2, { h, tops } = spec.hinge
  const dz1 = -T / 2 + spec.door.t / 2, dz0 = dz1 - spec.door.t
  const t11 = S[11] + 5.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? t11 : t11 + 4.1
    const pl = HW.hingeLeaf(1.3, h); pl.rotation.y = Math.PI
    const plg = new THREE.Group(); plg.add(pl)
    ops.add(plg, V(hx - 0.1, y, 0), FRONT, t, { dist: 3, dur: 0.5 })
    ops.add(HW.knuckle(h), V(hx, y, 0.14), UP, t, { kind: 'show', dur: 0.2 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.6 + j * 1.25, { len: 0.7 })
      else ops.add(HW.screw(0.7), V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.4 + j * 0.2, { dist: 1, dur: 0.35, spin: 2 })
    }
  })
  const td = S[11] + 12.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? td : td + 4
    ops.add(HW.hingeLeaf(1.8, h), V(hx + 0.2, y, dz1), FRONT, t, { dist: 2.5, dur: 0.5, parent: door0 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.5 + j * 1.2, { len: 0.7, parent: door0 })
      else ops.add(HW.screw(0.7), V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.3 + j * 0.2, { dist: 1, dur: 0.35, spin: 2, parent: door0 })
    }
  })
  const lx = d0.x + d0.w - 2.6, ly = spec.latch.y, tl = S[11] + 20
  ops.add(HW.slideLatch(), V(lx, ly, dz0), BACK, tl, { dist: 3, dur: 0.5, parent: door0, down: V(0, -1, 0) })
  ;[-0.9, 0.9].forEach((dx, j) => ops.add(HW.screw(0.6), V(lx + dx - 0.4, ly, dz0 - 0.36), BACK, tl + 0.8 + j * 0.5, { dist: 1, dur: 0.4, spin: 2, parent: door0 }))
  const kx = spec.pilasters[1].x + 0.55, tk = S[11] + 22.3
  ops.add(HW.keeper(), V(kx, ly, -T), BACK, tk, { dist: 3, dur: 0.5 })
  ;[0.6, -0.6].forEach((dy, j) => ops.add(HW.screw(0.6), V(kx, ly + dy, -T - 0.3), BACK, tk + 0.7 + j * 0.4, { dist: 1, dur: 0.4, spin: 2 }))
  ops.add(HW.coatHook(), V(d0.x + d0.w / 2, 64, dz0), BACK, S[11] + 24.6, { dist: 3, dur: 0.6, parent: door0 })
  const pl = spec.pull, px0 = d0.x + d0.w - pl.fromEdge + pl.w / 2, tp = S[11] + 28.3
  ops.add(HW.pull(), V(px0, pl.top - pl.h / 2, dz1), FRONT, tp, { dist: 3, dur: 0.6, parent: door0 })
  ;[pl.top - 0.6, pl.top - pl.h + 0.6].forEach((y) => ops.add(HW.screw(0.6), V(px0, y, dz1 + 0.05), FRONT, tp - 0.2, { kind: 'show', dur: 0.1, parent: door0 }))
}

// a pilaster's offset at time t: [dy, dz]. Held 10" low and a little forward, lifted a little above its nuts, pushed
// back so the rod enters its bar's slots, lowered onto the support nuts; off level until its nuts are turned in step 6.
function level(t, idx) { return LEVEL[idx] * (1 - ease((t - LEVEL_T[idx]) / 1.4)) }
function hang(t, idx) {
  const r = RISE[idx], a = ease((t - r) / 1.8), b = ease((t - r - 2) / 0.8), c = ease((t - r - 3) / 0.6)
  return [-DROP * (1 - a) + GAP * a * (1 - c) + level(t, idx), FWD * (1 - b)]
}
// when the nuts go on: the close-up pilaster's in sequence, the others just before each is lifted
function nutIn(n) {
  if (n.idx === 2) return S[5] + 5.4 + (n.kind === 'top' ? 0 : 2) + n.j * 0.9
  return RISE[n.idx] - 1.6 + (n.kind === 'top' ? 0 : 0.4) + n.j * 0.2
}
const xray = (t) => Math.max(...XRAY.map(([a, b]) => win(t, a, b, 0.8, 0.8)))
let lastPose = ''
function pose(t) {
  let moving = false
  const xr = xray(t)
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    if (part === 'hidden') { o.visible = false; continue }
    let k = 1, dx = 0, dy = 0, dz = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'door') { const s = idx === 0 ? DOOR0_IN : S[11] + 16 + (idx - 1) * 0.5; k = clamp((t - s) / 0.75); dy = (1 - easeOut(k)) * 10 }
    if (part === 'pilaster' || part === 'bar' || part === 'sleeve') {
      ;[dy, dz] = hang(t, idx)
      k = clamp((t - RISE[idx] + 1.4) / 0.6)
      if (part === 'sleeve') { const si = SLEEVE_ORDER.indexOf(idx); dy -= SLEEVE_DOWN * (1 - ease((t - SLEEVE_UP[0] - si * SLEEVE_UP[1]) / 1.2)) }
    }
    if (part === 'brace') { const b = win(t, BRACE[0], BRACE[1], 1, 1); m.opacity = 0.75 * b; m.depthWrite = false; o.visible = b > 0.01; continue }
    if (part === 'ceiling' || part === 'downlight') {
      const c = 1 - xr
      if (part === 'ceiling') { m.opacity = c; m.depthWrite = c > 0.99; o.visible = true } else o.visible = true
      continue
    }
    m.opacity = clamp(k * 1.4)
    // the close-up pilaster turns see-through to show the hanging hardware inside its top
    if (part === 'pilaster' && idx === 2) { const s = Math.max(...SEE.map(([a, b]) => win(t, a, b, 0.7, 0.7))); m.opacity *= 1 - 0.75 * s; m.depthWrite = s < 0.01 }
    o.visible = m.opacity > 0.01
    o.position.set(o.userData.p0.x + dx, o.userData.p0.y + dy, o.userData.p0.z + dz)
    if ((dx || dy || dz) && o.visible) moving = true
    const g = GLOW[part]
    let gi = g ? win(t, g[0], g[1], 0.5, 0.6) * 0.85 : 0
    if (part === 'pilaster') gi = Math.max(gi, win(t, RISE[idx], RISE[idx] + 4.2, 0.5, 0.6) * 0.85)
    if (part === 'bar' && idx === 2) gi = Math.max(gi, win(t, S[5] + 14, S[5] + 17, 0.4, 0.6) * 0.85)
    if (part === 'nutS' || (part === 'rod' && t > S[8])) gi = Math.max(gi, win(t, GLOW_NUTS[0], GLOW_NUTS[1], 0.5, 0.6) * 0.85)
    // in step 1 the steel, rods and the nuts at the steel glow while the ceiling is see-through
    if (part === 'steel' || part === 'nutS' || (part === 'rod' && t < S[3])) gi = Math.max(gi, (t < S[3] ? xr : 0) * 0.85)
    if (m.emissive) {
      if (!o.userData.e0) { o.userData.e0 = m.emissive.clone(); o.userData.c0 = m.color.clone() }
      m.emissive.copy(o.userData.e0).lerp(ORANGE_E, Math.min(1, gi * 1.2)); m.color.copy(o.userData.c0).lerp(ORANGE, Math.min(1, gi * 1.3)); m.emissiveIntensity = 1
    }
  }
  // nuts on the rods: spun up from the rod end to their place; the support nut sets the pilaster's height
  for (const hn of hangNuts) {
    const t0 = nutIn(hn), dur = hn.idx === 2 ? 1.1 : 0.5, u = easeOut((t - t0) / dur)
    // the top nut waits a little high until the bar is in, then runs down onto it
    const y1 = (hn.kind === 'top' ? BAR[1] + 0.8 * (1 - ease((t - RISE[hn.idx] - 3.7) / 0.8)) : BAR[0] - NUT_H) + level(t, hn.idx)
    hn.n.visible = t >= t0
    hn.n.position.set(hn.x, ROD_Y0 + (y1 - ROD_Y0) * u, -spec.pil.t / 2); hn.n.rotation.y = (1 - u) * Math.PI * 8
    if (hn.n.visible && u < 1) moving = true
    const gi = hn.idx === 2 ? Math.max(win(t, t0, t0 + 3.2, 0.3, 0.6), win(t, S[6] + 1, S[6] + 5, 0.4, 0.6) * (hn.kind === 'support' ? 1 : 0), win(t, S[8] + 8.4, S[8] + 12, 0.4, 0.6) * (hn.kind === 'top' ? 1 : 0), win(t, S[5] + 16.6, S[5] + 20, 0.4, 0.6)) * 0.85 : 0
    hn.n.traverse((m) => { if (m.isMesh && m.material.emissive) { m.userData.c0 ??= m.material.color.clone(); m.material.color.copy(m.userData.c0).lerp(ORANGE, gi); m.material.emissive.set(ORANGE_E).multiplyScalar(gi) } })
  }
  for (const l of xlines) { l.material.opacity = xr; l.visible = xr > 0.01 }
  for (const o of cut) { o.visible = xr > 0.01; o.material.opacity = o.isLineSegments ? xr : 1 - 0.5 * xr }
  // the accessible door swings out, then closes on its own
  const a = ease((t - SWING[0]) / 1.8) * (1 - ease((t - SWING[1]) / 2.0))
  if (door0.rotation.y !== -a * 0.95) moving = true
  door0.rotation.y = -a * 0.95
  // chalk lines draw on during step 2 and fade once the doors go on
  const mo = 1 - clamp((t - S[11]) / 1.5)
  for (const s of marks) {
    const { x0, x1, z0, z1, along, order } = s.userData
    const r = ease((t - S[2] - 0.6 - order) / 1.6)
    const X1 = along === 'x' ? x0 + (x1 - x0) * r : x1, Z1 = along === 'z' ? z0 + (z1 - z0) * r : z1
    s.visible = r > 0.001 && mo > 0.01; s.material.opacity = mo
    s.scale.set(Math.max(0.01, Math.abs(X1 - x0)), Math.max(0.01, Math.abs(Z1 - z0)), 1)
    s.position.set((x0 + X1) / 2, 0.06, (z0 + Z1) / 2)
  }
  const wm = 1 - clamp((t - S[4] - 8) / 1.5)
  for (const s of wallMarks) {
    const { px, order } = s.userData, r = ease((t - S[2] - 0.6 - order) / 1.4), hgt = 74 * r
    s.visible = r > 0.001 && wm > 0.01; s.material.opacity = wm
    s.scale.set(0.5, Math.max(0.01, hgt), 1); s.position.set(px, hgt / 2, -spec.depth + 0.06)
  }
  // blocks go in just before the panels and come out once everything is tightened
  supports.forEach((b, i) => {
    const v = clamp((t - IN.panel[0] + 1 - Math.floor(i / 2) * 0.5) / 0.5) * (1 - clamp((t - S[8] + 0.2 - 17) / 0.8))
    b.traverse((m) => { if (m.isMesh) m.material.opacity = v }); b.visible = v > 0.01
  })
  const bk = win(t, S[1] + 0.8, S[1] + 5, 0.8, 0.8) + win(t, S[3] + 4.8, S[3] + 20, 0.6, 1) * (0.8 + 0.2 * Math.sin(t * 3))
  for (const o of backing) { o.material.opacity = (o.isLineSegments ? 1 : 0.3) * bk; o.visible = bk > 0.01 }
  if (ops.update(t)) moving = true
  const key = tagged.map((o) => (o.visible ? o.position.y.toFixed(2) + o.position.z.toFixed(2) : 'h')).join() + supports.map((b) => b.visible).join() + (xr > 0.01) + hangNuts.map((h) => h.n.visible && h.n.position.y.toFixed(2)).join()
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
const ROD = (j = 0) => rods.filter(([, i]) => i === 2)[j][0] // the rods of the third pilaster
const LABELS = [
  [S[1] + 1.2, S[1] + 5, () => [spec.panels[1], 50, -spec.depth], 'Solid backing in the wall', 80, -140],
  [S[1] + 5, S[2] - 0.2, () => [MID - 30, spec.hanger.steel[0], -0.6], 'Structural steel above the ceiling', -60, 120],
  [S[1] + 7.8, S[2] - 0.2, () => [MID + 14, spec.ceiling, 44], 'The ceiling carries nothing', 60, 450],
  [S[2] + 2.2, S[2] + 6, () => [ROD(), 94, -0.6], 'Hanging rod through the ceiling', 70, 110],
  [S[2] + 7, S[3] - 0.2, () => [ROD(), 0.1, -0.6], 'Plumb down from each rod', 70, -120],
  [S[3] + 6.4, S[3] + 9.2, () => [PX + 0.5 + 0.95, 64.5, -spec.depth], 'Wall plug in the backing', 90, -150],
  [S[3] + 10, S[3] + 13.2, () => [PX + 0.5 + 1.2, 65, -spec.depth + 0.2], 'Angle bracket', 120, -140],
  [S[3] + 14, S[3] + 17.4, () => [PX - 0.5, 64, -spec.depth + 1], 'The panel slots in between', -120, -150],
  [S[4] + 4, S[4] + 8.5, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Block holds the height', 90, -120],
  [S[4] + 11.2, S[5] - 0.3, () => [PX + 0.6, 64, -spec.depth + 0.85], 'Through-bolt, finger tight', 90, -140],
  [S[5] + 5.8, S[5] + 9.6, () => [ROD(1), BAR[1] + 0.7, -0.4], 'Top nut', 90, -110],
  [S[5] + 7.8, S[5] + 9.6, () => [ROD(1), BAR[0] - 0.3, -0.4], 'Support nut', 90, 120],
  [S[5] + 10.6, S[5] + 13.6, () => [P2 + 6.2, spec.ceiling - 4 - SLEEVE_DOWN - DROP + 2, 0.3], 'Trim sleeve, held down for now', 70, -90],
  [S[5] + 14.2, S[5] + 20, () => [ROD(1) + 1.6, BAR[0] + 0.2, -0.2], 'Slotted hanging bar', 110, 130],
  [S[5] + 16.8, S[5] + 20, () => [ROD(0), BAR[0] - 0.2, -0.3], 'Resting on the support nut', -90, 150],
  [S[5] + 17.6, S[5] + 20, () => [ROD(0), BAR[1] + 0.3, -0.3], 'Top nut, loose for now', -90, -130],
  [S[6] + 1.4, S[6] + 5.6, () => [ROD(0), BAR[0] - 0.2, -0.3], 'Turn the support nut to raise or lower', -90, 150],
  [S[6] + 8, S[7] - 0.3, () => [P2, spec.pil.y0, 0.3], 'Bottoms in line, clear of the floor', 50, -130],
  [S[7] + 5.7, S[7] + 8.9, () => [PX - 1, 64.5, -spec.pil.t], 'Bracket screwed to the pilaster', -80, -150],
  [S[7] + 9.7, S[7] + 12.3, () => [PX - 0.6, 64, -spec.pil.t - 0.85], 'Bolted through the panel', -60, -140],
  [S[8] + 0.8, S[8] + 3.8, () => [pil(2).x + pil(2).w, 40, 0], 'Plumb both ways', 80, -100],
  [S[8] + 4.2, S[8] + 7.4, () => [(pil(1).x + pil(1).w + pil(2).x) / 2, 60, 0], 'Door opening to the drawings', 40, -100],
  [S[8] + 8.8, S[8] + 12.4, () => [ROD(0), BAR[1] + 0.3, -0.3], 'Top nut tightened onto the bar', -90, -130],
  [S[8] + 13.4, S[9] - 0.3, () => [ROD(0), spec.hanger.steel[0] - 0.3, -0.6], 'Nuts at the steel, checked tight', 70, 120],
  [S[9] + 1.5, S[9] + 5.6, () => [P2, 16, 0.6], 'Firm at the bottom, no sway', 70, -120],
  [S[9] + 7, S[10] - 0.5, () => [MID + 18, 87.2, -2.6], 'Bracing, where the system calls for it', 40, 230],
  [S[10] + 3, S[10] + 6.8, () => [P2 + 6.3, spec.ceiling - 1.5, 0.3], 'Sleeve meets the ceiling', 70, 110],
  [S[10] + 7.8, S[11] - 0.4, () => [P2, spec.ceiling - 2, 0.35], 'Screwed to the pilaster', 90, 120],
  [S[11] + 6.2, S[11] + 9.8, () => [spec.doors[0].x - 0.7, spec.hinge.tops[0] - 2, 0.2], 'Hinge half on the pilaster', 80, -100],
  [S[11] + 13.2, S[11] + 16.4, () => [spec.doors[0].x + 1.3, spec.hinge.tops[0] - 2, 0.2], 'Other half on the door', 90, -110],
  [S[11] + 20.6, S[11] + 22.2, () => [spec.doors[0].x + spec.doors[0].w - 2.6, spec.latch.y, -1.4], 'Latch', -60, -120],
  [S[11] + 22.8, S[11] + 23.8, () => [spec.pilasters[1].x + 0.55, spec.latch.y, -spec.pil.t - 0.5], 'Keeper', 70, -120],
  [S[11] + 25.2, S[11] + 27, () => [spec.doors[0].x + spec.doors[0].w / 2, 65, -1.6], 'Coat hook', 70, -100],
  [S[11] + 28.9, S[11] + 31, () => [spec.doors[0].x + spec.doors[0].w - spec.pull.fromEdge + spec.pull.w / 2, spec.pull.top - 1, 1.3], 'Pull', 70, -100],
  [S[11] + 31.2, S[11] + 35, () => [spec.doors[0].x, spec.hinge.tops[0] - 2, 0.4], 'Hinges set the resting position', 70, -80],
  [S[11] + 36.6, S[12] - 0.3, () => [pil(2).x - 0.15, 46, 0.3], 'Even gaps', 70, -110],
  [S[12] + 5.5, S[12] + 10, () => [MID - 30, 0.1, -10], 'Clear floor, easy to clean', 60, -110],
  [S[12] + 12.4, S[12] + 16, () => [spec.doors[0].x + spec.doors[0].w - spec.latch.fromEdge, spec.latch.y, 0.6], 'Opens from outside in an emergency', 60, -110],
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
function guides(t) {
  let s = ''
  let r = win(t, S[2] + 4.4, S[3] - 0.2, 0.5, 0.4)
  if (r > 0) rods.forEach(([x], i) => { s += dashed([x, ROD_Y0, -0.6], [x, 0.1, -0.6], r, ease((t - S[2] - 4.4 - i * 0.12) / 1.4)) })
  const y0 = spec.pil.y0 - 0.3, pn = pil(spec.pilasters.length - 1)
  r = win(t, S[6] + 6.4, S[7] - 0.3, 0.6, 0.4)
  if (r > 0) s += dashed([pil(0).x, y0, 0.2], [pn.x + pn.w, y0, 0.2], r, ease((t - S[6] - 6.4) / 1.4))
  r = win(t, S[8] + 0.4, S[8] + 4, 0.5, 0.4)
  if (r > 0) s += dashed([pil(2).x + pil(2).w + 0.2, spec.pil.y1, 0.2], [pil(2).x + pil(2).w + 0.2, spec.pil.y0, 0.2], r, ease((t - S[8] - 0.4) / 1.2))
  r = win(t, S[8] + 4, S[8] + 7.6, 0.5, 0.3)
  if (r > 0) {
    const a = project([pil(1).x + pil(1).w, 60, 0.3]), b = project([pil(2).x, 60, 0.3])
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
      `<line x1="${a[0]}" y1="${a[1] - 22}" x2="${a[0]}" y2="${a[1] + 22}"/><line x1="${b[0]}" y1="${b[1] - 22}" x2="${b[0]}" y2="${b[1] + 22}"/></g>`
  }
  r = win(t, S[9] + 0.6, S[9] + 5.6, 0.5, 0.4)
  if (r > 0) {
    const [x, y] = project([P2, 16, 0.6]), p = Math.abs(Math.sin((t - S[9] - 0.6) * Math.PI / 1.4)) * 18
    const x0 = x + 150 - p, x1 = x + 34 - p
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="10" stroke-linecap="round" fill="#fe7802"><line x1="${x0}" y1="${y}" x2="${x1 + 16}" y2="${y}"/>` +
      `<path d="M${x1} ${y} l28 -20 v40 z" stroke-width="4"/></g>`
  }
  r = win(t, S[12] + 5, S[12] + 10, 0.6, 0.4)
  if (r > 0) s += dashed([pil(0).x, y0, 0.2], [pn.x + pn.w, y0, 0.2], r, ease((t - S[12] - 5) / 1.4))
  return s
}

window.frameAt = function (t) {
  const kc = kits.update(t)
  if (kc) {
    renderPass.scene = kits.scene; renderPass.camera = kits.camera; ao.enabled = false
    composer.render()
    renderPass.scene = scene; renderPass.camera = camera; ao.enabled = true
  } else { aim(t); pose(t); composer.render() }
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
