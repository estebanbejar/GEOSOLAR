const assert=require('node:assert/strict');
globalThis.GEOSOLAR=require('../src/core/models.js');require('../src/ui/graphics.js');
const G=GEOSOLAR,R=GEOSOLAR_GRAPHICS;
let checks=0;
const families=R.solarChartLines(40,10);assert.equal(families.daily.length,8);assert.equal(families.hourly.length,24);
for(const line of families.hourly)for(const p of line.data){assert.equal(p.time,line.time);assert.ok(p.declination>=-23.45&&p.declination<=23.45);}checks++;
const near=(a,b)=>{assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);checks++;};
// Cardinal orientation of the polar chart: N up, E right, S down, W left.
for(const [vector,expected] of [[[0,1,0],[100,10]],[[1,0,0],[190,100]],[[0,-1,0],[100,190]],[[-1,0,0],[10,100]]]){
  const p={E:vector[0],N:vector[1],alt:0};const at=R.polarPoint(p,100,100,90);near(at[0],expected[0]);near(at[1],expected[1]);
}
assert.deepEqual(R.polarPoint(G.solar(0,0,12),100,100,90),[100,100]);checks++;
for(const lat of [-90,-66.55,-40,0,23.45,40,66.55,90])for(const delta of [-23.45,0,23.45]){
  const data=R.sunPath(lat,delta),d=G.daylight(lat,delta);
  assert.ok(data.length>=721);assert.equal(data[0].time,0);assert.equal(data.at(-1).time,24);
  for(const time of [d.sunrise,d.sunset])if(time!==null){const at=data.find(p=>p.time===time);assert.ok(at);near(at.U,0);}
  const ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>{if(['moveTo','lineTo','arc'].includes(k))for(const v of args)assert.ok(Number.isFinite(v),`${lat}, ${delta}: ${k}`);};},set(o,k,v){o[k]=v;return true;}});
  const c=()=>({width:600,height:400,getBoundingClientRect:()=>({width:600,height:400}),getContext:()=>ctx});
  R.solarCards(c(),c(),{lat,delta,time:12});checks++;
}
// Cartesian chart: the southern noon path must cross the centre continuously.
for(const lat of [-34.6,40,0]){
  for(const az of [-180,-90,0,90,180]){
    const expected=lat<0?new Map([[-180,0],[-90,90],[0,-180],[90,-90],[180,0]]).get(az):az;
    near(R.solarChartAzimuth(az,lat),expected);
  }
  assert.equal(R.solarChartAzimuth(null,lat),null);checks++;
}
for(const lat of [-34.6,40])for(const delta of [-23.45,0,23.45]){
  const strokes=[],arcs=[],labels=[];let commands=[];
  const ctx={setTransform(){},clearRect(){},fillRect(){},save(){},restore(){},setLineDash(){},fill(){},
    beginPath(){commands=[];},moveTo(x,y){commands.push(['M',x,y]);},lineTo(x,y){commands.push(['L',x,y]);},
    stroke(){strokes.push({color:this.strokeStyle,width:this.lineWidth,commands:[...commands]});},
    arc(x,y,r){arcs.push({x,y,r});},fillText(text,x,y){labels.push({text,x,y});}};
  const canvas=()=>({width:600,height:400,getBoundingClientRect:()=>({width:600,height:400}),getContext:()=>ctx});
  const polarCtx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const polar={...canvas(),getContext:()=>polarCtx};
  R.solarCards(polar,canvas(),{lat,delta,time:12});
  const selected=strokes.find(s=>s.color==='#8c243c'&&s.width===2.1);
  assert.equal(selected.commands.filter(c=>c[0]==='M').length,1,'no split at solar noon');
  const marker=arcs.find(a=>a.r===5);near(marker.x,313);
  const noon=labels.find(l=>l.text==='12 h');near(noon.x,313);
  const morning=selected.commands[0],evening=selected.commands.at(-1);
  assert.ok(lat<0?morning[1]>313&&evening[1]<313:morning[1]<313&&evening[1]>313);
  assert.ok(labels.some(l=>l.text.includes(lat<0?'centrado en el Norte':'desde el Sur')));checks++;
}
console.log(`PASS: ${checks} comprobaciones de cartas solares, incluidos hemisferios, continuidad al mediodía, marcador, cenit y polos.`);
