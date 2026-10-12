import { CFG } from '../config.js';

// The host computer: which OS the user practises on, whether Lock keys is on, and which Omarchy shortcuts
// that OS or its browser takes before the page sees them. There is deliberately no stand-in Super key:
// the point is muscle memory for the real one, so shortcuts that can't reach the page are left out instead.
const PLAT_AUTO=(()=>{if(typeof navigator==='undefined')return'linux';const p=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||'';
  return /mac|iphone|ipad/i.test(p)?'mac':/win/i.test(p)?'win':'linux'})();
const PLATS={mac:'Mac',win:'Windows',linux:'Linux'};
const plat=()=>PLATS[CFG.plat]?CFG.plat:PLAT_AUTO;
const platName=()=>PLATS[plat()];

// keylock: navigator.keyboard.lock() is on.
const host={keylock:false};

// CONFLICTS[platform][combo]: what the OS or browser does instead, with the real Super key.
// d: dangerous (closes or locks something). lock: Lock keys gets it through to the page.
const C=(why,o={})=>Object.assign({why},o);
const CONFLICTS={
 mac:{
  'super+q':C('⌘Q quits the browser',{d:1}),
  'super+w':C('⌘W closes this tab',{d:1}),
  'super+shift+w':C('⌘⇧W closes the browser window',{d:1}),
  'super+ctrl+q':C('⌃⌘Q locks your Mac',{d:1}),
  'super+space':C('⌘Space opens Spotlight'),
  'super+alt+space':C('opens Finder search'),
  'super+tab':C('⌘Tab switches apps'),
  'super+shift+tab':C('⌘⇧Tab switches apps'),
  'super+shift+3':C('takes a screenshot'),
  'super+shift+4':C('takes a screenshot'),
  'super+ctrl+space':C('opens the emoji picker'),
  'super+backquote':C('cycles browser windows'),
  'super+shift+backquote':C('cycles browser windows'),
  'super+ctrl+d':C('looks up a word in the dictionary'),
  'super+shift+slash':C('opens Help menu search'),
  'super+t':C('opens a new browser tab'),
  'super+shift+n':C('opens a private browser window'),
  'super+alt+left':C('switches browser tabs'),
  'super+alt+right':C('switches browser tabs'),
 },
 win:{
  'super+l':C('Win + L locks your PC',{d:1}),
  'ctrl+alt+delete':C('opens the Windows security screen',{d:1}),
  'super+left':C('snaps the browser window',{lock:1}),'super+right':C('snaps the browser window',{lock:1}),
  'super+up':C('maximizes the browser window',{lock:1}),'super+down':C('minimizes the browser window',{lock:1}),
  'super+shift+left':C('moves the browser to another monitor',{lock:1}),'super+shift+right':C('moves the browser to another monitor',{lock:1}),
  'super+shift+up':C('stretches the browser window',{lock:1}),'super+shift+down':C('restores the browser window',{lock:1}),
  'super+tab':C('opens Task View',{lock:1}),
  'super+ctrl+left':C('switches virtual desktops',{lock:1}),'super+ctrl+right':C('switches virtual desktops',{lock:1}),
  'super+ctrl+d':C('creates a virtual desktop',{lock:1}),
  'super+equal':C('starts Magnifier',{lock:1}),'super+minus':C('zooms Magnifier out',{lock:1}),
  'super+ctrl+return':C('starts Narrator',{lock:1}),'super+ctrl+n':C('opens Narrator settings',{lock:1}),
  'super+space':C('switches input language',{lock:1}),'super+ctrl+space':C('switches input language',{lock:1}),
  'super+s':C('opens Search',{lock:1}),'super+q':C('opens Search',{lock:1}),
  'super+v':C('opens clipboard history',{lock:1}),'super+c':C('opens Copilot',{lock:1}),
  'super+x':C('opens the quick link menu',{lock:1}),'super+w':C('opens Widgets',{lock:1}),
  'super+k':C('opens Cast',{lock:1}),'super+p':C('opens Project',{lock:1}),
  'super+g':C('opens Game Bar',{lock:1}),'super+alt+g':C('records a Game Bar clip',{lock:1}),
  'super+t':C('focuses the taskbar',{lock:1}),'super+o':C('toggles rotation lock',{lock:1}),
  'super+f':C('opens Feedback Hub',{lock:1}),'super+comma':C('peeks at the desktop',{lock:1}),
  'super+shift+s':C('opens the Snipping Tool',{lock:1}),'super+shift+m':C('restores minimized windows',{lock:1}),
  'super+ctrl+q':C('opens Quick Assist',{lock:1}),'super+ctrl+v':C('opens sound output',{lock:1}),
  'alt+tab':C('switches apps',{lock:1}),'alt+shift+tab':C('switches apps',{lock:1}),
 },
 linux:{},
};
for(const n of [1,2,3,4])Object.assign(CONFLICTS.win,{['super+'+n]:C('opens taskbar app '+n,{lock:1}),
  ['super+shift+'+n]:C('opens taskbar app '+n,{lock:1}),['super+alt+'+n]:C('opens a taskbar jump list',{lock:1})});
CONFLICTS.win['super+alt+5']=C('opens a taskbar jump list',{lock:1});

// blocked(combo) -> {why, danger} when the combo can't reach the page right now, else null. Tap mode never is.
function blocked(combo){if(CFG.input==='taps')return null;const c=CONFLICTS[plat()][combo];if(!c||(c.lock&&host.keylock))return null;return{why:c.why,danger:!!c.d}}
const availKeys=a=>a.keys.filter(k=>!blocked(k));
const trainable=a=>availKeys(a).length>0;

export { availKeys, blocked, CONFLICTS, host, plat, platName, PLAT_AUTO, PLATS, trainable };
