(function(root){
'use strict';
// The solid floor and the collision tops use the very same world coordinates
// as the art. The source metadata points at measured opaque roof pixels.
const WORLD_LEFT=0,WORLD_RIGHT=3600,FLOOR=510;
const platforms=Object.freeze([
 Object.freeze({x:240,y:370,w:520}),Object.freeze({x:780,y:230,w:520}),
 Object.freeze({x:1320,y:90,w:520}),Object.freeze({x:1860,y:-50,w:520}),
 Object.freeze({x:2400,y:90,w:520}),Object.freeze({x:2940,y:230,w:520})
]);
const roofMetadata=Object.freeze({
 temple:{sourceX:19,sourceY:71,sourceWidth:1736,roofInset:0},
 jungle:{sourceX:10,sourceY:66,sourceWidth:1753,roofInset:0},
 tomb:{sourceX:15,sourceY:124,sourceWidth:1745,roofInset:0},
 crystal:{sourceX:20,sourceY:90,sourceWidth:1734,roofInset:0},
 city:{sourceX:17,sourceY:53,sourceWidth:1740,roofInset:0},
 space:{sourceX:8,sourceY:122,sourceWidth:1759,roofInset:0}
});
// Different portions of the same authored facade form adjoining buildings.
// The roofs remain flat across every crop; none is flipped or enlarged.
const variants=Object.freeze([[0,.8],[.2,.8],[.07,.86],[0,1],[.13,.84],[.2,.8]]);
const REVISION='arena-wide-r1',images={},jobs={};
function loadImage(path){return new Promise(resolve=>{
 const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=path+'?v='+REVISION;
});}
function ensureScene(id){
 if(!roofMetadata[id]||typeof root.Image!=='function')return Promise.resolve(false);
 if(images[id])return Promise.resolve(true);
 if(jobs[id])return jobs[id];
 const base='assets/arena-wide/'+id;
 const task=Promise.all([loadImage(base+'.png'),loadImage(base+'-ground.png'),loadImage(base+'-wall.png')]).then(parts=>{
  if(parts.some(part=>!part))return false;
  images[id]={building:parts[0],ground:parts[1],wall:parts[2]};return true;
 });
 jobs[id]=task;task.then(()=>{delete jobs[id];});return task;
}
function isSceneReady(id){return !!images[id];}
function draw(ctx,id){
 const art=images[id];if(!art)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 // The foundation is painted masonry/metal from the original stage. It fills
 // behind the facade down to the floor, so the taller roofs are real buildings.
 const wallPattern=ctx.createPattern(art.wall,'repeat');
 if(wallPattern){ctx.fillStyle=wallPattern;for(const p of platforms)ctx.fillRect(p.x,p.y,p.w,FLOOR-p.y);}
 platforms.forEach((p,i)=>{
  const [offset,fraction]=variants[i],sx=Math.round(art.building.width*offset),sw=Math.min(art.building.width-sx,Math.round(art.building.width*fraction));
  const scale=p.w/sw,sh=Math.min(art.building.height,(FLOOR-p.y)/scale);
  ctx.drawImage(art.building,sx,0,sw,sh,p.x,p.y,p.w,sh*scale);
 });
 // A separate foreground floor starts at the exact collision height. The floor
 // and wall are horizontally repeating crops of the original stage painting.
 const groundPattern=ctx.createPattern(art.ground,'repeat');
 ctx.save();ctx.translate(0,FLOOR);
 if(groundPattern){ctx.fillStyle=groundPattern;ctx.fillRect(-12000,0,27600,124);}
 if(wallPattern){ctx.fillStyle=wallPattern;ctx.fillRect(-12000,124,27600,8000);}
 ctx.restore();ctx.restore();return true;
}
// Used after the far scene in a 1200x640 scene preview; combat uses draw().
function drawPreview(ctx,id){return draw(ctx,id);}
const ready=ensureScene('temple');
const previewsReady=Promise.all(Object.keys(roofMetadata).map(ensureScene));
root.RiftArena={WORLD_LEFT,WORLD_RIGHT,FLOOR,platforms,PLATFORMS:platforms,roofMetadata,variants,revision:REVISION,ready,previewsReady,ensureScene,isSceneReady,draw,drawPreview};
if(typeof module!=='undefined')module.exports=root.RiftArena;
})(typeof window!=='undefined'?window:globalThis);
