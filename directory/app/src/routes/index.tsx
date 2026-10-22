import { createFileRoute, redirect } from '@tanstack/react-router'

// Standalone only: the live site has its own homepage.
export const Route = createFileRoute('/')({ beforeLoad: () => { throw redirect({ to: '/service-area/texas' }) } })
