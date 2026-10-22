import { useMemo, useState } from 'react'
import { estimateFor, formatUsd, rangeAcross } from '../estimate'
import { areaHref, configuratorHref } from '../links'
import { partitionsRangeCents } from '../partitions'
import { type Installer, MATERIAL_LABEL, MOUNTING_LABEL, type Material, type Mounting, type RateCard } from '../types'
import { ButtonLink } from './ui'

const MATERIALS = Object.keys(MATERIAL_LABEL) as Material[]
const MOUNTINGS = Object.keys(MOUNTING_LABEL) as Mounting[]

// Step 1 of the quote, right on the city page or profile: visitors price partitions + installation
// with Next Partitions before they look at installers, then continue into the full configurator.
// No number shows until the few answers that move the price most are given, and then only as ranges:
// sizes, colors and hardware come later, in the configurator.
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
  const [ada, setAda] = useState<boolean | null>(null)
  const [urinals, setUrinals] = useState<number | null>(null)
  const [privacy, setPrivacy] = useState<'standard' | 'extra' | null>(null)
  const left = [ada, urinals, privacy].filter((x) => x === null).length

  const job = { material, mounting, stalls, removeOld, adaStalls: ada ? 1 : 0 }
  const parts = partitionsRangeCents({ material, mounting, stalls, ada: !!ada, urinalScreens: urinals ?? 0, privacy: privacy ?? 'standard' })
  const cards = installer ? props.rateCards.filter((c) => c.slug === installer.slug) : props.rateCards
  const bySlug = [...new Set(cards.map((c) => c.slug))].map((s) => cards.filter((c) => c.slug === s))
  const install = installer ? estimateFor(cards, job) : rangeAcross(bySlug, job)
  const installersPricing = install && 'installers' in install ? install.installers : install ? 1 : 0

  const href = configuratorHref({ area: props.areaSlug, installer: installer?.slug, material, mounting, stalls, removeOld,
    ada: ada ?? undefined, urinalScreens: urinals ?? undefined, privacy: privacy ?? undefined, from: props.from })
  const range = (lo: number, hi: number) => `${formatUsd(lo)} – ${formatUsd(hi)}`
  const choice = (name: string, label: string, options: [string, string][], value: string | null, set: (v: string) => void) => (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold mb-1">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label key={v} className="border border-border rounded-md px-3 min-h-11 inline-flex items-center text-sm cursor-pointer has-[:checked]:border-brand-red has-[:checked]:bg-brand-red/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-red">
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => set(v)} className="sr-only" />{l}
          </label>
        ))}
      </div>
    </fieldset>
  )

  return (
    <section id="configure" aria-labelledby="configure-h" className="scroll-mt-20 bg-card border border-border border-t-4 border-t-brand-red rounded-lg p-5 sm:p-6 shadow-sm grid gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-red">Step 1 of your quote</p>
        <h2 id="configure-h" className="text-2xl font-extrabold tracking-tight">Price your restroom</h2>
        <p className="text-muted-foreground mt-1">
          Partitions from Next Partitions, installed by {installer ? installer.displayName : `a verified ${props.areaName} installer`}.
          A few questions give you a price range; sizes, colors and layout come next.
        </p>
      </div>

      {installer && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="border border-brand-red/40 bg-brand-red/10 text-brand-red font-semibold px-3 py-1">Installer: {installer.displayName}</span>
          {props.lockPreset
            ? <a className="text-brand-red hover:underline" href={areaHref(props.areaSlug) + '#configure'}>Compare with other {props.areaName} installers</a>
            : <button type="button" className="text-brand-red hover:underline" onClick={() => setInstaller(undefined)}>Use any verified installer</button>}
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

      <div className="grid sm:grid-cols-3 gap-4">
        {choice('ada', 'Include an accessible (ADA) stall?', [['yes', 'Yes'], ['no', 'No']], ada === null ? null : ada ? 'yes' : 'no', (v) => setAda(v === 'yes'))}
        {choice('urinals', 'Urinal screens', [['0', 'None'], ['1', '1'], ['2', '2'], ['3', '3']], urinals === null ? null : String(urinals), (v) => setUrinals(Number(v)))}
        {choice('privacy', 'Privacy', [['standard', 'Standard'], ['extra', 'Extra (no gaps)']], privacy, (v) => setPrivacy(v as 'standard' | 'extra'))}
      </div>

      {left > 0 ? (
        <p aria-live="polite" className="bg-surface-warm border border-dashed border-border p-4 text-sm text-muted-foreground">
          Answer {left === 3 ? 'the 3 questions' : left === 1 ? 'the last question' : `the ${left} questions`} above to see a price range for your restroom.
        </p>
      ) : (
        <div aria-live="polite" className="grid gap-2 bg-surface-warm border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Price range for {stalls} stall{stalls === 1 ? '' : 's'}, {MATERIAL_LABEL[material].toLowerCase()}</p>
          <dl className="grid sm:grid-cols-3 gap-3">
            <div><dt className="text-sm text-muted-foreground">Partitions (Next Partitions)</dt><dd className="text-xl font-bold">{range(parts.lowCents, parts.highCents)}</dd></div>
            <div>
              <dt className="text-sm text-muted-foreground">Installation</dt>
              <dd className="text-xl font-bold">{install ? range(install.lowCents, install.highCents) : 'Quoted after drawings'}</dd>
              <dd className="text-xs text-muted-foreground">{install ? (installer ? `From ${installer.displayName}${installer.displayName.endsWith('s') ? "'" : "'s"} rates` : `From ${installersPricing} verified installer${installersPricing === 1 ? "'s" : "s'"} rates`) : 'No rates for this combination yet'}</dd>
            </div>
            <div><dt className="text-sm text-muted-foreground">Total</dt>
              <dd className="text-xl font-extrabold">{install ? range(parts.lowCents + install.lowCents, parts.highCents + install.highCents) : `${range(parts.lowCents, parts.highCents)} + installation`}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">Stall sizes, colors and hardware set the exact price. Your quote comes with shop drawings within 2 business days.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <ButtonLink href={href} size="lg" className="w-full sm:w-auto">Continue to full quote →</ButtonLink>
        <p className="text-sm text-muted-foreground">Free, no obligation. Installers price your job through us; your contact details stay with us until you book.</p>
      </div>
    </section>
  )
}
