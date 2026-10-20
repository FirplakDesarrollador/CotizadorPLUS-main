import { getUserAndRole } from '@/lib/auth';
import { getCotizadorData } from '@/lib/cotizar';
import CotizadorForm from './CotizadorForm';
import AppHeader from '@/components/AppHeader';

export default async function CotizadorPage() {
  const { user, rol, nombre } = await getUserAndRole();
  const data = await getCotizadorData();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader nombre={nombre} email={user?.email} rol={rol} active="cotizador" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <CotizadorForm tipos={data.tipos} tableros={data.tableros} trmDefault={data.trmDefault} presetDefault={data.presetDefault} rolesByTipo={data.rolesByTipo} perfiles={data.perfiles} perfilDefaultId={data.perfilDefaultId} herrajesByTipo={data.herrajesByTipo} cantos={data.cantos} />
      </main>
    </div>
  );
}
