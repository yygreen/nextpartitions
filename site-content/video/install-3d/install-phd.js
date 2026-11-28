// Installation video, phenolic partitions, overhead braced (about 4:23): the detailed overhead braced build
// (install-obd.js) redone for solid phenolic. What changes (research/install-guides/phenolic-check.md): thinner solid
// parts with a dark core at every edge (panels thinner than pilasters and doors), U-brackets whose opening fits the
// part, a leveling bolt in the pilaster foot over floor L-brackets, through-bolts (a barrel nut one side, a screw the
// other) drilled on site through the panel with the bracket as a guide, screws into pilot holes that stop short of the
// far face, and through-bolted hinges and keeper. Hardware and tools stay generic (hardware.js). render.mjs calls
// window.frameAt(t) for every frame and screenshots the page. Units are inches.
import * as THREE from 'three'
import { buildScene } from '/design/render3d/scene.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import * as HW from './hardware.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const V = (x, y, z) => new THREE.Vector3(x, y, z)
const clamp = (x) => Math.max(0, Math.min(1, x))
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const win = (t, a, b, fi = 0.4, fo = 0.3) => clamp((t - a) / fi) * clamp((b - t) / fo)
const ORANGE = new THREE.Color('#fe7802'), ORANGE_E = new THREE.Color('#a84800')
const STYLE = 'overhead-braced'
const RUN = 168.5, MID = RUN / 2
const UP = V(0, 1, 0), DOWN = V(0, -1, 0), FRONT = V(0, 0, 1), BACK = V(0, 0, -1), LEFT = V(-1, 0, 0), RIGHT = V(1, 0, 0)
// phenolic thicknesses for the model (no figures go on screen): panels thinner than pilasters and doors
const PT = 0.5, T = 0.75
const FACE = '#c4c9cc', CORE = '#1d1c1b'

// ---------- timeline ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [6, 'Check the room and the parts', [[0.3, 'First, check the room against the approved drawings.'], [4.5, 'Every bracket needs solid backing inside the wall.'], [8.8, 'Phenolic is solid all the way through, with a dark core at the edges.'], [13.4, 'Panels are thinner than pilasters and doors. Keep it all flat until it goes up.']]],
  [24, 'Lay out the stalls', [[0.3, 'Mark the pilaster line across the front,'], [4, 'each panel line back to the wall,'], [7.5, 'and carry each panel line up the wall.']]],
  [36, 'Fix the wall brackets', [[0.3, 'Wall bracket kit: U-brackets, screws and wall plugs.'], [5.2, 'Drill into the backing and push in a wall plug.'], [9.5, 'Screw the bracket to the wall.'], [14, 'Its opening is sized to fit the panel.'], [18.5, 'Repeat at each bracket height on every panel line.']]],
  [64, 'Fix the floor brackets', [[0.3, 'Floor brackets: L-brackets, screws and floor plugs.'], [4.6, 'Drill the floor at each end of a pilaster and plug the holes.'], [10, 'Screw each bracket down on the pilaster line.'], [14, 'Repeat at every pilaster.']]],
  [82, 'Set the panels in place', [[0.3, 'Rest each panel on blocks at the height on the drawings.'], [4.5, 'Phenolic is heavy: lift panels with two people.'], [8, 'Each panel drops into its wall brackets, unfastened for now.']]],
  [94, 'Prepare and stand the pilasters', [[0.3, 'Pilaster kit: U-brackets, screws, a leveling bolt and the shoe.'], [5, 'Slide the shoe on and hold it up.'], [8.4, 'Thread the leveling bolt into the foot.'], [12, 'Screw the brackets on through pilot holes.'], [15.6, 'Pilot holes stop short, so no screw shows on the other face.'], [19.5, 'Then stand each pilaster on its floor brackets,'], [23.5, 'with the panel between its brackets.']]],
  [122, 'Plumb, level, then bolt through', [[0.3, 'Level the pilaster tops with the leveling bolts.'], [4.5, 'Get each pilaster plumb both ways,'], [8, 'and set the door openings to the drawings.'], [11.8, 'Through-bolts: barrel nuts and screws.'], [16, 'Drill through the panel, using the bracket as a guide.'], [19.5, 'A barrel nut goes in from one side,'], [22.5, 'and a screw from the other.'], [25.5, 'Bolt each pilaster to its floor brackets,'], [29.5, 'and each panel to its wall brackets.']]],
  [156, 'Fit the headrail', [[0.3, 'Headrail kit: pilaster brackets, screws, wall bracket and wall plugs.'], [4.6, 'Screw a bracket onto every pilaster top.'], [11, 'Slide the headrail over the brackets,'], [14, 'screw it to each one,'], [19, 'and fix its end to the wall.']]],
  [184, 'Lower and fix the shoes', [[0.3, 'Lower each shoe to the floor,'], [4.5, 'and screw it to the pilaster.']]],
  [194, 'Hang the doors and fit the hardware', [[0.3, 'Door hardware: hinges, latch, keeper, pull, coat hook and through-bolts.'], [5.5, 'Bolt the hinge halves through the pilaster,'], [10.5, 'hang the door,'], [12.5, 'and bolt the other halves through the door.'], [19.5, 'Screw the latch on through pilot holes, and bolt the keeper through the pilaster.'], [24.5, 'Then the coat hook,'], [27, 'and the pull on the outside.'], [31, 'The accessible stall\'s door closes on its own.'], [36, 'Adjust each door until the gaps are even.']]],
  [238, 'Check and clean', [[0.3, 'Test every latch, including from outside.'], [5, 'Check every fixing one last time.'], [9.5, 'Clean with mild soap and water, then wipe dry.']]],
]
const END0 = 253, DURATION = 263
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t]))
export const CAPTIONS = [
  [0.4, 'Here is how phenolic partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]
// kit cards: [start, end, title, items]
const KITS = [
  [S[1] + 8.4, S[1] + 15.6, 'Solid phenolic', [['Panel', () => sample(PT)], ['Pilaster', () => sample(T)], ['Door', () => sample(T)], ['Laminate, to compare', () => laminateSample()]]],
  [S[3] + 0.4, S[3] + 4.8, 'Wall bracket kit', [['U-bracket', () => HW.channel(PT, 1.5, 2.4)], ['Screws', () => HW.screw(1.1)], ['Wall plugs', () => HW.plug()]]],
  [S[4] + 0.4, S[4] + 4.2, 'Floor brackets', [['L-bracket', () => HW.angle(1.1, 2.2, 2)], ['Screws', () => HW.screw(1.1)], ['Floor plugs', () => HW.plug()]]],
  [S[6] + 0.4, S[6] + 4.6, 'Pilaster kit', [['U-bracket', () => HW.channel(PT, 1.5, 2.4)], ['Screws', () => HW.screw(0.5)], ['Leveling bolt', () => HW.levelBolt(), 4.6], ['Shoe', () => HW.shoe()]]],
  [S[7] + 11.6, S[7] + 15.4, 'Through-bolts', [['Barrel nut', () => HW.barrelNut(), 3.6], ['Screw', () => HW.screw(0.6), 3.6]]],
  [S[8] + 0.4, S[8] + 4.4, 'Headrail kit', [['Headrail bracket', () => railBracket()], ['Screws', () => HW.screw(1.1)], ['Wall bracket', () => HW.angle(1.6, 1.6, 2.4)], ['Wall plugs', () => HW.plug()]]],
  [S[10] + 0.4, S[10] + 5.2, 'Door hardware', [['Hinge', () => hingeSet()], ['Latch', () => HW.slideLatch()], ['Keeper', () => HW.keeper()], ['Pull', () => HW.pull()], ['Coat hook', () => HW.coatHook()], ['Barrel nuts', () => HW.barrelNut(), 3.6]]],
]

// ---------- camera ----------
const P2 = 90.5 // centre of the third pilaster, the one most close-ups use
const PX = 95.75 // the panel line the bracket close-ups use
const D = 61.25
const DROP = 12 // pilasters are prepared this far up, then lowered onto the floor brackets
const CAM = [
  [0, [MID + 40, 74, 300], [MID, 36, -22], 40],
  [6, [MID + 10, 86, 270], [MID, 0, -24], 40],
  [10.5, [MID - 6, 66, 150], [MID - 6, 40, -60], 40],
  [14.2, [MID - 8, 64, 140], [MID - 6, 40, -60], 40],
  // step 2
  [24.5, [MID + 10, 86, 262], [MID, 0, -24], 40],
  [30, [MID + 6, 84, 210], [MID, 20, -40], 40],
  [35.5, [MID + 2, 80, 180], [MID, 30, -50], 40],
  // step 3: one U-bracket in close-up, then the wall from the front
  [41, [PX + 7, 67.5, -D + 10], [PX, 64, -61], 40],
  [52, [PX + 5, 66.5, -D + 8.5], [PX, 64, -61], 40],
  [55, [MID + 30, 92, 100], [MID - 6, 34, -54], 44],
  [63.5, [MID + 18, 86, 92], [MID - 12, 34, -54], 44],
  // step 4: the floor brackets at the third pilaster, then low along the front line
  [68.8, [P2 + 10, 11, 15], [P2 + 1, 0.6, -1.3], 40],
  [76, [P2 + 8.5, 10, 13], [P2 + 1, 0.6, -1.3], 40],
  [77.5, [RUN + 10, 26, 64], [MID - 18, 1, -1], 40],
  [81.5, [RUN + 4, 26, 58], [MID - 22, 1, -1], 40],
  // step 5: panels drop in
  [85, [RUN + 20, 150, 120], [MID - 6, 20, -36], 40],
  [93.5, [RUN + 8, 146, 110], [MID - 6, 20, -36], 40],
  // step 6: the raised pilaster's foot (shoe, leveling bolt), through the door opening to its bracket, then wide
  [98.8, [P2 + 16, 21, 30], [P2, 14, -0.4], 40],
  [104.6, [P2 + 13, 19, 25], [P2, 13.5, -0.4], 40],
  [105.6, [72, 62, 16], [PX - 2, 70, -4], 40],
  [106.8, [PX - 15, 80, -16], [PX - 0.5, 75.5, -1.5], 40],
  [112, [PX - 12, 79, -13], [PX - 0.5, 75.5, -1.5], 40],
  [112.8, [72, 74, 10], [MID, 50, -10], 40],
  [113.8, [MID + 30, 64, 290], [MID, 40, -14], 40],
  [121.5, [MID + 22, 64, 276], [MID, 40, -14], 40],
  // step 7: level line, plumb, opening; the through-bolt from both sides of the panel; the floor bracket bolts; the wall
  [125, [RUN * 0.66, 50, 178], [RUN * 0.6, 78, -4], 40],
  [126.5, [RUN * 0.6, 52, 184], [RUN * 0.55, 76, -4], 40],
  [127.5, [P2 + 22, 50, 140], [P2 - 4, 44, -4], 40],
  [133.4, [P2 + 12, 52, 150], [P2 - 10, 46, -4], 40],
  [137.6, [PX - 12, 68, -14], [PX - 0.4, 64, -1.85], 40],
  [142.2, [PX - 10, 67, -12], [PX - 0.4, 64, -1.85], 40],
  [143.2, [PX, 80, -12], [PX, 64, -1.85], 40],
  [144.2, [PX + 10, 67, -12], [PX + 0.4, 64, -1.85], 40],
  [146.6, [PX + 9, 66.5, -11], [PX + 0.4, 64, -1.85], 40],
  [147.4, [P2 + 10, 8, 14], [P2 + 2, 1.5, 0], 40],
  [150.4, [P2 + 9, 8, 13], [P2 + 2, 1.5, 0], 40],
  [151.4, [MID + 30, 92, 100], [MID - 6, 34, -54], 44],
  [155.5, [MID + 18, 86, 92], [MID - 12, 34, -54], 44],
  // step 8: a rail bracket on a pilaster top, the rail goes on, its screw, the wall end
  [161, [P2 + 14, 90, 22], [P2, 81, -0.6], 40],
  [165, [P2 + 11, 89, 19], [P2, 81, -0.6], 40],
  [168, [RUN * 0.28, 64, 205], [MID, 76, -10], 40],
  [170.5, [RUN * 0.33, 64, 212], [MID, 74, -10], 40],
  [172.5, [P2 + 14, 88, 22], [P2, 80, -0.6], 40],
  [175, [P2 + 11, 88, 19], [P2, 80, -0.6], 40],
  [177, [RUN - 16, 88, 24], [RUN - 1, 81, 0.6], 40],
  [183, [RUN - 13, 87, 21], [RUN - 1, 81, 0.6], 40],
  // step 9: shoes down, one screwed on
  [185, [RUN * 0.66, 48, 178], [RUN * 0.6, 22, -4], 40],
  [187.6, [P2 + 10, 9, 15], [P2 + 3, 2, 0.3], 40],
  [192.5, [P2 + 8.5, 8.5, 13], [P2 + 3, 2, 0.3], 40],
  // step 10: hinge halves on the pilaster, the door, its halves, latch and keeper from inside, the pull, the swing
  [200, [16, 66, 26], [3.6, 60, 0], 40],
  [204, [15, 64, 30], [4.6, 54, 0], 40],
  [206, [22, 60, 46], [8, 50, 0], 40],
  [210.5, [20, 60, 42], [8, 50, 0], 40],
  [212, [RUN * 0.3, 70, 120], [RUN * 0.2, 50, -2], 40],
  [213.2, [24, 93, 6], [32, 52, -12], 40],
  [214.4, [30, 47, -13], [37.5, 42, -1.2], 40],
  [216.2, [31, 47, -12], [37.5, 42, -1.2], 40],
  [217.6, [33, 46, -12], [39.5, 41, -1.3], 40],
  [218.8, [29, 61, -16], [21.5, 63, -1.2], 40],
  [220.4, [28, 61, -15], [21.5, 63, -1.2], 40],
  [221.3, [30, 93, 4], [32, 56, -6], 40],
  [222.5, [44, 50, 32], [31, 41, 0], 40],
  [224.6, [45, 51, 35], [31, 41, 0], 40],
  [225.5, [46, 62, 96], [16, 46, 6], 40],
  [229, [44, 62, 92], [16, 46, 6], 40],
  [232, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [237.5, [RUN * 0.4, 58, 160], [RUN * 0.26, 44, -2], 40],
  // step 11: the latch from outside, then the whole run
  [240.5, [62, 50, 76], [32, 40, 0], 40],
  [243.5, [58, 50, 72], [32, 40, 0], 40],
  [248, [MID + 30, 64, 290], [MID, 50, -14], 40],
  [253, [MID + 12, 62, 264], [MID, 50, -14], 40],
  [263, [MID - 8, 62, 244], [MID, 48, -14], 40],
]

// when each scene part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { panel: [S[5] + 2.5, 0.5], pilaster: [S[6] + 19.5, 0.45], shoe: [S[6] + 5, 0.3], rail: [S[8] + 11, 0], door: [S[10] + 10, 0.6], grab: [S[11] + 7.5, 0] }
const DOOR0_IN = S[10] + 10 // the accessible door; the others follow at S[10] + 16
const GLOW = { panel: [S[5] + 2.5, S[5] + 8], pilaster: [S[6] + 19.5, S[6] + 24.5], rail: [S[8] + 11, S[8] + 14], shoe: [S[9] + 0.5, S[10] - 0.3], door: [S[10] + 10, S[10] + 13], grab: [S[11] + 7.5, S[11] + 11] }
const SHOE_UP = 7, SHOE_DOWN = [S[9] + 1.5, 0.4]
const SWING = [S[10] + 31.5, S[10] + 34]

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

// ---------- phenolic material ----------
const faceMat = () => new THREE.MeshPhysicalMaterial({ color: FACE, roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.9 })
const coreMat = (c = CORE) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })
// box face order: +x, -x, +y, -y, +z, -z. The two big faces take the finish; the four edges show the core.
const slabMats = (thinAxis, core = CORE) => {
  const f = faceMat(), c = coreMat(core)
  return thinAxis === 'x' ? [f, f, c, c, c, c] : [c, c, c, c, f, f]
}
// a cut sample for the material card: w x h, thickness t along z, edges barely eased
function sample(t, core = CORE, face) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(5, 7, t, 2, 0.03), slabMats('z', core))
  if (face) m.material[4] = m.material[5] = face
  m.castShadow = true
  return m
}
// plastic laminate for comparison: thicker, a particleboard core under a thin face sheet
const laminateSample = () => sample(1, '#a9875c', new THREE.MeshPhysicalMaterial({ color: '#e6dcb6', roughness: 0.42, clearcoat: 0.3 }))

// ---------- extra models for this build ----------
function railBracket() {
  const g = new THREE.Group()
  const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, T + 0.26), HW.MAT.zinc)
  top.position.y = 0.06; g.add(top)
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(2, 1.3, 0.12), HW.MAT.zinc); e.position.set(0, -0.6, s * (T / 2 + 0.07)); g.add(e) }
  g.traverse((m) => { if (m.isMesh) m.castShadow = true })
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
const tagged = [], marks = [], wallMarks = [], supports = [], backing = [], pg = []
const CANVAS = document.getElementById('gl')
function setup({ specs, width, height, gl = 1 }) {
  P = { width, height, gl }
  spec = structuredClone(specs[STYLE])
  spec.panel.t = PT; spec.pil.t = T; spec.door.t = T
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
    const sz = new THREE.Vector3(); b.getSize(sz)
    // the scene's flat panel brackets are replaced by the hardware below
    if (o.userData.part === 'panel' && sz.x < 0.3) o.userData.part = 'hidden'
    // the accessible door's hinges and pull are replaced by parts that go on one at a time
    if (o.userData.part === 'door' && o.userData.idx === 0) {
      const h = b.max.y - b.min.y
      if (c.x < d0.x + 6 && h > 3 && h < 5) o.userData.part = 'hidden'
      if (c.x > d0.x + d0.w - pl.fromEdge - 1 && c.x < d0.x + d0.w - pl.fromEdge + pl.w + 1 && c.y > pl.top - pl.h - 1 && c.z > 0.2) o.userData.part = 'hidden'
    }
    // solid phenolic: the finish on the faces, the dark core on every edge, edges barely eased
    if (['panel', 'pilaster', 'door'].includes(o.userData.part) && o.material.color?.getHexString() === 'e6dcb6') {
      o.geometry = new RoundedBoxGeometry(sz.x, sz.y, sz.z, 2, 0.03)
      o.material = slabMats(sz.x < sz.z ? 'x' : 'z')
    } else o.material = o.material.clone()
    for (const m of mats(o)) m.transparent = true
    o.userData.p0 = o.position.clone(); tagged.push(o)
  })
  hingeDoor()
  addMarks(); addSupports(); addBacking()
  // each pilaster's own frame: what is fixed to it before it stands (leveling bolt, brackets) drops with it
  spec.pilasters.forEach(() => { const g = new THREE.Group(); scene.add(g); pg.push(g) })
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
const mats = (o) => (Array.isArray(o.material) ? o.material : [o.material])
function hingeDoor() {
  const d = spec.doors[0], hx = d.x + spec.door.gap / 2, hz = 0.14
  door0 = new THREE.Group(); door0.position.set(hx, 0, hz); scene.add(door0)
  for (const o of tagged.filter((o) => o.userData.part === 'door' && o.userData.idx === 0)) {
    scene.remove(o); door0.add(o); o.position.sub(door0.position); o.userData.p0 = o.position.clone()
  }
}
// orange chalk lines: the pilaster line, each panel line to the back wall, each pilaster's footprint; panel lines up the wall
function addMarks() {
  const m = new THREE.MeshBasicMaterial({ color: '#fe7802', transparent: true, polygonOffset: true, polygonOffsetFactor: -4 })
  const w = 0.6
  const strip = (x0, x1, z0, z1, along, order) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.rotation.x = -Math.PI / 2; s.renderOrder = 4
    s.userData = { x0, x1, z0, z1, along, order }; scene.add(s); marks.push(s)
  }
  strip(0, spec.run, -T - w / 2, -T + w / 2, 'x', 0)
  strip(0, spec.run, -w / 2, w / 2, 'x', 0)
  spec.panels.forEach((px, i) => strip(px - w / 2, px + w / 2, -T, -spec.depth, 'z', 2.6 + i * 0.5))
  spec.pilasters.forEach((p, i) => { strip(p.x, p.x + w, -T, 0, 'z', 4.6 + i * 0.15); strip(p.x + p.w - w, p.x + p.w, -T, 0, 'z', 4.6 + i * 0.15) })
  spec.panels.forEach((px, i) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); s.renderOrder = 4
    s.userData = { px, order: 7.6 + i * 0.4 }; scene.add(s); wallMarks.push(s)
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
  rect(6, 10, [spec.run - 0.08, spec.rail - 1, 2.6], -Math.PI / 2)
}

// where things sit
const BR_Y = [18, 64]
const EAR = PT / 2 + 0.12 // outer face of a U-bracket's ear, from the panel centre
const HOLE = PT / 2 + 0.12 + 0.42 // screw holes in a U-bracket's base, either side of the opening
const floorAt = (p) => (p.w > 6 ? [p.x + 1.4, p.x + p.w - 1.4] : [p.x + p.w / 2])
const boltsAt = (p) => (p.w > 16 ? [p.x + 2, p.x + p.w - 2] : [p.x + p.w / 2])
const pilOf = (px) => spec.pilasters.findIndex((p) => px > p.x && px < p.x + p.w)
const LEG_A = 1.1, PLUG_Z = -T - 0.7, BOLT_Y = 1.7

// every fastening, in time order
function buildOps() {
  const wallZ = -D + 0.06 // the tiles sit 0.05 in front of the wall line
  // --- step 3: wall U-brackets. Close-up on the upper one at PX, then the rest quickly ---
  const wallBracket = (px, y, t, detailed) => {
    const holes = [[px - HOLE, y + 0.6], [px + HOLE, y - 0.6]]
    if (detailed) {
      holes.forEach(([hx, hy], i) => HW.drillPlug(ops, V(hx, hy, wallZ), FRONT, t + i * 1.9))
      ops.add(HW.channel(PT, 1.5, 2.4), V(px, y, wallZ), FRONT, t + 4, { dist: 4, dur: 0.6 })
      holes.forEach(([hx, hy], i) => HW.driveScrew(ops, V(hx, hy, wallZ + 0.12), FRONT, t + 4.9 + i * 1.6))
    } else {
      ops.add(HW.channel(PT, 1.5, 2.4), V(px, y, wallZ), FRONT, t, { dist: 5, dur: 0.5 })
      holes.forEach(([hx, hy]) => ops.add(HW.screw(1), V(hx, hy, wallZ + 0.12), FRONT, t + 0.3, { dist: 1.2, dur: 0.4, spin: 2 }))
    }
  }
  wallBracket(PX, 64, S[3] + 5.2, true)
  let k = 0
  for (const px of spec.panels) for (const y of BR_Y) if (!(px === PX && y === 64)) wallBracket(px, y, S[3] + 18.5 + (k++) * 0.3, false)
  // --- step 4: floor L-brackets on plugs. Close-up at the third pilaster ---
  const t4 = S[4] + 4.6
  spec.pilasters.forEach((p, i) => floorAt(p).forEach((x, j) => {
    const L = () => HW.angle(LEG_A, 2.2, 2), pos = V(x, 0, -T), hole = V(x, 0, PLUG_Z)
    if (i === 2) {
      HW.drillPlug(ops, hole, UP, t4 + j * 2, { down: V(0, 0, 1) })
      ops.add(L(), pos, UP, t4 + 4.4 + j * 0.4, { dist: 3, dur: 0.6, down: RIGHT })
      HW.driveScrew(ops, V(x, 0.12, PLUG_Z), UP, t4 + 5.4 + j * 1.5, { down: V(0, 0, 1) })
    } else {
      const t = S[4] + 12.5 + i * 0.35 + j * 0.15
      ops.add(L(), pos, UP, t, { dist: 3, dur: 0.5, down: RIGHT })
      ops.add(HW.screw(1), V(x, 0.12, PLUG_Z), UP, t + 0.3, { dist: 1.2, dur: 0.4, spin: 2 })
    }
  }))
  // --- step 6: on each raised pilaster, the leveling bolt in the foot and the U-brackets on its back ---
  const y0 = spec.pil.y0
  spec.pilasters.forEach((p, i) => boltsAt(p).forEach((x, j) => {
    const pos = V(x, y0, -T / 2)
    if (i === 2) ops.add(HW.levelBolt(1.2, y0), pos, DOWN, S[6] + 8.8, { dist: 1.3, dur: 1.6, spin: 5, parent: pg[i] })
    else ops.add(HW.levelBolt(1.2, y0), pos, DOWN, S[6] + 14 + i * 0.2 + j * 0.1, { dist: 1.3, dur: 0.6, spin: 2, parent: pg[i] })
  }))
  const pilZ = -T
  const pilBracket = (px, y, t, detailed) => {
    const i = pilOf(px), par = pg[i], holes = [[px - HOLE, y + 0.6], [px + HOLE, y - 0.6]]
    ops.add(HW.channel(PT, 1.5, 2.4), V(px, y, pilZ), BACK, t, { dist: detailed ? 3 : 4, dur: 0.5, parent: par })
    holes.forEach(([hx, hy], j) => {
      const at = V(hx, hy, pilZ - 0.12)
      if (detailed) {
        // a short pilot hole first (the drill only goes part way in), then the screw
        ops.add(HW.drill(), V(hx, hy, pilZ - 0.12), BACK, t + 0.8 + j * 2.3, { kind: 'tool', dur: 0.3, hold: 0.5, dist: 3.5, depth: 0.3, parent: par })
        HW.driveScrew(ops, at, BACK, t + 1.9 + j * 2.3, { len: 0.5, parent: par })
      } else ops.add(HW.screw(0.5), at, BACK, t + 0.3, { dist: 1, dur: 0.4, spin: 2, parent: par })
    })
  }
  pilBracket(PX, 64, S[6] + 12.6, true)
  k = 0
  for (const px of spec.panels) for (const y of BR_Y) if (!(px === PX && y === 64)) pilBracket(px, y, S[6] + 17.6 + (k++) * 0.12, false)
  // --- step 7: through-bolts. Close-up at PX: drilled through from stall 2, barrel nut in, screw from stall 3 ---
  const bz = pilZ - 1.1, tb = S[7] + 16
  ops.add(HW.drill(), V(PX - EAR, 64, bz), LEFT, tb, { kind: 'tool', dur: 0.35, hold: 0.9, dist: 3.5, depth: 0.7 })
  ops.hole(V(PX - EAR, 64, bz), LEFT, tb + 0.6, 0.13, tb + 3.6)
  ops.add(HW.barrelNut(), V(PX - EAR, 64, bz), LEFT, tb + 3.5, { dist: 1.6, dur: 0.6 })
  HW.driveScrew(ops, V(PX + EAR, 64, bz), RIGHT, tb + 6.4, { len: 0.7, down: DOWN })
  const throughBolt = (px, y, z, t) => {
    ops.add(HW.barrelNut(), V(px - EAR, y, z), LEFT, t, { dist: 1.4, dur: 0.4 })
    ops.add(HW.screw(0.7), V(px + EAR, y, z), RIGHT, t + 0.2, { dist: 1.2, dur: 0.4, spin: 2 })
  }
  k = 0
  for (const px of spec.panels) for (const y of BR_Y) if (!(px === PX && y === 64)) throughBolt(px, y, bz, S[7] + 24 + (k++) * 0.15)
  // the pilaster bolted to its floor brackets, from the front through the foot
  spec.pilasters.forEach((p, i) => floorAt(p).forEach((x, j) => {
    const pos = V(x, BOLT_Y, 0)
    if (i === 2) HW.driveScrew(ops, pos, FRONT, S[7] + 25.6 + j * 1.6, { len: 1 })
    else ops.add(HW.screw(1), pos, FRONT, S[7] + 28 + i * 0.2 + j * 0.1, { dist: 1.2, dur: 0.4, spin: 2 })
  }))
  // panels to the wall brackets
  k = 0
  for (const px of spec.panels) for (const y of BR_Y) throughBolt(px, y, wallZ + 1.1, S[7] + 29.8 + (k++) * 0.25)
  // --- step 8: headrail brackets, rail screws, the wall end ---
  const y1 = spec.pil.y1
  spec.pilasters.forEach((p, i) => {
    const cx = p.x + p.w / 2, t = i === 2 ? S[8] + 5 : S[8] + 8.6 + i * 0.25
    ops.add(railBracket(), V(cx, y1, -T / 2), UP, t, { dist: 3, dur: 0.5 })
    if (i === 2) HW.driveScrew(ops, V(cx, y1 - 0.6, 0.07), FRONT, t + 0.9, { len: 0.5 })
    else ops.add(HW.screw(0.5), V(cx, y1 - 0.6, 0.07), FRONT, t + 0.3, { dist: 1, dur: 0.4, spin: 2 })
  })
  const railTop = spec.rail + 2 / spec.frame.S, railFront = (1.75 - T) / 2
  spec.pilasters.forEach((p, i) => {
    const cx = p.x + p.w / 2, pos = V(cx, railTop - 1, railFront)
    if (i === 2) HW.driveScrew(ops, pos, FRONT, S[8] + 16.5, { len: 0.9 })
    else ops.add(HW.screw(0.9), pos, FRONT, S[8] + 18.2 + i * 0.2, { dist: 1.2, dur: 0.4, spin: 2 })
  })
  const WALL = V(-1, 0, 0), wx = spec.run - 0.06, wy = railTop - 1, wz = railFront + 1.05 // on the wall just in front of the end pilaster
  const t8w = S[8] + 21
  ;[0.5, -0.5].forEach((dy, i) => HW.drillPlug(ops, V(wx, wy + dy, wz), WALL, t8w + i * 1.7))
  ops.add(sidedAngle(1.6, 1.6, 2.4, WALL, V(0, 0, 1)), V(wx, wy, railFront), WALL, t8w + 3.6, { dist: 4, dur: 0.5 })
  ;[0.5, -0.5].forEach((dy, i) => HW.driveScrew(ops, V(wx - 0.12, wy + dy, wz), WALL, t8w + 4.3 + i * 1.2, { len: 1 }))
  // --- step 9: each shoe screwed to its pilaster ---
  const shoeZ = spec.shoeOver + 0.01
  spec.pilasters.forEach((p, i) => {
    const pos = V(p.x + Math.min(3, p.w / 2), 2, shoeZ)
    if (i === 2) HW.driveScrew(ops, pos, FRONT, S[9] + 4.4, { len: 0.6 })
    else ops.add(HW.screw(0.6), pos, FRONT, S[9] + 6.2 + i * 0.2, { dist: 1, dur: 0.4, spin: 2 })
  })
  // --- step 10: hinge halves bolted through, door halves, latch, keeper, coat hook, pull ---
  const d0 = spec.doors[0], hx = d0.x + spec.door.gap / 2, { h, tops } = spec.hinge
  const dz1 = -T / 2 + spec.door.t / 2, dz0 = dz1 - spec.door.t
  const t10 = S[10] + 5.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? t10 : t10 + 4.1
    const pl = HW.hingeLeaf(1.3, h); pl.rotation.y = Math.PI // pilaster half: leaf extends to -x from the knuckle
    const plg = new THREE.Group(); plg.add(pl)
    ops.add(plg, V(hx - 0.1, y, 0), FRONT, t, { dist: 3, dur: 0.5 })
    ops.add(HW.knuckle(h), V(hx, y, 0.14), UP, t, { kind: 'show', dur: 0.2 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.6 + j * 1.25, { len: 0.7 })
      else ops.add(HW.screw(0.7), V(hx - 0.85, y + dy, 0.14), FRONT, t + 0.4 + j * 0.2, { dist: 1, dur: 0.35, spin: 2 })
      ops.add(HW.barrelNut(0.4), V(hx - 0.85, y + dy, -T), BACK, t + 0.8 + j * 0.3, { dist: 1, dur: 0.35 })
    }
  })
  // the door halves ride on the door (parent door0), so they swing with it; their barrel nuts on the inside face
  const td = S[10] + 12.5
  tops.forEach((top, i) => {
    const y = top - h / 2, t = i === 0 ? td : td + 4
    ops.add(HW.hingeLeaf(1.8, h), V(hx + 0.2, y, dz1), FRONT, t, { dist: 2.5, dur: 0.5, parent: door0 })
    for (const [j, dy] of [-h / 3, 0, h / 3].entries()) {
      if (i === 0) HW.driveScrew(ops, V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.5 + j * 1.2, { len: 0.7, parent: door0 })
      else ops.add(HW.screw(0.7), V(hx + 1.3, y + dy, dz1 + 0.14), FRONT, t + 0.3 + j * 0.2, { dist: 1, dur: 0.35, spin: 2, parent: door0 })
      ops.add(HW.barrelNut(0.4), V(hx + 1.3, y + dy, dz0), BACK, t + 0.7 + j * 0.3, { dist: 1, dur: 0.35, parent: door0 })
    }
  })
  // latch screwed into pilot holes on the inside face; keeper bolted through the next pilaster (nuts show in front);
  // coat hook inside; pull outside, bolted through (nuts inside)
  const lx = d0.x + d0.w - 2.6, ly = spec.latch.y, tl = S[10] + 20
  ops.add(HW.slideLatch(), V(lx, ly, dz0), BACK, tl, { dist: 3, dur: 0.5, parent: door0, down: DOWN })
  ;[-0.9, 0.9].forEach((dx, j) => ops.add(HW.screw(0.5), V(lx + dx - 0.4, ly, dz0 - 0.36), BACK, tl + 0.8 + j * 0.5, { dist: 1, dur: 0.4, spin: 2, parent: door0 }))
  const kx = spec.pilasters[1].x + 0.55, tk = S[10] + 22.3
  ops.add(HW.keeper(), V(kx, ly, -T), BACK, tk, { dist: 3, dur: 0.5 })
  ;[0.6, -0.6].forEach((dy, j) => {
    ops.add(HW.screw(0.6), V(kx, ly + dy, -T - 0.3), BACK, tk + 0.7 + j * 0.4, { dist: 1, dur: 0.4, spin: 2 })
    ops.add(HW.barrelNut(0.4), V(kx, ly + dy, 0), FRONT, tk + 0.9 + j * 0.4, { dist: 1, dur: 0.35 })
  })
  ops.add(HW.coatHook(), V(d0.x + d0.w / 2, 64, dz0), BACK, S[10] + 24.6, { dist: 3, dur: 0.6, parent: door0 })
  const pl = spec.pull, px0 = d0.x + d0.w - pl.fromEdge + pl.w / 2, tp = S[10] + 28.3
  ops.add(HW.pull(), V(px0, pl.top - pl.h / 2, dz1), FRONT, tp, { dist: 3, dur: 0.6, parent: door0 })
  ;[pl.top - 0.6, pl.top - pl.h + 0.6].forEach((y) => ops.add(HW.barrelNut(0.4), V(px0, y, dz0), BACK, tp + 0.3, { dist: 1, dur: 0.35, parent: door0 }))
}

let lastPose = ''
function pilDy(idx, t) { const [s, st] = IN.pilaster; return (1 - ease((t - s - idx * st) / 1.6)) * DROP }
function pose(t) {
  let moving = false
  for (const o of tagged) {
    const { part, idx } = o.userData, ms = mats(o)
    if (part === 'hidden') { o.visible = false; continue }
    let k = 1, dx = 0, dy = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'door') { const s = idx === 0 ? DOOR0_IN : S[10] + 16 + (idx - 1) * 0.5; k = clamp((t - s) / 0.75); dy = (1 - easeOut(k)) * 10 }
    if (part === 'pilaster' || part === 'shoe') {
      dy = pilDy(idx, t)
      // the shoe goes on at the foot and slides up out of the way; it comes down in step 9
      if (part === 'shoe') { const s = IN.shoe[0] + idx * IN.shoe[1]; k = clamp((t - s) / 0.5); dy += SHOE_UP * ease((t - s - 0.4) / 1.2) * (1 - ease((t - SHOE_DOWN[0] - idx * SHOE_DOWN[1]) / 0.8)) }
      else k = clamp((t - S[6] - 4.6 - idx * 0.15) / 0.6)
    }
    if (part === 'rail') { const r = ease((t - IN.rail[0]) / 1.8); dx = -(1 - r) * (RUN + 260); k = t < IN.rail[0] ? 0 : 1; dy = 0 }
    if (part === 'contact') { ms[0].opacity = 0.7 * clamp((t - SHOE_DOWN[0] - idx * SHOE_DOWN[1] - 0.6) / 0.4); o.visible = ms[0].opacity > 0.01; continue }
    if (part === 'ceiling' || part === 'downlight') {
      const c = clamp((104 - camera.position.y) / 8)
      if (part === 'ceiling') { ms[0].opacity = c; ms[0].depthWrite = c > 0.99; o.visible = c > 0.01 } else o.visible = c > 0.5
      continue
    }
    const op = clamp(k * 1.4)
    o.visible = op > 0.01
    o.position.set(o.userData.p0.x + dx, o.userData.p0.y + dy, o.userData.p0.z)
    if (dx || (dy && o.visible)) moving = true
    const g = GLOW[part]
    const gi = g ? win(t, g[0], g[1], 0.5, 0.6) * 0.85 : 0
    // a slab's two faces share one material, so its base colour is kept on the material, not per face
    for (const m of new Set(ms)) {
      m.opacity = op
      if (!m.emissive) continue
      const u = (m.userData.base ??= { e: m.emissive.clone(), c: m.color.clone() })
      m.emissive.copy(u.e).lerp(ORANGE_E, Math.min(1, gi * 1.2)); m.color.copy(u.c).lerp(ORANGE, Math.min(1, gi * 1.3)); m.emissiveIntensity = 1
    }
  }
  spec.pilasters.forEach((_, i) => { pg[i].position.y = pilDy(i, t) })
  // the accessible door swings out, then closes on its own
  const a = ease((t - SWING[0]) / 1.8) * (1 - ease((t - SWING[1]) / 2.0))
  if (door0.rotation.y !== -a * 0.95) moving = true
  door0.rotation.y = -a * 0.95
  // chalk lines draw on during step 2 and fade once the stalls are complete
  const mo = 1 - clamp((t - S[11]) / 1.5)
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
  // blocks go in just before the panels and come out once everything is bolted
  supports.forEach((b, i) => {
    const v = clamp((t - IN.panel[0] + 1 - Math.floor(i / 2) * 0.5) / 0.5) * (1 - clamp((t - S[7] - 31.8) / 0.8))
    b.traverse((m) => { if (m.isMesh) m.material.opacity = v }); b.visible = v > 0.01
  })
  // wall backing in step 1 and while the wall brackets go up; the headrail's wall end in step 8
  const bk = win(t, S[1] + 2.5, S[2], 1, 1) + win(t, S[3] + 4.8, S[3] + 20, 0.6, 1)
  const bk2 = win(t, S[8] + 19.5, S[8] + 26.5, 0.6, 1)
  backing.forEach((o, i) => {
    const v = (i >= backing.length - 2 ? bk2 : bk) * (0.8 + 0.2 * Math.sin(t * 3))
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
const LABELS = [
  [S[1] + 3, S[1] + 8.2, () => [spec.panels[1], 50, -spec.depth], 'Solid backing in the wall', 80, -140],
  [S[2] + 8.5, S[3] - 0.2, () => [spec.panels[1], 60, -spec.depth], 'Panel line carried up the wall', 70, -110],
  [S[3] + 6.6, S[3] + 9.2, () => [PX + HOLE, 63.4, -spec.depth], 'Wall plug in the backing', 90, -150],
  [S[3] + 10.2, S[3] + 13.6, () => [PX + HOLE + 0.3, 65, -spec.depth + 0.2], 'U-bracket', 120, -140],
  [S[3] + 14.2, S[3] + 18, () => [PX, 64.6, -spec.depth + 1.2], 'Opening sized to the panel', -120, -150],
  [S[4] + 6.4, S[4] + 9.4, () => [pil(2).x + 1.4, 0.1, PLUG_Z], 'Floor plug', -70, -120],
  [S[4] + 10.2, S[4] + 13, () => [pil(2).x + pil(2).w - 1.4, 1.8, -T - 0.06], 'L-bracket on the pilaster line', 70, -120],
  [S[5] + 4, S[5] + 8.5, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Block holds the height', 90, -120],
  [S[6] + 6.8, S[6] + 8.6, () => [P2 - 3, spec.pil.y0 + DROP + SHOE_UP + 2, spec.shoeOver], 'Shoe held up for now', 70, -110],
  [S[6] + 9.6, S[6] + 11.2, () => [P2, spec.pil.y0 + DROP - 0.5, -T / 2], 'Leveling bolt in the foot', 80, -90],
  [S[6] + 14, S[6] + 18.4, () => [PX - HOLE, 64.6 + DROP, -T - 0.12], 'Pilot hole, stops short of the face', -80, -150],
  [S[7] + 1, S[7] + 4.3, () => [pil(3).x + pil(3).w / 2, spec.pil.y1, 0], 'Tops level with each other', 60, 110],
  [S[7] + 4.8, S[7] + 7.8, () => [pil(2).x + pil(2).w, 44, 0], 'Plumb both ways', 80, -100],
  [S[7] + 8.4, S[7] + 11.3, () => [(pil(1).x + pil(1).w + pil(2).x) / 2, 76, 0], 'Door opening to the drawings', 40, -100],
  [S[7] + 17, S[7] + 19.3, () => [PX - EAR, 64, -T - 1.1], 'Drilled through, bracket as the guide', -60, -140],
  [S[7] + 19.8, S[7] + 21, () => [PX - EAR - 0.1, 64, -T - 1.1], 'Barrel nut', -60, -140],
  [S[7] + 23.2, S[7] + 25, () => [PX + EAR + 0.1, 64, -T - 1.1], 'Screw from the other side', 60, -140],
  [S[7] + 26.4, S[7] + 28.8, () => [pil(2).x + 1.4, BOLT_Y, 0.1], 'Bolted to the floor bracket', 70, -110],
  [S[8] + 5.6, S[8] + 9.6, () => [P2, spec.pil.y1, 0.1], 'Headrail bracket', 70, -110],
  [S[8] + 16.8, S[8] + 19.6, () => [P2, spec.rail, 0.5], 'Screwed to every pilaster', 60, -110],
  [S[8] + 25.4, S[9] - 0.3, () => [RUN - 0.3, spec.rail, 1.5], 'and to the wall', -300, -110],
  [S[9] + 5, S[10] - 0.4, () => [pil(2).x + 3, 2, spec.shoeOver], 'Shoe screwed to the pilaster', 70, -120],
  [S[10] + 6.2, S[10] + 9.8, () => [spec.doors[0].x - 0.7, spec.hinge.tops[0] - 2, 0.2], 'Hinge half, bolted through', 80, -100],
  [S[10] + 13.2, S[10] + 16.4, () => [spec.doors[0].x + 1.3, spec.hinge.tops[0] - 2, 0.2], 'Other half on the door', 90, -110],
  [S[10] + 20.6, S[10] + 22.2, () => [spec.doors[0].x + spec.doors[0].w - 2.6, spec.latch.y, -1.1], 'Latch', -60, -120],
  [S[10] + 22.8, S[10] + 24.4, () => [spec.pilasters[1].x + 0.55, spec.latch.y, -T - 0.5], 'Keeper', 70, -120],
  [S[10] + 25.2, S[10] + 27, () => [spec.doors[0].x + spec.doors[0].w / 2, 65, -1.4], 'Coat hook', 70, -100],
  [S[10] + 28.9, S[10] + 31, () => [spec.doors[0].x + spec.doors[0].w - spec.pull.fromEdge + spec.pull.w / 2, spec.pull.top - 1, 1.4], 'Pull', 70, -100],
  [S[10] + 31.2, S[10] + 35, () => [spec.doors[0].x, spec.hinge.tops[0] - 2, 0.4], 'Hinges set the resting position', 70, -80],
  [S[10] + 36.6, S[11] - 0.3, () => [pil(2).x - 0.15, 46, 0.3], 'Even gaps', 70, -110],
  [S[11] + 2.4, S[11] + 6, () => [spec.doors[0].x + spec.doors[0].w - spec.latch.fromEdge, spec.latch.y, 0.6], 'Opens from outside in an emergency', 60, -110],
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
  const y1 = spec.pil.y1 + 0.4, pn = pil(spec.pilasters.length - 1)
  let r = win(t, S[7] + 0.6, S[7] + 4.4, 0.6, 0.4)
  if (r > 0) s += dashed([pil(0).x, y1, 0], [pn.x + pn.w, y1, 0], r, ease((t - S[7] - 0.6) / 1.4))
  r = win(t, S[7] + 4.4, S[7] + 8, 0.5, 0.4)
  if (r > 0) s += dashed([pil(2).x + pil(2).w + 0.2, y1, 0.2], [pil(2).x + pil(2).w + 0.2, 0.5, 0.2], r, ease((t - S[7] - 4.4) / 1.2))
  r = win(t, S[7] + 8, S[7] + 11.4, 0.5, 0.3)
  if (r > 0) {
    const a = project([pil(1).x + pil(1).w, 76, 0.3]), b = project([pil(2).x, 76, 0.3])
    s += `<g opacity="${r}" stroke="#fe7802" stroke-width="5" fill="#fe7802"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` +
      `<line x1="${a[0]}" y1="${a[1] - 22}" x2="${a[0]}" y2="${a[1] + 22}"/><line x1="${b[0]}" y1="${b[1] - 22}" x2="${b[0]}" y2="${b[1] + 22}"/></g>`
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
