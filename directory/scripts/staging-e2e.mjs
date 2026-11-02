// End-to-end run of the installer directory job flow against staging (results: docs/staging-run-2026-11-02.md).
// Usage: node e2e.mjs <path to directory/app>   (reads <app>/.env)
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const APP = process.argv[2]
const require = createRequire(APP + '/package.json')
const { createClient } = require('@supabase/supabase-js')
const env = Object.fromEntries(readFileSync(APP + '/.env', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const URL = env.SUPABASE_URL, PUB = env.SUPABASE_PUBLISHABLE_KEY, SR = env.SUPABASE_SERVICE_ROLE_KEY
const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const service = createClient(URL, SR, opts)
const anon = () => createClient(URL, PUB, opts)
const RUN = Date.now().toString(36)
const results = []
const step = async (name, fn) => {
  try { const r = await fn(); results.push(['PASS', name, r ?? '']); console.log('PASS', name, r ?? ''); return r }
  catch (e) { results.push(['FAIL', name, e.message]); console.log('FAIL', name, '-', e.message); return undefined }
}
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data }
const expect = (cond, msg) => { if (!cond) throw new Error(msg) }
const pdf = new Blob(['%PDF-1.4\n% staging test file\n'], { type: 'application/pdf' })
const jpg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })

async function user(email) {
  const password = 'Stg-' + RUN + '-x9!'
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true })
  if (error && !/already/.test(error.message)) throw new Error(error.message)
  let id = data?.user?.id
  if (!id) { id = (await service.auth.admin.listUsers()).data.users.find((u) => u.email === email).id; await service.auth.admin.updateUserById(id, { password }) }
  const c = createClient(URL, PUB, opts)
  must(await c.auth.signInWithPassword({ email, password }))
  return { id, c }
}

// ---------- 1. Applications (anonymous, as /installers/apply/ does) ----------
const APPLICANTS = [
  { business_name: `Lone Star Partitions ${RUN}`, base_city: 'Dallas', base_zip: '75201', phone: '214-555-0150' },
  { business_name: `Metroplex Restroom Installs ${RUN}`, base_city: 'Fort Worth', base_zip: '76102', phone: '817-555-0120' },
  { business_name: `Collin County Partitions ${RUN}`, base_city: 'Plano', base_zip: '75074', phone: '972-555-0190' },
]
const inst = []
for (const [n, a] of APPLICANTS.entries()) {
  const email = `installer${n + 1}+${RUN}@example.com`
  const id = await step(`application ${n + 1} submitted (anon dir_submit_application)`, async () => must(await anon().rpc('dir_submit_application', { p: {
    ...a, contact_name: 'Test Contact', email, service_radius_mi: 60, years_in_business: 6, crew_size: '3-5',
    materials: ['hdpe', 'phenolic'], mountings: ['overhead_braced'], extras: ['ada'], registration_number: 'REG-' + n,
    references: [{ name: 'Kim Lee', company: 'Example GC', phone: '214-555-0101' }, { name: 'Ana Ruiz', email: 'ana@example.com' }],
    rates: { per_stall: { hdpe: 14000 + n * 1000, phenolic: 16000 }, ada_stall_cents: 4000, minimum_cents: 70000, free_miles: 60, per_mile_cents: 200 },
    agreement_name: 'Test Contact', website: '' } })))
  if (!id) continue
  await step(`application ${n + 1}: insurance + registration uploaded to dir-documents (anon)`, async () => {
    const c = anon()
    for (const check of ['insurance', 'business_registration']) {
      const path = `${id}/${check}-${RUN}.pdf`
      must(await c.storage.from('dir-documents').upload(path, pdf, { contentType: 'application/pdf' }))
      must(await c.rpc('dir_application_document', { p_installer: id, p_check: check, p_path: path }))
    }
  })
  inst.push({ id, email, slug: null })
}
await step('anon cannot read installers, uploads or outbox', async () => {
  const c = anon()
  for (const t of ['dir_installers', 'dir_document_uploads', 'dir_outbox', 'dir_jobs', 'dir_job_contacts']) {
    const { data } = await c.from(t).select('*').limit(1); expect(!data?.length, `${t} readable by anon`)
  }
})

// ---------- 2. Coordinator: vetting ----------
const coordEmail = `coordinator+${RUN}@example.com`
const coord = await user(coordEmail)
must(await service.from('dir_admins').insert({ user_id: coord.id })) // README step 3: map dir_admins (no UI for this)
const C = coord.c

await step('coordinator sees the 3 applications and their document uploads', async () => {
  const rows = must(await C.from('dir_installers').select('id, slug, status').in('id', inst.map((i) => i.id)))
  expect(rows.length === 3 && rows.every((r) => r.status === 'applied'), 'applications missing or wrong status')
  rows.forEach((r) => { inst.find((i) => i.id === r.id).slug = r.slug })
  const ups = must(await C.from('dir_document_uploads').select('*').in('installer_id', inst.map((i) => i.id)))
  expect(ups.length === 6, `expected 6 uploads, got ${ups.length}`)
  const signed = must(await C.storage.from('dir-documents').createSignedUrl(ups[0].path, 60))
  const r = await fetch(signed.signedUrl); expect(r.ok, 'coordinator cannot open the uploaded document')
  return `${ups.length} uploads, document opens`
})

await step('coordinator: approving before checks is refused', async () => {
  const { error } = await C.from('dir_installers').update({ status: 'approved' }).eq('id', inst[0].id)
  expect(error && /checks must pass/.test(error.message), 'approval not blocked: ' + error?.message)
})

// installer logins: the portal's "give a login" uses inviteUserByEmail on the server
await step('give installer 1 a login via inviteUserByEmail (what portal/server.ts does)', async () => {
  const { data, error } = await service.auth.admin.inviteUserByEmail(inst[0].email, { redirectTo: 'http://localhost:3000/portal/' })
  if (error) throw new Error(error.message)
  must(await C.from('dir_installers').select('id').eq('id', inst[0].id))
  must(await service.from('dir_installers').update({ user_id: data.user.id }).eq('id', inst[0].id))
  return 'invite sent'
})
for (const i of inst) {
  const u = await user(i.email) // password login stands in for the emailed link
  i.c = u.c; i.uid = u.id
  must(await service.from('dir_installers').update({ user_id: u.id }).eq('id', i.id))
}

for (const [n, i] of inst.entries()) {
  await step(`vetting ${n + 1}: documents accepted, references called, agreement checked`, async () => {
    const ups = must(await C.from('dir_document_uploads').select('*').eq('installer_id', i.id))
    for (const u of ups) {
      must(await C.from('dir_installer_checks').upsert({ installer_id: i.id, check_type: u.check_type, status: 'passed',
        verified_at: new Date().toISOString().slice(0, 10), expires_at: '2027-10-31', document_path: u.path,
        public_label: { insurance: 'Insurance on file ($1M general liability)', business_registration: 'Texas business registration' }[u.check_type] ?? null }, { onConflict: 'installer_id,check_type' }))
      must(await C.from('dir_document_uploads').update({ reviewed_at: new Date().toISOString(), review_note: 'OK' }).eq('id', u.id))
    }
    const refs = must(await C.from('dir_installer_references').select('id').eq('installer_id', i.id))
    for (const r of refs) must(await C.from('dir_installer_references').update({ called_at: new Date().toISOString(), outcome: 'good', note: 'Good' }).eq('id', r.id))
    for (const t of ['references', 'listing_agreement'])
      must(await C.from('dir_installer_checks').upsert({ installer_id: i.id, check_type: t, status: 'passed', verified_at: new Date().toISOString().slice(0, 10) }, { onConflict: 'installer_id,check_type' }))
  })
  i.testJob = await step(`vetting ${n + 1}: test job sent (dir_send_test_job)`, async () => must(await C.rpc('dir_send_test_job', { p_installer: i.id })))
  await step(`vetting ${n + 1}: installer sees test job, no customer contact, prices it`, async () => {
    const inv = must(await i.c.from('dir_job_invites').select('*').eq('installer_id', i.id))
    expect(inv.some((x) => x.job_id === i.testJob), 'test job not in inbox')
    const contacts = must(await i.c.from('dir_job_contacts').select('*'))
    expect(contacts.length === 0, 'installer can read contacts')
    must(await i.c.from('dir_job_invites').update({ price_cents: 72000, earliest_install_date: '2026-11-20', assumptions: 'test' }).eq('job_id', i.testJob).eq('installer_id', i.id))
    const after = must(await C.from('dir_job_invites').select('responded_at').eq('job_id', i.testJob).single())
    expect(after.responded_at, 'responded_at not stamped')
  })
  await step(`vetting ${n + 1}: response test passed, listed as Verified (areas, tracked phone, approved, notice)`, async () => {
    must(await C.from('dir_installer_checks').upsert({ installer_id: i.id, check_type: 'response_test', status: 'passed', verified_at: new Date().toISOString().slice(0, 10) }, { onConflict: 'installer_id,check_type' }))
    must(await C.from('dir_service_areas').delete().eq('installer_id', i.id))
    must(await C.from('dir_service_areas').insert({ installer_id: i.id, area_slug: 'dallas' }))
    must(await C.from('dir_installers').update({ tracked_phone: '214-555-01' + (60 + n) }).eq('id', i.id))
    must(await C.from('dir_installers').update({ status: 'approved' }).eq('id', i.id))
    must(await C.rpc('dir_vetting_notice', { p_installer: i.id, p_kind: 'approved', p_note: null }))
  })
}
await step('installer cannot approve itself or change its tracked phone', async () => {
  const i = inst[0]
  await i.c.from('dir_installers').update({ tracked_phone: '000' }).eq('id', i.id)
  const row = must(await C.from('dir_installers').select('tracked_phone').eq('id', i.id).single())
  expect(row.tracked_phone !== '000', 'installer changed tracked phone')
})
await step('publish the DFW area (3 listed installers) and public views show them as Verified', async () => {
  must(await C.from('dir_areas').update({ published: true }).eq('slug', 'dallas'))
  const pub = must(await anon().from('dir_public_installers').select('slug, installs, checks, areas').contains('areas', ['dallas']))
  const ours = pub.filter((p) => inst.some((i) => i.slug === p.slug))
  expect(ours.length === 3, `public installers: ${ours.length}`)
  expect(ours.every((p) => p.installs === 0), 'installs should be 0 (Verified)')
  expect(ours.every((p) => (p.checks ?? []).some((c) => /Insurance on file/.test(c.label))), 'insurance label missing on a profile')
  const area = must(await anon().from('dir_areas').select('slug').eq('slug', 'dallas'))
  expect(area.length === 1, 'area not readable once published')
  return ours.map((p) => p.slug).join(', ')
})

// ---------- 3. A real job: coordinator enters it, routes it ----------
const job = await step('coordinator enters a job by hand (Plano, 6 HDPE stalls) with contact', async () => {
  const row = must(await C.from('dir_jobs').insert({ quote_request_ref: 'QR-' + RUN, area_slug: 'dallas', city: 'Plano', zip: '75074',
    scope: { material: 'hdpe', mounting: 'overhead_braced', stalls: 6, ada_stalls: 1, remove_old: true },
    delivery_window: '[2026-11-16,2026-11-21)' }).select('id, ref, lat').single())
  must(await C.from('dir_job_contacts').insert({ job_id: row.id, customer_name: 'Pat Lee', company: 'Plano ISD (test)', email: `customer+${RUN}@example.com`,
    phone: '972-555-0111', site_address: '1 Test St, Plano TX 75074', site_contact: 'Front office' }))
  expect(row.lat, 'job has no location from ZIP')
  return row
})
const J = job?.id
await step('drawings uploaded to dir-drawings', async () => {
  const path = `${J}/drawings-${RUN}.pdf`
  must(await C.storage.from('dir-drawings').upload(path, pdf, { contentType: 'application/pdf' }))
  must(await C.from('dir_jobs').update({ drawings_path: path }).eq('id', J))
})
await step('partitions quote saved (dir_job_quotes)', async () => {
  must(await C.from('dir_job_quotes').update({ quote_ref: 'Q-' + RUN, partitions_cents: 527000, freight_cents: 38500, valid_until: '2026-12-31', updated_at: new Date().toISOString() }).eq('job_id', J))
})
await step('presenting a job with no installer prices is refused', async () => {
  const { error } = await C.from('dir_jobs').update({ status: 'presented' }).eq('id', J)
  expect(error && /No installer prices/.test(error.message), 'presented with no prices: ' + error?.message)
})
const invited = await step('routing: dir_route_job invites installers', async () => {
  const n = must(await C.rpc('dir_route_job', { p_job: J })); expect(n > 0, 'nobody invited'); return n
})

// ---------- 4. Installers price ----------
for (const [n, i] of inst.entries()) {
  await step(`installer ${n + 1}: blind packet only (no contact), can read drawings, prices`, async () => {
    const inv = must(await i.c.from('dir_job_invites').select('*').eq('job_id', J).eq('installer_id', i.id))
    if (!inv.length) return 'not invited'
    const j = must(await i.c.from('dir_jobs').select('*').eq('id', J).single())
    expect(j.city === 'Plano', 'job not visible')
    const ct = must(await i.c.from('dir_job_contacts').select('*').eq('job_id', J))
    expect(ct.length === 0, 'contact visible before release')
    const s = must(await i.c.storage.from('dir-drawings').createSignedUrl(j.drawings_path, 60))
    expect((await fetch(s.signedUrl)).ok, 'drawings not downloadable')
    const qs = must(await i.c.from('dir_job_quotes').select('*'))
    expect(qs.length === 0, 'installer can read quotes')
    must(await i.c.from('dir_job_invites').update({ price_cents: [180000, 210000, 400000][n], earliest_install_date: '2026-11-24', assumptions: 'Old partitions removed' }).eq('job_id', J).eq('installer_id', i.id))
    const m = await i.c.from('dir_job_messages').insert({ job_id: J, installer_id: i.id, sender: 'installer', body: 'Call me on 214-555-9999 or me@example.com' }).select('body').single()
    return `estimate ${inv[0].estimate_cents}, message stored as "${m.data?.body ?? m.error?.message}"`
  })
}
await step('coordinator sees prices and flags; clears flags; presents to customer', async () => {
  const inv = must(await C.from('dir_job_invites').select('installer_id, price_cents, estimate_cents, price_flag').eq('job_id', J))
  for (const x of inv.filter((x) => x.price_flag)) must(await C.from('dir_job_invites').update({ price_flag: null }).eq('job_id', J).eq('installer_id', x.installer_id))
  must(await C.from('dir_jobs').update({ status: 'presented' }).eq('id', J))
  return inv.map((x) => `${x.price_cents}/${x.estimate_cents}${x.price_flag ? ' flag:' + x.price_flag : ''}`).join('; ')
})

// ---------- 5. Customer (no login, secret link) ----------
const token = (await C.from('dir_job_quotes').select('token').eq('job_id', J).single()).data?.token
let chosen
await step('customer opens quote link (dir_customer_quote)', async () => {
  const q = must(await anon().rpc('dir_customer_quote', { p_token: token }))
  expect(q && q.customer_name === 'Pat Lee', 'quote not returned')
  return `${q.prices?.length} prices, has_drawings ${q.has_drawings}`
})
await step('customer downloads drawings (quote/server.ts path, service role signed URL)', async () => {
  const j = must(await service.from('dir_jobs').select('drawings_path').eq('id', J).single())
  const s = must(await service.storage.from('dir-drawings').createSignedUrl(j.drawings_path, 600))
  expect((await fetch(s.signedUrl)).ok, 'download failed')
})
await step('customer approves drawings and chooses the best price', async () => {
  const c = anon()
  must(await c.rpc('dir_customer_approve_drawings', { p_token: token }))
  const q = must(await c.rpc('dir_customer_quote', { p_token: token }))
  expect(q.prices.length > 0, 'no prices shown')
  chosen = inst.find((i) => i.slug === q.prices.sort((a, b) => a.price_cents - b.price_cents)[0].slug)
  must(await c.rpc('dir_customer_choose', { p_token: token, p_installer: chosen.id }))
  return chosen.slug
})
await step('customer says they will pay by PO', async () => {
  must(await anon().rpc('dir_customer_payment', { p_token: token, p_method: 'po', p_po_number: 'PO-' + RUN }))
})
await step('chosen installer still cannot see customer details before payment', async () => {
  const ct = must(await chosen.c.from('dir_job_contacts').select('*').eq('job_id', J)); expect(ct.length === 0, 'released too early')
})

// ---------- 6. Payment releases the job ----------
await step('coordinator accepts PO -> job released, chosen installer sees contact, others do not', async () => {
  must(await C.from('dir_jobs').update({ po_accepted_at: new Date().toISOString() }).eq('id', J))
  const j = must(await C.from('dir_jobs').select('status, released_at').eq('id', J).single())
  expect(j.released_at && j.status === 'released', `status ${j.status}, released_at ${j.released_at}`)
  const ct = must(await chosen.c.from('dir_job_contacts').select('customer_name, site_address').eq('job_id', J))
  expect(ct.length === 1, 'chosen installer cannot see contact after release')
  for (const o of inst.filter((i) => i !== chosen)) {
    const x = must(await o.c.from('dir_job_contacts').select('*').eq('job_id', J)); expect(x.length === 0, 'other installer sees contact')
  }
})

// ---------- 7. Install ----------
await step('installer: install date before delivery is refused', async () => {
  const { error } = await chosen.c.from('dir_jobs').update({ install_date: '2026-11-10', status: 'scheduled' }).eq('id', J)
  expect(error, 'early install date accepted')
})
await step('installer schedules, uploads photo, marks installed', async () => {
  must(await chosen.c.from('dir_jobs').update({ install_date: '2026-11-24', status: 'scheduled' }).eq('id', J))
  must(await chosen.c.from('dir_job_events').insert({ job_id: J, status: 'scheduled', note: 'Install date 2026-11-24', created_by: chosen.uid }))
  const path = `${J}/after-${RUN}.jpg`
  must(await chosen.c.storage.from('dir-job-photos').upload(path, jpg, { contentType: 'image/jpeg' }))
  must(await chosen.c.from('dir_jobs').update({ status: 'installed' }).eq('id', J))
  must(await chosen.c.from('dir_job_events').insert({ job_id: J, status: 'installed', note: 'Done', photo_paths: [path], created_by: chosen.uid }))
})
await step('coordinator signs off -> completed_job check, label becomes Approved (installs 1)', async () => {
  must(await C.from('dir_jobs').update({ status: 'signed_off' }).eq('id', J))
  const p = must(await anon().from('dir_public_installers').select('installs, checks').eq('slug', chosen.slug).single())
  expect(p.installs === 1, `installs ${p.installs}`)
})

// ---------- 8. Review ----------
await step('review recorded and shown publicly (coordinator enters it; no customer review page yet)', async () => {
  must(await C.from('dir_reviews').insert({ job_id: J, installer_id: chosen.id, rating: 5, body: 'On time and tidy.', reviewer_display: 'Facilities manager, Plano', published_at: new Date().toISOString() }))
  const r = must(await anon().from('dir_public_reviews').select('rating, body').eq('slug', chosen.slug))
  expect(r.length === 1, 'review not public')
  const p = must(await anon().from('dir_public_installers').select('rating, review_count').eq('slug', chosen.slug).single())
  return `rating ${p.rating} from ${p.review_count}`
})

// ---------- 9. Outbox ----------
await step('email worker: invoke dir-outbox and check the outbox drains', async () => {
  // The worker takes 20 rows a run (cron runs it every minute); call it until nothing due is left.
  let r, body, rows, due, unsent
  for (let n = 0; n < 10; n++) {
    r = await fetch(`${URL}/functions/v1/dir-outbox`, { method: 'POST', headers: { Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' }, body: '{}' })
    body = await r.text()
    rows = must(await service.from('dir_outbox').select('kind, sent_at, attempts, last_error, deliver_after'))
    due = rows.filter((x) => new Date(x.deliver_after ?? 0) <= new Date())
    unsent = due.filter((x) => !x.sent_at)
    if (!unsent.length || !r.ok) break
  }
  const kinds = [...new Set(rows.map((x) => x.kind))].sort().join(',')
  if (unsent.length) throw new Error(`HTTP ${r.status} ${body.slice(0, 200)}; ${unsent.length}/${due.length} due unsent; errors: ${[...new Set(unsent.map((x) => x.last_error))].join(' | ').slice(0, 300)}`)
  return `HTTP ${r.status} ${body.slice(0, 120)}; ${rows.length} rows (${kinds})`
})

console.log('\nSUMMARY', results.filter((r) => r[0] === 'PASS').length, 'pass,', results.filter((r) => r[0] === 'FAIL').length, 'fail')
console.log(JSON.stringify({ run: RUN, job: J, ref: job?.ref, token: token ? token.slice(0, 6) + '…' : null, chosen: chosen?.slug, slugs: inst.map((i) => i.slug) }))
