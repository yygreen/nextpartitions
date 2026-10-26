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
