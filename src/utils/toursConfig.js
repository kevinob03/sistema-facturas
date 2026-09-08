/**
 * Definición de tours paso a paso por módulo
 */
export const TOURS_CONFIG = {
  dashboard: {
    id: 'dashboard',
    title: 'Tour del Dashboard',
    steps: [
      {
        element: '.erp-sidebar',
        popover: {
          title: ' Menú de Navegación',
          description: 'Accede rápidamente entre el Dashboard general, la emisión de Nuevas Facturas y la Consulta de tu historial.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '.metrics',
        popover: {
          title: ' Métricas Financieras Clave',
          description: 'Consulta en tiempo real el total facturado, cantidad de comprobantes, ticket promedio y la proyección estimada al cierre de mes.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '.ai-audit-card',
        popover: {
          title: ' Diagnóstico con Inteligencia Artificial',
          description: 'Evalúa la salud de tu cartera, identifica riesgos de concentración en clientes y recibe recomendaciones para optimizar tu liquidez.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.projection-card',
        popover: {
          title: ' Proyección Mensual',
          description: 'Visualiza el promedio diario de facturación y el estimado proyectado para el cierre del periodo actual.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.charts-grid',
        popover: {
          title: ' Gráficos de Tendencia y Estado',
          description: 'Compara los ingresos de los últimos 6 meses y la proporción de facturas emitidas, pagadas y anuladas.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '.ai-floating-trigger',
        popover: {
          title: ' Copiloto IA Disponible',
          description: 'Haz clic aquí en cualquier momento para consultar cuentas por cobrar, crear facturas con lenguaje natural o pedir consejos financieros.',
          side: 'left',
          align: 'end',
        },
      },
    ],
  },

  new: {
    id: 'new',
    title: 'Tour de Nueva Factura',
    steps: [
      {
        element: '.ai-quick-bar',
        popover: {
          title: ' Facturación Rápida con IA',
          description: 'Escribe o pega pedidos de WhatsApp, notas o cotizaciones. La IA autocompletará el cliente, impuestos e ítems automáticamente.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.party-selector',
        popover: {
          title: 'Datos de empresa y cliente',
          description: 'Usa este selector para alternar entre la empresa emisora y el cliente receptor. En ambos puedes consultar Hacienda para completar y validar la informacion.',
          side: 'bottom',
          align: 'start',
        },
      },      {
        element: '.form-section-datos',
        popover: {
          title: ' Número de Factura e Impuesto',
          description: 'El sistema calcula el consecutivo sugerido. Puedes ajustar la fecha y el porcentaje de impuesto (IVA).',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '.form-section-items',
        popover: {
          title: ' Líneas de Detalle e Ítems',
          description: 'Añade productos o servicios con su descripción, cantidad y precio unitario. El importe se calcula de forma inmediata.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '.form-summary',
        popover: {
          title: ' Resumen en Vivo y Total',
          description: 'Revisa el desglose de subtotal, monto de impuesto y total definitivo antes de emitir y guardar el comprobante.',
          side: 'top',
          align: 'end',
        },
      },
    ],
  },

  list: {
    id: 'list',
    title: 'Tour de Lista de Facturas',
    steps: [
      {
        element: '.invoice-filters',
        popover: {
          title: ' Búsqueda y Filtros Rápidos',
          description: 'Filtra facturas por texto, nombre de cliente, fecha (mes actual, anterior, etc.) y rangos de importe.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.erp-view-actions',
        popover: {
          title: ' Emisión Inmediata',
          description: 'Presiona este botón para abrir el formulario de emisión y crear una nueva factura.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '.invoice-table',
        popover: {
          title: ' Tabla de Facturas Registradas',
          description: 'Haz clic en los encabezados para ordenar por número, cliente o total. Selecciona cualquier factura para abrir su vista de detalle.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  detail: {
    id: 'detail',
    title: 'Tour de Detalle de Factura',
    steps: [
      {
        element: '.erp-view-actions',
        popover: {
          title: ' Acciones del Comprobante',
          description: 'Descarga la factura en PDF oficial con un clic, cámbiala a "Pagada" una vez recibido el pago, o realiza una anulación.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '.invoice-ai-banner',
        popover: {
          title: ' Redactor de Cobro con IA',
          description: 'Para facturas pendientes, genera automáticamente recordatorios cordiales, profesionales o urgentes listos para enviar por WhatsApp o correo.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '.invoice-inner',
        popover: {
          title: ' Comprobante Formal',
          description: 'Vista completa de la factura con datos fiscales de emisor y cliente, detalle de ítems, cálculo de IVA y total.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },
}
