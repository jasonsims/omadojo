import { curSlot, curWs, detach, focusId, gstep, neighbor, osd, slotOf } from '../model/desktop.js';
import { act } from './act.js';
import { ensureGroup, ensureTiled } from './ensure.js';

// Window groups (Omarchy manual: Navigation).
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
