import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import { construirVisualizacion } from '../src/lib/visualizacion';

const migration = fs.readFileSync('db/migrations/0197_sbfd_smg.sql', 'utf8');

const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P-0.70866-TB', cantos: {}, visualizacion: { version: 1, funcion: 'base', plano: 'XY', intercambiar: false, x: 'TC', y: '0', z: '0', confirmado: true } },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {}, visualizacion: { version: 1, funcion: 'lateral', plano: 'YZ', intercambiar: false, x: 'I*(L-TC)', y: '0', z: '0', confirmado: true, recorte: { borde: 'frontal_superior', profundidad: '27', alto: '73' } } },
  { nombre: 'refuerzo_delantero', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: '80/25.4', cantos: {}, visualizacion: { version: 1, funcion: 'travesano_frontal', plano: 'XY', intercambiar: false, x: 'TC', y: '27', z: 'A-TC', confirmado: true } },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '80/25.4', cantos: {} },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '2', formula_largo: '(L-2*RV)/2', formula_ancho: 'A-30/25.4', cantos: {} },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-0.07874', formula_ancho: 'L-0.62992', cantos: {}, visualizacion: { version: 1, funcion: 'respaldo', plano: 'XZ', intercambiar: true, confirmado: true } },
];
const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'true', valor: '0', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '2', prioridad: 10 },
];
const input: CalcInput = {
  dims: { L: 38, A: 30, P: 24 }, piezas, reglas,
  preset: { caja: 'CAJA', refuerzo: 'CAJA', frente: 'FRENTE', fondo: 'FONDO' },
  tablerosByCode: {
    CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 15 },
    FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
    FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
  },
  cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0,
  margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
};
const mm = (inches: number) => inches * 25.4;
const approx = (actual: number, esperado: number) => assert.ok(Math.abs(actual - esperado) < 0.1, `${actual} ≈ ${esperado}`);

test('SBFD-SMG conserva las ocho piezas de la hoja y agrega el fondo estándar', () => {
  const resultado = calcularMueble(input);
  assert.equal(resultado.piezas.reduce((total, pieza) => total + pieza.cant, 0), 9);
  assert.equal(resultado.piezas.some((pieza) => ['entrepano', 'gola_madera'].includes(pieza.pieza)), false);
  const porNombre = Object.fromEntries(resultado.piezas.map((pieza) => [pieza.pieza, pieza]));
  approx(mm(porNombre.base.largoIn), 935.2);
  approx(mm(porNombre.base.anchoIn), 585.6);
  approx(mm(porNombre.lateral.largoIn), 762);
  approx(mm(porNombre.lateral.anchoIn), 609.6);
  approx(mm(porNombre.refuerzo_delantero.largoIn), 935.2);
  approx(mm(porNombre.refuerzo_delantero.anchoIn), 80);
  approx(mm(porNombre.frente.largoIn), 479.4);
  approx(mm(porNombre.frente.anchoIn), 732);
  approx(mm(porNombre.fondo.largoIn), 760);
  approx(mm(porNombre.fondo.anchoIn), 949.2);
});

test('SBFD-SMG registra montaje confirmado contra el IGES y no copia manijas', () => {
  assert.match(migration, /HRJ SBFD33 SMG\.iges/);
  assert.match(migration, /"confirmado":true/);
  assert.doesNotMatch(migration, /'manija'/);
  assert.match(migration, /'fondo','fondo','1','A-0\.07874','L-0\.62992'/);
  assert.match(migration, /"funcion":"respaldo"/);
  assert.match(migration, /p\.nombre in \('entrepano','gola_madera'\)/);
  assert.match(migration, /refuerzo_delantero[\s\S]*?"plano":"XY"[\s\S]*?"y":"27"[\s\S]*?"z":"A-TC"/);
});

test('SBFD-SMG visualiza fondo, riel superior y mecanizado 27 × 73 en ambos laterales', () => {
  const member: PreparedGroupMember = {
    pref: 'SBFD-SMG',
    permiteAgrupacion: false,
    calc: input,
  };
  const escena = construirVisualizacion([member], calcularGrupoFisico([member]));
  const base = escena.paneles.find((panel) => panel.funcion === 'base')!;
  const fondo = escena.paneles.find((panel) => panel.funcion === 'respaldo')!;
  const riel = escena.paneles.find((panel) => panel.funcion === 'travesano_frontal')!;
  const laterales = escena.paneles.filter((panel) => panel.funcion === 'lateral');

  approx(base.d, 585.6);
  approx(fondo.d, 6);
  approx(fondo.y, base.d);
  approx(fondo.w, 949.2);
  approx(fondo.h, 760);
  approx(riel.d, 80);
  approx(riel.y, 27);
  approx(riel.z, 747);
  assert.equal(laterales.length, 2);
  for (const lateral of laterales) {
    assert.deepEqual(lateral.recorte, { borde: 'frontal_superior', profundidad: 27, alto: 73 });
  }
});
