# Fixes for Marc: broken pages (checked 2026-10-26)

The content for each fix is in `pages/`, and `preview/` shows each page built in the site's own layout and classes (open `preview/index.html`), with the structured data already in the page head. These are the code changes around it.

## 1. `/guides` is blank

What Google gets: status 200, the menu and footer, nothing in `<main>`, the site-wide default title ("Next Partitions — Commercial Bathroom Partitions & Accessories"), no canonical, no description. The four guide pages under it render fine.

Likely cause: `/guides` is a layout route (`guides.tsx` rendering `<Outlet/>`) with no index route under it, so the URL itself renders an empty outlet.

Fix: add the index route (TanStack Router: `src/routes/guides/index.tsx`, or `guides.index.tsx` with flat routes) that renders the hub in `pages/guides.md`, with its own `head()`: the title and meta from that file, canonical `https://nextpartitions.com/guides`, BreadcrumbList (Home › Guides) and an ItemList of the four guides. It must render on the server like the other pages.

## 2. `/blog` says "Coming Soon"

Replace the "Coming Soon" block with the blog index in `pages/blog.md` and add the two posts as routes:

- `/blog/what-are-bathroom-partitions-made-of` (`pages/blog_what-are-bathroom-partitions-made-of.md`)
- `/blog/why-do-bathroom-stalls-have-gaps` (`pages/blog_why-do-bathroom-stalls-have-gaps.md`)

Each post: server-rendered, own title, meta description and canonical; `Article` structured data (headline, datePublished, dateModified, author Next Partitions, publisher with logo); `FAQPage` for the FAQ section; BreadcrumbList (Home › Blog › post). Publish dates are set when you publish.

## 3. `/blog/news` is in the sitemap but returns 404

Remove it from the sitemap (or build the page, but there's nothing to put on it yet). Add the two new posts and `/guides` (once it renders) to the sitemap, with `<lastmod>`.

## 4. `/products` shows "No products found" (yours, in progress)

You're building the catalogue. The SEO side, for when you're ready: every product needs its own URL, rendered on the server with the product in the first HTML, `Product` structured data, and a sitemap entry. We'll send the full requirements and check the pages once they're live.

## 5. The hardware and mounting-style pages

The new text replaces the body of each page and keeps the existing layout, CTAs and the "Explore more" links. Each file lists its FAQ (add `FAQPage` structured data), the internal links to add on other pages, and the images it could use.

## 6. Drawings

Technical drawings (SVG) in `design/diagrams/`, placed in the pages as `/images/diagrams/<name>.svg`: copy the folder to `public/images/diagrams/`. Each has its alt text in the page and its numbered key as a list right under it. They follow `design/design-language.md` (specimen: `design/design-language.html`); `design/diagrams.mjs` regenerates them.

## 7. One quote promise everywhere (checked 2026-10-27)

The site gives buyers five different answers to "how fast do I get a quote?". The promise Abe set is:

> Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours.

Replace every quote-time line below with it, or with the short form "Standard quotes in 2 business hours, custom in 24–48 hours" where space is tight (buttons, stat tiles). Keep "one business day" only for replies to non-quote messages on `/contact`.

| Page | Current text | Replace with |
|---|---|---|
| `/` meta description | "Instant pricing on standard setups. Custom quotes in 24–48 hours." | "Standard configurations quoted within 2 business hours; custom projects within 24–48 hours." |
| `/` hero | "Instant pricing on standard setups. Instant quote available." | "Standard configurations quoted within 2 business hours." |
| `/` quote steps | "Answer a few questions and get instant pricing. Custom quotes delivered in 24–48 hours." | The full promise |
| `/` "Get Instant Pricing" block | Heading "Get Instant Pricing"; "Standard configurations get instant pricing. Complex projects receive a custom quote with shop drawings within 24–48 hours." | Heading "Get a Quote"; "Standard configurations are quoted within 2 business hours; custom projects, with shop drawings, within 24–48 hours." |
| `/` closing CTA | "Configure your partitions now and get instant pricing. Custom quotes with shop drawings delivered within 24–48 hours." | "Configure your partitions now and request a quote. Standard configurations are quoted within 2 business hours; custom projects, with shop drawings, within 24–48 hours." |
| `/get-a-quote` meta | "…to get instant pricing or a custom quote in 24–48 hours." | "…to request a quote. Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours." |
| `/configurator` meta | "…for an instant price or a custom quote." | "…and request a quote. Standard configurations are quoted within 2 business hours." |
| `/contact` email card | "We respond within 24 hours" | "Messages answered within one business day. Quotes: standard within 2 business hours, custom within 24–48 hours." |
| `/industries/restaurants` | "…we'll return a stall-by-stall quote, usually the same business day." | "…we'll return a stall-by-stall quote. Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours." |
| `/service-area` stat tile | "1–2 Day quote turnaround" | "2 hrs: standard quote turnaround" |
| `/service-area` freight line | "…we'll confirm exact lead time and freight cost within one business day." | Keep, but confirm with Abe that freight is priced inside the quote. If it is, use the quote promise instead. |

**If the configurator shows a live price** for standard setups, label it "estimate" on screen, and keep the word "quote" for what the team sends. The configurator is a quote request, so no "order" or "checkout" wording.

**Also check:** the quote confirmation email and the thank-you screen after the form, which weren't in the saved pages. They need the same promise.

The rewritten pages in `pages/` already use the promise.

## 8. A drawing in the page hero

Each rebuilt page shows its main drawing beside the title, drawn straight on the dark hero with no card: light lines, the orange subject kept, the building and product as faint tints (CSS overrides on the SVG colors) (two columns from 900px, stacked under the button on a phone). The previews do this in `build/build.mjs` (`heroArt`): the page's first drawing, or a fitting one for pages without their own. Once Abe sends job photos, a real photo of a finished restroom can take the drawing's place on the pages where it fits better.

## 9. Expert advice boxes

The expert advice box is, laid out like the title block of a technical drawing to match the drawings: a brown (`#2d1e14`) panel with the quote large across the top, and a ruled strip below with two cells: the name with the role under it, and the logo cell (the orange N with "Next Partitions / Expert advice"). No labels, and the question isn't shown: it stays in the page file for reference. On a phone the logo cell shows the N only. In the page files it's a block:

```
:::expert
The question we asked
> The quote, in the expert's own words.
— Name, role
:::
```

Until Abe answers, a block holds only the question and the preview shows a placeholder quote, name and role. **Don't publish a box without a quote:** leave it out of the live page until the answer is in. The previews render it in `build/build.mjs` (`expert`).

### 9b. Alternative: general advice box

A second version with no person attached: a tip in Next Partitions' own voice, written from facts the page already sources. Ink-framed white box, a brown band on top with the logo and "Next Partitions advice", an orange rule under the band, the tip in larger ink text. In the page files:

```
:::advice
The tip, one to three sentences.
:::
```

**For now both boxes appear only in the showcase article, `/guides/restroom-layout`** (two advice boxes, one expert quote box). The other drafts have none until Abe picks the style and sends his answers.

## 10. Keep the photos the live pages already have

Nine live pages show a product photo: the four mounting style pages, the mounting styles hub (all four), and phenolic, plastic laminate, powder coated steel, solid plastic and stainless steel. The rebuilt pages keep them, linked to the same assets (`/__l5e/assets-v1/...`), as a card after the introduction with the existing alt text as its caption; the hub shows the four in one row. They are small (about 300 px for mounting styles, 540 px for materials): if you have larger originals, use those.

The solid plastic color swatches (21) and the stainless finish swatches (satin, diamond, leathergrain) are left out of the rebuilt pages for now, because the color and finish lists couldn't be confirmed against the manufacturers. Keep the existing swatch grids on the live pages until Abe confirms which colors and finishes he actually offers; then they go back.

## 11. The quote card in the side column should stay in view

The side card ("Planning a restroom?" with the Get a Quote button) is `sticky top-4`, but the site header is also sticky and about 107 px tall, so the card slides under the header and looks like it scrolls away. Give it a top offset below the header (the previews use `top: 132px`, header height plus 24 px), or `top-[calc(var(--header-h)+1.5rem)]` if the header height is a variable.
