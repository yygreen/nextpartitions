// Shapes of the portal's data (dir_ tables in supabase/migrations), as the logged-in installer or
// the job coordinator can read them. Row-level security decides who sees what; nothing here does.
import type { Material, Mounting } from '../directory/types'

export type JobStatus =
  | 'new' | 'routed' | 'quoting' | 'presented' | 'installer_chosen'
  | 'released' | 'scheduled' | 'installed' | 'signed_off' | 'cancelled'

export type CheckType =
  | 'insurance' | 'business_registration' | 'city_registration' | 'references'
  | 'listing_agreement' | 'completed_job' | 'response_test' | 'background_check' | 'state_license'

export const CHECK_LABEL: Record<CheckType, string> = {
  insurance: 'Insurance certificate',
  business_registration: 'Business registration',
  city_registration: 'City contractor registration',
  references: 'References',
  listing_agreement: 'Signed listing agreement',
  completed_job: 'Completed job',
  response_test: 'Response test',
  background_check: 'Crew background check',
  state_license: 'State license',
}

// What the installer prices from: scope, no customer details.
export interface Scope {
  material: Material
  mounting: Mounting
  stalls: number
  ada?: boolean
  urinal_screens?: number
  remove_stalls?: number
  building?: string
  layout?: string
  color?: string
  notes?: string
}

export interface Job {
  id: string
  ref: string
  quoteRequestRef: string | null
  areaSlug: string
  city: string
  zip: string
  scope: Scope
  drawingsPath: string | null
  delivery: { from: string; to: string } | null // inclusive dates
  status: JobStatus
  chosenInstallerId: string | null
  preferredInstallerId: string | null
  partitionsPaidAt: string | null
  poAcceptedAt: string | null
  releasedAt: string | null
  installDate: string | null
  neededBy: string | null
  rush: boolean
  requiresBackgroundCheck: boolean
  searchRound: number
  priceDueAt: string | null
  windowClosedAt: string | null
  needsAttention: boolean
  attentionReason: string | null
  createdAt: string
}

export interface Invite {
  jobId: string
  installerId: string
  round: number
  invitedBy: 'auto' | 'preferred' | 'widened' | 'manual'
  sentAt: string
  dueAt: string | null
  respondedAt: string | null
  declined: boolean
  declinedReason: string | null
  priceCents: number | null
  estimateCents: number | null
  earliestInstallDate: string | null
  assumptions: string | null
  notes: string | null
  late: boolean
  priceFlag: 'above_rates' | 'above_area' | null
}

export interface Message {
  id: string
  jobId: string
  installerId: string
  sender: 'installer' | 'next_partitions'
  body: string
  redacted: boolean
  createdAt: string
}

// Only readable by the chosen installer once the job is released, and by the coordinator.
export interface Contact {
  customerName: string
  company: string | null
  email: string
  phone: string | null
  siteAddress: string | null
  siteContact: string | null
}

export interface JobEvent {
  id: string
  status: JobStatus
  note: string | null
  photoPaths: string[]
  createdAt: string
}

export interface InstallerSelf {
  id: string
  slug: string
  displayName: string
  status: 'applied' | 'vetting' | 'approved' | 'suspended' | 'delisted'
  baseCity: string
  baseState: string
  baseZip: string
  serviceRadiusMi: number
  materials: Material[]
  mountings: Mounting[]
  about: string | null
  photoUrl: string | null
  maxOpenJobs: number
  awayFrom: string | null
  awayTo: string | null
}

export type ProfilePatch = Partial<Pick<InstallerSelf,
  'displayName' | 'serviceRadiusMi' | 'materials' | 'mountings' | 'about' | 'photoUrl' | 'maxOpenJobs' | 'awayFrom' | 'awayTo'>>

export interface RateRow {
  material: Material
  mounting: Mounting
  perStallLowCents: number
  perStallHighCents: number
  minimumCents: number
  extras: Record<string, number> // ada_stall_cents, urinal_screen_cents, demo_per_stall_cents, free_miles, per_mile_cents
}

export interface CheckRow {
  checkType: CheckType
  status: 'pending' | 'passed' | 'failed' | 'expired'
  verifiedAt: string | null
  expiresAt: string | null
  publicLabel: string | null
}

export interface DocumentUpload {
  id: string
  installerId: string
  checkType: CheckType
  path: string
  uploadedAt: string
  reviewedAt: string | null
  reviewNote: string | null
}

export interface Performance {
  medianReplyHours: number | null
  rating: number | null
  reviewCount: number
  installs: number
}

export type Me =
  | { kind: 'installer'; installer: InstallerSelf }
  | { kind: 'coordinator' }
  | { kind: 'none'; email?: string } // logged out, or (with email) signed in but not linked to a listing or the coordinator role

export interface InstallerSummary {
  id: string
  displayName: string
  status: InstallerSelf['status']
  baseCity: string
  hasLogin: boolean
}

export interface PriceAnswer {
  priceCents: number
  earliestInstallDate: string | null
  assumptions: string | null
  notes: string | null
}

export interface NewJob {
  quoteRequestRef: string | null
  areaSlug: string
  city: string
  zip: string
  scope: Scope
  delivery: { from: string; to: string } | null
  neededBy: string | null
  preferredInstallerId: string | null
  rush: boolean
  requiresBackgroundCheck: boolean
  contact: Contact
}

// Fields the coordinator changes as the job moves on: presenting prices, the customer's choice,
// payment or PO (which releases the job), sign-off, cancelling, clearing a flag.
export type JobPatch = Partial<Pick<Job,
  'status' | 'chosenInstallerId' | 'partitionsPaidAt' | 'poAcceptedAt' | 'needsAttention' | 'attentionReason' | 'drawingsPath'>>

export type Bucket = 'dir-documents' | 'dir-drawings' | 'dir-job-photos' | 'dir-profile-photos'
