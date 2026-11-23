const TEXTOS_CEMA_ES = {
  pricingBasis: 'Entregado e instalado',
  doorColorKitchen: 'Por definir',
  doorColorBathroom: 'Por definir',
  doorTextureKitchen: 'Por definir',
  doorTextureBathroom: 'Por definir',
  countertopMaterial: 'Cuarzo',
  countertopColor: 'Blanco',
  countertopThickness: '3/4 pulg.',
  kitchenDepth: '25 1/2 pulg.',
  bathroomDepth: '22 1/2 pulg.',
  kitchenBacksplash: '4 pulg.',
  bathroomBacksplash: '4 pulg.',
  waterfalls: 'Según los planos aprobados',
  tariffNotice: '',
  additionalTerms: '',
};

export type CampoCemaTraducible = keyof typeof TEXTOS_CEMA_ES;

export function esCampoCemaTraducible(campo: string): campo is CampoCemaTraducible {
  return Object.hasOwn(TEXTOS_CEMA_ES, campo);
}

export type CemaTemplate = {
  showModuleSchedule: boolean;
  projectAddress: string; quoteReference: string; proposalDate: string; pricingBasis: string;
  validityDays: number; bathrooms: number; countertopAmountUsd: number; leadTimeDays: number;
  depositPercent: number; materialPaymentPercent: number;
  doorColorKitchen: string; doorColorBathroom: string; doorTextureKitchen: string; doorTextureBathroom: string;
  countertopMaterial: string; countertopColor: string; countertopThickness: string;
  kitchenDepth: string; bathroomDepth: string; kitchenBacksplash: string; bathroomBacksplash: string;
  waterfalls: string; tariffNotice: string; additionalTerms: string;
  textosEs?: Partial<Record<CampoCemaTraducible, string>>;
};

export const CEMA_TEMPLATE_DEFAULTS: CemaTemplate = {
  showModuleSchedule: true,
  projectAddress: '', quoteReference: '', proposalDate: '', pricingBasis: 'Delivered & Installed',
  validityDays: 30, bathrooms: 0, countertopAmountUsd: 0, leadTimeDays: 90,
  depositPercent: 50, materialPaymentPercent: 100,
  doorColorKitchen: 'TBD', doorColorBathroom: 'TBD', doorTextureKitchen: 'TBD', doorTextureBathroom: 'TBD',
  countertopMaterial: 'Quartz', countertopColor: 'White', countertopThickness: '3/4 in.',
  kitchenDepth: '25 1/2 in.', bathroomDepth: '22 1/2 in.', kitchenBacksplash: '4 in.', bathroomBacksplash: '4 in.',
  waterfalls: 'As shown in approved drawings', tariffNotice: '', additionalTerms: '',
};

export function normalizarCemaTemplate(value: Partial<CemaTemplate> | null | undefined): CemaTemplate {
  return { ...CEMA_TEMPLATE_DEFAULTS, ...(value ?? {}) };
}

export function textoCema(plantilla: CemaTemplate, campo: CampoCemaTraducible, idioma: 'es' | 'en'): string {
  if (idioma === 'en') return plantilla[campo];
  const guardado = plantilla.textosEs?.[campo];
  if (typeof guardado === 'string') return guardado;
  if (campo === 'additionalTerms' || campo === 'tariffNotice' || plantilla[campo] === CEMA_TEMPLATE_DEFAULTS[campo]) {
    return TEXTOS_CEMA_ES[campo];
  }
  return plantilla[campo].replace(/\bin\.$/u, 'pulg.');
}
