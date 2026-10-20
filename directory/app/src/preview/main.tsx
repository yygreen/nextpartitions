// Clickable prototype: the real pages (directory, application, quote, installer portal, coordination) as one
// page with routes after the # ('#/area/dallas'), running on the fictional sample data. Because it's one page,
// what you do in one place shows up in the others: price a job as Acme, show the prices as the coordinator,
// choose an installer as the customer. The homepage and configurator prototypes are separate pages next to it.
// Not used on the live site.
import '../styles.css'
import { createRoot } from 'react-dom/client'
import { type ReactNode, useEffect, useState } from 'react'
import { applyHref, areaHref, configuratorHref, installerHref, portalHref, quoteHref, serviceAreaHref, setLinkMode, stateHref } from '../directory/links'
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

// Always on top: jump between the parts of the prototype.
function Bar() {
  const links: [string, string][] = [
    ['Start', '#/'], ['Homepage idea', HOMEPAGE], ['Directory', stateHref('texas')], ['Configurator', CONFIGURATOR],
    ['Customer quote', quoteHref('sample-j1044')], ['Installer portal', portalHref('installer')], ['Coordinator', portalHref('coordinator')], ['Apply', applyHref()],
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
function Start() {
  const j = sampleStore.byToken('sample-j1048')
  const acme = sampleStore.installers.find((i) => i.slug === 'acme')
  const acmeInvite = j?.invites.find((i) => i.installerId === acme?.id)
  const loop: [boolean, ReactNode][] = [
    [!!acmeInvite?.priceCents, <>As <b>Acme</b>, open job NP-DFW-1048 (Plano) and send a firm price. <a className="underline" href={portalHref('installer')}>Installer portal</a></>],
    [!!j && j.job.status !== 'quoting' && j.job.status !== 'new', <>As the <b>job coordinator</b>, open NP-DFW-1048 and click "Show prices on the customer's quote". The job panel has the customer's quote link. <a className="underline" href={portalHref('coordinator')}>Coordinator</a></>],
    [!!j?.job.chosenInstallerId, <>As the <b>customer</b>, approve the drawings, choose an installer and say how you'll pay. <a className="underline" href={quoteHref('sample-j1048')}>Pat Lee's quote</a></>],
    [!!(j?.job.partitionsPaidAt || j?.job.poAcceptedAt), <>As the <b>coordinator</b>, the job is flagged with the payment method: click "Purchase order accepted" (or "Partitions order paid"). <a className="underline" href={portalHref('coordinator')}>Coordinator</a></>],
    [!!j?.job.installDate, <>As <b>Acme</b> (if chosen), the customer's details are now in the job: set the install date. <a className="underline" href={portalHref('installer')}>Installer portal</a></>],
  ]
  const journey = (title: string, who: string, steps: [string, string][]) => (
    <section className="bg-card border border-border p-5 grid gap-3 content-start">
      <h2 className="text-xl">{title}</h2>
      <p className="text-sm text-muted-foreground">{who}</p>
      <ol className="grid gap-2 text-sm list-decimal pl-5">{steps.map(([l, h]) => <li key={l}><a className="underline hover:text-brand-red" href={h}>{l}</a></li>)}</ol>
    </section>
  )
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-3xl md:text-4xl font-black">Next Partitions: clickable prototype</h1>
        <p className="text-muted-foreground max-w-[70ch]">The installer directory, the customer's quote, the installer portal and job coordination, built from the real code and running on fictional sample data. Everything is linked, and what you do in one part shows up in the others while this tab is open.</p>
      </header>
      <section className="bg-surface-warm border border-border p-5 grid gap-3">
        <h2 className="text-xl">Try the whole loop: one job from price to install</h2>
        <ol className="grid gap-2 text-sm">
          {loop.map(([done, text], n) => (
            <li key={n} className="flex gap-3 items-start">
              <span className={`size-6 shrink-0 grid place-items-center border-2 font-bold ${done ? 'border-emerald-700 text-emerald-800' : 'border-border text-muted-foreground'}`}>{done ? '✓' : n + 1}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>
      <div className="grid md:grid-cols-3 gap-4">
        {journey('Customer', 'Finds an installer, prices the restroom, gets a quote.', [
          ['Homepage idea (for Marc)', HOMEPAGE], ['Texas installer hub', stateHref('texas')], ['Dallas–Fort Worth area page', areaHref('dallas')],
          ['Installer profile (Approved)', installerHref('acme')], ['Installer profile (Verified, new)', installerHref('contoso')],
          ['Price with Acme', `${areaHref('dallas')}?installer=acme#configure`], ['Configurator installation step', CONFIGURATOR],
          ['Quote with two installer prices', quoteHref('sample-j1044')], ['Service area (all states)', serviceAreaHref()],
        ])}
        {journey('Installer', 'Applies, gets checked, then prices and installs jobs.', [
          ['Apply to get listed', applyHref()], ['Portal: job requests', portalHref('installer')],
          ['A released job: customer details, install date', portalHref('installer')], ['Rates, profile and documents (tabs in the portal)', portalHref('installer')],
        ])}
        {journey('Job coordinator (Next Partitions)', 'Vets installers, runs each job, follows up payment.', [
          ['Jobs needing attention', portalHref('coordinator')], ['Vetting: list Metroplex as Verified', portalHref('coordinator')],
          ['New job entered by hand (New job tab)', portalHref('coordinator')], ['Documents to check (Documents tab)', portalHref('coordinator')],
        ])}
      </div>
      <p className="text-sm text-muted-foreground">All installers, customers, prices and reviews are fictional samples. Nothing is sent or paid. Use "Reset sample data" in the bar to start over. Links to the live nextpartitions.com product pages open the real site.</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
