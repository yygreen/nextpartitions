import type { ReactNode } from 'react'
import { DISCLAIMER } from '../config'
import { SAMPLE_NOTICE } from '../repo.sample'

// Buttons as on the live site: square, brand orange, with an arrow on primary actions.
export function ButtonLink(props: { href: string; children: ReactNode; variant?: 'primary' | 'outline'; size?: 'lg' | 'sm'; className?: string }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red'
  const size = props.size === 'sm' ? 'text-sm px-4 min-h-10' : props.size === 'lg' ? 'text-lg px-7 min-h-13' : 'px-5 min-h-11'
  const variant = props.variant === 'outline'
    ? 'border border-border bg-card text-foreground hover:bg-muted'
    : 'bg-brand-red text-brand-red-foreground hover:opacity-90'
  return <a href={props.href} className={`${base} ${size} ${variant} ${props.className ?? ''}`}>{props.children}</a>
}

export function Disclaimer() {
  return <p className="text-sm text-muted-foreground border-t border-border pt-4 mt-6">{DISCLAIMER}</p>
}

export function SampleBanner({ show }: { show: boolean }) {
  if (!show) return null
  return <div className="bg-surface-warm text-muted-foreground border-b border-border text-sm text-center px-4 py-2">{SAMPLE_NOTICE}</div>
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return <span aria-label={`${rating} out of 5`} className="text-brand-red tracking-tight">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
}

export function Breadcrumbs({ items, onDark }: { items: { label: string; href?: string }[]; onDark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${onDark ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
      <ol className="flex flex-wrap gap-1.5">
        {items.map((it, n) => (
          <li key={n} className="flex gap-1.5">
            {n > 0 && <span aria-hidden>›</span>}
            {it.href ? <a href={it.href} className="underline-offset-2 hover:underline">{it.label}</a> : <span aria-current="page" className={onDark ? 'text-primary-foreground' : 'text-foreground'}>{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
