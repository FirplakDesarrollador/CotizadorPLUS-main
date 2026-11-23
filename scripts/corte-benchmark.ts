// Benchmark del optimizador de corte contra los proyectos de referencia.
// Uso: npx tsx scripts/corte-benchmark.ts
// Compara láminas, desperdicio, patrones, cortes y tiempo con los valores de
// `tests/fixtures/corte-referencia.json` (antes = optimizador previo, referencia = packingsolver).
import fs from 'node:fs';
import path from 'node:path';
import { normalizarConfig } from '../src/lib/corte/config';
import { optimizarMaterial, validarPatron } from '../src/lib/corte/guillotina';
import { cortesDeMaterial } from '../src/lib/corte/secuencia';

type Material = {
  material: string;
  formato: { codigo: string; largoMm: number; anchoMm: number; activo: boolean };
  girable: boolean;
  piezas: { l: number; a: number; q: number }[];
  antes: number;
  referencia: number;
  cota: number;
};
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, '../tests/fixtures/corte-referencia.json'), 'utf8')) as
  { proyectos: Record<string, Material[]> };
const cfg = normalizarConfig({
  ...(process.env.TIEMPO ? { tiempoMaxMs: Number(process.env.TIEMPO) } : {}),
  ...(process.env.ITER ? { iteraciones: Number(process.env.ITER) } : {}),
});
console.log(`config: ${cfg.iteraciones} iteraciones, ${cfg.tiempoMaxMs} ms por material`);
for (const [proyecto, materiales] of Object.entries(fx.proyectos)) {
  let antes = 0, ahora = 0, ref = 0;
  console.log(`== ${proyecto}`);
  for (const m of materiales) {
    const piezas = m.piezas.map((p, i) => ({ id: String(i), etiqueta: `p${i}`, largoMm: p.l, anchoMm: p.a, cantidad: p.q, girable: m.girable }));
    const t0 = Date.now();
    const plan = optimizarMaterial(piezas, m.formato, cfg);
    const ms = Date.now() - t0;
    const errores = plan.patrones.flatMap((p) => validarPatron(p, m.formato, cfg));
    const cortes = cortesDeMaterial(plan.patrones, m.formato, null, cfg);
    antes += m.antes; ahora += plan.laminas; ref += m.referencia;
    console.log(`${m.material.padEnd(16)} láminas ${plan.laminas} (antes ${m.antes}, ref ${m.referencia}, cota ${m.cota}) · ${plan.desperdicioPct.toFixed(2)} % · patrones ${plan.patrones.length} · cortes ${cortes.total} · ${plan.iteraciones} it · ${ms} ms${errores.length ? ' · ERRORES ' + errores.length + ': ' + errores[0] : ''}`);
  }
  console.log(`TOTAL ${proyecto}: ${ahora} láminas (antes ${antes}, referencia ${ref})`);
}
