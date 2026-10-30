import assert from 'node:assert/strict';
import test from 'node:test';
import { resolverTipologiaFondo } from '../src/lib/sin-fondo';

test('Con fondo sustituye una variante SF por la tipología base devuelta', async () => {
  const llamadas: Array<{ nombre: string; argumentos: Record<string, unknown> }> = [];
  const cliente = { rpc: async (nombre: string, argumentos: Record<string, unknown>) => {
    llamadas.push({ nombre, argumentos });
    return { data: 'bfd-sm-id', error: null };
  } };
  const input = { tipoId: 'bfd-sm-sf-id', conFondo: true, cantidad: 1 };
  assert.deepEqual(await resolverTipologiaFondo(cliente, input), { ...input, tipoId: 'bfd-sm-id' });
  assert.deepEqual(llamadas, [{
    nombre: 'cot_resolver_tipologia_fondo',
    argumentos: { p_tipo_actual: 'bfd-sm-sf-id', p_con_fondo: true },
  }]);
});

test('Sin fondo sustituye el tipo fuente por la variante SF devuelta por Supabase', async () => {
  const llamadas: Array<{ nombre: string; argumentos: Record<string, unknown> }> = [];
  const cliente = {
    rpc: async (nombre: string, argumentos: Record<string, unknown>) => {
      llamadas.push({ nombre, argumentos });
      return { data: 'bfd-sm-sf-id', error: null };
    },
  };
  const input = { tipoId: 'bfd-sm-id', conFondo: false, cantidad: 2 };
  const result = await resolverTipologiaFondo(cliente, input);
  assert.deepEqual(llamadas, [{
    nombre: 'cot_resolver_tipologia_fondo',
    argumentos: { p_tipo_actual: 'bfd-sm-id', p_con_fondo: false },
  }]);
  assert.deepEqual(result, { ...input, tipoId: 'bfd-sm-sf-id' });
  assert.notEqual(result, input, 'la entrada del formulario no se muta');
});

test('un error al crear la variante SF impide guardar la línea original', async () => {
  const cliente = { rpc: async () => ({ data: null, error: { message: 'falló SF' } }) };
  await assert.rejects(
    resolverTipologiaFondo(cliente, { tipoId: 'bfd-id', conFondo: false }),
    /falló SF/,
  );
});

// Integracion adicional de materiales y persistencia.
import Module, { createRequire } from 'node:module';

type Row = Record<string, unknown>;
type Result = { data: Row | Row[] | null; error: null };
const tablas: Record<string, Row[]> = {};
const requireLocal = createRequire(import.meta.url);

class Consulta {
  private filtros: Array<[string, unknown]> = [];
  private patch?: Row;
  private unica = false;
  constructor(private tabla: string) {}
  select() { return this; }
  eq(key: string, value: unknown) { this.filtros.push([key, value]); return this; }
  order() { return this; }
  single() { this.unica = true; return this; }
  update(patch: Row) { this.patch = patch; return this; }
  then(resolve: (result: Result) => unknown) {
    const rows = (tablas[this.tabla] ?? []).filter(row => this.filtros.every(([k, v]) => row[k] === v));
    if (this.patch) for (const row of rows) Object.assign(row, this.patch);
    return Promise.resolve({ data: this.unica ? rows[0] ?? null : rows, error: null } as Result).then(resolve);
  }
}

let recalculos = 0;
let copiaResultado: { data: string | null; error: { message: string } | null } = { data: 'nueva-seccion', error: null };
const copiaLlamadas: Array<{ nombre: string; argumentos: Record<string, unknown> }> = [];
const catalogo = {
  tiposById: { w: { pref: 'W', pref_imperial: 'W', pref_metrico: 'W' } },
  tablerosByCode: { CLOSET: { espesor_mm: 18 } },
};
const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function(id, ...args) {
  const name = id.replace(/\\/g, '/');
  if (name === 'server-only') return {};
  if (name.includes('/lib/supabase/server')) return { createClient: async () => ({ from: (tabla: string) => new Consulta(tabla),
    rpc: async (nombre: string, argumentos: Record<string, unknown>) => { copiaLlamadas.push({ nombre, argumentos }); return copiaResultado; },
  }) };
  if (name === '@/lib/cotizar' || name.endsWith('/lib/cotizar.ts')) return {
    cargarCatalogoPrecompilado: async () => catalogo,
    cotizarGrupo: async (inputs: Array<{ preset: Record<string, string> }>) => {
      recalculos++;
      assert.equal(inputs[0].preset.caja, 'CLOSET', 'el motor recibe los materiales de closet');
      return { preparados: inputs.map(input => ({ prefMetrico: 'W', prefImperial: 'W', margen: 0.6, calc: { preset: input.preset, tablerosByCode: catalogo.tablerosByCode } })), lineas: inputs.map(() => ({ vars: {}, piezas: [], costoSinHerrajes: 40, costoHerrajes: 0, costoConHerrajes: 40, precioCop: 100, precioUsd: 0.025, precioConHerrajesCop: 100, precioConHerrajesUsd: 0.025, trm: 4000, margen: 0.6 })) };
    },
  };
  return original.call(this, id, ...args);
};
const api = requireLocal('../src/lib/cotizaciones.ts') as typeof import('../src/lib/cotizaciones');
loader._load = original;

test('copiar sección usa una sola RPC y conserva precios sin llamar al motor', async () => {
  const antes = recalculos;
  assert.equal(await api.duplicarCocina('origen', 'cotizacion'), 'nueva-seccion');
  assert.deepEqual(copiaLlamadas.at(-1), { nombre: 'cot_duplicar_cocina', argumentos: { p_cotizacion_id: 'cotizacion', p_cocina_id: 'origen' } });
  assert.equal(recalculos, antes);
  copiaResultado = { data: null, error: { message: 'Permiso denegado' } };
  await assert.rejects(() => api.duplicarCocina('origen', 'cotizacion'), /Permiso denegado/);
  copiaResultado = { data: null, error: null };
  await assert.rejects(() => api.duplicarCocina('origen', 'cotizacion'), /No se pudo copiar/);
  copiaResultado = { data: 'nueva-seccion', error: null };
});

test('persistencia: sincroniza un W en área closet, recalcula importes y la segunda pasada es idempotente', async () => {
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: { materialesCloset: { preset: { caja: 'CLOSET', frente: 'CLOSET' }, cantoCaja: '19x0,45', cantoFrentes: '22x1' } } }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Casa D - Closet M-07', cantidad: 37 }];
  tablas.cot_tipos_mueble = [{ id: 'w', pref: 'W' }];
  tablas.cot_tableros = [{ codigo: 'CLOSET', espesor_mm: 18 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
  tablas.cot_cotizacion_lineas = [{ id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref: 'W', posicion_grupo: 1, cantidad: 2, largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: { preset: { caja: 'COCINA', frente: 'COCINA' } } }];
  const primera = await api.sincronizarMaterialesCotizacion('q');
  assert.deepEqual(primera, { corregidas: 1, grupos: 1 });
  assert.equal(recalculos, 1);
  const linea = tablas.cot_cotizacion_lineas[0];
  const config = linea.config as Row;
  assert.deepEqual(config.preset, { caja: 'CLOSET', frente: 'CLOSET' });
  assert.equal(config.cantoCaja, '19x0,45');
  assert.equal(linea.precio_total_cop, 200);
  assert.equal(tablas.cot_cotizaciones[0].total_cop, 7400, '2 módulos x 37 áreas x 100 COP');
  assert.deepEqual(await api.sincronizarMaterialesCotizacion('q'), { corregidas: 0, grupos: 0 });
  assert.equal(recalculos, 1, 'no recalcula nuevamente lo que ya está correcto');
});
