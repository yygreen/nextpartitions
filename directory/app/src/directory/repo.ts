import type { Area, Installer, RateCard, Review, StateInfo } from './types'

// Read-only access to the public directory. Two implementations: Supabase (live) and sample data.
export interface DirectoryRepo {
  allAreas(): Promise<Area[]>
  areasInState(stateSlug: string): Promise<Area[]>
  stateInfo(stateSlug: string): Promise<StateInfo | null>
  area(slug: string): Promise<Area | null>
  installersInArea(areaSlug: string): Promise<Installer[]>
  installer(slug: string): Promise<Installer | null>
  rateCards(slugs: string[]): Promise<RateCard[]>
  reviews(slug: string): Promise<Review[]>
}
