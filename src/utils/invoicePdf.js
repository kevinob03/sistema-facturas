import { TAX_RATE, formatMoney, getLineTotal, getSubtotal, getTax, getTotal } from './invoiceCalculator'

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const openInvoicePdf = (invoice) => {
  const taxRate = Number.isFinite(Number(invoice.taxRate)) ? Number(invoice.taxRate) : TAX_RATE
  const subtotal = getSubtotal(invoice.items)
  const tax = getTax(subtotal, taxRate)
  const total = getTotal(subtotal, tax)
  const taxPercent = Math.round(taxRate * 100)
  const rows = invoice.items.map((item) => `<tr><td>${escapeHtml(item.description)}</td><td class="number">${escapeHtml(item.quantity)}</td><td class="number">${formatMoney(item.unitPrice)}</td><td class="number">${formatMoney(getLineTotal(item))}</td></tr>`).join('')
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura ${escapeHtml(invoice.invoiceNumber)}</title><style>
    @page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;color:#0c1b2a;font:12px/1.45 Arial,sans-serif}.document{max-width:178mm;margin:0 auto}header{display:flex;justify-content:space-between;gap:24px;padding-bottom:14px;border-bottom:2px solid #1d4ed8}h1{margin:0 0 4px;font-size:20px}h2{margin:0;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#475569}p{margin:2px 0}.meta{text-align:right}.tag{display:inline-block;margin-bottom:6px;padding:3px 7px;background:#dbe6ff;color:#1d4ed8;font-size:10px;font-weight:700}.mono,.number{font-family:Consolas,'Liberation Mono',monospace;font-variant-numeric:tabular-nums}.parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:18px 0}.client{padding-left:20px;border-left:1px solid #cbd5e1}table{width:100%;border-collapse:collapse;margin-top:4px}th{padding:8px;background:#e6edf7;border:1px solid #cbd5e1;color:#475569;font-size:10px;text-align:left;text-transform:uppercase}td{padding:8px;border-bottom:1px solid #d7e0ea;vertical-align:top}.number{text-align:right;white-space:nowrap}.summary{width:68mm;margin:18px 0 0 auto;border:1px solid #cbd5e1}.summary div{display:flex;justify-content:space-between;gap:10px;padding:7px 9px}.summary .total{background:#e6edf7;border-top:1px solid #cbd5e1;font-size:14px;font-weight:700}footer{margin-top:22px;padding-top:10px;border-top:1px solid #cbd5e1;color:#64748b;font-size:10px}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><main class="document"><header><div><h1>${escapeHtml(invoice.issuer.name)}</h1><p>Identificación fiscal: <span class="mono">${escapeHtml(invoice.issuer.taxId)}</span></p></div><div class="meta"><span class="tag">FACTURA ${escapeHtml(invoice.status).toUpperCase()}</span><p>Número: <strong class="mono">${escapeHtml(invoice.invoiceNumber)}</strong></p><p>Fecha: <strong class="mono">${escapeHtml(invoice.date)}</strong></p></div></header><section class="parties"><div><h2>Emisor</h2><p>${escapeHtml(invoice.issuer.name)}</p><p class="mono">${escapeHtml(invoice.issuer.taxId)}</p></div><div class="client"><h2>Facturado a</h2><p><strong>${escapeHtml(invoice.client.name)}</strong></p>${invoice.client.taxId ? `<p class="mono">${escapeHtml(invoice.client.taxId)}</p>` : ''}<p>${escapeHtml(invoice.client.contact)}</p></div></section><table><thead><tr><th>Descripción</th><th class="number">Cantidad</th><th class="number">Precio unitario</th><th class="number">Importe</th></tr></thead><tbody>${rows}</tbody></table><section class="summary"><div><span>Subtotal</span><strong class="mono">${formatMoney(subtotal)}</strong></div><div><span>Impuesto (${taxPercent}%)</span><strong class="mono">${formatMoney(tax)}</strong></div><div class="total"><span>Total</span><strong class="mono">${formatMoney(total)}</strong></div></section><footer>Documento generado desde Sistema de Facturas.</footer></main></body></html>`)
  printWindow.document.close()
  printWindow.opener = null
  let printed = false
  const printInvoice = () => {
    if (printed) return
    printed = true
    printWindow.focus()
    printWindow.print()
  }
  printWindow.addEventListener('load', printInvoice, { once: true })
  window.setTimeout(printInvoice, 500)
  return true
}