import re
OUT='/home/user/nextpartitions/site-content/pages/'
NOAA_P='https://www.ncei.noaa.gov/sites/default/files/2025-02/nrmpcp.txt'
NOAA_H='https://www.ncei.noaa.gov/sites/default/files/2024-11/relhum23.txt'
NOAA_D='https://www.ncei.noaa.gov/sites/default/files/2024-11/prge0123.txt'
TDLR='''- **Accessibility:** the federal 2010 ADA Standards and the 2012 Texas Accessibility Standards (TAS). Projects with a total estimated cost of $50,000 or more are registered with the Texas Department of Licensing and Regulation (TDLR) and submitted for review; smaller projects must still comply with TAS.'''
TDLR_SRC='- Texas Accessibility Standards and the $50,000 registration threshold: [TDLR Architectural Barriers FAQ](https://www.tdlr.texas.gov/ab/abfaq.htm) and [TAS](https://www.tdlr.texas.gov/ab/abtas.htm). Checked 2026-11-23.'
C=[
dict(slug='los-angeles',stalls={'intro': "Los Angeles counts toilets by the number of people the building holds, half men and half women, and it requires urinals in the men's room. Every toilet needs a stall, and urinals need screens between them. The women's room must have at least as many toilets as the men's room has toilets and urinals together.", 'table': "| People in the building | Office | Restaurant | School |\n|---|---|---|---|\n| 50 | 2 women's stalls<br>1 men's stall + 1 urinal | 2 women's stalls<br>1 men's stall + 1 urinal | 2 women's stalls<br>1 men's stall + 1 urinal |\n| 100 | 3 women's stalls<br>1 men's stall + 1 urinal | 2 women's stalls<br>1 men's stall + 1 urinal | 2 women's stalls<br>1 men's stall + 1 urinal |\n| 200 | 4 women's stalls<br>2 men's stalls + 1 urinal | 3 women's stalls<br>2 men's stalls + 1 urinal | 4 women's stalls<br>2 men's stalls + 1 urinal |\n| 400 | 8 women's stalls<br>3 men's stalls + 2 urinals | 4 women's stalls<br>3 men's stalls + 1 urinal | 7 women's stalls<br>4 men's stalls + 2 urinals |\n", 'after': "These are minimums for new buildings, additions and changes of use that bring in more people; a remodel that doesn't add people can usually keep the toilets it has. A business with 50 people or fewer may be allowed a single one-person restroom, so ask LADBS. At least one stall in each room must be wheelchair accessible.", 'people': 'Not sure how many people your building holds? Los Angeles counts an office at one person per 150 square feet of floor, and a restaurant dining room or a classroom at one per 30 square feet. Your architect or LADBS sets the final number.', 'src': '- Toilet counts in Los Angeles: 2025 California Plumbing Code, Table 422.1 and Table 4-1, read on [IAPMO\'s code viewer](https://epubs.iapmo.org/2025/CPC/), and [LADBS Information Bulletin P/BC 2026-095, Plumbing Fixtures](https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/plumbing-fixtures-ib-p-bc2014-095.pdf) ("the minimum number of plumbing fixtures are shown in CPC Table 422.1"). Los Angeles makes no changes to the table. Checked 2026-11-24.', 'note': "Stall-count table: check the office row against the printed 2025 California Plumbing Code (pages 70-71) and confirm with LADBS how the women's minimum (Table 422.1, note 3) is applied before launch. Data in `research/state-codes/fixtures/los-angeles.json`."},rules="- **Wheelchair access:** a restroom with stalls needs at least one stall a wheelchair user can enter and use. Federal law and California's own access rules both set the sizes, and California's are stricter in places. A remodel can also oblige you to bring the restrooms serving that area up to today's rules; on projects under $209,208 (the 2026 figure) that duty is limited.\n- **Fire safety:** building rules require solid plastic (HDPE) partitions to pass a fire test. Ask for the fire-rated version.\n- **How many stalls:** Los Angeles sets the number of toilets and urinals by how many people use the building, and that decides how many stalls you need.",permit_plain='Los Angeles needs no permit for work worth $2,500 or less, or for "partitions, not over 5 feet 9 inches high", but the city doesn\'t say whether toilet partitions count. Ask the Department of Building and Safety (LADBS) before a replacement.',faq_rules="Federal and California wheelchair-access rules, the city's fire-safety rule for solid plastic partitions, and its rules on how many toilets a building needs. Confirm your project with LADBS.",official="2010 ADA Standards for Accessible Design; California Building Code Chapter 11B; 2026 Los Angeles Building Code (the 2025 California Building Code with Los Angeles amendments, in force since January 1, 2026); Los Angeles Plumbing Code (the 2025 California Plumbing Code with Los Angeles amendments); NFPA 286 for HDPE under the International Building Code, the model for California's code.",city='Los Angeles',st='CA',state='California',stslug='california',lat=34.0194,lng=-118.4108,cal='#2',
 meta="Commercial bathroom partitions delivered to Los Angeles job sites. Price your restroom in five questions and see the California codes that apply.",
 lead="Commercial bathroom partitions for Los Angeles offices, schools, restaurants and studios, shipped by freight to your job site.",
 climate_h="The right material for the Los Angeles climate",
 climate='''Los Angeles is dry: about 14 inches of rain a year, on roughly 35 days, with relative humidity averaging 58% at 4 a.m. and 54% at 4 p.m. The weather rarely decides the material here. The room does:

- **Most restrooms** (offices, restaurants, retail, clinics, schools): all five materials work. Choose on looks, cleaning routine and budget.
- **Rooms that get wet from the inside** (pool and beach facilities, gym locker rooms, restrooms that are hosed down): choose [solid plastic (HDPE)](/partitions/solid-plastic-hdpe) or [phenolic](/partitions/phenolic). Both are solid all the way through and handle constant moisture.''',
 access="- **Accessibility:** the federal 2010 ADA Standards and Chapter 11B of the California Building Code. An alteration can also trigger upgrades to the path of travel, including the restrooms that serve the altered area; below a valuation threshold ($209,208 as of January 2026) that obligation is limited.",
 build="- **Building code:** the 2026 Los Angeles Building Code, which is the 2025 California Building Code with Los Angeles amendments, in force since January 1, 2026.",
 plumb="- **Plumbing code:** the Los Angeles Plumbing Code, which is the 2025 California Plumbing Code with Los Angeles amendments.",
 permit="- **Permits:** the Los Angeles code exempts work valued at $2,500 or less and \"partitions, not over 5 feet 9 inches high\" from a permit, but no LADBS page says whether toilet partitions count. Ask LADBS before a replacement. You don't need a permit to buy partitions.",
 confirm="the Los Angeles Department of Building and Safety (LADBS) or your architect",
 install="California requires a CSLB contractor license, usually the C-61/D-34 Prefabricated Equipment classification, for partition installs of $1,000 or more; jobs needing workers or permits require a license at any price. Check a contractor's license on the CSLB website, and check local contractor licensing or registration with LADBS before work starts. You don't need a license or a permit to buy partitions.",
 faq_install="No. We supply the partitions and the shop drawings; a contractor you hire installs them. In California that contractor needs a CSLB license for jobs of $1,000 or more.",
 faq_mat=("Which partition material is best in Los Angeles?","The dry climate suits all five. Choose HDPE or phenolic only where the room itself gets wet: pools, beach facilities, locker rooms and restrooms that are hosed down."),
 faq_codes="The 2010 ADA Standards, Chapter 11B of the California Building Code, the 2026 Los Angeles Building Code and the Los Angeles Plumbing Code. Confirm your project with LADBS.",
 near="Long Beach, Santa Clarita, Glendale, Fullerton, Torrance, Pasadena, Simi Valley and Thousand Oaks, and every other ZIP code in Greater Los Angeles.",
 buyers_extra="- **Studios, venues and stadiums:** high-traffic stalls with heavy-duty hardware.",
 src=[
 "- Los Angeles climate: NOAA NCEI Comparative Climatic Data, station Los Angeles, CA (WBAN 93134): [annual precipitation, 14.25 in, 1991–2020 normal](%s); [relative humidity, 58%% at 4 a.m. and 54%% at 4 p.m., 1999–2018](%s); [days with 0.01 in or more of precipitation, 35 a year](%s). Checked 2026-11-23."%(NOAA_P,NOAA_H,NOAA_D),
 "- Los Angeles building and plumbing codes, and work exempt from a permit (LAMC 91.106.2): [Ordinance No. 188797, on the LADBS site](https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/26-ord-188797-260108.pdf). Checked 2026-11-23.",
 "- California Building Code Chapter 11B and the 2026 valuation threshold: [LADBS accessibility plan check list for commercial buildings, 2026](https://dbs.lacity.gov/sites/default/files/efs/forms_and_publications/publications/checklists/building-code/2026/CL-BC-2026-026-Acc_Commercial.pdf). Checked 2026-11-23.",
 "- California contractor license (C-61/D-34): [Contractors State License Board](https://www.cslb.ca.gov/About_Us/Library/Licensing_Classifications/Licensing_Classifications_Detail.aspx?Class=D34). Last checked 2026-11-19."],
 notes=["To confirm by phone before launch: whether a partition replacement needs an LADBS permit (LAMC 91.106.2, items 1 and 15), and Los Angeles's own contractor registration rule (low confidence in `research/local-rules/cities.json`).","The $209,208 threshold changes each January: recheck in January 2027."]),
dict(slug='miami',stalls={'intro': "Florida counts toilets by the number of people the building holds, half men and half women. Every toilet needs a stall. Urinals are optional: they may stand in for up to half of the men's toilets in an office, and up to two-thirds in a restaurant or school.", 'table': "| People in the building | Office | Restaurant | School |\n|---|---|---|---|\n| 50 | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall |\n| 100 | 2 women's stalls<br>2 men's stalls | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall |\n| 200 | 3 women's stalls<br>3 men's stalls | 2 women's stalls<br>2 men's stalls | 2 women's stalls<br>2 men's stalls |\n| 400 | 5 women's stalls<br>5 men's stalls | 3 women's stalls<br>3 men's stalls<br>More women's stalls may apply | 4 women's stalls<br>4 men's stalls |\n", 'after': "In restaurants and other gathering places, Florida can require three women's toilets for every two men's toilets and urinals once the men's room has more than two. Licensed restaurants may be exempt, so confirm with the City of Miami Building Department. Outdoor seating counts toward the number of people. At least one stall in each room must be wheelchair accessible.", 'people': 'Not sure how many people your building holds? The building rules count an office at one person per 150 square feet of floor, a restaurant dining room at one per 15 square feet and a classroom at one per 20. Your architect or the Building Department sets the final number.', 'src': "- Toilet counts in Miami: Florida Building Code, Plumbing, 8th Edition (2023), Table 403.1 and Sections 403.1.1, 403.1.3 and 424.2, read on a secondary copy ([UpCodes](https://up.codes/viewer/florida/fl-plumbing-code-2023/chapter/4/fixtures-faucets-and-fixture-fittings)) because the official viewer blocks automated reading. The Florida Building Commission's change documents for the 9th Edition (2026) show the same ratios for these three rows. Checked 2026-11-24.", 'note': "Stall-count table: read the 8th Edition rows once in a browser on the official viewer, and the published 9th Edition before December 31, 2026. The women's 3-to-2 rule (403.1.3) and its exception for licensed establishments need confirming. Data in `research/state-codes/fixtures/miami.json`."},rules="- **Wheelchair access:** a restroom with stalls needs at least one stall a wheelchair user can enter and use. Federal law and Florida's own access rules set the sizes.\n- **Fire safety:** building rules require solid plastic (HDPE) partitions to pass a fire test. Ask for the fire-rated version.\n- **How many stalls:** Florida's plumbing rules set the number of toilets and urinals by how many people use the building, and that decides how many stalls you need.\n- **New rules on December 31, 2026:** Florida replaces its building rules with a new edition that day. If your project is permitted after that date, ask your architect which edition applies.",permit_plain="Miami's list of work that needs no permit covers only partitions that aren't fixed to the building and stand no taller than 5 feet 9 inches. Toilet partitions are anchored, so ask the City of Miami Building Department before a replacement.",faq_rules="Federal and Florida wheelchair-access rules, the fire-safety rule for solid plastic partitions, and Florida's rules on how many toilets a building needs. Florida's building rules change to a new edition on December 31, 2026. Confirm your project with the City of Miami Building Department.",official="2010 ADA Standards for Accessible Design; Florida Building Code, 8th Edition (2023): Building, Plumbing and Accessibility volumes, replaced by the 9th Edition (2026) on December 31, 2026; NFPA 286 for HDPE under the International Building Code, the model for Florida's code.",city='Miami',st='FL',state='Florida',stslug='florida',lat=25.7752,lng=-80.2086,cal='#3',
 meta="Commercial bathroom partitions delivered to Miami job sites. Price your restroom, pick a material for South Florida humidity and see the codes that apply.",
 lead="Commercial bathroom partitions for Miami offices, schools, restaurants and hotels, shipped by freight to your job site.",
 climate_h="The right material for Miami's climate",
 climate='''Miami gets about 67 inches of rain a year, on roughly 135 days, and the air averages 82% relative humidity at 7 a.m. and 61% at 1 p.m. What that means for partitions depends on whether the restroom is air-conditioned:

- **Air-conditioned restrooms** (offices, restaurants, clinics, hotels, most schools): all five materials work. Choose on looks, cleaning routine and budget.
- **Restrooms open to outside air or without air conditioning** (beach and park facilities, marinas, stadiums, warehouses, pool and locker rooms): choose [solid plastic (HDPE)](/partitions/solid-plastic-hdpe) or [phenolic](/partitions/phenolic). Both are solid all the way through and handle constant moisture.''',
 access="- **Accessibility:** the federal 2010 ADA Standards and the Florida Building Code, Accessibility.",
 build="- **Building code:** the Florida Building Code, Building, 8th Edition (2023). The 9th Edition (2026) replaces it on December 31, 2026, for the Building, Plumbing and Accessibility volumes alike.",
 plumb="- **Plumbing code:** the Florida Building Code, Plumbing, 8th Edition (2023) until then.",
 permit="- **Permits:** Miami's list of work that needs no permit covers only partitions \"not fixed to the structure\" and no taller than 5 feet 9 inches. Toilet partitions are anchored, so ask the City of Miami Building Department before a replacement. You don't need a permit to buy partitions.",
 confirm="the City of Miami Building Department or your architect",
 install="In Miami-Dade County, contractors and subcontractors need a current certificate of competency or eligibility, from the state or the county, for their type of work. Florida has no state license category specifically for toilet partitions, so confirm with the Miami-Dade Construction Trades Qualifying Board which certificate covers your job. You don't need a license or a permit to buy partitions.",
 faq_install="No. We supply the partitions and the shop drawings; a contractor you hire installs them. In Miami-Dade County the contractor needs a current certificate of competency for the work.",
 faq_mat=("Which partition material is best for Miami's humidity?","In an air-conditioned restroom, any of the five. In a restroom open to outside air or without air conditioning, choose solid plastic (HDPE) or phenolic, which handle constant moisture."),
 faq_codes="The 2010 ADA Standards and the Florida Building Code: the Building, Plumbing and Accessibility volumes, 8th Edition (2023) until December 30, 2026 and 9th Edition (2026) from December 31. Confirm your project with the City of Miami Building Department.",
 near="Hialeah, Fort Lauderdale, Pembroke Pines, Hollywood, Miramar, Miami Gardens, Davie and Sunrise, and every other ZIP code in Miami-Dade and Broward.",
 buyers_extra="- **Hotels and resorts:** finishes that match the property, with privacy options for guest-facing restrooms.",
 src=[
 "- Miami climate: NOAA NCEI Comparative Climatic Data, station Miami, FL (WBAN 12839): [annual precipitation, 67.41 in, 1991–2020 normal](%s); [relative humidity, 82%% at 7 a.m. and 61%% at 1 p.m., 1948–2018](%s); [days with 0.01 in or more of precipitation, 135 a year](%s). Checked 2026-11-23."%(NOAA_P,NOAA_H,NOAA_D),
 "- Florida Building Code editions enforced in Miami, and the December 31, 2026 change: [City of Miami Building Department](https://www.miami.gov/My-Government/Departments/Building). Checked 2026-11-23.",
 "- Work exempt from a permit in Miami: [City of Miami, Work Exempt from Permit](https://www.miami.gov/Permits-Construction/Work-Exempt-from-Permit). Checked 2026-11-23.",
 "- Miami-Dade certificate of competency: [Miami-Dade County Code, Chapter 10](https://library.municode.com/fl/miami_-_dade_county/codes/code_of_ordinances?nodeId=PTIIICOOR_CH10CO). Last checked 2026-11-03.",
 "- Florida contractor licensing: [Florida Statutes 489.113](https://www.flsenate.gov/Laws/Statutes/2023/489.113). Last checked 2026-11-19."],
 notes=["**Update on December 31, 2026:** the 9th Edition (2026) Florida Building Code takes effect. Rewrite the codes bullets and the FAQ answer for the 9th Edition only, and recheck the city's list of applicable codes.","To confirm by phone before launch: whether replacing anchored toilet partitions needs a City of Miami permit, and which Miami-Dade certificate of competency covers partition installation (Florida's state status is unclear in `research/state-licensing/states.json`)."]),
dict(slug='dallas',stalls={'intro': 'Dallas handles toilet counts differently from most cities. For schools, the counts below are required. For offices and restaurants, the city requires only one toilet for each sex where people work, and says of the usual counts that they are "recommended, but not required". Every toilet needs a stall. Urinals are optional and may stand in for some of the men\'s toilets.', 'table': "| People in the building | Office (recommended) | Restaurant (recommended) | School (required) |\n|---|---|---|---|\n| 50 | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall |\n| 100 | 2 women's stalls<br>2 men's stalls | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall |\n| 200 | 3 women's stalls<br>3 men's stalls | 2 women's stalls<br>2 men's stalls | 2 women's stalls<br>2 men's stalls |\n| 400 | 5 women's stalls<br>5 men's stalls | 3 women's stalls<br>3 men's stalls | 4 women's stalls<br>4 men's stalls |\n", 'after': 'The counts split the people half men and half women. At least one stall in each room must be wheelchair accessible. Confirm what your project needs with Dallas Building Inspection.', 'people': 'Not sure how many people your building holds? The building rules count an office at one person per 150 square feet of floor, a restaurant dining room at one per 15 square feet and a classroom at one per 20. Your architect or Dallas Building Inspection sets the final number.', 'src': '- Toilet counts in Dallas: Dallas\'s amendments to the 2021 International Plumbing Code ([Ordinance 32422](https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/pdf/code_amendments/2021_codes/23-0469.pdf)) and Building Code ([Ordinance 32421](https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/pdf/code_amendments/2021_codes/23-0468.pdf)), Section 403.1 ("It is recommended, but not required…"). The table\'s ratios were read on a secondary copy of the Dallas Plumbing Code ([UpCodes](https://up.codes/viewer/dallas/ipc-2021/chapter/4/fixtures-faucets-and-fixture-fittings)). Checked 2026-11-24.', 'note': 'Stall-count table: check the ratios in a browser on the official viewer, and ask Dallas Building Inspection how plan review applies "recommended, but not required". Data in `research/state-codes/fixtures/dallas.json`.'},rules="- **Wheelchair access:** a restroom with stalls needs at least one stall a wheelchair user can enter and use. Federal law and Texas's own access rules set the sizes. On projects of $50,000 or more, the state reviews the plans; smaller projects must still follow the rules.\n- **Fire safety:** Dallas's building rules require solid plastic (HDPE) partitions to pass a fire test. Ask for the fire-rated version.\n- **How many stalls:** Dallas sets the number of toilets and urinals by how many people use the building, and that decides how many stalls you need.",permit_plain="Dallas says a building permit is generally needed for work on a building's structure and publishes a list of work that needs none. Ask Dallas Building Inspection whether your replacement is on it.",faq_rules="Federal and Texas wheelchair-access rules, the city's fire-safety rule for solid plastic partitions, and its rules on how many toilets a building needs. Confirm your project with Dallas Building Inspection.",official='2010 ADA Standards for Accessible Design; 2012 Texas Accessibility Standards (TDLR registration and review at $50,000 or more); 2021 International Building Code with Dallas amendments, in force since May 12, 2023; 2021 International Plumbing Code with Dallas amendments; work exempt from a permit: Dallas City Code Chapter 52, Section 301(b); NFPA 286 for HDPE.',city='Dallas',st='TX',state='Texas',stslug='texas',lat=32.7936,lng=-96.7662,cal='#4',
 meta="Commercial bathroom partitions delivered to Dallas job sites. Price your restroom, pick the right material and see the Dallas and Texas codes that apply.",
 lead="Commercial bathroom partitions for Dallas offices, schools, restaurants and warehouses, shipped by freight to your job site.",
 climate_h="The right material for the Dallas climate",
 climate='''Dallas gets about 38 inches of rain a year, on roughly 79 days, and relative humidity averages 78% at 6 a.m. and 54% at noon. In most Dallas restrooms the room decides the material, not the weather:

- **Air-conditioned restrooms** (offices, restaurants, clinics, most schools): all five materials work. Choose on looks, cleaning routine and budget.
- **Restrooms without air conditioning, or that get wet from the inside** (warehouses, plants, parks, stadiums, pool and locker rooms): choose [solid plastic (HDPE)](/partitions/solid-plastic-hdpe) or [phenolic](/partitions/phenolic). Both are solid all the way through and handle constant moisture.''',
 access=TDLR,
 build="- **Building code:** the 2021 International Building Code with Dallas amendments, in force since May 12, 2023.",
 plumb="- **Plumbing code:** the 2021 International Plumbing Code with Dallas amendments.",
 permit="- **Permits:** Dallas says a building permit is generally needed for work involving structural elements, and lists the work that needs none in Chapter 52, Section 301(b) of the Dallas City Code. Ask Dallas Building Inspection whether your replacement needs one. You don't need a permit to buy partitions.",
 confirm="Dallas Building Inspection, TDLR, or your architect",
 install="Contractors register with the City of Dallas in DallasNow before pulling building permits, and permits are not issued to unregistered contractors. Texas has no statewide contractor license for this work. Confirm what your project needs with City of Dallas Development Services. You don't need a permit to buy partitions.",
 faq_install="No. We supply the partitions and the shop drawings; a contractor you hire installs them. A contractor who pulls a Dallas building permit must be registered with the City.",
 faq_mat=("Which partition material is best in Dallas?","In an air-conditioned restroom, any of the five. Where the room has no air conditioning or gets wet from the inside, choose solid plastic (HDPE) or phenolic."),
 faq_codes="The 2010 ADA Standards, the 2012 Texas Accessibility Standards, the 2021 International Building Code and the 2021 International Plumbing Code, the last two with Dallas amendments. Confirm your project with Dallas Building Inspection.",
 near="Plano, Irving, Garland, Frisco, McKinney, Grand Prairie, Carrollton and Lewisville, and every other ZIP code on the Dallas side of the Metroplex.",
 buyers_extra=None,
 src=[
 "- Dallas climate: NOAA NCEI Comparative Climatic Data, station Dallas, TX (WBAN 13960): [annual precipitation, 38.32 in, 1991–2020 normal](%s); [relative humidity, 78%% at 6 a.m. and 54%% at noon, 1948–2018](%s); [days with 0.01 in or more of precipitation, 79 a year](%s). Checked 2026-11-23."%(NOAA_P,NOAA_H,NOAA_D),
 "- Dallas building and plumbing codes: [City of Dallas Building Inspection, construction codes](https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/Pages/know_code.aspx). Checked 2026-11-23.",
 TDLR_SRC,
 "- Dallas permits: [City of Dallas Building Inspection FAQ](https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/Pages/building_inspection_faqs.aspx). Checked 2026-11-23.",
 "- Dallas contractor registration: [City of Dallas Development Services guide](https://dallascityhall.com/departments/sustainabledevelopment/guide). Last checked 2026-11-03.",
 "- Texas has no statewide general contractor license: [Office of the Governor, Texas Business Licenses & Permits Guide](https://gov.texas.gov/uploads/files/business/Texas_Licenses_Permits_Guide.pdf). Last checked 2026-11-19."],
 notes=["To confirm before launch: whether a partition replacement needs a Dallas permit (Chapter 52, Section 301(b) wasn't read), whether Dallas has adopted newer code editions (its \"2025 Code Amendment Process\" page couldn't be opened), and the TDLR $50,000 threshold against 16 TAC 68.50."]),
dict(slug='seattle',stalls={'intro': "Seattle counts toilets by the number of people the building holds, half men and half women. Every toilet needs a stall. Washington sets its own count for schools, with more toilets for girls than for boys. Urinals are optional and may stand in for most of the men's toilets.", 'table': "| People in the building | Office | Restaurant | School |\n|---|---|---|---|\n| 50 | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall | 1 women's stall<br>1 men's stall |\n| 100 | 2 women's stalls<br>2 men's stalls | 1 women's stall<br>1 men's stall | 2 women's stalls<br>2 men's stalls |\n| 200 | 3 women's stalls<br>3 men's stalls | 2 women's stalls<br>2 men's stalls | 4 women's stalls<br>3 men's stalls |\n| 400 | 5 women's stalls<br>5 men's stalls | 3 women's stalls<br>3 men's stalls | 8 women's stalls<br>6 men's stalls |\n", 'after': 'Small businesses may be allowed one shared restroom: up to 25 people in an office and up to 30 in a restaurant. At least one stall in each room must be wheelchair accessible. Confirm your project with SDCI.', 'people': 'Not sure how many people your building holds? The building rules count an office at one person per 150 square feet of floor and a restaurant dining room at one per 15 square feet. A school is counted at one student per 100 square feet of the whole building. Your architect or SDCI sets the final number.', 'src': '- Toilet counts in Seattle: [2021 Seattle Building Code, Chapter 29](https://www.seattle.gov/construction-and-inspections/codes/codes-we-enforce-(a-z)/building-code), Table 2902.1, and [WAC 51-50-2902](https://app.leg.wa.gov/WAC/default.aspx?cite=51-50-2902); the plumbing code points there ([WAC 51-56-0400](https://app.leg.wa.gov/WAC/default.aspx?cite=51-56-0400)). Checked 2026-11-24.', 'note': 'Stall-count table: read on official pages. Recheck when Seattle and Washington move to the 2024 editions. Data in `research/state-codes/fixtures/seattle.json`.'},rules="- **Wheelchair access:** a restroom with stalls needs at least one stall a wheelchair user can enter and use. Federal law and Washington's own access rules set the sizes.\n- **Fire safety:** Seattle's building rules require solid plastic (HDPE) partitions to pass a fire test. Ask for the fire-rated version.\n- **How many stalls:** the number of toilets and urinals depends on how many people use the building, and that decides how many stalls you need. The county health department, Public Health – Seattle & King County, enforces the plumbing rules.",permit_plain='Seattle needs no permit for minor repairs or alterations that cost $6,000 or less in any 6-month period, counting labor and parts at market value. Above that, ask the Seattle Department of Construction and Inspections (SDCI) whether your replacement needs one.',faq_rules="Federal and Washington wheelchair-access rules, the city's fire-safety rule for solid plastic partitions, and the rules on how many toilets a building needs. Confirm your project with SDCI.",official='2010 ADA Standards for Accessible Design; ICC A117.1-2017 with Washington amendments (WAC 51-50, Seattle Building Code Chapter 11); 2021 Seattle Building Code (the 2021 International Building Code with Seattle amendments); 2021 Seattle Plumbing Code (the 2021 Washington State Plumbing Code with Seattle amendments); NFPA 286 for HDPE.',city='Seattle',st='WA',state='Washington',stslug='washington',lat=47.6193,lng=-122.3515,cal='#5',
 meta="Commercial bathroom partitions delivered to Seattle job sites. Price your restroom, pick a material for a damp climate and see the Seattle codes that apply.",
 lead="Commercial bathroom partitions for Seattle offices, schools, restaurants and warehouses, shipped by freight to your job site.",
 climate_h="The right material for Seattle's climate",
 climate='''Seattle gets about 39 inches of rain a year, spread over roughly 156 days, and relative humidity averages 82% at 4 a.m. and 63% at 4 p.m. What that means for partitions depends on whether the restroom is heated and ventilated:

- **Heated, ventilated restrooms** (offices, restaurants, clinics, most schools): all five materials work. Choose on looks, cleaning routine and budget.
- **Unheated restrooms or rooms open to outside air** (parks, marinas, stadiums, warehouses, pool and locker rooms): choose [solid plastic (HDPE)](/partitions/solid-plastic-hdpe) or [phenolic](/partitions/phenolic). Both are solid all the way through and handle constant moisture.''',
 access="- **Accessibility:** the federal 2010 ADA Standards and ICC A117.1-2017 with Washington amendments, through Chapter 11 of the Seattle Building Code.",
 build="- **Building code:** the 2021 Seattle Building Code, which is the 2021 International Building Code with Seattle amendments.",
 plumb="- **Plumbing code:** the 2021 Seattle Plumbing Code, which is the 2021 Washington State Plumbing Code with Seattle amendments. Public Health – Seattle & King County enforces it.",
 permit="- **Permits:** Seattle needs no permit for minor repairs or alterations that cost $6,000 or less in any 6-month period, counting labor and parts at market value. Above that, ask the Seattle Department of Construction and Inspections (SDCI) whether your replacement needs one. You don't need a permit to buy partitions.",
 confirm="SDCI or your architect",
 install="Washington requires every construction contractor to register with the Department of Labor & Industries (L&I), and Seattle will not issue a building permit until the contractor's current L&I registration is verified and recorded on the permit. Look a contractor up on the L&I website before you hire. You don't need a registration or a permit to buy partitions.",
 faq_install="No. We supply the partitions and the shop drawings; a contractor you hire installs them. In Washington that contractor must be registered with Labor & Industries.",
 faq_mat=("Which partition material is best for Seattle's damp climate?","In a heated, ventilated restroom, any of the five. In an unheated restroom or one open to outside air, choose solid plastic (HDPE) or phenolic, which handle constant moisture."),
 faq_codes="The 2010 ADA Standards, ICC A117.1-2017 with Washington amendments, the 2021 Seattle Building Code and the 2021 Seattle Plumbing Code. Confirm your project with SDCI.",
 near="Tacoma, Bellevue, Kent, Everett, Renton, Federal Way, Kirkland and Auburn, and every other ZIP code around Puget Sound.",
 buyers_extra=None,
 delivery_extra="\n\n**Downtown Seattle:** inside the Downtown Traffic Control Zone, trucks 30 feet or longer can't move during the weekday curfews (6 to 9 a.m. and 3 to 7 p.m.) and need a city permit between 9 a.m. and 3 p.m. Tell us if your site is downtown, so the carrier can plan the delivery window.",
 src=[
 "- Seattle climate: NOAA NCEI Comparative Climatic Data, station Seattle, WA (WBAN 24233): [annual precipitation, 39.34 in, 1991–2020 normal](%s); [relative humidity, 82%% at 4 a.m. and 63%% at 4 p.m., 1948–2018](%s); [days with 0.01 in or more of precipitation, 156 a year](%s). Checked 2026-11-23."%(NOAA_P,NOAA_H,NOAA_D),
 "- Seattle building and plumbing codes: SDCI, [Building Code](https://www.seattle.gov/construction-and-inspections/codes/codes-we-enforce-(a-z)/building-code) and [Plumbing Code](https://www.seattle.gov/construction-and-inspections/codes/codes-we-enforce-(a-z)/plumbing-code). Checked 2026-11-23.",
 "- ICC A117.1-2017 in Washington: [WAC 51-50, Washington State Building Code](https://app.leg.wa.gov/WAC/default.aspx?cite=51-50&full=true). Checked 2026-11-23.",
 "- Seattle permits and the $6,000 limit: [SDCI, Do You Need a Permit?](https://www.seattle.gov/construction-and-inspections/permits/do-you-need-a-permit). Checked 2026-11-23.",
 "- Downtown truck rules: [Seattle Department of Transportation, Downtown Traffic Control Zone](https://www.seattle.gov/transportation/permits-and-services/permits/stt-downtown-traffic-control-zone). Checked 2026-11-23.",
 "- Contractor registration: [Washington L&I, Register as a Contractor](https://lni.wa.gov/licensing-permits/contractors/register-as-a-contractor/) and [SDCI Tip 333](https://www.seattle.gov/DPD/Publications/CAM/cam333.pdf). Last checked 2026-11-19."],
 notes=["To confirm before launch: whether a partition replacement over $6,000 needs an SDCI permit (Seattle Building Code Section 106.2), the Downtown Traffic Control Zone's boundaries, and when Seattle moves to the 2024 code editions."]),
]
MODEL={'CA':'California','FL':'Florida'}
for c in C:
    city=c['city']
    hdpe_unused = ("If you choose HDPE, the building code requires it to pass the NFPA 286 fire test, so ask for the fire-rated version."
            if c['st'] in ('TX','WA') else
            f"If you choose HDPE, ask for the version that passes the NFPA 286 fire test, which the International Building Code requires and the {c['state']} code is based on.")
    buyers=[ "- **[Schools](/industries/schools):** HDPE or phenolic, heights by age group, vandal-resistant hardware.",
             "- **Restaurants and bars:** a finish that matches the dining room, in a material that survives the nightly clean.",
             "- **Offices and tenant build-outs:** overhead braced stalls that work with any ceiling.",
             "- **Warehouses, plants and distribution centers:** stalls that take hard use and washdown."]
    if c.get('buyers_extra'): buyers.append(c['buyers_extra'])
    buyers.append("- **Churches, gyms and clinics:** privacy options and accessible stalls sized to the 2010 ADA Standards.")
    poss = city+"'s" 
    body=f'''# Bathroom Partitions in {city}

{c['lead']}

[Configure your partitions](/get-a-quote)

:::pricer
{city}
:::

## {c['climate_h']}

{c['climate']}

[Plastic laminate](/partitions/plastic-laminate) has a particleboard core that may swell with excessive moisture, and [powder coated steel](/partitions/powder-coated-steel) can rust where the coating is damaged, so keep both for dry rooms. [Stainless steel](/partitions/stainless-steel) resists corrosion and suits premium public restrooms. Compare all five on the [partitions page](/partitions).

## Delivery to {city} job sites

Toilet partitions for {city} ship by freight carrier, crated, palletized and tracked. Delivery is curbside, with a liftgate on request if the site has no loading dock. Tell us in your quote request:

- **The delivery address,** and whether it's a job site, a warehouse or an occupied building.
- **Dock or liftgate.** A building without a dock needs a liftgate truck.
- **Who receives it.** Crates are heavy: a published 3-stall powder coated steel kit weighs about 300 lb.
- **Where the crates wait.** Store panels flat, not leaned against a wall. Solid plastic may need about 24 hours at room temperature before it's installed, so check the manufacturer's instructions.

Freight is quoted with the partitions, so the number you get covers delivery to your {city} address.{c.get('delivery_extra','')}

## The rules a {city} restroom has to meet

{c['rules']}
- **Permits:** {c['permit_plain']} You don't need a permit to buy partitions.

Rules change, so confirm your project with {c['confirm']}. The accessible stall's sizes are in our [ADA compliance guide](/guides/ada-compliance), and fixture spacing is in the [restroom layout guide](/guides/restroom-layout).

## How many stalls a {city} restroom needs

{c['stalls']['intro']}

{c['stalls']['table']}
{c['stalls']['after']}

{c['stalls']['people']}

## Installation in {city}

Next Partitions supplies the partitions; a contractor you hire installs them. Every order comes with shop drawings: a plan of your room with every panel, door and pilaster sized, which the installer sets out from.

Need an installer? Our directory of [partition installers in {city}](/installers/{c['stslug']}/{c['slug']}) lists local installers. Ask for installation in your quote request and we collect their prices for your job.

{c['install']}

Our [installation guide](/guides/how-to-install-toilet-partitions) shows the work step by step, and [how to measure for toilet partitions](/blog/how-to-measure-for-toilet-partitions) covers what to send for an accurate quote.

## What {city} buyers order partitions for

{chr(10).join(buyers)}

## Nearby cities we deliver to

{c['near']} We ship to all 50 states: see the full [service area](/service-area).

## Get a quote

Price a standard layout in the configurator, or send your drawings, stall count and the material you have in mind. Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours.

[Configure your partitions](/get-a-quote)

## FAQ

### Do you deliver bathroom partitions to {city}?
Yes. Partitions ship by freight carrier to {city} and the surrounding cities, crated, palletized and tracked. Curbside and liftgate delivery are available on request.

### Does Next Partitions install partitions in {city}?
{c['faq_install']} Our directory lists [partition installers in {city}](/installers/{c['stslug']}/{c['slug']}), and you can ask for installation prices with your quote.

### {c['faq_mat'][0]}
{c['faq_mat'][1]}

### What rules does a {city} restroom have to meet?
{c['faq_rules']}

### How do I get a price for my {city} restroom?
Answer the five questions at the top of this page, or send your drawings. Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours.

## Sources

- Freight by carrier, crated, palletized and tracked; curbside and liftgate on request: current site, [/service-area](/service-area) and [/faq](/faq). Checked 2026-11-02.
- Kit weight (3-stall powder coated steel, 299.7 lb) and freight quoted with the partitions: as used and sourced on the [cost guide](/blog/bathroom-partition-cost).
- Storing panels flat and letting solid plastic reach room temperature: as used and sourced on the [installation guide](/guides/how-to-install-toilet-partitions).
- Laminate core swelling, painted steel rust, phenolic and HDPE for moisture, NFPA 286 for HDPE: as used and sourced on the [partitions page](/partitions) and the [HDPE page](/partitions/solid-plastic-hdpe).
{chr(10).join(c['src'])}
{c['stalls']['src']}
- The rules by their official names: {c['official']}
'''
    notes=f'''
<!-- For Marc -->

## Implementation notes

- City page {c['cal']} of the February calendar (`/service-area/{c['slug']}/`, month 1). A buy page: the primary action is "Configure your partitions".
- The Installation section and one FAQ answer link to the installer directory page `/installers/{c['stslug']}/{c['slug']}`: publish this page together with that one, or hold the two links until it is live.
- `:::pricer` is the step-by-step pricer; on export it's the slot `<!--np-pricer:{city}-->` for the app's pricer component. No prices and no lead times until the price list is in.
- Schema: BreadcrumbList, FAQPage and Service (provider Next Partitions, areaServed {city}). No LocalBusiness: there is no {city} office. The hero drawing (`city-{c['slug']}`) comes from `build/city-maps.mjs`.
- A lawyer reviews the codes wording.
'''+''.join(f'- {n}\n' for n in c['notes']+[c['stalls']['note']])
    faq_i=body.index('## FAQ'); src_i=body.index('## Sources')
    cnt=lambda t: len(re.findall(r"\b[\w'’-]+\b",t))
    w,wf=cnt(body[:faq_i]),cnt(body[:src_i])
    fm=f'''---
url: /service-area/{c['slug']}
title: Bathroom Partitions in {city}, {c['st']} | Next Partitions
meta: {c['meta']}
h1: Bathroom Partitions in {city}
city: {city}
state: {c['state']}
lat: {c['lat']}
lng: {c['lng']}
primary_keyword: bathroom partitions {city.lower()} (calendar {c['cal']}, month 1)
secondary_keywords: [toilet partitions {city.lower()}, restroom partitions {city.lower()}, commercial bathroom partitions {city.lower()}]
date: 2026-11-24
words: {round(w,-1):,} ({round(wf,-1):,} with FAQ)
---

'''
    open(OUT+f"service-area_{c['slug']}.md",'w').write(fm+body+notes)
    print(c['slug'],w,wf,len(c['meta']))
