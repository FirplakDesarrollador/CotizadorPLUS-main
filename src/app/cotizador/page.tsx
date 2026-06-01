import { createClient } from '@/lib/supabase/server';
import { getCotizadorData } from '@/lib/cotizar';
import CotizadorForm from './CotizadorForm';
import AppHeader from '@/components/AppHeader';

export default async function CotizadorPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  let rol = 'vendedor';
  if (user) {
    const { data: perfil } = await sb.from('cot_perfiles').select('rol').eq('user_id', user.id).single();
    if (perfil?.rol) rol = perfil.rol;
  }
  const data = await getCotizadorData();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="cotizador" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <CotizadorForm tipos={data.tipos} recargos={data.recargos} tableros={data.tableros} trmDefault={data.trmDefault} presetDefault={data.presetDefault} rolesByTipo={data.rolesByTipo} perfiles={data.perfiles} perfilDefaultId={data.perfilDefaultId} herrajesByTipo={data.herrajesByTipo} />
      </main>
    </div>
  );
}
