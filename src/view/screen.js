import { $, esc } from '../lib/util.js';
import { caps } from '../lib/keys.js';
import { CFG } from '../config.js';
import { APPS } from '../model/apps.js';
import { focusId, S, W } from '../model/desktop.js';
import { floatRect, setAspect, tileRects } from '../model/layout.js';
import { OV, PANELS } from '../actions/overlays.js';

// Draws the simulated desktop. Window nodes are keyed by id and positioned in px; CSS transitions animate tiling.
let DIM={W:960,H:600,bar:22};
let osdT;
function showOsd(t){const o=$('#osd');o.textContent=t;o.classList.add('on');clearTimeout(osdT);osdT=setTimeout(()=>o.classList.remove('on'),1100)}
const winEls=new Map();
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
function measure(){const r=$('#screen').getBoundingClientRect();const bar=Math.round(Math.max(15,Math.min(26,r.width*.027)));DIM={W:r.width||960,H:r.height||600,bar};
  setAspect(DIM.W/Math.max(1,DIM.H-DIM.bar));$('#screen').style.setProperty('--barh',bar+'px')}
function renderScreen(){
  const scr=$('#screen');scr.className='screen'+(CFG.wp?' wp'+CFG.wp:'');
  $('#zoomer').style.transform=S.zoom>1?`scale(${S.zoom})`:'';
  $('#night').classList.toggle('on',S.night);
  const showBar=S.bar&&!S.dfull;const barH=showBar?DIM.bar:0;const gap=(S.gaps&&!S.dfull)?Math.max(2,Math.round(DIM.W*.006)):0;
  const work={x:0,y:barH,w:DIM.W,h:DIM.H-barH};
  const ws=S.ws[S.cur];const f=focusId();const want=new Map();
  const place=(id,r,z,area=work,slot=null)=>want.set(id,{x:area.x+r.x*area.w+gap,y:area.y+r.y*area.h+gap,w:r.w*area.w-2*gap,h:r.h*area.h-2*gap,z,slot});
  const{rects}=tileRects(ws);
  ws.slots.forEach(sl=>{const id=sl.wins[sl.active];if(rects[id])place(id,rects[id],10,work,sl)});
  ws.floats.forEach((id,i)=>place(id,floatRect(i,W(id).app),30));
  S.pinned.forEach((id,i)=>place(id,{x:.64,y:.04+i*.3,w:.34,h:.32},45));
  if(S.scratch){const sw=S.ws.S;const{rects:sr}=tileRects(sw);const n=sw.slots.length;const area=n<=1?{x:work.x+work.w*.2,y:work.y,w:work.w*.6,h:work.h*.62}:{x:work.x+work.w*.02,y:work.y,w:work.w*.96,h:work.h*.66};
    sw.slots.forEach(sl=>{const id=sl.wins[sl.active];if(sr[id])place(id,sr[id],60,area,sl)});sw.floats.forEach((id,i)=>place(id,floatRect(i,W(id).app),62))}
  for(const[id,p]of want){const w=W(id);if(w.full===1&&!S.scratch){p.x=0;p.y=0;p.w=DIM.W;p.h=DIM.H;p.z=50}
    else if(w.full===2&&!S.scratch){p.x=gap;p.y=work.y+gap;p.w=work.w-2*gap;p.h=work.h-2*gap;p.z=40}}
  $('#scrim').classList.toggle('on',S.scratch);
  const holder=$('#wins');
  const dying=new Set(S.dying);S.dying=[];
  for(const[id,el]of winEls)if(!want.has(id)){winEls.delete(id);if(dying.has(id)){el.classList.add('dying');setTimeout(()=>el.remove(),180)}else el.remove()}
  const slide=S.slideDir;S.slideDir=0;
  for(const[id,p]of want){const w=W(id);let el=winEls.get(id);
    if(!el){el=document.createElement('div');el.className='win';holder.appendChild(el);winEls.set(id,el);
      el.classList.add(w.born?'born':slide>0?'slideR':slide<0?'slideL':'born');w.born=false;
      el.addEventListener('animationend',()=>el.classList.remove('born','slideL','slideR'),{once:true});
      if(!REDUCED){el.style.transition='none';requestAnimationFrame(()=>{el.style.transition=''})}}
    const isFloat=p.z>=30&&p.z<40||p.z===45||p.z===62;
    el.classList.toggle('focus',id===f);el.classList.toggle('float',isFloat);el.classList.toggle('transp',!!w.transp);
    Object.assign(el.style,{left:p.x+'px',top:p.y+'px',width:Math.max(8,p.w)+'px',height:Math.max(8,p.h)+'px',zIndex:p.z+(id===f?1:0)});
    const sl=p.slot;const tabs=sl&&sl.grouped?`<div class="tabs">${sl.wins.map((x,i)=>`<span class="${i===sl.active?'on':''}">${esc(APPS[W(x).app].label)}</span>`).join('')}</div>`:'';
    const badges=[w.fake?'⛶ inside':'',w.pseudo?'pseudo':'',S.pinned.includes(id)?'◆ sticky':'',w.full===1?'full screen':w.full===2?'full width':''].filter(Boolean);
    const sig=w.app+'|'+tabs+'|'+badges.join(',');
    if(el._sig!==sig){el._sig=sig;el.innerHTML=`${tabs}<div class="wbody">${APPS[w.app].body(w)}${badges.length?`<div class="badges">${badges.map(b=>`<span>${b}</span>`).join('')}</div>`:''}</div>`}}
  $('#wm').hidden=want.size>0;
  // bar
  const bar=$('#bar');bar.classList.toggle('off',!showBar);
  const occ=n=>S.ws[n].slots.length+S.ws[n].floats.length>0;
  const now=new Date();const hh=String(now.getHours()).padStart(2,'0'),mm=String(now.getMinutes()).padStart(2,'0');
  bar.innerHTML=`<div class="wss">${[1,2,3,4].map(n=>`<span class="${n===S.cur?'now':''} ${occ(n)?'occ':''}">${n}</span>`).join('')}${S.ws.S.slots.length+S.ws.S.floats.length?`<span class="scr">S</span>`:''}</div>
    <div class="clock">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()]} ${hh}:${mm}</div>
    <div class="tray"><span class="${S.ws[S.cur].layout==='scrolling'?'hot':''}">${S.ws[S.cur].layout}</span><span>${S.silent?'🔕':'◉'}</span><span>≋</span><span>♪</span><span>82%</span></div>`;
  // notifications
  $('#notifs').innerHTML=S.notifs.map(n=>`<div class="notif"><b>${esc(n.title)}</b>${esc(n.body)}</div>`).join('');
  // overlays
  const ov=$('#ovl');const k=S.overlay;
  if(!k)ov.innerHTML='';
  else if(k==='lock')ov.innerHTML=`<div class="lock"><div><div class="big">${hh}:${mm}</div><div class="pw">••••••</div><p class="small">Esc or Return to unlock (simulated)</p></div></div>`;
  else if(k.startsWith('panel-')){const n=k.slice(6);ov.innerHTML=`<div class="ov panel"><h4>${n}</h4>${PANELS[n].map(([a,b])=>`<div class="row"><span>${a}</span><span class="dm">${typeof b==='function'?b():b}</span></div>`).join('')}</div>`}
  else{const o=OV[k];let inner='';
    if(o.grid)inner=`<div class="grid">${o.grid.map(e=>`<span>${e}</span>`).join('')}</div>`;
    else inner=`${o.input?`<div class="in">${esc(o.input)}<span class="cur"></span></div>`:''}<ul>${o.items().map((it,i)=>Array.isArray(it)?`<li class="${i===S.ovIdx?'sel':''}"><span>${esc(it[0])}</span><span>${caps(it[1])}</span></li>`:`<li class="${i===S.ovIdx?'sel':''}">${esc(it)}</li>`).join('')}</ul>`;
    ov.innerHTML=`<div class="ov"><h4>${esc(o.t)}</h4>${inner}</div>`}
}

export { measure, renderScreen, showOsd };
