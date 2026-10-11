import { $, esc } from '../lib/util.js';
import { CFG } from '../config.js';
import { host, PLAT, PLAT_NOTE, STANDINS } from '../input/host.js';

// The Key setup drawer: stand-in Super key and keyboard vs tapping.
function openSetup(on){const s=$('#setup');s.hidden=!on;$('#bSetup').classList.toggle('on',on);if(on)s.scrollIntoView({block:'nearest'})}

function renderSetup(){$('#standinSeg').innerHTML=STANDINS.map(([c,l])=>`<button class="btn" data-si="${c}" aria-pressed="${host.capturing?c==='capture':(CFG.standin===c||(!STANDINS.some(s=>s[0]===CFG.standin)&&c==='capture'&&CFG.standin))}">${c==='capture'&&CFG.standin&&!STANDINS.slice(0,4).some(s=>s[0]===CFG.standin)?'Custom: '+esc(CFG.standin):l}</button>`).join('');
  $('#platNote').textContent=PLAT_NOTE;
  $('#standinNote').textContent=host.capturing?'Press the key you want to use as Super…':CFG.standin?`While you hold ${(STANDINS.find(x=>x[0]===CFG.standin)||[0,CFG.standin])[1]}, it counts as Super.${CFG.standin==='AltRight'&&PLAT!=='mac'?' On some layouts Right Alt is AltGr and also reports Ctrl.':''}`:'Using the real Super key.';
  document.querySelectorAll('#inputSeg .btn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.input===CFG.input))}

export { openSetup, renderSetup };
