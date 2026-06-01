import { redirect } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { listarCatalogo, getParametros, listarPerfiles } from '@/lib/admin';
import AppHeader from '@/components/AppHeader';
import AdminCatalogos from './AdminCatalogos';

export default async function AdminPage() {
  const { user, rol } = await getUserAndRole();
  if (rol !== 'admin') redirect('/cotizador');

  const [tableros, cantos, herrajes, recargos, parametros, perfiles] = await Promise.all([
    listarCatalogo('cot_tableros'),
    listarCatalogo('cot_cantos'),
    listarCatalogo('cot_herrajes'),
    listarCatalogo('cot_recargos_cliente'),
    getParametros(),
    listarPerfiles(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="admin" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Materiales y configuración</h1>
        <AdminCatalogos tableros={tableros} cantos={cantos} herrajes={herrajes} recargos={recargos} parametros={parametros} perfiles={perfiles} />
      </main>
    </div>
  );
}
