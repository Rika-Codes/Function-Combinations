(()=>{
'use strict';
const $=id=>document.getElementById(id),N=40,DX=6/N;
const functions=[['sine','sin(x)',Math.sin],['line','x + 1',x=>x+1],['wave','2 + sin(x)',x=>2+Math.sin(x)],['cos','cos(x)',Math.cos],['square','x² / 2',x=>x*x/2],['x','x',x=>x],['half','0.5',()=>.5],['two','2',()=>2],['negative','−1',()=>-1],['zero','0',()=>0]];
const symbols={add:'+',subtract:'−',multiply:'×',divide:'÷',average:'average',min:'min',max:'max'};
let state={red:'sine',blue:'line',op:'add',index:0,custom:{}},customValues={},starts=new Map(),completed=new Set(),playing=false,raf=0,previous=0,nextAt=0,now=performance.now(),width=800,height=370;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=v=>Math.max(0,Math.min(1,v)),ease=t=>{t=clamp(t);return t*t*(3-2*t)},fmt=n=>!Number.isFinite(n)?'undefined':Math.abs(n)<.0005?'0':Number(n.toFixed(2)).toString();
const value=(id,x)=>id.startsWith('custom-')?customValues[id.slice(7)]?.(x)??NaN:functions.find(f=>f[0]===id)[2](x);
function combine(a,b){if(!Number.isFinite(a)||!Number.isFinite(b))return NaN;return state.op==='add'?a+b:state.op==='subtract'?a-b:state.op==='multiply'?a*b:state.op==='average'?(a+b)/2:state.op==='min'?Math.min(a,b):state.op==='max'?Math.max(a,b):Math.abs(b)<1e-9?NaN:a/b;}
function pair(i){const x=-3+i*DX,a=value(state.red,x),b=value(state.blue,x);return{x,a,b,r:combine(a,b)};}
function duration(){return (reduced?140:state.op==='divide'?2600:1350)/+$('speed').value;}
for(const name of ['red','blue']){const el=$(name);el.innerHTML=functions.map(f=>`<option value="${f[0]}">${f[1]}</option>`).join('')+`<option value="custom-${name}">Custom function…</option>`;el.value=state[name];el.onchange=()=>{if(el.value==='custom-'+name){$(name+'-math').focus();return;}state[name]=el.value;$(name+'-math').value=FunctionInput.presetLatex[el.value];$(name+'-error').textContent='';$(name+'-math').setAttribute('aria-invalid','false');reset();};}
try{const saved=JSON.parse(localStorage.getItem('function-studio')||'null');if(saved){for(const k of ['red','blue']){if(functions.some(f=>f[0]===saved[k]))state[k]=saved[k];else if(saved[k]==='custom-'+k&&saved.custom?.[k]){try{customValues[k]=FunctionInput.parse(saved.custom[k]);state[k]=saved[k];state.custom[k]=saved.custom[k];}catch{}}}if(symbols[saved.op])state.op=saved.op;}}catch{}
for(const name of ['red','blue']){
const field=$(name+'-math');field.value=state[name]==='custom-'+name?state.custom[name]:FunctionInput.presetLatex[state[name]];let timer;
field.addEventListener('input',()=>{stop();clearTimeout(timer);timer=setTimeout(()=>{try{const fn=FunctionInput.parse(field.value);customValues[name]=fn;state.custom[name]=field.value;state[name]='custom-'+name;$(name+'-error').textContent='';field.setAttribute('aria-invalid','false');reset();}catch(e){field.setAttribute('aria-invalid','true');$(name+'-error').textContent=e.message+' Showing the last valid function.';}},300);});
}
function persist(){try{localStorage.setItem('function-studio',JSON.stringify(state));}catch{}}
function stop(){playing=false;$('play').textContent='Play';}
function reset(){stop();cancelAnimationFrame(raf);raf=0;starts.clear();completed.clear();state.index=0;previous=0;for(const id of ['red','blue'])$(id).value=state[id];document.querySelectorAll('[data-op]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.op===state.op)));$('legend-result').textContent=state.op==='average'?'(f(x) + g(x)) / 2':['min','max'].includes(state.op)?`${state.op}(f(x), g(x))`:`f(x) ${symbols[state.op]} g(x)`;persist();updateDetails();draw();}
function trigger(i,t){if(i<0||i>N)return;completed.delete(i);starts.set(i,t);}
function schedule(){if(!raf)raf=requestAnimationFrame(frame);}
function frame(t){raf=0;now=t;if(playing&&t>=nextAt){if(previous>=N){stop();}else{previous++;state.index=previous;trigger(previous,t);nextAt=t+duration()*.82;updateDetails();}}
for(const [i,start]of starts)if(t>=start+duration()){completed.add(i);starts.delete(i);}
draw();if(playing||starts.size)schedule();}
$('play').onclick=()=>{if(playing){stop();return;}now=performance.now();if(state.index===N){completed.clear();starts.clear();state.index=0;}playing=true;previous=state.index;$('play').textContent='Pause';trigger(previous,now);nextAt=now+duration()*.82;updateDetails();schedule();};
$('restart').onclick=reset;
$('scrub').oninput=()=>{stop();now=performance.now();const target=+$('scrub').value;if(target<previous){for(const i of completed)if(i>=target)completed.delete(i);for(const i of starts.keys())if(i>=target)starts.delete(i);trigger(target,now);}else{let count=0;for(let i=previous;i<=target;i++)if(!completed.has(i)&&!starts.has(i)){trigger(i,now+count*90/+$('speed').value);count++;}}
state.index=target;previous=target;updateDetails();draw();schedule();};
document.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{state.op=b.dataset.op;reset();});
$('speed').onchange=()=>{const t=performance.now();for(const i of starts.keys())starts.set(i,t);nextAt=t+duration()*.82;schedule();};
function updateDetails(){const {x,a,b,r}=pair(state.index);$('scrub').value=state.index;$('xvalue').textContent=`x = ${x.toFixed(2)}`;$('equation').innerHTML=`<span class="red-text">${fmt(a)}</span> ${symbols[state.op]} <span class="blue-text">${b<0?'('+fmt(b)+')':fmt(b)}</span> = <span class="purple-text">${fmt(r)}</span>`;
if(['average','min','max'].includes(state.op))$('equation').innerHTML=`${symbols[state.op]}(<span class="red-text">${fmt(a)}</span>, <span class="blue-text">${fmt(b)}</span>) = <span class="purple-text">${fmt(r)}</span>`;
let detail=state.op==='add'?'Blue hops onto the tip of red. Both sticks align at the same x; dotted blue remains visible where they overlap.':state.op==='subtract'?'Flip blue, then hop it onto red. Dotted blue overlaps red where the values cancel. Purple shows the net height.':state.op==='multiply'?`Blue scales red by ${fmt(b)}. Both sticks remain visible; purple shows the resulting height.`:Math.abs(b)<1e-9?'Blue is zero here. Division is undefined, so the purple function has a gap.':`Measure red in blue-sized pieces: ${fmt(a)} contains ${fmt(r)} signed blue units. Then divide both heights by ${fmt(b)}: blue becomes 1 and red becomes ${fmt(r)}. Purple shows that new height.`;
if(state.op==='average')detail='The two tips move toward their midpoint. Purple is halfway between the red and blue values.';
if(state.op==='min')detail='Compare the two heights. Purple follows the lower value at each input, including negative values.';
if(state.op==='max')detail='Compare the two heights. Purple follows the higher value at each input.';
if(!Number.isFinite(a)||!Number.isFinite(b))detail='One of the functions has no finite real value at this input. Its stick and the purple result have a gap here.';
if(Number.isFinite(r)&&Math.abs(r)>12)detail+=' The result extends beyond the visible graph.';$('explanation').textContent=detail;}
function renderStickMarks({data,X,Y,z,L,R,T,B,W,low,high,seg,overlay,text}){let out='';
let activePhase='Ready to combine';
for(let i=0;i<=N;i++){
const d=data[i],x=X(d.x),done=completed.has(i),start=starts.get(i),active=start!==undefined&&now>=start,p=active?clamp((now-start)/duration()):0,selected=i===state.index;
const strength=selected?1:.55,offset=Math.min(3,(R-L)/N*.22);
if(!Number.isFinite(d.a)||!Number.isFinite(d.b)){if(Number.isFinite(d.a))out+=seg(x-offset,z,x-offset,Y(d.a),'#df625b',2,.6);if(Number.isFinite(d.b))out+=seg(x+offset,z,x+offset,Y(d.b),'#528bc9',2,.6);if(selected)activePhase='Outside the real domain · gap';continue;}
if(done||(active&&reduced)){const finite=Number.isFinite(d.r),ar=(state.op==='multiply'||state.op==='divide')&&finite?d.r:d.a,bb=state.op==='add'||state.op==='subtract'?d.a:0,be=state.op==='subtract'?-d.b:state.op==='divide'&&finite?1:d.b;
out+=overlay(x,d.r)+seg(x,z,x,Y(ar),'#df625b',selected?4:3,.9)+seg(x,Y(bb),x,Y(bb+be),'#528bc9',selected?3:2,.95,'stroke-dasharray="3 4"');
if(finite)out+=`<circle cx="${x}" cy="${Y(d.r)}" r="2.6" fill="#8c65c5"/>`;else out+=text(x,z-12,'×');continue;}
if(!active){out+=seg(x-offset,z,x-offset,Y(d.a),'#df625b',selected?4:2,strength)+seg(x+offset,z,x+offset,Y(d.b),'#528bc9',selected?4:2,strength);continue;}
if(reduced){out+=overlay(x,d.r)+seg(x-offset,z,x-offset,Y(d.a),'#df625b',3)+seg(x+offset,z,x+offset,Y(d.b),'#528bc9',3);continue;}
let ax=x-offset,ay0=z,ay1=Y(d.a),bx=x+offset,by0=z,by1=Y(d.b),alpha=1,reveal=0;
if(state.op==='add'||state.op==='subtract'){
const sub=state.op==='subtract',flip=sub?ease(p/.25):0,hop=ease((p-(sub?.25:0))/(sub?.42:.65)),angle=Math.PI*flip;
const signedBlue=sub?-d.b:d.b;
// Rigid rotation around blue's base; the hop then preserves its signed length.
let dx=sub?Math.sin(angle)*d.b*(B-T)/(high-low):0,dy=sub?-Math.cos(angle)*d.b*(B-T)/(high-low):-d.b*(B-T)/(high-low);
ax=x-offset*(1-hop);bx=x+offset*(1-hop);by0=z+(Y(d.a)-z)*hop-Math.sin(Math.PI*hop)*20;by1=by0+dy;
const merge=ease((p-.72)/.28);alpha=1;reveal=merge;
out+=overlay(x,d.r,reveal);
out+=seg(ax,ay0,ax,ay1,'#df625b',4,alpha)+seg(bx,by0,bx+dx,by1,'#528bc9',3,alpha,'stroke-dasharray="3 4"');
if(i===state.index)activePhase=sub&&p<.25?'Flip blue → negate':p<.72?'Hop blue onto red':d.a*signedBlue<0?'Opposite directions cancel':'Combine → purple';
}else if(['average','min','max'].includes(state.op)){
const t=ease(p/.8);ax=x-offset*(1-t);bx=x+offset*(1-t);reveal=ease((p-.55)/.45);out+=overlay(x,d.r,reveal);
out+=seg(ax,z,ax,Y(d.a),'#df625b',3,.8)+seg(bx,z,bx,Y(d.b),'#528bc9',2,.9,'stroke-dasharray="3 4"');
for(const [tip,color]of [[d.a,'#df625b'],[d.b,'#528bc9']])out+=`<circle cx="${x}" cy="${Y(tip+(d.r-tip)*t)}" r="3.5" fill="${color}"/>`;
if(selected)activePhase=state.op==='average'?'Meet at the midpoint':state.op==='min'?'Choose the lower height':'Choose the higher height';
}else{
const t=ease((p-(state.op==='divide'?.35:.1))/(state.op==='divide'?.43:.7)),target=Number.isFinite(d.r)?d.r:d.a;
ax=x-offset*(1-t);bx=x+offset*(1-t);
if(state.op==='multiply'){ay1=Y(d.a+(target-d.a)*t);by0=z;by1=Y(d.b);}
else if(Number.isFinite(d.r)){
ay1=Y(d.a+(target-d.a)*t);by1=Y(d.b+(1-d.b)*t);
// Division starts with blue-sized ruler intervals, then changes the unit.
const redHeight=d.a+(target-d.a)*t,unitHeight=d.b+(1-d.b)*t;
if(Math.abs(unitHeight)>.03){const pieces=Math.min(16,Math.floor(Math.abs(redHeight/unitHeight)));for(let k=1;k<=pieces;k++){const v=Math.sign(redHeight)*Math.abs(unitHeight)*k;out+=seg(ax-4,Y(v),ax+4,Y(v),'#528bc9',1.5,.8);}}
if(selected){const labelX=x<W/2?Math.min(R-105,x+14):Math.max(L+105,x-14),anchor=x<W/2?'start':'end';out+=text(labelX,T+20,p<.35?`1 blue unit = ${fmt(d.b)}`:`Blue: ${fmt(unitHeight)} → 1`,anchor)+text(labelX,T+37,p<.35?`Red = ${fmt(d.r)} blue units`:`Red: ${fmt(redHeight)} → ${fmt(d.r)}`,anchor);}
}
alpha=1;reveal=ease((p-.8)/.2);
out+=overlay(x,d.r,reveal);
out+=seg(ax,z,ax,ay1,'#df625b',4,alpha)+seg(bx,z,bx,by1,'#528bc9',3,alpha,'stroke-dasharray="3 4"');
if(i===state.index)activePhase=state.op==='multiply'?'Scale red by blue':Number.isFinite(d.r)?p<.35?'Measure in blue units':p<.8?'Rescale both ÷ '+fmt(d.b):'Blue = 1 · red = quotient':'Zero divisor · gap';
}
if(Number.isFinite(d.r)&&reveal>0)out+=`<circle cx="${x}" cy="${Y(d.r)}" r="${3*reveal}" fill="#8c65c5"/>`;
}
return {markup:out,activePhase};}
function draw(){
const W=width,H=height,L=W<500?45:58,R=W-25,T=35,B=H-45;
const data=Array.from({length:N+1},(_,i)=>pair(i));
const values=data.flatMap(d=>[d.a,d.b,Number.isFinite(d.r)&&Math.abs(d.r)<=12?d.r:0]).filter(Number.isFinite);
let low=Math.min(0,...values),high=Math.max(0,...values),pad=Math.max(.8,(high-low)*.17);low-=pad;high+=pad;
const X=x=>L+(x+3)/6*(R-L),Y=y=>B-(y-low)/(high-low)*(B-T),z=Y(0);
const seg=(x1,y1,x2,y2,color,stroke=3,opacity=1,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${stroke}" opacity="${opacity}" stroke-linecap="round" ${extra}/>`;
const text=(x,y,t,anchor='middle',extra='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" ${extra}>${t}</text>`;
const overlay=(x,r,amount=1)=>Number.isFinite(r)?`<rect data-result-overlay x="${x-Math.min(10,(R-L)/N*.43)}" y="${Math.min(z,Y(r))}" width="${Math.min(20,(R-L)/N*.86)}" height="${Math.max(1,Math.abs(Y(r)-z))}" fill="#8c65c5" opacity="${.28*amount}"/>`:'';
let out=`<defs><clipPath id="bounds"><rect x="${L}" y="${T}" width="${R-L}" height="${B-T}"/></clipPath></defs>`;
for(let i=0;i<=4;i++){let v=low+(high-low)*i/4,y=Y(v);out+=seg(L,y,R,y,'#eeefed',1)+text(L-10,y+4,fmt(v),'end');}
for(let x of(W<500?[-3,0,3]:[-3,-2,-1,0,1,2,3]))out+=text(X(x),B+23,x);
out+=text((L+R)/2,H-4,'x · input')+text(L,T-15,'output','start');
out+=`<g clip-path="url(#bounds)">`+seg(L,z,R,z,'#c8ccd0',1);
// Smooth original functions are deliberately faint: sticks carry the lesson.
for(let key of ['a','b']){let pen=false,path='';for(const d of data){if(!Number.isFinite(d[key])){pen=false;continue;}path+=(pen?'L':'M')+X(d.x)+','+Y(d[key]);pen=true;}out+=`<path d="${path}" fill="none" stroke="${key==='a'?'#df625b':'#528bc9'}" opacity=".12"/>`;}
let purplePath='',pen=false,lastB=null;
for(let i=0;i<=N;i++){let d=data[i],ok=completed.has(i)&&Number.isFinite(d.r)&&d.r>=low&&d.r<=high;if(state.op==='divide'&&lastB!==null&&lastB*d.b<=0)pen=false;if(ok){purplePath+=(pen?'L':'M')+X(d.x)+','+Y(d.r);pen=true;}else pen=false;lastB=d.b;}
out+=`<path d="${purplePath}" fill="none" stroke="#8c65c5" stroke-width="2.6"/>`;
const stickRender=renderStickMarks({data,X,Y,z,L,R,T,B,W,low,high,seg,overlay,text});out+=stickRender.markup;const activePhase=stickRender.activePhase;
const current=pair(state.index),cx=X(current.x);out+=seg(cx,T,cx,B,'#a9a0b6',1,.4,'stroke-dasharray="3 5"');out+='</g>';
out+=`<rect x="${cx-19}" y="${B+9}" width="38" height="20" rx="5" fill="#efe9f7"/>`+text(cx,B+23,fmt(current.x));
$('graph').innerHTML=`<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${out}</svg>`;
$('phase').textContent=starts.size?activePhase:completed.size===N+1?'A new function, revealed':completed.size?'Purple stays behind':'Ready to combine';
window.CombinationPlane?.update({state,samples:data,completed,renderSticks:renderStickMarks,read:t=>{const a=value(state.red,t),b=value(state.blue,t);return{x:t,a,b,r:combine(a,b)};},selected:current});
}
new ResizeObserver(entries=>{if(entries[0].contentRect.width>0){width=entries[0].contentRect.width;height=entries[0].contentRect.height;draw();}}).observe($('graph'));
reset();
})();


