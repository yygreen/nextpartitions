# City buy pages: research run (started 2026-11-24)

At most 20 agents run at once. State agents use `STATE-BRIEF.md`, city agents `CITY-BRIEF.md`.
A state is done when `states/<ST>.json` exists; a city when `cities/<slug>.json` exists and
`site-content/pages/service-area_<slug>.md` was generated (`site-content/build/city-pages/gen_from_packs.py`).

State packs: all done except KS (running).

City agent prompt: "Research and writing task for the city of <City>, <State> (slug, state). Follow research/city-pages/CITY-BRIEF.md exactly... Write to research/city-pages/cities/<slug>.json. A finished example in the same state: ... County for tax and wage rates. Keep working files in a scratchpad subfolder named <slug>. Read the finished page top to bottom."

Cities done (17): atlanta, charlotte, columbus, denver, detroit, fort-worth, indianapolis, kansas-city, nashville, new-orleans, newark, phoenix, providence, raleigh, san-diego, tacoma, tampa.
City agents running: denver, chicago, omaha, boise, newark, salt-lake-city, las-vegas, tucson, cleveland, sioux-falls, grand-rapids, washington-dc, shreveport, memphis, cincinnati, st-louis, savannah, durham, greensboro.
Cities not yet launched (60): akron, albuquerque, anchorage, austin, bakersfield, baltimore, birmingham, boston, buffalo, charleston, chattanooga, colorado-springs, columbia, corpus-christi, dayton, des-moines, el-paso, fresno, hartford, honolulu, jackson, jacksonville, knoxville, lexington, little-rock, long-beach, long-island, louisville, madison, mesa, milwaukee, minneapolis, mobile, modesto, new-york, norfolk, oklahoma-city, ontario, orange-county, orlando, pensacola, philadelphia, pittsburgh, portland, richmond, riverside, rochester, sacramento, san-antonio, san-francisco, san-jose, spokane, springfield, st-petersburg, stockton, tallahassee, tulsa, virginia-beach, wichita, worcester.

After new pages: `python3 city-pages/gen_from_packs.py && node city-maps.mjs && node build.mjs` in site-content/build, then publish the preview (files map of the new service-area_*.html).
