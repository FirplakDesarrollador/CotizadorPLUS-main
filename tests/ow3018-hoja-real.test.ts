import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza } from '../src/lib/engine';

// Hoja actualizada: OW3018 MBLE SUP COC SIN PUERTAS. L=30in, A=18in, P=12in.
const piezas: Pieza[] = [
  { nombre:'base', rol_tablero:'caja', formula_cantidad:'1', formula_largo:'L-1.417323', formula_ancho:'P', cantos:{ calibre:'22x1', largos:2, anchos:2, forceCalibre:true }, tarugos:8 },
  { nombre:'tapa', rol_tablero:'caja', formula_cantidad:'1', formula_largo:'L-1.417323', formula_ancho:'P', cantos:{ calibre:'22x1', largos:2, forceCalibre:true }, tarugos:8 },
  { nombre:'lateral', rol_tablero:'caja', formula_cantidad:'2', formula_largo:'A', formula_ancho:'P', cantos:{ calibre:'22x1', largos:2, anchos:2, forceCalibre:true } },
  { nombre:'refuerzo_trasero', rol_tablero:'refuerzo', formula_cantidad:'2', formula_largo:'L-1.417323', formula_ancho:'3.14961', cantos:{ calibre:'22x1', largos:2, forceCalibre:true }, tarugos:4 },
  { nombre:'entrepano', rol_tablero:'refuerzo', formula_cantidad:'n_entrepanos', formula_largo:'L-1.417323', formula_ancho:'P-1.5', cantos:{ calibre:'22x1', largos:2, anchos:2, forceCalibre:true }, soportes:4 },
  { nombre:'fondo', rol_tablero:'fondo', formula_cantidad:'1', formula_largo:'A-0.866142', formula_ancho:'L-0.866142', cantos:{} },
];

const input: CalcInput = {
  dims:{ L:30, A:18, P:12 }, piezas, reglas:[], herrajesPlantilla:[], overrides:{ n_entrepanos:1 },
  preset:{ caja:'CAJA18', refuerzo:'REF18', fondo:'FONDO6' },
  tablerosByCode:{ CAJA18:{ codigo:'CAJA18',precio_m2:1,espesor_mm:18 }, REF18:{ codigo:'REF18',precio_m2:1,espesor_mm:18 }, FONDO6:{ codigo:'FONDO6',precio_m2:1,espesor_mm:6 } },
  cantosByCalibre:{ '22X1':{ calibre:'22x1',precio:1 } }, herrajesByCode:{}, consumiblesBySelector:{},
  etiquetasUnd:0, usaCarton:true, margen:0, margenHerraje:0, trm:1, desperdicio:0,
};

function assertPieza(result: ReturnType<typeof calcularMueble>, nombre:string, cant:number, largo:number, ancho:number) {
  const pieza=result.piezas.find((p)=>p.pieza===nombre);
  assert.ok(pieza, `falta ${nombre}`); assert.equal(pieza.cant,cant);
  assert.ok(Math.abs(pieza.largoIn*25.4-largo)<0.05, `${nombre} largo`);
  assert.ok(Math.abs(pieza.anchoIn*25.4-ancho)<0.05, `${nombre} ancho`);
}

test('OW3018 reproduce las ocho piezas de su hoja actualizada', () => {
  const result=calcularMueble(input);
  assertPieza(result,'base',1,726,304.8);
  assertPieza(result,'tapa',1,726,304.8);
  assertPieza(result,'lateral',2,457.2,304.8);
  assertPieza(result,'refuerzo_trasero',2,726,80);
  assertPieza(result,'entrepano',1,726,266.7);
  assertPieza(result,'fondo',1,435.2,740);
  assert.equal(result.piezas.reduce((n,p)=>n+p.cant,0),8);
  assert.deepEqual(result.cantoPorCalibre.map((c)=>c.calibre),['22x1']);
  assert.equal(result.cantidadesConsumibles.tarugos,24);
  assert.equal(result.cantidadesConsumibles.soportes,4);
  assert.equal(result.cantidadesConsumibles.carton,0.5);
});
