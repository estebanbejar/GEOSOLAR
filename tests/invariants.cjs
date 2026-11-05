const assert=require('node:assert/strict'),G=require('../src/core/models.js');
let count=0;const near=(a,b,t=1e-8)=>{assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);count++;};
// Deterministic grid verifies properties independently of the MATLAB fixtures.
for(const lat of [-90,-66.55,-40,0,23.45,40,66.55,90])for(const delta of [-23.45,0,23.45])for(const time of [0,6,9,12,15,18,24]){
  const s=G.solar(lat,delta,time);near(G.norm(s.vector),1);const mirror=G.solar(lat,delta,24-time);near(s.E,-mirror.E);near(s.U,mirror.U);
}
for(const beta of [0,15,45,89.99,90])for(const alpha of [-90,0,20,90])for(const time of [7,9,12,15,17]){
  const p={lat:40,alpha,beta,L:2,W:10,n:3,h:.3,d:.5},layout=G.layout(p,'eo'),sun=G.solar(40,G.declination(172),time).vector,m=G.shadows(layout.faces,sun);
  for(const f of m){assert.ok(f.fraction===null||(f.fraction>=0&&f.fraction<=1));assert.ok(f.geometric===null||(f.geometric>=0&&f.geometric<=1));count+=2;}
}
// Tracker analytic shadows must agree with independent polygon projection.
for(const slopes of [[0,0],[8,-6],[-10,12]])for(const bt of [false,true])for(const day of [80,172,355])for(const time of [7,9,10.5,12,13.5,15,17]){
  const p={lat:40,L:2,W:10,n:4,h:2,ns:slopes[0],eo:slopes[1],limit:60},d=G.trackDesign(p,.5),s=G.solar(p.lat,G.declination(day),time).vector,m=G.trackState(p,s,d.P,bt);
  if(!m.front)continue;const polygon=G.shadows(G.trackFaces(p,m,d.P),s);polygon.forEach((q,i)=>near(q.fraction,m.fraction[i],1e-7));
}
for(const zone of ['Europe/Madrid','Atlantic/Canary','America/New_York','Asia/Kolkata'])for(const date of ['2026-01-21','2026-06-21'])for(const civil of [0,8,12,23.5]){
  const solar=G.civilToSolar(date,-5,civil,zone);near(G.solarToCivil(date,-5,solar,zone),civil,1e-6);
}
near(G.unionArea([[[0,0],[1,0],[1,1],[0,1]],[[0,0],[1,0],[1,1],[0,1]]]),1);
near(G.unionArea([[[0,0],[3,0],[3,3],[0,3]],[[1,1],[2,1],[2,2],[1,2]]]),9);
console.log('PASS: '+count+' invariantes y comparaciones geométricas independientes.');
