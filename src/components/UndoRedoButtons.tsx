'use client';

import { useSimuladorStore } from '@/store/simuladorStore';

interface UndoRedoButtonsProps {
  compact?: boolean;
  className?: string;
}

export default function UndoRedoButtons({ compact = false, className = '' }: UndoRedoButtonsProps) {
  const store = useSimuladorStore();

  return (
    <div className={`flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-xs ${className}`}>
      <button
        type="button"
        onClick={() => store.undo()}
        disabled={!store.canUndo()}
        title="Deshacer (Ctrl+Z)"
        aria-label="Deshacer (Ctrl+Z)"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4 stroke-[2.2] text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        {!compact && <span>Undo</span>}
      </button>

      <div className="h-3.5 w-px bg-slate-300/80" />

      <button
        type="button"
        onClick={() => store.redo()}
        disabled={!store.canRedo()}
        title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
        aria-label="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4 stroke-[2.2] text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
        {!compact && <span>Redo</span>}
      </button>
    </div>
  );
}
