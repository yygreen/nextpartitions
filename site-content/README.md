# Site content: broken and thin pages

Month-one work from the September 2026 proposal ("Your broken pages fixed, six industry pages checked for accuracy, thin-page rework begun with hardware and mounting styles first"). Each file in `pages/` is a finished page, ready to paste into the live site (Lovable project `commercial-partitions`, Marc Feder), or to apply as a pull request once we have the repo here.

- `current/`: the text of every page in the sitemap as it was on 2026-10-26, for comparison. Generated from the live HTML; don't edit.
- `pages/`: the new or expanded pages, one file per URL, in the format below.
- `preview/`: every page in `pages/` built as a finished HTML page in the live site's layout and stylesheet (header, hero, content with side card, Explore More, footer), with its title, meta, canonical and structured data. Open `preview/index.html`. Rebuild with `cd build && npm install && npm run build` after changing a page.
- `industry-check.md`: the six industry pages checked for accuracy (corrections only, no rewrite).

## Status on 2026-10-26

| Problem | Pages | Plan |
|---|---|---|
| Broken | `/guides` (blank), `/blog` ("Coming Soon"), `/blog/news` (in the sitemap, shows a 404) | Guides hub written; blog opens with its first posts; `/blog/news` comes out of the sitemap |
| Thin (under 400 words), first batch | `/hardware` and its 5 sub-pages, `/mounting-styles` and its 4 sub-pages | Expanded, keeping what's right on the current page |
| Thin, later | about, contact, FAQ, homepage, `/industries`, `/brands`, Hadrian, three short guides | Next batches |

## Writing rules

1. **Expand, don't replace.** Keep what the current page gets right (structure, CTAs, the explore-more links). Fix what's wrong and say so in the file's corrections list.
2. **Every fact has a source.** Dimensions, materials, code rules and hardware specs come from the current site (checked) or a primary source: manufacturer spec sheets and installation guides, the 2010 ADA Standards for Accessible Design. List them under "Sources" with the date checked. If you can't confirm a claim, leave it out.
3. **No made-up numbers.** No prices (Abe's price list isn't in yet), no years in business, no customer counts, no testimonials, no lead times beyond what the site already promises.
4. **One quote promise:** "Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours." Never any other quote time.
5. **The configurator is a quote request.** "Get a quote" (`/get-a-quote`), never "order", "buy now" or "checkout" for it.
6. **Next Partitions sells partitions; it doesn't install them.** Don't promise installation. The installer directory isn't public yet, so don't mention it.
7. **Brands carried:** Bobrick, ASI Global, Scranton Products, Bradley, Metpar, Ammco, Hadrian. Name a brand's product line only if the brand's own site confirms it. Don't add new "authorized dealer" claims.
8. **Accessibility:** keep the site's ADA disclaimer wherever ADA dimensions appear, and cite the section of the 2010 Standards (e.g. 604.8).
9. **Plain, specific US English** for facilities managers, contractors and architects. Short paragraphs, real headings, tables where they help. None of: discover, unlock, delve, dive into, elevate, seamless, game-changer.
10. **Keywords from the research** (`research/strategy-2026-02/Keyword_List_1__General.xlsx`, which arrives in the repo with the installer directory branch, `claude/confident-bell-4hrv6t`): the page's main keyword in the title, H1 and first paragraph; variants where they read naturally. No stuffing.

## Page file format

```
---
url: /hardware/hinges
title: <title tag, under 60 characters>
meta: <meta description, 140–160 characters>
h1: <H1>
primary_keyword: <keyword (volume/mo)>
secondary_keywords: [..]
words: <approximate body word count>
---

<page body in Markdown: H2/H3 headings, paragraphs, tables, lists, CTAs as links>

## FAQ        (3–6 questions; goes into FAQPage structured data)

## Sources    (links, each "checked 2026-10-26")

<!-- For Marc -->
## Corrections to the current page
## Implementation notes   (structured data, internal links to add elsewhere, images wanted)
```
