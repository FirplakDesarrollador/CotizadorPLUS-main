import assert from 'node:assert/strict';
import test from 'node:test';
import { ESTADOS_COTIZACION, GRUPOS_ESTADO, normalizarEstadoExcel } from '../src/lib/pipeline-estados';
import { estadoRequiereAlertaComentario } from '../src/lib/comentarios-cotizacion';
test('el catálogo es superset del anterior y cada estado pertenece a un único grupo', () => {
  for (const anterior of ['borrador', 'enviada', 'aprobada', 'rechazada']) assert.ok((ESTADOS_COTIZACION as readonly string[]).includes(anterior));
  const grupos = Object.values(GRUPOS_ESTADO).flat();
  assert.equal(new Set(grupos).size, 7);
  assert.deepEqual([...grupos].sort(), [...ESTADOS_COTIZACION].sort());
});
test('los estados de Excel se normalizan sin inventar valores desconocidos', () => {
  assert.equal(normalizarEstadoExcel('En Pausa'), 'en_pausa');
  assert.equal(normalizarEstadoExcel(' En pausa '), 'en_pausa');
  assert.equal(normalizarEstadoExcel(null), 'borrador');
  assert.equal(normalizarEstadoExcel('Descartada'), 'descartada');
  assert.throws(() => normalizarEstadoExcel('cerrada'), /desconocido/);
});
test('solo enviada y aprobada mantienen la advertencia de comentario', () => {
  for (const estado of ESTADOS_COTIZACION) assert.equal(estadoRequiereAlertaComentario(estado), estado === 'enviada' || estado === 'aprobada');
});
