import { $ } from './lib/util.js';
import { canon, keyName, MODCODE, MODS, plain } from './lib/keys.js';
import { CFG, resetProgress, saveCfg, THEMES } from './config.js';
import { effects, fresh, notify, openApp, osd, S } from './model/desktop.js';
import { ACTS, BIND } from './actions/act.js';
import { after, miss, nextPrompt, press, setMode, startBlitz, startLesson } from './coach/engine.js';
import { LESSONS } from './coach/lessons.js';
import { D, L } from './coach/state.js';
import { host, PLAT } from './input/host.js';
import { held, mods, prune, renderMods } from './input/modifiers.js';
import { renderCoach } from './view/coach.js';
import { measure, renderScreen, showOsd } from './view/screen.js';
import { openSetup, renderSetup } from './view/setup.js';
import { beep } from './view/sound.js';
import { applyTheme } from './view/theme.js';
import './actions/index.js';

// Entry point: wires DOM events to the coach and view, then boots the desktop.
/* ---------- events ---------- */
$('#modes').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.mode)});
$('#coach').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
  if(t.dataset.lesson!=null){startLesson(+t.dataset.lesson);return}
  if(t.hasAttribute('data-back')){L.lesson=null;renderCoach();return}
  if(t.hasAttribute('data-restart')){startLesson(L.lesson);return}
  if(t.dataset.go){setMode(t.dataset.go);return}
  if(t.dataset.deck){const k=t.dataset.deck;CFG.decks=CFG.decks.includes(k)?CFG.decks.filter(x=>x!==k):[...CFG.decks,k];if(!CFG.decks.length)CFG.decks=[k];saveCfg();
    if(CFG.mode==='drill'){D.last=[];nextPrompt()}else renderCoach();return}
  if(t.hasAttribute('data-skip')){D.streak=0;nextPrompt();return}
  if(t.hasAttribute('data-blitz')){startBlitz();return}
  if(t.hasAttribute('data-setup')){openSetup(true);return}
  if(t.hasAttribute('data-resetdesk')){fresh();openApp('terminal');renderScreen();return}
  if(t.dataset.opt){const o=t.dataset.opt;
    if(CFG.mode==='learn'&&L.lesson!=null){const st=LESSONS[L.lesson].steps[L.step];if(st.keys.map(canon).includes(o)){if(S.overlay&&['up','down','return','escape'].includes(o)){press(o)}else if(BIND[o])press(o);else after(o,null)}
      else{L.fb=`That's ${plain(o)}. Look again.`;beep(false);renderCoach()}return}
    if(D.item&&!D.cool){if(D.item.keys.includes(o))press(o);else{D.wrongOpt=o;const a=BIND[o];miss(a&&a.label,o)}}}});
$('#bTheme').addEventListener('click',()=>{const i=THEMES.findIndex(t=>t[0]===CFG.theme);applyTheme(THEMES[(i+1)%THEMES.length][0])});
$('#bSound').addEventListener('click',()=>{CFG.sound=!CFG.sound;saveCfg();$('#bSound').textContent=CFG.sound?'Sound on':'Sound off'});
$('#bSetup').addEventListener('click',()=>openSetup($('#setup').hidden));
$('#bLock').addEventListener('click',async()=>{const b=$('#bLock');
  if(document.fullscreenElement){try{navigator.keyboard&&navigator.keyboard.unlock()}catch(e){}document.exitFullscreen().catch(()=>{});return}
  try{await document.documentElement.requestFullscreen();if(navigator.keyboard&&navigator.keyboard.lock){await navigator.keyboard.lock();host.keylock=true;renderCoach();osd('Keys locked · hold Esc to exit')}else osd('Fullscreen. This browser cannot lock keys; use Chrome, Edge or Brave.');renderScreen()}
  catch(e){osd('Fullscreen blocked here. Open the page in its own browser tab.')}});
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;if(!on)host.keylock=false;$('#bLock').textContent=on?'Unlock keys':'Lock keys';$('#bLock').classList.toggle('on',on);setTimeout(()=>{measure();renderScreen()},60)});

$('#standinSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.si;
  if(v==='capture'){host.capturing=true}else{host.capturing=false;CFG.standin=v==='null'?null:v;saveCfg()}held.clear();renderSetup();renderMods();renderCoach()});
$('#inputSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;CFG.input=b.dataset.input;saveCfg();renderSetup();renderCoach()});
let resetArm=false,firedWhileHeld=false,usedSuper=false;
$('#bReset').addEventListener('click',()=>{const b=$('#bReset');if(!resetArm){resetArm=true;b.textContent='Click again to erase';setTimeout(()=>{resetArm=false;b.textContent='Reset progress'},3000);return}
  resetProgress();resetArm=false;b.textContent='Progress erased';renderCoach()});

window.addEventListener('keydown',e=>{
  if(host.capturing){e.preventDefault();host.capturing=false;CFG.standin=e.code||null;saveCfg();held.clear();renderSetup();renderCoach();return}
  const inField=e.target&&e.target.closest&&e.target.closest('input,textarea');
  const code=e.code;
  if(MODCODE[code]||code===CFG.standin){held.add(code);renderMods();if(code===CFG.standin||MODCODE[code]==='super')e.preventDefault();return}
  prune(e);renderMods();
  const m=mods();if(inField&&!m.has('super'))return;
  const key=keyName(e);if(!key)return;
  const combo=[...MODS.filter(x=>m.has(x)),key].join('+');
  if(e.repeat){if(m.has('super')||BIND[combo])e.preventDefault();return}
  if(CFG.input==='taps'&&m.has('super')){CFG.input='keys';saveCfg();renderSetup();renderCoach()}
  const handled=press(combo,'key');
  if(handled)firedWhileHeld=true;
  if(m.has('super'))usedSuper=true;
  if(handled||m.has('super'))e.preventDefault();
},true);
window.addEventListener('keyup',e=>{held.delete(e.code);if(e.code===CFG.standin||(firedWhileHeld&&MODCODE[e.code]))e.preventDefault();prune(e);if(!mods().size)firedWhileHeld=false;renderMods()},true);
window.addEventListener('blur',()=>{held.clear();renderMods()});
window.addEventListener('beforeunload',e=>{if(PLAT==='mac'&&!CFG.standin&&usedSuper){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',()=>{held.clear();renderMods()});
new ResizeObserver(()=>{measure();renderScreen()}).observe($('#screen'));
setInterval(()=>{if(!S.overlay||S.overlay==='lock')renderScreen()},30000);

/* ---------- boot ---------- */
Object.assign(effects,{osd:showOsd,render:renderScreen,theme:applyTheme});
applyTheme(CFG.theme);
if(!CFG.seenSetup){CFG.seenSetup=true;saveCfg();if(!matchMedia('(pointer:coarse)').matches)openSetup(true)}$('#bSound').textContent=CFG.sound?'Sound on':'Sound off';renderSetup();
measure();
openApp('terminal');openApp('browser');openApp('btop');
notify('Welcome to Omadojo','Hold Super and press K for the cheat sheet.',9000);
if(CFG.mode==='drill')setMode('drill');else{if(CFG.mode==='blitz')D.blitz=null;renderScreen();renderCoach()}
if(location.hash==='#debug')window.__od={S:()=>S,press,ACTS,BIND,setMode,startLesson,D,L,lessons:LESSONS.length,lessonKey:()=>{const st=L.lesson!=null&&LESSONS[L.lesson].steps[L.step];return st?canon(st.keys[0]):null}};
