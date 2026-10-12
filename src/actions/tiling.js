import { curWs, cycle, detach, focusId, neighbor, osd, resize, S, slotOf, W } from '../model/desktop.js';
import { act } from './act.js';
import { ensureDir, ensureTiled } from './ensure.js';

// Tiling, focus, swap, float, full screen and resize (Omarchy manual: Navigation).
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
act('alttab','tiling',['alt+tab'],'Next window',()=>cycle(1),{ask:'Cycle to the next window on this workspace',ensure:()=>ensureTiled(2)});
act('alttabb','tiling',['alt+shift+tab'],'Previous window',()=>cycle(-1),{drill:false});
