import { useState } from 'react'
import { formatUsd } from '../../directory/estimate'
import { MATERIAL_LABEL, MOUNTING_LABEL } from '../../directory/types'
import { portal } from '../client'
import { formatDay, formatWhen } from '../stage'
import type { Applicant, ApplicantDetail, AreaCoverage, CheckDetail, CheckType, Reference } from '../types'
import { Badge, Button, Card, Field, INPUT, Notice, TEXTAREA, useAction, useLoad } from './ui'

// Installer vetting (prototypes/installer-vetting.html): applicants on the left, the Approved checklist on the
// right. The database refuses approval unless the five checks pass, so the button here is a convenience.
const NEED = 3
const REQUIRED: { key: string; label: string; ok: (c: CheckDetail[]) => boolean }[] = [
  { key: 'insurance', label: 'insurance', ok: (c) => passed(c, 'insurance') },
  { key: 'registration', label: 'registration', ok: (c) => passed(c, 'business_registration') || passed(c, 'city_registration') },
  { key: 'references', label: 'references', ok: (c) => passed(c, 'references') },
  { key: 'response_test', label: 'test job', ok: (c) => passed(c, 'response_test') },
  { key: 'listing_agreement', label: 'listing agreement', ok: (c) => passed(c, 'listing_agreement') },
]
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
const passed = (c: CheckDetail[], t: CheckType) => c.some((x) => x.checkType === t && x.status === 'passed')
const today = () => new Date().toISOString().slice(0, 10)
const CREW: Record<string, string> = { '1-2': '1–2', '3-5': '3–5', '6-10': '6–10', '10+': 'more than 10' }
const EXTRA: Record<string, string> = { remove_old: 'removal', ada: 'ADA stalls', urinal_screens: 'urinal screens' }

function pill(a: Applicant): { label: string; tone: 'new' | 'wait' | 'go' | 'off' | 'alert' } {
  if (a.status === 'approved') return { label: 'Approved', tone: 'go' }
  if (a.status === 'delisted') return { label: a.decisionNote ? `Rejected: ${a.decisionNote}` : 'Delisted', tone: 'off' }
  if (a.status === 'suspended') return { label: 'Paused', tone: 'alert' }
  if (a.status === 'applied') return { label: a.decisionNote ? 'More info requested' : 'New application', tone: 'new' }
  return { label: a.decisionNote ? 'More info requested' : 'Checking', tone: 'wait' }
}

export function VettingView() {
  const people = useLoad(() => portal().applicants(), [])
  const areas = useLoad(() => portal().areas(), [])
  const [openId, setOpenId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const reload = () => { people.reload(); areas.reload() }
  if (people.error) return <Notice tone="error">{people.error}</Notice>
  if (!people.data || !areas.data) return <p>Loading…</p>

  const order = { applied: 0, vetting: 1, suspended: 2, approved: 3, delisted: 4 } as const
  const list = people.data.filter((a) => showAll || a.status !== 'delisted').sort((a, b) => order[a.status] - order[b.status])
  const open = people.data.find((a) => a.id === openId) ?? list[0]

  return (
    <div className="grid gap-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{areas.data.map((a) => <Launch key={a.slug} a={a} reload={areas.reload} />)}</div>
      <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
        <div className="grid gap-2">
          <h2 className="text-lg">Applicants and installers</h2>
          <ul className="grid gap-2">
            {list.map((a) => {
              const p = pill(a)
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => setOpenId(a.id)} aria-current={a.id === open?.id}
                    className={`w-full text-left bg-card border p-3 grid gap-1 ${a.id === open?.id ? 'border-brand-red' : 'border-border hover:border-foreground/40'}`}>
                    <b>{a.displayName}</b>
                    <span className="text-sm text-muted-foreground">{a.baseCity} · {a.appliedAt ? `applied ${formatDay(a.appliedAt)}` : 'added by hand'}</span>
                    <span><Badge tone={p.tone}>{p.label}</Badge></span>
                  </button>
                </li>
              )
            })}
          </ul>
          <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />Show rejected and delisted</label>
        </div>
        {open && <ApplicantPanel key={open.id} a={open} areas={areas.data} reload={reload} />}
      </div>
    </div>
  )
}

function Launch({ a, reload }: { a: AreaCoverage; reload: () => void }) {
  const act = useAction()
  const ready = a.approved >= NEED
  return (
    <Card>
      <b>{a.name}: {ready ? `${a.approved} approved installers` : `${a.approved} of ${NEED} approved installers needed`}</b>
      <div className="flex gap-1" aria-hidden>{Array.from({ length: NEED }, (_, k) => <i key={k} className={`h-2 flex-1 ${k < a.approved ? 'bg-brand-red' : 'bg-muted'}`} />)}</div>
      <p className="text-sm text-muted-foreground">{a.listed} with a public profile (after their first completed job). {a.published ? 'The area page is live.' : 'The area page stays unpublished until 3 installers are approved.'}</p>
      <div className="flex gap-3 items-center">
        {a.published
          ? <Button variant="outline" busy={act.busy} onClick={async () => { if (await act.run(() => portal().publishArea(a.slug, false))) reload() }}>Unpublish</Button>
          : <Button disabled={!ready} busy={act.busy} onClick={async () => { if (await act.run(() => portal().publishArea(a.slug, true))) reload() }}>Publish area page</Button>}
        {a.published && a.listed < NEED && <span className="text-sm text-amber-800">Only {plural(a.listed, 'public profile')} so far</span>}
      </div>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </Card>
  )
}

function ApplicantPanel({ a, areas, reload }: { a: Applicant; areas: AreaCoverage[]; reload: () => void }) {
  const detail = useLoad(() => portal().applicantDetail(a.id), [a.id])
  const refresh = () => { detail.reload(); reload() }
  const p = pill(a)
  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap justify-between gap-2 items-start">
          <div><h2 className="text-2xl">{a.displayName}</h2>
            <p className="text-sm text-muted-foreground">{a.legalName && a.legalName !== a.displayName ? `${a.legalName} · ` : ''}{a.baseCity}, {a.baseState} {a.baseZip} · serves {a.serviceRadiusMi} mi{a.appliedAt ? ` · applied ${formatDay(a.appliedAt)}` : ''}</p></div>
          <Badge tone={p.tone}>{p.label}</Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <KV k="Contact" v={a.contactName} /><KV k="Materials" v={a.materials.map((m) => MATERIAL_LABEL[m]).join(', ')} />
          <KV k="Phone" v={a.contactPhone} /><KV k="Bracing" v={a.mountings.map((m) => MOUNTING_LABEL[m]).join(', ')} />
          <KV k="Email" v={a.contactEmail} /><KV k="Extras" v={a.extras.map((e) => EXTRA[e] ?? e).join(', ') || 'None'} />
          <KV k="In business" v={[a.yearsInBusiness !== null ? `${a.yearsInBusiness} years` : null, a.crewSize ? `crew ${CREW[a.crewSize] ?? a.crewSize}` : null].filter(Boolean).join(' · ')} />
          <KV k="Brands" v={a.brands} />
          <KV k="Portal login" v={a.hasLogin ? 'Yes' : 'Not yet (Logins tab)'} />
        </div>
      </Card>
      {detail.error && <Notice tone="error">{detail.error}</Notice>}
      {detail.data && <>
        <Decision a={a} d={detail.data} areas={areas} reload={refresh} />
        <Checklist a={a} d={detail.data} reload={refresh} />
        <Rates d={detail.data} />
      </>}
      <p className="text-sm text-muted-foreground"><b>Annual re-check:</b> insurance and registration are checked again every year. An expired certificate pauses new job requests until it's renewed; renewals arrive in the Documents tab.</p>
    </div>
  )
}

const KV = ({ k, v }: { k: string; v: string | null }) => (
  <div className="flex gap-2"><dt className="text-muted-foreground w-28 shrink-0">{k}</dt><dd className="font-semibold">{v || '–'}</dd></div>
)

// ---------- decision ----------
const REASONS = ['No general liability insurance', 'Insurance below $300,000', 'No business or city registration', "References didn't check out",
  'No reply to the test job', "Doesn't install the partitions our customers buy"]

function Decision({ a, d, areas, reload }: { a: Applicant; d: ApplicantDetail; areas: AreaCoverage[]; reload: () => void }) {
  const [mode, setMode] = useState<'none' | 'info' | 'reject'>('none')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [picked, setPicked] = useState<string[]>(a.areas.length ? a.areas : areas.slice(0, 1).map((x) => x.slug))
  const [phone, setPhone] = useState(a.trackedPhone ?? '')
  const act = useAction()
  const missing = REQUIRED.filter((r) => !r.ok(d.checks)).map((r) => r.label)
  const go = async (fn: () => Promise<unknown>) => { if (await act.run(fn)) { setMode('none'); reload() } }

  if (a.status === 'approved') {
    return (
      <Card>
        <Notice tone="ok"><b>Approved {a.approvedAt ? formatDay(a.approvedAt) : ''}.</b> {a.displayName} receives job requests in {a.areas.join(', ') || 'no area yet'}. {passed(d.checks, 'completed_job') ? 'Their profile is public.' : 'Their profile and the Approved label go live after their first completed job.'}</Notice>
        <div><Button variant="outline" busy={act.busy} onClick={() => go(() => portal().setStatus(a.id, 'suspended'))}>Pause new job requests</Button></div>
        {act.error && <Notice tone="error">{act.error}</Notice>}
      </Card>
    )
  }
  if (a.status === 'suspended') {
    return <Card><Notice>Paused: no new job requests.</Notice><div><Button busy={act.busy} onClick={() => go(() => portal().setStatus(a.id, 'approved'))}>Resume job requests</Button></div>{act.error && <Notice tone="error">{act.error}</Notice>}</Card>
  }
  if (a.status === 'delisted') return <Card><Notice>Rejected or delisted{a.decisionNote ? `: ${a.decisionNote}` : ''}. They can reapply once it's fixed.</Notice></Card>

  return (
    <Card title="Decision">
      {a.decisionNote && <Notice>Last request to the applicant: {a.decisionNote}</Notice>}
      <div className="grid sm:grid-cols-2 gap-3">
        <fieldset className="grid gap-1 text-sm"><legend className="font-semibold mb-1">Receives job requests in</legend>
          {areas.map((x) => <label key={x.slug} className="flex gap-2 items-center"><input type="checkbox" checked={picked.includes(x.slug)}
            onChange={() => setPicked(picked.includes(x.slug) ? picked.filter((s) => s !== x.slug) : [...picked, x.slug])} />{x.name}</label>)}
        </fieldset>
        <Field label="Tracked phone number for their profile" hint="From the call-tracking service, once it's set up. Optional for now.">
          <input className={INPUT} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button disabled={missing.length > 0 || picked.length === 0} busy={act.busy} onClick={() => go(() => portal().approve(a.id, { areas: picked, trackedPhone: phone.trim() || null }))}>Approve</Button>
        <Button variant="outline" onClick={() => setMode(mode === 'info' ? 'none' : 'info')}>Ask for more info</Button>
        <Button variant="outline" onClick={() => setMode(mode === 'reject' ? 'none' : 'reject')}>Reject</Button>
      </div>
      <p className="text-sm text-muted-foreground">{missing.length ? `Approve unlocks when these pass: ${missing.join(', ')}.` : 'All required checks pass. Approving lets them receive job requests now; we email them the listing agreement and next steps.'}</p>
      {mode === 'info' && (
        <div className="grid gap-2">
          <Field label="What do you need? (emailed to the applicant)"><textarea className={TEXTAREA} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please send an insurance certificate with the City of Dallas listed as certificate holder." /></Field>
          <div><Button variant="outline" disabled={!note.trim()} busy={act.busy} onClick={() => go(() => portal().vettingNotice(a.id, 'info_request', note.trim()))}>Send request</Button></div>
        </div>
      )}
      {mode === 'reject' && (
        <div className="grid gap-2">
          <Field label="Reason"><select className={INPUT} value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Note to the applicant (optional)"><textarea className={TEXTAREA} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What they'd need to fix to reapply" /></Field>
          <div><Button busy={act.busy} onClick={() => go(() => portal().vettingNotice(a.id, 'rejected', note.trim() ? `${reason}. ${note.trim()}` : reason))}>Send rejection</Button></div>
        </div>
      )}
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </Card>
  )
}

// ---------- the Approved checklist ----------
function Checklist({ a, d, reload }: { a: Applicant; d: ApplicantDetail; reload: () => void }) {
  const check = (t: CheckType) => d.checks.find((c) => c.checkType === t)
  const reg = check('city_registration')?.status === 'passed' ? check('city_registration') : check('business_registration') ?? check('city_registration')
  const locked = a.status === 'delisted'
  const save = async (t: CheckType, p: Partial<CheckDetail>) => {
    await portal().saveCheck(a.id, t, p)
    if (a.status === 'applied') await portal().setStatus(a.id, 'vetting')
  }
  const docs = d.uploads.filter((u) => u.checkType === 'insurance' || u.checkType === 'business_registration' || u.checkType === 'city_registration')

  return (
    <Card title="Approved checklist">
      <Row title="General liability insurance" c={check('insurance')}>
        <DocLinks paths={[check('insurance')?.documentPath, ...docs.filter((u) => u.checkType === 'insurance').map((u) => u.path)]} />
        {!locked && <VerifyForm defaultLabel="Insurance on file ($1M general liability)" c={check('insurance')} needsExpiry
          hint="$300,000 or more. For City of Dallas jobs the City must be the certificate holder." onSave={(p) => save('insurance', p)} reload={reload} />}
      </Row>
      <Row title="Business or city registration" c={reg}>
        <p className="text-sm">{a.registrationNumber ? `Number given: ${a.registrationNumber}.` : 'No number given.'} Texas has no statewide contractor license; check the city or the Texas Comptroller.</p>
        <DocLinks paths={docs.filter((u) => u.checkType !== 'insurance').map((u) => u.path)} />
        {!locked && <RegistrationForm c={reg} onSave={save} reload={reload} />}
      </Row>
      <Row title="References called" c={check('references')}>
        {d.references.length === 0 ? <p className="text-sm text-muted-foreground">None given.</p>
          : <ul className="grid gap-2">{d.references.map((r) => <RefRow key={r.id} r={r} locked={locked} reload={reload} />)}</ul>}
        {!locked && check('references')?.status !== 'passed' && (
          <SimplePass label="References check out" disabled={!d.references.some((r) => r.outcome === 'good')}
            onPass={() => save('references', { status: 'passed', verifiedAt: today(), publicLabel: plural(d.references.filter((r) => r.outcome === 'good').length, 'reference') + ' contacted' })} reload={reload} />
        )}
      </Row>
      <Row title="Test job request" c={check('response_test')}>
        <TestJob a={a} d={d} locked={locked} onResult={(ok, note) => save('response_test', { status: ok ? 'passed' : 'failed', verifiedAt: today(), internalNote: note })} reload={reload} />
      </Row>
      <Row title="Listing agreement signed" c={check('listing_agreement')}>
        <p className="text-sm">{a.agreementName ? `Agreed to sign if approved: ${a.agreementName}${a.agreementAcceptedAt ? `, ${formatDay(a.agreementAcceptedAt)}` : ''}.` : 'No agreement on the application.'} Send the full agreement for signature, then mark it signed.</p>
        {!locked && check('listing_agreement')?.status !== 'passed' && (
          <SimplePass label="Mark signed" onPass={() => save('listing_agreement', { status: 'passed', verifiedAt: today(), publicLabel: 'Signed listing agreement' })} reload={reload} />
        )}
      </Row>
      <Row title="First completed job" c={check('completed_job')}>
        <p className="text-sm text-muted-foreground">Recorded automatically when their first job for a Next Partitions customer is signed off. The Approved label and public profile show after it. Not needed to start receiving job requests.</p>
      </Row>
    </Card>
  )
}

function Row({ title, c, children }: { title: string; c?: CheckDetail; children: React.ReactNode }) {
  const s = c?.status ?? 'pending'
  const mark = s === 'passed' ? '✓' : s === 'failed' || s === 'expired' ? '✕' : '…'
  const tone = s === 'passed' ? 'text-emerald-800 border-emerald-700' : s === 'failed' || s === 'expired' ? 'text-red-800 border-red-700' : 'text-muted-foreground border-border'
  return (
    <section className="grid grid-cols-[2rem_1fr] gap-3 border-t border-border pt-3">
      <span className={`size-7 grid place-items-center border-2 font-bold ${tone}`} aria-label={s}>{mark}</span>
      <div className="grid gap-2">
        <b>{title}</b>
        {c?.status === 'passed' && <p className="text-sm text-emerald-800">Checked {formatDay(c.verifiedAt)}{c.expiresAt ? ` · expires ${formatDay(c.expiresAt)}` : ''}{c.publicLabel ? ` · profile shows "${c.publicLabel}"` : ''}</p>}
        {c?.internalNote && <p className="text-sm text-muted-foreground">Note: {c.internalNote}</p>}
        {children}
      </div>
    </section>
  )
}

function DocLinks({ paths }: { paths: (string | null | undefined)[] }) {
  const act = useAction()
  const list = [...new Set(paths.filter((p): p is string => !!p))]
  if (!list.length) return <p className="text-sm text-muted-foreground">No document uploaded.</p>
  return (
    <p className="text-sm flex flex-wrap gap-3">
      {list.map((p) => <button key={p} type="button" className="underline" onClick={() => act.run(async () => window.open(await portal().fileUrl('dir-documents', p), '_blank', 'noopener'))}>{p.split('/').pop()}</button>)}
      {act.error && <span className="text-red-800">{act.error}</span>}
    </p>
  )
}

function VerifyForm({ c, defaultLabel, needsExpiry, hint, onSave, reload }: {
  c?: CheckDetail; defaultLabel: string; needsExpiry?: boolean; hint?: string; onSave: (p: Partial<CheckDetail>) => Promise<void>; reload: () => void
}) {
  const [label, setLabel] = useState(c?.publicLabel ?? defaultLabel)
  const [expires, setExpires] = useState(c?.expiresAt ?? '')
  const [note, setNote] = useState(c?.internalNote ?? '')
  const act = useAction()
  const run = (p: Partial<CheckDetail>) => act.run(() => onSave(p)).then((ok) => ok && reload())
  return (
    <div className="grid gap-2">
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="grid sm:grid-cols-3 gap-2">
        <Field label="Profile shows"><input className={INPUT} value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        {needsExpiry && <Field label="Expires"><input className={INPUT} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>}
        <Field label="Internal note"><input className={INPUT} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" busy={act.busy} disabled={needsExpiry && !expires} onClick={() => run({ status: 'passed', verifiedAt: today(), publicLabel: label.trim() || null, expiresAt: expires || null, internalNote: note.trim() || null })}>Mark verified</Button>
        <Button variant="quiet" busy={act.busy} onClick={() => run({ status: 'failed', internalNote: note.trim() || null })}>Not accepted</Button>
      </div>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </div>
  )
}

function RegistrationForm({ c, onSave, reload }: { c?: CheckDetail; onSave: (t: CheckType, p: Partial<CheckDetail>) => Promise<void>; reload: () => void }) {
  const [kind, setKind] = useState<CheckType>(c?.checkType === 'city_registration' ? 'city_registration' : 'business_registration')
  return (
    <div className="grid gap-2">
      <Field label="What you checked"><select className={INPUT} value={kind} onChange={(e) => setKind(e.target.value as CheckType)}>
        <option value="city_registration">City contractor registration</option><option value="business_registration">Business registration (Texas)</option>
      </select></Field>
      <VerifyForm key={kind} c={c?.checkType === kind ? c : undefined} defaultLabel={kind === 'city_registration' ? 'City of Dallas contractor registration' : 'Texas business registration'}
        onSave={(p) => onSave(kind, p)} reload={reload} />
    </div>
  )
}

function SimplePass({ label, disabled, onPass, reload }: { label: string; disabled?: boolean; onPass: () => Promise<void>; reload: () => void }) {
  const act = useAction()
  return <div className="flex gap-3 items-center"><Button variant="outline" disabled={disabled} busy={act.busy} onClick={async () => { if (await act.run(onPass)) reload() }}>{label}</Button>{act.error && <span className="text-sm text-red-800">{act.error}</span>}</div>
}

function RefRow({ r, locked, reload }: { r: Reference; locked: boolean; reload: () => void }) {
  const [outcome, setOutcome] = useState<Reference['outcome']>(r.outcome ?? 'good')
  const [note, setNote] = useState(r.note ?? '')
  const act = useAction()
  return (
    <li className="bg-muted p-3 grid gap-2 text-sm">
      <span><b>{r.name}</b>{r.company ? `, ${r.company}` : ''} · {[r.phone, r.email].filter(Boolean).join(' · ')}{r.jobNote ? ` · ${r.jobNote}` : ''}</span>
      {r.calledAt && <span>Called {formatDay(r.calledAt)}: <b>{({ good: 'Good', mixed: 'Mixed', bad: 'Bad', no_answer: 'No answer' } as const)[r.outcome ?? 'no_answer']}</b>{r.note ? ` · ${r.note}` : ''}</span>}
      {!locked && (
        <div className="flex flex-wrap gap-2 items-end">
          <Field label="Outcome"><select className={INPUT} value={outcome ?? 'good'} onChange={(e) => setOutcome(e.target.value as Reference['outcome'])}>
            <option value="good">Good: would hire again</option><option value="mixed">Mixed</option><option value="bad">Bad</option><option value="no_answer">No answer</option>
          </select></Field>
          <div className="flex-1 min-w-48"><Field label="What they said"><input className={INPUT} value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
          <Button variant="outline" busy={act.busy} onClick={async () => { if (await act.run(() => portal().saveReference(r.id, { calledAt: new Date().toISOString(), outcome, note: note.trim() || null }))) reload() }}>{r.calledAt ? 'Update call' : 'Log call'}</Button>
        </div>
      )}
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </li>
  )
}

// Reply and firm-price times against the targets (1 and 2 business days; counted here in hours).
function TestJob({ a, d, locked, onResult, reload }: { a: Applicant; d: ApplicantDetail; locked: boolean; onResult: (ok: boolean, note: string) => Promise<void>; reload: () => void }) {
  const act = useAction()
  const t = d.testJob
  const hours = (from: string, to: string | null) => (to ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 36e5) : null)
  const result = d.checks.find((c) => c.checkType === 'response_test')?.status
  if (!t) {
    return (
      <div className="grid gap-2 text-sm">
        <p>Sends a realistic job request to their portal. We time the reply (target: 1 business day) and the firm price (target: 2).</p>
        {!a.hasLogin && <Notice>Give them a portal login first (Logins tab), so they can answer it.</Notice>}
        {!locked && <div><Button variant="outline" disabled={!a.hasLogin} busy={act.busy} onClick={async () => { if (await act.run(() => portal().sendTestJob(a.id))) reload() }}>Send test job request</Button></div>}
        {act.error && <Notice tone="error">{act.error}</Notice>}
      </div>
    )
  }
  const reply = hours(t.invite.sentAt, t.invite.respondedAt)
  const price = t.invite.priceCents !== null ? reply : null
  const ok = reply !== null && reply <= 24 && price !== null && price <= 48
  const summary = `Sent ${formatWhen(t.invite.sentAt)}. ${reply === null ? 'No reply yet.' : t.invite.declined ? `Declined after ${reply} h.` : `Firm price ${formatUsd(t.invite.priceCents!)} after ${reply} h.`}`
  return (
    <div className="grid gap-2 text-sm">
      <p>{summary} {reply !== null && <span className={reply <= 24 ? 'text-emerald-800' : 'text-red-800'}>(target 1 business day {reply <= 24 ? '✓' : '✕'})</span>}</p>
      {t.invite.assumptions && <p className="text-muted-foreground">Price assumes: {t.invite.assumptions}</p>}
      {!locked && result !== 'passed' && (
        <div className="flex gap-3">
          <Button variant="outline" busy={act.busy} disabled={reply === null} onClick={async () => { if (await act.run(() => onResult(true, summary))) reload() }}>Mark passed{ok ? ' (on target)' : ''}</Button>
          <Button variant="quiet" busy={act.busy} onClick={async () => { if (await act.run(() => onResult(false, summary))) reload() }}>Mark failed</Button>
        </div>
      )}
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </div>
  )
}

function Rates({ d }: { d: ApplicantDetail }) {
  if (!d.rates.length) return null
  const ex = d.rates[0].extras
  return (
    <Card title="Their rates (from the application)">
      <ul className="grid sm:grid-cols-2 gap-1 text-sm">
        {d.rates.map((r) => <li key={`${r.material}/${r.mounting}`}>{MATERIAL_LABEL[r.material]}, {MOUNTING_LABEL[r.mounting].toLowerCase()}: <b>{formatUsd(r.perStallLowCents)}{r.perStallHighCents !== r.perStallLowCents ? `–${formatUsd(r.perStallHighCents)}` : ''}</b> per stall</li>)}
      </ul>
      <p className="text-sm text-muted-foreground">
        Minimum {formatUsd(d.rates[0].minimumCents)}{ex.ada_stall_cents ? ` · ADA ${formatUsd(ex.ada_stall_cents)}` : ''}{ex.urinal_screen_cents ? ` · urinal screen ${formatUsd(ex.urinal_screen_cents)}` : ''}
        {ex.demo_per_stall_cents ? ` · removal ${formatUsd(ex.demo_per_stall_cents)}/stall` : ''}{ex.free_miles ? ` · ${ex.free_miles} mi included` : ''}{ex.per_mile_cents ? `, then ${formatUsd(ex.per_mile_cents)}/mi` : ''}
      </p>
    </Card>
  )
}
