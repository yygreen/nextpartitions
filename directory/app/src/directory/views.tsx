// Page bodies as plain components (data in, markup out). The routes render these on the live site;
// the static preview renders the same components with sample data.
import { areaHref, homeHref, serviceAreaHref, stateHref } from './links'
import { AreaInstallers } from './components/AreaInstallers'
import { ConfigureStart } from './components/ConfigureStart'
import { MobileConfigureBar, StartConfigure } from './components/StartConfigure'
import { Breadcrumbs, Disclaimer, SampleBanner, Stars } from './components/ui'
import { type Area, type Installer, labelsFor, MATERIAL_LABEL, MOUNTING_LABEL, type RateCard, type Review } from './types'

const STATE_NAME: Record<string, string> = { texas: 'Texas' }

export function ServiceAreaView({ states, sample }: { states: { slug: string; areas: Area[] }[]; sample: boolean }) {
  return (
    <>
      <SampleBanner show={sample} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8">
        <Breadcrumbs items={[{ label: 'Home', href: homeHref() }, { label: 'Service Area' }]} />
        <header className="grid gap-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Service area</h1>
          <p className="text-lg text-muted-foreground max-w-[62ch]">We ship commercial partitions to all 50 states. In these areas, approved local installers can install them too.</p>
        </header>
        <ul className="grid sm:grid-cols-2 gap-3">
          {states.map((s) => (
            <li key={s.slug} className="bg-card border border-border rounded-lg p-4 grid gap-1">
              <h2 className="text-xl font-bold"><a className="hover:underline" href={stateHref(s.slug)}>{STATE_NAME[s.slug] ?? s.slug}</a></h2>
              <p className="text-sm text-muted-foreground">Installers in {s.areas.map((a) => a.name).join(', ')}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}

export function StateHubView({ state, areas, counts, sample }: {
  state: string; areas: Area[]; counts: { slug: string; installers: number; installs: number }[]; sample: boolean
}) {
  const total = counts.reduce((n, c) => n + c.installers, 0)
  const name = STATE_NAME[state] ?? state
  return (
    <>
      <SampleBanner show={sample} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8">
        <Breadcrumbs items={[{ label: 'Home', href: homeHref() }, { label: 'Service Area', href: serviceAreaHref() }, { label: name }]} />
        <header className="grid gap-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight max-w-[20ch]">Bathroom Partition Installers in {name}</h1>
          <p className="text-lg text-muted-foreground max-w-[62ch]">
            Price your toilet partitions with us, and we match the job with approved, insured installers in {areas.length} {name} areas.
            You deal with one team from quote to installed restroom.
          </p>
          <p className="text-sm text-muted-foreground">{total} approved installers · Texas has no statewide contractor license, so we check city or state business registration.</p>
        </header>
        <section aria-labelledby="areas" className="grid gap-4">
          <h2 id="areas" className="text-2xl font-extrabold tracking-tight">Choose your area to price partitions and installation</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areas.map((a) => {
              const c = counts.find((x) => x.slug === a.slug)!
              return (
                <li key={a.slug} className="bg-card border border-border rounded-lg p-4 grid gap-2">
                  <h3 className="font-bold text-lg"><a href={areaHref(a.slug)} className="hover:underline">{a.name}</a></h3>
                  <p className="text-sm text-muted-foreground">{c.installers ? `${c.installers} installer${c.installers === 1 ? '' : 's'} · ${c.installs} installs` : 'Installers coming soon'} · serves {a.cities.slice(0, 4).join(', ')}{a.cities.length > 4 ? '…' : ''}</p>
                  <a href={areaHref(a.slug) + '#configure'} className="text-sm font-semibold text-primary hover:underline">Price a {a.shortName} restroom</a>
                </li>
              )
            })}
          </ul>
        </section>
        <StartConfigure />
        <Disclaimer />
      </main>
      <MobileConfigureBar href={areaHref(areas[0]?.slug ?? '') + '#configure'} />
    </>
  )
}

export function AreaView({ area, installers, rateCards, preset, sample }: {
  area: Area; installers: Installer[]; rateCards: RateCard[]; preset?: string; sample: boolean
}) {
  return (
    <>
      <SampleBanner show={sample} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8">
        <Breadcrumbs items={[{ label: 'Home', href: homeHref() }, { label: 'Service Area', href: serviceAreaHref() }, { label: STATE_NAME[area.stateSlug] ?? area.state, href: stateHref(area.stateSlug) }, { label: area.name }]} />
        <header className="grid gap-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight max-w-[22ch]">Bathroom Partitions in {area.name}</h1>
          <p className="text-lg text-muted-foreground max-w-[62ch]">
            Commercial toilet partitions shipped to {area.name}, installed by approved local installers. Price both in one place, then choose your installer.
          </p>
        </header>
        <ConfigureStart areaSlug={area.slug} areaName={area.shortName} installers={installers} rateCards={rateCards} preset={preset} from="directory" />
        <AreaInstallers area={area} installers={installers} />
      </main>
      <MobileConfigureBar href="#configure" />
    </>
  )
}

export function InstallerView({ area, installer: i, rateCards, reviews, sample }: {
  area: Area; installer: Installer; rateCards: RateCard[]; reviews: Review[]; sample: boolean
}) {
  return (
    <>
      <SampleBanner show={sample} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8">
        <Breadcrumbs items={[{ label: 'Home', href: homeHref() }, { label: STATE_NAME[area.stateSlug] ?? area.state, href: stateHref(area.stateSlug) }, { label: area.name, href: areaHref(area.slug) }, { label: i.displayName }]} />
        <div className="grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
          <div className="grid gap-8 min-w-0">
            <header className="grid gap-2">
              <div className="flex flex-wrap gap-2">
                {labelsFor(i).map((l) => <span key={l} className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-accent text-primary">{l === 'Approved' ? '✓ ' : ''}{l}</span>)}
              </div>
              <h1 className="text-4xl font-black tracking-tight">{i.displayName}</h1>
              <p className="text-muted-foreground">
                {i.rating !== null && <><Stars rating={i.rating} /> <b className="text-foreground">{i.rating}</b> from {i.reviewCount} reviews · </>}
                {i.installs} installs for Next Partitions customers · based in {i.baseCity}, works up to {i.serviceRadiusMi} mi
              </p>
              {i.about && <p className="max-w-[65ch]">{i.about}</p>}
            </header>
            <ConfigureStart areaSlug={area.slug} areaName={area.shortName} installers={[i]} rateCards={rateCards} preset={i.slug} lockPreset from="profile" />
            <section aria-labelledby="installs" className="grid gap-2">
              <h2 id="installs" className="text-xl font-bold">What they install</h2>
              <p className="text-sm"><b>Materials:</b> {i.materials.map((m) => MATERIAL_LABEL[m]).join(', ')}</p>
              <p className="text-sm"><b>Mounting:</b> {i.mountings.map((m) => MOUNTING_LABEL[m]).join(', ')}</p>
            </section>
            <section aria-labelledby="reviews" className="grid gap-3">
              <h2 id="reviews" className="text-xl font-bold">Reviews from Next Partitions customers</h2>
              {reviews.length === 0
                ? <p className="text-muted-foreground">No reviews yet. Only customers with a completed job can review.</p>
                : reviews.map((r, n) => (
                  <figure key={n} className="bg-card border border-border rounded-lg p-4">
                    <Stars rating={r.rating} />
                    {r.body && <blockquote className="mt-1">{r.body}</blockquote>}
                    <figcaption className="text-sm text-muted-foreground mt-1">{r.reviewerDisplay} · {r.publishedAt}</figcaption>
                  </figure>
                ))}
            </section>
          </div>
          <aside className="grid gap-4 lg:sticky lg:top-6">
            <section aria-labelledby="checked" className="bg-card border border-border rounded-lg p-4">
              <h2 id="checked" className="font-bold mb-2">What we checked</h2>
              <ul className="grid gap-2 text-sm">
                {i.checks.map((c) => <li key={c.label}>✓ {c.label} <span className="text-muted-foreground">· {c.verified}</span></li>)}
                {i.medianReplyHours !== null && <li>Usually replies within {Math.ceil(i.medianReplyHours)} hours</li>}
              </ul>
            </section>
            <p className="text-sm px-1"><a className="text-primary font-semibold hover:underline" href={areaHref(area.slug)}>See all {area.shortName} installers</a></p>
            {i.trackedPhone && (
              <p className="text-sm text-muted-foreground px-1">Prefer to call? <a href={`tel:${i.trackedPhone.replace(/\D/g, '')}`} className="text-primary font-semibold">{i.trackedPhone}</a></p>
            )}
          </aside>
        </div>
        <Disclaimer />
      </main>
      <MobileConfigureBar href="#configure" />
    </>
  )
}

