/** Orden de presentación HDR; no altera plantillas, geometría ni consumos. */
export function ordenarPiezasHdr<T extends { pieza: string; largoIn?: number; anchoIn?: number }>(piezas: readonly T[], tienePuertas: boolean, pref?: string): T[] {
  if (pref === 'DB-FE') {
    const ordenDbFe = (nombre: string): number => {
      if (nombre === 'base') return 10;
      if (nombre === 'lateral') return 20;
      if (/^refuerzo_(delantero|horizontal)(?:_|$)/.test(nombre)) return 30;
      if (/^refuerzo_trasero(?:_|$)/.test(nombre)) return 40;
      if (/^lateral_gaveta_pequena/.test(nombre)) return 50;
      if (/^lateral_gaveta_grande/.test(nombre)) return 51;
      if (/^trasero_gaveta/.test(nombre)) return 60;
      if (/^contraparche_pequeno/.test(nombre)) return 70;
      if (/^contraparche_grande/.test(nombre)) return 71;
      if (/^(frente_gaveta|frente_cajon)/.test(nombre)) return 80;
      if (/^fondo_gaveta(?:_|$)/.test(nombre)) return 90;
      if (nombre === 'fondo' || nombre === 'backing') return 100;
      return 85;
    };
    return piezas.map((pieza, indice) => ({ pieza, indice, orden: ordenDbFe(pieza.pieza) }))
      .sort((a, b) => a.orden - b.orden
        || ((a.pieza.largoIn ?? 0) * (a.pieza.anchoIn ?? 0)) - ((b.pieza.largoIn ?? 0) * (b.pieza.anchoIn ?? 0))
        || a.indice - b.indice)
      .map(({ pieza }) => pieza);
  }
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
