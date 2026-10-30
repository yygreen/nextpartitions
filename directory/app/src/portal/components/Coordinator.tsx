import { quoteHref } from '../../directory/links'
import { useState } from 'react'
import { formatUsd } from '../../directory/estimate'
import { MATERIAL_LABEL, MOUNTING_LABEL, type Material, type Mounting } from '../../directory/types'
import { portal } from '../client'
import { coordinatorLabel, dollarsToCents, formatDay, formatDelivery, formatWhen } from '../stage'
import { CHECK_LABEL, type Invite, type InstallerSummary, type Job, type NewJob } from '../types'
import { Thread } from './Thread'
import { Badge, Button, Card, Field, INPUT, Notice, TEXTAREA, Tabs, useAction, useLoad, openFile } from './ui'
import { VettingView } from './Vetting'

// The job coordinator's side: jobs needing attention first, then everything in progress. Until the site's
// quote requests and payments are connected (directory/README.md), jobs are entered and moved on here by hand.
type Tab = 'jobs' | 'new' | 'vetting' | 'installers' | 'documents'

export function CoordinatorView() {
  const [tab, setTab] = useState<Tab>('jobs')
  const jobs = useLoad(() => portal().allJobs(), [])
  const people = useLoad(() => portal().installers(), [])
  const docs = useLoad(() => portal().uploads(), [])
  const attention = jobs.data?.filter((j) => j.job.needsAttention && !j.job.isTest).length ?? 0
  const applicants = people.data?.filter((p) => p.status === 'applied').length
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: 'jobs', label: 'Jobs', count: attention }, { id: 'new', label: 'New job' },
        { id: 'vetting', label: 'Vetting', count: applicants }, { id: 'installers', label: 'Logins' },
        { id: 'documents', label: 'Documents', count: docs.data?.length },
      ]} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {jobs.error && <Notice tone="error">{jobs.error}</Notice>}
        {tab === 'jobs' && jobs.data && people.data && (
          <JobsBoard rows={jobs.data} people={people.data} openId={openId} setOpenId={setOpenId} reload={jobs.reload} />
        )}
        {tab === 'new' && people.data && (
          <NewJobForm people={people.data} onCreated={(id) => { jobs.reload(); setOpenId(id); setTab('jobs') }} />
        )}
        {tab === 'vetting' && <VettingView />}
        {tab === 'installers' && people.data && <InstallersList people={people.data} reload={people.reload} />}
        {tab === 'documents' && docs.data && people.data && <DocumentsQueue uploads={docs.data} people={people.data} reload={docs.reload} />}
      </main>
    </>
  )
}

// ---------- jobs ----------
function JobsBoard({ rows, people, openId, setOpenId, reload }: {
  rows: { job: Job; invites: Invite[] }[]; people: InstallerSummary[]; openId: string | null; setOpenId: (id: string) => void; reload: () => void
}) {
  const [showDone, setShowDone] = useState(false)
  const done = (j: Job) => j.status === 'signed_off' || j.status === 'cancelled'
  const list = rows.filter((r) => !r.job.isTest && (showDone || !done(r.job)))
    .sort((a, b) => Number(b.job.needsAttention) - Number(a.job.needsAttention) || b.job.createdAt.localeCompare(a.job.createdAt))
  const open = rows.find((r) => r.job.id === openId)
  const name = (id: string | null) => people.find((p) => p.id === id)?.displayName ?? '–'

  return (
    <div className="grid gap-5">
      <div className="overflow-x-auto bg-card border border-border">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3 font-semibold">Job</th><th className="p-3 font-semibold">Where</th><th className="p-3 font-semibold">Partitions</th>
            <th className="p-3 font-semibold">Delivery</th><th className="p-3 font-semibold">Where it stands</th><th className="p-3 font-semibold">Installer</th>
          </tr></thead>
          <tbody>
            {list.map(({ job, invites }) => (
              <tr key={job.id} className={`border-b border-border cursor-pointer hover:bg-muted ${job.id === openId ? 'bg-surface-warm' : ''}`} onClick={() => setOpenId(job.id)}>
                <td className="p-3"><button type="button" className="font-semibold underline-offset-2 hover:underline text-left" onClick={() => setOpenId(job.id)}>{job.ref}</button></td>
                <td className="p-3">{job.city} {job.zip}</td>
                <td className="p-3">{job.scope.stalls} × {MATERIAL_LABEL[job.scope.material]}</td>
                <td className="p-3">{formatDelivery(job.delivery)}</td>
                <td className="p-3">{job.needsAttention && <><Badge tone="alert">Needs attention</Badge>{' '}</>}{coordinatorLabel(job, invites)}</td>
                <td className="p-3">{name(job.chosenInstallerId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-4 text-muted-foreground">No open jobs. Enter one under "New job".</p>}
      </div>
      <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />Show signed-off and cancelled jobs</label>
      {open && <JobPanel key={open.job.id} job={open.job} invites={open.invites} people={people} reload={reload} />}
    </div>
  )
}

function JobPanel({ job, invites, people, reload }: { job: Job; invites: Invite[]; people: InstallerSummary[]; reload: () => void }) {
  const { data: contact } = useLoad(() => portal().contact(job.id), [job.id])
  const { data: events } = useLoad(() => portal().events(job.id), [job.id])
  const act = useAction()
  const [pick, setPick] = useState('')
  const [thread, setThread] = useState<string | null>(invites[0]?.installerId ?? null)
  const [cancelling, setCancelling] = useState(false) // confirmed in the page: browser dialogs don't show everywhere
  const name = (id: string) => people.find((p) => p.id === id)?.displayName ?? 'Installer'
  const invitable = people.filter((p) => p.status === 'approved' && !invites.some((i) => i.installerId === p.id))
  const priced = invites.filter((i) => i.priceCents !== null && !i.declined)
  const now = () => new Date().toISOString()
  const go = async (fn: () => Promise<unknown>) => { if (await act.run(fn)) reload() }
  const s = job.scope

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
      <div className="grid gap-4">
        <Card>
          <div className="flex flex-wrap justify-between gap-2 items-baseline">
            <h2 className="text-2xl">{job.ref} · {job.city} {job.zip}</h2>
            {job.quoteRequestRef && <span className="text-sm text-muted-foreground">Quote request {job.quoteRequestRef}</span>}
          </div>
          <p className="text-sm">{s.stalls} stalls · {MATERIAL_LABEL[s.material]} · {MOUNTING_LABEL[s.mounting]}
            {s.ada ? ' · ADA stall' : ''}{s.urinal_screens ? ` · ${s.urinal_screens} urinal screens` : ''}{s.remove_stalls ? ` · remove ${s.remove_stalls}` : ''}
            {s.building ? ` · ${s.building}` : ''}. Delivery {formatDelivery(job.delivery)}{job.neededBy ? `, needed by ${formatDay(job.neededBy)}` : ''}.
            {job.rush ? ' Rush.' : ''}{job.requiresBackgroundCheck ? ' Background-checked crew.' : ''}</p>
          {job.needsAttention && (
            <div className="flex flex-wrap gap-3 items-center bg-amber-50 border border-amber-300 px-3 py-2 text-sm">
              <span><b>Needs attention:</b> {job.attentionReason ?? 'Check this job'}</span>
              <Button variant="outline" busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { needsAttention: false, attentionReason: null }))}>Mark handled</Button>
            </div>
          )}
          <p className="text-sm font-semibold">{coordinatorLabel(job, invites)}{job.priceDueAt && !job.windowClosedAt ? ` · prices due ${formatWhen(job.priceDueAt)}` : ''}</p>
        </Card>

        <Card title="Installer prices">
          {invites.length === 0 ? <p className="text-sm text-muted-foreground">Nobody invited yet.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-3 font-semibold">Installer</th><th className="pr-3 font-semibold">Asked</th><th className="pr-3 font-semibold">Their rates give</th><th className="pr-3 font-semibold">Firm price</th><th className="pr-3 font-semibold">Earliest</th><th /></tr></thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.installerId} className="border-t border-border align-top">
                    <td className="py-2 pr-3"><b>{name(i.installerId)}</b><span className="block text-xs text-muted-foreground">{i.invitedBy === 'preferred' ? 'Customer asked for them' : i.invitedBy === 'manual' ? 'Invited by hand' : i.invitedBy === 'widened' ? 'Wider search' : 'Routed'}</span></td>
                    <td className="pr-3">{formatWhen(i.sentAt)}{i.dueAt && <span className="block text-xs text-muted-foreground">due {formatWhen(i.dueAt)}</span>}</td>
                    <td className="pr-3">{i.estimateCents ? formatUsd(i.estimateCents) : '–'}</td>
                    <td className="pr-3">
                      {i.declined ? <span>Declined{i.declinedReason ? `: ${i.declinedReason}` : ''}</span>
                        : i.priceCents !== null ? <b>{formatUsd(i.priceCents)}</b> : <span className="text-muted-foreground">Waiting</span>}
                      <span className="flex flex-wrap gap-1 mt-1">
                        {i.late && <Badge tone="wait">Late</Badge>}
                        {i.priceFlag && <Badge tone="alert">{i.priceFlag === 'above_rates' ? '15%+ above their rates' : '15%+ above the area price'}</Badge>}
                      </span>
                      {i.priceFlag && <Button variant="quiet" busy={act.busy} onClick={() => go(() => portal().clearPriceFlag(job.id, i.installerId))}>Checked: show it to the customer</Button>}
                      {i.assumptions && <span className="block text-xs text-muted-foreground mt-1">Assumes: {i.assumptions}</span>}
                      {i.notes && <span className="block text-xs text-muted-foreground">Note: {i.notes}</span>}
                    </td>
                    <td className="pr-3">{formatDay(i.earliestInstallDate) || '–'}</td>
                    <td className="py-2">
                      {!job.chosenInstallerId && i.priceCents !== null && !i.declined && (
                        <Button variant="outline" busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { chosenInstallerId: i.installerId, status: 'installer_chosen' }))}>Customer chose</Button>
                      )}
                      {job.chosenInstallerId === i.installerId && <Badge tone="go">Chosen</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          <div className="flex flex-wrap gap-3 items-end">
            {invites.length === 0 && <Button busy={act.busy} onClick={() => go(async () => {
              const n = await portal().routeJob(job.id)
              if (n === 0) throw new Error('No listed installer covers this job. Invite one by hand, or offer partitions only.')
            })}>Route job (invite up to 3)</Button>}
            {!job.chosenInstallerId && invitable.length > 0 && (
              <div className="flex flex-wrap gap-2 items-end">
                <Field label="Invite by hand"><select className={INPUT} value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Choose a listed installer</option>
                  {invitable.map((p) => <option key={p.id} value={p.id}>{p.displayName} ({p.baseCity})</option>)}
                </select></Field>
                <Button variant="outline" disabled={!pick} busy={act.busy} onClick={() => go(async () => { await portal().inviteInstaller(job.id, pick); setPick('') })}>Invite</Button>
              </div>
            )}
            {!job.chosenInstallerId && priced.length > 0 && job.status !== 'presented' && (
              <Button variant="outline" busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { status: 'presented' }))}>Show prices on the customer's quote</Button>
            )}
          </div>
          {priced.length === 0 && job.windowClosedAt && !job.chosenInstallerId && (
            <Notice>No prices. Call the customer: partitions only now and installation later, or their own installer (install packet included).</Notice>
          )}
        </Card>

        {job.chosenInstallerId && (
          <Card title="Payment and release">
            <p className="text-sm text-muted-foreground">The customer's details and site address are released to {name(job.chosenInstallerId)} once the partitions order is paid or the purchase order is accepted. Undoing both hides them again.</p>
            <div className="flex flex-wrap gap-3">
              {!job.partitionsPaidAt
                ? <Button busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { partitionsPaidAt: now() }))}>Partitions order paid</Button>
                : <Button variant="outline" busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { partitionsPaidAt: null }))}>Undo: payment reversed</Button>}
              {!job.poAcceptedAt
                ? <Button variant="outline" busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { poAcceptedAt: now() }))}>Purchase order accepted</Button>
                : <Button variant="outline" busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { poAcceptedAt: null }))}>Undo: PO withdrawn</Button>}
              {!job.releasedAt && <Button variant="quiet" busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { chosenInstallerId: null, status: 'presented' }))}>Customer changed their mind</Button>}
            </div>
            <p className="text-sm font-semibold">{job.releasedAt ? `Released ${formatWhen(job.releasedAt)}` : 'Not released yet'}{job.installDate ? ` · install ${formatDay(job.installDate)}` : ''}</p>
            {job.status === 'installed' && <Button busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { status: 'signed_off' }))}>Customer signed off</Button>}
          </Card>
        )}
        {act.error && <Notice tone="error">{act.error}</Notice>}

        {events && events.length > 0 && (
          <Card title="Installer updates">
            <ul className="grid gap-2 text-sm">{events.map((e) => (
              <li key={e.id}><b>{e.status === 'installed' ? 'Installed' : 'Scheduled'}</b> · {formatWhen(e.createdAt)}{e.note ? ` · ${e.note}` : ''}
                {e.photoPaths.map((p, n) => <PhotoLink key={p} path={p} n={n + 1} />)}</li>
            ))}</ul>
          </Card>
        )}
      </div>

      <div className="grid gap-4">
        <Card title="Customer">
          {contact ? (
            <dl className="grid gap-1 text-sm">
              <dd><b>{contact.customerName}</b>{contact.company ? `, ${contact.company}` : ''}</dd>
              <dd><a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a>{contact.phone && <> · <a className="underline" href={`tel:${contact.phone}`}>{contact.phone}</a></>}</dd>
              {contact.siteAddress && <dd>{contact.siteAddress}</dd>}
              {contact.siteContact && <dd className="text-muted-foreground">{contact.siteContact}</dd>}
            </dl>
          ) : <p className="text-sm text-muted-foreground">No contact on file.</p>}
          <Drawings job={job} reload={reload} />
        </Card>
        <QuoteCard jobId={job.id} />
        {invites.length > 0 && (
          <Card title="Messages">
            <select aria-label="Conversation with" className={INPUT} value={thread ?? ''} onChange={(e) => setThread(e.target.value)}>
              {invites.map((i) => <option key={i.installerId} value={i.installerId}>{name(i.installerId)}</option>)}
            </select>
            {thread && <Thread key={thread} jobId={job.id} installerId={thread} as="next_partitions" released={job.chosenInstallerId === thread && !!job.releasedAt} />}
          </Card>
        )}
        {!job.releasedAt && job.status !== 'cancelled' && (
          cancelling
            ? <div className="grid gap-2 text-sm"><span>Cancel {job.ref}? Invited installers stop seeing it as open.</span>
                <span className="flex gap-3"><Button busy={act.busy} onClick={() => go(() => portal().updateJob(job.id, { status: 'cancelled', needsAttention: false }))}>Yes, cancel job</Button>
                  <Button variant="outline" onClick={() => setCancelling(false)}>Keep it</Button></span></div>
            : <Button variant="quiet" onClick={() => setCancelling(true)}>Cancel job</Button>
        )}
      </div>
    </div>
  )
}

function Drawings({ job, reload }: { job: Job; reload: () => void }) {
  const act = useAction()
  return (
    <div className="grid gap-2 border-t border-border pt-3 text-sm">
      <b>Shop drawings</b>
      {job.drawingsPath && <Button variant="outline" busy={act.busy} onClick={() => act.run(async () => openFile(await portal().fileUrl('dir-drawings', job.drawingsPath!)))}>Open</Button>}
      <label className="grid gap-1">{job.drawingsPath ? 'Replace' : 'Upload'} (PDF or image, up to 25 MB; invited installers can open them)
        <input type="file" accept="application/pdf,image/jpeg,image/png" className="font-normal" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f && await act.run(() => portal().uploadDrawings(job.id, f))) reload()
        }} />
      </label>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </div>
  )
}

function PhotoLink({ path, n }: { path: string; n: number }) {
  const act = useAction()
  return <> · <button type="button" className="underline" onClick={() => act.run(async () => openFile(await portal().fileUrl('dir-job-photos', path)))}>photo {n}</button></>
}

// ---------- new job ----------
const MATERIALS = Object.keys(MATERIAL_LABEL) as Material[]
const MOUNTINGS = Object.keys(MOUNTING_LABEL) as Mounting[]

function NewJobForm({ people, onCreated }: { people: InstallerSummary[]; onCreated: (id: string) => void }) {
  const [f, setF] = useState({
    quoteRequestRef: '', areaSlug: 'dallas', city: '', zip: '', material: 'hdpe' as Material, mounting: 'overhead_braced' as Mounting,
    stalls: '4', ada: true, urinals: '0', remove: '0', building: '', layout: '', color: '', notes: '', from: '', to: '', neededBy: '',
    preferred: '', rush: false, bg: false, name: '', company: '', email: '', phone: '', address: '', siteContact: '', route: true,
  })
  const [drawings, setDrawings] = useState<File | null>(null)
  const act = useAction()
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p })
  const text = (k: keyof typeof f, label: string, o: { required?: boolean; type?: string; hint?: string; pattern?: string } = {}) => (
    <Field label={label} hint={o.hint}><input className={INPUT} type={o.type ?? 'text'} required={o.required} pattern={o.pattern}
      value={f[k] as string} onChange={(e) => set({ [k]: e.target.value })} /></Field>
  )

  return (
    <form className="grid gap-5 max-w-4xl" onSubmit={async (e) => {
      e.preventDefault()
      let id = ''
      const ok = await act.run(async () => {
        const job: NewJob = {
          quoteRequestRef: f.quoteRequestRef.trim() || null, areaSlug: f.areaSlug.trim(), city: f.city.trim(), zip: f.zip.trim(),
          scope: { material: f.material, mounting: f.mounting, stalls: Number(f.stalls), ada: f.ada, urinal_screens: Number(f.urinals) || undefined,
            remove_stalls: Number(f.remove) || undefined, building: f.building.trim() || undefined, layout: f.layout.trim() || undefined,
            color: f.color.trim() || undefined, notes: f.notes.trim() || undefined },
          delivery: f.from ? { from: f.from, to: f.to || f.from } : null, neededBy: f.neededBy || null,
          preferredInstallerId: f.preferred || null, rush: f.rush, requiresBackgroundCheck: f.bg,
          contact: { customerName: f.name.trim(), company: f.company.trim() || null, email: f.email.trim(), phone: f.phone.trim() || null,
            siteAddress: f.address.trim() || null, siteContact: f.siteContact.trim() || null },
        }
        id = await portal().createJob(job, drawings)
        if (f.route) await portal().routeJob(id)
      })
      if (ok) onCreated(id)
    }}>
      <Card title="The job (installers see this)">
        <p className="text-sm text-muted-foreground">Enter a job once the customer has asked for the full quote with installation and the shop drawings are ready. Installers see everything in this box, never the customer's details.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {text('quoteRequestRef', 'Quote request number', { hint: 'From the site or CRM' })}
          {text('city', 'City', { required: true })}
          {text('zip', 'ZIP code', { required: true, pattern: '\\d{5}', hint: 'Sets the job location for routing' })}
          {text('areaSlug', 'Directory area', { required: true, hint: 'e.g. dallas' })}
          <Field label="Material"><select className={INPUT} value={f.material} onChange={(e) => set({ material: e.target.value as Material })}>{MATERIALS.map((m) => <option key={m} value={m}>{MATERIAL_LABEL[m]}</option>)}</select></Field>
          <Field label="Mounting"><select className={INPUT} value={f.mounting} onChange={(e) => set({ mounting: e.target.value as Mounting })}>{MOUNTINGS.map((m) => <option key={m} value={m}>{MOUNTING_LABEL[m]}</option>)}</select></Field>
          {text('stalls', 'Stalls', { required: true, type: 'number' })}
          {text('urinals', 'Urinal screens', { type: 'number' })}
          {text('remove', 'Old stalls to remove', { type: 'number' })}
          {text('building', 'Building', { hint: 'e.g. School (elementary)' })}
          {text('layout', 'Layout')}
          {text('color', 'Color')}
          {text('from', 'Delivery from', { type: 'date' })}
          {text('to', 'Delivery to', { type: 'date' })}
          {text('neededBy', 'Install needed by', { type: 'date' })}
        </div>
        <Field label="Site notes"><textarea className={TEXTAREA} rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Floor finished? Ceiling height, wall blocking, floor level and elevator, work hours" /></Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <label className="flex gap-2 items-center"><input type="checkbox" checked={f.ada} onChange={(e) => set({ ada: e.target.checked })} />Includes an ADA stall</label>
          <label className="flex gap-2 items-center"><input type="checkbox" checked={f.bg} onChange={(e) => set({ bg: e.target.checked })} />School or public job (background-checked crew)</label>
          <label className="flex gap-2 items-center"><input type="checkbox" checked={f.rush} onChange={(e) => set({ rush: e.target.checked })} />Rush (close once 2 prices are in)</label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Customer asked for a specific installer" hint="Only they are invited, unless they decline or miss the deadline.">
            <select className={INPUT} value={f.preferred} onChange={(e) => set({ preferred: e.target.value })}>
              <option value="">No</option>{people.filter((p) => p.status === 'approved').map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </Field>
          <Field label="Shop drawings (PDF or image)"><input type="file" accept="application/pdf,image/jpeg,image/png" className="text-sm font-normal" onChange={(e) => setDrawings(e.target.files?.[0] ?? null)} /></Field>
        </div>
      </Card>
      <Card title="The customer (hidden from installers until release)">
        <div className="grid sm:grid-cols-2 gap-3">
          {text('name', 'Name', { required: true })}
          {text('company', 'Company or organization')}
          {text('email', 'Email', { required: true, type: 'email' })}
          {text('phone', 'Phone', { type: 'tel' })}
          {text('address', 'Site address')}
          {text('siteContact', 'On-site contact and hours')}
        </div>
      </Card>
      <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={f.route} onChange={(e) => set({ route: e.target.checked })} />Invite installers now (up to 3, by the routing rules)</label>
      <div><Button type="submit" busy={act.busy}>Create job</Button></div>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </form>
  )
}

// ---------- installers and logins ----------
function InstallersList({ people, reload }: { people: InstallerSummary[]; reload: () => void }) {
  return (
    <Card title="Portal logins" className="max-w-4xl">
      <p className="text-sm text-muted-foreground">Give an applicant a login once their documents check out, so they can answer the test job request; listed installers need one to receive jobs. They get an email to set it up. Checks and approval are in the Vetting tab.</p>
      <ul className="grid gap-2">{people.map((p) => <InstallerRow key={p.id} p={p} reload={reload} />)}</ul>
    </Card>
  )
}

function InstallerRow({ p, reload }: { p: InstallerSummary; reload: () => void }) {
  const [email, setEmail] = useState('')
  const act = useAction()
  return (
    <li className="flex flex-wrap justify-between gap-3 items-center border-b border-border pb-2">
      <span><b>{p.displayName}</b> · {p.baseCity} <Badge tone={p.status === 'approved' ? 'go' : p.status === 'vetting' || p.status === 'applied' ? 'wait' : 'off'}>{p.status}</Badge></span>
      {p.hasLogin ? <span className="text-sm text-muted-foreground">Has a login</span> : (
        <form className="flex gap-2 items-center" onSubmit={async (e) => { e.preventDefault(); if (await act.run(() => portal().inviteLogin(p.id, email.trim()))) reload() }}>
          <label className="sr-only" htmlFor={`login-${p.id}`}>Login email for {p.displayName}</label>
          <input id={`login-${p.id}`} className={`${INPUT} w-64`} type="email" required placeholder="Login email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="outline" busy={act.busy}>Give login</Button>
        </form>
      )}
      {act.error && <span className="w-full"><Notice tone="error">{act.error}</Notice></span>}
    </li>
  )
}

// ---------- documents to review ----------
function DocumentsQueue({ uploads, people, reload }: { uploads: Awaited<ReturnType<ReturnType<typeof portal>['uploads']>>; people: InstallerSummary[]; reload: () => void }) {
  if (uploads.length === 0) return <Card><p>No documents waiting. Installers send renewed insurance and registrations from their portal.</p></Card>
  return (
    <div className="grid gap-3 max-w-4xl">
      {uploads.map((u) => <UploadReview key={u.id} u={u} installer={people.find((p) => p.id === u.installerId)?.displayName ?? 'Installer'} reload={reload} />)}
    </div>
  )
}

function UploadReview({ u, installer, reload }: { u: Awaited<ReturnType<ReturnType<typeof portal>['uploads']>>[number]; installer: string; reload: () => void }) {
  const [expires, setExpires] = useState('')
  const [note, setNote] = useState('')
  const act = useAction()
  return (
    <Card>
      <div className="flex flex-wrap justify-between gap-2"><b>{installer} · {CHECK_LABEL[u.checkType]}</b><span className="text-sm text-muted-foreground">Sent {formatWhen(u.uploadedAt)}</span></div>
      <div><Button variant="outline" busy={act.busy} onClick={() => act.run(async () => openFile(await portal().fileUrl('dir-documents', u.path)))}>Open document</Button></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Valid until" hint="Insurance: the policy end date. Leave empty if it doesn't expire."><input className={INPUT} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>
        <Field label="Note (the installer sees it)"><input className={INPUT} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Certificate must name Next Partitions' customers as additional insured" /></Field>
      </div>
      <div className="flex gap-3">
        <Button busy={act.busy} onClick={async () => { if (await act.run(() => portal().reviewUpload(u.id, { accepted: true, expiresAt: expires || null, note: note.trim() || null }))) reload() }}>Accept</Button>
        <Button variant="outline" busy={act.busy} onClick={async () => { if (await act.run(() => portal().reviewUpload(u.id, { accepted: false, expiresAt: null, note: note.trim() || 'Not accepted' }))) reload() }}>Not accepted</Button>
      </div>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </Card>
  )
}

// ---------- the customer's quote page ----------
// The customer opens /quote/<token> from our email: no login, and installers never see the token or these prices.
function QuoteCard({ jobId }: { jobId: string }) {
  const { data: q, reload } = useLoad(() => portal().quote(jobId), [jobId])
  const [f, setF] = useState<{ ref: string; parts: string; freight: string; tax: string; until: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const act = useAction()
  if (!q) return null
  const form = f ?? { ref: q.quoteRef ?? '', parts: q.partitionsCents ? String(q.partitionsCents / 100) : '', freight: q.freightCents ? String(q.freightCents / 100) : '',
    tax: q.taxNote ?? '', until: q.validUntil ?? '' }
  const link = typeof location !== 'undefined' ? new URL(quoteHref(q.token), location.href).toString() : `https://nextpartitions.com/quote/${q.token}`
  const done = (s: string | null, label: string) => s && <li>{label}</li>
  return (
    <Card title="Customer quote page">
      <div className="flex gap-2">
        <input aria-label="Quote link" readOnly className={`${INPUT} text-xs`} value={link} onFocus={(e) => e.target.select()} />
        <Button variant="outline" onClick={async () => { try { await navigator.clipboard?.writeText(link); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : 'Copy'}</Button>
        <a className="inline-flex items-center px-3 min-h-11 border border-border font-semibold hover:bg-muted" href={link} target={portal().sample ? undefined : '_blank'} rel="noopener">Open</a>
      </div>
      <p className="text-xs text-muted-foreground">The customer gets this link by email when you show the prices on their quote. Share it with the customer only: anyone with it can see the quote and choose an installer.</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Quote number"><input className={INPUT} value={form.ref} onChange={(e) => setF({ ...form, ref: e.target.value })} /></Field>
        <Field label="Valid until"><input className={INPUT} type="date" value={form.until} onChange={(e) => setF({ ...form, until: e.target.value })} /></Field>
        <Field label="Partitions ($)"><input className={INPUT} inputMode="decimal" value={form.parts} onChange={(e) => setF({ ...form, parts: e.target.value })} /></Field>
        <Field label="Freight ($)"><input className={INPUT} inputMode="decimal" value={form.freight} onChange={(e) => setF({ ...form, freight: e.target.value })} /></Field>
      </div>
      <Field label="Sales tax note"><input className={INPUT} value={form.tax} onChange={(e) => setF({ ...form, tax: e.target.value })} placeholder="e.g. Tax-exempt (school): send your certificate" /></Field>
      <div><Button variant="outline" busy={act.busy} disabled={!f} onClick={async () => {
        const ok = await act.run(() => portal().saveQuote(jobId, { quoteRef: form.ref.trim() || null, partitionsCents: dollarsToCents(form.parts), freightCents: dollarsToCents(form.freight),
          taxNote: form.tax.trim() || null, validUntil: form.until || null }))
        if (ok) { setF(null); reload() }
      }}>Save quote</Button></div>
      <ul className="text-sm list-disc pl-5">
        {done(q.drawingsApprovedAt, `Drawings approved ${formatDay(q.drawingsApprovedAt)}`)}
        {q.changeRequest && <li>Change requested: {q.changeRequest}</li>}
        {q.customerChoice && <li>Customer chose: {({ wait: 'keep waiting for prices', partitions_only: 'partitions only, install later', own_installer: 'their own installer' } as const)[q.customerChoice]}</li>}
        {q.paymentMethod && <li>Paying by {({ po: `purchase order ${q.poNumber ?? ''}`, card: 'card (send a payment link)', ach: 'bank transfer (send details and a pro forma invoice)' } as const)[q.paymentMethod]}</li>}
      </ul>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </Card>
  )
}
