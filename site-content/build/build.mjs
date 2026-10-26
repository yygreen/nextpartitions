// Builds site-content/preview/: every page in site-content/pages/ as a finished HTML page in the live site's own
// layout (its header, footer, hero, content column with side card, and the "Explore More" block), using the live
// stylesheet (preview/styles.css, copied from nextpartitions.com) and only Tailwind classes it already contains.
// Each page carries its title, meta description, canonical and structured data (BreadcrumbList, FAQPage, Article
// for blog posts), so it can be ported into the Lovable project as it is. Links between rebuilt pages stay inside
// the preview; every other link goes to the live site.
//
//   cd site-content/build && npm install && npm run build    → open ../preview/index.html
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { marked } from 'marked'

const SITE = 'https://nextpartitions.com'
const PAGES = '../pages', OUT = '../preview', CURRENT = '../current'
const shell = readFileSync('shell.html', 'utf8') // a live page (/hardware/hinges), saved 2026-10-26
// The live stylesheet goes inside each page, so any single file opens on its own.
const CSS = readFileSync(`${OUT}/styles.css`, 'utf8')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
const fileFor = (url) => url.replace(/^\//, '').replace(/\//g, '_') + '.html'
const ICON_ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right h-4 w-4" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>'
const ICON_CHEVRON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right h-3.5 w-3.5 flex-shrink-0" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>'
// The site's button (copied from the live hero and side card).
const button = (label, href, extra = '') => `<a href="${href}"><button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 shadow h-9 px-4 py-2 ${extra} bg-brand-red text-brand-red-foreground hover:bg-brand-red/90 gap-2">${esc(label)} ${ICON_ARROW}</button></a>`

const SECTION = { hardware: ['Hardware & Parts', '/hardware'], 'mounting-styles': ['Mounting Styles', '/mounting-styles'], guides: ['Guides', '/guides'], blog: ['Blog', '/blog'] }
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
function styled(html) {
  return html
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
const md = (s) => styled(marked.parse(s, { gfm: true }))

function faqItems(section) {
  return section.md.split(/^### /m).filter((x) => x.trim()).map((q) => { const nl = q.indexOf('\n'); return { q: q.slice(0, nl).trim(), a: q.slice(nl + 1).trim() } })
}

function build(file, built) {
  const { fm, intro, sections } = parse(file)
  const url = fm.url
  const seg = url.split('/').filter(Boolean)
  const crumbs = [['Home', '/']]
  if (seg.length > 1 && SECTION[seg[0]]) crumbs.push(SECTION[seg[0]])
  crumbs.push([fm.h1, url])

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

  const main = `<main class="flex-1">
<div class="relative bg-primary text-primary-foreground overflow-hidden"><div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
<nav aria-label="Breadcrumb" class="py-3"><ol class="flex items-center gap-1.5 text-sm text-primary-foreground/60 flex-wrap">${crumbs.map(([n, h], i) => i === crumbs.length - 1
    ? `<li class="flex items-center gap-1.5">${ICON_CHEVRON}<span class="text-primary-foreground font-medium" aria-current="page">${esc(n)}</span></li>`
    : `<li class="flex items-center gap-1.5">${i ? ICON_CHEVRON : ''}<a class="hover:text-primary-foreground/90 transition-colors" href="${h}">${esc(n)}</a></li>`).join('')}</ol></nav>
<h1 class="text-3xl md:text-4xl font-bold mt-2 mb-3">${esc(fm.h1)}</h1>
<p class="text-lg opacity-90 max-w-3xl mb-6">${strip(md(lead))}</p>
${button(ctaLabel, ctaHref)}
</div></div>
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8"><div class="md:col-span-2 min-w-0">
${introParas.length ? `<section class="mb-8">${md(introParas.join('\n\n'))}</section>` : ''}
${content.map((s) => `<section class="mb-8"><h2 class="text-2xl font-bold mb-4">${esc(s.title)}</h2>${md(s.md)}</section>`).join('\n')}
${items.length ? `<section class="mb-8"><h2 class="text-2xl font-bold mb-4">Frequently Asked Questions</h2><div class="space-y-3">${items.map((x) => `<details class="border border-border rounded-lg p-4"><summary class="font-semibold text-foreground cursor-pointer">${esc(x.q)}</summary><div class="mt-3">${md(x.a)}</div></details>`).join('')}</div></section>` : ''}
${sources ? `<section class="np-sources mt-10 border-t border-border pt-6 text-xs text-muted-foreground"><h2 class="text-sm font-semibold text-foreground mb-2">Sources</h2>${md(sources.md).replace(/text-muted-foreground leading-relaxed mb-4/g, 'mb-2').replace(/space-y-2 text-muted-foreground leading-relaxed mb-4/g, 'space-y-1')}</section>` : ''}
</div>
<aside class="space-y-4 min-w-0"><div class="bg-accent/50 rounded-lg p-6 sticky top-4">
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
    .replace('</head>', `<meta name="description" content="${esc(fm.meta)}"/>\n<link rel="canonical" href="${SITE}${url}"/>\n<meta name="robots" content="noindex"/>\n${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}\n<style>.np-sources a{overflow-wrap:anywhere}details>summary{list-style:none}details>summary::after{content:"+";float:right;font-weight:400}details[open]>summary::after{content:"–"}</style>\n</head>`)
    .replace(/<body([^>]*)>/, `<body$1><div style="background:#111;color:#fff;font:12px/1.4 Inter,system-ui,sans-serif;padding:6px 16px;text-align:center">Preview of new page content for nextpartitions.com${url} · not the live site · <a href="index.html" style="color:#fff;text-decoration:underline">all preview pages</a></div>`)
    // Links: rebuilt pages stay in the preview; everything else goes to the live site.
    .replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_, attr, path) => {
      const clean = '/' + path.replace(/[#?].*$/, '').replace(/\/$/, '')
      if (attr === 'href' && built.has(clean)) return `${attr}="${fileFor(clean)}${path.includes('#') ? path.slice(path.indexOf('#')) : ''}"`
      return `${attr}="${SITE}/${path}"`
    })
  writeFileSync(`${OUT}/${fileFor(url)}`, html)
  const words = strip(main.replace(/<section class="border-t border-border bg-accent\/30">[\s\S]*?<\/section>/, '').replace(/<nav[\s\S]*?<\/nav>/, '')).split(/\s+/).length
  return { url, title: fm.h1, words }
}

const files = readdirSync(PAGES).filter((f) => f.endsWith('.md')).sort()
const built = new Set(files.map((f) => parse(f).fm.url))
const rows = files.map((f) => build(f, built))
const before = (url) => {
  try {
    const t = readFileSync(`${CURRENT}/${url.replace(/^\//, '').replace(/\//g, '_')}.md`, 'utf8').split('## Explore More')[0]
    return t.split('\n').slice(3).join(' ').split(/\s+/).filter(Boolean).length
  } catch { return null }
}
writeFileSync(`${OUT}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>New page content: preview</title><meta name="robots" content="noindex"><style>${CSS}</style></head>
<body class="bg-background text-foreground"><div class="max-w-3xl mx-auto px-4 py-10">
<h1 class="text-3xl font-bold mb-2">New page content for nextpartitions.com</h1>
<p class="text-muted-foreground mb-6">Each page in the live site's layout, ready to port into the site. Built ${new Date().toISOString().slice(0, 10)} from site-content/pages/. Words are the page's own content (live page shown for comparison; "new" means the URL doesn't exist or is blank today).</p>
<div class="overflow-x-auto"><table class="w-full text-sm border-collapse border border-border"><thead><tr class="bg-accent"><th class="p-3 text-left">Page</th><th class="p-3 text-left">URL</th><th class="p-3 text-left">Words live</th><th class="p-3 text-left">Words new</th></tr></thead><tbody class="divide-y divide-border">
${rows.map((r) => { const b = before(r.url); return `<tr><td class="p-3"><a class="text-brand-red hover:underline font-medium" href="${fileFor(r.url)}">${esc(r.title)}</a></td><td class="p-3 text-muted-foreground">${r.url}</td><td class="p-3">${b === null || b < 60 ? 'new' : b}</td><td class="p-3">${r.words}</td></tr>` }).join('\n')}
</tbody></table></div></div></body></html>`)
console.log(`built ${rows.length} pages + index.html`)
