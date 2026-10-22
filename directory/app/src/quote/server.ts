import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// The customer has no login, so the drawings link is signed on the server: the quote token proves which job.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.
export const customerDrawingsUrl = createServerFn({ method: 'POST' })
  .validator((d: unknown) => z.object({ token: z.string().regex(/^[a-f0-9]{32,80}$/) }).parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !service) throw new Error('Drawings download is not set up yet. Call 1-833-997-7489 and we will email them.')
    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
    const q = (await db.from('dir_job_quotes').select('job_id').eq('token', data.token).maybeSingle()).data
    const job = q && (await db.from('dir_jobs').select('drawings_path, is_test').eq('id', q.job_id).maybeSingle()).data
    if (!job || job.is_test || !job.drawings_path) throw new Error('No drawings for this quote yet')
    const signed = await db.storage.from('dir-drawings').createSignedUrl(job.drawings_path, 600)
    if (signed.error) throw new Error(signed.error.message)
    return { url: signed.data.signedUrl }
  })
