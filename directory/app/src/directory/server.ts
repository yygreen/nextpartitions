import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import type { DirectoryRepo } from './repo'
import { sampleRepo } from './repo.sample'
import { supabaseRepo } from './repo.supabase'
import { serviceAreaData, stateHubData } from './hub'

// Server-side only. Uses Supabase when configured, otherwise the fictional sample data.
function repo(): { db: DirectoryRepo; sample: boolean } {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  return url && key ? { db: supabaseRepo(url, key), sample: false } : { db: sampleRepo, sample: true }
}

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60)

// Staging only: render unpublished area pages (marked noindex) so the whole directory can be reviewed.
const showUnpublished = () => process.env.DIRECTORY_PREVIEW_UNPUBLISHED === '1'

export const getServiceArea = createServerFn({ method: 'GET' }).handler(async () => {
  const { db, sample } = repo()
  return { states: await serviceAreaData(db), sample, showUnpublished: showUnpublished() }
})

export const getStateHub = createServerFn({ method: 'GET' })
  .validator((d: unknown) => z.object({ state: slug }).parse(d))
  .handler(async ({ data }) => {
    const { db, sample } = repo()
    const hub = await stateHubData(db, data.state)
    if (!hub) throw notFound()
    return { ...hub, sample, showUnpublished: showUnpublished() }
  })

export const getAreaDirectory = createServerFn({ method: 'GET' })
  .validator((d: unknown) => z.object({ area: slug }).parse(d))
  .handler(async ({ data }) => {
    const { db, sample } = repo()
    const area = await db.area(data.area)
    if (!area || (!area.published && !showUnpublished())) throw notFound()
    const installers = await db.installersInArea(area.slug)
    const rateCards = await db.rateCards(installers.map((i) => i.slug))
    return { area, installers, rateCards, sample, unpublished: !area.published }
  })

export const getInstallerProfile = createServerFn({ method: 'GET' })
  .validator((d: unknown) => z.object({ installer: slug, area: slug.optional() }).parse(d))
  .handler(async ({ data }) => {
    const { db, sample } = repo()
    const installer = await db.installer(data.installer)
    if (!installer || installer.areas.length === 0) throw notFound()
    // Shown under a published area (the one asked for if it's theirs); unpublished areas only in staging preview.
    const areas = (await Promise.all(installer.areas.map((a) => db.area(a)))).filter((a): a is NonNullable<typeof a> => !!a && (a.published || showUnpublished()))
    const area = areas.find((a) => a.slug === data.area) ?? areas.find((a) => a.published) ?? areas[0]
    if (!area) throw notFound()
    const [rateCards, reviews] = await Promise.all([db.rateCards([installer.slug]), db.reviews(installer.slug)])
    return { area, installer, rateCards, reviews, sample }
  })
