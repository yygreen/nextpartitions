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

Manufacturer sites, access-board.gov and codes.iccsafe.org were blocked from this session's network on 2026-10-27, so nothing could be re-opened today. Every number below comes from a source already read and cited in the repo on 2026-10-26 (`pages/blog_what-are-bathroom-partitions-made-of.md`, `pages/hardware_doors.md`, `pages/hardware.md`, `pages/guides.md`); the URLs are those sources'. Anything without such a source is drawn without a dimension. All eight drawings carry the "Schematic" line: face, skin and edge-band thicknesses, urinal and screen sizes and the room proportions are not to a source.

## Material cross-sections (edge view, a door cut through near its edge)

Files: `material-section-phenolic`, `-solid-plastic`, `-plastic-laminate`, `-powder-coated-steel`, `-stainless-steel`, and `material-sections-compare` (all five stacked at one scale, 64 px per inch; the single sections are 120 px per inch). Callouts on every single section: **1 core, 2 faces / finish, 3 edge.** Orange is the construction that defines the material.

| Material | Drawn | Orange | Thickness dimension | Source (checked 2026-10-26) |
|---|---|---|---|---|
| Phenolic | Fused layers of phenolic-resin kraft paper (white lines), thin melamine faces, plain cut edge | The layered core | 3/4" (doors; panels are 1/2", stiles 3/4") | Bobrick DuraLineSeries CGL https://www.bobrick.com/products/toilet-partitions-cubicle-systems/traditional-partitions/duralineseries-cgl/ ; Bobrick 1080 data sheet https://www.bobrick.com/wp-content/uploads/1080_td.pdf ; Bradley PH400 https://media.bradleycorp.com/view/28555/Bradley_Partitions_PhenolicNS_OverheadBraced.pdf ; Bobrick CEU (melamine faces, black phenolic-resin core) https://www.bobrick.com/wp-content/uploads/Bobrick_Toilet-Partitions_CEU.pdf |
| Solid plastic (HDPE) | One homogeneous section: no core, skin or edge band | The whole section | 1" | Scranton Products, HDPE vs other materials https://www.scrantonproducts.com/hdpe-vs-other-materials/ |
| Plastic laminate | Particleboard core (white chips), thin HPL faces, an edge band | The particleboard core | 1" | Bobrick DesignerSeries HPL (1" doors, stiles, panels; 45 lb resin-impregnated particleboard) https://www.bobrick.com/products/toilet-partitions-cubicle-systems/traditional-partitions/designerseries-hpl/ ; ASI catalog (Moisture Guard edge banding fused to the core) https://asi-globalpartitions.com/wp-content/uploads/ASI-Global-Partitions-Catalog.pdf |
| Powder coated steel | Two steel face sheets over a honeycomb core (cell walls run face to face, so the cut shows them as lines across the core, paired where cells bond); plain edge | The honeycomb core | 1" (doors and panels; pilasters 1-1/4") | Metpar powder coated https://metpar.com/toilet-partitions/powder-coated/ ; ASI catalog (galvannealed steel, honeycomb core, powder coat) |
| Stainless steel | As powder coated, type 304 stainless faces | The honeycomb core | None: drawn at 1" so it compares with steel, but no manufacturer door thickness is held | ASI catalog (type 304 over honeycomb) |

Not confirmed, so not drawn or dimensioned: steel face gauge (search results on 2026-10-27 point to 22 gauge in Hadrian and agency specs, not opened); the edge construction of phenolic, HDPE, steel and stainless (drawn as a plain outline; the page key says "edge not described in held sources"); the thickness of melamine and HPL faces and of the edge band; stainless door thickness.

## Urinal spacing (plan, seen from above)

File: `urinal-spacing`. A back wall with a side wall on the left, three wall-hung urinals, urinal screens between them. Orange: the centerlines and the centerline spacing, **15" min** from the side wall to the first centerline and **30" min** centerline to centerline. Muted: **21" min** clear in front of the urinal to a dashed line standing for any wall, fixture or door. Note on the drawing: with a screen between urinals, each centerline also needs 15" min to the screen.

Source: International Plumbing Code 405.3.1 as printed in ICC's 2018 Significant Changes excerpt, https://www.iccsafe.org/wp-content/uploads/2018SC-PMG_P405.3.1.pdf (checked 2026-10-26, cited in `pages/guides.md`): 15" from a fixture's centerline to a side wall or partition; 30" center to center where no partition separates adjacent fixtures; 21" clearance in front of a water closet, urinal, lavatory or bidet. The 2021 IPC text at codes.iccsafe.org could not be opened on 2026-10-27; a web search summary of the 2021 chapter gives the same three numbers, but confirm the 2021 wording before launch. Urinal and screen sizes are not dimensioned (no source).

## Measuring a new restroom (plan with a section inset)

File: `measure-new-restroom`. Letters, Muted dimension lines; orange is the stall wall run.

- **A** room width along the wall the stalls will run on (orange line on that wall)
- **B** room depth
- **C** ceiling height (section inset)
- **D** entry door: where it is (measured from the nearest corner) and which way it swings
- **E** each toilet flange centerline, measured from the side wall
- **F** floor construction and the structure above the ceiling (section inset)

No numbers: it shows what to measure, not a size. The letters match the page's measurement list; C and F matter because ceiling-hung and floor-to-ceiling stalls need structure above the ceiling and floor anchors need structural concrete (Bobrick 1080: 2" min into 3" min structural concrete, see above).
