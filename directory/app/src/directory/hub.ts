import type { DirectoryRepo } from './repo'
import { STATES, stateBySlug, type UsState } from './states'
import type { Area, StateInfo } from './types'

// Data for the service-area index and the state hubs, shared by the server functions and the static preview.
export interface AreaCount { slug: string; installers: number; installs: number }
export interface StateHubData { state: UsState; info: StateInfo | null; areas: Area[]; counts: AreaCount[] }
export interface StateSummary { state: UsState; live: Area[]; upcoming: Area[] }

// Unpublished areas are listed by name ("installers coming soon") but only get a link when showUnpublished
// is on (staging review), so the public site never links to an empty page.
export async function stateHubData(db: DirectoryRepo, slug: string): Promise<StateHubData | null> {
  const state = stateBySlug(slug)
  if (!state) return null
  const [areas, info] = await Promise.all([db.areasInState(slug), db.stateInfo(slug)])
  const counts = await Promise.all(areas.filter((a) => a.published).map(async (a) => {
    const list = await db.installersInArea(a.slug)
    return { slug: a.slug, installers: list.length, installs: list.reduce((n, i) => n + i.installs, 0) }
  }))
  return { state, info, areas, counts }
}

export async function serviceAreaData(db: DirectoryRepo): Promise<StateSummary[]> {
  const areas = await db.allAreas()
  return STATES.map((state) => {
    const mine = areas.filter((a) => a.stateSlug === state.slug)
    return { state, live: mine.filter((a) => a.published), upcoming: mine.filter((a) => !a.published) }
  })
}
