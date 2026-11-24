"""Base figures for every city buy page, from sources a script can read:
- areas (slug, name, state, centre, nearby cities): directory/supabase/migrations
- climate: NOAA NCEI Comparative Climatic Data (annual precipitation normal 1991-2020, days with rain, relative humidity)
- carpenter wages (47-2031): O*NET OnLine local wages, which republishes the Bureau of Labor Statistics figures

Usage: python3 build.py  ->  cities.json. Station and metro matches are in OVERRIDE below; unmatched ones are listed.
"""
import json, math, os, re, subprocess, sys, time, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
CACHE = os.path.join(HERE, 'raw'); os.makedirs(CACHE, exist_ok=True)
NOAA = {'precip': 'https://www.ncei.noaa.gov/sites/default/files/2025-02/nrmpcp.txt',
        'humidity': 'https://www.ncei.noaa.gov/sites/default/files/2024-11/relhum23.txt',
        'raindays': 'https://www.ncei.noaa.gov/sites/default/files/2024-11/prge0123.txt'}
ONET = 'https://www.onetonline.org/link/localwages/47-2031.00?st=%s'

def get(url, name):
    p = os.path.join(CACHE, name)
    if not os.path.exists(p):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        open(p, 'wb').write(urllib.request.urlopen(req, timeout=60).read()); time.sleep(1)
    return open(p, encoding='latin-1').read()

# ---- areas
areas = {}
mig = os.path.join(ROOT, 'directory', 'supabase', 'migrations')
for f in sorted(os.listdir(mig)):
    for m in re.finditer(r"\('([a-z-]+)', '([^']+)', '([^']+)', '([A-Z]{2})', '([a-z-]+)', (-?[\d.]+), (-?[\d.]+), '\{([^}]*)\}'\)", open(os.path.join(mig, f)).read()):
        s, name, short, st, sslug, lat, lng, cities = m.groups()
        areas[s] = dict(slug=s, name=name, city=short, state=st, state_slug=sslug, lat=float(lat), lng=float(lng),
                        cities=[c.strip('"').replace("''", "'") for c in cities.split(',')])
areas['dallas'] = dict(slug='dallas', name='Dallas', city='Dallas', state='TX', state_slug='texas', lat=32.7936, lng=-96.7662,
                       cities=['Dallas', 'Plano', 'Irving', 'Garland', 'Frisco', 'McKinney', 'Grand Prairie', 'Carrollton', 'Lewisville'])
areas['fort-worth']['cities'] = ['Fort Worth', 'Arlington', 'Mansfield', 'North Richland Hills', 'Flower Mound', 'Denton']
want = [a['slug'] for a in json.load(open(os.path.join(ROOT, 'research', 'installers', 'areas.json')))][:99]

# ---- climate
def stations(text, kind):
    out = {}
    for line in text.splitlines():
        m = re.match(r'(?:USW000)?(\d{5})(.+?),\s*([A-Z]{2})\s+(.*)$', line)
        if not m: continue
        wban, nm, st, rest = m.groups()
        nums = re.findall(r'-?\d+\.?\d*', re.sub(r'^\s*\d{4,6}-\d{4,6}', '', rest))
        por = re.match(r'\s*(\d{4})\d{0,2}-(\d{4})', rest)
        out[wban] = dict(name=nm.strip().title(), state=st, nums=nums, por=por.groups() if por else None)
    return out
P = stations(get(NOAA['precip'], 'nrmpcp.txt'), 'p'); H = stations(get(NOAA['humidity'], 'relhum23.txt'), 'h'); D = stations(get(NOAA['raindays'], 'prge0123.txt'), 'd')

# slug -> station name as NOAA lists it (state taken from the area unless given)
OVERRIDE_STATION = json.load(open(os.path.join(HERE, 'station-overrides.json'))) if os.path.exists(os.path.join(HERE, 'station-overrides.json')) else {}
NEARBY = {'durham', 'fort-worth', 'long-island', 'mesa', 'modesto', 'ontario', 'riverside', 'orange-county', 'san-jose',
          'st-petersburg', 'tacoma', 'virginia-beach'}  # no station of their own in the NOAA list: nearest one used
def norm(n): return re.sub(r'[^A-Z]', '', n.upper().replace('AP', ''))
def find(tbl, a):
    o = OVERRIDE_STATION.get(a['slug']); key = norm(o or a['city'])
    st = 'DC' if a['slug'] == 'washington-dc' else a['state']
    c = [w for w, s in tbl.items() if s['state'] == st and (norm(s['name']) == key or (not o and norm(s['name']).startswith(key)))]
    return c[0] if c else None

# ---- wages
def wage_table(st):
    h = get(ONET % st, 'onet-%s.html' % st)
    i = h.find('Hourly'); rows = {}
    for tb in re.findall(r'<table.*?</table>', h, re.S):
        if 'Hourly' not in tb: continue
        for tr in re.findall(r'<tr.*?</tr>', tb, re.S):
            cells = [re.sub(r'<[^>]+>', '', c).strip().replace('&#8211;', '-') for c in re.findall(r'<t[dh].*?</t[dh]>', tr, re.S)]
            if len(cells) >= 6 and cells[1].startswith('$'):
                rows[cells[0]] = [float(x.replace('$', '').replace(',', '').rstrip('+')) if x.startswith('$') else None for x in cells[1:6]]
    return rows
OVERRIDE_METRO = json.load(open(os.path.join(HERE, 'metro-overrides.json'))) if os.path.exists(os.path.join(HERE, 'metro-overrides.json')) else {}

out, problems = [], []
for s in want:
    a = dict(areas[s]); st = a['state']
    p, h, d = find(P, a), find(H, a), find(D, a)
    if p or h or d:
        ref = (P.get(p) or H.get(h) or D.get(d))
        a['climate'] = dict(station=ref['name'] + ', ' + ref['state'], wban=p or h or d, nearby_station=s in NEARBY,
                            precip_in=float(P[p]['nums'][-1]) if p else None,
                            rain_days=int(D[d]['nums'][-1]) if d else None, rain_days_period='%s–%s' % D[d]['por'] if d else None,
                            humidity_morning=int(H[h]['nums'][-2]) if h else None, humidity_afternoon=int(H[h]['nums'][-1]) if h else None,
                            humidity_period='%s–%s' % H[h]['por'] if h else None, sources=NOAA)
    if not (p and h and d): problems.append('station %s %s %s' % (s, st, (p, h, d)))
    rows = wage_table(st)
    us = rows.get('United States')
    key = OVERRIDE_METRO.get(s)
    m = [k for k in rows if k == key] if key else [k for k in rows if re.split(r'[-,]', k)[0].strip() == a['city'] or a['city'] in re.split(r',', k)[0].split('-')]
    m = [k for k in m if k not in ('United States',)]
    if len(m) == 1 and us:
        r = rows[m[0]]
        a['wage'] = dict(metro=m[0], median_hourly=r[2], us_median_hourly=us[2], pct_vs_us=round((r[2] / us[2] - 1) * 100),
                         url=ONET % st, occupation='47-2031 Carpenters')
    else: problems.append('metro %s %s %s' % (s, st, m or [k for k in rows][:40]))
    out.append(a)
json.dump(out, open(os.path.join(HERE, 'cities.json'), 'w'), indent=1, ensure_ascii=False)
print(len(out), 'cities;', len(problems), 'to fix'); print('\n'.join(problems))
