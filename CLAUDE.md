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
- **Prices are gated behind an email.** The step-by-step pricer on location pages (one question per slide) never shows a price, a total or per-stall rates until the visitor enters an email; the final slide is "Get my instant quote range". The email becomes a lead, and the range is also emailed to them.
- **City and area pages run the configurator only:** no catalogue link and no separate "Send your plans" option. People with drawings use "Have drawings? Upload them instead" inside the layout slide. "Install only?" stays as a small text link.
- The real configurator (nextpartitions.com/get-a-quote) is a **quote request**, not a checkout. Never write "order" or "checkout" copy for it.
- **The installer directory is kept apart from the main site:** its own section or subdomain (e.g. installers.nextpartitions.com). The homepage, the main navigation and the site footer never link to it, on any page (directory pages included), so nobody strays from the configurator or checkout. Breadcrumbs inside the directory may say "Installers". Visitors reach the directory from search and from the configurator's installation step; directory pages send them back into the configurator.
- **Homepage: three ways in** = Price it yourself (configurator), Send your plans, **Shop the catalogue** (`/products`: the existing shop with cart and checkout). No facility picker, "Help me choose" helper or grid toggle on the homepage; industry tiles link to the industry pages. Note: live robots.txt disallows `/products`, so the catalogue isn't indexed; check with Marc whether that's intended.
- **Maps:** prototypes use simplified SVG maps. Production should use Google Maps (Maps JavaScript API with circles for service radii, Places for ZIP/address search, Routes for drive times), with an API key from Abe's Google Cloud account restricted to nextpartitions.com. Installers are shown by base city, never street address.
- **Pilot area: Dallas–Fort Worth** (Texas hub, then the DFW area page). Texas has no statewide contractor license, so checks show city or state business registration.

## Client relationship

- The client (Abe Gold) will consider renewing for a full year if the first month goes well. Aim to overdeliver in month one: visible shipped work every week, and success measures agreed at onboarding with a day-30 review.

## Prototype pages (claude.ai artifacts)

**Clickable prototype (all pages linked, start here):** https://claude.ai/artifact/1EM6mvJkMTXTtfTNj5SrbQ — built by `node prototypes/build-linked.mjs` from the files in `prototypes/`. The prototypes are the approved design; the React build in `directory/app` must match them.

Each page on its own link (built by `node prototypes/build-linked.mjs separate`; links in `prototypes/separate-urls.json`):

| Page | URL |
|---|---|
| Homepage redesign (3 ways in) | https://claude.ai/artifact/2nD3Ct6kJfCtps9SL8GPus |
| Texas installer hub | https://claude.ai/artifact/NgMp8WdWWpwAfKPSwaDV29 |
| DFW installer area page | https://claude.ai/artifact/6dhxph55HK2cQ8L89RKUBc |
| Installer profile template (`#acme`, `#northwind`, `#contoso`, `#fabrikam`) | https://claude.ai/artifact/Wh2UPd1KDJ78JDQmZsySrN |
| Configurator installation step (`#dfw`, `#<installer>.<material>.<mounting>.<stalls>`) | https://claude.ai/artifact/VSxudbJ4rsvR5bcDyU2xSs |
| Installer portal (`#np` = Next Partitions view, `#NP-DFW-1048` = a job, `#NP-DFW-1052` = no installer prices yet) | https://claude.ai/artifact/32L7EWz37XztbenrBwUKBj |
| Customer's quote: approve drawings, choose installer, pay for partitions (`#choose`; `#searching` = still lining up installers) | https://claude.ai/artifact/YJ7mS6GqUSktyydDMy8BDq |
| Installer application (get listed) | https://claude.ai/artifact/RYzFiXDAUfUj1UbYaaf5N5 |
| Installer vetting (internal, Approved checklist) | https://claude.ai/artifact/5m6eiBdee8mbWGpusQiEF5 |
| Review form (`#used`, `#expired`) | https://claude.ai/artifact/KVKguYuwNK7AJkXXRseaM8 |
| Email copy, 10 emails (`#email-1` … `#email-10`; 8–10 = no installer prices) | https://claude.ai/artifact/614jrzEpTZt1WMTuruh4BS |

Older links (EAVGm8…, GTV4x…/LZqng…, JRhaX…/Emsk4…, Hp9kJ…, Gz25g…) are out of date; don't share them.

All installers, rates, reviews and photos in the prototypes are fictional samples.

## Research in this repo

- `research/strategy-2026-02/`: the original February 2026 SEO and website strategy (report, keyword lists 1–4, blog and city-page calendars, technical checklist), with a status check of the live site and how it fits the directory work. **The live site follows its URL structure** (`/guides/`, `/service-area/[city]/`); new pages should too.
- `docs/job-routing.md`: proposal for who gets invited to price a job (filters, 3 invites, rotation), when the price window closes, the fallback when nobody prices, avoiding site visits before the deal, and change orders.
- `docs/onboarding-call-roadmap.md`: onboarding call agenda, what we need from Abe, day-30 success measures and the 30-day plan. The directory launches in month 2, once at least 3 installers are approved.

- `research/installer-regulations.md`: who may install partitions, by state, city and building type. Includes the planned blog cluster and where each item appears on location pages.
- `prototypes/`: HTML source of the mockups above (see its README).
- `research/installer-keywords/`: the Semrush export (147 installer keywords, US, 2026-10-14) and the same list mapped to target pages.

## Content principles

- Rules and costs show a source link, a "last checked" date and "confirm with [authority]". A lawyer reviews the wording before launch.
- Present local rules in plain language without implying a permit is needed to **buy** partitions.
- Year-variant keywords ("2025/2026 … cost installed") target **one permanent page**. Update the year in the title every January.
