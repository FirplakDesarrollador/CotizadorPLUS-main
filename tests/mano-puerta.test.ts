import assert from 'node:assert/strict';
import test from 'node:test';
import { codigoConMano, puertasSegunReglas, requiereManoPuerta, validarManoPuerta } from '../src/lib/mano-puerta';
import { codigoComercial } from '../src/lib/module-groups';
import { calcularMueble, type Regla } from '../src/lib/engine';
import { exigirRevisionHdr } from '../src/app/hdr/validacion';
import { getModuloValues, moduloFromValues } from '../src/store/simuladorStore';
import { normalizarNombresLineas } from '../src/lib/nombres-modulos';

const reglas: Regla[] = [
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'L <= 21', valor: '1', prioridad: 10 },
  { tipo_mueble_id: null, variable: 'n_puertas', condicion: 'true', valor: '2', prioridad: 20 },
];

test('solo W-SM, WLD y WSM de una puerta exigen una elección explícita L/R', () => {
  for (const pref of ['W-SM', 'WLD', 'WSM']) {
    assert.equal(requiereManoPuerta(pref, 1), true);
    for (const puertas of [0, 2, 3, undefined]) assert.equal(requiereManoPuerta(pref, puertas), false);
    for (const mano of [undefined, '', 'X', 'r']) assert.throws(() => validarManoPuerta(pref, 1, mano), /Selecciona L o R/);
    for (const mano of ['L', 'R']) assert.doesNotThrow(() => validarManoPuerta(pref, 1, mano));
  }
  for (const pref of ['W', 'W-SM-PUSH', 'W-SM-LOC', 'B', 'WBL-D-L/R-SM']) {
    assert.equal(requiereManoPuerta(pref, 1), false);
    assert.doesNotThrow(() => validarManoPuerta(pref, 1, undefined));
  }
});

test('la regla de una puerta usa pulgadas, cm o mm y respeta el override de una o dos', () => {
  for (const [unidad, factor] of [['in', 1], ['cm', 2.54], ['mm', 25.4]] as const) {
    // Misma precisión de entrada que los formularios al convertir unidades.
    const dims = (ancho: number) => ({ largo: Number((ancho * factor).toFixed(6)), alto: Number((30 * factor).toFixed(6)), prof: Number((14 * factor).toFixed(6)), unidad });
    assert.equal(puertasSegunReglas(reglas, dims(23.9)), 1);
    assert.equal(puertasSegunReglas(reglas, dims(24)), 2);
    assert.equal(puertasSegunReglas(reglas, dims(36), 1), 1);
    assert.equal(puertasSegunReglas(reglas, dims(18), 2), 2);
  }
  const especifica = [{ ...reglas[0], condicion: 'L < 12', valor: '0', prioridad: 1 }, ...reglas];
  assert.equal(puertasSegunReglas(especifica, { largo: 10, alto: 30, prof: 14, unidad: 'in' }), 0);
});

test('el sufijo queda al final tras medidas, sistema y material y no aparece en otros casos', () => {
  for (const pref of ['W-SM', 'WLD', 'WSM']) {
    const input = { pref, largo: 18, alto: 30, prof: 14, unidad: 'in' as const, sistema: 'imperial' as const, sistemaFrente: 'gola', espesorCajaMm: 18, espesorFrenteMm: 18 };
    const base = codigoComercial(input);
    assert.equal(codigoComercial({ ...input, nPuertas: 1, manoPuerta: 'L' }), `${base}-L`);
    assert.equal(codigoComercial({ ...input, nPuertas: 1, manoPuerta: 'R' }), `${base}-R`);
    assert.equal(codigoComercial({ ...input, nPuertas: 2, manoPuerta: 'R' }), base);
    assert.equal(codigoComercial({ ...input, nPuertas: 1 }), base);
  }
  assert.equal(codigoConMano('W183014-SM-L', 'W-SM', 1, 'R'), 'W183014-SM-R');
  assert.equal(codigoConMano('B18', 'B', 1, 'R'), 'B18');
});

test('L/R sobrevive a guardar y restaurar módulos; los datos antiguos quedan vacíos', () => {
  assert.equal(getModuloValues({ doorHand: 'R' }).manoPuerta, '');
  assert.equal(moduloFromValues({ manoPuerta: 'L', largo: '18' }, 'a').manoPuerta, 'L');
  assert.equal(getModuloValues(moduloFromValues({ manoPuerta: 'R' }, 'b')).manoPuerta, 'R');
});

test('al reabrir cotizaciones y PDF conserva el sufijo con puertas automáticas o manuales sin cambiar precios', () => {
  const base = { tipo_mueble_id: 'w', pref: 'W-SM', codigo_modulo: '', largo: 18, alto: 30, prof: 14, unidad_dim: 'in' as const, precio_total_cop: 234567, cantidad: 4, breakdown: { vars: { n_puertas: 1 } }, config: { manoPuerta: 'L' } };
  const tipos = [{ id: 'w', pref: 'W-SM' }];
  for (const config of [{ manoPuerta: 'L' }, { manoPuerta: 'L', overrides: { n_puertas: 1 } }]) {
    const entrada = { ...base, config };
    const out = normalizarNombresLineas([entrada], tipos, [], 'imperial')[0];
    assert.equal(out.codigo_modulo, 'W183014-SM-L');
    assert.equal(out.precio_total_cop, entrada.precio_total_cop);
    assert.equal(out.cantidad, entrada.cantidad);
    assert.deepEqual(out.config, config);
  }
  const dos = normalizarNombresLineas([{ ...base, config: { manoPuerta: 'L', overrides: { n_puertas: 2 } } }], tipos, [], 'imperial')[0];
  assert.equal(dos.codigo_modulo, 'W183014-SM');
});

test('una apertura pendiente impide exportar HDR incluso si se confirma la revisión de cantidades', () => {
  assert.throws(() => exigirRevisionHdr([{ aperturaPendiente: true }], false), /Completa la apertura/);
  assert.throws(() => exigirRevisionHdr([{ aperturaPendiente: true }], true), /Completa la apertura/);
  assert.doesNotThrow(() => exigirRevisionHdr([{ aperturaPendiente: false }], false));
});

test('la apertura no participa en el cálculo de medidas, cantidades, materiales ni costos', () => {
  const input = { dims: { L: 18, A: 30, P: 14 }, piezas: [{ nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A' }], reglas: [], preset: { frente: 'F18' }, tablerosByCode: { F18: { codigo: 'F18', espesor_mm: 18, precio_m2: 100 } }, herrajesPlantilla: [], herrajesByCode: {}, cantosByCalibre: {}, consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, trm: 4000, desperdicio: 0 };
  const base = calcularMueble(input);
  for (const manoPuerta of ['L', 'R']) assert.deepEqual(calcularMueble({ ...input, ...{ manoPuerta } }), base);
});
