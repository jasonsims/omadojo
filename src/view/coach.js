import { $, esc, shuffle } from '../lib/util.js';
import { canon, caps, capsAll, plain } from '../lib/keys.js';
import { CFG, P } from '../config.js';
import { ACTS, DECKS } from '../actions/act.js';
import { LESSONS } from '../coach/lessons.js';
import { askText, D, distractors, freeLog, L } from '../coach/state.js';
import { hostWarn } from '../input/host.js';

// The coach panel for every mode, and the keycast strip under the screen.
const blocks=(f,n=20)=>'█'.repeat(Math.round(f*n))+'░'.repeat(n-Math.round(f*n));
const mast=l=>`<span class="mast" title="Level ${l} of 5">${[1,2,3,4,5].map(i=>`<i class="${l>=i?'on':''}">${'▁▂▃▅▇'[i-1]}</i>`).join('')}</span>`;
const tipHTML=()=>`<p class="fb tip">Super didn't reach the page. Your OS grabbed it. Try <b>Lock keys</b> or pick a stand-in in <b>Key setup</b>.</p>`;
function optsHTML(opts,correct){return `<div class="opts">${opts.map(o=>`<button class="opt${D.wrongOpt===o?' wrong':''}" data-opt="${o}">${caps(o)}</button>`).join('')}</div>`}
function renderCoach(){const c=$('#coach');const m=CFG.mode;let h='';
  document.querySelectorAll('#modes button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===m));
  if(m==='learn'){
    if(L.lesson==null){h=`<div class="chead"><span class="eyebrow">Learn</span><span class="small">${CFG.done.length}/${LESSONS.length} done</span></div><div class="cbody">
      <p class="sub">Short guided runs that follow the Navigation chapter of the Omarchy manual. Each step shows the keys. Do them on the fake desktop.</p>
      <div class="lessons">${LESSONS.map((l,i)=>`<button class="lesson" data-lesson="${i}"><span class="n">${i+1}</span><span class="t">${l.t}<span class="d">${l.d} · ${l.steps.length} steps</span></span><span class="ck">${CFG.done.includes(i)?'done':''}</span></button>`).join('')}</div></div>`}
    else{const Ls=LESSONS[L.lesson];
      if(L.done){h=`<div class="chead"><span class="eyebrow">Lesson ${L.lesson+1} · ${Ls.t}</span></div><div class="cbody"><p class="ask">Lesson done.</p>${L.note?`<p class="note">${L.note}</p>`:''}
        <p class="sub">Drill mode will keep these in rotation until they stick.</p><div class="row2">${L.lesson+1<LESSONS.length?`<button class="btn pri" data-lesson="${L.lesson+1}">Next: ${LESSONS[L.lesson+1].t}</button>`:''}<button class="btn" data-go="drill">Drill these</button><button class="btn" data-back>All lessons</button></div></div>`}
      else{const st=Ls.steps[L.step];const opts=L.opts||(L.opts=shuffle([st.keys[0],...distractors(st.keys,'basics')]));
        h=`<div class="chead"><span class="eyebrow">Lesson ${L.lesson+1} · ${Ls.t}</span><button class="btn" data-back>All lessons</button></div><div class="cbody">
        ${hostWarn()}<div class="prog"><span class="blk">${blocks(L.step/Ls.steps.length,16)}</span><span>${L.step+1}/${Ls.steps.length}</span></div>
        ${L.note?`<p class="note">${L.note}</p>`:''}
        <p class="ask">${st.say}</p>
        ${CFG.input==='taps'?optsHTML(st.keys.length?opts:[]):`<div class="keys">${capsAll(st.keys.map(canon))}</div>`}
        ${L.fb==='tip'?tipHTML():`<p class="fb bad">${esc(L.fb||'')}</p>`}
        <div class="row2"><button class="btn" data-restart>Restart lesson</button></div></div>`}}}
  else if(m==='drill'){const a=D.item;const total=ACTS.filter(x=>x.drill&&x.ask).length;const locked=ACTS.filter(x=>x.drill&&x.ask&&P(x.id).l>=4).length;
    h=`<div class="chead"><span class="eyebrow">Drill</span><span class="small">streak <b>${D.streak}</b> · ${D.tries?Math.round(D.right/D.tries*100):100}% right</span></div><div class="cbody">
      ${hostWarn()}<div class="chips">${Object.entries(DECKS).map(([k,v])=>`<button class="chip" data-deck="${k}" aria-pressed="${CFG.decks.includes(k)}">${v}</button>`).join('')}</div>
      ${a?`<p class="ask">${esc(D.ask)}</p>
      ${CFG.input==='taps'?optsHTML(D.opts):`<div class="keys${D.revealed?'':' veil'}">${capsAll(a.keys)}</div>${!D.revealed&&D.hintMs?`<div class="hint"><i style="animation-duration:${D.hintMs}ms"></i></div>`:''}`}
      ${D.tip&&!D.fb?tipHTML():`<p class="fb ${D.fbc}">${esc(D.fb)}</p>`}
      ${a.os?`<p class="os">${a.os}</p>`:''}
      <div class="row2"><span class="small">Level</span>${mast(P(a.id).l)}<button class="btn" data-skip style="margin-left:auto">Skip</button></div>`:''}
      <div class="meter"><span>Locked in ${locked} of ${total} shortcuts</span><span class="blk">${blocks(locked/total,24)}</span></div>
      <p class="small">Keys stay hidden once you know them. Get one wrong and it drops a level and comes back sooner.</p></div>`}
  else if(m==='blitz'){const B=D.blitz;
    if(!B||B.done){const res=B&&B.done;let slow='';
      if(res&&B.times.length){const by={};B.times.forEach(([id,ms])=>{(by[id]=by[id]||[]).push(ms)});slow=Object.entries(by).map(([id,v])=>[id,v.reduce((a,b)=>a+b)/v.length]).sort((a,b)=>b[1]-a[1]).slice(0,3)
        .map(([id,ms])=>{const x=ACTS.find(a=>a.id===id);return `<div class="krow"><span>${x.label}</span><span class="small">${(ms/1000).toFixed(2)}s</span><span class="kk">${caps(x.keys[0])}</span></div>`}).join('')}
      h=`<div class="chead"><span class="eyebrow">Blitz · 60 seconds</span><span class="small">best <b>${CFG.best}</b></span></div><div class="cbody">
      ${res?`<div class="blitzhead"><div><span class="small">${B.newBest?'New best':'Score'}</span><div class="big">${B.score}</div></div><div class="small">${B.right} right · ${B.wrong} wrong</div></div>${slow?`<div><p class="sub" style="margin-bottom:4px">Slowest this run</p>${slow}</div>`:''}`
      :`<p class="ask">How many can you land in a minute?</p><p class="sub">Uses your Drill decks. Faster answers score more, and every 5 in a row raises the multiplier up to ×4. A miss resets it.</p>`}
      <div class="row2"><button class="btn pri" data-blitz>${res?'Go again':'Start'}</button></div>
      <div class="chips">${Object.entries(DECKS).map(([k,v])=>`<button class="chip" data-deck="${k}" aria-pressed="${CFG.decks.includes(k)}">${v}</button>`).join('')}</div></div>`}
    else{const a=D.item;h=`<div class="chead"><span class="eyebrow">Blitz</span><span class="mult">×${B.mult}</span></div><div class="cbody">
      <div class="blitzhead"><div><span class="small">Score</span><div class="big">${B.score}</div></div><div style="text-align:right"><span class="small">Left</span><div class="big" id="bclock">${Math.max(0,(B.end-performance.now())/1000).toFixed(1)}</div></div></div>
      ${a?`<p class="ask">${esc(D.ask)}</p>${CFG.input==='taps'?optsHTML(D.opts):`<div class="keys${D.revealed?'':' veil'}">${capsAll(a.keys)}</div>${!D.revealed?`<div class="hint"><i style="animation-duration:${D.hintMs}ms"></i></div>`:''}`}`:''}
      <p class="fb ${D.fbc}">${esc(D.fb)}</p></div>`}}
  else if(m==='free'){h=`<div class="chead"><span class="eyebrow">Free play</span><button class="btn" data-resetdesk>Reset desktop</button></div><div class="cbody">
      <p class="sub">No prompts. Drive the desktop however you like and watch what each shortcut does. Super + K shows the cheat sheet inside the screen.</p>
      ${CFG.input==='taps'?`<p class="fb tip">Free play needs a keyboard. Switch to Learn or Drill to practise by tapping.</p>`:''}
      <div class="log">${freeLog.length?freeLog.map(l=>`<div>${caps(l.combo)}<span class="${l.bad?'fb bad':'small'}">${esc(l.label)}</span></div>`).join(''):'<span class="small">Try Super + Return, then Super + Shift + Return.</span>'}</div></div>`}
  else if(m==='keys'){const q=(D.q||'').toLowerCase();
    h=`<div class="chead"><span class="eyebrow">Keys</span><span class="small">Super + K in Omarchy</span></div><div class="cbody">
      <input class="ksearch" id="ksearch" placeholder="Filter: workspace, float, theme…" value="${esc(D.q||'')}" aria-label="Filter shortcuts">
      <div class="klist">${Object.entries(DECKS).map(([k,v])=>{const rows=ACTS.filter(a=>a.deck===k&&(!q||a.label.toLowerCase().includes(q)||plain(a.keys[0]).toLowerCase().includes(q)||(a.ask&&askText(a).toLowerCase().includes(q))));
        return rows.length?`<div class="kgroup"><h5>${v}</h5>${rows.map(a=>`<div class="krow"><span>${esc(a.label)}${a.os?' <span class="os">*</span>':''}</span>${a.drill&&a.ask?mast(P(a.id).l):'<span></span>'}<span class="kk">${capsAll(a.keys)}</span></div>`).join('')}</div>`:''}).join('')}</div>
      <p class="small"><span class="os">*</span> often grabbed by Windows or macOS. Lock keys helps.</p></div>`}
  c.innerHTML=h;
  const say=m==='learn'&&L.lesson!=null&&!L.done?(LESSONS[L.lesson].steps[L.step]||{}).say:(m==='drill'||m==='blitz')&&D.item?D.ask:'';
  if(say&&$('#live').textContent!==say)$('#live').textContent=say;
  if(m==='keys'){const s=$('#ksearch');s.addEventListener('input',e=>{D.q=e.target.value;const pos=e.target.selectionStart;renderCoach();const n=$('#ksearch');n.focus();n.setSelectionRange(pos,pos)})}
}

const castLog=[];
function cast(combo,label,bad){castLog.unshift({combo,label,bad});castLog.length=Math.min(castLog.length,4);
  $('#cast').innerHTML=castLog.map(c=>`<span class="ev">${caps(c.combo)}<span class="lbl${c.bad?' bad':''}">${esc(c.label)}</span></span>`).join('');
  freeLog.unshift({combo,label,bad});freeLog.length=Math.min(freeLog.length,14);if(CFG.mode==='free')renderCoach()}

export { cast, renderCoach };
