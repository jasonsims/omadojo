import { MODCODE } from '../lib/keys.js';
import { CFG } from '../config.js';

// Held modifiers, tracked by event.code so a stand-in key can count as Super.
// prune() drops modifiers the browser says are no longer down (the stand-in is never pruned).
const held=new Set();
function mods(){const m=new Set();for(const c of held){if(c===CFG.standin){m.add('super');continue}const k=MODCODE[c];if(k)m.add(k)}return m}
function renderMods(){const m=mods();document.querySelectorAll('#mods span').forEach(s=>s.classList.toggle('on',m.has(s.dataset.m)))}
function prune(e){const drop=(codes,flag)=>{if(!flag)codes.forEach(c=>{if(c!==CFG.standin)held.delete(c)})};
  drop(['ShiftLeft','ShiftRight'],e.shiftKey);drop(['ControlLeft','ControlRight'],e.ctrlKey);drop(['AltLeft','AltRight'],e.altKey);drop(['MetaLeft','MetaRight','OSLeft','OSRight'],e.metaKey)}

export { held, mods, prune, renderMods };
