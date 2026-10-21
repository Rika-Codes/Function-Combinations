(()=>{
const $=id=>document.getElementById(id);let data=null,cache=[],signature='',rangeX=5,rangeY=5,auto=true,width=760,height=440,view='sticks';
const fmt=n=>!Number.isFinite(n)?'undefined':Math.abs(n)<.0001?'0':Math.abs(n)>=1e4?n.toExponential(1):String(+n.toFixed(2));
function save(){try{localStorage.setItem('combination-view',JSON.stringify({rangeX,rangeY,auto}));}catch{}}
function tab(which){view=which;for(const key of ['sticks','plane']){$('combo-'+key+'-tab').setAttribute('aria-selected',String(key===view));$('combo-'+key+'-panel').hidden=key!==view;}if(view==='plane')draw();}
for(const key of ['sticks','plane']){$('combo-'+key+'-tab').onclick=()=>tab(key);$('combo-'+key+'-tab').onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const next=key==='sticks'?'plane':'sticks';tab(next);$('combo-'+next+'-tab').focus();}};}
function sync(){$('cp-range-x').value=rangeX;$('cp-range-y').value=rangeY;$('cp-auto').checked=auto;}
for(const axis of ['x','y'])$('cp-range-'+axis).onchange=()=>{const n=Number($('cp-range-'+axis).value),max=axis==='x'?1000:1e6;if(!Number.isFinite(n)||n<.5||n>max){sync();return;}if(axis==='x'){rangeX=n;signature='';}else{rangeY=n;auto=false;}sync();draw();save();};
$('cp-auto').onchange=()=>{auto=$('cp-auto').checked;draw();sync();save();};$('cp-fit').onclick=()=>{auto=true;signature='';draw();sync();save();};
$('cp-preview').onchange=draw;
function draw(){if(!data||view!=='plane')return;
const key=JSON.stringify([data.state.red,data.state.blue,data.state.custom,data.state.op,rangeX]);
if(key!==signature){cache=Array.from({length:401},(_,i)=>data.read(-rangeX+i*rangeX/200));signature=key;}
if(auto){const vals=cache.flatMap(d=>[d.a,d.b,d.r]).filter(n=>Number.isFinite(n)&&Math.abs(n)<=1e6);rangeY=Math.max(1,Math.min(1e6,Math.ceil(Math.max(0,...vals.map(Math.abs))*1.15)));$('cp-range-y').value=rangeY;}
const W=width,H=height,L=W<500?44:56,R=W-22,T=25,B=H-35,cx=(L+R)/2,cy=(T+B)/2,X=x=>cx+x*(R-L)/(2*rangeX),Y=y=>cy-y*(B-T)/(2*rangeY);
const line=(x,y,a,b,c,stroke=1,extra='')=>`<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" stroke="${c}" stroke-width="${stroke}" ${extra}/>`;
const text=(x,y,t,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
const step=(span,count)=>{const raw=span/count,power=10**Math.floor(Math.log10(raw)),part=raw/power;return(part<=1?1:part<=2?2:part<=5?5:10)*power;};
let out=`<defs><clipPath id="cp-clip"><rect x="${L}" y="${T}" width="${R-L}" height="${B-T}"/></clipPath></defs>`;
const tx=step(rangeX*2,W<500?5:9),ty=step(rangeY*2,7);
for(let t=Math.ceil(-rangeX/tx)*tx;t<=rangeX+tx*.001;t+=tx){out+=line(X(t),T,X(t),B,'#eff0ed');if(Math.abs(t)>tx*.01)out+=text(X(t),cy+16,fmt(t));}
for(let t=Math.ceil(-rangeY/ty)*ty;t<=rangeY+ty*.001;t+=ty){out+=line(L,Y(t),R,Y(t),'#eff0ed');if(Math.abs(t)>ty*.01)out+=text(cx-8,Y(t)+4,fmt(t),'end');}
out+=line(L,cy,R,cy,'#9ba2a8',1.3)+line(cx,T,cx,B,'#9ba2a8',1.3)+text(cx-8,cy+16,'0','end')+text(R-5,cy-9,'x')+text(cx+12,T+12,'y');
out+=text(R-15,T+15,'I')+text(L+15,T+15,'II')+text(L+15,B-12,'III')+text(R-15,B-12,'IV');out+='<g clip-path="url(#cp-clip)">';
for(const [series,color,dash]of [['a','#df625b',''],['b','#528bc9','stroke-dasharray="6 3"'],['r','#8c65c5','']]){let path='',pen=false,prev=null;const samples=series==='r'&&!$('cp-preview').checked?data.samples:cache;for(let i=0;i<samples.length;i++){const d=samples[i],n=d[series],pole=series==='r'&&data.state.op==='divide'&&prev&&prev.b*d.b<=0,hidden=series==='r'&&!$('cp-preview').checked&&!data.completed.has(i);if(hidden||!Number.isFinite(n)||Math.abs(n)>rangeY*2){pen=false;prev=d;continue;}if(pole||prev&&Math.abs(n-prev[series])>rangeY)pen=false;path+=(pen?'L':'M')+X(d.x)+','+Y(n);pen=true;prev=d;}out+=`<path data-plane-series="${series}" d="${path}" fill="none" stroke="${color}" stroke-width="${series==='r'?2.6:1.5}" opacity="${series==='r'?$('cp-preview').checked?.3:1:.2}" ${dash}/>`;}
const seg=(x,y,a,b,c,stroke=3,opacity=1,extra='')=>line(x,y,a,b,c,stroke,`opacity="${opacity}" stroke-linecap="round" ${extra}`);
const overlay=(x,r,amount=1)=>Number.isFinite(r)?`<rect data-result-overlay x="${x-Math.min(10,(R-L)*.15/(2*rangeX)*.43)}" y="${Math.min(cy,Y(r))}" width="${Math.min(20,(R-L)*.15/(2*rangeX)*.86)}" height="${Math.max(1,Math.abs(Y(r)-cy))}" fill="#8c65c5" opacity="${.28*amount}"/>`:'';
out+=`<g data-plane-sticks>`+data.renderSticks({data:data.samples,X,Y,z:cy,L,R,T,B,W,low:-rangeY,high:rangeY*1,seg,overlay,text}).markup+'</g>';
const selected=data.selected,px=X(selected.x);if(Math.abs(selected.x)<=rangeX)out+=line(px,T,px,B,'#9b8ead',1,'stroke-dasharray="3 5"');
out+='</g>';$('combo-plane').innerHTML=`<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${out}</svg>`;
$('cp-note').textContent=cache.some(d=>[d.a,d.b,d.r].some(n=>Number.isFinite(n)&&Math.abs(n)>rangeY))?'Some heights extend beyond this window. Increase the vertical range to inspect them.':'Sticks combine at matching inputs. Purple stays behind as you sweep; faint curves show the originals. Animated inputs span −3 to 3.';
}
try{const s=JSON.parse(localStorage.getItem('combination-view')||'null');if(s){if(s.rangeX>=.5&&s.rangeX<=1000)rangeX=s.rangeX;if(s.rangeY>=.5&&s.rangeY<=1e6)rangeY=s.rangeY;auto=s.auto!==false;}}catch{}
sync();new ResizeObserver(entries=>{if(entries[0].contentRect.width){width=entries[0].contentRect.width;height=entries[0].contentRect.height;draw();}}).observe($('combo-plane'));
window.CombinationPlane={update(next){data=next;if(view==='plane')draw();}};
})();
