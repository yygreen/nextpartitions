// Scene builder: the front-elevation row of toilet compartments (one accessible, three standard) between side walls,
// in inches (1 unit = 1"). Axes: x along the row from the left wall's face, y up from the finished floor, z toward
// the viewer with the pilaster faces at z = 0 and the back wall at z = -depth. All partition dimensions arrive in `spec`
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

// glazed wall tile, 24" x 12" in a stacked bond with light grout; returns map and roughness map for one tile repeat
function wallTiles() {
  const px = 512, n = 4 // 1 x 4 tiles (24" wide, 12" high) per repeat: 24" x 48"
  const th = px / n
  const map = canvasTex(px, px, (g) => {
    for (let j = 0; j < n; j++) {
      const v = (rnd() - 0.5) * 8
      g.fillStyle = `rgb(${172 + v},${184 + v},${173 + v})`
      g.fillRect(0, j * th, px, th)
      const gr = g.createLinearGradient(0, j * th, 0, (j + 1) * th) // slight glaze sheen across each tile
      gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.05)')
      g.fillStyle = gr; g.fillRect(0, j * th, px, th)
    }
    g.fillStyle = 'rgb(206,210,204)'
    for (let j = 0; j <= n; j++) g.fillRect(0, j * th - 2, px, 4)
    g.fillRect(0, 0, 3, px); g.fillRect(px - 3, 0, 3, px)
  })
  const rough = canvasTex(px, px, (g) => {
    g.fillStyle = 'rgb(60,60,60)'; g.fillRect(0, 0, px, px)
    g.fillStyle = 'rgb(235,235,235)'
    for (let j = 0; j <= n; j++) g.fillRect(0, j * th - 2, px, 4)
    g.fillRect(0, 0, 3, px); g.fillRect(px - 3, 0, 3, px)
  }, false)
  for (const t of [map, rough]) { t.wrapS = t.wrapT = THREE.RepeatWrapping }
  return { map, rough }
}
// a tiled wall face: a plane just in front of a wall box face, tiles aligned to the floor and to x = 0
function tilePlane(scene, x0, x1, y0, y1, z, rotY = 0) {
  const { map, rough } = wallTiles()
  const w = x1 - x0, h = y1 - y0
  map.repeat.set(w / 24, h / 48); rough.repeat.copy(map.repeat)
  map.offset.set(x0 / 24, y0 / 48); rough.offset.copy(map.offset)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map, roughnessMap: rough, roughness: 1, clearcoat: 0.4, clearcoatRoughness: 0.25, envMapIntensity: 0.5 }))
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); m.rotation.y = rotY
  m.receiveShadow = true
  scene.add(m)
}

// ---------- the room ----------
// angle view: a restroom with the row in an alcove (side walls at x = 0 and x = run, returning ROOM.ret" in front of
// the pilaster faces) and a finished 8' ceiling with downlights.
function room(scene, spec, M) {
  const { run, depth } = spec
  const ceiling = spec.ceiling ?? 96
  const F = ROOM.front, O = ROOM.out, A = ROOM.ret
  floorPlane(scene, -O, run + O, -depth, F)
  const wallBox = (x0, x1, y0, y1, z0, z1, mat = M.wall) => { const b = box(mat, x0, x1, y0, y1, z0, z1); scene.add(b); return b }
  const top = ceiling + 30
  wallBox(-O - 6, run + O + 6, -1, top, -depth - 6, -depth) // back wall
  wallBox(-O, 0, -1, top, -depth - 6, A)                     // left of the alcove
  wallBox(run, run + O, -1, top, -depth - 6, A)              // right of the alcove
  wallBox(-O - 6, -O, -1, top, -depth, F)                    // restroom side walls
  wallBox(run + O, run + O + 6, -1, top, -depth, F)
  wallBox(-O - 6, run + O + 6, -1, top, F, F + 6)            // behind the camera
  // glazed tile on the walls the camera sees: the back wall and the faces of the alcove walls
  tilePlane(scene, -O, run + O, 0, ceiling, -depth + 0.05)
  tilePlane(scene, -O, 0, 0, ceiling, A + 0.05)
  tilePlane(scene, run, run + O, 0, ceiling, A + 0.05)
  const ceil = box(M.ceiling, -O - 6, run + O + 6, ceiling, ceiling + 2, -depth - 6, F + 6)
  ceil.castShadow = false
  scene.add(ceil)
  const base = new THREE.MeshStandardMaterial({ color: '#97a399', roughness: 0.8 })
  wallBox(0, run, 0, 4, -depth, -depth + 0.4, base)
  wallBox(0, 0.4, 0, 4, -depth, A, base)
  wallBox(run - 0.4, run, 0, 4, -depth, A, base)
  wallBox(-O, 0.4, 0, 4, A, A + 0.4, base)
  wallBox(run - 0.4, run + O, 0, 4, A, A + 0.4, base)
  const S = occlusion(scene)
  S.floorAlong(0, run, -depth); S.wallAlong(0, run, -depth)
  S.floorAlong(-O, 0, A); S.wallAlong(-O, 0, A); S.floorAlong(run, run + O, A); S.wallAlong(run, run + O, A)
  S.strip(run, 8, new THREE.Vector3(run / 2, ceiling - 4, -depth + 0.02), new THREE.Euler(0, 0, Math.PI), 0.3)
  for (const [x, ry] of [[0.45, Math.PI / 2], [run - 0.45, -Math.PI / 2]]) {
    S.strip(depth + A, 10, new THREE.Vector3(x, 5, (A - depth) / 2), new THREE.Euler(0, ry, 0))
    S.strip(depth + A, 8, new THREE.Vector3(x, ceiling - 4, (A - depth) / 2), new THREE.Euler(0, ry, Math.PI), 0.3)
  }
  for (const x of [5, run - 5]) S.strip(10, depth + A, new THREE.Vector3(x, 0.02, (A - depth) / 2), new THREE.Euler(-Math.PI / 2, 0, 0), 1, rampH(x < run / 2))
  S.strip(run, 26, new THREE.Vector3(run / 2, 0.025, -6), new THREE.Euler(-Math.PI / 2, 0, 0), 0.22, blobTex())
  // downlights: a row in front of the alcove, one in each compartment
  for (let x = -60; x <= run + 60; x += 42) downlight(scene, M, x, 22, ceiling)
  for (const x of spec.toilets) downlight(scene, M, x, -depth / 2, ceiling)
  for (let x = -40; x <= run + 40; x += 64) downlight(scene, M, x, 110, ceiling)
}

// front view: a section like the drawing. The building is cut on a plane ZC" in front of the pilasters: side walls
// (the drawing's 22 px = 6-7/8"), floor slab (30 px = 9-3/8") and, where the style has one, the ceiling (and, for
// ceiling hung, the plenum with the hanger steel and the structure above) show their cut faces in a flat warm grey,
// like the drawing's hatched building. Outside the building the page is white.
const ZC = 24
function sectionRoom(scene, spec, M) {
  const { run, depth, wallH, frame } = spec
  const wt = frame.wt
  const poche = new THREE.MeshBasicMaterial({ color: '#e7e2d9', toneMapped: false })
  const cutBox = (x0, x1, y0, y1, z0, z1, side) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), [side, side, side, side, poche, side])
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true
    scene.add(m); return m
  }
  floorPlane(scene, 0, run, -depth, ZC)
  // the floor slab's cut face in a darker warm stone, so the floor line stands out from the walls
  const slabCut = new THREE.MeshBasicMaterial({ color: '#a39079', toneMapped: false })
  const slab = cutBox(-wt - 10 / frame.S, run + wt + 20 / frame.S, -frame.slab, 0, -depth - 6, ZC, M.wall) // slab, as front() draws it
  slab.material[4] = slabCut
  cutBox(-wt, 0, 0, wallH, -depth - 6, ZC, M.wall)
  cutBox(run, run + wt, 0, wallH, -depth - 6, ZC, M.wall)
  const backTop = spec.ceiling ?? wallH
  scene.add(box(M.wall, 0, run, 0, backTop, -depth - 6, -depth))
  const base = new THREE.MeshStandardMaterial({ color: '#97a399', roughness: 0.8 })
  scene.add(box(base, 0, run, 0, 4, -depth, -depth + 0.4))
  const S = occlusion(scene)
  S.floorAlong(0, run, -depth); S.wallAlong(0, run, -depth)
  S.strip(run, 26, new THREE.Vector3(run / 2, 0.025, -6), new THREE.Euler(-Math.PI / 2, 0, 0), 0.22, blobTex())
  if (spec.ceiling != null && !spec.plenum) {
    // floor to ceiling: the drawing shows the ceiling line at 96" and the walls to 100": a solid ceiling cut
    cutBox(0, run, spec.ceiling, wallH, -depth - 6, ZC, M.ceiling)
    S.strip(run, 8, new THREE.Vector3(run / 2, spec.ceiling - 4, -depth + 0.02), new THREE.Euler(0, 0, Math.PI), 0.3)
  }
  if (spec.plenum) {
    // ceiling hung: a 5/8" finished ceiling, the plenum above it (back wall in shadow, the steel and hanger rods),
    // the structure at the drawing's plenum top
    const c = spec.ceiling
    cutBox(0, run, c, c + 0.625, -depth - 6, ZC, M.ceiling)
    scene.add(box(new THREE.MeshStandardMaterial({ color: '#b3b8b2', roughness: 0.95, envMapIntensity: 0.5, emissive: '#3c3f3c' }), 0, run, c, spec.hanger.plenumTop, -depth - 6, -depth))
    cutBox(0, run, spec.hanger.plenumTop, wallH, -depth - 6, ZC, M.ceiling)
    S.strip(run, 8, new THREE.Vector3(run / 2, c - 4, -depth + 0.02), new THREE.Euler(0, 0, Math.PI), 0.3)
  }
}

function floorPlane(scene, x0, x1, z0, z1) {
  const { map, rough } = floorTextures()
  const W = x1 - x0, D = z1 - z0
  map.repeat.set(W / (ROOM.tile * 4), D / (ROOM.tile * 4)); rough.repeat.copy(map.repeat)
  // joints on x = 0 and on the back wall
  map.offset.set(((x0 % 96) + 96) % 96 / 96, 0); rough.offset.copy(map.offset)
  const mat = new THREE.MeshPhysicalMaterial({ map, roughnessMap: rough, roughness: 1, color: '#ffffff', clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.5 })
  const f = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat)
  f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); f.receiveShadow = true
  scene.add(f)
}

function occlusion(scene) {
  const ramp = rampTex()
  const strip = (w, h, pos, rot, op = 1, tex = ramp) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), occMat(tex, op)); m.position.copy(pos); m.rotation.copy(rot); m.renderOrder = 2; scene.add(m) }
  return {
    strip,
    floorAlong: (x0, x1, zWall) => strip(x1 - x0, 10, new THREE.Vector3((x0 + x1) / 2, 0.02, zWall + 5), new THREE.Euler(-Math.PI / 2, 0, Math.PI)),
    wallAlong: (x0, x1, zWall) => strip(x1 - x0, 10, new THREE.Vector3((x0 + x1) / 2, 5, zWall + 0.45), new THREE.Euler(0, 0, 0), 0.55),
  }
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
function partitions(scene, spec, M) {
  const { pilasters, doors, panels, door, panel, pil, depth, run } = spec
  const T = pil.t, zb = -T, zf = 0 // pilaster plane
  const E = 0.12 // edge radius: phenolic/solid plastic edges are eased
  for (const p of pilasters) scene.add(box(M.panel, p.x, p.x + p.w, pil.y0, pil.y1, zb, zf, E))
  // doors in the pilaster plane, drawn like front(): from x + gap to x + w - gap
  const dz0 = -T / 2 - door.t / 2, dz1 = dz0 + door.t
  for (const d of doors) {
    const x0 = d.x + door.gap, x1 = d.x + d.w - door.gap
    scene.add(box(M.panel, x0, x1, door.y0, door.y1, dz0, dz1, E))
    if (d.out) {
      // outswing (accessible) door: surface hinges across the hinge-side gap and a pull, all on this face
      const { dx, w, h, tops } = spec.hinge
      for (const t of tops) {
        scene.add(box(M.chrome, x0 + dx, x0 + dx + w, t - h, t, dz1, zf + 0.1, 0.05))
        const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, h, 20), M.chrome)
        kn.position.set(d.x + door.gap / 2, t - h / 2, zf + 0.14); kn.castShadow = true; scene.add(kn)
      }
      const pl = spec.pull, px0 = d.x + d.w - pl.fromEdge
      scene.add(box(M.chrome, px0, px0 + pl.w, pl.top - pl.h, pl.top, dz1 + 1.1, dz1 + 1.5, 0.12))
      for (const y of [pl.top - 0.6, pl.top - pl.h + 0.6]) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 16), M.chrome)
        st.rotation.x = Math.PI / 2; st.position.set(px0 + pl.w / 2, y, dz1 + 0.6); scene.add(st)
      }
    } else {
      // inswing doors: hinges on the inside face (not seen from the front, as in the drawing)
      const { w, h, tops } = spec.hinge
      for (const t of tops) scene.add(box(M.chrome, x0 - 1, x0 - 1 + w, t - h, t, zb - 0.1, dz0, 0.05))
    }
    // latch indicator: a round chrome escutcheon (r as drawn) with an occupancy window, 4" from the latch edge
    const L = spec.latch, lx = d.x + d.w - L.fromEdge
    const esc = new THREE.Mesh(new THREE.CylinderGeometry(L.r, L.r, 0.16, 40), M.chrome)
    esc.rotation.x = Math.PI / 2; esc.position.set(lx, L.y, dz1 + 0.08); scene.add(esc)
    const win = new THREE.Mesh(new THREE.CylinderGeometry(L.r * 0.42, L.r * 0.42, 0.04, 32), new THREE.MeshStandardMaterial({ color: '#4c8a54', roughness: 0.5 }))
    win.rotation.x = Math.PI / 2; win.position.set(lx, L.y + L.r * 0.3, dz1 + 0.17); scene.add(win)
    scene.add(box(M.dark, lx - 0.08, lx + 0.08, L.y - L.r * 0.75, L.y - L.r * 0.2, dz1 + 0.16, dz1 + 0.18))
  }
  // dividing panels at the compartment lines, from just behind the pilaster to the back wall; brackets at 18"/64"
  for (const px of panels) {
    const z0 = -depth + panel.backGap, z1 = -panel.front
    scene.add(box(M.panel, px - panel.t / 2, px + panel.t / 2, panel.y0, panel.y1, z0, z1, E))
    for (const y of [18, 64]) for (const s of [-1, 1]) {
      const a = s < 0 ? px - panel.t / 2 - 0.12 : px + panel.t / 2, b = s < 0 ? px - panel.t / 2 : px + panel.t / 2 + 0.12
      scene.add(box(M.chrome, a, b, y - 1, y + 1, z1 - 1.6, zb, 0.03))
      scene.add(box(M.chrome, a, b, y - 1, y + 1, z0 - panel.backGap, z0 + 1.4, 0.03))
    }
  }
  // accessible compartment grab bars (ADA 604.5): side bar on the dividing panel 12"–54" from the rear wall, rear
  // bar 36" long from 12" one side of the toilet centreline to 24" the other, both 34-1/2" high
  const bar = (len, pos, rotZ, rotX) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, len, 24), M.stainless)
    m.position.copy(pos); m.rotation.set(rotX, 0, rotZ); m.castShadow = true; scene.add(m)
  }
  const tc = spec.toilets[0], pFace = panels[0] - panel.t / 2
  bar(42, new THREE.Vector3(pFace - 2.25, 34.5, -depth + 33), 0, Math.PI / 2)
  bar(36, new THREE.Vector3(tc - 6, 34.5, -depth + 2.25), Math.PI / 2, 0)
  // ---------- support systems ----------
  const o = spec.shoeOver
  const shoe = (p, y0, y1) => box(M.stainless, Math.max(0, p.x - o), Math.min(run, p.x + p.w + o), y0, y1, zb - o, zf + o, 0.06)
  const contact = (cx, w) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 6, 9), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, opacity: 0.7, depthWrite: false, color: '#000', polygonOffset: true, polygonOffsetFactor: -2 }))
    m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.03, -T / 2); m.renderOrder = 3; scene.add(m)
  }
  if (spec.shoe) for (const p of pilasters) { scene.add(shoe(p, 0, spec.shoe)); contact(p.x + p.w / 2, p.w) }
  if (spec.ceilingShoe) for (const p of pilasters) scene.add(shoe(p, spec.ceiling - spec.ceilingShoe, spec.ceiling))
  if (spec.hanger) {
    // ceiling hung: a stainless sleeve covers the hanger rod and spacer between the stile top and the ceiling; above
    // the ceiling (seen only in the front section) the rods run up to the steel support
    for (const p of pilasters) scene.add(shoe(p, pil.y1, spec.ceiling))
    const galv = new THREE.MeshStandardMaterial({ color: '#9da3a8', metalness: 0.6, roughness: 0.5 })
    const [s0, s1] = spec.hanger.steel
    scene.add(box(galv, 0, run, s0, s1, zb - 1.0, zf + 1.0, 0.05))
    for (const p of pilasters) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, s0 - pil.y1, 16), galv)
      rod.position.set(p.x + p.w / 2, (s0 + pil.y1) / 2, -T / 2); scene.add(rod)
    }
  }
  if (spec.rail) {
    // headrail: extruded aluminum with a sloping top and a raised grip-resistant face edge, clamped over the stile
    // tops; drawn in front() from rail + 2 px down 2"
    const top = spec.rail + 2 / spec.frame.S, bot = top - 2, w = 1.75
    const s = new THREE.Shape()
    s.moveTo(0, bot); s.lineTo(w, bot); s.lineTo(w, top - 0.35); s.lineTo(0.22, top - 0.1); s.lineTo(0.18, top); s.lineTo(0, top); s.closePath()
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: run, bevelEnabled: false }), M.alu)
    m.rotation.y = Math.PI / 2
    m.position.set(0, 0, (w - T) / 2)
    m.castShadow = m.receiveShadow = true
    scene.add(m)
    for (const x of [0, run - 0.15]) scene.add(box(M.alu, x, x + 0.15, bot - 0.6, top, -w - 0.3 + (w - T) / 2, (w - T) / 2 + 0.3))
  }
}

// ---------- lights ----------
function lights(scene, spec, renderer) {
  const { run, depth } = spec
  const ceiling = spec.ceiling ?? 96
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture
  scene.add(new THREE.HemisphereLight('#fffdf6', '#d8cdb8', 0.22))
  const spots = []
  for (let x = -60; x <= run + 60; x += 42) spots.push([x, 22, 1300])
  for (const x of spec.toilets) spots.push([x, -depth / 2, 450])
  for (let x = -40; x <= run + 40; x += 64) spots.push([x, 110, 1100])
  for (const [x, z, I] of spots) {
    const L = new THREE.SpotLight('#fff4e2', I, 0, Math.PI / 3, 1, 1.6)
    L.position.set(x, ceiling - 0.5, z); L.target.position.set(x, 0, z)
    L.castShadow = z < 60
    L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.0004; L.shadow.normalBias = 0.05
    L.shadow.camera.near = 2; L.shadow.camera.far = 200
    scene.add(L, L.target)
  }
  const key = new THREE.DirectionalLight('#fff8ec', 0.6)
  key.position.set(run / 2 + 20, 300, 260); key.target.position.set(run / 2, 30, -depth / 2)
  key.castShadow = true
  key.shadow.mapSize.set(4096, 4096)
  Object.assign(key.shadow.camera, { left: -120, right: 120, top: 100, bottom: -100, near: 50, far: 700 })
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.04
  scene.add(key, key.target)
}

// ---------- public ----------
// view 'front' builds the drawing-like section; 'angle' the finished restroom.
export function buildScene({ spec, finish = 'cream', renderer, view = 'front' }) {
  seed = 7
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(view === 'front' ? '#ffffff' : '#e9ebe7')
  const M = materials(finish)
  if (view === 'front') sectionRoom(scene, spec, M)
  else room(scene, spec, M)
  partitions(scene, spec, M)
  for (const cx of spec.toilets) toilet(scene, M, cx, spec.depth)
  lights(scene, spec, renderer)
  return scene
}

// Output size: the front view has the drawing's aspect ratio (its SVG viewBox); the angle view is 2400 x 1500.
export function outputSize(view, spec, width = 2400) {
  return view === 'front' ? [width, Math.round(width * spec.frame.svgH / spec.frame.svgW)] : [width, Math.round(width * 1500 / 2400)]
}

// Cameras. front: orthographic, framed exactly like the drawing: SVG px u ↔ x = (u - x0 - wall) / S, v ↔
// y = (floorPx - v) / S, over the SVG's whole viewBox. angle: perspective, three-quarter from the entry side at a
// 60" eye height.
export function makeCamera(view, spec, aspect) {
  const { run } = spec
  if (view === 'front') {
    const f = spec.frame, ox = f.x0 + f.wt * f.S
    const cam = new THREE.OrthographicCamera(-ox / f.S, (f.svgW - ox) / f.S, f.floorPx / f.S, (f.floorPx - f.svgH) / f.S, 0.1, 1000)
    cam.position.set(0, 0, ZC + 200)
    cam.lookAt(0, 0, 0)
    return cam
  }
  if (view === 'hero') {
    // hero: the finished restroom straight on, at eye height, a little off centre, like a photo from the entry
    const cam = new THREE.PerspectiveCamera(30, aspect, 2, 2000)
    cam.position.set(run * 0.56, 56, 245)
    cam.lookAt(run * 0.5, 45, -spec.depth * 0.4)
    return cam
  }
  const cam = new THREE.PerspectiveCamera(40, aspect, 2, 2000)
  cam.position.set(run + 36, 60, 196)
  cam.lookAt(run * 0.5, 46, -14)
  return cam
}
