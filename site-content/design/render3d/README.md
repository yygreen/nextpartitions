# Partition product renders (three.js, headless)

Product renders of the front-elevation row (one 60-1/2" accessible compartment and three 36" standard ones) in each
mounting style, matching the technical drawings `design/diagrams/mounting-<style>-front.svg`.

```
cd design/render3d
npm install                                 # three 0.160.0 (pinned)
node render.mjs                             # all 4 styles × front/angle, plus ceiling-hung blue-grey and stainless
node render.mjs ceiling-hung front          # one style, one view (front | angle | hero | both); hero = photo-like straight-on view for the page heroes
node render.mjs ceiling-hung both stainless # one finish (cream | bluegrey | stainless)
```

Output: `design/renders/<style>-<view>[-<finish>].png` and `.jpg` (JPEG quality 85). Front views are 2400 px wide at
the drawing's aspect ratio; angle views are 2400 × 1500. Each cream front render also writes
`renders/check-<style>.png`: the drawing scaled to the same width at 50% over the render (git-ignored).
Styles: `overhead-braced`, `floor-mounted`, `ceiling-hung`, `floor-to-ceiling`. A full run takes about 6 minutes.

Environment: `SS` (supersampling factor, default 2; `SS=1` for quick drafts), `EXPOSURE` (default 0.85).
Playwright is taken from the project if installed, else from `/opt/node-tools` (the build machines' global install);
Chromium runs WebGL on SwiftShader.

## Files

- `dims.mjs`: reads the dimensions out of `../diagrams.mjs` (parses the source; throws if it can't) and builds a spec per style.
- `scene.js`: the scene builder (`buildScene({ spec, finish, renderer })`, `makeCamera(view, spec, aspect)`). Units are inches.
- `index.html`: loads three through an import map, renders, supersamples down, returns PNG/JPEG data URLs.
- `render.mjs`: serves this folder on localhost, drives Chromium, writes the files.

## Where the numbers come from (`design/diagrams.mjs`)

| What | Source | Value |
|---|---|---|
| Row widths | `FRONT_ELEV` (fails if missing) | 3.5" pilaster, 36" accessible door, 21" pilaster, then 3 × (24" door + 12" pilaster) = 168.5" |
| Compartment lines | `FRONT_ELEV` | 60.5", 96.5", 132.5": dividing panels sit just inside each line, behind the pilaster |
| Stile heights | `front()` table `H` | overhead braced 1–82", floor mounted 1–70", ceiling hung 12–95", floor to ceiling 0–96" |
| Ceiling, walls, plenum | `H` | ceiling 96" (ceiling hung, floor to ceiling); wall heights; ceiling-hung plenum to 110" |
| Headrail | `front()` | top 2 px above 82", 2" deep, full run |
| Doors | `elevation()` `door = [12, 70]`, `front()` | 58", 12" off the floor, drawn from x + 0.3" to x + w - 0.3" |
| Door hardware | `front()` | accessible door swings out: hinges (7 × 14 px, tops 65" and 20") and pull (9" from the latch edge, top 43") on this face; latch indicator r 4 px, 4" from the latch edge at 40" on every door |
| Shoes | `front()` | 4" stainless at the floor, 1 px wider each side (all but ceiling hung); 3" at the ceiling (floor to ceiling) |
| Ceiling hung | `front()` | steel 102"–105", hanger rods from the steel to the stile tops; stainless sleeve 95"–96" |
| Frame | `front()` | 3.2 px/in, wall 22 px, slab 30 px, canvas width and height |
| Depth, toilets | `LAYOUT`, `plan()` | 61-1/4" to the face; accessible toilet 17" from the dividing panel, standard ones centred; ADA grab bars |
| Pilaster thickness | `side()` | 1-1/4" |

## Views

- `front`: an orthographic section framed exactly like the drawing (SVG px u, v ↔ x = (u - 92) / 3.2,
  y = (floor - v) / 3.2 over the whole viewBox). The building is cut 24" in front of the pilasters, so the side
  walls, slab and ceiling (and the ceiling-hung plenum with its steel and rods) show flat warm-grey cut faces where
  the drawing hatches them; outside the building the page is white. Check images: every pilaster, door and shoe edge,
  the floor, 12", 70", headrail, stile tops and ceiling coincide with the drawing's lines within 1–2 px at 2400 px.
- `angle`: the finished restroom (8' ceiling, downlights, the row in an alcove), three-quarter from the entry
  side at a 60" eye height.

## Look

MeshPhysicalMaterial (satin clearcoat on the panels, brushed stainless and chrome), RoomEnvironment through
PMREMGenerator for reflections, PCFSoftShadowMap from the downlights and a soft overhead key, ACES filmic tone
mapping. Ambient occlusion is faked with soft gradient planes at wall/floor corners and contact shadows under the
toilets and shoes. Floor tiles and brushed metal are procedural canvas textures (no image files).

Note: MSAA is off. SwiftShader's multisampling lets edge-on faces show through nearer surfaces (a hairline of
the dividing panel appeared on the pilaster face), so antialiasing is done by supersampling instead.
