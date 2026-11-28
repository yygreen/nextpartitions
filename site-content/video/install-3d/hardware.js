// Generic installation hardware for the installation videos: fasteners, brackets, door hardware and tools, built from
// simple shapes (no manufacturer's parts or designs), plus two helpers: Ops, which times each part's move into place
// (screws spin in, tools come in and back out), and Kits, the "parts for this step" cards rendered in a studio scene.
// Units are inches. Every model's local +y axis points out of the surface it fixes to; its origin is the seated point.
import * as THREE from 'three'

const clamp = (x) => Math.max(0, Math.min(1, x))
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3)

export const MAT = {
  steel: new THREE.MeshStandardMaterial({ color: '#a7adb2', metalness: 0.75, roughness: 0.32 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#d9dde0', metalness: 0.9, roughness: 0.18 }),
  zinc: new THREE.MeshStandardMaterial({ color: '#c3c7c2', metalness: 0.7, roughness: 0.38 }),
  plug: new THREE.MeshStandardMaterial({ color: '#2f6fd6', roughness: 0.55 }),
  hole: new THREE.MeshBasicMaterial({ color: '#1d1a17', polygonOffset: true, polygonOffsetFactor: -3 }),
  tool: new THREE.MeshStandardMaterial({ color: '#fe7802', roughness: 0.45 }),
  toolDark: new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.6 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#3a3633', roughness: 0.8 }),
  nylon: new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.6 }),
  wood: new THREE.MeshStandardMaterial({ color: '#b98c5a', roughness: 0.85 }),
}

const cyl = (r, h, mat, seg = 20, r2 = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, h, seg), mat); m.castShadow = true; return m }
const boxm = (w, h, d, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = true; m.receiveShadow = true; return m }
const at = (o, x, y, z) => { o.position.set(x, y, z); return o }
const group = (...o) => { const g = new THREE.Group(); g.add(...o); return g }

// ---------- fasteners ----------
// screw: pan head at the origin, shank down -y (into the surface)
export function screw(len = 1, r = 0.09, mat = MAT.chrome) {
  const head = at(cyl(r * 2.3, 0.1, mat, 24), 0, 0.05, 0)
  const slot = at(boxm(r * 3.4, 0.03, 0.04, MAT.toolDark), 0, 0.105, 0)
  const slot2 = at(boxm(0.04, 0.03, r * 3.4, MAT.toolDark), 0, 0.105, 0)
  const shank = at(cyl(r, len, mat, 12, r * 0.6), 0, -len / 2, 0)
  return group(head, slot, slot2, shank)
}
// wall plug: a ribbed plastic sleeve, flush at the origin
export function plug(len = 1, r = 0.17) {
  const g = group(at(cyl(r, len, MAT.plug, 14, r * 0.8), 0, -len / 2, 0), at(cyl(r * 1.35, 0.06, MAT.plug, 18), 0, -0.03, 0))
  for (let i = 1; i < 4; i++) g.add(at(cyl(r * 1.12, 0.05, MAT.plug, 14), 0, -i * len / 4.2, 0))
  return g
}
// through-bolt (the bolt-and-barrel kind used through panels): round head, barrel along -y
export function throughBolt(len = 1.4, r = 0.14) {
  return group(at(cyl(r * 2.4, 0.12, MAT.chrome, 24), 0, 0.06, 0), at(boxm(0.04, 0.03, r * 3.2, MAT.toolDark), 0, 0.125, 0), at(cyl(r, len, MAT.chrome, 14), 0, -len / 2, 0))
}
export function nut(r = 0.5, h = 0.4) { const m = cyl(r, h, MAT.steel, 6); m.position.y = h / 2; return group(m, at(cyl(r * 0.45, h + 0.02, MAT.toolDark, 16), 0, h / 2, 0)) }
export function washer(r = 0.75, h = 0.08) { return group(at(cyl(r, h, MAT.zinc, 28), 0, h / 2, 0)) }
// threaded stud set in the floor: origin at floor level, length above it along +y
export function stud(len = 3, r = 0.25) {
  const g = group(at(cyl(r, len, MAT.zinc, 14), 0, len / 2, 0))
  for (let y = 0.25; y < len; y += 0.22) g.add(at(cyl(r * 1.08, 0.05, MAT.zinc, 14), 0, y, 0))
  return g
}

// barrel nut: the female half of a through-bolt (a screw comes in from the far side); low round head at the origin,
// plain sleeve down -y
export function barrelNut(len = 0.5, r = 0.13) {
  return group(at(cyl(r * 2.3, 0.1, MAT.chrome, 24), 0, 0.05, 0), at(cyl(r * 1.4, 0.04, MAT.chrome, 24), 0, 0.11, 0), at(cyl(r, len, MAT.steel, 14), 0, -len / 2, 0))
}
// leveling bolt for a solid pilaster's foot: origin at the seat (the pilaster's bottom face); `len` of thread goes in
// along -y, `out` stands proud along +y and ends in a hex head that sits on the floor
export function levelBolt(len = 1.2, out = 1, r = 0.16) {
  const g = group(at(cyl(r, len + out - 0.3, MAT.zinc, 14), 0, (out - 0.3 - len) / 2, 0), at(cyl(r * 2.4, 0.3, MAT.zinc, 6), 0, out - 0.15, 0))
  for (let y = -len + 0.1; y < out - 0.35; y += 0.14) g.add(at(cyl(r * 1.08, 0.04, MAT.zinc, 14), 0, y, 0))
  return g
}
// pilaster shoe (for the kit card): an open-ended stainless sleeve
export function shoe(w = 6, d = 1.4, h = 3) {
  const t = 0.06, m = MAT.chrome
  return group(at(boxm(w, h, t, m), 0, h / 2, d / 2), at(boxm(w, h, t, m), 0, h / 2, -d / 2), at(boxm(t, h, d, m), -w / 2, h / 2, 0), at(boxm(t, h, d, m), w / 2, h / 2, 0))
}

// ---------- brackets ----------
// angle bracket: leg A flat on the fixing surface (x-z plane at y = 0, extending +x), leg B standing up along +y.
// Holes are drawn as dark dots so the screws have somewhere to go.
export function angle(a = 1.5, b = 1.5, h = 2, t = 0.12, mat = MAT.chrome) {
  const g = group(at(boxm(a, t, h, mat), a / 2, t / 2, 0), at(boxm(t, b, h, mat), t / 2, b / 2, 0))
  return g
}
// U-channel: the panel sits between the two ears; base on the fixing surface
export function channel(w = 1.24, d = 1.5, h = 2, t = 0.12, mat = MAT.chrome) {
  return group(at(boxm(w + 2 * t + 1.6, t, h, mat), 0, t / 2, 0), at(boxm(t, d, h, mat), -w / 2 - t / 2, d / 2, 0), at(boxm(t, d, h, mat), w / 2 + t / 2, d / 2, 0))
}
// leveling bracket at a pilaster's foot: a channel with slotted ears that sits on the floor studs
export function levelBracket(w = 10, d = 1.25) {
  const t = 0.14
  const g = group(at(boxm(w, t, d + 0.3, MAT.zinc), 0, 0, 0), at(boxm(w, 1.6, t, MAT.zinc), 0, 0.8, -d / 2 - 0.15))
  return g
}
export function railBracket(w = 1.6) { return group(at(boxm(w + 0.24, 0.12, 1.6, MAT.alu ?? MAT.zinc), 0, 0.06, 0), at(boxm(0.12, 1.2, 1.6, MAT.zinc), -w / 2 - 0.06, -0.6, 0), at(boxm(0.12, 1.2, 1.6, MAT.zinc), w / 2 + 0.06, -0.6, 0)) }

// ---------- door hardware ----------
// these are drawn facing +z (upright, as seen on a door) and turned so +z becomes the model's out axis (+y)
const zout = (g) => { const w = new THREE.Group(); g.rotation.x = -Math.PI / 2; w.add(g); return w }
// surface hinge: two leaves and a knuckle; built as two separate groups so each half can go on by itself
export function hingeLeaf(w = 2, h = 4.4, t = 0.14) {
  const g = group(at(boxm(w, h, t, MAT.chrome), w / 2, 0, t / 2))
  for (const y of [-h / 3, 0, h / 3]) g.add(at(cyl(0.12, 0.03, MAT.toolDark, 12), w * 0.6, y, t + 0.01).rotateX(Math.PI / 2))
  return zout(g)
}
export function knuckle(h = 4.4) { return group(at(cyl(0.25, h, MAT.chrome, 20), 0, 0, 0)) }
export function slideLatch() { return zout(group(at(boxm(3, 1.2, 0.35, MAT.chrome), 0, 0, 0.18), at(boxm(1.4, 0.35, 0.3, MAT.steel), 1.6, 0, 0.4), at(cyl(0.25, 0.5, MAT.chrome, 16).rotateX(Math.PI / 2), 0.2, 0, 0.55))) }
export function keeper() { return zout(group(at(boxm(0.9, 1.8, 0.3, MAT.chrome), 0, 0, 0.15), at(boxm(0.9, 0.5, 1.0, MAT.chrome), 0, 0, 0.6))) }
export function pull() { const g = group(at(boxm(0.6, 5.5, 0.5, MAT.chrome), 0, 0, 1.3)); for (const y of [-2.3, 2.3]) g.add(at(cyl(0.22, 1.2, MAT.chrome, 14).rotateX(Math.PI / 2), 0, y, 0.6)); return zout(g) }
export function coatHook() { return zout(group(at(cyl(0.6, 0.2, MAT.chrome, 20).rotateX(Math.PI / 2), 0, 0, 0.1), at(cyl(0.18, 1.6, MAT.chrome, 12).rotateX(Math.PI / 3), 0, 0.5, 0.75), at(cyl(0.3, 0.4, MAT.rubber, 16).rotateX(Math.PI / 2), 0, 1.15, 1.3))) }
export function bumper() { return zout(group(at(cyl(0.6, 0.2, MAT.chrome, 20).rotateX(Math.PI / 2), 0, 0, 0.1), at(cyl(0.45, 1.0, MAT.rubber, 20).rotateX(Math.PI / 2), 0, 0, 0.7))) }
export function endCap() { return group(at(boxm(0.2, 2.4, 2.1, MAT.zinc), 0, 0, 0)) }
export function block(w = 3.5, h = 12) { return group(at(boxm(w, h, w, MAT.wood), 0, h / 2, 0)) }

// ---------- tools ----------
// cordless drill in brand orange: bit tip at the origin pointing -y; the body behind it along +y, the grip along +z
export function drill(bit = 2.6) {
  const g = group(
    at(cyl(0.09, bit, MAT.steel, 10, 0.06), 0, bit / 2, 0),
    at(cyl(0.45, 1.2, MAT.toolDark, 20), 0, bit + 0.6, 0),
    at(cyl(1.05, 5.5, MAT.tool, 24), 0, bit + 3.9, 0),
    at(boxm(1.4, 1.6, 4.6, MAT.toolDark), 0, bit + 4.5, 2.6),
    at(boxm(2.2, 2.4, 1.6, MAT.tool), 0, bit + 4.7, 5.1),
  )
  g.userData.spinPart = g.children[0]
  g.scale.setScalar(0.55)
  return g
}
// open-end wrench: the jaw's centre at the origin, around the y axis; the handle along +z
export function wrench(len = 7) {
  const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.28, 10, 20, Math.PI * 1.5), MAT.steel)
  jaw.rotation.x = Math.PI / 2; jaw.castShadow = true
  return group(jaw, at(boxm(0.7, 0.3, len, MAT.steel), 0, 0, 0.85 + len / 2))
}
// spirit level: a bar with a bubble vial, lying along +x
export function level(len = 24) {
  return group(at(boxm(len, 1.4, 0.8, MAT.tool), 0, 0.7, 0), at(boxm(2.2, 0.5, 0.82, new THREE.MeshStandardMaterial({ color: '#c7e67a', roughness: 0.3, transparent: true, opacity: 0.9 })), 0, 0.9, 0))
}

// ---------- placement ----------
// point a model's +y along n; its +z (a tool's grip) towards `down` where possible (default: world down)
export function orient(obj, n, down = new THREE.Vector3(0, -1, 0)) {
  const y = n.clone().normalize()
  let z = down.clone().sub(y.clone().multiplyScalar(down.dot(y)))
  if (z.lengthSq() < 1e-6) z = new THREE.Vector3(0, 0, 1).sub(y.clone().multiplyScalar(y.z))
  z.normalize()
  const x = new THREE.Vector3().crossVectors(y, z).normalize()
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
  return obj
}

// Ops: every timed move. Each op shows `obj` at its seated pose from t0 + dur on, sliding in along its own +y over
// [t0, t0 + dur] (and spinning if `spin` turns are given). Kinds:
//   'in'   a part going in (default), stays;  'tool' a tool that comes in, holds and backs out;  'show' fade only
export class Ops {
  constructor(scene) { this.scene = scene; this.list = [] }
  add(obj, pos, n, t0, o = {}) {
    const op = { obj, pos: pos.clone(), n: n.clone().normalize(), t0, kind: 'in', dur: 0.6, dist: 2, spin: 0, hold: 0.8, until: Infinity, from: 0, ...o }
    orient(obj, op.n, o.down)
    op.q0 = obj.quaternion.clone()
    obj.visible = false
    // a parent (a door that swings) carries the part with it; positions are given in world space at rest
    if (o.parent) { op.pos.sub(o.parent.position); o.parent.add(obj) } else this.scene.add(obj)
    this.list.push(op)
    obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.part = 'op' } })
    return op
  }
  // a hole in a surface: a dark disc that appears at t
  hole(pos, n, t, r = 0.16, until = Infinity) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 18), MAT.hole)
    const op = this.add(group(m), pos.clone().add(n.clone().multiplyScalar(0.02)), n, t, { kind: 'show', dur: 0.15, until })
    m.rotation.x = -Math.PI / 2
    return op
  }
  update(t) {
    let moving = false
    for (const op of this.list) {
      const { obj, pos, n, t0, kind, dur, dist, spin, hold, until } = op
      if (t < t0 || t > until) { obj.visible = false; continue }
      obj.visible = true
      let off = 0, turn = 0
      if (kind === 'in') { const u = easeOut((t - t0) / dur); off = dist * (1 - u); turn = spin * (1 - u) * Math.PI * 2; if (u < 1) moving = true }
      else if (kind === 'tool') {
        const a = (t - t0) / dur, b = (t - t0 - dur - hold) / dur
        if (b > 1) { obj.visible = false; continue }
        const dd = (op.depth ?? 0) * clamp((t - t0 - dur) / hold) * (1 - ease(Math.max(0, b)))
        off = dist * (1 - ease(a)) + dist * ease(Math.max(0, b)) * 1.6 - dd
        if (obj.userData.spinPart) obj.userData.spinPart.rotation.y = t * 40
        if (op.swing) turn = op.swing * Math.sin(clamp((t - t0 - dur) / hold) * Math.PI * 2)
        moving = true
      }
      obj.position.copy(pos).addScaledVector(n, off)
      obj.quaternion.copy(op.q0)
      if (turn) obj.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(n, turn))
    }
    return moving
  }
}
// a screw going in with the drill: the drill arrives, the screw spins in under it, the drill backs out
export function driveScrew(ops, pos, n, t, o = {}) {
  const s = ops.add(screw(o.len ?? 1), pos, n, t + 0.25, { spin: 4, dist: o.len ?? 1, dur: 0.7, parent: o.parent })
  if (o.tool !== false) ops.add(drill(), pos.clone().addScaledVector(n, 0.12), n, t, { kind: 'tool', dur: 0.3, hold: 0.6, dist: 3.5, down: o.down, parent: o.parent })
  return s
}
// drill a hole and push a plug into it
export function drillPlug(ops, pos, n, t, o = {}) {
  ops.add(drill(), pos, n, t, { kind: 'tool', dur: 0.35, hold: 0.55, dist: 3.5, depth: 0.6, down: o.down })
  ops.hole(pos, n, t + 0.5, 0.17, o.holeUntil ?? t + 1.6)
  ops.add(plug(), pos, n, t + 1.4, { dist: 1.4, dur: 0.4 })
}

// ---------- kit cards ----------
// A studio scene: the parts for the next step laid out in a row on a pale backdrop, each turning slowly, named below.
export class Kits {
  constructor(width, height) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#f4f1ec')
    this.camera = new THREE.PerspectiveCamera(30, width / height, 1, 400)
    this.camera.position.set(0, 2.5, 46); this.camera.lookAt(0, 0, 0)
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#cfc6ba', 1.6))
    const d = new THREE.DirectionalLight('#ffffff', 2.2); d.position.set(10, 20, 30); this.scene.add(d)
    const r = new THREE.DirectionalLight('#ffe2c4', 0.9); r.position.set(-20, 6, -10); this.scene.add(r)
    this.cards = []
  }
  // reflections for the metal parts: the same studio environment the restroom uses
  setEnv(renderer, RoomEnvironment) {
    const pm = new THREE.PMREMGenerator(renderer)
    this.scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture
  }
  // items: [{ name, make: () => Object3D, size? (largest dimension on the card, default 5.2) }]
  card(t0, t1, title, items) {
    const g = new THREE.Group(), n = items.length, gap = Math.min(10.5, 44 / n)
    const placed = items.map((it, i) => {
      const o = it.make(), b = new THREE.Box3().setFromObject(o), s = new THREE.Vector3(); b.getSize(s)
      const k = (it.size ?? 6) / Math.max(s.x, s.y, s.z), c = new THREE.Vector3(); b.getCenter(c)
      const holder = new THREE.Group(), inner = new THREE.Group()
      inner.add(o); o.position.sub(c); inner.scale.setScalar(k); inner.rotation.set(0.5, 0.6, 0.2)
      holder.add(inner); holder.position.set((i - (n - 1) / 2) * gap, 0.6, 0); g.add(holder)
      return { holder, inner, name: it.name }
    })
    g.visible = false; this.scene.add(g)
    this.cards.push({ t0, t1, title, g, placed })
  }
  active(t) { return this.cards.find((c) => t >= c.t0 - 0.35 && t <= c.t1 + 0.35) }
  update(t) {
    for (const c of this.cards) c.g.visible = false
    const c = this.active(t); if (!c) return null
    c.g.visible = true
    c.placed.forEach((p, i) => {
      const a = easeOut((t - c.t0 - 0.15 - i * 0.12) / 0.5)
      p.holder.position.y = 0.6 - (1 - a) * 3; p.holder.scale.setScalar(Math.max(0.001, a))
      p.inner.rotation.y = 0.6 + (t - c.t0) * 0.5
    })
    return c
  }
  // screen position of each item's name (below the item), for the overlay
  labels(c, W, H) {
    return c.placed.map((p) => {
      const v = new THREE.Vector3(p.holder.position.x, -3.6, 0).project(this.camera)
      return { name: p.name, x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H }
    })
  }
}
