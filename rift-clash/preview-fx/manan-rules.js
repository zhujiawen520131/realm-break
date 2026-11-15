(function(root){
'use strict';
// Ma Nan: physical terrain construction. These are original gameplay values.
const CATALOG={modes:['实时构筑','世界重构'],skills:[{id:'skill1',name:'山脊推浪',hint:'U · 岩脊沿操控方向推进'},{id:'skill2',name:'抬升构景',hint:'W + U · 石柱挑空，留下可站立石台'},{id:'skill3',name:'根脉绽裂',hint:'S + U · 藤根破土，扇形扫击倒地'}]};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const applies=f=>f?.hero==='manan';
const cost=(f,name='skill')=>name==='awaken'?50:name==='skill'?(f.awakenLevel===2?0:25):0;
function variant(keys={},a){if(['skill1','skill2','skill3'].includes(keys.variant))return keys.variant;if(keys.up)return 'skill2';if(keys.down)return 'skill3';return 'skill1';}
function basic(f,a,keys,ground){if(!ground)return 'air';if(keys.up||keys.down)return 'launcher';if(['slash3','launcher'].includes(a?.name))return null;return ({slash1:'slash2',slash2:'slash3'}[a?.name])||'slash1';}
function move(f,name,id){
 if(!applies(f))return null;
 const mode=f.awakenLevel||0,full=mode===2,boost=mode===2?1.2:mode===1?1.1:1;
 let m={kit:true,mananKit:true,mananMode:mode,style:null,clipId:'attack1',fxClip:'slam',cost:cost(f,name),startup:7,active:6,end:26,hits:1,interval:7,damage:7,reach:105,height:155,stun:28,push:2,lift:0,stop:5,knockdown:false};
 if(name==='slash1')m={...m,lunge:2.5};
 else if(name==='slash2')m={...m,clipId:'attack2',startup:6,damage:9,reach:full?155:120,lunge:3,push:3};
 else if(name==='slash3')m={...m,clipId:'attack3',startup:9,end:35,damage:14,reach:full?185:140,lunge:4,push:10,lift:-5,stop:10,knockdown:true};
 else if(name==='launcher')m={...m,clipId:'launcher',fxClip:'pillar',startup:8,end:30,damage:10,reach:125,height:190,lift:-13,stun:36,stop:7};
 else if(name==='air')m={...m,clipId:'air',startup:5,end:24,damage:8,reach:125,height:170,lift:-5};
 else if(name==='heavy'||name==='airheavy')m={...m,clipId:'heavy',startup:name==='airheavy'?9:25,active:8,end:name==='airheavy'?34:49,damage:full?25:21,reach:full?245:185,height:260,push:11,lift:name==='airheavy'?12:-7,knockdown:true,stop:12};
 else if(name==='throw')m={...m,clipId:'throw',startup:8,active:5,end:35,damage:15,reach:66,height:100,unblockable:true,throw:true,push:12,lift:-8,knockdown:true,stop:8};
 else if(name==='awaken')return {...m,clipId:'awaken',fxClip:'aura',startup:20,active:0,end:34,hits:0,damage:0,reach:0};
 else if(name==='ultimate')m={...m,clipId:'ultimate',fxClip:'ultimate',startup:14,active:7,end:43,damage:5,reach:185,height:165,stun:40,push:0,lift:0,stop:3,mananOpen:true};
 else if(name==='skill'){
  const key=['skill2','skill3'].includes(id)?id:'skill1';m={...m,variant:key,clipId:key==='skill1'?'skill':key,displayName:CATALOG.skills.find(s=>s.id===key).name,knockdown:true,finalPush:10,finalLift:-7};
  if(key==='skill1')m={...m,fxClip:'ridge',startup:13,hits:mode+1,interval:8,damage:mode?9:19,reach:0,projectile:'mananRidge',speed:full?14:11,range:full?660:mode?520:420,projectileWidth:full?120:90,projectileHeight:full?185:145};
  if(key==='skill2')m={...m,fxClip:'pillar',startup:8,hits:mode+2,interval:6,damage:7,reach:full?190:145,height:290,jump:-13.6,finalLift:-13,finalPush:6};
  if(key==='skill3')m={...m,fxClip:'roots',startup:11,hits:mode+1,interval:7,damage:mode?9:20,reach:full?280:mode?225:180,height:195,radial:true};
  m.active=m.hits===1?7:(m.hits-1)*m.interval+1;m.end=m.startup+m.active+20;
 }else return null;
 m.damage=Math.round(m.damage*boost*10)/10;return m;
}
function effect(world,f,clipId,life=24,extra={}){const e={kind:'mananFx',hero:'manan',clipId,x:f.x,y:f.y,dir:f.dir,mode:f.attack?.move.mananMode??f.awakenLevel,life,max:life,owner:f,...extra};world.effects.push(e);return e;}
function begin(world,f,name,id){
 const a=f.attack;if(!a?.move.mananKit)return;a.variant=a.move.variant||id;a.clipId=a.move.clipId;a.direction=f.dir;a.originX=f.x;a.originY=f.y;a.onGround=!!world.supportAt(f);
 if(name==='awaken')effect(world,f,'aura',34);if(a.move.displayName)world.lastFeedback='马楠 / '+a.move.displayName;
}
function makePlatform(world,f,a){
 const width=a.move.mananMode===2?230:180;
 const p={id:'manan-platform-'+(++world.mananPlatformSerial),x:clamp(a.originX-width/2,42,world.width-42-width),y:a.originY-110,w:width,life:240,max:240,owner:f,mode:a.move.mananMode,temporary:true};
 world.temporaryPlatforms??=[];
 // Do not overlay an existing architectural landing edge at nearly the same height.
 const existing=[...(world.settings.platforms?world.platforms:[]),...world.temporaryPlatforms].find(q=>Math.abs(q.y-p.y)<18&&p.x<q.x+q.w&&p.x+p.w>q.x);
 if(existing)return existing;
 while(world.temporaryPlatforms.length>=2)world.temporaryPlatforms.shift();world.temporaryPlatforms.push(p);return p;
}
function update(world,f){
 if(!applies(f))return;if(f.awakenTime>0&&--f.awakenTime===0)f.awakenLevel=0;
 const a=f.attack,m=a?.move;if(!m?.mananKit)return;f.dir=a.direction;
 if(m.jump&&a.t===4&&a.onGround){makePlatform(world,f,a);f.vy=m.jump;world.refreshSupport(f);effect(world,f,'pillar',34,{x:a.originX,y:a.originY});}
 if(a.name==='airheavy'&&a.t===m.startup)f.vy=Math.max(f.vy,12);
}
function touches(world,f,t,m){
 if(t.inv||t.downTime||t.knockdown||t.hp<=0)return false;
 if(m.throw&&(!world.supportAt(f)||!world.supportAt(t)||Math.abs(f.y-t.y)>20))return false;
 const dx=(t.x-f.x)*f.dir;return (m.radial?Math.abs(dx)<=m.reach+23:dx>=-18&&dx<=m.reach+23)&&Math.abs(t.y-f.y)<m.height;
}
function hitMove(m,last){return {...m,projectile:null,finisher:last,knockdown:last&&m.knockdown,push:last?(m.finalPush??m.push):m.push,lift:last?(m.finalLift??m.lift):m.lift};}
function resolve(world,f,t,a){
 const m=a.move;if(!m.mananKit)return false;if(a.mananSequence)return resolveSequence(world,f,t,a);
 const slot=m.hits===1?0:Math.floor((a.t-m.startup)/m.interval);if(slot<0||slot>=m.hits||a.kitSlots?.has(slot))return true;const last=slot===m.hits-1;
 if(m.projectile){
  a.kitSlots??=new Set();a.kitSlots.add(slot);world.spawnProjectile(f,{kind:'mananRidge',name:'skill',x:f.x+f.dir*50,y:a.originY-65,vx:f.dir*m.speed,vy:0,w:m.projectileWidth,h:m.projectileHeight,life:Math.ceil(m.range/m.speed)+3,maxTravel:m.range,traveled:0,mananMode:m.mananMode,move:hitMove(m,last)});
  const projectile=world.projectiles.at(-1);effect(world,f,'ridge',projectile.life,{x:projectile.x,y:projectile.y+65,projectile,mode:m.mananMode});return true;
 }
 a.fxSlots??=new Set();if(!a.fxSlots.has(slot)){a.fxSlots.add(slot);effect(world,f,m.fxClip,20,{x:f.x+f.dir*(m.radial?0:45),y:f.y});world.event('swing',{x:f.x,y:f.y-80,dir:f.dir,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});}
 if(!touches(world,f,t,m))return true;a.kitSlots??=new Set();a.kitSlots.add(slot);const strike=hitMove(m,last);if(m.mananOpen){strike.finisher=false;strike.knockdown=false;}
 world.hit(f,t,strike,a.name,t.x,{dir:m.radial?(t.x>=f.x?1:-1):f.dir});a.hit=true;return true;
}
function awaken(world,f){if(!applies(f)||f.awakenLevel>=2||f.energy<50)return false;f.energy-=50;f.awakenLevel++;f.awakenTime=f.awakenLevel===2?600:900;world.begin(f,'awaken');f.inv=16;world.lastFeedback='马楠 / '+CATALOG.modes[f.awakenLevel-1];return true;}
// A successful, unguarded opening is followed by five visible arena contacts.
const ULTIMATE_PHASES=[
 {name:'岩柱挑空',clipId:'skill2',fx:'pillar',duration:20,hit:14},
 {name:'踏阶追击',clipId:'air',fx:'pillar',duration:18,hit:12},
 {name:'转体横扫',clipId:'attack2',fx:'roots',duration:18,hit:12},
 {name:'悬庭合击',clipId:'heavy',fx:'slam',duration:22,hit:16},
 {name:'崩城终结',clipId:'ultimate',fx:'ultimate',duration:22,hit:15}
];
const TOTAL=ULTIMATE_PHASES.reduce((sum,p)=>sum+p.duration,0);
function phaseAt(a){const seq=a?.mananSequence;if(!seq)return null;let tick=Math.max(0,a.t-seq.startT);for(let i=0;i<ULTIMATE_PHASES.length;i++){const p=ULTIMATE_PHASES[i];if(tick<p.duration||i===ULTIMATE_PHASES.length-1)return {...p,index:i,t:Math.min(tick,p.duration-1)};tick-=p.duration;}}
function ultimatePose(a){const p=phaseAt(a);return p?{...a,clipId:p.clipId,bodyFrame:Math.min(7,Math.floor(p.t/p.duration*8)),t:p.t,move:{...a.move,startup:p.hit,active:1,end:p.duration}}:a;}
function live(f){const s=f?.attack?.mananSequence;return s&&!s.finished&&!f.stun&&f.hp>0&&s.target.hp>0&&!s.target.inv&&s.target.stun>0?s:null;}
function controlled(world,f){return [world.p1,world.p2].some(owner=>{const s=live(owner);return !!s&&(owner===f||s.target===f);});}
function stop(world,f,a){const s=a.mananSequence;if(!s||s.finished)return;s.finished=true;a.t=a.move.startup+a.move.active;a.move.end=a.t+15;f.vx=f.vy=0;f.returning=true;world.lastFeedback='构景奥义中断 / I 可定向替身脱离';}
function advance(world){
 const previous=world.temporaryPlatforms||[];for(const p of previous)p.life--;world.temporaryPlatforms=previous.filter(p=>p.life>0);
 for(const e of world.effects)if(e.kind==='mananFx'&&e.projectile){const b=e.projectile;e.x=b.x;e.y=b.y+65;if(b.dead||b.life<=0)e.life=Math.min(e.life,7);}
 for(const f of [world.p1,world.p2]){
  const a=f.attack,s=a?.mananSequence;if(!s||s.finished)continue;if(!live(f)){stop(world,f,a);continue;}
  const t=s.target,p=phaseAt(a),q=clamp(p.t/p.duration,0,1),ease=n=>n*n*(3-2*n);a.clipId=p.clipId;
  // Two rising arcs, lateral follow-through, high architectural strike, then plunge.
  let rise=0,travel=0;
  if(p.index===0){rise=160*ease(q);travel=25*ease(q);}
  if(p.index===1){rise=160+140*ease(q);travel=25+45*ease(q);}
  if(p.index===2){rise=300+Math.sin(q*Math.PI)*35;travel=70+75*ease(q);}
  if(p.index===3){rise=300+60*Math.sin(q*Math.PI);travel=145+25*ease(q);}
  if(p.index===4){rise=300*(1-ease(clamp(q/.7,0,1)));travel=170+55*ease(q);}
  const desired=clamp(s.tx+s.dir*travel,122,world.width-122),blend=clamp((a.t-s.startT)/8,0,1);
  t.x=desired;t.y=s.ty-rise;f.x=s.fx+(desired-s.dir*76-s.fx)*blend;f.y=s.fy+(s.ty-rise-s.fy)*blend;
  f.x=clamp(f.x,42,world.width-42);f.dir=s.dir;f.vx=f.vy=t.vx=t.vy=0;t.stun=Math.max(20,t.stun);t.block=false;world.refreshSupport(f);world.refreshSupport(t);
  if(p.t===1)effect(world,f,p.fx,p.duration+8,{x:desired,y:t.y,mode:a.move.mananMode});
  world.lastFeedback='一念成境 / '+p.name+' / '+f.combo+' HIT';
 }
}
function resolveSequence(world,f,t,a){
 const s=a.mananSequence;if(s.finished)return true;if(!live(f)){stop(world,f,a);return true;}const p=phaseAt(a);if(p.t!==p.hit||s.struck.has(p.index))return true;
 if(Math.abs(f.x-t.x)>155||Math.abs(f.y-t.y)>170){stop(world,f,a);return true;}
 s.struck.add(p.index);const last=p.index===ULTIMATE_PHASES.length-1;
 const dir=last?(t.x>world.width-190?-1:t.x<190?1:s.dir):s.dir;
 world.hit(f,t,{mananKit:true,mananSequenceHit:true,mananMode:a.move.mananMode,damage:(last?17:8)*s.boost,stun:40,push:last?23:0,lift:last?-8:0,stop:last?11:3,knockdown:last,finisher:last},'ultimate',t.x,{dir});return true;
}
function afterHit(world,f,t,m,contact){
 if(contact.guarded||f.stun||!f.attack)return;
 if(m.mananSequenceHit){const seq=f.attack.mananSequence;if(!seq||seq.finished)return;if(m.finisher||t.hp<=0){seq.finished=true;f.vx=f.vy=0;f.returning=true;if(m.finisher&&world.settings.cinematics)world.cutin={hero:'manan',name:f.info.name,move:'一念成境',color:f.color,dir:seq.dir,remaining:48,total:48,finisher:true};}return;}
 if(!m.mananOpen||f.attack.mananSequence||t.hp<=0)return;
 const a=f.attack;a.mananSequence={target:t,startT:a.t,fx:f.x,fy:f.y,tx:t.x,ty:t.y,dir:f.dir,struck:new Set(),finished:false,boost:m.mananMode===2?1.2:m.mananMode===1?1.1:1};a.move={...a.move,active:TOTAL+12,end:a.t+TOTAL+18};f.vx=f.vy=t.vx=t.vy=0;
}
root.RiftMananRules={CATALOG,applies,cost,variant,basic,move,begin,update,resolve,awaken,advance,afterHit,controlled,phaseAt,ultimatePose,ULTIMATE_PHASES,makePlatform};
if(typeof module!=='undefined')module.exports=root.RiftMananRules;
})(typeof window!=='undefined'?window:globalThis);
