import type { Invite, Job } from './types'

// Where a job stands for one installer. The database status is shared by everyone invited, so the
// installer's own stage also depends on their invite and on who the customer chose.
export type Stage = 'new' | 'late' | 'declined' | 'priced' | 'lost' | 'chosen' | 'released' | 'scheduled' | 'installed' | 'closed'

export const STEPS = ['Request', 'Priced', 'Chosen', 'Released', 'Scheduled', 'Installed'] as const

export const STAGE: Record<Stage, { label: string; step: number; tone: 'new' | 'wait' | 'go' | 'off' }> = {
  new: { label: 'New request', step: 0, tone: 'new' },
  late: { label: 'Past the deadline · a late price is still accepted', step: 0, tone: 'new' },
  declined: { label: 'You declined', step: 0, tone: 'off' },
  priced: { label: 'Priced · waiting for the customer', step: 1, tone: 'wait' },
  lost: { label: 'Customer chose another installer', step: 1, tone: 'off' },
  chosen: { label: 'Chosen · waiting for the partitions payment', step: 2, tone: 'wait' },
  released: { label: 'Released · set the install date', step: 3, tone: 'go' },
  scheduled: { label: 'Scheduled', step: 4, tone: 'go' },
  installed: { label: 'Installed', step: 5, tone: 'off' },
  closed: { label: 'Job closed', step: 0, tone: 'off' },
}

export function installerStage(job: Job, invite: Invite, myId: string, now = new Date()): Stage {
  if (job.chosenInstallerId === myId) {
    if (!job.releasedAt) return 'chosen'
    if (job.status === 'scheduled') return 'scheduled'
    if (job.status === 'installed' || job.status === 'signed_off') return 'installed'
    return 'released'
  }
  if (job.status === 'cancelled') return 'closed'
  if (invite.declined) return 'declined'
  if (job.chosenInstallerId) return 'lost'
  if (invite.priceCents !== null) return 'priced'
  if (invite.dueAt && new Date(invite.dueAt) < now) return 'late'
  return 'new'
}

// The installer can still price (or change their price) until the customer chooses.
export const canPrice = (job: Job, invite: Invite) =>
  !job.chosenInstallerId && !invite.declined && job.status !== 'cancelled'

// Jobs that need the installer's action come first: new requests, then released jobs to schedule.
export function inboxOrder(stage: Stage): number {
  return ({ new: 0, late: 0, released: 1, scheduled: 2, chosen: 3, priced: 4, installed: 5, lost: 6, declined: 6, closed: 7 } as const)[stage]
}

// What the coordinator's job list says about a job.
export function coordinatorLabel(job: Job, invites: Invite[]): string {
  if (job.status === 'cancelled') return 'Cancelled'
  if (job.status === 'signed_off') return 'Signed off'
  if (job.status === 'installed') return 'Installed · sign off'
  if (job.status === 'scheduled') return `Install ${job.installDate ?? 'date set'}`
  if (job.releasedAt) return 'Released · installer to schedule'
  if (job.chosenInstallerId) return 'Chosen · waiting for payment or PO'
  const priced = invites.filter((i) => i.priceCents !== null && !i.declined).length
  if (job.status === 'presented') return `${priced} price${priced === 1 ? '' : 's'} with the customer`
  if (job.windowClosedAt) return priced ? `${priced} price${priced === 1 ? '' : 's'} in · present to the customer` : 'No prices'
  if (invites.length === 0) return 'Not routed'
  const waiting = invites.filter((i) => i.respondedAt === null).length
  return `Pricing · ${priced} in, ${waiting} waiting${job.searchRound >= 2 ? ' (wider search)' : ''}`
}

// Postgres daterange text ("[2026-11-02,2026-11-09)") <-> inclusive from/to dates.
export function parseDateRange(r: string | null): { from: string; to: string } | null {
  const m = r?.match(/^([[(])(\d{4}-\d{2}-\d{2})?,(\d{4}-\d{2}-\d{2})?([\])])$/)
  if (!m || !m[2] || !m[3]) return null
  const from = m[1] === '[' ? m[2] : addDays(m[2], 1)
  const to = m[4] === ']' ? m[3] : addDays(m[3], -1)
  return { from, to }
}

export const formatDateRange = (d: { from: string; to: string } | null) => (d ? `[${d.from},${d.to}]` : null)

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const WHEN = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })

export const formatDay = (iso: string | null) => (iso ? DAY.format(new Date(iso.slice(0, 10) + 'T00:00:00Z')) : '')
export const formatWhen = (iso: string | null) => (iso ? WHEN.format(new Date(iso)) : '')
export const formatDelivery = (d: Job['delivery']) => (d ? (d.from === d.to ? formatDay(d.from) : `${formatDay(d.from)}–${formatDay(d.to)}`) : 'To be confirmed')

// Dollars typed in a form -> cents. Null for anything that isn't a positive amount.
export function dollarsToCents(s: string): number | null {
  const n = Number(s.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null
}
