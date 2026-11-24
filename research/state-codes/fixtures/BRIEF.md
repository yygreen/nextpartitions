# Brief: minimum toilet counts under a city's own plumbing code

For each "Bathroom Partitions in [City]" page on nextpartitions.com we publish a small table: how many toilets
(water closets) and urinals the city's adopted code requires for an office, a restaurant and a school of a few
sizes, and so how many stalls a buyer needs. The numbers must come from the code text itself, read by you, not
from memory. Codes differ: IPC-based codes give ratios, UPC-based codes give tiers, and cities and states amend them.

The code in force in your city is named in /home/user/nextpartitions/research/state-codes/cities-first-5.json
(read your city's entry first; date checked 2026-11-24).

## What to find, for your city

1. **Which table governs minimum fixture counts** for commercial buildings there: the plumbing code's table (IPC
   Table 403.1, UPC/CPC Table 422.1) or the building code's (IBC/state Chapter 29 Table 2902.1), in the adopted
   edition. Some states move fixture counts out of the plumbing code (Washington uses its building code). Say which
   and quote the sentence that says so.
2. **Local or state amendments** to that table or its rules (the city's amendment document, the state's version of the
   table). If the city amends it, the amended text wins.
3. **The rows for three occupancies**, verbatim: (a) business / office; (b) restaurant (assembly, A-2); (c)
   educational (K-12 school; note if elementary and secondary differ). For each: water closets for males and
   females, urinals, and lavatories, exactly as the table states them (ratios or tiers).
4. **The rules that change the count**: how the occupant load is split between sexes (usually 50/50), how fractions
   round, how many water closets urinals may replace, any separate-facilities exception for small occupancies, and
   how the occupant load itself is found (which table gives square feet per occupant) — quote each.

## Output: write JSON to the file named in your task

```
{ "slug": "...", "city": "...", "checked": "2026-11-24",
  "governing_table": { "code": "...", "edition": "...", "table": "...", "url": "...", "quote": "..." },
  "amendments": { "found": true/false, "text": "...", "url": "...", "quote": "..." },
  "occupancies": {
    "office":     { "row_label": "...", "wc_male": "...", "wc_female": "...", "urinals": "...", "lavatories": "...", "quote": "...", "url": "..." },
    "restaurant": { ... },
    "school":     { ... } },
  "rules": { "sex_split": {"text": "...", "quote": "...", "url": "..."}, "rounding": {...}, "urinal_substitution": {...},
             "small_occupancy_exception": {...}, "occupant_load": {...} },
  "worked_examples": [ { "occupancy": "office", "occupants": 100, "male": 50, "female": 50,
      "wc_male": N, "urinals_male_min": N, "wc_female": N, "how": "show the arithmetic from the quoted rule" }, ... ],
  "confidence": "high | medium | low",
  "sources_read": [ { "url": "...", "official": true/false } ],
  "to_confirm": [ "..." ] }
```

Worked examples: office, restaurant and school at 50, 100, 200 and 400 occupants each, split 50/50.

## Rules

- Read the table itself. Official sources first: the city's or state's own published code or amendment PDF, the
  state code council, ICC's free code viewer (codes.iccsafe.org) and IAPMO's free viewer (epubs.iapmo.org) for the
  model code. UpCodes (up.codes) is an acceptable secondary source when the official viewer blocks you: say so and
  mark the entry medium. If you can't read a row, leave it null and say why; never fill it from memory.
- Every value needs the URL you read it on and a short verbatim quote.
- Use WebSearch and WebFetch (load with ToolSearch "select:WebSearch,WebFetch"; if WebFetch isn't offered use curl;
  for PDFs, download with curl into a new empty folder in your scratchpad and read them with `pdftotext`). At most
  25 WebSearch calls.
- Research only: no sign-ins, no forms. Don't commit to git.
- Reply with a short summary: which table governs, whether amendments change it, confidence, and what's open.
