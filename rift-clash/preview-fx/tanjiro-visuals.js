(function(root){
'use strict';
// This module only renders authored Tanjiro frames and an in-viewport reference
// clip. Combat, timing, damage and cinematic settlement remain in the World.
const BODY_IDS=['waterfall','whirlpool','awaken','attack4','attack5','heavy','throw','airheavy'];
const FX_IDS=['waterfall','whirlpool','awaken','surge'];
const BODY_SCALE=.4,FX_SCALE=.58;
const images=Object.create(null),frameJobs=Object.create(null);let loadJob=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function frameList(){
 const pack=root.RiftTanjiroArt;if(!pack)return null;
 const frames=[];
 for(const [group,ids] of [['body',BODY_IDS],['fx',FX_IDS]])for(const id of ids){
  const clip=pack[group]?.[id];if(!Array.isArray(clip?.frames)||clip.frames.length!==8)return null;
  for(const frame of clip.frames)if(!frame?.image||!Array.isArray(frame.anchor)||frame.anchor.length!==2||!frame.anchor.every(Number.isFinite)||!Number.isFinite(frame.width)||frame.width<=0||!Number.isFinite(frame.height)||frame.height<=0)return null;else frames.push(frame);
 }
 return frames;
}
function isReady(){const frames=frameList();return !!frames&&frames.every(frame=>!!images[frame.image]);}
function loadFrame(frame){
 const source=frame.image;if(images[source])return Promise.resolve(true);if(frameJobs[source])return frameJobs[source];
 if(typeof root.Image!=='function')return Promise.resolve(false);
 const job=new Promise(resolve=>{try{const im=new root.Image();im.onload=()=>{images[source]=im;resolve(true);};im.onerror=()=>resolve(false);im.src=source;}catch(_){resolve(false);}});
 frameJobs[source]=job;job.then(()=>{if(frameJobs[source]===job)delete frameJobs[source];});return job;
}
function ensureReady(){
 if(isReady())return Promise.resolve(true);if(loadJob)return loadJob;
 const frames=frameList();if(!frames||typeof root.Image!=='function')return Promise.resolve(false);
 const job=Promise.all(frames.map(loadFrame)).then(results=>results.every(Boolean)&&isReady());
 loadJob=job;job.then(()=>{if(loadJob===job)loadJob=null;});return job;
}
const ready=ensureReady();
function phaseFrame(a,clip){
 const move=a.move||a,t=Math.max(0,Number(a.t)||0);
 const startup=Math.max(1,Number(move.startup??a.startup)||1),active=Math.max(1,Number(move.active??a.active)||1);
 const end=Math.max(startup+active+1,Number(move.end??a.end)||startup+active+1);
 // Where art supplies an impact/grab/burst marker, the first active tick is
 // that exact authored pose; unmarked clips keep the 3/3/2 phase split.
 const events=clip.events||{},marked=events.impact??events.firstStrike??events.strike??events.grab??events.burst;
 const contact=Number.isInteger(marked)&&marked>=1&&marked<=6?marked:3,lastActive=Number.isInteger(marked)&&marked>=1&&marked<=6?6:5;
 if(t<startup)return Math.min(contact-1,Math.floor(t/startup*contact));
 if(t<startup+active){
  // The three throw contacts have distinct authored poses. Divide the active
  // phase at the actual attack intervals so each impact lands on its marker,
  // while the intervening poses remain visible before the next contact.
  const throwFrames=[events.grab,events.headbutt,events.slash],interval=Number(move.interval);
  const validThrow=a.clipId==='throw'&&Number.isFinite(interval)&&interval>0&&throwFrames.every((v,i)=>Number.isInteger(v)&&v>=1&&v<=6&&(!i||v>throwFrames[i-1]));
  if(validThrow){
   const elapsed=t-startup,slot=Math.min(throwFrames.length-1,Math.floor(elapsed/interval)),frame=throwFrames[slot],next=throwFrames[slot+1];
   if(next===undefined)return frame;
   return frame+Math.min(next-frame-1,Math.floor((elapsed-slot*interval)/interval*(next-frame)));
  }
  return contact+Math.min(lastActive-contact,Math.floor((t-startup)/active*(lastActive-contact+1)));
 }
 const remainder=7-lastActive;
 return lastActive+1+Math.min(remainder-1,Math.floor(clamp((t-startup-active)/(end-startup-active),0,.999999)*remainder));
}
function paintFrame(ctx,frame,x,y,dir,scale,alpha=1,flash=false){
 const im=frame&&images[frame.image];if(!im)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x,y);ctx.scale(dir<0?-1:1,1);
 const prior=Number.isFinite(ctx.globalAlpha)?ctx.globalAlpha:1;ctx.globalAlpha=prior*alpha;
 if(flash&&'filter' in ctx)ctx.filter='brightness(1.8) saturate(.65)';
 ctx.drawImage(im,-frame.anchor[0]*scale,-frame.anchor[1]*scale,frame.width*scale,frame.height*scale);
 ctx.restore();return true;
}
function drawFighter(ctx,f){
 const a=f?.attack;if(f?.hero!=='tanjiro'||!a?.clipId)return false;
 const clip=root.RiftTanjiroArt?.body?.[a.clipId];if(!clip?.frames||clip.frames.length!==8)return false;
 return paintFrame(ctx,clip.frames[phaseFrame(a,clip)],f.x||0,f.y||0,f.dir||1,BODY_SCALE,1,!!f.flash);
}
function drawEffect(ctx,e,options={}){
 if(e?.kind!=='tanjiroFx')return false;
 const clip=root.RiftTanjiroArt?.fx?.[e.clipId];if(!clip?.frames||clip.frames.length!==8)return false;
 const max=Math.max(1,Number(e.max)||1),life=clamp(Number(e.life)||0,0,max),index=Math.min(7,Math.floor((max-life)/max*8));
 const fade=Math.min(1,life/Math.min(5,max));
 // These two vertically rising effects have their visible splash near the
 // bottom of the source frame. The simulation places their centers at y-85;
 // lift them 35 units so the painted splash meets the emitter's feet.
 const rise=e.clipId==='waterfall'||e.clipId==='awaken'?35:0;
 return paintFrame(ctx,clip.frames[index],e.x||0,(e.y||0)-rise,e.dir||1,FX_SCALE,fade*(options.reducedMotion?.7:1));
}
function drawAura(ctx,f,options={}){
 const level=Number(f?.awakenLevel)||0;if(f?.hero!=='tanjiro'||level<=0)return false;
 const clip=root.RiftTanjiroArt?.fx?.awaken;if(!clip?.frames||clip.frames.length!==8)return false;
 // A quiet loop of the water aura, keyed exclusively to simulation time. The
 // surrounding app pauses that clock during hitstop and the pause overlay.
 const tick=Math.max(0,Number(options.tick??f.awakenTime??f.animTime)||0);
 const cycle=[1,5,6,5],index=options.reducedMotion?1:cycle[Math.floor(tick/6)%cycle.length],frame=clip.frames[index],scale=level>=2?.61:.53;
 // The visible base of the aura art sits at roughly 90% of its source height.
 // Align that base to the fighter's feet rather than painting below the floor.
 const groundOffset=(frame.height*.9-frame.anchor[1])*scale;
 return paintFrame(ctx,frame,f.x||0,(f.y||0)-groundOffset,f.dir||1,scale,(level>=2?.66:.46)*(options.reducedMotion?.7:1));
}
const VIDEO={
 ultimate:{src:'assets/tanjiro-video/tanjiro-water-dragon-ultimate.mp4',budget:18800},
 awakening:{src:'assets/tanjiro-video/tanjiro-full-awakening.mp4',budget:12033}
};
const finished=new WeakMap();let current=null,blurred=false;
function same(entry,world,state){return !!entry&&entry.world===world&&entry.state===state&&entry.id===state?.id&&entry.kind===state?.kind;}
function alreadyFinished(state){return !!state&&typeof state==='object'&&finished.has(state)&&finished.get(state)===state.id;}
function markFinished(state){if(state&&typeof state==='object')finished.set(state,state.id);}
function clearWatchdog(entry){if(entry.watchdog!=null&&typeof root.clearTimeout==='function')root.clearTimeout(entry.watchdog);entry.watchdog=null;}
function stop(entry){
 if(!entry||entry.disposed)return;entry.disposed=true;entry.playToken++;clearWatchdog(entry);
 try{entry.video?.pause();}catch(_){}
 if(entry.container?.parentNode)entry.container.parentNode.removeChild(entry.container);
 if(current===entry)current=null;
}
function complete(entry){
 if(!entry||entry.completed)return;
 const valid=same(entry,entry.world,entry.world?.tanjiroCinematic)&&!alreadyFinished(entry.state);
 entry.completed=true;stop(entry);if(!valid)return;
 markFinished(entry.state);
 if(typeof entry.world.finishTanjiroCinematic==='function')entry.world.finishTanjiroCinematic();
}
function completeDirect(world,state){
 if(alreadyFinished(state))return;markFinished(state);
 if(typeof world?.finishTanjiroCinematic==='function')world.finishTanjiroCinematic();
}
function scheduleWatchdog(entry){
 clearWatchdog(entry);if(typeof root.setTimeout!=='function')return;
 const remaining=Math.max(0,VIDEO[entry.kind].budget-entry.elapsed),token=entry.playToken;
 entry.watchdog=root.setTimeout(()=>{if(current===entry&&!entry.paused&&entry.playToken===token)complete(entry);},remaining);
}
function requestPlay(entry){
 const token=++entry.playToken;entry.startedAt=Date.now();scheduleWatchdog(entry);
 try{
  const result=entry.video.play();
  if(result&&typeof result.then==='function')result.then(undefined,()=>{if(current===entry&&!entry.paused&&entry.playToken===token)complete(entry);});
 }catch(_){if(current===entry&&!entry.paused&&entry.playToken===token)complete(entry);}
}
function setPaused(entry,paused){
 if(entry.paused===paused)return;entry.paused=paused;
 entry.container.style.display=paused?'none':'block';
 if(paused){
  if(entry.startedAt!=null)entry.elapsed+=Math.max(0,Date.now()-entry.startedAt);
  entry.startedAt=null;entry.playToken++;clearWatchdog(entry);try{entry.video.pause();}catch(_){}
 }else requestPlay(entry);
}
function makeEntry(world,state,soundOn){
 const doc=root.document;if(!doc?.createElement)return null;
 const game=doc.getElementById?.('game'),viewport=game?.closest?.('.viewport')||game?.parentElement;
 if(!viewport?.appendChild)return null;
 const layer=doc.createElement('div'),video=doc.createElement('video'),label=doc.createElement('div'),link=doc.createElement('a'),skip=doc.createElement('button');
 layer.className='tanjiro-reference-video';layer.setAttribute('role','group');layer.setAttribute('aria-label','炭治郎参考演出');
 Object.assign(layer.style,{position:'absolute',inset:'0',zIndex:'20',background:'#060d15',overflow:'hidden',display:'none'});
 Object.assign(video.style,{width:'100%',height:'100%',display:'block',objectFit:'contain',background:'#060d15'});
 video.setAttribute('playsinline','');video.setAttribute('controlsList','nodownload noplaybackrate');video.disablePictureInPicture=true;
 video.preload='auto';video.playsInline=true;video.controls=false;video.muted=!soundOn;
 Object.assign(label.style,{position:'absolute',top:'10px',left:'10px',padding:'6px 9px',borderRadius:'4px',background:'#08121bd9',color:'#e2f6ff',font:'12px system-ui,sans-serif',zIndex:'1'});
 label.textContent='参考演出 · 640×360 · ';
 link.href='https://www.bilibili.com/video/BV1oq4y1d7PP/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='来源 BV1oq4y1d7PP';link.style.color='#aee9ff';label.appendChild(link);
 skip.type='button';skip.textContent='跳过演出';skip.setAttribute('aria-label','跳过参考演出');
 Object.assign(skip.style,{position:'absolute',top:'10px',right:'10px',zIndex:'2',padding:'8px 12px',border:'1px solid #b8e6f1',borderRadius:'4px',background:'#10202be8',color:'#fff',font:'600 12px system-ui,sans-serif',cursor:'pointer'});
 const entry={world,state,id:state.id,kind:state.kind,container:layer,video,paused:true,playToken:0,elapsed:0,startedAt:null,watchdog:null,disposed:false,completed:false};
 video.addEventListener('ended',()=>complete(entry));video.addEventListener('error',()=>complete(entry));skip.addEventListener('click',()=>complete(entry));
 try{layer.appendChild(video);layer.appendChild(label);layer.appendChild(skip);viewport.appendChild(layer);}catch(error){if(layer.parentNode)layer.parentNode.removeChild(layer);throw error;}
 return entry;
}
function sync(world,options={}){
 const state=world?.tanjiroCinematic;
 if(!state||typeof state!=='object'){if(current)stop(current);return false;}
 if(current&&!same(current,world,state))stop(current);
 if(alreadyFinished(state))return false;
 if(options.reducedMotion||world.settings?.cinematics===false||!VIDEO[state.kind]){
  if(current)stop(current);completeDirect(world,state);return false;
 }
 if(!current){
  try{current=makeEntry(world,state,!!options.soundOn);if(current)current.video.src=VIDEO[state.kind].src;}catch(_){if(current)stop(current);current=null;}
  if(!current){completeDirect(world,state);return false;}
 }
 current.video.muted=!options.soundOn;
 setPaused(current,!!options.paused||!!root.document?.hidden||blurred);
 return !!current&&same(current,world,state);
}
if(typeof root.addEventListener==='function'){
 root.addEventListener('blur',()=>{blurred=true;if(current)setPaused(current,true);});
 root.addEventListener('focus',()=>{blurred=false;});
}
if(typeof root.document?.addEventListener==='function')root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden&&current)setPaused(current,true);});
root.RiftTanjiroVisual={ready,ensureReady,isReady,drawFighter,drawEffect,drawAura,sync};
if(typeof module!=='undefined')module.exports=root.RiftTanjiroVisual;
})(typeof window!=='undefined'?window:globalThis);
