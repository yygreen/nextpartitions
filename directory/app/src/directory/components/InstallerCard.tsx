import { installerHref, priceWithHref } from '../links'
import { type Installer, labelsFor, MATERIAL_LABEL, NEW_INSTALLER_NOTE } from '../types'
import { ButtonLink, Stars } from './ui'

export function InstallerCard({ installer: i, area }: { installer: Installer; area: string }) {
  const labels = labelsFor(i)
  return (
    <article className="bg-card border border-border rounded-lg p-4 sm:p-5 grid gap-3">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold mr-1"><a href={installerHref(i.slug)} className="hover:underline">{i.displayName}</a></h3>
        {labels.map((l) => (
          <span key={l} className="text-xs font-semibold px-2.5 py-0.5 border border-brand-red/40 bg-brand-red/10 text-brand-red">{l === 'Approved' || l === 'Verified' ? '✓ ' : ''}{l}</span>
        ))}
      </header>
      <p className="text-sm text-muted-foreground">
        {i.rating !== null && <><Stars rating={i.rating} /> <b className="text-foreground">{i.rating}</b> ({i.reviewCount}) · </>}
        {i.installs ? `${i.installs} installs for our customers` : NEW_INSTALLER_NOTE} · {i.baseCity}, up to {i.serviceRadiusMi} mi
        {i.medianReplyHours !== null && <> · usually replies within {Math.ceil(i.medianReplyHours)} h</>}
      </p>
      <ul className="flex flex-wrap gap-1.5 text-xs">
        {i.materials.map((m) => <li key={m} className="border border-border rounded-sm px-2 py-0.5">{MATERIAL_LABEL[m]}</li>)}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ButtonLink href={priceWithHref(area, i.slug)} size="sm">Price with {i.displayName.split(' ')[0]}</ButtonLink>
        <a href={installerHref(i.slug)} className="text-sm font-semibold text-brand-red hover:underline">View profile</a>
        {i.trackedPhone && <a href={`tel:${i.trackedPhone.replace(/\D/g, '')}`} className="text-sm text-muted-foreground hover:underline">{i.trackedPhone}</a>}
      </div>
    </article>
  )
}
