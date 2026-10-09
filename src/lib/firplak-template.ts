export type FirplakTemplate = {
  projectAddress: string; proposalDate: string; validityDays: number; deliveryScope: string;
  depositPercent: number; balancePercent: number; leadTimeDays: number;
  upperBoard: string; upperBack: string; upperCase: string; upperDoors: string; upperFillers: string;
  lowerBoard: string; lowerBack: string; lowerCase: string; lowerDoors: string; lowerPanels: string;
  hinges: string; drawerSlides: string; legs: string; shelfSupports: string; handles: string;
  gola: string; liftSystem: string; dishRack: string; toeKick: string; trashBin: string;
  packagingNotes: string; exclusions: string; additionalTerms: string;
  // Texto libre del bloque "Materiales configurados en el proyecto". Antes se
  // rellenaba con un volcado de la configuracion interna del proyecto
  // (`margen`, `unidad`, `perfilId`...), que no es informacion de cliente.
  // Queda vacio y editable, a la espera del contenido definitivo.
  projectMaterials: string;
};

export const FIRPLAK_TEMPLATE_DEFAULTS: FirplakTemplate = {
  projectAddress: '', proposalDate: '', validityDays: 30, deliveryScope: 'Entrega en Colombia',
  depositPercent: 50, balancePercent: 50, leadTimeDays: 90,
  upperBoard: 'Tablero STANDARD', upperBack: 'MDF 5.5 mm, blanco', upperCase: 'Tablero 15 mm, canto 0.45 mm, blanco',
  upperDoors: 'Puerta plana 18 mm, canto 0.45 mm; color y textura por definir', upperFillers: '18 mm',
  lowerBoard: 'Tablero RH', lowerBack: 'Sin espaldar', lowerCase: 'Tablero 15 mm, canto 0.45 mm, blanco',
  lowerDoors: 'Puerta plana 18 mm, canto 0.45 mm; color y textura por definir', lowerPanels: 'Rellenos, paneles y zócalos de 18 mm',
  hinges: 'Bisagra de cierre suave', drawerSlides: 'Corredera de extensión total', legs: 'Patas niveladoras',
  shelfSupports: 'Soportes de entrepaño niquelados', handles: 'N/A', gola: 'Gola melamínica', liftSystem: 'N/A',
  dishRack: 'BONUIT HSO566-02', toeKick: 'N/A', trashBin: 'NO',
  packagingNotes: 'Muebles empacados individualmente y protegidos para transporte. El empaque especial debe acordarse antes de producción.',
  exclusions: 'No incluye instalación, mesones, lavaplatos, grifería, desagüe, iluminación ni electrodomésticos.',
  additionalTerms: '',
  projectMaterials: '',
};

export function normalizarFirplakTemplate(value: Partial<FirplakTemplate> | null | undefined): FirplakTemplate {
  return { ...FIRPLAK_TEMPLATE_DEFAULTS, ...(value ?? {}) };
}

// Proveedores de los tableros que la propuesta nombra, por bloque. El mapeo de
// fila a rol se decidio con el usuario: "Tablero" y "Caja" salen del tablero de
// caja, "Puertas" y "Rellenos" del de frente, y "Espaldar" del de fondo.
export type ProveedoresBloque = { caja: string; frente: string; fondo: string };
export type ProveedoresPropuesta = { superiores: ProveedoresBloque; inferiores: ProveedoresBloque };

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
