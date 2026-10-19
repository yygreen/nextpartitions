// Standalone only: a copy of the live nextpartitions.com header and footer so the standalone app and the
// preview look like the site. On merge, the live layout's own header and footer are used instead.
import type { ReactNode } from 'react'
import { configuratorHref, serviceAreaHref, stateHref } from '../directory/links'

const LIVE = 'https://nextpartitions.com'
const LOGO = `${LIVE}/__l5e/assets-v1/f0cc181a-5245-489b-b371-217b11a9cecc/next-icon.png`

const Chevron = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
)

export function SiteHeader({ logoSrc = LOGO }: { logoSrc?: string }) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-9 text-xs">
          <div className="flex items-center gap-4">
            <a href="mailto:sales@nextpartitions.com" className="hover:opacity-80"><span className="hidden sm:inline">sales@nextpartitions.com</span><span className="sm:hidden">Email</span></a>
            <a href="tel:1-833-997-7489" className="hover:opacity-80">1-833-997-7489</a>
          </div>
          <span className="hidden md:block">Authorized Distributor — All Major Brands</span>
        </div>
      </div>
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-6">
          <a href={LIVE} className="flex items-center gap-3">
            <img src={logoSrc} alt="" className="h-10 w-auto" />
            <span className="leading-tight"><b className="block text-lg font-semibold tracking-tight">Next Partitions</b><small className="hidden sm:block text-[10px] tracking-[0.12em] uppercase text-muted-foreground">Commercial Partitions</small></span>
          </a>
          <nav aria-label="Main" className="hidden lg:flex items-center gap-7 font-medium">
            {[['Partitions', '/partitions'], ['Mounting Styles', '/mounting-styles'], ['Hardware & Parts', '/hardware'], ['Resources', '/guides']].map(([l, h]) => (
              <a key={l} href={LIVE + h} className="flex items-center gap-1 hover:text-brand-red">{l}<Chevron /></a>
            ))}
          </nav>
          <a href={configuratorHref({ from: 'hub' })} className="bg-brand-red text-brand-red-foreground font-semibold text-sm px-3.5 py-2 hover:opacity-90">Get a Quote</a>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const col = (title: string, links: [string, string][]) => (
    <div>
      <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-white/60 mb-3" style={{ fontWeight: 600, letterSpacing: '0.12em' }}>{title}</h3>
      <ul className="grid gap-2 text-sm">{links.map(([l, h]) => <li key={l}><a href={h} className="text-white/85 hover:text-white">{l}</a></li>)}</ul>
    </div>
  )
  return (
    <footer className="bg-neutral-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="grid gap-2 content-start text-sm">
          <b className="text-lg font-semibold">Next Partitions</b>
          <p className="text-white/70">Your trusted B2B supplier for commercial bathroom partitions, hardware, and accessories.</p>
          <a href="tel:1-833-997-7489" className="text-white/85">1-833-997-7489</a>
          <a href="mailto:sales@nextpartitions.com" className="text-white/85">sales@nextpartitions.com</a>
        </div>
        {col('Products', [['All Partitions', `${LIVE}/partitions`], ['Powder Coated Steel', `${LIVE}/partitions/powder-coated-steel`], ['Solid Plastic (HDPE)', `${LIVE}/partitions/solid-plastic-hdpe`], ['Phenolic', `${LIVE}/partitions/phenolic`], ['Hardware & Parts', `${LIVE}/hardware`]])}
        {col('Resources', [['Our Service Area', serviceAreaHref()], ['Installers in Texas', stateHref('texas')], ['Stall Dimensions', `${LIVE}/guides/bathroom-stall-dimensions`], ['ADA Compliance', `${LIVE}/guides/ada-compliance`], ['Blog', `${LIVE}/blog`]])}
        {col('Brands', [['Bobrick', `${LIVE}/brands/bobrick`], ['ASI Global', `${LIVE}/brands/asiglobal`], ['Scranton Products', `${LIVE}/brands/scranton-products`], ['Bradley Corp', `${LIVE}/brands/bradley`], ['Metpar', `${LIVE}/brands/metpar`]])}
        {col('Company', [['About Us', `${LIVE}/about`], ['Contact Us', `${LIVE}/contact`], ['Get a Quote', configuratorHref({ from: 'hub' })]])}
      </div>
      <div className="border-t border-white/10">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-white/60">© 2026 Next Partitions. All rights reserved.</p>
      </div>
    </footer>
  )
}

export function SiteChrome({ children, logoSrc }: { children: ReactNode; logoSrc?: string }) {
  return <><SiteHeader logoSrc={logoSrc} />{children}<SiteFooter /></>
}
