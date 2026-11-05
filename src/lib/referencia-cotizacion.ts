type CotizacionConReferencia = { id:string;codigo?:string|null;cotizador_por?:string;plantilla_cema?:{quoteReference?:string}|null };
/** Misma referencia que las propuestas: CEMA personalizada, código o ID corto. */
export function referenciaCotizacion(cotizacion:CotizacionConReferencia) {
 return (cotizacion.cotizador_por==='CEMA'?cotizacion.plantilla_cema?.quoteReference?.trim():null)||cotizacion.codigo?.trim()||cotizacion.id.slice(0,8).toUpperCase();
}
