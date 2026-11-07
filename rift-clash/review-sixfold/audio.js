(function(root){
'use strict';
class Audio{
 constructor(){this.context=null;this.enabled=false;this.nodes=new Set();}
 setEnabled(value){this.enabled=!!value;if(!this.enabled){this.cancel();return false;}try{const C=root.AudioContext||root.webkitAudioContext;if(!C){this.enabled=false;return false;}if(!this.context)this.context=new C();this.context.resume?.().catch?.(()=>{});return true;}catch(_){this.enabled=false;return false;}}
 cancel(){for(const n of this.nodes){try{n.stop();}catch(_){}try{n.disconnect();}catch(_){}}this.nodes.clear();}
 tone(from,to,duration,volume,type='triangle'){
  if(!this.enabled||!this.context)return;const c=this.context,t=c.currentTime,o=c.createOscillator(),gain=c.createGain();
  o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+duration);gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(gain);gain.connect(c.destination);this.nodes.add(o);this.nodes.add(gain);o.onended=()=>{o.disconnect();gain.disconnect();this.nodes.delete(o);this.nodes.delete(gain);};o.start(t);o.stop(t+duration);
 }
 emit(event){
  if(!this.enabled)return;
  if(event.type==='phase'&&event.phase==='charge'){this.tone(48,105,.65,.14);this.tone(115,180,.48,.055,'sine');}
  else if(event.type==='path'){this.tone(820+event.index*40,160,.10,.10);this.tone(100,38,.13,.11,'sine');}
  else if(event.type==='finisher'){this.tone(110,29,.70,.20,'sawtooth');this.tone(240,47,.45,.08);}
 }
}
root.SixfoldAudio=Audio;if(typeof module!=='undefined')module.exports=Audio;
})(typeof window!=='undefined'?window:globalThis);
