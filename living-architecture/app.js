import * as THREE from 'three';
import {OrbitControls} from './assets/OrbitControls.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const container=$('#scene');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){$('#loading').textContent='無法啟用 3D。請開啟瀏覽器的硬體加速，或使用支援 WebGL 的瀏覽器。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;container.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xf2f2ec,200,480);
const camera=new THREE.PerspectiveCamera(33,1,.1,1000), controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=13;controls.maxDistance=300;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=true;controls.autoRotateSpeed=.55;
const hemi=new THREE.HemisphereLight(0xf0ffef,0x788c76,2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff5d8,3.6);sun.position.set(-65,130,70);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-75,right:75,top:125,bottom:-70,near:1,far:350});sun.shadow.bias=-.0004;scene.add(sun);
const rim=new THREE.DirectionalLight(0xb7e3e1,2);rim.position.set(60,70,-50);scene.add(rim);
const tower=new THREE.Group(),city=new THREE.Group(),lab=new THREE.Group();scene.add(tower,city,lab);lab.visible=false;
const teal=new THREE.MeshPhysicalMaterial({color:0x3b7771,metalness:.45,roughness:.3,clearcoat:.7,clearcoatRoughness:.24});
const trim=new THREE.MeshStandardMaterial({color:0x7f9d8d,metalness:.6,roughness:.38});
const baseMat=new THREE.MeshStandardMaterial({color:0x617e70,metalness:.25,roughness:.6});
const gold=new THREE.MeshStandardMaterial({color:0xcc9b36,metalness:.8,roughness:.26});
const dark=new THREE.MeshStandardMaterial({color:0x375249,metalness:.5,roughness:.45});
const glassMaterials=[],segments=[],pickables=[],lineGroups=[];let mode='overview',selected='bamboo',exploded=false,xray=false,night=false,wind=0,kick=0,t=0,paused=false,tween=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function mesh(geo,mat,parent,pos,feature){const m=new THREE.Mesh(geo,mat);if(pos)m.position.set(...pos);parent.add(m);m.castShadow=true;m.receiveShadow=true;if(feature){m.userData.feature=feature;pickables.push(m);}return m;}
function box(w,h,d,parent,pos,mat=trim,feature){return mesh(new THREE.BoxGeometry(w,h,d),mat,parent,pos,feature);}
function beam(a,b,r,parent,mat=trim){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),mat,parent,av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
function outline(w1,w2,h,parent,feature,rows=8){const v=[];const add=(a,b)=>v.push(...a,...b);for(let j=0;j<=rows;j++){const y=j/rows*h,w=w1+(w2-w1)*j/rows;add([-w,y,-w],[w,y,-w]);add([w,y,-w],[w,y,w]);add([w,y,w],[-w,y,w]);add([-w,y,w],[-w,y,-w]);}for(let j=0;j<=12;j++){const f=j/6-1;add([f*w1,0,-w1],[f*w2,h,-w2]);add([f*w1,0,w1],[f*w2,h,w2]);add([-w1,0,f*w1],[-w2,h,f*w2]);add([w1,0,f*w1],[w2,h,f*w2]);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x9fb7a3,transparent:true,opacity:.65}));parent.add(l);lineGroups.push(l);return l;}
function frustum(w1,w2,h,parent,y,feature,mat=teal,rows=8){const sub=new THREE.Group();sub.position.y=y;parent.add(sub);const g=new THREE.CylinderGeometry(w2*Math.SQRT2,w1*Math.SQRT2,h,4,1,false);g.rotateY(Math.PI/4);const material=mat.clone();glassMaterials.push(material);mesh(g,material,sub,[0,h/2,0],feature);outline(w1,w2,h,sub,feature,rows);return sub;}
// Metres are scaled uniformly to a 101.6-unit tower. Facades flare 7° from vertical.
box(25,1,24,tower,[0,.5,0],baseMat,'bamboo');
const podium=frustum(10.4,9,5,tower,1,'glass',baseMat,4);
box(31,5,15,tower,[4,2.5,-9],baseMat,'glass');box(29,1,14,tower,[4,5.5,-9],trim,'glass');
frustum(8.8,5.3,16,tower,6,'glass',teal,18);
for(let f=0;f<4;f++){const a=f*Math.PI/2;const coin=mesh(new THREE.TorusGeometry(1.32,.26,8,32),trim,tower,[Math.sin(a)*5.65,20.8,Math.cos(a)*5.65],'bamboo');coin.rotation.y=a;const hole=box(.8,.8,.13,tower,[Math.sin(a)*5.7,20.8,Math.cos(a)*5.7],dark,'bamboo');hole.rotation.y=a;}
const sh=7.75, flare=Math.tan(7*Math.PI/180)*sh;
for(let i=0;i<8;i++){const bottom=4.65,top=bottom+flare;const seg=frustum(bottom,top,sh,tower,22+i*sh,'bamboo');seg.userData.baseY=seg.position.y;segments.push(seg);box(top*2+.25,.38,top*2+.25,seg,[0,sh-.05,0],trim,'bamboo');for(const x of [-1,1])for(const z of [-1,1]){beam([x*bottom,0,z*bottom],[x*top,sh,z*top],.13,seg,trim);const ornament=box(.45,1.7,.45,seg,[x*(top+.15),sh-.3,z*(top+.15)],trim,'bamboo');ornament.rotation.x=z*.16;ornament.rotation.z=-x*.16;}for(const rot of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const ornament=mesh(new THREE.TorusGeometry(.44,.105,6,12,Math.PI*1.7),trim,seg,[Math.sin(rot)*(top+.13),sh-.9,Math.cos(rot)*(top+.13)],'bamboo');ornament.rotation.y=rot;}}
const crown=new THREE.Group();crown.position.y=84;tower.add(crown);
frustum(4.7,4.05,3,crown,0,'crown',teal,4);frustum(3.45,4.05,2.7,crown,3,'crown',teal,4);frustum(2.1,2.8,5,crown,5.7,'crown',teal,8);
for(let j=0;j<6;j++)box(5.6-j*.3,.2,5.6-j*.3,crown,[0,6+j*.77,0],trim,'crown');
frustum(1.7,1.3,1.4,crown,10.7,'crown',trim,2);mesh(new THREE.CylinderGeometry(.26,.48,5.5,10),trim,crown,[0,14.85,0],'crown');mesh(new THREE.CylinderGeometry(.09,.17,1.1,8),trim,crown,[0,18.15,0],'crown');
// The central core becomes visible through the curtain wall.
const core=new THREE.Group();tower.add(core);box(3.1,81,3.1,core,[0,43,0],new THREE.MeshStandardMaterial({color:0xb5b7a0,roughness:.85}));
for(let y=8;y<84;y+=2)box(8.7,.08,8.7,core,[0,y,0],new THREE.MeshStandardMaterial({color:0x9cae98,transparent:true,opacity:.6}));core.visible=false;
const miniature=new THREE.Group();miniature.position.y=81.3;tower.add(miniature);mesh(new THREE.SphereGeometry(.58,24,16),gold,miniature,[0,0,0],'damper');for(const s of [-1,1])beam([s*.7,2,0],[s*.3,.3,0],.035,miniature);miniature.visible=false;
const platformMat=new THREE.MeshStandardMaterial({color:0xe1e5d8,roughness:.95});mesh(new THREE.CylinderGeometry(24,25,.4,96),platformMat,city,[0,-.25,0]);
const ground=mesh(new THREE.PlaneGeometry(1600,1600),new THREE.ShadowMaterial({color:0x52694c,opacity:.13}),scene,[0,-.5,0]);ground.rotation.x=-Math.PI/2;
for(let r of [31,47,65]){const points=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*r,-.2,Math.sin(a)*r));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xb7c4ab,transparent:true,opacity:.45}));city.add(line);}
let seed=12;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
for(let i=0;i<46;i++){const angle=rand()*Math.PI*2,r=34+rand()*38,x=Math.sin(angle)*r,z=Math.cos(angle)*r;const h=1+rand()*6;box(3+rand()*4,h,3+rand()*5,city,[x,h/2-.4,z],new THREE.MeshStandardMaterial({color:0xd6dfcf,transparent:true,opacity:.48,roughness:1}));}
for(let i=0;i<24;i++){const a=i/24*Math.PI*2;mesh(new THREE.SphereGeometry(.65,8,8),new THREE.MeshStandardMaterial({color:0x7c936f,roughness:1}),city,[Math.cos(a)*21,.6,Math.sin(a)*21]);}
// A separate enlarged damper assembly makes cables, steel layers and supports inspectable.
const rig=new THREE.Group();lab.add(rig);const pendulum=new THREE.Group();pendulum.position.y=16;rig.add(pendulum);
box(17,.6,13,rig,[0,16.3,0],dark);for(const x of [-8,8])for(const z of [-6,6])box(.5,16,.5,rig,[x,8,z],trim);
mesh(new THREE.CylinderGeometry(11,11,.4,64),baseMat,lab,[0,-.1,0]);const ring=mesh(new THREE.TorusGeometry(7,.12,8,80),trim,rig,[0,2,0]);ring.rotation.x=Math.PI/2;
mesh(new THREE.SphereGeometry(3.5,64,40),gold,pendulum,[0,-9,0],'damper');
for(let i=1;i<24;i++){const yy=-3.5+i*7/24,rr=Math.sqrt(3.5*3.5-yy*yy);const ring=mesh(new THREE.TorusGeometry(rr,.025,4,64),new THREE.MeshStandardMaterial({color:0x806121,metalness:.8,roughness:.4}),pendulum,[0,-9+yy,0]);ring.rotation.x=Math.PI/2;}
for(const x of [-1,1])for(const z of [-1,1]){beam([x*2.4,0,z*2.4],[x*1.6,-6.2,z*1.6],.065,pendulum,trim);beam([x*2.65,0,z*2.65],[x*1.85,-6.2,z*1.85],.05,pendulum,trim);}
const absorbers=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const b=beam([Math.cos(a)*6,2,Math.sin(a)*6],[Math.cos(a)*2.7,5,Math.sin(a)*2.7],.14,rig,dark);absorbers.push({mesh:b,a});}
const features={
 bamboo:{label:'FORM / 建築形式',title:'如竹，節節高升。',copy:'八個上寬下窄的倒梯形單元依序堆疊，每節包含八層樓。竹節與寶塔的意象，將成長的祝福寫進城市天際線。',action:'分解八個竹節 ↗'},
 slope:{label:'GEOMETRY / 立面幾何',title:'垂直之外的 7°。',copy:'每節塔身由下而上向外展開，形成倒梯形輪廓。模型以相對鉛直線 7° 的斜度呈現，從側面觀察，能看見一節節收放的節奏。',action:'近看傾斜立面 ↗'},
 glass:{label:'MATERIAL / 建築表皮',title:'把天空，映在立面。',copy:'青綠色玻璃帷幕與細密的金屬框架構成外表皮。切換透視模式，看看帷幕之後的樓板、中央核心與高處的阻尼球。',action:'切換帷幕透視 ↗'},
 crown:{label:'CULTURE / 塔冠意象',title:'方鼎之形，雲端之上。',copy:'方形塔冠、層疊退縮與纖細尖塔，將天際線向上延伸。以古代方鼎的意象閱讀頂部，感受傳統器物輪廓與現代建築的對話。',action:'回到建築全貌 ↗'},
 damper:{label:'ENGINEERING / 調諧質量阻尼器',title:'以擺動，回應風。',copy:'直徑約 5.5 公尺、重達 660 公噸的金色鋼球，位於 87–92 樓間。鋼纜懸吊的質量塊與阻尼裝置共同減緩大樓受風時的搖擺。'}
};
function cameraTo(pos,target){tween={from:camera.position.clone(),to:new THREE.Vector3(...pos),a:controls.target.clone(),b:new THREE.Vector3(...target),p:0};if(reduced){camera.position.copy(tween.to);controls.target.copy(tween.b);tween=null;}}
function overview(){const mobile=innerWidth<761;cameraTo(mobile?[115,80,142]:[125,75,175],mobile?[-8,48,0]:[0,48,0]);}
function selectFeature(key){selected=key;const d=features[key];$$('.feature').forEach(b=>b.classList.toggle('active',b.dataset.feature===key));$('#chapter').textContent=`0${Object.keys(features).indexOf(key)+1} / 05`;$('#detail-label').textContent=d.label;$('#detail-title').textContent=d.title;$('#detail-copy').textContent=d.copy;$('#detail-action').innerHTML='';
if(key==='damper'){$('#detail-action').innerHTML='<label for="wind">風力強度 <output id="wind-value">'+wind+'%</output></label><input id="wind" type="range" min="0" max="100" value="'+wind+'"><div class="readout"><span>無風</span><span>強風</span></div><button id="push-ball">輕推阻尼球 ↗</button> <button id="pause-sim">'+(paused?'繼續動畫':'暫停動畫')+'</button><p class="note">擺幅與設備比例經放大，僅作原理示意。</p>';$('#wind').oninput=e=>{wind=+e.target.value;$('#wind-value').textContent=wind+'%';};$('#push-ball').onclick=()=>{kick=1;paused=false;$('#pause-sim').textContent='暫停動畫';};$('#pause-sim').onclick=e=>{paused=!paused;e.target.textContent=paused?'繼續動畫':'暫停動畫';};setMode('damper');}
else{setMode('overview');const b=document.createElement('button');b.textContent=d.action;$('#detail-action').appendChild(b);b.onclick=()=>{if(key==='bamboo')toggleExplode();if(key==='glass')toggleXray();if(key==='slope')cameraTo([24,63,34],[0,60,0]);if(key==='crown')overview();};if(key==='crown')cameraTo([25,99,36],[0,91,0]);else if(key==='slope')cameraTo([30,66,47],[0,60,0]);else overview();}
}
function labView(){cameraTo(innerWidth<761?[48,31,65]:[29,20,39],[0,8,0]);}
function setMode(next){const changed=mode!==next;mode=next;document.body.classList.toggle('lab-mode',next==='damper');tower.visible=next==='overview';city.visible=next==='overview';lab.visible=next==='damper';$('#hotspot').hidden=next==='damper';$('.scale').style.display=next==='damper'?'none':'';$('#view-label').textContent=next==='damper'?'阻尼球・放大近景':'建築全貌';$$('.nav[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===next));['#explode','#xray'].forEach(s=>{$(s).disabled=next==='damper';$(s).style.opacity=next==='damper'?'.35':'1';});if(changed){controls.autoRotate=false;$('#rotate').setAttribute('aria-pressed','false');if(next==='damper')labView();else overview();}}
function toggleExplode(){exploded=!exploded;$('#explode').setAttribute('aria-pressed',exploded);if(exploded)cameraTo([150,85,200],[0,60,0]);else overview();}
function toggleXray(){xray=!xray;$('#xray').setAttribute('aria-pressed',xray);glassMaterials.forEach(m=>{m.transparent=xray;m.opacity=xray?.16:1;m.depthWrite=!xray;m.needsUpdate=true;});core.visible=xray;miniature.visible=xray;}
function setNight(value){night=value;document.body.classList.toggle('night',night);$('#day').classList.toggle('selected',!night);$('#night').classList.toggle('selected',night);$('#day').setAttribute('aria-pressed',!night);$('#night').setAttribute('aria-pressed',night);hemi.intensity=night?.55:2.1;sun.intensity=night?1:3.6;rim.intensity=night?3:2;scene.fog.color.set(night?0x102a2b:0xf2f2ec);lineGroups.forEach(l=>{l.material.color.set(night?0xd5cd87:0x9fb7a3);l.material.opacity=night?.75:.65;});glassMaterials.forEach(m=>{m.emissive.set(night?0x113b36:0x000000);m.emissiveIntensity=.4;});}
$$('[data-feature]').forEach(b=>b.onclick=()=>selectFeature(b.dataset.feature));$$('[data-mode]').forEach(b=>b.onclick=()=>selectFeature(b.dataset.mode==='damper'?'damper':'bamboo'));$('#hotspot').onclick=()=>selectFeature('damper');$('#tour').onclick=()=>{selectFeature('bamboo');if(!exploded)toggleExplode();if(innerWidth<761)$('.inspector').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});};$('#rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('#rotate').setAttribute('aria-pressed',controls.autoRotate);};$('#explode').onclick=toggleExplode;$('#xray').onclick=toggleXray;
function reset(){exploded=false;$('#explode').setAttribute('aria-pressed','false');if(xray)toggleXray();wind=0;kick=0;paused=false;controls.autoRotate=false;$('#rotate').setAttribute('aria-pressed','false');selectFeature('bamboo');overview();}
$('#reset').onclick=reset;$('.brand').onclick=e=>{e.preventDefault();reset();};$('#zoom-in').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(.8).add(controls.target);tween=null;};$('#zoom-out').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(1.25).add(controls.target);tween=null;};$('#day').onclick=()=>setNight(false);$('#night').onclick=()=>setNight(true);
const dialog=$('#about');$('#about-btn').onclick=$('#sources-btn').onclick=()=>dialog.showModal();$('.close').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();let down=null;renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];tween=null;});
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables).filter(h=>{let p=h.object;while(p){if(!p.visible)return false;p=p.parent;}return true;});if(hits.length){const key=hits[0].object.userData.feature;if(mode==='damper'){kick=1;paused=false;const pb=$('#pause-sim');if(pb)pb.textContent='暫停動畫';}else{selectFeature(key);if(key==='bamboo'){hits[0].object.material.emissive.set(0x46692d);setTimeout(()=>hits[0].object.material.emissive.set(night?0x113b36:0),700);}}}});
let wasMobile=innerWidth<761;
function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const isMobile=innerWidth<761;if(isMobile!==wasMobile){wasMobile=isMobile;if(mode==='damper')labView();else overview();}}new ResizeObserver(resize).observe(container);
resize();overview();if(tween){camera.position.copy(tween.to);controls.target.copy(tween.b);tween=null;}selectFeature('bamboo');$('#loading').remove();
const clock=new THREE.Clock(), projected=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(!paused)t+=dt;if(tween){tween.p=Math.min(1,tween.p+dt*1.5);const f=1-Math.pow(1-tween.p,3);camera.position.lerpVectors(tween.from,tween.to,f);controls.target.lerpVectors(tween.a,tween.b,f);if(tween.p===1)tween=null;}controls.update();segments.forEach((s,i)=>{const y=s.userData.baseY+(exploded?i*2.6:0);s.position.y=THREE.MathUtils.lerp(s.position.y,y,reduced?1:.1);});crown.position.y=THREE.MathUtils.lerp(crown.position.y,84+(exploded?20.8:0),reduced?1:.1);
if(!paused){kick*=Math.exp(-dt*.32);const amp=wind/100*.075;rig.rotation.z=Math.sin(t*1.5)*amp*.22;pendulum.rotation.z=-Math.sin(t*1.5-.45)*amp*2+Math.sin(t*2.15)*kick*.2;}
if(mode==='overview'){projected.set(5,81+(exploded?18.2:0),5).applyMatrix4(tower.matrixWorld).project(camera);$('#hotspot').style.left=((projected.x*.5+.5)*container.clientWidth+9)+'px';$('#hotspot').style.top=((-projected.y*.5+.5)*container.clientHeight-10)+'px';$('#hotspot').style.display=projected.z<1?'flex':'none';}else $('#hotspot').style.display='none';renderer.render(scene,camera);}
animate();
// Compact diagnostics for repeatable interaction checks without exposing implementation in the UI.
window.__taipei={get state(){return{mode,selected,exploded,xray,night,wind,paused,segments:segments.length,webgl:!!renderer};}};
