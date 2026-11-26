// One still per guide step: the three.js restroom from design/render3d with only the parts installed so far,
// this step's parts tinted orange, optional layout marks on the floor and a see-through ceiling.
// render-shots.mjs calls window.shoot(state) and screenshots the canvas.
import * as THREE from 'three'
import { buildScene } from '/design/render3d/scene.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'

const ORANGE = new THREE.Color('#fe7802'), ORANGE_E = new THREE.Color('#a84800')
let renderer, camera, P

window.setupShots = ({ width, height, specs }) => {
  P = { width, height, specs }
  const c = document.getElementById('gl')
  renderer = new THREE.WebGLRenderer({ canvas: c, antialias: false, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1); renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  camera = new THREE.PerspectiveCamera(40, width / height, 2, 3000)
}

// state: { style, show: [parts], hi: [parts], cutaway: bool, marks: bool, cam: [pos, target, fov] }
window.shoot = (s) => {
  const spec = P.specs[s.style]
  const scene = buildScene({ spec, finish: 'cream', renderer, view: 'angle' })
  const show = new Set(s.show), hi = new Set(s.hi ?? [])
  if (show.has('shoe')) show.add('contact')
  scene.traverse((o) => {
    if (!o.isMesh || !o.userData.part) return
    const part = o.userData.part
    if (part === 'ceiling') {
      if (s.noCeiling) { o.visible = false; return }
      if (s.cutaway) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.12; o.material.depthWrite = false }
      return
    }
    if (part === 'downlight') { if (s.cutaway || s.noCeiling) o.visible = false; return }
    o.visible = show.has(part)
    if (hi.has(part) && o.material.emissive) {
      o.material = o.material.clone()
      o.material.color.copy(ORANGE); o.material.emissive.copy(ORANGE_E); o.material.emissiveIntensity = 1; if ('metalness' in o.material) { o.material.metalness = 0.1; o.material.roughness = 0.6 }
    }
  })
  if (s.marks) layoutMarks(scene, spec)
  const [pos, tgt, fov] = s.cam
  camera.position.set(...pos); camera.fov = fov; camera.aspect = P.width / P.height
  camera.updateProjectionMatrix(); camera.lookAt(...tgt)
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(1); composer.setSize(P.width, P.height)
  composer.addPass(new RenderPass(scene, camera))
  const ao = new GTAOPass(scene, camera, P.width, P.height)
  ao.updateGtaoMaterial({ radius: 14, distanceExponent: 1.4, thickness: 6, scale: 1.1, samples: 16 }); ao.blendIntensity = 0.85
  composer.addPass(ao); composer.addPass(new OutputPass()); composer.addPass(new SMAAPass(P.width, P.height))
  renderer.shadowMap.needsUpdate = true
  composer.render()
  scene.traverse((o) => o.geometry?.dispose?.())
  return true
}

// orange chalk lines on the floor: the pilaster line across the front, each dividing panel line to the back wall,
// and a box at every pilaster footprint
function layoutMarks(scene, spec) {
  const m = new THREE.MeshBasicMaterial({ color: '#fe7802', polygonOffset: true, polygonOffsetFactor: -4 })
  const strip = (x0, x1, z0, z1) => {
    const g = new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0))
    const s = new THREE.Mesh(g, m); s.rotation.x = -Math.PI / 2
    s.position.set((x0 + x1) / 2, 0.06, (z0 + z1) / 2); s.renderOrder = 4; scene.add(s)
  }
  const T = spec.pil.t, w = 0.6
  strip(0, spec.run, -T - w / 2, -T + w / 2)
  strip(0, spec.run, -w / 2, w / 2)
  for (const px of spec.panels) strip(px - w / 2, px + w / 2, -spec.depth, -T)
  for (const p of spec.pilasters) { strip(p.x, p.x + w, -T, 0); strip(p.x + p.w - w, p.x + p.w, -T, 0) }
}
window.__ready = true
