# City buy pages: research run (started 2026-11-24)

At most 20 agents run at once. State agents use `STATE-BRIEF.md`, city agents `CITY-BRIEF.md`.
A state is done when `states/<ST>.json` exists; a city when `cities/<slug>.json` exists and
`site-content/pages/service-area_<slug>.md` was generated (`site-content/build/city-pages/gen_from_packs.py`).

State agents not yet launched (2026-11-24): CT, HI, IN, MS, NV, AR, MN, NJ, NE, OR, RI, UT, SD, DC, KS.
City agents launched as pilots: fort-worth, san-diego, tampa, tacoma. All other cities: not yet launched.
