import { $ } from '../lib/util.js';
import { THEMES } from '../config.js';

// Restyles the page for a theme id that setTheme() has already validated and saved.
function applyTheme(id){const r=document.documentElement;
  if(id==='auto')r.removeAttribute('data-om');else r.setAttribute('data-om',id);
  $('#bTheme').textContent='Theme: '+THEMES.find(t=>t[0]===id)[1]}

export { applyTheme };
