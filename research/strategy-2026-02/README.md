# SEO and website strategy, February 2026

The original strategy for the site, prepared in February 2026 when the business was called AMP Partitions (old domain shopprivy.us). The live nextpartitions.com follows its architecture almost URL for URL.

## Files

| File | What it is |
|---|---|
| `SEO__Website_Strategy_Report.pdf` / `.docx` | The 56-page report (same content in both) |
| `Keyword_List_1__General.xlsx` | 168 keywords, ~85,780 searches/mo (products, materials, hardware, guides, industries) |
| `Keyword_List_2__Local_Landing_Pages.xlsx` | 170 city and "near me" keywords, ~3,150/mo |
| `Keyword_List_3__Local_Installers.xlsx` | 30 installer keywords, ~630/mo |
| `Keyword_List_4__Manufacturers.xlsx` | 32 brand keywords, ~4,270/mo |
| `12_Months_Content_Calendar_Blog.xlsx` | 51 blog posts with keywords, word counts and internal links |
| `12_Months_Content_Calendar_Local_Landing_Pages.xlsx` | 100 city pages (`/service-area/[city]/`) by rollout month, plus a keyword-to-city reference |
| `Technical_SEO_Developer_Checklist.xlsx` | 53 developer items from section 9 of the report |

## Status on 2026-10-15 (about month 8 of the plan)

Checked against the live sitemap (46 URLs) and the rendered pages.

| Planned | When | Live |
|---|---|---|
| Launch pages: materials, mounting styles, hardware, brands, guides, quote form, about/FAQ/contact | Launch | Done, plus Bobrick, Metpar and Ammco brand pages |
| `/partitions/wood/`, `/urinal-screens/` | Launch | Missing (404) |
| Industry pages | Months 1–3 | Done (community centers instead of churches) |
| 3 pre-launch blog posts, then 4 a month | Launch onward | None. `/blog` shows "coming soon" |
| 30 city pages (Houston, LA, Miami, Dallas, Seattle first) | Months 1–6 | None. `/service-area` is a single "we ship to all 50 states" page |
| Installer outreach, 2–3 per city | Months 1–6 | Every row "Not started" in the city calendar |
| Manufacturer directory listings | Month 1 | Unknown: ask Abe |

### Technical checklist spot check (`/partitions/phenolic`)

Good: server-rendered HTML with real `<a href>` links, H1, self-referencing canonical, BreadcrumbList and Product JSON-LD, HTTP→HTTPS 301, HSTS, nosniff, Referrer-Policy, sitemap in robots.txt.

To fix:
- `www` redirects with **302**, should be 301 (item 3).
- Trailing-slash URLs redirect with **307**, should be 301/308 (item 1).
- Mixed-case URLs (`/Partitions/Phenolic`) return 200 instead of redirecting. The canonical covers it, but a redirect is cleaner (item 3).
- Sitemap has no `<lastmod>` (item 13).
- Fonts load from the Google Fonts CDN; the checklist asks for self-hosted (item 21).
- GA4 is hardcoded `gtag.js`, not loaded through Tag Manager (items 45, 48).
- No `X-Frame-Options` header (item 43).

## How this fits the installer directory work

- **City pages are buyer pages first.** The report's city pages target "bathroom partitions [city]", with an installer section below. Our installer directory becomes that section, not a separate site area.
- **URLs:** use the live patterns. Texas hub at `/service-area/texas/` (the report plans state pages later). The DFW prototype maps to the report's `/service-area/dallas/` (#4, month 1). Fort Worth is its own page later (#68). Texas has 4 of the first 30 cities: Houston #1, Dallas #4, San Antonio #15, Austin #28.
- **Installer keywords:** list 3 uses "bathroom partition installer" wording: "bathroom partition installers near me", "bathroom partition installers", "bathroom partitions installers near me" and "commercial bathroom partition installers near me" at 140/mo each. Our October Semrush pull (`../installer-keywords/`) used "toilet partition" wording and has no overlap. The directory hub should target both.
- **Listing for a backlink:** the report offers installers a free listing in exchange for a link. We keep vetting and the listing agreement. The "Approved installer" badge links back but is optional, never a condition of listing (a required link swap is a Google link-scheme risk).
- **Blog posts that overlap our pages:**
  - #2 "How Much Do Bathroom Partitions Cost? (2026 Guide)": merge with our installed-cost guide into one permanent page.
  - #13 "How to Install Floor-Mounted Bathroom Partitions" and #15 "Common Toilet Partition Installation Issues": fold into the how-to-install guide.
  - #24 "Rules and Regulations for Public Restrooms (State-by-State)": cross-link with `../installer-regulations.md`.
- List 1 also has 10 installation and cost keywords (~260/mo, e.g. "how much does it cost to install bathroom partitions", $12.31 CPC). They go to the same cost and how-to pages.
