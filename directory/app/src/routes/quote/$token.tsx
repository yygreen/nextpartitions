import { createFileRoute } from '@tanstack/react-router'
import { QuoteView } from '@/quote/QuoteView'

// /quote/<token>: the customer's own quote, reached only from our email. Rendered in the browser, never indexed.
export const Route = createFileRoute('/quote/$token')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Your Partitions Quote | Next Partitions' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: () => <QuoteView token={Route.useParams().token} />,
})
