import fs from 'node:fs';
import {calcularMueble} from '../../src/lib/engine.ts';
const dir='artifacts/comparacion-prueba1/';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).map(l=>l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map(m=>[m[1],m[2].replace(/^['"]|['"]$/g,'')]));
const tables=['cot_tipos_mueble','cot_piezas_plantilla','cot_reglas_config','cot_herrajes_plantilla','cot_tableros','cot_cantos','cot_herrajes','cot_parametros'];
let db;
if(fs.existsSync(dir+'db.json')) db=JSON.parse(fs.readFileSync(dir+'db.json'));
else {
 db={};
 for(const t of tables){db[t]=[]; for(let offset=0;;offset+=1000){const r=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/'+t+'?select=*&limit=1000&offset='+offset,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY}}); if(!r.ok)throw Error(t+': '+r.status);const rows=await r.json();db[t].push(...rows);if(rows.length<1000)break;}}
 fs.writeFileSync(dir+'db.json',JSON.stringify(db,null,2));
}
console.log('tables',Object.fromEntries(tables.map(t=>[t,db[t].length])));
const ex=JSON.parse(fs.readFileSync(dir+'excel.json'));
const result=[];
for(const [sheet,rows] of Object.entries(ex)) {
 if(sheet==='COSTOS MUEBLES')continue;
 const wood=sheet.startsWith('MADERA');
 for(let i=wood?2:1;i<rows.length;i++){
 const r=rows[i],sku=r[wood?1:2];if(!sku)continue;
 const pref=wood?sku.match(/^[A-Z]+/)[0]:r[1];const t=db.cot_tipos_mueble.find(t=>t.pref===pref);
 const dims={L:r[wood?3:4],A:r[wood?4:5],P:r[wood?5:6]};
 const overrides={};if(pref==='DB'){overrides.n_cajones=sku.includes('s')?3:Number(sku.split('-')[1]);overrides.n_cajones_pequenos=sku.includes('s')?Number(sku.split('-')[1][0]):0;}
 const inp={dims,piezas:db.cot_piezas_plantilla.filter(p=>p.tipo_mueble_id===t.id).sort((a,b)=>a.orden-b.orden),reglas:db.cot_reglas_config.filter(p=>p.activo&&(p.tipo_mueble_id===null||p.tipo_mueble_id===t.id)),herrajesPlantilla:db.cot_herrajes_plantilla.filter(p=>p.tipo_mueble_id===t.id),preset:{caja:'CAJA',refuerzo:'REF',frente:'FRENTE',fondo:'FONDO'},tablerosByCode:Object.fromEntries([['CAJA',15],['REF',15],['FRENTE',18],['FONDO',6]].map(([codigo,espesor_mm])=>[codigo,{codigo,espesor_mm,precio_m2:1}])),cantosByCalibre:Object.fromEntries(db.cot_cantos.map(c=>[c.calibre.toUpperCase().replace(/\s/g,''),c])),herrajesByCode:Object.fromEntries(db.cot_herrajes.filter(h=>h.activo).map(h=>[h.codigo,h])),consumiblesBySelector:{},etiquetasUnd:t.etiquetas_und??4,usaCarton:t.usa_carton!==false,margen:0,trm:1,desperdicio:0.15,overrides};
 try {const calc=calcularMueble(inp);result.push({sheet,row:i+1,sku,dims,calc});}catch(e){result.push({sheet,row:i+1,sku,error:e.message});}
 }
}
fs.writeFileSync(dir+'results.json',JSON.stringify(result,null,2));
console.log(result.map(x=>({sku:x.sku,sheet:x.sheet,error:x.error,vars:x.calc?.vars,wood:x.calc?.maderaPorRol,canto:x.calc?.cantoPorCalibre,cons:x.calc?.cantidadesConsumibles,herr:x.calc?.herrajes}))); 

