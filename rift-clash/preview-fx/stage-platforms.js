(function(root){'use strict';
// Visible prototype geometry matches engine.platforms exactly. The reference
// proves elevated landing; one-way collision is this prototype's chosen rule.
// Keep the arena floor as a stable framing anchor while widening the world view.
// Characters visibly climb on screen; the camera no longer pins their feet.
function cameraView(world){
 const highest=Math.min(world.p1.y,world.p2.y),rise=Math.max(0,510-highest);
 const blend=Math.max(0,Math.min(1,(rise-80)/240)),weight=blend*blend*(3-2*blend);
 const fit=Math.min(1,430/(rise+180)),zoom=1+(fit-1)*weight;
 const anchored=230/zoom-170;
 return {y:anchored*weight,zoom};
}
function cameraX(world,zoom=1){
 const width=world.width||1200;if(width<=1200)return 0;
 const p=world.p1,q=world.p2,focus=p.x+Math.max(-240,Math.min(240,(q.x-p.x)/2)),half=600/zoom;
 const center=width<=half*2?width/2:Math.max(half,Math.min(width-half,focus));
 return (600-center)*zoom;
}
function cameraY(world){return cameraView(world).y;}
function cameraZoom(world){return cameraView(world).zoom;}
function draw(ctx,world){if(!world.settings.platforms)return;ctx.save();for(const p of world.platforms||[]){
 ctx.fillStyle='#1c2c38';ctx.fillRect(p.x,p.y,p.w,32);ctx.fillStyle='#748d94';ctx.fillRect(p.x,p.y,p.w,5);ctx.fillStyle='#c1cdaf';ctx.fillRect(p.x,p.y,p.w,2);
 for(let i=0;i<p.w;i+=32){ctx.fillStyle=i%64===0?'#405968':'#4c6470';ctx.fillRect(p.x+i+2,p.y+7,28,11);ctx.fillStyle='#283c49';ctx.fillRect(p.x+i+10,p.y+20,20,8);ctx.fillStyle='#839581';ctx.fillRect(p.x+i+3,p.y+7,12,2);}
 ctx.fillStyle='#15242d';ctx.fillRect(p.x+8,p.y+32,p.w-16,6);ctx.fillStyle='#9fb284';for(let i=12;i<p.w-8;i+=47)ctx.fillRect(p.x+i,p.y-3,12,3);
 }ctx.restore();}
root.RiftStage={cameraY,cameraZoom,cameraX,draw};if(typeof module!=='undefined')module.exports=root.RiftStage;
})(typeof window!=='undefined'?window:globalThis);
