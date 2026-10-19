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
| `quick-quote.html` | Earlier quick-quote widget exploration |

All installers, rates, reviews and photos are fictional samples. Product photos and brand logos come from nextpartitions.com.

## Linked bundle

`node build-linked.mjs` writes `linked/`: the pages as one site with relative links (no claude.ai hops), `get-a-quote` pointed at the configurator prototype. Published at https://claude.ai/artifact/1EM6mvJkMTXTtfTNj5SrbQ.
