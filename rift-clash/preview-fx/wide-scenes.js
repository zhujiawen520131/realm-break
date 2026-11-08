(function(root){
'use strict';
const base=root.RiftScenes,images={},jobs={};
// One continuous painting per world. No sky cutout, repeating tiles or alpha bands.
// Ground contact is at source y=90%; the low terrace continues below the camera.
const WORLD_RECT=Object.freeze({x:-4200,y:-4170,w:9600,h:5200,floorY:510});
const REVISION='panorama-r1';
function ensureScene(id){
 if(!base.DATA[id]||typeof root.Image!=='function')return Promise.resolve(false);
 if(images[id])return Promise.resolve(true);
 if(jobs[id])return jobs[id];
 const task=new Promise(resolve=>{const im=new root.Image();im.onload=()=>{images[id]=im;resolve(true);};im.onerror=()=>resolve(false);im.src='assets/panoramas/'+id+'.png?v='+REVISION;});
 jobs[id]=task;task.then(()=>{delete jobs[id];});return task;
}
function drawWorld(ctx,id,time=0,focus=600,motion=true){
 const im=images[id];if(!im)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,WORLD_RECT.x,WORLD_RECT.y,WORLD_RECT.w,WORLD_RECT.h);
 // Sparse environment particles live in world space too; they never mask seams.
 const d=base.DATA[id],t=motion?time:0;
 for(let i=0;i<30;i++){
  const x=(i*431+t*.18+4300)%8400-3600,y=(i*173+t*.35+3500)%3900-3400;
  ctx.fillStyle=d.light+'90';ctx.fillRect(x,y,i%3+1,2);
 }
 ctx.restore();return true;
}
function draw(ctx,id,time=0,focus=600,motion=true){return drawWorld(ctx,id,time,focus,motion);}
function drawPreview(ctx,id){
 const im=images[id];if(!im)return false;
 // A preview shows sky, architecture and floor, while combat has a true world crop.
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,im.height*.52,im.width,im.height*.48,0,0,1200,640);ctx.restore();return true;
}
const ready=ensureScene('temple'),previewsReady=Promise.all(Object.keys(base.DATA).map(ensureScene));
root.RiftScenes={...base,draw,drawWorld,drawPreview,drawSky:undefined,ready,previewsReady,ensureScene,isSceneReady:id=>!!images[id],WORLD_RECT,revision:REVISION};
})(typeof window!=='undefined'?window:globalThis);
