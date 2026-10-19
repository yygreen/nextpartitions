import { createFileRoute } from '@tanstack/react-router'
import { getAreaDirectory } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { AreaInstallers } from '@/directory/components/AreaInstallers'
import { StartConfigure, MobileConfigureBar } from '@/directory/components/StartConfigure'
import { Breadcrumbs, SampleBanner } from '@/directory/components/ui'

// Standalone version of a city page. On the live site, the existing /service-area/[city]/ buyer page
// renders <StartConfigure/> near the top and <AreaInstallers/> as a section further down.
export const Route = createFileRoute('/service-area/$area')({
  loader: ({ params }) => getAreaDirectory({ data: { area: params.area } }),
  head: ({ loaderData: d }) => d ? pageHead({
    title: `Bathroom Partitions in ${d.area.name}: Buy + Installation | Next Partitions`,
    description: `Commercial toilet partitions delivered to ${d.area.name}, with ${d.installers.length} approved local installers. Instant partitions price and installation estimate.`,
    path: `/service-area/${d.area.slug}/`,
    sample: d.sample,
    jsonLd: [breadcrumbLd([
      { name: 'Home', path: '/' }, { name: 'Service Area', path: '/service-area/' },
      { name: d.area.state === 'TX' ? 'Texas' : d.area.state, path: `/service-area/${d.area.stateSlug}/` },
      { name: d.area.name, path: `/service-area/${d.area.slug}/` },
    ])],
  }) : {},
  component: AreaPage,
})

function AreaPage() {
  const { area, installers, rateCards, sample } = Route.useLoaderData()
  return (
    <>
      <SampleBanner show={sample} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Service Area', href: '/service-area/' }, { label: 'Texas', href: `/service-area/${area.stateSlug}/` }, { label: area.name }]} />
        <header className="grid gap-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight max-w-[22ch]">Bathroom Partitions in {area.name}</h1>
          <p className="text-lg text-muted-foreground max-w-[62ch]">
            Commercial toilet partitions shipped to {area.name}, installed by approved local installers. Price both in one place.
          </p>
        </header>
        <StartConfigure area={area.slug} areaName={area.shortName} />
        <AreaInstallers area={area} installers={installers} rateCards={rateCards} />
      </main>
      <MobileConfigureBar area={area.slug} />
    </>
  )
}
