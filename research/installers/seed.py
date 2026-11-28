"""Seed candidates per area from DataForSEO (Google Maps and Google organic results).

Usage: python3 seed.py areas.json slug [slug ...]
areas.json: the dir_areas rows (slug, name, state, cities, center_lat, center_lng).
Writes raw/seeds/<slug>.json. Needs DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD. About $0.002 a query.
"""
import base64, json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
AUTH = base64.b64encode(f"{os.environ['DATAFORSEO_LOGIN']}:{os.environ['DATAFORSEO_PASSWORD']}".encode()).decode()
MAPS_KW = ['toilet partitions', 'toilet partition installation', 'bathroom partitions', 'restroom partitions',
           'division 10 specialties contractor', 'commercial bathroom accessories installer']
WEB_KW = ['toilet partition installation {city}', 'bathroom partition installers {city}', 'division 10 specialties contractor {city}']
SKIP = {'yelp.com', 'bbb.org', 'facebook.com', 'linkedin.com', 'houzz.com', 'angi.com', 'homeadvisor.com',
        'thumbtack.com', 'yellowpages.com', 'mapquest.com', 'amazon.com', 'homedepot.com', 'lowes.com', 'youtube.com',
        'reddit.com', 'indeed.com', 'zoominfo.com', 'nextpartitions.com'}

def post(path, tasks):
    req = urllib.request.Request('https://api.dataforseo.com/v3/' + path, data=json.dumps(tasks).encode(),
                                 headers={'Authorization': 'Basic ' + AUTH, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=120))

def seed(a):
    coord = f"{a['center_lat']},{a['center_lng']},10z"
    res = {}
    for k in MAPS_KW:
        d = post('serp/google/maps/live/advanced', [{'keyword': k, 'location_coordinate': coord, 'language_code': 'en', 'depth': 40}])
        for i in ((d['tasks'][0].get('result') or [{}])[0].get('items') or []):
            key = (i.get('title') or '').lower()
            if not key: continue
            r = res.setdefault(key, {'name': i.get('title'), 'category': i.get('category'),
                                     'city': (i.get('address_info') or {}).get('city'),
                                     'website': i.get('url') or i.get('domain'), 'phone': i.get('phone'),
                                     'rating': (i.get('rating') or {}).get('value'),
                                     'reviews': (i.get('rating') or {}).get('votes_count'), 'queries': []})
            r['queries'].append('maps: ' + k)
    web = {}
    for k in WEB_KW:
        q = k.format(city=f"{a['name']} {a['state']}")
        d = post('serp/google/organic/live/advanced', [{'keyword': q, 'location_code': 2840, 'language_code': 'en', 'depth': 20}])
        for i in ((d['tasks'][0].get('result') or [{}])[0].get('items') or []):
            if i.get('type') not in ('organic', 'knowledge_graph') or not i.get('title'): continue
            dom = (i.get('domain') or '').removeprefix('www.')
            if any(dom.endswith(x) for x in SKIP) or any(x.split('.')[0] in (i.get('title') or '').lower() for x in SKIP): continue
            # Google sometimes wraps result links in google.com/goto; keep the title and link either way
            w = web.setdefault((i.get('title') or '').lower(), {'title': i.get('title'), 'url': i.get('url'),
                               'domain': None if dom == 'google.com' else dom, 'queries': []})
            w['queries'].append(q)
    out = {'area': a['slug'], 'maps': list(res.values()), 'web': list(web.values())}
    json.dump(out, open(os.path.join(HERE, 'raw', 'seeds', a['slug'] + '.json'), 'w'), indent=1)
    return out

if __name__ == '__main__':
    areas = {x['slug']: x for x in json.load(open(sys.argv[1]))}
    for s in sys.argv[2:]:
        o = seed(areas[s])
        print(s, len(o['maps']), 'maps,', len(o['web']), 'web')
