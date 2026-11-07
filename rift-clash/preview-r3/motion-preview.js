(function(root){
'use strict';
// Optional R3 art preview. All motion follows the combat clock; no wall-clock
// animation, homing, or invented pose rotations. Calibrated muzzle markers
// optionally supply the real projectile origin for this art preview.
const pack=root.RiftMotionData,images={},loadedClips={};
const ATTACK_CLIPS={slash1:'attack1',slash2:'attack2',slash3:'attack3',skill:'skill',ultimate:'ultimate'};
const ready=(async()=>{
 if(!pack?.heroes||typeof root.Image!=='function')return false;
 const tasks=[];
 for(const [hero,data] of Object.entries(pack.heroes)){
  images[hero]={};loadedClips[hero]={};
  for(const [id,clip] of Object.entries(data.clips||{})){
   if(!Array.isArray(clip.frames)||clip.frames.length!==8){loadedClips[hero][id]=false;tasks.push(Promise.resolve(false));continue;}
   images[hero][id]=[];
   tasks.push(Promise.all(clip.frames.map((frame,index)=>new Promise(resolve=>{
    const source=frame.image||frame.src;if(!source){resolve(false);return;}
    const img=new root.Image();img.onload=()=>{images[hero][id][index]=img;resolve(true);};img.onerror=()=>resolve(false);img.src=source;
   }))).then(result=>loadedClips[hero][id]=result.every(Boolean)));
  }
 }
 const result=await Promise.all(tasks);return result.length>0&&result.every(Boolean);
})();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function choose(elapsed,span,indices,weights){
 if(!indices.length)return 7;
 const valid=Array.isArray(weights)&&weights.length===indices.length&&weights.every(v=>Number.isFinite(v)&&v>0),ws=valid?weights:indices.map(()=>1),total=ws.reduce((a,b)=>a+b,0);
 let value=clamp(elapsed/Math.max(1,span),0,.999999)*total;
 for(let i=0;i<indices.length;i++){if(value<ws[i])return indices[i];value-=ws[i];}
 return indices[indices.length-1];
}
const range=(first,last)=>Array.from({length:Math.max(0,last-first+1)},(_,i)=>first+i);
const sequence=(value,fallback)=>Array.isArray(value)&&value.length&&value.every(i=>Number.isInteger(i)&&i>=0&&i<8)?value:fallback;
function resolve(f,t=0,ghost=false){
 const a=f?.attack;if(!a||f.stun>0||f.guardStun>0&&f.block||f.dash||f.blinkTime||ghost&&f.animState==='dash')return null;
 const hero=pack?.heroes?.[f.hero];if(!hero)return null;
 const dedicated=hero.clips?.[a.name];const borrowed=f.hero==='lara'&&['launcher','air'].includes(a.name)&&!dedicated;
 const id=ATTACK_CLIPS[a.name]||(dedicated?a.name:borrowed?'attack1':null),clip=hero.clips?.[id];if(!clip?.frames||clip.frames.length!==8)return null;
 const m=a.move||{},at=Math.max(0,Number(a.t)||0),startup=Math.max(1,Number(m.startup)||1),end=Math.max(startup+2,Number(m.end)||startup+2),active=Math.max(1,Number(m.active)||1);
 const contact=clamp(Number.isInteger(clip.eventFrame)?clip.eventFrame:4,1,6);let index,phase;
 if(at<startup){index=choose(at,startup,sequence(clip.startupSequence,range(0,contact-1)),clip.startupWeights);phase='anticipation';}
 else{
  // The original skill's active=1 describes emission, not the entire scheduled
  // gun volley. Recoil is keyed to the actual scheduled release intervals.
  const volley=a.name==='ultimate'&&(f.hero==='lara'||f.hero==='drake');
  const period=volley?(f.hero==='lara'?6:7):Math.max(1,Number(m.interval)||active);
  const count=volley?(f.hero==='lara'?6:5):Math.ceil(active/period);
  const multi=volley||!!m.style;
  if(multi){
   const activeEnd=volley?Math.min(end-1,startup+(count-1)*period+3):Math.min(end-1,startup+active);
   if(at<activeEnd){const strike=Math.floor((at-startup)/period),alternates=clip.hitSequences,selected=Array.isArray(alternates)&&alternates.length?alternates[strike%alternates.length]:clip.activeSequence,poses=sequence(selected,range(contact,Math.min(6,contact+2)));index=choose((at-startup)%period,period,poses,clip.activeWeights||(poses.length===3?[1,2,Math.max(1,period-3)]:undefined));phase='release';}
   else{index=choose(at-activeEnd,end-activeEnd,sequence(clip.recoverySequence,range(Math.min(7,contact+3),7)),clip.recoveryWeights);phase='recovery';}
  }else{
   const activeEnd=Math.min(end-1,startup+active),last=active>1?clamp(Number.isInteger(clip.activeEndFrame)?clip.activeEndFrame:contact+1,contact,6):contact;
   if(at<activeEnd){index=choose(at-startup,activeEnd-startup,sequence(clip.activeSequence,range(contact,last)),clip.activeWeights);phase='release';}
   else{const remaining=sequence(clip.recoverySequence,range(last+1,7)),weights=clip.recoveryWeights||(f.hero==='lara'&&a.move?.pistol&&remaining.length===3?[2,3,7]:undefined);index=choose(at-activeEnd,end-activeEnd,remaining,weights);phase='recovery';}
  }
 }
 const frame=clip.frames[index];if(!frame||!Array.isArray(frame.anchor)||frame.anchor.length!==2)return null;
 const candidate=clip.scale??hero.scale??pack.scale??.4,scale=Number.isFinite(candidate)&&candidate>0?candidate:.4;
 // Review jump offsets are not world physics. A deliberate local flip/lift may
 // be retained by gameOffsetY or preservePreviewOffset, selected in the data.
 const preview=Number(frame.previewOffsetY)||0,local=Number(frame.gameOffsetY??(clip.preservePreviewOffset?preview:0))||0;
 return {hero:f.hero,clip:id,index,frame,phase,borrowed,contactFrame:contact,scale,x:-frame.anchor[0]*scale,y:-(frame.anchor[1]+preview)*scale+local*scale};
}
function projectileOrigin(f,name){
 if(f?.attack?.name!==name)return null;
 const pose=resolve(f);if(!pose||!loadedClips[pose.hero]?.[pose.clip])return null;
 const clip=pack.heroes[pose.hero].clips[pose.clip],marker=pose.frame.muzzle||clip.muzzle;
 if(!Array.isArray(marker)||marker.length!==2||!marker.every(Number.isFinite))return null;
 return {x:f.x+(f.dir||1)*(pose.x+marker[0]*pose.scale),y:f.y+pose.y+marker[1]*pose.scale,targetHeight:clip.projectileTargetHeight===160?160:undefined};
}
function draw(context,f,t=0,ghost=false){
 const pose=resolve(f,t,ghost);if(!pose||!loadedClips[pose.hero]?.[pose.clip])return false;
 const img=images[pose.hero][pose.clip][pose.index];if(!img)return false;
 context.save();context.translate(f.x||0,f.y||0);context.scale(f.dir||1,1);
 if(f.flash>0&&!ghost&&'filter' in context)context.filter='brightness(1.8) saturate(.65)';
 context.drawImage(img,pose.x,pose.y,pose.frame.width*pose.scale,pose.frame.height*pose.scale);context.restore();return true;
}
root.RiftMotionPreview={ready,resolve,draw,projectileOrigin};
})(typeof window!=='undefined'?window:globalThis);
