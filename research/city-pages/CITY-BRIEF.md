# Brief: city pack for one "Bathroom Partitions in [City]" page

Read /home/user/nextpartitions/research/city-pages/RULES.md first, then the Houston page it points to.

Then read what is already known (don't redo it):
- your city's entry in /home/user/nextpartitions/research/city-base/cities.json (centre, nearby cities, climate, carpenter wage);
- your state pack: /home/user/nextpartitions/research/city-pages/states/<ST>.json (toilet counts, fire test, access
  rules, restroom law, wage law, sales tax rules at state level, with page text);
- your state's entries in /home/user/nextpartitions/research/state-codes/states.json and
  /home/user/nextpartitions/research/state-licensing/states.json;
- your city's entry in /home/user/nextpartitions/research/local-rules/cities.json (contractor licence or registration rule).

Research these five things for the CITY:

1. **Codes the city enforces.** The building code and plumbing code in force in the city today (edition, local
   amendments, effective date), from the city's own adopted-codes page or ordinance. Any change already scheduled.
2. **Toilet counts in the city.** Whether the city amends the state's toilet-count table or its rules (urinals,
   split, small-occupancy exception, all-gender rooms). If it does, the amended text wins: redo the worked examples
   (office, restaurant, school at 50/100/200/400 occupants). If it doesn't, say so and keep the state's.
3. **Permits.** What the city's permit rules say about replacing or adding toilet partitions in an existing
   commercial restroom: the list of work exempt from a permit, quoted, and whether partitions are named. Don't
   decide the question yourself if the list doesn't; name the office to ask and its phone number if published.
4. **City restroom rules.** Any city ordinance or code amendment on single-user restroom signs or shared all-gender
   rooms that adds to the state rule.
5. **Money.** (a) The combined sales tax rate at a downtown address, with its parts (state, county, city,
   district) and the date it took effect, from the state revenue agency's rate page or lookup; any change already
   scheduled. (b) The carpenter rate on public building work in the city's county: the state's prevailing wage
   rate if the state has such a law (state pack), otherwise the federal Davis-Bacon building determination for the
   county from sam.gov (the JSON at https://sam.gov/api/prod/wdol/v1/wd/<number>/<modification> is readable; find
   the number through search): basic hourly rate, fringe, determination number and date. Note any city wage rule
   (living wage on city contracts) you find on the way; don't hunt for it.

## Output: /home/user/nextpartitions/research/city-pages/cities/<slug>.json

```
{ "slug": "...", "city": "...", "state": "OH", "checked": "2026-11-24",
  "codes": { "building": {"name","edition","local_amendments":true/false,"effective","url","quote"}, "plumbing": {...},
             "scheduled_change": null or {"what","date","url"}, "authority": "the office that enforces them, as the city names it", "confidence" },
  "fixtures": { "city_amends": true/false, "amendment": null or {"text","quote","url"}, "worked_examples": [ ... only if amended ... ], "confidence" },
  "permit": { "exempt_list_quote","url","partitions_named": true/false, "office","phone","confidence" },
  "restrooms_city": { "rule": null or "...", "quote","url","confidence" },
  "sales_tax": { "combined": 0.08, "parts": [{"name":"state","rate":0.0575}, ...], "effective","scheduled_change": null or {...},"url","quote","confidence" },
  "public_wage": { "county","basis":"state prevailing wage | Davis-Bacon","basic_hourly","fringe","determination","date","url","quote","city_rule": null or "...","confidence" },
  "page": {
     "meta": "under 155 characters: Commercial bathroom partitions delivered to [City] job sites. … (model on Houston's; mention what is local)",
     "lead": "one sentence like Houston's, naming four kinds of buildings typical of this city",
     "stall_bullet": "- **How many stalls:** [City] sets the number of toilets and urinals by how many people use the building. The table below shows what that means.  (adapt if the state, not the city, sets it)",
     "permit_bullet": "- **Permits:** ... ends with: You don't need a permit to buy partitions.",
     "restroom_bullet": "- **Single-user and all-gender restrooms:** the state pack's bullet, changed only if the city adds a rule",
     "confirm_office": "the office a buyer confirms rules with, e.g. 'the Houston Permitting Center'",
     "stalls_intro": "the state pack's text with the city's name where it fits, changed only if the city amends the counts",
     "stalls_rows": { "50": {"office","restaurant","school"}, "100": {...}, "200": {...}, "400": {...} },
     "stalls_after": "...",
     "install_rule": "2-3 sentences on who may install there: the city's contractor rule (local-rules entry) and the state's licence rule (state-licensing entry), as those files state them; end with: You don't need a permit to buy partitions.",
     "faq_install_extra": "one short sentence for the FAQ answer on installation: what the contractor needs there, or empty",
     "public_jobs_bullet": "- **Public jobs:** the state pack's sentence plus the local rate, e.g. For a carpenter on building work in Harris County that is $33.27 an hour plus $9.73 in benefits.",
     "sales_tax_bullet": "- **Sales tax:** 8.25% in Houston: 6.25% state, 1% city and 1% transit authority.",
     "buyers_extra": "- **[A buyer type typical of this city]:** what they choose, in the style of the Houston list (one bullet)",
     "sources": [ "- ...markdown bullets for everything city-level you used..." ],
     "official_names": "one line: the codes by their official names with editions and effective dates",
     "notes": [ "things to confirm by phone or browser before launch, each one sentence" ] },
  "sources_read": [ {"url","official":true/false} ], "to_confirm": [ "..." ] }
```

`stalls_rows` cell format: `W/M` (women's stalls / men's stalls; urinals optional), `W/M+U` (men's stalls plus U
urinals, where urinals are required or the split is fixed), `W/~T` (men's fixtures in total, split not stated).

Reply with a five-line summary: codes in force, whether the city amends the toilet counts, the permit answer,
tax rate and wage rate, and what stayed open.
