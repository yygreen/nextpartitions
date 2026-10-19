import type { ReactNode } from 'react'
import { DISCLAIMER } from '../config'
import { SAMPLE_NOTICE } from '../repo.sample'

export function ButtonLink(props: { href: string; children: ReactNode; variant?: 'primary' | 'outline'; size?: 'lg' | 'sm'; className?: string }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
  const size = props.size === 'sm' ? 'text-sm px-3.5 min-h-10' : props.size === 'lg' ? 'text-lg px-7 min-h-13' : 'px-5 min-h-11'
  const variant = props.variant === 'outline'
    ? 'border-2 border-primary text-primary bg-card hover:bg-accent'
    : 'bg-primary text-primary-foreground hover:opacity-90'
  return <a href={props.href} className={`${base} ${size} ${variant} ${props.className ?? ''}`}>{props.children}</a>
}

export function Disclaimer() {
  return <p className="text-sm text-muted-foreground border-t border-border pt-4 mt-6">{DISCLAIMER}</p>
}

export function SampleBanner({ show }: { show: boolean }) {
  if (!show) return null
  return <div className="bg-amber-100 text-amber-900 text-sm text-center px-4 py-2">{SAMPLE_NOTICE}</div>
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return <span aria-label={`${rating} out of 5`} className="text-amber-500 tracking-tight">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap gap-1.5">
        {items.map((it, n) => (
          <li key={n} className="flex gap-1.5">
            {n > 0 && <span aria-hidden>›</span>}
            {it.href ? <a href={it.href} className="hover:text-foreground underline-offset-2 hover:underline">{it.label}</a> : <span aria-current="page">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
