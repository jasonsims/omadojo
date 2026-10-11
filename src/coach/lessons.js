import { notify, S } from '../model/desktop.js';

// Learn mode: scripted lessons that follow the Navigation chapter of the Omarchy manual.
// Each step is {say, keys, note, pre}; pre() runs before the step is shown.
const LESSONS=[
 {t:'Tiling basics',d:'Open, stack, swap, float and close windows',setup:[],steps:[
  {say:'Open a terminal.',keys:['super+return'],note:'Every window opens tiled. No dragging, no overlapping.'},
  {say:'Open the browser next to it.',keys:['super+shift+return'],note:'Hyprland split the screen for you. Focus jumps to the new window.'},
  {say:'Stack the two windows on top of each other.',keys:['super+j']},
  {say:'Put them back side by side.',keys:['super+j'],note:'Super + J flips whichever split the focused window sits in.'},
  {say:'Swap the browser over to the left.',keys:['super+shift+left'],note:'Super + Shift + arrow swaps. Plain Super + arrow only moves focus.'},
  {say:'Move focus to the terminal on the right.',keys:['super+right']},
  {say:'Launch the activity monitor. It opens floating.',keys:['super+ctrl+t']},
  {say:'Tile it into the layout.',keys:['super+t'],note:'Super + T toggles any window between tiled and floating.'},
  {say:'Open the file manager for a four-way split.',keys:['super+shift+f'],note:'Each new window splits the focused one. That spiral is the dwindle layout.'},
  {say:'Close the focused window.',keys:['super+w','super+q'],note:'Super + W and Super + Q both close. Pick whichever your hand finds first.'}]},
 {t:'Workspaces',d:'Spread work across 1 to 4, plus the scratchpad',setup:['terminal','browser'],steps:[
  {say:'Send the browser to workspace 2. You follow it.',keys:['super+shift+2']},
  {say:'Jump back to workspace 1.',keys:['super+1'],note:'Workspaces are just Super + number. Watch the bar at the top left.'},
  {say:'Send the terminal to workspace 3 without following it.',keys:['super+alt+shift+3'],note:'Adding Alt keeps you where you are.'},
  {say:'Hop to the next workspace.',keys:['super+tab']},
  {say:'Jump back to the workspace you were just on.',keys:['super+ctrl+tab']},
  {say:'Drop down the scratchpad.',keys:['super+s','super+backquote'],note:'The scratchpad slides over whatever workspace you are on, like a Quake console.'},
  {say:'Open a terminal on it.',keys:['super+return']},
  {say:'Hide the scratchpad again.',keys:['super+s','super+backquote'],note:'Your scratchpad terminal keeps running in the background. The S in the bar marks it.'}]},
 {t:'Big, small, floating',d:'Full screen, sticky windows and the scrolling layout',setup:['terminal','browser'],steps:[
  {say:'Make the browser full screen.',keys:['super+f']},
  {say:'Leave full screen.',keys:['super+f']},
  {say:'Go full width, keeping the top bar.',keys:['super+alt+f']},
  {say:'Back to normal.',keys:['super+alt+f']},
  {say:'Pop the browser out as a sticky floating window.',keys:['super+o'],note:'Popped windows follow you across workspaces. Great for a video.'},
  {say:'Go to workspace 2.',keys:['super+2'],note:'The popped window came along.'},
  {say:'Come back to workspace 1.',keys:['super+1']},
  {say:'Put the popped window back into the tiling.',keys:['super+o']},
  {say:'Switch this workspace to the scrolling layout.',keys:['super+l'],note:'Windows now line up in a strip that runs past the screen edge.'},
  {say:'Open another terminal.',keys:['super+return']},
  {say:'Move focus left along the strip.',keys:['super+left'],note:'The strip scrolls to keep focus in view.'},
  {say:'Back to dwindle.',keys:['super+l']}]},
 {t:'Groups',d:'Stack windows as tabs in one tile',setup:['terminal','browser'],steps:[
  {say:'Turn the browser into a group.',keys:['super+g']},
  {say:'Open a terminal. It joins the group as a tab.',keys:['super+return']},
  {say:'Switch to the previous tab.',keys:['super+ctrl+left']},
  {say:'Switch to the next tab.',keys:['super+ctrl+right']},
  {say:'Cycle through the tabs.',keys:['super+alt+tab']},
  {say:'Pull this window out of the group.',keys:['super+alt+g']},
  {say:'Focus the group on the left.',keys:['super+left']},
  {say:'Break the group apart.',keys:['super+g']}]},
 {t:'Menus & system',d:'The Omarchy menu, themes, clipboard, notifications',setup:['terminal'],steps:[
  {say:'Open the Omarchy menu.',keys:['super+space'],note:'Almost everything lives in here. Arrow keys move, Return picks.'},
  {say:'Close it.',keys:['escape']},
  {say:'Show the keybindings cheat sheet.',keys:['super+k']},
  {say:'Close it.',keys:['escape']},
  {say:'Open the system menu.',keys:['super+escape']},
  {say:'Close it.',keys:['escape']},
  {say:'Open the theme picker.',keys:['super+ctrl+shift+space']},
  {say:'Move down one theme.',keys:['down']},
  {say:'Apply it.',keys:['return'],note:'That really changed this page. Omarchy restyles the whole system the same way.'},
  {say:'Copy. It works in terminals too.',keys:['super+c'],note:'Omarchy unifies copy and paste so the terminal needs no Shift.'},
  {say:'Open the clipboard history.',keys:['super+ctrl+v']},
  {say:'Close it.',keys:['escape']},
  {say:'Dismiss the latest notification.',keys:['super+comma'],pre:()=>{const s=S.silent;S.silent=false;notify('Calendar','Standup in 5 minutes');S.silent=s}},
  {say:'Lock the computer.',keys:['super+ctrl+l']},
  {say:'Unlock it.',keys:['escape','return']}]},
];

export { LESSONS };
