// Builds linked/: the prototypes as one clickable site with relative links (no claude.ai hops).
// Run: node prototypes/build-linked.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
// `node build-linked.mjs separate` builds separate/: one page per artifact, links pointing at each
// page's own artifact URL (from separate-urls.json), opened in a new tab as the artifact viewer requires.
const separate = process.argv[2] === 'separate'
const urls = separate ? JSON.parse(readFileSync(join(here, 'separate-urls.json'), 'utf8')) : {}
const out = join(here, separate ? 'separate' : 'linked')
rmSync(out, { recursive: true, force: true })
mkdirSync(out)
cpSync(join(here, 'img'), join(out, 'img'), { recursive: true })

const pages = {
  'index.html': 'start.html',
  'home.html': 'homepage-grid.html',
  'texas.html': 'installers-texas.html',
  'dfw.html': 'installers-dfw.html',
  'profile.html': 'installer-profile.html',
  'configurator.html': 'configurator-install.html',
  'portal.html': 'installer-portal.html',
  'quote.html': 'customer-quote.html',
  'apply.html': 'installer-apply.html',
  'vetting.html': 'installer-vetting.html',
  'review.html': 'review-request.html',
  'emails.html': 'email-copy.html',
}
// Every artifact id the prototypes have used for each page, old and new.
const ids = {
  EAVGm8PLp8dyhvnoFTei68: 'home.html',
  GTV4xGPD5C53v3ERHQyVAW: 'texas.html', LZqngrbkARWrHC23dqswt5: 'texas.html',
  JRhaXC9GfSmJveMYCJPSdL: 'dfw.html', Emsk4xQGarEUxTuXLLdm1q: 'dfw.html',
  Hp9kJEgkaRXCtjoxWMkXPx: 'profile.html',
  Gz25gTarUFNBiC4uJ2Uxfs: 'configurator.html',
}
for (const [file, src] of Object.entries(pages)) {
  let html = readFileSync(join(here, src), 'utf8')
  if (separate) {
    for (const [id, to] of Object.entries(ids)) if (urls[to] && !to.startsWith('index')) html = html.replaceAll(`https://claude.ai/artifact/${id}`, urls[to])
    html = html.replaceAll('https://nextpartitions.com/get-a-quote', urls['configurator.html'])
    // relative links between pages (e.g. the start page) -> artifact URLs
    for (const [f, u] of Object.entries(urls)) html = html.replaceAll(`href="${f}`, `target="_blank" rel="noopener" href="${u}`)
    // every link to another prototype opens in a new tab (the artifact viewer won't navigate in place)
    html = html.replace(/<a\b(?![^>]*\btarget=)([^>]*\bhref="https:\/\/claude\.ai\/artifact\/)/g, '<a target="_blank" rel="noopener"$1')
    const stale = (html.match(/https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+/g) || []).filter((u) => !Object.values(urls).includes(u))
    if (stale.length) throw new Error(`${src} still links to ${[...new Set(stale)].join(', ')}`)
  } else {
    for (const [id, to] of Object.entries(ids)) html = html.replaceAll(`https://claude.ai/artifact/${id}`, to)
    html = html.replaceAll('https://nextpartitions.com/get-a-quote', 'configurator.html')
    html = html.replaceAll(' target="_blank" rel="noopener"', '').replaceAll(" target=\"_blank\"", '')
    const left = html.match(/https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+/g)
    if (left) throw new Error(`${src} still links to ${[...new Set(left)].join(', ')}`)
  }
  if (!/<meta charset/i.test(html)) html = '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + html
  writeFileSync(join(out, file), html)
}
console.log('linked prototype built:', Object.keys(pages).join(', '))
