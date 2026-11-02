import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getAreaDirectory, getStateHub } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { isStateSlug, stateName } from '@/directory/states'
import { AreaView, StateHubView } from '@/directory/views'

// /service-area/<slug>/ is a state hub (/service-area/texas/) or an area page (/service-area/dallas/), the live
// site's URL pattern. State slugs never equal city slugs (see states.ts). On the live site, the existing
// /service-area/[city]/ page can render <ConfigureStart/> near the top and <AreaInstallers/> below it instead.
export const Route = createFileRoute('/service-area/$area')({
  validateSearch: z.object({ installer: z.string().optional() }),
  loader: async ({ params }) => isStateSlug(params.area)
    ? { kind: 'state' as const, ...(await getStateHub({ data: { state: params.area } })) }
    : { kind: 'area' as const, ...(await getAreaDirectory({ data: { area: params.area } })) },
  head: ({ loaderData: d }) => {
    if (!d) return {}
    const crumbs = [{ name: 'Home', path: '/' }, { name: 'Service Area', path: '/service-area/' }]
    if (d.kind === 'state') {
      const name = d.state.name
      return pageHead({
        title: `Bathroom Partitions and Installers in ${name} | Next Partitions`,
        description: `Commercial toilet partitions shipped anywhere in ${name}, with approved local installers and who may install partitions in ${name}. Instant partitions price.`,
        path: `/service-area/${d.state.slug}/`, sample: d.sample,
        jsonLd: [breadcrumbLd([...crumbs, { name, path: `/service-area/${d.state.slug}/` }])],
      })
    }
    return pageHead({
      title: `Bathroom Partitions in ${d.area.name}: Buy + Installation | Next Partitions`,
      description: `Commercial toilet partitions delivered to ${d.area.name}, with approved local installers. Instant partitions price and installation estimate.`,
      path: `/service-area/${d.area.slug}/`, sample: d.sample || d.unpublished,
      jsonLd: [breadcrumbLd([...crumbs,
        { name: stateName(d.area.stateSlug, d.area.state), path: `/service-area/${d.area.stateSlug}/` }, { name: d.area.name, path: `/service-area/${d.area.slug}/` }])],
    })
  },
  component: AreaOrState,
})

function AreaOrState() {
  const d = Route.useLoaderData()
  const preset = Route.useSearch().installer
  return d.kind === 'state' ? <StateHubView {...d} /> : <AreaView {...d} preset={preset} />
}
