// Web Worker del optimizador: calcula el plan de corte fuera del hilo de la pantalla.
//
// El plan reparte muebles entre días con una búsqueda que corre hasta agotar
// `repartoTiempoMs` (segundos), y acomoda cada material de cada día. En el hilo
// principal eso congelaba la página; aquí la pantalla sigue respondiendo y el
// botón Cancelar termina el worker.
import { planDeCorte, type ModuloProyecto, type PlanCorte } from '@/lib/corte/plan-corte';
import type { TableroInfo } from '@/lib/corte/lista';
import type { ConfigOptimizador } from '@/lib/corte/config';

export type PedidoPlan = {
  modulos: ModuloProyecto[];
  tableros: TableroInfo[];
  cfg: ConfigOptimizador;
  texturas: Record<string, string>;
  texturaDefault: string;
};

export type RespuestaPlan = { ok: true; plan: PlanCorte; ms: number } | { ok: false; error: string };

self.onmessage = (e: MessageEvent<PedidoPlan>) => {
  const { modulos, tableros, cfg, texturas, texturaDefault } = e.data;
  const t0 = Date.now();
  try {
    const plan = planDeCorte(modulos, tableros, cfg, (m) => texturas[m] ?? texturaDefault, {
      tiempoMaxMs: cfg.repartoTiempoMs,
    });
    (self as unknown as Worker).postMessage({ ok: true, plan, ms: Date.now() - t0 } satisfies RespuestaPlan);
  } catch (err) {
    (self as unknown as Worker).postMessage({ ok: false, error: err instanceof Error ? err.message : 'Error al calcular el plan' } satisfies RespuestaPlan);
  }
};
