import assert from 'node:assert/strict';
import test from 'node:test';
import { areaConSierra, medidaParaCorte } from '../src/lib/corte/medida-corte';

const lamina = { codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true };

test('solo descuenta los refilos del eje que coincide con el formato bruto', () => {
  const nominal = { largoMm: 2440, anchoMm: 500 };
  assert.deepEqual(medidaParaCorte(nominal, lamina, 5, false), { largoMm: 2430, anchoMm: 500, medidaConRefilado: nominal });
  assert.deepEqual(medidaParaCorte(nominal, lamina, 0, false), nominal);
  assert.equal(medidaParaCorte({ ...nominal, largoMm: 2435 }, lamina, 5, true), null);
  assert.equal(medidaParaCorte({ ...nominal, largoMm: 2440.1 }, lamina, 5, true), null);
});

test('respeta la veta y no suma disco más allá de los dos bordes útiles', () => {
  const nominal = { largoMm: 1830, anchoMm: 2440 };
  assert.equal(medidaParaCorte(nominal, lamina, 5, false), null);
  assert.deepEqual(medidaParaCorte(nominal, lamina, 5, true), { largoMm: 1820, anchoMm: 2430, medidaConRefilado: nominal });
  assert.equal(areaConSierra({ largoMm: 1820, anchoMm: 2430 }, lamina, 5, 4.4), 1820 * 2430);
});
