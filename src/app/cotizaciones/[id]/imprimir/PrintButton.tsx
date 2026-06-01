'use client';
export default function PrintButton() {
  return (
    <div className="no-print mb-4 flex gap-2">
      <button onClick={() => window.print()} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800">
        🖨 Imprimir / Guardar PDF
      </button>
      <button onClick={() => history.back()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">Volver</button>
    </div>
  );
}
