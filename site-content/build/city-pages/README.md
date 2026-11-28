# How the first city buy pages were written

`gen_cities.py` wrote the Los Angeles, Miami, Dallas and Seattle pages from the research (Houston was written by
hand first), and `add_city_data.py` added the 2026-11-24 city data to all five. They're kept as a record and a
starting point for the next cities. **The page files in `../../pages/service-area_*.md` are the source of truth:**
rerunning `gen_cities.py` overwrites those four pages, so edit the pages, not these scripts, unless you mean to
regenerate.
