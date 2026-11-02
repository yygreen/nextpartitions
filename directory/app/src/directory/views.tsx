// Page bodies as plain components (data in, markup out). The routes render these on the live site;
// the static preview renders the same components with sample data.
import { areaHref, configuratorHref, homeHref, serviceAreaHref, stateHref } from './links'
import { AreaInstallers } from './components/AreaInstallers'
import { ConfigureStart } from './components/ConfigureStart'
import { MobileConfigureBar, StartConfigure } from './components/StartConfigure'
import { Breadcrumbs, Disclaimer, SampleBanner, Stars } from './components/ui'
import type { StateHubData, StateSummary } from './hub'
import { stateName } from './states'
import { type Area, type Installer, labelsFor, MATERIAL_LABEL, MOUNTING_LABEL, NEW_INSTALLER_NOTE, type RateCard, type Review } from './types'

const WRAP = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'

// Dark page header band, as on the live /service-area page.
export function Hero({ crumbs, title, lead, children }: { crumbs: { label: string; href?: string }[]; title: string; lead: string; children?: React.ReactNode }) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className={`${WRAP} py-10 md:py-12 grid gap-3`}>
        <Breadcrumbs items={crumbs} onDark />
        <h1 className="text-3xl md:text-4xl font-black mt-2 max-w-[24ch]">{title}</h1>
        <p className="text-lg text-primary-foreground/80 max-w-[62ch]">{lead}</p>
        {children}
      </div>
    </section>
  )
}

export function ServiceAreaView({ states, sample, showUnpublished }: { states: StateSummary[]; sample: boolean; showUnpublished?: boolean }) {
  return (
    <>
      <SampleBanner show={sample} />
      <Hero crumbs={[{ label: 'Home', href: homeHref() }, { label: 'Service Area' }]} title="Bathroom Partitions Shipped to All 50 States"
        lead="We ship commercial partitions to every state. Choose your state for local installers, the rules for who may install partitions there, and your partitions price." />
      <main className={`${WRAP} py-10 grid gap-10`}>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {states.map(({ state, live, upcoming }) => {
            const named = showUnpublished ? [...live, ...upcoming] : live
            return (
              <li key={state.slug} className="bg-card border border-border rounded-lg p-4 grid gap-1 content-start">
                <h2 className="text-lg font-bold"><a className="hover:underline" href={stateHref(state.slug)}>{state.name}</a></h2>
                <p className="text-sm text-muted-foreground">
                  {named.length ? `Installers in ${named.map((a) => a.name).join(', ')}` : upcoming.length ? `Installers coming soon in ${upcoming.map((a) => a.name).join(', ')}` : 'Partitions shipped statewide'}
                </p>
              </li>
            )
          })}
        </ul>
        <StartConfigure />
      </main>
    </>
  )
}

const LICENSE_HEADLINE: Record<NonNullable<NonNullable<StateHubData['info']>['licenseStatus']>, string> = {
  license_required: 'A state license is required',
  above_threshold: 'A state license is required above a job size',
  registration_only: 'State registration is required',
  no_state_license: 'No statewide license',
  unclear: 'State rules still being confirmed',
}

// Who may install partitions in this state: plain language, with the source, the date it was checked and
// the authority to confirm with (content principles in CLAUDE.md). Never implies a permit is needed to buy.
function StateRules({ name, info }: { name: string; info: StateHubData['info'] }) {
  return (
    <section aria-labelledby="rules" className="bg-card border border-border rounded-lg p-5 grid gap-2">
      <h2 id="rules" className="text-xl font-bold">Who may install partitions in {name}</h2>
      {info?.licenseSummary ? (
        <>
          {info.licenseStatus && <p className="font-semibold">{LICENSE_HEADLINE[info.licenseStatus]}</p>}
          <p>{info.licenseSummary}</p>
          {info.licenseLaw && <p className="text-sm"><b>Law:</b> {info.licenseLawUrl ? <a className="underline" href={info.licenseLawUrl} rel="nofollow noopener" target="_blank">{info.licenseLaw}</a> : info.licenseLaw}</p>}
          <p className="text-sm text-muted-foreground">
            {info.licenseSourceUrl && <><a className="underline" href={info.licenseSourceUrl} rel="nofollow noopener" target="_blank">Source</a> · </>}
            {info.licenseChecked && <>Last checked {info.licenseChecked} · </>}
            Confirm with {info.licenseAuthority ?? `the ${name} contractor licensing authority`}. Cities and school districts may add their own registration rules. You don't need a permit to buy partitions.
          </p>
        </>
      ) : (
        <p>Buying partitions doesn't need a permit. Installers may need a state or city contractor license or registration; we check this for every installer we list.</p>
      )}
      <p className="text-sm">We check every listed installer's insurance, registration and references.</p>
    </section>
  )
}

export function StateHubView({ state, info, areas, counts, sample, showUnpublished }: StateHubData & { sample: boolean; showUnpublished?: boolean }) {
  const total = counts.reduce((n, c) => n + c.installers, 0)
  const live = areas.filter((a) => a.published || showUnpublished)
  const upcoming = areas.filter((a) => !a.published && !showUnpublished)
  const first = live[0]
  return (
    <>
      <SampleBanner show={sample} />
      <Hero crumbs={[{ label: 'Home', href: homeHref() }, { label: 'Service Area', href: serviceAreaHref() }, { label: state.name }]}
        title={`Bathroom Partitions and Installers in ${state.name}`}
        lead={live.length
          ? `Price your toilet partitions with us, and we match the job with approved, insured installers in ${live.length} ${state.name} area${live.length === 1 ? '' : 's'}. You deal with one team from quote to installed restroom.`
          : `We ship commercial toilet partitions anywhere in ${state.name}. Price your partitions now; we're adding approved local installers area by area.`}>
        {total > 0 && <p className="text-sm text-primary-foreground/70">{total} verified installer{total === 1 ? '' : 's'} in {state.name}</p>}
      </Hero>
      <main className={`${WRAP} py-10 grid gap-10`}>
        {live.length > 0 && (
          <section aria-labelledby="areas" className="grid gap-4">
            <h2 id="areas" className="text-2xl font-extrabold tracking-tight">Choose your area to price partitions and installation</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {live.map((a) => {
                const c = counts.find((x) => x.slug === a.slug)
                return (
                  <li key={a.slug} className="bg-card border border-border rounded-lg p-4 grid gap-2">
                    <h3 className="font-bold text-lg"><a href={areaHref(a.slug)} className="hover:underline">{a.name}</a>{!a.published && <span className="ml-2 text-xs font-semibold text-muted-foreground">(not published)</span>}</h3>
                    <p className="text-sm text-muted-foreground">{c?.installers ? `${c.installers} installer${c.installers === 1 ? '' : 's'} · ${c.installs} installs` : 'Installers coming soon'} · serves {a.cities.slice(0, 4).join(', ')}{a.cities.length > 4 ? '…' : ''}</p>
                    <a href={areaHref(a.slug) + '#configure'} className="text-sm font-semibold text-brand-red hover:underline">Price your {a.shortName} restroom</a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {upcoming.length > 0 && (
          <section aria-labelledby="upcoming" className="grid gap-2">
            <h2 id="upcoming" className="text-xl font-bold">Installers coming soon</h2>
            <p className="text-muted-foreground">We're lining up approved installers in {upcoming.map((a) => a.name).join(', ')}. Partitions ship there now.</p>
          </section>
        )}
        <StateRules name={state.name} info={info} />
        <StartConfigure />
        <Disclaimer />
      </main>
      <MobileConfigureBar href={first ? areaHref(first.slug) + '#configure' : configuratorHref({ from: 'hub' })} />
    </>
  )
}

// One line of context: the city or county rule for installers, with source, date and who to confirm with.
function LocalRules({ area }: { area: Area }) {
  const state = stateName(area.stateSlug, area.state)
  return (
    <section aria-labelledby="local" className="grid gap-1 text-sm">
      <h2 id="local" className="text-base font-bold">Installer rules in {area.shortName}</h2>
      {area.local && <p>{area.local.note}</p>}
      {area.local?.code && <p><b>Code:</b> {area.local.code}</p>}
      <p className="text-muted-foreground">
        {area.local?.sourceUrl && <><a className="underline" href={area.local.sourceUrl} rel="nofollow noopener" target="_blank">Source</a> · </>}
        {area.local?.checked && <>Last checked {area.local.checked} · </>}
        {area.local?.authority && <>Confirm with {area.local.authority}. </>}
        State rules: <a className="underline" href={stateHref(area.stateSlug)}>{state}</a>. You don't need a permit to buy partitions.
      </p>
    </section>
  )
}

export function AreaView({ area, installers, rateCards, preset, sample, unpublished }: {
  area: Area; installers: Installer[]; rateCards: RateCard[]; preset?: string; sample: boolean; unpublished?: boolean
}) {
  return (
    <>
      <SampleBanner show={sample} />
      {unpublished && <div className="bg-surface-warm border-b border-border text-sm text-center px-4 py-2">Staging preview: this area isn't published yet (it goes live once 3 installers are listed). Not indexed.</div>}
      <Hero crumbs={[{ label: 'Home', href: homeHref() }, { label: 'Service Area', href: serviceAreaHref() }, { label: stateName(area.stateSlug, area.state), href: stateHref(area.stateSlug) }, { label: area.name }]}
        title={`Bathroom Partitions in ${area.name}`}
        lead={`Commercial toilet partitions shipped to ${area.name}, installed by approved local installers. Price both in one place, then choose your installer.`} />
      <main className={`${WRAP} py-10 grid gap-10`}>
        <ConfigureStart areaSlug={area.slug} areaName={area.shortName} installers={installers} rateCards={rateCards} preset={preset} from="directory" />
        <AreaInstallers area={area} installers={installers} />
        <LocalRules area={area} />
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
      <Hero crumbs={[{ label: 'Home', href: homeHref() }, { label: stateName(area.stateSlug, area.state), href: stateHref(area.stateSlug) }, { label: area.name, href: areaHref(area.slug) }, { label: i.displayName }]}
        title={i.displayName}
        lead={`${i.installs ? `${i.installs} installs for Next Partitions customers` : NEW_INSTALLER_NOTE} · based in ${i.baseCity}, works up to ${i.serviceRadiusMi} mi`}>
        <div className="flex flex-wrap items-center gap-2">
          {labelsFor(i).map((l) => <span key={l} className="text-xs font-semibold px-2.5 py-0.5 border border-brand-red/60 bg-brand-red/20 text-primary-foreground">{l === 'Approved' || l === 'Verified' ? '✓ ' : ''}{l}</span>)}
          {i.rating !== null && <span className="text-sm text-primary-foreground/80"><Stars rating={i.rating} /> <b className="text-primary-foreground">{i.rating}</b> from {i.reviewCount} reviews</span>}
        </div>
      </Hero>
      <main className={`${WRAP} py-10 grid gap-10`}>
        <div className="grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
          <div className="grid gap-8 min-w-0">
            {i.about && <p className="max-w-[65ch] text-lg">{i.about}</p>}
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
            <p className="text-sm px-1"><a className="text-brand-red font-semibold hover:underline" href={areaHref(area.slug)}>See all {area.shortName} installers</a></p>
            {i.trackedPhone && (
              <p className="text-sm text-muted-foreground px-1">Prefer to call? <a href={`tel:${i.trackedPhone.replace(/\D/g, '')}`} className="text-brand-red font-semibold">{i.trackedPhone}</a></p>
            )}
          </aside>
        </div>
        <Disclaimer />
      </main>
      <MobileConfigureBar href="#configure" />
    </>
  )
}

