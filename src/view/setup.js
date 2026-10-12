import { $, esc } from '../lib/util.js';
import { caps } from '../lib/keys.js';
import { CFG } from '../config.js';
import { BIND } from '../actions/index.js';
import { CONFLICTS, host, plat, platName } from '../input/host.js';

// The Key setup drawer: which OS you practise on and what can't be trained there, plus keyboard vs tapping.
function openSetup(on){const s=$('#setup');s.hidden=!on;$('#bSetup').classList.toggle('on',on);if(on)s.scrollIntoView({block:'nearest'})}

function renderSetup(){
  document.querySelectorAll('#platSeg .btn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.plat===plat()));
  const all=Object.entries(CONFLICTS[plat()]).filter(([k])=>BIND[k]).map(([k,c])=>({k,c,a:BIND[k]}));
  const live=all.filter(x=>!(x.c.lock&&host.keylock)).sort((x,y)=>(y.c.d||0)-(x.c.d||0));
  $('#platSum').textContent=!all.length
    ?'Nothing is blocked by default. On Omarchy itself, Hyprland acts on every Super combo for real, so use Lock keys or practise on the real desktop.'
    :`${live.length} shortcut${live.length===1?'':'s'} can't be trained on ${platName()}${host.keylock?' even with keys locked':''}. They're left out of Drill and Blitz, and lessons offer "Do it for me".`
      +(plat()==='win'&&!host.keylock?' Lock keys gets most of them back, except Win + L and Ctrl + Alt + Delete.':'');
  $('#blist').innerHTML=live.map(x=>`<div><span class="kk">${caps(x.k)}</span><span><span>${esc(x.a.label)}</span><span class="why${x.c.d?' danger':''}">${esc(x.c.why)}</span></span></div>`).join('');
  document.querySelectorAll('#inputSeg .btn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.input===CFG.input))}

export { openSetup, renderSetup };
