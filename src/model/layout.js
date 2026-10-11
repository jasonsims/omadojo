// Pure geometry. Rectangles are normalized (0-1) to the work area under the top bar.
const tiled=ws=>ws.slots.map(sl=>sl.wins[sl.active]);

let ASPECT=960/578;// work area width / height; the view keeps it in sync with the screen
const setAspect=a=>{ASPECT=a};
// Rectangles of the tiled windows by id. Dwindle: each window takes ratios[i] of the remaining rect,
// split along the longer side unless flips[i]. Scrolling: a strip of columns; ws.scroll keeps focus in view.
function tileRects(ws){const ids=tiled(ws),out={},orient={};
  if(ws.layout==='scrolling'){let x=0;const pos={};const cw=id=>ids.length===1?1:(ws.colW[id]||.6);
    ids.forEach(id=>{pos[id]=x;x+=cw(id)});const f=ws.focus;
    if(pos[f]!=null){if(pos[f]<ws.scroll)ws.scroll=pos[f];if(pos[f]+cw(f)>ws.scroll+1)ws.scroll=pos[f]+cw(f)-1}
    ws.scroll=Math.max(0,Math.min(ws.scroll,Math.max(0,x-1)));
    ids.forEach(id=>out[id]={x:pos[id]-ws.scroll,y:0,w:cw(id),h:1});return{rects:out,orient}}
  let r={x:0,y:0,w:1,h:1};const ar=ASPECT;
  ids.forEach((id,i)=>{if(i===ids.length-1){out[id]=r;return}
    let side=r.w*ar>=r.h;if(ws.flips[i])side=!side;orient[i]=side?'h':'v';const k=ws.ratios[i]??.5;
    if(side){out[id]={x:r.x,y:r.y,w:r.w*k,h:r.h};r={x:r.x+r.w*k,y:r.y,w:r.w*(1-k),h:r.h}}
    else{out[id]={x:r.x,y:r.y,w:r.w,h:r.h*k};r={x:r.x,y:r.y+r.h*k,w:r.w,h:r.h*(1-k)}}});
  return{rects:out,orient}}
const floatRect=(i,a)=>{const w=a==='calc'?.26:.5,h=a==='calc'?.5:.55;return{x:.25+.05*i,y:.14+.06*i,w,h}};

// The tiled window nearest to rect fr (window f) in a direction, or null.
function nearest(rects,f,fr,dir){
  const e=.002,cx=fr.x+fr.w/2,cy=fr.y+fr.h/2;let best=null,bs=1e9;
  for(const k of Object.keys(rects)){const id=+k;if(id===f)continue;const r=rects[k];
    const oy=r.y<fr.y+fr.h-e&&r.y+r.h>fr.y+e,ox=r.x<fr.x+fr.w-e&&r.x+r.w>fr.x+e;let ok=false,d=0;
    if(dir==='left'){ok=r.x+r.w<=fr.x+e;d=(fr.x-(r.x+r.w))*10+Math.abs(r.y+r.h/2-cy)+(oy?0:5)}
    if(dir==='right'){ok=r.x>=fr.x+fr.w-e;d=(r.x-(fr.x+fr.w))*10+Math.abs(r.y+r.h/2-cy)+(oy?0:5)}
    if(dir==='up'){ok=r.y+r.h<=fr.y+e;d=(fr.y-(r.y+r.h))*10+Math.abs(r.x+r.w/2-cx)+(ox?0:5)}
    if(dir==='down'){ok=r.y>=fr.y+fr.h-e;d=(r.y-(fr.y+fr.h))*10+Math.abs(r.x+r.w/2-cx)+(ox?0:5)}
    if(ok&&d<bs){bs=d;best=id}}
  return best}

export { floatRect, nearest, setAspect, tiled, tileRects };
