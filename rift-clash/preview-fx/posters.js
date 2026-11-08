(function(root){'use strict';
const images={},data=root.RiftPosterData||{};
const ready=Promise.all(Object.entries(data).map(([id,item])=>new Promise(resolve=>{if(typeof root.Image!=='function'){resolve(false);return;}const im=new root.Image();im.onload=()=>{images[id]=im;resolve(true);};im.onerror=()=>resolve(false);im.src=item.src;}))).then(values=>values.length===6&&values.every(Boolean));
function draw(ctx,cutin,options={}){if(!cutin)return;if(root.RiftMotionData?.fullRoster&&!cutin.finisher)return drawStrip(ctx,cutin,options);const elapsed=cutin.total-cutin.remaining,p=elapsed/cutin.total,alpha=Math.min(1,(elapsed+1)/4,cutin.remaining/5),col=cutin.color||'#c6eece';ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#030a11';ctx.fillRect(0,0,1200,640);
 const im=images[cutin.hero];if(im){const scale=Math.max(1200/im.width,640/im.height)*(1.015+p*.035),w=im.width*scale,h=im.height*scale;ctx.drawImage(im,(1200-w)/2+(1-Math.min(1,p*6))*60,(640-h)/2,w,h);}
 const g=ctx.createLinearGradient(0,0,850,0);g.addColorStop(0,'#020911f2');g.addColorStop(.42,'#07122488');g.addColorStop(1,'#07122400');ctx.fillStyle=g;ctx.fillRect(0,0,1200,640);
 ctx.fillStyle='#020810';ctx.fillRect(0,0,1200,24);ctx.fillRect(0,612,1200,28);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,26);ctx.lineTo(1200,26);ctx.moveTo(0,610);ctx.lineTo(1200,610);ctx.stroke();
 ctx.save();ctx.globalAlpha*=.33;ctx.lineWidth=1;for(let i=0;i<12;i++){const y=44+i*46,x=((i*139+elapsed*26)%1450)-250;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+110+(i%3)*25,y-10);ctx.stroke();}ctx.restore();
 const slide=(1-Math.min(1,p*8))*-34;ctx.translate(slide,0);ctx.textAlign='left';ctx.fillStyle=col;ctx.font='700 16px "Noto Sans SC",system-ui';ctx.fillText(cutin.finisher?'FINAL STRIKE / 终结奥义':'LIMIT BREAK / 奥义解放',62,218);
 ctx.fillStyle='#ffffff';ctx.font='800 37px "Noto Sans SC",system-ui';ctx.fillText(cutin.name,60,280,540);ctx.fillStyle=col;ctx.font='900 46px "Noto Sans SC",system-ui';ctx.fillText(cutin.move,60,352,580);
 ctx.fillStyle=col;ctx.fillRect(63,379,92,4);ctx.fillStyle='#d7e8e8';ctx.font='500 15px "Noto Sans SC",system-ui';ctx.fillText(cutin.finisher?'水之呼吸 · 生生流转':'蓄势 · 释放 · 终结',62,421);ctx.font='600 11px system-ui';ctx.fillStyle='#b7cdd3';ctx.fillText('RIFT / CLASH',62,582);ctx.restore();
}
// The reference introduces an ultimate with a horizontal portrait while the
// fighters remain visible below it. Reuse approved portraits; no extra asset.
function drawStrip(ctx,cutin,options={}){
 const elapsed=Math.max(0,cutin.total-cutin.remaining),stripTicks=cutin.total>60?cutin.total-30:cutin.total;if(elapsed>=stripTicks)return;const p=elapsed/Math.max(1,stripTicks),reduced=!!options.reducedMotion;
 const alpha=reduced?.9:Math.min(1,(elapsed+1)/6,(stripTicks-elapsed)/8),slide=reduced?0:(1-Math.min(1,p*7))*-120;
 const col=cutin.color||'#a9e6f5',y=139,h=170;
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(slide,0);
 ctx.fillStyle='#03111de8';ctx.fillRect(0,y,1200,h);
 const glow=ctx.createLinearGradient(0,y,1200,y);glow.addColorStop(0,col);glow.addColorStop(.48,'#12344b');glow.addColorStop(1,'#061422');ctx.globalAlpha*=.55;ctx.fillStyle=glow;ctx.fillRect(0,y,1200,h);ctx.globalAlpha=alpha;
 ctx.save();ctx.beginPath();ctx.rect(0,y,520,h);ctx.clip();const im=images[cutin.hero];if(im){const scale=520/im.width,w=im.width*scale,ih=im.height*scale;ctx.drawImage(im,0,y+(h-ih)/2+20,w,ih);}ctx.restore();
 const shade=ctx.createLinearGradient(250,0,580,0);shade.addColorStop(0,'#07142000');shade.addColorStop(1,'#071420');ctx.fillStyle=shade;ctx.fillRect(250,y,330,h);
 ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.moveTo(0,y+h);ctx.lineTo(1200,y+h);ctx.stroke();
 ctx.fillStyle=col;ctx.font='700 13px system-ui';ctx.textAlign='left';ctx.fillText('LIMIT BREAK / 奥义',570,y+37);
 ctx.fillStyle='#ffffff';ctx.font='800 24px "Noto Sans SC",system-ui';ctx.fillText(cutin.name,570,y+77,570);
 ctx.fillStyle=col;ctx.font='900 34px "Noto Sans SC",system-ui';ctx.fillText(cutin.move,570,y+127,570);
 ctx.restore();
}
root.RiftPosters={ready,draw};
})(typeof window!=='undefined'?window:globalThis);
