# Installer keyword cluster (Semrush, US, 2026-10-14)

- `semrush-toilet-partition-installer_us_2026-10-14.csv`: raw export, 147 keywords.
- `keywords-mapped-to-pages.csv`: the same keywords, each assigned a target page and suggested URL.
- `dfw-variants-2026-11-05.csv`: DataForSEO (Google Ads) search volume for 7 seed terms × place-name variants, in four search locations. See below.

## Groups

| Group | Keywords | Searches/mo | Difficulty | Target page |
|---|---|---|---|---|
| Installed cost (year and word-order variants) | 83 | ~1,110 | 0–2 | **Main cost guide:** "Commercial toilet partition cost installed (2026)" |
| How to install (general, ceiling hung, hardware, problems) | 23 | ~290 | 3–5 | **Main how-to guide:** "How to install toilet partitions", with sections for ceiling hung, hardware and common problems |
| Brand install instructions (Hadrian, Bobrick, Metpar, ASI, Bradley, Scranton…) | 25 | ~110 | — | One "Installation instructions by brand" page |
| Installers, near me, specific cities | 13 | ~140 | 1–12 | Installer directory hub and area pages |
| Supply plus installation, professional installation | 3 | ~50 | — | Configurator installation step or a short landing page |

## Notes

- **One cost page, not one per variant.** The year and word-order variants are one question. Use one permanent page with the current year in the title and refresh it every January.
- **Many cost searches look machine-generated:**
  - The trend data shows a sudden spike, then nothing.
  - Variants ending in "… source" and "homewyse …" read like queries from AI assistants and research bots.
  - So the visitor numbers may be inflated, but it means AI tools are hunting for a citable source on installed cost.
  - Answer that with real rate-card data, a source and a "last updated" date.
- **"Toilet partition installers near me" is the most valuable search.** It costs $6.88 a click in ads, Google shows a map pack, and difficulty is 12. It's the target for the directory's national hub and area pages.
- **City mentions point to demand:**
  - Tampa appears in 5 variants, including "installers only Tampa", which matches the install-only model. It's the next area-page candidate.
  - San Antonio already has a card on the Texas hub.
  - Levittown (NY), Hillside (NJ) and North Dakota also appear.
- **Brand instructions:** cover the brands Next Partitions sells, and link each instruction PDF to the matching hardware. Hadrian isn't sold, so either skip it or cover it as "compatible hardware".
- **Cross-links:**
  - Cost guide → DFW price table, configurator (with installation added), installer directory.
  - How-to guide → licensing articles (`../installer-regulations.md`), "hire an approved installer" pages, hardware pages.

## DFW place-name test (DataForSEO, 2026-11-05)

Source: DataForSEO Google Ads search volume, language English, average of the 12 months Nov 2025–Oct 2026. Searched from four locations: United States (2840), the Dallas–Ft. Worth DMA (200623), Dallas city (1026339) and Fort Worth city (1026411).

Seeds: toilet partition installers, bathroom partition installers, restroom partition installation, toilet partitions, bathroom partitions, commercial bathroom partitions, bathroom stall installers. Each with no place name, "dallas", "dallas tx", "fort worth", "fort worth tx", "dallas fort worth", "dfw" (as a suffix, and "dallas/fort worth/dfw" as a prefix) and "near me".

Rows with `row_type = total` sum the 7 seeds for one variant in one location.

| Variant | US | DFW DMA |
|---|---|---|
| No place name | 8,430 | 310 |
| near me | 1,090 | 70 |
| Dallas / Dallas TX | 20 | 20 |
| Fort Worth / Fort Worth TX | 0 | 0 |
| Dallas Fort Worth | 0 | 0 |
| DFW | 0 | 0 |

How to read it:

- Google Ads reports anything under ~10 a month as 10, and 0 means below its threshold, not "never".
- Google groups close variants, so "toilet partitions dallas", "toilet partitions dallas tx" and "dallas toilet partitions" are the same 10 searches, not 30.
- People in the DFW area mostly search without a place name (310/mo in the DMA) and Google localises the results. Place names in titles matter less than being an indexable local page with an address and area served.
- Conclusion: "DFW" and "Dallas Fort Worth" don't beat the city names. Keep the two areas (Dallas, Fort Worth) and use "Dallas–Fort Worth" only as a descriptive phrase on the Texas hub.
