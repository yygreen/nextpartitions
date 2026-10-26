// Generates the technical drawings in design/diagrams/ (SVG), in the Next Partitions drawing language
// (design/design-language.md): spec-sheet linework in the site's ink colour, the building hatched in warm grey,
// orange only for what the drawing is about, numbered callouts whose key is page text under the drawing.
// Measurements come from the pages' cited sources: doors and panels 58" at 12" above the floor, overhead-braced
// pilasters 83", floor-anchored 69", ceiling-hung 83" for an 8' ceiling (Bobrick, Hadrian).
//
//   node design/diagrams.mjs      (from site-content/)
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('./diagrams/', import.meta.url)
mkdirSync(OUT, { recursive: true })

// ---------- tokens (from the live stylesheet) ----------
const C = {
  ink: '#1c0e05',        // --foreground
  line: '#2d1e14',       // --brand-navy: secondary linework
  muted: '#7a6a5e',      // dimension lines and notes
  struct: '#f2f0ec',     // --accent: building fill
  hatch: '#cfc7bc',      // building hatch
  part: '#ffffff',       // product fill
  orange: '#fe7802',     // --brand-red: the subject
  orangeTint: '#fff1e5', // orange at ~10% on white
}
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif'
const S = 3.2 // px per inch in elevations

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
function svg(name, w, h, title, desc, body) {
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t-${name} d-${name}" font-family="${FONT}">
<title id="t-${name}">${esc(title)}</title>
<desc id="d-${name}">${esc(desc)}</desc>
<defs>
<pattern id="hatch-${name}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${C.struct}"/><line x1="0" y1="0" x2="0" y2="8" stroke="${C.hatch}" stroke-width="1.5"/></pattern>
<marker id="tick-${name}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M2 8 L8 2" stroke="${C.muted}" stroke-width="1.5"/></marker>
</defs>
<rect width="${w}" height="${h}" fill="#ffffff"/>
${body.replaceAll('HATCH', `url(#hatch-${name})`).replaceAll('TICK', `url(#tick-${name})`)}
</svg>
`
  writeFileSync(new URL(`${name}.svg`, OUT), out)
  return name
}

// ---------- primitives ----------
const rect = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill ?? C.part}" stroke="${o.stroke ?? C.ink}" stroke-width="${o.sw ?? 1.5}"${o.rx ? ` rx="${o.rx}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? C.ink}" stroke-width="${o.sw ?? 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cap ? ' stroke-linecap="round"' : ''}/>`
const text = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size ?? 14}" font-weight="${o.weight ?? 500}" fill="${o.fill ?? C.ink}" text-anchor="${o.anchor ?? 'start'}"${o.rotate ? ` transform="rotate(${o.rotate} ${x} ${y})"` : ''}>${esc(s)}</text>`
// Numbered callout: an orange disc at (x, y), with an optional leader to the point it names.
const callout = (n, x, y, to) => `${to ? line(x, y, to[0], to[1], { stroke: C.orange, sw: 1.5 }) + `<circle cx="${to[0]}" cy="${to[1]}" r="2.5" fill="${C.orange}"/>` : ''}<circle cx="${x}" cy="${y}" r="12" fill="${C.orange}"/><text x="${x}" y="${y + 5}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">${n}</text>`
// Vertical dimension at x from y1 to y2 (screen coordinates), label to the side.
function vdim(x, y1, y2, label, side = 'right') {
  const tx = side === 'right' ? x + 8 : x - 8
  return `${line(x, y1, x, y2, { stroke: C.muted, sw: 1 })}${line(x - 5, y1, x + 5, y1, { stroke: C.muted, sw: 1 })}${line(x - 5, y2, x + 5, y2, { stroke: C.muted, sw: 1 })}${text(tx, (y1 + y2) / 2 + 5, label, { size: 14, fill: C.muted, anchor: side === 'right' ? 'start' : 'end', weight: 600 })}`
}
function hdim(y, x1, x2, label) {
  return `${line(x1, y, x2, y, { stroke: C.muted, sw: 1 })}${line(x1, y - 5, x1, y + 5, { stroke: C.muted, sw: 1 })}${line(x2, y - 5, x2, y + 5, { stroke: C.muted, sw: 1 })}${text((x1 + x2) / 2, y - 7, label, { size: 14, fill: C.muted, anchor: 'middle', weight: 600 })}`
}

// ---------- the stall front elevation ----------
// Two stalls seen from the front: wall | P door P door P | wall. Inches → px with floor at `floor`.
function elevation({ x0 = 70, floor, ceiling = null, plenum = false, pil = [0, 83], headrail = false,
  floorAnchors = true, ceilingAnchors = false, hangers = false, door = [12, 70], wallH = 100, emphasis = 'support' }) {
  const Y = (inch) => floor - inch * S
  const P = 6, D = 24, G = 0.6 // pilaster, door, sightline gap (inches)
  const xs = [] // pilaster x positions in inches from inner wall face
  let cur = 0.6 // first pilaster sits at the wall, with the wall gap
  for (let i = 0; i < 3; i++) { xs.push(cur); cur += P + G + D + G }
  const runIn = xs[2] + P + 0.6
  const X = (inch) => x0 + 22 + inch * S
  const wallL = x0, wallR = X(runIn)
  let b = ''
  // building: floor slab, walls, ceiling
  b += rect(x0 - 10, floor, wallR - x0 + 42, 30, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 10, floor, wallR + 32, floor)
  b += rect(x0, Y(wallH), 22, wallH * S, { fill: 'HATCH', stroke: 'none' }) + line(x0 + 22, Y(wallH), x0 + 22, floor)
  b += rect(wallR, Y(wallH), 22, wallH * S, { fill: 'HATCH', stroke: 'none' }) + line(wallR, Y(wallH), wallR, floor)
  if (ceiling !== null) {
    b += line(x0 + 22, Y(ceiling), wallR, Y(ceiling), { sw: 1.5 })
    if (plenum) b += rect(x0 + 22, Y(ceiling + 14), wallR - x0 - 22, 14 * S - 2, { fill: 'HATCH', stroke: 'none' })
  }
  // pilasters and doors
  for (const p of xs) b += rect(X(p), Y(pil[1]), P * S, (pil[1] - pil[0]) * S)
  for (let i = 0; i < 2; i++) {
    const dx = xs[i] + P + G
    b += rect(X(dx), Y(door[1]), D * S, (door[1] - door[0]) * S, { fill: C.part })
    b += rect(X(dx + D - 4), Y(door[0] + 32), 2.2 * S, 5, { fill: C.ink, stroke: 'none' }) // latch
  }
  const hl = { fill: C.orange, stroke: C.orange }
  if (headrail) b += rect(X(0), Y(pil[1]) - 1, (runIn) * S, 2.2 * S, { ...hl, fill: C.orange })
  if (floorAnchors) for (const p of xs) {
    b += rect(X(p) - 3, Y(3), P * S + 6, 3 * S, { fill: emphasis === 'floor' || emphasis === 'support' ? C.orange : C.part, stroke: C.orange, sw: 1.5 }) // shoe
    if (emphasis === 'floor') b += rect(X(p + 2), floor, 2 * S, 2 * S + 2, { fill: C.orange, stroke: C.orange, sw: 1 }) // anchor into slab
  }
  if (ceilingAnchors) for (const p of xs) b += rect(X(p) - 3, Y(ceiling), P * S + 6, 3 * S, { fill: C.orange, stroke: C.orange })
  if (hangers) {
    b += rect(x0 + 22, Y(ceiling + 9), wallR - x0 - 22, 3 * S, { fill: C.orange, stroke: C.orange }) // steel support
    for (const p of xs) b += line(X(p + P / 2), Y(ceiling + 6), X(p + P / 2), Y(pil[1]), { stroke: C.orange, sw: 3 })
  }
  return { body: b, X, Y, xs, P, D, G, runIn, wallR, wallL: x0, under: floor + 52 }
}

const made = []

// 1–4. The four mounting styles. Door and floor-gap dimensions sit left of the wall, pilaster height to the right;
// callouts for floor parts sit under the slab.
const doorDims = (e) => vdim(e.wallL - 12, e.Y(70), e.Y(12), '58"', 'left') + vdim(e.wallL - 12, e.Y(12), e.Y(0), '12"', 'left')
{
  const e = elevation({ floor: 330, headrail: true, pil: [0, 83] })
  made.push(svg('mounting-overhead-braced', 470, 400, 'Overhead braced toilet partitions, front view',
    'Two stalls seen from the front. Pilasters stand on the floor in shoes; an aluminum headrail runs across their tops and fastens to both walls. Doors are 58 inches high, 12 inches above the floor; pilasters are 83 inches.',
    e.body + vdim(e.wallR + 34, e.Y(83), e.Y(0), '83"') + doorDims(e)
    + callout(1, e.X(28), e.Y(92), [e.X(28), e.Y(83) + 2]) + callout(2, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]) + callout(3, e.X(e.xs[2] + 3), e.Y(50), null)))
}
{
  const e = elevation({ floor: 300, headrail: false, pil: [0, 69], door: [11, 69], emphasis: 'floor' })
  made.push(svg('mounting-floor-mounted', 470, 370, 'Floor mounted (floor anchored) toilet partitions, front view',
    'Two stalls seen from the front. There is no headrail: pilasters are anchored into the structural concrete floor, which carries the whole load. Bobrick\'s floor-anchored pilasters are 69 inches high.',
    e.body + vdim(e.wallR + 34, e.Y(69), e.Y(0), '69"') + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 6), e.Y(-2)]) + callout(2, e.X(e.xs[0] + 3), e.Y(80), [e.X(e.xs[0] + 3), e.Y(70)])))
}
{
  const e = elevation({ floor: 400, ceiling: 96, plenum: true, pil: [13, 96], floorAnchors: false, hangers: true, wallH: 112 })
  made.push(svg('mounting-ceiling-hung', 470, 480, 'Ceiling hung toilet partitions, front view',
    'Two stalls seen from the front. Pilasters hang from structural steel above the finished ceiling and stop short of the floor, which stays completely clear. Bobrick\'s ceiling-hung pilasters are 83 inches for an 8-foot ceiling.',
    e.body + vdim(e.wallR + 34, e.Y(96), e.Y(13), '83"') + vdim(e.wallR + 34, e.Y(13), e.Y(0), 'clear') + vdim(e.wallL - 12, e.Y(70), e.Y(12), '58"', 'left')
    + callout(1, e.X(8), e.Y(116), [e.X(8), e.Y(106)]) + callout(2, e.X(e.xs[2] + 3) - 34, e.Y(86), [e.X(e.xs[2] + 3), e.Y(97)]) + callout(3, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(6)])))
}
{
  const e = elevation({ floor: 370, ceiling: 96, pil: [0, 96], ceilingAnchors: true, wallH: 100 })
  made.push(svg('mounting-floor-to-ceiling', 520, 440, 'Floor to ceiling toilet partitions, front view',
    'Two stalls seen from the front. Pilasters are anchored into the floor and into structure at the ceiling. The doors and panels stay standard height with the usual floor gap; only the pilasters run floor to ceiling.',
    e.body + vdim(e.wallR + 34, e.Y(96), e.Y(0), '96"  to ceiling') + doorDims(e)
    + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]) + callout(2, e.X(e.xs[2] + 3) - 30, e.Y(84), [e.X(e.xs[2] + 3), e.Y(94)]) + callout(3, e.X(e.xs[0] + 20), e.Y(6), null)))
}

// 5. All four side by side, for the hub
{
  const styles = [
    ['Overhead braced', { headrail: true, pil: [0, 83] }],
    ['Floor mounted', { pil: [0, 69], door: [11, 69], emphasis: 'floor' }],
    ['Ceiling hung', { ceiling: 96, plenum: true, pil: [13, 96], floorAnchors: false, hangers: true, wallH: 112 }],
    ['Floor to ceiling', { ceiling: 96, pil: [0, 96], ceilingAnchors: true }],
  ]
  let b = ''
  styles.forEach(([name, o], i) => {
    const e = elevation({ ...o, x0: 20, floor: 400, wallH: o.wallH ?? 100 })
    b += `<g transform="translate(${i * 300} 0)">${e.body}${text(e.X(e.runIn / 2) - 6, 458, name, { size: 18, weight: 700, anchor: 'middle' })}</g>`
  })
  made.push(svg('mounting-styles-compare', 1200, 480, 'The four bathroom partition mounting styles side by side',
    'Front views of overhead braced (headrail across the pilaster tops), floor mounted (pilasters anchored in the floor only), ceiling hung (pilasters hang from steel above the ceiling, floor clear) and floor to ceiling (pilasters anchored at floor and ceiling). The support system is shown in orange.', b))
}

// 6. Anatomy of a toilet partition (front view, one stall with its neighbours)
{
  const e = elevation({ floor: 330, headrail: true, pil: [0, 83], emphasis: 'none' })
  const dx = e.xs[0] + e.P + e.G
  let b = e.body
  // hinges on door 1 (left edge), latch + keeper on right edge
  b += rect(e.X(dx) - 2, e.Y(66), 7, 18, { fill: C.orange, stroke: C.orange }) + rect(e.X(dx) - 2, e.Y(20), 7, 18, { fill: C.orange, stroke: C.orange })
  b += rect(e.X(e.xs[1]) - 2, e.Y(44) - 4, 8, 14, { fill: C.orange, stroke: C.orange })
  made.push(svg('partition-anatomy', 470, 400, 'Parts of a toilet partition, front view',
    'Front view of a run of stalls with the parts named: headrail, pilaster, door, hinges, latch and keeper, pilaster shoe.',
    b + callout(1, e.X(60), e.Y(94), [e.X(60), e.Y(83) + 2]) + callout(2, e.X(e.xs[2] + 3), e.Y(50), null) + callout(3, e.X(dx + 12), e.Y(42), null)
    + callout(4, e.X(dx) - 26, e.Y(66) + 9, [e.X(dx) - 3, e.Y(66) + 9]) + callout(5, e.X(e.xs[1]) + 30, e.Y(30), [e.X(e.xs[1]) + 4, e.Y(44) + 3]) + callout(6, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)])))
}

// 7. Hinge types: gravity cam (elevation of the hinge edge), wrap-around (plan section), continuous (elevation)
{
  let b = ''
  const cap = (x, s) => text(x, 300, s, { size: 16, weight: 700, anchor: 'middle' })
  // gravity cam: pilaster + door edge, top pin, bottom cam
  b += rect(40, 30, 26, 240) + rect(72, 50, 90, 200)
  b += rect(60, 54, 24, 10, { fill: C.orange, stroke: C.orange }) + line(72, 50, 72, 70, { stroke: C.orange, sw: 3 })
  b += rect(58, 226, 28, 16, { fill: C.orange, stroke: C.orange }) + `<path d="M60 234 l8 -6 l8 6 l8 -6" stroke="#fff" stroke-width="2" fill="none"/>`
  b += callout(1, 200, 58, [86, 58]) + callout(2, 200, 234, [88, 234]) + cap(110, 'Gravity (cam)')
  // wrap-around, seen from above: one flange wraps the pilaster end, the other the door edge, joined at the knuckle
  const ox = 300
  b += rect(ox + 10, 120, 80, 26) + rect(ox + 116, 124, 100, 18)
  b += `<path d="M${ox + 66} 115 h28 v36 h-28" fill="none" stroke="${C.orange}" stroke-width="5" stroke-linejoin="round"/>`
  b += `<path d="M${ox + 140} 119 h-28 v28 h28" fill="none" stroke="${C.orange}" stroke-width="5" stroke-linejoin="round"/>`
  b += `<circle cx="${ox + 103}" cy="133" r="8" fill="${C.orange}"/>`
  b += text(ox + 45, 172, 'pilaster', { size: 13, fill: C.muted, anchor: 'middle' }) + text(ox + 170, 172, 'door', { size: 13, fill: C.muted, anchor: 'middle' })
  b += text(ox + 110, 214, 'seen from above', { size: 13, fill: C.muted, anchor: 'middle' }) + callout(3, ox + 103, 80, [ox + 103, 124]) + cap(ox + 110, 'Wrap-around')
  // continuous: full-height hinge along the door edge
  const cx = 600
  b += rect(cx + 20, 30, 26, 240) + rect(cx + 52, 50, 90, 200) + rect(cx + 44, 50, 10, 200, { fill: C.orange, stroke: C.orange })
  for (let y = 70; y < 250; y += 20) b += line(cx + 44, y, cx + 54, y, { stroke: '#fff', sw: 1 })
  b += callout(4, cx + 180, 150, [cx + 56, 150]) + cap(cx + 90, 'Continuous')
  made.push(svg('hinge-types', 800, 320, 'Bathroom stall hinge types',
    'Three common partition hinges: a gravity (cam) hinge with a pin at the top and an adjustable cam at the bottom; a wrap-around hinge whose flanges wrap the pilaster and door edges, seen from above; and a continuous hinge running the full height of the door.', b))
}

// 8. How to measure a replacement door
{
  let b = ''
  // elevation: opening between pilasters with the door
  b += rect(40, 30, 26, 300) + rect(256, 30, 26, 300)
  b += rect(74, 60, 174, 230, { fill: C.part })
  b += rect(74, 60, 174, 230, { fill: 'none', stroke: C.orange, sw: 2.5 })
  b += line(20, 330, 300, 330) + rect(20, 330, 280, 18, { fill: 'HATCH', stroke: 'none' })
  b += hdim(22, 74, 248, 'A  door width') + vdim(266 + 26, 60, 290, 'B  door height')
  b += hdim(384, 66, 256, 'C  opening between pilasters')
  b += vdim(28, 290, 330, 'D', 'left')
  // section: door thickness
  const sx = 420
  b += text(sx + 100, 46, 'Edge view', { size: 15, weight: 700, anchor: 'middle' })
  b += rect(sx + 92, 60, 18, 230, { fill: C.orange, stroke: C.orange }) + hdim(318, sx + 92, sx + 110, 'E  thickness')
  // plan: swing and hinge side
  const px = 560
  b += text(px + 90, 46, 'From outside the stall', { size: 15, weight: 700, anchor: 'middle' })
  b += rect(px + 10, 150, 22, 22) + rect(px + 150, 150, 22, 22) + line(px + 32, 161, px + 150, 161, { stroke: C.orange, sw: 4 })
  b += `<path d="M${px + 32} 161 A118 118 0 0 1 ${px + 150} 279" fill="none" stroke="${C.muted}" stroke-dasharray="5 5" stroke-width="1.5"/>`
  b += line(px + 32, 161, px + 32, 279, { stroke: C.orange, sw: 2, dash: '6 4' })
  b += text(px + 92, 300, 'F  inswing or outswing,', { size: 14, fill: C.muted, anchor: 'middle', weight: 600 }) + text(px + 92, 318, 'hinge on the left or right', { size: 14, fill: C.muted, anchor: 'middle', weight: 600 })
  b += text(px + 90, 130, 'stall inside ↓', { size: 13, fill: C.muted, anchor: 'middle' })
  made.push(svg('measure-replacement-door', 780, 400, 'How to measure a bathroom stall door for a replacement',
    'Measure A, the door width; B, the door height; C, the opening between the pilasters; D, the gap from the floor to the bottom of the door; E, the door thickness; and F, whether the door swings in or out and which side the hinge is on, seen from outside the stall.', b))
}

// 9. The four gaps in a standard stall
{
  const e = elevation({ floor: 330, headrail: true, pil: [0, 83], emphasis: 'none' })
  const dx = e.xs[0] + e.P + e.G
  let b = e.body
  const gap = (x, y, w, h) => rect(x, y, w, h, { fill: C.orange, stroke: 'none' })
  b += gap(e.X(dx) - 3, e.Y(70), 5, 58 * S) + gap(e.X(dx + e.D) - 2, e.Y(70), 5, 58 * S) // door edges
  b += rect(e.X(dx), e.Y(12), e.D * S, 12 * S - 1, { fill: C.orangeTint, stroke: C.orange, sw: 1.5, dash: '5 4' }) // under
  b += rect(e.X(dx), e.Y(83) + 7, e.D * S, 13 * S - 7, { fill: C.orangeTint, stroke: C.orange, sw: 1.5, dash: '5 4' }) // above
  b += gap(e.X(0) - 1, e.Y(83), 4, 83 * S) // at the wall
  made.push(svg('stall-gaps', 470, 400, 'The four gaps in a standard bathroom stall',
    'Front view of standard stalls with the four gaps marked: the vertical gaps at the door edges, the space under the doors and panels (12 inches), the space above them, and the gap where the partition meets the wall.',
    b + callout(1, e.X(dx + e.D) + 30, e.Y(56), [e.X(dx + e.D) + 1, e.Y(56)]) + callout(2, e.X(dx + 12), e.under, [e.X(dx + 12), e.Y(4)]) + callout(3, e.X(dx + 12), e.Y(77), null) + callout(4, e.wallL - 14, e.Y(40), [e.X(0), e.Y(40)])
    + vdim(e.wallR + 34, e.Y(12), e.Y(0), '12"')))
}

// 10. Latch and keeper (door edge meets the pilaster)
{
  let b = ''
  const unit = (ox, title, indicator) => {
    let u = rect(ox + 20, 40, 120, 220) + rect(ox + 146, 20, 34, 260)
    u += rect(ox + 92, 132, 48, 22, { fill: C.orange, stroke: C.orange, rx: 3 }) // latch housing on door
    u += rect(ox + 128, 138, 30, 10, { fill: C.ink, stroke: 'none' }) // bolt into keeper
    u += rect(ox + 150, 126, 22, 34, { fill: C.part, stroke: C.orange, sw: 2.5 }) // keeper on pilaster
    if (indicator) u += rect(ox + 40, 126, 34, 34, { fill: C.part, stroke: C.orange, sw: 2.5, rx: 17 }) + text(ox + 57, 148, '●', { size: 14, fill: C.orange, anchor: 'middle' })
    u += text(ox + 100, 300, title, { size: 16, weight: 700, anchor: 'middle' })
    return u
  }
  b += unit(40, 'Slide latch', false) + unit(360, 'Indicator latch', true)
  b += callout(1, 150, 100, [150, 132]) + callout(2, 240, 143, [212, 143]) + callout(3, 360 + 57, 100, [360 + 57, 126])
  b += text(120, 30, 'door', { size: 13, fill: C.muted, anchor: 'middle' }) + text(203, 14, 'pilaster', { size: 13, fill: C.muted, anchor: 'middle' })
  made.push(svg('latch-keeper', 640, 320, 'Bathroom stall latch and keeper',
    'Inside face of a stall door where it meets the pilaster. The latch is mounted on the door; its bolt slides into the keeper (strike) mounted on the pilaster. An indicator latch adds a visible occupied or vacant indicator.', b))
}

console.log(`${made.length} diagrams: ${made.join(', ')}`)
