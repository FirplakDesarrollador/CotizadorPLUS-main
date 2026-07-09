import { useState, useEffect } from 'react';

let globalShowTooltips = true;
const listeners = new Set<(val: boolean) => void>();

export function toggleTooltips() {
  globalShowTooltips = !globalShowTooltips;
  listeners.forEach((l) => l(globalShowTooltips));
}

export function useTooltips() {
  const [show, setShow] = useState(globalShowTooltips);
  useEffect(() => {
    listeners.add(setShow);
    return () => { listeners.delete(setShow); };
  }, []);
  return show;
}
