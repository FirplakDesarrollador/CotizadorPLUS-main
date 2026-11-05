export const PRODUCTOS_PIPELINE = ['Gabinetes de cocina', 'Gabinetes de Baño', 'Mesones', 'Closets'];
export type CampoPipeline = { key: string; label: string; tipo?: 'text' | 'date' | 'number' | 'url' | 'textarea'; opciones?: readonly string[]; obligatorio?: boolean };
export const CAMPOS_PIPELINE: CampoPipeline[] = [
  { key: 'nombre_proyecto', label: '1. Nombre del Proyecto', obligatorio: true },
  { key: 'cliente', label: '2. Cliente', obligatorio: true },
  { key: 'pais', label: '3. País', obligatorio: true }, { key: 'ciudad', label: 'Ciudad' },
  { key: 'moneda', label: '4. Moneda', opciones: ['USD', 'COP'], obligatorio: true },
  { key: 'productos', label: '5. Productos', obligatorio: true },
  { key: 'asunto_correo', label: '6. Asunto de correo', obligatorio: true },
  { key: 'tipo_tablero', label: '7. Tipo tablero', opciones: ['CARB2', 'RH', 'Estandar'], obligatorio: true },
  { key: 'formato_color', label: '8. Formato de color', opciones: ['Color/Color', 'Balance', 'Caja blanca con paneles'], obligatorio: true },
  { key: 'espesor_caja', label: '9. Espesor de caja', opciones: ['18mm', '15mm'], obligatorio: true },
  { key: 'espesor_puerta', label: '10. Espesor de puerta', opciones: ['18mm', '15mm'], obligatorio: true },
  { key: 'tipo_puerta', label: '11. Tipo de puerta', opciones: ['Plana', 'Shaker'], obligatorio: true },
  { key: 'tipo_gabinete', label: '12. Tipo de gabinete', opciones: ['Con manijas', 'Sin manijas gola madera', 'Sin manijas gola metálica'], obligatorio: true },
  { key: 'tipo_rieles', label: '13. Tipo de rieles', opciones: ['Tandem Box', 'Full Extension', 'Metal box', 'Otras'], obligatorio: true },
  { key: 'tipo_zocalo', label: '14. Tipo de zócalo', opciones: ['Madera 4 1/2"', 'Madera 5 1/4"', 'Madera 12cm', 'PVC Aluminizado 12cm', 'Aluminio 12cm'], obligatorio: true },
  { key: 'margen_adicional', label: '15. Margen adicional', obligatorio: true },
  { key: 'tarifa', label: '16. Tarifa', tipo: 'number', obligatorio: true },
  { key: 'instalado', label: '17. Instalado', opciones: ['No', 'Sí'], obligatorio: true },
  { key: 'incoterm', label: '18. Incoterm', opciones: ['FOB', 'DAP', 'CIF', 'Instalado'], obligatorio: true },
  { key: 'especificaciones', label: '19. Especificaciones', tipo: 'textarea', obligatorio: true },
  { key: 'fecha_limite_envio', label: '20. Fecha límite de envío', tipo: 'date', obligatorio: true },
  { key: 'link_documentos', label: '21. Link de documentos', tipo: 'url', obligatorio: true },
  { key: 'notas', label: '22. Notas del proyecto', tipo: 'textarea', obligatorio: true },
  { key: 'tipo_cotizacion', label: '23. Tipo de cotización', opciones: ['FIRPLAK', 'CEMA'], obligatorio: true },
  { key: 'adjunto_url', label: '24. Adjunto (URL)', tipo: 'url' },
  { key: 'asesor', label: '25. Asesor' }, { key: 'estimador', label: '26. Estimador' },
];
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
export function validarRegistroPipeline(form: FormData): Record<string, string | number | boolean | null> & { tarifa: number; instalado: boolean; estado: 'borrador' } {
  const datos: Record<string, string | number | boolean | null> = {};
  for (const campo of CAMPOS_PIPELINE) {
    const values = form.getAll(campo.key).map(v => String(v).trim());
    const value = campo.key === 'productos' ? values.filter(Boolean).join(' | ') : values[0] ?? '';
    if (campo.obligatorio && !value) throw new Error(`Completa ${campo.label.replace(/^\d+\. /, '')}.`);
    if (value.length > 10000) throw new Error('Un campo supera el límite de 10.000 caracteres.');
    if (campo.opciones && !campo.opciones.includes(value)) throw new Error(`Selección inválida: ${campo.label}.`);
    if (campo.key === 'productos' && (!values.length || values.some(v => !PRODUCTOS_PIPELINE.includes(v)))) throw new Error('Selecciona al menos un producto válido.');
    datos[campo.key] = campo.tipo === 'url' ? validarUrlPipeline(value) : campo.tipo === 'date' ? validarFechaPipeline(value) : value || null;
  }
  if (String(datos.pais).length > 100 || String(datos.ciudad ?? '').length > 160) throw new Error('Ubicación demasiado larga.');
  const tarifa = Number(datos.tarifa);
  if (!Number.isFinite(tarifa) || tarifa < 0) throw new Error('Tarifa inválida.');
  return { ...datos, tarifa, instalado: datos.instalado === 'Sí', estado: 'borrador' as const };
}
