# Call sheet: local installer rules still to confirm (6 cities)

Prepared 2026-11-05. These are the six low-confidence areas in `cities.json`: the browser research couldn't open or confirm the official rule, so each page shows a neutral line until someone calls. One call each, about 5 minutes.

**Phone numbers come from web listings (official city pages where noted) and haven't been dialled yet.** If a number has moved, the department's website lists the current one.

## What to say (every call)

> "Hi, I'm calling about commercial restroom work. We supply toilet partitions (the stalls) and want to tell installers what they need before working in [city]. Two quick questions."

1. **Permit:** Is a building permit needed to **replace** toilet partitions in an existing commercial restroom (no plumbing, electrical or structural work)? And for a **new** restroom?
2. **Contractor:** Does the installer need a city (or town) contractor license or registration to do that work, beyond any state license? If so, what is it called and where is it listed?

**Write down:** the answer, the person's name or desk, the date, and any code section or web page they mention. Then update the city in `research/local-rules/cities.json` (`note`, `authority`, `source_url`, `confidence`) and rerun `directory/scripts/build-local-rules.py`.

## The six calls

### 1. Los Angeles, CA
- **Call:** LADBS call center: **311** from inside the City of Los Angeles, **(213) 473-3231** from outside. Ask for the Zoning & Building Code Engineer.
- **What we think:** No separate city contractor license. LADBS permits need an active California contractor license, workers' comp on file and a City business tax registration certificate.
- **Ask specifically:** For partitions only, which state license class does LADBS accept (CSLB D-34 or C-61)? Is the business tax registration required before the permit?

### 2. Milwaukee, WI
- **Call:** Department of Neighborhood Services, Permit and Development Center: **(414) 286-8210**. Mon, Tue, Thu, Fri 8:00–4:30; Wednesday drop-off only.
- **What we think:** Milwaukee licenses electrical, plumbing and home improvement contractors. We found no general contractor license for commercial interior work.
- **Ask specifically:** Does the city's home improvement contractor license apply to commercial jobs, or only to homes?

### 3. Omaha, NE
- **Call:** Planning Department, Permits & Inspections: **(402) 444-5350**. Mon–Fri 7:30–4:30. This number comes from directory listings, not a city page; (402) 444-5150 is the automated inspection line.
- **What we think:** Anyone contracting in Omaha (and within 3 miles of it) needs a City of Omaha contractor license, classes A to E. Class A covers full commercial work.
- **Ask specifically:** Which class covers installing toilet partitions in a commercial building? Does a partitions-only installer need Class A, or a lower class?

### 4. Raleigh, NC
- **Call:** Planning and Development Customer Service Center: **(919) 996-2500**. Mon–Fri 8–5. The number is on the city's own page. Email: ds.help@raleighnc.gov.
- **What we think:** No separate local contractor license. Commercial work needs a city building permit through the permit portal, with state-licensed contractors where the state requires them.
- **Ask specifically:** Is partition replacement exempt from a permit? Does the city require any contractor registration in its permit portal?

### 5. Worcester, MA
- **Call:** Inspectional Services, Building & Zoning: **(508) 799-1198**. Mon–Fri 8–4:30, 25 Meade Street. The number is on the city's own pages. A 2025 slide lists (508) 799-1012 as well.
- **What we think:** No city contractor license. The installer's state license number and workers' comp proof go with the permit application.
- **Ask specifically:** Which state license does the city expect for commercial partition work: a Construction Supervisor License, or none for non-structural work?

### 6. Long Island, NY (Nassau and Suffolk)
Permits come from each town or village, so call the two largest towns and use their answers as the example.
- **Call (Nassau):** Town of Hempstead Building Department: **(516) 538-8500**, 8–4:45. The number comes from a Nassau County directory.
- **Call (Suffolk):** Town of Brookhaven Building Division: **(631) 451-8696**. Mon–Fri 9–4:15, 1 Independence Hill, Farmingville. The number is on the town's own pages. Commercial applications are online only.
- **What we think:** Commercial building permits come from the town or village building department. The Nassau and Suffolk county contractor licenses cover home improvement work. Nassau's exempts commercial-only work.
- **Ask specifically:** Does the town require contractor registration for commercial jobs? Is partition replacement exempt from a permit?

## Sources for the numbers
- LADBS contact: https://dbs.lacity.gov/contact
- Milwaukee DNS permits contact: https://city.milwaukee.gov/dns/permits/contact-us-exam-permits
- Omaha Permits & Inspections (directory listing): https://www.jaspector.com/permits/nebraska/douglas/omaha
- Raleigh Customer Service Center: https://raleighnc.gov/planning-and-development/customer-service-center
- Worcester Inspectional Services divisions: https://worcesterma.gov/inspections/about-us/divisions
- Town of Hempstead (Nassau County directory): https://archive.nassaucountyny.gov/agencies/Planfed/Docs/PDF/Nassau%20County%20Resource%20Directory/Local%20Government%20Resources/Town%20Contact%20Information.pdf
- Town of Brookhaven Building Division: https://www.brookhavenny.gov/Building
