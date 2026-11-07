import assert from 'node:assert/strict';
import { personalizarMaterialesLinea } from '../src/lib/materiales-proyecto';
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
  range() { return this; }
  single() { this.unica = true; return this; }
  update(patch: Row) { this.patch = patch; return this; }
  then(resolve: (result: Result) => unknown) {
    const rows = (tablas[this.tabla] ?? []).filter(row => this.filtros.every(([k, v]) => row[k] === v));
    if (this.patch) for (const row of rows) Object.assign(row, this.patch);
    return Promise.resolve({ data: this.unica ? rows[0] ?? null : rows, error: null } as Result).then(resolve);
  }
}

let recalculos = 0;
let ultimosInputs: Array<{ conHerrajes?: boolean; herrajesExcluidos?: string[] }> = [];
let cajaEsperada = 'CLOSET';
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
    cotizarGrupo: async (inputs: Array<{ preset: Record<string, string>; conHerrajes?: boolean; herrajesExcluidos?: string[] }>) => {
      ultimosInputs = inputs;
      recalculos++;
      assert.equal(inputs[0].preset.caja, cajaEsperada, 'el motor recibe los materiales resueltos del proyecto');
      return { preparados: inputs.map(input => ({ prefMetrico: 'W', prefImperial: 'W', margen: 0.6, calc: { preset: input.preset, tablerosByCode: catalogo.tablerosByCode } })), lineas: inputs.map(() => ({ vars: {}, piezas: [], costoSinHerrajes: 40, costoHerrajes: 0, costoConHerrajes: 40, precioCop: 100, precioUsd: 0.025, precioConHerrajesCop: 100, precioConHerrajesUsd: 0.025, trm: 4000, margen: 0.6 })) };
    },
  };
  return original.call(this, id, ...args);
};
const api = requireLocal('../src/lib/cotizaciones.ts') as typeof import('../src/lib/cotizaciones');
loader._load = original;

test('lectura de cotización reconstruye nombres y grupos históricos sin modificar datos ni precios', async () => {
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', total_cop: 6789 }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 1 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cotizacion_id: 'q', codigo_grupo: 'DB65-2S-SMG.PN60230-18MM', orden: 0 }];
  tablas.cot_tipos_mueble = [{ id: 'db', pref: 'DB-2S-SMG' }, { id: 'pn', pref: 'PN' }];
  tablas.cot_tableros = [{ codigo: 'C15', espesor_mm: 15 }, { codigo: 'F18', espesor_mm: 18 }];
  const comun = { cotizacion_id: 'q', cocina_id: 'a', grupo_id: 'g', cantidad: 1, config: { preset: { caja: 'C15', frente: 'F18' } } };
  tablas.cot_cotizacion_lineas = [
    { ...comun, id: 'l1', tipo_mueble_id: 'db', pref: 'DB-2S-SMG', codigo_modulo: 'DB65-2S-SMG', posicion_grupo: 1, largo: 65, alto: 78.5, prof: 61, unidad_dim: 'cm', precio_total_cop: 1234 },
    { ...comun, id: 'l2', tipo_mueble_id: 'pn', pref: 'PN', codigo_modulo: 'PN60230-18MM', descripcion_es: 'PANEL 600x2300x18 mm', anotaciones: 'lateral', posicion_grupo: 2, largo: 600, alto: 2300, prof: 18, unidad_dim: 'mm', precio_total_cop: 5555 },
  ];
  const antes = structuredClone(tablas);
  const q = await api.getCotizacion('q');
  const lineas = q.cocinas[0].lineas as Array<{ codigo_modulo: string; descripcion_es: string; grupo: { codigo_grupo: string }; precio_total_cop: number }>;
  assert.equal(lineas[0].codigo_modulo, 'DB6578.561-2S-SMG');
  assert.equal(lineas[1].codigo_modulo, 'PN60230');
  assert.equal(lineas[1].descripcion_es, 'PN - Panel lateral');
  assert.equal(lineas[0].grupo.codigo_grupo, 'DB6578.561-2S-SMG.PN60230');
  assert.equal(lineas[0].precio_total_cop, 1234); assert.equal(lineas[1].precio_total_cop, 5555);
  assert.deepEqual(tablas, antes);
});

test('persistencia: excepciones individuales sobreviven recálculo, sincronización y cambios globales', async () => {
  const recalculosPrevios = recalculos;
  catalogo.tiposById.w.pref = 'W';
  cajaEsperada = 'INDIVIDUAL';
  Object.assign(catalogo.tablerosByCode, { INDIVIDUAL: { espesor_mm: 18 }, GLOBAL: { espesor_mm: 15 } });
  const global = { materialesSuperiores: { preset: { caja: 'GLOBAL', frente: 'GLOBAL' }, cantoCaja: '19x0,45', cantoFrentes: '22x1' } };
  const input = personalizarMaterialesLinea({ preset: { caja: 'INDIVIDUAL', frente: 'GLOBAL' }, cantoCaja: '22x1', cantoFrentes: '22x1', conHerrajes: false, herrajesExcluidos: ['riel', 'barra'] }, global, 'W');
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: structuredClone(global) }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 1 }];
  tablas.cot_tipos_mueble = [{ id: 'w', pref: 'W' }];
  tablas.cot_tableros = [{ codigo: 'GLOBAL', espesor_mm: 15 }, { codigo: 'INDIVIDUAL', espesor_mm: 18 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
  tablas.cot_cotizacion_lineas = [{ id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref: 'W', posicion_grupo: 1, cantidad: 1, largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: input }];
  await api.recalcularGrupo('g');
  for (let i = 0; i < 2; i++) {
    await api.sincronizarMaterialesCotizacion('q');
    const restored = api.inputDesdeLinea(tablas.cot_cotizacion_lineas[0] as unknown as import('../src/lib/cotizaciones').LineaPersistida);
    assert.equal(restored.preset.caja, 'INDIVIDUAL');
    assert.equal(restored.cantoCaja, '22x1');
    assert.equal(restored.conHerrajes, false);
    assert.deepEqual(restored.herrajesExcluidos, ['riel', 'barra']);
    assert.deepEqual(restored.personalizacionMateriales, input.personalizacionMateriales);
  }
  assert.deepEqual(tablas.cot_cotizaciones[0].config_default, global);
  cajaEsperada = 'CLOSET';
  recalculos = recalculosPrevios;
});

test('reconstruir un módulo conserva activación y exclusiones de herrajes', () => {
  const linea = { id: 'l', cotizacion_id: 'q', cocina_id: 'a', grupo_id: 'g', posicion_grupo: 1,
    tipo_mueble_id: 'w', pref: 'W', largo: 60, alto: 80, prof: 30, unidad_dim: 'cm' as const,
    cantidad: 2, config: { conHerrajes: false, herrajesExcluidos: ['pata', 'tornillo'] } };
  const input = api.inputDesdeLinea(linea);
  assert.equal(input.conHerrajes, false);
  assert.deepEqual(input.herrajesExcluidos, ['pata', 'tornillo']);
  assert.equal(api.inputDesdeLinea({ ...linea, config: {} }).conHerrajes, true);
  assert.equal(api.inputDesdeLinea({ ...linea, config: { conHerrajes: true, herrajesExcluidos: null } }).herrajesExcluidos, undefined);
  assert.deepEqual(api.inputDesdeLinea({ ...linea, config: { conHerrajes: true, herrajesExcluidos: ['tornillo'] } }).herrajesExcluidos, ['tornillo']);
});

test('sincronizar un resultado histórico con fondo delgado recalcula aunque el material no cambie', async () => {
  const previos = recalculos;
  Object.assign(catalogo.tablerosByCode, { C6: { espesor_mm: 6 } });
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: {} }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 1 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
  tablas.cot_tipos_mueble = [{ id: 'w', pref: 'W' }];
  tablas.cot_tableros = [{ codigo: 'CLOSET', espesor_mm: 18 }, { codigo: 'C6', espesor_mm: 6 }];
  tablas.cot_cotizacion_lineas = [{ id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref: 'W', posicion_grupo: 1, cantidad: 1, largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: { preset: { caja: 'CLOSET', fondo: 'C6' } }, breakdown: { maderaPorRol: [{ rol: 'caja', codigo: 'CLOSET' }, { rol: 'fondo', codigo: 'C6' }], piezas: [{ rol: 'fondo', cantoLargos: 0, cantoAnchos: 0, cantoCalibre: '19x0,45' }] } }];
  assert.deepEqual(await api.sincronizarMaterialesCotizacion('q'), { corregidas: 1, grupos: 1 });
  assert.equal(recalculos, previos + 1);
  assert.deepEqual(await api.sincronizarMaterialesCotizacion('q'), { corregidas: 0, grupos: 0 });
  assert.deepEqual((tablas.cot_cotizacion_lineas[0].config as Row).preset, { caja: 'CLOSET', fondo: 'C6' });
  recalculos = previos;
});

test('recalcular conserva metadatos históricos y no agrega selecciones nulas ausentes', async () => {
  const recalculosPrevios = recalculos;
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: {} }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 1 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
  tablas.cot_cotizacion_lineas = [{ id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref: 'W', posicion_grupo: 1, cantidad: 1, largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: { preset: { caja: 'CLOSET' }, anotacionHistorica: 'conservar', cantoFrentes: null } }];
  await api.recalcularGrupo('g');
  const config = tablas.cot_cotizacion_lineas[0].config as Row;
  assert.equal(config.anotacionHistorica, 'conservar');
  assert.equal(Object.hasOwn(config, 'personalizacionMateriales'), false);
  assert.equal(Object.hasOwn(config, 'barraCodigo'), false);
  assert.equal(Object.hasOwn(config, 'cantoFrentes'), true);
  assert.equal(config.cantoFrentes, null);
  recalculos = recalculosPrevios;
});

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

test('cambiar TRM conserva exclusiones individuales en el motor y la fila guardada', async () => {
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: {} }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 1 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
  const linea = { id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref: 'W', posicion_grupo: 1, cantidad: 1,
    largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: { preset: { caja: 'CLOSET' }, conHerrajes: false, herrajesExcluidos: ['pata', 'tornillo'] } };
  tablas.cot_cotizacion_lineas = [linea];
  await api.actualizarCotizacion('q', { trm: 4100 });
  assert.equal(ultimosInputs[0].conHerrajes, false);
  assert.deepEqual(ultimosInputs[0].herrajesExcluidos, ['pata', 'tornillo']);
  assert.equal(linea.config.conHerrajes, false);
  assert.deepEqual(linea.config.herrajesExcluidos, ['pata', 'tornillo']);
  await api.actualizarCotizacion('q', { trm: 4200 });
  assert.equal(linea.config.conHerrajes, false, 'una segunda actualización tampoco reactiva herrajes');
  assert.deepEqual(linea.config.herrajesExcluidos, ['pata', 'tornillo']);
});

test('persistencia: los cuatro abiertos heredan el frente global y la segunda sincronización no recalcula', async () => {
  for (const pref of ['OBFD', 'OBFD-SM', 'OSBFD-SM', 'OW']) {
    catalogo.tiposById.w.pref = pref;
    cajaEsperada = 'PRIRH18CONSTRUCTOR';
    Object.assign(catalogo.tablerosByCode, { PRIRH18CONSTRUCTOR: { espesor_mm: 18 }, PRIRH6CONSTRUCTOR: { espesor_mm: 6 } });
    const antes = recalculos;
    tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: {
      materialesInferiores: { preset: { caja: 'CAJA15', refuerzo: 'CAJA15', frente: 'PRIRH18CONSTRUCTOR' } },
      materialesSuperiores: { preset: { caja: 'CAJA15', refuerzo: 'CAJA15', frente: 'PRIRH18CONSTRUCTOR' } },
    } }];
    tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 2 }];
    tablas.cot_tipos_mueble = [{ id: 'w', pref }];
    tablas.cot_tableros = [{ codigo: 'PRIRH18CONSTRUCTOR', espesor_mm: 18 }, { codigo: 'CAJA15', espesor_mm: 15 }, { codigo: 'F6', espesor_mm: 6 }];
    tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
    tablas.cot_cotizacion_lineas = [{ id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref, posicion_grupo: 1, cantidad: 1, largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: { preset: { caja: 'CAJA15', refuerzo: 'CAJA15', frente: 'CAJA15', fondo: 'F6' } } }];
    assert.deepEqual(await api.sincronizarMaterialesCotizacion('q'), { corregidas: 1, grupos: 1 });
    assert.deepEqual((tablas.cot_cotizacion_lineas[0].config as Row).preset, { caja: 'PRIRH18CONSTRUCTOR', refuerzo: 'PRIRH18CONSTRUCTOR', frente: 'PRIRH18CONSTRUCTOR', fondo: 'PRIRH6CONSTRUCTOR' });
    assert.equal(tablas.cot_cotizaciones[0].total_cop, 200);
    assert.deepEqual(await api.sincronizarMaterialesCotizacion('q'), { corregidas: 0, grupos: 0 });
    assert.equal(recalculos, antes + 1);
  }
  catalogo.tiposById.w.pref = 'W';
});

test('persistencia OW-MO corrige un preset heredado y conserva el fondo del frente en segunda pasada', async () => {
  catalogo.tiposById.w.pref = 'OW-MO';
  cajaEsperada = 'PRIRH18CONSTRUCTOR';
  Object.assign(catalogo.tablerosByCode, { PRIRH18CONSTRUCTOR: { espesor_mm: 18 }, PRIRH6CONSTRUCTOR: { espesor_mm: 6 } });
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: {
    materialesSuperiores: { preset: { caja: 'CAJA15', refuerzo: 'CAJA15', frente: 'PRIRH18CONSTRUCTOR', fondo: 'OTRO6' } },
  } }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 2 }];
  tablas.cot_tipos_mueble = [{ id: 'w', pref: 'OW-MO' }];
  tablas.cot_tableros = [{ codigo: 'PRIRH18CONSTRUCTOR', espesor_mm: 18 }, { codigo: 'PRIRH6CONSTRUCTOR', espesor_mm: 6 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
  tablas.cot_cotizacion_lineas = [{ id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref: 'OW-MO', posicion_grupo: 1, cantidad: 1, largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: { preset: { caja: 'CAJA15', refuerzo: 'CAJA15', frente: 'PRIRH18CONSTRUCTOR', fondo: 'OTRO6' } } }];
  assert.deepEqual(await api.sincronizarMaterialesCotizacion('q'), { corregidas: 1, grupos: 1 });
  assert.deepEqual((tablas.cot_cotizacion_lineas[0].config as Row).preset, {
    caja: 'PRIRH18CONSTRUCTOR', refuerzo: 'PRIRH18CONSTRUCTOR', frente: 'PRIRH18CONSTRUCTOR', fondo: 'PRIRH6CONSTRUCTOR',
  });
  const snapshot = structuredClone(tablas.cot_cotizacion_lineas);
  assert.deepEqual(await api.sincronizarMaterialesCotizacion('q'), { corregidas: 0, grupos: 0 });
  assert.deepEqual(tablas.cot_cotizacion_lineas, snapshot);
  cajaEsperada = 'CLOSET';
});

test('sincronización limitada deja intactas las líneas y áreas ajenas y rechaza grupos mezclados antes de escribir', async () => {
  catalogo.tiposById.w.pref = 'OW';
  tablas.cot_cotizaciones = [{ id: 'q', sistema_medida: 'metrico', config_default: { materialesSuperiores: { preset: { caja: 'C15', refuerzo: 'C15', frente: 'CLOSET' } } } }];
  tablas.cot_cocinas = [{ id: 'a', cotizacion_id: 'q', nombre: 'Cocina', cantidad: 1 }, { id: 'otra', cotizacion_id: 'q', nombre: 'Otra', cantidad: 1, total_cop: 50, total_usd: 0.01 }];
  tablas.cot_tipos_mueble = [{ id: 'w', pref: 'OW' }];
  tablas.cot_tableros = [{ codigo: 'CLOSET', espesor_mm: 18 }, { codigo: 'C15', espesor_mm: 15 }];
  tablas.cot_grupos_modulos = [{ id: 'g', cocina_id: 'a', cotizacion_id: 'q' }];
  const ajena = { id: 'ajena', cocina_id: 'otra', cotizacion_id: 'q', grupo_id: 'otro', cantidad: 1, precio_total_cop: 50, precio_total_usd: 0.01, config: { material: { tipo: 'herraje', codigo: 'X', cantidad: 1 } } };
  tablas.cot_cotizacion_lineas = [{ id: 'l', cocina_id: 'a', cotizacion_id: 'q', grupo_id: 'g', tipo_mueble_id: 'w', pref: 'OW', posicion_grupo: 1, cantidad: 1, largo: 60, alto: 80, prof: 30, unidad_dim: 'cm', config: { preset: { caja: 'C15', refuerzo: 'C15', frente: 'CLOSET' } } }, ajena];
  const snapshot = structuredClone({ ajena, area: tablas.cot_cocinas[1], config: tablas.cot_cotizaciones[0].config_default });
  assert.deepEqual(await api.sincronizarMaterialesCotizacion('q', { lineasPermitidas: ['l'] }), { corregidas: 1, grupos: 1 });
  assert.deepEqual({ ajena, area: tablas.cot_cocinas[1], config: tablas.cot_cotizaciones[0].config_default }, snapshot);
  assert.equal(tablas.cot_cotizaciones[0].total_cop, 150);
  ajena.grupo_id = 'g';
  const antes = structuredClone(tablas);
  await assert.rejects(() => api.sincronizarMaterialesCotizacion('q', { lineasPermitidas: ['l'] }), /fuera del alcance/);
  assert.deepEqual(tablas, antes, 'un grupo mixto falla antes de cualquier escritura');
  catalogo.tiposById.w.pref = 'W';
});


test('ordenar secciones usa una sola RPC, propaga errores y no llama al motor', async () => {
  const antes = recalculos;
  copiaResultado = { data: 'cotizacion', error: null };
  await api.reordenarCocinas('cotizacion', ['b', 'a']);
  assert.deepEqual(copiaLlamadas.at(-1), { nombre: 'cot_reordenar_cocinas', argumentos: { p_cotizacion_id: 'cotizacion', p_cocina_ids: ['b', 'a'] } });
  const llamadasAntes = copiaLlamadas.length;
  await assert.rejects(() => api.reordenarCocinas('cotizacion', ['a', 'a']), /repetir secciones/);
  assert.equal(copiaLlamadas.length, llamadasAntes);
  copiaResultado = { data: null, error: { message: 'Las secciones cambiaron' } };
  await assert.rejects(() => api.reordenarCocinas('cotizacion', ['b', 'a']), /Las secciones cambiaron/);
  copiaResultado = { data: null, error: null };
  await assert.rejects(() => api.reordenarCocinas('cotizacion', ['b', 'a']), /No se pudo guardar/);
  assert.equal(recalculos, antes);
  copiaResultado = { data: 'nueva-seccion', error: null };
});
