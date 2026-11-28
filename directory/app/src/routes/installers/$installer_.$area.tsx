import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { areaDescription } from '@/directory/copy'
import { getAreaDirectory } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { stateName } from '@/directory/states'
import { AreaView } from '@/directory/views'

// /installers/<state>/<city>/: a city's installer page (published once 3+ installers are listed). The first
// segment shares its name with the profile route's ($installer) so the two don't clash; here it's the state.
export const Route = createFileRoute('/installers/$installer_/$area')({
  validateSearch: z.object({ installer: z.string().optional() }),
  loader: ({ params }) => getAreaDirectory({ data: { area: params.area, state: params.installer } }),
  head: ({ loaderData: d }) => d ? pageHead({
    title: `Bathroom Partition Installers in ${d.area.name} | Next Partitions`,
    description: areaDescription(d.area),
    path: `/installers/${d.area.stateSlug}/${d.area.slug}/`, sample: d.sample || d.unpublished,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Installers', path: '/installers/' },
      { name: stateName(d.area.stateSlug, d.area.state), path: `/installers/${d.area.stateSlug}/` }, { name: d.area.name, path: `/installers/${d.area.stateSlug}/${d.area.slug}/` }])],
  }) : {},
  component: () => <AreaView {...Route.useLoaderData()} preset={Route.useSearch().installer} />,
})
