import type { PortalRepo } from './repo'
import { addDays } from './stage'
import type {
  Applicant, AreaCoverage, CheckDetail, CheckRow, CheckType, Contact, DocumentUpload, Invite, InstallerSelf, InstallerSummary, Job,
  JobEvent, Me, Message, QuoteAdmin, RateRow, Reference,
} from './types'

// FICTIONAL sample data, held in memory, so the portal runs without Supabase (development, preview).
// It imitates the database rules loosely; the real rules live in supabase/migrations and their tests.
export const PORTAL_SAMPLE_NOTICE = 'Sample portal: all jobs, customers, prices and messages are fictional. Nothing is saved.'

const today = new Date().toISOString().slice(0, 10)
const at = (days: number, hour = 9) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 11) + `${String(hour).padStart(2, '0')}:00:00Z`

const ACME = 'a0000000-0000-4000-8000-000000000001'
const NORTHWIND = 'a0000000-0000-4000-8000-000000000002'
const CONTOSO = 'a0000000-0000-4000-8000-000000000003'
const FABRIKAM = 'a0000000-0000-4000-8000-000000000004'

const installers: (InstallerSelf & { hasLogin: boolean })[] = [
  { id: ACME, slug: 'acme', displayName: 'Acme Installations', status: 'approved', baseCity: 'Dallas', baseState: 'TX', baseZip: '75201',
    serviceRadiusMi: 45, materials: ['hdpe', 'phenolic', 'stainless'], mountings: ['overhead_braced', 'floor_mounted', 'ceiling_hung'],
    about: 'Labor-only Division 10 crew installing toilet partitions and accessories in offices, schools and retail across DFW.',
    photoUrl: null, maxOpenJobs: 6, awayFrom: null, awayTo: null, hasLogin: true },
  { id: NORTHWIND, slug: 'northwind', displayName: 'Northwind Washroom', status: 'approved', baseCity: 'Fort Worth', baseState: 'TX', baseZip: '76102',
    serviceRadiusMi: 40, materials: ['hdpe', 'phenolic', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'],
    about: null, photoUrl: null, maxOpenJobs: 4, awayFrom: null, awayTo: null, hasLogin: true },
  { id: CONTOSO, slug: 'contoso', displayName: 'Contoso Specialty', status: 'approved', baseCity: 'Arlington', baseState: 'TX', baseZip: '76010',
    serviceRadiusMi: 35, materials: ['powder_coated', 'laminate'], mountings: ['overhead_braced', 'floor_mounted'],
    about: null, photoUrl: null, maxOpenJobs: 5, awayFrom: null, awayTo: null, hasLogin: false },
  { id: FABRIKAM, slug: 'fabrikam', displayName: 'Fabrikam Interiors', status: 'vetting', baseCity: 'Denton', baseState: 'TX', baseZip: '76201',
    serviceRadiusMi: 30, materials: ['hdpe'], mountings: ['overhead_braced'], about: null, photoUrl: null, maxOpenJobs: 3,
    awayFrom: null, awayTo: null, hasLogin: false },
]

const baseJob = (o: Partial<Job> & Pick<Job, 'id' | 'ref' | 'city' | 'zip' | 'scope'>): Job => ({
  quoteRequestRef: null, areaSlug: 'dallas', drawingsPath: 'sample/shop-drawings.pdf', delivery: { from: addDays(today, 18), to: addDays(today, 22) },
  status: 'quoting', chosenInstallerId: null, preferredInstallerId: null, partitionsPaidAt: null, poAcceptedAt: null, releasedAt: null,
  installDate: null, neededBy: null, rush: false, requiresBackgroundCheck: false, searchRound: 1, priceDueAt: at(2, 15),
  windowClosedAt: null, needsAttention: false, attentionReason: null, isTest: false, createdAt: at(0, 13), ...o,
})

const jobs: Job[] = [
  baseJob({ id: 'j1048', ref: 'NP-DFW-1048', quoteRequestRef: 'Q-20417', city: 'Plano', zip: '75074', requiresBackgroundCheck: true,
    scope: { material: 'hdpe', mounting: 'overhead_braced', stalls: 6, ada: true, urinal_screens: 2, remove_stalls: 6, building: 'School (elementary)',
      layout: 'Between walls', color: 'Sage', notes: 'Old stalls to be removed and hauled away. Ground floor, loading dock at the back.' } }),
  baseJob({ id: 'j1044', ref: 'NP-DFW-1044', city: 'Irving', zip: '75038', createdAt: at(-2, 14), priceDueAt: at(0, 14),
    scope: { material: 'phenolic', mounting: 'floor_mounted', stalls: 4, ada: true, building: 'Office', notes: 'Fourth floor, freight elevator.' } }),
  baseJob({ id: 'j1041', ref: 'NP-DFW-1041', city: 'Dallas', zip: '75204', status: 'installer_chosen', chosenInstallerId: ACME, createdAt: at(-6, 14),
    windowClosedAt: at(-4, 14), scope: { material: 'hdpe', mounting: 'overhead_braced', stalls: 3, building: 'Restaurant' } }),
  baseJob({ id: 'j1036', ref: 'NP-DFW-1036', city: 'Richardson', zip: '75080', status: 'released', chosenInstallerId: ACME, partitionsPaidAt: at(-1),
    releasedAt: at(-1), createdAt: at(-12, 14), windowClosedAt: at(-10, 14), delivery: { from: addDays(today, 7), to: addDays(today, 7) },
    scope: { material: 'stainless', mounting: 'floor_mounted', stalls: 2, building: 'Gym' } }),
  baseJob({ id: 'j1052', ref: 'NP-DFW-1052', city: 'Granbury', zip: '76048', searchRound: 2, needsAttention: true, createdAt: at(-3, 14),
    attentionReason: 'No prices after the wider search: offer partitions only or the customer\'s own installer', windowClosedAt: at(0, 8),
    scope: { material: 'laminate', mounting: 'overhead_braced', stalls: 5, building: 'Church' } }),
]

const inv = (jobId: string, installerId: string, o: Partial<Invite> = {}): Invite => {
  const j = jobs.find((x) => x.id === jobId)!
  return { jobId, installerId, round: 1, invitedBy: 'auto', sentAt: j.createdAt, dueAt: j.priceDueAt, respondedAt: null, declined: false,
    declinedReason: null, priceCents: null, estimateCents: null, earliestInstallDate: null, assumptions: null, notes: null, late: false,
    priceFlag: null, ...o }
}
const invites: Invite[] = [
  inv('j1048', ACME, { estimateCents: 214000 }), inv('j1048', NORTHWIND, { estimateCents: 198000 }),
  inv('j1044', ACME, { estimateCents: 132000, priceCents: 138000, respondedAt: at(-1, 16), earliestInstallDate: addDays(today, 21) }),
  inv('j1044', NORTHWIND, { estimateCents: 126000 }),
  inv('j1041', ACME, { estimateCents: 92000, priceCents: 92000, respondedAt: at(-5, 15) }),
  inv('j1041', NORTHWIND, { estimateCents: 88000, priceCents: 104000, respondedAt: at(-5, 18), priceFlag: 'above_rates' }),
  inv('j1036', ACME, { estimateCents: 76000, priceCents: 76000, respondedAt: at(-11, 11) }),
  inv('j1052', CONTOSO, { declined: true, declinedReason: 'Too far for a 5-stall job', respondedAt: at(-2, 10) }),
  inv('j1052', NORTHWIND, { round: 2, invitedBy: 'widened', declined: true, declinedReason: 'Fully booked that week', respondedAt: at(-1, 9) }),
]

let msgSeq = 0
const msg = (jobId: string, installerId: string, sender: Message['sender'], body: string, createdAt: string): Message =>
  ({ id: `m${++msgSeq}`, jobId, installerId, sender, body, redacted: false, createdAt })
const messages: Message[] = [
  msg('j1048', ACME, 'next_partitions', 'New job in Plano. Shop drawings attached. The customer would like installation the week after delivery.', at(0, 13)),
  msg('j1044', ACME, 'next_partitions', 'Thanks, your price is with the customer. They expect to decide this week.', at(-1, 17)),
  msg('j1041', ACME, 'next_partitions', 'Good news: the customer chose you. Their details unlock as soon as they pay for the partitions order.', at(-3, 10)),
  msg('j1036', ACME, 'next_partitions', 'Partitions order paid; the job is yours. Please set your install date.', at(-1, 10)),
]

const contacts: Record<string, Contact> = {
  j1048: { customerName: 'Pat Lee', company: 'Plano ISD, Facilities', email: 'pat.lee@example.org', phone: '(214) 555-0100',
    siteAddress: '1200 Example Pkwy, Plano, TX 75074', siteContact: 'Front office, 7:30 AM–3:30 PM' },
  j1044: { customerName: 'Sam Ortiz', company: 'Example Holdings', email: 'sam@example.com', phone: null, siteAddress: null, siteContact: null },
  j1041: { customerName: 'Chris Wu', company: 'Example Grill', email: 'chris@example.com', phone: '(214) 555-0130', siteAddress: '45 Example St, Dallas, TX 75204', siteContact: null },
  j1036: { customerName: 'Jamie Park', company: 'Example Fitness', email: 'jamie@example.com', phone: '(972) 555-0177',
    siteAddress: '800 Example Rd, Richardson, TX 75080', siteContact: 'Manager on duty, from 6 AM' },
  j1052: { customerName: 'Robin Hale', company: 'Example Community Church', email: 'robin@example.org', phone: '(817) 555-0119', siteAddress: null, siteContact: null },
}

const events: (JobEvent & { jobId: string })[] = []
const rates: Record<string, RateRow[]> = {
  [ACME]: [
    { material: 'hdpe', mounting: 'overhead_braced', perStallLowCents: 24000, perStallHighCents: 30000, minimumCents: 60000, extras: { ada_stall_cents: 7500, demo_per_stall_cents: 4000, urinal_screen_cents: 4500 } },
    { material: 'phenolic', mounting: 'overhead_braced', perStallLowCents: 26000, perStallHighCents: 32000, minimumCents: 60000, extras: { ada_stall_cents: 7500, demo_per_stall_cents: 4000 } },
    { material: 'stainless', mounting: 'floor_mounted', perStallLowCents: 30000, perStallHighCents: 38000, minimumCents: 60000, extras: { ada_stall_cents: 7500 } },
  ],
}
const checks: CheckRow[] = [
  { checkType: 'insurance', status: 'passed', verifiedAt: '2026-10-12', expiresAt: addDays(today, 24), publicLabel: 'Insurance on file ($1M general liability)' },
  { checkType: 'city_registration', status: 'passed', verifiedAt: '2026-10-12', expiresAt: null, publicLabel: 'City of Dallas contractor registration' },
  { checkType: 'references', status: 'passed', verifiedAt: '2026-10-13', expiresAt: null, publicLabel: '2 references contacted' },
  { checkType: 'listing_agreement', status: 'passed', verifiedAt: '2026-10-14', expiresAt: null, publicLabel: 'Signed listing agreement' },
]
const uploads: DocumentUpload[] = [
  { id: 'u1', installerId: NORTHWIND, checkType: 'insurance', path: 'sample/northwind-coi-2027.pdf', uploadedAt: at(-1, 15), reviewedAt: null, reviewNote: null },
]

// The sample switches between the installer (Acme) and the coordinator with ?as=coordinator.
const viewAs = () => (typeof location !== 'undefined' && new URLSearchParams(location.search).get('as') === 'coordinator' ? 'coordinator' : 'installer')
const job = (id: string) => jobs.find((j) => j.id === id)!
const hide = (b: string) => b.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[hidden until the job is released]')
  .replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[hidden until the job is released]')
const release = (j: Job) => {
  const paid = j.partitionsPaidAt || j.poAcceptedAt
  if (j.chosenInstallerId && paid && !j.releasedAt) { j.releasedAt = new Date().toISOString(); j.status = 'released' }
  if (!(j.chosenInstallerId && paid)) j.releasedAt = null
}
const pause = () => new Promise((r) => setTimeout(r, 120))

export const samplePortal: PortalRepo = {
  sample: true,
  async me(): Promise<Me> {
    return viewAs() === 'coordinator' ? { kind: 'coordinator' } : { kind: 'installer', installer: installers[0] }
  },
  async signOut() {},
  async fileUrl() { return 'data:text/plain,Sample%20file%20(the%20real%20portal%20opens%20the%20uploaded%20document)' },

  async myJobs(installerId) {
    return invites.filter((i) => i.installerId === installerId).map((invite) => ({ job: { ...job(invite.jobId) }, invite: { ...invite } }))
  },
  async messages(jobId, installerId) {
    return messages.filter((m) => m.jobId === jobId && (!installerId || m.installerId === installerId)).map((m) => ({ ...m }))
  },
  async contact(jobId) {
    const j = job(jobId)
    return viewAs() === 'coordinator' || (j.releasedAt && j.chosenInstallerId === ACME) ? { ...contacts[jobId] } : null
  },
  async events(jobId) { return events.filter((e) => e.jobId === jobId) },
  async answerInvite(jobId, installerId, a) {
    await pause()
    const i = invites.find((x) => x.jobId === jobId && x.installerId === installerId)!
    if (job(jobId).chosenInstallerId) throw new Error('The customer has already chosen an installer for this job')
    Object.assign(i, { priceCents: a.priceCents, earliestInstallDate: a.earliestInstallDate, assumptions: a.assumptions, notes: a.notes })
    i.respondedAt ??= new Date().toISOString()
    i.priceFlag = i.estimateCents && a.priceCents > i.estimateCents * 1.15 ? 'above_rates' : null
  },
  async declineInvite(jobId, installerId, reason) {
    await pause()
    Object.assign(invites.find((x) => x.jobId === jobId && x.installerId === installerId)!, { declined: true, declinedReason: reason || null, respondedAt: new Date().toISOString() })
  },
  async sendMessage(jobId, installerId, sender, body) {
    await pause()
    const j = job(jobId)
    const released = j.releasedAt && j.chosenInstallerId === installerId
    const b = released ? body : hide(body)
    messages.push({ ...msg(jobId, installerId, sender, b, new Date().toISOString()), redacted: b !== body })
  },
  async schedule(jobId, installDate) {
    await pause()
    Object.assign(job(jobId), { installDate, status: 'scheduled' })
    events.push({ id: `e${events.length}`, jobId, status: 'scheduled', note: `Install date ${installDate}`, photoPaths: [], createdAt: new Date().toISOString() })
  },
  async markInstalled(jobId, note, photos) {
    await pause()
    job(jobId).status = 'installed'
    events.push({ id: `e${events.length}`, jobId, status: 'installed', note, photoPaths: photos.map((f) => f.name), createdAt: new Date().toISOString() })
  },
  async saveProfile(installerId, patch) { await pause(); Object.assign(installers.find((i) => i.id === installerId)!, patch) },
  async uploadProfilePhoto(_id, file) { await pause(); return URL.createObjectURL(file) },
  async rateCards(installerId) { return (rates[installerId] ?? []).map((r) => ({ ...r, extras: { ...r.extras } })) },
  async saveRates(installerId, rows) { await pause(); rates[installerId] = rows },
  async checks() { return checks },
  async uploads(installerId) { return uploads.filter((u) => (installerId ? u.installerId === installerId : !u.reviewedAt)) },
  async uploadDocument(installerId, checkType, file) {
    await pause()
    uploads.unshift({ id: `u${uploads.length + 1}`, installerId, checkType, path: file.name, uploadedAt: new Date().toISOString(), reviewedAt: null, reviewNote: null })
  },
  async performance() { return { medianReplyHours: 3.5, rating: 4.9, reviewCount: 11, installs: 14 } },

  async allJobs() {
    return jobs.map((j) => ({ job: { ...j }, invites: invites.filter((i) => i.jobId === j.id).map((i) => ({ ...i })) }))
  },
  async installers(): Promise<InstallerSummary[]> {
    return installers.map((i) => ({ id: i.id, displayName: i.displayName, status: i.status, baseCity: i.baseCity, hasLogin: i.hasLogin }))
  },
  async createJob(n) {
    await pause()
    const id = `j${2000 + jobs.length}`
    jobs.unshift(baseJob({ id, ref: `NP-DFW-${2000 + jobs.length}`, quoteRequestRef: n.quoteRequestRef, areaSlug: n.areaSlug, city: n.city,
      zip: n.zip, scope: n.scope, delivery: n.delivery, neededBy: n.neededBy, preferredInstallerId: n.preferredInstallerId, rush: n.rush,
      requiresBackgroundCheck: n.requiresBackgroundCheck, status: 'new', searchRound: 0, priceDueAt: null, createdAt: new Date().toISOString() }))
    contacts[id] = n.contact
    return id
  },
  async uploadDrawings(jobId, file) { await pause(); job(jobId).drawingsPath = file.name },
  async routeJob(jobId) {
    await pause()
    const j = job(jobId)
    const due = at(2, 15)
    const picks = installers.filter((i) => i.status === 'approved' && i.materials.includes(j.scope.material) && i.mountings.includes(j.scope.mounting))
      .filter((i) => !j.preferredInstallerId || i.id === j.preferredInstallerId).slice(0, 3)
    for (const i of picks) invites.push(inv(jobId, i.id, { sentAt: new Date().toISOString(), dueAt: due, invitedBy: j.preferredInstallerId ? 'preferred' : 'auto' }))
    Object.assign(j, { status: 'quoting', searchRound: 1, priceDueAt: due, needsAttention: picks.length === 0,
      attentionReason: picks.length ? null : 'No installer covers this job' })
    return picks.length
  },
  async inviteInstaller(jobId, installerId) {
    await pause()
    if (installers.find((i) => i.id === installerId)?.status !== 'approved') throw new Error('installer is not approved or their insurance or registration has expired')
    invites.push(inv(jobId, installerId, { sentAt: new Date().toISOString(), dueAt: at(1, 15), invitedBy: 'manual' }))
    Object.assign(job(jobId), { status: 'quoting', windowClosedAt: null })
  },
  async updateJob(jobId, patch) { await pause(); const j = job(jobId); Object.assign(j, patch); release(j) },
  async reviewUpload(id, r) {
    await pause()
    const u = uploads.find((x) => x.id === id)!
    Object.assign(u, { reviewedAt: new Date().toISOString(), reviewNote: r.note })
    const c = checks.find((x) => x.checkType === u.checkType)
    if (r.accepted && c && u.installerId === ACME) Object.assign(c, { status: 'passed', verifiedAt: today, expiresAt: r.expiresAt })
  },
  async inviteLogin(installerId) { await pause(); installers.find((i) => i.id === installerId)!.hasLogin = true },
  async quote(jobId) { return jobs.find((j) => j.id === jobId)?.isTest ? null : { ...quoteFor(jobId) } },
  async saveQuote(jobId, p) { await pause(); Object.assign(quoteFor(jobId), p) },
  async clearPriceFlag(jobId, installerId) { await pause(); invites.find((i) => i.jobId === jobId && i.installerId === installerId)!.priceFlag = null },

  async applicants() {
    return installers.map((i): Applicant => ({ ...i, ...vet(i.id).extra, areas: vet(i.id).areas }))
  },
  async applicantDetail(id) {
    const v = vet(id)
    const t = invites.filter((i) => i.installerId === id && job(i.jobId).isTest).at(-1)
    return { checks: v.checks.map((c) => ({ ...c })), references: v.refs.map((r) => ({ ...r })), uploads: uploads.filter((u) => u.installerId === id),
      rates: rates[id] ?? [], testJob: t ? { job: { ...job(t.jobId) }, invite: { ...t } } : null }
  },
  async saveCheck(id, type, p) {
    await pause()
    const v = vet(id), c = v.checks.find((x) => x.checkType === type)
    if (c) Object.assign(c, p)
    else v.checks.push({ checkType: type, status: 'pending', verifiedAt: null, expiresAt: null, publicLabel: null, internalNote: null, documentPath: null, ...p })
  },
  async saveReference(id, p) { await pause(); Object.assign(Object.values(vetting).flatMap((v) => v.refs).find((r) => r.id === id)!, p) },
  async sendTestJob(id) {
    await pause()
    const i = installers.find((x) => x.id === id)!
    const jid = `t${jobs.length}`
    jobs.push(baseJob({ id: jid, ref: `TEST-${jobs.length}`, city: i.baseCity, zip: i.baseZip, status: 'routed', isTest: true, drawingsPath: null,
      scope: { material: i.materials[0] ?? 'hdpe', mounting: i.mountings[0] ?? 'overhead_braced', stalls: 4, ada: true, building: 'Office',
        notes: 'Test job request from Next Partitions: price it as you would a real job. We time your reply and your firm price.' } }))
    invites.push(inv(jid, id, { sentAt: new Date().toISOString(), dueAt: at(2, 15), invitedBy: 'manual' }))
    return jid
  },
  async setStatus(id, status) { await pause(); installers.find((i) => i.id === id)!.status = status },
  async approve(id, o) {
    await pause()
    const v = vet(id)
    const passed = (t: CheckType) => v.checks.some((c) => c.checkType === t && c.status === 'passed')
    const missing = [['insurance', passed('insurance')], ['registration', passed('business_registration') || passed('city_registration')],
      ['references', passed('references')], ['response test', passed('response_test')], ['listing agreement', passed('listing_agreement')]]
      .filter(([, ok]) => !ok).map(([n]) => n)
    if (missing.length) throw new Error(`Before approving, these checks must pass: ${missing.join(', ')}`)
    v.areas = o.areas; v.extra.trackedPhone = o.trackedPhone; v.extra.approvedAt = new Date().toISOString()
    installers.find((i) => i.id === id)!.status = 'approved'
  },
  async vettingNotice(id, kind, note) {
    await pause()
    vet(id).extra.decisionNote = note
    if (kind === 'rejected') installers.find((i) => i.id === id)!.status = 'delisted'
  },
  async areas(): Promise<AreaCoverage[]> {
    const approved = installers.filter((i) => i.status === 'approved')
    return AREAS.map((a) => ({ ...a, approved: approved.filter((i) => vet(i.id).areas.includes(a.slug)).length,
      withJob: approved.filter((i) => vet(i.id).areas.includes(a.slug) && vet(i.id).checks.some((c) => c.checkType === 'completed_job' && c.status === 'passed')).length }))
  },
  async publishArea(slug, published) { await pause(); AREAS.find((a) => a.slug === slug)!.published = published },
}

// ---------- sample vetting data (the applicants from prototypes/installer-vetting.html) ----------
const AREAS = [{ slug: 'dallas', name: 'Dallas–Fort Worth', published: false }, { slug: 'houston', name: 'Houston', published: false }]
type Extra = Omit<Applicant, keyof InstallerSelf | 'hasLogin' | 'areas'>
const blank: Extra = { legalName: '', contactName: null, contactEmail: null, contactPhone: null, yearsInBusiness: null, crewSize: null, extras: [],
  brands: null, registrationNumber: null, agreementName: null, agreementAcceptedAt: null, appliedAt: null, approvedAt: null, decisionNote: null, trackedPhone: null }
const chk = (checkType: CheckType, status: CheckDetail['status'], o: Partial<CheckDetail> = {}): CheckDetail =>
  ({ checkType, status, verifiedAt: status === 'passed' ? addDays(today, -5) : null, expiresAt: null, publicLabel: null, internalNote: null, documentPath: null, ...o })
let refSeq = 0
const ref = (name: string, company: string, o: Partial<Reference> = {}): Reference =>
  ({ id: `r${++refSeq}`, name, company, phone: '(214) 555-01' + String(10 + refSeq), email: null, jobNote: null, calledAt: null, outcome: null, note: null, ...o })
const allPassed = (city: string) => [chk('insurance', 'passed', { expiresAt: addDays(today, 24), publicLabel: 'Insurance on file ($1M general liability)', documentPath: 'sample/coi.pdf' }),
  chk('city_registration', 'passed', { publicLabel: `City of ${city} contractor registration` }), chk('references', 'passed', { publicLabel: '2 references contacted' }),
  chk('response_test', 'passed'), chk('listing_agreement', 'passed', { publicLabel: 'Signed listing agreement' }),
  chk('completed_job', 'passed', { publicLabel: 'Completed a job for a Next Partitions customer' })]

const LONESTAR = 'b0000000-0000-4000-8000-000000000001', TARRANT = 'b0000000-0000-4000-8000-000000000002'
const METROPLEX = 'b0000000-0000-4000-8000-000000000003', QUICKFIX = 'b0000000-0000-4000-8000-000000000004'
const applicant = (id: string, slug: string, displayName: string, status: InstallerSelf['status'], baseCity: string, baseZip: string, radius: number,
  materials: InstallerSelf['materials'], mountings: InstallerSelf['mountings']) =>
  installers.push({ id, slug, displayName, status, baseCity, baseState: 'TX', baseZip, serviceRadiusMi: radius, materials, mountings, about: null,
    photoUrl: null, maxOpenJobs: 5, awayFrom: null, awayTo: null, hasLogin: status !== 'applied' && status !== 'delisted' })
applicant(LONESTAR, 'lone-star-restroom-installs', 'Lone Star Restroom Installs', 'applied', 'Garland', '75040', 45, ['hdpe', 'powder_coated', 'phenolic'], ['overhead_braced', 'floor_mounted'])
applicant(TARRANT, 'tarrant-partition-co', 'Tarrant Partition Co.', 'vetting', 'Fort Worth', '76102', 60, ['hdpe', 'phenolic', 'stainless', 'laminate'], ['overhead_braced', 'floor_mounted', 'ceiling_hung', 'floor_to_ceiling'])
applicant(METROPLEX, 'metroplex-division-10', 'Metroplex Division 10', 'vetting', 'Irving', '75038', 50, ['hdpe', 'powder_coated', 'laminate'], ['overhead_braced', 'floor_mounted', 'ceiling_hung'])
applicant(QUICKFIX, 'quickfix-handyman', 'QuickFix Handyman', 'delisted', 'Mesquite', '75149', 30, ['powder_coated'], ['overhead_braced'])

const vetting: Record<string, { extra: Extra; areas: string[]; checks: CheckDetail[]; refs: Reference[] }> = {
  [ACME]: { extra: { ...blank, legalName: 'Acme Installations LLC', contactName: 'Jordan Whitfield', contactEmail: 'jordan@example.com', contactPhone: '(214) 555-0142',
    yearsInBusiness: 15, crewSize: '3-5', approvedAt: at(-8), trackedPhone: '(214) 555-0142', appliedAt: at(-20) }, areas: ['dallas'], checks: allPassed('Dallas'), refs: [] },
  [NORTHWIND]: { extra: { ...blank, legalName: 'Northwind Washroom Inc', contactName: 'Sam Reyes', contactEmail: 'sam@example.com', approvedAt: at(-6), appliedAt: at(-18) },
    areas: ['dallas'], checks: allPassed('Fort Worth').filter((c) => c.checkType !== 'completed_job'), refs: [] },
  [LONESTAR]: { extra: { ...blank, legalName: 'Lone Star Restroom Installs', contactName: 'Rosa Delgado', contactEmail: 'rosa@example.com', contactPhone: '(972) 555-0131',
    yearsInBusiness: 9, crewSize: '3-5', extras: ['remove_old', 'ada', 'urinal_screens'], brands: 'Scranton Products, Bobrick', registrationNumber: 'Garland GC-2026-0412',
    agreementName: 'Rosa Delgado', agreementAcceptedAt: at(-6), appliedAt: at(-6) }, areas: [],
    checks: [chk('insurance', 'pending', { documentPath: 'sample/coi-lonestar.pdf' }), chk('business_registration', 'pending', { internalNote: 'Registration number: Garland GC-2026-0412' }),
      chk('references', 'pending'), chk('response_test', 'pending'), chk('listing_agreement', 'pending', { internalNote: 'Agreed to sign if approved: Rosa Delgado' })],
    refs: [ref('Mike Tran', 'Garland ISD', { jobNote: '12 HDPE stalls, 2025' }), ref('Kelly Hart', 'Hart Builders')] },
  [TARRANT]: { extra: { ...blank, legalName: 'Tarrant Partition Co. LLC', contactName: 'Ben Okafor', contactEmail: 'ben@example.com', contactPhone: '(817) 555-0164',
    yearsInBusiness: 14, crewSize: '6-10', extras: ['remove_old', 'ada', 'urinal_screens'], brands: 'Bobrick, ASI, Bradley', registrationNumber: 'Fort Worth FW-88213',
    agreementName: 'Ben Okafor', agreementAcceptedAt: at(-12), appliedAt: at(-12) }, areas: [],
    checks: [chk('insurance', 'passed', { expiresAt: '2027-01-15', documentPath: 'sample/coi-tarrant.pdf' }), chk('city_registration', 'passed', { internalNote: 'Checked on the City of Fort Worth lookup' }),
      chk('references', 'passed'), chk('response_test', 'pending'), chk('listing_agreement', 'pending')],
    refs: [ref('Ana Silva', 'Keller ISD', { calledAt: at(-10), outcome: 'good', note: 'On time, clean job, would hire again' }),
      ref('Tom Rhee', 'Rhee Construction', { calledAt: at(-10), outcome: 'good', note: 'Once late by a day, told us ahead' })] },
  [METROPLEX]: { extra: { ...blank, legalName: 'Metroplex Division 10 LLC', contactName: 'Lee Nguyen', contactEmail: 'lee@example.com', contactPhone: '(972) 555-0187',
    yearsInBusiness: 7, crewSize: '3-5', extras: ['remove_old', 'ada'], brands: 'Scranton Products, Metpar', registrationNumber: 'Dallas CR-2025-77120',
    agreementName: 'Lee Nguyen', agreementAcceptedAt: at(-19), appliedAt: at(-19) }, areas: [],
    checks: allPassed('Dallas').filter((c) => c.checkType !== 'completed_job'),
    refs: [ref('Chris Bell', 'Irving Medical Plaza', { calledAt: at(-17), outcome: 'good', note: 'Quick, tidy, fair price' }),
      ref('Dee Moss', 'Moss & Co. GC', { calledAt: at(-17), outcome: 'good', note: 'Reliable on a 20-stall school job' })] },
  [QUICKFIX]: { extra: { ...blank, legalName: 'QuickFix Handyman', contactName: 'Dan Ward', contactEmail: 'dan@example.com', yearsInBusiness: 2, crewSize: '1-2',
    appliedAt: at(-21), decisionNote: 'No general liability insurance' }, areas: [], checks: [chk('insurance', 'failed')], refs: [] },
}
const vet = (id: string) => (vetting[id] ??= { extra: { ...blank }, areas: [], checks: [], refs: [] })

// Tarrant's test request, sent and still waiting.
jobs.push(baseJob({ id: 'tTarrant', ref: 'TEST-1', city: 'Fort Worth', zip: '76102', status: 'routed', isTest: true, drawingsPath: null, createdAt: at(-1, 14),
  scope: { material: 'hdpe', mounting: 'overhead_braced', stalls: 4, ada: true, building: 'Office', notes: 'Test job request from Next Partitions.' } }))
invites.push(inv('tTarrant', TARRANT, { invitedBy: 'manual', sentAt: at(-1, 14), dueAt: at(1, 14) }))

const quotes: Record<string, QuoteAdmin> = {}
const quoteFor = (jobId: string) => (quotes[jobId] ??= { token: `sample-${jobId}`, quoteRef: null, partitionsCents: null, freightCents: null, taxNote: null,
  validUntil: null, drawingsApprovedAt: null, changeRequest: null, customerChoice: null, paymentMethod: null, poNumber: null })
Object.assign(quoteFor('j1044'), { quoteRef: 'Q-26-1044', partitionsCents: 412000, freightCents: 32000, validUntil: addDays(today, 25) })
