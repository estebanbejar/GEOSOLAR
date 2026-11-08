const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),license=fs.readFileSync(path.join(root,'LICENSE'),'utf8').trim(),pkg=require('../package.json');
const credits=html.match(/<article id="credits-page"[\s\S]*?<\/article>/)[0];
for(const text of ['Créditos y aviso de uso','Tecnología e Instalaciones Fotovoltaicas','Grado en Electrónica Industrial y Automática','Escuela Técnica Superior de Ingeniería Industrial de la Universidad de Salamanca','Esteban Sánchez Hernández','Catedrático de Escuela Universitaria','Área de Tecnología Electrónica','Departamento de Física Aplicada','Codex de OpenAI','bajo la dirección del autor','sin garantías de ausencia de errores',pkg.version,'2026-11-08'])assert.ok(credits.includes(text),text);
assert.doesNotMatch(credits,/PVGIS|Joint Research|OpenStreetMap|Leaflet|Open-Meteo|GeoNames|GPT-/i);
const escapedLicense=license.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
assert.ok(credits.replace(/\r\n/g,'\n').includes(escapedLicense.replace(/\r\n/g,'\n')));assert.ok(html.indexOf('data-credits=')>html.indexOf('data-lab="tracking"'));
const links=[...credits.matchAll(/<a\s+([^>]+)>/g)];assert.equal(links.length,6);
assert.deepEqual(links.map(m=>m[1].match(/href="([^"]+)"/)[1]),['https://industriales.usal.es/','https://orcid.org/0000-0003-1341-8767','https://github.com/estebanbejar/GEOSOLAR','https://estebanbejar.github.io/GEOSOLAR/','https://github.com/estebanbejar/GEOSOLAR_MATLAB','https://github.com/estebanbejar/GEOSOLAR/blob/main/LICENSE']);
for(const [,attrs] of links){assert.match(attrs,/target="_blank"/);assert.match(attrs,/rel="noopener noreferrer"/);}
assert.doesNotMatch(credits,/<(?:script|iframe|img)\b|\bfetch\s*\(/);
console.log('PASS: créditos aprobados, seis enlaces seguros, versión/fecha y licencia íntegra sin servicios externos.');
