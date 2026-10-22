import { createFileRoute } from '@tanstack/react-router'
import { sample } from '@/apply/api'
import { ApplyView } from '@/apply/ApplyView'
import { breadcrumbLd, pageHead } from '@/directory/seo'

// /installers/apply/: the installer application. The page renders on the server; the form sends from the browser.
export const Route = createFileRoute('/installers/apply')({
  head: () => pageHead({
    title: 'Get Listed as a Toilet Partition Installer in Dallas–Fort Worth | Next Partitions',
    description: 'Install toilet partitions for Next Partitions customers in Dallas–Fort Worth. No listing fee, no markup on your installation: price jobs from your own rates and keep your full fee.',
    path: '/installers/apply/',
    sample,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Installers', path: '/service-area/texas/' }, { name: 'Dallas–Fort Worth', path: '/service-area/dallas/' }, { name: 'Get listed', path: '/installers/apply/' }])],
  }),
  component: ApplyView,
})
