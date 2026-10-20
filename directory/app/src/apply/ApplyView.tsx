import { cloneElement, isValidElement, type ReactElement, type ReactNode, useId, useRef, useState } from 'react'
import { areaHref, homeHref, stateHref } from '../directory/links'
import { Disclaimer } from '../directory/components/ui'
import { Hero } from '../directory/views'
import { sample, submitApplication } from './api'
import {
  CREW_LABEL, type CrewSize, EXTRA_LABEL, type Extra, type Files, MATERIAL_LABEL, MATERIALS, MOUNTING_LABEL, MOUNTINGS,
  STEPS, emptyForm, validateStep, type ApplicationForm,
} from './form'

// /installers/apply/: the installer application (design: prototypes/installer-apply.html).
const WRAP = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
const INPUT = 'font-normal border border-border bg-card px-3 min-h-11 w-full aria-[invalid=true]:border-red-700'

const WHY: [string, string][] = [
  ['Install requests from our customers', 'Schools, offices, gyms and restaurants buying partitions from us in your service area.'],
  ['You set the price', 'Customers see an instant estimate from your rates. You confirm a firm price on each job.'],
  ['Your fee stays yours', 'We earn on the partitions, not the install. No markup and no commission on your price.'],
  ['Jobs arrive ready to price', 'Shop drawings, hardware list, building type and delivery dates come with every request.'],
  ['Trade pricing on partitions', 'Buy partitions for your own jobs at trade prices through an installer account.'],
  ['No listing fee', 'Applying, getting listed and receiving requests are free.'],
]
const CHECKS: [string, string][] = [
  ['You install customer-bought partitions', "Including partitions you didn't supply yourself."],
  ['General liability insurance on file', '$300,000 or more in DFW. For City of Dallas jobs, the City must be listed as certificate holder.'],
  ['Business or city registration', 'Texas has no statewide contractor license. Dallas requires contractor registration to pull permits.'],
  ['2–3 references we call', "Customers or general contractors you've installed partitions for."],
  ['A test job request we time', 'Reply within 1 business day and send a firm price within 2.'],
  ['A signed listing agreement', 'The short version is in step 6 of the application.'],
  ['One completed job, later', 'Your profile goes live with the Verified label once the checks above pass. It shows Approved after your first job for a Next Partitions customer.'],
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
  ['We check your documents', 'Insurance and registration, within 2 business days.'],
  ['We call your references', 'Usually the same week.'],
  ['We send you a test job request', 'A real-looking job in the portal. We time your reply (target: 1 business day) and your firm price (target: 2).'],
  ['You sign the listing agreement and go live as Verified', 'Your profile appears on the directory and job requests in your service area arrive in the installer portal.'],
  ['Approved label after your first completed job', "Once you've installed for a Next Partitions customer, your profile shows Approved instead of Verified."],
]
const FAQ: [string, string][] = [
  ['What does it cost?', "Nothing. There's no listing fee and no commission on your installation price. Next Partitions earns its margin on the partitions."],
  ['Is it exclusive?', 'No. You keep your own customers and other work. The listing agreement only covers customers we refer to you.'],
  ['Who invoices the customer for installation?', "You do. You contract and invoice installation directly with the customer. Next Partitions isn't a party to the installation agreement."],
  ['How are jobs assigned?', 'The customer chooses among the approved installers who priced their job. The directory lists installers by Installer Score, which combines customer rating, installs for our customers and how fast you reply to job requests.'],
  ['When do I get customer contact details?', 'When the customer has chosen you and paid for their partitions order. Before that you see the full job packet (scope, drawings, city and ZIP) and message the customer through us.'],
]
// Placeholders only: real applicants should type their own rates, not accept ours.
const RATE_HINT: Record<string, string> = { powder_coated: '115', hdpe: '140', laminate: '120', phenolic: '160', stainless: '175' }

export function ApplyView() {
  return (
    <>
      {sample && <div className="bg-surface-warm text-muted-foreground border-b border-border text-sm text-center px-4 py-2">Sample form: applications aren't sent anywhere.</div>}
      <Hero crumbs={[{ label: 'Home', href: homeHref() }, { label: 'Installers', href: stateHref('texas') }, { label: 'Dallas–Fort Worth', href: areaHref('dallas') }, { label: 'Get listed' }]}
        title="Get listed as a partition installer in Dallas–Fort Worth"
        lead="Customers buy their toilet partitions from Next Partitions and need someone to install them. Get those install requests, price them from your own rates, and keep all of your installation fee.">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
          {['No listing fee', 'No markup on your installation', 'You choose which jobs to price'].map((f) => <li key={f}>✓ {f}</li>)}
        </ul>
        <p><a href="#apply" className="inline-flex items-center bg-brand-red text-brand-red-foreground font-semibold px-5 min-h-11 hover:opacity-90">Apply now</a></p>
      </Hero>
      <main>
        <Section title="Why installers join" sub="You install. We handle the partitions, the drawings and the customer's questions before the job is yours.">
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY.map(([b, s]) => <li key={b} className="bg-card border border-border p-4"><b className="block">{b}</b><span className="text-sm text-muted-foreground">{s}</span></li>)}
          </ul>
        </Section>
        <Section band title="What we check" sub="Every listed installer has passed the same checks. They're facts we verify, shown on your profile, not an endorsement.">
          <ol className="bg-card border border-border">
            {CHECKS.map(([b, s], n) => (
              <li key={b} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 px-4 py-3 border-b border-border last:border-b-0">
                <Num n={n + 1} /><span><b className="block">{b}</b><small className="text-sm text-muted-foreground">{s}</small></span>
              </li>
            ))}
          </ol>
        </Section>
        <Section id="apply" title="Apply" sub="About 10 minutes. Have your insurance certificate and registration number ready.">
          <ApplicationForm />
        </Section>
        <Section band title="Questions">
          <div className="grid gap-2 max-w-3xl">
            {FAQ.map(([q, a]) => (
              <details key={q} className="bg-card border border-border px-4 py-3">
                <summary className="font-semibold cursor-pointer">{q}</summary><p className="mt-2 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
          <Disclaimer />
        </Section>
      </main>
    </>
  )
}

function Section({ id, title, sub, band, children }: { id?: string; title: string; sub?: string; band?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-h`} className={`py-10 scroll-mt-24 ${band ? 'bg-surface-warm border-y border-border' : ''}`}>
      <div className={`${WRAP} grid gap-4`}>
        <div><h2 id={`${id ?? title}-h`} className="text-2xl font-extrabold tracking-tight">{title}</h2>{sub && <p className="text-muted-foreground mt-1 max-w-[65ch]">{sub}</p>}</div>
        {children}
      </div>
    </section>
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
    <div ref={top} className="bg-card border border-border p-4 sm:p-6 grid gap-5 max-w-4xl scroll-mt-24">
      <ol className="grid grid-cols-6 gap-1 text-[11px] sm:text-xs" aria-label="Application steps">
        {STEPS.map((s, n) => (
          <li key={s} aria-current={!done && n === step ? 'step' : undefined}
            className={`border-t-4 pt-1 ${done || n < step ? 'border-brand-red text-foreground' : n === step ? 'border-brand-red text-foreground font-semibold' : 'border-border text-muted-foreground'}`}>
            <span className="hidden sm:inline">{s}</span><span className="sm:hidden">{n + 1}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground" aria-live="polite">{done ? 'Submitted' : `Step ${step + 1} of 6 · ${STEPS[step]}`}</p>

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
              <Field label="Installers on your crew">
                <select className={INPUT} value={f.crew_size} onChange={(e) => set({ crew_size: e.target.value as CrewSize })}>
                  {(Object.keys(CREW_LABEL) as CrewSize[]).map((c) => <option key={c} value={c}>{CREW_LABEL[c]}</option>)}
                </select>
              </Field>
            </div>
          </Step>}

          {step === 1 && <Step title="What you install" q="Pick everything you're comfortable installing. You only get requests that match.">
            <Chips legend="Materials" options={MATERIALS.map((m) => [m, MATERIAL_LABEL[m]])} value={f.materials} onToggle={(m) => set({ materials: toggle(f.materials, m) })} />
            <Chips legend="Bracing" options={MOUNTINGS.map((m) => [m, MOUNTING_LABEL[m]])} value={f.mountings} onToggle={(m) => set({ mountings: toggle(f.mountings, m) })} />
            <Chips legend="Extras" options={(Object.keys(EXTRA_LABEL) as Extra[]).map((x) => [x, EXTRA_LABEL[x]])} value={f.extras} onToggle={(x) => set({ extras: toggle(f.extras, x) })} />
            {text('brands', "Brands you've installed", { placeholder: 'e.g. Scranton Products, Bobrick, ASI, Bradley', hint: 'Optional.', full: true })}
          </Step>}

          {step === 2 && <Step title="Documents" q="We verify these before your first job request. They're never shown to customers.">
            <div className="grid sm:grid-cols-2 gap-4">
              <FileField label="Certificate of general liability insurance" hint="PDF or photo, up to 10 MB. $300,000 or more; for Dallas jobs, the City of Dallas as certificate holder."
                file={files.insurance} error={errors.insurance} full onFile={(file) => setFiles({ ...files, insurance: file })} />
              {text('registration_number', 'Registration number', { placeholder: 'e.g. City of Dallas contractor registration', hint: 'Business, city or state registration.' })}
              <FileField label="Registration document" hint="Optional if we can look it up." file={files.registration} error={errors.registration}
                onFile={(file) => setFiles({ ...files, registration: file })} />
            </div>
            <p className="text-sm text-muted-foreground">We'll ask for a W-9 if you open a trade account.</p>
          </Step>}

          {step === 3 && <Step title="References" q="2–3 customers or general contractors you've installed partitions for in the last two years. We call them.">
            <div className="grid gap-4">
              {f.references.map((r, n) => {
                const setRef = (p: Partial<typeof r>) => set({ references: f.references.map((x, i) => (i === n ? { ...x, ...p } : x)) })
                const e = (k: string) => errors[`ref${n}.${k}`]
                const inp = (k: keyof typeof r, label: string, o: { type?: string; mode?: 'tel' | 'email'; placeholder?: string } = {}) => (
                  <Field label={label} error={e(k)}>
                    <input className={INPUT} type={o.type ?? 'text'} inputMode={o.mode} placeholder={o.placeholder} aria-invalid={!!e(k)} value={r[k]} onChange={(ev) => setRef({ [k]: ev.target.value })} />
                  </Field>
                )
                return (
                  <fieldset key={n} className="border border-border p-4 grid sm:grid-cols-2 gap-3">
                    <legend className="font-semibold px-1">Reference {n + 1}{n === 2 ? ' (optional)' : ''}</legend>
                    {inp('name', 'Name')}{inp('company', 'Company')}
                    {inp('phone', 'Phone', { type: 'tel', mode: 'tel' })}{inp('email', 'Email', { type: 'email', mode: 'email' })}
                    <div className="sm:col-span-2">{inp('job_note', 'Job', { placeholder: 'e.g. 8 HDPE stalls, 2025' })}</div>
                  </fieldset>
                )
              })}
            </div>
          </Step>}

          {step === 4 && <Step title="Your rates" q="What you charge to install, before you see the drawings.">
            <p className="text-sm bg-surface-warm border border-border px-3 py-2">Customers see an instant estimate from these rates. You confirm a firm price on each job, so you can adjust for anything the drawings show.</p>
            <RateTable head="Per stall, by material" rows={f.materials.map((m) => [`rate.${m}`, MATERIAL_LABEL[m], f.rates[m] ?? '', (v: string) => set({ rates: { ...f.rates, [m]: v } }), RATE_HINT[m], 'per stall'])} errors={errors} />
            <RateTable head="Extras" rows={([
              ['high_mount_extra', 'Ceiling hung or floor to ceiling, extra per stall', '40'], ['ada_stall', 'Accessible (ADA) stall, extra', '40'],
              ['urinal_screen', 'Urinal screen, each', '45'], ['demo_per_stall', 'Remove and haul away an old stall', '25'], ['minimum', 'Minimum charge per job', '600'],
              ['free_miles', 'Travel included (miles from your base)', '50'], ['per_mile', 'Travel beyond that, per mile', '2'],
            ] as const).map(([k, label, hint]) => [`rate.${k}`, label, f.rates[k], (v: string) => set({ rates: { ...f.rates, [k]: v } }), hint, k === 'free_miles' ? 'miles' : ''])} errors={errors} />
          </Step>}

          {step === 5 && <Step title="Listing agreement" q="The short version. We send the full agreement to sign with your approval.">
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

function RateTable({ head, rows, errors }: {
  head: string; rows: (readonly [string, string, string, (v: string) => void, string, string])[]; errors: Record<string, string>
}) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-3 font-semibold">{head}</th><th className="py-2 font-semibold w-40">Rate ($)</th></tr></thead>
      <tbody>
        {rows.map(([key, label, value, onChange, hint, unit]) => (
          <tr key={key} className="border-b border-border align-top">
            <td className="py-2 pr-3">{label}{errors[key] && <small className="block text-red-800">{errors[key]}</small>}</td>
            <td className="py-2">
              <span className="flex items-center gap-2">
                <input className={`${INPUT} w-24`} inputMode="decimal" aria-label={`${label}${unit ? ` (${unit})` : ''}`} placeholder={`e.g. ${hint}`}
                  aria-invalid={!!errors[key]} value={value} onChange={(e) => onChange(e.target.value)} />
                {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
