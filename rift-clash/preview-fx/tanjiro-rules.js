(function(root){'use strict';
// The repertoire and hit counts follow BV1oq4y1d7PP. Timings, costs and
// damage below are this 2D game's tuning, not extracted original frame data.
const CATALOG=[['waterwheel','贰之型 · 水车','U / 连续 U','3 段纵向翻滚水斩'],['waterfall','捌之型 · 瀧壺','W + U','5 段竖直下劈水柱'],['whirlpool','陆之型 · 扭转漩涡','S + U','5 段近身旋转水涡']];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function enabled(f){return f?.hero==='tanjiro';}
function variant(keys,a){if(keys.variant)return keys.variant;if(keys.up)return 'waterfall';if(keys.down)return 'whirlpool';return a?.name==='skill'&&a.hit?({waterwheel:'waterfall',waterfall:'whirlpool',whirlpool:'waterwheel'}[a.variant]||'waterwheel'):'waterwheel';}
function basic(f,a,keys,ground){
 if(!ground)return 'air';if(keys.up)return 'launcher';if(keys.down)return 'downstrike';
 if(a?.name==='slash4')return f.awakenLevel?'slash5':null;if(a?.name==='slash5'||a?.name==='downstrike'||a?.name==='launcher')return null;
 return ({slash1:'slash2',slash2:'slash3',slash3:'slash4'}[a?.name])||'slash1';
}
function move(f,name,id){
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
  else m={...base,clipId:null,fxClip:null,startup:9,active:18,end:36,hits:3,interval:6,damage:6,reach:170,height:180,lift:-7,knockdown:true,travel:3.5};
 }
 if(name==='ultimate')m={...base,clipId:null,startup:18,active:8,end:42,damage:2,reach:215,height:190,lift:0,kitUltimate:true};
 if(m&&f.awakenLevel&&name!=='awaken')m.damage=Math.round(m.damage*(f.awakenLevel===2?1.2:1.1)*10)/10;
 return m||null;
}
function begin(world,f,name,id){
 const a=f.attack;if(!a?.move.kit)return;a.variant=id||null;a.clipId=a.move.clipId;
 if(name==='skill'&&id==='waterfall'){f.vy=-8;world.refreshSupport(f);}
 if(name==='dashstrike')f.inv=5;
 if(name==='awaken')effect(world,f,f.awakenLevel===2?'surge':'awaken',34);
}
function effect(world,f,id,life=24){world.effects.push({kind:'tanjiroFx',clipId:id,hero:'tanjiro',owner:f,x:f.x+f.dir*35,y:f.y-85,dir:f.dir,life,max:life});}
function update(world,f){
 if(!enabled(f))return;
 if(f.awakenTime>0&&--f.awakenTime===0)f.awakenLevel=0;
 const a=f.attack;if(!a?.move.kit)return;const m=a.move,active=a.t>=m.startup&&a.t<m.startup+m.active;
 if(m.kitUltimate&&a.t<m.startup)f.vx=f.dir*7;
 else if(active&&m.travel)f.vx=f.dir*m.travel;
 if(a.name==='airheavy'&&active)f.vy=Math.max(f.vy,10);
 if(a.name==='skill'&&a.variant==='waterfall'&&active&&a.t===m.startup)f.vy=7;
}
function canContact(world,f,t,a){const m=a.move;if(t.inv||t.downTime||t.hp<=0)return false;
 if(m.throw&&(!world.supportAt(f)||!world.supportAt(t)||Math.abs(f.y-t.y)>20))return false;
 const dx=(t.x-f.x)*f.dir;
 return (m.radial?Math.abs(dx)<=m.reach+23:dx>=-20&&dx<=m.reach+23)&&Math.abs((t.y-65)-(f.y-65))<(m.height||140);
}
function resolve(world,f,t,a){
 const m=a.move;if(!m.kit)return false;
 if(a.name==='throw'&&a.capture){if(t.inv||f.stun||a.capture!==t){a.t=m.startup+m.active;return true;}t.x=clamp(f.x+f.dir*48,42,world.width-42);t.y=f.y;t.vx=t.vy=0;}
 const total=m.hits||1,slot=total===1?0:Math.floor((a.t-m.startup)/(m.interval||m.active));
 if(slot>=total||a.kitSlots?.has(slot))return true;
 if(!a.kitFx){a.kitFx=true;if(m.fxClip)effect(world,f,m.fxClip,m.active+14);else if(a.name==='skill')world.effects.push({kind:'waterWheel',hero:f.hero,owner:f,x:f.x,y:f.y-80,dir:f.dir,color:f.color,range:170,life:m.active+10,max:m.active+10});}
 if(!canContact(world,f,t,a))return true;
 a.kitSlots??=new Set();a.kitSlots.add(slot);const last=slot===total-1,blocked=!m.unblockable&&t.block&&t.dir===-f.dir;
 const hit={...m,knockdown:m.kitUltimate?false:(last&&(m.knockdown||a.name==='throw')),finisher:last,lift:last&&a.name==='skill'?-10:last&&a.name==='throw'?-9:last&&a.name==='heavy'?-3:m.lift,push:last&&a.name==='throw'?12:m.push};
 if(a.name==='throw'&&!blocked){a.capture=t;hit.stun=32;}
 world.hit(f,t,hit,a.name==='ultimate'?'ultimate':a.name==='skill'?'skill':a.name,t.x,{dir:m.radial?(t.x>=f.x?1:-1):f.dir});a.hit=true;
 return true;
}
function awaken(world,f){
 if(f.awakenLevel>=2||f.energy<50)return false;f.energy-=50;f.awakenLevel=(f.awakenLevel||0)+1;f.awakenTime=f.awakenLevel===2?600:900;world.begin(f,'awaken');f.inv=16;
 world.lastFeedback=f.awakenLevel===2?'全觉醒 / 技能免气力 · 普攻第五段解锁':'觉醒 / 普攻第五段解锁 · 再按 H 全觉醒';
 if(f.awakenLevel===2&&world.settings.cinematics)world.tanjiroCinematic={id:++world.cinematicSerial,kind:'awakening',actor:f};return true;
}
function afterHit(world,f,t,m,contact){
 if(!m.kitUltimate||contact.guarded||f.stun||!f.attack||f.attack.cinematicStarted)return;
 f.attack.cinematicStarted=true;const state={id:++world.cinematicSerial,kind:'ultimate',actor:f,target:t,attack:f.attack};world.tanjiroCinematic=state;t.vx=t.vy=0;f.vx=f.vy=0;
 if(!world.settings.cinematics)finish(world);
}
function finish(world){
 const c=world.tanjiroCinematic;if(!c)return false;world.tanjiroCinematic=null;
 if(c.kind==='ultimate'&&c.actor.attack===c.attack){
  const f=c.actor,t=c.target;for(let i=0;i<20;i++)world.applyHit(f,t,{damage:3*(f.awakenLevel===2?1.2:f.awakenLevel?1.1:1),stun:28,push:i===19?13:0,lift:i===19?-10:0,stop:0,knockdown:i===19,finisher:i===19},'ultimate',t.x,{dir:f.dir,guarded:false,counter:false});
  f.attack.t=f.attack.move.startup+f.attack.move.active;f.vx=f.vy=0;
  world.effects.push({kind:'waterDragon',hero:f.hero,owner:f,x:t.x,y:t.y-90,dir:f.dir,color:f.color,range:220,index:3,life:28,max:28});world.freeze=world.settings.hitstop?6:0;
  world.lastFeedback='拾之型 · 生生流转 / 21 段终结';
 }
 return true;
}
root.RiftTanjiroRules={CATALOG,enabled,variant,basic,move,begin,update,resolve,awaken,afterHit,finish};if(typeof module!=='undefined')module.exports=root.RiftTanjiroRules;
})(typeof window!=='undefined'?window:globalThis);
