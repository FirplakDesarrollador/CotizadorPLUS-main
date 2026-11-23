import assert from 'node:assert/strict';
import test from 'node:test';
import { buscarReparto, type EntradaReparto, type LineaReparto } from '../src/lib/corte/reparto';

// Presupuesto de tiempo del reparto. Con el acomodo por mochila evaluar un día
// cuesta decenas de milisegundos; la búsqueda revisaba el reloj cada 256
// movimientos y se pasaba varias veces del presupuesto (17 s con 5 s pedidos).

const linea = (lineaId: string, unidades: number, piezasPorUnidad: number): LineaReparto =>
  ({ lineaId, unidades, piezasPorUnidad, grupoId: null });

const LINEAS = [linea('A', 6, 7), linea('B', 4, 9), linea('C', 4, 8), linea('D', 3, 11), linea('E', 4, 6)];

/** Evaluador lento a propósito: cada día tarda `ms` en "acomodarse". */
function lento(ms: number): EntradaReparto['evaluarDia'] {
  return (u: Int32Array) => {
    const fin = Date.now() + ms;
    while (Date.now() < fin) { /* espera activa */ }
    let piezas = 0;
    for (let i = 0; i < u.length; i++) piezas += u[i] * LINEAS[i].piezasPorUnidad;
    const laminas = Math.ceil((piezas * 0.37) / 4 - 1e-9);
    return { laminas, areaPiezasM2: piezas * 0.37, areaLaminasM2: laminas * 4 };
  };
}

test('con días lentos de evaluar, la búsqueda no se pasa del presupuesto', () => {
  const presupuesto = 300;
  const t0 = Date.now();
  const r = buscarReparto({ lineas: LINEAS, piezasPorDia: 40, evaluarDia: lento(5) }, { tiempoMaxMs: presupuesto, semilla: 3 });
  const transcurrido = Date.now() - t0;
  // Margen: el reparto inicial y un último movimiento (dos días a 5 ms) pueden caer después del corte.
  assert.ok(transcurrido < presupuesto + 250, `tardó ${transcurrido} ms con ${presupuesto} ms de presupuesto`);
  assert.ok(r.iteraciones > 0, 'sí alcanzó a buscar');
});

test('sin presupuesto devuelve el reparto inicial sin buscar', () => {
  const r = buscarReparto({ lineas: LINEAS, piezasPorDia: 40, evaluarDia: lento(0) }, { tiempoMaxMs: 0, iteracionesMax: 0 });
  assert.equal(r.iteraciones, 0);
});
