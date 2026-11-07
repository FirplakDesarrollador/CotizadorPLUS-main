import assert from 'node:assert/strict';
import test from 'node:test';
import { ajustarFrentesDosPequenosGola } from '../src/lib/frentes-gaveta';
import { calcularMueble, toInches, type Pieza, type Regla, type CalcInput } from '../src/lib/engine';
import { construirVisualizacion } from '../src/lib/visualizacion';
import { calcularGrupoFisico, type PreparedGroupMember } from '../src/lib/group-engine';
import Module, { createRequire } from 'node:module';

const piezas: Pieza[] = [
  { nombre: 'lateral', rol_tablero: 'caja', formula_cantidad: '2', formula_largo: 'A', formula_ancho: 'P', cantos: {} },
  { nombre: 'frente_gaveta_pequena', rol_tablero: 'frente', formula_cantidad: '2', formula_largo: 'L-RV', formula_ancho: 'alto_frente_pequeno', cantos: { calibre: '22x1', largos: 2, anchos: 2 }, visualizacion: { version: 1, funcion: 'frente_gaveta', plano: 'XZ', intercambiar: false, confirmado: true } },
  { nombre: 'frente_gaveta_grande', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L-RV', formula_ancho: 'A-3*RV-53.6/25.4-2*alto_frente_pequeno', cantos: { calibre: '22x1', largos: 2, anchos: 2 }, visualizacion: { version: 1, funcion: 'frente_gaveta', plano: 'XZ', intercambiar: false, confirmado: true } },
];
const reglas: Regla[] = [{ tipo_mueble_id: 'tipo', variable: 'alto_frente_pequeno', condicion: 'true', valor: '(A-4*RV)/4-13.4/25.4', prioridad: 10 }];
function input(pref: string, altoMm: number): CalcInput {
  const corregido = ajustarFrentesDosPequenosGola(piezas, reglas, pref);
  return { dims: { L: 650 / 25.4, A: altoMm / 25.4, P: 610 / 25.4 }, ...corregido,
    preset: { caja: 'C15', frente: 'F18' }, tablerosByCode: { C15: { codigo: 'C15', espesor_mm: 15, precio_m2: 100 }, F18: { codigo: 'F18', espesor_mm: 18, precio_m2: 200 } },
    cantosByCalibre: { '22X1': { calibre: '22x1', precio: 5 } }, herrajesPlantilla: [], herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0, usaCarton: false, margen: 0.6, trm: 4000, desperdicio: 0.1, overrides: { gola: 1 },
  };
}

test('SM/SMG 2S y sus variantes FE/SF cumplen el ejemplo y cierran altura, golas y luces', () => {
  for (const pref of ['DB-2S-SMG', 'DB-2S-SMG-FE', 'DB-2S-SMG-SF', 'DB-2S-SMG-FE-SF', 'DB-2S-SM', 'DB-2S-SM-FE', 'DB-2S-SM-SF', 'DB-2S-SM-FE-SF']) {
    for (const [alto, grande, pequeno] of [[780, 360, 176.8], [785, 362.5, 178.05], [762, 351, 172.3]]) {
      const resultado = calcularMueble(input(pref, alto));
      const small = resultado.piezas.find(p => p.pieza === 'frente_gaveta_pequena')!;
      const big = resultado.piezas.find(p => p.pieza === 'frente_gaveta_grande')!;
      assert.ok(Math.abs(small.anchoIn * 25.4 - pequeno) < 0.001, pref);
      assert.ok(Math.abs(big.anchoIn * 25.4 - grande) < 0.001, pref);
      assert.ok(Math.abs(small.largoIn * 25.4 - 646.8) < 0.001);
      assert.equal(small.cant, 2); assert.equal(big.cant, 1);
      assert.ok(Math.abs(2 * small.anchoIn * 25.4 + big.anchoIn * 25.4 + 60 + 2 * 3.2 - alto) < 0.001);
      assert.equal(small.cantoCalibre, '22x1');
    }
  }
});

test('cm, mm y pulgadas producen los mismos frentes y no se muta el catálogo recibido', () => {
  const original = structuredClone({ piezas, reglas });
  const referencia = calcularMueble(input('DB-2S-SMG', 780));
  for (const [valor, unidad] of [[78, 'cm'], [780, 'mm'], [780 / 25.4, 'in']] as const) {
    const calc = input('DB-2S-SMG', 780); calc.dims.A = toInches(valor, unidad);
    assert.deepEqual(calcularMueble(calc).piezas, referencia.piezas);
  }
  assert.deepEqual({ piezas, reglas }, original);
  for (const pref of ['DB', 'DB-FE', 'DB-2-SMG', 'DB-3-SMG', 'DB-2-1INT-SMG', 'BFD-SMG']) assert.deepEqual(ajustarFrentesDosPequenosGola(piezas, reglas, pref), original);
});

test('la visualización usa dos espacios de gola de 30 mm y conserva las alturas calculadas', () => {
  const miembro: PreparedGroupMember = { pref: 'DB-2S-SMG', permiteAgrupacion: true, calc: input('DB-2S-SMG', 780) };
  const grupo = calcularGrupoFisico([miembro]);
  const escena = construirVisualizacion([miembro], grupo);
  const frentes = escena.paneles.filter(p => p.funcion === 'frente_gaveta').sort((a, b) => b.z - a.z);
  assert.equal(frentes.length, 3);
  assert.ok(Math.abs(frentes[0].h - 176.8) < 0.001);
  assert.ok(Math.abs(frentes[2].h - 360) < 0.001);
  assert.ok(Math.abs(frentes[0].z + frentes[0].h - 750) < 0.001, 'la gola superior ocupa 30 mm');
  assert.ok(Math.abs(frentes[2].z) < 0.001, 'el frente inferior llega al borde inferior');
  assert.ok(!escena.avisos.some(a => /exceden el alto/.test(a)));
});

test('el preparador compartido corrige también un catálogo precargado con las fórmulas anteriores', async () => {
  const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
  const original = loader._load;
  let preparar: typeof import('../src/lib/cotizar')['prepararCotizacion'];
  try {
    loader._load = function(id, ...args) { return id === 'server-only' ? {} : original.call(this, id, ...args); };
    preparar = createRequire(import.meta.url)('../src/lib/cotizar.ts').prepararCotizacion;
  } finally { loader._load = original; }
  for (const pref of ['DB-2S-SM', 'DB-2S-SMG', 'DB-2S-SM-FE', 'DB-2S-SMG-FE-SF']) {
    const calc = input(pref, 780);
    const catalogo: import('../src/lib/cotizar').CatalogoPrecompilado = {
      params: {}, tiposById: { tipo: { id: 'tipo', pref, pref_imperial: pref, pref_metrico: pref, permite_agrupacion: true, etiquetas_und: 0, margen_key: 'muebles', usa_carton: false, categoria: 'inferior' } },
      piezasByTipoId: { tipo: piezas }, reglasByTipoId: { tipo: reglas }, reglasGlobales: [],
      herrajesPlantByTipoId: {}, cantosByCalibre: calc.cantosByCalibre, herrajesByCode: { RIELFE500: { codigo: 'RIELFE500', precio: 31, categoria: 'riel' } }, consumiblesBySelector: {}, tablerosByCode: calc.tablerosByCode,
    };
    const preparado = await preparar({ tipoId: 'tipo', largo: 650, alto: 780, prof: 610, unidad: 'mm', preset: calc.preset, conHerrajes: false, overrides: { gola: 1 } }, catalogo);
    const resultado = calcularMueble(preparado.calc);
    assert.ok(Math.abs(resultado.piezas.find(p => p.pieza === 'frente_gaveta_pequena')!.anchoIn * 25.4 - 176.8) < 0.001, pref);
    assert.ok(Math.abs(resultado.piezas.find(p => p.pieza === 'frente_gaveta_grande')!.anchoIn * 25.4 - 360) < 0.001, pref);
  }
});
