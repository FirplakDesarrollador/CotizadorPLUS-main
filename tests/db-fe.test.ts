import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import Module, { createRequire } from 'node:module';
import { calcularMueble } from '../src/lib/engine';
import { DB_FE_TIPOLOGIAS, DB_TIPOLOGIAS, etiquetaTipologiaDb, permiteTipologiaDb, aplicarConfiguracionDbFe } from '../src/lib/muebles';
import { codigoComercial } from '../src/lib/module-groups';
import { construirVisualizacion } from '../src/lib/visualizacion';

const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function(id, ...args) { return id === 'server-only' ? {} : original.call(this, id, ...args); };
const api = createRequire(import.meta.url)('../src/lib/cotizar.ts') as typeof import('../src/lib/cotizar');
loader._load = original;

const fuente = JSON.parse(fs.readFileSync('tests/fixtures/db-fe.json', 'utf8'));
const tipo = fuente.tipos.find((t: { pref: string }) => t.pref === 'DB-FE');
const base = fuente.tipos.find((t: { pref: string }) => t.pref === 'DB');
const catalogo: import('../src/lib/cotizar').CatalogoPrecompilado = {
  params: fuente.params, tiposById: Object.fromEntries(fuente.tipos.map((t: { id: string }) => [t.id, t])),
  piezasByTipoId: fuente.piezas, reglasByTipoId: fuente.reglas, reglasGlobales: fuente.reglasGlobales,
  herrajesPlantByTipoId: fuente.herrajes, herrajesByCode: fuente.herrajesByCode, cantosByCalibre: { '19X0,45': { calibre: '19x0,45', precio: 100 }, '22X1': { calibre: '22x1', precio: 150 } }, consumiblesBySelector: {},
  tablerosByCode: { C15: { codigo: 'C15', espesor_mm: 15, precio_m2: 10000 }, F18: { codigo: 'F18', espesor_mm: 18, precio_m2: 15000 }, B6: { codigo: 'B6', espesor_mm: 6, precio_m2: 5000 } },
};
const input = (dbTipo: string): import('../src/lib/cotizar').CotizarInput => ({
  tipoId: tipo.id, dbTipo, largo: 24, alto: 30, prof: 24, unidad: 'in', conHerrajes: true,
  preset: { caja: 'C15', refuerzo: 'C15', frente: 'F18', fondo: 'B6' },
  rielCodigo: 'RIELTANDEM', overrides: { gola: 1, n_barras: 8 },
});

test('DB-FE es una tipología principal con las seis variantes DB sin barras Tandem', () => {
  assert.equal(tipo.pref, 'DB-FE');
  assert.equal(permiteTipologiaDb('DB-FE'), true);
  assert.equal(permiteTipologiaDb('DB-FE-SF'), true);
  assert.deepEqual(DB_FE_TIPOLOGIAS.map(t => t.key), DB_TIPOLOGIAS.map(t => t.key));
  assert.ok(DB_FE_TIPOLOGIAS.every(t => t.nb === 0 && !t.desc.includes('barras')));
  assert.equal(etiquetaTipologiaDb('DB-2S', 'DB-FE'), 'DB-2S-FE');
  assert.equal(etiquetaTipologiaDb('DB2-1OP', 'DB-FE'), 'DB-2-1INT-FE');
});

test('carcasa, frentes y agrupación de DB-FE conservan la DB fuente', () => {
  const omitidas = new Set(['base_gaveta', 'trasero_gaveta_pequena', 'trasero_gaveta_grande']);
  const limpiar = (p: Record<string, unknown>) => Object.fromEntries(Object.entries(p).filter(([k]) => !['id', 'tipo_mueble_id', 'created_at', 'updated_at'].includes(k)));
  for (const p of fuente.piezas[base.id].filter((p: { nombre: string }) => !omitidas.has(p.nombre))) {
    assert.deepEqual(limpiar(fuente.piezas[tipo.id].find((n: { nombre: string }) => n.nombre === p.nombre)), limpiar(p));
  }
  assert.equal(tipo.permite_agrupacion, base.permite_agrupacion);
});

test('la configuración que se persiste corrige riel y Gola heredados sin mutar DB', () => {
  const original = { dbTipo: 'DB-2S', rielCodigo: 'RIELTANDEM', sistemaFrente: 'gola', overrides: { gola: 1, n_barras: 2, n_cajones: 4 } };
  const efectiva = aplicarConfiguracionDbFe(original, 'DB-FE');
  assert.equal(efectiva.rielCodigo, 'RIELFE500');
  assert.equal(efectiva.sistemaFrente, 'manija');
  assert.deepEqual(efectiva.overrides, { gola: 0, n_barras: 0, n_cajones: 3, n_cajones_pequenos: 2, n_cajones_ocultos: 0 });
  assert.equal(original.rielCodigo, 'RIELTANDEM');
  assert.strictEqual(aplicarConfiguracionDbFe(original, 'DB'), original);
});

test('todas las variantes FE usan dimensiones de madera FE, riel real y frentes DB', async () => {
  const precioTandem = catalogo.herrajesByCode.RIELTANDEM.precio;
  for (const variante of DB_FE_TIPOLOGIAS) {
    const p = await api.prepararCotizacion(input(variante.key), catalogo);
    const r = calcularMueble(p.calc);
    assert.ok(Number.isFinite(r.precioConHerrajesCop) && r.precioConHerrajesCop > 0);
    assert.equal(catalogo.herrajesByCode.RIELTANDEM.precio, precioTandem, 'FE no altera el precio del riel de DB');
    assert.equal(r.vars.gola, 0);
    assert.equal(r.vars.n_cajones, variante.nc);
    assert.equal(r.vars.n_cajones_ocultos, variante.noculto ?? 0);
    const rail = r.herrajes.find(h => h.rol === 'riel')!;
    assert.equal(rail.codigo, 'RIELFE500');
    assert.equal(rail.cant, variante.nc);
    assert.equal(rail.precio, fuente.herrajesByCode.RIELFE500.precio);
    assert.equal(r.herrajes.some(h => h.rol === 'barra' || h.codigo === 'RIELTANDEM'), false);
    const fondos = r.piezas.filter(x => x.pieza === 'fondo_gaveta');
    assert.equal(fondos.reduce((n, x) => n + x.cant, 0), variante.nc);
    assert.ok(fondos.every(x => Math.abs(x.largoIn * 25.4 - 492) < .01));
    assert.equal(r.piezas.filter(x => x.pieza.startsWith('lateral_gaveta')).reduce((n, x) => n + x.cant, 0), 2 * variante.nc);
    for (const lateral of r.piezas.filter(x => x.pieza.startsWith('lateral_gaveta'))) assert.ok(Math.abs(lateral.largoIn * 25.4 - 500) < .01);
    const db = await api.prepararCotizacion({ ...input(variante.key), tipoId: base.id, overrides: { gola: 0, n_cajones: variante.nc, n_cajones_pequenos: variante.npeq, n_cajones_ocultos: variante.noculto ?? 0 } }, catalogo);
    const fronts = (r: ReturnType<typeof calcularMueble>) => r.piezas.filter(x => x.rol === 'frente');
    assert.deepEqual(fronts(r), fronts(calcularMueble(db.calc)), variante.key);
    const codigo = codigoComercial({ pref: 'DB-FE', largo: 24, alto: 30, prof: 24, unidad: 'in', sistema: 'imperial', dbTipo: variante.key, sistemaFrente: 'gola' });
    assert.equal(codigo, `DB24${variante.key === 'DB2-1OP' ? '-2-1INT' : variante.key.slice(2)}-FE`);
  }
  await assert.rejects(api.prepararCotizacion(input('NO-EXISTE'), catalogo), /Variante DB-FE/);
});

test('DB-FE agrupada comparte carcasa y conserva las cajas y rieles de cada módulo', async () => {
  const g = await api.cotizarGrupo([input('DB-1S'), input('DB2-1OP')], catalogo);
  assert.equal(g.lineas.reduce((n, r) => n + r.herrajes.filter(h => h.codigo === 'RIELFE500').reduce((n, h) => n + h.cant, 0), 0), 6);
  const escena = construirVisualizacion(g.preparados, g);
  assert.equal(escena.omitidas.length, 0);
  assert.ok(escena.paneles.some(p => p.nombre.includes('lateral_gaveta')));
});
