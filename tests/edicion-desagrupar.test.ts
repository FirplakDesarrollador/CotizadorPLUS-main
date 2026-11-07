import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';

type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
let escrituras = 0;
class Consulta {
  private filtros: Array<[string, unknown]> = [];
  private unica = false;
  private limite?: number;
  private cambios?: Row;
  private nueva?: Row;
  private borrar = false;
  private orden: Array<[string, boolean]> = [];
  constructor(private tabla: string) {}
  select() { return this; }
  eq(k: string, v: unknown) { this.filtros.push([k, v]); return this; }
  order(k: string, opciones?: { ascending?: boolean }) { this.orden.push([k, opciones?.ascending !== false]); return this; }
  single() { this.unica = true; return this; }
  maybeSingle() { return this.single(); }
  limit(n: number) { this.limite = n; return this; }
  update(v: Row) { this.cambios = v; return this; }
  insert(v: Row) { this.nueva = v; return this; }
  delete() { this.borrar = true; return this; }
  then(resolve: (value: { data: Row | Row[] | null; error: null }) => unknown) {
    if (this.nueva) { escrituras++; (db[this.tabla] ??= []).push({ id: 'grupo-nuevo', ...this.nueva }); }
    let rows = (db[this.tabla] ?? []).filter(r => this.filtros.every(([k, v]) => r[k] === v));
    if (this.nueva) rows = rows.filter(r => r.id === 'grupo-nuevo');
    if (this.cambios) { escrituras++; rows.forEach(r => Object.assign(r, this.cambios)); }
    if (this.borrar) { escrituras++; db[this.tabla] = db[this.tabla].filter(r => !rows.includes(r)); }
    for (const [k, asc] of [...this.orden].reverse()) rows.sort((a, b) => (Number(a[k] ?? 0) - Number(b[k] ?? 0)) * (asc ? 1 : -1));
    if (this.limite != null) rows = rows.slice(0, this.limite);
    return Promise.resolve({ data: this.unica ? rows[0] ?? null : rows, error: null }).then(resolve);
  }
}

const catalogo = {
  tiposById: { tipo: { pref: 'BFD', pref_imperial: 'BFD', pref_metrico: 'BFD' } },
  tablerosByCode: Object.fromEntries(['A', 'B', 'F', 'F2'].map(codigo => [codigo, { espesor_mm: codigo.startsWith('F') ? 18 : 15 }])),
};
function resultado(input: { preset: Record<string, string> }) {
  const precio = input.preset.caja === 'B' ? 200 : 100;
  return { vars: {}, piezas: [], costoSinHerrajes: precio, costoHerrajes: 0, costoConHerrajes: precio, precioCop: precio, precioUsd: precio / 4000, precioConHerrajesCop: precio, precioConHerrajesUsd: precio / 4000, trm: 4000, margen: 0.6 };
}
const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const originalLoad = loader._load;
loader._load = function(id, ...args) {
  const name = id.replace(/\\/g, '/');
  if (name === 'server-only') return {};
  if (name.includes('/lib/supabase/server')) return { createClient: async () => ({ from: (t: string) => new Consulta(t) }) };
  if (name.includes('/lib/sin-fondo')) return { resolverTipologiaFondo: async (_sb: unknown, input: unknown) => input };
  if (name === '@/lib/cotizar' || name.endsWith('/lib/cotizar.ts')) return {
    cargarCatalogoPrecompilado: async () => catalogo,
    cotizar: async (input: { largo: number; preset: Record<string, string> }) => { if (input.largo <= 0) throw new Error('Medida inválida'); return resultado(input); },
    cotizarGrupo: async (inputs: Array<{ preset: Record<string, string> }>) => ({
      preparados: inputs.map(input => ({ prefMetrico: 'BFD', prefImperial: 'BFD', margen: 0.6, calc: { preset: input.preset, tablerosByCode: catalogo.tablerosByCode } })),
      lineas: inputs.map(resultado),
    }),
  };
  return originalLoad.call(this, id, ...args);
};
const api = createRequire(import.meta.url)('../src/lib/cotizaciones.ts') as typeof import('../src/lib/cotizaciones');
loader._load = originalLoad;

function preparar() {
  const config = { preset: { caja: 'A', refuerzo: 'A', frente: 'F' }, cantoCaja: '19x0,45', cantoFrentes: '22x1', conHerrajes: true, herrajesExcluidos: ['barra'] };
  db = {
    cot_cotizaciones: [{ id: 'q', sistema_medida: 'imperial', config_default: structuredClone(config) }],
    cot_cocinas: [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 1 }],
    cot_tipos_mueble: [{ id: 'tipo', pref: 'BFD' }],
    cot_tableros: Object.entries(catalogo.tablerosByCode).map(([codigo, t]) => ({ codigo, ...t })),
    cot_grupos_modulos: [{ id: 'g', cotizacion_id: 'q', cocina_id: 'a', orden: 0, etiqueta: 'A' }],
    cot_cotizacion_lineas: [1, 2].map(n => ({ id: `l${n}`, cotizacion_id: 'q', cocina_id: 'a', grupo_id: 'g', tipo_mueble_id: 'tipo', posicion_grupo: n, cantidad: 1, pref: 'BFD', largo: 18, alto: 30, prof: 24, unidad_dim: 'in', config: structuredClone(config) })),
  };
  escrituras = 0;
  return { input: api.inputDesdeLinea(db.cot_cotizacion_lineas[1] as unknown as import('../src/lib/cotizaciones').LineaPersistida), globales: structuredClone(db.cot_cotizaciones[0].config_default) };
}

test('guardar una caja individual en A2 separa solo A2, persiste la elección y concilia totales', async () => {
  const { input, globales } = preparar();
  assert.deepEqual(await api.editarLineaConDetalle('l2', { ...input, preset: { ...input.preset, caja: 'B', refuerzo: 'B' } }), { cotizacionId: 'q', desagrupado: true });
  assert.equal(db.cot_cotizacion_lineas[0].grupo_id, 'g');
  assert.equal(db.cot_cotizacion_lineas[1].grupo_id, 'grupo-nuevo');
  const uno = api.inputDesdeLinea(db.cot_cotizacion_lineas[0] as unknown as import('../src/lib/cotizaciones').LineaPersistida);
  const dos = api.inputDesdeLinea(db.cot_cotizacion_lineas[1] as unknown as import('../src/lib/cotizaciones').LineaPersistida);
  assert.equal(uno.preset.caja, 'A'); assert.equal(dos.preset.caja, 'B');
  assert.deepEqual(dos.herrajesExcluidos, ['barra']);
  assert.equal(db.cot_grupos_modulos.length, 2);
  assert.equal(db.cot_cotizaciones[0].total_cop, 300);
  assert.deepEqual(db.cot_cotizaciones[0].config_default, globales);
  await api.recalcularGrupo('grupo-nuevo');
  assert.equal(api.inputDesdeLinea(db.cot_cotizacion_lineas[1] as unknown as import('../src/lib/cotizaciones').LineaPersistida).preset.caja, 'B');
});

test('un frente compatible queda individual sin separar la estructura', async () => {
  const { input } = preparar();
  assert.equal((await api.editarLineaConDetalle('l2', { ...input, preset: { ...input.preset, frente: 'F2' } })).desagrupado, false);
  assert.equal(db.cot_grupos_modulos.length, 1);
  assert.equal(db.cot_cotizacion_lineas[1].grupo_id, 'g');
  assert.equal(api.inputDesdeLinea(db.cot_cotizacion_lineas[1] as unknown as import('../src/lib/cotizaciones').LineaPersistida).preset.frente, 'F2');
});

test('un input inválido se rechaza antes de separar o escribir el grupo', async () => {
  const { input } = preparar(); const antes = structuredClone(db);
  await assert.rejects(api.editarLineaConDetalle('l2', { ...input, largo: 0 }), /Medida inválida/);
  assert.equal(escrituras, 0); assert.deepEqual(db, antes);
});
