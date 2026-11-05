'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,content)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);};
const scripts=['src/core/models.js','src/ui/graphics.js','src/ui/app.js'];
const css='src/ui/styles.css';
let html=read('index.html');
html=html.replace('<html lang="es">',()=>'<!-- Modelos adaptados de IRRADIANCE.\n'+read('LICENSE')+'\nEl logotipo USAL conserva los derechos de su titular. -->\n<html lang="es">');
html=html.replace('<link rel="stylesheet" href="'+css+'">',()=>'<style>'+read(css)+'</style>');
for(const file of scripts){
  const tag='<script defer src="'+file+'"></script>';assert.ok(html.includes(tag),'Falta entrada '+file);
  html=html.replace(tag,'').replace('</body>',()=>'<script>'+read(file).replace(/<\/script/gi,'<\\/script')+'</script>\n</body>');
}
const logo='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/usal.png')).toString('base64');
html=html.replaceAll('assets/usal.png',logo);
assert.ok(!/<script[^>]+src=/.test(html));assert.ok(!html.includes('type="module"'));assert.ok(!/\bfetch\s*\(/.test(html));
write('dist/index.html',html);
for(const file of [...scripts,css,'assets/usal.png'])write('site/'+file,fs.readFileSync(path.join(root,file)));
const entry=read('index.html').replace('</footer>','<a href="GEOSOLAR.html" download>Descargar versión sin conexión</a></footer>');
write('site/index.html',entry);write('site/GEOSOLAR.html',html);write('site/.nojekyll','');
for(const match of entry.matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(!match[1].startsWith('http'))assert.ok(fs.existsSync(path.join(root,'site',match[1])),'Referencia no encontrada: '+match[1]);
}
console.log('GEOSOLAR: dist/index.html y site/ preparados, sin dependencias remotas.');
