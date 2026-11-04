import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';
import { calcularMueble } from '../src/lib/engine';

// Ejecuta el preparador real con catálogo en memoria, sin consultas ni escrituras.
const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function(id, ...args) {
  if (id === 'server-only') return {};
  return original.call(this, id, ...args);
};
const { prepararCotizacion } = createRequire(import.meta.url)('../src/lib/cotizar.ts') as typeof import('../src/lib/cotizar');
loader._load = original;

test('el cálculo real usa el tablero y espesor de frente en caja y refuerzos de los abiertos', async () => {
  for (const pref of ['OBFD', 'OBFD-SM', 'OSBFD-SM', 'OW', 'OW-MO']) {
    const catalogo: import('../src/lib/cotizar').CatalogoPrecompilado = {
      params: {},
      tiposById: { abierto: { id: 'abierto', pref, pref_imperial: pref, pref_metrico: pref, permite_agrupacion: true, etiquetas_und: 0, margen_key: 'muebles', usa_carton: false, categoria: 'cocina' } },
      piezasByTipoId: { abierto: [
        { nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: 'P', cantos: {} },
        { nombre: 'refuerzo_trasero', rol_tablero: 'refuerzo', formula_cantidad: '1', formula_largo: 'L-2*TC', formula_ancho: '3', cantos: {} },
        { nombre: 'fondo', rol_tablero: 'fondo', formula_cantidad: '1', formula_largo: 'L-2*TB', formula_ancho: 'A', cantos: {} },
      ] },
      reglasByTipoId: {}, reglasGlobales: [], herrajesPlantByTipoId: {}, cantosByCalibre: {}, herrajesByCode: {}, consumiblesBySelector: {},
      tablerosByCode: {
        C15: { codigo: 'C15', precio_m2: 1, espesor_mm: 15 },
        F18: { codigo: 'F18', precio_m2: 100, espesor_mm: 18 },
        F6: { codigo: 'F6', precio_m2: 80, espesor_mm: 6 },
        B6: { codigo: 'B6', precio_m2: 1, espesor_mm: 6 },
      },
    };
    const input = { tipoId: 'abierto', largo: 60, alto: 80, prof: 30, unidad: 'cm' as const, preset: { caja: 'C15', refuerzo: 'C15', frente: 'F18', fondo: 'B6' }, conHerrajes: false };
    const preparado = await prepararCotizacion(input, catalogo);
    assert.deepEqual(preparado.calc.preset, { caja: 'F18', refuerzo: 'F18', frente: 'F18', fondo: 'F6' });
    const resultado = calcularMueble(preparado.calc);
    for (const rol of ['caja', 'refuerzo']) {
      assert.equal(resultado.maderaPorRol.find(r => r.rol === rol)?.codigo, 'F18');
    }
    assert.ok(Math.abs(resultado.piezas.find(p => p.pieza === 'base')!.largoIn * 25.4 - 564) < 0.01, 'TC usa 18 mm, no los 15 mm anteriores');
    assert.equal(resultado.maderaPorRol.find(r => r.rol === 'fondo')?.codigo, 'F6');
    assert.equal(input.preset.caja, 'C15');
    const filaFondo = resultado.maderaPorRol.find(r => r.rol === 'fondo')!;
    assert.ok(filaFondo, 'el fondo se incluye en consumo y costo');
    assert.ok(Math.abs(resultado.piezas.find(p => p.pieza === 'fondo')!.largoIn * 25.4 - 588) < 0.01, 'TB toma los 6 mm reales del fondo de color');
    assert.ok(Math.abs(filaFondo.costo - filaFondo.m2 * 80) < 0.01, 'el costo usa el precio por m2 de F6, no el blanco B6');

    delete catalogo.tablerosByCode.F6;
    await assert.rejects(prepararCotizacion(input, catalogo), /Fondo del color del frente no disponible/);

  }
});
