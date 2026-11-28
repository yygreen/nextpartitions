// Renders film.html to video, frame by frame, in headless Chromium (WebGL on SwiftShader).
//   node render.mjs [h|v] [--still t1,t2,...] [--fps 30] [--dpr 2] [--from s] [--to s]
//   h: 16:9, 1920 x 1080 page at device scale 2 -> out/mounting-styles-3d-16x9-4k.mp4 (3840 x 2160)
//   v: 9:16, 1080 x 1920 page at device scale 2 -> out/mounting-styles-3d-9x16.mp4 (2160 x 3840)
//   --still: PNG stills to out/ instead of a video. --dpr 1 for quick drafts.
// Serves site-content/ on localhost so the page can load three.js and the scene from design/render3d.
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { renameSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { specFor, STYLES } from '../../design/render3d/dims.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const LOGO = fileURLToPath(new URL('../../../prototypes/img/logo.png', import.meta.url))
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const mode = process.argv[2] === 'v' ? 'v' : 'h'
const fps = +arg('--fps', 30), dpr = +arg('--dpr', 2)
const W = mode === 'v' ? 1080 : 1920, H = mode === 'v' ? 1920 : 1080

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' }
const server = createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const path = url === '/prototypes-logo.png' ? LOGO : normalize(join(ROOT, url))
  if (path !== LOGO && !path.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try { res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(await readFile(path)) }
  catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
await mkdir(join(HERE, 'out'), { recursive: true })

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: dpr })
page.on('pageerror', (e) => console.log('[page error]', e.message))
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()) })
await page.goto(`http://127.0.0.1:${server.address().port}/video/mounting-styles-3d/film.html${process.env.Q ? '?' + process.env.Q : ''}${mode === 'v' ? '#v' : ''}`)
await page.waitForFunction(() => window.__ready === true)
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))
const specs = Object.fromEntries(STYLES.map((s) => [s, specFor(s)]))
await page.evaluate((p) => window.setupFilm(p), { specs, width: W, height: H, dpr, gl: +arg('--gl', 1) })
const dur = await page.evaluate(() => window.DURATION)
const stage = await page.$('#stage')

try {
  if (arg('--still')) {
    for (const t of arg('--still').split(',').map(Number)) {
      const t0 = Date.now()
      await page.evaluate((t) => window.frameAt(t), t)
      await stage.screenshot({ path: join(HERE, 'out', `still-${mode}-${t}.png`) })
      if (process.env.SHOT2) { const a = Date.now(); await stage.screenshot({ type: 'jpeg', quality: 92 }); console.log('  second screenshot', Date.now() - a, 'ms'); const b = Date.now(); await page.evaluate((t) => window.frameAt(t), t + 0.01); console.log('  frameAt', Date.now() - b, 'ms'); const c = Date.now(); await stage.screenshot({ type: 'jpeg', quality: 92 }); console.log('  shot after frameAt', Date.now() - c, 'ms') }
      console.log(`still ${t}s  ${((Date.now() - t0) / 1000).toFixed(1)}s`, await page.evaluate(() => JSON.stringify(window.__prof)))
    }
  } else {
    const from = +arg('--from', 0), to = +arg('--to', dur)
    const name = arg('--name') ?? `mounting-styles-3d-${mode === 'v' ? '9x16' : '16x9-4k'}${from || to !== dur ? `-${from}-${to}` : ''}.mp4`
    const out = join(HERE, 'out', name)
    // written under a temporary name and renamed when complete, so an interrupted run never leaves a finished-looking file
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps), '-f', 'mp4', out + '.part'], { stdio: ['pipe', 'inherit', 'inherit'] })
    const n0 = Math.round(from * fps), n1 = Math.round(to * fps), t0 = Date.now()
    for (let i = n0; i < n1; i++) {
      await page.evaluate((t) => window.frameAt(t), i / fps)
      const buf = await stage.screenshot({ type: 'jpeg', quality: 92 })
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
      if ((i - n0) % 60 === 0) console.log(`${mode} frame ${i}/${n1}, ${((Date.now() - t0) / 1000).toFixed(0)}s`)
    }
    ff.stdin.end(); const code = await new Promise((r) => ff.on('close', r))
    if (code !== 0) throw new Error('ffmpeg failed: ' + code)
    renameSync(out + '.part', out)
    console.log('wrote', out, `${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
} finally {
  await browser.close(); server.close()
}
