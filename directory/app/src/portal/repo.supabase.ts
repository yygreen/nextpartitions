import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PortalRepo } from './repo'
import { inviteInstallerLogin } from './server'
import { formatDateRange, parseDateRange } from './stage'
import type { CheckRow, Contact, DocumentUpload, Invite, InstallerSelf, Job, JobEvent, Message, RateRow } from './types'

// Browser-side, with the publishable key and the user's own session: every read and write below is
// checked by row-level security (supabase/migrations). Nothing here relies on the UI hiding things.
export function supabasePortal(url: string, key: string): PortalRepo & { db: SupabaseClient } {
  const db = createClient(url, key)

  // Untyped rows (no generated Supabase types in this module); the to* mappers below give them shape.
  const must = ({ data, error }: { data: unknown; error: unknown }): any => {
    if (error) throw error
    return data
  }
  const ok = ({ error }: { error: unknown }) => {
    if (error) throw error
  }
  // Storage keys: no spaces or odd characters, and a timestamp so a re-upload never overwrites.
  const key_ = (folder: string, file: File) => `${folder}/${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`

  const toJob = (r: any): Job => ({
    id: r.id, ref: r.ref, quoteRequestRef: r.quote_request_ref, areaSlug: r.area_slug, city: r.city, zip: r.zip,
    scope: r.scope ?? {}, drawingsPath: r.drawings_path, delivery: parseDateRange(r.delivery_window), status: r.status,
    chosenInstallerId: r.chosen_installer_id, preferredInstallerId: r.preferred_installer_id,
    partitionsPaidAt: r.partitions_paid_at, poAcceptedAt: r.po_accepted_at, releasedAt: r.released_at,
    installDate: r.install_date, neededBy: r.needed_by, rush: r.rush, requiresBackgroundCheck: r.requires_background_check,
    searchRound: r.search_round, priceDueAt: r.price_due_at, windowClosedAt: r.window_closed_at,
    needsAttention: r.needs_attention, attentionReason: r.attention_reason, createdAt: r.created_at,
  })
  const toInvite = (r: any): Invite => ({
    jobId: r.job_id, installerId: r.installer_id, round: r.round, invitedBy: r.invited_by, sentAt: r.sent_at, dueAt: r.due_at,
    respondedAt: r.responded_at, declined: r.declined, declinedReason: r.declined_reason, priceCents: r.price_cents,
    estimateCents: r.estimate_cents, earliestInstallDate: r.earliest_install_date, assumptions: r.assumptions,
    notes: r.installer_notes, late: r.late, priceFlag: r.price_flag,
  })
  const toInstaller = (r: any): InstallerSelf => ({
    id: r.id, slug: r.slug, displayName: r.display_name, status: r.status, baseCity: r.base_city, baseState: r.base_state,
    baseZip: r.base_zip, serviceRadiusMi: r.service_radius_mi, materials: r.materials ?? [], mountings: r.mountings ?? [],
    about: r.about, photoUrl: r.photo_url, maxOpenJobs: r.max_open_jobs, awayFrom: r.away_from, awayTo: r.away_to,
  })
  const toMessage = (r: any): Message => ({
    id: r.id, jobId: r.job_id, installerId: r.installer_id, sender: r.sender, body: r.body, redacted: r.redacted, createdAt: r.created_at,
  })
  const toUpload = (r: any): DocumentUpload => ({
    id: r.id, installerId: r.installer_id, checkType: r.check_type, path: r.path, uploadedAt: r.uploaded_at,
    reviewedAt: r.reviewed_at, reviewNote: r.review_note,
  })

  const uid = async () => (await db.auth.getUser()).data.user?.id ?? null
  // The session stored in the browser: no network round trip, fine for deciding what to show.
  const sessionUser = async () => (await db.auth.getSession()).data.session?.user ?? null

  return {
    db,
    sample: false,

    async me() {
      const user = await sessionUser()
      if (!user) return { kind: 'none' }
      const id = user.id
      const admin = must(await db.from('dir_admins').select('user_id').eq('user_id', id).maybeSingle())
      if (admin) return { kind: 'coordinator' }
      const r = must(await db.from('dir_installers').select('*').eq('user_id', id).maybeSingle())
      return r ? { kind: 'installer', installer: toInstaller(r) } : { kind: 'none', email: user.email ?? '' }
    },
    async signOut() { ok(await db.auth.signOut()) },
    async fileUrl(bucket, path) {
      if (bucket === 'dir-profile-photos') return db.storage.from(bucket).getPublicUrl(path).data.publicUrl
      return must(await db.storage.from(bucket).createSignedUrl(path, 600)).signedUrl
    },

    async myJobs(installerId) {
      const invites: Invite[] = must(await db.from('dir_job_invites').select('*').eq('installer_id', installerId)).map(toInvite)
      if (invites.length === 0) return []
      const jobs: Job[] = must(await db.from('dir_jobs').select('*').in('id', invites.map((i) => i.jobId))).map(toJob)
      return invites.flatMap((invite) => {
        const job = jobs.find((j) => j.id === invite.jobId)
        return job ? [{ job, invite }] : []
      })
    },
    async messages(jobId, installerId) {
      let q = db.from('dir_job_messages').select('*').eq('job_id', jobId)
      if (installerId) q = q.eq('installer_id', installerId)
      return must(await q.order('created_at')).map(toMessage)
    },
    async contact(jobId) {
      const r = must(await db.from('dir_job_contacts').select('*').eq('job_id', jobId).maybeSingle())
      return r ? {
        customerName: r.customer_name, company: r.company, email: r.email, phone: r.phone,
        siteAddress: r.site_address, siteContact: r.site_contact,
      } satisfies Contact : null
    },
    async events(jobId) {
      return must(await db.from('dir_job_events').select('*').eq('job_id', jobId).order('created_at')).map((r: any): JobEvent => ({
        id: r.id, status: r.status, note: r.note, photoPaths: r.photo_paths ?? [], createdAt: r.created_at,
      }))
    },
    async answerInvite(jobId, installerId, a) {
      ok(await db.from('dir_job_invites').update({
        price_cents: a.priceCents, earliest_install_date: a.earliestInstallDate, assumptions: a.assumptions, installer_notes: a.notes,
      }).eq('job_id', jobId).eq('installer_id', installerId))
    },
    async declineInvite(jobId, installerId, reason) {
      ok(await db.from('dir_job_invites').update({ declined: true, declined_reason: reason || null })
        .eq('job_id', jobId).eq('installer_id', installerId))
    },
    async sendMessage(jobId, installerId, sender, body) {
      ok(await db.from('dir_job_messages').insert({ job_id: jobId, installer_id: installerId, sender, body }))
    },
    async schedule(jobId, installDate) {
      ok(await db.from('dir_jobs').update({ install_date: installDate, status: 'scheduled' }).eq('id', jobId))
      ok(await db.from('dir_job_events').insert({ job_id: jobId, status: 'scheduled', note: `Install date ${installDate}`, created_by: await uid() }))
    },
    async markInstalled(jobId, note, photos) {
      const paths: string[] = []
      for (const f of photos) {
        const path = key_(jobId, f)
        ok(await db.storage.from('dir-job-photos').upload(path, f, { contentType: f.type }))
        paths.push(path)
      }
      ok(await db.from('dir_jobs').update({ status: 'installed' }).eq('id', jobId))
      ok(await db.from('dir_job_events').insert({ job_id: jobId, status: 'installed', note, photo_paths: paths, created_by: await uid() }))
    },
    async saveProfile(installerId, p) {
      const row: Record<string, unknown> = {}
      if (p.displayName !== undefined) row.display_name = p.displayName
      if (p.serviceRadiusMi !== undefined) row.service_radius_mi = p.serviceRadiusMi
      if (p.materials !== undefined) row.materials = p.materials
      if (p.mountings !== undefined) row.mountings = p.mountings
      if (p.about !== undefined) row.about = p.about
      if (p.photoUrl !== undefined) row.photo_url = p.photoUrl
      if (p.maxOpenJobs !== undefined) row.max_open_jobs = p.maxOpenJobs
      if (p.awayFrom !== undefined) row.away_from = p.awayFrom
      if (p.awayTo !== undefined) row.away_to = p.awayTo
      ok(await db.from('dir_installers').update(row).eq('id', installerId))
    },
    async uploadProfilePhoto(installerId, file) {
      const path = key_(installerId, file)
      ok(await db.storage.from('dir-profile-photos').upload(path, file, { contentType: file.type }))
      return db.storage.from('dir-profile-photos').getPublicUrl(path).data.publicUrl
    },
    async rateCards(installerId) {
      return must(await db.from('dir_rate_cards').select('*').eq('installer_id', installerId).order('material').order('mounting'))
        .map((r: any): RateRow => ({
          material: r.material, mounting: r.mounting, perStallLowCents: r.per_stall_low_cents, perStallHighCents: r.per_stall_high_cents,
          minimumCents: r.minimum_cents, extras: r.extras ?? {},
        }))
    },
    async saveRates(installerId, rows) {
      const keep = new Set(rows.map((r) => `${r.material}/${r.mounting}`))
      const existing = must(await db.from('dir_rate_cards').select('id, material, mounting').eq('installer_id', installerId))
      const gone = existing.filter((r: any) => !keep.has(`${r.material}/${r.mounting}`)).map((r: any) => r.id)
      if (gone.length) ok(await db.from('dir_rate_cards').delete().in('id', gone))
      if (rows.length) {
        ok(await db.from('dir_rate_cards').upsert(rows.map((r) => ({
          installer_id: installerId, material: r.material, mounting: r.mounting, per_stall_low_cents: r.perStallLowCents,
          per_stall_high_cents: r.perStallHighCents, minimum_cents: r.minimumCents, extras: r.extras, updated_at: new Date().toISOString(),
        })), { onConflict: 'installer_id,material,mounting' }))
      }
    },
    async checks(installerId) {
      return must(await db.from('dir_installer_checks').select('check_type, status, verified_at, expires_at, public_label')
        .eq('installer_id', installerId)).map((r: any): CheckRow => ({
        checkType: r.check_type, status: r.status, verifiedAt: r.verified_at, expiresAt: r.expires_at, publicLabel: r.public_label,
      }))
    },
    async uploads(installerId) {
      let q = db.from('dir_document_uploads').select('*')
      q = installerId ? q.eq('installer_id', installerId) : q.is('reviewed_at', null)
      return must(await q.order('uploaded_at', { ascending: false })).map(toUpload)
    },
    async uploadDocument(installerId, checkType, file) {
      const path = key_(installerId, file)
      ok(await db.storage.from('dir-documents').upload(path, file, { contentType: file.type }))
      ok(await db.from('dir_document_uploads').insert({ installer_id: installerId, check_type: checkType, path }))
    },
    async performance(slug) {
      const r = must(await db.from('dir_public_installers').select('median_reply_hours, rating, review_count, installs').eq('slug', slug).maybeSingle())
      return r ? {
        medianReplyHours: r.median_reply_hours === null ? null : Number(r.median_reply_hours),
        rating: r.rating === null ? null : Number(r.rating), reviewCount: Number(r.review_count ?? 0), installs: Number(r.installs ?? 0),
      } : null
    },

    async allJobs() {
      const jobs: Job[] = must(await db.from('dir_jobs').select('*').order('created_at', { ascending: false }).limit(300)).map(toJob)
      if (jobs.length === 0) return []
      const invites: Invite[] = must(await db.from('dir_job_invites').select('*').in('job_id', jobs.map((j) => j.id))).map(toInvite)
      return jobs.map((job) => ({ job, invites: invites.filter((i) => i.jobId === job.id) }))
    },
    async installers() {
      return must(await db.from('dir_installers').select('id, display_name, status, base_city, user_id').order('display_name'))
        .map((r: any) => ({ id: r.id, displayName: r.display_name, status: r.status, baseCity: r.base_city, hasLogin: r.user_id !== null }))
    },
    async createJob(j, drawings) {
      const row = must(await db.from('dir_jobs').insert({
        quote_request_ref: j.quoteRequestRef, area_slug: j.areaSlug, city: j.city, zip: j.zip, scope: j.scope,
        delivery_window: formatDateRange(j.delivery), needed_by: j.neededBy, preferred_installer_id: j.preferredInstallerId,
        rush: j.rush, requires_background_check: j.requiresBackgroundCheck,
      }).select('id').single())
      const c = j.contact
      ok(await db.from('dir_job_contacts').insert({
        job_id: row.id, customer_name: c.customerName, company: c.company, email: c.email, phone: c.phone,
        site_address: c.siteAddress, site_contact: c.siteContact,
      }))
      if (drawings) await this.uploadDrawings(row.id, drawings)
      return row.id as string
    },
    async uploadDrawings(jobId, file) {
      const path = key_(jobId, file)
      ok(await db.storage.from('dir-drawings').upload(path, file, { contentType: file.type }))
      ok(await db.from('dir_jobs').update({ drawings_path: path }).eq('id', jobId))
    },
    async routeJob(jobId) {
      return must(await db.rpc('dir_route_job', { p_job: jobId })) as number
    },
    async inviteInstaller(jobId, installerId) {
      ok(await db.rpc('dir_invite_installer', { p_job: jobId, p_installer: installerId }))
    },
    async updateJob(jobId, p) {
      const row: Record<string, unknown> = {}
      if (p.status !== undefined) row.status = p.status
      if (p.chosenInstallerId !== undefined) row.chosen_installer_id = p.chosenInstallerId
      if (p.partitionsPaidAt !== undefined) row.partitions_paid_at = p.partitionsPaidAt
      if (p.poAcceptedAt !== undefined) row.po_accepted_at = p.poAcceptedAt
      if (p.needsAttention !== undefined) row.needs_attention = p.needsAttention
      if (p.attentionReason !== undefined) row.attention_reason = p.attentionReason
      if (p.drawingsPath !== undefined) row.drawings_path = p.drawingsPath
      ok(await db.from('dir_jobs').update(row).eq('id', jobId))
    },
    async reviewUpload(id, r) {
      const u = toUpload(must(await db.from('dir_document_uploads').select('*').eq('id', id).single()))
      if (r.accepted) {
        ok(await db.from('dir_installer_checks').upsert({
          installer_id: u.installerId, check_type: u.checkType, status: 'passed', verified_at: new Date().toISOString().slice(0, 10),
          expires_at: r.expiresAt, document_path: u.path,
        }, { onConflict: 'installer_id,check_type' }))
      }
      ok(await db.from('dir_document_uploads').update({ reviewed_at: new Date().toISOString(), review_note: r.note }).eq('id', id))
    },
    async inviteLogin(installerId, email) {
      const token = (await db.auth.getSession()).data.session?.access_token
      if (!token) throw new Error('Sign in again to invite installers')
      await inviteInstallerLogin({ data: { accessToken: token, installerId, email } })
    },
  }
}
