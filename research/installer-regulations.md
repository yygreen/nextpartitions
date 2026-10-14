# Who may install toilet partitions: rules by state, city and building type

Collected 2026-10-14. These are research notes, not legal advice. Every item needs confirming with the authority before publishing, and some are marked as gaps below.

The rules come in four layers. Only a few states regulate partition installation directly. For installers, city registration and building-type rules (especially schools) matter more.

## 1. State contractor licensing

| State | Rule | Confidence |
|---|---|---|
| California | **C-61/D-34 Prefabricated Equipment** license. The CSLB description covers "all forms and types of toilet/shower room partitions/accessories". School districts list C-61/D-34 for this exact scope. A license is needed above a small dollar threshold ($500 cited in a court procurement doc; check whether it has since been raised). | High (official) |
| Nevada | Toilet partitions fall under the **C-8 Glass and Glazing** license (NAC 624.260). The former partition-only sub-license C-8d was folded into C-8. | Medium, confirm with NSCB |
| North Carolina | General contractor license for jobs of **$40,000 or more**, labor and materials included. Raised from $30,000 on 2023-10-01. | Medium (secondary sources) |
| Louisiana | Commercial license for jobs of **$50,000 or more**. Classification for partitions unclear; possibly "Limited Specialty Services". | Threshold high, class unknown |
| Arizona | ROC license required; classification for partitions **not confirmed**. | Gap |
| Washington | Every contractor must register with L&I; specialty contractors may only do their registered specialty. | High (official) |
| Oregon | CCB license with a commercial specialty endorsement (CSC1) exists; when it's required is not confirmed. | Gap |
| Florida | No state license unless the work matches a defined contractor category, and local governments can't require one otherwise (Fla. Stat. 489, 2023 changes). Partitions likely fall outside, but this needs confirming. | Medium |
| Texas | No statewide contractor license. | High |

## 2. City and county registration (needed to pull permits)

- **Dallas:** contractors must register with the city (Chapter 52, via the DallasNow portal) before they can get permits. About $120 a year; $300,000 general liability insurance with the City of Dallas as certificate holder; notarized form.
- **Chicago:** city general contractor license, with classes capped by project value. Applied for through the Department of Buildings.
- **New York City:** general contractors register with the Department of Buildings and carry at least $1M general liability insurance. Residential alterations also need a DCWP home improvement license.
- **Still to research:** Fort Worth, Houston, Austin, San Antonio, Tampa, Miami-Dade (no partition category found in its certificate-of-competency system).

## 3. Rules by building type

### Schools (strongest local rules)

- **Florida, Jessica Lunsford Act (Fla. Stat. 1012.467–.468):**
  - Contractor staff on school grounds while students are present, or with direct student contact, need Level 2 FDLE/FBI fingerprint screening.
  - Exemptions: unscreened workers kept within line of sight of a screened supervisor, work sites fenced off from the school, and brief deliveries.
  - Each district runs its own process. Manatee County, for example, issues clearances valid for 5 years.
- **Texas, Education Code §22.0834 / §22.08341:**
  - Contractor staff with continuing duties and possible direct student contact must be fingerprinted.
  - Construction is exempt if the contractor uses separate restrooms, installs a barrier fence and bars contact with students.
  - Since a 2019 FBI audit, contractors can't access national records themselves, so districts fingerprint them (e.g. Dallas ISD's "LEE Fast Pass" option).
- **California, Education Code §45125.2:** for construction with more than limited student contact, the district must use one of three protections: a physical barrier, continual supervision by a DOJ-cleared employee, or surveillance by school staff.
- **California public schools (Field Act):** DSA oversight, and a DSA-certified project inspector (hired by the district) is required on school construction.

### Public and government projects

- **California:** contractors and subcontractors must register with the Department of Industrial Relations for public works over **$25,000** (construction) or **$15,000** (maintenance). Prevailing wage and certified payroll apply.
- **Federal (Davis-Bacon, Miller Act bonds) and Texas prevailing wage:** not confirmed in this round.

### Healthcare

- Infection-control (ICRA) training is mostly a **hospital requirement**, not law. The CDC expects facilities to run an ICRA but doesn't require worker training.
- Example: Cleveland Clinic requires ICRA training of all contractors; a 24-hour union course is valid 4 years, an online certification 3 years.
- ASHE certifications are recommended, not required. New Jersey is debating a legal mandate.
- **To research:** California HCAI hospital construction oversight.

## 4. Accessibility review

- **Texas (TDLR, Texas Accessibility Standards):**
  - Projects of **$50,000 or more** must be registered with TDLR, and a Registered Accessibility Specialist reviews the plans and inspects the work.
  - Below $50,000 registration is optional, but the local building official can still require it.
  - Fees: $175 filing; $215 an hour for special review or inspection.

## Gaps to research next

1. Arizona and Louisiana: the license class that covers partitions.
2. Florida: county-level rules.
3. California: the current dollar threshold for needing a license; HCAI hospital oversight.
4. Federal and Texas prevailing wage and bonding.
5. Union and project-labor-agreement jurisdiction in large cities.
6. Registration rules in Fort Worth, Houston and the other target cities.

## Planned blog cluster

**Pillar:** "Who can install bathroom partitions? Licensing and job-site rules by state, city and building type"

| Spoke | Target search | Feeds |
|---|---|---|
| Do you need a license to install toilet partitions? State-by-state | toilet partition installer license [state] | State hubs |
| Installing partitions in schools: background checks and site rules (FL, TX, CA) | contractor background check school [state] | City pages, school industry pages |
| California: C-61/D-34, DSA inspection, DIR public works | D-34 license toilet partitions | California pages |
| Texas: no state license, so what installers need instead | Texas contractor license requirements commercial | Texas hub, DFW page |
| Florida: licensing scope and the Jessica Lunsford Act | Jessica Lunsford Act contractors | Florida pages |
| Hospital and clinic restrooms: ICRA for installers | ICRA training contractors | Healthcare pages |
| Public and government jobs: prevailing wage, certified payroll, bonds | prevailing wage partition installation | Public building pages |
| Accessible stalls: ADA vs. state standards, and who inspects | TAS toilet stall requirements | All city pages |
| City contractor registration explained (Dallas, Chicago, NYC…) | Dallas contractor registration | City pages |
| Checklist: what to ask a partition installer before hiring | hire toilet partition installer | Directory, profiles |

## Where it appears on location pages

- **Installer area page (e.g. DFW):** a "Rules for installers in Dallas–Fort Worth" box covering:
  - no state license in Texas,
  - city registration,
  - school jobs under §22.0834,
  - TDLR review at $50,000 or more,
  - links to the cluster.
- **Installer profile:** tie each check to the local rule it satisfies (e.g. "City of Dallas contractor registration ✓", or in Florida "Screened for school grounds").
- **City sales page ("Buy bathroom partitions in Dallas"):**
  - A short "Installing in Dallas" section: three bullets, then "You don't need any of this to buy partitions from us."
  - Then links by building type: schools, healthcare, public buildings.
- **Facility pages per city (e.g. schools in Dallas):** the full school rules for that state.

## Data model for scaling

One record per state and city with these fields:

- license required (yes/no, dollar threshold, license class)
- city registration
- school rule
- public-works rule
- accessibility authority
- source URL
- date last verified

Pages render from these records and show the source, the "last checked" date and "confirm with [authority]".

## Sources

- CSLB D-34: https://www.cslb.ca.gov/About_us/Library/Licensing_Classifications/Licensing_Classifications_Detail.aspx?Class=D34
- CSLB C-61: https://www.cslb.ca.gov/About_us/Library/Licensing_Classifications/C-61_Limited_Specialty/Default.aspx
- CA courts licensing requirements: https://courts.ca.gov/system/files/solicitation-request-document/rfq-fs-2019-01-dgf-licensing-requirements.pdf
- NAC 624.260 (C-8): https://www.law.cornell.edu/regulations/nevada/NAC-624-260
- Nevada R083-04: https://www.leg.state.nv.us/Division/Legal/LawLibrary/Register/2004Register/R083-04A.pdf
- LSLBC classifications: https://lslbc.louisiana.gov/exams-classifications/
- NC $40,000 threshold: https://abc11.com/amp/post/nc-contractors-home-construction-license-unlicensed/13961419/
- Florida SB 1570 (2023): https://www.flsenate.gov/Session/Bill/2023/1570/BillText/Filed/HTML
- WA L&I registration: https://lni.wa.gov/licensing-permits/contractors/register-as-a-contractor/index
- Dallas GC registration form: https://dallas.gov/departments/sustainabledevelopment/DCH%20documents/pdf/building/GeneralContractor_RegistrationForm.pdf
- Chicago GC license: https://www.chicago.gov/city/en/depts/bldgs/supp_info/TLdetails/GC.html
- NYC DOB GC registration: https://www.nyc.gov/assets/buildings/pdf/lic6ins.pdf
- Florida JLA (Escambia): https://www.escambiaschools.org/cms/lib/FL50010989/Centricity/Domain/100/Jessica_Lunsford_Act.pdf
- Florida JLA (Manatee): https://www.manateeschools.net/Page/6689
- TEA contractor requirements: https://tea.texas.gov/ar/node/102460
- TASB fingerprinting guidance: https://www.tasb.org/news-insights/tea-releases-contractor-fingerprinting-guidance
- Dallas ISD background info: https://www.dallasisd.org/departments/procurement/doing-business-with-dallas-isd/background-information
- CA Ed Code 45125.1/45125.2 (LAUSD copy): https://www.lausd.org/cms/lib/CA01000043/Centricity/domain/133/risk%20finance%20and%20insurance/45125%201%20%2045125%202.pdf
- DSA FLS FAQ: https://www.dgs.ca.gov/-/media/Divisions/DSA/Publications/fls/FLS_FAQ.pdf
- DIR SB 854 fact sheet: https://www.dir.ca.gov/Public-Works/PublicWorksSB854.html
- ICRA overview: https://www.constructconnect.com/blog/construction-worker-training-is-a-must-for-healthcare-facilities
- Cleveland Clinic ICRA letter: https://my.clevelandclinic.org/-/scassets/files/org/supply-chain/non-employee-onboarding/icra-silkroad-letter.pdf?la=en
- TDLR EAB at a glance: https://www.tdlr.texas.gov/media/pdf/EAB%20at%20a%20Glance.pdf
- TDLR AB FAQ: https://www.tdlr.texas.gov/ab/abfaq.htm
