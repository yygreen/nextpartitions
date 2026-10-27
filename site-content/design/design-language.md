# Next Partitions: visual design language

How Next Partitions looks beyond the page layout Marc built: drawings, diagrams, icons and any visual we add to the site, emails, PDFs or social posts. It builds on the live brand (the orange N logo, Inter, the warm off-white and brown palette) and doesn't replace it. Specimen: `design-language.html`.

## The idea: the spec sheet

Next Partitions' buyers are facilities managers, contractors and architects. They trust manufacturer spec sheets and shop drawings, not lifestyle photos. So our visuals look like a well-made spec sheet: exact, quiet, measured, with one thing called out. Every visual answers one question ("what holds a ceiling-hung stall up?", "what do I measure?") and shows the answer in orange.

Three rules carry the whole language:

1. **One subject, in orange.** Orange (`#fe7802`) marks only the thing the visual is about: the support system, the gap, the measurement. Everything else is ink on white. If two things are orange, the drawing is making two points: split it.
2. **The building is grey, the product is white.** Floors, walls and ceilings are hatched warm grey; partitions are white with ink outlines. The reader always sees what we sell and what the building has to provide.
3. **Measured, and sourced.** Drawings are to scale (3.2 px per inch in elevations) and every dimension comes from a cited source on the page it sits on. No decorative numbers.

## Colour

From the live stylesheet. Use these values only.

| Token | Hex | Use |
|---|---|---|
| Ink | `#1c0e05` | Linework, text (`--foreground`) |
| Brown | `#2d1e14` | Hero backgrounds, secondary linework (`--brand-navy`) |
| Orange | `#fe7802` | The subject; callouts; buttons (`--brand-red`) |
| Orange tint | `#fff1e5` | Areas (a gap, a clearance zone) behind an orange outline |
| Muted | `#7a6a5e` | Dimension lines and their labels, notes |
| Structure | `#f2f0ec` + hatch `#cfc7bc` | Floors, walls, ceilings (`--accent`) |
| Paper | `#ffffff` / `#fbfaf9` | Drawing ground / page ground (`--background`) |

Orange on white is for shapes, lines and white-on-orange numbers, not small orange text on white: it is too light to read. Text stays ink or muted.

## Type

Inter only (the site's `--font-body` and `--font-heading`). In drawings: labels 13–14 px weight 500, dimensions 14 px weight 600 in Muted, titles 16–18 px weight 700. Inches as `58"`, feet as `8'`. Sentence case.

## Line

| Element | Stroke |
|---|---|
| Product outlines | Ink, 1.5 px |
| Building edges (floor line, wall face, ceiling line) | Ink, 1.5 px; fill hatched Structure |
| The subject | Orange, solid fill or 2.5–5 px |
| Dimension lines | Muted, 1 px, with 10 px end ticks; label beside, never on the drawing |
| Hidden or moving parts (door swing, dashed outline) | Muted or Orange, 1.5 px, dash 5 5 |
| Leaders | Orange, 1.5 px, ending in a 2.5 px dot on the part |

## Callouts and keys

Numbered orange discs (24 px, white bold number). The key is written as page text right under the drawing, as a numbered list, not inside the image. That keeps it readable on a phone, translatable, and readable by Google and AI tools. Measurement keys use letters (A, B, C…) and a plain list.

## Layout: always landscape

Every illustration is laid out horizontally, at least 1.6 times as wide as it is tall. Standalone drawings are 780 px wide, the width of the content column, so they show at their real size and the text stays 13–14 px. If a subject doesn't fit a landscape frame (a plan plus a section, a tall side view with its notes), split it into separate drawings. On the page, put a short paragraph between them that leads from one to the next and says what the reader is looking at.

**Phone variants.** Nothing scrolls sideways. Every drawing wider than about 480 px (standalone drawings, and the plan and front elevation of a sheet) also has a phone variant drawn 360 wide, still landscape (1.6 : 1 or wider), so its text stays 12–13 px on a phone: `<name>-m.svg`, or `<name>-m1.svg`, `-m2.svg` … when one frame can't hold it. Long labels become the letters and numbers of the page's key; dimensions keep their values. The page shows the phone variant below 640 px.

## Drawings in the reading flow

How drawings sit in an article without breaking the read:

1. **One drawing per step or subsection, at most.** If a section needs two, it is two subsections.
2. **The sentence before it says what to look at.** The drawing follows the paragraph that sets it up, never the middle of a list.
3. **The key lives inside the drawing's card** as a compact legend (smaller type, two columns on desktop), so drawing and key read as one unit and the text carries on below it. If the drawing already labels itself (like the installation strips), it has no key.
4. **Overview first, detail after.** A strip of numbered frames can open a long sequence as the at-a-glance version; each step below then explains one frame.
5. **Don't repeat another page's drawing.** A guide links to the full data sheet on its own page in one line instead of embedding it.
6. **Prose keeps going without the drawing.** Every fact in a drawing is also in the text or the legend, so a reader who skips the picture loses nothing.

## Views

- **Front elevation** for anything about how stalls stand: two stalls between walls, floor slab below.
- **Seen from above** (plan) for hinges, door swing and anything that wraps an edge; say "seen from above" under it.
- **Edge view** for thicknesses.
- Never perspective or 3D: it hides the measurements.

## Sheets

A product drawing is a sheet, like a manufacturer's data sheet: the same stalls from several views, each its own SVG, laid out by the page as one figure.

- **Plan** (seen from above): accessible, ambulatory and standard compartments with toilets, grab bars, door swings and the code minimums (60" min, 35–37", 30" min wide; 60" min deep; 32" min clear opening).
- **Front elevation:** four stalls with the support system in orange and numbered callouts.
- **Side view:** through a stall, looking at a dividing panel: toilet, brackets, panel height and floor gap.
- **Details** (circles, larger scale): headrail, floor anchor, ceiling hanger or ceiling anchor, panel bracket. Labels in the circle; sizes only where a source gives them (anchor depth and slab thickness).

Wide views (plan, front elevation) span the figure and switch to their phone variants on a phone; side view and details (400 wide) sit two across on desktop and stack on a phone, scaled to the column. `diagrams/sheets.json` lists each sheet's views.

## Every drawing carries

- A `<title>` and `<desc>` in the SVG and alt text on the page (what it shows, in one sentence).
- Width and height from its viewBox; it scales to the content column and fits a 390 px phone screen.
- Its sources in the page's Sources list only. Drawings, their keys and the text around them present the figures as our own: no manufacturer names or data sheet references on the drawing or in its key (code sections such as ADA 604.5 may be cited in the key, as the writing rules require). Where the figure comes from is recorded in `drawing-check.md` and the page's Sources.

## Photos

Real job photos only (Abe's, with rights to use), never stock images of restrooms. Straight-on views where possible, so a photo can sit next to its drawing. No filters.

## Where this applies next

- Material pages: a cross-section per material (core, faces, edge).
- Guides: stall dimension plans (standard, ambulatory, accessible) to the 2010 ADA Standards figures.
- Quote emails and the shop-drawing cover sheet.
- Installer directory profiles: the "What we checked" icons.

## Files

- `diagrams.mjs`: generates every drawing in `diagrams/` from shared tokens and parts. Change a token or a part once, rerun `node design/diagrams.mjs`, and every drawing follows.
- `diagrams/*.svg`: the drawings. On the live site they go in `public/images/diagrams/`.
