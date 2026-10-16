export type FirplakTemplate = {
  projectAddress: string; proposalDate: string; validityDays: number; deliveryScope: string;
  depositPercent: number; balancePercent: number; leadTimeDays: number;
  upperBoard: string; upperBack: string; upperCase: string; upperDoors: string; upperFillers: string;
  lowerBoard: string; lowerBack: string; lowerCase: string; lowerDoors: string; lowerPanels: string;
  // Closet/walk in closet y banos/auxiliares. Sus tablas solo salen en la
  // propuesta cuando el proyecto configuro esas familias.
  closetBoard: string; closetBack: string; closetCase: string; closetDoors: string; closetPanels: string;
  bathBoard: string; bathBack: string; bathCase: string; bathDoors: string; bathPanels: string;
  packagingNotes: string; exclusions: string; additionalTerms: string;
};

export const FIRPLAK_TEMPLATE_DEFAULTS: FirplakTemplate = {
  projectAddress: '', proposalDate: '', validityDays: 30, deliveryScope: 'Entrega en Colombia',
  depositPercent: 50, balancePercent: 50, leadTimeDays: 90,
  upperBoard: 'Tablero STANDARD', upperBack: 'MDF 5.5 mm, blanco', upperCase: 'Tablero 15 mm, canto 0.45 mm, blanco',
  upperDoors: 'Puerta plana 18 mm, canto 0.45 mm; color y textura por definir', upperFillers: '18 mm',
  lowerBoard: 'Tablero RH', lowerBack: 'Sin espaldar', lowerCase: 'Tablero 15 mm, canto 0.45 mm, blanco',
  lowerDoors: 'Puerta plana 18 mm, canto 0.45 mm; color y textura por definir', lowerPanels: 'Rellenos, paneles y zócalos de 18 mm',
  closetBoard: 'Tablero STANDARD', closetBack: 'MDF 5.5 mm, blanco', closetCase: 'Tablero 15 mm, canto 0.45 mm, blanco',
  closetDoors: 'Puerta plana 18 mm, canto 0.45 mm; color y textura por definir', closetPanels: 'Entrepaños, barras y divisiones de 18 mm',
  bathBoard: 'Tablero RH', bathBack: 'MDF 5.5 mm, blanco', bathCase: 'Tablero 15 mm, canto 0.45 mm, blanco',
  bathDoors: 'Puerta plana 18 mm, canto 0.45 mm; color y textura por definir', bathPanels: 'Rellenos, paneles y zócalos de 18 mm',
  packagingNotes: 'Muebles empacados individualmente y protegidos para transporte. El empaque especial debe acordarse antes de producción.',
  exclusions: 'No incluye instalación, mesones, lavaplatos, grifería, desagüe, iluminación ni electrodomésticos.',
  additionalTerms: '',
};

/**
 * Completa lo que falte con el valor por defecto y **descarta lo que ya no existe**.
 *
 * Las plantillas guardadas hace meses traen campos que la propuesta retiro —los
 * textos fijos de herrajes, el bloque de materiales del proyecto—. Copiarlos tal
 * cual los iba acumulando en la base para siempre; quedarse solo con las llaves
 * conocidas los deja ir en el proximo guardado, sin necesidad de migracion.
 */
export function normalizarFirplakTemplate(value: Partial<FirplakTemplate> | null | undefined): FirplakTemplate {
  const guardado = (value ?? {}) as Record<string, unknown>;
  const salida = { ...FIRPLAK_TEMPLATE_DEFAULTS } as Record<string, unknown>;
  for (const llave of Object.keys(FIRPLAK_TEMPLATE_DEFAULTS)) {
    if (guardado[llave] !== undefined) salida[llave] = guardado[llave];
  }
  return salida as FirplakTemplate;
}

// Proveedores de los tableros que la propuesta nombra, por bloque. El mapeo de
// fila a rol se decidio con el usuario: "Tablero" y "Caja" salen del tablero de
// caja, "Puertas" y "Rellenos" del de frente, y "Espaldar" del de fondo.
export type ProveedoresBloque = { caja: string; frente: string; fondo: string };
/**
 * Proveedores por familia. `closet` y `banos` son **opcionales a proposito**: su
 * presencia es lo que decide si la propuesta imprime esas tablas. Un proyecto de
 * cocina sola no las lleva, y no tendria sentido mostrarlas vacias.
 */
export type ProveedoresPropuesta = {
  superiores: ProveedoresBloque;
  inferiores: ProveedoresBloque;
  closet?: ProveedoresBloque;
  banos?: ProveedoresBloque;
};

export const PROVEEDORES_VACIOS: ProveedoresPropuesta = {
  superiores: { caja: '', frente: '', fondo: '' },
  inferiores: { caja: '', frente: '', fondo: '' },
};

// Añade el proveedor al final del texto de una fila. Si no hay proveedor
// registrado, el texto se devuelve intacto en lugar de dejar un separador
// huérfano.
export function conProveedor(valor: string, proveedor: string | null | undefined): string {
  const p = String(proveedor ?? '').trim();
  const v = String(valor ?? '').trim();
  if (!p) return v;
  return v ? `${v} · ${p}` : p;
}

// Redaccion de la forma de pago. Vive aqui porque la propuesta la repite en dos
// sitios —el recuadro del resumen y la lista de terminos— y escribirla dos veces
// invita a que acaben diciendo cosas distintas.
export function formaDePago(anticipoPct: number, saldoPct: number): string {
  return `${anticipoPct}% de anticipo y ${saldoPct}% antes del despacho`;
}

export type MonedaPropuesta = 'USD' | 'COP';

/**
 * Importe de la propuesta en la moneda de la cotizacion.
 *
 * Si el proyecto se cotiza en COP, imprimir dolares obliga al cliente a convertir
 * y no es lo que se le cotizo. El valor en pesos sale de la linea, no de aplicar
 * la TRM al valor en dolares: eso redondearia dos veces.
 */
export function importePropuesta(moneda: MonedaPropuesta, usd: number, cop: number): number {
  return moneda === 'COP' ? cop : usd;
}

export function formatearImporte(moneda: MonedaPropuesta, valor: number): string {
  return moneda === 'COP'
    ? Number(valor).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    : Number(valor).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
