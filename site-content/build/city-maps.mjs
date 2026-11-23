// Hero drawing for each city buy page (pages/service-area_<slug>.md with city, state, lat and lng in its front
// matter): the state's outline in the drawing style of design/diagrams.mjs (ink line, hatched fill) with the city
// marked in orange, the one colored thing on the drawing. Writes design/diagrams/city-<slug>.svg (780 x 400) and
// its phone variant city-<slug>-m.svg (360 x 300). Run before build.mjs: `node city-maps.mjs`.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'
import { geoMercator, geoPath, geoCircle } from 'd3-geo'
const require = createRequire(import.meta.url)
const us = require('us-atlas/states-10m.json')
const STATES = feature(us, us.objects.states).features
const C = { ink: '#1c0e05', muted: '#7a6a5e', struct: '#f2f0ec', hatch: '#cfc7bc', orange: '#fe7802', tint: '#fff1e5' }
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif'
const PAGES = '../pages', OUT = '../design/diagrams'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const r1 = (d) => d.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1))

function draw(name, W, H, { city, state, lat, lng }) {
  const st = STATES.find((f) => f.properties.name === state)
  if (!st) throw new Error(`no outline for state "${state}"`)
  const pad = W > 400 ? 30 : 20, labelRoom = 22
  const proj = geoMercator().fitExtent([[pad, pad], [W - pad, H - pad - labelRoom]], st)
  const path = geoPath(proj)
  const [x, y] = proj([lng, lat])
  // about 50 miles around the city: the nearby cities the page lists
  const ring = r1(path(geoCircle().center([lng, lat]).radius(50 / 69)()))
  const big = W > 400
  // the city's name goes on the side with more room inside the drawing
  const [[bx0], [bx1, by1]] = path.bounds(st), [cx] = path.centroid(st)
  // the name sits on the side away from the middle of the state, where there is usually open space
  const left = x < cx
  const lx = left ? x - 24 : x + 24, anchor = left ? 'end' : 'start'
  const fs = big ? 20 : 17
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t-${name} d-${name}" font-family="${FONT}">
<title id="t-${name}">${esc(city)} on a map of ${esc(state)}</title>
<desc id="d-${name}">Outline of ${esc(state)} with ${esc(city)} marked in orange and a ring around the nearby cities we deliver to.</desc>
<defs><pattern id="hatch-${name}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${C.struct}"/><line x1="0" y1="0" x2="0" y2="8" stroke="${C.hatch}" stroke-width="1.5"/></pattern>
<clipPath id="clip-${name}"><path d="${r1(path(st))}"/></clipPath></defs>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<path d="${r1(path(st))}" fill="url(#hatch-${name})" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>
<g clip-path="url(#clip-${name})"><path d="${ring}" fill="${C.tint}" stroke="${C.orange}" stroke-width="1.5" stroke-dasharray="5 4"/></g>
<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big ? 7 : 6}" fill="${C.orange}" stroke="#ffffff" stroke-width="2"/>
<text x="${lx.toFixed(1)}" y="${(y + fs * 0.35).toFixed(1)}" text-anchor="${anchor}" font-size="${fs}" font-weight="700" fill="${C.ink}" stroke="#fff" stroke-width="5" paint-order="stroke" stroke-linejoin="round">${esc(city)}</text>
<text x="${((bx0 + bx1) / 2).toFixed(1)}" y="${Math.min(H - 6, by1 + 20).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" letter-spacing="1.2" fill="${C.muted}">${esc(state.toUpperCase())}</text>
</svg>
`
}

for (const f of readdirSync(PAGES).filter((x) => /^service-area_.+\.md$/.test(x))) {
  const fm = Object.fromEntries(readFileSync(`${PAGES}/${f}`, 'utf8').match(/^---\n([\s\S]*?)\n---/)[1].split('\n').map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]))
  if (!fm.lat || !fm.lng) { console.log('skipped (no lat/lng):', f); continue }
  const slug = f.replace(/^service-area_|\.md$/g, ''), d = { city: fm.city, state: fm.state, lat: +fm.lat, lng: +fm.lng }
  writeFileSync(`${OUT}/city-${slug}.svg`, draw(`city-${slug}`, 780, 400, d))
  writeFileSync(`${OUT}/city-${slug}-m.svg`, draw(`city-${slug}-m`, 360, 300, d))
  console.log('wrote city-' + slug, (readFileSync(`${OUT}/city-${slug}.svg`).length / 1024).toFixed(0) + ' KB')
}
