# Brief: four local facts for a "Bathroom Partitions in [City]" buy page

nextpartitions.com sells commercial toilet partitions nationwide. Each city buy page carries local facts a buyer can
use, each with a source link and a "last checked" date (2026-11-24). Research these four for your city. Read every
fact on the page you cite; never fill a number, rate or rule from memory. If you can't read it, leave it null and say
who to ask. Pages are written in everyday language later; you record the facts and exact quotes.

## 1. Installation labor cost

a. **Carpenter wage, metro vs national.** U.S. Bureau of Labor Statistics, Occupational Employment and Wage
   Statistics (OEWS), occupation 47-2031 Carpenters: mean and median hourly wage for the city's metropolitan area and
   for the U.S., latest release (say which: e.g. May 2025). bls.gov often blocks scripts; try the OEWS area pages
   (https://www.bls.gov/oes/current/oes_<area code>.htm), the occupation page
   (https://www.bls.gov/oes/current/oes472031.htm), the downloadable area files, or the public API
   (https://api.bls.gov/publicAPI/v2/timeseries/data/). Record the metro's exact BLS name, both wages, the release,
   and the URL. Compute `pct_vs_us_mean`.
b. **Wage required on public jobs (schools, city buildings).** Which law applies to a public school or city project
   there (state prevailing wage law, or only the federal Davis-Bacon Act on federally funded work), and the current
   carpenter rate for building construction in the city's county: basic hourly rate and fringe, with the
   determination number/date. Sources: the state labor department's prevailing wage pages (California DIR,
   Washington L&I), sam.gov wage determinations for Davis-Bacon, the Texas Government Code ch. 2258 as applied by the
   local school district or city. Note any dollar threshold below which it doesn't apply.

## 2. Where the state's accessibility rules for toilet stalls go further than the federal 2010 ADA Standards

For toilet compartments (wheelchair accessible and ambulatory stalls, doors, toe clearance, grab bars, signs on
restroom doors, children's stalls), list each point where the state standard in force differs from the 2010 ADA
Standards sections 213 and 604: state section, the state requirement, the federal one, both quoted. Only real
differences; if the state standard is the same on a point, don't list it. If the state simply adopts the federal
text or ICC A117.1, say so and list what A117.1's edition changes for stalls (if you can read it).

## 3. Single-user and all-gender restroom rules

What state law, the state building/plumbing code and the city's own code require of a building owner for (a)
single-user restrooms (must they be open to all genders? signage?), (b) multi-user all-gender restrooms (allowed?
what must the stalls be: full-height partitions, doors without gaps, locks, occupancy indicators?), and (c) any law
restricting which restroom people may use in certain buildings. Quote the statute or code section. State facts
neutrally; no commentary.

## 4. Sales tax on a partition purchase

a. The combined state and local sales tax rate at a downtown address in the city, with its parts (state, county,
   city, district), from the state revenue agency's own rate page or lookup, and the date the rate took effect.
b. Whether tax applies to: partitions sold and shipped without installation by an out-of-state seller (use tax /
   remote seller rule); installation labor on a commercial remodel when billed separately; and a contractor's
   furnish-and-install contract for real property improvements. Quote the revenue agency's own publication or rule.

## Output

Write one JSON file (path given in your task): `{ "slug", "city", "state", "checked": "2026-11-24", "labor": {...},
"public_job_wage": {...}, "access_differences": [ {...} ], "restroom_rules": {...}, "sales_tax": {...},
"sources_read": [ {"url", "official": true/false, "note"} ], "to_confirm": [ ... ] }`. Every fact carries `url` and a
short verbatim `quote`, and each of the four blocks carries `confidence` (high = read on an official page; medium =
reliable secondary; low = not confirmed).

## Rules

- Official sources first. A secondary source is acceptable only when the official one blocks you: say so.
- Use WebSearch and WebFetch (load with ToolSearch "select:WebSearch,WebFetch"; if WebFetch isn't offered, use curl;
  read PDFs with curl into a new empty folder in your scratchpad, then `pdftotext`). At most 30 WebSearch calls.
- Research only: no sign-ins, no forms, no contact. Don't commit to git.
- Reply with a short summary per block: the headline facts, confidence, and what stayed open.
