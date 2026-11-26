// The animated mounting-styles video: the three.js restroom from design/render3d, animated shot by shot, with an
// HTML overlay (labels pinned to 3D points, style card, captions). render.mjs calls window.frameAt(t) for every frame
// and screenshots the page. Units are inches (see design/render3d/scene.js for the axes).
import * as THREE from 'three'
import { buildScene } from '/design/render3d/scene.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'

const clamp = (x) => Math.max(0, Math.min(1, x))
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const ORANGE = new THREE.Color('#fe7802'), ORANGE_E = new THREE.Color('#a84800')
const STYLES = ['overhead-braced', 'floor-mounted', 'ceiling-hung', 'floor-to-ceiling']
const NAMES = { 'overhead-braced': 'Overhead braced', 'floor-mounted': 'Floor mounted', 'ceiling-hung': 'Ceiling hung', 'floor-to-ceiling': 'Floor to ceiling' }
const RUN = 168.5, MID = RUN / 2

// ---------- timeline ----------
// Each style shot is 11 s: build (0-3.5), how it's held (3.5-7.5), what it's best for (7.5-11).
// cam keys: [time, position, target, vertical fov]; the path is a smooth spline through them.
const STYLE_SHOTS = {
  'overhead-braced': {
    held: 'Floor anchors and a headrail', best: 'Most restrooms',
    say: [[0, 'Overhead braced is the most common.'], [3.5, 'A headrail ties the pilaster tops to the walls.'], [7.5, 'Nothing is needed above the ceiling.']],
    cam: [[0, [MID + 30, 64, 290], [MID, 50, -14], 40], [5.5, [RUN * 0.28, 64, 205], [MID, 76, -10], 40], [11, [MID - 10, 66, 262], [MID, 64, -14], 40]],
    labels: [{ t: [4.6, 7.4], at: [RUN * 0.4, 83.5, 0.5], text: 'Headrail ties the tops to the walls', dx: 40, dy: -150 },
      { t: [8.1, 11], at: [MID, 95, -20], text: 'Nothing needed above the ceiling', dx: 120, dy: 90, noRing: true }],
    glow: { rail: [4.4, 11] },
  },
  'floor-mounted': {
    held: 'Floor anchors only', best: 'An open look and high ceilings',
    say: [[0, 'Floor mounted partitions drop the headrail.'], [3.5, 'Each pilaster is bolted into a structural concrete floor.'], [7.5, 'The space above the stalls stays open.']],
    cam: [[0, [MID - 30, 64, 290], [MID, 46, -14], 40], [5.5, [RUN * 0.7, 32, 150], [MID, 14, -6], 40], [11, [RUN * 0.78, 64, 250], [MID, 62, -14], 40]],
    labels: [{ t: [4.4, 7.4], at: [RUN * 0.45, 2, 0.8], text: 'Bolted into a concrete floor', dx: 90, dy: -170, pick: 'shoe' },
      { t: [8.2, 11], at: [MID, 84, -10], text: 'Open above: no headrail', dx: 60, dy: -150, noRing: true }],
    glow: { shoe: [4, 7.6] },
  },
  'ceiling-hung': {
    held: 'Steel above the ceiling', best: 'A clear floor that\'s easy to clean',
    say: [[0, 'Ceiling hung partitions hang from steel above the ceiling.'], [3.5, 'The steel has to be engineered to carry them.'], [7.5, 'Nothing touches the floor, so cleaning is fast.']],
    cam: [[0, [MID + 30, 64, 290], [MID, 52, -14], 40], [5.5, [MID + 10, 60, 215], [MID, 88, -10], 40], [9, [RUN * 0.32, 28, 205], [RUN * 0.56, 10, -10], 40], [11, [RUN * 0.4, 26, 198], [RUN * 0.62, 10, -10], 40]],
    labels: [{ t: [4.6, 7.4], at: [MID, 103.5, 0], text: 'Hung from structural steel', dx: 80, dy: -110 },
      { t: [8.6, 11], at: [RUN * 0.62, 2, 4], text: 'Nothing touches the floor', dx: 40, dy: -170, noRing: true }],
    glow: { steel: [4.2, 7.6], rod: [4.2, 7.6], sleeve: [4.2, 7.6] },
    cutaway: [3.6, 4.6, 7.4, 8.2],
  },
  'floor-to-ceiling': {
    held: 'Floor and ceiling anchors', best: 'Heavy use, such as schools',
    say: [[0, 'Floor to ceiling partitions are anchored at both ends.'], [3.5, 'Every pilaster goes into the floor and into the ceiling.'], [7.5, 'It\'s the sturdiest choice for heavy use, like schools.']],
    cam: [[0, [MID - 30, 64, 290], [MID, 48, -14], 40], [4.5, [RUN * 0.66, 48, 178], [RUN * 0.6, 22, -4], 40], [7, [RUN * 0.66, 50, 178], [RUN * 0.6, 78, -4], 40], [11, [RUN * 0.82, 60, 255], [MID, 50, -14], 40]],
    labels: [{ t: [3.9, 7.6], at: [RUN * 0.6, 2, 0.8], text: 'Anchored to the floor', dx: 90, dy: -110, pick: 'shoe' },
      { t: [5.2, 7.6], at: [RUN * 0.6, 94, 0.8], text: 'and to the ceiling', dx: 60, dy: 70, pick: 'cshoe' }],
    glow: { shoe: [3.8, 7.6], cshoe: [3.8, 7.6] },
  },
}
// a calm opening shot, the four styles one after another, a side-by-side recap and the end card
const HOOK = 6, PER = 11, RECAP = 5, END = 5
const SHOTS = []
let T0 = 0
SHOTS.push({ kind: 'hook', style: 'floor-to-ceiling', start: 0, dur: HOOK, cam: [[0, [RUN + 46, 62, 250], [MID, 50, -14], 40], [HOOK, [RUN + 14, 60, 222], [MID, 48, -14], 40]] })
T0 = HOOK
STYLES.forEach((style, i) => { SHOTS.push({ kind: 'style', style, num: i + 1, start: T0, dur: PER, ...STYLE_SHOTS[style] }); T0 += PER })
SHOTS.push({ kind: 'recap', start: T0, dur: RECAP }); T0 += RECAP
SHOTS.push({ kind: 'end', style: 'floor-to-ceiling', start: T0, dur: END, cam: [[0, [RUN + 40, 62, 230], [MID, 48, -14], 40], [END, [RUN + 10, 60, 205], [MID, 48, -14], 40]] }); T0 += END
export const DURATION = T0
export const CAPTIONS = [
  [0.3, 'Toilet partitions are mounted one of four ways.'], [3.6, 'Here is how each one works.'],
  ...SHOTS.filter((s) => s.kind === 'style').flatMap((s) => s.say.map(([t, x]) => [s.start + t, x])),
  [HOOK + 4 * PER, 'Here are all four, side by side.'],
  [HOOK + 4 * PER + RECAP, 'Send us your style, material and stall count, and we\'ll quote it.'],
]

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
let renderer, composer, ao, camera, scene = null, sceneStyle = null, tagged = [], P = {}
const CANVAS = document.getElementById('gl')
export function setup({ specs, width, height, dpr, gl = 1 }) {
  P = { specs, width, height, dpr, gl, vertical: height > width }
  renderer = new THREE.WebGLRenderer({ canvas: CANVAS, antialias: false, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1); renderer.setSize(width * gl, height * gl, false) // the 3D layer renders at page size; the overlay text gets the full device scale
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false
  camera = new THREE.PerspectiveCamera(40, width / height, 2, 3000)
}
function useStyle(style) {
  if (sceneStyle === style) return
  if (scene) scene.traverse((o) => { o.geometry?.dispose?.() })
  scene = buildScene({ spec: P.specs[style], finish: 'cream', renderer, view: 'angle' })
  sceneStyle = style
  if (location.search.includes('spotns')) scene.traverse((o) => { if (o.isSpotLight) o.castShadow = false })
  if (location.search.includes('pcf')) renderer.shadowMap.type = THREE.PCFShadowMap
  // every tagged part gets its own material, so it can fade in and glow on its own
  tagged = []
  scene.traverse((o) => {
    if (!o.isMesh || !o.userData.part) return
    o.material = o.material.clone(); o.material.transparent = true
    o.userData.p0 = o.position.clone(); tagged.push(o)
  })
  const W = P.width * P.gl, H = P.height * P.gl
  composer = new EffectComposer(renderer)
  composer.setPixelRatio(1); composer.setSize(W, H)
  composer.addPass(new RenderPass(scene, camera))
  ao = new GTAOPass(scene, camera, W, H)
  ao.updateGtaoMaterial({ radius: 14, distanceExponent: 1.4, thickness: 6, scale: 1.1, samples: 16 })
  ao.blendIntensity = 0.85
  if (!location.search.includes('noao')) composer.addPass(ao)
  composer.addPass(new OutputPass())
  if (!location.search.includes('nosmaa')) composer.addPass(new SMAAPass(W, H))
  renderer.shadowMap.needsUpdate = true
}
// build order: pilasters (with their shoes and hangers), then the dividing panels, then the doors
const BUILD = { pilaster: [0.2, 0.24], shoe: [0.2, 0.24], cshoe: [0.2, 0.24], sleeve: [0.2, 0.24], rod: [0.2, 0.24], contact: [0.2, 0.24], panel: [1.25, 0.24], grab: [1.25, 0], door: [1.9, 0.24] }
let lastPose = ''
function pose(shot, lt) {
  const built = shot.kind !== 'style'
  let moving = false
  for (const o of tagged) {
    const { part, idx } = o.userData, m = o.material
    let k = 1, dx = 0, dy = 0
    if (!built && BUILD[part]) { const [s, step] = BUILD[part]; k = clamp((lt - s - idx * step) / 0.75); dy = (1 - easeOut(k)) * 22 }
    if (part === 'rail' && !built) { const r = easeOut((lt - 3.6) / 1.2); dx = -(1 - r) * (RUN + 260); k = lt < 3.6 ? 0 : 1 }
    if (part === 'ceiling' || part === 'downlight') {
      const c = shot.cutaway
      k = c ? 1 - clamp((lt - c[0]) / (c[1] - c[0])) + clamp((lt - c[2]) / (c[3] - c[2])) : 1
      if (part === 'ceiling') { m.opacity = 0.12 + 0.88 * k; m.depthWrite = k > 0.99; o.visible = true; continue }
    }
    m.opacity = part === 'contact' ? 0.7 * (k >= 1 ? 1 : 0) : clamp(k * 1.4)
    o.visible = m.opacity > 0.01
    o.position.set(o.userData.p0.x + dx, o.userData.p0.y + dy, o.userData.p0.z)
    if (dx || dy) moving = true
    // glow: an orange tint that pulses gently while the part is the subject
    const g = shot.glow?.[part]
    let gi = 0
    if (g && !built) gi = clamp((lt - g[0]) / 0.5) * clamp((g[1] - lt) / 0.5) * (0.7 + 0.2 * Math.sin((lt - g[0]) * 5))
    if (m.emissive) { if (!o.userData.e0) { o.userData.e0 = m.emissive.clone(); o.userData.c0 = m.color.clone() }
      m.emissive.copy(o.userData.e0).lerp(ORANGE_E, Math.min(1, gi * 1.2)); m.color.copy(o.userData.c0).lerp(ORANGE, Math.min(1, gi * 1.3)); m.emissiveIntensity = 1 }
  }
  const key = tagged.map((o) => o.visible ? o.position.y.toFixed(2) + o.position.x.toFixed(1) : 'h').join()
  if (moving || key !== lastPose) renderer.shadowMap.needsUpdate = true
  lastPose = key
}
function aim(keys, lt) {
  const [, p, tg, fov] = spline(keys, lt)
  camera.position.set(...p)
  if (P.vertical) {
    // vertical cut: keep about 80% of the landscape's horizontal view, from a little further back
    const hf = 2 * Math.atan(Math.tan((fov * Math.PI) / 360) * (16 / 9) * 0.8)
    camera.fov = (2 * Math.atan(Math.tan(hf / 2) / (P.width / P.height)) * 180) / Math.PI
  } else camera.fov = fov
  camera.aspect = P.width / P.height
  camera.updateProjectionMatrix()
  camera.lookAt(...tg)
}
function project(v) {
  const p = new THREE.Vector3(...v).project(camera)
  return [((p.x + 1) / 2) * P.width, ((1 - p.y) / 2) * P.height, p.z < 1]
}

// ---------- overlay ----------
const $ = (s) => document.querySelector(s)
const ov = $('#ov'), cap = $('#cap span'), card = $('#card'), hookEl = $('#hook'), recap = $('#recap'), endEl = $('#end'), dots = [...document.querySelectorAll('#dots i')]
function label(i, l, lt) {
  const el = document.getElementById('l' + i)
  const r = clamp((lt - l.t[0]) / 0.4) * clamp((l.t[1] - lt) / 0.3)
  if (r <= 0) { el.style.opacity = 0; return '' }
  const [x, y] = project(l.at), v = P.vertical, s = v ? 0.8 : 1
  const bx = x + l.dx * s, by = y + l.dy * s
  el.textContent = l.text; el.style.opacity = r
  const w = el.offsetWidth, h = el.offsetHeight
  const left = Math.max(30, Math.min(P.width - w - 30, bx - (l.dx < 0 ? w : 0)))
  el.style.left = left + 'px'; el.style.top = by - h / 2 + 'px'
  const ex = Math.max(left, Math.min(left + w, x)), ey = by + (y > by ? h / 2 : -h / 2)
  return `<g opacity="${r}"><line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#fe7802" stroke-width="4"/>${l.noRing ? `<circle cx="${x}" cy="${y}" r="7" fill="#fe7802"/>` : `<circle cx="${x}" cy="${y}" r="${18 * r}" fill="none" stroke="#fe7802" stroke-width="5"/>`}</g>`
}
window.frameAt = function (t) {
  const shot = SHOTS.find((s) => t >= s.start && t < s.start + s.dur) ?? SHOTS.at(-1)
  const lt = t - shot.start
  const is3d = shot.kind !== 'recap'
  CANVAS.style.visibility = is3d ? 'visible' : 'hidden'
  let svg = ''
  if (is3d) {
    useStyle(shot.style)
    pose(shot, lt)
    aim(shot.cam, lt)
    composer.render()
    if (shot.labels) svg = shot.labels.map((l, i) => label(i, l, lt)).join('')
  }
  for (let i = 0; i < 3; i++) if (!shot.labels || !shot.labels[i]) document.getElementById('l' + i).style.opacity = 0
  ov.innerHTML = svg
  // hook
  hookEl.style.opacity = shot.kind === 'hook' ? clamp((HOOK - t) / 0.6) : 0
  if (shot.kind === 'hook') {
    $('#hook .txt').style.opacity = clamp((t - 0.3) / 0.8) * clamp((HOOK - t) / 0.5)
  }
  // style card
  const st = shot.kind === 'style'
  card.style.opacity = st ? clamp(lt / 0.4) * clamp((shot.dur - lt) / 0.3) : 0
  if (st) {
    card.querySelector('.num').textContent = shot.num
    card.querySelector('h2').textContent = NAMES[shot.style]
    const rows = card.querySelectorAll('.row')
    rows[0].querySelector('b').textContent = shot.held; rows[1].querySelector('b').textContent = shot.best
    rows.forEach((r, j) => { const a = clamp((lt - [3.5, 7.5][j]) / 0.5); r.style.opacity = a; r.style.maxHeight = (a * 140) + 'px'; r.style.marginTop = (a * 16) + 'px'; r.style.paddingTop = (a * 12) + 'px' })
  }
  dots.forEach((d, j) => (d.className = st && shot.num === j + 1 ? 'on' : ''))
  $('#dots').style.opacity = st ? 1 : 0
  // recap
  recap.style.opacity = shot.kind === 'recap' ? clamp(lt / 0.4) : 0
  if (shot.kind === 'recap') recap.querySelectorAll('.tile').forEach((el, j) => {
    const a = easeOut((lt - 0.15 - j * 0.3) / 0.6); el.style.opacity = a
    el.style.transform = `translateY(${30 * (1 - a)}px)`
    el.querySelector('img').style.transform = `scale(${1.04 + 0.05 * (lt / RECAP)})`
  })
  // end
  endEl.style.opacity = shot.kind === 'end' ? clamp(lt / 0.5) : 0
  endEl.querySelectorAll('.e').forEach((el, j) => { const a = easeOut((lt - 0.3 - j * 0.3) / 0.6); el.style.opacity = a; el.style.transform = `translateY(${20 * (1 - a)}px)` })
  $('#brand').style.opacity = shot.kind === 'end' ? 0 : 1
  $('#brand').style.color = shot.kind === 'hook' ? '#fbfaf9' : '#1c0e05'
  // captions
  let c = CAPTIONS[0]; for (const x of CAPTIONS) if (t >= x[0]) c = x
  cap.textContent = c[1]
  cap.parentElement.style.opacity = clamp((t - c[0]) / 0.25)
  return true
}
window.DURATION = DURATION
window.setupFilm = setup
window.__ready = true
