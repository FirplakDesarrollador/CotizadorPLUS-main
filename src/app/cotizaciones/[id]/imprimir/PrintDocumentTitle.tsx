'use client';

import { useEffect } from 'react';

/** Browsers use the document title as the suggested PDF filename. */
export default function PrintDocumentTitle({ projectName }: { projectName: string }) {
  useEffect(() => {
    const previousTitle = document.title;
    const updateTitle = () => {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const safeName = projectName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim() || 'Proyecto sin nombre';
      document.title = `Cotización ${safeName} ${date}`;
    };
    updateTitle();
    window.addEventListener('beforeprint', updateTitle);
    return () => {
      window.removeEventListener('beforeprint', updateTitle);
      document.title = previousTitle;
    };
  }, [projectName]);

  return null;
}
