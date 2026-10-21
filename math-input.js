/* Formatted input powered by MathLive; numeric evaluation by Compute Engine. */
(()=>{
const ce=globalThis.ComputeEngine?new globalThis.ComputeEngine.ComputeEngine():null;
if(globalThis.MathfieldElement){MathfieldElement.fontsDirectory='vendor/fonts';MathfieldElement.soundsDirectory=null;}
const presetLatex={sine:'\\sin(x)',line:'x+1',wave:'2+\\sin(x)',cos:'\\cos(x)',square:'\\frac{x^2}{2}',x:'x',half:'0.5',two:'2',negative:'-1',zero:'0'};
function parse(latex){
 if(!ce)throw Error('The math editor could not load. Presets still work.');
 if(!latex.trim())throw Error('Enter an expression using x.');
 if(latex.length>500)throw Error('Please keep the expression under 500 characters.');
 let expr;try{expr=ce.parse(latex);}catch{throw Error('Check the expression and finish any fractions or brackets.');}
 if(!expr?.isValid||expr.errors?.length)throw Error('Finish the expression, including any fractions or brackets.');
 if(expr.unknowns.some(s=>s!=='x'))throw Error('Use x as the variable. Constants such as π and e are welcome.');
 if(['Equal','List','Tuple','Sequence','Greater','Less','GreaterEqual','LessEqual'].includes(expr.operator))throw Error('Enter just the expression, such as x² + 1, without f(x) =.');
 const cache=new Map();
 const evaluate=x=>{if(cache.has(x))return cache.get(x);let n=NaN;try{const v=expr.subs({x}).N();n=v.im===0&&typeof v.re==='number'&&Number.isFinite(v.re)&&Math.abs(v.re)<=1e6?v.re:NaN;}catch{}cache.set(x,n);return n;};
 if(!Array.from({length:41},(_,i)=>evaluate(-3+i*6/40)).some(Number.isFinite))throw Error('No real, finite values between −3 and 3. Try another expression.');
 return evaluate;
}
globalThis.FunctionInput={parse,presetLatex};
})();
