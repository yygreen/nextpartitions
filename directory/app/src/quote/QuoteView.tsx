import { useState } from 'react'
import { DISCLAIMER } from '../directory/config'
import { formatUsd } from '../directory/estimate'
import { installerHref } from '../directory/links'
import { MATERIAL_LABEL, MOUNTING_LABEL } from '../directory/types'
import { Badge, Button, Card, Field, INPUT, Notice, TEXTAREA, WRAP, useAction, useLoad } from '../portal/components/ui'
import { formatDay, formatDelivery } from '../portal/stage'
import { type CustomerQuote, type QuotePrice, QUOTE_SAMPLE_NOTICE, quotes } from './api'

// /quote/<token>: the quote a customer gets once installers have priced the job (prototypes/customer-quote.html).
// 1. Approve the shop drawings  2. Choose installation  3. Pay for the partitions (PO, card link or bank transfer).
export function QuoteView({ token }: { token: string }) {
  const { data, error, reload } = useLoad(() => quotes().get(token).then((q) => ({ q })), [token])
  if (error) return <Page><Notice tone="error">{error}</Notice></Page>
  if (!data) return <Page><p>Loading your quote…</p></Page>
  const q = data.q
  if (!q) return <Page><Card title="Quote not found"><p>This link doesn't match a quote. Check the link in our email, or call 1-833-997-7489.</p></Card></Page>

  const total = (q.partitionsCents ?? 0) + (q.freightCents ?? 0)
  const chosen = q.prices.find((p) => p.installerId === q.chosenInstallerId)
  return (
    <Page sample={quotes().sample}>
      <section className="grid gap-1">
        <p className="text-sm text-muted-foreground">{q.quoteRef ? `Quote ${q.quoteRef}` : `Job ${q.ref}`}{q.validUntil ? ` · valid until ${formatDay(q.validUntil)}` : ''}</p>
        <h1 className="text-3xl md:text-4xl font-black">Your restroom partitions, {q.city}</h1>
        <p className="text-muted-foreground">For {q.customerName}{q.company ? `, ${q.company}` : ''}{q.scope.building ? ` · ${q.scope.building}` : ''} · {q.city} {q.zip}</p>
      </section>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="grid gap-5">
          <Drawings token={token} q={q} reload={reload} />
          <Installation token={token} q={q} reload={reload} />
          <Payment token={token} q={q} total={total} reload={reload} />
        </div>
        <aside className="grid gap-4 lg:sticky lg:top-4">
          <Card title="Summary">
            <dl className="grid gap-1.5 text-sm">
              <Line k="Partitions" v={q.partitionsCents !== null ? formatUsd(q.partitionsCents) : 'In your quote email'} />
              <Line k="Freight" v={q.freightCents !== null ? formatUsd(q.freightCents) : '–'} />
              <Line k="Sales tax" v={q.taxNote ?? 'Added to your invoice'} />
              <div className="flex justify-between border-t border-border pt-2 font-bold"><dt>Due to Next Partitions</dt><dd>{total ? formatUsd(total) : '–'}</dd></div>
              <Line k="Installation" v={chosen ? `${formatUsd(chosen.priceCents)}, paid to ${chosen.displayName}` : q.customerChoice === 'own_installer' ? 'Your own installer' : 'Not chosen yet'} />
            </dl>
          </Card>
          <Card>
            <p className="text-sm"><b>Questions?</b> Next Partitions · <a className="underline" href="tel:18339977489">1-833-997-7489</a> · <a className="underline" href="mailto:sales@nextpartitions.com">sales@nextpartitions.com</a></p>
          </Card>
        </aside>
      </div>
    </Page>
  )
}

function Page({ children, sample }: { children: React.ReactNode; sample?: boolean }) {
  return (
    <>
      {sample && <div className="bg-surface-warm text-muted-foreground border-b border-border text-sm text-center px-4 py-2">{QUOTE_SAMPLE_NOTICE}</div>}
      <main className={`${WRAP} py-8 grid gap-6`}>
        {children}
        <p className="text-sm text-muted-foreground border-t border-border pt-4">{DISCLAIMER}</p>
      </main>
    </>
  )
}

const Line = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>

function Step({ n, title, done, children }: { n: number; title: string; done?: string | false; children: React.ReactNode }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {n}</p>
      <h2 className="text-2xl -mt-2">{title}</h2>
      {done && <Notice tone="ok">✓ {done}</Notice>}
      {children}
    </Card>
  )
}

// ---------- 1. drawings ----------
function Drawings({ token, q, reload }: { token: string; q: CustomerQuote; reload: () => void }) {
  const [changing, setChanging] = useState(false)
  const [text, setText] = useState('')
  const act = useAction()
  const s = q.scope
  return (
    <Step n={1} title="Review your shop drawings" done={q.drawingsApprovedAt ? `Drawings approved ${formatDay(q.drawingsApprovedAt)}` : false}>
      <p className="text-sm text-muted-foreground">Your partitions, measured and drawn for your restroom. Check the layout and sizes before you choose installation.</p>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Line k="Material" v={`${MATERIAL_LABEL[s.material]}${s.color ? `, ${s.color}` : ''}`} />
        <Line k="Bracing" v={MOUNTING_LABEL[s.mounting]} />
        <Line k="Stalls" v={`${s.stalls}${s.ada ? ', including an accessible (ADA) stall' : ''}`} />
        {s.layout && <Line k="Layout" v={s.layout} />}
        {s.urinal_screens ? <Line k="Urinal screens" v={String(s.urinal_screens)} /> : null}
        <Line k="Delivery" v={`${formatDelivery(q.delivery)}, to the job site`} />
      </dl>
      {q.hasDrawings
        ? <div><Button variant="outline" busy={act.busy} onClick={() => act.run(async () => window.open(await quotes().drawingsUrl(token), '_blank', 'noopener'))}>Open shop drawings (PDF)</Button></div>
        : <Notice>Your shop drawings are being prepared. We'll email you when they're ready (usually within 2 business days).</Notice>}
      {q.changeRequest && !q.drawingsApprovedAt && <Notice>You asked for a change: "{q.changeRequest}". We'll send updated drawings within 1 business day.</Notice>}
      {q.hasDrawings && !q.drawingsApprovedAt && !q.paid && (
        <>
          <div className="flex flex-wrap gap-3">
            <Button busy={act.busy} onClick={async () => { if (await act.run(() => quotes().approveDrawings(token))) reload() }}>The layout and sizes are correct</Button>
            <Button variant="outline" onClick={() => setChanging(!changing)}>Request a change</Button>
          </div>
          <p className="text-xs text-muted-foreground">We make your partitions from these drawings once you've approved them and paid.</p>
        </>
      )}
      {changing && (
        <form className="grid gap-2" onSubmit={async (e) => { e.preventDefault(); if (text.trim() && await act.run(() => quotes().requestChange(token, text.trim()))) { setChanging(false); setText(''); reload() } }}>
          <Field label="What should change?"><textarea className={TEXTAREA} rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. The ADA stall should be on the left." /></Field>
          <div><Button type="submit" variant="outline" busy={act.busy}>Send to Next Partitions</Button></div>
        </form>
      )}
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </Step>
  )
}

// ---------- 2. installation ----------
function Installation({ token, q, reload }: { token: string; q: CustomerQuote; reload: () => void }) {
  const act = useAction()
  const [sort, setSort] = useState<'value' | 'price' | 'date'>('value')
  const chosen = q.prices.find((p) => p.installerId === q.chosenInstallerId)
  const ready = q.prices.length > 0
  const typical = ready ? q.prices.reduce((n, p) => n + p.priceCents, 0) / q.prices.length : 0
  // Best value: price against the others, rating and earliest date, as in docs/job-routing.md.
  // Lower is better: 10% cheaper outweighs half a star or ten days later.
  const days = (d: string | null) => (d ? (new Date(d).getTime() - Date.now()) / 864e5 : 60)
  const value = (p: QuotePrice) => p.priceCents / typical - ((p.rating ?? 4.5) - 4.5) * 0.2 + days(p.earliestInstallDate) * 0.01
  const list = [...q.prices].sort((a, b) => sort === 'price' ? a.priceCents - b.priceCents
    : sort === 'date' ? (a.earliestInstallDate ?? '9').localeCompare(b.earliestInstallDate ?? '9') : value(a) - value(b))
  const fallback = (c: 'wait' | 'partitions_only' | 'own_installer') => act.run(() => quotes().fallback(token, c)).then((ok) => ok && reload())

  return (
    <Step n={2} title="Choose installation" done={chosen ? `${chosen.displayName} will install your partitions` : q.customerChoice === 'own_installer' ? "You're using your own installer. We've emailed the install packet." : q.customerChoice === 'partitions_only' ? 'Partitions only for now. Add installation any time before delivery.' : false}>
      <p className="text-sm text-muted-foreground">Firm prices from verified installers who saw your drawings. Installation is quoted and billed by the installer. Next Partitions adds no markup and coordinates delivery and install dates.</p>
      {!ready && !chosen && (
        q.windowClosed || q.searchRound >= 2
          ? <>
              <Notice>Lining up an installer is taking longer than usual{q.searchRound >= 2 ? '. We have widened the search to installers further away' : ''}. You can:</Notice>
              <div className="grid gap-2">
                <Button variant="outline" busy={act.busy} onClick={() => fallback('wait')}>Keep waiting for prices</Button>
                <Button variant="outline" busy={act.busy} onClick={() => fallback('partitions_only')}>Go ahead with partitions only and add installation later</Button>
                <Button variant="outline" busy={act.busy} onClick={() => fallback('own_installer')}>Use my own installer (install packet included)</Button>
              </div>
              {q.customerChoice === 'wait' && <p className="text-sm">Thanks. We'll email you as soon as prices are in.</p>}
            </>
          : <Notice>Verified installers near {q.city} are pricing your job from the drawings. We'll email you when prices are in, usually within 2 business days.</Notice>
      )}
      {ready && !chosen && (
        <>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className="text-muted-foreground">Sort by</span>
            {(['value', 'price', 'date'] as const).map((s) => <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}
              className={`px-3 min-h-9 border ${sort === s ? 'border-brand-red font-semibold' : 'border-border'}`}>{{ value: 'Best value', price: 'Lowest price', date: 'Earliest date' }[s]}</button>)}
          </div>
          <ul className="grid gap-3">
            {list.map((p, n) => (
              <li key={p.installerId} className="border border-border p-4 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                <div className="grid gap-1">
                  <span className="flex flex-wrap gap-2 items-center"><b className="text-lg">{p.displayName}</b>{n === 0 && sort === 'value' && <Badge tone="new">Best value</Badge>}</span>
                  <span className="text-sm text-muted-foreground">{p.baseCity} · {p.installs ? 'Approved installer' : 'Verified installer, new to Next Partitions'}{p.rating !== null && p.reviewCount > 0 ? ` · ★ ${p.rating} (${p.reviewCount} reviews)` : ''}{p.installs ? ` · ${p.installs} installs for our customers` : ''}</span>
                  {p.earliestInstallDate && <span className="text-sm">Earliest install {formatDay(p.earliestInstallDate)}</span>}
                  {p.assumptions && <span className="text-sm text-muted-foreground">Price assumes: {p.assumptions}</span>}
                  {p.listed && <a className="text-sm underline" href={installerHref(p.slug)} target="_blank" rel="noopener">See their profile and reviews</a>}
                </div>
                <div className="grid gap-2 justify-items-start sm:justify-items-end">
                  <b className="text-2xl">{formatUsd(p.priceCents)}</b>
                  <Button busy={act.busy} disabled={!q.drawingsApprovedAt} onClick={async () => { if (await act.run(() => quotes().choose(token, p.installerId))) reload() }}>Choose {p.displayName.split(' ')[0]}</Button>
                </div>
              </li>
            ))}
          </ul>
          {!q.drawingsApprovedAt && <p className="text-sm text-muted-foreground">Approve your drawings in step 1 to choose an installer.</p>}
          <div className="flex flex-wrap gap-3 text-sm">
            <Button variant="quiet" busy={act.busy} onClick={() => fallback('partitions_only')}>Partitions only for now</Button>
            <Button variant="quiet" busy={act.busy} onClick={() => fallback('own_installer')}>Use my own installer</Button>
          </div>
        </>
      )}
      {chosen && <p className="text-sm">{q.paid ? `${chosen.displayName} now has your contact details and site address to schedule the install.` : `${chosen.displayName} gets your contact details and site address once the partitions are paid.`}{q.installDate ? ` Install date: ${formatDay(q.installDate)}.` : ''}</p>}
      <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
      {act.error && <Notice tone="error">{act.error}</Notice>}
    </Step>
  )
}

// ---------- 3. payment ----------
// No payment is taken on this page: the customer says how they'll pay and the job coordinator follows up.
function Payment({ token, q, total, reload }: { token: string; q: CustomerQuote; total: number; reload: () => void }) {
  const [method, setMethod] = useState<'po' | 'card' | 'ach'>(q.paymentMethod ?? 'po')
  const [po, setPo] = useState(q.poNumber ?? '')
  const act = useAction()
  const canPay = !!q.drawingsApprovedAt && (!!q.chosenInstallerId || q.customerChoice === 'partitions_only' || q.customerChoice === 'own_installer')
  if (q.paid) {
    return (
      <Step n={3} title="Your partitions are ordered" done="Payment received">
        <ol className="grid gap-1 text-sm list-decimal pl-5">
          <li>Production and shipping: we email tracking when your partitions ship.</li>
          <li>Delivery to the job site: {formatDelivery(q.delivery)}.</li>
          {q.chosenInstallerId && <li>Installation{q.installDate ? ` on ${formatDay(q.installDate)}` : ', usually the week after delivery'}, then we ask how it went.</li>}
        </ol>
      </Step>
    )
  }
  const sent = q.paymentMethod && {
    po: `Thanks. We'll confirm purchase order ${q.poNumber} within 1 business day.`,
    card: `Thanks. We'll email a secure card payment link to ${q.email} within 1 business day.`,
    ach: `Thanks. We'll email bank details and a pro forma invoice to ${q.email}. Your partitions are ordered when the transfer arrives.`,
  }[q.paymentMethod]
  return (
    <Step n={3} title="Pay for your partitions" done={false}>
      <p className="text-sm text-muted-foreground">Partitions and freight are paid to Next Partitions{total ? `: ${formatUsd(total)}` : ''}. Installation is paid to the installer.</p>
      {sent && <Notice tone="ok">{sent}</Notice>}
      {!canPay && <p className="text-sm text-muted-foreground">Approve your drawings and choose installation (or partitions only) first.</p>}
      {canPay && (
        <form className="grid gap-3" onSubmit={async (e) => { e.preventDefault(); if (await act.run(() => quotes().payment(token, method, method === 'po' ? po.trim() : null))) reload() }}>
          <fieldset className="grid sm:grid-cols-3 gap-2">
            <legend className="sr-only">How will you pay?</legend>
            {([['po', 'Purchase order', 'Schools and public buyers'], ['card', 'Card', 'We email a secure payment link'], ['ach', 'Bank transfer (ACH)', 'Details by email']] as const).map(([v, l, d]) => (
              <label key={v} className={`border p-3 grid gap-0.5 cursor-pointer ${method === v ? 'border-brand-red' : 'border-border'}`}>
                <span className="flex gap-2 items-center font-semibold"><input type="radio" name="pay" checked={method === v} onChange={() => setMethod(v)} />{l}</span>
                <span className="text-xs text-muted-foreground">{d}</span>
              </label>
            ))}
          </fieldset>
          {method === 'po' && <Field label="PO number"><input className={INPUT} required value={po} onChange={(e) => setPo(e.target.value)} /></Field>}
          {method === 'po' && <p className="text-xs text-muted-foreground">Email the PO document and any tax-exempt certificate to sales@nextpartitions.com.</p>}
          <div><Button type="submit" busy={act.busy}>{q.paymentMethod ? 'Update payment method' : 'Continue'}</Button></div>
          {act.error && <Notice tone="error">{act.error}</Notice>}
        </form>
      )}
    </Step>
  )
}
