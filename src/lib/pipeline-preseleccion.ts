export const CLAVE_PRESELECCION_PIPELINE = 'cotizador.pipeline.preseleccion.v1';
export type PreseleccionPipeline = { pipelineId:string; cliente:string; pais:string; ciudad:string; nombre_proyecto:string };
export function leerPreseleccionPipeline(raw: string | null): PreseleccionPipeline | null {
  try {
    const v=JSON.parse(raw??'null');
    if(!v || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(v.pipelineId))return null;
    const text=(key:string,max:number)=>typeof v[key]==='string'?v[key].slice(0,max):'';
    return {pipelineId:v.pipelineId,cliente:text('cliente',10000),pais:text('pais',100),ciudad:text('ciudad',160),nombre_proyecto:text('nombre_proyecto',10000)};
  }catch{return null;}
}
export function serializarPreseleccionPipeline(value: PreseleccionPipeline) {
 const safe=leerPreseleccionPipeline(JSON.stringify(value));if(!safe)throw new Error('Preselección inválida.');return JSON.stringify(safe);
}
