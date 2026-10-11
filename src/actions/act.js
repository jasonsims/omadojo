import { canon } from '../lib/keys.js';
import { S } from '../model/desktop.js';

// The shortcut table. One act() call per shortcut drives key handling (BIND), the Keys cheat sheet,
// the drill pool and tap-mode distractors. opts: ask, ensure, os, drill:false.
const ACTS=[],BIND={};
function act(id,deck,keys,label,run,o={}){const a=Object.assign({id,deck,keys:keys.map(canon),label,run,drill:true},o);ACTS.push(a);a.keys.forEach(k=>BIND[k]=a);return a}
const DECKS={basics:'Essentials',tiling:'Tiling',workspaces:'Workspaces',groups:'Groups',apps:'Apps',system:'Clipboard, style & system'};
const OS_NOTE='Your OS may grab this one. Use Lock keys.';
const openOv=(k,idx=0)=>()=>{S.overlay=k;S.ovIdx=idx};
const toggleOv=k=>()=>{if(S.overlay===k){S.overlay=null}else{S.overlay=k;S.ovIdx=0}};

// Run an action the way a key press does: anything but another menu closes the open one.
const MENUS=['menu','appsmenu','sysmenu','keys','clipmgr','theme','emoji','capture','hardware','reminder','nhist'];
function runAction(a){if(!MENUS.includes(a.id)&&!a.id.startsWith('panel-'))S.overlay=null;a.run()}

export { act, ACTS, BIND, DECKS, openOv, OS_NOTE, runAction, toggleOv };
