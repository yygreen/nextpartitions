import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getInstallerProfile, getStateHub } from '@/directory/server'
import { breadcrumbLd, pageHead, SITE } from '@/directory/seo'
import { isStateSlug } from '@/directory/states'
import { InstallerView, StateHubView } from '@/directory/views'
import { labelsFor } from '@/directory/types'

// /installers/<slug>/ is a state's installer hub (/installers/texas/) or an installer profile (/installers/acme/;
// ?area=dallas picks the breadcrumb when an installer serves several areas). Installer slugs never take a
// state's slug (dir_reserved_slug in the database).
export const Route = createFileRoute('/installers/$installer')({
  validateSearch: z.object({ area: z.string().optional() }),
  loaderDeps: ({ search }) => ({ area: search.area }),
  loader: async ({ params, deps }) => isStateSlug(params.installer)
    ? { kind: 'state' as const, ...(await getStateHub({ data: { state: params.installer } })) }
    : { kind: 'profile' as const, ...(await getInstallerProfile({ data: { installer: params.installer, area: deps.area } })) },
  head: ({ loaderData: d }) => !d ? {} : d.kind === 'state' ? pageHead({
    title: `Bathroom Partition Installers in ${d.state.name} | Next Partitions`,
    description: `Checked, insured installers in ${d.state.name} for commercial toilet partitions bought from Next Partitions, and who may install partitions in ${d.state.name}.`,
    path: `/installers/${d.state.slug}/`, sample: d.sample,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Installers', path: '/installers/' }, { name: d.state.name, path: `/installers/${d.state.slug}/` }])],
  }) : pageHead({
    title: `${d.installer.displayName}: Partition Installer in ${d.installer.baseCity}, ${d.installer.baseState} | Next Partitions`,
    description: `${d.installer.displayName} installs commercial toilet partitions in ${d.area.name}. ${labelsFor(d.installer)[0]} by Next Partitions: ${d.installer.checks.map((c) => c.label.toLowerCase()).join(', ')}.`,
    path: `/installers/${d.installer.slug}/`,
    sample: d.sample || !d.area.published,
    jsonLd: [
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Installers', path: '/installers/' }, { name: d.area.name, path: `/installers/${d.area.stateSlug}/${d.area.slug}/` }, { name: d.installer.displayName, path: `/installers/${d.installer.slug}/` }]),
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
  }),
  component: StateOrProfile,
})

function StateOrProfile() {
  const d = Route.useLoaderData()
  return d.kind === 'state' ? <StateHubView {...d} /> : <InstallerView {...d} />
}
