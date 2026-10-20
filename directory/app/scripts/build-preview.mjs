// Builds dist-preview/: one HTML file per page, the shared JS/CSS, and the configurator prototype.
import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'

execSync('npx vite build --config vite.preview.config.ts', { stdio: 'inherit' })
const out = 'dist-preview'
const shell = readFileSync(`${out}/preview/index.html`, 'utf8').replaceAll('../assets/', 'assets/')
rmSync(`${out}/preview`, { recursive: true })

const pages = [
  ['index.html', 'hub', ''], ['service-area.html', 'service-area', ''],
  ['area-dallas.html', 'area', 'dallas'], ['area-houston.html', 'area', 'houston'], ['area-san-antonio.html', 'area', 'san-antonio'],
  ['installer-acme.html', 'installer', 'acme'], ['installer-northwind.html', 'installer', 'northwind'],
  ['installer-contoso.html', 'installer', 'contoso'], ['installer-gulfline.html', 'installer', 'gulfline'],
  ['portal.html', 'portal', ''], ['apply.html', 'apply', ''],
]
for (const [file, page, slug] of pages) {
  writeFileSync(`${out}/${file}`, shell.replace('<body class="pb-20 sm:pb-0">', `<body class="pb-20 sm:pb-0" data-page="${page}" data-slug="${slug}">`))
}

// The configurator prototype, with its links pointed back into this preview.
let cfg = readFileSync('../../prototypes/configurator-install.html', 'utf8')
cfg = cfg
  .replaceAll('https://claude.ai/artifact/Hp9kJEgkaRXCtjoxWMkXPx#acme', 'installer-acme.html')
  .replaceAll('https://claude.ai/artifact/GTV4xGPD5C53v3ERHQyVAW', 'index.html')
  .replaceAll('https://claude.ai/artifact/EAVGm8PLp8dyhvnoFTei68', 'index.html')
  .replaceAll(' target="_blank" rel="noopener"', '')
if (!/<meta charset/i.test(cfg)) cfg = '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + cfg
writeFileSync(`${out}/configurator.html`, cfg)
mkdirSync(`${out}/img`, { recursive: true })
for (const f of ['logo.png', 'phenolic.jpg', 'plastic-laminate.jpg', 'powder-coated.jpg', 'solid-plastic.jpg']) {
  copyFileSync(`../../prototypes/img/${f}`, `${out}/img/${f}`)
}
console.log('preview built:', pages.length + 1, 'pages')
