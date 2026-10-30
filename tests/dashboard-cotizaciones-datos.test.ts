import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';
import { argumentosDashboard, normalizarFiltrosDashboard, type FilaDashboard } from '../src/lib/dashboard-cotizaciones';

const requireLocal = createRequire(import.meta.url);
let autenticado = true;
let filas: FilaDashboard[] = [];
const llamadas: Array<{ nombre: string; args: unknown; rango?: [number, number]; orden: string[] }> = [];
class Consulta {
  private llamada: typeof llamadas[number];
  constructor(nombre: string, args: unknown) { this.llamada = { nombre, args, orden: [] }; llamadas.push(this.llamada); }
  order(columna: string) { this.llamada.orden.push(columna); return this; }
  range(inicio: number, fin: number) { this.llamada.rango = [inicio, fin]; return this; }
  then(resolve: (value: { data: unknown; error: null }) => unknown) {
    const { nombre, rango } = this.llamada;
    const data = nombre === 'cot_dashboard_opciones' ? { paises: ['Colombia'], estados: ['borrador'], anios: [2026] }
      : nombre === 'cot_dashboard_resumen' ? { total: filas.length }
      : filas.slice(rango?.[0] ?? 0, (rango?.[1] ?? filas.length) + 1);
    return Promise.resolve({ data, error: null }).then(resolve);
  }
}
const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function(id, ...args) {
  const nombre = id.replace(/\\/g, '/');
  if (nombre === 'server-only') return {};
  if (nombre.includes('/lib/supabase/server')) return { createClient: async () => ({ rpc: (n: string, p: unknown) => new Consulta(n, p) }) };
  if (nombre.endsWith('/lib/auth') || nombre.endsWith('/lib/auth.ts')) return { getUserAndRole: async () => ({ user: autenticado ? { id: 'vendedor' } : null, rol: 'vendedor' }) };
  return original.call(this, id, ...args);
};
const api = requireLocal('../src/lib/dashboard-cotizaciones-datos.ts') as typeof import('../src/lib/dashboard-cotizaciones-datos');
loader._load = original;
const filtros = normalizarFiltrosDashboard({ pais: 'Colombia', cotizador: 'FIRPLAK', pagina: '2', tamano: '25', orden: 'cop' }, new Date('2026-10-30T12:00:00Z'));

test('tabla y KPIs utilizan filtros idénticos; la tabla se pide paginada y con orden estable', async () => {
  llamadas.length = 0;
  filas = Array.from({ length: 51 }, (_, i) => ({ id: String(i) } as FilaDashboard));
  const resultado = await api.cargarDashboardCotizaciones(filtros);
  assert.equal(resultado.resumen.total, 51);
  assert.equal(resultado.filas.length, 25);
  assert.equal(resultado.filas[0].id, '25');
  const tabla = llamadas.find(l => l.nombre === 'cot_dashboard_filtradas')!;
  assert.deepEqual(tabla.args, argumentosDashboard(filtros));
  assert.deepEqual(llamadas.find(l => l.nombre === 'cot_dashboard_resumen')!.args, tabla.args);
  assert.deepEqual(tabla.rango, [25, 49]);
  assert.deepEqual(tabla.orden, ['total_cop', 'id']);
});

test('la exportación recorre más de mil registros y no hereda la página visible', async () => {
  llamadas.length = 0;
  filas = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) } as FilaDashboard));
  const resultado = await api.filasDashboardParaExportar(filtros);
  assert.equal(resultado.length, 1001);
  assert.deepEqual(llamadas.map(l => l.rango), [[0, 999], [1000, 1999]]);
  assert.ok(llamadas.every(l => JSON.stringify(l.args) === JSON.stringify(argumentosDashboard(filtros))));
});

test('un visitante sin sesión no consulta el dashboard ni exporta; un vendedor sí puede leer', async () => {
  autenticado = false; llamadas.length = 0;
  try {
    await assert.rejects(api.cargarDashboardCotizaciones(filtros), /No autenticado/);
    await assert.rejects(api.filasDashboardParaExportar(filtros), /No autenticado/);
    assert.equal(llamadas.length, 0);
  } finally { autenticado = true; }
});
