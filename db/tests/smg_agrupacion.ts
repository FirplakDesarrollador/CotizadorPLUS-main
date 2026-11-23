// Auditoría de solo lectura del catálogo desplegado y el motor productivo.
// node --conditions=react-server --env-file=.env --import tsx db/tests/smg_agrupacion.ts
import assert from 'node:assert/strict';
import { cargarCatalogoPrecompilado, cotizarGrupo, type CotizarInput } from '../../src/lib/cotizar';

async function main() {
const catalogo=await cargarCatalogoPrecompilado();
const tipos=Object.values(catalogo.tiposById).filter(t=>t.pref.includes('SMG'));
assert.equal(tipos.length,18,'Inventario SMG auditado: cuatro carcasas y catorce cajoneras');
const boards=Object.values(catalogo.tablerosByCode);
const caja=boards.find(b=>Number(b.espesor_mm)===15)!;
const frente=boards.find(b=>Number(b.espesor_mm)===18)!;
const fondo=boards.find(b=>Number(b.espesor_mm)===6)!;
assert.ok(caja && frente && fondo);
function input(tipoId:string):CotizarInput {
  return {tipoId,largo:24,alto:30,prof:24,unidad:'in',conHerrajes:true,
    preset:{caja:caja.codigo,refuerzo:caja.codigo,frente:frente.codigo,fondo:fondo.codigo},
    margenOverride:0.5,trm:4000};
}
for(const tipo of tipos) {
  assert.equal(tipo.permite_agrupacion,true,tipo.pref);
  const inputs=[input(tipo.id),input(tipo.id)];
  const single=await cotizarGrupo([inputs[0]],catalogo);
  const group=await cotizarGrupo(inputs,catalogo);
  const rows=group.lineas.flatMap(line=>line.piezas);
  assert.equal(rows.filter(p=>p.pieza==='lateral').reduce((s,p)=>s+p.cant,0),3,tipo.pref);
  assert.ok(group.piezasContinuas.includes('base'),tipo.pref);
  assert.equal(rows.some(p=>p.pieza==='fondo'),false,tipo.pref);
  assert.ok(single.lineas[0].piezas.some(p=>p.pieza==='fondo')!==tipo.pref.endsWith('-SF'),tipo.pref);
  assert.ok(rows.every(p=>Number.isFinite(p.largoIn)&&Number.isFinite(p.anchoIn)),tipo.pref);
  await assert.rejects(()=>cotizarGrupo([inputs[0],{...inputs[1],prof:22}],catalogo),/profundidad/i);
}
// Cruces entre familias SMG: el refuerzo frontal solo continúa si es homologable.
const bfd=tipos.find(t=>t.pref==='BFD-SMG')!;
for(const tipo of tipos) {
  const group=await cotizarGrupo([input(bfd.id),input(tipo.id)],catalogo);
  assert.equal(group.laterales,3,tipo.pref);
  assert.ok(group.piezasContinuas.includes('base'),tipo.pref);
}
console.log(`SMG: ${tipos.length} variantes agrupadas y ${tipos.length} cruces con BFD-SMG; bloqueos y fondo verificados. Sin escrituras.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
