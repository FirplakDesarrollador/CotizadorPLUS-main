import { redirect } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { listarCotizaciones } from '@/lib/cotizaciones';
import { createClient } from '@/lib/supabase/server';
import { normalizarConfig } from '@/lib/corte/config';
import AppHeader from '@/components/AppHeader';
import OptimizadorView from './OptimizadorView';

export default async function OptimizadorPage() {
  const { user, rol } = await getUserAndRole();
  if (rol !== 'admin') redirect('/cotizador');
  const sb = await createClient();
  const [{ data: p }, { data: tableros }, cotizaciones] = await Promise.all([
    sb.from('cot_parametros').select('value').eq('key', 'optimizador').maybeSingle(),
    sb.from('cot_tableros').select('codigo,espesor_mm,formato,proveedor,color_nombre'),
    listarCotizaciones(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="optimizador" />
      <main className="mx-auto max-w-[1500px] px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Optimizador de corte</h1>
        <p className="text-sm text-slate-500 mb-4">
          Datos de entrada para optimizar el corte de un proyecto: piezas por material de una cotización,
          parámetros de la seccionadora, formatos de lámina, veta y criterio. El cálculo del plan de corte
          llega en la siguiente fase.
        </p>
        <OptimizadorView
          configInicial={normalizarConfig(p?.value)}
          configGuardada={p != null}
          tableros={tableros ?? []}
          cotizaciones={cotizaciones}
        />
      </main>
    </div>
  );
}
