import type { Area, Installer, RateCard } from '../types'
import { EstimateWidget } from './EstimateWidget'
import { InstallerCard } from './InstallerCard'
import { Disclaimer } from './ui'

// The installer section of a /service-area/[city]/ page. The page above it stays a buyer page.
export function AreaInstallers({ area, installers, rateCards }: { area: Area; installers: Installer[]; rateCards: RateCard[] }) {
  const rows = [...installers].sort((a, b) => b.installs - a.installs || (b.rating ?? 0) - (a.rating ?? 0))
  return (
    <section aria-labelledby="installers" className="grid gap-5">
      <div>
        <h2 id="installers" className="text-2xl font-extrabold tracking-tight">Partition installers in {area.name}</h2>
        <p className="text-muted-foreground mt-1">
          {installers.length} approved installer{installers.length === 1 ? '' : 's'} serving {area.cities.slice(0, 5).join(', ')}
          {area.cities.length > 5 ? ' and nearby' : ''}. We checked every listed installer: insurance, registration and references.
        </p>
      </div>
      <div className="grid gap-3">
        {rows.length === 0
          ? <p>No installers listed here yet. Configure your partitions and we'll arrange installation options for your job.</p>
          : rows.map((i) => <InstallerCard key={i.slug} installer={i} area={area.slug} />)}
      </div>
      <EstimateWidget cards={rateCards} />
      <Disclaimer />
    </section>
  )
}
