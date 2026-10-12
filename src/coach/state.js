import { shuffle } from '../lib/util.js';
import { CFG, P } from '../config.js';
import { ACTS } from '../actions/index.js';
import { trainable } from '../input/host.js';

// Coach state shared by the engine and the coach panel: Drill (D), Learn (L), and the drill picker.
// pick() weights shortcuts by mastery level 0-5 so weak ones come up more often. The pool skips shortcuts
// the user's OS takes before the page sees them (see input/host.js).
const D={item:null,t0:0,revealed:false,missed:false,cool:false,streak:0,right:0,tries:0,last:[],fb:'',fbc:'',tip:false,opts:null,timers:[],blitz:null,wrongOpt:null};
const L={lesson:null,step:0,note:'',fb:'',opts:null,done:false};

const askText=a=>typeof a.ask==='function'?a.ask():a.ask;
function poolActs(){const ok=a=>a.drill&&a.ask&&trainable(a);const p=ACTS.filter(a=>ok(a)&&CFG.decks.includes(a.deck));return p.length?p:ACTS.filter(a=>ok(a)&&a.deck==='basics')}
function pick(){let pool=poolActs().filter(a=>!D.last.includes(a.id));if(!pool.length)pool=poolActs();const ws=pool.map(a=>{const p=P(a.id);return Math.pow(6-p.l,2)+(p.n===0?6:0)});
  let r=Math.random()*ws.reduce((a,b)=>a+b,0);for(let i=0;i<pool.length;i++){r-=ws[i];if(r<=0)return pool[i]}return pool[pool.length-1]}
function distractors(keys,deck){const others=ACTS.filter(a=>a.keys[0]!==keys[0]&&!keys.includes(a.keys[0])&&a.keys[0].includes('super'));
  const same=shuffle(others.filter(a=>a.deck===deck)),rest=shuffle(others);const out=[];for(const a of[...same,...rest]){if(out.length>=3)break;if(!out.includes(a.keys[0]))out.push(a.keys[0])}return out}

const freeLog=[];

export { askText, D, distractors, freeLog, L, pick, poolActs };
