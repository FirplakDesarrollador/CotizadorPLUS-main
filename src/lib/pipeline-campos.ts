export const PRODUCTOS_PIPELINE = ['Gabinetes de cocina', 'Gabinetes de Baño', 'Mesones', 'Closets'];
export const DESCONOCIDO_PIPELINE = '__desconocido__';
export type CampoPipeline = { key: string; label: string; tipo?: 'text' | 'date' | 'number' | 'url' | 'textarea'; opciones?: readonly string[]; obligatorio?: boolean; permiteDesconocido?: boolean };
const DEFINICION_CAMPOS: CampoPipeline[] = [
  { key: 'nombre_proyecto', label: '1. Nombre del Proyecto', obligatorio: true },
  { key: 'cliente', label: '2. Cliente', obligatorio: true },
  { key: 'pais', label: '3. País', obligatorio: true }, { key: 'ciudad', label: 'Ciudad' },
  { key: 'moneda', label: '4. Moneda', opciones: ['USD', 'COP'], obligatorio: true },
  { key: 'productos', label: '5. Productos', obligatorio: true },
  { key: 'asunto_correo', label: '6. Asunto de correo', obligatorio: true },
  { key: 'tipo_tablero', label: '7. Tipo tablero', opciones: ['CARB2', 'RH', 'Estandar'] },
  { key: 'formato_color', label: '8. Formato de color', opciones: ['Color/Color', 'Balance', 'Caja blanca con paneles'], obligatorio: true },
  { key: 'espesor_caja', label: '9. Espesor de caja', opciones: ['18mm', '15mm'], obligatorio: true },
  { key: 'espesor_puerta', label: '10. Espesor de puerta', opciones: ['18mm', '15mm'], obligatorio: true },
  { key: 'tipo_puerta', label: '11. Tipo de puerta', opciones: ['Plana', 'Shaker'], obligatorio: true },
  { key: 'tipo_gabinete', label: '12. Tipo de gabinete', opciones: ['Con manijas', 'Sin manijas gola madera', 'Sin manijas gola metálica'], obligatorio: true },
  { key: 'tipo_rieles', label: '13. Tipo de rieles', opciones: ['Tandem Box', 'Full Extension', 'Metal box', 'Otras'], obligatorio: true },
  { key: 'tipo_zocalo', label: '14. Tipo de zócalo', opciones: ['Zócalo de madera', 'Zócalo de PVC'] },
  { key: 'tarifa', label: '15. Tarifa', tipo: 'number', obligatorio: true },
  { key: 'instalado', label: '16. Instalado', opciones: ['No', 'Sí'], obligatorio: true },
  { key: 'incoterm', label: '17. Incoterm', opciones: ['FOB', 'DAP', 'CIF', 'Instalado'], obligatorio: true },
  { key: 'especificaciones', label: '18. Especificaciones', tipo: 'textarea', obligatorio: true },
  { key: 'fecha_limite_envio', label: '19. Fecha límite de envío', tipo: 'date', obligatorio: true },
  { key: 'link_documentos', label: '20. Link de documentos', tipo: 'url', obligatorio: true },
  { key: 'notas', label: '21. Notas del proyecto', tipo: 'textarea', obligatorio: true },
  { key: 'tipo_cotizacion', label: '22. Tipo de cotización', opciones: ['FIRPLAK', 'CEMA'], obligatorio: true },
  { key: 'adjunto_url', label: '23. Adjunto (URL)', tipo: 'url' },
  { key: 'asesor', label: '24. Asesor' }, { key: 'estimador', label: '25. Estimador' },
];
export const CAMPOS_PIPELINE: CampoPipeline[]=DEFINICION_CAMPOS.map(c=>({...c,obligatorio:false,permiteDesconocido:!['nombre_proyecto','cliente','pais','moneda'].includes(c.key)}));
export function validarUrlPipeline(value: string) {
  if (!value) return null;
  try { const url = new URL(value); if (['http:', 'https:'].includes(url.protocol)) return value; } catch { /* error de validación */ }
  throw new Error('Los enlaces deben ser URL http o https válidas.');
}
export function validarFechaPipeline(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) !== value) throw new Error('Fecha inválida.');
  return value;
}
export function validarRegistroPipeline(form: FormData): Record<string, string | number | boolean | string[] | null> & { tarifa: number|null; instalado: boolean|null; estado: 'borrador';campos_desconocidos:string[] } {
  const datos: Record<string, string | number | boolean | string[] | null> = {};
  const desconocidos:string[]=[];
  for (const campo of CAMPOS_PIPELINE) {
    const values = form.getAll(campo.key).map(v => String(v).trim()).filter(Boolean);
    if(campo.key==='productos'){
      const products=[...new Set(values)];
      if(products.some(v=>!PRODUCTOS_PIPELINE.includes(v)))throw new Error('Selecciona productos válidos.');
      datos.productos=products.length?products.join(' | '):null;
      continue;
    }
    if(campo.key==='tipo_tablero'){
      const products=[...new Set(form.getAll('productos').map(v=>String(v).trim()).filter(v=>PRODUCTOS_PIPELINE.includes(v)))];
      const boardByProduct:Record<string,string>={};
      for(const product of products){
        const board=String(form.get(`tipo_tablero_${PRODUCTOS_PIPELINE.indexOf(product)}`)??'').trim();
        if(board&&!campo.opciones?.includes(board))throw new Error(`Selección inválida: tipo de tablero para ${product}.`);
        if(board)boardByProduct[product]=board;
      }
      datos.tipo_tablero=Object.keys(boardByProduct).length?JSON.stringify(boardByProduct):null;
      continue;
    }
    const value = values[0] ?? '';
    if (campo.obligatorio && !value) throw new Error(`Completa ${campo.label.replace(/^\d+\. /, '')}.`);
    if (value.length > 10000) throw new Error('Un campo supera el límite de 10.000 caracteres.');
    if (campo.opciones && value && !campo.opciones.includes(value)) throw new Error(`Selección inválida: ${campo.label}.`);
    datos[campo.key] = campo.tipo === 'url' ? validarUrlPipeline(value) : campo.tipo === 'date' ? validarFechaPipeline(value) : value || null;
  }
  if(!/^\s*(usa|united states|estados unidos)\s*$/i.test(String(datos.pais??'')))datos.tarifa=null;
  if (String(datos.pais).length > 100 || String(datos.ciudad ?? '').length > 160) throw new Error('Ubicación demasiado larga.');
  const tarifa = datos.tarifa==null?null:Number(datos.tarifa);
  if (tarifa!==null&&(!Number.isFinite(tarifa) || tarifa < 0)) throw new Error('Tarifa inválida.');
  return { ...datos, tarifa, instalado: datos.instalado==null?null:datos.instalado === 'Sí', estado: 'borrador' as const,campos_desconocidos:desconocidos };
}
