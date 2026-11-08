(function(root){'use strict';
// Visible prototype geometry matches engine.platforms exactly. The reference
// proves elevated landing; one-way collision is this prototype's chosen rule.
// Fit both bodies through pursuit, substitution and the separate falling arcs.
// Position-derived blending avoids a camera reset when an attack is cancelled.
function cameraView(world){
 const highest=Math.min(world.p1.y,world.p2.y),lowest=Math.max(world.p1.y,world.p2.y);
 const top=highest-165,bottom=lowest+10,height=bottom-top;
 const blend=Math.max(0,Math.min(1,(360-highest)/160)),weight=blend*blend*(3-2*blend);
 const fit=Math.min(.82,430/Math.max(1,height)),zoom=1+(fit-1)*weight;
 const center=Math.max(270,135+height*zoom/2),mid=(top+bottom)/2;
 const target=(center-340)/zoom-(mid-340),base=world.settings.platforms?Math.max(0,Math.min(170,310-highest)):0;
 return {y:base+(target-base)*weight,zoom};
}
function cameraY(world){return cameraView(world).y;}
function cameraZoom(world){return cameraView(world).zoom;}
function draw(ctx,world){if(!world.settings.platforms)return;ctx.save();for(const p of world.platforms||[]){
 ctx.fillStyle='#1c2c38';ctx.fillRect(p.x,p.y,p.w,32);ctx.fillStyle='#748d94';ctx.fillRect(p.x,p.y,p.w,5);ctx.fillStyle='#c1cdaf';ctx.fillRect(p.x,p.y,p.w,2);
 for(let i=0;i<p.w;i+=32){ctx.fillStyle=i%64===0?'#405968':'#4c6470';ctx.fillRect(p.x+i+2,p.y+7,28,11);ctx.fillStyle='#283c49';ctx.fillRect(p.x+i+10,p.y+20,20,8);ctx.fillStyle='#839581';ctx.fillRect(p.x+i+3,p.y+7,12,2);}
 ctx.fillStyle='#15242d';ctx.fillRect(p.x+8,p.y+32,p.w-16,6);ctx.fillStyle='#9fb284';for(let i=12;i<p.w-8;i+=47)ctx.fillRect(p.x+i,p.y-3,12,3);
 }ctx.restore();}
root.RiftStage={cameraY,cameraZoom,draw};if(typeof module!=='undefined')module.exports=root.RiftStage;
})(typeof window!=='undefined'?window:globalThis);
