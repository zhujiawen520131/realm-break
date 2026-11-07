'use strict';
const storage=SixfoldReviewStore.storage(window);
const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),sound=new SixfoldAudio();
let storageKey=null,revision='未加载',director=null,assets=null,data=null,lastRAF=null,currentPhase='',generation=0,review=SixfoldReviewStore.initial();
['verdict','overallNote','phaseNote'].forEach(id=>$(id).disabled=true);
$('reduced').checked=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
function msLabel(ms){return (ms/1000).toFixed(2).padStart(5,'0');}
function save(){review.verdict=$('verdict').value;review.overall=$('overallNote').value;try{if(!storageKey)throw new Error('未加载内容版本');storage.setItem(storageKey,JSON.stringify(review));$('saveStatus').textContent='已保存在当前浏览器';}catch(_){$('saveStatus').textContent='浏览器禁止保存，请复制审核意见';}}
function pause(){director?.pause();sound.cancel();lastRAF=null;update();}
function seek(ms){if(!director)return;pause();director.seek(ms);update();}
function update(){
 if(!director)return;const s=director.inspect();$('clock').textContent=msLabel(s.elapsedMs)+' / '+msLabel(s.totalMs);$('seek').value=s.elapsedMs;$('play').textContent=s.running?'暂停':'播放演出';$('phaseLabel').textContent=s.label+(s.ended?' · 播放结束':'');$('legLabel').textContent=s.phase==='sixfold'&&s.legIndex>=0?'轨迹 '+(s.legIndex+1)+' / 6':'';
 if(s.phase!==currentPhase){currentPhase=s.phase;$('noteLabel').textContent='「'+s.label+'」备注';$('phaseNote').value=review.phases[s.phase]||'';}
 document.querySelectorAll('[data-phase]').forEach(b=>{b.classList.toggle('active',b.dataset.phase===s.phase);b.setAttribute('aria-current',String(b.dataset.phase===s.phase));});
 $('currentSource').textContent='当前：'+s.label+'。'+s.adaptation;
 SixfoldRenderer.render(ctx,assets,s);
}
function buildChapters(){
 const chapters=$('chapters');chapters.replaceChildren();for(const p of director.timeline.phases){const b=document.createElement('button'),name=document.createElement('span'),time=document.createElement('small');b.className='chapter';b.dataset.phase=p.id;name.textContent=p.label;time.textContent=msLabel(p.startMs)+' → '+msLabel(p.endMs);b.append(name,time);b.onclick=()=>seek(p.startMs);chapters.append(b);}
 $('sourceNote').textContent=data.sourceDescription;const list=$('adaptations');list.replaceChildren();for(const note of data.notes||[]){const li=document.createElement('li');li.textContent=note;list.append(li);}
 const table=document.createElement('table'),head=document.createElement('tr');for(const text of ['阶段','原片位置 / 秒','改编说明']){const th=document.createElement('th');th.textContent=text;head.append(th);}table.append(head);
 for(const p of director.timeline.phases){const tr=document.createElement('tr');for(const text of [p.label,p.sourceStart===p.sourceEnd?p.sourceStart.toFixed(3)+' 姿态':p.sourceStart.toFixed(3)+'–'+p.sourceEnd.toFixed(3),p.adaptation]){const td=document.createElement('td');td.textContent=text;tr.append(td);}table.append(tr);}$('sourceTable').replaceChildren(table);
}
async function json(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw new Error(url+' 暂不可用');return r.json();}
async function load(){
 const run=++generation;pause();assets=null;$('loading').hidden=false;$('retry').hidden=true;['play','replay','step','seek'].forEach(id=>$(id).disabled=true);$('assetStatus').textContent='正在核验真实PNG与动画帧…';
 try{
  const timeline=await json('timeline.json');if(run!==generation)return;data=timeline;director=SixfoldDirector.create(data);director.setDirection(Number($('direction').value));director.setSpeed(Number($('speed').value));director.setReducedMotion($('reduced').checked);$('seek').max=director.timeline.totalMs;buildChapters();
  const manifest=await json('manifest.json');storageKey=await SixfoldReviewStore.key(manifest,data);if(run!==generation)return;revision=manifest.revision||'unversioned';review=SixfoldReviewStore.restore(storage,storageKey);$('verdict').value=review.verdict;$('overallNote').value=review.overall;currentPhase='';['verdict','overallNote','phaseNote'].forEach(id=>$(id).disabled=false);$('revisionLabel').textContent='内容版本：'+revision+' · 本地审核按素材和时间轴隔离';const loaded=await SixfoldRenderer.load(manifest,{poses:director.timeline.phases.map(p=>p.pose)});if(run!==generation)return;assets=loaded;
  if(!assets.ready)throw new Error(assets.errors.join('；'));
  $('assetStatus').textContent=Object.keys(manifest.images).length+'张PNG（含'+Object.keys(manifest.backgrounds).length+'幅背景） · '+Object.keys(manifest.clips).length+'组素材已就绪';$('loading').hidden=true;['play','replay','step','seek'].forEach(id=>$(id).disabled=false);buildInspector();update();
 }catch(e){if(run!==generation)return;$('loadDetail').textContent=String(e.message||e);$('assetStatus').textContent='美术未就绪 · 不展示占位演出';$('retry').hidden=false;update();}
}
$('play').onclick=()=>{if(!assets?.ready)return;if(director.inspect().running)pause();else{director.play();lastRAF=null;update();}};
$('replay').onclick=()=>{if(!assets?.ready)return;sound.cancel();director.restart();lastRAF=null;update();};$('step').onclick=()=>seek(director.inspect().elapsedMs+1000/60);
$('seek').oninput=e=>seek(Number(e.target.value));$('speed').onchange=e=>{sound.cancel();director?.setSpeed(Number(e.target.value));};$('direction').onchange=e=>{pause();director?.setDirection(Number(e.target.value));update();};$('reduced').onchange=e=>{sound.cancel();director?.setReducedMotion(e.target.checked);update();};
$('sound').onchange=e=>{if(!sound.setEnabled(e.target.checked)&&e.target.checked){e.target.checked=false;$('saveStatus').textContent='此浏览器暂不能启用声音';}};
$('phaseNote').oninput=()=>{if(currentPhase)review.phases[currentPhase]=$('phaseNote').value;save();};$('overallNote').oninput=save;$('verdict').onchange=save;$('retry').onclick=load;

const clipNames={crouch:'低身持刀',face:'低头与半身',eye:'眼部觉醒',sideFace:'侧脸推进',facePullback:'双眼拉回半身',overheadReady:'俯视持刀',trailCurrent:'黄白当前楔形',trailResidual:'青白旧迹',inflightFace:'空中侧脸',charge:'低身蓄势',dash:'高速剪影',finish:'竖直终结',launch:'空中持刀与蹬发',moon:'月下屈膝',ending:'俯视空中收势',air:'空中动作',lightning:'蓝白纵雷',debris:'浮石碎片',trail:'高速楔形拖尾',burst:'折点爆星',roof:'屋顶变化'};
function showFrame(){if(!assets?.ready)return;const name=$('clipSelect').value,clip=assets.manifest.clips[name];if(!clip)return;const index=Math.max(0,Math.min(clip.frames.length-1,Number($('frameSeek').value)));$('frameSeek').value=index;const frame=clip.frames[index],image=assets.images[frame.image],crop=frame.crop||[0,0,image.width,image.height];$('frameInfo').textContent=(clipNames[name]||name)+' · 第'+(index+1)+' / '+clip.frames.length+'帧 · '+crop[2]+'×'+crop[3]+' · '+frame.image;SixfoldRenderer.renderFrame($('frameCanvas').getContext('2d'),assets,name,index);}
function chooseClip(){const clip=assets?.manifest.clips[$('clipSelect').value];if(!clip)return;$('frameSeek').max=clip.frames.length-1;$('frameSeek').value=0;showFrame();}
function buildInspector(){const select=$('clipSelect');select.replaceChildren();for(const name of Object.keys(assets.manifest.clips)){const option=document.createElement('option');option.value=name;option.textContent=clipNames[name]||name;select.append(option);}['clipSelect','frameSeek','prevFrame','nextFrame'].forEach(id=>$(id).disabled=false);chooseClip();}
$('clipSelect').onchange=chooseClip;$('frameSeek').oninput=showFrame;$('prevFrame').onclick=()=>{$('frameSeek').value=Math.max(0,Number($('frameSeek').value)-1);showFrame();};$('nextFrame').onclick=()=>{$('frameSeek').value=Math.min(Number($('frameSeek').max),Number($('frameSeek').value)+1);showFrame();};

function reviewText(){const labels={pending:'待审核',revise:'需要调整',approved:'通过'};return ['霹雳一闪·六连｜像素演出审核','内容版本：'+revision,'内容指纹：'+(storageKey?.split(':').at(-1)||'未加载'),'素材检查：'+($('clipSelect').value||'未选择')+' 第'+(Number($('frameSeek').value)+1)+'帧','结论：'+labels[$('verdict').value],'整体备注：'+($('overallNote').value||'未填写'),...(director?.timeline.phases||[]).map(p=>p.label+'：'+(review.phases[p.id]||'未填写')),'方向：'+$('direction').selectedOptions[0].textContent,'说明：像素/无鞘改编；省略对手反应镜头；六段轨迹不是六次伤害；尚未接入实战判定。'].join('\n');}
$('copy').onclick=async()=>{save();const text=reviewText();try{await navigator.clipboard.writeText(text);$('saveStatus').textContent='审核意见已复制';}catch(_){$('copyFallback').hidden=false;$('copyFallback').value=text;$('copyFallback').select();$('saveStatus').textContent='请从下方文本框手动复制';}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>pause());window.addEventListener('pagehide',()=>sound.cancel());
function loop(t){const delta=lastRAF===null?0:t-lastRAF;lastRAF=t;if(director&&assets?.ready){const wasRunning=director.inspect().running;const {state,events}=director.advance(delta);for(const event of events)sound.emit(event);if(wasRunning&&state.ended)sound.cancel();update();}requestAnimationFrame(loop);}
// Read-only-friendly inspection and deterministic seek hooks for browser review.
window.SixfoldPreview={inspect:()=>director?.inspect()||null,seek:ms=>seek(ms),pause,play:()=>{if(!assets?.ready)return;director.play();lastRAF=null;update();},assets:()=>assets?{ready:assets.ready,errors:assets.errors,revision}:null,showFrame:(clip,index=0)=>{if(!assets?.ready)return;$('clipSelect').value=clip;chooseClip();$('frameSeek').value=index;showFrame();},timeline:()=>director?.timeline||null};
load();requestAnimationFrame(loop);
