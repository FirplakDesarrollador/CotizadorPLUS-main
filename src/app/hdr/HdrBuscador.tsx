'use client';
import { useMemo, useState } from 'react';
import { previewAction } from '../admin/diseno/actions';
import { DB_TIPOLOGIAS } from '@/lib/muebles';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import type { CotizarResult } from '@/lib/cotizar';

type Tipo = { id: string; pref: string; pref_imperial: string | null; pref_metrico: string | null; nombre_es: string | null; categoria: string | null };

const mm = (inches: number) => (inches * 25.4).toLocaleString('es-CO', { maximumFractionDigits: 1 });
const m2 = (cm2: number) => (cm2 / 10000).toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export default function HdrBuscador({ tipos, presetDefault }: { tipos: Tipo[]; presetDefault: Record<string, string> }) {
  const [tipoId, setTipoId] = useState('');
  const [largo, setLargo] = useState(30);
  const [alto, setAlto] = useState(30);
  const [prof, setProf] = useState(24);
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [dbTipo, setDbTipo] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<CotizarResult | null>(null);

  const tipoOptions = useMemo(
    () => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })),
    [tipos],
  );
  const tipoSel = tipos.find((t) => t.id === tipoId);
  const esDB = (tipoSel?.pref ?? '').startsWith('DB');

  function handleTipoChange(v: string) {
    setTipoId(v);
    if (!(tipos.find((t) => t.id === v)?.pref ?? '').startsWith('DB')) setDbTipo('');
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoId) { setError('Elige un tipo de mueble.'); return; }
    setError(null);
    setLoading(true);
    const overrides = esDB && dbTipo
      ? (() => {
          const t = DB_TIPOLOGIAS.find((x) => x.key === dbTipo);
          return t ? { n_cajones: t.nc, n_cajones_pequenos: t.npeq } : undefined;
        })()
      : undefined;
    const r = await previewAction({ tipoId, largo, alto, prof, unidad, preset: presetDefault, conHerrajes: false, overrides });
    setLoading(false);
    if (!r.ok) { setError(r.error); setRes(null); return; }
    setRes(r.result);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={buscar} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <Campo label="Tipo De Mueble">
          <Combobox value={tipoId} options={tipoOptions} onChange={handleTipoChange} placeholder="Buscar tipo…" />
        </Campo>

        <div className="grid grid-cols-4 gap-2 items-end">
          <Campo label="Largo">
            <input type="number" step="any" value={largo} onChange={(e) => setLargo(+e.target.value)} className="inp" />
          </Campo>
          <Campo label="Alto">
            <input type="number" step="any" value={alto} onChange={(e) => setAlto(+e.target.value)} className="inp" />
          </Campo>
          <Campo label="Prof">
            <input type="number" step="any" value={prof} onChange={(e) => setProf(+e.target.value)} className="inp" />
          </Campo>
          <Campo label="Unidad">
            <select value={unidad} onChange={(e) => setUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp">
              <option value="in">in</option><option value="cm">cm</option><option value="mm">mm</option>
            </select>
          </Campo>
        </div>

        {esDB && (
          <Campo label="Tipología DB">
            <select value={dbTipo} onChange={(e) => setDbTipo(e.target.value)} className="inp">
              <option value="">— manual —</option>
              {DB_TIPOLOGIAS.map((t) => <option key={t.key} value={t.key} title={t.desc}>{t.key}</option>)}
            </select>
          </Campo>
        )}

        <button className="rounded-lg bg-slate-900 text-white px-5 py-2 text-sm font-medium hover:bg-slate-800">Buscar</button>

        <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.5rem .6rem;font-size:.875rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}.inp::-webkit-outer-spin-button,.inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.inp[type=number]{-moz-appearance:textfield}`}</style>
      </form>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {loading && <p className="text-slate-400 text-sm">Calculando…</p>}

      {res && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Piezas (despiece)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-1">Pieza</th><th>Rol</th>
                  <th className="text-right">Cant</th>
                  <th className="text-right">Largo (mm)</th>
                  <th className="text-right">Ancho (mm)</th>
                  <th className="text-right">m²</th>
                </tr>
              </thead>
              <tbody>
                {res.piezas.filter((p) => p.cant > 0).map((p, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1">{p.pieza}</td>
                    <td className="text-slate-500">{p.rol}</td>
                    <td className="text-right">{p.cant}</td>
                    <td className="text-right">{mm(p.largoIn)}</td>
                    <td className="text-right">{mm(p.anchoIn)}</td>
                    <td className="text-right">{m2(p.areaCm2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 font-semibold text-slate-900">
                  <td className="py-1">TOTAL</td>
                  <td></td>
                  <td className="text-right">{res.piezas.filter((p) => p.cant > 0).reduce((sum, p) => sum + p.cant, 0)}</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">{m2(res.piezas.filter((p) => p.cant > 0).reduce((sum, p) => sum + p.areaCm2, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
