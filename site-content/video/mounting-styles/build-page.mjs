// Builds page.html: one self-contained page that draws any frame of the video for a given time.
// render.mjs loads it in headless Chromium, calls window.frameAt(t) for each frame and screenshots the stage.
// Content comes from timeline.json (storyboard and narration), the technical drawings in ../../design/diagrams
// and the three.js product renders in ../../design/renders.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const D = join(HERE, '../../design/diagrams'), R = join(HERE, '../../design/renders')
const T = JSON.parse(readFileSync(join(HERE, 'timeline.json'), 'utf8'))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const logo = `data:image/png;base64,${readFileSync(join(HERE, '../../../prototypes/img/logo.png')).toString('base64')}`
const img = (n) => `data:image/jpeg;base64,${readFileSync(join(R, n + '.jpg')).toString('base64')}`
const svg = (n) => readFileSync(join(D, n + '.svg'), 'utf8').replace(/<title[\s\S]*?<\/title>|<desc[\s\S]*?<\/desc>/g, '')
  .replace(/<svg /, '<svg class="dwg" preserveAspectRatio="xMidYMid meet" ')

let t0 = 0
const scenes = T.scenes.map((s) => {
  const start = t0; t0 += s.dur
  let inner = ''
  if (s.image) inner += `<div class="bg"><img src="${img(s.image)}" alt=""></div>`
  if (s.id === 'intro') inner += `<div class="shade"></div><div class="intro"><div class="kick">${esc(s.kicker)}</div><h1>${esc(s.title)}</h1><p>The four ways a stall is held up</p></div>`
  if (s.num) inner += `<div class="shade side"></div><div class="stylecard"><span class="num">${s.num}</span><h2>${esc(s.style)}</h2></div>`
  if (s.drawing) inner += `<div class="paper${s.facts ? '' : ' wide'}"><div class="dwgbox">${svg(s.drawing)}</div></div>`
    + (s.facts ? `<div class="facts"><div class="kick">${esc(s.style)}</div>${s.facts.map(([k, v]) => `<div class="fact"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : '')
  if (s.choose) inner += `<div class="choose"><div class="kick">How to choose</div>${s.choose.map(([q, a]) => `<div class="row"><span>${esc(q)}</span><b>${esc(a)}</b></div>`).join('')}</div>`
  if (s.end) inner += `<div class="shade"></div><div class="endcard"><img src="${logo}" alt=""><h2>Price your restroom</h2><p>nextpartitions.com/get-a-quote</p><div class="note">Partitions shipped to job sites in all 50 states</div></div>`
  const style = s.num ? s.num : s.style ? { 'Overhead braced': 1, 'Floor mounted': 2, 'Ceiling hung': 3, 'Floor to ceiling': 4 }[s.style] : 0
  return { start, dur: s.dur, say: s.say, style, html: `<section class="scene s-${s.id}" data-start="${start}" data-dur="${s.dur}"${s.image ? ' data-zoom="1"' : ''}${s.drawing ? ' data-draw="1"' : ''}>${inner}</section>` }
})

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#000}
#stage{position:relative;width:1920px;height:1080px;overflow:hidden;background:#fbfaf9;font-family:Inter,system-ui,sans-serif;color:#1c0e05}
body.v #stage{width:1080px;height:1920px}
.scene{position:absolute;inset:0;opacity:0}
.bg{position:absolute;inset:0;overflow:hidden}.bg img{width:100%;height:100%;object-fit:cover;transform-origin:50% 45%}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(28,14,5,.82) 0%,rgba(28,14,5,.55) 45%,rgba(28,14,5,.15) 100%)}
.shade.side{background:linear-gradient(90deg,rgba(28,14,5,.78) 0%,rgba(28,14,5,.35) 38%,rgba(28,14,5,0) 60%)}
body.v .shade,body.v .shade.side{background:linear-gradient(0deg,rgba(28,14,5,.9) 0%,rgba(28,14,5,.72) 55%,rgba(28,14,5,.3) 100%)}
.kick{font-size:22px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fe7802}
.intro{position:absolute;left:120px;top:330px;width:1100px;color:#fbfaf9}
.intro h1{font-family:'Inter Display',Inter;font-size:92px;line-height:1.02;font-weight:800;letter-spacing:-.02em;margin:18px 0 22px}
.intro p{font-size:34px;font-weight:500;opacity:.9}
body.v .intro{left:72px;right:72px;top:auto;bottom:640px;width:auto}body.v .intro h1{font-size:96px}
.stylecard{position:absolute;left:120px;bottom:250px;color:#fbfaf9;display:flex;align-items:center;gap:28px}
.stylecard .num{width:96px;height:96px;border-radius:50%;background:#fe7802;color:#fff;font-size:52px;font-weight:800;display:flex;align-items:center;justify-content:center}
.stylecard h2{font-family:'Inter Display',Inter;font-size:96px;font-weight:800;letter-spacing:-.02em}
body.v .stylecard{left:72px;bottom:760px;flex-direction:column;align-items:flex-start;gap:20px}body.v .stylecard h2{font-size:104px;line-height:1}
.paper{position:absolute;left:70px;top:100px;width:1100px;height:730px;background:#fff;border:1.5px solid #2d1e14;border-top:6px solid #fe7802;display:flex;align-items:center;justify-content:center;padding:48px}
.paper.wide{left:110px;width:1700px}
.paper .dwg{max-height:100%}
.dwgbox{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.dwg{width:100%;height:100%}
.dwg .co,.dwg .dn{display:none}
.facts{position:absolute;left:1240px;top:150px;width:600px}
.fact{margin-top:44px;padding-top:22px;border-top:2px solid #e5e0da}
.fact span{display:block;font-size:22px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7a6a5e;margin-bottom:10px}
.fact b{display:block;font-size:46px;line-height:1.15;font-weight:700}
body.v .paper,body.v .paper.wide{left:40px;width:1000px;top:150px;height:700px;padding:20px}
body.v .facts{left:72px;top:880px;width:940px}body.v .fact{margin-top:30px}body.v .fact b{font-size:50px}
.choose{position:absolute;left:120px;top:150px;right:120px}
.choose .row{display:flex;justify-content:space-between;align-items:baseline;gap:40px;padding:30px 0;border-bottom:2px solid #e5e0da}
.choose .row span{font-size:46px;font-weight:600}.choose .row b{font-size:46px;color:#fe7802;font-weight:800;text-align:right}
body.v .choose{left:72px;right:72px;top:200px}body.v .choose .row{flex-direction:column;gap:10px;padding:34px 0}body.v .choose .row b{text-align:left;font-size:54px}body.v .choose .row span{font-size:46px}
.endcard{position:absolute;left:120px;top:300px;color:#fbfaf9}
.endcard img{width:96px;height:auto;margin-bottom:36px}
.endcard h2{font-family:'Inter Display',Inter;font-size:104px;font-weight:800;letter-spacing:-.02em}
.endcard p{font-size:48px;font-weight:700;color:#fe7802;margin-top:18px}
.endcard .note{font-size:30px;margin-top:28px;opacity:.85}
body.v .endcard{left:72px;right:72px;top:auto;bottom:700px}body.v .endcard h2{font-size:92px}body.v .endcard p{font-size:44px}
#brand{position:absolute;left:56px;top:40px;display:flex;align-items:center;gap:14px;font-weight:700;font-size:26px;z-index:5}
#brand img{width:40px;height:auto}
#dots{position:absolute;right:60px;top:46px;display:flex;gap:12px;z-index:5}
#dots i{width:44px;height:8px;border-radius:4px;background:rgba(120,106,94,.35)}#dots i.on{background:#fe7802}
body.v #brand{left:60px;top:70px}body.v #dots{right:60px;top:84px}
#cap{position:absolute;left:50%;bottom:46px;transform:translateX(-50%);width:1680px;text-align:center;z-index:6}
#cap span{display:inline;background:rgba(28,14,5,.86);color:#fff;font-size:36px;line-height:1.55;font-weight:600;padding:6px 16px;box-decoration-break:clone;-webkit-box-decoration-break:clone;border-radius:6px}
body.v #cap{bottom:430px;max-width:940px;width:940px}body.v #cap span{font-size:44px}
`

const JS = `
const S=[...document.querySelectorAll('.scene')],cap=document.querySelector('#cap span'),dots=[...document.querySelectorAll('#dots i')],brand=document.getElementById('brand')
const SAY=${JSON.stringify(scenes.map((s) => ({ say: s.say, style: s.style })))}
const clamp=(x)=>Math.max(0,Math.min(1,x)),ease=(x)=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2
// prepare the line drawings: every stroked shape gets a dash as long as itself
for(const s of S) if(s.dataset.draw){ s._g=[]; for(const el of s.querySelectorAll('.dwg line,.dwg path,.dwg rect,.dwg polyline,.dwg polygon,.dwg circle,.dwg ellipse')){
  let L=0; try{L=el.getTotalLength()}catch(e){}
  const st=getComputedStyle(el).stroke; if(L>0&&st&&st!=='none'){el.style.strokeDasharray=L;el.style.strokeDashoffset=L;s._g.push([el,L,'s'])} else s._g.push([el,0,'f']) }
  s._t=[...s.querySelectorAll('.dwg text')]; s._n=s._g.length }
window.frameAt=function(t){
  let cur=0
  S.forEach((s,i)=>{const a=+s.dataset.start,d=+s.dataset.dur,lt=t-a,last=i===S.length-1
    const o=lt<0||lt>d+.5?0:(i===0?1:clamp(lt/.5)); s.style.opacity=o; if(lt>=0&&lt<d)cur=i  // crossfade: each scene fades in over the one before, which stays fully visible underneath until it's covered
    if(o<=0)return
    const p=clamp(lt/d)
    if(s.dataset.zoom){const im=s.querySelector('.bg img');im.style.transform='scale('+(1.02+.08*p)+') translateX('+(-1.2*p)+'%)'}
    if(s.dataset.draw){const q=ease(clamp((lt-.25)/(Math.min(d,6)*.62)));
      s._g.forEach(([el,L,k],j)=>{const share=clamp(q*1.25-j/s._n*.25); if(k==='s')el.style.strokeDashoffset=L*(1-share); el.style.fillOpacity=clamp(q*1.6-.6); el.style.opacity=1})
      s._t.forEach(x=>x.style.opacity=clamp(q*2.2-1.2))
      s.querySelector('.dwg').style.transform='scale('+(1+.03*p)+')'}
    s.querySelectorAll('.fact,.choose .row').forEach((f,j)=>{const r=clamp((lt-.6-j*(s.classList.contains('s-choose')?1.4:.9))/.5);f.style.opacity=r;f.style.transform='translateY('+(18*(1-r))+'px)'})
    s.querySelectorAll('.intro>*,.stylecard,.endcard>*').forEach((f,j)=>{const r=clamp((lt-.2-j*.35)/.6);f.style.opacity=r;f.style.transform='translateY('+(24*(1-ease(r)))+'px)'})
  })
  const sc=S[cur],lt=t-+sc.dataset.start
  cap.textContent=SAY[cur].say; cap.parentElement.style.opacity=clamp(lt/.35)*clamp((+sc.dataset.dur-lt)/.3+(cur===S.length-1?1:0))
  dots.forEach((d,j)=>d.className=SAY[cur].style===j+1?'on':''); document.getElementById('dots').style.opacity=SAY[cur].style?1:0
  const dark=!!sc.querySelector('.bg'); brand.style.color=dark?'#fbfaf9':'#1c0e05'; brand.style.opacity=sc.classList.contains('s-end')?0:1
}
window.DURATION=${t0}
if(location.hash==='#v')document.body.className='v'
frameAt(+(new URLSearchParams(location.search).get('t')||1))
`

writeFileSync(join(HERE, 'page.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${esc(T.title)}</title><style>${CSS}</style></head>
<body><div id="stage">${scenes.map((s) => s.html).join('\n')}
<div id="brand"><img src="${logo}" alt="">Next Partitions</div><div id="dots"><i></i><i></i><i></i><i></i></div>
<div id="cap"><span></span></div></div>
<script>${JS}</script></body></html>`)
console.log('page.html written,', t0, 's')
