// Renders every guide step's image: node render-shots.mjs [style ...] [--only style-n,...]
// Serves site-content/ on localhost, opens shot.html in headless Chromium (WebGL on SwiftShader) and writes
// img/<style>-<n>.jpg (1600 x 1000) for each step in guides.mjs that has a shot.
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { specFor, STYLES } from '../render3d/dims.mjs'
import { GUIDES } from './guides.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const W = 1600, H = 1000
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null }
const only = arg('--only')?.split(',')
const styles = process.argv.slice(2).filter((a) => STYLES.includes(a))

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' }
const server = createServer(async (req, res) => {
  const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
  if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try { res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(await readFile(path)) }
  catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
await mkdir(join(HERE, 'img'), { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  page.on('pageerror', (e) => console.log('[page error]', e.message))
  await page.goto(`http://127.0.0.1:${server.address().port}/design/install-guides/shot.html`)
  await page.waitForFunction(() => window.__ready === true)
  const specs = Object.fromEntries(STYLES.map((s) => [s, specFor(s)]))
  await page.evaluate((p) => window.setupShots(p), { width: W, height: H, specs })
  for (const [style, g] of Object.entries(GUIDES)) {
    if (styles.length && !styles.includes(style)) continue
    for (const [i, step] of g.steps.entries()) {
      for (const [j, shot] of (step.shots ?? []).entries()) {
        const name = `${style}-${i + 1}${j ? String.fromCharCode(97 + j) : ''}`
        if (only && !only.includes(name)) continue
        const t0 = Date.now()
        await page.evaluate((s) => window.shoot(s), { style, ...shot })
        await page.locator('#gl').screenshot({ path: join(HERE, 'img', name + '.jpg'), type: 'jpeg', quality: 90 })
        console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + 's')
      }
    }
  }
} finally { await browser.close(); server.close() }
