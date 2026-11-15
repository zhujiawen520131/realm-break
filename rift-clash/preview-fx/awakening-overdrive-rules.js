(function(root){
'use strict';
// Original arena choreography. The ordinary, reviewed kits remain untouched.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const RAW={
 cloud:{family:'mako',names:[['魔晄剑潮','升空剑阵','环刃裂地','陨剑重劈','零距剑阵','天翔十字剑阵'],['极限剑雨','苍穹六刃','破界剑域','陨星断界','极限连锁','超究武神霸斩']],patterns:[['wave','rise','sweep','slam','pummel'],['rain','riseOrbit','clone','doubleSlam','rush']]},
 lara:{family:'arrow',names:[['爆裂箭连射','空翻双枪雨','侧跃封锁','爆裂重箭','零距双枪','猎手空中围剿'],['爆破箭幕','空翻交叉弹幕','后跃爆破阵','贯穿集束箭','回旋压制射击','生存本能·爆破天幕']],patterns:[['arrowBurst','leapVolley','retreatVolley','chargedArrow','volley'],['rain','orbitVolley','minefield','doubleSlam','leapVolley']]},
 wukong:{family:'staff',names:[['巨棍穿阵','分身挑棍','棍影横扫','立棍坠击','分身围打','法天棍阵'],['毫毛万棍','擎天棍升','分身八方阵','巨棍震岳','万钧锁击','法天象地·镇界']],patterns:[['clone','rise','sweep','slam','pummel'],['wave','riseOrbit','clone','doubleSlam','rush']]},
 drake:{family:'explosive',names:[['战术连环雷','跃射轰炸','交叉火力','重型爆破','近身突击连发','遗迹火力封锁'],['集束爆破潮','空中火力走廊','延时爆破阵','毁灭爆破','翻身压制弹幕','绝境反击·连环轰炸']],patterns:[['lob','leapVolley','volley','slam','volley'],['rain','orbitVolley','minefield','doubleSlam','retreatVolley']]},
 tanjiro:{family:'breath',names:[['巨水龙奔流','水轮升天','水涡重瀑','水轮坠斩','奔流连式','水龙回天·生生流转'],['火龙巡游','炎舞升龙','火神交错连斩','灼骨阳炎坠','火龙咬斩','火之神神乐·双龙环舞']],patterns:[['wave','riseOrbit','roots','slam','rush'],['rush','rise','clone','doubleSlam','pummel']]},
 zenitsu:{family:'thunder',names:[['雷霆三疾走','雷龙升闪','雷环回旋','落雷重斩','疾雷近闪','霹雳一闪·雷霆追击'],['雷霆六疾走','霹雳升龙','八方雷域','天雷坠击','神速连闪','霹雳一闪·神速雷狱']],patterns:[['rush','rise','sweep','slam','pummel'],['zigzag','riseOrbit','clone','doubleSlam','rush']]},
 manan:{family:'terrain',names:[['石林推浪','悬庭阶升','根脉升林','遗构重砸','岩壁围击','造境·浮城崩落'],['群峰造陆','天阶建城','根脉石林界','群山倾覆','断层锁击','世界重构·万象坠城']],patterns:[['wave','rise','roots','slam','pummel'],['rain','riseOrbit','forest','doubleSlam','clone']]},
 luffy:{family:'rubber',names:[['二档机关枪','火拳上冲','橡胶旋风腿','巨斧坠击','橡胶连打','二档·巨拳机关枪'],['五档巨人机关拳','弹力天升','巨人战斧','巨人雷霆踩踏','五档弹跳连拳','五档·自由巨拳']],patterns:[['pummel','rise','sweep','slam','rush'],['giantFists','riseOrbit','doubleSlam','bounceSlam','zigzag']]},
 kirito:{family:'swords',names:[['音速双剑连斩','双刃升击','星环横斩','双剑重坠','零距二刀流','星爆气流斩·升空十六连'],['星辰交叉突进','星爆螺旋升斩','双剑星域','流星交叉坠','双剑高速连锁','星爆气流斩·星域十六连']],patterns:[['rush','rise','sweep','slam','pummel'],['zigzag','riseOrbit','clone','doubleSlam','rush']]},
 naruto:{family:'chakra',names:[['分身螺旋丸','影分身升击','螺旋手里剑','大玉坠击','分身体术连打','仙法·分身螺旋连弹'],['九喇嘛查克拉冲击','尾兽升龙','尾兽查克拉风暴','尾兽玉坠击','九尾之爪连击','九喇嘛·尾兽螺旋冲击']],patterns:[['rush','rise','wave','slam','clone'],['wave','riseOrbit','rain','doubleSlam','giantFists']]}
};
const HINT={wave:'多段实体能量沿操控方向推进',rain:'在出招方向固定区域形成自上而下的连续攻击',rise:'真实跃升、挑空后继续追击',riseOrbit:'高弧跃升并横移，攻击覆盖逐段改变',sweep:'围绕身体横扫，末段弹开倒地',clone:'分身或实体攻击依次占据不同固定位置',slam:'跃起后向下重砸',doubleSlam:'跃起、下砸、地面二次冲击',bounceSlam:'大幅弹跳后连续地面冲击',pummel:'多段近中距离连击',rush:'沿输入方向突进并连续命中',zigzag:'短距离来回折返连击，不追踪敌人',giantFists:'巨拳从近到远依次展开',roots:'锁定敌人脚下真实表面后升起攻击',forest:'敌脚固定根点向两侧扩展石林',arrowBurst:'连续爆裂实体箭，命中后冲击扩散',chargedArrow:'短蓄力后直射重型爆裂箭，沿途命中并击飞倒地',lob:'抛物线连环爆破',volley:'多发真实定向弹幕',leapVolley:'跃起后斜下方连续射击',orbitVolley:'高弧空翻横移并交叉射击',retreatVolley:'后跃拉开距离后连续开火',minefield:'前方固定位置的延迟连续爆破'};
const MODE_NAMES={cloud:['极限蓄势·魔晄剑阵','极限解放·超究武神'],lara:['猎手专注·爆裂武装','生存本能·空翻弹幕'],wukong:['凝聚神力·分身棍阵','神力化身·法天象地'],drake:['战术专注·火力封锁','绝境反击·连环爆破'],tanjiro:['全集中·巨龙水之呼吸','火之神神乐·火龙'],zenitsu:['雷之呼吸·雷霆疾走','雷之呼吸·神速雷狱'],manan:['实时构筑·悬庭造境','世界重构·根脉石林'],luffy:['二档·喷气机关拳','五档·自由巨人'],kirito:['二刀流·剑技解放','剑技极限·星爆领域'],naruto:['仙人模式·分身连式','九喇嘛查克拉模式']};
const CATALOG=Object.fromEntries(Object.entries(RAW).map(([hero,p])=>[hero,{family:p.family,modes:p.names.map((n,i)=>({name:MODE_NAMES[hero][i],skills:n.slice(0,3).map((name,j)=>({name,hint:HINT[p.patterns[i][j]]})),heavy:n[3],throw:n[4],ultimate:n[5]}))}]));
function applies(f){return !!RAW[f?.hero]&&f.awakenLevel>0;}
function slot(name,id){if(name==='skill'){if(['skill2','waterfall','flash'].includes(id))return 1;if(['skill3','whirlpool','airspin'].includes(id))return 2;return 0;}return name==='heavy'||name==='airheavy'?3:name==='throw'?4:name==='ultimate'?5:-1;}
function expectedUltimateHits(hero,mode){return hero==='zenitsu'?(mode===2?17:12):hero==='kirito'?16:mode===2?13:9;}
function move(f,name,id){
 const k=slot(name,id);if(!applies(f)||k<0)return null;const mode=f.awakenLevel,full=mode===2,p=RAW[f.hero],pattern=k===5?'ultimate':p.patterns[mode-1][k],gun=['lara','drake'].includes(f.hero);
 let m={overdrive:true,overdriveMode:mode,awakenMode:mode,overdriveFamily:p.family,overdriveSlot:k,pattern,kit:true,animeTrioKit:false,animeKit:false,mananKit:false,rosterKit:false,zenitsuKit:false,bvnSignature:false,fire:false,style:null,projectile:null,pistol:false,throw:false,unblockable:false,lunge:0,travel:0,rootEruption:false,kitUltimate:false,mananOpen:false,variant:id,clipId:k===0?'skill':k===1?'skill2':k===2?'skill3':k===3?'heavy':k===4?'throw':'ultimate',displayName:p.names[mode-1][k],startup:k===3?20:10,interval:full?5:7,hits:full?5:3,damage:full?8:10,reach:k===4?125:full?300:220,height:full?300:220,stun:30,push:1,lift:0,stop:3,finalPush:full?17:12,finalLift:-10,knockdown:true};
 if(['wave','rain','arrowBurst','chargedArrow','lob','volley','leapVolley','orbitVolley','retreatVolley'].includes(pattern)){m.hits=['volley','leapVolley','orbitVolley','retreatVolley'].includes(pattern)?(full?9:6):(full?5:3);m.damage=Math.round(37/m.hits*10)/10;m.range=full?950:650;m.projectileSpeed=full?23:18;}
 if(pattern==='chargedArrow'){m.hits=1;m.startup=24;m.damage=36;m.range=850;m.projectileSpeed=30;m.finalPush=18;m.finalLift=-14;}
 if(['rise','riseOrbit'].includes(pattern)){m.jump=full?-18:-14;m.finalLift=full?-18:-15;m.height=full?370:280;}
 if(['slam','doubleSlam','bounceSlam'].includes(pattern)){m.hits=full?4:2;m.startup=24;m.interval=pattern==='bounceSlam'?12:7;m.jump=pattern==='bounceSlam'?-20:-13;m.damage=11;m.finalLift=9;}
 if(['pummel','rush','zigzag','giantFists'].includes(pattern)){m.hits=full?7:4;m.damage=6;m.reach=pattern==='giantFists'?600:k===4?145:250;m.travelDistance=full?300:180;}
 if(['roots','forest','minefield'].includes(pattern)){m.hits=full?5:3;m.startup=16;m.reach=full?460:300;m.rootRadius=full?140:90;m.height=full?440:300;m.finalLift=full?-23:-18;}
 if(pattern==='clone'){m.hits=full?6:4;m.reach=full?440:310;m.damage=7;}
 if(['leapVolley','orbitVolley','retreatVolley'].includes(pattern)){m.startup=22;m.jump=pattern==='retreatVolley'?-8:full?-16:-12;m.damage=5;}
 if(k===4&&gun){m.pattern=full?'retreatVolley':'volley';m.hits=full?7:5;m.range=450;m.projectileSpeed=25;m.startup=full?18:8;m.jump=full?-7:0;m.damage=6;}
 if(k===5){m={...m,overdriveOpen:true,pattern:'ultimate',startup:14,interval:1,hits:1,damage:4,reach:gun?0:210,height:185,active:8,end:44,knockdown:false,finalPush:0,finalLift:0,stun:45,stop:3,gunOpener:gun};
  if(f.hero==='zenitsu')return {...m,overdriveZen:true,overdriveOpen:false,style:'thunderSix',startup:6,active:12,end:32,damage:7,reach:95,height:115,stun:30,push:0,lift:-9,travel:40};
  return m;
 }
 m.active=(m.hits-1)*m.interval+5;m.end=m.startup+m.active+25;return m;
}
function fx(w,f,a,phase='impact',extra={}){
 const m=a.move,domain=m.overdriveMode===2,life=phase==='windup'?m.startup:phase==='finale'?34:22;
 const e={kind:'awakeningOverdriveFx',hero:f.hero,mode:m.overdriveMode,clipId:domain?'domain':'surge',x:f.x+f.dir*50,y:f.y,dir:f.dir,life,max:life,owner:f,attackSerial:f.attackSerial,phase,width:phase==='finale'?(domain?1000:800):domain?720:480,height:domain?540:370,attackRange:m.reach||m.range||180,layer:'behind',...extra};w.effects.push(e);return e;
}
function surfaces(w){return [...(w.settings.platforms?w.platforms:[]),...(w.temporaryPlatforms||[]),w.floorSupport];}
function lockRoot(w,f,a){const t=f.hero==='manan'?(f===w.p1?w.p2:w.p1):{x:f.x+a.direction*160,y:f.y},m=a.move,x=clamp(t.x,Math.max(42,f.x-m.reach),Math.min(w.width-42,f.x+m.reach));const surface=surfaces(w).filter(p=>p.y>=t.y-1&&x>=p.x&&x<=p.x+p.w).sort((a,b)=>a.y-b.y)[0]||w.floorSupport;return {x,y:surface.y,surface};}
function rootHeight(w,r,m){const ceiling=surfaces(w).filter(p=>p!==r.surface&&p.y<r.y&&r.x>=p.x&&r.x<=p.x+p.w).sort((a,b)=>b.y-a.y)[0];return Math.min(m.height,ceiling?r.y-ceiling.y:m.height);}
function begin(w,f){const a=f.attack,m=a?.move;if(!m?.overdrive)return;a.direction=f.dir;a.originX=f.x;a.originY=f.y;a.onGround=!!w.supportAt(f);a.overdriveMode=m.overdriveMode;a.clipId=m.clipId;a.kitSlots=new Set();a.fxSlots=new Set();a.overdrivePhase='windup';a.overdriveEchoes=[];if(['roots','forest'].includes(m.pattern))a.overdriveRoot=lockRoot(w,f,a);fx(w,f,a,'windup',{x:a.overdriveRoot?.x??f.x,y:a.overdriveRoot?.y??f.y,...(a.overdriveRoot?{height:rootHeight(w,a.overdriveRoot,m),clipHeight:rootHeight(w,a.overdriveRoot,m)}:{})});w.lastFeedback=f.info.name+' / '+m.displayName;}
function update(w,f){const a=f.attack,m=a?.move;if(!m?.overdrive)return;f.dir=a.direction;const active=a.t>=m.startup&&a.t<m.startup+m.active;a.overdrivePhase=active?'impact':a.t<m.startup?'windup':'recovery';
 if(f.hero==='manan'&&['rise','riseOrbit'].includes(m.pattern)&&a.onGround&&(a.t===3||m.overdriveMode===2&&a.t===12)){
  const upper=a.t===12,originX=clamp(a.originX+(upper?a.direction*100:0),42,w.width-42),originY=a.originY-(upper?110:0);
  root.RiftMananRules?.makePlatform(w,f,{originX,originY,move:{mananMode:m.overdriveMode}});
 }
 if(m.jump&&a.t===3&&a.onGround){f.vy=m.jump;w.refreshSupport(f);}
 if(['slam','doubleSlam','bounceSlam'].includes(m.pattern)&&a.t===m.startup){f.vy=18;fx(w,f,a,'travel',{height:520});}
 if(['doubleSlam','bounceSlam'].includes(m.pattern)&&a.t>m.startup&&a.t<m.startup+m.active){
  const surface=w.supportAt(f);
  if(surface&&!a.slamSurface){a.slamSurface={x:f.x,y:surface.y,surface};a.reboundAt=a.t;f.vy=m.pattern==='bounceSlam'?-17:-9;w.refreshSupport(f);fx(w,f,a,'impact',{x:f.x,y:surface.y,width:600,height:360});}
  if(a.slamSurface&&a.t===m.startup+3*m.interval){f.vy=22;fx(w,f,a,'travel',{height:600});}
 }
 if(m.pattern==='riseOrbit'&&a.t>=3&&a.t<m.startup+m.active)f.vx=a.direction*(m.overdriveMode===2?4:2);
 if(['rush','zigzag'].includes(m.pattern)&&active){const elapsed=a.t-m.startup,phase=Math.floor(elapsed/m.interval);f.vx=a.direction*(m.pattern==='zigzag'&&phase%2?-1:1)*(m.overdriveMode===2?10:6);if(Math.abs(f.x-a.originX)>m.travelDistance)f.vx=0;}
 if(['leapVolley','orbitVolley','retreatVolley'].includes(m.pattern)&&a.t>=3&&a.t<m.startup){f.vx=a.direction*(m.pattern==='retreatVolley'?-4:m.pattern==='orbitVolley'?5:2);}
 if(m.pattern==='giantFists'&&active)f.vx=a.direction*1.6;
 if(m.pattern==='forest'&&a.t===4){const r=a.overdriveRoot;fx(w,f,a,'travel',{x:r.x,y:r.y,width:820,height:rootHeight(w,r,m),clipHeight:rootHeight(w,r,m)});}
}
function contacts(w,f,t,m,x=f.x,y=f.y,radial=false){if(t.inv||t.downTime||t.knockdown||t.hp<=0)return false;const dx=(t.x-x)*aDir(f);return (radial?Math.abs(t.x-x)<m.reach+23:dx>=-22&&dx<=m.reach+23)&&Math.abs(t.y-y)<m.height;}
const aDir=f=>f.attack?.direction||f.dir;
function strike(m,last){return {...m,overdriveOpen:false,finisher:last,knockdown:last&&m.knockdown,push:last?m.finalPush:m.push,lift:last?m.finalLift:m.lift};}
function projectile(w,f,a,slot,last,options={}){
 const m=a.move,p=m.pattern,gun=['lara','drake'].includes(f.hero),rain=p==='rain',lob=p==='lob',air=['leapVolley','orbitVolley'].includes(p),origin=root.RiftAwakeningOverdriveVisual?.projectileOrigin?.(f)||{x:f.x+a.direction*50,y:f.y-90};
 const kind=lob?'grenade':gun&&['arrowBurst','chargedArrow'].includes(p)?'arrow':gun?'bullet':'overdriveProjectile';
 const spec={kind,overdrive:true,overdriveMode:m.overdriveMode,targetHeight:origin.targetHeight,muzzlePathStartX:origin.targetHeight===160?f.x+a.direction*23:undefined,name:a.name,x:rain?a.originX+a.direction*(90+(slot%3)*90):origin.x,y:rain?a.originY-260:origin.y,vx:rain?a.direction*1.5:a.direction*(lob?8:m.projectileSpeed||25),vy:rain?18:lob?-3:air?12:0,gravity:lob?.4:0,w:rain?130:p==='chargedArrow'?70:gun?32:100,h:rain?90:p==='chargedArrow'?40:gun?20:145,maxTravel:m.range||800,life:lob?72:90,move:strike(m,last),...options};
 w.spawnProjectile(f,spec);const b=w.projectiles.at(-1);fx(w,f,a,'travel',{x:b.x,y:b.y+80,projectile:b,life:b.life,max:b.life,width:gun?220:520,height:gun?160:350,attackRange:b.w});return b;
}
function resolve(w,f,t,a){const m=a.move;if(!m.overdrive)return false;if(m.overdriveZen){w.resolveSixfold(f,t,a);return true;}if(a.overdriveSequence)return resolveSequence(w,f,t,a);
 if(m.overdriveOpen){if(a.opened)return true;if(m.gunOpener){a.opened=true;projectile(w,f,a,0,false,{kind:'bullet',move:{...m,finisher:false,knockdown:false},vx:a.direction*28,vy:0,w:30,h:24});return true;}if(contacts(w,f,t,m)){a.opened=true;w.hit(f,t,{...m,finisher:false,knockdown:false},'ultimate',t.x,{dir:a.direction});}return true;}
 const slot=Math.floor((a.t-m.startup)/m.interval);if(slot<0||slot>=m.hits||a.kitSlots.has(slot))return true;const last=slot===m.hits-1;
 if(!a.fxSlots.has(slot)){a.fxSlots.add(slot);if(!['roots','forest','minefield'].includes(m.pattern))fx(w,f,a,last?'finale':'impact',{phaseIndex:slot});w.event('swing',{hero:f.hero,x:f.x,y:f.y-80,dir:a.direction,color:f.color,weapon:f.info.weapon,move:a.name});}
 if(['wave','rain','arrowBurst','chargedArrow','lob','volley','leapVolley','orbitVolley','retreatVolley'].includes(m.pattern)){a.kitSlots.add(slot);projectile(w,f,a,slot,last);return true;}
 let hit=false,x=f.x,y=f.y;
 if(['roots','forest'].includes(m.pattern)){const r=a.overdriveRoot;if(!r||!surfaces(w).includes(r.surface)||r.surface.life<=0)return true;x=r.x;y=r.y;const h=rootHeight(w,r,m),radius=m.pattern==='forest'?m.rootRadius+slot*25:m.rootRadius;hit=!t.inv&&!t.downTime&&!t.knockdown&&Math.abs(t.x-x)<=radius+23&&t.y<=y+8&&t.y>y-h;if(a.t===m.startup+slot*m.interval)fx(w,f,a,last?'finale':'impact',{x,y,width:radius*2+120,height:h,clipHeight:h,attackRange:radius*2});}
 else if(m.pattern==='minefield'){x=a.originX+a.direction*(80+slot*70);y=a.originY;hit=contacts(w,f,t,{...m,reach:130,height:190},x,y,true);fx(w,f,a,last?'finale':'impact',{x,y,width:360,height:330,attackRange:260});}
 else if(m.pattern==='clone'){x=a.originX+a.direction*(80+(slot%3)*100);hit=contacts(w,f,t,{...m,reach:95},x,y,true);if(a.t===m.startup+slot*m.interval)fx(w,f,a,'impact',{x,y,phaseIndex:slot,attackRange:190});}
 else if(m.pattern==='giantFists'){x=a.originX+a.direction*(70+slot*65);hit=contacts(w,f,t,{...m,reach:95},x,y,true);if(a.t===m.startup+slot*m.interval)fx(w,f,a,'impact',{x,y,phaseIndex:slot,width:400,height:350,attackRange:190});}
 else if(['doubleSlam','bounceSlam'].includes(m.pattern)&&slot>=2){const r=a.slamSurface;if(!r||!surfaces(w).includes(r.surface))return true;x=r.x+a.direction*(slot-1)*95;y=r.y;hit=contacts(w,f,t,{...m,reach:125,height:240},x,y,true);if(a.t===m.startup+slot*m.interval)fx(w,f,a,last?'finale':'impact',{x,y,phaseIndex:slot,width:470,height:420,attackRange:250});}
 else hit=contacts(w,f,t,m,x,y,['sweep','riseOrbit'].includes(m.pattern));
 // Every stage has a finite active opportunity; missed hits never retarget.
 if(a.t===m.startup+slot*m.interval+Math.min(3,m.interval-1)||hit)a.kitSlots.add(slot);
 if(hit){w.event('overdriveContact',{hero:f.hero,mode:m.overdriveMode,pattern:m.pattern,slot,x,y,reach:m.pattern==='giantFists'||m.pattern==='clone'?95:m.reach});w.hit(f,t,strike(m,last),a.name,t.x,{dir:Math.sign(t.x-f.x)||a.direction});a.hit=true;}
 return true;
}
function live(f){const s=f?.attack?.overdriveSequence;return s&&!s.finished&&!f.stun&&f.hp>0&&s.target.hp>0&&!s.target.inv&&s.target.stun>0?s:null;}
function controlled(w,f){return [w.p1,w.p2].some(owner=>{const s=live(owner);return !!s&&(owner===f||s.target===f);});}
function stop(w,f,a){const s=a.overdriveSequence;if(!s||s.finished)return;s.finished=true;a.overdriveEchoes=[];a.t=a.move.startup+a.move.active;a.move.end=a.t+16;f.vx=f.vy=0;f.returning=true;w.lastFeedback='觉醒连式中断 / 定向脱身成功';}
function route(points,q){const p=clamp(q,0,1)*(points.length-1),i=Math.min(points.length-2,Math.floor(p)),r=p-i;return {x:points[i][0]+(points[i+1][0]-points[i][0])*r,y:points[i][1]+(points[i+1][1]-points[i][1])*r};}
function path(hero,mode,q){const full=mode===2;q=clamp(q,0,1);const pi=Math.PI;
 // These are world-space attack routes, not camera or effect-only offsets.
 if(hero==='cloud')return full?route([[0,0],[120,220],[-100,340],[300,450],[70,570],[480,570],[560,0]],q):route([[0,0],[170,90],[20,170],[250,250],[130,310],[340,50]],q);
 if(hero==='kirito')return {x:(full?450:230)*q+Math.sin(q*pi*(full?8:6))*(full?180:95),y:full?Math.sin(q*pi)*430+Math.sin(q*pi*4)**2*130:Math.sin(q*pi)*190};
 if(hero==='lara')return {x:(full?440:240)*q+Math.sin(q*pi*(full?6:4))*(full?100:50),y:Math.abs(Math.sin(q*pi*(full?3:2)))*(full?360:190)};
 if(hero==='drake')return full?route([[0,0],[-100,60],[180,60],[50,200],[360,200],[250,370],[540,40]],q):route([[0,0],[-75,30],[170,30],[80,120],[300,120],[380,20]],q);
 if(hero==='wukong'){
  if(!full)return route([[0,0],[10,180],[35,330],[220,330],[380,160],[420,0]],q);
  if(q<.28)return {x:20*q/.28,y:600*q/.28};
  if(q<.76){const r=(q-.28)/.48;return {x:20+360*r+Math.sin(r*pi*2)*150,y:600-120*r+Math.sin(r*pi)*100};}
  const r=(q-.76)/.24;return {x:380+200*r,y:480*(1-r)};
 }
 if(hero==='manan')return full?route([[0,0],[80,0],[80,170],[210,170],[210,350],[380,350],[380,550],[520,550],[520,0]],q):route([[0,0],[60,0],[60,140],[160,140],[160,290],[280,290],[320,0]],q);
 if(hero==='tanjiro')return full?{x:450*q+Math.sin(q*pi*4)*190,y:Math.sin(q*pi)*470+Math.sin(q*pi*2)**2*160}:{x:240*q+Math.sin(q*pi*2)*100,y:Math.sin(q*pi)*410};
 if(hero==='luffy')return {x:(full?460:250)*q,y:Math.abs(Math.sin(q*pi*(full?3:2)))*(full?470:240)};
 if(hero==='naruto')return full?route([[0,0],[100,260],[300,260],[200,480],[500,480],[600,0]],q):{x:230*q+Math.sin(q*pi*4)*70,y:Math.sin(q*pi)*280};
 return {x:240*q,y:Math.sin(q*pi)*250};
}
function advance(w){
 for(const e of w.effects)if(e.kind==='awakeningOverdriveFx'&&e.projectile){e.x=e.projectile.x;e.y=e.projectile.y+80;if(e.projectile.dead||e.projectile.life<=0)e.life=Math.min(e.life,4);}
 for(const f of [w.p1,w.p2]){const a=f.attack,m=a?.move;if(!m?.overdrive)continue;
  if(m.overdriveZen){advanceEchoes(w,f,a);continue;}
  const s=a.overdriveSequence;if(!s||s.finished)continue;if(!live(f)){stop(w,f,a);continue;}const elapsed=a.t-s.startT,q=clamp(elapsed/s.duration,0,1),p=path(f.hero,m.overdriveMode,q),t=s.target;
  const desired=clamp(s.tx+s.dir*p.x,140,w.width-140),blend=clamp(elapsed/6,0,1);t.x=desired;t.y=s.ty-p.y;f.x=clamp(s.fx+(desired-s.dir*85-s.fx)*blend,42,w.width-42);f.y=s.fy+(t.y-s.fy)*blend;f.dir=s.dir;f.vx=f.vy=t.vx=t.vy=0;t.stun=Math.max(t.stun,24);t.block=false;s.phase=Math.floor(elapsed/s.interval);a.overdrivePhase=s.phase>=s.hits-1?'finale':'travel';w.refreshSupport(f);w.refreshSupport(t);
  if(elapsed>s.duration+20)stop(w,f,a);
 }
}
function resolveSequence(w,f,t,a){const s=a.overdriveSequence,m=a.move;if(s.finished)return true;if(!live(f)){stop(w,f,a);return true;}const elapsed=a.t-s.startT,slot=Math.floor(elapsed/s.interval);if(slot<0||slot>=s.hits||elapsed%s.interval!==Math.floor(s.interval*.6)||s.struck.has(slot))return true;
 if(Math.abs(f.x-t.x)>165||Math.abs(f.y-t.y)>180){stop(w,f,a);return true;}s.struck.add(slot);const last=slot===s.hits-1;const hit={...m,overdriveOpen:false,overdriveSequenceHit:true,damage:last?12:f.hero==='kirito'?2.7:4.5,stun:40,push:last?24:0,lift:last?-12:0,stop:last?9:2,knockdown:last,finisher:last};
 fx(w,f,a,last?'finale':'impact',{x:t.x,y:t.y,phaseIndex:slot,width:last?1050:m.overdriveMode===2?900:650,height:last?650:520});
 if(['lara','drake'].includes(f.hero))projectile(w,f,a,slot,last,{kind:'bullet',move:hit,vx:s.dir*35,vy:0,w:34,h:26,life:25,maxTravel:700});else w.hit(f,t,hit,'ultimate',t.x,{dir:s.dir});return true;
}
function advanceEchoes(w,f,a){const t=f===w.p1?w.p2:w.p1;for(const echo of a.overdriveEchoes){if(echo.done||w.frame<echo.at)continue;echo.done=true;if(!a.sixfold||f.stun||t.inv||t.downTime||t.hp<=0||Math.abs(t.x-echo.x)>180||Math.abs(t.y-echo.y)>180)continue;fx(w,f,a,'impact',{x:echo.x,y:echo.y,width:700,height:430});w.hit(f,t,{...a.move,overdriveZenEcho:true,damage:2.5,stun:Math.max(22,t.stun),push:Math.abs(t.vx),lift:t.vy,thunderDriftTicks:t.thunderDriftTicks,stop:1,knockdown:false,finisher:false},'ultimate',t.x,{dir:Math.sign(t.vx)||echo.dir});}}
function afterHit(w,f,t,m,contact){if(!m.overdrive||contact.guarded)return;const a=f.attack;if(!a?.move.overdrive||a.move.sourceAttackSerial!==m.sourceAttackSerial)return;
 if(m.overdriveZen){if(!m.overdriveZenEcho&&!m.sixfoldOpen&&!m.finisher&&a.sixfold?.leg>=0&&a.sixfold.leg<5){for(let i=0;i<m.overdriveMode;i++)a.overdriveEchoes.push({at:w.frame+i+1,x:t.x,y:t.y,dir:contact.dir});}if(m.finisher)fx(w,f,a,'finale',{x:t.x,y:t.y,width:1100,height:700});return;}
 if(m.overdriveSequenceHit){if(m.finisher){a.overdriveSequence.finished=true;f.vx=f.vy=0;f.returning=true;}return;}
 if(m.overdriveOpen&&!a.overdriveSequence&&t.hp>0&&!f.stun){const hits=expectedUltimateHits(f.hero,m.overdriveMode)-1,interval=f.hero==='kirito'?9:15;sCreate();function sCreate(){a.overdriveSequence={target:t,hero:f.hero,startT:a.t,hits,interval,duration:hits*interval,fx:f.x,fy:f.y,tx:t.x,ty:t.y,dir:a.direction,phase:0,struck:new Set(),finished:false};a.move.active=a.t-a.move.startup+hits*interval+35;a.move.end=a.t+hits*interval+50;f.vx=f.vy=t.vx=t.vy=0;a.hit=true;}return;}
 if(['arrowBurst','chargedArrow','lob'].includes(m.pattern))fx(w,f,a,'impact',{x:t.x,y:t.y,width:480,height:380});
}
function visualPose(f){const a=f.attack,m=a?.move;if(!m?.overdrive)return null;let clip=m.clipId,phase=a.overdrivePhase||'windup',source='motion',t=a.t,startup=m.startup,active=m.active,end=m.end;
 const gun=['lara','drake'].includes(f.hero);if(a.overdriveSequence){const s=a.overdriveSequence,local=Math.max(0,a.t-s.startT)%s.interval;clip=gun?'ultimate':['attack1','attack2','launcher','air','heavy','ultimate'][s.phase%6];t=local;startup=Math.floor(s.interval*.6);active=1;end=s.interval;}
 else if(!m.overdriveZen&&m.pattern!=='ultimate'){const local=Math.max(0,a.t-m.startup)%m.interval;if(a.t>=m.startup&&a.t<m.startup+m.active){t=m.startup+local;active=m.interval;end=m.startup+m.interval+8;}if(gun&&['arrowBurst','chargedArrow'].includes(m.pattern))clip='skill';else if(gun&&['volley','leapVolley','orbitVolley','retreatVolley'].includes(m.pattern))clip=a.t<m.startup&&m.jump?'skill3':['leapVolley','orbitVolley'].includes(m.pattern)?'air':'attack3';else if(['rise','riseOrbit'].includes(m.pattern))clip='launcher';else if(['slam','doubleSlam','bounceSlam'].includes(m.pattern))clip=a.t<m.startup?'jump':'heavy';else if(['rush','zigzag'].includes(m.pattern))clip='attack2';}
 if(f.hero==='manan')source='manan';else if(['luffy','kirito','naruto'].includes(f.hero))source='anime';
 else if(f.hero==='tanjiro'){
  if(m.overdriveMode===2&&clip!=='jump'){source='fire';clip=({skill:'skill1',attack1:'slash1',attack2:'slash2',attack3:'slash3'})[clip]||clip;}
  else{clip=({skill2:'waterfall',skill3:'whirlpool'})[clip]||clip;source=['waterfall','whirlpool','awaken','attack4','attack5','heavy','throw','airheavy'].includes(clip)?'tanjiro':'motion';}
 }else if(f.hero==='zenitsu'){
  source=['heavy','airheavy','throw','attack4'].includes(clip)?'zenitsuKit':'motion';if(clip==='skill'||clip==='skill2'||clip==='skill3'){source='roster';clip='surge';}
 }else if(['skill2','skill3'].includes(clip))source='roster';
 if(['cloud','lara','wukong','drake'].includes(f.hero)&&source==='motion'){if(clip==='heavy'||clip==='airheavy')clip=gun?'skill':'attack3';else if(clip==='throw')clip=gun?'attack3':'attack2';}
 if(f.hero==='drake'&&['volley','leapVolley','orbitVolley','retreatVolley'].includes(m.pattern)&&a.t>=m.startup){source='roster';clip='skill3';}
 const bodyAngle=f.hero==='drake'&&['leapVolley','orbitVolley'].includes(m.pattern)&&a.t>=m.startup&&a.t<m.startup+m.active?(Math.atan2(12,m.projectileSpeed||25)+.15)*(f.dir||1):0;
 const name=clip==='surge'?'skill':({attack1:'slash1',attack2:'slash2',attack3:'slash3'})[clip]||clip,fake={...a,name,clipId:clip,t,move:{...m,startup,active,end,fire:source==='fire',zenitsuKit:source==='zenitsuKit',rosterKit:source==='roster',rosterMode:m.overdriveMode,zenitsuMode:m.overdriveMode,animeMode:m.overdriveMode,mananMode:m.overdriveMode}};
 if(clip==='surge')fake.variant='flash';
 if(gun&&(['ultimate','attack3','air'].includes(clip)||clip==='skill'&&['arrowBurst','chargedArrow','lob'].includes(m.pattern)||f.hero==='drake'&&clip==='skill3')){const local=a.overdriveSequence?t-startup:a.t>=m.startup?(a.t-m.startup)%m.interval:-1;if(local>=0)fake.bodyFrame=local===0?4:local===1?5:local===2?3:1;}
 return {actor:{...f,attack:fake},clipId:clip,source,phase,bodyFrame:fake.bodyFrame,bodyAngle,pivot:{x:f.x,y:f.y-90},mode:m.overdriveMode};
}
root.RiftAwakeningOverdriveRules={CATALOG,applies,move,begin,update,resolve,advance,controlled,afterHit,visualPose,expectedUltimateHits,path};if(typeof module!=='undefined')module.exports=root.RiftAwakeningOverdriveRules;
})(typeof window!=='undefined'?window:globalThis);
