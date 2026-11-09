(function(root){
'use strict';
// Original 2D repertoire adaptations, not a claim of canonical source-game inputs.
const CATALOG={
 cloud:{modes:['极限蓄势','极限解放'],skills:[{id:'skill1',name:'破晄剑气',hint:'U · 向操控方向发射剑气'},{id:'skill2',name:'升龙斩',hint:'W + U · 跃起上挑连斩'},{id:'skill3',name:'回旋斩',hint:'S + U · 近身回旋斩击'}]},
 lara:{modes:['猎手专注','生存本能'],skills:[{id:'skill1',name:'蓄力箭',hint:'U · 向前射出实体箭矢'},{id:'skill2',name:'跃起双枪',hint:'W + U · 中距斜下跃射，追击浮空目标'},{id:'skill3',name:'翻滚扫射',hint:'S + U · 向操控方向翻滚射击'}]},
 wukong:{modes:['凝聚神力','神力化身'],skills:[{id:'skill1',name:'定身符',hint:'U · 发出符印，命中后定身'},{id:'skill2',name:'挑棍',hint:'W + U · 跃起挑棍连击'},{id:'skill3',name:'旋棍',hint:'S + U · 近身旋棍扫击'}]},
 drake:{modes:['战术专注','绝境反击'],skills:[{id:'skill1',name:'手雷',hint:'U · 向前抛出实体手雷'},{id:'skill2',name:'跃身重拳',hint:'W + U · 跃起重拳连击'},{id:'skill3',name:'步枪点射',hint:'S + U · 向操控方向连续点射'}]}
};
function applies(f){return !!CATALOG[f?.hero];}
function cost(f,name='skill'){return name==='skill'?(f.awakenLevel===2?0:25):name==='awaken'?50:0;}
function variant(keys={},a){if(['skill1','skill2','skill3'].includes(keys.variant))return keys.variant;if(keys.up)return 'skill2';if(keys.down)return 'skill3';return a?.name==='skill'&&a.hit?({skill1:'skill2',skill2:'skill3',skill3:'skill1'}[a.variant]||'skill1'):'skill1';}
function basic(f,a,keys,ground){
 if(!ground)return 'air';if(keys.up||keys.down)return 'launcher';
 if(['slash3','launcher'].includes(a?.name))return null;
 return ({slash1:'slash2',slash2:'slash3'}[a?.name])||'slash1';
}
function move(f,name,id){
 if(!applies(f)||!['skill','heavy','airheavy','throw','awaken'].includes(name))return null;
 const mode=f.awakenLevel||0,full=mode===2,boost=mode===1?1.1:full?1.2:1;
 let m={kit:true,rosterKit:true,rosterMode:mode,style:null,variant:null,cost:cost(f,name),clipId:null,fxClip:'basic',startup:8,active:10,end:34,damage:6,reach:150,height:170,stun:32,stop:4,push:1.5,lift:0,hits:2,interval:5,travel:0,knockdown:false};
 if(name==='awaken')return {...m,clipId:'awaken',fxClip:'awaken',startup:20,active:0,end:34,damage:0,reach:0,hits:0};
 if(name==='throw')m={...m,clipId:'attack2',fxClip:'basic',displayName:({cloud:'近身连斩',lara:'近身速射',wukong:'近身棍连',drake:'肘击连打'})[f.hero],startup:8,hits:full?4:3,interval:6,reach:({cloud:105,lara:0,wukong:140,drake:85})[f.hero],height:150,knockdown:true,finalLift:-7,finalPush:10};
 else if(name==='heavy'||name==='airheavy')m={...m,clipId:'attack3',fxClip:'basic',startup:name==='airheavy'?7:f.hero==='cloud'?22:19,hits:full?3:2,interval:5,damage:8,reach:({cloud:185,lara:105,wukong:215,drake:110})[f.hero]*(full?1.2:1),height:name==='airheavy'?235:180,knockdown:true,finalLift:-6,finalPush:10};
 else{
  const key=['skill2','skill3'].includes(id)?id:'skill1';m={...m,variant:key,clipId:key==='skill1'?'skill':key,fxClip:key,displayName:CATALOG[f.hero].skills.find(s=>s.id===key).name,knockdown:true,finalLift:-8,finalPush:8};
  if(f.hero==='cloud'){
   if(key==='skill1')m={...m,startup:12,hits:full?3:1,interval:6,damage:full?7:17,reach:0,projectile:'wave',speed:full?17:14,range:full?760:540,projectileWidth:full?100:65,projectileHeight:full?130:95};
   if(key==='skill2')m={...m,startup:10,hits:full?4:2,interval:5,damage:7,reach:full?235:185,height:285,jump:-12.8,finalLift:-13};
   if(key==='skill3')m={...m,startup:9,hits:full?5:3,interval:5,damage:5,reach:full?245:190,height:195,radial:true};
  }else if(f.hero==='lara'){
   if(key==='skill1')m={...m,startup:12,hits:full?3:1,interval:6,damage:full?7:18,reach:0,projectile:'arrow',speed:24,range:full?850:620,projectileWidth:70,projectileHeight:18};
   if(key==='skill2')m={...m,startup:12,hits:full?4:2,interval:5,damage:7,reach:0,projectile:'bullet',speed:24,range:full?600:460,projectileWidth:28,projectileHeight:18,jump:-10.8,shotY:10,muzzleHeight:65,finalLift:-5};
   if(key==='skill3')m={...m,startup:8,hits:full?6:4,interval:4,damage:5,reach:0,projectile:'bullet',speed:24,range:full?750:540,projectileWidth:28,projectileHeight:16,travel:5,muzzleHeight:65,finalLift:-5};
  }else if(f.hero==='wukong'){
   if(key==='skill1')m={...m,startup:11,hits:1,damage:5,reach:0,projectile:'wave',speed:15,range:full?550:350,projectileWidth:full?70:40,projectileHeight:full?95:60,stun:full?100:75,knockdown:false,push:0,finalPush:0,finalLift:0};
   if(key==='skill2')m={...m,startup:9,hits:full?4:2,interval:5,damage:7,reach:full?280:215,height:300,jump:-12.8,finalLift:-13};
   if(key==='skill3')m={...m,startup:8,hits:full?6:3,interval:4,damage:5,reach:full?290:220,height:210,radial:true};
  }else{
   if(key==='skill1')m={...m,startup:12,hits:full?2:1,interval:8,damage:full?13:22,reach:0,projectile:'grenade',speed:7.2,range:620,projectileWidth:18,projectileHeight:18,shotY:-7.8,gravity:.42,finalLift:-8};
   if(key==='skill2')m={...m,startup:9,hits:full?4:2,interval:5,damage:8,reach:full?175:135,height:280,jump:-12.8,finalLift:-13};
   if(key==='skill3')m={...m,startup:9,hits:full?5:3,interval:5,damage:7,reach:0,projectile:'bullet',speed:25,range:full?850:620,projectileWidth:30,projectileHeight:16,muzzleHeight:90,finalLift:-5};
  }
 }
 if(f.hero==='lara'&&['throw','heavy','airheavy'].includes(name)){m={...m,projectile:'bullet',reach:0,speed:24,range:name==='throw'?(full?210:180):(full?420:340),projectileWidth:28,projectileHeight:16,muzzleHeight:name==='airheavy'?65:110,shotY:name==='airheavy'?14:0,finalLift:-5};}
 m.damage=Math.round(m.damage*boost*10)/10;m.active=m.hits===1?6:(m.hits-1)*m.interval+1;m.end=m.startup+m.active+(m.jump?24:16);return m;
}
function effect(world,f,a,clipId,life=20){world.effects.push({kind:'rosterFx',hero:f.hero,clipId,mode:a.move.rosterMode,owner:f,attack:a,x:f.x+f.dir*42,y:f.y-80,dir:f.dir,life,max:life,reach:a.move.reach});}
function begin(world,f){const a=f.attack;if(!a?.move.rosterKit)return;a.variant=a.move.variant;a.clipId=a.move.clipId;a.direction=f.dir;if(a.name==='awaken')effect(world,f,a,'awaken',34);if(a.move.displayName)world.lastFeedback=f.info.name+' / '+a.move.displayName;}
function update(world,f){
 if(!applies(f))return;if(f.awakenTime>0&&--f.awakenTime===0)f.awakenLevel=0;
 const a=f.attack,m=a?.move;if(!m?.rosterKit)return;f.dir=a.direction;
 if(m.jump&&a.t===3&&world.supportAt(f)){f.vy=m.jump;world.refreshSupport(f);}
 if(a.name==='airheavy'&&!m.projectile&&a.t===m.startup)f.vy=Math.max(10,f.vy);
 if(m.travel&&a.t>=m.startup&&a.t<m.startup+m.active)f.vx=f.dir*m.travel;
}
function advance(world){for(const e of world.effects){if(e.kind!=='rosterFx'||e.clipId==='awaken')continue;if(e.owner.attack===e.attack){e.x=e.owner.x+e.dir*42;e.y=e.owner.y-80;}else e.life=Math.min(e.life,5);}}
function contact(world,f,t,m){if(t.inv||t.downTime||t.hp<=0)return false;const dx=(t.x-f.x)*f.dir;return (m.radial?Math.abs(dx)<=m.reach+23:dx>=-20&&dx<=m.reach+23)&&Math.abs(t.y-f.y)<m.height;}
function hitMove(m,last){return {...m,projectile:null,knockdown:last&&m.knockdown,finisher:last,push:last?(m.finalPush??m.push):m.push,lift:last?(m.finalLift??m.lift):m.lift};}
function resolve(world,f,t,a){
 const m=a.move;if(!m.rosterKit)return false;
 const slot=m.hits===1?0:Math.floor((a.t-m.startup)/m.interval);if(slot>=m.hits||slot<0||a.kitSlots?.has(slot))return true;
 const last=slot===m.hits-1;
 if(m.projectile){
  a.kitSlots??=new Set();a.kitSlots.add(slot);
  const spec={kind:m.projectile,name:a.name,move:hitMove(m,last),vx:f.dir*m.speed,vy:m.shotY||0,gravity:m.gravity||0,w:m.projectileWidth,h:m.projectileHeight,maxTravel:m.range,traveled:0,life:m.projectile==='grenade'?65:Math.ceil(m.range/m.speed)+4,rosterMode:m.rosterMode,fxClip:m.fxClip};
  // Fixed muzzle offsets are in actor coordinates; opponent positions never aim a shot.
  if(m.muzzleHeight!==undefined){const authored=root.RiftRosterVisual?.projectileOrigin?.(f,a.name);if(!authored||!Number.isFinite(authored.x)||!Number.isFinite(authored.y)){spec.x=f.x+f.dir*55;spec.y=f.y-m.muzzleHeight;}}
  world.spawnProjectile(f,spec);if(!['arrow','grenade'].includes(m.projectile))effect(world,f,a,m.fxClip,12);return true;
 }
 a.fxSlots??=new Set();if(!a.fxSlots.has(slot)){a.fxSlots.add(slot);effect(world,f,a,m.fxClip,12);world.event('swing',{x:f.x,y:f.y-80,dir:f.dir,hero:f.hero,weapon:f.info.weapon,color:f.color,move:a.name});}
 if(!contact(world,f,t,m))return true;a.kitSlots??=new Set();a.kitSlots.add(slot);
 world.hit(f,t,hitMove(m,last),a.name,t.x,{dir:m.radial?(t.x>=f.x?1:-1):f.dir});a.hit=true;return true;
}
function awaken(world,f){if(!applies(f)||f.awakenLevel>=2||f.energy<50)return false;f.energy-=50;f.awakenLevel=(f.awakenLevel||0)+1;f.awakenTime=f.awakenLevel===2?600:900;world.begin(f,'awaken');f.inv=16;world.lastFeedback=f.info.name+' / '+CATALOG[f.hero].modes[f.awakenLevel-1];return true;}
root.RiftRosterRules={CATALOG,applies,cost,variant,basic,move,begin,update,advance,resolve,awaken};
if(typeof module!=='undefined')module.exports=root.RiftRosterRules;
})(typeof window!=='undefined'?window:globalThis);
