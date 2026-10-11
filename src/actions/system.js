import { rnd } from '../lib/util.js';
import { CFG, saveCfg, THEMES } from '../config.js';
import { focusId, notify, osd, S, W } from '../model/desktop.js';
import { act, toggleOv } from './act.js';
import { ensureTiled } from './ensure.js';

// Clipboard, notifications, style and system panels (Omarchy manual: Hotkeys).
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
