// Email worker for the installer directory (Supabase Edge Function). Each run claims due outbox rows, writes
// the emails for each (messages.ts) and sends them, then marks the row done, or failed so the next run
// retries it (up to 5 attempts in all, see dir_outbox_claim).
//
// Run it every minute with Supabase Cron (Integrations → Cron → new job → Supabase Edge Function → dir-outbox).
//
// Settings (Edge Functions → Secrets):
//   EMAIL_PROVIDER     log (default: writes each email to the function log and sends nothing) or resend
//   RESEND_API_KEY     with EMAIL_PROVIDER=resend
//   EMAIL_FROM         e.g. "Next Partitions <sales@nextpartitions.com>" (a domain verified with the provider)
//   COORDINATOR_EMAIL  the job coordinator's inbox
//   SITE_URL           e.g. https://nextpartitions.com (links in the emails)
//   SITE_PHONE         default 1-833-997-7489
//   TIME_ZONE          default America/Chicago (the pilot area)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { type Message, type OutboxContext, renderMessages } from './messages.ts'

const env = (k: string, d?: string) => Deno.env.get(k) ?? d

async function send(m: Message, key: string) {
  const provider = env('EMAIL_PROVIDER', 'log')
  if (provider === 'log') {
    console.log(`[email ${m.audience}] to ${m.to}: ${m.subject}\n${m.text}`)
    return
  }
  if (provider !== 'resend') throw new Error(`Unknown EMAIL_PROVIDER "${provider}"`)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json',
      // A retried row doesn't send its emails twice (the provider keeps keys for 24 hours).
      'Idempotency-Key': key,
    },
    body: JSON.stringify({ from: env('EMAIL_FROM'), to: [m.to], subject: m.subject, text: m.text }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

Deno.serve(async () => {
  const db = createClient(env('SUPABASE_URL')!, env('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const cfg = {
    siteUrl: env('SITE_URL', 'https://nextpartitions.com')!.replace(/\/$/, ''),
    coordinatorEmail: env('COORDINATOR_EMAIL', '')!,
    phone: env('SITE_PHONE', '1-833-997-7489')!,
    timeZone: env('TIME_ZONE', 'America/Chicago')!,
  }
  const { data: rows, error } = await db.rpc('dir_outbox_claim', { p_limit: 20 })
  if (error) return new Response(error.message, { status: 500 })
  let sent = 0, failed = 0
  for (const row of rows ?? []) {
    try {
      const { data: ctx, error: e } = await db.rpc('dir_outbox_context', { p_id: row.id })
      if (e) throw new Error(e.message)
      const messages = renderMessages(ctx as OutboxContext, cfg)
      if (messages.some((m) => m.audience === 'coordinator' && !m.to)) throw new Error('COORDINATOR_EMAIL is not set')
      for (const [i, m] of messages.entries()) await send(m, `dir-outbox-${row.id}-${i}`)
      await db.rpc('dir_outbox_done', { p_id: row.id, p_error: null })
      sent += messages.length
    } catch (e) {
      failed++
      await db.rpc('dir_outbox_done', { p_id: row.id, p_error: String((e as Error).message ?? e).slice(0, 500) })
    }
  }
  return Response.json({ claimed: rows?.length ?? 0, sent, failed })
})
