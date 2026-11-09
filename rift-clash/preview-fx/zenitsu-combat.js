(function(root){
'use strict';
// Authored pixel PNGs used directly in live combat, with no cinematic cutaway.
const images={},eight=!!root.RiftMotionData?.eightFrameMode,bodyGroups=['charge','dash','launch','moonpose'];
const names=['trail_01','trail_02','trail_03','burst_01','burst_02','burst_03','lightning_01','lightning_02','lightning_03','lightning_04','debris_01','debris_02','debris_03',...bodyGroups.flatMap(group=>Array.from({length:eight?8:3},(_,i)=>group+'_'+String(i+1).padStart(2,'0')))];
let loadJob=null;
function isReady(){return names.every(name=>images[name]);}
function ensureReady(){
 if(isReady())return Promise.resolve(true);
 if(typeof root.Image!=='function')return Promise.resolve(false);
 if(loadJob)return loadJob;
 const job=Promise.all(names.filter(name=>!images[name]).map(name=>new Promise(resolve=>{
  const im=new root.Image();im.onload=()=>{images[name]=im;resolve(true);};im.onerror=()=>resolve(false);
  const body=bodyGroups.some(g=>name.startsWith(g+'_'));const source=(eight&&body?'assets/zenitsu-eight/':'assets/zenitsu-combat/')+name+'.png?v=pixel-eight-r1';if(root.RiftImageQueue)root.RiftImageQueue.load(im,source);else im.src=source;
 }))).then(r=>r.every(Boolean));loadJob=job;job.then(()=>{if(loadJob===job)loadJob=null;});return job;
}
const ready=ensureReady();
function bodyFrame(a){
 const charge=a.t<a.move.startup,vertical=a.sixfold?.leg===5,recovery=!a.sixfold&&a.hit&&a.t>=a.move.startup+a.move.active;
 const group=charge?'charge':vertical?'launch':recovery?'moonpose':'dash',count=eight?8:3;
 let progress=charge?a.t/Math.max(1,a.move.startup):vertical?(a.sixfold.progress*8-1)/7:recovery?(a.t-a.move.startup-a.move.active)/Math.max(1,a.move.end-a.move.startup-a.move.active-1):a.sixfold?.leg>=0?(a.sixfold.progress*6-1)/5:Math.max(0,a.t-a.move.startup)/Math.max(1,a.move.active-1);
 const index=Math.min(count-1,Math.floor(Math.max(0,progress)*count));return {id:group+'_'+String(index+1).padStart(2,'0'),group,index,charge,vertical,recovery};
}
function drawFighter(ctx,f){
 if(f.hero!=='zenitsu'||f.attack?.name!=='ultimate')return false;
 const a=f.attack,{id,charge,vertical}=bodyFrame(a),im=images[id];if(!im)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(f.x,f.y);ctx.scale(f.dir||1,1);if(f.flash)ctx.filter='brightness(1.5)';
 if(charge){const bolt=images['lightning_0'+(1+Math.floor(a.t/2)%4)];if(bolt){ctx.save();ctx.globalAlpha=.65;ctx.drawImage(bolt,-110,-330,220,350);ctx.restore();}}
 if(a.sixfold?.leg>=0&&!vertical){ctx.translate(0,-75);ctx.rotate(-Math.PI/4);ctx.translate(0,75);}
 // Source sprites are padded to 512px with their ground-contact at y490.
 const size=charge?240:260;ctx.drawImage(im,-size/2,-size*490/512,size,size);ctx.restore();return true;
}
function drawEffect(ctx,e,{reducedMotion=false}={}){
 if(!['thunderPath','thunderTurn','thunderSlam','groundSlam'].includes(e.kind))return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=Math.min(1,e.life/12)*(reducedMotion?.6:1);
 if(e.kind==='thunderSlam'||e.kind==='groundSlam'){const i=1+Math.min(2,Math.floor((e.max-e.life)/8)),debris=images['debris_0'+i],burst=images['burst_0'+i];if(debris)ctx.drawImage(debris,e.x-200,e.y-180,400,230);if(burst&&e.kind==='thunderSlam')ctx.drawImage(burst,e.x-190,e.y-85,380,150);}
 else if(e.kind==='thunderTurn'){const im=images['burst_0'+(1+Math.min(2,Math.floor((e.max-e.life)/4)))];if(im)ctx.drawImage(im,e.x-140,e.y-92,280,184);}
 else{
  const dx=e.x-e.fromX,dy=e.y-e.fromY,len=Math.hypot(dx,dy),active=e.active&&e.life>=e.max-2;
  const id=active?(Math.floor((e.tick||0)/3)%2?'trail_01':'trail_02'):'trail_03',im=images[id];
  if(im&&len>1){const tip={trail_01:[471,208],trail_02:[564,208],trail_03:[532,205]}[id];ctx.translate(e.fromX,e.fromY);ctx.rotate(Math.atan2(dy,dx));const h=active?340:240;const paint=height=>ctx.drawImage(im,0,0,640,420,0,-tip[1]/420*height,len*640/tip[0],height);if(!reducedMotion){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=active?.4:.2;paint(h*1.35);ctx.restore();}paint(h);}
 }
 ctx.restore();return true;
}
root.RiftZenitsuCombat={ready,isReady,ensureReady,drawFighter,drawEffect,bodyFrame};
})(typeof window!=='undefined'?window:globalThis);
