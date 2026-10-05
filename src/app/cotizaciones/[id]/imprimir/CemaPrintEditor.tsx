'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarPlantillaCemaAction } from '../../actions';
import type { CemaTemplate } from '@/lib/cema-template';

export type CemaScheduleRow = { sku: string; description: string; quantity: number };
export type CemaProposalData = {
  id: string; projectName: string; preparedFor: string; contact: string; kitchens: number;
  totalUsd: number; template: CemaTemplate; schedule: CemaScheduleRow[];
};

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const dateLabel = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600"><span className="mb-1 block">{label}</span>{children}</label>;
}

function Page({ number, title, subtitle, children }: { number: number; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="cema-page mx-auto mb-6 min-h-[10.2in] max-w-[8.1in] bg-white p-[0.48in] shadow-sm print:mb-0 print:shadow-none">
    <header className="mb-5 flex items-center justify-between text-[9px] font-bold tracking-wide"><span>CEMA USA, INC.</span><span>PROPOSAL</span></header>
    <div className="mb-5 grid grid-cols-[72px_1fr] text-white"><div className="bg-[#65796d] p-3 text-2xl font-bold">{String(number).padStart(2, '0')}</div><div className="bg-[#101615] p-3"><h2 className="text-lg font-bold">{title}</h2><p className="text-xs text-slate-200">{subtitle}</p></div></div>
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

function Proposal({ data }: { data: CemaProposalData }) {
  const t = data.template;
  const countertops = Math.max(0, Number(t.countertopAmountUsd));
  const cabinetry = Math.max(0, data.totalUsd - countertops);
  const category = (pattern: RegExp) => data.schedule.filter((row) => pattern.test(row.sku)).reduce((sum, row) => sum + row.quantity, 0);
  return <div className="cema-document bg-slate-100 py-6 print:bg-white print:py-0">
    <section className="cema-page mx-auto mb-6 min-h-[10.2in] max-w-[8.1in] bg-white p-[0.48in] shadow-sm print:mb-0 print:shadow-none">
      <header className="flex justify-between text-[9px] font-bold"><span>CEMA USA, INC.</span><span>PROPOSAL {t.quoteReference || '—'}</span></header>
      <div className="mt-5 bg-[#101615] px-7 py-8 text-right text-white"><p className="text-xl font-bold">COMMERCIAL PROPOSAL</p><p className="text-sm font-semibold">CABINETRY + COUNTERTOPS</p></div>
      <h1 className="mt-8 max-w-lg text-4xl font-black uppercase leading-tight text-slate-900">{data.projectName}</h1>
      <div className="mt-8 grid grid-cols-3 gap-px bg-slate-200 text-xs">{[
        ['PREPARED FOR', data.preparedFor || '—'], ['PROJECT ADDRESS', t.projectAddress || 'TBD'], ['QUOTE REFERENCE', t.quoteReference || '—'],
        ['PROPOSAL DATE', dateLabel(t.proposalDate)], ['PRICING BASIS', t.pricingBasis], ['VALIDITY', `${t.validityDays} Days`],
      ].map(([label, value]) => <div key={label} className="min-h-20 bg-[#f3f4f1] p-3"><b className="block text-[9px] text-[#65796d]">{label}</b><span className="font-semibold">{value}</span></div>)}</div>
      <div className="mt-10 flex h-72 items-center justify-center bg-gradient-to-br from-[#d9ded8] via-[#f1f2ef] to-[#b5c0b8] text-center text-[#65796d]"><div><p className="text-3xl font-black">CEMA</p><p className="text-sm">Custom cabinetry proposal</p></div></div>
      <div className="mt-5 grid grid-cols-4 bg-[#101615] text-center text-white">{[[data.kitchens,'KITCHENS'],[t.bathrooms,'BATHROOMS'],[money(data.totalUsd),'GRAND TOTAL'],[`${t.leadTimeDays} DAYS`,'STANDARD LEAD TIME']].map(([v,l])=><div key={l} className="border-r border-white/30 p-3"><b className="block text-xl">{v}</b><span className="text-[9px]">{l}</span></div>)}</div>
    </section>

    <Page number={1} title="PROJECT OVERVIEW" subtitle="Scope, pricing and commercial basis">
      <p className="mb-5 text-sm leading-6">CEMA USA, INC. is pleased to submit this commercial proposal for the supply, delivery and installation of custom modern kitchen and bathroom cabinetry with quartz countertops for <b>{data.projectName}</b>.</p>
      <table className="w-full text-sm"><thead className="bg-[#101615] text-white"><tr><th className="p-2 text-left">SCOPE</th><th className="text-left">QUANTITY</th><th className="pr-2 text-right">AMOUNT</th></tr></thead><tbody><tr className="bg-[#eef1ed]"><td className="p-2">Cabinetry</td><td>{data.kitchens} Kitchens / {t.bathrooms} Bathrooms</td><td className="pr-2 text-right">{money(cabinetry)}</td></tr><tr><td className="p-2">Countertops</td><td>Kitchen + Bathroom Scope</td><td className="pr-2 text-right">{money(countertops)}</td></tr><tr className="font-bold"><td className="p-2">TOTAL CONTRACT VALUE</td><td>{t.pricingBasis}</td><td className="pr-2 text-right">{money(data.totalUsd)}</td></tr></tbody></table>
      <h3 className="mt-6 font-bold">COMMERCIAL MILESTONES</h3><div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">{[[`${t.depositPercent}%`,'INITIAL DEPOSIT'],[`${t.leadTimeDays} DAYS`,'LEAD TIME'],[`${t.materialPaymentPercent}%`,'MATERIAL COST'],['MONTHLY','PROGRESS PAY']].map(([v,l])=><div key={l} className="border border-slate-300"><b className="block bg-[#65796d] p-2 text-white">{v}</b><span className="block p-3">{l}</span></div>)}</div>
      {t.tariffNotice && <><h3 className="mt-7 font-bold">TARIFF NOTICE</h3><p className="mt-2 text-xs leading-5">{t.tariffNotice}</p></>}
    </Page>

    <Page number={2} title="CABINETRY STANDARD" subtitle="Project-specific cabinet specification">
      <ul className="list-disc space-y-2 pl-5 text-sm leading-5"><li>Cabinetry manufactured using project-approved CARB 2-compliant boards and finishes.</li><li>Cabinet interiors and exposed faces follow the materials configured in the quotation.</li><li>Doors, fillers, panels and toe kicks use the selected project material and edge banding.</li><li>Adjustable shelves, leveling legs and soft-close hardware are included where configured.</li><li>Final selections remain subject to approved shop drawings and submittals.</li></ul>
      <h3 className="mt-7 font-bold">STANDARD HARDWARE</h3><table className="mt-2 w-full text-xs"><tbody>{[['Drawer system','Metal tandem box / configured rail'],['Hinges','Soft-close concealed'],['Legs','Adjustable plastic legs'],['Shelf supports','Nickel-plated steel']].map(([a,b])=><tr key={a} className="border-b"><td className="bg-[#eef1ed] p-3 font-bold">{a}</td><td className="p-3">{b}</td></tr>)}</tbody></table>
      <div className="mt-8 grid grid-cols-2 gap-6 text-xs"><div><h3 className="font-bold text-[#65796d]">INCLUDED</h3><p className="mt-2 leading-5">Configured cabinetry, panels, fillers, toe kicks, adjustable shelves, leveling legs and selected hardware.</p></div><div><h3 className="font-bold text-[#65796d]">BY OTHERS / EXCLUDED</h3><p className="mt-2 leading-5">Appliances, sinks, faucets, plumbing, electrical work, lighting and items not present in the quotation.</p></div></div>
    </Page>

    <Page number={3} title="CABINET SCHEDULE" subtitle="Detailed SKU quantities included in the proposal">
      <div className="mb-4 grid grid-cols-5 bg-[#65796d] text-center text-white">{[['CABINETS',category(/^[BUVSW]/)],['FILLERS',category(/^F/)],['PANELS',category(/^PN/)],['TOE KICKS',category(/^TK/)],['TOTAL PIECES',data.schedule.reduce((s,r)=>s+r.quantity,0)]].map(([l,v])=><div key={l} className="border-r border-white/30 p-2"><b className="block text-lg">{v}</b><span className="text-[8px]">{l}</span></div>)}</div>
      <table className="w-full text-[10px]"><thead className="bg-[#101615] text-white"><tr><th className="p-2 text-left">SKU</th><th className="text-left">FEATURES</th><th className="pr-2 text-right">QTY</th></tr></thead><tbody>{data.schedule.map((row,i)=><tr key={`${row.sku}-${i}`} className={i%2===0?'bg-[#eef1ed]':''}><td className="p-2 font-bold">{row.sku}</td><td>{row.description}</td><td className="pr-2 text-right">{row.quantity}</td></tr>)}</tbody></table>
    </Page>

    <Page number={4} title="TECHNICAL SPECIFICATIONS" subtitle="Cabinet construction and finish selections">
      <table className="w-full text-xs"><thead className="bg-[#101615] text-white"><tr><th className="p-2 text-left">SELECTION</th><th>KITCHEN</th><th>BATHROOM</th></tr></thead><tbody>{[['Door color',t.doorColorKitchen,t.doorColorBathroom],['Door texture',t.doorTextureKitchen,t.doorTextureBathroom],['Door style','Flat panel','Flat panel'],['Hardware','Per configured modules','Per configured modules']].map((r,i)=><tr key={r[0]} className={i%2===0?'bg-[#eef1ed]':''}>{r.map((v,j)=><td key={j} className="p-3">{v}</td>)}</tr>)}</tbody></table>
      <h3 className="mt-8 font-bold">COUNTERTOP SPECIFICATIONS</h3><table className="mt-2 w-full text-xs"><tbody>{[['Material',t.countertopMaterial],['Color',t.countertopColor],['Thickness',t.countertopThickness],['Kitchen depth',t.kitchenDepth],['Bathroom depth',t.bathroomDepth],['Kitchen backsplash',t.kitchenBacksplash],['Bathroom backsplash',t.bathroomBacksplash],['Edge / Waterfalls',t.waterfalls]].map(([a,b],i)=><tr key={a} className={i%2===0?'bg-[#eef1ed]':''}><td className="p-2 font-bold">{a}</td><td className="p-2">{b}</td></tr>)}</tbody></table>
    </Page>

    <Page number={5} title="TERMS & CONDITIONS" subtitle="Commercial, schedule, installation and warranty provisions">
      <ol className="list-decimal space-y-3 pl-5 text-xs leading-5">{terms.map((term)=><li key={term}>{term}</li>)}</ol>
      {t.additionalTerms && <><h3 className="mt-7 font-bold">ADDITIONAL TERMS</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{t.additionalTerms}</p></>}
      <div className="mt-10 grid grid-cols-[130px_1fr] text-xs">{[['Project',data.projectName],['Address',t.projectAddress||'TBD'],['Quote Reference',t.quoteReference||'—'],['Proposal Date',dateLabel(t.proposalDate)],['Contact',data.contact||'—']].map(([a,b])=><Fragment key={a}><b className="border-b bg-[#eef1ed] p-2">{a}</b><span className="border-b p-2">{b}</span></Fragment>)}</div>
    </Page>
  </div>;
}

export default function CemaPrintEditor({ initialData }: { initialData: CemaProposalData }) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialData.template);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const update = (key: keyof CemaTemplate, value: string | number) => setTemplate((current) => ({ ...current, [key]: value }));
  async function save(print = false) { setSaving(true); setMessage(''); const result = await guardarPlantillaCemaAction(initialData.id, template); setSaving(false); if (!result.ok) { setMessage(result.error ?? 'Error'); return; } setMessage('Plantilla guardada'); if (print) window.print(); }
  function goBack() {
    if (document.referrer.includes(`/cotizaciones/${initialData.id}`)) router.back();
    else router.push(`/cotizaciones/${initialData.id}`);
  }
  const textFields: Array<[keyof CemaTemplate,string]> = [['projectAddress','Dirección del proyecto'],['quoteReference','Referencia'],['pricingBasis','Base del precio'],['doorColorKitchen','Color puertas cocina'],['doorColorBathroom','Color puertas baño'],['doorTextureKitchen','Textura cocina'],['doorTextureBathroom','Textura baño'],['countertopMaterial','Material mesón'],['countertopColor','Color mesón'],['countertopThickness','Espesor mesón'],['kitchenDepth','Profundidad cocina'],['bathroomDepth','Profundidad baño'],['kitchenBacksplash','Salpicadero cocina'],['bathroomBacksplash','Salpicadero baño'],['waterfalls','Bordes / waterfalls']];
  return <><aside className="no-print sticky top-0 z-20 border-b bg-white p-4 shadow"><div className="mx-auto max-w-6xl"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h1 className="font-bold">Plantilla CEMA</h1><p className="text-xs text-slate-500">Los datos del proyecto y módulos se cargan automáticamente. Completa o ajusta los datos comerciales.</p></div><div className="flex gap-2"><button type="button" onClick={goBack} className="rounded border px-3 py-2 text-sm">Volver</button><button disabled={saving} onClick={()=>save(false)} className="rounded border border-slate-900 px-3 py-2 text-sm font-semibold">Guardar</button><button disabled={saving} onClick={()=>save(true)} className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Guardar e imprimir / PDF</button></div></div>
    <details><summary className="cursor-pointer text-sm font-semibold text-[#65796d]">Editar información de la propuesta</summary><div className="mt-3 grid gap-3 md:grid-cols-3">{textFields.map(([key,label])=><Field key={key} label={label}><input value={String(template[key])} onChange={e=>update(key,e.target.value)} className="w-full rounded border px-2 py-1.5 font-normal" /></Field>)}<Field label="Fecha propuesta"><input type="date" value={template.proposalDate} onChange={e=>update('proposalDate',e.target.value)} className="w-full rounded border px-2 py-1.5 font-normal" /></Field>{([['validityDays','Vigencia (días)'],['bathrooms','Cantidad baños'],['countertopAmountUsd','Valor mesones USD'],['leadTimeDays','Plazo (días)'],['depositPercent','Depósito (%)'],['materialPaymentPercent','Pago materiales (%)']] as Array<[keyof CemaTemplate,string]>).map(([key,label])=><Field key={key} label={label}><input type="number" min="0" value={Number(template[key])} onChange={e=>update(key,Number(e.target.value))} className="w-full rounded border px-2 py-1.5 font-normal" /></Field>)}<Field label="Aviso arancelario"><textarea value={template.tariffNotice} onChange={e=>update('tariffNotice',e.target.value)} className="h-20 w-full rounded border px-2 py-1.5 font-normal" /></Field><Field label="Condiciones adicionales"><textarea value={template.additionalTerms} onChange={e=>update('additionalTerms',e.target.value)} className="h-20 w-full rounded border px-2 py-1.5 font-normal" /></Field></div></details>{message&&<p className="mt-2 text-sm text-emerald-700">{message}</p>}</div></aside><Proposal data={{...initialData,template}} /><style>{`@media print{.no-print{display:none!important}.cema-page{page-break-after:always;width:8.1in;min-height:10.2in;margin:0;box-shadow:none}.cema-page:last-child{page-break-after:auto}@page{size:letter;margin:.2in}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style></>;
}
