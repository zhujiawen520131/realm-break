(function(root){'use strict';
// Authored pixel cels only. Rendering observes combat state and never creates
// contacts, moves actors, advances clocks, or consumes simulation events.
const HEROES=['cloud','lara','wukong','drake','tanjiro','zenitsu','manan','luffy','kirito','naruto'];
const images=new Map(),jobs=new Map(),failures=new Set(),pending=new Map();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const pack=hero=>root.RiftAwakeningR3Data?.heroes?.[hero]?.clips;
const point=p=>Array.isArray(p)?p:[p?.x,p?.y];
const bounds=p=>Array.isArray(p)?{x:p[0],y:p[1],width:p[2],height:p[3]}:p;
function manifest(hero){
 if(!HEROES.includes(hero))return {files:[],error:null};
 const clips=pack(hero),files=[];
 for(const id of ['surge','domain']){
  const frames=clips?.[id]?.frames;
  if(!Array.isArray(frames)||frames.length!==8)return {files:[],error:hero+' / '+id+' 觉醒序列未就绪'};
  for(const f of frames){const a=point(f.anchor),b=bounds(f.bounds);if(!f.image||![f.width,f.height,...a].every(Number.isFinite)||f.width<=0||f.height<=0||b&&![b.x,b.y,b.width,b.height].every(Number.isFinite))return {files:[],error:hero+' / '+id+' 觉醒帧数据不完整'};files.push(f.image);}
 }
 return {files:[...new Set(files)],error:null};
}
function isHeroReady(hero){const m=manifest(hero);return !m.error&&m.files.every(p=>images.has(p));}
function status(hero){const m=manifest(hero);return {ready:isHeroReady(hero),loaded:m.files.filter(p=>images.has(p)).length,total:m.files.length,pending:m.files.filter(p=>jobs.has(p)).length,failed:m.files.filter(p=>failures.has(p)),error:m.error};}
function load(path){
 if(images.has(path))return Promise.resolve(true);if(jobs.has(path))return jobs.get(path);failures.delete(path);
 const job=new Promise(resolve=>{try{const im=new root.Image();im.onload=()=>{images.set(path,im);failures.delete(path);resolve(true);};im.onerror=()=>{failures.add(path);resolve(false);};if(root.RiftImageQueue)root.RiftImageQueue.load(im,path);else im.src=path;}catch(_){failures.add(path);resolve(false);}});
 jobs.set(path,job);job.then(()=>{if(jobs.get(path)===job)jobs.delete(path);});return job;
}
function ensureHero(hero){if(isHeroReady(hero))return Promise.resolve(true);if(pending.has(hero))return pending.get(hero);const m=manifest(hero);if(m.error||typeof root.Image!=='function')return Promise.resolve(false);const job=Promise.all(m.files.map(load)).then(ok=>ok.every(Boolean)&&isHeroReady(hero));pending.set(hero,job);job.then(()=>{if(pending.get(hero)===job)pending.delete(hero);});return job;}
function attackState(f){
 const a=f?.attack,m=a?.move;if(!m?.overdrive||f.stun>0||f.knockdown||f.downTime>0)return null;
 const mode=m.overdriveMode||f.awakenLevel||1,t=Math.max(0,a.t||0),end=Math.max(1,m.end||1),start=Math.max(1,m.startup||1),releaseEnd=Math.min(end,start+Math.max(1,m.active||1));
 const phase=a.overdrivePhase||(t<start?'windup':t<releaseEnd?'impact':'recovery');
 return {f,attack:a,hero:f.hero,mode,phase,t,start,end,progress:clamp(t/end),name:m.displayName||f.info?.skill||'觉醒技',color:f.color||f.info?.color||'#d6f6ef'};
}
function inspect(world){if(!world||world.result||world.cutin)return null;const rank={finale:0,impact:1,travel:2,windup:3,recovery:4};return [attackState(world.p1),attackState(world.p2)].filter(Boolean).sort((a,b)=>(rank[a.phase]??2)-(rank[b.phase]??2)||b.mode-a.mode)[0]||null;}
function viewport(camera={}){const z=Math.max(.2,camera.zoom||1);return {x:600+(-600-(camera.x||0))/z,y:340+(-340-(camera.y||0))/z,width:1200/z,height:640/z,zoom:z};}
function applyCamera(camera,world,{reducedMotion=false}={}){
 const p=inspect(world);if(!p||reducedMotion)return camera;
 // A short, smooth pull-back reveals the large subject; the simulation's
 // existing camera still follows real upward movement and both contestants.
 const fade=Math.min(1,p.t/Math.max(6,p.start),(p.end-p.t)/12),zoom=1-(p.mode===2?.065:.025)*clamp(fade);
 return {...camera,zoom:camera.zoom*zoom};
}
function drawBackdrop(ctx,world,{camera,reducedMotion=false}={}){
 const p=inspect(world);if(!p)return false;const v=viewport(camera),fade=Math.min(1,(p.t+1)/7,(p.end-p.t)/12),strength=p.mode===2?.48:.25;
 ctx.save();ctx.globalAlpha*=strength*clamp(fade)*(reducedMotion?.35:1);ctx.fillStyle='#020711';ctx.fillRect(v.x,v.y,v.width,v.height);ctx.restore();return true;
}
function effectFrame(e){
 const age=Math.max(0,(e.max||1)-(e.life||0)),p=clamp(age/Math.max(1,e.max||1));
 if(e.phase==='windup')return Math.min(1,Math.floor(p*2));
 if(e.phase==='travel')return e.projectile&&(e.projectile.dead||e.projectile.life<=0)?Math.min(7,5+Math.floor((4-Math.min(4,e.life))/4*3)):Math.min(4,2+Math.floor(age/4));
 if(e.phase==='impact')return Math.min(7,2+Math.floor(p*6));
 if(e.phase==='finale')return Math.min(7,4+Math.floor(p*4));
 if(e.phase==='recovery')return Math.min(7,5+Math.floor(p*3));
 return Math.min(7,Math.floor(p*8));
}
function selectEffects(world){
 const effects=(world?.effects||[]).filter(e=>e.kind==='awakeningOverdriveFx'&&e.life>0),owners=new Map();
 for(const e of effects){if(e.projectile)continue;const key=e.owner||e.hero,list=owners.get(key)||[];list.push(e);owners.set(key,list);}
 const main=new Set(),secondary=new Set();
 for(const list of owners.values()){
  const score=e=>{const current=!e.owner||e.attackSerial===e.owner.attackSerial;return (current?0:100)+(e.phase==='finale'?0:e.phase==='impact'?10:e.phase==='travel'?20:e.phase==='windup'?30:40)+Math.abs(effectFrame(e)-4)*.1;};
  list.sort((a,b)=>score(a)-score(b));if(list[0])main.add(list[0]);
  // Only the newest two distinct local contacts survive beneath the main
  // subject. Repeated hit events cannot become a stack of opaque domains.
  for(const e of list.filter(e=>e!==list[0]&&e.phase!=='windup').sort((a,b)=>(a.max-a.life)-(b.max-b.life)).slice(0,2))secondary.add(e);
 }
 return effects.filter(e=>e.projectile||main.has(e)||secondary.has(e)).map(effect=>({effect,major:main.has(effect),role:effect.projectile?'projectile':main.has(effect)?'subject':'contact'}));
}
function layout(e,{camera,reducedMotion=false,major=true}={}){
 if(e?.kind!=='awakeningOverdriveFx'||!HEROES.includes(e.hero))return null;
 const clipId=e.clipId||(e.mode===2?'domain':'surge'),clip=pack(e.hero)?.[clipId];if(!clip?.frames?.length)return null;
 const age=Math.max(0,(e.max||1)-(e.life||0)),progress=clamp(age/Math.max(1,e.max||1)),frameIndex=effectFrame(e),frame=clip.frames[frameIndex],b=bounds(frame.bounds)||{x:0,y:0,width:frame.width,height:frame.height},anchor=point(frame.anchor),v=viewport(camera);
 const domain=clipId==='domain',subject=major&&!e.projectile,baseWidth=Math.max(1,e.width||400),targetWidth=subject?(domain?clamp(Math.max(baseWidth,v.width*.78),v.width*.70,v.width*.88):Math.min(v.width*.64,Math.max(340,baseWidth))):Math.min(v.width*.38,Math.max(45,Math.min(baseWidth,e.projectile?baseWidth:e.attackRange||baseWidth)));
 const targetHeight=Math.min(v.height*(subject&&domain?.69:.55),Math.max(e.height||0,domain?300:200));
 // Flowing magic may expand horizontally, but never crush the authored
 // dragon/weapon/architecture to a thin stripe. No per-frame auto-fit jitter.
 const allBounds=clip.frames.map(f=>bounds(f.bounds)||{x:0,y:0,width:f.width,height:f.height}),union={x:Math.min(...allBounds.map(p=>p.x)),y:Math.min(...allBounds.map(p=>p.y)),right:Math.max(...allBounds.map(p=>p.x+p.width)),bottom:Math.max(...allBounds.map(p=>p.y+p.height))},bw=union.right-union.x,bh=union.bottom-union.y;
 const scaleX=targetWidth/Math.max(1,bw),scaleY=Math.min(scaleX,targetHeight/Math.max(1,bh)),dir=e.dir<0?-1:1;
 let x=Number.isFinite(e.x)?e.x:e.owner?.x||0,y=Number.isFinite(e.y)?e.y:e.owner?.y||510;
 if(e.projectile){x=e.projectile.x;y=e.projectile.y+(e.anchorOffsetY??80);}
 const anchorX=x,anchorY=y,width=bw*scaleX,height=bh*scaleY;
 // Only the cinematic back-layer subject receives a safe viewport layout.
 // Projectiles, local contacts and root/roof-constrained columns keep their
 // exact physical anchors. Expose both anchors for independent QA.
 if(subject&&domain&&!Number.isFinite(e.clipHeight)){
  const left=dir>0?(union.x-anchor[0])*scaleX:-(union.right-anchor[0])*scaleX,top=(union.y-anchor[1])*scaleY;
  x=clamp(x,v.x+20/v.zoom-left,v.x+v.width-20/v.zoom-left-width);
  y=clamp(y,v.y+145/v.zoom-top,v.y+v.height-18/v.zoom-top-height);
 }
 const worldBounds={x:dir>0?x+(b.x-anchor[0])*scaleX:x-(b.x+b.width-anchor[0])*scaleX,y:y+(b.y-anchor[1])*scaleY,width:b.width*scaleX,height:b.height*scaleY},screenBounds={x:(worldBounds.x-v.x)*v.zoom,y:(worldBounds.y-v.y)*v.zoom,width:worldBounds.width*v.zoom,height:worldBounds.height*v.zoom};
 // Physical anchors are retained separately. The cinematic subject's safe
 // layout is never fed back into damage, projectile or hitbox calculations.
 return {hero:e.hero,clipId,clip,frame,frameIndex,sourceRect:frame.sourceRect,anchor,bounds:b,worldBounds,screenBounds,anchorX,anchorY,x,y,dir,scaleX,scaleY,width,height,screenWidth:width*v.zoom,screenHeight:height*v.zoom,splitY:worldBounds.y+worldBounds.height-24/v.zoom,clipHeight:e.clipHeight,major:subject,alpha:clamp(Math.min((age+1)/3,(e.life||0)/7))*(reducedMotion?.64:subject?.88:e.projectile?.82:.48),progress,viewport:v};
}
function drawCell(ctx,l){const im=images.get(l.frame.image);if(!im)return false;const f=l.frame,r=l.sourceRect;ctx.translate(l.x,l.y);ctx.scale(l.dir*l.scaleX,l.scaleY);if(r){ctx.drawImage(im,r.x,r.y,r.width,r.height,-l.anchor[0],-l.anchor[1],f.width,f.height);}else ctx.drawImage(im,-l.anchor[0],-l.anchor[1],f.width,f.height);return true;}
function drawLayer(ctx,world,layer='back',options={}){
 let count=0;for(const item of selectEffects(world)){const e=item.effect,l=layout(e,{...options,major:item.major});if(!l||!images.has(l.frame.image))continue;
  // Divide the SAME art at ground-level spray: large subjects stay behind
  // readable silhouettes while the low dust/embers pass in front of feet.
  const v=l.viewport;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=l.alpha;ctx.beginPath();if(layer==='front')ctx.rect(v.x,l.splitY,v.width,Math.max(0,v.y+v.height-l.splitY));else ctx.rect(v.x,v.y,v.width,Math.max(0,l.splitY-v.y));ctx.clip();if(Number.isFinite(l.clipHeight)){ctx.beginPath();ctx.rect(v.x,l.anchorY-Math.max(0,l.clipHeight),v.width,Math.max(0,l.clipHeight));ctx.clip();}if(drawCell(ctx,l))count++;ctx.restore();
 }return count>0;
}
function visualPose(f){if(!attackState(f))return null;return root.RiftAwakeningOverdriveRules?.visualPose?.(f)||null;}
// Drake's grenade leaves the extended fingertips of the actual release cel,
// not a guessed torso offset. Source: art/pixel-eight/frames/drake/skill/05.webp.
const DRAKE_THROW_HAND={clip:'skill',frame:4,source:[628,282]};
function transformPoint(point,pose){
 const angle=Number(pose?.bodyAngle)||0,pivot=pose?.pivot;if(!point||!angle||!pivot)return point;const x=point.x-pivot.x,y=point.y-pivot.y,c=Math.cos(angle),s=Math.sin(angle);return {...point,x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};
}
function projectileOrigin(f){
 if(!['lara','drake'].includes(f?.hero))return null;const pose=visualPose(f);if(!pose?.actor?.attack)return null;
 const renderer=pose.source==='roster'?root.RiftRosterVisual:pose.source==='motion'?root.RiftMotionPreview:null;
 let origin=renderer?.projectileOrigin?.(pose.actor,pose.actor.attack.name)||null;
 if(!origin&&f.hero==='drake'&&pose.source==='motion'&&pose.actor.attack.move.pattern==='lob'){
  const p=root.RiftMotionPreview?.resolve?.(pose.actor);if(p?.clip===DRAKE_THROW_HAND.clip&&p.index===DRAKE_THROW_HAND.frame)origin={x:f.x+(f.dir||1)*(p.x+DRAKE_THROW_HAND.source[0]*p.scale),y:f.y+p.y+DRAKE_THROW_HAND.source[1]*p.scale,originKind:'throwHand'};
 }
 return transformPoint(origin,pose);
}
function drawFighter(ctx,f){
 const pose=visualPose(f);if(!pose?.actor)return false;
 const renderer={motion:root.RiftMotionPreview?.draw,roster:root.RiftRosterVisual?.drawFighter,tanjiro:root.RiftTanjiroVisual?.drawFighter,fire:root.RiftTanjiroFireVisual?.drawFighter,zenitsu:root.RiftZenitsuKitVisual?.drawFighter,zenitsuKit:root.RiftZenitsuKitVisual?.drawFighter,zenitsuCombat:root.RiftZenitsuCombat?.drawFighter,manan:root.RiftMananVisual?.drawFighter,anime:root.RiftAnimeTrioVisual?.drawFighter}[pose.source];
 if(!renderer)return false;ctx.save();if(pose.bodyAngle&&pose.pivot){ctx.translate(pose.pivot.x,pose.pivot.y);ctx.rotate(pose.bodyAngle);ctx.translate(-pose.pivot.x,-pose.pivot.y);}if('filter'in ctx)ctx.filter='drop-shadow(0px 0px 2px #06121c) drop-shadow(0px 0px 1px #e2ffff)';const drawn=!!renderer(ctx,pose.actor);ctx.restore();return drawn;
}
function drawOverlay(ctx,world,{reducedMotion=false}={}){
 const p=inspect(world);if(!p||p.attack.name==='ultimate')return false;
 const fade=clamp(Math.min((p.t+1)/5,(p.end-p.t)/10));ctx.save();ctx.globalAlpha*=fade;ctx.fillStyle='#06131fe6';ctx.fillRect(335,148,530,36);ctx.fillStyle=p.color;ctx.font='700 17px "Noto Sans SC",system-ui,sans-serif';ctx.textAlign='center';ctx.fillText((p.mode===2?'二阶 · ':'一阶 · ')+p.name,600,172,500);ctx.restore();return true;
}
const api={HEROES,manifest,isHeroReady,ensureHero,preload:ensureHero,status,inspect,effectFrame,selectEffects,layout,visualPose,projectileOrigin,applyCamera,drawBackdrop,drawLayer,drawFighter,drawOverlay,throwCalibration:{drake:DRAKE_THROW_HAND}};root.RiftAwakeningOverdriveVisual=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
