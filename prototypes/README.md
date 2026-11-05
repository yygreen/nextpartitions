# Prototypes

Static HTML mockups. Open any file in a browser; keep `img/` next to them. Each one is also published as a claude.ai artifact (links in `../CLAUDE.md`).

| File | What it is |
|---|---|
| `homepage-grid.html` | Homepage redesign on one 12-column grid, with three ways into a quote ("Opener" toggle compares them with the facility-picker version) |
| `installers-texas.html` | Texas installer hub: city/ZIP search, coverage map, area cards, A–Z city index, install options outside covered areas |
| `installers-dfw.html` | Dallas–Fort Worth installer area page: ZIP search, proximity map, installer cards, price table, FAQ |
| `installer-profile.html` | Installer profile template for the four DFW sample installers (`#acme`, `#northwind`, `#contoso`, `#fabrikam`) |
| `configurator-install.html` | New optional "Add Installation" step for the live configurator, plus the Request Quote step |
| `installer-portal.html` | Installer portal (login only): job inbox, job packet without customer details, confirm your price from your rates, messages through Next Partitions (contact details hidden before release), schedule and mark installed; rates, performance, listing agreement. `#np` shows the same job from the Next Partitions side |
| `customer-quote.html` | The customer's quote: approve shop drawings, choose an installer (firm prices, billed by the installer), pay for the partitions order (PO, card, ACH). `#choose` opens step 2 |
| `installer-apply.html` | Public "Get listed" page: why join, the Approved checklist, six-step application ending with the listing agreement |
| `installer-vetting.html` | Internal vetting screen: checklist with evidence per applicant, timed test job, approve or reject, DFW launch counter |
| `review-request.html` | Review form for customers with a completed job; low ratings flag a check; `#used` and `#expired` states |
| `email-copy.html` | The seven loop emails (quote range, job request, reminder, options ready, chosen, released, review request) with plain text |
| `quick-quote.html` | Earlier quick-quote widget exploration |

All installers, rates, reviews and photos are fictional samples. Product photos and brand logos come from nextpartitions.com.

## Linked bundle

`node build-linked.mjs` writes `linked/`: the pages as one site with relative links (no claude.ai hops), `get-a-quote` pointed at the configurator prototype. Published at https://claude.ai/artifact/1EM6mvJkMTXTtfTNj5SrbQ.
