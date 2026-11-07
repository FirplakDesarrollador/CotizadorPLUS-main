import test from 'node:test';
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { calcularMueble } from '../src/lib/engine';
import { consolidarModulosHdr } from '../src/app/hdr/datosHdr';

const individual=calcularMueble({dims:{L:20,A:30,P:24},piezas:[{nombre:'base',rol_tablero:'caja',formula_cantidad:'1',formula_largo:'L',formula_ancho:'P'}],reglas:[],preset:{caja:'C15'},tablerosByCode:{C15:{codigo:'C15',espesor_mm:15,precio_m2:100}},cantosByCalibre:{},herrajesByCode:{},herrajesPlantilla:[],consumiblesBySelector:{},etiquetasUnd:0,margen:0,trm:4000,desperdicio:0});
const linea=(id:string,grupo:string|null,cantidad=1)=>({id,grupo_id:grupo,tipo_mueble_id:'tipo',pref:'BFD',codigo_modulo:'BFD20',cantidad,config:{},largo:20,alto:30,prof:24,unidad_dim:'in'});
let fallar=false,catalogos=0;
const loader=Module as unknown as {_load:(id:string,...args:unknown[])=>unknown},old=loader._load;
loader._load=function(id,...args){
  if(id==='server-only')return {};
  if(id.includes('/lib/auth'))return {getUserAndRole:async()=>({rol:'admin'})};
  if(id.includes('/lib/cotizaciones'))return {getCotizacion:async()=>({cocinas:[{nombre:'A',cantidad:4,lineas:[linea('a','g'),linea('b','g')]},{nombre:'B',cantidad:2,lineas:[linea('c',null,3)]}],lineasSinCocina:[]}),inputDesdeLinea:()=>({tipoId:'tipo',trm:4000})};
  if(id.includes('/lib/cotizar'))return {cargarCatalogoPrecompilado:async()=>{catalogos++;return {};},cotizar:async()=>({...individual,trm:4000,margen:0}),cotizarGrupo:async()=>{
    if(fallar)throw Error('Fallo del grupo');
    return {lineas:[0,1].map(()=>({...individual,piezas:[{...individual.piezas[0],cant:0.5,compartida:true,claveFusion:'base',origen:'Grupo A (A1 + A2)'}]})),preparados:[{margen:0},{margen:0}],largoTotalIn:40,laterales:3,uniones:1,piezasContinuas:['base']};
  }};
  return old.call(this,id,...args);
};
const actions=createRequire(import.meta.url)('../src/app/hdr/actions.ts') as typeof import('../src/app/hdr/actions');
loader._load=old;

test('una HDR de grupo conserva todos sus módulos, repeticiones y una sola pieza compartida', async()=>{
  const raw=await actions.modulosDeCotizacionAction('q'),out=consolidarModulosHdr(raw);
  assert.equal(catalogos,1);
  assert.equal(out.length,2);
  const grupo=out.find(m=>m.grupoId==='g')!;
  assert.equal(grupo.cantidad,4);assert.equal(grupo.origenes?.length,2);
  assert.ok(grupo.ok);assert.equal(grupo.result.piezas[0].cant,1);
  assert.equal(out.flatMap(m=>m.origenes??[]).reduce((n,o)=>n+o.cantidad*o.repeticionesArea,0),14);
});

test('fallos del grupo no pierden integrantes ni sus repeticiones del área', async()=>{
  fallar=true;
  try{const out=consolidarModulosHdr(await actions.modulosDeCotizacionAction('q'));const errores=out.filter(m=>!m.ok);assert.equal(errores.length,2);assert.deepEqual(errores.map(m=>m.cantidad),[4,4]);assert.deepEqual(errores.map(m=>m.lineaId),['a','b']);}
  finally{fallar=false;}
});
