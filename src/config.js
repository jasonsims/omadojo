import { store } from './lib/util.js';

// User settings (omadojo.cfg) and per-shortcut mastery (omadojo.prog) in localStorage.
const CFG=Object.assign({theme:'auto',sound:true,standin:null,input:null,decks:['basics','tiling','workspaces'],mode:'learn',wp:0,best:0,done:[]},store.get('cfg',{}));
if(!CFG.input)CFG.input=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches?'taps':'keys';
const saveCfg=()=>store.set('cfg',CFG);
const PROG=store.get('prog',{});
const P=id=>PROG[id]||(PROG[id]={l:0,n:0,ok:0,ms:0});
const saveProg=()=>store.set('prog',PROG);
function resetProgress(){for(const id of Object.keys(PROG))delete PROG[id];saveProg();CFG.done=[];CFG.best=0;saveCfg()}

const THEMES=[['auto','System'],['tokyo-night','Tokyo Night'],['catppuccin','Catppuccin'],['gruvbox','Gruvbox'],['everforest','Everforest'],['nord','Nord'],
  ['rose-pine','Rosé Pine'],['kanagawa','Kanagawa'],['matte-black','Matte Black'],['catppuccin-latte','Catppuccin Latte'],['flexoki-light','Flexoki Light']];
function setTheme(id){if(!THEMES.some(t=>t[0]===id))id='auto';CFG.theme=id;saveCfg();return id}

export { CFG, P, resetProgress, saveCfg, saveProg, setTheme, THEMES };
