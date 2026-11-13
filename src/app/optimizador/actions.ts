'use server';
import { getUserAndRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { normalizarConfig, type ConfigOptimizador } from '@/lib/corte/config';
import type { ModuloEntrada } from '@/lib/corte/lista';
import { firmaDespiece, grupoDeTipo, unidadesFisicas, type GrupoOptimizador, type TipoClasificable } from "@/lib/corte/clasificacion";
import { modulosDeCotizacionAction } from '../hdr/actions';
import { normalizarSnapshot, validarTamanoGuardado, leerSnapshotTransportado, type GuardadoOptimizador, type ResumenGuardado } from './guardados';

async function usuarioOptimizador(){const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)throw new Error('No autorizado');return {sb,user};}
export async function contextoGuardadosAction(){const {sb,user}=await usuarioOptimizador();const [{data:perfil,error:pe},{data:planta,error:ce}]=await Promise.all([sb.from('cot_perfiles').select('rol').eq('user_id',user.id).maybeSingle(),sb.from('cot_parametros').select('value').eq('key','optimizador').maybeSingle()]);if(pe||ce)throw new Error('No se pudo revisar la configuración de planta.');return {autorId:user.id,rol:String(perfil?.rol??'vendedor'),configActual:normalizarConfig(planta?.value)};}
export async function guardarOptimizacionAction(datos:{nombre:string;snapshot:unknown;esquemasAlDia:boolean;clave:string}){
  const {sb,user}=await usuarioOptimizador();
  validarTamanoGuardado(datos);
  if(!user.email)throw new Error('El usuario no tiene correo.');
  const nombre=String(datos.nombre??'').trim();if(!nombre||nombre.length>160)throw new Error('Indica un nombre de hasta 160 caracteres.');
  const snapshot=normalizarSnapshot(await leerSnapshotTransportado(datos.snapshot));
  if(datos.esquemasAlDia!==true||datos.clave!==JSON.stringify([snapshot.cotizacionId,snapshot.cfg,snapshot.texturaPorMaterial]))throw new Error('Hay cambios pendientes: recalcula los esquemas antes de guardar.');
  if(snapshot.cotizacionId){const {data:proyecto,error}=await sb.from('cot_cotizaciones').select('id,nombre,codigo').eq('id',snapshot.cotizacionId).maybeSingle();if(error||!proyecto)throw new Error('La cotización no existe o no está autorizada.');snapshot.proyectoNombre=proyecto.nombre||'Sin nombre';snapshot.cotizacionCodigo=proyecto.codigo||proyecto.id.slice(0,8).toUpperCase();}
  const {data,error}=await sb.from('optimizador_guardados').insert({nombre,proyecto_nombre:snapshot.proyectoNombre,cotizacion_id:snapshot.cotizacionId,autor_id:user.id,autor_email:user.email,config:{...snapshot.cfg,texturaPorMaterial:snapshot.texturaPorMaterial},resultado:snapshot}).select('*').single();
  if(error)throw new Error(error.message);return data as GuardadoOptimizador;
}
export async function listarOptimizacionesAction():Promise<ResumenGuardado[]>{
  const {sb}=await usuarioOptimizador();const rows:ResumenGuardado[]=[];
  for(let n=0;;n+=500){const {data,error}=await sb.from('optimizador_guardados').select('id,nombre,proyecto_nombre,autor_id,autor_email,created_at,cotizacion_id,laminas:resultado->planCorte->consolidado->laminas,desperdicio:resultado->planCorte->consolidado->desperdicioPct,laminasProyecto:resultado->planCorte->proyectoCompleto->laminas,desperdicioProyecto:resultado->planCorte->proyectoCompleto->desperdicioPct,piezas:resultado->lista->totalPiezas').order('created_at',{ascending:false}).order('id',{ascending:false}).range(n,n+499);if(error)throw new Error(error.message);for(const r of data??[])rows.push({...r,laminas:Number(r.laminas)||Number(r.laminasProyecto)||0,desperdicioPct:Number(r.laminas)>0?Number(r.desperdicio):Number(r.desperdicioProyecto),piezas:Number(r.piezas)} as ResumenGuardado);if((data??[]).length<500)return rows;}
}
export async function obtenerOptimizacionAction(id:string){const {sb}=await usuarioOptimizador();const {data,error}=await sb.from('optimizador_guardados').select('*').eq('id',id).maybeSingle();if(error||!data)throw new Error('Guardado no encontrado o no autorizado.');const registro=data as GuardadoOptimizador;registro.resultado=normalizarSnapshot(registro.resultado);return registro;}
export async function eliminarOptimizacionAction(id:string){const {sb}=await usuarioOptimizador();const {data,error}=await sb.from('optimizador_guardados').delete().eq('id',id).select('id');if(error)throw new Error(error.message);if(data?.length!==1)throw new Error('No puedes eliminar este guardado o ya no existe.');return {ok:true};}

async function assertAdmin() {
  const { rol } = await getUserAndRole();
  if (rol !== 'admin') throw new Error('Solo administradores');
}

export async function guardarConfigOptimizadorAction(raw: unknown): Promise<{ ok: true; config: ConfigOptimizador } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const config = normalizarConfig(raw);
    const sb = await createClient();
    const { data, error } = await sb.from('cot_parametros').update({ value: config }).eq('key', 'optimizador').select('key');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error('Falta la llave "optimizador" en cot_parametros (migración 0180).');
    return { ok: true, config };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al guardar' };
  }
}

export type ModuloOptimizador = ModuloEntrada & {
  lineaId: string;
  cocina: string;
  piezasPorModulo: number;
  grupoId: string | null;
  /** Muebles, paneles o fillers (cot_tipos_mueble.grupo_optimizador). */
  grupo?: GrupoOptimizador;
  pref?: string;
  medidas?: string;
  /** Cantidad de la línea y repeticiones del área; `cantidad` = ambas multiplicadas. */
  cantidadLinea?: number;
  repeticionesArea?: number;
  /** Muebles que forma cada módulo físico (un grupo con laterales compartidos reúne varios). */
  mueblesPorModulo?: number;
  /** Firma del despiece: mismas medidas y piezas. */
  firma?: string;
};

export type ProyectoOptimizador = {
  modulos: ModuloOptimizador[];
  errores: { codigo: string; error: string; grupo?: GrupoOptimizador; unidades?: number }[];
};

// Despiece actual de cada módulo de la cotización (recalculado con el motor vigente,
// grupos incluidos), reducido a lo que necesita la lista de corte. Las unidades son
// físicas: cantidad de la línea × repeticiones del área (p. ej. "APTO A COCINA" × 6).
// Los artículos de "+ Agregar herrajes/otros" no son módulos y no entran.
export async function proyectoDesdeCotizacionAction(cotizacionId: string): Promise<ProyectoOptimizador> {
  await assertAdmin();
  const sb = await createClient();
  const [modulos, { data: tipos, error: te }] = await Promise.all([
    modulosDeCotizacionAction(cotizacionId),
    sb.from("cot_tipos_mueble").select("*"),
  ]);
  if (te) throw new Error(te.message);
  const tipoPorId = new Map(((tipos ?? []) as (TipoClasificable & { id: string })[]).map((t) => [String(t.id), t]));
  const grupoDe = (id: string | null | undefined) => grupoDeTipo(id ? tipoPorId.get(String(id)) : undefined);
  const out: ProyectoOptimizador = { modulos: [], errores: [] };
  for (const m of modulos) {
    const repeticionesArea = m.repeticionesArea ?? 1;
    const cantidad = unidadesFisicas(m.cantidad, repeticionesArea);
    const grupo = grupoDe(m.tipoMuebleId);
    if (!m.ok) { out.errores.push({ codigo: m.codigoModulo, error: m.error, grupo, unidades: cantidad }); continue; }
    const piezas = m.result.piezas
      .filter((p) => p.cant > 0)
      .map((p) => ({
        pieza: p.pieza, rol: p.rol, cant: p.cant, largoIn: p.largoIn, anchoIn: p.anchoIn,
        cantoLargos: p.cantoLargos, cantoAnchos: p.cantoAnchos, cantoCalibre: p.cantoCalibre,
      }));
    out.modulos.push({
      lineaId: m.lineaId,
      grupoId: m.grupoId,
      codigo: m.codigoModulo,
      cocina: m.cocinaNombre,
      cantidad,
      cantidadLinea: m.cantidad,
      repeticionesArea: unidadesFisicas(1, repeticionesArea),
      grupo,
      pref: m.pref,
      medidas: m.medidas,
      mueblesPorModulo: Math.max(1, m.origenes?.length ?? 1),
      firma: firmaDespiece(piezas),
      piezas,
      piezasPorModulo: Math.round(piezas.reduce((s, p) => s + p.cant, 0) * 100) / 100,
      tableroPorRol: Object.fromEntries(m.result.maderaPorRol.map((r) => [r.rol, r.codigo])),
    });
  }
  return out;
}
