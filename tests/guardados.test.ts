import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { normalizarConfig } from '../src/lib/corte/config';
import { construirListaCorte } from '../src/lib/corte/lista';
import { planDiarioDeCorte } from '../src/lib/corte/plan-diario';
import { planDeCorte } from '../src/lib/corte/plan-corte';
import { normalizarSnapshot, compararParametros, crearWorkbook, validarImagenes, diasExportables } from '../src/app/optimizador/guardados';
import { svgDePatron, dimensionesRaster } from '../src/app/optimizador/imagenes';

export function fixtureSnapshot() {
  const cfg=normalizarConfig({piezasPorDia:1,iteraciones:0,tiempoMaxMs:0,repartoTiempoMs:0});
  const modulos=[{lineaId:'linea',grupoId:null,codigo:'DB18',cocina:'Cocina',cantidad:2,piezasPorModulo:1,tableroPorRol:{gaveta:'G15'},piezas:[{pieza:'base_gaveta',rol:'gaveta',cant:1,largoIn:10,anchoIn:5,cantoLargos:2,cantoAnchos:0,cantoCalibre:'19x0,45'}]}];
  const tableros=[{codigo:'G15',espesor_mm:15,formato:'183X244',proveedor:'Proveedor'}];
  return {version:1 as const,cotizacionId:'94daaa25-b226-47e5-9ce8-4a2956bf3a87',cotizacionCodigo:'94DAAA25',proyectoNombre:'Proyecto / A',cfg,texturaPorMaterial:{G15:'Soft'},tableros,proyecto:{modulos,errores:[]},lista:construirListaCorte(modulos,tableros,cfg),planDiario:planDiarioDeCorte(modulos,1),planCorte:planDeCorte(modulos,tableros,cfg,()=> 'Soft',{tiempoMaxMs:0})};
}
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

test('snapshot conserva el estado íntegro y rechaza formas parciales, números inválidos y ausencia de esquemas',()=>{
  const input=fixtureSnapshot();const saved=normalizarSnapshot(input);assert.deepEqual(saved,input);assert.notStrictEqual(saved,input);
  assert.throws(()=>normalizarSnapshot({...input,lista:{filas:[]}}),/snapshot|lista/i);
  assert.throws(()=>normalizarSnapshot({...input,planCorte:null}),/snapshot|esquema|plan/i);
  const invalid=structuredClone(input);invalid.planCorte.dias[0].materiales[0].esquema.plan.patrones[0].colocaciones[0].x=NaN;assert.throws(()=>normalizarSnapshot(invalid),/finito|número|snapshot/i);
  assert.throws(()=>normalizarSnapshot({...input,planCorte:{...input.planCorte,dias:[],proyectoCompleto:{...input.planCorte.proyectoCompleto,materiales:[]}}}),/esquema/i);
});
test('compara cada parámetro y elementos anidados sin confundir elecciones de texturas con parámetros de planta',()=>{
  const a=fixtureSnapshot().cfg,b=normalizarConfig({...a,discoMm:5,desperdicioMaxPct:18,pilas:[{espesorMm:15,laminas:2}],criterio:['cortes','desperdicio','laminas','sobrante_ultima']});
  const cambios=compararParametros(a,b);assert(cambios.some(c=>c.campo==='discoMm'&&c.antes===4.4&&c.ahora===5));assert(cambios.some(c=>c.campo==='desperdicioMaxPct'&&c.antes===15&&c.ahora===18));assert(cambios.some(c=>c.campo.startsWith('pilas')));assert(cambios.some(c=>c.campo.startsWith('criterio')));assert.deepEqual(compararParametros(a,structuredClone(a)),[]);
});
test('Patron mínimo genera SVG autocontenido, escapa etiquetas y acota la rasterización a 2400 px',()=>{
  const p=fixtureSnapshot().planCorte.dias[0].materiales[0].esquema.plan.patrones[0];const svg=svgDePatron({...p,colocaciones:p.colocaciones.map(c=>({...c,etiqueta:'<script> & pieza'}))},2440,1830);
  assert.match(svg,/viewBox="0 0 2440 1830"/);assert.match(svg,/<rect/);assert.match(svg,/<text/);assert(!svg.includes('<script>'));assert(!/https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg','')));assert.deepEqual(dimensionesRaster(2440,1830),{ancho:2400,alto:1800});assert.throws(()=>dimensionesRaster(0,20));
});
test('imágenes completas, PNG reales y límites se validan antes de exportar',()=>{
  const s=fixtureSnapshot();const imagenes=Object.fromEntries(diasExportables(s).flatMap(d=>d.materiales.flatMap(m=>m.esquema.plan.patrones.map((_,i)=>[`${d.dia}-${m.material}-${i}`,png]))));
  assert.equal(Object.keys(validarImagenes(imagenes,s)).length,2);assert.throws(()=>validarImagenes({},s),/falta|imagen/i);assert.throws(()=>validarImagenes({...imagenes,'fuera':'data:image/svg+xml;base64,PHN2Zz4='},s));assert.throws(()=>validarImagenes(Object.fromEntries(Array.from({length:151},(_,i)=>[String(i),png])),s),/150/);assert.throws(()=>validarImagenes({'1-G15-0':'data:image/png;base64,'+'A'.repeat(6*1024*1024+1)},s),/6 MB/);
});
test('workbook contiene hojas en orden, números reales, imágenes, coordenadas y autor/fecha/proyecto de la fila guardada',async()=>{
  const resultado=fixtureSnapshot();const imagenes=Object.fromEntries(diasExportables(resultado).flatMap(d=>d.materiales.flatMap(m=>m.esquema.plan.patrones.map((_,i)=>[`${d.dia}-${m.material}-${i}`,png]))));
  const registro={id:'guardado',nombre:'Corrida prueba',proyecto_nombre:'Proyecto / A',autor_id:'autor',autor_email:'autor@example.com',created_at:'2026-11-06T15:16:17.123Z',cotizacion_id:resultado.cotizacionId,config:{...resultado.cfg,texturaPorMaterial:resultado.texturaPorMaterial},resultado};
  const wb=await crearWorkbook(registro,imagenes);const buffer=await wb.xlsx.writeBuffer();const read=new ExcelJS.Workbook();await read.xlsx.load(buffer);
  assert.deepEqual(read.worksheets.map(s=>s.name),['Resumen general','Resumen por material','Lista de corte','Plan de corte por día','Día 1','Día 2','Resumen consolidado']);
  const contenido=JSON.stringify(read.getWorksheet('Resumen general')!.getSheetValues());for(const value of ['Proyecto / A','Corrida prueba','autor@example.com','2026-11-06T15:16:17.123Z','discoMm','94DAAA25'])assert(contenido.includes(value),value);
  const corte=read.getWorksheet('Lista de corte')!;assert.equal(corte.getCell('C2').value,254);assert.equal(corte.getCell('E2').value,2);assert.equal(typeof corte.getCell('D2').value,'number');assert(corte.autoFilter);assert.equal(corte.getCell('F2').value,2);assert.equal(corte.getCell('G2').value,0);
  for(const n of [1,2]){const ws=read.getWorksheet(`Día ${n}`)!;assert.equal(ws.getImages().length,1);const text=JSON.stringify(ws.getSheetValues());for(const label of ['Colocaciones','Sobrantes','X (mm)','Girada','Reutilizable'])assert(text.includes(label),label);}
  assert.equal(read.getWorksheet('Día 1')!.getImages()[0].range.ext.width>0,true);
});
