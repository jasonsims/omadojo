import { rnd, shuffle } from '../lib/util.js';
import { closeWin, curSlot, focusId, neighbor, openApp, S } from '../model/desktop.js';
import { tiled } from '../model/layout.js';

// Drill preconditions: put the desktop in a state where the prompted shortcut does something.
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

// Set up a drill item before prompting for it, exactly as the coach does.
function prepare(a){if(a.ensure)a.ensure();else prep()}

export { closeOverlay, ensureDir, ensureGroup, ensureTiled, prep, prepare, trim };
