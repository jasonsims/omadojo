import { $ } from '../lib/util.js';
import { setTheme, THEMES } from '../config.js';

// Applies the chosen Omarchy theme to the page.
function applyTheme(id){id=setTheme(id);const r=document.documentElement;
  if(id==='auto')r.removeAttribute('data-om');else r.setAttribute('data-om',id);
  $('#bTheme').textContent='Theme: '+THEMES.find(t=>t[0]===id)[1]}

export { applyTheme };
