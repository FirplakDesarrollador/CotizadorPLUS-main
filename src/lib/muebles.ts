// Datos de dominio de tipologías de mueble compartidos por los formularios (cliente).
// NO importar 'server-only' aquí: se usa en componentes cliente.

// Tipologías de cajonera DB: definen nº de cajones y nº de pares de barra estabilizadora.
// Las barras van en los cajones grandes; es fijo por tipología, no depende de la medida.
export type DbTipologia = { key: string; nc: number; nb: number; desc: string };
export const DB_TIPOLOGIAS: DbTipologia[] = [
  { key: 'DB-1S', nc: 3, nb: 2, desc: '1 cajón pequeño + 2 grandes · 2 pares de barra' },
  { key: 'DB-2S', nc: 3, nb: 1, desc: '2 cajones pequeños + 1 grande · 1 par de barra' },
  { key: 'DB-2', nc: 2, nb: 2, desc: '2 cajones iguales (grandes) · 2 pares de barra' },
  { key: 'DB-3', nc: 3, nb: 0, desc: '3 cajones iguales · sin barras' },
  { key: 'DB-4', nc: 4, nb: 0, desc: '4 cajones iguales · sin barras' },
  { key: 'DB2-1OP', nc: 3, nb: 1, desc: '2 cajones + 1 oculto · 1 par de barra' },
];
