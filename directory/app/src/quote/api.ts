import { createClient } from '@supabase/supabase-js'
import type { Material, Mounting } from '../directory/types'
import type { JobStatus, Scope } from '../portal/types'
import { customerDrawingsUrl } from './server'

// The customer's quote, read and answered through the dir_customer_* functions (supabase/migrations), keyed by
// the secret token in the link. Browser-side with the publishable key: the database checks every rule.
export interface QuotePrice {
  installerId: string
  slug: string
  displayName: string
  baseCity: string
  listed: boolean // has a public profile to link to (every listed installer, Verified or Approved)
  rating: number | null
  reviewCount: number
  installs: number
  priceCents: number
  earliestInstallDate: string | null
  assumptions: string | null
}

export interface CustomerQuote {
  ref: string
  quoteRef: string | null
  city: string
  zip: string
  scope: Scope
  delivery: { from: string; to: string } | null
  status: JobStatus
  hasDrawings: boolean
  drawingsApprovedAt: string | null
  partitionsCents: number | null
  freightCents: number | null
  taxNote: string | null
  validUntil: string | null
  customerName: string
  company: string | null
  email: string
  changeRequest: string | null
  customerChoice: 'wait' | 'partitions_only' | 'own_installer' | null
  paymentMethod: 'po' | 'card' | 'ach' | null
  poNumber: string | null
  paid: boolean
  releasedAt: string | null
  installDate: string | null
  windowClosed: boolean
  searchRound: number
  chosenInstallerId: string | null
  prices: QuotePrice[]
}

export interface QuoteApi {
  sample: boolean
  get(token: string): Promise<CustomerQuote | null>
  approveDrawings(token: string): Promise<void>
  requestChange(token: string, text: string): Promise<void>
  choose(token: string, installerId: string): Promise<void>
  fallback(token: string, choice: 'wait' | 'partitions_only' | 'own_installer'): Promise<void>
  payment(token: string, method: 'po' | 'card' | 'ach', poNumber: string | null): Promise<void>
  drawingsUrl(token: string): Promise<string>
}

function supabaseQuotes(url: string, key: string): QuoteApi {
  const db = createClient(url, key, { auth: { persistSession: false } })
  const call = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(fn, args)
    if (error) throw error
    return data
  }
  return {
    sample: false,
    async get(token) {
      const r: any = await call('dir_customer_quote', { p_token: token })
      if (!r) return null
      return {
        ref: r.ref, quoteRef: r.quote_ref, city: r.city, zip: r.zip, scope: r.scope ?? {},
        delivery: r.delivery_from ? { from: r.delivery_from, to: r.delivery_to ?? r.delivery_from } : null,
        status: r.status, hasDrawings: !!r.has_drawings, drawingsApprovedAt: r.drawings_approved_at, partitionsCents: r.partitions_cents,
        freightCents: r.freight_cents, taxNote: r.tax_note, validUntil: r.valid_until, customerName: r.customer_name, company: r.company,
        email: r.email, changeRequest: r.change_request, customerChoice: r.customer_choice, paymentMethod: r.payment_method,
        poNumber: r.po_number, paid: !!r.paid, releasedAt: r.released_at, installDate: r.install_date, windowClosed: !!r.window_closed,
        searchRound: r.search_round ?? 0, chosenInstallerId: r.chosen_installer_id,
        prices: (r.prices ?? []).map((p: any): QuotePrice => ({
          installerId: p.installer_id, slug: p.slug, displayName: p.display_name, baseCity: p.base_city, listed: !!p.listed,
          rating: p.rating === null ? null : Number(p.rating), reviewCount: Number(p.review_count ?? 0), installs: Number(p.installs ?? 0),
          priceCents: p.price_cents, earliestInstallDate: p.earliest_install_date, assumptions: p.assumptions,
        })),
      }
    },
    async approveDrawings(token) { await call('dir_customer_approve_drawings', { p_token: token }) },
    async requestChange(token, text) { await call('dir_customer_request_change', { p_token: token, p_text: text }) },
    async choose(token, installerId) { await call('dir_customer_choose', { p_token: token, p_installer: installerId }) },
    async fallback(token, choice) { await call('dir_customer_fallback', { p_token: token, p_choice: choice }) },
    async payment(token, method, poNumber) { await call('dir_customer_payment', { p_token: token, p_method: method, p_po_number: poNumber }) },
    async drawingsUrl(token) { return (await customerDrawingsUrl({ data: { token } })).url },
  }
}

// ---------- FICTIONAL sample (no Supabase keys): the Plano quote from prototypes/customer-quote.html ----------
export const QUOTE_SAMPLE_NOTICE = 'Sample quote: the customer, installers and prices are fictional. Nothing is saved or paid.'
const in_ = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)
const sampleState = (): CustomerQuote => ({
  ref: 'NP-DFW-1048', quoteRef: 'Q-26-1048', city: 'Plano', zip: '75074',
  scope: { material: 'hdpe' as Material, mounting: 'overhead_braced' as Mounting, stalls: 6, ada: true, urinal_screens: 2, remove_stalls: 6,
    building: 'School (elementary)', layout: 'Between walls', color: 'Sage' },
  delivery: { from: in_(18), to: in_(22) }, status: 'presented', hasDrawings: true, drawingsApprovedAt: null,
  partitionsCents: 527000, freightCents: 38500, taxNote: 'Tax-exempt (school): send your certificate', validUntil: in_(29),
  customerName: 'Pat Lee', company: 'Plano ISD Facilities', email: 'pat.lee@example.org', changeRequest: null, customerChoice: null,
  paymentMethod: null, poNumber: null, paid: false, releasedAt: null, installDate: null, windowClosed: true, searchRound: 1, chosenInstallerId: null,
  prices: [
    { installerId: 'a1', slug: 'acme', displayName: 'Acme Installations', baseCity: 'Dallas', listed: true, rating: 4.9, reviewCount: 11, installs: 14,
      priceCents: 214000, earliestInstallDate: in_(23), assumptions: 'Finished floor, blocking in place, work during school hours' },
    { installerId: 'a2', slug: 'northwind', displayName: 'Northwind Washroom', baseCity: 'Fort Worth', listed: true, rating: 4.7, reviewCount: 5, installs: 6,
      priceCents: 198000, earliestInstallDate: in_(26), assumptions: 'Finished floor; removal includes haul-away' },
    { installerId: 'a3', slug: 'metroplex', displayName: 'Metroplex Division 10', baseCity: 'Irving', listed: true, rating: null, reviewCount: 0, installs: 0,
      priceCents: 205000, earliestInstallDate: in_(24), assumptions: null },
  ],
})
const samples: Record<string, CustomerQuote> = {}
const sq = (t: string) => (samples[t] ??= sampleState())
const wait = () => new Promise((r) => setTimeout(r, 150))

const sampleQuotes: QuoteApi = {
  sample: true,
  async get(token) { await wait(); return structuredClone(sq(token)) },
  async approveDrawings(token) { await wait(); sq(token).drawingsApprovedAt = new Date().toISOString() },
  async requestChange(token, text) { await wait(); Object.assign(sq(token), { changeRequest: text, drawingsApprovedAt: null }) },
  async choose(token, id) {
    await wait()
    const q = sq(token)
    if (!q.drawingsApprovedAt) throw new Error('Approve your drawings first')
    Object.assign(q, { chosenInstallerId: id, status: 'installer_chosen' })
  },
  async fallback(token, choice) { await wait(); sq(token).customerChoice = choice },
  async payment(token, method, po) {
    await wait()
    if (method === 'po' && !po) throw new Error('Enter your PO number')
    Object.assign(sq(token), { paymentMethod: method, poNumber: po })
  },
  async drawingsUrl() { return 'data:text/plain,Sample%20shop%20drawings%20(the%20real%20page%20opens%20the%20PDF)' },
}

let api: QuoteApi | null = null
export function quotes(): QuoteApi {
  if (!api) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    api = url && key ? supabaseQuotes(url, key) : sampleQuotes
  }
  return api
}
