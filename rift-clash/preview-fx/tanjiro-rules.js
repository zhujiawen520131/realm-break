(function(root){'use strict';
// The repertoire and hit counts follow BV1oq4y1d7PP. Timings, costs and
// damage below are this 2D game's tuning, not extracted original frame data.
const CATALOG=[['waterwheel','贰之型 · 水车','U / 连续 U','3 段纵向翻滚水斩'],['waterfall','捌之型 · 瀧壺','W + U','5 段竖直下劈水柱'],['whirlpool','陆之型 · 扭转漩涡','S + U','5 段近身旋转水涡']];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function enabled(f){return f?.hero==='tanjiro';}
function variant(keys,a,f){if(root.RiftTanjiroFireRules?.active(f))return root.RiftTanjiroFireRules.variant(keys,a);if(keys.variant)return ({skill1:'waterwheel',skill2:'waterfall',skill3:'whirlpool'}[keys.variant]||keys.variant);if(keys.up)return 'waterfall';if(keys.down)return 'whirlpool';return a?.name==='skill'&&a.hit?({waterwheel:'waterfall',waterfall:'whirlpool',whirlpool:'waterwheel'}[a.variant]||'waterwheel'):'waterwheel';}
function basic(f,a,keys,ground){
 if(root.RiftTanjiroFireRules?.active(f))return root.RiftTanjiroFireRules.basic(f,a,keys,ground);
 if(!ground)return 'air';if(keys.up)return 'launcher';if(keys.down)return 'downstrike';
 if(a?.name==='slash4')return f.awakenLevel?'slash5':null;if(a?.name==='slash5'||a?.name==='downstrike'||a?.name==='launcher')return null;
 return ({slash1:'slash2',slash2:'slash3',slash3:'slash4'}[a?.name])||'slash1';
}
function move(f,name,id){
 if(root.RiftTanjiroFireRules?.active(f))return root.RiftTanjiroFireRules.move(f,name,id);
 const base={kit:true,style:null,stun:30,push:2,lift:-7,stop:3,damage:5,height:140,reach:150,startup:8,active:12,end:32,travel:0,hits:1,interval:4,knockdown:false};let m;
 if(name==='slash3')return {knockdown:false};
 if(name==='slash4')m={...base,clipId:'attack4',damage:12,startup:7,active:7,end:27,reach:150,lift:-9,knockdown:!f.awakenLevel};
 if(name==='slash5')m={...base,clipId:'attack5',damage:16,startup:8,active:8,end:33,reach:200,push:12,lift:-10,knockdown:true,fxClip:'surge'};
 if(name==='downstrike')m={...base,clipId:'waterfall',damage:13,startup:8,active:8,end:32,reach:160,height:220,push:5,lift:12,knockdown:true,fxClip:'waterfall'};
 if(name==='heavy')m={...base,clipId:'heavy',startup:28,active:16,end:55,hits:4,interval:4,damage:5,reach:175,lift:0,fxClip:'whirlpool'};
 if(name==='airheavy')m={...base,clipId:'airheavy',startup:7,active:12,end:30,damage:11,reach:120,height:170,lift:0,travel:8,knockdown:false};
 if(name==='air')m={...base,clipId:null,startup:4,active:10,end:25,hits:2,interval:5,damage:5,reach:130,lift:-5};
 if(name==='dashstrike')m={...base,clipId:null,startup:1,active:12,end:19,damage:3,reach:70,height:110,travel:17,lift:0};
 if(name==='throw')m={...base,clipId:'throw',startup:8,active:19,end:38,hits:3,interval:8,damage:5,reach:65,height:125,lift:0,unblockable:true,throw:true};
 if(name==='awaken')m={...base,clipId:'awaken',startup:20,active:0,end:34,reach:0,damage:0};
 if(name==='skill'){
  if(id==='waterfall')m={...base,clipId:'waterfall',fxClip:'waterfall',startup:12,active:20,end:41,hits:5,interval:4,damage:4,reach:195,height:260,lift:0,knockdown:true};
  else if(id==='whirlpool')m={...base,clipId:'whirlpool',fxClip:'whirlpool',startup:8,active:20,end:37,hits:5,interval:4,damage:4,reach:170,lift:0,knockdown:true,radial:true};
  else m={...base,clipId:null,fxClip:null,startup:9,active:18,end:48,hits:3,interval:6,damage:6,reach:170,height:180,lift:-7,knockdown:true,travel:3.5};
 }
 if(name==='ultimate')m={...base,clipId:null,startup:18,active:8,end:42,damage:2,reach:215,height:190,lift:0,kitUltimate:true};
 if(m&&f.awakenLevel&&name!=='awaken')m.damage=Math.round(m.damage*(f.awakenLevel===2?1.2:1.1)*10)/10;
 return m||null;
}
function begin(world,f,name,id){
 if(f.attack?.move.fire){root.RiftTanjiroFireRules.begin(world,f,name,id);return;}
 const a=f.attack;if(!a?.move.kit)return;a.variant=id||null;a.clipId=a.move.clipId;
 if(name==='skill'&&id==='waterfall'&&world.supportAt(f)){f.vy=-13.4;world.refreshSupport(f);}
 if(name==='dashstrike')f.inv=5;
 if(name==='awaken')effect(world,f,f.awakenLevel===2?'surge':'awaken',34);
}
function bodyPose(a){if(a?.name==='skill'&&a.variant==='waterwheel'&&!a.move.fire)return {...a,bodyFrame:Math.min(7,[0,3,8,14,21,28,36,43].filter(t=>a.t>=t).length-1)};return a;}
function effect(world,f,id,life=24){world.effects.push({kind:'tanjiroFx',clipId:id,hero:'tanjiro',owner:f,x:f.x+f.dir*35,y:f.y-85,dir:f.dir,life,max:life});}
function update(world,f){
 if(!enabled(f))return;
 if(f.awakenTime>0&&--f.awakenTime===0)f.awakenLevel=0;
 f.color=root.RiftTanjiroFireRules&&(root.RiftTanjiroFireRules.active(f)||f.attack?.move.fire)?'#ff773d':f.info.color;
 const a=f.attack;if(a?.move.fire){root.RiftTanjiroFireRules.update(world,f);return;}if(!a?.move.kit)return;const m=a.move,active=a.t>=m.startup&&a.t<m.startup+m.active;
 if(a.name==='skill'&&a.variant==='waterwheel'&&a.t===3){f.vy=-13.2;world.refreshSupport(f);}
 if(m.kitUltimate&&a.t<m.startup)f.vx=f.dir*7;
 else if(active&&m.travel)f.vx=f.dir*m.travel;
 if(a.name==='airheavy'&&active)f.vy=Math.max(f.vy,10);
 if(a.name==='skill'&&a.variant==='waterfall'&&active&&a.t===m.startup)f.vy=9;
}
function canContact(world,f,t,a){const m=a.move;if(t.inv||t.downTime||t.hp<=0)return false;
 if(m.throw&&(!world.supportAt(f)||!world.supportAt(t)||Math.abs(f.y-t.y)>20))return false;
 const dx=(t.x-f.x)*f.dir;
 return (m.radial?Math.abs(dx)<=m.reach+23:dx>=-20&&dx<=m.reach+23)&&Math.abs((t.y-65)-(f.y-65))<(m.height||140);
}
function resolve(world,f,t,a){
 if(a.move.fire)return root.RiftTanjiroFireRules.resolve(world,f,t,a);
 const m=a.move;if(!m.kit)return false;if(a.waterSequence)return resolveSequence(world,f,t,a);
 if(a.name==='throw'&&a.capture){if(t.inv||f.stun||a.capture!==t){a.t=m.startup+m.active;return true;}t.x=clamp(f.x+f.dir*48,42,world.width-42);t.y=f.y;t.vx=t.vy=0;}
 const total=m.hits||1,slot=total===1?0:Math.floor((a.t-m.startup)/(m.interval||m.active));
 if(slot>=total||a.kitSlots?.has(slot))return true;
 if(!a.kitFx){a.kitFx=true;if(m.fxClip)effect(world,f,m.fxClip,m.active+14);else if(a.name==='skill')world.effects.push({kind:'waterWheel',hero:f.hero,owner:f,x:f.x,y:f.y-80,dir:f.dir,color:f.color,range:170,follow:a,life:m.active+16,max:m.active+16});}
 if(!canContact(world,f,t,a))return true;
 a.kitSlots??=new Set();a.kitSlots.add(slot);const last=slot===total-1,blocked=!m.unblockable&&t.block&&t.dir===-f.dir;
 const hit={...m,knockdown:m.kitUltimate?false:(last&&(m.knockdown||a.name==='throw')),finisher:m.kitUltimate?false:last,lift:last&&a.name==='skill'?-10:last&&a.name==='throw'?-9:last&&a.name==='heavy'?-3:m.lift,push:last&&a.name==='throw'?12:m.push};
 if(a.name==='throw'&&!blocked){a.capture=t;hit.stun=32;}
 world.hit(f,t,hit,a.name==='ultimate'?'ultimate':a.name==='skill'?'skill':a.name,t.x,{dir:m.radial?(t.x>=f.x?1:-1):f.dir});a.hit=true;
 return true;
}
function awaken(world,f){
 if(f.awakenLevel>=2||f.energy<50)return false;f.energy-=50;f.awakenLevel=(f.awakenLevel||0)+1;f.awakenTime=f.awakenLevel===2?600:900;if(f.awakenLevel===2&&root.RiftTanjiroFireRules){world.effects=world.effects.filter(e=>!(e.owner===f&&['tanjiroFx','waterWheel','waterDragon','waterDragonRide','breathSlash','fxBasic'].includes(e.kind)));f.trail=[];}world.begin(f,'awaken');f.inv=16;
 world.lastFeedback=f.awakenLevel===2?'全觉醒 / 技能免气力 · 普攻第五段解锁':'觉醒 / 普攻第五段解锁 · 再按 H 全觉醒';
 if(f.awakenLevel===2&&root.RiftTanjiroFireRules)world.lastFeedback='火之神神乐 / 10 秒限时强化 · 全招式切换';
 if(f.awakenLevel===2&&!root.RiftTanjiroFireRules&&world.settings.cinematics)world.tanjiroCinematic={id:++world.cinematicSerial,kind:'awakening',actor:f};return true;
}
// Real arena choreography: one opening contact followed by twenty timed contacts.
// The captured opponent stays interruptible through directional substitution.
const ULTIMATE_PHASES=[
 {name:'流水连斩',clipId:'attack4',duration:24,hits:[6,12,18,22],fx:'basic'},
 {name:'转体水涡',clipId:'whirlpool',duration:28,hits:[6,12,18,24],fx:'whirlpool'},
 {name:'回旋水车',baseClip:'skill',duration:28,hits:[6,12,18,24],fx:'waterWheel'},
 {name:'瀧壺下劈',clipId:'waterfall',duration:28,hits:[6,12,18,24],fx:'waterfall'},
 {name:'水龙卷升',baseClip:'ultimate',duration:44,hits:[12,24,36],fx:'waterDragonRide'},
 {name:'水龙横贯 · 终结',baseClip:'ultimate',duration:30,hits:[16],fx:'waterDragonRide'}
];
const ULTIMATE_TICKS=ULTIMATE_PHASES.reduce((n,p)=>n+p.duration,0);
function phaseAt(a){
 const s=a?.waterSequence;if(!s)return null;
 let tick=Math.max(0,a.t-s.startT),start=0;
 for(let i=0;i<ULTIMATE_PHASES.length;i++){const p=ULTIMATE_PHASES[i];if(tick<p.duration||i===ULTIMATE_PHASES.length-1)return {...p,index:i,t:Math.min(tick,p.duration-1),start};tick-=p.duration;start+=p.duration;}
}
function ultimatePose(a){
 const p=phaseAt(a);if(!p)return a;
 return {...a,name:p.baseClip||'ultimate',clipId:p.clipId||null,bodyFrame:p.index===2?Math.min(7,Math.floor(p.t/p.duration*8)):undefined,t:p.t,move:{startup:p.hits[0],active:p.hits.at(-1)-p.hits[0]+1,end:p.duration},waterSequence:null};
}
function liveSequence(f){const a=f?.attack,s=a?.waterSequence;return s&&!s.finished&&!f.stun&&f.hp>0&&s.target.hp>0&&!s.target.inv?s:null;}
function controlled(world,f){if(root.RiftTanjiroFireRules?.controlled(world,f))return true;return [world.p1,world.p2].some(actor=>{const s=liveSequence(actor);return !!s&&(actor===f||s.target===f);});}
function stopSequence(world,f,a){
 if(!a.waterSequence||a.waterSequence.finished)return;
 if(a.waterSequence.dragon)a.waterSequence.dragon.life=0;
 a.waterSequence.finished=true;a.t=a.move.startup+a.move.active;a.move.end=a.t+12;f.vx=f.vy=0;
 world.lastFeedback='水龙连式中断 / 可用 I 定向替身脱离';
}
function advance(world){
 root.RiftTanjiroFireRules?.advance(world);
 for(const e of world.effects)if(e.kind==='waterWheel'&&e.owner?.attack===e.follow){e.x=e.owner.x;e.y=e.owner.y-80;}
 for(const f of [world.p1,world.p2]){
  const a=f.attack,s=a?.waterSequence;if(!s||s.finished)continue;
  if(!liveSequence(f)||s.target!==(f===world.p1?world.p2:world.p1)){stopSequence(world,f,a);continue;}
  const t=s.target,p=phaseAt(a),age=Math.max(0,a.t-s.startT),progress=clamp(age/ULTIMATE_TICKS,0,1),q=p.t/p.duration;
  const lift=p.index===1?Math.sin(q*Math.PI)*28:p.index===2?4*q*(1-q)*165:p.index===3?4*q*(1-q)*115:0;
  const rise=clamp(p.t/44,0,1),turn=clamp(p.t/16,0,1),ease=n=>n*n*(3-2*n);
  const enemyLift=p.index===4?320*ease(rise):p.index===5?320:lift*.85;
  const ram=p.index===5?160*ease(turn):0;
  const blend=clamp(age/16,0,1),desired=s.tx+s.dir*progress*125;
  const actorX=clamp(desired,126,world.width-126)-s.dir*78,targetX=clamp(desired+s.dir*ram,42,world.width-42);
  f.x=clamp(s.fx+(actorX-s.fx)*blend,42,world.width-42);t.x=clamp(s.tx+(targetX-s.tx)*blend,42,world.width-42);
  f.y=s.fy+(s.ty-s.fy)*blend-lift;t.y=s.ty-enemyLift;f.dir=s.dir;
  f.vx=f.vy=t.vx=t.vy=0;t.stun=Math.max(t.stun,18);t.block=false;world.refreshSupport(f);world.refreshSupport(t);
  if(p.index===4&&!s.dragon){
   s.dragon={kind:'waterDragonRide',arenaUltimate:true,owner:f,target:t,originY:s.ty,x:t.x,y:t.y-65,dir:s.dir,angle:-Math.PI/2,life:100,max:100};world.effects.push(s.dragon);
  }
  if(s.dragon){s.dragon.x=t.x;s.dragon.y=t.y-65;s.dragon.angle=p.index===4?-Math.PI/2:-(1-ease(turn))*Math.PI/2;}
  if(p.t===p.hits[0]){
   if(['waterfall','whirlpool'].includes(p.fx))effect(world,f,p.fx,p.duration+6);
   else if(p.fx!=='waterDragonRide')world.effects.push({kind:p.fx==='basic'?'fxBasic':p.fx,arenaUltimate:true,hero:f.hero,owner:f,x:f.x+s.dir*45,y:f.y-85,dir:s.dir,color:f.color,life:p.duration,max:p.duration});
   world.event('swing',{x:f.x,y:f.y-86,color:f.color,hero:f.hero,weapon:f.info.weapon,move:'ultimate'});
  }
  world.lastFeedback=p.name+' / '+f.combo+' HIT';
 }
}
function updateDragonEffects(world){
 for(const e of world.effects){if(e.kind!=='waterDragonRide'||e.life<=0)continue;e.age=(e.age||0)+1;
  const t=e.target;if(!t||t.inv||t.hp<=0){e.life=0;continue;}
  if(e.released){if(!t.knockdown){e.life=0;continue;}e.x=t.x;e.y=t.y-65;e.angle=Math.atan2(t.vy,Math.abs(t.vx)||1)*.4;}
  else if(e.owner.stun||e.owner.attack?.waterSequence?.dragon!==e||e.owner.attack.waterSequence.finished)e.life=0;
 }
}
function resolveSequence(world,f,t,a){
 const s=a.waterSequence;if(s.finished)return true;
 if(!liveSequence(f)){stopSequence(world,f,a);return true;}
 const p=phaseAt(a),contact=p.hits.indexOf(p.t),key=p.index+':'+contact;
 if(contact<0||s.struck.has(key))return true;s.struck.add(key);
 const last=p.index===ULTIMATE_PHASES.length-1,damage=3*s.boost;
 world.hit(f,t,{damage,stun:30,push:last?32:0,lift:last?-5:0,stop:last?8:2,knockdown:last,finisher:last,waterSequenceHit:true},'ultimate',t.x,{dir:s.dir,guarded:false,counter:false});
 return true;
}
function afterHit(world,f,t,m,contact){
 if(m.fire||m.fireSequenceHit){root.RiftTanjiroFireRules?.afterHit(world,f,t,m,contact);return;}
 if(contact.guarded||f.stun||!f.attack)return;
 if(m.waterSequenceHit){
  const s=f.attack.waterSequence;if(!s||s.finished)return;
  if(m.finisher||t.hp<=0){
   s.finished=true;f.vx=f.vy=0;
   if(s.dragon){s.dragon.released=!!m.finisher;s.dragon.life=26;s.dragon.max=26;s.dragon.angle=0;s.dragon.releaseX=t.x;s.dragon.releaseY=t.y-65;}
   if(m.finisher)world.event('dragonLaunch',{x:t.x,y:t.y-65,dir:s.dir,hero:f.hero});
   if(m.finisher&&world.settings.cinematics)world.cutin={hero:f.hero,name:f.info.name,move:'拾之型 · 生生流转',color:f.color,dir:s.dir,remaining:48,total:48,finisher:true};
   world.lastFeedback='生生流转 / '+f.combo+' 段终结';
  }
  return;
 }
 if(!m.kitUltimate||f.attack.waterSequence||t.hp<=0)return;
 const a=f.attack;a.waterSequence={target:t,startT:a.t,fx:f.x,fy:f.y,tx:t.x,ty:t.y,dir:f.dir,struck:new Set(),finished:false,boost:f.awakenLevel===2?1.2:f.awakenLevel?1.1:1};
 a.move={...a.move,active:ULTIMATE_TICKS+12,end:a.t+ULTIMATE_TICKS+18};f.vx=f.vy=t.vx=t.vy=0;
}
function finish(world){
 // Only H's full-awakening clip owns this state; O never uses a video or
 // queues invisible damage behind a playback callback.
 if(!world.tanjiroCinematic)return false;world.tanjiroCinematic=null;return true;
}
root.RiftTanjiroRules={CATALOG,enabled,variant,basic,move,begin,update,resolve,awaken,afterHit,finish,advance,controlled,ultimatePose,bodyPose,updateDragonEffects,ULTIMATE_PHASES};if(typeof module!=='undefined')module.exports=root.RiftTanjiroRules;
})(typeof window!=='undefined'?window:globalThis);
