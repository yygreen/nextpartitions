import { useState } from 'react'
import { formatUsd } from '../../directory/estimate'
import { MATERIAL_LABEL, MOUNTING_LABEL } from '../../directory/types'
import { portal } from '../client'
import {
  STAGE, canPrice, dollarsToCents, formatDay, formatDelivery, formatWhen, inboxOrder, installerStage, type Stage,
} from '../stage'
import type { Contact, Invite, InstallerSelf, Job } from '../types'
import { Thread } from './Thread'
import { Badge, Button, Card, Field, INPUT, Notice, Steps, TEXTAREA, useAction, useLoad } from './ui'

type Row = { job: Job; invite: Invite; stage: Stage }

export function InstallerJobs({ me, rows, reload }: { me: InstallerSelf; rows: Row[]; reload: () => void }) {
  const sorted = [...rows].sort((a, b) => inboxOrder(a.stage) - inboxOrder(b.stage) || b.job.createdAt.localeCompare(a.job.createdAt))
  const [openId, setOpenId] = useState<string | null>(sorted[0]?.job.id ?? null)
  const open = sorted.find((r) => r.job.id === openId) ?? sorted[0]

  if (rows.length === 0) {
    return <Card><p>No job requests yet. When a customer in your area asks for installation with their partitions order, the request appears here and we email you.</p></Card>
  }
  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-5 items-start">
      <div className="grid gap-2">
        <h2 className="text-lg">Job requests</h2>
        <ul className="grid gap-2">
          {sorted.map(({ job, invite, stage }) => (
            <li key={job.id}>
              <button type="button" onClick={() => setOpenId(job.id)} aria-current={job.id === open?.job.id}
                className={`w-full text-left bg-card border p-3 grid gap-1 ${job.id === open?.job.id ? 'border-brand-red' : 'border-border hover:border-foreground/40'}`}>
                <span className="flex justify-between gap-2"><b>{job.city} · {job.scope.stalls} stalls</b><span className="text-xs text-muted-foreground">{job.ref}</span></span>
                <span className="text-sm text-muted-foreground">{MATERIAL_LABEL[job.scope.material]} · delivery {formatDelivery(job.delivery)}</span>
                <span className="flex flex-wrap gap-1.5 items-center">
                  <Badge tone={STAGE[stage].tone}>{STAGE[stage].label}</Badge>
                  {(stage === 'new' || stage === 'late') && invite.dueAt && <span className="text-xs text-muted-foreground">Price by {formatWhen(invite.dueAt)}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open && <JobDetail key={open.job.id} me={me} row={open} reload={reload} />}
    </div>
  )
}

function JobDetail({ me, row: { job, invite, stage }, reload }: { me: InstallerSelf; row: Row; reload: () => void }) {
  const released = !!job.releasedAt && job.chosenInstallerId === me.id
  const { data: contact } = useLoad(() => (released ? portal().contact(job.id) : Promise.resolve(null)), [job.id, released])
  const drawings = useAction()
  const s = job.scope

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap justify-between gap-2 items-baseline">
          <h2 className="text-2xl">{job.city} {job.zip}</h2>
          <span className="text-sm text-muted-foreground">{job.ref}{invite.invitedBy === 'preferred' ? ' · the customer asked for you' : ''}</span>
        </div>
        <Steps at={STAGE[stage].step} />
        <Badge tone={STAGE[stage].tone}>{STAGE[stage].label}</Badge>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Item k="Partitions" v={`${s.stalls} stalls · ${MATERIAL_LABEL[s.material]} · ${MOUNTING_LABEL[s.mounting]}`} />
          {s.building && <Item k="Building" v={s.building} />}
          <Item k="Extras" v={[s.ada && 'ADA stall', s.urinal_screens && `${s.urinal_screens} urinal screens`, s.remove_stalls && `remove ${s.remove_stalls} old stalls`].filter(Boolean).join(' · ') || 'None'} />
          {(s.layout || s.color) && <Item k="Layout and color" v={[s.layout, s.color].filter(Boolean).join(' · ')} />}
          <Item k="Partitions delivered" v={formatDelivery(job.delivery)} />
          {job.neededBy && <Item k="Install needed by" v={formatDay(job.neededBy)} />}
          {job.requiresBackgroundCheck && <Item k="Site rules" v="School or public job: background-checked crew" />}
        </dl>
        {s.notes && <p className="text-sm bg-muted px-3 py-2">{s.notes}</p>}
        <div className="flex flex-wrap gap-3 items-center">
          {job.drawingsPath
            ? <Button variant="outline" busy={drawings.busy} onClick={() => drawings.run(async () => window.open(await portal().fileUrl('dir-drawings', job.drawingsPath!), '_blank', 'noopener'))}>Open shop drawings</Button>
            : <span className="text-sm text-muted-foreground">Shop drawings to follow</span>}
          {drawings.error && <span className="text-sm text-red-800">{drawings.error}</span>}
        </div>
      </Card>

      {canPrice(job, invite) && <PriceForm me={me} job={job} invite={invite} reload={reload} />}
      {stage === 'declined' && <Notice>You declined this job{invite.declinedReason ? `: ${invite.declinedReason}` : ''}. Thanks for letting us know quickly.</Notice>}
      {stage === 'lost' && <Notice>The customer chose another installer. On jobs with 3 or more prices we'll send you an anonymous note on how your price compared.</Notice>}
      {stage === 'chosen' && <Notice>The customer chose you. Their details and the site address unlock as soon as they pay for the partitions order (or we accept their purchase order). We'll email you.</Notice>}
      {released && <ReleasedJob job={job} contact={contact} reload={reload} />}

      <Card title="Messages with Next Partitions">
        <Thread jobId={job.id} installerId={me.id} as="installer" released={released} />
      </Card>
    </div>
  )
}

const Item = ({ k, v }: { k: string; v: string }) => (
  <div><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
)

function PriceForm({ me, job, invite, reload }: { me: InstallerSelf; job: Job; invite: Invite; reload: () => void }) {
  const [price, setPrice] = useState(invite.priceCents ? String(invite.priceCents / 100) : invite.estimateCents ? String(invite.estimateCents / 100) : '')
  const [date, setDate] = useState(invite.earliestInstallDate ?? '')
  const [assumptions, setAssumptions] = useState(invite.assumptions ?? '')
  const [notes, setNotes] = useState(invite.notes ?? '')
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const act = useAction()
  const cents = dollarsToCents(price)
  const over = cents && invite.estimateCents ? cents > invite.estimateCents * 1.15 : false

  if (declining) {
    return (
      <Card title="Decline this job">
        <Field label="Why? (optional, only Next Partitions sees it)">
          <input className={INPUT} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fully booked that week" />
        </Field>
        <div className="flex gap-3">
          <Button busy={act.busy} onClick={async () => { if (await act.run(() => portal().declineInvite(job.id, me.id, reason))) reload() }}>Decline job</Button>
          <Button variant="outline" onClick={() => setDeclining(false)}>Back</Button>
        </div>
        {act.error && <Notice tone="error">{act.error}</Notice>}
      </Card>
    )
  }
  return (
    <Card title={invite.priceCents ? 'Your firm price (you can change it until the customer chooses)' : 'Send your firm price'}>
      {invite.estimateCents && <p className="text-sm text-muted-foreground">Your agreed rates give <b className="text-foreground">{formatUsd(invite.estimateCents)}</b> for this job. The customer saw an estimate from your rates; a firm price more than 15% above it is checked by Next Partitions before the customer sees it.</p>}
      <form className="grid gap-3" onSubmit={async (e) => {
        e.preventDefault()
        if (!cents) return
        const ok = await act.run(() => portal().answerInvite(job.id, me.id, {
          priceCents: cents, earliestInstallDate: date || null, assumptions: assumptions.trim() || null, notes: notes.trim() || null,
        }))
        if (ok) reload()
      }}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Installation price (USD)">
            <input className={INPUT} inputMode="decimal" required value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Earliest install date">
            <input className={INPUT} type="date" min={job.delivery?.from} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        {over && <Notice>This is more than 15% above what your rates give. Say why under "Price assumes" so we can explain it to the customer.</Notice>}
        <Field label="Price assumes" hint="Site conditions your price is based on. A change order is only valid when the site differs from these.">
          <textarea className={TEXTAREA} rows={2} value={assumptions} onChange={(e) => setAssumptions(e.target.value)} placeholder="e.g. Finished floor, blocking in place, ground-floor access, work during school hours" />
        </Field>
        <Field label="Notes for Next Partitions (optional)">
          <textarea className={TEXTAREA} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-3 items-center">
          <Button type="submit" busy={act.busy} disabled={!cents}>{invite.priceCents ? 'Update price' : 'Send price'}</Button>
          {!invite.priceCents && <Button variant="quiet" onClick={() => setDeclining(true)}>Can't take it? Decline</Button>}
        </div>
        {act.error && <Notice tone="error">{act.error}</Notice>}
        <p className="text-xs text-muted-foreground">You contract and invoice installation directly with the customer. Next Partitions adds nothing to your price.</p>
      </form>
    </Card>
  )
}

function ReleasedJob({ job, contact, reload }: { job: Job; contact: Contact | null; reload: () => void }) {
  const [date, setDate] = useState(job.installDate ?? '')
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const act = useAction()
  const done = job.status === 'installed' || job.status === 'signed_off'

  return (
    <>
      <Card title="Customer and site">
        {contact ? (
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Item k="Customer" v={[contact.customerName, contact.company].filter(Boolean).join(', ')} />
            <div><dt className="text-muted-foreground">Contact</dt><dd className="font-semibold">
              {contact.phone && <a className="underline" href={`tel:${contact.phone}`}>{contact.phone}</a>}{contact.phone && ' · '}
              <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a></dd></div>
            {contact.siteAddress && <Item k="Site address" v={contact.siteAddress} />}
            {contact.siteContact && <Item k="On site" v={contact.siteContact} />}
          </dl>
        ) : <p className="text-sm text-muted-foreground">Loading…</p>}
      </Card>
      {!done && (
        <Card title={job.status === 'scheduled' ? 'Install date' : 'Set the install date'}>
          <p className="text-sm text-muted-foreground">Partitions arrive {formatDelivery(job.delivery)}. Agree the date with the customer, then set it here so we can line up delivery.</p>
          <div className="flex flex-wrap gap-3 items-end">
            <Field label="Install date"><input className={INPUT} type="date" min={job.delivery?.from} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Button busy={act.busy} disabled={!date || date === job.installDate} onClick={async () => { if (await act.run(() => portal().schedule(job.id, date))) reload() }}>
              {job.status === 'scheduled' ? 'Change date' : 'Set date'}
            </Button>
          </div>
        </Card>
      )}
      {job.status === 'scheduled' && (
        <Card title="Mark as installed">
          <Field label="Photos of the finished restroom (optional)">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="text-sm font-normal"
              onChange={(e) => setPhotos([...(e.target.files ?? [])])} />
          </Field>
          <Field label="Note (optional)"><textarea className={TEXTAREA} rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Button busy={act.busy} onClick={async () => { if (await act.run(() => portal().markInstalled(job.id, note.trim() || null, photos))) reload() }}>Mark installed</Button>
          <p className="text-xs text-muted-foreground">We then ask the customer for a review. Reviews are published unedited.</p>
        </Card>
      )}
      {done && <Notice tone="ok">Installed. Thanks! We've asked the customer for a review.</Notice>}
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </>
  )
}

export function rowsFor(me: InstallerSelf, list: { job: Job; invite: Invite }[]): Row[] {
  return list.map((r) => ({ ...r, stage: installerStage(r.job, r.invite, me.id) }))
}
