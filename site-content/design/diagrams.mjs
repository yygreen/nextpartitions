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
function elevation({ x0 = 70, stalls = 4, P = 6, floor, ceiling = null, plenum = false, pil = [0, 83], headrail = false,
  floorAnchors = true, ceilingAnchors = false, hangers = false, door = [12, 70], wallH = 100, emphasis = 'support' }) {
  const Y = (inch) => floor - inch * S
  const D = 24, G = 0.6 // door, sightline gap (inches); P = pilaster width
  const xs = [] // pilaster x positions in inches from inner wall face
  let cur = 0.6 // first pilaster sits at the wall, with the wall gap
  for (let i = 0; i <= stalls; i++) { xs.push(cur); cur += P + G + D + G }
  const runIn = xs[stalls] + P + 0.6
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
  for (let i = 0; i < stalls; i++) {
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
  return { body: b, X, Y, xs, P, D, G, runIn, wallR, wallL: x0, under: floor + 52, last: xs[stalls] }
}

const made = []
const W = (e, label = 70) => Math.round(e.wallR + 22 + 34 + label)

// 1–4. The four mounting styles. Door and floor-gap dimensions sit left of the wall, pilaster height to the right;
// callouts for floor parts sit under the slab.
const doorDims = (e) => vdim(e.wallL - 12, e.Y(70), e.Y(12), '58"', 'left') + vdim(e.wallL - 12, e.Y(12), e.Y(0), '12"', 'left')
{
  const e = elevation({ floor: 330, headrail: true, pil: [0, 83] })
  made.push(svg('mounting-overhead-braced', W(e), 400, 'Overhead braced toilet partitions, front view',
    'Two stalls seen from the front. Pilasters stand on the floor in shoes; an aluminum headrail runs across their tops and fastens to both walls. Doors are 58 inches high, 12 inches above the floor; pilasters are 83 inches.',
    e.body + vdim(e.wallR + 34, e.Y(83), e.Y(0), '83"') + doorDims(e)
    + callout(1, e.X(28), e.Y(92), [e.X(28), e.Y(83) + 2]) + callout(2, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]) + callout(3, e.X(e.last + 3), e.Y(50), null)))
}
{
  const e = elevation({ floor: 300, headrail: false, P: 8, pil: [0, 69], door: [11, 69], emphasis: 'floor' })
  made.push(svg('mounting-floor-mounted', W(e), 370, 'Floor mounted (floor anchored) toilet partitions, front view',
    'Two stalls seen from the front. There is no headrail: pilasters are anchored into the structural concrete floor, which carries the whole load. Bobrick\'s floor-anchored pilasters are 69 inches high.',
    e.body + vdim(e.wallR + 34, e.Y(69), e.Y(0), '69"') + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 6), e.Y(-2)]) + callout(2, e.X(e.xs[0] + 3), e.Y(80), [e.X(e.xs[0] + 3), e.Y(70)])))
}
{
  const e = elevation({ floor: 400, ceiling: 96, plenum: true, pil: [13, 96], floorAnchors: false, hangers: true, wallH: 112 })
  made.push(svg('mounting-ceiling-hung', W(e), 480, 'Ceiling hung toilet partitions, front view',
    'Two stalls seen from the front. Pilasters hang from structural steel above the finished ceiling and stop short of the floor, which stays completely clear. Bobrick\'s ceiling-hung pilasters are 83 inches for an 8-foot ceiling.',
    e.body + vdim(e.wallR + 34, e.Y(96), e.Y(13), '83"') + vdim(e.wallR + 34, e.Y(13), e.Y(0), 'clear') + vdim(e.wallL - 12, e.Y(70), e.Y(12), '58"', 'left')
    + callout(1, e.X(8), e.Y(116), [e.X(8), e.Y(106)]) + callout(2, e.X(e.last + 3) - 34, e.Y(86), [e.X(e.last + 3), e.Y(97)]) + callout(3, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(6)])))
}
{
  const e = elevation({ floor: 370, ceiling: 96, pil: [0, 96], ceilingAnchors: true, wallH: 100 })
  made.push(svg('mounting-floor-to-ceiling', W(e, 130), 440, 'Floor to ceiling toilet partitions, front view',
    'Two stalls seen from the front. Pilasters are anchored into the floor and into structure at the ceiling. The doors and panels stay standard height with the usual floor gap; only the pilasters run floor to ceiling.',
    e.body + vdim(e.wallR + 34, e.Y(96), e.Y(0), '96"  to ceiling') + doorDims(e)
    + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]) + callout(2, e.X(e.last + 3) - 30, e.Y(84), [e.X(e.last + 3), e.Y(94)]) + callout(3, e.X(e.xs[0] + 20), e.Y(6), null)))
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
    const e = elevation({ ...o, x0: 20, stalls: 2, floor: 400, wallH: o.wallH ?? 100 })
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
  made.push(svg('partition-anatomy', W(e), 400, 'Parts of a toilet partition, front view',
    'Front view of a run of stalls with the parts named: headrail, pilaster, door, hinges, latch and keeper, pilaster shoe.',
    b + callout(1, e.X(60), e.Y(94), [e.X(60), e.Y(83) + 2]) + callout(2, e.X(e.last + 3), e.Y(50), null) + callout(3, e.X(dx + 12), e.Y(42), null)
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
  made.push(svg('stall-gaps', W(e), 400, 'The four gaps in a standard bathroom stall',
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

// ---------- mounting-style sheets: plan, front elevation, side view, details ----------
// Like a manufacturer's data sheet: several views of the same stalls, each its own SVG so they stack on a phone.
// The sheet layout is in diagrams/sheets.json; the page build renders it as one figure.
// Sourced sizes only: accessible 60" wide, 59" deep min (floor-mounted WC) and a 32" min clear door (2010 ADA
// 604.8.1.1, 404.2.3); ambulatory 35–37" by 60" min (604.8.2.1); 30" by 60" min (IPC 405.3.1); toilet centerline
// 16–18" / 17–19" from the side wall (604.2); anchors per style (Bobrick, NY OGS).
const sheets = {}


// Plan, seen from above: back wall at the top, accessible + ambulatory + standard stall, doors and swings.
function plan(name) {
  const s = 3.2, x0 = 30, y0 = 40
  const X = (i) => x0 + 22 + i * s, Y = (i) => y0 + 14 + i * s
  const widths = [60, 36, 30], depth = 60
  const run = widths.reduce((a, b) => a + b, 0)
  let b = ''
  // walls: back (top), left, right
  b += rect(x0, y0, run * s + 44, 14, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(run), Y(0))
  b += rect(x0, y0, 22, depth * s + 60, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(0), Y(depth) + 46)
  b += rect(X(run), y0, 22, depth * s + 60, { fill: 'HATCH', stroke: 'none' }) + line(X(run), Y(0), X(run), Y(depth) + 46)
  let cx = 0
  const toilet = (c) => rect(X(c) - 10 * s / 2, Y(0) + 2, 20 * s / 2, 8 * s / 2 + 2, { rx: 2 }) + `<ellipse cx="${X(c)}" cy="${Y(15)}" rx="${7 * s / 2 + 2}" ry="${11 * s / 2 + 4}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>`
  widths.forEach((w, i) => {
    const L = cx, R = cx + w
    // dividing panel on the right of each stall except the last (the wall)
    if (i < widths.length - 1) b += rect(X(R) - 1.5, Y(1), 3, (depth - 6) * s, { fill: C.part })
    // front: pilasters at both ends, door between
    const doorW = i === 0 ? 34 : i === 1 ? 32 : 22
    const doorL = i === 0 ? R - 4 - doorW : L + (w - doorW) / 2 // accessible: door at the end away from the toilet (604.8.1.2)
    b += rect(X(L) + (i ? 1.5 : 0), Y(depth) - 3, (doorL - L) * s - (i ? 1.5 : 0), 6, { fill: C.part })
    b += rect(X(doorL + doorW), Y(depth) - 3, (R - doorL - doorW) * s - (i < 2 ? 1.5 : 0), 6, { fill: C.part })
    // door leaf and swing: accessible and ambulatory swing out, standard swings in
    const hx = X(doorL), out = i < 2
    const ex = hx, ey = out ? Y(depth) + doorW * s : Y(depth) - doorW * s
    b += line(hx, Y(depth), ex, ey, { stroke: C.ink, sw: 2.5 })
    b += `<path d="M${X(doorL + doorW)} ${Y(depth)} A${doorW * s} ${doorW * s} 0 0 ${out ? 1 : 0} ${ex} ${ey}" fill="none" stroke="${C.muted}" stroke-width="1" stroke-dasharray="5 5"/>`
    // toilet: accessible 17" from the side wall, others centred
    b += toilet(i === 0 ? L + 17 : L + w / 2)
    // grab bars: accessible on the side wall and rear wall, ambulatory on both sides
    if (i === 0) b += line(X(L) + 4, Y(12), X(L) + 4, Y(54), { stroke: C.orange, sw: 4, cap: true }) + line(X(L + 4), Y(0) + 4, X(L + 40), Y(0) + 4, { stroke: C.orange, sw: 4, cap: true })
    if (i === 1) b += line(X(L) + 4, Y(12), X(L) + 4, Y(52), { stroke: C.orange, sw: 4, cap: true }) + line(X(R) - 5, Y(12), X(R) - 5, Y(52), { stroke: C.orange, sw: 4, cap: true })
    b += text(X(L + w / 2), Y(30), ['Accessible', 'Ambulatory', 'Standard'][i], { size: 12, weight: 700, anchor: 'middle' })
    b += hdim(Y(depth) + 36 * s + 30, X(L), X(R), ['60" min', '35–37"', '30" min'][i])
    if (i === 0) b += `<path d="M${X(doorL)} ${Y(depth) + 8} h${doorW * s}" stroke="${C.orange}" stroke-width="1"/>` + text(X(doorL + doorW / 2), Y(depth) + 22, '32" min clear', { size: 11, fill: C.muted, anchor: 'middle', weight: 600 })
    cx = R
  })
  b += vdim(X(run) + 36, Y(0), Y(depth), '60" min')
  b += text(X(run / 2), y0 - 14, 'seen from above · back wall at the top', { size: 12, fill: C.muted, anchor: 'middle' })
  return svg(name, Math.round(X(run) + 100), Math.round(Y(depth) + 36 * s + 46), 'Plan view of three toilet compartments',
    'Seen from above: an accessible compartment 60 inches wide with grab bars and an outswing door at least 32 inches clear, an ambulatory compartment 35 to 37 inches wide with grab bars on both sides, and a standard compartment at least 30 inches wide with an inswing door. All are at least 60 inches deep.', b)
}

// Side view through a stall: looking at a dividing panel, back wall on the left, the front (pilaster) on the right.
function side(name, style) {
  const s = 3.2, floor = style === 'ch' || style === 'ftc' ? 380 : 330, x0 = 34
  const Y = (i) => floor - i * s, X = (i) => x0 + 22 + i * s
  const depth = 60, wallH = style === 'ch' ? 112 : 100
  let b = rect(x0 - 10, floor, (depth + 14) * s + 30, 26, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 10, floor, X(depth + 12), floor)
  b += rect(x0, Y(wallH), 22, wallH * s, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(wallH), X(0), floor)
  if (style === 'ch' || style === 'ftc') b += line(X(0), Y(96), X(depth + 12), Y(96))
  if (style === 'ch') b += rect(X(0), Y(110), (depth + 12) * s, 14 * s - 2, { fill: 'HATCH', stroke: 'none' }) + rect(X(depth - 6), Y(105), 14 * s, 3 * s, { fill: C.orange, stroke: C.orange }) + line(X(depth - 1), Y(102), X(depth - 1), Y(96), { stroke: C.orange, sw: 3 })
  // toilet (floor-mounted), panel, pilaster seen edge-on
  b += rect(X(1), Y(70), (depth - 7) * s, 58 * s, { fill: C.part })
  // toilet in front of the panel: tank on the back wall, bowl, pedestal
  b += rect(X(0) + 2, Y(31), 8 * s, 15 * s, { rx: 3 }) + `<path d="M${X(8)} ${Y(17.5)} h${18 * s} q${3 * s} 0 ${3 * s} ${2 * s} v${1.5 * s} h-${21 * s} z" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>` + `<path d="M${X(11)} ${Y(14)} h${10 * s} l-${2 * s} ${14 * s} h-${6 * s} z" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>`
  const pil = { ob: [0, 83], fm: [0, 69], ch: [13, 96], ftc: [0, 96] }[style]
  b += rect(X(depth - 6), Y(pil[1]), 6 * s, (pil[1] - pil[0]) * s, { fill: C.part })
  // brackets: wall and pilaster, top and bottom
  for (const h of [64, 18]) b += rect(X(1), Y(h), 2 * s, 6, { fill: C.ink, stroke: 'none' }) + rect(X(depth - 8), Y(h), 2 * s, 6, { fill: C.ink, stroke: 'none' })
  if (style === 'ob') b += rect(X(depth - 7), Y(83) - 6, 8 * s, 6, { fill: C.orange, stroke: C.orange })
  if (style !== 'ch') b += rect(X(depth - 6) - 3, Y(3), 6 * s + 6, 3 * s, { fill: C.orange, stroke: C.orange })
  if (style === 'ftc') b += rect(X(depth - 6) - 3, Y(96), 6 * s + 6, 3 * s, { fill: C.orange, stroke: C.orange })
  b += vdim(X(depth + 6), Y(70), Y(12), '58"') + vdim(X(depth + 6), Y(12), Y(0), '12"')
  b += text(X(1), floor + 44, 'back wall', { size: 12, fill: C.muted }) + text(X(depth - 3), floor + 44, 'front', { size: 12, fill: C.muted, anchor: 'middle' })
  return svg(name, Math.round(X(depth + 6) + 60), floor + 56, 'Side view through a toilet compartment',
    'Looking at a dividing panel from inside the stall: the toilet against the back wall, the panel held by brackets at the wall and the pilaster, 58 inches high and 12 inches above the floor, and the pilaster at the front.', b)
}

// Detail circles, drawn at larger scale.
function detail(name, kind) {
  const W = 390, H = 280, cx = 150, cy = 140, r = 118
  let b = `<clipPath id="c-${name}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#c-${name})">`
  const lab = []
  if (kind === 'headrail') {
    b += rect(110, 120, 44, 200) + `<path d="M98 120 h68 v-22 q-8 -16 -34 -16 q-26 0 -34 16 z" fill="${C.orange}"/>` + rect(166, 132, 102, 150, { fill: C.part }) + line(166, 132, 268, 132, { stroke: C.muted, sw: 1, dash: '5 4' })
    b += line(122, 112, 122, 150, { stroke: C.ink, sw: 2.5 }) + line(142, 112, 142, 150, { stroke: C.ink, sw: 2.5 })
    lab.push([214, 66, 'anti-grip headrail', [160, 92]], [40, 190, 'pilaster', [110, 190]], [284, 215, 'door top in line', [250, 133]], [284, 160, 'two fasteners', [142, 140]])
  }
  if (kind === 'anchor' || kind === 'anchor-ob') {
    b += rect(0, 170, W, 120, { fill: 'HATCH', stroke: 'none' }) + line(0, 170, W, 170)
    b += rect(108, 20, 50, 128) + rect(98, 136, 70, 34, { fill: C.orange, stroke: C.orange }) + line(133, 148, 133, 222, { stroke: C.ink, sw: 4 }) + rect(126, 172, 14, 50, { fill: C.ink, stroke: 'none' })
    b += '</g>' + vdim(286, 170, 222, kind === 'anchor' ? '2" min into' : '1-3/4" min') + (kind === 'anchor' ? vdim(286, 222, 266, '3" min slab') : '') + `<g clip-path="url(#c-${name})">` + line(140, 170, 286, 170, { stroke: C.muted, sw: 1, dash: '3 3' }) + line(140, 222, 286, 222, { stroke: C.muted, sw: 1, dash: '3 3' })
    lab.push([24, 60, 'pilaster', [108, 70]], [20, 128, 'shoe', [98, 150]], [24, 250, 'anchor', [128, 205]])
  }
  if (kind === 'hanger') {
    b += rect(0, 0, W, 120, { fill: 'HATCH', stroke: 'none' }) + rect(60, 40, 180, 22, { fill: C.orange, stroke: C.orange }) + line(0, 120, W, 120, { sw: 2.5 })
    b += line(150, 62, 150, 160, { stroke: C.orange, sw: 5 }) + rect(118, 150, 64, 160) + rect(112, 120, 76, 10, { fill: C.part })
    lab.push([20, 30, 'structural steel (by others)', [80, 50]], [284, 100, 'hanger', [152, 100]], [8, 146, 'finished ceiling', [60, 120]], [284, 200, 'pilaster', [182, 200]])
  }
  if (kind === 'ceiling-anchor') {
    b += rect(0, 0, W, 110, { fill: 'HATCH', stroke: 'none' }) + line(0, 110, W, 110, { sw: 2 })
    b += rect(108, 140, 50, 160) + rect(98, 110, 70, 30, { fill: C.orange, stroke: C.orange }) + line(133, 70, 133, 140, { stroke: C.ink, sw: 4 })
    lab.push([10, 80, 'structure at the ceiling', [70, 95]], [284, 128, 'ceiling shoe', [168, 125]], [284, 220, 'pilaster', [158, 220]])
  }
  if (kind === 'bracket') {
    // seen from above: panel end meets the pilaster, held by a bracket on each side
    b += rect(40, 120, 120, 26, { fill: C.part }) + rect(156, 70, 34, 140, { fill: C.part })
    b += `<path d="M120 112 h38 v42 h-38" fill="none" stroke="${C.orange}" stroke-width="5" stroke-linejoin="round"/>`
    lab.push([20, 90, 'panel', [70, 120]], [284, 80, 'pilaster', [190, 90]], [284, 220, 'bracket', [158, 154]])
    b += text(150, 270, 'seen from above', { size: 12, fill: C.muted, anchor: 'middle' })
  }
  b += `</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  for (const [x, y, t, to] of lab) b += line(x < cx ? x + 4 : x - 4, y - 4, to[0], to[1], { stroke: C.orange, sw: 1.2 }) + `<circle cx="${to[0]}" cy="${to[1]}" r="2.5" fill="${C.orange}"/>` + `<text x="${x}" y="${y}" font-size="13" font-weight="600" fill="${C.ink}" text-anchor="${x < cx ? 'start' : 'start'}" paint-order="stroke" stroke="#fff" stroke-width="4">${esc(t)}</text>`
  return svg(name, W, H, `Detail: ${kind}`, ({ headrail: 'The anti-grip aluminum headrail on top of a pilaster, fastened with two fasteners, with the door top in line with it.', anchor: 'The pilaster foot: a shoe covers the leveling hardware and the anchor goes at least 2 inches into structural concrete at least 3 inches thick (Bobrick).', 'anchor-ob': 'The pilaster foot: a shoe covers the leveling hardware and the anchor goes at least 1-3/4 inches into the floor (NY OGS spec for overhead-braced units).', hanger: 'The pilaster hangs on a hanger from structural steel above the finished ceiling.', 'ceiling-anchor': 'The pilaster top is anchored to structure at the ceiling, under a ceiling shoe.', bracket: 'Seen from above: the panel end is held to the pilaster by a bracket on each side.' })[kind], b)
}

const STYLES = {
  'mounting-overhead-braced': ['ob', ['headrail', 'anchor-ob', 'bracket']],
  'mounting-floor-mounted': ['fm', ['anchor', 'bracket']],
  'mounting-ceiling-hung': ['ch', ['hanger', 'bracket']],
  'mounting-floor-to-ceiling': ['ftc', ['anchor', 'ceiling-anchor']],
}
const planName = plan('sheet-plan')
for (const [front, [style, dets]] of Object.entries(STYLES)) {
  const views = [
    { file: `${planName}.svg`, label: 'Plan', wide: true },
    { file: `${front}.svg`, label: 'Front elevation', wide: true },
    { file: `${side(`${front}-side`, style)}.svg`, label: 'Side view' },
    ...dets.map((d, i) => ({ file: `${detail(`${front}-detail-${d}`, d)}.svg`, label: `Detail ${String.fromCharCode(65 + i)}` })),
  ]
  sheets[front] = views
}
writeFileSync(new URL('sheets.json', OUT), JSON.stringify(sheets, null, 2) + '\n')

console.log(`${made.length} diagrams: ${made.join(', ')}; sheets: ${Object.keys(sheets).join(', ')}`)
