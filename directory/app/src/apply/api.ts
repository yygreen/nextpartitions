import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { type ApplicationForm, type Files, storageName, toPayload } from './form'

// Sends an installer application. With Supabase keys it calls dir_submit_application as an anonymous
// visitor, then uploads the documents into the applicant's own folder (allowed for 2 hours after
// applying) and records them for the coordinator's review. Without keys it's a sample: nothing is sent.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const sample = !(url && key)

let db: SupabaseClient | null = null
const client = () => (db ??= createClient(url!, key!, { auth: { persistSession: false } }))

// The application is saved first. A document that fails afterwards doesn't undo it: the applicant is told
// to email that file instead of applying twice.
export async function submitApplication(form: ApplicationForm, files: Files): Promise<{ installerId: string; documentProblem?: string }> {
  if (sample) {
    await new Promise((r) => setTimeout(r, 400))
    return { installerId: 'sample' }
  }
  const { data: installerId, error } = await client().rpc('dir_submit_application', { p: toPayload(form) })
  if (error) throw error
  const docs: [File | null, 'insurance' | 'business_registration'][] = [[files.insurance, 'insurance'], [files.registration, 'business_registration']]
  for (const [file, check] of docs) {
    if (!file) continue
    const path = `${installerId}/${storageName(file)}`
    const up = await client().storage.from('dir-documents').upload(path, file, { contentType: file.type })
    const rec = up.error ? null : await client().rpc('dir_application_document', { p_installer: installerId, p_check: check, p_path: path })
    if (up.error || rec?.error) {
      const what = check === 'insurance' ? 'insurance certificate' : 'registration document'
      return { installerId, documentProblem: `Your ${what} didn't upload. Email it to sales@nextpartitions.com with your business name.` }
    }
  }
  return { installerId: installerId as string }
}
