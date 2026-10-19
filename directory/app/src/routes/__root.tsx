/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import css from '../styles.css?url'

// Standalone shell only. On merge, the live site's own root layout (header, footer, fonts) replaces this.
export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    links: [{ rel: 'stylesheet', href: css }],
  }),
  component: () => (
    <Document>
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="font-extrabold text-lg">Next Partitions</a>
          <a href="https://nextpartitions.com/get-a-quote" className="bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2">Get a Quote</a>
        </div>
      </header>
      <Outlet />
    </Document>
  ),
})

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body className="pb-20 sm:pb-0">{children}<Scripts /></body>
    </html>
  )
}
