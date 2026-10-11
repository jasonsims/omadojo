import { APPS } from './apps.js';
import { floatRect, nearest, tiled, tileRects } from './layout.js';

// The desktop model: workspaces, slots, floats and pinned windows in S, and the mutations on them.
// A slot is {wins:[ids], active, grouped}; a group is a slot with several windows. Nothing here touches the DOM.

// Side effects the model asks for. Boot wires these to the view; outside a browser they do nothing.
const effects={osd(){},render(){},theme(){}};
const mkWs=()=>({slots:[],floats:[],focus:null,layout:'dwindle',flips:{},ratios:{},colW:{},scroll:0});
let S,NID=1;
function fresh(){S={ws:{1:mkWs(),2:mkWs(),3:mkWs(),4:mkWs(),S:mkWs()},cur:1,prev:2,scratch:false,pinned:[],wins:{},dying:[],
  bar:true,gaps:true,dfull:false,night:false,silent:false,zoom:1,overlay:null,ovIdx:0,notifs:[],hist:[],clip:['ssh-ed25519 AAAA…','https://omarchy.org/manual/','hl.bind("SUPER + J", …)'],slideDir:0,osd:''}}
fresh();
const curWs=()=>S.scratch?S.ws.S:S.ws[S.cur];

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
function closeWin(id){if(id==null)return false;detach(id);S.dying.push(id);delete S.wins[id];return true}
function gotoWs(n){if(S.scratch){S.scratch=false}if(n===S.cur)return;S.slideDir=n>S.cur?1:-1;S.prev=S.cur;S.cur=n}
function moveTo(n,follow){const id=focusId();if(id==null||S.pinned.includes(id))return false;const L=detach(id);const t=S.ws[n];
  if(L.fl)t.floats.push(id);else t.slots.push({wins:[id],active:0,grouped:false});t.focus=id;W(id).full=0;
  if(follow){S.scratch=false;gotoWs(n)}return true}
function toScratch(){const id=focusId();if(id==null||S.scratch)return false;const L=detach(id);const t=S.ws.S;if(L.fl)t.floats.push(id);else t.slots.push({wins:[id],active:0,grouped:false});t.focus=id;return true}

function neighbor(dir){const ws=curWs();const f=focusId();if(f==null)return null;const{rects}=tileRects(ws);
  let fr=rects[f];const fi=ws.floats.indexOf(f);if(!fr&&fi>=0)fr=floatRect(fi,W(f).app);if(!fr)return null;
  return nearest(rects,f,fr,dir)}

function osd(t){S.osd=t;effects.osd(t)}
let nidN=1;
function notify(title,body,ttl){if(S.silent)return;const n={id:nidN++,title,body};S.notifs.unshift(n);S.hist.unshift(n);if(S.notifs.length>3)S.notifs.pop();
  if(ttl)setTimeout(()=>{const i=S.notifs.indexOf(n);if(i>=0){S.notifs.splice(i,1);effects.render()}},ttl)}

const curSlot=()=>{const ws=curWs(),i=slotOf(ws,focusId());return i>=0?ws.slots[i]:null};

function cycle(d){const ws=curWs(),v=visibleIds(ws);if(v.length<2)return;const i=v.indexOf(focusId());ws.focus=v[(i+d+v.length)%v.length]}
function resize(axis,dir){const ws=curWs(),f=focusId();if(ws.layout==='scrolling'){ws.colW[f]=Math.min(.95,Math.max(.3,(ws.colW[f]||.6)-dir*.1));return}
  const i=slotOf(ws,f);if(i<0)return;const{orient}=tileRects(ws);const want=axis==='h'?'h':'v';
  for(let j=i-1;j>=0;j--)if(orient[j]===want){ws.ratios[j]=Math.min(.8,Math.max(.2,(ws.ratios[j]??.5)+dir*.08));return}
  if(orient[i]===want){ws.ratios[i]=Math.min(.8,Math.max(.2,(ws.ratios[i]??.5)-dir*.08));return}
  osd('No border to move that way')}

function gstep(d){const ws=curWs(),sl=curSlot();if(!sl||!sl.grouped||sl.wins.length<2)return osd('No group here');sl.active=(sl.active+d+sl.wins.length)%sl.wins.length;ws.focus=sl.wins[sl.active]}

export { closeWin, curSlot, curWs, cycle, detach, effects, focusId, fresh, gotoWs, gstep, moveTo, neighbor, notify, openApp, osd, resize, S, slotOf, toScratch, W };
