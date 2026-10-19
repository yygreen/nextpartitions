import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getAreaDirectory } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { AreaView } from '@/directory/views'

// On the live site, the existing /service-area/[city]/ page can render <ConfigureStart/> near the top
// and <AreaInstallers/> below it instead of using this route.
export const Route = createFileRoute('/service-area/$area')({
  validateSearch: z.object({ installer: z.string().optional() }),
  loader: ({ params }) => getAreaDirectory({ data: { area: params.area } }),
  head: ({ loaderData: d }) => d ? pageHead({
    title: `Bathroom Partitions in ${d.area.name}: Buy + Installation | Next Partitions`,
    description: `Commercial toilet partitions delivered to ${d.area.name}, with approved local installers. Instant partitions price and installation estimate.`,
    path: `/service-area/${d.area.slug}/`, sample: d.sample,
    jsonLd: [breadcrumbLd([
      { name: 'Home', path: '/' }, { name: 'Service Area', path: '/service-area/' },
      { name: 'Texas', path: `/service-area/${d.area.stateSlug}/` }, { name: d.area.name, path: `/service-area/${d.area.slug}/` },
    ])],
  }) : {},
  component: () => <AreaView {...Route.useLoaderData()} preset={Route.useSearch().installer} />,
})
