import { CFG } from '../config.js';

// Short success and miss beeps.
let AC=null;
function beep(ok){if(!CFG.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();
  o.type=ok?'triangle':'square';const t=AC.currentTime;o.frequency.setValueAtTime(ok?660:150,t);if(ok)o.frequency.exponentialRampToValueAtTime(1320,t+.08);
  g.gain.setValueAtTime(ok?.08:.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+(ok?.14:.18));o.connect(g).connect(AC.destination);o.start(t);o.stop(t+.2)}catch(e){}}

export { beep };
