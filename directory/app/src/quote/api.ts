import { createClient } from '@supabase/supabase-js'
import type { JobStatus, Scope } from '../portal/types'
import { customerDrawingsUrl } from './server'
import { sampleRepo } from '../directory/repo.sample'
import { sampleStore, saveSample } from '../portal/repo.sample'

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

// ---------- FICTIONAL sample (no Supabase keys) ----------
// Reads and changes the portal's sample jobs (portal/repo.sample.ts), so in the clickable preview a customer's
// choice shows up for the job coordinator and the installer. Tokens look like 'sample-j1044'.
export const QUOTE_SAMPLE_NOTICE = 'Sample quote: the customer, installers and prices are fictional. Nothing is saved or paid.'
const SHOWN: JobStatus[] = ['presented', 'installer_chosen', 'released', 'scheduled', 'installed', 'signed_off']
const wait = () => new Promise((r) => setTimeout(r, 150))
const need = (token: string) => {
  const q = sampleStore.byToken(token)
  if (!q) throw new Error('Quote not found')
  return q
}
const visible = (q: NonNullable<ReturnType<typeof sampleStore.byToken>>) =>
  SHOWN.includes(q.job.status) ? q.invites.filter((i) => i.priceCents !== null && !i.declined && i.priceFlag === null) : []
const flag = (q: NonNullable<ReturnType<typeof sampleStore.byToken>>, reason: string) => {
  q.job.needsAttention = true
  q.job.attentionReason = reason
}

const sampleQuotes: QuoteApi = {
  sample: true,
  async get(token) {
    await wait()
    const q = sampleStore.byToken(token)
    if (!q) return null
    const prices = await Promise.all(visible(q).map(async (i): Promise<QuotePrice> => {
      const who = sampleStore.installers.find((x) => x.id === i.installerId)!
      const pub = await sampleRepo.installer(who.slug)
      return { installerId: i.installerId, slug: who.slug, displayName: who.displayName, baseCity: who.baseCity, listed: who.status === 'approved',
        rating: pub?.rating ?? null, reviewCount: pub?.reviewCount ?? 0, installs: pub?.installs ?? 0, priceCents: i.priceCents!,
        earliestInstallDate: i.earliestInstallDate, assumptions: i.assumptions }
    }))
    const { job: j, quote: k, contact: c } = q
    return structuredClone({
      ref: j.ref, quoteRef: k.quoteRef, city: j.city, zip: j.zip, scope: j.scope, delivery: j.delivery, status: j.status, hasDrawings: !!j.drawingsPath,
      drawingsApprovedAt: k.drawingsApprovedAt, partitionsCents: k.partitionsCents, freightCents: k.freightCents, taxNote: k.taxNote, validUntil: k.validUntil,
      customerName: c?.customerName ?? 'Customer', company: c?.company ?? null, email: c?.email ?? '', changeRequest: k.changeRequest,
      customerChoice: k.customerChoice, paymentMethod: k.paymentMethod, poNumber: k.poNumber, paid: !!(j.partitionsPaidAt || j.poAcceptedAt),
      releasedAt: j.releasedAt, installDate: j.installDate, windowClosed: !!j.windowClosedAt, searchRound: j.searchRound,
      chosenInstallerId: j.chosenInstallerId, prices,
    })
  },
  async approveDrawings(token) {
    await wait()
    const q = need(token)
    if (!q.job.drawingsPath) throw new Error("Your shop drawings aren't ready yet")
    q.quote.drawingsApprovedAt ??= new Date().toISOString()
  },
  async requestChange(token, text) {
    await wait()
    const q = need(token)
    Object.assign(q.quote, { changeRequest: text, drawingsApprovedAt: null })
    flag(q, 'Customer asked for a drawing change')
  },
  async choose(token, id) {
    await wait()
    const q = need(token)
    if (!q.quote.drawingsApprovedAt) throw new Error('Approve your shop drawings first')
    if (q.job.chosenInstallerId) throw new Error("You've already chosen an installer. Call 1-833-997-7489 to change.")
    if (q.job.status !== 'presented') throw new Error("Installer prices aren't ready yet")
    if (!visible(q).some((i) => i.installerId === id)) throw new Error('That installer has no price on this quote')
    Object.assign(q.job, { chosenInstallerId: id, status: 'installer_chosen' })
    q.quote.customerChoice = null
    q.release()
  },
  async fallback(token, choice) {
    await wait()
    const q = need(token)
    q.quote.customerChoice = choice
    flag(q, `Customer chose: ${({ wait: 'keep waiting for prices', partitions_only: 'partitions only, install later', own_installer: 'their own installer' } as const)[choice]}`)
  },
  async payment(token, method, po) {
    await wait()
    const q = need(token)
    if (q.job.partitionsPaidAt || q.job.poAcceptedAt) throw new Error('Your partitions order is already paid')
    if (method === 'po' && !po) throw new Error('Enter your purchase order number')
    Object.assign(q.quote, { paymentMethod: method, poNumber: method === 'po' ? po : null })
    flag(q, method === 'po' ? `Customer will pay by purchase order ${po}: accept the PO` : method === 'card' ? 'Customer will pay by card: send a payment link'
      : 'Customer will pay by bank transfer: send bank details and a pro forma invoice')
  },
  async drawingsUrl() { return 'data:text/plain,Sample%20shop%20drawings%20(the%20real%20page%20opens%20the%20PDF)' },
}
for (const [k, f] of Object.entries(sampleQuotes)) {
  if (typeof f === 'function') (sampleQuotes as any)[k] = async (...a: unknown[]) => { const r = await f(...a); saveSample(); return r }
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
