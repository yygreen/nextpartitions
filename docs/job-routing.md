# Job routing: who gets invited, when the search closes, and what happens when nobody prices

Proposal for Abe (decisions 9–11 build on it). The installer portal prototype shows it: https://claude.ai/artifact/32L7EWz37XztbenrBwUKBj (`#np`, job NP-DFW-1052 for the fallback).

## 1. Who gets invited to price a job

Installers are invited only when the customer has asked for the full quote (drawings in hand), never for an email-gate lead on its own.

**Hard filters (must pass all):**
- Approved, with insurance and registration in date (not suspended or paused)
- Job site inside their service radius, by drive distance
- Installs the material and the bracing type on the job
- Capacity: under their open-jobs cap and not away during the delivery window
- School or public job: background-checked crew on file

**Up to 3 invites per job:**
- 2 by quality score: customer rating, completed installs, callback and complaint rate, how often the firm price matches their rates, on-time installs
- 1 rotation slot: the qualifying installer with the fewest recent invites. Newly approved installers get this slot first, so they can earn the completed job the Approved label needs.
- Ceiling: no installer gets more than about half of an area's jobs.

**Customer who picks a specific installer** (e.g. "Price with Acme" from a profile): only that installer is invited, so the customer gets their firm price and no list to choose from. Other installers are asked only if that installer declines or misses the deadline (the wider search in section 3), or if the customer asks for more prices.

## 2. When the search closes

The fastest reply doesn't win the job. Speed counts toward the Installer Score over time, not toward the choice on one job.

- The price window closes at whichever comes first: every invited installer has priced or declined; 2 business days after the invites; or, for a rush job, 2 firm prices are in.
- All prices go to the customer together, each with the installer's earliest install date. The default order is best value (price against the area's typical price, rating, earliest date); cheapest is an option.
- A late price is accepted until the customer chooses and is marked as late. Late replies lower the installer's score.

## 3. Nobody prices (fallback)

Triggers: no approved installer covers the site, every invited installer declines, or the deadline passes with no firm price.

1. **Automatic:** the search widens once to 75 mi. The next installers by rank are invited, with travel fees from their own rates and a new deadline (1 business day). Dana is alerted (email 8). The installers get a wider-area request (email 9).
2. **Customer:** emailed that prices are taking longer (email 10), with three choices on their quote page (`quote.html#searching`): wait; go ahead with partitions only and add installation later; or use their own installer (install packet included).
3. **Dana:** can invite an approved installer by hand at any point.
4. **Still nothing after the wider search:** Dana calls the customer and offers partitions only, or their own installer. The job is logged as an uncovered area, which feeds installer recruiting there.

Built in the database (`directory/supabase/migrations/20261020000000_job_routing.sql`, tested): invite deadlines and search rounds, the 15-minute sweep that closes windows and widens the search, Dana's "needs attention" list, manual invites, price flags, late replies and reminders.

## 4. Site visits without handing over the customer

1. **Default: site conditions collected in the quote request.** A few questions (floor finished, ceiling height and what's above, wall material and blocking, old stalls to remove, floor level and elevator, work hours) plus 4–6 photos. The installer's firm price lists these as its assumptions.
2. **Unclear jobs: a video check hosted by Next Partitions.** We run the call; the customer joins from the site and the installer joins through us, with no names, numbers or address exchanged.
3. **Large or complex jobs: measure after the customer commits.** Customer chooses, the PO is accepted or a deposit is paid, the details are released, the installer field-measures, then the drawings are finalized before the partitions are made. The address only goes out once the customer has committed.

## 5. Change orders

- Valid only when the site differs from the assumptions on the firm price: unfinished floor, missing blocking, an extra trip because the site wasn't ready.
- Filed in the portal with a reason, photos and an amount; common items come from the installer's rates (blocking per stall, trip fee).
- Next Partitions checks it against the job packet and the rates, then the customer approves or declines it on their quote page. No extra work without approval. The installer bills it; we add nothing.
- Frequent change orders lower the installer's score, so pricing low and raising it later doesn't pay.
- Wrong partitions (size, quantity) are fixed by Next Partitions as part of the partitions order, not as an installation change order.

## 6. Small jobs: an instant firm price instead of three quotes

For a small job (1–3 stalls, or under about $800 of installation), asking three installers wastes everyone's time for a small saving.

- The best-ranked available installer is offered the job at the price their agreed rates give. That becomes the customer's firm installation price straight away.
- The installer confirms availability within 1 business day, or the next one by rank gets the offer.
- Where two installers cover the area, the offer alternates between them.
- Bigger jobs get the three-price comparison in section 1.

## 7. After each job: how your price compared

On jobs with 3 or more firm prices, each installer who wasn't chosen gets a short, anonymous note: "The chosen price was 5–10% below yours" (rounded to a band, no names). It helps installers learn the market without revealing a competitor's price. On jobs with fewer prices, there's no note, because it would give away the other installer's number.

## 8. Areas with only one or two installers

Where only one or two installers cover a job, the customer's protection comes from the benchmark, not from competing prices.

- **Invite everyone who qualifies.** No ranking is needed.
- **Agreed rates do the work.** Each installer agrees their rates with us separately and never sees anyone else's. A firm price more than 15% above their own rates, or above the area's typical price, goes to Dana before the customer sees it.
- **Borrowed benchmark.** Until an area has its own price history, use DFW-wide (later Texas-wide) prices per stall by material, shown to the customer as "typical for your area: $X–$Y".
- **Installers never learn how many others were asked.** Every invite says "you may be one of several installers asked".
- **Widen for a third price.** Invite an installer from a neighbouring zone, with travel fees from their own rates.
- **The customer's way out:** their own installer, with the install packet included.
- **Recruit where it's thin.** The vetting screen tracks installers per ZIP group, aiming for at least 3 per zone. A thin or uncovered zone starts recruiting there (application page, manufacturers' dealer lists, Division 10 freelancers).
- **DFW at launch:** the core (Dallas, Fort Worth, Arlington, Plano) should reach 3+ quickly. The edges (Granbury, Denton, McKinney) will be thin, and these rules cover them.
