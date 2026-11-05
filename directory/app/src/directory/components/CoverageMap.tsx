import { useMemo, useState } from 'react'
import type { Area, Installer } from '../types'
import { ButtonLink } from './ui'

// The area page's coverage illustration: one soft shape for the region our verified installers work in,
// with its towns lighting up one by one. No installer names, pins, radii or links: it answers "do you
// cover me?", and the only way on is the configure step. Installers are named further down the page
// (for search), where contact runs through us.

type Pt = { lat: number; lng: number }
const W = 460
const H = 340

export function milesBetween(a: Pt, b: Pt) {
  const r = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2
  return 2 * 3958.8 * Math.asin(Math.sqrt(h))
}

// Whether any verified installer works at this point (straight line from their base city).
export function isCovered(installers: Installer[], p: Pt) {
  return installers.some((i) => i.lat != null && i.lng != null && milesBetween({ lat: i.lat, lng: i.lng }, p) <= i.serviceRadiusMi)
}

const CSS = `
.cov-shape{transform-box:fill-box;transform-origin:center;animation:cov-grow 1.1s cubic-bezier(.2,.7,.2,1) both}
.cov-pulse{transform-box:fill-box;transform-origin:center;animation:cov-pulse 3.2s ease-out 1.2s infinite}
.cov-town{opacity:0;animation:cov-pop .5s cubic-bezier(.3,1.6,.5,1) both}
@keyframes cov-grow{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}
@keyframes cov-pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes cov-pulse{0%{opacity:.55;transform:scale(.25)}100%{opacity:0;transform:scale(1.15)}}
@media (prefers-reduced-motion:reduce){.cov-shape,.cov-town{animation:none;opacity:1}.cov-pulse{animation:none;opacity:0}}
`

export function CoverageMap({ area, installers, configureHref = '#configure' }: { area: Area; installers: Installer[]; configureHref?: string }) {
  const [picked, setPicked] = useState('')

  const m = useMemo(() => {
    const places = (area.places ?? []).map((p) => ({ ...p, covered: isCovered(installers, p) }))
    const kx = Math.cos((area.center.lat * Math.PI) / 180)
    // Fit the view to the towns (not to installer radii), so the region fills the frame.
    const pts: Pt[] = places.length ? places : [area.center]
    let x0 = Math.min(...pts.map((p) => p.lng * kx)), x1 = Math.max(...pts.map((p) => p.lng * kx))
    let y0 = Math.min(...pts.map((p) => p.lat)), y1 = Math.max(...pts.map((p) => p.lat))
    const pad = Math.max(x1 - x0, y1 - y0, 0.3) * 0.16
    x0 -= pad; x1 += pad * 1.6; y0 -= pad; y1 += pad // extra room on the right for labels
    const s = Math.min(W / (x1 - x0), H / (y1 - y0))
    const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2
    const xy = (p: Pt) => [ox + (p.lng * kx - x0) * s, oy + (y1 - p.lat) * s] as const
    // Towns light up from the area's centre outwards.
    const order = [...places].sort((a, b) => milesBetween(area.center, a) - milesBetween(area.center, b))
    // Labels go right of the dot, else left, else none (the dot stays), so names never overlap.
    type Box = [number, number, number, number]
    const boxes: Box[] = []
    const hit = (b: Box) => boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])
    const placed = order.map((p) => {
      const [x, y] = xy(p)
      const w = p.name.length * (p.covered ? 6.6 : 6), h = 13
      boxes.push([x - 4, y - 4, x + 4, y + 4])
      const right: Box = [x + 6, y - h / 2 - 1, x + 7 + w, y + h / 2]
      const left: Box = [x - 7 - w, y - h / 2 - 1, x - 6, y + h / 2]
      const side = !hit(right) && right[2] < W ? 'right' as const : !hit(left) && left[0] > 0 ? 'left' as const : null
      if (side) boxes.push(side === 'right' ? right : left)
      return { ...p, x, y, side }
    })
    // The shaded region: soft blobs around each covered town, melted together by the filter.
    return { places: placed, blob: Math.max(26, Math.min(W, H) * 0.12), centre: xy(area.center) }
  }, [area, installers])

  const covered = m.places.filter((p) => p.covered)
  const choice = m.places.find((p) => p.name === picked)
  const id = `cov-${area.slug}`

  return (
    <div className="bg-card text-foreground border border-border p-3 sm:p-4 grid gap-3 shadow-sm">
      <style>{CSS}</style>
      <div>
        <h2 className="text-lg font-extrabold tracking-tight">Where we arrange installation</h2>
        <p className="text-sm text-muted-foreground">Verified installers work across the shaded {area.shortName} area. We ship partitions everywhere in the US.</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block border border-border" role="img"
        aria-label={`Illustrated map of the ${area.name} area. Installation covered in ${covered.map((p) => p.name).join(', ')}.`}>
        <defs>
          <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#e7dfd3" strokeWidth="1" />
          </pattern>
          <radialGradient id={`${id}-fill`} cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#bfe0cb" />
            <stop offset="1" stopColor="#e3f0e7" />
          </radialGradient>
          {/* Blur, then sharpen the alpha: the overlapping circles melt into one rounded region. */}
          <filter id={`${id}-goo`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="#f6f2ec" />
        <rect width={W} height={H} fill={`url(#${id}-grid)`} />
        <g className="cov-shape" filter={`url(#${id}-goo)`}>
          {m.places.filter((p) => p.covered).map((p) => <circle key={p.name} cx={p.x} cy={p.y} r={m.blob} fill={`url(#${id}-fill)`} />)}
        </g>
        <circle className="cov-pulse" cx={m.centre[0]} cy={m.centre[1]} r={Math.min(W, H) * 0.42} fill="none" stroke="#1f7a4d" strokeWidth="2" />
        {m.places.map((p, k) => {
          const { x, y } = p
          const on = p.name === picked
          const side = p.side ?? (on ? 'right' : null) // the chosen town is always labelled
          return (
            <g key={p.name} className="cov-town" style={{ animationDelay: `${0.6 + k * 0.09}s` }}>
              {on && <circle cx={x} cy={y} r={12} fill="rgba(232,99,10,.22)" />}
              <circle cx={x} cy={y} r={on ? 6 : p.covered ? 4.2 : 3} fill={on ? '#e8630a' : p.covered ? '#1f7a4d' : '#a39684'} stroke="#fff" strokeWidth={on || p.covered ? 1.6 : 0} />
              {side && <text x={side === 'right' ? x + 7 : x - 7} y={y + 4} textAnchor={side === 'right' ? 'start' : 'end'}
                fontSize={p.covered ? 11.5 : 10.5} fontWeight={p.covered || on ? 700 : 400} fill={on ? '#1c0e05' : p.covered ? '#163d29' : '#7a6e66'}
                paintOrder="stroke" stroke="#f6f2ec" strokeWidth={3}>{p.name}</text>}
            </g>
          )
        })}
      </svg>
      {m.places.length > 0 && (
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Is your city covered?</span>
          <select className="border border-border bg-card px-3 min-h-11" value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="">Choose your city…</option>
            {m.places.map((p) => <option key={p.name}>{p.name}</option>)}
          </select>
        </label>
      )}
      <div aria-live="polite" className="grid gap-3">
        {choice && (choice.covered
          ? <p className="text-sm"><b className="text-[#1f7a4d]">✓ {choice.name} is covered.</b> Configure your partitions, and verified installers price the installation through us.</p>
          : <p className="text-sm"><b>{choice.name} is just outside the shaded area.</b> We ship your partitions there as anywhere in the US. Configure them, and we'll ask nearby installers to price the install.</p>)}
        <ButtonLink href={configureHref}>Configure your partitions →</ButtonLink>
      </div>
    </div>
  )
}
