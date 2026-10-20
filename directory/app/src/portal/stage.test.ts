import { describe, expect, it } from 'vitest'
import { canPrice, coordinatorLabel, dollarsToCents, formatDateRange, installerStage, parseDateRange } from './stage'
import type { Invite, Job } from './types'

const ME = 'me'
const job = (o: Partial<Job> = {}): Job => ({
  id: 'j', ref: 'J-1', quoteRequestRef: null, areaSlug: 'dallas', city: 'Plano', zip: '75074',
  scope: { material: 'hdpe', mounting: 'overhead_braced', stalls: 6 }, drawingsPath: null, delivery: null,
  status: 'quoting', chosenInstallerId: null, preferredInstallerId: null, partitionsPaidAt: null, poAcceptedAt: null,
  releasedAt: null, installDate: null, neededBy: null, rush: false, requiresBackgroundCheck: false, searchRound: 1,
  priceDueAt: null, windowClosedAt: null, needsAttention: false, attentionReason: null, isTest: false, createdAt: '2026-10-20T13:00:00Z', ...o,
})
const invite = (o: Partial<Invite> = {}): Invite => ({
  jobId: 'j', installerId: ME, round: 1, invitedBy: 'auto', sentAt: '2026-10-20T13:00:00Z', dueAt: '2026-10-22T13:00:00Z',
  respondedAt: null, declined: false, declinedReason: null, priceCents: null, estimateCents: 180000,
  earliestInstallDate: null, assumptions: null, notes: null, late: false, priceFlag: null, ...o,
})
const now = new Date('2026-10-21T12:00:00Z')

describe('installerStage', () => {
  it('walks a won job from request to installed', () => {
    expect(installerStage(job(), invite(), ME, now)).toBe('new')
    expect(installerStage(job(), invite({ priceCents: 170000 }), ME, now)).toBe('priced')
    expect(installerStage(job({ chosenInstallerId: ME, status: 'installer_chosen' }), invite({ priceCents: 1 }), ME, now)).toBe('chosen')
    expect(installerStage(job({ chosenInstallerId: ME, status: 'released', releasedAt: 'x' }), invite(), ME, now)).toBe('released')
    expect(installerStage(job({ chosenInstallerId: ME, status: 'scheduled', releasedAt: 'x' }), invite(), ME, now)).toBe('scheduled')
    expect(installerStage(job({ chosenInstallerId: ME, status: 'signed_off', releasedAt: 'x' }), invite(), ME, now)).toBe('installed')
  })
  it('shows a lost job without saying who won', () => {
    expect(installerStage(job({ chosenInstallerId: 'other' }), invite({ priceCents: 1 }), ME, now)).toBe('lost')
  })
  it('marks a missed deadline but keeps the job priceable', () => {
    expect(installerStage(job(), invite({ dueAt: '2026-10-21T11:00:00Z' }), ME, now)).toBe('late')
    expect(canPrice(job(), invite({ dueAt: '2026-10-21T11:00:00Z' }))).toBe(true)
  })
  it('stops pricing once the customer has chosen, or after declining', () => {
    expect(canPrice(job({ chosenInstallerId: 'other' }), invite())).toBe(false)
    expect(canPrice(job(), invite({ declined: true }))).toBe(false)
    expect(installerStage(job(), invite({ declined: true }), ME, now)).toBe('declined')
  })
})

describe('coordinatorLabel', () => {
  it('counts prices while the window is open', () => {
    expect(coordinatorLabel(job(), [invite({ priceCents: 1, respondedAt: 'x' }), invite({ installerId: 'b' })])).toBe('Pricing · 1 in, 1 waiting')
  })
  it('asks to present prices once the window closes', () => {
    expect(coordinatorLabel(job({ windowClosedAt: 'x' }), [invite({ priceCents: 1, respondedAt: 'x' })])).toBe('1 price in · present to the customer')
    expect(coordinatorLabel(job({ windowClosedAt: 'x' }), [invite({ declined: true, respondedAt: 'x' })])).toBe('No prices')
  })
})

describe('date ranges', () => {
  it('reads Postgres canonical ranges as inclusive dates', () => {
    expect(parseDateRange('[2026-11-09,2026-11-14)')).toEqual({ from: '2026-11-09', to: '2026-11-13' })
    expect(parseDateRange('[2026-11-09,2026-11-13]')).toEqual({ from: '2026-11-09', to: '2026-11-13' })
    expect(parseDateRange(null)).toBeNull()
    expect(parseDateRange('empty')).toBeNull()
  })
  it('writes inclusive ranges', () => {
    expect(formatDateRange({ from: '2026-11-09', to: '2026-11-13' })).toBe('[2026-11-09,2026-11-13]')
  })
})

describe('dollarsToCents', () => {
  it('accepts typed amounts', () => {
    expect(dollarsToCents('$1,640')).toBe(164000)
    expect(dollarsToCents('1640.50')).toBe(164050)
    expect(dollarsToCents('')).toBeNull()
    expect(dollarsToCents('-5')).toBeNull()
  })
})
