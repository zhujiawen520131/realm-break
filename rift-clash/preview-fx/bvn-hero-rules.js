(function(root){'use strict';
// Original-source actions, adapted to this 2D arena. Timings are not source-game data.
const CATALOG={
 cloud:{name:'奋力快攻 · Braver',controls:'S + P',sourceHint:'FFVII：跃起后的大剑下劈'},
 lara:{name:'肾上腺素闪避射击',controls:'S + P',sourceHint:'周年纪念：闪避后射击；本作改为自动开枪'},
 wukong:{name:'铜头铁臂',controls:'S + P → 成功招架后 J',sourceHint:'黑神话：短时化石，弹开近战后反击'},
 drake:{name:'绳索摆荡突袭',controls:'S + P',sourceHint:'神秘海域4：建筑挂点、绳索摆荡与空中近战'},
 tanjiro:{name:'瀧壺 / 火神交叉斩',controls:'S + P',sourceHint:'水之呼吸下劈；二觉改为两段交叉炎斩'},
 zenitsu:{name:'雷光爆发',controls:'S + P',sourceHint:'雷之呼吸：近身雷电连斩，终段软挑空'},
 manan:{name:'断层突进',controls:'S + P',sourceHint:'原创：低弧踏石突进与肩撞'}
};
const applies=f=>!!CATALOG[f?.hero],clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function move(f,name,variant){
 if(name!=='signature'||!applies(f))return null;
 const mode=f.awakenLevel||0,full=mode===2;
 let m={bvnSignature:true,kit:true,fire:false,mananKit:false,rosterKit:false,zenitsuKit:false,style:null,bvnMode:mode,cost:full?0:25,visualClip:'attack3',clipId:'attack3',displayName:CATALOG[f.hero].name,kind:'strike',startup:10,active:7,end:35,hits:1,interval:6,damage:20,reach:170,height:190,stun:34,push:2,lift:0,finalPush:10,finalLift:-7,stop:6,knockdown:true,fxClip:'basic'};
 if(f.hero==='cloud')m={...m,kind:'slam',visualClip:'attack3',startup:23,hits:full?2:1,damage:full?14:mode?23:21,reach:full?230:185,height:260,jump:-12.8,dive:12,finalLift:12,stop:10,fxClip:'skill2'};
 if(f.hero==='lara')m={...m,kind:'dodgeShot',visualClip:'skill3',clipId:'skill3',startup:24,hits:mode+1,interval:5,damage:mode?10:20,reach:0,height:0,jump:-7.2,projectile:'bullet',speed:25,range:full?760:560,fxClip:'skill3'};
 if(f.hero==='wukong')m={...m,kind:variant==='counter'?'counter':'parry',visualClip:variant==='counter'?'attack3':'guard',clipId:variant==='counter'?'attack3':'guard',startup:variant==='counter'?5:4,active:variant==='counter'?8:14,end:variant==='counter'?30:38,hits:variant==='counter'?1:0,damage:variant==='counter'?(full?23:19):0,reach:full?235:175,height:190,cost:variant==='counter'?0:m.cost,fxClip:variant==='counter'?'skill2':'aura'};
 if(f.hero==='drake')m={...m,kind:'grapple',visualClip:'skill2',clipId:'skill2',startup:20,hits:full?3:mode?2:1,interval:5,damage:mode?10:21,reach:145,height:245,jump:-14,push:7,finalLift:10,fxClip:'skill2'};
 if(f.hero==='tanjiro')m=full?{...m,kind:'fireCross',visualClip:'skill3',clipId:'skill3',startup:9,hits:2,interval:9,damage:14,reach:240,height:240,lift:-6,finalLift:-9,fxClip:'fireCross'}:{...m,kind:'waterfall',visualClip:'waterfall',clipId:'waterfall',startup:20,hits:mode?2:1,interval:5,damage:mode?12:22,reach:185,height:270,jump:-11.8,dive:11,finalLift:12,fxClip:'waterfall'};
 if(f.hero==='zenitsu')m={...m,kind:'lightningBurst',visualClip:'surge',clipId:'surge',startup:7,hits:mode+3,interval:5,damage:full?6:7,reach:full?225:mode?195:165,height:200,finalPush:4,finalLift:-12,knockdown:false,fxClip:'lightningBurst'};
 if(f.hero==='manan')m={...m,kind:'faultRush',visualClip:'attack2',clipId:'attack2',startup:8,hits:mode?2:1,interval:6,damage:mode?13:22,reach:full?150:115,height:190,jump:-7,finalLift:-8,fxClip:'ridge'};
 if(m.kind!=='parry'){m.active=m.hits===1?8:(m.hits-1)*m.interval+6;m.end=m.startup+m.active+18;}return m;
}
function activate(world,f,dir){if(!applies(f))return false;const m=move(f,'signature');if(f.energy+.001<m.cost){world.lastFeedback='气力不足 / 组合技需要 25 气';f.buffer=null;return false;}f.energy=Math.max(0,f.energy-m.cost);f.dir=f.inputDir=Math.sign(dir)||f.dir;world.begin(f,'signature');return true;}
function effect(world,f,a,id=a.move.fxClip,life=18,extra={}){const e={kind:'bvnFx',hero:f.hero,clipId:id,mode:a.move.bvnMode,owner:f,attack:a,x:f.x+f.dir*45,y:f.y-80,dir:f.dir,life,max:life,...extra};world.effects.push(e);return e;}
function findAnchor(world,f){
 const surfaces=[...(world.settings.platforms?world.platforms:[]),...(world.temporaryPlatforms||[])];
 const candidates=surfaces.filter(p=>f.y-p.y>=65&&f.y-p.y<=210).map(p=>({platform:p,x:clamp(f.x+f.dir*130,p.x+Math.min(15,p.w/4),p.x+p.w-Math.min(15,p.w/4)),y:p.y+8})).filter(p=>(p.x-f.x)*f.dir>=45&&(p.x-f.x)*f.dir<=270);
 return candidates.sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x))[0]||null;
}
function begin(world,f){
 const a=f.attack;if(!a?.move.bvnSignature)return;const m=a.move;a.direction=f.dir;a.originX=f.x;a.originY=f.y;a.onGround=!!world.supportAt(f);a.clipId=m.clipId;a.signaturePhase=m.kind==='parry'?'parry':'startup';a.kitSlots=new Set();a.fxSlots=new Set();world.lastFeedback=f.info.name+' / '+m.displayName;
 if(m.kind==='parry')effect(world,f,a,'aura',m.startup+m.active);
 if(m.kind==='grapple'){a.ropeAnchor=findAnchor(world,f);if(!a.ropeAnchor){a.anchorMissing=true;a.signaturePhase='whiff';a.move={...m,active:0,hits:0,end:20};world.lastFeedback='绳索突袭 / 前方没有可用建筑挂点';}else effect(world,f,a,'rope',m.end,{anchor:a.ropeAnchor});}
 if(!a.onGround&&['slam','waterfall'].includes(m.kind)){a.move={...m,startup:8,active:m.active,end:8+m.active+18};}
}
function update(world,f){
 const a=f.attack,m=a?.move;if(!m?.bvnSignature)return;f.dir=a.direction;
 if(a.anchorMissing)return;
 const active=a.t>=m.startup&&a.t<m.startup+m.active;
 if(m.jump&&a.t===3&&a.onGround){f.vy=m.jump;world.refreshSupport(f);}
 if(['slam','waterfall'].includes(m.kind)&&a.t===m.startup)f.vy=Math.max(m.dive,f.vy);
 if(m.kind==='dodgeShot'){
  if(a.t>=3&&a.t<=10)f.vx=f.dir*4;
  if(a.t===4)f.inv=Math.max(f.inv,5);
  a.clipId=a.t<m.startup?'skill3':'attack3';a.signaturePhase=a.t<m.startup?'dodge':'shoot';
 }
 if(m.kind==='faultRush'){if(a.t>=4&&a.t<m.startup+m.active)f.vx=f.dir*(m.bvnMode===2?13:10);a.clipId=a.t<m.startup?'dash':'attack2';}
 if(m.kind==='grapple'){
  // The rope has an architectural endpoint; velocity follows that endpoint, never the opponent.
  const supports=[...(world.settings.platforms?world.platforms:[]),...(world.temporaryPlatforms||[])];
  if(!supports.includes(a.ropeAnchor.platform)){a.anchorMissing=true;a.signaturePhase='whiff';a.move={...m,active:0,end:a.t+12};f.vx=0;return;}
  if(a.t>=3&&a.t<26)f.vx=clamp((a.ropeAnchor.x-a.originX)/24,-7,7);
  if(a.t===m.startup)f.vy=Math.max(8,f.vy);
  a.signaturePhase=a.t<m.startup?'swing':'strike';a.clipId=a.t<m.startup?'jump':'skill2';
 }
 if(m.kind==='fireCross'&&active){f.vx=f.dir*2.5;a.signaturePhase=Math.floor((a.t-m.startup)/m.interval)===0?'risingSlash':'fallingSlash';}
 if(m.kind==='parry'){a.signaturePhase=a.parrySuccess?'counterReady':active?'parry':'recovery';if(a.counterUntil&&world.frame>a.counterUntil){a.counterUntil=0;a.parrySuccess=false;}}
 else if(!['dodgeShot','grapple','fireCross'].includes(m.kind))a.signaturePhase=active?'strike':a.t<m.startup?'startup':'recovery';
}
function contact(f,t,m){if(t.inv||t.downTime||t.knockdown||t.hp<=0)return false;const dx=(t.x-f.x)*f.dir;return dx>=-20&&dx<=m.reach+23&&Math.abs(t.y-f.y)<m.height;}
function resolve(world,f,t,a){
 const m=a.move;if(!m.bvnSignature)return false;if(m.kind==='parry'||a.anchorMissing||!m.hits)return true;
 const slot=m.hits===1?0:Math.floor((a.t-m.startup)/m.interval);if(slot<0||slot>=m.hits||a.kitSlots.has(slot))return true;const last=slot===m.hits-1;
 const hit={...m,signatureSerial:f.attackSerial,knockdown:last&&m.knockdown,finisher:last,push:last?m.finalPush:m.push,lift:last?m.finalLift:m.lift};
 if(m.projectile){
  a.kitSlots.add(slot);
  // The new BVN visual adapter can supply the authored muzzle for this pose.
  const pose=visualPose(f),origin=root.RiftMotion24Visual?.projectileOrigin?.(f,'signature')||root.RiftMotionPreview?.projectileOrigin?.(pose.actor,'slash3')||{x:f.x+f.dir*50,y:f.y-110};
  world.spawnProjectile(f,{kind:'bullet',name:'signature',x:origin.x,y:origin.y,vx:f.dir*m.speed,vy:0,w:26,h:18,maxTravel:m.range,traveled:0,life:Math.ceil(m.range/m.speed)+3,move:hit,bvnMode:m.bvnMode});effect(world,f,a,m.fxClip,10,{x:origin.x,y:origin.y});return true;
 }
 if(!a.fxSlots.has(slot)){a.fxSlots.add(slot);effect(world,f,a,m.fxClip,18,{angle:m.kind==='fireCross'?(slot===0?-.65:.65):0,slot});world.event('swing',{x:f.x,y:f.y-80,hero:f.hero,dir:f.dir,color:f.color,weapon:f.info.weapon,move:'signature'});}
 if(!contact(f,t,m))return true;a.kitSlots.add(slot);world.hit(f,t,hit,'signature',t.x,{dir:f.dir});return true;
}
function intercept(world,f,t,m,name,hitContact){
 const a=t.attack,own=a?.move;if(t.hero!=='wukong'||!own?.bvnSignature||own.kind!=='parry'||a.parrySuccess||a.t<own.startup||a.t>=own.startup+own.active)return false;
 const melee=Number.isFinite(m.reach)&&m.reach>0&&!m.projectile&&!m.pistol&&!m.throw&&!m.unblockable&&name!=='ultimate';
 if(!melee||t.dir!==-hitContact.dir||(f.x-t.x)*t.dir<0||Math.abs(f.x-t.x)>280||Math.abs(f.y-t.y)>190)return false;
 a.parrySuccess=true;a.counterUntil=world.frame+24;a.signaturePhase='counterReady';a.move={...own,end:Math.max(own.end,a.t+26)};f.attack=null;f.buffer=null;f.stun=Math.max(f.stun,14);f.vx=t.dir*4;f.vy=Math.max(0,f.vy);t.stun=t.guardStun=0;world.event('parry',{hero:'wukong',x:t.x,y:t.y-80,color:t.color,dir:t.dir});effect(world,t,a,'parry',22);if(world.settings.hitstop)world.freeze=Math.max(world.freeze,5);world.lastFeedback='铜头铁臂 / 成功招架，按 J 反击';return true;
}
function counter(world,f,dir){const a=f.attack;if(!a?.move.bvnSignature||a.move.kind!=='parry'||!a.parrySuccess||a.counterUntil<world.frame)return false;const mode=a.move.bvnMode;f.dir=f.inputDir=Math.sign(dir)||a.direction;world.begin(f,'signature','counter');f.attack.move={...move({hero:f.hero,awakenLevel:mode},'signature','counter'),cost:0};f.attack.direction=f.dir;f.attack.clipId='attack3';f.attack.signaturePhase='counter';world.lastFeedback='铜头铁臂 / 破势棍反击';return true;}
function afterHit(world,f,t,m,name,hitContact){if(!m.bvnSignature)return;const a=f.attack;if(a?.move.bvnSignature&&f.attackSerial===m.signatureSerial){if(!hitContact.guarded){a.hit=true;a.confirmed=true;}else if(!a.confirmed)a.hit=false;}}
function visualPose(f){const a=f.attack,m=a?.move;if(!m?.bvnSignature)return null;let clipId=a.clipId||m.visualClip,source='motion';
 if(f.hero==='manan')source='manan';
 else if(f.hero==='tanjiro')source=m.bvnMode===2?'fire':'tanjiro';
 else if(f.hero==='zenitsu')source='roster';
 else if(['skill2','skill3'].includes(clipId))source='roster';
 const fake={...a,name:({attack1:'slash1',attack2:'slash2',attack3:'slash3',jump:'jump',guard:'guard'})[clipId]||clipId,clipId,move:{...m,rosterKit:source==='roster',fire:source==='fire',rosterMode:m.bvnMode,zenitsuMode:m.bvnMode}};
 if(f.hero==='zenitsu'){fake.name='skill';fake.variant='flash';fake.move.zenitsuMode=Math.max(1,m.bvnMode);}
 // All automatically emitted rounds use the authored shooting contact pose.
 if(f.hero==='lara'&&a.t>=m.startup){const local=(a.t-m.startup)%m.interval;fake.t=m.startup+Math.min(local,3);fake.move.active=m.interval;fake.move.end=m.startup+m.interval+8;fake.move.hits=1;}
 return {clipId,phase:a.signaturePhase,source,actor:{...f,attack:fake},t:fake.t,startup:fake.move.startup,active:fake.move.active,end:fake.move.end};
}
root.RiftBvnHeroRules={CATALOG,applies,move,activate,begin,update,resolve,intercept,counter,afterHit,findAnchor,visualPose};if(typeof module!=='undefined')module.exports=root.RiftBvnHeroRules;
})(typeof window!=='undefined'?window:globalThis);
