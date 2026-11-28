import { describe, expect, it } from 'vitest'
import { type OutboxContext, renderMessages } from '../../../supabase/functions/dir-outbox/messages'

const cfg = { siteUrl: 'https://np.test', coordinatorEmail: 'coord@np.test', phone: '1-833-997-7489', timeZone: 'America/Chicago' }
const customer = { name: 'Example Customer', company: 'Example School', email: 'customer@example.org', phone: '214-555-0100', site_address: '1 Example Pkwy, Plano', site_contact: 'Front office' }
const ctx = (kind: string, payload: Record<string, unknown> = {}, over: Partial<OutboxContext> = {}): OutboxContext => ({
  id: 1, kind, payload,
  job: { ref: 'J-261026-ab12', city: 'Plano', zip: '75074', status: 'quoting', is_test: false, stalls: 6, material: 'hdpe',
    mounting: 'overhead_braced', install_date: null, price_due_at: '2026-10-27T15:00:00Z', delivery_from: '2026-11-09',
    delivery_to: '2026-11-13', priced: 2 },
  customer, quote_token: 'tok123',
  installer: { name: 'Acme Installations', slug: 'acme', contact_name: 'Jordan Smith', email: 'jobs@acme.example' },
  invite: { price_cents: 112000, due_at: '2026-10-27T15:00:00Z', estimate_cents: 112000, invited_by: 'auto' },
  ...over,
})
const leaksCustomer = (t: string) => [customer.name, customer.email, customer.phone, customer.site_address].some((x) => t.includes(x))

// Every kind the migrations enqueue.
const KINDS = ['job_invite', 'invite_reminder', 'invite_answered', 'prices_ready', 'search_widened', 'no_prices', 'installer_chosen',
  'job_released', 'job_status', 'review_request', 'document_uploaded', 'application_received', 'application_info_request',
  'application_rejected', 'application_approved', 'customer_change_request', 'customer_choice', 'customer_payment']

describe('outbox emails', () => {
  it('writes something sensible for every event kind', () => {
    for (const k of KINDS) {
      const out = renderMessages(ctx(k, { email: 'apply@lonestar.example', to: 'presented', from: 'quoting', declined: true, choice: 'wait', method: 'po', po_number: 'PO-1', check_type: 'insurance', text: 'Move the ADA stall', reason: 'No prices', prices: 2, invited: 2, by: 'payment' }), cfg)
      for (const m of out) {
        expect(m.subject, k).not.toMatch(/undefined|null|NaN/)
        expect(m.text, k).not.toMatch(/undefined|NaN|\[object/)
      }
    }
  })

  it('a job request goes to the installer without customer details, with the deadline in Dallas time', () => {
    const [m, ...rest] = renderMessages(ctx('job_invite', { due_at: '2026-10-27T15:00:00Z', estimate_cents: 112000, invited_by: 'auto' }), cfg)
    expect(rest).toHaveLength(0)
    expect(m.to).toBe('jobs@acme.example')
    expect(m.subject).toBe('New job: 6 HDPE stalls in Plano (reply by Tue, Oct 27, 10:00 AM)')
    expect(m.text).toContain('Estimate from your rates: $1,120')
    expect(m.text).toContain('https://np.test/portal/#J-261026-ab12')
    expect(leaksCustomer(m.text)).toBe(false)
  })

  it('a widened search asks other installers in the wider-area wording', () => {
    const [m] = renderMessages(ctx('job_invite', { invited_by: 'widened' }), cfg)
    expect(m.subject).toMatch(/^Can you take this one\?/)
  })

  it('only the released job email gives the installer the customer details', () => {
    for (const k of ['job_invite', 'invite_reminder', 'installer_chosen']) {
      for (const m of renderMessages(ctx(k), cfg)) expect(leaksCustomer(m.text), k).toBe(false)
    }
    const [m] = renderMessages(ctx('job_released', { by: 'payment' }), cfg)
    expect(m.to).toBe('jobs@acme.example')
    expect(m.text).toContain('Phone: 214-555-0100')
    expect(m.text).toContain('Site: 1 Example Pkwy, Plano')
  })

  it('showing the prices emails the customer their quote link, with the disclaimer', () => {
    const out = renderMessages(ctx('job_status', { from: 'quoting', to: 'presented' }), cfg)
    expect(out.map((m) => m.to)).toEqual(['customer@example.org'])
    expect(out[0].text).toContain('https://np.test/quote/tok123')
    expect(out[0].text).toContain("Next Partitions isn't a party to installation agreements")
    expect(out[0].text).not.toMatch(/\border\b.*checkout|checkout/i)
    // Going back to the prices after the customer changed their mind doesn't email again.
    expect(renderMessages(ctx('job_status', { from: 'installer_chosen', to: 'presented' }), cfg)).toHaveLength(0)
  })

  it('prices coming in alert the coordinator, not the customer', () => {
    const out = renderMessages(ctx('prices_ready', { prices: 2, flagged: 1 }), cfg)
    expect(out.map((m) => m.audience)).toEqual(['coordinator'])
    expect(out[0].subject).toContain('1 to check')
  })

  it('a widened search tells the coordinator and the customer', () => {
    const out = renderMessages(ctx('search_widened', { invited: 2 }), cfg)
    expect(out.map((m) => m.audience)).toEqual(['coordinator', 'customer'])
  })

  it('test jobs never email a customer', () => {
    const job = { ...ctx('x').job!, is_test: true }
    expect(renderMessages(ctx('search_widened', { invited: 1 }, { job }), cfg).map((m) => m.audience)).toEqual(['coordinator'])
  })

  it('a normal priced answer sends nothing; a decline or a price check alerts the coordinator', () => {
    expect(renderMessages(ctx('invite_answered', { price_cents: 112000 }), cfg)).toHaveLength(0)
    expect(renderMessages(ctx('invite_answered', { declined: true }), cfg)[0].subject).toContain('declined')
    expect(renderMessages(ctx('invite_answered', { price_cents: 150000, price_flag: 'above_area' }), cfg)[0].text).toContain('above the area range')
  })

  it('application emails go to the address on the application', () => {
    const out = renderMessages(ctx('application_received', { email: 'apply@lonestar.example' }, { job: null, customer: null, invite: null }), cfg)
    expect(out.map((m) => m.to)).toEqual(['apply@lonestar.example', 'coord@np.test'])
    expect(out[0].text).toContain('Verified')
  })

  it('an event without copy still reaches the coordinator', () => {
    const out = renderMessages(ctx('something_new', { a: 1 }), cfg)
    expect(out).toHaveLength(1)
    expect(out[0].to).toBe('coord@np.test')
  })
})
