// Renders the partition product images headless (Playwright Chromium, SwiftShader WebGL).
//
//   node render.mjs                        all four styles, front + angle, plus the ceiling-hung finish variants
//   node render.mjs ceiling-hung front     one style and view (view: front | angle | both)
//   node render.mjs ceiling-hung both stainless
//
// Output: design/renders/<style>-<view>[-<finish>].png and .jpg (2400 x 1500, JPEG quality 85).
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { specFor, STYLES } from './dims.mjs'

const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) } catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright')) // global install on the build machines
}

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const OUT = fileURLToPath(new URL('../renders/', import.meta.url))
const W = 2400, H = 1500, SS = +(process.env.SS ?? 2), EXPOSURE = +(process.env.EXPOSURE ?? 0.85)
const FINISH_VARIANTS = { 'ceiling-hung': ['bluegrey', 'stainless'] }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' }
const server = createServer(async (req, res) => {
  const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
  if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try { res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(await readFile(path)) }
  catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const [argStyle, argView = 'both', argFinish] = process.argv.slice(2)
const jobs = []
for (const style of argStyle ? [argStyle] : STYLES) {
  const views = argView === 'both' ? ['front', 'angle'] : [argView]
  const finishes = argFinish ? [argFinish] : ['cream', ...(argStyle ? [] : FINISH_VARIANTS[style] ?? [])]
  for (const finish of finishes) for (const view of views) jobs.push({ style, view, finish })
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  for (const { style, view, finish } of jobs) {
    const t = Date.now()
    const page = await browser.newPage({ viewport: { width: 800, height: 500 } })
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('  [page]', m.text()) })
    page.on('pageerror', (e) => console.log('  [page error]', e.message))
    await page.goto(`http://127.0.0.1:${port}/index.html`)
    await page.waitForFunction(() => window.__ready === true)
    const r = await page.evaluate((p) => window.__run(p), { spec: specFor(style), view, finish, width: W, height: H, ss: SS, exposure: EXPOSURE })
    const name = `${style}-${view}${finish === 'cream' ? '' : `-${finish}`}`
    await writeFile(join(OUT, `${name}.png`), Buffer.from(r.png.split(',')[1], 'base64'))
    await writeFile(join(OUT, `${name}.jpg`), Buffer.from(r.jpg.split(',')[1], 'base64'))
    if (process.env.MARKS) await writeFile(join(OUT, `${name}.marks.json`), JSON.stringify(r.marks))
    console.log(`${name}  ${((Date.now() - t) / 1000).toFixed(1)}s`)
    await page.close()
  }
} finally {
  await browser.close()
  server.close()
}
