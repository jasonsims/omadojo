import { MODCODE } from '../lib/keys.js';

// Held modifiers, tracked by event.code rather than trusting event.metaKey and friends.
// prune() drops modifiers the browser says are no longer down.
const held=new Set();
function mods(){const m=new Set();for(const c of held){const k=MODCODE[c];if(k)m.add(k)}return m}
function renderMods(){const m=mods();document.querySelectorAll('#mods span').forEach(s=>s.classList.toggle('on',m.has(s.dataset.m)))}
function prune(e){const drop=(codes,flag)=>{if(!flag)codes.forEach(c=>held.delete(c))};
  drop(['ShiftLeft','ShiftRight'],e.shiftKey);drop(['ControlLeft','ControlRight'],e.ctrlKey);drop(['AltLeft','AltRight'],e.altKey);drop(['MetaLeft','MetaRight','OSLeft','OSRight'],e.metaKey)}

export { held, mods, prune, renderMods };
