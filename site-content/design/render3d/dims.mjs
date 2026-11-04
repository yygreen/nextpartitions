// Reads the partition dimensions straight out of design/diagrams.mjs, so the renders and the technical drawings
// share one set of numbers. If a drawing changes, the next render follows it; if the source can no longer be
// parsed, this throws instead of falling back to stale copies.
//
// From diagrams.mjs (all inches; the front elevations draw at 3.2 px per inch):
//   FRONT_ELEV  the front elevation row, left to right: 3.5" wall pilaster, 36" accessible door (outswing), 21"
//               pilaster, then three standard compartments (24" inswing door + 12" pilaster)
//   front()     table H: per-style stile bottom/top, headrail, ceiling, plenum, wall height and the floor line (px);
//               the frame (x0 70 + wall 22 px, slab 30 px, canvas width and height); hardware positions
//   LAYOUT      depth to the face (61-1/4")
//   plan()      accessible toilet centreline 17" from the dividing panel; grab bars (ADA 604.5)
//   side()      panel from 1.5" behind the face to depth - 0.7", 12" to 70"; pilaster 1-1/4" thick
import { readFileSync } from 'node:fs'

const SRC = readFileSync(new URL('../diagrams.mjs', import.meta.url), 'utf8')
const literal = (re, what) => {
  const m = SRC.match(re)
  if (!m) throw new Error(`dims: could not find ${what} in design/diagrams.mjs`)
  return Function(`"use strict"; return (${m[1]})`)()
}
const number = (re, what) => {
  const m = SRC.match(re)
  if (!m) throw new Error(`dims: could not find ${what} in design/diagrams.mjs`)
  return +m[1]
}

export function readDims() {
  return {
    H: literal(/const H = (\{ ob: .*?\})\[style\]/, 'the front() height table (const H)'),
    FRONT: literal(/const FRONT_ELEV = (\[\[.*?\]\])/, 'FRONT_ELEV (the front elevations\' widths)'),
    LAYOUT: literal(/const LAYOUT = (\{.*?\})/, 'LAYOUT'),
    door: literal(/door = (\[\d+, \d+\])/, 'the elevation() door default'),
    pilT: number(/rect\(X\(0\), Y\(pil\[1\]\), ([\d.]+) \* s/, 'the pilaster thickness (side view)'),
  }
}

const STYLE_KEY = { 'overhead-braced': 'ob', 'floor-mounted': 'fm', 'ceiling-hung': 'ch', 'floor-to-ceiling': 'ftc' }
export const STYLES = Object.keys(STYLE_KEY)

export function specFor(style) {
  const { H, FRONT, LAYOUT, door, pilT } = readDims()
  const fm = SRC.match(/function front\(name, style, ph = false\) \{\s*const s = ph \? [\d.]+ : ([\d.]+), x0 = ph \? \d+ : (\d+), wt = ph \? \d+ : (\d+), slab = ph \? \d+ : (\d+)/)
  if (!fm) throw new Error('dims: the front() frame constants (s, x0, wt, slab) not found')
  const [S, X0, WT, SLAB] = fm.slice(1).map(Number)
  const key = STYLE_KEY[style]
  if (!key) throw new Error(`unknown style ${style}`)
  const h = H[key]

  // the row
  let cur = 0
  const items = FRONT.map(([k, w]) => { const it = { k, x: cur, w }; cur += w; return it })
  const run = cur
  if (items[0].k !== 'p' || items.at(-1).k !== 'p') throw new Error('dims: FRONT_ELEV must start and end with a pilaster')
  const pilasters = items.filter((i) => i.k === 'p').map(({ x, w }) => ({ x, w }))
  // the first door (accessible) swings out, the rest in (front(): `const out = di === 0`)
  if (!/const out = di === 0/.test(SRC)) throw new Error('dims: front() no longer marks only the first door as outswing')
  const doors = items.filter((i) => i.k === 'd').map(({ x, w }, i) => ({ x, w, out: i === 0 }))
  // compartment lines: the right edge of the pilaster after each door (accessible 3.5 + 36 + 21 = 60.5", standards
  // 24 + 12 = 36"); the last one is the wall
  const lines = []
  items.forEach((it, i) => { if (it.k === 'd' && i + 1 < items.length - 1) lines.push(items[i + 1].x + items[i + 1].w) })
  const stalls = [0, ...lines, run].slice(0, -1).map((l, i) => [l, [...lines, run][i]])
  // toilets: accessible 17" from the dividing panel (plan(): edges[0][1] - 17); standard ones centred
  const toilets = stalls.map(([l, r], i) => (i === 0 ? r - 17 : (l + r) / 2))

  const svgW = Math.round(X0 + WT + run * S + 22 + 34 + (key === 'ftc' ? 90 : 80))
  return {
    style, key, run, depth: LAYOUT.depth,
    pilasters, doors,
    panels: lines.map((l) => l - 0.75), // panel centre: just inside the compartment line, its brackets behind the pilaster
    stalls, toilets,
    door: { y0: door[0], y1: door[1], gap: 0.3, t: 1 }, // front(): door drawn from x + 0.3 to x + w - 0.3
    panel: { y0: door[0], y1: door[1], t: 1, front: 1.5, backGap: 0.7 },
    pil: { y0: h.pil[0], y1: h.pil[1], t: pilT },
    rail: h.rail ?? null,
    ceiling: h.ceil ?? null,
    plenum: !!h.plenum,
    wallH: h.wall,
    shoe: key !== 'ch' ? 4 : 0,
    shoeOver: 1 / S,                    // front(): shoes drawn 1 px wider each side
    ceilingShoe: key === 'ftc' ? 3 : 0, // front(): rect at Y(96), 3 * s deep
    hanger: key === 'ch' ? { steel: [h.ceil + 6, h.ceil + 9], plenumTop: h.ceil + 14 } : null,
    // hardware (front()): outswing door hinges 7 x 14 px from 2 px left of the door edge, tops at 65" and 20";
    // pull 3 x 22 px, 9" from the latch edge, top at 43"; latch indicator r 4 px, 4" from the latch edge at 40"
    hinge: { dx: -2 / S, w: 7 / S, h: 14 / S, tops: [65, 20] },
    pull: { fromEdge: 9, w: 3 / S, h: 22 / S, top: 43 },
    latch: { y: 40, fromEdge: 4, r: 4 / S },
    // the drawing's frame, for the orthographic front camera
    frame: { S, x0: X0, wt: WT / S, slab: SLAB / S, floorPx: h.floor, svgW, svgH: h.floor + 64 },
  }
}
