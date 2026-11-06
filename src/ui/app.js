(function(){
  'use strict';
  const G=GEOSOLAR,R=GEOSOLAR_GRAPHICS,$=id=>document.getElementById(id);
  const num=(v,d=2)=>v===null||!Number.isFinite(v)?'—':v.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hh=h=>{if(h===null||!Number.isFinite(h))return '—';let mins=Math.round(h*60);const day=Math.floor(mins/1440);mins=((mins%1440)+1440)%1440;return String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0')+(day?' ('+(day>0?'+':'')+day+' d)':'');};
  const dateFromDay=n=>new Date(Date.UTC(2026,0,1)+Math.floor(n-1)*86400000).toISOString().slice(0,10);
  const prettyDate=date=>new Date(date+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  function figureTimestamp(){
    const s=states[lab];
    if(lab==='orbit'){
      const instant=new Date(Date.UTC(2026,0,1)+(s.day-1)*86400000);
      return instant.toLocaleString('es-ES',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'UTC'})+' · reloj del año didáctico (sin rotación diaria)';
    }
    const date=lab==='basic'?dateFromDay(s.day):s.date;
    const hour=s.time===24?'24:00':hh(s.time);
    return prettyDate(date)+' · '+hour+' · '+(s.reference==='civil'?'hora civil · '+s.zone:'hora solar')+(lab==='basic'&&s.mode==='manual'?' · declinación manual, independiente de la fecha':'');
  }
  const defaults={
    basic:{lat:40,day:355,time:12,mode:'date',delta:-23.45,camera:-35,speed:1.5,animation:'daily'},
    orbit:{day:79,time:12,speed:15,repeat:'yes',camera:'oblique'},
    fixed:{lat:40,lon:-5,date:'2026-12-21',time:12,reference:'solar',zone:'Europe/Madrid',alpha:0,beta:30,L:2,W:10,n:5,h:.3,camera:-30,speed:1.5},
    eo:{lat:40,lon:-5,date:'2026-12-21',time:12,reference:'solar',zone:'Europe/Madrid',alpha:0,beta:15,L:2,W:10,n:4,h:.3,d:.5,camera:-30,speed:1.5},
    tracking:{lat:40,lon:-5,date:'2026-12-21',time:12,reference:'solar',zone:'Europe/Madrid',L:2,W:10,n:5,h:1.5,ns:0,eo:0,slopeUnits:'degrees',limit:60,bt:'no',spacing:'winter',gcr:50,camera:-30,speed:1.5}
  };
  const meta={
    basic:{title:'Geometría solar',section:'FUNDAMENTOS',subtitle:'De la latitud a la posición del Sol: cuatro vistas de una misma geometría.'},
    orbit:{title:'Órbita Tierra–Sol',section:'FUNDAMENTOS',subtitle:'Observa cómo el movimiento orbital y la inclinación del eje explican el ciclo anual.'},
    fixed:{title:'Filas fijas y sombras',section:'GEOMETRÍA DE INSTALACIONES',subtitle:'Explora el compromiso entre separación de filas, sombras y ocupación del terreno.'},
    eo:{title:'Conjuntos Este–Oeste',section:'GEOMETRÍA DE INSTALACIONES',subtitle:'Compara la incidencia y las sombras en las dos caras de una instalación simétrica.'},
    tracking:{title:'Seguimiento a un eje N–S',section:'GEOMETRÍA DE INSTALACIONES',subtitle:'Estudia el giro del seguidor, las pendientes del terreno y el efecto del backtracking.'}
  };
  let states=structuredClone(defaults),lab='orbit',view='scene',running=false,lastTick=0,frame=0,cache=null,computed=null,chartData=[],rows=[],headers=[],toastTimer;
  let pending=false;
  const fields={};
  function toast(t){$('toast').textContent=t;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000);}
  function stop(){running=false;cancelAnimationFrame(frame);$('play').textContent='▶ Reproducir';$('play').setAttribute('aria-label','Reproducir animación');}
  function section(text){return `<p class="control-section">${esc(text)}</p>`;}
  function range(key,label,min,max,step,unit=''){
    fields[key]={type:'number',min,max,step};const v=states[lab][key];
    return `<div class="control-group"><label for="field-${key}">${label}<input id="field-${key}" data-key="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${v}" aria-label="${label}${unit?' en '+unit:''}"></label><input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${v}" aria-label="Ajustar ${label}"><div class="ends"><span>${min}${unit?' '+unit:''}</span><span>${max}${unit?' '+unit:''}</span></div></div>`;
  }
  function select(key,label,options){
    fields[key]={type:'select',options:options.map(o=>o[0])};return `<div class="control-group"><label for="field-${key}">${label}</label><select id="field-${key}" data-key="${key}">${options.map(([v,t])=>`<option value="${esc(v)}"${v===states[lab][key]?' selected':''}>${t}</option>`).join('')}</select></div>`;
  }
  function text(key,label,type='text'){fields[key]={type};return `<div class="control-group"><label for="field-${key}">${label}</label><input id="field-${key}" data-key="${key}" type="${type}" value="${esc(states[lab][key])}"${type==='text'?' maxlength="80"':''}></div>`;}
  function buildControls(){
    Object.keys(fields).forEach(k=>delete fields[k]);let html='';
    if(lab==='basic'){
      html+=range('lat','Latitud',-90,90,.5,'°')+range('day','Día del año · 2026',1,365,1)+select('mode','Declinación',[['date','Según fecha'],['manual','Manual · caso ideal']])+range('delta','Declinación manual',-23.45,23.45,.05,'°');
      html+='<div class="presets"><button type="button" data-preset="23.45">Junio</button><button type="button" data-preset="0">Equinoccio</button><button type="button" data-preset="-23.45">Diciembre</button></div>';
      html+=section('Animación')+select('animation','Recorrido',[['daily','Día · cambia la hora'],['annual','Año · cambia la fecha']])+range('speed','Velocidad',.5,10,.5,'×');
    }else if(lab==='orbit'){
      html+=range('day','Día del año · 2026',1,365,.01);
      html+='<div class="presets">'+G.events().map((e,i)=>`<button type="button" data-event="${i}">${e.name}</button>`).join('')+'</div>';
      html+=select('camera','Punto de vista',[['oblique','Vista oblicua'],['top','Vista superior']])+section('Reproducción anual')+range('speed','Velocidad',5,60,1,'días/s')+select('repeat','Al terminar el año',[['yes','Repetir'],['no','Detener']]);
    }else{
      html+=section('Emplazamiento')+range('lat','Latitud',-65,65,.1,'° N')+range('lon','Longitud',-180,180,.1,'° E')+text('date','Fecha','date');
      html+='<div class="presets"><button type="button" data-date="2026-12-21">21 diciembre</button><button type="button" data-date="2026-06-21">21 junio</button><button type="button" id="equinox-toggle" data-equinox-toggle="true" aria-controls="equinox-dates" aria-expanded="false">Equinoccios</button></div><div id="equinox-dates" class="presets equinox-dates" hidden><button type="button" data-date="2026-03-20">Marzo · 20/03</button><button type="button" data-date="2026-09-22">Septiembre · 22/09</button><span>Fechas de referencia del año didáctico.</span></div>';
      html+=select('reference','Referencia horaria',[['solar','Hora solar'],['civil','Hora civil']])+text('zone','Huso horario IANA');
      html+=section('Geometría de las mesas');
      if(lab!=='tracking')html+=range('alpha',lab==='eo'?'Giro de la cumbrera':'Acimut frontal',-90,90,1,'°')+range('beta','Inclinación',0,lab==='eo'?90:45,1,'°');
      html+=range('L','Anchura inclinada',.1,100,.1,'m')+range('W','Longitud de fila',.1,1000,.1,'m')+range('n',lab==='eo'?'Conjuntos de dos caras':'Número de filas',1,30,1)+range('h',lab==='tracking'?'Altura del soporte':'Altura inferior',lab==='tracking'?.01:0,lab==='tracking'?30:20,.01,'m');
      if(lab==='eo')html+=range('d','Hueco inferior',0,10,.05,'m');
      if(lab==='tracking'){
        html+=section('Terreno y seguimiento')+select('slopeUnits','Unidades de pendiente',[['degrees','Grados (°)'],['percent','Porcentaje (%)']]);
        const max=states[lab].slopeUnits==='percent'?100:45,unit=states[lab].slopeUnits==='percent'?'%':'°';
        html+=range('ns','Pendiente N–S',-max,max,.1,unit)+range('eo','Pendiente E–O',-max,max,.1,unit)+range('limit','Giro máximo ±',0,90,1,'°')+select('bt','Backtracking',[['no','Desactivado'],['yes','Activado']])+select('spacing','Paso entre filas',[['winter','Invierno · tres horas sin sombras'],['manual','GCR manual']])+range('gcr','GCR',.1,100,.1,'%');
      }
      html+=section('Animación')+range('speed','Velocidad del día',.5,10,.5,'h/s');
    }
    $('controls').innerHTML=html;syncControls();
  }
  function syncControls(){
    const st=states[lab];document.querySelectorAll('#controls [data-key]').forEach(el=>{
      const key=el.dataset.key;if(document.activeElement!==el)el.value=st[key];
      el.disabled=(lab==='basic'&&key==='delta'&&st.mode==='date')||(lab==='tracking'&&key==='gcr'&&st.spacing!=='manual');
    });
    if(lab==='basic'){
      $('field-day').title=prettyDate(dateFromDay(st.day));
    }
    const annual=lab==='orbit';$('time-slider').min=annual?1:0;$('time-slider').max=annual?365:24;$('time-slider').step=annual?.01:.02;
    $('time-value').min=annual?1:0;$('time-value').max=annual?365:24;$('time-value').step=annual?.01:.01;
    $('time-slider').value=annual?st.day:st.time;if(document.activeElement!==$('time-value'))$('time-value').value=numInput(annual?st.day:st.time);
    $('time-label').textContent=annual?'Día del modelo':st.reference==='civil'?'Hora civil · '+st.zone:'Hora solar';
    if(annual)$('time-label').textContent='Día del año · '+prettyDate(dateFromDay(st.day));
    $('time-unit').textContent=annual?'día del año':st.reference==='civil'?'h civiles':'h solares';
    $('time-ticks').innerHTML=(annual?['Enero','Abril','Julio','Octubre','Diciembre']:['00:00','06:00','12:00','18:00','24:00']).map(t=>'<span>'+t+'</span>').join('');
  }
  const numInput=n=>Number(n.toFixed(2));
  function card(id,title,caption,camera=false){
    return `<section class="view-card"><div class="view-heading"><h2>${title}</h2><button data-export="${id}" title="Guardar esta vista como imagen PNG" aria-label="Guardar ${title.replace(/<[^>]+>/g,'')} como PNG">PNG ↓</button></div><canvas id="${id}" role="img" aria-label="${title.replace(/<[^>]+>/g,'')}"></canvas>${camera?'<label class="camera-control">Giro de cámara <input id="camera" type="range" min="-180" max="180" step="1" value="'+states[lab].camera+'" aria-label="Giro horizontal de la cámara"></label>':''}<p class="caption">${caption}</p></section>`;
  }
  function setupViews(){
    $('visuals').className='visuals '+lab;let html='';
    if(lab==='basic'){
      html=card('globe','<span>01</span> Latitud y altura al mediodía','La vista de mediodía conserva su referencia al cambiar la hora.')+card('sky','<span>02</span> Recorridos solares','Junio · equinoccios · diciembre · caso seleccionado.',true)+card('hour','<span>03</span> Ángulo horario','Vista desde el polo norte. La tarde avanza en sentido horario.')+card('angles','<span>04</span> Altura y acimut','Altura respecto al horizonte; acimut desde el Sur, Este negativo.');
      const key='<span class="path-june">Junio</span> · <span class="path-equinox">Equinoccios</span> · <span class="path-december">Diciembre</span> · <span class="path-selected">Caso seleccionado</span>';
      html+=card('solar-polar','<span>05</span> Carta polar de trayectorias solares','Centro: cenit (90°). Borde: horizonte (0°). Norte arriba, Este a la derecha.<br>'+key+'<br>Gris fino: trayectorias intermedias. Gris punteado: horas solares, sin analema.<br>Punto dorado: instante seleccionado.')+card('solar-cartesian','<span>06</span> Carta de trayectorias solares','Altura frente a acimut. Centro: Norte en el hemisferio Sur; Sur en el hemisferio Norte y el ecuador. Se omite el recorrido nocturno.<br>'+key+'<br>Gris fino: trayectorias intermedias. Gris punteado: horas solares, sin analema.<br>En cenit el acimut es indeterminado; no se une la curva a través de él.');
    }else if(lab==='orbit')html=card('orbital','Órbita e iluminación terrestre','Órbita casi circular. Los tamaños de la Tierra y del Sol están ampliados.');
    else html=card('scene3d','<span>01</span> Instalación · vista 3D','Rojo: sombra frontal. Azul oscuro: incidencia posterior o rasante. Gris: noche o terreno.',true)+card('plan','<span>02</span> Planta · Norte arriba','Amarillo: dirección hacia el Sol. Código de iluminación explicado debajo de las vistas.');
    $('visuals').innerHTML=html;
    $('tabs').hidden=true;
    $('shadow-key').hidden=!['fixed','eo','tracking'].includes(lab);
    $('display-board').className='display-board'+(lab==='orbit'?' orbit':'');
    $('orbit-curves').hidden=lab!=='orbit';$('chart-section').hidden=lab==='orbit';
    $('charts').className='charts';
    $('charts').innerHTML=lab==='orbit'?'':'<canvas id="chart-main" role="img" aria-label="Evolución diaria"></canvas>';
    $('orbit-curves').innerHTML=lab==='orbit'?'<section class="orbit-curve"><div class="section-heading"><h2>Declinación solar</h2><button class="text-button" data-export="chart-main">PNG ↓</button></div><canvas id="chart-main" role="img" aria-label="Declinación anual"></canvas></section><section class="orbit-curve"><div class="section-heading"><h2>Ecuación del Tiempo · NOAA</h2><button class="text-button" data-export="chart-et">PNG ↓</button></div><canvas id="chart-et" role="img" aria-label="Ecuación del tiempo anual"></canvas><p class="et-legend"><b>ET &gt; 0:</b> el tiempo solar verdadero va adelantado respecto al solar medio.<br><b>ET &lt; 0:</b> va retrasado. Frente a la hora civil también influyen longitud, huso y horario de verano.</p><button class="text-button" data-orbit-csv="true">Descargar datos anuales ↓</button></section>':'';
    $('orbit-time-explanation').hidden=lab!=='orbit';
    $('orbit-time-explanation').innerHTML=lab==='orbit'?'<b>Del reloj civil al tiempo solar verdadero</b><div class="equation">TSV = TO − AO + ET/60 + (λlocal − λhuso)/15<br>ω (°) = 15 (TSV − 12)</div><p>TO: hora civil (h) · AO: adelanto de verano sobre el huso estándar (h) · ET: tiempo solar verdadero menos solar medio (min). Longitudes positivas al Este; λhuso es el meridiano del huso estándar (por ejemplo, +15° para UTC+1). La fórmula es explicativa; este laboratorio no calcula la hora civil de un lugar.</p>':'';
    $('monthly-section').hidden=lab!=='tracking';
    $('monthly-charts').innerHTML=lab==='tracking'?'<section><div class="section-heading"><h3>Sin backtracking</h3><button class="text-button" data-export="monthly-no">PNG ↓</button></div><canvas id="monthly-no" role="img" aria-label="Giro en doce fechas sin backtracking"></canvas></section><section><div class="section-heading"><h3>Con backtracking</h3><button class="text-button" data-export="monthly-yes">PNG ↓</button></div><canvas id="monthly-yes" role="img" aria-label="Giro en doce fechas con backtracking"></canvas></section>':'';
    $('chart-title').textContent=lab==='orbit'?'Declinación y ecuación del tiempo':lab==='basic'?'Altura solar durante el día':'Evolución diaria · cara sin Sol directo';
    $('explanation').innerHTML=explanation(lab);
  }
  function getParams(){
    const s=states[lab],p={...s};
    if(lab==='tracking'&&s.slopeUnits==='percent'){p.ns=G.atan2(s.ns,100);p.eo=G.atan2(s.eo,100);}
    return p;
  }
  function toSolar(t){const s=states[lab];return s.reference==='civil'?G.civilToSolar(s.date,s.lon,t,s.zone):t;}
  function solarNow(t=states[lab].time){const s=states[lab],delta=lab==='basic'?(s.mode==='manual'?s.delta:G.declination(s.day,'basic')):G.declination(G.dayOfYear(s.date));return G.solar(s.lat,delta,lab==='basic'?t:toSolar(t));}
  function metric(label,value,unit,detail=''){return `<div class="metric"><span class="label">${label}</span><strong>${value}<small>${unit}</small></strong><span class="detail">${detail||'&nbsp;'}</span></div>`;}
  function temporalMetrics(){
    const s=states[lab],orbital=lab==='orbit';
    const instant=orbital?new Date(Date.UTC(2026,0,1)+(s.day-1)*86400000):null;
    const date=orbital?instant.toISOString().slice(0,10):lab==='basic'?dateFromDay(s.day):s.date;
    const [year,month,day]=date.split('-');
    const clock=orbital?instant.toISOString().slice(11,16):s.time===24?'24:00':hh(s.time);
    const ref=orbital?'Año didáctico':s.reference==='civil'?'Hora civil':'Hora solar';
    const detail=orbital?'Sin rotación diaria':s.reference==='civil'?s.zone:lab==='basic'&&s.mode==='manual'?'δ manual, independiente de fecha':'Tiempo solar verdadero';
    return `<div class="metric temporal"><span class="label">Fecha</span><strong>${day}/${month}</strong><span class="detail">${year}</span></div><div class="metric temporal"><span class="label">Hora</span><strong>${clock}</strong><span class="detail">hh:mm</span></div><div class="metric temporal reference"><span class="label">Referencia temporal</span><strong>${ref}</strong><span class="detail">${detail}</span></div>`;
  }
  function compute(){
    const st=states[lab],p=getParams(),key=JSON.stringify([lab,{...p,time:0,camera:0,speed:0},view]);
    if(cache&&cache.key===key)return cache;
    const delta=lab==='basic'?(st.mode==='manual'?st.delta:G.declination(st.day,'basic')):lab==='orbit'?0:G.declination(G.dayOfYear(st.date));
    const times=G.range(0,24,97);let result={key,delta,p,times};
    if(lab==='basic')result.daily=times.map(t=>G.solar(st.lat,delta,t));
    else if(lab==='orbit')result.daily=G.range(0,364,365).map(t=>G.orbit(t));
    else if(lab==='tracking'){
      result.design=G.trackDesign(p,st.spacing==='manual'?st.gcr/100:null);
      result.daily=times.map(t=>G.trackState(p,G.solar(p.lat,delta,toSolar(t)).vector,result.design.P,st.bt==='yes'));
      result.freeHours=G.freeHours(p,st.date,result.design.P,st.bt==='yes');
      result.monthly=Array.from({length:12},(_,month)=>{
        const date='2026-'+String(month+1).padStart(2,'0')+'-21',dec=G.declination(G.dayOfYear(date));
        return [false,true].map(bt=>G.range(6,18,97).map(t=>[t-12,G.trackState(p,G.solar(p.lat,dec,t).vector,result.design.P,bt).theta]));
      });
    }else{
      result.layout=G.layout(p,lab);result.design=result.layout.design;
      result.daily=times.map(t=>G.shadows(result.layout.faces,G.solar(p.lat,delta,toSolar(t)).vector));
    }
    cache=result;return result;
  }
  function render(){
    pending=false;syncControls();$('figure-time').textContent=figureTimestamp();
    try{
      const s=states[lab],c=compute();computed=c;$('error').hidden=true;
      if(lab==='basic'){
        const sun=solarNow(),day=G.daylight(s.lat,c.delta),scenes=R.basicScenes({...s,delta:c.delta});
        ['globe','sky','hour','angles'].forEach((id,i)=>R.scene($(id),scenes[i].items,scenes[i].options));
        R.solarCards($('solar-polar'),$('solar-cartesian'),{...s,delta:c.delta});
        $('metrics').innerHTML=metric('Altura solar',num(sun.alt),'°',sun.status)+metric('Acimut solar',num(sun.az),'°',sun.conventional?'Marco polar convencional':'Sur 0° · Este negativo')+metric('Declinación',num(c.delta),'°',s.mode==='manual'?'Caso manual · independiente de fecha':prettyDate(dateFromDay(s.day)))+metric('Duración del día',num(day.hours),'h',day.regime);
        chartData=[{name:'Altura solar',points:c.times.map((t,i)=>[t,c.daily[i].alt]),color:'#8c243c'}];
        R.chart($('chart-main'),chartData,{ymin:-90,ymax:90,label:'Altura (°)',marker:s.time,onSelect:setTime});
        headers=['hora_solar_h','altura_grados','acimut_desde_sur_grados','declinacion_grados'];rows=c.times.map((t,i)=>[t,c.daily[i].alt,c.daily[i].az,c.delta]);
        $('chart-note').textContent='La curva incluye el recorrido nocturno. '+(day.sunrise===null?day.regime:'Salida: '+hh(day.sunrise)+' · puesta: '+hh(day.sunset))+' · ω = '+num(sun.omega,1)+'°. Fecha: '+prettyDate(dateFromDay(s.day))+'.';
      }else if(lab==='orbit'){
        const o=G.orbit(s.day-1);R.orbital($('orbital'),s.day-1,s.camera==='top');
        $('metrics').innerHTML=metric('Declinación',num(o.delta),'°',prettyDate(dateFromDay(s.day)))+metric('Distancia Tierra–Sol',num(o.distance,4),'UA','Excentricidad 0,0167')+metric('Velocidad relativa',num(o.speed,4),'×','Respecto a órbita circular')+metric('Ecuación del tiempo',num(o.et),'min','Aproximación NOAA independiente');
        chartData=[{name:'Declinación',color:'#8c243c',points:c.daily.map((o,i)=>[i+1,o.delta])}];
        const opt={xmin:1,xmax:365,xticks:[1,91,182,274,365],formatX:v=>({1:'Ene',91:'Abr',182:'Jul',274:'Oct',365:'Dic'})[v],marker:s.day,onSelect:setTime};
        R.chart($('chart-main'),chartData,{...opt,ymin:-25,ymax:25,label:'Declinación (°)',markerValue:o.delta});R.chart($('chart-et'),[{points:c.daily.map((o,i)=>[i+1,o.et]),color:'#376b94'}],{...opt,ymin:-20,ymax:20,label:'Ecuación del tiempo (min)',markerValue:o.et,markerColor:'#376b94'});
        headers=['dia_2026','declinacion_grados','ET_min','distancia_UA','velocidad_relativa'];rows=c.daily.map((o,i)=>[i+1,o.delta,o.et,o.distance,o.speed]);
        $('chart-note').textContent='Año didáctico de 365 días, perihelio fijado al 3 de enero. No son efemérides de 2026. La ecuación del tiempo es una aproximación armónica independiente de la órbita.';
      }else{
        const sun=solarNow(),d=c.design;let faces,shade,track;
        if(lab==='tracking'){
          track=G.trackState(c.p,sun.vector,d.P,s.bt==='yes');faces=G.trackFaces(c.p,track,d.P);shade=G.shadows(faces,sun.vector).map(m=>({...m,terrainBlocked:sun.U>0&&track.terrain<=0}));
          $('metrics').innerHTML=metric('Giro del seguidor',num(track.theta),'°','Este − · Oeste +')+metric('Paso horizontal',num(d.P),'m','GCR '+num(d.GCR*100,1)+' % · 1/GCR '+num(1/d.GCR))+metric('Horas sin sombras',num(c.freeHours),'h','Sol frontal en todas las filas')+metric('Altura libre mínima',num(d.clearance),'m','Durante todo el giro mecánico');
          drawMonthly(c);
        }else{
          faces=c.layout.faces;shade=G.shadows(faces,sun.vector);
          $('metrics').innerHTML=metric('Hueco entre '+(lab==='eo'?'conjuntos':'filas'),num(d.d),'m',lab==='eo'?'Separación manual':'Diseño invernal · ±1,5 h')+metric('Paso del patrón',num(d.P),'m','Borde a borde equivalente')+metric('Cobertura horizontal',num(d.LCR*100,1),'%','LCR · sin pasillos ni márgenes')+metric('Altura solar',num(sun.alt,1),'°',sun.status);
        }
        {
          R.installation($('scene3d'),c.p,faces,shade,sun.vector,{az:s.camera,tracking:lab==='tracking'});R.installation($('plan'),c.p,faces,shade,sun.vector,{top:true,az:0,tracking:lab==='tracking'});
        }
        let lineSeries=[];
        for(let j=0;j<(lab==='eo'?s.n*2:s.n);j++){
          const index=lab==='eo'?Math.floor(j/2):j;
          lineSeries.push({name:lab==='eo'?'Conjunto '+(index+1)+' '+(j%2?'O':'E'):'Fila '+(j+1),color:R.palette[index%12],dash:lab==='eo'&&j%2?[4,3]:[],points:c.times.map((t,i)=>[t,lab==='tracking'?(c.daily[i].fraction[j]===null?null:c.daily[i].fraction[j]*100):(c.daily[i][j].fraction===null?null:c.daily[i][j].fraction*100)])});
        }
        const angleSeries=(lab==='eo'?[0,1]:[0]).flatMap((j,i)=>{
          const side=lab==='eo'?' · cara '+(i?'O':'E'):'';
          const values=c.times.map((t,k)=>[t,lab==='tracking'?c.daily[k].incidence:c.daily[k][j].incidence]);
          return [
            {name:'Con la normal'+side,axis:'right',color:i?'#9d4c87':'#b05d24',width:2.3,dash:[7,4],column:'angulo_normal_'+(j+1)+'_grados',points:values.map(([t,v])=>[t,v===null?null:90-v])},
            {name:'Con el plano'+side,axis:'right',color:i?'#337d82':'#263f69',width:2.3,column:'angulo_plano_'+(j+1)+'_grados',points:values}
          ];
        });
        chartData=[...lineSeries,...angleSeries];
        R.chart($('chart-main'),chartData,{ymin:0,ymax:100,label:'Cara sin Sol directo (%)',rightLabel:'Ángulos (°)',yminRight:-90,ymaxRight:180,yticksRight:[-90,0,90,180],marker:s.time,onSelect:setTime});
        headers=[s.reference==='civil'?'hora_civil_h':'hora_solar_h',...lineSeries.map((_,j)=>'sin_sol_directo_'+(j+1)+'_porcentaje'),...angleSeries.map(q=>q.column)];
        rows=c.times.map((t,i)=>[t,...lineSeries.map(q=>q.points[i][1]),...angleSeries.map(q=>q.points[i][1])]);
        const fractions=lab==='tracking'?track.fraction:shade.map(m=>m.fraction),valid=fractions.filter(v=>v!==null),avg=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;
        $('chart-note').textContent=prettyDate(s.date)+' · '+(s.reference==='civil'?'Hora civil en '+s.zone:'Hora solar')+' · Instante: '+hh(s.time)+' · Media de superficie sin Sol directo: '+num(avg===null?null:100*avg,1)+' %. La noche se omite. Este porcentaje combina sombras e incidencia posterior; no es una pérdida energética.';
      }
      $('metrics').innerHTML=temporalMetrics()+$('metrics').innerHTML;
      $('chart-legend').innerHTML=chartData.filter((q,i)=>q.axis==='right'||i<12).map(q=>`<span><i style="background:transparent;border-top:3px ${q.dash?'dashed':'solid'} ${q.color}"></i>${esc(q.name)}${q.axis==='right'?' (eje derecho)':''}</span>`).join('');
      if(lab==='eo')$('chart-legend').insertAdjacentHTML('beforeend','<span>— cara E · · · cara O</span>');
      buildTable();$('export-csv').disabled=false;
      // Text equivalents for canvases expose the selected numeric state.
      const summary=$('figure-time').textContent+' · '+$('metrics').innerText.replace(/\n+/g,' · ');document.querySelectorAll('#visuals canvas').forEach(c=>c.setAttribute('aria-description',summary));
    }catch(error){
      stop();computed=null;$('error').hidden=false;$('error').textContent=error.message;$('metrics').innerHTML=metric('Configuración no válida','—','','Revise el aviso');
      document.querySelectorAll('canvas').forEach(c=>{const r=R.surface(c);r.ctx.fillStyle='#7b8580';r.ctx.textAlign='center';r.ctx.fillText('Ajuste los parámetros para continuar',r.w/2,r.h/2);});
      $('export-csv').disabled=true;$('chart-note').textContent='No se muestran resultados de la configuración anterior.';$('table-wrap').textContent='Sin resultados.';rows=[];
    }
  }
  function drawMonthly(c){
    const names=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    for(let bt=0;bt<2;bt++)R.chart($(bt?'monthly-yes':'monthly-no'),c.monthly.map((m,i)=>({name:names[i],color:R.palette[i],points:m[bt]})),{xmin:-6,xmax:6,ymin:-90,ymax:90,xticks:[-6,-3,0,3,6],label:'Giro (°) · horas solares respecto al mediodía'});
    $('monthly-legend').innerHTML=names.map((n,i)=>`<span><i style="background:${R.palette[i]}"></i>${n}</span>`).join('');
  }
  function buildTable(){
    $('table-wrap').innerHTML='<table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+num(v,2)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  }
  function requestRender(){if(!pending){pending=true;requestAnimationFrame(render);}}
  function setTime(value){
    const v=Number(value),annual=lab==='orbit';if(!Number.isFinite(v))return;
    states[lab][annual?'day':'time']=G.clamp(v,annual?1:0,annual?365:24);if(annual)cache=null;requestRender();
  }
  function setLab(next){
    stop();lab=next;view='scene';cache=null;const m=meta[lab],index=['orbit','basic','fixed','eo','tracking'].indexOf(lab)+1;
    $('title').textContent=m.title;$('subtitle').textContent=m.subtitle;$('eyebrow').textContent=m.section+' / LABORATORIO '+String(index).padStart(2,'0');
    document.querySelectorAll('[data-lab]').forEach(b=>{if(b.dataset.lab===lab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.title=m.title+' · GEOSOLAR · USAL';buildControls();setupViews();render();
  }
  function explanation(which){
    const shared='<p><b>Convención:</b> acimut desde el Sur (0°), Este negativo y Oeste positivo. Coordenadas Este/Norte/Cenit. Los modelos solares son aproximados.</p>';
    const time='<p><b>Hora civil:</b> incluye longitud, ecuación del tiempo y huso IANA con horario de verano. Una hora ambigua usa la segunda ocurrencia; una hora inexistente avanza al intervalo válido. Cambiar la referencia conserva el instante cuando existe en la fecha mostrada.</p>';
    const note='<p>Geometría docente: sin espesor de módulos, irradiación difusa, respuesta bifacial ni pérdidas eléctricas. Se representan ambos ángulos: con la normal θ (0° perpendicular, 90° rasante, &gt;90° posterior) y con el plano η (90° perpendicular, 0° rasante, negativo por detrás). Se cumple θ + η = 90°. Ambos usan el eje derecho de la gráfica; los porcentajes usan el izquierdo.</p>';
    if(which==='basic')return shared+'<div class="equation">ω = 15° (tₛ − 12) · sin α = sin φ sin δ + cos φ cos δ cos ω<br>δ = 23,45° sin[360° (284 + n) / 365]</div><p>El modo manual conserva δ al cambiar la fecha. «Según fecha» utiliza un año didáctico no bisiesto de 365 días. El acimut se omite en cenit/nadir; en los polos el marco horizontal es convencional. Los tramos punteados de las trayectorias están bajo el horizonte.</p><p class="teaching-question"><b>Antes de mover el control:</b> ¿dónde culmina el Sol en el Ecuador durante un equinoccio? ¿Qué cambia al pasar de +40° a −40°?</p>';
    if(which==='orbit')return '<div class="equation">M = E − e sin E · e = 0,0167 · a = 1 UA<br>δ = asin(eje norte · dirección Tierra–Sol)</div><p>Órbita kepleriana de 365 días. Perihelio fijado el 3 de enero; eje inclinado 23,44° y fijo en el espacio. Los eventos se calculan con este mismo modelo, calibrado al equinoccio de marzo. Los cuerpos tienen tamaños muy ampliados; la excentricidad orbital no está exagerada.</p><p>La ET es la aproximación armónica NOAA, independiente de la órbita didáctica. No representa una efeméride exacta de 2026. No se simula rotación diaria, precesión ni perturbaciones.</p><p class="teaching-question"><b>Predice:</b> ¿está la Tierra más cerca del Sol durante junio? ¿Por qué ambos hemisferios tienen estaciones opuestas?</p>';
    if(which==='fixed')return shared+'<div class="equation">b = L cos β · H = L sin β · d = H K<br>P = b + d · LCR = b / P</div><p>El hueco se diseña automáticamente para las 10:30–13:30 solares del solsticio de invierno de cada hemisferio, muestreando 1801 posiciones. Cambiar la fecha visualizada no redimensiona ese criterio. El terreno es horizontal; filas iguales, finitas y paralelas. LCR es proyección horizontal de módulos por terreno del patrón, sin márgenes ni pasillos.</p>'+time+note+'<p class="teaching-question"><b>Compara:</b> al aumentar la inclinación, ¿qué ocurre con el paso y el LCR? ¿Una sombra a una hora concreta determina la energía anual?</p>';
    if(which==='eo')return shared+'<div class="equation">P = 2 L cos β + 0,05 m + d<br>LCR = 2 L cos β / P · acimuts = giro ± 90°</div><p>Dos caras iguales por conjunto. Cumbrera abierta 5 cm y hueco inferior manual. El giro cero alinea la cumbrera Norte–Sur. E y O identifican las caras originales incluso al girar. Se proyectan y unen las sombras de todas las caras; el límite de 90° es geométrico.</p>'+time+note+'<p class="teaching-question"><b>Compara:</b> ¿se intercambian las curvas de E y O entre mañana y tarde? ¿Mayor cobertura significa mayor producción?</p>';
    return shared+'<div class="equation">GCR = anchura / paso horizontal E–O<br>θ ideal = atan2(−s·Este, s·c)</div><p>El eje sigue la pendiente N–S. Las pendientes son positivas si el terreno sube hacia Norte o Este. El paso de invierno se dimensiona sin backtracking entre 10:30 y 13:30 solares; el GCR manual permite fijarlo. Se comprueba que las mesas no toquen el terreno en todo el recorrido mecánico.</p><p>El backtracking reduce el giro para evitar sombras cuando la separación y los límites lo permiten. No garantiza eliminarlas en toda combinación de pendientes. Las horas libres suman intervalos de un minuto con todas las filas sin sombras y Sol frontal visible; no tienen por qué formar un intervalo continuo.</p>'+time+'<p><b>Alcance de esta entrega:</b> geometría, sombras y comparación de giro en doce fechas. La irradiación anual PVGIS queda pendiente. GCR no equivale al LCR proyectado de las filas fijas; no se estima energía eléctrica.</p><p class="teaching-question"><b>Predice:</b> ¿cómo cambia el giro al activar backtracking con un GCR alto? ¿Por qué evitar sombras no basta para cuantificar la mejora eléctrica?</p>';
  }
  function download(filename,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function exportCanvas(id){
    const source=$(id);if(!source||!computed)return;const out=document.createElement('canvas');out.width=source.width;out.height=source.height+140;const ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage($('usal-logo'),18,15,192,54);ctx.fillStyle='#8c243c';ctx.font='bold 20px system-ui';ctx.fillText('GEOSOLAR · '+meta[lab].title,18,105);ctx.drawImage(source,0,125);ctx.fillStyle='#596760';ctx.font='10px system-ui';ctx.fillText('Modelo docente · '+figureTimestamp(),18,out.height-5,out.width-36);out.toBlob(blob=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='GEOSOLAR_'+lab+'_'+id+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);});
  }
  $('controls').addEventListener('submit',e=>e.preventDefault());
  $('controls').addEventListener('input',e=>{
    const el=e.target,key=el.dataset.key;if(!key||el.tagName==='SELECT'||['date','text'].includes(el.type))return;
    if(!el.validity.valid)return;const v=+el.value;if(!Number.isFinite(v))return;
    if(lab==='basic'&&key==='day'){selectBasicDay(v);return;}
    states[lab][key]=v;if(key==='day')stop();cache=null;syncControls();requestRender();
  });
  $('controls').addEventListener('change',e=>{
    const el=e.target,key=el.dataset.key;if(!key)return;
    const state=states[lab],previous=state[key];
    if(el.tagName==='SELECT'){
      if(key==='reference'){
        const converted=el.value==='civil'?G.solarToCivil(state.date,state.lon,state.time,state.zone):G.civilToSolar(state.date,state.lon,state.time,state.zone);
        // Move the calendar when the same instant lies outside this civil/solar day.
        const shift=Math.floor(converted/24);state.time=((converted%24)+24)%24;
        if(shift){state.date=new Date(Date.parse(state.date+'T00:00:00Z')+shift*86400000).toISOString().slice(0,10);toast('El instante pasa a la fecha '+prettyDate(state.date));}
      }
      if(key==='slopeUnits')for(const k of ['ns','eo'])state[k]=el.value==='percent'?100*G.tan(state[k]):G.atan2(state[k],100);
      if(key==='spacing'&&el.value==='manual'&&computed)state.gcr=computed.design.GCR*100;
      state[key]=el.value;cache=null;stop();buildControls();requestRender();
    }else if(el.type==='date'||el.type==='text'){
      if(el.type==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(el.value))return;
      if(key==='zone'){try{G.offsetAt(Date.now(),el.value);}catch{el.value=previous;toast('Huso IANA no válido. Ejemplo: Europe/Madrid');return;}}
      state[key]=el.value;cache=null;stop();requestRender();
    }
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.lab)setLab(b.dataset.lab);
    if(b.dataset.preset!==undefined){states.basic.delta=+b.dataset.preset;states.basic.mode='manual';cache=null;stop();syncControls();requestRender();}
    if(b.dataset.event!==undefined){states.orbit.day=G.events()[+b.dataset.event].time+1;cache=null;stop();requestRender();}
    if(b.dataset.equinoxToggle){const panel=$('equinox-dates');panel.hidden=!panel.hidden;b.setAttribute('aria-expanded',String(!panel.hidden));}
    if(b.dataset.date){states[lab].date=b.dataset.date;cache=null;stop();if($('equinox-dates')){$('equinox-dates').hidden=true;$('equinox-toggle').setAttribute('aria-expanded','false');}requestRender();}
    if(b.dataset.view){view=b.dataset.view;cache=null;setupViews();requestRender();}
    if(b.dataset.export)exportCanvas(b.dataset.export);
    if(b.dataset.orbitCsv)$('export-csv').click();
    if(b.dataset.monthlyCsv&&computed?.monthly){
      const data=['# GEOSOLAR · Giro mensual · modelo matlab-compat-v1','# Parámetros: '+JSON.stringify(states.tracking),'mes;dia;hora_solar_h;sin_backtracking_grados;con_backtracking_grados'];
      computed.monthly.forEach((month,i)=>month[0].forEach(([t,theta],k)=>data.push([i+1,21,t+12,theta??'',month[1][k][1]??''].join(';'))));
      download('GEOSOLAR_giro_12_fechas.csv','\uFEFF'+data.join('\r\n'),'text/csv;charset=utf-8');
    }
  });
  function selectBasicDay(value){
    const n=Number(value);if(!Number.isFinite(n))return;
    states.basic.day=Math.round(G.clamp(n,1,365));cache=null;stop();syncControls();requestRender();
  }
  $('visuals').addEventListener('input',e=>{
    if(e.target.id==='camera'){states[lab].camera=+e.target.value;requestRender();}
  });
  $('time-slider').addEventListener('input',e=>{stop();setTime(e.target.value);});$('time-value').addEventListener('change',e=>{stop();setTime(e.target.value);});
  $('reset').onclick=()=>{states[lab]=structuredClone(defaults[lab]);setLab(lab);};
  $('play').onclick=()=>{
    if(running){stop();return;}if(!computed)return;
    running=true;lastTick=performance.now();$('play').textContent='Ⅱ Pausar';$('play').setAttribute('aria-label','Pausar animación');
    const tick=now=>{if(!running)return;const dt=Math.min(.2,(now-lastTick)/1000);lastTick=now;const s=states[lab];
      if(lab==='orbit'){s.day+=dt*s.speed;if(s.day>=365){if(s.repeat==='yes')s.day=1;else{s.day=365;stop();}}cache=null;}
      else if(lab==='basic'&&s.animation==='annual'){s.mode='date';s.day+=dt*s.speed*6;if(s.day>365)s.day=1;cache=null;}
      else{s.time+=dt*s.speed;if(s.time>24)s.time=0;}
      render();if(running)frame=requestAnimationFrame(tick);
    };frame=requestAnimationFrame(tick);
  };
  $('save-scenario').onclick=()=>download('GEOSOLAR_'+lab+'.json',JSON.stringify({format:'GEOSOLAR',version:1,lab,model:'matlab-compat-v1',parameters:states[lab]},null,2),'application/json');
  $('load-scenario').onclick=()=>$('scenario-file').click();
  $('scenario-file').onchange=async e=>{
    try{
      const file=e.target.files[0];if(!file)return;if(file.size>100000)throw Error('El archivo de escenario es demasiado grande.');const data=JSON.parse(await file.text());
      if(data.format!=='GEOSOLAR'||data.version!==1||!Object.hasOwn(defaults,data.lab)||!data.parameters||typeof data.parameters!=='object')throw Error('Formato de escenario GEOSOLAR no válido.');
      const target=data.lab,originalLab=lab;setLab(target);let candidate={...defaults[target]};
      // Validate against the complete UI contract, including values hidden by current mode.
      if(target==='tracking'&&data.parameters.slopeUnits==='percent'){states[target].slopeUnits='percent';buildControls();}
      for(const [key,def] of Object.entries(defaults[target])){
        const value=data.parameters[key];if(value===undefined)continue;
        if(typeof value!==typeof def)throw Error('Tipo incorrecto: '+key);
        const f=fields[key];
        if(f?.type==='number'&&(!Number.isFinite(value)||value<f.min||value>f.max||(key==='n'&&!Number.isInteger(value))))throw Error('Valor fuera de rango: '+key);
        if(f?.type==='select'&&!f.options.includes(value))throw Error('Opción desconocida: '+key);
        if(key==='time'&&(!Number.isFinite(value)||value<0||value>24))throw Error('Hora fuera de rango.');
        if(key==='camera'&&typeof value==='number'&&(!Number.isFinite(value)||value< -180||value>180))throw Error('Cámara fuera de rango.');
        if(key==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value))throw Error('Fecha no válida.');
        if(key==='zone')G.offsetAt(Date.now(),value);candidate[key]=value;
      }
      states[target]=candidate;setLab(target);toast('Escenario cargado.');
    }catch(err){toast('No se pudo abrir: '+err.message);}finally{e.target.value='';}
  };
  $('export-csv').onclick=()=>{
    if(!computed||!rows.length)return;
    const s=states[lab],metaRows=['# GEOSOLAR · '+meta[lab].title,'# Modelo: matlab-compat-v1','# Parámetros: '+JSON.stringify(s),'# null/vacío = noche o magnitud indeterminada; no es cero','# Porcentajes geométricos: no equivalen a pérdidas energéticas'];
    download('GEOSOLAR_'+lab+'.csv','\uFEFF'+metaRows.join('\r\n')+'\r\n'+headers.join(';')+'\r\n'+rows.map(r=>r.map(v=>v===null?'':v).join(';')).join('\r\n'),'text/csv;charset=utf-8');
  };
  window.addEventListener('resize',requestRender);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  setLab('orbit');
})();
