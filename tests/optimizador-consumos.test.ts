import assert from 'node:assert/strict';
import test from 'node:test';
import { m2Estimados, resumirConsumosProyecto } from '../src/app/optimizador/consumos';
import type { ModuloHDR } from '../src/app/hdr/actions';

test('suma materiales de toda la cotización con repeticiones y agrupa herrajes por referencia', () => {
  const modulo: ModuloHDR = {
    lineaId: 'm', codigoModulo: 'B30', cocinaNombre: 'Cocina', grupoId: null,
    cantidad: 2, repeticionesArea: 3, ok: true,
    result: {
      maderaPorRol: [
        { rol: 'caja', codigo: 'T', cm2: 10000, m2: 1.15, costo: 0 },
        { rol: 'refuerzo', codigo: 'T', cm2: 5000, m2: 0.575, costo: 0 },
      ],
      cantoPorCalibre: [{ calibre: '19x0,45', metros: 2, longCm: 200, precio: 0, costo: 0 }],
      herrajes: [
        { rol: 'manija', codigo: 'MAN', cant: 2, precio: 0, costo: 0 },
        { rol: 'manija', codigo: null, cant: 1, precio: 0, costo: 0 },
      ],
    } as Extract<ModuloHDR, { ok: true }>['result'],
  };
  const resumen = resumirConsumosProyecto([modulo, { ...modulo, lineaId: 'error', ok: false, error: 'Sin despiece' }], [
    { tipo: 'tablero', codigo: 'T', cantidad: 3 },
    { tipo: 'canto', codigo: '19X0.45', cantidad: 5 },
    { tipo: 'herraje', codigo: 'MAN', cantidad: 4 },
    { tipo: 'herraje', codigo: 'BIS', cantidad: 1 },
  ]);
  assert.deepEqual(resumen, {
    tableros: [{ codigo: 'T', m2Neto: 9, m2Suelto: 3 }],
    cantos: [{ codigo: '19x0,45', cantidad: 17 }],
    herrajes: [{ codigo: 'BIS', cantidad: 1 }, { codigo: 'MAN', cantidad: 16 }],
  });
  assert.equal(m2Estimados(resumen.tableros[0], 0), 12);
  assert.equal(m2Estimados(resumen.tableros[0], 50), 16.5);
});
