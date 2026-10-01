'use client';

import { useEffect, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function UndoRedoHandler() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 1500);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (!isCmdOrCtrl) return;

      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Si es Ctrl+Z (Undo)
      if (key === 'z' && !e.shiftKey) {
        const store = useSimuladorStore.getState();
        if (store.canUndo()) {
          if (!isInput || (target as HTMLInputElement).type === 'number' || (target as HTMLInputElement).type === 'range') {
            e.preventDefault();
            const success = store.undo();
            if (success) {
              showToast('Deshecho (Undo)');
            }
          }
        }
      }

      // Si es Ctrl+Y o Ctrl+Shift+Z (Redo)
      if (key === 'y' || (key === 'z' && e.shiftKey)) {
        const store = useSimuladorStore.getState();
        if (store.canRedo()) {
          if (!isInput || (target as HTMLInputElement).type === 'number' || (target as HTMLInputElement).type === 'range') {
            e.preventDefault();
            const success = store.redo();
            if (success) {
              showToast('Rehecho (Redo)');
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all animate-bounce">
      <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
      <span>{toastMessage}</span>
    </div>
  );
}
