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
// Drawings that explain a principle rather than follow a manufacturer's drawing say so on the drawing.
const SCHEMATIC = new Set(['mounting-styles-compare', 'partition-anatomy', 'hinge-types', 'measure-replacement-door', 'stall-gaps', 'latch-keeper',
  'material-section-phenolic', 'material-section-solid-plastic', 'material-section-plastic-laminate', 'material-section-powder-coated-steel',
  'material-section-stainless-steel', 'material-sections-compare', 'urinal-spacing', 'measure-new-restroom-plan', 'measure-new-restroom-section'])
// `frame`: a wider canvas, with the drawing centred in it (standalone drawings are 780 wide, the content column).
function svg(name, w, h, title, desc, body, frame) {
  if (frame > w) { body = `<g transform="translate(${(frame - w) / 2} 0)">${body}</g>`; w = frame }
  // No caption line on drawings: figures are presented as our own (design-language.md).
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
    b += rect(X(p) - 3, Y(4), P * S + 6, 4 * S, { fill: emphasis === 'floor' || emphasis === 'support' ? C.orange : C.part, stroke: C.orange, sw: 1.5 }) // shoe
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
    'Two stalls seen from the front. There is no headrail: pilasters are anchored into the structural concrete floor, which carries the whole load. Floor-anchored pilasters are 69 inches high.',
    e.body + vdim(e.wallR + 34, e.Y(69), e.Y(0), '69"') + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 6), e.Y(-2)]) + callout(2, e.X(e.xs[0] + 3), e.Y(80), [e.X(e.xs[0] + 3), e.Y(70)])))
}
{
  const e = elevation({ floor: 400, ceiling: 96, plenum: true, pil: [13, 96], floorAnchors: false, hangers: true, wallH: 112 })
  made.push(svg('mounting-ceiling-hung', W(e), 480, 'Ceiling hung toilet partitions, front view',
    'Two stalls seen from the front. Pilasters hang from structural steel above the finished ceiling and stop short of the floor, which stays completely clear. Ceiling-hung pilasters are 83 inches for an 8-foot ceiling.',
    e.body + vdim(e.wallR + 34, e.Y(96), e.Y(13), '83"') + vdim(e.wallR + 34, e.Y(13), e.Y(0), 'clear') + vdim(e.wallL - 12, e.Y(70), e.Y(12), '58"', 'left')
    + callout(1, e.X(8), e.Y(116), [e.X(8), e.Y(106)]) + callout(2, e.X(e.last + 3) - 34, e.Y(86), [e.X(e.last + 3), e.Y(97)]) + callout(3, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(6)]), 780))
}
{
  const e = elevation({ floor: 370, ceiling: 96, pil: [0, 96], ceilingAnchors: true, wallH: 100 })
  made.push(svg('mounting-floor-to-ceiling', W(e, 130), 440, 'Floor to ceiling toilet partitions, front view',
    'Two stalls seen from the front. Pilasters are anchored into the floor and into structure at the ceiling. The doors and panels stay standard height with the usual floor gap; only the pilasters run floor to ceiling.',
    e.body + vdim(e.wallR + 34, e.Y(96), e.Y(0), '96"  to ceiling') + doorDims(e)
    + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]) + callout(2, e.X(e.last + 3) - 30, e.Y(84), [e.X(e.last + 3), e.Y(94)]) + callout(3, e.X(e.xs[0] + 20), e.Y(6), null), 780))
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
    + callout(4, e.X(dx) - 26, e.Y(66) + 9, [e.X(dx) - 3, e.Y(66) + 9]) + callout(5, e.X(e.xs[1]) + 30, e.Y(30), [e.X(e.xs[1]) + 4, e.Y(44) + 3]) + callout(6, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]), 780))
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
    + vdim(e.wallR + 34, e.Y(12), e.Y(0), '12"'), 780))
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
// Like a manufacturer's data sheet, drawn from two of them (downloaded and read 2026-10-26):
//   Bradley, Phenolic Floor-Mounted Overhead-Braced PH400 Series (media.bradleycorp.com/view/28555): the example
//     layout (ADA 60-1/2", ambulatory 36-1/2", standard 36" + 36" = 169"; 61-1/4" to face), door positions and
//     swings, 12" + 58" + 12" = 82" to the headrail, 4" shoes. Widths of doors and pilasters are scaled from its
//     front view and not dimensioned.
//   Bobrick 1080 Series technical data (bobrick.com/wp-content/uploads/1080_td.pdf): stile heights (floor-anchored
//     69", overhead-braced 83", ceiling-hung 83" for a 96" ceiling, floor-to-ceiling up to 120"), the floor anchor
//     (leveling bar, threaded rods, shoe retainer, wedge anchor, 4" shoe; 2" into 3" structural concrete), the
//     ceiling leveling device (I-beam by others, bevel washer, spacer, threaded rod, leveling bar), the headrail
//     (extruded aluminum, sloping top, grip-resistant face, wall bracket) and the U-bracket.
//   Grab bars: 2010 ADA Standards 604.5 (side bar 42" min, 12" max from the rear wall; rear bar 36" min) and
//     604.8.2.3 (ambulatory: both sides).
const sheets = {}
const LAYOUT = { stalls: [60.5, 36.5, 36, 36], depth: 61.25 } // Bradley PH400 example
// Front, left to right (inches, scaled from Bradley's front view): pilaster, door, pilaster, door …
const FRONT = [['p', 3.5], ['d', 36], ['p', 22], ['d', 34], ['p', 8.5], ['d', 24], ['p', 12], ['d', 24], ['p', 5]]
const note = (x, y, t, anchor = 'start', size = 11) => text(x, y, t, { size, fill: C.muted, anchor, weight: 500 })

function plan(name) {
  const s = 3.2, x0 = 30, y0 = 64
  const X = (i) => x0 + 22 + i * s, Y = (i) => y0 + 14 + i * s
  const { stalls, depth } = LAYOUT
  const run = stalls.reduce((a, b) => a + b, 0)
  let b = ''
  b += rect(x0, y0, run * s + 44, 14, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(run), Y(0))
  b += rect(x0, y0, 22, depth * s + 50, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(0), Y(depth) + 36)
  b += rect(X(run), y0, 22, depth * s + 50, { fill: 'HATCH', stroke: 'none' }) + line(X(run), Y(0), X(run), Y(depth) + 36)
  const toilet = (c) => rect(X(c) - 8 * s / 2, Y(0) + 2, 16 * s / 2, 6 * s / 2, { rx: 2 }) + `<ellipse cx="${X(c)}" cy="${Y(17)}" rx="${7.5 * s}" ry="${12.5 * s}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/><ellipse cx="${X(c)}" cy="${Y(18.5)}" rx="${4.5 * s}" ry="${8 * s}" fill="none" stroke="${C.ink}" stroke-width="1"/>`
  const bar = (x1, y1, x2, y2) => line(x1, y1, x2, y2, { stroke: C.orange, sw: 4, cap: true })
  // dividing panels
  let L = 0
  const edges = stalls.map((w) => { const e = [L, L + w]; L += w; return e })
  edges.slice(0, -1).forEach(([, R]) => { b += rect(X(R) - 1.5, Y(0), 3, depth * s - 2, { fill: C.part }) })
  // front line with doors, positions from Bradley's plan
  // ADA: door at the wall end, hinged at the wall pilaster, swings out; toilet against the dividing panel.
  // Ambulatory: door hinged at its left, swings out. Standard: hinged at the left, swing in.
  const fx = []; let cur = 0
  for (const [k, w] of FRONT) { fx.push([k, cur, cur + w]); cur += w }
  const doors = fx.filter((f) => f[0] === 'd')
  fx.filter((f) => f[0] === 'p').forEach(([, a1, a2]) => { b += rect(X(a1), Y(depth) - 3, (a2 - a1) * s, 6, { fill: C.part }) })
  doors.forEach(([, d1, d2], i) => {
    const w = d2 - d1, out = i < 2, hx = X(d1)
    const ang = out ? 25 : -25, rad = (ang * Math.PI) / 180
    const ex = hx + Math.cos(rad) * w * s, ey = Y(depth) + Math.sin(rad) * w * s
    b += line(hx, Y(depth), ex, ey, { stroke: C.ink, sw: 2.5 })
    b += `<path d="M${X(d2)} ${Y(depth)} A${w * s} ${w * s} 0 0 ${out ? 1 : 0} ${ex} ${ey}" fill="none" stroke="${C.muted}" stroke-width="1" stroke-dasharray="5 5"/>`
  })
  // toilets: ADA centreline 17" from the dividing panel (604.2: 16–18"); others centred
  b += toilet(edges[0][1] - 17) + toilet(edges[1][0] + 18.25) + toilet(edges[2][0] + 18) + toilet(edges[3][0] + 18)
  // grab bars (604.5): ADA side bar on the panel by the toilet, 12" from the rear wall, 42" long; rear bar 36"
  const pR = X(edges[0][1]) - 6
  b += bar(pR, Y(12), pR, Y(54)) + bar(X(edges[0][1] - 17 - 24), Y(0) + 6, X(edges[0][1] - 17 + 12), Y(0) + 6)
  // ambulatory: side bars on both panels
  b += bar(X(edges[1][0]) + 6, Y(12), X(edges[1][0]) + 6, Y(54)) + bar(X(edges[1][1]) - 6, Y(12), X(edges[1][1]) - 6, Y(54))
  const lbl = ['ADA', 'Ambulatory', 'Standard', 'Standard'], sub = ['60" clearance', '36" clearance', '', '']
  edges.forEach(([l, r], i) => {
    const cx = i === 0 ? l + 22 : (l + r) / 2
    b += text(X(cx), Y(40), lbl[i], { size: 12, weight: 700, anchor: 'middle' }) + (sub[i] ? text(X(cx), Y(40) + 15, sub[i], { size: 11, fill: C.muted, anchor: 'middle', weight: 600 }) : '')
    b += hdim(y0 - 10, X(l), X(r), ['60-1/2"', '36-1/2"', '36"', '36"'][i])
  })
  b += hdim(y0 - 40, X(0), X(run), '169"')
  b += vdim(X(run) + 36, Y(0), Y(depth), '61-1/4" to face')
  return svg(name, Math.round(X(run) + 150), Math.round(Y(depth) + 50 + 36 * s * 0.45 + 10), 'Plan view of a row of toilet compartments',
    'Seen from above: an ADA compartment 60-1/2 inches wide with the toilet beside the dividing panel, grab bars and an outswing door at the wall end; an ambulatory compartment 36-1/2 inches wide with grab bars on both sides and an outswing door; two standard compartments 36 inches wide with inswing doors; 169 inches overall and 61-1/4 inches deep to the face.', b)
}

// Front elevation of the same row. Heights per style; hardware visible from outside: hinges and pulls on the
// outswing doors, latch indicators on all.
function front(name, style) {
  const s = 3.2, x0 = 70
  const H = { ob: { pil: [1, 82], rail: 82, floor: 330, wall: 100 }, fm: { pil: [1, 70], floor: 300, wall: 92 }, ch: { pil: [13, 96], ceil: 96, floor: 400, wall: 112, plenum: true }, ftc: { pil: [0, 96], ceil: 96, floor: 370, wall: 100 } }[style]
  const floor = H.floor, Y = (i) => floor - i * s, X = (i) => x0 + 22 + i * s
  const run = FRONT.reduce((a, [, w]) => a + w, 0), wallR = X(run)
  let b = rect(x0 - 10, floor, run * s + 74, 30, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 10, floor, wallR + 32, floor)
  b += rect(x0, Y(H.wall), 22, H.wall * s, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(H.wall), X(0), floor)
  b += rect(wallR, Y(H.wall), 22, H.wall * s, { fill: 'HATCH', stroke: 'none' }) + line(wallR, Y(H.wall), wallR, floor)
  if (H.ceil) b += line(X(0), Y(H.ceil), wallR, Y(H.ceil))
  if (H.plenum) b += rect(X(0), Y(H.ceil + 14), run * s, 14 * s - 2, { fill: 'HATCH', stroke: 'none' })
  let cur = 0, di = 0
  const pilXs = []
  for (const [k, w] of FRONT) {
    if (k === 'p') { b += rect(X(cur), Y(H.pil[1]), w * s, (H.pil[1] - H.pil[0]) * s); pilXs.push([cur, w]) }
    else {
      b += rect(X(cur + 0.3), Y(70), (w - 0.6) * s, 58 * s)
      const out = di < 2
      if (out) { // hinges on the hinge (left) edge, pull and latch indicator near the latch edge
        b += rect(X(cur + 0.3) - 2, Y(65), 7, 14, { fill: C.ink, stroke: 'none' }) + rect(X(cur + 0.3) - 2, Y(20), 7, 14, { fill: C.ink, stroke: 'none' })
        b += rect(X(cur + w - 9), Y(43), 3, 22, { fill: C.ink, stroke: 'none' })
      }
      b += `<circle cx="${X(cur + w - 4)}" cy="${Y(40)}" r="4" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`
      di++
    }
    cur += w
  }
  const hl = { fill: C.orange, stroke: C.orange }
  if (H.rail) b += rect(X(0), Y(H.rail) - 2, run * s, 2 * s, hl)
  if (style !== 'ch') for (const [x, w] of pilXs) b += rect(X(x) - 1, Y(4), w * s + 2, 4 * s, { ...hl, fill: C.orange }) // 4" shoes
  if (style === 'ftc') for (const [x, w] of pilXs) b += rect(X(x) - 1, Y(96), w * s + 2, 3 * s, hl)
  if (style === 'ch') {
    b += rect(X(0), Y(H.ceil + 9), run * s, 3 * s, hl)
    for (const [x, w] of pilXs) b += line(X(x + w / 2), Y(H.ceil + 6), X(x + w / 2), Y(H.pil[1]), { stroke: C.orange, sw: 3 })
  }
  // numbered callouts, keyed in the page text under the sheet
  const [p2x, p2w] = pilXs[1], under = floor + 30
  if (style === 'ob') b += callout(1, X(60), Y(91), [X(60), Y(82) - 2]) + callout(2, X(p2x + p2w / 2) + 40, under, [X(p2x + p2w / 2), Y(2)]) + callout(3, X(p2x + p2w / 2), Y(50), null)
  if (style === 'fm') b += callout(1, X(p2x + p2w / 2) + 40, under, [X(p2x + p2w / 2), Y(2)]) + callout(2, X(p2x + p2w / 2), Y(80), [X(p2x + p2w / 2), Y(71)])
  if (style === 'ch') b += callout(1, X(20), Y(H.ceil + 12) - 2, null) + callout(2, X(p2x + p2w / 2) + 34, Y(91), [X(p2x + p2w / 2), Y(99)]) + callout(3, X(p2x + p2w / 2), Y(6), null)
  if (style === 'ftc') b += callout(1, X(p2x + p2w / 2) + 40, under, [X(p2x + p2w / 2), Y(2)]) + callout(2, X(p2x + p2w / 2) + 34, Y(88), [X(p2x + p2w / 2), Y(95)]) + callout(3, X(p2x + p2w + 10), Y(60), null)
  // dimensions: only the ones the sources print
  b += vdim(x0 - 12, Y(70), Y(12), '58"', 'left') + vdim(x0 - 12, Y(12), Y(0), '12"', 'left')
  if (style === 'ob') b += vdim(x0 - 12, Y(82), Y(70), '12"', 'left') + vdim(wallR + 34, Y(82), Y(0), '82"')
  if (style === 'fm') b += vdim(wallR + 34, Y(70), Y(1), '69" stile')
  if (style === 'ch') b += vdim(wallR + 34, Y(96), Y(13), '83" stile') + vdim(wallR + 34, Y(13), Y(0), 'clear')
  if (style === 'ftc') b += vdim(wallR + 34, Y(96), Y(0), 'to ceiling')
  const src = style === 'ob' ? 'Heights: Bradley PH400.' : 'Heights: Bobrick 1080 Series.'
  const w = Math.round(wallR + 22 + 34 + (style === 'ftc' ? 90 : 80))
  return svg(name, w, floor + 64, 'Front elevation of a row of toilet compartments',
    `Front view of the same four compartments. Doors 58 inches high, 12 inches above the floor; the ADA and ambulatory doors swing out, so their hinges and pulls show on this side.`, b)
}

// Side and detail views sit two across on desktop (about 370 px each), so they are drawn at that size, landscape
// (400 x 250), with their labels beside the drawing: text then shows at about 13–14 px.
const SV = { w: 400, h: 250 }
// A label beside a drawing: ink text, orange leader ending in a dot on the part. Lines after the first sit below it.
function label(x, y, lines, to, anchor = 'start') {
  const ls = [].concat(lines)
  const lx = anchor === 'start' ? x - 4 : x + 4
  return line(lx, y - 5, to[0], to[1], { stroke: C.orange, sw: 1.2 }) + `<circle cx="${to[0]}" cy="${to[1]}" r="2.5" fill="${C.orange}"/>`
    + ls.map((t, i) => `<text x="${x}" y="${y + i * 16}" font-size="14" font-weight="500" fill="${C.ink}" text-anchor="${anchor}" paint-order="stroke" stroke="#fff" stroke-width="4">${esc(t)}</text>`).join('')
}
// Spread label baselines so they keep at least `gap` apart, near the y of what they point at.
function spread(items, gap, lo, hi) {
  const s = [...items].sort((a, b) => a.y - b.y)
  const extra = (it) => 16 * ((it.lines ?? 1) - 1) // further lines below the baseline
  let y = lo
  for (const it of s) { it.y = Math.max(it.y, y); y = it.y + extra(it) + gap }
  let lim = hi
  for (let i = s.length - 1; i >= 0; i--) { s[i].y = Math.min(s[i].y, lim - extra(s[i])); lim = s[i].y - gap }
  return s
}

// Side view through a stall: looking at a dividing panel, front (pilaster) on the left as on Bradley's sheet,
// back wall on the right. Labels on the left, by the front; heights to the right of the back wall.
function side(name, style) {
  const s = 1.75, x0 = 196, depth = LAYOUT.depth, wt = 14
  const floor = 206, wallH = style === 'ch' ? 112 : 100
  const Y = (i) => floor - i * s, X = (i) => x0 + i * s
  const pil = { ob: [1, 82], fm: [1, 70], ch: [13, 96], ftc: [0, 96] }[style]
  const ceil = style === 'ch' || style === 'ftc'
  let b = rect(x0 - 26, floor, X(depth) + wt - x0 + 26, 12, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 26, floor, X(depth) + wt, floor)
  b += rect(X(depth), Y(wallH), wt, wallH * s, { fill: 'HATCH', stroke: 'none' }) + line(X(depth), Y(wallH), X(depth), floor)
  if (ceil) b += line(x0 - 26, Y(96), X(depth), Y(96))
  if (style === 'ch') b += rect(x0 - 26, Y(110), depth * s + 26, 14 * s - 2, { fill: 'HATCH', stroke: 'none' }) + rect(X(-1), Y(105), 6 * s, 3 * s, { fill: C.orange, stroke: C.orange }) + line(X(1.5), Y(102), X(1.5), Y(96), { stroke: C.orange, sw: 2.5 })
  b += rect(X(0), Y(pil[1]), 1.25 * s + 2, (pil[1] - pil[0]) * s)                 // pilaster, edge on
  b += rect(X(1.5), Y(70), (depth - 2.2) * s, 58 * s)                              // panel
  for (const h of [64, 18]) b += rect(X(1.5), Y(h), 2 * s, 4, { fill: C.ink, stroke: 'none' }) + rect(X(depth - 2.6), Y(h), 2 * s, 4, { fill: C.ink, stroke: 'none' }) // brackets
  if (style === 'ob') b += rect(X(-0.6), Y(82), 3 * s, 2 * s, { fill: C.orange, stroke: C.orange })
  if (style !== 'ch') b += rect(X(-0.6), Y(4), 1.25 * s + 6, 4 * s, { fill: C.orange, stroke: C.orange })
  if (style === 'ftc') b += rect(X(-0.6), Y(96), 1.25 * s + 6, 3 * s, { fill: C.orange, stroke: C.orange })
  b += hdim(floor + 30, X(0), X(depth), '61-1/4" to face')
  b += vdim(X(depth) + wt + 12, Y(70), Y(12), '58"') + vdim(X(depth) + wt + 12, Y(12), Y(0), '12"')
  b += text(X(depth) + wt + 8, Y(wallH) + 14, 'back wall', { size: 13, fill: C.muted })
  // labels, left of the front: what each part is
  const L = [
    { t: 'pilaster (front)', to: [X(0), Y(style === 'fm' ? 64 : style === 'ob' ? 76 : 80)] },
    { t: 'panel', to: [X(10), Y(42)] },
    { t: 'bracket', to: [X(1.5) + 2, Y(18) + 2] },
  ]
  if (style === 'ob') L.push({ t: 'headrail', to: [X(-0.6), Y(81)] })
  if (style !== 'ch') L.push({ t: style === 'fm' ? 'shoe, anchored to floor' : 'shoe', to: [X(-0.6), Y(2)] })
  if (style === 'ftc') L.push({ t: 'ceiling anchor', to: [X(-0.6), Y(94.5)] })
  if (style === 'ch') L.push({ t: 'steel above ceiling', to: [X(-1), Y(103.5)] }, { t: 'hanger', to: [X(1.5), Y(99)] })
  for (const l of L) l.y = l.to[1] + 5
  for (const l of spread(L, 22, 18, floor + 2)) b += label(x0 - 34, l.y, l.t, l.to, 'end')
  return svg(name, SV.w, SV.h, 'Side view through a toilet compartment',
    'Looking at a dividing panel from inside the stall: the pilaster at the front, the panel 58 inches high and 12 inches above the floor held by brackets at the pilaster and the back wall, 61-1/4 inches to the face.', b)
}

// Detail circles, redrawn from Bobrick's 1080 data sheet details. The circle's contents are drawn in a 300 px
// frame (centre 150, 145, radius 120) and scaled into the circle on the left; labels sit in a column to its right.
function detail(name, kind) {
  const { w: W, h: H } = SV, cx = 118, cy = 125, r = 106, k = r / 120
  const P = ([x, y]) => [+(cx + (x - 150) * k).toFixed(1), +(cy + (y - 145) * k).toFixed(1)]
  const IW = 300
  let b = `<g transform="translate(${cx} ${cy}) scale(${k.toFixed(4)}) translate(-150 -145)"><clipPath id="c-${name}"><circle cx="150" cy="145" r="120"/></clipPath><g clip-path="url(#c-${name})">`
  const lab = [], after = [], inside = []
  const nut = (x, y) => rect(x - 10, y, 20, 7, { fill: C.part, sw: 1.2 })
  const lx = cx + r + 18
  if (kind === 'anchor' || kind === 'ftc-floor') {
    // stile on a leveling bar (angle), two threaded rods with nuts and washers, shoe retainer, wedge anchors; 4" shoe
    b += rect(0, 196, IW, 110, { fill: 'HATCH', stroke: 'none' }) + line(0, 196, IW, 196)
    b += rect(80, 0, 140, 120) // stile
    b += `<path d="M70 120 h160 v8 h-152 v20 h-8 z" fill="${C.orange}"/>` // leveling bar (angle)
    for (const x of [100, 200]) b += line(x, 110, x, 250, { stroke: C.ink, sw: 4 }) + nut(x, 136) + nut(x, 160) + nut(x, 180) + rect(x - 6, 200, 12, 48, { fill: C.ink, stroke: 'none' })
    b += rect(60, 186, 180, 6, { fill: C.part, sw: 1.2 }) // shoe retainer
    b += `<rect x="58" y="110" width="184" height="86" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="6 4"/>` // 4" shoe (outline, in front)
    lab.push(['stile', [220, 50]], ['shoe, 4" high', [242, 104]], ['leveling bar', [230, 124]], ['shoe retainer', [238, 189]], ['wedge anchor', [206, 228]])
    const [, y1] = P([0, 196]), [, y2] = P([0, 248])
    after.push(vdim(lx - 4, y1, y2, '2" min into'), note(lx + 4, y2 + 4, '3" min structural', 'start', 13), note(lx + 4, y2 + 20, 'concrete', 'start', 13))
  }
  if (kind === 'hanger' || kind === 'ftc-ceiling') {
    // I-beam (by others), bevel washer, threaded rod, spacer through the finished ceiling, leveling bar in the stile
    b += rect(0, 0, IW, 126, { fill: 'HATCH', stroke: 'none' })
    b += `<path d="M80 34 h140 v9 h-64 v32 h64 v9 h-140 v-9 h64 v-32 h-64 z" fill="${C.orange}"/>` // I-beam section
    b += line(150, 84, 150, 200, { stroke: C.ink, sw: 4 }) + rect(136, 84, 28, 7, { fill: C.part, sw: 1.2 })
    b += rect(140, 100, 20, 26, { fill: C.part, sw: 1.2 }) + line(0, 126, IW, 126, { sw: 2.5 })
    b += rect(90, 150, 120, 160) + `<path d="M84 150 h132 v-8 h-124 v-16 h-8 z" fill="${C.orange}"/>` + nut(150, 160) + nut(150, 176)
    lab.push(['I-beam (by others)', [220, 40]], ['bevel washer', [164, 88]], ['spacer', [160, 112]], ['finished ceiling', [252, 126]], ['leveling bar', [216, 146]], ['threaded rod', [152, 200]], ['stile', [210, 240]])
  }
  if (kind === 'headrail') {
    // cross-section: the headrail clamps over the stile top (Bradley); enclosed extrusion with a sloping top and a
    // raised grip-resistant face edge (Bobrick)
    b += rect(118, 150, 64, 170) // stile
    b += `<path d="M96 86 L204 74 L204 168 L182 168 L182 150 L118 150 L118 168 L96 168 Z" fill="${C.orange}"/>`
    b += rect(90, 80, 8, 92, { fill: C.ink, stroke: 'none' }) // raised face edge
    lab.push(['grip-resistant face', [94, 80], 30], ['sloping top', [190, 76], 60], [['headrail, extruded', 'aluminum'], [200, 120], 100], ['stile', [182, 230], 150])
    after.push(note(lx, 198, 'cross-section, fixed', 'start', 13), note(lx, 214, 'to each wall with a', 'start', 13), note(lx, 230, 'wall bracket', 'start', 13))
  }
  if (kind === 'bracket') {
    // seen from above: panel end to a perpendicular stile, U-bracket (Bobrick #1000972: panel to perp. stile)
    b += rect(40, 128, 150, 18, { fill: C.part }) + rect(188, 60, 26, 170, { fill: C.part })
    b += `<path d="M150 118 h36 v38 h-36" fill="none" stroke="${C.orange}" stroke-width="5" stroke-linejoin="round"/>`
    inside.push(['panel', [80, 146], P([56, 196])])
    lab.push(['stile', [214, 90]], ['U-bracket', [186, 156]])
    after.push(note(lx, 230, 'seen from above', 'start', 13))
  }
  b += `</g></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  const items = lab.map(([t, to, y]) => { const p = P(to); return { t, to: p, y: y ?? p[1] + 5, fixed: y != null, lines: [].concat(t).length } })
  const bottom = kind === 'anchor' || kind === 'ftc-floor' ? 150 : kind === 'headrail' ? 190 : kind === 'bracket' ? 200 : H - 12
  for (const it of items.some((i) => i.fixed) ? items : spread(items, kind === 'hanger' || kind === 'ftc-ceiling' ? 32 : 30, 22, bottom)) b += label(lx, it.y, it.t, it.to)
  for (const [t, to, at] of inside) b += label(at[0], at[1], t, P(to), 'middle').replace(/x1="[^"]+" y1="[^"]+"/, `x1="${at[0]}" y1="${at[1] - 14}"`)
  b += after.join('')
  const desc = { anchor: 'The pilaster foot: a leveling bar bolted under the stile, threaded rods with nuts and washers, a shoe retainer and wedge anchors at least 2 inches into structural concrete at least 3 inches thick, all covered by a 4-inch stainless steel shoe.', 'ftc-floor': 'The pilaster foot of a floor-to-ceiling stile: a leveling device at the floor as on floor-anchored stiles, with wedge anchors at least 2 inches into 3-inch structural concrete and a 4-inch shoe.', hanger: 'The top of a ceiling-hung stile: a threaded rod from a structural I-beam above the ceiling (not supplied by the partition maker) through a bevel washer and a spacer in the finished ceiling, into a leveling bar in the stile.', 'ftc-ceiling': 'The top of a floor-to-ceiling stile: floor-to-ceiling stiles have a leveling device at each end, fixed to structural members in the ceiling (not supplied by the partition maker).', headrail: 'The headrail: an extruded anodized aluminum rail with a sloping top and a raised grip-resistant face edge, on top of the stile and fixed to the wall with a wall bracket.', bracket: 'Seen from above: the panel end held to a perpendicular stile by a U-bracket.' }[kind]
  return svg(name, W, H, `Detail: ${kind}`, desc, b)
}


const STYLES = {
  'mounting-overhead-braced': ['ob', ['headrail', 'anchor', 'bracket']],
  'mounting-floor-mounted': ['fm', ['anchor', 'bracket']],
  'mounting-ceiling-hung': ['ch', ['hanger', 'bracket']],
  'mounting-floor-to-ceiling': ['ftc', ['ftc-floor', 'ftc-ceiling']],
}
const planName = plan('sheet-plan')
for (const [name, [style, dets]] of Object.entries(STYLES)) {
  sheets[name] = [
    { file: `${planName}.svg`, label: 'Plan', wide: true },
    { file: `${front(`${name}-front`, style)}.svg`, label: 'Front elevation', wide: true },
    { file: `${side(`${name}-side`, style)}.svg`, label: 'Side view' },
    ...dets.map((d, i) => ({ file: `${detail(`${name}-detail-${d}`, d)}.svg`, label: `Detail ${String.fromCharCode(65 + i)}` })),
  ]
}
writeFileSync(new URL('sheets.json', OUT), JSON.stringify(sheets, null, 2) + '\n')

// ---------- material cross-sections (edge view, cut through a door) ----------
// Construction and door thicknesses as sourced in pages/blog_what-are-bathroom-partitions-made-of.md and
// pages/hardware_doors.md (checked 2026-10-26); see drawing-check.md. Overall thickness is dimensioned only where a
// manufacturer gives it. Face, skin and edge-band thicknesses are not published in those sources, so they are drawn
// thin and not dimensioned. Stainless is drawn at 1" like powder coated steel but not dimensioned (no manufacturer
// source opened).
const MATERIALS = {
  phenolic: { name: 'Phenolic (compact laminate)', t: 0.75, dim: '3/4"', src: 'Bobrick DuraLine, Bradley PH400' },
  'solid-plastic': { name: 'Solid plastic (HDPE)', t: 1, dim: '1"', src: 'Scranton Products Hiny Hiders' },
  'plastic-laminate': { name: 'Plastic laminate', t: 1, dim: '1"', src: 'Bobrick DesignerSeries HPL' },
  'powder-coated-steel': { name: 'Powder coated steel', t: 1, dim: '1"', src: 'Metpar powder coated' },
  'stainless-steel': { name: 'Stainless steel', t: 1, dim: null, src: null },
}
// One door cut through near its edge: a break line on the left, the edge on the right. k = px per inch.
// Returns the body plus the points callouts aim at.
function matSection(kind, x0, y0, len, k) {
  const { t } = MATERIALS[kind], T = t * k, x1 = x0 + len, y1 = y0 + T
  const brk = (y) => `M${x0} ${y0} L${x0 + 6} ${y0 + T * 0.3} L${x0 - 6} ${y0 + T * 0.6} L${x0} ${y1}`
  const clip = `<clipPath id="m-${kind}-${x0}-${y0}"><path d="${brk()} L${x1} ${y1} L${x1} ${y0} Z"/></clipPath>`
  let g = ''
  const face = Math.max(4, Math.round(k * 0.04)) // drawn thickness of a face or skin (not to a source)
  const pts = { core: [x0 + len * 0.3, y0 + T / 2], face: [x0 + len * 0.55, y0 + 1], edge: [x1, y0 + T / 2] }
  if (kind === 'solid-plastic') {
    g += rect(x0 - 10, y0, len + 10, T, { fill: C.orange, stroke: 'none' })
  }
  if (kind === 'phenolic') {
    g += rect(x0 - 10, y0, len + 10, T, { fill: C.orange, stroke: 'none' })
    for (let y = y0 + face + 4; y < y1 - face - 1; y += 5) g += line(x0 - 10, y, x1, y, { stroke: '#fff', sw: 1 }) // kraft paper layers
    g += rect(x0 - 10, y0, len + 10, face, { fill: C.part, sw: 1 }) + rect(x0 - 10, y1 - face, len + 10, face, { fill: C.part, sw: 1 }) // melamine faces
  }
  if (kind === 'plastic-laminate') {
    const band = face + 2
    g += rect(x0 - 10, y0, len + 10 - band, T, { fill: C.orange, stroke: 'none' })
    // particleboard: a fixed scatter of chips
    let seed = 7
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < len * T / 70; i++) {
      const cx = x0 - 6 + rnd() * (len - band), cy = y0 + face + 2 + rnd() * (T - 2 * face - 4)
      g += `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${(2 + rnd() * 4).toFixed(1)}" height="1.6" fill="#fff" transform="rotate(${Math.round(rnd() * 180)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
    }
    g += rect(x0 - 10, y0, len + 10 - band, face, { fill: C.part, sw: 1 }) + rect(x0 - 10, y1 - face, len + 10 - band, face, { fill: C.part, sw: 1 }) // HPL faces
    g += rect(x1 - band, y0, band, T, { fill: C.part, sw: 1 }) // edge banding
    pts.edge = [x1 - band / 2, y0 + T / 2]
  }
  if (kind === 'powder-coated-steel' || kind === 'stainless-steel') {
    const skin = 3, edge = 0
    g += rect(x0 - 10, y0, len + 10, T, { fill: C.orangeTint, stroke: 'none' })
    // honeycomb cut through: the cell walls run face to face, so the section shows them as lines across the core,
    // in pairs where two cells are bonded
    const cell = Math.max(10, k * 0.16)
    let d = '', n = 0
    for (let x = x0 - 10; x < x1 - edge - 3; x += n++ % 2 ? cell : 3) d += `M${x.toFixed(1)} ${y0 + skin} V${y1 - skin}`
    g += `<path d="${d}" fill="none" stroke="${C.orange}" stroke-width="2"/>`
    g += rect(x0 - 10, y0, len + 10, skin, { fill: C.ink, stroke: 'none' }) + rect(x0 - 10, y1 - skin, len + 10, skin, { fill: C.ink, stroke: 'none' }) // steel faces
    // edge: not described in the held sources, so a plain outline
  }
  const body = `${clip}<g clip-path="url(#m-${kind}-${x0}-${y0})">${g}</g><path d="${brk()} M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  return { body, pts, T, x1, y1 }
}

{
  const desc = {
    phenolic: 'A phenolic (compact laminate) door cut through near its edge: layers of resin-impregnated kraft paper fused into one solid core, with decorative melamine faces. The core is black, or matches the face color on color-through lines. Doors are 3/4 inch thick.',
    'solid-plastic': 'A solid plastic (HDPE) door cut through near its edge: one homogeneous sheet of high-density polyethylene, with no separate core, faces or edge band, and the color running all the way through. 1 inch thick.',
    'plastic-laminate': 'A plastic laminate door cut through near its edge: a resin-impregnated particleboard core with high-pressure laminate bonded to both faces and an edge band covering the edge. 1 inch thick.',
    'powder-coated-steel': 'A powder coated steel door cut through near its edge: two galvannealed steel faces, powder coated, over a honeycomb core. 1 inch thick. Steel gauge and edge construction are not shown.',
    'stainless-steel': 'A stainless steel door cut through near its edge: two type 304 stainless steel faces over a honeycomb core. Thickness, gauge and edge construction are not shown.',
  }
  // 780 wide, shown at its real size in the content column; 150 px per inch
  const k = 150, x0 = 120, y0 = 70, len = 470
  for (const kind of Object.keys(MATERIALS)) {
    const m = MATERIALS[kind], s = matSection(kind, x0, y0, len, k)
    let b = s.body
    b += callout(2, s.pts.face[0], 34, s.pts.face) + callout(3, s.x1 + 34, s.pts.edge[1], s.pts.edge)
    b += callout(1, s.pts.core[0], s.y1 + 42, s.pts.core) + `<circle cx="${s.pts.core[0]}" cy="${s.pts.core[1]}" r="5" fill="${C.orange}" stroke="#fff" stroke-width="2"/>`
    if (m.dim) b += vdim(s.x1 + 72, y0, s.y1, m.dim)
    b += note(x0 - 10, s.y1 + 84, 'Edge view: a door cut through near its edge. Faces and edge not to scale.', 'start', 13)
    made.push(svg(`material-section-${kind}`, 780, Math.round(s.y1 + 112), `${m.name} partition door, edge view`, desc[kind], b))
  }
}

// All five at the same scale, side by side: each door stands upright, cut through and seen edge on, with the
// cut-off end at the top and the edge at the bottom; name above, thickness below.
{
  const k = 80, len = 270, col = 156, top = 64
  const names = { phenolic: ['Phenolic', '(compact laminate)'], 'solid-plastic': ['Solid plastic', '(HDPE)'], 'plastic-laminate': ['Plastic laminate'], 'powder-coated-steel': ['Powder coated', 'steel'], 'stainless-steel': ['Stainless steel'] }
  let b = ''
  Object.keys(MATERIALS).forEach((kind, i) => {
    const m = MATERIALS[kind], cx = col / 2 + i * col, T = m.t * k
    const n = names[kind]
    n.forEach((t, j) => { b += text(cx, 46 - (n.length - 1 - j) * 18, t, { size: 15, weight: 700, anchor: 'middle' }) })
    const s = matSection(kind, 0, 0, len, k)
    b += `<g transform="translate(${cx + T / 2} ${top}) rotate(90)">${s.body}</g>`
    const dy = top + len + 18
    if (m.dim) b += line(cx - T / 2, dy, cx + T / 2, dy, { stroke: C.muted, sw: 1 }) + line(cx - T / 2, dy - 5, cx - T / 2, dy + 5, { stroke: C.muted, sw: 1 }) + line(cx + T / 2, dy - 5, cx + T / 2, dy + 5, { stroke: C.muted, sw: 1 })
      + text(cx, dy + 24, m.dim, { size: 14, weight: 600, fill: C.muted, anchor: 'middle' })
    else b += text(cx, dy + 24, '', { size: 13, fill: C.muted, anchor: 'middle' })
  })
  const ny = top + len + 74
  b += note(16, ny, 'Same scale, each door cut through and seen edge on.', 'start', 13)
  made.push(svg('material-sections-compare', 780, ny + 10, 'Partition materials compared, edge view',
    'Five partition doors side by side, each cut through and seen edge on at the same scale: phenolic 3/4 inch, layered kraft paper core with melamine faces; solid plastic (HDPE) 1 inch, one solid sheet; plastic laminate 1 inch, particleboard core with laminate faces and an edge band; powder coated steel 1 inch and stainless steel, steel faces over a honeycomb core.', b))
}

// ---------- urinal spacing (plan, seen from above) ----------
// 2018 IPC 405.3.1 (ICC Significant Changes excerpt, iccsafe.org/wp-content/uploads/2018SC-PMG_P405.3.1.pdf, checked
// 2026-10-26, as cited in pages/guides.md): 15" min from a fixture's centerline to a side wall or partition; 30" min
// centerline to centerline where no partition separates adjacent fixtures; 21" min clear in front of the fixture.
// Urinal and screen sizes are schematic and not dimensioned.
{
  const s = 4.4, wx = 40, wy = 36
  const X = (i) => wx + 22 + i * s, Y = (i) => wy + 16 + i * s
  const run = 98, cls = [15, 45, 75]
  // orange dimension for the subject (centerline spacing); labels in ink
  const odim = (y, x1, x2, label) => line(x1, y, x2, y, { stroke: C.orange, sw: 2.5 }) + line(x1, y - 6, x1, y + 6, { stroke: C.orange, sw: 2 }) + line(x2, y - 6, x2, y + 6, { stroke: C.orange, sw: 2 }) + text((x1 + x2) / 2, y - 9, label, { size: 14, weight: 700, anchor: 'middle' })
  let b = ''
  b += rect(wx, wy, run * s + 22, 16, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(run), Y(0)) // back wall
  const dimY = Y(14) + 21 * s + 46
  b += rect(wx, wy, 22, dimY + 40 - wy, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(0), dimY + 40) // side wall
  b += `<path d="M${X(run) - 4} ${wy - 4} l-5 12 l10 6 l-5 12" fill="none" stroke="${C.muted}" stroke-width="1.5"/>` // break: the wall continues
  for (const c of cls) { // wall-hung urinal, seen from above
    b += `<path d="M${X(c - 9)} ${Y(0)} v${8 * s} q0 ${6 * s} ${9 * s} ${6 * s} q${9 * s} 0 ${9 * s} ${-6 * s} v${-8 * s} z" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>`
    b += `<path d="M${X(c - 5.5)} ${Y(2)} v${6 * s} q0 ${3.6 * s} ${5.5 * s} ${3.6 * s} q${5.5 * s} 0 ${5.5 * s} ${-3.6 * s} v${-6 * s} z" fill="none" stroke="${C.ink}" stroke-width="1"/>`
  }
  for (const c of [30, 60]) b += rect(X(c) - 2.5, Y(0), 5, 18 * s, { fill: C.part }) // urinal screens
  // centerlines, orange, down to the dimension line
  for (const c of cls) b += line(X(c), Y(0) - 2, X(c), dimY + (c === cls[0] ? 34 : 8), { stroke: C.orange, sw: 1.5, dash: '10 3 2 3' })
  // 21" clear in front of the urinal: to a dashed line standing for any wall, fixture or door
  const front = Y(14), clear = front + 21 * s
  b += line(X(cls[1] + 4), clear, X(run) - 4, clear, { stroke: C.muted, sw: 1.5, dash: '5 5' })
  b += vdim(X(cls[2] + 12), front, clear, '21" min')
  b += note(X(run) - 4, clear + 18, 'wall, fixture or door', 'end', 13)
  const odim15 = line(X(0), dimY + 28, X(cls[0]), dimY + 28, { stroke: C.orange, sw: 2.5 }) + line(X(cls[0]), dimY + 22, X(cls[0]), dimY + 34, { stroke: C.orange, sw: 2 }) + text(X(cls[0]) + 8, dimY + 33, '15" min to the side wall', { size: 14, weight: 700 })
  b += odim15 + odim(dimY, X(cls[0]), X(cls[1]), '30" min') + odim(dimY, X(cls[1]), X(cls[2]), '30" min')
  b += text(X(30), Y(18) + 18, 'screen', { size: 13, fill: C.muted, anchor: 'middle' })
  // notes beside the plan
  const nx = X(run) + 34
  b += text(nx, Y(4), 'Seen from above.', { size: 13, fill: C.muted })
  ;['With a screen between', 'urinals, each centerline', 'needs 15" min to the', 'screen as well.'].forEach((t, i) => { b += text(nx, Y(4) + 26 + i * 18, t, { size: 13, fill: C.muted }) })
  made.push(svg('urinal-spacing', 780, dimY + 48, 'Urinal spacing with urinal screens, plan view',
    'Seen from above: three wall-hung urinals along a wall, with a side wall on the left and urinal screens between them. The first urinal centerline is at least 15 inches from the side wall, urinal centerlines are at least 30 inches apart, and there is at least 21 inches of clear space in front of each urinal (International Plumbing Code 405.3.1).', b))
}

// ---------- measuring a new restroom: a plan, then a section ----------
// No numbers: they show what to measure, not a size. Letters match the pages' measurement lists.
{
  let b = ''
  const ox = 120, oy = 52, iw = 470, ih = 230, t = 14 // interior from (ox+t, oy+t)
  const L = ox + t, T = oy + t, R = L + iw, B = T + ih
  // walls (hatched), with a door opening in the bottom wall
  const dL = R - 150, dR = R - 50
  b += rect(ox, oy, iw + 2 * t, t, { fill: 'HATCH', stroke: 'none' }) + rect(ox, oy, t, ih + 2 * t, { fill: 'HATCH', stroke: 'none' })
  b += rect(R, oy, t, ih + 2 * t, { fill: 'HATCH', stroke: 'none' }) + rect(ox, B, dL - ox, t, { fill: 'HATCH', stroke: 'none' }) + rect(dR, B, R + t - dR, t, { fill: 'HATCH', stroke: 'none' })
  b += `<path d="M${L} ${T} H${R} V${B} H${dR} M${dL} ${B} H${L} Z" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  // door leaf swinging in, hinged at dR
  b += line(dR, B, dR, B - (dR - dL), { stroke: C.ink, sw: 2.5 }) + `<path d="M${dL} ${B} A${dR - dL} ${dR - dL} 0 0 1 ${dR} ${B - (dR - dL)}" fill="none" stroke="${C.muted}" stroke-width="1.5" stroke-dasharray="5 5"/>`
  // the stall wall run: the subject
  b += line(L, T + 3, R, T + 3, { stroke: C.orange, sw: 6 })
  // toilet flanges (existing or planned rough-in)
  const fl = [L + 56, L + 152, L + 248]
  for (const f of fl) b += `<circle cx="${f}" cy="${T + 40}" r="7" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>` + line(f - 11, T + 40, f + 11, T + 40, { stroke: C.muted, sw: 1 }) + line(f, T + 29, f, T + 51, { stroke: C.muted, sw: 1 })
  // E: running dimensions from the side wall to each flange centerline
  fl.forEach((f, i) => {
    const y = T + 76 + i * 22
    b += line(L, y, f, y, { stroke: C.muted, sw: 1 }) + line(f, y - 5, f, y + 5, { stroke: C.muted, sw: 1 }) + line(f, T + 48, f, y, { stroke: C.muted, sw: 1, dash: '2 3' })
    b += text(f + 6, y + 5, 'E', { size: 14, fill: C.muted, weight: 700 })
  })
  b += line(L, T + 66, L, T + 130, { stroke: C.muted, sw: 1 })
  b += hdim(oy - 16, L, R, 'A  room width along the stall wall')
  b += vdim(R + t + 16, T, B, 'B') + text(R + t + 24, (T + B) / 2 + 24, 'depth', { size: 13, fill: C.muted })
  b += hdim(B + t + 26, dR, R, 'D') + text(dL - 10, B - 34, 'D  door', { size: 14, fill: C.muted, weight: 600, anchor: 'end' })
  b += text(L + 10, B - 14, 'seen from above', { size: 13, fill: C.muted })
  made.push(svg('measure-new-restroom-plan', 780, B + t + 40, 'How to measure an empty restroom for new partitions, plan',
    'Seen from above, an empty restroom: A, the width of the wall the stalls will run along (in orange); B, the room depth; D, where the entry door is, measured from the nearest corner, and which way it swings; E, each toilet flange centerline measured from the side wall.', b))
}
{
  let b = ''
  const sx = 120, sw = 470, wt = 14, top = 36
  const L = sx + wt, R = L + sw, under = top + 28, ceil = under + 44, floor = ceil + 180
  b += rect(sx, top, sw + 2 * wt, 28, { fill: 'HATCH', stroke: 'none' }) + line(sx, under, R + wt, under) // structure above
  b += rect(sx, under, wt, floor - under, { fill: 'HATCH', stroke: 'none' }) + rect(R, under, wt, floor - under, { fill: 'HATCH', stroke: 'none' }) // walls, cut
  b += line(L, under, L, floor) + line(R, under, R, floor)
  b += line(L, ceil, R, ceil) // finished ceiling
  b += rect(sx, floor, sw + 2 * wt, 28, { fill: 'HATCH', stroke: 'none' }) + line(sx, floor, R + wt, floor) // floor slab
  b += text(L + 10, ceil + 20, 'finished ceiling', { size: 13, fill: C.muted })
  b += vdim(L + 270, ceil, floor, 'C') + text(L + 278, (ceil + floor) / 2 + 24, 'ceiling height', { size: 13, fill: C.muted })
  b += text(L + 10, floor - 14, 'cut through, seen from the side', { size: 13, fill: C.muted })
  const fx = R + wt + 16
  b += line(R - 40, top + 14, fx - 6, top + 14, { stroke: C.muted, sw: 1 }) + text(fx, top + 19, 'F  structure', { size: 14, fill: C.muted, weight: 600 }) + text(fx, top + 37, 'above the ceiling', { size: 13, fill: C.muted })
  b += line(R - 40, floor + 14, fx - 6, floor + 14, { stroke: C.muted, sw: 1 }) + text(fx, floor + 19, 'F  floor', { size: 14, fill: C.muted, weight: 600 }) + text(fx, floor + 37, 'construction', { size: 13, fill: C.muted })
  made.push(svg('measure-new-restroom-section', 780, floor + 46, 'How to measure an empty restroom for new partitions, section',
    'The same restroom cut through and seen from the side: C, the ceiling height from the floor to the finished ceiling; F, what the floor is made of and what structure is above the ceiling.', b))
}

console.log(`${made.length} diagrams: ${made.join(', ')}; sheets: ${Object.keys(sheets).join(', ')}`)
