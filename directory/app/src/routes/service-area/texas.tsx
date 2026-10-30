import { createFileRoute } from '@tanstack/react-router'
import { getStateHub } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { StateHubView } from '@/directory/views'

export const Route = createFileRoute('/service-area/texas')({
  loader: () => getStateHub({ data: { state: 'texas' } }),
  head: ({ loaderData }) => pageHead({
    title: 'Bathroom Partition Installers in Texas | Next Partitions',
    description: 'Buy commercial toilet partitions and get them installed by approved, insured installers across Texas. Instant partitions price and installation estimate.',
    path: '/service-area/texas/', sample: loaderData?.sample ?? true,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Service Area', path: '/service-area/' }, { name: 'Texas', path: '/service-area/texas/' }])],
  }),
  component: () => <StateHubView {...Route.useLoaderData()} />,
})
