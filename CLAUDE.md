# Next Partitions: project memory

Working notes for the nextpartitions.com redesign and the installer directory. Read this first in a new session.

## Business model decisions (agreed)

- Next Partitions sells partitions (reseller of Bobrick, ASI, Scranton, Bradley, Metpar, Ammco). It does **not** sell installation and takes **no liability** for installers' work.
- The installer directory is **referral only**. Installers are independent businesses; the customer hires, schedules and pays them directly. Every directory page carries the standard disclaimer:
  "Installers are independent businesses. You hire, schedule and pay them directly. Next Partitions isn't a party to installation agreements and doesn't perform, supervise or guarantee installation work."
- Protection against installers buying around us comes from:
  1. **Order of steps:** partitions quote first, then installation.
  2. **Customer details hidden** (name, phone, email, site address) until the customer has chosen an installer **and** paid for the partitions order. Before that, installers get a blind job packet (scope, shop drawings, city/ZIP) and price it through Next Partitions.
  3. **Listing agreement:** install the partitions on the customer's Next Partitions order, no substitutes, report job status, delisting on breach.
  4. **Trade accounts** for installers.
  5. **Call tracking** on profile phone numbers.
  6. **Next Partitions runs the middle:** one point of contact for the customer, presenting installer prices, lining up delivery and install dates and following job status. The installer still contracts and invoices installation directly (one combined bill needs legal review first). No markup on installation; our margin is on partitions.
  7. **Non-circumvention clause** in the listing agreement (no going around us on referred customers; fee or delisting on breach).
- **Directory and location pages list installers by name** (for search), but contact runs through us: "Get a quote with [installer]" opens the configurator, phone numbers are tracked, no direct email or website link. The **primary action on every location page is "Configure your partitions"**; browsing installers is secondary.
- **Labels:** every listed installer is **Approved** (installs customer-bought partitions, insurance and business or city registration on file, references contacted, signed listing agreement, one completed job). Earned extras: **Established** (10+ installs for our customers) and **Top rated** (4.8+ from 10+ reviews). Labels state facts, not endorsements.
- **Vetting and ratings (agreed):** we (the agency) vet installers for the Approved checklist, not Abe's team. After approval, a ratings and review system keeps quality up: only customers with a completed job on a Next Partitions order can review, reviews are published unedited (bad ones included), and low ratings trigger a check and can lead to delisting.
- **Configurator:** installers stay anonymous (a count and a price range only). Names come with the shop drawings. The exception is a visitor arriving from an installer profile, where that installer is included by name.
- The real configurator (nextpartitions.com/get-a-quote) is a **quote request**, not a checkout. Never write "order" or "checkout" copy for it.
- **Pilot area: Dallas–Fort Worth** (Texas hub, then the DFW area page). Texas has no statewide contractor license, so checks show city or state business registration.

## Client relationship

- The client (Abe Gold) will consider renewing for a full year if the first month goes well. Aim to overdeliver in month one: visible shipped work every week, and success measures agreed at onboarding with a day-30 review.

## Prototype pages (claude.ai artifacts)

**Clickable prototype (all five pages linked, start here):** https://claude.ai/artifact/1EM6mvJkMTXTtfTNj5SrbQ — built by `node prototypes/build-linked.mjs` from the files in `prototypes/`. The prototypes are the approved design; the React build in `directory/app` must match them.

| Page | URL |
|---|---|
| Homepage redesign (3 ways into a quote) | https://claude.ai/artifact/EAVGm8PLp8dyhvnoFTei68 |
| Texas installer hub | https://claude.ai/artifact/LZqngrbkARWrHC23dqswt5 |
| DFW installer area page | https://claude.ai/artifact/Emsk4xQGarEUxTuXLLdm1q |
| Installer profile template (`#acme`, `#northwind`, `#contoso`, `#fabrikam`) | https://claude.ai/artifact/Hp9kJEgkaRXCtjoxWMkXPx |
| Configurator installation step (`#dfw`, `#<installer>.<material>.<mounting>.<stalls>`) | https://claude.ai/artifact/Gz25gTarUFNBiC4uJ2Uxfs |

All installers, rates, reviews and photos in the prototypes are fictional samples.

## Research in this repo

- `research/strategy-2026-02/`: the original February 2026 SEO and website strategy (report, keyword lists 1–4, blog and city-page calendars, technical checklist), with a status check of the live site and how it fits the directory work. **The live site follows its URL structure** (`/guides/`, `/service-area/[city]/`); new pages should too.
- `docs/onboarding-call-roadmap.md`: onboarding call agenda, what we need from Abe, day-30 success measures and the 30-day plan. The directory launches in month 2, once at least 3 installers are approved.

- `research/installer-regulations.md`: who may install partitions, by state, city and building type. Includes the planned blog cluster and where each item appears on location pages.
- `prototypes/`: HTML source of the mockups above (see its README).
- `research/installer-keywords/`: the Semrush export (147 installer keywords, US, 2026-10-14) and the same list mapped to target pages.

## Content principles

- Rules and costs show a source link, a "last checked" date and "confirm with [authority]". A lawyer reviews the wording before launch.
- Present local rules in plain language without implying a permit is needed to **buy** partitions.
- Year-variant keywords ("2025/2026 … cost installed") target **one permanent page**. Update the year in the title every January.
