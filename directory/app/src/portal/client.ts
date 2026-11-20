import type { PortalRepo } from './repo'
import { samplePortal } from './repo.sample'
import { supabasePortal } from './repo.supabase'

// Browser only (the portal routes don't render on the server). Uses Supabase when the publishable
// key is configured, otherwise the in-memory sample.
let repo: (PortalRepo & { db?: ReturnType<typeof supabasePortal>['db'] }) | null = null

export function portal() {
  if (!repo) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    repo = url && key ? supabasePortal(url, key) : samplePortal
  }
  return repo
}

// Magic-link sign-in. Only existing logins can sign in (shouldCreateUser: false): installers get theirs
// from the coordinator, so nobody can create an account from the login page.
export async function sendSignInLink(email: string): Promise<void> {
  const db = portal().db
  if (!db) return
  const { error } = await db.auth.signInWithOtp({
    email, options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/portal/` },
  })
  if (error) throw error
}

export function onSignIn(cb: () => void): () => void {
  const db = portal().db
  if (!db) return () => {}
  const { data } = db.auth.onAuthStateChange((event) => { if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') cb() })
  return () => data.subscription.unsubscribe()
}
