(function(root){'use strict';
// BVN-style signature inputs reuse the existing authored character and effect
// cels. The rules provide the same pose adapter used by projectile emission.
function visualPose(f){return root.RiftBvnHeroRules?.visualPose?.(f)||null;}
function drawFighter(ctx,f){
 if(!f?.attack?.move?.bvnSignature)return false;
 // Defensive states win even if a caller still holds the interrupted attack.
 if(f.stun>0||f.downTime>0||f.knockdown){const hurt={...f,attack:null};return f.hero==='manan'?!!root.RiftMananVisual?.drawFighter?.(ctx,hurt):!!root.RiftMotionPreview?.draw?.(ctx,hurt);}
 const pose=visualPose(f);if(!pose)return false;const actor=pose.actor;
 if(pose.source==='motion')return !!root.RiftMotionPreview?.draw?.(ctx,actor);
 if(pose.source==='roster')return !!root.RiftRosterVisual?.drawFighter?.(ctx,actor);
 if(pose.source==='tanjiro')return !!root.RiftTanjiroVisual?.drawFighter?.(ctx,actor);
 if(pose.source==='fire')return !!root.RiftTanjiroFireVisual?.drawFighter?.(ctx,actor);
 if(pose.source==='manan')return !!root.RiftMananVisual?.drawFighter?.(ctx,actor);
 return false;
}
function projectileOrigin(f){
 if(f?.hero!=='lara'||!f.attack?.move?.bvnSignature)return null;
 const pose=visualPose(f);if(pose?.source!=='motion'||pose.actor.attack.name!=='slash3')return null;
 // No alternative muzzle calculation: exactly the actor consumed by the
 // combat module and by drawFighter is handed to the authored pose resolver.
 return root.RiftMotionPreview?.projectileOrigin?.(pose.actor,'slash3')||null;
}
// Forward palm centres measured on the eight 896 × 640 jump cels below.
// Runtime offsets and scale are taken from the same resolver as the body;
// these are source-image coordinates, never guessed world-space offsets.
const ROPE_HANDS=Object.freeze([[483,572],[481,548],[476,439],[491,448],[512,446],[499,444],[499,572],[495,545]].map(p=>Object.freeze(p)));
const ROPE_REFERENCE='art/pixel-eight/frames/drake/jump/';
function ropeHand(f){
 const pose=visualPose(f),resolved=pose&&root.RiftMotionPreview?.resolve?.(pose.actor),frame=resolved?.frame;
 let marker=frame?.markers?.ropeHand||frame?.markers?.hand||frame?.hand;
 const file='assets/pixel-eight/frames/drake/jump/'+String((resolved?.index??-1)+1).padStart(2,'0')+'.webp';
 if(!marker&&resolved?.clip==='jump'&&frame?.width===896&&frame?.height===640&&(frame.image||frame.src)===file)marker=ROPE_HANDS[resolved.index];
 if(!Array.isArray(marker)||marker.length!==2||!marker.every(Number.isFinite)||![resolved?.x,resolved?.y,resolved?.scale].every(Number.isFinite))return null;
 return {x:f.x+(f.dir<0?-1:1)*(resolved.x+marker[0]*resolved.scale),y:f.y+resolved.y+marker[1]*resolved.scale};
}
function drawRope(ctx,e,options){
 const f=e.owner,a=e.attack,anchor=e.anchor;
 if(!f||f.attack!==a||a?.anchorMissing||f.stun||f.downTime||f.knockdown||a.t>=a.move.startup||!(e.life>0)||!Number.isFinite(anchor?.x)||!Number.isFinite(anchor?.y))return true;
 // Release when the real jump pose transitions into the attacking punch.
 const hand=ropeHand(f);if(!hand)return true;ctx.save();ctx.globalAlpha=(Number.isFinite(ctx.globalAlpha)?ctx.globalAlpha:1)*Math.min(1,e.life/5);
 // This line is a physical rope tied to the actual selected building ledge;
 // all combat bursts below remain authored pixel images.
 ctx.beginPath();ctx.moveTo(hand.x,hand.y);ctx.lineTo(anchor.x,anchor.y);ctx.strokeStyle='#182322';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#c6bba0';ctx.lineWidth=2;ctx.stroke();ctx.restore();return true;
}
function drawEffect(ctx,e,options={}){
 if(e?.kind!=='bvnFx')return false;const hero=e.hero||e.owner?.hero,clip=e.clipId;
 if(hero==='drake'&&clip==='rope')return drawRope(ctx,e,options);
 const base={...e,hero,mode:e.mode??e.attack?.move?.bvnMode??0};
 if(hero==='manan')return !!root.RiftMananVisual?.drawEffect?.(ctx,{...base,kind:'mananFx',clipId:'ridge',y:e.y+80},options);
 if(hero==='tanjiro'){
  if(clip==='waterfall')return !!root.RiftTanjiroVisual?.drawEffect?.(ctx,{...base,kind:'tanjiroFx',clipId:'waterfall'},options);
  if(clip==='fireCross'){
   if(!root.RiftTanjiroFireVisual?.drawEffect)return false;
   // The two real strikes have opposed authored flame arcs. Rotate their
   // local effect space without altering the actor or the hit geometry.
   ctx.save();ctx.translate(e.x,e.y);ctx.rotate((e.angle||0)*(e.dir<0?-1:1));ctx.translate(-e.x,-e.y);
   const drawn=root.RiftTanjiroFireVisual.drawEffect(ctx,{...base,kind:'tanjiroFireFx',clipId:'slash',reach:e.attack?.move?.reach||240},options);ctx.restore();return !!drawn;
  }
  return false;
 }
 const id=hero==='wukong'&&['parry','aura'].includes(clip)?'awaken':hero==='zenitsu'&&clip==='lightningBurst'?'skill3':clip;
 if(!['cloud','lara','wukong','drake','zenitsu'].includes(hero)||!['skill2','skill3','awaken'].includes(id))return false;
 // Lara's effect x/y is recorded at the actual authored muzzle by the rules.
 // Do not replace that point with torso position or aim at an opponent.
 return !!root.RiftRosterVisual?.drawEffect?.(ctx,{...base,kind:'rosterFx',clipId:id},options);
}
const api={drawFighter,drawEffect,visualPose,projectileOrigin,ropeHand,ropeCalibration:{reference:ROPE_REFERENCE,hands:ROPE_HANDS}};root.RiftBvnVisual=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
