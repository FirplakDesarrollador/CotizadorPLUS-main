import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';

// Espejo de 0264: SBFD es la copia de SBFD-SM sin gola de madera, con el
// refuerzo delantero de 128 mm pegado a la cara posterior de los frentes y la
// puerta recortada 3,2 mm desde arriba (A-RV).
const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: {}, tarugos: 8 },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  {
    nombre: 'refuerzo_delantero', rol_tablero: 'caja', formula_cantidad: '1',
    formula_largo: 'L-2*TC', formula_ancho: '128/25.4', cantos: {}, tarugos: 4,
    visualizacion: {
      version: 1, funcion: 'travesano_frontal', plano: 'XZ', intercambiar: false,
      y: '0', confirmado: true,
    },
  },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: {}, tarugos: 4 },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A-RV', cantos: {} },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L < 24', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L >= 24', valor: '2', prioridad: 20 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 99 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'true', valor: '0', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_cajones', condicion: 'true', valor: '0', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_patas', condicion: 'L>36', valor: '5', prioridad: 4 },
  { tipo_mueble_id: null, variable: 'n_patas', condicion: 'true', valor: '4', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'gola', condicion: 'true', valor: '0', prioridad: 10 },
];

function input(): CalcInput {
  return {
    dims: { L: 30, A: 30, P: 24 }, piezas, reglas,
    preset: { caja: 'CAJA', refuerzo: 'REFUERZO', frente: 'FRENTE', fondo: 'FONDO' },
    tablerosByCode: {
      CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 15 },
      REFUERZO: { codigo: 'REFUERZO', precio_m2: 1, espesor_mm: 15 },
      FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
      FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
    },
    herrajesPlantilla: [
      { rol: 'pata', herraje_codigo: 'PATA10AJUST', selector_key: 'pata', formula_cantidad: 'n_patas' },
      { rol: 'tornillo', herraje_codigo: 'TORNILLO858', selector_key: 'tornillo', formula_cantidad: 'n_patas*4' },
      { rol: 'bisagra', herraje_codigo: 'BISAGRAPAR', selector_key: 'bisagra', formula_cantidad: 'n_puertas' },
      { rol: 'manija', herraje_codigo: 'MANIJA415', selector_key: 'manija', formula_cantidad: 'n_puertas + n_cajones' },
    ],
    herrajesByCode: {
      PATA10AJUST: { codigo: 'PATA10AJUST', precio: 1 },
      TORNILLO858: { codigo: 'TORNILLO858', precio: 1 },
      BISAGRAPAR: { codigo: 'BISAGRAPAR', precio: 1 },
      MANIJA415: { codigo: 'MANIJA415', precio: 1 },
    },
    cantosByCalibre: {}, consumiblesBySelector: {}, etiquetasUnd: 0,
    margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
  };
}

const mm = (inches: number) => inches * 25.4;
const pieza = (r: ReturnType<typeof calcularMueble>, nombre: string) => r.piezas.find((p) => p.pieza === nombre)!;
const approx = (actual: number, esperado: number, etiqueta: string) =>
  assert.ok(Math.abs(actual - esperado) < 0.1, `${etiqueta}: ${actual.toFixed(2)} mm ≈ ${esperado} mm`);

test('SBFD copia SBFD-SM sin gola, con refuerzo de 128 mm y puerta A-RV', () => {
  const r = calcularMueble(input());
  assert.equal(r.vars.n_entrepanos, 0);
  assert.equal(r.vars.n_cajones, 0);
  assert.equal(r.vars.gola, 0);
  assert.equal(r.vars.n_puertas, 2);
  assert.equal(r.piezas.some((p) => p.pieza === 'gola_madera'), false, 'SBFD no lleva gola de madera');
  assert.equal(r.piezas.some((p) => p.pieza === 'entrepano'), false, 'SBFD no lleva entrepaño');

  approx(mm(pieza(r, 'base').largoIn), 732, 'largo de base');
  approx(mm(pieza(r, 'base').anchoIn), 585.6, 'profundidad de base');
  approx(mm(pieza(r, 'refuerzo_delantero').largoIn), 732, 'largo del refuerzo delantero');
  approx(mm(pieza(r, 'refuerzo_delantero').anchoIn), 128, 'alto del refuerzo delantero');
  approx(mm(pieza(r, 'frente').largoIn), 377.8, 'ancho de cada puerta');
  approx(mm(pieza(r, 'frente').anchoIn), 758.8, 'alto de puerta con reveal de 3,2 mm');
  approx(mm(pieza(r, 'fondo').largoIn), 760, 'alto del fondo');
  approx(mm(pieza(r, 'fondo').anchoIn), 746, 'largo del fondo');

  const manija = r.herrajes.find((h) => h.rol === 'manija');
  assert.ok(manija, 'SBFD sin gola debe cotizar manijas');
  assert.equal(manija?.cant, 2);
  assert.equal(r.herrajes.find((h) => h.rol === 'bisagra')?.cant, 2);
  assert.equal(r.herrajes.find((h) => h.rol === 'pata')?.cant, 4);
});

test('SBFD monta el refuerzo delantero inmediatamente detrás de los frentes', () => {
  const calc = input();
  const member: PreparedGroupMember = { pref: 'SBFD', permiteAgrupacion: false, calc };
  const scene = construirVisualizacion([member], calcularGrupoFisico([member]));

  assert.equal(scene.paneles.some((p) => p.funcion === 'gola'), false, 'no debe dibujarse gola');

  const refuerzo = scene.paneles.find((p) => p.nombre === 'refuerzo_delantero')!;
  const puerta = scene.paneles.find((p) => p.funcion === 'frente')!;
  assert.ok(refuerzo && puerta);

  approx(refuerzo.h, 128, 'alto visual del refuerzo');
  approx(refuerzo.z, 762 - 128, 'el refuerzo remata en la cara superior');
  approx(refuerzo.y, 0, 'el refuerzo arranca en el plano frontal de la carcasa');
  approx(puerta.y + puerta.d, 0, 'la cara posterior de la puerta está en el plano frontal');
  assert.equal(refuerzo.y, puerta.y + puerta.d, 'el refuerzo queda pegado a la cara posterior de la puerta');
  approx(puerta.h, 758.8, 'alto visual de la puerta');
  approx(puerta.z + puerta.h, 758.8, 'la puerta deja 3,2 mm libres arriba');
});
