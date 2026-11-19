# Installer prospects, nationwide

Businesses that may install toilet partitions in each of the 99 directory areas, for the agency's outreach (in Next Partitions' name). Research only: nobody here has been contacted, and nobody is listed in the directory until they apply and pass vetting.

## How it's built

A workflow runs three kinds of agents over a batch of areas:

1. **Finder**, one per area: manufacturer dealer and installer locators, The Blue Book, BuildingConnected and Procore public profiles, web search, and the Google, Yelp and BBB listings that search turns up. 10 to 25 candidates, with a source for each.
2. **Checker**, one per area, separate from the finder: reads each business's own site and listings and gives a verdict (strong, possible, reject). It also notes partition work, commercial focus, whether the business sells partitions itself (a buy-around risk), reviews and contact details, and adds strong businesses the finder missed.
3. **License checker**, one per state: looks up each non-rejected business on the official state or city registry from `research/state-licensing/states.json` and `research/local-rules/cities.json`.

Each workflow result is saved in `raw/batch-<n>.json`; `python3 build.py` merges them into:

- `<area>.json`: every candidate for the area, rejected ones included, ranked by score.
- `prospects.csv`: the outreach list (strong and possible only), one row per business and area. `also_in_areas` shows businesses that serve several areas.
- `gaps.md`: areas with fewer than 3 strong candidates.

## Score (out of 100)

Partition work shown 40 (likely 20) · commercial 20 (mostly 15) · registration confirmed 15 · reviews 4.5+ from 10+ 10 · in the area 10 (nearby 5) · doesn't sell partitions itself 5.

## Limits

- Insurance can't be checked online; it stays a vetting item.
- Registries that block automated lookups are marked `not_online` and go on the phone list.
- Without a Google Places key (Abe's Google Cloud account), candidates come from search results rather than a full map sweep.
- Contact details are public business details only, and base city only, never a street address.
