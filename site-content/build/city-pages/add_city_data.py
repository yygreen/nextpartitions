"""Add the 2026-11-24 city data (state extras, restroom rules, labor and sales tax) to the five city pages. Idempotent."""
P='/home/user/nextpartitions/site-content/pages/service-area_%s.md'
US="the national median of $29.12"
LAB="It's a guide to local labor rates, not a quote: installers set their own prices."
TX_REST="- **Single-user and all-gender restrooms:** a one-person restroom must be marked as open to everyone. In a private building, a shared all-gender room is allowed if every toilet sits in its own compartment with a door and urinals are in stalls or screened from view. Since December 2025, Texas law requires shared restrooms in city, county, school district and public college buildings to be designated for one sex."
TX_EXTRA="- **Texas and federal stall rules match:** Texas's own access rules for stalls, doors and grab bars read the same as the federal ones, so a stall that meets one meets the other."
TX_TAX=["- **Tax on installation:** in Texas, labor to remodel an existing commercial building is taxed, even when it's billed separately. Labor on new construction is not.",
        "- **Buying without installation:** partitions shipped to {city} are taxable, freight included. If the seller doesn't collect the tax, the buyer owes it to the state."]
TX_SRC=["- Texas stall rules compared with the federal ones: [2012 Texas Accessibility Standards](https://www.tdlr.texas.gov/ab/2012TAS/2012tascomplete.pdf) and the [2010 ADA Standards](https://www.access-board.gov/ada/), sections 213, 603 to 604 and 609. Checked 2026-11-24.",
        "- Shared restrooms in government buildings: [Texas Government Code chapter 3002](https://tcss.legis.texas.gov/resources/GV/htm/GV.3002.htm). Checked 2026-11-24.",
        "- Wages on public jobs: [Texas Government Code chapter 2258](https://tcss.legis.texas.gov/resources/GV/htm/GV.2258.htm). Checked 2026-11-24.",
        "- Sales tax: Texas Comptroller, [city rates](https://comptroller.texas.gov/taxes/sales/city.php), [remote sellers](https://comptroller.texas.gov/taxes/sales/remote-sellers.php), [use tax](https://comptroller.texas.gov/taxes/sales/use-tax.php) and [Publication 94-116, Real Property Repair and Remodeling](https://comptroller.texas.gov/taxes/publications/94-116.php). Checked 2026-11-24."]
D={
'houston':dict(city='Houston',
 rules=[TX_EXTRA,TX_REST],
 money=["- **Local labor rates:** carpenters in the Houston area earn a median of $23.88 an hour, about 18% below "+US+". "+LAB,
  "- **Public jobs:** on city, county and school district projects, Texas law requires at least the locally set wage. For a carpenter on building work in Harris County that is $33.27 an hour plus $9.73 in benefits, and the City of Houston uses the same rate.",
  "- **Sales tax:** 8.25% in Houston: 6.25% state, 1% city and 1% transit authority."]+TX_TAX,
 confirm="your accountant or the Texas Comptroller",
 src=["- Carpenter wages, May 2025: U.S. Bureau of Labor Statistics, [Houston area release](https://www.bls.gov/regions/southwest/news-release/2026/occupationalemploymentandwages_houston_20260813.htm) and [national release](https://www.bls.gov/news.release/archives/ocwage_05152026.pdf); metro median from [O*NET OnLine](https://www.onetonline.org/link/localwages/47-2031.00?zip=77002), which republishes the Bureau's figures. Checked 2026-11-24.",
  "- Harris County carpenter rate: [federal wage determination TX20260253](https://sam.gov/wage-determination/TX20260253/1) and the [City of Houston 2026 building wage scale](https://houstontx.gov/sites/default/files/migrated/obo/contractcomplianceforms/2026-Wage-Scale-for-Building-Construction.pdf). Checked 2026-11-24.",
  "- Single-user restroom signs: [Houston's 2021 building code comparison](https://www.houstonpermittingcenter.org/media/9556/download), Section 2902.1.2. Checked 2026-11-24."]+TX_SRC,
 notes=["City data (2026-11-24, `research/city-data/houston.json`): Houston ISD's own wage schedule wasn't found; what Houston plan review requires of stalls in a shared all-gender room is open (Houston enforces the Uniform Plumbing Code); Comptroller Publication 94-116 is dated 2007. How Next Partitions itself charges Texas tax is a question for Abe's accountant."]),
'dallas':dict(city='Dallas',
 rules=[TX_EXTRA,TX_REST],
 money=["- **Local labor rates:** carpenters in the Dallas–Fort Worth area earn a median of $23.44 an hour, about 20% below "+US+". "+LAB,
  "- **Public jobs:** on city, county and school district projects, Texas law requires at least the locally set wage. The federal rate for a carpenter on building work in Dallas County is $17.13 an hour plus $2.97 in benefits, and City of Dallas contracts pay at least the city's living wage, $23.06 an hour.",
  "- **Sales tax:** 8.25% in Dallas: 6.25% state, 1% city and 1% transit authority (DART)."]+TX_TAX,
 confirm="your accountant or the Texas Comptroller",
 src=["- Carpenter wages, May 2025: U.S. Bureau of Labor Statistics, [national release](https://www.bls.gov/news.release/archives/ocwage_05152026.pdf) and [Dallas–Fort Worth area release](https://www.bls.gov/regions/southwest/news-release/2026/occupationalemploymentandwages_dallasfortworth_20260813.htm); metro median from O*NET OnLine, which republishes the Bureau's figures. Checked 2026-11-24.",
  "- Dallas County carpenter rate: [federal wage determination TX20260241](https://sam.gov/wage-determination/TX20260241/1); City of Dallas living wage: [annual update memo](https://dallascityhall.com/government/citymanager/Documents/FY24-25%20Memos/Living%20Wage%20Annual%20Update.pdf). Checked 2026-11-24.",
  "- Single-user restroom signs and shared all-gender rooms: Dallas Building Code and Plumbing Code amendments ([Ordinance 32421](https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/pdf/code_amendments/2021_codes/23-0468.pdf), [Ordinance 32422](https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/pdf/code_amendments/2021_codes/23-0469.pdf)). Checked 2026-11-24."]+TX_SRC,
 notes=["City data (2026-11-24, `research/city-data/dallas.json`): read the metro wage once in a browser on the Bureau's own table (area 0019100); Dallas ISD's wage schedule wasn't read; a reported change to the city's living wage policy in September 2026 wasn't found in a city document. How Next Partitions itself charges Texas tax is a question for Abe's accountant."]),
'miami':dict(city='Miami',
 rules=["- **Florida extras, in new buildings:** the wheelchair-accessible stall needs its own sink inside it, which makes the stall larger than in most states, and the toilet must sit in the corner diagonally across from the stall door.",
  "- **Single-user and all-gender restrooms:** one-person and family restrooms must be marked as open to everyone. A shared all-gender room is allowed if every toilet sits in its own compartment with a door and urinals are in stalls or screened from view. A 2023 Florida law sets separate rules for schools, colleges, jails and government buildings; private businesses aren't covered by it."],
 money=["- **Local labor rates:** carpenters in the Miami–Fort Lauderdale area earn a median of $24.79 an hour, about 15% below "+US+". "+LAB,
  "- **Public jobs:** Florida has no state wage law for public construction and doesn't let cities or school districts set one. On federally funded work the federal rate applies: $18.04 an hour plus $3.24 in benefits for a carpenter on building work in Miami-Dade County.",
  "- **Sales tax:** 7% in Miami: 6% state and 1% county. The county's 1% applies only to the first $5,000 of each item.",
  "- **Tax on installation:** on a supply-and-install contract for work that becomes part of the building, the contractor pays the tax on the materials and charges you none on the contract.",
  "- **Buying without installation:** partitions shipped to Miami are taxable. If the seller doesn't collect the tax, the buyer owes it to the state."],
 confirm="your accountant or the Florida Department of Revenue",
 src=["- Carpenter wages, May 2025: U.S. Bureau of Labor Statistics national figures; the Miami metro median was read on a secondary copy of the Bureau's metro file ([wagedex](https://wagedex.com/jobs/carpenters/metro/miami-fort-lauderdale-west-palm-beach-fl)). Checked 2026-11-24.",
  "- Public jobs: [Florida Statutes 255.0992](https://www.flsenate.gov/Laws/Statutes/2025/255.0992) and [federal wage determination FL20260215](https://sam.gov/wage-determination/FL20260215/1). Checked 2026-11-24.",
  "- Florida's stall rules beyond the federal ones: [Florida Statutes 553.504(5)](https://www.flsenate.gov/Laws/Statutes/2025/553.504). Checked 2026-11-24.",
  "- Restroom rules: Florida Building Code, Plumbing, 8th Edition, Sections 403.1.2 and 403.2, read on a [secondary copy](https://up.codes/viewer/florida/fl-plumbing-code-2023/chapter/4/fixtures-faucets-and-fixture-fittings); [Florida Statutes 553.865](https://www.flsenate.gov/Laws/Statutes/2025/553.865). Checked 2026-11-24.",
  "- Sales tax: Florida Department of Revenue, [sales and use tax](https://floridarevenue.com/taxes/taxesfees/Pages/sales_tax.aspx), [discretionary sales surtax](https://floridarevenue.com/taxes/taxesfees/Pages/discretionary.aspx) and [GT-800067, Sales and Use Tax on Building Contractors](https://floridarevenue.com/Forms_library/current/gt800067.pdf). Checked 2026-11-24."],
 notes=["City data (2026-11-24, `research/city-data/miami.json`): read the Miami metro wage once in a browser on the Bureau's own table (area 0033100); the Department of Revenue doesn't say whether toilet partitions count as a building fixture or as goods, which decides how an installed job is taxed (ask the Department); the 9th Edition changes the restroom sign wording on December 31, 2026."]),
'seattle':dict(city='Seattle',
 rules=["- **Washington extras:** stalls here need a second, upright grab bar on the side wall, and a wheelchair stall needs more toe room under its partitions (12 inches high, against 9 under the federal rules). In a large restroom, 5% of the stalls must be wheelchair accessible, not just one. Large stores and venues also need a family restroom.",
  "- **Single-user and all-gender restrooms:** one-person restrooms in public places must be open to anyone and signed that way. A shared all-gender room is allowed if every toilet and urinal is in its own compartment with full-height walls and a door that locks from the inside."],
 money=["- **Local labor rates:** carpenters in the Seattle–Tacoma–Bellevue area earn a median of $36.74 an hour, about 26% above "+US+". "+LAB,
  "- **Public jobs:** Washington requires the state-set wage on every public job, with no minimum project size. The Department of Labor & Industries publishes the current King County carpenter rate in its online wage lookup.",
  "- **Sales tax:** 10.55% in Seattle (6.5% state and 4.05% local), rising to 10.66% on January 1, 2027.",
  "- **Tax on installation:** in Washington, installation labor is taxed like the partitions themselves, at the job site's rate.",
  "- **Buying without installation:** partitions shipped to Seattle are taxable, freight included. If the seller doesn't collect the tax, the buyer owes it to the state."],
 confirm="your accountant or the Washington Department of Revenue",
 src=["- Carpenter wages, May 2025: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, [Seattle-Tacoma-Bellevue area](https://data.bls.gov/oes/#/area/0042660/2025). Checked 2026-11-24.",
  "- Public jobs: [Washington L&I, awarding agencies](https://lni.wa.gov/licensing-permits/public-works-projects/awarding-agencies/) and its [wage lookup](https://secure.lni.wa.gov/wagelookup/rates/journey-level-rates). Checked 2026-11-24.",
  "- Washington's stall rules beyond the federal ones: [WAC 51-50-1101](https://app.leg.wa.gov/WAC/default.aspx?cite=51-50-1101), [Seattle Building Code Chapter 11](https://www.seattle.gov/documents/Departments/SDCI/Codes/SeattleBuildingCode/2021SBCChapter11.pdf) and ICC A117.1-2017 (read on a [secondary copy](https://up.codes/viewer/washington/icc-a117.1-2017/chapter/6/plumbing-elements-and-facilities)). Checked 2026-11-24.",
  "- Restroom rules: [Seattle Office for Civil Rights, all-gender restrooms](https://seattle.gov/civilrights/laws-we-enforce/all-gender-restrooms) and [WAC 51-50-2902](https://app.leg.wa.gov/WAC/default.aspx?cite=51-50-2902). Checked 2026-11-24.",
  "- Sales tax: Washington Department of Revenue, [local rates by county](https://dor.wa.gov/sites/default/files/2026-08/Q426_LSU-flyer-by-county.pdf), [King County change on January 1, 2027](https://dor.wa.gov/sites/default/files/2026-11/Q127_King_County_CFS_TBD.pdf), [out-of-state businesses](https://dor.wa.gov/education/industry-guides/out-state-businesses-reporting-thresholds-and-nexus) and [RCW 82.04.050](https://app.leg.wa.gov/RCW/default.aspx?cite=82.04.050). Checked 2026-11-24."],
 notes=["City data (2026-11-24, `research/city-data/seattle.json`): **update the sales tax line on January 1, 2027** (10.66%); the state wage for a King County carpenter is only in L&I's interactive lookup and wasn't read (phone 360-902-5335); the code gives no dimension for \"full-height\" (ask SDCI)."]),
'los-angeles':dict(city='Los Angeles',
 rules=["- **California extras:** California asks more of a stall than the federal rules. In a large restroom, 5% of the stalls must be wheelchair accessible, not just one. The accessible stall needs more open floor in front of the toilet, so it's deeper, and the aisle outside its door must be 48 inches wide, against 42. Stall doors need a privacy latch, and every restroom door carries California's circle or triangle symbol. Give your layout to your architect before you order.",
  "- **Single-user and all-gender restrooms:** a one-person restroom must be signed as all-gender. A shared all-gender room is allowed in place of separate men's and women's rooms if every toilet is in a floor-to-ceiling privacy compartment whose door locks from the inside and shows when it's occupied."],
 money=["- **Local labor rates:** carpenters in the Los Angeles–Long Beach–Anaheim area earn a median of $36.41 an hour, about 25% above "+US+". "+LAB,
  "- **Public jobs:** California requires the state-set wage on public jobs over $1,000, including city and school district work. For a carpenter in Los Angeles County that is $54.41 an hour plus $29.91 in benefits.",
  "- **Sales tax:** 10.25% in Los Angeles since October 1, 2026: 7.25% statewide plus 3% in county district taxes.",
  "- **Tax on installation:** in California, installation labor billed separately isn't taxed.",
  "- **Buying without installation:** partitions shipped to Los Angeles are taxable. If the seller doesn't collect the tax, the buyer owes it to the state."],
 confirm="your accountant or the California Department of Tax and Fee Administration",
 src=["- Carpenter wages, May 2025: U.S. Bureau of Labor Statistics, [national table](https://www.bls.gov/news.release/ocwage.t01.htm); metro median from [O*NET OnLine](https://www.onetonline.org/link/localwages/47-2031.00?zip=90012), which republishes the Bureau's figures. Checked 2026-11-24.",
  "- Public jobs: California Department of Industrial Relations, [prevailing wage FAQ](https://www.dir.ca.gov/OPRL/FAQ_PrevailingWage.html) and [determination SC-23-31-2-2026-2, Carpenter, Los Angeles County](https://www.dir.ca.gov/OPRL/2026-2/PWD/Determinations/Southern/SC-023-31-2.pdf). Checked 2026-11-24.",
  "- California's stall rules beyond the federal ones: 2025 California Building Code Chapter 11B, Sections 11B-213, 11B-604 and 11B-703, read in the [LADBS accessibility plan check list](https://dbs.lacity.gov/sites/default/files/efs/forms_and_publications/publications/checklists/building-code/2026/CL-BC-2026-026-Acc_Commercial.pdf) and a [secondary copy of the state's advisory manual](https://www.corada.com/documents/2025CBCPG/11b-604-water-closets-and-toilet-compartments). Checked 2026-11-24.",
  "- Restroom rules: [Division of the State Architect bulletin BU 17-01](https://www.dgs.ca.gov/-/media/Divisions/DSA/Publications/bulletins/BU_17-01-01.pdf) (single-user restrooms) and 2025 California Plumbing Code Sections 422.2 and 422.6, read on a secondary copy. Checked 2026-11-24.",
  "- Sales tax: California Department of Tax and Fee Administration, [rates](https://cdtfa.ca.gov/taxes-and-fees/rates.aspx), [out-of-state sellers](https://cdtfa.ca.gov/industry/wayfair.htm) and [Regulation 1546](https://cdtfa.ca.gov/lawguides/vol1/sutr/1546.html). Checked 2026-11-24."],
 notes=["City data (2026-11-24, `research/city-data/los-angeles.json`): Chapter 11B and the Plumbing Code were read on secondary copies and in LADBS's checklist (browser check on the official viewer before launch); the state tax agency doesn't say whether toilet partitions are \"materials\" or \"fixtures\", which decides who pays tax on a supply-and-install contract; whether LADBS accepts all-gender compartments that aren't full height is open."]),
}
def apply(slug):
    d=D[slug]; city=d['city']; s=open(P%slug).read()
    if "## What installation labor and sales tax add" in s: return 'already'
    a="- **Permits:**"
    assert s.count(a)==1
    s=s.replace(a,"\n".join(d['rules'])+"\n"+a,1)
    sec=f"## What installation labor and sales tax add in {city}\n\n"+"\n".join(x.replace('{city}',city) for x in d['money'])+f"\n\nHow tax applies depends on your contract, so confirm with {d['confirm']}.\n\n"
    a=f"## What {city} buyers order partitions for"
    assert a in s; s=s.replace(a,sec+a,1)
    a="- The rules by their official names:"
    assert a in s; s=s.replace(a,"\n".join(d['src'])+"\n"+a,1)
    s=s.rstrip('\n')+"\n"+"".join(f"- {n}\n" for n in d['notes'])
    open(P%slug,'w').write(s); return 'added'
if __name__=='__main__':
    import sys
    for c in (sys.argv[1:] or D): print(c,apply(c))
