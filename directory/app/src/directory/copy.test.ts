import { describe, expect, it } from 'vitest'
import { areaDescription, areaLead } from './copy'
import type { Area } from './types'

const area = (slug: string, name: string, cities: string[] = []): Area => ({
  slug, name, shortName: name, state: 'TX', stateSlug: 'texas', center: { lat: 0, lng: 0 }, cities, published: true, local: null,
})

const SAMPLE = [
  area('dallas', 'Dallas', ['Dallas', 'Plano', 'Irving']), area('fort-worth', 'Fort Worth', ['Fort Worth', 'Arlington', 'Mansfield']),
  area('houston', 'Houston', ['Houston', 'Pasadena', 'Pearland']), area('austin', 'Austin', ['Austin', 'Round Rock']),
  area('el-paso', 'El Paso', ['El Paso', 'Socorro', 'Horizon City']), area('denver', 'Denver', []),
  area('phoenix', 'Phoenix', ['Phoenix', 'Mesa', 'Tempe']), area('miami', 'Miami', ['Miami', 'Hialeah', 'Coral Gables']),
]

describe('city page intro and description', () => {
  it('always names the city', () => {
    for (const a of SAMPLE) {
      expect(areaLead(a)).toContain(a.name)
      expect(areaDescription(a)).toContain(a.name)
    }
  })

  it('gives a city the same version every time', () => {
    for (const a of SAMPLE) expect(areaLead(a)).toBe(areaLead({ ...a }))
  })

  it('varies the wording across cities', () => {
    const leads = new Set(SAMPLE.map((a) => areaLead(a).replace(new RegExp(a.name, 'g'), 'X')))
    expect(leads.size).toBeGreaterThan(2)
  })

  it('never calls the quote an order or checkout, and never names a city twice as its own neighbour', () => {
    for (const a of SAMPLE) {
      const t = areaLead(a) + ' ' + areaDescription(a)
      expect(t).not.toMatch(/\b(order|checkout)\b/i)
      expect(t).not.toMatch(new RegExp(`including ${a.name} and`))
    }
  })
})
