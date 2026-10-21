(()=>{
'use strict';
const $=id=>document.getElementById(id),red='#df625b',purple='#8c65c5',blue='#528bc9';
const presets={quadratic:[x=>x*x/4-2,'\\frac{x^2}{4}-2'],square:[x=>x*x,'x^2'],sine:[x=>2*Math.sin(x),'2\\sin(x)'],abs:[x=>Math.abs(x)-2,'|x|-2'],cubic:[x=>x*x*x/8,'\\frac{x^3}{8}'],line:[x=>x/2+1,'\\frac{x}{2}+1']};
let fn=presets.quadratic[0],kind='left',amount=4,x=-3,phase=0,playing=false,raf=0,start=0,w=800,h=460,trail=new Map(),customLatex='',preset='quadratic',rangeX=8,rangeY=12,autoRange=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let coefficients={a:2,b:1,c:4,d:-3};
let motions=new Map(),motionRaf=0,settleTimer=0,scrubbing=false;
function clearMotions(){clearTimeout(settleTimer);settleTimer=0;cancelAnimationFrame(motionRaf);motionRaf=0;motions.clear();scrubbing=false;}
const fmt=n=>Number.isFinite(n)?Math.abs(n)<.0005?'0':String(+n.toFixed(2)):'undefined',clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*ease(t);
function config(){if(kind==='combined')return {...coefficients};return {a:kind==='vertical'?amount:kind==='reflectX'?-1:1,b:kind==='horizontal'?amount:kind==='reflectY'?-1:1,c:kind==='left'?amount:kind==='right'?-amount:0,d:kind==='up'?amount:kind==='down'?-amount:0};}
function values(t){const {a,b,c,d}=config(),u=b*t+c,v=fn(u);return{u,v,y:a*v+d};}
function formula(){const {a,b,c,d}=config();let input=b===1?'x':b===-1?'−x':fmt(b)+'x';if(c)input+=(c>0?' + ':' − ')+fmt(Math.abs(c));return 'g(x) = '+(a===1?'':a===-1?'−':fmt(a)+' · ')+'f('+input+')'+(d?(d>0?' + ':' − ')+fmt(Math.abs(d)):'');}
function save(){try{localStorage.setItem('function-studio-transform',JSON.stringify({kind,amount,preset,customLatex,rangeX,rangeY,autoRange,coefficients}));}catch{}}
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;clearTimeout(settleTimer);settleTimer=0;$('tf-play').textContent='▶ Play sweep';}
function reset(){stop();clearMotions();cancelAnimationFrame(raf);raf=0;trail.clear();phase=0;if(autoRange)fit();detail();draw();save();}
function fit(){const cfg=config();rangeX=Math.max(5,Math.ceil(Math.abs(cfg.b)*3+Math.abs(cfg.c)+1));let heights=Array.from({length:121},(_,i)=>values(-3+i*.05)).flatMap(d=>[d.v,cfg.a*d.v,d.y]).filter(n=>Number.isFinite(n)&&Math.abs(n)<1e6);rangeY=Math.max(3,Math.ceil(Math.max(0,...heights.map(Math.abs))*1.2));syncRanges();}
function syncRanges(){$('tf-range-x').value=rangeX;$('tf-range-y').value=rangeY;}
for(const axis of ['x','y'])$('tf-range-'+axis).onchange=()=>{const input=$('tf-range-'+axis),n=Number(input.value);if(!Number.isFinite(n)||n<.5||n>1e6){syncRanges();return;}if(axis==='x')rangeX=n;else rangeY=n;autoRange=false;draw();save();};
$('tf-fit').onclick=()=>{autoRange=true;fit();draw();save();};
$('tf-preview').onchange=draw;
function timeline(){return kind==='combined'?[0,.12,.24,.4,.62,.81,1]:[0,.22,.46,.76,1];}
function setStep(i){stop();clearMotions();const times=timeline();phase=i===times.length-1?1:times[i]-.00001;if(i===times.length-1)trail.set(+x.toFixed(2),values(x).y);draw();}
for(let i=1;i<=6;i++)$('tf-step-'+i).onclick=()=>setStep(i);
for(const k of ['a','b','c','d'])$('tf-'+k).onchange=()=>{const input=$('tf-'+k),value=Number(input.value),limit=k==='a'||k==='b'?10:20;if(input.value.trim()===''||!Number.isFinite(value)||Math.abs(value)>limit){input.value=coefficients[k];return;}coefficients[k]=value;reset();};
function detail(){const {u,v,y}=values(x),{a,d}=config();$('tf-x').value=x;$('tf-x-value').textContent='x = '+x.toFixed(2);$('tf-formula').textContent=formula();$('tf-equation').textContent='x = '+fmt(x)+' → look up '+fmt(u)+' → '+fmt(y);
let message='At x = '+fmt(x)+', go to '+fmt(u)+' on the original curve. ';
if(!Number.isFinite(v))message+='The original function is undefined there, so the transformed curve has a gap.';
else{message+='Its height is '+fmt(v)+'. Carry that height back to x = '+fmt(x)+'.';if(a!==1||d!==0)message+=' Then '+(a!==1?'multiply the height by '+fmt(a):'')+(a!==1&&d?' and ':'')+(d?'add '+fmt(d):'')+' to get '+fmt(y)+'.';else message+=' The output stays '+fmt(y)+'.';}
$('tf-explanation').textContent=message;
}
function animate(sweep){stop();clearMotions();cancelAnimationFrame(raf);phase=0;playing=sweep;if(sweep){if(x>=3){x=-3;trail.clear();}$('tf-play').textContent='Ⅱ Pause';}start=performance.now();detail();function tick(t){raf=0;const duration=reduced?160:kind==='combined'?sweep?2400:5600:sweep?1800:4200;phase=clamp((t-start)/duration);draw();if(phase<1){raf=requestAnimationFrame(tick);return;}const v=values(x);trail.set(+x.toFixed(2),v.y);draw();if(playing&&x<3){x=Math.min(3,+(x+.2).toFixed(2));start=t;phase=0;detail();raf=requestAnimationFrame(tick);}else{stop();detail();}}raf=requestAnimationFrame(tick);}
$('tf-play').onclick=()=>{if(playing){stop();return;}animate(true);};$('tf-replay').onclick=()=>animate(false);
function motionFrame(t){motionRaf=0;for(const [key,m]of motions){if(t-m.start>=m.duration){trail.set(key,m.y);motions.delete(key);}}draw();if(motions.size)motionRaf=requestAnimationFrame(motionFrame);}
function movePoint(at,t){const key=+at.toFixed(2),d=values(key),cfg=config();if(motions.has(key))return;const points=[[d.u,d.v],[key,d.v],[key,cfg.a*d.v],[key,d.y]].filter((p,i,a)=>i===0||Math.abs(p[0]-a[i-1][0])>1e-10||Math.abs(p[1]-a[i-1][1])>1e-10);motions.set(key,{...d,x:key,points,start:t,duration:reduced?0:480});}
$('tf-clear').onclick=()=>{stop();clearMotions();trail.clear();phase=0;detail();draw();};
function settle(){clearTimeout(settleTimer);settleTimer=setTimeout(()=>{settleTimer=0;animate(false);},reduced?180:650);}
$('tf-x').oninput=()=>{
 const previous=x;stop();x=+$('tf-x').value;phase=0;scrubbing=true;
 const count=Math.max(1,Math.min(60,Math.ceil(Math.abs(x-previous)/.1))),t=performance.now();
 for(let i=1;i<=count;i++)movePoint(previous+(x-previous)*i/count,t);
 detail();draw();if(!motionRaf)motionRaf=requestAnimationFrame(motionFrame);settle();
};
$('tf-x').onchange=()=>{if(scrubbing)settle();else animate(false);};
$('tf-kind').onchange=()=>{kind=$('tf-kind').value;const scale=kind==='vertical'||kind==='horizontal';amount=scale?2:4;$('tf-amount').min=scale?'.25':'0';$('tf-amount').max=scale?'3':'5';$('tf-amount').value=amount;syncAmount();reset();};
function syncAmount(){$('tf-amount-value').textContent=fmt(amount);rootAmount().hidden=kind==='reflectX'||kind==='reflectY'||kind==='combined';$('tf-combined').hidden=kind!=='combined';$('tf-step-1').parentElement.classList.toggle('combined',kind==='combined');for(const k of ['a','b','c','d'])$('tf-'+k).value=coefficients[k];for(let i=5;i<=6;i++)$('tf-step-'+i).hidden=kind!=='combined';}function rootAmount(){return $('tf-amount').parentElement;}
$('tf-amount').oninput=()=>{amount=+$('tf-amount').value;syncAmount();reset();};
$('tf-function').onchange=()=>{preset=$('tf-function').value;if(preset==='custom'){$('tf-math').focus();return;}fn=presets[preset][0];$('tf-math').value=presets[preset][1];$('tf-error').textContent='';$('tf-math').setAttribute('aria-invalid','false');reset();};
let timer;$('tf-math').addEventListener('input',()=>{stop();clearTimeout(timer);timer=setTimeout(()=>{try{const latex=$('tf-math').value,parsed=FunctionInput.parse(latex);fn=parsed;customLatex=latex;preset='custom';$('tf-function').value='custom';$('tf-error').textContent='';$('tf-math').setAttribute('aria-invalid','false');reset();}catch(e){$('tf-error').textContent=e.message+' Showing the last valid function.';$('tf-math').setAttribute('aria-invalid','true');}},300);});
function draw(){
const cfg=config(),{u,v,y}=values(x),maxX=rangeX,maxY=rangeY;
const L=w<500?42:54,R=w-24,T=42,B=h-46,cx=(L+R)/2,cy=(T+B)/2,X=t=>cx+t*(R-L)/(2*maxX),Y=t=>cy-t*(B-T)/(2*maxY);
const left=X(-maxX),right=X(maxX),top=Y(maxY),bottom=Y(-maxY),line=(a,b,c,d,color,width=1,extra='')=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const text=(a,b,t,anchor='middle',extra='')=>`<text x="${a}" y="${b}" text-anchor="${anchor}" ${extra}>${t}</text>`;
let out=`<defs><clipPath id="tf-clip"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath><marker id="tf-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6" fill="${blue}"/></marker></defs>`;
function tickStep(span,count){const raw=span/count,power=10**Math.floor(Math.log10(raw)),part=raw/power;return(part<=1?1:part<=2?2:part<=5?5:10)*power;}
const tx=tickStep(maxX*2,w<500?5:9),ty=tickStep(maxY*2,8);
for(let t=Math.ceil(-maxX/tx)*tx;t<=maxX+tx*.001;t+=tx){out+=line(X(t),top,X(t),bottom,'#eff0ed');if(Math.abs(t)>tx*.01&&Math.abs(X(t)-X(x))>30&&Math.abs(X(t)-X(u))>30)out+=text(X(t),cy+17,fmt(t));}
for(let t=Math.ceil(-maxY/ty)*ty;t<=maxY+ty*.001;t+=ty){out+=line(left,Y(t),right,Y(t),'#eff0ed');if(Math.abs(t)>ty*.01)out+=text(cx-9,Y(t)+4,fmt(t),'end');}
out+=line(left,cy,right,cy,'#9ba2a8',1.2)+line(cx,top,cx,bottom,'#9ba2a8',1.2)+text(right-3,cy-9,'x')+text(cx+10,top+10,'y')+text(cx-9,cy+16,'0','end');
out+=text(right-15,top+18,'I')+text(left+15,top+18,'II')+text(left+15,bottom-10,'III')+text(right-15,bottom-10,'IV');
out+='<g clip-path="url(#tf-clip)">';
function curve(f,color,opacity=1,dash=''){let path='',pen=false,last;for(let i=0;i<=320;i++){const xx=-maxX+i*maxX/160,yy=f(xx);if(!Number.isFinite(yy)||Math.abs(yy)>maxY*2||(last!==undefined&&Math.abs(yy-last)>maxY)){pen=false;last=yy;continue;}path+=(pen?'L':'M')+X(xx)+','+Y(yy);pen=true;last=yy;}return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.3" opacity="${opacity}" ${dash}/>`;}
out+=curve(fn,red,.85);if($('tf-preview').checked)out+=curve(t=>values(t).y,purple,.28,'stroke-dasharray="4 5"');
let path='',pen=false,lastX;for(const [xx,yy]of [...trail].sort((a,b)=>a[0]-b[0])){if(!Number.isFinite(yy)){pen=false;continue;}path+=(pen&&xx-lastX<=.21?'L':'M')+X(xx)+','+Y(yy);pen=true;lastX=xx;}out+=`<path data-transform-trail d="${path}" fill="none" stroke="${purple}" stroke-width="3.5"/>`;
// Combined transforms separate input scaling, input shift, output scaling and output shift.
const times=timeline(),stages=kind==='combined'?['input-scale','input-shift','lookup','carry','scale','shift']:['input','lookup','carry','output'];
const stageIndex=Math.min(stages.length-1,times.slice(1).findIndex(end=>phase<end)===-1?stages.length-1:times.slice(1).findIndex(end=>phase<end));
const stage=stages[stageIndex],progress=ease((phase-times[stageIndex])/(times[stageIndex+1]-times[stageIndex])),scaled=cfg.a*v,inputScaled=cfg.b*x;
const hasHeight=stageIndex>=stages.indexOf('carry'),hasOutput=kind==='combined'?stageIndex>=4:stageIndex>=3;
const arrow=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,blue,2,'stroke-dasharray="4 4" marker-end="url(#tf-arrow)"');
out+=line(X(x),top,X(x),bottom,purple,1,'opacity=".3" stroke-dasharray="3 5"');
out+=line(X(u),top,X(u),bottom,red,1,'opacity=".25" stroke-dasharray="3 5"');
if(!scrubbing){
let px=x,py=0;
if(stage==='input'||stage==='input-scale'||stage==='input-shift'){
const from=stage==='input-shift'?inputScaled:x,to=stage==='input-scale'?inputScaled:u;px=from+(to-from)*progress;
if(stage==='input-shift')out+=arrow(X(x),cy,X(inputScaled),cy);
out+=arrow(X(from),cy,X(px),cy);
}
else if(!Number.isFinite(v)){out+=arrow(X(x),cy,X(u),cy);px=u;py=0;out+=text(X(u),cy-16,'undefined');}
else{out+=arrow(X(x),cy,X(u),cy);
if(stage==='lookup'){px=u;py=v*progress;}else if(stage==='carry'){px=u+(x-u)*progress;py=v;}else if(stage==='scale'){px=x;py=v+(scaled-v)*progress;}else if(stage==='shift'){px=x;py=scaled+(y-scaled)*progress;}else{px=x;py=v+(y-v)*progress;}
out+=line(X(u),cy,X(u),Y(v),red,1.5,'stroke-dasharray="4 4"')+`<circle cx="${X(u)}" cy="${Y(v)}" r="4" fill="${red}"/>`;
if(hasHeight)out+=line(X(u),Y(v),X(x),Y(v),blue,2,'opacity=".55" stroke-dasharray="4 4"');
if(hasOutput)out+=line(X(x),cy,X(x),Y(y),purple,2,'opacity=".35" stroke-dasharray="4 4"');
if(stage==='carry')out+=arrow(X(u),Y(v),X(px),Y(v));
if(hasOutput)out+=line(X(x),Y(v),X(x),Y(py),purple,3);
if(kind==='combined'&&hasOutput)out+=`<circle data-scaled-height cx="${X(x)}" cy="${Y(scaled)}" r="4" fill="none" stroke="${blue}" stroke-width="2" opacity=".8"/>`;
if(phase>=1)out+=`<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="${purple}"/>`;
}
out+=`<circle data-journey-point data-stage="${stage}" data-height="${py}" cx="${X(px)}" cy="${Y(py)}" r="6" fill="${hasOutput?purple:blue}" stroke="#fff" stroke-width="2"/>`;
}
const motionTime=performance.now();
for(const m of motions.values()){
 if(!Number.isFinite(m.v)||!Number.isFinite(m.y))continue;
 const p=reduced?1:clamp((motionTime-m.start)/m.duration),segments=Math.max(1,m.points.length-1),at=Math.min(segments-1,Math.floor(p*segments)),part=ease(p>=1?1:p*segments-at),from=m.points[at]||m.points[0],to=m.points[at+1]||from,mx=from[0]+(to[0]-from[0])*part,my=from[1]+(to[1]-from[1])*part;
 const color=`rgb(${Math.round(223+(140-223)*p)},${Math.round(98+3*p)},${Math.round(91+106*p)})`;
 for(let i=0;i<at;i++)out+=line(X(m.points[i][0]),Y(m.points[i][1]),X(m.points[i+1][0]),Y(m.points[i+1][1]),purple,1,'opacity=".2" stroke-dasharray="3 4"');
 out+=line(X(from[0]),Y(from[1]),X(mx),Y(my),purple,1,'opacity=".25" stroke-dasharray="3 4"');
 out+=`<circle data-transfer-source cx="${X(m.u)}" cy="${Y(m.v)}" r="2.4" fill="${red}" opacity=".65"/><circle data-transfer-point data-input="${m.x}" data-progress="${p.toFixed(3)}" data-segment="${at}" data-from-x="${from[0]}" data-from-y="${from[1]}" data-to-x="${to[0]}" data-to-y="${to[1]}" cx="${X(mx)}" cy="${Y(my)}" r="4.5" fill="${color}" stroke="#fff" stroke-width="1.2"/>`;
}
out+='</g>';
// Persistent number-line ticks are labeled separately from the moving dot.
function badge(px,py,label,color){const bw=label.length*6.1+14;px=Math.max(left+bw/2,Math.min(right-bw/2,px));py=Math.max(top+12,Math.min(bottom-12,py));return `<g><rect x="${px-bw/2}" y="${py-11}" width="${bw}" height="22" rx="5" fill="#fff" stroke="${color}" stroke-opacity=".4"/>`+text(px,py+4,label,'middle',`style="fill:${color};font-weight:600"`)+'</g>';}
if(Math.abs(x)<=maxX)out+=line(X(x),cy-6,X(x),cy+6,purple,3)+badge(X(x),cy+34,'x = '+fmt(x),purple);
if(Math.abs(u)<=maxX)out+=line(X(u),cy-7,X(u),cy+7,red,3)+badge(X(u),cy-24,Math.abs(x-u)<1e-8?'lookup = x = '+fmt(u):'lookup = '+fmt(u),red);
if(kind==='combined'&&!scrubbing&&stageIndex<2&&Math.abs(inputScaled)<=maxX&&Math.abs(inputScaled-x)>1e-8&&Math.abs(inputScaled-u)>1e-8)out+=line(X(inputScaled),cy-5,X(inputScaled),cy+5,blue,2)+badge(X(inputScaled),cy+62,'bx = '+fmt(inputScaled),blue);
if(Number.isFinite(v)&&(hasHeight||stage==='lookup'&&progress>.95)&&Math.abs(v)<=maxY&&Math.abs(u)<=maxX){const side=X(u)>cx?-1:1,labelY=Math.abs(Y(v)-cy)<60?Y(v)-70:Y(v)-20;out+=badge(X(u)+side*72,labelY,'f('+fmt(u)+') = '+fmt(v),red);}
if(kind==='combined'&&!scrubbing&&hasOutput&&Number.isFinite(scaled)&&Math.abs(scaled)<=maxY)out+=badge(X(x)+(X(x)>cx?-74:74),Y(scaled)-22,'× '+fmt(cfg.a)+' → '+fmt(scaled),blue);
if(Number.isFinite(y)&&phase>=.99&&Math.abs(y)<=maxY&&Math.abs(x)<=maxX){const labelY=Math.abs(Y(y)-cy)<60?Y(y)+70:Y(y)+24;out+=badge(X(x)+(X(x)>cx?-64:64),labelY,'g('+fmt(x)+') = '+fmt(y),purple);}
$('tf-graph').innerHTML=`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${out}</svg>`;
const step=stageIndex+1;for(let i=1;i<=6;i++){$('tf-step-'+i).classList.toggle('current',!scrubbing&&i===step);$('tf-step-'+i).setAttribute('aria-pressed',String(!scrubbing&&i===step));}
const labels=kind==='combined'?['Input × '+fmt(cfg.b),'Inside '+(cfg.c<0?'−':'+')+' '+fmt(Math.abs(cfg.c)),'Read f('+fmt(u)+')','Carry back to '+fmt(x),'Height × '+fmt(cfg.a),'Outside '+(cfg.d<0?'−':'+')+' '+fmt(Math.abs(cfg.d))]:['Go to '+fmt(u),'Height = '+fmt(v),'Bring back to '+fmt(x),cfg.a===1&&cfg.d===0?'Keep that height':'New height = '+fmt(y)];
labels.forEach((label,i)=>{$('tf-step-'+(i+1)).textContent=(i+1)+' · '+label;});
const input=fmt(cfg.b)+' × ('+fmt(x)+') '+(cfg.c<0?'−':'+')+' '+fmt(Math.abs(cfg.c));
const captions=kind==='combined'?[
`Scale the input first: ${fmt(cfg.b)} × (${fmt(x)}) = ${fmt(inputScaled)}. This changes where we look, not the height.`,
`Then shift the lookup input: ${fmt(inputScaled)} ${cfg.c<0?'−':'+'} ${fmt(Math.abs(cfg.c))} = ${fmt(u)}.`,
`Go vertically to the original curve: f(${fmt(u)}) = ${fmt(v)}.`,
`Carry that height, ${fmt(v)}, back to x = ${fmt(x)}.`,
`Multiply the height: ${fmt(cfg.a)} × (${fmt(v)}) = ${fmt(scaled)}.`,
`Finally shift the height: ${fmt(scaled)} ${cfg.d<0?'−':'+'} ${fmt(Math.abs(cfg.d))} = ${fmt(y)}. This is g(${fmt(x)}).`
]:[`Start at x = ${fmt(x)}. Evaluate the inside first: ${input} = ${fmt(u)}.`,`Go vertically to the red curve at ${fmt(u)}. Read f(${fmt(u)}) = ${fmt(v)}.`,`Carry the same height, ${fmt(v)}, horizontally back to x = ${fmt(x)}.`,cfg.a===1&&cfg.d===0?`Keep that height: g(${fmt(x)}) = f(${fmt(u)}) = ${fmt(y)}.`:`Now change the height: ${fmt(cfg.a)} × (${fmt(v)}) ${cfg.d<0?'−':'+'} ${fmt(Math.abs(cfg.d))} = ${fmt(y)}.`];
const caption=scrubbing?'Sweeping: original points move directly to their transformed positions. Pause on an input to follow its full lookup.':!Number.isFinite(v)&&stageIndex>=stages.indexOf('lookup')?'The original function is undefined at this lookup input. There is no point to carry back.':captions[stageIndex];if($('tf-stage-caption').textContent!==caption)$('tf-stage-caption').textContent=caption;
$('tf-window-note').textContent=Math.abs(u)>maxX||Number.isFinite(v)&&Math.abs(v)>maxY||Number.isFinite(y)&&Math.abs(y)>maxY||kind==='combined'&&Number.isFinite(scaled)&&Math.abs(scaled)>maxY?'A selected point is outside the current view. Increase an axis range or choose Fit journey.':'';
}
try{const saved=JSON.parse(localStorage.getItem('function-studio-transform')||'null');if(saved){if(['combined','left','right','up','down','vertical','horizontal','reflectX','reflectY'].includes(saved.kind))kind=saved.kind;if(Number.isFinite(saved.amount))amount=Math.max(.25,Math.min(5,saved.amount));if(presets[saved.preset]){preset=saved.preset;fn=presets[preset][0];}else if(saved.preset==='custom'&&saved.customLatex){fn=FunctionInput.parse(saved.customLatex);customLatex=saved.customLatex;preset='custom';}}}catch{}
try{const saved=JSON.parse(localStorage.getItem('function-studio-transform')||'null');for(const k of ['a','b','c','d'])if(Number.isFinite(saved?.coefficients?.[k])&&Math.abs(saved.coefficients[k])<=(k==='a'||k==='b'?10:20))coefficients[k]=saved.coefficients[k];if(saved?.autoRange===false&&saved.rangeX>=.5&&saved.rangeX<=1e6&&saved.rangeY>=.5&&saved.rangeY<=1e6){rangeX=saved.rangeX;rangeY=saved.rangeY;autoRange=false;}}catch{}
$('tf-kind').value=kind;$('tf-function').value=preset;$('tf-math').value=preset==='custom'?customLatex:presets[preset][1];$('tf-amount').min=kind==='horizontal'||kind==='vertical'?'.25':'0';$('tf-amount').max=kind==='horizontal'||kind==='vertical'?'3':'5';$('tf-amount').value=amount;syncAmount();if(autoRange)fit();else syncRanges();
new ResizeObserver(entries=>{w=entries[0].contentRect.width;h=entries[0].contentRect.height;draw();}).observe($('tf-graph'));detail();draw();
})();



