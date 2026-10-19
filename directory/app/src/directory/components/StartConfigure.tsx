import { configuratorHref } from '../links'
import { ButtonLink } from './ui'

// Hub-level call to action (no area chosen yet).
export function StartConfigure() {
  return (
    <section aria-labelledby="start-cfg" className="bg-card border border-border border-t-4 border-t-brand-red rounded-lg p-5 sm:p-6 shadow-sm max-w-3xl">
      <h2 id="start-cfg" className="text-xl font-extrabold tracking-tight">Start with your partitions</h2>
      <p className="text-muted-foreground mt-1.5 mb-4">Configure your restroom in about 2 minutes. You see your partitions price right away, plus an installation estimate for your area.</p>
      <ButtonLink href={configuratorHref({ from: 'hub' })} size="lg" className="w-full sm:w-auto">Configure your partitions →</ButtonLink>
      <ol className="grid sm:grid-cols-3 gap-3 mt-5 text-sm">
        <li className="border-t-2 border-border pt-2"><b className="block text-brand-red text-xs uppercase tracking-wide">1 · Configure</b>Material, mounting, stall count. Instant partitions price.</li>
        <li className="border-t-2 border-border pt-2"><b className="block text-brand-red text-xs uppercase tracking-wide">2 · Installers confirm</b>Approved installers price your job through us. Your contact details stay with us.</li>
        <li className="border-t-2 border-border pt-2"><b className="block text-brand-red text-xs uppercase tracking-wide">3 · We coordinate</b>Delivery and install dates lined up for you.</li>
      </ol>
    </section>
  )
}

// Phones: always one tap from pricing. On city pages and profiles it jumps to the step on the page.
export function MobileConfigureBar({ href, label = 'Price your restroom →' }: { href: string; label?: string }) {
  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-card border-t border-border px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
      <ButtonLink href={href} className="w-full">{label}</ButtonLink>
    </div>
  )
}
