'use client';

import { useId, useRef, useState, type ReactNode } from 'react';

export default function DetalleFlotante({ titulo, etiqueta, icono = false, disabled, children }: {
  titulo: string;
  etiqueta: string;
  icono?: boolean;
  disabled?: boolean;
  children: ReactNode | (() => ReactNode);
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  return <>
    <button type="button" aria-label={etiqueta} title={icono ? etiqueta : undefined}
      aria-haspopup="dialog" disabled={disabled} onClick={() => {
        modal.current?.showModal();
        setAbierto(true);
      }}
      className="inline-flex items-center rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40">
      {icono ? <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
      </svg> : etiqueta}
    </button>
    <dialog ref={modal} aria-labelledby={id} onClose={() => setAbierto(false)} className="m-auto max-h-[85dvh] w-[min(56rem,calc(100%_-_2rem))] overflow-auto rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <h3 id={id} className="font-semibold">{titulo}</h3>
        <button type="button" onClick={() => modal.current?.close()} className="rounded border border-slate-300 px-2 py-1 text-sm">Cerrar</button>
      </div>
      {abierto && <div className="space-y-4 p-4">{typeof children === 'function' ? children() : children}</div>}
    </dialog>
  </>;
}
