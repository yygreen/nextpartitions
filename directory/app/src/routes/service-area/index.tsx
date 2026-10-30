import { createFileRoute } from '@tanstack/react-router'
import { getServiceArea } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { ServiceAreaView } from '@/directory/views'

export const Route = createFileRoute('/service-area/')({
  loader: () => getServiceArea(),
  head: ({ loaderData }) => pageHead({
    title: 'Service Area: Partitions Shipped Nationwide, Installed Locally | Next Partitions',
    description: 'Commercial bathroom partitions shipped to all 50 states, with approved local installers in growing areas.',
    path: '/service-area/', sample: loaderData?.sample ?? true,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Service Area', path: '/service-area/' }])],
  }),
  component: () => <ServiceAreaView {...Route.useLoaderData()} />,
})
