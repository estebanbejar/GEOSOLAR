'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function run(args){
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
for(const file of ['src/core/models.js','src/ui/app.js','src/ui/graphics.js','scripts/build.cjs'])run(['--check',file]);
for(const name of ['compare_matlab','invariants','render_order','illumination_colors','solar_cards','smoke_ui'])run(['tests/'+name+'.cjs']);
console.log('GEOSOLAR: todas las comprobaciones han finalizado correctamente.');
