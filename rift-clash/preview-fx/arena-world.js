(function(root){
'use strict';
// One compact world per theme. The two retained foreground pavilions are
// crops of the original pixel paintings; their measured roof rows are the
// actual one-way collision surfaces. The center is open for aerial combat.
const WORLD_LEFT=0,WORLD_RIGHT=1600,FLOOR=510;
const spawnPoints=Object.freeze([600,980]);
const roofMetadata={
 temple:[{id:'low-left',x:66,y:431,width:572},{id:'low-right',x:1139,y:431,width:573}],
 jungle:[{id:'low-left',x:86,y:432,width:532},{id:'low-right',x:1160,y:432,width:529}],
 tomb:[{id:'low-left',x:72,y:430,width:585},{id:'low-right',x:1114,y:430,width:589}],
 crystal:[{id:'low-left',x:76,y:431,width:543},{id:'low-right',x:1158,y:431,width:544}],
 city:[{id:'low-left',x:69,y:431,width:552},{id:'low-right',x:1113,y:431,width:592}],
 space:[{id:'low-left',x:73,y:436,width:568},{id:'low-right',x:1122,y:436,width:580}]
};
const scale=1600/1774,round=value=>Math.round(value*100)/100,platformsByScene={};
for(const id of Object.keys(roofMetadata)){
 roofMetadata[id]=Object.freeze(roofMetadata[id].map(edge=>Object.freeze(edge)));
 platformsByScene[id]=Object.freeze(roofMetadata[id].map(edge=>Object.freeze({
  id:edge.id,x:round(edge.x*scale),y:round(edge.y*scale),w:round(edge.width*scale)
 })));
}
Object.freeze(roofMetadata);Object.freeze(platformsByScene);
function getPlatforms(id){return platformsByScene[id]||platformsByScene.temple;}
const platforms=getPlatforms('temple');
const REVISION='arena-open-r1',images={},jobs={},patternCache=new WeakMap();
function loadImage(path){return new Promise(resolve=>{
 const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);if(root.RiftImageQueue)root.RiftImageQueue.load(im,path+'?v='+REVISION);else im.src=path+'?v='+REVISION;
});}
function ensureScene(id){
 if(!platformsByScene[id]||typeof root.Image!=='function')return Promise.resolve(false);
 if(images[id])return Promise.resolve(true);
 if(jobs[id])return jobs[id];
 const base='assets/arena-open/'+id;
 const task=Promise.all([loadImage(base+'.png'),loadImage(base+'-ground.png'),loadImage(base+'-wall.png')]).then(parts=>{
  if(parts.some(part=>!part))return false;
  images[id]={structure:parts[0],ground:parts[1],wall:parts[2]};return true;
 });
 jobs[id]=task;task.then(()=>{delete jobs[id];});return task;
}
function isSceneReady(id){return !!images[id];}
function patternsFor(ctx,id,art){
 let perContext=patternCache.get(ctx);
 if(!perContext){perContext={};patternCache.set(ctx,perContext);}
 return perContext[id]||(perContext[id]={ground:ctx.createPattern(art.ground,'repeat'),wall:ctx.createPattern(art.wall,'repeat')});
}
function draw(ctx,id){
 const art=images[id];if(!art)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 // 1774x887 source to 1600x800 keeps the measured roof rows and their art in
 // the same coordinate system. Foreground architecture is never tiled.
 ctx.drawImage(art.structure,0,0,1600,800);
 const patterns=patternsFor(ctx,id,art);
 ctx.save();ctx.translate(0,FLOOR);
 // A near-full-width painted floor repeats only beyond the world edges, so the
 // ground stays continuous even when a high aerial camera sees past the arena.
 if(patterns.ground){ctx.fillStyle=patterns.ground;ctx.fillRect(-12000,0,25600,124);}
 if(patterns.wall){ctx.fillStyle=patterns.wall;ctx.fillRect(-12000,124,25600,8000);}
 ctx.restore();ctx.restore();return true;
}
function drawPreview(ctx,id){
 if(!images[id])return false;
 ctx.save();ctx.translate(0,95);ctx.scale(.75,.75);const drawn=draw(ctx,id);ctx.restore();return drawn;
}
const ready=ensureScene('temple');
const previewsReady=Promise.all(Object.keys(platformsByScene).map(ensureScene));
root.RiftArena={WORLD_LEFT,WORLD_RIGHT,FLOOR,spawnPoints,platforms,PLATFORMS:platforms,platformsByScene,roofMetadata,getPlatforms,revision:REVISION,ready,previewsReady,ensureScene,isSceneReady,draw,drawPreview};
if(typeof module!=='undefined')module.exports=root.RiftArena;
})(typeof window!=='undefined'?window:globalThis);
