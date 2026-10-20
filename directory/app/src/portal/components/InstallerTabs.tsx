import { useState } from 'react'
import { DISCLAIMER } from '../../directory/config'
import { MATERIAL_LABEL, MOUNTING_LABEL, type Material, type Mounting } from '../../directory/types'
import { portal } from '../client'
import { dollarsToCents, formatDay } from '../stage'
import { CHECK_LABEL, type CheckType, type InstallerSelf, type RateRow } from '../types'
import { Badge, Button, Card, Field, INPUT, Notice, TEXTAREA, useAction, useLoad } from './ui'

const MATERIALS = Object.keys(MATERIAL_LABEL) as Material[]
const MOUNTINGS = Object.keys(MOUNTING_LABEL) as Mounting[]
const EXTRAS: [string, string][] = [
  ['ada_stall_cents', 'ADA stall, extra'], ['urinal_screen_cents', 'Urinal screen, each'],
  ['demo_per_stall_cents', 'Remove old stall, each'], ['per_mile_cents', 'Travel, per mile beyond your free miles'],
]
const toDollars = (c: number | undefined) => (c ? String(c / 100) : '')

// ---------- rates ----------
export function RatesTab({ me }: { me: InstallerSelf }) {
  const { data, error, reload } = useLoad(() => portal().rateCards(me.id), [me.id])
  if (error) return <Notice tone="error">{error}</Notice>
  if (!data) return <p>Loading…</p>
  return <RatesForm me={me} initial={data} onSaved={reload} />
}

function RatesForm({ me, initial, onSaved }: { me: InstallerSelf; initial: RateRow[]; onSaved: () => void }) {
  type Line = { material: Material; mounting: Mounting; low: string; high: string; min: string }
  const [lines, setLines] = useState<Line[]>(initial.map((r) => ({
    material: r.material, mounting: r.mounting, low: toDollars(r.perStallLowCents), high: toDollars(r.perStallHighCents), min: toDollars(r.minimumCents),
  })))
  const shared = initial[0]?.extras ?? {}
  const [extras, setExtras] = useState<Record<string, string>>(Object.fromEntries(EXTRAS.map(([k]) => [k, toDollars(shared[k])])))
  const [freeMiles, setFreeMiles] = useState(String(shared.free_miles ?? me.serviceRadiusMi))
  const act = useAction()
  const [saved, setSaved] = useState(false)
  const set = (n: number, p: Partial<Line>) => { setSaved(false); setLines(lines.map((l, i) => (i === n ? { ...l, ...p } : l))) }
  const dup = new Set<string>()
  const duplicate = lines.some((l) => { const k = `${l.material}/${l.mounting}`; if (dup.has(k)) return true; dup.add(k); return false })

  const save = () => act.run(async () => {
    const ex: Record<string, number> = { free_miles: Number(freeMiles) || me.serviceRadiusMi }
    for (const [k] of EXTRAS) { const c = dollarsToCents(extras[k]); if (c) ex[k] = c }
    const rows: RateRow[] = lines.map((l) => {
      const low = dollarsToCents(l.low), high = dollarsToCents(l.high)
      if (!low || !high || high < low) throw new Error(`${MATERIAL_LABEL[l.material]}, ${MOUNTING_LABEL[l.mounting]}: enter a low and high price per stall (high at least the low).`)
      return { material: l.material, mounting: l.mounting, perStallLowCents: low, perStallHighCents: high, minimumCents: dollarsToCents(l.min) ?? 0, extras: ex }
    })
    await portal().saveRates(me.id, rows)
    setSaved(true); onSaved()
  })

  return (
    <Card title="Your installation rates" className="max-w-4xl">
      <p className="text-sm text-muted-foreground">Customers see an instant installation estimate from these rates before you price a job (the middle of your low and high). You then confirm a firm price on each job. Your rates are never shown to other installers.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-2 font-semibold">Material</th><th className="pr-2 font-semibold">Mounting</th><th className="pr-2 font-semibold">Per stall, low</th><th className="pr-2 font-semibold">Per stall, high</th><th className="pr-2 font-semibold">Job minimum</th><th /></tr></thead>
          <tbody>
            {lines.map((l, n) => (
              <tr key={n} className="border-t border-border">
                <td className="py-2 pr-2"><select aria-label="Material" className={INPUT} value={l.material} onChange={(e) => set(n, { material: e.target.value as Material })}>{MATERIALS.map((m) => <option key={m} value={m}>{MATERIAL_LABEL[m]}</option>)}</select></td>
                <td className="pr-2"><select aria-label="Mounting" className={INPUT} value={l.mounting} onChange={(e) => set(n, { mounting: e.target.value as Mounting })}>{MOUNTINGS.map((m) => <option key={m} value={m}>{MOUNTING_LABEL[m]}</option>)}</select></td>
                <td className="pr-2"><input aria-label="Low per stall" className={`${INPUT} w-28`} inputMode="decimal" value={l.low} onChange={(e) => set(n, { low: e.target.value })} /></td>
                <td className="pr-2"><input aria-label="High per stall" className={`${INPUT} w-28`} inputMode="decimal" value={l.high} onChange={(e) => set(n, { high: e.target.value })} /></td>
                <td className="pr-2"><input aria-label="Job minimum" className={`${INPUT} w-28`} inputMode="decimal" value={l.min} onChange={(e) => set(n, { min: e.target.value })} /></td>
                <td><Button variant="quiet" onClick={() => setLines(lines.filter((_, i) => i !== n))}>Remove</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div><Button variant="outline" onClick={() => setLines([...lines, { material: me.materials[0] ?? 'hdpe', mounting: me.mountings[0] ?? 'overhead_braced', low: '', high: '', min: '' }])}>Add a material and mounting</Button></div>
      <h4 className="font-bold mt-2">Extras (all materials)</h4>
      <div className="grid sm:grid-cols-3 gap-3">
        {EXTRAS.map(([k, label]) => (
          <Field key={k} label={label}><input className={INPUT} inputMode="decimal" value={extras[k]} onChange={(e) => { setSaved(false); setExtras({ ...extras, [k]: e.target.value }) }} /></Field>
        ))}
        <Field label="Free miles (no travel fee)"><input className={INPUT} inputMode="numeric" value={freeMiles} onChange={(e) => setFreeMiles(e.target.value)} /></Field>
      </div>
      {duplicate && <Notice tone="error">Each material and mounting can appear once.</Notice>}
      <div className="flex gap-3 items-center"><Button busy={act.busy} disabled={duplicate} onClick={save}>Save rates</Button>{saved && <span className="text-sm text-emerald-800">Saved.</span>}</div>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </Card>
  )
}

// ---------- profile, availability and documents ----------
export function ProfileTab({ me, onSaved }: { me: InstallerSelf; onSaved: () => void }) {
  const [about, setAbout] = useState(me.about ?? '')
  const [radius, setRadius] = useState(String(me.serviceRadiusMi))
  const [maxJobs, setMaxJobs] = useState(String(me.maxOpenJobs))
  const [materials, setMaterials] = useState(me.materials)
  const [mountings, setMountings] = useState(me.mountings)
  const [awayFrom, setAwayFrom] = useState(me.awayFrom ?? '')
  const [awayTo, setAwayTo] = useState(me.awayTo ?? '')
  const [photo, setPhoto] = useState(me.photoUrl)
  const act = useAction()
  const [saved, setSaved] = useState(false)
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      <Card title="Your profile">
        <p className="text-sm text-muted-foreground">Shown on your public profile once you're listed. Your business name, status and phone number are managed by Next Partitions; ask us to change them.</p>
        <Field label="About your business"><textarea className={TEXTAREA} rows={4} maxLength={800} value={about} onChange={(e) => setAbout(e.target.value)} /></Field>
        <Field label="Photo (your crew or a finished job)">
          <div className="flex gap-3 items-center">
            {photo && <img src={photo} alt="" className="size-16 object-cover border border-border" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="text-sm font-normal" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) act.run(async () => setPhoto(await portal().uploadProfilePhoto(me.id, f)))
            }} />
          </div>
        </Field>
        <fieldset className="grid gap-1.5 text-sm"><legend className="font-semibold mb-1">Materials you install</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">{MATERIALS.map((m) => <label key={m} className="flex gap-2 items-center"><input type="checkbox" checked={materials.includes(m)} onChange={() => setMaterials(toggle(materials, m))} />{MATERIAL_LABEL[m]}</label>)}</div>
        </fieldset>
        <fieldset className="grid gap-1.5 text-sm"><legend className="font-semibold mb-1">Mounting types</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">{MOUNTINGS.map((m) => <label key={m} className="flex gap-2 items-center"><input type="checkbox" checked={mountings.includes(m)} onChange={() => setMountings(toggle(mountings, m))} />{MOUNTING_LABEL[m]}</label>)}</div>
        </fieldset>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Service radius (miles)" hint={`From ${me.baseCity}, ${me.baseState} ${me.baseZip}`}><input className={INPUT} inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value)} /></Field>
          <Field label="Most open jobs at once" hint="We stop sending requests at this number."><input className={INPUT} inputMode="numeric" value={maxJobs} onChange={(e) => setMaxJobs(e.target.value)} /></Field>
        </div>
        <h4 className="font-bold">Away (no new requests for jobs delivered in these dates)</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="From"><input className={INPUT} type="date" value={awayFrom} onChange={(e) => setAwayFrom(e.target.value)} /></Field>
          <Field label="To"><input className={INPUT} type="date" min={awayFrom} value={awayTo} onChange={(e) => setAwayTo(e.target.value)} /></Field>
        </div>
        <div className="flex gap-3 items-center">
          <Button busy={act.busy} onClick={async () => {
            setSaved(false)
            const r = Number(radius), m = Number(maxJobs)
            const ok = await act.run(async () => {
              if (!(r >= 5 && r <= 300)) throw new Error('Service radius: between 5 and 300 miles.')
              if (!(m >= 0)) throw new Error('Most open jobs: 0 or more.')
              await portal().saveProfile(me.id, { about: about.trim() || null, serviceRadiusMi: r, maxOpenJobs: m, materials, mountings,
                photoUrl: photo, awayFrom: awayFrom || null, awayTo: awayTo || awayFrom || null })
            })
            if (ok) { setSaved(true); onSaved() }
          }}>Save profile</Button>
          {saved && <span className="text-sm text-emerald-800">Saved.</span>}
        </div>
        {act.error && <Notice tone="error">{act.error}</Notice>}
      </Card>
      <Documents me={me} />
    </div>
  )
}

function Documents({ me }: { me: InstallerSelf }) {
  const { data: checks } = useLoad(() => portal().checks(me.id), [me.id])
  const { data: uploads, reload } = useLoad(() => portal().uploads(me.id), [me.id])
  const [type, setType] = useState<CheckType>('insurance')
  const [file, setFile] = useState<File | null>(null)
  const act = useAction()
  const soon = (d: string | null) => d !== null && new Date(d) < new Date(Date.now() + 30 * 864e5)

  return (
    <Card title="Checks and documents">
      <p className="text-sm text-muted-foreground">What we checked, as shown on your profile. Insurance and registration are checked every year; an expired certificate pauses new job requests until it's renewed.</p>
      <ul className="grid gap-2 text-sm">
        {checks?.map((c) => (
          <li key={c.checkType} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
            <span><b>{CHECK_LABEL[c.checkType]}</b>{c.publicLabel && <span className="block text-muted-foreground">{c.publicLabel}</span>}</span>
            <span className="flex gap-2 items-center">
              {c.expiresAt && <span className={soon(c.expiresAt) ? 'text-amber-800 font-semibold' : 'text-muted-foreground'}>Expires {formatDay(c.expiresAt)}</span>}
              <Badge tone={c.status === 'passed' ? 'go' : c.status === 'pending' ? 'wait' : 'alert'}>{c.status === 'passed' ? 'Checked' : c.status === 'pending' ? 'Being checked' : c.status === 'expired' ? 'Expired' : 'Not accepted'}</Badge>
            </span>
          </li>
        ))}
      </ul>
      <h4 className="font-bold">Send a new or renewed document</h4>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Document"><select className={INPUT} value={type} onChange={(e) => setType(e.target.value as CheckType)}>
          {(['insurance', 'business_registration', 'city_registration', 'background_check', 'state_license'] as CheckType[]).map((t) => <option key={t} value={t}>{CHECK_LABEL[t]}</option>)}
        </select></Field>
        <Field label="File (PDF or photo, up to 10 MB)"><input type="file" accept="application/pdf,image/jpeg,image/png" className="text-sm font-normal" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
      </div>
      <div><Button busy={act.busy} disabled={!file} onClick={async () => { if (file && await act.run(() => portal().uploadDocument(me.id, type, file))) { setFile(null); reload() } }}>Send for checking</Button></div>
      {act.error && <Notice tone="error">{act.error}</Notice>}
      {uploads && uploads.length > 0 && (
        <ul className="grid gap-1 text-sm">
          {uploads.map((u) => (
            <li key={u.id} className="flex justify-between gap-2">
              <span>{CHECK_LABEL[u.checkType]} · sent {formatDay(u.uploadedAt)}</span>
              <span className="text-muted-foreground">{u.reviewedAt ? `Checked ${formatDay(u.reviewedAt)}${u.reviewNote ? `: ${u.reviewNote}` : ''}` : 'Waiting to be checked'}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ---------- performance ----------
export function PerformanceTab({ me }: { me: InstallerSelf }) {
  const { data: p } = useLoad(() => portal().performance(me.slug), [me.slug])
  const kpi = (big: string, label: string, target: string, met: boolean | null) => (
    <div className="bg-card border border-border p-4 grid gap-1">
      <b className="text-2xl font-black">{big}</b><span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${met ? 'text-emerald-800' : 'text-muted-foreground'}`}>{target}{met ? ' ✓' : ''}</span>
    </div>
  )
  if (me.status !== 'approved') return <Card><p>Your numbers appear here once you're listed and pricing jobs.</p></Card>
  if (!p) return <p>Loading…</p>
  return (
    <div className="grid gap-5">
      <div className="grid sm:grid-cols-3 gap-3">
        {kpi(p.medianReplyHours === null ? '–' : `${p.medianReplyHours} h`, 'Median reply to job requests', 'Target: within 1 business day', p.medianReplyHours === null ? null : p.medianReplyHours <= 24)}
        {kpi(p.rating === null ? '–' : `★ ${p.rating}`, `From ${p.reviewCount} reviews by customers with a completed job`, 'Top rated: 4.8+ from 10+', p.rating !== null && p.rating >= 4.8 && p.reviewCount >= 10)}
        {kpi(String(p.installs), 'Installs for Next Partitions customers', 'Established: 10+', p.installs >= 10)}
      </div>
      <Card title="How this affects your listing">
        <ul className="list-disc pl-5 grid gap-1.5 text-sm">
          <li>Your Installer Score sets your place on the area pages and which job requests you get. It combines your rating, installs for our customers and how fast you answer.</li>
          <li>The fastest reply doesn't win the job; speed counts over time. Late replies lower your score.</li>
          <li>Ratings below 4.0 or a pattern of complaints trigger a check and can lead to delisting. Reviews are published unedited.</li>
        </ul>
      </Card>
    </div>
  )
}

// ---------- listing agreement ----------
export function AgreementTab() {
  return (
    <Card title="Your listing agreement, in short" className="max-w-3xl">
      <ul className="list-disc pl-5 grid gap-2">
        <li>Install the partitions on the customer's Next Partitions order. No substitutes, and no selling partitions on our jobs.</li>
        <li>Price jobs through this portal and report job status (scheduled, installed).</li>
        <li>Talk to customers through Next Partitions until the job is released to you. Contact details in messages are hidden until then.</li>
        <li>Don't go around Next Partitions on customers we refer to you. Breaches lead to delisting.</li>
        <li>You contract and invoice installation directly with the customer. Next Partitions adds no markup to your price.</li>
        <li>Keep your insurance and business or city registration current. We check them every year.</li>
      </ul>
      <p className="text-sm text-muted-foreground border-t border-border pt-3">Summary only; the signed agreement applies. {DISCLAIMER}</p>
    </Card>
  )
}
