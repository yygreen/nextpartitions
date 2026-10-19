import { createFileRoute } from '@tanstack/react-router'
import { getStateHub } from '@/directory/server'
import { breadcrumbLd, pageHead } from '@/directory/seo'
import { StartConfigure, MobileConfigureBar } from '@/directory/components/StartConfigure'
import { Breadcrumbs, Disclaimer, SampleBanner } from '@/directory/components/ui'

export const Route = createFileRoute('/service-area/texas')({
  loader: () => getStateHub({ data: { state: 'texas' } }),
  head: ({ loaderData }) => pageHead({
    title: 'Bathroom Partition Installers in Texas | Next Partitions',
    description: 'Buy commercial toilet partitions and get them installed by approved, insured installers across Texas. Instant partitions price and installation estimate.',
    path: '/service-area/texas/',
    sample: loaderData?.sample ?? true,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Service Area', path: '/service-area/' }, { name: 'Texas', path: '/service-area/texas/' }])],
  }),
  component: TexasHub,
})

function TexasHub() {
  const { areas, counts, sample } = Route.useLoaderData()
  const total = counts.reduce((n, c) => n + c.installers, 0)
  return (
    <>
      <SampleBanner show={sample} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Service Area', href: '/service-area/' }, { label: 'Texas' }]} />
        <header className="grid gap-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight max-w-[20ch]">Bathroom Partition Installers in Texas</h1>
          <p className="text-lg text-muted-foreground max-w-[62ch]">
            Price your toilet partitions with us, and we match the job with approved, insured installers in {areas.length} Texas areas.
            You deal with one team from quote to installed restroom.
          </p>
          <p className="text-sm text-muted-foreground">{total} approved installers · Texas has no statewide contractor license, so we check city or state business registration.</p>
        </header>
        <StartConfigure />
        <section aria-labelledby="areas" className="grid gap-4">
          <h2 id="areas" className="text-2xl font-extrabold tracking-tight">Or browse installers by area</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areas.map((a) => {
              const c = counts.find((x) => x.slug === a.slug)!
              return (
                <li key={a.slug} className="bg-card border border-border rounded-lg p-4 grid gap-2">
                  <h3 className="font-bold text-lg"><a href={`/service-area/${a.slug}/`} className="hover:underline">{a.name}</a></h3>
                  <p className="text-sm text-muted-foreground">{c.installers} installer{c.installers === 1 ? '' : 's'} · {c.installs} installs · serves {a.cities.slice(0, 4).join(', ')}{a.cities.length > 4 ? '…' : ''}</p>
                  <a href={`/service-area/${a.slug}/`} className="text-sm font-semibold text-primary hover:underline">View {a.shortName} installers</a>
                </li>
              )
            })}
          </ul>
          <p className="text-sm">Job outside these areas? <a className="text-primary font-semibold hover:underline" href="https://nextpartitions.com/get-a-quote?src=installer_directory&area=texas-other">Configure your partitions</a> and we'll find installation options for your site.</p>
        </section>
        <Disclaimer />
      </main>
      <MobileConfigureBar />
    </>
  )
}
