import { configuratorUrl } from '../config'
import { ButtonLink } from './ui'

// The primary action on every location page: start a partitions configuration with Next Partitions.
export function StartConfigure({ area, installer, areaName }: { area?: string; installer?: { slug: string; name: string }; areaName?: string }) {
  return (
    <section aria-labelledby="start-cfg" className="bg-card border border-border border-t-4 border-t-primary rounded-lg p-5 sm:p-6 shadow-sm max-w-3xl">
      <h2 id="start-cfg" className="text-xl font-extrabold tracking-tight">
        {installer ? `Get a quote with ${installer.name}` : 'Start with your partitions'}
      </h2>
      <p className="text-muted-foreground mt-1.5 mb-4">
        Configure your restroom in about 2 minutes. You see your partitions price right away, plus an installation estimate
        {installer ? ` from ${installer.name}` : areaName ? ` from approved ${areaName} installers` : ' for your area'}.
      </p>
      <ButtonLink href={configuratorUrl({ area, installer: installer?.slug, from: installer ? 'profile' : 'directory' })} size="lg" className="w-full sm:w-auto">
        Configure your partitions →
      </ButtonLink>
      <ol className="grid sm:grid-cols-3 gap-3 mt-5 text-sm">
        <li className="border-t-2 border-border pt-2"><b className="block text-primary text-xs uppercase tracking-wide">1 · Configure</b>Material, mounting, stall count. Instant partitions price.</li>
        <li className="border-t-2 border-border pt-2"><b className="block text-primary text-xs uppercase tracking-wide">2 · Installers confirm</b>Approved installers price your job through us. Your contact details stay with us.</li>
        <li className="border-t-2 border-border pt-2"><b className="block text-primary text-xs uppercase tracking-wide">3 · We coordinate</b>Delivery and install dates lined up for you.</li>
      </ol>
    </section>
  )
}

export function MobileConfigureBar({ area, installer }: { area?: string; installer?: string }) {
  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-card border-t border-border px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
      <ButtonLink href={configuratorUrl({ area, installer, from: installer ? 'profile' : 'directory' })} className="w-full">Configure your partitions →</ButtonLink>
    </div>
  )
}
