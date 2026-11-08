'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),world=new Rift.World();
const $=id=>document.getElementById(id),fx=new RiftFeedback.Feedback();let started=false,paused=false,soundOn=false,endReveal=0;const held=new Set();let clock=0,acc=0,last=0;let viewCamera={x:0,y:0,zoom:1};let assetLoading=false,retryLoadOnly=false,backgroundPause=false,pauseRevision=0,rosterTicket=0,artBootReady=!window.RiftMotionData?.fullRoster;
if(window.RiftMotionData?.fullRoster&&Rift.HEROES[window.RiftMotionData.initialHero])world.reset('training',window.RiftMotionData.initialHero);
if(typeof URLSearchParams!=='undefined'&&typeof location!=='undefined'){const requestedHero=new URLSearchParams(location.search).get('hero');if(Rift.HEROES[requestedHero])world.reset('training',requestedHero,'cloud');}
if(window.RiftMotionData?.fullRoster){world.settings.cinematicTicks=90;world.settings.platforms=true;}
if(window.RiftArena)world.configureArena({width:RiftArena.WORLD_RIGHT,platforms:RiftArena.getPlatforms?.('temple')||RiftArena.platforms,spawnPoints:RiftArena.spawnPoints||[600,920]});
const actions={KeyJ:'attack',KeyK:'jump',KeyN:'drop',KeyL:'dash',KeyU:'skill',KeyI:'sub',KeyO:'ultimate',KeyH:'awaken',KeyP:'heavy',KeyV:'throw'};
let sceneId='temple',environmentMotion=true;const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;environmentMotion=!reducedMotion;if(reducedMotion){world.settings.shake=false;world.settings.cinematics=false;}let impactFlash=!reducedMotion;

function rosterLoading(){return !!window.RiftMotionData?.fullRoster&&typeof window.RiftMotionPreview?.ensureHero==='function';}
function rosterLoadFailed(message){
 retryLoadOnly=true;assetLoading=true;held.clear();$('start').disabled=false;$('artStatus').textContent=message;
 overlay('资源尚未载入',message,'重试加载');
}
function finishResourceLoad(){
 assetLoading=false;$('start').disabled=false;
 if(retryLoadOnly&&world.result)overlay(world.result,`本局结束 · 你的生命 ${Math.ceil(world.p1.hp)} / 对手生命 ${Math.ceil(world.p2.hp)}`,'再战一局');
 else if(retryLoadOnly&&!started)overlay(world.mode==='training'?'距离，是第一招。':'准备好，正面交锋。','角色与场景已就绪，点击开始。',world.mode==='training'?'进入训练场':'开始对战');
 else if(started&&!world.result){
  if(paused){overlay('喘口气，再出招。','战斗已暂停。继续后回到当前局。','继续对战');$('pause').innerHTML='继续 <kbd>Esc</kbd>';}
  else if(retryLoadOnly)$('overlay').classList.add('hidden');
 }
 retryLoadOnly=false;
}
function ensureCurrentRoster(resume){
 const sceneApi=typeof RiftScenes.ensureScene==='function',arenaApi=typeof window.RiftArena?.ensureScene==='function',zenitsuApi=[world.p1.hero,world.p2.hero].includes('zenitsu')&&typeof window.RiftZenitsuCombat?.ensureReady==='function',tanjiroApi=[world.p1.hero,world.p2.hero].includes('tanjiro')&&typeof window.RiftTanjiroVisual?.ensureReady==='function';
 if(!rosterLoading()&&!sceneApi&&!arenaApi&&!zenitsuApi&&!tanjiroApi)return true;
 const api=rosterLoading()?window.RiftMotionPreview:null,ids=[world.p1.hero,world.p2.hero],requestedScene=sceneId,ticket=++rosterTicket;
 if((!api||ids.every(id=>api.isHeroReady(id)))&&(!sceneApi||RiftScenes.isSceneReady(requestedScene))&&(!arenaApi||RiftArena.isSceneReady(requestedScene))&&(!zenitsuApi||RiftZenitsuCombat.isReady())&&(!tanjiroApi||RiftTanjiroVisual.isReady()&&(!window.RiftTanjiroDragon||RiftTanjiroDragon.isReady()))){finishResourceLoad();api?.retainHeroes?.(ids);return true;}
 assetLoading=true;held.clear();$('start').disabled=true;
 $('artStatus').textContent='正在载入 '+ids.map(id=>Rift.HEROES[id].name).join(' / ')+' 的像素动作与场景…';
 Promise.all([...(api?ids.map(id=>api.ensureHero(id)):[]),...(sceneApi?[RiftScenes.ensureScene(requestedScene)]:[]),...(arenaApi?[RiftArena.ensureScene(requestedScene)]:[]),...(zenitsuApi?[RiftZenitsuCombat.ensureReady()]:[]),...(tanjiroApi?[RiftTanjiroVisual.ensureReady(),...(window.RiftTanjiroDragon?[RiftTanjiroDragon.ensureReady()]:[])]:[])]).then(ok=>{
  if(ticket!==rosterTicket)return;
  if(ok.includes(false)){rosterLoadFailed('角色或场景资源加载失败，请点击重试加载。');return;}
  finishResourceLoad();api?.retainHeroes?.(ids);
  $('artStatus').textContent='动漫像素角色 · 当前动作与立体建筑战场已就绪';
  if(artBootReady)paintPreviews();if(resume)resume();
 }).catch(()=>{if(ticket===rosterTicket)rosterLoadFailed('角色资源加载失败，请点击重试加载。');});
 return false;
}
function initAudio(){fx.sound(soundOn);}
function overlay(title,desc,button){$('overlayTitle').textContent=title;$('overlayText').textContent=desc;$('start').innerHTML=button+' <span>↗</span>';$('overlay').classList.remove('hidden');}
function start(){const keepPause=retryLoadOnly&&paused,pauseAtRequest=pauseRevision;backgroundPause=false;if(!ensureCurrentRoster(()=>{retryLoadOnly=false;if(keepPause||backgroundPause||document.hidden||(paused&&pauseRevision!==pauseAtRequest)){paused=true;held.clear();overlay('喘口气，再出招。','战斗已暂停。继续后回到当前局。','继续对战');$('pause').innerHTML='继续 <kbd>Esc</kbd>';}else start();}))return;retryLoadOnly=false;if(world.result){world.reset();fx.reset();endReveal=0;}started=true;paused=false;held.clear();$('overlay').classList.add('hidden');$('pause').innerHTML='暂停 <kbd>Esc</kbd>';canvas.focus();initAudio();}
function reset(){world.reset();fx.reset();endReveal=0;held.clear();if(started){paused=false;$('overlay').classList.add('hidden');}else overlay('距离，是第一招。',world.p1.hero==='lara'?'J 三段点射；S + J 上挑射击；空中 J 向前下方开火。':'接近对手，连续按 J 打出三段连击。试试 S + J 挑空，再跳起追击。','进入训练场');$('pause').innerHTML='暂停 <kbd>Esc</kbd>';ensureCurrentRoster();canvas.focus();}
function pause(){if(!started||world.result)return;pauseRevision++;if(assetLoading){paused=true;held.clear();return;}paused=!paused;held.clear();if(paused)overlay('喘口气，再出招。','战斗已暂停。继续后回到当前局。','继续对战');else $('overlay').classList.add('hidden');$('pause').innerHTML=paused?'继续 <kbd>Esc</kbd>':'暂停 <kbd>Esc</kbd>';}
function mode(m){world.reset(m);fx.reset();endReveal=0;$('training').classList.toggle('active',m==='training');$('duel').classList.toggle('active',m==='duel');$('training').setAttribute('aria-pressed',m==='training');$('duel').setAttribute('aria-pressed',m==='duel');$('modeLabel').textContent=m==='training'?'TRAINING / 无限时间':'VERSUS / 99 秒一局';held.clear();paused=false;started=false;$('pause').innerHTML='暂停 <kbd>Esc</kbd>';overlay(m==='training'?'距离，是第一招。':'准备好，正面交锋。',m==='training'?'对手不会主动攻击，适合练习连招。停止攻击后，对手自动恢复。':'对手会接近、攻击、防御和瞬移。留一点气力，给自己一次反击。',m==='training'?'进入训练场':'开始对战');ensureCurrentRoster();}
$('start').onclick=start;$('reset').onclick=reset;$('pause').onclick=pause;$('training').onclick=()=>mode('training');$('duel').onclick=()=>mode('duel');
$('sound').onclick=()=>{soundOn=!soundOn;initAudio();$('sound').textContent='声音：'+(soundOn?'开':'关');$('sound').setAttribute('aria-pressed',soundOn);if(soundOn)fx.play({type:'swing',weapon:world.p1.info.weapon});};
for(const key of ['hitstop','shake','debug','cinematics'])$(key).onchange=e=>{world.settings[key]=e.target.checked;if(key==='shake'&&!e.target.checked)world.shake=0;};
function keyDown(code){if(code==='Escape'){pause();return;}if(code==='KeyR'){reset();return;}if(!started||paused||world.result||assetLoading)return;held.add(code);if(actions[code])world.action(world.p1,actions[code],(held.has('KeyD')?1:0)-(held.has('KeyA')?1:0),{down:held.has('KeyS'),up:held.has('KeyW')});}
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;if(actions[e.code]||['KeyA','KeyD','KeyS','KeyW','KeyR','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat)keyDown(e.code);}});window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',()=>{backgroundPause=true;held.clear();if(started&&!paused&&!world.result)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){backgroundPause=true;held.clear();if(started&&!paused&&!world.result)pause();}});
for(const btn of document.querySelectorAll('[data-key]')){btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);keyDown(btn.dataset.key);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(ev,()=>held.delete(btn.dataset.key));}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}function line(points,color,width=1){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}function poly(points,color){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();}function text(t,x,y,size,color,align='left',weight=500){ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Noto Sans SC",system-ui,sans-serif`;ctx.textAlign=align;ctx.fillText(t,x,y);}function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function fighter(f,ghost=false){
 if(!ghost)window.RiftTanjiroVisual?.drawAura(ctx,f,{reducedMotion,tick:world.frame});
 if((f.knockdown||f.downTime)&&window.RiftMotionData?.heroes?.[f.hero]?.clips?.knockdown){RiftFighters.draw(ctx,f,world.frame,ghost);return;}
 if(!ghost&&(f.knockdown||f.downTime)){
  ctx.save();const down=f.downTime>0,angle=down?-f.dir*Math.PI/2:f.dir*(.4+Math.sin((f.fallTime||0)*.12)*.45);
  ctx.translate(f.x,down?f.y-12:f.y-70);ctx.rotate(angle);ctx.translate(-f.x,down?-f.y:70-f.y);
  RiftFighters.draw(ctx,{...f,stun:Math.max(1,f.stun),animState:'hurt'},world.frame,false);ctx.restore();return;
 }
 if(window.RiftTanjiroVisual?.drawFighter(ctx,f))return;
 if(window.RiftZenitsuCombat?.drawFighter(ctx,f))return;RiftFighters.draw(ctx,f,world.frame,ghost);
}
function hud(){const p=world.p1,q=world.p2,stageY=window.RiftStage?.cameraY(world)||0;const bar=(f,x,flip)=>{text(f.info.name+' / '+f.info.en,flip?x+420:x,41,16,'#e6eee2',flip?'right':'left',700);text(f===p?'01 · YOU':world.mode==='training'?'02 · TRAINING':'02 · CPU',flip?x:x+420,40,10,f.color,flip?'left':'right');rect(x,54,420,14,'#101e25cc');const trailHP=fx.health(f);rect(flip?x+420*(1-trailHP/100):x,54,420*trailHP/100,14,'#d99671');rect(flip?x+420*(1-f.hp/100):x,54,420*f.hp/100,14,f.color);rect(x,54,420,2,'#efffe13b');rect(x,76,260,4,'#101e25');rect(flip?x+260*(1-f.energy/100):x,76,260*f.energy/100,4,f.color);text(Math.ceil(f.energy)+' / 100 气',flip?x+420:x,100,10,'#b2c0b6',flip?'right':'left');};bar(p,45,false);bar(q,735,true);text(world.mode==='training'?'∞':String(world.time).padStart(2,'0'),600,68,43,'#dce6d6','center',700);text(world.mode==='training'?'FREE PRACTICE':'ROUND 01',600,94,9,'#8aa39d','center');
if(p.combo>1){text(String(p.combo).padStart(2,'0'),62,216,65,p.color,'left',800);text('HIT COMBO',65,240,12,p.color);text(p.comboDamage+' DAMAGE',65,262,10,'#b0c6b6');}if(q.combo>1){text(q.combo+' HIT',1135,216,34,q.color,'right',800);}
if(world.banner>0&&!world.cutin&&!window.RiftPresentation?.inspect(world)){rect(350,112,500,36,'#071319bb');text(world.bannerText,600,137,18,'#e6f6d6','center',800);}
const enemyScreenX=600+viewCamera.x+(q.x-600)*viewCamera.zoom;if(enemyScreenX<30||enemyScreenX>1170){const right=enemyScreenX>1170;text((right?'':'◀ ')+q.info.name+(right?' ▶':''),right?1165:35,320,14,q.color,right?'right':'left',700);}
if(p.hero==='tanjiro'&&p.awakenLevel)text((p.awakenLevel===2?'全觉醒 · 技能免气力':'觉醒 · 五连解锁')+' '+Math.ceil(p.awakenTime/60)+'s',45,121,12,'#9cefff');
const tagX=600+viewCamera.x+(p.x-600)*viewCamera.zoom,tagY=340+viewCamera.y+(p.y-178-340)*viewCamera.zoom;text(p.info.name,tagX,Math.max(124,tagY),10,p.color,'center');poly([[tagX-4,Math.max(133,tagY+9)],[tagX+4,Math.max(133,tagY+9)],[tagX,Math.max(138,tagY+14)]],p.color);
}
function drawBreathEffect(e){
 const k=1-e.life/e.max,r=e.range*.55;ctx.shadowBlur=25;ctx.lineJoin='round';ctx.lineCap='round';
 if(e.kind==='waterWheel'){
  ctx.save();ctx.globalAlpha*=.3;ctx.strokeStyle='#2992dd';ctx.lineWidth=32;ctx.beginPath();ctx.ellipse(0,0,r+18,88,-.6,-2.8+k*2,2.4+k*2);ctx.stroke();ctx.restore();for(let i=0;i<3;i++){ctx.beginPath();ctx.strokeStyle=['#0e69ad','#3ccce9','#edfffb'][i];ctx.lineWidth=[24,13,3][i];ctx.ellipse(0,0,r+i*2,64+i*2,-.6+k*.7,-2.5+k*2,2.6+k*2);ctx.stroke();}
  for(let i=0;i<16;i++){const a=i*.43+k*3;ellipse(Math.cos(a)*(r+15+k*32),Math.sin(a)*(80+k*25),2+i%3,5,'#b9faff');}for(let i=0;i<3;i++){ctx.beginPath();ctx.strokeStyle=i%2?'#f0fffb':'#379fd0';ctx.lineWidth=2;ctx.ellipse(-12,0,r+14+i*6,82+i*6,-.5,i*.9+k*3,i*.9+k*3+1.25);ctx.stroke();}
 }else if(e.kind==='waterDragon'){
  const pts=[];for(let i=0;i<30;i++){let x=-r+i*r*2/29;pts.push([x,Math.sin(i*.25+k*4+e.index)*23]);}
  ctx.save();ctx.globalAlpha*=.3;line(pts,'#3aa8e5',49);ctx.restore();line(pts,'#115d94',31);line(pts,'#28bad3',19);line(pts.map(([x,y])=>[x,y-5]),'#c6fff3',3);
  const y=pts.at(-1)[1];poly([[r-14,y-13],[r+18,y-10],[r+31,y],[r+12,y+7],[r-12,y+11]],'#b2f5e9');poly([[r+2,y-8],[r+9,y-8],[r+5,y-3]],'#206687');line([[r-5,y-11],[r-12,y-28],[r+6,y-19]],'#d9fff6',3);line([[r+15,y+4],[r+37,y+14]],'#e6fff8',2);
  for(let i=0;i<13;i++){const x=-r+i*r/6,y=Math.sin(i*.55+k*4+e.index)*23;line([[x,y-14],[x+9,y-30],[x+16,y-12]],'#c6fff1',2);ellipse(x,40+Math.sin(i+k*4)*18,3,6,'#a5f5ec');}ctx.save();ctx.globalAlpha*=.35;for(let i=0;i<3;i++){ctx.beginPath();ctx.strokeStyle='#8fe9f4';ctx.lineWidth=4;ctx.ellipse(0,68,r*(1+k)+i*13,13+i*7,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
 }else{
  // Lightning is a cosmetic trace; damage comes from the travelling sword hitbox.
  const pts=[[-r-100,20],[-r-50,4],[-r-27,16],[-r,-8],[-r+18,8],[0,-6],[20,3],[r,-2],[r+24,-16]];
  line(pts,'#2170af66',30);line(pts,'#368cb9bb',17);line(pts,'#9ae9ff',8);line(pts,'#fff6cb',2.8);for(let j=0;j<3;j++){const branch=pts.map(([x,y],i)=>[x+(j-1)*12,y+(j-1)*25+Math.sin(i*2+j)*7]);ctx.save();ctx.globalAlpha*=.5;line(branch,j%2?'#ffe79b':'#b4faff',1.5);ctx.restore();}
  for(let i=0;i<6;i++){let x=-r+i*r*.4;line([[x,0],[x+12,-20-i*4],[x+5,-28-i*3],[x+28,-45-i*2]],i%2?'#ffe9a0':'#a2eeff',1.5);}
  if(e.kind==='thunderSix'){ctx.globalAlpha*=.4;line([[-r-80,35],[r+40,15]],'#fff2ac',2);line([[-r-30,-35],[r+20,-23]],'#b7f5ff',2);}
 }
}

function draw(){ctx.clearRect(0,0,1200,640);const sky=RiftScenes.DATA[sceneId].sky,skyFill=ctx.createLinearGradient(0,0,0,640);skyFill.addColorStop(0,sky[0]);skyFill.addColorStop(1,sky[1]);rect(0,0,1200,640,skyFill);if(window.RiftArena)RiftScenes.drawBackdrop?.(ctx,sceneId,world,clock,environmentMotion);ctx.save();const camera=fx.camera(world);const stageOffset=window.RiftStage?.cameraY(world)||0;camera.zoom*=window.RiftStage?.cameraZoom?.(world)||1;camera.y+=stageOffset*camera.zoom;camera.x+=window.RiftStage?.cameraX?.(world,camera.zoom)||0;viewCamera=camera;ctx.translate(600+camera.x,340+camera.y);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-600,-340);if(window.RiftArena)RiftArena.draw(ctx,sceneId,clock,environmentMotion);else{RiftScenes.draw(ctx,sceneId,clock,(world.p1.x+world.p2.x)/2,environmentMotion);window.RiftStage?.draw(ctx,world);}window.RiftPresentation?.drawStage(ctx,world,{reducedMotion});
for(const e of world.effects){if(e.kind==='tanjiroFx')window.RiftTanjiroVisual?.drawEffect(ctx,e,{reducedMotion});else if(e.arenaUltimate){if(!window.RiftTanjiroDragon?.drawEffect(ctx,e,{reducedMotion}))window.RiftFXSprites?.drawEffect(ctx,e,{reducedMotion,flash:impactFlash});}}
for(const f of [world.p1,world.p2]){ellipse(f.x,(f.groundY??Rift.FLOOR)+5,38-Math.min(20,((f.groundY??Rift.FLOOR)-f.y)*.06),7,'#07171b70');for(const t of f.trail){ctx.save();ctx.globalAlpha=t.life/30;fighter({...f,...t},true);ctx.restore();}ctx.save();if(f.inv>0&&Math.floor(clock/3)%2===0)ctx.globalAlpha=.45;fighter(f);ctx.restore();if(!(f.hero==='zenitsu'&&f.attack?.name==='ultimate'))window.RiftFXSprites?.drawStartup(ctx,f,{reducedMotion,flash:impactFlash});}
for(const b of world.projectiles){if(window.RiftFXSprites?.drawProjectile(ctx,b,{reducedMotion,flash:impactFlash}))continue;ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.vx===0?(b.direction||1):Math.sign(b.vx),1);ctx.shadowColor=b.owner.color;ctx.shadowBlur=18;if(b.kind==='bullet')ctx.rotate(Math.atan2(b.vy||0,Math.abs(b.vx||1)));
 if(['arrow','bullet','wave'].includes(b.kind)){for(let i=1;i<=5;i++){ctx.save();ctx.globalAlpha=.35*(1-i/6);line([[-i*19,0],[-i*19-35,0]],b.owner.color,Math.max(1,9-i));ctx.restore();}}
 if(b.kind==='arrow'){line([[-32,0],[32,0]],'#efddad',3);poly([[32,-5],[43,0],[32,5]],'#fff3cb');line([[-27,-5],[-18,0],[-27,5]],b.owner.color,2);}
 else if(b.kind==='bullet'){line([[-17,0],[16,0]],'#ffe8ad',4);ellipse(17,0,4,3,'#ffffff');}
 else if(b.kind==='grenade'){ctx.rotate(clock*.25);ellipse(0,0,9,11,'#9fa474');rect(-3,-14,6,6,'#c9c2a0');line([[-6,-2],[6,-2]],'#4c6245',2);}
 else{ctx.save();ctx.globalAlpha=.38;ctx.strokeStyle=b.owner.color;ctx.lineWidth=16;ctx.beginPath();ctx.ellipse(0,0,b.w*.7,b.h*.8,0,-1.5,1.5);ctx.stroke();ctx.restore();for(let i=0;i<3;i++){ctx.beginPath();ctx.strokeStyle=i%2?'#eeffff':b.owner.color;ctx.lineWidth=i?2:6;ctx.ellipse(4+i*5,0,b.w*.45,b.h*.6+i*5,0,-1.4,1.4);ctx.stroke();}poly([[-b.w*.7,-b.h*.48],[b.w*.45,-b.h*.32],[b.w*.7,0],[b.w*.45,b.h*.32],[-b.w*.7,b.h*.48],[-b.w*.15,0]],b.owner.color);poly([[0,-b.h*.38],[b.w*.6,0],[0,b.h*.38],[b.w*.2,0]],'#f5ffe8');}ctx.restore();}
for(const e of world.effects){if(e.kind==='tanjiroFx'||e.arenaUltimate)continue;if(window.RiftZenitsuCombat?.drawEffect(ctx,e,{reducedMotion}))continue;if(window.RiftFXSprites?.drawEffect(ctx,e,{reducedMotion,flash:impactFlash})||e.kind==='fxBasic')continue;ctx.save();ctx.globalAlpha=e.life/e.max;
 // R3 water wheel follows its caster, never the target; the ellipse remains
 // authored procedural FX rather than a bone- or blade-attached simulation.
 const wheel=e.kind==='waterWheel'&&e.owner&&window.RiftMotionData,pose=wheel?window.RiftMotionPreview?.resolve(e.owner):null;
 const lift=pose?.clip==='skill'?(Number(pose.frame.gameOffsetY??pose.frame.previewOffsetY)||0)*pose.scale:0;
 ctx.translate(wheel?e.owner.x+(e.dir||1)*24:e.x,wheel?e.owner.y-80+lift:e.y);ctx.scale(e.dir||1,1);ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=18;ctx.lineWidth=5;
 if(['waterWheel','waterDragon','thunderDash','thunderSix'].includes(e.kind)){drawBreathEffect(e);}
 else if(e.kind==='explosion'){const k=1-e.life/e.max;ellipse(0,0,120*k+10,100*k+10,e.color+'88');for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ellipse(Math.cos(a)*95*k,Math.sin(a)*75*k,25*(1-k)+6,20*(1-k)+5,i%2?'#ffa34488':'#ffda8988');}ctx.strokeStyle='#ffeac1';ctx.lineWidth=6*(1-k)+1;ctx.beginPath();ctx.ellipse(0,15,35+130*k,15+30*k,0,0,Math.PI*2);ctx.stroke();if(k<.22)ellipse(0,0,36*(1-k),30*(1-k),'#fff6d9');}
 else if(e.kind==='cross'){const k=1-e.life/e.max,r=95+k*60;ctx.save();ctx.globalAlpha*=.28;line([[-r,-r*.75],[r,r*.75]],e.color,35);line([[-r,r*.75],[r,-r*.75]],e.color,35);ctx.restore();line([[-r,-r*.75],[r,r*.75]],e.color,12);line([[-r,r*.75],[r,-r*.75]],'#edffff',6);line([[-r,-r*.75],[r,r*.75]],'#fffef1',3);ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,30+k*120,45+k*75,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<10;i++){const a=i*.628;poly([[Math.cos(a)*(40+k*85),Math.sin(a)*(40+k*85)],[Math.cos(a)*(62+k*110),Math.sin(a)*(62+k*110)],[Math.cos(a+.07)*(40+k*85),Math.sin(a+.07)*(40+k*85)]],i%2?'#fffcec':e.color);}}
 else if(e.kind==='staff'){const k=1-e.life/e.max;ctx.save();ctx.globalAlpha*=.28;line([[-e.range/2,0],[e.range/2,0]],e.color,36);ctx.restore();line([[-e.range/2,0],[e.range/2,0]],'#795731',17);line([[e.range/2-65,0],[e.range/2,0]],e.color,20);for(let i=0;i<4;i++){ctx.strokeStyle=i%2?'#fff5bf':e.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.range/2-15-i*25,0,10+k*30,30+k*65+i*5,0,0,Math.PI*2);ctx.stroke();}line([[-e.range/2,-5],[e.range/2,-5]],'#ffe6a1',2);}
 else{ctx.beginPath();ctx.ellipse(0,0,e.kind==='seal'?55:110,65,0,-1.5,1.5);ctx.stroke();if(e.kind==='seal'){const k=1-e.life/e.max;for(let j=0;j<2;j++){ctx.beginPath();ctx.ellipse(30,0,64+j*14,64+j*14,0,0,Math.PI*2);ctx.stroke();}for(let i=0;i<8;i++){const a=i*Math.PI/4+k;line([[30+Math.cos(a)*57,Math.sin(a)*57],[30+Math.cos(a)*80,Math.sin(a)*80]],'#fff2ac',2);}text('定',30,14,43,'#fff3c2','center',800);}}ctx.restore();}
for(const p of world.particles){ctx.globalAlpha=Math.min(1,p.life/12);line([[p.x,p.y],[p.x-p.vx*1.7,p.y-p.vy*1.7]],p.color,p.size);}ctx.globalAlpha=1;
if(world.settings.debug)for(const f of [world.p1,world.p2]){ctx.strokeStyle='#4ad8ef';ctx.lineWidth=1;ctx.strokeRect(f.x-23,f.y-Rift.HURT_HEIGHT,46,Rift.HURT_HEIGHT);const b=world.hitbox(f);if(b){ctx.fillStyle='#ff526344';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#ff5263';ctx.strokeRect(b.x,b.y,b.w,b.h);}}
fx.draw(ctx,{reducedMotion,flash:impactFlash});ctx.restore();fx.flash(ctx,impactFlash);window.RiftPresentation?.drawOverlay(ctx,world,{reducedMotion,flash:impactFlash});hud();if(!started){text(RiftScenes.DATA[sceneId].en,600,593,11,'#8ca69c','center');}else{text(world.mode==='training'?'TRAINING  ·  对手自动恢复':'VERSUS  ·  击倒对手取得胜利',600,595,10,'#718c84','center');}if(world.cutin)RiftPosters.draw(ctx,world.cutin,{reducedMotion});}
function loop(t){window.RiftTanjiroVisual?.sync(world,{paused:paused||assetLoading,soundOn,reducedMotion});let dt=Math.min(80,t-(last||t));last=t;acc+=dt;while(acc>=1000/60){
 if(started&&!paused&&!assetLoading){const beforeFrame=world.frame;if(!world.result)world.step({left:held.has('KeyA'),right:held.has('KeyD'),down:held.has('KeyS'),up:held.has('KeyW')});if(!world.cutin&&(!window.RiftFXData||world.frame!==beforeFrame)){clock++;fx.tick(world);}if(endReveal>0&&--endReveal===0)overlay(world.result,`本局结束 · 你的生命 ${Math.ceil(world.p1.hp)} / 对手生命 ${Math.ceil(world.p2.hp)}`,'再战一局');}
 else if(!started)clock++;acc-=1000/60;
}while(world.events.length){const e=world.events.shift();fx.add(e);if(e.type==='end'){held.clear();endReveal=30;}}$('feedback').textContent=paused?'已暂停 / Esc 继续':started?world.lastFeedback:'准备就绪 / 点击进入训练场';draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);

function refreshSelection(){
 const h=world.p1.hero==='tanjiro'&&window.RiftTanjiroRules?{...world.p1.info,skill:'水车 → 瀧壺 → 扭转漩涡',skillHint:'连续 U 接三种水呼吸；W + U / S + U 直接选招',ultimateHint:'21 段水呼吸连式；水龙卷升 → 横贯击飞 → 坠落倒地',desc:'四段连斩 · 水呼吸连技 · 两阶段觉醒'}:world.p1.info;$('skillName').textContent=h.skill;$('ultimateName').textContent=h.ultimate;$('skillHint').textContent=h.skillHint;$('ultimateHint').textContent=h.ultimateHint;$('heroDescription').textContent=h.desc;
 for(const b of document.querySelectorAll('[data-hero]')){const active=b.dataset.hero===world.p1.hero;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);}
 $('opponent').value=world.p2.hero;const kit=$('tanjiroKit');if(kit)kit.hidden=world.p1.hero!=='tanjiro';
}
function chooseHero(id){if(!Rift.HEROES[id])return;world.reset(world.mode,id,world.p2.hero);fx.reset();endReveal=0;held.clear();paused=false;$('pause').innerHTML='暂停 <kbd>Esc</kbd>';if(started)$('overlay').classList.add('hidden');refreshSelection();ensureCurrentRoster();canvas.focus();}
function chooseScene(id){if(!RiftScenes.DATA[id])return;sceneId=id;if(window.RiftArena?.getPlatforms)world.setArenaGeometry({width:RiftArena.WORLD_RIGHT,platforms:RiftArena.getPlatforms(id),spawnPoints:RiftArena.spawnPoints||[600,920]});const d=RiftScenes.DATA[id];$('sceneName').textContent=d.name;$('sceneDescription').textContent=d.desc;for(const b of document.querySelectorAll('[data-scene]')){const selected=b.dataset.scene===id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);}ensureCurrentRoster();}
function paintPreviews(){
 if(!artBootReady)return;
 for(const b of document.querySelectorAll('[data-hero]')){const pic=b.querySelector('canvas'),pc=pic.getContext('2d'),h=Rift.HEROES[b.dataset.hero];pc.clearRect(0,0,160,120);pc.save();pc.translate(80,113);pc.scale(.68,.68);RiftFighters.draw(pc,{x:0,y:0,dir:1,hero:b.dataset.hero,info:h,color:h.color,hp:100,animState:'idle',animTime:0},0,true);pc.restore();}
 for(const b of document.querySelectorAll('[data-scene]')){const pc=b.querySelector('canvas').getContext('2d');pc.clearRect(0,0,240,128);pc.save();pc.scale(.2,.2);if(window.RiftArena){RiftScenes.drawBackdrop?.(pc,b.dataset.scene,world,0,false);RiftArena.drawPreview(pc,b.dataset.scene);}else (RiftScenes.drawPreview||RiftScenes.draw)(pc,b.dataset.scene,0,600,false);pc.restore();}
}
for(const b of document.querySelectorAll('[data-hero]'))b.onclick=()=>chooseHero(b.dataset.hero);
for(const b of document.querySelectorAll('[data-scene]'))b.onclick=()=>chooseScene(b.dataset.scene);
paintPreviews();
window.RiftScenes.previewsReady?.then(()=>paintPreviews());
window.RiftArena?.previewsReady?.then(()=>paintPreviews());
Promise.all([window.RiftZenitsuCombat?.ready||Promise.resolve(true),RiftFighters.ready,RiftScenes.ready,window.RiftArena?.ready||Promise.resolve(true),RiftPosters.ready,window.RiftMotionPreview?.ready||Promise.resolve(true),window.RiftFXSprites?.ready||Promise.resolve(true)]).then(loaded=>{artBootReady=true;paintPreviews();if(rosterLoading()){ensureCurrentRoster();if(!assetLoading)$('artStatus').textContent=loaded.includes(false)?'部分资源未能载入，请刷新重试':'动漫像素角色 · 当前动作与立体建筑战场已就绪';}else $('artStatus').textContent=loaded.includes(false)?'部分美术未能载入，正在使用备用绘制':'方向操控已更新 · 六名角色必杀特写海报已就绪 · A / D + I 定向瞬移';}).catch(()=>{$('artStatus').textContent='部分美术载入失败，请重新打开文件';});
$('opponent').onchange=e=>{world.reset(world.mode,world.p1.hero,e.target.value);fx.reset();endReveal=0;held.clear();paused=false;$('pause').innerHTML='暂停 <kbd>Esc</kbd>';if(started)$('overlay').classList.add('hidden');refreshSelection();ensureCurrentRoster();canvas.focus();};
$('environmentMotion').checked=environmentMotion;$('environmentMotion').onchange=e=>{environmentMotion=e.target.checked;};$('shake').checked=world.settings.shake;refreshSelection();chooseScene(sceneId);

$('impactFlash').checked=impactFlash;$('impactFlash').onchange=e=>{impactFlash=e.target.checked;};

$('cinematics').checked=world.settings.cinematics;

if(rosterLoading())ensureCurrentRoster();

if(window.RiftMotionData?.fullRoster){$('platforms').checked=true;$('platforms').onchange=e=>{world.settings.platforms=e.target.checked;};}

if(world.p1.hero==='tanjiro'&&!started)overlay('水之呼吸 · 连式','连续 J 四段斩击；U 接水车、瀧壺、扭转漩涡。H 觉醒，O 命中展开场内连斩，最后显示终结奥义图。完整招式表在战场下方。','进入训练场');
if(world.p1.hero==='zenitsu'&&!started)overlay('霹雳一闪 · 六连','A / D 选择方向，按 O 横向冲刺。命中后自动挑空，接向上 Z 字雷闪与垂直终结，弹飞敌人坠地；按 I 可替身脱离。','进入训练场');

for(const b of document.querySelectorAll('[data-tanjiro-action]'))b.onclick=()=>{
 if(!started||paused||assetLoading||world.result||world.p1.hero!=='tanjiro')return;
 const value=b.dataset.tanjiroAction,skill=['waterwheel','waterfall','whirlpool'].includes(value);
 world.action(world.p1,skill?'skill':value,world.p1.inputDir,{variant:skill?value:undefined});canvas.focus();
};
