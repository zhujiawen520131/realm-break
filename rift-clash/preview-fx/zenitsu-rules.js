(function(root){'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// BV1dU4y1F7bM: the original inputs are mapped to this game's keyboard.
function variant(keys){return keys.variant|| (keys.down?'airspin':keys.up?'flash':'extreme');}
function basic(f,a,keys,ground){if(!ground){if(a?.name==='air2')return null;return a?.name==='air'?'air2':'air';}if(keys.up)return 'launcher';if(keys.down)return 'downstrike';if(a?.name==='slash4')return f.awakenLevel?'slash5':null;if(['slash5','launcher','downstrike'].includes(a?.name))return null;return ({slash1:'slash2',slash2:'slash3',slash3:'slash4'}[a?.name])||'slash1';}
function move(f,name,id){if(name==='ultimate')return null;
 const base={kit:true,zenitsuKit:true,style:null,startup:6,active:10,end:29,damage:5,reach:120,height:155,stun:30,stop:4,push:1.5,lift:0,hits:2,interval:5,travel:0,knockdown:false};
 if(/^slash[1-4]$/.test(name)){const n=Number(name.at(-1));return {...base,hits:n===1?1:2,active:n===1?6:10,damage:n===1?7:n===4?6:5,reach:105+n*12,clipId:n===4?'attack4':null,knockdown:n===4&&!f.awakenLevel,lift:n===4&&!f.awakenLevel?-7:0,push:n===4&&!f.awakenLevel?9:1.5};}
 if(name==='awaken')return {...base,startup:20,active:0,end:34,damage:0,reach:0,hits:0};
 if(name==='slash5')return {...base,clipId:'attack4',startup:7,active:25,interval:5,end:42,hits:5,damage:3,reach:175,knockdown:true,lift:-7,push:8};
 if(name==='launcher')return {...base,hits:3,active:15,end:35,height:230,lift:-6};
 if(name==='downstrike')return {...base,clipId:'airheavy',hits:4,interval:4,startup:8,active:16,end:36,height:235,knockdown:true,lift:12};
 if(name==='air'||name==='air2')return {...base,startup:5,active:name==='air'?5:10,end:26,hits:name==='air'?1:2,height:180,lift:-3};
 if(name==='heavy')return {...base,clipId:'heavy',startup:23,active:12,interval:6,end:46,damage:10,reach:175,travel:3,lift:-4};
 if(name==='airheavy')return {...base,clipId:'airheavy',startup:8,active:20,interval:5,end:43,hits:4,damage:5,height:245,lift:0,knockdown:true};
 if(name==='throw')return {...base,clipId:'throw',startup:8,active:40,interval:4,end:57,hits:10,damage:2,reach:68,height:150,throw:true,unblockable:true,knockdown:true};
 if(name!=='skill')return null;const key=['flash','airspin'].includes(id)?id:'extreme';const b={kit:true,zenitsuKit:true,variant:key,style:null,stun:30,stop:5,damage:18,reach:110,height:160,push:6,lift:-7,hits:1,interval:8,travel:0,knockdown:true};
 if(key==='airspin')return {...b,displayName:'雷之呼吸 · 空转',startup:8,active:18,end:48,hits:3,interval:6,damage:7,reach:150,height:235,push:1.5,lift:-6};
 return {...b,displayName:key==='extreme'?'壹之型 · 霹雳一闪 · 极':'壹之型 · 霹雳一闪',startup:key==='extreme'?16:7,active:key==='extreme'?10:7,end:key==='extreme'?40:29,damage:key==='extreme'?23:16,travel:key==='extreme'?34:29,reach:key==='extreme'?130:112};
}
function begin(world,f){const a=f.attack;if(!a.move.zenitsuKit)return;a.variant=a.move.variant;a.clipId=a.move.clipId;if(a.name==='downstrike'&&world.supportAt(f))f.vy=-8;a.departX=f.x;a.departY=f.y;a.airStart=!world.supportAt(f);world.lastFeedback=a.move.displayName;}
function awaken(world,f){if(f.awakenLevel||f.energy<50)return false;f.energy-=50;f.awakenLevel=1;f.awakenTime=900;world.begin(f,'awaken');f.inv=16;world.lastFeedback='善逸觉醒 / 15 秒 · 第五段连斩解锁';return true;}
function update(world,f){if(f.awakenTime>0&&--f.awakenTime===0)f.awakenLevel=0;const a=f.attack,m=a?.move;if(!m?.zenitsuKit)return;
 if(a.name==='airheavy'&&a.t===m.startup)f.vy=Math.max(13,f.vy);
 if(a.variant==='airspin') {if(a.t===4){f.vy=-13.2;world.refreshSupport(f);}if(a.t>=5&&a.t<=24)f.vx=f.dir*1.8;}
 else if(a.name==='skill'&&a.t>=m.startup&&a.t<m.startup+m.active){f.vx=f.dir*m.travel;if(a.airStart)f.vy=0;}else if(m.travel&&a.t>=m.startup&&a.t<m.startup+m.active)f.vx=f.dir*m.travel;
 if(a.name==='skill'&&a.t===m.startup){a.arc={kind:'zenitsuKitFx',clipId:a.variant,owner:f,attack:a,fromX:f.x,fromY:f.y-65,x:f.x,y:f.y-65,dir:f.dir,life:a.variant==='airspin'?28:m.active+14,max:a.variant==='airspin'?28:m.active+14};world.effects.push(a.arc);world.event('swing',{x:f.x,y:f.y-70,color:f.color,hero:f.hero,weapon:f.info.weapon,move:'skill'});}
}
function advance(world){for(const e of world.effects)if(e.kind==='zenitsuKitFx'&&e.owner.attack===e.attack){e.x=e.owner.x;e.y=e.owner.y-65;e.age=(e.age||0)+1;}}
function resolve(world,f,t,a){const m=a.move;if(!m.zenitsuKit)return false;if(a.capture){if(t.inv||t!==a.capture){a.t=m.startup+m.active;return true;}t.x=clamp(f.x+f.dir*46,42,world.width-42);t.y=f.y;t.vx=t.vy=0;}const slot=Math.floor((a.t-m.startup)/m.interval);if(slot>=m.hits||a.kitSlots?.has(slot)||t.inv||t.downTime||t.hp<=0)return true;
 if(m.throw&&(!world.supportAt(f)||!world.supportAt(t)))return true;const dx=(t.x-f.x)*f.dir;if(dx< -25||dx>m.reach+24||Math.abs(t.y-f.y)>m.height)return true;
 if(m.throw)a.capture=t;a.kitSlots??=new Set();a.kitSlots.add(slot);const last=slot===m.hits-1;
 if(a.name!=='skill'){world.effects.push({kind:'fxBasic',hero:'zenitsu',owner:f,x:f.x+f.dir*48,y:f.y-88,dir:f.dir,color:f.color,life:10,max:10});world.event('swing',{x:f.x,y:f.y-75,hero:f.hero,weapon:f.info.weapon,color:f.color,move:a.name});}
 world.hit(f,t,{...m,knockdown:last&&m.knockdown,lift:a.variant==='airspin'||a.name==='launcher'?(last?-14:-6):m.throw?0:a.name==='slash5'&&!last?0:m.lift,push:a.variant==='airspin'?(last?5:1.5):m.throw?(last?5:0):a.name==='slash5'&&!last?1.5:m.push,finisher:last},a.name,t.x,{dir:f.dir});a.hit=true;return true;
}
root.RiftZenitsuRules={variant,basic,move,begin,update,advance,resolve,awaken};
})(typeof window!=='undefined'?window:globalThis);
