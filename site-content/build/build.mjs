// Builds site-content/preview/: every page in site-content/pages/ as a finished HTML page in the live site's own
// layout (its header, footer, hero, content column with side card, and the "Explore More" block), using the live
// stylesheet (preview/styles.css, copied from nextpartitions.com) and only Tailwind classes it already contains.
// Each page carries its title, meta description, canonical and structured data (BreadcrumbList, FAQPage, Article
// for blog posts), so it can be ported into the Lovable project as it is. Links between rebuilt pages stay inside
// the preview; every other link goes to the live site.
//
//   cd site-content/build && npm install && npm run build    → open ../preview/index.html
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { marked } from 'marked'

const SITE = 'https://nextpartitions.com'
const PAGES = '../pages', OUT = '../preview', CURRENT = '../current'
const shell = readFileSync('shell.html', 'utf8') // a live page (/hardware/hinges), saved 2026-10-26
// The live stylesheet goes inside each page, so any single file opens on its own.
const CSS = readFileSync(`${OUT}/styles.css`, 'utf8')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
const fileFor = (url) => url === '/' ? 'home.html' : url.replace(/^\//, '').replace(/\//g, '_') + '.html'
const ICON_ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right h-4 w-4" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>'
const ICON_CHEVRON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right h-3.5 w-3.5 flex-shrink-0" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>'
// The site's button (copied from the live hero and side card).
const button = (label, href, extra = '') => `<a href="${href}"><button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 shadow h-9 px-4 py-2 ${extra} bg-brand-red text-brand-red-foreground hover:bg-brand-red/90 gap-2">${esc(label)} ${ICON_ARROW}</button></a>`

const SECTION = { hardware: ['Hardware & Parts', '/hardware'], 'mounting-styles': ['Mounting Styles', '/mounting-styles'], guides: ['Guides', '/guides'], blog: ['Blog', '/blog'], partitions: ['Partitions', '/partitions'], industries: ['Industries', '/industries'], brands: ['Brands', '/brands'] }
const QUOTE_PROMISE = 'Standard configurations are quoted within 2 business hours; custom projects within 24–48 hours.'

function parse(file) {
  const raw = readFileSync(`${PAGES}/${file}`, 'utf8')
  const fm = {}
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim() }
  let body = raw.slice(m[0].length).split('<!-- For Marc -->')[0].trim()
  body = body.replace(/^# .*\n+/, '') // the H1 goes in the hero
  const parts = body.split(/^## /m)
  const intro = parts.shift().trim()
  const sections = parts.map((p) => { const nl = p.indexOf('\n'); return { title: p.slice(0, nl).trim(), md: p.slice(nl + 1).trim() } })
  return { fm, intro, sections }
}

// Site classes on plain Markdown output.
// Drawings from design/diagrams/ go inline (so a preview file stands alone), full width, in a bordered card.
// On the live site they're served as /images/diagrams/<name>.svg.
const DIAGRAMS = '../design/diagrams/'
const SHEETS = JSON.parse(readFileSync(`${DIAGRAMS}sheets.json`, 'utf8'))
const inlineSvg = (file) => readFileSync(`${DIAGRAMS}${file}`, 'utf8')
  .replace(/ width="(\d+)" height="\d+" role="img"/, ' style="width:100%;height:auto;display:block" role="img"')
// Phone variants of a drawing (design/diagrams.mjs): <name>-m.svg, or <name>-m1.svg, -m2.svg … when it takes
// several frames. Each is 360 wide, so its text stays 12–13 px in a phone's content column.
const phoneFiles = (name) => existsSync(`${DIAGRAMS}${name}-m.svg`) ? [`${name}-m.svg`]
  : Array.from({ length: 9 }, (_, i) => `${name}-m${i + 1}.svg`).filter((f) => existsSync(`${DIAGRAMS}${f}`))
// A drawing with phone variants: the desktop drawing in .np-d, the phone frames stacked in .np-m; CSS shows one
// (below 640 px, the phone frames). Nothing scrolls sideways.
const responsive = (file) => {
  const m = phoneFiles(file.replace(/\.svg$/, ''))
  return m.length ? `<div class="np-d">${inlineSvg(file)}</div><div class="np-m">${m.map(inlineSvg).join('')}</div>` : inlineSvg(file)
}
// Standalone drawings are landscape and 780 wide, shown at their real size on desktop and as their phone variant
// on a phone. A drawing with a sheet (plan, front elevation, side view, details) renders as one figure: wide views
// across the full width, the side view and details side by side on desktop and stacked on a phone (they are 400
// wide and scale to the column), each with a view label.
const diagram = (src, alt) => {
  const name = src.split('/').pop().replace(/\.svg$/, '')
  const sheet = SHEETS[name]
  if (!sheet) return `<figure class="np-fig border border-border rounded-lg p-3 mb-4 bg-card">${responsive(`${name}.svg`)}</figure>`
  const view = (v) => `<div class="${v.wide ? 'col-span-full' : ''} min-w-0"><p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">${esc(v.label)}</p>${responsive(v.file)}</div>`
  const wide = sheet.filter((v) => v.wide), rest = sheet.filter((v) => !v.wide)
  return `<figure class="np-fig border border-border rounded-lg p-4 mb-4 bg-card"><div class="grid grid-cols-1 gap-6">${wide.map(view).join('')}</div><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">${rest.map(view).join('')}</div></figure>`
}
function styled(html) {
  return html
    // A photo already on the live site (Markdown title "photo"): a card at the photo's own size, caption under it.
    .replace(/<p><img src="(https:\/\/nextpartitions\.com\/[^"]+)" alt="([^"]*)" title="photo"\s*\/?><\/p>/g, (_, src, alt) => `<figure class="np-side np-photo"><img src="${src}" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`)
    // A small detail after its paragraph (Markdown title "side"): a full-width card with the drawing centered at
    // up to 440 px and its caption under it, so the article stays one column.
    .replace(/<p><img src="\/images\/diagrams\/([^"]+)\.svg" alt="([^"]*)" title="side"\s*\/?><\/p>/g, (_, name, alt) => `<figure class="np-side${phoneFiles(name).length ? ' np-wide' : ''}">${responsive(`${name}.svg`)}<figcaption>${alt}</figcaption></figure>`)
    .replace(/<p><img src="(\/images\/diagrams\/[^"]+)" alt="([^"]*)"\s*\/?><\/p>/g, (_, src, alt) => diagram(src, alt))
    .replace(/<h3>/g, '<h3 class="text-lg font-semibold text-foreground mt-6 mb-2">')
    .replace(/<h4>/g, '<h4 class="font-semibold text-foreground mt-4 mb-2">')
    .replace(/<p>/g, '<p class="text-muted-foreground leading-relaxed mb-4">')
    .replace(/<ul>/g, '<ul class="list-disc pl-4 space-y-2 text-muted-foreground leading-relaxed mb-4">')
    .replace(/<ol>/g, '<ol class="list-decimal pl-4 space-y-2 text-muted-foreground leading-relaxed mb-4">')
    .replace(/<table>/g, '<div class="overflow-x-auto mb-6"><table class="w-full text-sm border-collapse border border-border">').replace(/<\/table>/g, '</table></div>')
    .replace(/<thead>\n?<tr>/g, '<thead><tr class="bg-accent">').replace(/<th>/g, '<th class="p-3 text-left align-top">').replace(/<th align="[a-z]+">/g, '<th class="p-3 text-left align-top">')
    .replace(/<tbody>/g, '<tbody class="divide-y divide-border">').replace(/<td>/g, '<td class="p-3 align-top">').replace(/<td align="[a-z]+">/g, '<td class="p-3 align-top">')
    .replace(/<strong>/g, '<strong class="font-semibold text-foreground">')
    .replace(/<em>/g, '<em class="italic">')
    .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-brand-red pl-4 italic mb-4">')
    .replace(/<a href=/g, '<a class="text-brand-red hover:underline font-medium" href=')
}
// Expert advice box (":::expert" … ":::" in a page): a quote card in the brand colors. Until Abe's answer is in,
// the block holds only the question, and the card shows a placeholder quote and attribution.
// With an answer, write it as: question line, then "> quote", then "— Name, role".
// The site logo (the orange N), inline so a preview file stands alone. On the live site use the logo asset.
const LOGO = `data:image/png;base64,${readFileSync('../../prototypes/img/logo.png').toString('base64')}`
const expert = (block) => {
  const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  const q = lines.find((l) => !l.startsWith('>') && !l.startsWith('—')) || ''
  const quote = lines.filter((l) => l.startsWith('>')).map((l) => l.slice(1).trim()).join(' ')
  const by = (lines.find((l) => l.startsWith('—')) || '').slice(1).trim()
  // The question stays in the page file for reference; the card shows only the quote, who said it and the logo.
  const [name, ...rest] = by.split(','), role = rest.join(',').trim()
  // Laid out like the title block of a technical drawing: the quote across the top, a ruled strip below with
  // the name and role, and the logo cell.
  return `<figure class="np-tb"><blockquote class="np-tb-quote${quote ? '' : ' np-tb-ph'}">${esc(quote ? `“${quote}”` : `Placeholder for the answer, in the expert's own words, to: ${q}`)}</blockquote>`
    + `<figcaption class="np-tb-strip"><div class="np-tb-cell"><span class="np-tb-val">${esc(name || '[Name]')}</span><span class="np-tb-role">${esc(role || '[Role], Next Partitions')}</span></div>`
    + `<div class="np-tb-cell np-tb-brand"><img src="${LOGO}" alt="" width="26" height="27"><span><b>Next Partitions</b><br>Expert advice</span></div></figcaption></figure>`
}
// General advice box (":::advice" … ":::"): a tip in Next Partitions' own voice, no person attached. The same
// title-block family as the quote card, inverted: paper ground, ink frame, a brown band on top with the logo.
const advice = (block) => `<aside class="np-adv"><div class="np-adv-band"><img src="${LOGO}" alt="" width="22" height="23"><span>Next Partitions advice</span></div>`
  + `<div class="np-adv-body">${marked.parse(block.trim())}</div></aside>`
// Tables with four or more columns turn into stacked cards on a phone: each row a card, each value under its
// column name (data-label), so nothing scrolls sideways or breaks mid-word.
// A key list right after a drawing moves inside the drawing's card as a compact legend, so the drawing and its key
// read as one unit and the text flows on below it.
// Numbered keys get orange discs like the drawing's callouts. Short keys fill two columns top to bottom
// (1-3 left, 4-6 right); keys with any long item stay in one column.
const legends = (html) => html.replace(/<\/figure>\s*<(ol|ul) class="[^"]*">([\s\S]*?)<\/\1>/g, (_, tag, items) => {
  const lis = [...items.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1]))
  const two = lis.length >= 4 && lis.every((t) => t.length <= 48)
  const style = '' // two columns read across: 1 2 / 3 4 / 5 6
  // each item's text in one span, so a bold lead and the text after it flow as one paragraph beside the number
  const wrapped = items.replace(/<li([^>]*)>([\s\S]*?)<\/li>/g, (_, at, inner) => `<li${at}><span>${inner.trim()}</span></li>`)
  return `<${tag} class="np-legend${two ? ' np-legend-2' : ''}"${style}>${wrapped}</${tag}></figure>`
})
const cards = (html) => html.replace(/<table class="([^"]*)">([\s\S]*?)<\/table>/g, (t, cls, inner) => {
  const heads = [...inner.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => strip(m[1]))
  if (heads.length < 4) return t
  const body = inner.replace(/<tr>([\s\S]*?)<\/tr>/g, (r, cells) => { let k = 0; return `<tr>${cells.replace(/<td([^>]*)>/g, (_, a) => `<td${a} data-label="${esc(heads[k++] || '')}">`)}</tr>` })
  return `<table class="${cls} np-cards">${body}</table>`
})
// Several live-site photos side by side (":::gallery" ... ":::"), each with its caption: two across on a phone,
// four across on desktop.
const gallery = (block) => `<div class="np-gallery">${[...block.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map(([, alt, src]) => `<figure><img src="${src}" alt="${esc(alt)}" loading="lazy"><figcaption>${esc(alt)}</figcaption></figure>`).join('')}</div>`
const md = (s) => inlineRenders(legends(cards(styled(marked.parse(s.replace(/^:::expert\n([\s\S]*?)\n:::$/gm, (_, b) => expert(b)).replace(/^:::advice\n([\s\S]*?)\n:::$/gm, (_, b) => advice(b)).replace(/^:::gallery\n([\s\S]*?)\n:::$/gm, (_, b) => gallery(b)), { gfm: true })))))

function faqItems(section) {
  return section.md.split(/^### /m).filter((x) => x.trim()).map((q) => { const nl = q.indexOf('\n'); return { q: q.slice(0, nl).trim(), a: q.slice(nl + 1).trim() } })
}

// Hero drawing: the page's own first drawing (a mounting sheet shows its single front view), or a fitting one for
// pages that have none. Drawn straight on the dark hero (recolored by CSS: light lines, orange kept) beside the title; it stacks under the button on a phone,
// where it shows the drawing's first phone frame. Its ids get an "h-" prefix: the same drawing is often inlined again in the page.
const HERO_FALLBACK = { '/': 'mounting-styles-compare', '/about': 'mounting-styles-compare', '/faq': 'partition-anatomy', '/brands': 'partition-anatomy', '/brands/hadrian': 'partition-anatomy', '/blog': 'stall-gaps', '/guides': 'sheet-plan', '/guides/installation-instructions': 'mounting-styles-compare', '/industries': 'sheet-plan' }
// 3D renders (design/renders/, made by design/render3d from the drawings' numbers). In the previews they are
// inlined as data URIs so a file opens on its own; on the live site they're served as /images/renders/<name>.jpg.
const RENDERS = '../design/renders/'
const renderSrc = (name) => `data:image/jpeg;base64,${readFileSync(`${RENDERS}${name}.jpg`).toString('base64')}`
const inlineRenders = (html) => html.replace(/src="\/images\/renders\/([a-z0-9-]+)\.jpg"/g, (_, n) => `src="${renderSrc(n)}"`)
const HERO_RENDER = { '/mounting-styles/overhead-braced': 'overhead-braced-front-hero', '/mounting-styles/floor-mounted': 'floor-mounted-front-hero', '/mounting-styles/ceiling-hung': 'ceiling-hung-front-hero', '/mounting-styles/floor-to-ceiling': 'floor-to-ceiling-front-hero' }
function heroArt(raw, url) {
  if (HERO_RENDER[url]) return `<figure class="np-hero-photo"><img src="${renderSrc(HERO_RENDER[url])}" alt="" width="2400" height="1500"></figure>`
  const m = raw.match(/\(\/images\/diagrams\/([a-z0-9-]+)\.svg\)/)
  const name = m ? m[1] : HERO_FALLBACK[url]
  if (!name) return ''
  const art = (file) => inlineSvg(file).replace(/<title[\s\S]*?<\/title>|<desc[\s\S]*?<\/desc>/g, '').replace(/ aria-labelledby="[^"]*"/, '')
    .replace(/ id="([^"]+)"/g, ' id="h-$1"').replace(/url\(#/g, 'url(#h-')
  const pm = phoneFiles(name)
  return `<figure class="np-hero-art" aria-hidden="true">${pm.length ? `<div class="np-d">${art(`${name}.svg`)}</div><div class="np-m">${art(pm[0])}</div>` : art(`${name}.svg`)}</figure>`
}

// Reasons-to-choose and limits lists get icons in the brand colors: an orange check for the reasons, a muted
// warning mark for the limits, so the two read as a quick verdict side by side in the text.
const PROS = /^(Why specifiers choose|Where it works well)/i, CONS = /^(Limits to plan for|When to choose something else)/i
const iconLists = (title, html) => PROS.test(title) ? html.replace(/<ul class="[^"]*">/g, '<ul class="np-icons np-pros">')
  : CONS.test(title) ? html.replace(/<ul class="[^"]*">/g, '<ul class="np-icons np-cons">') : html

// The side card opens with a small 3/4 render: the page's own mounting style, otherwise overhead braced (the most
// common style). Decorative, so empty alt.
const cardImg = (url) => {
  const m = url.match(/^\/mounting-styles\/(overhead-braced|floor-mounted|ceiling-hung|floor-to-ceiling)$/)
  return `<img class="np-card-img" src="${renderSrc(`${m ? m[1] : 'overhead-braced'}-angle`)}" alt="" width="2400" height="1500">`
}

// The homepage preview is the homepage proposal sent to Marc (prototypes/homepage-grid.html: three ways into a quote),
// not the article layout. Its images are inlined so the file opens on its own.
function homepage(url) {
  const PROTO = '../../prototypes/'
  const proto = readFileSync(`${PROTO}homepage-grid.html`, 'utf8')
    .replace(/src="img\/([^"]+)"/g, (_, f) => `src="data:image/${f.endsWith('.svg') ? 'svg+xml' : f.endsWith('.png') ? 'png' : 'jpeg'};base64,${readFileSync(`${PROTO}img/${f}`).toString('base64')}"`)
  // the prototype is a page fragment (no doctype or body): wrap it, with the preview bar on top
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"></head><body style="margin:0">`
    + `<div style="background:#111;color:#fff;font:12px/1.4 Inter,system-ui,sans-serif;padding:6px 16px;text-align:center">Homepage proposal for nextpartitions.com${url} (ideas for Marc) · not the live site · <a href="index.html" style="color:#fff;text-decoration:underline">all preview pages</a></div>`
    + `${proto}</body></html>`
}


// The blog index is an overview, not an article: topic chips, the latest posts as large cards, then one row of cards
// per topic. pages/blog.md lists the links per topic; each card takes its title, summary (meta description) and
// thumbnail (the page's first drawing, or the front render on mounting style pages) from the linked page's own file.
// A link to a page we haven't rebuilt carries its summary after a colon, and its drawing comes from HUB_THUMB.
const HUB_THUMB = { '/guides/ada-compliance': 'accessible-stall-plan' }
const HUB_TYPE = { blog: 'Blog', guides: 'Guide', partitions: 'Material', 'mounting-styles': 'Mounting style' }
let hubN = 0
const HUBS = new Set(['/blog', '/guides'])
function hubCard(item, big) {
  const page = existsSync(`${PAGES}/${item.href.replace(/^\//, '').replace(/\//g, '_')}.md`) ? parse(`${item.href.replace(/^\//, '').replace(/\//g, '_')}.md`) : null
  const raw = page ? readFileSync(`${PAGES}/${item.href.replace(/^\//, '').replace(/\//g, '_')}.md`, 'utf8').split('<!-- For Marc -->')[0] : ''
  const summary = item.summary || page?.fm.meta || ''
  const type = HUB_TYPE[item.href.split('/')[1]] || 'Guide'
  const mount = item.href.match(/^\/mounting-styles\/(.+)$/)
  let thumb
  if (mount) thumb = `<img src="${renderSrc(`${mount[1]}-front-hero`)}" alt="" loading="lazy">`
  else {
    const m = raw.match(/\(\/images\/diagrams\/([a-z0-9-]+)\.svg\)/)
    const name = (m ? m[1] : HUB_THUMB[item.href] || 'partition-anatomy').replace(/-m\d?$/, '')
    const file = existsSync(`${DIAGRAMS}${name}.svg`) ? `${name}.svg` : `${m[1]}.svg`
    const pre = `c${hubN++}-`
    thumb = inlineSvg(file).replace(/<title[\s\S]*?<\/title>|<desc[\s\S]*?<\/desc>/g, '').replace(/ aria-labelledby="[^"]*"/, ' aria-hidden="true"')
      .replace(/ id="([^"]+)"/g, ` id="${pre}$1"`).replace(/url\(#/g, `url(#${pre}`)
  }
  const date = page?.fm.date && type === 'Blog' ? `<span class="np-hc-date">${esc(page.fm.date)}</span>` : ''
  return `<a class="np-hc${big ? ' np-hc-big' : ''}" href="${item.href}"><div class="np-hc-media">${thumb}</div><div class="np-hc-body"><div class="np-hc-meta"><span class="np-hc-type">${type}</span>${date}</div><h3>${esc(item.label)}</h3><p>${esc(summary)}</p><span class="np-hc-go">${type === 'Blog' ? 'Read the post' : 'Read more'} ${ICON_ARROW}</span></div></a>`
}
const HUB_CSS = `.np-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.np-chips a{padding:6px 14px;border-radius:999px;border:1px solid rgba(251,250,249,.3);font-size:14px;font-weight:500;color:#fbfaf9}.np-chips a:hover{border-color:#fe7802;color:#fe7802}
.np-hs{padding:48px 0;border-bottom:1px solid var(--border,#e5e0da);scroll-margin-top:120px}.np-hs:last-of-type{border-bottom:0}.np-hs h2{font-size:26px;font-weight:700;margin:0 0 6px}.np-hs>div>p{color:var(--muted-foreground,#7a6a5e);margin:0 0 24px;max-width:46rem}
.np-hg{display:grid;gap:20px}@media(min-width:640px){.np-hg{grid-template-columns:repeat(2,1fr)}}@media(min-width:1024px){.np-hg{grid-template-columns:repeat(3,1fr)}.np-hg-2{grid-template-columns:repeat(2,1fr)}.np-hg-4{grid-template-columns:repeat(4,1fr)}.np-hg-5{grid-template-columns:repeat(5,1fr)}}.np-hs-note{margin:16px 0 0;font-size:13px;line-height:1.55;color:var(--muted-foreground,#7a6a5e);max-width:52rem}.np-hs-note a,.np-hs>div>p a{color:#fe7802;font-weight:500}
.np-hc{display:flex;flex-direction:column;background:#fff;border:1px solid var(--border,#e5e0da);border-radius:10px;overflow:hidden;transition:border-color .15s,box-shadow .15s;min-width:0}.np-hc:hover{border-color:#fe7802;box-shadow:0 8px 24px rgba(28,14,5,.08)}
.np-hc-media{aspect-ratio:16/9;max-width:100%;display:flex;align-items:center;justify-content:center;background:#fff;border-bottom:1px solid var(--border,#e5e0da);padding:12px;overflow:hidden}.np-hc-media svg{width:100%;height:100%}.np-hc-media img{width:100%;height:100%;object-fit:contain}
.np-hc-body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:8px;flex:1}.np-hc-meta{display:flex;gap:10px;align-items:center;font-size:12px}.np-hc-type{font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#fe7802}.np-hc-date{color:var(--muted-foreground,#7a6a5e)}
.np-hc h3{font-size:18px;line-height:1.3;font-weight:700;margin:0;color:var(--foreground,#1c0e05)}.np-hc p{margin:0;font-size:15px;line-height:1.55;color:var(--muted-foreground,#7a6a5e)}.np-hc-go{margin-top:auto;padding-top:6px;display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;color:#fe7802}.np-hc-go svg{width:15px;height:15px}
@media(min-width:900px){.np-hg-big{grid-template-columns:1fr 1fr}.np-hc-big{flex-direction:row}.np-hc-big .np-hc-media{flex:0 0 48%;padding:8px;aspect-ratio:auto;border-bottom:0;border-right:1px solid var(--border,#e5e0da)}.np-hc-big h3{font-size:21px}}`
function hub(fm, intro, sections, url, faq, sources) {
  const items = (s) => [...s.md.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)(?::\s*(.+))?$/gm)].map((m) => ({ label: m[1], href: m[2], summary: m[3] }))
  const lists = sections.filter((s) => items(s).length)
  const latest = lists.find((s) => /^Latest/i.test(s.title)), topics = lists.filter((s) => s !== latest)
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const lead = intro.split(/\n\s*\n/)[0]
  const end = sections.find((s) => !items(s).length)
  return `<main class="flex-1">
<div class="relative bg-primary text-primary-foreground overflow-hidden"><div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
<nav aria-label="Breadcrumb" class="py-3"><ol class="flex items-center gap-1.5 text-sm text-primary-foreground/60 flex-wrap"><li class="flex items-center gap-1.5"><a class="hover:text-primary-foreground/90 transition-colors" href="/">Home</a></li><li class="flex items-center gap-1.5">${ICON_CHEVRON}<span class="text-primary-foreground font-medium" aria-current="page">${esc(SECTION[url.slice(1)][0])}</span></li></ol></nav>
<h1 class="text-3xl md:text-4xl font-bold mt-2 mb-3">${esc(fm.h1)}</h1>
<p class="text-lg opacity-90 max-w-3xl">${strip(md(lead))}</p>
<nav class="np-chips" aria-label="Topics">${topics.map((s) => `<a href="#${slug(s.title)}">${esc(s.title)}</a>`).join('')}</nav>
</div></div>
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
${latest ? `<section class="np-hs"><div><h2>${esc(latest.title)}</h2><p>New articles, newest first.</p></div><div class="np-hg np-hg-big">${items(latest).map((i) => hubCard(i, true)).join('')}</div></section>` : ''}
${topics.map((s) => {
    const ps = s.md.split(/\n\s*\n/).map((x) => x.trim()).filter((x) => !x.startsWith('- '))
    const lede = s.md.trim().startsWith('- ') ? '' : ps.shift(), n = items(s).length
    return `<section class="np-hs" id="${slug(s.title)}"><div><h2>${esc(s.title)}</h2>${lede ? `<p>${md(lede).replace(/^<p[^>]*>|<\/p>\s*$/g, '')}</p>` : ''}</div><div class="np-hg${n === 2 ? ' np-hg-2' : n === 4 ? ' np-hg-4' : n === 5 ? ' np-hg-5' : ''}">${items(s).map((i) => hubCard(i)).join('')}</div>${ps.map((x) => `<p class="np-hs-note">${md(x).replace(/^<p[^>]*>|<\/p>\s*$/g, '')}</p>`).join('')}</section>`
  }).join('\n')}
${faq.length ? `<section class="np-hs"><div><h2>Frequently Asked Questions</h2></div><div class="space-y-3" style="max-width:48rem">${faq.map((x) => `<details class="border border-border rounded-lg p-4 bg-card"><summary class="font-semibold text-foreground cursor-pointer">${esc(x.q)}</summary><div class="mt-3">${md(x.a)}</div></details>`).join('')}</div></section>` : ''}
${sources ? `<section class="np-sources np-hs text-xs text-muted-foreground"><h2 class="text-sm font-semibold text-foreground mb-2" style="font-size:14px">Sources</h2>${md(sources.md).replace(/text-muted-foreground leading-relaxed mb-4/g, 'mb-2').replace(/space-y-2 text-muted-foreground leading-relaxed mb-4/g, 'space-y-1')}</section>` : ''}
</div>
${end ? `<section class="bg-accent/50"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-wrap items-center justify-between gap-6"><div><h2 class="text-2xl font-bold mb-2">${esc(end.title)}</h2><p class="text-muted-foreground">${QUOTE_PROMISE}</p></div>${button('Get a Quote', '/get-a-quote')}</div></section>` : ''}
</main>`
}

function build(file, built) {
  const { fm, intro, sections } = parse(file)
  const art = heroArt(readFileSync(`${PAGES}/${file}`, 'utf8').split('<!-- For Marc -->')[0], fm.url)
  const url = fm.url
  const seg = url.split('/').filter(Boolean)
  const crumbs = [['Home', '/']]
  if (seg.length > 1 && SECTION[seg[0]]) crumbs.push(SECTION[seg[0]])
  if (url !== '/') crumbs.push([fm.h1, url])

  // Hero: the first paragraph, and the first CTA line as the button.
  const introParas = intro.split(/\n\s*\n/)
  // The hero takes the first sentence; the rest of the opening paragraph starts the page.
  const first = introParas.shift() ?? ''
  const cut = first.length > 200 ? first.search(/[.?!]["”]?\s/) : -1
  let lead = cut > 0 ? first.slice(0, cut + 1) : first
  if (cut > 0) introParas.unshift(first.slice(cut + 1).trim())
  // A post that opens by restating its title as a question: the hero shows the page description instead.
  if (lead.trim().endsWith('?')) { introParas.unshift(first); lead = fm.meta }
  const ctaIdx = introParas.findIndex((p) => /^\[[^\]]+\]\((\/contact|\/get-a-quote)\)/.test(p.trim()))
  const ctaPara = ctaIdx >= 0 ? introParas.splice(ctaIdx, 1)[0] : null
  const cta = ctaPara ? ctaPara.match(/^\[([^\]]+)\]\(([^)]+)\)/) : null
  const ctaLabel = cta ? cta[1] : 'Get a Quote', ctaHref = cta ? cta[2] : '/get-a-quote'

  const faq = sections.find((s) => /^FAQ$/i.test(s.title))
  const sources = sections.find((s) => /^Sources$/i.test(s.title))
  const content = sections.filter((s) => s !== faq && s !== sources)
  const items = faq ? faqItems(faq) : []
  const isPost = seg[0] === 'blog' && seg.length > 1

  const main = HUBS.has(url) ? hub(fm, intro, content, url, items, sources) : `<main class="flex-1">
<div class="relative bg-primary text-primary-foreground overflow-hidden"><div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">${art ? '<div class="np-hero"><div>' : ''}
<nav aria-label="Breadcrumb" class="py-3"><ol class="flex items-center gap-1.5 text-sm text-primary-foreground/60" style="flex-wrap:nowrap;white-space:nowrap;min-width:0;overflow:hidden">${crumbs.map(([n, h], i) => i === crumbs.length - 1
    // one row: the current page's name is cut off with an ellipsis when it doesn't fit
    ? `<li class="flex items-center gap-1.5" style="min-width:0">${i ? ICON_CHEVRON : ''}<span class="text-primary-foreground font-medium" aria-current="page" style="overflow:hidden;text-overflow:ellipsis" title="${esc(n)}">${esc(n)}</span></li>`
    : `<li class="flex items-center gap-1.5">${i ? ICON_CHEVRON : ''}<a class="hover:text-primary-foreground/90 transition-colors" href="${h}">${esc(n)}</a></li>`).join('')}</ol></nav>
<h1 class="text-3xl md:text-4xl font-bold mt-2 mb-3">${esc(fm.h1)}</h1>
<p class="text-lg opacity-90 max-w-3xl mb-6">${strip(md(lead))}</p>
${button(ctaLabel, ctaHref)}
${art ? `</div>${art}</div>` : ''}</div></div>
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8"><div class="md:col-span-2 min-w-0">
${introParas.length ? `<section class="mb-8">${md(introParas.join('\n\n'))}</section>` : ''}
${content.map((s) => `<section class="mb-8"><h2 class="text-2xl font-bold mb-4">${esc(s.title)}</h2>${iconLists(s.title, md(s.md))}</section>`).join('\n')}
${items.length ? `<section class="mb-8"><h2 class="text-2xl font-bold mb-4">Frequently Asked Questions</h2><div class="space-y-3">${items.map((x) => `<details class="border border-border rounded-lg p-4"><summary class="font-semibold text-foreground cursor-pointer">${esc(x.q)}</summary><div class="mt-3">${md(x.a)}</div></details>`).join('')}</div></section>` : ''}
${sources ? `<section class="np-sources mt-10 border-t border-border pt-6 text-xs text-muted-foreground"><h2 class="text-sm font-semibold text-foreground mb-2">Sources</h2>${md(sources.md).replace(/text-muted-foreground leading-relaxed mb-4/g, 'mb-2').replace(/space-y-2 text-muted-foreground leading-relaxed mb-4/g, 'space-y-1')}</section>` : ''}
</div>
<aside class="space-y-4 min-w-0"><div class="bg-accent/50 rounded-lg p-6 sticky top-4" style="top:132px">${cardImg(url)}
<h3 class="font-bold mb-2">${ctaHref === '/contact' ? 'Need replacement parts?' : 'Planning a restroom?'}</h3>
<p class="text-sm text-muted-foreground mb-4">${ctaHref === '/contact' ? 'Send us a photo, your brand and a few measurements, and we will find the match.' : 'Send your layout or drawings, or price it in the configurator.'}</p>
${button(ctaLabel, ctaHref, 'w-full')}
<p class="text-xs text-muted-foreground mt-4">${QUOTE_PROMISE}</p>
</div></aside>
</div>
${shell.match(/<section class="border-t border-border bg-accent\/30">[\s\S]*?<\/section>/)[0]}
</main>`

  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: n, ...(i < crumbs.length - 1 || true ? { item: SITE + (h === '/' ? '/' : h) } : {}) })) },
    items.length && { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: strip(md(x.a)) } })) },
    isPost && { '@context': 'https://schema.org', '@type': 'Article', headline: fm.h1, description: fm.meta, mainEntityOfPage: SITE + url, author: { '@type': 'Organization', name: 'Next Partitions' }, publisher: { '@type': 'Organization', name: 'Next Partitions', logo: { '@type': 'ImageObject', url: SITE + '/apple-touch-icon.png' } } },
  ].filter(Boolean)

  let html = shell.replace(/<main[\s\S]*<\/main>/, () => main)
  html = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<link rel="modulepreload"[^>]*>/g, '')
    .replace(/<link rel="stylesheet" href="\/assets\/[^"]+"[^>]*>/, () => `<style>${CSS}</style>`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fm.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<link rel="canonical"[^>]*>/, '')
    .replace('</head>', `<meta name="description" content="${esc(fm.meta)}"/>\n<link rel="canonical" href="${SITE}${url}"/>\n<meta name="robots" content="noindex"/>\n${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}\n<style>.np-m{display:none}.np-m>svg+svg{margin-top:12px}@media(max-width:640px){.np-d{display:none}.np-m{display:block}.np-fig{padding:6px!important}main table{font-size:12px;line-height:1.4;table-layout:fixed}main table.np-cards,main .np-cards tbody,main .np-cards tr,main .np-cards td{display:block;width:100%}main .np-cards thead{display:none}main .np-cards tr{border:1px solid var(--border,#e5e0da);border-radius:8px;margin-bottom:10px;padding:6px 10px}main .np-cards td{padding:4px 0!important;border:0!important}main .np-cards td::before{content:attr(data-label);display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#7a6a5e}main .np-cards td:first-child{font-weight:600;color:#1c0e05}main .np-cards td:first-child::before{display:none}main th,main td{padding:5px 4px!important;overflow-wrap:break-word;hyphens:auto}}.np-hero{display:grid;gap:32px;align-items:center}.np-hero>*{min-width:0}@media(min-width:900px){.np-hero{grid-template-columns:1.1fr 1fr}}.np-hero-art{margin:0}.np-hero-art .dn{display:none}.np-hero-art svg{width:100%;height:auto;display:block}.np-hero-art [fill="#ffffff"]{fill:transparent}.np-hero-art :not(text)[fill="#fff"]{fill:rgba(255,255,255,.06)}.np-hero-art text[stroke="#fff"]{stroke:none}.np-hero-art [stroke="#1c0e05"]{stroke:#f3ece6}.np-hero-art [fill="#1c0e05"]{fill:#f3ece6}.np-hero-art [stroke="#7a6a5e"]{stroke:#c4b8ae}.np-hero-art [fill="#7a6a5e"]{fill:#c4b8ae}.np-hero-art [fill="#f2f0ec"]{fill:rgba(255,255,255,.07)}.np-hero-art [stroke="#cfc7bc"]{stroke:rgba(255,255,255,.22)}.np-hero-art [fill="#fff1e5"]{fill:rgba(254,120,2,.2)}.np-tb{margin:8px 0 36px;background:#2d1e14;color:#fbfaf9;border:1px solid #2d1e14}.np-tb-quote{margin:0;padding:32px 32px 28px;font-size:22px;line-height:1.45;font-weight:600;letter-spacing:-.01em;color:#fbfaf9;border:0;font-style:normal}.np-tb-ph{font-weight:500;font-style:italic;color:rgba(251,250,249,.55)}.np-tb-strip{display:grid;grid-template-columns:1fr auto;border-top:1px solid rgba(251,250,249,.18)}.np-tb-cell{padding:12px 16px;border-left:1px solid rgba(251,250,249,.18);display:flex;flex-direction:column;gap:3px;min-width:0}.np-tb-cell:first-child{border-left:0;padding-left:32px}.np-tb-label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#fe7802}.np-tb-val{font-size:14px;font-weight:600;color:#fbfaf9}.np-tb-role{font-size:13px;color:rgba(251,250,249,.7)}.np-tb-brand{flex-direction:row;align-items:center;gap:10px;padding-right:20px;font-size:12px;line-height:1.3;color:rgba(251,250,249,.75)}.np-tb-brand b{color:#fbfaf9;font-size:13px}@media(max-width:640px){.np-tb-quote{padding:24px 20px 20px;font-size:19px}.np-tb-cell{padding:12px 14px}.np-tb-cell:first-child{padding-left:20px}.np-tb-brand span{display:none}}.np-adv{margin:8px 0 36px;background:#fff;border:1.5px solid #2d1e14}.np-adv-band{display:flex;align-items:center;gap:10px;background:#2d1e14;color:#fbfaf9;padding:10px 20px;font-size:13px;font-weight:700;letter-spacing:.01em}.np-adv-body{padding:20px 24px 4px;border-top:4px solid #fe7802}.np-adv-body p{font-size:17px;line-height:1.6;color:#1c0e05!important;font-weight:500}.np-legend{margin:14px 4px 2px;padding:12px 0 0;border-top:1px solid var(--border,#e5e0da);font-size:14px;line-height:1.5;color:#5c4d42;list-style-position:inside;display:grid;gap:4px 28px}.np-legend li{padding-left:0}ol.np-legend{list-style-type:decimal}ul.np-legend{list-style:none}@media(min-width:900px){.np-legend:has(li:nth-child(4)){grid-template-columns:1fr 1fr}}.np-side{margin:4px 0 24px;padding:16px 16px 12px;border:1px solid var(--border,#e5e0da);border-radius:8px;background:#fff}.np-side svg{width:100%;max-width:440px;height:auto;display:block;margin:0 auto}.np-wide svg{max-width:none}.np-wide figcaption{max-width:none}.np-side figcaption{margin:10px auto 0;max-width:440px;font-size:13px;line-height:1.4;color:#7a6a5e;text-align:center}.np-legend{margin:14px 4px 2px;padding:12px 0 0;border-top:1px solid var(--border,#e5e0da);font-size:14px;line-height:1.45;color:#3d2f25;list-style:none;display:grid;gap:8px 28px;counter-reset:np}ol.np-legend li{counter-increment:np;display:flex;gap:10px;align-items:flex-start}ol.np-legend li::before{content:counter(np);flex:0 0 22px;height:22px;border-radius:50%;background:#fe7802;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:-1px}@media(min-width:640px){.np-legend-2{grid-template-columns:1fr 1fr}}.np-photo img{display:block;margin:0 auto;max-width:100%;height:auto;border-radius:4px}.np-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:4px 0 24px}@media(min-width:900px){.np-gallery{grid-template-columns:repeat(4,1fr)}}.np-gallery figure{margin:0;padding:8px;border:1px solid var(--border,#e5e0da);border-radius:8px;background:#fff}.np-gallery img{width:100%;aspect-ratio:11/10;object-fit:cover;display:block;border-radius:4px}.np-gallery figcaption{margin-top:6px;font-size:12px;line-height:1.35;color:#7a6a5e}.np-hero-photo{margin:0 0 0 auto;max-width:480px}.np-hero-photo img{display:block;width:100%;height:auto;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.35)}.np-icons{list-style:none;padding:0;margin:0 0 16px}.np-icons li{position:relative;padding-left:34px;margin-bottom:12px;line-height:1.65;color:var(--muted-foreground,#7a6a5e)}.np-icons li::before{content:"";position:absolute;left:0;top:3px;width:22px;height:22px;background-repeat:no-repeat;background-size:22px 22px}.np-pros li::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%23fe7802' stroke-width='2'/%3E%3Cpath d='M7.5 12.5l3 3 6-6.5' fill='none' stroke='%23fe7802' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}.np-cons li::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%237a6a5e' stroke-width='2'/%3E%3Cpath d='M12 7v6' stroke='%237a6a5e' stroke-width='2.2' stroke-linecap='round'/%3E%3Ccircle cx='12' cy='16.6' r='1.3' fill='%237a6a5e'/%3E%3C/svg%3E")}.np-card-img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;border-radius:8px;margin:0 0 16px}.np-sources a{overflow-wrap:anywhere}details>summary{list-style:none}details>summary::after{content:"+";float:right;font-weight:400}details[open]>summary::after{content:"–"}${HUBS.has(url) ? HUB_CSS : ''}</style>\n</head>`)
    .replace(/<body([^>]*)>/, `<body$1><div style="background:#111;color:#fff;font:12px/1.4 Inter,system-ui,sans-serif;padding:6px 16px;text-align:center">Preview of new page content for nextpartitions.com${url} · not the live site · <a href="index.html" style="color:#fff;text-decoration:underline">all preview pages</a></div>`)
    // Links: rebuilt pages stay in the preview; everything else goes to the live site.
    .replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_, attr, path) => {
      const clean = '/' + path.replace(/[#?].*$/, '').replace(/\/$/, '')
      if (attr === 'href' && built.has(clean)) return `${attr}="${fileFor(clean)}${path.includes('#') ? path.slice(path.indexOf('#')) : ''}"`
      return `${attr}="${SITE}/${path}"`
    })
  if (url === '/') html = homepage(url)
  writeFileSync(`${OUT}/${fileFor(url)}`, html)
  const words = strip(main.replace(/<section class="border-t border-border bg-accent\/30">[\s\S]*?<\/section>/, '').replace(/<nav[\s\S]*?<\/nav>/, '')).split(/\s+/).length
  return { url, title: fm.h1, words }
}


// The installer directory and job flow: the prototypes published as claude.ai artifacts (links in CLAUDE.md), in the
// order a job moves through them. Listed on the preview index so the whole project sits behind one link.
const P = 'https://claude.ai/artifact/'
const INSTALLER_FLOW = [
  ['Installer', 'Get listed: installer application', 'Why join, the checks to be Verified, and the six-step application ending with the listing agreement.', `${P}RYzFiXDAUfUj1UbYaaf5N5`],
  ['Next Partitions (internal)', 'Installer vetting', 'The checklist with evidence per applicant, the timed test job, approve or reject.', `${P}5m6eiBdee8mbWGpusQiEF5`],
  ['Customer', 'Texas installer hub', 'Search by city or ZIP, coverage map, area cards and the A–Z city index.', `${P}NgMp8WdWWpwAfKPSwaDV29`],
  ['Customer', 'Dallas–Fort Worth area page', 'Configure your partitions first; the area\'s installers, map and FAQ below.', `${P}6dhxph55HK2cQ8L89RKUBc`],
  ['Customer', 'Installer profile', 'One installer\'s profile, labels and reviews; "Get a quote with" opens the configurator. Samples: #acme, #northwind, #contoso, #fabrikam.', `${P}Wh2UPd1KDJ78JDQmZsySrN#acme`],
  ['Customer', 'Configurator installation step', 'The optional installation step: installers stay anonymous, a count and a price range only. Designed, not switched on.', `${P}VSxudbJ4rsvR5bcDyU2xSs#dfw`],
  ['Installer', 'Installer portal: price the job', 'The blind job packet (scope, drawings, city and ZIP, no customer details) and the installer\'s price.', `${P}32L7EWz37XztbenrBwUKBj#NP-DFW-1048`],
  ['Next Partitions (internal)', 'Job coordination view', 'The same job from the Next Partitions side: prices in, flags, follow-ups. #NP-DFW-1052 shows a job with no installer prices yet.', `${P}32L7EWz37XztbenrBwUKBj#np`],
  ['Customer', 'Customer\'s quote: approve, choose, pay', 'Approve the shop drawings, choose an installer, pay for the partitions. #searching shows the state while installers are still being lined up.', `${P}YJ7mS6GqUSktyydDMy8BDq#choose`],
  ['Both', 'Emails along the way', 'The ten emails of the flow, from the quote range to the review request; 8–10 cover a job with no installer prices.', `${P}614jrzEpTZt1WMTuruh4BS#email-1`],
  ['Customer', 'Review after the install', 'Only customers with a completed job can review; #used and #expired show the other states.', `${P}KVKguYuwNK7AJkXXRseaM8`],
]

const files = readdirSync(PAGES).filter((f) => f.endsWith('.md')).sort()
const built = new Set(files.map((f) => parse(f).fm.url))
const rows = files.map((f) => build(f, built))
const before = (url) => {
  try {
    const t = readFileSync(`${CURRENT}/${url === '/' ? 'home' : url.replace(/^\//, '').replace(/\//g, '_')}.md`, 'utf8').split('## Explore More')[0]
    return t.split('\n').slice(3).join(' ').split(/\s+/).filter(Boolean).length
  } catch { return null }
}
writeFileSync(`${OUT}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Next Partitions Content Preview</title><meta name="robots" content="noindex"><style>${CSS}.np-flow-n{flex:0 0 28px;height:28px;border-radius:50%;background:#fe7802;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center}</style></head>
<body class="bg-background text-foreground"><div class="max-w-3xl mx-auto px-4 py-10">
<h1 class="text-3xl font-bold mb-2">New page content for nextpartitions.com</h1>
<p class="text-sm mb-4"><a class="text-brand-red hover:underline font-medium" href="#installers">Jump to the installer pages and job flow</a></p>
<p class="text-muted-foreground mb-6">Each page in the live site's layout, ready to port into the site. Built ${new Date().toISOString().slice(0, 10)} from site-content/pages/. Words are the page's own content (live page shown for comparison; "new" means the URL doesn't exist or is blank today).</p>
<div class="overflow-x-auto"><table class="w-full text-sm border-collapse border border-border"><thead><tr class="bg-accent"><th class="p-3 text-left">Page</th><th class="p-3 text-left">URL</th><th class="p-3 text-left">Words live</th><th class="p-3 text-left">Words new</th></tr></thead><tbody class="divide-y divide-border">
${rows.map((r) => { const b = before(r.url); return `<tr><td class="p-3"><a class="text-brand-red hover:underline font-medium" href="${fileFor(r.url)}">${esc(r.title)}</a></td><td class="p-3 text-muted-foreground">${r.url}</td><td class="p-3">${b === null || b < 60 ? 'new' : b}</td><td class="p-3">${r.words}</td></tr>` }).join('\n')}
</tbody></table></div>
<section id="installers" class="mt-12 pt-8 border-t border-border">
<h2 class="text-2xl font-bold mb-2">Installer pages and job flow</h2>
<p class="text-muted-foreground mb-4">The installer directory, kept apart from the main site, and the job flow behind it: how an installer gets listed, how a customer finds one, how a job is priced, chosen and installed, and how it's reviewed. Clickable prototypes; every installer, rate, review and photo in them is a fictional sample, and Dallas–Fort Worth is the example area.</p>
<div class="border border-border rounded-lg p-5 mb-6 bg-accent/50"><p class="font-semibold mb-1">Start here: the working prototype</p><p class="text-sm text-muted-foreground mb-3">The whole flow as one app with shared sample data, so one job can be followed from the installer's price to the customer's choice to the install date.</p>${button('Open the working prototype', 'https://claude.ai/artifact/28Jz9krwMovkrgjGw8XYFa')}<p class="text-sm text-muted-foreground mt-3">All design prototypes linked as one site: <a class="text-brand-red hover:underline font-medium" href="https://claude.ai/artifact/1EM6mvJkMTXTtfTNj5SrbQ" target="_blank" rel="noopener">open the design prototypes</a>.</p></div>
<h3 class="text-lg font-bold mb-3">The flow, step by step</h3>
<ol class="space-y-3 mb-4">${INSTALLER_FLOW.map(([who, title, text, url], i) => `<li class="border border-border rounded-lg p-4 flex gap-4 items-start"><span class="np-flow-n">${i + 1}</span><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">${who}</p><a class="text-brand-red hover:underline font-semibold" href="${url}" target="_blank" rel="noopener">${esc(title)}</a><p class="text-sm text-muted-foreground mt-1">${text}</p></div></li>`).join('')}</ol>
</section></div></body></html>`)
console.log(`built ${rows.length} pages + index.html`)
