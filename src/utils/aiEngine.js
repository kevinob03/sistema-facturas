import { getInvoiceTotal, formatMoney } from './invoiceCalculator'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_FALLBACK_MODEL = 'gemini-1.5-flash'

/**
 * Obtiene la API Key configurada para Gemini (desde .env o localStorage)
 */
export const getGeminiApiKey = () => {
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null
  if (localKey && localKey.trim()) return localKey.trim()
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
}

/**
 * Guarda la API Key en localStorage
 */
export const saveGeminiApiKey = (key) => {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim())
    } else {
      localStorage.removeItem('gemini_api_key')
    }
  }
}

/**
 * Llamada directa a la API de Google Gemini (Google AI Studio)
 */
export const callGeminiApi = async (prompt, systemInstruction = '') => {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('No hay API Key configurada')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  }

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    // Si falla gemini-2.5-flash por modelo no encontrado, intentar fallback a gemini-1.5-flash
    if (response.status === 404) {
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
      const fallbackRes = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!fallbackRes.ok) {
        const errorData = await fallbackRes.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Error ${fallbackRes.status} al consultar Gemini`)
      }
      const data = await fallbackRes.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Error ${response.status} en la API de Gemini`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Parser inteligente de texto libre a estructura de factura (Local NLP)
 */
export const parseInvoiceFromTextLocal = (text) => {
  const clean = text.trim()
  const result = {
    clientName: '',
    clientTaxId: '',
    clientContact: '',
    issuerName: '',
    taxRate: '13',
    items: [],
  }

  // Detectar tasa de impuesto (ej: IVA 13%, impuesto 15%)
  const taxMatch = clean.match(/(?:iva|impuesto|tax)\s*(?:del?)?\s*(\d+(?:\.\d+)?)\s*%/i)
  if (taxMatch) {
    result.taxRate = taxMatch[1]
  }

  // Detectar identificación o cédula
  const taxIdMatch = clean.match(/(?:c[eé]dula|ruc|nit|id|identificaci[oó]n)\s*:?\s*([0-9\-\s]{8,14})/i)
  if (taxIdMatch) {
    result.clientTaxId = taxIdMatch[1].replace(/[\s-]/g, '')
  }

  // Detectar nombre del cliente (ej: "a Juan Pérez", "para María López", "cliente: Carlos Gómez")
  const clientMatch = clean.match(/(?:para|a|cliente:?)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,3})/i)
  if (clientMatch) {
    const rawName = clientMatch[1].trim()
    const forbidden = ['una', 'la', 'el', 'este', 'esta', 'nueva', 'facturar']
    if (!forbidden.includes(rawName.toLowerCase())) {
      result.clientName = rawName
    }
  }

  // Detectar correo si viene
  const emailMatch = clean.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (emailMatch) {
    result.clientContact = emailMatch[1]
  }

  // Detectar ítems y precios
  // Patrones: "3 laptops a 800", "2 licencias de software a 150 c/u", "1 soporte técnico por 80"
  const itemRegex = /(?:(\d+(?:\.\d+)?)\s+(?:unidades?\s+de\s+|x\s+|de\s+)?([a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_"']+?)\s+(?:a|por|precio|costo|c\/u|\$)\s+(?:\$|USD|CRC)?\s*(\d+(?:\.\d+)?))/gi
  let match
  const items = []

  while ((match = itemRegex.exec(clean)) !== null) {
    const qty = parseFloat(match[1]) || 1
    let desc = match[2].trim()
    desc = desc.replace(/^(y|con|mas|\+|,)\s+/i, '').trim()
    desc = desc.charAt(0).toUpperCase() + desc.slice(1)
    const price = parseFloat(match[3]) || 0

    if (desc.length > 1 && !/^(para|con|fecha|iva)/i.test(desc)) {
      items.push({
        id: Date.now() + Math.random(),
        description: desc,
        quantity: String(qty),
        unitPrice: String(price),
      })
    }
  }

  // Si no encontró con el patrón anterior, intentar separar por comas o saltos de línea
  if (items.length === 0) {
    const lines = clean.split(/[\n,;]+/)
    for (const line of lines) {
      const lineMatch = line.match(/(?:(\d+)\s+)?(.+?)\s+(?:a|\$|por)\s+(\d+(?:\.\d+)?)/i)
      if (lineMatch) {
        const qty = lineMatch[1] ? parseFloat(lineMatch[1]) : 1
        const desc = lineMatch[2].replace(/(?:facturar|agregar|item|para)\s+/gi, '').trim()
        const price = parseFloat(lineMatch[3]) || 0
        if (desc.length > 2) {
          items.push({
            id: Date.now() + Math.random(),
            description: desc.charAt(0).toUpperCase() + desc.slice(1),
            quantity: String(qty),
            unitPrice: String(price),
          })
        }
      }
    }
  }

  if (items.length > 0) {
    result.items = items
  } else {
    // Si no detectó ítems específicos, dejar al menos uno con lo que se deduzca
    result.items = [
      {
        id: Date.now(),
        description: clean.length < 50 ? clean : 'Servicio profesional',
        quantity: '1',
        unitPrice: '100',
      },
    ]
  }

  return result
}

/**
 * Parsea el texto a factura usando Gemini si está disponible, o el motor local
 */
export const parseInvoiceWithAi = async (text) => {
  const apiKey = getGeminiApiKey()
  if (apiKey) {
    try {
      const prompt = `Analiza el siguiente texto y extrae los datos para emitir una factura.
Devuelve EXCLUSIVAMENTE un JSON válido sin markdown ni comillas invertidas, con esta estructura exacta:
{
  "clientName": "string o vacío",
  "clientTaxId": "string o vacío",
  "clientContact": "string o vacío",
  "taxRate": "número como string, ej '13'",
  "items": [
    {
      "description": "descripción del ítem",
      "quantity": "número como string, ej '2'",
      "unitPrice": "número como string, ej '150'"
    }
  ]
}

Texto a analizar:
"${text}"`

      const raw = await callGeminiApi(prompt, 'Eres un asistente experto en facturación electrónica y extracción estructurada de datos.')
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return {
          clientName: parsed.clientName || '',
          clientTaxId: parsed.clientTaxId || '',
          clientContact: parsed.clientContact || '',
          taxRate: parsed.taxRate || '13',
          items: parsed.items.map((item) => ({
            id: Date.now() + Math.random(),
            description: item.description || 'Ítem',
            quantity: String(item.quantity || 1),
            unitPrice: String(item.unitPrice || 0),
          })),
        }
      }
    } catch {
      // Fallback transparente al motor local si Gemini falla
    }
  }

  return parseInvoiceFromTextLocal(text)
}

/**
 * Procesa comandos de conversación y consultas sobre el sistema (Copiloto)
 */
export const processCopilotMessage = async ({ query, invoices }) => {
  const q = query.trim().toLowerCase()

  // Métricas base
  const totalInvoices = invoices.length
  const totalBilled = invoices.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0)
  const emitidas = invoices.filter((i) => i.status === 'emitida')
  const pagadas = invoices.filter((i) => i.status === 'pagada')
  const anuladas = invoices.filter((i) => i.status === 'anulada')

  const totalEmitidas = emitidas.reduce((sum, i) => sum + getInvoiceTotal(i), 0)
  const totalPagadas = pagadas.reduce((sum, i) => sum + getInvoiceTotal(i), 0)

  // Cliente top
  const clientTotals = {}
  invoices.forEach((inv) => {
    clientTotals[inv.client.name] = (clientTotals[inv.client.name] || 0) + getInvoiceTotal(inv)
  })
  const topClients = Object.entries(clientTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
  const topClient = topClients[0] || { name: 'N/A', total: 0 }

  // 1. Intención de crear/facturar con lenguaje natural
  if (
    q.startsWith('crea') ||
    q.startsWith('crear') ||
    q.startsWith('factura') ||
    q.startsWith('facturar') ||
    q.includes('nueva factura') ||
    q.includes('haz una factura') ||
    q.includes('emite una factura')
  ) {
    const extracted = await parseInvoiceWithAi(query)
    return {
      type: 'INVOICE_PROPOSAL',
      text: `He preparado los datos de la factura con base en tu solicitud para **${extracted.clientName || 'Cliente nuevo'}**:`,
      data: extracted,
      actions: [
        { label: '⚡ Cargar en formulario', action: 'FILL_FORM', payload: extracted },
        { label: 'Ir a Nueva Factura', action: 'NAVIGATE', payload: 'new' },
      ],
    }
  }

  // 2. Intención de navegación
  if (q.includes('dashboard') || q.includes('inicio') || q.includes('resumen')) {
    return {
      type: 'NAVIGATION',
      text: 'Te dirijo al **Dashboard** principal para ver el panorama general.',
      actions: [{ label: 'Abrir Dashboard', action: 'NAVIGATE', payload: 'dashboard' }],
    }
  }

  if (q.includes('ir a facturas') || q.includes('ver facturas') || q.includes('lista')) {
    return {
      type: 'NAVIGATION',
      text: 'Aquí puedes revisar el listado completo de facturas registradas.',
      actions: [{ label: 'Ver facturas', action: 'NAVIGATE', payload: 'list' }],
    }
  }

  // 3. Intención de consultas de cobros pendientes (cuentas por cobrar)
  if (
    q.includes('pendiente') ||
    q.includes('por cobrar') ||
    q.includes('emitida') ||
    q.includes('cobrar') ||
    q.includes('deben')
  ) {
    const clientList = emitidas.map((i) => `• **${i.invoiceNumber}** - ${i.client.name}: ${formatMoney(getInvoiceTotal(i))}`).join('\n')
    return {
      type: 'ANALYTICS',
      text: `Tienes **${emitidas.length} facturas pendientes de cobro** por un total de **${formatMoney(totalEmitidas)}**:\n\n${clientList || 'No hay facturas pendientes en este momento.'}`,
      actions: [
        { label: 'Filtrar facturas pendientes', action: 'FILTER_STATUS', payload: 'emitida' },
      ],
    }
  }

  // 4. Consultas sobre el mejor cliente
  if (q.includes('mejor cliente') || q.includes('top cliente') || q.includes('quien compra mas') || q.includes('mayor facturacion')) {
    return {
      type: 'ANALYTICS',
      text: `Tu cliente principal es **${topClient.name}** con una facturación acumulada de **${formatMoney(topClient.total)}**.\n\nLos 3 principales clientes representan el **${Math.round(((topClients.slice(0, 3).reduce((s, c) => s + c.total, 0)) / (totalBilled || 1)) * 100)}%** de tus ingresos totales.`,
      actions: [
        { label: `Ver facturas de ${topClient.name}`, action: 'FILTER_CLIENT', payload: topClient.name },
      ],
    }
  }

  // 5. Total facturado y métricas generales
  if (q.includes('total') || q.includes('cuanto hemos facturado') || q.includes('ingresos') || q.includes('metrica')) {
    const promedio = totalInvoices > 0 ? totalBilled / totalInvoices : 0
    return {
      type: 'ANALYTICS',
      text: `**Resumen de Facturación General:**\n\n` +
        `• **Total Facturado:** ${formatMoney(totalBilled)} (${totalInvoices} facturas)\n` +
        `• **Cobrado (Pagadas):** ${formatMoney(totalPagadas)} (${pagadas.length})\n` +
        `• **Por Cobrar (Emitidas):** ${formatMoney(totalEmitidas)} (${emitidas.length})\n` +
        `• **Ticket Promedio:** ${formatMoney(promedio)}\n` +
        `• **Anuladas:** ${anuladas.length}`,
      actions: [{ label: 'Ir al Dashboard', action: 'NAVIGATE', payload: 'dashboard' }],
    }
  }

  // 6. Consultas a Gemini si está conectado para preguntas abiertas y complejas
  const apiKey = getGeminiApiKey()
  if (apiKey) {
    try {
      const systemPrompt = `Eres el asistente inteligente de un sistema de facturación electrónica.
Tienes acceso a estos datos actuales en tiempo real:
- Total facturas: ${totalInvoices}
- Facturado total: ${formatMoney(totalBilled)}
- Pendiente de cobro (emitidas): ${formatMoney(totalEmitidas)} en ${emitidas.length} facturas
- Cobrado (pagadas): ${formatMoney(totalPagadas)} en ${pagadas.length} facturas
- Anuladas: ${anuladas.length}
- Cliente principal: ${topClient.name} (${formatMoney(topClient.total)})
- Facturas recientes: ${invoices.slice(-5).map((i) => `${i.invoiceNumber} (${i.client.name}: ${formatMoney(getInvoiceTotal(i))}, estado: ${i.status})`).join(', ')}

Responde de manera concisa, profesional, amable y orientada a la acción en español.`

      const geminiReply = await callGeminiApi(query, systemPrompt)
      return {
        type: 'AI_CHAT',
        text: geminiReply,
        actions: [],
      }
    } catch {
      // Continuar con respuesta local guiada
    }
  }

  // Respuesta por defecto con opciones
  return {
    type: 'HELP',
    text: `Hola, soy tu **Copiloto de Facturación**. Puedo ayudarte a agilizar tus tareas diarias:\n\n` +
      `• **Crear facturas rápido:** *"Facturar a Juan Pérez 2 laptops a 800"*\n` +
      `• **Consultar cobros:** *"¿Cuánto tenemos pendiente de cobro?"*\n` +
      `• **Analizar clientes:** *"¿Quién es el mejor cliente?"*\n` +
      `• **Métricas generales:** *"Resumen financiero total"*`,
    actions: [
      { label: '📊 Resumen general', action: 'NAVIGATE', payload: 'dashboard' },
      { label: '⏳ Ver facturas por cobrar', action: 'FILTER_STATUS', payload: 'emitida' },
      { label: '⚡ Nueva factura', action: 'NAVIGATE', payload: 'new' },
    ],
  }
}

/**
 * Generador de recordatorios de cobro con IA
 */
export const generatePaymentReminder = ({ invoice, tone = 'amable' }) => {
  const total = formatMoney(getInvoiceTotal(invoice))
  const clientName = invoice.client.name
  const invNumber = invoice.invoiceNumber
  const issuerName = invoice.issuer?.name || 'nuestro equipo'
  const date = invoice.date

  if (tone === 'amable') {
    return {
      subject: `Recordatorio cordial: Factura ${invNumber} - ${issuerName}`,
      message: `Hola ${clientName}, esperamos que te encuentres muy bien.\n\nTe escribimos de parte de ${issuerName} para compartirte un recordatorio amistoso sobre la factura *${invNumber}* emitida el ${date} por un valor de *${total}*.\n\nSi ya realizaste el pago, por favor haznos llegar el comprobante para registrarlo de inmediato. Si tienes alguna duda sobre el detalle o requieres nuestros datos bancarios, con todo gusto estamos a tu disposición.\n\n¡Muchas gracias por tu confianza!`,
    }
  }

  if (tone === 'profesional') {
    return {
      subject: `Estado de cuenta: Factura pendiente ${invNumber} - ${issuerName}`,
      message: `Estimado(a) ${clientName},\n\nLe saludamos cordialmente de ${issuerName}.\n\nPor medio del presente le informamos que la factura número *${invNumber}* con fecha de emisión ${date}, correspondiente a un monto de *${total}*, figura como pendiente de pago en nuestro sistema.\n\nLe solicitamos amablemente confirmar la fecha estimada de cancelación o remitir el comprobante de transferencia a este medio.\n\nQuedamos a su disposición ante cualquier requerimiento administrativo.\n\nAtentamente,\n${issuerName}`,
    }
  }

  // Tono urgente / vencido
  return {
    subject: `AVISO IMPORTANTE: Factura pendiente de cancelación ${invNumber} - ${issuerName}`,
    message: `Estimado(a) ${clientName},\n\nNos comunicamos de manera urgente respecto a la factura *${invNumber}* emitida el ${date} por un importe de *${total}*, la cual presenta saldo pendiente a la fecha.\n\nLe solicitamos regularizar este pago a la brevedad para evitar retrasos en sus servicios o recargos administrativos.\n\nFavor enviar el comprobante de pago tan pronto se efectúe la transacción.\n\nAgradecemos su pronta atención a este mensaje.\n\nDepartamento de Cobranzas,\n${issuerName}`,
  }
}

/**
 * Generador de diagnósticos y recomendaciones financieras para el Dashboard
 */
export const generateFinancialAudit = (invoices) => {
  const totalInvoices = invoices.length
  const totalBilled = invoices.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0)
  const vigentes = invoices.filter((i) => i.status !== 'anulada')
  const emitidas = invoices.filter((i) => i.status === 'emitida')
  const pagadas = invoices.filter((i) => i.status === 'pagada')
  const anuladas = invoices.filter((i) => i.status === 'anulada')

  const totalEmitidas = emitidas.reduce((sum, i) => sum + getInvoiceTotal(i), 0)
  const totalPagadas = pagadas.reduce((sum, i) => sum + getInvoiceTotal(i), 0)
  const unpaidRatio = totalBilled > 0 ? (totalEmitidas / totalBilled) * 100 : 0

  // Concentración de clientes
  const clientTotals = {}
  vigentes.forEach((inv) => {
    clientTotals[inv.client.name] = (clientTotals[inv.client.name] || 0) + getInvoiceTotal(inv)
  })
  const sortedClients = Object.entries(clientTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)

  const topClient = sortedClients[0] || { name: 'N/A', total: 0 }
  const topClientShare = totalBilled > 0 ? (topClient.total / totalBilled) * 100 : 0

  const insights = []

  // Insight 1: Liquidez y cobranza
  if (unpaidRatio > 35) {
    insights.push({
      level: 'warning',
      title: 'Alto volumen en Cuentas por Cobrar',
      text: `El ${Math.round(unpaidRatio)}% de la facturación (${formatMoney(totalEmitidas)}) está aún pendiente de pago. Se sugiere activar recordatorios automatizados de cobro.`,
      action: 'Enviar recordatorios',
    })
  } else {
    insights.push({
      level: 'success',
      title: 'Excelente índice de recaudo',
      text: `El ${Math.round(100 - unpaidRatio)}% de tus ingresos ya ha sido cobrado con éxito. La liquidez de caja es saludable.`,
      action: 'Ver pagos',
    })
  }

  // Insight 2: Concentración de riesgo
  if (topClientShare > 30) {
    insights.push({
      level: 'warning',
      title: `Concentración en cliente ${topClient.name}`,
      text: `${topClient.name} representa el ${Math.round(topClientShare)}% de tus ingresos totales. Diversificar la cartera mitigará riesgos de dependencia financiera.`,
      action: 'Diversificar',
    })
  } else {
    insights.push({
      level: 'info',
      title: 'Cartera de clientes equilibrada',
      text: `Los ingresos están distribuidos adecuadamente entre varios clientes, con un riesgo de concentración bajo.`,
      action: 'Ver clientes',
    })
  }

  // Insight 3: Facturas anuladas
  const anuladaRatio = totalInvoices > 0 ? (anuladas.length / totalInvoices) * 100 : 0
  if (anuladaRatio > 15) {
    insights.push({
      level: 'warning',
      title: 'Tasa elevada de facturas anuladas',
      text: `Un ${Math.round(anuladaRatio)}% de las facturas generadas fueron anuladas. Revisa la validación previa de datos fiscales para evitar refacturaciones.`,
      action: 'Revisar anulación',
    })
  } else {
    insights.push({
      level: 'success',
      title: 'Emisión operativa estable',
      text: `Menos del ${Math.round(anuladaRatio || 5)}% de facturas han sido anuladas, indicando un proceso de venta y facturación ordenado.`,
      action: 'Optimizado',
    })
  }

  return {
    healthScore: Math.max(50, Math.min(98, Math.round(100 - unpaidRatio * 0.4 - anuladaRatio * 0.5))),
    totalEmitidas,
    totalPagadas,
    unpaidRatio: Math.round(unpaidRatio),
    topClientShare: Math.round(topClientShare),
    topClientName: topClient.name,
    insights,
  }
}
