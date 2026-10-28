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
let S = 3.2 // px per inch in elevations (phone variants draw at a smaller scale: see withPhone)
let DIM = 14 // dimension label size (13 on phone variants)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
// Drawings that explain a principle rather than follow a manufacturer's drawing say so on the drawing.
const SCHEMATIC = new Set(['mounting-styles-compare', 'partition-anatomy', 'hinge-types', 'measure-replacement-door', 'stall-gaps', 'latch-keeper',
  'material-section-phenolic', 'material-section-solid-plastic', 'material-section-plastic-laminate', 'material-section-powder-coated-steel',
  'material-section-stainless-steel', 'material-sections-compare', 'urinal-spacing', 'measure-new-restroom-plan', 'measure-new-restroom-section'])
const META = {} // name → [title, desc], reused by the phone variants
// `frame`: a wider canvas, with the drawing centred in it (standalone drawings are 780 wide, the content column).
function svg(name, w, h, title, desc, body, frame) {
  if (frame > w) { body = `<g transform="translate(${(frame - w) / 2} 0)">${body}</g>`; w = frame }
  // Ids inside the body (clip paths) carry the drawing's name, so a page can inline a drawing and its phone variant.
  for (const id of new Set([...body.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]))) if (!id.endsWith(`-${name}`)) body = body.replaceAll(`id="${id}"`, `id="${id}-${name}"`).replaceAll(`url(#${id})`, `url(#${id}-${name})`)
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
  META[name] = [title, desc]
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
  return `${line(x, y1, x, y2, { stroke: C.muted, sw: 1 })}${line(x - 5, y1, x + 5, y1, { stroke: C.muted, sw: 1 })}${line(x - 5, y2, x + 5, y2, { stroke: C.muted, sw: 1 })}${text(tx, (y1 + y2) / 2 + 5, label, { size: DIM, fill: C.muted, anchor: side === 'right' ? 'start' : 'end', weight: 600 })}`
}
// o.anchor 'start' / 'end': the label starts just inside x1 / ends just inside x2, for a label wider than its dimension.
function hdim(y, x1, x2, label, o = {}) {
  const tx = o.anchor === 'start' ? x1 + 3 : o.anchor === 'end' ? x2 - 3 : (x1 + x2) / 2
  return `${line(x1, y, x2, y, { stroke: C.muted, sw: 1 })}${line(x1, y - 5, x1, y + 5, { stroke: C.muted, sw: 1 })}${line(x2, y - 5, x2, y + 5, { stroke: C.muted, sw: 1 })}${text(tx, y - 7, label, { size: DIM, fill: C.muted, anchor: o.anchor ?? 'middle', weight: 600 })}`
}

// ---------- the stall front elevation ----------
// Two stalls seen from the front: wall | P door P door P | wall. Inches → px with floor at `floor`.
// wt: wall thickness, slabT: slab thickness, underGap: from the slab's underside to the callouts under it (px).
function elevation({ x0 = 70, stalls = 4, P = 6, floor, ceiling = null, plenum = false, pil = [0, 83], headrail = false,
  floorAnchors = true, ceilingAnchors = false, hangers = false, door = [12, 70], wallH = 100, emphasis = 'support', wt = 22, slabT = 30, underGap = 22 }) {
  const Y = (inch) => floor - inch * S
  const D = 24, G = 0.6 // door, sightline gap (inches); P = pilaster width
  const xs = [] // pilaster x positions in inches from inner wall face
  let cur = 0.6 // first pilaster sits at the wall, with the wall gap
  for (let i = 0; i <= stalls; i++) { xs.push(cur); cur += P + G + D + G }
  const runIn = xs[stalls] + P + 0.6
  const X = (inch) => x0 + wt + inch * S
  const wallL = x0, wallR = X(runIn)
  let b = ''
  // building: floor slab, walls, ceiling
  b += rect(x0 - 10, floor, wallR - x0 + wt + 20, slabT, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 10, floor, wallR + wt + 10, floor)
  b += rect(x0, Y(wallH), wt, wallH * S, { fill: 'HATCH', stroke: 'none' }) + line(x0 + wt, Y(wallH), x0 + wt, floor)
  b += rect(wallR, Y(wallH), wt, wallH * S, { fill: 'HATCH', stroke: 'none' }) + line(wallR, Y(wallH), wallR, floor)
  if (ceiling !== null) {
    b += line(x0 + wt, Y(ceiling), wallR, Y(ceiling), { sw: 1.5 })
    if (plenum) b += rect(x0 + wt, Y(ceiling + 14), wallR - x0 - wt, 14 * S - 2, { fill: 'HATCH', stroke: 'none' })
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
  const ov = Math.min(3, S) // shoes and anchors overhang the pilaster a little
  if (floorAnchors) for (const p of xs) {
    b += rect(X(p) - ov, Y(4), P * S + 2 * ov, 4 * S, { fill: emphasis === 'floor' || emphasis === 'support' ? C.orange : C.part, stroke: C.orange, sw: 1.5 }) // shoe
    if (emphasis === 'floor') b += rect(X(p + 2), floor, 2 * S, 2 * S + 2, { fill: C.orange, stroke: C.orange, sw: 1 }) // anchor into slab
  }
  if (ceilingAnchors) for (const p of xs) b += rect(X(p) - ov, Y(ceiling), P * S + 2 * ov, 3 * S, { fill: C.orange, stroke: C.orange })
  if (hangers) {
    b += rect(x0 + wt, Y(ceiling + 9), wallR - x0 - wt, 3 * S, { fill: C.orange, stroke: C.orange }) // steel support
    for (const p of xs) b += line(X(p + P / 2), Y(ceiling + 6), X(p + P / 2), Y(pil[1]), { stroke: C.orange, sw: S < 2 ? 2.5 : 3 })
  }
  return { body: b, X, Y, xs, P, D, G, runIn, wallR, wallL: x0, wt, under: floor + slabT + underGap, last: xs[stalls] }
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
  const e = elevation({ floor: 400, ceiling: 96, plenum: true, pil: [12, 95], floorAnchors: false, hangers: true, wallH: 112 })
  made.push(svg('mounting-ceiling-hung', W(e), 480, 'Ceiling hung toilet partitions, front view',
    'Two stalls seen from the front. Pilasters hang from structural steel above the finished ceiling and stop short of the floor, which stays completely clear. Ceiling-hung pilasters are 83 inches for an 8-foot ceiling.',
    e.body + vdim(e.wallR + 34, e.Y(95), e.Y(12), '83"') + vdim(e.wallR + 34, e.Y(12), e.Y(0), 'clear') + vdim(e.wallL - 12, e.Y(70), e.Y(12), '58"', 'left')
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
    ['Ceiling hung', { ceiling: 96, plenum: true, pil: [12, 95], floorAnchors: false, hangers: true, wallH: 112 }],
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
// Front elevations (the mounting style front views): one wider accessible stall with an outswing door, then three
// identical 36" standard stalls (24" inswing door + 12" pilaster), so the row reads as one accessible + standards.
const FRONT_ELEV = [['p', 3.5], ['d', 36], ['p', 21], ['d', 24], ['p', 12], ['d', 24], ['p', 12], ['d', 24], ['p', 12]]
const note = (x, y, t, anchor = 'start', size = 11) => text(x, y, t, { size, fill: C.muted, anchor, weight: 500 })

// ph: the phone variant (360 wide): smaller scale, thinner walls, no compartment names (the page text names them,
// left to right), dimensions kept.
function plan(name, ph = false) {
  const s = ph ? 1.5 : 3.2, x0 = ph ? 10 : 30, y0 = ph ? 56 : 64, wt = ph ? 10 : 22, ht = ph ? 10 : 14
  const X = (i) => x0 + wt + i * s, Y = (i) => y0 + ht + i * s
  const { stalls, depth } = LAYOUT
  const run = stalls.reduce((a, b) => a + b, 0)
  let b = ''
  const sideL = ph ? 26 : 36 // side walls run past the front line
  b += rect(x0, y0, run * s + 2 * wt, ht, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(run), Y(0))
  b += rect(x0, y0, wt, depth * s + ht + sideL, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(0), Y(depth) + sideL)
  b += rect(X(run), y0, wt, depth * s + ht + sideL, { fill: 'HATCH', stroke: 'none' }) + line(X(run), Y(0), X(run), Y(depth) + sideL)
  const toilet = (c) => rect(X(c) - 8 * s / 2, Y(0) + 2, 16 * s / 2, 6 * s / 2, { rx: 2 }) + `<ellipse cx="${X(c)}" cy="${Y(17)}" rx="${7.5 * s}" ry="${12.5 * s}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/><ellipse cx="${X(c)}" cy="${Y(18.5)}" rx="${4.5 * s}" ry="${8 * s}" fill="none" stroke="${C.ink}" stroke-width="1"/>`
  const bar = (x1, y1, x2, y2) => line(x1, y1, x2, y2, { stroke: C.orange, sw: ph ? 3 : 4, cap: true })
  const off = ph ? 4 : 6 // grab bars stand off the panel
  // dividing panels
  let L = 0
  const edges = stalls.map((w) => { const e = [L, L + w]; L += w; return e })
  edges.slice(0, -1).forEach(([, R]) => { b += rect(X(R) - 1.5, Y(0), 3, depth * s - 2, { fill: C.part, sw: ph ? 1.2 : 1.5 }) })
  // front line with doors, positions from Bradley's plan
  // ADA: door at the wall end, hinged at the wall pilaster, swings out; toilet against the dividing panel.
  // Ambulatory: door hinged at its left, swings out. Standard: hinged at the left, swing in.
  const fx = []; let cur = 0
  for (const [k, w] of FRONT) { fx.push([k, cur, cur + w]); cur += w }
  const doors = fx.filter((f) => f[0] === 'd')
  fx.filter((f) => f[0] === 'p').forEach(([, a1, a2]) => { b += rect(X(a1), Y(depth) - (ph ? 2 : 3), (a2 - a1) * s, ph ? 4 : 6, { fill: C.part, sw: ph ? 1.2 : 1.5 }) })
  doors.forEach(([, d1, d2], i) => {
    const w = d2 - d1, out = i < 2, hx = X(d1)
    const ang = out ? 25 : -25, rad = (ang * Math.PI) / 180
    const ex = hx + Math.cos(rad) * w * s, ey = Y(depth) + Math.sin(rad) * w * s
    b += line(hx, Y(depth), ex, ey, { stroke: C.ink, sw: ph ? 2 : 2.5 })
    b += `<path d="M${X(d2)} ${Y(depth)} A${w * s} ${w * s} 0 0 ${out ? 1 : 0} ${ex} ${ey}" fill="none" stroke="${C.muted}" stroke-width="1" stroke-dasharray="5 5"/>`
  })
  // toilets: ADA centreline 17" from the dividing panel (604.2: 16–18"); others centred
  b += toilet(edges[0][1] - 17) + toilet(edges[1][0] + 18.25) + toilet(edges[2][0] + 18) + toilet(edges[3][0] + 18)
  // grab bars (604.5): ADA side bar on the panel by the toilet, 12" from the rear wall, 42" long; rear bar 36"
  const pR = X(edges[0][1]) - off
  b += bar(pR, Y(12), pR, Y(54)) + bar(X(edges[0][1] - 17 - 24), Y(0) + off, X(edges[0][1] - 17 + 12), Y(0) + off)
  // ambulatory: side bars on both panels
  b += bar(X(edges[1][0]) + off, Y(12), X(edges[1][0]) + off, Y(54)) + bar(X(edges[1][1]) - off, Y(12), X(edges[1][1]) - off, Y(54))
  const lbl = ['ADA', 'Ambulatory', 'Standard', 'Standard'], sub = ['60" clearance', '36" clearance', '', '']
  edges.forEach(([l, r], i) => {
    const cx = i === 0 ? l + 22 : (l + r) / 2
    if (!ph) b += text(X(cx), Y(40), lbl[i], { size: 12, weight: 700, anchor: 'middle' }) + (sub[i] ? text(X(cx), Y(40) + 15, sub[i], { size: 11, fill: C.muted, anchor: 'middle', weight: 600 }) : '')
    b += hdim(y0 - (ph ? 8 : 10), X(l), X(r), ['60-1/2"', '36-1/2"', '36"', '36"'][i])
  })
  b += hdim(y0 - (ph ? 34 : 40), X(0), X(run), '169"')
  b += vdim(X(run) + wt + (ph ? 12 : 14), Y(0), Y(depth), ph ? '61-1/4"' : '61-1/4" to face')
  return svg(name, ph ? 360 : Math.round(X(run) + 150), ph ? Math.round(Y(depth) + sideL + 8) : Math.round(Y(depth) + 50 + 36 * s * 0.45 + 10), 'Plan view of a row of toilet compartments',
    'Seen from above: an ADA compartment 60-1/2 inches wide with the toilet beside the dividing panel, grab bars and an outswing door at the wall end; an ambulatory compartment 36-1/2 inches wide with grab bars on both sides and an outswing door; two standard compartments 36 inches wide with inswing doors; 169 inches overall and 61-1/4 inches deep to the face.', b)
}

// Front elevation of the same row. Heights per style; hardware visible from outside: hinges and pulls on the
// outswing doors, latch indicators on all.
// ph: the phone variant (360 wide, 1.4 px per inch): the same dimensions, "stile" and "to ceiling" left to the page text.
function front(name, style, ph = false) {
  const s = ph ? 1.4 : 3.2, x0 = ph ? 46 : 70, wt = ph ? 10 : 22, slab = ph ? 14 : 30
  const H = { ob: { pil: [1, 82], rail: 82, floor: 330, wall: 100 }, fm: { pil: [1, 70], floor: 300, wall: 92 }, ch: { pil: [12, 95], ceil: 96, floor: 400, wall: 112, plenum: true }, ftc: { pil: [0, 96], ceil: 96, floor: 370, wall: 100 } }[style]
  const top = { ob: 100, fm: 92, ch: 112, ftc: 100 }[style]
  const floor = ph ? Math.round(12 + top * s) : H.floor, Y = (i) => floor - i * s, X = (i) => x0 + wt + i * s
  const run = FRONT_ELEV.reduce((a, [, w]) => a + w, 0), wallR = X(run)
  const kh = ph ? s / 3.2 : 1 // small hardware drawn in px on the desktop sheet
  let b = rect(x0 - 10, floor, run * s + 2 * wt + 30, slab, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 10, floor, wallR + wt + 10, floor)
  b += rect(x0, Y(H.wall), wt, H.wall * s, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(H.wall), X(0), floor)
  b += rect(wallR, Y(H.wall), wt, H.wall * s, { fill: 'HATCH', stroke: 'none' }) + line(wallR, Y(H.wall), wallR, floor)
  if (H.ceil) b += line(X(0), Y(H.ceil), wallR, Y(H.ceil))
  if (H.plenum) b += rect(X(0), Y(H.ceil + 14), run * s, 14 * s - 2, { fill: 'HATCH', stroke: 'none' })
  let cur = 0, di = 0
  const pilXs = []
  for (const [k, w] of FRONT_ELEV) {
    if (k === 'p') { b += rect(X(cur), Y(H.pil[1]), w * s, (H.pil[1] - H.pil[0]) * s); pilXs.push([cur, w]) }
    else {
      b += rect(X(cur + 0.3), Y(70), (w - 0.6) * s, 58 * s)
      const out = di === 0 // only the accessible door swings out
      if (out) { // hinges on the hinge (left) edge, pull and latch indicator near the latch edge
        b += rect(X(cur + 0.3) - 2 * kh, Y(65), Math.max(3, 7 * kh), 14 * kh, { fill: C.ink, stroke: 'none' }) + rect(X(cur + 0.3) - 2 * kh, Y(20), Math.max(3, 7 * kh), 14 * kh, { fill: C.ink, stroke: 'none' })
        b += rect(X(cur + w - 9), Y(43), Math.max(1.5, 3 * kh), 22 * kh, { fill: C.ink, stroke: 'none' })
      }
      b += `<circle cx="${X(cur + w - 4)}" cy="${Y(40)}" r="${ph ? 2.2 : 4}" fill="#fff" stroke="${C.ink}" stroke-width="${ph ? 1 : 1.2}"/>`
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
    for (const [x, w] of pilXs) b += line(X(x + w / 2), Y(H.ceil + 6), X(x + w / 2), Y(H.pil[1]), { stroke: C.orange, sw: ph ? 2.5 : 3 })
  }
  // numbered callouts, keyed in the page text under the sheet
  const [p2x, p2w] = pilXs[1], under = floor + (ph ? slab + 14 : 30), o1 = ph ? 26 : 40, o2 = ph ? 24 : 34
  if (style === 'ob') b += callout(1, X(60), Y(91), [X(60), Y(82) - 2]) + callout(2, X(p2x + p2w / 2) + o1, under, [X(p2x + p2w / 2), Y(2)]) + callout(3, X(p2x + p2w / 2), Y(50), null)
  if (style === 'fm') b += callout(1, X(p2x + p2w / 2) + o1, under, [X(p2x + p2w / 2), Y(2)]) + callout(2, X(p2x + p2w / 2), Y(ph ? 84 : 80), [X(p2x + p2w / 2), Y(71)])
  if (style === 'ch') b += callout(1, X(20), Y(H.ceil + 12) - 2, null) + callout(2, X(p2x + p2w / 2) + o2, Y(ph ? 86 : 91), [X(p2x + p2w / 2), Y(99)]) + callout(3, X(p2x + p2w / 2), Y(6), null)
  if (style === 'ftc') b += callout(1, X(p2x + p2w / 2) + o1, under, [X(p2x + p2w / 2), Y(2)]) + callout(2, X(p2x + p2w / 2) + o2, Y(ph ? 84 : 88), [X(p2x + p2w / 2), Y(95)]) + callout(3, X(p2x + p2w + 10), Y(ph ? 36 : 60), null)
  // dimensions: only the ones the sources print
  const dl = x0 - (ph ? 8 : 12), dr = wallR + wt + (ph ? 10 : 12)
  b += vdim(dl, Y(70), Y(12), '58"', 'left') + vdim(dl, Y(12), Y(0), '12"', 'left')
  if (style === 'ob') b += vdim(dl, Y(82), Y(70), '12"', 'left') + vdim(dr, Y(82), Y(0), '82"')
  if (style === 'fm') b += vdim(dr, Y(70), Y(1), ph ? '69"' : '69" stile')
  if (style === 'ch') b += vdim(dr, Y(95), Y(12), ph ? '83"' : '83" stile') + vdim(dr, Y(12), Y(0), 'clear')
  if (style === 'ftc' && !ph) b += vdim(dr, Y(96), Y(0), 'to ceiling')
  const w = ph ? 360 : Math.round(wallR + 22 + 34 + (style === 'ftc' ? 90 : 80))
  return svg(name, w, ph ? (style === 'ch' ? floor + slab + 8 : under + 16) : floor + 64, 'Front elevation of a row of toilet compartments',
    `Front view of a row of four compartments: one wider accessible compartment and three identical standard ones. Doors 58 inches high, 12 inches above the floor; the accessible door swings out, so its hinges and pull show on this side.`, b)
}

// Side and detail views sit two across on desktop (about 370 px each), so they are drawn at that size, landscape
// (400 x 250), with their labels beside the drawing: text then shows at about 13–14 px.
const SV = { w: 400, h: 250 }
// Side labels: one column per side on a 16 px baseline grid. Every label's text starts (right column) or ends (left
// column) at the same x; labels are ordered top to bottom as the points they name and spaced one empty grid line apart
// (a two-line label takes one more line). Each leader is an elbow: a short horizontal run from the label to a gutter
// shared by the whole column, then straight to the point, ending in a dot. Notes and dimension text use the same grid
// and the same x (see gridY and dimLane).
const GRID = 16, PITCH = 2 * GRID, ROW0 = 26, GUTTER = 14
const gridY = (y) => ROW0 + Math.round((y - ROW0) / GRID) * GRID
const leader = (sx, y, gx, to) => `<path d="M${sx} ${y} H${Math.abs(to[1] - y) < 0.5 ? to[0] : `${gx} L${to[0]} ${to[1]}`}" fill="none" stroke="${C.orange}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${to[0]}" cy="${to[1]}" r="2.5" fill="${C.orange}"/>`
const labelText = (x, y, lines, anchor) => lines.map((t, i) => `<text x="${x}" y="${y + i * GRID}" font-size="14" font-weight="500" fill="${C.ink}" text-anchor="${anchor}" paint-order="stroke" stroke="#fff" stroke-width="4">${esc(t)}</text>`).join('')
// items: [{ t: text or lines, to: [x, y] }]. side 'right': x is where the text starts; 'left': where it ends.
// lo / hi: the first and last baselines the column may use.
function labelColumn(items, { x, side = 'right', lo = ROW0, hi }) {
  const its = items.map((it) => ({ lines: [].concat(it.t), to: it.to })).sort((p, q) => p.to[1] - q.to[1])
  const off = []; let y = 0
  for (const it of its) { off.push(y); y += GRID * (it.lines.length - 1) + PITCH }
  const span = y - PITCH // first baseline to last baseline
  const mid = its.reduce((m, it) => m + it.to[1], 0) / its.length + 5
  const max = lo + Math.floor((hi - lo) / GRID) * GRID - span
  const y0 = Math.max(lo, Math.min(max, gridY(mid - span / 2)))
  const d = side === 'right' ? -1 : 1, gx = x + d * GUTTER
  const segs = its.map((it, i) => ({ it, y: y0 + off[i] }))
  // check: no two leaders cross
  const cross = (p1, p2, p3, p4) => { const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])); return o(p1, p2, p3) * o(p1, p2, p4) < 0 && o(p3, p4, p1) * o(p3, p4, p2) < 0 }
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) if (cross([gx, segs[i].y - 5], segs[i].it.to, [gx, segs[j].y - 5], segs[j].it.to)) console.warn(`leaders cross: ${segs[i].it.lines[0]} / ${segs[j].it.lines[0]}`)
  return { y0, last: y0 + span, gx, svg: segs.map(({ it, y }) => leader(x + d * 4, y - 5, gx, it.to) + labelText(x, y, it.lines, side === 'right' ? 'start' : 'end')).join('') }
}
// A dimension beside a label column: its line in a lane between the gutter and the text, its text at the column's x,
// on the grid. lines: [[text, size, weight]...]
function dimLane(x, y1, y2, lines) {
  const lx = x - 7
  const y = gridY((y1 + y2) / 2 + 5)
  return `${line(lx, y1, lx, y2, { stroke: C.muted, sw: 1 })}${line(lx - 5, y1, lx + 5, y1, { stroke: C.muted, sw: 1 })}${line(lx - 5, y2, lx + 5, y2, { stroke: C.muted, sw: 1 })}`
    + lines.map(([t, size, weight], i) => text(x, y + i * GRID, t, { size, fill: C.muted, weight })).join('')
}
const noteLines = (x, y, lines) => lines.map((t, i) => note(x, gridY(y) + i * GRID, t, 'start', 13)).join('')

// Side view through a stall: looking at a dividing panel, front (pilaster) on the left as on Bradley's sheet,
// back wall on the right. Labels on the left, by the front; heights to the right of the back wall.
function side(name, style) {
  const s = 1.65, x0 = 196, depth = LAYOUT.depth, wt = 14
  const floor = 194, wallH = style === 'ch' ? 112 : 100
  const Y = (i) => floor - i * s, X = (i) => x0 + i * s
  const pil = { ob: [1, 82], fm: [1, 70], ch: [12, 95], ftc: [0, 96] }[style]
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
  b += hdim(floor + 44, X(0), X(depth), '61-1/4" to face')
  b += vdim(X(depth) + wt + 12, Y(70), Y(12), '58"') + vdim(X(depth) + wt + 12, Y(12), Y(0), '12"')
  b += text(X(depth) + wt + 8, Y(wallH) + 14, 'back wall', { size: 13, fill: C.muted })
  // labels, left of the front: what each part is
  const L = [
    { t: 'pilaster (front)', to: [X(0), Y(style === 'fm' ? 64 : style === 'ob' ? 76 : 80)] },
    { t: 'panel', to: [X(10), Y(42)] },
    { t: 'bracket', to: [X(1.5) + 2, Y(18) + 2] },
  ]
  if (style === 'ob') L.push({ t: 'headrail', to: [X(-0.6), Y(81)] })
  if (style !== 'ch') L.push({ t: style === 'fm' ? ['shoe, anchored', 'to floor'] : 'shoe', to: [X(-0.6), Y(2)] })
  if (style === 'ftc') L.push({ t: 'ceiling anchor', to: [X(-0.6), Y(94.5)] })
  if (style === 'ch') L.push({ t: 'steel above ceiling', to: [X(-1), Y(103.5)] }, { t: 'hanger', to: [X(1.5), Y(99)] })
  b += labelColumn(L, { x: x0 - 46, side: 'left', hi: SV.h - 14 }).svg
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
  const lx = cx + r + 8 + GUTTER // label column x: the gutter sits 8 px outside the circle
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
    after.push(dimLane(lx, y1, y2, [['2" min into', DIM, 600], ['3" min structural', 13, 500], ['concrete', 13, 500]]))
  }
  if (kind === 'hanger' || kind === 'ftc-ceiling') {
    // I-beam (by others), bevel washer, threaded rod, spacer through the finished ceiling, leveling bar in the stile
    b += rect(0, 0, IW, 126, { fill: 'HATCH', stroke: 'none' })
    b += `<path d="M90 34 h120 v9 h-54 v32 h54 v9 h-120 v-9 h54 v-32 h-54 z" fill="${C.orange}"/>` // I-beam section
    b += line(150, 84, 150, 200, { stroke: C.ink, sw: 4 }) + rect(136, 84, 28, 7, { fill: C.part, sw: 1.2 })
    b += rect(140, 100, 20, 26, { fill: C.part, sw: 1.2 }) + line(0, 126, IW, 126, { sw: 2.5 })
    b += rect(90, 150, 120, 160) + line(150, 150, 150, 200, { stroke: C.ink, sw: 4 }) + `<path d="M84 150 h132 v-8 h-124 v-16 h-8 z" fill="${C.orange}"/>` + nut(150, 160) + nut(150, 176) // rod shown through the stile
    lab.push(['I-beam (by others)', [210, 38]], ['bevel washer', [164, 90]], ['spacer', [160, 112]], ['finished ceiling', [252, 126]], ['leveling bar', [216, 146]], ['threaded rod', [152, 200]], ['stile', [210, 240]])
  }
  if (kind === 'headrail') {
    // cross-section: the headrail clamps over the stile top (Bradley); enclosed extrusion with a sloping top and a
    // raised grip-resistant face edge (Bobrick)
    b += rect(118, 150, 64, 170) // stile
    b += `<path d="M96 86 L204 74 L204 168 L182 168 L182 150 L118 150 L118 168 L96 168 Z" fill="${C.orange}"/>`
    b += rect(90, 72, 8, 100, { fill: C.ink, stroke: 'none' }) // raised face edge, above the top's high side
    lab.push(['grip-resistant face', [94, 72]], ['sloping top', [203, 74.1]], [['headrail, extruded', 'aluminum'], [204, 120]], ['stile', [182, 230]])
    after.push(noteLines(lx, 202, ['cross-section, fixed', 'to each wall with a', 'wall bracket']))
  }
  if (kind === 'bracket') {
    // seen from above: panel end to a perpendicular stile, U-bracket (Bobrick #1000972: panel to perp. stile)
    b += rect(40, 128, 150, 18, { fill: C.part }) + rect(188, 60, 26, 170, { fill: C.part })
    b += `<path d="M150 118 h36 v38 h-36" fill="none" stroke="${C.orange}" stroke-width="5" stroke-linejoin="round"/>`
    inside.push(['panel', [80, 146], P([56, 196])])
    lab.push(['stile', [214, 90]], ['U-bracket', [186, 156]])
    after.push(noteLines(lx, 234, ['seen from above']))
  }
  b += `</g></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  // the column stops one empty grid line above the notes or dimension under it
  // (the anchor's dimension starts a grid line higher, at the slab); the ceiling details start one grid line lower so
  // the bevel washer's leader passes under the I-beam
  const notesAt = { anchor: 186, 'ftc-floor': 186, headrail: 202, bracket: 234 }[kind]
  const lo = kind === 'hanger' || kind === 'ftc-ceiling' ? ROW0 + GRID : ROW0
  b += labelColumn(lab.map(([t, to]) => ({ t, to: P(to) })), { x: lx, lo, hi: notesAt ? notesAt - PITCH : H - 14 }).svg
  // a label inside the circle: centred under the part, leader straight up
  for (const [t, to, at] of inside) { const p = P(to); b += line(at[0], at[1] - 14, p[0], p[1], { stroke: C.orange, sw: 1.2 }) + `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="${C.orange}"/>` + labelText(at[0], at[1], [t], 'middle') }
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
plan('sheet-plan-m', true)
for (const [name, [style, dets]] of Object.entries(STYLES)) {
  front(`${name}-front-m`, style, true)
  sheets[name] = [
    { file: `${planName}.svg`, label: 'Plan', wide: true },
    { file: `${front(`${name}-front`, style)}.svg`, label: 'Front elevation', wide: true },
    { file: `${side(`${name}-side`, style)}.svg`, label: 'Side view' },
    ...dets.map((d, i) => ({ file: `${detail(`${name}-detail-${d}`, d)}.svg`, label: `Detail ${String.fromCharCode(65 + i)}` })),
  ]
}
writeFileSync(new URL('sheets.json', OUT), JSON.stringify(sheets, null, 2) + '\n')

// ---------- gravity hinge close-ups (2026-10-27) ----------
// Front view at the hinge edge, the door cut away at the hinge, in the same detail circle as the mounting details.
// Facts (see drawing-check.md): ASI Global construction features (upper pin through door and bracket in a nylon
// bushing; gravity-positioning bottom hinge) and Integrated Privacy installation guide (box cam in the lower door
// hinge, door placed over the hinge pintle, lowest point of the cam pintle sets the rest position, rotate, tighten the
// locking nut; hinge pin inserted until flush with the top of the door); All American Metal metal installation
// instructions (top hinge bracket with nylon bushing, flange at top; bottom hinge bracket with cam pintle and locking
// nut under it; loosen the 1/2" nut, set the rest position, hold the bolt base with a slotted screwdriver, retighten);
// Bradley and Hadrian metal guides (male cam on the bottom hinge, female cam in the door; loosen the nut, set the
// angle, tighten). Metpar: no-rise cam at the bottom, pin with nylon insert at the top. Our own flat view; no sizes
// drawn (none common to the brands).
function hingeDetail(name, kind) {
  const { w: W, h: H } = SV, cx = 118, cy = 125, r = 106, k = r / 120
  const P = ([x, y]) => [+(cx + (x - 150) * k).toFixed(1), +(cy + (y - 145) * k).toFixed(1)]
  const lx = cx + r + 8 + GUTTER
  let b = `<g transform="translate(${cx} ${cy}) scale(${k.toFixed(4)}) translate(-150 -145)"><clipPath id="c-${name}"><circle cx="150" cy="145" r="120"/></clipPath><g clip-path="url(#c-${name})">`
  const bolt = (x, y) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`
  b += rect(20, -10, 88, 330) // pilaster
  let lab, notes, title, desc
  if (kind === 'cam') {
    b += rect(128, -10, 210, 160) // door, bottom edge at 150
    b += rect(128, 98, 64, 52, { sw: 1.2, dash: '5 3' }) // the door's bottom hinge, cut away
    b += `<path d="M138 106 H176 V150 H168 V140 L157 130 L146 140 V150 H138 Z" fill="${C.orange}"/>` // box cam
    b += `<path d="M146 168 V140 L157 130 L168 140 V168 Z" fill="#fff" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>` // cam pintle
    b += rect(84, 140, 24, 62) + rect(108, 168, 74, 18) + bolt(96, 156) + bolt(96, 186) // bottom hinge bracket
    b += rect(146, 186, 22, 11, { fill: C.orangeTint, stroke: C.orange, sw: 2 }) // locking nut
    b += rect(151, 197, 12, 12, { sw: 1.2 }) + line(157, 199, 157, 208, { sw: 2 }) // bolt base, slotted
    lab = [['door', [218, 64]], ['box cam', [176, 118]], ['cam pintle', [168, 158]], [['bottom hinge', 'bracket'], [182, 177]], [['locking nut, the', 'adjusting point'], [168, 191]]]
    notes = ['front view, door', 'cut away at the cam']
    title = 'Detail: bottom of a gravity hinge'
    desc = 'Front view of the bottom of a gravity (cam) hinge, the door cut away at the hinge. A box cam in the door rests on the cam pintle of the bottom hinge bracket, which is fixed to the pilaster. The locking nut under the bracket is the adjusting point: loosen it, set the door to its rest position and tighten it again.'
  } else {
    b += `<path d="M128 112 H338 V320 H128 V170 H172 V138 H128 Z" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>` // door, top edge at 112, notched at the hinge
    b += rect(128, 112, 64, 92, { fill: 'none', sw: 1.2, dash: '5 3' }) // the door's top hinge, cut away
    b += rect(84, 124, 24, 62) + rect(108, 142, 60, 24) + bolt(96, 138) + bolt(96, 172) // top hinge bracket
    b += rect(141, 142, 18, 24, { fill: C.orangeTint, stroke: C.orange, sw: 2 }) + rect(137, 138, 26, 5, { fill: C.orangeTint, stroke: C.orange, sw: 2 }) // bushing, flange at top
    b += rect(146, 112, 8, 82, { fill: C.orange, stroke: C.orange, sw: 1 }) // hinge pin
    b += line(150, 52, 150, 96, { stroke: C.muted, sw: 1.5 }) + `<path d="M143 92 L150 104 L157 92 Z" fill="${C.muted}"/>` // in from above
    lab = [['door', [212, 222]], [['hinge pin, flush', 'with the door top'], [154, 114]], ['nylon bushing', [159, 150]], ['top hinge bracket', [168, 160]]]
    notes = ['front view, door', 'cut away at the pin']
    title = 'Detail: top of a gravity hinge'
    desc = 'Front view of the top of a gravity (cam) hinge, the door cut away at the hinge. The hinge pin goes in from above, through the door\'s hinge and the top hinge bracket on the pilaster, turns in a nylon bushing, and sits flush with the top of the door.'
  }
  b += text(75, 100, 'pilaster', { size: 14, fill: C.muted, anchor: 'middle' })
  b += `</g></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  const notesAt = 218
  b += labelColumn(lab.map(([t, to]) => ({ t, to: P(to) })), { x: lx, hi: notesAt - PITCH }).svg
  b += noteLines(lx, notesAt, notes)
  return svg(name, W, H, title, desc, b)
}
made.push(hingeDetail('hinge-detail-cam', 'cam'), hingeDetail('hinge-detail-top-pin', 'top-pin'))

// ---------- material cross-sections (edge view, cut through a door) ----------
// Construction and door thicknesses as sourced in pages/blog_what-are-bathroom-partitions-made-of.md and
// pages/hardware_doors.md (checked 2026-10-26); edges as confirmed in pages/partitions_*.md (checked 2026-10-27), see
// drawing-check.md. Overall thickness is dimensioned only where a manufacturer gives it. Face, skin and edge-layer
// thicknesses and the chamfer size are not published, so they are drawn small and not dimensioned. Callout 3, the
// edge, is drawn in ink: phenolic machined with a small chamfer on both arrises, HDPE rounded to a 1/4" radius (to
// scale), laminate with a thin laminate layer sealing the core end, steel and stainless with a formed edge molding
// that interlocks with the two face sheets.
const MATERIALS = {
  phenolic: { name: 'Phenolic (compact laminate)', t: 0.75, dim: '3/4"', src: 'Bobrick DuraLine, Bradley PH400' },
  'solid-plastic': { name: 'Solid plastic (HDPE)', t: 1, dim: '1"', src: 'Scranton Products Hiny Hiders' },
  'plastic-laminate': { name: 'Plastic laminate', t: 1, dim: '1"', src: 'Bobrick DesignerSeries HPL' },
  'powder-coated-steel': { name: 'Powder coated steel', t: 1, dim: '1"', src: 'Metpar powder coated' },
  'stainless-steel': { name: 'Stainless steel', t: 1, dim: '1"', src: 'Metpar stainless steel' },
}
// One door cut through near its edge: a break line on the left, the edge on the right. k = px per inch.
// Returns the body plus the points callouts aim at.
function matSection(kind, x0, y0, len, k) {
  const { t } = MATERIALS[kind], T = t * k, x1 = x0 + len, y1 = y0 + T
  const brk = (y) => `M${x0} ${y0} L${x0 + 6} ${y0 + T * 0.3} L${x0 - 6} ${y0 + T * 0.6} L${x0} ${y1}`
  // The edge outline, top arris to bottom arris.
  let edge = `L${x1} ${y0} L${x1} ${y1}`
  if (kind === 'phenolic') { const c = Math.max(3, Math.round(k * 0.07)); edge = `L${x1 - c} ${y0} L${x1} ${y0 + c} L${x1} ${y1 - c} L${x1 - c} ${y1}` }
  if (kind === 'solid-plastic') { const r = 0.25 * k; edge = `L${x1 - r} ${y0} A${r} ${r} 0 0 1 ${x1} ${y0 + r} L${x1} ${y1 - r} A${r} ${r} 0 0 1 ${x1 - r} ${y1}` }
  const clip = `<clipPath id="m-${kind}-${x0}-${y0}"><path d="M${x0} ${y0} ${edge} L${x0} ${y1} L${x0 - 6} ${y0 + T * 0.6} L${x0 + 6} ${y0 + T * 0.3} Z"/></clipPath>`
  let g = '', over = ''
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
    const band = face // the edge is laminated like the faces: a thin layer sealing the core end
    g += rect(x0 - 10, y0, len + 10 - band, T, { fill: C.orange, stroke: 'none' })
    // particleboard: a fixed scatter of chips
    let seed = 7
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < len * T / 70; i++) {
      const cx = x0 - 6 + rnd() * (len - band - 4), cy = y0 + face + 2 + rnd() * (T - 2 * face - 4)
      g += `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${(2 + rnd() * 4).toFixed(1)}" height="1.6" fill="#fff" transform="rotate(${Math.round(rnd() * 180)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
    }
    g += rect(x0 - 10, y0, len + 10 - band, face, { fill: C.part, sw: 1 }) + rect(x0 - 10, y1 - face, len + 10 - band, face, { fill: C.part, sw: 1 }) // HPL faces
    g += rect(x1 - band, y0, band, T, { fill: C.part, sw: 1 }) // HPL edge
    pts.edge = [x1 - band / 2, y0 + T / 2]
  }
  if (kind === 'powder-coated-steel' || kind === 'stainless-steel') {
    const skin = 3
    // formed edge molding: a channel whose web is the door edge and whose flanges continue the face planes, hooked
    // behind the turned-in ends of the two face sheets
    const w = Math.max(12, Math.round(k * 0.3)), h = Math.max(4, Math.round(T * 0.24)), j = x1 - w // j: the joint
    const hook = Math.max(4, Math.round(w * 0.35)), r = j - (k < 50 ? 2 : 4) // r: the face sheets' turned-in ends
    g += rect(x0 - 10, y0, j - x0 + 10, T, { fill: C.orangeTint, stroke: 'none' })
    // honeycomb cut through: the cell walls run face to face, so the section shows them as lines across the core,
    // in pairs where two cells are bonded; it stops short of the edge molding
    const cell = Math.max(10, k * 0.16)
    let d = '', n = 0
    for (let x = x0 - 10; x < r - hook - 4; x += n++ % 2 ? cell : 3) d += `M${x.toFixed(1)} ${y0 + skin} V${y1 - skin}`
    g += `<path d="${d}" fill="none" stroke="${C.orange}" stroke-width="2"/>`
    g += rect(x0 - 10, y0, r - x0 + 10, skin, { fill: C.ink, stroke: 'none' }) + rect(x0 - 10, y1 - skin, r - x0 + 10, skin, { fill: C.ink, stroke: 'none' }) // face sheets
    const sw = k < 50 ? 1.5 : 2
    // face sheets turned in at the joint
    over += `<path d="M${r - sw / 2} ${y0 + skin} V${y0 + skin + h} M${r - sw / 2} ${y1 - skin} V${y1 - skin - h}" fill="none" stroke="${C.ink}" stroke-width="${sw}"/>`
    // the molding: flanges in the face planes, the web on the edge, the flange tips hooked behind the face returns
    over += `<path d="M${j} ${y0 + skin / 2} H${x1 - skin / 2} V${y1 - skin / 2} H${j}" fill="none" stroke="${C.ink}" stroke-width="${skin}"/>`
    over += `<path d="M${j + sw / 2} ${y0 + skin} V${y0 + skin + h + sw + 1} H${r - hook} M${j + sw / 2} ${y1 - skin} V${y1 - skin - h - sw - 1} H${r - hook}" fill="none" stroke="${C.ink}" stroke-width="${sw}"/>`
    pts.edge = [x1 - skin / 2, y0 + T / 2]
  }
  const body = `${clip}<g clip-path="url(#m-${kind}-${x0}-${y0})">${g}</g>${over}<path d="${brk()} M${x0} ${y0} ${edge} L${x0} ${y1}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  return { body, pts, T, x1, y1 }
}

{
  const desc = {
    phenolic: 'A phenolic (compact laminate) door cut through near its edge: layers of resin-impregnated kraft paper fused into one solid core, with decorative melamine faces. The edge is the fused sheet itself, machined smooth with a small chamfer on both corners; it is black, or matches the face color on color-through lines. Doors are 3/4 inch thick.',
    'solid-plastic': 'A solid plastic (HDPE) door cut through near its edge: one homogeneous sheet of high-density polyethylene, with no separate core, faces or edge band, and the color running all the way through. The edge is rounded to about a 1/4 inch radius. 1 inch thick.',
    'plastic-laminate': 'A plastic laminate door cut through near its edge: a resin-impregnated particleboard core with high-pressure laminate bonded to both faces, and a thin laminate layer covering the edge so the core is sealed all round. 1 inch thick.',
    'powder-coated-steel': 'A powder coated steel door cut through near its edge: two galvannealed steel face sheets, powder coated, over a honeycomb core. The edge is a formed steel molding that interlocks with the turned-in ends of both face sheets. 1 inch thick.',
    'stainless-steel': 'A stainless steel door cut through near its edge: two type 304 stainless steel face sheets over a honeycomb core. The edge is a formed stainless molding that interlocks with the turned-in ends of both face sheets. 1 inch thick.',
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
    'Five partition doors side by side, each cut through and seen edge on at the same scale: phenolic 3/4 inch, layered kraft paper core with melamine faces and a machined, chamfered edge; solid plastic (HDPE) 1 inch, one solid sheet with a rounded edge; plastic laminate 1 inch, particleboard core with laminate on the faces and the edge; powder coated steel and stainless steel 1 inch, steel faces over a honeycomb core joined by a formed, interlocking edge molding.', b))
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


// ---------- phone variants ----------
// A 780-wide drawing shrunk into a phone's ~340 px content column would put its text at about 6 px. So every wide
// drawing also has a phone variant, drawn 360 wide (text 13 px at 1:1, about 12 px on the phone), still landscape
// (at least 1.6 : 1): <name>-m.svg, or <name>-m1.svg, -m2.svg … when it takes more than one frame. Long labels give
// way to the letters and numbers of the page's key; dimensions keep their values. The build shows them below 640 px.
const PW = 360
const phoneMade = []
function phone(name, h, body, base = name.replace(/-m\d*$/, '')) {
  const [title, desc] = META[base]
  phoneMade.push(svg(name, PW, Math.round(h), title, desc, body))
}
// Draw at a smaller scale with 13 px dimensions.
function withPhone(s, fn) {
  const o = [S, DIM]; S = s; DIM = 13
  try { return fn() } finally { [S, DIM] = o }
}
const elevM = (o) => elevation({ wt: 12, slabT: 14, underGap: 14, ...o })
// Centre a run of stalls in the frame: x0 for a run of `stalls` at scale s.
const centreX0 = (stalls, s, P = 6) => Math.round((PW - (2 * 12 + (0.6 + stalls * (P + 24 + 1.2) + P + 0.6) * s)) / 2)
// Heights in px above the floor line: floor so the tallest point (topIn inches) sits 12 px from the top.
const H_M = 222

// The four mounting styles, front view, one frame each (used as the phone hero on their pages).
{
  const defs = {
    'mounting-overhead-braced': [{ headrail: true, pil: [0, 83] }, 100, (e) => vdim(e.wallR + 22, e.Y(83), e.Y(0), '83"') + vdim(e.wallL - 10, e.Y(70), e.Y(12), '58"', 'left') + vdim(e.wallL - 10, e.Y(12), e.Y(0), '12"', 'left')
      + callout(1, e.X(28), e.Y(92), [e.X(28), e.Y(83) + 2]) + callout(2, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]) + callout(3, e.X(e.last + 3), e.Y(50), null)],
    'mounting-floor-mounted': [{ P: 8, pil: [0, 69], door: [11, 69], emphasis: 'floor' }, 100, (e) => vdim(e.wallR + 22, e.Y(69), e.Y(0), '69"')
      + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 6), e.Y(-2)]) + callout(2, e.X(e.xs[0] + 3), e.Y(82), [e.X(e.xs[0] + 3), e.Y(70)])],
    'mounting-ceiling-hung': [{ ceiling: 96, plenum: true, pil: [12, 95], floorAnchors: false, hangers: true, wallH: 112 }, 118, (e) => vdim(e.wallR + 22, e.Y(95), e.Y(12), '83"') + vdim(e.wallR + 22, e.Y(12), e.Y(0), 'clear') + vdim(e.wallL - 10, e.Y(70), e.Y(12), '58"', 'left')
      + callout(1, e.X(8), e.Y(118), [e.X(8), e.Y(106)]) + callout(2, e.X(e.last + 3) - 24, e.Y(84), [e.X(e.last + 3), e.Y(97)]) + callout(3, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(6)])],
    'mounting-floor-to-ceiling': [{ ceiling: 96, pil: [0, 96], ceilingAnchors: true }, 100, (e) => vdim(e.wallL - 10, e.Y(70), e.Y(12), '58"', 'left') + vdim(e.wallL - 10, e.Y(12), e.Y(0), '12"', 'left')
      + callout(1, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)]) + callout(2, e.X(e.last + 3) - 22, e.Y(84), [e.X(e.last + 3), e.Y(94)]) + callout(3, e.X(e.xs[1] + 18.6), e.Y(6), null)],
  }
  for (const [name, [o, topIn, extra]] of Object.entries(defs)) {
    const floor = H_M - 14 - 14 - 12 - 2, s = (floor - 14) / topIn
    withPhone(s, () => {
      const e = elevM({ ...o, x0: centreX0(3, s, o.P ?? 6), stalls: 3, floor })
      phone(`${name}-m`, H_M, e.body + extra(e))
    })
  }
}

// All four styles: two frames of two styles each, at one scale, floors aligned.
{
  const styles = [
    ['Overhead braced', { headrail: true, pil: [0, 83] }],
    ['Floor mounted', { pil: [0, 69], door: [11, 69], emphasis: 'floor' }],
    ['Ceiling hung', { ceiling: 96, plenum: true, pil: [12, 95], floorAnchors: false, hangers: true, wallH: 112 }],
    ['Floor to ceiling', { ceiling: 96, pil: [0, 96], ceilingAnchors: true }],
  ]
  const s = 1.5, floor = 178, h = 222
  withPhone(s, () => {
    for (const f of [0, 1]) {
      let b = ''
      styles.slice(f * 2, f * 2 + 2).forEach(([nm, o], i) => {
        const e = elevM({ ...o, x0: i * 180 + 26, stalls: 2, floor, wallH: o.wallH ?? 100 })
        b += e.body + text(e.X(e.runIn / 2), 214, nm, { size: 15, weight: 700, anchor: 'middle' })
      })
      phone(`mounting-styles-compare-m${f + 1}`, h, b)
    }
  })
}

// Parts of a partition, and the four gaps: three stalls, callouts as on the desktop drawing.
{
  const s = 1.68, floor = 182
  withPhone(s, () => {
    let e = elevM({ x0: centreX0(3, s), stalls: 3, floor, headrail: true, pil: [0, 83], emphasis: 'none' })
    let dx = e.xs[0] + e.P + e.G
    let b = e.body
    const o = { fill: C.orange, stroke: C.orange }
    b += rect(e.X(dx) - 1.5, e.Y(66), 5, 5.6 * s, o) + rect(e.X(dx) - 1.5, e.Y(20), 5, 5.6 * s, o) // hinges
    b += rect(e.X(e.xs[1]) - 1.5, e.Y(44) - 3, 6, 10, o) // latch and keeper
    b += callout(1, e.X(60), e.Y(94), [e.X(60), e.Y(83) + 2]) + callout(2, e.X(e.last + 3), e.Y(50), null) + callout(3, e.X(dx + 12), e.Y(28), null)
      + callout(4, e.X(dx) - 22, e.Y(66) + 5, [e.X(dx) - 2, e.Y(66) + 5]) + callout(5, e.X(e.xs[1]) + 24, e.Y(22), [e.X(e.xs[1]) + 3, e.Y(44) + 2]) + callout(6, e.X(e.xs[1] + 3), e.under, [e.X(e.xs[1] + 3), e.Y(1)])
    phone('partition-anatomy-m', H_M, b)

    e = elevM({ x0: centreX0(3, s), stalls: 3, floor, headrail: true, pil: [0, 83], emphasis: 'none' })
    dx = e.xs[0] + e.P + e.G
    b = e.body
    const gap = (x, y, w, hh) => rect(x, y, w, hh, { fill: C.orange, stroke: 'none' })
    b += gap(e.X(dx) - 2, e.Y(70), 4, 58 * s) + gap(e.X(dx + e.D) - 2, e.Y(70), 4, 58 * s) // door edges
    b += rect(e.X(dx), e.Y(12), e.D * s, 12 * s - 1, { fill: C.orangeTint, stroke: C.orange, sw: 1.5, dash: '4 3' }) // under
    b += rect(e.X(dx), e.Y(83) + 4, e.D * s, 13 * s - 4, { fill: C.orangeTint, stroke: C.orange, sw: 1.5, dash: '4 3' }) // above
    b += gap(e.X(0) - 1, e.Y(83), 3, 83 * s) // at the wall
    b += callout(1, e.X(dx + e.D) + 22, e.Y(50), [e.X(dx + e.D) + 1, e.Y(50)]) + callout(2, e.X(dx + 12), e.under, [e.X(dx + 12), e.Y(4)]) + callout(3, e.X(dx + 12) + 30, e.Y(95), [e.X(dx + 12), e.Y(77)])
      + callout(4, e.wallL - 14, e.Y(40), [e.X(0), e.Y(40)]) + vdim(e.wallR + 22, e.Y(12), e.Y(0), '12"')
    phone('stall-gaps-m', H_M, b)
  })
}

// Hinge types: the three hinges in one frame.
{
  let b = ''
  const o = { fill: C.orange, stroke: C.orange }
  const cap = (x, t) => text(x, 188, t, { size: 14, weight: 700, anchor: 'middle' })
  // gravity cam
  b += rect(18, 14, 14, 140) + rect(35, 26, 52, 116)
  b += rect(28, 29, 14, 6, o) + line(35, 26, 35, 38, { stroke: C.orange, sw: 2 })
  b += rect(27, 126, 16, 9, o) + `<path d="M28 131 l4 -3 l4 3 l4 -3" stroke="#fff" stroke-width="1.5" fill="none"/>`
  b += callout(1, 104, 32, [43, 32]) + callout(2, 104, 130, [44, 130]) + cap(58, 'Gravity (cam)')
  // wrap-around, seen from above
  b += rect(130, 80, 42, 14) + rect(188, 82, 52, 10)
  b += `<path d="M160 75 h16 v24 h-16" fill="none" stroke="${C.orange}" stroke-width="3.5" stroke-linejoin="round"/>`
  b += `<path d="M198 77 h-15 v20 h15" fill="none" stroke="${C.orange}" stroke-width="3.5" stroke-linejoin="round"/>`
  b += `<circle cx="179.5" cy="87" r="5" fill="${C.orange}"/>`
  b += text(150, 116, 'pilaster', { size: 13, fill: C.muted, anchor: 'middle' }) + text(214, 116, 'door', { size: 13, fill: C.muted, anchor: 'middle' })
  b += text(184, 146, 'seen from above', { size: 13, fill: C.muted, anchor: 'middle' }) + callout(3, 179.5, 46, [179.5, 80]) + cap(184, 'Wrap-around')
  // continuous
  b += rect(256, 14, 14, 140) + rect(276, 26, 52, 116) + rect(270, 26, 7, 116, o)
  for (let y = 38; y < 142; y += 12) b += line(270, y, 277, y, { stroke: '#fff', sw: 1 })
  b += callout(4, 346, 84, [279, 84]) + cap(298, 'Continuous')
  phone('hinge-types-m', 200, b)
}

// Latch and keeper: both latches in one frame.
{
  let b = ''
  const unit = (ox, title, indicator) => {
    let u = rect(ox + 14, 30, 74, 136) + rect(ox + 92, 18, 22, 160)
    u += rect(ox + 56, 86, 32, 14, { fill: C.orange, stroke: C.orange, rx: 2 }) // latch housing on door
    u += rect(ox + 82, 90, 17, 6, { fill: C.ink, stroke: 'none' }) // bolt into keeper
    u += rect(ox + 95, 81, 15, 24, { fill: C.part, stroke: C.orange, sw: 2 }) // keeper on pilaster
    if (indicator) u += `<circle cx="${ox + 34}" cy="93" r="11" fill="#fff" stroke="${C.orange}" stroke-width="2"/><circle cx="${ox + 34}" cy="93" r="3.5" fill="${C.orange}"/>`
    u += text(ox + 64, 200, title, { size: 14, weight: 700, anchor: 'middle' })
    return u
  }
  b += unit(16, 'Slide latch', false) + unit(196, 'Indicator latch', true)
  b += callout(1, 16 + 72, 60, [16 + 72, 86]) + callout(2, 16 + 136, 93, [16 + 110, 93]) + callout(3, 196 + 34, 56, [196 + 34, 82])
  b += text(16 + 51, 23, 'door', { size: 13, fill: C.muted, anchor: 'middle' }) + text(16 + 103, 12, 'pilaster', { size: 13, fill: C.muted, anchor: 'middle' })
  phone('latch-keeper-m', 212, b)
}

// Measuring a replacement door: the door between its pilasters (A–D), then its edge and swing (E, F).
withPhone(1, () => {
  let b = ''
  const ox = 112 // left pilaster
  const pl = ox, pr = ox + 112, dL = pl + 17, dR = pr - 4, top = 36, dTop = 50, dBot = 166, floor = 186
  b += rect(pl, top, 13, floor - top) + rect(pr, top, 13, floor - top)
  b += rect(dL, dTop, dR - dL, dBot - dTop, { fill: C.part, stroke: C.orange, sw: 2.5 })
  b += rect(pl - 24, floor, pr + 13 - pl + 48, 10, { fill: 'HATCH', stroke: 'none' }) + line(pl - 24, floor, pr + 37, floor)
  b += hdim(26, dL, dR, 'A') + vdim(pr + 13 + 14, dTop, dBot, 'B') + hdim(216, pl + 13, pr, 'C') + vdim(pl - 12, dBot, floor, 'D', 'left')
  phone('measure-replacement-door-m1', 226, b)
  b = ''
  // edge view
  b += text(70, 26, 'Edge view', { size: 14, weight: 700, anchor: 'middle' })
  b += rect(64, 42, 12, 136, { fill: C.orange, stroke: C.orange }) + hdim(204, 64, 76, 'E')
  // from outside the stall
  const px = 170
  b += text(px + 85, 26, 'From outside the stall', { size: 14, weight: 700, anchor: 'middle' })
  b += rect(px + 8, 68, 16, 16) + rect(px + 134, 68, 16, 16) + line(px + 24, 76, px + 134, 76, { stroke: C.orange, sw: 3.5 })
  b += `<path d="M${px + 24} 76 A110 110 0 0 1 ${px + 134} 186" fill="none" stroke="${C.muted}" stroke-dasharray="5 5" stroke-width="1.5"/>`
  b += line(px + 24, 76, px + 24, 186, { stroke: C.orange, sw: 2, dash: '6 4' })
  b += text(px + 79, 56, 'stall inside ↓', { size: 13, fill: C.muted, anchor: 'middle' })
  b += text(px + 62, 150, 'F', { size: 14, fill: C.muted, weight: 700, anchor: 'middle' })
  phone('measure-replacement-door-m2', 220, b)
})

// Measuring a new restroom: the plan with its letters only, then the section.
withPhone(1, () => {
  let b = ''
  const ox = 40, oy = 36, iw = 262, ih = 136, t = 10
  const L = ox + t, T = oy + t, R = L + iw, B = T + ih
  const dL = R - 92, dR = R - 30
  b += rect(ox, oy, iw + 2 * t, t, { fill: 'HATCH', stroke: 'none' }) + rect(ox, oy, t, ih + 2 * t, { fill: 'HATCH', stroke: 'none' })
  b += rect(R, oy, t, ih + 2 * t, { fill: 'HATCH', stroke: 'none' }) + rect(ox, B, dL - ox, t, { fill: 'HATCH', stroke: 'none' }) + rect(dR, B, R + t - dR, t, { fill: 'HATCH', stroke: 'none' })
  b += `<path d="M${L} ${T} H${R} V${B} H${dR} M${dL} ${B} H${L} Z" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`
  b += line(dR, B, dR, B - (dR - dL), { stroke: C.ink, sw: 2.5 }) + `<path d="M${dL} ${B} A${dR - dL} ${dR - dL} 0 0 1 ${dR} ${B - (dR - dL)}" fill="none" stroke="${C.muted}" stroke-width="1.5" stroke-dasharray="5 5"/>`
  b += line(L, T + 3, R, T + 3, { stroke: C.orange, sw: 5 })
  const fl = [L + 34, L + 92, L + 150]
  for (const f of fl) b += `<circle cx="${f}" cy="${T + 26}" r="6" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>` + line(f - 9, T + 26, f + 9, T + 26, { stroke: C.muted, sw: 1 }) + line(f, T + 17, f, T + 35, { stroke: C.muted, sw: 1 })
  fl.forEach((f, i) => {
    const y = T + 52 + i * 20
    b += line(L, y, f, y, { stroke: C.muted, sw: 1 }) + line(f, y - 5, f, y + 5, { stroke: C.muted, sw: 1 }) + line(f, T + 33, f, y, { stroke: C.muted, sw: 1, dash: '2 3' })
    b += text(f + 6, y + 5, 'E', { size: 13, fill: C.muted, weight: 700 })
  })
  b += line(L, T + 44, L, T + 100, { stroke: C.muted, sw: 1 })
  b += hdim(oy - 12, L, R, 'A') + vdim(R + t + 14, T, B, 'B') + hdim(B + t + 22, dR, R, 'D')
  phone('measure-new-restroom-plan-m', B + t + 30, b)

  b = ''
  const sx = 40, sw = 262, wt = 10, top = 16
  const L2 = sx + wt, R2 = L2 + sw, under = top + 20, ceil = under + 32, floor = ceil + 118
  b += rect(sx, top, sw + 2 * wt, 20, { fill: 'HATCH', stroke: 'none' }) + line(sx, under, R2 + wt, under)
  b += rect(sx, under, wt, floor - under, { fill: 'HATCH', stroke: 'none' }) + rect(R2, under, wt, floor - under, { fill: 'HATCH', stroke: 'none' })
  b += line(L2, under, L2, floor) + line(R2, under, R2, floor) + line(L2, ceil, R2, ceil)
  b += rect(sx, floor, sw + 2 * wt, 20, { fill: 'HATCH', stroke: 'none' }) + line(sx, floor, R2 + wt, floor)
  b += vdim(L2 + 150, ceil, floor, 'C')
  const fx = R2 + wt + 12
  b += line(R2 - 30, top + 10, fx - 4, top + 10, { stroke: C.muted, sw: 1 }) + text(fx, top + 15, 'F', { size: 13, fill: C.muted, weight: 700 })
  b += line(R2 - 30, floor + 10, fx - 4, floor + 10, { stroke: C.muted, sw: 1 }) + text(fx, floor + 15, 'F', { size: 13, fill: C.muted, weight: 700 })
  phone('measure-new-restroom-section-m', floor + 20 + 8, b)
})

// Urinal spacing: dimensions kept, notes left to the page text.
withPhone(1, () => {
  const s = 3, wx = 14, wy = 12
  const X = (i) => wx + 10 + i * s, Y = (i) => wy + 10 + i * s
  const run = 92, cls = [15, 45, 75]
  const odim = (y, x1, x2, label) => line(x1, y, x2, y, { stroke: C.orange, sw: 2.5 }) + line(x1, y - 5, x1, y + 5, { stroke: C.orange, sw: 2 }) + line(x2, y - 5, x2, y + 5, { stroke: C.orange, sw: 2 }) + text((x1 + x2) / 2, y - 8, label, { size: 13, weight: 700, anchor: 'middle' })
  let b = ''
  b += rect(wx, wy, run * s + 10, 10, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(run), Y(0))
  const front = Y(14), clear = front + 21 * s, dimY = clear + 30
  b += rect(wx, wy, 10, dimY + 30 - wy, { fill: 'HATCH', stroke: 'none' }) + line(X(0), Y(0), X(0), dimY + 30)
  b += `<path d="M${X(run) - 3} ${wy - 4} l-4 9 l8 5 l-4 9" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`
  for (const c of cls) {
    b += `<path d="M${X(c - 9)} ${Y(0)} v${8 * s} q0 ${6 * s} ${9 * s} ${6 * s} q${9 * s} 0 ${9 * s} ${-6 * s} v${-8 * s} z" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>`
    b += `<path d="M${X(c - 5.5)} ${Y(2)} v${6 * s} q0 ${3.6 * s} ${5.5 * s} ${3.6 * s} q${5.5 * s} 0 ${5.5 * s} ${-3.6 * s} v${-6 * s} z" fill="none" stroke="${C.ink}" stroke-width="1"/>`
  }
  for (const c of [30, 60]) b += rect(X(c) - 2, Y(0), 4, 18 * s, { fill: C.part, sw: 1.2 })
  for (const c of cls) b += line(X(c), Y(0) - 2, X(c), dimY + (c === cls[0] ? 25 : 6), { stroke: C.orange, sw: 1.5, dash: '8 3 2 3' })
  b += line(X(cls[1] + 4), clear, X(run) - 2, clear, { stroke: C.muted, sw: 1.5, dash: '5 5' })
  b += vdim(X(cls[2] + 11), front, clear, '21" min')
  b += line(X(0), dimY + 20, X(cls[0]), dimY + 20, { stroke: C.orange, sw: 2.5 }) + line(X(cls[0]), dimY + 15, X(cls[0]), dimY + 25, { stroke: C.orange, sw: 2 }) + text(X(cls[0]) + 7, dimY + 25, '15" min', { size: 13, weight: 700 })
  b += odim(dimY, X(cls[0]), X(cls[1]), '30" min') + odim(dimY, X(cls[1]), X(cls[2]), '30" min')
  phone('urinal-spacing-m', dimY + 38, b)
})

// Material sections: one door edge per page, and all five as rows at one scale.
{
  const k = 100, x0 = 24, y0 = 46, len = 236
  for (const kind of Object.keys(MATERIALS)) {
    const m = MATERIALS[kind], sct = matSection(kind, x0, y0, len, k)
    let b = sct.body
    b += callout(2, sct.pts.face[0], 20, sct.pts.face) + callout(3, sct.x1 + 28, sct.pts.edge[1], sct.pts.edge)
    b += callout(1, sct.pts.core[0], sct.y1 + 32, sct.pts.core) + `<circle cx="${sct.pts.core[0]}" cy="${sct.pts.core[1]}" r="5" fill="${C.orange}" stroke="#fff" stroke-width="2"/>`
    if (m.dim) withPhone(1, () => { b += vdim(sct.x1 + 56, y0, sct.y1, m.dim) })
    phone(`material-section-${kind}-m`, sct.y1 + 54, b)
  }
  const kr = 34, sx = 160, slen = 140
  const names = { phenolic: 'Phenolic', 'solid-plastic': 'Solid plastic (HDPE)', 'plastic-laminate': 'Plastic laminate', 'powder-coated-steel': 'Powder coated steel', 'stainless-steel': 'Stainless steel' }
  let b = '', y = 10
  withPhone(1, () => {
    for (const kind of Object.keys(MATERIALS)) {
      const m = MATERIALS[kind], sct = matSection(kind, sx, y, slen, kr)
      b += text(12, y + sct.T / 2 + 5, names[kind], { size: 13, weight: 700 }) + sct.body
      if (m.dim) b += vdim(sct.x1 + 14, y, sct.y1, m.dim)
      y = sct.y1 + 10
    }
  })
  phone('material-sections-compare-m', y, b)
}

// ---------- installation drawings (2026-10-27) ----------
// Facts from the manufacturers' installation guides reviewed 2026-10-27 (see drawing-check.md): Bradley Series 400
// phenolic HDWC-INSTR-040 Rev. A (2021) pages 4–21, with the same handing note and bracket heights in its Series 500,
// 600 and 700 phenolic guides. Drawn as our own flat views; nothing is traced.
//   Layout: a plumb line on the walls at each pilaster and panel centerline; bracket marks 19" and 63" above the
//     highest point of the floor (third-bracket option 19" / 43" / 63"; continuous brackets one mark at 12-1/2");
//     the pilaster line on the floor at the back-wall-to-face dimension less 3/8" (left to the page text: 3/8" can't
//     be drawn at these scales).
//   Hand: judged facing the stall from outside; RH = right-hand inswing or left-hand outswing, LH the reverse.
//   Brackets: stirrup brackets with one or two ears, continuous "ear" brackets and U-brackets; 3/4" openings hold
//     pilasters, 1/2" openings hold panels. Bracket sizes other than the openings are not dimensioned (no source).
//   Pilasters: wall, alcove (fixed to a panel end with an alcove bracket) and middle pilasters, handed by the hinge
//     and latch they carry.
//   Sequence: layout, wall brackets, wall pilasters first, then panel and pilaster alternately (panel on a 12"
//     spacer), headrail, then hinges and doors once the openings are checked, latches last.
const cline = (x1, y1, x2, y2, o = {}) => line(x1, y1, x2, y2, { stroke: o.stroke ?? C.ink, sw: o.sw ?? 1.2, dash: o.dash ?? '12 3 2 3' })
const mark = (x, y, w = 16, sw = 4) => line(x - w / 2, y, x + w / 2, y, { stroke: C.orange, sw })
const hollow = (x, y, w = 16) => rect(x - w / 2, y - 3.5, w, 7, { fill: '#fff', stroke: C.orange, sw: 2 })
const brk = (x, y1, y2) => `<path d="M${x} ${y1} V${(y1 + y2) / 2 - 7} l-6 4 l12 6 l-6 4 V${y2}" fill="none" stroke="${C.muted}" stroke-width="1.2"/>` // a wall that continues
const disc = (n, x, y) => callout(n, x, y, null)
// Ordinate heights from the floor: one muted line with a tick and a label at each height.
function ordinate(x, Y, hs, labels, size = DIM) {
  let b = line(x, Y(0), x, Y(Math.max(...hs)), { stroke: C.muted, sw: 1 }) + line(x - 6, Y(0), x + 6, Y(0), { stroke: C.muted, sw: 1 })
  hs.forEach((h, i) => { b += line(x - 6, Y(h), x + 6, Y(h), { stroke: C.muted, sw: 1 }) + text(x + 10, Y(h) + 5, labels[i], { size, fill: C.muted, weight: 600 }) })
  return b
}

// 1. Layout marks: the side wall and the back wall unfolded at the corner (a developed elevation), and a plan.
function layoutElevation(s, x0, floor, ph) {
  const wallH = 80, side = 70, back = 84, pil = 61.25 - 0.375 // pilaster plumb line from the back wall
  const Y = (i) => floor - i * s, xc = x0 + side * s, xe = xc + back * s
  const XP = xc - pil * s, panels = [36, 72].map((p) => xc + p * s)
  let b = rect(x0, Y(wallH), side * s, wallH * s, { fill: 'HATCH', stroke: 'none' }) + rect(xc, Y(wallH), back * s, wallH * s, { fill: 'HATCH', stroke: 'none' })
  b += line(xc, Y(wallH), xc, floor, { stroke: C.ink, sw: 1.5 }) // the corner
  b += brk(x0, Y(wallH), floor) + brk(xe, Y(wallH), floor)
  b += rect(x0 - 6, floor, xe - x0 + 12, ph ? 8 : 14, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 6, floor, xe + 6, floor)
  const lines = [XP, ...panels]
  for (const x of lines) b += `<rect x="${x - 9}" y="${Y(wallH) + 2}" width="18" height="${wallH * s - 4}" fill="#fff" opacity=".55"/>` + cline(x, Y(wallH) + 2, x, floor - 1)
  const mw = ph ? 12 : 16
  for (const x of lines) b += mark(x, Y(19), mw, ph ? 3 : 4) + mark(x, Y(63), mw, ph ? 3 : 4)
  const last = panels[1]
  b += hollow(last, Y(43), mw) + hollow(last, Y(12.5), mw)
  return { b, Y, xc, xe, XP, panels, last }
}
{
  const s = 2.6, x0 = 40, floor = 262
  const e = layoutElevation(s, x0, floor, false)
  let b = e.b
  b += ordinate(e.xe + 24, e.Y, [12.5, 19, 43, 63], ['12-1/2"', '19"', '43"', '63"'])
  b += callout(1, e.XP, 30, [e.XP, e.Y(80) + 4]) + callout(2, e.panels[0], 30, [e.panels[0], e.Y(80) + 4])
  b += callout(3, e.XP + 40, e.Y(63), [e.XP + 9, e.Y(63)]) + callout(4, e.last - 40, e.Y(43), [e.last - 9, e.Y(43)]) + callout(5, e.last - 40, e.Y(12.5) - 4, [e.last - 9, e.Y(12.5)])
  b += note(x0 + 4, floor + 34, 'side wall', 'start', 13) + note(e.xc + 6, floor + 34, 'back wall', 'start', 13) + note(e.xc, e.Y(80) - 8, 'corner', 'middle', 12)
  // plan: the same corner seen from above
  const px = 596, py = 62, ps = 1.4, wt = 10
  const PX = (i) => px + wt + i * ps, PY = (i) => py + wt + i * ps
  b += rect(px, py, 96 * ps + wt, wt, { fill: 'HATCH', stroke: 'none' }) + rect(px, py, wt, 74 * ps + wt, { fill: 'HATCH', stroke: 'none' })
  b += line(PX(0), PY(0), PX(96), PY(0)) + line(PX(0), PY(0), PX(0), PY(74))
  for (const p of [36, 72]) b += line(PX(p), PY(0), PX(p), PY(61.25), { stroke: C.muted, sw: 1, dash: '4 4' }) + line(PX(p), PY(0), PX(p), PY(0) + 7, { stroke: C.ink, sw: 2 })
  b += cline(PX(0), PY(61), PX(96), PY(61))
  b += `<circle cx="${PX(0)}" cy="${PY(61)}" r="3" fill="${C.ink}"/>`
  b += callout(6, PX(96) + 24, PY(61), [PX(90), PY(61)])
  b += note(PX(48), PY(74) + 22, 'seen from above', 'middle', 13)
  made.push(svg('install-layout-marks', 780, floor + 46, 'Layout marks for toilet partition wall brackets',
    'The side wall and back wall of a restroom corner, unfolded flat, with a plumb line at the pilaster centerline on the side wall and at each panel centerline on the back wall. Bracket marks sit on every plumb line 19 and 63 inches above the highest point of the floor; a third bracket option adds a mark at 43 inches, and continuous brackets use one mark at 12-1/2 inches. A small plan shows the same corner from above with the pilaster line on the floor.', b))
  withPhone(1, () => {
    const s2 = 1.75, f2 = 186
    const m = layoutElevation(s2, 14, f2, true)
    let p = m.b + ordinate(m.xe + 14, m.Y, [12.5, 19, 43, 63], ['12-1/2"', '19"', '43"', '63"'], 12)
    p += callout(1, m.XP, 16, [m.XP, m.Y(80) + 3]) + callout(2, m.panels[0], 16, [m.panels[0], m.Y(80) + 3])
    p += callout(3, m.XP + 30, m.Y(63), [m.XP + 7, m.Y(63)]) + callout(4, m.last - 30, m.Y(43), [m.last - 7, m.Y(43)]) + callout(5, m.last - 30, m.Y(12.5) - 4, [m.last - 7, m.Y(12.5)])
    phone('install-layout-marks-m1', f2 + 14, p)
    const qx = 80, qy = 14, qs = 1.9, qw = 10
    const QX = (i) => qx + qw + i * qs, QY = (i) => qy + qw + i * qs
    p = rect(qx, qy, 96 * qs + qw, qw, { fill: 'HATCH', stroke: 'none' }) + rect(qx, qy, qw, 74 * qs + qw, { fill: 'HATCH', stroke: 'none' })
    p += line(QX(0), QY(0), QX(96), QY(0)) + line(QX(0), QY(0), QX(0), QY(74))
    for (const q of [36, 72]) p += line(QX(q), QY(0), QX(q), QY(61.25), { stroke: C.muted, sw: 1, dash: '4 4' }) + line(QX(q), QY(0), QX(q), QY(0) + 7, { stroke: C.ink, sw: 2 })
    p += cline(QX(0), QY(61), QX(96), QY(61)) + `<circle cx="${QX(0)}" cy="${QY(61)}" r="3" fill="${C.ink}"/>`
    p += callout(6, QX(96) + 22, QY(61), [QX(90), QY(61)])
    phone('install-layout-marks-m2', QY(74) + 10, p)
  })
}

// 2. Door hand, seen from above, standing outside the stall (at the bottom of each plan).
// RH = right-hand inswing or left-hand outswing; LH = left-hand inswing or right-hand outswing.
const HANDS = [['A', 'Right-hand inswing', 'R', 'in'], ['B', 'Left-hand outswing', 'L', 'out'], ['C', 'Left-hand inswing', 'L', 'in'], ['D', 'Right-hand outswing', 'R', 'out']]
function handPlan(cx, top, s, side, swing, ph) {
  const X = (i) => cx + i * s, wallT = ph ? 7 : 10, depth = 34, front = top + wallT + depth * s
  const tp = ph ? 4 : 5, R = 24 * s, ang = 62 * Math.PI / 180
  let b = rect(X(-21), top, 42 * s, wallT, { fill: 'HATCH', stroke: 'none' }) + line(X(-21), top + wallT, X(21), top + wallT)
  for (const x of [-18, 18]) b += rect(X(x) - 1.5, top + wallT, 3, depth * s - tp / 2, { sw: 1.2 }) // panels
  const hingeX = side === 'R' ? 12 : -12, dir = side === 'R' ? -1 : 1, up = swing === 'in' ? -1 : 1
  for (const [a, z] of [[-18, -12], [12, 18]]) {
    const hinge = (side === 'R') === (a > 0)
    b += rect(X(a), front - tp / 2, 6 * s, tp, hinge ? { fill: C.orange, stroke: C.orange, sw: 1.5 } : { sw: 1.2 })
  }
  const hx = X(hingeX), ex = hx + dir * R * Math.cos(ang), ey = front + up * R * Math.sin(ang)
  const sweep = (dir === -1) === (up === -1) ? 1 : 0
  b += `<path d="M${hx + dir * R} ${front} A${R} ${R} 0 0 ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${C.muted}" stroke-width="1.2" stroke-dasharray="5 4"/>`
  b += line(hx, front, ex.toFixed(1), ey.toFixed(1), { stroke: C.ink, sw: ph ? 2.5 : 3 })
  b += `<circle cx="${hx}" cy="${front}" r="${ph ? 4 : 5}" fill="${C.orange}" stroke="#fff" stroke-width="1.5"/>`
  return { b, front, bottom: front + R }
}
{
  const s = 3.4, fw = 195, top = 54
  let b = ''
  HANDS.forEach(([L, cap, side, swing], i) => {
    const cx = fw / 2 + i * fw, p = handPlan(cx, top, s, side, swing, false)
    b += p.b + disc(L, cx - 70, p.bottom + 36) + text(cx - 52, p.bottom + 41, cap, { size: 14, weight: 600 })
  })
  // RH and LH: each door (and pilaster) is made for one of two hands, judged from outside.
  for (const [i, t] of [[0, 'RH'], [1, 'LH']]) {
    const x1 = i * 2 * fw + 24, x2 = (i * 2 + 2) * fw - 24
    b += `<path d="M${x1} 34 V26 H${x2} V34" fill="none" stroke="${C.muted}" stroke-width="1.2"/>` + `<rect x="${(x1 + x2) / 2 - 22}" y="14" width="44" height="22" fill="#fff"/>` + text((x1 + x2) / 2, 31, t, { size: 16, weight: 700, anchor: 'middle' })
  }
  const by = top + 10 + 34 * s + 24 * s
  b += note(16, by + 74, 'Seen from above. You stand outside the stall (at the bottom of each plan), facing the door.', 'start', 13)
  made.push(svg('door-hand', 780, by + 86, 'Door hand and swing of a toilet partition door, plan view',
    'Four single compartments seen from above, from outside the stall at the bottom: A, right-hand inswing, and B, left-hand outswing, are both an RH door; C, left-hand inswing, and D, right-hand outswing, are both an LH door. The pilaster on the hinge side is shown in orange.', b))
  withPhone(1, () => {
    const s2 = 2.5, fw2 = 180, t2 = 32
    for (const f of [0, 1]) {
      let p = ''
      HANDS.slice(f * 2, f * 2 + 2).forEach(([L, , side, swing], i) => {
        const cx = fw2 / 2 + i * fw2, q = handPlan(cx, t2, s2, side, swing, true)
        p += q.b + disc(L, cx - 58, q.front - 34)
      })
      p += `<path d="M30 22 V15 H330 V22" fill="none" stroke="${C.muted}" stroke-width="1.2"/><rect x="160" y="4" width="40" height="20" fill="#fff"/>` + text(180, 20, f ? 'LH' : 'RH', { size: 15, weight: 700, anchor: 'middle' })
      phone(`door-hand-m${f + 1}`, t2 + 7 + 34 * s2 + 24 * s2 + 10, p)
    }
  })
}

// 3. Bracket types: each as seen facing the wall (top) and from above (bottom), with the pilaster or panel end
// (dashed) in the opening. Only the openings are dimensioned; other sizes are drawn, not sourced.
const BRACKETS = [['One-ear stirrup', 'stirrup', 1, 0.75], ['Two-ear stirrup', 'stirrup', 2, 0.75], ['Continuous ear', 'cont', 1, 0.75], ['Continuous U', 'u', 0, 0.5]]
function bracketViews(cx, fy, py, k, kind, ears, open, ph) {
  const t = Math.max(3, 0.12 * k), ear = 1.2 * k, slot = open * k, leg = 1.6 * k
  const sw = slot + 2 * t, left = ears === 2 ? ear : kind === 'u' ? 0 : ear, right = ears === 2 ? ear : 0
  const W = left + sw + right, x0 = cx - W / 2, sx = x0 + left // slot block starts at sx
  const o = { fill: C.orange, stroke: C.orange, sw: 1 }
  let b = ''
  // front view, facing the wall
  const fh = kind === 'stirrup' ? 2.4 * k : (ph ? 100 : 150)
  b += rect(x0, fy, W, fh, o)
  for (const xx of [sx + t, sx + t + slot]) b += line(xx, fy + 1, xx, fy + fh - 1, { stroke: '#fff', sw: 1.2 })
  const holes = (x) => (kind === 'stirrup' ? [fy + fh / 2] : [fy + 18, fy + fh / 2, fy + fh - 18]).map((y) => `<circle cx="${x}" cy="${y}" r="${ph ? 3.5 : 4}" fill="#fff"/>`).join('')
  if (kind === 'stirrup' && ears === 1) b += `<circle cx="${x0 + ear / 2}" cy="${fy + fh * 0.3}" r="4" fill="#fff"/><circle cx="${x0 + ear / 2}" cy="${fy + fh * 0.7}" r="4" fill="#fff"/>`
  else if (kind === 'stirrup') b += holes(x0 + ear / 2) + holes(x0 + W - ear / 2)
  else if (kind === 'cont') b += holes(x0 + ear / 2)
  else b += holes(cx)
  if (kind !== 'stirrup') { const m = fy + (fh / 2 + fh - 18) / 2 + 6; b += `<path d="M${x0 - 4} ${m} l${W / 2 + 4} -8 l0 0 l${W / 2 + 4} 8" fill="none" stroke="#fff" stroke-width="5"/>` }
  // seen from above: wall at the top, the bracket, the part's end dashed in the opening
  b += rect(cx - 74, py - 12, 148, 12, { fill: 'HATCH', stroke: 'none' }) + line(cx - 74, py, cx + 74, py)
  let d = `M${x0} ${py} H${x0 + W} V${py + t}`
  if (right) d += ` H${sx + sw} V${py + leg} H${sx + sw - t} V${py + t}`
  else d += ` V${py + leg} H${sx + sw - t} V${py + t}`
  d += ` H${sx + t} V${py + leg} H${sx} V${py + t} H${x0} Z`
  if (kind === 'u') d = `M${sx} ${py} H${sx + sw} V${py + leg} H${sx + sw - t} V${py + t} H${sx + t} V${py + leg} H${sx} Z`
  b += `<path d="${d}" fill="${C.orange}" stroke="${C.orange}" stroke-width="1" stroke-linejoin="round"/>`
  b += rect(sx + t + 1, py + t + 2, slot - 2, leg + 30 - t, { fill: 'none', stroke: C.ink, sw: 1.2, dash: '4 3' })
  const dy = py + leg + 14
  b += line(sx + t, dy, sx + t + slot, dy, { stroke: C.muted, sw: 1 }) + line(sx + t, dy - 5, sx + t, dy + 5, { stroke: C.muted, sw: 1 }) + line(sx + t + slot, dy - 5, sx + t + slot, dy + 5, { stroke: C.muted, sw: 1 })
  b += text(sx + t + slot + 8, dy + 5, open === 0.75 ? '3/4"' : '1/2"', { size: ph ? 13 : DIM, fill: C.muted, weight: 600 })
  return { b, bottom: py + leg + 30 }
}
{
  const k = 26, fw = 195, fy = 22, py = 214
  let b = ''
  BRACKETS.forEach(([cap, kind, ears, open], i) => {
    const cx = fw / 2 + i * fw, v = bracketViews(cx, fy, py, k, kind, ears, open, false)
    b += v.b + disc(i + 1, cx - 66, v.bottom + 30) + text(cx - 48, v.bottom + 35, cap, { size: 14, weight: 600 })
  })
  b += note(16, py + 1.6 * k + 98, 'Top: as seen facing the wall. Bottom: seen from above, with the pilaster or panel end (dashed) in the opening.', 'start', 13)
  made.push(svg('bracket-types', 780, py + 1.6 * k + 110, 'Toilet partition bracket types',
    'Four partition brackets, each as seen facing the wall and from above: 1, a stirrup bracket with one ear; 2, a stirrup bracket with two ears; 3, a continuous ear bracket; 4, a continuous U-bracket. Openings of 3/4 inch hold pilasters and openings of 1/2 inch hold panels.', b))
  withPhone(1, () => {
    for (const f of [0, 1]) {
      let p = ''
      const pyp = f ? 140 : 98
      BRACKETS.slice(f * 2, f * 2 + 2).forEach(([, kind, ears, open], i) => {
        const cx = 90 + i * 180, v = bracketViews(cx, 14, pyp, 22, kind, ears, open, true)
        p += v.b + disc(f * 2 + i + 1, cx - 66, 26)
      })
      phone(`bracket-types-m${f + 1}`, pyp + 1.6 * 22 + 38, p)
    }
  })
}

// 4. Pilaster types, seen from above: wall, alcove and middle pilasters with the doors and panels that meet them.
// Doors are drawn closed; the dot is a hinge, the square a latch (keeper). Thicknesses are drawn, not to scale.
function pilasterPlan(kind, cx, top, s, ph) {
  const depth = 24, front = top + depth * s, T = ph ? 7 : 9, dt = ph ? 4 : 5
  const X = (i) => cx + i * s
  const P = { fill: C.orange, stroke: C.orange, sw: 1.5 }
  let b = '', marks = []
  const door = (a, z) => rect(X(a), front - dt / 2, (z - a) * s, dt, { sw: 1.2 })
  const panel = (x) => rect(X(x) - dt / 2, top, dt, depth * s - T / 2, { sw: 1.2 }) + `<path d="M${X(x) - 8} ${top} l5 -5 l6 8 l5 -5" fill="none" stroke="${C.muted}" stroke-width="1.2"/>`
  const next = (a, z) => rect(X(a), front - T / 2, (z - a) * s, T, { fill: 'none', stroke: C.muted, sw: 1.2, dash: '4 3' })
  const hinge = (x) => `<circle cx="${X(x)}" cy="${front}" r="${ph ? 4 : 5}" fill="${C.ink}" stroke="#fff" stroke-width="1.5"/>`
  const latch = (x) => rect(X(x) - (ph ? 4 : 5), front - (ph ? 4 : 5), ph ? 8 : 10, ph ? 8 : 10, { fill: C.ink, stroke: '#fff', sw: 1.5 })
  if (kind === 'wall') { // side wall on the left, pilaster at the wall carrying the hinge
    b += rect(X(-16) - 14, top - 6, 14, depth * s + 30, { fill: 'HATCH', stroke: 'none' }) + line(X(-16), top - 6, X(-16), front + 24)
    b += rect(X(-15), front - T / 2, 5 * s, T, P) + door(-10, 14) + next(14, 20) + hinge(-10)
    for (const y of [front - T / 2 - 4]) b += rect(X(-16), y - 3, 5, 6, { fill: C.ink, stroke: 'none' }) // wall bracket
    marks = [['hinge', -10]]
  }
  if (kind === 'alcove') { // panel end on the right; the pilaster fixed to it carries the latch
    b += next(-26, -20) + door(-20, 4) + panel(10) + rect(X(4), front - T / 2, 7.5 * s, T, P) + latch(4)
    b += `<path d="M${X(10) - dt / 2 - 6} ${front - T / 2 - 1} v-8 h-0 M${X(10) - dt / 2 - 6} ${front - T / 2 - 9} h6" fill="none" stroke="${C.ink}" stroke-width="2"/>` // alcove bracket
    marks = [['latch', 4]]
  }
  if (kind === 'middle') { // a door latching on the left, a door hinged on the right, the panel behind
    b += door(-30, -6) + door(6, 30) + panel(0) + rect(X(-6), front - T / 2, 12 * s, T, P) + latch(-6) + hinge(6)
    marks = [['latch', -6], ['hinge', 6]]
  }
  return { b, front, marks, X }
}
{
  const s = 3.4, fw = 260, top = 34
  const kinds = [['wall', 'Wall pilaster', 12], ['alcove', 'Alcove pilaster', 6], ['middle', 'Middle pilaster', 0]]
  let b = ''
  kinds.forEach(([kind, cap, off], i) => {
    const cx = fw / 2 + i * fw + off * s / 2, p = pilasterPlan(kind, cx, top, s, false)
    b += p.b
    for (const [t, x] of p.marks) b += note(p.X(x) + (t === 'hinge' ? -6 : 6), p.front + 30, t, t === 'hinge' ? 'start' : 'end', 13)
    b += disc(i + 1, fw / 2 + i * fw - 70, p.front + 70) + text(fw / 2 + i * fw - 52, p.front + 75, cap, { size: 14, weight: 600 })
  })
  const fr = top + 24 * s
  b += note(16, fr + 110, 'Seen from above; the outside of the stalls is at the bottom. Dot: hinge. Square: latch (keeper).', 'start', 13)
  made.push(svg('pilaster-types', 780, fr + 122, 'Toilet partition pilaster types, plan view',
    'Seen from above: 1, a wall pilaster beside the side wall, carrying the door hinge; 2, an alcove pilaster fixed to the end of a panel, carrying the latch of the door beside it; 3, a middle pilaster with a panel meeting it from behind, carrying the latch of one door and the hinge of the next. The pilasters are shown in orange.', b))
  withPhone(1, () => {
    const s2 = 2.6, t2 = 30
    let p = ''
    ;[['wall', 12], ['alcove', 6]].forEach(([kind, off], i) => {
      const cx = 90 + i * 180 + off * s2 / 2, q = pilasterPlan(kind, cx, t2, s2, true)
      p += q.b + disc(i + 1, 90 + i * 180 - 66, 16)
      for (const [t, x] of q.marks) p += note(q.X(x) + (t === 'hinge' ? -5 : 5), q.front + 26, t, t === 'hinge' ? 'start' : 'end', 12)
    })
    phone('pilaster-types-m1', t2 + 24 * s2 + 40, p)
    const q = pilasterPlan('middle', 180, t2, s2, true)
    p = q.b + disc(3, 72, 16)
    for (const [t, x] of q.marks) p += note(q.X(x) + (t === 'hinge' ? -5 : 5), q.front + 26, t, t === 'hinge' ? 'start' : 'end', 12)
    phone('pilaster-types-m2', t2 + 24 * s2 + 40, p)
  })
}

// 5. Installation sequence: small frames, each a plan (seen from above) over a front elevation of two stalls,
// the step in orange, earlier steps in ink, later ones not yet there.
const STEPS = ['Mark the layout', 'Wall brackets', 'Wall pilasters', 'Panels', 'Headrail', 'Hang the doors', 'Hinges and latches']
function seqFrame(step, ox, py, s, ph) {
  const wt = ph ? 6 : 8, depth = 60, wallH = 90
  const X = (i) => ox + wt + i * s, PY = (i) => py + wt + i * s
  const ey = PY(depth) + (ph ? 16 : 22) + wallH * s, EY = (i) => ey - i * s
  const now = { fill: C.orangeTint, stroke: C.orange, sw: 2 }, done = { sw: 1.2 }
  const st = (n) => (step === n ? now : done), on = (n) => step >= n
  const tp = ph ? 3 : 4
  let pl = '', el = ''
  // building: plan walls, elevation side walls and slab
  pl += rect(ox, py, 72 * s + 2 * wt, wt, { fill: 'HATCH', stroke: 'none' }) + rect(ox, py, wt, depth * s + wt + 4, { fill: 'HATCH', stroke: 'none' }) + rect(X(72), py, wt, depth * s + wt + 4, { fill: 'HATCH', stroke: 'none' })
  pl += `<path d="M${X(0)} ${PY(depth) + 4} V${PY(0)} H${X(72)} V${PY(depth) + 4}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`
  // toilets, seen from above: they make the plan read as a plan
  for (const c of [18, 54]) pl += rect(X(c) - 8 * s, PY(0) + 1, 16 * s, 6 * s, { rx: 2, sw: 1 }) + `<ellipse cx="${X(c)}" cy="${PY(17)}" rx="${7.5 * s}" ry="${11 * s}" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`
  el += rect(ox, EY(wallH), wt, wallH * s, { fill: 'HATCH', stroke: 'none' }) + rect(X(72), EY(wallH), wt, wallH * s, { fill: 'HATCH', stroke: 'none' })
  el += rect(ox - 4, ey, 72 * s + 2 * wt + 8, ph ? 5 : 7, { fill: 'HATCH', stroke: 'none' }) + line(ox - 4, ey, X(72) + wt + 4, ey, { sw: 1.2 }) + line(X(0), EY(wallH), X(0), ey, { sw: 1.2 }) + line(X(72), EY(wallH), X(72), ey, { sw: 1.2 })
  // 1 layout: pilaster line on the floor, panel centerline, plumb lines and bracket marks
  if (step === 1) {
    pl += cline(X(0), PY(depth), X(72), PY(depth), { stroke: C.orange, sw: 2 }) + line(X(36), PY(0), X(36), PY(0) + 8, { stroke: C.orange, sw: 2.5 })
    el += cline(X(36), EY(84), X(36), ey, { stroke: C.orange, sw: 1.5 })
    for (const h of [19, 63]) el += mark(X(36), EY(h), 10, 3) + line(X(0), EY(h), X(0) + 7, EY(h), { stroke: C.orange, sw: 3 }) + line(X(72) - 7, EY(h), X(72), EY(h), { stroke: C.orange, sw: 3 })
  }
  // 2 wall brackets: for the panel on the back wall, for the wall pilasters on the side walls
  if (on(2)) {
    const o = step === 2 ? { fill: C.orange, stroke: C.orange, sw: 1 } : { fill: C.ink, stroke: 'none' }
    pl += rect(X(36) - 3, PY(0), 6, 5, o) + rect(X(0), PY(depth) - 3, 5, 6, o) + rect(X(72) - 5, PY(depth) - 3, 5, 6, o)
    for (const h of [19, 63]) el += rect(X(36) - 3, EY(h) - 3, 6, 6, o) + rect(X(0), EY(h) - 3, 5, 6, o) + rect(X(72) - 5, EY(h) - 3, 5, 6, o)
  }
  // 4 panel (behind the middle pilaster in the front view, so drawn before it), on a 12" spacer while it goes in
  if (on(4)) {
    pl += rect(X(36) - 1.5, PY(0) + 4, 3, depth * s - 4 - tp / 2, step === 4 ? { fill: C.orange, stroke: C.orange, sw: 1 } : { sw: 1 })
    if (step === 4) el += rect(X(36) - 6, EY(12), 12, 12 * s, { sw: 1 }) + rect(X(36) - 2, EY(70), 4, 58 * s, { fill: C.orange, stroke: C.orange, sw: 1 })
  }
  // 3 wall pilasters, in their shoes, plumb and level; 4 the middle pilaster goes in after the panel
  const pil = (a, z, o) => { pl += rect(X(a), PY(depth) - tp / 2, (z - a) * s, tp, o); el += rect(X(a), EY(82), (z - a) * s, 82 * s, o) + (o.dash ? '' : line(X(a), EY(4), X(z), EY(4), { stroke: o.stroke ?? C.ink, sw: 1 })) }
  if (on(3)) { pil(1, 6, st(3)); pil(66, 71, st(3)) }
  if (step === 4) pil(30, 42, { fill: 'none', stroke: C.muted, sw: 1.2, dash: '4 3' })
  if (on(5)) pil(30, 42, done)
  // 5 headrail across the pilaster tops, fixed to both walls
  if (on(5)) {
    const o = step === 5 ? { fill: C.orange, stroke: C.orange, sw: 1 } : { fill: '#fff', sw: 1.2 }
    el += rect(X(0), EY(82) - 2.5 * s, 72 * s, 2.5 * s, o)
    if (step === 5) pl += line(X(0), PY(depth), X(72), PY(depth), { stroke: C.orange, sw: 3 })
  }
  // 6 doors, inswing, hinged on their left; 7 hinges and latches
  if (on(6)) {
    for (const [h, l] of [[6, 30], [42, 66]]) {
      const R = 24 * s, a = 40 * Math.PI / 180, ex = X(h) + R * Math.cos(a), eyy = PY(depth) - R * Math.sin(a)
      const c = step === 6 ? C.orange : C.ink
      pl += `<path d="M${X(l)} ${PY(depth)} A${R} ${R} 0 0 0 ${ex.toFixed(1)} ${eyy.toFixed(1)}" fill="none" stroke="${step === 6 ? C.orange : C.muted}" stroke-width="1" stroke-dasharray="4 3"/>` + line(X(h), PY(depth), ex.toFixed(1), eyy.toFixed(1), { stroke: c, sw: 2.5 })
      el += rect(X(h + 0.4), EY(70), 23.2 * s, 58 * s, st(6))
      if (step === 7) {
        const o = { fill: C.orange, stroke: C.orange, sw: 1 }
        el += rect(X(h + 0.4) - 2, EY(64), 5, 8 * s, o) + rect(X(h + 0.4) - 2, EY(22), 5, 8 * s, o) + rect(X(l - 0.4) - 7, EY(42), 9, 5, o)
        pl += `<circle cx="${X(h)}" cy="${PY(depth)}" r="3.5" fill="${C.orange}"/>` + rect(X(l) - 3, PY(depth) - 3, 6, 6, o)
      }
    }
  }
  return { b: pl + el, ey, slab: ph ? 5 : 7, w: 72 * s + 2 * wt }
}
{
  const s = 1.9, fw = 195, py = 18
  const draw = (steps, name, title, desc) => {
    let b = ''
    const x0 = (780 - steps.length * fw) / 2
    let ey = 0
    steps.forEach((n, i) => {
      const fx = x0 + i * fw, f = seqFrame(n, fx + (fw - (72 * s + 16)) / 2, py, s, false)
      ey = f.ey
      b += f.b + disc(n, fx + 22, f.ey + 36) + text(fx + 40, f.ey + 41, STEPS[n - 1], { size: 14, weight: 600 })
    })
    made.push(svg(name, 780, ey + 58, title, desc, b))
    withPhone(1, () => {
      for (let m = 0; m * 2 < steps.length; m++) {
        let p = '', ey2 = 0
        const pair = steps.slice(m * 2, m * 2 + 2)
        pair.forEach((n, i) => {
          const cx = pair.length === 1 ? 180 : 90 + i * 180, f = seqFrame(n, cx - (72 * 1.2 + 12) / 2 + 8, 8, 1.2, true)
          ey2 = f.ey
          p += f.b + disc(n, cx - 66, 22)
        })
        phone(`${name}-m${m + 1}`, ey2 + 12, p)
      }
    })
  }
  draw([1, 2, 3, 4], 'install-sequence-1', 'Toilet partition installation sequence, steps 1 to 4',
    'Four small frames, each a plan seen from above over a front view of two stalls: 1, the layout marked on the floor and walls; 2, wall brackets fixed at the marks; 3, the wall pilasters stood in their shoes and leveled; 4, the panel set into its wall brackets on a 12-inch spacer, with the middle pilaster to follow. Each step is shown in orange.')
  draw([5, 6, 7], 'install-sequence-2', 'Toilet partition installation sequence, steps 5 to 7',
    'Three small frames, each a plan seen from above over a front view of two stalls: 5, the headrail fixed across the pilaster tops and to both walls; 6, the doors hung; 7, hinges and latches set and the gaps checked. Each step is shown in orange.')
}

// ---------- installation and accessibility drawings, batch 2 (2026-10-27) ----------
// Facts (see drawing-check.md): Bradley Series 400 phenolic installation guide HDWC-INSTR-040 Rev. A (2021): doors and
// panels rest on a 12" spacer while they go in; 1/8" spacers between door and pilaster at top and bottom give an even
// gap on the hinge and latch sides; standard gaps 1" panel to wall and 1/2" panel to pilaster; pilasters at walls
// 1/2" to 1-1/4" per the drawing; wall brackets fixed with plastic anchors in Ø5/16" holes min. 2" deep and #14 x 2"
// screws; "make sure that the wall and floor backing are adequate" (same notes in its Series 600 steel and Bradmar
// guides). Pilasters plumb before the hinges; keeper set with the door closed so the latch moves freely over it.
// Hadrian metal manual: the hinge must be plumb, door 1/8" from the pilaster on a 12" block; Hadrian solid plastic:
// keeper at the door's mid-point, latch slide on the keeper slot. 2010 ADA Standards (access-board.gov, checked
// 2026-10-27): 308.2.1, 308.3.1, 404.2.3, 404.2.7, 604.2, 604.4, 604.5.1, 604.5.2, 604.7, 604.8.1.1, 604.8.1.2,
// 604.8.1.4, 604.8.3, 609.4. Gaps are drawn wider than scale so they show; nothing is dimensioned without a source.
const val = (x, y, t, anchor = 'middle') => text(x, y, t, { size: DIM, fill: C.muted, anchor, weight: 600 })
// A horizontal break line (the part continues beyond it).
const hbrk = (x1, x2, y) => { const m = (x1 + x2) / 2; return `<path d="M${x1 - 4} ${y} H${m - 7} l4 -6 l6 12 l4 -6 H${x2 + 4}" fill="none" stroke="${C.muted}" stroke-width="1.2"/>` }
const vbrk = (x, y1, y2) => { const m = (y1 + y2) / 2; return `<path d="M${x} ${y1 - 4} V${m - 7} l-6 4 l12 6 l-6 4 V${y2 + 4}" fill="none" stroke="${C.muted}" stroke-width="1.2"/>` }

// 6. Install gaps: a front view (wall, wall pilaster, door, middle pilaster) and a side view (pilaster, panel, back
// wall). Orange: the gaps. The values sit over the numbered discs.
function gapsDrawing(s, fx, sx, top, ph) {
  const floor = top + (ph ? 34 : 50) + 82 * s, Y = (i) => floor - i * s
  const g = ph ? 4 : 6, gw = ph ? 6 : 8, gp = ph ? 6 : 9, wt = ph ? 10 : 18, slab = ph ? 8 : 14, pt = ph ? 3 : 5
  const dy = top + (ph ? 21 : 28), O = { fill: C.orange, stroke: 'none' }, INK = { fill: C.ink, stroke: 'none' }
  let b = ''
  // front view
  const wf = fx + wt, p1 = wf + gw, p1r = p1 + 6 * s, d0 = p1r + g, d1 = d0 + 24 * s, p2 = d1 + g, p2r = p2 + 6 * s
  b += rect(fx, Y(88), wt, 88 * s, { fill: 'HATCH', stroke: 'none' }) + line(wf, Y(88), wf, floor)
  b += rect(fx - 6, floor, p2r + 18 - fx, slab, { fill: 'HATCH', stroke: 'none' }) + line(fx - 6, floor, p2r + 12, floor)
  b += rect(wf, Y(82), gw, 82 * s, O)
  b += rect(p1, Y(82), 6 * s, 82 * s) + rect(p2, Y(82), 6 * s, 82 * s)
  b += rect(p1r, Y(70), g, 58 * s, O) + rect(d1, Y(70), g, 58 * s, O)
  b += rect(d0, Y(70), 24 * s, 58 * s)
  b += rect(d1, Y(70), g, 3 * s, INK) + rect(d1, Y(15), g, 3 * s, INK) // 1/8" spacers, top and bottom
  const spW = 10 * s, spc = d0 + 12 * s
  b += rect(spc - spW / 2, Y(12), spW, 12 * s, { sw: 1.2, dash: '4 3' }) // 12" spacer
  const c3 = ph ? fx - 44 : fx - 22, c1 = p1r + g / 2 + (ph ? -6 : 14), c2 = d1 + g / 2 + (ph ? 6 : -14)
  b += val(c3, top, '1/2"–1-1/4"') + callout(3, c3, dy, [wf + gw / 2, Y(78)])
  b += val(c1, top, '1/8"') + callout(1, c1, dy, [p1r + g / 2, Y(62)])
  b += val(c2, top, '1/8"') + callout(2, c2, dy, [d1 + g / 2, Y(56)])
  b += callout(4, spc, floor + slab + (ph ? 16 : 20), [spc, Y(4)])
  // side view: pilaster at the front (left), panel, back wall (right)
  const q0 = sx + pt, q1 = q0 + g, px1 = q1 + 56 * s, wb = px1 + gp
  b += rect(sx, Y(82), pt, 82 * s)
  b += rect(q0, Y(70), g, 58 * s, O) + rect(q1, Y(70), 56 * s, 58 * s) + rect(px1, Y(70), gp, 58 * s, O)
  b += rect(wb, Y(88), wt, 88 * s, { fill: 'HATCH', stroke: 'none' }) + line(wb, Y(88), wb, floor)
  b += rect(sx - 10, floor, wb + wt + 4 - sx, slab, { fill: 'HATCH', stroke: 'none' }) + line(sx - 10, floor, wb, floor)
  const spc2 = q1 + 28 * s
  b += rect(spc2 - spW / 2, Y(12), spW, 12 * s, { sw: 1.2, dash: '4 3' })
  const c6 = q0 + g / 2 + (ph ? 10 : 14), c5 = px1 + gp / 2 - (ph ? 10 : 14)
  b += val(c6, top, '1/2"') + callout(6, c6, dy, [q0 + g / 2, Y(62)])
  b += val(c5, top, '1"') + callout(5, c5, dy, [px1 + gp / 2, Y(62)])
  b += callout(4, spc2, floor + slab + (ph ? 16 : 20), [spc2, Y(4)])
  b += vdim(wb + wt + (ph ? 10 : 16), Y(12), Y(0), '12"')
  return { b, floor, slab, front: (fx + p2r) / 2, side: (sx + wb) / 2 }
}
{
  const g = gapsDrawing(3.6, 112, 412, 18, false)
  const cy = g.floor + g.slab + 58
  made.push(svg('install-gaps', 780, cy + 12, 'Gaps set when toilet partition doors and panels go in',
    'Front view of a door between a wall pilaster and a middle pilaster, and side view of a panel between its pilaster and the back wall. The gaps are shown in orange: 1/8 inch between the door and the pilaster on the hinge side and on the latch side, 1/2 to 1-1/4 inch between a wall pilaster and the wall, 1 inch between the panel and the back wall and 1/2 inch between the panel and the pilaster. The door and the panel rest on a 12-inch spacer while they are fixed.',
    g.b + note(g.front, cy, 'front view', 'middle', 13) + note(g.side, cy, 'side view, looking at a panel', 'middle', 13)))
  withPhone(1.5, () => {
    const m = gapsDrawing(1.5, 84, 200, 14, true)
    phone('install-gaps-m', m.floor + m.slab + 34, m.b)
  })
}

// 7. Accessible compartment heights: the rear wall, the side wall closest to the toilet, and the inside of the
// door near the latch. Orange: the grab bars. Toilets are drawn, not dimensioned (no source for their size).
function toiletFront(cx, Y, s) {
  const hw = 7.5 * s, bw = 4.5 * s
  return `<path d="M${cx - bw} ${Y(0)} L${cx - hw + s} ${Y(13)} Q${cx - hw} ${Y(15.5)} ${cx - hw} ${Y(17)} H${cx + hw} Q${cx + hw} ${Y(15.5)} ${cx + hw - s} ${Y(13)} L${cx + bw} ${Y(0)} Z" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>` + rect(cx - hw - 0.5 * s, Y(18), 2 * hw + s, s, { sw: 1.2 })
}
function toiletSide(xw, Y, s) {
  const X = (i) => xw + i * s
  return `<path d="M${X(9)} ${Y(0)} H${X(19)} Q${X(26)} ${Y(7)} ${X(28)} ${Y(14)} V${Y(17)} H${X(2)} V${Y(12)} Q${X(6)} ${Y(8)} ${X(9)} ${Y(0)} Z" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>` + rect(X(3), Y(18), 25 * s, s, { sw: 1.2 })
}
const BAR = { fill: C.orange, stroke: C.orange, sw: 1 }
function heightsRear(x0, floor, s, ph) {
  const Y = (i) => floor - i * s, wt = ph ? 10 : 14, xa = x0 + wt, CL = xa + 17 * s
  let b = rect(x0, Y(52), wt, 52 * s, { fill: 'HATCH', stroke: 'none' }) + line(xa, Y(52), xa, floor)
  b += rect(x0 - 4, floor, wt + 62 * s + 8, ph ? 8 : 12, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 4, floor, xa + 62 * s + 4, floor)
  b += toiletFront(CL, Y, s)
  // phone: the centerline stops under the dimension labels, and the two parts of the bar show numbers only (the
  // page text gives 12" min and 24" min), so the labels keep clear of each other and of the lines
  b += cline(CL, Y(0) - 2, CL, Y(ph ? 37.5 : 44), { stroke: C.muted, sw: 1 })
  b += rect(CL - 12 * s, Y(35), 36 * s, 1.5 * s, BAR) // rear grab bar
  b += hdim(Y(40), CL - 12 * s, CL, ph ? '12"' : '12" min') + hdim(Y(40), CL, CL + 24 * s, ph ? '24"' : '24" min') + hdim(Y(48), CL - 12 * s, CL + 24 * s, '36" min')
  b += hdim(Y(26), xa, CL, '16"–18"')
  b += vdim(CL + 11 * s, Y(18), Y(0), '17"–19"') + vdim(CL + 31 * s, Y(35), Y(0), '33"–36"')
  b += callout(2, CL + 20 * s, Y(27), [CL + 20 * s, Y(33.5)]) + callout(3, CL - 13 * s, Y(10), [CL - 6 * s, Y(17.5)])
  return { b, mid: xa + 30 * s, right: CL + 31 * s + 60 }
}
function heightsSide(x0, floor, s, ph) {
  const Y = (i) => floor - i * s, wt = ph ? 10 : 14, xb = x0 + wt, X = (i) => xb + i * s
  let b = rect(x0, Y(52), wt, 52 * s, { fill: 'HATCH', stroke: 'none' }) + line(xb, Y(52), xb, floor)
  b += rect(x0 - 4, floor, wt + 62 * s + 8, ph ? 8 : 12, { fill: 'HATCH', stroke: 'none' }) + line(x0 - 4, floor, X(62) + 4, floor)
  b += toiletSide(xb, Y, s)
  b += rect(X(12), Y(35), 42 * s, 1.5 * s, BAR) // side grab bar
  b += hdim(Y(40), xb, X(12), '12" max', ph ? { anchor: 'start' } : {}) + hdim(Y(40), X(12), X(54), '42" min') + hdim(Y(48), xb, X(54), '54" min')
  b += rect(X(33), Y(23), 6 * s, 6 * s, { sw: 1.2 }) + line(X(34), Y(17), X(38), Y(17), { sw: 2.5 }) // dispenser, outlet below
  const ext = (x, y1, y2) => line(x, y1, x, y2, { stroke: C.muted, sw: 1, dash: '3 3' })
  b += ext(X(28), Y(18), Y(28)) + ext(X(36), Y(23), Y(28)) + hdim(Y(27), X(28), X(36), '7"–9"')
  b += vdim(X(41), Y(17), Y(0), '15" min') + vdim(X(61), Y(35), Y(0), '33"–36"')
  b += callout(1, X(16), Y(27), [X(16), Y(33.5)]) + callout(4, X(47), Y(21), [X(39), Y(20)])
  return { b, mid: xb + 30 * s, right: X(61) + 60 }
}
function heightsDoor(xc, floor, s, ph) {
  const Y = (i) => floor - i * s, X = (i) => xc + i * s, dw = 18, top = 51
  let b = rect(xc - 12, floor, (dw + 8) * s + 20, ph ? 8 : 12, { fill: 'HATCH', stroke: 'none' }) + line(xc - 12, floor, X(dw + 7) + 6, floor)
  b += `<path d="M${xc} ${Y(top)} V${Y(12)} H${X(dw)} V${Y(top)}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>` // door, continuing left and up
  b += rect(X(dw + 1), Y(top), 6 * s, top * s, { stroke: 'none' }) + line(X(dw + 1), Y(top), X(dw + 1), Y(0)) + line(X(dw + 7), Y(top), X(dw + 7), Y(0))
  b += hbrk(xc, X(dw + 7), Y(top)) + vbrk(xc, Y(top), Y(12))
  b += rect(X(dw - 4), Y(41.5), 4 * s, 1.5 * s, { fill: C.ink, stroke: 'none' }) + rect(X(dw + 1), Y(42.5), 2.5 * s, 3.5 * s, { sw: 1.2 }) // latch, keeper
  b += rect(X(dw - 7), Y(43), 1.2 * s, 4 * s, { fill: C.ink, stroke: 'none', rx: 2 }) // pull
  b += rect(X(5), Y(46), 1.6 * s, 2.4 * s, { sw: 1.2, rx: 2 }) + `<path d="M${X(5.8)} ${Y(44)} v${2.2 * s} q0 ${1.5 * s} ${1.5 * s} ${1.5 * s}" fill="none" stroke="${C.ink}" stroke-width="2"/>` // coat hook
  const r1 = X(dw + 7) + (ph ? 12 : 14), r2 = r1 + (ph ? 66 : 74)
  b += vdim(r1, Y(48), Y(34), '34"–48"') + vdim(r2, Y(48), Y(15), '15"–48"')
  b += callout(5, X(13), Y(26), [X(dw - 3), Y(40.4)]) + callout(6, X(5.8), Y(34), [X(5.8), Y(42)])
  return { b, mid: X(dw / 2 + 4), right: r2 + 60 }
}
{
  const s = 3.2, floor = 190
  const a = heightsRear(20, floor, s, false), bb = heightsSide(268, floor, s, false), c = heightsDoor(548, floor, s, false)
  const cy = floor + 34
  made.push(svg('accessible-stall-heights', 780, cy + 12, 'Heights in a wheelchair accessible toilet compartment',
    'Three elevations of a wheelchair accessible compartment. The rear wall: a grab bar 36 inches long minimum, reaching 12 inches minimum on one side of the toilet centerline and 24 inches minimum on the other, with the centerline 16 to 18 inches from the side wall and the seat 17 to 19 inches high. The side wall closest to the toilet: a grab bar 42 inches long minimum, starting 12 inches maximum from the rear wall and reaching 54 inches minimum from it, and a toilet paper dispenser 7 to 9 inches in front of the toilet with its outlet 15 inches minimum above the floor. Both grab bars, shown in orange, are 33 to 36 inches high to the top. The inside of the door: latch and pulls 34 to 48 inches above the floor, and a coat hook within 15 to 48 inches.',
    a.b + bb.b + c.b + note(a.mid, cy, 'rear wall', 'middle', 13) + note(bb.mid, cy, 'side wall closest to the toilet', 'middle', 13) + note(c.mid + 20, cy, 'door, inside face', 'middle', 13)))
  withPhone(3, () => {
    const f = 170
    phone('accessible-stall-heights-m1', f + 16, heightsRear(62, f, 3, true).b)
    phone('accessible-stall-heights-m2', f + 16, heightsSide(44, f, 3, true).b)
    phone('accessible-stall-heights-m3', f + 16, heightsDoor(110, f, 3, true).b)
  })
}

// 8. Wall backing: the wall cut through at a panel bracket, seen from above. Finish and backing thicknesses are
// drawn, not sourced; the hole size and depth and the screw length are the guide's.
function backingSection(xw, top, k, ph) {
  const t = ph ? 3 : 5, ear = 1.2 * k, slot = 0.5 * k, leg = 1.6 * k, sw = slot + 2 * t, W = 2 * ear + sw
  const wTop = top + (ph ? 24 : 34), y0 = wTop + (ph ? 22 : 40), wBot = y0 + W + (ph ? 22 : 40)
  const fin = 0.6 * k, bk = 3 * k, d = (5 / 16) * k, depth = 2 * k, hs = [y0 + ear / 2, y0 + W - ear / 2]
  let b = rect(xw - fin - bk, wTop, bk, wBot - wTop, { fill: C.orangeTint, stroke: C.orange, sw: 2 })
  b += rect(xw - fin, wTop, fin, wBot - wTop, { fill: 'HATCH', stroke: 'none' }) + line(xw, wTop, xw, wBot) + line(xw - fin, wTop, xw - fin, wBot, { sw: 1 })
  b += hbrk(xw - fin - bk, xw, wTop) + hbrk(xw - fin - bk, xw, wBot)
  // panel (1" from the wall) in the bracket, continuing to the right
  const pr = xw + (ph ? 13.5 : 12) * k
  b += rect(xw + k, y0 + ear + t, pr - xw - k, slot, { sw: 1.2 }) + vbrk(pr, y0 + ear + t - 6, y0 + ear + t + slot + 6)
  // bracket: ear plate on the wall face, two legs around the panel
  b += `<path d="M${xw} ${y0} H${xw + t} V${y0 + ear} H${xw + leg} V${y0 + ear + t} H${xw + t} V${y0 + ear + t + slot} H${xw + leg} V${y0 + ear + sw} H${xw + t} V${y0 + W} H${xw} Z" fill="#fff" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`
  for (const yh of hs) {
    b += rect(xw - depth, yh - d / 2, depth, d, { fill: '#fff', sw: 1 }) // hole
    b += rect(xw - depth + 0.12 * k, yh - d / 2 + 1, depth - 0.12 * k, d - 2, { fill: C.orange, stroke: 'none' }) // anchor
    b += line(xw + t, yh, xw + t - 2 * k, yh, { sw: ph ? 2 : 3 }) // screw, 2" long
    b += rect(xw + t, yh - 0.22 * k, 0.14 * k, 0.44 * k, { fill: C.ink, stroke: 'none', rx: 1 }) // head
  }
  // hole size and depth, below the wall
  const dl = wBot + (ph ? 14 : 18), hb = hs[1] + d / 2
  for (const x of [xw - depth, xw]) b += line(x, hb, x, dl + 5, { stroke: C.muted, sw: 1, dash: '3 3' })
  b += line(xw - depth, dl, xw, dl, { stroke: C.muted, sw: 1 }) + val(xw - depth / 2, dl + (ph ? 18 : 22), 'Ø5/16" hole, 2" min deep')
  const dyc = top + 12, at = (n, dx, to) => callout(n, xw + dx, dyc, to)
  const off = ph ? [-92, -60, -28, 4, 36] : [-130, -64, -18, 30, 76]
  b += at(2, off[0], [xw - fin - bk * 0.75, wTop + 10]) + at(3, off[1], [xw - 1.3 * k, hs[0]]) + at(1, off[2], [xw - fin / 2, wTop + 14])
  b += at(4, off[3], [xw + t + 0.07 * k, hs[0] - 0.22 * k]) + at(5, off[4], [xw + leg - 3, y0 + ear + t / 2]) + at(6, (ph ? 7 : 6.5) * k, [xw + (ph ? 7 : 6.5) * k, y0 + ear + t])
  return { b, dl, wBot }
}
{
  const r = backingSection(262, 14, 36, false)
  made.push(svg('wall-backing', 780, r.dl + 50, 'Wall backing behind a toilet partition wall bracket',
    'The wall cut through at a panel bracket, seen from above: the wall finish, solid backing behind it (in orange), and a bracket fixed with a screw into a plastic anchor in a 5/16-inch hole at least 2 inches deep at each ear. The panel sits in the bracket.',
    r.b + note(780 - 24, r.dl + 40, 'Seen from above, cut through the wall at a bracket.', 'end', 13)))
  withPhone(1, () => {
    const m = backingSection(128, 6, 16, true)
    phone('wall-backing-m', m.dl + 26, m.b)
  })
}

// 9. Door and latch problems: three front views of a door between its hinge pilaster (left) and latch pilaster
// (right), seen from inside the stall. Angles and offsets are exaggerated so they show. Orange: what is out of line.
const LATCH_PROBLEMS = [['A', 'Pilaster out of plumb'], ['B', 'Door dropped at the latch'], ['C', 'Keeper out of line']]
function latchFrame(kind, cx, floor, s, ph) {
  const Y = (i) => floor - i * s, xL = cx - 19 * s, d0 = xL + 7 * s, de = d0 + 24 * s, p = de + s
  const OT = { fill: C.orangeTint, stroke: C.orange, sw: 2 }
  let b = rect(xL - 10, floor, 38 * s + 20, ph ? 6 : 10, { fill: 'HATCH', stroke: 'none' }) + line(xL - 10, floor, xL + 38 * s + 10, floor)
  b += rect(xL, Y(82), 6 * s, 82 * s)
  const hinge = (y) => rect(d0 - 1.6 * s, Y(y), 2.4 * s, 5 * s, { fill: C.ink, stroke: 'none' })
  const keeper = (dy, o = { sw: 1.2 }) => rect(p, Y(43 + dy), 2.5 * s, 3.5 * s, o)
  const latch = rect(de - 4 * s, Y(41.5), 4 * s, 1.5 * s, { fill: C.ink, stroke: 'none' })
  const a = ph ? 3 : 2.5, rad = a * Math.PI / 180
  if (kind === 'A') { // latch pilaster leaning away from the door: the gap opens towards the top
    const at = (h) => [p + h * s * Math.sin(rad), floor - h * s * Math.cos(rad)]
    const [x70, y70] = at(70), [x12, y12] = at(12)
    b += line(p, Y(86), p, floor, { stroke: C.muted, sw: 1, dash: '5 5' }) // plumb
    b += `<polygon points="${de},${Y(70)} ${x70.toFixed(1)},${y70.toFixed(1)} ${x12.toFixed(1)},${y12.toFixed(1)} ${de},${Y(12)}" fill="${C.orangeTint}" stroke="${C.orange}" stroke-width="2" stroke-linejoin="round"/>`
    b += rect(d0, Y(70), 24 * s, 58 * s) + latch + hinge(66) + hinge(18)
    b += `<g transform="rotate(${a} ${p} ${floor})">${rect(p, Y(82), 6 * s, 82 * s)}${keeper(0)}</g>`
  }
  if (kind === 'B') { // the latch side has dropped: top and bottom edges slope, the latch sits below the keeper
    const drop = (ph ? 4 : 4) * s
    b += rect(p, Y(82), 6 * s, 82 * s) + keeper(0)
    b += rect(d0, Y(70), 24 * s, 58 * s, { fill: 'none', stroke: C.muted, sw: 1.2, dash: '5 5' }) // where it should be
    b += `<polygon points="${d0},${Y(70)} ${de},${Y(70)} ${de},${Y(70) + drop}" fill="${C.orangeTint}" stroke="${C.orange}" stroke-width="2" stroke-linejoin="round"/>`
    b += `<g transform="matrix(1 ${(drop / (24 * s)).toFixed(4)} 0 1 0 ${(-d0 * drop / (24 * s)).toFixed(2)})">${rect(d0, Y(70), 24 * s, 58 * s)}${latch}</g>` + hinge(66) + hinge(18)
  }
  if (kind === 'C') { // door square, keeper fixed too high
    b += rect(p, Y(82), 6 * s, 82 * s) + keeper(0, { fill: 'none', stroke: C.muted, sw: 1.2, dash: '4 3' })
    b += rect(d0, Y(70), 24 * s, 58 * s) + latch + hinge(66) + hinge(18)
    b += keeper(4, { fill: C.orangeTint, stroke: C.orange, sw: 2.5 })
  }
  return { b, xL }
}
{
  const s = 2.9, fw = 260, floor = 24 + 82 * s
  let b = ''
  LATCH_PROBLEMS.forEach(([L, cap], i) => {
    const cx = fw / 2 + i * fw + 10, f = latchFrame(L, cx, floor, s, false)
    b += f.b + disc(L, fw / 2 + i * fw - 92, floor + 42) + text(fw / 2 + i * fw - 74, floor + 47, cap, { size: 14, weight: 600 })
  })
  b += note(16, floor + 82, 'Seen from inside the stall: hinge pilaster on the left, latch pilaster on the right. Angles and offsets exaggerated.', 'start', 13)
  made.push(svg('door-latch-problems', 780, floor + 94, 'Why a toilet partition door won\'t latch: three causes',
    'Three front views of a stall door between its hinge pilaster and latch pilaster: A, the latch pilaster leans out of plumb, so the gap at the latch edge widens towards the top; B, the door has dropped at the latch side, so its top edge slopes and the latch sits below the keeper; C, the door hangs square but the keeper on the pilaster is out of line with the latch. What is out of line is shown in orange.', b))
  withPhone(2, () => {
    const f2 = 30 + 82 * 2
    let p = ''
    ;['A', 'B'].forEach((L, i) => { p += latchFrame(L, 90 + i * 180 + 6, f2, 2, true).b + disc(L, 90 + i * 180 - 62, 16) })
    phone('door-latch-problems-m1', f2 + 14, p)
    phone('door-latch-problems-m2', f2 + 14, latchFrame('C', 186, f2, 2, true).b + disc('C', 118, 16))
  })
}

// 10. Accessible compartment plan, seen from above: rear wall on the left, the side wall closest to the toilet at
// the top, a side partition at the bottom, the front partition and door on the right. Orange: the minimum
// compartment area the door may not swing into. Drawn at the minimum size for a floor-mounted toilet.
function adaPlan(xr, ys, k, ph) {
  const wt = ph ? 7 : 12, pt = ph ? 3 : 4, xf = xr + 59 * k, yb = ys + 60 * k, CLy = ys + 17 * k
  const jt = ys + 22 * k, jb = ys + 56 * k // door jambs: the opening ends 4" from the side partition
  let b = rect(xr - wt, ys - wt, wt, 72 * k + wt, { fill: 'HATCH', stroke: 'none' }) + rect(xr - wt, ys - wt, 59 * k + wt + 42 * k, wt, { fill: 'HATCH', stroke: 'none' })
  b += line(xr, ys + 72 * k, xr, ys) + line(xr, ys, xf + 42 * k, ys)
  b += rect(xr, ys, 59 * k, 60 * k, { fill: C.orangeTint, stroke: C.orange, sw: 2.5 }) // minimum compartment area
  b += line(xr + 56 * k, ys + 2, xr + 56 * k, yb - 2, { stroke: C.orange, sw: 1.5, dash: '5 5' }) // 56" with a wall-hung toilet
  // toe clearance under the front partition and the side partition, 6" beyond the compartment face
  const TOE = { fill: 'none', stroke: C.muted, sw: 1.2, dash: '4 3' }
  b += rect(xf, ys, 6 * k, 60 * k + pt, TOE) + rect(xr, yb, 59 * k + pt, 6 * k, TOE)
  // toilet against the rear wall
  b += rect(xr + 1, CLy - 8 * k, 6 * k, 16 * k, { sw: 1.2, rx: 2 }) + `<ellipse cx="${xr + 17 * k}" cy="${CLy}" rx="${11 * k}" ry="${7.5 * k}" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`
  b += cline(xr - wt - (ph ? 18 : 24), CLy, xr + 31 * k, CLy, { stroke: C.muted, sw: 1 })
  // side partition, front partition, door open 90° (outswing) hinged at the jamb near the side partition
  b += rect(xr, yb, 59 * k + pt, pt) + rect(xf, ys, pt, jt - ys) + rect(xf, jb, pt, yb - jb + pt)
  const R = jb - jt, hx = xf + pt
  b += `<path d="M${hx} ${jt} A${R} ${R} 0 0 1 ${hx + R} ${jb}" fill="none" stroke="${C.muted}" stroke-width="1.2" stroke-dasharray="5 5"/>`
  b += rect(hx, jb - pt, R, pt, { sw: 1.5 })
  // dimensions
  const x2 = xr - wt - (ph ? 12 : 16), x1 = x2 - (ph ? 64 : 84)
  b += (ph ? vdim(x1, ys, yb, '', 'left') + text(x1 - 7, (ys + yb) / 2, '60" min', { size: DIM, fill: C.muted, anchor: 'middle', weight: 600, rotate: -90 }) : vdim(x1, ys, yb, '60" min', 'left')) + vdim(x2, ys, CLy, '16"–18"', 'left') + vdim(x2, yb, yb + 6 * k, '6" min', 'left')
  const h1 = ys - wt - (ph ? 14 : 18), h2 = h1 - (ph ? 26 : 32)
  b += hdim(h1, xr, xr + 56 * k, ph ? '56" min' : '56" min, wall-hung toilet') + hdim(h2, xr, xf, ph ? '59" min' : '59" min, floor-mounted toilet')
  const xd = hx + R + (ph ? 6 : 16)
  b += vdim(xd, jt, jb - pt, '32" min') + vdim(xd, jb, yb, '4" max')
  b += line(hx + R, jb, xd + 5, jb, { stroke: C.muted, sw: 1, dash: '3 3' }) + line(xf + pt, yb, xd + 5, yb, { stroke: C.muted, sw: 1, dash: '3 3' }) + line(xf + pt, jt, xd + 5, jt, { stroke: C.muted, sw: 1, dash: '3 3' })
  // callouts
  b += disc(1, xr + 42 * k, ys + 38 * k) + callout(2, xr + 38 * k, CLy, [xr + 29 * k, CLy])
  b += callout(3, hx + 20 * k, jb - 14 * k, [hx + 20 * k, jb - pt]) + callout(4, xf + 14 * k, yb + (ph ? 18 : 24), [xf + pt / 2, jb + 2 * k])
  b += callout(5, xf + 3 * k, ys + 9 * k, null) + callout(6, xr + 40 * k, yb + 6 * k + (ph ? 16 : 22), [xr + 40 * k, yb + 3 * k])
  return { b, bottom: yb + 6 * k + (ph ? 30 : 36) }
}
{
  const r = adaPlan(285, 88, 3.6, false)
  made.push(svg('accessible-stall-plan', 780, r.bottom + 30, 'Wheelchair accessible toilet compartment, plan view',
    'A wheelchair accessible compartment seen from above, drawn at the minimum size: 60 inches wide minimum, and 59 inches deep minimum with a floor-mounted toilet or 56 inches with a wall-hung toilet. The toilet centerline is 16 to 18 inches from the side wall. The door in the front partition opens out, gives a 32-inch minimum clear opening and sits within 4 inches of the side partition farthest from the toilet. Toe clearance runs 6 inches beyond the front partition and one side partition. The minimum compartment area, which the door may not swing into, is shown in orange.',
    r.b + note(24, r.bottom + 16, 'Seen from above.', 'start', 13)))
  withPhone(1.8, () => {
    const m = adaPlan(122, 66, 1.8, true)
    phone('accessible-stall-plan-m', m.bottom + 2, m.b)
  })
}

// Sheets: the plan and front views (above) also get phone variants; the side view and details are 400 wide and
// scale to the column as they are.
console.log(`${phoneMade.length} phone variants: ${phoneMade.join(', ')}`)

console.log(`${made.length} diagrams: ${made.join(', ')}; sheets: ${Object.keys(sheets).join(', ')}`)
