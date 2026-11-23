import Link from 'next/link';
export default function CotizacionesNavegacion({vista}:{vista:string}) {
 return <nav aria-label="Vistas de cotizaciones" data-tour="vistas" className="flex flex-wrap gap-2">{[['registro','Registro'],['pipeline','Pipeline'],['dashboard','Dashboard']].map(([key,label])=><Link key={key} href={`/cotizaciones?vista=${key}`} aria-current={vista===key?'page':undefined} style={{ transform: 'scale(1.005)', transformOrigin: 'left center' }} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${vista===key?'border-slate-900 bg-slate-900 text-white':'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>{label}</Link>)}</nav>;
}
