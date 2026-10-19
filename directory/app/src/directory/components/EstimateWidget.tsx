import { useMemo, useState } from 'react'
import { type Job, estimateFor, formatUsd, rangeAcross } from '../estimate'
import { MATERIAL_LABEL, MOUNTING_LABEL, type Material, type Mounting, type RateCard } from '../types'

// Instant installation estimate from rate cards. On an area page: anonymous range across installers.
// On a profile: that installer's own estimate.
export function EstimateWidget({ cards, single }: { cards: RateCard[]; single?: boolean }) {
  const combos = useMemo(() => {
    const seen = new Map<string, { material: Material; mounting: Mounting }>()
    for (const c of cards) seen.set(`${c.material}|${c.mounting}`, { material: c.material, mounting: c.mounting })
    return [...seen.values()]
  }, [cards])
  const [combo, setCombo] = useState(0)
  const [stalls, setStalls] = useState(4)
  const [removeOld, setRemoveOld] = useState(false)
  if (combos.length === 0) return null

  const job: Job = { ...combos[combo], stalls, removeOld }
  const bySlug = [...new Set(cards.map((c) => c.slug))].map((s) => cards.filter((c) => c.slug === s))
  const est = single ? estimateFor(cards, job) : rangeAcross(bySlug, job)

  return (
    <section aria-labelledby="est" className="bg-card border border-border rounded-lg p-5 grid gap-4">
      <h2 id="est" className="text-lg font-bold">Installation estimate</h2>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <label className="grid gap-1">Partitions
          <select className="border border-border rounded-md px-2 min-h-11 bg-card" value={combo} onChange={(e) => setCombo(Number(e.target.value))}>
            {combos.map((c, n) => <option key={n} value={n}>{MATERIAL_LABEL[c.material]}, {MOUNTING_LABEL[c.mounting].toLowerCase()}</option>)}
          </select>
        </label>
        <label className="grid gap-1">Stalls
          <input type="number" min={1} max={60} inputMode="numeric" className="border border-border rounded-md px-2 min-h-11 bg-card"
            value={stalls} onChange={(e) => setStalls(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
        </label>
        <label className="flex items-center gap-2 sm:pt-6">
          <input type="checkbox" className="size-5" checked={removeOld} onChange={(e) => setRemoveOld(e.target.checked)} />
          Remove old stalls
        </label>
      </div>
      <p aria-live="polite" className="text-2xl font-extrabold tracking-tight">
        {est ? `${formatUsd(est.lowCents)} – ${formatUsd(est.highCents)}` : 'Not priced for this combination'}
      </p>
      <p className="text-sm text-muted-foreground">
        {single ? "From this installer's rate card." : est && 'installers' in est ? `Range across ${est.installers} approved installers.` : ''}{' '}
        Installation only; partitions are priced in the configurator. The installer confirms a firm price after seeing your shop drawings.
      </p>
    </section>
  )
}
