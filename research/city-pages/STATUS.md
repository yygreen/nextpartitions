# City buy pages: research run (started 2026-11-24)

At most 20 agents run at once. State agents use `STATE-BRIEF.md`, city agents `CITY-BRIEF.md`.
A state is done when `states/<ST>.json` exists; a city when `cities/<slug>.json` exists and
`site-content/pages/service-area_<slug>.md` was generated (`site-content/build/city-pages/gen_from_packs.py`).

State packs: all done. City packs: all 94 done (akron, albuquerque, anchorage, atlanta, austin, bakersfield, baltimore, birmingham, boise, boston, buffalo, charleston, charlotte, chattanooga, chicago, cincinnati, cleveland, colorado-springs, columbia, columbus, corpus-christi, dayton, denver, des-moines, detroit, durham, el-paso, fort-worth, fresno, grand-rapids, greensboro, hartford, honolulu, indianapolis, jackson, jacksonville, kansas-city, knoxville, las-vegas, lexington, little-rock, long-beach, long-island, louisville, madison, memphis, mesa, milwaukee, minneapolis, mobile, modesto, nashville, new-orleans, new-york, newark, norfolk, oklahoma-city, omaha, ontario, orange-county, orlando, pensacola, philadelphia, phoenix, pittsburgh, portland, providence, raleigh, richmond, riverside, rochester, sacramento, salt-lake-city, san-antonio, san-diego, san-francisco, san-jose, savannah, shreveport, sioux-falls, spokane, springfield, st-louis, st-petersburg, stockton, tacoma, tallahassee, tampa, tucson, tulsa, virginia-beach, washington-dc, wichita, worcester); with the five hand-written pages that is all 99 cities.

Run finished 2026-11-24. Every page's "Implementation notes" lists what to confirm by browser or phone before launch.

Rebuild: `python3 city-pages/gen_from_packs.py && node city-maps.mjs && node build.mjs` in site-content/build, then publish the preview.

Installer directory entries to update from this research (research/local-rules/cities.json): shreveport, akron, san-antonio, oklahoma-city, new-york, albuquerque, long-island (contractor rules); lexington, worcester (now confirmed); long-beach, pittsburgh, anchorage (dead source links); washington-dc (office name on the DLCP link).

Cities with no nearby-city list in the area data (section names none or one): albuquerque, anchorage, bakersfield, colorado-springs, columbia, corpus-christi, el-paso, honolulu, jacksonville, mobile, pensacola, richmond, rochester, shreveport, sioux-falls, springfield, tallahassee, wichita.
