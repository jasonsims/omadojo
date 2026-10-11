import { THEMES } from '../config.js';
import { effects, osd, S } from '../model/desktop.js';
import { ACTS } from './act.js';

// Menus and panels drawn inside the screen, and arrow/Return/Esc navigation while one is open.
const OV={
  menu:{t:'Omarchy',items:()=>['Apps','Learn','Trigger','Share','Style','Setup','Install','Remove','Update','About','System'],input:'Search…'},
  apps:{t:'Apps',items:()=>['Terminal','Chromium','Files','Neovim','Obsidian','Spotify','Signal','LibreOffice','Kdenlive','OBS Studio'],input:'Search apps…'},
  system:{t:'System',items:()=>['Lock','Screensaver','Suspend','Restart','Shutdown']},
  keys:{t:'Keybindings',items:()=>['terminal','browser','close','menu','focus-left','swap-right','split','float','full','ws2','mv2','scratch','group','theme'].map(id=>ACTS.find(a=>a.id===id)).map(a=>[a.label,a.keys[0]])},
  clip:{t:'Clipboard',items:()=>S.clip.slice(0,6)},
  history:{t:'Notifications',items:()=>S.hist.length?S.hist.slice(0,6).map(n=>n.title+' · '+n.body):['Nothing yet']},
  theme:{t:'Theme',items:()=>THEMES.slice(1).map(t=>t[1])},
  capture:{t:'Capture',items:()=>['Screenshot','Screenrecord','Color picker','Text extraction']},
  hardware:{t:'Hardware',items:()=>['Audio','Bluetooth','Wifi','Display','Power','Keyboard']},
  reminder:{t:'Set a reminder',items:()=>['in 25m stretch','at 17:00 ship it','tomorrow 9:00 standup'],input:'in 25m stretch'},
  emoji:{t:'Emoji',grid:['😄','😂','😍','✌️','❤️','👍','👎','🤞','🤘','😘','🙄','😉','🙏','🤤','💰','🎉','💯','🥂','👌','👋','💪']},
};
const PANELS={audio:[['Output','Speakers'],['Volume','▮▮▮▮▮▮▯▯▯▯ 60%'],['Input','Mic']],bluetooth:[['Bluetooth','On'],['Keychron K3','connected'],['AirPods','paired']],
  wifi:[['Wifi','home-5g'],['Signal','▂▄▆█'],['Other','cafe-guest']],display:[['Display','eDP-1'],['Scale','1.6x'],['Nightlight',()=>S.night?'on':'off']],power:[['Battery','82%'],['Profile','balanced'],['Lid','suspend']]};
function ovItems(){const o=OV[S.overlay];return o&&o.items?o.items():[]}
function ovNav(c){
  if(S.overlay==='lock'){if(c==='escape'||c==='return'){S.overlay=null;osd('Unlocked')}return}
  if(c==='escape'){S.overlay=null;return}
  const it=ovItems();if(!it.length){if(c==='return')S.overlay=null;return}
  if(c==='down')S.ovIdx=(S.ovIdx+1)%it.length;
  if(c==='up')S.ovIdx=(S.ovIdx-1+it.length)%it.length;
  if(c==='return'){const pick=it[S.ovIdx];
    if(S.overlay==='theme'){effects.theme(THEMES[S.ovIdx+1][0]);osd('Theme: '+THEMES[S.ovIdx+1][1])}
    else osd((Array.isArray(pick)?pick[0]:pick)+(S.overlay==='clip'?' pasted':''));
    S.overlay=null}}

export { OV, ovNav, PANELS };
