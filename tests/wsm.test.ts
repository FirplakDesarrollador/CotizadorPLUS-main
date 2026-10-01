import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularMueble, type CalcInput, type Pieza, type Regla } from '../src/lib/engine';

const piezas: Pieza[] = [
  { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P', cantos: { calibre: '22x1', largos: 2, anchos: 2, forceCalibre: true } },
  { nombre: 'tapa', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P', cantos: { calibre: '22x1', largos: 2, anchos: 2, forceCalibre: true } },
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A-1', formula_ancho: 'P', cantos: { calibre: '22x1', largos: 2, anchos: 2, forceCalibre: true } },
  { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '2', formula_largo: 'L-2*TC', formula_ancho: '3.14961', cantos: { calibre: '22x1', largos: 2, anchos: 0, forceCalibre: true } },
  { nombre: 'entrepano', rol_tablero: 'refuerzo', formula_cantidad: 'n_entrepanos', formula_largo: 'L-2*TC-0.03937', formula_ancho: 'P-1.73622', cantos: { calibre: '22x1', largos: 2, anchos: 2, forceCalibre: true } },
  { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: 'n_puertas', formula_largo: '(L-n_puertas*RV)/n_puertas', formula_ancho: 'A', cantos: { calibre: '22x1', largos: 2, anchos: 2 } },
  { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'A-1.866142', formula_ancho: 'L-0.866142', cantos: {} },
];

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '2', prioridad: 99 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'A <= 36', valor: '2', prioridad: 30 },
  { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'true', valor: '3', prioridad: 99 },
];

const input: CalcInput = {
  dims: { L: 9, A: 36, P: 14 }, piezas, reglas, herrajesPlantilla: [], overrides: {},
  preset: { caja: 'CAJA', refuerzo: 'CAJA', frente: 'FRENTE', fondo: 'FONDO' },
  tablerosByCode: {
    CAJA: { codigo: 'CAJA', precio_m2: 1, espesor_mm: 18 },
    FRENTE: { codigo: 'FRENTE', precio_m2: 1, espesor_mm: 18 },
    FONDO: { codigo: 'FONDO', precio_m2: 1, espesor_mm: 6 },
  },
  cantosByCalibre: { '22X1': { calibre: '22x1', precio: 1 } },
  herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0,
  margen: 0, margenHerraje: 0, trm: 1, desperdicio: 0,
};

const resultado = calcularMueble(input);
const mm = (inches: number) => inches * 25.4;
const pieza = (nombre: string) => resultado.piezas.find((item) => item.pieza === nombre)!;
const cerca = (actual: number, esperado: number) => assert.ok(Math.abs(actual - esperado) < 0.2, `${actual} ~= ${esperado}`);

test('WSM93614 reproduce las medidas de la hoja confirmada', () => {
  cerca(mm(pieza('base').largoIn), 192.6);
  cerca(mm(pieza('base').anchoIn), 355.6);
  cerca(mm(pieza('lateral').largoIn), 889);
  cerca(mm(pieza('lateral').anchoIn), 355.6);
  cerca(mm(pieza('refuerzo_trasero').largoIn), 192.6);
  cerca(mm(pieza('refuerzo_trasero').anchoIn), 80);
  cerca(mm(pieza('entrepano').largoIn), 191.6);
  cerca(mm(pieza('entrepano').anchoIn), 311.5);
  cerca(mm(pieza('frente').largoIn), 225.4);
  cerca(mm(pieza('frente').anchoIn), 914.4);
  cerca(mm(pieza('fondo').largoIn), 867);
  cerca(mm(pieza('fondo').anchoIn), 206.6);
});
