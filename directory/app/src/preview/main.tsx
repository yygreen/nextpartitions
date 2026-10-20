// Clickable prototype: the real pages (directory, application, quote, installer portal, coordination) as one
// page with routes after the # ('#/area/dallas'), running on the fictional sample data. Because it's one page,
// what you do in one place shows up in the others: price a job as Acme, show the prices as the coordinator,
// choose an installer as the customer. The homepage and configurator prototypes are separate pages next to it.
// Not used on the live site.
import '../styles.css'
import { createRoot } from 'react-dom/client'
import { type ReactNode, useEffect, useState } from 'react'
import { applyHref, areaHref, configuratorHref, installerHref, portalHref, quoteHref, setLinkMode, stateHref } from '../directory/links'
import { SiteChrome } from '../shell/SiteChrome'
import { sampleRepo as db } from '../directory/repo.sample'
import { AreaView, InstallerView, ServiceAreaView, StateHubView } from '../directory/views'
import { PortalApp } from '../portal/components/PortalApp'
import { resetSample, sampleStore, saveSample, setSampleRole } from '../portal/repo.sample'
import { ApplyView } from '../apply/ApplyView'
import { QuoteView } from '../quote/QuoteView'

setLinkMode('static')

const HOMEPAGE = 'homepage.html'
const CONFIGURATOR = configuratorHref({ area: 'dallas', from: 'directory' })

// '#/area/dallas?installer=acme#configure' -> path, query, in-page anchor
function parse(hash: string) {
  const [route = '', anchor = ''] = hash.replace(/^#/, '').split('#')
  const [path, query = ''] = route.split('?')
  return { path: path.replace(/\/+$/, '') || '/', query: new URLSearchParams(query), anchor }
}

async function page(path: string, query: URLSearchParams): Promise<{ title: string; view: ReactNode; chrome: boolean }> {
  const [, kind = '', slug = ''] = path.split('/')
  if (path === '/') return { title: 'Next Partitions prototype', view: <Start />, chrome: false }
  if (kind === 'service-area') {
    const areas = await db.allAreas()
    const states = [...new Set(areas.map((a) => a.stateSlug))].map((s) => ({ slug: s, areas: areas.filter((a) => a.stateSlug === s) }))
    return { title: 'Service Area', view: <ServiceAreaView states={states} sample />, chrome: true }
  }
  if (kind === 'state') {
    const areas = await db.areasInState(slug || 'texas')
    const counts = await Promise.all(areas.map(async (a) => {
      const list = await db.installersInArea(a.slug)
      return { slug: a.slug, installers: list.length, installs: list.reduce((n, i) => n + i.installs, 0) }
    }))
    return { title: 'Bathroom Partition Installers in Texas', view: <StateHubView state={slug || 'texas'} areas={areas} counts={counts} sample />, chrome: true }
  }
  if (kind === 'area') {
    const area = await db.area(slug)
    if (area) {
      const installers = await db.installersInArea(slug)
      const rateCards = await db.rateCards(installers.map((i) => i.slug))
      return { title: `Bathroom Partitions in ${area.name}`, view: <AreaView area={area} installers={installers} rateCards={rateCards} preset={query.get('installer') ?? undefined} sample />, chrome: true }
    }
  }
  if (kind === 'installer') {
    const installer = await db.installer(slug)
    if (installer) {
      const area = (await db.area(installer.areas[0]))!
      const [rateCards, reviews] = await Promise.all([db.rateCards([slug]), db.reviews(slug)])
      return { title: installer.displayName, view: <InstallerView area={area} installer={installer} rateCards={rateCards} reviews={reviews} sample />, chrome: true }
    }
  }
  if (kind === 'apply') return { title: 'Get Listed as an Installer', view: <ApplyView />, chrome: true }
  if (kind === 'quote') return { title: 'Your Partitions Quote', view: <QuoteView token={slug} />, chrome: true }
  if (kind === 'portal') {
    setSampleRole(slug === 'coordinator' ? 'coordinator' : 'installer')
    return { title: slug === 'coordinator' ? 'Job coordination' : 'Installer portal', view: <PortalApp />, chrome: false }
  }
  return {
    title: 'Not found', chrome: true,
    view: <main className="max-w-3xl mx-auto px-4 py-16"><h1 className="text-3xl">Page not in the prototype</h1><p className="mt-3"><a className="underline" href="#/">Back to the start page</a></p></main>,
  }
}

function App() {
  const [hash, setHash] = useState(location.hash)
  const [shown, setShown] = useState<{ key: string; view: ReactNode; chrome: boolean } | null>(null)
  useEffect(() => {
    const on = () => setHash(location.hash)
    window.addEventListener('hashchange', on)
    // In-page anchors ('#configure', '#apply') scroll instead of changing the route.
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="#"]')
      const href = a?.getAttribute('href') ?? ''
      if (!a || href.startsWith('#/') || href === '#') return
      e.preventDefault()
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    }
    document.addEventListener('click', click)
    return () => { window.removeEventListener('hashchange', on); document.removeEventListener('click', click) }
  }, [])
  useEffect(() => {
    const { path, query, anchor } = parse(hash)
    let live = true
    saveSample()
    page(path, query).then(({ title, view, chrome }) => {
      if (!live) return
      document.title = `${title} · Prototype`
      setShown({ key: path + '?' + query.toString(), view, chrome })
      requestAnimationFrame(() => {
        const el = anchor && document.getElementById(anchor)
        if (el) el.scrollIntoView()
        else window.scrollTo(0, 0)
      })
    })
    return () => { live = false }
  }, [hash])
  if (!shown) return <Bar />
  return (
    <>
      <Bar />
      <div key={shown.key}>{shown.chrome ? <SiteChrome logoSrc="img/logo.png">{shown.view}</SiteChrome> : shown.view}</div>
    </>
  )
}

// Always on top: the parts of the prototype in the order a job happens.
function Bar() {
  const links: [string, string][] = [
    ['Start', '#/'], ['Homepage idea', HOMEPAGE], ['Find an installer', areaHref('dallas')], ['Configurator', CONFIGURATOR],
    ["Installer's view", portalHref('installer')], ["Your team's view", portalHref('coordinator')], ["Customer's quote", quoteHref('sample-j1048')],
    ['Installer sign-up', applyHref()],
  ]
  return (
    <nav aria-label="Prototype" className="bg-neutral-950 text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
        <b className="uppercase tracking-wider text-white/60">Prototype</b>
        {links.map(([l, h]) => <a key={l} href={h} className="hover:underline">{l}</a>)}
        <button type="button" className="ml-auto text-white/60 hover:text-white underline" onClick={() => { resetSample(); location.hash = '#/'; location.reload() }}>Reset sample data</button>
      </div>
    </nav>
  )
}

// ---------- start page ----------
// Written for Abe: his business in the order things happen, one job from first visit to installed restroom.
type Link = [label: string, href: string]
function Start() {
  const j = sampleStore.byToken('sample-j1048')
  const acme = sampleStore.installers.find((i) => i.slug === 'acme')
  const priced = !!j?.invites.find((i) => i.installerId === acme?.id)?.priceCents
  const shown = !!j && !['new', 'routed', 'quoting'].includes(j.job.status)
  const chosen = !!j?.job.chosenInstallerId
  const paid = !!(j?.job.partitionsPaidAt || j?.job.poAcceptedAt)
  const scheduled = !!j?.job.installDate

  const steps: { done?: boolean; title: string; who: string; text: ReactNode; links: Link[] }[] = [
    { title: 'A customer finds you', who: 'Customer',
      text: 'Someone searches "toilet partition installers Dallas". They land on the area page, which starts with pricing the partitions and then shows checked local installers.',
      links: [['Homepage idea (for Marc)', HOMEPAGE], ['Texas hub', stateHref('texas')], ['Dallas–Fort Worth page', areaHref('dallas')], ['Installer profile', installerHref('acme')]] },
    { title: 'They price the restroom and ask for a quote', who: 'Customer',
      text: <>They pick material, mounting and stalls, see partitions plus an installation estimate, and send the quote request. Pat Lee of Plano ISD has already done this: her request is job <b>NP-DFW-1048</b>.</>,
      links: [['Price your restroom', `${areaHref('dallas')}?installer=acme#configure`], ['Configurator step', CONFIGURATOR]] },
    { done: priced, title: 'Installers price the job', who: 'Installer',
      text: <>Up to 3 checked installers near the job get the drawings and scope, never the customer's name or number. Open NP-DFW-1048 as Acme and send a firm price.</>,
      links: [["Installer's view (Acme)", portalHref('installer')]] },
    { done: shown, title: 'Your team shows the prices to the customer', who: 'Your team',
      text: <>Your job coordinator sees every price, with any price more than 15% above the installer's own rates flagged. Open NP-DFW-1048 and click "Show prices on the customer's quote".</>,
      links: [["Your team's view", portalHref('coordinator')]] },
    { done: chosen && !!j?.quote.paymentMethod, title: 'The customer chooses an installer and pays you for the partitions', who: 'Customer',
      text: 'On their quote page they approve the drawings, pick an installer, and pay Next Partitions for the partitions (PO, card or bank transfer). Installation is billed by the installer, not by you.',
      links: [["Pat Lee's quote", quoteHref('sample-j1048')]] },
    { done: paid && scheduled, title: 'Payment releases the job; the installer schedules and installs', who: 'Your team, then installer',
      text: <>Your team marks the PO accepted. Only then does the installer get the customer's details and set the install date. Afterwards the customer is asked for a review.</>,
      links: [["Your team's view", portalHref('coordinator')], ["Installer's view", portalHref('installer')]] },
  ]

  const group = (title: string, intro: string, items: Link[]) => (
    <section className="bg-card border border-border p-5 grid gap-2 content-start">
      <h2 className="text-xl">{title}</h2>
      <p className="text-sm text-muted-foreground">{intro}</p>
      <ul className="grid gap-1.5 text-sm">{items.map(([l, h]) => <li key={l}><a className="underline hover:text-brand-red" href={h}>{l}</a></li>)}</ul>
    </section>
  )

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8">
      <header className="grid gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-red">Prototype for Abe Gold · Next Partitions</p>
        <h1 className="text-3xl md:text-4xl font-black">How the installer directory works</h1>
        <p className="text-lg max-w-[68ch]">The model is the one we went through on the call: you sell the partitions, and checked local installers quote and bill the installation directly. This is it built out, so you can see what your customers, the installers and your team each see on a real job.</p>
        <p className="text-sm text-muted-foreground max-w-[68ch]">Follow one job from first visit to installed restroom; each step ticks off as you do it. Sample data only, nothing is sent.</p>
      </header>

      <section aria-labelledby="job-h" className="grid gap-3">
        <h2 id="job-h" className="text-2xl">One job, start to finish</h2>
        <ol className="grid gap-3">
          {steps.map((s, n) => (
            <li key={s.title} className="bg-card border border-border p-4 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 gap-y-1">
              <span className={`size-8 grid place-items-center border-2 font-black ${s.done ? 'border-emerald-700 text-emerald-800 bg-emerald-50' : 'border-brand-red text-brand-red'}`} aria-label={s.done ? 'Done' : `Step ${n + 1}`}>{s.done ? '✓' : n + 1}</span>
              <div className="grid gap-1.5">
                <h3 className="text-lg leading-tight">{s.title} <span className="ml-1 align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.who}</span></h3>
                <p className="text-sm max-w-[75ch]">{s.text}</p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">{s.links.map(([l, h]) => <a key={l} className="text-brand-red hover:underline" href={h}>{l} →</a>)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        {group('Where installers come from', 'Installers apply in about 5 minutes. Your team checks insurance, registration and references and sends a timed test job. Pass, and they go live as Verified; their first completed job makes them Approved.', [
          ['The application form', applyHref()], ['Checking applicants (Vetting tab)', portalHref('coordinator')],
          ['A Verified installer, new to you', installerHref('contoso')], ['An Approved, Established installer', installerHref('acme')],
        ])}
        {group("Your team's daily work", 'One job coordinator runs the middle: jobs that need attention come first, then documents to check and jobs to enter by hand.', [
          ['Jobs needing attention (Jobs tab)', portalHref('coordinator')], ['Documents to check (Documents tab)', portalHref('coordinator')],
          ['Entering a job by hand (New job tab)', portalHref('coordinator')], ['A quote with two installer prices (Irving)', quoteHref('sample-j1044')],
        ])}
      </div>

      <section className="bg-surface-warm border border-border p-5 grid gap-2">
        <h2 className="text-xl">What we need from you</h2>
        <ul className="list-disc pl-5 grid gap-1 text-sm max-w-[75ch]">
          <li>Who will be the job coordinator (nobody holds the role yet).</li>
          <li>OK on the labels: Verified when listed, Approved after the first completed job.</li>
          <li>How customers pay for partitions: for now they choose PO, a card payment link or bank transfer and your team follows up. Paying by card on the quote page itself needs the site's payment provider (a question for Marc).</li>
          <li>Pilot area: Dallas–Fort Worth, unless your orders point elsewhere.</li>
        </ul>
      </section>
      <p className="text-sm text-muted-foreground">All installers, customers, prices and reviews are fictional samples. Your clicks stay in this browser tab; "Reset sample data" in the bar starts over. Product links go to the live nextpartitions.com.</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
