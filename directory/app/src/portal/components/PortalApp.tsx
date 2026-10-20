import { type ReactNode, useEffect, useState } from 'react'
import { onSignIn, portal, sendSignInLink } from '../client'
import { PORTAL_SAMPLE_NOTICE } from '../repo.sample'
import { inboxOrder } from '../stage'
import type { InstallerSelf, Me } from '../types'
import { CoordinatorView } from './Coordinator'
import { InstallerJobs, rowsFor } from './InstallerJobs'
import { AgreementTab, PerformanceTab, ProfileTab, RatesTab } from './InstallerTabs'
import { Button, Card, Field, INPUT, Notice, Tabs, WRAP, useAction, useLoad } from './ui'

// /portal/: who is signed in decides what they see. Installers get their jobs; the job coordinator
// (dir_admins) gets job coordination. Logged out, or not linked to either, gets the sign-in page.
export function PortalApp() {
  const [version, setVersion] = useState(0)
  useEffect(() => onSignIn(() => setVersion((v) => v + 1)), [])
  const { data: me, error } = useLoad(() => portal().me(), [version])

  if (error) return <Shell><main className={`${WRAP} py-10`}><Notice tone="error">{error}</Notice></main></Shell>
  if (!me) return <Shell><main className={`${WRAP} py-10`}><p>Loading…</p></main></Shell>
  if (me.kind === 'none') {
    return <Shell>{me.email ? <NotLinked email={me.email} onSignOut={async () => { await portal().signOut(); setVersion((v) => v + 1) }} /> : <SignIn />}</Shell>
  }
  return (
    <Shell me={me} onSignOut={async () => { await portal().signOut(); setVersion((v) => v + 1) }}>
      {me.kind === 'coordinator' ? <CoordinatorView /> : <InstallerPortal me={me.installer} reloadMe={() => setVersion((v) => v + 1)} />}
    </Shell>
  )
}

function Shell({ me, onSignOut, children }: { me?: Me; onSignOut?: () => void; children: ReactNode }) {
  const sample = portal().sample
  const who = me?.kind === 'installer' ? me.installer : null
  return (
    <div className="min-h-screen bg-background">
      {sample && (
        <div className="bg-surface-warm text-muted-foreground border-b border-border text-sm text-center px-4 py-2">
          {PORTAL_SAMPLE_NOTICE} View as <a className="underline" href="?">installer (Acme)</a> or <a className="underline" href="?as=coordinator">job coordinator</a>.
        </div>
      )}
      <header className="bg-primary text-primary-foreground">
        <div className={`${WRAP} flex flex-wrap justify-between items-center gap-3 py-4`}>
          <a href="/" className="leading-tight"><b className="block text-lg">Next Partitions</b>
            <small className="text-primary-foreground/70">{me?.kind === 'coordinator' ? 'Job coordination' : 'Installer portal'}</small></a>
          {me && me.kind !== 'none' && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-right leading-tight">
                <b className="block">{who ? who.displayName : 'Job coordinator'}</b>
                {who && <small className="text-primary-foreground/70">{who.status === 'approved' ? 'Listed' : 'Not listed yet'} · {who.baseCity}</small>}
              </span>
              {onSignOut && !sample && <button type="button" className="underline" onClick={onSignOut}>Sign out</button>}
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  )
}

type InstallerTab = 'jobs' | 'rates' | 'profile' | 'performance' | 'agreement'

function InstallerPortal({ me, reloadMe }: { me: InstallerSelf; reloadMe: () => void }) {
  const [tab, setTab] = useState<InstallerTab>('jobs')
  const jobs = useLoad(() => portal().myJobs(me.id), [me.id])
  const rows = jobs.data ? rowsFor(me, jobs.data) : []
  const todo = rows.filter((r) => inboxOrder(r.stage) <= 1).length

  return (
    <>
      <Tabs<InstallerTab> value={tab} onChange={setTab} tabs={[
        { id: 'jobs', label: 'Jobs', count: todo }, { id: 'rates', label: 'Your rates' }, { id: 'profile', label: 'Profile and documents' },
        { id: 'performance', label: 'Performance' }, { id: 'agreement', label: 'Listing agreement' },
      ]} />
      <main className={`${WRAP} py-6 grid gap-5`}>
        {me.status !== 'approved' && (
          <Notice>Your listing is {me.status === 'suspended' ? 'paused' : me.status === 'delisted' ? 'closed' : 'being checked'}, so you won't get new job requests{me.status === 'vetting' || me.status === 'applied' ? ' yet. You can set up your profile and rates now' : ''}. Questions: 1-833-997-7489.</Notice>
        )}
        {jobs.error && <Notice tone="error">{jobs.error}</Notice>}
        {tab === 'jobs' && jobs.data && <InstallerJobs me={me} rows={rows} reload={jobs.reload} />}
        {tab === 'rates' && <RatesTab me={me} />}
        {tab === 'profile' && <ProfileTab me={me} onSaved={reloadMe} />}
        {tab === 'performance' && <PerformanceTab me={me} />}
        {tab === 'agreement' && <AgreementTab />}
      </main>
    </>
  )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const act = useAction()
  return (
    <main className={`${WRAP} py-12 grid justify-items-center`}>
      <Card title="Sign in" className="w-full max-w-md">
        {sent ? <Notice tone="ok">Check your email for a sign-in link. It works once, for one hour.</Notice> : (
          <form className="grid gap-3" onSubmit={async (e) => { e.preventDefault(); if (await act.run(() => sendSignInLink(email.trim()))) setSent(true) }}>
            <p className="text-sm text-muted-foreground">For approved installers and the Next Partitions team. We email you a sign-in link; there's no password.</p>
            <Field label="Email"><input className={INPUT} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Button type="submit" busy={act.busy}>Email me a sign-in link</Button>
            {act.error && <Notice tone="error">{act.error.includes('Signups not allowed') ? "That email doesn't have a login. Installers get one once they're approved; call 1-833-997-7489." : act.error}</Notice>}
          </form>
        )}
        <p className="text-sm text-muted-foreground border-t border-border pt-3">Want to be listed? Call Next Partitions at 1-833-997-7489.</p>
      </Card>
    </main>
  )
}

function NotLinked({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <main className={`${WRAP} py-12 grid justify-items-center`}>
      <Card title="No listing for this login" className="w-full max-w-md">
        <p>You're signed in as <b>{email}</b>, but it isn't linked to an installer listing yet. Call Next Partitions at 1-833-997-7489 and we'll link it.</p>
        <div><Button variant="outline" onClick={onSignOut}>Sign out</Button></div>
      </Card>
    </main>
  )
}
