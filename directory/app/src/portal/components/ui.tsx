import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { STEPS } from '../stage'

// Portal building blocks, using the site's theme tokens like the directory components do.
export const WRAP = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'

export function Button(props: {
  children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; variant?: 'primary' | 'outline' | 'quiet'
  disabled?: boolean; busy?: boolean; className?: string
}) {
  const variant = props.variant === 'outline' ? 'border border-border bg-card text-foreground hover:bg-muted'
    : props.variant === 'quiet' ? 'text-foreground underline underline-offset-2 hover:text-brand-red px-0'
    : 'bg-brand-red text-brand-red-foreground hover:opacity-90'
  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} disabled={props.disabled || props.busy}
      className={`inline-flex items-center justify-center gap-2 font-semibold px-4 min-h-11 transition-opacity disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red ${variant} ${props.className ?? ''}`}>
      {props.busy ? 'Saving…' : props.children}
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      {children}
      {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
    </label>
  )
}

export const INPUT = 'font-normal border border-border bg-card px-3 min-h-11 w-full'
export const TEXTAREA = 'font-normal border border-border bg-card px-3 py-2 w-full'

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-card border border-border p-5 grid gap-3 content-start ${className ?? ''}`}>
      {title && <h3 className="text-lg">{title}</h3>}
      {children}
    </section>
  )
}

const TONE = {
  new: 'bg-brand-red text-brand-red-foreground',
  wait: 'bg-surface-warm text-foreground border border-border',
  go: 'bg-emerald-700 text-white',
  off: 'bg-muted text-muted-foreground',
  alert: 'bg-amber-100 text-amber-900 border border-amber-300',
}
export function Badge({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 ${TONE[tone]}`}>{children}</span>
}

export function Steps({ at }: { at: number }) {
  return (
    <ol className="grid grid-cols-6 gap-1 text-[11px] sm:text-xs" aria-label="Job progress">
      {STEPS.map((s, n) => (
        <li key={s} aria-current={n === at ? 'step' : undefined}
          className={`border-t-4 pt-1 ${n <= at ? 'border-brand-red text-foreground font-semibold' : 'border-border text-muted-foreground'}`}>{s}</li>
      ))}
    </ol>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'ok' | 'error'; children: ReactNode }) {
  const c = tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
    : tone === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-surface-warm border-border text-foreground'
  return <p role={tone === 'error' ? 'alert' : 'status'} className={`border px-3 py-2 text-sm ${c}`}>{children}</p>
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <nav className="bg-card border-b border-border" aria-label="Portal">
      <div className={`${WRAP} flex gap-1 overflow-x-auto`} role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === value} onClick={() => onChange(t.id)}
            className={`px-4 min-h-12 font-semibold whitespace-nowrap border-b-4 ${t.id === value ? 'border-brand-red' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}{t.count ? <span className="ml-2 bg-brand-red text-brand-red-foreground text-xs px-1.5 py-0.5">{t.count}</span> : null}
          </button>
        ))}
      </div>
    </nav>
  )
}

// Loads data, exposes reload, and turns errors into a message instead of a blank screen.
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const run = useCallback(() => {
    load().then((d) => { setData(d); setError(null) }, (e) => setError(errorText(e)))
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(run, [run])
  return { data, error, reload: run }
}

// Runs an action with a busy flag and a readable error.
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError(null)
    try { await fn(); return true } catch (e) { setError(errorText(e)); return false } finally { setBusy(false) }
  }
  return { busy, error, run }
}

// Database errors carry the rule that refused the change (see the migrations), which reads fine as-is.
export function errorText(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message
  return 'Something went wrong. Try again, or call Next Partitions at 1-833-997-7489.'
}

// Opens an uploaded file in a new tab. The sample has no real files (and a shared prototype can't open new
// windows for most viewers), so it says what would open instead of doing nothing.
export function openFile(url: string) {
  if (url.startsWith('data:')) throw new Error('Sample file: on the live site this opens the uploaded document.')
  window.open(url, '_blank', 'noopener')
}
