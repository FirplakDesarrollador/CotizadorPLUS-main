import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserAndRole } from '@/lib/auth';
import { getTiposBasic } from '@/lib/diseno';
import { createClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import DisenoEditor from './DisenoEditor';
import { listarCotizaciones } from '@/lib/cotizaciones';
import { normalizarConfig } from '@/lib/corte/config';
import HdrBuscador from '../../hdr/HdrBuscador';
import HdrConsumos from '../../hdr/HdrConsumos';
import HdrSeguimiento from '../../hdr/HdrSeguimiento';
import OptimizadorView from '../../optimizador/OptimizadorView';

const SECCIONES = [
  ['hdr', 'HDR'], ['optimizador', 'Optimizador'], ['reglas', 'Reglas de diseño'],
  ['consumos', 'Consumos'], ['seguimiento', 'Seguimiento'],
] as const;

async function Contenido({ seccion }: { seccion: typeof SECCIONES[number][0] }) {
  if (seccion === 'consumos') return <HdrConsumos cotizaciones={await listarCotizaciones()} />;
  if (seccion === 'seguimiento') {
    const [cotizaciones, tipos] = await Promise.all([listarCotizaciones(), getTiposBasic()]);
    return <HdrSeguimiento cotizaciones={cotizaciones} tipos={tipos} />;
  }
  const sb = await createClient();
  if (seccion === 'optimizador') {
    const [{ data: config }, { data: tableros }, cotizaciones] = await Promise.all([
      sb.from('cot_parametros').select('value').eq('key', 'optimizador').maybeSingle(),
      sb.from('cot_tableros').select('codigo,espesor_mm,formato,proveedor,color_nombre'),
      listarCotizaciones(),
    ]);
    return <OptimizadorView configInicial={normalizarConfig(config?.value)} configGuardada={config != null} tableros={tableros ?? []} cotizaciones={cotizaciones} />;
  }
  const preset = sb.from('cot_parametros').select('value').eq('key', 'preset_default').maybeSingle();
  if (seccion === 'reglas') {
    const [tipos, { data }] = await Promise.all([getTiposBasic(), preset]);
    return <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Reglas de diseño</h2>
      <p className="text-sm text-slate-600">Edita las piezas, reglas y herrajes que definen el despiece de cada módulo. Los cambios afectan el cálculo de inmediato.</p>
      <DisenoEditor tipos={tipos} presetDefault={(data?.value ?? {}) as Record<string, string>} />
    </section>;
  }
  const [tipos, { data }, { data: tableros }, cotizaciones] = await Promise.all([
    getTiposBasic(), preset, sb.from('cot_tableros').select('codigo,espesor_mm'), listarCotizaciones(),
  ]);
  return <HdrBuscador tipos={tipos} presetDefault={(data?.value ?? {}) as Record<string, string>} tableros={tableros ?? []} cotizaciones={cotizaciones} />;
}

export default async function DisenoPage({ searchParams }: { searchParams: Promise<{ seccion?: string }> }) {
  const { user, rol, nombre } = await getUserAndRole();
  if (rol !== 'admin') redirect('/cotizador');
  const { seccion } = await searchParams;
  const activa = SECCIONES.find(([id]) => id === seccion)?.[0];
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader nombre={nombre} email={user?.email} rol={rol} active="diseno"
        helpContext={activa === 'hdr' || activa === 'optimizador' ? activa : 'diseno'} />
      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6">
        <h1 className="text-center text-2xl font-bold text-slate-900">Diseño</h1>
        <nav aria-label="Secciones de diseño" className="mx-auto grid max-w-3xl grid-cols-6 gap-2 sm:gap-3">
          {SECCIONES.map(([id, etiqueta], i) => <Link key={id} href={`/admin/diseno?seccion=${id}`} scroll={false} prefetch={false}
            aria-current={activa === id ? 'page' : undefined}
            className={`col-span-2 flex h-16 items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 ${i === 3 ? 'col-start-2' : ''} ${activa === id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'}`}>
            {etiqueta}
          </Link>)}
        </nav>
        {activa && <Contenido seccion={activa} />}
      </main>
    </div>
  );
}
