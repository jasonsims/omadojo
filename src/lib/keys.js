import { esc } from './util.js';

// Key combos: canonical strings, event.code mapping and keycap markup.
// Combos list modifiers as super, ctrl, alt, shift, then the key, e.g. super+alt+shift+3.
const MODS=['super','ctrl','alt','shift'];
function canon(s){const p=s.toLowerCase().split('+').map(x=>x.trim());return[...MODS.filter(m=>p.includes(m)),...p.filter(x=>!MODS.includes(x))].join('+')}
const KN={super:'Super',ctrl:'Ctrl',alt:'Alt',shift:'Shift',return:'Return',space:'Space',escape:'Esc',tab:'Tab',backspace:'Backspace',delete:'Delete',
  minus:'-',equal:'=',slash:'/',comma:',',period:'.',backquote:'`',left:'←',right:'→',up:'↑',down:'↓',home:'Home'};
const kname=k=>KN[k]||k.toUpperCase();
const caps=c=>c.split('+').map(k=>`<kbd class="kc${k==='super'?' sup':''}">${esc(kname(k))}</kbd>`).join('<i class="plus">+</i>');
const plain=c=>c.split('+').map(kname).join(' + ');
const capsAll=keys=>keys.map(caps).join('<span class="alt">or</span>');
const CODEKEY={Enter:'return',NumpadEnter:'return',Space:'space',Escape:'escape',Tab:'tab',Backspace:'backspace',Delete:'delete',Minus:'minus',
  Equal:'equal',Slash:'slash',Comma:'comma',Period:'period',Backquote:'backquote',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',
  Home:'home',BracketLeft:'[',BracketRight:']',NumpadSubtract:'minus',NumpadAdd:'equal'};
const MODCODE={ShiftLeft:'shift',ShiftRight:'shift',ControlLeft:'ctrl',ControlRight:'ctrl',AltLeft:'alt',AltRight:'alt',MetaLeft:'super',MetaRight:'super',OSLeft:'super',OSRight:'super'};
function keyName(e){const c=e.code||'';
  if(/^Key[A-Z]$/.test(c))return c.slice(3).toLowerCase();
  if(/^Digit\d$/.test(c))return c.slice(5);
  if(/^Numpad\d$/.test(c))return c.slice(6);
  if(CODEKEY[c])return CODEKEY[c];
  if(e.key&&e.key.length===1)return e.key.toLowerCase();
  return null}

export { canon, caps, capsAll, keyName, MODCODE, MODS, plain };
