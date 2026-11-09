(function(root){'use strict';
const HEROES=['cloud','lara','wukong','drake','zenitsu'],images=new Map(),jobs=new Map(),pending=new Map();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function files(hero){if(!HEROES.includes(hero))return [];const body=root.RiftRosterArt?.heroes?.[hero]?.body,fx=root.RiftRosterFX?.heroes?.[hero]?.clips,ids=hero==='zenitsu'?['awaken','surge']:['awaken','skill2','skill3'],out=[];for(const [pack,names] of [[body,ids],[fx,['aura','skill1','skill2','skill3']]])for(const id of names){const clip=pack?.[id];if(clip?.frames?.length!==8)return null;out.push(...clip.frames);}return out;}
function isHeroReady(hero){const f=files(hero);return !!f&&f.every(p=>images.has(p.image));}
function ensureHero(hero){if(isHeroReady(hero))return Promise.resolve(true);if(pending.has(hero))return pending.get(hero);const f=files(hero);if(!f||!root.Image)return Promise.resolve(false);const job=Promise.all(f.map(p=>{if(images.has(p.image))return true;if(jobs.has(p.image))return jobs.get(p.image);const j=new Promise(resolve=>{const im=new root.Image();im.onload=()=>{images.set(p.image,im);resolve(true)};im.onerror=()=>resolve(false);im.src=p.image});jobs.set(p.image,j);j.then(()=>jobs.delete(p.image));return j})).then(ok=>ok.every(Boolean)&&isHeroReady(hero));pending.set(hero,job);job.finally(()=>pending.delete(hero));return job;}
function paint(ctx,p,x,y,dir,scale,alpha=1,angle=0){const im=p&&images.get(p.image);if(!im)return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.scale(dir<0?-1:1,1);if(angle)ctx.rotate(angle);ctx.drawImage(im,-p.anchor[0]*scale,-p.anchor[1]*scale,p.width*scale,p.height*scale);ctx.restore();return true;}
function bodyPose(f){const a=f.attack,m=a?.move;if(!a)return null;let id=a.clipId;
 if(f.hero==='zenitsu'){if(a.name==='awaken')id='awaken';else if(m.zenitsuMode>0&&(a.name==='slash5'||a.name==='skill'&&a.variant!=='airspin'))id='surge';else return null;}
 else if(!m.rosterKit)return null;
 const clip=root.RiftRosterArt?.heroes?.[f.hero]?.body?.[id];if(!clip)return null;const count=8,events=clip.events||{},contact=clamp(events.firstStrike??events.strike??events.impact??events.shoot??4,1,6),scale=clip.scale||.4;let index=0;
 if(a.name==='awaken')index=Math.min(7,Math.floor(a.t/Math.max(1,m.end)*8));
 else if(a.t<m.startup)index=Math.min(contact-1,Math.floor(a.t/Math.max(1,m.startup)*contact));
 else if(a.t<m.startup+m.active){const interval=m.interval||m.active,elapsed=a.t-m.startup,slot=Math.floor(elapsed/interval),local=elapsed%interval;if(f.hero==='zenitsu'&&id==='surge'&&events.fifthStrike!==undefined){const lastStrike=events.fifthStrike,hitCount=Math.max(1,m.hits||1),current=contact+Math.round(slot/Math.max(1,hitCount-1)*(lastStrike-contact)),next=slot<hitCount-1?contact+Math.round((slot+1)/Math.max(1,hitCount-1)*(lastStrike-contact)):8;index=Math.min(7,current+Math.floor(local/Math.max(1,Math.min(interval,m.active-slot*interval))*(next-current)));}
 else if(['lara','drake'].includes(f.hero)&&events.shoot!==undefined){index=slot<m.hits-1?Math.min(6,contact+Math.floor(local/interval*(7-contact))):Math.min(7,contact+Math.floor(local/Math.max(1,Math.min(interval,m.active-slot*interval))*(8-contact)));}
 else if(m.hits>1&&slot<m.hits-1){const seq=[contact,Math.min(6,contact+1),6,2,3];index=seq[Math.min(4,Math.floor(local/interval*5))];}else index=contact+Math.min(7-contact,Math.floor(local/Math.max(1,Math.min(interval,m.active-slot*interval))*(8-contact)));}
 else index=7;
 return {clip,id,index,frame:clip.frames[index],scale};
}
function drawFighter(ctx,f){const pose=bodyPose(f);if(pose)return paint(ctx,pose.frame,f.x,f.y,f.dir,pose.scale);
 const a=f.attack;if(a?.move.rosterKit&&['attack2','attack3'].includes(a.clipId))return root.RiftMotionPreview?.draw(ctx,{...f,attack:{...a,name:a.clipId==='attack2'?'slash2':'slash3'}})||false;return false;}
function projectileOrigin(f,name){const a=f.attack;if(!a||a.name!==name)return null;const pose=bodyPose(f);if(pose){const p=pose.frame,m=p.muzzle||p.markers?.muzzle;if(!Array.isArray(m)||m.length!==2)return null;return {x:f.x+f.dir*(m[0]-p.anchor[0])*pose.scale,y:f.y+(m[1]-p.anchor[1])*pose.scale,targetHeight:['lara','drake'].includes(f.hero)?160:undefined};}
 if(a.move.rosterKit&&['attack2','attack3'].includes(a.clipId)){const fake={...f,attack:{...a,name:a.clipId==='attack2'?'slash2':'slash3'}};return root.RiftMotionPreview?.projectileOrigin(fake,fake.attack.name)||null;}return null;}
function clipFor(hero,id){return root.RiftRosterFX?.heroes?.[hero]?.clips?.[id];}
function drawAura(ctx,f,options={}){if(!f.awakenLevel||!HEROES.includes(f.hero))return false;const clip=clipFor(f.hero,'aura');if(!clip)return false;const full=f.awakenLevel===2,scale=full?.65:.5,index=options.reducedMotion?4:Math.floor((options.tick||0)/5)%8,p=clip.frames[index],bottom=Math.max(...clip.frames.map(q=>q.bounds?q.bounds[1]+q.bounds[3]:q.height));return paint(ctx,p,f.x,f.y-(bottom-p.anchor[1])*scale,f.dir,scale,['lara','drake'].includes(f.hero)?(full?.45:.28):(full?.7:.4));}
function drawEffect(ctx,e,options={}){let hero=e.hero||e.owner?.hero,id=e.clipId,mode=e.mode??e.rosterMode;
 if(e.kind==='zenitsuKitFx'){if(!mode)return false;hero='zenitsu';id=({extreme:'skill1',flash:'skill2',airspin:'skill3'})[id];}
 else if(e.kind==='explosion'&&e.rosterMode!==undefined){id='skill1';}
 else if(!['rosterFx','rosterImpact'].includes(e.kind))return false;
 id=id==='awaken'?'aura':id==='basic'?'skill2':id;const clip=clipFor(hero,id);if(!clip)return false;
 const age=Math.max(0,e.max-e.life),contact=id==='aura'?0:clip.events?.contact??clip.events?.strike??3,index=options.reducedMotion?4:Math.min(7,contact+Math.floor(age/Math.max(1,e.max)*(8-contact))),aura=id==='aura';let scale=(mode===2?.82:mode===1?.67:.5);if(['lara','drake'].includes(hero)&&id!=='skill1')scale*=.68;
 let x=e.x,y=e.y,angle=0;if(aura&&e.owner){x=e.owner.x;y=e.owner.y-115;}else if(['lara','drake'].includes(hero)){const origin=e.owner&&e.owner.attack===e.attack?projectileOrigin(e.owner,e.attack?.name):null;if(origin&&id!=='skill1'){x=origin.x;y=origin.y;}const m=e.attack?.move;if(m?.projectile==='bullet')angle=Math.atan2(m.shotY||0,m.speed||1);}
 return paint(ctx,clip.frames[index],x,y,e.dir||e.owner?.dir||1,scale,Math.min(1,e.life/5)*(mode===2?.92:.72),angle);
}
function drawProjectile(ctx,b,options={}){if(!b.rosterMode||b.kind!=='wave')return false;const clip=clipFor(b.owner.hero,b.fxClip||'skill1');if(!clip)return false;const index=options.reducedMotion?4:Math.min(6,Math.floor((b.age||0)/3)),scale=b.kind==='arrow'?.3:b.owner.hero==='wukong'?.35:.62;return paint(ctx,clip.frames[index],b.x,b.y,b.direction||Math.sign(b.vx)||1,scale,.86);}
function drawStartup(ctx,f,options={}){const a=f.attack,m=a?.move;if(!a||a.t>=m.startup||['bullet','arrow','grenade'].includes(m.projectile))return false;const hero=f.hero,id=m.rosterKit?(m.fxClip==='awaken'?'aura':m.fxClip):m.zenitsuMode>0&&a.name==='skill'?({extreme:'skill1',flash:'skill2',airspin:'skill3'})[a.variant]:null,clip=clipFor(hero,id);if(!clip)return false;const contact=clip.events?.contact??3,p=clip.frames[Math.min(contact-1,Math.floor(a.t/Math.max(1,m.startup)*contact))];const origin=projectileOrigin(f,a.name);return paint(ctx,p,origin?.x??f.x+f.dir*40,origin?.y??f.y-80,f.dir,['lara','drake'].includes(hero)?.3:.5,options.reducedMotion?.3:.5);}
root.RiftRosterVisual={ensureHero,isHeroReady,drawFighter,drawAura,drawEffect,drawProjectile,drawStartup,projectileOrigin,bodyPose};
})(typeof window!=='undefined'?window:globalThis);
