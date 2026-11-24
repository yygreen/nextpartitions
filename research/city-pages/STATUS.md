# City buy pages: research run (started 2026-11-24)

At most 20 agents run at once. State agents use `STATE-BRIEF.md`, city agents `CITY-BRIEF.md`.
A state is done when `states/<ST>.json` exists; a city when `cities/<slug>.json` exists and
`site-content/pages/service-area_<slug>.md` was generated (`site-content/build/city-pages/gen_from_packs.py`).

State agents not yet launched: OR, RI, UT, SD, DC, KS.

City agent prompt: "Research and writing task for the city of <City>, <State> (slug: <slug>, state <ST>). Follow the brief at research/city-pages/CITY-BRIEF.md exactly... Write your result to research/city-pages/cities/<slug>.json. Finished examples: cities/tampa.json and service-area_tampa.md."

Cities done: fort-worth, san-diego, tampa.
City agents running: tacoma, atlanta.
Cities not yet launched (89): akron, albuquerque, anchorage, austin, bakersfield, baltimore, birmingham, boise, boston, buffalo, charleston, charlotte, chattanooga, chicago, cincinnati, cleveland, colorado-springs, columbia, columbus, corpus-christi, dayton, denver, des-moines, detroit, durham, el-paso, fresno, grand-rapids, greensboro, hartford, honolulu, indianapolis, jackson, jacksonville, kansas-city, knoxville, las-vegas, lexington, little-rock, long-beach, long-island, louisville, madison, memphis, mesa, milwaukee, minneapolis, mobile, modesto, nashville, new-orleans, new-york, newark, norfolk, oklahoma-city, omaha, ontario, orange-county, orlando, pensacola, philadelphia, phoenix, pittsburgh, portland, providence, raleigh, richmond, riverside, rochester, sacramento, salt-lake-city, san-antonio, san-francisco, san-jose, savannah, shreveport, sioux-falls, spokane, springfield, st-louis, st-petersburg, stockton, tallahassee, tucson, tulsa, virginia-beach, washington-dc, wichita, worcester.

Kentucky's office row is one total for the building: cells "N total" become `=N` in the stall table (build.mjs).
After new pages: `node city-maps.mjs && node build.mjs` in site-content/build, then publish the preview.
