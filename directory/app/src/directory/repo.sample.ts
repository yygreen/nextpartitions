import type { DirectoryRepo } from './repo'
import type { Area, Installer, RateCard, Review, StateInfo } from './types'

// FICTIONAL sample data for development and previews. Never shown when Supabase is configured.
export const SAMPLE_NOTICE = 'Sample data: all installers, ratings, reviews and prices are fictional.'

// City centres for the coverage maps (approximate, for orientation only).
const DFW_PLACES = [
  { name: 'Dallas', lat: 32.78, lng: -96.8 }, { name: 'Fort Worth', lat: 32.755, lng: -97.33 }, { name: 'Arlington', lat: 32.735, lng: -97.11 },
  { name: 'Plano', lat: 33.02, lng: -96.7 }, { name: 'Irving', lat: 32.81, lng: -96.95 }, { name: 'Garland', lat: 32.91, lng: -96.64 },
  { name: 'Frisco', lat: 33.15, lng: -96.82 }, { name: 'McKinney', lat: 33.2, lng: -96.62 }, { name: 'Denton', lat: 33.215, lng: -97.13 },
  { name: 'Grand Prairie', lat: 32.7, lng: -97.0 }, { name: 'Mansfield', lat: 32.56, lng: -97.14 }, { name: 'Lewisville', lat: 33.05, lng: -96.99 },
  { name: 'Carrollton', lat: 32.98, lng: -96.89 }, { name: 'North Richland Hills', lat: 32.86, lng: -97.22 }, { name: 'Flower Mound', lat: 33.03, lng: -97.08 },
  { name: 'Weatherford', lat: 32.76, lng: -97.8 }, { name: 'Waxahachie', lat: 32.39, lng: -96.85 }, { name: 'Rockwall', lat: 32.93, lng: -96.46 },
]
const pick = (...names: string[]) => DFW_PLACES.filter((p) => names.includes(p.name))

const AREAS: Area[] = [
  { slug: 'dallas', name: 'Dallas', shortName: 'Dallas', state: 'TX', stateSlug: 'texas',
    center: { lat: 32.7936, lng: -96.7662 },
    cities: ['Dallas', 'Plano', 'Irving', 'Garland', 'Frisco', 'McKinney', 'Grand Prairie', 'Carrollton', 'Lewisville'], published: true,
    places: pick('Dallas', 'Plano', 'Irving', 'Garland', 'Frisco', 'McKinney', 'Grand Prairie', 'Carrollton', 'Lewisville', 'Arlington', 'Fort Worth', 'Rockwall', 'Waxahachie', 'Denton'),
    local: { note: 'Contractors register with the City of Dallas in DallasNow before pulling building permits; permits are not issued to unregistered contractors.', authority: 'City of Dallas Development Services', sourceUrl: 'https://dallascityhall.com/departments/sustainabledevelopment/guide', checked: '2026-11-03', code: null } },
  { slug: 'fort-worth', name: 'Fort Worth', shortName: 'Fort Worth', state: 'TX', stateSlug: 'texas',
    center: { lat: 32.7555, lng: -97.3308 },
    cities: ['Fort Worth', 'Arlington', 'Mansfield', 'North Richland Hills', 'Flower Mound', 'Denton'], published: true,
    places: pick('Fort Worth', 'Arlington', 'Mansfield', 'North Richland Hills', 'Flower Mound', 'Denton', 'Weatherford', 'Grand Prairie', 'Irving', 'Dallas'),
    local: { note: 'Fort Worth requires anyone pulling a building permit to hold a valid contractor registration on file with Development Services; trade work also needs the matching Texas state license.', authority: 'Fort Worth Development Services', sourceUrl: 'https://www.fortworthtexas.gov/departments/development-services/permits/contractor-registration', checked: '2026-11-03', code: null } },
  { slug: 'houston', name: 'Houston', shortName: 'Houston', state: 'TX', stateSlug: 'texas',
    center: { lat: 29.76, lng: -95.37 }, cities: ['Houston', 'Pasadena', 'Sugar Land', 'The Woodlands', 'Katy'], published: true, local: null },
  { slug: 'san-antonio', name: 'San Antonio', shortName: 'San Antonio', state: 'TX', stateSlug: 'texas',
    center: { lat: 29.42, lng: -98.49 }, cities: ['San Antonio', 'New Braunfels', 'Schertz'], published: true, local: null },
]

const TEXAS: StateInfo = {
  slug: 'texas', licenseStatus: 'no_state_license',
  licenseSummary: "Texas has no statewide contractor license for partition installation. Cities such as Dallas require contractors to register before they pull permits, so we check city or state business registration.",
  licenseAuthority: 'Texas Department of Licensing and Regulation', licenseSourceUrl: 'https://www.tdlr.texas.gov/', licenseChecked: '2026-10-14',
  licenseLaw: 'No statewide contractor licensing statute', licenseLawUrl: null,
}

const checks = (city: string) => [
  { label: 'Insurance on file ($1M general liability)', verified: '2026-10-12' },
  { label: city === 'Dallas' ? 'City of Dallas contractor registration' : city === 'Fort Worth' ? 'City of Fort Worth contractor registration' : 'Texas business registration', verified: '2026-10-12' },
  { label: '2 references contacted', verified: '2026-10-13' },
  { label: 'Signed listing agreement', verified: '2026-10-14' },
]

const INSTALLERS: Installer[] = [
  { slug: 'acme', displayName: 'Acme Installations', baseCity: 'Dallas', baseState: 'TX', lat: 32.78, lng: -96.8,
    serviceRadiusMi: 45, materials: ['hdpe', 'phenolic', 'stainless'], mountings: ['overhead_braced', 'floor_mounted', 'ceiling_hung'],
    about: 'Labor-only Division 10 crew installing toilet partitions and accessories in offices, schools and retail across DFW.',
    photoUrl: null, trackedPhone: '(214) 555-0142', approvedAt: '2026-10-14', areas: ['dallas'],
    installs: 14, rating: 4.9, reviewCount: 11, medianReplyHours: 3.5, checks: checks('Dallas') },
  { slug: 'northwind', displayName: 'Northwind Washroom', baseCity: 'Fort Worth', baseState: 'TX', lat: 32.75, lng: -97.33,
    serviceRadiusMi: 40, materials: ['hdpe', 'phenolic', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'],
    about: 'Two-person crew focused on gyms, churches and schools in Tarrant County.',
    photoUrl: null, trackedPhone: '(817) 555-0188', approvedAt: '2026-10-15', areas: ['fort-worth'],
    installs: 6, rating: 4.7, reviewCount: 5, medianReplyHours: 6, checks: checks('Fort Worth') },
  { slug: 'contoso', displayName: 'Contoso Specialty', baseCity: 'Arlington', baseState: 'TX', lat: 32.74, lng: -97.11,
    serviceRadiusMi: 35, materials: ['powder_coated', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'],
    about: 'Retail and tenant-improvement specialists; night and weekend installs available.',
    photoUrl: null, trackedPhone: '(682) 555-0123', approvedAt: '2026-10-16', areas: ['dallas', 'fort-worth'],
    installs: 0, rating: null, reviewCount: 0, medianReplyHours: 9, checks: checks('Arlington') },
  { slug: 'gulfline', displayName: 'Gulfline Interiors', baseCity: 'Houston', baseState: 'TX', lat: 29.76, lng: -95.37,
    serviceRadiusMi: 50, materials: ['hdpe', 'phenolic', 'powder_coated'], mountings: ['overhead_braced', 'floor_mounted'],
    about: 'Commercial specialties installer serving greater Houston.',
    photoUrl: null, trackedPhone: '(713) 555-0170', approvedAt: '2026-10-16', areas: ['houston'],
    installs: 2, rating: null, reviewCount: 0, medianReplyHours: 5, checks: checks('Houston') },
]

const card = (slug: string, material: RateCard['material'], mounting: RateCard['mounting'], low: number, high: number): RateCard => ({
  slug, material, mounting, perStallLowCents: low * 100, perStallHighCents: high * 100, minimumCents: 60000,
  extras: { demoPerStallCents: 4000, adaStallCents: 7500 },
})

const RATES: RateCard[] = [
  card('acme', 'hdpe', 'overhead_braced', 240, 300), card('acme', 'phenolic', 'overhead_braced', 260, 320),
  card('acme', 'stainless', 'floor_mounted', 300, 380), card('acme', 'hdpe', 'ceiling_hung', 320, 400),
  card('northwind', 'hdpe', 'overhead_braced', 220, 290), card('northwind', 'phenolic', 'overhead_braced', 250, 310),
  card('northwind', 'laminate', 'floor_mounted', 210, 270),
  card('contoso', 'powder_coated', 'overhead_braced', 190, 250), card('contoso', 'laminate', 'overhead_braced', 200, 260),
  card('gulfline', 'hdpe', 'overhead_braced', 230, 300), card('gulfline', 'powder_coated', 'overhead_braced', 200, 260),
]

const REVIEWS: Review[] = [
  { slug: 'acme', rating: 5, body: 'Six HDPE stalls in a day, floor protected and everything level. Coordination through Next Partitions was easy.',
    reviewerDisplay: 'Facilities manager, Plano', publishedAt: '2026-09-30' },
  { slug: 'acme', rating: 5, body: 'Showed up the day after delivery as promised.', reviewerDisplay: 'Office manager, Irving', publishedAt: '2026-09-12' },
  { slug: 'northwind', rating: 4, body: 'Good work, one door needed a second visit to adjust.', reviewerDisplay: 'Church administrator, Fort Worth', publishedAt: '2026-09-21' },
]

export const sampleRepo: DirectoryRepo = {
  async allAreas() { return AREAS },
  async areasInState(stateSlug) { return AREAS.filter((a) => a.stateSlug === stateSlug) },
  async area(slug) { return AREAS.find((a) => a.slug === slug) ?? null },
  async stateInfo(stateSlug) { return stateSlug === 'texas' ? TEXAS : null },
  async installersInArea(areaSlug) { return INSTALLERS.filter((i) => i.areas.includes(areaSlug)) },
  async installer(slug) { return INSTALLERS.find((i) => i.slug === slug) ?? null },
  async rateCards(slugs) { return RATES.filter((r) => slugs.includes(r.slug)) },
  async reviews(slug) { return REVIEWS.filter((r) => r.slug === slug) },
}
