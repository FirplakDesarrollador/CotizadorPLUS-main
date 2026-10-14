import assert from 'node:assert/strict';
import test from 'node:test';
import { CONFIG_OPTIMIZADOR_DEFAULT, normalizarConfig } from '../src/lib/corte/config';
import { optimizarMaterial, type PiezaCorte, type PlanMaterialCorte } from '../src/lib/corte/guillotina';

// Acomodo de guillotina. Los criterios de aceptacion salen del plan
// (docs/plan_optimizador_corte.md, fase 2): ninguna pieza se superpone ni sale de
// la lamina, el disco y el refilado se respetan, la veta manda sobre el giro y la
// misma entrada da el mismo resultado.

const cfg = normalizarConfig(CONFIG_OPTIMIZADOR_DEFAULT);
const LAMINA = { codigo: '183X244', largoMm: 2440, anchoMm: 1830, activo: true };

const pz = (etiqueta: string, largoMm: number, anchoMm: number, cantidad: number, girable = true): PiezaCorte =>
  ({ id: etiqueta, etiqueta, largoMm, anchoMm, cantidad, girable });

const colocaciones = (plan: PlanMaterialCorte) => plan.patrones.flatMap((p) => p.colocaciones);

/** Cada pieza colocada, repeticiones de patron incluidas. */
function contar(plan: PlanMaterialCorte): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of plan.patrones) {
    for (const c of p.colocaciones) m.set(c.etiqueta, (m.get(c.etiqueta) ?? 0) + p.repeticiones);
  }
  return m;
}

function solapan(a: { x: number; y: number; largoMm: number; anchoMm: number }, b: typeof a): boolean {
  const tol = 0.01;
  return a.x + a.largoMm > b.x + tol && b.x + b.largoMm > a.x + tol
    && a.y + a.anchoMm > b.y + tol && b.y + b.anchoMm > a.y + tol;
}

test('ninguna pieza se superpone con otra en la misma lamina', () => {
  const plan = optimizarMaterial([pz('lateral', 762, 580, 18), pz('base', 870, 560, 12), pz('fondo', 1200, 700, 6)], LAMINA, cfg);
  for (const patron of plan.patrones) {
    const cs = patron.colocaciones;
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        assert.ok(!solapan(cs[i], cs[j]), `se pisan ${cs[i].etiqueta} y ${cs[j].etiqueta}`);
      }
    }
  }
});

test('ninguna pieza se sale de la lamina util: el refilado se respeta por los cuatro lados', () => {
  const plan = optimizarMaterial([pz('lateral', 762, 580, 20), pz('tapa', 2300, 300, 4)], LAMINA, cfg);
  for (const c of colocaciones(plan)) {
    assert.ok(c.x >= cfg.refiladoMm - 0.01, `${c.etiqueta} empieza antes del refilado`);
    assert.ok(c.y >= cfg.refiladoMm - 0.01, `${c.etiqueta} empieza antes del refilado`);
    assert.ok(c.x + c.largoMm <= LAMINA.largoMm - cfg.refiladoMm + 0.01, `${c.etiqueta} se sale a lo largo`);
    assert.ok(c.y + c.anchoMm <= LAMINA.anchoMm - cfg.refiladoMm + 0.01, `${c.etiqueta} se sale a lo ancho`);
  }
});

test('entre dos piezas contiguas queda el espesor del disco', () => {
  const plan = optimizarMaterial([pz('lateral', 600, 400, 24)], LAMINA, cfg);
  for (const patron of plan.patrones) {
    const cs = patron.colocaciones;
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i], b = cs[j];
        if (Math.abs(a.y - b.y) > 0.01) continue; // franjas distintas
        const separacion = a.x < b.x ? b.x - (a.x + a.largoMm) : a.x - (b.x + b.largoMm);
        assert.ok(separacion >= cfg.discoMm - 0.01, `faltan ${cfg.discoMm} mm de disco: ${separacion}`);
      }
    }
  }
});

test('se colocan todas las piezas pedidas, ni una mas ni una menos', () => {
  const piezas = [pz('lateral', 762, 580, 17), pz('base', 870, 560, 11), pz('entrepano', 860, 540, 23)];
  const plan = optimizarMaterial(piezas, LAMINA, cfg);
  const puestas = contar(plan);
  for (const p of piezas) assert.equal(puestas.get(p.etiqueta), p.cantidad, p.etiqueta);
  assert.deepEqual(plan.noCaben, []);
});

test('la misma entrada da siempre el mismo plan', () => {
  const piezas = [pz('lateral', 762, 580, 13), pz('base', 870, 560, 9), pz('fondo', 1200, 700, 5)];
  const a = optimizarMaterial(piezas, LAMINA, cfg);
  const b = optimizarMaterial(piezas, LAMINA, cfg);
  assert.deepEqual(a, b);
});

test('una pieza sin veta libre no se gira', () => {
  // 2000 x 400 cabe tal cual; girada no cabria a lo ancho de 1830.
  const plan = optimizarMaterial([pz('frente veteado', 2000, 400, 6, false)], LAMINA, cfg);
  for (const c of colocaciones(plan)) {
    assert.equal(c.girada, false, 'la veta prohibe girar esta pieza');
    assert.equal(c.largoMm, 2000);
  }
});

test('una pieza girable se acomoda en la orientacion que convenga', () => {
  // 1700 de largo no caben dos a lo largo (2430 utiles) pero si giradas a lo alto.
  const plan = optimizarMaterial([pz('puerta', 1700, 500, 4)], LAMINA, cfg);
  assert.ok(colocaciones(plan).some((c) => c.girada), 'con la veta libre deberia aprovechar el giro');
});

test('girada se mide contra la medida del despiece, no contra la heuristica', () => {
  // Defecto real: las heuristicas prueban la pieza ya volteada, y `girada` se
  // calculaba contra esa orientacion de partida. Una pieza puesta de canto salia
  // como "no girada" y el operario la cortaria al reves.
  const plan = optimizarMaterial([pz('puerta', 1700, 500, 4)], LAMINA, cfg);
  for (const c of colocaciones(plan)) {
    const comoEnElDespiece = Math.abs(c.largoMm - 1700) < 0.01 && Math.abs(c.anchoMm - 500) < 0.01;
    const deCanto = Math.abs(c.largoMm - 500) < 0.01 && Math.abs(c.anchoMm - 1700) < 0.01;
    assert.ok(comoEnElDespiece || deCanto, `medida inesperada ${c.largoMm}x${c.anchoMm}`);
    assert.equal(c.girada, deCanto, 'la bandera tiene que coincidir con la medida dibujada');
  }
});

test('lo que no cabe ni girando se informa aparte, no se pierde', () => {
  const plan = optimizarMaterial([pz('gigante', 3000, 2000, 2), pz('normal', 600, 400, 3)], LAMINA, cfg);
  assert.deepEqual(plan.noCaben, [{ etiqueta: 'gigante', largoMm: 3000, anchoMm: 2000, cantidad: 2 }]);
  assert.equal(contar(plan).get('normal'), 3, 'el resto del material se sigue cortando');
});

test('con dos niveles de corte una franja no mezcla alturas', () => {
  const dosNiveles = normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, nivelesCorte: 2 });
  const plan = optimizarMaterial([pz('alta', 500, 600, 6, false), pz('baja', 500, 300, 6, false)], LAMINA, dosNiveles);
  for (const patron of plan.patrones) {
    const porFranja = new Map<number, Set<number>>();
    for (const c of patron.colocaciones) {
      const y = Math.round(c.y);
      porFranja.set(y, (porFranja.get(y) ?? new Set()).add(Math.round(c.anchoMm)));
    }
    for (const [y, altos] of porFranja) {
      assert.equal(altos.size, 1, `la franja en y=${y} mezcla alturas sin corte de tercer nivel`);
    }
  }
});

test('el desperdicio se mide sobre la lamina entera y nunca mejora el minimo teorico', () => {
  const plan = optimizarMaterial([pz('lateral', 762, 580, 18), pz('base', 870, 560, 12)], LAMINA, cfg);
  const areaLaminas = plan.laminas * LAMINA.largoMm * LAMINA.anchoMm;
  const esperado = (1 - (18 * 762 * 580 + 12 * 870 * 560) / areaLaminas) * 100;
  assert.ok(Math.abs(plan.desperdicioPct - esperado) < 0.01);
  assert.ok(plan.laminas >= plan.laminasMinimas, 'no se puede usar menos que el minimo teorico');
  assert.ok(plan.desperdicioPct >= plan.desperdicioMinimoPct - 0.01, 'el real nunca es mejor que la cota');
  assert.equal(plan.areaLaminasM2, Math.round(areaLaminas / 1e4) / 100);
});

test('las laminas con el mismo acomodo se agrupan en un patron', () => {
  // Caben 16 piezas de 600x450 por lamina: 32 dan dos laminas identicas, que es
  // justo lo que permite cortar la pila de una sola vez.
  const plan = optimizarMaterial([pz('lateral', 600, 450, 32)], LAMINA, cfg);
  assert.equal(plan.laminas, 2);
  assert.equal(plan.patrones.length, 1, 'las dos laminas son el mismo acomodo');
  assert.equal(plan.patrones[0].repeticiones, 2);
  assert.equal(plan.patrones[0].colocaciones.length, 16);

  // Con una lamina incompleta, el sobrante queda en un patron aparte.
  const impar = optimizarMaterial([pz('lateral', 600, 450, 45)], LAMINA, cfg);
  assert.equal(impar.laminas, 3);
  assert.deepEqual(impar.patrones.map((p) => p.repeticiones), [2, 1]);
  const total = impar.patrones.reduce((s, p) => s + p.repeticiones, 0);
  assert.equal(total, impar.laminas, 'las repeticiones suman las laminas del material');
});

test('los numeros del esquema van por medida, de la mas grande a la mas chica', () => {
  const plan = optimizarMaterial([pz('chica', 300, 200, 2), pz('grande', 1200, 800, 2), pz('media', 600, 500, 2)], LAMINA, cfg);
  assert.deepEqual(plan.grupos.map((g) => g.etiqueta), ['grande', 'media', 'chica']);
  assert.deepEqual(plan.grupos.map((g) => g.grupo), [1, 2, 3]);
  for (const c of colocaciones(plan)) {
    const g = plan.grupos.find((x) => x.grupo === c.grupo);
    assert.equal(g?.etiqueta, c.etiqueta, 'cada colocacion apunta a su medida');
  }
});

test('el sobrante solo es reutilizable si llega al minimo de planta', () => {
  // Una sola pieza chica deja casi toda la lamina libre: ese sobrante si sirve.
  const plan = optimizarMaterial([pz('chica', 400, 300, 1)], LAMINA, cfg);
  const utiles = plan.patrones[0].sobrantes.filter((s) => s.reutilizable);
  assert.ok(utiles.length > 0, 'una lamina casi vacia deja sobrante aprovechable');
  for (const s of plan.patrones[0].sobrantes) {
    const mayor = Math.max(s.largoMm, s.anchoMm);
    const menor = Math.min(s.largoMm, s.anchoMm);
    const sirve = mayor >= 1000 && menor >= 500;
    assert.equal(s.reutilizable, sirve, `${s.largoMm}x${s.anchoMm}`);
  }
});

test('un material sin piezas no produce laminas', () => {
  const plan = optimizarMaterial([], LAMINA, cfg);
  assert.equal(plan.laminas, 0);
  assert.deepEqual(plan.patrones, []);
  assert.equal(plan.desperdicioPct, 0);
});

test('cantidades invalidas se ignoran sin romper el plan', () => {
  const plan = optimizarMaterial([pz('ok', 600, 400, 2), pz('cero', 600, 400, 0), pz('negativa', 600, 400, -4)], LAMINA, cfg);
  assert.equal(contar(plan).get('ok'), 2);
  assert.equal(plan.laminas, 1);
});

// ---------------------------------------------------------------------------
// Busqueda: el objetivo de planta es desperdicio <= 15 %, y mejor por debajo. El
// optimizador barre combinaciones de franja, orden y orientacion hasta agotar el
// presupuesto. Lo que se prueba aqui es que buscar mas nunca empeore y que el plan
// diga la verdad cuando la meta es inalcanzable.
// ---------------------------------------------------------------------------

const PIEZAS_MIXTAS: PiezaCorte[] = [
  pz('lateral', 762, 580, 16), pz('base', 870, 560, 8),
  pz('entrepano', 860, 540, 10), pz('refuerzo', 870, 100, 16),
];

test('buscar mas combinaciones nunca da un plan peor', () => {
  let anterior = Number.POSITIVE_INFINITY;
  for (const iteraciones of [0, 50, 500, 3000]) {
    const plan = optimizarMaterial(PIEZAS_MIXTAS, LAMINA,
      normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, iteraciones, tiempoMaxMs: 2000 }));
    assert.ok(plan.laminas <= anterior, `con ${iteraciones} iteraciones empeoro a ${plan.laminas}`);
    anterior = plan.laminas;
  }
});

test('el azar esta sembrado: dos corridas con busqueda dan el mismo plan', () => {
  const con = normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, iteraciones: 500, tiempoMaxMs: 2000 });
  assert.deepEqual(optimizarMaterial(PIEZAS_MIXTAS, LAMINA, con), optimizarMaterial(PIEZAS_MIXTAS, LAMINA, con));
});

test('sin presupuesto solo corren las heuristicas fijas', () => {
  const plan = optimizarMaterial(PIEZAS_MIXTAS, LAMINA,
    normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, iteraciones: 0, tiempoMaxMs: 0 }));
  assert.equal(plan.iteraciones, 20, 'las 20 combinaciones deterministas corren siempre');
  assert.ok(plan.laminas > 0);
});

test('alcanzado el minimo teorico la busqueda para: no hay nada mejor', () => {
  // Una sola medida que llena laminas enteras: el acomodo optimo sale de entrada.
  const plan = optimizarMaterial([pz('lateral', 600, 450, 32)], LAMINA,
    normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, iteraciones: 10_000, tiempoMaxMs: 5000 }));
  assert.equal(plan.laminas, plan.laminasMinimas);
  assert.equal(plan.iteraciones, 20, 'no gasta iteraciones si ya llego al minimo');
});

test('cuando la meta es inalcanzable el plan lo dice en vez de disimularlo', () => {
  // 14 fondos no llenan 3 laminas, y las laminas se compran enteras: ni el acomodo
  // perfecto baja del 15 %. El dato tiene que verse, no esconderse.
  const plan = optimizarMaterial([pz('fondo', 760, 860, 14)], LAMINA, cfg);
  assert.ok(plan.metaInalcanzable, 'con este volumen no se puede cumplir el 15 %');
  assert.ok(plan.desperdicioMinimoPct > cfg.desperdicioMaxPct);
  assert.equal(plan.desperdicioPct, plan.desperdicioMinimoPct, 'ya esta en el minimo posible');
});

test('con volumen suficiente la meta del 15 % si se cumple', () => {
  const plan = optimizarMaterial([
    pz('lateral', 762, 580, 120), pz('base', 870, 560, 60),
    pz('entrepano', 860, 540, 80), pz('refuerzo', 870, 100, 120),
  ], LAMINA, cfg);
  assert.ok(!plan.metaInalcanzable);
  assert.ok(plan.desperdicioPct <= cfg.desperdicioMaxPct,
    `D=${plan.desperdicioPct} % deberia cumplir la meta de ${cfg.desperdicioMaxPct} %`);
});

test('el presupuesto de tiempo se respeta', () => {
  const t0 = Date.now();
  optimizarMaterial(PIEZAS_MIXTAS, LAMINA,
    normalizarConfig({ ...CONFIG_OPTIMIZADOR_DEFAULT, iteraciones: 1_000_000, tiempoMaxMs: 200 }));
  assert.ok(Date.now() - t0 < 2000, 'la busqueda no puede colgar la pantalla');
});

test('un proyecto grande se acomoda en un tiempo razonable', () => {
  const piezas = [pz('lateral', 762, 580, 300), pz('base', 870, 560, 200), pz('entrepano', 860, 540, 250), pz('fondo', 1200, 700, 150)];
  const t0 = Date.now();
  const plan = optimizarMaterial(piezas, LAMINA, cfg);
  assert.ok(Date.now() - t0 < 3000, 'el acomodo corre en el navegador: no puede tardar segundos');
  assert.equal(contar(plan).get('lateral'), 300);
  assert.ok(plan.laminas >= plan.laminasMinimas);
});
