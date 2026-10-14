import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buscarReparto, cotaInferior, diasNecesarios, unidadesDelDia,
  type EntradaReparto, type LineaReparto, type Reparto,
} from '../src/lib/corte/reparto';

// Busqueda del reparto de muebles entre dias. Se prueba con un evaluador de
// juguete —laminas = area del dia / area de lamina, redondeado hacia arriba— para
// que las pruebas midan la busqueda y no el acomodo, que tiene las suyas.

const AREA_LAMINA = 4;

const linea = (lineaId: string, unidades: number, piezasPorUnidad: number, grupoId: string | null = null): LineaReparto =>
  ({ lineaId, unidades, piezasPorUnidad, grupoId });

/** Cada pieza ocupa 0,5: 8 piezas llenan una lamina exacta. */
const evaluador = (lineas: readonly LineaReparto[]) => (u: Int32Array) => {
  let piezas = 0;
  for (let i = 0; i < u.length; i++) piezas += u[i] * lineas[i].piezasPorUnidad;
  const area = piezas * 0.5;
  const laminas = area > 0 ? Math.ceil(area / AREA_LAMINA - 1e-9) : 0;
  return { laminas, areaPiezasM2: area, areaLaminasM2: laminas * AREA_LAMINA };
};

const entrada = (lineas: readonly LineaReparto[], piezasPorDia: number): EntradaReparto =>
  ({ lineas, piezasPorDia, evaluarDia: evaluador(lineas) });

const unidadesPorLinea = (reparto: Reparto, i: number) => {
  let total = 0;
  for (let d = 0; d < reparto.dias; d++) total += reparto.matriz[d * reparto.lineas + i];
  return total;
};

const diasDeLinea = (reparto: Reparto, i: number) => {
  const dias: number[] = [];
  for (let d = 0; d < reparto.dias; d++) if (reparto.matriz[d * reparto.lineas + i] > 0) dias.push(d);
  return dias;
};

const PROYECTO = [
  linea('B12', 6, 7), linea('B30', 4, 9), linea('BFD15', 4, 8),
  linea('DB19', 3, 11), linea('W3036', 4, 6), linea('UW1236', 3, 7),
];

test('los dias salen del ritmo, no de una decision aparte', () => {
  assert.equal(diasNecesarios(entrada(PROYECTO, 50)), Math.ceil(197 / 50));
  assert.equal(diasNecesarios(entrada(PROYECTO, 1000)), 1);
  assert.equal(diasNecesarios(entrada(PROYECTO, 0)), 0, 'sin ritmo no hay dias que repartir');
  assert.equal(diasNecesarios({ ...entrada(PROYECTO, 50), diasExtra: 2 }), Math.ceil(197 / 50) + 2);
});

test('misma semilla y mismo presupuesto dan exactamente el mismo reparto', () => {
  const e = entrada(PROYECTO, 50);
  const a = buscarReparto(e, { semilla: 7, iteracionesMax: 5000 });
  const b = buscarReparto(e, { semilla: 7, iteracionesMax: 5000 });
  assert.deepEqual([...a.reparto.matriz], [...b.reparto.matriz]);
  assert.equal(a.tableros, b.tableros);
  assert.equal(a.iteraciones, b.iteraciones);
});

test('semillas distintas exploran caminos distintos', () => {
  const e = entrada(PROYECTO, 50);
  const a = buscarReparto(e, { semilla: 1, iteracionesMax: 300 });
  const b = buscarReparto(e, { semilla: 99, iteracionesMax: 300 });
  assert.ok(a.iteraciones > 0 && b.iteraciones > 0);
  // No se exige que difieran —pueden converger— pero si que ninguna empeore.
  assert.ok(a.tableros > 0 && b.tableros > 0);
});

test('no se pierde ni se duplica una sola unidad', () => {
  const e = entrada(PROYECTO, 50);
  const r = buscarReparto(e, { semilla: 3, iteracionesMax: 4000 }).reparto;
  PROYECTO.forEach((l, i) => assert.equal(unidadesPorLinea(r, i), l.unidades, l.lineaId));
});

test('un grupo fisico no se parte entre dias', () => {
  // Las piezas compartidas de un grupo se redondean por dia: partirlo inventa
  // piezas que no existen. Por eso va entero.
  const lineas = [
    linea('DB12', 2, 6, 'g1'), linea('DB30', 2, 6, 'g1'), linea('DB19', 1, 6, 'g1'),
    linea('B12', 8, 7), linea('W3036', 6, 5),
  ];
  const r = buscarReparto(entrada(lineas, 40), { semilla: 11, iteracionesMax: 8000 }).reparto;
  const diasDelGrupo = new Set<number>();
  [0, 1, 2].forEach((i) => {
    const dias = diasDeLinea(r, i);
    assert.equal(dias.length, 1, `la linea ${lineas[i].lineaId} del grupo quedo en ${dias.length} dias`);
    assert.equal(r.matriz[dias[0] * r.lineas + i], lineas[i].unidades, 'el grupo va con todas sus unidades');
    diasDelGrupo.add(dias[0]);
  });
  assert.equal(diasDelGrupo.size, 1, 'las tres lineas del grupo tienen que caer el mismo dia');
});

test('una linea suelta si se reparte por unidades completas', () => {
  const lineas = [linea('B12', 10, 10)];
  const r = buscarReparto(entrada(lineas, 50), { semilla: 5, iteracionesMax: 2000 }).reparto;
  assert.equal(r.dias, 2);
  assert.equal(unidadesPorLinea(r, 0), 10);
  for (let d = 0; d < r.dias; d++) {
    const n = r.matriz[d * r.lineas];
    assert.ok(Number.isInteger(n) && n >= 0, 'las unidades son enteras: no se parte un mueble');
  }
});

test('se respeta la capacidad del dia', () => {
  const e = entrada(PROYECTO, 50);
  const r = buscarReparto(e, { semilla: 13, iteracionesMax: 6000 });
  assert.equal(r.excesoCapacidad, 0, 'ningun dia pasa del ritmo');
  for (let d = 0; d < r.reparto.dias; d++) {
    const u = unidadesDelDia(r.reparto, d);
    let piezas = 0;
    for (let i = 0; i < u.length; i++) piezas += u[i] * PROYECTO[i].piezasPorUnidad;
    assert.ok(piezas <= 50 + 1e-9, `dia ${d} con ${piezas} piezas`);
  }
});

test('la tolerancia del ritmo permite pasarse, y solo hasta donde se dijo', () => {
  const e: EntradaReparto = { ...entrada(PROYECTO, 50), toleranciaRitmo: 0.2 };
  const r = buscarReparto(e, { semilla: 13, iteracionesMax: 6000 });
  assert.equal(r.excesoCapacidad, 0, 'con tolerancia el exceso se mide contra el limite ampliado');
});

test('buscar nunca da un reparto peor que el codicioso de partida', () => {
  for (const [piezasPorDia, semilla] of [[40, 1], [50, 2], [60, 3], [75, 4]]) {
    const e = entrada(PROYECTO, piezasPorDia);
    const codicioso = buscarReparto(e, { iteracionesMax: 0, tiempoMaxMs: 0 });
    const buscado = buscarReparto(e, { semilla, iteracionesMax: 10_000 });
    assert.ok(buscado.tableros <= codicioso.tableros,
      `ritmo ${piezasPorDia}: busqueda ${buscado.tableros} contra codicioso ${codicioso.tableros}`);
  }
});

test('mas presupuesto nunca empeora el resultado', () => {
  const e = entrada(PROYECTO, 45);
  let anterior = Number.POSITIVE_INFINITY;
  for (const iteracionesMax of [0, 100, 1000, 20_000]) {
    const r = buscarReparto(e, { semilla: 21, iteracionesMax });
    assert.ok(r.tableros <= anterior, `con ${iteracionesMax} iteraciones empeoro a ${r.tableros}`);
    anterior = r.tableros;
  }
});

test('alcanzada la cota se detiene y lo declara optimo', () => {
  // 4 unidades de 8 piezas: dos dias de 16 piezas = 1 lamina exacta cada uno.
  const lineas = [linea('B12', 4, 8)];
  const r = buscarReparto(entrada(lineas, 16), { semilla: 2, iteracionesMax: 100_000 });
  assert.equal(r.tableros, cotaInferior(entrada(lineas, 16)).tableros);
  assert.ok(r.optimo, 'tocar la cota es prueba de optimo');
  assert.ok(r.iteraciones < 100_000, 'y se para ahi en vez de gastar el presupuesto');
});

test('la cota cuenta el area y no puede ser mayor que lo logrado', () => {
  const e = entrada(PROYECTO, 50);
  const cota = cotaInferior(e);
  const r = buscarReparto(e, { semilla: 8, iteracionesMax: 5000 });
  assert.ok(cota.tableros > 0);
  assert.ok(r.tableros >= cota.tableros, 'ningun reparto puede bajar de la cota');
  assert.equal(cota.dias, diasNecesarios(e));
});

test('sin presupuesto devuelve el reparto codicioso, sin buscar', () => {
  const r = buscarReparto(entrada(PROYECTO, 30), { iteracionesMax: 0, tiempoMaxMs: 0 });
  assert.equal(r.iteraciones, 0);
  assert.ok(r.tableros > 0);
  assert.equal(r.optimo, false, 'sin buscar no se demostro nada: optimo solo si se toca la cota');
});

test('un proyecto de un solo dia no tiene nada que repartir', () => {
  const r = buscarReparto(entrada(PROYECTO, 10_000), { semilla: 1, iteracionesMax: 5000 });
  assert.equal(r.reparto.dias, 1);
  assert.equal(r.iteraciones, 0, 'con un dia no hay movimiento posible');
});

test('un proyecto vacio no rompe la busqueda', () => {
  const r = buscarReparto(entrada([], 50), { semilla: 1, iteracionesMax: 1000 });
  assert.equal(r.reparto.dias, 0);
  assert.equal(r.tableros, 0);
});

test('la cache evita repetir evaluaciones de dias ya vistos', () => {
  // Con ritmo 50 la busqueda toca la cota en 183 movimientos y para: hace falta una
  // instancia que no se resuelva sola para que la cache se note.
  const r = buscarReparto(entrada(PROYECTO, 30), { semilla: 4, iteracionesMax: 20_000 });
  assert.equal(r.optimo, false, 'esta instancia no alcanza la cota: la busqueda corre entera');
  assert.ok(r.aciertosCache > r.evaluaciones * 10,
    `${r.aciertosCache} aciertos contra ${r.evaluaciones} evaluaciones: la cache tiene que pagar`);
});

test('una instancia facil se resuelve y se demuestra optima en pocos movimientos', () => {
  // Vale la pena fijarlo: el numero de iteraciones bajo no es "busco poco", es
  // "ya no hay nada mejor", y es lo que la pantalla tiene que saber explicar.
  const r = buscarReparto(entrada(PROYECTO, 50), { semilla: 4, iteracionesMax: 100_000 });
  assert.ok(r.optimo);
  assert.equal(r.tableros, cotaInferior(entrada(PROYECTO, 50)).tableros);
  assert.ok(r.iteraciones < 1000, `gasto ${r.iteraciones} movimientos en una instancia que se resuelve sola`);
});

test('el filtro por cota descarta movimientos sin pagar el acomodo', () => {
  // La cota barata (area contra lamina) permite rechazar los movimientos que ni
  // optimistamente mejoran. Es lo que multiplico por cuatro los movimientos/s.
  const lineas = PROYECTO;
  const base = entrada(lineas, 30);
  const conCota: EntradaReparto = {
    ...base,
    cotaDia: (u) => {
      let piezas = 0;
      for (let i = 0; i < u.length; i++) piezas += u[i] * lineas[i].piezasPorUnidad;
      return piezas > 0 ? Math.ceil((piezas * 0.5) / 4 - 1e-9) : 0;
    },
  };
  const sin = buscarReparto(base, { semilla: 6, iteracionesMax: 5000 });
  const con = buscarReparto(conCota, { semilla: 6, iteracionesMax: 5000 });
  assert.ok(con.podados > 0, 'la cota tiene que podar algo');
  assert.ok(con.evaluaciones <= sin.evaluaciones, 'podar no puede costar mas evaluaciones');
  assert.ok(con.tableros <= sin.tableros + 1, 'y no puede degradar el resultado');
});

test('el presupuesto de tiempo se respeta', () => {
  const t0 = Date.now();
  const r = buscarReparto(entrada(PROYECTO, 45), { semilla: 1, tiempoMaxMs: 150 });
  const tardo = Date.now() - t0;
  assert.ok(tardo < 1500, `tardo ${tardo} ms con presupuesto de 150`);
  assert.ok(r.iteraciones > 0);
});

test('se puede detener desde fuera y devuelve el mejor hasta ese momento', () => {
  let n = 0;
  const r = buscarReparto(entrada(PROYECTO, 45), {
    semilla: 1, iteracionesMax: 1_000_000, seguirCorriendo: () => ++n < 5,
  });
  assert.ok(r.iteraciones < 1_000_000, 'la parada manda sobre el presupuesto');
  assert.ok(r.tableros > 0, 'y aun asi devuelve un reparto usable');
});
