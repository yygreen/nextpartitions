import { describe, expect, it } from 'vitest'
import { blankRef, emptyForm, storageName, toPayload, validateStep, type ApplicationForm, type Files } from './form'

const noFiles: Files = { insurance: null, registration: null }
const pdf = (size = 1000, type = 'application/pdf') => ({ name: 'COI 2026.PDF', size, type }) as File
const withCoi: Files = { insurance: pdf(), registration: null }

function filledForm(): ApplicationForm {
  const f = emptyForm()
  Object.assign(f, {
    business_name: ' Acme Installations ', contact_name: 'Sam Lee', phone: '214-555-0142', email: 'Sam@Acme.example',
    base_city: 'Garland', base_zip: '75040', years_in_business: '8', registration_number: 'Dallas 12345',
    agreed: true, agreement_name: 'Sam Lee',
  })
  f.references = [{ name: 'Pat GC', company: 'Builders', contact: '214-555-0100' }, { name: 'Chris', company: '', contact: 'Chris@Example.com' }]
  return f
}

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
    expect(validateStep(2, filledForm(), withCoi)).toEqual({})
    expect(validateStep(2, filledForm(), { insurance: pdf(11 * 1024 * 1024), registration: null })).toHaveProperty('insurance')
    expect(validateStep(2, filledForm(), { insurance: pdf(), registration: pdf(10, 'text/plain') })).toHaveProperty('registration')
  })
  it('needs two references with a name and a phone or email; a third only if started', () => {
    const f = filledForm()
    f.references = [f.references[0], { name: 'Chris', company: '', contact: '' }, { ...blankRef(), company: 'Half filled' }]
    expect(Object.keys(validateStep(2, f, withCoi)).sort()).toEqual(['ref1.contact', 'ref2.contact', 'ref2.name'])
    f.references[1].contact = 'not-an@email'
    expect(validateStep(2, f, withCoi)).toHaveProperty('ref1.contact', 'Check this email address.')
  })
  it('needs the agreement ticked and signed', () => {
    expect(Object.keys(validateStep(3, emptyForm(), noFiles)).sort()).toEqual(['agreed', 'agreement_name'])
  })
})

describe('toPayload', () => {
  it('builds the database payload, without rates (set later in the portal)', () => {
    const p = toPayload(filledForm())
    expect(p).toMatchObject({
      business_name: 'Acme Installations', email: 'sam@acme.example', base_state: 'TX', service_radius_mi: 50, years_in_business: 8,
      materials: ['powder_coated', 'hdpe', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'], agreement_name: 'Sam Lee', website: '',
    })
    expect(p).not.toHaveProperty('rates')
  })
  it('files each reference contact as a phone or an email', () => {
    expect(toPayload(filledForm()).references).toEqual([
      { name: 'Pat GC', company: 'Builders', phone: '214-555-0100' },
      { name: 'Chris', company: undefined, email: 'chris@example.com' },
    ])
  })
})

describe('storageName', () => {
  it('makes a safe, unique key', () => {
    expect(storageName(pdf(), 1700000000000)).toBe('1700000000000-coi-2026.pdf')
  })
})
