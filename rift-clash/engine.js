(function(root){
'use strict';
const FLOOR=510,HURT_HEIGHT=135, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MOVES={
 slash1:{startup:5,active:5,end:23,damage:7,reach:98,height:88,stun:24,push:3,lift:0,stop:6,lunge:2.5},
 slash2:{startup:4,active:6,end:24,damage:9,reach:111,height:94,stun:26,push:4,lift:0,stop:8,lunge:3.2},
 slash3:{startup:7,active:6,end:32,damage:14,reach:126,height:100,stun:30,push:9,lift:-4,stop:11,lunge:4.2},
 launcher:{startup:7,active:6,end:29,damage:10,reach:102,height:135,stun:37,push:2,lift:-13,stop:8,lunge:1.8},
 air:{startup:4,active:7,end:20,damage:8,reach:110,height:120,stun:26,push:3,lift:-5,stop:5},
 skill:{startup:12,active:1,end:32,damage:15,stop:8},
 ultimate:{startup:22,active:1,end:58,damage:39,stop:15}
};
const HEROES={
 cloud:{name:'克劳德',en:'CLOUD',source:'最终幻想',color:'#9fe9df',cloth:'#303447',hair:'#edd27d',skin:'#e4c2a2',weapon:'buster',speed:5.3,reach:1,scene:'crystal',skill:'破晄击',ultimate:'十字斩',desc:'巨剑压制 · 穿透剑气 · 十字重斩',skillHint:'向前发射剑气',ultimateHint:'近中距离的十字重斩'},
 lara:{name:'劳拉',en:'LARA CROFT',source:'古墓丽影',color:'#efc586',cloth:'#417479',hair:'#533d33',skin:'#d5a587',weapon:'bow',speed:5.9,reach:.88,scene:'tomb',skill:'蓄力箭',ultimate:'双枪连射',desc:'灵活近战 · 高速箭矢 · 双枪连射',skillHint:'高速直线箭矢',ultimateHint:'连续射出六发子弹'},
 wukong:{name:'天命人',en:'DESTINED ONE',source:'黑神话：悟空',color:'#e7bb61',cloth:'#76523a',hair:'#544334',skin:'#b68b60',weapon:'staff',speed:5.4,reach:1.18,scene:'temple',skill:'定身术',ultimate:'重棍破阵',desc:'长棍控距 · 短距定身 · 延伸重棍',skillHint:'定住前方 285 范围内的对手',ultimateHint:'长距离重棍击退'},
 drake:{name:'内森·德雷克',en:'NATHAN DRAKE',source:'神秘海域',color:'#e4b395',cloth:'#a69f86',hair:'#47382f',skin:'#d3a17f',weapon:'pistol',speed:5.6,reach:.9,scene:'jungle',skill:'抛掷手雷',ultimate:'火力压制',desc:'近身搏击 · 抛物线爆炸 · 步枪齐射',skillHint:'中远距离抛物线投掷，落地爆炸',ultimateHint:'连续射出五发步枪弹'},
 ironman:{name:'钢铁侠',en:'IRON MAN',source:'复仇者联盟',color:'#88e4ff',cloth:'#a83d37',hair:'#d5ae65',skin:'#d5ae65',weapon:'armor',speed:5,reach:.95,scene:'city',skill:'掌心炮',ultimate:'集束胸炮',desc:'装甲重拳 · 能量弹 · 持续光束',skillHint:'发射大型掌心能量弹',ultimateHint:'向前释放持续多段光束'},
 luke:{name:'卢克',en:'LUKE SKYWALKER',source:'星球大战',color:'#a6f59c',cloth:'#272d30',hair:'#b69b67',skin:'#dbb798',weapon:'saber',speed:5.8,reach:1.06,scene:'space',skill:'原力推击',ultimate:'回旋光剑',desc:'光剑连段 · 原力击退 · 往返投剑',skillHint:'击退前方 265 范围内的对手',ultimateHint:'投出光剑，往返各造成一次伤害'}
};
class Fighter{constructor(x,dir,hero){this.hero=HEROES[hero]?hero:'cloud';this.info=HEROES[this.hero];const color=this.info.color;Object.assign(this,{x,y:FLOOR,vx:0,vy:0,dir,color,hp:100,energy:100,queuedSub:false,state:'idle',animState:'idle',animTime:0,hurtTime:0,landTime:0,attackSerial:0,attack:null,stun:0,guardStun:0,inv:0,dash:0,jumps:0,combo:0,comboDamage:0,comboTimer:0,flash:0,lastHit:0,subCD:0,airCount:0,block:false,buffer:null,trail:[]});}}
class World{
 constructor(){this.settings={hitstop:true,shake:true,debug:false};this.reset('training');}
 reset(mode=this.mode,hero=this.p1?.hero||'cloud',opponent=this.p2?.hero||'wukong'){this.mode=mode;this.p1=new Fighter(360,1,hero);this.p2=new Fighter(840,-1,opponent);this.frame=0;this.freeze=0;this.shake=0;this.particles=[];this.projectiles=[];this.events=[];this.time=99;this.result=null;this.aiClock=0;this.banner=0;this.bannerText='';this.effects=[];this.scheduled=[];this.hitQueue=null;this.lastFeedback='靠近对手，连续按 J 打出三段连击';}
 event(type,data={}){this.events.push({type,frame:this.frame,...data});if(this.events.length>50)this.events.shift();}
 action(f,key){if(this.result)return;if(key==='sub'){
 if(this.freeze>0){f.queuedSub=true;return;}
 if(f.energy<40||f.subCD>0)return;const o=f===this.p1?this.p2:this.p1;this.burst(f.x,f.y-45,f.color,24);f.x=clamp(o.x-o.dir*95,55,1145);f.y=Math.min(f.y,FLOOR);f.vx=0;f.vy=-3;f.stun=0;f.guardStun=0;f.attack=null;f.dash=0;f.inv=22;f.energy-=40;f.subCD=80;f.dir=f.x<o.x?1:-1;f.buffer=null;f.animTime=0;f.animState='dash';this.event('sub',{x:f.x,y:f.y-55,color:f.color,hero:f.hero});this.lastFeedback='替身成功 / 消耗 40 气力';return;}
 f.buffer={key,ttl:12};}
 execute(f,keys){const b=f.buffer;if(!b)return;const key=b.key,ground=f.y>=FLOOR;const a=f.attack;const canCancel=a&&a.hit&&a.t>=a.move.startup+2&&a.name!=='ultimate';
 if(f.stun||f.dash)return;
 if(key==='jump'&&f.jumps<2&&(!a||canCancel)){f.vy=ground?-13.8:-11;f.jumps++;f.attack=null;f.buffer=null;this.burst(f.x,f.y,'#b3c8c2',7);this.event('jump',{x:f.x,y:f.y,color:f.color,hero:f.hero});return;}
 if(key==='dash'&&(!a||canCancel)){f.dash=13;f.inv=7;f.attack=null;f.buffer=null;f.animTime=0;this.event('dash',{x:f.x,y:f.y-50,dir:f.dir,color:f.color,hero:f.hero});return;}
 if(key==='attack'&&(!a||canCancel)){
 if(a&&ground&&((!keys.down&&['slash3','launcher'].includes(a.name))||(keys.down&&a.name==='launcher')))return;
 let name=ground?(keys.down?'launcher':a?.name==='slash1'?'slash2':a?.name==='slash2'?'slash3':'slash1'):'air';
 if(!ground&&f.airCount>=3){f.buffer=null;return;}if(!ground)f.airCount++;
 this.begin(f,name);return;}
 if((key==='skill'||key==='ultimate')&&(!a||canCancel)){const cost=key==='skill'?25:100;if(f.energy+0.001<cost){f.buffer=null;if(f===this.p1)this.lastFeedback='气力不足 / '+(key==='skill'?'角色技需要 25 气':'奥义需要 100 气');return;}f.energy=Math.max(0,f.energy-cost);this.begin(f,key);if(key==='ultimate'){this.banner=45;this.bannerText=f.info.name+' / '+f.info.ultimate;f.inv=28;this.event('ultimate',{x:f.x,y:f.y-86,dir:f.dir,color:f.color,hero:f.hero,weapon:f.info.weapon});}return;}
 }
 begin(f,name){const move={...MOVES[name]};if(move.reach)move.reach*=f.info.reach;f.attack={name,move,t:0,hit:false};f.attackSerial++;f.animTime=0;if(f.y>=FLOOR&&move.lunge)f.vx=f.dir*move.lunge;f.buffer=null;f.block=false;}
 ai(){const f=this.p2,p=this.p1,k={};if(this.mode!=='duel')return k;const dist=Math.abs(p.x-f.x);this.aiClock++;
 if(f.stun&&f.energy>=40&&f.hp<70&&this.aiClock%39===0)this.action(f,'sub');
 if(f.stun)return k;
 if(dist>105){k.left=f.x>p.x;k.right=f.x<p.x;}if(p.attack&&dist<160&&this.aiClock%100<32)k.down=true;
 if(dist<125&&this.aiClock%23===0)this.action(f,'attack');
 if(dist>(['wukong','luke'].includes(f.hero)?120:220)&&this.aiClock%125===0&&f.energy>=25)this.action(f,'skill');
 if(dist<340&&f.energy>=100&&this.aiClock%250===0)this.action(f,'ultimate');
 if(dist>260&&this.aiClock%100===0)this.action(f,'dash');
 if(p.y<FLOOR-75&&dist<170&&this.aiClock%45===0)this.action(f,'jump');return k;}
 step(keys={}){
 if(this.result)return;
 if(this.freeze>0){this.freeze--;return;}
 for(const f of [this.p1,this.p2])if(f.queuedSub){f.queuedSub=false;this.action(f,'sub');}
 this.frame++;if(this.banner>0)this.banner--;this.shake*=.8;
 if(this.mode==='duel'){this.time=Math.max(0,99-Math.floor(this.frame/60));if(!this.time){this.finish();return;}}
 const ai=this.ai();this.updateFighter(this.p1,this.p2,keys);this.updateFighter(this.p2,this.p1,ai);
 const p=this.p1,q=this.p2;if(Math.abs(p.y-q.y)<75&&Math.abs(p.x-q.x)<46&&!p.inv&&!q.inv){let d=p.x<=q.x?-1:1,over=(46-Math.abs(p.x-q.x))/2;p.x=clamp(p.x+d*over,40,1160);q.x=clamp(q.x-d*over,40,1160);}
 this.hitQueue=[];this.resolveAttack(p,q);this.resolveAttack(q,p);const simultaneousHits=this.hitQueue;this.hitQueue=null;for(const args of simultaneousHits)this.applyHit(...args);
 for(const s of this.scheduled){s.wait--;if(s.wait<=0){if(s.owner.hp>0&&!s.owner.stun)this.spawnProjectile(s.owner,s.spec);s.done=true;}}this.scheduled=this.scheduled.filter(s=>!s.done);
 for(const b of this.projectiles){
  b.life--;b.age=(b.age||0)+1;if(b.delay>0){b.delay--;continue;}
  b.vy=(b.vy||0)+(b.gravity||0);b.x+=b.vx;b.y+=b.vy;
  const t=b.owner===p?q:p;
  if(b.kind==='saber'&&b.age===24){b.vx=-b.vx;b.hitTargets.clear();b.returning=true;}
  if(b.kind==='beam'){b.x=b.beamAnchor.x;b.y=b.beamAnchor.y;if(b.age%10===1)b.hitTargets.clear();}
  const touches=Math.abs(b.x-t.x)<b.w/2+23&&Math.abs(b.y-(t.y-HURT_HEIGHT/2))<b.h/2+HURT_HEIGHT/2;
  if(b.kind==='grenade'&&(b.y>=FLOOR-6||touches||b.life<=0)){
   this.effects.push({kind:'explosion',x:b.x,y:Math.min(FLOOR-40,b.y),color:'#ffc578',life:24,max:24});this.burst(b.x,b.y,'#ffc578',32);
   if(Math.abs(b.x-t.x)<125&&Math.abs(b.y-(t.y-45))<125&&!t.inv){this.confirmProjectile(b);this.hit(b.owner,t,b.move,b.name,b.x,{dir:t.x>=b.x?1:-1});}b.dead=true;
  }else if(!b.dead&&touches&&!t.inv&&!b.hitTargets.has(t)){
   this.confirmProjectile(b);this.hit(b.owner,t,b.move,b.name,b.x,{dir:b.vx===0?b.direction:Math.sign(b.vx)});b.hitTargets.add(t);if(!['beam','saber'].includes(b.kind))b.dead=true;
  }
  if(b.x<-180||b.x>1380)b.dead=true;
 }
 for(const e of this.effects)e.life--;this.effects=this.effects.filter(e=>e.life>0);
 this.projectiles=this.projectiles.filter(b=>!b.dead&&b.life>0);
 for(const pt of this.particles){pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=.16;pt.life--;}
 this.particles=this.particles.filter(pt=>pt.life>0);
 if(this.mode==='training'&&this.frame-q.lastHit>180&&!q.stun){q.hp=Math.min(100,q.hp+1);}
 if(p.hp<=0||q.hp<=0){if(this.mode==='duel')this.finish();else{q.hp=100;q.stun=0;q.y=FLOOR;q.vy=0;this.lastFeedback='击倒！训练对手已恢复';}}
 }
 finish(){this.result=this.p1.hp===this.p2.hp?'平局':this.p1.hp>this.p2.hp?'你赢了。':'再来一局。';this.event('end');}
 updateFighter(f,o,k){
 const previousY=f.y,previousVy=f.vy;
 for(const prop of ['stun','guardStun','inv','flash','subCD','comboTimer','hurtTime','landTime'])if(f[prop]>0)f[prop]--;
 if(!f.comboTimer){f.combo=0;f.comboDamage=0;}f.energy=Math.min(100,f.energy+(this.mode==='training'?.19:.045));
 if(!f.stun&&!f.attack&&!f.dash)f.dir=f.x<o.x?1:-1;
 f.block=!!k.down&&f.y>=FLOOR&&(!f.stun||f.guardStun>0)&&!f.attack&&!f.dash;
 this.execute(f,k);if(f.buffer&&--f.buffer.ttl<=0)f.buffer=null;
 if(f.dash){f.dash--;f.vx=f.dir*17;if(f.y<FLOOR)f.vy*=.4;if(this.frame%2===0)f.trail.push({x:f.x,y:f.y,dir:f.dir,life:12,animTime:f.animTime,animState:'dash',dash:f.dash,attack:null});}
 else if(f.stun)f.vx*=.94;
 else if(f.attack){f.vx*=.65;f.attack.t++;if(f.attack.t>=f.attack.move.end)f.attack=null;}
 else{f.vx=f.block?0:((k.right?1:0)-(k.left?1:0))*f.info.speed;}
 f.x=clamp(f.x+f.vx,42,1158);if(f.y<FLOOR||f.vy<0){f.vy+=.62;f.y+=f.vy;}
 if(f.y>=FLOOR){f.y=FLOOR;f.vy=0;f.jumps=0;f.airCount=0;if(previousY<FLOOR&&previousVy>2){f.landTime=7;this.event('land',{x:f.x,y:FLOOR,heavy:previousVy>11,color:f.color});}}
 const state=f.guardStun>0&&f.block?'guard':f.stun?'hurt':f.dash?'dash':f.attack?(f.attack.name==='skill'||f.attack.name==='ultimate'?'skill':'attack'):f.y<FLOOR?'jump':f.block?'guard':Math.abs(f.vx)>1?'run':f.landTime?'land':'idle';if(state===f.animState)f.animTime++;else{f.animState=state;f.animTime=0;}f.state=state;
 f.trail.forEach(t=>t.life--);f.trail=f.trail.filter(t=>t.life>0);
 }
 hitbox(f){const a=f.attack;if(!a||!a.move.reach)return null;return {x:f.x+(f.dir>0?12:-a.move.reach-12),y:f.y-a.move.height,w:a.move.reach,h:a.move.height};}
 resolveAttack(f,t){const a=f.attack;if(!a)return;const m=a.move;if(a.t<m.startup||a.t>=m.startup+m.active)return;
 if(a.name==='skill'||a.name==='ultimate'){if(a.spawned)return;a.spawned=true;this.special(f,t,a.name);this.event('swing',{x:f.x,y:f.y-86,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});return;}
 if(a.t===m.startup)this.event('swing',{x:f.x,y:f.y-86,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});if(a.hit||t.inv)return;
 const b=this.hitbox(f);if(b.x<t.x+23&&b.x+b.w>t.x-23&&b.y<t.y&&b.y+b.h>t.y-HURT_HEIGHT){a.hit=true;this.hit(f,t,m,a.name,t.x);}
 }
 confirmProjectile(b){if(b.name!=='ultimate'&&b.owner.attack&&b.owner.attack.name===b.name&&b.owner.attackSerial===b.castSerial)b.owner.attack.hit=true;}
 spawnProjectile(f,spec={}){const big=spec.name==='ultimate',muzzleY={cloud:92,lara:110,wukong:100,drake:90,ironman:90,luke:95}[f.hero]||90;if(spec.kind==='bullet')this.event('shot',{x:f.x+f.dir*50,y:f.y-muzzleY,color:f.color,hero:f.hero,weapon:'pistol'});this.projectiles.push({x:f.x+f.dir*65,y:f.y-muzzleY,vx:f.dir*13,vy:0,w:60,h:86,owner:f,direction:f.dir,beamAnchor:{x:f.x+f.dir*350,y:f.y-90},move:{damage:15,stun:30,push:8,lift:-3,stop:8},name:big?'ultimate':'skill',castSerial:f.attackSerial,kind:'wave',life:100,dead:false,hitTargets:new Set(),age:0,...spec});}
 special(f,t,name){const big=name==='ultimate',dir=f.dir;const move={damage:big?39:15,stun:big?47:30,push:big?13:7,lift:big?-7:-3,stop:big?12:6};
  this.lastFeedback=f.info.name+' / '+(big?f.info.ultimate:f.info.skill);
  const direct=(range,m,kind)=>{this.effects.push({kind,x:f.x+dir*range*.5,y:f.y-86,dir,color:f.color,life:22,max:22,range});if((t.x-f.x)*dir>=-12&&(t.x-f.x)*dir<=range&&Math.abs(t.y-f.y)<125&&!t.inv){this.hit(f,t,m,name,t.x);if(f.attack)f.attack.hit=true;}};
  if(f.hero==='cloud'){
   if(big)direct(230,move,'cross');else this.spawnProjectile(f,{kind:'wave',name,move,vx:dir*14});
  }else if(f.hero==='wukong'){
   direct(big?460:285,big?{...move,push:18}:{...move,damage:5,stun:80,push:0,lift:0},big?'staff':'seal');
  }else if(f.hero==='luke'){
   if(big)this.spawnProjectile(f,{kind:'saber',name,move:{...move,damage:22,stun:28,push:2,lift:-2,stop:6},vx:dir*13,w:82,h:110,life:50});else direct(265,{...move,damage:12,push:19,lift:-6},'force');
  }else if(f.hero==='ironman'){
   this.spawnProjectile(f,{kind:big?'beam':'orb',name,move:big?{...move,damage:12,stun:22,push:2,lift:0,stop:3}:move,vx:big?0:dir*14,w:big?650:65,h:big?75:65,life:big?31:100});
  }else if(f.hero==='lara'){
   if(big){for(let i=0;i<6;i++)this.scheduled.push({owner:f,wait:1+i*6,spec:{kind:'bullet',name,move:{...move,damage:9,stun:20,push:2,lift:0,stop:2},vx:dir*23,w:36,h:14}});}else this.spawnProjectile(f,{kind:'arrow',name,move:{...move,damage:18},vx:dir*21,w:70,h:18});
  }else if(f.hero==='drake'){
   if(big){for(let i=0;i<5;i++)this.scheduled.push({owner:f,wait:1+i*7,spec:{kind:'bullet',name,move:{...move,damage:11,stun:21,push:3,lift:0,stop:3},vx:dir*21,w:40,h:14}});}else this.spawnProjectile(f,{kind:'grenade',name,move:{...move,damage:22,stun:40,push:10,lift:-8},vx:dir*7.2,vy:-7.8,gravity:.42,w:18,h:18,life:65});
  }
 }
 hit(f,t,m,name,x,impact={}){
 const dir=impact.dir||f.dir,guarded=t.block&&t.dir===-dir;const contact={dir,guarded,counter:!guarded&&!!t.attack&&t.attack.t<t.attack.move.startup};if(this.hitQueue){this.hitQueue.push([f,t,m,name,x,contact]);return;}this.applyHit(f,t,m,name,x,contact);
 }
 applyHit(f,t,m,name,x,contact){
 const {guarded,counter,dir}=contact;const heavy=name==='ultimate'||name==='slash3';if(!t.stun){f.combo=0;f.comboDamage=0;}const scale=Math.max(.5,1-f.combo*.06);let damage=guarded?Math.max(1,Math.floor(m.damage*.12)):Math.round(m.damage*scale*(counter?1.12:1));
 if(guarded){t.stun=Math.max(t.stun,8);t.guardStun=8;t.vx=dir*3;t.energy=Math.min(100,t.energy+3);this.event('block',{x:t.x,y:t.y-88,dir,color:f.color,hero:f.hero,weapon:f.info.weapon,damage});this.burst(t.x,t.y-88,'#dcecff',12);this.lastFeedback='防御 / 绕到背后寻找机会';}
 else{t.guardStun=0;const stunReduction=Math.max(0,f.combo-4)*3;t.stun=Math.max(12,m.stun-stunReduction)+(counter?4:0);t.vx=dir*m.push;t.vy=m.lift;t.attack=null;t.dash=0;t.block=false;t.buffer=null;t.flash=6;t.hurtTime=t.stun;t.animState='hurt';t.animTime=0;f.combo++;f.comboDamage+=damage;f.comboTimer=m.stun+24;f.energy=Math.min(100,f.energy+7);t.energy=Math.min(100,t.energy+5);this.shake=this.settings.shake?(name==='ultimate'?11:heavy?8:4):0;this.burst(x,t.y-88,f.color,name==='ultimate'?42:22);this.event('hit',{x:t.x,y:t.y-88,dir,color:f.color,hero:f.hero,weapon:f.info.weapon,damage,heavy,counter,combo:f.combo});this.lastFeedback=f===this.p1?`${counter?'COUNTER / ':''}${f.combo} HIT / ${f.comboDamage} 伤害${name==='launcher'?' / 挑空！按 K 追击':''}`:'受到攻击 / I 替身脱身';}
 t.hp=Math.max(0,t.hp-damage);t.lastHit=this.frame;if(this.settings.hitstop)this.freeze=Math.max(this.freeze,guarded?3:m.stop+(counter?2:0));
 }
 burst(x,y,color,n){for(let i=0;i<n;i++){const angle=Math.random()*Math.PI*2,speed=2+Math.random()*9;this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color,life:12+Math.random()*13,max:25,size:1+Math.random()*3});}}
}
root.Rift={World,FLOOR,HURT_HEIGHT,MOVES,HEROES};if(typeof module!=='undefined')module.exports=root.Rift;
})(typeof window!=='undefined'?window:globalThis);
