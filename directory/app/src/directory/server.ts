import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import type { DirectoryRepo } from './repo'
import { sampleRepo } from './repo.sample'
import { supabaseRepo } from './repo.supabase'

// Server-side only. Uses Supabase when configured, otherwise the fictional sample data.
function repo(): { db: DirectoryRepo; sample: boolean } {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  return url && key ? { db: supabaseRepo(url, key), sample: false } : { db: sampleRepo, sample: true }
}

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60)

export const getStateHub = createServerFn({ method: 'GET' })
  .validator((d: unknown) => z.object({ state: slug }).parse(d))
  .handler(async ({ data }) => {
    const { db, sample } = repo()
    const areas = await db.areasInState(data.state)
    if (areas.length === 0) throw notFound()
    const counts = await Promise.all(areas.map(async (a) => {
      const list = await db.installersInArea(a.slug)
      return { slug: a.slug, installers: list.length, installs: list.reduce((n, i) => n + i.installs, 0) }
    }))
    return { areas, counts, sample }
  })

export const getAreaDirectory = createServerFn({ method: 'GET' })
  .validator((d: unknown) => z.object({ area: slug }).parse(d))
  .handler(async ({ data }) => {
    const { db, sample } = repo()
    const area = await db.area(data.area)
    if (!area) throw notFound()
    const installers = await db.installersInArea(area.slug)
    const rateCards = await db.rateCards(installers.map((i) => i.slug))
    return { area, installers, rateCards, sample }
  })

export const getInstallerProfile = createServerFn({ method: 'GET' })
  .validator((d: unknown) => z.object({ installer: slug, area: slug.optional() }).parse(d))
  .handler(async ({ data }) => {
    const { db, sample } = repo()
    const installer = await db.installer(data.installer)
    if (!installer || installer.areas.length === 0) throw notFound()
    const areaSlug = data.area && installer.areas.includes(data.area) ? data.area : installer.areas[0]
    const area = await db.area(areaSlug)
    if (!area) throw notFound()
    const [rateCards, reviews] = await Promise.all([db.rateCards([installer.slug]), db.reviews(installer.slug)])
    return { area, installer, rateCards, reviews, sample }
  })
