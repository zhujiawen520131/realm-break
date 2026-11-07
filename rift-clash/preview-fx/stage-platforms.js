(function(root){'use strict';
// Visible prototype geometry matches engine.platforms exactly. The reference
// proves elevated landing; one-way collision is this prototype's chosen rule.
function cameraY(world){if(!world.settings.platforms)return 0;const highest=Math.min(world.p1.y,world.p2.y);return Math.max(0,Math.min(170,310-highest));}
function draw(ctx,world){if(!world.settings.platforms)return;ctx.save();for(const p of world.platforms||[]){
 ctx.fillStyle='#1c2c38';ctx.fillRect(p.x,p.y,p.w,32);ctx.fillStyle='#748d94';ctx.fillRect(p.x,p.y,p.w,5);ctx.fillStyle='#c1cdaf';ctx.fillRect(p.x,p.y,p.w,2);
 for(let i=0;i<p.w;i+=32){ctx.fillStyle=i%64===0?'#405968':'#4c6470';ctx.fillRect(p.x+i+2,p.y+7,28,11);ctx.fillStyle='#283c49';ctx.fillRect(p.x+i+10,p.y+20,20,8);ctx.fillStyle='#839581';ctx.fillRect(p.x+i+3,p.y+7,12,2);}
 ctx.fillStyle='#15242d';ctx.fillRect(p.x+8,p.y+32,p.w-16,6);ctx.fillStyle='#9fb284';for(let i=12;i<p.w-8;i+=47)ctx.fillRect(p.x+i,p.y-3,12,3);
 }ctx.restore();}
root.RiftStage={cameraY,draw};
})(typeof window!=='undefined'?window:globalThis);
