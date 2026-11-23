'use client';
import PrintDocumentTitle from './PrintDocumentTitle';
import { EntregaPdf, HerrajesOtrosPdf, MesonesPdf, MaterialesProyectoPdf, type ParcialPdf } from './DetallesProyecto';
import type { AdicionalPropuesta, MesonPropuesta } from '@/lib/propuesta-cotizacion';
import type { EspecificacionProyecto } from '@/lib/materiales-proyecto';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarPlantillaCemaAction } from '../../actions';
import { esCampoCemaTraducible, textoCema, type CemaTemplate } from '@/lib/cema-template';

export type CemaScheduleRow = { sku: string; description: string; quantity: number };
export type CemaProposalData = {
  logistica: number | null;
  entregasParciales?: ParcialPdf[];
  incluyeDdp: boolean;
  recargoEntregaUsd: number;
  id: string; projectName: string; preparedFor: string; contact: string; kitchens: number;
  adicionales: AdicionalPropuesta[]; mesones?: MesonPropuesta[]; materiales: EspecificacionProyecto[]; totalUsd: number; template: CemaTemplate; schedule: CemaScheduleRow[]; idioma?: 'es' | 'en';
};


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600"><span className="mb-1 block">{label}</span>{children}</label>;
}

function Page({ number, title, subtitle, idioma, children }: { number: number; title: string; subtitle?: string; idioma: 'es' | 'en'; children: React.ReactNode }) {
  return <section className="cema-page mx-auto mb-6 min-h-[10.2in] max-w-[8.1in] bg-white p-[0.48in] shadow-sm print:mb-0 print:shadow-none">
    <header className="mb-5 flex items-center justify-between text-[9px] font-bold tracking-wide"><span>CEMA USA, INC.</span><span>{idioma === 'es' ? 'PROPUESTA' : 'PROPOSAL'}</span></header>
    <div className="mb-5 grid grid-cols-[72px_1fr] text-white"><div className="bg-[#65796d] p-3 text-2xl font-bold">{String(number).padStart(2, '0')}</div><div className="bg-[#101615] p-3"><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="text-xs text-slate-200">{subtitle}</p>}</div></div>
    {children}
  </section>;
}

const terms = [
  'Pricing is based on the current plans, quantities, materials and selections. Changes require a written change order.',
  'Final pricing and fabrication are governed by contractor-approved shop drawings, finish samples and hardware selections.',
  'The client must designate one point of contact and provide final written approvals before production begins.',
  'Delivery and installation assume clear site access, accurate field dimensions and secure, dry on-site storage.',
  'Electrical, plumbing, appliances, fixtures, final cleaning and work by other trades are excluded unless stated otherwise.',
  'Standard manufacturer warranties apply. Damage from misuse, moisture, handling by others or site conditions is excluded.',
  'This is not a final quote and prices may change as negotiations, quantities or selections progress.',
];

const terminos = [
  'Los precios se basan en los planos, las cantidades, los materiales y las selecciones vigentes. Los cambios requieren una orden de cambio por escrito.',
  'Los precios finales y la fabricación se rigen por los planos de taller, las muestras de acabado y la selección de herrajes aprobados por el contratista.',
  'El cliente debe designar un punto de contacto y emitir las aprobaciones finales por escrito antes de iniciar la producción.',
  'La entrega y la instalación requieren acceso despejado, medidas de obra precisas y almacenamiento seguro y seco en el sitio.',
  'Se excluyen los trabajos eléctricos y de plomería, los electrodomésticos, los accesorios, la limpieza final y los trabajos de otros contratistas, salvo indicación expresa.',
  'Se aplican las garantías estándar del fabricante. Se excluyen los daños por uso indebido, humedad, manipulación por terceros o condiciones del sitio.',
  'Esta cotización es preliminar. Los precios pueden cambiar según las negociaciones, las cantidades o las selecciones.',
];

function CemaProposal({ data, onScheduleChange }: { data: CemaProposalData; onScheduleChange: (visible: boolean) => void }) {
  const t = data.template;
  const idioma = data.idioma ?? 'es';
  const tx = (es: string, en: string) => idioma === 'es' ? es : en;
  const locale = tx('es-CO', 'en-US');
  const money = (value: number) => value.toLocaleString(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  const dateLabel = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : tx('Por definir', 'TBD');
  const texto = (campo: Parameters<typeof textoCema>[1]) => textoCema(t, campo, idioma);
  const countertops = data.mesones?.length ? data.mesones.reduce((s, m) => s + m.totalUsd, 0) : Math.max(0, Number(t.countertopAmountUsd));
  const cabinetry = Math.max(0, data.totalUsd - data.recargoEntregaUsd - countertops - data.adicionales.reduce((sum, fila) => sum + fila.totalUsd, 0));
  const category = (pattern: RegExp) => data.schedule.filter((row) => pattern.test(row.sku)).reduce((sum, row) => sum + row.quantity, 0);
  return <div lang={idioma} className="cema-document bg-slate-100 py-6 print:bg-white print:py-0">
    <section className="cema-page mx-auto mb-6 min-h-[10.2in] max-w-[8.1in] bg-white p-[0.48in] shadow-sm print:mb-0 print:shadow-none">
      <header className="flex justify-between text-[9px] font-bold"><span>CEMA USA, INC.</span><span>{tx('PROPUESTA', 'PROPOSAL')} {t.quoteReference || '—'}</span></header>
      <div className="mt-5 bg-[#101615] px-7 py-8 text-right text-white"><p className="text-xl font-bold">{tx("PROPUESTA COMERCIAL", "COMMERCIAL PROPOSAL")}</p><p className="text-sm font-semibold">{tx("MUEBLES Y MESONES", "CABINETRY + COUNTERTOPS")}</p></div>
      <h1 className="mt-8 max-w-lg text-4xl font-black uppercase leading-tight text-slate-900">{data.projectName}</h1>
      <div className="mt-8 grid grid-cols-3 gap-px bg-slate-200 text-xs">{[
        [tx('PREPARADO PARA', 'PREPARED FOR'), data.preparedFor || '—'], [tx('DIRECCIÓN DEL PROYECTO', 'PROJECT ADDRESS'), t.projectAddress || tx('Por definir', 'TBD')], [tx('REFERENCIA', 'QUOTE REFERENCE'), t.quoteReference || '—'],
        [tx('FECHA DE PROPUESTA', 'PROPOSAL DATE'), dateLabel(t.proposalDate)], [tx('BASE DEL PRECIO', 'PRICING BASIS'), texto('pricingBasis')], [tx('VIGENCIA', 'VALIDITY'), `${t.validityDays} ${tx('días', 'days')}`],
      ].map(([label, value]) => <div key={label} className="min-h-20 bg-[#f3f4f1] p-3"><b className="block text-[9px] text-[#65796d]">{label}</b><span className="font-semibold">{value}</span></div>)}</div>
      <div className="mt-10 flex h-72 items-center justify-center bg-gradient-to-br from-[#d9ded8] via-[#f1f2ef] to-[#b5c0b8] text-center text-[#65796d]"><div><p className="text-3xl font-black">CEMA</p><p className="text-sm">{tx("Propuesta de muebles a medida", "Custom cabinetry proposal")}</p></div></div>
      <div className="mt-5 grid grid-cols-4 bg-[#101615] text-center text-white">{[[data.kitchens,tx('COCINAS', 'KITCHENS')],[t.bathrooms,tx('BAÑOS', 'BATHROOMS')],[money(data.totalUsd),tx('TOTAL GENERAL', 'GRAND TOTAL')],[`${t.leadTimeDays} ${tx('DÍAS', 'DAYS')}`,tx('PLAZO ESTÁNDAR', 'STANDARD LEAD TIME')]].map(([v,l])=><div key={l} className="border-r border-white/30 p-3"><b className="block text-xl">{v}</b><span className="text-[9px]">{l}</span></div>)}</div>
    </section>

    <Page idioma={idioma} number={1} title={tx('RESUMEN DEL PROYECTO', 'PROJECT OVERVIEW')} subtitle={tx('Alcance, precios y base comercial', 'Scope, pricing and commercial basis')}>
      {data.incluyeDdp && <p className="mb-2 text-xs text-slate-600">{tx('El total incluye DDP.', 'The total includes DDP.')}</p>}
      <p className="mb-5 text-sm leading-6">{tx('CEMA USA, INC. presenta esta propuesta comercial para el suministro, la entrega y la instalación de muebles a medida para cocinas y baños en', 'CEMA USA, INC. is pleased to submit this commercial proposal for the supply, delivery and installation of custom modern kitchen and bathroom cabinetry for')} <b>{data.projectName}</b>.</p>
      <table className="w-full text-sm"><thead className="bg-[#101615] text-white"><tr><th className="p-2 text-left">{tx("ALCANCE", "SCOPE")}</th><th className="text-left">{tx("CANTIDAD", "QUANTITY")}</th><th className="pr-2 text-right">{tx("VALOR", "AMOUNT")}</th></tr></thead><tbody><tr className="bg-[#eef1ed]"><td className="p-2">{tx("Muebles", "Cabinetry")}</td><td>{data.kitchens} {tx('cocinas', 'kitchens')} / {t.bathrooms} {tx('baños', 'bathrooms')}</td><td className="pr-2 text-right">{money(cabinetry)}</td></tr><tr><td className="p-2">{tx("Mesones", "Countertops")}</td><td>{tx("Cocinas y baños", "Kitchen + Bathroom Scope")}</td><td className="pr-2 text-right">{money(countertops)}</td></tr><tr className="font-bold"><td className="p-2">{tx("VALOR TOTAL DEL CONTRATO", "TOTAL CONTRACT VALUE")}</td><td>{texto('pricingBasis')}</td><td className="pr-2 text-right">{money(data.totalUsd)}</td></tr></tbody></table>
      <h3 className="mt-6 font-bold">{tx("HITOS COMERCIALES", "COMMERCIAL MILESTONES")}</h3><div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">{[[`${t.depositPercent}%`,tx('ANTICIPO', 'INITIAL DEPOSIT')],[`${t.leadTimeDays} ${tx('DÍAS', 'DAYS')}`,tx('PLAZO', 'LEAD TIME')],[`${t.materialPaymentPercent}%`,tx('COSTO DE MATERIALES', 'MATERIAL COST')],[tx('MENSUAL', 'MONTHLY'),tx('PAGO POR AVANCE', 'PROGRESS PAY')]].map(([v,l])=><div key={l} className="border border-slate-300"><b className="block bg-[#65796d] p-2 text-white">{v}</b><span className="block p-3">{l}</span></div>)}</div>
      {texto('tariffNotice') && <><h3 className="mt-7 font-bold">{tx("AVISO ARANCELARIO", "TARIFF NOTICE")}</h3><p className="mt-2 text-xs leading-5">{texto('tariffNotice')}</p></>}
    </Page>

    <Page idioma={idioma} number={2} title={tx('ESTÁNDAR DE MUEBLES', 'CABINETRY STANDARD')} subtitle={tx('Especificaciones de muebles del proyecto', 'Project-specific cabinet specification')}>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-5"><li>{tx("Los muebles se fabrican con tableros y acabados aprobados para el proyecto que cumplen CARB 2.", "Cabinetry manufactured using project-approved CARB 2-compliant boards and finishes.")}</li><li>{tx("Los interiores y las caras visibles usan los materiales configurados en la cotización.", "Cabinet interiors and exposed faces follow the materials configured in the quotation.")}</li><li>{tx("Las puertas, los fillers, los paneles y los zócalos usan el material y el canto seleccionados.", "Doors, fillers, panels and toe kicks use the selected project material and edge banding.")}</li><li>{tx("Se incluyen entrepaños ajustables, patas niveladoras y herrajes de cierre suave donde se configuraron.", "Adjustable shelves, leveling legs and soft-close hardware are included where configured.")}</li><li>{tx("Las selecciones finales están sujetas a la aprobación de los planos de taller y la documentación técnica.", "Final selections remain subject to approved shop drawings and submittals.")}</li></ul>
      <HerrajesOtrosPdf filas={data.adicionales} moneda="USD" idioma={idioma} />
      <div className="mt-8 grid grid-cols-2 gap-6 text-xs"><div><h3 className="font-bold text-[#65796d]">{tx("INCLUIDO", "INCLUDED")}</h3><p className="mt-2 leading-5">{tx("Muebles, paneles, fillers, zócalos, entrepaños ajustables, patas niveladoras y herrajes seleccionados según la configuración.", "Configured cabinetry, panels, fillers, toe kicks, adjustable shelves, leveling legs and selected hardware.")}</p></div><div><h3 className="font-bold text-[#65796d]">{tx("A CARGO DE TERCEROS / EXCLUIDO", "BY OTHERS / EXCLUDED")}</h3><p className="mt-2 leading-5">{tx("Electrodomésticos, lavaplatos, grifería, plomería, instalaciones eléctricas, iluminación y artículos ajenos a la cotización.", "Appliances, sinks, faucets, plumbing, electrical work, lighting and items not present in the quotation.")}</p></div></div>
    </Page>

    <div className="no-print mx-auto mb-4 max-w-[8.1in] rounded border bg-white p-3"><label className="flex cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" role="switch" checked={t.showModuleSchedule} onChange={e=>onScheduleChange(e.target.checked)} />{tx('Mostrar programación de muebles en el PDF', 'Show cabinet schedule in the PDF')}</label></div>
    {t.showModuleSchedule && <Page idioma={idioma} number={3} title={tx('PROGRAMACIÓN DE MUEBLES', 'CABINET SCHEDULE')} subtitle={tx('Cantidades por referencia incluidas en la propuesta', 'Detailed SKU quantities included in the proposal')}>
      <div className="mb-4 grid grid-cols-5 bg-[#65796d] text-center text-white">{[[tx('MUEBLES', 'CABINETS'),category(/^[BUVSW]/)],[tx('FILLERS', 'FILLERS'),category(/^F/)],[tx('PANELES', 'PANELS'),category(/^PN/)],[tx('ZÓCALOS', 'TOE KICKS'),category(/^TK/)],[tx('TOTAL DE PIEZAS', 'TOTAL PIECES'),data.schedule.reduce((s,r)=>s+r.quantity,0)]].map(([l,v])=><div key={l} className="border-r border-white/30 p-2"><b className="block text-lg">{v}</b><span className="text-[8px]">{l}</span></div>)}</div>
      <table className="w-full text-[10px]"><thead className="bg-[#101615] text-white"><tr><th className="p-2 text-left">SKU</th><th className="text-left">{tx("CARACTERÍSTICAS", "FEATURES")}</th><th className="pr-2 text-right">{tx("CANT.", "QTY")}</th></tr></thead><tbody>{data.schedule.map((row,i)=><tr key={`${row.sku}-${i}`} className={i%2===0?'bg-[#eef1ed]':''}><td className="p-2 font-bold">{row.sku}</td><td>{row.description}</td><td className="pr-2 text-right">{row.quantity}</td></tr>)}</tbody></table>
    </Page>}

    <Page idioma={idioma} number={t.showModuleSchedule ? 4 : 3} title={tx('ESPECIFICACIONES TÉCNICAS', 'TECHNICAL SPECIFICATIONS')} subtitle={tx('Construcción y acabados de los muebles', 'Cabinet construction and finish selections')}>
      <MaterialesProyectoPdf bloques={data.materiales} />
      {data.mesones?.length ? <MesonesPdf filas={data.mesones} moneda="USD" idioma={idioma} /> : <><h3 className="mt-8 font-bold">{tx("ESPECIFICACIONES DE MESONES", "COUNTERTOP SPECIFICATIONS")}</h3><table className="mt-2 w-full text-xs"><tbody>{[['Material',texto('countertopMaterial')],['Color',texto('countertopColor')],[tx('Espesor', 'Thickness'),texto('countertopThickness')],[tx('Profundidad de cocina', 'Kitchen depth'),texto('kitchenDepth')],[tx('Profundidad de baño', 'Bathroom depth'),texto('bathroomDepth')],[tx('Salpicadero de cocina', 'Kitchen backsplash'),texto('kitchenBacksplash')],[tx('Salpicadero de baño', 'Bathroom backsplash'),texto('bathroomBacksplash')],[tx('Bordes y caídas laterales', 'Edge / Waterfalls'),texto('waterfalls')]].map(([a,b],i)=><tr key={a} className={i%2===0?'bg-[#eef1ed]':''}><td className="p-2 font-bold">{a}</td><td className="p-2">{b}</td></tr>)}</tbody></table></>}
    </Page>

    <Page idioma={idioma} number={t.showModuleSchedule ? 5 : 4} title={tx('ENTREGA', 'DELIVERY')}>
      <EntregaPdf contenedores={data.logistica} parciales={data.entregasParciales} idioma={idioma} />
    </Page>

    <Page idioma={idioma} number={t.showModuleSchedule ? 6 : 5} title={tx('TÉRMINOS Y CONDICIONES', 'TERMS & CONDITIONS')} subtitle={tx('Condiciones comerciales, de plazos, instalación y garantía', 'Commercial, schedule, installation and warranty provisions')}>
      <ol className="list-decimal space-y-3 pl-5 text-xs leading-5">{(idioma === 'es' ? terminos : terms).map((term)=><li key={term}>{term}</li>)}</ol>
      {texto('additionalTerms') && <><h3 className="mt-7 font-bold">{tx("CONDICIONES ADICIONALES", "ADDITIONAL TERMS")}</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{texto('additionalTerms')}</p></>}
      <div className="mt-10 grid grid-cols-[130px_1fr] text-xs">{[[tx('Proyecto', 'Project'),data.projectName],[tx('Dirección', 'Address'),t.projectAddress || tx('Por definir', 'TBD')],[tx('Referencia', 'Quote Reference'),t.quoteReference||'—'],[tx('Fecha de propuesta', 'Proposal Date'),dateLabel(t.proposalDate)],[tx('Contacto', 'Contact'),data.contact||'—']].map(([a,b])=><Fragment key={a}><b className="border-b bg-[#eef1ed] p-2">{a}</b><span className="border-b p-2">{b}</span></Fragment>)}</div>
    </Page>
  </div>;
}

export default function CemaPrintEditor({ initialData }: { initialData: CemaProposalData }) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialData.template);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const idioma = initialData.idioma ?? 'es';
  const valor = (key: keyof CemaTemplate) => esCampoCemaTraducible(key) ? textoCema(template, key, idioma) : template[key];
  const update = (key: keyof CemaTemplate, value: string | number | boolean) => setTemplate((current) =>
    idioma === 'es' && esCampoCemaTraducible(key)
      ? { ...current, textosEs: { ...current.textosEs, [key]: String(value) } }
      : { ...current, [key]: value }
  );
  async function save(print = false) { setSaving(true); setMessage(''); const result = await guardarPlantillaCemaAction(initialData.id, template); setSaving(false); if (!result.ok) { setMessage(result.error ?? 'Error'); return; } setMessage('Plantilla guardada'); if (print) window.print(); }
  function goBack() {
    if (document.referrer.includes(`/cotizaciones/${initialData.id}`)) router.back();
    else router.push(`/cotizaciones/${initialData.id}`);
  }
  const textFields: Array<[keyof CemaTemplate,string]> = [['projectAddress','Dirección del proyecto'],['quoteReference','Referencia'],['pricingBasis','Base del precio'],['doorColorKitchen','Color puertas cocina'],['doorColorBathroom','Color puertas baño'],['doorTextureKitchen','Textura cocina'],['doorTextureBathroom','Textura baño'],['countertopMaterial','Material mesón'],['countertopColor','Color mesón'],['countertopThickness','Espesor mesón'],['kitchenDepth','Profundidad cocina'],['bathroomDepth','Profundidad baño'],['kitchenBacksplash','Salpicadero cocina'],['bathroomBacksplash','Salpicadero baño'],['waterfalls','Bordes / waterfalls']];
  return <><PrintDocumentTitle projectName={initialData.projectName} idioma={initialData.idioma} /><aside className="no-print sticky top-0 z-20 border-b bg-white p-4 shadow"><div className="mx-auto max-w-6xl"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h1 className="font-bold">Plantilla CEMA · {idioma === 'es' ? 'Español' : 'English'}</h1><p className="text-xs text-slate-500">Los datos del proyecto y módulos se cargan automáticamente. Completa o ajusta los datos comerciales.</p></div><div className="flex gap-2"><button type="button" onClick={goBack} className="rounded border px-3 py-2 text-sm">Volver</button><button disabled={saving} onClick={()=>save(false)} className="rounded border border-slate-900 px-3 py-2 text-sm font-semibold">Guardar</button><button disabled={saving} onClick={()=>save(true)} className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">{idioma === 'es' ? 'Guardar e imprimir / PDF' : 'Save and print / PDF'}</button></div></div>
    <details><summary className="cursor-pointer text-sm font-semibold text-[#65796d]">Editar información de la propuesta</summary><div className="mt-3 grid gap-3 md:grid-cols-3">{textFields.map(([key,label])=><Field key={key} label={label}><input value={String(valor(key))} onChange={e=>update(key,e.target.value)} className="w-full rounded border px-2 py-1.5 font-normal" /></Field>)}<Field label="Fecha propuesta"><input type="date" value={template.proposalDate} onChange={e=>update('proposalDate',e.target.value)} className="w-full rounded border px-2 py-1.5 font-normal" /></Field>{([['validityDays','Vigencia (días)'],['bathrooms','Cantidad baños'],['countertopAmountUsd','Valor mesones USD'],['leadTimeDays','Plazo (días)'],['depositPercent','Depósito (%)'],['materialPaymentPercent','Pago materiales (%)']] as Array<[keyof CemaTemplate,string]>).map(([key,label])=><Field key={key} label={label}><input type="number" min="0" value={Number(template[key])} onChange={e=>update(key,Number(e.target.value))} className="w-full rounded border px-2 py-1.5 font-normal" /></Field>)}<Field label="Aviso arancelario"><textarea value={textoCema(template, 'tariffNotice', idioma)} onChange={e=>update('tariffNotice',e.target.value)} className="h-20 w-full rounded border px-2 py-1.5 font-normal" /></Field><Field label="Condiciones adicionales"><textarea value={textoCema(template, 'additionalTerms', idioma)} onChange={e=>update('additionalTerms',e.target.value)} className="h-20 w-full rounded border px-2 py-1.5 font-normal" /></Field></div></details>{message&&<p className="mt-2 text-sm text-emerald-700">{message}</p>}</div></aside><CemaProposal data={{...initialData,template}} onScheduleChange={visible=>update('showModuleSchedule',visible)} /><style>{`@media print{.no-print{display:none!important}.cema-page{page-break-after:always;width:8.1in;min-height:10.2in;margin:0;box-shadow:none}.cema-page:last-child{page-break-after:auto}@page{size:letter;margin:.2in}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style></>;
}
