// Turns one outbox row (with its context from dir_outbox_context) into the emails it sends. Pure: no I/O, so
// the copy can be tested (app/src/outbox/messages.test.ts) and changed without touching the sender.
// Copy follows prototypes/email-copy.html (emails 2–10). Installer emails never carry customer details until
// the job is released; customer emails carry the installer disclaimer.

export interface OutboxContext {
  id: number
  kind: string
  payload: Record<string, unknown>
  job: {
    ref: string; city: string; zip: string; status: string; is_test: boolean
    stalls: number | null; material: string | null; mounting: string | null
    install_date: string | null; price_due_at: string | null
    delivery_from: string | null; delivery_to: string | null; priced: number
  } | null
  customer: {
    name: string; company: string | null; email: string
    phone: string | null; site_address: string | null; site_contact: string | null
  } | null
  quote_token: string | null
  installer: { name: string; slug: string; contact_name: string | null; email: string | null } | null
  invite: { price_cents: number | null; due_at: string | null; estimate_cents: number | null; invited_by: string } | null
}

export interface Config {
  siteUrl: string            // e.g. https://nextpartitions.com
  coordinatorEmail: string   // the job coordinator's inbox (for the first months, ours)
  phone: string              // shown in customer emails
  timeZone: string           // deadlines are shown in the pilot area's time
}

export interface Message { to: string; audience: 'customer' | 'installer' | 'coordinator' | 'applicant'; subject: string; text: string }

const MATERIAL: Record<string, string> = {
  powder_coated: 'powder coated steel', hdpe: 'solid plastic (HDPE)', phenolic: 'phenolic',
  laminate: 'plastic laminate', stainless: 'stainless steel',
}
const MOUNTING: Record<string, string> = {
  overhead_braced: 'overhead braced', floor_mounted: 'floor mounted', ceiling_hung: 'ceiling hung',
  floor_to_ceiling: 'floor to ceiling',
}
const DISCLAIMER = "Installers are independent businesses. You hire, schedule and pay them directly. Next Partitions isn't a party to installation agreements and doesn't perform, supervise or guarantee installation work."
const FOOT_CUSTOMER = "You're receiving this because you requested a quote at nextpartitions.com."
const FOOT_INSTALLER = "You're receiving this because you're a listed installer with Next Partitions. Job emails can't be turned off while your listing is active."
const FOOT_APPLICANT = "You're receiving this because you applied to be listed as an installer with Next Partitions."
const FOOT_INTERNAL = 'Internal alert for the job coordinator.'

export const money = (cents: number) => '$' + Math.round(cents / 100).toLocaleString('en-US')

const dateTime = (iso: string, tz: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
// Plain dates (install date, delivery window) have no time zone: format them as written.
const day = (d: string) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })

const body = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join('\n\n')
const rows = (r: [string, string | null | undefined | false][]) =>
  r.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
const sign = (foot: string) => `Next Partitions\n\n--\n${foot}`

function scopeLine(j: NonNullable<OutboxContext['job']>) {
  const parts = [j.stalls ? `${j.stalls} ${j.stalls === 1 ? 'stall' : 'stalls'}` : null,
    j.material ? MATERIAL[j.material] ?? j.material : null, j.mounting ? MOUNTING[j.mounting] ?? j.mounting : null]
  return parts.filter(Boolean).join(', ')
}
function shortScope(j: NonNullable<OutboxContext['job']>) {
  const m = j.material === 'hdpe' ? 'HDPE' : j.material ? MATERIAL[j.material] ?? j.material : ''
  return [j.stalls ? `${j.stalls}` : null, m, j.stalls === 1 ? 'stall' : 'stalls'].filter(Boolean).join(' ')
}
const delivery = (j: NonNullable<OutboxContext['job']>) =>
  j.delivery_from && j.delivery_to ? `${day(j.delivery_from)} to ${day(j.delivery_to)}` : null
const firstName = (name: string) => name.trim().split(/\s+/)[0]

export function renderMessages(c: OutboxContext, cfg: Config): Message[] {
  const p = c.payload ?? {}
  const j = c.job
  const portal = `${cfg.siteUrl}/portal/`
  const jobLink = j ? `${portal}#${j.ref}` : portal
  const quoteLink = c.quote_token ? `${cfg.siteUrl}/quote/${c.quote_token}` : null
  const inst = c.installer
  const instEmail = inst?.email ?? null
  const hiInstaller = `Hi ${inst?.contact_name ? firstName(inst.contact_name) : `${inst?.name ?? 'there'} team`},`
  const hiCustomer = c.customer ? `Hi ${firstName(c.customer.name)},` : 'Hello,'
  const out: Message[] = []
  const toInstaller = (subject: string, text: string) => { if (instEmail) out.push({ to: instEmail, audience: 'installer', subject, text }) }
  // Test jobs (vetting) are never quoted to a customer.
  const toCustomer = (subject: string, text: string) => {
    if (c.customer?.email && !j?.is_test) out.push({ to: c.customer.email, audience: 'customer', subject, text })
  }
  const toCoordinator = (subject: string, text: string) => out.push({ to: cfg.coordinatorEmail, audience: 'coordinator', subject, text })
  const toApplicant = (subject: string, text: string) => {
    const to = (typeof p.email === 'string' && p.email) || instEmail
    if (to) out.push({ to, audience: 'applicant', subject, text })
  }
  const ref = j?.ref ?? ''
  const where = j ? `${j.city} ${j.zip}` : ''

  switch (c.kind) {
    // Emails 2 and 9: a new job to price (9 when the search widened or we invited by hand).
    case 'job_invite': {
      if (!j) break
      const due = (p.due_at as string | null) ?? c.invite?.due_at ?? j.price_due_at
      const est = (p.estimate_cents as number | null) ?? c.invite?.estimate_cents
      const wider = p.invited_by === 'widened' || p.invited_by === 'manual'
      toInstaller(
        wider ? `Can you take this one? ${shortScope(j)} in ${j.city}${due ? ` (reply by ${dateTime(due, cfg.timeZone)})` : ''}`
              : `New job: ${shortScope(j)} in ${j.city}${due ? ` (reply by ${dateTime(due, cfg.timeZone)})` : ''}`,
        body(hiInstaller,
          wider ? `The installers who usually cover ${j.city} are booked, so we're asking a few more. Please price it in the portal if you can take it.`
                : 'A customer in your area wants installation for partitions ordered from Next Partitions. Please price it in the portal.',
          rows([['Job', ref], ['Location', where], ['Partitions', scopeLine(j)], ['Delivery', delivery(j)],
            ['Estimate from your rates', est ? money(est) : null]]),
          `Price this job: ${jobLink}`,
          due && `Please reply by ${dateTime(due, cfg.timeZone)}. Shop drawings and the hardware list are in the portal.${wider ? " If you can't take it, declining is fine and doesn't count against you for jobs outside your area." : ''}`,
          "Customer name, contact details and site address are shared once the customer chooses you and pays for their partitions order. Until then, send questions through the portal.",
          sign(FOOT_INSTALLER)))
      break
    }
    // Email 3.
    case 'invite_reminder': {
      if (!j) break
      const due = (p.due_at as string | null) ?? c.invite?.due_at
      toInstaller(`Reminder: ${ref} needs your price${due ? ` by ${dateTime(due, cfg.timeZone)}` : ''}`,
        body(hiInstaller,
          `We haven't had your price for job ${ref} in ${j.city} yet.${due ? ` It's due by ${dateTime(due, cfg.timeZone)}.` : ''}`,
          `Price this job: ${jobLink}`,
          "Can't take it? Declining is fine and takes one click; it keeps your reply time on track. Reply time is part of your Installer Score.",
          sign(FOOT_INSTALLER)))
      break
    }
    // Only the answers the job coordinator should look at: a decline, a late price or a price check.
    case 'invite_answered': {
      if (!j) break
      const flag = p.price_flag === 'above_rates' ? 'above their own rates' : p.price_flag === 'above_area' ? 'above the area range' : null
      if (!p.declined && !p.late && !flag) break
      toCoordinator(`${inst?.name ?? 'An installer'} ${p.declined ? 'declined' : 'priced'} ${ref}${flag ? ': price check' : p.late ? ' (late)' : ''}`,
        body(rows([['Job', `${ref}, ${scopeLine(j)}, ${where}`], ['Installer', inst?.name],
          ['Answer', p.declined ? 'Declined' : typeof p.price_cents === 'number' ? money(p.price_cents) : null],
          ['Price check', flag && `The price is ${flag}. Check it before you show it to the customer.`],
          ['Late', p.late ? 'After the deadline' : null]]),
          `Open the job: ${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    // The price window closed with prices: the coordinator checks them and shows them on the quote.
    case 'prices_ready': {
      if (!j) break
      const n = Number(p.prices ?? j.priced ?? 0), flagged = Number(p.flagged ?? 0)
      toCoordinator(`Prices are in for ${ref}, ${j.city}: ${n} ${n === 1 ? 'price' : 'prices'}${flagged ? `, ${flagged} to check` : ''}`,
        body(`The price window for ${ref} has closed with ${n} firm installation ${n === 1 ? 'price' : 'prices'}.`,
          flagged > 0 && `${flagged} ${flagged === 1 ? 'price is' : 'prices are'} flagged for a price check.`,
          "Check the partitions quote and drawings, then choose \"Show prices on the customer's quote\". The customer gets an email with their quote link at that point.",
          `Open the job: ${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    // Emails 8 and 10.
    case 'search_widened': {
      if (!j) break
      const n = Number(p.invited ?? 0)
      toCoordinator(`No installer prices: ${ref}, ${j.city} (search widened)`,
        body(`Job ${ref} has no firm installation price by its deadline.`,
          rows([['Job', `${scopeLine(j)}, ${where}`], ['Wider search, 75 mi', `${n} more ${n === 1 ? 'installer' : 'installers'} invited`],
            ['Customer', 'Emailed: still lining up your installer']]),
          `Open the job: ${portal}coordinator`,
          "Invite another installer by hand if you know one who's free. If nobody prices in the second round, call the customer: partitions only now and install later, or their own installer.",
          FOOT_INTERNAL))
      toCustomer('Your installation prices are taking a little longer',
        body(hiCustomer,
          `The installers we asked first are booked for your dates, so we've asked more installers in the wider ${j.city} area. We'll email you as soon as firm installation prices are in.`,
          'You have three options:',
          "1. Wait: no need to do anything. We'll email you as soon as prices are in.\n2. Go ahead with partitions only: your partitions ship as planned and you can add an installer when prices come in.\n3. Use your own installer: we include the install packet with the layout, hardware list and install guide.",
          quoteLink && `See your options: ${quoteLink}`,
          DISCLAIMER, `Questions? Reply to this email or call ${cfg.phone}.`, sign(FOOT_CUSTOMER)))
      break
    }
    case 'no_prices': {
      if (!j) break
      toCoordinator(`No installer for ${ref}, ${j.city}: call the customer`,
        body(rows([['Job', `${scopeLine(j)}, ${where}`], ['Why', String(p.reason ?? 'No prices')],
          ['Customer', c.customer ? `${c.customer.name}${c.customer.company ? `, ${c.customer.company}` : ''}` : null]]),
          'The automatic search has run out. Invite an installer by hand, or offer the customer partitions only now and installation later, or their own installer.',
          `Open the job: ${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    // Email 5.
    case 'installer_chosen': {
      if (!j) break
      const price = c.invite?.price_cents
      toInstaller(`You've been chosen for ${ref} in ${j.city}`,
        body(hiInstaller,
          `Good news: the customer chose you to install job ${ref} in ${j.city}${price ? ` at your price of ${money(price)}` : ''}.`,
          rows([['Delivery', delivery(j)], ['Your price', price ? money(price) : null]]),
          "The customer's name, contact details and site address unlock as soon as they pay for the partitions order. We'll email you the moment that happens. Please don't book the date yet.",
          `View the job: ${jobLink}`, sign(FOOT_INSTALLER)))
      break
    }
    // Email 6: the one installer email with customer details, sent only once the job is released.
    case 'job_released': {
      if (!j || !c.customer) break
      toInstaller(`${ref} is yours: customer details inside`,
        body(hiInstaller,
          `The partitions order for ${ref} is ${p.by === 'purchase_order' ? 'confirmed by purchase order' : 'paid'}, so the job is yours. Here are the customer's details.`,
          rows([['Customer', `${c.customer.name}${c.customer.company ? `, ${c.customer.company}` : ''}`], ['Phone', c.customer.phone],
            ['Email', c.customer.email], ['Site', c.customer.site_address], ['On-site contact', c.customer.site_contact],
            ['Delivery', delivery(j)]]),
          `Set install date: ${jobLink}`,
          '- Contact the customer to agree the date, on or after delivery.\n- You contract and invoice installation directly with the customer.\n- Keep Next Partitions posted: set the date and mark the job installed in the portal.',
          sign(FOOT_INSTALLER)))
      break
    }
    case 'job_status': {
      if (!j) break
      // Email 4: the coordinator has shown the prices on the quote.
      if (p.to === 'presented' && p.from !== 'installer_chosen') {
        const n = j.priced
        toCustomer('Your quote: drawings and installation options',
          body(hiCustomer,
            `Your shop drawings and partitions quote are ready, along with ${n === 1 ? 'a firm installation price' : `${n} firm installation prices`} from installers near ${j.city}.`,
            'Installation prices are quoted and billed by each installer. You can also choose your own installer, or none.',
            quoteLink && `Review your quote: ${quoteLink}`,
            '1. Check the drawings and choose an installer.\n2. Pay for the partitions order (card, bank transfer or purchase order).\n3. We confirm delivery and your installer contacts you to set the date.',
            DISCLAIMER, `Questions about the drawings? Reply here or call ${cfg.phone}.`, sign(FOOT_CUSTOMER)))
      }
      if (p.to === 'cancelled') {
        toCoordinator(`${ref} was cancelled`, body(rows([['Job', `${scopeLine(j)}, ${where}`], ['Was', String(p.from ?? '')], ['Installer', inst?.name]]), FOOT_INTERNAL))
      }
      break
    }
    // Email 7 needs the review page, which isn't built yet: until then the coordinator asks for the review.
    case 'review_request': {
      if (!j) break
      toCoordinator(`Ask for a review: ${ref}, ${inst?.name ?? 'installer'}`,
        body(`${inst?.name ?? 'The installer'} marked ${ref} in ${j.city} as installed${j.install_date ? ` on ${day(j.install_date)}` : ''}.`,
          rows([['Customer', c.customer ? `${c.customer.name}${c.customer.company ? `, ${c.customer.company}` : ''}, ${c.customer.email}` : null]]),
          'Check with the customer that it went well and ask for a review. Once the review page is built, this email goes to the customer instead.',
          FOOT_INTERNAL))
      break
    }
    case 'document_uploaded': {
      toCoordinator(`New document from ${inst?.name ?? 'an installer'}: ${String(p.check_type ?? '').replace(/_/g, ' ')}`,
        body('Check it in the portal (Documents tab) and update the check.', `${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    case 'application_received': {
      toApplicant('We have your application',
        body(inst?.contact_name ? `Hi ${firstName(inst.contact_name)},` : 'Hello,',
          `Thanks for applying to be listed as an installer with Next Partitions${inst ? ` (${inst.name})` : ''}.`,
          "What happens next:\n1. We check your insurance and business registration and call your references.\n2. We send you a test job request to price, so we can see how you reply.\n3. Once everything checks out you sign the listing agreement and your profile goes live, labelled Verified. Your first completed job for one of our customers earns the Approved label.",
          "We'll email you if we need anything else. Most applications take about a week.",
          sign(FOOT_APPLICANT)))
      toCoordinator(`New installer application: ${inst?.name ?? 'unknown'}`,
        body('Open the Vetting tab to check documents and call references.', `${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    case 'application_info_request': {
      toApplicant('We need a little more for your application',
        body('Hello,', 'Thanks for your application. Before we can list you we need:', String(p.note ?? 'a few more details'),
          'Reply to this email with the documents or details, or call us at ' + cfg.phone + '.', sign(FOOT_APPLICANT)))
      break
    }
    case 'application_rejected': {
      toApplicant('Your application to Next Partitions',
        body('Hello,', "Thanks for applying to be listed as an installer. We're not able to list you at this time.",
          p.note ? String(p.note) : null, 'If anything changes, you are welcome to apply again.', sign(FOOT_APPLICANT)))
      break
    }
    case 'application_approved': {
      toApplicant("You're listed with Next Partitions",
        body('Hello,', `Your profile is live${inst ? `: ${cfg.siteUrl}/installers/${inst.slug}` : ''}. It shows the Verified label; your first completed job for one of our customers earns the Approved label.`,
          p.note ? String(p.note) : null,
          `Job requests arrive by email and in your portal: ${portal}. Please keep your rates and service area up to date there.`,
          sign(FOOT_INSTALLER)))
      break
    }
    case 'customer_change_request': {
      toCoordinator(`Drawing changes requested: ${ref}`,
        body(rows([['Job', j ? `${scopeLine(j)}, ${where}` : null], ['Customer', c.customer?.name]]),
          `"${String(p.text ?? '')}"`, 'Update the drawings and the quote, then reply to the customer.', `${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    case 'customer_choice': {
      const label = ({ wait: 'will wait for installer prices', partitions_only: 'goes ahead with partitions only', own_installer: 'will use their own installer (send the install packet)' } as Record<string, string>)[String(p.choice)] ?? String(p.choice)
      toCoordinator(`${ref}: customer ${label}`, body(`${c.customer?.name ?? 'The customer'} ${label}.`, `${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    case 'customer_payment': {
      const how = p.method === 'po' ? `purchase order${p.po_number ? ` ${p.po_number}` : ''}` : p.method === 'card' ? 'card: send a payment link' : 'bank transfer: send details and a pro forma invoice'
      toCoordinator(`${ref}: customer chose to pay by ${p.method === 'po' ? 'purchase order' : p.method === 'card' ? 'card' : 'bank transfer'}`,
        body(`${c.customer?.name ?? 'The customer'} chose ${how}.`, 'Once payment is in (or the purchase order is accepted), mark it in the portal; that releases the job to the installer.', `${portal}coordinator`, FOOT_INTERNAL))
      break
    }
    default:
      // A new event type nobody wrote copy for yet: tell the coordinator rather than drop it.
      toCoordinator(`Directory event: ${c.kind}${ref ? ` (${ref})` : ''}`, body(JSON.stringify(c.payload ?? {}, null, 2), FOOT_INTERNAL))
  }
  return out
}
