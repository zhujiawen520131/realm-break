(function(root){
'use strict';
// BVN-inspired interaction layer. Values below are Rift balance values,
// not extracted BVN frame data. Absence of this module leaves legacy rules intact.
const RULES=Object.freeze({stamina:100,dashGround:20,dashAir:30,ghostStamina:20,ghostEnergy:0,ghostCooldown:12,ghostDistance:160,ghostInv:9,recoveryWindow:8,recoveryCost:20,recoveryInv:12,regenDelay:45,regen:.7});
const enabled=w=>w.settings.bvn!==false;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function init(f){if(!Number.isFinite(f.stamina))f.stamina=RULES.stamina;f.bvnAirDashes??=0;f.bvnAirGhosts??=0;f.bvnStaminaDelay??=0;f.bvnGhostCD??=0;f.bvnGuardRecovery??=0;}
function spend(f,n){init(f);if(f.stamina+1e-6<n)return false;f.stamina=Math.max(0,f.stamina-n);f.bvnStaminaDelay=RULES.regenDelay;return true;}
function controlled(w,f){return !!w.cutin||!!w.tanjiroCinematic||!!root.RiftAnimeTrioRules?.controlled(w,f)||[w.p1,w.p2].some(p=>p.attack?.sixfold||p.attack?.mananSequence||p.attack?.waterSequence||p.attack?.fireSequence);}
function canCancel(w,f,key){
 if(!enabled(w))return undefined;const a=f.attack;if(!a?.bvnRole)return undefined;
 if(a.bvnRole==='downward')return false;
 return !!a.bvnConfirmed&&(!a.move.hits||a.move.hits===1||a.kitSlots?.size>=a.move.hits)&&a.t>=a.move.startup+2&&a.t<a.move.end-1&&['attack','jump','dash','skill','heavy','throw','ultimate','signature','awaken'].includes(key);
}
function update(w,f,keys={}){
 if(!enabled(w))return;init(f);
 if(f.bvnGhostCD>0)f.bvnGhostCD--;
 if(f.bvnGuardRecovery>0&&--f.bvnGuardRecovery===0){f.stamina=Math.max(35,f.stamina);f.bvnStaminaDelay=20;}
 if(w.supportAt(f)){f.bvnAirDashes=0;f.bvnAirGhosts=0;}
 if(f.bvnStaminaDelay>0)f.bvnStaminaDelay--;else if(!f.stun&&!f.dash&&!f.block&&!keys.down)f.stamina=Math.min(RULES.stamina,f.stamina+RULES.regen);
 // Natural getup has a brief protection window too. Downed bodies are already
 // excluded by the base engine; this covers the transition back to standing.
 if(f.downTime===1)f.inv=Math.max(f.inv,RULES.recoveryInv+1);
}
function landed(w,f){if(enabled(w))f.bvnDownLandedAt=w.frame;}
function execute(w,f,keys,b,legacyCancel){
 if(!enabled(w))return false;init(f);const a=f.attack,ground=!!w.supportAt(f),can=canCancel(w,f,b.key)??legacyCancel;
 if(b.key==='dash'&&f.downTime>0){
  const age=w.frame-(f.bvnDownLandedAt??-1e6);
  if(age>=0&&age<=RULES.recoveryWindow&&!controlled(w,f)&&spend(f,RULES.recoveryCost)){
   f.downTime=f.downAge=f.stun=f.guardStun=f.fallTime=0;f.knockdown=false;f.vx=f.vy=0;f.buffer=null;f.attack=null;f.block=false;f.landTime=7;f.inv=RULES.recoveryInv;
   w.event('recover',{hero:f.hero,x:f.x,y:f.y,dir:f.dir,color:f.color});w.lastFeedback='受身 / 落地瞬间 L 快速起身';
  }else f.buffer=null;
  return true;
 }
 if(f.stun||f.dash||f.knockdown||controlled(w,f))return false;
 if(b.key==='attack'&&root.RiftBvnHeroRules?.counter?.(w,f,b.dir)){f.buffer=null;return true;}
 if(b.key==='signature'){
  if(!a||can){if(root.RiftAnimeTrioRules?.applies(f))root.RiftAnimeTrioRules.activateSignature(w,f,b.dir);else root.RiftBvnHeroRules?.activate?.(w,f,b.dir);f.buffer=null;}return true;
 }
 if(b.key==='dash'&&(keys.up||keys.down)){
  if(a&&!can)return true;
  if(f.bvnGhostCD>0||!ground&&f.bvnAirGhosts>=1||f.energy<RULES.ghostEnergy||f.stamina<RULES.ghostStamina){f.buffer=null;w.lastFeedback='幽步资源不足 / 空中每次起跳限一次';return true;}
  spend(f,RULES.ghostStamina);f.energy-=RULES.ghostEnergy;f.bvnGhostCD=RULES.ghostCooldown;
  const fromX=f.x,fromY=f.y,dir=b.dir||f.inputDir||f.dir;
  f.trail.push({x:f.x,y:f.y,dir:f.dir,life:12,animTime:f.animTime,animState:f.animState,attack:f.attack});
  if(keys.up){f.y=Math.max(510-1200,f.y-RULES.ghostDistance);f.vy=-1;f.bvnAirGhosts++;}
  else if(!ground){f.y=Math.min(510,f.y+RULES.ghostDistance);f.vy=1;const support=w.landingAt(f,fromX,fromY);if(support){f.y=support.y;f.vy=0;}f.bvnAirGhosts++;}
  else{f.x=clamp(f.x+dir*RULES.ghostDistance,42,w.width-42);f.vy=0;}
  f.vx=0;f.dir=f.inputDir=dir;f.returning=false;f.attack=null;f.buffer=null;f.block=false;f.inv=RULES.ghostInv;f.blinkTime=8;w.refreshSupport(f);
  w.event('sub',{hero:f.hero,x:f.x,y:f.y-55,fromX,fromY:fromY-55,dir,color:f.color,bvnGhost:true});
  w.lastFeedback=keys.up?'幽跃 / W + L 向上追击':ground?'幽步 / S + L 按操控方向闪移':'幽降 / S + L 向下落位';return true;
 }
 if(b.key==='dash'&&(!a||can)){
  if(!ground&&f.bvnAirDashes>=1||!spend(f,ground?RULES.dashGround:RULES.dashAir)){f.buffer=null;w.lastFeedback='冲刺耐力不足 / 空中每次起跳限一次';return true;}
  if(!ground)f.bvnAirDashes++;return false;
 }
 if(b.key==='attack'&&ground&&(keys.up||keys.down)&&(!a||can)){
  if(root.RiftAnimeTrioRules?.applies(f))return false;
  if(!keys.up&&['tanjiro','zenitsu'].includes(f.hero))return false;
  f.dir=f.inputDir=b.dir;
  const rising=!!keys.up,hasKit=f.hero==='manan'||f.hero==='tanjiro'&&root.RiftTanjiroRules||f.hero==='zenitsu'&&root.RiftZenitsuRules||root.RiftRosterRules?.applies(f);
  // Reuse the correct authored weapon motion, including Lara's actual bullets.
  w.begin(f,rising?'launcher':hasKit?'heavy':'slash3');const attack=f.attack,m=attack.move;
  attack.bvnRole=rising?'launcher':'downward';m.bvnRole=attack.bvnRole;
  if(rising){m.knockdown=false;m.lift=Math.min(-11,m.lift||0);m.finalLift=m.lift;attack.bvnConfirmed=false;}
  else{m.knockdown=true;m.finalLift=-4;m.lift=-4;m.bvnGuardDamage=28;}
  w.lastFeedback=rising?'上向攻击 / W + J 挑空，命中后 K 追击':'下向攻击 / S + J 重压倒地';return true;
 }
 return false;
}
function afterHit(w,f,t,m,name,contact){
 if(!enabled(w))return;init(f);init(t);
 if(!contact.guarded&&f.attack?.name===name&&f.attack.bvnRole==='launcher')f.attack.bvnConfirmed=true;
 if(contact.guarded){
  t.stamina=Math.max(0,t.stamina-(m.bvnGuardDamage||Math.max(8,m.damage*1.5)));t.bvnStaminaDelay=RULES.regenDelay;
  if(t.stamina===0){t.block=false;t.guardStun=0;t.stun=Math.max(t.stun,35);t.bvnGuardRecovery=35;t.bvnStaminaDelay=70;w.event('guardbreak',{hero:t.hero,x:t.x,y:t.y-85,dir:contact.dir,color:t.color});w.lastFeedback='破防 / 耐力耗尽';}
 }
}
const canGuard=(w,f)=>!enabled(w)||!(f.bvnGuardRecovery>0);
root.RiftBvnRules={canGuard,RULES,enabled,init,spend,canCancel,update,landed,execute,afterHit};
if(typeof module!=='undefined')module.exports=root.RiftBvnRules;
})(typeof window!=='undefined'?window:globalThis);
