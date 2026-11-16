(function(root){'use strict';
// Body playback and its attachment geometry share one resolved authored cel.
// The combat clock stays at 60 Hz. No wall clock, inferred limb positions,
// copied base-form skin, or simulation mutations are used here.
const managedAttachedEffects=new WeakSet(),weaponEffectBindings=new WeakMap();
const FPS=24,images=new Map(),jobs=new Map(),failures=new Set(),pending=new Map();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const point=p=>Array.isArray(p)?p:p&&[p.x,p.y];
const heroData=hero=>root.RiftMotion24Data?.heroes?.[hero];
const finitePoint=p=>Array.isArray(point(p))&&point(p).length===2&&point(p).every(Number.isFinite);
function modeSource(data,mode){
 if(!data)return null;let id=String(mode),seen=new Set();
 if(!data.modes?.[id]&&data.sharedModes?.includes(mode))id='0';
 while(data.modes?.[id]&&!seen.has(id)){seen.add(id);const modeData=data.modes[id];if(modeData.clips)return {id:Number(id),data:modeData};if(modeData.inherit===undefined)return null;id=String(modeData.inherit);}
 return null;
}
function clipFor(data,mode,id){
 let key=String(mode),seen=new Set();if(!data?.modes?.[key]&&data?.sharedModes?.includes(mode))key='0';
 while(data?.modes?.[key]&&!seen.has(key)){seen.add(key);const m=data.modes[key];if(m.clips?.[id])return {clip:m.clips[id],modeSource:Number(key)};if(m.inherit===undefined)return null;key=String(m.inherit);}
 return null;
}
function validFrame(f){
 if(!f?.image||![f.width,f.height].every(n=>Number.isFinite(n)&&n>0)||!finitePoint(f.anchor))return false;
 if(f.sourceRect&&![f.sourceRect.x,f.sourceRect.y,f.sourceRect.width,f.sourceRect.height].every(Number.isFinite))return false;
 return Object.values(f.attachments||{}).every(p=>p==null||finitePoint(p));
}
function manifest(hero){
 const data=heroData(hero),files=[];if(!data)return {files,error:hero+' 的 24fps 动作清单未载入'};
 let clips=0;for(const [mode,m] of Object.entries(data.modes||{}))for(const [id,clip] of Object.entries(m.clips||{})){
  if((clip.fps??data.fps??root.RiftMotion24Data.fps)!==FPS||clip.frames?.length!==12||!clip.frames.every(validFrame))return {files:[],error:hero+' / '+mode+' / '+id+' 的动作帧数据不完整'};
  clips++;files.push(...clip.frames.map(f=>f.image));
 }
 for(const id of data.requiredClips||[])if(!clipFor(data,0,id))return {files:[],error:hero+' / '+id+' 缺少必要动作'};
 return {files:[...new Set(files)],clips,error:clips?null:hero+' 没有可用的 24fps 动作'};
}
function isHeroReady(hero){const m=manifest(hero);return !m.error&&m.files.every(s=>images.has(s));}
function status(hero){const m=manifest(hero);return {ready:isHeroReady(hero),fps:FPS,clips:m.clips||0,loaded:m.files.filter(s=>images.has(s)).length,total:m.files.length,pending:m.files.filter(s=>jobs.has(s)).length,failed:m.files.filter(s=>failures.has(s)),error:m.error};}
function load(src){
 if(images.has(src))return Promise.resolve(true);if(jobs.has(src))return jobs.get(src);failures.delete(src);
 const job=new Promise(resolve=>{try{const im=new root.Image();im.onload=()=>{images.set(src,im);failures.delete(src);resolve(true);};im.onerror=()=>{failures.add(src);resolve(false);};if(root.RiftImageQueue)root.RiftImageQueue.load(im,src);else im.src=src;}catch(_){failures.add(src);resolve(false);}});
 jobs.set(src,job);job.then(()=>{if(jobs.get(src)===job)jobs.delete(src);});return job;
}
function ensureHero(hero){if(isHeroReady(hero))return Promise.resolve(true);if(pending.has(hero))return pending.get(hero);const m=manifest(hero);if(m.error||!root.Image)return Promise.resolve(false);const job=Promise.all(m.files.map(load)).then(ok=>ok.every(Boolean)&&isHeroReady(hero));pending.set(hero,job);job.then(()=>{if(pending.get(hero)===job)pending.delete(hero);});return job;}
function preloadFrames(frames){if(!root.Image)return Promise.resolve(false);return Promise.all([...new Set(frames.filter(Boolean).map(f=>f.image).filter(Boolean))].map(load)).then(ok=>ok.every(Boolean));}
function currentMode(f){const m=f.attack?.move;return clamp(Number(m?.overdriveMode??m?.animeMode??m?.mananMode??m?.rosterMode??m?.zenitsuMode??m?.awakenMode??f.awakenLevel)||0,0,2);}
function defensiveOrMovement(f){
 if(!f||f.stun>0||f.knockdown||f.downTime>0||f.guardStun>0||f.block||f.guardReleaseTime>0)return true;
 if(f.attack)return f.attack.name==='awaken';
 return f.dash>0||f.blinkTime>0||f.grounded===false||f.state==='jump'||f.animState==='jump'||Math.abs(f.vx||0)>.6||f.state==='run'||f.animState==='run';
}
function fallbackCue(f,clip){
 // An absent choreography adapter can still animate the new idle safely.
 // Attacks deliberately stay on the approved older renderer until their
 // real contact/emit timing is available; no arbitrary attack remapping.
 if(f.attack)return null;const tick=Math.max(0,f.animTime||0),artTick=Math.floor(tick*FPS/60);
 return {clipId:'idle',mode:currentMode(f),frameIndex:artTick%(clip?.frames.length||12),artTick,phase:{name:'idle',t:tick,duration:30,slot:0},semantic:'idle',weaponKind:null,attachment:null,released:true,attackSerial:f.attackSerial,clockKey:'idle'};
}
function localToWorld(pose,p){
 const q=point(p),x=(q[0]-pose.anchor[0])*pose.scale*pose.dir,y=(q[1]-pose.anchor[1])*pose.scale,angle=pose.rotation,c=Math.cos(angle),s=Math.sin(angle);
 return {x:pose.x+x*c-y*s,y:pose.y+x*s+y*c,angle:pose.dir<0?Math.PI:0};
}
function resolve(f,options={}){
 if(defensiveOrMovement(f))return null;const data=heroData(f.hero);if(!data)return null;
 const rules=root.RiftMotion24Rules,first=rules?.resolve?.(f)||fallbackCue(f);if(!first?.clipId)return null;
 const mode=Number(first.mode??currentMode(f)),found=clipFor(data,mode,first.clipId);if(!found)return null;
 const clip=found.clip,cue=rules?.resolve?.(f,clip)||fallbackCue(f,clip);if(!cue||cue.clipId!==first.clipId||!Number.isInteger(cue.frameIndex))return null;
 const index=clamp(cue.frameIndex,0,clip.frames.length-1),frame=clip.frames[index];if(!validFrame(frame))return null;
 const anchor=point(frame.anchor),offset=point(frame.bodyOffset||clip.bodyOffset||[0,0]),scale=Number(data.scale??data.bodyScale??.55)*Number(clip.scale??1),dir=(f.attack?.sixfold?f.dir:(f.attack?.direction??f.dir))<0?-1:1;
 const rotation=Number(cue.rotation??cue.bodyAngle)||0,baseX=(f.x||0)+offset[0]*scale*dir,baseY=(f.y||0)+offset[1]*scale,pivot=cue.pivot&&Number.isFinite(cue.pivot.x)&&Number.isFinite(cue.pivot.y)?cue.pivot:{x:baseX,y:baseY},c=Math.cos(rotation),s=Math.sin(rotation),x=pivot.x+(baseX-pivot.x)*c-(baseY-pivot.y)*s,y=pivot.y+(baseX-pivot.x)*s+(baseY-pivot.y)*c;
 const pose={...cue,hero:f.hero,mode,modeSource:found.modeSource,clipId:cue.clipId,index,frameIndex:index,clip,frame,sourceRect:frame.sourceRect,sourceAttachments:frame.attachments||{},anchor,scale,dir,x,y,rotation,pivot,imageReady:images.has(frame.image),attachments:{},fps:FPS};
 // A caller sees the attachments of exactly the image that drawFighter will
 // use. Hidden/unavailable palms are absent rather than guessed at the torso.
 for(const [name,p] of Object.entries(frame.attachments||{}))if(finitePoint(p))pose.attachments[name]=localToWorld(pose,p);
 for(const [tip,base] of [['tip','weapon'],['tip2','weapon2'],['muzzle','weapon'],['muzzle2','weapon2'],['staffTail','weapon']])if(pose.attachments[tip]&&pose.attachments[base])pose.attachments[tip].angle=Math.atan2(pose.attachments[tip].y-pose.attachments[base].y,pose.attachments[tip].x-pose.attachments[base].x);
 return pose;
}
function getAttachments(f,options={}){const p=resolve(f,options);return p?.imageReady?p.attachments:null;}
function getAttachment(f,name,options={}){return getAttachments(f,options)?.[name]||null;}
function weaponPlacement(f,options={}){
 const p=resolve(f,options);if(!p?.imageReady)return null;
 const dir=options.dir<0?-1:options.dir>0?1:p.dir,a=p.attachments;
 const cross=options.cross&&a.weapon&&a.tip&&a.weapon2&&a.tip2,secondary=options.secondary&&a.weapon2&&a.tip2,base=cross?{x:(a.weapon.x+a.weapon2.x)/2,y:(a.weapon.y+a.weapon2.y)/2}:secondary?a.weapon2:a.weapon||a.palm,tip=cross?{x:(a.tip.x+a.tip2.x)/2,y:(a.tip.y+a.tip2.y)/2}:secondary?a.tip2:a.tip||a.palm;
 if(!base||!tip)return null;
 return {x:(base.x+tip.x)/2,y:(base.y+tip.y)/2,angle:Math.atan2(tip.y-base.y,(tip.x-base.x)*dir),dir,hero:f.hero,source:'motion24',clipId:p.clipId,frameIndex:p.index,weapon:base,tip};
}
function boundWeaponPlacement(e,options={}){
 if(!e?.owner||e.projectile)return null;let b=weaponEffectBindings.get(e);const f=e.owner;
 if(!b){const a=e.attack||e.follow||f.attack,serial=e.attackSerial??e.castSerial??f.attackSerial,age=Math.max(0,(e.max||0)-(e.life||0));if(!a||a!==f.attack||serial!==f.attackSerial||(!e.attack&&!e.follow&&e.attackSerial===undefined&&a.t-(a.move?.startup||0)+2<age))return null;b={actor:f,attack:a,serial,last:null};weaponEffectBindings.set(e,b);}
 if(b.actor.attack===b.attack&&b.actor.attackSerial===b.serial){
  const placement=weaponPlacement(f,options);if(placement){const pose=resolve(f,options),key=options.attachment==='muzzle'&&f.hero==='lara'&&pose?.event?.slot%2&&pose.attachments.muzzle2?'muzzle2':options.attachment,point=key&&pose?.attachments[key];b.last=point?{...placement,x:point.x,y:point.y}:placement;}
 }
 return b.last;
}
function projectileOrigin(f,name,options={}){
 if(name&&f?.attack?.name!==name)return null;const p=resolve(f,options);if(!p?.imageReady||!f.attack)return null;
 const kind=String(p.weaponKind||''),pattern=f.attack.move?.pattern||'',grenade=f.hero==='drake'&&(kind==='grenade'||['lob','rain'].includes(pattern)),firearm=['rifle','dual-pistols'].includes(kind);
 const gunMuzzle=f.hero==='lara'&&p.event?.slot%2&&p.attachments.muzzle2?'muzzle2':'muzzle';
 const sealHand=f.hero==='wukong'&&p.clipId==='skill1'&&f.attack.name==='skill';
 const attachment=options.attachment||(grenade||sealHand?'palm':firearm?gunMuzzle:kind==='bow'?(p.attachments.muzzle?'muzzle':'tip'):p.attachment&&typeof p.attachment==='object'?p.attachment.name:p.attachment)||(/sword|staff|blade/.test(kind)?'tip':'palm');
 const value=p.attachments[attachment],bakedMuzzle=firearm&&Array.isArray(p.frame.bakedFx)&&p.frame.bakedFx.includes(attachment);
 return value?{...value,attachment,originKind:grenade?'throwHand':attachment,hero:p.hero,mode:p.mode,clipId:p.clipId,frameIndex:p.index,artTick:p.artTick,...(firearm?{targetHeight:160,bakedMuzzle}:{})}:null;
}
function paint(ctx,im,frame,x,y,dir,scale,rotation=0,alpha=1,handMask=null){
 const a=point(frame.anchor),r=frame.sourceRect;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.translate(x,y);if(rotation)ctx.rotate(rotation);ctx.scale(dir,1);
 if(handMask?.length>=3){ctx.beginPath();ctx.rect(-a[0]*scale,-a[1]*scale,frame.width*scale,frame.height*scale);handMask.forEach((v,i)=>{const x=(v[0]-a[0])*scale,y=(v[1]-a[1])*scale;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();ctx.clip('evenodd');}
 if(r)ctx.drawImage(im,r.x,r.y,r.width,r.height,-a[0]*scale,-a[1]*scale,frame.width*scale,frame.height*scale);else ctx.drawImage(im,-a[0]*scale,-a[1]*scale,frame.width*scale,frame.height*scale);ctx.restore();
}
function drawFighter(ctx,f,options={}){
 const p=resolve(f,options),im=p&&images.get(p.frame.image);if(!im)return false;
 const handMask=f.hero==='luffy'&&!options.ghost?root.RiftAnimeTrioVisual?.stretchBodyMask?.(f,p):null;
 ctx.save();if(f.flash>0&&!options.ghost&&'filter'in ctx)ctx.filter='brightness(1.55) saturate(.8)';paint(ctx,im,p.frame,p.x,p.y,p.dir,p.scale,p.rotation,1,handMask);ctx.restore();return true;
}
function attachmentSpec(p){const a=p?.attachment;return typeof a==='string'?{name:a}:a||null;}
function sameCast(e,f){
 if(e.attack&&e.attack!==f.attack)return false;const serial=e.motion24AttackSerial??e.attackSerial??e.castSerial;
 return serial===undefined?e.owner===f&&!!f.attack:serial===(f.attack?.serial??f.attackSerial);
}
function contactRelease(e,f,spec){
 const explicit=e?.motion24Release||e?.releasePoint;if(explicit)return explicit;
 const stamp=f?.attack?.motion24LastContact,serial=e?.motion24AttackSerial??e?.attackSerial??e?.castSerial;
 if(!stamp||serial===undefined||stamp.attackSerial!==serial||!sameCast(e,f))return null;
 return stamp.attachments?.[spec?.name]||null;
}
function onContact(world,f,stamp){
 if(!stamp||stamp.attackSerial!==f.attackSerial)return 0;const p=resolve(f),spec=attachmentSpec(p),release=stamp.attachments?.[spec?.name];if(!release)return 0;let count=0;
 for(const e of world.effects||[]){const serial=e.motion24AttackSerial??e.attackSerial??e.castSerial;if(e.owner===f&&serial===stamp.attackSerial&&e.kind===spec.kind&&e.clipId===spec.clipId&&!e.projectile){e.motion24Release={...release};count++;}}
 return count;
}
function effectAnchor(e,options={}){
 if(e?.projectile)return {x:e.projectile.x,y:e.projectile.y,angle:Math.atan2(e.projectile.vy||0,e.projectile.vx||1),attached:false,released:true};
 const release=e?.motion24Release||e?.releasePoint;if(release&&Number.isFinite(release.x)&&Number.isFinite(release.y))return {...release,attached:false,released:true};
 const f=e?.owner;if(!f||!sameCast(e,f))return null;const p=resolve(f,options),spec=attachmentSpec(p),stamped=contactRelease(e,f,spec);if(stamped)return {...stamped,attached:false,released:true};if(!p?.imageReady||p.released||!spec)return null;
 const name=e.motion24Attachment||options.attachment||spec.name,point=p.attachments[name];return point?{...point,name,attached:true,released:false,hero:p.hero,mode:p.mode,clipId:p.clipId,frameIndex:p.index,artTick:p.artTick}:null;
}
function drawAnchoredFx(ctx,e,options={}){
 const anchor=effectAnchor(e,options),frame=options.frame||e?.sprite,im=options.image||(frame&&images.get(frame.image));if(!anchor||!frame||!im||!finitePoint(frame.anchor))return false;
 paint(ctx,im,frame,anchor.x,anchor.y,e.dir||e.owner?.dir||1,options.scale??e.scale??1,options.rotation??0,options.alpha??1);return true;
}
function drawAttachedEffects(ctx,f,options={}){
 const p=resolve(f,options),spec=attachmentSpec(p);if(!p?.imageReady||p.released||!spec?.kind||!spec.clipId)return false;
 const at=p.attachments[spec.name];if(!at)return false;
 const phase=p.phase||{},charge=phase.name==='windup'?clamp((phase.t||0)/Math.max(1,phase.duration||1),0,1):1,scale=(spec.scale||.6)*(.55+.45*charge),age=Math.max(0,p.artTick||0)%8;
 const e={kind:spec.kind,hero:f.hero,clipId:spec.clipId,x:at.x,y:at.y,dir:p.dir,scale,mode:p.mode,frameIndex:age,life:16,max:16,owner:f};
 if(spec.kind==='animeTrioFx')return !!root.RiftAnimeTrioVisual?.drawEffect?.(ctx,e,options);
 if(spec.kind==='rosterFx')return !!root.RiftRosterVisual?.drawEffect?.(ctx,e,options);
 return false;
}
function drawEffect(ctx,e,options={}){
 const f=e?.owner;if(!f||e.projectile)return false;
 // A completed cast retains its real release snapshot even after the owner
 // recovers, moves away or starts a new attack. Never reattach its old effect.
 if(e.motion24Release){const redirected={...e,x:e.motion24Release.x,y:e.motion24Release.y};if(e.kind==='animeTrioFx')return !!root.RiftAnimeTrioVisual?.drawEffect?.(ctx,redirected,options);if(e.kind==='rosterFx')return !!root.RiftRosterVisual?.drawEffect?.(ctx,redirected,options);return false;}
 if(!sameCast(e,f))return managedAttachedEffects.has(e);const p=resolve(f,options),spec=attachmentSpec(p);
 if(!p?.imageReady||!spec?.kind||e.kind!==spec.kind||e.clipId!==spec.clipId)return managedAttachedEffects.has(e);
 managedAttachedEffects.add(e);
 // While held, the after-body pass owns this one sphere/blade effect. The
 // old torso-anchored instance is consumed instead of drawing a second one.
 if(!p.released)return true;
 const release=contactRelease(e,f,spec);if(!release)return false;
 const redirected={...e,x:release.x,y:release.y,projectile:undefined};
 if(e.kind==='animeTrioFx')return !!root.RiftAnimeTrioVisual?.drawEffect?.(ctx,redirected,options);
 if(e.kind==='rosterFx')return !!root.RiftRosterVisual?.drawEffect?.(ctx,redirected,options);
 return false;
}
const api={FPS,manifest,isHeroReady,ready:isHeroReady,ensureHero,preload:ensureHero,status,preloadFrames,resolve,getPose:resolve,getAttachments,attachments:getAttachments,getAttachment,attachment:getAttachment,projectileOrigin,weaponPlacement,boundWeaponPlacement,drawFighter,draw:drawFighter,effectAnchor,drawAnchoredFx,drawAttachedEffects,drawEffect,onContact};
root.RiftMotion24Visual=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
