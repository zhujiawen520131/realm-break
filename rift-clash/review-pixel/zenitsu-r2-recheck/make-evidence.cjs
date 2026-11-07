const fs=require('fs'),path=require('path');
const {createCanvas,loadImage,GlobalFonts}=require('/workspace/work/render-check/node_modules/@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','Noto CJK');
const out=__dirname,art=path.resolve(out,'../zenitsu-r2'),refs=path.resolve(out,'../../references');
function board(w,h){let c=createCanvas(w,h),x=c.getContext('2d');x.fillStyle='#182127';x.fillRect(0,0,w,h);x.font='24px "Noto CJK"';x.fillStyle='#f5f5ed';return [c,x];}
function txt(x,s,a,b,size=24,col='#f5f5ed'){x.font=`${size}px "Noto CJK"`;x.fillStyle=col;x.fillText(s,a,b);}
function line(x,a,b,col='#ffb84a'){x.strokeStyle=col;x.lineWidth=4;x.beginPath();x.moveTo(...a);x.lineTo(...b);x.stroke();for(const p of [a,b]){x.beginPath();x.arc(...p,7,0,Math.PI*2);x.stroke();}}
function ring(x,a,b){x.strokeStyle='#ff6d6d';x.lineWidth=4;x.beginPath();x.arc(a,b,21,0,Math.PI*2);x.stroke();}
(async()=>{
const frames=await Promise.all(Array.from({length:8},(_,i)=>loadImage(path.join(art,'frames',String(i+1).padStart(2,'0')+'.png'))));
let [c,x]=board(1550,735);txt(x,'善逸 R2：刀鞘方向与长度不连续（红圈＝金色鞘底）',24,43,30);txt(x,'同一角色持续面向右；第 3 → 4 帧没有交代刀鞘翻转动作。以下为正式发布帧，未改绘。',24,83,21);
for(let j=0;j<3;j++){let n=[2,3,6][j],ox=16+j*510,oy=143;x.fillStyle='#777';x.fillRect(ox,oy,496,444);x.drawImage(frames[n],ox,oy);txt(x,'第 '+(n+1)+' 帧',ox+8,125,25);let cap=[[418,262],[132,294],[414,268]][j];ring(x,ox+cap[0],oy+cap[1]);let ends=[[[292,257],[418,262]],[[345,276],[132,294]],[[315,255],[414,268]]][j];line(x,ends[0].map((v,k)=>v+[ox,oy][k]),ends[1].map((v,k)=>v+[ox,oy][k]));}
txt(x,'鞘底朝右；部分拔刀',30,627,24);txt(x,'鞘底忽然朝左；鞘身变长',540,627,24);txt(x,'鞘底又朝右；可见鞘身缩短',1050,627,24);
txt(x,'尺线只表示图上可见投影，不是三维实物测量。第 7 帧可能有部分遮挡，但未画清藏鞘关系，不能据此判定物理长度正确。',24,681,20);
fs.writeFileSync(path.join(out,'01-sheath-continuity.png'),c.toBuffer('image/png'));
[c,x]=board(1100,720);txt(x,'第 7 → 8 帧：刀仍在外，下一帧直接完整入鞘',24,44,30);
for(let j=0;j<2;j++){const ox=24+j*550,oy=116;x.fillStyle='#777';x.fillRect(ox,oy,496,444);x.drawImage(frames[6+j],ox,oy);txt(x,'第 '+(7+j)+' 帧 · '+[110,160][j]+' ms',ox,91,24);}
line(x,[24+177,116+287],[24+36,116+392]);txt(x,'刀尖远离鞘口，尚未对齐',35,607,24);txt(x,'刀身消失，未提供对齐与纳刀过渡',575,607,24);txt(x,'返修：补齐对准鞘口的动作；若只保留 8 帧，末帧应保持出刀收势，避免硬切回鞘。',24,668,21);
fs.writeFileSync(path.join(out,'02-sheathing-jump.png'),c.toBuffer('image/png'));
const design=await loadImage(path.join(art,'design.png')),anime=await loadImage(path.join(refs,'zenitsu-anime-risshihen-official.jpg')),sega=await loadImage(path.join(refs,'zenitsu-sega-hinokami-official.png'));
[c,x]=board(1370,840);txt(x,'角色身份对照：当前稿与已核看的官方静态参考',24,43,30);txt(x,'静态参考不能证明原作 8 帧动作或时长；这里只核对眼色、发型和服饰识别点。',24,84,21);
x.fillStyle='#777';x.fillRect(24,142,420,460);x.drawImage(design,370,140,390,400,24,142,420,431);x.drawImage(anime,180,0,660,478,468,142,460,333);x.drawImage(sega,88,47,422,474,947,142,399,449);
txt(x,'R2 当前设定',24,123,24);txt(x,'官方动画静态图',468,123,24);txt(x,'SEGA 官方角色图',947,123,24);
txt(x,'当前稿：偏蓝紫色眼睛，尖刺式额发',24,646,24);txt(x,'动画参考：金棕色虹膜，较平齐分束刘海',24,691,24);txt(x,'当前动作的白色缠腿也弱化了官方图中的黄色三角纹腿套。此项应单独校色与校形。',24,744,21);
fs.writeFileSync(path.join(out,'03-identity-reference.png'),c.toBuffer('image/png'));
[c,x]=board(2048,1120);txt(x,'善逸 R2：完整 8 帧顺序对照（按发布时长）',24,44,30);const ms=[120,110,130,70,90,100,110,160];for(let i=0;i<8;i++){let ox=16+(i%4)*508,oy=112+Math.floor(i/4)*500;x.fillStyle='#777';x.fillRect(ox,oy,496,444);x.drawImage(frames[i],ox,oy);txt(x,`${i+1} / ${ms[i]} ms`,ox+12,oy-16,22);}fs.writeFileSync(path.join(out,'04-all-frames.png'),c.toBuffer('image/png'));
console.log('Wrote four annotated evidence boards');
})();
