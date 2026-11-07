import assert from 'node:assert/strict';
import test from 'node:test';
import { ordenarPiezasHdr } from '../src/app/hdr/ordenPiezas';

test('HDR usa el orden de la referencia independientemente del orden de plantilla', () => {
  const piezas = ['fondo', 'lateral', 'frente', 'entrepano', 'tapa', 'refuerzo_trasero', 'base'].map(pieza => ({ pieza }));
  const antes = structuredClone(piezas);
  assert.deepEqual(ordenarPiezasHdr(piezas, true).map(p => p.pieza), ['base', 'tapa', 'lateral', 'refuerzo_trasero', 'entrepano', 'frente', 'fondo']);
  assert.deepEqual(piezas, antes);
});

test('las gavetas conservan su secuencia original incluyendo sus frentes y fondos', () => {
  const nombres = ['lateral', 'base', 'refuerzo_trasero', 'lateral_gaveta_pequena', 'frente', 'trasero_gaveta_grande', 'contraparche_pequeno', 'fondo', 'fondo_gaveta'];
  const resultado = ordenarPiezasHdr(nombres.map((pieza, id) => ({ pieza, id })), false);
  assert.deepEqual(resultado.map(p => p.pieza), ['base', 'lateral', 'refuerzo_trasero', 'lateral_gaveta_pequena', 'frente', 'trasero_gaveta_grande', 'contraparche_pequeno', 'fondo_gaveta', 'fondo']);
  assert.deepEqual(resultado.filter(p => /gaveta|contraparche/.test(p.pieza) || p.pieza === 'frente').map(p => p.id), [3, 4, 5, 6, 8]);
});

test('B con puerta y cajón mantiene la gaveta como bloque y la puerta después', () => {
  const nombres = ['fondo', 'frente_gaveta', 'base_gaveta', 'lateral', 'frente', 'base', 'trasero_gaveta', 'entrepano'];
  assert.deepEqual(ordenarPiezasHdr(nombres.map(pieza => ({ pieza })), true).map(p => p.pieza), ['base', 'lateral', 'entrepano', 'frente_gaveta', 'base_gaveta', 'trasero_gaveta', 'frente', 'fondo']);
});

test('base/tapa combinada, refuerzos delanteros y golas respetan el orden estructural', () => {
  const nombres = ['fondo', 'gola_madera', 'refuerzo_trasero', 'lateral', 'base_tapa', 'refuerzo_delantero', 'entrepano_fijo'];
  assert.deepEqual(ordenarPiezasHdr(nombres.map(pieza => ({ pieza })), false).map(p => p.pieza), ['base_tapa', 'lateral', 'refuerzo_delantero', 'refuerzo_trasero', 'gola_madera', 'entrepano_fijo', 'fondo']);
});
