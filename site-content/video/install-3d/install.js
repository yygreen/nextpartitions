// Installation overview video, overhead braced: the guide's nine steps (design/install-guides/guides.mjs) played out
// in the three.js restroom from design/render3d. Parts appear in the guide's order; each step's parts glow orange.
// render.mjs calls window.frameAt(t) for every frame and screenshots the page. Units are inches.
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
const ORANGE = new THREE.Color('#fe7802'), ORANGE_E = new THREE.Color('#a84800')
const STYLE = 'overhead-braced'
const RUN = 168.5, MID = RUN / 2

// ---------- timeline: intro, nine steps, end card ----------
// [start, title, caption lines [t, text] relative to the step]
const STEPS = [
  [5, 'Check the room against the drawings', [[0.3, 'First, check the room against the approved drawings.']]],
  [10, 'Lay out the stalls', [[0.3, 'Mark the pilaster line and each panel line on the floor.']]],
  [17, 'Put up the wall brackets and panels', [[0.3, 'Fasten the wall brackets into solid backing.'], [4, 'Set the panels on temporary supports. Don\'t tighten yet.']]],
  [25, 'Stand the pilasters', [[0.3, 'Stand each pilaster on its floor hardware'], [3.6, 'and connect it to its panel.']]],
  [33, 'Plumb, level, then tighten', [[0.3, 'Get each pilaster plumb, with the tops level.'], [4, 'Set the door openings, then tighten.']]],
  [40, 'Fit the headrail', [[0.3, 'The headrail ties the pilaster tops to the wall.'], [4, 'Fasten it to every pilaster.']]],
  [47, 'Seat the shoes', [[0.3, 'Lower the shoes over the floor hardware and secure them.']]],
  [53, 'Hang the doors', [[0.3, 'Hang the doors and even out the gaps.'], [4.4, 'The accessible stall\'s door closes on its own.']]],
  [61, 'Check the finished run', [[0.3, 'Check every fixing, and test every door and latch.']]],
]
const END0 = 67, DURATION = 75
const S = Object.fromEntries(STEPS.map(([t], i) => [i + 1, t])) // step start times
export const CAPTIONS = [
  [0.4, 'Here is how overhead braced partitions go together.'],
  ...STEPS.flatMap(([t0, , c]) => c.map(([t, x]) => [t0 + t, x])),
  [END0 + 0.4, 'Always follow the manufacturer\'s instructions for your order.'],
]

// camera keys: [time, position, target, fov]; a smooth spline through them
const CAM = [
  [0, [MID + 40, 74, 300], [MID, 36, -22], 40],
  [5, [MID + 10, 86, 270], [MID, 0, -24], 40],
  [10, [MID + 5, 88, 255], [MID, 0, -26], 40],
  [15.5, [MID, 90, 240], [MID, 0, -28], 40],
  [19, [RUN + 20, 175, 125], [MID - 6, 8, -36], 40],
  [24, [RUN + 6, 168, 112], [MID - 6, 8, -36], 40],
  [27.5, [MID + 30, 64, 290], [MID, 50, -14], 40],
  [32, [MID + 18, 64, 272], [MID, 50, -14], 40],
  [35, [RUN * 0.66, 50, 178], [RUN * 0.6, 78, -4], 40],
  [39.5, [RUN * 0.56, 52, 186], [RUN * 0.5, 76, -4], 40],
  [42, [RUN * 0.28, 64, 205], [MID, 76, -10], 40],
  [46.5, [RUN * 0.36, 64, 214], [MID, 74, -10], 40],
  [49, [RUN * 0.66, 48, 178], [RUN * 0.6, 22, -4], 40],
  [52.5, [RUN * 0.6, 46, 170], [RUN * 0.55, 20, -4], 40],
  [55, [RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
  [60.5, [RUN * 0.42, 60, 168], [RUN * 0.3, 46, -4], 40],
  [63.5, [MID + 30, 64, 290], [MID, 50, -14], 40],
  [67, [MID + 12, 62, 264], [MID, 50, -14], 40],
  [75, [MID - 8, 62, 244], [MID, 48, -14], 40],
]

// when each part goes in: [start, stagger per idx]; how long it glows as "this step"
const IN = { panel: [S[3] + 3.6, 0.45], pilaster: [S[4] + 0.5, 0.45], shoe: [S[4] + 0.5, 0.45], rail: [S[6] + 0.4, 0], door: [S[8] + 0.5, 0.5], grab: [S[9] + 0.6, 0] }
const GLOW = { panel: [S[3] + 3.6, S[4]], pilaster: [S[4] + 0.5, S[5] - 0.2], rail: [S[6] + 0.4, S[7]], shoe: [S[7] + 0.2, S[8] - 0.3], door: [S[8] + 0.5, S[9] - 0.2], grab: [S[9] + 0.6, S[9] + 4.5] }
const SHOE_UP = 7, SHOE_DOWN = [S[7] + 0.6, 0.35] // shoes ride up on the pilaster until step 7

// ---------- camera spline (Catmull-Rom tangents over uneven times, zero speed at the ends) ----------
function spline(keys, t) {
  const n = keys.length
  if (t <= keys[0][0]) return keys[0]
  if (t >= keys[n - 1][0]) return keys[n - 1]
  let i = 0; while (keys[i + 1][0] < t) i++
  const [t0, t1] = [keys[i][0], keys[i + 1][0]], h = t1 - t0, u = (t - t0) / h
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2
  const tan = (j, get) => (j <= 0 || j >= n - 1 ? 0 : (get(keys[j + 1]) - get(keys[j - 1])) / (keys[j + 1][0] - keys[j - 1][0]))
  const comp = (get) => h00 * get(keys[i]) + h10 * h * tan(i, get) + h01 * get(keys[i + 1]) + h11 * h * tan(i + 1, get)
  return [t, [0, 1, 2].map((c) => comp((k) => k[1][c])), [0, 1, 2].map((c) => comp((k) => k[2][c])), comp((k) => k[3])]
}

// ---------- 3D ----------
let renderer, composer, camera, scene, tagged = [], marks = [], supports = [], spec, P = {}
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
  scene.traverse((o) => {
    if (!o.isMesh || !o.userData.part) return
    o.material = o.material.clone(); o.material.transparent = true
    o.userData.p0 = o.position.clone(); tagged.push(o)
  })
  addMarks(); addSupports()
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
  spec.panels.forEach((px, i) => strip(px - w / 2, px + w / 2, -T, -spec.depth, 'z', 1 + i * 0.4))
  spec.pilasters.forEach((p, i) => { strip(p.x, p.x + w, -T, 0, 'z', 2.4 + i * 0.15); strip(p.x + p.w - w, p.x + p.w, -T, 0, 'z', 2.4 + i * 0.15) })
}
// temporary supports: a wood block under each end of each panel until the pilasters are set and tightened
function addSupports() {
  const wood = new THREE.MeshStandardMaterial({ color: '#b98c5a', roughness: 0.85, transparent: true })
  const { y0, front, backGap } = spec.panel
  for (const px of spec.panels) for (const z of [-front - 6, -spec.depth + backGap + 6]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.5, y0, 3.5), wood)
    b.position.set(px, y0 / 2, z); b.castShadow = b.receiveShadow = true; scene.add(b); supports.push(b)
  }
}
let lastPose = ''
function pose(t) {
  let moving = false
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    let k = 1, dx = 0, dy = 0
    if (IN[part]) { const [s, st] = IN[part]; k = clamp((t - s - idx * st) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'rail') { const r = ease((t - IN.rail[0]) / 1.6); dx = -(1 - r) * (RUN + 260); k = t < IN.rail[0] ? 0 : 1; dy = 0 }
    if (part === 'shoe') dy += SHOE_UP * (1 - ease((t - SHOE_DOWN[0] - idx * SHOE_DOWN[1]) / 0.8))
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
    const g = GLOW[part]
    const gi = g ? clamp((t - g[0]) / 0.5) * clamp((g[1] - t) / 0.6) * 0.85 : 0
    if (m.emissive) {
      if (!o.userData.e0) { o.userData.e0 = m.emissive.clone(); o.userData.c0 = m.color.clone() }
      m.emissive.copy(o.userData.e0).lerp(ORANGE_E, Math.min(1, gi * 1.2)); m.color.copy(o.userData.c0).lerp(ORANGE, Math.min(1, gi * 1.3)); m.emissiveIntensity = 1
    }
  }
  // chalk lines draw on during step 2 and fade once the stalls are complete
  const mo = 1 - clamp((t - S[9]) / 1.5)
  for (const s of marks) {
    const { x0, x1, z0, z1, along, order } = s.userData
    const r = ease((t - S[2] - 0.6 - order * 1.1) / 1.4)
    const X1 = along === 'x' ? x0 + (x1 - x0) * r : x1, Z1 = along === 'z' ? z0 + (z1 - z0) * r : z1
    s.visible = r > 0.001 && mo > 0.01; s.material.opacity = mo
    s.scale.set(Math.max(0.01, Math.abs(X1 - x0)), Math.max(0.01, Math.abs(Z1 - z0)), 1)
    s.position.set((x0 + X1) / 2, 0.06, (z0 + Z1) / 2)
  }
  // supports go in with the panels and come out once everything is tightened
  supports.forEach((b, i) => {
    const a = clamp((t - S[3] - 3.0 - Math.floor(i / 2) * 0.45) / 0.5) * (1 - clamp((t - S[5] - 5.2) / 0.8))
    b.material.opacity = a; b.visible = a > 0.01
  })
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
// callouts pinned to 3D points: [from, to, point, text, dx, dy]
const LABELS = [
  [S[3] + 4.6, S[4] - 0.3, () => [spec.panels[1], spec.panel.y0 * 0.5, -spec.panel.front - 6], 'Temporary support', 90, -120],
  [S[5] + 0.8, S[6] - 0.4, () => [spec.pilasters[3].x + spec.pilasters[3].w / 2, spec.pil.y1, 0], 'Tops level with each other', 60, 110],
]
function label(i, [a, b, at, text, dx, dy], t) {
  const el = document.getElementById('l' + i)
  const r = clamp((t - a) / 0.4) * clamp((b - t) / 0.3)
  if (r <= 0) { el.style.opacity = 0; return '' }
  const [x, y] = project(at())
  el.textContent = text; el.style.opacity = r
  const w = el.offsetWidth, h = el.offsetHeight, bx = x + dx, by = y + dy
  const left = Math.max(30, Math.min(P.width - w - 30, bx - (dx < 0 ? w : 0)))
  el.style.left = left + 'px'; el.style.top = by - h / 2 + 'px'
  const ex = Math.max(left, Math.min(left + w, x)), ey = by + (y > by ? h / 2 : -h / 2)
  return `<g opacity="${r}"><line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#fe7802" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${18 * r}" fill="none" stroke="#fe7802" stroke-width="5"/></g>`
}
// step 5: a dashed level line across the pilaster tops
function levelLine(t) {
  const r = clamp((t - S[5] - 0.6) / 0.6) * clamp((S[6] - 0.4 - t) / 0.4)
  if (r <= 0) return ''
  const p0 = spec.pilasters[0], pn = spec.pilasters.at(-1)
  const [x0, y0] = project([p0.x, spec.pil.y1 + 0.4, 0]), [x1, y1] = project([pn.x + pn.w, spec.pil.y1 + 0.4, 0])
  const d = ease((t - S[5] - 0.6) / 1.2)
  return `<line x1="${x0}" y1="${y0}" x2="${x0 + (x1 - x0) * d}" y2="${y0 + (y1 - y0) * d}" stroke="#fe7802" stroke-width="5" stroke-dasharray="18 12" opacity="${r}"/>`
}

window.frameAt = function (t) {
  aim(t); pose(t); composer.render()
  ov.innerHTML = LABELS.map((l, i) => label(i, l, t)).join('') + levelLine(t)
  // intro title
  hookEl.style.opacity = clamp((S[1] - t) / 0.7)
  $('#hook .txt').style.opacity = clamp((t - 0.3) / 0.8) * clamp((S[1] - 0.2 - t) / 0.5)
  // step card
  const si = STEPS.findLastIndex(([s]) => t >= s), inStep = si >= 0 && t < END0
  if (inStep) {
    const [s0] = STEPS[si], s1 = si + 1 < STEPS.length ? STEPS[si + 1][0] : END0
    stepEl.style.opacity = clamp((t - s0) / 0.4) * clamp((s1 - t) / 0.3)
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
