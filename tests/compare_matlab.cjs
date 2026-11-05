const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const G=require('../src/core/models.js'),R=JSON.parse(fs.readFileSync(path.join(__dirname,'reference/matlab.json'),'utf8'));
let comparisons=0,maxError=0;
function near(a,b,label,tol=1e-8){if(Array.isArray(a)){assert.ok(Array.isArray(b),label);assert.equal(a.length,b.length,label);a.forEach((v,i)=>near(v,b[i],label+'['+i+']',tol));return;}if(a===null||b===null){assert.equal(a,b,label);return;}assert.ok(Number.isFinite(a)&&Number.isFinite(b),label);const error=Math.abs(a-b);maxError=Math.max(error,maxError);assert.ok(error<=tol,`${label}: JS=${a}, MATLAB=${b}, err=${error}`);comparisons++;}
for(const q of R.solar){const s=G.solar(...q.input),d=G.daylight(q.input[0],q.input[1]);near([s.E,s.N,s.U,s.omega,s.alt],[q.position.E,q.position.N,q.position.U,q.position.omega,q.position.alpha],'solar');if(s.az===null||q.position.gamma===null)near(s.az,q.position.gamma,'az indeterminado');else near(((s.az-q.position.gamma+540)%360)-180,0,'az circular');near([d.hours,d.sunrise,d.sunset],[q.daylight.hours,q.daylight.sunrise,q.daylight.sunset],'daylight',1e-6);assert.equal(d.regime,q.daylight.regime);}
for(const q of R.orbit){const s=G.orbit(q.day);near(s.pos,q.state.position,'orbit.pos');near(s.axis,q.state.axis,'orbit.axis');near([s.distance,s.delta,s.speed,s.M,s.E],[q.state.distance,q.state.declination,q.state.speedRelative,q.state.meanAnomaly,q.state.eccentricAnomaly],'orbit');}
near(G.events().map(e=>e.time),R.events.time,'events');
for(const [name,type] of [['fixed','fixed'],['eo','eo']]){
  const q=R[name],l=G.layout(q.p,type);near([l.design.P,l.design.LCR],[q.P,q.LCR],name+'.design');
  q.hours.forEach((h,i)=>{const s=G.solar(q.p.lat,G.declination(G.dayOfYear(q.date)),h),m=G.shadows(l.faces,s.vector);near(m.map(f=>f.fraction),q.fraccion[i],name+'.fraction');near(m.map(f=>f.geometric),q.geometric[i],name+'.geometric');if(type==='fixed')near(m[0].incidence,q.incidence[i],name+'.incidence');else near([m[0].incidence,m[1].incidence],q.incidence[i],name+'.incidence');});
}
for(const [i,q] of R.tracking.entries()){
  const d=G.trackDesign(q.p);near([d.P,d.GCR,d.clearance],[q.design.P,q.design.GCR,q.design.clearance],'track.design');
  q.hours.forEach((h,k)=>{const s=G.solar(q.p.lat,G.declination(G.dayOfYear(q.date)),h).vector,m=G.trackState(q.p,s,d.P,q.bt);near(m.theta,q.theta[k],'track.theta');near(m.fraction,q.fraction[k],'track.fraction');near(m.incidence,q.incidence[k],'track.incidence');});
  near(G.freeHours(q.p,q.date,d.P,q.bt),q.freeHours,'track.freeHours');
}
near(G.unionArea([[[0,0],[2,0],[2,2],[0,2]],[[1,1],[3,1],[3,3],[1,3]]]),7,'polygon union');
near(G.civilToSolar('2026-03-29',0,2.5,'Europe/Madrid'),G.civilToSolar('2026-03-29',0,3.5,'Europe/Madrid'),'DST gap');
const sol=G.civilToSolar('2026-10-25',-5,2.5,'Europe/Madrid');near(G.solarToCivil('2026-10-25',-5,sol,'Europe/Madrid'),2.5,'DST repeat');
assert.throws(()=>G.trackDesign({lat:40,limit:60,L:2,W:10,n:5,h:.1,ns:0,eo:0}));
assert.throws(()=>G.fixedDesign({lat:65,alpha:0,beta:30,L:2}));
const report={status:'PASS',comparisons,maxAbsoluteError:maxError,tolerances:{general:1e-8,daylightHoursNearTangency:1e-6,azimuth:'diferencia circular; +180° y −180° equivalentes'},matlab:R.generatedBy,tests:['solar y régimen polar','órbita y eventos','filas y E–O: sombras e incidencia','seguimiento: diseño, BT y horas libres','unión poligonal','cambio horario civil','rechazo de contacto con terreno y ventana invernal inválida']};
fs.writeFileSync(path.join(__dirname,'reference/comparison.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
