# Industry pages: accuracy check

Checked 2026-10-26 against the saved text in `current/`. Corrections only: nothing here rewrites a page. Each fix gives the current text, the exact replacement, and why, with a source.

**Pages:** `/industries/schools`, `/industries/gyms`, `/industries/offices`, `/industries/restaurants`, `/industries/community-centers`, `/industries/public-restrooms`. I also skimmed the hub (`/industries`) and the six material pages, because the industry pages recommend materials. What I found on those pages is listed at the end.

**Severity**

- **Must fix:** wrong, or risky for the client (ADA, fire code, quote promise, installation).
- **Should fix:** unclear, overstated or unsourced.
- **Confirm with Abe:** prices, lead times and business claims we can't check without his price list or his word.

**Not checked:** the FAQ answers. The saved text has the FAQ questions only (the answers are probably in a collapsed accordion the export didn't capture). Marc, please send the answer text, or make sure it's in the server-rendered HTML. The answers need the same check before any FAQPage structured data goes on these pages, especially "How many ADA stalls does a school restroom need?", "Can partitions be installed after hours in an occupied building?" and "How long do restaurant partitions take to ship?".

## Summary

| Page | Claims checked | OK | To fix (must / should) | Confirm with Abe |
|---|---|---|---|---|
| Schools | 23 | 10 | 10 (5 / 5) | 3 |
| Gyms & Fitness | 21 | 9 | 8 (4 / 4) | 4 |
| Offices | 22 | 7 | 11 (4 / 7) | 4 |
| Restaurants | 21 | 7 | 11 (4 / 7) | 3 |
| Community Centers | 19 | 7 | 9 (4 / 5) | 3 |
| Public Restrooms | 22 | 8 | 11 (5 / 6) | 3 |
| **Total** | **128** | **48** | **60 (26 / 34)** | **20** |

The hub page (`/industries`) has no factual problems. The material-page findings at the end aren't counted in the table.

### Problems on more than one page

1. **ADA statements without a citation or the disclaimer (all six, must fix).** Each page gives ADA dimensions ("60 inches wide with a 36-inch outswing door") but cites no section of the 2010 Standards and doesn't carry the site's ADA disclaimer, which the ADA guide and Standard Sizes pages already use. The statement is also incomplete: it leaves out compartment depth, 36 inches isn't the rule (the rule is a 32-inch minimum clear opening), and an outswing door isn't strictly required (the rule is that the door can't swing into the minimum compartment area). The fix is a standard bullet plus the disclaimer, given in C1 and C2 below.
2. **A lower floor gap for privacy or for children, with no toe-clearance warning (schools, gyms, offices, community centers, public restrooms; must fix).** The wheelchair-accessible compartment needs at least 9 inches of toe clearance under its front partition and at least one side partition, or 12 inches in a children's compartment, unless the compartment is larger than the exception sizes (604.8.1.4). A 6-inch gap on those partitions fails that rule.
3. **The ambulatory compartment rule is incomplete (schools, public restrooms; must fix).** 213.3.1 also requires an ambulatory compartment where water closets and urinals *combined* total six or more, not only where there are six compartments.
4. **HDPE fire rating (schools, gyms, community centers, public restrooms; must fix).** All four recommend HDPE, and schools calls it the "K-12 default", but none says to specify fire-rated HDPE. The IBC (Section 803.9 in the 2015 and 2018 editions) requires HDPE and polypropylene used as interior finish to pass NFPA 286, and Scranton Products states that its Standard Color Collection "does not meet NFPA 286 or ASTM E84". A buyer could pick a non-compliant panel from these pages.
5. **The quote promise (restaurants; must fix).** The page says "usually the same business day". The only promise allowed is "Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours."
6. **Installation wording (offices; must fix).** "Install with minimal disruption to tenants" reads as if Next Partitions installs.
7. **"Build & Price It" (all six, should fix).** This button goes to the configurator, which ends in "Request Quote". "Price It" implies instant checkout pricing, but the configurator is a quote request.
8. **Overstated material claims (should fix):**
   - stainless steel "never corrode", "corrosion proof", "will not pit"
   - phenolic described as "color-through": the standard is black core, and color-through is an option on some lines
   - HDPE "graffiti and scratches sand out"
   - powder coated "lowest installed cost" (we don't sell installation) and "16+ colors" (the material page says 15)
9. **Budgets and lead times (all six, confirm with Abe).** None can be checked without Abe's price list, the ranges disagree with the site's own FAQ, and the lead times disagree with the material pages and the FAQ. See the section after the per-page fixes.

### Standard fixes used on several pages

**C1. ADA bullet (must fix).** Use it on schools, gyms, offices, community centers and public restrooms. Restaurants gets its own version (R2).

- **Current text:** "Standard stalls are 36 inches wide; ADA compartments are 60 inches wide with a 36-inch outswing door." (offices, gyms, community centers and public restrooms say "are 36 inches wide"; schools says "run 36 inches wide")
- **Change to:** "Standard stalls are usually 36 inches wide. A wheelchair-accessible compartment must be at least 60 inches wide and at least 56 inches deep with a wall-hung toilet, or 59 inches deep with a floor-mounted toilet. Its self-closing door needs at least 32 inches of clear opening and can't swing into that minimum space, which is why most accessible compartments have an outswing door (2010 ADA Standards [604.8.1.1](https://www.access-board.gov/ada/#ada-604_8_1_1), [604.8.1.2](https://www.access-board.gov/ada/#ada-604_8_1_2), [404.2.3](https://www.access-board.gov/ada/#ada-404_2_3))."
- **Why:** 604.8.1.1 sets the 60-inch width and the 56/59-inch depths. 604.8.1.2 says the door "shall be self-closing" and "shall not swing into the minimum required compartment area". 404.2.3 sets a 32-inch minimum clear width. A 36-inch door is a common product size, not the rule. Sources: [2010 ADA Standards](https://www.access-board.gov/ada/), checked 2026-10-26.

**C2. ADA disclaimer (must fix).** Use it on all six pages, directly under the Planning & Compliance list.

- **Current text:** (none)
- **Change to:** "Disclaimer: ADA dimensions and accessibility guidance shown here are provided for general informational purposes only. Codes and their interpretation vary by jurisdiction and project. We accept no responsibility or liability for compliance — always verify requirements with your architect, engineer, or local code official before ordering."
- **Why:** This is the site's existing disclaimer, copied word for word from `/guides/ada-compliance` and `/guides/standard-sizes`. README rule 8 requires it wherever ADA dimensions appear.

**C3. HDPE fire-rating bullet (must fix).** Add it to the Planning & Compliance list on schools, gyms, community centers and public restrooms.

- **Current text:** (none)
- **Change to:** "Specify fire-rated solid plastic (HDPE). Building codes based on the International Building Code require HDPE partitions to pass the NFPA 286 room-corner fire test, and some standard HDPE colors don't. Ask for the fire-rated version and its test report, and confirm the requirement with your local building official."
- **Why:** The IBC requires HDPE and PP used as interior finish to comply with 803.1.1 (NFPA 286): Section 803.9, as reproduced in the [2018 Seattle Building Code, ch. 8](https://www.seattle.gov/documents/Departments/SDCI/Codes/SeattleBuildingCode/2018SBCChapter8.pdf). The requirement dates from the 2009 IBC/IFC and the 2012 NFPA codes ([Bobrick fact sheet, 2012](https://www.bobrick.com/wp-content/uploads/FACT_SHEET_ICC_IFC_AND_NFPA_MODEL_CODE_REVISIONS-1.pdf)). Scranton Products: "Standard Color Collection option does not meet NFPA 286 or ASTM E84" ([color visualizers](https://www.scrantonproducts.com/marketing/product-color-visualizers/)). All checked 2026-10-26. Bobrick competes with Scranton on HDPE, but the Scranton footnote confirms the point on its own.

**C4. Second CTA (should fix).** Use it on all six pages.

- **Current text:** "[Build & Price It](/configurator)"
- **Change to:** "[Configure & Request a Quote](/configurator)"
- **Why:** The configurator ends in "Request Quote" (`current/configurator.md`). README rule 5 and CLAUDE.md: it's a quote request, not a checkout, so the button shouldn't promise a price.

---

## Schools (`/industries/schools`)

### Must fix

**S1. ADA bullet.** Apply C1 to "Standard stalls run 36 inches wide; ADA compartments are 60 inches wide with a 36-inch outswing door."

**S2. Elementary heights and toe clearance**
- **Current text:** "Elementary: 48-inch panels at 6 to 8 inches off the floor. Secondary: 55-inch panels at 12 inches off the floor."
- **Change to:** "Elementary restrooms often use lower doors and panels than secondary schools; confirm the heights available for your material and manufacturer. Accessible compartments designed for children (ages 3 to 12) under the ADA children's provisions must be at least 60 inches wide and 59 inches deep. Their front partition and at least one side partition need at least 12 inches of toe clearance above the floor, unless the compartment is more than 65 inches deep (front) or more than 66 inches wide (side) (2010 ADA Standards [604.9](https://www.access-board.gov/ada/#ada-604_9), [604.8.1.1](https://www.access-board.gov/ada/#ada-604_8_1_1), [604.8.1.4](https://www.access-board.gov/ada/#ada-604_8_1_4)). Secondary restrooms typically use standard 55- or 58-inch doors and panels mounted about 12 to 14 inches off the floor."
- **Why:**
  - A 6- to 8-inch gap fails the 12-inch children's toe clearance in 604.8.1.4 on the accessible compartment.
  - 604.8.1.1 sets 59 inches as the minimum depth for children's compartments, whatever the toilet type.
  - 604.1 allows the children's provisions as an exception, and the Advisory to 604.9 covers ages 3 to 12.
  - I found no manufacturer source for "48-inch panels at 6 to 8 inches". Standard heights: Bobrick gives 55 or 58 inches ([Bobrick CEU presentation, 2018](https://www.bobrick.com/wp-content/uploads/SCC-Toilet-Partitions_Commercial.pdf)); Scranton specifies 55-inch doors and panels 14 inches above the floor ([Hiny Hiders general specifications, 2012](http://www.scrantonproducts.com/wp-content/uploads/2015/05/hiny-hiders-partitions-general-specifications.pdf)).
  - All checked 2026-10-26.

**S3. Ambulatory compartment rule**
- **Current text:** "Provide at least one accessible compartment, and an ambulatory stall once the room has six or more compartments."
- **Change to:** "Where a restroom has toilet compartments, at least one must be wheelchair accessible. Add an ambulatory-accessible compartment (35 to 37 inches wide, at least 60 inches deep) once the room has six or more compartments, or six or more toilets and urinals combined (2010 ADA Standards [213.3.1](https://www.access-board.gov/ada/#ada-213_3_1), [604.8.2](https://www.access-board.gov/ada/#ada-604_8_2))."
- **Why:** 213.3.1 also triggers the ambulatory compartment "where the combination of urinals and water closets totals six or more fixtures". A boys' room with 4 stalls and 2 urinals needs one, but the current text says it doesn't. Checked 2026-10-26.

**S4. HDPE fire rating.** Add C3. HDPE is the page's "K-12 default", and schools are where code review is strictest.

**S5. ADA disclaimer.** Add C2.

### Should fix

**S6. HDPE card**
- **Current text:** "Through-color one-inch HDPE with a 25-year warranty; graffiti and scratches sand out."
- **Change to:** "Through-color one-inch HDPE, with a 25-year limited warranty on lines such as Scranton Products Hiny Hiders. Graffiti wipes off with a non-abrasive cleaner, and because the color runs through the panel, scratches are hard to see."
- **Why:** Scranton confirms the 25-year limited warranty and "Graffiti is easily wiped clean with a common, nonabrasive cleaner" ([Hiny Hiders](https://www.scrantonproducts.com/products/hiny-hiders-partitions/), checked 2026-10-26). I found no manufacturer guidance that says to sand HDPE, and warranty terms vary by manufacturer.

**S7. Phenolic card and "sanded without changing color"**
- **Current text:** "Dense compact-laminate core with the hardest surface available and the slimmest profile."
- **Change to:** "Dense compact-laminate (phenolic) panels, typically 1/2 inch thick, with a hard surface that resists scratches, impact, moisture and graffiti. Standard phenolic has a black core; color-through cores are available on some lines."
- **Current text (What Schools Need):** "Panels that can be scrubbed or sanded without changing color"
- **Change to:** "Panels that scrub clean without showing a different color underneath (through-color HDPE or color-through phenolic)"
- **Why:**
  - Bobrick describes compact laminate as "solidly fused plastic laminate with matte-finish melamine surfaces, integrally bonded colored face sheets and a black phenolic-resin core", with 1/2-inch panels ([Bobrick compact grade laminate](https://www.bobrick.com/products/toilet-partitions-cubicle-systems/materials-and-hardware/compact-grade-laminate/); [1080 data sheet](https://www.bobrick.com/wp-content/uploads/1080_td.pdf)).
  - ASI sells black core and Color-Thru as separate lines ([ASI Color-Thru on Sweets](https://sweets.construction.com/manufacturer/asi-global-partitions-nst1616/products/color-thru-phenolic-toilet-partitions-nst708589-p)).
  - On black-core phenolic, sanding the colored face exposes the black core. "Hardest surface available" is an unsourced superlative: in Bobrick's tests, compact laminate is "the hardest to dent" and is among the most scratch-resistant materials, not alone at the top ([Bobrick CEU, 2018](https://www.bobrick.com/wp-content/uploads/SCC-Toilet-Partitions_Commercial.pdf)).
  - All checked 2026-10-26.

**S8. Stainless card**
- **Current text:** "Corrosion-proof and easy to sanitize, with embossed patterns that hide fingerprints."
- **Change to:** "Corrosion-resistant and easy to sanitize, with embossed patterns that hide fingerprints."
- **Why:** Stainless resists corrosion but isn't immune to it. Chloride-laden air in indoor pools, for example, can crack and stain 304 and 316 ([ASSDA](https://www.assda.asn.au/blog/353-stainless-steel-for-indoor-swimming-pools); [Nickel Institute](https://www.nickelinstitute.org/media/8daa77b1620dde6/14015_ambient_temperaturestress_corrosioncrackingofausteniticstainlesssteelinswimmingpools.pdf), checked 2026-10-26). The stainless card also recommends it for "athletic facilities".

**S9. Hinges**
- **Current text:** "Specify continuous piano hinges instead of gravity hinges to survive door slamming."
- **Change to:** "Specify heavy-duty continuous (full-height) hinges to survive door slamming. The accessible compartment door must be self-closing ([604.8.1.2](https://www.access-board.gov/ada/#ada-604_8_1_2))."
- **Why:** Continuous hinges can be self-closing gravity or cam hinges, so "instead of gravity hinges" sets up a false choice. Bobrick's model spec calls for hinges that "extend full height of door and panel" and are "self-closing" ([Bobrick CEU, 2018](https://www.bobrick.com/wp-content/uploads/SCC-Toilet-Partitions_Commercial.pdf)). Checked 2026-10-26.

**S10. CTA.** Apply C4.

### Confirm with Abe

**S11. Budget.** "$900–$2,400 per stall by material". See the budget section below.

**S12. Lead time.** "2–4 weeks; plan summer installs by April". This roughly matches the HDPE and phenolic pages (10–15 business days) but not the FAQ ("custom 10–15 business days", "stock 48–72 hours"). Confirm both the range and the April planning advice.

**S13. Customer claims.**
- **Current text:** "We supply K-12 districts, charter schools, and universities with HDPE and phenolic partition packages … Quotes are stall-by-stall so a district can budget by building."
- **Why:** These are business claims: who buys, and how quotes are itemized. Keep the text if Abe confirms. If not, change the first sentence to "We supply HDPE and phenolic partition packages for K-12 districts, charter schools, and universities, sized for the room…".

### OK (keep)
- The opening line ("kicks, graffiti, hanging on doors, daily disinfecting…") is specific and accurate.
- Standard stalls are about 36 inches wide (matches the site's Standard Sizes guide).
- The rule of at least one accessible compartment is correct (213.3.1); it just needs the citation in S3.
- HDPE for locker rooms and gyms. Scranton: "Impermeable to moisture… does not support the growth of mold & mildew".
- Powder coated steel only in dry, low-traffic rooms (matches the site's powder coated page: "not recommended for wet or coastal sites").
- Floor-to-ceiling is the most rigid configuration, and overhead-braced is the economical standard.
- Ceiling hung needs structural support above.
- Continuous hinges and tamper-resistant fasteners for abuse-prone rooms.
- The cost ranking ($ powder coated < $$ HDPE < $$$ phenolic < $$$$ stainless) matches Bobrick's price index (painted metal 1.0, HDPE 1.9, compact laminate 2.4, stainless 2.7).
- The four-material comparison table is a clear structure. Keep it, and the Planning & Compliance links to the guides.

---

## Gyms & Fitness (`/industries/gyms`)

### Must fix

**G1. ADA bullet.** Apply C1.

**G2. Lower floor clearance in aquatic facilities**
- **Current text:** "Aquatic facilities usually raise panel heights and lower floor clearance for added privacy in changing areas."
- **Change to:** "For more privacy in changing areas, taller panels and a lower floor gap are an option. The wheelchair-accessible compartment still needs at least 9 inches of toe clearance under the front partition and at least one side partition, unless it's more than 62 inches deep with a wall-hung toilet or 65 inches with a floor-mounted toilet (front), or more than 66 inches wide (side) (2010 ADA Standards [604.8.1.4](https://www.access-board.gov/ada/#ada-604_8_1_4))."
- **Why:** 604.8.1.4. "Usually" is unsourced. Checked 2026-10-26.

**G3. HDPE fire rating.** Add C3. HDPE is the page's "Best choice" for every wet area.

**G4. ADA disclaimer.** Add C2.

### Should fix

**G5. Intro claims about other materials**
- **Current text:** "Powder coated steel rusts at the edges within a few seasons and plastic laminate delaminates as moisture wicks into the particleboard core. HDPE solid plastic ignores all of it."
- **Change to:** "Powder coated steel and plastic laminate are made for dry, climate-controlled restrooms: steel can rust where the finish is chipped, and laminate's particleboard core can swell if water gets in. Solid plastic (HDPE) has no core to rust or swell."
- **Why:** "Within a few seasons" is unsourced. The replacement matches the site's own material pages (powder coated: "not recommended for wet or coastal sites"; laminate: "Not recommended for showers, pools, or continuously wet environments") and Scranton's "Impermeable to moisture" ([Hiny Hiders](https://www.scrantonproducts.com/products/hiny-hiders-partitions/), checked 2026-10-26).

**G6. Stainless near pools**
- **Current text (card):** "Type 304 stainless resists corrosion and sanitizes easily in high-humidity rooms. Best for: Upscale clubs, hotel fitness centers, and athletic showcase facilities."
- **Change to:** "Type 304 stainless resists corrosion and sanitizes easily. Near indoor pools, chloride-laden air can stain or pit stainless, so it suits restrooms away from the pool hall, with regular washdowns. Best for: Upscale clubs, hotel fitness centers, and athletic showcase facilities."
- **Current text (What Gyms Need):** "Stainless or polymer hardware that will not pit"
- **Change to:** "Stainless or polymer hardware that resists corrosion (ask the manufacturer which hardware grade it recommends for pool areas)"
- **Why:** Austenitic stainless (304 and 316) has failed by stress-corrosion cracking in indoor pool air, and unwashed surfaces stain ([ASSDA](https://www.assda.asn.au/blog/353-stainless-steel-for-indoor-swimming-pools); [Nickel Institute](https://www.nickelinstitute.org/media/8daa77b1620dde6/14015_ambient_temperaturestress_corrosioncrackingofausteniticstainlesssteelinswimmingpools.pdf), checked 2026-10-26). "Will not pit" is too strong. The "not zinc" bullet is fine: Bobrick's model spec rejects "Chrome-plated 'Zamak'" hardware.

**G7. HDPE warranty wording**
- **Current text:** "One-inch through-color HDPE with a 25-year warranty against rust, corrosion, and delamination."
- **Change to:** "One-inch through-color HDPE, with a 25-year limited warranty on lines such as Scranton Products Hiny Hiders (covering breakage, corrosion and delamination under normal conditions)."
- **Why:** Scranton's warranty covers "breakage, corrosion and delamination under normal conditions" ([Hiny Hiders](https://www.scrantonproducts.com/products/hiny-hiders-partitions/); [Scranton warranty](https://www.scrantonproducts.com/wp-content/uploads/2022/07/Scranton-Products-Warranty.pdf), checked 2026-10-26). Terms vary by manufacturer. C4 (CTA) also applies to this page.

### Confirm with Abe

**G8. Shower and changing cubicles.** "waterproof partition, urinal screen, and shower cubicle packages", "Matching urinal screens, shower stalls, and changing cubicles" and the FAQ "Do you supply shower and changing cubicles?" The configurator offers urinal screens but not shower cubicles. Keep these only if Abe sells shower and changing cubicles.

**G9. Budget.** "$950–$2,600 per stall by material".

**G10. Lead time.** "2–4 weeks for HDPE and phenolic". Consistent with the material pages (10–15 business days each), but confirm.

**G11. Customer claim.** "We supply gyms, fitness franchises, aquatic centers, and university athletics…" Confirm, or change it to "We supply waterproof partition packages for gyms, fitness franchises, aquatic centers, and university athletics…".

### OK (keep)
- HDPE as the wet-area default: moisture-impermeable, with no core.
- HDPE can be hosed down. A Scranton case study says it is "fully power washable and steam cleanable".
- Phenolic suits wet areas (Bobrick: compact laminate for "wet, high-traffic areas").
- Laminate only in dry restrooms (matches the site's laminate page).
- Powder coated "Avoid in locker and pool areas" (matches the site's powder coated page).
- Ceiling hung needs structural steel above.
- Check slab drainage before choosing floor mounted.
- Stainless rather than zinc hardware where chlorine is present (matches Bobrick's spec language).
- "Material choice is not a style decision" is a strong framing that's true for wet rooms.

---

## Offices (`/industries/offices`)

### Must fix

**O1. ADA bullet.** Apply C1.

**O2. Standard and privacy heights**
- **Current text:** "Standard panels are 55 inches high at 12 inches off the floor; privacy specs go to 72 inches at 6 inches off the floor."
- **Change to:** "Standard doors and panels are 55 or 58 inches high, mounted about 12 to 14 inches off the floor depending on the manufacturer. Extended-privacy specs use 72-inch doors and panels with a lower floor gap. The wheelchair-accessible compartment still needs at least 9 inches of toe clearance under the front partition and at least one side partition, unless it is larger than the exception sizes in the 2010 ADA Standards ([604.8.1.4](https://www.access-board.gov/ada/#ada-604_8_1_4))."
- **Why:**
  - Bobrick: "72" doors and panels, compared to standard heights of 55" or 58"" ([Bobrick CEU, 2018](https://www.bobrick.com/wp-content/uploads/SCC-Toilet-Partitions_Commercial.pdf)).
  - Scranton specifies 55-inch panels at 14 inches ([2012 spec](http://www.scrantonproducts.com/wp-content/uploads/2015/05/hiny-hiders-partitions-general-specifications.pdf)).
  - The site's own FAQ and powder coated page say 58 inches at 12 inches, so this page contradicts them.
  - A 6-inch gap under the accessible compartment's front and side partitions fails 604.8.1.4.
  - All checked 2026-10-26.

**O3. Installation implied**
- **Current text:** "We supply corporate campuses, coworking operators, and property managers with partition packages that match the interior design package, ship as complete floor-by-floor kits, and install with minimal disruption to tenants."
- **Change to:** "We supply partition packages for corporate campuses, coworking operators, and property managers that match the interior design package and ship as complete floor-by-floor kits with hardware. Installation is by your contractor or installer."
- **Why:** Next Partitions sells partitions and doesn't install them (CLAUDE.md; README rule 6). "Install with minimal disruption" reads as a service we provide. Abe also needs to confirm "floor-by-floor kits" (see O11).

**O4. ADA disclaimer.** Add C2.

### Should fix

**O5. Other installation wording**
- **Current text (meta):** "Privacy options, ADA specs, budgets, and low-disruption install guidance."
- **Change to:** "Privacy options, ADA specs, budgets, and planning guidance."
- **Current text (What Offices Need):** "Fast, low-disruption installation in occupied buildings"
- **Change to:** "Complete kits a contractor can install quickly in an occupied building"
- **Why:** Same reason as O3. The FAQ "Can partitions be installed after hours in an occupied building?" can stay, but its answer must say that installation is arranged with the customer's own contractor.

**O6. "Every floor"**
- **Current text:** "ADA-compliant compartments on every floor"
- **Change to:** "A wheelchair-accessible compartment in every restroom that has toilet compartments"
- **Why:** The ADA doesn't require restrooms on every floor. Where a toilet room has compartments, at least one must comply with 604.8.1 ([213.3.1](https://www.access-board.gov/ada/#ada-213_3_1), checked 2026-10-26).

**O7. Stainless "never corrode"**
- **Current text:** "Satin, diamond, or leathergrain finishes that signal premium and never corrode."
- **Change to:** "Satin, diamond, or leathergrain finishes that signal premium and resist corrosion."
- **Why:** Same as S8.

**O8. Phenolic "color-through"**
- **Current text:** "Slim, color-through panels with a hard surface and a contemporary edge detail."
- **Change to:** "Slim, solid phenolic panels with a hard surface and a contemporary edge detail (black core standard; color-through available on some lines)."
- **Why:** Same as S7.

**O9. Powder coated card**
- **Current text:** "Lowest installed cost with a durable baked enamel finish in 16+ colors."
- **Change to:** "Lowest first cost, with a durable baked enamel finish in a wide range of standard colors."
- **Why:** We don't sell installation, so "installed cost" isn't ours to claim. The site's powder coated page says "15 standard color choices", and the Metpar brand page says 18, so the count depends on the manufacturer. The cost claim is supported: Bobrick's price index has painted metal as the lowest-cost material (1.0).

**O10. Hardware bullet**
- **Current text:** "Quiet operation — soft-close or emergency-access hardware"
- **Change to:** "Quiet-closing doors, plus emergency-access hardware"
- **Why:** Emergency-access hardware isn't about quiet operation. As written, it reads as two alternatives. C4 (CTA) also applies to this page.

### Confirm with Abe

**O11. Kits and laminate range.** "ship as complete floor-by-floor kits" and "200+ Wilsonart and Formica decors". The laminate page names Wilsonart, Formica and Nevamar, and I found no source for "200+".

**O12. Budget.** "$650–$2,400 per stall by material".

**O13. Lead time.** "2–5 days quick ship; 2–4 weeks custom". The FAQ says "Stock items ship in 48–72 hours. Custom configurations typically deliver in 10–15 business days", and the laminate page says 10–20 business days, with a 48-hour Moisture Guard palette. Pick one set of numbers.

**O14. Customer claim.** "corporate campuses, coworking operators, and property managers". Confirm, or use the neutral wording in O3.

### OK (keep)
- Office restrooms prioritize appearance and finish coordination.
- Acoustic tile ceilings rule out ceiling hung unless there is structure above.
- Overhead braced as the standard office spec.
- Floor-to-ceiling and higher-privacy partitions are a real trend. Bobrick: privacy partitions are "Popular in educational and office buildings".
- Coordinate color with tile and vanity tops before ordering.
- Repeat one spec across floors.
- The cost ranking ($ powder coated < $$ laminate) matches Bobrick's index (1.0 vs 1.1).

---

## Restaurants (`/industries/restaurants`)

### Must fix

**R1. Quote time**
- **Current text:** "Send us your dimensions or a floor plan and we'll return a stall-by-stall quote, usually the same business day."
- **Change to:** "Send us your dimensions or a floor plan and we'll return a stall-by-stall quote. Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours."
- **Why:** README rule 4: one quote promise, and no other quote time.

**R2. ADA dimensions**
- **Current text:** "Standard stall widths run 36 inches; ADA compartments are typically 60 inches wide by 56 to 59 inches deep."
- **Change to:** "Standard stalls are usually 36 inches wide. A wheelchair-accessible compartment must be at least 60 inches wide and at least 56 inches deep with a wall-hung toilet, or 59 inches deep with a floor-mounted toilet (2010 ADA Standards [604.8.1.1](https://www.access-board.gov/ada/#ada-604_8_1_1))."
- **Why:** 60 and 56/59 are minimums, not "typical" sizes. 604.8.1.1, checked 2026-10-26.

**R3. Door-swing rule**
- **Current text:** "Confirm door swing: ADA compartments require an outswing door where depth is under 60 inches."
- **Change to:** "Confirm door swing: the accessible compartment's self-closing door needs at least 32 inches of clear opening and can't swing into the minimum compartment space, so a minimum-size compartment needs an outswing door. An inswing door needs a larger compartment (2010 ADA Standards [604.8.1.2](https://www.access-board.gov/ada/#ada-604_8_1_2), [404.2.3](https://www.access-board.gov/ada/#ada-404_2_3))."
- **Why:** The ADA has no 60-inch depth threshold. The rule is "Toilet compartment doors shall not swing into the minimum required compartment area" (604.8.1.2). As written, the bullet would let a 60-inch-deep, minimum-width compartment have an inswing door that blocks the required space. Checked 2026-10-26.

**R4. ADA disclaimer.** Add C2.

### Should fix

**R5. ADA requirement bullet**
- **Current text:** "At least one ADA-compliant compartment in a multi-stall restroom"
- **Change to:** "At least one wheelchair-accessible compartment wherever a restroom has toilet compartments, plus an ambulatory compartment once there are six or more compartments, or six or more toilets and urinals combined"
- **Why:** 213.3.1 applies "where toilet compartments are provided", even if there is only one. The page doesn't mention the ambulatory rule at all ([213.3.1](https://www.access-board.gov/ada/#ada-213_3_1), checked 2026-10-26).

**R6. Standard panel height**
- **Current text:** "Standard panel height is 55 inches set 12 inches off the floor — raise the panel height for a more private, upscale feel."
- **Change to:** "Standard doors and panels are 55 or 58 inches high, set about 12 to 14 inches off the floor depending on the manufacturer. Raise the height for a more private, upscale feel."
- **Why:** Same sources as O2. The site's own FAQ says 58 inches at 12.

**R7. Hose-down floors and laminate**
- **Current text:** "Moisture tolerance for nightly mopping and hose-down floors"
- **Change to:** "Moisture tolerance for nightly mopping (if floors are hosed down, choose phenolic or solid plastic)"
- **Why:** The page's most popular recommendation, plastic laminate, is "Not recommended for showers, pools, or continuously wet environments" (site laminate page), and its card already says "the restroom stays dry".

**R8. Stainless and phenolic cards**
- **Current text:** "Satin, diamond, or leathergrain finishes that read premium and never rust."
- **Change to:** "Satin, diamond, or leathergrain finishes that read premium and resist rust."
- **Current text:** "Color-through solid phenolic core handles constant moisture and aggressive cleaners."
- **Change to:** "Solid phenolic core (black core standard; color-through on some lines) handles constant moisture and aggressive cleaners."
- **Why:** Same as S8 and S7.

**R9. Powder coated card**
- **Current text:** "Lowest installed cost with a clean baked-enamel finish in 16+ standard colors."
- **Change to:** "Lowest first cost, with a clean baked-enamel finish in a wide range of standard colors."
- **Why:** Same as O9.

**R10. Contradictory mounting claims**
- **Current text:** "The default for restaurants: strongest, most economical, and works with any ceiling type."
- **Change to:** "The default for restaurants: economical, sturdy, and works with any ceiling type."
- **Why:** The same page calls floor-to-ceiling "Maximum privacy and rigidity", and the schools and public restroom pages call it "Most rigid". The two can't both be strongest. C4 (CTA) also applies to this page.

### Confirm with Abe

**R11. Kit and nationwide claims.** "cut to your room dimensions and shipped nationwide… quote, configure, and ship as a complete kit with hardware". The FAQ confirms nationwide freight; confirm "cut to your room dimensions".

**R12. Budget.** "$650–$2,200 per stall by material".

**R13. Lead time.** "2–5 days quick ship; 2–4 weeks custom". This conflicts with the FAQ (48–72 hours stock, 10–15 business days custom). The FAQ answer "How long do restaurant partitions take to ship?" must match whatever Abe confirms.

### OK (keep)
- The "brand touchpoint" framing and the 1 a.m. closing-crew line: specific and true.
- Laminate for dry dining-side restrooms (matches the site's laminate page).
- Powder coated "Fair — dry rooms only": correct and well caveated.
- Phenolic for wet, high-volume rooms (Bobrick: compact laminate for "wet, high-traffic areas").
- Ceiling hung needs structural steel above.
- Measure wall to wall at the floor and at 30 inches.
- Coat hook, occupancy latch and door stop on every door. When the coat hook goes in the accessible compartment, it must be within reach ranges (604.8.3).

---

## Community Centers (`/industries/community-centers`)

### Must fix

**CC1. ADA bullet.** Apply C1.

**CC2. Youth-program heights**
- **Current text:** "Youth-program restrooms often use 48-inch panels at 6 to 8 inches off the floor for supervision."
- **Change to:** "Youth-program restrooms often use lower doors and panels for supervision; confirm the heights available with the manufacturer. If the accessible compartment is designed for children (ages 3 to 12) under the ADA children's provisions, it must be at least 60 inches wide and 59 inches deep. Its front partition and at least one side partition need at least 12 inches of toe clearance above the floor, unless the compartment is more than 65 inches deep (front) or 66 inches wide (side) (2010 ADA Standards [604.9](https://www.access-board.gov/ada/#ada-604_9), [604.8.1.4](https://www.access-board.gov/ada/#ada-604_8_1_4))."
- **Why:** Same as S2.

**CC3. HDPE fire rating.** Add C3. HDPE is recommended for "Rec centers, gyms, pools, and heavily used public restrooms".

**CC4. ADA disclaimer.** Add C2.

### Should fix

**CC5. Child-height bullet**
- **Current text:** "Child-height options for daycare and preschool restrooms"
- **Change to:** "Child-height options for preschool, daycare and youth-program restrooms (the ADA children's provisions cover ages 3 to 12)"
- **Why:** The Advisory to 604.9 covers "children ages 3 through 12" ([604.9](https://www.access-board.gov/ada/#ada-604_9), checked 2026-10-26).

**CC6. HDPE card**
- **Current text:** "Waterproof through-color panels with a 25-year warranty; graffiti and scratches sand out."
- **Change to:** "Waterproof through-color panels, with a 25-year limited warranty on lines such as Scranton Products Hiny Hiders. Graffiti wipes off with a non-abrasive cleaner, and scratches are hard to see."
- **Why:** Same as S6.

**CC7. Powder coated card**
- **Current text:** "Lowest installed cost with a durable baked enamel finish in 16+ standard colors."
- **Change to:** "Lowest first cost, with a durable baked enamel finish in a wide range of standard colors."
- **Why:** Same as O9.

**CC8. ADA requirement bullet**
- **Current text:** "ADA-compliant compartments in every public restroom"
- **Change to:** "A wheelchair-accessible compartment in every restroom with toilet compartments, plus an ambulatory compartment once there are six or more compartments, or six or more toilets and urinals combined"
- **Why:** [213.3.1](https://www.access-board.gov/ada/#ada-213_3_1). The page doesn't mention the ambulatory rule, and community buildings often have 6+ fixture rooms. C4 (CTA) also applies to this page.

### Confirm with Abe

**CC9. Replacement parts and matching.** "including replacement panels and hardware for older restrooms" and the FAQ "Can we match our existing partitions when replacing a few panels?" Matching depends on the original manufacturer, color and hardware pattern. Confirm what Abe can supply, and that the FAQ answer doesn't promise an exact match.

**CC10. Budget.** "$650–$2,000 per stall by material".

**CC11. Lead time.** "2–5 days quick ship; 2–4 weeks custom" (same conflict as O13).

### OK (keep)
- The opening paragraph (toddlers, seniors, event guests, tight municipal and church budgets): specific and realistic.
- Powder coated for dry rooms versus HDPE for wet programming: a clear, correct rule of thumb that matches the material pages.
- Laminate for renovated front-of-house restrooms.
- Measure at the floor and at 30 inches; older masonry walls are rarely square.
- Replace only doors and hardware for a partial refresh (the site sells replacement doors and parts).
- "Simple installation that a facilities crew or local contractor can handle" doesn't promise installation by Next Partitions. Keep it.
- "We'll price both a budget and a long-life option" is good, specific quote copy.

---

## Public Restrooms (`/industries/public-restrooms`)

### Must fix

**P1. ADA bullet.** Apply C1.

**P2. Ambulatory compartment rule**
- **Current text:** "Add an ambulatory-accessible stall once a restroom has six or more compartments."
- **Change to:** "Add an ambulatory-accessible compartment (35 to 37 inches wide, at least 60 inches deep) once a restroom has six or more compartments, or six or more toilets and urinals combined (2010 ADA Standards [213.3.1](https://www.access-board.gov/ada/#ada-213_3_1), [604.8.2](https://www.access-board.gov/ada/#ada-604_8_2))."
- **Why:** Same as S3. Public men's rooms usually mix stalls and urinals.

**P3. Reduced floor clearance**
- **Current text:** "Consider raised panel heights and reduced floor clearance to limit reach-under and pass-through."
- **Change to:** "Consider raised panel heights and reduced floor clearance to limit reach-under and pass-through. The wheelchair-accessible compartment still needs at least 9 inches of toe clearance under the front partition and at least one side partition, unless it is larger than the exception sizes in the 2010 ADA Standards ([604.8.1.4](https://www.access-board.gov/ada/#ada-604_8_1_4))."
- **Why:** 604.8.1.4, checked 2026-10-26.

**P4. HDPE fire rating.** Add C3. HDPE is recommended for parks and municipal buildings.

**P5. ADA disclaimer.** Add C2.

### Should fix

**P6. Intro hyperbole and "hose rated"**
- **Current text:** "Public restrooms in parks, transit stations, stadiums, rest areas, and municipal buildings see traffic measured in thousands of users a day, plus daily washdowns and vandalism that would destroy a school restroom in a week. The partition has to be vandal resistant, hose rated, and still look consistent after a decade of service."
- **Change to:** "Public restrooms in parks, transit stations, stadiums, rest areas, and municipal buildings see heavy traffic, daily washdowns, and vandalism. The partition has to resist abuse, stand up to hosing down, and still look consistent after years of service."
- **Why:** "Thousands of users a day" and "destroy a school restroom in a week" are unsourced numbers and claims (README rules 2 and 3). "Hose rated" isn't a recognized rating. "A decade of service" implies a service-life promise.

**P7. Phenolic card**
- **Current text:** "Color-through compact laminate resists cutting, burning, moisture, and graffiti."
- **Change to:** "Compact laminate (phenolic) resists scratches, impact, moisture, and graffiti. Standard panels have a black core; color-through cores are available on some lines."
- **Why:** Bobrick lists compact laminate as "scratch-, moisture-, impact- and graffiti-resistant" ([Bobrick compact grade laminate](https://www.bobrick.com/products/toilet-partitions-cubicle-systems/materials-and-hardware/compact-grade-laminate/), checked 2026-10-26). I found no manufacturer source for "cutting, burning" in the current literature, and the color-through point is the same as S7.

**P8. Stainless "corrosion proof"**
- **Current text (card):** "Type 304 stainless over a honeycomb core — corrosion proof and easy to sanitize."
- **Change to:** "Type 304 stainless over a honeycomb core: corrosion resistant and easy to sanitize."
- **Current text (table):** "Premium, sanitary, corrosion proof"
- **Change to:** "Premium, sanitary, corrosion resistant"
- **Why:** Same as S8. This page also targets "coastal, outdoor, and unconditioned sites", where stainless can tea-stain without washdowns ([ASSDA](https://www.assda.asn.au/blog/353-stainless-steel-for-indoor-swimming-pools)).

**P9. Lifecycle claims**
- **Current text:** "Phenolic and stainless steel are the two materials that reliably pay back their premium in this category, with HDPE as the value alternative."
- **Change to:** "Phenolic and stainless steel are the premium choices for this category, with HDPE as the value alternative."
- **Current text (table):** "Best lifecycle cost in high abuse"
- **Change to:** "Toughest surface for high-abuse restrooms"
- **Why:** "Reliably pay back" and "best lifecycle cost" are unsourced. The page itself says to judge on cost per year of service, but gives no service-life data. The section intro "Judge these projects on cost per year of service, not cost per stall" is fine advice. Keep it.

**P10. Powder coated card**
- **Current text:** "Cheapest up front, but dents and rusts quickly under public-restroom conditions."
- **Change to:** "Cheapest up front, but made for dry, low-abuse rooms: not recommended where restrooms are hosed down or vandalized."
- **Why:** "Quickly" is unsourced. The replacement matches the site's powder coated page ("Best for dry, climate-controlled restrooms — not recommended for wet or coastal sites"). C4 (CTA) also applies to this page.

### Confirm with Abe

**P11. Bid-package claim.** "We provide quotes suitable for municipal bid packages, with material options priced side by side." Confirm that Abe's quotes meet bid requirements (itemized, signed, valid-for period). If not, change it to "We quote material options side by side so agencies can compare them on lifecycle cost."

**P12. Budget.** "$1,100–$2,800 per stall by material".

**P13. Lead time.** "3–5 weeks for phenolic and stainless". The phenolic page says 10–15 business days (2–3 weeks) and the stainless page 15–25 business days (3–5 weeks), so the phenolic figure conflicts.

### OK (keep)
- Tamper-resistant fasteners and continuous hinges on every door.
- Emergency-access hardware (Bobrick's model spec includes emergency access).
- Floor-to-ceiling as the most rigid configuration.
- Ceiling hung needs an engineered overhead structure.
- "Floor Mounted: Only for small, supervised restrooms": appropriately cautious.
- Stock a spare hardware kit.
- Long-term parts availability as a buying criterion.
- "Judge these projects on cost per year of service, not cost per stall": good framing.

---

## Budgets and lead times (confirm with Abe)

**Budgets.** These ranges need confirming against Abe's price list before they stay on the site:

| Page | Range on page |
|---|---|
| Schools | $900–$2,400 per stall |
| Gyms | $950–$2,600 |
| Offices | $650–$2,400 |
| Restaurants | $650–$2,200 |
| Community centers | $650–$2,000 |
| Public restrooms | $1,100–$2,800 |

**Do they look plausible from public sources?** Broadly yes, as whole-stall figures (doors, panels, pilasters and hardware), and more so if they include installation. Two things need answering first:

1. **Do the ranges include installation?** Next Partitions doesn't install, so if these are installed-cost figures they overstate what the customer pays us. If they are supply-only, add "Partitions and hardware only; installation not included" after "Pricing is budgetary…".
2. **They contradict the site's own FAQ.** The FAQ says "Powder coated steel typically starts around $275/stall while stainless steel and wood reach $900–$1,200/stall". That is below every industry-page low end ($650+) and below most of their high ends.

Public reference points (checked 2026-10-26):
- **Bobrick's price index (2018):** painted metal 1.0, plastic laminate 1.1, untreated HDPE 1.9, compact laminate (phenolic) 2.4, stainless 2.7. Bobrick also gives "$650–$1,500/stall" for standard 58-inch partitions and "$1,500–$2,200/stall" for 72-inch privacy partitions, "materials and installation", for a 5-stall room ([Bobrick CEU presentation](https://www.bobrick.com/wp-content/uploads/SCC-Toilet-Partitions_Commercial.pdf)). Prices have risen since 2018, and Bobrick notes that painted metal prices have increased.
- **What that means for these ranges:**
  - The $650 low end (powder coated) fits installed pricing.
  - The $2,200–$2,800 high ends fit stainless or phenolic, ADA compartments and privacy heights.
  - Public restrooms starting at $1,100 fits that page's phenolic, stainless and HDPE focus.
  - The ordering of the $–$$$$ symbols on every page matches Bobrick's index.
- **One Point Partitions (a seller):** a search listing showed starting prices *per part* (door, panel or pilaster) of $275–$375 for powder coated and about $700 for phenolic and stainless. Its price page returned 403 when fetched, so I couldn't verify this directly. Treat it as indicative only.

**Lead times.** These can't be checked from public sources, and they disagree with the site's other pages:

| Where | Lead time |
|---|---|
| FAQ | stock 48–72 hours; custom 10–15 business days |
| Offices, restaurants, community centers | "2–5 days quick ship; 2–4 weeks custom" |
| Schools, gyms | "2–4 weeks" |
| Public restrooms | "3–5 weeks for phenolic and stainless" |
| Material pages | powder coated 5–10, HDPE 10–15, phenolic 10–15, laminate 10–20, stainless 15–25 business days |

Abe should give one table of lead times, and every page should use it. README rule 3 already bars lead times beyond what the site promises, so until he does, the safest change is to replace each industry page's lead time line with "See lead times by material on each [material page](/partitions)."

**"Freight is quoted separately."** This is on all six pages. Confirm it (the FAQ mentions freight shipping, standard and expedited, and a liftgate add-on).

---

## Seen on the hub and material pages (not counted above; for the thin-page batches)

The hub (`/industries`) has no factual problems. Its card text is accurate and the links work as listed.

The material pages contradict themselves or the sources in ways the industry pages inherit. Fix them when those pages are expanded:

- **Phenolic (`/partitions/phenolic`):**
  - It says "Solid through-color phenolic core" and "Because the color runs through the panel, scratches and graffiti can be sanded out", but its own color list is mostly ASI Black Core.
  - "Class A Fire Rating: Meets ASTM E84 Class A" is stated without conditions. Bobrick's 1080 compact laminate is Class B and its 1180 is Class A ([1080 data sheet](https://www.bobrick.com/wp-content/uploads/1080_td.pdf)), so "Class A available" (also on the page) is the accurate wording.
  - "15-year warranty" is listed as fact. Bobrick's compact laminate carries 25 years, so warranty terms vary by brand.
- **Plastic laminate (`/partitions/plastic-laminate`):**
  - "Class A fire rating standard": Bobrick lists high-pressure laminate as Class B (flame spread 60) ([Bobrick CEU, 2018](https://www.bobrick.com/wp-content/uploads/SCC-Toilet-Partitions_Commercial.pdf)). Confirm the rating per brand before keeping "Class A standard".
  - The warranty is "2 Years" in the spec table and "5-Year Warranty" in the feature list.
- **Powder coated steel (`/partitions/powder-coated-steel`):**
  - The warranty is "1 Year" in the spec table and "3-Year Limited Warranty" in the feature list.
  - "15 standard color choices" (the Metpar brand page says 18).
  - The ADA Options paragraph says "60" minimum stall depth": the minimums are 56 or 59 inches (604.8.1.1).
- **HDPE (`/partitions/solid-plastic-hdpe`):**
  - "17 standard solid colors", but 20 are listed.
  - No mention of NFPA 286 or fire-rated HDPE (C3).
  - "Contains 25%+ post-consumer recycled HDPE" is unsourced.
  - "graffiti… deep marks sand out" (see S6).
- **Stainless (`/partitions/stainless-steel`):** "Will not rust, even in coastal or pool environments" and "Won't rust even in coastal, pool…" contradict ASSDA and the Nickel Institute on indoor pools (see G6).
- **All five material pages:** "Every order includes everything you need for installation". This is fine for an actual order, but the CTAs on these pages are "Configure & Quote", which is correct. Leave the CTAs as they are.
- **`/get-a-quote` meta:** "get instant pricing or a custom quote in 24–48 hours". This leaves out the 2-business-hour promise for standard configurations, and the "instant pricing" claim conflicts with the configurator being a quote request.
- **Bobrick brand page:** it says "DuraLine HDPE, SierraSeries powder coated steel, 1080 Series stainless". Bobrick's own site says DuraLine (1080/1180) is compact grade laminate and SierraSeries (1090) is solid color reinforced composite ([Bobrick materials](https://www.bobrick.com/products/toilet-partitions-cubicle-systems/materials-and-hardware/compact-grade-laminate/)). This breaks README rule 7 (name a product line only if the brand confirms it). Fix it in the brands batch.

## Sources (all checked 2026-10-26)

- U.S. Access Board, 2010 ADA Standards for Accessible Design: https://www.access-board.gov/ada/
  - Sections cited: [213.3.1](https://www.access-board.gov/ada/#ada-213_3_1), [404.2.3](https://www.access-board.gov/ada/#ada-404_2_3), [604.1](https://www.access-board.gov/ada/#ada-604_1), [604.8.1.1](https://www.access-board.gov/ada/#ada-604_8_1_1), [604.8.1.2](https://www.access-board.gov/ada/#ada-604_8_1_2), [604.8.1.4](https://www.access-board.gov/ada/#ada-604_8_1_4), [604.8.2](https://www.access-board.gov/ada/#ada-604_8_2), [604.9](https://www.access-board.gov/ada/#ada-604_9)
- Seattle Building Code 2018, Chapter 8 (IBC 803.9 text on HDPE/PP and NFPA 286): https://www.seattle.gov/documents/Departments/SDCI/Codes/SeattleBuildingCode/2018SBCChapter8.pdf
- Bobrick, Fact Sheet on ICC and NFPA Model Code Revisions (HDPE/PP and NFPA 286), Feb 2012: https://www.bobrick.com/wp-content/uploads/FACT_SHEET_ICC_IFC_AND_NFPA_MODEL_CODE_REVISIONS-1.pdf
- Bobrick, "Toilet Partitions: Commercial" CEU presentation (fire classes, price index, standard and privacy heights, model spec), 2018: https://www.bobrick.com/wp-content/uploads/SCC-Toilet-Partitions_Commercial.pdf
- Bobrick, Compact Grade Laminate: https://www.bobrick.com/products/toilet-partitions-cubicle-systems/materials-and-hardware/compact-grade-laminate/
- Bobrick, 1080 DuraLineSeries data sheet: https://www.bobrick.com/wp-content/uploads/1080_td.pdf
- Scranton Products, Hiny Hiders: https://www.scrantonproducts.com/products/hiny-hiders-partitions/
- Scranton Products, color visualizers (NFPA 286 footnote): https://www.scrantonproducts.com/marketing/product-color-visualizers/
- Scranton Products, warranty: https://www.scrantonproducts.com/wp-content/uploads/2022/07/Scranton-Products-Warranty.pdf
- Scranton Products, Hiny Hiders general specifications (2012): http://www.scrantonproducts.com/wp-content/uploads/2015/05/hiny-hiders-partitions-general-specifications.pdf
- ASI Global Partitions, Color-Thru Phenolic (Sweets): https://sweets.construction.com/manufacturer/asi-global-partitions-nst1616/products/color-thru-phenolic-toilet-partitions-nst708589-p
- ASSDA, Stainless steel for indoor swimming pools: https://www.assda.asn.au/blog/353-stainless-steel-for-indoor-swimming-pools
- Nickel Institute, Ambient temperature stress corrosion cracking of austenitic stainless steel in swimming pools: https://www.nickelinstitute.org/media/8daa77b1620dde6/14015_ambient_temperaturestress_corrosioncrackingofausteniticstainlesssteelinswimmingpools.pdf
