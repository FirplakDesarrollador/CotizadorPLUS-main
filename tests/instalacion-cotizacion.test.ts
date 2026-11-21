import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularInstalacion, cantidadesInstalacion, conceptosInstalacion, normalizarInstalacion, normalizarTarifasInstalacion } from '../src/lib/instalacion-cotizacion';

test('instalación cuenta módulos, repetición, manijas reales y el límite de 70 pulgadas', () => {
  const totales = cantidadesInstalacion([{ nombre: 'Cocina', cantidad: 3, lineas: [
    { id: '1', pref: 'B-FE', cantidad: 2, breakdown: { herrajes: [{ rol: 'manija', cant: 2, codigo: 'M' }, { rol: 'bisagra', cant: 2, codigo: 'H' }, { rol: 'manija', cant: 10, codigo: null }] } },
    { id: '2', pref: 'OVPC', cantidad: 1 },
    { id: '3', codigo_modulo: 'TK360', cantidad: 2 },
    { id: '4', pref: 'F', cantidad: 1 },
    { id: '5', pref: 'PN', largo: 500, alto: 1778, unidad_dim: 'mm', cantidad: 1 },
    { id: '6', pref: 'PN', largo: 177.79, alto: 20, unidad_dim: 'cm', cantidad: 2 },
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
  assert.deepEqual(primera, { clave: 'muebles', etiqueta: 'Muebles', costo: 120000, precio: 180000, margen: 30 });
  assert.ok(tablas[0].filas.some(f => f.clave === 'estadia'));
  assert.ok(!conceptosInstalacion('miami', 'muebles').some(([clave]) => clave === 'estadia'));
  assert.deepEqual(tablas[1].filas[0], { clave: 'mesonCocina', etiqueta: 'Mesón cocina (m²)', costo: 200000, precio: 300000, margen: 33 });
  assert.equal(tablas[1].filas.find(f => f.clave === 'perforacionBano')?.precio, null);
  assert.deepEqual(calcularInstalacion({ ...config, muebles: false }, tarifas, cantidades, 'USD', 9999).map(t => [t.grupo, t.filas[0].precio]), [['mesones', 75]]);
  assert.deepEqual(calcularInstalacion({ ...config, activa: false }, tarifas, cantidades, 'USD', 4000), []);
});
