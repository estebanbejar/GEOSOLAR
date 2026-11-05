const assert=require('node:assert/strict');
globalThis.GEOSOLAR=require('../src/core/models.js');require('../src/ui/graphics.js');
const G=GEOSOLAR,R=GEOSOLAR_GRAPHICS;
function draw(p,faces,shade,s,tracking=false){
  const fills=[],ctx=new Proxy({},{get(o,k){if(k==='fill')return ()=>fills.push(o.fillStyle);return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
  const c={width:600,height:350,getBoundingClientRect:()=>({width:600,height:350}),getContext:()=>ctx};
  R.installation(c,p,faces,shade,s,{az:-40,tracking});return fills;
}
let cases=0,redCases=0,posteriorCases=0;
for(const type of ['fixed','eo','tracking'])for(const day of [172,355])for(const time of [0,7,9,12,15,17,23]){
  const p={lat:40,alpha:type==='fixed'?-90:0,beta:45,L:2,W:10,n:5,h:type==='tracking'?1.5:.3,d:.1,ns:0,eo:0,limit:60},sun=G.solar(40,G.declination(day),time).vector;
  let faces,blocked=false;
  if(type==='tracking'){const d=G.trackDesign(p,.75),state=G.trackState(p,sun,d.P,false);faces=G.trackFaces(p,state,d.P);blocked=sun[2]>0&&state.terrain<=0;}else faces=G.layout(p,type).faces;
  const shade=G.shadows(faces,sun).map(m=>({...m,terrainBlocked:blocked})),fills=draw(p,faces,shade,sun,type==='tracking');
  assert.equal(fills.filter(c=>c==='#9ba5aa').length,sun[2]<=0||blocked?faces.length:0);
  const posterior=sun[2]>0&&!blocked?shade.filter(m=>!m.front).length:0;
  assert.equal(fills.filter(c=>c==='#293f57').length,posterior);posteriorCases+=posterior>0?1:0;
  const reds=shade.reduce((n,m)=>n+(sun[2]>0&&!blocked&&m.front?m.polys.length:0),0);
  assert.equal(fills.filter(c=>c==='rgba(183,49,65,.7)').length,reds);redCases+=reds>0?1:0;
  if(sun[2]<=0)assert.ok(shade.every(m=>m.fraction===null));
  for(const m of shade)if(sun[2]>0&&!m.front)assert.equal(m.fraction,1);
  cases++;
}
assert.ok(redCases>0&&posteriorCases>0);
// Terrain occlusion is independent of posterior incidence and uses grey.
const p={L:2,W:10,n:1,h:2,ns:0,eo:0},f=G.face([0,0,1],[1,0,0],[0,1,0],2,10,0);
const blocked=draw(p,[f],[{front:true,terrainBlocked:true,polys:[[[0,-1],[1,-1],[1,1],[0,1]]]}],[.8,0,.6],true);
assert.ok(blocked.includes('#9ba5aa'));assert.ok(!blocked.includes('#293f57'));assert.ok(!blocked.includes('rgba(183,49,65,.7)'));cases++;
// Figure 4 solar direction uses grey exclusively below the horizon.
for(const time of [0,12]){
  const s={lat:40,delta:-23.45,time,camera:-35},sun=G.solar(s.lat,s.delta,time),scene=R.basicScenes(s)[3];
  const line=scene.items.find(i=>i.kind==='path'&&i.width===2&&i.points.length===2&&i.points[0].every(v=>v===0));
  assert.equal(line.color,time===0?'#92999d':'#8c243c');assert.equal(sun.U<0,time===0);cases++;
}
console.log(`PASS: ${cases} casos de iluminación/color; ${redCases} con sombras frontales y ${posteriorCases} con incidencia posterior.`);
