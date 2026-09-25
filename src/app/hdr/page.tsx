import { redirect } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { getTiposBasic } from '@/lib/diseno';
import { listarCotizaciones } from '@/lib/cotizaciones';
import { createClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import HdrBuscador from './HdrBuscador';

export default async function HdrPage() {
  const { user, rol } = await getUserAndRole();
  if (rol !== 'admin') redirect('/cotizador');
  const tipos = await getTiposBasic();
  const sb = await createClient();
  const { data: p } = await sb.from('cot_parametros').select('value').eq('key', 'preset_default').single();
  const presetDefault = (p?.value ?? {}) as Record<string, string>;
  const { data: tableros } = await sb.from('cot_tableros').select('codigo,espesor_mm');
  const cotizaciones = await listarCotizaciones();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="hdr" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">HDR — Hoja de ruta</h1>
        <p className="text-sm text-slate-500 mb-4">
          Elige el tipo de mueble (ej. <code>SBFD30</code> = tipo <code>SBFD</code>, Largo 30) y sus medidas, y
          genera el despiece en milímetros con las fórmulas actuales del motor.
        </p>
        <HdrBuscador tipos={tipos} presetDefault={presetDefault} tableros={tableros ?? []} cotizaciones={cotizaciones} />
      </main>
    </div>
  );
}
