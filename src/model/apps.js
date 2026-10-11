import { esc } from '../lib/util.js';

// The fake apps: launcher labels, which ones float, and the markup inside each window.
const CMDS=[['omarchy theme next','Theme set to Gruvbox'],['git status','On branch main, nothing to commit'],['hyprctl clients | wc -l','4'],
  ['yay -Syu','there is nothing to do'],['omarchy plugin list','omarchy.bar  enabled'],['ls ~/Work','dojo  notes  site'],['bin/dev','Puma starting on :3000']];
const term=(w,t)=>{const c=CMDS[w.id%CMDS.length];return `<div class="wtitle"><span>${t}</span><span>~/Work</span></div><div><span class="c1">~/Work</span> <span class="c2">❯</span> ${esc(c[0])}</div><div class="dm">${esc(c[1])}</div><div><span class="c1">~/Work</span> <span class="c2">❯</span> <span class="cur"></span></div>`};
const page=(url,extra='')=>()=>`<div class="url">${url}</div>${extra}<div class="sk h"></div><div class="sk"></div><div class="sk"></div><div class="sk s"></div><div class="sk"></div><div class="sk s"></div>`;
const APPS={
  terminal:{label:'Terminal',body:w=>term(w,'foot')},
  tmux:{label:'Tmux',body:w=>term(w,'tmux · 0:zsh*')},
  herdr:{label:'Herdr',body:w=>`<div class="wtitle"><span>herdr</span><span>agents</span></div><div><span class="c2">●</span> claude · fixing bar plugin</div><div><span class="c4">●</span> codex · waiting</div><div><span class="dm">●</span> opencode · idle</div>`},
  browser:{label:'Chromium',body:page('omarchy.org/manual/hotkeys')},
  private:{label:'Chromium (private)',body:page('<span class="c3">private</span> · new tab')},
  files:{label:'Files',body:()=>`<div class="wtitle"><span>Files</span><span>~/</span></div>${['Desktop','Documents','Downloads','Music','Pictures','Videos','Work'].map(f=>`<div><span class="c1">▸</span> ${f}</div>`).join('')}`},
  nvim:{label:'Neovim',body:()=>`<div><span class="c3">def</span> <span class="c1">tile</span>(windows)</div><div>&nbsp;&nbsp;windows.<span class="c4">dwindle!</span></div><div><span class="c3">end</span></div>${'<div class="dm">~</div>'.repeat(5)}<div class="nvst">NORMAL  dojo.rb</div>`},
  music:{label:'Spotify',body:()=>`<div class="wtitle"><span>Spotify</span><span>♫</span></div><div><b>Now playing</b></div><div class="dm">Tiling Dreams · The Workspaces</div><div class="sk" style="width:40%;background:var(--ok)"></div>`},
  btop:{label:'btop',float:true,body:()=>`<div class="wtitle"><span>btop</span><span>cpu 12%</span></div><div>cpu <span class="c2">▂▃▅▇▅▃▂▃▅▆</span></div><div>mem <span class="c4">▅▅▅▅▆▆▆▆▆▆</span></div><div>net <span class="c1">▁▁▂▁▃▁▁▂▁▁</span></div><div class="dm">proc hyprland 1.2%</div>`},
  passwords:{label:'1Password',float:true,body:()=>`<div class="wtitle"><span>1Password</span><span></span></div><div style="text-align:center;margin-top:1.2em">🔒<br>Unlock 1Password</div>`},
  calc:{label:'Calculator',float:true,body:()=>`<div style="text-align:right;font-size:1.4em">1337</div><div class="calcg">${'789÷456×123−0.=+'.split('').map(c=>`<span>${c}</span>`).join('')}</div>`},
  obsidian:{label:'Obsidian',body:()=>`<div class="wtitle"><span>Obsidian</span><span>vault</span></div><div class="c3"># Omarchy notes</div><div>- Super + J flips the split</div><div>- Super + S for scratchpad</div>`},
  email:{label:'HEY',body:page('app.hey.com/imbox')},
  calendar:{label:'HEY Calendar',body:page('app.hey.com/calendar')},
  chatgpt:{label:'ChatGPT',body:page('chatgpt.com')},
  grok:{label:'Grok',body:page('grok.com')},
  signal:{label:'Signal',body:()=>`<div class="wtitle"><span>Signal</span><span></span></div><div><span class="c1">Ana</span> did you try scrolling layout?</div><div><span class="c2">You</span> Super + L, love it</div>`},
  youtube:{label:'YouTube',body:page('youtube.com')},
  docker:{label:'LazyDocker',body:w=>`<div class="wtitle"><span>lazydocker</span><span></span></div><div><span class="c2">●</span> postgres  up 3h</div><div><span class="c2">●</span> redis     up 3h</div><div class="dm">○ mailcatcher</div>`},
  write:{label:'Omawrite',body:()=>`<div class="wtitle"><span>Omawrite</span><span>412 words</span></div><div>The trick is to stop reaching for the mouse.</div><div class="cur"></div>`},
  maps:{label:'Google Maps',body:page('maps.google.com')},
  photos:{label:'Google Photos',body:page('photos.google.com')},
  x:{label:'X',body:page('x.com/home')},
  whatsapp:{label:'WhatsApp',body:page('web.whatsapp.com')},
};

export { APPS };
