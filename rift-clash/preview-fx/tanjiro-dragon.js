(function(root){'use strict';
// A single authored dragon, anchored by its mouth to the captured opponent.
// Both orientation and position come from the combat simulation, not wall time.
const images=new Map();let pending=null;
const frames=()=>root.RiftTanjiroDragonArt?.frames;
function isReady(){const f=frames();return f?.length===8&&f.every(p=>images.has(p.image));}
function ensureReady(){
 if(isReady())return Promise.resolve(true);if(pending)return pending;const f=frames();if(f?.length!==8||typeof root.Image!=='function')return Promise.resolve(false);
 const job=Promise.all(f.map(p=>images.has(p.image)?true:new Promise(resolve=>{const im=new root.Image();im.onload=()=>{images.set(p.image,im);resolve(true);};im.onerror=()=>resolve(false);if(root.RiftImageQueue)root.RiftImageQueue.load(im,p.image);else im.src=p.image;}))).then(ok=>ok.every(Boolean)&&isReady());
 pending=job;job.finally(()=>{if(pending===job)pending=null;});return job;
}
function drawEffect(ctx,e,options={}){
 if(e.kind!=='waterDragonRide')return false;if(e.life<=0||!isReady())return true;
 const list=frames(),index=options.reducedMotion?3:Math.floor((e.age||0)/3)%8,p=list[index],im=images.get(p.image);
 const bounds=p.contentBounds||root.RiftTanjiroDragonArt.contentBounds;
 const width=bounds?bounds[2]-bounds[0]:p.width;
 const scale=430/Math.max(1,width),alpha=Math.min(1,e.life/6);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;
 if(!e.released&&Number.isFinite(e.originY)){ctx.beginPath();ctx.rect(-4096,-4096,8192,e.originY+4096+18);ctx.clip();}
 ctx.translate(e.x,e.y);ctx.scale(e.dir<0?-1:1,1);ctx.rotate(e.angle||0);
 ctx.drawImage(im,-p.anchor[0]*scale,-p.anchor[1]*scale,p.width*scale,p.height*scale);ctx.restore();return true;
}
root.RiftTanjiroDragon={ensureReady,isReady,drawEffect};
})(typeof window!=='undefined'?window:globalThis);
