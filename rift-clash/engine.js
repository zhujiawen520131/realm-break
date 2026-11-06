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
 tanjiro:{name:'灶门炭治郎',en:'TANJIRO',source:'鬼灭之刃',color:'#74dafa',cloth:'#277c62',hair:'#442833',skin:'#e7bda5',weapon:'water-katana',speed:5.6,reach:1.04,scene:'jungle',skill:'水之呼吸 · 水车',ultimate:'水之呼吸 · 生生流转',desc:'日轮刀连斩 · 回旋水车 · 水龙追击',skillHint:'前移回旋斩，命中后可跳跃或冲刺衔接',ultimateHint:'四段水流追击，末段击飞；消耗 100 气'},
 zenitsu:{name:'我妻善逸',en:'ZENITSU',source:'鬼灭之刃',color:'#ffe28c',cloth:'#eba437',hair:'#f3c24f',skin:'#eac6ab',weapon:'thunder-katana',speed:6.2,reach:.98,scene:'temple',skill:'雷之呼吸 · 霹雳一闪',ultimate:'霹雳一闪 · 六连',desc:'拔刀蓄势 · 雷电突进 · 六段连闪',skillHint:'短暂蓄势后直线突进拔刀，落空有收招',ultimateHint:'锁定出招方向连续六斩，可防御或替身脱离'}
};

// Per-character timings are prototype balance values, not source-game frame data.
const BREATH_MOVES={
 tanjiro:{skill:{startup:10,active:10,end:34,reach:172,height:138,damage:18,stun:31,push:6,lift:-4,stop:8,travel:7,interval:10,style:'waterWheel'},ultimate:{startup:18,active:28,end:62,reach:180,height:140,damage:10,stun:29,push:3,lift:-2,stop:5,travel:8,interval:7,style:'waterDragon'}},
 zenitsu:{skill:{startup:14,active:8,end:38,reach:108,height:105,damage:20,stun:29,push:9,lift:-3,stop:9,travel:30,interval:8,style:'thunderDash'},ultimate:{startup:20,active:30,end:68,reach:120,height:115,damage:7,stun:24,push:2,lift:0,stop:3,travel:16,interval:5,style:'thunderSix'}}
};
class Fighter{constructor(x,dir,hero){this.hero=HEROES[hero]?hero:'cloud';this.info=HEROES[this.hero];const color=this.info.color;Object.assign(this,{x,y:FLOOR,vx:0,vy:0,dir,color,hp:100,energy:100,queuedSub:0,inputDir:dir,blinkTime:0,state:'idle',animState:'idle',animTime:0,hurtTime:0,landTime:0,attackSerial:0,attack:null,stun:0,guardStun:0,guardReleaseTime:0,inv:0,dash:0,jumps:0,combo:0,comboDamage:0,comboTimer:0,flash:0,lastHit:0,subCD:0,airCount:0,block:false,buffer:null,trail:[]});}}
class World{
 constructor(){this.settings={hitstop:true,shake:true,debug:false,cinematics:true};this.reset('training');}
 reset(mode=this.mode,hero=this.p1?.hero||'cloud',opponent=this.p2?.hero||'wukong'){this.mode=mode;this.p1=new Fighter(360,1,hero);this.p2=new Fighter(840,-1,opponent);this.frame=0;this.freeze=0;this.shake=0;this.particles=[];this.projectiles=[];this.events=[];this.time=99;this.result=null;this.aiClock=0;this.banner=0;this.bannerText='';this.cutin=null;this.effects=[];this.scheduled=[];this.hitQueue=null;this.lastFeedback='靠近对手，连续按 J 打出三段连击';}
 event(type,data={}){this.events.push({type,frame:this.frame,...data});if(this.events.length>50)this.events.shift();}
 action(f,key,inputDirection=0){if(this.result)return;const direction=Math.sign(inputDirection)||f.inputDir||f.dir;if(key==='sub'){
 if(this.freeze>0||this.cutin){if(!f.queuedSub)f.queuedSub=direction;return;}
 if(f.energy<40||f.subCD>0)return;const fromX=f.x,fromY=f.y;this.burst(fromX,fromY-45,f.color,24);f.x=clamp(f.x+direction*240,42,1158);f.vx=0;f.vy=0;f.stun=0;f.guardStun=0;f.guardReleaseTime=0;f.attack=null;f.dash=0;f.blinkTime=8;f.inv=22;f.energy-=40;f.subCD=80;f.dir=direction;f.inputDir=direction;f.buffer=null;f.animTime=0;f.animState='dash';this.event('sub',{x:f.x,y:f.y-55,fromX,fromY:fromY-55,dir:direction,color:f.color,hero:f.hero});this.lastFeedback='定向瞬移 / '+(direction>0?'向右':'向左')+' / 消耗 40 气力';return;}
 f.buffer={key,ttl:12,dir:direction};}
 execute(f,keys){const b=f.buffer;if(!b)return;const key=b.key,ground=f.y>=FLOOR;const a=f.attack;const canCancel=a&&a.hit&&a.t>=a.move.startup+2&&a.name!=='ultimate';
 if(f.stun||f.dash)return;
 if(key==='jump'&&f.jumps<2&&(!a||canCancel)){f.vy=ground?-13.8:-11;f.jumps++;f.attack=null;f.buffer=null;this.burst(f.x,f.y,'#b3c8c2',7);this.event('jump',{x:f.x,y:f.y,color:f.color,hero:f.hero});return;}
 if(key==='dash'&&(!a||canCancel)){f.dir=b.dir;f.inputDir=b.dir;f.dash=13;f.inv=7;f.attack=null;f.buffer=null;f.animTime=0;this.event('dash',{x:f.x,y:f.y-50,dir:f.dir,color:f.color,hero:f.hero});return;}
 if(key==='attack'&&(!a||canCancel)){
 if(a&&ground&&((!keys.down&&['slash3','launcher'].includes(a.name))||(keys.down&&a.name==='launcher')))return;
 let name=ground?(keys.down?'launcher':a?.name==='slash1'?'slash2':a?.name==='slash2'?'slash3':'slash1'):'air';
 if(!ground&&f.airCount>=3){f.buffer=null;return;}if(!ground)f.airCount++;
 f.dir=b.dir;f.inputDir=b.dir;this.begin(f,name);return;}
 if(key==='skill'&&(!a||canCancel)){if(f.energy+0.001<25){f.buffer=null;if(f===this.p1)this.lastFeedback='气力不足 / 角色技需要 25 气';return;}f.energy=Math.max(0,f.energy-25);f.dir=b.dir;f.inputDir=b.dir;this.begin(f,key);return;}

 }
 prepareUltimate(f){const b=f.buffer,a=f.attack;if(b?.key!=='ultimate'||f.stun||f.dash||a&&!(a.hit&&a.t>=a.move.startup+2&&a.name!=='ultimate'))return;
 if(f.energy+0.001<100){f.buffer=null;if(f===this.p1)this.lastFeedback='气力不足 / 奥义需要 100 气';return;}
 f.energy=0;f.dir=b.dir;f.inputDir=b.dir;this.begin(f,'ultimate');f.inv=28;this.banner=45;this.bannerText=f.info.name+' / '+f.info.ultimate;
 if(this.settings.cinematics&&!this.cutin)this.cutin={hero:f.hero,name:f.info.name,move:f.info.ultimate,color:f.color,dir:f.dir,remaining:36,total:36};
 this.event('ultimate',{x:f.x,y:f.y-86,dir:f.dir,color:f.color,hero:f.hero,weapon:f.info.weapon});
 }
 begin(f,name){const move={...MOVES[name],...(BREATH_MOVES[f.hero]?.[name]||{})};if(move.reach)move.reach*=f.info.reach;f.attack={name,move,t:0,hit:false};f.attackSerial++;f.animTime=0;if(f.y>=FLOOR&&move.lunge)f.vx=f.dir*move.lunge;f.buffer=null;f.block=false;}
 ai(){const f=this.p2,p=this.p1,k={};if(this.mode!=='duel')return k;const dist=Math.abs(p.x-f.x),intent=p.x>=f.x?1:-1;k.aim=intent;this.aiClock++;
 if(f.stun&&f.energy>=40&&f.hp<70&&this.aiClock%39===0)this.action(f,'sub',intent);
 if(f.stun)return k;
 if(dist>105){k.left=f.x>p.x;k.right=f.x<p.x;}if(p.attack&&dist<160&&this.aiClock%100<32)k.down=true;
 if(dist<125&&this.aiClock%23===0)this.action(f,'attack',intent);
 if(dist>(['wukong','tanjiro','zenitsu'].includes(f.hero)?120:220)&&this.aiClock%125===0&&f.energy>=25)this.action(f,'skill',intent);
 if(dist<340&&f.energy>=100&&this.aiClock%250===0)this.action(f,'ultimate',intent);
 if(dist>260&&this.aiClock%100===0)this.action(f,'dash',intent);
 if(p.y<FLOOR-75&&dist<170&&this.aiClock%45===0)this.action(f,'jump',intent);return k;}
 step(keys={}){
 if(this.result)return;
 if(this.cutin){if(this.settings.cinematics){if(--this.cutin.remaining<=0)this.cutin=null;return;}this.cutin=null;}
 if(this.freeze>0){this.freeze--;return;}
 for(const f of [this.p1,this.p2])if(f.queuedSub){const direction=f.queuedSub;f.queuedSub=0;this.action(f,'sub',direction);}
 this.prepareUltimate(this.p1);this.prepareUltimate(this.p2);if(this.cutin)return;
 this.frame++;if(this.banner>0)this.banner--;this.shake*=.8;
 if(this.mode==='duel'){this.time=Math.max(0,99-Math.floor(this.frame/60));if(!this.time){this.finish();return;}}
 const previousX=[this.p1.x,this.p2.x],ai=this.ai();this.updateFighter(this.p1,this.p2,keys);this.updateFighter(this.p2,this.p1,ai);
 const p=this.p1,q=this.p2;
 // Solid-body collision uses swept positions; target range never drives attack speed.
 if(Math.abs(p.y-q.y)<75&&!p.dash&&!q.dash&&!p.blinkTime&&!q.blinkTime){
  const order=previousX[0]<=previousX[1]?1:-1,oldGap=(previousX[1]-previousX[0])*order,newGap=(q.x-p.x)*order;
  if(oldGap>=46&&newGap<46){const fraction=clamp((oldGap-46)/(oldGap-newGap),0,1);p.x=previousX[0]+(p.x-previousX[0])*fraction;q.x=previousX[1]+(q.x-previousX[1])*fraction;}
  else if(Math.abs(p.x-q.x)<46){const mid=(p.x+q.x)/2,left=clamp(mid-23,42,1112);if(order>0){p.x=left;q.x=left+46;}else{q.x=left;p.x=left+46;}}
 }
 this.hitQueue=[];this.resolveAttack(p,q);this.resolveAttack(q,p);const simultaneousHits=this.hitQueue;this.hitQueue=null;for(const args of simultaneousHits)this.applyHit(...args);
 for(const s of this.scheduled){s.wait--;if(s.wait<=0){if(s.owner.hp>0&&!s.owner.stun)this.spawnProjectile(s.owner,s.spec);s.done=true;}}this.scheduled=this.scheduled.filter(s=>!s.done);
 for(const b of this.projectiles){
  b.life--;b.age=(b.age||0)+1;if(b.delay>0){b.delay--;continue;}
  b.vy=(b.vy||0)+(b.gravity||0);b.x+=b.vx;b.y+=b.vy;
  const t=b.owner===p?q:p;
  const touches=Math.abs(b.x-t.x)<b.w/2+23&&Math.abs(b.y-(t.y-HURT_HEIGHT/2))<b.h/2+HURT_HEIGHT/2;
  if(b.kind==='grenade'&&(b.y>=FLOOR-6||touches||b.life<=0)){
   this.effects.push({kind:'explosion',x:b.x,y:Math.min(FLOOR-40,b.y),color:'#ffc578',life:24,max:24});this.burst(b.x,b.y,'#ffc578',32);
   if(Math.abs(b.x-t.x)<125&&Math.abs(b.y-(t.y-45))<125&&!t.inv){this.confirmProjectile(b);this.hit(b.owner,t,b.move,b.name,b.x,{dir:t.x>=b.x?1:-1});}b.dead=true;
  }else if(!b.dead&&touches&&!t.inv&&!b.hitTargets.has(t)){
   this.confirmProjectile(b);this.hit(b.owner,t,b.move,b.name,b.x,{dir:b.vx===0?b.direction:Math.sign(b.vx)});b.hitTargets.add(t);b.dead=true;
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
 const previousY=f.y,previousVy=f.vy,wasBlocking=f.block;
 for(const prop of ['stun','guardStun','guardReleaseTime','blinkTime','inv','flash','subCD','comboTimer','hurtTime','landTime'])if(f[prop]>0)f[prop]--;
 if(!f.comboTimer){f.combo=0;f.comboDamage=0;}f.energy=Math.min(100,f.energy+(this.mode==='training'?.19:.045));
 const input=Math.sign((k.right?1:0)-(k.left?1:0))||Math.sign(k.aim||0);if(input)f.inputDir=input;
 if(input&&!f.stun&&!f.attack&&!f.dash)f.dir=input;
 f.block=!!k.down&&f.y>=FLOOR&&(!f.stun||f.guardStun>0)&&!f.attack&&!f.dash;
 if(wasBlocking&&!f.block&&!f.stun&&!f.attack&&!f.dash)f.guardReleaseTime=6;
 this.execute(f,k);if(f.buffer&&--f.buffer.ttl<=0)f.buffer=null;
 if(f.dash){f.dash--;f.vx=f.dir*17;if(f.y<FLOOR)f.vy*=.4;if(this.frame%2===0)f.trail.push({x:f.x,y:f.y,dir:f.dir,life:12,animTime:f.animTime,animState:'dash',dash:f.dash,attack:null});}
 else if(f.stun)f.vx*=.94;
 else if(f.attack){f.vx*=.65;f.attack.t++;const a=f.attack,m=a.move;if(m.style&&a.t>=m.startup&&a.t<m.startup+m.active){f.vx=f.dir*m.travel;if(this.frame%2===0)f.trail.push({x:f.x,y:f.y,dir:f.dir,life:10,animTime:f.animTime,animState:'skill',attack:{...a,move:{...m}}});}if(a.t>=m.end)f.attack=null;}
 else{f.vx=f.block?0:((k.right?1:0)-(k.left?1:0))*f.info.speed;}
 f.x=clamp(f.x+f.vx,42,1158);if(f.y<FLOOR||f.vy<0){f.vy+=.62;f.y+=f.vy;}
 if(f.y>=FLOOR){f.y=FLOOR;f.vy=0;f.jumps=0;f.airCount=0;if(previousY<FLOOR&&previousVy>2){f.landTime=7;this.event('land',{x:f.x,y:FLOOR,heavy:previousVy>11,color:f.color});}}
 const state=f.guardStun>0&&f.block?'guard':f.stun?'hurt':f.dash||f.blinkTime?'dash':f.attack?(f.attack.name==='skill'||f.attack.name==='ultimate'?'skill':'attack'):f.y<FLOOR?'jump':f.block?'guard':Math.abs(f.vx)>1?'run':f.landTime?'land':'idle';if(state===f.animState)f.animTime++;else{f.animState=state;f.animTime=0;}f.state=state;
 f.trail.forEach(t=>t.life--);f.trail=f.trail.filter(t=>t.life>0);
 }
 hitbox(f){const a=f.attack;if(!a||!a.move.reach)return null;return {x:f.x+(f.dir>0?12:-a.move.reach-12),y:f.y-a.move.height,w:a.move.reach,h:a.move.height};}
 resolveAttack(f,t){const a=f.attack;if(!a)return;const m=a.move;if(a.t<m.startup||a.t>=m.startup+m.active)return;
 if(m.style){this.resolveBreath(f,t,a);return;}
 if(a.name==='skill'||a.name==='ultimate'){if(a.spawned)return;a.spawned=true;this.special(f,t,a.name);this.event('swing',{x:f.x,y:f.y-86,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});return;}
 if(a.t===m.startup)this.event('swing',{x:f.x,y:f.y-86,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});if(a.hit||t.inv)return;
 const b=this.hitbox(f);if(b.x<t.x+23&&b.x+b.w>t.x-23&&b.y<t.y&&b.y+b.h>t.y-HURT_HEIGHT){a.hit=true;this.hit(f,t,m,a.name,t.x);}
 }
 resolveBreath(f,t,a){
 const m=a.move,index=Math.floor((a.t-m.startup)/m.interval),last=index===Math.ceil(m.active/m.interval)-1;
 if(a.effectStrike!==index){a.effectStrike=index;this.effects.push({kind:m.style,x:f.x+f.dir*m.reach*.45,y:f.y-80,dir:f.dir,color:f.color,life:15,max:15,range:m.reach,index});this.event('breath',{x:f.x,y:f.y-70,dir:f.dir,color:f.color,hero:f.hero,weapon:f.info.weapon,heavy:last&&a.name==='ultimate'});this.lastFeedback=f.info.name+' / '+(a.name==='ultimate'?f.info.ultimate:f.info.skill);}
 a.struck=a.struck||new Set();if(a.struck.has(index)||t.inv)return;const b=this.hitbox(f);
 if(b.x<t.x+23&&b.x+b.w>t.x-23&&b.y<t.y&&b.y+b.h>t.y-HURT_HEIGHT){a.struck.add(index);a.hit=true;const finisher=last&&a.name==='ultimate';this.hit(f,t,{...m,damage:finisher?m.damage+5:m.damage,push:finisher?14:m.push,lift:finisher?-8:m.lift,stop:finisher?11:m.stop,finisher},a.name,t.x);}
 }
 confirmProjectile(b){if(b.name!=='ultimate'&&b.owner.attack&&b.owner.attack.name===b.name&&b.owner.attackSerial===b.castSerial)b.owner.attack.hit=true;}
 spawnProjectile(f,spec={}){const big=spec.name==='ultimate',muzzleY={cloud:92,lara:110,wukong:100,drake:90,tanjiro:90,zenitsu:90}[f.hero]||90;if(spec.kind==='bullet')this.event('shot',{x:f.x+f.dir*50,y:f.y-muzzleY,color:f.color,hero:f.hero,weapon:'pistol'});this.projectiles.push({x:f.x+f.dir*65,y:f.y-muzzleY,vx:f.dir*13,vy:0,w:60,h:86,owner:f,direction:f.dir,move:{damage:15,stun:30,push:8,lift:-3,stop:8},name:big?'ultimate':'skill',castSerial:f.attackSerial,kind:'wave',life:100,dead:false,hitTargets:new Set(),age:0,...spec});}
 special(f,t,name){const big=name==='ultimate',dir=f.dir;const move={damage:big?39:15,stun:big?47:30,push:big?13:7,lift:big?-7:-3,stop:big?12:6};
  this.lastFeedback=f.info.name+' / '+(big?f.info.ultimate:f.info.skill);
  const direct=(range,m,kind)=>{this.effects.push({kind,x:f.x+dir*range*.5,y:f.y-86,dir,color:f.color,life:22,max:22,range});if((t.x-f.x)*dir>=-12&&(t.x-f.x)*dir<=range&&Math.abs(t.y-f.y)<125&&!t.inv){this.hit(f,t,m,name,t.x);if(f.attack)f.attack.hit=true;}};
  if(f.hero==='cloud'){
   if(big)direct(230,move,'cross');else this.spawnProjectile(f,{kind:'wave',name,move,vx:dir*14});
  }else if(f.hero==='wukong'){
   direct(big?460:285,big?{...move,push:18}:{...move,damage:5,stun:80,push:0,lift:0},big?'staff':'seal');
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
 const {guarded,counter,dir}=contact;const heavy=(name==='ultimate'&&m.finisher!==false)||name==='slash3';if(!t.stun){f.combo=0;f.comboDamage=0;}const scale=Math.max(.5,1-f.combo*.06);let damage=guarded?Math.max(1,Math.floor(m.damage*.12)):Math.round(m.damage*scale*(counter?1.12:1));
 if(guarded){t.stun=Math.max(t.stun,8);t.guardStun=8;t.vx=dir*3;t.energy=Math.min(100,t.energy+3);this.event('block',{x:t.x,y:t.y-88,dir,color:f.color,hero:f.hero,weapon:f.info.weapon,damage});this.burst(t.x,t.y-88,'#dcecff',12);this.lastFeedback='防御 / 绕到背后寻找机会';}
 else{t.guardStun=0;const stunReduction=Math.max(0,f.combo-4)*3;t.stun=Math.max(12,m.stun-stunReduction)+(counter?4:0);t.vx=dir*m.push;t.vy=m.lift;t.attack=null;t.dash=0;t.block=false;t.buffer=null;t.flash=6;t.hurtTime=t.stun;t.animState='hurt';t.animTime=0;f.combo++;f.comboDamage+=damage;f.comboTimer=m.stun+24;f.energy=Math.min(100,f.energy+7);t.energy=Math.min(100,t.energy+5);this.shake=this.settings.shake?(heavy?(name==='ultimate'?11:8):4):0;this.burst(x,t.y-88,f.color,name==='ultimate'?42:22);this.event('hit',{x:t.x,y:t.y-88,dir,color:f.color,hero:f.hero,weapon:f.info.weapon,damage,heavy,counter,combo:f.combo});this.lastFeedback=f===this.p1?`${counter?'COUNTER / ':''}${f.combo} HIT / ${f.comboDamage} 伤害${name==='launcher'?' / 挑空！按 K 追击':''}`:'受到攻击 / I 替身脱身';}
 t.hp=Math.max(0,t.hp-damage);t.lastHit=this.frame;if(this.settings.hitstop)this.freeze=Math.max(this.freeze,guarded?3:m.stop+(counter?2:0));
 }
 burst(x,y,color,n){for(let i=0;i<n;i++){const angle=Math.random()*Math.PI*2,speed=2+Math.random()*9;this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color,life:12+Math.random()*13,max:25,size:1+Math.random()*3});}}
}
root.Rift={World,FLOOR,HURT_HEIGHT,MOVES,HEROES,BREATH_MOVES};if(typeof module!=='undefined')module.exports=root.Rift;
})(typeof window!=='undefined'?window:globalThis);
