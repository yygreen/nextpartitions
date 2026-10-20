import { describe, expect, it } from 'vitest'
import { centsFromDollars, emptyForm, storageName, toPayload, validateStep, type ApplicationForm, type Files } from './form'

const noFiles: Files = { insurance: null, registration: null }
const pdf = (size = 1000, type = 'application/pdf') => ({ name: 'COI 2026.PDF', size, type }) as File

function filledForm(): ApplicationForm {
  const f = emptyForm()
  Object.assign(f, {
    business_name: ' Acme Installations ', contact_name: 'Sam Lee', phone: '214-555-0142', email: 'Sam@Acme.example',
    base_city: 'Garland', base_zip: '75040', years_in_business: '8', registration_number: 'Dallas 12345',
    agreed: true, agreement_name: 'Sam Lee',
  })
  f.references[0] = { name: 'Pat GC', company: 'Builders', phone: '214-555-0100', email: '', job_note: '8 HDPE stalls, 2025' }
  f.references[1] = { name: 'Chris', company: '', phone: '', email: 'chris@example.com', job_note: '' }
  f.rates = { ...f.rates, powder_coated: '115', hdpe: '140', laminate: '$1,20', high_mount_extra: '40', minimum: '600', free_miles: '50', per_mile: '2' }
  return f
}

describe('centsFromDollars', () => {
  it('reads typed amounts', () => {
    expect(centsFromDollars('$1,640')).toBe(164000)
    expect(centsFromDollars('140.5')).toBe(14050)
    expect(centsFromDollars('')).toBeNull()
    expect(centsFromDollars('0')).toBeNull()
    expect(centsFromDollars('0', true)).toBe(0)
    expect(centsFromDollars('-3')).toBeNull()
    expect(centsFromDollars('abc')).toBeNull()
  })
})

describe('validateStep', () => {
  it('stops an empty business step', () => {
    const e = validateStep(0, emptyForm(), noFiles)
    expect(Object.keys(e)).toEqual(expect.arrayContaining(['business_name', 'contact_name', 'phone', 'email', 'base_city', 'base_zip', 'years_in_business']))
  })
  it('passes a filled business step', () => {
    expect(validateStep(0, filledForm(), noFiles)).toEqual({})
  })
  it('needs a material and a bracing type', () => {
    expect(validateStep(1, { ...filledForm(), mountings: [] }, noFiles)).toHaveProperty('')
  })
  it('needs the insurance certificate, checks file size and type', () => {
    expect(validateStep(2, filledForm(), noFiles)).toHaveProperty('insurance')
    expect(validateStep(2, filledForm(), { insurance: pdf(), registration: null })).toEqual({})
    expect(validateStep(2, filledForm(), { insurance: pdf(11 * 1024 * 1024), registration: null })).toHaveProperty('insurance')
    expect(validateStep(2, filledForm(), { insurance: pdf(), registration: pdf(10, 'text/plain') })).toHaveProperty('registration')
  })
  it('needs two references with a name and a phone or email; the third only if started', () => {
    expect(validateStep(3, filledForm(), noFiles)).toEqual({})
    const f = filledForm()
    f.references[1] = { name: 'Chris', company: '', phone: '', email: '', job_note: '' }
    f.references[2] = { name: '', company: 'Half filled', phone: '', email: '', job_note: '' }
    expect(Object.keys(validateStep(3, f, noFiles)).sort()).toEqual(['ref1.phone', 'ref2.name', 'ref2.phone'])
  })
  it('needs a rate for every selected material', () => {
    const f = filledForm()
    f.rates.hdpe = ''
    expect(validateStep(4, f, noFiles)).toHaveProperty('rate.hdpe')
    expect(validateStep(4, filledForm(), noFiles)).toEqual({})
  })
  it('needs the agreement ticked and signed', () => {
    expect(Object.keys(validateStep(5, emptyForm(), noFiles)).sort()).toEqual(['agreed', 'agreement_name'])
  })
})

describe('toPayload', () => {
  it('builds the database payload', () => {
    const p = toPayload(filledForm())
    expect(p).toMatchObject({
      business_name: 'Acme Installations', email: 'sam@acme.example', base_state: 'TX', service_radius_mi: 50, years_in_business: 8,
      materials: ['powder_coated', 'hdpe', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'],
      rates: { per_stall: { powder_coated: 11500, hdpe: 14000, laminate: 12000 }, high_mount_extra_cents: 4000, minimum_cents: 60000, free_miles: 50, per_mile_cents: 200 },
      agreement_name: 'Sam Lee', website: '',
    })
    expect(p.rates.ada_stall_cents).toBeUndefined()
    expect(p.references).toHaveLength(2)
    expect(p.references[1]).toEqual({ name: 'Chris', company: undefined, phone: undefined, email: 'chris@example.com', job_note: undefined })
  })
  it('only sends rates for selected materials', () => {
    const f = filledForm()
    f.materials = ['hdpe']
    expect(toPayload(f).rates.per_stall).toEqual({ hdpe: 14000 })
  })
})

describe('storageName', () => {
  it('makes a safe, unique key', () => {
    expect(storageName(pdf(), 1700000000000)).toBe('1700000000000-coi-2026.pdf')
  })
})
