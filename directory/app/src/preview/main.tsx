// Static preview: renders the real page views with the fictional sample data, every link pointing
// at another preview page. Not used on the live site.
import '../styles.css'
import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import { setLinkMode } from '../directory/links'
import { SiteChrome } from '../shell/SiteChrome'
import { sampleRepo as db } from '../directory/repo.sample'
import { AreaView, InstallerView, ServiceAreaView, StateHubView } from '../directory/views'
import { PortalApp } from '../portal/components/PortalApp'
import { ApplyView } from '../apply/ApplyView'

setLinkMode('static')

async function page(): Promise<{ title: string; view: ReactNode }> {
  const { page: kind = 'hub', slug = '' } = document.body.dataset
  if (kind === 'service-area') {
    const areas = await db.allAreas()
    const states = [...new Set(areas.map((a) => a.stateSlug))].map((s) => ({ slug: s, areas: areas.filter((a) => a.stateSlug === s) }))
    return { title: 'Service Area', view: <ServiceAreaView states={states} sample /> }
  }
  if (kind === 'area') {
    const area = (await db.area(slug))!
    const installers = await db.installersInArea(slug)
    const rateCards = await db.rateCards(installers.map((i) => i.slug))
    const preset = new URLSearchParams(location.search).get('installer') ?? undefined
    return { title: `Bathroom Partitions in ${area.name}`, view: <AreaView area={area} installers={installers} rateCards={rateCards} preset={preset} sample /> }
  }
  if (kind === 'apply') return { title: 'Get Listed as an Installer', view: <ApplyView /> }
  if (kind === 'installer') {
    const installer = (await db.installer(slug))!
    const area = (await db.area(installer.areas[0]))!
    const [rateCards, reviews] = await Promise.all([db.rateCards([slug]), db.reviews(slug)])
    return { title: installer.displayName, view: <InstallerView area={area} installer={installer} rateCards={rateCards} reviews={reviews} sample /> }
  }
  const areas = await db.areasInState('texas')
  const counts = await Promise.all(areas.map(async (a) => {
    const list = await db.installersInArea(a.slug)
    return { slug: a.slug, installers: list.length, installs: list.reduce((n, i) => n + i.installs, 0) }
  }))
  return { title: 'Bathroom Partition Installers in Texas', view: <StateHubView state="texas" areas={areas} counts={counts} sample /> }
}

// The portal has its own header and runs on the in-memory sample (no Supabase keys in the preview build).
if (document.body.dataset.page === 'portal') {
  document.title = 'Installer portal'
  createRoot(document.getElementById('root')!).render(<PortalApp />)
} else page().then(({ title, view }) => {
  document.title = title
  createRoot(document.getElementById('root')!).render(
    <>
      <div className="bg-brand-red text-brand-red-foreground text-sm text-center px-4 py-2">Clickable preview of the installer directory. Every link works; "Continue to full quote" opens the configurator prototype.</div>
      <SiteChrome logoSrc="img/logo.png">{view}</SiteChrome>
    </>,
  )
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView())
})
