import { MATERIAL_LABEL, MOUNTING_LABEL, type Material, type Mounting } from '../directory/types'

// The installer application: form state (as typed), per-step checks, and the payload for
// dir_submit_application (supabase/migrations). The database checks everything again.

export const STEPS = ['Your business', 'What you install', 'Documents and references', 'Agreement'] as const

export type Extra = 'remove_old' | 'ada' | 'urinal_screens'

export const EXTRA_LABEL: Record<Extra, string> = {
  remove_old: 'Remove and haul away old stalls', ada: 'Accessible (ADA) stalls', urinal_screens: 'Urinal screens',
}
// Order as in the prototype.
export const MATERIALS: Material[] = ['powder_coated', 'hdpe', 'laminate', 'phenolic', 'stainless']
export const MOUNTINGS: Mounting[] = ['overhead_braced', 'floor_mounted', 'ceiling_hung', 'floor_to_ceiling']
export { MATERIAL_LABEL, MOUNTING_LABEL }

// One "phone or email" field per reference: we only need one way to reach them.
export interface Reference { name: string; company: string; contact: string }

// Kept short on purpose: rates are set later in the installer portal, and anything else we need comes up in vetting.
export interface ApplicationForm {
  business_name: string
  contact_name: string
  phone: string
  email: string
  base_city: string
  base_zip: string
  service_radius_mi: string
  years_in_business: string
  materials: Material[]
  mountings: Mounting[]
  extras: Extra[]
  registration_number: string
  references: Reference[] // 2 required; a third can be added
  agreed: boolean
  agreement_name: string
  website: string // honeypot: people never see or fill it
}

export const blankRef = (): Reference => ({ name: '', company: '', contact: '' })

export function emptyForm(): ApplicationForm {
  return {
    business_name: '', contact_name: '', phone: '', email: '', base_city: '', base_zip: '', service_radius_mi: '50', years_in_business: '',
    materials: ['powder_coated', 'hdpe', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'],
    extras: ['remove_old', 'ada', 'urinal_screens'], registration_number: '', references: [blankRef(), blankRef()],
    agreed: false, agreement_name: '', website: '',
  }
}

export interface Files { insurance: File | null; registration: File | null }
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']


const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const filled = (s: string) => s.trim() !== ''
const refUsed = (r: Reference) => [r.name, r.company, r.contact].some(filled)

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
    f.references.forEach((r, n) => {
      if (n < 2 || refUsed(r)) {
        if (!filled(r.name)) e[`ref${n}.name`] = 'Enter a name.'
        if (!filled(r.contact)) e[`ref${n}.contact`] = 'Enter a phone number or email.'
        else if (r.contact.includes('@') && !EMAIL.test(r.contact.trim())) e[`ref${n}.contact`] = 'Check this email address.'
      }
    })
  }
  if (step === 3) {
    if (!f.agreed) e.agreed = 'Tick the box to agree.'
    if (!filled(f.agreement_name)) e.agreement_name = 'Type your full name to sign.'
  }
  return e
}

// The jsonb for dir_submit_application. Keys are the database's; empty optional values are left out.
export function toPayload(f: ApplicationForm) {
  const t = (s: string) => s.trim()
  const opt = (s: string) => (t(s) === '' ? undefined : t(s))
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
    materials: MATERIALS.filter((m) => f.materials.includes(m)),
    mountings: MOUNTINGS.filter((m) => f.mountings.includes(m)),
    extras: f.extras,
    registration_number: t(f.registration_number),
    references: f.references.filter((r, n) => n < 2 || refUsed(r)).map((r) => ({
      name: t(r.name), company: opt(r.company),
      ...(r.contact.includes('@') ? { email: t(r.contact).toLowerCase() } : { phone: opt(r.contact) }),
    })),
    agreement_name: t(f.agreement_name),
    website: f.website,
  }
}

export type ApplicationPayload = ReturnType<typeof toPayload>

// Storage keys: no spaces or odd characters, and a timestamp so a second upload never overwrites.
export const storageName = (file: File, now = Date.now()) => `${now}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`
