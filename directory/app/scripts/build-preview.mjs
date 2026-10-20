// Builds dist-preview/: the clickable prototype. index.html is the app (every page of the directory, the
// application, the customer's quote, the installer portal and job coordination, routed after the #). Next to it,
// the homepage and configurator prototypes from ../../prototypes with their links pointed into the app.
import { execSync } from 'node:child_process'
import { cpSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'

execSync('npx vite build --config vite.preview.config.ts', { stdio: 'inherit' })
const out = 'dist-preview'
writeFileSync(`${out}/index.html`, readFileSync(`${out}/preview/index.html`, 'utf8').replaceAll('../assets/', 'assets/'))
rmSync(`${out}/preview`, { recursive: true })
cpSync('../../prototypes/img', `${out}/img`, { recursive: true })

const APP = 'index.html#'
const page = (html) => (/<meta charset/i.test(html) ? html : '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + html)
// A slim bar on the prototype pages too, so you can always get back.
const bar = `<nav style="background:#0a0a0a;color:#fff;font:12px/1.4 Inter,system-ui,sans-serif;padding:8px 16px;display:flex;flex-wrap:wrap;gap:6px 16px;position:relative;z-index:1000">
<b style="text-transform:uppercase;letter-spacing:.08em;color:#ffffff99">Prototype</b>
<a style="color:#fff" href="${APP}/">Start</a><a style="color:#fff" href="homepage.html">Homepage idea</a><a style="color:#fff" href="${APP}/area/dallas">Find an installer</a>
<a style="color:#fff" href="configurator.html#dfw">Configurator</a><a style="color:#fff" href="${APP}/portal">Installer's view</a><a style="color:#fff" href="${APP}/portal/coordinator">Your team's view</a>
<a style="color:#fff" href="${APP}/quote/sample-j1048">Customer's quote</a><a style="color:#fff" href="${APP}/apply">Installer sign-up</a></nav>`
// Added by script: some prototypes have no <body> tag to insert into.
const withBar = (html) => `${html}\n<script>document.body.insertAdjacentHTML('afterbegin', ${JSON.stringify(bar)})</script>\n`
const check = (name, html) => {
  const left = html.match(/https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+/g)
  if (left) throw new Error(`${name} still links to ${[...new Set(left)].join(', ')}`)
  return html
}

// Configurator installation step (prototype of Marc's configurator).
let cfg = readFileSync('../../prototypes/configurator-install.html', 'utf8')
cfg = cfg
  .replaceAll('https://claude.ai/artifact/Hp9kJEgkaRXCtjoxWMkXPx#acme', `${APP}/installer/acme`)
  .replaceAll('https://claude.ai/artifact/GTV4xGPD5C53v3ERHQyVAW', `${APP}/state/texas`)
  .replaceAll('https://claude.ai/artifact/EAVGm8PLp8dyhvnoFTei68', 'homepage.html')
  .replaceAll(' target="_blank" rel="noopener"', '')
  .replaceAll('approved installer', 'verified installer')
  .replace('<p style="font-size:13px;margin-top:12px">Mockup: nothing was sent.</p>',
    `<p style="font-size:13px;margin-top:12px">Mockup: nothing was sent. <a class="link" href="${APP}/quote/sample-j1044">See the quote a customer gets once installers have priced the job</a>.</p>`)
writeFileSync(`${out}/configurator.html`, check('configurator', withBar(page(cfg))))

// Homepage ideas for Marc: quote links go to the configurator prototype, the service area to the directory.
let home = readFileSync('../../prototypes/homepage-grid.html', 'utf8')
home = home
  .replace(/https:\/\/nextpartitions\.com\/get-a-quote(\?[^"'`]*)?/g, 'configurator.html')
  .replaceAll('https://nextpartitions.com/service-area', `${APP}/service-area`)
  .replaceAll('https://claude.ai/artifact/GTV4xGPD5C53v3ERHQyVAW', `${APP}/state/texas`)
  .replaceAll('https://claude.ai/artifact/JRhaXC9GfSmJveMYCJPSdL', `${APP}/area/dallas`)
  .replaceAll('https://claude.ai/artifact/Gz25gTarUFNBiC4uJ2Uxfs', 'configurator.html#dfw')
writeFileSync(`${out}/homepage.html`, check('homepage', withBar(page(home))))
// dist-preview/artifact/: the same files for publishing as a claude.ai artifact, whose host adds the document
// skeleton around index.html (so that page is written without <html>, <head> or <body>).
const built = readFileSync(`${out}/index.html`, 'utf8')
const tags = [...built.matchAll(/<(script|link)[^>]*(?:src|href)="assets\/[^"]+"[^>]*>(?:<\/script>)?/g)].map((m) => m[0])
const art = `${out}/artifact`
rmSync(art, { recursive: true, force: true })
cpSync(`${out}/assets`, `${art}/assets`, { recursive: true })
cpSync(`${out}/img`, `${art}/img`, { recursive: true })
cpSync(`${out}/homepage.html`, `${art}/homepage.html`)
cpSync(`${out}/configurator.html`, `${art}/configurator.html`)
writeFileSync(`${art}/index.html`, `<title>Next Partitions Prototype</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap">
${tags.join('\n')}
<div id="root" class="pb-20 sm:pb-0"></div>
`)
console.log('prototype built: index.html (app), homepage.html, configurator.html, artifact/')
