import assert from 'node:assert/strict';
import test from 'node:test';
import { monedasVisibles } from '../src/lib/monedas-visibles';

// Las casillas de columna eligen que monedas se ven; la moneda del proyecto decide
// cual manda cuando se ven las dos.

test('solo pesos marcado: solo pesos', () => {
  assert.deepEqual(monedasVisibles({ usd: false, cop: true }, 'COP'), ['COP']);
  assert.deepEqual(monedasVisibles({ usd: false, cop: true }, 'USD'), ['COP'],
    'aunque el proyecto este en dolares: se pidio ver pesos');
});

test('solo dolares marcado: solo dolares', () => {
  assert.deepEqual(monedasVisibles({ usd: true, cop: false }, 'USD'), ['USD']);
  assert.deepEqual(monedasVisibles({ usd: true, cop: false }, 'COP'), ['USD']);
});

test('las dos marcadas: primero la del proyecto', () => {
  assert.deepEqual(monedasVisibles({ usd: true, cop: true }, 'COP'), ['COP', 'USD']);
  assert.deepEqual(monedasVisibles({ usd: true, cop: true }, 'USD'), ['USD', 'COP']);
});

test('ninguna marcada no deja el encabezado en blanco', () => {
  // Las casillas no lo permiten, pero el encabezado no puede quedarse sin cifra.
  assert.deepEqual(monedasVisibles({ usd: false, cop: false }, 'COP'), ['COP']);
  assert.deepEqual(monedasVisibles({ usd: false, cop: false }, 'USD'), ['USD']);
});

test('nunca repite una moneda', () => {
  for (const usd of [true, false]) {
    for (const cop of [true, false]) {
      for (const moneda of ['USD', 'COP'] as const) {
        const v = monedasVisibles({ usd, cop }, moneda);
        assert.equal(new Set(v).size, v.length, `${usd} ${cop} ${moneda}`);
        assert.ok(v.length >= 1 && v.length <= 2);
      }
    }
  }
});
