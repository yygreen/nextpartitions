// Reads the partition dimensions straight out of design/diagrams.mjs, so the renders and the technical drawings
// share one set of numbers. If a drawing changes, the next render follows it; if the source can no longer be
// parsed, this throws instead of falling back to stale copies.
//
// From diagrams.mjs (all inches):
//   front()     H table: per-style stile (pilaster) bottom/top, headrail height, ceiling, plenum
//   FRONT_ELEV  the front elevations, left to right: one 60-1/2" accessible stall, then three identical 36" standard
//               stalls (24" door + 12" pilaster each)
//   LAYOUT      stall widths and the 61-1/4" depth to the face
//   elevation() door = [12, 70]: 58" doors 12" above the floor
//   side()      panel from 1.5" behind the face to depth - 0.7", 12" to 70"; pilaster 1-1/4" thick
import { readFileSync } from 'node:fs'

const SRC = readFileSync(new URL('../diagrams.mjs', import.meta.url), 'utf8')
const literal = (re, what) => {
  const m = SRC.match(re)
  if (!m) throw new Error(`dims: could not find ${what} in design/diagrams.mjs`)
  return Function(`"use strict"; return (${m[1]})`)()
}

export function readDims() {
  const H = literal(/const H = (\{ ob: .*?\})\[style\]/, 'the front() height table (const H)')
  const FRONT = literal(/const FRONT_ELEV = (\[\[.*?\]\])/, 'FRONT_ELEV (the front elevations\' widths)')
  const LAYOUT = literal(/const LAYOUT = (\{.*?\})/, 'LAYOUT')
  const door = literal(/door = (\[\d+, \d+\])/, 'the elevation() door default')
  const pilT = +SRC.match(/rect\(X\(0\), Y\(pil\[1\]\), ([\d.]+) \* s/)?.[1]
  if (!pilT) throw new Error('dims: pilaster thickness (side view) not found')
  return { H, FRONT, LAYOUT, door, pilT }
}

// Two of the standard stalls from FRONT_ELEV, between side walls: its last five entries, pilaster 12, door 24,
// pilaster 12, door 24, pilaster 12. Each standard stall is a 24" door and the 12" pilaster beside it (36"), so the
// stall line (where the dividing panel meets the front) is the right edge of each pilaster that follows a door;
// the panel sits just inside it, behind the pilaster.
const STYLE_KEY = { 'overhead-braced': 'ob', 'floor-mounted': 'fm', 'ceiling-hung': 'ch', 'floor-to-ceiling': 'ftc' }
export const STYLES = Object.keys(STYLE_KEY)

export function specFor(style) {
  const { H, FRONT, LAYOUT, door, pilT } = readDims()
  const key = STYLE_KEY[style]
  if (!key) throw new Error(`unknown style ${style}`)
  const h = H[key]
  let cur = 0
  const items = FRONT.map(([k, w]) => { const it = { k, x: cur, w }; cur += w; return it })
  const sub = items.slice(-5)
  const shape = sub.map((i) => `${i.k}${i.w}`).join(' ')
  if (!/^p(\d+(\.\d+)?) d(\d+(\.\d+)?) p\1 d\3 p\1$/.test(shape)) throw new Error(`dims: FRONT_ELEV's last two stalls are not identical (${shape})`)
  const x0 = sub[0].x
  const run = cur - x0
  const pils = sub.filter((i) => i.k === 'p').map((i) => ({ x: i.x - x0, w: i.w }))
  const panelT = 1
  const panelAt = (p) => p.x + p.w - 0.75 // panel centre, just inside the pilaster's right edge
  const panelX = panelAt(pils[1])
  return {
    style, key,
    run, depth: LAYOUT.depth,
    pilasters: pils,
    doors: sub.filter((i) => i.k === 'd').map((i) => ({ x: i.x - x0, w: i.w })),
    panels: [panelX],
    endPanel: panelAt(pils[2]), // used when the row's right end is open (angle view)
    stallCentres: [(0 + panelX) / 2, (panelX + run) / 2],
    door: { y0: door[0], y1: door[1], gap: 0.125, t: 1 },
    panel: { y0: door[0], y1: door[1], t: panelT, front: 1.5, backGap: 0.7 },
    pil: { y0: h.pil[0], y1: h.pil[1], t: pilT },
    rail: h.rail ?? null,
    ceiling: h.ceil ?? 96,           // ob and fm drawings have no ceiling; the scene uses the same 8' room
    plenum: !!h.plenum,
    shoe: key !== 'ch' ? 4 : 0,      // 4" stainless shoes (front(): every style except ceiling hung)
    ceilingShoe: key === 'ftc' ? 3 : 0, // front(): ftc ceiling anchors drawn 3" deep below the ceiling
    hanger: key === 'ch',
    // hardware heights from front(): hinges 60.6–65 and 15.6–20, latch indicator 4" from the latch edge at 40"
    hinges: [[60.6, 65], [15.6, 20]],
    latch: { y: 40, fromEdge: 4 },
  }
}
