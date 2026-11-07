(function(root){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function compile(data){
 if(!data||!Array.isArray(data.phases)||!data.phases.length)throw new Error('时间轴缺少阶段');
 let cursor=0;const ids=new Set();
 const phases=data.phases.map(p=>{if(ids.has(p.id)||!p.id||!(p.durationMs>0)||!Number.isFinite(p.durationMs)||!(p.sourceEnd>=p.sourceStart))throw new Error('阶段参数无效');ids.add(p.id);const result={...p,startMs:cursor,endMs:cursor+p.durationMs};cursor=result.endMs;return Object.freeze(result);});
 const six=phases.find(p=>p.id==='sixfold');
 const legs=(data.legs||[]).map((l,i)=>{
  if(!six||!Array.isArray(l.from)||!Array.isArray(l.to)||l.from.length!==2||l.to.length!==2||![...l.from,...l.to,l.sourceStart,l.sourceEnd].every(Number.isFinite)||l.sourceEnd<=l.sourceStart||l.sourceStart<six.sourceStart||l.sourceEnd>six.sourceEnd)throw new Error('轨迹参数无效');
  const scale=six.durationMs/((six.sourceEnd-six.sourceStart)*1000);
  return Object.freeze({...l,index:i,from:Object.freeze([...l.from]),to:Object.freeze([...l.to]),startMs:six.startMs+(l.sourceStart-six.sourceStart)*1000*scale,endMs:six.startMs+(l.sourceEnd-six.sourceStart)*1000*scale});
 });
 for(let i=1;i<legs.length;i++)if(legs[i].startMs<legs[i-1].endMs-.001)throw new Error('轨迹阶段不可重叠');
 const cues=[...phases.map(p=>({type:'phase',phase:p.id,atMs:p.startMs})),...legs.map(l=>({type:'path',index:l.index,atMs:l.startMs,sourceStart:l.sourceStart,sourceEnd:l.sourceEnd}))];const impact=phases.find(p=>p.id==='impact');if(impact)cues.push({type:'finisher',atMs:impact.startMs+Math.min(284.89,impact.durationMs)});cues.sort((a,b)=>a.atMs-b.atMs);
 return Object.freeze({title:data.title,notes:data.notes||[],phases:Object.freeze(phases),legs:Object.freeze(legs),cues:Object.freeze(cues.map(Object.freeze)),flashes:(data.auxiliaryFlashes||[]).map(f=>Object.freeze({...f})),totalMs:cursor});
}
function inspect(timeline,elapsedMs,{direction=1,reducedMotion=false}={}){
 const ms=clamp(Number.isFinite(elapsedMs)?elapsedMs:0,0,timeline.totalMs),p=timeline.phases.find(p=>ms<p.endMs)||timeline.phases.at(-1);
 const localMs=clamp(ms-p.startMs,0,p.durationMs),progress=localMs/p.durationMs,sign=direction<0?-1:1;
 const point=([x,y])=>[sign<0?960-x:x,y];
 const paths=timeline.legs.filter(l=>ms>=l.startMs).map(l=>{
  const q=clamp((ms-l.startMs)/(l.endMs-l.startMs),0,1),from=point(l.from),to=point(l.to);
  return {index:l.index,from,to,progress:q,active:ms<l.endMs,complete:ms>=l.endMs,ageMs:Math.max(0,ms-l.endMs),position:[from[0]+(to[0]-from[0])*q,from[1]+(to[1]-from[1])*q],sourceStart:l.sourceStart,sourceEnd:l.sourceEnd};
 });
 const sourceTime=p.sourceStart+(p.sourceEnd-p.sourceStart)*progress,flash=timeline.flashes.find(f=>sourceTime>=f.sourceStart&&sourceTime<f.sourceEnd);
 return {elapsedMs:ms,totalMs:timeline.totalMs,ended:ms>=timeline.totalMs,phase:p.id,label:p.label,scene:p.scene,pose:p.pose,localMs,progress,sourceTime,view:p.view?{...p.view,center:p.view.center?[...p.view.center]:undefined}:null,flash:flash?{...flash}:null,sourceStart:p.sourceStart,sourceEnd:p.sourceEnd,adaptation:p.adaptation||'',direction:sign,reducedMotion:!!reducedMotion,paths:p.id==='sixfold'?paths:[],legIndex:p.id==='sixfold'?(paths.at(-1)?.index??-1):-1};
}
function create(data){
 const timeline=compile(data);let elapsedMs=0,running=false,speed=1,direction=1,reducedMotion=false;
 const view=()=>({...inspect(timeline,elapsedMs,{direction,reducedMotion}),running,speed});
 return {timeline,inspect:view,
  play(){if(elapsedMs>=timeline.totalMs)elapsedMs=0;running=true;return view();},
  pause(){running=false;return view();},
  restart(){elapsedMs=0;running=true;return view();},
  seek(ms){elapsedMs=clamp(Number.isFinite(ms)?ms:0,0,timeline.totalMs);if(elapsedMs>=timeline.totalMs)running=false;return view();},
  setSpeed(value){if(Number.isFinite(value))speed=clamp(value,.25,2);return view();},
  setDirection(value){direction=value<0?-1:1;return view();},
  setReducedMotion(value){reducedMotion=!!value;return view();},
  advance(deltaMs){
   if(!running||!(deltaMs>0)||!Number.isFinite(deltaMs))return {state:view(),events:[]};
   const before=elapsedMs;elapsedMs=Math.min(timeline.totalMs,elapsedMs+deltaMs*speed);
   const events=timeline.cues.filter(c=>c.atMs>before&&c.atMs<=elapsedMs||c.atMs===before&&before===0).map(c=>({...c,direction}));
   if(elapsedMs>=timeline.totalMs)running=false;
   return {state:view(),events};
  }
 };
}
root.SixfoldDirector={compile,inspect,create};if(typeof module!=='undefined')module.exports=root.SixfoldDirector;
})(typeof window!=='undefined'?window:globalThis);
