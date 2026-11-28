"""Generates supabase/migrations/20261103000100_areas_data.sql: one directory area per city page in the
February 2026 strategy calendar (the live site's planned /service-area/[city]/ pages), all unpublished.

Centres and the nearby cities each area lists come from the US Census Bureau (public domain):
  2024 Gazetteer places and counties   https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/
  2023 city population estimates       https://www2.census.gov/programs-surveys/popest/datasets/2020-2023/cities/totals/sub-est2023.csv

Usage: python3 scripts/build-areas.py <calendar.xlsx> <2024_Gaz_place_national.txt> <2024_Gaz_counties_national.txt> <sub-est2023.csv>
Don't edit the generated SQL by hand; change this script and rerun it.
"""
import csv, math, re, sys
import openpyxl

cal, places_txt, counties_txt, pop_csv = sys.argv[1:5]
OUT = 'supabase/migrations/20261103000100_areas_data.sql'
RADIUS_MI, MIN_POP, MAX_CITIES = 30, 25000, 9

STATE_SLUG = {  # USPS code -> state hub slug (matches 20261103000000_states.sql)
    'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california', 'CO': 'colorado',
    'CT': 'connecticut', 'DE': 'delaware', 'DC': 'district-of-columbia', 'FL': 'florida', 'GA': 'georgia',
    'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa', 'KS': 'kansas',
    'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland', 'MA': 'massachusetts',
    'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri', 'MT': 'montana',
    'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new-hampshire', 'NJ': 'new-jersey', 'NM': 'new-mexico',
    'NY': 'new-york-state', 'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio', 'OK': 'oklahoma',
    'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina', 'SD': 'south-dakota',
    'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont', 'VA': 'virginia', 'WA': 'washington',
    'WV': 'west-virginia', 'WI': 'wisconsin', 'WY': 'wyoming',
}
# Calendar names that don't match a Census place name directly.
PLACE_NAME = {
    ('New York City', 'NY'): 'New York city', ('Washington', 'DC'): 'Washington city',
    ('Nashville', 'TN'): 'Nashville-Davidson metropolitan government (balance)',
    ('Louisville', 'KY'): 'Louisville/Jefferson County metro government (balance)',
    ('Lexington', 'KY'): 'Lexington-Fayette urban county', ('Indianapolis', 'IN'): 'Indianapolis city (balance)',
    ('Honolulu', 'HI'): 'Urban Honolulu CDP', ('Anchorage', 'AK'): 'Anchorage municipality',
    ('Boise', 'ID'): 'Boise City city',
}
REGIONS = {  # areas that are counties or groups of counties, not one city
    'orange-county': ('Orange County', 'CA', ['Orange County'], 'Orange County'),
    'long-island': ('Long Island', 'NY', ['Nassau County', 'Suffolk County'], 'Long Island'),
}
CENTER = {'san-francisco': (37.7749, -122.4194)}  # the Census point is offshore (the city includes the Farallon Islands)
RADIUS = {'orange-county': 15}                     # keep to the county, not Riverside or Ontario
SAME_STATE = {'long-island'}                       # not Connecticut across the Sound
EXCLUDE = {'long-island': {'Port Chester'}}        # Westchester, across the Sound
SKIP = {'oklahoma-city-ok'}  # calendar duplicate of #44 Oklahoma City
KEEP = {'dallas'}            # created by 20261102000000; left as is
# Note: 20261105130000_split_dallas_fort_worth.sql later splits Dallas and Fort Worth so their city lists don't
# overlap (each nearby city goes to the closer centre). Keep that in mind if this file is ever regenerated.

def miles(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(h))

def rows(path):
    with open(path, encoding='latin-1') as f:
        r = csv.reader(f, delimiter='\t')
        head = [h.strip() for h in next(r)]
        for x in r:
            yield dict(zip(head, (v.strip() for v in x)))

pop = {}
with open(pop_csv, encoding='latin-1') as f:
    for r in csv.DictReader(f):
        if r['SUMLEV'] in ('162', '170', '172') and r['PLACE'] != '00000':
            pop[r['STATE'] + r['PLACE']] = max(pop.get(r['STATE'] + r['PLACE'], 0), int(r['POPESTIMATE2023']))

places = []
for p in rows(places_txt):
    places.append({'usps': p['USPS'], 'name': p['NAME'], 'geoid': p['GEOID'], 'lsad': p['LSAD'], 'funcstat': p['FUNCSTAT'],
                   'pt': (float(p['INTPTLAT']), float(p['INTPTLONG'])), 'pop': pop.get(p['GEOID'], 0)})
counties = {(c['USPS'], c['NAME']): (float(c['INTPTLAT']), float(c['INTPTLONG'])) for c in rows(counties_txt)}

SUFFIX = re.compile(r' (city|town|village|borough|municipality|CDP|urban county|city \(balance\)|metropolitan government \(balance\)|metro government \(balance\))$')
def short(name):
    n = SUFFIX.sub('', name)
    return {'Nashville-Davidson': 'Nashville', 'Louisville/Jefferson County': 'Louisville', 'Lexington-Fayette': 'Lexington',
            'Urban Honolulu': 'Honolulu', 'Boise City': 'Boise', 'Indianapolis city': 'Indianapolis',
            'New York': 'New York City', 'Franklin Town': 'Franklin'}.get(n, n)

def find(city, st):
    want = PLACE_NAME.get((city, st))
    cands = [p for p in places if p['usps'] == st and (p['name'] == want if want else short(p['name']) == city and p['name'] != city + ' CDP')]
    if not cands:
        raise SystemExit(f'No Census place for {city}, {st}')
    return max(cands, key=lambda p: p['pop'])

def nearby(center, st, main_name, slug):
    near = [p for p in places if p['funcstat'] == 'A' and p['pop'] >= MIN_POP and miles(center, p['pt']) <= RADIUS.get(slug, RADIUS_MI)
            and (slug not in SAME_STATE or p['usps'] == st)]
    names, seen = [main_name], {main_name}
    for p in sorted(near, key=lambda p: -p['pop']):
        n = short(p['name'])
        if n not in seen and n not in EXCLUDE.get(slug, ()):
            names.append(n); seen.add(n)
        if len(names) >= MAX_CITIES:
            break
    return names

wb = openpyxl.load_workbook(cal, read_only=True)
cal_rows = [r for r in wb['Service Area Calendar'].iter_rows(values_only=True) if r and isinstance(r[0], (int, float)) and len(r) > 5 and r[5]]
out = []
for r in cal_rows:
    city, st, slug = r[3].strip(), (r[4] or '').strip(), r[5].strip('/').split('/')[-1]
    if slug in SKIP or slug in KEEP:
        continue
    if slug in REGIONS:
        name, st, county_names, short_name = REGIONS[slug]
        pts = [counties[(st, c)] for c in county_names]
        center = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
        cities = nearby(center, st, short_name, slug)[1:]
        out.append((slug, name, short_name, st, center, cities))
        continue
    p = find(city, st)
    name = 'New York City' if slug == 'new-york' else 'Washington, DC' if slug == 'washington-dc' else city
    short_name = 'NYC' if slug == 'new-york' else 'DC' if slug == 'washington-dc' else city
    center = CENTER.get(slug, p['pt'])
    out.append((slug, name, short_name, st, center, nearby(center, st, short(p['name']), slug)))

def q(s): return "'" + s.replace("'", "''") + "'"
def arr(xs): return "'{" + ','.join('"' + x.replace('"', '') + '"' for x in xs).replace("'", "''") + "}'"
lines = [f"({q(s)}, {q(n)}, {q(sn)}, {q(st)}, {q(STATE_SLUG[st])}, {c[0]:.4f}, {c[1]:.4f}, {arr(cs)})" for s, n, sn, st, c, cs in out]
with open(OUT, 'w') as f:
    f.write('-- ' + str(len(out)) + ' directory areas, one per city page in the 2026-02 strategy calendar, all unpublished.\n'
            '-- Generated by scripts/build-areas.py from US Census Bureau data (public domain); don\'t edit by hand.\n'
            '-- An area goes live (published = true) once 3+ installers are listed in it.\n\n'
            'insert into dir_areas (slug, name, short_name, state, state_slug, center_lat, center_lng, cities) values\n'
            + ',\n'.join(lines) + '\non conflict (slug) do nothing;\n')
print(len(out), 'areas ->', OUT)
for s, n, sn, st, c, cs in out:
    print(f'{s:18} {st} {c[0]:.3f},{c[1]:.3f}  {", ".join(cs)}')
