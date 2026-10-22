import { describe, expect, it } from 'vitest'
import { estimateFor, formatUsd, rangeAcross } from './estimate'
import type { RateCard } from './types'

const card = (slug: string, low: number, high: number, min = 60000): RateCard => ({
  slug, material: 'hdpe', mounting: 'overhead_braced', perStallLowCents: low, perStallHighCents: high,
  minimumCents: min, extras: { demoPerStallCents: 4000, adaStallCents: 7500 },
})

describe('estimateFor', () => {
  it('multiplies the per-stall rate', () => {
    expect(estimateFor([card('a', 24000, 30000)], { material: 'hdpe', mounting: 'overhead_braced', stalls: 4 }))
      .toEqual({ lowCents: 96000, highCents: 120000 })
  })
  it('applies the minimum charge on small jobs', () => {
    expect(estimateFor([card('a', 24000, 30000)], { material: 'hdpe', mounting: 'overhead_braced', stalls: 1 }))
      .toEqual({ lowCents: 60000, highCents: 60000 })
  })
  it('adds removal and ADA extras, capping ADA stalls at the stall count', () => {
    expect(estimateFor([card('a', 24000, 30000, 0)], { material: 'hdpe', mounting: 'overhead_braced', stalls: 2, removeOld: true, adaStalls: 5 }))
      .toEqual({ lowCents: 48000 + 8000 + 15000, highCents: 60000 + 8000 + 15000 })
  })
  it('returns null when the installer does not price that combination', () => {
    expect(estimateFor([card('a', 1, 2)], { material: 'phenolic', mounting: 'overhead_braced', stalls: 4 })).toBeNull()
  })
})

describe('rangeAcross', () => {
  it('spans the lowest low to the highest high and counts installers who price it', () => {
    const r = rangeAcross([[card('a', 24000, 30000)], [card('b', 22000, 29000)], []], { material: 'hdpe', mounting: 'overhead_braced', stalls: 4 })
    expect(r).toEqual({ lowCents: 88000, highCents: 120000, installers: 2 })
  })
  it('formats dollars without cents', () => expect(formatUsd(123456)).toBe('$1,235'))
})
