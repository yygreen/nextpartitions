// Scene builder: two standard toilet compartments between side walls, in inches (1 unit = 1").
// Axes: x along the row from the left wall's face, y up from the finished floor, z toward the viewer with the
// pilaster faces at z = 0 and the back wall at z = -depth. All partition dimensions arrive in `spec`
// (see dims.mjs: they are read from design/diagrams.mjs), so nothing here hard-codes a partition size.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export const FINISHES = {
  cream: { color: '#e6dcb6', roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.32 },
  bluegrey: { color: '#7d8a97', roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.32 },
  stainless: { stainless: true },
}

// front: floor depth in front of the pilasters (24k - depth, so tile joints meet the back wall); out: restroom width
// beyond each alcove wall (a multiple of 24); ret: how far the alcove walls return in front of the pilaster faces
const ROOM = { front: 418.75, out: 120, ret: 2, wall: '#acb8ad', tile: 24 }

// ---------- procedural textures (canvas, no image files) ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
// seeded noise so every render is identical
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

function floorTextures() {
  const px = 1024, n = 4 // 4 x 4 tiles per texture repeat
  const map = canvasTex(px, px, (g) => {
    const s = px / n
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = (rnd() - 0.5) * 10
      g.fillStyle = `rgb(${212 + v},${194 + v},${165 + v * 0.8})`
      g.fillRect(i * s, j * s, s, s)
      // faint stone mottling
      for (let k = 0; k < 220; k++) {
        const a = rnd() * 0.05
        g.fillStyle = rnd() > 0.5 ? `rgba(255,248,232,${a})` : `rgba(150,125,95,${a})`
        const r = 4 + rnd() * 26
        g.beginPath(); g.ellipse(i * s + rnd() * s, j * s + rnd() * s, r, r * (0.4 + rnd()), rnd() * 3, 0, 7); g.fill()
      }
    }
    g.strokeStyle = 'rgb(188,170,142)'; g.lineWidth = 3
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, px); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(px, i * s); g.stroke() }
  })
  const rough = canvasTex(px, px, (g) => {
    const s = px / n
    g.fillStyle = 'rgb(95,95,95)'; g.fillRect(0, 0, px, px)
    g.strokeStyle = 'rgb(235,235,235)'; g.lineWidth = 4
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, px); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(px, i * s); g.stroke() }
  }, false)
  for (const t of [map, rough]) { t.wrapS = t.wrapT = THREE.RepeatWrapping }
  return { map, rough }
}

// brushed stainless: fine vertical streaks
function brushed(vertical = true) {
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, w, h)
    for (let k = 0; k < 2600; k++) {
      const v = 100 + rnd() * 70
      g.fillStyle = `rgba(${v},${v},${v},0.35)`
      const x = rnd() * w
      g.fillRect(x, rnd() * h - 200, 0.6 + rnd() * 1.2, 120 + rnd() * 380)
    }
  }, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (!vertical) t.rotation = Math.PI / 2
  return t
}

// soft radial blob (contact shadow)
function blobTex() {
  return canvasTex(256, 256, (g) => {
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    r.addColorStop(0, 'rgba(0,0,0,0.55)'); r.addColorStop(0.45, 'rgba(0,0,0,0.28)'); r.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = r; g.fillRect(0, 0, 256, 256)
  }, false)
}
// linear falloff (corner occlusion strip): dark at v = 0
function rampTex() {
  return canvasTex(8, 256, (g) => {
    const r = g.createLinearGradient(0, 256, 0, 0)
    r.addColorStop(0, 'rgba(0,0,0,0.5)'); r.addColorStop(0.25, 'rgba(0,0,0,0.18)'); r.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = r; g.fillRect(0, 0, 8, 256)
  }, false)
}

// ---------- helpers ----------
// a box by its min/max corners (inches)
function box(mat, x0, x1, y0, y1, z0, z1, r = 0) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999) : new THREE.BoxGeometry(w, h, d)
  const m = new THREE.Mesh(geo, mat)
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  m.castShadow = m.receiveShadow = true
  return m
}

function materials(finish) {
  const f = FINISHES[finish] ?? FINISHES.cream
  const brush = brushed()
  const stainless = new THREE.MeshPhysicalMaterial({ color: '#d6d9dd', metalness: 1, roughness: 0.28, roughnessMap: brush, envMapIntensity: 1.6 })
  const panel = f.stainless
    ? new THREE.MeshPhysicalMaterial({ color: '#c3c6ca', metalness: 1, roughness: 0.34, roughnessMap: brush, envMapIntensity: 1.15 })
    : new THREE.MeshPhysicalMaterial({ color: f.color, roughness: f.roughness, clearcoat: f.clearcoat, clearcoatRoughness: f.clearcoatRoughness, envMapIntensity: 0.9 })
  return {
    panel,
    stainless,
    chrome: new THREE.MeshPhysicalMaterial({ color: '#f4f6f8', metalness: 1, roughness: 0.16, envMapIntensity: 2.2 }),
    alu: new THREE.MeshPhysicalMaterial({ color: '#cfd2d4', metalness: 0.9, roughness: 0.4 }),
    porcelain: new THREE.MeshPhysicalMaterial({ color: '#f6f6f3', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 }),
    seat: new THREE.MeshPhysicalMaterial({ color: '#fbfbf9', roughness: 0.3, clearcoat: 0.5 }),
    wall: new THREE.MeshStandardMaterial({ color: ROOM.wall, roughness: 0.92, envMapIntensity: 0.45 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#f1f1ee', roughness: 0.95, envMapIntensity: 0.5, emissive: '#8e8d88' }), // lit by bounce, not modelled
    trim: new THREE.MeshStandardMaterial({ color: '#d9dbd8', roughness: 0.5, metalness: 0.2 }),
    lamp: new THREE.MeshBasicMaterial({ color: '#fffaf0' }),
    dark: new THREE.MeshStandardMaterial({ color: '#2b2b2b', roughness: 0.6 }),
  }
}

// ---------- the room ----------
// The two compartments fill an alcove (side walls at x = 0 and x = run, returning ROOM.ret" in front of the pilaster
// faces); in front of it the restroom is wider, so the angle view has room to stand off to the entry side.
function room(scene, spec, M, open = false) {
  const { run, depth, ceiling } = spec
  const F = ROOM.front, O = ROOM.out, A = ROOM.ret
  const { map, rough } = floorTextures()
  const W = run + 2 * O, D = depth + F
  // 24" tiles, grout lines on the alcove's left wall (O is a multiple of 24) and on the back wall (F + depth too)
  map.repeat.set(W / (ROOM.tile * 4), D / (ROOM.tile * 4)); rough.repeat.copy(map.repeat)
  const floorMat = new THREE.MeshPhysicalMaterial({ map, roughnessMap: rough, roughness: 1, color: '#ffffff', clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.5 })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat)
  floor.rotation.x = -Math.PI / 2; floor.position.set(run / 2, 0, (F - depth) / 2); floor.receiveShadow = true
  scene.add(floor)
  const wallBox = (x0, x1, y0, y1, z0, z1, mat = M.wall) => { const b = box(mat, x0, x1, y0, y1, z0, z1); scene.add(b); return b }
  const top = ceiling + 30
  wallBox(-O - 6, run + O + 6, -1, top, -depth - 6, -depth) // back wall
  wallBox(-O, 0, -1, top, -depth - 6, A)                     // left of the alcove
  // right of the alcove; `open` (the angle view) leaves the row's right end free so its end panel shows
  if (!open) wallBox(run, run + O, -1, top, -depth - 6, A)
  wallBox(-O - 6, -O, -1, top, -depth, F)                    // restroom side walls
  wallBox(run + O, run + O + 6, -1, top, -depth, F)
  wallBox(-O - 6, run + O + 6, -1, top, F, F + 6)            // behind the camera
  const ceil = box(M.ceiling, -O - 6, run + O + 6, ceiling, ceiling + 2, -depth - 6, F + 6)
  ceil.castShadow = false
  scene.add(ceil)
  // painted base along the walls
  const base = new THREE.MeshStandardMaterial({ color: '#97a399', roughness: 0.8 })
  wallBox(0, run, 0, 4, -depth, -depth + 0.4, base)
  wallBox(0, 0.4, 0, 4, -depth, A, base)
  if (!open) wallBox(run - 0.4, run, 0, 4, -depth, A, base)
  wallBox(-O, 0.4, 0, 4, A, A + 0.4, base)
  if (!open) wallBox(run - 0.4, run + O, 0, 4, A, A + 0.4, base)
  else wallBox(run, run + O, 0, 4, -depth, -depth + 0.4, base)
  // corner occlusion: soft ramps where the floor meets the walls
  const ramp = rampTex()
  const strip = (w, h, pos, rot, op = 1, tex = ramp) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), occMat(tex, op)); m.position.copy(pos); m.rotation.copy(rot); m.renderOrder = 2; scene.add(m) }
  const floorAlong = (x0, x1, zWall) => strip(x1 - x0, 10, new THREE.Vector3((x0 + x1) / 2, 0.02, zWall + 5), new THREE.Euler(-Math.PI / 2, 0, Math.PI))
  const wallAlong = (x0, x1, zWall) => strip(x1 - x0, 10, new THREE.Vector3((x0 + x1) / 2, 5, zWall + 0.45), new THREE.Euler(0, 0, 0), 0.55)
  floorAlong(0, run, -depth); wallAlong(0, run, -depth)
  floorAlong(-O, 0, A); wallAlong(-O, 0, A); if (open) { floorAlong(run, run + O, -depth); wallAlong(run, run + O, -depth) } else { floorAlong(run, run + O, A); wallAlong(run, run + O, A) }
  strip(run, 8, new THREE.Vector3(run / 2, ceiling - 4, -depth + 0.02), new THREE.Euler(0, 0, Math.PI), 0.3)
  for (const [x, ry] of [[0.45, Math.PI / 2], ...(open ? [] : [[run - 0.45, -Math.PI / 2]])]) {
    strip(depth + A, 10, new THREE.Vector3(x, 5, (A - depth) / 2), new THREE.Euler(0, ry, 0))
    strip(depth + A, 8, new THREE.Vector3(x, ceiling - 4, (A - depth) / 2), new THREE.Euler(0, ry, Math.PI), 0.3)
  }
  for (const x of open ? [5] : [5, run - 5]) strip(10, depth + A, new THREE.Vector3(x, 0.02, (A - depth) / 2), new THREE.Euler(-Math.PI / 2, 0, 0), 1, rampH(x < run / 2))
  // the compartments enclose the floor under them: a faint shade along the partition line
  strip(run, 26, new THREE.Vector3(run / 2, 0.025, -6), new THREE.Euler(-Math.PI / 2, 0, 0), 0.22, blobTex())
}
const occMat = (map, opacity = 1) => new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, color: '#000000', polygonOffset: true, polygonOffsetFactor: -2 })
// horizontal ramp for the floor strips along the side walls (dark at the wall side)
function rampH(darkLeft) {
  return canvasTex(256, 8, (g) => {
    const r = darkLeft ? g.createLinearGradient(0, 0, 256, 0) : g.createLinearGradient(256, 0, 0, 0)
    r.addColorStop(0, 'rgba(0,0,0,0.5)'); r.addColorStop(0.25, 'rgba(0,0,0,0.18)'); r.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = r; g.fillRect(0, 0, 256, 8)
  }, false)
}

// recessed downlight: trim ring and a glowing lens, flush with the ceiling
function downlight(scene, M, x, z, ceiling) {
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.25, 48), M.trim)
  ring.position.set(x, ceiling - 0.1, z); scene.add(ring)
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.3, 48), M.lamp)
  lens.position.set(x, ceiling - 0.12, z); scene.add(lens)
}

// ---------- toilets ----------
function toilet(scene, M, cx, depth) {
  const g = new THREE.Group()
  const wallZ = -depth
  // pedestal: a lathe, stretched front to back
  const ped = new THREE.LatheGeometry([
    [5.0, 0], [4.9, 0.5], [4.4, 1.8], [4.1, 5], [4.3, 8.5], [5.0, 10.6], [5.9, 12.2], [0, 12.2],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 64)
  const pm = new THREE.Mesh(ped, M.porcelain); pm.scale.set(1, 1, 1.7); pm.position.set(cx, 0, wallZ + 15); pm.castShadow = pm.receiveShadow = true
  g.add(pm)
  // bowl: elongated, rim at 15"
  const bowl = new THREE.LatheGeometry([
    [0, 10.8], [5.2, 11.2], [6.9, 12.8], [7.4, 14.3], [7.3, 14.9], [6.6, 15.05], [5.4, 14.6], [0, 11.6],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 72)
  const bm = new THREE.Mesh(bowl, M.porcelain); bm.scale.set(1, 1, 1.38); bm.position.set(cx, 0, wallZ + 18); bm.castShadow = bm.receiveShadow = true
  g.add(bm)
  // back of the bowl, to the wall (commercial floor-mount with a flush valve)
  const back = box(M.porcelain, cx - 6.2, cx + 6.2, 10.5, 15, wallZ + 1, wallZ + 10, 2.4); g.add(back)
  // open-front seat
  const seatShape = new THREE.Shape()
  seatShape.absellipse(0, 0, 7.6, 9.9, 0, Math.PI * 2, false)
  const hole = new THREE.Path(); hole.absellipse(0, -0.6, 4.9, 6.9, 0, Math.PI * 2, true); seatShape.holes.push(hole)
  const seatGeo = new THREE.ExtrudeGeometry(seatShape, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.3, bevelSegments: 3, curveSegments: 64 })
  const seat = new THREE.Mesh(seatGeo, M.seat); seat.rotation.x = -Math.PI / 2; seat.position.set(cx, 15.05, wallZ + 18.6)
  seat.castShadow = seat.receiveShadow = true
  g.add(seat)
  // flush valve: supply from the wall, valve body, vacuum breaker tube down to the spud
  const pipe = (r, len) => new THREE.CylinderGeometry(r, r, len, 32)
  const v = new THREE.Mesh(pipe(0.55, 11), M.chrome); v.position.set(cx, 21.5, wallZ + 4.5); g.add(v)
  const body = new THREE.Mesh(pipe(1.25, 4.5), M.chrome); body.position.set(cx, 28.5, wallZ + 4.5); g.add(body)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.chrome); cap.position.set(cx, 30.75, wallZ + 4.5); g.add(cap)
  const sup = new THREE.Mesh(pipe(0.45, 4.5), M.chrome); sup.rotation.x = Math.PI / 2; sup.position.set(cx - 2.6, 28, wallZ + 2.25); g.add(sup)
  const sh = new THREE.Mesh(pipe(0.45, 2.6), M.chrome); sh.rotation.z = Math.PI / 2; sh.position.set(cx - 1.3, 28, wallZ + 4.5); g.add(sh)
  const handle = new THREE.Mesh(pipe(0.22, 3.6), M.chrome); handle.rotation.z = Math.PI / 2.4; handle.position.set(cx + 2.4, 27.4, wallZ + 4.5); g.add(handle)
  const esc = new THREE.Mesh(pipe(1.4, 0.3), M.chrome); esc.rotation.x = Math.PI / 2; esc.position.set(cx - 2.6, 28, wallZ + 0.15); g.add(esc)
  g.traverse((o) => { if (o.isMesh) o.castShadow = true })
  scene.add(g)
  // contact shadow under the pedestal
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(16, 30), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, color: '#000', polygonOffset: true, polygonOffsetFactor: -2 }))
  blob.rotation.x = -Math.PI / 2; blob.position.set(cx, 0.03, wallZ + 15); blob.renderOrder = 3
  blob.material.map.colorSpace = THREE.NoColorSpace
  scene.add(blob)
}

// ---------- the partitions ----------
function partitions(scene, spec, M, open = false) {
  const { pilasters, doors, panels, door, panel, pil, depth, run } = spec
  const T = pil.t, zb = -T, zf = 0 // pilaster plane
  const E = 0.12 // edge radius: phenolic/solid plastic edges are eased
  // pilasters (stiles)
  for (const p of pilasters) scene.add(box(M.panel, p.x, p.x + p.w, pil.y0, pil.y1, zb, zf, E))
  // doors, in the pilaster plane, 1/8" clear of the pilasters each side
  const dz0 = -T / 2 - door.t / 2, dz1 = dz0 + door.t
  for (const d of doors) {
    const x0 = d.x + door.gap, x1 = d.x + d.w - door.gap
    scene.add(box(M.panel, x0, x1, door.y0, door.y1, dz0, dz1, E))
    // wrap-around hinges on the left (hinge) edge: a leaf on the pilaster face and one on the door face, joined by
    // the knuckle across the gap; the same on the inside
    for (const [h0, h1] of spec.hinges) {
      for (const [zz, s] of [[zf, 1], [zb, -1]]) {
        scene.add(box(M.chrome, d.x - 1.1, d.x + 1.6, h0, h1, s > 0 ? zz : zz - 0.09, s > 0 ? zz + 0.09 : zz, 0.04))
      }
      const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h1 - h0, 20), M.chrome)
      kn.position.set(d.x, (h0 + h1) / 2, zf + 0.12); kn.castShadow = true; scene.add(kn)
    }
    // latch side: an emergency-access indicator plate and a small pull, 4" from the latch edge at 40"
    const lx = x1 - spec.latch.fromEdge, ly = spec.latch.y
    scene.add(box(M.chrome, lx - 0.75, lx + 0.75, ly - 1.6, ly + 1.6, dz1, dz1 + 0.08, 0.05))
    const ind = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 32), new THREE.MeshStandardMaterial({ color: '#4c8a54', roughness: 0.5 }))
    ind.rotation.x = Math.PI / 2; ind.position.set(lx, ly + 0.7, dz1 + 0.11); scene.add(ind)
    const slot = box(M.dark, lx - 0.1, lx + 0.1, ly - 1.2, ly - 0.1, dz1 + 0.08, dz1 + 0.1); scene.add(slot)
  }
  // dividing panels from just behind the pilaster to the back wall, with brackets at 18" and 64"
  for (const px of open ? [...panels, spec.endPanel] : panels) {
    const z0 = -depth + panel.backGap, z1 = -panel.front
    scene.add(box(M.panel, px - panel.t / 2, px + panel.t / 2, panel.y0, panel.y1, z0, z1, E))
    for (const y of [18, 64]) {
      // U-bracket at the pilaster (both sides of the panel) and angle bracket at the wall
      for (const s of [-1, 1]) {
        scene.add(box(M.chrome, s < 0 ? px - panel.t / 2 - 0.12 : px + panel.t / 2, s < 0 ? px - panel.t / 2 : px + panel.t / 2 + 0.12, y - 1, y + 1, z1 - 1.6, zb, 0.03))
        scene.add(box(M.chrome, s < 0 ? px - panel.t / 2 - 0.12 : px + panel.t / 2, s < 0 ? px - panel.t / 2 : px + panel.t / 2 + 0.12, y - 1, y + 1, z0 - panel.backGap, z0 + 1.4, 0.03))
      }
    }
  }
  // ---------- support systems ----------
  const shoe = (p, y0, y1) => {
    const o = 0.22
    return box(M.stainless, Math.max(0, p.x - o), Math.min(run, p.x + p.w + o), y0, y1, zb - o, zf + o, 0.06)
  }
  const contact = (cx, w) => { // soft contact shadow on the floor around a shoe
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 6, 9), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, opacity: 0.7, depthWrite: false, color: '#000', polygonOffset: true, polygonOffsetFactor: -2 }))
    m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.03, -T / 2); m.renderOrder = 3; scene.add(m)
  }
  if (spec.shoe) for (const p of pilasters) { scene.add(shoe(p, 0, spec.shoe)); contact(p.x + p.w / 2, p.w) }
  if (spec.ceilingShoe) for (const p of pilasters) scene.add(shoe(p, spec.ceiling - spec.ceilingShoe, spec.ceiling))
  if (spec.hanger) {
    // ceiling hung: the stile hangs from steel above the ceiling (hidden); at the ceiling a stainless sleeve
    // covers the hanger rod and spacer between the stile top and the finished ceiling
    for (const p of pilasters) scene.add(shoe(p, pil.y1, spec.ceiling))
    // hidden structure above the ceiling (kept for completeness; never visible)
    const steel = box(M.alu, 0, run, spec.ceiling + 9, spec.ceiling + 12, zb - 1, zf + 1); steel.visible = false; scene.add(steel)
  }
  if (spec.rail) {
    // headrail: extruded aluminum with a sloping top and a raised grip-resistant face edge, clamped over the stile
    // tops; drawn in front() from rail - 1.4" to rail + 0.6"
    const top = spec.rail + 0.6, bot = spec.rail - 1.4, w = 1.75
    const s = new THREE.Shape()
    // profile in (depth, y): 0 = the face, w = the back; extruded along x, the face toward the viewer
    s.moveTo(0, bot); s.lineTo(w, bot); s.lineTo(w, top - 0.35); s.lineTo(0.22, top); s.lineTo(0.18, top + 0.15); s.lineTo(0, top + 0.15); s.closePath()
    const geo = new THREE.ExtrudeGeometry(s, { depth: run, bevelEnabled: false })
    const m = new THREE.Mesh(geo, M.alu)
    m.rotation.y = Math.PI / 2 // local z (extrusion) -> world +x, local x -> world -z
    m.position.set(0, 0, (w - T) / 2) // centred over the stile: spans z from -(w + T) / 2 to (w - T) / 2
    m.castShadow = m.receiveShadow = true
    scene.add(m)
    // wall brackets at each end
    for (const x of [0, run - 0.15]) scene.add(box(M.alu, x, x + 0.15, bot - 0.6, top + 0.4, -w - 0.3 + (w - T) / 2, (w - T) / 2 + 0.3))
  }
}

// ---------- lights ----------
function lights(scene, spec, M, renderer) {
  const { run, depth, ceiling } = spec
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture
  scene.add(new THREE.HemisphereLight('#fffdf6', '#d8cdb8', 0.22))
  // downlights: two rows in front of the stalls and one inside each stall
  // a row 14" in front of the walls (they wash the walls in soft scallops), a second row further out, one per stall
  const spots = [[run * 0.25, 16], [run * 0.75, 16], [-30, 16], [-78, 16], [run + 30, 16], [run + 78, 16], [run / 2, 110], [-50, 110], [run + 50, 110], ...spec.stallCentres.map((x) => [x, -depth / 2])]
  for (const [x, z] of spots) {
    downlight(scene, M, x, z, ceiling)
    const L = new THREE.SpotLight('#fff4e2', z < 0 ? 450 : 1300, 0, Math.PI / 3, 1, 1.6)
    L.position.set(x, ceiling - 0.5, z); L.target.position.set(x, 0, z)
    L.castShadow = true
    L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.0004; L.shadow.normalBias = 0.05
    L.shadow.camera.near = 2; L.shadow.camera.far = 200
    scene.add(L, L.target)
  }
  // a broad, soft key from above the camera side: gives the even ceiling-lit look
  const key = new THREE.DirectionalLight('#fff8ec', 0.6)
  key.position.set(run / 2 + 20, 300, 260); key.target.position.set(run / 2, 30, -depth / 2)
  key.castShadow = true
  key.shadow.mapSize.set(4096, 4096)
  Object.assign(key.shadow.camera, { left: -70, right: 70, top: 90, bottom: -90, near: 50, far: 700 })
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.04
  scene.add(key, key.target)
}

// ---------- public ----------
// view 'angle' opens the row's right end (no wall there, an end panel instead) so the side panels show.
export function buildScene({ spec, finish = 'cream', renderer, view = 'front' }) {
  const open = view === 'angle'
  seed = 7
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#e9ebe7')
  const M = materials(finish)
  room(scene, spec, M, open)
  partitions(scene, spec, M, open)
  for (const cx of spec.stallCentres) toilet(scene, M, cx, spec.depth)
  lights(scene, spec, M, renderer)
  return scene
}

// Cameras. front: straight on, a long lens (8° vertical) from far back so the drawing's horizontals stay level and
// the sides barely converge, framed floor to ceiling like the front elevation. angle: 3/4 from the entry side at a
// 60" eye height.
export function makeCamera(view, spec, aspect) {
  const { run, ceiling } = spec
  if (view === 'front') {
    const fov = 17, cy = ceiling / 2 + 1
    const half = (ceiling / 2 + 7) // inches above/below centre to show
    const dist = half / Math.tan((fov / 2) * Math.PI / 180)
    const cam = new THREE.PerspectiveCamera(fov, aspect, 120, 700)
    cam.position.set(run / 2, cy, Math.min(dist, ROOM.front - 4))
    cam.lookAt(run / 2, cy, 0)
    return cam
  }
  const cam = new THREE.PerspectiveCamera(36, aspect, 2, 2000)
  cam.position.set(run + 104, 60, 128)
  cam.lookAt(run * 0.46, 42, -22)
  return cam
}
