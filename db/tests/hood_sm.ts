// Auditoría de solo lectura: catálogo desplegado, preparación y montaje reales.
// node --conditions=react-server --env-file=.env --import tsx db/tests/hood_sm.ts
import assert from 'node:assert/strict';
import { cargarCatalogoPrecompilado, cotizarGrupo, type CotizarInput } from '../../src/lib/cotizar';
import { construirVisualizacion } from '../../src/lib/visualizacion';

async function main() {
 const catalogo=await cargarCatalogoPrecompilado();
 const boards=Object.values(catalogo.tablerosByCode);
 const caja=boards.find(b=>Number(b.espesor_mm)===15)!;
 const frente=boards.find(b=>Number(b.espesor_mm)===18)!;
 const fondo=boards.find(b=>Number(b.espesor_mm)===6)!;
 const approx=(a:number,b:number)=>assert.ok(Math.abs(a-b)<0.001,`${a} ≈ ${b}`);
 const inputs:CotizarInput[]=[];
 for(const pref of ['TW-SM-HOOD','W-SM-HOOD']) {
  const tipo=Object.values(catalogo.tiposById).find(t=>t.pref===pref);
  assert.ok(tipo,pref);
  const input:CotizarInput={tipoId:tipo.id,largo:65,alto:70,prof:35,unidad:'cm',conHerrajes:true,
   preset:{caja:caja.codigo,refuerzo:caja.codigo,frente:frente.codigo,fondo:fondo.codigo},
   overrides:{HOOD:350/25.4,FREE:100/25.4,n_puertas:9},margenOverride:0.5};
  const group=await cotizarGrupo([input],catalogo);
  const scene=construirVisualizacion(group.preparados,group);
  const panels=scene.paneles;
  approx(group.preparados[0].calc.dims.A*25.4,350);
  approx(scene.modulos[0].alto,700);approx(scene.modulos[0].z,-350);
  const falseFront=panels.find(p=>p.nombre==='frente_falso')!;
  approx(falseFront.h,395.95);approx(falseFront.z,-250);
  for(const door of panels.filter(p=>p.nombre==='frente')) approx(door.z-falseFront.z-falseFront.h,30);
  assert.equal(panels.filter(p=>p.nombre==='frente').length,pref.startsWith('TW')?1:2);
  approx(panels.find(p=>p.nombre==='fondo')!.h,334);
  approx(panels.find(p=>p.nombre==='fondo')!.w,634);
  assert.deepEqual(scene.avisos,[]);
  assert.equal(group.lineas[0].cantidadesConsumibles.tarugos,46,pref);
  approx(group.lineas[0].consumibles.tarugos,46*catalogo.consumiblesBySelector.tarugo);
  await assert.rejects(()=>cotizarGrupo([{...input,overrides:{HOOD:350/25.4}}],catalogo),/FREE/);
  await assert.rejects(()=>cotizarGrupo([{...input,overrides:{HOOD:350/25.4,FREE:360/25.4}}],catalogo),/FREE/);
  await assert.rejects(()=>cotizarGrupo([{...input,alto:40}],catalogo),/entrepaño/);
  for(const unidad of ['mm','in'] as const) {
   const factor=unidad==='mm'?10:10/25.4;
   const converted=await cotizarGrupo([{...input,unidad,largo:65*factor,alto:70*factor,prof:35*factor}],catalogo);
   approx(converted.preparados[0].calc.dims.A*25.4,350);
  }
  inputs.push(input);
 }
 const grouped=await cotizarGrupo(inputs,catalogo);
 assert.equal(grouped.laterales,3);
 assert.equal(grouped.lineas.reduce((s,l)=>s+l.cantidadesConsumibles.tarugos,0),78);
 console.log('TW/W-SM-HOOD: 46 tarugos individuales, costo de catálogo, agrupación, geometría y unidades aprobados. Sin escrituras.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
