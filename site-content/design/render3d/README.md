# Partition product renders (three.js, headless)

Product renders of two standard toilet compartments in each mounting style, with the same proportions as the
technical drawings in `design/diagrams/`.

```
cd design/render3d
npm install                                 # three 0.160.0 (pinned)
node render.mjs                             # all 4 styles × front/angle, plus ceiling-hung blue-grey and stainless
node render.mjs ceiling-hung front          # one style, one view (front | angle | both)
node render.mjs ceiling-hung both stainless # one finish (cream | bluegrey | stainless)
```

Output: `design/renders/<style>-<view>[-<finish>].png` and `.jpg` (2400 × 1500, JPEG quality 85).
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
| Stile (pilaster) heights | `front()` table `H` | overhead braced 1–82", floor mounted 1–70", ceiling hung 12–95", floor to ceiling 0–96" |
| Ceiling | `H.ceil` | 96" (ceiling hung, floor to ceiling); the other two use the same 8' room |
| Headrail | `H.rail` and its rect in `front()` | 80.6"–82.6", clamped over the stile tops, sloping top + grip-resistant face |
| Doors | `elevation()` default `door = [12, 70]` | 58" doors, 12" off the floor; 1/8" gap each side |
| Widths | `FRONT_ELEV` (last 5 entries; the script fails if missing or if the two stalls differ) | pilaster 12", door 24", pilaster 12", door 24", pilaster 12" = 84" |
| Dividing panel | `FRONT_ELEV` stall line | 36" stalls = door + the 12" pilaster after it, so the panel sits just inside that pilaster's right edge; 12"–70", 1" thick, 1.5" behind the face to 0.7" off the back wall |
| Depth | `LAYOUT.depth` | 61-1/4" to the face |
| Pilaster thickness | `side()` | 1-1/4" |
| Shoes | `front()` | 4" stainless at the floor (all but ceiling hung); 3" at the ceiling on floor to ceiling |
| Hardware | `front()` | hinges 15.6–20" and 60.6–65" on the hinge (left) edge; latch indicator 4" from the latch edge at 40" |

Ceiling hung: the hanger rods and steel are above the ceiling and not shown; a stainless sleeve fills 95"–96"
between the stile top and the ceiling.

The two compartments are two of the identical standard stalls from the front elevations. In the front view they
stand between side walls (an alcove 2" deeper than the pilaster faces, in a wider restroom); the angle view opens
the row's right end (no wall, an end panel instead) so the side panels and a toilet show.

## Views

- `front`: straight on from 30 ft with a 17° lens, centred on the row; pilaster faces sit on the drawing's scale.
  Checked against `mounting-*-front.svg` (rendered with Playwright, scaled to the same px per inch): floor,
  12", 70", 82" (headrail), 95" and 96" lines coincide on all four styles.
- `angle`: three-quarter from the entry (hinge) side, eye height 60".

## Look

MeshPhysicalMaterial (satin clearcoat on the panels, brushed stainless and chrome), RoomEnvironment through
PMREMGenerator for reflections, PCFSoftShadowMap from the downlights and a soft overhead key, ACES filmic tone
mapping. Ambient occlusion is faked with soft gradient planes at wall/floor corners and contact shadows under the
toilets and shoes. Floor tiles and brushed metal are procedural canvas textures (no image files).

Note: MSAA is off. SwiftShader's multisampling lets edge-on faces show through nearer surfaces (a hairline of
the dividing panel appeared on the pilaster face), so antialiasing is done by supersampling instead.
