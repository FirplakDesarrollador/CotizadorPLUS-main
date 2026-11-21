import assert from 'node:assert/strict';
import test from 'node:test';
import { areasParaEntrega, cantidadesDeParciales, normalizarEntrega, resumirEntrega, type AreaEntrega } from '../src/lib/entrega-cotizacion';

const tablero = { codigo: 'T', espesor_mm: 15 };
const madera = { maderaPorRol: [{ rol: 'caja', codigo: 'T', cm2: 10000 }] };

test('reparte unidades absolutas del mismo módulo entre entregas sin exceder el total', () => {
  const areas: AreaEntrega[] = [
    { id: 'a', nombre: 'Cocina', cantidad: 4, lineas: [{ id: 'x', cantidad: 3, breakdown: madera }] },
    { id: 'b', nombre: 'Baño', cantidad: 2, lineas: [{ id: 'y', cantidad: 1, breakdown: madera }] },
  ];
  const config = normalizarEntrega({ modo: 'parcial', parciales: [
    { contenedor: '20T', cantidades: { x: 5, y: -10 } },
    { contenedor: '40T', cantidades: { x: 20, y: 2, eliminada: 500 } },
    { contenedor: '20T', areas: ['a', 'b'] },
  ] });
  const resultado = resumirEntrega(config, areas, [tablero]);
  assert.deepEqual(resultado.map(parcial => parcial.unidades), [5, 9, 0]);
  assert.equal(resultado[0].pesoKg + resultado[1].pesoKg, resumirEntrega(normalizarEntrega({ modo: 'total' }), areas, [tablero])[0].pesoKg);
  assert.deepEqual(normalizarEntrega(config), config);
});

test('un módulo sin área también se puede repartir con un conteo propio y los adicionales quedan fuera', () => {
  const areas = areasParaEntrega([], [
    { id: 'mueble', cantidad: 5, breakdown: madera },
    { id: 'adicional', cantidad: 99, config: { clasificacionPdf: 'herrajes_otros' } },
  ]);
  const config = normalizarEntrega({ modo: 'parcial', parciales: [
    { cantidades: { mueble: 2, adicional: 99 } },
    { modulos: ['mueble'] },
  ] });
  assert.deepEqual(cantidadesDeParciales(config.parciales, areas).map(cantidades => [...cantidades]), [[['mueble', 2]], [['mueble', 3]]]);
  assert.deepEqual(resumirEntrega(config, areas, [tablero]).map(lote => lote.porcentaje), [40, 60]);
});
