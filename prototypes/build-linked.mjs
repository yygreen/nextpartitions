// Builds linked/: the five prototypes as one clickable site with relative links (no claude.ai hops).
// Run: node prototypes/build-linked.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, 'linked')
rmSync(out, { recursive: true, force: true })
mkdirSync(out)
cpSync(join(here, 'img'), join(out, 'img'), { recursive: true })

const pages = {
  'index.html': 'homepage-grid.html',
  'texas.html': 'installers-texas.html',
  'dfw.html': 'installers-dfw.html',
  'profile.html': 'installer-profile.html',
  'configurator.html': 'configurator-install.html',
}
// Every artifact id the prototypes have used for each page, old and new.
const ids = {
  EAVGm8PLp8dyhvnoFTei68: 'index.html',
  GTV4xGPD5C53v3ERHQyVAW: 'texas.html', LZqngrbkARWrHC23dqswt5: 'texas.html',
  JRhaXC9GfSmJveMYCJPSdL: 'dfw.html', Emsk4xQGarEUxTuXLLdm1q: 'dfw.html',
  Hp9kJEgkaRXCtjoxWMkXPx: 'profile.html',
  Gz25gTarUFNBiC4uJ2Uxfs: 'configurator.html',
}
for (const [file, src] of Object.entries(pages)) {
  let html = readFileSync(join(here, src), 'utf8')
  for (const [id, to] of Object.entries(ids)) html = html.replaceAll(`https://claude.ai/artifact/${id}`, to)
  html = html.replaceAll('https://nextpartitions.com/get-a-quote', 'configurator.html')
  html = html.replaceAll(' target="_blank" rel="noopener"', '').replaceAll(" target=\"_blank\"", '')
  const left = html.match(/https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+/g)
  if (left) throw new Error(`${src} still links to ${[...new Set(left)].join(', ')}`)
  if (!/<meta charset/i.test(html)) html = '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + html
  writeFileSync(join(out, file), html)
}
console.log('linked prototype built:', Object.keys(pages).join(', '))
