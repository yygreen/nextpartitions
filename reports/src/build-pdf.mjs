// Builds a weekly update PDF from its HTML source.
// Usage (from this folder): node build-pdf.mjs weekly-update-2026-11-09.html ../Next-Partitions-Weekly-Update-Nov-9.pdf
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node-tools/node_modules/playwright') }
const { chromium } = pw
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [src, out] = process.argv.slice(2)
if (!src || !out) throw new Error('usage: node build-pdf.mjs <source.html> <output.pdf>')
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(pathToFileURL(resolve(src)).href, { waitUntil: 'networkidle' })
const footer = `<div style="width:100%;margin:0 0.55in;border-top:1px solid #c9d3d6;padding-top:5px;text-align:center;font-family:Inter,sans-serif;font-size:7.5pt;color:#5b6268">www.rankfriendly.com &nbsp;|&nbsp; (844) 668-7265 &nbsp;|&nbsp; info@rankfriendly.com</div>`
await page.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer })
await browser.close()
console.log('wrote', out)
