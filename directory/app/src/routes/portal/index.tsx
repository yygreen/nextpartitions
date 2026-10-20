import { createFileRoute } from '@tanstack/react-router'
import { PortalApp } from '@/portal/components/PortalApp'

// /portal/: installer portal and job coordination. Login only, rendered in the browser (the session lives
// there), never indexed.
export const Route = createFileRoute('/portal/')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Installer portal | Next Partitions' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: PortalApp,
})
