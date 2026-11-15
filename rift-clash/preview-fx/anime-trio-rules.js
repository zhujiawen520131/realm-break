(function(root){
'use strict';
// Frame data, two-step awakenings and cinematic choreography are original Rift
// adaptations, not frame data or an assertion about the source canons.
const HEROES={
 luffy:{name:'蒙奇·D·路飞',en:'MONKEY D. LUFFY',source:'航海王',color:'#ef5548',cloth:'#d83f36',hair:'#211a21',skin:'#efb887',weapon:'rubber-fist',speed:5.8,reach:1,scene:'jungle',skill:'橡胶枪',ultimate:'橡胶·火拳巨拳',desc:'橡胶伸缩拳脚 · 机关枪 · 二档与五档',skillHint:'U 橡胶枪 / W + U 机关枪 / S + U 橡胶战斧',ultimateHint:'近身连击后火拳巨拳终结'},
 kirito:{name:'桐人',en:'KIRITO',source:'刀剑神域',color:'#91d5ff',cloth:'#202633',hair:'#151822',skin:'#e7c2ae',weapon:'dual-swords',speed:6,reach:1,scene:'city',skill:'音速冲击',ultimate:'星爆气流斩',desc:'双剑连斩 · 音速冲击 · 剑技极限',skillHint:'U 音速冲击 / W + U 水平斩 / S + U 交叉斩',ultimateHint:'双剑连续突进斩，末击击飞'},
 naruto:{name:'漩涡鸣人',en:'NARUTO',source:'火影忍者',color:'#ffbb44',cloth:'#f78c26',hair:'#f4c431',skin:'#efbd96',weapon:'chakra',speed:5.7,reach:1,scene:'temple',skill:'螺旋丸',ultimate:'影分身·大玉螺旋丸',desc:'影分身连击 · 螺旋丸 · 仙人模式',skillHint:'U 螺旋丸 / W + U 影分身 / S + U 螺旋手里剑',ultimateHint:'影分身连击后大玉螺旋丸终结'}
};
const CATALOGS={
 luffy:{modes:['二档','五档'],skills:[{id:'skill1',name:'橡胶枪',hint:'U · 弹性远拳'},{id:'skill2',name:'橡胶机关枪',hint:'W + U · 连续拳击'},{id:'skill3',name:'橡胶战斧',hint:'S + U · 上抬后重砸'}],signature:{name:'橡胶双拳突袭',controls:'S + P',sourceHint:'弹性双拳突击，本作改编'}},
 kirito:{modes:['双刀解放','剑技极限'],skills:[{id:'skill1',name:'音速冲击',hint:'U · 向前突刺'},{id:'skill2',name:'水平斩',hint:'W + U · 两段剑弧'},{id:'skill3',name:'双剑交叉斩',hint:'S + U · 双剑交击'}],signature:{name:'双剑回旋',controls:'S + P',sourceHint:'双剑旋身连击，本作改编'}},
 naruto:{modes:['仙人模式','九喇嘛模式'],skills:[{id:'skill1',name:'螺旋丸',hint:'U · 近身突进'},{id:'skill2',name:'影分身连击',hint:'W + U · 分身接力'},{id:'skill3',name:'螺旋手里剑',hint:'S + U · 直线投出'}],signature:{name:'影分身突袭',controls:'S + P',sourceHint:'影分身与体术组合，本作改编'}}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const applies=f=>!!HEROES[f?.hero];
const cost=(f,name='skill')=>name==='awaken'?50:(name==='skill'||name==='signature')?(f.awakenLevel===2?0:25):0;
function variant(keys={}){return ['skill1','skill2','skill3'].includes(keys.variant)?keys.variant:keys.up?'skill2':keys.down?'skill3':'skill1';}
function basic(f,a,keys={},ground){if(!ground)return 'air';if(keys.up)return 'launcher';if(keys.down)return 'downward';if(['slash3','launcher','downward'].includes(a?.name))return null;return ({slash1:'slash2',slash2:'slash3'}[a?.name])||'slash1';}
function move(f,name,id){
 if(!applies(f))return null;
 const mode=f.awakenLevel||0,full=mode===2,boost=mode===2?1.2:mode===1?1.1:1;
 let m={kit:true,animeTrioKit:true,animeKit:true,animeMode:mode,awakenMode:mode,style:null,clipId:'attack1',fxClip:'strike',cost:cost(f,name),startup:7,active:7,end:27,hits:1,interval:7,damage:7,reach:110,height:155,stun:28,push:2,lift:0,stop:5,knockdown:false};
 if(name==='slash1')m={...m,lunge:2.5};
 else if(name==='slash2')m={...m,clipId:'attack2',startup:6,damage:9,reach:f.hero==='luffy'?150:130,lunge:3,push:3};
 else if(name==='slash3')m={...m,clipId:'attack3',startup:9,end:34,damage:14,reach:f.hero==='luffy'?175:145,lunge:4,push:10,lift:-5,stop:10,knockdown:true};
 else if(name==='launcher')m={...m,clipId:'launcher',startup:8,end:30,damage:10,reach:125,height:205,lift:-13,stun:38,stop:7};
 else if(name==='downward')m={...m,clipId:'downward',startup:10,end:34,damage:12,reach:125,height:190,lift:-5,push:8,stun:32,knockdown:true};
 else if(name==='air')m={...m,clipId:'air',startup:5,end:25,damage:8,reach:130,height:170,lift:-5};
 else if(name==='heavy'||name==='airheavy')m={...m,clipId:'heavy',startup:name==='airheavy'?9:24,active:8,end:name==='airheavy'?34:48,damage:full?25:21,reach:full?220:175,height:240,push:11,lift:name==='airheavy'?11:-7,knockdown:true,stop:12};
 else if(name==='throw')m={...m,clipId:'throw',startup:8,active:5,end:35,damage:15,reach:66,height:100,unblockable:true,throw:true,push:12,lift:-8,knockdown:true,stop:8};
 else if(name==='awaken')return {...m,clipId:full?'awaken2':'awaken',fxClip:'aura',startup:20,active:0,end:34,hits:0,damage:0,reach:0};
 else if(name==='ultimate')m={...m,clipId:'ultimate',fxClip:'ultimate',startup:14,active:8,end:43,damage:5,reach:155,height:165,stun:40,push:0,lift:0,stop:3,animeOpen:true,finisher:false,displayName:HEROES[f.hero].ultimate};
 else if(name==='skill'||name==='signature'){
  const key=name==='signature'?'signature':['skill2','skill3'].includes(id)?id:'skill1';
  m={...m,variant:key,clipId:key==='signature'?'signature':key,displayName:key==='signature'?CATALOGS[f.hero].signature.name:CATALOGS[f.hero].skills.find(s=>s.id===key).name,knockdown:true,finalPush:10,finalLift:-7};
  if(f.hero==='luffy'){
   if(key==='skill1')m={...m,fxClip:'stretch',startup:11,damage:19,reach:full?300:mode?265:230,height:165};
   if(key==='skill2')m={...m,fxClip:'barrage',startup:9,hits:3+mode,interval:5,damage:5.5,reach:full?250:205,height:190,push:0};
   if(key==='skill3')m={...m,fxClip:'slam',startup:16,damage:23,reach:full?210:160,height:250,finalLift:9,jump:-9,dive:9};
   if(key==='signature')m={...m,fxClip:'barrage',startup:13,hits:2,interval:6,damage:12,reach:full?255:210,height:180,push:0};
  } else if(f.hero==='kirito'){
   if(key==='skill1')m={...m,fxClip:'thrust',startup:9,damage:19,reach:full?205:165,height:160,rush:10};
   if(key==='skill2')m={...m,fxClip:'arc',startup:8,hits:2+mode,interval:7,damage:mode?8:11,reach:full?215:175,height:195,push:0};
   if(key==='skill3')m={...m,fxClip:'cross',startup:12,hits:2,interval:8,damage:12,reach:full?205:165,height:210,push:0};
   if(key==='signature')m={...m,fxClip:'arc',startup:10,hits:3,interval:6,damage:8,reach:full?205:160,height:195,push:0,rush:4};
  } else {
   if(key==='skill1')m={...m,fxClip:'rasengan',startup:12,damage:21,reach:full?150:125,height:165,rush:8};
   if(key==='skill2')m={...m,fxClip:'clone',startup:9,hits:3+mode,interval:6,damage:6,reach:full?190:160,height:180,push:0};
   if(key==='skill3')m={...m,fxClip:'shuriken',startup:15,damage:23,reach:0,projectile:'animeShuriken',speed:13,range:full?620:500,projectileWidth:84,projectileHeight:84};
   if(key==='signature')m={...m,fxClip:'clone',startup:8,hits:3,interval:7,damage:8,reach:full?190:150,height:180,push:0};
  }
  m.active=m.hits===1?8:(m.hits-1)*m.interval+6;m.end=m.startup+m.active+19;
 }else return null;
 m.damage=Math.round(m.damage*boost*10)/10;return m;
}
function effect(world,f,clipId,life=22,extra={}){const ground=['slam','aura','aura2','clone'].includes(clipId);const e={kind:'animeTrioFx',hero:f.hero,clipId,x:f.x+f.dir*48,y:f.y-(ground?0:80),dir:f.dir,mode:f.attack?.move.animeMode??f.awakenLevel,life,max:life,owner:f,...extra};world.effects.push(e);return e;}
function begin(world,f,name,id){const a=f.attack,m=a?.move;if(!m?.animeTrioKit)return;a.direction=f.dir;a.originX=f.x;a.originY=f.y;a.onGround=!!world.supportAt(f);a.clipId=m.clipId;a.variant=m.variant||id;a.kitSlots=new Set();a.fxSlots=new Set();if(name==='awaken')effect(world,f,'aura',34,{x:f.x});if(m.displayName)world.lastFeedback=f.info.name+' / '+m.displayName;}
function activateSignature(world,f,dir){if(!applies(f))return false;const price=cost(f,'signature');if(f.energy+.001<price){world.lastFeedback='气力不足 / 组合技需要 25 气';f.buffer=null;return false;}f.energy=Math.max(0,f.energy-price);f.dir=f.inputDir=Math.sign(dir)||f.dir;world.begin(f,'signature');return true;}
function update(world,f){if(!applies(f))return;if(f.awakenTime>0&&--f.awakenTime===0)f.awakenLevel=0;const a=f.attack,m=a?.move;if(!m?.animeTrioKit)return;f.dir=a.direction;if(m.jump&&a.onGround&&a.t===3){f.vy=m.jump;world.refreshSupport(f);}if(m.dive&&a.t===m.startup)f.vy=Math.max(f.vy,m.dive);if(m.rush&&a.t>=4&&a.t<m.startup+m.active)f.vx=f.dir*m.rush;if(a.name==='airheavy'&&a.t===m.startup)f.vy=Math.max(f.vy,12);}
function touches(world,f,t,m){if(t.inv||t.downTime||t.knockdown||t.hp<=0)return false;if(m.throw&&(!world.supportAt(f)||!world.supportAt(t)||Math.abs(f.y-t.y)>20))return false;const dx=(t.x-f.x)*f.dir;return dx>=-18&&dx<=m.reach+23&&Math.abs(t.y-f.y)<m.height;}
function resolve(world,f,t,a){
 const m=a.move;if(!m?.animeTrioKit)return false;if(a.animeSequence)return resolveSequence(world,f,t,a);
 const slot=m.hits===1?0:Math.floor((a.t-m.startup)/m.interval);if(slot<0||slot>=m.hits||a.kitSlots.has(slot))return true;const last=slot===m.hits-1;
 const strike={...m,projectile:null,finisher:m.animeOpen?false:last,knockdown:last&&m.knockdown,push:last?(m.finalPush??m.push):m.push,lift:last?(m.finalLift??m.lift):m.lift};
 if(m.projectile){a.kitSlots.add(slot);world.spawnProjectile(f,{kind:m.projectile,name:'skill',x:f.x+f.dir*48,y:f.y-90,vx:f.dir*m.speed,vy:0,w:m.projectileWidth,h:m.projectileHeight,life:Math.ceil(m.range/m.speed)+3,maxTravel:m.range,traveled:0,move:strike});const projectile=world.projectiles.at(-1);effect(world,f,m.fxClip,projectile.life,{x:projectile.x,y:projectile.y,projectile});return true;}
 if(!a.fxSlots.has(slot)){a.fxSlots.add(slot);effect(world,f,m.fxClip,20,{slot,x:f.x+f.dir*(m.fxClip==='clone'?-65:50),...(f.hero==='luffy'&&m.fxClip==='slam'&&a.onGround?{y:a.originY}:{})});world.event('swing',{x:f.x,y:f.y-80,dir:f.dir,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});}
 if(!touches(world,f,t,m))return true;a.kitSlots.add(slot);world.hit(f,t,strike,a.name,t.x,{dir:f.dir});a.hit=true;return true;
}
function awaken(world,f){if(!applies(f)||f.awakenLevel>=2||f.energy<50)return false;f.energy-=50;f.awakenLevel++;f.awakenTime=f.awakenLevel===2?600:900;world.begin(f,'awaken');f.inv=16;world.lastFeedback=f.info.name+' / '+CATALOGS[f.hero].modes[f.awakenLevel-1];return true;}
// Choreography is captured only after a real, unguarded opening. The target may
// substitute out between contacts; no later phase follows an escaped target.
const PHASES={
 luffy:[{name:'橡胶连拳',clipId:'attack1',fx:'barrage',duration:18,hit:11},{name:'伸臂追击',clipId:'skill1',fx:'stretch',duration:18,hit:11},{name:'弹力踢',clipId:'attack2',fx:'strike',duration:18,hit:11},{name:'腾空重击',clipId:'launcher',fx:'slam',duration:20,hit:13},{name:'火拳巨拳',clipId:'ultimate',fx:'ultimate',duration:22,hit:15}],
 kirito:[{name:'双剑起斩',clipId:'attack1',fx:'arc',duration:17,hit:10},{name:'交叉斩',clipId:'skill3',fx:'cross',duration:17,hit:10},{name:'音速追击',clipId:'skill1',fx:'thrust',duration:17,hit:10},{name:'回旋连斩',clipId:'attack2',fx:'arc',duration:18,hit:11},{name:'星爆终斩',clipId:'ultimate',fx:'ultimate',duration:22,hit:15}],
 naruto:[{name:'影分身突击',clipId:'attack1',fx:'clone',duration:18,hit:11},{name:'分身接力',clipId:'attack2',fx:'clone',duration:18,hit:11},{name:'飞踢挑空',clipId:'launcher',fx:'strike',duration:18,hit:11},{name:'螺旋丸追击',clipId:'skill1',fx:'rasengan',duration:20,hit:13},{name:'大玉螺旋丸',clipId:'ultimate',fx:'ultimate',duration:22,hit:15}]
};
function phaseAt(a){const s=a?.animeSequence;if(!s)return null;let tick=Math.max(0,a.t-s.startT);const phases=PHASES[s.hero];for(let i=0;i<phases.length;i++){const p=phases[i];if(tick<p.duration||i===phases.length-1)return {...p,index:i,t:Math.min(tick,p.duration-1)};tick-=p.duration;}return null;}
function ultimatePose(a){const p=phaseAt(a);return p?{...a,clipId:p.clipId,bodyFrame:Math.min(7,Math.floor(p.t/p.duration*8)),t:p.t,move:{...a.move,startup:p.hit,active:1,end:p.duration}}:a;}
function live(f){const s=f?.attack?.animeSequence;return s&&!s.finished&&!f.stun&&f.hp>0&&s.target.hp>0&&!s.target.inv&&s.target.stun>0?s:null;}
function controlled(world,f){return [world.p1,world.p2].some(owner=>{const s=live(owner);return !!s&&(owner===f||s.target===f);});}
function stop(world,f,a){const s=a.animeSequence;if(!s||s.finished)return;s.finished=true;a.t=a.move.startup+a.move.active;a.move.end=a.t+15;f.vx=f.vy=0;f.returning=true;world.lastFeedback='连击中断 / I 可定向替身脱离';}
function advance(world){
 for(const e of world.effects)if(e.kind==='animeTrioFx'&&e.projectile){e.x=e.projectile.x;e.y=e.projectile.y;if(e.projectile.dead||e.projectile.life<=0)e.life=Math.min(e.life,4);}
 for(const f of [world.p1,world.p2]){const a=f.attack,s=a?.animeSequence;if(!s||s.finished)continue;if(!live(f)){stop(world,f,a);continue;}const t=s.target,p=phaseAt(a),q=clamp(p.t/p.duration,0,1),ease=n=>n*n*(3-2*n);a.clipId=p.clipId;
  let rise=0,travel=0;if(p.index===0){rise=35*ease(q);travel=18*ease(q);}if(p.index===1){rise=35+40*ease(q);travel=18+28*ease(q);}if(p.index===2){rise=75+80*ease(q);travel=46+20*ease(q);}if(p.index===3){rise=155+25*Math.sin(q*Math.PI);travel=66+25*ease(q);}if(p.index===4){rise=155*(1-ease(clamp(q/.75,0,1)));travel=91+25*ease(q);}
  const desired=clamp(s.tx+s.dir*travel,122,world.width-122),blend=clamp((a.t-s.startT)/7,0,1);t.x=desired;t.y=s.ty-rise;f.x=s.fx+(desired-s.dir*76-s.fx)*blend;f.y=s.fy+(s.ty-rise-s.fy)*blend;f.x=clamp(f.x,42,world.width-42);f.dir=s.dir;f.vx=f.vy=t.vx=t.vy=0;t.stun=Math.max(20,t.stun);t.block=false;world.refreshSupport(f);world.refreshSupport(t);
  if(p.t===1)effect(world,f,p.fx,p.duration+6,{x:desired-s.dir*25,y:t.y-(['slam','clone','aura','aura2'].includes(p.fx)?0:80)});world.lastFeedback=HEROES[f.hero].ultimate+' / '+p.name+' / '+f.combo+' HIT';
 }
}
function resolveSequence(world,f,t,a){
 const s=a.animeSequence;if(s.finished)return true;if(!live(f)){stop(world,f,a);return true;}const p=phaseAt(a);
 // Starburst Stream's 16 contacts are represented as one opener plus three
 // physical contacts in each of five choreographed phases, not a display count.
 const offsets=s.hero==='kirito'?[4,9,14]:[p.hit],hitIndex=offsets.indexOf(p.t),key=p.index+':'+hitIndex;
 if(hitIndex<0||s.struck.has(key))return true;if(Math.abs(f.x-t.x)>155||Math.abs(f.y-t.y)>170){stop(world,f,a);return true;}
 s.struck.add(key);const last=p.index===PHASES[s.hero].length-1&&hitIndex===offsets.length-1,dir=last?(t.x>world.width-190?-1:t.x<190?1:s.dir):s.dir;
 const damage=s.hero==='kirito'?(last?14:3):(last?17:8);
 world.hit(f,t,{animeTrioKit:true,animeKit:true,animeSequenceHit:true,animeMode:a.move.animeMode,awakenMode:a.move.animeMode,sourceAttackSerial:a.move.sourceAttackSerial,damage:damage*s.boost,stun:40,push:last?23:0,lift:last?-8:0,stop:last?11:s.hero==='kirito'?1:3,knockdown:last,finisher:last},'ultimate',t.x,{dir});return true;
}
function afterHit(world,f,t,m,contact){if(contact.guarded||f.stun||!f.attack)return;if(m.animeSequenceHit){const s=f.attack.animeSequence;if(s&&(m.finisher||t.hp<=0)){s.finished=true;f.vx=f.vy=0;f.returning=true;}return;}if(!m.animeOpen||f.attack.animeSequence||t.hp<=0)return;const a=f.attack,total=PHASES[f.hero].reduce((n,p)=>n+p.duration,0);a.animeSequence={hero:f.hero,target:t,startT:a.t,fx:f.x,fy:f.y,tx:t.x,ty:t.y,dir:f.dir,struck:new Set(),finished:false,boost:m.animeMode===2?1.2:m.animeMode===1?1.1:1};a.move={...a.move,active:total+12,end:a.t+total+18};f.vx=f.vy=t.vx=t.vy=0;}
root.RiftAnimeTrioRules={HEROES,CATALOG:CATALOGS,CATALOGS,applies,cost,variant,basic,move,begin,update,resolve,awaken,activateSignature,advance,afterHit,controlled,phaseAt,ultimatePose,PHASES};
if(typeof module!=='undefined')module.exports=root.RiftAnimeTrioRules;
})(typeof window!=='undefined'?window:globalThis);
