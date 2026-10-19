import { useMemo, useState } from 'react'
import { estimateFor, formatUsd, rangeAcross } from '../estimate'
import { areaHref, configuratorHref } from '../links'
import { partitionsPriceCents } from '../partitions'
import { type Installer, MATERIAL_LABEL, MOUNTING_LABEL, type Material, type Mounting, type RateCard } from '../types'
import { ButtonLink } from './ui'

const MATERIALS = Object.keys(MATERIAL_LABEL) as Material[]
const MOUNTINGS = Object.keys(MOUNTING_LABEL) as Mounting[]

// Step 1 of the quote, right on the city page or profile: visitors price partitions + installation
// with Next Partitions before they look at installers, then continue into the full configurator.
export function ConfigureStart(props: {
  areaSlug: string
  areaName: string
  installers: Installer[]
  rateCards: RateCard[]
  preset?: string            // installer chosen from a card or profile
  lockPreset?: boolean       // on a profile the installer is fixed
  from: 'directory' | 'profile'
}) {
  const presetValid = props.installers.find((i) => i.slug === props.preset)
  const [installer, setInstaller] = useState<Installer | undefined>(presetValid)
  const offered = useMemo(() => new Set(props.rateCards.map((c) => c.material)), [props.rateCards])
  const [material, setMaterial] = useState<Material>(
    installer?.materials[0] ?? (offered.has('hdpe') || offered.size === 0 ? 'hdpe' : MATERIALS.find((m) => offered.has(m))!))
  const [mounting, setMounting] = useState<Mounting>('overhead_braced')
  const [stalls, setStalls] = useState(4)
  const [removeOld, setRemoveOld] = useState(false)

  const job = { material, mounting, stalls, removeOld }
  const partitions = partitionsPriceCents(material, mounting, stalls)
  const cards = installer ? props.rateCards.filter((c) => c.slug === installer.slug) : props.rateCards
  const bySlug = [...new Set(cards.map((c) => c.slug))].map((s) => cards.filter((c) => c.slug === s))
  const install = installer ? estimateFor(cards, job) : rangeAcross(bySlug, job)
  const installersPricing = install && 'installers' in install ? install.installers : install ? 1 : 0

  const href = configuratorHref({ area: props.areaSlug, installer: installer?.slug, material, mounting, stalls, removeOld, from: props.from })

  return (
    <section id="configure" aria-labelledby="configure-h" className="scroll-mt-20 bg-card border border-border border-t-4 border-t-brand-red rounded-lg p-5 sm:p-6 shadow-sm grid gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-red">Step 1 of your quote</p>
        <h2 id="configure-h" className="text-2xl font-extrabold tracking-tight">Price your restroom</h2>
        <p className="text-muted-foreground mt-1">
          Partitions from Next Partitions, installed by {installer ? installer.displayName : `an approved ${props.areaName} installer`}.
          Pick the basics; colors, layout and sizes come next.
        </p>
      </div>

      {installer && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="border border-brand-red/40 bg-brand-red/10 text-brand-red font-semibold px-3 py-1">Installer: {installer.displayName}</span>
          {props.lockPreset
            ? <a className="text-brand-red hover:underline" href={areaHref(props.areaSlug) + '#configure'}>Compare with other {props.areaName} installers</a>
            : <button type="button" className="text-brand-red hover:underline" onClick={() => setInstaller(undefined)}>Use any approved installer</button>}
        </p>
      )}

      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold mb-1">Material</legend>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MATERIALS.map((m) => (
            <label key={m} className={`border rounded-md px-3 py-2.5 text-sm cursor-pointer has-[:checked]:border-brand-red has-[:checked]:bg-brand-red/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-red ${offered.has(m) ? 'border-border' : 'border-dashed border-border text-muted-foreground'}`}>
              <input type="radio" name="material" value={m} checked={material === m} onChange={() => setMaterial(m)} className="sr-only" />
              {MATERIAL_LABEL[m]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-3 gap-4 items-end">
        <label className="grid gap-1 text-sm font-semibold">Mounting
          <select className="border border-border rounded-md px-2 min-h-11 bg-card font-normal" value={mounting} onChange={(e) => setMounting(e.target.value as Mounting)}>
            {MOUNTINGS.map((m) => <option key={m} value={m}>{MOUNTING_LABEL[m]}</option>)}
          </select>
        </label>
        <div className="grid gap-1 text-sm font-semibold">
          <span id="stalls-l">Stalls</span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="stalls-l">
            <button type="button" aria-label="Fewer stalls" className="size-11 border border-border rounded-md text-lg" onClick={() => setStalls((s) => Math.max(1, s - 1))}>−</button>
            <output aria-live="polite" className="w-10 text-center text-lg font-bold">{stalls}</output>
            <button type="button" aria-label="More stalls" className="size-11 border border-border rounded-md text-lg" onClick={() => setStalls((s) => Math.min(40, s + 1))}>+</button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm min-h-11">
          <input type="checkbox" className="size-5" checked={removeOld} onChange={(e) => setRemoveOld(e.target.checked)} />
          Remove old stalls
        </label>
      </div>

      <dl aria-live="polite" className="grid sm:grid-cols-3 gap-3 bg-surface-warm border border-border p-4">
        <div><dt className="text-sm text-muted-foreground">Partitions (Next Partitions)</dt><dd className="text-xl font-bold">{formatUsd(partitions)}</dd></div>
        <div>
          <dt className="text-sm text-muted-foreground">Installation estimate</dt>
          <dd className="text-xl font-bold">{install ? `${formatUsd(install.lowCents)} – ${formatUsd(install.highCents)}` : 'Quoted after drawings'}</dd>
          <dd className="text-xs text-muted-foreground">{install ? (installer ? `Rate card: ${installer.displayName}` : `${installersPricing} approved installer${installersPricing === 1 ? '' : 's'}`) : 'No rate card for this combination yet'}</dd>
        </div>
        <div><dt className="text-sm text-muted-foreground">Estimated total</dt>
          <dd className="text-xl font-extrabold">{install ? `${formatUsd(partitions + install.lowCents)} – ${formatUsd(partitions + install.highCents)}` : `${formatUsd(partitions)} + installation`}</dd></div>
      </dl>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <ButtonLink href={href} size="lg" className="w-full sm:w-auto">Continue to full quote →</ButtonLink>
        <p className="text-sm text-muted-foreground">Free, no obligation. Installers price your job through us; your contact details stay with us until you book.</p>
      </div>
    </section>
  )
}
