import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// The one portal action that needs the service role: creating an installer's login. Everything else
// runs in the browser as the logged-in user, under row-level security.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server (never sent to the browser).
export const inviteInstallerLogin = createServerFn({ method: 'POST' })
  .validator((d: unknown) => z.object({ accessToken: z.string().min(20), installerId: z.uuid(), email: z.email() }).parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !service) throw new Error('Installer logins need SUPABASE_SERVICE_ROLE_KEY on the server')
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

    // Only the job coordinator (dir_admins) may give an installer a login.
    const caller = (await admin.auth.getUser(data.accessToken)).data.user
    const isAdmin = caller && (await admin.from('dir_admins').select('user_id').eq('user_id', caller.id).maybeSingle()).data
    if (!isAdmin) throw new Error('Only the job coordinator can invite installers')

    const installer = (await admin.from('dir_installers').select('id, user_id').eq('id', data.installerId).maybeSingle()).data
    if (!installer) throw new Error('Installer not found')
    if (installer.user_id) throw new Error('This installer already has a login')

    const site = process.env.SITE_URL ?? 'https://nextpartitions.com'
    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(data.email, { redirectTo: `${site}/portal/` })
    if (error || !invited.user) throw new Error(error?.message ?? 'Could not send the invite')
    const linked = await admin.from('dir_installers').update({ user_id: invited.user.id }).eq('id', installer.id)
    if (linked.error) throw new Error(linked.error.message)
    return { ok: true }
  })
