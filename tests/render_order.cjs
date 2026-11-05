const assert=require('node:assert/strict');
globalThis.GEOSOLAR=require('../src/core/models.js');require('../src/ui/graphics.js');
const G=GEOSOLAR,R=GEOSOLAR_GRAPHICS;
let count=0;
for(const type of ['fixed','eo','tracking'])for(let az=-180;az<=180;az+=10){
  const fills=[],operations=[],ctx=new Proxy({},{get(o,k){if(k==='fill')return ()=>{fills.push(o.fillStyle);operations.push(['fill',o.fillStyle]);};if(k==='stroke')return ()=>operations.push(['stroke',o.strokeStyle]);return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
  const canvas={width:600,height:350,getBoundingClientRect:()=>({width:600,height:350}),getContext:()=>ctx};
  const p={lat:40,alpha:0,beta:type==='eo'?20:45,L:2,W:10,n:5,h:type==='tracking'?1.5:.3,d:.5,ns:0,eo:0,limit:60},sun=G.solar(40,G.declination(355),10).vector;
  let faces;if(type==='tracking'){const d=G.trackDesign(p);faces=G.trackFaces(p,G.trackState(p,sun,d.P,false),d.P);}else faces=G.layout(p,type).faces;
  R.installation(canvas,p,faces,G.shadows(faces,sun),sun,{az,tracking:type==='tracking'});
  assert.equal(fills[0],'#f0f1e9',`${type} at ${az}: ground must be the background`);
  const isFace=c=>c==='#48798a'||c==='#293f57',first=fills.findIndex(isFace);
  assert.ok(first>0);assert.equal(fills.filter(isFace).length,faces.length);
  assert.ok(fills.lastIndexOf('rgba(96,107,88,.17)')<first,`${type} at ${az}: ground shadows must precede panels`);
  // Cell-line strokes belong to the most recently painted face; no later
  // face may be painted before those strokes and then have them drawn over it.
  const bodyOps=operations.filter(([kind,color])=>kind==='fill'&&isFace(color)||kind==='stroke'&&color==='rgba(220,240,239,.48)');
  let strokes=0;
  for(const [kind] of bodyOps){if(kind==='fill'){if(strokes)assert.equal(strokes,7);strokes=0;}else strokes++;}
  assert.equal(strokes,7);count++;
}
console.log(`PASS: terreno, sombras y grupos de mesas en ${count} combinaciones de layout/cámara.`);
