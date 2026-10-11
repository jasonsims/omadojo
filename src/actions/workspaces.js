import { gotoWs, moveTo, openApp, osd, S, toScratch } from '../model/desktop.js';
import { act, OS_NOTE } from './act.js';
import { closeOverlay, ensureTiled, prep } from './ensure.js';

// Workspaces and the scratchpad (Omarchy manual: Navigation).
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
