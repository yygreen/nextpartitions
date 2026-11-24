"""Write city buy pages from the research packs.

Reads research/city-base/cities.json (centre, nearby cities, NOAA climate, carpenter wage), the state pack
research/city-pages/states/<ST>.json, the city pack research/city-pages/cities/<slug>.json and the contractor rule in
research/local-rules/cities.json; writes site-content/pages/service-area_<slug>.md.

Usage: python3 gen_from_packs.py [slug ...]   (no slugs: every city that has both packs)
The five hand-written pages (HAND) are never overwritten.
"""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
R = lambda *p: os.path.join(ROOT, *p)
HAND = {'houston', 'los-angeles', 'miami', 'dallas', 'seattle'}
BASE = {c['slug']: c for c in json.load(open(R('research/city-base/cities.json')))}
LOCAL = {c['slug']: c for c in json.load(open(R('research/local-rules/cities.json')))}
LIC = {c['code']: c for c in json.load(open(R('research/state-licensing/states.json')))}
STATE_NAME = lambda b: 'New York' if b['state_slug'] == 'new-york-state' else ' '.join(w if w == 'of' else w.capitalize() for w in b['state_slug'].split('-'))
DRY_STATES_COLD = set('WA OR AK ID MN WI MI IL IN OH PA NY NJ CT RI MA IA NE SD CO UT MD DC MO KS KY VA'.split())

def poss(city):  # "Houston's climate" / "the Dallas climate"
    return 'the %s climate' % city if city.endswith('s') or ',' in city else "%s's climate" % city

def climate(b):
    c, city, st = b['climate'], b['name'], b['state']
    place = city if not c.get('nearby_station') else 'The nearest long-term weather station, at %s,' % c['station'].split(',')[0]
    bits = []
    if c.get('precip_in') is not None: bits.append('about %d inches of rain a year' % round(c['precip_in']))
    if c.get('rain_days') is not None: bits.append(('on roughly %d days' if bits else 'rain on roughly %d days a year') % c['rain_days'])
    rain = ', '.join(bits)
    hum = ('relative humidity averages %d%% in the morning and %d%% in the afternoon' % (c['humidity_morning'], c['humidity_afternoon'])) if c.get('humidity_morning') else ''
    verb = 'records' if c.get('nearby_station') else 'gets'
    p, h = c.get('precip_in') or 30, c.get('humidity_morning') or 75
    if p < 20:
        kind = 'dry'
        lead = '%s %s %s%s. The weather rarely decides the material here. The room does:' % (place, verb, rain, (', and ' + hum) if hum else '')
        a = '- **Most restrooms** (offices, restaurants, retail, clinics, schools): all five materials work. Choose on looks, cleaning routine and budget.'
        z = '- **Rooms that get wet from the inside** (pool facilities, gym locker rooms, restrooms that are hosed down)'
        faq = ('Which partition material is best in %s?' % city, 'The dry climate suits all five. Choose HDPE or phenolic only where the room itself gets wet: pools, locker rooms and restrooms that are hosed down.')
    elif st in DRY_STATES_COLD:
        kind = 'cold'
        lead = '%s %s %s%s. What that means for partitions depends on whether the restroom is heated and ventilated:' % (place, verb, rain, (', and ' + hum) if hum else '')
        a = '- **Heated, ventilated restrooms** (offices, restaurants, clinics, most schools): all five materials work. Choose on looks, cleaning routine and budget.'
        z = '- **Unheated restrooms or rooms open to outside air** (parks, stadiums, warehouses, pool and locker rooms)'
        faq = ('Which partition material is best for %s?' % poss(city), 'In a heated, ventilated restroom, any of the five. In an unheated restroom or one open to outside air, choose solid plastic (HDPE) or phenolic, which handle constant moisture.')
    elif h >= 83 and p >= 44:
        kind = 'humid'
        lead = '%s %s %s%s. What that means for partitions depends on whether the restroom is air-conditioned:' % (place, verb, rain, (', and ' + hum) if hum else '')
        a = '- **Air-conditioned restrooms** (offices, restaurants, clinics, most schools): all five materials work. Choose on looks, cleaning routine and budget.'
        z = '- **Restrooms open to outside air or without air conditioning** (warehouses, plants, parks, stadiums, pool and locker rooms)'
        faq = ("Which partition material is best for %s's humidity?" % city if not city.endswith('s') else 'Which partition material is best for the humidity in %s?' % city, 'In an air-conditioned restroom, any of the five. In a restroom open to outside air or without air conditioning, choose solid plastic (HDPE) or phenolic, which handle constant moisture.')
    else:
        kind = 'mixed'
        lead = '%s %s %s%s. In most %s restrooms the room decides the material, not the weather:' % (place, verb, rain, (', and ' + hum) if hum else '', city)
        a = '- **Air-conditioned restrooms** (offices, restaurants, clinics, most schools): all five materials work. Choose on looks, cleaning routine and budget.'
        z = '- **Restrooms without air conditioning, or that get wet from the inside** (warehouses, plants, parks, stadiums, pool and locker rooms)'
        faq = ('Which partition material is best in %s?' % city, 'In an air-conditioned restroom, any of the five. Where the room has no air conditioning or gets wet from the inside, choose solid plastic (HDPE) or phenolic, which handle constant moisture.')
    z += ': choose [solid plastic (HDPE)](/partitions/solid-plastic-hdpe) or [phenolic](/partitions/phenolic). Both are solid all the way through and handle constant moisture.'
    src = ['[%s](%s)' % (t, c['sources'][k]) for k, t in (
        ('precip', 'annual precipitation, %s in, 1991–2020 normal' % c.get('precip_in')), ('humidity', 'relative humidity, %s%% in the morning and %s%% in the afternoon, %s' % (c.get('humidity_morning'), c.get('humidity_afternoon'), c.get('humidity_period'))),
        ('raindays', 'days with 0.01 in or more of precipitation, %s a year' % c.get('rain_days'))) if c.get({'precip': 'precip_in', 'humidity': 'humidity_morning', 'raindays': 'rain_days'}[k]) is not None]
    source = '- %s climate: NOAA NCEI Comparative Climatic Data, station %s (WBAN %s): %s. Checked 2026-11-24.' % (city, c['station'], c['wban'], '; '.join(src))
    return lead, a, z, faq, source

def stalls(p):
    lines = [p.get('stalls_head') or 'head: Office | Restaurant | School']
    if not lines[0].startswith('head:'): lines[0] = 'head: ' + lines[0]
    for n in ('50', '100', '200', '400'):
        r = p['stalls_rows'][n]; lines.append('%s: %s | %s | %s' % (n, r['office'], r['restaurant'], r['school']))
    return ':::stalls\n' + '\n'.join(lines) + '\n:::'

def wage(b):
    w = b['wage']; metro = w['metro'].split(',')[0].replace('--', '-').replace('-', '–')
    pct = w['pct_vs_us']
    cmp_ = 'about the same as' if abs(pct) <= 1 else 'about %d%% %s' % (abs(pct), 'above' if pct > 0 else 'below')
    return ("- **Local labor rates:** carpenters in the %s area earn a median of $%.2f an hour, %s the national median of $%.2f. It's a guide to local labor rates, not a quote: installers set their own prices." % (metro, w['median_hourly'], cmp_, w['us_median_hourly']),
            '- Carpenter wages, May 2025: U.S. Bureau of Labor Statistics figures for %s and the United States, as republished by [O*NET OnLine](%s). Checked 2026-11-24.' % (w['metro'], w['url']))

def page(slug):
    b = BASE[slug]; st = b['state']
    S = json.load(open(R('research/city-pages/states/%s.json' % st)))['page']
    C = json.load(open(R('research/city-pages/cities/%s.json' % slug)))['page']
    g = lambda k, d=None: C.get(k) or S.get(k) or d
    city, state = b['name'], STATE_NAME(b)
    inst = '/installers/%s/%s' % (b['state_slug'], slug)
    lead, ca, cz, faq_mat, csrc = climate(b)
    wb, wsrc = wage(b)
    office = C['confirm_office']
    rules = [g('access_bullet'), g('fire_bullet'), C['stall_bullet'], g('code_change_bullet'), g('state_extra_bullet')] + list(C.get('extra_rule_bullets') or []) + [g('restroom_bullet'), C['permit_bullet']]
    money = [wb, C['public_jobs_bullet'], C['sales_tax_bullet'], g('tax_install_bullet'), (g('tax_ship_bullet') or '').replace('{city}', city)]
    near = [c for c in b['cities'] if c != city and c != b['city']]
    near_s = (', '.join(near[:-1]) + ' and ' + near[-1]) if len(near) > 1 else (near[0] if near else '')
    lr = LOCAL.get(slug, {}); lic = LIC.get(st, {})
    sources = ['- Freight by carrier, crated, palletized and tracked; curbside and liftgate on request: current site, [/service-area](/service-area) and [/faq](/faq). Checked 2026-11-02.',
        '- Kit weight (3-stall powder coated steel, 299.7 lb) and freight quoted with the partitions: as used and sourced on the [cost guide](/blog/bathroom-partition-cost).',
        '- Storing panels flat and letting solid plastic reach room temperature: as used and sourced on the [installation guide](/guides/how-to-install-toilet-partitions).',
        csrc,
        '- Laminate core swelling, painted steel rust, phenolic and HDPE for moisture, NFPA 286 for HDPE: as used and sourced on the [partitions page](/partitions) and the [HDPE page](/partitions/solid-plastic-hdpe).']
    sources += list(C.get('sources') or []) + [s for s in (S.get('sources') or []) if s not in (C.get('sources') or [])] + [wsrc]
    if lr.get('source_url'): sources.append('- %s contractor rule: [%s](%s). Checked 2026-11-03.' % (city, lr.get('authority') or 'city page', lr['source_url']))
    if lic.get('source_url') or lic.get('url'): sources.append('- %s contractor licensing: [%s](%s). Checked 2026-11-19.' % (state, lic.get('authority') or 'state licensing board', lic.get('source_url') or lic.get('url')))
    sources.append('- The rules by their official names: ' + re.sub(r'^- The rules by their official names: ', '', (C.get('official_names') or S.get('official_names') or '').strip()))
    notes = ['A buy page: the primary action is "Configure your partitions". The Installation section and one FAQ answer link to the installer directory page `%s`: publish this page together with that one, or hold the two links until it is live.' % inst,
        '`:::pricer` is the step-by-step pricer (email before any range); on export it is the slot `<!--np-pricer:%s-->`.' % city,
        'No prices and no lead times until the price list is in.',
        'Schema: BreadcrumbList, FAQPage and Service (provider Next Partitions, areaServed %s). No LocalBusiness: there is no %s office.' % (city, city),
        'Research: `research/city-pages/cities/%s.json` and `research/city-pages/states/%s.json` (2026-11-24). A lawyer reviews the rules wording before launch.' % (slug, st)] + list(C.get('notes') or [])
    faq_inst = 'No. We supply the partitions and the shop drawings; a contractor you hire installs them. %sOur directory lists [partition installers in %s](%s), and you can ask for installation prices with your quote.' % ((C.get('faq_install_extra').rstrip() + ' ') if C.get('faq_install_extra') else '', city, inst)
    fire = ', the fire-safety rule for solid plastic partitions' if g('fire_bullet') else ''
    t = f'''---
url: /service-area/{slug}
title: Bathroom Partitions in {city}{'' if ',' in city else ', ' + st} | Next Partitions
meta: {C['meta']}
h1: Bathroom Partitions in {city}
city: {city}
state: {state}
lat: {b['lat']}
lng: {b['lng']}
primary_keyword: bathroom partitions {city.lower().replace(',', '')}
secondary_keywords: [restroom partitions {city.lower().replace(',', '')}, toilet partitions {city.lower().replace(',', '')}, commercial bathroom partitions {city.lower().replace(',', '')}]
date: 2026-11-24
---

# Bathroom Partitions in {city}

{C['lead']}

[Configure your partitions](/get-a-quote)

:::pricer
{city}
:::

## The right material for {poss(city)}

{lead}

{ca}
{cz}

[Plastic laminate](/partitions/plastic-laminate) has a particleboard core that may swell with excessive moisture, and [powder coated steel](/partitions/powder-coated-steel) can rust where the coating is damaged, so keep both for dry rooms. [Stainless steel](/partitions/stainless-steel) resists corrosion and suits premium public restrooms. Compare all five on the [partitions page](/partitions).

## Delivery to {city} job sites

Toilet partitions for {city} ship by freight carrier, crated, palletized and tracked. Delivery is curbside, with a liftgate on request if the site has no loading dock. Tell us in your quote request:

- **The delivery address,** and whether it's a job site, a warehouse or an occupied building.
- **Dock or liftgate.** A building without a dock needs a liftgate truck.
- **Who receives it.** Crates are heavy: a published 3-stall powder coated steel kit weighs about 300 lb.
- **Where the crates wait.** Store panels flat, not leaned against a wall. Solid plastic may need about 24 hours at room temperature before it's installed, so check the manufacturer's instructions.

Freight is quoted with the partitions, so the number you get covers delivery to your {city} address.

## The rules a {city} restroom has to meet

{chr(10).join(r for r in rules if r)}

Rules change, so confirm your project with {office} or your architect. The accessible stall's sizes are in our [ADA compliance guide](/guides/ada-compliance), and fixture spacing is in the [restroom layout guide](/guides/restroom-layout).

## How many stalls a {city} restroom needs

{g('stalls_intro')}

{stalls({**S, **{k: v for k, v in C.items() if v}})}

{(g('stalls_after') or '').strip()}{' ' if g('stalls_after') and 'wheelchair accessible' not in g('stalls_after') else ''}{'' if 'wheelchair accessible' in (g('stalls_after') or '') else 'At least one stall in each room must be wheelchair accessible.'}

{g('capacity')}

## Installation in {city}

Next Partitions supplies the partitions; a contractor you hire installs them. Every order comes with shop drawings: a plan of your room with every panel, door and pilaster sized, which the installer sets out from.

Need an installer? Our directory of [partition installers in {city}]({inst}) lists local installers. Ask for installation in your quote request and we collect their prices for your job.

{C['install_rule']}

Our [installation guide](/guides/how-to-install-toilet-partitions) shows the work step by step, and [how to measure for toilet partitions](/blog/how-to-measure-for-toilet-partitions) covers what to send for an accurate quote.

## What installation labor and sales tax add in {city}

{chr(10).join(m for m in money if m)}

How tax applies depends on your contract, so confirm with {g('tax_confirm')}.

## What {city} buyers order partitions for

- **[Schools](/industries/schools):** HDPE or phenolic, heights by age group, vandal-resistant hardware.
- **Restaurants and bars:** a finish that matches the dining room, in a material that survives the nightly clean.
- **Offices and tenant build-outs:** overhead braced stalls that work with any ceiling.
- **Warehouses, plants and distribution centers:** stalls that take hard use and washdown.
- **Churches, gyms and clinics:** privacy options and accessible stalls sized to the 2010 ADA Standards.
{C.get('buyers_extra') or ''}

## Nearby cities we deliver to

{near_s}, and every other ZIP code in the {city} area. We ship to all 50 states: see the full [service area](/service-area).

## Get a quote

Price a standard layout in the configurator, or send your drawings, stall count and the material you have in mind. Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours.

[Configure your partitions](/get-a-quote)

## FAQ

### Do you deliver bathroom partitions to {city}?
Yes. Partitions ship by freight carrier to {city} and the surrounding cities, crated, palletized and tracked. Curbside and liftgate delivery are available on request.

### Does Next Partitions install partitions in {city}?
{faq_inst}

### {faq_mat[0]}
{faq_mat[1]}

### What rules does a {city} restroom have to meet?
Federal and {state} wheelchair-access rules{fire}, and the rules on how many toilets a building needs. Confirm your project with {office}.

### How do I get a price for my {city} restroom?
Answer the five questions at the top of this page, or send your drawings. Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours.

## Sources

{chr(10).join(sources)}

<!-- For Marc -->

## Implementation notes

{chr(10).join('- ' + n for n in notes)}
'''
    return re.sub(r'\n{3,}', '\n\n', t)

# ---- checks on the text a visitor reads (everything above "## Sources")
BAN = [(r' — |—', 'em dash'), (r'[Ll]ast checked|[Cc]hecked (19|20)\d\d|[Ff]igures checked', 'check date in body'),
       (r'International (Building|Plumbing|Existing)|Uniform Plumbing Code|\bI[BP]C\b|\bUPC\b|A117|§|\bSection \d|\bTable \d|\bChapter \d', 'formal code name in body'),
       (r'\bcheckout\b|place (an|your) order|order now', 'order/checkout wording'),
       (r'\b(below|following sections?) (we|covers?)\b|in this (guide|section) we', 'signposting'), (r'\{city\}|\bNone\b|\bnull\b|TODO', 'unfilled value')]
def check(slug, t):
    body = t.split('\n## Sources')[0].split('---', 2)[2]
    out = ['%s: %s: %s' % (slug, why, m.group(0)) for pat, why in BAN for m in [re.search(pat, body)] if m]
    for l in re.search(r':::stalls\n(.*?)\n:::', t, re.S).group(1).split('\n')[1:]:
        for cell in l.split(':', 1)[1].split('|'):
            if not re.fullmatch(r'\s*\d+/(~?\d+|\d+\+\d+)(;[^|]*)?\s*', cell): out.append('%s: stall cell "%s"' % (slug, cell.strip()))
    meta = re.search(r'^meta: (.*)$', t, re.M).group(1)
    if len(meta) > 160: out.append('%s: meta %d chars' % (slug, len(meta)))
    return out

if __name__ == '__main__':
    slugs = sys.argv[1:] or [s for s in BASE if s not in HAND and os.path.exists(R('research/city-pages/cities/%s.json' % s)) and os.path.exists(R('research/city-pages/states/%s.json' % BASE[s]['state']))]
    probs = []
    for s in slugs:
        if s in HAND: print('skip (hand-written):', s); continue
        try: t = page(s)
        except Exception as e: probs.append('%s: could not build: %r' % (s, e)); continue
        open(R('site-content/pages/service-area_%s.md' % s), 'w').write(t); probs += check(s, t)
    print('%d pages written' % (len(slugs))); print('\n'.join(probs))
