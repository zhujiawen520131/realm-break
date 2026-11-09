(function(root){
'use strict';
// R4 optional hand-painted FX. Draws from simulation-owned lifetimes only.
const pack=root.RiftFXData,images={},loaded={};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const defaults={
 cloud:{basic:[210,175],skill:[185,155],ultimate:[280,245]},
 lara:{basic:[90,65],skill:[165,65],ultimate:[125,85]},
 wukong:{basic:[235,180],skill:[150,170],ultimate:[460,205]},
 drake:{basic:[115,110],skill:[265,235],ultimate:[115,75]},
 tanjiro:{basic:[210,175],skill:[250,225],ultimate:[305,180]},
 zenitsu:{basic:[220,150],skill:[315,145],ultimate:[320,155]}
};
// Measured against the eight-frame weapon positions at contact. Offsets are
// local to the actor's feet and are mirrored only by the locked attack facing.
// Smaller translucent arcs leave the body and the actual weapon readable.
const contactAnchors={
 cloud:{slash1:[48,-52,.3],slash2:[62,-112,-.62],slash3:[65,-82,0],launcher:[61,-116,-.62],air:[88,-66,.04],skill:[38,-88,-.2],ultimate:[90,-48,.1]},
 wukong:{slash1:[56,-73,0],slash2:[58,-65,.22],slash3:[53,-65,.23],launcher:[67,-110,-.6],air:[62,-57,.36],skill:[46,-100,0],ultimate:[100,-84,0]},
 tanjiro:{slash1:[42,-55,.28],slash2:[67,-84,-.08],slash3:[52,-80,0],launcher:[39,-115,-.62],air:[74,-64,.2],skill:[24,-80,0],ultimate:[70,-80,0]},
 zenitsu:{slash1:[68,-80,0],slash2:[68,-80,0],slash3:[48,-64,.2],launcher:[48,-103,-.52],air:[67,-70,.08],skill:[24,-75,0],ultimate:[24,-75,0]}
};
const basicScale={cloud:.74,wukong:.76,tanjiro:.74,zenitsu:.66};
const basicOpacity={cloud:.7,wukong:.72,tanjiro:.7,zenitsu:.58};
const effectBindings=new WeakMap();
function attackPlacement(f,a,dir){
 const key=a?.name,profile=(root.RiftMotionData?.eightFrameMode&&contactAnchors[f?.hero]?.[key])||[48,-88,key==='launcher'?-.55:key==='slash2'?.28:0];
 return {x:(Number(f?.x)||0)+dir*profile[0],y:(Number(f?.y)||0)+profile[1],angle:profile[2]};
}
// Only suppress effects that are already painted into the actual body cel;
// the rest of the attack and other animation packs still use their FX sprites.
function bakedSlash(f,a){
 if(!root.RiftMotionData?.eightFrameMode||a?.name!=='slash3'||!['tanjiro','zenitsu'].includes(f?.hero))return false;
 const pose=root.RiftMotionPreview?.resolve?.(f);
 return pose?.clip==='attack3'&&pose.index>=3&&pose.index<=6;
}
function binding(e){
 let b=effectBindings.get(e);if(b)return b;
 const actor=e.owner,attack=actor?.attack||null,age=Math.max(0,(Number(e.max)||0)-(Number(e.life)||0));
 // In a low-frame-rate render, a newer attack may already have replaced the
 // emitter before this effect is first painted. Never bind an old stroke to it.
 const start=Number(attack?.move?.startup),tick=Number(attack?.t);
 const compatible=!attack||!Number.isFinite(start)||!Number.isFinite(tick)||(tick>=start&&tick-start+2>=age);
 b={actor,attack:compatible?attack:null,serial:actor?.attackSerial,last:{x:e.x,y:e.y,angle:e.angle||0}};effectBindings.set(e,b);return b;
}
function stillBound(b){return !!b.actor&&!!b.attack&&b.actor.attack===b.attack&&(b.serial===undefined||b.actor.attackSerial===b.serial);}

const ready=(async()=>{
 if(!pack?.heroes||typeof root.Image!=='function')return false;
 const tasks=[];
 for(const [hero,h] of Object.entries(pack.heroes)){
  images[hero]={};loaded[hero]={};
  for(const [id,clip] of Object.entries(h.clips||h)){
   if(!Array.isArray(clip?.frames))continue;
   images[hero][id]=[];loaded[hero][id]=false;
   if(clip.frames.length!==8){tasks.push(Promise.resolve(false));continue;}
   tasks.push(Promise.all(clip.frames.map((f,i)=>new Promise(resolve=>{
    if(!f.image||!Array.isArray(f.anchor)||f.anchor.length!==2||!f.anchor.every(Number.isFinite)||!(f.width>0&&f.height>0)){resolve(false);return;}
    const im=new root.Image();im.onload=()=>{images[hero][id][i]=im;resolve(true);};im.onerror=()=>resolve(false);if(root.RiftImageQueue)root.RiftImageQueue.load(im,f.image);else im.src=f.image;
   }))).then(ok=>loaded[hero][id]=ok.every(Boolean)));
  }
 }
 const ok=await Promise.all(tasks);return ok.length>0&&ok.every(Boolean);
})();
function clipFor(hero,id){const h=pack?.heroes?.[hero];return h?.clips?.[id]||h?.[id];}
function validSequence(input,fallback){const out=Array.isArray(input)?input.filter(i=>Number.isInteger(i)&&i>=0&&i<8):[];return out.length?out:fallback;}
function choose(frames,progress,indices){const ids=indices||frames.map((_,i)=>i),weights=ids.map(i=>Math.max(1,Number(frames[i]?.durationMs)||40)),sum=weights.reduce((a,b)=>a+b,0);let n=clamp(progress,0,.999999)*sum;for(let j=0;j<ids.length;j++){if(n<weights[j])return ids[j];n-=weights[j];}return ids.at(-1);}
function resolve(hero,id,age,max,options={}){
 const clip=clipFor(hero,id);if(!clip||clip.enabled===false||!loaded[hero]?.[id])return null;
 const release=clamp(Number.isInteger(clip.releaseFrame)?clip.releaseFrame:4,0,7),tail=Array.from({length:8-release},(_,i)=>release+i);let index,allowed;
 if(options.indices){allowed=validSequence(options.indices,tail);index=choose(clip.frames,Math.max(0,age)/Math.max(1,max),allowed);}
 else if(options.projectile){
  const ticks=Math.max(4,Number(clip.cycleTicks)||12),at=Math.max(0,age),travel=validSequence(clip.projectileFrames,[]);
  if(travel.length){
   // Mixed sheets may put impact debris after travel. Neither an expired arrow
   // nor reduced motion may select impact-only art while still in flight.
   const loop=validSequence(clip.loopFrames,travel).filter(i=>travel.includes(i));
   allowed=at<ticks?travel:(loop.length?loop:travel);index=choose(clip.frames,(at%ticks)/ticks,allowed);
  }else if(Number.isFinite(options.life)&&options.life<=4){allowed=[6,7];index=choose(clip.frames,(4-options.life)/4,allowed);}
  else{allowed=validSequence(clip.loopFrames,[release,Math.min(5,release+1)]);index=choose(clip.frames,(at%ticks)/ticks,allowed);}
 }
 else{allowed=options.release?validSequence(clip.playFrames,tail):undefined;index=choose(clip.frames,Math.max(0,age)/Math.max(1,max),allowed);}
 if(options.reducedMotion){const preferred=clamp(Number(clip.reducedFrame)||4,0,7);index=allowed&&!allowed.includes(preferred)?allowed[Math.floor(allowed.length/2)]:preferred;}
 const f=clip.frames[index],size=defaults[hero]?.[id]||[200,180];
 // One uniform scale preserves the authored arc instead of stretching it.
 const bounds=clip.contentBounds,hasBounds=Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isFinite)&&bounds[2]>bounds[0]&&bounds[3]>bounds[1],contentW=hasBounds?Math.max(1,bounds[2]-bounds[0]):f.width,contentH=hasBounds?Math.max(1,bounds[3]-bounds[1]):f.height;
 const scale=Number(clip.scale)>0?Number(clip.scale):Math.min((Number(clip.worldWidth)||size[0])/contentW,(Number(clip.worldHeight)||size[1])/contentH);
 return {hero,id,index,frame:f,clip,scale:clamp(scale,.02,Math.min(2,520/contentW,320/contentH)),image:images[hero][id][index]};
}
function paint(ctx,hero,id,age,max,x,y,dir=1,angle=0,options={}){
 const p=resolve(hero,id,age,max,options);if(!p)return false;
 const fade=options.reducedMotion?Math.max(.1,1-age/Math.max(1,max)):.94;
 const scale=p.scale*clamp(Number.isFinite(options.scaleFactor)?options.scaleFactor:1,.2,1),alpha=clamp(Number.isFinite(options.alphaFactor)?options.alphaFactor:1,0,1);
 ctx.save();ctx.translate(x,y);ctx.scale(dir<0?-1:1,1);ctx.rotate((Number(angle)||0)+(Number(p.clip.rotation)||0));
 ctx.globalAlpha*=fade*(options.reducedMotion?.58:1)*(options.flash===false?.8:1)*clamp(Number(p.clip.opacity)||1,.05,1)*alpha;
 ctx.globalCompositeOperation=p.clip.blend==='lighter'&&options.flash!==false&&!options.reducedMotion?'lighter':'source-over';
 ctx.drawImage(p.image,-p.frame.anchor[0]*scale,-p.frame.anchor[1]*scale,p.frame.width*scale,p.frame.height*scale);ctx.restore();return true;
}
function drawStartup(ctx,f,options={}){
 const a=f.attack;if(!a||f.stun||f.dash||['lara','drake'].includes(f.hero)||a.t>=a.move.startup)return false;
 const id=['skill','ultimate'].includes(a.name)?a.name:'basic',clip=clipFor(f.hero,id);if(!clip||clip.anticipation===false)return false;
 const release=clamp(Number.isInteger(clip.releaseFrame)?clip.releaseFrame:4,0,7);if(!release)return false;
 const ticks=Math.min(a.move.startup,Math.max(1,Number(clip.anticipationTicks)||4)),start=a.move.startup-ticks;if(a.t<start||bakedSlash(f,a))return false;
 const dir=f.dir<0?-1:1,at=attackPlacement(f,a,dir),basic=id==='basic';
 return paint(ctx,f.hero,id,a.t-start,ticks,at.x,at.y,dir,at.angle,{...options,indices:Array.from({length:release},(_,i)=>i),scaleFactor:basic?basicScale[f.hero]||1:1,alphaFactor:basic?basicOpacity[f.hero]||1:.8});
}
function drawEffect(ctx,e,options={}){
 const hero=e.hero||e.owner?.hero,id=e.fxClip||(e.kind==='fxBasic'?'basic':['seal','waterWheel','thunderDash','explosion'].includes(e.kind)?'skill':['cross','staff','waterDragon','thunderSix'].includes(e.kind)?'ultimate':null);
 if(!hero||!id)return false;
 // A seal describes successful immobilization, not an automatically acquired target.
 if(e.kind==='seal'&&(!e.connected||e.blocked))return !!loaded[hero]?.[id];
 let x=e.x,y=e.y,angle=e.angle||0;
 const follows=['fxBasic','waterWheel','thunderDash','cross'].includes(e.kind)&&!!e.owner;
 if(follows){
  const b=binding(e),dir=e.dir<0?-1:1;
  if(stillBound(b)){
   if(e.kind==='waterWheel'){
    const p=root.RiftMotionPreview?.resolve?.(b.actor),lift=p?.clip==='skill'?(Number(p.frame.gameOffsetY??p.frame.previewOffsetY)||0)*p.scale:0;
    b.last={x:b.actor.x+dir*24,y:b.actor.y-80+lift,angle};
   }else if(e.kind==='thunderDash')b.last={x:b.actor.x+dir*48,y:b.actor.y-75,angle};
   else b.last=attackPlacement(b.actor,b.attack,dir);
  }
  ({x,y,angle}=b.last);
  // The attack's own cel already contains this water/lightning stroke.
  if(e.kind==='fxBasic'&&stillBound(b)&&bakedSlash(b.actor,b.attack))return true;
 }
 if(e.kind==='seal'){x=e.hitX;y=e.hitY;}
 const basic=e.kind==='fxBasic',scaleFactor=basic?basicScale[hero]||1:e.kind==='thunderDash'||e.kind==='waterDragon'?.82:1;
 const alphaFactor=basic?basicOpacity[hero]||1:e.kind==='thunderDash'||e.kind==='waterDragon'?.7:e.kind==='cross'?.72:1;
 const drawn=paint(ctx,hero,id,e.max-e.life,e.max,x,y,e.dir||1,angle,{...options,release:true,scaleFactor,alphaFactor});
 if(drawn&&e.kind==='seal'){
  // Preserve the existing readable identity glyph without restoring old rings.
  // World coordinates are fixed at the confirmed hit; the glyph is never mirrored.
  ctx.save();ctx.translate(x,y);ctx.globalAlpha*=clamp(e.life/Math.max(1,e.max),0,1)*(options.reducedMotion?.65:1);ctx.fillStyle='#ffe7a0';ctx.font='800 38px "Noto Sans SC",system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('定',0,0);ctx.restore();
 }
 return drawn;
}
function drawProjectile(ctx,b,options={}){
 if(!['wave','arrow'].includes(b.kind))return false;
 const drawn=paint(ctx,b.owner.hero,'skill',Math.max(0,(b.age||0)-1),b.life+(b.age||0),b.x,b.y,Math.sign(b.vx)||b.direction||1,Math.atan2(b.vy||0,Math.abs(b.vx||1)),{...options,projectile:true,life:b.life,scaleFactor:b.kind==='wave'?.75:1,alphaFactor:b.kind==='wave'?.8:1});
 // The arrow is a physical prop: keep its narrow shaft/head above the new trail.
 return b.kind==='wave'&&drawn;
}
function drawFeedback(ctx,e,options={}){
 if(e.kind==='impact'){const id=['skill','ultimate'].includes(e.move)?e.move:'basic',clip=clipFor(e.hero,id),impacts=validSequence(clip?.impactFrames,[]);if(impacts.length)return paint(ctx,e.hero,id,e.age,e.max,e.x,e.y,e.dir||1,0,{...options,indices:impacts});}
 if(e.kind==='muzzle')return paint(ctx,e.hero,e.move==='ultimate'?'ultimate':'basic',e.age,e.max,e.x,e.y,e.dir||1,e.angle||0,{...options,release:true,scaleFactor:['lara','drake'].includes(e.hero)?.65:1});
 if(e.kind==='impact'&&e.hero==='drake'&&!['skill','ultimate'].includes(e.move))return paint(ctx,'drake','basic',e.age,e.max,e.x,e.y,e.dir||1,0,{...options,release:true});
 return false;
}
root.RiftFXSprites={ready,isReady:(hero,id)=>!!loaded[hero]?.[id],resolve,drawStartup,drawEffect,drawProjectile,drawFeedback};
})(typeof window!=='undefined'?window:globalThis);
