export type CemaTemplate = {
  projectAddress: string; quoteReference: string; proposalDate: string; pricingBasis: string;
  validityDays: number; bathrooms: number; countertopAmountUsd: number; leadTimeDays: number;
  depositPercent: number; materialPaymentPercent: number;
  doorColorKitchen: string; doorColorBathroom: string; doorTextureKitchen: string; doorTextureBathroom: string;
  countertopMaterial: string; countertopColor: string; countertopThickness: string;
  kitchenDepth: string; bathroomDepth: string; kitchenBacksplash: string; bathroomBacksplash: string;
  waterfalls: string; tariffNotice: string; additionalTerms: string;
};

export const CEMA_TEMPLATE_DEFAULTS: CemaTemplate = {
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
