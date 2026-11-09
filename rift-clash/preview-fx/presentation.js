(function(root){
'use strict';
// Presentation only: no event consumption, timers, cached actor or simulation writes.
// Call drawStage after scenery/before actors; drawOverlay in screen space before HUD.
const WIDTH=1200,HEIGHT=640,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=p=>p*p*(3-2*p);
function describe(f,side){
 const a=f?.attack,m=a?.move;if(f?.hero==='zenitsu')return null;
 if(a?.name!=='ultimate'||!m||![a.t,m.startup,m.active,m.end].every(Number.isFinite)||m.startup<=0||m.active<=0||m.end<=m.startup||a.t<0||a.t>=m.end)return null;
 const startup=m.startup,end=m.end,active=m.active;
 // Mirror motion-preview's authored recoil window. active=1 is gun emission,
 // not the end of the six/five scheduled shots; this never extends a hitbox.
 const volley=f.hero==='lara'||f.hero==='drake';
 const interval=volley?(f.hero==='lara'?6:7):Math.max(1,m.interval||active);
 const strikes=volley?(f.hero==='lara'?6:5):Math.ceil(active/interval);
 const releaseEnd=Math.min(end-1,startup+(volley?(strikes-1)*interval+3:active));
 const phase=a.t<startup?'startup':a.t<releaseEnd?'release':'recovery';
 const start=phase==='startup'?0:phase==='release'?startup:releaseEnd;
 const stop=phase==='startup'?startup:phase==='release'?releaseEnd:end;
 const phaseProgress=clamp((a.t-start)/Math.max(1,stop-start));
 return {hero:f.hero,side,name:f.info?.name||f.hero,move:m.displayName||f.info?.ultimate||'奥义',color:f.color||f.info?.color||'#d5ecdf',
  phase,progress:clamp(a.t/end),phaseProgress,t:a.t,startup,active,end,releaseEnd,
  finisher:phase==='release'&&a.t>=startup+(strikes-1)*interval};
}
function inspect(world){
 if(!world||world.result)return null;
 const actors=[describe(world.p1,'p1'),describe(world.p2,'p2')].filter(Boolean);
 if(world.cutin){
  const c=world.cutin,actor=actors.find(a=>a.hero===c.hero);
  // The portrait owns its countdown. Stage and overlay remain still while the
  // world is frozen, including during changes to cutin.remaining.
  return {...(actor||{}),hero:c.hero,side:actor?.side||null,name:c.name||actor?.name||'',move:c.move||actor?.move||'奥义',color:c.color||actor?.color||'#d5ecdf',phase:'cutin',progress:actor?.progress||0,phaseProgress:0,finisher:false};
 }
 // Stable, stateless arbitration if both fighters cast: contact reads first,
 // then anticipation, then recovery. No remembered winner survives a reset.
 const rank={release:0,startup:1,recovery:2};
 actors.sort((a,b)=>rank[a.phase]-rank[b.phase]);
 return actors[0]||null;
}
function depth(p,reducedMotion){
 if(p.phase==='cutin')return reducedMotion?.24:.9;
 const q=smooth(p.phaseProgress);
 const normal=p.phase==='startup'?.25+.4*q:p.phase==='release'?.28:.28*(1-q);
 return reducedMotion?normal*.28:normal;
}
function drawStage(ctx,world,{reducedMotion=false}={}){
 const p=inspect(world);if(!p)return;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=depth(p,reducedMotion);
 ctx.fillStyle='#02060b';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.restore();
}
function drawOverlay(ctx,world,{reducedMotion=false,flash=true}={}){
 const p=inspect(world);if(!p)return;
 const recovery=p.phase==='recovery'?1-smooth(p.phaseProgress):1;
 const height=reducedMotion?8:p.phase==='startup'?12+8*smooth(p.phaseProgress):20;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=(reducedMotion?.38:.76)*recovery;
 ctx.fillStyle='#02060b';ctx.fillRect(0,0,WIDTH,height);ctx.fillRect(0,HEIGHT-height,WIDTH,height);
 // The horizontal portrait already names the move. Avoid duplicate type over it.
 if(p.phase!=='cutin'){
  ctx.globalAlpha=.6*recovery;ctx.fillStyle='#071219';ctx.fillRect(340,113,520,48);
  ctx.globalAlpha=.9*recovery;ctx.fillStyle='#e9f2ed';ctx.font='700 19px "Noto Sans SC",system-ui,sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.move,600,137,490);
  // A narrow held accent marks the final authored strike, never a fake hit/KO.
  // No whiteout, strobe, moving rays or replacement for the approved FX sheets.
  if(p.finisher&&!reducedMotion&&flash){ctx.globalAlpha=.9;ctx.fillStyle=p.color;ctx.fillRect(510,160,180,2);}
 }
 ctx.restore();
}
root.RiftPresentation={inspect,drawStage,drawOverlay};
if(typeof module!=='undefined')module.exports=root.RiftPresentation;
})(typeof window!=='undefined'?window:globalThis);
