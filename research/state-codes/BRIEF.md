# Brief: building, plumbing and accessibility codes by state (for the "Bathroom Partitions in [City]" buy pages)

Each city buy page has a short, plain-language "Codes that apply" block. It tells a buyer of commercial toilet
partitions which accessibility standard and which plumbing/building code govern a restroom in that place, with a
source link, a "last checked" date and "confirm with [authority]". It must never imply a permit is needed to buy.

## What to record per state (and DC)

- `code`: two-letter state code.
- `accessibility`: the accessibility standard that applies to commercial restrooms in that state besides the federal
  2010 ADA Standards: the state's own standard if it has one (e.g. Texas Accessibility Standards, California Building
  Code Chapter 11B, Florida Accessibility Code), otherwise ICC A117.1 as referenced by the adopted building code, with
  its edition. Fields: `name`, `edition`, `authority`, `url`.
- `building_code`: the commercial building code in force statewide (e.g. "2021 International Building Code with state
  amendments"), or "no statewide code; set by each city or county" where that is so. Fields: `name`, `edition`,
  `statewide` (true / false / "partial"), `authority`, `url`.
- `plumbing_code`: the plumbing code in force (International Plumbing Code, Uniform Plumbing Code, or a state code),
  edition, statewide or local. It sets the number of fixtures a building needs. Same fields.
- `summary`: one or two plain sentences a building owner would understand. No signposting, no legal advice.
- `quote`: a short verbatim line from an official page that supports the edition or standard named.
- `confidence`: high (read on an official state page), medium (read on ICC, IAPMO or another reliable secondary page),
  low (not confirmed).
- `to_confirm`: what a person should confirm by phone or on a page you couldn't open.
- `checked`: 2026-11-23.

## Rules

- Official sources first: the state building code office, state fire marshal, licensing/regulation department, the
  state's administrative code. ICC's state adoption pages (iccsafe.org) and IAPMO's adoption pages are acceptable
  secondary sources; say which you used.
- Every fact needs the URL you read it on. If you didn't read it, leave it out or mark it low. Never guess an edition
  year: codes change and your memory of adopted editions may be out of date.
- Use WebSearch and WebFetch (load with ToolSearch "select:WebSearch,WebFetch"; if WebFetch isn't offered, use curl).
  Web searches are shared with other agents: use at most the number given in your task. Prefer fetching pages you
  can guess (state code office sites, iccsafe.org adoption pages) over searching.
- Research only. No sign-ins, no forms, no contact.
- Write your results as a JSON array to the file named in your task, then reply with a three-line summary: how many
  high / medium / low, and anything surprising.
