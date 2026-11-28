// Renders page.html to video: node render.mjs [h|v] [--still t1,t2,...] [--fps n]
//   h: 16:9, 3840 x 2160 (1920 x 1080 page at device scale 2) -> out/mounting-styles-16x9-4k.mp4
//   v: 9:16, 2160 x 3840 (1080 x 1920 page at device scale 2) -> out/mounting-styles-9x16.mp4
//   --still: write a few PNG stills to out/ instead of a video, to check a layout.
// Frames are piped as JPEG to ffmpeg (libx264, CRF 16). Needs Playwright and ffmpeg.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const mode = process.argv[2] === 'v' ? 'v' : 'h'
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null }
const fps = +(arg('--fps') || 30)
const W = mode === 'v' ? 1080 : 1920, H = mode === 'v' ? 1920 : 1080
mkdirSync(join(HERE, 'out'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
await page.goto('file://' + join(HERE, 'page.html') + (mode === 'v' ? '#v' : ''))
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))
await page.evaluate((v) => { if (v) document.body.className = 'v' }, mode === 'v')
const stage = await page.$('#stage')
const dur = await page.evaluate(() => window.DURATION)

if (arg('--still')) {
  for (const t of arg('--still').split(',').map(Number)) {
    await page.evaluate((t) => window.frameAt(t), t)
    await stage.screenshot({ path: join(HERE, 'out', `still-${mode}-${t}.png`), scale: 'css' })
  }
} else {
  const out = join(HERE, 'out', mode === 'v' ? 'mounting-styles-9x16.mp4' : 'mounting-styles-16x9-4k.mp4')
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] })
  const n = Math.round(dur * fps), t0 = Date.now()
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.frameAt(t), i / fps)
    const buf = await stage.screenshot({ type: 'jpeg', quality: 93 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if (i % 150 === 0) console.log(`${mode} frame ${i}/${n}, ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r))
  console.log('wrote', out)
}
await browser.close()
