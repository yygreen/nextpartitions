import type { Material, Mounting, RateCard } from './types'

export interface Job {
  material: Material
  mounting: Mounting
  stalls: number
  adaStalls?: number
  removeOld?: boolean
}

export interface Estimate {
  lowCents: number
  highCents: number
}

// One installer's estimate for a job, from their rate card. Null if they don't price that combination.
export function estimateFor(cards: RateCard[], job: Job): Estimate | null {
  const card = cards.find((c) => c.material === job.material && c.mounting === job.mounting)
  if (!card || job.stalls < 1) return null
  const extras =
    (job.removeOld ? (card.extras.demoPerStallCents ?? 0) * job.stalls : 0) +
    (card.extras.adaStallCents ?? 0) * Math.min(job.adaStalls ?? 0, job.stalls)
  return {
    lowCents: Math.max(card.minimumCents, card.perStallLowCents * job.stalls + extras),
    highCents: Math.max(card.minimumCents, card.perStallHighCents * job.stalls + extras),
  }
}

// The anonymous range shown before a customer picks an installer: lowest low to highest high.
export function rangeAcross(cardsByInstaller: RateCard[][], job: Job): (Estimate & { installers: number }) | null {
  const estimates = cardsByInstaller.map((cards) => estimateFor(cards, job)).filter((e): e is Estimate => e !== null)
  if (estimates.length === 0) return null
  return {
    lowCents: Math.min(...estimates.map((e) => e.lowCents)),
    highCents: Math.max(...estimates.map((e) => e.highCents)),
    installers: estimates.length,
  }
}

export const formatUsd = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
