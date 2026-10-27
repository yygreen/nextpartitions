// Builds design/design-language.html: the visual design language on one page (palette, type, line, callouts,
// every drawing). Run after diagrams.mjs:  node design/specimen.mjs   (from site-content/)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('./diagrams/', import.meta.url)
const svgs = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()
const inline = (f) => readFileSync(new URL(f, dir), 'utf8').replace(/ width="(\d+)" height="\d+" role="img"/, (_, w) => ` style="width:100%;height:auto;max-width:${Math.min(Number(w) * 1.1, 1100)}px" role="img"`)
const sw = (name, hex, use, dark) => `<div class="sw"><div class="chip" style="background:${hex};${dark ? 'color:#fff' : ''}">${hex}</div><b>${name}</b><span>${use}</span></div>`

writeFileSync(new URL('./design-language.html', import.meta.url), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Next Partitions Design Language</title><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<style>
:root{--ink:#1c0e05;--brown:#2d1e14;--orange:#fe7802;--muted:#7a6a5e;--line:#e1ddd7;--paper:#fbfaf9}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Inter,system-ui,sans-serif}
header{background:var(--brown);color:#f8f8f8;padding:56px 16px 48px}header div,main{max-width:1080px;margin:0 auto}
header p{opacity:.85;max-width:680px;font-size:18px}h1{font-size:40px;line-height:1.1;margin:8px 0 12px;letter-spacing:-.02em}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:700;color:var(--orange)}
main{padding:40px 16px 80px}section{margin:0 0 56px}h2{font-size:24px;margin:0 0 6px;letter-spacing:-.01em}.lead{color:var(--muted);margin:0 0 20px;max-width:720px}
.rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.rule{background:#fff;border:1px solid var(--line);border-radius:8px;padding:20px}
.rule b{display:block;font-size:17px;margin-bottom:4px}.rule .n{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--orange);color:#fff;font-weight:700;font-size:13px;margin-bottom:10px}
.sws{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.sw{background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden;font-size:13px}
.sw .chip{height:72px;display:flex;align-items:flex-end;padding:8px;font:600 12px Inter;border-bottom:1px solid var(--line)}.sw b,.sw span{display:block;padding:0 10px}.sw b{padding-top:8px}.sw span{color:var(--muted);padding-bottom:10px}
.type{background:#fff;border:1px solid var(--line);border-radius:8px;padding:24px}.type div{display:flex;gap:16px;align-items:baseline;border-bottom:1px solid var(--line);padding:10px 0}.type div:last-child{border:0}.type small{color:var(--muted);width:150px;flex:none;font-size:12px}
.lines{background:#fff;border:1px solid var(--line);border-radius:8px;padding:8px 24px}.lines div{display:flex;gap:20px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line);font-size:14px}.lines div:last-child{border:0}.lines svg{flex:none}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}figure{margin:0;background:#fff;border:1px solid var(--line);border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:8px}figure.wide{grid-column:1/-1}
figcaption{font-size:13px;color:var(--muted)}figcaption b{color:var(--ink);display:block;font-size:14px}
.dd{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:640px){.dd{grid-template-columns:1fr}h1{font-size:32px}}
.do,.dont{background:#fff;border:1px solid var(--line);border-radius:8px;padding:16px 20px}.do b{color:#1a7f37}.dont b{color:#b42318}.do ul,.dont ul{margin:6px 0 0;padding-left:18px;font-size:14px}
</style></head><body>
<header><div><span class="eyebrow">Next Partitions · Visual design language</span><h1>The spec sheet</h1>
<p>Our buyers trust manufacturer spec sheets and shop drawings, not lifestyle photos. So every visual looks like a good spec sheet: exact, quiet, measured, with one thing called out in orange. Built on the live brand: the orange N, Inter, the warm off-white and brown.</p></div></header>
<main>
<section><h2>Three rules</h2><p class="lead">Everything else follows from these.</p><div class="rules">
<div class="rule"><span class="n">1</span><b>One subject, in orange</b>Orange marks only what the visual is about: the support, the gap, the measurement. Two orange things means two drawings.</div>
<div class="rule"><span class="n">2</span><b>The building is grey, the product is white</b>Floors, walls and ceilings are hatched warm grey; partitions are white with ink outlines. What we sell versus what the building provides, at a glance.</div>
<div class="rule"><span class="n">3</span><b>Measured, and sourced</b>To scale (3.2 px per inch). Every dimension comes from a cited source on the page it sits on. No decorative numbers.</div>
</div></section>
<section><h2>Colour</h2><p class="lead">From the live stylesheet. Orange is for shapes and white-on-orange numbers, never small orange text.</p><div class="sws">
${sw('Ink', '#1c0e05', 'Linework, text', true)}${sw('Brown', '#2d1e14', 'Hero, secondary lines', true)}${sw('Orange', '#fe7802', 'The subject, callouts', true)}${sw('Orange tint', '#fff1e5', 'Zones behind orange')}${sw('Muted', '#7a6a5e', 'Dimensions, notes', true)}${sw('Structure', '#f2f0ec', 'Floors, walls, ceilings')}${sw('Paper', '#fbfaf9', 'Page ground')}
</div></section>
<section><h2>Type</h2><p class="lead">Inter only, as on the site.</p><div class="type">
<div><small>Drawing title · 18/700</small><span style="font-weight:700;font-size:18px">Ceiling hung</span></div>
<div><small>Dimension · 14/600 muted</small><span style="font-weight:600;font-size:14px;color:var(--muted)">83"   58"   12"   8'</span></div>
<div><small>Label · 13/500 muted</small><span style="font-size:13px;color:var(--muted)">seen from above · pilaster · door</span></div>
<div><small>Callout · 14/700 on orange</small><span style="display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--orange);color:#fff;font-weight:700;font-size:14px">1</span></div>
</div></section>
<section><h2>Line</h2><div class="lines">
<div><svg width="120" height="20"><rect x="2" y="3" width="116" height="14" fill="#fff" stroke="#1c0e05" stroke-width="1.5"/></svg>Product: white, ink outline 1.5 px</div>
<div><svg width="120" height="20"><defs><pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#f2f0ec"/><line x1="0" y1="0" x2="0" y2="8" stroke="#cfc7bc" stroke-width="1.5"/></pattern></defs><rect x="0" y="4" width="120" height="16" fill="url(#h)"/><line x1="0" y1="4" x2="120" y2="4" stroke="#1c0e05" stroke-width="1.5"/></svg>Building: hatched Structure, ink edge</div>
<div><svg width="120" height="20"><rect x="2" y="6" width="116" height="8" fill="#fe7802"/></svg>The subject: solid orange, or a 2.5–5 px orange line</div>
<div><svg width="120" height="20"><line x1="4" y1="10" x2="116" y2="10" stroke="#7a6a5e"/><line x1="4" y1="5" x2="4" y2="15" stroke="#7a6a5e"/><line x1="116" y1="5" x2="116" y2="15" stroke="#7a6a5e"/></svg>Dimension: muted 1 px with end ticks; label beside it</div>
<div><svg width="120" height="20"><path d="M4 17 Q60 -4 116 17" fill="none" stroke="#7a6a5e" stroke-dasharray="5 5" stroke-width="1.5"/></svg>Movement or hidden parts: dashed 5 5</div>
<div><svg width="120" height="24"><line x1="20" y1="12" x2="110" y2="12" stroke="#fe7802" stroke-width="1.5"/><circle cx="110" cy="12" r="2.5" fill="#fe7802"/><circle cx="12" cy="12" r="11" fill="#fe7802"/><text x="12" y="16.5" font-size="13" font-weight="700" fill="#fff" text-anchor="middle" font-family="Inter">2</text></svg>Callout: numbered disc, leader ends in a dot; the key is page text</div>
</div></section>
<section><h2>The drawings</h2><p class="lead">Ten so far, generated from shared tokens and parts (design/diagrams.mjs). Each carries a title and description for screen readers; its key sits under it on the page.</p><div class="grid">
${svgs.map((f) => `<figure class="${f.includes('compare') || f.includes('measure') || f.includes('hinge') ? 'wide' : ''}">${inline(f)}<figcaption><b>${f.replace('.svg', '')}</b>${readFileSync(new URL(f, dir), 'utf8').match(/<desc[^>]*>([^<]*)<\/desc>/)[1]}</figcaption></figure>`).join('\n')}
</div></section>
<section><h2>Do and don't</h2><div class="dd">
<div class="do"><b>Do</b><ul><li>Front elevations for how stalls stand; plans (seen from above) for hinges and swing</li><li>Real dimensions from the page's sources</li><li>Keys as page text under the drawing</li><li>Real job photos, straight on</li></ul></div>
<div class="dont"><b>Don't</b><ul><li>Perspective or 3D views: they hide the measurements</li><li>Orange text, or more than one orange subject</li><li>Labels inside the image that the page doesn't repeat</li><li>Stock photos of restrooms</li></ul></div>
</div></section>
</main></body></html>
`)
console.log('design-language.html')
