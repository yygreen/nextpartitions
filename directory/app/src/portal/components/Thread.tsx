import { useState } from 'react'
import { portal } from '../client'
import { formatWhen } from '../stage'
import type { Message } from '../types'
import { Button, TEXTAREA, useAction, useLoad } from './ui'

// One installer's conversation with Next Partitions about a job. The customer never posts here;
// before release the database hides phone numbers and emails in installer messages.
export function Thread({ jobId, installerId, as, released }: { jobId: string; installerId: string; as: Message['sender']; released: boolean }) {
  const { data: msgs, error, reload } = useLoad(() => portal().messages(jobId, installerId), [jobId, installerId])
  const [body, setBody] = useState('')
  const send = useAction()
  const mine = (m: Message) => m.sender === as

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 max-h-80 overflow-auto pr-1" aria-live="polite">
        {error && <p className="text-sm text-red-800">{error}</p>}
        {msgs?.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
        {msgs?.map((m) => (
          <div key={m.id} className={`max-w-[85%] px-3 py-2 text-sm border ${mine(m) ? 'justify-self-end bg-surface-warm border-brand-red/30' : 'bg-muted border-border'}`}>
            <small className="block text-[11px] font-semibold text-muted-foreground">
              {m.sender === 'next_partitions' ? 'Next Partitions' : as === 'installer' ? 'You' : 'Installer'} · {formatWhen(m.createdAt)}
            </small>
            <span className="whitespace-pre-wrap">{m.body}</span>
            {m.redacted && <small className="block text-[11px] text-muted-foreground mt-1">Contact details were hidden: they're shared once the job is released.</small>}
          </div>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault()
        if (!body.trim()) return
        if (await send.run(() => portal().sendMessage(jobId, installerId, as, body.trim()))) { setBody(''); reload() }
      }}>
        <label className="sr-only" htmlFor={`msg-${jobId}-${installerId}`}>Message</label>
        <textarea id={`msg-${jobId}-${installerId}`} className={`${TEXTAREA} flex-1 min-h-11`} rows={2} value={body} onChange={(e) => setBody(e.target.value)}
          placeholder={as === 'installer' ? 'Ask about the drawings, site or schedule' : 'Message the installer'} />
        <Button type="submit" busy={send.busy}>Send</Button>
      </form>
      {send.error && <p className="text-sm text-red-800">{send.error}</p>}
      {as === 'installer' && !released && <p className="text-xs text-muted-foreground">Messages go to Next Partitions. Phone numbers and emails are hidden until the job is released to you.</p>}
    </div>
  )
}
