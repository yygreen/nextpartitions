# Drawings checked against manufacturer documents (2026-10-26)

Every drawing compared with the manufacturers' own data sheets, which I downloaded and read:

- **Bradley**, *Phenolic Floor-Mounted Overhead-Braced, PH400 Series* (media.bradleycorp.com/view/28555), pages 1–3: specification, example top, front and side views with dimensions.
- **Bobrick**, *DuraLineSeries 1080 Compact Grade Laminate, Technical Data* (bobrick.com/wp-content/uploads/1080_td.pdf, revised 4/24/25): stile heights, door sizes, floor anchor, ceiling leveling device, headrail detail, brackets, hinges, installation notes. The anchor note is the same in Bobrick's 1040 and 1550 sheets.
- **2010 ADA Standards** 604.2, 604.5, 604.8 for toilet position and grab bars.

## What changed

| Drawing element | Before | Manufacturer document | Now |
|---|---|---|---|
| Plan: stall widths | 60" min / 35–37" / 30" min (code minimums) | Bradley example: ADA 60-1/2" (60" clearance), ambulatory 36-1/2" (36"), standard 36" + 36", 169" overall | Bradley's example, four stalls |
| Plan: depth | 60" min | Bradley: 61-1/4" to face | 61-1/4" to face |
| Plan: ADA toilet and door | Toilet by the wall, door at the far end | Bradley: toilet beside the dividing panel, outswing door at the wall end | As Bradley |
| Plan: door swings | ADA and ambulatory out, standard in | Bradley: same | Unchanged, positions as Bradley |
| Plan: grab bars | Placed roughly | Not on Bradley's plan; ADA 604.5: side bar 42" min starting 12" max from the rear wall, rear bar 36" min | To 604.5, ambulatory both sides (604.8.2.3) |
| Front: door and pilaster widths | Equal 24" doors, 6" pilasters | Bradley front view: 36" and 34" outswing doors, 24" standard doors, a wide pilaster between the ADA and ambulatory doors | Scaled from Bradley's drawing; not dimensioned (Bradley prints no widths) |
| Front: heights, overhead braced | 83" pilaster | Bradley: 12" + 58" + 12" = 82" to the headrail | 82", labelled Bradley PH400 |
| Front: heights, other styles | 69" / 83" / to ceiling | Bobrick 1080: floor-anchored 69", ceiling-hung 83" for 96" ceilings, floor-to-ceiling up to 120" | Unchanged values, now labelled Bobrick 1080 |
| Front: hardware | One latch mark per door | Bradley: hinges and pulls show on outswing doors only | As Bradley |
| Shoes | 3" | Bobrick and Bradley: 4" stainless steel | 4" everywhere |
| Side view | Toilet and panel, 60" deep | Bradley side view: pilaster at the front, panel on brackets, 61-1/4" to face, 82" | As Bradley; toilet removed (Bradley shows none) |
| Detail: floor anchor | One bolt under a shoe | Bobrick #1002701: angle leveling bar bolted to the stile, two 3/8" threaded rods, nuts and washers, flat shoe retainer, wedge anchors; 4" shoe; "minimum 2" penetration into minimum 3" thick structural concrete" (note 3) | Redrawn to Bobrick's parts; 2" into 3" verified |
| Detail: ceiling hung | Rod from a flat steel bar | Bobrick ceiling leveling device: I-beam (not furnished), bevel washer, threaded rod, spacer, finished ceiling, leveling bar, nuts | Redrawn to Bobrick's parts |
| Detail: headrail | Dome profile, "two fasteners" | Bobrick: extruded anodized aluminum, enclosed, sloping top, raised grip-resistant face edge, wall bracket. Bradley: anti-grip profile that clamps over the pilaster | Cross-section clamped over the stile with sloping top and face edge; "two fasteners" (a New York State spec, not a manufacturer) dropped |
| Detail: bracket | Generic U | Bobrick #1000972 U-bracket, panel to perpendicular stile | Named as Bobrick's U-bracket |

## Still schematic (marked on the drawing)

Comparison of the four styles, parts of a partition, hinge types, latch and keeper, measuring a door, the four gaps. They explain a principle and carry "Schematic: shows the principle, not one manufacturer's product."

## Not drawn, on purpose

Exact extrusion profiles and part numbers differ by brand. The details show the parts each manufacturer lists without copying any one brand's profile; Abe's dealer documents would let us make brand-specific sheets.

# New drawings, 2026-10-27: material sections, urinal spacing, measuring a new restroom

Manufacturer sites, access-board.gov and codes.iccsafe.org were blocked from this session's network on 2026-10-27, so nothing could be re-opened today. Every number below comes from a source already read and cited in the repo on 2026-10-26 (`pages/blog_what-are-bathroom-partitions-made-of.md`, `pages/hardware_doors.md`, `pages/hardware.md`, `pages/guides.md`); the URLs are those sources'. Anything without such a source is drawn without a dimension. All nine drawings carry the "Schematic" line: face, skin and edge-band thicknesses, urinal and screen sizes and the room proportions are not to a source.

## Material cross-sections (edge view, a door cut through near its edge)

Files: `material-section-phenolic`, `-solid-plastic`, `-plastic-laminate`, `-powder-coated-steel`, `-stainless-steel`, and `material-sections-compare` (all five side by side at one scale, 80 px per inch, each door standing upright and seen edge on; the single sections are 150 px per inch, 780 wide). Callouts on every single section: **1 core, 2 faces / finish, 3 edge.** Orange is the construction that defines the material.

| Material | Drawn | Orange | Thickness dimension | Source (checked 2026-10-26) |
|---|---|---|---|---|
| Phenolic | Fused layers of phenolic-resin kraft paper (white lines), thin melamine faces, plain cut edge | The layered core | 3/4" (doors; panels are 1/2", stiles 3/4") | Bobrick DuraLineSeries CGL https://www.bobrick.com/products/toilet-partitions-cubicle-systems/traditional-partitions/duralineseries-cgl/ ; Bobrick 1080 data sheet https://www.bobrick.com/wp-content/uploads/1080_td.pdf ; Bradley PH400 https://media.bradleycorp.com/view/28555/Bradley_Partitions_PhenolicNS_OverheadBraced.pdf ; Bobrick CEU (melamine faces, black phenolic-resin core) https://www.bobrick.com/wp-content/uploads/Bobrick_Toilet-Partitions_CEU.pdf |
| Solid plastic (HDPE) | One homogeneous section: no core, skin or edge band | The whole section | 1" | Scranton Products, HDPE vs other materials https://www.scrantonproducts.com/hdpe-vs-other-materials/ |
| Plastic laminate | Particleboard core (white chips), thin HPL faces, an edge band | The particleboard core | 1" | Bobrick DesignerSeries HPL (1" doors, stiles, panels; 45 lb resin-impregnated particleboard) https://www.bobrick.com/products/toilet-partitions-cubicle-systems/traditional-partitions/designerseries-hpl/ ; ASI catalog (Moisture Guard edge banding fused to the core) https://asi-globalpartitions.com/wp-content/uploads/ASI-Global-Partitions-Catalog.pdf |
| Powder coated steel | Two steel face sheets over a honeycomb core (cell walls run face to face, so the cut shows them as lines across the core, paired where cells bond); plain edge | The honeycomb core | 1" (doors and panels; pilasters 1-1/4") | Metpar powder coated https://metpar.com/toilet-partitions/powder-coated/ ; ASI catalog (galvannealed steel, honeycomb core, powder coat) |
| Stainless steel | As powder coated, type 304 stainless faces | The honeycomb core | None: drawn at 1" so it compares with steel, but no manufacturer door thickness is held | ASI catalog (type 304 over honeycomb) |

Not confirmed, so not drawn or dimensioned: steel face gauge (search results on 2026-10-27 point to 22 gauge in Hadrian and agency specs, not opened); the edge construction of phenolic, HDPE, steel and stainless (drawn as a plain outline; the page key says "edge not described in held sources"); the thickness of melamine and HPL faces and of the edge band; stainless door thickness.

### Edges confirmed 2026-10-27

Callout 3 now shows each edge as the manufacturers describe it, drawn in ink (orange stays on the core). Stainless is now dimensioned 1". This supersedes the "not confirmed" edge and stainless-thickness items above; face, edge-layer and chamfer thicknesses are still not dimensioned (the HDPE radius is drawn to scale).

- Phenolic: machined smooth, small chamfer on both arrises. Bradley PH400 (45° chamfer) https://media.bradleycorp.com/view/28555/Bradley_Partitions_PhenolicNS_OverheadBraced.pdf ; Metpar black core (polished and beveled) https://metpar.com/toilet-partitions/phenolic-black-core/
- Solid plastic (HDPE): rounded to a 1/4" radius. Scranton Hiny Hiders general specifications http://www.scrantonproducts.com/wp-content/uploads/2015/05/hiny-hiders-partitions-general-specifications.pdf
- Plastic laminate: a thin laminate layer over the edge, sealing the core (.050" HPL on faces and edges). Bobrick 1040 data sheet https://www.bobrick.com/wp-content/uploads/1040_td.pdf
- Powder coated steel: formed edge molding interlocking with the two face sheets (20 ga molding, 22 ga faces). Metpar powder coated https://metpar.com/toilet-partitions/powder-coated/ and master spec https://metpar.com/wp-content/uploads/2021/05/Powder-Coated-Overhead-Braced-Standard-Master-Spec.docx
- Stainless steel: same formed, interlocking edge; doors 1". Metpar stainless https://metpar.com/toilet-partitions/stainless-steel/ and master spec https://metpar.com/wp-content/uploads/2021/05/Stainless-Steel-Floor-Mounted-Standard-Master-Spec.docx

## Urinal spacing (plan, seen from above)

File: `urinal-spacing`. A back wall with a side wall on the left, three wall-hung urinals, urinal screens between them. Orange: the centerlines and the centerline spacing, **15" min** from the side wall to the first centerline and **30" min** centerline to centerline. Muted: **21" min** clear in front of the urinal to a dashed line standing for any wall, fixture or door. Note on the drawing: with a screen between urinals, each centerline also needs 15" min to the screen.

Source: International Plumbing Code 405.3.1 as printed in ICC's 2018 Significant Changes excerpt, https://www.iccsafe.org/wp-content/uploads/2018SC-PMG_P405.3.1.pdf (checked 2026-10-26, cited in `pages/guides.md`): 15" from a fixture's centerline to a side wall or partition; 30" center to center where no partition separates adjacent fixtures; 21" clearance in front of a water closet, urinal, lavatory or bidet. The 2021 IPC text at codes.iccsafe.org could not be opened on 2026-10-27; a web search summary of the 2021 chapter gives the same three numbers, but confirm the 2021 wording before launch. Urinal and screen sizes are not dimensioned (no source).

## Measuring a new restroom (a plan, then a section)

Two landscape drawings (the old single `measure-new-restroom` with its section inset is replaced). Letters, Muted dimension lines; orange is the stall wall run.

File `measure-new-restroom-plan` (seen from above):

- **A** room width along the wall the stalls will run on (orange line on that wall)
- **B** room depth
- **D** entry door: where it is (measured from the nearest corner) and which way it swings
- **E** each toilet flange centerline, measured from the side wall

File `measure-new-restroom-section` (the room cut through, seen from the side):

- **C** ceiling height, floor to finished ceiling
- **F** floor construction, and the structure above the ceiling

No numbers: it shows what to measure, not a size. The letters match the page's measurement list; C and F matter because ceiling-hung and floor-to-ceiling stalls need structure above the ceiling and floor anchors need structural concrete (Bobrick 1080: 2" min into 3" min structural concrete, see above).

# Landscape layout, 2026-10-27

Every drawing is now at least 1.6 times as wide as it is tall (design-language.md, "Layout: always landscape"). Nothing was re-dimensioned: the same numbers, from the same sources.

- Standalone drawings are 780 wide, so they show at about their real size in the content column. `mounting-ceiling-hung`, `mounting-floor-to-ceiling`, `stall-gaps` and `partition-anatomy` (ratios 1.33 to 1.59 before) keep their drawing unchanged, centred on a 780-wide canvas.
- Sheet side views and details are 400 x 250, the size they show at two across on desktop. Side views are drawn at 1.75 px per inch with the parts named on the left (pilaster, panel, bracket, and the style's support: headrail, shoe, ceiling anchor, or steel and hanger) and the 58" and 12" heights right of the back wall. Details (2026-10-28) are rectangular, 780 x 420 with 360 x 224 phone variants: the same parts and labels, drawn larger and cropped with break lines instead of a circle, with the neighbouring pilaster, hanger or door in plain ink as unlabelled context (the headrail section has none: looking along the row, its neighbours sit behind it).

# Installation drawings, 2026-10-27: layout marks, door hand, brackets, pilasters, sequence

Facts from manufacturer installation guides (copies held by us, reviewed 2026-10-27, cited by title and number without a dealer link). Drawn as our own flat views (plans and elevations); no artwork traced or copied. No brand names or document references on the drawings or in their keys; the brand-specific figures are attributed in the page body and Sources.

- **Bradley, Series 400 Phenolic Installation Guide, HDWC-INSTR-040 Rev. A (2021)**, pages 4–21 (main source). The same handing note and 19" / 63" marks are in the Series 500, 600 and 700 phenolic guides, HDWC-INSTR-042, -043 and -044 Rev. A (2021).
- **Hadrian**, Installation Manual for Solid Plastic Toilet Partitions (4/2014) and Installation Manual for Metal Toilet Partitions, Standard Series (6/19): alcove pilasters and the alcove channel fixed to the panel.

| Drawing | Files | What is drawn | Source facts |
|---|---|---|---|
| Layout marks | `install-layout-marks` (+ `-m1` elevation, `-m2` plan) | Side wall and back wall unfolded at the corner; plumb lines at the pilaster and panel centerlines; orange marks at 19" and 63"; hollow marks for the 43" third-bracket option and the 12-1/2" continuous-bracket mark; plan of the corner with the pilaster line on the floor. Callouts 1–6. | 400 guide pp. 8–9: plumb line on all walls at each pilaster and panel centerline; marks 19" and 63" (or 19" / 43" / 63"; continuous 12-1/2") from the floor at the highest point in the room; pilaster centerline = back wall to face of compartment less 3/8"; panel centerlines stepped by stall width. The 3/8" is left to the page text (under a pixel at plan scale). Stall widths (36") and depth (61-1/4") are illustrative, not dimensioned. |
| Door hand | `door-hand` (+ `-m1` RH, `-m2` LH) | Four single compartments from above, viewer outside at the bottom: A right-hand inswing, B left-hand outswing (RH), C left-hand inswing, D right-hand outswing (LH). Orange: hinge-side pilaster and pivot. | 400 guide p. 4 (and p. 7, p. 20): handedness judged facing the stall from outside; "RH indicates right-hand inswing or left-hand outswing. LH indicates left-hand inswing or right-hand outswing." |
| Bracket types | `bracket-types` (+ `-m1` stirrups, `-m2` continuous) | One-ear stirrup, two-ear stirrup, continuous ear, continuous U; each facing the wall and from above, the pilaster or panel end dashed in the opening. Dimensioned: openings only, 3/4" (1–3) and 1/2" (4). | 400 guide p. 10: one-eared and two-eared stirrup brackets, 3/4" opening for pilasters and 1/2" for panels; continuous 'ear' brackets (3/4", pilasters) and U-brackets (1/2", panels); ear faces into the stall on end panels and pilasters. Ear widths, leg depth, heights, hole counts are not sourced and not dimensioned; the page text says phenolic openings and to measure other materials. |
| Pilaster types | `pilaster-types` (+ `-m1` wall and alcove, `-m2` middle) | From above: wall pilaster at the side wall carrying a hinge; alcove pilaster on a panel end carrying a latch; middle pilaster with a panel behind, latch one side and hinge the other. Orange: the pilaster. Thicknesses drawn, not to scale. | 400 guide pp. 5–7: no-site wall, alcove and middle pilasters, handed by the door hinge/latch as seen from outside; p. 14: alcove bracket secures pilaster to panel in an alcove or in-corner. Hadrian: alcove pilaster/channel fixed to the panel. |
| Sequence | `install-sequence-1` (steps 1–4), `install-sequence-2` (5–7) (+ `-m1`, `-m2` each) | Each frame a plan over a front elevation of two stalls; the step in orange, earlier steps ink, later ones absent. 1 layout, 2 wall brackets, 3 wall pilasters, 4 panel on a 12" spacer with the middle pilaster to follow (dashed), 5 headrail, 6 doors, 7 hinges and latches. | 400 guide steps 1–9: layout, brackets to wall, leveling screws, shoes, "pilasters located at walls should be mounted first … install a panel, then a pilaster", 12" spacer, headrail, then hinges ("make sure the door openings are the appropriate size, all pilasters are plumb … and that the headrail is installed"), door hardware. Frames are not dimensioned. |

Placed on: `guides_how-to-install-toilet-partitions.md` (sequence at the start of the general sequence, layout marks in its layout step), `hardware_doors.md` and `hardware_hinges.md` (door hand), `hardware_parts.md` (bracket types, new "Pilasters: wall, alcove and middle" section with pilaster types and door hand, "Hand" added to the request list), `hardware.md` (bracket types under "Identify what you have").

Not sourced, so not drawn or dimensioned: bracket sizes other than the openings, continuous bracket lengths, opening sizes for materials other than phenolic.

# Installation and accessibility drawings, 2026-10-27: gaps, accessible heights, wall backing, latch problems, accessible plan

Manufacturer facts from the installation guides held by us (reviewed 2026-10-27, cited by title and number, no dealer link): **Bradley, Series 400 Phenolic Installation Guide, HDWC-INSTR-040 Rev. A (2021)**, pages 2–3, 9, 13–15, 20–22 (main source), with the same wall-hole and backing notes in Bradley's Series 600 Powder Coated & Stainless Steel guide (HDWT-INSTR-011 Rev F) and Bradmar Series 400 guide (HDWP-INSTR-013 Rev. L); **Hadrian**, Installation Manual for Metal Toilet Partitions, Standard Series (6/19), appendix F, and Installation Manual for Solid Plastic Toilet Partitions (4/2014), appendix D. Code facts from the **2010 ADA Standards** at https://www.access-board.gov/ada/, opened 2026-10-27 (section text and the figure descriptions for 604.5.2, 604.7, 604.8.1.2 and 604.8.1.4). Drawn as our own flat views; nothing traced. No brand names, document references or "schematic" notes on the drawings or in their keys; ADA section numbers appear in the keys only.

| Drawing | Files | What is drawn | Source facts |
|---|---|---|---|
| Install gaps | `install-gaps` (+ `-m`) | Front view: side wall, wall pilaster, door, middle pilaster; side view: pilaster, panel, back wall. Orange: the gaps. Door and panel on a dashed 12" spacer; small ink 1/8" spacers at the top and bottom of the latch-side gap. Callouts 1–6 with values. | Bradley 400 p. 3: "Spacer, 12" high … and 1/8" for gap between door and pilaster"; pp. 14–15: pilasters at walls 1/2" to 1-1/4", standard 1" panel to wall, 1/2" panel to pilaster, panel on the spacer; p. 21: door rests on the 12" spacer, "Place 1/8" spacers … between the door and pilaster notch at the top and bottom to achieve a symmetric gap between the door, pilaster on hinge, and latch sides". Hadrian metal F-2: 12" block, hinge 1/8" from the pilaster edge. Gaps drawn wider than scale; stall widths and heights not dimensioned. |
| Accessible heights | `accessible-stall-heights` (+ `-m1` rear wall, `-m2` side wall, `-m3` door) | Rear wall elevation (rear bar, toilet centerline, seat), side wall elevation (side bar, dispenser), door inside face near the latch (latch and pull band, coat hook band). Orange: the grab bars. Callouts 1–6. | ADA 604.5.1 (42" min, 12" max from rear wall, 54" min from it), 604.5.2 and Figure 604.5.2 (36" min; 12" min towards the side wall, 24" min towards the open side), 609.4 (33"–36" to the top of the gripping surface), 604.2 (16"–18"), 604.4 (17"–19"), 604.7 and figure (dispenser centerline 7"–9" in front of the water closet, outlet 15" min, 48" max, not behind grab bars), 404.2.7 (operable parts 34"–48"), 604.8.3 with 308.2.1 / 308.3.1 (coat hooks within reach range: 15"–48" unobstructed). Toilet shape and size, dispenser size, door width and door bottom height are drawn, not dimensioned. |
| Wall backing | `wall-backing` (+ `-m`) | The wall cut through at a two-ear panel bracket, seen from above: hatched finish, backing (orange tint), two holes with plastic anchors (orange), #14 screws through the bracket ears, panel in the bracket. | Bradley 400 p. 9 (step 2): drill "a Ø5/16" hole (min. 2" deep)" at each bracket hole, plastic anchors, #14 x 2" screws; p. 2 warning: "make sure that the wall and floor backing are adequate to support the secure mounting of the toilet compartment units" (same in the Series 600 steel and Bradmar guides). Bobrick 1080: wall backing required (cited on the page). Finish and backing thicknesses, anchor length and bracket sizes are not sourced and not dimensioned. |
| Door and latch problems | `door-latch-problems` (+ `-m1` A and B, `-m2` C) | Three front views from inside the stall: A latch pilaster leaning (dashed plumb line, orange wedge gap), B door dropped at the latch side (dashed true position, orange wedge at the top, latch below the keeper), C keeper fixed out of line (orange keeper, dashed true position). Angles and offsets exaggerated (said on the drawing). | Bradley 400 pp. 14, 20–22: check pilasters plumb and level (leveling screw); before hinges, door openings sized, pilasters plumb, headrail installed; 1/8" spacers for a symmetric gap, screws to 80–90 in-lb; keeper placed with the door closed so the latch moves freely over it. Hadrian metal F-1/F-2: "The hinge must be installed plumb to work correctly." Hadrian solid plastic appendix D: keeper at the door's mid-point, latch slide on the keeper slot. No tolerances drawn (none sourced). |
| Accessible plan | `accessible-stall-plan` (+ `-m`) | One wheelchair accessible compartment from above at minimum size: rear wall left, side wall (toilet side) top, side partition bottom, front partition and outswing door right. Orange: the minimum compartment area 60" x 59", dashed orange at 56". Callouts 1–6. | ADA 604.8.1.1 (60" min wide; 56" min deep wall-hung, 59" floor-mounted), 604.2 (16"–18"), 604.8.1.2 and figure (door in the front partition within 4" max of the side wall or partition farthest from the water closet, self-closing, may not swing into the minimum required compartment area), 404.2.3 (32" min clear opening, door open 90°), 604.8.1.4 and figure (toe clearance 9" min high, 6" min deep beyond the compartment-side face, under the front partition and at least one side partition). Toilet size, partition thickness and door leaf width drawn, not dimensioned. |

Placed on: `guides_how-to-install-toilet-partitions.md` (wall-backing under "Wall blocking and backing", install-gaps after the panel and door notes in the general sequence, accessible-stall-heights under Hardware > Grab bars, door-latch-problems at the top of Problems), `guides_bathroom-stall-dimensions.md` (install-gaps under "The gaps in a standard stall", accessible-stall-plan and accessible-stall-heights in the wheelchair accessible / grab bars sections, ADA disclaimer repeated after the heights), `hardware_locks-latches.md` (door-latch-problems under Keepers and strikes), `industries.md` (accessible-stall-plan after the sheet-plan key; sheet-plan kept for the row).

Not sourced, so not drawn or dimensioned: a door-to-pilaster gap tolerance for other brands (the stall dimensions page keeps its separate published tolerances); grab bar load or whether a partition panel may carry a grab bar; the 42" latch-side approach clearance (604.8.1.2) and children's dimensions (604.9), left to the page text; the cam's role in a dropped door (the guides tie the cam to the rest position only, so the key points to plumb hinges, tight screws and the 1/8" spacers).

# Gravity hinge close-ups, 2026-10-27: bottom cam and top pin

Facts from the sources cited on `hardware_hinges.md` and the installation guides held by us (reviewed 2026-10-27, cited by title, no dealer link): **ASI Global**, Construction Features page (asi-globalpartitions.com/construction-features/, opened 2026-10-27) and *Integrated Privacy Powder Coated and Stainless Steel Installation Guide*, door hardware assembly; **All American Metal (Ammco)**, *Metal Installation Instructions* and *Installation, Metal Floor Supported*, step 7; **Bradley**, *Series 400 Powder Coated and Stainless Steel, 69" and 72"*, HDWT-INSTR-038 Rev A, step 9; **Hadrian**, *Installation Manual for Metal Toilet Partitions, Standard Series* (6/19), step 9; **Metpar**, powder coated partitions page (no-rise cam, pin with nylon insert). Drawn as our own flat front views in the rectangular detail frame used for the mounting details; nothing traced. No brand names on the drawings; labels name the parts, so the cards need no key.

| Drawing | Files | What is drawn | Source facts |
|---|---|---|---|
| Bottom of a gravity hinge | `hinge-detail-cam` | Pilaster, door with its bottom hinge cut away (dashed), box cam in the door (orange) resting on the cam pintle, bottom hinge bracket bolted to the pilaster, locking nut under the bracket (the adjusting point, orange outline), slotted bolt base. | ASI guide: box cam into the lower door hinge, "lowest point of cam pintle sets door 'rest' position. Rotate pintle to desired position, then tighten locking nut", door placed by setting the box cam over the hinge pintle. Ammco step 7: nylon box cam in the door's bottom hinge recess, door hung on the cam pintle of the bottom hinge bracket, locking nut under it; "loosen the 1/2" nut … position door to the desired 'resting' position", slotted screwdriver at the bolt base, retighten. Bradley and Hadrian: male cam on the bottom hinge, female cam in the door casting; loosen the nut, set the angle, tighten. The cam faces are drawn as a simple peak; real cam profiles differ by brand and are not drawn. |
| Top of a gravity hinge | `hinge-detail-top-pin` | Pilaster, door with its top hinge cut away (dashed), top hinge bracket bolted to the pilaster sitting in a notch in the door's hinge, nylon bushing with its flange at the top (orange outline), hinge pin (orange) from the door top down through the door, bushing and back into the door; muted arrow: the pin goes in from above. | ASI construction features: "A pin goes through door and bracket for three-point bearing and operates in a nylon bushing in upper hinge bracket." ASI guide and Ammco: pin inserted from the top of the door through the bracket bushing and back into the door, until flush with the top of the door; Ammco: bushing flange at top. Metpar: 3/8" pin with nylon insert (size left off the drawing, one brand only). |

Placed on: `hardware_hinges.md` (`hinge-detail-cam` as a full-width figure under "Gravity (cam) hinges", `hinge-detail-top-pin` as a full-width figure after the steps in "How to adjust bathroom partition doors", for step 2).

Not drawn: wrap-around and vault hinge cams (the 30° steps are in the page text), continuous hinges (covered by `hinge-types`), bracket and pin sizes (not common to the brands).

Also fixed 2026-10-27: `accessible-stall-heights-m1` and `-m2` (phone). The rear-wall view's centerline now stops under the dimension labels and the two parts of the rear bar read 12" and 24" (the page text gives 12" min and 24" min); the side-wall view's "12" max" starts just inside its dimension so it no longer touches the wall line.
