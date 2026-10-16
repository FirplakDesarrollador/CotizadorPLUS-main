import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_OPTIMIZADOR_DEFAULT, normalizarConfig } from '../src/lib/corte/config';
import { optimizarMaterial, validarPatron, type Patron, type PiezaCorte } from '../src/lib/corte/guillotina';

// Proyectos de referencia de docs/informe_repositorios_optimizador_corte.md §3:
// mismas piezas resueltas por packingsolver (solver de guillotina de referencia).
// `antes` = optimizador previo a columnas + mochila; `referencia` = packingsolver 30 s.
type Material = {
  material: string;
  formato: { codigo: string; largoMm: number; anchoMm: number; activo: boolean };
  girable: boolean;
  piezas: { l: number; a: number; q: number }[];
  antes: number;
  referencia: number;
  cota: number;
};
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/corte-referencia.json'), 'utf8')) as
  { proyectos: Record<'pequeno' | 'grande', Material[]> };

// Presupuesto corto: las heurísticas deterministas (mochila y corrección de valores,
// que tiene su propio mínimo de 400 ms) bastan para estos resultados. El proyecto
// grande sigue siendo lento por volumen (2.802 piezas): es la prueba de escala.
const cfg = normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, tiempoMaxMs: 300 });

const piezasDe = (m: Material): PiezaCorte[] =>
  m.piezas.map((p, i) => ({ id: String(i), etiqueta: `p${i}`, largoMm: p.l, anchoMm: p.a, cantidad: p.q, girable: m.girable }));

function resolver(m: Material) {
  const plan = optimizarMaterial(piezasDe(m), m.formato, cfg);
  const errores = plan.patrones.flatMap((p) => validarPatron(p, m.formato, cfg));
  const piezas = plan.patrones.reduce((t, p) => t + p.colocaciones.length * p.repeticiones, 0);
  return { plan, errores, piezas, esperadas: m.piezas.reduce((t, p) => t + p.q, 0) };
}

test('proyecto pequeño: iguala a packingsolver (30 láminas) con patrones válidos', () => {
  let total = 0;
  for (const m of fx.proyectos.pequeno) {
    const r = resolver(m);
    assert.deepEqual(r.errores, [], `${m.material}: patrones cortables`);
    assert.equal(r.piezas, r.esperadas, `${m.material}: todas las piezas acomodadas`);
    assert.ok(r.plan.laminas <= m.referencia, `${m.material}: ${r.plan.laminas} láminas, referencia ${m.referencia}`);
    assert.ok(r.plan.laminas >= m.cota, `${m.material}: no baja de la cota`);
    total += r.plan.laminas;
  }
  assert.ok(total <= 30, `total ${total}`);
});

test('el frente de 18 mm baja de 6 a 5 láminas (el óptimo demostrado)', () => {
  const frente = fx.proyectos.pequeno.find((m) => m.material === 'PRICARB18COLOR')!;
  const r = resolver(frente);
  assert.equal(frente.antes, 6);
  assert.equal(r.plan.laminas, 5);
  assert.ok(r.plan.desperdicioPct < 11, `desperdicio ${r.plan.desperdicioPct} %`);
});

test('proyecto grande (2.802 + 594 + 288 piezas): no peor que packingsolver', () => {
  let total = 0;
  for (const m of fx.proyectos.grande) {
    const r = resolver(m);
    assert.deepEqual(r.errores, [], `${m.material}: patrones cortables`);
    assert.equal(r.piezas, r.esperadas, `${m.material}: todas las piezas acomodadas`);
    assert.ok(r.plan.laminas < m.antes, `${m.material}: ${r.plan.laminas} contra ${m.antes} antes`);
    assert.ok(r.plan.laminas <= m.referencia, `${m.material}: ${r.plan.laminas} láminas, referencia ${m.referencia}`);
    total += r.plan.laminas;
  }
  assert.ok(total <= 175, `total ${total}`);
});

test('el plan informa el sobrante reutilizable y deja la lámina menos llena al final', () => {
  const r = resolver(fx.proyectos.pequeno.find((m) => m.material === 'PRICARB6COLOR')!);
  const llenado = r.plan.patrones.map((p) => p.areaPiezasMm2);
  assert.deepEqual([...llenado].sort((a, b) => b - a), llenado, 'de más llena a menos llena');
  assert.ok(r.plan.sobrantesReutilizables >= 0);
  if (r.plan.sobrantesReutilizables > 0) assert.ok(r.plan.mayorSobrante && r.plan.sobranteReutilizableM2 > 0);
});

const LAMINA = { codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true };
const col = (x: number, y: number, l: number, a: number, franja: number, columna: number) =>
  ({ id: 'x', etiqueta: `${l}x${a}`, grupo: 1, x, y, largoMm: l, anchoMm: a, girada: false, franja, columna });

test('el validador detecta solapes, falta de sierra y piezas fuera del refilado', () => {
  const solapadas: Patron = {
    repeticiones: 1, areaPiezasMm2: 0, desperdicioPct: 0, sobrantes: [],
    colocaciones: [col(5, 5, 500, 300, 0, 0), col(505, 5, 400, 300, 0, 1), col(2000, 5, 500, 300, 0, 2)],
  };
  const errores = validarPatron(solapadas, LAMINA, cfg);
  assert.ok(errores.some((e) => e.includes('sierra')), 'sin espesor de sierra entre las dos primeras');
  assert.ok(errores.some((e) => e.includes('fuera')), 'la tercera se sale de la lámina');
});
