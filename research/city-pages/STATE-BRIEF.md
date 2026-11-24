# Brief: state pack for the city buy pages

Read /home/user/nextpartitions/research/city-pages/RULES.md first, then the Houston page it points to.
Your state's entry in /home/user/nextpartitions/research/state-codes/states.json names the building, plumbing and
accessibility codes in force (checked 2026-11-23) with URLs; start there. Your state's entry in
/home/user/nextpartitions/research/state-licensing/states.json covers contractor licensing (don't redo it).

Research these six things at STATE level (a later agent handles each city's own amendments):

1. **Toilet counts.** Which table of the state's adopted code sets the minimum number of toilets (water closets) and
   urinals (plumbing code Table 403.1 / 422.1, or building code Table 2902.1), in the adopted edition, with state
   amendments. The rows, verbatim, for (a) business/office, (b) restaurant (assembly A-2), (c) educational (K-12).
   The rules that change the count: how occupants split between sexes, how fractions round, how many toilets
   urinals may replace (or whether urinals are required), any small-occupancy exception for separate rooms, and the
   floor area per occupant for an office, a restaurant dining room and a classroom. Then worked examples for
   office, restaurant and school at 50, 100, 200 and 400 occupants, split 50/50: women's toilets, men's toilets,
   and how many of the men's may or must be urinals, with the arithmetic. If the state has no statewide code, say
   so and give the model code most cities there use, if an official page says which.
2. **Fire test for solid plastic (HDPE) partitions.** Whether the state's building code requires HDPE or
   polypropylene toilet partitions to pass a room-corner fire test (in the model IBC this sits in the interior
   finish chapter, Chapter 8). Quote the section as adopted in the state. If the state's edition has no such rule,
   say so.
3. **Where the state's accessibility rules for toilet stalls go further than the federal 2010 ADA Standards**
   (sections 213 and 604: wheelchair and ambulatory stalls, doors, toe clearance, grab bars, children's stalls,
   restroom door signs). Only real differences, each with the state text and the federal text. If the state uses
   ICC A117.1 through its building code, say which edition and list what that edition changes for stalls only if
   you can read it. Also note any state plan-review or registration step for accessibility.
4. **Single-user and all-gender restrooms.** What state law and the state code require for (a) single-user
   restrooms (open to all genders? signs?), (b) shared all-gender rooms (allowed? what the stalls must be), and
   (c) any state law restricting who may use which restroom in certain buildings. Quote the statute or section.
5. **Wages on public jobs.** Whether the state has a prevailing wage law for public construction (schools, city
   buildings), who sets the rates, any dollar threshold, and where the rates are published. If none, say that only
   the federal Davis-Bacon Act applies, on federally funded work.
6. **Sales tax.** The state rate. Whether tax applies to (a) partitions sold and shipped without installation by
   an out-of-state seller (remote seller / use tax rule, and whether freight is taxed), (b) installation labor on a
   commercial remodel when billed separately, (c) a contractor's furnish-and-install contract for work that becomes
   part of the building. Quote the revenue agency's own publication or rule.

## Output: /home/user/nextpartitions/research/city-pages/states/<ST>.json

```
{ "state": "OH", "state_name": "Ohio", "checked": "2026-11-24",
  "fixtures": { "governing_table": {"code","edition","table","url","quote"}, "cities_may_amend": true/false/null,
     "rows": { "office": {"row_label","wc_male","wc_female","urinals","quote","url"}, "restaurant": {...}, "school": {...} },
     "rules": { "sex_split","rounding","urinal_substitution","small_occupancy_exception","occupant_load": each {"text","quote","url"} },
     "worked_examples": [ {"occupancy":"office","occupants":100,"wc_female":N,"wc_male_total":N,"urinals_allowed":N or null,"urinals_required":N or null,"how":"..."} ],
     "confidence": "high|medium|low" },
  "hdpe_fire": { "required": true/false/null, "section","quote","url","confidence" },
  "access": { "state_standard","differences":[{"point","state","federal","state_url","quote"}], "process": "...", "confidence" },
  "restrooms": { "single_user": {"rule","quote","url"}, "all_gender_shared": {...}, "use_restrictions": {...}, "confidence" },
  "public_wage": { "has_state_law": true/false, "law","threshold","rates_url","quote","url","confidence" },
  "sales_tax": { "state_rate": 0.0575, "shipped_goods": {"rule","quote","url"}, "freight_taxed": true/false/null,
     "install_labor": {...}, "furnish_and_install": {...}, "agency": "Ohio Department of Taxation", "confidence" },
  "page": {
     "stalls_intro": "2-4 sentences: how the state counts toilets (by the most people the building is designed to hold at one time, half men, half women), that every toilet needs a stall, and how urinals count there. Use 'Ohio's rules' not code names.",
     "stalls_rows": { "50": {"office":"W/M or W/M+U or W/~T", "restaurant":"...", "school":"..."}, "100": {...}, "200": {...}, "400": {...} },
     "stalls_after": "1-2 sentences of caveats specific to the state's table (optional, else empty)",
     "capacity": "one sentence: floor area per person for an office, a restaurant dining room and a classroom",
     "fire_bullet": "- **Fire safety:** ...",   (omit by setting null if there is no such rule)
     "access_bullet": "- **Wheelchair access:** ... (federal law plus what the state adds: its own rules, a review step)",
     "state_extra_bullet": "- **[State] extras:** ... or - **[State] and federal stall rules match:** ...",
     "restroom_bullet": "- **Single-user and all-gender restrooms:** ...",
     "public_jobs": "one sentence on the state's wage law for public jobs (the city agent adds the local rate)",
     "tax_install_bullet": "- **Tax on installation:** ...",
     "tax_ship_bullet": "- **Buying without installation:** partitions shipped to {city} ...  (keep the literal {city})",
     "tax_confirm": "your accountant or the Ohio Department of Taxation",
     "sources": [ "- ...markdown bullets..." ],
     "official_names": "one line listing the formal names: accessibility standard, building code and plumbing code with editions" },
  "sources_read": [ {"url","official":true/false} ], "to_confirm": [ "..." ] }
```

`stalls_rows` cell format (it feeds a table): `W/M` = women's stalls / men's stalls where urinals are optional and
you show toilets only; `W/M+U` = women's stalls / men's stalls plus U urinals where the code REQUIRES urinals or the
split is fixed; `W/~T` = women's stalls / men's fixtures in total where the split between stalls and urinals isn't
stated. Example from Houston: `"100": {"office": "2/1+1", ...}`. If urinals are optional, show the men's toilets as
stalls (`W/M`) and explain the substitution in `stalls_intro`.

Reply with a five-line summary: toilet-count table and confidence, anything unusual in the state, and what's open.
