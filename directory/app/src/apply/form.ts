import { MATERIAL_LABEL, MOUNTING_LABEL, type Material, type Mounting } from '../directory/types'

// The installer application: form state (as typed), per-step checks, and the payload for
// dir_submit_application (supabase/migrations). The database checks everything again.

export const STEPS = ['Business', 'What you install', 'Documents', 'References', 'Your rates', 'Agreement'] as const

export type CrewSize = '1-2' | '3-5' | '6-10' | '10+'
export type Extra = 'remove_old' | 'ada' | 'urinal_screens'

export const CREW_LABEL: Record<CrewSize, string> = { '1-2': '1–2', '3-5': '3–5', '6-10': '6–10', '10+': 'More than 10' }
export const EXTRA_LABEL: Record<Extra, string> = {
  remove_old: 'Remove and haul away old stalls', ada: 'Accessible (ADA) stalls', urinal_screens: 'Urinal screens',
}
// Order as in the prototype.
export const MATERIALS: Material[] = ['powder_coated', 'hdpe', 'laminate', 'phenolic', 'stainless']
export const MOUNTINGS: Mounting[] = ['overhead_braced', 'floor_mounted', 'ceiling_hung', 'floor_to_ceiling']
export { MATERIAL_LABEL, MOUNTING_LABEL }

export interface Reference { name: string; company: string; phone: string; email: string; job_note: string }

export interface ApplicationForm {
  business_name: string
  contact_name: string
  phone: string
  email: string
  base_city: string
  base_zip: string
  service_radius_mi: string
  years_in_business: string
  crew_size: CrewSize
  materials: Material[]
  mountings: Mounting[]
  extras: Extra[]
  brands: string
  registration_number: string
  references: Reference[] // always 3 slots; the third is optional
  rates: Partial<Record<Material, string>> & {
    high_mount_extra: string; ada_stall: string; urinal_screen: string; demo_per_stall: string; minimum: string; free_miles: string; per_mile: string
  }
  agreed: boolean
  agreement_name: string
  website: string // honeypot: people never see or fill it
}

const blankRef = (): Reference => ({ name: '', company: '', phone: '', email: '', job_note: '' })

export function emptyForm(): ApplicationForm {
  return {
    business_name: '', contact_name: '', phone: '', email: '', base_city: '', base_zip: '', service_radius_mi: '50', years_in_business: '',
    crew_size: '3-5', materials: ['powder_coated', 'hdpe', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'],
    extras: ['remove_old', 'ada', 'urinal_screens'], brands: '', registration_number: '', references: [blankRef(), blankRef(), blankRef()],
    rates: { high_mount_extra: '', ada_stall: '', urinal_screen: '', demo_per_stall: '', minimum: '', free_miles: '', per_mile: '' },
    agreed: false, agreement_name: '', website: '',
  }
}

export interface Files { insurance: File | null; registration: File | null }
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// Dollars typed in a form -> cents. Null when empty or not a positive (or zero, if allowed) amount.
export function centsFromDollars(s: string, allowZero = false): number | null {
  const t = s.replace(/[$,\s]/g, '')
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0 || (n === 0 && !allowZero)) return null
  return Math.round(n * 100)
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const filled = (s: string) => s.trim() !== ''
const refUsed = (r: Reference) => [r.name, r.company, r.phone, r.email, r.job_note].some(filled)

// Problems in one step, keyed by field ('' for the step as a whole). Empty object: the step is fine.
export function validateStep(step: number, f: ApplicationForm, files: Files): Record<string, string> {
  const e: Record<string, string> = {}
  const need = (k: keyof ApplicationForm, label: string) => { if (!filled(String(f[k]))) e[k] = `Enter ${label}.` }
  if (step === 0) {
    need('business_name', 'your business name'); need('contact_name', 'a contact name'); need('phone', 'a phone number')
    if (!EMAIL.test(f.email.trim())) e.email = 'Enter an email address like name@company.com.'
    need('base_city', 'your base city')
    if (!/^\d{5}$/.test(f.base_zip.trim())) e.base_zip = 'Enter a 5-digit ZIP code.'
    const r = Number(f.service_radius_mi)
    if (!(r >= 5 && r <= 200)) e.service_radius_mi = 'Enter a radius between 5 and 200 miles.'
    if (!filled(f.years_in_business) || !(Number(f.years_in_business) >= 0)) e.years_in_business = 'Enter years in business (0 if new).'
  }
  if (step === 1 && (f.materials.length === 0 || f.mountings.length === 0)) e[''] = 'Pick at least one material and one bracing type.'
  if (step === 2) {
    if (!files.insurance) e.insurance = 'Add your certificate of insurance.'
    for (const [k, file] of Object.entries(files) as [keyof Files, File | null][]) {
      if (file && file.size > MAX_FILE_BYTES) e[k] = 'That file is over 10 MB. Send a smaller PDF or photo.'
      else if (file && !FILE_TYPES.includes(file.type)) e[k] = 'Send a PDF, JPEG or PNG.'
    }
    need('registration_number', 'your registration number')
  }
  if (step === 3) {
    f.references.forEach((r, n) => {
      if (n < 2 || refUsed(r)) {
        if (!filled(r.name)) e[`ref${n}.name`] = 'Enter a name.'
        if (!filled(r.phone) && !filled(r.email)) e[`ref${n}.phone`] = 'Enter a phone number or email.'
        if (filled(r.email) && !EMAIL.test(r.email.trim())) e[`ref${n}.email`] = 'Check this email address.'
      }
    })
  }
  if (step === 4) {
    for (const m of f.materials) if (centsFromDollars(f.rates[m] ?? '') === null) e[`rate.${m}`] = `Enter your ${MATERIAL_LABEL[m].toLowerCase()} rate per stall.`
    const extras: [keyof ApplicationForm['rates'], string][] = [['high_mount_extra', 'this extra'], ['ada_stall', 'this extra'], ['urinal_screen', 'this rate'], ['demo_per_stall', 'this rate'], ['minimum', 'a minimum'], ['per_mile', 'a rate per mile']]
    for (const [k, label] of extras) {
      const v = f.rates[k] ?? ''
      if (filled(v) && centsFromDollars(v, true) === null) e[`rate.${k}`] = `Enter ${label} in dollars, or leave it empty.`
    }
    if (filled(f.rates.free_miles) && !(Number(f.rates.free_miles) >= 0)) e['rate.free_miles'] = 'Enter miles, or leave it empty.'
  }
  if (step === 5) {
    if (!f.agreed) e.agreed = 'Tick the box to agree.'
    if (!filled(f.agreement_name)) e.agreement_name = 'Type your full name to sign.'
  }
  return e
}

// The jsonb for dir_submit_application. Keys are the database's; empty optional values are left out.
export function toPayload(f: ApplicationForm) {
  const t = (s: string) => s.trim()
  const opt = (s: string) => (t(s) === '' ? undefined : t(s))
  const cents = (s: string) => centsFromDollars(s, true) ?? undefined
  const per_stall: Partial<Record<Material, number>> = {}
  for (const m of f.materials) {
    const c = centsFromDollars(f.rates[m] ?? '')
    if (c !== null) per_stall[m] = c
  }
  return {
    business_name: t(f.business_name),
    contact_name: t(f.contact_name),
    phone: t(f.phone),
    email: t(f.email).toLowerCase(),
    base_city: t(f.base_city),
    base_state: 'TX',
    base_zip: t(f.base_zip),
    service_radius_mi: Number(f.service_radius_mi),
    years_in_business: Number(f.years_in_business),
    crew_size: f.crew_size,
    materials: MATERIALS.filter((m) => f.materials.includes(m)),
    mountings: MOUNTINGS.filter((m) => f.mountings.includes(m)),
    extras: f.extras,
    brands: opt(f.brands),
    registration_number: t(f.registration_number),
    references: f.references.filter((r, n) => n < 2 || refUsed(r)).map((r) => ({
      name: t(r.name), company: opt(r.company), phone: opt(r.phone), email: opt(r.email), job_note: opt(r.job_note),
    })),
    rates: {
      per_stall,
      high_mount_extra_cents: cents(f.rates.high_mount_extra),
      ada_stall_cents: cents(f.rates.ada_stall),
      urinal_screen_cents: cents(f.rates.urinal_screen),
      demo_per_stall_cents: cents(f.rates.demo_per_stall),
      minimum_cents: cents(f.rates.minimum),
      free_miles: filled(f.rates.free_miles) ? Number(f.rates.free_miles) : undefined,
      per_mile_cents: cents(f.rates.per_mile),
    },
    agreement_name: t(f.agreement_name),
    website: f.website,
  }
}

export type ApplicationPayload = ReturnType<typeof toPayload>

// Storage keys: no spaces or odd characters, and a timestamp so a second upload never overwrites.
export const storageName = (file: File, now = Date.now()) => `${now}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`
