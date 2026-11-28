// Installation video, floor to ceiling, detailed version (about 4:08; plan in
// research/install-guides/video-floor-to-ceiling-plan.md). Built on the overhead braced detailed video (install-obd.js):
// a kit card opens every step that adds hardware, one fastening of each kind goes in on screen in close-up, then the
// rest of the same parts go on quickly in a wide shot. This style's own parts: the structure above the ceiling (an
// x-ray outline), the floor crosses carried up to the ceiling, a floor bracket and a ceiling bracket at every pilaster
// fixing, the leveling bolt and nut that raise each pilaster until its top sits in its ceiling bracket, screws through
// the ceiling bracket into the pilaster, and shoes at both ends. Hardware and tools are generic (hardware.js), not any
// one manufacturer's. The camera stays below the ceiling and never passes through a part: the one view inside a stall
// goes in through a doorway before the doors are hung, or over a door (doors stop well below the ceiling).
// render.mjs calls window.frameAt(t) for every frame and screenshots the page. Units are inches.
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
const STYLE = 'floor-to-ceiling'
const RUN = 168.5, MID = RUN / 2
const UP = V(0, 1, 0), DOWN = V(0, -1, 0), FRONT = V(0, 0, 1), BACK = V(0, 0, -1)

// ---------- timeline ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [6, 'Check the room against the drawings', [[0.3, 'First, check the room against the approved drawings.'], [2.8, 'Measure floor to ceiling at every pilaster.'], [5.2, 'Every ceiling fixing needs solid structure above the ceiling,'], [7.6, 'and every wall bracket solid backing in the wall.']]],
  [16, 'Lay out the floor and the ceiling', [[0.3, 'Mark the pilaster line and each panel line on the floor.'], [4, 'Mark a cross at every pilaster fixing.'], [6.6, 'Carry each cross straight up to the ceiling,'], [9.4, 'with a plumb line or a laser.']]],
  [29, 'Fix the wall brackets', [[0.3, 'Wall bracket kit: angle brackets, screws, wall plugs and through-bolts.'], [5.2, 'Drill into the backing and push in a wall plug.'], [9.5, 'Screw the bracket to the wall,'], [13.5, 'with a second bracket on the other side of the panel line.'], [17.5, 'Repeat at each bracket height on every panel line.']]],
  [59, 'Fix the floor and ceiling brackets', [[0.3, 'Floor and ceiling kit: brackets, leveling bolts, nuts and anchors.'], [5, 'Drill the floor at the pilaster cross'], [8.5, 'and anchor the floor bracket.'], [13, 'Thread the leveling bolt and nut into it.'], [15.5, 'Repeat at every pilaster.'], [18.4, 'Then the ceiling bracket, straight above:'], [21, 'drill up into the structure'], [23.4, 'and bolt it on.'], [28, 'One above every floor bracket.']]],
  [93, 'Set the panels on supports', [[0.3, 'Rest each panel on blocks at the height on the drawings.'], [5, 'It drops in between its wall brackets.'], [9, 'Bolt it through the brackets, finger tight for now.']]],
  [108, 'Stand and connect the pilasters', [[0.3, 'Pilaster kit: shoes, angle brackets, screws and through-bolts.'], [5, 'Slide a shoe onto each end and hold them clear.'], [9.5, 'Stand each pilaster on its leveling bolt, under its ceiling bracket.'], [14, 'Turn the nut to raise the pilaster'], [18.5, 'until its top sits in the ceiling bracket.'], [24.5, 'Screw the brackets to the pilaster'], [29, 'and bolt them through the panel.'], [34, 'Leave everything finger tight.']]],
  [148, 'Plumb, then fix top and bottom', [[0.3, 'Get each pilaster plumb both ways.'], [5, 'Set the door openings to the drawings.'], [9.5, 'Lock the nut at the floor,'], [13.5, 'screw the pilaster to its ceiling bracket,'], [17.5, 'then tighten every bracket.']]],
  [168, 'Seat both shoes', [[0.3, 'Lower the bottom shoes to the floor'], [2.6, 'and raise the top shoes to the ceiling.'], [5, 'Secure them, then take out the supports.']]],
  [180, 'Hang the doors and fit the hardware', [[0.3, 'Door hardware: hinges, latch, keeper, pull, coat hook and screws.'], [5.5, 'Screw the hinge halves to the pilaster,'], [10.5, 'hang the door,'], [12.5, 'and screw the other halves to the door.'], [19.5, 'Fit the latch on the door and the keeper on the pilaster,'], [24.5, 'then the coat hook,'], [27, 'and the pull on the outside.'], [31, 'The accessible stall\'s door closes on its own.'], [36, 'Adjust each door until the gaps are even.']]],
  [224, 'Check the finished run', [[0.3, 'Push each pilaster: it stays put at the floor and the ceiling.'], [7, 'Test every latch, including from outside.']]],
]
const END0 = 238, DURATION = 248
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t]))
export const CAPTIONS = [
  [0.4, 'Here is how floor to ceiling partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]
// kit cards: [start, end, title, items]
const KITS = [
  [S[3] + 0.4, S[3] + 4.8, 'Wall bracket kit', [['Angle bracket', () => HW.angle()], ['Screws', () => HW.screw(1.1)], ['Wall plugs', () => HW.plug()], ['Through-bolt', () => HW.throughBolt()]]],
  [S[4] + 0.4, S[4] + 4.6, 'Floor and ceiling kit', [['Floor bracket', () => fixBracket(false)], ['Leveling bolt and nut', () => levelSet()], ['Ceiling bracket', () => fixBracket(true)], ['Anchors', () => HW.screw(1.6, 0.12)]]],
  [S[6] + 0.4, S[6] + 4.6, 'Pilaster kit', [['Top shoe', () => shoeModel(3)], ['Bottom shoe', () => shoeModel(4)], ['Angle bracket', () => HW.angle(0.8)], ['Screws', () => HW.screw(1.1)], ['Through-bolt', () => HW.throughBolt()]]],
  [S[9] + 0.4, S[9] + 5.2, 'Door hardware', [['Hinge', () => hingeSet()], ['Latch', () => HW.slideLatch()], ['Keeper', () => HW.keeper()], ['Pull', () => HW.pull()], ['Coat hook', () => HW.coatHook()], ['Screws', () => HW.screw(0.8)]]],
]

// ---------- the pilaster's height at each moment ----------
const BR = 1.3 // height of a bracket box from its fixing surface to its stop
const CHEEK = 1.1 // the ceiling bracket's side plates reach this far below its stop: the pilaster's top sits between them
const LOW = 1.9, HIGH = 3.1 // the pilaster's foot on the leveling bolt before and after the nut is turned
const SLIDE_Z = 30 // pilasters are carried in from the front, standing on the floor
const SHOE_OFF = 7 // the shoes ride on the pilaster, held clear of each end, until step 8
const STEEL_Y = [99.5, 103.5] // the structure above the ceiling (x-ray)

// ---------- camera ----------
const P2 = 90.5 // centre of the third pilaster, the one most close-ups use
const PX = 95.75 // the panel line the wall-bracket close-ups use
const FXA = 84.5 + 1.4 // the third pilaster's first fixing point (its left one)
const C = 96
const CAM = [
  [0, [MID + 40, 74, 300], [MID, 40, -22], 40],
  [6, [MID + 10, 60, 262], [MID, 48, -24], 40],
  [10.5, [MID + 14, 44, 160], [MID, 58, -20], 44],
  [15.5, [MID + 4, 44, 152], [MID, 56, -20], 44],
  [21, [MID - 4, 44, 150], [MID, 48, -20], 44],
  [28.5, [MID - 8, 46, 146], [MID, 48, -20], 44],
  // step 3: one bracket pair in close-up, then the wall from the front (nothing stands in front of the wall yet)
  [34, [PX + 9, 67.5, -61.25 + 10], [PX + 0.8, 64, -61], 40],
  [45.5, [PX + 7, 67, -61.25 + 9], [PX + 0.4, 64, -61], 40],
  [50.5, [MID + 30, 84, 100], [MID - 6, 34, -54], 44],
  [58.5, [MID + 18, 82, 92], [MID - 12, 34, -54], 44],
  // step 4: a floor bracket in close-up, the rest low along the front; then its ceiling bracket, the rest along the ceiling
  [64, [FXA + 10, 11, 17], [FXA + 0.6, 1, -0.6], 40],
  [72.5, [FXA + 8, 10, 15], [FXA + 0.6, 1.2, -0.6], 40],
  [74.6, [RUN + 10, 24, 64], [MID - 18, 1, -1], 40],
  [76.4, [RUN + 6, 24, 60], [MID - 20, 1, -1], 40],
  [78.4, [FXA + 12, 80, 22], [FXA, 91.5, -0.6], 40],
  [81.4, [FXA + 11, 81, 20], [FXA + 0.3, 92.5, -0.6], 40],
  [84.6, [FXA + 10, 83, 17], [FXA + 0.6, 95, -0.6], 40],
  [87, [RUN + 10, 70, 66], [MID - 18, 95, -1], 40],
  [92.5, [RUN + 4, 70, 60], [MID - 22, 94, -1], 40],
  // step 5: panels drop in; then the through-bolt at a wall bracket (no pilasters yet, so the front is open)
  [96, [RUN + 20, 86, 150], [MID - 6, 26, -36], 40],
  [100.5, [RUN + 8, 84, 140], [MID - 6, 26, -36], 40],
  [102.5, [PX + 13, 70, -61.25 + 17], [PX + 0.6, 64, -59.5], 40],
  [107.5, [PX + 10, 69, -61.25 + 14], [PX + 0.6, 64, -59.5], 40],
  // step 6: a pilaster held in front with its shoes; it slides in; the nut is turned at the floor; the top closes in
  // the ceiling bracket; the run; then into the stall through the open doorway for the pilaster bracket
  [113, [P2 + 50, 50, 210], [P2, 48, 22], 40],
  [116.5, [P2 + 44, 50, 204], [P2, 48, 18], 40],
  [120.5, [MID + 30, 52, 230], [MID, 48, -6], 40],
  [122, [FXA + 11, 11, 20], [FXA + 0.6, 2.4, -0.6], 40],
  [125.4, [FXA + 9, 10, 18], [FXA + 0.6, 2.4, -0.6], 40],
  [126.6, [FXA + 13, 80, 24], [FXA + 0.6, 93.5, -0.6], 40],
  [129.4, [FXA + 11, 81, 21], [FXA + 0.6, 93.5, -0.6], 40],
  [130.6, [MID + 30, 54, 240], [MID, 48, -10], 40],
  [131.6, [MID + 24, 54, 230], [MID, 48, -10], 40],
  [132.3, [PX - 14, 58, 18], [PX - 2, 62, -8], 40],
  [133.5, [PX - 15, 68, -16], [PX - 0.8, 63.5, -1.5], 40],
  [140.6, [PX - 12, 68, -13], [PX - 0.8, 63.5, -1.5], 40],
  [141.8, [PX - 14, 58, 18], [PX - 2, 62, -8], 40],
  [143.2, [MID + 30, 56, 240], [MID, 46, -14], 40],
  [147.5, [MID + 16, 56, 226], [MID, 46, -14], 40],
  // step 7: plumb, an opening, the nut locked at the floor, the screw at the ceiling bracket
  [150.5, [P2 + 40, 50, 175], [P2, 48, -4], 40],
  [152.5, [P2 + 30, 50, 170], [P2 - 4, 48, -4], 40],
  [155, [P2 + 12, 50, 150], [P2 - 10, 44, -4], 40],
  [157, [P2 + 8, 50, 146], [P2 - 10, 44, -4], 40],
  [158.4, [FXA + 11, 11, 20], [FXA + 0.6, 2.4, -0.6], 40],
  [160.8, [FXA + 9, 10, 18], [FXA + 0.6, 2.4, -0.6], 40],
  [162, [FXA + 12, 82, 18], [FXA + 0.4, 94, -0.4], 40],
  [165.4, [FXA + 10, 83, 16], [FXA + 0.4, 94, -0.4], 40],
  [167.5, [RUN * 0.7, 48, 210], [RUN * 0.55, 48, -4], 40],
  // step 8: the shoes, full height; then a bottom shoe being secured
  [172, [RUN * 0.64, 48, 200], [RUN * 0.52, 48, -4], 40],
  [173.4, [P2 + 12, 10, 24], [P2 - 2, 2, 0], 40],
  [176.2, [P2 + 10, 10, 22], [P2 - 2, 2, 0], 40],
  [178, [RUN * 0.5, 54, 170], [RUN * 0.4, 48, -4], 40],
  // step 9: hinge halves on the pilaster, the door, its halves, latch and keeper from inside (in over the door), the pull, the swing
  [186, [16, 66, 26], [3.6, 60, 0], 40],
  [190, [15, 64, 30], [4.6, 54, 0], 40],
  [192, [22, 60, 46], [8, 50, 0], 40],
  [196.5, [20, 60, 42], [8, 50, 0], 40],
  [198, [RUN * 0.3, 70, 120], [RUN * 0.2, 50, -2], 40],
  [199.2, [26, 88, 8], [32, 52, -12], 40],
  [200.4, [30, 47, -13], [37.5, 42, -1.2], 40],
  [202.2, [31, 47, -12], [37.5, 42, -1.2], 40],
  [203.6, [33, 46, -12], [39.5, 41, -1.3], 40],
  [204.8, [29, 61, -16], [21.5, 63, -1.2], 40],
  [206.4, [28, 61, -15], [21.5, 63, -1.2], 40],
  [207.3, [30, 88, 6], [32, 56, -6], 40],
  [208.5, [44, 50, 32], [31, 41, 0], 40],
  [210.6, [45, 51, 35], [31, 41, 0], 40],
  [211.5, [46, 62, 96], [16, 46, 6], 40],
  [215, [44, 62, 92], [16, 46, 6], 40],
  [218, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [223.5, [RUN * 0.4, 58, 160], [RUN * 0.26, 44, -2], 40],
  // step 10: the push test on a pilaster, the latch from outside, then the whole run
  [226.5, [P2 + 50, 50, 160], [P2, 48, -4], 40],
  [230.5, [P2 + 40, 50, 150], [P2, 48, -4], 40],
  [232, [62, 50, 76], [32, 40, 0], 40],
  [235, [58, 50, 72], [32, 40, 0], 40],
  [239, [MID + 12, 56, 264], [MID, 50, -14], 40],
  [248, [MID - 8, 56, 244], [MID, 48, -14], 40],
]

// when each scene part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { panel: [S[5] + 2.5, 0.5], door: [S[9] + 10, 0.6], grab: [S[10] + 9, 0] }
const DOOR0_IN = S[9] + 10 // the accessible door; the others follow at S[9] + 16
const GLOW = { panel: [S[5] + 2.5, S[5] + 8], pilaster: [S[6] + 9.5, S[6] + 13.5], shoe: [S[6] + 5, S[6] + 9.2], cshoe: [S[6] + 5, S[6] + 9.2], bolt: [S[4] + 13, S[4] + 16], door: [S[9] + 10, S[9] + 13], grab: [S[10] + 9, S[10] + 12] }
const GLOW2 = { shoe: [S[8] + 1, S[9] - 0.3], cshoe: [S[8] + 1, S[9] - 0.3], bolt: [S[6] + 14, S[6] + 21] }
const SLIDE = [S[6] + 9.5, 0.4]
const SHOE_SEAT = [S[8] + 1.2, 0.35]
const SWING = [S[9] + 31.5, S[9] + 34]
// the third pilaster is raised in two goes, watched first at the floor and then at the ceiling; the rest go up together
const JACK_A = [S[6] + 14.2, 2.8], JACK_B = [S[6] + 18.8, 2.2], JACK_ALL = [S[6] + 22.4, 0.25]
function jack(t, i) {
  if (i === 2) return 0.45 * ease((t - JACK_A[0]) / JACK_A[1]) + 0.55 * ease((t - JACK_B[0]) / JACK_B[1])
  return ease((t - JACK_ALL[0] - (i > 2 ? i - 1 : i) * JACK_ALL[1]) / 1.6)
}
const slideZ = (t, i) => (1 - ease((t - SLIDE[0] - i * SLIDE[1]) / 1.6)) * SLIDE_Z
const foot = (t, i) => LOW * (1 - slideZ(t, i) / SLIDE_Z) + (HIGH - LOW) * jack(t, i) // carried in standing on the floor
const LEN = C - BR - HIGH // the pilaster's length: from the raised foot to the ceiling bracket's stop

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
const T_PIL = 1.25
const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; return m }
// floor or ceiling bracket: a base plate on the fixing surface (+y out of it) with two anchor holes, side plates and a
// stop plate across the top. The ceiling one's side plates reach below the stop, so the pilaster's top sits between them.
function fixBracket(ceiling, T = T_PIL) {
  const g = new THREE.Group(), M = HW.MAT.zinc, side = ceiling ? BR + CHEEK : BR
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m }
  add(mesh(new THREE.BoxGeometry(3.4, 0.15, T + 0.8), M), 0, 0.075, 0)
  for (const s of [-1, 1]) add(mesh(new THREE.BoxGeometry(2.2, side - 0.15, 0.15), M), 0, (side + 0.15) / 2, s * (T / 2 + 0.075))
  add(mesh(new THREE.BoxGeometry(2.2, 0.15, T + 0.3), M), 0, BR + 0.075, 0)
  for (const s of [-1, 1]) add(mesh(new THREE.CircleGeometry(0.17, 16), HW.MAT.hole), s * 1.35, 0.152, 0).rotation.x = -Math.PI / 2
  return g
}
function levelSet() { const g = new THREE.Group(), b = mesh(new THREE.CylinderGeometry(0.26, 0.26, 3, 16), HW.MAT.zinc), n = HW.nut(0.5, 0.32); b.position.y = 1.5; n.position.y = 1.4; g.add(b, n); return g }
function shoeModel(h) {
  const g = new THREE.Group(), w = 12.4, d = 1.75, t = 0.1, M = HW.MAT.chrome
  for (const s of [-1, 1]) { const a = mesh(new THREE.BoxGeometry(w, h, t), M); a.position.z = s * d / 2; g.add(a); const b = mesh(new THREE.BoxGeometry(t, h, d), M); b.position.x = s * w / 2; g.add(b) }
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
// an open-end wrench that comes in from the front, its jaws round a nut on a vertical bolt: placed with normal FRONT,
// its jaw axis stays vertical and its handle points at the camera. `turn` rocks it about the bolt.
function frontWrench() { const g = new THREE.Group(), w = HW.wrench(6); w.rotation.x = -Math.PI / 2; w.scale.y = 0.6; g.add(w); g.userData.inner = w; return g }

// ---------- 3D ----------
let renderer, composer, renderPass, ao, camera, scene, spec, P = {}, door0, ops, kits
const tagged = [], marks = [], supports = [], backing = [], xray = [], wrenches = []
const fix = [] // [x, pilaster idx] of every fixing point
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
  spec.pilasters.forEach((p, pi) => { for (const x of p.w > 4 ? [p.x + 1.4, p.x + p.w - 1.4] : [p.x + p.w / 2]) fix.push([x, pi]) })
  addLevelers()
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
  scene.updateMatrixWorld(true)
  hingeDoor()
  addMarks(); addSupports(); addBacking(); addSteel()
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
// the leveling bolt and its nut at every floor bracket: posed every frame (the bolt reaches up to the pilaster's foot,
// the nut turns while the pilaster is raised). They appear with their floor bracket (times set in buildOps).
const levelers = []
function addLevelers() {
  const zc = -T_PIL / 2
  fix.forEach(([x, pi]) => {
    const bolt = mesh(new THREE.CylinderGeometry(0.26, 0.26, 1, 16), HW.MAT.zinc.clone())
    const nut = HW.nut(0.5, 0.32); nut.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.castShadow = true } })
    bolt.position.set(x, 0, zc); nut.position.set(x, BR + 0.15, zc)
    scene.add(bolt, nut); levelers.push({ bolt, nut, pi, t: Infinity })
  })
}
function hingeDoor() {
  const d = spec.doors[0], hx = d.x + spec.door.gap / 2, hz = 0.14
  door0 = new THREE.Group(); door0.position.set(hx, 0, hz); scene.add(door0)
  for (const o of tagged.filter((o) => o.userData.part === 'door' && o.userData.idx === 0)) {
    scene.remove(o); door0.add(o); o.position.sub(door0.position); o.userData.p0 = o.position.clone()
  }
}
// orange chalk lines: the pilaster line across the front, each panel line to the back wall, each pilaster's footprint,
// a cross at every fixing point; then the same crosses on the ceiling, as each plumb line reaches it
const PLUMB0 = 6.4, PLUMB_ST = 0.3, PLUMB_UP = 1.1
function addMarks() {
  const m = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, polygonOffset: true, polygonOffsetFactor: -4 })
  const T = spec.pil.t, w = 0.6
  const strip = (x0, x1, z0, z1, along, order, y = 0.06) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.rotation.x = y > 1 ? Math.PI / 2 : -Math.PI / 2; s.renderOrder = 4
    s.userData = { x0, x1, z0, z1, along, order, y }; scene.add(s); marks.push(s)
  }
  strip(0, spec.run, -T - w / 2, -T + w / 2, 'x', 0)
  strip(0, spec.run, -w / 2, w / 2, 'x', 0)
  spec.panels.forEach((px, i) => strip(px - w / 2, px + w / 2, -T, -spec.depth, 'z', 1.4 + i * 0.4))
  spec.pilasters.forEach((p, i) => { strip(p.x, p.x + w, -T, 0, 'z', 2.6 + i * 0.12); strip(p.x + p.w - w, p.x + p.w, -T, 0, 'z', 2.6 + i * 0.12) })
  fix.forEach(([x], i) => {
    const z = -T / 2
    strip(x - 1.1, x + 1.1, z - 0.3, z + 0.3, 'x', 3.8 + i * 0.1); strip(x - 0.3, x + 0.3, z - 1.1, z + 1.1, 'z', 3.8 + i * 0.1)
    const o = PLUMB0 + i * PLUMB_ST + PLUMB_UP
    strip(x - 1.1, x + 1.1, z - 0.3, z + 0.3, 'x', o, C - 0.06); strip(x - 0.3, x + 0.3, z - 1.1, z + 1.1, 'z', o, C - 0.06)
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
  const rect = (w, h, pos) => {
    const g = new THREE.PlaneGeometry(w, h), m = new THREE.Mesh(g, fill.clone()), l = new THREE.LineSegments(new THREE.EdgesGeometry(g), line.clone())
    for (const o of [m, l]) { o.position.set(...pos); o.renderOrder = 5; scene.add(o); backing.push(o) }
  }
  for (const px of spec.panels) rect(10, 62, [px, 41, -spec.depth + 0.08])
}
// the structure above the ceiling (installed by others), seen through the ceiling as an x-ray outline: a steel member
// running over the pilaster line, and the anchors from each ceiling bracket up into it
function addSteel() {
  const fill = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, opacity: 0.25, depthWrite: false, depthTest: false })
  const line = new THREE.LineBasicMaterial({ color: '#fe7802', transparent: true, depthTest: false })
  const T = spec.pil.t, [y0, y1] = STEEL_Y
  const add = (g, pos, list) => {
    for (const o of [new THREE.Mesh(g, fill.clone()), new THREE.LineSegments(new THREE.EdgesGeometry(g), line.clone())]) {
      o.position.set(...pos); o.renderOrder = 9; scene.add(o); list.push(o)
    }
  }
  add(new THREE.BoxGeometry(RUN + 8, y1 - y0, 3), [MID, (y0 + y1) / 2, -T / 2], xray)
  for (const [x] of fix) for (const d of [-1.35, 1.35]) { const l = []; add(new THREE.BoxGeometry(0.3, y0 - C + 0.4, 0.3), [x + d, (y0 + C - 0.4) / 2, -T / 2], l); rods.push({ x, l }) }
}
const rods = [] // the anchors' x-ray continuation above the ceiling: shown once that ceiling bracket is bolted

// every fastening, in time order
const BR_Y = [18, 64]
const fixT = [] // when each fixing point's floor bracket (and leveling bolt) and ceiling bracket are in
function buildOps() {
  const T = spec.pil.t, D = spec.depth, wallZ = -D + 0.06, pt = spec.panel.t, zc = -T / 2 // tiles sit 0.06 in front of the wall line
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
  // --- step 4: floor brackets, then ceiling brackets. Close-up at FXA for each, the rest quickly ---
  const t4 = S[4] + 5
  fix.forEach(([x], i) => {
    const anchors = [x - 1.35, x + 1.35]
    if (x === FXA) {
      anchors.forEach((ax, j) => {
        const t = t4 + j * 1.8
        ops.add(HW.drill(), V(ax, 0, zc), UP, t, { kind: 'tool', dur: 0.35, hold: 0.55, dist: 4, depth: 0.6, down: FRONT })
        ops.hole(V(ax, 0, zc), UP, t + 0.5, 0.17, t4 + 4)
      })
      ops.add(fixBracket(false), V(x, 0, zc), UP, t4 + 3.7, { dist: 4, dur: 0.6 })
      anchors.forEach((ax, j) => HW.driveScrew(ops, V(ax, 0.15, zc), UP, t4 + 4.6 + j * 1.6, { len: 1.4, down: FRONT }))
      fixT[i] = { fbr: t4 + 3.7, lev: t4 + 8 }
    } else {
      const t = S[4] + 15.4 + i * 0.13
      ops.add(fixBracket(false), V(x, 0, zc), UP, t, { dist: 4, dur: 0.45 })
      anchors.forEach((ax) => ops.add(HW.screw(1.4), V(ax, 0.15, zc), UP, t + 0.3, { dist: 1.4, dur: 0.4, spin: 2 }))
      fixT[i] = { fbr: t, lev: t + 0.5 }
    }
  })
  const t4c = S[4] + 19.6
  fix.forEach(([x], i) => {
    const anchors = [x - 1.35, x + 1.35]
    if (x === FXA) {
      anchors.forEach((ax, j) => {
        const t = t4c + j * 1.8
        ops.add(HW.drill(), V(ax, C, zc), DOWN, t, { kind: 'tool', dur: 0.35, hold: 0.55, dist: 4, depth: 0.6, down: FRONT })
        ops.hole(V(ax, C, zc), DOWN, t + 0.5, 0.17, t4c + 4)
      })
      ops.add(fixBracket(true), V(x, C, zc), DOWN, t4c + 3.7, { dist: 4, dur: 0.6 })
      anchors.forEach((ax, j) => HW.driveScrew(ops, V(ax, C - 0.15, zc), DOWN, t4c + 4.6 + j * 1.6, { len: 1.4, down: FRONT }))
      fixT[i].cbr = t4c + 4.6
    } else {
      const t = S[4] + 28.2 + i * 0.13
      ops.add(fixBracket(true), V(x, C, zc), DOWN, t, { dist: 4, dur: 0.45 })
      anchors.forEach((ax) => ops.add(HW.screw(1.4), V(ax, C - 0.15, zc), DOWN, t + 0.3, { dist: 1.4, dur: 0.4, spin: 2 }))
      fixT[i].cbr = t + 0.3
    }
  })
  levelers.forEach((l, i) => (l.t = fixT[i].lev))
  // --- step 5: through-bolts at the wall brackets ---
  const t5 = S[5] + 10.5
  for (const px of spec.panels) for (const y of BR_Y) {
    const pos = V(px + pt / 2 + 0.12, y, wallZ + 0.85)
    if (px === PX && y === 64) HW.driveScrew(ops, pos, V(1, 0, 0), t5, { len: 1.4, down: V(0, -1, 0) })
    else ops.add(HW.throughBolt(1.2), pos, V(1, 0, 0), t5 + 2.5 + spec.panels.indexOf(px) * 0.3 + (y === 18 ? 0.15 : 0), { dist: 1.5, dur: 0.4, spin: 2 })
  }
  // --- step 6: the wrench raises the third pilaster; pilaster brackets and bolts (close-up inside the stall at PX) ---
  const nutY = BR + 0.15 + 0.16
  const w1 = frontWrench(); ops.add(w1, V(FXA, nutY, zc), FRONT, JACK_A[0] - 0.4, { kind: 'tool', dur: 0.35, hold: JACK_A[1] + 0.4, dist: 4 })
  wrenches.push([w1, JACK_A])
  const pilZ = -T
  const pilBracket = (px, y, s, t, detailed) => {
    const face = px + s * pt / 2, legX = face + s * 0.45
    ops.add(sidedAngle(0.75, 1.5, 2, BACK, V(s, 0, 0)), V(face, y, pilZ), BACK, t, { dist: detailed ? 3 : 4, dur: 0.5 })
    for (const [i, hy] of [y + 0.5, y - 0.5].entries()) {
      if (detailed) HW.driveScrew(ops, V(legX, hy, pilZ - 0.12), BACK, t + 0.9 + i * 1.5, { len: 0.8 })
      else ops.add(HW.screw(0.8), V(legX, hy, pilZ - 0.12), BACK, t + 0.3, { dist: 1, dur: 0.4, spin: 2 })
    }
  }
  const t6 = S[6] + 25.6
  pilBracket(PX, 64, -1, t6, true)
  pilBracket(PX, 64, 1, t6 + 3.7, false)
  HW.driveScrew(ops, V(PX - pt / 2 - 0.12, 64, pilZ - 0.85), V(-1, 0, 0), t6 + 4.3, { len: 1.4 })
  k = 0
  for (const px of spec.panels) for (const y of BR_Y) {
    if (!(px === PX && y === 64)) for (const s of [-1, 1]) pilBracket(px, y, s, S[6] + 34 + (k++) * 0.18, false)
    if (!(px === PX && y === 64)) ops.add(HW.throughBolt(1.2), V(px - pt / 2 - 0.12, y, pilZ - 0.85), V(-1, 0, 0), S[6] + 35.5 + k * 0.1, { dist: 1.5, dur: 0.4, spin: 2 })
  }
  // --- step 7: the nut locked at the floor; a screw through each ceiling bracket's front plate into the pilaster ---
  const w2 = frontWrench(); ops.add(w2, V(FXA, nutY, zc), FRONT, S[7] + 10.6, { kind: 'tool', dur: 0.35, hold: 1.6, dist: 4 })
  wrenches.push([w2, [S[7] + 11, 1.4]])
  const cy = C - BR - CHEEK / 2, cz = 0.15
  fix.forEach(([x], i) => {
    if (x === FXA) HW.driveScrew(ops, V(x, cy, cz), FRONT, S[7] + 14.2, { len: 0.8 })
    else ops.add(HW.screw(0.8), V(x, cy, cz), FRONT, S[7] + 17.4 + i * 0.1, { dist: 1, dur: 0.4, spin: 2 })
  })
  // --- step 8: a screw securing the third pilaster's bottom shoe (it rides on the shoe once seated) ---
  HW.driveScrew(ops, V(P2 - 3, 2, shoeFront()), FRONT, S[8] + 5.6, { len: 0.5 })
  // --- step 9: hinge halves, door halves, latch, keeper, coat hook, pull ---
  const d0 = spec.doors[0], hx = d0.x + spec.door.gap / 2, { h, tops } = spec.hinge
  const dz1 = -T / 2 + spec.door.t / 2, dz0 = dz1 - spec.door.t
  const t9 = S[9] + 5.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? t9 : t9 + 4.1
    const pl = HW.hingeLeaf(1.3, h); pl.rotation.y = Math.PI
    const plg = new THREE.Group(); plg.add(pl)
    ops.add(plg, V(hx - 0.1, y, 0), FRONT, t, { dist: 3, dur: 0.5 })
    ops.add(HW.knuckle(h), V(hx, y, 0.14), UP, t, { kind: 'show', dur: 0.2 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.6 + j * 1.25, { len: 0.7 })
      else ops.add(HW.screw(0.7), V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.4 + j * 0.2, { dist: 1, dur: 0.35, spin: 2 })
    }
  })
  const td = S[9] + 12.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? td : td + 4
    ops.add(HW.hingeLeaf(1.8, h), V(hx + 0.2, y, dz1), FRONT, t, { dist: 2.5, dur: 0.5, parent: door0 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.5 + j * 1.2, { len: 0.7, parent: door0 })
      else ops.add(HW.screw(0.7), V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.3 + j * 0.2, { dist: 1, dur: 0.35, spin: 2, parent: door0 })
    }
  })
  const lx = d0.x + d0.w - 2.6, ly = spec.latch.y, tl = S[9] + 20
  ops.add(HW.slideLatch(), V(lx, ly, dz0), BACK, tl, { dist: 3, dur: 0.5, parent: door0, down: V(0, -1, 0) })
  ;[-0.9, 0.9].forEach((dx, j) => ops.add(HW.screw(0.6), V(lx + dx - 0.4, ly, dz0 - 0.36), BACK, tl + 0.8 + j * 0.5, { dist: 1, dur: 0.4, spin: 2, parent: door0 }))
  const kx = spec.pilasters[1].x + 0.55, tk = S[9] + 22.3
  ops.add(HW.keeper(), V(kx, ly, -T), BACK, tk, { dist: 3, dur: 0.5 })
  ;[0.6, -0.6].forEach((dy, j) => ops.add(HW.screw(0.6), V(kx, ly + dy, -T - 0.3), BACK, tk + 0.7 + j * 0.4, { dist: 1, dur: 0.4, spin: 2 }))
  ops.add(HW.coatHook(), V(d0.x + d0.w / 2, 64, dz0), BACK, S[9] + 24.6, { dist: 3, dur: 0.6, parent: door0 })
  const pl = spec.pull, px0 = d0.x + d0.w - pl.fromEdge + pl.w / 2, tp = S[9] + 28.3
  ops.add(HW.pull(), V(px0, pl.top - pl.h / 2, dz1), FRONT, tp, { dist: 3, dur: 0.6, parent: door0 })
  ;[pl.top - 0.6, pl.top - pl.h + 0.6].forEach((y) => ops.add(HW.screw(0.6), V(px0, y, dz1 + 0.05), FRONT, tp - 0.2, { kind: 'show', dur: 0.1, parent: door0 }))
}
// the front face of the third pilaster's bottom shoe, once seated
function shoeFront() {
  let z = -Infinity
  for (const o of tagged) if (o.userData.part === 'shoe' && o.userData.idx === 2) z = Math.max(z, new THREE.Box3().setFromObject(o).max.z)
  return Number.isFinite(z) ? z : 0.3
}

let lastPose = ''
function pose(t) {
  let moving = false
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    if (part === 'hidden') { o.visible = false; continue }
    let k = 1, dx = 0, dy = 0, dz = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'door') { const s = idx === 0 ? DOOR0_IN : S[9] + 16 + (idx - 1) * 0.5; k = clamp((t - s) / 0.75); dy = (1 - easeOut(k)) * 10 }
    if (part === 'pilaster' || part === 'shoe' || part === 'cshoe') {
      const f = foot(t, idx)
      dz = slideZ(t, idx)
      if (part === 'pilaster') {
        k = clamp((t - S[6] - 4.8 - idx * 0.15) / 0.6)
        o.scale.y = LEN / (spec.pil.y1 - spec.pil.y0)
        o.position.set(o.userData.p0.x, f + LEN / 2, o.userData.p0.z + dz)
        m.opacity = clamp(k * 1.4); o.visible = m.opacity > 0.01
        if (o.visible && (dz > 0.01 || (jack(t, idx) > 0 && jack(t, idx) < 1))) moving = true
        glow(o, part, t); continue
      }
      // the shoes slide on from the ends, ride on the pilaster held clear, then go to the floor and the ceiling
      k = clamp((t - S[6] - 5 - idx * 0.3) / 0.6)
      const seat = ease((t - SHOE_SEAT[0] - idx * SHOE_SEAT[1]) / 0.9), lift = f - HIGH
      dy = part === 'shoe' ? (SHOE_OFF + lift) * (1 - seat) : (-SHOE_OFF + lift) * (1 - seat)
      dy += (part === 'shoe' ? -1 : 1) * (1 - easeOut(k)) * 4
    }
    if (part === 'contact') { m.opacity = 0.7 * clamp((t - SHOE_SEAT[0] - idx * SHOE_SEAT[1] - 0.8) / 0.4); o.visible = m.opacity > 0.01; continue }
    if (part === 'ceiling' || part === 'downlight') {
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
  // leveling bolts reach from the floor bracket's stop to the pilaster's foot (or stand ready before it arrives);
  // the nuts turn while their pilaster is raised
  for (const l of levelers) {
    const a = easeOut((t - l.t) / 0.7), vis = t >= l.t
    l.bolt.visible = l.nut.visible = vis
    if (!vis) continue
    const top = Math.max(LOW, foot(t, l.pi)) - 0.02, drop = (1 - a) * 2.5
    l.bolt.scale.y = top - BR; l.bolt.position.y = (top + BR) / 2 + drop
    l.nut.position.y = BR + 0.15 + drop; l.nut.rotation.y = jack(t, l.pi) * Math.PI * 6 + (1 - a) * Math.PI * 3
    glow(l.bolt, 'bolt', t)
    if (a < 1 || (jack(t, l.pi) > 0 && jack(t, l.pi) < 1)) moving = true
  }
  for (const [w, [a, d]] of wrenches) w.userData.inner.rotation.y = 0.45 * Math.sin(clamp((t - a) / d) * Math.PI * 3)
  // the accessible door swings out, then closes on its own
  const a = ease((t - SWING[0]) / 1.8) * (1 - ease((t - SWING[1]) / 2.0))
  if (door0.rotation.y !== -a * 0.95) moving = true
  door0.rotation.y = -a * 0.95
  // chalk lines draw on during step 2 and fade once the stalls are complete
  const mo = 1 - clamp((t - S[10]) / 1.5)
  for (const s of marks) {
    const { x0, x1, z0, z1, along, order, y } = s.userData
    const r = ease((t - S[2] - 0.4 - order) / (y > 1 ? 0.6 : 1.4))
    const X1 = along === 'x' ? x0 + (x1 - x0) * r : x1, Z1 = along === 'z' ? z0 + (z1 - z0) * r : z1
    s.visible = r > 0.001 && mo > 0.01; s.material.opacity = mo
    s.scale.set(Math.max(0.01, Math.abs(X1 - x0)), Math.max(0.01, Math.abs(Z1 - z0)), 1)
    s.position.set((x0 + X1) / 2, y, (z0 + Z1) / 2)
  }
  // blocks go in just before the panels and come out once the shoes are seated
  supports.forEach((b, i) => {
    const v = clamp((t - IN.panel[0] + 1 - Math.floor(i / 2) * 0.5) / 0.5) * (1 - clamp((t - S[8] - 7.2) / 0.8))
    b.traverse((m) => { if (m.isMesh) m.material.opacity = v }); b.visible = v > 0.01
  })
  // wall backing in step 1 and while the wall brackets go up
  const bk = win(t, S[1] + 7.4, S[2], 1, 1) + win(t, S[3] + 4.8, S[3] + 20, 0.6, 1) * (0.8 + 0.2 * Math.sin(t * 3))
  for (const o of backing) { o.material.opacity = (o.isLineSegments ? 1 : 0.3) * bk; o.visible = bk > 0.01 }
  // the structure above the ceiling: in step 1, and while the ceiling brackets are bolted up into it
  const sk = win(t, S[1] + 5, S[2], 1, 1) + win(t, S[4] + 18, S[5], 1, 1) * (0.8 + 0.2 * Math.sin(t * 3))
  for (const o of xray) { o.material.opacity = (o.isLineSegments ? 1 : 0.22) * sk; o.visible = sk > 0.01 }
  rods.forEach(({ l }, j) => {
    const i = Math.floor(j / 2), on = clamp((t - fixT[i].cbr - 0.6) / 0.4) * win(t, S[4] + 18, S[5], 1, 1)
    for (const o of l) { o.material.opacity = (o.isLineSegments ? 1 : 0.22) * on; o.visible = on > 0.01 }
  })
  if (ops.update(t)) moving = true
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
const ov = $('#ov'), cap = $('#cap span'), stepEl = $('#step'), hookEl = $('#hook'), endEl = $('#end'), kitEl = $('#kit'), flash = $('#flash')
$('#dots').innerHTML = STEPS.map(() => '<i></i>').join('')
const dots = [...document.querySelectorAll('#dots i')]
const pil = (i) => spec.pilasters[i]
const ZC = -T_PIL / 2
const LABELS = [
  [S[1] + 2.8, S[2] - 0.2, () => [P2, 40, ZC], 'Floor to ceiling, at every pilaster', -90, 60],
  [S[1] + 5.2, S[2] - 0.2, () => [MID + 30, STEEL_Y[0], ZC], 'Structure above the ceiling', 60, 110],
  [S[1] + 7.6, S[2] - 0.2, () => [spec.panels[2], 36, -spec.depth], 'Solid backing in the wall', 90, 70],
  [S[2] + 1.5, S[2] + 6, () => [MID + 40, 0.1, -spec.pil.t], 'Pilaster line on the floor', 60, -120],
  [S[2] + 9.4, S[3] - 0.2, () => [FXA, C, ZC], 'Same point on the ceiling', 70, 110],
  [S[3] + 6.4, S[3] + 9.2, () => [PX + 0.5 + 0.95, 64.5, -spec.depth], 'Wall plug in the backing', 90, -150],
  [S[3] + 10, S[3] + 13.2, () => [PX + 0.5 + 1.2, 65, -spec.depth + 0.2], 'Angle bracket', 120, -140],
  [S[3] + 14, S[3] + 17.4, () => [PX - 0.5, 64, -spec.depth + 1], 'The panel slots in between', -120, -150],
  [S[4] + 9.4, S[4] + 12.8, () => [FXA + 1.35, 0.3, ZC], 'Anchored to the floor', 80, -130],
  [S[4] + 13.2, S[4] + 15.6, () => [FXA, BR + 0.5, ZC], 'Leveling bolt and nut', -90, -120],
  [S[4] + 23.4, S[4] + 25.6, () => [FXA + 0.8, C - BR, ZC + 0.8], 'Ceiling bracket, straight above', 90, 110],
  [S[4] + 25, S[4] + 28.4, () => [FXA + 1.35, STEEL_Y[0] - 1.5, ZC], 'Bolted into the structure above', -90, -110],
  [S[5] + 4, S[5] + 8.5, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Block holds the height', 90, -120],
  [S[5] + 11.2, S[6] - 0.3, () => [PX + 0.6, 64, -spec.depth + 0.85], 'Through-bolt, finger tight', 90, -140],
  [S[6] + 6, S[6] + 9.6, () => [P2, spec.pil.y1 - SHOE_OFF - 6, SLIDE_Z], 'Top shoe, held clear', 90, 40],
  [S[6] + 6.3, S[6] + 9.6, () => [P2, HIGH + SHOE_OFF + 2, SLIDE_Z], 'Bottom shoe, held clear', 90, -40],
  [S[6] + 14.4, S[6] + 17.4, () => [FXA, BR + 0.35, ZC + 0.6], 'Turn the nut to raise it', -90, -120],
  [S[6] + 19.2, S[6] + 21.4, () => [FXA, C - BR - 0.6, 0.2], 'Top sits in the ceiling bracket', 80, 120],
  [S[6] + 26.6, S[6] + 29.6, () => [PX - 1, 64.5, -spec.pil.t], 'Bracket screwed to the pilaster', -80, -150],
  [S[6] + 30.2, S[6] + 32.6, () => [PX - 0.6, 64, -spec.pil.t - 0.85], 'Bolted through the panel', -60, -140],
  [S[7] + 1, S[7] + 4.8, () => [pil(2).x + pil(2).w, 60, 0], 'Plumb both ways', 80, -100],
  [S[7] + 5.4, S[7] + 9.2, () => [(pil(1).x + pil(1).w + pil(2).x) / 2, 60, 0], 'Door opening to the drawings', 40, -100],
  [S[7] + 11, S[7] + 13, () => [FXA, BR + 0.35, ZC + 0.6], 'Locked at the floor', -90, -120],
  [S[7] + 15, S[7] + 17.6, () => [FXA, C - BR - CHEEK / 2, 0.3], 'Screwed at the ceiling', 90, 110],
  [S[8] + 2.6, S[9] - 0.4, () => [P2 + 4, C - 1.5, 0.5], 'Top shoe covers the ceiling bracket', 70, 100],
  [S[8] + 3, S[8] + 5.2, () => [P2 + 4, 2, 0.5], 'Bottom shoe covers the floor bracket', 70, -100],
  [S[8] + 6.2, S[8] + 9.6, () => [P2 - 3, 2, 0.6], 'Shoe secured', 70, -110],
  [S[9] + 6.2, S[9] + 9.8, () => [spec.doors[0].x - 0.7, spec.hinge.tops[0] - 2, 0.2], 'Hinge half on the pilaster', 80, -100],
  [S[9] + 13.2, S[9] + 16.4, () => [spec.doors[0].x + 1.3, spec.hinge.tops[0] - 2, 0.2], 'Other half on the door', 90, 90],
  [S[9] + 20.6, S[9] + 22.2, () => [spec.doors[0].x + spec.doors[0].w - 2.6, spec.latch.y, -1.4], 'Latch', -60, -120],
  [S[9] + 22.8, S[9] + 24.4, () => [spec.pilasters[1].x + 0.55, spec.latch.y, -spec.pil.t - 0.5], 'Keeper', 70, -120],
  [S[9] + 25.2, S[9] + 27, () => [spec.doors[0].x + spec.doors[0].w / 2, 65, -1.6], 'Coat hook', 70, -100],
  [S[9] + 28.9, S[9] + 31, () => [spec.doors[0].x + spec.doors[0].w - spec.pull.fromEdge + spec.pull.w / 2, spec.pull.top - 1, 1.3], 'Pull', 70, -100],
  [S[9] + 31.2, S[9] + 35, () => [spec.doors[0].x, spec.hinge.tops[0] - 2, 0.4], 'Hinges set the resting position', 70, -80],
  [S[9] + 36.6, S[10] - 0.3, () => [pil(2).x - 0.15, 46, 0.3], 'Even gaps', 70, -110],
  [S[10] + 1.6, S[10] + 6.6, () => [P2, 48, 0.6], 'Fixed at both ends, still plumb', 70, -100],
  [S[10] + 8, S[10] + 12.8, () => [spec.doors[0].x + spec.doors[0].w - spec.latch.fromEdge, spec.latch.y, 0.6], 'Opens from outside in an emergency', 60, -110],
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
// step 1: a floor-to-ceiling height arrow; step 2: plumb lines from each floor cross up to the ceiling; step 7: a plumb
// line down a pilaster and a door opening's width; step 10: a push arrow at a pilaster's middle
function guides(t) {
  let s = ''
  const z = ZC
  let r = win(t, S[1] + 2.6, S[2] - 0.3, 0.6, 0.4)
  if (r > 0) {
    const d = ease((t - S[1] - 2.6) / 1.2), [ax, ay] = project([P2, 0.2, z]), [bx, by] = project([P2, C - 0.2, z])
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
  r = win(t, S[7] + 0.6, S[7] + 5, 0.5, 0.4)
  if (r > 0) s += dashed([pn.x + pn.w + 0.2, C - 0.5, 0.2], [pn.x + pn.w + 0.2, 0.5, 0.2], r, ease((t - S[7] - 0.6) / 1.2))
  r = win(t, S[7] + 5.3, S[7] + 9.3, 0.5, 0.3)
  if (r > 0) {
    const a = project([pil(1).x + pil(1).w, 60, 0.3]), b = project([pn.x, 60, 0.3])
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
      `<line x1="${a[0]}" y1="${a[1] - 22}" x2="${a[0]}" y2="${a[1] + 22}"/><line x1="${b[0]}" y1="${b[1] - 22}" x2="${b[0]}" y2="${b[1] + 22}"/></g>`
  }
  r = win(t, S[10] + 0.8, S[10] + 6.8, 0.5, 0.4)
  if (r > 0) {
    const [x, y] = project([P2, 48, 0.6]), p = Math.abs(Math.sin((t - S[10] - 0.8) * Math.PI / 1.4)) * 18
    const x0 = x + 150 - p, x1 = x + 34 - p
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="10" stroke-linecap="round" fill="#fe7802"><line x1="${x0}" y1="${y}" x2="${x1 + 16}" y2="${y}"/>` +
      `<path d="M${x1} ${y} l28 -20 v40 z" stroke-width="4"/></g>`
  }
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
