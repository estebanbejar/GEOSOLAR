/* GEOSOLAR — modelos docentes. Grados, metros, horas solares. Sin dependencias. */
(function(root) {
  'use strict';
  const D=Math.PI/180, sin=x=>Math.sin(x*D), cos=x=>Math.cos(x*D), tan=x=>Math.tan(x*D);
  const clamp=(x,a=-1,b=1)=>Math.max(a,Math.min(b,x));
  const asin=x=>Math.asin(clamp(x))/D, atan2=(y,x)=>Math.atan2(y,x)/D;
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s), dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const norm=a=>Math.hypot(...a), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const range=(a,b,n)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
  const dayOfYear=date=>Math.floor((Date.parse(date+'T00:00:00Z')-Date.UTC(+date.slice(0,4),0,1))/86400000)+1;
  const declination=(day,model='layout')=>model==='basic'?23.45*sin(360*(284+day)/365):-23.44*cos(360*(day-355)/365.2422);
  function solar(lat,delta,time) {
    const omega=15*(time-12), E=-cos(delta)*sin(omega), N=cos(lat)*sin(delta)-sin(lat)*cos(delta)*cos(omega);
    const U=sin(lat)*sin(delta)+cos(lat)*cos(delta)*cos(omega), h=Math.hypot(E,N);
    return {vector:[E,N,U],E,N,U,omega,alt:atan2(U,h),az:h<1e-10?null:atan2(-E,-N),status:U>1e-10?'sobre el horizonte':U< -1e-10?'bajo el horizonte':'rasante',conventional:Math.abs(lat)===90};
  }
  function daylight(lat,delta) {
    const a=sin(lat)*sin(delta),b=cos(lat)*cos(delta),tol=1e-10;
    if(a-b>tol)return {hours:24,regime:'día polar',sunrise:null,sunset:null};
    if(a+b< -tol)return {hours:0,regime:'noche polar',sunrise:null,sunset:null};
    if(Math.abs(b)<=tol)return {hours:null,regime:'rasante permanente',sunrise:null,sunset:null};
    const w=Math.acos(clamp(-a/b))/D;
    return {hours:2*w/15,sunrise:12-w/15,sunset:12+w/15,regime:Math.abs(a-b)<=tol?'contacto tangencial a medianoche':Math.abs(a+b)<=tol?'contacto tangencial al mediodía':'ordinario'};
  }
  function orbit(day) {
    const e=.0167, M=2*Math.PI*(day-2)/365;
    const solve=m=>{let E=m;for(let i=0;i<8;i++)E-=(E-e*Math.sin(E)-m)/(1-e*Math.cos(E));return E;};
    const E=solve(M),pos=[Math.cos(E)-e,Math.sqrt(1-e*e)*Math.sin(E),0],distance=norm(pos);
    const mE=solve(2*Math.PI*(78-2)/365),beta=Math.atan2(Math.sqrt(1-e*e)*Math.sin(mE),Math.cos(mE)-e)-Math.PI/2;
    const axis=[sin(23.44)*Math.cos(beta),sin(23.44)*Math.sin(beta),cos(23.44)],sun=mul(pos,-1/distance);
    const g=2*Math.PI*day/365,et=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
    return {pos,distance,sun,axis,delta:asin(dot(axis,sun)),speed:Math.sqrt(2/distance-1),M,E,et,beta};
  }
  function events() {
    const beta=orbit(0).beta,e=.0167;
    const times=[Math.PI/2,Math.PI,3*Math.PI/2,0].map(v=>{
      const nu=beta+v,E=Math.atan2(Math.sqrt(1-e*e)*Math.sin(nu),e+Math.cos(nu));
      return ((2+(E-e*Math.sin(E))*365/(2*Math.PI))%365+365)%365;
    });
    return ['Marzo','Junio','Septiembre','Diciembre','Perihelio','Afelio'].map((name,i)=>({name,time:i<4?times[i]:i===4?2:184.5}));
  }
  const etLayout=day=>{const b=2*Math.PI*(day-81)/364;return 9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b);};
  const formatters=new Map();
  function offsetAt(ms,zone) {
    if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));
    const p=Object.fromEntries(formatters.get(zone).formatToParts(ms).filter(x=>x.type!=='literal').map(x=>[x.type,+x.value]));
    return (Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-Math.floor(ms/1000)*1000)/3600000;
  }
  function civilToSolar(date,lon,hour,zone) {
    const base=Date.parse(date+'T00:00:00Z'),wall=base+hour*3600000;
    const offsets=[...new Set([-36,0,36].map(h=>offsetAt(wall+h*3600000,zone)))];
    const candidates=offsets.map(o=>wall-o*3600000).filter(ms=>Math.abs(ms+offsetAt(ms,zone)*3600000-wall)<1000);
    // Ambiguous hour: second occurrence; nonexistent hour: move forward by DST gap.
    const utc=candidates.length?Math.max(...candidates):Math.max(...offsets.map(o=>wall-o*3600000));
    return (utc-base)/3600000+lon/15+etLayout(dayOfYear(date))/60;
  }
  function solarToCivil(date,lon,hour,zone) {
    const utc=Date.parse(date+'T00:00:00Z')+(hour-lon/15-etLayout(dayOfYear(date))/60)*3600000;
    return hour-lon/15-etLayout(dayOfYear(date))/60+offsetAt(utc,zone);
  }
  const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
  function clipRect(p,L,W) {
    const bounds=[[0,0,1],[0,L,-1],[1,-W/2,1],[1,W/2,-1]];
    for(const [axis,v,sign] of bounds){
      const q=[];
      for(let i=0;i<p.length;i++){
        const a=p[i],b=p[(i+1)%p.length],da=sign*(a[axis]-v),db=sign*(b[axis]-v);
        if(da>=-1e-10)q.push(a);
        if((da>=0)!==(db>=0)){const t=da/(da-db);q.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
      }p=q;if(p.length<3)return [];
    }return Math.abs(signedArea(p))<1e-12?[]:p;
  }
  // Exact polygon-union area by vertical sweep. Vertices and edge crossings
  // split slabs; union height is linear inside each slab.
  function unionArea(polys) {
    polys=polys.filter(p=>p.length>=3);if(!polys.length)return 0;
    if(polys.length===1)return Math.abs(signedArea(polys[0]));
    const edges=polys.flatMap(p=>p.map((a,i)=>[a,p[(i+1)%p.length]])), xs=polys.flatMap(p=>p.map(a=>a[0]));
    for(let i=0;i<edges.length;i++)for(let j=0;j<i;j++){
      const [a,b]=edges[i],[c,d]=edges[j],r=sub(b,a),s=sub(d,c),den=r[0]*s[1]-r[1]*s[0];
      if(Math.abs(den)<1e-12)continue;
      const q=sub(c,a),t=(q[0]*s[1]-q[1]*s[0])/den,u=(q[0]*r[1]-q[1]*r[0])/den;
      if(t>0&&t<1&&u>0&&u<1)xs.push(a[0]+t*r[0]);
    }
    xs.sort((a,b)=>a-b);let area=0;
    for(let i=1;i<xs.length;i++){
      const width=xs[i]-xs[i-1];if(width<1e-12)continue;const x=(xs[i]+xs[i-1])/2,intervals=[];
      for(const p of polys){const ys=[];
        for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length];if(x>Math.min(a[0],b[0])&&x<Math.max(a[0],b[0]))ys.push(a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]));}
        ys.sort((a,b)=>a-b);for(let k=1;k<ys.length;k+=2)intervals.push([ys[k-1],ys[k]]);
      }
      intervals.sort((a,b)=>a[0]-b[0]);let height=0,lo=null,hi=null;
      for(const [a,b] of intervals){if(lo===null){lo=a;hi=b;}else if(a<=hi){hi=Math.max(hi,b);}else{height+=hi-lo;lo=a;hi=b;}}
      if(lo!==null)height+=hi-lo;area+=width*height;
    }return area;
  }
  function face(origin,u,v,L,W,index,side=0) {
    const vertices=[[0,-W/2],[L,-W/2],[L,W/2],[0,W/2]].map(([x,y])=>add(origin,add(mul(u,x),mul(v,y))));
    return {origin,u,v,L,W,index,side,normal:cross(u,v),vertices};
  }
  function shadows(faces,s) {
    return faces.map((f,j)=>{
      const inc=dot(s,f.normal),incidence=s[2]>0?asin(inc):null,polys=[];
      if(s[2]<=0)return {fraction:null,geometric:null,incidence:null,polys:[],front:false};
      if(Math.abs(inc)>1e-10)for(let i=0;i<faces.length;i++){
        if(i===j)continue;const emitter=faces[i];
        const lambdas=emitter.vertices.map(v=>dot(sub(v,f.origin),f.normal)/inc);
        // Clip emitter to positive projection distance before projecting.
        let verts=emitter.vertices.map((v,k)=>({v,l:lambdas[k]})),clipped=[];
        for(let k=0;k<verts.length;k++){
          const a=verts[k],b=verts[(k+1)%verts.length];
          if(a.l>1e-9)clipped.push(a.v);
          if((a.l>1e-9)!==(b.l>1e-9)){const t=(1e-9-a.l)/(b.l-a.l);clipped.push(add(a.v,mul(sub(b.v,a.v),t)));}
        }
        const q=clipped.map(v=>{const t=dot(sub(v,f.origin),f.normal)/inc,at=sub(sub(v,mul(s,t)),f.origin);return [dot(at,f.u),dot(at,f.v)];});
        const poly=clipRect(q,f.L,f.W);if(poly.length)polys.push(poly);
      }
      const geometric=clamp(unionArea(polys)/(f.L*f.W),0,1),front=inc>1e-10;
      return {fraction:front?geometric:1,geometric,incidence,polys,front};
    });
  }
  function fixedDesign(p) {
    const delta=p.lat<0?23.44:-23.44;let K=0;
    for(const w of range(-22.5,22.5,1801)){
      const s=solar(p.lat,delta,12+w/15).vector;
      if(s[2]<=0)throw Error('La ventana de invierno incluye Sol bajo el horizonte. Reduzca la latitud.');
      const forward=[-sin(p.alpha),-cos(p.alpha),0];K=Math.max(K,Math.max(0,dot(s,forward)/s[2]));
    }
    const b=p.L*cos(p.beta),H=p.L*sin(p.beta),d=H*K,P=b+d;
    return {P,b,H,d,LCR:b/P};
  }
  function layout(p,type='fixed',design) {
    const faces=[];
    if(type==='fixed'){
      design=design||fixedDesign(p);const back=[sin(p.alpha),cos(p.alpha),0],along=[-cos(p.alpha),sin(p.alpha),0];
      const u=add(mul(back,cos(p.beta)),[0,0,sin(p.beta)]);
      for(let j=0;j<p.n;j++)faces.push(face(add(mul(back,j*design.P),[0,0,p.h]),u,along,p.L,p.W,j));
    }else{
      const width=2*p.L*cos(p.beta)+.05,P=width+p.d;
      design={P,b:p.L*cos(p.beta),H:p.L*sin(p.beta),d:p.d,LCR:2*p.L*cos(p.beta)/P,width};
      // Global x points West at alpha=0; y points South.
      const x=[-cos(p.alpha),sin(p.alpha),0],v=[-sin(p.alpha),-cos(p.alpha),0];
      for(let j=0;j<p.n;j++)for(let side=0;side<2;side++){
        const direction=side===0?1:-1,u=add(mul(x,direction*cos(p.beta)),[0,0,sin(p.beta)]);
        const f=face(add(mul(x,j*P+side*width),[0,0,p.h]),u,v,p.L,p.W,j,side);
        // The west face has the opposite longitudinal coordinate orientation.
        if(side===1)f.normal=mul(f.normal,-1);faces.push(f);
      }
    }
    return {faces,design};
  }
  function trackDesign(p,gcr=null) {
    let P=p.L;
    if(gcr!==null){if(!(gcr>0&&gcr<=1))throw Error('GCR debe estar entre 0 y 100 %.');P=p.L/gcr;}
    else for(const w of range(-22.5,22.5,1801)){
      const s=solar(p.lat,p.lat<0?23.44:-23.44,12+w/15).vector,c=[0,-sin(p.ns),cos(p.ns)],sc=dot(s,c);
      const den=sc-tan(p.eo)*cos(p.ns)*s[0];
      if(s[2]<=0||den<=1e-8)throw Error('El Sol queda bajo el horizonte o detrás del terreno en la ventana de invierno.');
      const theta=clamp(atan2(-s[0],sc),-p.limit,p.limit);
      P=Math.max(P,p.L*Math.abs(cos(theta)*sc-sin(theta)*s[0])/den);
    }
    const clearance=Math.min(...range(-p.limit,p.limit,1801).map(g=>p.h-p.L/2*Math.abs(sin(g)/cos(p.ns)-tan(p.eo)*cos(g))));
    if(clearance<=0)throw Error('Los módulos tocan el terreno en su recorrido. Aumente la altura del soporte.');
    return {P,GCR:p.L/P,clearance};
  }
  function trackState(p,s,P,bt) {
    const a=[0,cos(p.ns),sin(p.ns)],c=[0,-sin(p.ns),cos(p.ns)],sc=dot(s,c),ideal=atan2(-s[0],sc);
    let theta=ideal;
    if(bt){const r=Math.abs(P*(sc-tan(p.eo)*cos(p.ns)*s[0]))/(p.L*Math.hypot(s[0],sc));
      const correction=Math.acos(clamp(r,0,1))/D,slope=Math.atan(tan(p.eo)*cos(p.ns))/D;theta-=Math.sign(ideal-slope)*correction;}
    theta=clamp(theta,-p.limit,p.limit);if(s[2]<=0)theta=0;
    const t=[cos(theta),-sin(theta)*sin(p.ns),sin(theta)*cos(p.ns)],normal=[-sin(theta),-cos(theta)*sin(p.ns),cos(theta)*cos(p.ns)];
    const inc=dot(s,normal),dist=[P,0,P*tan(p.eo)],lambda=dot(normal,dist)/inc;
    const q=sub(dist,mul(s,lambda)),du=dot(q,t),dv=dot(q,a);
    let shade=Math.max(0,1-Math.abs(du)/p.L)*Math.max(0,1-Math.abs(dv)/p.W);if(!Number.isFinite(shade)||inc<=1e-10)shade=0;
    const terrain=s[2]-tan(p.eo)*s[0]-tan(p.ns)*s[1],front=inc>0&&terrain>0&&s[2]>0;
    const fraction=Array.from({length:p.n},(_,i)=>s[2]<=0?null:!front?1:(lambda>0?i===p.n-1:i===0)?0:shade);
    return {theta:s[2]>0?theta:null,ideal,t,normal,axis:a,incidence:s[2]>0?asin(inc):null,fraction,geometric:shade,front,terrain,lambda,shift:[du,dv],clearance:p.h-p.L/2*Math.abs(t[2]-tan(p.eo)*t[0]-tan(p.ns)*t[1])};
  }
  function trackFaces(p,state,P) {
    return Array.from({length:p.n},(_,i)=>face(sub([i*P,0,p.h+i*P*tan(p.eo)],mul(state.t,p.L/2)),state.t,state.axis,p.L,p.W,i));
  }
  function freeHours(p,date,P,bt) {
    let count=0,delta=declination(dayOfYear(date));
    for(let k=0;k<1440;k++){const m=trackState(p,solar(p.lat,delta,(k+.5)/60).vector,P,bt);if(m.front&&m.fraction.every(f=>f!==null&&f<=1e-8))count++;}
    return count/60;
  }
  root.GEOSOLAR={D,sin,cos,tan,clamp,asin,atan2,add,sub,mul,dot,norm,cross,range,dayOfYear,declination,solar,daylight,orbit,events,etLayout,offsetAt,civilToSolar,solarToCivil,clipRect,unionArea,face,shadows,fixedDesign,layout,trackDesign,trackState,trackFaces,freeHours};
  if(typeof module!=='undefined')module.exports=root.GEOSOLAR;
})(typeof globalThis!=='undefined'?globalThis:this);
