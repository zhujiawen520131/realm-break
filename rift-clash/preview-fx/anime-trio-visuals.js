(function(root){
'use strict';
// The eight timeline slots are compositions of authored keys, not a claim that
// each slot is a separately painted cel. Each hero and mode has its own art.
const IDS=['luffy','kirito','naruto'];
const BODY=['idle','run','jump','hurt','guard','down','dash','attack1','attack2','attack3','launcher','air','skill','skill2','skill3','heavy','throw','awaken','ultimate','awaken2','mode1Idle','fullIdle','signature'];
const FX=['strike','skill1','skill2','skill3','aura','aura2','ultimate'];
const images=new Map(),jobs=new Map(),failures=new Set(),pending=new Map();let pendingCards=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pack=id=>root.RiftAnimeTrioData?.[id];
const source=p=>typeof p==='string'?p:p?.image;
const valid=p=>p&&typeof p.image==='string'&&p.image.length>0&&Number.isFinite(p.width)&&p.width>0&&Number.isFinite(p.height)&&p.height>0&&Array.isArray(p.anchor)&&p.anchor.length===2&&p.anchor.every(Number.isFinite);
function manifest(hero){
 const p=pack(hero),files=[];if(!p)return {error:'角色美术清单未加载：'+hero,files};
 for(const [group,required] of [['body',BODY],['fx',FX]]){
  for(const id of required){const c=p[group]?.[id];if(!Array.isArray(c?.frames)||c.frames.length!==8||!c.frames.every(valid))return {error:'角色素材不完整：'+hero+'/'+group+'/'+id,files:[]};}
  for(const [id,c] of Object.entries(p[group]||{})){if(!Array.isArray(c?.frames)||c.frames.length!==8||!c.frames.every(valid))return {error:'角色素材不完整：'+hero+'/'+group+'/'+id,files:[]};files.push(...c.frames.map(source));}
 }
 for(const id of ['card','poster']){if(!source(p[id]))return {error:'角色素材不完整：'+hero+'/'+id,files:[]};files.push(source(p[id]));}
 return {error:null,files:[...new Set(files)]};
}
function ready(hero){if(!IDS.includes(hero))return true;const m=manifest(hero);return !m.error&&m.files.every(s=>images.has(s));}
function status(hero){if(!IDS.includes(hero))return {ready:true,loaded:0,total:0,failed:[],pending:0,error:null};const m=manifest(hero),failed=m.files.filter(s=>failures.has(s));return {ready:ready(hero),loaded:m.files.filter(s=>images.has(s)).length,total:m.files.length,failed,pending:m.files.filter(s=>jobs.has(s)).length,error:m.error||(failed.length?'角色部分素材加载失败，可重试':null)};}
function load(s){if(images.has(s))return Promise.resolve(true);if(jobs.has(s))return jobs.get(s);failures.delete(s);const job=new Promise(resolve=>{try{const im=new root.Image();im.onload=()=>{images.set(s,im);failures.delete(s);resolve(true);};im.onerror=()=>{failures.add(s);resolve(false);};if(root.RiftImageQueue)root.RiftImageQueue.load(im,s);else im.src=s;}catch(_){failures.add(s);resolve(false);}});jobs.set(s,job);job.then(()=>{if(jobs.get(s)===job)jobs.delete(s);});return job;}
function preload(hero){if(!IDS.includes(hero)||ready(hero))return Promise.resolve(true);if(pending.has(hero))return pending.get(hero);const m=manifest(hero);if(m.error||typeof root.Image!=='function')return Promise.resolve(false);const job=Promise.all(m.files.map(load)).then(ok=>ok.every(Boolean)&&ready(hero));pending.set(hero,job);job.then(()=>{if(pending.get(hero)===job)pending.delete(hero);});return job;}
function ensureCards(){if(pendingCards)return pendingCards;const paths=IDS.map(id=>source(pack(id)?.card));if(paths.some(x=>!x)||typeof root.Image!=='function')return Promise.resolve(false);const job=Promise.all(paths.map(load)).then(a=>a.every(Boolean));pendingCards=job;job.then(()=>{if(pendingCards===job)pendingCards=null;});return job;}
function paint(ctx,p,x,y,dir,scale=1,alpha=1,flash=false){const im=p&&images.get(p.image);if(!im||!valid(p))return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=(Number.isFinite(ctx.globalAlpha)?ctx.globalAlpha:1)*alpha;ctx.translate(x,y);ctx.scale(dir<0?-1:1,1);if(flash&&'filter'in ctx)ctx.filter='brightness(1.65) saturate(.75)';ctx.drawImage(im,-p.anchor[0]*scale,-p.anchor[1]*scale,p.width*scale,p.height*scale);ctx.restore();return true;}
function loopFrame(clip,tick){if(!clip?.frames?.length)return 0;const d=clip.frames.map(p=>Math.max(1,(p.durationMs||100)*.06)),total=d.reduce((a,b)=>a+b,0);let t=Math.max(0,tick)%total;for(let i=0;i<d.length;i++){if(t<d[i])return i;t-=d[i];}return 7;}
function phaseFrame(a,clip){if(Number.isInteger(a.bodyFrame))return clamp(a.bodyFrame,0,7);const m=a.move||{},t=Math.max(0,a.t||0),start=Math.max(1,m.startup||1),active=Math.max(1,m.active||1);if(a.name==='awaken')return Math.min(7,Math.floor(t/Math.max(1,m.end||34)*8));const contact=clamp(clip.events?.strike??3,1,6);if(t<start)return Math.min(contact-1,Math.floor(t/start*contact));if(t<start+active)return contact+Math.min(6-contact,Math.floor((t-start)/active*(7-contact)));return 7;}
function getPose(f){
 if(!IDS.includes(f?.hero))return null;const data=pack(f.hero);if(!data)return null;let id='idle',index=0,a=f.attack;
 if(f.downTime>0){id='down';index=Math.min(7,Math.floor((f.downAge||0)/4));}
 else if(f.stun>0||f.knockdown){id='hurt';index=f.knockdown?Math.min(7,3+Math.floor((f.fallTime||0)/5)):Math.min(7,Math.floor((f.animTime||0)/3));}
 else if(a){if(a.name==='ultimate'&&root.RiftAnimeTrioRules?.ultimatePose)a=root.RiftAnimeTrioRules.ultimatePose(a)||a;id=a.clipId||a.move?.clipId||({slash1:'attack1',slash2:'attack2',slash3:'attack3',airheavy:'heavy',air:'air',skill:'skill',heavy:'heavy',throw:'throw',awaken:'awaken',ultimate:'ultimate'}[a.name])||'attack1';if(id==='skill1')id='skill';if(a.name==='awaken'&&(a.move?.animeMode??f.awakenLevel)===2)id='awaken2';}
 else if(f.dash||f.blinkTime)id='dash';
 else if(f.block||f.guardStun>0)id='guard';
 else if((!f.grounded&&f.grounded!==undefined)||f.state==='jump'||f.animState==='jump')id='jump';
 else if(Math.abs(f.vx||0)>1||f.state==='run')id='run';
 const mode=a?.move?.animeMode??f.awakenLevel??0;let selected=id;
 if(mode>0&&data.body?.['mode'+mode+'_'+id])selected='mode'+mode+'_'+id;
 else if(!a&&id==='idle'&&mode===1)selected='mode1Idle';else if(!a&&id==='idle'&&mode===2)selected='fullIdle';
 const clip=data.body?.[selected]||data.body?.[id];if(!clip)return null;
 if(a)index=phaseFrame(a,clip);else if(id==='jump')index=f.vy<-6?1:f.vy<-1?2:f.vy<=1?3:f.vy<6?4:5;else if(id==='dash')index=Math.min(7,Math.floor((f.animTime||0)/2));else if(!['hurt','down'].includes(id))index=loopFrame(clip,f.animTime||0);
 if(!clip.frames?.[index])return null;return {id:selected,baseId:id,index,clip,frame:clip.frames[index],scale:clip.scale||data.bodyScale||1,mode};
}
function drawFighter(ctx,f){const p=getPose(f);return !!p&&paint(ctx,p.frame,f.x||0,f.y||0,f.dir||1,p.scale,1,!!f.flash);}
function drawAura(ctx,f,options={}){if(!IDS.includes(f?.hero)||!f.awakenLevel)return false;const p=pack(f.hero),clip=f.awakenLevel===2?p?.fx?.aura2:p?.fx?.aura;if(!clip)return false;const index=options.reducedMotion?4:loopFrame(clip,options.tick??f.animTime??0);return paint(ctx,clip.frames[index],f.x,f.y,f.dir||1,clip.scale||1,options.reducedMotion?.35:.52);}
function drawEffect(ctx,e,options={}){if(e?.kind!=='animeTrioFx'||!IDS.includes(e.hero))return false;const p=pack(e.hero),clip=p?.fx?.[e.clipId];if(!clip)return false;const life=clamp(e.life||0,0,e.max||1),age=Math.max(0,(e.max||1)-life),i=options.reducedMotion?4:Math.min(7,Math.floor(age/Math.max(1,e.max||1)*8)),frame=clip.frames[i],scale=e.scale||clip.scale||1;let x=e.x||0,y=e.y||0;if(e.projectile){x=e.projectile.x;y=e.projectile.y;}
 const dir=e.dir||e.owner?.dir||1,fade=Math.min(1,life/5)*(options.reducedMotion?.7:1);
 if(e.clipId==='clone'){
  // A clone begins behind the caster and advances along the fixed input
  // direction. In an awakened mode, use the separately authored matching
  // costume rather than reverting the duplicate to base-form clothing.
  x+=dir*(i*12);const mode=e.mode||0,body=mode&&i>=2&&i<=6?p.body?.['mode'+mode+'_attack1']:null;
  if(body){const smoke=p.fx.clone.frames[i<4?0:7];paint(ctx,smoke,x,y,dir,scale,fade*.6);return paint(ctx,body.frames[i],x,y,dir,body.scale||1,fade*.85);}
 }
 return paint(ctx,frame,x,y,dir,scale,fade);}
function drawPortrait(ctx,hero,x,y,w,h,options={}){const s=source(pack(hero)?.[options.poster?'poster':'card']),im=images.get(s);if(!im)return false;ctx.save();ctx.imageSmoothingEnabled=false;const iw=im.naturalWidth||im.width||w,ih=im.naturalHeight||im.height||h;if(options.poster){const k=Math.max(w/iw,h/ih),sw=w/k,sh=h/k;ctx.drawImage(im,(iw-sw)/2,(ih-sh)/2,sw,sh,x,y,w,h);}else{const k=Math.min(w/iw,h/ih);ctx.drawImage(im,x+(w-iw*k)/2,y+h-ih*k,iw*k,ih*k);}ctx.restore();return true;}
root.RiftAnimeTrioVisual={IDS,BODY,FX,manifest,ready,preload,status,isHeroReady:ready,ensureHero:preload,ensureCards,draw:drawFighter,drawFighter,drawAura,drawEffect,drawPortrait,getPose};
if(typeof module!=='undefined')module.exports=root.RiftAnimeTrioVisual;
})(typeof window!=='undefined'?window:globalThis);
