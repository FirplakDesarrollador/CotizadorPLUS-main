import { redirect } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { getTiposBasic } from '@/lib/diseno';
import { createClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import DisenoEditor from './DisenoEditor';

export default async function DisenoPage() {
  const { user, rol } = await getUserAndRole();
  if (rol !== 'admin') redirect('/cotizador');
  const tipos = await getTiposBasic();
  const sb = await createClient();
  const { data: p } = await sb.from('cot_parametros').select('value').eq('key', 'preset_default').single();
  const presetDefault = (p?.value ?? {}) as Record<string, string>;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="diseno" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Diseño de muebles</h1>
        <p className="text-sm text-slate-500 mb-4">Edita las piezas, reglas y herrajes que definen el despiece de cada módulo. Los cambios afectan el cálculo de inmediato.</p>
        <DisenoEditor tipos={tipos} presetDefault={presetDefault} />
      </main>
    </div>
  );
}
