export type FirplakTemplate = {
  projectAddress: string; proposalDate: string; validityDays: number; deliveryScope: string;
  depositPercent: number; balancePercent: number; leadTimeDays: number;
  upperBoard: string; upperBack: string; upperCase: string; upperDoors: string; upperFillers: string;
  lowerBoard: string; lowerBack: string; lowerCase: string; lowerDoors: string; lowerPanels: string;
  hinges: string; drawerSlides: string; legs: string; shelfSupports: string; handles: string;
  gola: string; liftSystem: string; dishRack: string; toeKick: string; trashBin: string;
  packagingNotes: string; exclusions: string; additionalTerms: string;
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
};

export function normalizarFirplakTemplate(value: Partial<FirplakTemplate> | null | undefined): FirplakTemplate {
  return { ...FIRPLAK_TEMPLATE_DEFAULTS, ...(value ?? {}) };
}
