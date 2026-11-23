import assert from 'node:assert/strict';
import test from 'node:test';
import { construirDashboardCsv, normalizarBomCsv } from '../src/lib/dashboard-csv';
import type { FilaDashboard } from '../src/lib/dashboard-cotizaciones';

const fila: FilaDashboard = { id: '1', codigo: 'C-1', nombre: 'Torre; "México"\nEtapa 2', cliente_nombre: '=HYPERLINK("malicioso")', comprador_nombre: ' @SUM(1)', pais: 'México', ciudad: null, cotizador_por: 'FIRPLAK', estado: 'borrador', total_cop: 1234.56, total_usd: 1.25, created_at: '2026-10-30T05:00:00Z', fecha_local: '2026-10-30' };

test('CSV usa BOM UTF-8, separador español, comillas escapadas, ciudad vacía y decimales con coma', () => {
  const csv = construirDashboardCsv([fila]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /"País";"Ciudad"/);
  assert.ok(csv.includes('"Torre; ""México""\nEtapa 2"'));
  assert.ok(csv.includes('"México";"";"FIRPLAK"'));
  assert.ok(csv.endsWith('"1234,56";"1,25"\r\n'));
});

test('los campos de texto que parecen fórmulas se exportan como texto, no como instrucciones Excel', () => {
  const csv = construirDashboardCsv([fila]);
  assert.ok(csv.includes('"\'=HYPERLINK('));
  assert.ok(csv.includes('"\' @SUM(1)"'));
});

test('sin resultados conserva encabezados y exporta todas las filas recibidas sin paginar', () => {
  assert.equal(construirDashboardCsv([]).split('\r\n').length, 2);
  const csv = construirDashboardCsv(Array.from({ length: 101 }, (_, i) => ({ ...fila, nombre: `Proyecto ${i}` })));
  assert.equal(csv.split('\r\n').length, 103);
  assert.ok(csv.includes('Proyecto 100'));
});

test('la descarga restaura el BOM si el transporte lo retiró, sin duplicarlo si ya existe', () => {
  const original = construirDashboardCsv([fila]);
  assert.equal(normalizarBomCsv(original), original);
  assert.equal(normalizarBomCsv(original.slice(1)), original);
  assert.deepEqual([...Buffer.from(normalizarBomCsv(original.slice(1)), 'utf8').subarray(0, 3)], [239, 187, 191]);
});
