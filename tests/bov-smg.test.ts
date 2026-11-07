import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularMueble, derivarVars, geoVars, type CalcInput, type Pieza } from '../src/lib/engine';
import { normalizarPlantillasFabricacion, ajustarGeometriaBov } from '../src/lib/reglas-fabricacion';
import { ajustarPiezasSinFondo, orientarPieza } from '../src/lib/muebles';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { codigoComercial } from '../src/lib/module-groups';
import { descripcionModulo } from '../src/app/hdr/datosHdr';

const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-TC', modo_agrupacion: 'continua_opcional', clave_fusion: 'base', formula_largo_grupo: 'LG-2*TC', visualizacion: { version: 1, funcion: 'base', plano: 'XY', intercambiar: false, z: '0', confirmado: true } },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', modo_agrupacion: 'lateral_compartido', visualizacion: { version: 1, funcion: 'lateral', plano: 'YZ', intercambiar: false, confirmado: true } },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '80/25.4', visualizacion: { version: 1, funcion: 'travesano_posterior', plano: 'XZ', intercambiar: false, z: 'I===0?TC:A-H', confirmado: true } },
  { nombre: 'refuerzo_delantero', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: '80/25.4', visualizacion: { version: 1, funcion: 'travesano_frontal', plano: 'XZ', intercambiar: false, y: '0', z: 'A-H', confirmado: true } },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'A-RV', visualizacion: { version: 1, funcion: 'frente', plano: 'XZ', intercambiar: false, y: '-EP', z: '0', confirmado: true } },
];
const mm = (v: number) => v / 25.4;
function entrada(pref: string, caja = 15, refuerzo = 15): CalcInput {
  return { dims: { L: mm(800), A: mm(785), P: mm(610) }, piezas: ajustarGeometriaBov(normalizarPlantillasFabricacion(piezas, pref), pref), reglas: [], preset: { caja: 'C', refuerzo: 'R', frente: 'F' }, tablerosByCode: { C: { codigo: 'C', espesor_mm: caja, precio_m2: 10 }, R: { codigo: 'R', espesor_mm: refuerzo, precio_m2: 10 }, F: { codigo: 'F', espesor_mm: 18, precio_m2: 20 } }, cantosByCalibre: {}, herrajesPlantilla: [], herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0, usaCarton: false, margen: 0, trm: 3100, desperdicio: 0 };
}
const cerca = (actual: number, esperado: number) => assert.ok(Math.abs(actual - esperado) < .001, `${actual} ≠ ${esperado}`);

test('BOV y BOV-SMG sin holguras, con frente interno y base hasta el refuerzo real', () => {
  for (const caja of [15, 18]) for (const refuerzo of [15, 18]) for (const pref of ['BOV', 'BOV-SF', 'BOV-SMG']) {
    const cfg = entrada(pref, caja, refuerzo), result = calcularMueble(cfg);
    const frente = orientarPieza(result.piezas.find(p => p.pieza === 'frente')!);
    cerca(frente.largoIn * 25.4, 785 - caja - (pref === 'BOV-SMG' ? 73 : 0));
    cerca(frente.anchoIn * 25.4, 800 - 2 * caja);
    cerca(result.piezas.find(p => p.pieza === 'base')!.anchoIn * 25.4, 610 - refuerzo);
    const sinFondo = calcularMueble({ ...cfg, piezas: ajustarPiezasSinFondo(cfg.piezas, pref, false) });
    cerca(sinFondo.piezas.find(p => p.pieza === 'base')!.anchoIn * 25.4, 610 - refuerzo);
  }
});

test('BOV-SMG difiere de BOV solo en el alto del frente; posición entre laterales y sobre base', () => {
  const bov = entrada('BOV'), smg = entrada('BOV-SMG');
  const a = calcularMueble(bov), b = calcularMueble(smg);
  assert.deepEqual(a.piezas.filter(p => p.pieza !== 'frente'), b.piezas.filter(p => p.pieza !== 'frente'));
  cerca((a.piezas.find(p => p.pieza === 'frente')!.anchoIn - b.piezas.find(p => p.pieza === 'frente')!.anchoIn) * 25.4, 73);
  assert.equal(b.piezas.reduce((n, p) => n + p.cant, 0), 7);
  const members: PreparedGroupMember[] = [{ pref: 'BOV-SMG', permiteAgrupacion: true, calc: smg }];
  const escena = construirVisualizacion(members, calcularGrupoFisico(members));
  const frente = escena.paneles.find(p => p.nombre === 'frente')!;
  cerca(frente.x, 15); cerca(frente.y, 0); cerca(frente.z, 15);
  cerca(800 - frente.x - frente.w, 15); cerca(785 - frente.z - frente.h, 73);
  const rail = escena.paneles.find(p => p.nombre === 'refuerzo_delantero')!;
  assert.ok(rail.y >= frente.y + frente.d, 'el refuerzo queda detrás del frente, sin interpenetración');
  assert.equal(escena.avisos.length, 0);
});

test('BOV-SMG conserva la agrupación de carcasa y los códigos comerciales en las tres unidades', () => {
  const members: PreparedGroupMember[] = [entrada('BOV-SMG'), entrada('BOV-SMG')].map(calc => ({ pref: 'BOV-SMG', permiteAgrupacion: true, calc }));
  const grupo = calcularGrupoFisico(members);
  assert.equal(grupo.lineas.flatMap(l => l.piezas).filter(p => p.pieza === 'lateral').reduce((n,p)=>n+p.cant,0), 3);
  for (const [unidad, factor] of [['cm',1],['mm',10],['in',1/2.54]] as const) assert.match(codigoComercial({ pref: 'BOV-SMG', largo: 80*factor, alto:78.5*factor,prof:61*factor,unidad,sistema:'metrico' }), /^BOV8078.561-SMG/);
  assert.equal(piezas[0].formula_ancho, 'P-TC', 'no modifica la fuente histórica de plantilla');
});

test('TR usa el refuerzo real y conserva compatibilidad; HDR no inventa entrepaños en BOV', () => {
  const cfg = entrada('BOV', 15, 18);
  const reglas = [{ tipo_mueble_id: null, variable: 'TR', condicion: 'true', valor: 'typeof TR === typeof TC ? TR : TC', prioridad: 5 }];
  cerca(derivarVars(reglas, cfg.dims, {}, geoVars(cfg)).TR * 25.4, 18);
  cerca(derivarVars(reglas, cfg.dims, {}, { TC: mm(15) }).TR * 25.4, 15);
  const result = { ...calcularMueble(cfg), trm: 3100, margen: 0, vars: { n_puertas: 2, n_entrepanos: 3 } };
  assert.equal(descripcionModulo(result, 'BOV-SMG'), '1 PUERTA');
});
