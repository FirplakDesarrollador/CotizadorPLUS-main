import assert from 'node:assert/strict';
import test from 'node:test';
import { ordenarPiezasHdr } from '../src/app/hdr/ordenPiezas';
import { validarEntrepanosHdr, exigirRevisionHdr } from '../src/app/hdr/validacion';
import { construirFilas, descripcionModulo, consolidarModulosHdr } from '../src/app/hdr/datosHdr';
import { calcularMueble, type CalcInput } from '../src/lib/engine';

const calc: CalcInput = {
  dims: { L: 96.2 / 2.54, A: 78 / 2.54, P: 67 / 2.54 },
  piezas: [{ nombre: 'entrepano', rol_tablero: 'caja', formula_cantidad: 'n_entrepanos', formula_largo: 'L-2*TC-1/25.4', formula_ancho: 'P-2' }],
  reglas: [{ tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'A<=27', valor: '1', prioridad: 10 }, { tipo_mueble_id: null, variable: 'n_entrepanos', condicion: 'true', valor: '2', prioridad: 20 }],
  overrides: { n_entrepanos: 1 }, preset: { caja: 'C15' }, tablerosByCode: { C15: { codigo: 'C15', espesor_mm: 15, precio_m2: 100 } },
  herrajesPlantilla: [], herrajesByCode: {}, cantosByCalibre: {}, consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, trm: 4000, desperdicio: 0,
};

test('W96.27867-SM-PUSH detecta el override histórico de uno frente a dos entrepaños', () => {
  const antes = structuredClone(calc);
  assert.match(validarEntrepanosHdr(calc)[0], /genera 1;.*generan 2/);
  assert.deepEqual(calc, antes);
  const corregido = { ...calc, overrides: {} };
  const res = { ...calcularMueble(corregido), trm: 4000, margen: 0 };
  const filas = construirFilas(res, [{ codigo: 'C15', espesor_mm: 15 }]);
  assert.equal(filas.length, 2);
  assert.deepEqual(filas.map(p => p.pieza), ['SHELF 1', 'SHELF 2']);
  assert.ok(filas.every(p => Math.abs(p.largoMm - 931) < 0.001 && Math.abs(p.anchoMm - 619.2) < 0.001));
  assert.equal(descripcionModulo(res, 'W-SM-PUSH'), '2 ENTREPAÑOS');
  assert.deepEqual(validarEntrepanosHdr({ ...calc, overrides: { n_entrepanos: 2 } }), []);
});

test('la validación compara piezas reales y conserva excepciones y entrepaños fijos', () => {
  const fijo = { ...calc, piezas: [{ ...calc.piezas[0], nombre: 'entrepano_fijo', formula_cantidad: '1' }] };
  assert.deepEqual(validarEntrepanosHdr(fijo), []);
  const res = { ...calcularMueble(fijo), trm: 4000, margen: 0 };
  res.vars.n_entrepanos = 3;
  assert.equal(descripcionModulo(res, 'UW'), '1 ENTREPAÑO');
  assert.equal(descripcionModulo({ ...res, piezas: [] }, 'SBFD'), '');
});

test('los avisos sobreviven a la consolidación y exigen revisión antes de exportar', () => {
  const base = { lineaId: 'a', codigoModulo: 'W', cocinaNombre: 'A', cantidad: 1, grupoId: null, avisosValidacion: [], ok: true as const, result: { ...calcularMueble(calc), trm: 4000, margen: 0 } };
  const modulos = consolidarModulosHdr([base, { ...base, lineaId: 'b', avisosValidacion: ['Revisar entrepaños'] }]);
  assert.equal(modulos.length, 1);
  assert.throws(() => exigirRevisionHdr(modulos, false), /Revisa los avisos/);
  assert.doesNotThrow(() => exigirRevisionHdr(modulos, true));
  assert.doesNotThrow(() => exigirRevisionHdr([base], false));
});

test('HDR usa el orden de la referencia independientemente del orden de plantilla', () => {
  const piezas = ['fondo', 'lateral', 'frente', 'entrepano', 'tapa', 'refuerzo_trasero', 'base'].map(pieza => ({ pieza }));
  const antes = structuredClone(piezas);
  assert.deepEqual(ordenarPiezasHdr(piezas, true).map(p => p.pieza), ['base', 'tapa', 'lateral', 'refuerzo_trasero', 'entrepano', 'frente', 'fondo']);
  assert.deepEqual(piezas, antes);
});

test('las gavetas conservan su secuencia original incluyendo sus frentes y fondos', () => {
  const nombres = ['lateral', 'base', 'refuerzo_trasero', 'lateral_gaveta_pequena', 'frente', 'trasero_gaveta_grande', 'contraparche_pequeno', 'fondo', 'fondo_gaveta'];
  const resultado = ordenarPiezasHdr(nombres.map((pieza, id) => ({ pieza, id })), false);
  assert.deepEqual(resultado.map(p => p.pieza), ['base', 'lateral', 'refuerzo_trasero', 'lateral_gaveta_pequena', 'frente', 'trasero_gaveta_grande', 'contraparche_pequeno', 'fondo_gaveta', 'fondo']);
  assert.deepEqual(resultado.filter(p => /gaveta|contraparche/.test(p.pieza) || p.pieza === 'frente').map(p => p.id), [3, 4, 5, 6, 8]);
});

test('B con puerta y cajón mantiene la gaveta como bloque y la puerta después', () => {
  const nombres = ['fondo', 'frente_gaveta', 'base_gaveta', 'lateral', 'frente', 'base', 'trasero_gaveta', 'entrepano'];
  assert.deepEqual(ordenarPiezasHdr(nombres.map(pieza => ({ pieza })), true).map(p => p.pieza), ['base', 'lateral', 'entrepano', 'frente_gaveta', 'base_gaveta', 'trasero_gaveta', 'frente', 'fondo']);
});

test('base/tapa combinada, refuerzos delanteros y golas respetan el orden estructural', () => {
  const nombres = ['fondo', 'gola_madera', 'refuerzo_trasero', 'lateral', 'base_tapa', 'refuerzo_delantero', 'entrepano_fijo'];
  assert.deepEqual(ordenarPiezasHdr(nombres.map(pieza => ({ pieza })), false).map(p => p.pieza), ['base_tapa', 'lateral', 'refuerzo_delantero', 'refuerzo_trasero', 'gola_madera', 'entrepano_fijo', 'fondo']);
});

test('las instrucciones de carcasa dependen del fondo, familia y espesor sin cambiar ninguna medida', () => {
  const nombres = ['base', 'tapa', 'lateral', 'base_gaveta', 'entrepano', 'refuerzo_trasero', 'fondo', 'fondo_gaveta', 'base_tapa_division'];
  const resultado = { ...calcularMueble({ ...calc, overrides: {}, piezas: nombres.map(nombre => ({ nombre, rol_tablero: nombre === 'fondo' ? 'fondo' : 'caja', formula_cantidad: nombre === 'lateral' ? '2' : '1', formula_largo: 'L', formula_ancho: 'P', cantos: { largos: 1, anchos: 2, calibre: '19x0,45' } })), preset: { caja: 'C', fondo: 'F6' }, tablerosByCode: { C: { codigo: 'C', espesor_mm: 15, precio_m2: 100 }, F6: { codigo: 'F6', espesor_mm: 6, precio_m2: 100 } }, cantosByCalibre: { '19X0,45': { calibre: '19x0,45', precio: 100 } } }), trm: 4000, margen: 0 };
  const antes = structuredClone(resultado);
  for (const [pref, espesor, codigo] of [['B', 15, 'R17L'], ['B-FE', 18, 'R20L'], ['W-SM-PUSH', 15, 'R16L'], ['TW', 18, 'R19L']] as const) {
    const tableros = [{ codigo: 'C', espesor_mm: espesor }, { codigo: 'F6', espesor_mm: 6 }];
    const base = construirFilas(resultado, tableros);
    const filas = construirFilas(resultado, tableros, pref);
    assert.deepEqual(filas.filter(f => / R\d+L$/.test(f.pieza)).map(f => f.pieza), [`BASE ${codigo}`, `TAPA ${codigo}`, `SIDE R ${codigo}`, `SIDE L ${codigo}`]);
    assert.deepEqual(filas.map(({ pieza: _pieza, ...datos }) => datos), base.map(({ pieza: _pieza, ...datos }) => datos));
    assert.deepEqual(filas.filter(f => !/ R\d+L$/.test(f.pieza)), base.filter(f => !['BASE', 'TAPA', 'SIDE R', 'SIDE L'].includes(f.pieza)));
    const sinFondo = { ...resultado, piezas: resultado.piezas.filter(p => p.pieza !== 'fondo') };
    assert.deepEqual(construirFilas(sinFondo, tableros, pref), construirFilas(sinFondo, tableros));
    assert.deepEqual(construirFilas({ ...resultado, piezas: resultado.piezas.map(p => p.pieza === 'fondo' ? { ...p, cant: 0 } : p) }, tableros, pref), construirFilas(sinFondo, tableros));
  }
  for (const pref of ['WCC', 'SVFD']) assert.deepEqual(construirFilas(resultado, [{ codigo: 'C', espesor_mm: 15 }], pref), construirFilas(resultado, [{ codigo: 'C', espesor_mm: 15 }]));
  assert.deepEqual(construirFilas(resultado, [{ codigo: 'C', espesor_mm: 16 }], 'B'), construirFilas(resultado, [{ codigo: 'C', espesor_mm: 16 }]));
  assert.deepEqual(resultado, antes);
});

test('FE renombra únicamente los cuatro nombres exactos de gaveta, también sin fondo', () => {
  const nombres = ['lateral_gaveta_pequena', 'lateral_gaveta_grande', 'contraparche_pequeno', 'contraparche_grande', 'lateral_gaveta_der', 'lateral_gaveta_izq', 'contraparche', 'base_gaveta', 'trasero_gaveta_grande', 'frente_gaveta'];
  const res = { ...calcularMueble({ ...calc, piezas: nombres.map(nombre => ({ ...calc.piezas[0], nombre, formula_cantidad: '1' })) }), trm: 4000, margen: 0 };
  const base = construirFilas(res, []);
  const esperados = ['LAT GAV PEQ R15L', 'LAT GAV GRANDE R15L', 'CONTRAPARCHE PEQ R15L', 'CONTRAPARCHE GRANDE R15L'];
  for (const pref of ['DB-FE', 'DB-2-1INT-SM-FE', 'DB-SM-FE-SF', 'B-FE', 'BMW-1-FE']) {
    const filas = construirFilas(res, [], pref);
    assert.deepEqual(filas.slice(0, 4).map(f => f.pieza), esperados);
    assert.deepEqual(filas.slice(4), base.slice(4));
    assert.deepEqual(filas.map(({ pieza: _pieza, ...datos }) => datos), base.map(({ pieza: _pieza, ...datos }) => datos));
  }
  for (const pref of ['DB', 'DB-SMG', 'B', 'FEST']) assert.deepEqual(construirFilas(res, [], pref), base);
});
