# City buy pages: research run (started 2026-11-24)

At most 20 agents run at once. State agents use `STATE-BRIEF.md`, city agents `CITY-BRIEF.md`.
A state is done when `states/<ST>.json` exists; a city when `cities/<slug>.json` exists and
`site-content/pages/service-area_<slug>.md` was generated (`site-content/build/city-pages/gen_from_packs.py`).

State packs: all done.

Cities done (47): akron, atlanta, austin, baltimore, boise, charlotte, chicago, cincinnati, cleveland, colorado-springs, columbus, dayton, denver, detroit, durham, fort-worth, grand-rapids, greensboro, indianapolis, kansas-city, knoxville, las-vegas, louisville, memphis, minneapolis, nashville, new-orleans, newark, norfolk, omaha, phoenix, portland, providence, raleigh, sacramento, salt-lake-city, san-antonio, san-diego, savannah, shreveport, sioux-falls, springfield, st-louis, tacoma, tampa, tucson, washington-dc.
City agents running: oklahoma-city, tulsa, lexington, milwaukee, madison, san-francisco, el-paso, corpus-christi, virginia-beach, richmond, boston, new-york, buffalo, rochester, long-island, worcester, mesa, chattanooga, philadelphia, pittsburgh.
Not yet launched (27): albuquerque, anchorage, bakersfield, birmingham, charleston, columbia, des-moines, fresno, hartford, honolulu, jackson, jacksonville, little-rock, long-beach, mobile, modesto, ontario, orange-county, orlando, pensacola, riverside, san-jose, spokane, st-petersburg, stockton, tallahassee, wichita.

City agent prompt: "Research and writing task for the city of <City>, <State> (slug, state). Follow research/city-pages/CITY-BRIEF.md exactly... Write to research/city-pages/cities/<slug>.json. A finished example in the same state: ... County for tax and wage rates. Keep working files in a scratchpad subfolder named <slug>. Read the finished page top to bottom."

After new pages: `python3 city-pages/gen_from_packs.py && node city-maps.mjs && node build.mjs` in site-content/build, then publish the preview (files map of the new service-area_*.html). Preview last published with 46 new cities (through louisville).

Installer directory entries to update from this research: shreveport, akron, san-antonio (contractor rules); washington-dc (office name on the DLCP link).
