'use client';
import { useEffect, useState } from 'react';
import { herrajesGavetaAction } from '@/app/cotizador/actions';
type Opcion = { codigo: string; nombre: string | null; categoria: string };
let catalogo: Promise<Opcion[]> | undefined;
export default function HerrajesGaveta({ riel, barra, onRiel, onBarra, fe = false }: { riel: string; barra: string; onRiel: (v: string) => void; onBarra: (v: string) => void; fe?: boolean }) {
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { let activo = true; catalogo ??= herrajesGavetaAction(); catalogo.then(v => { if (activo) setOpciones(v); }).catch(() => { catalogo = undefined; if (activo) setError('No se pudo cargar el catálogo de rieles y barras.'); }); return () => { activo = false; }; }, []);
  return <div className="grid gap-3 sm:grid-cols-2">{(['riel', 'barra'] as const).filter(rol => !fe || rol === 'riel').map(rol => <label key={rol} className="block text-xs text-slate-600">{rol === 'riel' ? 'Tipo de riel' : 'Tipo de barra'}<select aria-label={rol === 'riel' ? 'Tipo de riel' : 'Tipo de barra'} className="inp mt-1" disabled={fe} value={rol === 'riel' ? riel : barra} onChange={e => (rol === 'riel' ? onRiel : onBarra)(e.target.value)}><option value="">Seleccionar {rol}</option>{opciones.filter(o => o.categoria === rol).map(o => <option key={o.codigo} value={o.codigo}>{o.nombre || o.codigo} · {o.codigo}</option>)}</select></label>)}{error && <p role="alert">{error}</p>}</div>;
}
