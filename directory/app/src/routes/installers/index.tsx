import { createFileRoute } from '@tanstack/react-router'
import { getServiceArea } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { ServiceAreaView } from '@/directory/views'

// /installers/: every state's installer hub. Kept apart from the main site's /service-area/[city]/ buy pages.
export const Route = createFileRoute('/installers/')({
  loader: () => getServiceArea(),
  head: ({ loaderData }) => pageHead({
    title: 'Bathroom Partition Installers by State | Next Partitions',
    description: 'Checked, insured installers for commercial toilet partitions bought from Next Partitions, and who may install partitions in each state.',
    path: '/installers/', sample: loaderData?.sample ?? true,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Installers', path: '/installers/' }])],
  }),
  component: () => <ServiceAreaView {...Route.useLoaderData()} />,
})
