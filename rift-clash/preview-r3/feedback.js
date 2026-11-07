(function(root){'use strict';
class Feedback{
 constructor(){this.audio=null;this.enabled=false;this.noise=null;this.reset();}
 reset(){this.effects=[];this.kick=0;this.kickDir=1;this.kickX=600;this.heavy=0;this.healthBars=new WeakMap();this.frame=0;}
 sound(enabled){this.enabled=enabled;if(!enabled)return;try{const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;if(!this.audio){this.audio=new Audio();this.master=this.audio.createGain();this.master.gain.value=.32;const compressor=this.audio.createDynamicsCompressor();compressor.threshold.value=-14;compressor.ratio.value=6;this.master.connect(compressor);compressor.connect(this.audio.destination);this.noise=this.audio.createBuffer(1,this.audio.sampleRate*.25,this.audio.sampleRate);const d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(this.audio.state==='suspended')this.audio.resume().catch(()=>{});}catch(e){this.enabled=false;}}
 osc(freq,end,duration,gain,kind='sine',delay=0){if(!this.enabled||!this.audio)return;const a=this.audio,t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=kind;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(gain,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
 hiss(duration,gain,freq,filter='bandpass'){if(!this.enabled||!this.audio)return;const a=this.audio,t=a.currentTime,src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=this.noise;f.type=filter;f.frequency.value=freq;f.Q.value=.7;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);src.connect(f);f.connect(g);g.connect(this.master);src.start(t);src.stop(t+duration);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};}
 play(e){const heavy=e.heavy,weapon=e.weapon||'buster';if(e.type==='hit'){this.osc(heavy?95:155,35,heavy?.21:.12,heavy?.6:.4);this.hiss(.08,heavy?.75:.45,weapon==='staff'?700:weapon==='thunder-katana'?2100:1600);if(['buster','water-katana','thunder-katana','bow'].includes(weapon))this.osc(weapon==='thunder-katana'?510:1250,weapon==='thunder-katana'?130:340,.12,.16,'triangle');if(e.counter)this.osc(1600,650,.1,.13,'sine',.02);}
 else if(e.type==='breath'){if(e.hero==='zenitsu'){this.hiss(.13,e.heavy?.5:.25,2600,'highpass');this.osc(180,45,.16,.2);}else{this.hiss(.22,.3,800,'lowpass');this.osc(400,180,.18,.08,'sine');}}
 else if(e.type==='block'){this.osc(1100,720,.11,.19,'triangle');this.hiss(.055,.33,2800);}
 else if(e.type==='shot'){this.hiss(.075,.46,1900,'highpass');this.osc(135,45,.09,.26);}
 else if(e.type==='swing'){this.hiss(.1,.23,weapon==='staff'?650:1900);if(weapon==='thunder-katana')this.osc(380,100,.14,.12,'triangle');}
 else if(e.type==='ultimate'){this.osc(70,210,.28,.24,'sawtooth');this.osc(160,330,.25,.11,'triangle');}
 else if(e.type==='land'){this.hiss(.1,e.heavy?.2:.1,300,'lowpass');}
 else if(e.type==='dash'||e.type==='sub'){this.hiss(.14,.26,1100);this.osc(460,140,.12,.08,'triangle');}
 else if(e.type==='jump')this.osc(170,320,.1,.09,'triangle');
 else if(e.type==='end'){this.osc(130,80,.35,.3);}
 }
 add(e){this.play(e);const base={age:0,max:20,...e};if(e.type==='hit'){this.effects.push({...base,kind:'impact',max:e.heavy?24:16});this.effects.push({...base,kind:'damage',max:46});this.kick=e.heavy?8:3.5;this.kickDir=e.dir||1;this.kickX=e.x;this.heavy=e.heavy?1:0;}
 else if(e.type==='block')this.effects.push({...base,kind:'guard',max:17});
 else if(['land','jump'].includes(e.type))this.effects.push({...base,kind:'dust',max:e.type==='land'?24:16});
 else if(e.type==='dash')this.effects.push({...base,kind:'speed',max:16});
 else if(e.type==='sub'){this.effects.push({...base,kind:'sub',max:23});this.effects.push({...base,kind:'blinkTrace',max:16});}
 else if(e.type==='shot')this.effects.push({...base,kind:'muzzle',max:5});
 else if(e.type==='ultimate')this.effects.push({...base,kind:'charge',max:22});
 if(this.effects.length>90)this.effects.splice(0,this.effects.length-90);
 }
 tick(world){this.frame++;for(const e of this.effects)e.age++;this.effects=this.effects.filter(e=>e.age<e.max);this.kick*=.76;this.heavy*=.8;for(const f of [world.p1,world.p2]){let bar=this.healthBars.get(f);if(!bar){bar={hp:f.hp,last:f.hp,hold:0};this.healthBars.set(f,bar);}if(f.hp<bar.last)bar.hold=18;if(f.hp>bar.hp)bar.hp=f.hp;if(bar.hold>0)bar.hold--;else bar.hp=Math.max(f.hp,bar.hp-.7);bar.last=f.hp;}}
 health(f){return this.healthBars.get(f)?.hp??f.hp;}
 camera(world){if(!world.settings.shake)return{x:0,y:0,zoom:1};return{x:-this.kickDir*this.kick*Math.cos(this.frame*2),y:this.kick*.28*Math.sin(this.frame*2.5),zoom:1+this.heavy*.012};}
 draw(ctx){const line=(a,c,w)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a[0]);for(const q of a.slice(1))ctx.lineTo(...q);ctx.stroke();};
 for(const e of this.effects){ctx.save();ctx.translate(e.x||0,e.y||0);const k=e.age/e.max,fade=Math.pow(1-k,1.5),col=e.color||'#d1e3d2';ctx.globalAlpha=fade;
 if(e.kind==='impact'){const radius=(e.heavy?57:32)*(1+k*.8);ctx.rotate((e.dir||1)>0?-.35:.35);ctx.globalCompositeOperation='lighter';for(let i=0;i<10;i++){const a=i*Math.PI/5+(e.frame||0)*.1,inner=radius*k*.7,len=radius*(i%2? .5:1);line([[Math.cos(a)*inner,Math.sin(a)*inner],[Math.cos(a)*len,Math.sin(a)*len]],i%2?col:'#fff3c8',i%2?2:4*(1-k)+1);}if(k<.35){ctx.fillStyle='#fff9dc';ctx.beginPath();ctx.ellipse(0,0,11*(1-k),16*(1-k),0,0,Math.PI*2);ctx.fill();}ctx.strokeStyle=col;ctx.lineWidth=2*(1-k);ctx.beginPath();ctx.ellipse(0,0,8+k*radius,12+k*radius*.5,0,0,Math.PI*2);ctx.stroke();}
 else if(e.kind==='guard'){ctx.strokeStyle='#bedaff';ctx.lineWidth=4*(1-k)+1;ctx.beginPath();ctx.ellipse(0,0,9+k*30,32+k*12,0,-1.4,1.4);ctx.stroke();for(let i=0;i<5;i++)line([[0,0],[22*Math.cos(i*1.1),31*Math.sin(i*1.1)]],'#dcefff',1);}
 else if(e.kind==='dust'){ctx.globalAlpha=fade*.3;ctx.fillStyle='#d1c6af';for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse((i-3)*(4+k*10),-3-Math.sin(i)*5-k*11,5+k*10,3+k*5,0,0,Math.PI*2);ctx.fill();}}
 else if(e.kind==='speed'){ctx.scale(e.dir||1,1);for(let i=0;i<4;i++)line([[-15-k*70,i*12-20],[-58-k*65,i*12-20]],col,2);}
 else if(e.kind==='blinkTrace'){const dx=(e.fromX??e.x)-e.x,dy=(e.fromY??e.y)-e.y;ctx.globalAlpha=fade*.45;for(let j=0;j<5;j++)line([[dx,dy+j*12-24],[0,j*12-24]],col,2);for(let j=0;j<6;j++){ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.ellipse(dx*(j/5),dy*(j/5),4+k*10,22*(1-k),0,0,Math.PI*2);ctx.stroke();}}
 else if(e.kind==='sub'){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,15+k*55,30+k*18,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[Math.cos(a)*k*60,Math.sin(a)*k*60],[Math.cos(a)*(k*60+8),Math.sin(a)*(k*60+8)]],col,3);}}
 else if(e.kind==='muzzle'){ctx.scale(e.dir||1,1);ctx.rotate(Number(e.angle)||0);ctx.save();ctx.globalAlpha*=.4;ctx.fillStyle='#ffd880';ctx.beginPath();ctx.ellipse(7,0,35,20,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.fillStyle='#fff0b1';ctx.beginPath();ctx.moveTo(-9,-4);ctx.lineTo(24,-11);ctx.lineTo(13,0);ctx.lineTo(25,9);ctx.lineTo(-8,5);ctx.fill();}
 else if(e.kind==='charge'){ctx.strokeStyle=col;ctx.lineWidth=3;for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(0,0,65*(1-k)+j*8,65*(1-k)+j*8,0,0,Math.PI*2);ctx.stroke();}}
 else if(e.kind==='damage'){ctx.globalAlpha=k<.6?1:fade*3;ctx.font=(e.heavy?'800 21px':'700 15px')+' "Noto Sans SC",system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#13232d';ctx.fillStyle=e.counter?'#ffdf89':'#effbe4';const txt=e.counter?'COUNTER '+e.damage:String(e.damage);ctx.strokeText(txt,(e.dir||1)*15,-35-k*34);ctx.fillText(txt,(e.dir||1)*15,-35-k*34);}
 ctx.restore();}
 }
 flash(ctx,enabled){if(!enabled)return;let alpha=0;for(const e of this.effects)if(e.kind==='impact'&&e.heavy&&e.age<4)alpha=Math.max(alpha,.1*(1-e.age/4));if(alpha){ctx.save();ctx.fillStyle='rgba(224,244,225,'+alpha+')';ctx.fillRect(0,0,1200,640);ctx.restore();}}
}
root.RiftFeedback={Feedback};
})(typeof window!=='undefined'?window:globalThis);
