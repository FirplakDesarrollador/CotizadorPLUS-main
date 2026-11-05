/** Auditoría de solo lectura. No modifica cotizaciones ni catálogos. */
import { createClient } from '../src/lib/supabase/server';
import { cargarCatalogoPrecompilado, cotizarGrupo } from '../src/lib/cotizar';
import { inputDesdeLinea, type LineaPersistida } from '../src/lib/cotizaciones';
import { precioUnitario } from '../src/lib/module-groups';

async function main() {
  const sb = await createClient();
  async function leer(tabla: string) {
    const rows = [];
    for (let desde = 0; ; desde += 500) {
      const { data, error } = await sb.from(tabla).select('*').order('id').range(desde, desde + 499);
      if (error) throw new Error(error.message);
      rows.push(...data);
      if (data.length < 500) return rows;
    }
  }
  const [lineas, proyectos, tipos, plantillas, reglas, catalogo] = await Promise.all([
    leer('cot_cotizacion_lineas'), leer('cot_cotizaciones'), leer('cot_tipos_mueble'),
    leer('cot_herrajes_plantilla'), leer('cot_reglas_config'), cargarCatalogoPrecompilado(),
  ]);
  const diferencias = [];
  const erroresHerrajes = [];
  const bov = [];
  const grupos = new Map<string, typeof lineas>();
  for (const l of lineas.filter(l => l.tipo_mueble_id)) {
    const key = l.grupo_id ?? l.id;
    grupos.set(key, [...(grupos.get(key) ?? []), l]);
  }
  for (const rows of grupos.values()) {
    rows.sort((a, b) => a.posicion_grupo - b.posicion_grupo);
    const inputs = rows.map(l => inputDesdeLinea(l as LineaPersistida));
    const resultado = await cotizarGrupo(inputs, catalogo);
    for (let i = 0; i < rows.length; i++) {
      const l = rows[i], res = resultado.lineas[i];
      const precio = precioUnitario(inputs[i].conHerrajes, res);
      const detalle = { id: l.id, proyecto: proyectos.find(p => p.id === l.cotizacion_id)?.nombre,
        codigo: l.codigo_modulo, config: { conHerrajes: l.config?.conHerrajes, excluidos: l.config?.herrajesExcluidos },
        guardadoCop: l.precio_unit_cop, calculadoCop: precio.cop, guardadoUsd: l.precio_unit_usd, calculadoUsd: precio.usd };
      const normalizar = (hardware: typeof res.herrajes) => hardware.map(h => ({ rol: h.rol, codigo: h.codigo, cant: h.cant, costo: h.costo })).sort((a, b) => `${a.rol}/${a.codigo}`.localeCompare(`${b.rol}/${b.codigo}`));
      if (JSON.stringify(normalizar(l.breakdown?.herrajes ?? [])) !== JSON.stringify(normalizar(res.herrajes))) erroresHerrajes.push(detalle);
      if (Math.abs(Number(l.precio_unit_cop) - precio.cop) > 0.011 || Math.abs(Number(l.precio_unit_usd) - precio.usd) > 0.011) diferencias.push(detalle);
      if (tipos.find(t => t.id === l.tipo_mueble_id)?.pref.startsWith('BOV')) bov.push({ ...detalle,
        guardados: l.breakdown?.herrajes, esperados: res.herrajes, n_patas: res.vars.n_patas });
    }
  }
  const bovTipos = tipos.filter(t => t.pref.startsWith('BOV'));
  console.log(JSON.stringify({ proyectos: proyectos.length, modulos: lineas.filter(l => l.tipo_mueble_id).length,
    preferencias: lineas.filter(l => l.config?.conHerrajes === false || l.config?.herrajesExcluidos?.length).map(l => ({ id: l.id, codigo: l.codigo_modulo, config: l.config })),
    bovTipos, bovPlantillas: plantillas.filter(p => bovTipos.some(t => t.id === p.tipo_mueble_id)),
    bovReglas: reglas.filter(r => r.variable === 'n_patas' && (!r.tipo_mueble_id || bovTipos.some(t => t.id === r.tipo_mueble_id))),
    bov, diferencias, erroresHerrajes }, null, 2));
  if (process.argv.includes('--strict') && (diferencias.length || erroresHerrajes.length || bov.some(l =>
    l.esperados.filter((h: { rol: string }) => ['pata', 'tornillo'].includes(h.rol)).length !==
      (l.config.conHerrajes === false ? 0 : ['pata', 'tornillo'].filter(rol => !l.config.excluidos?.includes(rol)).length)
  ))) throw new Error('Hay inconsistencias de precio, herrajes o plantilla BOV.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
