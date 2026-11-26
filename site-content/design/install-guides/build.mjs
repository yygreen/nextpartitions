// Builds the installation overview guides: out/<style>.html and out/<style>.pdf (US Letter), from guides.mjs and the
// step images in img/ (node render-shots.mjs first). Brand: orange #fe7802, dark brown #1c0e05, Inter.
import { writeFile, mkdir, copyFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { GUIDES, NAMES, COMMON } from './guides.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const HERE = fileURLToPath(new URL('.', import.meta.url))
const OUT = join(HERE, 'out')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
await mkdir(OUT, { recursive: true })
await copyFile(join(HERE, '../../../prototypes/img/logo.png'), join(OUT, 'logo.png'))

const CSS = `
@page{size:Letter;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;color:#1c0e05;font-size:10.5pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:8.5in;height:11in;position:relative;overflow:hidden;page-break-after:always;padding:.6in .65in .8in}
.pg:last-child{page-break-after:auto}
.top{display:flex;align-items:center;gap:8px;font-weight:700;font-size:10pt;margin-bottom:.3in}
.top img{width:22px}.top .r{margin-left:auto;font-weight:600;color:#7a6a5e;font-size:9pt}
.foot{position:absolute;left:.65in;right:.65in;bottom:.4in;display:flex;justify-content:space-between;font-size:8pt;color:#7a6a5e;border-top:1px solid #e5e0da;padding-top:8px}
.cover{padding:0;background:#1c0e05;color:#fbfaf9}
.cover .hero{height:5.6in;background-size:cover;background-position:center}
.cover .in{padding:.5in .65in}
.cover .brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:12pt;margin-bottom:.35in}
.cover .brand img{width:30px}
.cover .kick{font-size:10pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fe7802}
.cover h1{font-family:'Inter Display',Inter;font-size:40pt;line-height:1.02;font-weight:800;letter-spacing:-.02em;margin:.12in 0 .18in}
.cover p{font-size:12pt;max-width:6.2in;color:#e9e3dd}
.cover .bar{position:absolute;left:0;right:0;bottom:0;height:.14in;background:#fe7802}
h2{font-family:'Inter Display',Inter;font-size:20pt;font-weight:800;letter-spacing:-.01em;margin:0 0 .12in}
h3{font-size:11pt;font-weight:800;margin:.22in 0 .06in}
ul{padding-left:1.1em}li{margin:.04in 0}
.note{background:#fff4ea;border-left:4px solid #fe7802;padding:.14in .18in;margin:.2in 0;font-size:9.5pt}
.safety{background:#fbfaf9;border:1px solid #e5e0da;border-top:4px solid #1c0e05;padding:.12in .18in;margin-top:.2in}
.order{display:grid;grid-template-columns:repeat(auto-fill,minmax(2.2in,1fr));gap:.08in .2in;margin-top:.12in;counter-reset:o}
.order div{display:flex;gap:8px;align-items:baseline;font-weight:600}
.order span{flex:0 0 22px;height:22px;border-radius:50%;background:#fe7802;color:#fff;font-size:9pt;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.step{margin-bottom:.26in}
.step .img{position:relative}
.step img.s{width:100%;display:block;border-top:5px solid #fe7802}
.step .two{display:grid;grid-template-columns:1fr 1fr;gap:.1in}
.step .hd{display:flex;align-items:center;gap:12px;margin:.12in 0 .04in}
.step .n{flex:0 0 34px;height:34px;border-radius:50%;background:#fe7802;color:#fff;font-weight:800;font-size:14pt;display:flex;align-items:center;justify-content:center}
.step h4{font-family:'Inter Display',Inter;font-size:15pt;font-weight:800;letter-spacing:-.01em}
.step p{margin-left:46px}.step ul{margin-left:46px}
.legend{display:inline-flex;align-items:center;gap:6px;font-size:8.5pt;color:#7a6a5e;margin-left:46px}
.legend i{width:12px;height:12px;background:#fe7802;border-radius:2px}
.small{font-size:8.5pt;color:#5a4a3e}
`

for (const [style, g] of Object.entries(GUIDES)) {
  const name = NAMES[style]
  const pages = []
  const top = `<div class="top"><img src="logo.png">Next Partitions<span class="r">${esc(name)} partitions: how they go together</span></div>`
  const foot = (n) => `<div class="foot"><span>nextpartitions.com</span><span>An overview, not installation instructions. Follow the manufacturer's instructions supplied with your order.</span><span>${n}</span></div>`
  pages.push(`<section class="pg cover"><div class="hero" style="background-image:url('../../renders/${style}-angle.jpg')"></div><div class="in"><div class="brand"><img src="logo.png">Next Partitions</div><div class="kick">Installation overview</div><h1>${esc(name)} partitions: how they go together</h1><p>${md(g.intro)}</p></div><div class="bar"></div></section>`)
  pages.push(`<section class="pg">${top}<h2>Before installation starts</h2>
<div class="note">${md(COMMON.notice)}</div>
<h3>The order, at a glance</h3><div class="order">${g.steps.map((s, i) => `<div><span>${i + 1}</span>${esc(s.title)}</div>`).join('')}</div>
<h3>Check the site first</h3><ul>${g.before.map((x) => `<li>${md(x)}</li>`).join('')}</ul>
<div class="safety"><h3 style="margin-top:0">Safety</h3><ul>${[...COMMON.safety, ...(g.safety ?? [])].map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>${foot(2)}</section>`)
  // two steps per page (a step with two shots takes a page's top half side by side)
  for (let i = 0; i < g.steps.length; i += 2) {
    const body = g.steps.slice(i, i + 2).map((s, k) => {
      const n = i + k + 1, imgs = s.shots.map((_, j) => `img/${style}-${n}${j ? String.fromCharCode(97 + j) : ''}.jpg`)
      const pics = imgs.length > 1 ? `<div class="two">${imgs.map((p) => `<img class="s" src="../${p}">`).join('')}</div>` : `<img class="s" src="../${imgs[0]}">`
      return `<div class="step">${pics}<div class="hd"><span class="n">${n}</span><h4>${esc(s.title)}</h4></div><p>${md(s.text)}</p>${s.tips?.length ? `<ul>${s.tips.map((t) => `<li>${md(t)}</li>`).join('')}</ul>` : ''}${s.shots.some((x) => x.hi?.length) ? '<div class="legend"><i></i>This step</div>' : ''}</div>`
    }).join('')
    pages.push(`<section class="pg">${top}${body}${foot(pages.length + 1)}</section>`)
  }
  pages.push(`<section class="pg">${top}<h2>After installation</h2><ul>${g.after.map((x) => `<li>${md(x)}</li>`).join('')}</ul>
<div class="note">${md(COMMON.notice)}</div><p class="small" style="margin-top:.2in">${md(COMMON.disclaimer)}</p><p class="small" style="margin-top:.1in">${md(COMMON.images)}</p>${foot(pages.length + 1)}</section>`)
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)} partitions: how they go together</title><style>${CSS}</style></head><body>${pages.join('\n')}</body></html>`
  const file = join(OUT, `${style}.html`)
  await writeFile(file, html)
}
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const style of Object.keys(GUIDES)) {
    await page.goto(pathToFileURL(join(OUT, `${style}.html`)).href, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.pdf({ path: join(OUT, `${style}.pdf`), format: 'Letter', printBackground: true, preferCSSPageSize: true })
    console.log('wrote', `out/${style}.pdf`)
  }
} finally { await browser.close() }
