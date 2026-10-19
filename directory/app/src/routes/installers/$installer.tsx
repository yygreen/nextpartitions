import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getInstallerProfile } from '@/directory/server'
import { breadcrumbLd, pageHead, SITE } from '@/directory/seo'
import { EstimateWidget } from '@/directory/components/EstimateWidget'
import { StartConfigure, MobileConfigureBar } from '@/directory/components/StartConfigure'
import { Breadcrumbs, Disclaimer, SampleBanner, Stars } from '@/directory/components/ui'
import { labelsFor, MATERIAL_LABEL, MOUNTING_LABEL } from '@/directory/types'

// /installers/[slug]/?area=dallas — area picks the breadcrumb when an installer serves several areas.
export const Route = createFileRoute('/installers/$installer')({
  validateSearch: z.object({ area: z.string().optional() }),
  loaderDeps: ({ search }) => ({ area: search.area }),
  loader: ({ params, deps }) => getInstallerProfile({ data: { installer: params.installer, area: deps.area } }),
  head: ({ loaderData: d }) => d ? pageHead({
    title: `${d.installer.displayName}: Partition Installer in ${d.installer.baseCity}, ${d.installer.baseState} | Next Partitions`,
    description: `${d.installer.displayName} installs commercial toilet partitions in ${d.area.name}. Approved by Next Partitions: ${d.installer.checks.map((c) => c.label.toLowerCase()).join(', ')}.`,
    path: `/installers/${d.installer.slug}/`,
    sample: d.sample,
    jsonLd: [
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: d.area.name, path: `/service-area/${d.area.slug}/` }, { name: d.installer.displayName, path: `/installers/${d.installer.slug}/` }]),
      {
        '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', name: d.installer.displayName,
        url: `${SITE}/installers/${d.installer.slug}/`, telephone: d.installer.trackedPhone ?? undefined,
        address: { '@type': 'PostalAddress', addressLocality: d.installer.baseCity, addressRegion: d.installer.baseState, addressCountry: 'US' },
        areaServed: d.area.cities.map((c) => ({ '@type': 'City', name: c })),
        // Ratings only from real, published reviews (never in sample mode).
        ...(!d.sample && d.installer.rating !== null && d.installer.reviewCount > 0
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: d.installer.rating, reviewCount: d.installer.reviewCount } }
          : {}),
      },
    ],
  }) : {},
  component: Profile,
})

function Profile() {
  const { area, installer: i, rateCards, reviews, sample } = Route.useLoaderData()
  return (
    <>
      <SampleBanner show={sample} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: area.name, href: `/service-area/${area.slug}/` }, { label: i.displayName }]} />
        <div className="grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
          <div className="grid gap-8 min-w-0">
            <header className="grid gap-2">
              <div className="flex flex-wrap gap-2">
                {labelsFor(i).map((l) => <span key={l} className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-accent text-primary">{l === 'Approved' ? '✓ ' : ''}{l}</span>)}
              </div>
              <h1 className="text-4xl font-black tracking-tight">{i.displayName}</h1>
              <p className="text-muted-foreground">
                {i.rating !== null && <><Stars rating={i.rating} /> <b className="text-foreground">{i.rating}</b> from {i.reviewCount} reviews · </>}
                {i.installs} installs for Next Partitions customers · based in {i.baseCity}, works up to {i.serviceRadiusMi} mi
              </p>
              {i.about && <p className="max-w-[65ch]">{i.about}</p>}
            </header>
            <StartConfigure area={area.slug} installer={{ slug: i.slug, name: i.displayName }} />
            <section aria-labelledby="installs" className="grid gap-2">
              <h2 id="installs" className="text-xl font-bold">What they install</h2>
              <p className="text-sm"><b>Materials:</b> {i.materials.map((m) => MATERIAL_LABEL[m]).join(', ')}</p>
              <p className="text-sm"><b>Mounting:</b> {i.mountings.map((m) => MOUNTING_LABEL[m]).join(', ')}</p>
            </section>
            <EstimateWidget cards={rateCards} single />
            <section aria-labelledby="reviews" className="grid gap-3">
              <h2 id="reviews" className="text-xl font-bold">Reviews from Next Partitions customers</h2>
              {reviews.length === 0
                ? <p className="text-muted-foreground">No reviews yet. Only customers with a completed job can review.</p>
                : reviews.map((r, n) => (
                  <figure key={n} className="bg-card border border-border rounded-lg p-4">
                    <Stars rating={r.rating} />
                    {r.body && <blockquote className="mt-1">{r.body}</blockquote>}
                    <figcaption className="text-sm text-muted-foreground mt-1">{r.reviewerDisplay} · {r.publishedAt}</figcaption>
                  </figure>
                ))}
            </section>
          </div>
          <aside className="grid gap-4 lg:sticky lg:top-6">
            <section aria-labelledby="checked" className="bg-card border border-border rounded-lg p-4">
              <h2 id="checked" className="font-bold mb-2">What we checked</h2>
              <ul className="grid gap-2 text-sm">
                {i.checks.map((c) => <li key={c.label}>✓ {c.label} <span className="text-muted-foreground">· {c.verified}</span></li>)}
                {i.medianReplyHours !== null && <li>Usually replies within {Math.ceil(i.medianReplyHours)} hours</li>}
              </ul>
            </section>
            {i.trackedPhone && (
              <p className="text-sm text-muted-foreground px-1">Prefer to call? <a href={`tel:${i.trackedPhone.replace(/\D/g, '')}`} className="text-primary font-semibold">{i.trackedPhone}</a></p>
            )}
          </aside>
        </div>
        <Disclaimer />
      </main>
      <MobileConfigureBar area={area.slug} installer={i.slug} />
    </>
  )
}
