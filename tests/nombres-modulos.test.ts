import assert from 'node:assert/strict';
import test from 'node:test';
import { codigoComercial } from '../src/lib/module-groups';
import { nombrePanel, etiquetaTipoModulo, descripcionConNotas, normalizarNombresLineas } from '../src/lib/nombres-modulos';
import { getModuloValues, moduloFromValues } from '../src/store/simuladorStore';
import { especificacionesProyecto } from '../src/lib/materiales-proyecto';

test('PN identifica exclusivamente el frente de 15 mm y conserva largo/alto sin profundidad', () => {
  for (const caja of [15, 18]) for (const frente of [15, 18]) {
    assert.equal(codigoComercial({ pref: 'PN', largo: 600, alto: 2300, prof: 18, unidad: 'mm', sistema: 'metrico', espesorCajaMm: caja, espesorFrenteMm: frente }), `PN60230${frente === 15 ? '-15MM' : ''}`);
  }
  assert.equal(codigoComercial({ pref: 'PN', largo: 60, alto: 230, prof: 1.5, unidad: 'cm', sistema: 'metrico', espesorFrenteMm: 15, sistemaFrente: 'gola', dbTipo: 'DB-2S', conFondo: false }), 'PN60230-15MM');
});

test('completa medidas no estándar de otras familias sin cambiar W, torres ni piezas planas', () => {
  const base = { unidad: 'cm' as const, sistema: 'metrico' as const, largo: 65 };
  for (const pref of ['DB-2S-SMG', 'SBFD', 'SDB', 'POD', 'DD']) assert.equal(codigoComercial({ ...base, pref, alto: 78.5, prof: 61 }), `${pref.split('-')[0]}6578.561${pref.includes('-') ? '-'+pref.split('-').slice(1).join('-') : ''}`);
  assert.equal(codigoComercial({ ...base, pref: 'UDB', alto: 73.025, prof: 60.96 }), 'UDB65');
  assert.equal(codigoComercial({ ...base, pref: 'UDB', alto: 78, prof: 61 }), 'UDB657861');
  assert.equal(codigoComercial({ ...base, pref: 'PN', alto: 230, prof: 18 }), 'PN65230');
  assert.equal(codigoComercial({ ...base, pref: 'F', alto: 230, prof: 18 }), 'F65230');
  assert.equal(codigoComercial({ pref: 'W', largo: 29, alto: 36, prof: 12, unidad: 'in', sistema: 'imperial' }), 'W293612');
});

test('Panel usa la nota una sola vez y no modifica su texto original', () => {
  assert.equal(nombrePanel(), 'PN - Panel');
  assert.equal(nombrePanel(' lateral '), 'PN - Panel lateral');
  assert.equal(nombrePanel('Panel lateral'), 'PN - Panel lateral');
  assert.equal(etiquetaTipoModulo('PN', 'Panel (Panel)'), 'PN - Panel');
  assert.equal(descripcionConNotas({ pref: 'PN', descripcion_es: 'PANEL 600x2300x18 mm', anotaciones: 'lateral' }), 'PN - Panel lateral');
});

test('el simulador conserva las notas del panel al editar, copiar y reconstruir su estado', () => {
  const panel = moduloFromValues({ anotaciones: 'lateral', largo: '60', alto: '230' }, 'pn');
  assert.equal(panel.anotaciones, 'lateral');
  assert.equal(getModuloValues(panel).anotaciones, 'lateral');
  assert.equal(moduloFromValues(panel, 'copia').anotaciones, 'lateral');
});

test('el PDF distingue el panel individual de 15 mm de los frentes globales de 18 mm', () => {
  const catalogo = [{ codigo: 'F18', espesor_mm: 18, proveedor: null, sustrato: null, color_nombre: 'Blanco' }, { codigo: 'F15', espesor_mm: 15, proveedor: null, sustrato: null, color_nombre: 'Blanco' }];
  const bloques = especificacionesProyecto({ materialesInferiores: { preset: { frente: 'F18' } } }, catalogo, [{ nombre: 'Cocina', lineas: [{ pref: 'PN', codigo_modulo: 'PN60230-15MM', config: { preset: { frente: 'F15' }, personalizacionMateriales: { preset: { frente: 'F15' }, cantoFrentes: '19x1' } } }] }]);
  assert.ok(bloques[0].filas.some(f => f[1].includes('F18')));
  const individual = bloques.find(b => b.titulo.includes('PN60230-15MM'));
  assert.ok(individual);
  assert.ok(individual.filas.some(f => f[1].includes('F15') && f[1].includes('15 mm')));
  assert.ok(individual.filas.some(f => f[1] === '19x1'));
});

test('reconstruye códigos históricos y descripciones sin alterar cantidades, precios o selecciones', () => {
  const lineas = [{ id: 'db', tipo_mueble_id: 't', pref: 'DB-2S-SMG', largo: 65, alto: 78.5, prof: 61, unidad_dim: 'cm' as const, codigo_modulo: 'DB65-2S-SMG', config: { preset: { caja: 'C15', frente: 'F18' } }, cantidad: 2, precio_total_cop: 1234, anotaciones: null, descripcion_es: 'DB' }];
  const copia = structuredClone(lineas);
  const nuevas = normalizarNombresLineas(lineas, [{ id: 't', pref: 'DB-2S-SMG' }], [{ codigo: 'C15', espesor_mm: 15 }, { codigo: 'F18', espesor_mm: 18 }], 'metrico');
  assert.equal(nuevas[0].codigo_modulo, 'DB6578.561-2S-SMG');
  assert.equal(nuevas[0].precio_total_cop, 1234); assert.equal(nuevas[0].cantidad, 2);
  assert.deepEqual(nuevas[0].config, lineas[0].config); assert.deepEqual(lineas, copia);
});
