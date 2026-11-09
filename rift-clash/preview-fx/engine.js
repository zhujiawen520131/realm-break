(function(root){
'use strict';
const FLOOR=510,HURT_HEIGHT=135, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// One-way platforms are prototype rules; projectiles intentionally ignore them.
const PLATFORMS=Object.freeze([Object.freeze({id:'left',x:190,w:240,y:380}),Object.freeze({id:'right',x:770,w:240,y:380})]);
const FLOOR_SUPPORT=Object.freeze({id:'floor',x:0,w:1200,y:FLOOR});
const MOVES={
 slash1:{startup:5,active:5,end:23,damage:7,reach:98,height:88,stun:24,push:3,lift:0,stop:6,lunge:2.5},
 slash2:{startup:4,active:6,end:24,damage:9,reach:111,height:94,stun:26,push:4,lift:0,stop:8,lunge:3.2},
 slash3:{knockdown:true,startup:7,active:6,end:32,damage:14,reach:126,height:100,stun:30,push:9,lift:-4,stop:11,lunge:4.2},
 launcher:{startup:7,active:6,end:29,damage:10,reach:102,height:135,stun:37,push:2,lift:-13,stop:8,lunge:1.8},
 air:{startup:4,active:7,end:20,damage:8,reach:110,height:120,stun:26,push:3,lift:-5,stop:5},
 skill:{startup:12,active:1,end:32,damage:15,stop:8},
 ultimate:{startup:22,active:1,end:58,damage:39,stop:15}
};
const HEROES={
 cloud:{name:'克劳德',en:'CLOUD',source:'最终幻想',color:'#9fe9df',cloth:'#303447',hair:'#edd27d',skin:'#e4c2a2',weapon:'buster',speed:5.3,reach:1,scene:'crystal',skill:'破晄击',ultimate:'十字斩',desc:'巨剑压制 · 穿透剑气 · 十字重斩',skillHint:'向前发射剑气',ultimateHint:'近中距离的十字重斩'},
 lara:{name:'劳拉',en:'LARA CROFT',source:'古墓丽影',color:'#efc586',cloth:'#417479',hair:'#533d33',skin:'#d5a587',weapon:'bow',speed:5.9,reach:.88,scene:'tomb',skill:'蓄力箭',ultimate:'双枪连射',desc:'三段点射 · 高速箭矢 · 双枪连射',skillHint:'高速直线箭矢',ultimateHint:'连续射出六发子弹'},
 wukong:{name:'天命人',en:'DESTINED ONE',source:'黑神话：悟空',color:'#e7bb61',cloth:'#76523a',hair:'#544334',skin:'#b68b60',weapon:'staff',speed:5.4,reach:1.18,scene:'temple',skill:'定身术',ultimate:'重棍破阵',desc:'长棍控距 · 短距定身 · 延伸重棍',skillHint:'定住前方 285 范围内的对手',ultimateHint:'长距离重棍击退'},
 drake:{name:'内森·德雷克',en:'NATHAN DRAKE',source:'神秘海域',color:'#e4b395',cloth:'#a69f86',hair:'#47382f',skin:'#d3a17f',weapon:'pistol',speed:5.6,reach:.9,scene:'jungle',skill:'抛掷手雷',ultimate:'火力压制',desc:'近身搏击 · 抛物线爆炸 · 步枪齐射',skillHint:'中远距离抛物线投掷，落地爆炸',ultimateHint:'连续射出五发步枪弹'},
 tanjiro:{name:'灶门炭治郎',en:'TANJIRO',source:'鬼灭之刃',color:'#74dafa',cloth:'#277c62',hair:'#442833',skin:'#e7bda5',weapon:'water-katana',speed:5.6,reach:1.04,scene:'jungle',skill:'水之呼吸 · 水车',ultimate:'水之呼吸 · 生生流转',desc:'日轮刀连斩 · 回旋水车 · 水龙追击',skillHint:'前移回旋斩，命中后可跳跃或冲刺衔接',ultimateHint:'四段水流追击，末段击飞；消耗 100 气'},
 zenitsu:{name:'我妻善逸',en:'ZENITSU',source:'鬼灭之刃',color:'#ffe28c',cloth:'#eba437',hair:'#f3c24f',skin:'#eac6ab',weapon:'thunder-katana',speed:6.2,reach:.98,scene:'temple',skill:'雷之呼吸 · 霹雳一闪',ultimate:'霹雳一闪 · 六连',desc:'拔刀蓄势 · 雷电突进 · 六段连闪',skillHint:'短暂蓄势后直线突进拔刀，落空有收招',ultimateHint:'45° Z 字雷闪 → 垂直终结 → 弹飞倒地；可替身脱离'}
};

// Per-character timings are prototype balance values, not source-game frame data.
const BREATH_MOVES={
 tanjiro:{skill:{startup:10,active:10,end:34,reach:172,height:138,damage:18,stun:31,push:6,lift:-4,stop:8,travel:7,interval:10,style:'waterWheel'},ultimate:{startup:18,active:28,end:62,reach:180,height:140,damage:10,stun:29,push:3,lift:-2,stop:5,travel:8,interval:7,style:'waterDragon'}},
 zenitsu:{skill:{startup:14,active:8,end:38,reach:108,height:105,damage:20,stun:29,push:9,lift:-3,stop:9,travel:30,interval:8,style:'thunderDash'},ultimate:{startup:6,active:12,end:32,reach:95,height:115,damage:7,stun:30,push:0,lift:-9,stop:2,travel:40,interval:6,style:'thunderSix'}}
};
// Lara's free attacks are finite, directional bullets. IDs remain compatible
// with the three-stage input graph, but never create a melee hitbox.
const LARA_SHOTS={
 slash1:{startup:7,active:1,end:32,damage:6,stun:23,push:1.5,lift:0,stop:4,pistol:true,reach:0,lunge:0,range:420,shotSpeed:24,shotY:0},
 slash2:{startup:7,active:1,end:34,damage:8,stun:25,push:2,lift:0,stop:5,pistol:true,reach:0,lunge:0,range:420,shotSpeed:24,shotY:0},
 slash3:{knockdown:true,startup:10,active:1,end:44,damage:12,stun:30,push:8,lift:-4,stop:7,pistol:true,reach:0,lunge:0,range:440,shotSpeed:26,shotY:0},
 launcher:{startup:10,active:1,end:36,damage:8,stun:34,push:2,lift:-11,stop:6,pistol:true,reach:0,lunge:0,range:240,shotSpeed:19,shotY:-4},
 air:{startup:6,active:1,end:29,damage:7,stun:24,push:4,lift:-3,stop:4,pistol:true,reach:0,lunge:0,range:360,shotSpeed:23,shotY:12}
};
class Fighter{constructor(x,dir,hero){this.hero=HEROES[hero]?hero:'cloud';this.info=HEROES[this.hero];const color=this.info.color;Object.assign(this,{x,y:FLOOR,vx:0,vy:0,groundY:FLOOR,grounded:true,dropThroughY:null,dropThroughTicks:0,awakenLevel:0,awakenTime:0,dir,color,hp:100,energy:100,queuedSub:0,inputDir:dir,blinkTime:0,state:'idle',animState:'idle',animTime:0,hurtTime:0,landTime:0,knockdown:false,returning:false,downTime:0,downAge:0,fallTime:0,thunderDriftTicks:0,attackSerial:0,attack:null,stun:0,guardStun:0,guardReleaseTime:0,inv:0,dash:0,jumps:0,combo:0,comboDamage:0,comboTimer:0,flash:0,lastHit:0,subCD:0,airCount:0,block:false,buffer:null,trail:[]});}}
class World{
 constructor(){this.settings={hitstop:true,shake:true,debug:false,cinematics:true,platforms:false};this.width=1200;this.floorSupport=FLOOR_SUPPORT;this.spawnPoints=[360,840];this.platforms=PLATFORMS;this.reset('training');}
 setArenaGeometry({width=this.width,platforms=this.platforms,spawnPoints=this.spawnPoints}={}){
  this.width=Math.max(1200,width);this.floorSupport={id:'floor',x:0,w:this.width,y:FLOOR};
  this.platforms=platforms.map((p,i)=>({...p,id:p.id||'roof-'+i}));this.spawnPoints=spawnPoints.map(x=>clamp(x,42,this.width-42));
  for(const f of [this.p1,this.p2])if(f){f.x=clamp(f.x,42,this.width-42);f.dropThroughY=null;f.dropThroughTicks=0;f.routePlatform=null;this.refreshSupport(f);}
 }
 configureArena(options={}){this.setArenaGeometry({width:3600,platforms:[],spawnPoints:[500,900],...options});this.settings.platforms=true;this.reset();}

 reset(mode=this.mode,hero=this.p1?.hero||'cloud',opponent=this.p2?.hero||'wukong'){this.mode=mode;this.p1=new Fighter(this.spawnPoints[0],1,hero);this.p2=new Fighter(this.spawnPoints[1],-1,opponent);this.frame=0;this.freeze=0;this.shake=0;this.particles=[];this.projectiles=[];this.events=[];this.time=99;this.result=null;this.aiClock=0;this.banner=0;this.bannerText='';this.cutin=null;this.tanjiroCinematic=null;this.cinematicSerial=(this.cinematicSerial||0)+1;this.effects=[];this.scheduled=[];this.hitQueue=null;this.lastFeedback=hero==='lara'?'按 J 三段点射 / S + J 上挑射击 / 空中 J 向前下方开火':'靠近对手，连续按 J 打出三段连击';}
 // Query geometry, never cached flags: manual y/vy changes in training/tests
 // cannot accidentally grant grounded attacks, a guard or a fresh jump.
 supportAt(f){if(!f||f.vy!==0)return null;if(f.y===FLOOR)return this.floorSupport;if(!this.settings.platforms)return null;return this.platforms.find(p=>!(f.dropThroughTicks>0&&p.y===f.dropThroughY)&&f.y===p.y&&f.x>=p.x&&f.x<=p.x+p.w)||null;}
 refreshSupport(f){const support=this.supportAt(f);f.grounded=!!support;f.groundY=support?support.y:null;if(!support)f.block=false;return support;}
 landingAt(f,previousX,previousY){
  if(f.vy<0||f.y<previousY)return null;
  const surfaces=this.settings.platforms?[...this.platforms,this.floorSupport]:[this.floorSupport];
  return surfaces.filter(p=>!(f.dropThroughTicks>0&&p.id!=='floor'&&p.y===f.dropThroughY)&&previousY<=p.y&&f.y>=p.y&&f.x>=p.x&&f.x<=p.x+p.w).sort((a,b)=>a.y-b.y).find(p=>{const progress=f.y===previousY?1:(p.y-previousY)/(f.y-previousY),x=previousX+(f.x-previousX)*progress;return x>=p.x&&x<=p.x+p.w;})||null;
 }
 event(type,data={}){this.events.push({type,frame:this.frame,...data});if(this.events.length>50)this.events.shift();}
 action(f,key,inputDirection=0,modifiers={}){if(this.result||this.tanjiroCinematic)return;const direction=Math.sign(inputDirection)||f.inputDir||f.dir;if(key==='sub'){
 if(this.freeze>0||this.cutin){if(!f.queuedSub)f.queuedSub=direction;return;}
 if(f.energy<40||f.subCD>0)return;const fromX=f.x,fromY=f.y;this.burst(fromX,fromY-45,f.color,24);f.x=clamp(f.x+direction*240,42,this.width-42);f.vx=0;f.vy=0;f.stun=0;f.guardStun=0;f.guardReleaseTime=0;f.knockdown=false;f.returning=false;f.dropThroughY=null;f.dropThroughTicks=0;f.downTime=0;f.downAge=0;f.fallTime=0;f.thunderDriftTicks=0;f.attack=null;f.dash=0;f.blinkTime=8;f.inv=22;f.energy-=40;f.subCD=80;f.dir=direction;f.inputDir=direction;f.buffer=null;f.animTime=0;f.animState='dash';f.block=false;this.refreshSupport(f);this.event('sub',{x:f.x,y:f.y-55,fromX,fromY:fromY-55,dir:direction,color:f.color,hero:f.hero});this.lastFeedback='定向瞬移 / '+(direction>0?'向右':'向左')+' / 消耗 40 气力';return;}
 f.buffer={key,ttl:f.hero==='tanjiro'&&root.RiftTanjiroRules&&key==='skill'?24:12,dir:direction,...modifiers};}
 execute(f,keys){const b=f.buffer;if(!b)return;keys={...keys,...(b.down!==undefined?{down:b.down}:{}),...(b.up!==undefined?{up:b.up}:{})};const key=b.key,ground=!!this.supportAt(f);const a=f.attack;const canCancel=a&&a.hit&&a.t>=a.move.startup+2&&a.name!=='ultimate'&&(!a.move.kit||!a.move.hits||a.move.hits===1||a.kitSlots?.size>=a.move.hits);const canShotChain=f.hero==='lara'&&a?.move.pistol&&['slash1','slash2'].includes(a.name)&&a.spawned&&a.t>=a.move.startup+8;
 if(f.stun||f.dash)return;
 const kit=f.hero==='tanjiro'&&root.RiftTanjiroRules;
 if(kit&&['awaken','heavy','throw'].includes(key)&&(!a||canCancel)){if(key==='awaken'){kit.awaken(this,f);f.buffer=null;}else{f.dir=b.dir;f.inputDir=b.dir;this.begin(f,key==='heavy'&&!ground?'airheavy':key);}return;}
 if((key==='drop'||key==='jump'&&keys.down)&&ground&&this.supportAt(f).id!=='floor'&&(!a||canCancel)){this.dropThrough(f);return;}
 if(key==='jump'&&f.jumps<2&&(!a||canCancel)){f.returning=false;f.vy=ground?-13.8:-11;f.jumps++;this.refreshSupport(f);f.attack=null;f.buffer=null;this.burst(f.x,f.y,'#b3c8c2',7);this.event('jump',{x:f.x,y:f.y,color:f.color,hero:f.hero});return;}
 if(kit&&key==='dash'&&(!a||canCancel||['slash4','slash5'].includes(a.name)&&a.t<a.move.startup)){f.dir=b.dir;f.inputDir=b.dir;this.begin(f,'dashstrike');return;}
 if(key==='dash'&&(!a||canCancel)){f.returning=false;f.dir=b.dir;f.inputDir=b.dir;f.dash=13;f.inv=7;f.attack=null;f.buffer=null;f.animTime=0;this.event('dash',{x:f.x,y:f.y-50,dir:f.dir,color:f.color,hero:f.hero});return;}
 if(key==='attack'&&(!a||canCancel||canShotChain)){
 if(!kit&&a&&ground&&((!keys.down&&['slash3','launcher'].includes(a.name))||(keys.down&&a.name==='launcher')))return;
 let name=kit?kit.basic(f,a,keys,ground):ground?(keys.down?'launcher':a?.name==='slash1'?'slash2':a?.name==='slash2'?'slash3':'slash1'):'air';if(!name)return;
 if(!ground&&f.airCount>=3){f.buffer=null;return;}if(!ground)f.airCount++;
 f.dir=b.dir;f.inputDir=b.dir;this.begin(f,name);return;}
 if(key==='skill'&&(!a||canCancel)){const cost=kit&&f.awakenLevel===2?0:25;if(f.energy+0.001<cost){f.buffer=null;if(f===this.p1)this.lastFeedback='气力不足 / 角色技需要 25 气';return;}f.energy=Math.max(0,f.energy-cost);f.dir=b.dir;f.inputDir=b.dir;this.begin(f,key,kit?kit.variant({...keys,variant:b.variant},a,f):undefined);return;}

 }
 dropThrough(f){
  const surface=this.supportAt(f);if(!surface||surface.id==='floor'||f.stun||f.downTime||f.knockdown||f.dash)return false;
  f.dropThroughY=surface.y;f.dropThroughTicks=16;f.y+=2;f.vy=2;f.block=false;f.guardReleaseTime=0;f.landTime=0;f.returning=false;f.attack=null;f.buffer=null;this.refreshSupport(f);
  if(f===this.p1)this.lastFeedback='穿过脚下平台 / 空中可继续攻击或跳跃';return true;
 }
 prepareUltimate(f){const b=f.buffer,a=f.attack;if(b?.key!=='ultimate'||f.stun||f.dash||a&&!(a.hit&&a.t>=a.move.startup+2&&a.name!=='ultimate'&&(!a.move.kit||!a.move.hits||a.move.hits===1||a.kitSlots?.size>=a.move.hits)))return;
 if(f.energy+0.001<100){f.buffer=null;if(f===this.p1)this.lastFeedback='气力不足 / 奥义需要 100 气';return;}
 f.energy=0;f.dir=b.dir;f.inputDir=b.dir;this.begin(f,'ultimate');f.inv=28;this.banner=45;this.bannerText=f.info.name+' / '+(f.attack?.move.displayName||f.info.ultimate);
 if(f.hero!=='zenitsu'&&!(f.hero==='tanjiro'&&root.RiftTanjiroRules)&&this.settings.cinematics&&!this.cutin){const total=Number.isFinite(this.settings.cinematicTicks)?clamp(Math.round(this.settings.cinematicTicks),36,120):36;this.cutin={hero:f.hero,name:f.info.name,move:f.info.ultimate,color:f.color,dir:f.dir,remaining:total,total};}
 this.event('ultimate',{x:f.x,y:f.y-86,dir:f.dir,color:f.color,hero:f.hero,weapon:f.info.weapon});
 }
 begin(f,name,variant){f.returning=false;const move={...MOVES[name],...(BREATH_MOVES[f.hero]?.[name]||{}),...(f.hero==='lara'?LARA_SHOTS[name]||{}:{}),...(f.hero==='tanjiro'?root.RiftTanjiroRules?.move(f,name,variant)||{}:{})};if(move.reach)move.reach*=f.info.reach;f.attack={name,move,t:0,hit:false};f.attackSerial++;f.animTime=0;if(this.supportAt(f)&&move.lunge)f.vx=f.dir*move.lunge;f.buffer=null;f.block=false;if(f.hero==='tanjiro')root.RiftTanjiroRules?.begin(this,f,name,variant);}
 finishTanjiroCinematic(){return root.RiftTanjiroRules?.finish(this)||false;}
 ai(){const f=this.p2,p=this.p1,k={};if(this.mode!=='duel')return k;const dist=Math.abs(p.x-f.x),intent=p.x>=f.x?1:-1;k.aim=intent;this.aiClock++;
 if(f.stun&&f.energy>=40&&f.hp<70&&this.aiClock%39===0)this.action(f,'sub',intent);
 if(f.stun)return k;
 // A grounded opponent above us needs an approach/jump, not endless
 // ground attacks at the old horizontal stopping distance (especially Lara).
 const targetSupport=this.settings.platforms?this.supportAt(p):null;
 if(targetSupport&&!f.attack&&!f.dash){
  const support=this.supportAt(f),all=[...this.platforms,this.floorSupport];
  let next=all.find(q=>q.id===f.routePlatform);
  if(support&&support.id!==targetSupport.id){
   // Traverse actual architectural ledges both upwards and downwards.
   const queue=[[support]],seen=new Set([support.id]);let route=null;
   while(queue.length&&!route){const path=queue.shift(),from=path[path.length-1];for(const to of all){
    if(seen.has(to.id)||from.y-to.y>147)continue;
    const gap=Math.max(0,to.x-(from.x+from.w),from.x-(to.x+to.w));
    if(from.id!=='floor'&&to.id!=='floor'&&gap>150)continue;
    const candidate=[...path,to];seen.add(to.id);if(to.id===targetSupport.id){route=candidate;break;}queue.push(candidate);
   }}
   next=route?.[1];f.routePlatform=next?.id;
  }else if(support?.id===targetSupport.id){next=null;f.routePlatform=null;}
  if(next){
   let aimX=clamp(p.x,next.x+Math.min(40,next.w/4),next.x+next.w-Math.min(40,next.w/4));
   if(support&&next.y>support.y){
    const left=Math.max(support.x,next.x),right=Math.min(support.x+support.w,next.x+next.w);
    if(right>left){const margin=Math.min(20,(right-left)/4);aimX=clamp(p.x,left+margin,right-margin);
     if(Math.abs(f.x-aimX)<=12){this.dropThrough(f);return k;}
    }
   }
   k.left=f.x>aimX+5;k.right=f.x<aimX-5;
   const gap=f.x<next.x?next.x-f.x:f.x>next.x+next.w?f.x-next.x-next.w:0;
   if(support&&next.y<=support.y&&gap<80&&f.y-next.y<=147)this.action(f,'jump',aimX>=f.x?1:-1);
   return k;
  }
 }
 if(dist>(f.hero==='lara'?290:105)){k.left=f.x>p.x;k.right=f.x<p.x;}if(p.attack&&dist<160&&this.aiClock%100<32)k.down=true;
 if(dist<(f.hero==='lara'?430:125)&&this.aiClock%23===0)this.action(f,'attack',intent);
 if(dist>(['wukong','tanjiro','zenitsu'].includes(f.hero)?120:220)&&this.aiClock%125===0&&f.energy>=25)this.action(f,'skill',intent);
 if(dist<340&&f.energy>=100&&this.aiClock%250===0)this.action(f,'ultimate',intent);
 if(dist>260&&this.aiClock%100===0)this.action(f,'dash',intent);
 if((this.settings.platforms?p.y<f.y-75:p.y<FLOOR-75)&&dist<170&&this.aiClock%45===0)this.action(f,'jump',intent);return k;}
 step(keys={}){
 if(this.result||this.tanjiroCinematic)return;
 if(this.cutin){if(this.settings.cinematics){if(--this.cutin.remaining<=0)this.cutin=null;return;}this.cutin=null;}
 if(this.freeze>0){this.freeze--;return;}
 for(const f of [this.p1,this.p2])if(f.queuedSub){const direction=f.queuedSub;f.queuedSub=0;this.action(f,'sub',direction);}
 this.prepareUltimate(this.p1);this.prepareUltimate(this.p2);if(this.cutin)return;
 this.frame++;if(this.banner>0)this.banner--;this.shake*=.8;
 if(this.mode==='duel'){this.time=Math.max(0,99-Math.floor(this.frame/60));if(!this.time){this.finish();return;}}
 const previousX=[this.p1.x,this.p2.x],ai=this.ai();this.updateFighter(this.p1,this.p2,keys);this.updateFighter(this.p2,this.p1,ai);
 const p=this.p1,q=this.p2;
 this.advanceSixfold(p,q);this.advanceSixfold(q,p);root.RiftTanjiroRules?.advance(this);
 // Solid-body collision uses swept positions; target range never drives attack speed.
 if(!p.attack?.sixfold&&!q.attack?.sixfold&&Math.abs(p.y-q.y)<75&&!p.dash&&!q.dash&&!p.blinkTime&&!q.blinkTime){
  const order=previousX[0]<=previousX[1]?1:-1,oldGap=(previousX[1]-previousX[0])*order,newGap=(q.x-p.x)*order;
  if(oldGap>=46&&newGap<46){const fraction=clamp((oldGap-46)/(oldGap-newGap),0,1);p.x=previousX[0]+(p.x-previousX[0])*fraction;q.x=previousX[1]+(q.x-previousX[1])*fraction;}
  else if(Math.abs(p.x-q.x)<46){const mid=(p.x+q.x)/2,left=clamp(mid-23,42,this.width-88);if(order>0){p.x=left;q.x=left+46;}else{q.x=left;p.x=left+46;}}
 }
 for(const f of [p,q]){this.refreshSupport(f);if(!f.grounded&&['idle','run','guard','land'].includes(f.state)){f.state=f.animState='jump';f.animTime=0;}}
 this.hitQueue=[];this.resolveAttack(p,q);this.resolveAttack(q,p);const simultaneousHits=this.hitQueue;this.hitQueue=null;for(const args of simultaneousHits)this.applyHit(...args);if(this.tanjiroCinematic){if(this.tanjiroCinematic.actor.stun)this.tanjiroCinematic=null;else return;}if(this.cutin)return;
 for(const s of this.scheduled){s.wait--;if(s.wait<=0){if(s.owner.hp>0&&!s.owner.stun)this.spawnProjectile(s.owner,s.spec);s.done=true;}}this.scheduled=this.scheduled.filter(s=>!s.done);
 for(const b of this.projectiles){
  b.life--;b.age=(b.age||0)+1;if(b.delay>0){b.delay--;continue;}
  b.vy=(b.vy||0)+(b.gravity||0);b.x+=b.vx;b.y+=b.vy;if(b.maxTravel!==undefined){b.traveled=(b.traveled||0)+Math.hypot(b.vx,b.vy);if(b.traveled>b.maxTravel){b.dead=true;continue;}}
  const t=b.owner===p?q:p;
  const targetHeight=b.targetHeight===160?160:HURT_HEIGHT;
  const startX=b.age===1&&Number.isFinite(b.muzzlePathStartX)?b.muzzlePathStartX:b.x;
  const touches=t.x+23>Math.min(startX,b.x)-b.w/2&&t.x-23<Math.max(startX,b.x)+b.w/2&&Math.abs(b.y-(t.y-targetHeight/2))<b.h/2+targetHeight/2;
  if(b.kind==='grenade'&&(b.y>=FLOOR-6||touches||b.life<=0)){
   this.effects.push({kind:'explosion',hero:b.owner.hero,owner:b.owner,dir:b.direction||Math.sign(b.vx)||1,x:b.x,y:Math.min(FLOOR-40,b.y),color:'#ffc578',life:24,max:24});this.burst(b.x,b.y,'#ffc578',32);
   if(Math.abs(b.x-t.x)<125&&Math.abs(b.y-(t.y-45))<125&&!t.inv&&!t.downTime){this.confirmProjectile(b);this.hit(b.owner,t,b.move,b.name,b.x,{dir:t.x>=b.x?1:-1});}b.dead=true;
  }else if(!b.dead&&touches&&!t.inv&&!t.downTime&&!b.hitTargets.has(t)){
   this.confirmProjectile(b);this.hit(b.owner,t,b.move,b.name,b.x,{dir:b.vx===0?b.direction:Math.sign(b.vx)});b.hitTargets.add(t);b.dead=true;
  }
  if(b.x<-180||b.x>this.width+180)b.dead=true;
 }
 root.RiftTanjiroRules?.updateDragonEffects(this);for(const e of this.effects)e.life--;this.effects=this.effects.filter(e=>e.life>0);if(root.RiftFXData&&this.effects.length>64)this.effects.splice(0,this.effects.length-64);
 this.projectiles=this.projectiles.filter(b=>!b.dead&&b.life>0);
 for(const pt of this.particles){pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=.16;pt.life--;}
 this.particles=this.particles.filter(pt=>pt.life>0);
 if(this.mode==='training'&&this.frame-q.lastHit>180&&!q.stun){q.hp=Math.min(100,q.hp+1);}
 if(p.hp<=0||q.hp<=0){if(this.mode==='duel')this.finish();else{q.hp=100;q.stun=0;q.y=FLOOR;q.vx=0;q.vy=0;q.jumps=0;q.airCount=0;q.landTime=0;q.knockdown=false;q.returning=false;q.dropThroughY=null;q.dropThroughTicks=0;q.downTime=0;q.downAge=0;q.fallTime=0;q.thunderDriftTicks=0;q.guardStun=0;q.guardReleaseTime=0;q.block=false;q.attack=null;q.buffer=null;q.dash=0;q.animState=q.state='idle';q.animTime=0;this.refreshSupport(q);this.lastFeedback='击倒！训练对手已恢复';}}
 }
 finish(){this.result=this.p1.hp===this.p2.hp?'平局':this.p1.hp>this.p2.hp?'你赢了。':'再来一局。';this.event('end');}
 updateFighter(f,o,k){
 const previousX=f.x,previousY=f.y,previousVy=f.vy,wasBlocking=f.block;
 for(const prop of ['stun','guardStun','guardReleaseTime','blinkTime','inv','flash','subCD','comboTimer','hurtTime','landTime','downTime','dropThroughTicks'])if(f[prop]>0)f[prop]--;
 if(f.knockdown&&f.inv){f.knockdown=false;f.downTime=0;}
 if(f.knockdown){f.stun=Math.max(f.stun,2);f.fallTime++;}if(f.downTime){f.downAge++;f.stun=Math.max(f.stun,f.downTime);f.vx=0;}
 if(!f.comboTimer){f.combo=0;f.comboDamage=0;}f.energy=Math.min(100,f.energy+(this.mode==='training'?.19:.045));
 const input=Math.sign((k.right?1:0)-(k.left?1:0))||Math.sign(k.aim||0);if(input)f.inputDir=input;
 if(input&&!f.stun&&!f.attack&&!f.dash)f.dir=input;
 f.block=!!k.down&&!!this.supportAt(f)&&(!f.stun||f.guardStun>0)&&!f.attack&&!f.dash;
 if(wasBlocking&&!f.block&&!f.stun&&!f.attack&&!f.dash)f.guardReleaseTime=6;
 this.execute(f,k);if(f.buffer&&--f.buffer.ttl<=0)f.buffer=null;
 if(f.dash){f.dash--;f.vx=f.dir*17;if(!this.supportAt(f))f.vy*=.4;if(this.frame%2===0)f.trail.push({x:f.x,y:f.y,dir:f.dir,life:12,animTime:f.animTime,animState:'dash',dash:f.dash,attack:null});}
 else if(f.stun)f.vx*=.94;
 else if(f.attack){f.vx*=.65;f.attack.t++;const a=f.attack,m=a.move;if(m.style&&!a.sixfold&&a.t>=m.startup&&a.t<m.startup+m.active){f.vx=f.dir*m.travel;if(this.frame%2===0)f.trail.push({x:f.x,y:f.y,dir:f.dir,life:10,animTime:f.animTime,animState:'skill',attack:{...a,move:{...m}}});}if(a.t>=m.end)f.attack=null;}
 else{f.vx=f.block?0:((k.right?1:0)-(k.left?1:0))*f.info.speed;}
 if(f.hero==='tanjiro')root.RiftTanjiroRules?.update(this,f);
 if(f.thunderDriftTicks>0){if(--f.thunderDriftTicks===0)f.vx=0;}
 const controlled=!!f.attack?.sixfold||!!root.RiftTanjiroRules?.controlled(this,f);
 if(!controlled){f.x=clamp(f.x+f.vx,42,this.width-42);if(!this.supportAt(f)){f.vy+=f.knockdown?1:f.returning?1.2:.62;f.y+=f.vy;}
 }
 if(f.dropThroughY!==null&&(!f.dropThroughTicks||f.y>f.dropThroughY+8)){f.dropThroughY=null;f.dropThroughTicks=0;}
 const landing=controlled?null:this.landingAt(f,previousX,previousY);
 if(!controlled&&(landing||f.y>=FLOOR)){const groundY=landing?landing.y:FLOOR;f.y=groundY;f.vy=0;f.returning=false;f.jumps=0;f.airCount=0;
 if(previousY<groundY&&previousVy>2){f.landTime=7;this.event('land',{x:f.x,y:groundY,heavy:previousVy>11,color:f.color});}
 if(f.knockdown)this.landKnockdown(f,groundY);
 }else if(!controlled&&f.knockdown&&this.supportAt(f))this.landKnockdown(f,f.y);
 this.refreshSupport(f);
 const state=f.guardStun>0&&f.block?'guard':f.stun?'hurt':f.dash||f.blinkTime?'dash':f.attack?(f.attack.name==='skill'||f.attack.name==='ultimate'?'skill':'attack'):!f.grounded?'jump':f.block?'guard':Math.abs(f.vx)>1?'run':f.landTime?'land':'idle';if(state===f.animState)f.animTime++;else{f.animState=state;f.animTime=0;}f.state=state;
 f.trail.forEach(t=>t.life--);f.trail=f.trail.filter(t=>t.life>0);
 }
 landKnockdown(f,groundY){
  f.knockdown=false;f.downAge=0;f.fallTime=0;f.downTime=f.stun=Math.max(36,f.stun);f.vx=f.vy=0;f.attack=null;f.buffer=null;f.block=false;
  const thunder=f.knockdownStyle==='thunder';this.effects.push({kind:thunder?'thunderSlam':'groundSlam',x:f.x,y:groundY,life:28,max:28,color:f.color});
  this.event('knockdown',{x:f.x,y:groundY,hero:f.hero});this.shake=this.settings.shake?8:0;this.burst(f.x,groundY-10,thunder?'#ffe9ad':'#c8bd9b',24);
 }
 hitbox(f){const a=f.attack;if(!a||!a.move.reach)return null;return {x:f.x+(f.dir>0?12:-a.move.reach-12),y:f.y-a.move.height,w:a.move.reach,h:a.move.height};}
 resolveAttack(f,t){const a=f.attack;if(!a)return;const m=a.move;if(a.t<m.startup||a.t>=m.startup+m.active)return;
 if(m.kit&&root.RiftTanjiroRules?.resolve(this,f,t,a))return;
 if(m.style==='thunderSix'){this.resolveSixfold(f,t,a);return;}
 if(m.style){this.resolveBreath(f,t,a);return;}
 if(m.pistol){if(!a.spawned){a.spawned=true;this.spawnProjectile(f,{kind:'bullet',name:a.name,vx:f.dir*m.shotSpeed,vy:m.shotY,w:24,h:16,maxTravel:m.range,traveled:0,life:Math.ceil(m.range/m.shotSpeed)+2,move:{damage:m.damage,stun:m.stun,push:m.push,lift:m.lift,stop:m.stop,knockdown:!!m.knockdown}});this.lastFeedback='劳拉 / '+({slash1:'点射一段',slash2:'点射二段',slash3:'终结点射',launcher:'上挑射击',air:'空中射击'}[a.name]);}return;}
 if(a.name==='skill'||a.name==='ultimate'){if(a.spawned)return;a.spawned=true;this.special(f,t,a.name);this.event('swing',{x:f.x,y:f.y-86,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});return;}
 if(a.t===m.startup){this.event('swing',{x:f.x,y:f.y-86,color:f.color,hero:f.hero,weapon:f.info.weapon,move:a.name});if(root.RiftFXData&&f.hero!=='drake')this.effects.push({kind:'fxBasic',hero:f.hero,owner:f,x:f.x+f.dir*48,y:f.y-88,dir:f.dir,angle:a.name==='launcher'?-.55:a.name==='slash2'?.28:0,color:f.color,life:12,max:12});}if(a.hit||t.inv||t.downTime)return;
 const b=this.hitbox(f);if(b.x<t.x+23&&b.x+b.w>t.x-23&&b.y<t.y&&b.y+b.h>t.y-HURT_HEIGHT){a.hit=true;this.hit(f,t,m,a.name,t.x);}
 }
 resolveBreath(f,t,a){
 const m=a.move,index=Math.floor((a.t-m.startup)/m.interval),last=index===Math.ceil(m.active/m.interval)-1;
 if(a.effectStrike!==index){a.effectStrike=index;this.effects.push({kind:m.style,owner:f,x:f.x+f.dir*m.reach*.45,y:f.y-80,dir:f.dir,color:f.color,life:15,max:15,range:m.reach,index});this.event('breath',{x:f.x,y:f.y-70,dir:f.dir,color:f.color,hero:f.hero,weapon:f.info.weapon,heavy:last&&a.name==='ultimate'});this.lastFeedback=f.info.name+' / '+(a.name==='ultimate'?f.info.ultimate:f.info.skill);}
 a.struck=a.struck||new Set();if(a.struck.has(index)||t.inv||t.downTime)return;const b=this.hitbox(f);
 if(b.x<t.x+23&&b.x+b.w>t.x-23&&b.y<t.y&&b.y+b.h>t.y-HURT_HEIGHT){a.struck.add(index);a.hit=true;const finisher=last&&a.name==='ultimate';this.hit(f,t,{...m,damage:finisher?m.damage+5:m.damage,push:finisher?14:m.push,lift:finisher?-8:m.lift,stop:finisher?11:m.stop,finisher,knockdown:last},a.name,t.x);}
 }
 // Sixfold owns positions only after an unguarded opening hit. Its path is
 // captured once; escape/invulnerability interrupts it rather than re-locking.
 advanceSixfold(f,t){
 const a=f.attack,z=a?.sixfold;if(!z)return;
 if(f.stun||t.inv||!t.stun||t.hp<=0||f.hp<=0){if(z.path)z.path.active=false;delete a.sixfold;a.t=a.move.startup+a.move.active;f.vx=0;f.vy=0;return;}
 const elapsed=a.t-z.start,previous={x:f.x,y:f.y};
 if(elapsed>41){if(z.path)z.path.active=false;delete a.sixfold;f.returning=true;f.vy=22;this.refreshSupport(f);return;}
 if(elapsed<=3){const p=clamp(elapsed/3,0,1);f.x=z.actorX+((z.dir>0?z.left:z.right)-z.actorX)*p;f.y=z.actorY+(t.y-z.actorY)*p;z.leg=-1;z.launchY=f.y;}
 else if(elapsed<=33){
 const phase=Math.min(29,elapsed-4),leg=Math.floor(phase/6),p=(phase%6+1)/6,dir=z.dir*(leg%2?-1:1);
 const fromX=dir>0?z.left:z.right,toX=dir>0?z.right:z.left;
 f.x=fromX+(toX-fromX)*p;f.y=z.launchY-z.span*(leg+p);f.dir=dir;z.leg=leg;z.progress=p;z.previous=previous;
 if(!z.path||z.path.leg!==leg){if(z.path)z.path.active=false;z.path={kind:'thunderPath',hero:f.hero,fromX:previous.x,fromY:previous.y-70,x:f.x,y:f.y-70,life:74,max:74,leg,dir,active:true};this.effects.push(z.path);}
 z.path.x=f.x;z.path.y=f.y-70;z.path.life=74;z.path.tick=(z.path.tick||0)+1;
 if(phase%6===0){this.event('breath',{x:f.x,y:f.y-70,dir,color:f.color,hero:f.hero,weapon:f.info.weapon});this.effects.push({kind:'thunderTurn',x:previous.x,y:previous.y-70,life:16,max:16});}
 }else{
  if(!z.vertical){z.vertical={x:f.x,y:f.y};if(z.path)z.path.active=false;z.path={kind:'thunderPath',hero:f.hero,fromX:f.x,fromY:f.y-70,x:f.x,y:f.y-70,life:88,max:88,leg:5,dir:z.dir,active:true};this.effects.push(z.path);this.effects.push({kind:'thunderTurn',x:f.x,y:f.y-70,life:20,max:20});}
  z.leg=5;z.progress=(elapsed-33)/8;z.previous=previous;f.x=z.vertical.x;f.y=z.vertical.y-400*z.progress;f.dir=z.dir;
  z.path.x=f.x;z.path.y=f.y-70;z.path.life=88;z.path.tick=(z.path.tick||0)+1;
 }
 f.vx=f.vy=0;f.grounded=false;f.groundY=null;

 }
 resolveSixfold(f,t,a){
 const m=a.move,z=a.sixfold;
 if(z){
  if(z.leg<0||z.struck.has(z.leg)||t.inv||t.downTime)return;
  if(z.leg===5){
   if(Math.round(z.progress*8)===4){
    if(Math.abs(f.x-t.x)<50&&Math.abs(f.y-t.y)<100){z.struck.add(5);const push=f.x>this.width-180?-24:f.x<180?24:z.dir*24;this.hit(f,t,{...m,damage:12,stun:35,push:Math.abs(push),lift:24,stop:6,finisher:true,knockdown:true},'ultimate',t.x,{dir:Math.sign(push)});this.effects.push({kind:'thunderTurn',x:t.x,y:t.y-75,life:24,max:24});}
    else{if(z.path)z.path.active=false;delete a.sixfold;a.t=m.startup+m.active;f.vx=f.vy=0;}
   }
   return;
  }
  // Every rising stroke physically crosses the victim; one contact per leg.
  const dir=z.dir*(z.leg%2?-1:1),fromX=dir>0?z.left:z.right,toX=dir>0?z.right:z.left;
  // Strike at the nearest sampled crossing, rather than a wide proximity aura.
  const slot=clamp(Math.round((z.targetX-fromX)/(toX-fromX)*6),1,6),tick=Math.round(z.progress*6);
  if(tick===slot&&Math.abs(f.x-t.x)<=z.span/12+24&&Math.abs(f.y-t.y)<100){
   const last=z.leg===4,nextDir=-dir,nextFrom=nextDir>0?z.left:z.right,nextTo=nextDir>0?z.right:z.left;
   const nextSlot=clamp(Math.round((z.targetX-nextFrom)/(nextTo-nextFrom)*6),1,6),gap=6+nextSlot-slot;
   // Solve ordinary ballistic velocity to meet the next real diagonal crossing.
   const remaining=6-slot,flight=last?remaining+4:gap,nextY=last?z.launchY-z.span*5-200:z.launchY-z.span*(z.leg+1+nextSlot/6),lift=(nextY-t.y-.62*flight*(flight+1)/2)/flight;
   const travel=last?Math.abs(toX-t.x):0,frictionSum=Array.from({length:remaining},(_,i)=>.94**(i+1)).reduce((a,b)=>a+b,0),push=last&&remaining?travel/frictionSum:0;
   z.struck.add(z.leg);this.hit(f,t,{...m,damage:7,stun:30,push,lift,stop:1,finisher:false,knockdown:false,thunderDriftTicks:last?remaining+1:0},'ultimate',t.x);
  }else if(tick===slot){
   if(z.path)z.path.active=false;delete a.sixfold;a.t=m.startup+m.active;f.vx=f.vy=0;
  }
  return;
 }
 if(a.openingAttempted)return;
 if(!a.rushPath){a.rushPath={kind:'thunderPath',hero:f.hero,fromX:f.x-f.dir*40,fromY:f.y-70,x:f.x,y:f.y-70,life:18,max:18,leg:-1,dir:f.dir,active:true};this.effects.push(a.rushPath);}
 a.rushPath.x=f.x;a.rushPath.y=f.y-70;a.rushPath.life=18;a.rushPath.tick=(a.rushPath.tick||0)+1;
 if(t.inv||t.downTime)return;const b=this.hitbox(f);
 if(b.x<t.x+23&&b.x+b.w>t.x-23&&b.y<t.y&&b.y+b.h>t.y-HURT_HEIGHT){a.openingAttempted=true;this.hit(f,t,{...m,lift:-(Math.min(this.width-42,t.x+160)-Math.max(42,t.x-160))/6-2.17,finisher:false,knockdown:false,sixfoldOpen:a},'ultimate',t.x);}
 }
 startSixfold(f,t,a){
 const z={start:a.t,dir:f.dir,actorX:f.x,actorY:f.y,targetX:t.x,left:Math.max(42,t.x-160),right:Math.min(this.width-42,t.x+160),leg:-1,struck:new Set()};
 z.span=z.right-z.left;z.launchY=f.y;if(a.rushPath)a.rushPath.active=false;a.sixfold=z;a.hit=true;a.move={...a.move,active:a.t-a.move.startup+43,end:a.t+55};f.vx=f.vy=0;
 this.lastFeedback='霹雳一闪 / 挑空 → Z 字雷电追击';
 }
 confirmProjectile(b){if(b.name!=='ultimate'&&b.owner.attack&&b.owner.attack.name===b.name&&b.owner.attackSerial===b.castSerial)b.owner.attack.hit=true;}
 spawnProjectile(f,spec={}){
  const big=spec.name==='ultimate',muzzleY={cloud:92,lara:110,wukong:100,drake:90,tanjiro:90,zenitsu:90}[f.hero]||90,basic=!!f.attack&&f.attack.name===spec.name&&f.attack.move.pistol;
  // Preview markers describe a fixed weapon endpoint in the authored pose.
  // Neither aiming nor origin calibration reads the opponent's position.
  const calibrated=root.RiftMotionPreview?.projectileOrigin?.(f,spec.name),origin=calibrated&&Number.isFinite(calibrated.x)&&Number.isFinite(calibrated.y)?calibrated:null;
  const x=spec.x??origin?.x??f.x+f.dir*(basic?50:65),y=spec.y??origin?.y??f.y-muzzleY;
  if(spec.kind==='bullet')this.event('shot',{x:origin?x:f.x+f.dir*50,y,color:f.color,hero:f.hero,weapon:'pistol',move:spec.name,dir:Math.sign(spec.vx)||f.dir,angle:Math.atan2(spec.vy||0,Math.abs(spec.vx||0))});
  this.projectiles.push({x,y,vx:f.dir*13,vy:0,w:60,h:86,owner:f,direction:f.dir,move:{damage:15,stun:30,push:8,lift:-3,stop:8},name:big?'ultimate':'skill',castSerial:f.attackSerial,kind:'wave',life:100,dead:false,hitTargets:new Set(),age:0,...spec,...(origin?.targetHeight===160?{targetHeight:160,muzzlePathStartX:f.x+f.dir*23}:{} )});
 }
 special(f,t,name){const big=name==='ultimate',dir=f.dir;const move={knockdown:true,damage:big?39:15,stun:big?47:30,push:big?13:7,lift:big?-7:-3,stop:big?12:6};
  this.lastFeedback=f.info.name+' / '+(big?f.info.ultimate:f.info.skill);
  const direct=(range,m,kind)=>{const connected=(t.x-f.x)*dir>=-12&&(t.x-f.x)*dir<=range&&Math.abs(t.y-f.y)<125&&!t.inv&&!t.downTime;this.effects.push({kind,hero:f.hero,owner:f,connected,blocked:t.block&&t.dir===-dir,hitX:t.x,hitY:t.y-85,x:f.x+dir*range*.5,y:f.y-86,dir,color:f.color,life:22,max:22,range});if(connected){this.hit(f,t,m,name,t.x);if(f.attack)f.attack.hit=true;}};
  if(f.hero==='cloud'){
   if(big)direct(230,move,'cross');else this.spawnProjectile(f,{kind:'wave',name,move,vx:dir*14});
  }else if(f.hero==='wukong'){
   direct(big?460:285,big?{...move,push:18}:{...move,damage:5,stun:80,push:0,lift:0},big?'staff':'seal');
  }else if(f.hero==='lara'){
   if(big){for(let i=0;i<6;i++)this.scheduled.push({owner:f,wait:1+i*6,spec:{kind:'bullet',name,move:{...move,damage:9,stun:20,push:2,lift:0,stop:2,knockdown:i===5,finisher:i===5},vx:dir*23,w:36,h:14}});}else this.spawnProjectile(f,{kind:'arrow',name,move:{...move,damage:18},vx:dir*21,w:70,h:18});
  }else if(f.hero==='drake'){
   if(big){for(let i=0;i<5;i++)this.scheduled.push({owner:f,wait:1+i*7,spec:{kind:'bullet',name,move:{...move,damage:11,stun:21,push:3,lift:0,stop:3,knockdown:i===4,finisher:i===4},vx:dir*21,w:40,h:14}});}else this.spawnProjectile(f,{kind:'grenade',name,move:{...move,damage:22,stun:40,push:10,lift:-8},vx:dir*7.2,vy:-7.8,gravity:.42,w:18,h:18,life:65});
  }
 }
 hit(f,t,m,name,x,impact={}){
 if(t.downTime>0)return;
 const dir=impact.dir||f.dir,guarded=!m.unblockable&&t.block&&t.dir===-dir;const contact={dir,guarded,counter:!guarded&&!!t.attack&&t.attack.t<t.attack.move.startup};if(this.hitQueue){this.hitQueue.push([f,t,m,name,x,contact]);return;}this.applyHit(f,t,m,name,x,contact);
 }
 applyHit(f,t,m,name,x,contact){
 if(t.downTime>0)return;
 const {guarded,counter,dir}=contact;const heavy=(name==='ultimate'&&m.finisher!==false)||name==='slash3';if(!t.stun){f.combo=0;f.comboDamage=0;}const scale=Math.max(.5,1-f.combo*.06);let damage=guarded?Math.max(1,Math.floor(m.damage*.12)):Math.round(m.damage*scale*(counter?1.12:1));
 if(guarded){t.stun=Math.max(t.stun,8);t.guardStun=8;t.vx=dir*3;t.energy=Math.min(100,t.energy+3);this.event('block',{x:t.x,y:t.y-88,dir,color:f.color,hero:f.hero,weapon:f.info.weapon,move:name,damage});this.burst(t.x,t.y-88,'#dcecff',12);this.lastFeedback='防御 / 绕到背后寻找机会';}
 else{t.returning=false;t.knockdown=t.knockdown||!!m.knockdown;if(m.knockdown)t.knockdownStyle=m.style==='thunderSix'?'thunder':'impact';t.downTime=0;t.downAge=0;t.fallTime=0;t.thunderDriftTicks=m.thunderDriftTicks||0;t.guardStun=0;const stunReduction=Math.max(0,f.combo-4)*3;t.stun=Math.max(12,m.stun-stunReduction)+(counter?4:0);t.vx=dir*m.push;t.vy=m.lift;t.attack=null;t.dash=0;t.block=false;t.buffer=null;t.flash=6;t.hurtTime=t.stun;t.animState='hurt';t.animTime=0;f.combo++;f.comboDamage+=damage;f.comboTimer=m.stun+24;f.energy=Math.min(100,f.energy+7);t.energy=Math.min(100,t.energy+5);this.shake=this.settings.shake?(heavy?(name==='ultimate'?11:8):4):0;this.burst(x,t.y-88,f.color,name==='ultimate'?42:22);this.event('hit',{x:t.x,y:t.y-88,dir,color:f.color,hero:f.hero,weapon:f.info.weapon,move:name,damage,heavy,counter,combo:f.combo});this.lastFeedback=f===this.p1?`${counter?'COUNTER / ':''}${f.combo} HIT / ${f.comboDamage} 伤害${name==='launcher'?' / 挑空！按 K 追击':''}`:'受到攻击 / I 替身脱身';}
 this.refreshSupport(t);t.hp=Math.max(0,t.hp-damage);t.lastHit=this.frame;if(m.kitUltimate||m.waterSequenceHit||m.fireSequenceHit)root.RiftTanjiroRules?.afterHit(this,f,t,m,contact);
 if(m.sixfoldOpen&&f.attack===m.sixfoldOpen){if(!guarded&&t.hp>0&&!f.stun)this.startSixfold(f,t,m.sixfoldOpen);else{f.attack.t=f.attack.move.startup+f.attack.move.active;f.vx=0;}}if(this.settings.hitstop)this.freeze=Math.max(this.freeze,guarded?3:m.stop+(counter?2:0));
 }
 burst(x,y,color,n){for(let i=0;i<n;i++){const angle=Math.random()*Math.PI*2,speed=2+Math.random()*9;this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color,life:12+Math.random()*13,max:25,size:1+Math.random()*3});}if(root.RiftFXData&&this.particles.length>240)this.particles.splice(0,this.particles.length-240);}
}
root.Rift={World,FLOOR,HURT_HEIGHT,MOVES,HEROES,BREATH_MOVES,LARA_SHOTS};if(typeof module!=='undefined')module.exports=root.Rift;
})(typeof window!=='undefined'?window:globalThis);
