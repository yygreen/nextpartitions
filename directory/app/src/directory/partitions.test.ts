import { describe, expect, it } from 'vitest'
import { partitionsRangeCents } from './partitions'

const basic = { material: 'hdpe', mounting: 'overhead_braced', stalls: 4, ada: false, urinalScreens: 0, privacy: 'standard' } as const

describe('partitionsRangeCents', () => {
  it('gives a range around the per-stall base, rounded to $10', () => {
    // base 4 × $735 = $2,940 → $2,646–$3,528 → rounded
    expect(partitionsRangeCents(basic)).toEqual({ lowCents: 265000, highCents: 353000 })
  })
  it('adds the ADA upgrade, urinal screens and extra privacy to both ends', () => {
    const r = partitionsRangeCents({ ...basic, ada: true, urinalScreens: 2, privacy: 'extra' })
    // + $220 ADA + 2 × $185 screens + 4 × $45 privacy = $770
    expect(r).toEqual({ lowCents: 342000, highCents: 430000 })
  })
})
