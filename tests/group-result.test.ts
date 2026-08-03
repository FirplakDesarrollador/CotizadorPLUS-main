import test from 'node:test';
import assert from 'node:assert/strict';
import { consolidarGrupo } from '@/lib/group-result';
import type { Breakdown } from '@/lib/engine';

function breakdown(patch: Partial<Breakdown> = {}): Breakdown {
  return {
    vars: {},
    piezas: [],
    maderaPorRol: [],
    cantoPorCalibre: [],
    consumibles: {},
    herrajes: [],
    costoMadera: 0,
    costoCanto: 0,
    costoConsumibles: 0,
    costoSinHerrajes: 0,
    costoHerrajes: 0,
    costoConHerrajes: 0,
    precioCop: 0,
    precioUsd: 0,
    precioHerrajesCop: 0,
    precioHerrajesUsd: 0,
    precioConHerrajesCop: 0,
    precioConHerrajesUsd: 0,
    margenHerraje: 0.35,
    ...patch,
  };
}

test('consolida las asignaciones internas en un único resultado físico y comercial', () => {
  const first = breakdown({
    piezas: [
      { pieza: 'base', rol: 'caja', cant: 0.3, largoIn: 40, anchoIn: 23, areaCm2: 1000 },
      { pieza: 'entrepaño', rol: 'caja', cant: 1, largoIn: 12, anchoIn: 22, areaCm2: 500 },
    ],
    maderaPorRol: [{ rol: 'caja', codigo: 'M15', cm2: 1500, costo: 15000 }],
    cantoPorCalibre: [{ calibre: '22x1', longCm: 100, precio: 20, costo: 2000 }],
    consumibles: { tarugos: 500 },
    herrajes: [{ rol: 'bisagra', codigo: 'B1', cant: 2, precio: 1000, costo: 2000 }],
    costoMadera: 15000,
    costoCanto: 2000,
    costoConsumibles: 500,
    costoSinHerrajes: 17500,
    costoHerrajes: 2000,
    costoConHerrajes: 19500,
    precioCop: 40000,
    precioHerrajesCop: 3000,
    precioConHerrajesCop: 43000,
  });
  const second = breakdown({
    piezas: [
      { pieza: 'base', rol: 'caja', cant: 0.7, largoIn: 40, anchoIn: 23, areaCm2: 2000 },
      { pieza: 'entrepaño', rol: 'caja', cant: 1, largoIn: 28, anchoIn: 22, areaCm2: 900 },
    ],
    maderaPorRol: [{ rol: 'caja', codigo: 'M15', cm2: 2900, costo: 29000 }],
    cantoPorCalibre: [{ calibre: '22x1', longCm: 180, precio: 20, costo: 3600 }],
    consumibles: { tarugos: 700, soportes: 100 },
    costoMadera: 29000,
    costoCanto: 3600,
    costoConsumibles: 800,
    costoSinHerrajes: 33400,
    costoConHerrajes: 33400,
    precioCop: 70000,
    precioConHerrajesCop: 70000,
  });

  const result = consolidarGrupo({
    lineas: [first, second],
    largoTotalIn: 40,
    laterales: 3,
    uniones: 1,
    piezasContinuas: ['base'],
  }, { trm: 4000, margen: 0.57 });

  assert.equal(result.modulos, 2);
  assert.equal(result.largoTotalIn, 40);
  assert.equal(result.piezas.find((row) => row.pieza === 'base')?.cant, 1);
  assert.equal(result.piezas.filter((row) => row.pieza === 'entrepaño').length, 2);
  assert.deepEqual(result.maderaPorRol, [{ rol: 'caja', codigo: 'M15', cm2: 4400, costo: 44000 }]);
  assert.deepEqual(result.consumibles, { tarugos: 1200, soportes: 100 });
  assert.equal(result.precioCop, 110000);
  assert.equal(result.precioHerrajesCop, 3000);
  assert.equal(result.precioConHerrajesCop, 113000);
  assert.equal(result.herrajes[0].cant, 2);
});

test('limpia residuos binarios al sumar participaciones de una pieza continua', () => {
  const row = (cant: number) => breakdown({
    piezas: [{ pieza: 'fondo', rol: 'fondo', cant, largoIn: 60, anchoIn: 30, areaCm2: cant * 1000 }],
  });
  const result = consolidarGrupo({
    lineas: [row(1 / 3), row(1 / 3), row(1 - 2 / 3)],
    largoTotalIn: 60,
    laterales: 4,
    uniones: 2,
    piezasContinuas: ['fondo'],
  }, { trm: 4200, margen: 0.57 });

  assert.equal(result.piezas[0].cant, 1);
  assert.equal(result.piezas[0].areaCm2, 1000);
});
