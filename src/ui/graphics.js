(function(root){
  'use strict';const G=root.GEOSOLAR;
  const palette=['#8c243c','#376b94','#3d8068','#b07c2b','#78649b','#468b99','#ad6748','#6a806b','#b25275','#516886','#8a8d3d','#7a6657'];
  function surface(canvas){
    const box=canvas.getBoundingClientRect(),w=Math.max(180,box.width),h=Math.max(100,box.height),dpr=Math.min(2,root.devicePixelRatio||1);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.font='10px system-ui';return {ctx,w,h,dpr};
  }
  const path=(points,color='#688a7b',width=1,dash=[])=>({kind:'path',points,color,width,dash});
  const polygon=(points,fill,stroke='#5f7774')=>({kind:'polygon',points,fill,color:stroke,width:.7});
  const dot=(point,color='#bd8729',radius=4)=>({kind:'dot',points:[point],color,radius});
  const text=(point,label,color='#53635c')=>({kind:'text',points:[point],label,color});
  function scene(canvas,items,options={}){
    const {ctx,w,h}=surface(canvas),az=(options.az??-30)*G.D,el=(options.el??26)*G.D;
    const raw=p=>[p[0]*Math.cos(az)-p[1]*Math.sin(az),-(p[0]*Math.sin(az)+p[1]*Math.cos(az))*Math.sin(el)-p[2]*Math.cos(el)];
    const depth=item=>item.points.reduce((sum,p)=>sum-(p[0]*Math.sin(az)+p[1]*Math.cos(az))*Math.cos(el)+p[2]*Math.sin(el),0)/item.points.length;
    const bounds=(options.bounds||items.filter(i=>i.kind!=='text').flatMap(i=>i.points)).filter(p=>p.every(Number.isFinite));
    if(!bounds.length)return;
    const projected=bounds.map(raw),xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
    let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const scale=Math.min((w-60)/Math.max(.1,xmax-xmin),(h-44)/Math.max(.1,ymax-ymin));
    const project=p=>{const a=raw(p);return [(a[0]-(xmin+xmax)/2)*scale+w/2,(a[1]-(ymin+ymax)/2)*scale+h/2];};
    // Terrain is a background layer. Each table and its cell lines/shadows
    // form one depth-sorted object, so overlays cannot float through other rows.
    const depthItem=i=>['polygon','group'].includes(i.kind)||i.layer!==undefined;
    const shapes=items.filter(depthItem).sort((a,b)=>(a.layer??0)-(b.layer??0)||depth(a)-depth(b));
    const paths=items.filter(i=>i.kind==='path'&&!depthItem(i)),marks=items.filter(i=>!depthItem(i)&&!['path'].includes(i.kind));
    const ordered=[...shapes,...paths,...marks].flatMap(item=>item.kind==='group'?item.children:[item]);
    for(const item of ordered){
      ctx.save();ctx.strokeStyle=item.color;ctx.lineWidth=item.width||1;ctx.setLineDash(item.dash||[]);ctx.globalAlpha=item.alpha??1;
      if(item.kind==='text'){
        const [x,y]=project(item.points[0]);ctx.fillStyle=item.color;ctx.font=(item.fontSize||10)+'px system-ui';ctx.textAlign='center';
        const lines=String(item.label).split('\n');lines.forEach((line,i)=>ctx.fillText(line,x+(item.dx||0),y+(item.dy||0)+(i-(lines.length-1)/2)*(item.lineHeight||14)));
      }else if(item.kind==='dot'){
        const [x,y]=project(item.points[0]);ctx.fillStyle=item.color;ctx.beginPath();ctx.arc(x,y,item.radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      }else{
        ctx.beginPath();let active=false;
        for(const p of item.points){if(!p||!p.every(Number.isFinite)){active=false;continue;}const [x,y]=project(p);if(!active){ctx.moveTo(x,y);active=true;}else ctx.lineTo(x,y);}
        if(item.kind==='polygon'){ctx.closePath();ctx.fillStyle=item.fill;ctx.fill();}ctx.stroke();
      }ctx.restore();
    }
    if(options.compass!==false){
      ctx.save();ctx.translate(w-34,h-30);ctx.font='9px system-ui';ctx.textAlign='center';
      for(const [label,p] of [['N',[0,1,0]],['E',[1,0,0]],['S',[0,-1,0]],['O',[-1,0,0]]]){
        const v=raw(p),n=Math.hypot(...v),x=v[0]/n*18,y=v[1]/n*18;
        ctx.strokeStyle='#b7c3bc';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x*.7,y*.7);ctx.stroke();ctx.fillStyle=label==='S'?'#8c243c':'#6f7c76';ctx.fillText(label,x,y+3);
      }ctx.restore();
    }
    return project;
  }
  function chart(canvas,series,options={}){
    const {ctx,w,h}=surface(canvas),left=43,right=options.rightLabel?39:15,top=20,bottom=27;
    const xmin=options.xmin??0,xmax=options.xmax??24,ymin=options.ymin??0,ymax=options.ymax??100;
    const px=x=>left+(x-xmin)/(xmax-xmin)*(w-left-right),py=(y,axis)=>h-bottom-(y-(axis==='right'?(options.yminRight??-90):ymin))/((axis==='right'?(options.ymaxRight??90):ymax)-(axis==='right'?(options.yminRight??-90):ymin))*(h-top-bottom);
    ctx.font='9px system-ui';ctx.textAlign='right';
    for(let k=0;k<=4;k++){const y=ymin+(ymax-ymin)*k/4,at=py(y);ctx.strokeStyle='#e8ece7';ctx.beginPath();ctx.moveTo(left,at);ctx.lineTo(w-right,at);ctx.stroke();ctx.fillStyle='#77857d';ctx.fillText(Number(y.toFixed(1)),left-7,at+3);}
    ctx.textAlign='center';for(const x of options.xticks||[0,6,12,18,24]){if(x<xmin||x>xmax)continue;ctx.fillStyle='#77857d';ctx.fillText(options.formatX?options.formatX(x):String(x),px(x),h-9);}
    ctx.fillStyle='#687970';ctx.textAlign='left';ctx.fillText(options.label||'',left,10);
    if(options.rightLabel){ctx.textAlign='right';ctx.fillText(options.rightLabel,w-right,10);for(const y of options.yticksRight||[-90,0,90])ctx.fillText(y+'°',w-1,py(y,'right')+3);}
    for(const [i,s] of series.entries()){
      ctx.save();ctx.strokeStyle=s.color||palette[i%palette.length];ctx.lineWidth=s.width||1.5;ctx.setLineDash(s.dash||[]);ctx.beginPath();let active=false;
      for(const [x,y] of s.points){if(y===null||!Number.isFinite(y)){active=false;continue;}const X=px(x),Y=py(y,s.axis);if(!active){ctx.moveTo(X,Y);active=true;}else ctx.lineTo(X,Y);}ctx.stroke();ctx.restore();
    }
    if(options.marker!==undefined){const x=px(options.marker);ctx.strokeStyle='#aab3ac';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,h-bottom);ctx.stroke();ctx.setLineDash([]);}
    if(options.markerValue!==undefined){ctx.fillStyle=options.markerColor||'#8c243c';ctx.beginPath();ctx.arc(px(options.marker),py(options.markerValue),4,0,2*Math.PI);ctx.fill();}
    if(options.onSelect){canvas.onclick=e=>{const x=e.clientX-canvas.getBoundingClientRect().left;options.onSelect(G.clamp(xmin+(x-left)/(w-left-right)*(xmax-xmin),xmin,xmax));};canvas.title='Cliquear para seleccionar el instante';}else{canvas.onclick=null;canvas.removeAttribute('title');}
  }
  function horizon(items,r=1){
    const circle=G.range(0,360,121).map(a=>[r*G.cos(a),r*G.sin(a),0]);
    items.push(polygon(circle,'#eef3ed','#becdc2'),path([[-r,0,0],[r,0,0]],'#c5d1c7',.7),path([[0,-r,0],[0,r,0]],'#c5d1c7',.7));
    items.push(text([r*1.12,0,0],'E'),text([-r*1.12,0,0],'O'),text([0,r*1.12,0],'N'),text([0,-r*1.12,0],'S','#8c243c'));
    items.push(path([[0,0,0],[0,0,r*1.12]],'#9baaa0',1,[3,3]),text([0,0,r*1.2],'Cenit'));
  }
  function basicScenes(state){
    const delta=state.delta,solar=G.solar(state.lat,delta,state.time),items=[],r=.48;
    // Globe, latitude circles and local meridian at noon.
    for(const lat of [-66.55,-23.45,0,23.45,66.55])items.push(path(G.range(0,360,97).map(a=>[r*G.cos(lat)*G.cos(a),r*G.cos(lat)*G.sin(a),r*G.sin(lat)]),'#c3cec8',.8));
    for(const lng of G.range(0,150,6))items.push(path(G.range(0,360,121).map(a=>[r*G.cos(a)*G.cos(lng),r*G.cos(a)*G.sin(lng),r*G.sin(a)]),'#d8e0d8',.7));
    const o=[r*G.cos(state.lat),0,r*G.sin(state.lat)],up=[G.cos(state.lat),0,G.sin(state.lat)],north=[-G.sin(state.lat),0,G.cos(state.lat)];
    const plane=[[-.55,-.4],[.55,-.4],[.55,.4],[-.55,.4]].map(([n,e])=>G.add(o,G.add(G.mul(north,n),[0,e,0])));
    items.push(polygon(plane,'rgba(211,228,215,.38)','#a3b8a7'),path([[0,0,-.7],[0,0,.8]],'#7d9385',1.2));
    items.push(path([o,G.add(o,G.mul(up,.65))],'#7a8f82',1.5),dot(o,'#8c243c',3),text(G.add(o,G.mul(up,.74)),'Vertical'));
    for(const [d,c] of [[23.45,'#b58028'],[0,'#3d8068'],[-23.45,'#376b94'],[delta,'#8c243c']]){
      const ray=[G.cos(d),0,G.sin(d)];items.push(path([o,G.add(o,G.mul(ray,.85))],c,d===delta?2:1,d===delta?[]:[4,3]));
    }
    const globe={items,options:{az:20,el:17,compass:false,bounds:[[-.85,-.55,-.7],[1.6,.55,1.1]]}};
    const sky=[];horizon(sky);
    for(const [d,c] of [[23.45,'#b58028'],[0,'#3d8068'],[-23.45,'#376b94'],[delta,'#8c243c']]){
      let day=[],night=[];
      for(const t of G.range(0,24,289)){const s=G.solar(state.lat,d,t).vector;day.push(s[2]>=0?s:[NaN,NaN,NaN]);night.push(s[2]<0?s:[NaN,NaN,NaN]);}
      sky.push(path(day,c,d===delta?2:1.1),path(night,c,.8,[2,4]));
    }
    sky.push(path([[0,0,0],solar.vector],'#8c243c',1.5),dot(solar.vector,'#be8a2e',5));
    const hour=[];hour.push(path(G.range(0,360,121).map(a=>[G.cos(a),G.sin(a),0]),'#aebfb2',1));
    for(const t of [0,6,12,18]){const a=-15*(t-12);hour.push(path([[0,0,0],[G.cos(a),G.sin(a),0]],'#d1d9d1',1),text([1.15*G.cos(a),1.15*G.sin(a),0],t+' h'));}
    const tip=[G.cos(delta)*G.cos(solar.omega),-G.cos(delta)*G.sin(solar.omega),0];hour.push(path([[0,0,0],tip],'#8c243c',2),dot(tip,'#8c243c',4),path(G.range(0,-solar.omega,50).map(a=>[.35*G.cos(a),.35*G.sin(a),0]),'#8c243c',1.5));
    const directionColor=solar.U< -1e-10?'#92999d':'#8c243c';
    const local=[];horizon(local);local.push(path([[0,0,0],solar.vector],directionColor,2),dot(solar.vector,solar.U< -1e-10?'#92999d':'#bd8729',5));
    const foot=[solar.E,solar.N,0];local.push(path([solar.vector,foot,[0,0,0]],'#9aaba0',1,[4,4]));
    const hn=Math.hypot(solar.E,solar.N);
    if(hn>1e-10){const a=G.range(0,solar.alt,60).map(v=>[.5*solar.E/hn*G.cos(v),.5*solar.N/hn*G.cos(v),.5*G.sin(v)]);local.push(path(a,'#8c243c',1.6));}
    if(solar.az!==null)local.push(path(G.range(0,solar.az,60).map(a=>[-.32*G.sin(a),-.32*G.cos(a),0]),'#376b94',1.6));
    return [globe,{items:sky,options:{az:state.camera,el:22,bounds:[[-1.3,-1.3,-1],[1.3,1.3,1.3]],compass:false}},{items:hour,options:{az:0,el:90,bounds:[[-1.35,-1.35,0],[1.35,1.35,0]],compass:false}},{items:local,options:{az:-35,el:25,bounds:[[-1.25,-1.25,-1],[1.25,1.25,1.3]],compass:false}}];
  }
  function installation(canvas,p,faces,shade,s,options={}){
    const items=[],points=faces.flatMap(f=>f.vertices),xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),margin=p.L*.8;
    const terrain=(x,y)=>options.tracking?x*G.tan(p.eo)+y*G.tan(p.ns):0;
    const ground=[[xmin-margin,ymin-margin],[xmax+margin,ymin-margin],[xmax+margin,ymax+margin],[xmin-margin,ymax+margin]].map(([x,y])=>[x,y,terrain(x,y)]);
    items.push({...polygon(ground,'#f0f1e9','#d5ddd0'),layer:-2});
    const boundPoints=[...ground,...points];
    for(const f of faces){
      if(s[2]<=.015)continue;
      const den=s[2]-(options.tracking?G.tan(p.eo)*s[0]+G.tan(p.ns)*s[1]:0);
      if(den<=1e-8)continue;
      const shadow=f.vertices.map(v=>{const h=v[2]-terrain(v[0],v[1]);return G.sub(v,G.mul(s,h/den));});
      const flat=shadow.map(v=>[v[0]-xmin+margin,v[1]-(ymin+ymax)/2]);
      const clipped=G.clipRect(flat,xmax-xmin+2*margin,ymax-ymin+2*margin).map(([x,y])=>{x+=xmin-margin;y+=(ymin+ymax)/2;return [x,y,terrain(x,y)+.005];});
      if(clipped.length)items.push({...polygon(clipped,'rgba(96,107,88,.17)','transparent'),layer:-1});
    }
    for(const [i,f] of faces.entries()){
      const m=shade[i],front=m.front!==false,night=s[2]<=0,blocked=m.terrainBlocked===true;
      const bodyColor=night||blocked?'#9ba5aa':front?'#48798a':'#293f57';
      const children=[polygon(f.vertices,bodyColor,'#294e5c')];
      const divisions=Math.max(2,Math.min(12,Math.round(p.W/1.2)));
      for(let j=1;j<divisions;j++){
        const y=-p.W/2+p.W*j/divisions;children.push(path([G.add(f.origin,G.mul(f.v,y)),G.add(G.add(f.origin,G.mul(f.u,p.L)),G.mul(f.v,y))],'rgba(220,240,239,.48)',.6));
      }
      children.push(path([G.add(f.origin,G.mul(f.u,p.L/2)),G.add(G.add(f.origin,G.mul(f.u,p.L/2)),G.mul(f.v,p.W/2))],'rgba(220,240,239,.4)',.5));
      for(const poly of (!night&&!blocked&&front?m.polys||[]:[])){const pts=poly.map(([u,v])=>G.add(G.add(f.origin,G.add(G.mul(f.u,u),G.mul(f.v,v))),G.mul(f.normal,.008)));children.push(polygon(pts,'rgba(183,49,65,.7)','#b94653'));}
      items.push({kind:'group',points:f.vertices,children});
    }
    // Ground grid and sun vector are local cues, not extra geometric inputs.
    const center=[(xmin+xmax)/2,(ymin+ymax)/2,Math.max(...points.map(v=>v[2]))+p.L*.5],len=Math.max(p.L*1.6,Math.min(p.W,4));
    if(s[2]>0){const tip=G.add(center,G.mul(s,len));items.push(path([center,tip],'#c39735',2),dot(tip,'#d4a238',6));boundPoints.push(tip);}
    scene(canvas,items,{az:options.az??-30,el:options.top?90:28,bounds:boundPoints,compass:true});
  }
  function orbital(canvas,day,top=false){
    const o=G.orbit(day),items=[],orbitPath=G.range(0,365,361).map(t=>G.orbit(t).pos);
    items.push({...polygon(orbitPath,'rgba(210,222,232,.18)','transparent'),layer:-2},{...path(orbitPath,'#7d8f9f',1.4),layer:-1});
    // Show direction of travel, as in the MATLAB scene.
    for(const t of [35,125,220,310]){
      const a=G.orbit(t).pos,b=G.orbit(t+5).pos,v=G.sub(b,a),tip=G.add(a,G.mul(v,1.4));
      const back=G.mul(v,-.25),side=[-v[1]*.15,v[0]*.15,0];
      items.push(path([a,tip],'#7d8f9f',1.2),path([G.add(tip,G.add(back,side)),tip,G.add(tip,G.sub(back,side))],'#7d8f9f',1.2));
    }
    const colors=['#338354','#bc7422','#338354','#376b94'];
    const names=['Equinoccio de marzo','Solsticio de junio','Equinoccio de septiembre','Solsticio de diciembre'];
    for(const [i,e] of G.events().slice(0,4).entries()){
      const at=G.orbit(e.time),p=at.pos,date=new Date(Date.UTC(2026,0,1)+e.time*86400000).toISOString().slice(5,10).split('-').reverse().join('/');
      if(G.norm(G.sub(p,o.pos))>.11)items.push(dot(p,colors[i],4));
      items.push(path([G.sub(p,G.mul(at.axis,.11)),G.add(p,G.mul(at.axis,.11))],colors[i],1.4));
      const label=G.mul(p,1.27);label[2]=.03;
      items.push({...text(label,names[i]+'\n≈ '+date+' · δ = '+(Math.abs(at.delta)<1e-9?'0,00':at.delta.toFixed(2).replace('.',','))+'°',colors[i]),fontSize:12,lineHeight:15,dy:top&&Math.abs(p[0])>.5?-20:0});
    }
    items.push({...path([[0,0,0],[.9833,0,0]],'#b3bbb8',1,[2,4]),layer:-1},{...path([[0,0,0],[-1.0167,0,0]],'#b3bbb8',1,[2,4]),layer:-1});
    items.push(text([.57,-.16,0],'Perihelio ≈ 0,983 UA\n≈ 03/01','#596560'),text([-.58,.18,0],'Afelio ≈ 1,017 UA\n≈ 04/07','#596560'));
    items.push({...path([[0,0,0],o.pos],'#c49839',1.2,[6,5]),layer:-1});
    function sphere(center,r,pole,light,sun=false){
      const ref=Math.abs(pole[2])<.99?[0,0,1]:[1,0,0],x=G.mul(G.cross(ref,pole),1/G.norm(G.cross(ref,pole))),y=G.cross(pole,x);
      const unit=(la,lo)=>G.add(G.mul(pole,G.sin(la)),G.add(G.mul(x,G.cos(la)*G.cos(lo)),G.mul(y,G.cos(la)*G.sin(lo))));
      for(let lat=-90;lat<90;lat+=10)for(let lon=0;lon<360;lon+=12){
        const n=unit(lat+5,lon+6),lit=Math.max(0,G.dot(n,light)),v=[[lat,lon],[lat+10,lon],[lat+10,lon+12],[lat,lon+12]].map(([a,b])=>G.add(center,G.mul(unit(a,b),r)));
        const color=sun?`rgb(${Math.round(225+lit*30)},${Math.round(145+lit*39)},${Math.round(24+lit*25)})`:`rgb(${Math.round(25+lit*55)},${Math.round(44+lit*100)},${Math.round(60+lit*125)})`;
        items.push(polygon(v,color,'transparent'));
      }
    }
    sphere([0,0,0],.10,[0,0,1],[-.3,-.4,.866],true);sphere(o.pos,.07,o.axis,o.sun);
    items.push(text([0,-.22,0],'Sol','#976316'),path([G.sub(o.pos,G.mul(o.axis,.13)),G.add(o.pos,G.mul(o.axis,.13))],'#324e60',2));
    items.push({...text(G.add(o.pos,[.1,.02,.12]),'Tierra','#2d526d'),fontSize:11});
    scene(canvas,items,{az:0,el:top?90:32,compass:false,bounds:[[-1.65,-1.48,-.20],[1.65,1.48,.30]]});
  }
  function sunPath(lat,delta){
    const daylight=G.daylight(lat,delta),hours=G.range(0,24,721);
    for(const t of [daylight.sunrise,daylight.sunset])if(t!==null)hours.push(t);
    return [...new Set(hours)].sort((a,b)=>a-b).map(time=>({time,...G.solar(lat,delta,time)}));
  }
  function polarPoint(s,cx,cy,r){
    const radial=r*(90-Math.max(0,s.alt))/90,h=Math.hypot(s.E,s.N);
    return h<1e-10?[cx,cy]:[cx+radial*s.E/h,cy-radial*s.N/h];
  }
  function solarChartLines(lat,delta){
    const intermediate=[-20,-11.5,11.5,20].map(d=>({delta:d,color:'#a3ada6',width:.8,dash:[],data:sunPath(lat,d)}));
    const references=[[23.45,'#b58028'],[0,'#3d8068'],[-23.45,'#376b94']].map(([d,color])=>({delta:d,color,width:1.2,dash:[5,3],data:sunPath(lat,d)}));
    const selected={delta,color:'#8c243c',width:2.1,dash:[],data:sunPath(lat,delta)};
    const hourly=Array.from({length:24},(_,time)=>({time,color:'#b0b9b2',width:.7,dash:[2,4],data:G.range(-23.45,23.45,121).map(d=>({time,declination:d,...G.solar(lat,d,time)}))}));
    return {daily:[...intermediate,...references,selected],hourly};
  }
  // Display coordinates only: retain the model's South-based azimuth elsewhere.
  function solarChartAzimuth(az,lat){
    if(az===null)return null;
    return lat<0?((az+360)%360+360)%360-180:az;
  }
  function solarCards(polar,cartesian,state){
    const lines=solarChartLines(state.lat,state.delta),series=[...lines.hourly,...lines.daily];
    const current=G.solar(state.lat,state.delta,state.time),a=surface(polar),b=surface(cartesian);
    const cx=a.w/2,cy=a.h/2,r=Math.min(a.w-65,a.h-65)/2;
    const pc=a.ctx;pc.font='9px system-ui';pc.textAlign='center';
    for(const alt of [0,15,30,45,60,75]){
      const rad=r*(90-alt)/90;pc.strokeStyle=alt===0?'#aebdb5':'#dce5df';pc.setLineDash(alt===0?[]:[2,3]);pc.lineWidth=alt===0?1.2:.7;pc.beginPath();pc.arc(cx,cy,rad,0,2*Math.PI);pc.stroke();
      pc.fillStyle='#748279';pc.fillText(alt+'°',cx+rad*.707,cy-rad*.707-2);
    }
    pc.setLineDash([2,3]);pc.strokeStyle='#dce5df';
    for(let az=0;az<360;az+=15){pc.beginPath();pc.moveTo(cx,cy);pc.lineTo(cx+r*G.sin(az),cy-r*G.cos(az));pc.stroke();}
    pc.setLineDash([]);pc.fillStyle='#65756c';pc.fillText('90°',cx,cy+3);
    for(const [name,az] of [['N',0],['E',90],['S',180],['O',270]]){pc.fillStyle=name==='S'?'#8c243c':'#40574b';pc.font='bold 11px system-ui';pc.fillText(name,cx+(r+17)*G.sin(az),cy-(r+17)*G.cos(az)+4);}
    const cc=b.ctx,left=43,right=17,top=24,bottom=39,chartAz=p=>solarChartAzimuth(p.az,state.lat);
    const px=az=>left+(az+180)/360*(b.w-left-right),py=alt=>b.h-bottom-alt/90*(b.h-top-bottom);
    cc.font='9px system-ui';
    for(let alt=0;alt<=90;alt+=15){const y=py(alt);cc.strokeStyle='#e0e7e2';cc.beginPath();cc.moveTo(left,y);cc.lineTo(b.w-right,y);cc.stroke();cc.fillStyle='#6b7c71';cc.textAlign='right';cc.fillText(alt+'°',left-7,y+3);}
    for(let az=-180;az<=180;az+=30){const x=px(az);cc.strokeStyle='#e0e7e2';cc.beginPath();cc.moveTo(x,top);cc.lineTo(x,b.h-bottom);cc.stroke();cc.fillStyle='#6b7c71';cc.textAlign='center';cc.fillText(String(az)+'°',x,b.h-bottom+14);}
    cc.textAlign='left';cc.fillText('Altura solar',left,11);cc.textAlign='center';cc.fillText(state.lat<0?'Acimut centrado en el Norte · O −90° / N 0° / E +90°':'Acimut desde el Sur · E −90° / S 0° / O +90°',b.w/2,b.h-5);
    for(const s of series){
      for(const [ctx,project,cart] of [[pc,p=>polarPoint(p,cx,cy,r),false],[cc,p=>[px(chartAz(p)),py(p.alt)],true]]){
        ctx.save();ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.setLineDash(s.dash);ctx.beginPath();let active=false,previous=null;
        for(const p of s.data){
          if(p.U< -1e-10||(cart&&p.az===null)){active=false;previous=null;continue;}
          const at=project(p),az=chartAz(p);if(cart&&previous!==null&&Math.abs(az-previous)>180)active=false;
          if(active)ctx.lineTo(...at);else ctx.moveTo(...at);active=true;previous=az;
        }ctx.stroke();ctx.restore();
      }
    }
    // Hour labels use solar time, independent of the date/manual declination mode.
    for(let time=0;time<24;time+=2){const p=G.solar(state.lat,state.delta,time);if(p.U<=1e-10)continue;
      const [x,y]=polarPoint(p,cx,cy,r),rad=Math.hypot(x-cx,y-cy),dx=rad>1e-6?(x-cx)/rad:1,dy=rad>1e-6?(y-cy)/rad:0;
      for(const [ctx,X,Y] of [[pc,x,y],...(p.az===null?[]:[[cc,px(chartAz(p)),py(p.alt)]])]){
        ctx.fillStyle='#8c243c';ctx.beginPath();ctx.arc(X,Y,2,0,2*Math.PI);ctx.fill();ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(time+' h',X+(ctx===pc?dx*11:0),Y+(ctx===pc?dy*11:-8));
      }
    }
    if(current.U>=-1e-10){
      const pts=[[pc,...polarPoint(current,cx,cy,r)],...(current.az===null?[]:[[cc,px(chartAz(current)),py(current.alt)]])];
      for(const [ctx,x,y] of pts){ctx.fillStyle='#d3a134';ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,5,0,2*Math.PI);ctx.fill();ctx.stroke();}
    }
  }
  root.GEOSOLAR_GRAPHICS={palette,surface,path,polygon,dot,text,scene,chart,basicScenes,installation,orbital,sunPath,polarPoint,solarChartLines,solarChartAzimuth,solarCards};
})(globalThis);
