/** Solo lectura: node --conditions=react-server --env-file=.env --import tsx scripts/auditar-hdr.ts */
import { listarCotizaciones, getCotizacion, inputDesdeLinea, type LineaPersistida } from '../src/lib/cotizaciones';
import { cargarCatalogoPrecompilado, cotizarGrupo } from '../src/lib/cotizar';
import { validarEntrepanosHdr } from '../src/app/hdr/validacion';
import { esModuloLinea } from '../src/lib/materiales-linea';

async function main() {
  const catalogo = await cargarCatalogoPrecompilado();
  const avisos: unknown[] = [], errores: unknown[] = [];
  let modulos = 0;
  for (const proyecto of await listarCotizaciones()) {
    const q = await getCotizacion(proyecto.id);
    const lineas = [...q.cocinas.flatMap(c => c.lineas), ...q.lineasSinCocina].filter(esModuloLinea) as LineaPersistida[];
    const grupos = new Map<string, LineaPersistida[]>();
    for (const l of lineas) grupos.set(l.grupo_id ?? l.id, [...(grupos.get(l.grupo_id ?? l.id) ?? []), l]);
    for (const grupo of grupos.values()) {
      try {
        const result = await cotizarGrupo(grupo.map(inputDesdeLinea), catalogo);
        result.preparados.forEach((p, i) => {
          modulos++;
          for (const aviso of validarEntrepanosHdr(p.calc)) avisos.push({ proyecto: proyecto.nombre, lineaId: grupo[i].id, codigo: grupo[i].codigo_modulo, aviso });
        });
      } catch (error) { errores.push({ proyecto: proyecto.nombre, lineas: grupo.map(l => l.id), error: error instanceof Error ? error.message : String(error) }); }
    }
  }
  console.log(JSON.stringify({ modulos, avisos, errores }, null, 2));
  if (errores.length || (process.argv.includes('--strict') && avisos.length)) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
