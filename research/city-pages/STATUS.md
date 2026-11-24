# City buy pages: research run (started 2026-11-24)

At most 20 agents run at once. State agents use `STATE-BRIEF.md`, city agents `CITY-BRIEF.md`.
A state is done when `states/<ST>.json` exists; a city when `cities/<slug>.json` exists and
`site-content/pages/service-area_<slug>.md` was generated (`site-content/build/city-pages/gen_from_packs.py`).

State packs: all 43 done (39 researched 2026-11-24, plus TX, CA, FL, WA from the finished pages).

**Run paused 2026-11-24: the account's model usage limit was reached (resets 2026-11-29 16:00 UTC).** Agents stopped mid-work.

Cities done and in the preview (23): atlanta, boise, charlotte, cleveland, columbus, denver, detroit, fort-worth, grand-rapids, indianapolis, kansas-city, las-vegas, nashville, new-orleans, newark, phoenix, providence, raleigh, salt-lake-city, san-diego, tacoma, tampa, washington-dc.
Drafts (pack written, agent stopped before its final check; listed in drafts.txt, no page generated): durham, shreveport, sioux-falls, tucson.
Stopped early, restart from scratch or resume (15): chicago, omaha, greensboro, cincinnati, st-louis, savannah, memphis, colorado-springs, akron, dayton, chattanooga, knoxville, springfield, mesa, norfolk.
Not yet launched (52): albuquerque, anchorage, austin, bakersfield, baltimore, birmingham, boston, buffalo, charleston, columbia, corpus-christi, des-moines, el-paso, fresno, hartford, honolulu, jackson, jacksonville, lexington, little-rock, long-beach, long-island, louisville, madison, milwaukee, minneapolis, mobile, modesto, new-york, oklahoma-city, ontario, orange-county, orlando, pensacola, philadelphia, pittsburgh, portland, richmond, riverside, rochester, sacramento, san-antonio, san-francisco, san-jose, spokane, st-petersburg, stockton, tallahassee, tulsa, virginia-beach, wichita, worcester.

City agent prompt: "Research and writing task for the city of <City>, <State> (slug, state). Follow research/city-pages/CITY-BRIEF.md exactly... Write to research/city-pages/cities/<slug>.json. A finished example in the same state: ... County for tax and wage rates. Keep working files in a scratchpad subfolder named <slug>. Read the finished page top to bottom."

After new pages: `python3 city-pages/gen_from_packs.py && node city-maps.mjs && node build.mjs` in site-content/build, then publish the preview (files map of the new service-area_*.html).
