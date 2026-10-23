(()=>{
const $=id=>document.getElementById(id),presets={square:[x=>x*x,'x^2'],line:[x=>x+1,'x+1'],sine:[Math.sin,'\\sin(x)'],double:[x=>2*x,'2x'],reciprocal:[x=>x===0?NaN:1/x,'\\frac{1}{x}'],root:[x=>x<0?NaN:Math.sqrt(x),'\\sqrt{x}']};
let functions={f:presets.square[0],g:presets.line[0]},chosen={f:'square',g:'line'},latex={f:'x^2',g:'x+1'},order='fg',x=-2,range=10,phase=0,playing=false,raf=0,start=0,trail=new Map();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t)},fmt=n=>!Number.isFinite(n)?'undefined':Math.abs(n)<.00001?'0':Math.abs(n)>9999?n.toExponential(1):String(+n.toFixed(2));
function names(){return order==='fg'?{inner:'g',outer:'f'}:{inner:'f',outer:'g'};}
function values(at){const {inner,outer}=names();let u=functions[inner](at),y=Number.isFinite(u)?functions[outer](u):NaN;return{u,y};}
function save(){try{localStorage.setItem('composition-studio',JSON.stringify({chosen,latex,order}));}catch{}}
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;$('co-play').textContent='Play';}
function reset(){stop();trail.clear();phase=0;detail();draw();save();}
for(const k of ['f','g']){
const select=$('co-'+k);select.innerHTML=Object.keys(presets).map(id=>`<option value="${id}">${{square:'x²',line:'x + 1',sine:'sin(x)',double:'2x',reciprocal:'1 / x',root:'√x'}[id]}</option>`).join('')+'<option value="custom">Custom function…</option>';select.value=chosen[k];
select.onchange=()=>{if(select.value==='custom'){$('co-'+k+'-math').focus();return;}chosen[k]=select.value;functions[k]=presets[chosen[k]][0];latex[k]=presets[chosen[k]][1];$('co-'+k+'-math').value=latex[k];$('co-'+k+'-error').textContent='';$('co-'+k+'-math').setAttribute('aria-invalid','false');reset();};
let timer;$('co-'+k+'-math').addEventListener('input',()=>{stop();clearTimeout(timer);timer=setTimeout(()=>{try{const input=$('co-'+k+'-math').value,fn=FunctionInput.parse(input);functions[k]=fn;chosen[k]='custom';latex[k]=input;select.value='custom';$('co-'+k+'-error').textContent='';$('co-'+k+'-math').setAttribute('aria-invalid','false');reset();}catch(e){$('co-'+k+'-error').textContent=e.message+' Keeping the last valid function.';$('co-'+k+'-math').setAttribute('aria-invalid','true');}},300);});
}
$('co-order').onchange=()=>{order=$('co-order').value;reset();};
function animate(sweep){stop();phase=0;playing=sweep;if(sweep&&x>=3){x=-3;trail.clear();}if(sweep)$('co-play').textContent='Pause';start=performance.now();detail();function tick(t){raf=0;phase=clamp((t-start)/(reduced?120:sweep?2000:4600));draw();if(phase<1){raf=requestAnimationFrame(tick);return;}trail.set(+x.toFixed(2),values(x).y);draw();if(playing&&x<3){x=Math.min(3,+(x+.2).toFixed(2));start=t;phase=0;detail();raf=requestAnimationFrame(tick);}else stop();}raf=requestAnimationFrame(tick);}
$('co-play').onclick=()=>playing?stop():animate(true);$('co-replay').onclick=()=>animate(false);$('co-clear').onclick=reset;
$('co-x').oninput=()=>{const old=x;stop();x=+$('co-x').value;const count=Math.max(1,Math.ceil(Math.abs(x-old)/.1));for(let i=1;i<=count;i++){const at=+(old+(x-old)*i/count).toFixed(2);trail.set(at,values(at).y);}phase=0;detail();draw();};$('co-x').onchange=()=>animate(false);
for(let i=1;i<=5;i++)$('co-step-'+i).onclick=()=>{stop();phase=[0,.19999,.39999,.59999,.79999,1][i];if(i===5)trail.set(+x.toFixed(2),values(x).y);draw();};
$('co-range').onchange=()=>{const n=Number($('co-range').value);if(!Number.isFinite(n)||n<1||n>1e5){$('co-range').value=range;return;}range=n;draw();};
$('co-fit').onclick=()=>{const {u,y}=values(x);range=Math.max(3,Math.ceil(Math.max(Math.abs(x),Number.isFinite(u)?Math.abs(u):0,Number.isFinite(y)?Math.abs(y):0,Number.isFinite(u)?Math.abs(x)+Math.abs(u):0)*1.3));$('co-range').value=range;draw();};$('co-preview').onchange=draw;
function detail(){const {inner,outer}=names(),{u,y}=values(x);$('co-x').value=x;$('co-x-value').textContent='x = '+x.toFixed(2);$('co-formula').textContent=outer+'('+inner+'(x))';$('co-equation').textContent=inner+'('+fmt(x)+') = '+fmt(u)+' → '+outer+'('+fmt(u)+') = '+fmt(y);$('co-roles').textContent=inner+' first → '+outer+' next';}
function draw(){
const {inner,outer}=names(),{u,y}=values(x),stage=Math.min(4,Math.floor(phase*5)),p=ease((phase-stage*.2)/.2),innerColor=inner==='f'?'#df625b':'#528bc9',outerColor=outer==='f'?'#df625b':'#528bc9';
const el=$('co-graph'),W=Math.max(280,el.clientWidth),H=el.clientHeight||490,L=42,R=W-22,T=30,B=H-38,cx=(L+R)/2,cy=(T+B)/2,S=Math.min((R-L)/(range*2),(B-T)/(range*2)),X=t=>cx+t*S,Y=t=>cy-t*S,left=X(-range),right=X(range),top=Y(range),bottom=Y(-range);
const line=(a,b,c,d,color,width=1,extra='')=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const stick=(a,b,c,d,color,extra='')=>line(X(a),Y(b),X(c),Y(d),color,5,extra);
const text=(a,b,t,anchor='middle')=>`<text x="${a}" y="${b}" text-anchor="${anchor}">${t}</text>`;
let out=`<defs><clipPath id="co-clip"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs>`;
const raw=range/3,power=10**Math.floor(Math.log10(raw)),step=(raw/power<=1?1:raw/power<=2?2:raw/power<=5?5:10)*power;
for(let t=Math.ceil(-range/step)*step;t<=range;t+=step){out+=line(X(t),top,X(t),bottom,'#eff0ed')+line(left,Y(t),right,Y(t),'#eff0ed');if(t!==0){if(Math.abs(t-x)>.7&&Math.abs(t-u)>.7)out+=text(X(t),cy+17,fmt(t));out+=text(cx-8,Y(t)+4,fmt(t),'end');}}
out+=line(left,cy,right,cy,'#9ba2a8',1.2)+line(cx,top,cx,bottom,'#9ba2a8',1.2)+text(right-5,cy-9,'x')+text(cx+12,top+12,'y')+text(cx-7,cy+17,'0','end');
out+='<g clip-path="url(#co-clip)">';
function curve(fn,color,opacity,dash=''){let path='',pen=false,last;for(let i=0;i<=300;i++){const xx=-range+i*range/150,yy=fn(xx);if(!Number.isFinite(yy)||Math.abs(yy)>range*2||last!==undefined&&Math.abs(yy-last)>range){pen=false;last=yy;continue;}path+=(pen?'L':'M')+X(xx)+','+Y(yy);pen=true;last=yy;}return `<path d="${path}" fill="none" stroke="${color}" opacity="${opacity}" stroke-width="2" ${dash}/>`;}
out+=curve(functions.f,'#df625b',.55)+curve(functions.g,'#528bc9',.55,'stroke-dasharray="6 3"');if($('co-preview').checked)out+=curve(t=>values(t).y,'#8c65c5',.25,'stroke-dasharray="4 4"');
let path='',pen=false,last;for(const [at,v]of [...trail].sort((a,b)=>a[0]-b[0])){if(!Number.isFinite(v)){pen=false;continue;}path+=(pen&&at-last<=.21?'L':'M')+X(at)+','+Y(v);last=at;pen=true;}out+=`<path data-composition-trail d="${path}" fill="none" stroke="#8c65c5" stroke-width="3"/>`;
out+=line(X(x),top,X(x),bottom,'#8c65c5',1,'opacity=".25" stroke-dasharray="3 4"');
let endpoint=[x,0];
if(Number.isFinite(u)){
// Rotation in equal coordinate units preserves both signed length and direction.
if(stage===0){endpoint=[x,u*p];out+=stick(x,0,...endpoint,innerColor,'data-composition-stick="inner"');}
else if(stage===1){const theta=p*Math.PI/2;endpoint=[x+u*Math.sin(theta),u*Math.cos(theta)];out+=stick(x,0,...endpoint,innerColor,'data-composition-stick="rotate"');}
else if(stage===2){const base=x*(1-p);endpoint=[base+u,0];out+=stick(base,0,...endpoint,innerColor,'data-composition-stick="slide"');}
else{out+=stick(0,0,u,0,innerColor,'data-composition-stick="input" opacity=".8"');if(Number.isFinite(y)){if(stage===3){endpoint=[u,y*p];out+=stick(u,0,...endpoint,outerColor,'data-composition-stick="outer"');}else{const at=u+(x-u)*p;endpoint=[at,y];out+=stick(u,0,u,y,outerColor,'opacity=".25"')+stick(at,0,...endpoint,'#8c65c5','data-composition-stick="result"');out+=line(X(u),Y(y),X(at),Y(y),'#8c65c5',1.5,'stroke-dasharray="3 4"');}}else endpoint=[u,0];}
if(stage>=1)out+=`<circle cx="${X(x)}" cy="${Y(u)}" r="3" fill="${innerColor}" opacity=".6"/>`;
}
out+=`<circle data-composition-point data-stage="${stage}" data-x="${endpoint[0]}" data-y="${endpoint[1]}" cx="${X(endpoint[0])}" cy="${Y(endpoint[1])}" r="5" fill="${stage===4?'#8c65c5':stage===3?outerColor:innerColor}" stroke="#fff" stroke-width="1.4"/>`;
out+='</g>';
function badge(at,dy,label,color){if(Math.abs(at)>range)return '';const bw=label.length*6.2+12,px=Math.max(left+bw/2,Math.min(right-bw/2,X(at)));return line(X(at),cy-6,X(at),cy+6,color,2)+`<rect x="${px-bw/2}" y="${cy+dy-11}" width="${bw}" height="22" rx="5" fill="#fff" stroke="${color}" stroke-opacity=".4"/>`+text(px,cy+dy+4,label);}
out+=badge(x,34,'original x = '+fmt(x),'#8c65c5');if(Number.isFinite(u)&&stage>=2)out+=badge(u,-24,'next input = '+fmt(u),innerColor);
el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${out}</svg>`;
const labels=['1 · First height','2 · Rotate the stick','3 · Slide to the origin','4 · Second height','5 · Carry back to x'];
for(let i=1;i<=5;i++){$('co-step-'+i).textContent=labels[i-1];$('co-step-'+i).classList.toggle('current',i===stage+1);$('co-step-'+i).setAttribute('aria-pressed',String(i===stage+1));}
const captions=[`At x = ${fmt(x)}, grow a stick to ${inner}(${fmt(x)}) = ${fmt(u)}.`,`Turn the signed height ${fmt(u)} sideways. A negative height turns left; a positive height turns right.`,`Slide the stick’s base to 0. Its tip lands at ${fmt(u)}, the next function’s input.`,`From x = ${fmt(u)}, grow a new stick to ${outer}(${fmt(u)}) = ${fmt(y)}.`,`Carry that height back to the original x = ${fmt(x)}. Plot (${fmt(x)}, ${fmt(y)}).`];
const caption=!Number.isFinite(u)?'The first function is undefined here, so there is no stick to pass on.':!Number.isFinite(y)&&stage>=3?'The second function is undefined at this input. The composition has a gap.':captions[stage];if($('co-caption').textContent!==caption)$('co-caption').textContent=caption;
$('co-window-note').textContent=[x,u,y,x+u].some(v=>Number.isFinite(v)&&Math.abs(v)>range)?'Part of this journey is outside the view. Choose Fit journey or increase the axis range.':'Both axes use equal units so the stick keeps its length while rotating.';
}

try{const s=JSON.parse(localStorage.getItem('composition-studio')||'null');if(s){if(['fg','gf'].includes(s.order))order=s.order;for(const k of ['f','g'])if(presets[s.chosen?.[k]]){chosen[k]=s.chosen[k];functions[k]=presets[chosen[k]][0];latex[k]=presets[chosen[k]][1];}else if(s.chosen?.[k]==='custom'&&s.latex?.[k]){try{functions[k]=FunctionInput.parse(s.latex[k]);chosen[k]='custom';latex[k]=s.latex[k];}catch{}}}}catch{}
for(const k of ['f','g']){$('co-'+k).value=chosen[k];$('co-'+k+'-math').value=latex[k];}$('co-order').value=order;new ResizeObserver(()=>draw()).observe($('co-graph'));detail();draw();
})();

