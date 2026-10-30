import type {
  Applicant, ApplicantDetail, AreaCoverage, Bucket, CheckPatch, CheckRow, CheckType, Contact, DocumentUpload, Invite,
  InstallerStatus, InstallerSummary, Job, JobEvent, JobPatch, Me, Message, NewJob, Performance, PriceAnswer, ProfilePatch,
  QuoteAdmin, QuotePatch, RateRow, Reference,
} from './types'

// Portal data access, run as the logged-in user. Two implementations: Supabase (live, where row-level
// security enforces every rule) and an in-memory sample for development and the preview.
export interface PortalRepo {
  sample: boolean
  me(): Promise<Me>
  signOut(): Promise<void>
  fileUrl(bucket: Bucket, path: string): Promise<string>

  // Installer
  myJobs(installerId: string): Promise<{ job: Job; invite: Invite }[]>
  messages(jobId: string, installerId?: string): Promise<Message[]> // installerId omitted: every thread (coordinator)
  contact(jobId: string): Promise<Contact | null> // null until the job is released to this installer
  events(jobId: string): Promise<JobEvent[]>
  answerInvite(jobId: string, installerId: string, a: PriceAnswer): Promise<void>
  declineInvite(jobId: string, installerId: string, reason: string): Promise<void>
  sendMessage(jobId: string, installerId: string, sender: Message['sender'], body: string): Promise<void>
  schedule(jobId: string, installDate: string): Promise<void>
  markInstalled(jobId: string, note: string | null, photos: File[]): Promise<void>
  saveProfile(installerId: string, patch: ProfilePatch): Promise<void>
  uploadProfilePhoto(installerId: string, file: File): Promise<string> // public URL
  rateCards(installerId: string): Promise<RateRow[]>
  saveRates(installerId: string, rows: RateRow[]): Promise<void>
  checks(installerId: string): Promise<CheckRow[]>
  uploads(installerId?: string): Promise<DocumentUpload[]> // installerId omitted: everything waiting for review
  uploadDocument(installerId: string, checkType: CheckType, file: File): Promise<void>
  performance(slug: string): Promise<Performance | null>

  // Coordinator
  allJobs(): Promise<{ job: Job; invites: Invite[] }[]>
  installers(): Promise<InstallerSummary[]>
  createJob(j: NewJob, drawings: File | null): Promise<string>
  uploadDrawings(jobId: string, file: File): Promise<void>
  routeJob(jobId: string): Promise<number>
  inviteInstaller(jobId: string, installerId: string): Promise<void>
  updateJob(jobId: string, patch: JobPatch): Promise<void>
  // Accepting marks the matching check passed (verified today, new expiry); either way the upload is marked reviewed.
  reviewUpload(id: string, r: { accepted: boolean; expiresAt: string | null; note: string | null }): Promise<void>
  inviteLogin(installerId: string, email: string): Promise<void>
  quote(jobId: string): Promise<QuoteAdmin | null>
  saveQuote(jobId: string, patch: QuotePatch): Promise<void>
  clearPriceFlag(jobId: string, installerId: string): Promise<void> // price checked: the customer may see it

  // Vetting
  applicants(): Promise<Applicant[]>
  applicantDetail(installerId: string): Promise<ApplicantDetail>
  saveCheck(installerId: string, checkType: CheckType, patch: CheckPatch): Promise<void>
  saveReference(id: string, patch: Partial<Pick<Reference, 'calledAt' | 'outcome' | 'note'>>): Promise<void>
  sendTestJob(installerId: string): Promise<string>
  setStatus(installerId: string, status: InstallerStatus): Promise<void>
  // Approval: service areas and tracked phone first, then the status (the database refuses it unless the
  // five checks pass), then the approval email.
  approve(installerId: string, o: { areas: string[]; trackedPhone: string | null }): Promise<void>
  vettingNotice(installerId: string, kind: 'info_request' | 'rejected', note: string): Promise<void>
  areas(): Promise<AreaCoverage[]>
  publishArea(slug: string, published: boolean): Promise<void>
}
