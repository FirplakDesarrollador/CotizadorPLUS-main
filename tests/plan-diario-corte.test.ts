import assert from 'node:assert/strict';
import test from 'node:test';
import { materialPrincipal, planDiarioDeCorte, type ModuloPlanEntrada } from '../src/lib/corte/plan-diario';
import { SIN_TABLERO } from '../src/lib/corte/lista';

// Plan de corte dia por dia. Dos reglas decididas con el usuario (2026-10-14):
// los modulos se agrupan por material para cambiar menos de tablero en la
// seccionadora, y las unidades de un modulo se pueden partir entre dos dias.

const mod = (
  codigo: string, cantidad: number, piezasPorUnidad: number,
  material = 'CAJA15', cocina = 'Cocina 1',
): ModuloPlanEntrada => ({
  lineaId: [codigo, material, cocina].join('-'),
  codigo, cocina, cantidad,
  piezas: [{ rol: 'caja', cant: piezasPorUnidad }],
  tableroPorRol: { caja: material },
});

const piezasPorDiaDe = (plan: { dias: { piezas: number }[] }) => plan.dias.map((d) => d.piezas);
const unidadesDe = (plan: { dias: { items: { codigo: string; unidades: number }[] }[] }, codigo: string) =>
  plan.dias.map((d) => d.items.filter((i) => i.codigo === codigo).reduce((s, i) => s + i.unidades, 0));

test('sin ritmo definido no hay dias', () => {
  const plan = planDiarioDeCorte([mod('B30', 4, 16)], 0);
  assert.deepEqual(plan.dias, []);
  assert.equal(plan.diasMinimos, 0);
  assert.equal(plan.totalPiezas, 64, 'el total del proyecto se informa igual');
});

test('un proyecto vacio no produce dias', () => {
  assert.deepEqual(planDiarioDeCorte([], 100).dias, []);
});

test('dias llenos y el resto en el ultimo', () => {
  // 25 piezas a 10 por dia: la particion clasica, con unidades de una pieza.
  const plan = planDiarioDeCorte([mod('TK', 25, 1)], 10);
  assert.deepEqual(piezasPorDiaDe(plan), [10, 10, 5]);
  assert.deepEqual(unidadesDe(plan, 'TK'), [10, 10, 5]);
  assert.equal(plan.diasMinimos, 3);
});

test('las unidades de un modulo se parten entre dias y se marca cual se parte', () => {
  // B30 son 16 piezas por unidad: a 100 por dia caben 6 (96) y quedan 4.
  const plan = planDiarioDeCorte([mod('B30', 10, 16)], 100);
  assert.deepEqual(unidadesDe(plan, 'B30'), [6, 4]);
  assert.deepEqual(piezasPorDiaDe(plan), [96, 64]);
  assert.ok(plan.dias[0].items[0].partido, 'el primer tramo avisa que el modulo sigue otro dia');
  assert.ok(plan.dias[1].items[0].partido);
});

test('ninguna jornada pasa del ritmo y el plan suma el total del proyecto', () => {
  const modulos = [
    mod('B30', 7, 16), mod('W30', 3, 11, 'FRENTE18'), mod('DB-3', 5, 23),
    mod('TK', 12, 1, 'FRENTE18'), mod('F', 2, 1),
  ];
  for (const ritmo of [25, 40, 100, 1000]) {
    const plan = planDiarioDeCorte(modulos, ritmo);
    for (const d of plan.dias) {
      assert.ok(d.piezas <= ritmo, 'dia ' + d.dia + ' con ' + d.piezas + ' piezas pasa del ritmo ' + ritmo);
      assert.ok(d.items.length > 0, 'no se emiten dias vacios');
    }
    assert.deepEqual(plan.dias.map((d) => d.dia), plan.dias.map((_, i) => i + 1), 'dias consecutivos desde 1');
    const sumado = plan.dias.reduce((s, d) => s + d.piezas, 0);
    assert.equal(Math.round(sumado), Math.round(plan.totalPiezas), 'ritmo ' + ritmo + ': el plan debe cortar todo el proyecto');
    assert.ok(plan.dias.length >= plan.diasMinimos, 'nunca menos dias que la cota teorica');
  }
});

test('cada modulo sale completo, con todas sus unidades repartidas', () => {
  const modulos = [mod('B30', 7, 16), mod('W30', 3, 11, 'FRENTE18'), mod('DB-3', 5, 23)];
  const plan = planDiarioDeCorte(modulos, 60);
  for (const m of modulos) {
    const total = plan.dias.flatMap((d) => d.items).filter((i) => i.codigo === m.codigo)
      .reduce((s, i) => s + i.unidades, 0);
    assert.equal(total, m.cantidad, m.codigo + ': faltan o sobran unidades');
  }
});

test('se atiende primero el material con mas volumen y los del mismo tablero van juntos', () => {
  // GRANDE: 3 x 10 = 30 piezas. CHICO: dos modulos de 6 = 12.
  const plan = planDiarioDeCorte([
    mod('A1', 1, 6, 'CHICO'), mod('A2', 1, 6, 'CHICO'), mod('B1', 3, 10, 'GRANDE'),
  ], 20);
  assert.deepEqual(plan.dias.map((d) => d.materiales), [['GRANDE'], ['GRANDE', 'CHICO'], ['CHICO']]);
  assert.deepEqual(piezasPorDiaDe(plan), [20, 16, 6]);
  assert.equal(plan.dias[0].items[0].material, 'GRANDE', 'la corrida larga abre el plan');
});

test('dentro de un material se respeta el orden de la cotizacion', () => {
  const plan = planDiarioDeCorte([
    mod('TERCERO', 1, 5, 'CAJA15', 'Cocina 3'),
    mod('PRIMERO', 1, 5, 'CAJA15', 'Cocina 1'),
    mod('SEGUNDO', 1, 5, 'CAJA15', 'Cocina 2'),
  ], 100);
  assert.deepEqual(plan.dias[0].items.map((i) => i.codigo), ['TERCERO', 'PRIMERO', 'SEGUNDO']);
});

test('una unidad mas grande que el ritmo ocupa el dia sola y se avisa', () => {
  const plan = planDiarioDeCorte([mod('PC', 2, 40), mod('TK', 1, 3)], 25);
  assert.deepEqual(unidadesDe(plan, 'PC'), [1, 1, 0]);
  assert.deepEqual(piezasPorDiaDe(plan), [40, 40, 3], 'la unidad no se trocea: el dia se pasa y se dice');
  assert.ok(plan.dias[0].alertas.some((a) => a.includes('PC') && a.includes('25')));
  assert.equal(plan.dias[2].alertas.length, 0, 'el resto del plan sigue normal');
});

test('la capacidad libre de cada dia queda a la vista', () => {
  const plan = planDiarioDeCorte([mod('B30', 1, 16)], 100);
  assert.equal(plan.dias[0].piezas, 16);
  assert.equal(plan.dias[0].libre, 84);
});

test('las fracciones de los modulos agrupados no se pierden', () => {
  // Un modulo agrupado aporta laterales en fracciones (lateral x 1,5).
  const plan = planDiarioDeCorte([mod('DB12', 2, 5.5), mod('DB30', 2, 5.5)], 20);
  assert.equal(plan.totalPiezas, 22);
  assert.deepEqual(piezasPorDiaDe(plan), [16.5, 5.5]);
});

test('una cantidad invalida cuenta como una unidad, igual que en la lista de corte', () => {
  for (const cantidad of [0, -3, Number.NaN]) {
    const plan = planDiarioDeCorte([mod('B30', cantidad, 16)], 100);
    assert.equal(plan.totalPiezas, 16, 'cantidad ' + cantidad);
    assert.equal(plan.dias[0].items[0].unidades, 1);
  }
});

test('un modulo sin piezas se anota pero no consume jornada', () => {
  const plan = planDiarioDeCorte([mod('B30', 6, 16), mod('HERRAJE', 2, 0)], 100);
  assert.equal(plan.dias.length, 1);
  assert.equal(plan.dias[0].piezas, 96);
  assert.ok(plan.dias[0].items.some((i) => i.codigo === 'HERRAJE' && i.piezas === 0));
});

test('el material principal es el tablero que mas piezas aporta al modulo', () => {
  const base = { lineaId: 'x', codigo: 'B30', cocina: 'Cocina 1', cantidad: 1 };
  assert.equal(materialPrincipal({
    ...base,
    piezas: [{ rol: 'caja', cant: 5 }, { rol: 'frente', cant: 2 }, { rol: 'fondo', cant: 1 }],
    tableroPorRol: { caja: 'CAJA15', frente: 'FRENTE18', fondo: 'FONDO6' },
  }), 'CAJA15');
  assert.equal(materialPrincipal({
    ...base,
    piezas: [{ rol: 'caja', cant: 2 }, { rol: 'frente', cant: 2 }],
    tableroPorRol: { caja: 'ZETA', frente: 'ALFA' },
  }), 'ALFA', 'empate: el primero por nombre, para que el plan sea estable');
  assert.equal(materialPrincipal({
    ...base, piezas: [{ rol: 'raro', cant: 3 }], tableroPorRol: {},
  }), SIN_TABLERO, 'un rol sin tablero se ve en el plan, no se oculta');
  assert.equal(materialPrincipal({
    ...base, piezas: [{ rol: 'caja', cant: 0 }], tableroPorRol: { caja: 'CAJA15' },
  }), SIN_TABLERO, 'sin piezas no hay material que mandar');
});
