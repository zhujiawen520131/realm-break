(function(root){
'use strict';
// Read-only presentation contract. Simulation, costs, collisions, directions,
// platforms and clocks remain owned by the existing 60 Hz combat rules.
const FPS=24, SIM_FPS=60;
const CLIPS=['idle','attack1','attack2','attack3','attack4','attack5','launcher','air','heavy','airheavy','throw','dashstrike','skill1','skill2','skill3','ultimate'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cel=t=>Math.floor(Math.max(0,t)*FPS/SIM_FPS+1e-8);
const HEROES={
 cloud:{weapon:'greatsword',force:'后脚蹬地，髋先转、肩后送，双手大剑有惯性拖尾和刹停',idle:'重剑低置，屈膝承重，呼吸带动肩背',skills:['压低重心后双手挥剑放出剑气','后脚推地，剑身由低到高挑起','轴脚转髋，宽幅横扫后压住剑势'],ultimate:['attack1','attack2','launcher','air','heavy']},
 lara:{weapon:'bow-and-dual-pistols',force:'双枪举臂瞄准和腕部后坐；弓箭先拉弦开肩，再松指放箭',idle:'前后错步、双膝微曲，枪口向下待命',skills:['搭箭拉弓，肩胛回收，松弦后稳住弓臂','蹬地空翻，双枪指向斜下方再开火','压低身体翻滚，落脚后双枪交叉扫射'],ultimate:['ultimate','ultimate','ultimate','ultimate','ultimate']},
 wukong:{weapon:'staff',force:'前后手分工握棍，转腰带动整根棍，避免两端独立漂移',idle:'低重心猴步，长棍偏后，头肩与尾饰错拍',skills:['一手立棍支撑，另一手掐诀点出定身符','踏步挑棍，后手压柄、前手引导长棍上扬','移握中段，连续转腰旋棍后制动'],ultimate:['launcher','air','attack2','skill3','heavy']},
 drake:{weapon:'rifle-grenade-and-fists',force:'拳击由后脚和肩腰发力；步枪抵肩有后坐；投雷从手指释放',idle:'松肩警戒，重心在双脚间缓慢转换',skills:['侧身引臂，跨步转髋，手雷从张开的手指离手','屈膝蓄力，跃身重拳由肩向前送出','步枪抵肩，前手托枪，射击后枪托和上身回弹'],ultimate:['ultimate','ultimate','ultimate','ultimate','ultimate']},
 tanjiro:{weapon:'katana',force:'双手握柄、髋肩连动；水式圆转、火式更低更锐，刀尖持续走弧',idle:'刀置身侧，呼吸推动胸腹，羽织稍后于躯干摆动',skills:['收膝翻转后展开，刀刃完成纵向水车圆弧','跳起展身，再以肩背与双臂共同下劈','轴脚转体，双手维持刀弧而非平移刀身'],ultimate:['attack4','skill3','skill1','airheavy','ultimate']},
 zenitsu:{weapon:'katana-no-scabbard',force:'无刀鞘；持刀低身蓄腿，蹬地送髋后挥斩，回身制动不追敌转向',idle:'双腿微屈，双手及完整刀身可见，无刀鞘',skills:['低身深蓄势，后腿爆发带动肩臂出刀','短蓄势快斩，刀身始终由握柄手带动','跃起收膝转体，展开后完成空中环斩'],ultimate:['dashstrike','attack1','attack2','air','launcher']},
 manan:{weapon:'sculpt-stylus',force:'蹬地与掌压驱动构筑，抬升时先下蹲再伸髋抬臂，建筑受力清楚',idle:'橄榄绿T恤、黑短裤，手握雕刻笔，轻微呼吸与重心变化',skills:['后脚踏实，持笔手前划，另一掌推送岩脊','双膝压低，双臂托举，身体伸展带起可站石台','俯身指向已锁地面，掌指抓合后上提根脉'],ultimate:['skill2','air','attack2','heavy','ultimate']},
 luffy:{weapon:'elastic-limbs',force:'肩胯先蓄力，拳脚伸长加速，躯干反向平衡，末端过冲后弹性回收',idle:'松弛膝踝和肩臂；五档有不同的松软弹跳姿态',skills:['后肩引拳，跨步转髋，橡胶拳伸出后反弹收回','左右肩交替，机关枪连拳有独立的前后拳层次','抬腿拉长，髋向下转，把巨斧脚跟压向地面'],ultimate:['skill2','skill1','attack2','launcher','ultimate']},
 kirito:{weapon:'dual-swords',force:'两手各自握牢一剑，前脚制动、腰肩转向，交叉后双剑明确分离',idle:'双剑方向分明，屈膝轻移重心，双肩不完全同相',skills:['前跨步，肩腕与剑轴成线，另一剑反向配重','腰肩驱动左右横斩，双剑有不同的先后顺序','两剑先分开引势，再交叉切入并向外收势'],ultimate:['attack1','skill3','skill1','attack2','ultimate']},
 naruto:{weapon:'palm-chakra-and-taijutsu',force:'跨步送髋、旋肩、伸肘出掌；螺旋丸随掌移动，禁止静止托球冒光',idle:'轻屈膝，后脚弹性承重；仙人/九喇嘛为独立身体与衣装',skills:['后手在腰侧凝聚球，前跨步、髋肩依次转动，把掌根向外送出','手印结束后分身体术，主体与分身的动作起点不同','肩上聚出手里剑，转髋甩臂，张掌后投射物独立飞行'],ultimate:['attack1','attack2','launcher','skill1','ultimate']}
};
const ALIASES={slash1:'attack1',slash2:'attack2',slash3:'attack3',slash4:'attack4',slash5:'attack5',downward:'airheavy',downstrike:'airheavy',air2:'air',waterwheel:'skill1',waterfall:'skill2',whirlpool:'skill3',extreme:'skill1',flash:'skill2',airspin:'skill3',skill:'skill1'};
const PROJECTILES=new Set(['wave','rain','arrowBurst','chargedArrow','lob','volley','leapVolley','orbitVolley','retreatVolley']);
const GUN_PATTERNS=new Set(['volley','leapVolley','orbitVolley','retreatVolley']);
function modeOf(f){const m=f.attack?.move;return clamp(m?.overdriveMode??m?.awakenMode??m?.animeMode??m?.mananMode??m?.rosterMode??m?.zenitsuMode??m?.bvnMode??f.awakenLevel??0,0,2);}
function alias(id){return ALIASES[id]||id;}
function baseClip(f){
 const a=f.attack,m=a?.move||{};if(!a)return 'idle';
 if(a.motion24Clip||m.motion24Clip)return a.motion24Clip||m.motion24Clip;
 if(a.name==='skill'){
  const id=m.overdriveSlot!==undefined?'skill'+(m.overdriveSlot+1):alias(a.variant||m.variant||a.clipId||m.clipId||'skill1');
  if(f.hero==='drake'&&m.overdrive&&GUN_PATTERNS.has(m.pattern))return 'skill3';
  if(f.hero==='wukong'&&m.overdrive&&m.overdriveSlot===0)return m.pattern==='clone'?'skill3':'attack2';
  if(f.hero==='luffy'&&m.overdrive){if(m.pattern==='pummel'||m.pattern==='giantFists')return 'skill2';if(m.pattern==='rise'||m.pattern==='riseOrbit')return 'launcher';if(m.pattern==='sweep')return 'attack2';if(m.pattern==='doubleSlam')return 'skill3';}
  if(f.hero==='naruto'&&m.overdrive&&['rise','riseOrbit'].includes(m.pattern))return 'launcher';
  return id;
 }
 if(a.name==='signature'){
  if(f.hero==='wukong')return m.kind==='parry'?'guard':'attack3';
  return {cloud:'heavy',lara:'skill3',drake:'air',tanjiro:m.kind==='fireCross'?'skill3':'airheavy',zenitsu:'attack5',manan:'dashstrike',luffy:'skill2',kirito:'skill3',naruto:'skill2'}[f.hero]||'heavy';
 }
 if(f.hero==='lara'&&m.pattern==='chargedArrow')return 'skill1';
 if(f.hero==='drake'&&m.overdrive&&GUN_PATTERNS.has(m.pattern))return 'skill3';
 if(a.name==='awaken')return 'awaken';
 return alias(a.name);
}
function weaponFor(f,clip){
 if(f.hero==='lara')return clip==='skill1'?'bow':['idle','skill2','skill3','ultimate','throw','heavy','airheavy','attack1','attack2','attack3','launcher','air'].includes(clip)?'dual-pistols':'none';
 if(f.hero==='drake')return clip==='skill1'?'grenade':['skill3','ultimate'].includes(clip)?'rifle':'fists';
 return HEROES[f.hero]?.weapon||'none';
}
function semanticFor(f,clip){
 if(f.hero==='naruto'&&clip==='skill1')return modeOf(f)===2?'kuramaPalmRelease':'rasenganPush';
 if(f.hero==='naruto'&&clip==='skill3')return 'rasenshurikenThrow';
 const weapon=weaponFor(f,clip);
 if(weapon==='rifle'||weapon==='dual-pistols')return 'gunFire';
 if(weapon==='bow')return 'bowRelease';
 if(weapon==='grenade')return 'grenadeThrow';
 return (f.hero||'')+':'+clip;
}
function isEmission(f){const a=f.attack,m=a?.move||{};return !!m.pistol||typeof m.projectile==='string'||!!m.gunOpener||m.overdrive&&PROJECTILES.has(m.pattern);}
function flatPhases(phases,kind,hero){
 let start=0;const events=[];
 for(let i=0;i<phases.length;i++){
  const p=phases[i],hits=hero==='kirito'&&kind==='anime'?[4,9,14]:p.hits||[p.hit];
  for(let j=0;j<hits.length;j++)events.push({tick:start+hits[j],type:'contact',clipId:alias(p.clipId||p.baseClip||'ultimate'),phaseIndex:i,phaseName:p.name,slot:events.length});
  start+=p.duration;
 }
 if(events.length)events.at(-1).clipId='ultimate';
 return {events,duration:start};
}
function sequence(f){
 const a=f.attack,m=a.move;
 if(a.overdriveSequence){
  const s=a.overdriveSequence,order=HEROES[f.hero].ultimate,events=[];
  for(let i=0;i<s.hits;i++)events.push({tick:i*s.interval+Math.floor(s.interval*.6),type:['lara','drake'].includes(f.hero)?'emit':'contact',clipId:i===s.hits-1?'ultimate':order[i%order.length],slot:i,phaseIndex:i,phaseName:i===s.hits-1?'finisher':'pursuit'});
  return {kind:'overdrive',tick:Math.max(0,a.t-s.startT),events,duration:s.duration,finished:!!s.finished};
 }
 if(a.animeSequence){const s=a.animeSequence,p=flatPhases(root.RiftAnimeTrioRules?.PHASES?.[f.hero]||[],'anime',f.hero);return {kind:'anime',tick:Math.max(0,a.t-s.startT),...p,finished:!!s.finished};}
 if(a.waterSequence){const p=flatPhases(root.RiftTanjiroRules?.ULTIMATE_PHASES||[],'water',f.hero);return {kind:'water',tick:Math.max(0,a.t-a.waterSequence.startT),...p,finished:!!a.waterSequence.finished};}
 if(a.fireSequence){const p=flatPhases(root.RiftTanjiroFireRules?.PHASES||[],'fire',f.hero);return {kind:'fire',tick:Math.max(0,a.t-a.fireSequence.startT),...p,finished:!!a.fireSequence.finished};}
 if(a.mananSequence){const p=flatPhases(root.RiftMananRules?.ULTIMATE_PHASES||[],'terrain',f.hero);return {kind:'terrain',tick:Math.max(0,a.t-a.mananSequence.startT),...p,finished:!!a.mananSequence.finished};}
 if(a.sixfold){
  const z=a.sixfold,events=[];
  for(let leg=0;leg<5;leg++){
   const dir=z.dir*(leg%2?-1:1),from=dir>0?z.left:z.right,to=dir>0?z.right:z.left;
   const crossing=clamp(Math.round((z.targetX-from)/(to-from)*6),1,6);
   events.push({tick:4+leg*6+crossing-1,type:'contact',slot:leg,clipId:leg%2?'attack2':'dashstrike',phaseIndex:leg,phaseName:'diagonal45'});
  }
  events.push({tick:37,type:'contact',slot:5,clipId:'ultimate',phaseIndex:5,phaseName:'verticalFinish'});
  return {kind:'sixfold',tick:Math.max(0,a.t-z.start),events,duration:41,finished:false};
 }
 return null;
}
function timeline(f){
 const a=f.attack,m=a?.move||{};if(!a)return {kind:'idle',tick:Math.max(0,f.animTime||0),duration:30,events:[]};
 const seq=sequence(f);if(seq)return seq;
 const hits=m.active===0?0:Math.max(1,m.hits||1),events=[];
 for(let i=0;i<hits;i++){
  const tick=(m.startup||0)+i*(m.interval||m.active||1);if(tick>=(m.startup||0)+(m.active||1))break;
  events.push({tick,type:isEmission(f)?'emit':'contact',slot:i,clipId:baseClip(f),phaseName:m.pattern||m.kind||a.name});
 }
 return {kind:'move',tick:Math.max(0,a.t||0),duration:Math.max(1,m.end||30),events};
}
function closestEvent(events,artTick){
 let best=null,distance=Infinity;
 for(const event of events){const d=Math.abs(artTick-cel(event.tick));if(d<distance){best=event;distance=d;}}
 return best;
}
function attachmentFor(f,clip){
 if(f.hero!=='naruto'||!f.attack)return null;
 if(clip==='ultimate')return {name:'palm',kind:'animeTrioFx',clipId:'ultimate',scale:.95,until:isEmission(f)?'emit':'contact'};
 if(clip==='skill1')return {name:'palm',kind:'animeTrioFx',clipId:'rasengan',scale:.6,until:isEmission(f)?'emit':'contact'};
 if(clip==='skill3')return {name:'palm',kind:'animeTrioFx',clipId:'shuriken',scale:.55,until:'emit'};
 return null;
}
function passive(f){
 if(f.downTime>0)return 'down';if(f.stun>0||f.knockdown)return 'hurt';if(f.block||f.guardStun>0)return 'guard';
 if(f.dash||f.blinkTime)return 'dashstrike';if(f.grounded===false||f.state==='jump')return 'jump';if(Math.abs(f.vx||0)>1||f.state==='run')return 'run';return 'idle';
}
function resolve(f,meta={}){
 if(!HEROES[f?.hero])return null;
 const a=f.attack,mode=modeOf(f),interrupted=f.stun>0||f.knockdown||f.downTime>0;
 const timing=interrupted?{kind:'state',tick:Math.max(0,f.animTime||0),duration:30,events:[]}:timeline(f),artTick=cel(timing.tick);
 let event=closestEvent(timing.events,artTick),wheel=null;
 if(f.hero==='tanjiro'&&mode===0&&timing.kind==='water'&&!timing.finished){
  let start=0;for(const [index,p]of (root.RiftTanjiroRules?.ULTIMATE_PHASES||[]).entries()){
   if(p.fx==='waterWheel'){wheel={start,duration:p.duration,index};break;}start+=p.duration;
  }
  if(wheel&&timing.tick>=wheel.start&&timing.tick<wheel.start+wheel.duration)event=closestEvent(timing.events.filter(e=>e.phaseIndex===wheel.index),artTick);
 }
 const clipId=interrupted?passive(f):a?(event?.clipId||baseClip(f)):passive(f),count=meta.frames?.length||meta.frameCount||12;
 const contactFrame=clamp(Math.floor(event?.type==='emit'?(meta.releaseFrame??meta.events?.releaseFrame??5):(meta.contactFrame??meta.events?.contactFrame??5)),0,count-1);
 let frameIndex=event?clamp(contactFrame+artTick-cel(event.tick),0,count-1):clipId==='idle'?artTick%count:Math.min(count-1,artTick);
 // A deliberately authored continuous multihit passage must not restart at
 // the same contact cel for every hit. Only clips with an explicit span opt
 // in; cinematic phases and all existing single-contact clips keep timing.
 const span=meta.contactSpan;
 const continuousTanjiro=f.hero==='tanjiro'&&a?.name==='skill'&&(mode===2&&['skill2','skill3'].includes(clipId)||mode===0&&clipId==='skill1'&&a.variant==='waterwheel');
 if(continuousTanjiro&&timing.kind==='move'&&timing.events.length>1&&Array.isArray(span)&&span.length===2&&span.every(Number.isInteger)&&span[0]>=0&&span[1]>=span[0]&&span[1]<count&&timing.events.every(e=>e.clipId===clipId&&e.type==='contact')){
  const first=cel(timing.events[0].tick),last=cel(timing.events.at(-1).tick);
  if(last>first)frameIndex=clamp(artTick<first?span[0]+artTick-first:artTick>last?span[1]+artTick-last:span[0]+Math.floor((artTick-first)*(span[1]-span[0])/(last-first)+1e-8),0,count-1);
 }
 // The cinematic waterwheel is one complete airborne turn. Its four damage
 // events must not rewind that turn; sample the authored passage on the same
 // 24Hz grid, including held boundary poses beside the adjacent phases.
 if(wheel&&clipId==='skill1'){
  const first=cel(wheel.start),last=cel(wheel.start+wheel.duration-1);
  frameIndex=Math.floor(clamp(artTick-first,0,last-first)*(count-1)/Math.max(1,last-first));
 }
 if(timing.finished)frameIndex=count-1;
 const lastContact=a?.motion24LastContact,eventAttackTick=event?(a.t-timing.tick)+event.tick:Infinity,confirmed=event?.type==='contact'&&lastContact?.attackSerial===f.attackSerial&&lastContact.tick>=eventAttackTick&&(event.slot===undefined||lastContact.slot===undefined||lastContact.slot===event.slot);
 const attached=attachmentFor(f,clipId),released=!!attached&&(attached.until==='emit'?!!event&&timing.tick>=event.tick:!!confirmed);
 const phaseName=timing.finished?'recovery':!event?'idle':artTick<cel(event.tick)?'windup':artTick===cel(event.tick)?'contact':'recovery';
 const bodyAngle=f.hero==='drake'&&a?.move.overdrive&&['leapVolley','orbitVolley'].includes(a.move.pattern)&&a.t>=a.move.startup&&a.t<a.move.startup+a.move.active?(Math.atan2(12,a.move.projectileSpeed||25)+.15)*(f.dir||1):0;
 return {hero:f.hero,mode,clipId,supported:CLIPS.includes(clipId),semantic:semanticFor(f,clipId),weaponKind:weaponFor(f,clipId),fps:FPS,simFps:SIM_FPS,frameIndex,artTick,clockTick:timing.tick,clockKey:f.hero+':'+(f.attackSerial||0)+':'+timing.kind,bodyAngle,pivot:{x:f.x,y:f.y-90},
  phase:{name:phaseName,t:timing.tick,duration:timing.duration,slot:event?.slot??0,sequence:timing.kind,action:event?.phaseName||clipId},
  event:event?{...event,cell:cel(event.tick),confirmed:!!confirmed}:null,
  contactTicks:timing.events.filter(e=>e.type==='contact').map(e=>e.tick),emitTicks:timing.events.filter(e=>e.type==='emit').map(e=>e.tick),
  attachment:interrupted?null:attached,released:interrupted||released,attackSerial:f.attackSerial||0};
}
root.RiftMotion24Rules={FPS,SIM_FPS,CLIPS,HEROES,cel,modeOf,baseClip,timeline,resolve};
if(typeof module!=='undefined')module.exports=root.RiftMotion24Rules;
})(typeof window!=='undefined'?window:globalThis);
