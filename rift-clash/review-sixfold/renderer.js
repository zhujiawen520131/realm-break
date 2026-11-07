(function(root){
'use strict';
const REQUIRED=['crouch','eye','charge','dash','finish','lightning','debris','trail','burst','roof'];
function validate(manifest,images={},poses=[]){
 const errors=[];if(manifest?.schemaVersion!==1)errors.push('素材清单版本无效');
 for(const key of ['forest','overhead','moon'])if(!manifest?.backgrounds?.[key]||!images[manifest.backgrounds[key]])errors.push('缺少背景：'+key);
 for(const name of new Set([...REQUIRED,...poses,...Object.keys(manifest?.clips||{})])){const clip=manifest?.clips?.[name];if(!clip?.frames?.length){errors.push('缺少帧图：'+name);continue;}
  for(const [i,f] of clip.frames.entries()){
   const im=images[f.image];if(!im){errors.push(name+' 第'+(i+1)+'帧未加载');continue;}
   if(f.crop){const [x,y,w,h]=f.crop;if(f.crop.length!==4||!f.crop.every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>im.width||y+h>im.height)errors.push(name+' 第'+(i+1)+'帧裁切越界');}
  }
 }
 return [...new Set(errors)];
}
function alphaBounds(pixels,width,height){
 let x0=width,y0=height,x1=-1,y1=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=64){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 return x1<0?[0,0,width,height]:[x0,y0,x1-x0+1,y1-y0+1];
}
function luminousTip(pixels,width,height){
 let tip=-1;for(let x=width-1;x>=0;x--){let count=0;for(let y=0;y<height;y++){const i=(y*width+x)*4;if(pixels[i]>190&&pixels[i+1]>190&&pixels[i+2]>190&&pixels[i+3]>128)count++;}if(count>=1){tip=x;break;}}
 if(tip<0)return null;let total=0,count=0;for(let x=Math.max(0,tip-3);x<=tip;x++)for(let y=0;y<height;y++){const i=(y*width+x)*4;if(pixels[i]>190&&pixels[i+1]>190&&pixels[i+2]>190&&pixels[i+3]>128){total+=y;count++;}}return [tip,total/count];
}
function trailPlacement(crop,tip,length,height){const portion=(tip[0]-crop[0])/crop[2];return {width:length/Math.max(.05,portion),height,anchor:[0,(tip[1]-crop[1])/crop[3]]};}
async function load(manifest,{poses=[]}={}){
 const images={},errors=[];
 await Promise.all(Object.entries(manifest?.images||{}).map(([id,item])=>new Promise(resolve=>{
  if(typeof item.src!=='string'||!/^assets\/[^?#]+\.png$/i.test(item.src)||item.src.includes('..')){errors.push('PNG路径无效：'+id);resolve();return;}
  const image=new root.Image();image.onload=()=>{images[id]=image;resolve();};image.onerror=()=>{errors.push('PNG未能加载：'+item.src);resolve();};if(item.sha256!==undefined&&!/^[a-f0-9]{64}$/i.test(item.sha256)){errors.push('PNG内容指纹无效：'+id);resolve();return;}image.src=item.src+(item.sha256?'?v='+item.sha256.slice(0,12):'');
 })));
 errors.push(...validate(manifest,images,poses));const trailBounds={},trailTips={};
 if(!errors.length){try{const ids=new Set(['trail','trailCurrent','trailResidual'].flatMap(n=>(manifest.clips[n]?.frames||[]).map(f=>f.image)));for(const id of ids){const im=images[id],canvas=root.document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,im.width,im.height).data,bounds=alphaBounds(pixels,im.width,im.height);trailBounds[id]=[bounds[0],0,bounds[2],im.height];trailTips[id]=luminousTip(pixels,im.width,im.height)||[bounds[0]+bounds[2],im.height/2];}}catch(_){errors.push('拖尾透明边界无法读取，请使用同源素材');}}
 return {manifest,images,trailBounds,trailTips,errors:[...new Set(errors)],ready:errors.length===0};
}
function frameFor(assets,name,elapsedMs,{hold=false,progress}={}){
 const clip=assets.manifest.clips[name];if(!clip?.frames?.length)return null;
 const durations=clip.frames.map(f=>Math.max(1,Number(f.durationMs)||80)),total=durations.reduce((a,b)=>a+b,0);
 let at=Number.isFinite(progress)?Math.max(0,Math.min(.999999,progress))*total:hold?Math.min(total-.001,Math.max(0,elapsedMs)):Math.max(0,elapsedMs)%total,index=0;
 while(index<durations.length-1&&at>=durations[index])at-=durations[index++];
 const frame=clip.frames[index],image=assets.images[frame.image];return {clip,frame,image,index,crop:frame.crop||[0,0,image.width,image.height]};
}
function blit(ctx,p,x,y,width,height,anchor=[.5,1]){if(!p)return;ctx.drawImage(p.image,...p.crop,x-width*anchor[0],y-height*anchor[1],width,height);}
function sprite(ctx,assets,name,ms,x,y,height,options={}){
 const p=frameFor(assets,name,ms,options);if(!p)return;const h=height||p.clip.worldHeight||180,w=h*p.crop[2]/p.crop[3];
 ctx.save();ctx.translate(x,y);if(options.flip)ctx.scale(-1,1);if(options.rotation)ctx.rotate(options.rotation);if(options.opacity!==undefined)ctx.globalAlpha*=options.opacity;
 blit(ctx,p,0,0,w,h,options.anchor||p.clip.anchor||[.5,1]);ctx.restore();
}
function cover(ctx,image,crop,zoom=1,center=[.5,.5]){const rect=crop||[0,0,image.width,image.height],scale=Math.max(960/rect[2],540/rect[3])*zoom,w=rect[2]*scale,h=rect[3]*scale;ctx.drawImage(image,...rect,Math.max(960-w,Math.min(0,480-w*center[0])),Math.max(540-h,Math.min(0,270-h*center[1])),w,h);}
function trail(ctx,assets,path,ms,old,reduced){
 const end=path.complete?path.to:path.position,dx=end[0]-path.from[0],dy=end[1]-path.from[1],length=Math.hypot(dx,dy);if(length<2)return;
 const specific=old?'trailResidual':'trailCurrent',authored=!!assets.manifest.clips[specific];const source=frameFor(assets,authored?specific:'trail',ms);if(!source)return;const p={...source,crop:assets.trailBounds?.[source.frame.image]||source.crop};
 ctx.save();ctx.translate(path.from[0],path.from[1]);ctx.rotate(Math.atan2(dy,dx)+(Number(p.clip.rotation)||0));
 ctx.globalAlpha=old?(reduced?.35:.56):(reduced?.7:.98);if(old&&!authored)ctx.filter='grayscale(1) sepia(1) saturate(2.2) hue-rotate(125deg)';
 // Only the authored transparent speed sprite fills the visible trajectory.
 const index=Number.isInteger(path.index)?path.index:0;const thickness=reduced?(old?25:55):old?Math.max(30,75-index*8):Math.max(65,185-index*23);const tip=assets.trailTips?.[source.frame.image]||[p.crop[0]+p.crop[2],p.crop[1]+p.crop[3]/2],place=trailPlacement(p.crop,tip,length,thickness);blit(ctx,p,0,0,place.width,place.height,place.anchor);ctx.restore();
}
function render(ctx,assets,state){
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,960,540);
 if(!assets?.ready){ctx.restore();return false;}
 const reduced=state.reducedMotion,zoom=!state.reducedMotion&&state.phase==='sixfold'?1.55-.55*state.progress:1;ctx.translate(480,330);ctx.scale(zoom,zoom);ctx.translate(-480,-330);
 const scene=assets.manifest.backgrounds[state.scene]||assets.manifest.backgrounds.forest;
 ctx.save();if(state.direction<0){ctx.translate(960,0);ctx.scale(-1,1);}cover(ctx,assets.images[scene],null,reduced?1:state.phase==='eye'?1.02:1.06);
 if(state.view?.mode==='portrait'){
  const v=state.view,p=frameFor(assets,state.pose,state.localMs,{progress:Number.isFinite(v.frameProgress)?v.frameProgress:state.phase==='eyeCut'?1:state.progress});const z=reduced?v.endZoom:v.startZoom+(v.endZoom-v.startZoom)*state.progress,a=v.startCenter||v.center||[.5,.5],b=v.endCenter||a,center=reduced?b:a.map((n,i)=>n+(b[i]-n)*state.progress);cover(ctx,p.image,p.crop,z,center);
 }else if(state.phase==='sixfold'){
  ctx.restore();ctx.save(); // Trajectory points already include the chosen mirror.
  const paths=state.paths;for(const path of paths)trail(ctx,assets,path,state.localMs,path.complete,reduced);
  for(const path of paths.filter(p=>p.complete&&p.ageMs<220))sprite(ctx,assets,'burst',path.ageMs, ...path.to,reduced?25:39,{opacity:(reduced?.35:.75)*(1-path.ageMs/220)});
  const path=paths.at(-1);if(path){const dx=path.to[0]-path.from[0],dy=path.to[1]-path.from[1];const vertical=path.index===5; sprite(ctx,assets,vertical?'finish':'dash',state.localMs,...path.position,65,{progress:path.progress,anchor:[.5,.65],flip:dx<0,rotation:vertical?0:Math.atan2(dy,Math.abs(dx)),opacity:.94});}
 }else{
  let x=500,y=460,height=224,rotation=0,visible=true,poseProgress=state.progress;
  if(state.phase==='forest'){const pass=[[25.488,25.855],[26.282,26.655],[27.022,27.433]].find(([a,b])=>state.sourceTime>=a&&state.sourceTime<b);visible=!!pass;if(pass){const q=(state.sourceTime-pass[0])/(pass[1]-pass[0]);x=120+q*740;y=420;height=110;poseProgress=q;trail(ctx,assets,{from:[100,420],position:[x,420],complete:false},state.localMs,false,reduced);}}
  if(state.phase==='overheadReady'){x=500;y=340;height=95;sprite(ctx,assets,'lightning',state.localMs,x,y+20,230,{opacity:reduced?.4:.8});sprite(ctx,assets,'debris',state.localMs,x,y+10,150);}
  if(state.phase==='overhead'){x=150+state.progress*650;y=320;height=90;trail(ctx,assets,{from:[130,320],position:[x,320],complete:false},state.localMs,false,reduced);}
  if(state.phase==='air'||state.phase==='ending'){x=540;y=345;height=170;}
  if(state.phase==='impact'){x=500;y=450-state.progress*310;height=140;const roofProgress=Math.max(0,Math.min(1,(state.sourceTime-33.95947)/.60));sprite(ctx,assets,'roof',state.localMs,500,530,360,{progress:roofProgress});}
  if(state.phase==='roof'){visible=false;ctx.save();const z=reduced?1:1+state.progress*.12;ctx.translate(480,420);ctx.scale(z,z);ctx.translate(-480,-420);sprite(ctx,assets,'roof',0,500,530,380,{progress:0});ctx.restore();}
  if(state.phase==='charge'){
   sprite(ctx,assets,'lightning',state.localMs,500,470,470,{opacity:reduced?.6:.94});
   sprite(ctx,assets,'debris',state.localMs,500,470,310,{opacity:reduced?.55:.9});
  }
  if(state.phase==='launch'){x=520;y=330-Math.max(0,(state.progress-.49)/.51)*220;height=170;if(state.progress>.49)trail(ctx,assets,{from:[520,390],position:[520,y],complete:false},state.localMs,false,reduced);}
  if(state.phase==='impact'){sprite(ctx,assets,'lightning',state.localMs,x,500,520,{opacity:reduced?.5:.95});sprite(ctx,assets,'debris',state.localMs,x,490,370,{opacity:reduced?.5:.9});}
  if(visible)sprite(ctx,assets,state.pose||'crouch',state.localMs,x,y,height,{rotation,progress:poseProgress,hold:true,anchor:['forest','overhead','launch'].includes(state.phase)?[.5,.64]:undefined});
 }
 ctx.restore();
 // Auxiliary flash only. No geometric figures, lightning lines or substitute art.
 if(!reduced&&state.flash){ctx.globalAlpha=state.flash.kind==='black'?.75:.18;ctx.fillStyle=state.flash.kind==='black'?'#02050b':'#f2fcff';ctx.fillRect(0,0,960,540);}
 ctx.restore();return true;
}
function renderFrame(ctx,assets,name,index,width=640,height=360){
 ctx.save();ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
 const clip=assets?.manifest?.clips?.[name],frame=clip?.frames?.[index];if(!assets?.ready||!frame){ctx.restore();return false;}
 const image=assets.images[frame.image],crop=frame.crop||[0,0,image.width,image.height],scale=Math.min((width-32)/crop[2],(height-32)/crop[3]);
 ctx.drawImage(image,...crop,(width-crop[2]*scale)/2,(height-crop[3]*scale)/2,crop[2]*scale,crop[3]*scale);ctx.restore();return true;
}
root.SixfoldRenderer={load,validate,frameFor,render,renderFrame,alphaBounds,luminousTip,trailPlacement,requiredClips:REQUIRED};if(typeof module!=='undefined')module.exports=root.SixfoldRenderer;
})(typeof window!=='undefined'?window:globalThis);
