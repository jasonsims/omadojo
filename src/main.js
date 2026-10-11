import { $, esc, shuffle } from './lib/util.js';
import { canon, caps, capsAll, keyName, MODCODE, MODS, plain } from './lib/keys.js';
import { CFG, P, resetProgress, saveCfg, saveProg, setTheme, THEMES } from './config.js';
import { APPS } from './model/apps.js';
import { effects, focusId, fresh, notify, openApp, osd, S, W } from './model/desktop.js';
import { floatRect, setAspect, tileRects } from './model/layout.js';
import { ACTS, BIND, DECKS, runAction } from './actions/act.js';
import { prep } from './actions/ensure.js';
import { OV, ovNav, PANELS } from './actions/overlays.js';
import './actions/index.js';

/* ---------- themes ---------- */
function applyTheme(id){id=setTheme(id);const r=document.documentElement;
  if(id==='auto')r.removeAttribute('data-om');else r.setAttribute('data-om',id);
  $('#bTheme').textContent='Theme: '+THEMES.find(t=>t[0]===id)[1]}

/* ---------- rendering the screen ---------- */
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

/* ---------- keycast & mods ---------- */
const castLog=[];
function cast(combo,label,bad){castLog.unshift({combo,label,bad});castLog.length=Math.min(castLog.length,4);
  $('#cast').innerHTML=castLog.map(c=>`<span class="ev">${caps(c.combo)}<span class="lbl${c.bad?' bad':''}">${esc(c.label)}</span></span>`).join('');
  freeLog.unshift({combo,label,bad});freeLog.length=Math.min(freeLog.length,14);if(CFG.mode==='free')renderCoach()}
const freeLog=[];
const held=new Set();
function mods(){const m=new Set();for(const c of held){if(c===CFG.standin){m.add('super');continue}const k=MODCODE[c];if(k)m.add(k)}return m}
function renderMods(){const m=mods();document.querySelectorAll('#mods span').forEach(s=>s.classList.toggle('on',m.has(s.dataset.m)))}
function prune(e){const drop=(codes,flag)=>{if(!flag)codes.forEach(c=>{if(c!==CFG.standin)held.delete(c)})};
  drop(['ShiftLeft','ShiftRight'],e.shiftKey);drop(['ControlLeft','ControlRight'],e.ctrlKey);drop(['AltLeft','AltRight'],e.altKey);drop(['MetaLeft','MetaRight','OSLeft','OSRight'],e.metaKey)}

/* ---------- sound ---------- */
let AC=null;
function beep(ok){if(!CFG.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();
  o.type=ok?'triangle':'square';const t=AC.currentTime;o.frequency.setValueAtTime(ok?660:150,t);if(ok)o.frequency.exponentialRampToValueAtTime(1320,t+.08);
  g.gain.setValueAtTime(ok?.08:.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+(ok?.14:.18));o.connect(g).connect(AC.destination);o.start(t);o.stop(t+.2)}catch(e){}}

/* ---------- pressing a combo ---------- */
function press(combo,src){
  if(S.overlay&&['up','down','return','escape'].includes(combo)){ovNav(combo);cast(combo,combo==='escape'?'Close':combo==='return'?'Select':'Move',false);after(combo,null);renderScreen();return true}
  const a=BIND[combo];
  if(!a){if(combo.includes('super')){cast(combo,'not bound in Omarchy',true);after(combo,null);return true}stray(combo);return false}
  runAction(a);cast(combo,a.label,false);after(combo,a);renderScreen();return true}

/* ---------- coach engines ---------- */
const D={item:null,t0:0,revealed:false,missed:false,cool:false,streak:0,right:0,tries:0,last:[],fb:'',fbc:'',tip:false,opts:null,timers:[],blitz:null,wrongOpt:null};
const L={lesson:null,step:0,note:'',fb:'',opts:null,done:false};
function clearTimers(){D.timers.forEach(clearTimeout);D.timers=[];clearInterval(D.tick)}
const askText=a=>typeof a.ask==='function'?a.ask():a.ask;
function poolActs(){const p=ACTS.filter(a=>a.drill&&a.ask&&CFG.decks.includes(a.deck));return p.length?p:ACTS.filter(a=>a.drill&&a.ask&&a.deck==='basics')}
function pick(){let pool=poolActs().filter(a=>!D.last.includes(a.id));if(!pool.length)pool=poolActs();const ws=pool.map(a=>{const p=P(a.id);return Math.pow(6-p.l,2)+(p.n===0?6:0)});
  let r=Math.random()*ws.reduce((a,b)=>a+b,0);for(let i=0;i<pool.length;i++){r-=ws[i];if(r<=0)return pool[i]}return pool[pool.length-1]}
function distractors(keys,deck){const others=ACTS.filter(a=>a.keys[0]!==keys[0]&&!keys.includes(a.keys[0])&&a.keys[0].includes('super'));
  const same=shuffle(others.filter(a=>a.deck===deck)),rest=shuffle(others);const out=[];for(const a of[...same,...rest]){if(out.length>=3)break;if(!out.includes(a.keys[0]))out.push(a.keys[0])}return out}
function nextPrompt(){clearTimers();if(D.blitz&&D.blitz.done)return;const a=pick();D.last=[a.id,...D.last].slice(0,3);
  if(a.ensure)a.ensure();else prep();
  D.item=a;D.ask=askText(a);D.t0=performance.now();D.missed=false;D.cool=false;D.fb='';D.fbc='';D.wrongOpt=null;
  const lvl=P(a.id).l;const delay=D.blitz?2500:lvl<2?0:lvl<4?3000:6000;D.revealed=delay===0;D.hintMs=delay;
  if(delay)D.timers.push(setTimeout(()=>{D.revealed=true;renderCoach()},delay));
  D.opts=shuffle([a.keys[0],...distractors(a.keys,a.deck)]);
  if(D.blitz)D.tick=setInterval(blitzTick,100);
  renderScreen();renderCoach()}
function success(){const a=D.item,ms=Math.round(performance.now()-D.t0),p=P(a.id);p.n++;
  if(!D.missed){p.ok++;if(!D.revealed||p.l<2)p.l=Math.min(5,p.l+1)}p.ms=p.ms?Math.round(p.ms*.6+ms*.4):ms;saveProg();
  D.right++;D.streak++;D.tries++;beep(true);D.cool=true;D.tip=false;
  if(D.blitz){const B=D.blitz;B.streak++;B.right++;B.mult=Math.min(4,1+Math.floor(B.streak/5));const pts=Math.round((100+Math.max(0,100-ms/30))*B.mult);B.score+=pts;B.times.push([a.id,ms]);D.fb=`+${pts}`;}
  else D.fb=`✓ ${(ms/1000).toFixed(2)}s${D.revealed&&!D.missed?' · with hint':''}`;
  D.fbc='ok';clearTimers();if(D.blitz)D.tick=setInterval(blitzTick,100);renderCoach();
  D.timers.push(setTimeout(nextPrompt,D.blitz?260:650))}
function miss(label,combo){const a=D.item,p=P(a.id);if(!D.missed){p.l=Math.max(0,p.l-1);p.n++;saveProg()}D.missed=true;D.revealed=true;D.streak=0;D.tries++;beep(false);
  if(D.blitz){D.blitz.streak=0;D.blitz.mult=1;D.blitz.wrong++}
  D.fb=label?`That was ${label}. Try the keys shown.`:`${plain(combo)} isn't bound. Try the keys shown.`;D.fbc='bad';renderCoach()}
function stray(combo){// a plain key: did Super get lost on the way?
  const target=CFG.mode==='learn'&&L.lesson!=null?(LESSONS[L.lesson].steps[L.step]||{}).keys:D.item&&D.item.keys;if(!target)return;
  const last=combo.split('+').pop();if(target.some(k=>k.includes('super')&&k.split('+').pop()===last)){D.tip=true;L.fb='tip';renderCoach()}}
function after(combo,a){
  if(CFG.mode==='learn'&&L.lesson!=null&&!L.done){const st=LESSONS[L.lesson].steps[L.step];if(!st)return;
    if(st.keys.map(canon).includes(combo)){L.note=st.note||'';L.fb='';L.step++;beep(true);if(L.step>=LESSONS[L.lesson].steps.length){L.done=true;if(!CFG.done.includes(L.lesson)){CFG.done.push(L.lesson);saveCfg()}}
      else{const nx=LESSONS[L.lesson].steps[L.step];if(nx.pre){nx.pre();renderScreen()}}L.opts=null;renderCoach()}
    else if(a||combo.includes('super')){L.fb=a?`That was ${a.label}.`:`${plain(combo)} isn't bound.`;beep(false);renderCoach()}
    return}
  if((CFG.mode==='drill'||CFG.mode==='blitz')&&D.item&&!D.cool){
    if(a&&a.id===D.item.id)success();
    else if(D.item.keys.includes(combo))success();
    else if(a||combo.includes('super'))miss(a&&a.label,combo)}}

function blitzTick(){const B=D.blitz;if(!B)return;const left=Math.max(0,B.end-performance.now());const el=$('#bclock');if(el)el.textContent=(left/1000).toFixed(1);
  if(left<=0){clearTimers();B.done=true;D.item=null;if(B.score>CFG.best){CFG.best=B.score;B.newBest=true;saveCfg()}renderCoach()}}

/* ---------- lessons ---------- */
const LESSONS=[
 {t:'Tiling basics',d:'Open, stack, swap, float and close windows',setup:[],steps:[
  {say:'Open a terminal.',keys:['super+return'],note:'Every window opens tiled. No dragging, no overlapping.'},
  {say:'Open the browser next to it.',keys:['super+shift+return'],note:'Hyprland split the screen for you. Focus jumps to the new window.'},
  {say:'Stack the two windows on top of each other.',keys:['super+j']},
  {say:'Put them back side by side.',keys:['super+j'],note:'Super + J flips whichever split the focused window sits in.'},
  {say:'Swap the browser over to the left.',keys:['super+shift+left'],note:'Super + Shift + arrow swaps. Plain Super + arrow only moves focus.'},
  {say:'Move focus to the terminal on the right.',keys:['super+right']},
  {say:'Launch the activity monitor. It opens floating.',keys:['super+ctrl+t']},
  {say:'Tile it into the layout.',keys:['super+t'],note:'Super + T toggles any window between tiled and floating.'},
  {say:'Open the file manager for a four-way split.',keys:['super+shift+f'],note:'Each new window splits the focused one. That spiral is the dwindle layout.'},
  {say:'Close the focused window.',keys:['super+w','super+q'],note:'Super + W and Super + Q both close. Pick whichever your hand finds first.'}]},
 {t:'Workspaces',d:'Spread work across 1 to 4, plus the scratchpad',setup:['terminal','browser'],steps:[
  {say:'Send the browser to workspace 2. You follow it.',keys:['super+shift+2']},
  {say:'Jump back to workspace 1.',keys:['super+1'],note:'Workspaces are just Super + number. Watch the bar at the top left.'},
  {say:'Send the terminal to workspace 3 without following it.',keys:['super+alt+shift+3'],note:'Adding Alt keeps you where you are.'},
  {say:'Hop to the next workspace.',keys:['super+tab']},
  {say:'Jump back to the workspace you were just on.',keys:['super+ctrl+tab']},
  {say:'Drop down the scratchpad.',keys:['super+s','super+backquote'],note:'The scratchpad slides over whatever workspace you are on, like a Quake console.'},
  {say:'Open a terminal on it.',keys:['super+return']},
  {say:'Hide the scratchpad again.',keys:['super+s','super+backquote'],note:'Your scratchpad terminal keeps running in the background. The S in the bar marks it.'}]},
 {t:'Big, small, floating',d:'Full screen, sticky windows and the scrolling layout',setup:['terminal','browser'],steps:[
  {say:'Make the browser full screen.',keys:['super+f']},
  {say:'Leave full screen.',keys:['super+f']},
  {say:'Go full width, keeping the top bar.',keys:['super+alt+f']},
  {say:'Back to normal.',keys:['super+alt+f']},
  {say:'Pop the browser out as a sticky floating window.',keys:['super+o'],note:'Popped windows follow you across workspaces. Great for a video.'},
  {say:'Go to workspace 2.',keys:['super+2'],note:'The popped window came along.'},
  {say:'Come back to workspace 1.',keys:['super+1']},
  {say:'Put the popped window back into the tiling.',keys:['super+o']},
  {say:'Switch this workspace to the scrolling layout.',keys:['super+l'],note:'Windows now line up in a strip that runs past the screen edge.'},
  {say:'Open another terminal.',keys:['super+return']},
  {say:'Move focus left along the strip.',keys:['super+left'],note:'The strip scrolls to keep focus in view.'},
  {say:'Back to dwindle.',keys:['super+l']}]},
 {t:'Groups',d:'Stack windows as tabs in one tile',setup:['terminal','browser'],steps:[
  {say:'Turn the browser into a group.',keys:['super+g']},
  {say:'Open a terminal. It joins the group as a tab.',keys:['super+return']},
  {say:'Switch to the previous tab.',keys:['super+ctrl+left']},
  {say:'Switch to the next tab.',keys:['super+ctrl+right']},
  {say:'Cycle through the tabs.',keys:['super+alt+tab']},
  {say:'Pull this window out of the group.',keys:['super+alt+g']},
  {say:'Focus the group on the left.',keys:['super+left']},
  {say:'Break the group apart.',keys:['super+g']}]},
 {t:'Menus & system',d:'The Omarchy menu, themes, clipboard, notifications',setup:['terminal'],steps:[
  {say:'Open the Omarchy menu.',keys:['super+space'],note:'Almost everything lives in here. Arrow keys move, Return picks.'},
  {say:'Close it.',keys:['escape']},
  {say:'Show the keybindings cheat sheet.',keys:['super+k']},
  {say:'Close it.',keys:['escape']},
  {say:'Open the system menu.',keys:['super+escape']},
  {say:'Close it.',keys:['escape']},
  {say:'Open the theme picker.',keys:['super+ctrl+shift+space']},
  {say:'Move down one theme.',keys:['down']},
  {say:'Apply it.',keys:['return'],note:'That really changed this page. Omarchy restyles the whole system the same way.'},
  {say:'Copy. It works in terminals too.',keys:['super+c'],note:'Omarchy unifies copy and paste so the terminal needs no Shift.'},
  {say:'Open the clipboard history.',keys:['super+ctrl+v']},
  {say:'Close it.',keys:['escape']},
  {say:'Dismiss the latest notification.',keys:['super+comma'],pre:()=>{const s=S.silent;S.silent=false;notify('Calendar','Standup in 5 minutes');S.silent=s}},
  {say:'Lock the computer.',keys:['super+ctrl+l']},
  {say:'Unlock it.',keys:['escape','return']}]},
];
function startLesson(i){clearTimers();L.lesson=i;L.step=0;L.note='';L.fb='';L.done=false;D.tip=false;fresh();LESSONS[i].setup.forEach(a=>openApp(a));
  const st=LESSONS[i].steps[0];if(st.pre)st.pre();renderScreen();renderCoach()}

/* ---------- coach rendering ---------- */
const blocks=(f,n=20)=>'█'.repeat(Math.round(f*n))+'░'.repeat(n-Math.round(f*n));
const mast=l=>`<span class="mast" title="Level ${l} of 5">${[1,2,3,4,5].map(i=>`<i class="${l>=i?'on':''}">${'▁▂▃▅▇'[i-1]}</i>`).join('')}</span>`;
const tipHTML=()=>`<p class="fb tip">Super didn't reach the page. Your OS grabbed it. Try <b>Lock keys</b> or pick a stand-in in <b>Key setup</b>.</p>`;
function optsHTML(opts,correct){return `<div class="opts">${opts.map(o=>`<button class="opt${D.wrongOpt===o?' wrong':''}" data-opt="${o}">${caps(o)}</button>`).join('')}</div>`}
function renderCoach(){const c=$('#coach');const m=CFG.mode;let h='';
  document.querySelectorAll('#modes button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===m));
  if(m==='learn'){
    if(L.lesson==null){h=`<div class="chead"><span class="eyebrow">Learn</span><span class="small">${CFG.done.length}/${LESSONS.length} done</span></div><div class="cbody">
      <p class="sub">Short guided runs that follow the Navigation chapter of the Omarchy manual. Each step shows the keys. Do them on the fake desktop.</p>
      <div class="lessons">${LESSONS.map((l,i)=>`<button class="lesson" data-lesson="${i}"><span class="n">${i+1}</span><span class="t">${l.t}<span class="d">${l.d} · ${l.steps.length} steps</span></span><span class="ck">${CFG.done.includes(i)?'done':''}</span></button>`).join('')}</div></div>`}
    else{const Ls=LESSONS[L.lesson];
      if(L.done){h=`<div class="chead"><span class="eyebrow">Lesson ${L.lesson+1} · ${Ls.t}</span></div><div class="cbody"><p class="ask">Lesson done.</p>${L.note?`<p class="note">${L.note}</p>`:''}
        <p class="sub">Drill mode will keep these in rotation until they stick.</p><div class="row2">${L.lesson+1<LESSONS.length?`<button class="btn pri" data-lesson="${L.lesson+1}">Next: ${LESSONS[L.lesson+1].t}</button>`:''}<button class="btn" data-go="drill">Drill these</button><button class="btn" data-back>All lessons</button></div></div>`}
      else{const st=Ls.steps[L.step];const opts=L.opts||(L.opts=shuffle([st.keys[0],...distractors(st.keys,'basics')]));
        h=`<div class="chead"><span class="eyebrow">Lesson ${L.lesson+1} · ${Ls.t}</span><button class="btn" data-back>All lessons</button></div><div class="cbody">
        ${hostWarn()}<div class="prog"><span class="blk">${blocks(L.step/Ls.steps.length,16)}</span><span>${L.step+1}/${Ls.steps.length}</span></div>
        ${L.note?`<p class="note">${L.note}</p>`:''}
        <p class="ask">${st.say}</p>
        ${CFG.input==='taps'?optsHTML(st.keys.length?opts:[]):`<div class="keys">${capsAll(st.keys.map(canon))}</div>`}
        ${L.fb==='tip'?tipHTML():`<p class="fb bad">${esc(L.fb||'')}</p>`}
        <div class="row2"><button class="btn" data-restart>Restart lesson</button></div></div>`}}}
  else if(m==='drill'){const a=D.item;const total=ACTS.filter(x=>x.drill&&x.ask).length;const locked=ACTS.filter(x=>x.drill&&x.ask&&P(x.id).l>=4).length;
    h=`<div class="chead"><span class="eyebrow">Drill</span><span class="small">streak <b>${D.streak}</b> · ${D.tries?Math.round(D.right/D.tries*100):100}% right</span></div><div class="cbody">
      ${hostWarn()}<div class="chips">${Object.entries(DECKS).map(([k,v])=>`<button class="chip" data-deck="${k}" aria-pressed="${CFG.decks.includes(k)}">${v}</button>`).join('')}</div>
      ${a?`<p class="ask">${esc(D.ask)}</p>
      ${CFG.input==='taps'?optsHTML(D.opts):`<div class="keys${D.revealed?'':' veil'}">${capsAll(a.keys)}</div>${!D.revealed&&D.hintMs?`<div class="hint"><i style="animation-duration:${D.hintMs}ms"></i></div>`:''}`}
      ${D.tip&&!D.fb?tipHTML():`<p class="fb ${D.fbc}">${esc(D.fb)}</p>`}
      ${a.os?`<p class="os">${a.os}</p>`:''}
      <div class="row2"><span class="small">Level</span>${mast(P(a.id).l)}<button class="btn" data-skip style="margin-left:auto">Skip</button></div>`:''}
      <div class="meter"><span>Locked in ${locked} of ${total} shortcuts</span><span class="blk">${blocks(locked/total,24)}</span></div>
      <p class="small">Keys stay hidden once you know them. Get one wrong and it drops a level and comes back sooner.</p></div>`}
  else if(m==='blitz'){const B=D.blitz;
    if(!B||B.done){const res=B&&B.done;let slow='';
      if(res&&B.times.length){const by={};B.times.forEach(([id,ms])=>{(by[id]=by[id]||[]).push(ms)});slow=Object.entries(by).map(([id,v])=>[id,v.reduce((a,b)=>a+b)/v.length]).sort((a,b)=>b[1]-a[1]).slice(0,3)
        .map(([id,ms])=>{const x=ACTS.find(a=>a.id===id);return `<div class="krow"><span>${x.label}</span><span class="small">${(ms/1000).toFixed(2)}s</span><span class="kk">${caps(x.keys[0])}</span></div>`}).join('')}
      h=`<div class="chead"><span class="eyebrow">Blitz · 60 seconds</span><span class="small">best <b>${CFG.best}</b></span></div><div class="cbody">
      ${res?`<div class="blitzhead"><div><span class="small">${B.newBest?'New best':'Score'}</span><div class="big">${B.score}</div></div><div class="small">${B.right} right · ${B.wrong} wrong</div></div>${slow?`<div><p class="sub" style="margin-bottom:4px">Slowest this run</p>${slow}</div>`:''}`
      :`<p class="ask">How many can you land in a minute?</p><p class="sub">Uses your Drill decks. Faster answers score more, and every 5 in a row raises the multiplier up to ×4. A miss resets it.</p>`}
      <div class="row2"><button class="btn pri" data-blitz>${res?'Go again':'Start'}</button></div>
      <div class="chips">${Object.entries(DECKS).map(([k,v])=>`<button class="chip" data-deck="${k}" aria-pressed="${CFG.decks.includes(k)}">${v}</button>`).join('')}</div></div>`}
    else{const a=D.item;h=`<div class="chead"><span class="eyebrow">Blitz</span><span class="mult">×${B.mult}</span></div><div class="cbody">
      <div class="blitzhead"><div><span class="small">Score</span><div class="big">${B.score}</div></div><div style="text-align:right"><span class="small">Left</span><div class="big" id="bclock">${Math.max(0,(B.end-performance.now())/1000).toFixed(1)}</div></div></div>
      ${a?`<p class="ask">${esc(D.ask)}</p>${CFG.input==='taps'?optsHTML(D.opts):`<div class="keys${D.revealed?'':' veil'}">${capsAll(a.keys)}</div>${!D.revealed?`<div class="hint"><i style="animation-duration:${D.hintMs}ms"></i></div>`:''}`}`:''}
      <p class="fb ${D.fbc}">${esc(D.fb)}</p></div>`}}
  else if(m==='free'){h=`<div class="chead"><span class="eyebrow">Free play</span><button class="btn" data-resetdesk>Reset desktop</button></div><div class="cbody">
      <p class="sub">No prompts. Drive the desktop however you like and watch what each shortcut does. Super + K shows the cheat sheet inside the screen.</p>
      ${CFG.input==='taps'?`<p class="fb tip">Free play needs a keyboard. Switch to Learn or Drill to practise by tapping.</p>`:''}
      <div class="log">${freeLog.length?freeLog.map(l=>`<div>${caps(l.combo)}<span class="${l.bad?'fb bad':'small'}">${esc(l.label)}</span></div>`).join(''):'<span class="small">Try Super + Return, then Super + Shift + Return.</span>'}</div></div>`}
  else if(m==='keys'){const q=(D.q||'').toLowerCase();
    h=`<div class="chead"><span class="eyebrow">Keys</span><span class="small">Super + K in Omarchy</span></div><div class="cbody">
      <input class="ksearch" id="ksearch" placeholder="Filter: workspace, float, theme…" value="${esc(D.q||'')}" aria-label="Filter shortcuts">
      <div class="klist">${Object.entries(DECKS).map(([k,v])=>{const rows=ACTS.filter(a=>a.deck===k&&(!q||a.label.toLowerCase().includes(q)||plain(a.keys[0]).toLowerCase().includes(q)||(a.ask&&askText(a).toLowerCase().includes(q))));
        return rows.length?`<div class="kgroup"><h5>${v}</h5>${rows.map(a=>`<div class="krow"><span>${esc(a.label)}${a.os?' <span class="os">*</span>':''}</span>${a.drill&&a.ask?mast(P(a.id).l):'<span></span>'}<span class="kk">${capsAll(a.keys)}</span></div>`).join('')}</div>`:''}).join('')}</div>
      <p class="small"><span class="os">*</span> often grabbed by Windows or macOS. Lock keys helps.</p></div>`}
  c.innerHTML=h;
  const say=m==='learn'&&L.lesson!=null&&!L.done?(LESSONS[L.lesson].steps[L.step]||{}).say:(m==='drill'||m==='blitz')&&D.item?D.ask:'';
  if(say&&$('#live').textContent!==say)$('#live').textContent=say;
  if(m==='keys'){const s=$('#ksearch');s.addEventListener('input',e=>{D.q=e.target.value;const pos=e.target.selectionStart;renderCoach();const n=$('#ksearch');n.focus();n.setSelectionRange(pos,pos)})}
}

/* ---------- mode switching ---------- */
function setMode(m){clearTimers();CFG.mode=m;saveCfg();D.item=null;D.fb='';D.tip=false;
  if(m==='drill'){D.blitz=null;nextPrompt();return}
  if(m==='blitz'){D.blitz=null}
  if(m==='learn'&&L.lesson==null){}
  renderScreen();renderCoach()}
function startBlitz(){fresh();openApp('terminal');openApp('browser');D.blitz={end:performance.now()+60000,score:0,mult:1,streak:0,right:0,wrong:0,times:[]};D.last=[];nextPrompt()}

/* ---------- events ---------- */
$('#modes').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.mode)});
$('#coach').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
  if(t.dataset.lesson!=null){startLesson(+t.dataset.lesson);return}
  if(t.hasAttribute('data-back')){L.lesson=null;renderCoach();return}
  if(t.hasAttribute('data-restart')){startLesson(L.lesson);return}
  if(t.dataset.go){setMode(t.dataset.go);return}
  if(t.dataset.deck){const k=t.dataset.deck;CFG.decks=CFG.decks.includes(k)?CFG.decks.filter(x=>x!==k):[...CFG.decks,k];if(!CFG.decks.length)CFG.decks=[k];saveCfg();
    if(CFG.mode==='drill'){D.last=[];nextPrompt()}else renderCoach();return}
  if(t.hasAttribute('data-skip')){D.streak=0;nextPrompt();return}
  if(t.hasAttribute('data-blitz')){startBlitz();return}
  if(t.hasAttribute('data-setup')){openSetup(true);return}
  if(t.hasAttribute('data-resetdesk')){fresh();openApp('terminal');renderScreen();return}
  if(t.dataset.opt){const o=t.dataset.opt;
    if(CFG.mode==='learn'&&L.lesson!=null){const st=LESSONS[L.lesson].steps[L.step];if(st.keys.map(canon).includes(o)){if(S.overlay&&['up','down','return','escape'].includes(o)){press(o)}else if(BIND[o])press(o);else after(o,null)}
      else{L.fb=`That's ${plain(o)}. Look again.`;beep(false);renderCoach()}return}
    if(D.item&&!D.cool){if(D.item.keys.includes(o))press(o);else{D.wrongOpt=o;const a=BIND[o];miss(a&&a.label,o)}}}});
$('#bTheme').addEventListener('click',()=>{const i=THEMES.findIndex(t=>t[0]===CFG.theme);applyTheme(THEMES[(i+1)%THEMES.length][0])});
$('#bSound').addEventListener('click',()=>{CFG.sound=!CFG.sound;saveCfg();$('#bSound').textContent=CFG.sound?'Sound on':'Sound off'});
function openSetup(on){const s=$('#setup');s.hidden=!on;$('#bSetup').classList.toggle('on',on);if(on)s.scrollIntoView({block:'nearest'})}
$('#bSetup').addEventListener('click',()=>openSetup($('#setup').hidden));
$('#bLock').addEventListener('click',async()=>{const b=$('#bLock');
  if(document.fullscreenElement){try{navigator.keyboard&&navigator.keyboard.unlock()}catch(e){}document.exitFullscreen().catch(()=>{});return}
  try{await document.documentElement.requestFullscreen();if(navigator.keyboard&&navigator.keyboard.lock){await navigator.keyboard.lock();host.keylock=true;renderCoach();osd('Keys locked · hold Esc to exit')}else osd('Fullscreen. This browser cannot lock keys; use Chrome, Edge or Brave.');renderScreen()}
  catch(e){osd('Fullscreen blocked here. Open the page in its own browser tab.')}});
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;if(!on)host.keylock=false;$('#bLock').textContent=on?'Unlock keys':'Lock keys';$('#bLock').classList.toggle('on',on);setTimeout(()=>{measure();renderScreen()},60)});

const PLAT=(()=>{const p=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||'';return /mac|iphone|ipad/i.test(p)?'mac':/win/i.test(p)?'win':'linux'})();
const STANDINS=PLAT==='mac'?[[null,'None (real ⌘)'],['AltRight','Right Option'],['ControlRight','Right Ctrl'],['capture','Press a key…']]
  :[[null,'None (real Super)'],['CapsLock','Caps Lock'],['ControlRight','Right Ctrl'],['AltRight','Right Alt'],['capture','Press a key…']];
const PLAT_NOTE={mac:'On a Mac, ⌘ is Super, but ⌘W closes this tab, ⌘Q quits the browser and ⌘Space opens Spotlight. Use Right Option as a stand-in.',
  win:'On Windows, Win + L locks your PC and Windows keeps Win + Tab, Win + D and friends. Use Caps Lock or Right Ctrl as a stand-in.',
  linux:'On Omarchy, Hyprland acts on Super combos for real. Use Lock keys, or a stand-in like Caps Lock.'}[PLAT];
// keylock: navigator.keyboard.lock() is on. capturing: Key setup waits for a stand-in key.
const host={keylock:false,capturing:false};
function hostWarn(){if(CFG.standin||host.keylock||PLAT==='linux'||CFG.input==='taps')return'';
  return `<p class="fb tip">${PLAT==='mac'?'Using real ⌘: ⌘W and ⌘Q can close the browser.':'Using the real Win key: Win + L will lock your PC.'} <button class="btn" data-setup>Pick a stand-in</button></p>`}
function renderSetup(){$('#standinSeg').innerHTML=STANDINS.map(([c,l])=>`<button class="btn" data-si="${c}" aria-pressed="${host.capturing?c==='capture':(CFG.standin===c||(!STANDINS.some(s=>s[0]===CFG.standin)&&c==='capture'&&CFG.standin))}">${c==='capture'&&CFG.standin&&!STANDINS.slice(0,4).some(s=>s[0]===CFG.standin)?'Custom: '+esc(CFG.standin):l}</button>`).join('');
  $('#platNote').textContent=PLAT_NOTE;
  $('#standinNote').textContent=host.capturing?'Press the key you want to use as Super…':CFG.standin?`While you hold ${(STANDINS.find(x=>x[0]===CFG.standin)||[0,CFG.standin])[1]}, it counts as Super.${CFG.standin==='AltRight'&&PLAT!=='mac'?' On some layouts Right Alt is AltGr and also reports Ctrl.':''}`:'Using the real Super key.';
  document.querySelectorAll('#inputSeg .btn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.input===CFG.input))}
$('#standinSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.si;
  if(v==='capture'){host.capturing=true}else{host.capturing=false;CFG.standin=v==='null'?null:v;saveCfg()}held.clear();renderSetup();renderMods();renderCoach()});
$('#inputSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;CFG.input=b.dataset.input;saveCfg();renderSetup();renderCoach()});
let resetArm=false,firedWhileHeld=false,usedSuper=false;
$('#bReset').addEventListener('click',()=>{const b=$('#bReset');if(!resetArm){resetArm=true;b.textContent='Click again to erase';setTimeout(()=>{resetArm=false;b.textContent='Reset progress'},3000);return}
  resetProgress();resetArm=false;b.textContent='Progress erased';renderCoach()});

window.addEventListener('keydown',e=>{
  if(host.capturing){e.preventDefault();host.capturing=false;CFG.standin=e.code||null;saveCfg();held.clear();renderSetup();renderCoach();return}
  const inField=e.target&&e.target.closest&&e.target.closest('input,textarea');
  const code=e.code;
  if(MODCODE[code]||code===CFG.standin){held.add(code);renderMods();if(code===CFG.standin||MODCODE[code]==='super')e.preventDefault();return}
  prune(e);renderMods();
  const m=mods();if(inField&&!m.has('super'))return;
  const key=keyName(e);if(!key)return;
  const combo=[...MODS.filter(x=>m.has(x)),key].join('+');
  if(e.repeat){if(m.has('super')||BIND[combo])e.preventDefault();return}
  if(CFG.input==='taps'&&m.has('super')){CFG.input='keys';saveCfg();renderSetup();renderCoach()}
  const handled=press(combo,'key');
  if(handled)firedWhileHeld=true;
  if(m.has('super'))usedSuper=true;
  if(handled||m.has('super'))e.preventDefault();
},true);
window.addEventListener('keyup',e=>{held.delete(e.code);if(e.code===CFG.standin||(firedWhileHeld&&MODCODE[e.code]))e.preventDefault();prune(e);if(!mods().size)firedWhileHeld=false;renderMods()},true);
window.addEventListener('blur',()=>{held.clear();renderMods()});
window.addEventListener('beforeunload',e=>{if(PLAT==='mac'&&!CFG.standin&&usedSuper){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',()=>{held.clear();renderMods()});
new ResizeObserver(()=>{measure();renderScreen()}).observe($('#screen'));
setInterval(()=>{if(!S.overlay||S.overlay==='lock')renderScreen()},30000);

/* ---------- boot ---------- */
Object.assign(effects,{osd:showOsd,render:renderScreen,theme:applyTheme});
applyTheme(CFG.theme);
if(!CFG.seenSetup){CFG.seenSetup=true;saveCfg();if(!matchMedia('(pointer:coarse)').matches)openSetup(true)}$('#bSound').textContent=CFG.sound?'Sound on':'Sound off';renderSetup();
measure();
openApp('terminal');openApp('browser');openApp('btop');
notify('Welcome to Omadojo','Hold Super and press K for the cheat sheet.',9000);
if(CFG.mode==='drill')setMode('drill');else{if(CFG.mode==='blitz')D.blitz=null;renderScreen();renderCoach()}
if(location.hash==='#debug')window.__od={S:()=>S,press,ACTS,BIND,setMode,startLesson,D,L,lessons:LESSONS.length,lessonKey:()=>{const st=L.lesson!=null&&LESSONS[L.lesson].steps[L.step];return st?canon(st.keys[0]):null}};
