import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';
import { orientarPieza } from '../src/lib/muebles';

// Hoja real "HRJ DB18-1S · MUEBLE INF COC 3 GAVETAS 1 PEQUEÑA CARB2"
// (L=18", A=30", P=24"). Fórmulas tal como quedaron tras la migración 0053.

const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: { calibre: '19x0,45', largos: 2, anchos: 2 } },
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'refuerzo_delantero', rol_tablero: 'refuerzo', formula_cantidad: '(n_cajones)-gola', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'base_gaveta', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones', formula_largo: 'L-4.13386', formula_ancho: 'P-4.63', cantos: { calibre: '19x0,45', largos: 2, anchos: 0 } },
  { nombre: 'trasero_gaveta_pequena', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L-4.607', formula_ancho: '68/25.4', cantos: { calibre: '19x0,45', largos: 1, anchos: 0 } },
  { nombre: 'trasero_gaveta_grande', rol_tablero: 'refuerzo', formula_cantidad: 'n_cajones-n_cajones_pequenos', formula_largo: 'L-4.607', formula_ancho: '183/25.4', cantos: { calibre: '19x0,45', largos: 1, anchos: 2 } },
  { nombre: 'frente_gaveta_pequena', rol_tablero: 'frente', formula_cantidad: 'n_cajones_pequenos', formula_largo: 'L-RV', formula_ancho: 'alto_frente_pequeno', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'frente_gaveta_grande', rol_tablero: 'frente', formula_cantidad: 'n_cajones-n_cajones_pequenos', formula_largo: 'L-RV', formula_ancho: '(A-n_cajones*RV-n_cajones_pequenos*alto_frente_pequeno)/(n_cajones-n_cajones_pequenos)', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'gola', condicion: 'true', valor: '0', prioridad: 5 },
  { tipo_mueble_id: null, variable: 'alto_frente_pequeno', condicion: 'true', valor: '6', prioridad: 10 },
];

// DB-1S: 3 gavetas, 1 pequeña (ver DB_TIPOLOGIAS en src/lib/muebles.ts).
function input(L = 18, A = 30, P = 24, overrides: Record<string, number> = { n_cajones: 3, n_cajones_pequenos: 1 }): CalcInput {
  return {
    dims: { L, A, P }, piezas, reglas, herrajesPlantilla: [], overrides,
    preset: { caja: 'C', refuerzo: 'R', frente: 'F', fondo: 'B' },
    tablerosByCode: {
      C: { codigo: 'C', precio_m2: 1, espesor_mm: 15 }, R: { codigo: 'R', precio_m2: 1, espesor_mm: 15 },
      F: { codigo: 'F', precio_m2: 1, espesor_mm: 18 }, B: { codigo: 'B', precio_m2: 1, espesor_mm: 6 },
    },
    cantosByCalibre: { '19X0,45': { calibre: '19x0,45', precio: 1 }, '22X1': { calibre: '22x1', precio: 1 } },
    herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
  };
}

const par = (a: number, b: number) => [a, b].sort((x, y) => x - y);
function assertPieza(r: ReturnType<typeof calcularMueble>, nombre: string, cant: number, l: number, a: number, tol = 0.1) {
  const p = r.piezas.find((x) => x.pieza === nombre);
  assert.ok(p, `falta la pieza ${nombre}`);
  assert.equal(Math.round(p.cant), cant, `cantidad de ${nombre}`);
  const o = orientarPieza(p);
  const [menor, mayor] = par(o.largoIn * 25.4, o.anchoIn * 25.4);
  const [emenor, emayor] = par(l, a);
  assert.ok(Math.abs(menor - emenor) < tol && Math.abs(mayor - emayor) < tol,
    `${nombre}: ${menor.toFixed(2)} x ${mayor.toFixed(2)} vs hoja ${emenor} x ${emayor}`);
}

test('DB18-1S reproduce la hoja real de producción', () => {
  const r = calcularMueble(input());

  assert.equal(r.vars.n_cajones, 3);
  assert.equal(r.vars.n_cajones_pequenos, 1);

  assertPieza(r, 'base', 1, 427.2, 585.6);
  assertPieza(r, 'lateral', 2, 762, 609.6);
  assertPieza(r, 'refuerzo_delantero', 3, 427.2, 80);      // tres rieles delanteros, uno por gaveta
  assertPieza(r, 'refuerzo_trasero', 2, 427.2, 80);
  assertPieza(r, 'base_gaveta', 3, 352.2, 492);            // FONDO GAVETA
  assertPieza(r, 'trasero_gaveta_pequena', 1, 340.2, 68);  // TRASERO CAJON SUP
  assertPieza(r, 'trasero_gaveta_grande', 2, 340.2, 183);  // TRASERO CAJON CENTRAL / INF
  assertPieza(r, 'frente_gaveta_pequena', 1, 152.4, 454);  // FRENTE GAVETA SUP
  // La hoja dice 300.08; el motor da 300.00. La diferencia de 0.08 mm está por
  // debajo de cualquier tolerancia de corte y no se persigue.
  assertPieza(r, 'frente_gaveta_grande', 2, 300.08, 454, 0.15);
  assertPieza(r, 'fondo', 1, 760, 441.2);                  // BACKING
});

test('la base de gaveta resta 105 mm exactos, no 104.9', () => {
  // `L-4.13` daba 352.298 en L=18": 0.098 mm largo. Ver migración 0053.
  const r = calcularMueble(input());
  const largo = r.piezas.find((p) => p.pieza === 'base_gaveta')!.largoIn * 25.4;
  assert.ok(Math.abs(largo - 352.2) < 0.01, `base_gaveta ${largo.toFixed(3)} mm, esperaba 352.200`);
  // Escala: en cualquier medida son 105 mm menos que el largo del mueble.
  const r24 = calcularMueble(input(24));
  const largo24 = r24.piezas.find((p) => p.pieza === 'base_gaveta')!.largoIn * 25.4;
  assert.ok(Math.abs(largo24 - (24 * 25.4 - 105)) < 0.01, `en L=24" esperaba ${24 * 25.4 - 105}`);
});

test('el reparto de frentes sigue la tipología de cajonera', () => {
  // DB-3: tres gavetas iguales, sin pequeña. Los tres frentes se reparten el alto.
  const r = calcularMueble(input(18, 30, 24, { n_cajones: 3, n_cajones_pequenos: 0 }));
  const grandes = r.piezas.find((p) => p.pieza === 'frente_gaveta_grande')!;
  assert.equal(Math.round(grandes.cant), 3);
  const alto = grandes.anchoIn * 25.4;
  assert.ok(Math.abs(alto - (762 - 3 * 3.2) / 3) < 0.1, `frente ${alto.toFixed(2)} mm`);
  // Sin gaveta pequeña no se corta su frente ni su trasero.
  assert.ok(!(r.piezas.find((p) => p.pieza === 'frente_gaveta_pequena')?.cant ?? 0), 'no debe haber frente pequeño');
});
