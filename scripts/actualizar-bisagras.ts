import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { cantidadBisagras } from '../src/lib/bisagras';
import type { Breakdown } from '../src/lib/engine';
import { redondearMoneda } from '../src/lib/module-groups';

// Uso: node --env-file=.env --import tsx scripts/actualizar-bisagras.ts [--rollback | --apply]
type Linea = {
  id: string;
  cotizacion_id: string;
  cocina_id: string | null;
  grupo_id: string | null;
  codigo_modulo: string | null;
  updated_at: string;
  cantidad: number;
  config: { conHerrajes?: boolean; trm?: number; descuento?: number; herrajesExcluidos?: string[] } | null;
  breakdown: (Breakdown & { trm?: number }) | null;
  costo_herrajes_cop: number;
  costo_total_cop: number;
  precio_unit_cop: number;
  precio_unit_usd: number;
  precio_total_cop: number;
  precio_total_usd: number;
};

function prepararCambio(linea: Linea) {
  const b = linea.breakdown;
  if (!b?.piezas?.length || !b.herrajes?.length || linea.config?.conHerrajes === false) return null;
  if (linea.config?.herrajesExcluidos?.some(rol => rol.toLowerCase() === 'bisagra')) return null;
  let deltaCosto = 0;
  let anteriores = 0;
  let nuevos = 0;
  const herrajes = b.herrajes.map(h => {
    if (h.rol.toLowerCase() !== 'bisagra') return h;
    const cant = cantidadBisagras(b.piezas, h.codigo, h.cant);
    if (cant === h.cant) return h;
    anteriores += h.cant;
    nuevos += cant;
    deltaCosto += (cant - h.cant) * h.precio;
    return { ...h, cant, costo: redondearMoneda(cant * h.precio) };
  });
  if (!anteriores) return null;
  const cantidad = Number(linea.cantidad);
  const trm = Number(b.trm ?? linea.config?.trm);
  const descuento = Number(linea.config?.descuento ?? 0);
  const margen = Number(b.margenHerraje);
  const importes = [linea.costo_herrajes_cop, linea.costo_total_cop, linea.precio_total_cop, linea.precio_total_usd,
    b.costoHerrajes, b.costoConHerrajes, b.precioHerrajesCop, b.precioHerrajesUsd, b.precioConHerrajesCop, b.precioConHerrajesUsd];
  if (![cantidad, trm, descuento, margen, deltaCosto, ...importes.map(Number)].every(Number.isFinite)
    || cantidad <= 0 || trm <= 0 || margen >= 1) {
    throw new Error('Datos de precio incompletos en ' + linea.id);
  }
  const deltaCop = deltaCosto / (1 - margen);
  const deltaUsd = deltaCop * (1 - descuento) / trm;
  const precioCop = redondearMoneda(Number(linea.precio_total_cop) + deltaCop * cantidad);
  const precioUsd = redondearMoneda(Number(linea.precio_total_usd) + deltaUsd * cantidad);
  return {
    anteriores, nuevos,
    cambio: {
      id: linea.id, updated_at: linea.updated_at,
      costo_herrajes_cop: Number(linea.costo_herrajes_cop) + deltaCosto,
      costo_total_cop: Number(linea.costo_total_cop) + deltaCosto,
      precio_unit_cop: redondearMoneda(precioCop / cantidad),
      precio_unit_usd: redondearMoneda(precioUsd / cantidad),
      precio_total_cop: precioCop,
      precio_total_usd: precioUsd,
      breakdown: {
        herrajes, costoHerrajes: Number(b.costoHerrajes) + deltaCosto,
        costoConHerrajes: Number(b.costoConHerrajes) + deltaCosto,
        precioHerrajesCop: Number(b.precioHerrajesCop) + deltaCop,
        precioHerrajesUsd: Number(b.precioHerrajesUsd) + deltaUsd,
        precioConHerrajesCop: Number(b.precioConHerrajesCop) + deltaCop,
        precioConHerrajesUsd: Number(b.precioConHerrajesUsd) + deltaUsd,
      },
    },
  };
}

async function main() {
  const ref = process.env.SUPABASE_PROJECT_REF;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ref || !url || !serviceKey || new URL(url).hostname !== ref + '.supabase.co') throw new Error('Configuración de Supabase inválida.');
  const sb = createClient(url, serviceKey);
  const cambios: NonNullable<ReturnType<typeof prepararCambio>>['cambio'][] = [];
  const respaldo: Linea[] = [];
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await sb.from('cot_cotizacion_lineas')
      .select('id,cotizacion_id,cocina_id,grupo_id,codigo_modulo,updated_at,cantidad,config,breakdown,costo_herrajes_cop,costo_total_cop,precio_unit_cop,precio_unit_usd,precio_total_cop,precio_total_usd')
      .not('tipo_mueble_id', 'is', null).order('id').range(desde, desde + 499).returns<Linea[]>();
    if (error) throw error;
    for (const linea of data) {
      const ajuste = prepararCambio(linea);
      if (!ajuste) continue;
      cambios.push(ajuste.cambio);
      respaldo.push(linea);
      console.log(linea.codigo_modulo, ajuste.anteriores, '→', ajuste.nuevos);
    }
    if (data.length < 500) break;
  }
  console.log(JSON.stringify({ lineas: cambios.length, cotizaciones: new Set(respaldo.map(l => l.cotizacion_id)).size }));
  const aplicar = process.argv.includes('--apply');
  const revertir = process.argv.includes('--rollback');
  if (!cambios.length || (!aplicar && !revertir)) return;
  if (aplicar && revertir) throw new Error('Selecciona un solo modo de escritura.');
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('Falta el token de administración de Supabase.');
  if (aplicar) {
    const ruta = path.join('.tmp', 'respaldo-bisagras-' + Date.now() + '.json');
    await fs.mkdir('.tmp', { recursive: true });
    await fs.writeFile(ruta, JSON.stringify(respaldo), { flag: 'wx' });
    console.log('Respaldo local:', ruta);
  }
  const payload = JSON.stringify(cambios).replaceAll("'", "''");
  const query = SQL_ACTUALIZAR.replace('__CAMBIOS__', () => payload) + (revertir ? '\nrollback;' : '\ncommit;');
  const result = await fetch('https://api.supabase.com/v1/projects/' + ref + '/database/query', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!result.ok) throw new Error('Actualización revertida o sin confirmar: HTTP ' + result.status + '; ' + (await result.text()).slice(0, 280));
  console.log(revertir ? 'Transacción de prueba revertida:' : 'Actualización confirmada:', await result.text());
}

const SQL_ACTUALIZAR = [
  "begin;",
  "set local lock_timeout = '5s';",
  "create temp table bisagras_cambios on commit drop as",
  "select * from jsonb_to_recordset('__CAMBIOS__'::jsonb) as c(",
  " id uuid, updated_at timestamptz, costo_herrajes_cop numeric, costo_total_cop numeric,",
  " precio_unit_cop numeric, precio_unit_usd numeric, precio_total_cop numeric, precio_total_usd numeric, breakdown jsonb",
  ");",
  "create temp table bisagras_afectadas on commit drop as",
  "with actualizadas as (",
  " update public.cot_cotizacion_lineas l set",
  " costo_herrajes_cop=c.costo_herrajes_cop, costo_total_cop=c.costo_total_cop,",
  " precio_unit_cop=c.precio_unit_cop, precio_unit_usd=c.precio_unit_usd,",
  " precio_total_cop=c.precio_total_cop, precio_total_usd=c.precio_total_usd, breakdown=l.breakdown || c.breakdown",
  " from bisagras_cambios c where l.id=c.id and l.updated_at=c.updated_at",
  " returning l.id,l.grupo_id,l.cocina_id,l.cotizacion_id",
  ") select * from actualizadas;",
  "do $$ begin",
  " if (select count(*) from bisagras_afectadas) <> (select count(*) from bisagras_cambios) then",
  "   raise exception 'Una linea cambio desde la lectura. Repite el calculo.';",
  " end if;",
  "end $$;",
  "update public.cot_grupos_modulos g set (total_cop,total_usd)=(",
  " select round(sum(l.precio_total_cop),2),round(sum(l.precio_total_usd),2)",
  " from public.cot_cotizacion_lineas l where l.grupo_id=g.id",
  ") where g.id in (select grupo_id from bisagras_afectadas);",
  "update public.cot_cocinas a set (total_cop,total_usd)=(",
  " select sum(l.precio_total_cop)*greatest(1,a.cantidad),sum(l.precio_total_usd)*greatest(1,a.cantidad)",
  " from public.cot_cotizacion_lineas l where l.cocina_id=a.id",
  ") where a.id in (select cocina_id from bisagras_afectadas);",
  "update public.cot_cotizaciones q set (total_cop,total_usd)=(",
  " select sum(a.total_cop),sum(a.total_usd) from public.cot_cocinas a where a.cotizacion_id=q.id",
  ") where q.id in (select cotizacion_id from bisagras_afectadas);",
  "select count(*) as lineas_actualizadas, count(distinct cotizacion_id) as cotizaciones_actualizadas from bisagras_afectadas;",
].join('\n');

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
