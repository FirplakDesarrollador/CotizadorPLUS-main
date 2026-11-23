import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularMueble, type CalcInput } from '../src/lib/engine';
import { construirFilas } from '../src/app/hdr/datosHdr';
import { especificacionesProyecto } from '../src/lib/materiales-proyecto';

const input = (espesor: number, rol = 'fondo'): CalcInput => ({
  dims: { L: 24, A: 30, P: 24 },
  piezas: [{ nombre: 'refuerzo_trasero', rol_tablero: rol, formula_cantidad: '2', formula_largo: 'L', formula_ancho: 'A', cantos: { calibre: '22x1', largos: 2, anchos: 2, forceCalibre: true, despEdges: 10 } }],
  reglas: [], overrides: {}, preset: { [rol]: 'TAB', frente: 'F18' },
  tablerosByCode: { TAB: { codigo: 'TAB', espesor_mm: espesor, precio_m2: 100 }, F18: { codigo: 'F18', espesor_mm: 18, precio_m2: 100 } },
  cantosByCalibre: {}, herrajesPlantilla: [], herrajesByCode: {}, consumiblesBySelector: {}, etiquetasUnd: 0, usaCarton: false, margen: 0, trm: 4000, desperdicio: 0,
  cantoCaja: 'CANTO_NO_EXISTE', cantoFrentes: 'CANTO_NO_EXISTE', cantoFrentesEnTodasLasPiezas: true,
});

test('4,5 / 5,5 / 6 / 9 mm no tienen aristas, calibre, desperdicio ni costo de canto, incluso con overrides', () => {
  for (const espesor of [4.5, 5.5, 6, 9]) for (const rol of ['caja', 'frente', 'refuerzo', 'fondo', 'gaveta']) {
    const original = input(espesor, rol);
    if (rol === 'frente') original.preset.frente = 'TAB';
    const before = structuredClone(original);
    // El rol independiente de gaveta sigue exigiendo 15 mm; no es una selección válida de tablero delgado.
    if (rol === 'gaveta') {
      assert.throws(() => calcularMueble(original), /Tablero Gaveta debe ser de 15 mm/);
      assert.deepEqual(original, before);
      continue;
    }
    const result = calcularMueble(original);
    assert.equal(result.piezas[0].cantoLargos, 0, `${espesor}/${rol}`);
    assert.equal(result.piezas[0].cantoAnchos, 0);
    assert.equal(result.piezas[0].cantoCalibre, null);
    assert.equal(result.costoCanto, 0);
    assert.deepEqual(result.cantoPorCalibre, []);
    assert.ok(result.costoMadera > 0);
    assert.equal(result.piezas[0].cant, 2);
    assert.deepEqual(original, before);
  }
});

test('15 y 18 mm conservan sus cantos y costo', () => {
  for (const espesor of [15, 18]) {
    const cfg = input(espesor);
    cfg.cantoFrentesEnTodasLasPiezas = false;
    cfg.cantosByCalibre = { '22X1': { calibre: '22x1', precio: 100 } };
    const result = calcularMueble(cfg);
    assert.equal(result.piezas[0].cantoLargos, 2);
    assert.equal(result.piezas[0].cantoAnchos, 2);
    assert.equal(result.piezas[0].cantoCalibre, '22x1');
    assert.ok(result.costoCanto > 0);
  }
});

test('HDR oculta también el calibre y contadores de un resultado histórico de 6 mm', () => {
  const r = calcularMueble(input(6));
  const legacy = { ...r, trm: 4000, margen: 0, piezas: r.piezas.map(p => ({ ...p, cantoLargos: 2, cantoAnchos: 2, cantoCalibre: '19x0,45' })) };
  const filas = construirFilas(legacy, [{ codigo: 'TAB', espesor_mm: 6 }]);
  assert.equal(filas.length, 2);
  for (const f of filas) {
    assert.equal(f.espesorCanto, '');
    assert.equal(f.cantoLargoColor + f.cantoAnchoColor + f.cantoLargoBlanco + f.cantoAnchoBlanco, 0);
  }
  assert.equal(legacy.piezas[0].cantoCalibre, '19x0,45', 'el render no modifica un snapshot');
});

test('las especificaciones imprimen Sin canto sin modificar el calibre elegido en el proyecto', () => {
  const config = { preset: { caja: 'C6', frente: 'F18' }, cantoCaja: '19x0,45', cantoFrentes: '22x1' };
  const catalogo = [{ codigo: 'C6', espesor_mm: 6, proveedor: null, sustrato: null, color_nombre: null }, { codigo: 'F18', espesor_mm: 18, proveedor: null, sustrato: null, color_nombre: null }];
  const result = especificacionesProyecto(config, catalogo);
  assert.deepEqual(result[0].filas.find(([rol]) => rol === 'Canto de caja'), ['Canto de caja', 'Sin canto (tablero de 6 mm)']);
  assert.deepEqual(result[0].filas.find(([rol]) => rol === 'Canto de frentes'), ['Canto de frentes', '22x1']);
  assert.equal(config.cantoCaja, '19x0,45');
});
