import { $, shuffle } from '../lib/util.js';
import { canon, plain } from '../lib/keys.js';
import { CFG, P, saveCfg, saveProg } from '../config.js';
import { fresh, openApp, S } from '../model/desktop.js';
import { BIND, runAction } from '../actions/act.js';
import { prep } from '../actions/ensure.js';
import { ovNav } from '../actions/overlays.js';
import { LESSONS } from './lessons.js';
import { askText, D, distractors, L, pick } from './state.js';
import { cast, renderCoach } from '../view/coach.js';
import { renderScreen } from '../view/screen.js';
import { beep } from '../view/sound.js';

// press() runs a combo on the desktop, then after() scores it against the Learn step or Drill/Blitz prompt.
function press(combo,src){
  if(S.overlay&&['up','down','return','escape'].includes(combo)){ovNav(combo);cast(combo,combo==='escape'?'Close':combo==='return'?'Select':'Move',false);after(combo,null);renderScreen();return true}
  const a=BIND[combo];
  if(!a){if(combo.includes('super')){cast(combo,'not bound in Omarchy',true);after(combo,null);return true}stray(combo);return false}
  runAction(a);cast(combo,a.label,false);after(combo,a);renderScreen();return true}

function clearTimers(){D.timers.forEach(clearTimeout);D.timers=[];clearInterval(D.tick)}
function nextPrompt(){clearTimers();if(D.blitz&&D.blitz.done)return;const a=pick();D.last=[a.id,...D.last].slice(0,3);
  if(a.ensure)a.ensure();else prep();
  D.item=a;D.ask=askText(a);D.t0=performance.now();D.missed=false;D.cool=false;D.fb='';D.fbc='';D.wrongOpt=null;
  const lvl=P(a.id).l;const delay=D.blitz?2500:lvl<2?0:lvl<4?3000:6000;D.revealed=delay===0;D.hintMs=delay;
  if(delay)D.timers.push(setTimeout(()=>{D.revealed=true;renderCoach()},delay));
  D.opts=shuffle([a.keys[0],...distractors(a.keys,a.deck)]);
  if(D.blitz)D.tick=setInterval(blitzTick,100);
  renderScreen();renderCoach()}
function success(){const a=D.item,ms=Math.round(performance.now()-D.t0),p=P(a.id);p.n++;
  if(!D.missed){p.ok++;if(!D.revealed||p.l<2)p.l=Math.min(5,p.l+1)}p.ms=p.ms?Math.round(p.ms*.6+ms*.4):ms;saveProg();
  D.right++;D.streak++;D.tries++;beep(true);D.cool=true;D.tip=false;
  if(D.blitz){const B=D.blitz;B.streak++;B.right++;B.mult=Math.min(4,1+Math.floor(B.streak/5));const pts=Math.round((100+Math.max(0,100-ms/30))*B.mult);B.score+=pts;B.times.push([a.id,ms]);D.fb=`+${pts}`;}
  else D.fb=`✓ ${(ms/1000).toFixed(2)}s${D.revealed&&!D.missed?' · with hint':''}`;
  D.fbc='ok';clearTimers();if(D.blitz)D.tick=setInterval(blitzTick,100);renderCoach();
  D.timers.push(setTimeout(nextPrompt,D.blitz?260:650))}
function miss(label,combo){const a=D.item,p=P(a.id);if(!D.missed){p.l=Math.max(0,p.l-1);p.n++;saveProg()}D.missed=true;D.revealed=true;D.streak=0;D.tries++;beep(false);
  if(D.blitz){D.blitz.streak=0;D.blitz.mult=1;D.blitz.wrong++}
  D.fb=label?`That was ${label}. Try the keys shown.`:`${plain(combo)} isn't bound. Try the keys shown.`;D.fbc='bad';renderCoach()}
function stray(combo){// a plain key: did Super get lost on the way?
  const target=CFG.mode==='learn'&&L.lesson!=null?(LESSONS[L.lesson].steps[L.step]||{}).keys:D.item&&D.item.keys;if(!target)return;
  const last=combo.split('+').pop();if(target.some(k=>k.includes('super')&&k.split('+').pop()===last)){D.tip=true;L.fb='tip';renderCoach()}}
function after(combo,a){
  if(CFG.mode==='learn'&&L.lesson!=null&&!L.done){const st=LESSONS[L.lesson].steps[L.step];if(!st)return;
    if(st.keys.map(canon).includes(combo)){L.note=st.note||'';L.fb='';L.step++;beep(true);if(L.step>=LESSONS[L.lesson].steps.length){L.done=true;if(!CFG.done.includes(L.lesson)){CFG.done.push(L.lesson);saveCfg()}}
      else{const nx=LESSONS[L.lesson].steps[L.step];if(nx.pre){nx.pre();renderScreen()}}L.opts=null;renderCoach()}
    else if(a||combo.includes('super')){L.fb=a?`That was ${a.label}.`:`${plain(combo)} isn't bound.`;beep(false);renderCoach()}
    return}
  if((CFG.mode==='drill'||CFG.mode==='blitz')&&D.item&&!D.cool){
    if(a&&a.id===D.item.id)success();
    else if(D.item.keys.includes(combo))success();
    else if(a||combo.includes('super'))miss(a&&a.label,combo)}}

function blitzTick(){const B=D.blitz;if(!B)return;const left=Math.max(0,B.end-performance.now());const el=$('#bclock');if(el)el.textContent=(left/1000).toFixed(1);
  if(left<=0){clearTimers();B.done=true;D.item=null;if(B.score>CFG.best){CFG.best=B.score;B.newBest=true;saveCfg()}renderCoach()}}

function startLesson(i){clearTimers();L.lesson=i;L.step=0;L.note='';L.fb='';L.done=false;D.tip=false;fresh();LESSONS[i].setup.forEach(a=>openApp(a));
  const st=LESSONS[i].steps[0];if(st.pre)st.pre();renderScreen();renderCoach()}

function setMode(m){clearTimers();CFG.mode=m;saveCfg();D.item=null;D.fb='';D.tip=false;
  if(m==='drill'){D.blitz=null;nextPrompt();return}
  if(m==='blitz'){D.blitz=null}
  if(m==='learn'&&L.lesson==null){}
  renderScreen();renderCoach()}
function startBlitz(){fresh();openApp('terminal');openApp('browser');D.blitz={end:performance.now()+60000,score:0,mult:1,streak:0,right:0,wrong:0,times:[]};D.last=[];nextPrompt()}

export { after, miss, nextPrompt, press, setMode, startBlitz, startLesson };
