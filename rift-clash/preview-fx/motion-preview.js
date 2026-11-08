(function(root){
'use strict';
// Character motion for every combat state and selection card.
// Animation follows simulation ticks, so hitstop freezes both body and muzzle.
// Full-roster pages stream only the active heroes and retain six idle card poses.
const pack=root.RiftMotionData,images={},loadedClips={},frameJobs={},heroJobs={},epochs={};
const ATTACK_CLIPS={slash1:'attack1',slash2:'attack2',slash3:'attack3',skill:'skill',ultimate:'ultimate'};
const fullRoster=pack?.fullRoster===true;
for(const hero of Object.keys(pack?.heroes||{})){images[hero]={};loadedClips[hero]={};frameJobs[hero]={};epochs[hero]=0;}
function loadFrame(hero,id,index){
 const clip=pack?.heroes?.[hero]?.clips?.[id],frame=clip?.frames?.[index];
 if(!frame||typeof root.Image!=='function')return Promise.resolve(false);
 images[hero][id]??=[];frameJobs[hero][id]??=[];
 if(images[hero][id][index])return Promise.resolve(true);
 if(frameJobs[hero][id][index])return frameJobs[hero][id][index];
 const epoch=epochs[hero],source=frame.image||frame.src;
 if(!source)return Promise.resolve(false);
 const job=new Promise(resolve=>{
  const img=new root.Image();
  img.onload=()=>{if(epoch!==epochs[hero]){resolve(false);return;}images[hero][id][index]=img;resolve(true);};
  img.onerror=()=>resolve(false);img.src=source;
 });
 frameJobs[hero][id][index]=job;
 job.then(ok=>{if(!ok&&epochs[hero]===epoch)delete frameJobs[hero][id][index];});
 return job;
}
async function loadClip(hero,id){
 const frames=pack?.heroes?.[hero]?.clips?.[id]?.frames;
 if(!Array.isArray(frames)||![4,8].includes(frames.length))return false;
 const epoch=epochs[hero],result=await Promise.all(frames.map((_,i)=>loadFrame(hero,id,i)));
 const ok=result.every(Boolean)&&epoch===epochs[hero];
 if(epoch===epochs[hero])loadedClips[hero][id]=ok;
 return ok;
}
function isHeroReady(hero){const ids=Object.keys(pack?.heroes?.[hero]?.clips||{});return ids.length>0&&ids.every(id=>loadedClips[hero]?.[id]);}
function ensureHero(hero){
 if(!pack?.heroes?.[hero]||typeof root.Image!=='function')return Promise.resolve(false);
 if(isHeroReady(hero))return Promise.resolve(true);
 if(heroJobs[hero])return heroJobs[hero];
 const epoch=epochs[hero],job=Promise.all(Object.keys(pack.heroes[hero].clips||{}).map(id=>loadClip(hero,id))).then(results=>results.length>0&&results.every(Boolean));
 heroJobs[hero]=job;job.then(()=>{if(epoch===epochs[hero])delete heroJobs[hero];});return job;
}
function retainHeroes(heroes=[]){
 if(!pack?.lazy)return;
 const keep=new Set(heroes);
 for(const hero of Object.keys(images))if(!keep.has(hero)){
  const idle=images[hero].idle?.[0];epochs[hero]++;
  images[hero]=idle?{idle:[idle]}:{};loadedClips[hero]={};frameJobs[hero]={};delete heroJobs[hero];
  // A selection card always retains its approved first idle pose.
  if(!idle)loadFrame(hero,'idle',0);
 }
}
const ready=(async()=>{
 if(!pack?.heroes||typeof root.Image!=='function')return false;
 const heroes=Object.keys(pack.heroes),results=await Promise.all(heroes.map(hero=>pack.lazy?loadFrame(hero,'idle',0):ensureHero(hero)));
 return results.length>0&&results.every(Boolean);
})();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function choose(elapsed,span,indices,weights){
 if(!indices.length)return 0;
 const valid=Array.isArray(weights)&&weights.length===indices.length&&weights.every(v=>Number.isFinite(v)&&v>0),ws=valid?weights:indices.map(()=>1),total=ws.reduce((a,b)=>a+b,0);
 let value=clamp(elapsed/Math.max(1,span),0,.999999)*total;
 for(let i=0;i<indices.length;i++){if(value<ws[i])return indices[i];value-=ws[i];}
 return indices[indices.length-1];
}
const range=(first,last)=>Array.from({length:Math.max(0,last-first+1)},(_,i)=>first+i);
const sequence=(value,fallback,count)=>Array.isArray(value)&&value.length&&value.every(i=>Number.isInteger(i)&&i>=0&&i<count)?value:fallback;
function stateOf(f,ghost){
 if((f.knockdown||f.downTime)&&pack?.heroes?.[f.hero]?.clips?.knockdown)return 'knockdown';
 if(f.guardStun>0&&f.block)return 'guard';
 if(f.stun>0)return 'hurt';
 if(f.dash||f.blinkTime||f.attack?.name==='dashstrike'||ghost&&f.animState==='dash')return 'dash';
 if(f.attack)return 'attack';
 if(!ghost&&Number.isFinite(f.y)&&f.y<(Number.isFinite(f.groundY)?f.groundY:(root.Rift?.FLOOR??510)))return 'jump';
 if(f.block)return 'guard';
 if(Math.abs(f.vx||0)>1)return 'run';
 if(f.landTime)return 'land';
 return 'idle';
}
function poseFor(f,id,index,extra={}){
 const hero=pack?.heroes?.[f.hero],clip=hero?.clips?.[id],frame=clip?.frames?.[index];
 if(!frame||!Array.isArray(frame.anchor)||frame.anchor.length!==2)return null;
 const candidate=clip.scale??hero.scale??pack.scale??.4,scale=Number.isFinite(candidate)&&candidate>0?candidate:.4;
 const preview=Number(frame.previewOffsetY)||0,local=Number(frame.gameOffsetY??(clip.preservePreviewOffset?preview:0))||0;
 const offsetX=Number(frame.gameOffsetX)||0;
 return {hero:f.hero,clip:id,index,frame,scale,x:(-frame.anchor[0]+offsetX)*scale,y:-(frame.anchor[1]+preview)*scale+local*scale,...extra};
}
function resolve(f,t=0,ghost=false){
 const hero=pack?.heroes?.[f?.hero];if(!hero)return null;
 const state=stateOf(f,ghost),tick=Math.max(0,Number.isFinite(f.animTime)?f.animTime:t);
 if(state!=='attack'){
  let id=state==='land'?'jump':state,index=0;
  if(f.guardReleaseTime>0&&state==='idle')id='guard';
  const clip=hero.clips?.[id],frames=clip?.frames;if(!Array.isArray(frames)||![4,8].includes(frames.length))return null;
  const last=frames.length-1;
  if(pack.eightFrameMode&&frames.length===8){
   if(state==='knockdown'){
    if(f.downTime>0)index=f.downTime<=6?(f.downTime>3?6:7):(f.downAge||0)<4?4:5;
    else index=(f.fallTime||0)<3?0:(f.fallTime||0)<7?1:f.vy<=0?2:3;
   }else if(state==='jump')index=f.vy<-12?0:f.vy<-10?1:f.vy<-2?2:f.vy<=2?3:f.vy<=8?4:5;
   else if(state==='land')index=f.landTime>3?6:7;
   else if(f.guardReleaseTime>0&&state==='idle')index=f.guardReleaseTime>3?6:7;
   else if(state==='guard')index=f.guardStun>0?(f.guardStun>4?4:5):tick<2?0:tick<4?1:2+Math.floor((tick-4)/6)%2;
   else if(state==='hurt')index=f.stun<=6?Math.min(7,5+Math.floor((6-f.stun)/2)):Math.min(4,tick);
   else if(state==='dash')index=f.dash>0?choose(12-f.dash,11,range(0,7)):f.blinkTime>0?choose(7-f.blinkTime,6,range(0,7)):Math.min(7,Math.floor(tick*8/12));
   else{const durations=frames.map(frame=>Math.max(1,Number(frame.durationMs)||100)),span=durations.reduce((a,b)=>a+b,0);index=choose(tick*1000/60%span,span,range(0,last),durations);}
  }else{
  if(state==='jump')index=f.vy<0?(tick<4?0:1):2;
  else if(state==='land'||f.guardReleaseTime>0&&state==='idle')index=last;
  else if(state==='guard')index=f.guardStun>0?2:tick<4?0:1;
  else if(state==='hurt')index=Math.min(last,Math.floor(tick/5));
  else if(state==='dash')index=Math.min(last,Math.floor(tick/4));
  else{const durations=frames.map(frame=>Math.max(1,Number(frame.durationMs)||100)),span=durations.reduce((a,b)=>a+b,0);index=choose(tick*1000/60%span,span,range(0,last),durations);}
  }
  return poseFor(f,id,index,{state,phase:state,borrowed:false});
 }
 const a=f.attack.waterSequence&&root.RiftTanjiroRules?root.RiftTanjiroRules.ultimatePose(f.attack):f.attack,dedicated=hero.clips?.[a.name],borrowed=f.hero==='lara'&&['launcher','air'].includes(a.name)&&!dedicated;
 const id=ATTACK_CLIPS[a.name]||(dedicated?a.name:borrowed?'attack1':null),clip=hero.clips?.[id];
 if(!Array.isArray(clip?.frames)||![4,8].includes(clip.frames.length))return null;
 const count=clip.frames.length,lastFrame=count-1,lastActive=count-2,seq=(value,fallback)=>sequence(value,fallback,count);
 const m=a.move||{},at=Math.max(0,Number(a.t)||0),startup=Math.max(1,Number(m.startup)||1),end=Math.max(startup+2,Number(m.end)||startup+2),active=Math.max(1,Number(m.active)||1);
 const contact=clamp(Number.isInteger(clip.eventFrame)?clip.eventFrame:Math.floor(count/2),1,lastActive);let index,phase;
 if(at<startup){index=choose(at,startup,seq(clip.startupSequence,range(0,contact-1)),clip.startupWeights);phase='anticipation';}
 else{
  // The original skill's active=1 describes emission, not the entire scheduled
  // gun volley. Recoil is keyed to the actual scheduled release intervals.
  const volley=a.name==='ultimate'&&(f.hero==='lara'||f.hero==='drake');
  const period=volley?(f.hero==='lara'?6:7):Math.max(1,Number(m.interval)||active);
  const count=volley?(f.hero==='lara'?6:5):Math.ceil(active/period);
  const multi=volley||!!m.style;
  if(multi){
   const activeEnd=volley?Math.min(end-1,startup+(count-1)*period+3):Math.min(end-1,startup+active);
   if(at<activeEnd){const strike=Math.floor((at-startup)/period),alternates=clip.hitSequences,selected=Array.isArray(alternates)&&alternates.length?alternates[strike%alternates.length]:clip.activeSequence,poses=seq(selected,range(contact,Math.min(lastActive,contact+2)));index=choose((at-startup)%period,period,poses,clip.activeWeights||(poses.length===3?[1,2,Math.max(1,period-3)]:undefined));phase='release';}
   else{index=choose(at-activeEnd,end-activeEnd,seq(clip.recoverySequence,range(Math.min(lastFrame,contact+3),lastFrame)),clip.recoveryWeights);phase='recovery';}
  }else{
   const activeEnd=Math.min(end-1,startup+active),last=active>1?clamp(Number.isInteger(clip.activeEndFrame)?clip.activeEndFrame:contact+1,contact,lastActive):contact;
   if(at<activeEnd){index=choose(at-startup,activeEnd-startup,seq(clip.activeSequence,range(contact,last)),clip.activeWeights);phase='release';}
   else{const remaining=seq(clip.recoverySequence,range(last+1,lastFrame)),weights=clip.recoveryWeights||(f.hero==='lara'&&a.move?.pistol&&remaining.length===3?[2,3,7]:undefined);index=choose(at-activeEnd,end-activeEnd,remaining,weights);phase='recovery';}
  }
 }
 return poseFor(f,id,index,{state,phase,borrowed,contactFrame:contact});
}
function projectileOrigin(f,name){
 if(f?.attack?.name!==name)return null;
 const pose=resolve(f);if(!pose||pose.state!=='attack'||!loadedClips[pose.hero]?.[pose.clip])return null;
 const clip=pack.heroes[pose.hero].clips[pose.clip],marker=pose.frame.muzzle||clip.muzzle;
 if(!Array.isArray(marker)||marker.length!==2||!marker.every(Number.isFinite))return null;
 return {x:f.x+(f.dir||1)*(pose.x+marker[0]*pose.scale),y:f.y+pose.y+marker[1]*pose.scale,targetHeight:clip.projectileTargetHeight===160?160:undefined};
}
function draw(context,f,t=0,ghost=false){
 let pose=resolve(f,t,ghost),img=pose&&loadedClips[pose.hero]?.[pose.clip]?images[pose.hero]?.[pose.clip]?.[pose.index]:null;
 if(!img&&fullRoster&&pack?.heroes?.[f?.hero]){
  // During streaming or a failed clip, retain this hero's approved idle art.
  // Never fall through to the old procedural/atlas character renderer.
  // App owns loading/retry; drawing a missing frame must not retry every RAF.
  pose=poseFor(f,'idle',0);img=images[f.hero]?.idle?.[0];
  if(!img)return true;
 }
 if(!pose||!img)return false;
 context.save();if(pack?.revision?.startsWith('pixel-'))context.imageSmoothingEnabled=false;context.translate(f.x||0,f.y||0);context.scale(f.dir||1,1);
 if(f.flash>0&&!ghost&&'filter' in context)context.filter='brightness(1.8) saturate(.65)';
 context.drawImage(img,pose.x,pose.y,pose.frame.width*pose.scale,pose.frame.height*pose.scale);context.restore();return true;
}
root.RiftMotionPreview={ready,resolve,draw,projectileOrigin,ensureHero,isHeroReady,retainHeroes};
})(typeof window!=='undefined'?window:globalThis);
