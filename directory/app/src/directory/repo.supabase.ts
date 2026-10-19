import { createClient } from '@supabase/supabase-js'
import type { DirectoryRepo } from './repo'
import type { Area, Installer, RateCard, Review } from './types'

// Reads only the public views and dir_areas, with the publishable (anon) key.
// Row-level security means this key can never reach jobs, contacts or documents.
export function supabaseRepo(url: string, key: string): DirectoryRepo {
  const db = createClient(url, key, { auth: { persistSession: false } })

  const toArea = (r: any): Area => ({
    slug: r.slug, name: r.name, shortName: r.short_name, state: r.state, stateSlug: r.state_slug,
    center: { lat: r.center_lat, lng: r.center_lng }, cities: r.cities ?? [],
  })
  const toInstaller = (r: any): Installer => ({
    slug: r.slug, displayName: r.display_name, baseCity: r.base_city, baseState: r.base_state,
    lat: r.lat, lng: r.lng, serviceRadiusMi: r.service_radius_mi, materials: r.materials ?? [],
    mountings: r.mountings ?? [], about: r.about, photoUrl: r.photo_url, trackedPhone: r.tracked_phone,
    approvedAt: r.approved_at, areas: r.areas ?? [], installs: Number(r.installs ?? 0),
    rating: r.rating === null ? null : Number(r.rating), reviewCount: Number(r.review_count ?? 0),
    medianReplyHours: r.median_reply_hours === null ? null : Number(r.median_reply_hours),
    checks: r.checks ?? [],
  })
  const toCard = (r: any): RateCard => ({
    slug: r.slug, material: r.material, mounting: r.mounting,
    perStallLowCents: r.per_stall_low_cents, perStallHighCents: r.per_stall_high_cents,
    minimumCents: r.minimum_cents,
    extras: { demoPerStallCents: r.extras?.demo_per_stall_cents, adaStallCents: r.extras?.ada_stall_cents },
  })
  const must = <T,>({ data, error }: { data: T | null; error: unknown }): T => {
    if (error) throw error
    return data as T
  }

  return {
    async areasInState(stateSlug) {
      return must(await db.from('dir_areas').select('*').eq('state_slug', stateSlug).order('name')).map(toArea)
    },
    async area(slug) {
      const r = must(await db.from('dir_areas').select('*').eq('slug', slug).maybeSingle())
      return r ? toArea(r) : null
    },
    async installersInArea(areaSlug) {
      return must(await db.from('dir_public_installers').select('*').contains('areas', [areaSlug])).map(toInstaller)
    },
    async installer(slug) {
      const r = must(await db.from('dir_public_installers').select('*').eq('slug', slug).maybeSingle())
      return r ? toInstaller(r) : null
    },
    async rateCards(slugs) {
      if (slugs.length === 0) return []
      return must(await db.from('dir_public_rate_cards').select('*').in('slug', slugs)).map(toCard)
    },
    async reviews(slug) {
      return must(
        await db.from('dir_public_reviews').select('*').eq('slug', slug).order('published_at', { ascending: false }),
      ).map((r: any): Review => ({
        slug: r.slug, rating: r.rating, body: r.body, reviewerDisplay: r.reviewer_display, publishedAt: r.published_at,
      }))
    },
  }
}
