import assert from 'node:assert/strict';
import test from 'node:test';
import { orientarPieza, nombrePieza } from '../src/lib/muebles';

// El motor guarda largo/ancho como ejes geométricos; la hoja de ruta los lista con
// la medida mayor primero. Estas convenciones traducen de uno a otro y las comparten
// el despiece del Simulador y el del HDR, para que no vuelvan a contradecirse.
// Ver WikiLLM/wiki/ejes_fondo_backing.md.

const mm = (v: number) => v / 25.4;
const pieza = (rol: string, largoMm: number, anchoMm: number) =>
  ({ rol, largoIn: mm(largoMm), anchoIn: mm(anchoMm) });
const enMm = (o: { largoIn: number; anchoIn: number }) =>
  [Number((o.largoIn * 25.4).toFixed(1)), Number((o.anchoIn * 25.4).toFixed(1))];

test('el frente siempre se presenta con el alto primero', () => {
  // SBFD 30x30x24: el motor da 377.8 de ancho de hoja x 758.8 de alto.
  assert.deepEqual(enMm(orientarPieza(pieza('frente', 377.8, 758.8))), [758.8, 377.8]);
  // Ya invertido no se vuelve a invertir: la regla no depende del tamaño.
  assert.deepEqual(enMm(orientarPieza(pieza('frente', 758.8, 377.8))), [377.8, 758.8]);
});

test('el fondo se ordena por tamaño, porque su eje depende del tipo', () => {
  // SBFD: intercambiar=false, el vertical (762) va en ancho -> se invierte.
  assert.deepEqual(enMm(orientarPieza(pieza('fondo', 747, 762))), [762, 747]);
  // Tipos con intercambiar=true ya traen el mayor en largo -> la fila no cambia.
  assert.deepEqual(enMm(orientarPieza(pieza('fondo', 874, 442))), [874, 442]);
});

test('las piezas de carcasa no se reordenan', () => {
  for (const [rol, largo, ancho] of [['caja', 762, 609.6], ['caja', 732, 585.6], ['refuerzo', 732, 80]] as const) {
    assert.deepEqual(enMm(orientarPieza(pieza(rol, largo, ancho))), [largo, ancho], rol);
  }
  // Tampoco cuando el ancho supera al largo: solo el fondo se ordena por tamaño.
  assert.deepEqual(enMm(orientarPieza(pieza('caja', 300, 900))), [300, 900]);
});

test('`frente` se llama `puerta` solo cuando la tipología tiene puertas', () => {
  assert.equal(nombrePieza('frente', true), 'puerta');
  // En una cajonera el mismo nombre designa la cara de la gaveta.
  assert.equal(nombrePieza('frente', false), 'frente');
  // Ninguna otra pieza se renombra.
  for (const n of ['fondo', 'lateral', 'base', 'refuerzo_trasero', 'frente_gaveta']) {
    assert.equal(nombrePieza(n, true), n, n);
  }
});
