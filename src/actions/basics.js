import { closeWin, focusId, openApp, S } from '../model/desktop.js';
import { act, openOv, OS_NOTE, toggleOv } from './act.js';
import { ensureTiled } from './ensure.js';

// Essentials (Omarchy manual: Hotkeys).
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
