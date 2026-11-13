import type { GuideStep } from '@/components/GuideButton';

export type HelpContext = 'simulador' | 'cotizaciones' | 'pipeline' | 'proyecto' | 'materiales' | 'diseno' | 'hdr' | 'optimizador' | 'manual';

export const GUIAS: Record<HelpContext, GuideStep[]> = {
  simulador: [
    { title: 'Simulador de muebles', description: 'Configura un mueble, revisa su despiece y calcula costos y precios.' },
    { selector: '[data-tour="tipo"]', title: 'Tipo de mueble', description: 'Elige la tipología que vas a configurar.' },
    { selector: '[data-tour="dims"]', title: 'Dimensiones', description: 'Ingresa largo, alto, profundidad y unidad.' },
    { selector: '[data-tour="tableros"]', title: 'Materiales', description: 'Asigna tableros por rol y configura los cantos.' },
    { selector: '[data-tour="opciones"]', title: 'Opciones', description: 'Define puertas, cajones, frentes y herrajes.' },
    { selector: '[data-tour="resultado"]', title: 'Resultado', description: 'Revisa el cálculo y el despiece generado.' },
  ],
  cotizaciones: [
    { title: 'Cotizaciones', description: 'Consulta proyectos, oportunidades de venta y su estado.' },
    { selector: '[data-tour="vistas"]', title: 'Vistas', description: 'Cambia entre registro, pipeline, dashboard y listado.' },
    { selector: '[data-tour="nuevo"]', title: 'Nuevo proyecto', description: 'Crea una cotización e indica sus datos y familias de muebles.' },
    { selector: '[data-tour="lista"]', title: 'Proyectos', description: 'Abre una cotización para ver y editar sus módulos.' },
  ],
  pipeline: [
    { title: 'Pipeline', description: 'Da seguimiento a las oportunidades y actualiza su información y estado.' },
    { selector: '[data-tour="vistas"]', title: 'Vistas', description: 'Registra oportunidades, revisa el pipeline o consulta el dashboard.' },
  ],
  proyecto: [
    { title: 'Proyecto / cotización', description: 'Administra las características, módulos, precios y estado de este proyecto.' },
    { selector: '[data-tour="proyecto"]', title: 'Características', description: 'Consulta el estado, la TRM, el margen aplicado y los totales.' },
    { selector: '[data-tour="export"]', title: 'Exportar', description: 'Descarga la cotización en Excel o PDF.' },
    { selector: '[data-tour="versiones"]', title: 'Versiones', description: 'Guarda o restaura puntos de retorno del proyecto.' },
    { selector: '[data-tour="cocinas"]', title: 'Secciones y módulos', description: 'Organiza secciones y agrega módulos a la cotización.' },
  ],
  materiales: [{ title: 'Materiales y parámetros', description: 'Administra catálogos, tableros, cantos, herrajes y parámetros del cotizador.' }],
  diseno: [{ title: 'Diseño', description: 'Mantén las tipologías, reglas y plantillas que usa el simulador.' }],
  hdr: [{ title: 'HDR', description: 'Genera hojas de ruta, consulta consumos y crea archivos de seguimiento.' }],
  optimizador: [{ title: 'Optimizador', description: 'Organiza piezas en tableros y revisa las optimizaciones guardadas.' }],
  manual: [{ title: 'Manual', description: 'Consulta la documentación y las instrucciones de uso de Cotizador PLUS.' }],
};
