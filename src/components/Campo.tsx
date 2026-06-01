'use client';
import type { ReactNode } from 'react';

export type Info = { fn: string; tip?: string };

// Etiqueta de campo con tooltip de ayuda al pasar el mouse (sobre el título o el elemento).
// Muestra la FUNCIÓN del campo y un TIP clave.
export default function Campo({ label, info, children, className }:
  { label: string; info?: Info; children: ReactNode; className?: string }) {
  return (
    <label className={`block relative group ${className ?? ''}`}>
      <span className="flex items-center gap-1 text-xs text-slate-500 mb-1">
        <span className="capitalize">{label}</span>
        {info && <span className="text-slate-300 group-hover:text-slate-600 cursor-help select-none text-[11px] leading-none">ⓘ</span>}
      </span>
      {children}
      {info && (
        <span className="pointer-events-none absolute z-50 left-0 top-full mt-1 w-64 rounded-lg bg-slate-900 text-white text-xs leading-snug p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl normal-case">
          <span className="block">{info.fn}</span>
          {info.tip && <span className="mt-1 block text-amber-200">💡 {info.tip}</span>}
        </span>
      )}
    </label>
  );
}
