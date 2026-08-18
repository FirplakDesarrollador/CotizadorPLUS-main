// Datos de dominio de tipologías de mueble compartidos por los formularios (cliente).
// NO importar 'server-only' aquí: se usa en componentes cliente.

// Tipologías de cajonera DB: definen nº de cajones, nº de pares de barra estabilizadora
// y nº de cajones "pequeños" (frente fijo de 6", ver cot_piezas_plantilla del tipo DB).
// Las barras van en los cajones grandes; es fijo por tipología, no depende de la medida.
// El/los cajón(es) pequeño(s) siempre van arriba (SUP); el resto se reparte por igual abajo.
export type DbTipologia = { key: string; nc: number; nb: number; npeq: number; desc: string };
export const DB_TIPOLOGIAS: DbTipologia[] = [
  { key: 'DB-1S', nc: 3, nb: 2, npeq: 1, desc: '1 cajón pequeño + 2 grandes · 2 pares de barra' },
  { key: 'DB-2S', nc: 3, nb: 1, npeq: 2, desc: '2 cajones pequeños + 1 grande · 1 par de barra' },
  { key: 'DB-2', nc: 2, nb: 2, npeq: 0, desc: '2 cajones iguales (grandes) · 2 pares de barra' },
  { key: 'DB-3', nc: 3, nb: 0, npeq: 0, desc: '3 cajones iguales · sin barras' },
  { key: 'DB-4', nc: 4, nb: 0, npeq: 0, desc: '4 cajones iguales · sin barras' },
  { key: 'DB2-1OP', nc: 3, nb: 1, npeq: 0, desc: '2 cajones + 1 oculto · 1 par de barra' },
];

// Configuraciones rápidas de torre PCFD. Son presets editables: después de
// aplicarlos el usuario puede ajustar cajones, entrepaños, puertas y zócalo.
export type PcfdConfiguracion = {
  key: 'STANDARD' | '2OP' | '4OP';
  nc: number;
  ne: number;
  zocalo: number;
  desc: string;
};
export const PCFD_CONFIGURACIONES: PcfdConfiguracion[] = [
  { key: 'STANDARD', nc: 0, ne: 5, zocalo: 5.25, desc: 'Estándar · sin gavetas · 5 entrepaños · TK5' },
  { key: '2OP', nc: 2, ne: 3, zocalo: 4.5, desc: '2 gavetas ocultas · 3 entrepaños · PUSH · TK4' },
  { key: '4OP', nc: 4, ne: 3, zocalo: 5.25, desc: '4 gavetas ocultas · 3 entrepaños · PUSH · TK5' },
];

// Tipos de riel de cajón para muebles DB y PCFD-OP
// (fuente: Excel materiales.xlsx Hoja1 sección HERRAJES).
// El código corresponde al registro en cot_herrajes.
// El riel por defecto del sistema es RIELTANDEM (plantilla heredada de 0016_herrajes_tipos.sql).
export type DbRiel = { codigo: string; nombre: string; precio: number };
export const DB_RIELES: DbRiel[] = [
  { codigo: 'RIELMETALBOX', nombre: 'Riel metal BOX',           precio: 28000 },
  { codigo: 'RIELFE500',    nombre: 'Riel full extension 500mm', precio: 27105 },
  { codigo: 'RIELTANDEM',   nombre: 'Riel Tandem china',         precio: 49706.8 },
  { codigo: 'RIELSLIMCHI',  nombre: 'Riel Slim China',           precio: 55671.62 },
  { codigo: 'SLIMBOXALTO',  nombre: 'Slim Box Alto Madecentro',  precio: 48250 },
  { codigo: 'SLIMBOXBAJO',  nombre: 'Slim Box Bajo Madecentro',  precio: 28700 },
];
