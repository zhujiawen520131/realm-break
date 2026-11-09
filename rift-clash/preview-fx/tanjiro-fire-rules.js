(function(root){'use strict';
// Fire mode is a timed second awakening. These are 2D timings and ranges;
// the user's BV18J4m1E7Gr footage supplies the motion/effect reference.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CATALOG=[['skill1','火神 · 突进斩','U','低身突进，火刀横斩'],['skill2','火神 · 升炎斩','W + U','上挑火弧，腾空追击'],['skill3','火神 · 交错炎斩','S + U','左右交错五斩，火痕交叉']];
const active=f=>f?.hero==='tanjiro'&&f.awakenLevel===2;
function variant(keys,a){const aliases={waterwheel:'skill1',waterfall:'skill2',whirlpool:'skill3'};if(keys.variant)return aliases[keys.variant]||keys.variant;if(keys.up)return 'skill2';if(keys.down)return 'skill3';return a?.move.fire&&a.name==='skill'&&a.hit?({skill1:'skill2',skill2:'skill3',skill3:'skill1'}[a.variant]||'skill1'):'skill1';}
function basic(f,a,keys,ground){if(!ground)return 'air';if(keys.up)return 'launcher';if(keys.down)return 'downstrike';if(['slash5','launcher','downstrike'].includes(a?.name))return null;return ({slash1:'slash2',slash2:'slash3',slash3:'slash4',slash4:'slash5'}[a?.name])||'slash1';}
function move(f,name,id){
 const b={kit:true,fire:true,style:null,clipId:name,fxClip:'slash',startup:5,active:7,end:24,damage:8,reach:150,height:150,stun:30,push:1.5,lift:0,stop:4,travel:0,hits:1,interval:5,knockdown:false};let m;
 if(/^slash[1-5]$/.test(name)){const n=Number(name.at(-1));m={...b,startup:4+n%2,damage:7+n,reach:150+n*24,end:23+n,knockdown:n===5,push:n===5?11:1.5,lift:n===5?-8:0};}
 if(name==='launcher')m={...b,startup:6,active:8,end:29,damage:11,reach:190,height:210,lift:-13,fxClip:'skill2'};
 if(name==='downstrike')m={...b,startup:7,active:8,end:30,damage:14,reach:215,height:285,lift:10,push:4,knockdown:true,fxClip:'skill3'};
 if(name==='air')m={...b,startup:4,active:12,end:26,hits:3,interval:4,damage:5,reach:180,height:190,lift:0};
 if(name==='airheavy')m={...b,startup:6,active:10,end:30,damage:16,reach:170,height:230,lift:11,travel:9,knockdown:true,fxClip:'skill3'};
 if(name==='heavy')m={...b,startup:22,active:15,end:46,hits:3,interval:5,damage:8,reach:240,height:190,fxClip:'skill3'};
 if(name==='throw')m={...b,startup:7,active:17,end:36,hits:3,interval:7,damage:6,reach:68,unblockable:true,throw:true};
 if(name==='dashstrike')m={...b,startup:2,active:10,end:20,damage:6,reach:105,travel:20};
 if(name==='awaken')m={...b,fxClip:'aura',startup:16,active:0,end:32,damage:0,reach:0};
 if(name==='skill'){
  const key=['skill1','skill2','skill3'].includes(id)?id:'skill1';
  if(key==='skill1')m={...b,clipId:key,fxClip:key,displayName:CATALOG[0][1],startup:7,active:11,end:30,hits:1,interval:11,damage:19,reach:235,height:235,travel:13,knockdown:true};
  if(key==='skill2')m={...b,clipId:key,fxClip:key,displayName:CATALOG[1][1],startup:7,active:9,end:46,hits:1,interval:9,damage:19,reach:265,height:335,knockdown:true};
  if(key==='skill3')m={...b,clipId:key,fxClip:key,displayName:CATALOG[2][1],startup:8,active:20,end:38,hits:5,interval:4,damage:5,reach:235,height:285,radial:true,knockdown:true};
 }
 if(name==='ultimate')m={...b,clipId:'slash1',displayName:'火之神神乐 · 碧罗之天',startup:13,active:8,end:36,damage:4,reach:290,height:250,kitUltimate:true,fxClip:'slash'};
 return m||b;
}
function effect(world,f,id,life=20,startFrame){world.effects.push({kind:'tanjiroFireFx',clipId:id,fire:true,startFrame,owner:f,x:f.x+f.dir*40,y:f.y-80,dir:f.dir,life,max:life,reach:f.attack?.move.reach||0,follow:f.attack,flow:[]});}
function begin(world,f,name,id){const a=f.attack;a.clipId=a.move.clipId;a.variant=name==='skill'?(['skill1','skill2','skill3'].includes(id)?id:'skill1'):null;f.color='#ff773d';
 if(name==='awaken'){effect(world,f,'aura',38);world.lastFeedback='火之神神乐 / 限时 10 秒 · 全招式切换';}
 if(name==='dashstrike')f.inv=6;
}
function update(world,f){const a=f.attack;if(!a?.move.fire)return;const m=a.move,on=a.t>=m.startup&&a.t<m.startup+m.active;
 if(m.kitUltimate&&a.t<m.startup)f.vx=f.dir*9;
 if(on&&m.travel)f.vx=f.dir*m.travel;
 if(on&&a.name==='airheavy')f.vy=Math.max(12,f.vy);
 if(a.variant==='skill2'&&a.t===3){f.vy=-13.4;world.refreshSupport(f);}
}
function contact(world,f,t,m){if(t.inv||t.downTime||t.hp<=0)return false;if(m.throw&&(!world.supportAt(f)||!world.supportAt(t)||Math.abs(f.y-t.y)>20))return false;const dx=(t.x-f.x)*f.dir;return (m.radial?Math.abs(dx)<m.reach+24:dx>=-20&&dx<m.reach+24)&&Math.abs(t.y-f.y)<m.height;}
function resolve(world,f,t,a){
 if(a.fireSequence)return resolveSequence(world,f,t,a);
 const m=a.move;if(a.capture){if(t.inv||a.capture!==t){a.t=m.startup+m.active;return true;}t.x=clamp(f.x+f.dir*48,42,world.width-42);t.y=f.y;t.vx=t.vy=0;}
 const total=m.hits||1,slot=total===1?0:Math.floor((a.t-m.startup)/m.interval);if(slot>=total||a.kitSlots?.has(slot))return true;
 if(!a.fireFx){a.fireFx=true;effect(world,f,m.fxClip,m.active+12);world.event('swing',{x:f.x,y:f.y-80,hero:f.hero,color:'#ff773d',weapon:f.info.weapon,move:a.name});}
 if(!contact(world,f,t,m))return true;a.kitSlots??=new Set();a.kitSlots.add(slot);const last=slot===total-1;
 const lift=last&&a.name==='skill'?(a.variant==='skill2'?-11:a.variant==='skill3'?-9:-6):last&&a.name==='heavy'?-3:m.lift;
 if(m.throw)a.capture=t;
 world.hit(f,t,{...m,lift: m.throw&&last?-8:lift,push:m.throw&&last?12:m.push,knockdown:!m.kitUltimate&&last&&(m.knockdown||m.throw),finisher:!m.kitUltimate&&last},a.name,t.x,{dir:m.radial?(t.x>=f.x?1:-1):f.dir});a.hit=true;return true;
}
const PHASES=[
 {name:'炎刀连舞',clipId:'slash2',duration:36,hits:[8,20,32],fx:'slash'},
 {name:'烈焰上挑',clipId:'launcher',duration:28,hits:[10,24],fx:'skill2'},
 {name:'交错炎斩',clipId:'skill3',duration:40,hits:[10,22,34],fx:'skill3'},
 {name:'碧罗之天 · 前翻落斩',clipId:'ultimate',duration:48,hits:[40],fx:'ultimate'}
];
const TOTAL=PHASES.reduce((sum,p)=>sum+p.duration,0);
function phaseAt(a){let tick=Math.max(0,a.t-a.fireSequence.startT);for(let i=0;i<PHASES.length;i++){const p=PHASES[i];if(tick<p.duration||i===PHASES.length-1)return {...p,index:i,t:Math.min(tick,p.duration-1)};tick-=p.duration;}}
// Every real contact gets an authored wind-up, strike and follow-through.
function ultimatePose(a){if(!a?.fireSequence)return a;const p=phaseAt(a);
 if(p.index===3){const frames=[0,3,6,9,18,29,40,44];return {...a,clipId:'ultimate',bodyFrame:Math.max(0,frames.filter(t=>p.t>=t).length-1),t:p.t,move:{...a.move,startup:40,active:4,end:48},fireSequence:null};}
 const clips=[['slash1','slash2','slash4'],['launcher','skill2'],['slash3','skill3','slash5']][p.index];
 const starts=p.hits.map((hit,i)=>i===0?0:p.hits[i-1]+4),slot=Math.max(0,starts.filter(t=>p.t>=t).length-1),begin=starts[slot],end=starts[slot+1]??p.duration,contact=p.hits[slot]-begin;
 return {...a,clipId:clips[slot],t:p.t-begin,move:{...a.move,startup:contact,active:Math.max(1,end-begin-contact),end:end-begin},fireSequence:null};
}
function live(f){const s=f?.attack?.fireSequence;return s&&!s.finished&&!f.stun&&f.hp>0&&s.target.hp>0&&!s.target.inv?s:null;}
function controlled(world,f){return [world.p1,world.p2].some(actor=>{const s=live(actor);return s&&(actor===f||s.target===f);});}
function updateEffects(world){for(const e of world.effects){if(e.kind!=='tanjiroFireFx'||e.clipId==='aura')continue;const f=e.owner;if(f.attack===e.follow&&e.life>4){e.flow.push({x:e.x,y:e.y});if(e.flow.length>6)e.flow.shift();e.x=f.x+f.dir*40;e.y=f.y-80;}}}
function advance(world){for(const f of [world.p1,world.p2]){const a=f.attack,s=a?.fireSequence;if(s?.posterAt!==undefined&&a.t>=s.posterAt){if(!f.stun&&!s.target.inv&&world.settings.cinematics)world.cutin=s.poster;s.posterAt=undefined;}if(!s||s.finished)continue;if(!live(f)){s.finished=true;a.t=a.move.startup+a.move.active;a.move.end=a.t+12;f.vx=f.vy=0;continue;}
 const t=s.target,p=phaseAt(a),age=a.t-s.startT,blend=clamp(age/14,0,1),q=p.t/p.duration;
 const jump=clamp((p.t-6)/34,0,1),rise=p.index===1?Math.sin(q*Math.PI)*120:p.index===2?Math.sin(q*Math.PI)*45:p.index===3?4*jump*(1-jump)*240:0;const targetX=clamp(s.tx+s.dir*(age/TOTAL)*155,126,world.width-126),actorX=targetX-s.dir*(p.index===3?110-90*jump:76);
 const targetRise=p.index===1?Math.sin(q*Math.PI)*75:p.index===2?Math.sin(q*Math.PI)*18:0;
 f.x=clamp(s.fx+(actorX-s.fx)*blend,42,world.width-42);t.x=s.tx+(targetX-s.tx)*blend;f.y=s.fy+(s.ty-s.fy)*blend-rise;t.y=s.ty-targetRise;f.dir=s.dir;f.vx=f.vy=t.vx=t.vy=0;t.stun=Math.max(18,t.stun);t.block=false;world.refreshSupport(f);world.refreshSupport(t);
 if(p.index===3&&p.t===9)effect(world,f,p.fx,34,0);else if(p.index!==3&&p.hits.includes(p.t)){const pose=ultimatePose(a);effect(world,f,p.fx,12);world.effects.at(-1).blade=pose.clipId;}
 if(p.index===3&&p.t===40)world.event('land',{x:f.x,y:f.y,heavy:true,color:f.color});world.lastFeedback='火之神神乐 / '+p.name+' / '+f.combo+' HIT';
}updateEffects(world);}
function resolveSequence(world,f,t,a){const s=a.fireSequence;if(s.finished||!live(f))return true;const p=phaseAt(a),n=p.hits.indexOf(p.t),key=p.index+':'+n;if(n<0||s.struck.has(key))return true;s.struck.add(key);const last=p.index===PHASES.length-1;
 world.hit(f,t,{damage:last?16:7,stun:30,push:last?20:0,lift:last?-9:0,stop:last?9:3,knockdown:last,finisher:last,fireSequenceHit:true},'ultimate',t.x,{dir:s.dir});return true;
}
function afterHit(world,f,t,m,contact){if(contact.guarded||f.stun||!f.attack)return;
 if(m.fireSequenceHit){const s=f.attack.fireSequence;if(!s||s.finished)return;if(m.finisher||t.hp<=0){s.finished=true;f.vx=f.vy=0;if(m.finisher){effect(world,f,'ultimate',30);if(world.settings.cinematics){s.poster={hero:'tanjiro',fire:true,finisher:true,name:'灶门炭治郎',move:'火之神神乐 · 碧罗之天',color:'#ff873d',dir:s.dir,total:48,remaining:48};if(t.hp<=0)world.cutin=s.poster;else s.posterAt=f.attack.t+6;}}world.lastFeedback='火之神神乐 / '+f.combo+' 段终结';}return;}
 if(!m.kitUltimate||f.attack.fireSequence||t.hp<=0)return;const a=f.attack;a.fireSequence={target:t,startT:a.t,fx:f.x,fy:f.y,tx:t.x,ty:t.y,dir:f.dir,finished:false,struck:new Set()};a.move={...a.move,active:TOTAL+12,end:a.t+TOTAL+18};f.vx=f.vy=t.vx=t.vy=0;
}
root.RiftTanjiroFireRules={active,CATALOG,variant,basic,move,begin,update,resolve,advance,controlled,ultimatePose,afterHit,PHASES};
})(typeof window!=='undefined'?window:globalThis);
