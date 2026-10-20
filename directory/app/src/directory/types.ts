// Shapes of the public views in supabase/migrations. Only public, approved data.

export type Material = 'powder_coated' | 'hdpe' | 'phenolic' | 'laminate' | 'stainless'
export type Mounting = 'overhead_braced' | 'floor_mounted' | 'ceiling_hung' | 'floor_to_ceiling'

export const MATERIAL_LABEL: Record<Material, string> = {
  powder_coated: 'Powder coated steel',
  hdpe: 'Solid plastic (HDPE)',
  phenolic: 'Phenolic',
  laminate: 'Plastic laminate',
  stainless: 'Stainless steel',
}

export const MOUNTING_LABEL: Record<Mounting, string> = {
  overhead_braced: 'Overhead braced',
  floor_mounted: 'Floor mounted',
  ceiling_hung: 'Ceiling hung',
  floor_to_ceiling: 'Floor to ceiling',
}

export interface Area {
  slug: string
  name: string
  shortName: string
  state: string
  stateSlug: string
  center: { lat: number; lng: number }
  cities: string[]
}

export interface Check {
  label: string
  verified: string // ISO date
}

export interface Installer {
  slug: string
  displayName: string
  baseCity: string
  baseState: string
  lat: number | null
  lng: number | null
  serviceRadiusMi: number
  materials: Material[]
  mountings: Mounting[]
  about: string | null
  photoUrl: string | null
  trackedPhone: string | null
  approvedAt: string
  areas: string[]
  installs: number
  rating: number | null
  reviewCount: number
  medianReplyHours: number | null
  checks: Check[]
}

export interface RateCard {
  slug: string
  material: Material
  mounting: Mounting
  perStallLowCents: number
  perStallHighCents: number
  minimumCents: number
  extras: { demoPerStallCents?: number; adaStallCents?: number }
}

export interface Review {
  slug: string
  rating: number
  body: string | null
  reviewerDisplay: string
  publishedAt: string
}

// Labels are earned facts (CLAUDE.md). Verified = passed our checks (insurance, registration, references,
// test job, listing agreement); Approved = also completed a job for a Next Partitions customer;
// Established = 10+ installs; Top rated = 4.8+ from 10+ reviews.
export const NEW_INSTALLER_NOTE = 'New to Next Partitions: no completed jobs with us yet'

export function labelsFor(i: Installer): string[] {
  const labels = [i.installs >= 1 ? 'Approved' : 'Verified']
  if (i.installs >= 10) labels.push('Established')
  if (i.rating !== null && i.rating >= 4.8 && i.reviewCount >= 10) labels.push('Top rated')
  return labels
}
