import { openApp } from '../model/desktop.js';
import { act } from './act.js';
import { prep, trim } from './ensure.js';

// App launchers (Omarchy manual: Hotkeys).
const AK=[['tmux','super+alt+return','Tmux terminal'],['herdr','super+ctrl+return','Herdr (agent manager)'],['private','super+alt+shift+b','Private browser'],
 ['nvim','super+shift+n','Editor (Neovim)'],['music','super+shift+m','Music (Spotify)'],['btop','super+ctrl+t','Activity (btop)'],['passwords','super+shift+slash','Password manager'],
 ['obsidian','super+shift+o','Obsidian'],['email','super+shift+e','Email (HEY)'],['calendar','super+shift+c','Calendar (HEY)'],['chatgpt','super+shift+a','AI (ChatGPT)'],
 ['grok','super+alt+shift+a','AI (Grok)'],['signal','super+shift+g','Messenger (Signal)'],['whatsapp','super+alt+shift+g','WhatsApp'],['youtube','super+shift+y','YouTube'],
 ['docker','super+shift+d','Docker (LazyDocker)'],['write','super+shift+w','Writing (Omawrite)'],['maps','super+shift+s','Google Maps'],['photos','super+shift+p','Google Photos'],
 ['x','super+shift+x','X'],['calc','super+ctrl+q','Calculator']];
const AK_DRILL=['tmux','nvim','music','btop','passwords','obsidian','email','calendar','docker','herdr','chatgpt'];
for(const[app,k,l]of AK)act('app-'+app,'apps',[k],l,()=>openApp(app),{ask:'Launch '+l,drill:AK_DRILL.includes(app),ensure:()=>{prep();trim(3)}});
