/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import css from '../styles.css?url'
import { SiteChrome } from '../shell/SiteChrome'

// Standalone shell only. On merge, the live site's own root layout (header, footer, fonts) replaces this.
export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' },
      { rel: 'stylesheet', href: css },
    ],
  }),
  component: () => (
    <Document>
      <SiteChrome><Outlet /></SiteChrome>
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
