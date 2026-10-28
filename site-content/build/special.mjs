// Own layouts for the homepage, About and Contact. Product pages, guides and blog posts share the article layout
// (hero, reading column, side card); these three are not articles, so each gets full-width sections built from the
// same page file: the copy stays in pages/<page>.md, and each layout picks its sections by title.
// h: helpers from build.mjs { md, inline, esc, button, renderSrc, inlineSvg, responsive, LOGO, logo, QUOTE_PROMISE }

const sec = (sections, re) => sections.find((s) => re.test(s.title))
// "- **Lead.** rest" list items -> [{ lead, text }]; plain items keep an empty lead
const bullets = (s) => (s?.md.match(/^[-*] .+$/gm) || []).map((l) => {
  const m = l.slice(2).match(/^\*\*(.+?)\*\*:?\s*(.*)$/)
  return m ? { lead: m[1].replace(/[.:]$/, ''), text: m[2] } : { lead: '', text: l.slice(2) }
})
const steps = (s) => (s?.md.match(/^\d+\. .+$/gm) || []).map((l) => {
  const m = l.replace(/^\d+\. /, '').match(/^\*\*(.+?)\*\*\s*(.*)$/)
  return m ? { lead: m[1].replace(/[.?]$/, (c) => (c === '?' ? '?' : '')), text: m[2] } : { lead: '', text: l }
})
const links = (s) => [...(s?.md.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g) || [])].map((m) => ({ label: m[1], href: m[2] }))
const paras = (s) => (s?.md.split(/\n\s*\n/) || []).filter((p) => !/^([-*] |\d+\. |\||!\[|\[[^\]]+\]\([^)]+\)( [·] |\s*$))/.test(p.trim()) && !/^\*Disclaimer/.test(p.trim()))
const disclaimer = (s) => (s?.md.match(/^\*Disclaimer[\s\S]*?\*$/m) || [''])[0]
const table = (s) => {
  const rows = (s?.md.match(/^\|.+\|$/gm) || []).map((r) => r.slice(1, -1).split('|').map((c) => c.trim()))
  return rows.filter((r) => !r.every((c) => /^-+$/.test(c))).slice(1)
}
const ctaLink = (s) => links(s).find((l) => l.href === '/get-a-quote')

const ICON = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  badge: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  access: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
  hammer: '<path d="m15 12-8.37 8.37a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  hardhat: '<path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M14 6a6 6 0 0 1 6 6v3"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><rect x="2" y="15" width="20" height="4" rx="1"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
}
const icon = (n, cls = 'np-ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`

export const CSS = `
.np-lp{--o:var(--brand-red,#fe7802);--ink:var(--foreground,#1c0e05);--mut:var(--muted-foreground,#7a6a5e);--bd:var(--border,#e5e0da);--pap:var(--accent,#f2f0ec)}
.np-wrap{max-width:80rem;margin:0 auto;padding:0 16px}@media(min-width:640px){.np-wrap{padding:0 24px}}@media(min-width:1024px){.np-wrap{padding:0 32px}}
.np-band{padding:64px 0}.np-band-pap{background:var(--pap)}.np-band-dark{background:var(--primary,#2d2d2d);color:var(--primary-foreground,#fbfaf9)}
.np-eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--o);margin:0 0 8px}
.np-h2{font-size:30px;line-height:1.15;font-weight:700;letter-spacing:-.01em;margin:0 0 12px;color:var(--ink)}.np-band-dark .np-h2{color:inherit}
.np-lede{font-size:17px;line-height:1.6;color:var(--mut);max-width:44rem;margin:0 0 32px}.np-band-dark .np-lede{color:rgba(251,250,249,.75)}
.np-lede a,.np-card a,.np-note a,.np-faq a{color:var(--o);font-weight:500}
.np-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:28px}.np-head .np-lede{margin:0}
.np-more{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--o);white-space:nowrap}.np-more svg{width:16px;height:16px}
.np-ic{width:22px;height:22px;flex:none}
.np-grid{display:grid;gap:16px}@media(min-width:640px){.np-g2{grid-template-columns:repeat(2,1fr)}.np-g3,.np-g4,.np-g5,.np-g6{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.np-g3{grid-template-columns:repeat(3,1fr)}.np-g4{grid-template-columns:repeat(4,1fr)}.np-g5{grid-template-columns:repeat(5,1fr)}.np-g6{grid-template-columns:repeat(3,1fr)}}
.np-card{background:#fff;border:1px solid var(--bd);border-radius:10px;padding:22px;display:flex;flex-direction:column;gap:8px;min-width:0}
.np-card h3{font-size:17px;font-weight:700;margin:0;color:var(--ink)}.np-card p{margin:0;font-size:15px;line-height:1.55;color:var(--mut)}
a.np-card{transition:border-color .15s,box-shadow .15s}a.np-card:hover{border-color:var(--o);box-shadow:0 6px 20px rgba(28,14,5,.08)}
.np-card .np-ic{color:var(--o);width:26px;height:26px}
.np-card-media{margin:-22px -22px 6px;border-bottom:1px solid var(--bd);background:#fff;border-radius:10px 10px 0 0;overflow:hidden}.np-card-media img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;object-position:center bottom}
.np-card-media svg{display:block;width:100%;height:110px}
.np-card .np-go{margin-top:auto;padding-top:6px;font-size:14px;font-weight:600;color:var(--o);display:flex;align-items:center;gap:6px}.np-card .np-go svg{width:15px;height:15px}
.np-num{width:34px;height:34px;border-radius:50%;background:var(--o);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px}
.np-steps{display:grid;gap:16px;counter-reset:s}@media(min-width:768px){.np-steps{grid-template-columns:repeat(var(--n,3),1fr)}}
.np-step{position:relative;padding:22px;border-radius:10px;background:#fff;border:1px solid var(--bd)}.np-step h3{font-size:17px;font-weight:700;margin:14px 0 6px;color:var(--ink)}.np-step p{margin:0;font-size:15px;line-height:1.55;color:var(--mut)}
.np-band-dark .np-step{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14)}.np-band-dark .np-step h3{color:#fbfaf9}.np-band-dark .np-step p{color:rgba(251,250,249,.72)}
.np-btns{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.np-btn2{display:inline-flex;align-items:center;height:36px;padding:0 16px;border-radius:6px;font-size:14px;font-weight:500;border:1px solid rgba(251,250,249,.35);color:#fbfaf9}.np-btn2:hover{background:rgba(255,255,255,.08)}
.np-btn2-l{border-color:var(--bd);color:var(--ink);background:#fff}.np-btn2-l:hover{border-color:var(--o);background:#fff}
.np-hero2{display:grid;gap:40px;align-items:center;padding-top:56px;padding-bottom:64px}@media(min-width:1024px){.np-hero2{grid-template-columns:1fr 1.05fr}}
.np-hero2 h1{font-size:40px;line-height:1.08;font-weight:800;letter-spacing:-.02em;margin:0 0 16px}@media(min-width:768px){.np-hero2 h1{font-size:52px}}
.np-hero2 .np-sub{font-size:18px;line-height:1.6;opacity:.9;margin:0 0 28px;max-width:36rem}
.np-hero2 img{display:block;width:100%;height:auto;border-radius:14px;box-shadow:0 18px 44px rgba(0,0,0,.4)}
.np-ticks{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:10px}.np-ticks li{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.5;color:rgba(251,250,249,.85)}.np-ticks b{color:#fbfaf9}.np-ticks .np-ic{color:var(--o);width:20px;height:20px;margin-top:1px}
.np-ticks a{color:#fbfaf9;text-decoration:underline}
.np-logos{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}@media(min-width:768px){.np-logos{grid-template-columns:repeat(5,1fr)}}
.np-logos a{display:flex;align-items:center;justify-content:center;height:88px;background:#fff;border:1px solid var(--bd);border-radius:10px;padding:16px}.np-logos a:hover{border-color:var(--o)}.np-logos img{max-height:40px;max-width:100%;width:auto}
.np-tiles a{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 22px;background:#fff;border:1px solid var(--bd);border-radius:10px;font-weight:600;font-size:17px;color:var(--ink)}.np-tiles a:hover{border-color:var(--o)}.np-tiles a svg{width:18px;height:18px;color:var(--o)}
.np-onDark a{color:#fbfaf9;text-decoration:underline;font-weight:600}.np-step a{color:var(--o);font-weight:500}.np-band-dark .np-step a{color:#fbfaf9;text-decoration:underline}
.np-note{font-size:13px;line-height:1.55;color:var(--mut);margin:16px 0 0}
.np-faq{max-width:48rem;margin:0 auto}.np-faq details{background:#fff;border:1px solid var(--bd);border-radius:10px;padding:18px 20px;margin-bottom:10px}.np-faq summary{font-weight:600;cursor:pointer;color:var(--ink)}.np-faq details p{margin:12px 0 0;color:var(--mut);line-height:1.6}
.np-final{text-align:center}.np-final .np-lede{margin:0 auto 24px}.np-final .np-btns{justify-content:center}
.np-src{font-size:12px;color:var(--mut);padding:24px 0 40px;border-top:1px solid var(--bd)}.np-src h2{font-size:13px;font-weight:600;color:var(--ink);margin:0 0 6px}.np-src ul{margin:0;padding-left:18px}.np-src a{overflow-wrap:anywhere}
.np-facts{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(255,255,255,.14);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.14)}
.np-facts div{background:var(--primary,#2d2d2d);padding:24px}.np-facts b{display:block;font-size:40px;line-height:1;font-weight:800;color:var(--o);margin-bottom:8px}.np-facts span{font-size:14px;line-height:1.4;color:rgba(251,250,249,.8)}
.np-split{display:grid;gap:32px}@media(min-width:1024px){.np-split{grid-template-columns:1fr 1fr;align-items:start}}
.np-prose p{font-size:17px;line-height:1.7;color:var(--mut);margin:0 0 16px}.np-prose a{color:var(--o);font-weight:500}
.np-callout{border-left:4px solid var(--o);background:#fff;padding:18px 22px;border-radius:0 10px 10px 0;font-size:16px;line-height:1.6;color:var(--ink);font-weight:500}
.np-rows{display:grid;gap:10px}.np-rows a{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:18px 22px;background:#fff;border:1px solid var(--bd);border-radius:10px;color:var(--ink)}.np-rows a:hover{border-color:var(--o)}.np-rows span{font-size:15px;line-height:1.5}.np-rows b{font-size:14px;color:var(--o);display:flex;align-items:center;gap:6px;white-space:nowrap}.np-rows b svg{width:15px;height:15px}
.np-contact{display:grid;gap:16px;margin-top:-40px;position:relative}@media(min-width:768px){.np-contact{grid-template-columns:repeat(3,1fr)}}
.np-contact .np-card{box-shadow:0 10px 30px rgba(28,14,5,.08)}.np-contact .np-big{font-size:20px;font-weight:700;color:var(--ink)}
.np-form{display:grid;gap:14px}@media(min-width:640px){.np-form{grid-template-columns:1fr 1fr}}.np-form label{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:500;color:var(--ink)}
.np-form input,.np-form textarea{border:1px solid var(--bd);border-radius:6px;padding:10px 12px;font:inherit;font-size:15px;background:#fff;color:var(--ink)}.np-form .np-full{grid-column:1/-1}
.np-sendbtn{justify-self:start;height:40px;padding:0 20px;border-radius:6px;border:0;background:var(--o);color:#fff;font-weight:600;font-size:15px}
.np-times{display:grid;gap:10px}.np-times div{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid var(--bd);font-size:15px}.np-times div:last-child{border-bottom:0}.np-times span{color:var(--mut)}.np-times b{color:var(--ink);text-align:right}
.np-two{display:grid;gap:24px}@media(min-width:1024px){.np-two{grid-template-columns:1.5fr 1fr;align-items:start}}
.np-fig2{background:#fff;border:1px solid var(--bd);border-radius:10px;padding:16px;margin:0 0 12px}.np-fig2 svg{display:block;width:100%;height:auto}
.np-keys{list-style:none;padding:0;margin:0 0 28px;display:grid;gap:8px 28px}@media(min-width:768px){.np-keys{grid-template-columns:1fr 1fr}}.np-keys li{font-size:15px;line-height:1.5;color:var(--mut)}.np-keys b{color:var(--ink)}
`

const go = (label) => `<span class="np-go">${label} ${icon('arrow')}</span>`
const head = (eyebrow, title, lede, more) => `<div class="np-head"><div>${eyebrow ? `<p class="np-eyebrow">${eyebrow}</p>` : ''}<h2 class="np-h2">${title}</h2>${lede ? `<p class="np-lede">${lede}</p>` : ''}</div>${more ? `<a class="np-more" href="${more.href}">${more.label} ${icon('arrow')}</a>` : ''}</div>`
const faqBlock = (h, items) => items.length ? `<section class="np-band np-band-pap"><div class="np-wrap">${head('', 'Frequently asked questions').replace('np-head', 'np-head" style="justify-content:center;text-align:center')}<div class="np-faq">${items.map((x) => `<details><summary>${h.esc(x.q)}</summary><p>${h.inline(x.a)}</p></details>`).join('')}</div></div></section>` : ''
const sourcesBlock = (h, s) => s ? `<div class="np-wrap"><section class="np-src"><h2>Sources</h2>${h.mdPlain(s.md)}</section></div>` : ''
const finalBand = (h, title, text, primary, secondary) => `<section class="np-band np-band-dark"><div class="np-wrap np-final"><h2 class="np-h2">${h.esc(title)}</h2><p class="np-lede">${h.inline(text)}</p><div class="np-btns">${h.button(primary.label, primary.href)}${secondary ? `<a class="np-btn2" href="${secondary.href}">${h.esc(secondary.label)}</a>` : ''}</div></div></section>`

// ---------- homepage ----------
function home(h, p) {
  const { sections, intro } = p
  const S = (re) => sec(sections, re)
  const lead = intro.split(/\n\s*\n/)[0]
  const ticks = bullets({ md: intro })
  const cfg = S(/^Configure/), mats = S(/materials$/), mount = S(/^Four ways/), brands = S(/^Brands/), why = S(/^Why buy/)
  const ind = S(/^Partitions for every/), how = S(/^How it works/), inst = S(/^Installation/), incl = S(/^What is included/)
  const acc = S(/^Accessible/), meas = S(/^Measuring/), ready = S(/^Ready/)
  const matRows = table(mats)
  const MAT_SVG = { 'powder-coated-steel': 'material-section-powder-coated-steel', 'solid-plastic-hdpe': 'material-section-solid-plastic', phenolic: 'material-section-phenolic', 'plastic-laminate': 'material-section-plastic-laminate', 'stainless-steel': 'material-section-stainless-steel' }
  const mountItems = bullets(mount)
  const MOUNT = { 'Overhead braced': 'overhead-braced', 'Floor mounted': 'floor-mounted', 'Ceiling hung': 'ceiling-hung', 'Floor to ceiling': 'floor-to-ceiling' }
  const LOGOS = [['Bobrick', '/brands/bobrick', 'bobrick.png'], ['ASI Global', '/brands/asiglobal', 'asi.png'], ['Scranton Products', '/brands/scranton-products', 'scranton.png'], ['Metpar', '/brands/metpar', 'metpar.png'], ['Ammco', '/brands/ammco', 'ammco.svg']]
  const WHY_ICON = ['badge', 'truck', 'box', 'wrench']
  return `
<section class="np-band-dark"><div class="np-wrap np-hero2"><div>
<h1>${h.esc(p.fm.h1)}</h1><p class="np-sub">${h.inline(lead)}</p>
<div class="np-btns">${h.button('Get a Quote', '/get-a-quote')}<a class="np-btn2" href="/partitions">Browse Materials</a></div>
<ul class="np-ticks">${ticks.map((t) => `<li>${icon('check')}<span><b>${h.esc(t.lead)}.</b> ${h.inline(t.text)}</span></li>`).join('')}</ul>
</div><img src="${h.renderSrc('overhead-braced-angle')}" alt="A row of overhead braced toilet partitions: one wider accessible stall and three standard stalls" width="2400" height="1500"></div></section>

<section class="np-band"><div class="np-wrap">${head('Price it yourself', h.esc(cfg.title), h.inline(paras(cfg)[0] || ''))}
<div class="np-steps">${steps(cfg).map((s, i) => `<div class="np-step"><div class="np-num">${i + 1}</div><h3>${h.esc(s.lead)}</h3><p>${h.inline(s.text)}</p></div>`).join('')}</div>
<div class="np-btns" style="margin-top:28px">${h.button(ctaLink(cfg)?.label || 'Start Your Configuration', '/get-a-quote')}<span class="np-note" style="margin:0">${h.esc(h.QUOTE_PROMISE)}</span></div></div></section>

<section class="np-band np-band-pap"><div class="np-wrap">${head('Materials', 'Five partition materials', 'Every material for every environment. Each one is built differently, and that decides where it fits.', { label: 'Compare all materials', href: '/partitions' })}
<div class="np-grid np-g5">${matRows.map(([name, built, fit]) => {
    const l = name.match(/\[([^\]]+)\]\(([^)]+)\)/), slug = l[2].split('/').pop()
    return `<a class="np-card" href="${l[2]}"><div class="np-card-media">${h.inlineSvg(`${MAT_SVG[slug]}-m.svg`).replace(/<title[\s\S]*?<\/title>|<desc[\s\S]*?<\/desc>/g, '')}</div><h3>${h.esc(l[1])}</h3><p>${h.esc(built)}.</p><p><b style="color:var(--ink);font-weight:600">Fits:</b> ${h.esc(fit)}.</p>${go('Learn more')}</a>`
  }).join('')}</div>
<p class="np-note">${h.inline(paras(mats).slice(-1)[0] || '')}</p></div></section>

<section class="np-band"><div class="np-wrap">${head('Mounting styles', h.esc(mount.title), h.inline(paras(mount)[0]), { label: 'Compare mounting styles', href: '/mounting-styles' })}
<div class="np-grid np-g4">${mountItems.map((m) => `<a class="np-card" href="/mounting-styles/${MOUNT[m.lead]}"><div class="np-card-media"><img src="${h.renderSrc(`${MOUNT[m.lead]}-front-hero`)}" alt="${h.esc(m.lead)} partitions, front view" loading="lazy"></div><h3>${h.esc(m.lead)}</h3><p>${h.inline(m.text.charAt(0).toUpperCase() + m.text.slice(1))}</p>${go('See details')}</a>`).join('')}</div></div></section>

<section class="np-band np-band-pap"><div class="np-wrap">${head('Brands', h.esc(brands.title), h.inline(paras(brands)[0]), { label: 'All brands', href: '/brands' })}
<div class="np-logos">${LOGOS.map(([n, href, img]) => `<a href="${href}" aria-label="${n}"><img src="${h.logo(img)}" alt="${n}"></a>`).join('')}</div></div></section>

<section class="np-band"><div class="np-wrap">${head('', h.esc(why.title))}
<div class="np-grid np-g4">${bullets(why).map((b, i) => `<div class="np-card">${icon(WHY_ICON[i] || 'check')}<h3>${h.esc(b.lead)}</h3><p>${h.inline(b.text)}</p></div>`).join('')}</div></div></section>

<section class="np-band np-band-pap"><div class="np-wrap">${head('Industries', h.esc(ind.title), h.inline(paras(ind)[0]))}
<div class="np-grid np-g6 np-tiles">${links(ind).map((l) => `<a href="${l.href}">${h.esc(l.label)} ${icon('arrow')}</a>`).join('')}</div></div></section>

<section class="np-band np-band-dark"><div class="np-wrap">${head('', h.esc(how.title))}
<div class="np-steps">${steps(how).map((s, i) => `<div class="np-step"><div class="np-num">${i + 1}</div><h3>${h.esc(s.lead)}</h3><p>${h.inline(s.text)}</p></div>`).join('')}</div></div></section>

<section class="np-band"><div class="np-wrap">${head('Before you order', 'Good to know')}
<div class="np-grid np-g2">${[[incl, 'box'], [meas, 'ruler'], [acc, 'access'], [inst, 'hammer']].map(([s, ic]) => `<div class="np-card">${icon(ic)}<h3>${h.esc(s.title)}</h3>${paras(s).map((x) => `<p>${h.inline(x)}</p>`).join('')}${disclaimer(s) ? `<p class="np-note" style="margin-top:4px">${h.inline(disclaimer(s))}</p>` : ''}</div>`).join('')}</div></div></section>

${faqBlock(h, p.faq)}
${finalBand(h, ready.title, paras(ready)[0], { label: ctaLink(ready)?.label || 'Get a Quote', href: '/get-a-quote' }, { label: 'Contact us', href: '/contact' })}
${sourcesBlock(h, p.sources)}`
}

// ---------- About ----------
function about(h, p) {
  const { sections, intro } = p
  const S = (re) => sec(sections, re)
  const what = S(/^What we do/), who = S(/^Who we work/), buy = S(/^What you can buy/), how = S(/^How a project/)
  const acc = S(/^Accessibility/), whyUs = S(/^Why customers/), ship = S(/^Shipping/), talk = S(/^Talk/)
  const lead = intro.split(/\n\s*\n/)[0]
  const WHO_ICON = { Contractors: 'hardhat', Architects: 'pencil', 'Facility managers': 'building', 'Builders and owners': 'hammer' }
  const whatP = paras(what)
  return `
<section class="np-band-dark"><div class="np-wrap np-hero2"><div>
<h1>${h.esc(p.fm.h1)}</h1><p class="np-sub">${h.inline(lead)}</p>
<div class="np-btns">${h.button('Get a Quote', '/get-a-quote')}<a class="np-btn2" href="/contact">Contact us</a></div>
</div><div class="np-facts"><div><b>7</b><span>brands, including Bobrick, ASI Global and Scranton Products</span></div><div><b>5</b><span>partition materials, from powder coated steel to phenolic</span></div><div><b>4</b><span>mounting styles for any floor and ceiling</span></div><div><b>50</b><span>states plus Washington, D.C., by tracked freight</span></div></div></div></section>

<section class="np-band"><div class="np-wrap np-split"><div>${head('What we do', 'Partitions and the hardware that goes with them')}<div class="np-prose">${whatP.slice(0, -1).map((x) => `<p>${h.inline(x)}</p>`).join('')}</div></div>
<div><p class="np-callout">${h.inline(whatP.slice(-1)[0])}</p><figure class="np-fig2" style="margin-top:20px"><img src="${h.renderSrc('ceiling-hung-angle')}" alt="Ceiling hung toilet partitions" style="display:block;width:100%;height:auto;border-radius:6px"></figure></div></div></section>

<section class="np-band np-band-pap"><div class="np-wrap">${head('', h.esc(who.title))}
<div class="np-grid np-g4">${bullets(who).map((b) => `<div class="np-card">${icon(WHO_ICON[b.lead] || 'check')}<h3>${h.esc(b.lead)}</h3><p>${h.inline(b.text)}</p></div>`).join('')}</div></div></section>

<section class="np-band"><div class="np-wrap">${head('', h.esc(buy.title), h.inline(paras(buy)[0] || ''))}
<div class="np-rows">${table(buy).map(([need, where]) => { const l = where.match(/\[([^\]]+)\]\(([^)]+)\)/); return `<a href="${l[2]}"><span>${h.esc(need)}</span><b>${h.esc(l[1])} ${icon('arrow')}</b></a>` }).join('')}</div></div></section>

<section class="np-band np-band-dark"><div class="np-wrap">${head('', h.esc(how.title))}
<div class="np-steps" style="--n:4">${steps(how).map((s, i) => `<div class="np-step"><div class="np-num">${i + 1}</div><h3>${h.esc(s.lead)}</h3><p>${h.inline(s.text)}</p></div>`).join('')}</div></div></section>

<section class="np-band"><div class="np-wrap">${head('', h.esc(whyUs.title))}<div class="np-prose" style="max-width:48rem">${paras(whyUs).map((x) => `<p>${h.inline(x)}</p>`).join('')}</div>
<figure class="np-fig2" style="margin-top:12px">${h.responsive('mounting-styles-compare.svg')}</figure></div></section>

<section class="np-band np-band-pap"><div class="np-wrap"><div class="np-grid np-g2">${[[acc, 'access'], [ship, 'truck']].map(([s, ic]) => `<div class="np-card">${icon(ic)}<h3>${h.esc(s.title)}</h3>${paras(s).map((x) => `<p>${h.inline(x)}</p>`).join('')}${disclaimer(s) ? `<p class="np-note" style="margin-top:4px">${h.inline(disclaimer(s))}</p>` : ''}</div>`).join('')}</div></div></section>

${faqBlock(h, p.faq)}
${finalBand(h, talk.title, paras(talk)[0], { label: 'Get a Quote', href: '/get-a-quote' }, { label: 'Contact us', href: '/contact' })}
${sourcesBlock(h, p.sources)}`
}

// ---------- Contact ----------
function contact(h, p) {
  const { sections, intro } = p
  const S = (re) => sec(sections, re)
  const phone = S(/^Phone/), email = S(/^Email/), ship = S(/^Shipping/), msg = S(/^Send us/), incl = S(/^What to include/)
  const plan = S(/^Planning/), inst = S(/^Installation/), times = S(/^Response/)
  const ip = intro.split(/\n\s*\n/)
  const lines = (s) => s.md.split('\n').map((l) => l.trim()).filter(Boolean)
  const fields = (msg.md.match(/Fields: ([^.[]+)/) || [, ''])[1].split(',').map((f) => f.trim()).filter(Boolean)
  const inclItems = bullets(incl), inclP = paras(incl)
  // the planning section keeps its drawings and lettered keys, in reading order
  const planParts = plan.md.split(/\n\s*\n/)
  const planHtml = planParts.map((part) => {
    const t = part.trim()
    const img = t.match(/^!\[([^\]]*)\]\(\/images\/diagrams\/([a-z0-9-]+)\.svg\)/)
    if (img) return `<figure class="np-fig2">${h.responsive(`${img[2]}.svg`)}</figure>`
    if (/^- /.test(t)) return `<ul class="np-keys">${bullets({ md: t }).map((b) => `<li><b>${h.esc(b.lead)}:</b> ${h.inline(b.text)}</li>`).join('')}</ul>`
    return `<p class="np-lede" style="margin-bottom:16px">${h.inline(t)}</p>`
  }).join('')
  return `
<section class="np-band-dark"><div class="np-wrap" style="padding-top:56px;padding-bottom:96px">
<h1 style="font-size:44px;line-height:1.1;font-weight:800;letter-spacing:-.02em;margin:0 0 14px">${h.esc(p.fm.h1)}</h1>
<p class="np-lede" style="font-size:18px;margin-bottom:24px">${h.inline(ip[0])}</p>
<p class="np-onDark" style="margin:0;color:rgba(251,250,249,.8)">${h.inline(ip[1] || '')}</p></div></section>

<div class="np-wrap"><div class="np-contact">
<a class="np-card" href="tel:18339977489">${icon('phone')}<h3>${h.esc(phone.title)}</h3><span class="np-big">${h.esc(lines(phone)[0])}</span><p>${h.esc(lines(phone)[1] || '')}</p></a>
<a class="np-card" href="mailto:${lines(email)[0]}">${icon('mail')}<h3>${h.esc(email.title)}</h3><span class="np-big">${h.esc(lines(email)[0])}</span><p>${h.esc(lines(email)[1] || '')}</p></a>
<div class="np-card">${icon('truck')}<h3>${h.esc(ship.title)}</h3><span class="np-big">${h.esc(lines(ship)[0])}</span><p>${h.esc(lines(ship)[1] || '')}</p></div>
</div></div>

<section class="np-band"><div class="np-wrap np-two">
<div class="np-card" style="padding:28px"><h2 class="np-h2" style="font-size:24px">${h.esc(msg.title)}</h2><p style="margin-bottom:8px">${h.inline(paras(msg)[0])}</p>
<form class="np-form" onsubmit="return false">${fields.map((f) => f === 'Message' ? `<label class="np-full">${f}<textarea rows="5"></textarea></label>` : `<label${f === 'Subject' ? ' class="np-full"' : ''}>${f}<input type="${f === 'Email' ? 'email' : f === 'Phone' ? 'tel' : 'text'}"></label>`).join('')}<button class="np-sendbtn np-full" type="submit">Send Message</button></form></div>
<div class="np-card" style="padding:28px">${icon('clock')}<h2 class="np-h2" style="font-size:22px;margin-top:6px">${h.esc(times.title)}</h2><div class="np-times">${table(times).map(([what, when]) => `<div><span>${h.esc(what)}</span><b>${h.esc(when)}</b></div>`).join('')}</div>
<div style="margin-top:16px">${h.button('Request a Quote', '/get-a-quote', 'w-full')}</div></div>
</div></section>

<section class="np-band np-band-pap"><div class="np-wrap">${head('Faster answers', h.esc(incl.title), h.inline(inclP[0] || ''))}
<div class="np-grid np-g3">${inclItems.map((b) => `<div class="np-card">${icon('clipboard')}<h3>${h.esc(b.lead)}</h3><p>${h.inline(b.text)}</p></div>`).join('')}</div>
<p class="np-note">${h.inline(inclP.slice(-1)[0] || '')}</p></div></section>

<section class="np-band"><div class="np-wrap">${head('New projects', h.esc(plan.title))}<div style="max-width:52rem">${planHtml}</div></div></section>

<section class="np-band np-band-pap" style="padding:40px 0"><div class="np-wrap"><div class="np-card" style="flex-direction:row;gap:16px;align-items:flex-start">${icon('hammer')}<div><h3>${h.esc(inst.title)}</h3><p>${h.inline(paras(inst)[0])}</p></div></div></div></section>

${faqBlock(h, p.faq)}
${sourcesBlock(h, p.sources)}`
}

export const SPECIAL = { '/': home, '/about': about, '/contact': contact }
