import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getInstallerProfile } from '@/directory/server'
import { breadcrumbLd, pageHead, SITE } from '@/directory/seo'
import { InstallerView } from '@/directory/views'

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
  component: () => <InstallerView {...Route.useLoaderData()} />,
})
