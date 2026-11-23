import assert from 'node:assert/strict';
import test from 'node:test';
import { CONFIG_OPTIMIZADOR_DEFAULT, normalizarConfig } from '../src/lib/corte/config';
import { validarPatron, type Colocacion, type Patron } from '../src/lib/corte/guillotina';
import { cortesDeLamina } from '../src/lib/corte/secuencia';

// Conteo de cortes con la estructura de columnas apiladas (franja → columna → pieza)
// y con el primer corte a lo ancho de la lámina (`transpuesta`).
const cfg = normalizarConfig(CONFIG_OPTIMIZADOR_DEFAULT);
const LAMINA = { codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true };

const pieza = (x: number, y: number, l: number, a: number, franja?: number, columna?: number): Colocacion =>
  ({ id: 'x', etiqueta: `${l}x${a}`, grupo: 1, x, y, largoMm: l, anchoMm: a, girada: false, franja, columna });
const patron = (colocaciones: Colocacion[], transpuesta = false): Patron =>
  ({ repeticiones: 1, areaPiezasMm2: 0, desperdicioPct: 0, sobrantes: [], colocaciones, transpuesta });

test('dos piezas apiladas en una columna y otra columna que llena la franja', () => {
  // Franja de 600 de alto. Columna 0: 300 + 290 de alto (sobran 5,6 mm arriba).
  // Columna 1: una pieza de 600 que llena el alto. Sobra largo a la derecha.
  const p = patron([pieza(5, 5, 500, 300, 0, 0), pieza(5, 309.4, 500, 290, 0, 0), pieza(509.4, 5, 400, 600, 0, 1)]);
  const c = cortesDeLamina(p, LAMINA, cfg);
  assert.equal(c.refilado, 2);
  assert.equal(c.nivel1, 1, 'una franja');
  assert.equal(c.nivel2, 2, 'un corte entre columnas y otro al sobrante derecho');
  assert.equal(c.nivel3, 2, 'un corte entre las piezas apiladas y otro al sobrante de arriba');
  assert.equal(c.total, 7);
  assert.deepEqual(validarPatron(p, LAMINA, cfg), []);
});

test('una pieza más angosta que su columna lleva un recorte', () => {
  const p = patron([pieza(5, 5, 500, 300, 0, 0), pieza(5, 309.4, 450, 290, 0, 0)]);
  const c = cortesDeLamina(p, LAMINA, cfg);
  // La columna es la única de la franja y define su alto: no sobra nada encima.
  // Entre piezas (1) + recorte lateral de la de 450 (1).
  assert.equal(c.nivel3, 2);
});

test('con el primer corte a lo ancho se cuenta igual, sobre el otro eje', () => {
  // La misma lámina del primer caso, girada: las franjas corren a lo ancho.
  const recta = patron([pieza(5, 5, 500, 300, 0, 0), pieza(5, 309.4, 500, 290, 0, 0), pieza(509.4, 5, 400, 600, 0, 1)]);
  const girada = patron(recta.colocaciones.map((c) => ({ ...c, x: c.y, y: c.x, largoMm: c.anchoMm, anchoMm: c.largoMm })), true);
  const a = cortesDeLamina(recta, LAMINA, cfg);
  const b = cortesDeLamina(girada, LAMINA, cfg);
  assert.equal(b.nivel1, a.nivel1);
  assert.equal(b.nivel2, a.nivel2, 'el sobrante se mide contra el ancho de la lámina');
  assert.equal(b.nivel3, a.nivel3);
  assert.deepEqual(validarPatron(girada, LAMINA, cfg), []);
});

test('patrones sin franja ni columna (formato anterior) se cuentan por coordenadas', () => {
  // Dos piezas lado a lado en la misma franja; la segunda más baja: un recorte.
  const p = patron([pieza(5, 5, 500, 300), pieza(509.4, 5, 400, 250)]);
  const c = cortesDeLamina(p, LAMINA, cfg);
  assert.equal(c.nivel1, 1);
  assert.equal(c.nivel2, 2, 'un corte entre piezas y otro al sobrante derecho');
  assert.equal(c.nivel3, 1, 'recorte de la pieza más baja');
});
