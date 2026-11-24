import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularInstalacion, calcularSupervisionEntrega, unidadesSupervisionEntrega, cantidadesInstalacion, conceptosInstalacion, normalizarInstalacion, normalizarTarifasInstalacion } from '../src/lib/instalacion-cotizacion';

test('instalación cuenta módulos, repetición, manijas reales y el límite de 70 pulgadas', () => {
  const totales = cantidadesInstalacion([{ nombre: 'Cocina', cantidad: 3, lineas: [
    { id: '1', pref: 'B-FE', cantidad: 2, breakdown: { herrajes: [{ rol: 'manija', cant: 2, codigo: 'M' }, { rol: 'bisagra', cant: 2, codigo: 'H' }, { rol: 'manija', cant: 10, codigo: null }] } },
    { id: '2', pref: 'OVPC', cantidad: 1 },
    { id: '3', codigo_modulo: 'TK360', cantidad: 2 },
    { id: '4', pref: 'F', cantidad: 1 },
    { id: '5', pref: 'PN', largo: 500, alto: 1778, unidad_dim: 'mm', cantidad: 1 },
    { id: '6', pref: 'PN', largo: 177.79, alto: 20, unidad_dim: 'cm', cantidad: 2 },
    { id: '8', codigo_modulo: 'MESON', cantidad: 3, config: { clasificacionPdf: 'mesones' } },
    { id: '7', pref: 'B', cantidad: 20, config: { clasificacionPdf: 'herrajes_otros' } },
  ] }], []);
  assert.deepEqual(totales, { muebles: 6, alacena: 3, armado: 9, manijas: 12, fillersTk: 9, panelMayor: 3, panelMenor: 6 });
});

test('instalación muestra solo la zona y grupos elegidos, con tarifas independientes y TRM de la cotización', () => {
  const tarifas = normalizarTarifasInstalacion({
    miami: { muebles: { costo: 999, precio: 999, margen: 20 } },
    texas: { muebles: { costo: 10, precio: 15, margen: 30 }, mesonCocina: { costo: 20, precio: 30, margen: 33 }, perforacionBano: { costo: 5, precio: 6, margen: 10 } },
  });
  const config = normalizarInstalacion({ activa: true, zona: 'texas', muebles: true, mesones: true, cantidades: { mesonCocina: 2.5 } });
  const cantidades = { ...cantidadesInstalacion([], []), muebles: 3 };
  const tablas = calcularInstalacion(config, tarifas, cantidades, 'COP', 4000);
  const primera = tablas[0].filas.find(f => f.clave === 'muebles');
  assert.deepEqual(primera, { clave: 'muebles', etiqueta: 'Muebles', costo: 120000, precio: 120000 / 0.7, margen: 30 });
  assert.ok(tablas[0].filas.some(f => f.clave === 'estadia'));
  assert.ok(!conceptosInstalacion('miami', 'muebles').some(([clave]) => clave === 'estadia'));
  assert.deepEqual(tablas[1].filas[0], { clave: 'mesonCocina', etiqueta: 'Mesón cocina (m²)', costo: 200000, precio: 20 / (1 - 0.33) * 2.5 * 4000, margen: 33 });
  assert.equal(tablas[1].filas.find(f => f.clave === 'perforacionBano')?.precio, null);
  assert.deepEqual(calcularInstalacion({ ...config, muebles: false }, tarifas, cantidades, 'USD', 9999).map(t => [t.grupo, t.filas[0].precio]), [['mesones', 20 / (1 - 0.33) * 2.5]]);
  assert.deepEqual(calcularInstalacion({ ...config, activa: false }, tarifas, cantidades, 'USD', 4000), []);
});

test('supervisión y entrega en Miami aplican los márgenes al costo para 80 unidades', () => {
  const unidades = unidadesSupervisionEntrega([
    { nombre: 'Tipo A', cantidad: 60, lineas: [{ id: '1', cantidad: 9 }, { id: '2', cantidad: 12 }] },
    { nombre: 'Tipo B', cantidad: 20, lineas: [{ id: '3', cantidad: 5 }] },
    { nombre: 'Adicionales', cantidad: 20, lineas: [{ id: '4', cantidad: 1, config: { clasificacionPdf: 'herrajes_otros' } }] },
  ]);
  assert.equal(unidades, 80);
  const [supervision, entrega] = calcularSupervisionEntrega(unidades, { moneda: 'USD', costoTrailer: 580, supervision: { costoUnit: 20, margen: 20 }, trailer: { margen: 30 } });
  assert.equal(supervision.valores.costo, 1600);
  assert.equal(supervision.valores.precio, 2000);
  assert.equal(entrega.valores.costoUnit, 29);
  assert.equal(entrega.valores.costo, 2320);
  assert.ok(Math.abs(entrega.valores.precio! - 3314.285714285714) < 1e-8);
});

test('supervisión parte solo de las cantidades y conserva los valores editados y el cero', () => {
  const [inicial] = calcularSupervisionEntrega(80, { moneda: 'USD' });
  assert.equal(inicial.valores.unidades, 80);
  assert.equal(inicial.valores.costo, undefined);
  assert.equal(inicial.valores.margen, undefined);
  const config = normalizarInstalacion({ supervisionEntrega: {
    moneda: 'USD', costoTrailer: 600,
    supervision: { unidades: 0, costoUnit: 20, margen: 20 },
    trailer: { unidades: 50, precio: 2000 },
  } });
  const [supervision, entrega] = calcularSupervisionEntrega(100, config.supervisionEntrega!);
  assert.equal(supervision.valores.unidades, 0);
  assert.equal(supervision.valores.precio, 0);
  assert.equal(entrega.valores.unidades, 20);
  assert.equal(entrega.valores.costo, 0);
  assert.equal(entrega.valores.precio, 2000);
});

test('el costo y margen recalculan ambos precios aunque hubiera precios manuales guardados', () => {
  const [supervision, entrega] = calcularSupervisionEntrega(80, {
    moneda: 'USD', costoTrailer: 580,
    supervision: { unidades: 60, costo: 1200, margen: 20, precioUnit: 30, precio: 1800 },
    trailer: { margen: 30, precio: 1000 },
  });
  assert.equal(supervision.precioAutomatico, true);
  assert.equal(supervision.valores.precioUnit, 25);
  assert.equal(supervision.valores.precio, 1500);
  assert.equal(entrega.precioAutomatico, true);
  assert.equal(entrega.valores.precio, 60 * (29 / 0.7));
});

test('PB Shore prorratea el costo por tráiler según su capacidad y la cantidad de supervisión', () => {
  const config = normalizarInstalacion({ supervisionEntrega: {
    moneda: 'USD', costoTrailer: 600, capacidadTrailer: 24,
    supervision: { unidades: 50 },
    trailer: { unidades: 10, costoUnit: 100, costo: 9999, margen: 20 },
  } });
  const [, entrega] = calcularSupervisionEntrega(80, config.supervisionEntrega!);
  assert.equal(entrega.valores.unidades, 24);
  assert.equal(entrega.valores.costoUnit, 25);
  assert.equal(entrega.valores.costo, 1250);
  assert.equal(entrega.valores.precio, 1562.5);
});
