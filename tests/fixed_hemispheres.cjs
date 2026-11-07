const assert=require('node:assert/strict'),G=require('../src/core/models.js'),baseline=require('./reference/pre_fixed_equator_v071.json');
globalThis.GEOSOLAR=G;require('../src/ui/graphics.js');const R=GEOSOLAR_GRAPHICS;
let checks=0,configs=0,maxShadow=0,maxSymmetry=0;
const near=(a,b,t=1e-10)=>{assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);checks++;};
function same(actual,expected){
  if(typeof expected==='number'){near(actual,expected);return;}
  if(Array.isArray(expected)){assert.equal(actual.length,expected.length);expected.forEach((v,i)=>same(actual[i],v));return;}
  if(expected&&typeof expected==='object'){for(const k of Object.keys(expected))same(actual[k],expected[k]);return;}
  assert.equal(actual,expected);checks++;
}
// Frozen outputs of the current pre-change commit: all northern fixed results,
// and EO/tracking geometry, design, day/night, incidence and shadows unchanged.
for(const q of baseline.cases){
  const l=G.layout(q.p,q.type);same(l,q.layout);
  for(const s of q.samples)same(G.shadows(l.faces,G.solar(q.p.lat,-23.44,s.time).vector),s.shade);
}
for(const q of baseline.tracking){same(G.trackDesign(q.p),q.design);for(const s of q.samples){const v=G.solar(q.p.lat,q.p.lat<0?23.44:-23.44,s.time).vector,m=G.trackState(q.p,v,q.design.P,q.bt);same(m,s.state);same(G.trackFaces(q.p,m,q.design.P),s.faces);}}
for(const lat of [-1,-23.45,-34.6,-55,-60])for(const alpha of [-90,-45,-20,0,20,45,90])for(const beta of [0,10,30,45])for(const n of [1,3]){
  const p={lat,alpha,beta,L:2,W:10,n,h:.3},orientation=G.fixedOrientation(p),l=G.layout(p),mirror=G.fixedDesign({...p,lat:-lat,alpha:-alpha});
  maxSymmetry=Math.max(maxSymmetry,Math.abs(l.design.P-mirror.P));near(l.design.P,mirror.P);
  near(l.design.P,l.design.b+l.design.d);assert.ok(l.design.d>=0);if(beta===0)near(l.design.d,0);
  for(const f of l.faces){
    // These exact vertices are consumed by the renderer, not a separate
    // normal computed from the input angles just for a test.
    const u=G.sub(f.vertices[1],f.vertices[0]),v=G.sub(f.vertices[3],f.vertices[0]),cross=G.cross(u,v),normal=G.mul(cross,1/G.norm(cross));
    same(normal,f.normal);near(G.dot(normal,orientation.forward),G.sin(beta));
    const local=f.vertices.map(x=>orientation.toLocal(x));
    near(Math.min(...local.map(x=>x[0])),f.index*l.design.P);near(Math.max(...local.map(x=>x[0])),f.index*l.design.P+l.design.b);
    near(G.norm(v),p.W);if(alpha===0){near(normal[0],0);near(normal[1],G.sin(beta));near(normal[2],G.cos(beta));near(u[0],0);near(v[1],0);}
  }
  for(let j=1;j<l.faces.length;j++){
    const intervals=l.faces.slice(j-1,j+1).map(f=>f.vertices.map(v=>orientation.toLocal(v)[0]));
    assert.ok(Math.min(...intervals[1])-Math.max(...intervals[0])>=-1e-10,'physical overlap');checks++;
  }
  // Off-grid samples every 13 seconds in addition to the design's 1801
  // points, with both endpoints included. Fractional-area tolerance 1e-8
  // covers clipping epsilons, not a physical minimum gap.
  for(const t of [...G.range(10.5,13.5,832),12]){
    const sun=G.solar(lat,23.44,t).vector,local=orientation.toLocal(sun);near(local[2],sun[2]);
    near(local[0],-G.dot(sun,orientation.forward));
    for(const [j,q] of G.shadows(l.faces,sun).entries()){maxShadow=Math.max(maxShadow,q.geometric);assert.ok(q.geometric<=1e-8,'winter shadow');assert.equal(q.front,G.dot(sun,l.faces[j].normal)>1e-10);checks+=2;}
  }
  const night=G.shadows(l.faces,G.solar(lat,23.44,0).vector);assert.ok(night.every(x=>x.incidence===null&&x.fraction===null&&!x.front));checks++;
  const noon=G.shadows(l.faces,G.solar(lat,23.44,12).vector);assert.ok(noon.every(x=>x.front));checks++;
  for(const time of [7,9,12,15,17])for(const q of G.shadows(l.faces,G.solar(lat,23.44,time).vector))if(q.incidence!==null){const theta=90-q.incidence,eta=q.incidence;near(theta+eta,90);}
  configs++;
}
for(const lat of [0,40]){const p={lat,alpha:0,beta:30,L:2,W:10,n:1,h:.3},f=G.layout(p).faces[0];same(f.normal,[0,-G.sin(30),G.cos(30)]);}
for(const lat of [-40,40]){
  const p={lat,alpha:0,beta:45,L:2,W:10,n:3,h:.3},l=G.layout(p),sun=G.solar(lat,lat<0?-23.44:23.44,6).vector;
  // Explicit back-side illumination, independent of calendar or camera.
  const back=G.mul(l.faces[0].normal,-1);back[2]=.1;const s=G.mul(back,1/G.norm(back));
  for(const q of G.shadows(l.faces,s)){assert.equal(q.front,false);assert.equal(q.fraction,1);assert.ok(q.incidence<0);near((90-q.incidence)+q.incidence,90);}
  const labels=[],polygons=[];let points=[];
  const ctx=new Proxy({},{get(o,k){if(k in o)return o[k];if(k==='beginPath')return ()=>points=[];if(k==='moveTo'||k==='lineTo')return (x,y)=>points.push([x,y]);if(k==='fill')return ()=>{if(o.fillStyle==='#48798a')polygons.push([...points]);};if(k==='fillText')return (t,x,y)=>labels.push({t,x,y});return ()=>{};},set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:600,height:350,getBoundingClientRect:()=>({width:600,height:350}),getContext:()=>ctx},noon=G.solar(lat,lat<0?23.44:-23.44,12).vector;
  const project=R.installation(canvas,p,l.faces,G.shadows(l.faces,noon),noon,{fixed:true,top:true,az:0});
  for(const f of l.faces){const expected=f.vertices.map(project);assert.ok(polygons.some(poly=>poly.every((v,i)=>Math.hypot(v[0]-expected[i][0],v[1]-expected[i][1])<1e-8)),'drawn vertices must match tested vertices');checks++;}
  assert.equal(polygons.length,3);assert.ok(labels.some(x=>x.t==='Frente: '+(lat<0?'Norte':'Sur')));
  const north=labels.find(x=>x.t==='N'),east=labels.find(x=>x.t==='E'),south=labels.find(x=>x.t==='S'),west=labels.find(x=>x.t==='O');assert.ok(north.y<south.y&&east.x>west.x);checks+=3;
}
console.log(JSON.stringify({status:'PASS',configurations:configs,checks,maxWinterShadowFraction:maxShadow,maxMirroredPitchErrorMetres:maxSymmetry,shadowTolerance:1e-8,baseline:baseline.commit},null,2));
