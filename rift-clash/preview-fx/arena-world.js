(function(root){
'use strict';
// Each theme is one uncut transparent painting. Platform coordinates come
// from the first continuous opaque pixel row of the actual roofs and beams.
const WORLD_LEFT=0,WORLD_RIGHT=1600,FLOOR=510;
const spawnPoints=Object.freeze([600,980]);
const platformData={"temple":[{"id":"low-left","x":59.53,"y":388.73,"w":515.9},{"id":"low-right","x":1027.28,"y":388.73,"w":516.8},{"id":"middle","x":322.89,"y":268.77,"w":795.49},{"id":"upper-left","x":76.66,"y":151.52,"w":468.09},{"id":"upper-right","x":1057.05,"y":151.52,"w":469.0},{"id":"top","x":375.2,"y":22.55,"w":850.51}],"jungle":[{"id":"low-left","x":77.56,"y":389.63,"w":479.82},{"id":"low-right","x":1046.22,"y":389.63,"w":477.11},{"id":"middle","x":331.91,"y":269.67,"w":790.08},{"id":"upper-left","x":84.78,"y":148.82,"w":437.43},{"id":"upper-right","x":1080.5,"y":148.82,"w":435.63},{"id":"top","x":415.78,"y":26.16,"w":770.24}],"tomb":[{"id":"low-left","x":64.94,"y":387.82,"w":527.62},{"id":"low-right","x":1004.74,"y":387.82,"w":531.23},{"id":"middle","x":317.47,"y":268.77,"w":812.63},{"id":"upper-left","x":68.55,"y":145.21,"w":468.09},{"id":"upper-right","x":1066.07,"y":145.21,"w":465.39},{"id":"top","x":383.31,"y":29.76,"w":833.37}],"crystal":[{"id":"low-left","x":68.55,"y":388.73,"w":489.74},{"id":"low-right","x":1044.42,"y":388.73,"w":490.64},{"id":"middle","x":312.97,"y":267.87,"w":814.43},{"id":"upper-left","x":100.11,"y":147.91,"w":441.94},{"id":"upper-right","x":1071.48,"y":147.91,"w":454.57},{"id":"top","x":406.76,"y":27.06,"w":790.08}],"city":[{"id":"low-left","x":62.23,"y":388.73,"w":497.86},{"id":"low-right","x":1003.83,"y":388.73,"w":533.93},{"id":"middle","x":307.55,"y":270.57,"w":833.37},{"id":"upper-left","x":64.04,"y":151.52,"w":470.8},{"id":"upper-right","x":1067.87,"y":151.52,"w":469.0},{"id":"top","x":374.3,"y":28.86,"w":852.31}],"space":[{"id":"low-left","x":65.84,"y":393.24,"w":512.29},{"id":"low-right","x":1011.95,"y":393.24,"w":523.11},{"id":"middle","x":319.28,"y":276.89,"w":821.65},{"id":"upper-left","x":66.74,"y":152.42,"w":473.51},{"id":"upper-right","x":1074.18,"y":152.42,"w":459.98},{"id":"top","x":387.82,"y":30.67,"w":814.43}]};
const roofMetadata={"temple":[{"id":"low-left","x":66,"y":431,"width":572},{"id":"low-right","x":1139,"y":431,"width":573},{"id":"middle","x":358,"y":298,"width":882},{"id":"upper-left","x":85,"y":168,"width":519},{"id":"upper-right","x":1172,"y":168,"width":520},{"id":"top","x":416,"y":25,"width":943}],"jungle":[{"id":"low-left","x":86,"y":432,"width":532},{"id":"low-right","x":1160,"y":432,"width":529},{"id":"middle","x":368,"y":299,"width":876},{"id":"upper-left","x":94,"y":165,"width":485},{"id":"upper-right","x":1198,"y":165,"width":483},{"id":"top","x":461,"y":29,"width":854}],"tomb":[{"id":"low-left","x":72,"y":430,"width":585},{"id":"low-right","x":1114,"y":430,"width":589},{"id":"middle","x":352,"y":298,"width":901},{"id":"upper-left","x":76,"y":161,"width":519},{"id":"upper-right","x":1182,"y":161,"width":516},{"id":"top","x":425,"y":33,"width":924}],"crystal":[{"id":"low-left","x":76,"y":431,"width":543},{"id":"low-right","x":1158,"y":431,"width":544},{"id":"middle","x":347,"y":297,"width":903},{"id":"upper-left","x":111,"y":164,"width":490},{"id":"upper-right","x":1188,"y":164,"width":504},{"id":"top","x":451,"y":30,"width":876}],"city":[{"id":"low-left","x":69,"y":431,"width":552},{"id":"low-right","x":1113,"y":431,"width":592},{"id":"middle","x":341,"y":300,"width":924},{"id":"upper-left","x":71,"y":168,"width":522},{"id":"upper-right","x":1184,"y":168,"width":520},{"id":"top","x":415,"y":32,"width":945}],"space":[{"id":"low-left","x":73,"y":436,"width":568},{"id":"low-right","x":1122,"y":436,"width":580},{"id":"middle","x":354,"y":307,"width":911},{"id":"upper-left","x":74,"y":169,"width":525},{"id":"upper-right","x":1191,"y":169,"width":510},{"id":"top","x":430,"y":34,"width":903}]};
const platformsByScene={};
for(const id of Object.keys(platformData))platformsByScene[id]=Object.freeze(platformData[id].map(p=>Object.freeze(p)));
Object.freeze(platformsByScene);
function getPlatforms(id){return platformsByScene[id]||platformsByScene.temple;}
const platforms=getPlatforms('temple');
const REVISION='arena-compact-r1',images={},jobs={},patternCache=new WeakMap();
function loadImage(path){return new Promise(resolve=>{
 const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);if(root.RiftImageQueue)root.RiftImageQueue.load(im,path+'?v='+REVISION);else im.src=path+'?v='+REVISION;
});}
function ensureScene(id){
 if(!platformsByScene[id]||typeof root.Image!=='function')return Promise.resolve(false);
 if(images[id])return Promise.resolve(true);
 if(jobs[id])return jobs[id];
 const base='assets/arena-compact/'+id;
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
 // Source 1774x887 is scaled uniformly by 1600/1774; its airy arches retain
 // their original transparency and the six painted roof lines meet collision.
 ctx.drawImage(art.structure,0,0,1600,800);
 const patterns=patternsFor(ctx,id,art);
 ctx.save();ctx.translate(0,FLOOR);
 // The continuous painted floor extends beyond either world boundary, even
 // when the camera zooms out. Only the floor texture repeats, never buildings.
 if(patterns.ground){ctx.fillStyle=patterns.ground;ctx.fillRect(-12000,0,25600,124);}
 if(patterns.wall){ctx.fillStyle=patterns.wall;ctx.fillRect(-12000,124,25600,8000);}
 ctx.restore();ctx.restore();return true;
}
function drawPreview(ctx,id){
 if(!images[id])return false;
 // Preview UI is 1200x640: show the entire 1600-unit world at 75% scale.
 ctx.save();ctx.translate(0,95);ctx.scale(.75,.75);const drawn=draw(ctx,id);ctx.restore();return drawn;
}
const ready=ensureScene('temple');
const previewsReady=Promise.all(Object.keys(platformsByScene).map(ensureScene));
root.RiftArena={WORLD_LEFT,WORLD_RIGHT,FLOOR,spawnPoints,platforms,PLATFORMS:platforms,platformsByScene,roofMetadata,getPlatforms,revision:REVISION,ready,previewsReady,ensureScene,isSceneReady,draw,drawPreview};
if(typeof module!=='undefined')module.exports=root.RiftArena;
})(typeof window!=='undefined'?window:globalThis);
