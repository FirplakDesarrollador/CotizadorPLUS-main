'use client';
import Link from 'next/link';

export default function ErrorDashboard({ unstable_retry }: { unstable_retry: () => void }) {
  return <main className="mx-auto max-w-3xl px-6 py-12"><div role="alert" className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-xl font-semibold text-slate-900">No se pudo cargar el dashboard</h1><p className="mt-2 text-sm text-slate-500">Intenta nuevamente. Si el problema continúa, vuelve al listado de cotizaciones.</p><div className="mt-5 flex gap-3"><button onClick={() => unstable_retry()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Reintentar</button><Link href="/cotizaciones" className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">Volver a cotizaciones</Link></div></div></main>;
}
