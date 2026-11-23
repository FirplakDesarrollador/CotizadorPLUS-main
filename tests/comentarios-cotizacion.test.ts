import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  estadoRequiereAlertaComentario,
  parseComentariosCotizacion,
} from '../src/lib/comentarios-cotizacion';

test('los comentarios se leen como historial inmutable y toleran datos vacíos', () => {
  assert.deepEqual(parseComentariosCotizacion(null), []);
  assert.deepEqual(parseComentariosCotizacion('texto legado'), []);
  const comentario = { id: '1', texto: 'Validado con cliente', creadoPor: 'u1', creadoEn: '2026-10-20T12:00:00Z' };
  assert.deepEqual(parseComentariosCotizacion(JSON.stringify([comentario])), [comentario]);
});

test('la alerta solo aplica a cotizaciones enviadas o aprobadas', () => {
  assert.equal(estadoRequiereAlertaComentario('enviada'), true);
  assert.equal(estadoRequiereAlertaComentario('Aprobada'), true);
  assert.equal(estadoRequiereAlertaComentario('borrador'), false);
  assert.equal(estadoRequiereAlertaComentario('rechazada'), false);
});

test('la migración agrega comentarios de forma atómica sin reemplazar el historial', () => {
  const sql = readFileSync(join(process.cwd(), 'db', 'migrations', '0206_comentarios_versionados_cotizacion.sql'), 'utf8');
  assert.match(sql, /cot_agregar_comentario/i);
  assert.match(sql, /\|\| jsonb_build_array\(v_comentario\)/i);
  assert.match(sql, /char_length\(v_texto\) > 2000/i);
});

test('los comentarios no se renderizan en las vistas de impresión', () => {
  const printPage = readFileSync(join(process.cwd(), 'src', 'app', 'cotizaciones', '[id]', 'imprimir', 'page.tsx'), 'utf8');
  const cema = readFileSync(join(process.cwd(), 'src', 'app', 'cotizaciones', '[id]', 'imprimir', 'CemaPrintEditor.tsx'), 'utf8');
  const firplak = readFileSync(join(process.cwd(), 'src', 'app', 'cotizaciones', '[id]', 'imprimir', 'FirplakPrintEditor.tsx'), 'utf8');
  assert.doesNotMatch(printPage, /ComentariosProyecto|comentarios-cotizacion/);
  assert.doesNotMatch(cema, /ComentariosProyecto|comentarios-cotizacion/);
  assert.doesNotMatch(firplak, /ComentariosProyecto|comentarios-cotizacion/);
});
