import type { Area, Installer } from '../types'
import { InstallerCard } from './InstallerCard'
import { Disclaimer } from './ui'

// The installer section of a /service-area/[city]/ page, below the configure step.
export function AreaInstallers({ area, installers }: { area: Area; installers: Installer[] }) {
  const rows = [...installers].sort((a, b) => b.installs - a.installs || (b.rating ?? 0) - (a.rating ?? 0))
  return (
    <section aria-labelledby="installers" className="grid gap-5">
      <div>
        <h2 id="installers" className="text-2xl font-extrabold tracking-tight">Partition installers in {area.name}</h2>
        <p className="text-muted-foreground mt-1">
          {installers.length
            ? `${installers.length} approved installer${installers.length === 1 ? '' : 's'} serving ${area.cities.slice(0, 5).join(', ')}${area.cities.length > 5 ? ' and nearby' : ''}. We checked every listed installer: insurance, registration and references.`
            : `We're vetting installers for ${area.name} now.`}
        </p>
      </div>
      <div className="grid gap-3">
        {rows.length === 0
          ? <p className="bg-card border border-border rounded-lg p-4">No approved installers here yet. Price your restroom above and we'll arrange installation options for your job site.</p>
          : rows.map((i) => <InstallerCard key={i.slug} installer={i} area={area.slug} />)}
      </div>
      <Disclaimer />
    </section>
  )
}
