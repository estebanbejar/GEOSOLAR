/* Runtime smoke checks in a DOM/Canvas stand-in. This is NOT browser or visual QA. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=[],ids=new Map(),events={},queue=[];let clock=0;
const context2d=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>{},set:(o,k,v)=>(o[k]=v,true)});
class Element{
  constructor(tag,attrs={},owner='document'){
    this.tagName=tag.toUpperCase();this.attrs=attrs;this.owner=owner;this.dataset={};this.listeners={};this.classList={add(){},remove(){}};
    for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;
    this.id=attrs.id;this.type=attrs.type;this.value=attrs.value||'';this.hidden=Object.hasOwn(attrs,'hidden');this.disabled=Object.hasOwn(attrs,'disabled');this.validity={valid:true};this._html='';this.textContent='';this.width=300;this.height=150;
    elements.push(this);if(this.id)ids.set(this.id,this);
  }
  set innerHTML(html){
    for(let i=elements.length-1;i>=0;i--)if(elements[i].owner===this.id){if(elements[i].id&&ids.get(elements[i].id)===elements[i])ids.delete(elements[i].id);elements.splice(i,1);}
    this._html=html;parse(html,this.id);
  }
  get innerHTML(){return this._html;}
  get innerText(){return this.textContent||this._html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');}
  setAttribute(k,v){this.attrs[k]=v;}
  removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){this.listeners[k]=fn;}
  getBoundingClientRect(){return {width:500,height:280,left:0,top:0};}
  getContext(){return context2d;}
  closest(){return this;}
  append(){}remove(){}click(){this.onclick?.({target:this});}
  insertAdjacentHTML(_,html){this._html+=html;}
}
function parse(html,owner){
  const pattern=/<([a-z][\w-]*)\b([^>]*)>/gi;let m;
  while((m=pattern.exec(html))){const attrs={};let a;const re=/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g;while((a=re.exec(m[2])))attrs[a[1]]=a[2]??a[3]??'';new Element(m[1],attrs,owner);}
}
const root=path.resolve(__dirname,'..');parse(fs.readFileSync(path.join(root,'index.html'),'utf8'),'document');
const document={getElementById:id=>ids.get(id)||null,activeElement:null,hidden:false,body:{append(){}},createElement:tag=>new Element(tag),addEventListener:(k,f)=>events[k]=f,
  querySelectorAll(selector){
    if(selector==='#controls [data-key]')return elements.filter(e=>e.owner==='controls'&&Object.hasOwn(e.dataset,'key'));
    if(selector==='#visuals canvas')return elements.filter(e=>e.owner==='visuals'&&e.tagName==='CANVAS');
    if(selector==='canvas')return elements.filter(e=>e.tagName==='CANVAS');
    const data=selector.match(/^\[data-([\w-]+)\]$/);if(data)return elements.filter(e=>Object.hasOwn(e.dataset,data[1]));
    throw Error('Unexpected selector: '+selector);
  }
};
const downloads=[];
const sandbox={console,document,Intl,Date,Math,JSON,Number,Array,Object,Map,Set,String,Error,structuredClone,URL:{createObjectURL:b=>(downloads.push(b),'blob:test'),revokeObjectURL(){}},Blob,setTimeout:()=>1,clearTimeout(){},performance:{now:()=>clock},requestAnimationFrame:f=>(queue.push(f),queue.length),cancelAnimationFrame(){}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.devicePixelRatio=1;sandbox.addEventListener=()=>{};vm.createContext(sandbox);
for(const file of ['src/core/models.js','src/ui/graphics.js','src/ui/app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const flush=()=>{const callbacks=queue.splice(0);clock+=16;callbacks.forEach(f=>f(clock));};
const click=dataset=>{events.click({target:{dataset,closest(){return this;}}});flush();};
const fill=(key,value,kind='input')=>{const el=ids.get('field-'+key);assert.ok(el,'missing '+key);el.value=String(value);document.activeElement=el;ids.get('controls').listeners[kind]({target:el});flush();document.activeElement=null;};
const noError=label=>assert.equal(ids.get('error').hidden,true,label+': '+ids.get('error').textContent);
let checks=0;
noError('orbit initial');assert.equal(ids.get('title').textContent,'Órbita Tierra–Sol');assert.match(ids.get('metrics').innerHTML,/20 de marzo de 2026/);assert.match(ids.get('orbit-curves').innerHTML,/ET &gt; 0/);checks++;
assert.match(ids.get('figure-time').textContent,/20 de marzo de 2026.*00:00/);checks++;
fill('day',79.5);assert.match(ids.get('figure-time').textContent,/20 de marzo de 2026.*12:00/);fill('day',79);checks++;
click({lab:'basic'});
assert.ok(ids.get('solar-polar'));assert.ok(ids.get('solar-cartesian'));checks++;
assert.equal(ids.get('path-day-slider'),undefined);assert.equal(ids.get('field-mode').value,'date');
fill('day',172);assert.equal(String(ids.get('field-day').value),'172');assert.equal(ids.get('field-delta').disabled,true);assert.match(ids.get('metrics').innerHTML,/23,45/);checks++;
click({preset:'-23.45'});fill('day',80);assert.equal(ids.get('field-mode').value,'manual');assert.match(ids.get('metrics').innerHTML,/−23,45|-23,45/);checks++;
ids.get('reset').onclick();flush();
noError('basic initial');assert.match(ids.get('metrics').innerHTML,/26,55/);checks++;
fill('lat',0);click({preset:'0'});noError('basic equator');assert.match(ids.get('metrics').innerHTML,/90,00/);checks++;
fill('mode','date','change');assert.equal(ids.get('field-delta').disabled,true);checks++;
fill('lat',90);noError('polar');assert.match(ids.get('metrics').innerHTML,/polar|rasante/);checks++;
for(const lab of ['orbit','fixed','eo','tracking']){click({lab});noError(lab);assert.ok(ids.get('table-wrap').innerHTML.includes('<table>'));if(lab!=='orbit'){assert.match(ids.get('table-wrap').innerHTML,/angulo_normal_1_grados/);assert.match(ids.get('table-wrap').innerHTML,/angulo_plano_1_grados/);assert.match(ids.get('chart-legend').innerHTML,/Con la normal/);assert.match(ids.get('chart-legend').innerHTML,/Con el plano/);}checks++;}
for(const lab of ['orbit','basic','fixed','eo','tracking']){
  click({lab});assert.match(ids.get('figure-time').textContent,/2026.*\d{2}:\d{2}/);
  assert.equal((ids.get('metrics').innerHTML.match(/class="metric(?:\s|")/g)||[]).length,7);
  assert.match(ids.get('metrics').innerHTML,/>Fecha</);assert.match(ids.get('metrics').innerHTML,/>Hora</);
  assert.equal(ids.get('shadow-key').hidden,['orbit','basic'].includes(lab));checks++;
}
for(const lab of ['fixed','eo','tracking']){
  click({lab});assert.equal(ids.get('equinox-dates').hidden,true);
  events.click({target:ids.get('equinox-toggle')});flush();assert.equal(ids.get('equinox-dates').hidden,false);
  click({date:'2026-03-20'});assert.match(ids.get('metrics').innerHTML,/20\/03/);assert.equal(ids.get('equinox-dates').hidden,true);
  click({date:'2026-09-22'});assert.match(ids.get('metrics').innerHTML,/22\/09/);noError('equinox '+lab);checks++;
}
click({lab:'tracking'});
for(const lab of ['fixed','eo','tracking']){
  click({lab});const html=ids.get('table-wrap').innerHTML,cols=[...html.matchAll(/<th scope="col">([^<]+)<\/th>/g)].map(m=>m[1]);
  const normal=cols.indexOf('angulo_normal_1_grados'),plane=cols.indexOf('angulo_plano_1_grados');assert.ok(normal>0&&plane>0);
  for(const row of html.matchAll(/<tr>(.*?)<\/tr>/g)){const cells=[...row[1].matchAll(/<td>([^<]*)<\/td>/g)].map(m=>m[1]);if(!cells.length||cells[normal]==='—')continue;const read=s=>Number(s.replace(/\./g,'').replace(',','.'));assert.ok(Math.abs(read(cells[normal])+read(cells[plane])-90)<.021);}
  checks++;
}
assert.equal(ids.get('monthly-section').hidden,false);assert.ok(ids.get('monthly-no'));assert.ok(ids.get('monthly-yes'));checks++;
fill('bt','yes','change');noError('backtracking');checks++;
fill('slopeUnits','percent','change');fill('ns',10);noError('slope percentage');checks++;
fill('spacing','manual','change');assert.equal(ids.get('field-gcr').disabled,false);fill('gcr',70);noError('manual GCR');checks++;
click({view:'monthly'});noError('monthly');assert.ok(ids.get('monthly-no'));assert.ok(ids.get('monthly-yes'));checks++;
fill('h',.01);assert.equal(ids.get('error').hidden,false);assert.match(ids.get('error').textContent,/terreno/);checks++;
ids.get('reset').onclick();flush();noError('reset');checks++;
click({lab:'eo'});fill('beta',90);noError('vertical EO');checks++;
click({lab:'fixed'});fill('reference','civil','change');noError('civil');fill('reference','solar','change');noError('solar');checks++;
ids.get('play').onclick();flush();assert.match(ids.get('play').textContent,/Pausar/);ids.get('play').onclick();assert.match(ids.get('play').textContent,/Reproducir/);checks++;
for(const width of [380,800,1400]){for(const c of document.querySelectorAll('canvas'))c.getBoundingClientRect=()=>({width,height:280,left:0,top:0});click({lab:'basic'});noError('canvas width '+width);checks++;}
(async()=>{
  click({lab:'fixed'});ids.get('reset').onclick();flush();
  fill('lat',-40);assert.equal(Number(ids.get('camera').value),150);checks++;
  fill('lat',-34.6);assert.equal(Number(ids.get('camera').value),150);checks++;
  ids.get('camera').value='110';ids.get('visuals').listeners.input({target:ids.get('camera')});flush();
  fill('beta',35);click({date:'2026-06-21'});fill('lat',-35);assert.equal(Number(ids.get('camera').value),110);checks++;
  fill('lat',40);assert.equal(Number(ids.get('camera').value),-70);fill('lat',-40);assert.equal(Number(ids.get('camera').value),110);checks++;
  const old={format:'GEOSOLAR',version:1,lab:'fixed',model:'matlab-compat-v1',parameters:{lat:-34.6,alpha:0,beta:30,L:2,W:10,n:3,h:.3,date:'2026-06-21',time:12,camera:37}};
  await ids.get('scenario-file').onchange({target:{files:[{size:500,text:async()=>JSON.stringify(old)}],value:'old.json'}});flush();noError('old southern scenario');
  assert.equal(Number(ids.get('field-alpha').value),0);assert.equal(Number(ids.get('camera').value),37);
  assert.match(ids.get('controls').innerHTML,/>Acimut<input/);assert.match(ids.get('fixed-orientation-help').innerHTML||ids.get('controls').innerHTML,/180°/);
  assert.match(ids.get('toast').textContent,/corrige el antiguo frente Sur/);assert.match(ids.get('metrics').innerHTML,/-180,0/);checks++;
  const winterPitch=ids.get('metrics').innerHTML.match(/Paso del patrón[\s\S]*?<strong>([^<]+)/)[1];
  click({date:'2026-12-21'});assert.equal(ids.get('metrics').innerHTML.match(/Paso del patrón[\s\S]*?<strong>([^<]+)/)[1],winterPitch);checks++;
  fill('lat',-40);fill('alpha',20);assert.equal(Number(ids.get('camera').value),37);checks++;
  ids.get('save-scenario').onclick();const saved=JSON.parse(await downloads.at(-1).text());assert.equal(saved.version,1);assert.equal(saved.parameters.alpha,20);assert.equal(saved.model,'fixed-equator-v2');checks++;
  ids.get('export-csv').onclick();const csv=await downloads.at(-1).text();assert.match(csv,/acimut_frontal_desde_sur_grados/);assert.match(csv,/# Orientación: alpha = desvío respecto al ecuador/);assert.match(csv,/;20;-160/);checks++;
  assert.match(ids.get('table-wrap').innerHTML,/desvio_ecuador_grados/);assert.match(ids.get('table-wrap').innerHTML,/acimut_frontal_desde_sur_grados/);checks++;
  delete old.parameters.camera;await ids.get('scenario-file').onchange({target:{files:[{size:500,text:async()=>JSON.stringify(old)}],value:'without-camera.json'}});flush();assert.equal(Number(ids.get('camera').value),150);checks++;
  for(const lab of ['eo','tracking']){click({lab});fill('lat',-40);assert.equal(Number(ids.get('camera').value),-30);ids.get('save-scenario').onclick();assert.equal(JSON.parse(await downloads.at(-1).text()).model,'matlab-compat-v1');assert.doesNotMatch(ids.get('table-wrap').innerHTML,/desvio_ecuador_grados/);checks++;}
  console.log(`PASS: ${checks} runtime UI smoke checks with DOM/Canvas stand-ins; actual browser rendering not verified.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
