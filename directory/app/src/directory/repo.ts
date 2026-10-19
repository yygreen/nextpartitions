import type { Area, Installer, RateCard, Review } from './types'

// Read-only access to the public directory. Two implementations: Supabase (live) and sample data.
export interface DirectoryRepo {
  areasInState(stateSlug: string): Promise<Area[]>
  area(slug: string): Promise<Area | null>
  installersInArea(areaSlug: string): Promise<Installer[]>
  installer(slug: string): Promise<Installer | null>
  rateCards(slugs: string[]): Promise<RateCard[]>
  reviews(slug: string): Promise<Review[]>
}
