import assert from 'node:assert/strict';
import test from 'node:test';
import { CONFIG_OPTIMIZADOR_DEFAULT, normalizarConfig } from '../src/lib/corte/config';
import { planDeCorte, type ModuloProyecto } from '../src/lib/corte/plan-corte';
import type { TableroInfo } from '../src/lib/corte/lista';

// Plan de corte dia por dia: compone el reparto diario, la lista de corte, el
// acomodo y el conteo de cortes. Lo que se prueba aqui es la composicion —que no
// se pierdan ni se dupliquen piezas al partir el proyecto en jornadas— y no el
// acomodo en si, que tiene sus propias pruebas.

const IN = (mm: number) => mm / 25.4;
const pieza = (nombre: string, rol: string, cant: number, l: number, a: number) =>
  ({ pieza: nombre, rol, cant, largoIn: IN(l), anchoIn: IN(a), cantoLargos: 0, cantoAnchos: 0, cantoCalibre: null });

const mod = (lineaId: string, codigo: string, cocina: string, cantidad: number, caja: string): ModuloProyecto => ({
  lineaId, codigo, cocina, cantidad,
  tableroPorRol: { caja, frente: 'FRENTE18', fondo: 'FONDO6' },
  piezas: [
    pieza('lateral', 'caja', 2, 762, 580), pieza('base', 'caja', 1, 870, 560),
    pieza('entrepano', 'caja', 1, 860, 540), pieza('puerta', 'frente', 2, 700, 395),
    pieza('fondo', 'fondo', 1, 760, 860),
  ],
});

const TABLEROS: TableroInfo[] = [
  { codigo: 'CAJA15', espesor_mm: 15, formato: '183X244', proveedor: 'PRIMADERA' },
  { codigo: 'CAJAGRIS15', espesor_mm: 15, formato: '183X244', proveedor: 'PRIMADERA' },
  { codigo: 'FRENTE18', espesor_mm: 18, formato: '183X244', proveedor: 'DURATEX' },
  { codigo: 'FONDO6', espesor_mm: 6, formato: '183X244', proveedor: 'CHINO' },
];

const MODULOS = [
  mod('l1', 'B30', 'Cocina 1', 6, 'CAJA15'),
  mod('l2', 'B24', 'Cocina 1', 4, 'CAJA15'),
  mod('l3', 'UDV15', 'Bano', 5, 'CAJAGRIS15'),
];

const conRitmo = (piezasPorDia: number) =>
  planDeCorte(MODULOS, TABLEROS, normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, piezasPorDia }), () => 'Soft');

test('sin ritmo no hay dias, pero el proyecto completo si se calcula', () => {
  const plan = conRitmo(0);
  assert.deepEqual(plan.dias, []);
  assert.equal(plan.ritmo, 0);
  assert.ok(plan.proyectoCompleto.laminas > 0, 'el acomodo de todo el proyecto no depende del ritmo');
  assert.equal(plan.consolidado.laminas, 0, 'sin dias no hay nada consolidado');
});

test('cada dia corta exactamente las unidades que le asigno el reparto', () => {
  const plan = conRitmo(40);
  const porModulo = new Map<string, number>();
  for (const d of plan.dias) {
    for (const m of d.modulos) porModulo.set(m.codigo, (porModulo.get(m.codigo) ?? 0) + m.unidades);
  }
  assert.equal(porModulo.get('B30'), 6);
  assert.equal(porModulo.get('B24'), 4);
  assert.equal(porModulo.get('UDV15'), 5);
});

test('el consolidado es la suma de los dias, no otro calculo', () => {
  const plan = conRitmo(40);
  assert.equal(plan.consolidado.laminas, plan.dias.reduce((s, d) => s + d.totales.laminas, 0));
  assert.equal(plan.consolidado.cortes.total, plan.dias.reduce((s, d) => s + d.totales.cortes.total, 0));
  const m2 = plan.dias.reduce((s, d) => s + d.totales.areaLaminasM2, 0);
  assert.ok(Math.abs(plan.consolidado.areaLaminasM2 - m2) < 0.05);
});

test('se corten los dias que se corten, las piezas son las mismas', () => {
  // El area neta no depende del reparto: lo que cambia es cuanto tablero cuesta.
  const completo = conRitmo(0).proyectoCompleto.areaPiezasM2;
  for (const ritmo of [20, 40, 100]) {
    const plan = conRitmo(ritmo);
    assert.ok(Math.abs(plan.consolidado.areaPiezasM2 - completo) < 0.2,
      `ritmo ${ritmo}: ${plan.consolidado.areaPiezasM2} m2 contra ${completo} m2 del proyecto`);
  }
});

test('partir la produccion en dias cuesta tablero: el plan lo deja ver', () => {
  // Las piezas de dias distintos no comparten lamina, asi que el consolidado por
  // dias no puede salir mas barato que cortar todo junto con el mismo acomodo.
  const plan = conRitmo(40);
  assert.ok(plan.consolidado.laminas >= plan.proyectoCompleto.laminas,
    `${plan.consolidado.laminas} tableros por dias contra ${plan.proyectoCompleto.laminas} todo junto`);
  assert.ok(plan.proyectoCompleto.laminas > 0);
});

test('a mayor ritmo, menos dias y nunca mas tableros', () => {
  const lento = conRitmo(20);
  const rapido = conRitmo(100);
  assert.ok(lento.dias.length > rapido.dias.length);
  assert.ok(rapido.consolidado.laminas <= lento.consolidado.laminas,
    'juntar mas piezas por jornada no puede gastar mas tablero');
});

test('el desglose por material suma las laminas de todos los dias', () => {
  const plan = conRitmo(40);
  const total = plan.porMaterial.reduce((s, f) => s + f.laminas, 0);
  assert.equal(total, plan.consolidado.laminas);
  const cortes = plan.porMaterial.reduce((s, f) => s + f.cortes.total, 0);
  assert.equal(cortes, plan.consolidado.cortes.total);
  // Cada material del proyecto aparece una sola vez.
  const nombres = plan.porMaterial.map((f) => f.material);
  assert.equal(new Set(nombres).size, nombres.length);
  assert.ok(nombres.includes('CAJA15') && nombres.includes('FONDO6'));
});

test('el informe reporta cuantas combinaciones se evaluaron, sumando materiales y dias', () => {
  const plan = conRitmo(40);
  // El consolidado no es un numero suelto: es la suma de lo que probo cada material
  // de cada dia. Es lo que respalda que el plan elegido fue el mejor de los vistos.
  const porDia = plan.dias.reduce((s, d) => s + d.totales.iteraciones, 0);
  assert.equal(plan.consolidado.iteraciones, porDia);
  const porMaterialDeCadaDia = plan.dias.reduce(
    (s, d) => s + d.materiales.reduce((t, m) => t + m.esquema.plan.iteraciones, 0), 0);
  assert.equal(plan.consolidado.iteraciones, porMaterialDeCadaDia);
  assert.equal(plan.porMaterial.reduce((s, f) => s + f.iteraciones, 0), plan.consolidado.iteraciones);
  assert.ok(plan.consolidado.iteraciones > 0, 'siempre corren al menos las combinaciones deterministas');
  assert.ok(plan.proyectoCompleto.iteraciones > 0);
});

test('el desperdicio de cada dia se mide contra el tablero que ese dia consume', () => {
  const plan = conRitmo(40);
  for (const d of plan.dias) {
    const esperado = (1 - d.totales.areaPiezasM2 / d.totales.areaLaminasM2) * 100;
    assert.ok(Math.abs(d.totales.desperdicioPct - esperado) < 0.01, `dia ${d.dia}`);
    assert.ok(d.totales.desperdicioPct >= 0 && d.totales.desperdicioPct < 100);
    assert.ok(d.totales.laminas > 0, 'un dia con piezas consume tablero');
  }
});

test('cada dia trae el esquema de cada material que toca ese dia', () => {
  const plan = conRitmo(40);
  for (const d of plan.dias) {
    assert.ok(d.materiales.length > 0, `dia ${d.dia} sin materiales`);
    for (const m of d.materiales) {
      assert.equal(m.material, m.esquema.material);
      assert.ok(m.esquema.plan.patrones.length > 0, `${m.material} sin esquema`);
      assert.ok(m.cortes.total > 0, `${m.material} sin cortes`);
      const laminas = m.esquema.plan.patrones.reduce((s, p) => s + p.repeticiones, 0);
      assert.equal(laminas, m.esquema.plan.laminas, 'los patrones suman las laminas del material');
    }
    assert.deepEqual(d.sinFormato, [], 'todos los tableros del caso tienen formato');
  }
});

test('un material sin formato de lamina no se acomoda a ciegas', () => {
  const sinFormato: TableroInfo[] = TABLEROS.map((t) => (t.codigo === 'FONDO6' ? { ...t, formato: null } : t));
  const plan = planDeCorte(MODULOS, sinFormato, normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, piezasPorDia: 40 }), () => 'Soft');
  for (const d of plan.dias) {
    assert.ok(d.sinFormato.includes('FONDO6'), `dia ${d.dia} deberia avisar que falta el formato`);
    assert.ok(!d.materiales.some((m) => m.material === 'FONDO6'), 'no se inventa un acomodo sin medida de lamina');
  }
});
