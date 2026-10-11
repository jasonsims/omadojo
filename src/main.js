const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('omadojo.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
             set(k,v){try{localStorage.setItem('omadojo.'+k,JSON.stringify(v))}catch(e){}}};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

/* ---------- keys ---------- */
const MODS=['super','ctrl','alt','shift'];
function canon(s){const p=s.toLowerCase().split('+').map(x=>x.trim());return[...MODS.filter(m=>p.includes(m)),...p.filter(x=>!MODS.includes(x))].join('+')}
const KN={super:'Super',ctrl:'Ctrl',alt:'Alt',shift:'Shift',return:'Return',space:'Space',escape:'Esc',tab:'Tab',backspace:'Backspace',delete:'Delete',
  minus:'-',equal:'=',slash:'/',comma:',',period:'.',backquote:'`',left:'←',right:'→',up:'↑',down:'↓',home:'Home'};
const kname=k=>KN[k]||k.toUpperCase();
const caps=c=>c.split('+').map(k=>`<kbd class="kc${k==='super'?' sup':''}">${esc(kname(k))}</kbd>`).join('<i class="plus">+</i>');
const plain=c=>c.split('+').map(kname).join(' + ');
const capsAll=keys=>keys.map(caps).join('<span class="alt">or</span>');
const CODEKEY={Enter:'return',NumpadEnter:'return',Space:'space',Escape:'escape',Tab:'tab',Backspace:'backspace',Delete:'delete',Minus:'minus',
  Equal:'equal',Slash:'slash',Comma:'comma',Period:'period',Backquote:'backquote',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',
  Home:'home',BracketLeft:'[',BracketRight:']',NumpadSubtract:'minus',NumpadAdd:'equal'};
const MODCODE={ShiftLeft:'shift',ShiftRight:'shift',ControlLeft:'ctrl',ControlRight:'ctrl',AltLeft:'alt',AltRight:'alt',MetaLeft:'super',MetaRight:'super',OSLeft:'super',OSRight:'super'};
function keyName(e){const c=e.code||'';
  if(/^Key[A-Z]$/.test(c))return c.slice(3).toLowerCase();
  if(/^Digit\d$/.test(c))return c.slice(5);
  if(/^Numpad\d$/.test(c))return c.slice(6);
  if(CODEKEY[c])return CODEKEY[c];
  if(e.key&&e.key.length===1)return e.key.toLowerCase();
  return null}

/* ---------- config & progress ---------- */
const CFG=Object.assign({theme:'auto',sound:true,standin:null,input:null,decks:['basics','tiling','workspaces'],mode:'learn',wp:0,best:0,done:[]},store.get('cfg',{}));
if(!CFG.input)CFG.input=matchMedia('(pointer:coarse)').matches?'taps':'keys';
const saveCfg=()=>store.set('cfg',CFG);
let PROG=store.get('prog',{});
const P=id=>PROG[id]||(PROG[id]={l:0,n:0,ok:0,ms:0});
const saveProg=()=>store.set('prog',PROG);

/* ---------- themes ---------- */
const THEMES=[['auto','System'],['tokyo-night','Tokyo Night'],['catppuccin','Catppuccin'],['gruvbox','Gruvbox'],['everforest','Everforest'],['nord','Nord'],
  ['rose-pine','Rosé Pine'],['kanagawa','Kanagawa'],['matte-black','Matte Black'],['catppuccin-latte','Catppuccin Latte'],['flexoki-light','Flexoki Light']];
function applyTheme(id){if(!THEMES.some(t=>t[0]===id))id='auto';CFG.theme=id;saveCfg();const r=document.documentElement;
  if(id==='auto')r.removeAttribute('data-om');else r.setAttribute('data-om',id);
  $('#bTheme').textContent='Theme: '+THEMES.find(t=>t[0]===id)[1]}

/* ---------- apps ---------- */
const CMDS=[['omarchy theme next','Theme set to Gruvbox'],['git status','On branch main, nothing to commit'],['hyprctl clients | wc -l','4'],
  ['yay -Syu','there is nothing to do'],['omarchy plugin list','omarchy.bar  enabled'],['ls ~/Work','dojo  notes  site'],['bin/dev','Puma starting on :3000']];
const term=(w,t)=>{const c=CMDS[w.id%CMDS.length];return `<div class="wtitle"><span>${t}</span><span>~/Work</span></div><div><span class="c1">~/Work</span> <span class="c2">❯</span> ${esc(c[0])}</div><div class="dm">${esc(c[1])}</div><div><span class="c1">~/Work</span> <span class="c2">❯</span> <span class="cur"></span></div>`};
const page=(url,extra='')=>()=>`<div class="url">${url}</div>${extra}<div class="sk h"></div><div class="sk"></div><div class="sk"></div><div class="sk s"></div><div class="sk"></div><div class="sk s"></div>`;
const APPS={
  terminal:{label:'Terminal',body:w=>term(w,'foot')},
  tmux:{label:'Tmux',body:w=>term(w,'tmux · 0:zsh*')},
  herdr:{label:'Herdr',body:w=>`<div class="wtitle"><span>herdr</span><span>agents</span></div><div><span class="c2">●</span> claude · fixing bar plugin</div><div><span class="c4">●</span> codex · waiting</div><div><span class="dm">●</span> opencode · idle</div>`},
  browser:{label:'Chromium',body:page('omarchy.org/manual/hotkeys')},
  private:{label:'Chromium (private)',body:page('<span class="c3">private</span> · new tab')},
  files:{label:'Files',body:()=>`<div class="wtitle"><span>Files</span><span>~/</span></div>${['Desktop','Documents','Downloads','Music','Pictures','Videos','Work'].map(f=>`<div><span class="c1">▸</span> ${f}</div>`).join('')}`},
  nvim:{label:'Neovim',body:()=>`<div><span class="c3">def</span> <span class="c1">tile</span>(windows)</div><div>&nbsp;&nbsp;windows.<span class="c4">dwindle!</span></div><div><span class="c3">end</span></div>${'<div class="dm">~</div>'.repeat(5)}<div class="nvst">NORMAL  dojo.rb</div>`},
  music:{label:'Spotify',body:()=>`<div class="wtitle"><span>Spotify</span><span>♫</span></div><div><b>Now playing</b></div><div class="dm">Tiling Dreams · The Workspaces</div><div class="sk" style="width:40%;background:var(--ok)"></div>`},
  btop:{label:'btop',float:true,body:()=>`<div class="wtitle"><span>btop</span><span>cpu 12%</span></div><div>cpu <span class="c2">▂▃▅▇▅▃▂▃▅▆</span></div><div>mem <span class="c4">▅▅▅▅▆▆▆▆▆▆</span></div><div>net <span class="c1">▁▁▂▁▃▁▁▂▁▁</span></div><div class="dm">proc hyprland 1.2%</div>`},
  passwords:{label:'1Password',float:true,body:()=>`<div class="wtitle"><span>1Password</span><span></span></div><div style="text-align:center;margin-top:1.2em">🔒<br>Unlock 1Password</div>`},
  calc:{label:'Calculator',float:true,body:()=>`<div style="text-align:right;font-size:1.4em">1337</div><div class="calcg">${'789÷456×123−0.=+'.split('').map(c=>`<span>${c}</span>`).join('')}</div>`},
  obsidian:{label:'Obsidian',body:()=>`<div class="wtitle"><span>Obsidian</span><span>vault</span></div><div class="c3"># Omarchy notes</div><div>- Super + J flips the split</div><div>- Super + S for scratchpad</div>`},
  email:{label:'HEY',body:page('app.hey.com/imbox')},
  calendar:{label:'HEY Calendar',body:page('app.hey.com/calendar')},
  chatgpt:{label:'ChatGPT',body:page('chatgpt.com')},
  grok:{label:'Grok',body:page('grok.com')},
  signal:{label:'Signal',body:()=>`<div class="wtitle"><span>Signal</span><span></span></div><div><span class="c1">Ana</span> did you try scrolling layout?</div><div><span class="c2">You</span> Super + L, love it</div>`},
  youtube:{label:'YouTube',body:page('youtube.com')},
  docker:{label:'LazyDocker',body:w=>`<div class="wtitle"><span>lazydocker</span><span></span></div><div><span class="c2">●</span> postgres  up 3h</div><div><span class="c2">●</span> redis     up 3h</div><div class="dm">○ mailcatcher</div>`},
  write:{label:'Omawrite',body:()=>`<div class="wtitle"><span>Omawrite</span><span>412 words</span></div><div>The trick is to stop reaching for the mouse.</div><div class="cur"></div>`},
  maps:{label:'Google Maps',body:page('maps.google.com')},
  photos:{label:'Google Photos',body:page('photos.google.com')},
  x:{label:'X',body:page('x.com/home')},
  whatsapp:{label:'WhatsApp',body:page('web.whatsapp.com')},
};

/* ---------- desktop state ---------- */
const mkWs=()=>({slots:[],floats:[],focus:null,layout:'dwindle',flips:{},ratios:{},colW:{},scroll:0});
let S,NID=1;
function fresh(){S={ws:{1:mkWs(),2:mkWs(),3:mkWs(),4:mkWs(),S:mkWs()},cur:1,prev:2,scratch:false,pinned:[],wins:{},
  bar:true,gaps:true,dfull:false,night:false,silent:false,zoom:1,overlay:null,ovIdx:0,notifs:[],hist:[],clip:['ssh-ed25519 AAAA…','https://omarchy.org/manual/','hl.bind("SUPER + J", …)'],slideDir:0,osd:''}}
fresh();
const curWs=()=>S.scratch?S.ws.S:S.ws[S.cur];
const tiled=ws=>ws.slots.map(sl=>sl.wins[sl.active]);
const slotOf=(ws,id)=>ws.slots.findIndex(sl=>sl.wins.includes(id));
function visibleIds(ws){return[...tiled(ws),...ws.floats,...(S.scratch?[]:S.pinned)]}
function focusId(){const ws=curWs();const v=visibleIds(ws);if(!v.includes(ws.focus))ws.focus=v.length?(tiled(ws).slice(-1)[0]??v[v.length-1]):null;return ws.focus}
function W(id){return S.wins[id]}

function openApp(app,o={}){
  const id=NID++;const w={id,app,full:0,fake:false,pseudo:false,transp:false};S.wins[id]=w;
  const ws=curWs();const f=focusId();
  Object.values(S.wins).forEach(x=>{if(x.full&&locate(x.id).ws===ws)x.full=0});
  if(APPS[app].float&&!o.tile){ws.floats.push(id)}
  else{const si=f!=null?slotOf(ws,f):-1;
    if(si>=0&&ws.slots[si].grouped&&!o.noGroup){const sl=ws.slots[si];sl.wins.push(id);sl.active=sl.wins.length-1}
    else ws.slots.splice(si>=0?si+1:ws.slots.length,0,{wins:[id],active:0,grouped:false})}
  ws.focus=id;w.born=true;return id}
function locate(id){for(const k of Object.keys(S.ws)){const ws=S.ws[k];const si=slotOf(ws,id);if(si>=0)return{ws,key:k,si};if(ws.floats.includes(id))return{ws,key:k,fl:true}}
  if(S.pinned.includes(id))return{pinned:true};return{}}
function detach(id){const L=locate(id);
  if(L.pinned){S.pinned.splice(S.pinned.indexOf(id),1);return L}
  if(!L.ws)return L;const ws=L.ws;
  if(L.fl)ws.floats.splice(ws.floats.indexOf(id),1);
  else{const sl=ws.slots[L.si];const i=sl.wins.indexOf(id);sl.wins.splice(i,1);
    if(!sl.wins.length)ws.slots.splice(L.si,1);else{sl.active=Math.min(sl.active,sl.wins.length-1);if(ws.focus===id)ws.focus=sl.wins[sl.active]}}
  if(ws.focus===id){const t=tiled(ws);ws.focus=t.length?t[Math.min(L.si??t.length-1,t.length-1)]:(ws.floats.slice(-1)[0]??null)}
  return L}
function closeWin(id){if(id==null)return false;detach(id);const el=winEls.get(id);if(el){el.classList.add('dying');winEls.delete(id);setTimeout(()=>el.remove(),180)}delete S.wins[id];return true}
function gotoWs(n){if(S.scratch){S.scratch=false}if(n===S.cur)return;S.slideDir=n>S.cur?1:-1;S.prev=S.cur;S.cur=n}
function moveTo(n,follow){const id=focusId();if(id==null||S.pinned.includes(id))return false;const L=detach(id);const t=S.ws[n];
  if(L.fl)t.floats.push(id);else t.slots.push({wins:[id],active:0,grouped:false});t.focus=id;W(id).full=0;
  if(follow){S.scratch=false;gotoWs(n)}return true}
function toScratch(){const id=focusId();if(id==null||S.scratch)return false;const L=detach(id);const t=S.ws.S;if(L.fl)t.floats.push(id);else t.slots.push({wins:[id],active:0,grouped:false});t.focus=id;return true}

/* geometry (normalized to the work area) */
let DIM={W:960,H:600,bar:22};
const AR=()=>DIM.W/Math.max(1,DIM.H-DIM.bar);
function tileRects(ws){const ids=tiled(ws),out={},orient={};
  if(ws.layout==='scrolling'){let x=0;const pos={};const cw=id=>ids.length===1?1:(ws.colW[id]||.6);
    ids.forEach(id=>{pos[id]=x;x+=cw(id)});const f=ws.focus;
    if(pos[f]!=null){if(pos[f]<ws.scroll)ws.scroll=pos[f];if(pos[f]+cw(f)>ws.scroll+1)ws.scroll=pos[f]+cw(f)-1}
    ws.scroll=Math.max(0,Math.min(ws.scroll,Math.max(0,x-1)));
    ids.forEach(id=>out[id]={x:pos[id]-ws.scroll,y:0,w:cw(id),h:1});return{rects:out,orient}}
  let r={x:0,y:0,w:1,h:1};const ar=AR();
  ids.forEach((id,i)=>{if(i===ids.length-1){out[id]=r;return}
    let side=r.w*ar>=r.h;if(ws.flips[i])side=!side;orient[i]=side?'h':'v';const k=ws.ratios[i]??.5;
    if(side){out[id]={x:r.x,y:r.y,w:r.w*k,h:r.h};r={x:r.x+r.w*k,y:r.y,w:r.w*(1-k),h:r.h}}
    else{out[id]={x:r.x,y:r.y,w:r.w,h:r.h*k};r={x:r.x,y:r.y+r.h*k,w:r.w,h:r.h*(1-k)}}});
  return{rects:out,orient}}
const floatRect=(i,id)=>{const a=W(id)?.app;const w=a==='calc'?.26:.5,h=a==='calc'?.5:.55;return{x:.25+.05*i,y:.14+.06*i,w,h}};
function neighbor(dir){const ws=curWs();const f=focusId();if(f==null)return null;const{rects}=tileRects(ws);
  let fr=rects[f];const fi=ws.floats.indexOf(f);if(!fr&&fi>=0)fr=floatRect(fi,f);if(!fr)return null;
  const e=.002,cx=fr.x+fr.w/2,cy=fr.y+fr.h/2;let best=null,bs=1e9;
  for(const k of Object.keys(rects)){const id=+k;if(id===f)continue;const r=rects[k];
    const oy=r.y<fr.y+fr.h-e&&r.y+r.h>fr.y+e,ox=r.x<fr.x+fr.w-e&&r.x+r.w>fr.x+e;let ok=false,d=0;
    if(dir==='left'){ok=r.x+r.w<=fr.x+e;d=(fr.x-(r.x+r.w))*10+Math.abs(r.y+r.h/2-cy)+(oy?0:5)}
    if(dir==='right'){ok=r.x>=fr.x+fr.w-e;d=(r.x-(fr.x+fr.w))*10+Math.abs(r.y+r.h/2-cy)+(oy?0:5)}
    if(dir==='up'){ok=r.y+r.h<=fr.y+e;d=(fr.y-(r.y+r.h))*10+Math.abs(r.x+r.w/2-cx)+(ox?0:5)}
    if(dir==='down'){ok=r.y>=fr.y+fr.h-e;d=(r.y-(fr.y+fr.h))*10+Math.abs(r.x+r.w/2-cx)+(ox?0:5)}
    if(ok&&d<bs){bs=d;best=id}}
  return best}

/* ---------- UI feedback inside the screen ---------- */
let osdT;
function osd(t){S.osd=t;const o=$('#osd');o.textContent=t;o.classList.add('on');clearTimeout(osdT);osdT=setTimeout(()=>o.classList.remove('on'),1100)}
let nidN=1;
function notify(title,body,ttl){if(S.silent)return;const n={id:nidN++,title,body};S.notifs.unshift(n);S.hist.unshift(n);if(S.notifs.length>3)S.notifs.pop();
  if(ttl)setTimeout(()=>{const i=S.notifs.indexOf(n);if(i>=0){S.notifs.splice(i,1);renderScreen()}},ttl)}

/* ---------- actions ---------- */
const ACTS=[],BIND={};
function act(id,deck,keys,label,run,o={}){const a=Object.assign({id,deck,keys:keys.map(canon),label,run,drill:true},o);ACTS.push(a);a.keys.forEach(k=>BIND[k]=a);return a}
const DECKS={basics:'Essentials',tiling:'Tiling',workspaces:'Workspaces',groups:'Groups',apps:'Apps',system:'Clipboard, style & system'};
const OS_NOTE='Your OS may grab this one. Use Lock keys.';
const openOv=(k,idx=0)=>()=>{S.overlay=k;S.ovIdx=idx};
const toggleOv=k=>()=>{if(S.overlay===k){S.overlay=null}else{S.overlay=k;S.ovIdx=0}};

// essentials
act('terminal','basics',['super+return'],'Terminal',()=>openApp('terminal'),{ask:'Open a terminal'});
act('browser','basics',['super+shift+return'],'Browser',()=>openApp('browser'),{ask:'Open the browser'});
act('close','basics',['super+w','super+q'],'Close window',()=>closeWin(focusId()),{ask:'Close the focused window',ensure:()=>ensureTiled(2)});
act('menu','basics',['super+space'],'Omarchy menu',toggleOv('menu'),{ask:'Open the Omarchy menu (apps and everything else)'});
act('appsmenu','basics',['super+alt+space'],'Apps menu',toggleOv('apps'),{ask:'Open the apps launcher'});
act('sysmenu','basics',['super+escape'],'System menu',toggleOv('system'),{ask:'Open the system menu (suspend, restart…)'});
act('keys','basics',['super+k'],'Keybindings',toggleOv('keys'),{ask:'Show the keybindings cheat sheet'});
act('lock','basics',['super+ctrl+l'],'Lock screen',openOv('lock'),{ask:'Lock the computer'});
act('files','basics',['super+shift+f'],'File manager',()=>openApp('files'),{ask:'Open the file manager'});
act('closeall','basics',['ctrl+alt+delete'],'Close all windows',()=>{[...Object.keys(S.wins)].forEach(id=>closeWin(+id))},{ask:'Close every window at once',os:OS_NOTE,drill:false});

// tiling
const DIRS={left:'left',right:'right',up:'up',down:'down'};
for(const d of Object.keys(DIRS)){
  act('focus-'+d,'tiling',['super+'+d],'Focus '+d,()=>{const n=neighbor(d);if(n!=null)curWs().focus=n;else osd('No window '+(d==='up'||d==='down'?d:'to the '+d))},{ask:'Move focus to the window '+(d==='up'?'above':d==='down'?'below':'on the '+d),ensure:()=>ensureDir(d)});
  act('swap-'+d,'tiling',['super+shift+'+d],'Swap '+d,()=>{const ws=curWs(),f=focusId(),n=neighbor(d);if(n==null||ws.floats.includes(f)){osd('Nothing to swap with');return}
    const a=slotOf(ws,f),b=slotOf(ws,n);if(a<0||b<0)return;[ws.slots[a],ws.slots[b]]=[ws.slots[b],ws.slots[a]]},{ask:'Swap the focused window with the one '+(d==='up'?'above':d==='down'?'below':'to the '+d),ensure:()=>ensureDir(d)});
}
act('split','tiling',['super+j'],'Toggle split',()=>{const ws=curWs();if(ws.layout!=='dwindle'){osd('Split toggle works in dwindle');return}const f=focusId(),i=slotOf(ws,f),n=ws.slots.length;if(i<0||n<2)return;const s=Math.min(i,n-2);ws.flips[s]=!ws.flips[s]},{ask:'Flip the split between side by side and stacked',ensure:()=>ensureTiled(2)});
act('float','tiling',['super+t'],'Tile / float',()=>{const ws=curWs(),f=focusId();if(f==null)return;if(S.pinned.includes(f)){osd('Pinned window');return}
  if(ws.floats.includes(f)){ws.floats.splice(ws.floats.indexOf(f),1);ws.slots.push({wins:[f],active:0,grouped:false})}else{detach(f);ws.floats.push(f)}ws.focus=f},
  {ask:()=>curWs().floats.includes(focusId())?'Tile the floating window':'Make the focused window float',ensure:()=>ensureTiled(2)});
act('full','tiling',['super+f'],'Full screen',()=>{const f=focusId();if(f==null)return;const w=W(f);w.full=w.full===1?0:1},{ask:()=>W(focusId())?.full===1?'Leave full screen':'Make the window full screen',ensure:()=>ensureTiled(2,true)});
act('fullw','tiling',['super+alt+f'],'Full width',()=>{const f=focusId();if(f==null)return;const w=W(f);w.full=w.full===2?0:2},{ask:()=>W(focusId())?.full===2?'Return from full width':'Go full width (keep the top bar)',ensure:()=>ensureTiled(2,true)});
act('fakefull','tiling',['super+ctrl+f'],'Full screen inside window',()=>{const f=focusId();if(f==null)return;W(f).fake=!W(f).fake},{ask:'Go full screen inside the window (great for YouTube)',ensure:()=>ensureTiled(1)});
act('pop','tiling',['super+o'],'Pop out (sticky + floating)',()=>{const f=focusId();if(f==null)return;const ws=curWs();
  if(S.pinned.includes(f)){S.pinned.splice(S.pinned.indexOf(f),1);ws.slots.push({wins:[f],active:0,grouped:false});ws.focus=f}else{detach(f);S.pinned.push(f);ws.focus=f}},
  {ask:()=>S.pinned.includes(focusId())?'Put the popped window back into the tiling':'Pop the window out so it floats and follows you everywhere',ensure:()=>ensureTiled(2)});
act('layout','tiling',['super+l'],'Dwindle ↔ scrolling',()=>{const ws=curWs();ws.layout=ws.layout==='dwindle'?'scrolling':'dwindle';osd('Layout: '+ws.layout)},
  {ask:()=>curWs().layout==='dwindle'?'Switch this workspace to the scrolling layout':'Switch this workspace back to dwindle',ensure:()=>ensureTiled(3,true,'any')});
act('pseudo','tiling',['super+p'],'Pseudo tile',()=>{const f=focusId();if(f!=null)W(f).pseudo=!W(f).pseudo},{drill:false});
act('grow','tiling',['super+minus'],'Expand window left',()=>resize('h',-1),{ask:'Expand the window to the left',ensure:()=>ensureDir('left')});
act('shrink','tiling',['super+equal'],'Shrink window left',()=>resize('h',1),{ask:'Shrink the window from the left',ensure:()=>ensureDir('left')});
act('shrinkv','tiling',['super+shift+minus'],'Shrink window up',()=>resize('v',1),{drill:false});
act('growv','tiling',['super+shift+equal'],'Expand window down',()=>resize('v',-1),{drill:false});
act('alttab','tiling',['alt+tab'],'Next window',()=>cycle(1),{ask:'Cycle to the next window on this workspace',os:OS_NOTE,ensure:()=>ensureTiled(2)});
act('alttabb','tiling',['alt+shift+tab'],'Previous window',()=>cycle(-1),{drill:false,os:OS_NOTE});
function cycle(d){const ws=curWs(),v=visibleIds(ws);if(v.length<2)return;const i=v.indexOf(focusId());ws.focus=v[(i+d+v.length)%v.length]}
function resize(axis,dir){const ws=curWs(),f=focusId();if(ws.layout==='scrolling'){ws.colW[f]=Math.min(.95,Math.max(.3,(ws.colW[f]||.6)-dir*.1));return}
  const i=slotOf(ws,f);if(i<0)return;const{orient}=tileRects(ws);const want=axis==='h'?'h':'v';
  for(let j=i-1;j>=0;j--)if(orient[j]===want){ws.ratios[j]=Math.min(.8,Math.max(.2,(ws.ratios[j]??.5)+dir*.08));return}
  if(orient[i]===want){ws.ratios[i]=Math.min(.8,Math.max(.2,(ws.ratios[i]??.5)-dir*.08));return}
  osd('No border to move that way')}

// workspaces
for(const n of [1,2,3,4]){
  act('ws'+n,'workspaces',['super+'+n],'Workspace '+n,()=>gotoWs(n),{ask:'Jump to workspace '+n,ensure:()=>{prep();if(S.cur===n)gotoWs(n===1?2:1)}});
  act('mv'+n,'workspaces',['super+shift+'+n],'Move to workspace '+n,()=>moveTo(n,true),{ask:'Move the focused window to workspace '+n+' (and follow it)',ensure:()=>{prep();if(S.cur===n)gotoWs(n===1?2:1);ensureTiled(1)}});
  act('mvs'+n,'workspaces',['super+alt+shift+'+n],'Send to workspace '+n,()=>{moveTo(n,false);osd('Sent to workspace '+n)},{ask:'Send the focused window to workspace '+n+' without following',ensure:()=>{prep();if(S.cur===n)gotoWs(n===1?2:1);ensureTiled(2)},drill:n<=3});
}
act('wsnext','workspaces',['super+tab'],'Next workspace',()=>gotoWs(S.cur%4+1),{ask:'Jump to the next workspace',os:OS_NOTE});
act('wsprev','workspaces',['super+shift+tab'],'Previous workspace',()=>gotoWs((S.cur+2)%4+1),{ask:'Jump to the previous workspace',os:OS_NOTE});
act('wsformer','workspaces',['super+ctrl+tab'],'Former workspace',()=>gotoWs(S.prev),{ask:'Jump back to the workspace you were on before',ensure:()=>{prep();if(S.prev===S.cur)S.prev=S.cur===1?3:1}});
act('scratch','workspaces',['super+s','super+backquote'],'Scratchpad',()=>{S.scratch=!S.scratch;if(S.scratch&&!S.ws.S.slots.length&&!S.ws.S.floats.length)osd('Scratchpad is empty')},
  {ask:()=>S.scratch?'Hide the scratchpad':'Drop down the scratchpad',ensure:()=>{closeOverlay();if(!S.ws.S.slots.length){const sv=S.scratch;S.scratch=true;openApp('terminal');S.scratch=sv}}});
act('toscratch','workspaces',['super+alt+s','super+shift+backquote'],'Move to scratchpad',()=>{if(!toScratch())osd('Already on the scratchpad')},{ask:'Stash the focused window on the scratchpad',ensure:()=>{prep();ensureTiled(2)}});

// groups
const curSlot=()=>{const ws=curWs(),i=slotOf(ws,focusId());return i>=0?ws.slots[i]:null};
act('group','groups',['super+g'],'Toggle group',()=>{const ws=curWs(),i=slotOf(ws,focusId());if(i<0){osd('Tile the window first');return}const sl=ws.slots[i];
  if(sl.grouped&&sl.wins.length>1){ws.slots.splice(i,1,...sl.wins.map(id=>({wins:[id],active:0,grouped:false})))}else sl.grouped=!sl.grouped},
  {ask:()=>curSlot()?.grouped?'Break the group apart':'Turn the focused window into a group (tabs)',ensure:()=>ensureTiled(2)});
act('gnext','groups',['super+ctrl+right'],'Next tab in group',()=>gstep(1),{ask:'Switch to the next tab in the group',ensure:()=>ensureGroup()});
act('gprev','groups',['super+ctrl+left'],'Previous tab in group',()=>gstep(-1),{ask:'Switch to the previous tab in the group',ensure:()=>ensureGroup()});
act('gcycle','groups',['super+alt+tab'],'Cycle group',()=>gstep(1),{ask:'Cycle through the windows in the group',ensure:()=>ensureGroup()});
act('gcycleb','groups',['super+alt+shift+tab'],'Cycle group backward',()=>gstep(-1),{drill:false});
act('gout','groups',['super+alt+g'],'Move out of group',()=>{const ws=curWs(),f=focusId(),i=slotOf(ws,f);if(i<0)return;const sl=ws.slots[i];
  if(!sl.grouped)return osd('Not in a group');if(sl.wins.length===1){sl.grouped=false;return}sl.wins.splice(sl.wins.indexOf(f),1);sl.active=Math.min(sl.active,sl.wins.length-1);ws.slots.splice(i+1,0,{wins:[f],active:0,grouped:false});ws.focus=f},
  {ask:'Pull the focused window out of its group',ensure:()=>ensureGroup()});
for(const n of [1,2,3,4,5])act('gjump'+n,'groups',['super+alt+'+n],'Group tab '+n,()=>{const sl=curSlot();if(sl&&sl.grouped&&sl.wins[n-1]!=null){sl.active=n-1;curWs().focus=sl.wins[n-1]}},{drill:n===2,ask:'Jump straight to tab '+n+' of the group',ensure:()=>ensureGroup(n)});
for(const d of ['left','right','up','down'])act('ginto-'+d,'groups',['super+alt+'+d],'Move into group '+d,()=>{const ws=curWs(),f=focusId(),n=neighbor(d);if(n==null)return;const b=slotOf(ws,n);
  if(!ws.slots[b].grouped){osd('That window is not a group');return}detach(f);const t=ws.slots[slotOf(ws,n)];t.wins.push(f);t.active=t.wins.length-1;ws.focus=f},{drill:false});
function gstep(d){const ws=curWs(),sl=curSlot();if(!sl||!sl.grouped||sl.wins.length<2)return osd('No group here');sl.active=(sl.active+d+sl.wins.length)%sl.wins.length;ws.focus=sl.wins[sl.active]}

// apps
const AK=[['tmux','super+alt+return','Tmux terminal'],['herdr','super+ctrl+return','Herdr (agent manager)'],['private','super+alt+shift+b','Private browser'],
 ['nvim','super+shift+n','Editor (Neovim)'],['music','super+shift+m','Music (Spotify)'],['btop','super+ctrl+t','Activity (btop)'],['passwords','super+shift+slash','Password manager'],
 ['obsidian','super+shift+o','Obsidian'],['email','super+shift+e','Email (HEY)'],['calendar','super+shift+c','Calendar (HEY)'],['chatgpt','super+shift+a','AI (ChatGPT)'],
 ['grok','super+alt+shift+a','AI (Grok)'],['signal','super+shift+g','Messenger (Signal)'],['whatsapp','super+alt+shift+g','WhatsApp'],['youtube','super+shift+y','YouTube'],
 ['docker','super+shift+d','Docker (LazyDocker)'],['write','super+shift+w','Writing (Omawrite)'],['maps','super+shift+s','Google Maps'],['photos','super+shift+p','Google Photos'],
 ['x','super+shift+x','X'],['calc','super+ctrl+q','Calculator']];
const AK_DRILL=['tmux','nvim','music','btop','passwords','obsidian','email','calendar','docker','herdr','chatgpt'];
for(const[app,k,l]of AK)act('app-'+app,'apps',[k],l,()=>openApp(app),{ask:'Launch '+l,drill:AK_DRILL.includes(app),ensure:()=>{prep();trim(3)}});

// system, clipboard, style
act('copy','system',['super+c'],'Copy',()=>{S.clip.unshift('copied text '+(S.clip.length+1));osd('Copied')},{ask:'Copy (works in the terminal too)'});
act('paste','system',['super+v'],'Paste',()=>osd('Pasted'),{ask:'Paste'});
act('cut','system',['super+x'],'Cut',()=>osd('Cut'),{ask:'Cut the selection'});
act('clipmgr','system',['super+ctrl+v'],'Clipboard manager',toggleOv('clip'),{ask:'Open the clipboard history'});
act('dismiss','system',['super+comma'],'Dismiss notification',()=>{S.notifs.shift()},{ask:'Dismiss the latest notification',ensure:()=>{if(!S.notifs.length){const s=S.silent;S.silent=false;notify('Battery','82% and charging');S.silent=s}}});
act('dismissall','system',['super+shift+comma'],'Dismiss all notifications',()=>{S.notifs=[]},{ask:'Dismiss all notifications',ensure:()=>{const s=S.silent;S.silent=false;while(S.notifs.length<2)notify(rnd(['Signal','Calendar','Update']),rnd(['New message from Ana','Standup in 5 minutes','Omarchy 4.0.5 is ready']));S.silent=s}});
act('silence','system',['super+ctrl+comma'],'Silence notifications',()=>{S.silent=!S.silent;osd(S.silent?'Notifications silenced':'Notifications on')},{ask:()=>S.silent?'Turn notifications back on':'Silence notifications'});
act('invoke','system',['super+alt+comma'],'Open latest notification',()=>{if(S.notifs.shift())osd('Opened')},{drill:false});
act('nhist','system',['super+alt+shift+comma'],'Notification history',toggleOv('history'),{drill:false});
act('theme','system',['super+ctrl+shift+space'],'Pick a theme',()=>{S.overlay='theme';S.ovIdx=Math.max(0,THEMES.findIndex(t=>t[0]===CFG.theme)-1)},{ask:'Open the theme picker'});
act('bg','system',['super+ctrl+space'],'Next background',()=>{CFG.wp=(CFG.wp+1)%3;saveCfg();osd('Background '+(CFG.wp+1)+' of 3')},{ask:'Switch the theme background'});
act('transp','system',['super+backspace'],'Toggle transparency',()=>{const f=focusId();if(f!=null){W(f).transp=!W(f).transp;osd(W(f).transp?'Transparent':'Opaque')}},{ask:'Toggle transparency on the window',ensure:()=>ensureTiled(1)});
act('topbar','system',['super+shift+space'],'Toggle top bar',()=>{S.bar=!S.bar},{ask:()=>S.bar?'Hide the top bar':'Bring the top bar back'});
act('gaps','system',['super+shift+backspace'],'Toggle gaps',()=>{S.gaps=!S.gaps;osd(S.gaps?'Gaps on':'Gaps off')},{ask:()=>S.gaps?'Turn window gaps off':'Turn window gaps back on',ensure:()=>ensureTiled(2)});
act('dfull','system',['super+ctrl+alt+f'],'Full screen desktop',()=>{S.dfull=!S.dfull},{drill:false});
act('night','system',['super+ctrl+n'],'Nightlight',()=>{S.night=!S.night;osd(S.night?'Nightlight on':'Nightlight off')},{ask:()=>S.night?'Turn nightlight off':'Turn on nightlight'});
act('idle','system',['super+ctrl+i'],'Toggle lock on idle',()=>osd('Idle lock toggled'),{drill:false});
for(const[k,n]of[['a','audio'],['b','bluetooth'],['w','wifi'],['d','display'],['p','power']])
  act('panel-'+n,'system',['super+ctrl+'+k],n[0].toUpperCase()+n.slice(1)+' panel',toggleOv('panel-'+n),{ask:'Open the '+n+' panel',drill:['audio','wifi','bluetooth'].includes(n)});
act('emoji','system',['super+ctrl+e'],'Emoji picker',toggleOv('emoji'),{ask:'Open the emoji picker'});
act('capture','system',['super+ctrl+c'],'Capture menu',toggleOv('capture'),{ask:'Open capture controls (screenshot, recording)'});
act('hardware','system',['super+ctrl+h'],'Hardware menu',toggleOv('hardware'),{drill:false});
act('reminder','system',['super+ctrl+r'],'Set a reminder',toggleOv('reminder'),{drill:false});
act('zoom','system',['super+ctrl+z'],'Zoom in',()=>{S.zoom=Math.min(2.2,S.zoom+.3)},{drill:false});
act('zoomout','system',['super+ctrl+alt+z'],'Zoom out',()=>{S.zoom=1},{drill:false});

/* ---------- drill preconditions ---------- */
function closeOverlay(){S.overlay=null}
function trim(max){const ws=S.ws[S.cur];while(ws.slots.length>max){const sl=ws.slots[0];[...sl.wins].forEach(id=>closeWin(id))}while(ws.floats.length>1)closeWin(ws.floats[0])}
function prep(){closeOverlay();S.scratch=false;S.zoom=1;Object.values(S.wins).forEach(w=>{w.full=0;w.fake=false})}
function ensureTiled(n,allowFloat,layout){prep();const ws=S.ws[S.cur];if(layout!=='any')ws.layout='dwindle';trim(5);
  let guard=0;while(ws.slots.length<n&&guard++<8)openApp(rnd(['terminal','browser','files','nvim','obsidian']),{noGroup:true,tile:true});
  const f=focusId();if((f==null||ws.floats.includes(f)||S.pinned.includes(f))&&ws.slots.length)ws.focus=tiled(ws)[ws.slots.length-1]}
function ensureDir(d){ensureTiled(2);for(let t=0;t<5;t++){const ws=S.ws[S.cur];for(const id of shuffle(tiled(ws))){ws.focus=id;if(neighbor(d)!=null)return}openApp('terminal',{noGroup:true})}}
function ensureGroup(min=2){ensureTiled(1);const ws=S.ws[S.cur];let sl=curSlot();if(!sl){ws.focus=tiled(ws)[0];sl=curSlot()}sl.grouped=true;
  let g=0;while(sl.wins.length<Math.max(2,min)&&g++<6){openApp(rnd(['terminal','browser','nvim']))}sl=curSlot();
  if(sl&&min>=2){sl.active=0;ws.focus=sl.wins[0]}}

/* ---------- overlays ---------- */
const OV={
  menu:{t:'Omarchy',items:()=>['Apps','Learn','Trigger','Share','Style','Setup','Install','Remove','Update','About','System'],input:'Search…'},
  apps:{t:'Apps',items:()=>['Terminal','Chromium','Files','Neovim','Obsidian','Spotify','Signal','LibreOffice','Kdenlive','OBS Studio'],input:'Search apps…'},
  system:{t:'System',items:()=>['Lock','Screensaver','Suspend','Restart','Shutdown']},
  keys:{t:'Keybindings',items:()=>['terminal','browser','close','menu','focus-left','swap-right','split','float','full','ws2','mv2','scratch','group','theme'].map(id=>ACTS.find(a=>a.id===id)).map(a=>[a.label,a.keys[0]])},
  clip:{t:'Clipboard',items:()=>S.clip.slice(0,6)},
  history:{t:'Notifications',items:()=>S.hist.length?S.hist.slice(0,6).map(n=>n.title+' · '+n.body):['Nothing yet']},
  theme:{t:'Theme',items:()=>THEMES.slice(1).map(t=>t[1])},
  capture:{t:'Capture',items:()=>['Screenshot','Screenrecord','Color picker','Text extraction']},
  hardware:{t:'Hardware',items:()=>['Audio','Bluetooth','Wifi','Display','Power','Keyboard']},
  reminder:{t:'Set a reminder',items:()=>['in 25m stretch','at 17:00 ship it','tomorrow 9:00 standup'],input:'in 25m stretch'},
  emoji:{t:'Emoji',grid:['😄','😂','😍','✌️','❤️','👍','👎','🤞','🤘','😘','🙄','😉','🙏','🤤','💰','🎉','💯','🥂','👌','👋','💪']},
};
const PANELS={audio:[['Output','Speakers'],['Volume','▮▮▮▮▮▮▯▯▯▯ 60%'],['Input','Mic']],bluetooth:[['Bluetooth','On'],['Keychron K3','connected'],['AirPods','paired']],
  wifi:[['Wifi','home-5g'],['Signal','▂▄▆█'],['Other','cafe-guest']],display:[['Display','eDP-1'],['Scale','1.6x'],['Nightlight',()=>S.night?'on':'off']],power:[['Battery','82%'],['Profile','balanced'],['Lid','suspend']]};
function ovItems(){const o=OV[S.overlay];return o&&o.items?o.items():[]}
function ovNav(c){
  if(S.overlay==='lock'){if(c==='escape'||c==='return'){S.overlay=null;osd('Unlocked')}return}
  if(c==='escape'){S.overlay=null;return}
  const it=ovItems();if(!it.length){if(c==='return')S.overlay=null;return}
  if(c==='down')S.ovIdx=(S.ovIdx+1)%it.length;
  if(c==='up')S.ovIdx=(S.ovIdx-1+it.length)%it.length;
  if(c==='return'){const pick=it[S.ovIdx];
    if(S.overlay==='theme'){applyTheme(THEMES[S.ovIdx+1][0]);osd('Theme: '+THEMES[S.ovIdx+1][1])}
    else osd((Array.isArray(pick)?pick[0]:pick)+(S.overlay==='clip'?' pasted':''));
    S.overlay=null}}

/* ---------- rendering the screen ---------- */
const winEls=new Map();
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
function measure(){const r=$('#screen').getBoundingClientRect();const bar=Math.round(Math.max(15,Math.min(26,r.width*.027)));DIM={W:r.width||960,H:r.height||600,bar};
  $('#screen').style.setProperty('--barh',bar+'px')}
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
  ws.floats.forEach((id,i)=>place(id,floatRect(i,id),30));
  S.pinned.forEach((id,i)=>place(id,{x:.64,y:.04+i*.3,w:.34,h:.32},45));
  if(S.scratch){const sw=S.ws.S;const{rects:sr}=tileRects(sw);const n=sw.slots.length;const area=n<=1?{x:work.x+work.w*.2,y:work.y,w:work.w*.6,h:work.h*.62}:{x:work.x+work.w*.02,y:work.y,w:work.w*.96,h:work.h*.66};
    sw.slots.forEach(sl=>{const id=sl.wins[sl.active];if(sr[id])place(id,sr[id],60,area,sl)});sw.floats.forEach((id,i)=>place(id,floatRect(i,id),62))}
  for(const[id,p]of want){const w=W(id);if(w.full===1&&!S.scratch){p.x=0;p.y=0;p.w=DIM.W;p.h=DIM.H;p.z=50}
    else if(w.full===2&&!S.scratch){p.x=gap;p.y=work.y+gap;p.w=work.w-2*gap;p.h=work.h-2*gap;p.z=40}}
  $('#scrim').classList.toggle('on',S.scratch);
  const holder=$('#wins');
  for(const[id,el]of winEls)if(!want.has(id)){el.remove();winEls.delete(id)}
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
const held=new Set();let firedWhileHeld=false;
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
  if(!['menu','appsmenu','sysmenu','keys','clipmgr','theme','emoji','capture','hardware','reminder','nhist'].includes(a.id)&&!a.id.startsWith('panel-'))S.overlay=null;
  a.run();cast(combo,a.label,false);after(combo,a);renderScreen();return true}

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
  try{await document.documentElement.requestFullscreen();if(navigator.keyboard&&navigator.keyboard.lock){await navigator.keyboard.lock();KEYLOCK=true;renderCoach();osd('Keys locked · hold Esc to exit')}else osd('Fullscreen. This browser cannot lock keys; use Chrome, Edge or Brave.');renderScreen()}
  catch(e){osd('Fullscreen blocked here. Open the page in its own browser tab.')}});
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;if(!on)KEYLOCK=false;$('#bLock').textContent=on?'Unlock keys':'Lock keys';$('#bLock').classList.toggle('on',on);setTimeout(()=>{measure();renderScreen()},60)});

const PLAT=(()=>{const p=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||'';return /mac|iphone|ipad/i.test(p)?'mac':/win/i.test(p)?'win':'linux'})();
const STANDINS=PLAT==='mac'?[[null,'None (real ⌘)'],['AltRight','Right Option'],['ControlRight','Right Ctrl'],['capture','Press a key…']]
  :[[null,'None (real Super)'],['CapsLock','Caps Lock'],['ControlRight','Right Ctrl'],['AltRight','Right Alt'],['capture','Press a key…']];
const PLAT_NOTE={mac:'On a Mac, ⌘ is Super, but ⌘W closes this tab, ⌘Q quits the browser and ⌘Space opens Spotlight. Use Right Option as a stand-in.',
  win:'On Windows, Win + L locks your PC and Windows keeps Win + Tab, Win + D and friends. Use Caps Lock or Right Ctrl as a stand-in.',
  linux:'On Omarchy, Hyprland acts on Super combos for real. Use Lock keys, or a stand-in like Caps Lock.'}[PLAT];
let KEYLOCK=false;
function hostWarn(){if(CFG.standin||KEYLOCK||PLAT==='linux'||CFG.input==='taps')return'';
  return `<p class="fb tip">${PLAT==='mac'?'Using real ⌘: ⌘W and ⌘Q can close the browser.':'Using the real Win key: Win + L will lock your PC.'} <button class="btn" data-setup>Pick a stand-in</button></p>`}
let capturing=false;
function renderSetup(){$('#standinSeg').innerHTML=STANDINS.map(([c,l])=>`<button class="btn" data-si="${c}" aria-pressed="${capturing?c==='capture':(CFG.standin===c||(!STANDINS.some(s=>s[0]===CFG.standin)&&c==='capture'&&CFG.standin))}">${c==='capture'&&CFG.standin&&!STANDINS.slice(0,4).some(s=>s[0]===CFG.standin)?'Custom: '+esc(CFG.standin):l}</button>`).join('');
  $('#platNote').textContent=PLAT_NOTE;
  $('#standinNote').textContent=capturing?'Press the key you want to use as Super…':CFG.standin?`While you hold ${(STANDINS.find(x=>x[0]===CFG.standin)||[0,CFG.standin])[1]}, it counts as Super.${CFG.standin==='AltRight'&&PLAT!=='mac'?' On some layouts Right Alt is AltGr and also reports Ctrl.':''}`:'Using the real Super key.';
  document.querySelectorAll('#inputSeg .btn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.input===CFG.input))}
$('#standinSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.si;
  if(v==='capture'){capturing=true}else{capturing=false;CFG.standin=v==='null'?null:v;saveCfg()}held.clear();renderSetup();renderMods();renderCoach()});
$('#inputSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;CFG.input=b.dataset.input;saveCfg();renderSetup();renderCoach()});
let resetArm=false;
$('#bReset').addEventListener('click',()=>{const b=$('#bReset');if(!resetArm){resetArm=true;b.textContent='Click again to erase';setTimeout(()=>{resetArm=false;b.textContent='Reset progress'},3000);return}
  PROG={};saveProg();CFG.done=[];CFG.best=0;saveCfg();resetArm=false;b.textContent='Progress erased';renderCoach()});

window.addEventListener('keydown',e=>{
  if(capturing){e.preventDefault();capturing=false;CFG.standin=e.code||null;saveCfg();held.clear();renderSetup();renderCoach();return}
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
let usedSuper=false;
window.addEventListener('beforeunload',e=>{if(PLAT==='mac'&&!CFG.standin&&usedSuper){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',()=>{held.clear();renderMods()});
new ResizeObserver(()=>{measure();renderScreen()}).observe($('#screen'));
setInterval(()=>{if(!S.overlay||S.overlay==='lock')renderScreen()},30000);

/* ---------- boot ---------- */
applyTheme(CFG.theme);
if(!CFG.seenSetup){CFG.seenSetup=true;saveCfg();if(!matchMedia('(pointer:coarse)').matches)openSetup(true)}$('#bSound').textContent=CFG.sound?'Sound on':'Sound off';renderSetup();
measure();
openApp('terminal');openApp('browser');openApp('btop');
notify('Welcome to Omadojo','Hold Super and press K for the cheat sheet.',9000);
if(CFG.mode==='drill')setMode('drill');else{if(CFG.mode==='blitz')D.blitz=null;renderScreen();renderCoach()}
if(location.hash==='#debug')window.__od={S:()=>S,press,ACTS,BIND,setMode,startLesson,D,L,lessons:LESSONS.length,lessonKey:()=>{const st=L.lesson!=null&&LESSONS[L.lesson].steps[L.step];return st?canon(st.keys[0]):null}};
