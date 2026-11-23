export type ArchivoHdr = { nombre: string; contenido: Blob };
export type GuardarArchivoHdr = (nombre: string, contenido: Blob) => Promise<void>;
export type DestinoHdr = { guardar: GuardarArchivoHdr; finalizar: () => Promise<void> };
export function esCancelacionHdr(error: unknown): boolean { return error instanceof Error && error.name === 'AbortError'; }
export type DirectorioHdr = {
  getDirectoryHandle: (nombre: string, opciones: { create: boolean }) => Promise<DirectorioHdr>;
  getFileHandle: (nombre: string, opciones: { create: boolean }) => Promise<{ createWritable: () => Promise<{ write: (datos: Blob) => Promise<void>; close: () => Promise<void> }> }>;
};
type ElegirDirectorio = (opciones: { startIn: 'downloads'; mode: 'readwrite' }) => Promise<DirectorioHdr>;

function nombreSeguro(nombre: string): string {
  const limpio = nombre.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim().replace(/[. ]+$/, '').slice(0, 140);
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(limpio) ? `_${limpio}` : limpio || 'Proyecto';
}
export function nombreCarpetaHdr(proyecto: string): string { return `${nombreSeguro(proyecto)} - HDR`; }

const tablaCrc = Uint32Array.from({ length: 256 }, (_, i) => {
  let crc = i;
  for (let n = 0; n < 8; n++) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
function crc32(datos: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of datos) crc = tablaCrc[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
/** ZIP sin compresión: conserva PDF/XLSX originales y una carpeta raíz, sin dependencias. */
export async function crearZipHdr(carpeta: string, archivos: readonly ArchivoHdr[]): Promise<Blob> {
  if (!archivos.length || archivos.length > 65535) throw new Error('La exportación necesita entre 1 y 65535 archivos.');
  const bloques: (Uint8Array<ArrayBuffer> | Blob)[] = [], directorio: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const a of archivos) {
    const nombre = new TextEncoder().encode(`${carpeta}/${a.nombre}`), datos = new Uint8Array(await a.contenido.arrayBuffer()), crc = crc32(datos);
    if (nombre.length > 65535 || offset + datos.length + nombre.length + 30 > 0xffffffff) throw new Error('La exportación excede el tamaño admitido para un ZIP.');
    const local = new Uint8Array(30 + nombre.length), l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true); l.setUint16(12, 33, true);
    l.setUint32(14, crc, true); l.setUint32(18, datos.length, true); l.setUint32(22, datos.length, true); l.setUint16(26, nombre.length, true); local.set(nombre, 30);
    const central = new Uint8Array(46 + nombre.length), c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true); c.setUint16(14, 33, true);
    c.setUint32(16, crc, true); c.setUint32(20, datos.length, true); c.setUint32(24, datos.length, true); c.setUint16(28, nombre.length, true); c.setUint32(42, offset, true); central.set(nombre, 46);
    bloques.push(local, a.contenido); directorio.push(central); offset += local.length + datos.length;
  }
  const tamDirectorio = directorio.reduce((n, b) => n + b.length, 0);
  if (offset + tamDirectorio + 22 > 0xffffffff) throw new Error('La exportación excede el tamaño admitido para un ZIP.');
  const fin = new Uint8Array(22), f = new DataView(fin.buffer);
  f.setUint32(0, 0x06054b50, true); f.setUint16(8, archivos.length, true); f.setUint16(10, archivos.length, true); f.setUint32(12, tamDirectorio, true); f.setUint32(16, offset, true);
  return new Blob([...bloques, ...directorio, fin], { type: 'application/zip' });
}

function descargar(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido), enlace = document.createElement('a');
  enlace.href = url; enlace.download = nombre; enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** El navegador exige elegir la carpeta padre; sin esa API descarga un ZIP con la misma carpeta. */
export async function crearDestinoHdr(proyecto: string, opciones: { seleccionar?: ElegirDirectorio | null; descargar?: typeof descargar } = {}): Promise<DestinoHdr> {
  const carpeta = nombreCarpetaHdr(proyecto);
  const selector = opciones.seleccionar === undefined ? (window as unknown as { showDirectoryPicker?: ElegirDirectorio }).showDirectoryPicker?.bind(window) : opciones.seleccionar;
  const destino = selector ? await (await selector({ startIn: 'downloads', mode: 'readwrite' })).getDirectoryHandle(carpeta, { create: true }) : undefined;
  const archivos: ArchivoHdr[] = [], usados = new Set<string>();
  return {
    guardar: async (nombre, contenido) => {
      const original = nombreSeguro(nombre); let unico = original, n = 2;
      while (usados.has(unico.toLowerCase())) { const punto = original.lastIndexOf('.'); unico = punto > 0 ? `${original.slice(0, punto)} (${n++})${original.slice(punto)}` : `${original} (${n++})`; }
      usados.add(unico.toLowerCase());
      if (destino) { const stream = await (await destino.getFileHandle(unico, { create: true })).createWritable(); try { await stream.write(contenido); } finally { await stream.close(); } }
      else archivos.push({ nombre: unico, contenido });
    },
    finalizar: async () => { if (!destino) (opciones.descargar ?? descargar)(await crearZipHdr(carpeta, archivos), `${carpeta}.zip`); },
  };
}
