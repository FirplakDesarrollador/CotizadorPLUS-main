import assert from 'node:assert/strict';
import test from 'node:test';
import { CONFIG_OPTIMIZADOR_DEFAULT, normalizarConfig } from '../src/lib/corte/config';
import { optimizarMaterial, type Patron } from '../src/lib/corte/guillotina';
import { cortesDeLamina, cortesDeMaterial, escalarCortes, pasadasDePatron, sumarCortes, CORTES_CERO } from '../src/lib/corte/secuencia';

// Conteo de cortes de una lamina ya acomodada. Es un modelo de la secuencia de la
// seccionadora (refilado -> franja -> piezas -> recorte), no una medicion: los
// niveles de la Holz-Her siguen pendientes de confirmar con planta.

const cfg = normalizarConfig(CONFIG_OPTIMIZADOR_DEFAULT);
const LAMINA = { codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true };

const patron = (colocaciones: { x: number; y: number; largoMm: number; anchoMm: number }[]): Patron => ({
  repeticiones: 1,
  colocaciones: colocaciones.map((c, i) => ({ id: 'p', etiqueta: 'pieza', grupo: 1, girada: false, ...c, })),
  sobrantes: [],
  areaPiezasMm2: colocaciones.reduce((s, c) => s + c.largoMm * c.anchoMm, 0),
  desperdicioPct: 0,
});

test('una lamina vacia no cuesta cortes', () => {
  assert.deepEqual(cortesDeLamina(patron([]), LAMINA, cfg), CORTES_CERO);
});

test('una sola pieza: refilar, liberar la franja, soltar la pieza', () => {
  const c = cortesDeLamina(patron([{ x: 5, y: 5, largoMm: 600, anchoMm: 400 }]), LAMINA, cfg);
  assert.equal(c.refilado, 2, 'dos cantos escuadran la lamina');
  assert.equal(c.nivel1, 1, 'una franja, un corte de lado a lado');
  assert.equal(c.nivel2, 1, 'la pieza queda sola, pero hay que soltar el sobrante de la derecha');
  assert.equal(c.nivel3, 0);
  assert.equal(c.total, 4);
});

test('tres piezas en una franja: dos cortes entre ellas mas el del sobrante', () => {
  const c = cortesDeLamina(patron([
    { x: 5, y: 5, largoMm: 600, anchoMm: 400 },
    { x: 609.4, y: 5, largoMm: 600, anchoMm: 400 },
    { x: 1213.8, y: 5, largoMm: 600, anchoMm: 400 },
  ]), LAMINA, cfg);
  assert.equal(c.nivel1, 1);
  assert.equal(c.nivel2, 3, '2 entre piezas + 1 del sobrante');
});

test('si la franja llega al borde util no hay corte de sobrante', () => {
  // Dos piezas que ocupan exactamente hasta 2435 (2440 - 5 de refilado).
  const c = cortesDeLamina(patron([
    { x: 5, y: 5, largoMm: 1213, anchoMm: 400 },
    { x: 1222.4, y: 5, largoMm: 1212.6, anchoMm: 400 },
  ]), LAMINA, cfg);
  assert.equal(c.nivel2, 1, 'solo el corte entre las dos piezas');
});

test('una pieza mas baja que su franja cuesta un recorte de tercer nivel', () => {
  const c = cortesDeLamina(patron([
    { x: 5, y: 5, largoMm: 600, anchoMm: 400 },
    { x: 609.4, y: 5, largoMm: 600, anchoMm: 250 },
  ]), LAMINA, cfg);
  assert.equal(c.nivel3, 1, 'solo la baja se recorta');
});

test('cada franja suma su propio corte transversal', () => {
  const c = cortesDeLamina(patron([
    { x: 5, y: 5, largoMm: 600, anchoMm: 400 },
    { x: 5, y: 409.4, largoMm: 600, anchoMm: 400 },
    { x: 5, y: 813.8, largoMm: 600, anchoMm: 400 },
  ]), LAMINA, cfg);
  assert.equal(c.nivel1, 3);
});

test('sin refilado no se cobran los cantos', () => {
  const sinRefilar = normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, refiladoMm: 0 });
  const c = cortesDeLamina(patron([{ x: 0, y: 0, largoMm: 600, anchoMm: 400 }]), LAMINA, sinRefilar);
  assert.equal(c.refilado, 0);
});

test('la pila ahorra pasadas: cuatro laminas iguales se cortan de una vez', () => {
  assert.equal(pasadasDePatron(4, 4), 1);
  assert.equal(pasadasDePatron(5, 4), 2, 'la quinta obliga a una pasada mas');
  assert.equal(pasadasDePatron(3, 4), 1);
  assert.equal(pasadasDePatron(3, null), 3, 'sin dato de pila se cuenta lamina por lamina');
  assert.equal(pasadasDePatron(0, 4), 0);
});

test('sumar y escalar cortes mantiene el desglose', () => {
  const a = { refilado: 2, nivel1: 1, nivel2: 3, nivel3: 1, total: 7 };
  assert.deepEqual(sumarCortes(a, a), { refilado: 4, nivel1: 2, nivel2: 6, nivel3: 2, total: 14 });
  assert.deepEqual(escalarCortes(a, 3), { refilado: 6, nivel1: 3, nivel2: 9, nivel3: 3, total: 21 });
  assert.deepEqual(sumarCortes(a, CORTES_CERO), a);
});

test('el total siempre cuadra con el desglose', () => {
  const plan = optimizarMaterial(
    [{ id: 'a', etiqueta: 'lateral', largoMm: 762, anchoMm: 580, cantidad: 14, girable: true },
     { id: 'b', etiqueta: 'refuerzo', largoMm: 870, anchoMm: 100, cantidad: 10, girable: true }],
    LAMINA, cfg,
  );
  for (const p of plan.patrones) {
    const c = cortesDeLamina(p, LAMINA, cfg);
    assert.equal(c.total, c.refilado + c.nivel1 + c.nivel2 + c.nivel3);
  }
  const material = cortesDeMaterial(plan.patrones, LAMINA, 4, cfg);
  assert.equal(material.total, material.refilado + material.nivel1 + material.nivel2 + material.nivel3);
  assert.ok(material.total > 0);
});

test('un material con pila cuesta menos pasadas que sin ella', () => {
  // 32 piezas iguales dan dos laminas identicas: con pila de 4 se cortan juntas.
  const plan = optimizarMaterial([{ id: 'a', etiqueta: 'lateral', largoMm: 600, anchoMm: 450, cantidad: 32, girable: true }], LAMINA, cfg);
  const conPila = cortesDeMaterial(plan.patrones, LAMINA, 4, cfg);
  const sinPila = cortesDeMaterial(plan.patrones, LAMINA, null, cfg);
  assert.ok(conPila.total < sinPila.total, `${conPila.total} deberia ser menor que ${sinPila.total}`);
});
