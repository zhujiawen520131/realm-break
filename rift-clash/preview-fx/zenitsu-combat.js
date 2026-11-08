(function(root){
'use strict';
// Authored pixel PNGs used directly in live combat, with no cinematic cutaway.
const images={},names=['charge_01','charge_02','charge_03','dash_01','dash_02','dash_03','trail_01','trail_02','trail_03','burst_01','burst_02','burst_03','lightning_01','lightning_02','lightning_03','lightning_04'];
const ready=typeof root.Image==='function'?Promise.all(names.map(name=>new Promise(resolve=>{const im=new root.Image();im.onload=()=>{images[name]=im;resolve(true);};im.onerror=()=>resolve(false);im.src='assets/zenitsu-combat/'+name+'.png?v=z-combat-2';}))).then(r=>r.every(Boolean)):Promise.resolve(false);
function drawFighter(ctx,f){
 if(f.hero!=='zenitsu'||f.attack?.name!=='ultimate')return false;
 const a=f.attack,charge=a.t<a.move.startup,id=charge?'charge_0'+(1+Math.min(2,Math.floor(a.t/4))):'dash_0'+(1+Math.floor((a.sixfold?.progress||a.t/10)*3)%3),im=images[id];if(!im)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(f.x,f.y);ctx.scale(f.dir||1,1);if(f.flash)ctx.filter='brightness(1.5)';
 if(charge){const bolt=images['lightning_0'+(1+Math.floor(a.t/2)%4)];if(bolt){ctx.save();ctx.globalAlpha=.65;ctx.drawImage(bolt,-110,-330,220,350);ctx.restore();}}
 if(a.sixfold?.leg>=0){ctx.translate(0,-75);ctx.rotate(-Math.PI/4);ctx.translate(0,75);}
 // Source sprites are padded to 512px with their ground-contact at y490.
 const size=charge?240:260;ctx.drawImage(im,-size/2,-size*490/512,size,size);ctx.restore();return true;
}
function drawEffect(ctx,e,{reducedMotion=false}={}){
 if(!['thunderPath','thunderTurn'].includes(e.kind))return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=Math.min(1,e.life/12)*(reducedMotion?.6:1);
 if(e.kind==='thunderTurn'){const im=images['burst_0'+(1+Math.min(2,Math.floor((e.max-e.life)/4)))];if(im)ctx.drawImage(im,e.x-140,e.y-92,280,184);}
 else{
  const dx=e.x-e.fromX,dy=e.y-e.fromY,len=Math.hypot(dx,dy),active=e.active&&e.life>=e.max-2;
  const id=active?(Math.floor((e.tick||0)/3)%2?'trail_01':'trail_02'):'trail_03',im=images[id];
  if(im&&len>1){const tip={trail_01:[471,208],trail_02:[564,208],trail_03:[532,205]}[id];ctx.translate(e.fromX,e.fromY);ctx.rotate(Math.atan2(dy,dx));const h=active?340:240;const paint=height=>ctx.drawImage(im,0,0,640,420,0,-tip[1]/420*height,len*640/tip[0],height);if(!reducedMotion){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=active?.4:.2;paint(h*1.35);ctx.restore();}paint(h);}
 }
 ctx.restore();return true;
}
root.RiftZenitsuCombat={ready,drawFighter,drawEffect};
})(typeof window!=='undefined'?window:globalThis);
