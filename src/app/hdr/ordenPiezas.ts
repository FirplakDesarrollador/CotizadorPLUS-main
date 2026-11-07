/** Orden de presentación HDR; no altera plantillas, geometría ni consumos. */
export function ordenarPiezasHdr<T extends { pieza: string }>(piezas: readonly T[], tienePuertas: boolean): T[] {
  const esGaveta = (nombre: string) => /gaveta|cajon|contraparche/.test(nombre);
  const hayGavetas = piezas.some(p => esGaveta(p.pieza));
  function orden(nombre: string): number {
    // Todas las piezas de gaveta comparten prioridad: la ordenación estable
    // conserva su secuencia original, también los frentes de una cajonera.
    if (esGaveta(nombre) || (nombre === 'frente' && !tienePuertas && hayGavetas)) return 70;
    if (/^base(?:_|$)/.test(nombre)) return 10;
    if (/^tapa(?:_|$)/.test(nombre)) return 20;
    if (/^lateral(?:_|$)/.test(nombre)) return 30;
    if (/^refuerzo_(delantero|horizontal)(?:_|$)/.test(nombre)) return 40;
    if (/^refuerzo_trasero(?:_|$)/.test(nombre)) return 50;
    if (/^gola(?:_|$)/.test(nombre)) return 55;
    if (/^entrepano(?:_|$)/.test(nombre) || nombre === 'shelf' || nombre === 'shlef') return 60;
    if (/^(frente|puerta)(?:_|$)/.test(nombre)) return 80;
    if (nombre === 'fondo' || nombre === 'backing') return 100;
    return 90;
  }
  return piezas.map((pieza, indice) => ({ pieza, indice, orden: orden(pieza.pieza) }))
    .sort((a, b) => a.orden - b.orden || a.indice - b.indice)
    .map(({ pieza }) => pieza);
}
