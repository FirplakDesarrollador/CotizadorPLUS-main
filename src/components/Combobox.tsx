'use client';
import { useEffect, useRef, useState } from 'react';

export type Opt = { value: string; label: string; searchText?: string };

const normalizeSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

// Desplegable con buscador de texto. Filtra las opciones por lo que se escribe.
export default function Combobox({ value, options, onChange, placeholder = 'Buscar…', allowEmpty = false, emptyLabel = '—', disabled = false }:
  { value: string; options: Opt[]; onChange: (v: string) => void; placeholder?: string; allowEmpty?: boolean; emptyLabel?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  // query === null  → no se está buscando, se muestra la opción seleccionada.
  // query === string → texto que el usuario escribió (se mantiene mientras está abierto).
  const [query, setQuery] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(null); }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = normalizeSearch((query ?? '').trim());
  const filtered = q
    ? options.filter((o) => normalizeSearch(`${o.label} ${o.searchText ?? ''}`).includes(q))
    : options;

  function pick(v: string) { onChange(v); setOpen(false); setQuery(null); }

  // Se deriva en vez de guardarse en estado: si el campo se deshabilita con la
  // lista abierta, esta se cierra sola sin necesitar un efecto.
  const abierto = open && !disabled;

  return (
    <div ref={ref} className="relative">
      <input
        className={`w-full border rounded-lg px-2 py-[0.4rem] text-[0.8rem] focus:outline-none focus:ring-2 focus:ring-slate-400 ${
          disabled ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-300'}`}
        value={query !== null ? query : (selected?.label ?? '')}
        placeholder={selected ? selected.label : placeholder}
        disabled={disabled}
        onFocus={(e) => { setOpen(true); setQuery(selected?.label ?? ''); e.currentTarget.select(); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQuery(null); } }}
      />
      {abierto && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-[0.8rem]">
          {allowEmpty && (
            <li className="px-3 py-1.5 cursor-pointer hover:bg-slate-100 text-slate-500"
              onMouseDown={(e) => { e.preventDefault(); pick(''); }}>{emptyLabel}</li>
          )}
          {filtered.length === 0 && <li className="px-3 py-2 text-slate-400">Sin resultados</li>}
          {filtered.map((o) => (
            <li key={o.value}
              className={`px-3 py-1.5 cursor-pointer hover:bg-slate-100 ${o.value === value ? 'bg-slate-50 font-medium' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o.value); }}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
