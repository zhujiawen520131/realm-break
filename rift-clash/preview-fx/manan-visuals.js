(function(root){
'use strict';
// Ma Nan is drawn exclusively from the exported pixel art. The timeline may
// reuse authored key poses; it does not advertise duplicated cels as new art.
const BODY_IDS=['idle','run','jump','hurt','guard','down','dash','attack1','attack2','attack3','launcher','air','skill','skill2','skill3','heavy','throw','awaken','ultimate'];
const FX_IDS=['ridge','pillar','roots','slam','aura','ultimate'];
const images=new Map(),jobs=new Map(),failures=new Set();let pending=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const source=p=>typeof p==='string'?p:p?.image;
function validFrame(p){return p&&typeof p.image==='string'&&p.image.length>0&&Number.isFinite(p.width)&&p.width>0&&Number.isFinite(p.height)&&p.height>0&&Array.isArray(p.anchor)&&p.anchor.length===2&&p.anchor.every(Number.isFinite);}
function pack(){return root.RiftMananData;}
function manifest(){
 const p=pack(),out=[];if(!p)return {error:'马楠美术清单未加载',files:[]};
 for(const [group,ids] of [['body',BODY_IDS],['fx',FX_IDS]])for(const id of ids){const clip=p[group]?.[id];if(!Array.isArray(clip?.frames)||clip.frames.length!==8||!clip.frames.every(validFrame))return {error:'马楠素材不完整：'+group+'/'+id,files:[]};out.push(...clip.frames.map(source));}
 for(const [group,required] of [['body',BODY_IDS],['fx',FX_IDS]])for(const [id,clip] of Object.entries(p[group]||{}))if(!required.includes(id)&&Array.isArray(clip?.frames)){if(!clip.frames.length||!clip.frames.every(validFrame))return {error:'马楠扩展素材不完整：'+group+'/'+id,files:[]};out.push(...clip.frames.map(source));}
 const platform=p.platform||p.fx?.platform?.frames?.[0];if(!validFrame(platform))return {error:'马楠平台素材或落脚点缺失',files:[]};out.push(source(platform));
 for(const id of ['card','poster']){if(!source(p[id]))return {error:'马楠素材不完整：'+id,files:[]};out.push(source(p[id]));}
 return {error:null,files:[...new Set(out)]};
}
function ready(hero='manan'){if(hero!=='manan')return true;const m=manifest();return !m.error&&m.files.every(s=>images.has(s));}
function status(hero='manan'){
 if(hero!=='manan')return {ready:true,loaded:0,total:0,failed:[],pending:0,error:null};
 const m=manifest(),failed=m.files.filter(s=>failures.has(s));return {ready:ready(hero),loaded:m.files.filter(s=>images.has(s)).length,total:m.files.length,failed,pending:m.files.filter(s=>jobs.has(s)).length,error:m.error||(failed.length?'马楠部分素材加载失败，可重试':null)};
}
function load(s){
 if(images.has(s))return Promise.resolve(true);if(jobs.has(s))return jobs.get(s);failures.delete(s);
 const job=new Promise(resolve=>{try{const im=new root.Image();im.onload=()=>{images.set(s,im);failures.delete(s);resolve(true);};im.onerror=()=>{failures.add(s);resolve(false);};if(root.RiftImageQueue)root.RiftImageQueue.load(im,s);else im.src=s;}catch(_){failures.add(s);resolve(false);}});
 jobs.set(s,job);job.then(()=>{if(jobs.get(s)===job)jobs.delete(s);});return job;
}
function preload(hero='manan'){
 if(hero!=='manan'||ready(hero))return Promise.resolve(true);if(pending)return pending;
 const m=manifest();if(m.error||typeof root.Image!=='function')return Promise.resolve(false);
 const job=Promise.all(m.files.map(load)).then(ok=>ok.every(Boolean)&&ready(hero));pending=job;job.then(()=>{if(pending===job)pending=null;});return job;
}
function paint(ctx,p,x,y,dir,scale,alpha=1,flash=false,scaleY=scale){
 const im=p&&images.get(p.image);if(!im||!validFrame(p))return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=(Number.isFinite(ctx.globalAlpha)?ctx.globalAlpha:1)*alpha;ctx.translate(x,y);ctx.scale(dir<0?-1:1,1);
 if(flash&&'filter' in ctx)ctx.filter='brightness(1.65) saturate(.75)';
 ctx.drawImage(im,-p.anchor[0]*scale,-p.anchor[1]*scaleY,p.width*scale,p.height*scaleY);ctx.restore();return true;
}
function loopFrame(clip,tick){
 if(!clip?.frames?.length)return 0;
 const durations=clip.frames.map(p=>Math.max(1,(p.durationMs||100)*.06)),total=durations.reduce((a,b)=>a+b,0);let t=Math.max(0,tick)%total;
 for(let i=0;i<durations.length;i++){if(t<durations[i])return i;t-=durations[i];}return 7;
}
function phaseFrame(a,clip){
 if(Number.isInteger(a.bodyFrame))return clamp(a.bodyFrame,0,7);
 const m=a.move||{},t=Math.max(0,a.t||0),start=Math.max(1,m.startup||1),active=Math.max(1,m.active||1),end=Math.max(start+active+1,m.end||1);
 if(a.name==='awaken')return Math.min(7,Math.floor(t/Math.max(1,m.end||34)*8));
 const event=clip.events?.contact??clip.events?.impact??clip.events?.strike??4,contact=clamp(event,1,6);
 if(t<start)return Math.min(contact-1,Math.floor(t/start*contact));
 if(t<start+active)return contact+Math.min(6-contact,Math.floor((t-start)/active*(7-contact)));
 return 7;
}
function getPose(f){
 if(f?.hero!=='manan')return null;
 const data=pack();if(!data)return null;let id='idle',index=0,a=f.attack;
 if(f.downTime>0){id='down';index=Math.min(7,Math.floor((f.downAge||0)/4));}
 else if(f.stun>0||f.knockdown){id='hurt';index=f.knockdown?Math.min(7,3+Math.floor((f.fallTime||0)/5)):Math.min(7,Math.floor((f.animTime||0)/3));}
 else if(a){
  if(a.name==='ultimate'&&root.RiftMananRules?.ultimatePose)a=root.RiftMananRules.ultimatePose(a)||a;
  id=a.clipId||a.move?.clipId||({slash1:'attack1',slash2:'attack2',slash3:'attack3',airheavy:'heavy',launcher:'launcher',air:'air',skill:'skill',awaken:'awaken',ultimate:'ultimate',throw:'throw',heavy:'heavy'}[a.name])||'attack1';
  if(a.name==='awaken'&&(a.move?.mananMode??f.awakenLevel)===2&&data.body?.awaken2)id='awaken2';
  if(!data.body?.[id])return null;index=phaseFrame(a,data.body[id]);
 }else if(f.dash||f.blinkTime){id='dash';index=Math.min(7,Math.floor((f.animTime||0)/2));}
 else if(f.block||f.guardStun>0){id='guard';index=loopFrame(data.body.guard,f.animTime||0);}
 else if(!f.grounded&&f.grounded!==undefined||f.state==='jump'||f.animState==='jump'){
  id='jump';index=f.vy<-6?1:f.vy<-1?2:f.vy<=1?3:f.vy<6?4:5;
 }else if(Math.abs(f.vx||0)>1||f.state==='run'){id='run';index=loopFrame(data.body.run,f.animTime||0);}
 else {id=f.awakenLevel===2&&data.body.fullIdle?'fullIdle':'idle';index=loopFrame(data.body[id],f.animTime||0);}
 const clip=data.body?.[id];if(!clip?.frames?.[index])return null;
 return {id,index,clip,frame:clip.frames[index],scale:clip.scale||data.bodyScale||1,mode:a?.move?.mananMode??f.awakenLevel??0};
}
function draw(ctx,f){const pose=getPose(f);return !!pose&&paint(ctx,pose.frame,f.x||0,f.y||0,f.dir||1,pose.scale,1,!!f.flash);}
function drawAura(ctx,f,options={}){
 if(f?.hero!=='manan'||!f.awakenLevel)return false;
 const clip=(f.awakenLevel===2?pack()?.fx?.aura2:null)||pack()?.fx?.aura;if(!clip)return false;const tick=options.tick??f.animTime??0,index=options.reducedMotion?4:loopFrame(clip,tick),level=f.awakenLevel;
 const scale=(clip.scale||.5)*(level===2?1.25:1);return paint(ctx,clip.frames[index],f.x,f.y,f.dir,scale,options.reducedMotion?.4:level===2?.76:.5);
}
function drawEffect(ctx,e,options={}){
 if(e?.kind!=='mananFx')return false;const clip=pack()?.fx?.[e.clipId];if(!clip)return false;
 const life=clamp(e.life||0,0,e.max||1),age=Math.max(0,(e.max||1)-life),index=options.reducedMotion?4:Math.min(7,Math.floor(age/Math.max(1,e.max||1)*8)),mode=e.mode||0;
 let x=e.x||0,y=e.y||0;if(e.projectile){x=e.projectile.x;y=e.projectile.y+65;}
 const scale=(e.scale||clip.scale||.5)*(mode===2?1.25:mode===1?1.1:1),fade=Math.min(1,life/5);
 const stackedRidge=e.clipId==='ridge'&&mode===2?.82:1;
 return paint(ctx,clip.frames[index],x,y,e.dir||e.owner?.dir||1,scale,fade*stackedRidge*(options.reducedMotion?.6:1));
}
function drawPlatforms(ctx,world,options={}){
 const p=pack()?.platform||pack()?.fx?.platform?.frames?.[0];if(!p||!images.has(p.image))return false;let drawn=false;
 for(const surface of world?.temporaryPlatforms||[]){
  if(surface.life<=0)continue;
  const width=Math.max(1,surface.w),sx=width/(p.surfaceWidth||p.width),sy=p.scaleY||pack().platformScale||sx;
  // The exported anchor is the visible flat top, not the bottom of the rock.
  const warning=surface.life<30,alpha=warning&&!options.reducedMotion?(Math.floor(surface.life/4)%2?.9:.42):1;
  drawn=paint(ctx,p,surface.x+width/2,surface.y,1,sx,alpha,false,sy)||drawn;
 }return drawn;
}
function drawPortrait(ctx,x,y,w,h,options={}){
 const s=source(pack()?.[options.poster?'poster':'card']),im=images.get(s);if(!im)return false;
 const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;if(!(iw>0&&ih>0&&w>0&&h>0))return false;
 const scale=Math.min(w/iw,h/ih),dw=iw*scale,dh=ih*scale;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();return true;
}
const api={ready,preload,status,isHeroReady:ready,ensureHero:preload,draw,drawFighter:draw,drawAura,drawEffect,drawPlatforms,drawPortrait,getPose,phaseFrame,cardSource:()=>source(pack()?.card),posterSource:()=>source(pack()?.poster)};
root.RiftMananVisual=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
