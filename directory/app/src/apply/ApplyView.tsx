import { cloneElement, isValidElement, type ReactElement, type ReactNode, useId, useRef, useState } from 'react'
import { areaHref, homeHref, stateHref } from '../directory/links'
import { Disclaimer } from '../directory/components/ui'
import { Hero } from '../directory/views'
import { sample, submitApplication } from './api'
import {
  EXTRA_LABEL, type Extra, type Files, MATERIAL_LABEL, MATERIALS, MOUNTING_LABEL, MOUNTINGS, STEPS, blankRef, emptyForm, validateStep,
  type ApplicationForm,
} from './form'

// /installers/apply/: the installer application (design: prototypes/installer-apply.html), form first. Four short
// steps; rates are set later in the installer portal, and anything else we need comes up in vetting.
const WRAP = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
const INPUT = 'font-normal border border-border bg-card px-3 min-h-11 w-full aria-[invalid=true]:border-red-700'

const WHY = [
  'Install requests from our customers in your service area',
  'You set the price; no listing fee, no markup, no commission',
  'Every request arrives with shop drawings and delivery dates',
]
const CHECKS = [
  'Insurance ($300,000+) and business or city registration',
  '2 references we call',
  'A test job request we time',
  'The signed listing agreement',
]
const TERMS = [
  "Install the partitions on the customer's Next Partitions order. No substitutes, and no selling partitions on our jobs.",
  'Price jobs through the installer portal and report job status (scheduled, installed).',
  'Talk to customers through Next Partitions until the job is released to you.',
  "Don't go around Next Partitions on customers we refer to you (non-circumvention). Breaches lead to a fee or delisting.",
  'You contract and invoice installation directly with the customer. Next Partitions adds no markup to your price.',
  'Keep your insurance and business or city registration current. We check them every year.',
]
const NEXT: [string, string][] = [
  ['We check your documents and call your references', 'Usually within the week.'],
  ['You get a portal login and set your rates', 'Customers see an instant estimate from them; you confirm a firm price on each job.'],
  ['We send a test job request', 'We time your reply (target: 1 business day) and your firm price (target: 2).'],
  ['You go live as Verified', 'Your profile appears on the directory and job requests arrive in the portal. It shows Approved after your first completed job.'],
]
const FAQ: [string, string][] = [
  ['What does it cost?', "Nothing. There's no listing fee and no commission on your installation price. Next Partitions earns its margin on the partitions."],
  ['Is it exclusive?', 'No. You keep your own customers and other work. The listing agreement only covers customers we refer to you.'],
  ['Who invoices the customer for installation?', "You do. You contract and invoice installation directly with the customer. Next Partitions isn't a party to the installation agreement."],
  ['When do I get customer contact details?', 'When the customer has chosen you and paid for their partitions order. Before that you see the full job packet (scope, drawings, city and ZIP) and message the customer through us.'],
]

export function ApplyView() {
  return (
    <>
      {sample && <div className="bg-surface-warm text-muted-foreground border-b border-border text-sm text-center px-4 py-2">Sample form: applications aren't sent anywhere.</div>}
      <Hero crumbs={[{ label: 'Home', href: homeHref() }, { label: 'Installers', href: stateHref('texas') }, { label: 'Dallas–Fort Worth', href: areaHref('dallas') }, { label: 'Get listed' }]}
        title="Get listed as a partition installer in Dallas–Fort Worth"
        lead="Our customers buy their toilet partitions from us and need someone to install them. Apply in about 5 minutes." />
      <main className={`${WRAP} py-8 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start`}>
        <div id="apply" className="scroll-mt-24 min-w-0"><ApplicationForm /></div>
        <aside className="grid gap-6 text-sm">
          <section className="grid gap-2"><h2 className="text-lg font-extrabold">Why installers join</h2>
            <ul className="grid gap-1.5">{WHY.map((w) => <li key={w} className="flex gap-2"><span aria-hidden className="text-brand-red font-bold">✓</span>{w}</li>)}</ul>
          </section>
          <section className="grid gap-2"><h2 className="text-lg font-extrabold">What we check</h2>
            <ul className="grid gap-1.5 list-disc pl-5">{CHECKS.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="text-muted-foreground">Pass these and your profile goes live as Verified. Your first completed job for a Next Partitions customer makes it Approved.</p>
          </section>
          <section className="grid gap-2"><h2 className="text-lg font-extrabold">Questions</h2>
            {FAQ.map(([q, a]) => (
              <details key={q} className="border-b border-border pb-2"><summary className="font-semibold cursor-pointer">{q}</summary><p className="mt-1 text-muted-foreground">{a}</p></details>
            ))}
          </section>
        </aside>
        <div className="lg:col-span-2"><Disclaimer /></div>
      </main>
    </>
  )
}

const Num = ({ n }: { n: number }) => (
  <i className="not-italic size-6 grid place-items-center bg-brand-red/15 text-brand-red font-black text-[13px]">{n}</i>
)

function ApplicationForm() {
  const [step, setStep] = useState(0)
  const [f, setF] = useState<ApplicationForm>(emptyForm)
  const [files, setFiles] = useState<Files>({ insurance: null, registration: null })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [done, setDone] = useState<{ name: string; email: string; problem?: string } | null>(null)
  const top = useRef<HTMLDivElement>(null)
  const set = (p: Partial<ApplicationForm>) => setF({ ...f, ...p })
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const go = (n: number) => {
    setStep(n); setErrors({})
    requestAnimationFrame(() => { top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); top.current?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true }) })
  }
  const next = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateStep(step, f, files)
    setErrors(errs)
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => top.current?.querySelector<HTMLElement>('[aria-invalid=true], [data-step-error]')?.focus())
      return
    }
    if (step < STEPS.length - 1) return go(step + 1)
    setBusy(true); setFailure(null)
    try {
      const r = await submitApplication(f, files)
      setDone({ name: f.business_name.trim(), email: f.email.trim(), problem: r.documentProblem })
      requestAnimationFrame(() => top.current?.querySelector<HTMLElement>('h3')?.focus())
    } catch (err) {
      setFailure(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Something went wrong. Try again, or call 1-833-997-7489.')
    } finally { setBusy(false) }
  }

  const text = (k: keyof ApplicationForm, label: string, o: { type?: string; auto?: string; mode?: 'numeric' | 'tel' | 'email'; hint?: string; placeholder?: string; full?: boolean; max?: number } = {}) => (
    <Field label={label} error={errors[k]} hint={o.hint} full={o.full}>
      <input className={INPUT} type={o.type ?? 'text'} autoComplete={o.auto} inputMode={o.mode} placeholder={o.placeholder} maxLength={o.max}
        aria-invalid={!!errors[k]} value={String(f[k])} onChange={(e) => set({ [k]: e.target.value })} />
    </Field>
  )

  return (
    <div ref={top} className="bg-card border border-border p-4 sm:p-6 grid gap-5 scroll-mt-24">
      <ol className="grid grid-cols-4 gap-1 text-[11px] sm:text-xs" aria-label="Application steps">
        {STEPS.map((s, n) => (
          <li key={s} aria-current={!done && n === step ? 'step' : undefined}
            className={`border-t-4 pt-1 ${done || n < step ? 'border-brand-red text-foreground' : n === step ? 'border-brand-red text-foreground font-semibold' : 'border-border text-muted-foreground'}`}>
            <span className="hidden sm:inline">{s}</span><span className="sm:hidden">{n + 1}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground" aria-live="polite">{done ? 'Submitted' : `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}</p>

      {done ? (
        <div className="grid gap-4">
          <h3 tabIndex={-1} className="text-xl outline-none">Application received</h3>
          <p className="text-muted-foreground">Thanks, <b className="text-foreground">{done.name}</b>. We'll be in touch at <b className="text-foreground">{done.email}</b>.{sample ? ' (Sample form: nothing was sent.)' : ''}</p>
          {done.problem && <p role="alert" className="border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">{done.problem}</p>}
          <ol className="grid gap-3">
            {NEXT.map(([b, s], n) => <li key={b} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3"><Num n={n + 1} /><span><b className="block">{b}</b><span className="text-sm text-muted-foreground">{s}</span></span></li>)}
          </ol>
        </div>
      ) : (
        <form noValidate onSubmit={next} className="grid gap-5">
          {/* Honeypot: hidden from people and screen readers; bots that fill every field give themselves away. */}
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set({ website: e.target.value })} name="website" /></label>
          </div>

          {step === 0 && <Step title="Your business" q="Where you're based and how far you travel.">
            <div className="grid sm:grid-cols-2 gap-4">
              {text('business_name', 'Business name', { auto: 'organization' })}
              {text('contact_name', 'Contact name', { auto: 'name' })}
              {text('phone', 'Phone', { type: 'tel', auto: 'tel', mode: 'tel' })}
              {text('email', 'Email', { type: 'email', auto: 'email', mode: 'email' })}
              {text('base_city', 'Base city', { placeholder: 'e.g. Garland', auto: 'address-level2' })}
              {text('base_zip', 'Base ZIP', { mode: 'numeric', auto: 'postal-code', max: 5 })}
              {text('service_radius_mi', 'Service radius (miles)', { type: 'number' })}
              {text('years_in_business', 'Years in business', { type: 'number' })}
            </div>
          </Step>}

          {step === 1 && <Step title="What you install" q="You only get requests that match.">
            <Chips legend="Materials" options={MATERIALS.map((m) => [m, MATERIAL_LABEL[m]])} value={f.materials} onToggle={(m) => set({ materials: toggle(f.materials, m) })} />
            <Chips legend="Bracing" options={MOUNTINGS.map((m) => [m, MOUNTING_LABEL[m]])} value={f.mountings} onToggle={(m) => set({ mountings: toggle(f.mountings, m) })} />
            <Chips legend="Extras" options={(Object.keys(EXTRA_LABEL) as Extra[]).map((x) => [x, EXTRA_LABEL[x]])} value={f.extras} onToggle={(x) => set({ extras: toggle(f.extras, x) })} />
          </Step>}

          {step === 2 && <Step title="Documents and references" q="Never shown to customers. We call the references.">
            <div className="grid sm:grid-cols-2 gap-4">
              <FileField label="Certificate of general liability insurance" hint="PDF or photo, up to 10 MB. $300,000 or more; for Dallas jobs, the City of Dallas as certificate holder."
                file={files.insurance} error={errors.insurance} full onFile={(file) => setFiles({ ...files, insurance: file })} />
              {text('registration_number', 'Business or city registration number', { placeholder: 'e.g. City of Dallas contractor registration' })}
              <FileField label="Registration document (optional)" hint="Only if we can't look it up." file={files.registration} error={errors.registration}
                onFile={(file) => setFiles({ ...files, registration: file })} />
            </div>
            <div className="grid gap-3">
              <p className="font-semibold">Customers or general contractors you've installed partitions for</p>
              {f.references.map((r, n) => {
                const setRef = (p: Partial<typeof r>) => set({ references: f.references.map((x, i) => (i === n ? { ...x, ...p } : x)) })
                const e = (k: string) => errors[`ref${n}.${k}`]
                const inp = (k: keyof typeof r, label: string) => (
                  <Field label={label} error={e(k)}>
                    <input className={INPUT} aria-invalid={!!e(k)} value={r[k]} onChange={(ev) => setRef({ [k]: ev.target.value })} />
                  </Field>
                )
                return (
                  <fieldset key={n} className="border border-border p-3 grid sm:grid-cols-3 gap-3">
                    <legend className="font-semibold px-1 text-sm">Reference {n + 1}{n === 2 ? ' (optional)' : ''}</legend>
                    {inp('name', 'Name')}{inp('company', 'Company')}{inp('contact', 'Phone or email')}
                  </fieldset>
                )
              })}
              {f.references.length < 3 && <button type="button" className="justify-self-start text-sm font-semibold underline" onClick={() => set({ references: [...f.references, blankRef()] })}>Add a third reference</button>}
            </div>
          </Step>}

          {step === 3 && <Step title="Listing agreement" q="The short version. We send the full agreement to sign when you're listed.">
            <ul className="list-disc pl-5 grid gap-2">{TERMS.map((t) => <li key={t}>{t}</li>)}</ul>
            <label className="flex gap-3 items-start">
              <input type="checkbox" className="mt-1 size-5" checked={f.agreed} aria-invalid={!!errors.agreed} onChange={(e) => set({ agreed: e.target.checked })} />
              <span>I've read the summary and agree to sign the listing agreement if approved.</span>
            </label>
            {errors.agreed && <p className="text-sm text-red-800">{errors.agreed}</p>}
            <div className="max-w-md">{text('agreement_name', 'Type your full name to sign', { auto: 'name' })}</div>
          </Step>}

          {errors[''] && <p data-step-error tabIndex={-1} role="alert" className="text-sm text-red-800">{errors['']}</p>}
          {Object.keys(errors).length > 0 && !errors[''] && <p role="alert" className="text-sm text-red-800">Check the highlighted fields.</p>}
          {failure && <p role="alert" className="border border-red-200 bg-red-50 text-red-900 px-3 py-2 text-sm">{failure}</p>}
          <div className="flex justify-between gap-3 border-t border-border pt-4">
            {step > 0 ? <button type="button" onClick={() => go(step - 1)} className="font-semibold px-4 min-h-11 border border-border bg-card hover:bg-muted">← Back</button> : <span />}
            <button type="submit" disabled={busy} className="font-semibold px-5 min-h-11 bg-brand-red text-brand-red-foreground hover:opacity-90 disabled:opacity-50">
              {busy ? 'Sending…' : step === STEPS.length - 1 ? 'Submit application' : <>Next<span className="hidden sm:inline">: {STEPS[step + 1]}</span> →</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Step({ title, q, children }: { title: string; q: string; children: ReactNode }) {
  return (
    <div className="grid gap-4">
      <div><h3 tabIndex={-1} className="text-xl outline-none">{title}</h3><p className="text-muted-foreground">{q}</p></div>
      {children}
    </div>
  )
}

// Hint and error sit outside the label (linked by aria-describedby), so the field's name stays just the label.
function Field({ label, error, hint, full, children }: { label: string; error?: string; hint?: string; full?: boolean; children: ReactElement }) {
  const id = useId()
  const described = [hint && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`grid gap-1.5 text-sm content-start ${full ? 'sm:col-span-2' : ''}`}>
      <label className="grid gap-1.5 font-semibold">{label}{isValidElement(children) ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': described }) : children}</label>
      {hint && <small id={`${id}-h`} className="text-muted-foreground">{hint}</small>}
      {error && <small id={`${id}-e`} className="text-red-800">{error}</small>}
    </div>
  )
}

function FileField({ label, hint, file, error, full, onFile }: { label: string; hint: string; file: File | null; error?: string; full?: boolean; onFile: (f: File | null) => void }) {
  const id = useId()
  return (
    <div className={`grid gap-1.5 text-sm border border-dashed p-3 ${error ? 'border-red-700' : 'border-border'} ${full ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={id} className="font-bold">{label}</label>
      <span id={`${id}-h`} className="text-muted-foreground">{hint}</span>
      <input id={id} type="file" accept="application/pdf,image/jpeg,image/png" aria-invalid={!!error} aria-describedby={`${id}-h${error ? ` ${id}-e` : ''}`}
        className="max-w-full text-sm" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      {file && <span className="text-muted-foreground">Selected: {file.name}</span>}
      {error && <small id={`${id}-e`} className="text-red-800">{error}</small>}
    </div>
  )
}

function Chips<T extends string>({ legend, options, value, onToggle }: { legend: string; options: [T, string][]; value: T[]; onToggle: (v: T) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="font-semibold mb-1">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, label]) => (
          <label key={v} className={`flex gap-2 items-center border px-3 min-h-11 cursor-pointer ${value.includes(v) ? 'border-brand-red bg-brand-red/10' : 'border-border bg-card'}`}>
            <input type="checkbox" checked={value.includes(v)} onChange={() => onToggle(v)} />{label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
