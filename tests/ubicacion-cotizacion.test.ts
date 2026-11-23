import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarUbicacion } from '../src/lib/ubicacion-cotizacion';

test('país obligatorio y ciudad opcional, sin reemplazar el texto libre por un catálogo cerrado', () => {
  assert.deepEqual(normalizarUbicacion(' colombia ', ''), { pais: 'Colombia', ciudad: null });
  assert.deepEqual(normalizarUbicacion('mexico', ' Ciudad   de México '), { pais: 'México', ciudad: 'Ciudad de México' });
  assert.deepEqual(normalizarUbicacion('Uruguay'), { pais: 'Uruguay', ciudad: null });
  assert.throws(() => normalizarUbicacion('  '), /país/);
  assert.throws(() => normalizarUbicacion('x'.repeat(101)), /país/);
  assert.throws(() => normalizarUbicacion('Perú', 'x'.repeat(161)), /ciudad/);
});
