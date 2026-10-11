import { CFG } from '../config.js';

// The host OS, the stand-in keys it offers, and the warning shown when real Super combos may misfire.
const PLAT=(()=>{const p=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||'';return /mac|iphone|ipad/i.test(p)?'mac':/win/i.test(p)?'win':'linux'})();
const STANDINS=PLAT==='mac'?[[null,'None (real ⌘)'],['AltRight','Right Option'],['ControlRight','Right Ctrl'],['capture','Press a key…']]
  :[[null,'None (real Super)'],['CapsLock','Caps Lock'],['ControlRight','Right Ctrl'],['AltRight','Right Alt'],['capture','Press a key…']];
const PLAT_NOTE={mac:'On a Mac, ⌘ is Super, but ⌘W closes this tab, ⌘Q quits the browser and ⌘Space opens Spotlight. Use Right Option as a stand-in.',
  win:'On Windows, Win + L locks your PC and Windows keeps Win + Tab, Win + D and friends. Use Caps Lock or Right Ctrl as a stand-in.',
  linux:'On Omarchy, Hyprland acts on Super combos for real. Use Lock keys, or a stand-in like Caps Lock.'}[PLAT];
// keylock: navigator.keyboard.lock() is on. capturing: Key setup waits for a stand-in key.
const host={keylock:false,capturing:false};
function hostWarn(){if(CFG.standin||host.keylock||PLAT==='linux'||CFG.input==='taps')return'';
  return `<p class="fb tip">${PLAT==='mac'?'Using real ⌘: ⌘W and ⌘Q can close the browser.':'Using the real Win key: Win + L will lock your PC.'} <button class="btn" data-setup>Pick a stand-in</button></p>`}

export { host, hostWarn, PLAT, PLAT_NOTE, STANDINS };
